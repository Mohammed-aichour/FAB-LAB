import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Upload, Image as ImageIcon, FileText, AlertCircle, CheckCircle2, DollarSign, Calendar, Wrench, Tag
} from 'lucide-react';
import type { StockItem } from '../../data/realStockData';

interface EquipmentStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: StockItem, isEdit: boolean) => void;
  initialData?: StockItem | null;
  existingItems: StockItem[];
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
}

export const EquipmentStockModal: React.FC<EquipmentStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  existingItems
}) => {
  const isEdit = !!initialData;

  const [formData, setFormData] = useState({
    reference: '',
    name: '',
    category: 'Impression 3D',
    marque: '',
    modele: '',
    serialNumber: '',
    location: 'Magasin GMAO - Étagère A',
    atelier: 'Atelier FabLab',
    supplier: 'Outillage Agadir',
    acquisitionDate: new Date().toISOString().split('T')[0],
    commissionDate: new Date().toISOString().split('T')[0],
    status: 'En Stock',
    quantity: 1,
    unit: 'u',
    unitCostMAD: 150,
    garantie: '12 mois',
    responsable: 'Responsable FabLab',
    description: '',
    observations: '',
    equipement: 'Tous Équipements FabLab'
  });

  const [images, setImages] = useState<AttachmentFile[]>([]);
  const [documents, setDocuments] = useState<AttachmentFile[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        reference: initialData.reference || '',
        name: initialData.name || '',
        category: initialData.category || 'Impression 3D',
        marque: (initialData as any).marque || '',
        modele: (initialData as any).modele || '',
        serialNumber: (initialData as any).serialNumber || '',
        location: initialData.location || 'Magasin GMAO',
        atelier: (initialData as any).atelier || 'Atelier FabLab',
        supplier: initialData.supplier || 'Outillage Agadir',
        acquisitionDate: (initialData as any).acquisitionDate || new Date().toISOString().split('T')[0],
        commissionDate: (initialData as any).commissionDate || new Date().toISOString().split('T')[0],
        status: initialData.status || 'En Stock',
        quantity: initialData.quantity || 1,
        unit: initialData.unit || 'u',
        unitCostMAD: initialData.unitCostMAD || initialData.priceMAD || 150,
        garantie: (initialData as any).garantie || '12 mois',
        responsable: (initialData as any).responsable || 'Responsable FabLab',
        description: initialData.description || '',
        observations: (initialData as any).observations || '',
        equipement: initialData.equipement || 'Tous Équipements FabLab'
      });
      if ((initialData as any).images) setImages((initialData as any).images);
      if ((initialData as any).documents) setDocuments((initialData as any).documents);
    } else {
      setFormData({
        reference: `FL-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        category: 'Impression 3D',
        marque: '',
        modele: '',
        serialNumber: `SN-${Date.now().toString().slice(-6)}`,
        location: 'Magasin GMAO - Étagère A',
        atelier: 'Atelier FabLab',
        supplier: 'Outillage Agadir',
        acquisitionDate: new Date().toISOString().split('T')[0],
        commissionDate: new Date().toISOString().split('T')[0],
        status: 'En Stock',
        quantity: 1,
        unit: 'u',
        unitCostMAD: 150,
        garantie: '12 mois',
        responsable: 'Responsable FabLab',
        description: '',
        observations: '',
        equipement: 'Tous Équipements FabLab'
      });
      setImages([]);
      setDocuments([]);
    }
    setErrorBanner(null);
  }, [initialData, isOpen]);

  // Auto calculate total value
  const totalValueMAD = formData.quantity * (formData.unitCostMAD || 0);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`Le format ${file.name} n'est pas autorisé. Formats acceptés : JPG, PNG, WEBP.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result;
        if (res && typeof res === 'string') {
          setImages(prev => [
            ...prev,
            {
              id: `img-${Date.now()}-${Math.random()}`,
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: res
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Document Upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext || '')) {
        alert(`Le fichier ${file.name} n'est pas supporté. Formats acceptés : PDF, Word, Tableur.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result;
        if (res && typeof res === 'string') {
          setDocuments(prev => [
            ...prev,
            {
              id: `doc-${Date.now()}-${Math.random()}`,
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: res
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const removeDoc = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Form Submission & Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    // 1. Mandatory Fields Validation
    if (!formData.reference.trim()) {
      setErrorBanner("La référence de l'équipement est obligatoire.");
      return;
    }
    if (!formData.name.trim()) {
      setErrorBanner("La désignation de l'équipement est obligatoire.");
      return;
    }
    if (formData.quantity < 0 || isNaN(formData.quantity)) {
      setErrorBanner("La quantité doit être un nombre positif ou nul.");
      return;
    }
    if (formData.unitCostMAD < 0 || isNaN(formData.unitCostMAD)) {
      setErrorBanner("Le prix unitaire doit être un nombre positif ou nul.");
      return;
    }

    // 2. Unique Reference Check
    const exists = existingItems.some(item => {
      if (isEdit && initialData && item.id === initialData.id) return false;
      return item.reference.toLowerCase().trim() === formData.reference.toLowerCase().trim();
    });

    if (exists) {
      setErrorBanner(`La référence "${formData.reference}" existe déjà dans le stock. Veuillez saisir une référence unique.`);
      return;
    }

    // Create / Update Stock Record
    const nowStr = new Date().toISOString().split('T')[0];
    const modifHistoryItem = {
      date: nowStr,
      user: 'Responsable GMAO',
      action: isEdit ? 'Modification des données' : 'Création initiale'
    };

    const finalItem: StockItem & any = {
      id: initialData?.id || `FL-${Date.now().toString().slice(-4)}`,
      reference: formData.reference.trim(),
      name: formData.name.trim(),
      category: formData.category,
      marque: formData.marque.trim(),
      modele: formData.modele.trim(),
      serialNumber: formData.serialNumber.trim(),
      location: formData.location.trim(),
      atelier: formData.atelier.trim(),
      supplier: formData.supplier.trim(),
      refSupplier: formData.reference.trim(),
      acquisitionDate: formData.acquisitionDate,
      commissionDate: formData.commissionDate,
      status: formData.quantity === 0 ? 'Rupture' : formData.status,
      quantity: formData.quantity,
      min: 2,
      max: formData.quantity * 3,
      unit: formData.unit,
      unitCostMAD: formData.unitCostMAD,
      priceMAD: formData.unitCostMAD,
      garantie: formData.garantie,
      responsable: formData.responsable,
      description: formData.description || `${formData.name} - Matériel FabLab Universiapolis`,
      observations: formData.observations,
      equipement: formData.equipement,
      images,
      documents,
      historiqueModifs: [
        ...(initialData ? ((initialData as any).historiqueModifs || []) : []),
        modifHistoryItem
      ]
    };

    onSuccess(finalItem, isEdit);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden w-full max-w-4xl max-h-[92vh] flex flex-col animate-fade-in-up my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-fab-blue rounded-xl text-white">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isEdit ? `Modifier l'Équipement — ${formData.reference}` : "➕ Ajouter un Équipement / Article au Stock"}
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                GMA LAB — Fiche technique d'équipement et inventaire
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-800 text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR BANNER */}
        {errorBanner && (
          <div className="p-3 px-6 bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs overflow-y-auto custom-scrollbar flex-1">
          
          {/* SECTION 1: IDENTIFICATION */}
          <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> 1. Identification & Référence
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Référence (Unique) *</label>
                <input
                  required
                  type="text"
                  value={formData.reference}
                  onChange={e => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono font-bold text-fab-blue outline-none focus:border-fab-blue"
                  placeholder="Ex: FL-075 ou PR-035"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Désignation de l'Équipement *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none focus:border-fab-blue"
                  placeholder="Ex: Oscilloscope Numérique 4 Canaux"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Catégorie *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none focus:border-fab-blue cursor-pointer"
                >
                  <option value="Impression 3D">Impression 3D (Filaments / Résines)</option>
                  <option value="Usinage CNC">Usinage CNC (Fraises & Quincaillerie)</option>
                  <option value="Électronique">Électronique, Soudure & Mesure</option>
                  <option value="Outillage">Équipements Atelier & Outillage</option>
                  <option value="Pièce de rechange">Pièce de rechange (PR)</option>
                  <option value="Consommables">Consommables divers</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Marque / Fabricant</label>
                <input
                  type="text"
                  value={formData.marque}
                  onChange={e => setFormData({ ...formData, marque: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                  placeholder="Ex: Rigol / Creality / PIPROD"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Modèle</label>
                <input
                  type="text"
                  value={formData.modele}
                  onChange={e => setFormData({ ...formData, modele: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                  placeholder="Ex: DS1054Z"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Numéro de Série</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-mono text-zinc-600 dark:text-zinc-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Équipement Rattaché</label>
                <input
                  type="text"
                  value={formData.equipement}
                  onChange={e => setFormData({ ...formData, equipement: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* SECTION 2: EMPLACEMENT & DATES */}
          <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> 2. Emplacement, Fournisseur & Dates
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Localisation Précise</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                  placeholder="Ex: Magasin GMAO - Étagère A-2"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Atelier / Zone</label>
                <input
                  type="text"
                  value={formData.atelier}
                  onChange={e => setFormData({ ...formData, atelier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                  placeholder="Ex: Espace Prototypage"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Fournisseur</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Garantie</label>
                <input
                  type="text"
                  value={formData.garantie}
                  onChange={e => setFormData({ ...formData, garantie: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                  placeholder="Ex: 24 mois constructeur"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Date d'Acquisition</label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={e => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Date de Mise en Service</label>
                <input
                  type="date"
                  value={formData.commissionDate}
                  onChange={e => setFormData({ ...formData, commissionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">État de l'Équipement</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none cursor-pointer"
                >
                  <option value="En Stock">En Stock</option>
                  <option value="Opérationnel">Opérationnel</option>
                  <option value="En Service">En Service</option>
                  <option value="En Maintenance">En Maintenance</option>
                  <option value="À Contrôler">À Contrôler</option>
                  <option value="Hors Service">Hors Service</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Responsable Référent</label>
                <input
                  type="text"
                  value={formData.responsable}
                  onChange={e => setFormData({ ...formData, responsable: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-semibold outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* SECTION 3: QUANTITÉ & PRIX (CALCUL AUTOMATIQUE) */}
          <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> 3. Quantité, Tarif & Valorisation Totale
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Quantité en Stock *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold text-fab-blue text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Unité de Mesure</label>
                <select
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold outline-none cursor-pointer"
                >
                  <option value="u">Unité / Pièce (u)</option>
                  <option value="boîte">Boîte / Pack</option>
                  <option value="flacon">Flacon / Bouteille</option>
                  <option value="mètre">Mètre (m)</option>
                  <option value="litre">Litre (L)</option>
                  <option value="kg">Kilogramme (kg)</option>
                  <option value="kit">Kit complet</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Prix Unitaire (MAD) *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.unitCostMAD}
                  onChange={e => setFormData({ ...formData, unitCostMAD: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 font-bold text-emerald-600 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Valeur Totale (Calcul Auto)</label>
                <input
                  type="text"
                  readOnly
                  value={`${totalValueMAD.toLocaleString('fr-FR')} MAD`}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 font-extrabold text-emerald-700 dark:text-emerald-300 text-sm outline-none"
                />
              </div>
            </div>
          </fieldset>

          {/* SECTION 4: MEDIA & DOCUMENTS */}
          <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-4">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> 4. Images Réelles & Documents Associés
            </legend>

            {/* Images Upload Area */}
            <div className="space-y-2">
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Téléverser des Images Réelles (JPG, PNG, WEBP)</span>
                <span className="text-[10px] text-zinc-400">{images.length} image(s) sélectionnée(s)</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="px-4 py-2 bg-fab-blue text-white font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-4 h-4" /> Choisir une Image...
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                  {images.map(img => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 aspect-square">
                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 hover:scale-110 transition-all"
                        title="Supprimer l'image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 text-[9px] text-white font-mono truncate px-1.5">
                        {img.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents Upload Area */}
            <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-zinc-700/80">
              <label className="block font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Documents & Notices Techniques (PDF, Word, Tableur)</span>
                <span className="text-[10px] text-zinc-400">{documents.length} document(s) rattaché(s)</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl shadow-xs hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Joindre des Documents...
                  <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleDocUpload} className="hidden" />
                </label>
              </div>

              {/* Document List */}
              {documents.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-2 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-between font-mono text-[11px]">
                      <span className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold truncate">
                        <FileText className="w-4 h-4 text-fab-blue shrink-0" /> {doc.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDoc(doc.id)}
                        className="text-rose-600 hover:text-rose-700 p-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          {/* SECTION 5: DESCRIPTIONS & OBSERVATIONS */}
          <fieldset className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
            <legend className="px-3 text-xs font-black uppercase text-fab-blue flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> 5. Spécifications Techniques & Observations
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Description & Usage Technique</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 outline-none focus:border-fab-blue"
                  placeholder="Ex: Rôle de l'équipement dans le FabLab, contraintes de fonctionnement..."
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-zinc-700 dark:text-zinc-300">Observations & Recommandations</label>
                <textarea
                  rows={3}
                  value={formData.observations}
                  onChange={e => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full p-3 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 outline-none focus:border-fab-blue"
                  placeholder="Ex: Consignes particulières pour l'entretien et la sécurité..."
                />
              </div>
            </div>
          </fieldset>

          {/* SUBMIT BUTTONS */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-fab-blue hover:bg-blue-700 text-white font-extrabold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEdit ? "Mettre à jour l'Équipement" : "Enregistrer le Nouvel Équipement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
