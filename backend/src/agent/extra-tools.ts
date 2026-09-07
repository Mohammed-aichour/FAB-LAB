import { z } from 'zod';
import { readEntity } from '../services/json-store';
import { componentSupplier, suppliers, purchaseSchema } from '../services/purchasing.service';
const text = z.string().max(200);
const period = { from: z.iso.date().nullable(), to: z.iso.date().nullable() };
export const readSchemas = {
  search_machines: z.object({ query: text }).strict(),
  search_stock: z.object({ query: text, lowStockOnly: z.boolean() }).strict(),
  list_interventions: z.object({ machine: text.nullable(), status: text.nullable(), technician: text.nullable() }).strict(),
  list_maintenance: z.object({ machine: text.nullable(), overdueOnly: z.boolean() }).strict(),
  list_technicians: z.object({}).strict(), get_statistics: z.object({}).strict(),
  get_daily_summary: z.object({ date: z.iso.date() }).strict(),
  get_unavailable_machines: z.object({}).strict(),
  get_failures: z.object({ machine: text, ...period }).strict(),
  get_maintenance_period: z.object({ machine: text, ...period }).strict(),
  get_interventions_period: z.object({ machine: text, ...period }).strict(),
  get_suppliers: z.object({ query: text }).strict(),
  get_supplier_for_component: z.object({ component: text.min(1) }).strict(),
  get_orders: z.object({ query: text, status: text, ...period }).strict(),
};
const extras = {
  get_unavailable_machines: ['Liste exhaustive des machines actuellement en panne ou hors service selon leur statut machine réel.', readSchemas.get_unavailable_machines],
  get_failures: ['Interventions correctives enregistrées (indicateur de pannes), total et classement par machine pour une période.', readSchemas.get_failures],
  get_maintenance_period: ['Maintenance prévue entre deux dates incluses.', readSchemas.get_maintenance_period],
  get_interventions_period: ['Interventions par date de création, triées de la plus récente à la plus ancienne.', readSchemas.get_interventions_period],
  get_suppliers: ['Coordonnées fournisseur réelles, recherche par nom, code ou identifiant.', readSchemas.get_suppliers],
  get_supplier_for_component: ['Composant, stock, référence produit, prix et fournisseur explicitement associé.', readSchemas.get_supplier_for_component],
  get_orders: ['Historique des demandes de commande/devis, les plus récentes en premier. Vide signifie aucun historique enregistré.', readSchemas.get_orders],
  prepare_purchase: ['Prépare commande, réapprovisionnement ou devis et email. Enregistrement après confirmation, aucun envoi.', purchaseSchema],
  create_supplier: ['Prépare un fournisseur avec les seules données explicitement fournies.', z.object({name:text.min(1),code:text.min(1),email:z.email().nullable(),phone:text.nullable(),address:text.nullable(),domain:text.nullable()}).strict()],
  update_order_status: ['Prépare le statut d’une demande, sans modifier le stock ni envoyer de message.', z.object({order:text.min(1),status:z.enum(['En attente','Approuvée','Reçue','Annulée'])}).strict()],
} as const;
export const extraTools = Object.entries(extras).map(([name,[description,schema]]) => ({ type: 'function', name, description, strict: true, parameters: z.toJSONSchema(schema) }));
const matches = (row: Record<string, any>, q: string, fields: string[]) => fields.some(f => String(row[f] ?? '').toLocaleLowerCase('fr').includes(q.toLocaleLowerCase('fr')));
export function extraRead(name: string, args: any): unknown {
  if (name === 'get_unavailable_machines') {
    const down = new Set(['hors service','en panne','ne marche pas','hors service définitif']);
    return readEntity<any[]>('machines').filter(machine => down.has(String(machine.status || '').trim().toLocaleLowerCase('fr')));
  }
  if (name === 'get_supplier_for_component') return componentSupplier(args.component);
  if (name === 'get_suppliers') return suppliers().filter(s => matches(s,args.query,['id','code','name','domain']));
  const within = (d: string) => (!args.from || !!d && d.slice(0,10) >= args.from) && (!args.to || !!d && d.slice(0,10) <= args.to);
  if (args.from && args.to && args.from > args.to) throw new Error('Période invalide.');
  if (name === 'get_orders') return readEntity<any[]>('orders').filter(o => matches(o,args.query,['id','reference','componentName','componentReference','supplierName']) && (!args.status || o.status === args.status) && within(o.createdAt)).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  if (name === 'get_maintenance_period') return readEntity<any[]>('preventif').filter(m => matches(m,args.machine,['fl_id','equipement']) && within(m.prochaineEcheance));
  if (name === 'get_failures' || name === 'get_interventions_period') {
    const all = readEntity<any[]>('interventions').filter(i => matches(i,args.machine,['equipmentId','equipmentName']) && (name !== 'get_failures' || i.maintenanceType === 'Corrective'));
    const rows = all.filter(i => within(i.creationDate)).sort((a,b) => String(b.creationDate).localeCompare(String(a.creationDate)));
    const counts = new Map<string, number>();
    rows.forEach(i => counts.set(i.equipmentId,(counts.get(i.equipmentId)||0)+1));
    return { total: rows.length, missingDates: all.filter(i => !i.creationDate).length, basis: 'Interventions enregistrées, date de création ; pas un registre exhaustif de pannes.', ranking: [...counts].sort((a,b) => b[1]-a[1]).map(([machine,count]) => ({machine,count})), items: rows };
  }
  throw new Error('Outil inconnu.');
}
