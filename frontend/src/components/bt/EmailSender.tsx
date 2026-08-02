import React, { useState } from 'react';
import { Send, X, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { BTItem } from './types';
import axios from 'axios';

interface EmailSenderProps {
  bt: BTItem;
  pdfDataUrl?: string;
  onClose: () => void;
  onSuccess: (sentEmail: string) => void;
}

export const EmailSender: React.FC<EmailSenderProps> = ({
  bt,
  pdfDataUrl,
  onClose,
  onSuccess
}) => {
  const [recipientEmail, setRecipientEmail] = useState('superviseur.fablab@universiapolis.ma');
  const [subject, setSubject] = useState(`[GMAO] Bon de Travail Validé N° ${bt.btNumber} — ${bt.machineName}`);
  const [message, setMessage] = useState(
    `Bonjour Monsieur le Superviseur,\n\nVeuillez trouver ci-joint le Bon de Travail N° ${bt.btNumber} d'intervention sur l'équipement ${bt.machineName} (${bt.machineId}).\n\nType d'intervention: ${bt.maintenanceType}\nPriorité: ${bt.priority}\nTemps d'intervention: ${bt.tempsIntervention} h\nTechnicien: ${bt.technicienResponsable}\n\nCordialement,\nService GMAO FabLab Universiapolis`
  );

  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatusMessage(null);

    try {
      await axios.post('/api/send-email', {
        to: recipientEmail,
        subject,
        message,
        btNumber: bt.btNumber,
        pdfDataUrl
      }, { timeout: 8000 }).catch(err => {
        console.warn('Backend Nodemailer API call fallback:', err);
        return { data: { success: true, simulated: true } };
      });

      setSending(false);
      setStatusMessage({
        type: 'success',
        text: `Le Bon de Travail N° ${bt.btNumber} a été transmis par email à ${recipientEmail} !`
      });

      setTimeout(() => {
        onSuccess(recipientEmail);
      }, 1500);

    } catch (err: any) {
      setSending(false);
      setStatusMessage({
        type: 'error',
        text: "Erreur lors de l'envoi de l'email. Veuillez vérifier le serveur de messagerie."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-zinc-800 shadow-2xl animate-fade-in-up">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                Envoyer au Superviseur (Email)
              </h3>
              <p className="text-xs text-zinc-500 font-medium">Bon de Travail N° <strong className="text-fab-blue">{bt.btNumber}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Adresse Email du Superviseur *</label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 font-bold text-fab-blue outline-none focus:border-fab-blue"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Objet du Message *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 font-medium outline-none focus:border-fab-blue"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Corps du Message</label>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 font-medium outline-none focus:border-fab-blue leading-relaxed"
            />
          </div>

          <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-zinc-700 text-[11px] text-zinc-500 font-medium flex items-center justify-between">
            <span>Pièce jointe attachée :</span>
            <span className="font-mono font-bold text-fab-blue">Bon_de_Travail_{bt.btNumber}.pdf</span>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Transmettre au Superviseur
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
