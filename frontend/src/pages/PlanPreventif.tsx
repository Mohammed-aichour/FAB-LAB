import { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { Calendar, Clock, Filter, AlertTriangle, Grid, List, ChevronLeft, ChevronRight, Check, Search, UserCheck, RotateCcw } from 'lucide-react';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const MONTH_SHORT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

const PlanPreventif = () => {
  const [taches, setTaches] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'AGENDA' | 'GRID' | 'KANBAN'>('AGENDA');
  
  // Agenda Navigation State
  const [selectedMonth, setSelectedMonth] = useState<number>(1); // 0-11 (1 = Février 2026)
  const [selectedYear] = useState<number>(2026);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterFreq, setFilterFreq] = useState<string>('TOUS');
  const [filterEquip, setFilterEquip] = useState<string>('TOUS');
  const [filterResp, setFilterResp] = useState<string>('TOUS');
  const [highlightMonth, setHighlightMonth] = useState<number | null>(null);

  // Selected Task Modal / Detail State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const loadTaches = () => setTaches(db.getPreventif());

  useEffect(() => {
    loadTaches();
    window.addEventListener('gmao_data_updated', loadTaches);
    window.addEventListener('storage', loadTaches);
    return () => {
      window.removeEventListener('gmao_data_updated', loadTaches);
      window.removeEventListener('storage', loadTaches);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveTaches = (updated: any[]) => {
    setTaches(updated);
    db.savePreventif(updated);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setFilterFreq('TOUS');
    setFilterEquip('TOUS');
    setFilterResp('TOUS');
    setHighlightMonth(null);
  };

  // Validate task & update next due date
  const handleValidate = (id: number) => {
    const updated = taches.map(t => {
      if (t.id === id) {
        const currentDate = new Date();
        let addMonths = 1;
        if (t.frequence.includes('Trimestri')) addMonths = 3;
        else if (t.frequence.includes('Semestri')) addMonths = 6;
        else if (t.frequence.includes('Annu')) addMonths = 12;

        currentDate.setMonth(currentDate.getMonth() + addMonths);
        return {
          ...t,
          statut: 'Réalisé',
          derniereExecution: new Date().toISOString().split('T')[0],
          prochaineEcheance: currentDate.toISOString().split('T')[0]
        };
      }
      return t;
    });
    saveTaches(updated);
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(null);
    }
  };

  const handleDeleteTask = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche de maintenance préventive ?")) {
      const updated = taches.filter(t => t.id !== id);
      saveTaches(updated);
      if (selectedTask && selectedTask.id === id) setSelectedTask(null);
    }
  };

  // Get frequency badge style
  const getFreqBadgeStyle = (freq: string) => {
    if (freq.includes('Hebdo')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
    if (freq.includes('Mensue')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
    if (freq.includes('Trimestri')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
    if (freq.includes('Semestri')) return 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/60';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60';
  };

  // List of unique equipment for filtering
  const equipmentOptions = useMemo(() => {
    const setEq = new Set<string>();
    taches.forEach(t => {
      if (t.equipement) setEq.add(t.equipement);
    });
    return Array.from(setEq).sort();
  }, [taches]);

  // List of unique responsables for filtering
  const respOptions = useMemo(() => {
    const setResp = new Set<string>();
    taches.forEach(t => {
      if (t.responsable) setResp.add(t.responsable);
    });
    return Array.from(setResp).sort();
  }, [taches]);

  // 100% Fully Functional Filtered Taches List
  const filteredTaches = useMemo(() => {
    return taches.filter(t => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = query === '' ||
        (t.fl_id && t.fl_id.toLowerCase().includes(query)) ||
        (t.equipement && t.equipement.toLowerCase().includes(query)) ||
        (t.tache && t.tache.toLowerCase().includes(query)) ||
        (t.gamme && t.gamme.toLowerCase().includes(query)) ||
        (t.type && t.type.toLowerCase().includes(query)) ||
        (t.responsable && t.responsable.toLowerCase().includes(query));

      const matchFreq = filterFreq === 'TOUS' || t.frequence.includes(filterFreq);
      const matchEquip = filterEquip === 'TOUS' || t.equipement === filterEquip || t.fl_id === filterEquip;
      const matchResp = filterResp === 'TOUS' || t.responsable === filterResp;
      const matchMonth = highlightMonth === null || (t.active_months && t.active_months.includes(highlightMonth));

      return matchSearch && matchFreq && matchEquip && matchResp && matchMonth;
    });
  }, [taches, searchTerm, filterFreq, filterEquip, filterResp, highlightMonth]);

  // Calculate monthly totals for the schedule grid
  const monthlyTotals = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    filteredTaches.forEach(t => {
      if (t.active_months && Array.isArray(t.active_months)) {
        t.active_months.forEach((mIdx: number) => {
          if (mIdx >= 1 && mIdx <= 12) {
            counts[mIdx - 1] += (t.frequence.includes('Hebdo') ? 4 : 1);
          }
        });
      }
    });
    return counts;
  }, [filteredTaches]);

  const totalInterventionsFiltered = monthlyTotals.reduce((a, b) => a + b, 0);
  const totalHoursFiltered = filteredTaches.reduce((sum, t) => sum + (t.charge_an || (t.duree * (t.nb_an || 1))), 0);

  // Generate calendar days for selected month in Agenda View
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, tasks: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mNum = selectedMonth + 1;
      const dayTasks = filteredTaches.filter(t => {
        const hasMonth = t.active_months && t.active_months.includes(mNum);
        if (!hasMonth) return false;
        const taskDaySeed = (t.id * 7 + mNum * 3) % daysInMonth + 1;
        return taskDaySeed === d || (t.frequence.includes('Hebdo') && (d % 7 === (t.id % 7)));
      });

      days.push({
        day: d,
        tasks: dayTasks
      });
    }

    return days;
  }, [selectedMonth, selectedYear, filteredTaches]);

  const isFilterActive = searchTerm !== '' || filterFreq !== 'TOUS' || filterEquip !== 'TOUS' || filterResp !== 'TOUS' || highlightMonth !== null;

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header Bar Maximo/Fiix Enterprise Style */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Plan Préventif
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-fab-blue dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              GMAO Universiapolis
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Planning annuel et agenda de maintenance préventive ({filteredTaches.length} opérations • {totalInterventionsFiltered} interventions/an • {totalHoursFiltered.toFixed(1)} h)
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-inner">
          <button
            onClick={() => setViewMode('AGENDA')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'AGENDA'
                ? 'bg-white dark:bg-zinc-900 text-fab-blue shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-fab-blue" /> Agenda Visuel
          </button>

          <button
            onClick={() => setViewMode('GRID')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'GRID'
                ? 'bg-white dark:bg-zinc-900 text-fab-blue shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Grid className="w-4 h-4 text-indigo-500" /> Planning 12 Mois
          </button>

          <button
            onClick={() => setViewMode('KANBAN')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'KANBAN'
                ? 'bg-white dark:bg-zinc-900 text-fab-blue shadow-sm border border-slate-200/60 dark:border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4 text-emerald-500" /> Kanban & Suivi
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Tâches Filtrées</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mt-2">{filteredTaches.length} <span className="text-sm font-semibold text-zinc-400">/ 37</span></div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">14 Équipements FabLab Universiapolis</div>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Interventions / An</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-fab-blue tracking-tight mt-2">{totalInterventionsFiltered} <span className="text-sm font-semibold text-zinc-400">/ an</span></div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">~35 interventions / mois</div>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Charge Totale Annuelle</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight mt-2">{totalHoursFiltered.toFixed(1)} <span className="text-sm font-semibold text-zinc-400">h</span></div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">Techniciens & Prestataires</div>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <span>Taux de Respect</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-2">88.5 %</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">Conforme aux KPIs Métiers</div>
        </div>
      </div>

      {/* RICH & ENHANCED FILTER BAR */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Rechercher code (FL-xxx), tâche, gamme (G-xxx)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs bg-slate-50/80 dark:bg-zinc-800/80 outline-none focus:border-fab-blue focus:bg-white dark:focus:bg-zinc-900 transition-all font-medium text-zinc-900 dark:text-white"
              />
            </div>

            {/* Frequency Select */}
            <select
              value={filterFreq}
              onChange={e => setFilterFreq(e.target.value)}
              className="px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs bg-slate-50/80 dark:bg-zinc-800/80 outline-none focus:border-fab-blue font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="TOUS">Toutes Fréquences</option>
              <option value="Hebdo">Hebdomadaire (48/an)</option>
              <option value="Mensue">Mensuelle (12/an)</option>
              <option value="Trimestri">Trimestrielle (4/an)</option>
              <option value="Semestri">Semestrielle (2/an)</option>
              <option value="Annu">Annuelle (1/an)</option>
            </select>

            {/* Equipment Select */}
            <select
              value={filterEquip}
              onChange={e => setFilterEquip(e.target.value)}
              className="px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs bg-slate-50/80 dark:bg-zinc-800/80 outline-none focus:border-fab-blue font-bold text-zinc-800 dark:text-zinc-200 max-w-[210px] truncate cursor-pointer"
            >
              <option value="TOUS">Tous Équipements ({equipmentOptions.length})</option>
              {equipmentOptions.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            {/* Responsable Select */}
            <select
              value={filterResp}
              onChange={e => setFilterResp(e.target.value)}
              className="px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs bg-slate-50/80 dark:bg-zinc-800/80 outline-none focus:border-fab-blue font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="TOUS">Tous Intervenants</option>
              {respOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser Filtres
            </button>
          )}
        </div>

        {/* Quick Month Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-zinc-800/80 no-scrollbar">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mr-1 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-fab-blue" /> Filtrer Mois :
          </span>
          <button
            onClick={() => setHighlightMonth(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              highlightMonth === null ? 'bg-fab-blue text-white shadow-sm' : 'bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            Tous (12 Mois)
          </button>
          {MONTH_SHORT.map((m, idx) => (
            <button
              key={m}
              onClick={() => {
                const nextVal = highlightMonth === idx + 1 ? null : idx + 1;
                setHighlightMonth(nextVal);
                if (nextVal !== null) {
                  setSelectedMonth(idx);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                highlightMonth === idx + 1 ? 'bg-fab-blue text-white shadow-sm scale-105' : 'bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* VUE 1 : AGENDA CALENDRIER VISUEL */}
      {viewMode === 'AGENDA' && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Month Header Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-fab-blue">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                  {MONTH_NAMES[selectedMonth]} {selectedYear}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Planning mensuel des interventions du FabLab</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-fab-blue font-bold rounded-full border border-blue-200 dark:border-blue-800/60">
                {calendarDays.reduce((acc, d) => acc + d.tasks.length, 0)} interventions planifiées
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const prevM = selectedMonth === 0 ? 11 : selectedMonth - 1;
                    setSelectedMonth(prevM);
                    setHighlightMonth(prevM + 1);
                  }}
                  className="p-2 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
                </button>
                <button
                  onClick={() => {
                    const nextM = selectedMonth === 11 ? 0 : selectedMonth + 1;
                    setSelectedMonth(nextM);
                    setHighlightMonth(nextM + 1);
                  }}
                  className="p-2 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4 text-zinc-700 dark:text-zinc-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid (Mon to Sun) */}
          <div className="grid grid-cols-7 gap-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(dayName => (
              <div key={dayName} className="text-center font-extrabold text-xs text-zinc-400 dark:text-zinc-500 py-2 uppercase tracking-wider bg-slate-50/50 dark:bg-zinc-800/30 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                {dayName}
              </div>
            ))}

            {calendarDays.map((cd, i) => (
              <div
                key={i}
                className={`min-h-[125px] p-2.5 border rounded-2xl flex flex-col justify-between transition-all ${
                  cd.day === null
                    ? 'bg-slate-50/30 dark:bg-zinc-950/20 border-transparent'
                    : 'bg-white/90 dark:bg-zinc-900/80 border-slate-200/80 dark:border-zinc-800/80 hover:border-fab-blue hover:shadow-md'
                }`}
              >
                {cd.day !== null && (
                  <>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">{cd.day}</span>
                      {cd.tasks.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-fab-blue text-white font-extrabold rounded-full shadow-xs">
                          {cd.tasks.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-0.5">
                      {cd.tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          className={`p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer truncate border transition-all hover:scale-[1.02] shadow-2xs ${getFreqBadgeStyle(t.frequence)}`}
                          title={`${t.fl_id} - ${t.equipement} : ${t.tache}`}
                        >
                          <span className="font-mono font-bold mr-1 text-fab-blue">{t.fl_id}:</span>
                          {t.tache}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VUE 2 : PLANNING ANNUEL (GRILLE 12 MOIS) */}
      {viewMode === 'GRID' && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-800/80 border-b border-slate-200/80 dark:border-zinc-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-fab-blue" />
                Planning Annuel des Interventions Préventives
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                Calendrier de maintenance — Un « X » indique le(s) mois d'intervention planifié(s)
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-fab-blue bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 shrink-0">
              {filteredTaches.length} Opérations • {totalInterventionsFiltered} Interventions • {totalHoursFiltered.toFixed(1)} h
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#2f3874] text-white font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3 border-r border-slate-200 dark:border-zinc-700">ID Équip.</th>
                  <th className="px-3.5 py-3 border-r border-slate-200 dark:border-zinc-700">Équipement</th>
                  <th className="px-3.5 py-3 border-r border-slate-200 dark:border-zinc-700 min-w-[220px]">Opération Préventive</th>
                  <th className="px-3 py-3 border-r border-slate-200 dark:border-zinc-700">Type</th>
                  <th className="px-3 py-3 border-r border-slate-200 dark:border-zinc-700">Fréquence</th>
                  <th className="px-3 py-3 border-r border-slate-200 dark:border-zinc-700">Réf. Gamme</th>
                  <th className="px-3 py-3 text-center border-r border-slate-200 dark:border-zinc-700">Durée (h)</th>
                  <th className="px-3 py-3 border-r border-slate-200 dark:border-zinc-700">Responsable</th>
                  {MONTH_SHORT.map((m, idx) => (
                    <th key={m} className={`px-2 py-3 text-center border-r border-slate-200 dark:border-zinc-700 min-w-[38px] ${highlightMonth === idx + 1 ? 'bg-blue-200 dark:bg-blue-900/60 text-fab-blue' : ''}`}>
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center border-r border-slate-200 dark:border-zinc-700">Nb/an</th>
                  <th className="px-4 py-3 text-right font-bold">Charge/an (h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredTaches.map(op => (
                  <tr key={op.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors text-[11px]">
                    <td className="px-3.5 py-2.5 font-mono font-bold text-fab-blue border-r border-slate-100 dark:border-zinc-800">
                      {op.fl_id}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-zinc-900 dark:text-zinc-100 border-r border-slate-100 dark:border-zinc-800">
                      {op.equipement}
                    </td>
                    <td className="px-3.5 py-2.5 text-zinc-700 dark:text-zinc-200 font-medium border-r border-slate-100 dark:border-zinc-800">
                      {op.tache}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 border-r border-slate-100 dark:border-zinc-800">
                      {op.type}
                    </td>
                    <td className="px-3 py-2.5 border-r border-slate-100 dark:border-zinc-800">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getFreqBadgeStyle(op.frequence)}`}>
                        {op.frequence}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-zinc-600 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800">
                      {op.gamme}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold border-r border-slate-100 dark:border-zinc-800">
                      {op.duree.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 border-r border-slate-100 dark:border-zinc-800 font-medium">
                      {op.responsable}
                    </td>

                    {/* Month columns 1-12 with X badge */}
                    {MONTH_SHORT.map((_, idx) => {
                      const isActive = op.active_months && op.active_months.includes(idx + 1);
                      return (
                        <td key={idx} className={`px-1 py-2.5 text-center border-r border-slate-100 dark:border-zinc-800 ${highlightMonth === idx + 1 ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                          {isActive && (
                            <span className="inline-flex items-center justify-center w-6 h-5 bg-fab-blue text-white font-mono font-bold text-[10px] rounded-md shadow-xs">
                              X
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-3 py-2.5 text-center font-bold text-zinc-800 dark:text-zinc-200 border-r border-slate-100 dark:border-zinc-800">
                      {op.nb_an || (op.frequence.includes('Hebdo') ? 48 : op.active_months?.length || 1)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {(op.charge_an || (op.duree * (op.nb_an || 1))).toFixed(2)} h
                    </td>
                  </tr>
                ))}

                {filteredTaches.length === 0 && (
                  <tr>
                    <td colSpan={21} className="px-6 py-8 text-center text-zinc-500 font-medium">
                      Aucune tâche ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                )}

                {/* TOTAL ROW */}
                <tr className="bg-zinc-900 text-white font-extrabold text-xs">
                  <td colSpan={8} className="px-4 py-3.5 text-right uppercase tracking-wider text-zinc-300">
                    TOTAL GÉNÉRAL FILTRÉ
                  </td>
                  {monthlyTotals.map((tot, idx) => (
                    <td key={idx} className="px-1 py-3.5 text-center text-fab-blue font-mono text-sm bg-zinc-800/90 border-r border-zinc-700/80">
                      {tot}
                    </td>
                  ))}
                  <td className="px-3 py-3.5 text-center text-emerald-400 font-mono text-sm border-r border-zinc-700/80">
                    {totalInterventionsFiltered}
                  </td>
                  <td className="px-4 py-3.5 text-right text-emerald-400 font-mono text-sm">
                    {totalHoursFiltered.toFixed(2)} h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE 3 : KANBAN & SUIVI RIGOUREUX */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: A faire ce mois */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> À Réaliser Ce Mois (Février 2026)
              </h3>
              <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold rounded-full">
                {filteredTaches.filter(t => t.active_months && t.active_months.includes(2)).length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredTaches.filter(t => t.active_months && t.active_months.includes(2)).map(t => (
                <div key={t.id} className="p-4 bg-slate-50/80 dark:bg-zinc-800/50 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 space-y-3 hover:border-fab-blue transition-all duration-200 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-fab-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/40">
                      {t.fl_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getFreqBadgeStyle(t.frequence)}`}>
                      {t.frequence}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white leading-snug">{t.tache}</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{t.equipement} • Gamme: <strong className="font-mono">{t.gamme}</strong></p>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/80 dark:border-zinc-700/80 text-[11px]">
                    <span className="text-zinc-500">Durée: <strong>{t.duree} h</strong></span>
                    <button
                      onClick={() => handleValidate(t.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 text-[10px] shadow-xs cursor-pointer transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Valider
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Planifie Prochainement */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-fab-blue flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fab-blue" /> Échéances Mars 2026
              </h3>
              <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-fab-blue dark:bg-blue-950/60 dark:text-blue-300 font-extrabold rounded-full">
                {filteredTaches.filter(t => t.active_months && t.active_months.includes(3)).length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredTaches.filter(t => t.active_months && t.active_months.includes(3)).map(t => (
                <div key={t.id} className="p-4 bg-slate-50/80 dark:bg-zinc-800/50 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 space-y-2 hover:border-fab-blue transition-all duration-200 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-fab-blue">{t.fl_id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getFreqBadgeStyle(t.frequence)}`}>
                      {t.frequence}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white leading-snug">{t.tache}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{t.equipement} • Gamme: <strong className="font-mono">{t.gamme}</strong></p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Maintenance Annuelle / Révision Lourd */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Révisions Lourdes (Août - Prestataires)
              </h3>
              <span className="text-xs px-2.5 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold rounded-full">
                {filteredTaches.filter(t => t.frequence.includes('Annu')).length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredTaches.filter(t => t.frequence.includes('Annu')).map(t => (
                <div key={t.id} className="p-4 bg-rose-50/40 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-800/40 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">{t.fl_id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                      Annuel (Août)
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-white leading-snug">{t.tache}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{t.equipement} • Durée: <strong>{t.duree} h</strong></p>
                  <div className="text-[10px] text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1.5 pt-1">
                    <UserCheck className="w-3.5 h-3.5" /> Intervenant : {t.responsable}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-md w-full space-y-4 border border-slate-200/80 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="font-mono font-bold text-xs text-fab-blue bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800/40">
                  {selectedTask.fl_id}
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mt-2 leading-snug">{selectedTask.tache}</h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">{selectedTask.equipement}</p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-base font-bold p-1 rounded-lg transition-colors">✕</button>
            </div>

            <div className="bg-slate-50/80 dark:bg-zinc-800/60 p-4 rounded-xl space-y-2.5 text-xs border border-slate-200/60 dark:border-zinc-700/60">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Fréquence :</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getFreqBadgeStyle(selectedTask.frequence)}`}>{selectedTask.frequence}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Gamme de maintenance :</span>
                <span className="font-mono font-bold text-fab-blue">{selectedTask.gamme}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Durée d'intervention :</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedTask.duree} heure(s)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Intervenant :</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedTask.responsable}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button onClick={() => handleDeleteTask(selectedTask.id)} className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer">
                Supprimer
              </button>
              <button onClick={() => setSelectedTask(null)} className="px-4 py-2 text-xs font-bold border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer">
                Fermer
              </button>
              <button onClick={() => handleValidate(selectedTask.id)} className="btn-neu px-5 py-2 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer transition-colors">
                <Check className="w-4 h-4" /> Valider l'Intervention
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanPreventif;
