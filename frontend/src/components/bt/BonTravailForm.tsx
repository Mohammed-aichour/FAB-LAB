import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Wrench, RotateCcw, PenTool, Plus, Trash2, CheckCircle2, AlertCircle, 
  FileText, Upload, Printer, Download, Send, Eye, RefreshCw, Layers, 
  User, ShieldCheck, Clock, Settings, PackageCheck, Wrench as ToolIcon, FileSpreadsheet, Paperclip
} from 'lucide-react';
import type { 
  BTItem, BTTemplate, MaintenanceType, PriorityLevel, BTStatus, 
  TechnicienAssignation, PieceRechangeLigne, OutilLigne, DocumentJoint 
} from './types';
import { db } from '../../services/db';

interface BonTravailFormProps {
  template?: BTTemplate | null;
  initialData?: BTItem | null;
  onSubmit: (bt: BTItem, actionType: 'SAVE_DRAFT' | 'GENERATE_PDF' | 'SEND_EMAIL' | 'SEND_SUPERVISOR') => void;
  onCancel: () => void;
  onDeleteCurrent?: (id: string) => void;
  currentUser?: any;
}

export const BonTravailForm: React.FC<BonTravailFormProps> = ({
  template,
  initialData,
  onSubmit,
  onCancel,
  onDeleteCurrent,
  currentUser
}) => {
  const machinesList = db.getMachines();
  const stockItemsList = db.getStock();

  const generateBtNumber = () => `BT-2026-${Math.floor(100 + Math.random() * 900)}`;
  const generateOtNumber = () => `OT-2026-${Math.floor(100 + Math.random() * 900)}`;

  const firstMachine = machinesList[0];
  const firstMachineId = firstMachine ? String(firstMachine.id) : 'FL-009';

  // Initial State Setup
  const [formData, setFormData] = useState<BTItem>(() => {
    if (initialData) {
      return {
        ...initialData,
        otNumber: initialData.otNumber || generateOtNumber(),
        demandeurNom: initialData.demandeurNom || initialData.demandeur || 'El Amrani',
        demandeurPrenom: initialData.demandeurPrenom || 'Youssef',
        demandeurService: initialData.demandeurService || initialData.service || 'Prototypage & Fabrication',
        demandeurFonction: initialData.demandeurFonction || 'Ingénieur Fabrication',
        demandeurTel: initialData.demandeurTel || '+212 6 61 23 45 67',
        demandeurEmail: initialData.demandeurEmail || 'y.elamrani@universiapolis.ma',
        superviseurNom: initialData.superviseurNom || 'Dr. Bennani Hassan',
        superviseurFonction: initialData.superviseurFonction || 'Responsable FabLab',
        superviseurService: initialData.superviseurService || 'Direction Technique',
        atelier: initialData.atelier || 'Espace Prototypage',
        serviceDemandeur: initialData.serviceDemandeur || 'Atelier Fabrication',
        techniciens: initialData.techniciens && initialData.techniciens.length > 0 ? initialData.techniciens : [
          { id: 'tech-1', nom: currentUser?.name || 'Technicien GMAO', fonction: 'Technicien Supérieur', heureDebut: '08:30', heureFin: '11:00', tempsPasse: 2.5 }
        ],
        symptomes: initialData.symptomes || 'Bruit anormal et baisse de régime',
        causeProbable: initialData.causeProbable || 'Usure des composants & encrassement',
        diagnosticRealise: initialData.diagnosticRealise || 'Inspection visuelle et contrôle électrique',
        testsEffectues: initialData.testsEffectues || 'Test sous tension et mesure d\'impédance',
        resultatDiagnostic: initialData.resultatDiagnostic || 'Défaillance identifiée sur le composant secondaire',
        actionsEffectuees: initialData.actionsEffectuees || initialData.interventionRealisee || 'Démontage, nettoyage, remplacement et réétalonnage',
        procedureSuivie: initialData.procedureSuivie || 'Procédure GAMME-04 FabLab',
        etapesReparation: initialData.etapesReparation || '1. Isolement  2. Remplacement  3. Test d\'effort',
        piecesRechange: initialData.piecesRechange && initialData.piecesRechange.length > 0 ? initialData.piecesRechange : [
          { id: 'p-1', reference: 'PR-001', designation: 'Buse laiton 0.4 mm (FDM)', quantite: 1, stockDisponible: 12, prixUnitaire: 25, total: 25 }
        ],
        outilsUtilises: initialData.outilsUtilises && initialData.outilsUtilises.length > 0 ? initialData.outilsUtilises : [
          { id: 'o-1', outil: 'Clé six pans 10mm (FL-026)', quantite: 1, observations: 'Opérationnel' },
          { id: 'o-2', outil: 'Multimètre de mesure', quantite: 1, observations: 'Vérifié' }
        ],
        heureDebutIntervention: initialData.heureDebutIntervention || '08:30',
        heureFinIntervention: initialData.heureFinIntervention || '11:00',
        tempsIntervention: initialData.tempsIntervention || 2.5,
        tempsArretMachine: initialData.tempsArretMachine || 2.5,
        verificationTerminee: initialData.verificationTerminee !== undefined ? initialData.verificationTerminee : true,
        verificationTestee: initialData.verificationTestee !== undefined ? initialData.verificationTestee : true,
        verificationConforme: initialData.verificationConforme !== undefined ? initialData.verificationConforme : true,
        verificationNettoyage: initialData.verificationNettoyage !== undefined ? initialData.verificationNettoyage : true,
        verificationValidationTechnique: initialData.verificationValidationTechnique !== undefined ? initialData.verificationValidationTechnique : true,
        documentsJoints: initialData.documentsJoints || [],
        historiqueEnvois: initialData.historiqueEnvois || []
      };
    }

    return {
      id: `bt-${Date.now()}`,
      btNumber: generateBtNumber(),
      otNumber: generateOtNumber(),
      templateId: template?.id || 'tpl-corr',
      templateName: template?.name || 'Bon de Travail Correctif',
      date: new Date().toISOString().split('T')[0],
      priority: template?.defaultPriority || 'Haute',
      status: 'Brouillon' as BTStatus,
      maintenanceType: template?.maintenanceType || 'Corrective',
      machineId: firstMachineId,
      machineName: firstMachine?.name || 'Fraiseuse CNC TPROD 6060',
      location: firstMachine?.location || 'Espace Prototypage',
      atelier: 'Espace Prototypage & Fabrication',
      serviceDemandeur: 'Atelier Usinage / Impression 3D',

      demandeurNom: 'El Amrani',
      demandeurPrenom: 'Youssef',
      demandeurService: 'Prototypage & Fabrication',
      demandeurFonction: 'Ingénieur Fabrication',
      demandeurTel: '+212 6 61 23 45 67',
      demandeurEmail: 'y.elamrani@universiapolis.ma',

      superviseurNom: 'Dr. Bennani Hassan',
      superviseurFonction: 'Responsable FabLab',
      superviseurService: 'Direction Technique',

      techniciens: [
        { id: 'tech-1', nom: currentUser?.name || 'Technicien GMAO', fonction: 'Technicien Maintenance', heureDebut: '08:30', heureFin: '11:00', tempsPasse: 2.5 }
      ],

      descriptionPanne: 'Surchauffe et vibration anormale constatée en cours d\'utilisation.',
      symptomes: 'Elévation de température > 65°C et arrêt de sécurité.',
      causeProbable: 'Filtre de refroidissement encrassé et manque de lubrification.',

      diagnosticRealise: 'Mesure de température infrarouge et contrôle d\'alignement.',
      testsEffectues: 'Test d\'isolation électrique et contrôle de vitesse de rotation.',
      resultatDiagnostic: 'Broche fonctionnelle après nettoyage du circuit.',

      actionsEffectuees: 'Nettoyage du filtre, purge du lubrifiant et rajout de graisse haute performance.',
      procedureSuivie: 'Procédure GAMME-04 FabLab',
      etapesReparation: '1. Démontage capot  2. Nettoyage filtre  3. Remontage et test 30 min',

      piecesRechange: [
        { id: 'p-1', reference: 'PR-001', designation: 'Buse laiton 0.4 mm (FDM)', quantite: 1, stockDisponible: 12, prixUnitaire: 25, total: 25 }
      ],

      outilsUtilises: [
        { id: 'o-1', outil: 'Clé six pans 10mm (FL-026)', quantite: 1, observations: 'Bon état' }
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

      observations: 'Prévoir une vérification de la tension de courroie dans 20h d\'utilisation.',
      documentsJoints: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      historiqueEnvois: []
    };
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    if (formData.signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSignature(true);
      };
      img.src = formData.signatureDataUrl;
    }
  }, [formData.signatureDataUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return;
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
    if (!isDrawing || isReadOnly) return;
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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setFormData(prev => ({ ...prev, signatureDataUrl: undefined }));
  };

  // Auto-calculate Intervention Duration
  useEffect(() => {
    if (formData.heureDebutIntervention && formData.heureFinIntervention) {
      const [h1, m1] = formData.heureDebutIntervention.split(':').map(Number);
      const [h2, m2] = formData.heureFinIntervention.split(':').map(Number);
      if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
        let startMin = h1 * 60 + m1;
        let endMin = h2 * 60 + m2;
        if (endMin < startMin) endMin += 24 * 60; // Overnight shift support
        const durationHours = parseFloat(((endMin - startMin) / 60).toFixed(2));
        setFormData(prev => ({ ...prev, tempsIntervention: durationHours }));
      }
    }
  }, [formData.heureDebutIntervention, formData.heureFinIntervention]);

  // Machine change handler (100% Excel Source Compliance)
  const handleMachineChange = (mId: string) => {
    const m = machinesList.find(item => String(item.id) === mId || item.reference === mId || item.name === mId);
    if (m) {
      setFormData(prev => ({
        ...prev,
        machineId: String(m.reference || m.id),
        machineName: m.name || m.designation,
        location: m.location || m.atelier || 'Espace FabLab',
        atelier: m.atelier || m.location || 'Atelier FabLab'
      }));
    }
  };

  // Add / Remove Technicians
  const addTechnicien = () => {
    const newTech: TechnicienAssignation = {
      id: `tech-${Date.now()}`,
      nom: 'Nouveau Technicien',
      fonction: 'Technicien Maintenance',
      heureDebut: formData.heureDebutIntervention || '08:30',
      heureFin: formData.heureFinIntervention || '11:00',
      tempsPasse: formData.tempsIntervention || 2.5
    };
    setFormData(prev => ({ ...prev, techniciens: [...prev.techniciens, newTech] }));
  };

  const removeTechnicien = (id: string) => {
    setFormData(prev => ({ ...prev, techniciens: prev.techniciens.filter(t => t.id !== id) }));
  };

  const updateTechnicien = (id: string, field: keyof TechnicienAssignation, value: any) => {
    setFormData(prev => ({
      ...prev,
      techniciens: prev.techniciens.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        if (field === 'heureDebut' || field === 'heureFin') {
          const [h1, m1] = (field === 'heureDebut' ? value : t.heureDebut).split(':').map(Number);
          const [h2, m2] = (field === 'heureFin' ? value : t.heureFin).split(':').map(Number);
          if (!isNaN(h1) && !isNaN(m1) && !isNaN(h2) && !isNaN(m2)) {
            let startM = h1 * 60 + m1;
            let endM = h2 * 60 + m2;
            if (endM < startM) endM += 24 * 60;
            updated.tempsPasse = parseFloat(((endM - startM) / 60).toFixed(2));
          }
        }
        return updated;
      })
    }));
  };

  // Add / Remove Spare Parts
  const addPieceRechange = () => {
    const firstStock = stockItemsList[0];
    const newPiece: PieceRechangeLigne = {
      id: `p-${Date.now()}`,
      reference: firstStock?.reference || 'PR-001',
      designation: firstStock?.name || 'Composant de rechange',
      quantite: 1,
      stockDisponible: firstStock?.quantity || 10,
      prixUnitaire: firstStock?.unitCostMAD || firstStock?.priceMAD || 50,
      total: firstStock?.unitCostMAD || firstStock?.priceMAD || 50
    };
    setFormData(prev => ({ ...prev, piecesRechange: [...prev.piecesRechange, newPiece] }));
  };

  const removePieceRechange = (id: string) => {
    setFormData(prev => ({ ...prev, piecesRechange: prev.piecesRechange.filter(p => p.id !== id) }));
  };

  const updatePieceRechange = (id: string, field: keyof PieceRechangeLigne, value: any) => {
    setFormData(prev => ({
      ...prev,
      piecesRechange: prev.piecesRechange.map(p => {
        if (p.id !== id) return p;
        if (field === 'reference') {
          const matchedItem = stockItemsList.find(st => st.reference === value || st.name === value);
          if (matchedItem) {
            const qty = p.quantite || 1;
            const pu = matchedItem.unitCostMAD || matchedItem.priceMAD || 50;
            return {
              ...p,
              reference: matchedItem.reference,
              designation: matchedItem.name,
              stockDisponible: matchedItem.quantity,
              prixUnitaire: pu,
              total: qty * pu
            };
          }
        }
        const updated = { ...p, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          const qty = field === 'quantite' ? Number(value) : p.quantite;
          const pu = field === 'prixUnitaire' ? Number(value) : p.prixUnitaire;
          updated.total = (qty || 0) * (pu || 0);
        }
        return updated;
      })
    }));
  };

  // Total Spare Parts Price
  const totalPiecesPrice = useMemo(() => {
    return formData.piecesRechange.reduce((sum, p) => sum + (p.total || 0), 0);
  }, [formData.piecesRechange]);

  // Add / Remove Tools
  const addOutil = () => {
    const newTool: OutilLigne = {
      id: `o-${Date.now()}`,
      outil: 'Outillage spécifique',
      quantite: 1,
      observations: 'Bon état'
    };
    setFormData(prev => ({ ...prev, outilsUtilises: [...prev.outilsUtilises, newTool] }));
  };

  const removeOutil = (id: string) => {
    setFormData(prev => ({ ...prev, outilsUtilises: prev.outilsUtilises.filter(o => o.id !== id) }));
  };

  const updateOutil = (id: string, field: keyof OutilLigne, value: any) => {
    setFormData(prev => ({
      ...prev,
      outilsUtilises: prev.outilsUtilises.map(o => o.id === id ? { ...o, [field]: value } : o)
    }));
  };

  // Upload Documents
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newDoc: DocumentJoint = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl
        };
        setFormData(prev => ({ ...prev, documentsJoints: [...prev.documentsJoints, newDoc] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDocument = (id: string) => {
    setFormData(prev => ({ ...prev, documentsJoints: prev.documentsJoints.filter(d => d.id !== id) }));
  };

  // Automated Form Validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.btNumber) errors.push("Numéro du Bon de Travail requis.");
    if (!formData.date) errors.push("Date d'intervention requise.");
    if (!formData.machineId) errors.push("Machine / Équipement obligatoire.");
    if (!formData.demandeurNom.trim()) errors.push("Nom du demandeur obligatoire.");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.demandeurEmail && !emailRegex.test(formData.demandeurEmail)) {
      errors.push("Format d'Email du demandeur invalide.");
    }

    if (!formData.descriptionPanne || formData.descriptionPanne.trim().length < 5) {
      errors.push("Description détaillée de la panne obligatoire (min. 5 caractères).");
    }

    if (!formData.actionsEffectuees || formData.actionsEffectuees.trim().length < 5) {
      errors.push("Détail des travaux et intervention réalisée obligatoire.");
    }

    if (formData.tempsIntervention <= 0) {
      errors.push("Le temps d'intervention doit être une valeur numérique supérieure à 0.");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle Form Submission Actions
  const handleFormAction = (actionType: 'SAVE_DRAFT' | 'GENERATE_PDF' | 'SEND_EMAIL' | 'SEND_SUPERVISOR' | 'RESET' | 'PRINT' | 'EXPORT_EXCEL') => {
    if (actionType === 'RESET') {
      if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tout le formulaire ?")) {
        setFormData({
          id: `bt-${Date.now()}`,
          btNumber: generateBtNumber(),
          otNumber: generateOtNumber(),
          date: new Date().toISOString().split('T')[0],
          priority: 'Moyenne',
          status: 'Brouillon',
          maintenanceType: 'Corrective',
          machineId: firstMachineId,
          machineName: firstMachine?.name || 'Machine FabLab',
          location: firstMachine?.location || 'Atelier',
          atelier: 'Espace Prototypage',
          serviceDemandeur: 'Maintenance',
          demandeurNom: '', demandeurPrenom: '', demandeurService: '', demandeurFonction: '', demandeurTel: '', demandeurEmail: '',
          superviseurNom: '', superviseurFonction: '', superviseurService: '',
          techniciens: [],
          descriptionPanne: '', symptomes: '', causeProbable: '',
          diagnosticRealise: '', testsEffectues: '', resultatDiagnostic: '',
          actionsEffectuees: '', procedureSuivie: '', etapesReparation: '',
          piecesRechange: [], outilsUtilises: [],
          heureDebutIntervention: '08:00', heureFinIntervention: '10:00', tempsIntervention: 2, tempsArretMachine: 2,
          verificationTerminee: false, verificationTestee: false, verificationConforme: false, verificationNettoyage: false, verificationValidationTechnique: false,
          observations: '', documentsJoints: [], createdAt: Date.now(), updatedAt: Date.now(), historiqueEnvois: []
        });
        clearSignature();
        setValidationErrors([]);
      }
      return;
    }

    if (actionType === 'PRINT') {
      window.print();
      return;
    }

    if (actionType === 'EXPORT_EXCEL') {
      exportToExcel();
      return;
    }

    // Run Validation for submission/sending
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let sigUrl = formData.signatureDataUrl;
    if (canvasRef.current && hasSignature) {
      sigUrl = canvasRef.current.toDataURL('image/png');
    }

    const nowStr = new Date().toLocaleString('fr-FR');
    let updatedStatus = formData.status;

    if (actionType === 'SEND_SUPERVISOR') {
      updatedStatus = 'En attente de validation du superviseur';
    } else if (actionType === 'SEND_EMAIL') {
      updatedStatus = 'Envoyé';
    }

    const newEnvoi = (actionType === 'SEND_SUPERVISOR' || actionType === 'SEND_EMAIL') ? {
      id: `audit-${Date.now()}`,
      dateEnvoi: nowStr,
      utilisateur: currentUser?.name || formData.demandeurNom || 'Technicien GMAO',
      statut: updatedStatus,
      destinataireEmail: formData.demandeurEmail,
      commentaire: `Transmission automatique — ${actionType === 'SEND_SUPERVISOR' ? 'Demande de validation superviseur' : 'Email envoyeur'}`
    } : null;

    const finalBT: BTItem = {
      ...formData,
      status: updatedStatus,
      signatureDataUrl: sigUrl,
      updatedAt: Date.now(),
      historiqueEnvois: newEnvoi ? [...(formData.historiqueEnvois || []), newEnvoi] : (formData.historiqueEnvois || [])
    };

    onSubmit(finalBT, actionType);
  };

  // Export BT to Excel / CSV
  const exportToExcel = () => {
    const headers = ["N° BT", "N° OT", "Date", "Machine", "Priorite", "Statut", "Demandeur", "Technicien", "Duree (h)", "Panne"];
    const row = [
      formData.btNumber,
      formData.otNumber,
      formData.date,
      `"${formData.machineName}"`,
      formData.priority,
      formData.status,
      `"${formData.demandeurNom} ${formData.demandeurPrenom}"`,
      `"${formData.techniciens[0]?.nom || ''}"`,
      formData.tempsIntervention,
      `"${formData.descriptionPanne.replace(/"/g, '""')}"`
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), row.join(",")].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bon_de_Travail_${formData.btNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden max-w-5xl mx-auto my-4 animate-fade-in-up">
      
      {/* FIXED ACTION TOOLBAR AT TOP */}
      <div className="sticky top-0 z-30 bg-slate-900/95 dark:bg-black/95 backdrop-blur-md text-white p-3.5 px-6 border-b border-slate-700 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fab-blue rounded-xl text-white shadow-xs">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              {formData.btNumber} <span className="text-[11px] font-mono text-zinc-400">({formData.otNumber})</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              GMAO SAP/Maximo Work Order System
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsReadOnly(!isReadOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isReadOnly ? 'bg-amber-600 text-white' : 'bg-slate-800 text-zinc-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> {isReadOnly ? "Mode Édition" : "Mode Lecteur"}
          </button>

          <button
            type="button"
            onClick={() => handleFormAction('SAVE_DRAFT')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-all cursor-pointer"
            title="Enregistrer en brouillon"
          >
            Enregistrer
          </button>

          <button
            type="button"
            onClick={() => handleFormAction('RESET')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-zinc-300 font-bold hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1"
            title="Réinitialiser le formulaire"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
          </button>

          <button
            type="button"
            onClick={() => handleFormAction('PRINT')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-zinc-300 font-bold hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1"
            title="Imprimer"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimer
          </button>

          <button
            type="button"
            onClick={() => handleFormAction('EXPORT_EXCEL')}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-600 transition-all cursor-pointer flex items-center gap-1"
            title="Exporter en Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>

          <button
            type="button"
            onClick={() => handleFormAction('GENERATE_PDF')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            title="Générer & Aperçu PDF"
          >
            <Download className="w-3.5 h-3.5" /> Générer PDF
          </button>

          <button
            type="button"
            onClick={() => handleFormAction('SEND_SUPERVISOR')}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            title="Valider & Envoyer au superviseur"
          >
            <Send className="w-3.5 h-3.5" /> Envoyer au Superviseur
          </button>

          {initialData && onDeleteCurrent && (
            <button
              type="button"
              onClick={() => onDeleteCurrent(formData.id)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold transition-all cursor-pointer"
              title="Supprimer ce bon"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl border border-slate-700 text-zinc-300 font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* VALIDATION ERRORS BANNER */}
      {validationErrors.length > 0 && (
        <div className="m-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
            <AlertCircle className="w-4 h-4" /> Erreurs de validation détectées avant l'envoi :
          </div>
          <ul className="list-disc list-inside text-xs text-rose-600 dark:text-rose-400 font-medium pl-2">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* FORM BODY CONTAINER */}
      <form onSubmit={e => e.preventDefault()} className="p-6 space-y-6 text-xs">

        {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> 1. Informations Générales du Bon de Travail
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Numéro Bon de Travail *</label>
              <input
                type="text"
                readOnly
                value={formData.btNumber}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-100 dark:bg-zinc-800 font-mono font-bold text-fab-blue outline-none"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Numéro Ordre d'Intervention (OT) *</label>
              <input
                type="text"
                readOnly
                value={formData.otNumber}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-100 dark:bg-zinc-800 font-mono font-bold text-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Date de Création / Émission *</label>
              <input
                type="date"
                disabled={isReadOnly}
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none focus:border-fab-blue"
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Priorité *</label>
              <select
                disabled={isReadOnly}
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none focus:border-fab-blue cursor-pointer"
              >
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
                <option value="Critique">Critique (Urgence Maximale)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Statut d'Avancement *</label>
              <select
                disabled={isReadOnly}
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as BTStatus })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold text-fab-blue outline-none cursor-pointer"
              >
                <option value="Brouillon">Brouillon</option>
                <option value="En attente">En attente</option>
                <option value="En attente de validation du superviseur">En attente de validation du superviseur</option>
                <option value="Envoyé">Envoyé</option>
                <option value="En cours">En cours d'exécution</option>
                <option value="Validé">Validé</option>
                <option value="Refusé">Refusé</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Type d'Intervention *</label>
              <select
                disabled={isReadOnly}
                value={formData.maintenanceType}
                onChange={e => setFormData({ ...formData, maintenanceType: e.target.value as MaintenanceType })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none focus:border-fab-blue cursor-pointer"
              >
                <option value="Préventive">Préventive (Révision)</option>
                <option value="Corrective">Corrective (Dépannage)</option>
                <option value="Curative">Curative (Remplacement)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Machine Concernée * (Référentiel Excel)</label>
              <select
                disabled={isReadOnly}
                value={formData.machineId}
                onChange={e => handleMachineChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none focus:border-fab-blue cursor-pointer"
              >
                {machinesList.map(m => (
                  <option key={String(m.id || m.reference)} value={String(m.reference || m.id)}>{m.reference} — {m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Localisation / Atelier *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
          </div>

          {/* EXCEL MACHINE DETAILS SUMMARY BANNER (100% EXCEL COMPLIANCE) */}
          {(() => {
            const activeM = machinesList.find(m => String(m.reference) === formData.machineId || String(m.id) === formData.machineId || m.name === formData.machineName);
            if (!activeM) return null;
            return (
              <div className="mt-3 p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800 text-[11px] space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 dark:border-blue-800 pb-1.5 font-bold">
                  <span className="text-fab-blue uppercase tracking-wider flex items-center gap-1">
                    ✓ Fiche Équipement Source Excel (Conformité 100%)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-fab-blue text-white font-mono text-[10px]">
                    Réf. {activeM.reference} | Criticité {activeM.criticite || 'A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Désignation</span><strong>{activeM.name}</strong></div>
                  <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Marque / Modèle</span><strong>{activeM.marque || '—'} / {activeM.modele || '—'}</strong></div>
                  <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">N° de Série</span><strong className="font-mono">{activeM.serialNumber || 'SN-FABLAB'}</strong></div>
                  <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Localisation</span><strong>{activeM.location || activeM.atelier}</strong></div>
                  <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">État actuel</span><strong className="text-emerald-600">{activeM.status || 'Opérationnel'}</strong></div>
                  <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Mise en service</span><strong>{activeM.commissionDate || '2021-01-01'}</strong></div>
                </div>
                {activeM.caracteristiques && (
                  <div className="text-[10px] text-zinc-500 font-mono pt-1">
                    <strong>Spécifications :</strong> {activeM.caracteristiques} {activeM.logiciel ? `• Pilotage: ${activeM.logiciel}` : ''}
                  </div>
                )}
              </div>
            );
          })()}
        </fieldset>

        {/* SECTION 2: DEMANDEUR */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <User className="w-4 h-4" /> 2. Informations du Demandeur
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Nom *</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.demandeurNom}
                onChange={e => setFormData({ ...formData, demandeurNom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Prénom</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.demandeurPrenom}
                onChange={e => setFormData({ ...formData, demandeurPrenom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Service</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.demandeurService}
                onChange={e => setFormData({ ...formData, demandeurService: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Fonction</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.demandeurFonction}
                onChange={e => setFormData({ ...formData, demandeurFonction: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Téléphone</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.demandeurTel}
                onChange={e => setFormData({ ...formData, demandeurTel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Email *</label>
              <input
                type="email"
                disabled={isReadOnly}
                value={formData.demandeurEmail}
                onChange={e => setFormData({ ...formData, demandeurEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* SECTION 3: RESPONSABLE / SUPERVISEUR */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> 3. Responsable / Superviseur Référent
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Nom du Superviseur</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.superviseurNom}
                onChange={e => setFormData({ ...formData, superviseurNom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Fonction</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.superviseurFonction}
                onChange={e => setFormData({ ...formData, superviseurFonction: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Service</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.superviseurService}
                onChange={e => setFormData({ ...formData, superviseurService: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
              />
            </div>
          </div>
        </fieldset>

        {/* SECTION 4: TECHNICIEN(S) (TABLEAU DYNAMIQUE MULTI-TECHNICIENS) */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <User className="w-4 h-4" /> 4. Technicien(s) Intervenant(s) ({formData.techniciens.length})
            </legend>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addTechnicien}
                className="px-3 py-1.5 rounded-xl bg-fab-blue text-white font-bold text-xs flex items-center gap-1 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un Technicien
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-zinc-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Nom du Technicien</th>
                  <th className="px-3 py-2">Fonction</th>
                  <th className="px-3 py-2 text-center">Heure Début</th>
                  <th className="px-3 py-2 text-center">Heure Fin</th>
                  <th className="px-3 py-2 text-center">Temps Passé (h)</th>
                  {!isReadOnly && <th className="px-3 py-2 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                {formData.techniciens.map((tech) => (
                  <tr key={tech.id}>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={tech.nom}
                        onChange={e => updateTechnicien(tech.id, 'nom', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={tech.fonction}
                        onChange={e => updateTechnicien(tech.id, 'fonction', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="time"
                        disabled={isReadOnly}
                        value={tech.heureDebut}
                        onChange={e => updateTechnicien(tech.id, 'heureDebut', e.target.value)}
                        className="px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-center"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="time"
                        disabled={isReadOnly}
                        value={tech.heureFin}
                        onChange={e => updateTechnicien(tech.id, 'heureFin', e.target.value)}
                        className="px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-center"
                      />
                    </td>
                    <td className="p-2 text-center font-bold text-emerald-600 font-mono">
                      {tech.tempsPasse} h
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeTechnicien(tech.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>

        {/* SECTION 5: DESCRIPTION DE LA PANNE */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> 5. Description de la Panne & Symptômes
          </legend>

          <div className="space-y-3">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Description Détaillée de la Défaillance *</label>
              <textarea
                required
                rows={2}
                disabled={isReadOnly}
                value={formData.descriptionPanne}
                onChange={e => setFormData({ ...formData, descriptionPanne: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none focus:border-fab-blue"
                placeholder="Détailler la panne constatée, conditions d'apparition, dysfonctionnements..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Symptômes Constatés</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formData.symptomes}
                  onChange={e => setFormData({ ...formData, symptomes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                  placeholder="Ex: Vibration, bruit métallique, message d'erreur E-402..."
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Cause Probable</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formData.causeProbable}
                  onChange={e => setFormData({ ...formData, causeProbable: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                  placeholder="Ex: Surchauffe, usure prématurée du composant, court-circuit..."
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* SECTION 6: DIAGNOSTIC */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <Settings className="w-4 h-4" /> 6. Diagnostic & Tests d'Expertise
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Diagnostic Réalisé</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={formData.diagnosticRealise}
                onChange={e => setFormData({ ...formData, diagnosticRealise: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                placeholder="Diagnostic visuel, électrique, mécanique..."
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Tests Effectués</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={formData.testsEffectues}
                onChange={e => setFormData({ ...formData, testsEffectues: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                placeholder="Contrôle de continuité, mesure de tension..."
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Résultat du Diagnostic</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={formData.resultatDiagnostic}
                onChange={e => setFormData({ ...formData, resultatDiagnostic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                placeholder="Résultats et état du système..."
              />
            </div>
          </div>
        </fieldset>

        {/* SECTION 7: TRAVAUX RÉALISÉS */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <Wrench className="w-4 h-4" /> 7. Travaux & Actions d'Intervention Réalisés
          </legend>

          <div className="space-y-3">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Actions Effectuées & Réparation *</label>
              <textarea
                required
                rows={3}
                disabled={isReadOnly}
                value={formData.actionsEffectuees}
                onChange={e => setFormData({ ...formData, actionsEffectuees: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none focus:border-fab-blue"
                placeholder="Détailler toutes les opérations de remise en service effectuées..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Procédure Suivie</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formData.procedureSuivie}
                  onChange={e => setFormData({ ...formData, procedureSuivie: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                  placeholder="Ex: Procédure Gamme Préventive N°2..."
                />
              </div>
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Étapes de Réparation</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formData.etapesReparation}
                  onChange={e => setFormData({ ...formData, etapesReparation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none"
                  placeholder="Ex: 1. Démontage  2. Nettoyage  3. Remplacement  4. Test..."
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* SECTION 8: PIÈCES DE RECHANGE (TABLEAU DYNAMIQUE AVEC RECHERCHE STOCK MAGASIN) */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4" /> 8. Pièces de Rechange & Consommables ({formData.piecesRechange.length})
            </legend>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addPieceRechange}
                className="px-3 py-1.5 rounded-xl bg-fab-blue text-white font-bold text-xs flex items-center gap-1 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une Pièce du Stock
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-zinc-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 min-w-[140px]">Référence</th>
                  <th className="px-3 py-2 min-w-[200px]">Désignation</th>
                  <th className="px-3 py-2 text-center w-20">Quantité</th>
                  <th className="px-3 py-2 text-center w-24">Stock Dispo</th>
                  <th className="px-3 py-2 text-right w-28">Prix Unitaire (MAD)</th>
                  <th className="px-3 py-2 text-right w-28">Total (MAD)</th>
                  {!isReadOnly && <th className="px-3 py-2 text-right w-12">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                {formData.piecesRechange.map((p) => (
                  <tr key={p.id}>
                    <td className="p-2">
                      <select
                        disabled={isReadOnly}
                        value={p.reference}
                        onChange={e => updatePieceRechange(p.id, 'reference', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono font-bold text-fab-blue cursor-pointer"
                      >
                        {stockItemsList.map(st => (
                          <option key={st.reference} value={st.reference}>
                            {st.reference} — {st.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={p.designation}
                        onChange={e => updatePieceRechange(p.id, 'designation', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-medium"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={isReadOnly}
                        value={p.quantite}
                        onChange={e => updatePieceRechange(p.id, 'quantite', parseInt(e.target.value) || 1)}
                        className="w-full text-center px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold text-fab-blue"
                      />
                    </td>
                    <td className="p-2 text-center font-bold text-zinc-500 font-mono">
                      {p.stockDisponible}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      <input
                        type="number"
                        min="0"
                        disabled={isReadOnly}
                        value={p.prixUnitaire}
                        onChange={e => updatePieceRechange(p.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                        className="w-full text-right px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-emerald-600 font-mono">
                      {p.total.toLocaleString('fr-FR')} MAD
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removePieceRechange(p.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Coût Total Pièces : <strong className="font-mono text-sm">{totalPiecesPrice.toLocaleString('fr-FR')} MAD</strong>
            </div>
          </div>
        </fieldset>

        {/* SECTION 9: OUTILS UTILISÉS */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <ToolIcon className="w-4 h-4" /> 9. Outils & Équipements Utilisés ({formData.outilsUtilises.length})
            </legend>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addOutil}
                className="px-3 py-1.5 rounded-xl bg-fab-blue text-white font-bold text-xs flex items-center gap-1 hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un Outil
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-zinc-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 min-w-[220px]">Outil / Équipement</th>
                  <th className="px-3 py-2 text-center w-24">Quantité</th>
                  <th className="px-3 py-2">Observations</th>
                  {!isReadOnly && <th className="px-3 py-2 text-right w-12">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                {formData.outilsUtilises.map((o) => (
                  <tr key={o.id}>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={o.outil}
                        onChange={e => updateOutil(o.id, 'outil', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold text-zinc-800 dark:text-zinc-200"
                        placeholder="Ex: Station de soudage, Clé dynamométrique..."
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="1"
                        disabled={isReadOnly}
                        value={o.quantite}
                        onChange={e => updateOutil(o.id, 'quantite', parseInt(e.target.value) || 1)}
                        className="w-full text-center px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={o.observations}
                        onChange={e => updateOutil(o.id, 'observations', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 dark:border-zinc-700 rounded-lg text-zinc-500"
                        placeholder="Ex: Étalonné, Bon état..."
                      />
                    </td>
                    {!isReadOnly && (
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeOutil(o.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>

        {/* SECTION 10: TEMPS D'INTERVENTION */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> 10. Temps d'Intervention & Arrêt Machine
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Heure Début *</label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formData.heureDebutIntervention}
                onChange={e => setFormData({ ...formData, heureDebutIntervention: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Heure Fin *</label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formData.heureFinIntervention}
                onChange={e => setFormData({ ...formData, heureFinIntervention: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Durée Calculée (heures)</label>
              <input
                type="number"
                readOnly
                value={formData.tempsIntervention}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-slate-100 dark:bg-zinc-800 font-mono font-bold text-fab-blue text-center"
              />
            </div>
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Temps d'Arrêt Machine (h)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                disabled={isReadOnly}
                value={formData.tempsArretMachine}
                onChange={e => setFormData({ ...formData, tempsArretMachine: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono font-bold text-rose-600 text-center"
              />
            </div>
          </div>
        </fieldset>

        {/* SECTION 11: VÉRIFICATION FINALE */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 11. Vérification & Validation Finale de Qualité
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-fab-blue">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formData.verificationTerminee}
                onChange={e => setFormData({ ...formData, verificationTerminee: e.target.checked })}
                className="w-4 h-4 text-fab-blue rounded"
              />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Intervention terminée</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-fab-blue">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formData.verificationTestee}
                onChange={e => setFormData({ ...formData, verificationTestee: e.target.checked })}
                className="w-4 h-4 text-fab-blue rounded"
              />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Machine testée</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-fab-blue">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formData.verificationConforme}
                onChange={e => setFormData({ ...formData, verificationConforme: e.target.checked })}
                className="w-4 h-4 text-fab-blue rounded"
              />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Conforme</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-fab-blue">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formData.verificationNettoyage}
                onChange={e => setFormData({ ...formData, verificationNettoyage: e.target.checked })}
                className="w-4 h-4 text-fab-blue rounded"
              />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Nettoyage effectué</span>
            </label>

            <label className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-fab-blue">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formData.verificationValidationTechnique}
                onChange={e => setFormData({ ...formData, verificationValidationTechnique: e.target.checked })}
                className="w-4 h-4 text-fab-blue rounded"
              />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Validation technique</span>
            </label>
          </div>
        </fieldset>

        {/* SECTION 12: OBSERVATIONS */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> 12. Observations & Recommandations Complémentaires
          </legend>

          <textarea
            rows={3}
            disabled={isReadOnly}
            value={formData.observations}
            onChange={e => setFormData({ ...formData, observations: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-medium outline-none focus:border-fab-blue"
            placeholder="Notes complémentaires, recommandations de sécurité, prochaines échéances de maintenance..."
          />
        </fieldset>

        {/* SECTION 13: DOCUMENTS JOINTS */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
          <div className="flex items-center justify-between">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <Paperclip className="w-4 h-4" /> 13. Documents Joints & Pièces Jointes ({formData.documentsJoints.length})
            </legend>
            {!isReadOnly && (
              <label className="px-3 py-1.5 rounded-xl bg-fab-blue text-white font-bold text-xs flex items-center gap-1.5 hover:bg-blue-700 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Joindre Fichiers (PDF, Images, Word, Excel)
                <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {formData.documentsJoints.map(doc => (
              <div key={doc.id} className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 text-fab-blue shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">{doc.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{(doc.size / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {formData.documentsJoints.length === 0 && (
              <div className="col-span-full p-4 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-center text-zinc-400 font-medium">
                Aucun document ou image joint. Téléchargez vos schémas, photos de pannes ou rapports.
              </div>
            )}
          </div>
        </fieldset>

        {/* SIGNATURE SECTION */}
        <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
          <div className="flex justify-between items-center">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <PenTool className="w-4 h-4" /> Signature Numérique du Technicien
            </legend>
            {hasSignature && !isReadOnly && (
              <button
                type="button"
                onClick={clearSignature}
                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Effacer la signature
              </button>
            )}
          </div>

          <div className="border border-slate-300 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={90}
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
                Dessinez votre signature numérique ci-dessus...
              </span>
            )}
          </div>
        </fieldset>

      </form>
    </div>
  );
};
