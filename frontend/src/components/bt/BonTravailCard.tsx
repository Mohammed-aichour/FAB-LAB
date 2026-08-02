import React from 'react';
import { FileText, FileSpreadsheet, ArrowRight } from 'lucide-react';
import type { BTTemplate } from './types';

interface BonTravailCardProps {
  template: BTTemplate;
  onFill: (template: BTTemplate) => void;
}

export const BonTravailCard: React.FC<BonTravailCardProps> = ({ template, onFill }) => {
  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
      <div className="space-y-3">
        {/* Header Icon & Code */}
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-2xl ${template.badgeBg} text-white shadow-xs`}>
            <FileText className="w-6 h-6" />
          </div>
          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700">
            Modèle {template.code}
          </span>
        </div>

        {/* Template Title & Description */}
        <div>
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-snug group-hover:text-fab-blue transition-colors">
            {template.name}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium leading-relaxed line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-fab-blue dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Type: {template.maintenanceType}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Priorité: {template.defaultPriority}
          </span>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Trame PDF Incluse
        </span>
        <button
          onClick={() => onFill(template)}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-fab-blue text-white hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group-hover:px-5"
        >
          Remplir <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
