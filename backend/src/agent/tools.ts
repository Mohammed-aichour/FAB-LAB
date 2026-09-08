type JsonRecord = Record<string, any>;
const functionTool = (name: string, description: string, properties: JsonRecord, required: string[] = []) => ({
  type: 'function', name, description, strict: true,
  parameters: { type: 'object', properties, required, additionalProperties: false },
});

export const tools = [
  functionTool('search_machines', 'Recherche l’état ACTUEL des machines par référence, nom, atelier, catégorie ou statut. À utiliser pour « quelles machines sont actuellement en panne ? » avec query « en panne ».', { query: { type: 'string' } }, ['query']),
  functionTool('search_stock', 'Recherche des pièces et composants réels en stock.', { query: { type: 'string' }, lowStockOnly: { type: 'boolean' } }, ['query', 'lowStockOnly']),
  functionTool('list_interventions', 'Liste les interventions et leur statut de traitement. Ne pas utiliser pour déterminer le statut actuel en panne d’une machine.', { machine: { type: ['string', 'null'] }, status: { type: ['string', 'null'] }, technician: { type: ['string', 'null'] } }, ['machine', 'status', 'technician']),
  functionTool('list_maintenance', 'Liste le plan de maintenance préventive réel.', { machine: { type: ['string', 'null'] }, overdueOnly: { type: 'boolean' } }, ['machine', 'overdueOnly']),
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
    description: { type: ['string', 'null'], description: 'Description des travaux (optionnel)' },
    maintenanceType: { type: ['string', 'null'], enum: ['Corrective', 'Préventive'] },
    plannedDate: { type: ['string', 'null'], description: 'Date au format YYYY-MM-DD (optionnel)' },
    priority: { type: ['string', 'null'], enum: ['A', 'B', 'C'] },
    technician: { type: ['string', 'null'] },
  }, ['machine', 'description', 'maintenanceType', 'plannedDate', 'priority', 'technician']),
  functionTool('update_intervention', 'Prépare la modification d’une intervention existante.', {
    intervention: { type: 'string' }, status: { type: ['string', 'null'] }, plannedDate: { type: ['string', 'null'] }, description: { type: ['string', 'null'] }, priority: { type: ['string', 'null'], enum: ['A', 'B', 'C'] }, technician: { type: ['string', 'null'] },
  }, ['intervention', 'status', 'plannedDate', 'description', 'priority', 'technician']),
  functionTool('schedule_maintenance', 'Prépare la planification d’une maintenance préventive.', {
    machine: { type: 'string' }, task: { type: 'string' }, frequency: { type: 'string' }, nextDueDate: { type: 'string' }, responsible: { type: ['string', 'null'] }, notes: { type: ['string', 'null'] },
  }, ['machine', 'task', 'frequency', 'nextDueDate', 'responsible', 'notes']),
  functionTool('assign_technician', 'Prépare l’affectation d’un utilisateur actif à une intervention.', { intervention: { type: 'string' }, technician: { type: 'string' } }, ['intervention', 'technician']),
  functionTool('adjust_stock', 'Prépare une modification de quantité de stock.', {
    stockItem: { type: 'string' }, mode: { type: 'string', enum: ['set', 'increment', 'decrement'] }, quantity: { type: 'integer', minimum: 0 }, reason: { type: 'string' },
  }, ['stockItem', 'mode', 'quantity', 'reason']),
  functionTool('create_alert', 'Prépare la création d’une alerte GMAO.', {
    title: { type: 'string' }, message: { type: 'string' }, priority: { type: 'string', enum: ['Haute', 'Moyenne', 'Normale'] }, type: { type: 'string', enum: ['machine', 'stock', 'intervention', 'preventif', 'system'] },
  }, ['title', 'message', 'priority', 'type']),
];
