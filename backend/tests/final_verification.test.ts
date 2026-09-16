import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const supervisor = { id: 1, email: 'superviseur@fablab.com', name: 'Admin Système', role: 'Superviseur' as const, status: 'Actif' as const };

test('VERIFICATION TEST 3 — FL-009 real data match', async () => {
  const { readTool } = await import('../src/services/assistant.service.js');
  const { readEntity } = await import('../src/services/json-store.js');
  
  const result: any = readTool('search_machines', { query: 'FL-009' });
  assert.equal(result.total, 1);
  const found = result.items[0];
  assert.equal(found.reference, 'FL-009');
  
  const dbMachines = readEntity<any[]>('machines');
  const actualDBRecord = dbMachines.find(m => m.reference === 'FL-009');
  assert.equal(found.name, actualDBRecord.name);
  assert.equal(found.status, actualDBRecord.status);
  assert.equal(found.location, actualDBRecord.location);
});

test('VERIFICATION TEST 4 — Real stock low-stock data match', async () => {
  const { readTool } = await import('../src/services/assistant.service.js');
  const { readEntity } = await import('../src/services/json-store.js');
  
  const result: any = readTool('search_stock', { query: '', lowStockOnly: true });
  assert.ok(result.total > 0);
  
  const dbStock = readEntity<any[]>('stock');
  const actualLowInDB = dbStock.filter(s => Number(s.quantity) <= Number(s.min));
  assert.equal(result.total, actualLowInDB.length);
});

test('VERIFICATION TEST 5 — Real open interventions data match', async () => {
  const { readTool } = await import('../src/services/assistant.service.js');
  const { readEntity } = await import('../src/services/json-store.js');
  
  const result: any = readTool('list_interventions', { machine: null, status: null, technician: null });
  const dbInterventions = readEntity<any[]>('interventions');
  assert.equal(result.total, dbInterventions.length);
});

test('VERIFICATION TEST 6 — Unknown machine returns no match without hallucination', async () => {
  const { readTool } = await import('../src/services/assistant.service.js');
  const { resolveMachine } = await import('../src/services/gmao-read.service.js');
  
  const resolved = resolveMachine('TEST-MACHINE-999999');
  assert.equal(resolved, null);
  
  const result: any = readTool('search_machines', { query: 'TEST-MACHINE-999999' });
  assert.equal(result.total, 0);
  assert.equal(result.items.length, 0);
});

test('VERIFICATION TEST 7 — Real mutation requires confirmation and writes to JSON store', async () => {
  const { createPendingAction, confirmPendingAction } = await import('../src/services/assistant-actions.service.js');
  const { readEntity, writeEntity } = await import('../src/services/json-store.js');
  
  const beforeCount = readEntity<any[]>('interventions').length;
  
  // 1. Create pending action
  const action = createPendingAction('create_intervention', {
    machine: 'FL-009',
    description: 'AUDIT FINAL TEST',
    maintenanceType: 'Corrective',
    priority: 'C'
  }, supervisor);
  
  assert.equal(action.status, 'pending');
  assert.equal(readEntity<any[]>('interventions').length, beforeCount, 'Intervention must NOT be written before human confirmation');
  
  // 2. Confirm action
  await confirmPendingAction(action.id, supervisor);
  
  const updatedInterventions = readEntity<any[]>('interventions');
  assert.equal(updatedInterventions.length, beforeCount + 1, 'Intervention must be written after human confirmation');
  
  const testRecord = updatedInterventions.find(i => i.description === 'AUDIT FINAL TEST');
  assert.ok(testRecord);
  assert.equal(testRecord.equipmentId, 'FL-009');
  
  // 3. Clean up test record to preserve pristine database
  const cleaned = updatedInterventions.filter(i => i.description !== 'AUDIT FINAL TEST');
  writeEntity('interventions', cleaned);
  assert.equal(readEntity<any[]>('interventions').length, beforeCount);
});

test('VERIFICATION TEST 8 — Offline test throws clear technical error without fake responses', async () => {
  const { api } = await import('../../frontend/src/services/api.js');
  
  await assert.rejects(
    async () => {
      // Simulate backend offline fetch to /assistant/chat
      await api('/assistant/chat', { message: 'Quel est le statut de FL-009 ?' });
    },
    (err: any) => {
      return err instanceof Error && err.message.includes('Serveur Backend indisponible');
    }
  );
});

test('VERIFICATION TEST 9 — Security scan of production bundle', async () => {
  const docsPath = path.resolve(__dirname, '../../docs');
  const files = fs.readdirSync(docsPath, { recursive: true }) as string[];
  
  let secretFound = false;
  for (const file of files) {
    const fullPath = path.join(docsPath, file);
    if (fs.statSync(fullPath).isFile() && (file.endsWith('.js') || file.endsWith('.html'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('sk-proj') || content.includes('api.openai.com')) {
        secretFound = true;
      }
    }
  }
  assert.equal(secretFound, false, 'Production bundle must contain 0 OpenAI keys or direct OpenAI URLs');
});
