import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Wrench, Plus, CheckCircle2 } from 'lucide-react';
import type { BTItem, BTTemplate, BTFilterState, BTStatus } from './types';
import { BonTravailCard } from './BonTravailCard';
import { BonTravailForm } from './BonTravailForm';
import { PdfViewer } from './PdfViewer';
import { EmailSender } from './EmailSender';
import { SupervisorModal } from './SupervisorModal';
import { HistoriqueBonTravail } from './HistoriqueBonTravail';
import { SearchBar } from './SearchBar';
import { Filters } from './Filters';
import { generateBTPdf } from './pdfGenerator';

const BT_TEMPLATES: BTTemplate[] = [
  {
    id: 'form-ot',
    name: 'FORMULAIRE — Ordre de Travail (OT)',
    code: 'FORM-OT',
    description: 'Formulaire officiel pour l\'émission des ordres de travail, affectation des techniciens et suivi de maintenance.',
    maintenanceType: 'Corrective',
    defaultPriority: 'Haute',
    iconColor: 'text-rose-600',
    badgeBg: 'bg-rose-600',
  },
  {
    id: 'form-di',
    name: 'FORMULAIRE — Demande d\'Intervention (DI)',
    code: 'FORM-DI',
    description: 'Gabarit officiel de déclaration d\'incident, signalement de défaillances et demandes d\'intervention urgentes.',
    maintenanceType: 'Corrective',
    defaultPriority: 'Moyenne',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-fab-blue',
  },
  {
    id: 'fiche-histo',
    name: 'FICHE — Historique des interventions (par équipement)',
    code: 'FICHE-HISTO',
    description: 'Fiche synthétique d\'enregistrement de l\'historique complet des travaux et coûts par équipement.',
    maintenanceType: 'Préventive',
    defaultPriority: 'Faible',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-600',
  },
  {
    id: 'form-eq',
    name: 'FORMULAIRE — Fiche équipement',
    code: 'FORM-EQ',
    description: 'Formulaire d\'identification technique, criticité, garantie et caractéristiques machine.',
    maintenanceType: 'Préventive',
    defaultPriority: 'Moyenne',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-600',
  },
  {
    id: 'form-pr',
    name: 'FORMULAIRE — Fiche pièce de rechange',
    code: 'FORM-PR',
    description: 'Fiche d\'inventaire des pièces de rechange, stock mini/maxi, emplacements magasin et tarifs.',
    maintenanceType: 'Curative',
    defaultPriority: 'Moyenne',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-600',
  },
  {
    id: 'form-reappro',
    name: 'FORMULAIRE — Demande de réapprovisionnement',
    code: 'FORM-REAPPRO',
    description: 'Formulaire officiel de réapprovisionnement, bons de commande pièces et consommables d\'atelier.',
    maintenanceType: 'Curative',
    defaultPriority: 'Haute',
    iconColor: 'text-cyan-600',
    badgeBg: 'bg-cyan-600',
  }
];

const INITIAL_BT_LIST: BTItem[] = [
  {
    id: 'bt-101',
    btNumber: 'BT-2026-001',
    otNumber: 'OT-2026-001',
    templateId: 'form-ot',
    templateName: 'FORMULAIRE — Ordre de Travail (OT)',
    date: new Date().toISOString().split('T')[0],
    demandeurNom: 'El Amrani',
    demandeurPrenom: 'Youssef',
    demandeurService: 'Usinage CNC',
    demandeurFonction: 'Ingénieur Principal',
    demandeurTel: '+212 6 61 23 45 67',
    demandeurEmail: 'y.elamrani@universiapolis.ma',
    superviseurNom: 'Dr. Bennani Hassan',
    superviseurFonction: 'Responsable FabLab',
    superviseurService: 'Direction Technique',
    machineId: 'FL-009',
    machineName: 'Fraiseuse CNC TPROD 6060',
    location: 'Espace Prototypage - Découpe/Usinage CNC',
    atelier: 'Espace Prototypage',
    serviceDemandeur: 'Usinage CNC',
    maintenanceType: 'Corrective',
    priority: 'Haute',
    descriptionPanne: 'Surchauffe intermittente de la broche principale lors d\'usinages en forte charge.',
    symptomes: 'Température broche > 70°C avec alarme visuelle.',
    causeProbable: 'Filtre de refroidissement obstrué et roulements de la broche encrassés.',
    diagnosticRealise: 'Mesure par caméra thermique FLIR et contrôle d\'ampérage.',
    testsEffectues: 'Test d\'essai sous charge 30 min à 18 000 tr/min.',
    resultatDiagnostic: 'Problème résolu après purge et changement de lubrifiant.',
    actionsEffectuees: 'Nettoyage complet du circuit de refroidissement de la broche, vidange du lubrifiant et test à 18 000 tr/min.',
    procedureSuivie: 'Gamme GAMME-04 FabLab',
    etapesReparation: '1. Purge  2. Nettoyage filtre  3. Essai sur banc',
    piecesRechange: [
      { id: 'p-1', reference: 'PR-012', designation: 'Liquide de refroidissement laser', quantite: 1, stockDisponible: 4, prixUnitaire: 260, total: 260 },
      { id: 'p-2', reference: 'PR-017', designation: 'Graisse guides / vis', quantite: 1, stockDisponible: 3, prixUnitaire: 90, total: 90 }
    ],
    outilsUtilises: [
      { id: 'o-1', outil: 'Clé six pans 10mm (FL-026)', quantite: 1, observations: 'Opérationnel' }
    ],
    heureDebutIntervention: '08:30',
    heureFinIntervention: '11:00',
    tempsIntervention: 2.5,
    tempsArretMachine: 2.5,
    verificationTerminee: true,
    verificationTestee: true,
    verificationConforme: true,
    verificationNettoyage: true,
    verificationValidationTechnique: true,
    techniciens: [
      { id: 't-1', nom: 'Technicien GMAO', fonction: 'Technicien Maintenance', heureDebut: '08:30', heureFin: '11:00', tempsPasse: 2.5 }
    ],
    technicienResponsable: 'Technicien GMAO',
    observations: 'Prévoir un contrôle de température au bout de 20 heures d\'utilisation.',
    status: 'Validé',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
    documentsJoints: [],
    historiqueEnvois: []
  },
  {
    id: 'bt-102',
    btNumber: 'BT-2026-002',
    otNumber: 'OT-2026-002',
    templateId: 'form-di',
    templateName: 'FORMULAIRE — Demande d\'Intervention (DI)',
    date: new Date().toISOString().split('T')[0],
    demandeurNom: 'Bennani',
    demandeurPrenom: 'Hassan',
    demandeurService: 'Impression 3D',
    demandeurFonction: 'Responsable FabLab',
    demandeurTel: '+212 6 63 99 88 77',
    demandeurEmail: 'h.bennani@universiapolis.ma',
    superviseurNom: 'Dr. Bennani Hassan',
    superviseurFonction: 'Responsable FabLab',
    superviseurService: 'Direction Technique',
    machineId: 'FL-068',
    machineName: 'Imprimante 3D FFF IDEX Raise3D E2CF',
    location: 'Espace Impression 3D',
    atelier: 'Atelier 3D',
    serviceDemandeur: 'Impression 3D',
    maintenanceType: 'Préventive',
    priority: 'Moyenne',
    descriptionPanne: 'Contrôle périodique mensuel de l\'extrudeur composite IDEX.',
    symptomes: 'Maintenance préventive planifiée',
    causeProbable: 'Usure normale de la buse en carbure de silicium.',
    diagnosticRealise: 'Inspection des buses et contrôle du parallélisme du plateau.',
    testsEffectues: 'Impression de test 3D (Mire de calibration).',
    resultatDiagnostic: 'Parfait état d\'alignement.',
    actionsEffectuees: 'Calibrage de l\'offset X/Y/Z des buses IDEX, nettoyage du plateau en verre et graissage des guidages linéaires.',
    procedureSuivie: 'Procédure Préventive Trimestrielle',
    etapesReparation: '1. Nettoyage  2. Calibrage Z  3. Graissage',
    piecesRechange: [
      { id: 'p-1', reference: 'PR-003', designation: 'Tube PTFE (bowden)', quantite: 1, stockDisponible: 3, prixUnitaire: 45, total: 45 }
    ],
    outilsUtilises: [
      { id: 'o-1', outil: 'Jauge d\'épaisseur', quantite: 1, observations: 'Étalonnée' }
    ],
    heureDebutIntervention: '14:00',
    heureFinIntervention: '15:30',
    tempsIntervention: 1.5,
    tempsArretMachine: 1.5,
    verificationTerminee: true,
    verificationTestee: true,
    verificationConforme: true,
    verificationNettoyage: true,
    verificationValidationTechnique: true,
    techniciens: [
      { id: 't-1', nom: 'Technicien GMAO', fonction: 'Technicien Supérieur', heureDebut: '14:00', heureFin: '15:30', tempsPasse: 1.5 }
    ],
    technicienResponsable: 'Technicien GMAO',
    observations: 'Imprimante en parfait état de marche. Alignement Z vérifié.',
    status: 'Terminé',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 3,
    documentsJoints: [],
    historiqueEnvois: []
  }
];

export const BonTravailPage: React.FC<{ user?: any }> = ({ user }) => {
  const [btList, setBtList] = useState<BTItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BTTemplate | null>(null);
  const [editingBt, setEditingBt] = useState<BTItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // PDF Previewer State
  const [previewBt, setPreviewBt] = useState<BTItem | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);

  // Email Sender State
  const [emailBt, setEmailBt] = useState<BTItem | null>(null);
  const [emailPdfUrl, setEmailPdfUrl] = useState<string | null>(null);

  // Supervisor Review Modal State
  const [supervisorBt, setSupervisorBt] = useState<BTItem | null>(null);

  // Toast Banner State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState<BTFilterState>({
    search: '',
    dateFrom: '',
    dateTo: '',
    machine: 'ALL',
    technician: 'ALL',
    status: 'ALL',
    priority: 'ALL',
    maintenanceType: 'ALL'
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load Work Orders from storage
  useEffect(() => {
    const saved = localStorage.getItem('gmao_bt_list_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBtList(parsed);
          return;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    localStorage.setItem('gmao_bt_list_v3', JSON.stringify(INITIAL_BT_LIST));
    setBtList(INITIAL_BT_LIST);
  }, []);

  const saveBtList = (updated: BTItem[]) => {
    setBtList(updated);
    localStorage.setItem('gmao_bt_list_v3', JSON.stringify(updated));
    window.dispatchEvent(new Event('gmao_data_updated'));
  };

  const handleOpenFill = (template: BTTemplate) => {
    setSelectedTemplate(template);
    setEditingBt(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (bt: BTItem, actionType: 'SAVE_DRAFT' | 'GENERATE_PDF' | 'SEND_EMAIL' | 'SEND_SUPERVISOR') => {
    const exists = btList.some(item => item.id === bt.id);
    let updatedList: BTItem[];
    if (exists) {
      updatedList = btList.map(item => item.id === bt.id ? bt : item);
    } else {
      updatedList = [bt, ...btList];
    }
    saveBtList(updatedList);
    setIsFormOpen(false);

    if (actionType === 'SAVE_DRAFT') {
      triggerToast(`Brouillon du Bon de Travail N° ${bt.btNumber} enregistré avec succès.`);
    } else if (actionType === 'GENERATE_PDF') {
      const pdfUrl = await generateBTPdf(bt);
      setPreviewBt(bt);
      setPreviewPdfUrl(pdfUrl);
    } else if (actionType === 'SEND_EMAIL') {
      const pdfUrl = await generateBTPdf(bt);
      setEmailBt(bt);
      setEmailPdfUrl(pdfUrl);
    } else if (actionType === 'SEND_SUPERVISOR') {
      const pdfUrl = await generateBTPdf(bt);
      setEmailBt(bt);
      setEmailPdfUrl(pdfUrl);
      triggerToast(`Dossier complet transmis au superviseur. Statut mis à jour : En attente de validation.`);
    }
  };

  const handleViewPdf = async (bt: BTItem) => {
    const pdfUrl = await generateBTPdf(bt);
    setPreviewBt(bt);
    setPreviewPdfUrl(pdfUrl);
  };

  const handleSendEmailModal = async (bt: BTItem) => {
    const pdfUrl = await generateBTPdf(bt);
    setEmailBt(bt);
    setEmailPdfUrl(pdfUrl);
  };

  const handleSupervisorApproval = (updatedBt: BTItem) => {
    const updated = btList.map(item => item.id === updatedBt.id ? updatedBt : item);
    saveBtList(updated);
    setSupervisorBt(null);
    triggerToast(`Le Bon de Travail N° ${updatedBt.btNumber} a été ${updatedBt.status.toLowerCase()} par le superviseur !`);
  };

  const handleStatusChange = (id: string, newStatus: BTStatus) => {
    const updated = btList.map(item => item.id === id ? { ...item, status: newStatus, updatedAt: Date.now() } : item);
    saveBtList(updated);
    triggerToast(`Statut du BT mis à jour : ${newStatus}`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce Bon de Travail ?")) {
      const updated = btList.filter(item => item.id !== id);
      saveBtList(updated);
      setIsFormOpen(false);
      triggerToast("Bon de Travail supprimé.");
    }
  };

  const machineOptions = useMemo(() => {
    const setEq = new Set<string>();
    btList.forEach(item => { if (item.machineName) setEq.add(item.machineName); });
    return Array.from(setEq).sort();
  }, [btList]);

  const technicianOptions = useMemo(() => {
    const setTech = new Set<string>();
    btList.forEach(item => {
      if (item.techniciens && item.techniciens.length > 0) {
        item.techniciens.forEach(t => setTech.add(t.nom));
      } else if (item.technicienResponsable) {
        setTech.add(item.technicienResponsable);
      }
    });
    return Array.from(setTech).sort();
  }, [btList]);

  const filteredBtList = useMemo(() => {
    return btList.filter(item => {
      const query = filters.search.toLowerCase().trim();
      const techNames = (item.techniciens || []).map(t => t.nom.toLowerCase()).join(' ');
      const matchSearch =
        query === '' ||
        item.btNumber.toLowerCase().includes(query) ||
        (item.otNumber && item.otNumber.toLowerCase().includes(query)) ||
        item.machineName.toLowerCase().includes(query) ||
        item.machineId.toLowerCase().includes(query) ||
        techNames.includes(query) ||
        (item.technicienResponsable && item.technicienResponsable.toLowerCase().includes(query)) ||
        item.descriptionPanne.toLowerCase().includes(query) ||
        (item.demandeurNom && item.demandeurNom.toLowerCase().includes(query));

      const matchStatus = filters.status === 'ALL' || item.status === filters.status;
      const matchPriority = filters.priority === 'ALL' || item.priority === filters.priority;
      const matchType = filters.maintenanceType === 'ALL' || item.maintenanceType === filters.maintenanceType;
      const matchMachine = filters.machine === 'ALL' || item.machineName === filters.machine;

      return matchSearch && matchStatus && matchPriority && matchType && matchMachine;
    });
  }, [btList, filters]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Bons de Travail & Ordres d'Intervention
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-fab-blue text-white shadow-xs">
              Conforme SAP PM / IBM Maximo
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Formulaires structurés en 13 sections, validation dynamique, signature numérique et transmission superviseur
          </p>
        </div>

        <button
          onClick={() => handleOpenFill(BT_TEMPLATES[0])}
          className="px-5 py-2.5 rounded-xl bg-fab-blue text-white font-bold text-xs shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nouveau Bon de Travail (OT)
        </button>
      </div>

      {/* Toast Success Message */}
      {toastMessage && (
        <div className="p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md flex items-center justify-between animate-fade-in-up">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* SECTION 1: PDF TEMPLATES CARDS (4 Cards) */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-fab-blue" /> Modèles de Bons de Travail PDF Disponibles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BT_TEMPLATES.map(tpl => (
            <BonTravailCard
              key={tpl.id}
              template={tpl}
              onFill={handleOpenFill}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: SEARCH & FILTERS BAR */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <SearchBar
            value={filters.search}
            onChange={val => setFilters({ ...filters, search: val })}
          />

          <Filters
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters({
              search: '',
              dateFrom: '',
              dateTo: '',
              machine: 'ALL',
              technician: 'ALL',
              status: 'ALL',
              priority: 'ALL',
              maintenanceType: 'ALL'
            })}
            machineOptions={machineOptions}
            technicianOptions={technicianOptions}
          />
        </div>
      </div>

      {/* SECTION 3: HISTORIQUE TABLE & CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-fab-blue" /> Historique des Bons de Travail ({filteredBtList.length})
          </h2>
        </div>

        <HistoriqueBonTravail
          items={filteredBtList}
          onViewPdf={handleViewPdf}
          onSendEmail={handleSendEmailModal}
          onEdit={bt => { setEditingBt(bt); setIsFormOpen(true); }}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onSupervisorReview={bt => setSupervisorBt(bt)}
          currentUser={user}
        />
      </div>

      {/* MODAL / FORM: BonTravailForm */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto custom-scrollbar my-auto">
            <BonTravailForm
              template={selectedTemplate}
              initialData={editingBt}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              onDeleteCurrent={handleDelete}
              currentUser={user}
            />
          </div>
        </div>
      )}

      {/* MODAL / SUPERVISOR REVIEW */}
      {supervisorBt && (
        <SupervisorModal
          bt={supervisorBt}
          onClose={() => setSupervisorBt(null)}
          onApprove={handleSupervisorApproval}
          onReject={handleSupervisorApproval}
          currentUser={user}
        />
      )}

      {/* MODAL / PDF VIEWER: PdfViewer */}
      {previewBt && previewPdfUrl && (
        <PdfViewer
          bt={previewBt}
          pdfDataUrl={previewPdfUrl}
          onClose={() => { setPreviewBt(null); setPreviewPdfUrl(null); }}
          onSendEmail={handleSendEmailModal}
        />
      )}

      {/* MODAL / EMAIL SENDER: EmailSender */}
      {emailBt && (
        <EmailSender
          bt={emailBt}
          pdfDataUrl={emailPdfUrl || undefined}
          onClose={() => { setEmailBt(null); setEmailPdfUrl(null); }}
          onSuccess={sentEmail => {
            handleStatusChange(emailBt.id, 'Envoyé');
            setEmailBt(null);
            setEmailPdfUrl(null);
            triggerToast(`Bon de travail envoyé avec succès par email à ${sentEmail} !`);
          }}
        />
      )}
    </div>
  );
};
