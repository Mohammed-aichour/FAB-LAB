import { useMemo } from "react";
import { useGmao } from "../context/GmaoContext";

export interface AtelierStat {
  atelier: string;
  nbEquip: number;
  criticiteA: number;
  machinesOp: number;
  machinesHS: number;
  dispo: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface MonthlyOtStat {
  month: string;
  otPrev: number;
  otCorr: number;
  total: number;
}

export interface StatusStat {
  status: string;
  count: number;
  color: string;
}

export interface GmaoStats {
  // Machines
  totalMachines: number;
  machinesOp: number;
  machinesHS: number;
  machinesEnMaint: number;
  disponibiliteGlobale: number;

  // Stock
  totalStock: number;
  stockEnRupture: number;
  stockFaible: number;
  valeurStock: number;

  // Interventions
  totalOT: number;
  otEnCours: number;
  otTermines: number;
  otEnAttente: number;
  otAnnules: number;
  otAujourdhui: number;
  otCetteSemaine: number;
  otCeMois: number;
  coutTotalMAD: number;

  // Preventif
  totalPreventif: number;
  preventifMoisCourant: number;
  preventifSemaine: number;
  preventifTermines: number;

  // Charts data
  atelierStats: AtelierStat[];
  categoryStats: CategoryStat[];
  monthlyOtStats: MonthlyOtStat[];
  statusStats: StatusStat[];
  stockAlerts: any[];
  machinesHSList: any[];
}

const MONTHS_FR = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];

export const useGmaoStats = (): GmaoStats => {
  const { machines, stock, interventions, preventif } = useGmao();

  return useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Machines ──────────────────────────────────────────────────────────────
    const totalMachines = machines.length;
    const machinesOp = machines.filter((m) =>
      m.status === "Operationnel" || m.status === "Opérationnel" || m.status === "Marche"
    ).length;
    const machinesHS = machines.filter((m) =>
      m.status === "Hors service" || m.status === "En Panne" || m.status === "Ne marche pas" || m.status === "Hors Service"
    ).length;
    const machinesEnMaint = machines.filter((m) =>
      m.status === "En maintenance" || m.status === "Maintenance"
    ).length;
    const disponibiliteGlobale = totalMachines > 0
      ? Math.round((machinesOp / totalMachines) * 1000) / 10
      : 100;

    const machinesHSList = machines.filter((m) =>
      m.status === "Hors service" || m.status === "En Panne" || m.status === "Hors Service"
    );

    // ── Stock ─────────────────────────────────────────────────────────────────
    const totalStock = stock.length;
    const stockEnRupture = stock.filter((s) => (s.quantity || 0) === 0).length;
    const stockFaible = stock.filter((s) => {
      const q = s.quantity || 0;
      const mn = s.min || 0;
      return mn > 0 && q > 0 && q <= mn;
    }).length;
    const valeurStock = stock.reduce((acc, s) => {
      return acc + ((s.quantity || 0) * (s.unitCostMAD || s.priceMAD || 0));
    }, 0);

    const stockAlerts = stock
      .filter((s) => {
        const q = s.quantity || 0;
        const mn = s.min || 0;
        return q === 0 || (mn > 0 && q <= mn);
      })
      .slice(0, 8);

    // ── Interventions ─────────────────────────────────────────────────────────
    const totalOT = interventions.length;
    const otTermines = interventions.filter((o) => o.status === "Terminé" || o.status === "Termine" || o.status === "Clôturé" || o.status === "Cloture").length;
    const otEnCours = interventions.filter((o) => o.status === "En cours").length;
    const otEnAttente = interventions.filter((o) => o.status === "En attente").length;
    const otAnnules = interventions.filter((o) => o.status === "Annulé" || o.status === "Annule").length;

    const otAujourdhui = interventions.filter((o) => {
      const d = o.date || o.createdAt || o.scheduledDate || "";
      return d && d.startsWith(todayStr);
    }).length;

    const otCetteSemaine = interventions.filter((o) => {
      const d = o.date || o.createdAt || o.scheduledDate || "";
      if (!d) return false;
      const dt = new Date(d);
      return dt >= startOfWeek && dt <= now;
    }).length;

    const otCeMois = interventions.filter((o) => {
      const d = o.date || o.createdAt || o.scheduledDate || "";
      if (!d) return false;
      const dt = new Date(d);
      return dt >= startOfMonth && dt <= now;
    }).length;

    const coutTotalMAD = interventions.reduce((acc, o) => {
      return acc + (Number(o.partsCostMAD || o.costMAD || 0)) + (Number((o.hoursSpent || 0) * 150));
    }, 0);

    // ── Preventif ─────────────────────────────────────────────────────────────
    const totalPreventif = preventif.length;
    const preventifTermines = preventif.filter((p) => p.status === "Terminé" || p.status === "done" || p.status === "Termine" || p.done === true).length;

    const preventifMoisCourant = preventif.filter((p) => {
      const d = p.date || p.nextDate || p.scheduledDate || "";
      if (!d) return false;
      const dt = new Date(d);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;

    const preventifSemaine = preventif.filter((p) => {
      const d = p.date || p.nextDate || p.scheduledDate || "";
      if (!d) return false;
      const dt = new Date(d);
      return dt >= startOfWeek && dt <= now;
    }).length;

    // ── Chart: Atelier Stats ──────────────────────────────────────────────────
    const atelierMap: Record<string, { op: number; hs: number; critA: number; total: number }> = {};
    machines.forEach((m) => {
      const key = m.atelier || m.zone || m.category || "Autre";
      if (!atelierMap[key]) atelierMap[key] = { op: 0, hs: 0, critA: 0, total: 0 };
      atelierMap[key].total++;
      const isOp = m.status === "Operationnel" || m.status === "Opérationnel" || m.status === "Marche";
      const isHS = m.status === "Hors service" || m.status === "En Panne" || m.status === "Hors Service";
      if (isOp) atelierMap[key].op++;
      if (isHS) atelierMap[key].hs++;
      if (m.criticite === "A") atelierMap[key].critA++;
    });

    const atelierStats: AtelierStat[] = Object.entries(atelierMap).map(([atelier, v]) => ({
      atelier,
      nbEquip: v.total,
      criticiteA: v.critA,
      machinesOp: v.op,
      machinesHS: v.hs,
      dispo: v.total > 0 ? Math.round((v.op / v.total) * 1000) / 10 : 100,
    }));

    // ── Chart: Category Stats ─────────────────────────────────────────────────
    const catMap: Record<string, number> = {};
    machines.forEach((m) => {
      const cat = m.category || "Non classé";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const categoryStats: CategoryStat[] = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    // ── Chart: Monthly OT Stats (last 6 months from real OTs) ────────────────
    const monthlyMap: Record<string, { prev: number; corr: number }> = {};
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { prev: 0, corr: 0 };
    }

    interventions.forEach((o) => {
      const d = o.date || o.createdAt || o.scheduledDate || "";
      if (!d) return;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        const isPreventif = o.type === "Préventif" || o.type === "Preventif" || o.maintenanceType === "Preventive";
        if (isPreventif) monthlyMap[key].prev++;
        else monthlyMap[key].corr++;
      }
    });

    const monthlyOtStats: MonthlyOtStat[] = Object.entries(monthlyMap).map(([key, v]) => {
      const [, m] = key.split("-");
      const monthName = MONTHS_FR[parseInt(m) - 1] || key;
      return { month: monthName, otPrev: v.prev, otCorr: v.corr, total: v.prev + v.corr };
    });

    // ── Chart: Status Stats ───────────────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    machines.forEach((m) => {
      const s = m.status || "Non renseigné";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const STATUS_COLORS: Record<string, string> = {
      "Opérationnel": "#059669",
      "Operationnel": "#059669",
      "Marche": "#059669",
      "Hors service": "#e11d48",
      "En Panne": "#e11d48",
      "Hors Service": "#e11d48",
      "En maintenance": "#d97706",
      "A confirmer": "#8b5cf6",
      "Non renseigne": "#94a3b8",
    };
    const statusStats: StatusStat[] = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      color: STATUS_COLORS[status] || "#94a3b8",
    }));

    return {
      totalMachines,
      machinesOp,
      machinesHS,
      machinesEnMaint,
      disponibiliteGlobale,
      totalStock,
      stockEnRupture,
      stockFaible,
      valeurStock,
      totalOT,
      otEnCours,
      otTermines,
      otEnAttente,
      otAnnules,
      otAujourdhui,
      otCetteSemaine,
      otCeMois,
      coutTotalMAD,
      totalPreventif,
      preventifMoisCourant,
      preventifSemaine,
      preventifTermines,
      atelierStats,
      categoryStats,
      monthlyOtStats,
      statusStats,
      stockAlerts,
      machinesHSList,
    };
  }, [machines, stock, interventions, preventif]);
};
