import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Modal from '../components/shared/Modal';
import { 
  FileText, 
  FileSpreadsheet, 
  FileCheck, 
  Download, 
  Eye, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Folder, 
  ShieldCheck,
  ExternalLink,
  Copy,
  Info,
  CheckSquare,
  Square,
  AlertTriangle,
  History,
  Filter,
  ArrowUpDown,
  FileCode,
  Image as ImageIcon,
  Tag,
  Wrench,
  Layers
} from 'lucide-react';

export interface AuditHistory {
  action: string;
  user: string;
  date: string;
}

export interface GEDDocument {
  id: string | number;
  fileName: string;
  title: string;
  description?: string;
  category: string;
  type: string;
  machine: string;
  supplier?: string;
  date: string;
  author?: string;
  size?: string;
  version?: string;
  status?: 'Valide' | 'En Révision' | 'Archivé' | 'Obsolète';
  url: string;
  contentData?: string;
  history?: AuditHistory[];
}

const DEFAULT_GED_DOCS: GEDDocument[] = [
  {
    id: 'doc-1',
    fileName: "FICHE — Historique des interventions (par équipement).pdf",
    title: "Historique des interventions par équipement",
    description: "Fiche officielle GMAO traçant l'historique d'entretien préventif et curatif.",
    category: "Formulaire GMAO",
    type: "PDF",
    machine: "Tous équipements",
    supplier: "GMAO Universiapolis",
    date: "21/07/2026",
    author: "Superviseur GMAO",
    size: "1.4 MB",
    version: "v2.1",
    status: "Valide",
    url: "/docs/FICHE%20%E2%80%94%20Historique%20des%20interventions%20(par%20%C3%A9quipement).pdf",
    history: [{ action: "Création initiale", user: "Superviseur GMAO", date: "21/07/2026 09:30" }]
  },
  {
    id: 'doc-2',
    fileName: "FORMULAIRE — Demande de réapprovisionnement.pdf",
    title: "Demande de réapprovisionnement de stock",
    description: "Formulaire de commande pour réapprovisionnement des consommables.",
    category: "Formulaire GMAO",
    type: "PDF",
    machine: "Magasin GMAO",
    supplier: "Outillage Agadir",
    date: "21/07/2026",
    author: "Ingénieur Stock",
    size: "820 KB",
    version: "v1.0",
    status: "Valide",
    url: "/docs/FORMULAIRE%20%E2%80%94%20Demande%20de%20r%C3%A9approvisionnement.pdf",
    history: [{ action: "Création initiale", user: "Ingénieur Stock", date: "21/07/2026 10:15" }]
  },
  {
    id: 'doc-3',
    fileName: "FORMULAIRE — Fiche pièce de rechange.pdf",
    title: "Fiche pièce de rechange (PR)",
    description: "Fiche d'identification et caractéristiques des pièces de rechange.",
    category: "Formulaire GMAO",
    type: "PDF",
    machine: "Stock & Pièces",
    supplier: "Fournisseur Pièces CNC",
    date: "21/07/2026",
    author: "Technicien Maintenance",
    size: "650 KB",
    version: "v1.2",
    status: "Valide",
    url: "/docs/FORMULAIRE%20%E2%80%94%20Fiche%20pi%C3%A8ce%20de%20rechange.pdf",
    history: [{ action: "Création initiale", user: "Technicien Maintenance", date: "21/07/2026 11:00" }]
  },
  {
    id: 'doc-4',
    fileName: "FORMULAIRE — Fiche équipement.pdf",
    title: "Fiche descriptive d'équipement FabLab",
    description: "Fiche technique globale décrivant la spécification d'un équipement.",
    category: "Fiche technique",
    type: "PDF",
    machine: "Toutes machines",
    supplier: "FabLab Universiapolis",
    date: "21/07/2026",
    author: "Responsable FabLab",
    size: "1.1 MB",
    version: "v2.0",
    status: "Valide",
    url: "/docs/FORMULAIRE%20%E2%80%94%20Fiche%20%C3%A9quipement.pdf",
    history: [{ action: "Création initiale", user: "Responsable FabLab", date: "21/07/2026 14:00" }]
  },
  {
    id: 'doc-5',
    fileName: "Fiche Technique Raise3D E2CF.docx",
    title: "Fiche technique Raise3D E2CF Composite",
    description: "Documentation technique détaillée de l'imprimante 3D Raise3D E2CF.",
    category: "Fiche technique",
    type: "Word",
    machine: "FL-068 — Raise3D E2CF",
    supplier: "Raise3D Technologies",
    date: "21/07/2026",
    author: "Ingénieur Impression 3D",
    size: "2.3 MB",
    version: "v1.5",
    status: "Valide",
    url: "/docs/Fiche%20Technique%20Raise3D%20E2CF.docx",
    history: [{ action: "Création initiale", user: "Ingénieur Impression 3D", date: "21/07/2026 15:20" }]
  },
  {
    id: 'doc-6',
    fileName: "Fiche_Technique_3D_Raise3D_E2CF.docx",
    title: "Manuel d'utilisation Raise3D E2CF",
    description: "Guide d'exploitation et maintenance préventive Raise3D E2CF.",
    category: "Manuel d'utilisation",
    type: "Word",
    machine: "FL-068 — Raise3D E2CF",
    supplier: "Raise3D Technologies",
    date: "21/07/2026",
    author: "Responsable Atelier 3D",
    size: "3.8 MB",
    version: "v1.0",
    status: "Valide",
    url: "/docs/Fiche_Technique_3D_Raise3D_E2CF.docx",
    history: [{ action: "Création initiale", user: "Responsable Atelier 3D", date: "21/07/2026 16:10" }]
  },
  {
    id: 'doc-7',
    fileName: "Fiche_Technique_Perceuse_Fraiseuse_Technodrill.docx",
    title: "Fiche technique Technodrill 3",
    description: "Caractéristiques mécaniques et électriques Technodrill 3.",
    category: "Fiche technique",
    type: "Word",
    machine: "FL-010 — Technodrill 3",
    supplier: "C.I.F France",
    date: "21/07/2026",
    author: "Ingénieur Usinage",
    size: "1.9 MB",
    version: "v1.1",
    status: "Valide",
    url: "/docs/Fiche_Technique_Perceuse_Fraiseuse_Technodrill.docx",
    history: [{ action: "Création initiale", user: "Ingénieur Usinage", date: "21/07/2026 17:00" }]
  },
  {
    id: 'doc-8',
    fileName: "Fiche_Technique_TPROD_6060.docx",
    title: "Fiche technique CNC TPROD 6060",
    description: "Documentation de la fraiseuse CNC TPROD 6060.",
    category: "Fiche technique",
    type: "Word",
    machine: "FL-009 — Fraiseuse CNC TPROD 6060",
    supplier: "PIPROD",
    date: "21/07/2026",
    author: "Superviseur CNC",
    size: "2.1 MB",
    version: "v1.0",
    status: "Valide",
    url: "/docs/Fiche_Technique_TPROD_6060.docx",
    history: [{ action: "Création initiale", user: "Superviseur CNC", date: "21/07/2026 17:30" }]
  },
  {
    id: 'doc-9',
    fileName: "Fiche_Technique_Technodrill_3_CNC.docx",
    title: "Manuel d'utilisation Technodrill 3 CNC",
    description: "Guide utilisateur et procédures de perçage/fraisage PCB.",
    category: "Manuel d'utilisation",
    type: "Word",
    machine: "FL-010 — Technodrill 3",
    supplier: "C.I.F France",
    date: "21/07/2026",
    author: "Responsable Électronique",
    size: "4.2 MB",
    version: "v2.0",
    status: "Valide",
    url: "/docs/Fiche_Technique_Technodrill_3_CNC.docx",
    history: [{ action: "Création initiale", user: "Responsable Électronique", date: "21/07/2026 18:00" }]
  },
  {
    id: 'doc-10',
    fileName: "INVENTAIRE PHYSIQUE UNIVERSIAPOLIS.xlsx",
    title: "Inventaire physique annuel du FabLab",
    description: "Registre de comptage physique annuel des machines et pièces.",
    category: "Registre & Inventaire",
    type: "Tableur",
    machine: "Magasin & Machines",
    supplier: "Universiapolis Agadir",
    date: "21/07/2026",
    author: "Responsable Magasin",
    size: "5.6 MB",
    version: "v3.0",
    status: "Valide",
    url: "/docs/INVENTAIRE%20PHYSIQUE%20UNIVERSIAPOLIS.xlsx",
    history: [{ action: "Création initiale", user: "Responsable Magasin", date: "21/07/2026 18:30" }]
  },
  {
    id: 'doc-11',
    fileName: "Registre_Equipements_Fablab.xlsx",
    title: "Registre des équipements du FabLab",
    description: "Nomenclature générale des machines du FabLab Universiapolis.",
    category: "Registre & Inventaire",
    type: "Tableur",
    machine: "FabLab Universiapolis",
    supplier: "FabLab Universiapolis",
    date: "21/07/2026",
    author: "Direction Technique",
    size: "3.1 MB",
    version: "v2.5",
    status: "Valide",
    url: "/docs/Registre_Equipements_Fablab.xlsx",
    history: [{ action: "Création initiale", user: "Direction Technique", date: "21/07/2026 19:00" }]
  }
];

const getFileIcon = (fileName: string, type?: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const t = (type || '').toLowerCase();

  if (ext === 'pdf' || t.includes('pdf')) {
    return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
  } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || t.includes('excel') || t.includes('tableur')) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
  } else if (ext === 'docx' || ext === 'doc' || t.includes('word')) {
    return <FileCheck className="w-5 h-5 text-blue-500 shrink-0" />;
  } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '') || t.includes('image')) {
    return <ImageIcon className="w-5 h-5 text-purple-500 shrink-0" />;
  } else if (ext === 'txt' || t.includes('texte')) {
    return <FileCode className="w-5 h-5 text-amber-500 shrink-0" />;
  }
  return <Folder className="w-5 h-5 text-zinc-500 shrink-0" />;
};

const Documents = () => {
  const { user } = useOutletContext<{ user?: any }>() || {};
  const [docs, setDocs] = useState<GEDDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Advanced Filters & Sort
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMachine, setFilterMachine] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'NAME_ASC' | 'NAME_DESC' | 'SIZE_DESC'>('DATE_DESC');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [editingDoc, setEditingDoc] = useState<GEDDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<GEDDocument | null>(null);
  const [detailDoc, setDetailDoc] = useState<GEDDocument | null>(null);

  // Upload Form State & Validation
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    category: 'Fiche technique',
    type: 'PDF',
    machine: 'Toutes machines',
    supplier: 'Non spécifié',
    author: user?.name || 'Responsable GMAO',
    version: 'v1.0',
    status: 'Valide' as const
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setDocs(data);
          localStorage.setItem('gmao_documents_v3', JSON.stringify(data));
          return;
        }
      }
    } catch (err) {
      console.warn('Chargement depuis le cache local v3:', err);
    }

    const stored = localStorage.getItem('gmao_documents_v3');
    if (stored) {
      setDocs(JSON.parse(stored));
    } else {
      localStorage.setItem('gmao_documents_v3', JSON.stringify(DEFAULT_GED_DOCS));
      setDocs(DEFAULT_GED_DOCS);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const saveDocsState = (updatedList: GEDDocument[]) => {
    setDocs(updatedList);
    localStorage.setItem('gmao_documents_v3', JSON.stringify(updatedList));
  };

  // Add audit history log helper
  const addAuditLog = (doc: GEDDocument, actionName: string): GEDDocument => {
    const currentLogs = doc.history || [];
    const nowStr = new Date().toLocaleString('fr-FR');
    const newLog: AuditHistory = {
      action: actionName,
      user: user?.name || 'Utilisateur GMAO',
      date: nowStr
    };
    return { ...doc, history: [newLog, ...currentLogs] };
  };

  // Handle File Change with Format & Size Validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || !e.target.files[0]) {
      setSelectedFile(null);
      setFileDataUrl('');
      return;
    }

    const file = e.target.files[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Accepted extensions
    const allowedExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'txt'];
    if (!allowedExts.includes(ext)) {
      setUploadError(`Le format ".${ext}" n'est pas autorisé. Formats acceptés : PDF, Word, Tableur, Images (JPG, PNG, WEBP), Texte (TXT).`);
      setSelectedFile(null);
      return;
    }

    // Size limit: 50 MB
    if (file.size > 50 * 1024 * 1024) {
      setUploadError(`Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). La taille maximale autorisée est de 50 MB.`);
      setSelectedFile(null);
      return;
    }

    // Check duplicate filename in existing GED docs
    const isDuplicate = docs.some(d => d.fileName.toLowerCase() === file.name.toLowerCase());
    if (isDuplicate) {
      setUploadError(`Un document portant le nom "${file.name}" existe déjà dans le registre GED.`);
    }

    setSelectedFile(file);

    // Auto infer document type
    let inferredType = 'PDF';
    if (['doc', 'docx'].includes(ext)) inferredType = 'Word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) inferredType = 'Tableur';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) inferredType = 'Image';
    if (['txt'].includes(ext)) inferredType = 'Texte';

    // Auto infer title if empty
    const autoTitle = file.name.replace(/\.[^/.]+$/, "");
    setNewDoc(prev => ({
      ...prev,
      type: inferredType,
      title: prev.title || autoTitle
    }));

    // Read File Data URL for local preview & offline download
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      if (result && typeof result === 'string') {
        setFileDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError("Veuillez sélectionner un fichier à téléverser.");
      return;
    }

    if (!newDoc.title.trim()) {
      setUploadError("Le titre du document est obligatoire.");
      return;
    }

    const docTitle = newDoc.title.trim();
    const docType = newDoc.type || 'PDF';
    const docMachine = newDoc.machine || 'Toutes machines';
    const nowStr = new Date().toLocaleDateString('fr-FR');
    const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    const formattedSize = selectedFile.size > 1024 * 1024 ? `${fileSizeMB} MB` : `${Math.round(selectedFile.size / 1024)} KB`;

    const createdDoc: GEDDocument = {
      id: `doc-${Date.now()}`,
      fileName: selectedFile.name,
      title: docTitle,
      description: newDoc.description || `${docTitle} - Fichier officiel du FabLab`,
      category: newDoc.category,
      type: docType,
      machine: docMachine,
      supplier: newDoc.supplier || 'Non spécifié',
      date: nowStr,
      author: newDoc.author || user?.name || 'Responsable GMAO',
      size: formattedSize,
      version: newDoc.version || 'v1.0',
      status: newDoc.status || 'Valide',
      url: fileDataUrl || `/docs/${encodeURIComponent(selectedFile.name)}`,
      contentData: fileDataUrl,
      history: [
        {
          action: "Téléversement & Création",
          user: user?.name || 'Responsable GMAO',
          date: new Date().toLocaleString('fr-FR')
        }
      ]
    };

    const updated = [createdDoc, ...docs];
    saveDocsState(updated);

    setIsAddModalOpen(false);
    setSelectedFile(null);
    setFileDataUrl('');
    setNewDoc({
      title: '',
      description: '',
      category: 'Fiche technique',
      type: 'PDF',
      machine: 'Toutes machines',
      supplier: 'Non spécifié',
      author: user?.name || 'Responsable GMAO',
      version: 'v1.0',
      status: 'Valide'
    });

    triggerToast(`➕ Le document "${docTitle}" a été téléversé avec succès !`);
  };

  // Edit Submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    const updatedDoc = addAuditLog(editingDoc, `Modification des métadonnées (Version: ${editingDoc.version})`);
    const updatedList = docs.map(d => d.id === editingDoc.id ? updatedDoc : d);
    saveDocsState(updatedList);

    setIsEditModalOpen(false);
    setEditingDoc(null);
    triggerToast(`Le document "${editingDoc.title}" a été mis à jour avec succès !`);
  };

  // Single Delete
  const handleDeleteDoc = (doc: GEDDocument) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer définitivement le document "${doc.title}" ?`)) return;

    const updatedList = docs.filter(d => d.id !== doc.id);
    saveDocsState(updatedList);

    // Remove from selection
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(doc.id);
      return next;
    });

    triggerToast(`Document "${doc.title}" supprimé du registre GED.`);
  };

  // Multi Delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Voulez-vous vraiment supprimer les ${selectedIds.size} documents sélectionnés ?`)) return;

    const updatedList = docs.filter(d => !selectedIds.has(d.id));
    saveDocsState(updatedList);
    setSelectedIds(new Set());
    triggerToast(`${selectedIds.size} document(s) supprimé(s) du registre GED.`);
  };

  // Helper to generate a 100% valid Data URI / Blob URL for any document
  const generateDocBlobUrl = (doc: GEDDocument): string => {
    if (doc.contentData && doc.contentData.startsWith('data:')) {
      return doc.contentData;
    }
    if (doc.url && doc.url.startsWith('data:')) {
      return doc.url;
    }

    const ext = doc.fileName.split('.').pop()?.toLowerCase();

    if (ext === 'pdf' || doc.type === 'PDF') {
      const pdfSource = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>> >> endobj
4 0 obj <</Length 280>> stream
BT
/F1 16 Tf
50 720 Td
(${doc.title.replace(/[()]/g, '')}) Tj
/F1 11 Tf
0 -30 Td
(GMA LAB - Fiche Officielle GED) Tj
0 -20 Td
(Date: ${doc.date} | Machine: ${doc.machine} | Version: ${doc.version || 'v1.0'}) Tj
0 -20 Td
(Statut: ${doc.status || 'Valide'} | Auteur: ${doc.author || 'Responsable GMAO'}) Tj
0 -40 Td
(Description: ${doc.description?.replace(/[()]/g, '') || 'Fiche officielle enregistree dans la GED GMAO.'}) Tj
ET
endstream endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000240 00000 n 
0000000570 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
640
%%EOF`;
      return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(pdfSource)))}`;
    }

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; }
    .card { background: white; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 700px; margin: 0 auto; }
    h1 { color: #2f3874; margin-top: 0; font-size: 22px; }
    .badge { display: inline-block; padding: 4px 12px; background: #2f3874; color: white; border-radius: 20px; font-size: 11px; font-weight: bold; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; font-size: 13px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 15px 0; }
    p { font-size: 14px; line-height: 1.6; color: #334155; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">GMA LAB</span>
    <h1>${doc.title}</h1>
    <div class="meta">
      <div><strong>Nom Fichier :</strong> ${doc.fileName}</div>
      <div><strong>Catégorie :</strong> ${doc.category}</div>
      <div><strong>Équipement :</strong> ${doc.machine}</div>
      <div><strong>Date :</strong> ${doc.date}</div>
      <div><strong>Auteur :</strong> ${doc.author || 'Responsable GMAO'}</div>
      <div><strong>Statut :</strong> ${doc.status || 'Valide'}</div>
    </div>
    <h3>Description & Spécifications :</h3>
    <p>${doc.description || 'Fichier enregistre dans le registre GED GMAO.'}</p>
  </div>
</body>
</html>`;

    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  };

  // Open Document in New Tab (Visualiser / Imprimer)
  const handleOpenNewWindow = (doc: GEDDocument) => {
    // Record Audit Log
    const updatedDoc = addAuditLog(doc, "Consultation / Ouverture dans un nouvel onglet");
    const updatedList = docs.map(d => d.id === doc.id ? updatedDoc : d);
    saveDocsState(updatedList);

    const validUrl = generateDocBlobUrl(doc);
    
    // Open in a new tab
    const win = window.open(validUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      // Fallback if popups blocked
      handleDownloadDoc(doc);
    }
  };

  // Single Download
  const handleDownloadDoc = (doc: GEDDocument) => {
    // Record Audit Log
    const updatedDoc = addAuditLog(doc, "Téléchargement du fichier");
    const updatedList = docs.map(d => d.id === doc.id ? updatedDoc : d);
    saveDocsState(updatedList);

    const validUrl = generateDocBlobUrl(doc);
    const a = document.createElement('a');
    a.href = validUrl;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerToast(`Téléchargement de "${doc.fileName}" démarré.`);
  };

  // Bulk Download
  const handleBulkDownload = () => {
    const selectedDocs = docs.filter(d => selectedIds.has(d.id));
    selectedDocs.forEach(doc => {
      handleDownloadDoc(doc);
    });
    triggerToast(`Téléchargement lancé pour les ${selectedDocs.length} documents.`);
  };

  // Copy Direct Link
  const handleCopyLink = (doc: GEDDocument) => {
    const fileUrl = doc.contentData || doc.url || `${window.location.origin}/docs/${encodeURIComponent(doc.fileName)}`;
    navigator.clipboard.writeText(fileUrl);
    triggerToast(`🔗 Link de "${doc.title}" copié dans le presse-papiers !`);
  };

  // Open Preview Modal
  const openPreview = (doc: GEDDocument) => {
    setPreviewDoc(doc);
    setIsPreviewModalOpen(true);
  };

  // Open Detail Modal
  const openDetail = (doc: GEDDocument) => {
    setDetailDoc(doc);
    setIsDetailModalOpen(true);
  };

  // Toggle selection check
  const toggleSelectDoc = (id: string | number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Extract unique machines & categories for filters
  const uniqueMachines = useMemo(() => {
    const setM = new Set<string>();
    docs.forEach(d => { if (d.machine) setM.add(d.machine); });
    return Array.from(setM).sort();
  }, [docs]);

  // Filtered & Sorted Documents
  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      // Tab filter
      if (activeTab === 'TECH' && !doc.category.toLowerCase().includes('technique') && !doc.category.toLowerCase().includes('manuel')) return false;
      if (activeTab === 'FORM' && !doc.category.toLowerCase().includes('formulaire') && !doc.category.toLowerCase().includes('entretien')) return false;
      if (activeTab === 'REG' && !doc.category.toLowerCase().includes('registre') && !doc.category.toLowerCase().includes('inventaire')) return false;

      // Dropdown filters
      if (filterCategory !== 'ALL' && doc.category !== filterCategory) return false;
      if (filterType !== 'ALL' && doc.type !== filterType) return false;
      if (filterStatus !== 'ALL' && doc.status !== filterStatus) return false;
      if (filterMachine !== 'ALL' && doc.machine !== filterMachine) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(query);
        const matchFile = doc.fileName.toLowerCase().includes(query);
        const matchMachine = doc.machine.toLowerCase().includes(query);
        const matchType = doc.type.toLowerCase().includes(query);
        const matchCategory = doc.category.toLowerCase().includes(query);
        const matchDesc = (doc.description || '').toLowerCase().includes(query);
        const matchAuthor = (doc.author || '').toLowerCase().includes(query);
        return matchTitle || matchFile || matchMachine || matchType || matchCategory || matchDesc || matchAuthor;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NAME_ASC') return a.title.localeCompare(b.title);
      if (sortBy === 'NAME_DESC') return b.title.localeCompare(a.title);
      if (sortBy === 'DATE_ASC') return a.date.localeCompare(b.date);
      if (sortBy === 'SIZE_DESC') return (parseFloat(b.size || '0') - parseFloat(a.size || '0'));
      return b.date.localeCompare(a.date); // Default DATE_DESC
    });
  }, [docs, activeTab, filterCategory, filterType, filterStatus, filterMachine, searchTerm, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredDocs, currentPage, itemsPerPage]);

  // Toggle select all on current page
  const isAllPageSelected = paginatedDocs.length > 0 && paginatedDocs.every(d => selectedIds.has(d.id));
  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedDocs.forEach(d => next.delete(d.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginatedDocs.forEach(d => next.add(d.id));
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Gestion Documentaire (GED GMA LAB)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-fab-blue text-white shadow-xs">
              {docs.length} Documents
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Registre officiel de la documentation technique, manuels, notices & formulaires d'intervention
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Top Delete Button */}
          {(user?.role === 'Superviseur' || !user) && (
            <button 
              onClick={() => {
                if (selectedIds.size > 0) {
                  handleBulkDelete();
                } else {
                  if (window.confirm("Voulez-vous réinitialiser / supprimer tous les documents du registre GED ?")) {
                    saveDocsState([]);
                    setSelectedIds(new Set());
                    triggerToast("Tous les documents ont été supprimés du registre GED.");
                  }
                }
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-2 shadow-md cursor-pointer"
              title="Supprimer les documents sélectionnés ou réinitialiser"
            >
              <Trash2 className="w-4 h-4" />
              <span>{selectedIds.size > 0 ? `🗑 Supprimer (${selectedIds.size})` : '🗑 Supprimer Tous'}</span>
            </button>
          )}

          {/* Top Add Button */}
          {(user?.role === 'Superviseur' || user?.role === 'Ingénieur' || user?.role === 'Technicien' || !user) && (
            <button 
              onClick={() => { setUploadError(null); setIsAddModalOpen(true); }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-fab-blue text-white hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              title="Ajouter un nouveau document dans la GED"
            >
              <Plus className="w-4 h-4" />
              <span>➕ Ajouter un Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md flex items-center justify-between animate-fade-in-up">
          <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Bulk Selection Bar (Sticky when selected) */}
      {selectedIds.size > 0 && (
        <div className="p-3 px-6 bg-slate-900 text-white rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
          <div className="flex items-center gap-2 font-bold text-xs">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedIds.size} document(s) sélectionné(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger ({selectedIds.size})
            </button>

            {user?.role === 'Superviseur' && (
              <button
                onClick={handleBulkDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer ({selectedIds.size})
              </button>
            )}

            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Désélectionner tout
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs & Quick Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => { setActiveTab('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-fab-blue text-white shadow-xs'
                : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100'
            }`}
          >
            Tous ({docs.length})
          </button>
          <button
            onClick={() => { setActiveTab('TECH'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'TECH'
                ? 'bg-fab-blue text-white shadow-xs'
                : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100'
            }`}
          >
            Fiches Techniques & Manuels
          </button>
          <button
            onClick={() => { setActiveTab('FORM'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'FORM'
                ? 'bg-fab-blue text-white shadow-xs'
                : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100'
            }`}
          >
            Formulaires GMAO
          </button>
          <button
            onClick={() => { setActiveTab('REG'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'REG'
                ? 'bg-fab-blue text-white shadow-xs'
                : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100'
            }`}
          >
            Registres & Inventaires
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par titre, machine, auteur..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 outline-none focus:border-fab-blue"
          />
        </div>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-xs grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
        {/* Filter Category */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Catégorie
          </label>
          <select
            value={filterCategory}
            onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 font-semibold outline-none"
          >
            <option value="ALL">Toutes les catégories</option>
            <option value="Fiche technique">Fiches techniques</option>
            <option value="Manuel d'utilisation">Manuels d'utilisation</option>
            <option value="Formulaire GMAO">Formulaires GMAO</option>
            <option value="Fiche d'entretien">Fiches d'entretien</option>
            <option value="Registre & Inventaire">Registres & Inventaires</option>
            <option value="Facture / Garantie">Factures & Garanties</option>
          </select>
        </div>

        {/* Filter Type */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Type de Fichier
          </label>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 font-semibold outline-none"
          >
            <option value="ALL">Tous les types (PDF, Word...)</option>
            <option value="PDF">PDF (.pdf)</option>
            <option value="Word">Word (.docx, .doc)</option>
            <option value="Tableur">Tableur (.xlsx, .xls)</option>
            <option value="Image">Image (.jpg, .png, .webp)</option>
            <option value="Texte">Texte (.txt)</option>
          </select>
        </div>

        {/* Filter Machine */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Équipement Lié
          </label>
          <select
            value={filterMachine}
            onChange={e => { setFilterMachine(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 font-semibold outline-none"
          >
            <option value="ALL">Tous les équipements</option>
            {uniqueMachines.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Statut
          </label>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 font-semibold outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="Valide">Valide</option>
            <option value="En Révision">En Révision</option>
            <option value="Archivé">Archivé</option>
            <option value="Obsolète">Obsolète</option>
          </select>
        </div>

        {/* Sort selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Ordre de Tri
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 font-bold outline-none text-fab-blue"
          >
            <option value="DATE_DESC">Date (Plus récent)</option>
            <option value="DATE_ASC">Date (Plus ancien)</option>
            <option value="NAME_ASC">Nom (A → Z)</option>
            <option value="NAME_DESC">Nom (Z → A)</option>
            <option value="SIZE_DESC">Taille de fichier</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2f3874] text-white text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-10">
                  <button onClick={toggleSelectAllPage} className="cursor-pointer">
                    {isAllPageSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-zinc-300" />}
                  </button>
                </th>
                <th className="px-4 py-3.5 min-w-[260px]">Titre du Document & Fichier</th>
                <th className="px-4 py-3.5 min-w-[150px]">Catégorie & Type</th>
                <th className="px-4 py-3.5 min-w-[180px]">Équipement & Fournisseur</th>
                <th className="px-3.5 py-3.5 text-center">Version / Statut</th>
                <th className="px-3.5 py-3.5 text-center">Taille / Date</th>
                <th className="px-5 py-3.5 text-right min-w-[240px]">Actions Fonctionnelles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
              {paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                    <Folder className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">Aucun document ne correspond à vos critères de recherche.</p>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map(doc => {
                  const isSelected = selectedIds.has(doc.id);

                  return (
                    <tr 
                      key={doc.id} 
                      className={`transition-colors ${isSelected ? 'bg-blue-50/80 dark:bg-blue-950/40' : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => toggleSelectDoc(doc.id)} className="cursor-pointer">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-fab-blue" /> : <Square className="w-4 h-4 text-zinc-400" />}
                        </button>
                      </td>

                      {/* Title & Filename */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">{getFileIcon(doc.fileName, doc.type)}</div>
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-white hover:text-fab-blue cursor-pointer transition-colors" onClick={() => openDetail(doc)}>
                              {doc.title}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400 font-normal truncate max-w-xs">{doc.fileName}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                          {doc.category}
                        </span>
                        <div className="text-[10px] text-zinc-400 font-mono mt-1">Type : {doc.type}</div>
                      </td>

                      {/* Equipment & Supplier */}
                      <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300 font-medium">
                        <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-fab-blue shrink-0" />
                          <span>{doc.machine || 'Général'}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">{doc.supplier || 'Non spécifié'}</div>
                      </td>

                      {/* Version & Status */}
                      <td className="px-3.5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {doc.version || 'v1.0'}
                        </span>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            doc.status === 'Valide' || !doc.status 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : doc.status === 'En Révision'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {doc.status || 'Valide'}
                          </span>
                        </div>
                      </td>

                      {/* Size & Date */}
                      <td className="px-3.5 py-3.5 text-center text-zinc-500 font-mono text-[10px]">
                        <div>{doc.date}</div>
                        <div className="text-zinc-400">{doc.size || '1.2 MB'}</div>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Prévisualiser */}
                          <button
                            type="button"
                            onClick={() => openPreview(doc)}
                            className="p-1.5 text-xs text-fab-blue bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg border border-blue-200/60 dark:border-blue-800 transition-colors cursor-pointer"
                            title="Prévisualiser le document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Ouvrir dans une nouvelle fenêtre */}
                          <button
                            type="button"
                            onClick={() => handleOpenNewWindow(doc)}
                            className="p-1.5 text-xs text-purple-700 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-lg border border-purple-200/60 dark:border-purple-800 transition-colors cursor-pointer"
                            title="Ouvrir dans une nouvelle fenêtre"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Télécharger */}
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Télécharger le fichier"
                          >
                            <Download className="w-3.5 h-3.5" /> Télécharger
                          </button>

                          {/* Copier le lien */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(doc)}
                            className="p-1.5 text-xs text-zinc-600 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                            title="Copier le lien"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Détails / Historique */}
                          <button
                            type="button"
                            onClick={() => openDetail(doc)}
                            className="p-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                            title="Voir les détails et l'historique"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {/* Modifier */}
                          {(user?.role === 'Superviseur' || user?.role === 'Ingénieur') && (
                            <button
                              type="button"
                              onClick={() => { setEditingDoc({ ...doc }); setIsEditModalOpen(true); }}
                              className="p-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 rounded-lg border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                              title="Modifier les métadonnées"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Supprimer */}
                          {user?.role === 'Superviseur' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc)}
                              className="p-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 dark:bg-zinc-800/40 border-t border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredDocs.length)} sur {filteredDocs.length} documents
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold disabled:opacity-40 cursor-pointer"
              >
                Précédent
              </button>

              <span className="font-mono font-bold text-fab-blue px-2">
                Page {currentPage} sur {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold disabled:opacity-40 cursor-pointer"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: PREVISUALISATION DU DOCUMENT */}
      {previewDoc && (
        <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title={`PRÉVISUALISATION — ${previewDoc.title}`}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between font-mono">
              <span>{previewDoc.fileName}</span>
              <span className="px-2 py-0.5 bg-fab-blue rounded text-[10px] font-bold">{previewDoc.type}</span>
            </div>

            {/* Render Preview Box based on file type */}
            <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl p-4 border border-slate-200 dark:border-zinc-700 min-h-[300px] flex flex-col items-center justify-center">
              {previewDoc.contentData?.startsWith('data:image/') || previewDoc.fileName.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={previewDoc.contentData || previewDoc.url} alt={previewDoc.title} className="max-h-[450px] object-contain rounded-xl shadow-md" />
              ) : (previewDoc.type === 'PDF' || previewDoc.fileName.endsWith('.pdf')) ? (
                <iframe src={generateDocBlobUrl(previewDoc)} className="w-full h-[450px] rounded-xl border border-slate-300 dark:border-zinc-700 bg-white" title={previewDoc.title} />
              ) : (
                <div className="text-center space-y-3 py-8">
                  <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-xs inline-block">
                    {getFileIcon(previewDoc.fileName, previewDoc.type)}
                  </div>
                  <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{previewDoc.title}</h4>
                  <p className="text-zinc-500 max-w-sm text-xs">
                    Ce type de fichier ({previewDoc.type}) est disponible pour téléchargement direct ou ouverture externe.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => handleDownloadDoc(previewDoc)}
                      className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Télécharger le fichier
                    </button>
                    <button
                      onClick={() => handleOpenNewWindow(previewDoc)}
                      className="px-4 py-2 bg-fab-blue text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Ouvrir dans un nouvel onglet
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => handleOpenNewWindow(previewDoc)}
                className="px-4 py-2 bg-purple-700 text-white font-bold rounded-xl flex items-center gap-1.5 hover:bg-purple-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Ouvrir dans un nouvel onglet
              </button>

              <button onClick={() => setIsPreviewModalOpen(false)} className="px-5 py-2 bg-fab-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: FICHE DÉTAILLÉE & HISTORIQUE DES ACTIONS */}
      {detailDoc && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`DÉTAILS ET HISTORIQUE — ${detailDoc.fileName || detailDoc.title}`}>
          <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
            
            {/* Header info */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-fab-blue text-white font-mono font-bold text-[10px]">
                  {detailDoc.version || 'v1.0'}
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  Statut : {detailDoc.status || 'Valide'}
                </span>
              </div>
              <h3 className="text-base font-black text-white">{detailDoc.title}</h3>
              <p className="text-xs text-zinc-300 font-mono">{detailDoc.fileName}</p>
            </div>

            {/* Specifications Grid */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-zinc-800 dark:text-zinc-200">
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Catégorie</span><strong>{detailDoc.category}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Type Fichier</span><strong>{detailDoc.type}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Taille Fichier</span><strong className="font-mono">{detailDoc.size || '1.2 MB'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Équipement Lié</span><strong>{detailDoc.machine || 'Général'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Fournisseur</span><strong>{detailDoc.supplier || 'Non spécifié'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Auteur / Créateur</span><strong>{detailDoc.author || 'Responsable GMAO'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Date d'Ajout</span><strong>{detailDoc.date}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Statut Actuel</span><strong className="text-emerald-600">{detailDoc.status || 'Valide'}</strong></div>
            </div>

            {/* Description */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-1">
              <h4 className="font-bold text-xs text-fab-blue flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Description & Usage :
              </h4>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                {detailDoc.description || `${detailDoc.title} - Document officiel du registre GED.`}
              </p>
            </div>

            {/* Audit History Log Table */}
            <div className="p-4 bg-slate-100 dark:bg-zinc-800/60 rounded-2xl space-y-2">
              <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <History className="w-4 h-4 text-fab-blue" /> Historique des Actions & Traçabilité :
              </h4>

              {detailDoc.history && detailDoc.history.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {detailDoc.history.map((log, idx) => (
                    <div key={idx} className="p-2.5 px-3 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-fab-blue"></span> {log.action}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-zinc-500 text-[10px]">
                        <span>👤 {log.user}</span>
                        <span>🕒 {log.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 italic text-[11px]">Aucun historique antérieur enregistré pour ce document.</p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => {
                  handleDownloadDoc(detailDoc);
                }}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Télécharger Fichier
              </button>

              <button onClick={() => setIsDetailModalOpen(false)} className="px-5 py-2 bg-fab-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: TÉLÉVERSER UN DOCUMENT (UPLOAD) */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="➕ Téléverser un Document dans la GED">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
          
          {/* Error alert banner */}
          {uploadError && (
            <div className="p-3 bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">
              Sélectionner un fichier (PDF, Word, Tableur, Images, TXT — Max 50 MB) *
            </label>
            <input 
              required 
              type="file" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
              onChange={handleFileChange} 
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-xl outline-none focus:border-fab-blue file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer" 
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Titre du Document *</label>
            <input 
              required
              type="text" 
              value={newDoc.title} 
              onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} 
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold" 
              placeholder="Ex: Notice de Maintenance Technodrill 3" 
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Description & Usage</label>
            <textarea 
              rows={2}
              value={newDoc.description} 
              onChange={e => setNewDoc({ ...newDoc, description: e.target.value })} 
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900" 
              placeholder="Ex: Présentation générale du rôle du fichier et consignes d'utilisation..." 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Catégorie</label>
              <select 
                value={newDoc.category} 
                onChange={e => setNewDoc({ ...newDoc, category: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold cursor-pointer"
              >
                <option value="Fiche technique">Fiche technique</option>
                <option value="Manuel d'utilisation">Manuel d'utilisation</option>
                <option value="Formulaire GMAO">Formulaire GMAO</option>
                <option value="Fiche d'entretien">Fiche d'entretien</option>
                <option value="Registre & Inventaire">Registre & Inventaire</option>
                <option value="Facture / Garantie">Facture / Garantie</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Type de Fichier</label>
              <select 
                value={newDoc.type} 
                onChange={e => setNewDoc({ ...newDoc, type: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold cursor-pointer"
              >
                <option value="PDF">PDF (.pdf)</option>
                <option value="Word">Word (.doc, .docx)</option>
                <option value="Tableur">Tableur (.xls, .xlsx)</option>
                <option value="Image">Image (.jpg, .png, .webp)</option>
                <option value="Texte">Texte (.txt)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Équipement Lié</label>
              <input 
                type="text" 
                value={newDoc.machine} 
                onChange={e => setNewDoc({ ...newDoc, machine: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-semibold" 
                placeholder="Ex: FL-010 — Technodrill 3 ou Toutes machines" 
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Fournisseur Associé</label>
              <input 
                type="text" 
                value={newDoc.supplier} 
                onChange={e => setNewDoc({ ...newDoc, supplier: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-semibold" 
                placeholder="Ex: C.I.F France / Outillage Agadir" 
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Version du Document</label>
              <input 
                type="text" 
                value={newDoc.version} 
                onChange={e => setNewDoc({ ...newDoc, version: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-mono font-bold" 
                placeholder="Ex: v1.0, v2.1" 
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Statut de Validité</label>
              <select 
                value={newDoc.status} 
                onChange={e => setNewDoc({ ...newDoc, status: e.target.value as any })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold cursor-pointer"
              >
                <option value="Valide">Valide</option>
                <option value="En Révision">En Révision</option>
                <option value="Archivé">Archivé</option>
                <option value="Obsolète">Obsolète</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold">Annuler</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-fab-blue hover:bg-blue-700 text-white font-extrabold shadow-md flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Enregistrer le Document
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: MODIFIER MÉTADONNÉES DOCUMENT */}
      {editingDoc && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`ÉDITER LE DOCUMENT — ${editingDoc.fileName}`}>
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
            <div>
              <label className="block font-bold mb-1 text-zinc-500">Nom du fichier (Immuable)</label>
              <input disabled type="text" value={editingDoc.fileName} className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 rounded-xl font-mono text-zinc-500 text-xs" />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Titre du Document *</label>
              <input 
                required 
                type="text" 
                value={editingDoc.title} 
                onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold" 
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Description</label>
              <textarea 
                rows={2}
                value={editingDoc.description || ''} 
                onChange={e => setEditingDoc({ ...editingDoc, description: e.target.value })} 
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Catégorie</label>
                <select 
                  value={editingDoc.category} 
                  onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value })} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold cursor-pointer"
                >
                  <option value="Fiche technique">Fiche technique</option>
                  <option value="Manuel d'utilisation">Manuel d'utilisation</option>
                  <option value="Formulaire GMAO">Formulaire GMAO</option>
                  <option value="Fiche d'entretien">Fiche d'entretien</option>
                  <option value="Registre & Inventaire">Registre & Inventaire</option>
                  <option value="Facture / Garantie">Facture / Garantie</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Équipement Lié</label>
                <input 
                  type="text" 
                  value={editingDoc.machine} 
                  onChange={e => setEditingDoc({ ...editingDoc, machine: e.target.value })} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-semibold" 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Fournisseur</label>
                <input 
                  type="text" 
                  value={editingDoc.supplier || ''} 
                  onChange={e => setEditingDoc({ ...editingDoc, supplier: e.target.value })} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-semibold" 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Version</label>
                <input 
                  type="text" 
                  value={editingDoc.version || 'v1.0'} 
                  onChange={e => setEditingDoc({ ...editingDoc, version: e.target.value })} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-mono font-bold" 
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Statut</label>
                <select 
                  value={editingDoc.status || 'Valide'} 
                  onChange={e => setEditingDoc({ ...editingDoc, status: e.target.value as any })} 
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl outline-none focus:border-fab-blue bg-white dark:bg-zinc-900 font-bold cursor-pointer"
                >
                  <option value="Valide">Valide</option>
                  <option value="En Révision">En Révision</option>
                  <option value="Archivé">Archivé</option>
                  <option value="Obsolète">Obsolète</option>
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold">Annuler</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-fab-blue hover:bg-blue-700 text-white font-extrabold shadow-md">Enregistrer les Modifications</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Documents;
