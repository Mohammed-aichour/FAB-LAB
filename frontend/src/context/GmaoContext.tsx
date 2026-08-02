import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { db } from "../services/db";

export interface GmaoNotification {
  id: string;
  type: "machine" | "maintenance" | "stock" | "preventif" | "bt" | "user" | "info" | "alert";
  title: string;
  message: string;
  icon: string;
  color: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
}

export interface KpiData {
  mtbfHours: number;
  mttrHours: number;
  availabilityRate: number;
  totalCostMAD: number;
  operationalMachinesCount: number;
  downMachinesCount: number;
  lowStockItemsCount: number;
  overduePreventiveCount: number;
}

interface GmaoContextValue {
  machines: any[];
  stock: any[];
  interventions: any[];
  preventif: any[];
  notifications: GmaoNotification[];
  users: any[];
  auditLogs: AuditLog[];
  kpis: KpiData;
  refresh: () => void;
  addMachine: (machine: any) => void;
  updateMachine: (id: string, data: Partial<any>) => void;
  deleteMachine: (id: string) => void;
  addStockItem: (item: any) => void;
  updateStockItem: (id: string, data: Partial<any>) => void;
  deleteStockItem: (id: string) => void;
  addIntervention: (ot: any) => void;
  updateIntervention: (id: number, data: Partial<any>) => void;
  deleteIntervention: (id: number) => void;
  addPreventif: (task: any) => void;
  updatePreventif: (id: any, data: Partial<any>) => void;
  deletePreventif: (id: any) => void;
  markAllRead: () => void;
  deleteAllNotifications: () => void;
  deleteBulkNotifications: (ids: string[]) => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<GmaoNotification, "id" | "createdAt" | "read">) => void;
  addUser: (user: any) => void;
  updateUser: (id: any, data: Partial<any>) => void;
  deleteUser: (id: any) => void;
  addAuditLog: (action: string, details: string) => void;
}

const GmaoContext = createContext<GmaoContextValue | null>(null);

const makeNotif = (
  type: GmaoNotification["type"],
  title: string,
  message: string,
  icon: string,
  color: string
): GmaoNotification => ({
  id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  type,
  title,
  message,
  icon,
  color,
  read: false,
  createdAt: new Date().toISOString(),
});

export const GmaoProvider = ({ children }: { children: ReactNode }) => {
  const [machines, setMachines] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [preventif, setPreventif] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<GmaoNotification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const refresh = useCallback(() => {
    setMachines(db.getMachines());
    setStock(db.getStock());
    setInterventions(db.getInterventions());
    setPreventif(db.getPreventif());
    setNotifications((db.getNotifications() || []) as GmaoNotification[]);
    setUsers(db.getUsers() || []);
    setAuditLogs(db.getAuditLogs() || []);
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("gmao_data_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("gmao_data_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  const persistNotif = useCallback((n: GmaoNotification) => {
    const existing: GmaoNotification[] = (db.getNotifications() || []) as GmaoNotification[];
    const updated = [n, ...existing].slice(0, 200);
    try {
      localStorage.setItem('gmao_notifications_v2', JSON.stringify(updated));
      fetch('/api/db/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) }).catch(() => {});
    } catch (_) {}
    setNotifications(updated);
  }, []);

  const addNotification = useCallback(
    (n: Omit<GmaoNotification, "id" | "createdAt" | "read">) => {
      persistNotif(makeNotif(n.type, n.title, n.message, n.icon, n.color));
    },
    [persistNotif]
  );

  const getCurrentUserName = () => {
    const u = db.getCurrentUser();
    return u ? (u.name || u.email) : 'Magasinier / Resp. GMAO';
  };

  const addAuditLog = useCallback((action: string, details: string) => {
    db.addAuditLog(action, details, getCurrentUserName());
    setAuditLogs(db.getAuditLogs() || []);
  }, []);

  const addMachine = useCallback((machine: any) => {
    db.addMachine(machine);
    persistNotif(makeNotif("machine", "Nouvel équipement ajouté", `${machine.name || machine.reference} a été enregistré dans le parc.`, "🔧", "text-blue-500"));
    addAuditLog("Ajout Machine", `Ajout de la machine ${machine.reference || machine.name}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const updateMachine = useCallback((id: string, data: Partial<any>) => {
    db.updateMachine(id, data);
    if (data.status === "Hors service" || data.status === "En Panne") {
      persistNotif(makeNotif("alert", "Machine hors service", `L'équipement ${id} est signalé en panne/hors service.`, "⚠️", "text-rose-500"));
    }
    addAuditLog("Mise à jour Machine", `Modification de la machine ${id}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const deleteMachine = useCallback((id: string) => {
    const m = db.getMachines().find((x: any) => x.id === id);
    db.deleteMachine(id);
    persistNotif(makeNotif("machine", "Équipement supprimé", `${m?.name || id} a été retiré du parc.`, "🗑️", "text-zinc-500"));
    addAuditLog("Suppression Machine", `Suppression de la machine ${id}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const addStockItem = useCallback((item: any) => {
    db.addStock(item);
    persistNotif(makeNotif("stock", "Nouvelle pièce de rechange", `${item.name || item.reference} ajoutée au stock.`, "📦", "text-amber-500"));
    addAuditLog("Ajout Stock", `Ajout de la pièce ${item.reference || item.name}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const updateStockItem = useCallback((id: string, data: Partial<any>) => {
    const existing = db.getStock().find((s: any) => s.id === id);
    db.updateStock(id, data);
    const newQty = data.quantity ?? existing?.quantity ?? 0;
    const minQty = data.min ?? existing?.min ?? 0;
    if (minQty > 0 && newQty <= minQty) {
      persistNotif(makeNotif("alert", "Stock faible", `${existing?.name || id} : quantité (${newQty}) en dessous du seuil minimum (${minQty}).`, "⚠️", "text-rose-500"));
    }
    addAuditLog("Mise à jour Stock", `Modification de la pièce ${id} (Quantité: ${newQty})`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const deleteStockItem = useCallback((id: string) => {
    const s = db.getStock().find((x: any) => x.id === id);
    db.deleteStock(id);
    persistNotif(makeNotif("stock", "Article supprimé du stock", `${s?.name || id} a été retiré du stock.`, "🗑️", "text-zinc-500"));
    addAuditLog("Suppression Stock", `Suppression de la pièce ${id}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const addIntervention = useCallback((ot: any) => {
    db.addIntervention(ot);
    persistNotif(makeNotif("maintenance", "Nouvelle maintenance créée", `OT #${ot.id || "Nouveau"} sur ${ot.machine || ot.equipment || "équipement"}.`, "🛠️", "text-purple-500"));
    addAuditLog("Création OT", `Création du bon de travail #${ot.id || 'Nouveau'}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const updateIntervention = useCallback((id: number, data: Partial<any>) => {
    const existing = db.getInterventions().find((o: any) => o.id === id);
    db.updateIntervention(id, data);
    if (data.status && data.status !== existing?.status) {
      const emoji: Record<string, string> = { "Termine": "✅", "Cloture": "✅", "En cours": "🔄", "En attente": "⏳", "Annule": "❌" };
      const isGood = data.status === "Termine" || data.status === "Cloture" || data.status === "Terminé" || data.status === "Clôturé";
      persistNotif(makeNotif("maintenance", `Maintenance ${data.status}`, `OT #${id} est maintenant : ${data.status}.`, emoji[data.status] || "🛠️", isGood ? "text-emerald-500" : "text-blue-500"));
    }
    addAuditLog("Mise à jour OT", `Modification du bon de travail #${id}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const deleteIntervention = useCallback((id: number) => {
    db.deleteIntervention(id);
    persistNotif(makeNotif("maintenance", "Bon de Travail supprimé", `OT #${id} a été supprimé.`, "🗑️", "text-zinc-500"));
    addAuditLog("Suppression OT", `Suppression du bon de travail #${id}`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const addPreventif = useCallback((task: any) => {
    const list = db.getPreventif();
    db.savePreventif([task, ...list]);
    persistNotif(makeNotif("preventif", "Tâche préventive ajoutée", `${task.task || task.description || "Nouvelle tâche"} planifiée.`, "📅", "text-teal-500"));
    addAuditLog("Ajout Préventif", `Ajout de tâche préventive`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const updatePreventif = useCallback((id: any, data: Partial<any>) => {
    const list = db.getPreventif();
    db.savePreventif(list.map((t: any) => (t.id === id ? { ...t, ...data } : t)));
    addAuditLog("Mise à jour Préventif", `Tâche préventive ${id} modifiée`);
    refresh();
  }, [refresh, addAuditLog]);

  const deletePreventif = useCallback((id: any) => {
    const list = db.getPreventif();
    db.savePreventif(list.filter((t: any) => t.id !== id));
    addAuditLog("Suppression Préventif", `Tâche préventive ${id} supprimée`);
    refresh();
  }, [refresh, addAuditLog]);

  const markAllRead = useCallback(() => {
    const updated = db.markAllNotificationsRead() as GmaoNotification[];
    setNotifications(updated);
  }, []);

  const deleteAllNotifications = useCallback(() => {
    db.deleteAllNotifications();
    setNotifications([]);
  }, []);

  const deleteBulkNotifications = useCallback((ids: string[]) => {
    const updated = db.deleteBulkNotifications(ids) as GmaoNotification[];
    setNotifications(updated);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    const list: GmaoNotification[] = (db.getNotifications() || []) as GmaoNotification[];
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    db.saveNotifications(updated);
    setNotifications(updated);
  }, []);

  const addUser = useCallback((user: any) => {
    const list = db.getUsers() || [];
    db.saveUsers([...list, user]);
    persistNotif(makeNotif("user", "Nouvel utilisateur", `${user.name || user.email} a rejoint le système.`, "👤", "text-indigo-500"));
    addAuditLog("Ajout Utilisateur", `Utilisateur ${user.name || user.email} créé`);
    refresh();
  }, [refresh, persistNotif, addAuditLog]);

  const updateUser = useCallback((id: any, data: Partial<any>) => {
    const list = db.getUsers() || [];
    db.saveUsers(list.map((u: any) => (u.id === id ? { ...u, ...data } : u)));
    addAuditLog("Mise à jour Utilisateur", `Utilisateur ${id} modifié`);
    refresh();
  }, [refresh, addAuditLog]);

  const deleteUser = useCallback((id: any) => {
    const list = db.getUsers() || [];
    db.saveUsers(list.filter((u: any) => u.id !== id));
    addAuditLog("Suppression Utilisateur", `Utilisateur ${id} supprimé`);
    refresh();
  }, [refresh, addAuditLog]);

  // Real-time Calculators for MTBF, MTTR, Availability, and Totals
  const kpis = useMemo<KpiData>(() => {
    const totalMachines = machines.length || 1;
    const downMachines = machines.filter(m => m.status === 'En Panne' || m.status === 'Hors service' || m.status === 'Ne marche pas').length;
    const operationalMachines = totalMachines - downMachines;
    const lowStockCount = stock.filter(s => (s.min ?? 0) > 0 && (s.quantity ?? 0) <= (s.min ?? 0)).length;
    const overduePreventive = preventif.filter(p => p.status === 'En retard' || p.status === 'Non réalise').length;

    // MTBF & MTTR formulas
    const operatingHoursTotal = operationalMachines * 160; // 160h per machine per month
    const totalFailures = downMachines > 0 ? downMachines : 1;
    const mtbfHours = Math.round(operatingHoursTotal / totalFailures);
    const totalRepairHours = Math.max(downMachines * 4, 2);
    const mttrHours = Number((totalRepairHours / totalFailures).toFixed(1));
    const availabilityRate = Number(((mtbfHours / (mtbfHours + mttrHours)) * 100).toFixed(1));
    const totalCostMAD = stock.reduce((sum, s) => sum + ((s.quantity || 0) * (s.unitCostMAD || s.priceMAD || 0)), 0);

    return {
      mtbfHours,
      mttrHours,
      availabilityRate,
      totalCostMAD,
      operationalMachinesCount: operationalMachines,
      downMachinesCount: downMachines,
      lowStockItemsCount: lowStockCount,
      overduePreventiveCount: overduePreventive
    };
  }, [machines, stock, preventif]);

  return (
    <GmaoContext.Provider value={{
      machines, stock, interventions, preventif, notifications, users, auditLogs, kpis,
      refresh,
      addMachine, updateMachine, deleteMachine,
      addStockItem, updateStockItem, deleteStockItem,
      addIntervention, updateIntervention, deleteIntervention,
      addPreventif, updatePreventif, deletePreventif,
      markAllRead, deleteAllNotifications, deleteBulkNotifications, markNotificationRead, addNotification,
      addUser, updateUser, deleteUser, addAuditLog,
    }}>
      {children}
    </GmaoContext.Provider>
  );
};

export const useGmao = (): GmaoContextValue => {
  const ctx = useContext(GmaoContext);
  if (!ctx) throw new Error("useGmao must be used inside <GmaoProvider>");
  return ctx;
};
