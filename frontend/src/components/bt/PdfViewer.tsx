import React from 'react';
import { Download, Printer, Send, X, FileText } from 'lucide-react';
import type { BTItem } from './types';

interface PdfViewerProps {
  bt: BTItem;
  pdfDataUrl: string;
  onClose: () => void;
  onSendEmail?: (bt: BTItem) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  bt,
  pdfDataUrl,
  onClose,
  onSendEmail
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = `Bon_de_Travail_${bt.btNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfDataUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header Bar */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-fab-blue text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                Prévisualisation Officielle PDF — {bt.btNumber}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">Équipement: {bt.machineName} ({bt.machineId})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-blue-50 text-fab-blue dark:bg-blue-950/60 dark:text-blue-300 font-bold hover:bg-blue-100 text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
            >
              <Download className="w-4 h-4" /> Télécharger PDF
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold hover:bg-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>

            {onSendEmail && (
              <button
                onClick={() => onSendEmail(bt)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" /> Envoyer au Superviseur
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-xl transition-colors font-bold ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Embedded Iframe Preview */}
        <div className="flex-1 bg-zinc-800 p-2 overflow-hidden relative">
          <iframe
            src={pdfDataUrl}
            title={`Aperçu PDF ${bt.btNumber}`}
            className="w-full h-full rounded-xl border-none shadow-lg bg-white"
          />
        </div>
      </div>
    </div>
  );
};
