"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extraTools = exports.readSchemas = void 0;
exports.extraRead = extraRead;
const zod_1 = require("zod");
const json_store_1 = require("../services/json-store");
const purchasing_service_1 = require("../services/purchasing.service");
const text = zod_1.z.string().max(200);
const period = { from: zod_1.z.iso.date().nullable(), to: zod_1.z.iso.date().nullable() };
exports.readSchemas = {
    search_machines: zod_1.z.object({ query: text }).strict(),
    search_stock: zod_1.z.object({ query: text, lowStockOnly: zod_1.z.boolean() }).strict(),
    list_interventions: zod_1.z.object({ machine: text.nullable(), status: text.nullable(), technician: text.nullable() }).strict(),
    list_maintenance: zod_1.z.object({ machine: text.nullable(), overdueOnly: zod_1.z.boolean() }).strict(),
    list_technicians: zod_1.z.object({}).strict(), get_statistics: zod_1.z.object({}).strict(),
    get_daily_summary: zod_1.z.object({ date: zod_1.z.iso.date() }).strict(),
    get_unavailable_machines: zod_1.z.object({}).strict(),
    get_failures: zod_1.z.object({ machine: text, ...period }).strict(),
    get_maintenance_period: zod_1.z.object({ machine: text, ...period }).strict(),
    get_interventions_period: zod_1.z.object({ machine: text, ...period }).strict(),
    get_suppliers: zod_1.z.object({ query: text }).strict(),
    get_supplier_for_component: zod_1.z.object({ component: text.min(1) }).strict(),
    get_orders: zod_1.z.object({ query: text, status: text, ...period }).strict(),
};
const extras = {
    get_unavailable_machines: ['Liste exhaustive des machines actuellement en panne ou hors service selon leur statut machine réel.', exports.readSchemas.get_unavailable_machines],
    get_failures: ['Interventions correctives enregistrées (indicateur de pannes), total et classement par machine pour une période.', exports.readSchemas.get_failures],
    get_maintenance_period: ['Maintenance prévue entre deux dates incluses.', exports.readSchemas.get_maintenance_period],
    get_interventions_period: ['Interventions par date de création, triées de la plus récente à la plus ancienne.', exports.readSchemas.get_interventions_period],
    get_suppliers: ['Coordonnées fournisseur réelles, recherche par nom, code ou identifiant.', exports.readSchemas.get_suppliers],
    get_supplier_for_component: ['Composant, stock, référence produit, prix et fournisseur explicitement associé.', exports.readSchemas.get_supplier_for_component],
    get_orders: ['Historique des demandes de commande/devis, les plus récentes en premier. Vide signifie aucun historique enregistré.', exports.readSchemas.get_orders],
    prepare_purchase: ['Prépare commande, réapprovisionnement ou devis et email. Enregistrement après confirmation, aucun envoi.', purchasing_service_1.purchaseSchema],
    create_supplier: ['Prépare un fournisseur avec les seules données explicitement fournies.', zod_1.z.object({ name: text.min(1), code: text.min(1), email: zod_1.z.email().nullable(), phone: text.nullable(), address: text.nullable(), domain: text.nullable() }).strict()],
    update_order_status: ['Prépare le statut d’une demande, sans modifier le stock ni envoyer de message.', zod_1.z.object({ order: text.min(1), status: zod_1.z.enum(['En attente', 'Approuvée', 'Reçue', 'Annulée']) }).strict()],
};
exports.extraTools = Object.entries(extras).map(([name, [description, schema]]) => ({ type: 'function', name, description, strict: true, parameters: zod_1.z.toJSONSchema(schema) }));
const matches = (row, q, fields) => fields.some(f => String(row[f] ?? '').toLocaleLowerCase('fr').includes(q.toLocaleLowerCase('fr')));
function extraRead(name, args) {
    if (name === 'get_unavailable_machines') {
        const down = new Set(['hors service', 'en panne', 'ne marche pas', 'hors service définitif']);
        return (0, json_store_1.readEntity)('machines').filter(machine => down.has(String(machine.status || '').trim().toLocaleLowerCase('fr')));
    }
    if (name === 'get_supplier_for_component')
        return (0, purchasing_service_1.componentSupplier)(args.component);
    if (name === 'get_suppliers')
        return (0, purchasing_service_1.suppliers)().filter(s => matches(s, args.query, ['id', 'code', 'name', 'domain']));
    const within = (d) => (!args.from || !!d && d.slice(0, 10) >= args.from) && (!args.to || !!d && d.slice(0, 10) <= args.to);
    if (args.from && args.to && args.from > args.to)
        throw new Error('Période invalide.');
    if (name === 'get_orders')
        return (0, json_store_1.readEntity)('orders').filter(o => matches(o, args.query, ['id', 'reference', 'componentName', 'componentReference', 'supplierName']) && (!args.status || o.status === args.status) && within(o.createdAt)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (name === 'get_maintenance_period')
        return (0, json_store_1.readEntity)('preventif').filter(m => matches(m, args.machine, ['fl_id', 'equipement']) && within(m.prochaineEcheance));
    if (name === 'get_failures' || name === 'get_interventions_period') {
        const all = (0, json_store_1.readEntity)('interventions').filter(i => matches(i, args.machine, ['equipmentId', 'equipmentName']) && (name !== 'get_failures' || i.maintenanceType === 'Corrective'));
        const rows = all.filter(i => within(i.creationDate)).sort((a, b) => String(b.creationDate).localeCompare(String(a.creationDate)));
        const counts = new Map();
        rows.forEach(i => counts.set(i.equipmentId, (counts.get(i.equipmentId) || 0) + 1));
        return { total: rows.length, missingDates: all.filter(i => !i.creationDate).length, basis: 'Interventions enregistrées, date de création ; pas un registre exhaustif de pannes.', ranking: [...counts].sort((a, b) => b[1] - a[1]).map(([machine, count]) => ({ machine, count })), items: rows };
    }
    throw new Error('Outil inconnu.');
}
