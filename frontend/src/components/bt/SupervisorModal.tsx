import React, { useState, useRef } from 'react';
import { ShieldCheck, ShieldAlert, Download, FileText, X, PenTool, Paperclip } from 'lucide-react';
import type { BTItem, BTStatus } from './types';
import { generateBTPdf } from './pdfGenerator';

interface SupervisorModalProps {
  bt: BTItem;
  onClose: () => void;
  onApprove: (updatedBt: BTItem) => void;
  onReject: (updatedBt: BTItem) => void;
  currentUser?: any;
}

export const SupervisorModal: React.FC<SupervisorModalProps> = ({
  bt,
  onClose,
  onApprove,
  onReject,
  currentUser
}) => {
  const [comment, setComment] = useState(bt.superviseurCommentaire || '');
  const [superviseurName, setSuperviseurName] = useState(bt.superviseurNom || currentUser?.name || 'Superviseur FabLab');
  const [superviseurFunction, setSuperviseurFunction] = useState(bt.superviseurFonction || 'Responsable Maintenance');
  const [superviseurService, setSuperviseurService] = useState(bt.superviseurService || 'Direction Technique');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleDownloadPdf = async () => {
    const pdfUrl = await generateBTPdf(bt);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Bon_de_Travail_${bt.btNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessAction = (decision: 'APPROUVE' | 'REJETE') => {
    let sigUrl = bt.superviseurSignatureDataUrl;
    if (canvasRef.current && hasSignature) {
      sigUrl = canvasRef.current.toDataURL('image/png');
    }

    const nowStr = new Date().toLocaleString('fr-FR');
    const newStatus: BTStatus = decision === 'APPROUVE' ? 'Validé' : 'Refusé';

    const updatedBt: BTItem = {
      ...bt,
      superviseurNom: superviseurName,
      superviseurFonction: superviseurFunction,
      superviseurService: superviseurService,
      superviseurSignatureDataUrl: sigUrl,
      superviseurAvis: decision,
      superviseurCommentaire: comment,
      status: newStatus,
      updatedAt: Date.now(),
      historiqueEnvois: [
        ...(bt.historiqueEnvois || []),
        {
          id: `audit-${Date.now()}`,
          dateEnvoi: nowStr,
          utilisateur: superviseurName,
          statut: decision === 'APPROUVE' ? 'Validé par le superviseur' : 'Refusé par le superviseur',
          commentaire: comment
        }
      ]
    };

    if (decision === 'APPROUVE') {
      onApprove(updatedBt);
    } else {
      onReject(updatedBt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-auto animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-fab-blue text-white rounded-xl shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                Espace Superviseur — Validation du Bon de Travail
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                Référence : <strong className="text-fab-blue">{bt.btNumber}</strong> (OT : {bt.otNumber || '—'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details Summary Box */}
        <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-zinc-400 font-medium block">Machine / Équipement :</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{bt.machineName}</strong>
            </div>
            <div>
              <span className="text-zinc-400 font-medium block">Type Maintenance :</span>
              <strong className="text-fab-blue">{bt.maintenanceType}</strong>
            </div>
            <div>
              <span className="text-zinc-400 font-medium block">Demandeur :</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{bt.demandeurNom || bt.demandeur}</strong>
            </div>
            <div>
              <span className="text-zinc-400 font-medium block">Temps Passé :</span>
              <strong className="text-emerald-600">{bt.tempsIntervention} h</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-zinc-700">
            <span className="text-zinc-400 font-medium block">Description de la Panne :</span>
            <p className="text-zinc-800 dark:text-zinc-200 font-semibold italic">{bt.descriptionPanne}</p>
          </div>

          {bt.actionsEffectuees && (
            <div>
              <span className="text-zinc-400 font-medium block">Travaux Réalisés :</span>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium">{bt.actionsEffectuees}</p>
            </div>
          )}

          {/* Attachments Section */}
          {bt.documentsJoints && bt.documentsJoints.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-700">
              <span className="text-zinc-400 font-bold flex items-center gap-1.5 mb-1.5">
                <Paperclip className="w-3.5 h-3.5 text-fab-blue" /> Pièces jointes associées ({bt.documentsJoints.length}) :
              </span>
              <div className="flex flex-wrap gap-2">
                {bt.documentsJoints.map(doc => (
                  <a
                    key={doc.id}
                    href={doc.dataUrl || '#'}
                    download={doc.name}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-fab-blue font-bold text-[11px] flex items-center gap-1.5 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> {doc.name} ({(doc.size / 1024).toFixed(0)} KB)
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-lg bg-fab-blue text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger le Dossier PDF Complet
            </button>
            <span className="text-[11px] font-mono text-zinc-500">Statut actuel : {bt.status}</span>
          </div>
        </div>

        {/* Supervisor Input Form */}
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Nom du Superviseur *</label>
              <input
                type="text"
                value={superviseurName}
                onChange={e => setSuperviseurName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Fonction *</label>
              <input
                type="text"
                value={superviseurFunction}
                onChange={e => setSuperviseurFunction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Service *</label>
              <input
                type="text"
                value={superviseurService}
                onChange={e => setSuperviseurService(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">
              Commentaires / Observations de Validation
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none focus:border-fab-blue"
              placeholder="Indiquer les remarques, conditions de validation ou motifs de refus..."
            />
          </div>

          {/* Supervisor Signature Canvas */}
          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-fab-blue" /> Signature Électronique du Superviseur
            </label>
            <div className="border border-slate-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={80}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-20 touch-none cursor-crosshair"
              />
              {!hasSignature && (
                <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 pointer-events-none italic">
                  Signez ci-dessus pour valider ou rejeter...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 font-bold text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => handleProcessAction('REJETE')}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4" /> Rejeter le Bon de Travail
          </button>
          <button
            type="button"
            onClick={() => handleProcessAction('APPROUVE')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" /> Approuver & Valider l'Intervention
          </button>
        </div>
      </div>
    </div>
  );
};
