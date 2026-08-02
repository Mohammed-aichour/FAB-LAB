import React from 'react';
import { Send, Eye, Edit3, Trash2, ShieldCheck, Paperclip } from 'lucide-react';
import type { BTItem, BTStatus } from './types';

interface HistoriqueBonTravailProps {
  items: BTItem[];
  onViewPdf: (bt: BTItem) => void;
  onSendEmail: (bt: BTItem) => void;
  onEdit: (bt: BTItem) => void;
  onStatusChange?: (id: string, newStatus: BTStatus) => void;
  onDelete: (id: string) => void;
  onSupervisorReview: (bt: BTItem) => void;
  currentUser?: any;
}

export const HistoriqueBonTravail: React.FC<HistoriqueBonTravailProps> = ({
  items,
  onViewPdf,
  onSendEmail,
  onEdit,
  onDelete,
  onSupervisorReview
}) => {
  const getStatusBadge = (status: BTStatus) => {
    switch (status) {
      case 'Validé':
      case 'Terminé':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'En attente de validation du superviseur':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-extrabold animate-pulse';
      case 'Envoyé':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'En attente':
      case 'En cours':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Refusé':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: // Brouillon
        return 'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critique':
        return 'bg-red-600 text-white shadow-xs';
      case 'Haute':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'Moyenne':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">N° BT / OT</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Équipement / Machine</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Priorité</th>
              <th className="px-3 py-3">Demandeur & Technicien</th>
              <th className="px-3 py-3 text-center">Durée</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="px-4 py-3 text-right">Actions & Validation Superviseur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
            {items.map(bt => (
              <tr key={bt.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-fab-blue">
                  <div>{bt.btNumber}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{bt.otNumber || 'OT-2026-001'}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 font-medium">
                  {bt.date}
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-zinc-900 dark:text-white">{bt.machineName}</div>
                  <div className="text-[11px] text-zinc-500 font-mono">{bt.machineId} • {bt.location}</div>
                  {bt.documentsJoints && bt.documentsJoints.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-fab-blue mt-0.5">
                      <Paperclip className="w-3 h-3" /> {bt.documentsJoints.length} fichier(s)
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                  {bt.maintenanceType}
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getPriorityBadge(bt.priority)}`}>
                    {bt.priority}
                  </span>
                </td>
                <td className="px-3 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{bt.techniciens && bt.techniciens[0] ? bt.techniciens[0].nom : (bt.technicienResponsable || 'Technicien')}</div>
                  <div className="text-[10px] text-zinc-500">Dem. : {bt.demandeurNom || bt.demandeur || 'FabLab'}</div>
                </td>
                <td className="px-3 py-3 text-center font-bold text-fab-blue font-mono">
                  {bt.tempsIntervention} h
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase border ${getStatusBadge(bt.status)}`}>
                    {bt.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Supervisor Review Modal Trigger */}
                    <button
                      onClick={() => onSupervisorReview(bt)}
                      className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold rounded-lg transition-colors border border-purple-200 dark:border-purple-800 flex items-center gap-1 cursor-pointer"
                      title="Superviser & Valider"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Superviseur
                    </button>

                    {/* View PDF */}
                    <button
                      onClick={() => onViewPdf(bt)}
                      className="p-1.5 text-fab-blue bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60 dark:border-blue-800 cursor-pointer"
                      title="Voir / Imprimer PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Send Email */}
                    <button
                      onClick={() => onSendEmail(bt)}
                      className="p-1.5 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/60 dark:border-emerald-800 cursor-pointer"
                      title="Envoyer au superviseur par email"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEdit(bt)}
                      className="p-1.5 text-zinc-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-zinc-700 cursor-pointer"
                      title="Éditer le bon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDelete(bt.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-zinc-500 font-medium">
                  Aucun Bon de Travail enregistré ou ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
