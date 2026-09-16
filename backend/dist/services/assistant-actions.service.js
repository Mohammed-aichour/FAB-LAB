"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MUTATION_TOOL_NAMES = void 0;
exports.createPendingAction = createPendingAction;
exports.confirmPendingAction = confirmPendingAction;
exports.cancelPendingAction = cancelPendingAction;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const audit_service_1 = require("./audit.service");
const json_store_1 = require("./json-store");
const purchasing_service_1 = require("./purchasing.service");
const gmao_read_service_1 = require("./gmao-read.service");
const machineStatusSchema = zod_1.z.enum(['Opérationnel', 'Hors service', 'En maintenance', 'En Panne', 'Ne marche pas']);
const schemas = {
    prepare_purchase: purchasing_service_1.purchaseSchema,
    create_supplier: zod_1.z.object({ name: zod_1.z.string().min(1).max(200), code: zod_1.z.string().min(1).max(50), email: zod_1.z.email().optional(), phone: zod_1.z.string().max(100).optional(), address: zod_1.z.string().max(500).optional(), domain: zod_1.z.string().max(500).optional() }).strict(),
    update_order_status: zod_1.z.object({ order: zod_1.z.string().min(1), status: zod_1.z.enum(['En attente', 'Approuvée', 'Reçue', 'Annulée']) }).strict(),
    set_machine_status: zod_1.z.object({ machine: zod_1.z.string().min(1), status: machineStatusSchema, reason: zod_1.z.string().min(1) }),
    declare_failure: zod_1.z.object({ machine: zod_1.z.string().min(1), description: zod_1.z.string().min(1), priority: zod_1.z.enum(['A', 'B', 'C']).default('A') }),
    create_intervention: zod_1.z.object({
        machine: zod_1.z.string().min(1),
        description: zod_1.z.string().optional().transform(v => (v && v.trim() ? v.trim() : 'Intervention de maintenance sur la machine')),
        maintenanceType: zod_1.z.enum(['Corrective', 'Préventive']).default('Corrective'),
        plannedDate: zod_1.z.string().optional().transform(v => (v && v.trim() ? v.trim() : nowDate())),
        priority: zod_1.z.enum(['A', 'B', 'C']).default('B'),
        technician: zod_1.z.string().optional(),
    }),
    update_intervention: zod_1.z.object({
        intervention: zod_1.z.union([zod_1.z.string().min(1), zod_1.z.number()]), status: zod_1.z.enum(['Nouveau', 'Planifié', 'En cours', 'En attente pièce', 'Terminé', 'Clôturé']).optional(), plannedDate: zod_1.z.iso.date().optional(),
        description: zod_1.z.string().optional(), priority: zod_1.z.enum(['A', 'B', 'C']).optional(), technician: zod_1.z.string().optional(),
    }).refine((value) => Object.keys(value).some((key) => key !== 'intervention' && value[key] !== undefined), 'Une modification est requise.'),
    schedule_maintenance: zod_1.z.object({
        machine: zod_1.z.string().min(1), task: zod_1.z.string().min(1), frequency: zod_1.z.string().min(1), nextDueDate: zod_1.z.iso.date(),
        responsible: zod_1.z.string().optional(), notes: zod_1.z.string().optional(),
    }),
    assign_technician: zod_1.z.object({ intervention: zod_1.z.union([zod_1.z.string().min(1), zod_1.z.number()]), technician: zod_1.z.string().min(1) }),
    adjust_stock: zod_1.z.object({ stockItem: zod_1.z.string().min(1), mode: zod_1.z.enum(['set', 'increment', 'decrement']), quantity: zod_1.z.number().int().nonnegative(), reason: zod_1.z.string().min(1) }),
    create_alert: zod_1.z.object({ title: zod_1.z.string().min(1), message: zod_1.z.string().min(1), priority: zod_1.z.enum(['Haute', 'Moyenne', 'Normale']), type: zod_1.z.enum(['machine', 'stock', 'intervention', 'preventif', 'system']) }),
};
exports.MUTATION_TOOL_NAMES = new Set(Object.keys(schemas));
function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
const normalized = (value) => stripAccents(String(value ?? '').trim().toLowerCase()).replace(/\s+/g, ' ');
function findUnique(records, query, fields, label) {
    if (!query || !query.trim())
        throw new Error(`${label} non précisé(e).`);
    const needle = normalized(query);
    // 1. Direct reference pattern extraction (e.g. FL-009, FL-ELE-01, PR-001, OT-IA-...)
    const refMatch = query.match(/\b(FL-[A-Z0-9-]+|PR-[0-9]+|OT-[A-Z0-9-]+)\b/i);
    if (refMatch) {
        const targetRef = normalized(refMatch[0]);
        const refFound = records.find(r => normalized(r.reference) === targetRef ||
            normalized(r.id) === targetRef ||
            normalized(r.otNumber) === targetRef ||
            normalized(r.codeArborescence).includes(targetRef));
        if (refFound)
            return refFound;
    }
    // 2. Exact match
    const exact = records.filter(r => fields.some(f => normalized(r[f]) === needle));
    if (exact.length === 1)
        return exact[0];
    // 3. Partial substring match
    const partial = records.filter(r => fields.some(f => {
        const val = normalized(r[f]);
        if (!val)
            return false;
        if (val.includes(needle))
            return true;
        if ((f === 'reference' || f === 'id' || f === 'otNumber') && val.length >= 3 && needle.includes(val))
            return true;
        return false;
    }));
    if (partial.length === 1)
        return partial[0];
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
const findMachine = (query) => {
    const resolved = (0, gmao_read_service_1.resolveMachine)(query);
    if (resolved)
        return resolved;
    return findUnique((0, json_store_1.readEntity)('machines'), query, ['id', 'reference', 'name', 'designation', 'codeArborescence'], 'Machine');
};
const findStock = (query) => findUnique((0, json_store_1.readEntity)('stock'), query, ['id', 'reference', 'name'], 'Article de stock');
const findIntervention = (query) => findUnique((0, json_store_1.readEntity)('interventions'), String(query), ['id', 'otNumber', 'diNumber'], 'Intervention');
const findTechnician = (query) => {
    try {
        const user = findUnique((0, json_store_1.readEntity)('users'), query, ['id', 'email', 'name'], 'Technicien');
        if (!['Technicien', 'Ingénieur', 'Superviseur'].includes(user.role) || user.status !== 'Actif')
            return null;
        return user;
    }
    catch {
        return null;
    }
};
function nextNumericId(records) {
    return records.reduce((max, record) => Math.max(max, Number(record.id) || 0), 0) + 1;
}
function nowDate() {
    try {
        return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Casablanca' }).format(new Date());
    }
    catch {
        return new Date().toISOString().slice(0, 10);
    }
}
function buildPreview(toolName, rawPayload) {
    const payload = schemas[toolName].parse(rawPayload);
    if (toolName === 'prepare_purchase') {
        const order = (0, purchasing_service_1.buildPurchase)(payload);
        return { toolName, payload, summary: `Enregistrer une demande de ${order.kind} : ${order.quantity} ${order.unit || 'unité(s)'} de ${order.componentName}, fournisseur ${order.supplierName}. Aucun email envoyé.`, entity: 'orders', entityId: order.id, oldValue: null, newValue: order };
    }
    if (toolName === 'create_supplier') {
        if ((0, purchasing_service_1.suppliers)().some(s => normalized(s.name) === normalized(payload.name) || normalized(s.code) === normalized(payload.code)))
            throw new Error('Un fournisseur porte déjà ce nom ou ce code.');
        const supplier = { id: Date.now(), ...payload, status: 'Actif', contact: '', evaluation: '', francoMAD: '', paymentTerms: '' };
        return { toolName, payload, summary: `Créer le fournisseur ${payload.name} (${payload.code}).`, entity: 'suppliers', entityId: supplier.id, oldValue: null, newValue: supplier };
    }
    if (toolName === 'update_order_status') {
        const before = (0, purchasing_service_1.unique)((0, json_store_1.readEntity)('orders'), payload.order, ['id', 'reference'], 'Commande');
        if (['Reçue', 'Annulée'].includes(before.status))
            throw new Error('Cette demande est déjà clôturée.');
        return { toolName, payload, summary: `Demande ${before.reference} : ${before.status} → ${payload.status}. Le stock reste à réceptionner séparément.`, entity: 'orders', entityId: before.id, oldValue: before, newValue: { ...before, status: payload.status } };
    }
    if (toolName === 'set_machine_status') {
        const machine = findMachine(payload.machine);
        const updated = { ...machine, status: payload.status, statusReason: payload.reason, updatedAt: new Date().toISOString() };
        return { toolName, payload, summary: `Modifier l'état de ${machine.name} (${machine.reference}) : « ${machine.status} » → « ${payload.status} ».`, entity: 'machines', entityId: machine.id, oldValue: machine, newValue: updated };
    }
    if (toolName === 'declare_failure') {
        const machine = findMachine(payload.machine);
        const interventions = (0, json_store_1.readEntity)('interventions');
        const id = nextNumericId(interventions);
        const machineAfter = { ...machine, status: 'Hors service', statusReason: payload.description, updatedAt: new Date().toISOString() };
        const intervention = {
            id, otNumber: `OT-IA-${nowDate().replaceAll('-', '')}-${id}`, diNumber: '-', creationDate: nowDate(), maintenanceType: 'Corrective',
            equipmentId: machine.reference || machine.id, equipmentName: machine.name, atelier: machine.atelier || machine.location || 'FabLab',
            priority: payload.priority, description: payload.description, technician: 'Non assigné', plannedDate: nowDate(), startDate: '', endDate: '',
            realDurationHours: 0, partsUsed: [], partsCostMAD: 0, laborCostMAD: 0, totalCostMAD: 0, status: 'Nouveau', supervisorVisa: 'En attente', observations: '',
        };
        const notification = { id: `notif_${crypto_1.default.randomUUID()}`, type: 'machine', title: `Panne Machine — ${machine.name}`, message: payload.description, priority: 'Haute', timestamp: Date.now(), timeFormatted: "À l'instant", read: false, link: '/machines' };
        return { toolName, payload, summary: `Déclarer ${machine.name} (${machine.reference}) en panne, créer ${intervention.otNumber} et une alerte prioritaire.`, entity: 'machines/interventions/notifications', entityId: machine.id, oldValue: { machine }, newValue: { machine: machineAfter, intervention, notification } };
    }
    if (toolName === 'create_intervention') {
        const machine = findMachine(payload.machine);
        const interventions = (0, json_store_1.readEntity)('interventions');
        const id = nextNumericId(interventions);
        let technician = 'Non assigné';
        if (payload.technician)
            technician = findTechnician(payload.technician)?.name || 'Non assigné';
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
        const patch = {};
        if (payload.technician)
            patch.technician = findTechnician(payload.technician)?.name || payload.technician;
        const updated = { ...intervention, ...patch, updatedAt: new Date().toISOString() };
        return { toolName, payload, summary: `Modifier l'intervention ${intervention.otNumber || intervention.id}.`, entity: 'interventions', entityId: intervention.id, oldValue: intervention, newValue: updated };
    }
    if (toolName === 'schedule_maintenance') {
        const machine = findMachine(payload.machine);
        const maintenance = (0, json_store_1.readEntity)('preventif');
        const id = nextNumericId(maintenance);
        const task = { id, fl_id: machine.reference || machine.id, equipement: machine.name, tache: payload.task, type: 'Maintenance planifiée', frequence: payload.frequency, responsable: payload.responsible || 'Technicien', statut: 'Planifié', prochaineEcheance: payload.nextDueDate, description: payload.notes || payload.task, source: 'Assistant IA confirmé' };
        return { toolName, payload, summary: `Planifier « ${payload.task} » sur ${machine.name} pour le ${payload.nextDueDate} (${payload.frequency}).`, entity: 'preventif', entityId: id, oldValue: null, newValue: task };
    }
    if (toolName === 'assign_technician') {
        const intervention = findIntervention(payload.intervention);
        const technician = findTechnician(payload.technician);
        if (!technician)
            throw new Error("Technicien introuvable dans les données réelles.");
        const updated = { ...intervention, technician: technician.name, updatedAt: new Date().toISOString() };
        return { toolName, payload, summary: `Affecter ${technician.name} à l'intervention ${intervention.otNumber || intervention.id}.`, entity: 'interventions', entityId: intervention.id, oldValue: intervention, newValue: updated };
    }
    if (toolName === 'adjust_stock') {
        const item = findStock(payload.stockItem);
        const current = Number(item.quantity) || 0;
        const next = payload.mode === 'set' ? payload.quantity : payload.mode === 'increment' ? current + payload.quantity : current - payload.quantity;
        if (next < 0)
            throw new Error(`Stock insuffisant : la quantité ne peut pas devenir négative (${next}).`);
        const updated = { ...item, quantity: next, stockReason: payload.reason, updatedAt: new Date().toISOString() };
        return { toolName, payload, summary: `Modifier le stock de ${item.name} (${item.reference}) : ${current} → ${next} ${item.unit || 'unité(s)'}.`, entity: 'stock', entityId: item.id, oldValue: item, newValue: updated };
    }
    const notifications = (0, json_store_1.readEntity)('notifications');
    const notification = { id: `notif_${crypto_1.default.randomUUID()}`, ...payload, timestamp: Date.now(), timeFormatted: "À l'instant", read: false, link: '/' };
    return { toolName, payload, summary: `Créer l'alerte « ${payload.title} » avec la priorité ${payload.priority}.`, entity: 'notifications', entityId: notification.id, oldValue: null, newValue: notification };
}
function createPendingAction(toolName, payload, user) {
    assertSupervisor(user);
    const preview = buildPreview(toolName, payload);
    const now = Date.now();
    const action = { ...preview, id: crypto_1.default.randomUUID(), userId: String(user.id), createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 10 * 60_000).toISOString(), status: 'pending' };
    const actions = (0, json_store_1.readEntity)('assistant_pending_actions').filter((entry) => entry.status === 'pending' && new Date(entry.expiresAt).getTime() > now);
    (0, json_store_1.writeEntity)('assistant_pending_actions', [action, ...actions].slice(0, 200));
    return action;
}
function sameValue(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
async function confirmPendingAction(actionId, user) {
    assertSupervisor(user);
    return (0, json_store_1.withWriteLock)(() => (0, json_store_1.atomic)(() => {
        const actions = (0, json_store_1.readEntity)('assistant_pending_actions');
        const action = actions.find((entry) => entry.id === actionId);
        if (!action || action.userId !== String(user.id))
            throw new Error('Action introuvable pour cet utilisateur.');
        if (action.status !== 'pending')
            throw new Error('Cette action a déjà été traitée.');
        if (Date.now() > new Date(action.expiresAt).getTime())
            throw new Error('Cette action a expiré. Veuillez la reformuler.');
        const replaceById = (entity, before, after) => {
            const records = (0, json_store_1.readEntity)(entity);
            const index = records.findIndex((record) => String(record.id) === String(before.id));
            if (index < 0 || !sameValue(records[index], before))
                throw new Error("Les données ont changé depuis la prévisualisation. Relancez l'action.");
            records[index] = after;
            (0, json_store_1.writeEntity)(entity, records);
        };
        if (action.toolName === 'prepare_purchase') {
            const order = action.newValue;
            const fresh = (0, purchasing_service_1.buildPurchase)(action.payload);
            if (!sameValue(order.sourceComponent, fresh.sourceComponent) || !sameValue(order.sourceSupplier, fresh.sourceSupplier))
                throw new Error('Les données fournisseur ou composant ont changé. Reformulez la demande.');
            (0, json_store_1.writeEntity)('orders', [order, ...(0, json_store_1.readEntity)('orders')]);
        }
        else if (action.toolName === 'create_supplier') {
            buildPreview('create_supplier', action.payload);
            (0, json_store_1.writeEntity)('suppliers', [action.newValue, ...(0, json_store_1.readEntity)('suppliers')]);
        }
        else if (action.toolName === 'update_order_status')
            replaceById('orders', action.oldValue, action.newValue);
        else if (action.toolName === 'set_machine_status')
            replaceById('machines', action.oldValue, action.newValue);
        else if (action.toolName === 'update_intervention' || action.toolName === 'assign_technician')
            replaceById('interventions', action.oldValue, action.newValue);
        else if (action.toolName === 'adjust_stock')
            replaceById('stock', action.oldValue, action.newValue);
        else if (action.toolName === 'declare_failure') {
            const before = action.oldValue.machine;
            const after = action.newValue;
            if ((0, json_store_1.readEntity)('interventions').some(r => r.id === after.intervention.id))
                throw new Error('Identifiant intervention déjà utilisé. Reformulez la demande.');
            replaceById('machines', before, after.machine);
            (0, json_store_1.writeEntity)('interventions', [after.intervention, ...(0, json_store_1.readEntity)('interventions')]);
            (0, json_store_1.writeEntity)('notifications', [after.notification, ...(0, json_store_1.readEntity)('notifications')]);
        }
        else if (action.toolName === 'create_intervention') {
            const records = (0, json_store_1.readEntity)('interventions');
            const created = action.newValue;
            if (records.some((record) => String(record.id) === String(created.id) || record.otNumber === created.otNumber))
                throw new Error("Un autre enregistrement utilise déjà l'identifiant proposé. Relancez l'action.");
            (0, json_store_1.writeEntity)('interventions', [created, ...records]);
        }
        else if (action.toolName === 'schedule_maintenance') {
            const records = (0, json_store_1.readEntity)('preventif');
            const created = action.newValue;
            if (records.some((record) => String(record.id) === String(created.id)))
                throw new Error("Un autre enregistrement utilise déjà l'identifiant proposé. Relancez l'action.");
            (0, json_store_1.writeEntity)('preventif', [created, ...records]);
        }
        else if (action.toolName === 'create_alert') {
            (0, json_store_1.writeEntity)('notifications', [action.newValue, ...(0, json_store_1.readEntity)('notifications')]);
        }
        action.status = 'confirmed';
        (0, json_store_1.writeEntity)('assistant_pending_actions', actions);
        const audit = (0, audit_service_1.appendAudit)(user, `Assistant IA: ${action.toolName}`, action.entity, action.entityId, action.oldValue, action.newValue);
        return { action, audit };
    }));
}
async function cancelPendingAction(actionId, user) {
    assertSupervisor(user);
    return (0, json_store_1.withWriteLock)(() => {
        const actions = (0, json_store_1.readEntity)('assistant_pending_actions');
        const action = actions.find((entry) => entry.id === actionId);
        if (!action || action.userId !== String(user.id))
            throw new Error('Action introuvable pour cet utilisateur.');
        if (action.status !== 'pending')
            throw new Error('Cette action a déjà été traitée.');
        action.status = 'cancelled';
        (0, json_store_1.writeEntity)('assistant_pending_actions', actions);
        return action;
    });
}
function assertSupervisor(user) {
    const current = (0, json_store_1.readEntity)('users').find(u => String(u.id) === String(user.id));
    if (!current || current.status !== 'Actif' || current.role !== 'Superviseur')
        throw new Error('Action réservée au superviseur actif.');
}
