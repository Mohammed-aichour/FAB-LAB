import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const DATA_DIR = process.env.GMAO_DATA_DIR 
  ? path.resolve(process.env.GMAO_DATA_DIR) 
  : process.env.VERCEL 
    ? '/tmp/data_db' 
    : path.resolve(__dirname, '../../../data_db');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[GMAO Store] Warning creating DATA_DIR:', e);
}

export const ENTITY_FILES = {
  machines: 'machines_db.json',
  stock: 'stock_db.json',
  interventions: 'interventions_db.json',
  dis: 'dis_db.json',
  preventif: 'preventif_db.json',
  amdec: 'amdec_db.json',
  suppliers: 'suppliers_db.json',
  notifications: 'notifications_db.json',
  users: 'users_db.json',
  audit_logs: 'audit_logs_db.json',
  assistant_pending_actions: 'assistant_pending_actions_db.json',
  assistant_conversations: 'assistant_conversations_db.json',
  credentials: 'credentials_db.json',
  orders: 'orders_db.json',
  documents: 'documents_db.json',
} as const;

export type EntityName = keyof typeof ENTITY_FILES;

let writeQueue: Promise<unknown> = Promise.resolve();
let transaction: Map<EntityName, unknown> | null = null;

const journalPath = path.join(DATA_DIR, '.transaction.json');

// Roll forward a fully prepared local transaction after a process interruption.
try {
  if (fs.existsSync(journalPath)) {
    const entries = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    for (const [entity, value] of entries) {
      if (isEntityName(entity)) writeEntity(entity, value);
    }
    fs.unlinkSync(journalPath);
  }
} catch (e) {
  console.warn('[GMAO Store] Journal check warning:', e);
}

export function atomic<T>(operation: () => T): T {
  if (transaction) throw new Error('Transaction imbriquée interdite.');
  transaction = new Map();
  try {
    const result = operation();
    const entries = [...transaction.entries()];
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const temp = `${journalPath}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(entries), 'utf8');
    fs.renameSync(temp, journalPath);
    transaction = null;
    for (const [entity, value] of entries) writeEntity(entity, value);
    fs.unlinkSync(journalPath);
    return result;
  } finally { transaction = null; }
}

export function isEntityName(value: string): value is EntityName {
  return Object.prototype.hasOwnProperty.call(ENTITY_FILES, value);
}

export function readEntity<T = unknown[]>(entity: EntityName): T {
  if (transaction?.has(entity)) return structuredClone(transaction.get(entity)) as T;
  const filePath = path.join(DATA_DIR, ENTITY_FILES[entity]);
  if (fs.existsSync(filePath)) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T; } catch { /* fallthrough */ }
  }
  const rootFilePath = path.resolve(__dirname, '../../../data_db', ENTITY_FILES[entity]);
  if (fs.existsSync(rootFilePath)) {
    try { return JSON.parse(fs.readFileSync(rootFilePath, 'utf8')) as T; } catch { /* fallthrough */ }
  }
  return [] as T;
}

export function writeEntity(entity: EntityName, value: unknown): void {
  if (transaction) { transaction.set(entity, structuredClone(value)); return; }
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, ENTITY_FILES[entity]);
    const tempPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (e) {
    console.warn(`[GMAO Store] Warning writing entity ${entity}:`, e);
  }
}

export function withWriteLock<T>(operation: () => Promise<T> | T): Promise<T> {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
}

export function stableValue(value: unknown): string {
  return JSON.stringify(value, Object.keys(value && typeof value === 'object' ? value as object : {}).sort());
}
