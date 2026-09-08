import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repositoryData = path.resolve(__dirname,'../../data_db');
const testData = fs.mkdtempSync(path.join(os.tmpdir(),'gmao-agent-'));
for (const name of ['machines','stock','interventions','preventif','suppliers','users','notifications']) {
  fs.copyFileSync(path.join(repositoryData,`${name}_db.json`),path.join(testData,`${name}_db.json`));
}
for (const name of ['orders','audit_logs','assistant_pending_actions','assistant_conversations','credentials']) fs.writeFileSync(path.join(testData,`${name}_db.json`),'[]');
process.env.GMAO_DATA_DIR = testData;

const supervisor = { id:1,email:'superviseur@fablab.com',name:'Admin Système',role:'Superviseur',status:'Actif' };
const technician = { id:3,email:'technicien@fablab.com',name:'Technicien',role:'Technicien',status:'Actif' };

test.after(()=>fs.rmSync(testData,{recursive:true,force:true}));

test('lecture réelle : machines, pannes et stocks', async () => {
  const { readTool } = await import('../src/services/assistant.service.js');
  const machines:any = readTool('search_machines',{query:'FL-009'});
  assert.equal(machines.total,1); assert.equal(machines.items[0].reference,'FL-009');
  const unavailable:any = readTool('get_unavailable_machines',{});
  assert.ok(unavailable.items.every((x:any)=>['Hors service','En Panne','Ne marche pas','Hors service définitif'].includes(x.status)));
  const failures:any = readTool('get_failures',{machine:'',from:null,to:null});
  assert.ok(failures.total > 0); assert.match(failures.basis,/pas un registre exhaustif/);
  const stock:any = readTool('search_stock',{query:'',lowStockOnly:true});
  assert.ok(stock.total > 0); assert.ok(stock.items.every((x:any)=>Number(x.quantity)<=Number(x.min)));
});

test('fournisseur associé et absence explicite', async () => {
  const { readTool } = await import('../src/services/assistant.service.js');
  const result:any = readTool('get_supplier_for_component',{component:'PR-001'});
  assert.equal(result.supplier.name,'3D Distrib. Maroc'); assert.equal(result.component.refSupplier,'NZ-04-BR');
  assert.throws(()=>readTool('get_supplier_for_component',{component:'inexistant'}),/introuvable/);
});

test('une intervention est prévisualisée puis confirmée', async () => {
  const { createPendingAction, confirmPendingAction } = await import('../src/services/assistant-actions.service.js');
  const { readEntity } = await import('../src/services/json-store.js');
  const before=readEntity<any[]>('interventions').length;
  const action=createPendingAction('create_intervention',{machine:'FL-009',description:'Contrôle broche',maintenanceType:'Corrective',plannedDate:'2026-09-10',priority:'A'},supervisor);
  assert.equal(readEntity<any[]>('interventions').length,before);
  await confirmPendingAction(action.id,supervisor);
  assert.equal(readEntity<any[]>('interventions').length,before+1);
});

test('statut, stock et permissions suivent la confirmation', async () => {
  const actions=await import('../src/services/assistant-actions.service.js');
  const { readEntity }=await import('../src/services/json-store.js');
  assert.throws(()=>actions.createPendingAction('set_machine_status',{machine:'FL-009',status:'En maintenance',reason:'Test'},technician),/superviseur/);
  const status=actions.createPendingAction('set_machine_status',{machine:'FL-009',status:'En maintenance',reason:'Test'},supervisor);
  await actions.confirmPendingAction(status.id,supervisor);
  assert.equal(readEntity<any[]>('machines').find(x=>x.reference==='FL-009').status,'En maintenance');
  const before=readEntity<any[]>('stock').find(x=>x.reference==='PR-001').quantity;
  const stock=actions.createPendingAction('adjust_stock',{stockItem:'PR-001',mode:'decrement',quantity:2,reason:'Consommation test'},supervisor);
  assert.equal(readEntity<any[]>('stock').find(x=>x.reference==='PR-001').quantity,before);
  await actions.confirmPendingAction(stock.id,supervisor);
  assert.equal(readEntity<any[]>('stock').find(x=>x.reference==='PR-001').quantity,before-2);
});

test('une action annulée ou expirée ne modifie rien', async () => {
  const actions=await import('../src/services/assistant-actions.service.js');
  const { readEntity, writeEntity }=await import('../src/services/json-store.js');
  const before=readEntity<any[]>('machines').find(x=>x.reference==='FL-009').status;
  const cancelled=actions.createPendingAction('set_machine_status',{machine:'FL-009',status:'Hors service',reason:'Test annulation'},supervisor);
  await actions.cancelPendingAction(cancelled.id,supervisor);
  await assert.rejects(actions.confirmPendingAction(cancelled.id,supervisor),/déjà été traitée/);
  const expired=actions.createPendingAction('set_machine_status',{machine:'FL-009',status:'Hors service',reason:'Test expiration'},supervisor);
  const pending=readEntity<any[]>('assistant_pending_actions');
  pending.find(a=>a.id===expired.id).expiresAt='2000-01-01T00:00:00.000Z'; writeEntity('assistant_pending_actions',pending);
  await assert.rejects(actions.confirmPendingAction(expired.id,supervisor),/expiré/);
  assert.equal(readEntity<any[]>('machines').find(x=>x.reference==='FL-009').status,before);
});

test('commande fournisseur génère un brouillon fidèle et un historique', async () => {
  const actions=await import('../src/services/assistant-actions.service.js');
  const { readEntity }=await import('../src/services/json-store.js');
  const action=actions.createPendingAction('prepare_purchase',{component:'PR-001',quantity:5,kind:'commande'},supervisor);
  const order:any=action.newValue;
  assert.equal(order.email.to,'commande@3ddistrib.ma'); assert.match(order.email.body,/NZ-04-BR/); assert.equal(order.totalEstimatedMAD,125);
  assert.equal(readEntity<any[]>('orders').length,0);
  await actions.confirmPendingAction(action.id,supervisor);
  assert.equal(readEntity<any[]>('orders').length,1); assert.equal(readEntity<any[]>('orders')[0].email.status,'Brouillon — non envoyé');
});

test('la boucle sélectionne un tool puis répond depuis son résultat', async () => {
  const { runAssistant }=await import('../src/services/assistant.service.js');
  let calls=0;
  const model=async (body:any) => {
    calls++;
    if(calls===1) return {output:[{type:'function_call',name:'search_machines',arguments:JSON.stringify({query:'FL-009'}),call_id:'c1'}]};
    assert.ok(body.input.some((x:any)=>x.type==='function_call_output' && x.output.includes('FL-009')));
    return {output:[{type:'message',content:[{type:'output_text',text:'La machine FL-009 est opérationnelle.'}]}]};
  };
  const result=await runAssistant([{role:'user',content:'État FL-009 ?'}],supervisor,model);
  assert.deepEqual(result.usedTools,['search_machines']); assert.match(result.message,/FL-009/);
});

test('une réponse incomplète sans sortie utile est relancée avec un budget supérieur', async () => {
  const { runAssistant }=await import('../src/services/assistant.service.js');
  let calls=0;
  const model=async (body:any) => {
    calls++;
    if(calls===1) {
      assert.equal(body.max_output_tokens,2048);
      return {status:'incomplete',incomplete_details:{reason:'max_output_tokens'},output:[{type:'reasoning'}]};
    }
    if(calls===2) {
      assert.equal(body.max_output_tokens,4096);
      return {status:'completed',output:[{type:'function_call',name:'search_machines',arguments:'{"query":"panne"}',call_id:'c2'}]};
    }
    return {status:'completed',output:[{type:'message',content:[{type:'output_text',text:'Résultat vérifié.'}]}]};
  };
  const result=await runAssistant([{role:'user',content:'Quelles machines sont en panne ?'}],supervisor,model);
  assert.equal(calls,3); assert.deepEqual(result.usedTools,['search_machines']);
});

test('le registre est limité aux lectures ou aux actions selon la demande', async () => {
  const { selectTools }=await import('../src/services/assistant.service.js');
  const read=selectTools([{role:'user',content:'Quelles commandes sont en attente ?'}]);
  assert.equal(read.mutation,false); assert.ok(read.tools.some(t=>t.name==='get_orders')); assert.ok(!read.tools.some(t=>t.name==='prepare_purchase'));
  const write=selectTools([{role:'user',content:'Prépare une commande de 5 buses.'}]);
  assert.equal(write.mutation,true); assert.ok(write.tools.some(t=>t.name==='prepare_purchase')); assert.ok(!write.tools.some(t=>t.name==='get_orders'));
  assert.ok(read.tools.length < 19); assert.ok(write.tools.length < 19);
});

test('résolveur universel de machines et cohérence entre tous les outils', async () => {
  const { resolveMachine, legacyReadTool } = await import('../src/services/gmao-read.service.js');
  const { readTool } = await import('../src/services/assistant.service.js');
  const { createPendingAction } = await import('../src/services/assistant-actions.service.js');

  // Test 1: Resolution variations
  const queries = [
    'FL-009',
    'Fraiseuse CNC TPROD 6060',
    'fraiseuse cnc tprod',
    'FRAISEUSE CNC TPROD 6060',
    'Fraiseuse CNC 3 Axes (FL-009)',
    'Quelle est la maintenance préventive de FL-009 ?',
  ];
  for (const q of queries) {
    const m = resolveMachine(q);
    assert.ok(m, `Doit résoudre la machine pour '${q}'`);
    assert.equal(m.reference, 'FL-009');
  }

  // Non-existent machine
  assert.equal(resolveMachine('FL-999'), null);
  assert.equal(resolveMachine('Machine Inexistante FL-999'), null);

  // Test 2: Tools using resolved machine
  const m1: any = readTool('search_machines', { query: 'FL-009' });
  assert.equal(m1.items[0].reference, 'FL-009');

  const prev: any = readTool('get_maintenance_period', { machine: 'FL-009', from: null, to: null });
  assert.ok(prev.items.length > 0, 'Maintenance préventive pour FL-009 doit retourner des tâches');

  const fail: any = readTool('get_failures', { machine: 'FL-009', from: null, to: null });
  assert.ok(fail.total >= 0);

  const inter: any = readTool('list_interventions', { machine: 'FL-009', status: null, technician: null });
  assert.ok(Array.isArray(inter.items));

  const fa: any = readTool('get_failure_analysis', { machine: 'FL-009' });
  assert.ok(fa);

  const rec: any = readTool('get_maintenance_recommendations', { machine: 'FL-009', timeframe: null });
  assert.ok(rec);

  // Non-existent machine queries return clean empty/no results
  const emptyPrev: any = readTool('get_maintenance_period', { machine: 'FL-999', from: null, to: null });
  assert.equal(emptyPrev.items.length, 0);

  // Test 3: Action tool with resolved machine and pending action
  const action = createPendingAction('create_intervention', { machine: 'Fraiseuse CNC 3 Axes (FL-009)', description: 'Panne moteur' }, supervisor);
  assert.equal(action.status, 'pending');
  const val: any = action.newValue;
  assert.equal(val.equipmentId, 'FL-009');
  assert.equal(val.equipmentName, 'Fraiseuse CNC TPROD 6060');

  // Action tool with non-existent machine throws error
  assert.throws(() => createPendingAction('create_intervention', { machine: 'FL-999', description: 'Test' }, supervisor), /introuvable/);
});

