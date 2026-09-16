"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const supervisor = { id: 1, email: 'superviseur@fablab.com', name: 'Admin Système', role: 'Superviseur', status: 'Actif' };
(0, node_test_1.default)('VERIFICATION TEST 3 — FL-009 real data match', async () => {
    const { readTool } = await import('../src/services/assistant.service.js');
    const { readEntity } = await import('../src/services/json-store.js');
    const result = readTool('search_machines', { query: 'FL-009' });
    strict_1.default.equal(result.total, 1);
    const found = result.items[0];
    strict_1.default.equal(found.reference, 'FL-009');
    const dbMachines = readEntity('machines');
    const actualDBRecord = dbMachines.find(m => m.reference === 'FL-009');
    strict_1.default.equal(found.name, actualDBRecord.name);
    strict_1.default.equal(found.status, actualDBRecord.status);
    strict_1.default.equal(found.location, actualDBRecord.location);
});
(0, node_test_1.default)('VERIFICATION TEST 4 — Real stock low-stock data match', async () => {
    const { readTool } = await import('../src/services/assistant.service.js');
    const { readEntity } = await import('../src/services/json-store.js');
    const result = readTool('search_stock', { query: '', lowStockOnly: true });
    strict_1.default.ok(result.total > 0);
    const dbStock = readEntity('stock');
    const actualLowInDB = dbStock.filter(s => Number(s.quantity) <= Number(s.min));
    strict_1.default.equal(result.total, actualLowInDB.length);
});
(0, node_test_1.default)('VERIFICATION TEST 5 — Real open interventions data match', async () => {
    const { readTool } = await import('../src/services/assistant.service.js');
    const { readEntity } = await import('../src/services/json-store.js');
    const result = readTool('list_interventions', { machine: null, status: null, technician: null });
    const dbInterventions = readEntity('interventions');
    strict_1.default.equal(result.total, dbInterventions.length);
});
(0, node_test_1.default)('VERIFICATION TEST 6 — Unknown machine returns no match without hallucination', async () => {
    const { readTool } = await import('../src/services/assistant.service.js');
    const { resolveMachine } = await import('../src/services/gmao-read.service.js');
    const resolved = resolveMachine('TEST-MACHINE-999999');
    strict_1.default.equal(resolved, null);
    const result = readTool('search_machines', { query: 'TEST-MACHINE-999999' });
    strict_1.default.equal(result.total, 0);
    strict_1.default.equal(result.items.length, 0);
});
(0, node_test_1.default)('VERIFICATION TEST 7 — Real mutation requires confirmation and writes to JSON store', async () => {
    const { createPendingAction, confirmPendingAction } = await import('../src/services/assistant-actions.service.js');
    const { readEntity, writeEntity } = await import('../src/services/json-store.js');
    const beforeCount = readEntity('interventions').length;
    // 1. Create pending action
    const action = createPendingAction('create_intervention', {
        machine: 'FL-009',
        description: 'AUDIT FINAL TEST',
        maintenanceType: 'Corrective',
        priority: 'C'
    }, supervisor);
    strict_1.default.equal(action.status, 'pending');
    strict_1.default.equal(readEntity('interventions').length, beforeCount, 'Intervention must NOT be written before human confirmation');
    // 2. Confirm action
    await confirmPendingAction(action.id, supervisor);
    const updatedInterventions = readEntity('interventions');
    strict_1.default.equal(updatedInterventions.length, beforeCount + 1, 'Intervention must be written after human confirmation');
    const testRecord = updatedInterventions.find(i => i.description === 'AUDIT FINAL TEST');
    strict_1.default.ok(testRecord);
    strict_1.default.equal(testRecord.equipmentId, 'FL-009');
    // 3. Clean up test record to preserve pristine database
    const cleaned = updatedInterventions.filter(i => i.description !== 'AUDIT FINAL TEST');
    writeEntity('interventions', cleaned);
    strict_1.default.equal(readEntity('interventions').length, beforeCount);
});
(0, node_test_1.default)('VERIFICATION TEST 8 — Offline test throws clear technical error without fake responses', async () => {
    const { api } = await import('../../frontend/src/services/api.js');
    await strict_1.default.rejects(async () => {
        // Simulate backend offline fetch to /assistant/chat
        await api('/assistant/chat', { message: 'Quel est le statut de FL-009 ?' });
    }, (err) => {
        return err instanceof Error && err.message.includes('Serveur Backend indisponible');
    });
});
(0, node_test_1.default)('VERIFICATION TEST 9 — Security scan of production bundle', async () => {
    const docsPath = node_path_1.default.resolve(__dirname, '../../docs');
    const files = node_fs_1.default.readdirSync(docsPath, { recursive: true });
    let secretFound = false;
    for (const file of files) {
        const fullPath = node_path_1.default.join(docsPath, file);
        if (node_fs_1.default.statSync(fullPath).isFile() && (file.endsWith('.js') || file.endsWith('.html'))) {
            const content = node_fs_1.default.readFileSync(fullPath, 'utf8');
            if (content.includes('sk-proj') || content.includes('api.openai.com')) {
                secretFound = true;
            }
        }
    }
    strict_1.default.equal(secretFound, false, 'Production bundle must contain 0 OpenAI keys or direct OpenAI URLs');
});
