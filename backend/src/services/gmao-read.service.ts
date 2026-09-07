import { readEntity } from './json-store';
type JsonRecord = Record<string, any>;
const normalize = (value: unknown) => String(value ?? '').toLocaleLowerCase('fr');
const matches = (record: JsonRecord, query: string, fields: string[]) => fields.some((field) => normalize(record[field]).includes(normalize(query)));

export function legacyReadTool(name: string, args: JsonRecord): unknown {
  if (name === 'search_machines') {
    return readEntity<JsonRecord[]>('machines').filter((record) => matches(record, args.query, ['id', 'reference', 'name', 'designation', 'atelier', 'category', 'status']));
  }
  if (name === 'search_stock') {
    return readEntity<JsonRecord[]>('stock').filter((record) => matches(record, args.query, ['id', 'reference', 'name', 'category', 'equipement', 'supplier']) && (!args.lowStockOnly || Number(record.quantity) <= Number(record.min)));
  }
  if (name === 'list_interventions') {
    return readEntity<JsonRecord[]>('interventions').filter((record) => (!args.machine || matches(record, args.machine, ['equipmentId', 'equipmentName'])) && (!args.status || normalize(record.status).includes(normalize(args.status))) && (!args.technician || normalize(record.technician).includes(normalize(args.technician))));
  }
  if (name === 'list_maintenance') {
    const today = new Date().toISOString().slice(0, 10);
    return readEntity<JsonRecord[]>('preventif').filter((record) => (!args.machine || matches(record, args.machine, ['fl_id', 'equipement'])) && (!args.overdueOnly || (record.prochaineEcheance && record.prochaineEcheance < today && record.statut !== 'Terminé')));
  }
  if (name === 'list_technicians') {
    return readEntity<JsonRecord[]>('users').filter((record) => record.status === 'Actif' && ['Technicien', 'Ingénieur', 'Superviseur'].includes(record.role)).map(({ id, name, email, role, status }) => ({ id, name, email, role, status }));
  }
  if (name === 'get_statistics') return statistics();
  if (name === 'get_daily_summary') return dailySummary(args.date);
  throw new Error(`Outil de lecture inconnu : ${name}`);
}

function statistics() {
  const machines = readEntity<JsonRecord[]>('machines');
  const stock = readEntity<JsonRecord[]>('stock');
  const interventions = readEntity<JsonRecord[]>('interventions');
  const preventive = readEntity<JsonRecord[]>('preventif');
  const downStatuses = ['hors service', 'en panne', 'ne marche pas'];
  const byStatus = (records: JsonRecord[], field: string) => records.reduce<Record<string, number>>((acc, record) => { const key = String(record[field] || 'Non renseigné'); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  return {
    generatedAt: new Date().toISOString(),
    machines: { total: machines.length, byStatus: byStatus(machines, 'status'), unavailable: machines.filter((m) => downStatuses.includes(normalize(m.status))).length },
    stock: { references: stock.length, lowOrOut: stock.filter((item) => Number(item.quantity) <= Number(item.min)).length, outOfStock: stock.filter((item) => Number(item.quantity) === 0).length, totalValueMAD: stock.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCostMAD || item.priceMAD || 0), 0) },
    interventions: { total: interventions.length, byStatus: byStatus(interventions, 'status'), totalCostMAD: interventions.reduce((sum, item) => sum + Number(item.totalCostMAD || 0), 0) },
    preventive: { total: preventive.length, byStatus: byStatus(preventive, 'statut') },
  };
}

function dailySummary(date: string) {
  const machines = readEntity<JsonRecord[]>('machines');
  const stock = readEntity<JsonRecord[]>('stock');
  const interventions = readEntity<JsonRecord[]>('interventions');
  const preventive = readEntity<JsonRecord[]>('preventif');
  return {
    date,
    interventionsCreated: interventions.filter((item) => item.creationDate === date),
    interventionsPlanned: interventions.filter((item) => item.plannedDate === date),
    interventionsCompleted: interventions.filter((item) => (item.endDate || '').startsWith(date) || (item.updatedAt || '').startsWith(date) && normalize(item.status).includes('termin')),
    maintenanceDue: preventive.filter((item) => item.prochaineEcheance === date),
    unavailableMachines: machines.filter((item) => ['hors service', 'en panne', 'ne marche pas'].includes(normalize(item.status))),
    stockAlerts: stock.filter((item) => Number(item.quantity) <= Number(item.min)),
  };
}

