"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTITY_FILES = exports.DATA_DIR = void 0;
exports.atomic = atomic;
exports.isEntityName = isEntityName;
exports.readEntity = readEntity;
exports.writeEntity = writeEntity;
exports.withWriteLock = withWriteLock;
exports.stableValue = stableValue;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
exports.DATA_DIR = process.env.GMAO_DATA_DIR
    ? path_1.default.resolve(process.env.GMAO_DATA_DIR)
    : fs_1.default.existsSync(path_1.default.join(process.cwd(), 'data_db', 'machines_db.json'))
        ? path_1.default.join(process.cwd(), 'data_db')
        : fs_1.default.existsSync(path_1.default.resolve(__dirname, '../../../data_db/machines_db.json'))
            ? path_1.default.resolve(__dirname, '../../../data_db')
            : (process.env.VERCEL ? '/tmp/data_db' : path_1.default.resolve(__dirname, '../../../data_db'));
try {
    if (!fs_1.default.existsSync(exports.DATA_DIR)) {
        fs_1.default.mkdirSync(exports.DATA_DIR, { recursive: true });
    }
}
catch (e) {
    console.warn('[GMAO Store] Warning creating DATA_DIR:', e);
}
exports.ENTITY_FILES = {
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
};
let writeQueue = Promise.resolve();
let transaction = null;
const journalPath = path_1.default.join(exports.DATA_DIR, '.transaction.json');
// Roll forward a fully prepared local transaction after a process interruption.
try {
    if (fs_1.default.existsSync(journalPath)) {
        const entries = JSON.parse(fs_1.default.readFileSync(journalPath, 'utf8'));
        for (const [entity, value] of entries) {
            if (isEntityName(entity))
                writeEntity(entity, value);
        }
        fs_1.default.unlinkSync(journalPath);
    }
}
catch (e) {
    console.warn('[GMAO Store] Journal check warning:', e);
}
function atomic(operation) {
    if (transaction)
        throw new Error('Transaction imbriquée interdite.');
    transaction = new Map();
    try {
        const result = operation();
        const entries = [...transaction.entries()];
        fs_1.default.mkdirSync(exports.DATA_DIR, { recursive: true });
        const temp = `${journalPath}.tmp`;
        fs_1.default.writeFileSync(temp, JSON.stringify(entries), 'utf8');
        fs_1.default.renameSync(temp, journalPath);
        transaction = null;
        for (const [entity, value] of entries)
            writeEntity(entity, value);
        fs_1.default.unlinkSync(journalPath);
        return result;
    }
    finally {
        transaction = null;
    }
}
function isEntityName(value) {
    return Object.prototype.hasOwnProperty.call(exports.ENTITY_FILES, value);
}
function readEntity(entity) {
    if (transaction?.has(entity))
        return structuredClone(transaction.get(entity));
    const fileName = exports.ENTITY_FILES[entity];
    const targetPath = path_1.default.join(exports.DATA_DIR, fileName);
    if (fs_1.default.existsSync(targetPath)) {
        try {
            const data = JSON.parse(fs_1.default.readFileSync(targetPath, 'utf8'));
            if (Array.isArray(data) || (data && typeof data === 'object'))
                return data;
        }
        catch { /* fallthrough */ }
    }
    const seedDirs = [
        path_1.default.resolve(process.cwd(), 'data_db'),
        path_1.default.resolve(process.cwd(), 'backend/data_db'),
        path_1.default.resolve(__dirname, '../../data_db'),
        path_1.default.resolve(__dirname, '../../../data_db'),
        path_1.default.resolve(__dirname, '../data_db'),
    ];
    for (const dir of seedDirs) {
        const seedPath = path_1.default.join(dir, fileName);
        if (fs_1.default.existsSync(seedPath)) {
            try {
                const content = fs_1.default.readFileSync(seedPath, 'utf8');
                const parsed = JSON.parse(content);
                try {
                    if (!fs_1.default.existsSync(exports.DATA_DIR))
                        fs_1.default.mkdirSync(exports.DATA_DIR, { recursive: true });
                    fs_1.default.writeFileSync(targetPath, content, 'utf8');
                }
                catch { /* ignore seed copy warning */ }
                return parsed;
            }
            catch { /* try next candidate */ }
        }
    }
    return [];
}
function writeEntity(entity, value) {
    if (transaction) {
        transaction.set(entity, structuredClone(value));
        return;
    }
    try {
        if (!fs_1.default.existsSync(exports.DATA_DIR))
            fs_1.default.mkdirSync(exports.DATA_DIR, { recursive: true });
        const filePath = path_1.default.join(exports.DATA_DIR, exports.ENTITY_FILES[entity]);
        const tempPath = `${filePath}.${process.pid}.${crypto_1.default.randomUUID()}.tmp`;
        fs_1.default.writeFileSync(tempPath, JSON.stringify(value, null, 2), 'utf8');
        fs_1.default.renameSync(tempPath, filePath);
    }
    catch (e) {
        console.warn(`[GMAO Store] Warning writing entity ${entity}:`, e);
    }
}
function withWriteLock(operation) {
    const next = writeQueue.then(operation, operation);
    writeQueue = next.then(() => undefined, () => undefined);
    return next;
}
function stableValue(value) {
    return JSON.stringify(value, Object.keys(value && typeof value === 'object' ? value : {}).sort());
}
