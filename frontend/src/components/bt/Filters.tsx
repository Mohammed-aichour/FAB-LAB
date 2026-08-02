import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { BTFilterState } from './types';

interface FiltersProps {
  filters: BTFilterState;
  onChange: (filters: BTFilterState) => void;
  onReset: () => void;
  machineOptions: string[];
  technicianOptions: string[];
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onChange,
  onReset,
  machineOptions,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.maintenanceType !== 'ALL' ||
    filters.machine !== 'ALL' ||
    filters.technician !== 'ALL';

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      {/* Status Select */}
      <select
        value={filters.status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="px-3 py-2 border border-slate-200 dark:border-zinc-700/80 rounded-xl bg-slate-50/80 dark:bg-zinc-800/80 font-bold text-zinc-800 dark:text-zinc-200 outline-none focus:border-fab-blue cursor-pointer"
      >
        <option value="ALL">Tous les Statuts</option>
        <option value="Brouillon">Brouillon</option>
        <option value="Envoyé">Envoyé</option>
        <option value="En attente">En attente</option>
        <option value="Validé">Validé</option>
        <option value="Refusé">Refusé</option>
        <option value="Terminé">Terminé</option>
      </select>

      {/* Maintenance Type Select */}
      <select
        value={filters.maintenanceType}
        onChange={e => onChange({ ...filters, maintenanceType: e.target.value })}
        className="px-3 py-2 border border-slate-200 dark:border-zinc-700/80 rounded-xl bg-slate-50/80 dark:bg-zinc-800/80 font-bold text-zinc-800 dark:text-zinc-200 outline-none focus:border-fab-blue cursor-pointer"
      >
        <option value="ALL">Tous les Types</option>
        <option value="Préventive">Préventive</option>
        <option value="Corrective">Corrective</option>
        <option value="Curative">Curative</option>
      </select>

      {/* Priority Select */}
      <select
        value={filters.priority}
        onChange={e => onChange({ ...filters, priority: e.target.value })}
        className="px-3 py-2 border border-slate-200 dark:border-zinc-700/80 rounded-xl bg-slate-50/80 dark:bg-zinc-800/80 font-bold text-zinc-800 dark:text-zinc-200 outline-none focus:border-fab-blue cursor-pointer"
      >
        <option value="ALL">Toutes Priorités</option>
        <option value="Faible">Faible</option>
        <option value="Moyenne">Moyenne</option>
        <option value="Haute">Haute</option>
        <option value="Critique">Critique</option>
      </select>

      {/* Machine Select */}
      <select
        value={filters.machine}
        onChange={e => onChange({ ...filters, machine: e.target.value })}
        className="px-3 py-2 border border-slate-200 dark:border-zinc-700/80 rounded-xl bg-slate-50/80 dark:bg-zinc-800/80 font-bold text-zinc-800 dark:text-zinc-200 max-w-[180px] truncate outline-none focus:border-fab-blue cursor-pointer"
      >
        <option value="ALL">Toutes les Machines</option>
        {machineOptions.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* Reset Button */}
      {isFiltered && (
        <button
          onClick={onReset}
          className="px-3 py-2 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </button>
      )}
    </div>
  );
};
