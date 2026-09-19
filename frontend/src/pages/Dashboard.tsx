import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Server, Wrench, Package, Clock, TrendingUp, Activity,
  BarChart3, DollarSign, Layers, Calendar, Table,
  AlertTriangle, CheckCircle2, AlertCircle, Zap,
  ArrowUpRight, Cpu, ShieldCheck
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, Area, PieChart, Pie, Cell
} from "recharts";
import { useGmaoStats } from "../hooks/useGmaoStats";
import { useGmao } from "../context/GmaoContext";

const CAT_COLORS = ["#2f3874", "#b92721", "#e0a61e", "#059669", "#8b5cf6", "#0891b2", "#d97706", "#db2777"];

const getStatusColor = (status: string, index: number): string => {
  const s = (status || "").trim().toLowerCase();
  if (s.includes("opérat") || s.includes("operat") || s.includes("marche") || s.includes("bon") || s.includes("actif")) return "#059669";
  if (s.includes("hors") || s.includes("panne") || s.includes("hs")) return "#e11d48";
  if (s.includes("maint") || s.includes("contrôl") || s.includes("control")) return "#d97706";
  if (s.includes("attente") || s.includes("confirm")) return "#8b5cf6";
  return CAT_COLORS[index % CAT_COLORS.length];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const stats = useGmaoStats();
  const { notifications, refresh } = useGmao();
  const [activeTab, setActiveTab] = useState<"REALTIME" | "MONTHLY" | "ATELIER">("REALTIME");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const handleUpdate = () => {
      refresh();
      setLastUpdate(new Date());
    };
    handleUpdate();
    const interval = setInterval(handleUpdate, 3000);
    window.addEventListener("gmao_data_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("gmao_data_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [refresh]);

  const alertCount = stats.machinesHS + stats.stockEnRupture + stats.stockFaible;
  const dispoColor = stats.disponibiliteGlobale >= 95 ? "text-emerald-600" : stats.disponibiliteGlobale >= 80 ? "text-amber-600" : "text-rose-600";
  void notifications;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Dashboard GMA LAB</h1>
          <p className="text-zinc-500 mt-1 text-sm flex items-center gap-2">
            Tableau de bord exécutif — FabLab Universiapolis
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Temps réel — {lastUpdate.toLocaleTimeString("fr-FR")}
            </span>
          </p>
        </div>
        {alertCount > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">{alertCount} alerte(s) active(s)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 shadow-xs">
          {(["REALTIME", "MONTHLY", "ATELIER"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === tab ? "bg-white dark:bg-zinc-900 text-[#2f3874] dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}>
              {tab === "REALTIME" && <Zap className="w-3.5 h-3.5" />}
              {tab === "MONTHLY" && <TrendingUp className="w-3.5 h-3.5" />}
              {tab === "ATELIER" && <Layers className="w-3.5 h-3.5" />}
              {tab === "REALTIME" ? "Temps Réel" : tab === "MONTHLY" ? "Évol. Mensuelle" : "Par Atelier"}
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Main Cards (Calculated directly from real database objects) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Parc Équipements", value: `${stats.machinesOp}/${stats.totalMachines}`, trend: stats.machinesHS > 0 ? `${stats.machinesHS} hors service` : "100% Opérationnel", color: stats.machinesHS > 0 ? "text-rose-500" : "text-emerald-500", route: "/machines", glowLine: "bg-blue-500", bgGradient: "from-blue-500/20 to-indigo-500/5", icon: Server },
          { title: "Bons de Travail", value: `${stats.totalOT} OT`, trend: `${stats.otEnCours} en cours`, color: stats.otEnCours > 0 ? "text-blue-500" : "text-emerald-500", route: "/interventions", glowLine: "bg-purple-500", bgGradient: "from-purple-500/20 to-pink-500/5", icon: Wrench },
          { title: "Plan Préventif", value: `${stats.totalPreventif} Tâches`, trend: `${stats.preventifTermines} terminées`, color: "text-emerald-500", route: "/plan-preventif", glowLine: "bg-emerald-500", bgGradient: "from-emerald-500/20 to-teal-500/5", icon: Calendar },
          { title: "Pièces en Stock", value: `${stats.totalStock} Réf.`, trend: stats.stockEnRupture > 0 ? `${stats.stockEnRupture} rupture(s)` : "Stock Optimal", color: stats.stockEnRupture > 0 ? "text-rose-500" : "text-emerald-500", route: "/stock", glowLine: "bg-amber-500", bgGradient: "from-amber-500/20 to-yellow-500/5", icon: Package },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} onClick={() => navigate(stat.route)}
              className="relative overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm cursor-pointer group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${stat.glowLine} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10 flex flex-col justify-between h-full pt-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{stat.title}</h3>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight group-hover:scale-105 transition-transform origin-left">{stat.value}</span>
                  <span className={`text-xs font-bold ${stat.color} bg-white/80 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700`}>{stat.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-200/60 dark:border-blue-800/40 p-5 rounded-2xl shadow-sm">
          <h3 className="text-xs font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-600" /> MTBF Moyen</h3>
          <p className="text-xs text-zinc-500 mb-2">Cible : ≥ 300 h</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">{stats.mtbfHours} h</span>
            <span className={`text-xs font-bold pb-1 ${stats.mtbfHours >= 300 ? "text-emerald-600" : "text-amber-500"}`}>{stats.mtbfHours >= 300 ? "Conforme" : "À surveiller"}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/60 dark:border-emerald-800/40 p-5 rounded-2xl shadow-sm">
          <h3 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Wrench className="w-4 h-4 text-emerald-600" /> MTTR Moyen</h3>
          <p className="text-xs text-zinc-500 mb-2">Cible : ≤ 4,0 h</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">{stats.mttrHours} h</span>
            <span className={`text-xs font-bold pb-1 ${stats.mttrHours <= 4.0 ? "text-emerald-600" : "text-amber-500"}`}>{stats.mttrHours <= 4.0 ? "Conforme" : "À surveiller"}</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/10 border border-purple-200/60 dark:border-purple-800/40 p-5 rounded-2xl shadow-sm">
          <h3 className="text-xs font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="w-4 h-4 text-purple-600" /> Disponibilité Globale</h3>
          <p className="text-xs text-zinc-500 mb-2">Cible : ≥ 95 %</p>
          <div className="flex items-end gap-2">
            <span className={`text-3xl font-black ${dispoColor}`}>{stats.disponibiliteGlobale} %</span>
            <span className="text-xs font-bold text-emerald-600 pb-1">Temps réel</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/60 dark:border-amber-800/40 p-5 rounded-2xl shadow-sm">
          <h3 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-amber-600" /> Coût Cumulé Total</h3>
          <p className="text-xs text-zinc-500 mb-2">Pièces et Main-d'œuvre OT</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">{stats.coutTotalMAD.toLocaleString("fr-FR")}</span>
            <span className="text-xs font-bold text-zinc-500 pb-1">MAD</span>
          </div>
        </div>
      </div>

      {/* VUE TEMPS RÉEL */}
      {activeTab === "REALTIME" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Cpu className="w-4 h-4 text-[#2f3874] dark:text-blue-400" /> Répartition par Catégorie</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{stats.totalMachines} équipement(s) au total dans le parc</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-[#2f3874] dark:bg-blue-950/50 dark:text-blue-300 rounded-lg">Live</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryStats.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} width={80} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="count" name="Équipements" radius={[0, 6, 6, 0]}>
                      {stats.categoryStats.slice(0, 8).map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Pie Chart (Pure Dynamic Statuses & Colors) */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> État des Équipements</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Distribution — {stats.disponibiliteGlobale}% disponibilité</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg">Live</span>
              </div>
              <div className="h-72 flex items-center">
                <ResponsiveContainer width="60%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusStats} cx="50%" cy="50%" outerRadius={100} dataKey="count" nameKey="status">
                      {stats.statusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.status, index)} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 pl-2">
                  {stats.statusStats.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(s.status, i) }} />
                      <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate">{s.status}</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white ml-auto">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Volume Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" /> Volume OT — 6 Derniers Mois</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Préventifs vs Correctifs — calculé depuis les OTs réels</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-600 rounded-lg">Dynamique</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyOtStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="otPrev" name="OT Préventifs" fill="#2563eb" stackId="a" />
                    <Bar dataKey="otCorr" name="OT Correctifs" fill="#e11d48" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Alerts Box */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-600" /> Alertes Actives</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Machines en panne et pièces en rupture/faibles</p>
                </div>
                {alertCount > 0 && <span className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 rounded-lg">{alertCount} alerte(s)</span>}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {stats.machinesHSList.length === 0 && stats.stockAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-emerald-600">Aucune alerte active</p>
                    <p className="text-xs text-zinc-500 mt-1">Tous les équipements et stocks sont au niveau nominal</p>
                  </div>
                ) : (
                  <>
                    {stats.machinesHSList.map((m: any, i: number) => (
                      <div key={i} onClick={() => navigate("/machines")} className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800 cursor-pointer hover:bg-rose-100 transition-colors">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{m.name || m.reference}</p>
                          <p className="text-[10px] text-rose-600">Machine hors service / en panne</p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                    ))}
                    {stats.stockAlerts.map((s: any, i: number) => (
                      <div key={i} onClick={() => navigate("/stock")} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 cursor-pointer hover:bg-amber-100 transition-colors">
                        <Package className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{s.name || s.reference}</p>
                          <p className="text-[10px] text-amber-600">{Number(s.quantity ?? s.quantite ?? 0) === 0 ? "Rupture de stock" : `Stock faible : ${s.quantity ?? s.quantite} (min: ${s.min ?? s.stockMin})`}</p>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "OT Aujourd'hui", value: stats.otAujourdhui, unit: "OT", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
              { label: "OT Cette Semaine", value: stats.otCetteSemaine, unit: "OT", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
              { label: "OT Ce Mois", value: stats.otCeMois, unit: "OT", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
              { label: "OT Terminés", value: stats.otTermines, unit: "OT", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
              { label: "Ruptures Stock", value: stats.stockEnRupture, unit: "Réf", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/20" },
              { label: "Valeur Stock", value: Math.round(stats.valeurStock / 1000), unit: "k MAD", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
            ].map((kpi, i) => (
              <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-slate-200/60 dark:border-zinc-800/60`}>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1">{kpi.label}</p>
                <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{kpi.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VUE MENSUELLE (100% Dynamic Real Data Charts) */}
      {activeTab === "MONTHLY" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dynamic MTBF Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Clock className="w-4 h-4 text-[#2f3874] dark:text-blue-400" /> Évolution du MTBF (heures)</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">K1 — Temps moyen de bon fonctionnement (Cible ≥ 300 h)</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-[#2f3874] dark:bg-blue-950/50 dark:text-blue-300 rounded-lg">K1 MTBF</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.monthlyOtStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Area type="monotone" dataKey="mtbf" name="MTBF Réalisé (h)" fill="#2563eb" fillOpacity={0.15} stroke="#2563eb" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dynamic Availability & Preventive Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Disponibilité et Respect Préventif (%)</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">K3 (Disponibilité ≥ 95%) et K4 (Respect préventif ≥ 90%)</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg">K3 et K4</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.monthlyOtStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line type="monotone" dataKey="dispo" name="Disponibilité (%)" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: "#059669" }} />
                    <Line type="monotone" dataKey="preventif" name="Respect Préventif (%)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: "#8b5cf6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dynamic Monthly Cost Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-600" /> Évolution des Coûts de Maintenance (MAD)</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">K7 — Cumul pièces de rechange et main-d'œuvre</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-lg">K7 Coûts</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyOtStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <RechartsTooltip cursor={{ fill: "rgba(217, 119, 6, 0.05)" }} contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="coutMAD" name="Coût Mensuel (MAD)" fill="#d97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dynamic Preventive vs Corrective Volume Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600" /> Volume OT Préventifs vs Correctifs</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">K5 — Équilibre préventif vs pannes réelles</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-600 rounded-lg">K5 Ratio</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyOtStats} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Bar dataKey="otPrev" name="OT Préventifs" fill="#2563eb" stackId="a" />
                    <Bar dataKey="otCorr" name="OT Correctifs (Pannes)" fill="#e11d48" stackId="a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VUE PAR ATELIER (Pure Dynamic Real Data) */}
      {activeTab === "ATELIER" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workshop Equipments Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Layers className="w-4 h-4 text-[#2f3874] dark:text-blue-400" /> Équipements par Atelier</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Distribution réelle du parc machines par atelier</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-[#2f3874] dark:bg-blue-950/50 dark:text-blue-300 rounded-lg">Dynamique</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.atelierStats} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="atelier" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                    <Bar dataKey="machinesOp" name="Opérationnels" fill="#059669" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="machinesHS" name="Hors service" fill="#e11d48" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Workshop Availability Chart */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Disponibilité par Atelier (%)</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Calculée d'après les statuts réels des équipements</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-lg">Live</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.atelierStats} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis dataKey="atelier" type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} width={70} />
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="dispo" name="Disponibilité (%)" fill="#059669" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Workshop Table (Strict Single Source of Truth) */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-700 flex justify-between items-center">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-[#2f3874] dark:text-blue-400" /> Synthèse par Atelier — Données Temps Réel
              </h3>
              <span className="text-xs font-mono font-bold text-[#2f3874] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">
                {stats.atelierStats.length} Atelier(s) - {stats.totalMachines} Équipement(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-3">Atelier</th>
                    <th className="px-4 py-3 text-center">Nb Équip.</th>
                    <th className="px-4 py-3 text-center">Criticité A</th>
                    <th className="px-4 py-3 text-center">Opérationnels</th>
                    <th className="px-4 py-3 text-center">Hors Service</th>
                    <th className="px-4 py-3 text-center">Disponibilité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {stats.atelierStats.map((atl, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">{atl.atelier}</td>
                      <td className="px-4 py-3 text-center font-semibold">{atl.nbEquip}</td>
                      <td className="px-4 py-3 text-center">
                        {atl.criticiteA > 0 ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{atl.criticiteA} éq. A</span> : <span className="text-zinc-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">{atl.machinesOp}</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-600">{atl.machinesHS}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${atl.dispo >= 95 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                          {atl.dispo} %
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-bold text-xs">
                    <td className="px-4 py-3 uppercase">TOTAL ATELIERS FABLAB</td>
                    <td className="px-4 py-3 text-center text-blue-400">{stats.totalMachines}</td>
                    <td className="px-4 py-3 text-center text-rose-400">{stats.atelierStats.reduce((a, b) => a + b.criticiteA, 0)}</td>
                    <td className="px-4 py-3 text-center text-emerald-400">{stats.machinesOp}</td>
                    <td className="px-4 py-3 text-center text-rose-400">{stats.machinesHS}</td>
                    <td className="px-4 py-3 text-center text-emerald-400">{stats.disponibiliteGlobale} %</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
