"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchEntity = matchEntity;
exports.legacyReadTool = legacyReadTool;
const json_store_1 = require("./json-store");
function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function normalize(value) {
    return stripAccents(String(value ?? '').trim().toLowerCase()).replace(/\s+/g, ' ');
}
function matchEntity(record, query, fields) {
    if (!query || !query.trim())
        return true;
    const q = normalize(query);
    const refMatch = query.match(/\b(FL-[A-Z0-9-]+|PR-[0-9]+|OT-[A-Z0-9-]+)\b/i);
    if (refMatch) {
        const targetRef = normalize(refMatch[0]);
        if (normalize(record.reference) === targetRef ||
            normalize(record.id) === targetRef ||
            normalize(record.otNumber) === targetRef ||
            normalize(record.codeArborescence).includes(targetRef)) {
            return true;
        }
    }
    if (fields.some(f => {
        const val = normalize(record[f]);
        if (!val)
            return false;
        if (val.includes(q))
            return true;
        if ((f === 'reference' || f === 'id' || f === 'otNumber') && val.length >= 3 && q.includes(val))
            return true;
        return false;
    })) {
        return true;
    }
    const stopWords = new Set(['pour', 'cette', 'machine', 'les', 'des', 'dans', 'sur', 'une', 'avec', 'actuellement', 'donne', 'moi', 'informations', 'cree', 'fais', 'intervention', 'statut']);
    const words = q.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
    if (words.length > 0) {
        const fullText = normalize(fields.map(f => record[f]).join(' '));
        return words.some(w => fullText.includes(w));
    }
    return false;
}
const matches = (record, query, fields) => matchEntity(record, query, fields);
function legacyReadTool(name, args) {
    if (name === 'search_machines') {
        return (0, json_store_1.readEntity)('machines').filter((record) => matchEntity(record, args.query, ['id', 'reference', 'name', 'designation', 'atelier', 'category', 'status', 'codeArborescence']));
    }
    if (name === 'search_stock') {
        return (0, json_store_1.readEntity)('stock').filter((record) => matches(record, args.query, ['id', 'reference', 'name', 'category', 'equipement', 'supplier']) && (!args.lowStockOnly || Number(record.quantity) <= Number(record.min)));
    }
    if (name === 'list_interventions') {
        return (0, json_store_1.readEntity)('interventions').filter((record) => (!args.machine || matches(record, args.machine, ['equipmentId', 'equipmentName'])) && (!args.status || normalize(record.status).includes(normalize(args.status))) && (!args.technician || normalize(record.technician).includes(normalize(args.technician))));
    }
    if (name === 'list_maintenance') {
        const today = new Date().toISOString().slice(0, 10);
        return (0, json_store_1.readEntity)('preventif').filter((record) => (!args.machine || matches(record, args.machine, ['fl_id', 'equipement'])) && (!args.overdueOnly || (record.prochaineEcheance && record.prochaineEcheance < today && record.statut !== 'Terminé')));
    }
    if (name === 'list_technicians') {
        return (0, json_store_1.readEntity)('users').filter((record) => record.status === 'Actif' && ['Technicien', 'Ingénieur', 'Superviseur'].includes(record.role)).map(({ id, name, email, role, status }) => ({ id, name, email, role, status }));
    }
    if (name === 'get_statistics')
        return statistics();
    if (name === 'get_daily_summary')
        return dailySummary(args.date);
    throw new Error(`Outil de lecture inconnu : ${name}`);
}
function statistics() {
    const machines = (0, json_store_1.readEntity)('machines');
    const stock = (0, json_store_1.readEntity)('stock');
    const interventions = (0, json_store_1.readEntity)('interventions');
    const preventive = (0, json_store_1.readEntity)('preventif');
    const downStatuses = ['hors service', 'en panne', 'ne marche pas'];
    const byStatus = (records, field) => records.reduce((acc, record) => { const key = String(record[field] || 'Non renseigné'); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    return {
        generatedAt: new Date().toISOString(),
        machines: { total: machines.length, byStatus: byStatus(machines, 'status'), unavailable: machines.filter((m) => downStatuses.includes(normalize(m.status))).length },
        stock: { references: stock.length, lowOrOut: stock.filter((item) => Number(item.quantity) <= Number(item.min)).length, outOfStock: stock.filter((item) => Number(item.quantity) === 0).length, totalValueMAD: stock.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCostMAD || item.priceMAD || 0), 0) },
        interventions: { total: interventions.length, byStatus: byStatus(interventions, 'status'), totalCostMAD: interventions.reduce((sum, item) => sum + Number(item.totalCostMAD || 0), 0) },
        preventive: { total: preventive.length, byStatus: byStatus(preventive, 'statut') },
    };
}
function dailySummary(date) {
    const machines = (0, json_store_1.readEntity)('machines');
    const stock = (0, json_store_1.readEntity)('stock');
    const interventions = (0, json_store_1.readEntity)('interventions');
    const preventive = (0, json_store_1.readEntity)('preventif');
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
