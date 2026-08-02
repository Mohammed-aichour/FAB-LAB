import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CheckCheck, Trash2, X, Search, ArrowUpDown, 
  AlertTriangle, Settings, PackageCheck, ShieldCheck, ChevronDown, ChevronUp, Minus, Maximize2
} from 'lucide-react';

export type NotificationCategory = 'Alertes' | 'Maintenance' | 'Stock' | 'Validation' | 'Urgentes';
export type FilterType = 'Toutes' | 'Non lues' | 'Lues' | NotificationCategory;
export type SortOption = 'récentes' | 'anciennes' | 'priorité' | 'type';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  date: string;
  timestamp: number;
  read: boolean;
  priority: 'Haute' | 'Moyenne' | 'Faible';
  targetUrl?: string;
  machine?: string;
  reference?: string;
  diffDays?: number;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onDeleteOne: (id: string) => void;
  onDeleteAll: () => void;
  onMarkAllRead: () => void;
  onToggleRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onDeleteOne,
  onDeleteAll,
  onMarkAllRead,
  onToggleRead
}) => {
  const navigate = useNavigate();

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return sessionStorage.getItem('gmao_notif_minimized') === 'true';
  });
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    return sessionStorage.getItem('gmao_notif_hidden') === 'true';
  });

  const [activeFilter, setActiveFilter] = useState<FilterType>('Toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('récentes');
  const [toastBanner, setToastBanner] = useState<string | null>(null);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('gmao_notif_minimized', String(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    sessionStorage.setItem('gmao_notif_hidden', String(isHidden));
  }, [isHidden]);

  const showToast = (msg: string) => {
    setToastBanner(msg);
    setTimeout(() => setToastBanner(null), 3500);
  };

  const handleClearAllConfirm = () => {
    if (notifications.length === 0) return;
    if (window.confirm("Voulez-vous supprimer toutes les notifications ?")) {
      onDeleteAll();
      showToast("Toutes les notifications ont été supprimées.");
    }
  };

  const handleMarkAllReadClick = () => {
    onMarkAllRead();
    showToast("Toutes les notifications ont été marquées comme lues.");
  };

  const handleDismissOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteOne(id);
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) onToggleRead(item.id);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    } else if (item.category === 'Stock') {
      navigate('/stock');
    } else if (item.category === 'Maintenance' || item.category === 'Alertes') {
      navigate('/interventions');
    }
  };

  // Filter Logic
  const filteredList = useMemo(() => {
    return notifications.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        (item.machine && item.machine.toLowerCase().includes(q)) ||
        (item.reference && item.reference.toLowerCase().includes(q));

      let matchFilter = true;
      if (activeFilter === 'Non lues') matchFilter = !item.read;
      else if (activeFilter === 'Lues') matchFilter = item.read;
      else if (activeFilter !== 'Toutes') matchFilter = item.category === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [notifications, searchQuery, activeFilter]);

  // Sort Logic
  const sortedList = useMemo(() => {
    const list = [...filteredList];
    if (sortOption === 'récentes') {
      list.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOption === 'anciennes') {
      list.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOption === 'priorité') {
      const pMap = { Haute: 3, Moyenne: 2, Faible: 1 };
      list.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
    } else if (sortOption === 'type') {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }
    return list;
  }, [filteredList, sortOption]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const displayedList = isExpanded ? sortedList : sortedList.slice(0, 5);
  const remainingCount = sortedList.length - 5;

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'Alertes':
      case 'Urgentes':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'Maintenance':
        return <Settings className="w-4 h-4 text-fab-blue" />;
      case 'Stock':
        return <PackageCheck className="w-4 h-4 text-amber-600" />;
      case 'Validation':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-fab-blue" />;
    }
  };

  const getCategoryBadgeColor = (cat: NotificationCategory) => {
    switch (cat) {
      case 'Urgentes':
      case 'Alertes':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      case 'Maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'Stock':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'Validation':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  if (notifications.length === 0 && !toastBanner) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 max-w-sm sm:max-w-md w-full pointer-events-none select-none">
      
      {/* Toast Confirmation Message */}
      {toastBanner && (
        <div className="pointer-events-auto p-3.5 px-4 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fade-in-up w-full">
          <span>{toastBanner}</span>
          <button onClick={() => setToastBanner(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* MODE 1: COMPLETELY HIDDEN (FLOATING BELL ICON ONLY) */}
      {isHidden && notifications.length > 0 && (
        <button
          onClick={() => { setIsHidden(false); setIsMinimized(false); }}
          className="pointer-events-auto relative p-3.5 rounded-full bg-fab-blue hover:bg-blue-700 text-white shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-white dark:border-zinc-800 cursor-pointer animate-fade-in-up group"
          title="Ouvrir le centre de notifications"
        >
          <Bell className="w-6 h-6 animate-pulse group-hover:rotate-12 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[11px] min-w-[20px] h-5 rounded-full px-1 flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-md">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* MODE 2: MINIMIZED PILL BAR */}
      {!isHidden && isMinimized && notifications.length > 0 && (
        <div
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto p-3 px-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-slate-200 dark:border-zinc-800 shadow-xl flex items-center justify-between gap-3 cursor-pointer hover:border-fab-blue transition-all duration-300 animate-fade-in-up w-auto"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-4 h-4 text-fab-blue" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
              Notifications ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 font-bold">
                {unreadCount} non lue(s)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              className="p-1 text-zinc-400 hover:text-fab-blue transition-colors"
              title="Agrandir"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsHidden(true); }}
              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
              title="Masquer le panneau"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: FULLY EXPANDED / OPEN PANEL */}
      {!isHidden && !isMinimized && notifications.length > 0 && (
        <div className="pointer-events-auto w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 animate-fade-in-up">
          
          {/* HEADER BAR */}
          <div className="p-3.5 px-4 bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200 dark:border-zinc-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-5 h-5 text-fab-blue" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-xs text-zinc-900 dark:text-white tracking-tight">
                Centre de Notifications ({notifications.length})
              </h3>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleMarkAllReadClick}
                className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-zinc-700 hover:bg-emerald-600 hover:text-white text-zinc-700 dark:text-zinc-200 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tout lu</span>
              </button>

              <button
                onClick={handleClearAllConfirm}
                className="px-2 py-1 rounded-xl bg-slate-200 dark:bg-zinc-700 hover:bg-rose-600 hover:text-white text-zinc-700 dark:text-zinc-200 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Tout supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tout effacer</span>
              </button>

              {/* Minimize Icon (−) */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Réduire (−)"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Complete Hide Icon (✕) */}
              <button
                onClick={() => setIsHidden(true)}
                className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-zinc-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Masquer le panneau (✕)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SEARCH & FILTERS BAR */}
          {(isExpanded || searchQuery) && (
            <div className="p-3 bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200/60 dark:border-zinc-800 space-y-2.5 text-xs">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher une notification (machine, titre...)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs outline-none focus:border-fab-blue"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600">✕</button>
                )}
              </div>

              {/* Filter Tabs Pills */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar pb-1">
                <div className="flex items-center gap-1">
                  {(['Toutes', 'Non lues', 'Lues', 'Alertes', 'Maintenance', 'Stock', 'Validation', 'Urgentes'] as FilterType[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        activeFilter === f
                          ? 'bg-fab-blue text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1 shrink-0">
                  <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  <select
                    value={sortOption}
                    onChange={e => setSortOption(e.target.value as SortOption)}
                    className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[10px] font-bold p-1 outline-none cursor-pointer"
                  >
                    <option value="récentes">Plus récentes</option>
                    <option value="anciennes">Plus anciennes</option>
                    <option value="priorité">Priorité</option>
                    <option value="type">Type</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION LIST ITEM STACK WITH SCROLL */}
          <div className={`p-3 space-y-2.5 overflow-y-auto custom-scrollbar transition-all ${
            isExpanded ? 'max-h-[55vh]' : 'max-h-[42vh]'
          }`}>
            {displayedList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer relative group flex items-start gap-3 shadow-xs ${
                  item.read
                    ? 'bg-white/60 dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-800/80 opacity-75 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                    : 'bg-white dark:bg-zinc-800/90 border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-fab-blue/10'
                }`}
              >
                {/* Status Dot / Category Icon */}
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1 pr-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getCategoryBadgeColor(item.category)}`}>
                      {item.category}
                    </span>

                    {item.priority === 'Haute' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider">
                        Urgent
                      </span>
                    )}
                  </div>

                  <h4 className={`text-xs font-bold leading-tight ${item.read ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white font-extrabold'}`}>
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-snug">
                    {item.message}
                  </p>

                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 pt-1">
                    <span>{item.date}</span>
                    {!item.read && (
                      <span className="text-fab-blue font-bold flex items-center gap-1">
                        ● Non lu
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual Dismiss Button ❌ */}
                <button
                  onClick={(e) => handleDismissOne(e, item.id)}
                  className="absolute top-2.5 right-2.5 p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  title="Fermer cette notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Empty state */}
            {displayedList.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-400 font-medium space-y-1">
                <Bell className="w-6 h-6 mx-auto text-zinc-300 mb-1" />
                <div>Aucune notification trouvée.</div>
              </div>
            )}
          </div>

          {/* STACKED EXTENSION BAR (+ XX autres notifications...) */}
          {!isExpanded && remainingCount > 0 && (
            <div className="p-2.5 bg-slate-100/90 dark:bg-zinc-800/90 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between px-4 text-xs font-extrabold">
              <span
                onClick={() => setIsExpanded(true)}
                className="text-fab-blue hover:text-blue-700 cursor-pointer flex items-center gap-1"
              >
                + {remainingCount} autres notifications... (Cliquer pour tout afficher)
              </span>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
