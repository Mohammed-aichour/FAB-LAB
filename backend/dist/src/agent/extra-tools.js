"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extraTools = exports.readSchemas = void 0;
exports.extraRead = extraRead;
const zod_1 = require("zod");
const json_store_1 = require("../services/json-store");
const purchasing_service_1 = require("../services/purchasing.service");
const gmao_read_service_1 = require("../services/gmao-read.service");
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
    get_failure_analysis: zod_1.z.object({ machine: text.nullable() }).strict(),
    get_maintenance_recommendations: zod_1.z.object({ machine: text.nullable(), timeframe: text.nullable() }).strict(),
    get_stock_analysis: zod_1.z.object({}).strict(),
};
const extras = {
    get_unavailable_machines: ['Liste exhaustive des machines actuellement en panne ou hors service selon leur statut machine réel.', exports.readSchemas.get_unavailable_machines],
    get_failures: ['Interventions correctives enregistrées (indicateur de pannes), total et classement par machine pour une période.', exports.readSchemas.get_failures],
    get_maintenance_period: ['Maintenance prévue entre deux dates incluses.', exports.readSchemas.get_maintenance_period],
    get_interventions_period: ['Interventions par date de création, triées de la plus récente à la plus ancienne.', exports.readSchemas.get_interventions_period],
    get_suppliers: ['Coordonnées fournisseur réelles, recherche par nom, code ou identifiant.', exports.readSchemas.get_suppliers],
    get_supplier_for_component: ['Composant, stock, référence produit, prix et fournisseur explicitement associé.', exports.readSchemas.get_supplier_for_component],
    get_orders: ['Historique des demandes de commande/devis, les plus récentes en premier. Vide signifie aucun historique enregistré.', exports.readSchemas.get_orders],
    get_failure_analysis: ['Analyse approfondie des pannes, des machines les plus touchées, des priorités et des tendances.', exports.readSchemas.get_failure_analysis],
    get_maintenance_recommendations: ['Génère un plan et des recommandations de maintenance prioritaires basés sur le statut du parc, les retards préventifs et l’historique.', exports.readSchemas.get_maintenance_recommendations],
    get_stock_analysis: ['Analyse des ruptures de stock, des articles sous le seuil critique et des pièces à commander avec leurs fournisseurs.', exports.readSchemas.get_stock_analysis],
    prepare_purchase: ['Prépare commande, réapprovisionnement ou devis et email. Enregistrement après confirmation, aucun envoi.', purchasing_service_1.purchaseSchema],
    create_supplier: ['Prépare un fournisseur avec les seules données explicitement fournies.', zod_1.z.object({ name: text.min(1), code: text.min(1), email: text.nullable(), phone: text.nullable(), address: text.nullable(), domain: text.nullable() }).strict()],
    update_order_status: ['Prépare le statut d’une demande, sans modifier le stock ni envoyer de message.', zod_1.z.object({ order: text.min(1), status: zod_1.z.enum(['En attente', 'Approuvée', 'Reçue', 'Annulée']) }).strict()],
};
function cleanSchemaForOpenAI(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(cleanSchemaForOpenAI);
    const res = {};
    for (const [k, v] of Object.entries(obj)) {
        if (k === '$schema')
            continue;
        res[k] = cleanSchemaForOpenAI(v);
    }
    if (Array.isArray(res.anyOf) && res.anyOf.length === 2) {
        const nullItem = res.anyOf.find((item) => item && item.type === 'null');
        const typeItem = res.anyOf.find((item) => item && item.type !== 'null');
        if (nullItem && typeItem && typeof typeItem.type === 'string') {
            delete res.anyOf;
            res.type = [typeItem.type, 'null'];
            if (typeItem.enum)
                res.enum = typeItem.enum.filter((e) => e !== null);
            if (typeItem.maxLength)
                res.maxLength = typeItem.maxLength;
            if (typeItem.minLength)
                res.minLength = typeItem.minLength;
            if (typeItem.format)
                res.format = typeItem.format;
            if (typeItem.pattern)
                res.pattern = typeItem.pattern;
            if (typeItem.exclusiveMinimum !== undefined)
                res.exclusiveMinimum = typeItem.exclusiveMinimum;
            if (typeItem.maximum !== undefined)
                res.maximum = typeItem.maximum;
        }
    }
    return res;
}
exports.extraTools = Object.entries(extras).map(([name, [description, schema]]) => {
    const params = cleanSchemaForOpenAI(zod_1.z.toJSONSchema(schema));
    return { type: 'function', name, description, strict: true, parameters: params };
});
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
    if (name === 'get_maintenance_period') {
        const resolvedMachine = args.machine ? (0, gmao_read_service_1.resolveMachine)(args.machine) : null;
        return (0, json_store_1.readEntity)('preventif').filter(m => {
            if (args.machine) {
                if (resolvedMachine) {
                    if (!(0, gmao_read_service_1.matchesMachineRecord)(m, resolvedMachine))
                        return false;
                }
                else {
                    if (!matches(m, args.machine, ['fl_id', 'equipement']))
                        return false;
                }
            }
            return within(m.prochaineEcheance);
        });
    }
    if (name === 'get_failures' || name === 'get_interventions_period') {
        const resolvedMachine = args.machine ? (0, gmao_read_service_1.resolveMachine)(args.machine) : null;
        const all = (0, json_store_1.readEntity)('interventions').filter(i => {
            if (args.machine) {
                if (resolvedMachine) {
                    if (!(0, gmao_read_service_1.matchesMachineRecord)(i, resolvedMachine))
                        return false;
                }
                else {
                    if (!matches(i, args.machine, ['equipmentId', 'equipmentName']))
                        return false;
                }
            }
            return (name !== 'get_failures' || i.maintenanceType === 'Corrective');
        });
        const rows = all.filter(i => within(i.creationDate)).sort((a, b) => String(b.creationDate).localeCompare(String(a.creationDate)));
        const counts = new Map();
        rows.forEach(i => counts.set(i.equipmentId || i.equipmentName, (counts.get(i.equipmentId || i.equipmentName) || 0) + 1));
        return { total: rows.length, missingDates: all.filter(i => !i.creationDate).length, basis: 'Interventions enregistrées, date de création ; pas un registre exhaustif de pannes.', ranking: [...counts].sort((a, b) => b[1] - a[1]).map(([machine, count]) => ({ machine, count })), items: rows };
    }
    if (name === 'get_failure_analysis') {
        const resolvedMachine = args.machine ? (0, gmao_read_service_1.resolveMachine)(args.machine) : null;
        let machines = (0, json_store_1.readEntity)('machines');
        let interventions = (0, json_store_1.readEntity)('interventions').filter(i => i.maintenanceType === 'Corrective');
        if (args.machine) {
            if (resolvedMachine) {
                machines = machines.filter(m => m.id === resolvedMachine.id);
                interventions = interventions.filter(i => (0, gmao_read_service_1.matchesMachineRecord)(i, resolvedMachine));
            }
            else {
                machines = machines.filter(m => matches(m, args.machine, ['id', 'reference', 'name', 'designation']));
                interventions = interventions.filter(i => matches(i, args.machine, ['equipmentId', 'equipmentName']));
            }
        }
        const downStatuses = new Set(['hors service', 'en panne', 'ne marche pas']);
        const unavailable = machines.filter(m => downStatuses.has(String(m.status || '').trim().toLowerCase()));
        const countByMachine = new Map();
        machines.forEach(m => countByMachine.set(m.reference || m.id, { ref: m.reference || m.id, name: m.name, count: 0, open: 0 }));
        interventions.forEach(i => {
            const ref = i.equipmentId || i.equipmentName;
            const existing = countByMachine.get(ref) || { ref, name: i.equipmentName, count: 0, open: 0 };
            existing.count += 1;
            if (!['Terminé', 'Clôturé', 'Annulé'].includes(i.status))
                existing.open += 1;
            countByMachine.set(ref, existing);
        });
        const ranking = [...countByMachine.values()].filter(x => x.count > 0 || x.open > 0).sort((a, b) => b.count - a.count);
        const priorities = { A: interventions.filter(i => i.priority === 'A').length, B: interventions.filter(i => i.priority === 'B').length, C: interventions.filter(i => i.priority === 'C').length };
        return {
            totalFailures: interventions.length,
            unavailableMachinesCount: unavailable.length,
            unavailableMachines: unavailable.map(m => ({ reference: m.reference || m.id, name: m.name, status: m.status, location: m.location })),
            mostAffectedMachine: ranking[0] ? ranking[0].name + ' (' + ranking[0].ref + ')' : 'Aucune',
            failuresByMachine: ranking,
            prioritiesBreakdown: priorities,
            openFailuresCount: interventions.filter(i => !['Terminé', 'Clôturé', 'Annulé'].includes(i.status)).length,
        };
    }
    if (name === 'get_maintenance_recommendations') {
        const resolvedMachine = args.machine ? (0, gmao_read_service_1.resolveMachine)(args.machine) : null;
        let machines = (0, json_store_1.readEntity)('machines');
        let preventif = (0, json_store_1.readEntity)('preventif');
        let interventions = (0, json_store_1.readEntity)('interventions');
        if (args.machine) {
            if (resolvedMachine) {
                machines = machines.filter(m => m.id === resolvedMachine.id);
                preventif = preventif.filter(p => (0, gmao_read_service_1.matchesMachineRecord)(p, resolvedMachine));
                interventions = interventions.filter(i => (0, gmao_read_service_1.matchesMachineRecord)(i, resolvedMachine));
            }
            else {
                machines = machines.filter(m => matches(m, args.machine, ['id', 'reference', 'name', 'designation']));
                preventif = preventif.filter(p => matches(p, args.machine, ['fl_id', 'equipement']));
                interventions = interventions.filter(i => matches(i, args.machine, ['equipmentId', 'equipmentName']));
            }
        }
        const today = new Date().toISOString().slice(0, 10);
        const plan = [];
        // 1. Machines currently down
        machines.filter(m => ['hors service', 'en panne', 'ne marche pas'].includes(String(m.status || '').toLowerCase())).forEach(m => {
            plan.push({
                machine: `${m.name} (${m.reference || m.id})`,
                priority: 'A (Haute)',
                recommendedAction: `Remise en service et diagnostic panne (${m.statusReason || 'Panne signalée'})`,
                reason: `Équipement actuellement ${m.status}`,
                suggestedTiming: 'Immédiat',
            });
        });
        // 2. Overdue or upcoming preventive tasks
        preventif.filter(p => p.prochaineEcheance && p.prochaineEcheance <= today && p.statut !== 'Terminé').forEach(p => {
            plan.push({
                machine: p.equipement || p.fl_id,
                priority: 'B (Moyenne)',
                recommendedAction: p.tache || p.description || 'Maintenance préventive périodique',
                reason: `Échéance préventive dépassée ou due (${p.prochaineEcheance})`,
                suggestedTiming: 'Cette semaine',
            });
        });
        // 3. High criticality machines with open OTs
        interventions.filter(i => !['Terminé', 'Clôturé', 'Annulé'].includes(i.status) && i.priority === 'A').forEach(i => {
            if (!plan.some(p => p.machine.includes(i.equipmentId))) {
                plan.push({
                    machine: `${i.equipmentName} (${i.equipmentId})`,
                    priority: 'A (Haute)',
                    recommendedAction: `Traiter l'OT #${i.otNumber || i.id} : ${i.description}`,
                    reason: 'Intervention urgente en attente',
                    suggestedTiming: 'Immédiat',
                });
            }
        });
        return {
            timeframe: args.timeframe || 'Cette semaine',
            totalRecommendedActions: plan.length,
            proposedPlan: plan,
        };
    }
    if (name === 'get_stock_analysis') {
        const stock = (0, json_store_1.readEntity)('stock');
        const suppliersList = (0, json_store_1.readEntity)('suppliers');
        const lowOrOut = stock.filter(s => Number(s.quantity) <= Number(s.min));
        const outOfStock = stock.filter(s => Number(s.quantity) === 0);
        const ordersToMake = lowOrOut.map(item => {
            const supp = suppliersList.find(s => String(s.name).toLowerCase() === String(item.supplier).toLowerCase());
            const neededQty = Math.max((Number(item.min) * 2) - Number(item.quantity), 1);
            return {
                reference: item.reference || item.id,
                name: item.name,
                currentQuantity: item.quantity,
                minQuantity: item.min,
                unit: item.unit || 'unité(s)',
                suggestedQuantityToOrder: neededQty,
                supplier: item.supplier || 'Non renseigné',
                supplierEmail: supp?.email || null,
            };
        });
        return {
            totalStockReferences: stock.length,
            outOfStockCount: outOfStock.length,
            lowStockCount: lowOrOut.length,
            criticalItems: ordersToMake,
        };
    }
    throw new Error('Outil inconnu.');
}
