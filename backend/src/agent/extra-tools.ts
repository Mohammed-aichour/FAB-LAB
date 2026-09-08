import { z } from 'zod';
import { readEntity } from '../services/json-store';
import { componentSupplier, suppliers, purchaseSchema } from '../services/purchasing.service';
import { resolveMachine, matchesMachineRecord } from '../services/gmao-read.service';
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
  get_failure_analysis: z.object({ machine: text.nullable() }).strict(),
  get_maintenance_recommendations: z.object({ machine: text.nullable(), timeframe: text.nullable() }).strict(),
  get_stock_analysis: z.object({}).strict(),
};
const extras = {
  get_unavailable_machines: ['Liste exhaustive des machines actuellement en panne ou hors service selon leur statut machine réel.', readSchemas.get_unavailable_machines],
  get_failures: ['Interventions correctives enregistrées (indicateur de pannes), total et classement par machine pour une période.', readSchemas.get_failures],
  get_maintenance_period: ['Maintenance prévue entre deux dates incluses.', readSchemas.get_maintenance_period],
  get_interventions_period: ['Interventions par date de création, triées de la plus récente à la plus ancienne.', readSchemas.get_interventions_period],
  get_suppliers: ['Coordonnées fournisseur réelles, recherche par nom, code ou identifiant.', readSchemas.get_suppliers],
  get_supplier_for_component: ['Composant, stock, référence produit, prix et fournisseur explicitement associé.', readSchemas.get_supplier_for_component],
  get_orders: ['Historique des demandes de commande/devis, les plus récentes en premier. Vide signifie aucun historique enregistré.', readSchemas.get_orders],
  get_failure_analysis: ['Analyse approfondie des pannes, des machines les plus touchées, des priorités et des tendances.', readSchemas.get_failure_analysis],
  get_maintenance_recommendations: ['Génère un plan et des recommandations de maintenance prioritaires basés sur le statut du parc, les retards préventifs et l’historique.', readSchemas.get_maintenance_recommendations],
  get_stock_analysis: ['Analyse des ruptures de stock, des articles sous le seuil critique et des pièces à commander avec leurs fournisseurs.', readSchemas.get_stock_analysis],
  prepare_purchase: ['Prépare commande, réapprovisionnement ou devis et email. Enregistrement après confirmation, aucun envoi.', purchaseSchema],
  create_supplier: ['Prépare un fournisseur avec les seules données explicitement fournies.', z.object({name:text.min(1),code:text.min(1),email:text.nullable(),phone:text.nullable(),address:text.nullable(),domain:text.nullable()}).strict()],
  update_order_status: ['Prépare le statut d’une demande, sans modifier le stock ni envoyer de message.', z.object({order:text.min(1),status:z.enum(['En attente','Approuvée','Reçue','Annulée'])}).strict()],
} as const;
function cleanSchemaForOpenAI(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanSchemaForOpenAI);

  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (['$schema', 'pattern', 'format', 'minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'].includes(k)) {
      continue;
    }
    res[k] = cleanSchemaForOpenAI(v);
  }
  return res;
}

export const extraTools = Object.entries(extras).map(([name,[description,schema]]) => {
  const params = cleanSchemaForOpenAI(z.toJSONSchema(schema));
  return { type: 'function', name, description, parameters: params };
});
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
  if (name === 'get_maintenance_period') {
    const resolvedMachine = args.machine ? resolveMachine(args.machine) : null;
    return readEntity<any[]>('preventif').filter(m => {
      if (args.machine) {
        if (resolvedMachine) {
          if (!matchesMachineRecord(m, resolvedMachine)) return false;
        } else {
          if (!matches(m, args.machine, ['fl_id', 'equipement'])) return false;
        }
      }
      return within(m.prochaineEcheance);
    });
  }
  if (name === 'get_failures' || name === 'get_interventions_period') {
    const resolvedMachine = args.machine ? resolveMachine(args.machine) : null;
    const all = readEntity<any[]>('interventions').filter(i => {
      if (args.machine) {
        if (resolvedMachine) {
          if (!matchesMachineRecord(i, resolvedMachine)) return false;
        } else {
          if (!matches(i, args.machine, ['equipmentId', 'equipmentName'])) return false;
        }
      }
      return (name !== 'get_failures' || i.maintenanceType === 'Corrective');
    });
    const rows = all.filter(i => within(i.creationDate)).sort((a,b) => String(b.creationDate).localeCompare(String(a.creationDate)));
    const counts = new Map<string, number>();
    rows.forEach(i => counts.set(i.equipmentId || i.equipmentName, (counts.get(i.equipmentId || i.equipmentName) || 0) + 1));
    return { total: rows.length, missingDates: all.filter(i => !i.creationDate).length, basis: 'Interventions enregistrées, date de création ; pas un registre exhaustif de pannes.', ranking: [...counts].sort((a,b) => b[1]-a[1]).map(([machine,count]) => ({machine,count})), items: rows };
  }
  if (name === 'get_failure_analysis') {
    const resolvedMachine = args.machine ? resolveMachine(args.machine) : null;
    let machines = readEntity<any[]>('machines');
    let interventions = readEntity<any[]>('interventions').filter(i => i.maintenanceType === 'Corrective');

    if (args.machine) {
      if (resolvedMachine) {
        machines = machines.filter(m => m.id === resolvedMachine.id);
        interventions = interventions.filter(i => matchesMachineRecord(i, resolvedMachine));
      } else {
        machines = machines.filter(m => matches(m, args.machine, ['id', 'reference', 'name', 'designation']));
        interventions = interventions.filter(i => matches(i, args.machine, ['equipmentId', 'equipmentName']));
      }
    }

    const downStatuses = new Set(['hors service', 'en panne', 'ne marche pas']);
    const unavailable = machines.filter(m => downStatuses.has(String(m.status || '').trim().toLowerCase()));
    
    const countByMachine = new Map<string, { ref: string; name: string; count: number; open: number }>();
    machines.forEach(m => countByMachine.set(m.reference || m.id, { ref: m.reference || m.id, name: m.name, count: 0, open: 0 }));
    
    interventions.forEach(i => {
      const ref = i.equipmentId || i.equipmentName;
      const existing = countByMachine.get(ref) || { ref, name: i.equipmentName, count: 0, open: 0 };
      existing.count += 1;
      if (!['Terminé', 'Clôturé', 'Annulé'].includes(i.status)) existing.open += 1;
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
    const resolvedMachine = args.machine ? resolveMachine(args.machine) : null;
    let machines = readEntity<any[]>('machines');
    let preventif = readEntity<any[]>('preventif');
    let interventions = readEntity<any[]>('interventions');

    if (args.machine) {
      if (resolvedMachine) {
        machines = machines.filter(m => m.id === resolvedMachine.id);
        preventif = preventif.filter(p => matchesMachineRecord(p, resolvedMachine));
        interventions = interventions.filter(i => matchesMachineRecord(i, resolvedMachine));
      } else {
        machines = machines.filter(m => matches(m, args.machine, ['id', 'reference', 'name', 'designation']));
        preventif = preventif.filter(p => matches(p, args.machine, ['fl_id', 'equipement']));
        interventions = interventions.filter(i => matches(i, args.machine, ['equipmentId', 'equipmentName']));
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const plan: any[] = [];

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
    const stock = readEntity<any[]>('stock');
    const suppliersList = readEntity<any[]>('suppliers');
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
