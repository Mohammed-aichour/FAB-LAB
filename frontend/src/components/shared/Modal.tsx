import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidthClass?: string;
}

const Modal = ({ isOpen, onClose, title, children, maxWidthClass = "max-w-xl" }: ModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 select-none cursor-default"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full ${maxWidthClass} overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/80 dark:border-zinc-800 animate-scale-in cursor-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-800/40 gap-4 shrink-0">
          <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-snug">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl bg-slate-200/60 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/60 dark:hover:bg-zinc-700 transition-all flex items-center justify-center shrink-0 cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar text-sm text-slate-700 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
