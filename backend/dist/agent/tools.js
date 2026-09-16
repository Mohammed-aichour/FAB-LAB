"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tools = void 0;
const strOrNull = (desc) => ({
    anyOf: [
        { type: 'string', ...(desc ? { description: desc } : {}) },
        { type: 'null' }
    ]
});
const functionTool = (name, description, properties, required = []) => ({
    type: 'function', name, description,
    parameters: { type: 'object', properties, required },
});
exports.tools = [
    functionTool('search_machines', 'Recherche l’état ACTUEL des machines par référence, nom, atelier, catégorie ou statut. À utiliser pour « quelles machines sont actuellement en panne ? » avec query « en panne ».', { query: { type: 'string' } }, ['query']),
    functionTool('search_stock', 'Recherche des pièces et composants réels en stock.', { query: { type: 'string' }, lowStockOnly: { type: 'boolean' } }, ['query', 'lowStockOnly']),
    functionTool('list_interventions', 'Liste les interventions et leur statut de traitement. Ne pas utiliser pour déterminer le statut actuel en panne d’une machine.', { machine: strOrNull(), status: strOrNull(), technician: strOrNull() }, ['machine', 'status', 'technician']),
    functionTool('list_maintenance', 'Liste le plan de maintenance préventive réel.', { machine: strOrNull(), overdueOnly: { type: 'boolean' } }, ['machine', 'overdueOnly']),
    functionTool('list_technicians', 'Liste les utilisateurs actifs pouvant être affectés comme techniciens.', {}, []),
    functionTool('get_statistics', 'Calcule les statistiques GMAO à partir des données actuelles.', {}, []),
    functionTool('get_daily_summary', 'Retourne les éléments factuels du résumé d’une journée.', { date: { type: 'string', description: 'Date ISO YYYY-MM-DD' } }, ['date']),
    functionTool('set_machine_status', "Prépare la modification de l'état d'une machine. Nécessite ensuite une confirmation humaine.", {
        machine: { type: 'string' }, status: { type: 'string', enum: ['Opérationnel', 'Hors service', 'En maintenance', 'En Panne', 'Ne marche pas'] }, reason: { type: 'string' },
    }, ['machine', 'status', 'reason']),
    functionTool('declare_failure', 'Prépare une déclaration de panne avec création d’une intervention corrective et d’une alerte.', {
        machine: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string', enum: ['A', 'B', 'C'] },
    }, ['machine', 'description', 'priority']),
    functionTool('create_intervention', 'Prépare la création d’une intervention. Seule la machine est obligatoire. Si la description est omise, une description générique appropriée est attribuée.', {
        machine: { type: 'string', description: 'Nom ou référence de la machine dans la GMAO' },
        description: strOrNull('Description des travaux (optionnel)'),
        maintenanceType: strOrNull('Type de maintenance (Corrective ou Préventive)'),
        plannedDate: strOrNull('Date au format YYYY-MM-DD (optionnel)'),
        priority: strOrNull('Priorité (A, B ou C)'),
        technician: strOrNull(),
    }, ['machine', 'description', 'maintenanceType', 'plannedDate', 'priority', 'technician']),
    functionTool('update_intervention', 'Prépare la modification d’une intervention existante.', {
        intervention: { type: 'string' }, status: strOrNull(), plannedDate: strOrNull(), description: strOrNull(), priority: strOrNull('Priorité (A, B ou C)'), technician: strOrNull(),
    }, ['intervention', 'status', 'plannedDate', 'description', 'priority', 'technician']),
    functionTool('schedule_maintenance', 'Prépare la planification d’une maintenance préventive.', {
        machine: { type: 'string' }, task: { type: 'string' }, frequency: { type: 'string' }, nextDueDate: { type: 'string' }, responsible: strOrNull(), notes: strOrNull(),
    }, ['machine', 'task', 'frequency', 'nextDueDate', 'responsible', 'notes']),
    functionTool('assign_technician', 'Prépare l’affectation d’un utilisateur actif à une intervention.', { intervention: { type: 'string' }, technician: { type: 'string' } }, ['intervention', 'technician']),
    functionTool('adjust_stock', 'Prépare une modification de quantité de stock.', {
        stockItem: { type: 'string' }, mode: { type: 'string', enum: ['set', 'increment', 'decrement'] }, quantity: { type: 'integer' }, reason: { type: 'string' },
    }, ['stockItem', 'mode', 'quantity', 'reason']),
    functionTool('create_alert', 'Prépare la création d’une alerte GMAO.', {
        title: { type: 'string' }, message: { type: 'string' }, priority: { type: 'string', enum: ['Haute', 'Moyenne', 'Normale'] }, type: { type: 'string', enum: ['machine', 'stock', 'intervention', 'preventif', 'system'] },
    }, ['title', 'message', 'priority', 'type']),
];
