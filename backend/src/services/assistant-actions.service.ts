import crypto from 'crypto';
import { z } from 'zod';
import { appendAudit } from './audit.service';
import { atomic, readEntity, withWriteLock, writeEntity, type EntityName } from './json-store';
import { buildPurchase, purchaseSchema, suppliers, unique } from './purchasing.service';
import type { AuthenticatedUser } from '../types/auth';

type RecordValue = Record<string, any>;

export interface PendingAction {
  id: string;
  userId: string;
  toolName: string;
  summary: string;
  entity: string;
  entityId: string | number | null;
  oldValue: unknown;
  newValue: unknown;
  payload: RecordValue;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
}

const machineStatusSchema = z.enum(['Opérationnel', 'Hors service', 'En maintenance', 'En Panne', 'Ne marche pas']);

const schemas = {
  prepare_purchase: purchaseSchema,
  create_supplier: z.object({ name: z.string().min(1).max(200), code: z.string().min(1).max(50), email: z.email().optional(), phone: z.string().max(100).optional(), address: z.string().max(500).optional(), domain: z.string().max(500).optional() }).strict(),
  update_order_status: z.object({ order: z.string().min(1), status: z.enum(['En attente', 'Approuvée', 'Reçue', 'Annulée']) }).strict(),
  set_machine_status: z.object({ machine: z.string().min(1), status: machineStatusSchema, reason: z.string().min(1) }),
  declare_failure: z.object({ machine: z.string().min(1), description: z.string().min(1), priority: z.enum(['A', 'B', 'C']).default('A') }),
  create_intervention: z.object({
    machine: z.string().min(1),
    description: z.string().optional().transform(v => (v && v.trim() ? v.trim() : 'Intervention de maintenance sur la machine')),
    maintenanceType: z.enum(['Corrective', 'Préventive']).default('Corrective'),
    plannedDate: z.string().optional().transform(v => (v && v.trim() ? v.trim() : nowDate())),
    priority: z.enum(['A', 'B', 'C']).default('B'),
    technician: z.string().optional(),
  }),
  update_intervention: z.object({
    intervention: z.union([z.string().min(1), z.number()]), status: z.enum(['Nouveau', 'Planifié', 'En cours', 'En attente pièce', 'Terminé', 'Clôturé']).optional(), plannedDate: z.iso.date().optional(),
    description: z.string().optional(), priority: z.enum(['A', 'B', 'C']).optional(), technician: z.string().optional(),
  }).refine((value) => Object.keys(value).some((key) => key !== 'intervention' && value[key as keyof typeof value] !== undefined), 'Une modification est requise.'),
  schedule_maintenance: z.object({
    machine: z.string().min(1), task: z.string().min(1), frequency: z.string().min(1), nextDueDate: z.iso.date(),
    responsible: z.string().optional(), notes: z.string().optional(),
  }),
  assign_technician: z.object({ intervention: z.union([z.string().min(1), z.number()]), technician: z.string().min(1) }),
  adjust_stock: z.object({ stockItem: z.string().min(1), mode: z.enum(['set', 'increment', 'decrement']), quantity: z.number().int().nonnegative(), reason: z.string().min(1) }),
  create_alert: z.object({ title: z.string().min(1), message: z.string().min(1), priority: z.enum(['Haute', 'Moyenne', 'Normale']), type: z.enum(['machine', 'stock', 'intervention', 'preventif', 'system']) }),
};

export type MutationToolName = keyof typeof schemas;

export const MUTATION_TOOL_NAMES = new Set<MutationToolName>(Object.keys(schemas) as MutationToolName[]);

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const normalized = (value: unknown) => stripAccents(String(value ?? '').trim().toLowerCase()).replace(/\s+/g, ' ');

function findUnique(records: RecordValue[], query: string, fields: string[], label: string): RecordValue {
  if (!query || !query.trim()) throw new Error(`${label} non précisé(e).`);
  const needle = normalized(query);

  // 1. Direct reference pattern extraction (e.g. FL-009, FL-ELE-01, PR-001, OT-IA-...)
  const refMatch = query.match(/\b(FL-[A-Z0-9-]+|PR-[0-9]+|OT-[A-Z0-9-]+)\b/i);
  if (refMatch) {
    const targetRef = normalized(refMatch[0]);
    const refFound = records.find(r => 
      normalized(r.reference) === targetRef ||
      normalized(r.id) === targetRef ||
      normalized(r.otNumber) === targetRef ||
      normalized(r.codeArborescence).includes(targetRef)
    );
    if (refFound) return refFound;
  }

  // 2. Exact match
  const exact = records.filter(r => fields.some(f => normalized(r[f]) === needle));
  if (exact.length === 1) return exact[0];

  // 3. Partial substring match
  const partial = records.filter(r => fields.some(f => {
    const val = normalized(r[f]);
    if (!val) return false;
    if (val.includes(needle)) return true;
    if ((f === 'reference' || f === 'id' || f === 'otNumber') && val.length >= 3 && needle.includes(val)) return true;
    return false;
  }));

  if (partial.length === 1) return partial[0];
  if (partial.length > 1 || exact.length > 1) {
    const pool = partial.length > 0 ? partial : exact;
    const words = needle.split(' ').filter(w => w.length > 1 && !['pour', 'cette', 'machine', 'cree', 'fais', 'une', 'intervention', 'sur'].includes(w));
    const scored = pool.map(r => {
      const fullText = normalized(fields.map(f => r[f]).join(' '));
      const score = words.reduce((acc, w) => acc + (fullText.includes(w) ? 1 : 0), 0);
      return { record: r, score };
    }).sort((a, b) => b.score - a.score);

    if (scored.length > 0 && (scored.length === 1 || scored[0].score > scored[1].score)) {
      return scored[0].record;
    }
    throw new Error(`${label} ambigu(e) : précisez la référence exacte (ex: ${pool.slice(0, 3).map(r => r.reference || r.name).join(', ')}).`);
  }

  // 4. Token-based fallback search
  const words = needle.split(' ').filter(w => w.length > 2 && !['pour', 'cette', 'machine', 'cree', 'fais', 'une', 'intervention', 'sur', 'donne', 'moi', 'informations'].includes(w));
  if (words.length > 0) {
    const scored = records.map(r => {
      const fullText = normalized(fields.map(f => r[f]).join(' '));
      const score = words.reduce((acc, w) => acc + (fullText.includes(w) ? 1 : 0), 0);
      return { record: r, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0 && (scored.length === 1 || scored[0].score > scored[1].score)) {
      return scored[0].record;
    }
  }

  throw new Error(`${label} introuvable dans les données réelles.`);
}

const findMachine = (query: string) => findUnique(readEntity<RecordValue[]>('machines'), query, ['id', 'reference', 'name', 'designation', 'codeArborescence'], 'Machine');
const findStock = (query: string) => findUnique(readEntity<RecordValue[]>('stock'), query, ['id', 'reference', 'name'], 'Article de stock');
const findIntervention = (query: string | number) => findUnique(readEntity<RecordValue[]>('interventions'), String(query), ['id', 'otNumber', 'diNumber'], 'Intervention');
const findTechnician = (query: string) => {
  const user = findUnique(readEntity<RecordValue[]>('users'), query, ['id', 'email', 'name'], 'Technicien');
  if (!['Technicien', 'Ingénieur', 'Superviseur'].includes(user.role) || user.status !== 'Actif') throw new Error("Cet utilisateur ne peut pas être affecté à une intervention.");
  return user;
};

function nextNumericId(records: RecordValue[]): number {
  return records.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1;
}

function nowDate(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Casablanca' }).format(new Date());
}

function buildPreview(toolName: MutationToolName, rawPayload: RecordValue): Omit<PendingAction, 'id' | 'userId' | 'createdAt' | 'expiresAt' | 'status'> {
  const payload = schemas[toolName].parse(rawPayload) as RecordValue;

  if (toolName === 'prepare_purchase') {
    const order = buildPurchase(payload);
    return { toolName, payload, summary: `Enregistrer une demande de ${order.kind} : ${order.quantity} ${order.unit || 'unité(s)'} de ${order.componentName}, fournisseur ${order.supplierName}. Aucun email envoyé.`, entity: 'orders', entityId: order.id, oldValue: null, newValue: order };
  }
  if (toolName === 'create_supplier') {
    if (suppliers().some(s => normalized(s.name) === normalized(payload.name) || normalized(s.code) === normalized(payload.code))) throw new Error('Un fournisseur porte déjà ce nom ou ce code.');
    const supplier = { id: Date.now(), ...payload, status: 'Actif', contact: '', evaluation: '', francoMAD: '', paymentTerms: '' };
    return { toolName, payload, summary: `Créer le fournisseur ${payload.name} (${payload.code}).`, entity: 'suppliers', entityId: supplier.id, oldValue: null, newValue: supplier };
  }
  if (toolName === 'update_order_status') {
    const before = unique(readEntity<RecordValue[]>('orders'), payload.order, ['id', 'reference'], 'Commande');
    if (['Reçue', 'Annulée'].includes(before.status)) throw new Error('Cette demande est déjà clôturée.');
    return { toolName, payload, summary: `Demande ${before.reference} : ${before.status} → ${payload.status}. Le stock reste à réceptionner séparément.`, entity: 'orders', entityId: before.id, oldValue: before, newValue: { ...before, status: payload.status } };
  }

  if (toolName === 'set_machine_status') {
    const machine = findMachine(payload.machine);
    const updated = { ...machine, status: payload.status, statusReason: payload.reason, updatedAt: new Date().toISOString() };
    return { toolName, payload, summary: `Modifier l'état de ${machine.name} (${machine.reference}) : « ${machine.status} » → « ${payload.status} ».`, entity: 'machines', entityId: machine.id, oldValue: machine, newValue: updated };
  }

  if (toolName === 'declare_failure') {
    const machine = findMachine(payload.machine);
    const interventions = readEntity<RecordValue[]>('interventions');
    const id = nextNumericId(interventions);
    const machineAfter = { ...machine, status: 'Hors service', statusReason: payload.description, updatedAt: new Date().toISOString() };
    const intervention = {
      id, otNumber: `OT-IA-${nowDate().replaceAll('-', '')}-${id}`, diNumber: '-', creationDate: nowDate(), maintenanceType: 'Corrective',
      equipmentId: machine.reference || machine.id, equipmentName: machine.name, atelier: machine.atelier || machine.location || 'FabLab',
      priority: payload.priority, description: payload.description, technician: 'Non assigné', plannedDate: nowDate(), startDate: '', endDate: '',
      realDurationHours: 0, partsUsed: [], partsCostMAD: 0, laborCostMAD: 0, totalCostMAD: 0, status: 'Nouveau', supervisorVisa: 'En attente', observations: '',
    };
    const notification = { id: `notif_${crypto.randomUUID()}`, type: 'machine', title: `Panne Machine — ${machine.name}`, message: payload.description, priority: 'Haute', timestamp: Date.now(), timeFormatted: "À l'instant", read: false, link: '/machines' };
    return { toolName, payload, summary: `Déclarer ${machine.name} (${machine.reference}) en panne, créer ${intervention.otNumber} et une alerte prioritaire.`, entity: 'machines/interventions/notifications', entityId: machine.id, oldValue: { machine }, newValue: { machine: machineAfter, intervention, notification } };
  }

  if (toolName === 'create_intervention') {
    const machine = findMachine(payload.machine);
    const interventions = readEntity<RecordValue[]>('interventions');
    const id = nextNumericId(interventions);
    let technician = 'Non assigné';
    if (payload.technician) technician = findTechnician(payload.technician).name;
    const intervention = {
      id, otNumber: `OT-IA-${nowDate().replaceAll('-', '')}-${id}`, diNumber: '-', creationDate: nowDate(), maintenanceType: payload.maintenanceType,
      equipmentId: machine.reference || machine.id, equipmentName: machine.name, atelier: machine.atelier || machine.location || 'FabLab', priority: payload.priority,
      description: payload.description, technician, plannedDate: payload.plannedDate, startDate: '', endDate: '', realDurationHours: 0,
      partsUsed: [], partsCostMAD: 0, laborCostMAD: 0, totalCostMAD: 0, status: 'Nouveau', supervisorVisa: 'En attente', observations: '',
    };
    return { toolName, payload, summary: `Créer ${intervention.otNumber} pour ${machine.name} (« ${intervention.description} »), planifiée le ${payload.plannedDate}${technician !== 'Non assigné' ? ` et affectée à ${technician}` : ''}.`, entity: 'interventions', entityId: id, oldValue: null, newValue: intervention };
  }

  if (toolName === 'update_intervention') {
    const intervention = findIntervention(payload.intervention);
    const patch: RecordValue = {};
    for (const field of ['status', 'plannedDate', 'description', 'priority']) if (payload[field] !== undefined) patch[field] = payload[field];
    if (payload.technician) patch.technician = findTechnician(payload.technician).name;
    const updated = { ...intervention, ...patch, updatedAt: new Date().toISOString() };
    return { toolName, payload, summary: `Modifier l'intervention ${intervention.otNumber || intervention.id}.`, entity: 'interventions', entityId: intervention.id, oldValue: intervention, newValue: updated };
  }

  if (toolName === 'schedule_maintenance') {
    const machine = findMachine(payload.machine);
    const maintenance = readEntity<RecordValue[]>('preventif');
    const id = nextNumericId(maintenance);
    const task = { id, fl_id: machine.reference || machine.id, equipement: machine.name, tache: payload.task, type: 'Maintenance planifiée', frequence: payload.frequency, responsable: payload.responsible || 'Technicien', statut: 'Planifié', prochaineEcheance: payload.nextDueDate, description: payload.notes || payload.task, source: 'Assistant IA confirmé' };
    return { toolName, payload, summary: `Planifier « ${payload.task} » sur ${machine.name} pour le ${payload.nextDueDate} (${payload.frequency}).`, entity: 'preventif', entityId: id, oldValue: null, newValue: task };
  }

  if (toolName === 'assign_technician') {
    const intervention = findIntervention(payload.intervention);
    const technician = findTechnician(payload.technician);
    const updated = { ...intervention, technician: technician.name, updatedAt: new Date().toISOString() };
    return { toolName, payload, summary: `Affecter ${technician.name} à l'intervention ${intervention.otNumber || intervention.id}.`, entity: 'interventions', entityId: intervention.id, oldValue: intervention, newValue: updated };
  }

  if (toolName === 'adjust_stock') {
    const item = findStock(payload.stockItem);
    const current = Number(item.quantity) || 0;
    const next = payload.mode === 'set' ? payload.quantity : payload.mode === 'increment' ? current + payload.quantity : current - payload.quantity;
    if (next < 0) throw new Error(`Stock insuffisant : la quantité ne peut pas devenir négative (${next}).`);
    const updated = { ...item, quantity: next, stockReason: payload.reason, updatedAt: new Date().toISOString() };
    return { toolName, payload, summary: `Modifier le stock de ${item.name} (${item.reference}) : ${current} → ${next} ${item.unit || 'unité(s)'}.`, entity: 'stock', entityId: item.id, oldValue: item, newValue: updated };
  }

  const notifications = readEntity<RecordValue[]>('notifications');
  const notification = { id: `notif_${crypto.randomUUID()}`, ...payload, timestamp: Date.now(), timeFormatted: "À l'instant", read: false, link: '/' };
  return { toolName, payload, summary: `Créer l'alerte « ${payload.title} » avec la priorité ${payload.priority}.`, entity: 'notifications', entityId: notification.id, oldValue: null, newValue: notification };
}

export function createPendingAction(toolName: MutationToolName, payload: RecordValue, user: AuthenticatedUser): PendingAction {
  assertSupervisor(user);
  const preview = buildPreview(toolName, payload);
  const now = Date.now();
  const action: PendingAction = { ...preview, id: crypto.randomUUID(), userId: String(user.id), createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 10 * 60_000).toISOString(), status: 'pending' };
  const actions = readEntity<PendingAction[]>('assistant_pending_actions').filter((entry) => entry.status === 'pending' && new Date(entry.expiresAt).getTime() > now);
  writeEntity('assistant_pending_actions', [action, ...actions].slice(0, 200));
  return action;
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export async function confirmPendingAction(actionId: string, user: AuthenticatedUser) {
  assertSupervisor(user);
  return withWriteLock(() => atomic(() => {
    const actions = readEntity<PendingAction[]>('assistant_pending_actions');
    const action = actions.find((entry) => entry.id === actionId);
    if (!action || action.userId !== String(user.id)) throw new Error('Action introuvable pour cet utilisateur.');
    if (action.status !== 'pending') throw new Error('Cette action a déjà été traitée.');
    if (Date.now() > new Date(action.expiresAt).getTime()) throw new Error('Cette action a expiré. Veuillez la reformuler.');

    const replaceById = (entity: EntityName, before: RecordValue, after: RecordValue) => {
      const records = readEntity<RecordValue[]>(entity);
      const index = records.findIndex((record) => String(record.id) === String(before.id));
      if (index < 0 || !sameValue(records[index], before)) throw new Error("Les données ont changé depuis la prévisualisation. Relancez l'action.");
      records[index] = after;
      writeEntity(entity, records);
    };

    if (action.toolName === 'prepare_purchase') {
      const order = action.newValue as RecordValue;
      const fresh = buildPurchase(action.payload);
      if (!sameValue(order.sourceComponent, fresh.sourceComponent) || !sameValue(order.sourceSupplier, fresh.sourceSupplier)) throw new Error('Les données fournisseur ou composant ont changé. Reformulez la demande.');
      writeEntity('orders', [order, ...readEntity<RecordValue[]>('orders')]);
    } else if (action.toolName === 'create_supplier') {
      buildPreview('create_supplier', action.payload);
      writeEntity('suppliers', [action.newValue, ...readEntity<RecordValue[]>('suppliers')]);
    } else if (action.toolName === 'update_order_status') replaceById('orders', action.oldValue as RecordValue, action.newValue as RecordValue);
    else if (action.toolName === 'set_machine_status') replaceById('machines', action.oldValue as RecordValue, action.newValue as RecordValue);
    else if (action.toolName === 'update_intervention' || action.toolName === 'assign_technician') replaceById('interventions', action.oldValue as RecordValue, action.newValue as RecordValue);
    else if (action.toolName === 'adjust_stock') replaceById('stock', action.oldValue as RecordValue, action.newValue as RecordValue);
    else if (action.toolName === 'declare_failure') {
      const before = (action.oldValue as RecordValue).machine;
      const after = action.newValue as RecordValue;
      if (readEntity<RecordValue[]>('interventions').some(r => r.id === after.intervention.id)) throw new Error('Identifiant intervention déjà utilisé. Reformulez la demande.');
      replaceById('machines', before, after.machine);
      writeEntity('interventions', [after.intervention, ...readEntity<RecordValue[]>('interventions')]);
      writeEntity('notifications', [after.notification, ...readEntity<RecordValue[]>('notifications')]);
    } else if (action.toolName === 'create_intervention') {
      const records = readEntity<RecordValue[]>('interventions');
      const created = action.newValue as RecordValue;
      if (records.some((record) => String(record.id) === String(created.id) || record.otNumber === created.otNumber)) throw new Error("Un autre enregistrement utilise déjà l'identifiant proposé. Relancez l'action.");
      writeEntity('interventions', [created, ...records]);
    } else if (action.toolName === 'schedule_maintenance') {
      const records = readEntity<RecordValue[]>('preventif');
      const created = action.newValue as RecordValue;
      if (records.some((record) => String(record.id) === String(created.id))) throw new Error("Un autre enregistrement utilise déjà l'identifiant proposé. Relancez l'action.");
      writeEntity('preventif', [created, ...records]);
    } else if (action.toolName === 'create_alert') {
      writeEntity('notifications', [action.newValue, ...readEntity<RecordValue[]>('notifications')]);
    }

    action.status = 'confirmed';
    writeEntity('assistant_pending_actions', actions);
    const audit = appendAudit(user, `Assistant IA: ${action.toolName}`, action.entity, action.entityId, action.oldValue, action.newValue);
    return { action, audit };
  }));
}

export async function cancelPendingAction(actionId: string, user: AuthenticatedUser) {
  assertSupervisor(user);
  return withWriteLock(() => {
    const actions = readEntity<PendingAction[]>('assistant_pending_actions');
    const action = actions.find((entry) => entry.id === actionId);
    if (!action || action.userId !== String(user.id)) throw new Error('Action introuvable pour cet utilisateur.');
    if (action.status !== 'pending') throw new Error('Cette action a déjà été traitée.');
    action.status = 'cancelled';
    writeEntity('assistant_pending_actions', actions);
    return action;
  });
}

function assertSupervisor(user: AuthenticatedUser) {
  const current = readEntity<AuthenticatedUser[]>('users').find(u => String(u.id) === String(user.id));
  if (!current || current.status !== 'Actif' || current.role !== 'Superviseur') throw new Error('Action réservée au superviseur actif.');
}
