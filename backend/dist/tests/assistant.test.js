"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const repositoryData = node_path_1.default.resolve(__dirname, '../../data_db');
const testData = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'gmao-agent-'));
for (const name of ['machines', 'stock', 'interventions', 'preventif', 'suppliers', 'users', 'notifications']) {
    node_fs_1.default.copyFileSync(node_path_1.default.join(repositoryData, `${name}_db.json`), node_path_1.default.join(testData, `${name}_db.json`));
}
for (const name of ['orders', 'audit_logs', 'assistant_pending_actions', 'assistant_conversations', 'credentials'])
    node_fs_1.default.writeFileSync(node_path_1.default.join(testData, `${name}_db.json`), '[]');
process.env.GMAO_DATA_DIR = testData;
const supervisor = { id: 1, email: 'superviseur@fablab.com', name: 'Admin Système', role: 'Superviseur', status: 'Actif' };
const technician = { id: 3, email: 'technicien@fablab.com', name: 'Technicien', role: 'Technicien', status: 'Actif' };
node_test_1.default.after(() => node_fs_1.default.rmSync(testData, { recursive: true, force: true }));
(0, node_test_1.default)('lecture réelle : machines, pannes et stocks', async () => {
    const { readTool } = await import('../src/services/assistant.service.js');
    const machines = readTool('search_machines', { query: 'FL-009' });
    strict_1.default.equal(machines.total, 1);
    strict_1.default.equal(machines.items[0].reference, 'FL-009');
    const unavailable = readTool('get_unavailable_machines', {});
    strict_1.default.ok(unavailable.items.every((x) => ['Hors service', 'En Panne', 'Ne marche pas', 'Hors service définitif'].includes(x.status)));
    const failures = readTool('get_failures', { machine: '', from: null, to: null });
    strict_1.default.ok(failures.total > 0);
    strict_1.default.match(failures.basis, /pas un registre exhaustif/);
    const stock = readTool('search_stock', { query: '', lowStockOnly: true });
    strict_1.default.ok(stock.total > 0);
    strict_1.default.ok(stock.items.every((x) => Number(x.quantity) <= Number(x.min)));
});
(0, node_test_1.default)('fournisseur associé et absence explicite', async () => {
    const { readTool } = await import('../src/services/assistant.service.js');
    const result = readTool('get_supplier_for_component', { component: 'PR-001' });
    strict_1.default.equal(result.supplier.name, '3D Distrib. Maroc');
    strict_1.default.equal(result.component.refSupplier, 'NZ-04-BR');
    strict_1.default.throws(() => readTool('get_supplier_for_component', { component: 'inexistant' }), /introuvable/);
});
(0, node_test_1.default)('une intervention est prévisualisée puis confirmée', async () => {
    const { createPendingAction, confirmPendingAction } = await import('../src/services/assistant-actions.service.js');
    const { readEntity } = await import('../src/services/json-store.js');
    const before = readEntity('interventions').length;
    const action = createPendingAction('create_intervention', { machine: 'FL-009', description: 'Contrôle broche', maintenanceType: 'Corrective', plannedDate: '2026-09-10', priority: 'A' }, supervisor);
    strict_1.default.equal(readEntity('interventions').length, before);
    await confirmPendingAction(action.id, supervisor);
    strict_1.default.equal(readEntity('interventions').length, before + 1);
});
(0, node_test_1.default)('statut, stock et permissions suivent la confirmation', async () => {
    const actions = await import('../src/services/assistant-actions.service.js');
    const { readEntity } = await import('../src/services/json-store.js');
    strict_1.default.throws(() => actions.createPendingAction('set_machine_status', { machine: 'FL-009', status: 'En maintenance', reason: 'Test' }, technician), /superviseur/);
    const status = actions.createPendingAction('set_machine_status', { machine: 'FL-009', status: 'En maintenance', reason: 'Test' }, supervisor);
    await actions.confirmPendingAction(status.id, supervisor);
    strict_1.default.equal(readEntity('machines').find(x => x.reference === 'FL-009').status, 'En maintenance');
    const before = readEntity('stock').find(x => x.reference === 'PR-001').quantity;
    const stock = actions.createPendingAction('adjust_stock', { stockItem: 'PR-001', mode: 'decrement', quantity: 2, reason: 'Consommation test' }, supervisor);
    strict_1.default.equal(readEntity('stock').find(x => x.reference === 'PR-001').quantity, before);
    await actions.confirmPendingAction(stock.id, supervisor);
    strict_1.default.equal(readEntity('stock').find(x => x.reference === 'PR-001').quantity, before - 2);
});
(0, node_test_1.default)('une action annulée ou expirée ne modifie rien', async () => {
    const actions = await import('../src/services/assistant-actions.service.js');
    const { readEntity, writeEntity } = await import('../src/services/json-store.js');
    const before = readEntity('machines').find(x => x.reference === 'FL-009').status;
    const cancelled = actions.createPendingAction('set_machine_status', { machine: 'FL-009', status: 'Hors service', reason: 'Test annulation' }, supervisor);
    await actions.cancelPendingAction(cancelled.id, supervisor);
    await strict_1.default.rejects(actions.confirmPendingAction(cancelled.id, supervisor), /déjà été traitée/);
    const expired = actions.createPendingAction('set_machine_status', { machine: 'FL-009', status: 'Hors service', reason: 'Test expiration' }, supervisor);
    const pending = readEntity('assistant_pending_actions');
    pending.find(a => a.id === expired.id).expiresAt = '2000-01-01T00:00:00.000Z';
    writeEntity('assistant_pending_actions', pending);
    await strict_1.default.rejects(actions.confirmPendingAction(expired.id, supervisor), /expiré/);
    strict_1.default.equal(readEntity('machines').find(x => x.reference === 'FL-009').status, before);
});
(0, node_test_1.default)('commande fournisseur génère un brouillon fidèle et un historique', async () => {
    const actions = await import('../src/services/assistant-actions.service.js');
    const { readEntity } = await import('../src/services/json-store.js');
    const action = actions.createPendingAction('prepare_purchase', { component: 'PR-001', quantity: 5, kind: 'commande' }, supervisor);
    const order = action.newValue;
    strict_1.default.equal(order.email.to, 'commande@3ddistrib.ma');
    strict_1.default.match(order.email.body, /NZ-04-BR/);
    strict_1.default.equal(order.totalEstimatedMAD, 125);
    strict_1.default.equal(readEntity('orders').length, 0);
    await actions.confirmPendingAction(action.id, supervisor);
    strict_1.default.equal(readEntity('orders').length, 1);
    strict_1.default.equal(readEntity('orders')[0].email.status, 'Brouillon — non envoyé');
});
(0, node_test_1.default)('la boucle sélectionne un tool puis répond depuis son résultat', async () => {
    const { runAssistant } = await import('../src/services/assistant.service.js');
    let calls = 0;
    const model = async (body) => {
        calls++;
        if (calls === 1)
            return { output: [{ type: 'function_call', name: 'search_machines', arguments: JSON.stringify({ query: 'FL-009' }), call_id: 'c1' }] };
        strict_1.default.ok(body.input.some((x) => x.type === 'function_call_output' && x.output.includes('FL-009')));
        return { output: [{ type: 'message', content: [{ type: 'output_text', text: 'La machine FL-009 est opérationnelle.' }] }] };
    };
    const result = await runAssistant([{ role: 'user', content: 'État FL-009 ?' }], supervisor, model);
    strict_1.default.deepEqual(result.usedTools, ['search_machines']);
    strict_1.default.match(result.message, /FL-009/);
});
(0, node_test_1.default)('une réponse incomplète sans sortie utile est relancée avec un budget supérieur', async () => {
    const { runAssistant } = await import('../src/services/assistant.service.js');
    let calls = 0;
    const model = async (body) => {
        calls++;
        if (calls === 1) {
            strict_1.default.equal(body.max_output_tokens, 2048);
            return { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [{ type: 'reasoning' }] };
        }
        if (calls === 2) {
            strict_1.default.equal(body.max_output_tokens, 4096);
            strict_1.default.equal(body.reasoning.effort, 'none');
            return { status: 'completed', output: [{ type: 'function_call', name: 'search_machines', arguments: '{"query":"panne"}', call_id: 'c2' }] };
        }
        return { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'Résultat vérifié.' }] }] };
    };
    const result = await runAssistant([{ role: 'user', content: 'Quelles machines sont en panne ?' }], supervisor, model);
    strict_1.default.equal(calls, 3);
    strict_1.default.deepEqual(result.usedTools, ['search_machines']);
});
(0, node_test_1.default)('le registre est limité aux lectures ou aux actions selon la demande', async () => {
    const { selectTools } = await import('../src/services/assistant.service.js');
    const read = selectTools([{ role: 'user', content: 'Quelles commandes sont en attente ?' }]);
    strict_1.default.equal(read.mutation, false);
    strict_1.default.ok(read.tools.some(t => t.name === 'get_orders'));
    strict_1.default.ok(!read.tools.some(t => t.name === 'prepare_purchase'));
    const write = selectTools([{ role: 'user', content: 'Prépare une commande de 5 buses.' }]);
    strict_1.default.equal(write.mutation, true);
    strict_1.default.ok(write.tools.some(t => t.name === 'prepare_purchase'));
    strict_1.default.ok(!write.tools.some(t => t.name === 'get_orders'));
    strict_1.default.ok(read.tools.length < 19);
    strict_1.default.ok(write.tools.length < 19);
});
