import { authHeaders } from './api';
import { REAL_MACHINES_DATA } from '../data/realMachinesData';
import { realStockItems, type StockItem } from '../data/realStockData';
import { initialOTs, initialDIs, type WorkOrder, type InterventionRequest } from '../data/otData';
import { preventifData } from '../data/amdecData';

import { initialFournisseurs } from '../data/fournisseursData';

const KEYS = {
  MACHINES: 'gmao_machines_v21',
  STOCK: 'gmao_stock_v21',
  INTERVENTIONS: 'gmao_interventions_v2',
  DIS: 'gmao_dis_v1',
  PREVENTIF: 'gmao_preventif_v5',
  DOCUMENTS: 'gmao_documents_v3',
  FOURNISSEURS: 'gmao_fournisseurs_v8',
  NOTIFICATIONS: 'gmao_notifications_v2',
  USERS: 'gmao_users',
  CURRENT_USER: 'gmao_current_user',
  AUDIT_LOGS: 'gmao_audit_logs_v1'
};

const notifyUpdate = () => {
  window.dispatchEvent(new Event('gmao_data_updated'));
};

const entityKeys: Record<string,string> = { machines: KEYS.MACHINES, stock: KEYS.STOCK, interventions: KEYS.INTERVENTIONS, dis: KEYS.DIS, preventif: KEYS.PREVENTIF, suppliers: KEYS.FOURNISSEURS, notifications: KEYS.NOTIFICATIONS, users: KEYS.USERS, audit_logs: KEYS.AUDIT_LOGS, documents: KEYS.DOCUMENTS };
const revisions: Record<string,string> = {};
let syncQueue: Promise<void> = Promise.resolve();
export const flushSync = () => syncQueue;
export async function refreshFromServer() {
  await flushSync();
  const results = await Promise.all(Object.entries(entityKeys).map(async ([entity,key]) => {
    const response = await fetch('/api/db/'+entity, { headers: authHeaders() });
    if (response.status === 403 && ['users','audit_logs'].includes(entity)) { localStorage.setItem(key,'[]'); return; }
    if (!response.ok) throw new Error('Impossible de charger les données serveur. Reconnectez-vous.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Données serveur invalides.');
    return {entity,key,data,revision:response.headers.get('X-Data-Revision') || ''};
  }));
  for (const item of results) if (item) { localStorage.setItem(item.key,JSON.stringify(item.data)); revisions[item.entity]=item.revision; }
  notifyUpdate();
}
const syncToDisk = (entity: string, data: unknown) => {
  if (!sessionStorage.getItem('gmao_token')) return;
  syncQueue = syncQueue.then(async () => {
    const response = await fetch('/api/db/'+entity, { method:'POST', headers:{'Content-Type':'application/json',...authHeaders(),'X-Data-Revision':revisions[entity] || ''}, body:JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Enregistrement refusé.');
    revisions[entity]=result.revision;
  }).catch(error => {
    window.dispatchEvent(new CustomEvent('gmao_sync_error',{detail:error.message}));
  });
};

export const db = {
  // ==================== MACHINES (CRUD) ====================
  getMachines: (): any[] => {
    try {
      const stored = localStorage.getItem(KEYS.MACHINES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading machines from storage:', e);
    }
    localStorage.setItem(KEYS.MACHINES, JSON.stringify(REAL_MACHINES_DATA));
    syncToDisk('machines', REAL_MACHINES_DATA);
    return REAL_MACHINES_DATA;
  },
  saveMachines: (data: any[]) => {
    try {
      localStorage.setItem(KEYS.MACHINES, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('machines', data);
    } catch (e) {
      console.error('Error saving machines to storage:', e);
    }
  },
  addMachine: (machine: any) => {
    const list = db.getMachines();
    const updated = [machine, ...list];
    db.saveMachines(updated);
    return updated;
  },
  updateMachine: (id: string | number, updatedData: any) => {
    const list = db.getMachines();
    const updated = list.map(m => m.id === id ? { ...m, ...updatedData } : m);
    db.saveMachines(updated);
    return updated;
  },
  deleteMachine: (id: string | number) => {
    const list = db.getMachines();
    const updated = list.filter(m => m.id !== id);
    db.saveMachines(updated);
    return updated;
  },

  // ==================== STOCK & PIÈCES (CRUD) ====================
  getStock: (): StockItem[] => {
    try {
      const stored = localStorage.getItem(KEYS.STOCK);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stock from storage:', e);
    }
    localStorage.setItem(KEYS.STOCK, JSON.stringify(realStockItems));
    syncToDisk('stock', realStockItems);
    return realStockItems;
  },
  saveStock: (data: StockItem[]) => {
    try {
      localStorage.setItem(KEYS.STOCK, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('stock', data);
    } catch (e) {
      console.error('Error saving stock to storage:', e);
    }
  },
  addStock: (item: StockItem) => {
    const list = db.getStock();
    const updated = [item, ...list];
    db.saveStock(updated);
    return updated;
  },
  updateStock: (id: string | number, updatedData: Partial<StockItem>) => {
    const list = db.getStock();
    const updated = list.map(s => s.id === id ? { ...s, ...updatedData } : s);
    db.saveStock(updated);
    return updated;
  },
  deleteStock: (id: string | number) => {
    const list = db.getStock();
    const updated = list.filter(s => s.id !== id);
    db.saveStock(updated);
    return updated;
  },

  // ==================== INTERVENTIONS / OT (CRUD) ====================
  getInterventions: (): WorkOrder[] => {
    try {
      const stored = localStorage.getItem(KEYS.INTERVENTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading interventions from storage:', e);
    }
    localStorage.setItem(KEYS.INTERVENTIONS, JSON.stringify(initialOTs));
    syncToDisk('interventions', initialOTs);
    return initialOTs;
  },
  saveInterventions: (data: WorkOrder[]) => {
    try {
      localStorage.setItem(KEYS.INTERVENTIONS, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('interventions', data);
    } catch (e) {
      console.error('Error saving interventions to storage:', e);
    }
  },
  addIntervention: (ot: WorkOrder) => {
    const list = db.getInterventions();
    const updated = [ot, ...list];
    db.saveInterventions(updated);
    return updated;
  },
  updateIntervention: (id: number, updatedData: Partial<WorkOrder>) => {
    const list = db.getInterventions();
    const updated = list.map(o => o.id === id ? { ...o, ...updatedData } : o);
    db.saveInterventions(updated);
    return updated;
  },
  deleteIntervention: (id: number) => {
    const list = db.getInterventions();
    const updated = list.filter(o => o.id !== id);
    db.saveInterventions(updated);
    return updated;
  },

  // ==================== DEMANDES D'INTERVENTION / DI (CRUD) ====================
  getDIs: (): InterventionRequest[] => {
    try {
      const stored = localStorage.getItem(KEYS.DIS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading DIs from storage:', e);
    }
    localStorage.setItem(KEYS.DIS, JSON.stringify(initialDIs));
    syncToDisk('dis', initialDIs);
    return initialDIs;
  },
  saveDIs: (data: InterventionRequest[]) => {
    try {
      localStorage.setItem(KEYS.DIS, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('dis', data);
    } catch (e) {
      console.error('Error saving DIs to storage:', e);
    }
  },
  addDI: (di: InterventionRequest) => {
    const list = db.getDIs();
    const updated = [di, ...list];
    db.saveDIs(updated);
    return updated;
  },
  updateDI: (id: number, updatedData: Partial<InterventionRequest>) => {
    const list = db.getDIs();
    const updated = list.map(d => d.id === id ? { ...d, ...updatedData } : d);
    db.saveDIs(updated);
    return updated;
  },
  deleteDI: (id: number) => {
    const list = db.getDIs();
    const updated = list.filter(d => d.id !== id);
    db.saveDIs(updated);
    return updated;
  },

  // ==================== PLAN PRÉVENTIF (CRUD) ====================
  getPreventif: () => {
    try {
      const stored = localStorage.getItem(KEYS.PREVENTIF);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading preventif from storage:', e);
    }
    localStorage.setItem(KEYS.PREVENTIF, JSON.stringify(preventifData));
    syncToDisk('preventif', preventifData);
    return preventifData;
  },
  savePreventif: (data: any[]) => {
    try {
      localStorage.setItem(KEYS.PREVENTIF, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('preventif', data);
    } catch (e) {
      console.error('Error saving preventif to storage:', e);
    }
  },

  // ==================== DOCUMENTS GED (CRUD) ====================
  getDocuments: () => {
    try {
      const stored = localStorage.getItem(KEYS.DOCUMENTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading documents from storage:', e);
    }
    return [];
  },
  saveDocuments: (data: any[]) => {
    try {
      localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('documents', data);
    } catch (e) {
      console.error('Error saving documents to storage:', e);
    }
  },

  // ==================== FOURNISSEURS (CRUD) ====================
  getFournisseurs: () => {
    try {
      const stored = localStorage.getItem(KEYS.FOURNISSEURS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading fournisseurs from storage:', e);
    }
    localStorage.setItem(KEYS.FOURNISSEURS, JSON.stringify(initialFournisseurs));
    syncToDisk('suppliers', initialFournisseurs);
    return initialFournisseurs;
  },
  saveFournisseurs: (data: any[]) => {
    try {
      localStorage.setItem(KEYS.FOURNISSEURS, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('suppliers', data);
    } catch (e) {
      console.error('Error saving fournisseurs to storage:', e);
    }
  },

  // ==================== NOTIFICATIONS (CRUD & BULK) ====================
  getNotifications: (): any[] | null => {
    try {
      const stored = localStorage.getItem(KEYS.NOTIFICATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading notifications from storage:', e);
    }
    return null;
  },
  saveNotifications: (data: any[]) => {
    try {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(data));
      notifyUpdate();
      syncToDisk('notifications', data);
    } catch (e) {
      console.error('Error saving notifications to storage:', e);
    }
  },
  markAllNotificationsRead: () => {
    const list = db.getNotifications() || [];
    const updated = list.map((n: any) => ({ ...n, read: true }));
    db.saveNotifications(updated);
    return updated;
  },
  deleteAllNotifications: () => {
    db.saveNotifications([]);
    return [];
  },
  deleteBulkNotifications: (ids: string[]) => {
    const list = db.getNotifications() || [];
    const idSet = new Set(ids);
    const updated = list.filter((n: any) => !idSet.has(n.id));
    db.saveNotifications(updated);
    return updated;
  },

  // ==================== USERS & AUTH ====================
  getUsers: () => {
    try {
      const stored = localStorage.getItem(KEYS.USERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading users:', e);
    }
    return [];
  },
  saveUsers: (users: any[]) => {
    try {
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      notifyUpdate();
      syncToDisk('users', users);
    } catch (e) {
      console.error('Error saving users:', e);
    }
  },
  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem(KEYS.CURRENT_USER);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading current user:', e);
    }
    return null;
  },
  setCurrentUser: (user: any) => {
    try {
      if (user) {
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(KEYS.CURRENT_USER);
      }
      notifyUpdate();
    } catch (e) {
      console.error('Error setting current user:', e);
    }
  },

  // ==================== AUDIT LOGS ====================
  getAuditLogs: () => {
    try {
      const stored = localStorage.getItem(KEYS.AUDIT_LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading audit logs:', e);
    }
    return [
      { id: '1', date: new Date().toISOString(), user: 'Admin Système', action: 'Initialisation GMAO', details: 'Chargement des registres officiels FabLab' }
    ];
  },
  addAuditLog: (action: string, details: string, userName: string = 'Utilisateur') => {
    try {
      const logs = db.getAuditLogs();
      const newLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        user: userName,
        action,
        details
      };
      const updated = [newLog, ...logs].slice(0, 100);
      localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(updated));
      notifyUpdate();
    } catch (e) {
      console.error('Error adding audit log:', e);
    }
  }
};
