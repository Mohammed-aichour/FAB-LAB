import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Sun, Moon, LogOut, AlertTriangle, CheckCircle2, Package, Server, Wrench, Trash2, CheckCheck, Clock, ShieldAlert, CheckSquare, Square, ChevronDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../services/db';

export interface NotificationItem {
  id: string;
  type: 'machine' | 'stock' | 'intervention' | 'preventif' | 'system';
  title: string;
  message: string;
  priority: 'Haute' | 'Moyenne' | 'Normale';
  timestamp: number;
  timeFormatted: string;
  read: boolean;
  link: string;
}

const generateInitialNotifications = (): NotificationItem[] => {
  const list: NotificationItem[] = [];
  const now = Date.now();

  try {
    const machines = db.getMachines();
    machines.forEach((m: any, idx: number) => {
      if (m.status === 'Hors service' || m.status === 'Ne marche pas' || m.status === 'En Panne') {
        list.push({
          id: `notif-mach-${m.id || idx}`,
          type: 'machine',
          title: `Machine Hors Service : ${m.name}`,
          message: `L'équipement ${m.reference} est déclaré hors service et nécessite une réparation d'urgence.`,
          priority: 'Haute',
          timestamp: now - (idx + 1) * 3600000,
          timeFormatted: idx === 0 ? "Il y a 15 min" : `Il y a ${idx + 1} heures`,
          read: false,
          link: '/machines'
        });
      }
    });
  } catch (e) {
    console.error(e);
  }

  try {
    const stock = db.getStock();
    stock.forEach((s: any, idx: number) => {
      if (s.quantity === 0) {
        list.push({
          id: `notif-stk-${s.id || idx}`,
          type: 'stock',
          title: `Rupture de Stock : ${s.name}`,
          message: `La référence ${s.reference} (${s.category}) est en rupture totale (0 unité).`,
          priority: 'Haute',
          timestamp: now - (idx + 2) * 1800000,
          timeFormatted: idx === 0 ? "Il y a 45 min" : `Il y a ${idx * 2}h`,
          read: false,
          link: '/stock'
        });
      } else if (s.quantity < s.min) {
        list.push({
          id: `notif-stk-low-${s.id || idx}`,
          type: 'stock',
          title: `Stock Faible : ${s.name}`,
          message: `Quantité restante: ${s.quantity} unité(s) (Seuil min: ${s.min}).`,
          priority: 'Moyenne',
          timestamp: now - (idx + 3) * 7200000,
          timeFormatted: `Il y a ${idx + 2}h`,
          read: false,
          link: '/stock'
        });
      }
    });
  } catch (e) {
    console.error(e);
  }

  try {
    const otList = db.getInterventions();
    otList.forEach((ot: any, idx: number) => {
      if (ot.status !== 'Terminé') {
        const isUrgent = ot.priority === 'Urgente' || ot.type === 'Corrective';
        list.push({
          id: `notif-ot-${ot.id || idx}`,
          type: 'intervention',
          title: `Ordre de Travail : ${ot.otNumber || 'OT'} (${ot.machine || ot.equipmentName})`,
          message: `Intervention ${ot.type} - Technicien: ${ot.technician || 'Non assigné'}.`,
          priority: isUrgent ? 'Haute' : 'Normale',
          timestamp: now - (idx + 1) * 5400000,
          timeFormatted: isUrgent ? "En attente prioritaire" : "Aujourd'hui",
          read: false,
          link: '/interventions'
        });
      }
    });
  } catch (e) {
    console.error(e);
  }

  const priorityWeight = { 'Haute': 3, 'Moyenne': 2, 'Normale': 1 };
  list.sort((a, b) => {
    const diffPrio = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diffPrio !== 0) return diffPrio;
    return b.timestamp - a.timestamp;
  });

  return list;
};

const Topbar = ({ user, onLogout }: { user?: any; onLogout?: () => void }) => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  
  // Advanced Notifications State (Bulk Delete, Progressive Load, Detail & History Modals)
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [detailNotif, setDetailNotif] = useState<NotificationItem | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const notificationsRef = useRef<HTMLDivElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshNotifications = () => {
    const stored = db.getNotifications();
    if (stored !== null) {
      setNotifications(stored);
      return;
    }
    const initialList = generateInitialNotifications();
    db.saveNotifications(initialList);
    setNotifications(initialList);
  };

  useEffect(() => {
    refreshNotifications();
    const handleDataUpdated = () => {
      const stored = db.getNotifications();
      if (stored !== null) {
        setNotifications(stored);
      }
    };
    window.addEventListener('gmao_data_updated', handleDataUpdated);
    return () => window.removeEventListener('gmao_data_updated', handleDataUpdated);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme toggle
  useEffect(() => {
    if (document.documentElement.classList.contains('dark') || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // 1. Bouton "Tout marquer comme lu"
  const markAllAsRead = () => {
    const updated = db.markAllNotificationsRead();
    setNotifications(updated);
    triggerToast("Toutes les notifications ont été marquées comme lues.");
  };

  // 2. Bouton "Supprimer toutes les notifications" (avec Modal de confirmation)
  const confirmDeleteAll = () => {
    setShowDeleteConfirm(true);
  };

  const executeDeleteAll = () => {
    const updated = db.deleteAllNotifications();
    setNotifications(updated);
    setSelectedNotifIds([]);
    setShowDeleteConfirm(false);
    setShowHistoryModal(false);
    triggerToast("Toutes les notifications ont été supprimées avec succès.");
  };

  // 3. Bulk Selection Checkbox Handlers
  const toggleSelectNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNotifIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchPrio = filterPriority === 'ALL' || n.priority === filterPriority;
      const matchCat = filterCategory === 'ALL' || n.type === filterCategory;
      return matchPrio && matchCat;
    });
  }, [notifications, filterPriority, filterCategory]);

  const visibleNotifications = useMemo(() => {
    return filteredNotifications.slice(0, displayLimit);
  }, [filteredNotifications, displayLimit]);

  const allFilteredSelected = useMemo(() => {
    if (filteredNotifications.length === 0) return false;
    return filteredNotifications.every(n => selectedNotifIds.includes(n.id));
  }, [filteredNotifications, selectedNotifIds]);

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredNotifications.map(n => n.id);
    if (allFilteredSelected) {
      setSelectedNotifIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedNotifIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // 4. Suppression en une seule opération (Bulk delete)
  const executeDeleteSelected = () => {
    if (selectedNotifIds.length === 0) return;
    const count = selectedNotifIds.length;
    const updated = db.deleteBulkNotifications(selectedNotifIds);
    setNotifications(updated);
    setSelectedNotifIds([]);
    triggerToast(`${count} notification(s) supprimée(s) avec succès.`);
  };

  const markSingleAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    db.saveNotifications(updated);
    setNotifications(updated);
  };

  const removeSingleNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = db.deleteBulkNotifications([id]);
    setNotifications(updated);
    setSelectedNotifIds(prev => prev.filter(item => item !== id));
    triggerToast("Notification supprimée avec succès.");
  };

  const handleNotifClick = (notif: NotificationItem) => {
    markSingleAsRead(notif.id);
    setDetailNotif(notif);
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const highPriorityCount = useMemo(() => notifications.filter(n => n.priority === 'Haute' && !n.read).length, [notifications]);

  return (
    <header className="h-16 border-b border-slate-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      {/* Search Input */}
      <div className="hidden md:flex items-center bg-slate-100 dark:bg-zinc-800/80 rounded-xl px-3.5 py-2 w-64 lg:w-96 border border-slate-200/80 dark:border-zinc-700/60 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all shadow-inner">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Rechercher équipement, pièce, bon de travail..." 
          className="bg-transparent border-none outline-none text-xs ml-2 w-full text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-zinc-700/60 rounded-md border border-slate-300/60 dark:border-zinc-600/60 select-none">⌘K</kbd>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        <button 
          onClick={() => navigate('/interventions')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>+ Bon de Travail</span>
        </button>

        <button 
          onClick={toggleTheme}
          title={isDarkMode ? "Passer en mode lumineux" : "Passer en mode sombre"}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all border border-slate-200/60 dark:border-zinc-700/60 shadow-sm cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
        
        {/* NOTIFICATION BELL & DROPDOWN */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Centre de Notifications GMAO"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all border border-slate-200/60 dark:border-zinc-700/60 shadow-sm relative flex items-center justify-center cursor-pointer"
          >
            <Bell className="w-4 h-4 text-fab-blue" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 ${
                highPriorityCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-fab-blue'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* NOTIFICATION DRAWER (Max height 560px with internal scroll) */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:mt-3 w-auto sm:w-96 md:w-[28rem] max-h-[85vh] sm:max-h-[560px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
              >
                {/* Notification Header */}
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-fab-blue" />
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Centre de Notifications</h3>
                      <p className="text-[11px] text-zinc-500">{unreadCount} non lue(s) • Total: {notifications.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Bouton "Tout marquer comme lu" */}
                    <button 
                      onClick={markAllAsRead} 
                      title="Tout marquer comme lu"
                      className="p-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-fab-blue hover:bg-slate-200/60 dark:hover:bg-zinc-700/60 rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline text-[11px]">Lu</span>
                    </button>
                    {/* Bouton "Supprimer toutes les notifications" */}
                    <button 
                      onClick={confirmDeleteAll} 
                      title="Supprimer toutes les notifications"
                      className="p-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span className="hidden sm:inline text-[11px]">Tout effacer</span>
                    </button>
                  </div>
                </div>

                {/* Toast Notification Banner */}
                <AnimatePresence>
                  {toastMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between shrink-0 shadow-inner"
                    >
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {toastMessage}</span>
                      <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold ml-2">✕</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bulk Action Bar if items selected */}
                {selectedNotifIds.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-fab-blue dark:text-blue-300">
                      {selectedNotifIds.length} sélectionnée(s)
                    </span>
                    <button
                      onClick={executeDeleteSelected}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer la sélection
                    </button>
                  </div>
                )}

                {/* Filters Bar */}
                <div className="p-2 bg-slate-100/60 dark:bg-zinc-900 border-b border-slate-200/60 dark:border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0 no-scrollbar">
                  {/* Select All Checkbox */}
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={toggleSelectAllFiltered}
                      className="p-1 text-zinc-500 hover:text-fab-blue rounded transition-colors mr-1 cursor-pointer"
                      title={allFilteredSelected ? "Tout désélectionner" : "Tout sélectionner"}
                    >
                      {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-fab-blue" /> : <Square className="w-4 h-4" />}
                    </button>
                  )}

                  <button 
                    onClick={() => { setFilterPriority('ALL'); setFilterCategory('ALL'); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filterPriority === 'ALL' && filterCategory === 'ALL' ? 'bg-fab-blue text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                  >
                    Toutes ({notifications.length})
                  </button>
                  <button 
                    onClick={() => { setFilterPriority('Haute'); setFilterCategory('ALL'); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${filterPriority === 'Haute' ? 'bg-red-600 text-white shadow-sm' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    Haute
                  </button>
                  <button 
                    onClick={() => { setFilterPriority('ALL'); setFilterCategory('machine'); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${filterCategory === 'machine' ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    Machines
                  </button>
                  <button 
                    onClick={() => { setFilterPriority('ALL'); setFilterCategory('stock'); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${filterCategory === 'stock' ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Stock
                  </button>
                  <button 
                    onClick={() => { setFilterPriority('ALL'); setFilterCategory('intervention'); }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${filterCategory === 'intervention' ? 'bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    OT
                  </button>
                </div>

                {/* Notifications List (Unclipped Internal Scroll ~500px) */}
                <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/60 custom-scrollbar max-h-[420px] flex-1">
                  {visibleNotifications.map(notif => {
                    const isHigh = notif.priority === 'Haute';
                    const isMedium = notif.priority === 'Moyenne';
                    const isSelected = selectedNotifIds.includes(notif.id);

                    return (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-zinc-800/60 relative group ${
                          isSelected ? 'bg-blue-50/60 dark:bg-blue-950/40' : !notif.read ? (isHigh ? 'bg-red-50/40 dark:bg-red-950/20' : 'bg-blue-50/30 dark:bg-blue-950/20') : 'bg-transparent'
                        }`}
                      >
                        {/* Checkbox for Bulk Selection */}
                        <div 
                          onClick={(e) => toggleSelectNotif(notif.id, e)}
                          className="pt-1 text-zinc-400 hover:text-fab-blue transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-fab-blue" />
                          ) : (
                            <Square className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                          )}
                        </div>

                        {/* Category Icon */}
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isHigh 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                            : isMedium 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}>
                          {notif.type === 'machine' && <Server className="w-4 h-4" />}
                          {notif.type === 'stock' && <Package className="w-4 h-4" />}
                          {notif.type === 'intervention' && <Wrench className="w-4 h-4" />}
                          {notif.type === 'system' && <AlertTriangle className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                              isHigh 
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' 
                                : isMedium 
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' 
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}>
                              {notif.priority}
                            </span>
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                              <Clock className="w-3 h-3" /> {notif.timeFormatted}
                            </span>
                          </div>
                          <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>

                        {/* Single Delete Button */}
                        <button 
                          onClick={(e) => removeSingleNotification(notif.id, e)}
                          title="Supprimer cette notification"
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 transition-all rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Exigence 12 : Bouton "Charger plus de notifications" si nécessaire */}
                  {filteredNotifications.length > displayLimit && (
                    <div className="p-3 text-center bg-slate-50/50 dark:bg-zinc-800/40">
                      <button
                        onClick={() => setDisplayLimit(prev => prev + 10)}
                        className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 text-fab-blue border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-blue-50 transition-colors shadow-2xs flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" /> Charger plus de notifications ({filteredNotifications.length - displayLimit} restantes)
                      </button>
                    </div>
                  )}

                  {/* Exigence 11 : Message si aucune notification n'existe */}
                  {filteredNotifications.length === 0 && (
                    <div className="p-8 text-center text-zinc-400 text-xs space-y-2">
                      <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Aucune notification.</p>
                      <p className="text-[11px] text-zinc-500">Toutes les alertes GMAO ont été traitées.</p>
                    </div>
                  )}
                </div>

                {/* Footer avec Bouton "Voir toutes les notifications" (Historique complet) */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold">
                  <button 
                    onClick={() => { setShowNotifications(false); setShowHistoryModal(true); }}
                    className="text-fab-blue hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Voir toutes les notifications ({notifications.length})
                  </button>
                  <span className="text-[11px] text-zinc-400 font-medium">Auto-sync 30s</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 p-1 rounded-lg">
          <div className={`w-8 h-8 rounded-xl ${user?.color || 'bg-fab-blue'} text-white flex items-center justify-center text-xs font-bold shadow-sm`}>
            {user?.initials || 'SU'}
          </div>
          <div className="text-left hidden sm:block mr-2">
            <p className="text-xs font-bold text-zinc-900 dark:text-white leading-none">{user?.name || 'Admin Système'}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">{user?.role || 'Superviseur'}</p>
          </div>
        </div>
        
        {/* Logout */}
        <button 
          onClick={onLogout}
          title="Se déconnecter"
          className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all border border-red-100 dark:border-red-900/40 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Exigence 3 & 4 : Confirmation Modal avant suppression de toutes les notifications */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full space-y-4 border border-slate-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">Confirmation de suppression</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
              Voulez-vous vraiment supprimer toutes les notifications ?
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={executeDeleteAll}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Oui, tout supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exigence 14 : Modal d'affichage complet d'une notification */}
      {detailNotif && (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-md w-full space-y-4 border border-slate-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                  detailNotif.priority === 'Haute' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                }`}>
                  {detailNotif.priority}
                </span>
                <span className="text-xs text-zinc-400 font-medium">{detailNotif.timeFormatted}</span>
              </div>
              <button onClick={() => setDetailNotif(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white font-bold text-base p-1 cursor-pointer">✕</button>
            </div>

            <h3 className="font-extrabold text-base text-zinc-900 dark:text-white leading-snug">{detailNotif.title}</h3>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-800">
              {detailNotif.message}
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <button onClick={() => setDetailNotif(null)} className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Fermer
              </button>
              <button
                onClick={() => {
                  markSingleAsRead(detailNotif.id);
                  setDetailNotif(null);
                  setShowNotifications(false);
                  navigate(detailNotif.link);
                }}
                className="px-4 py-2 text-xs font-bold bg-fab-blue hover:bg-blue-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                Accéder à l'élément <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exigence 15 : Modal d'Historique Complet ("Voir toutes les notifications") */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 border border-slate-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-fab-blue">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Historique Complet des Notifications GMAO</h3>
                  <p className="text-xs text-zinc-500 font-medium">Liste intégrale de toutes les alertes ({notifications.length})</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white font-bold text-base p-1 cursor-pointer">✕</button>
            </div>

            <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
              <span className="text-xs text-zinc-500 font-bold">{notifications.length} notification(s) en base</span>
              <div className="flex items-center gap-2">
                <button onClick={markAllAsRead} className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-zinc-900 text-fab-blue border border-slate-200 dark:border-zinc-700 rounded-lg shadow-2xs hover:bg-blue-50 cursor-pointer">
                  Tout marquer comme lu
                </button>
                <button onClick={confirmDeleteAll} className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 cursor-pointer">
                  Tout effacer
                </button>
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 flex-1 space-y-2 pr-1 custom-scrollbar max-h-[50vh]">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => { setDetailNotif(notif); setShowHistoryModal(false); }} 
                  className="p-3.5 bg-slate-50/50 dark:bg-zinc-800/40 rounded-xl hover:border-fab-blue border border-slate-200/60 dark:border-zinc-700/60 cursor-pointer flex items-start justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${notif.priority === 'Haute' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'}`}>
                        {notif.priority}
                      </span>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">{notif.title}</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{notif.message}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 font-medium">{notif.timeFormatted}</span>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="p-8 text-center text-zinc-400 text-xs font-bold">Aucune notification.</div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-zinc-800">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
