import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Modal from '../components/shared/Modal';
import type { StockItem } from '../data/realStockData';
import { db } from '../services/db';
import { EquipmentStockModal } from '../components/stock/EquipmentStockModal';
import { 
  Info, AlertCircle, Wrench, ShoppingCart, CheckCircle2, Box, Printer, Cpu, Layers, FileText, Plus, Image as ImageIcon, Download, History
} from 'lucide-react';

const CATEGORY_GROUPS: { [key: string]: { label: string; icon: any; color: string; bg: string; border: string; badgeBg: string } } = {
  '3D': {
    label: 'Fabrication Additive (Filaments & Résines)',
    icon: Printer,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-950/20',
    border: 'border-blue-200/60 dark:border-blue-800/40',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  'USINAGE': {
    label: 'Usinage CNC, Quincaillerie & Outillage',
    icon: Layers,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50/50 dark:bg-purple-950/20',
    border: 'border-purple-200/60 dark:border-purple-800/40',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
  },
  'ELEC': {
    label: 'Électronique, Soudure & Mesure',
    icon: Cpu,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50/50 dark:bg-amber-950/20',
    border: 'border-amber-200/60 dark:border-amber-800/40',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  },
  'OUTIL': {
    label: 'Équipements Atelier & Outillage à Main',
    icon: Wrench,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
    border: 'border-emerald-200/60 dark:border-emerald-800/40',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
  },
  'DIVERS': {
    label: 'Pièces de Rechange (PR) & Consommables Divers',
    icon: Box,
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-50/50 dark:bg-zinc-900/30',
    border: 'border-zinc-200 dark:border-zinc-800',
    badgeBg: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
  }
};

const getGroupKey = (item: any): string => {
  const cat = (item.category || '').toUpperCase();
  const name = (item.name || '').toUpperCase();
  const ref = (item.reference || '').toUpperCase();
  const eq = (item.equipement || '').toUpperCase();

  if (
    cat.includes('3D') || cat.includes('FILAMENT') || cat.includes('RÉSINE') || cat.includes('RESINE') ||
    name.includes('FILAMENT') || name.includes('RÉSINE') || name.includes('RESINE') || name.includes('BUSE') ||
    name.includes('FEP') || name.includes('PEI') || name.includes('PTFE') || name.includes('ISOPROPYLIQUE') ||
    name.includes('IPA') || eq.includes('IMP') || eq.includes('FL-IMP') ||
    ref.includes('PR-001') || ref.includes('PR-002') || ref.includes('PR-003') || ref.includes('PR-004') ||
    ref.includes('PR-005') || ref.includes('PR-006') || ref.includes('PR-007') || ref.includes('PR-008') ||
    ref.includes('PR-009') || ref.includes('PR-029') || ref.includes('PR-030') || ref.includes('FL-051') || ref.includes('FL-047')
  ) return '3D';

  if (
    cat.includes('USINAGE') || cat.includes('QUINCAILLERIE') || cat.includes('VISSERIE') ||
    name.includes('FRAISE') || name.includes('TIREFOND') || name.includes('VIS') || name.includes('PINCE ER') ||
    eq.includes('CNC') || ref.includes('PR-010') || ref.includes('PR-011') || ref.includes('PR-012')
  ) return 'USINAGE';

  if (
    cat.includes('ÉLECTRONIQUE') || cat.includes('ELECTRONIQUE') || cat.includes('SOUDURE') || cat.includes('MESURE') || cat.includes('INSTRUMENTS') ||
    name.includes('OSCILLOSCOPE') || name.includes('PANNE') || name.includes('GAINE') || name.includes('THERMORETACTABLE') ||
    eq.includes('ELE') || ref.includes('PR-019') || ref.includes('PR-020') || ref.includes('PR-021') || ref.includes('PR-022')
  ) return 'ELEC';

  if (
    cat.includes('OUTILLAGE') || cat.includes('ÉQUIPEMENT ATELIER') || cat.includes('OUTIL') ||
    name.includes('LAME') || name.includes('FILTRE') || name.includes('COMPRESSEUR') || name.includes('PERCEUSE') || name.includes('MEULEUSE') ||
    eq.includes('BOI') || eq.includes('LAS') || eq.includes('VIN') || eq.includes('CMP') || eq.includes('ASP') || eq.includes('TEX')
  ) return 'OUTIL';

  return 'DIVERS';
};

const Stock = () => {
  const { user } = useOutletContext<{ user?: any }>() || {};
  const navigate = useNavigate();
  const [items, setItems] = useState<StockItem[]>([]);
  
  // Equipment Modal State
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [editingEquipItem, setEditingEquipItem] = useState<StockItem | null>(null);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<StockItem | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadItems = () => setItems(db.getStock());

  useEffect(() => {
    loadItems();
    window.addEventListener('gmao_data_updated', loadItems);
    window.addEventListener('storage', loadItems);
    return () => {
      window.removeEventListener('gmao_data_updated', loadItems);
      window.removeEventListener('storage', loadItems);
    };
  }, []);

  const handleEquipmentModalSuccess = (savedItem: StockItem, isEdit: boolean) => {
    let updated: StockItem[];
    if (isEdit) {
      updated = items.map(i => i.id === savedItem.id ? savedItem : i);
      triggerToast(`L'équipement "${savedItem.name}" (Réf. ${savedItem.reference}) a été mis à jour avec succès !`);
    } else {
      updated = [savedItem, ...items];
      triggerToast(`➕ L'équipement "${savedItem.name}" (Réf. ${savedItem.reference}) a été ajouté au stock avec succès !`);
    }
    setItems(updated);
    db.saveStock(updated);
  };

  const handleDeleteStock = (id: string | number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet équipement du stock ?")) {
      const updated = db.deleteStock(id);
      setItems(updated);
      triggerToast("Équipement supprimé du stock.");
    }
  };

  const openDetail = (item: StockItem) => {
    setSelectedDetailItem(item);
    setIsDetailModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditingEquipItem(item);
    setIsEquipModalOpen(true);
  };

  const openAddModal = () => {
    setEditingEquipItem(null);
    setIsEquipModalOpen(true);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((item as any).marque && (item as any).marque.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  // Groupement des articles par catégorie
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: StockItem[] } = {
      '3D': [],
      'USINAGE': [],
      'ELEC': [],
      'OUTIL': [],
      'DIVERS': []
    };

    filteredItems.forEach(item => {
      const gKey = getGroupKey(item);
      if (groups[gKey]) {
        groups[gKey].push(item);
      } else {
        groups['DIVERS'].push(item);
      }
    });

    return groups;
  }, [filteredItems]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { ALL: items.length, '3D': 0, 'USINAGE': 0, 'ELEC': 0, 'OUTIL': 0, 'DIVERS': 0 };
    items.forEach(item => {
      const gKey = getGroupKey(item);
      if (counts[gKey] !== undefined) {
        counts[gKey]++;
      }
    });
    return counts;
  }, [items]);

  const totalValuationMAD = items.reduce((sum, item) => sum + (item.quantity * (item.unitCostMAD || item.priceMAD || 100)), 0);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Stock & Gestion des Équipements
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              Gestion du Stock en Temps Réel
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Inventaire officiel des équipements, pièces de rechange (PR) & outillage du FabLab ({items.length} références)
          </p>
        </div>

        {/* Action Button: Ajouter un équipement */}
        {(!user || user?.role === 'Superviseur' || user?.role === 'Ingénieur' || user?.role === 'Technicien') && (
          <button 
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-fab-blue text-white font-bold text-xs shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> ➕ Ajouter un Équipement
          </button>
        )}
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-md flex items-center justify-between animate-fade-in-up">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Total Références / Équipements</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{items.length} Articles</div>
          <div className="text-[10px] text-zinc-400 mt-1">Stock Magasin & Outillage</div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Valorisation Totale du Stock</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalValuationMAD.toLocaleString('fr-FR')} MAD</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">Valeur globale d'inventaire</div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Articles en Rupture</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {items.filter(i => i.quantity === 0).length} Articles
          </div>
          <div className="text-[10px] text-rose-600 font-bold mt-1">Réapprovisionnement requis</div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Médias & Documents Joints</div>
          <div className="text-2xl font-bold text-fab-blue mt-1">
            {items.filter(i => (i as any).images?.length || (i as any).documents?.length).length} Rattachés
          </div>
          <div className="text-[10px] text-fab-blue font-bold mt-1">Images & notices techniques</div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-fab-blue text-white shadow-xs'
                : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100'
            }`}
          >
            Tous ({categoryCounts.ALL})
          </button>
          {Object.keys(CATEGORY_GROUPS).map(gKey => (
            <button
              key={gKey}
              onClick={() => setActiveTab(gKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === gKey
                  ? 'bg-fab-blue text-white shadow-xs'
                  : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100'
              }`}
            >
              {gKey} ({categoryCounts[gKey] || 0})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Rechercher réf, désignation, marque, atelier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 outline-none focus:border-fab-blue"
          />
        </div>
      </div>

      {/* Tables Par Catégorie */}
      <div className="space-y-6">
        {Object.keys(CATEGORY_GROUPS).map(gKey => {
          if (activeTab !== 'ALL' && activeTab !== gKey) return null;
          const groupMeta = CATEGORY_GROUPS[gKey];
          const groupList = groupedItems[gKey] || [];
          if (activeTab === 'ALL' && groupList.length === 0) return null;

          const IconComp = groupMeta.icon;

          return (
            <div key={gKey} className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border ${groupMeta.border} rounded-2xl overflow-hidden shadow-xs transition-all`}>
              {/* En-tête de section */}
              <div className={`px-6 py-3.5 border-b ${groupMeta.border} ${groupMeta.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-xs ${groupMeta.color}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                      {groupMeta.label}
                    </h2>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      {groupList.length} équipement(s) & référence(s)
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${groupMeta.badgeBg}`}>
                  {groupList.length} articles
                </span>
              </div>

              {/* Tableau des articles */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#2f3874] text-white text-[11px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Réf. (Unique)</th>
                      <th className="px-5 py-3 min-w-[220px]">Désignation & Marque</th>
                      <th className="px-5 py-3 min-w-[180px]">Catégorie & Localisation</th>
                      <th className="px-4 py-3 text-center">Quantité</th>
                      <th className="px-4 py-3 text-right">Prix Unitaire</th>
                      <th className="px-4 py-3 text-right">Valeur Totale</th>
                      <th className="px-4 py-3 text-center">Statut / État</th>
                      <th className="px-5 py-3 text-right">Actions & Documents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                    {groupList.map(item => {
                      const itemValuation = item.quantity * (item.unitCostMAD || item.priceMAD || 150);
                      const hasImgs = (item as any).images && (item as any).images.length > 0;
                      const hasDocs = (item as any).documents && (item as any).documents.length > 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-fab-blue font-bold">
                            <div>{item.reference}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">{(item as any).serialNumber || 'SN-FABLAB'}</div>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                            <div className="leading-snug flex flex-wrap items-center gap-1.5">
                              <span>{item.name}</span>
                              {hasImgs && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                  📷 Media
                                </span>
                              )}
                              {hasDocs && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                  📄 Doc
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-normal">
                              {(item as any).marque || 'FabLab'} {(item as any).modele ? `• ${(item as any).modele}` : ''}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-zinc-800 dark:text-zinc-200">{item.category}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{item.location || 'Magasin GMAO'}</div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-zinc-900 dark:text-zinc-100">
                            <span className="font-mono text-sm">{item.quantity}</span> {item.unit || 'u'}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-zinc-700 dark:text-zinc-300">
                            {(item.unitCostMAD || item.priceMAD || 150).toLocaleString('fr-FR')} MAD
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-emerald-600">
                            {itemValuation.toLocaleString('fr-FR')} MAD
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {item.quantity > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {item.status || 'En Stock'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                                <AlertCircle className="w-3 h-3 text-rose-600" /> Rupture
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Fiche Détaillée & Media */}
                              <button
                                onClick={() => openDetail(item)}
                                className="p-1.5 text-xs text-fab-blue bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg border border-blue-200/80 dark:border-blue-800 transition-colors cursor-pointer"
                                title="Voir la fiche complète, les images et documents"
                              >
                                <Info className="w-4 h-4" />
                              </button>

                              {/* Modifier */}
                              <button 
                                onClick={() => openEditModal(item)} 
                                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg font-semibold border border-slate-200 dark:border-zinc-700 cursor-pointer"
                              >
                                Éditer
                              </button>

                              {/* Supprimer */}
                              <button 
                                onClick={() => handleDeleteStock(item.id)} 
                                className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-lg font-semibold border border-rose-200 dark:border-rose-800 cursor-pointer"
                              >
                                Supprimer
                              </button>

                              {/* Recommander */}
                              <button 
                                onClick={() => navigate('/fournisseurs', { state: { openOrderModal: true, selectedStockId: item.id } })} 
                                className="px-2.5 py-1 rounded-lg text-xs bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Commander chez le fournisseur"
                              >
                                <ShoppingCart className="w-3 h-3" /> Recommander
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: AJOUTER / MODIFIER UN ÉQUIPEMENT */}
      <EquipmentStockModal
        isOpen={isEquipModalOpen}
        onClose={() => setIsEquipModalOpen(false)}
        onSuccess={handleEquipmentModalSuccess}
        initialData={editingEquipItem}
        existingItems={items}
      />

      {/* MODAL FICHE DÉTAILLÉE COMPLÈTE DE L'ÉQUIPEMENT */}
      {selectedDetailItem && (
        <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`FICHE DÉTAILLÉE ÉQUIPEMENT — ${selectedDetailItem.reference}`}>
          <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
            
            {/* Header info box */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 bg-fab-blue text-white rounded-lg font-bold">
                  Réf. {selectedDetailItem.reference}
                </span>
                <span className="text-xs text-emerald-400 font-bold">
                  Statut : {selectedDetailItem.status || 'En Stock'} ({selectedDetailItem.quantity} {selectedDetailItem.unit || 'u'})
                </span>
              </div>
              <h3 className="text-base font-black text-white">{selectedDetailItem.name}</h3>
              <p className="text-xs text-zinc-300 font-medium">
                Catégorie : <strong>{selectedDetailItem.category}</strong> • Localisation : <strong>{selectedDetailItem.location || 'Magasin GMAO'}</strong>
              </p>
            </div>

            {/* Complete Metadata Grid */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-zinc-800 dark:text-zinc-200">
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Marque / Fabricant</span><strong>{(selectedDetailItem as any).marque || selectedDetailItem.supplier || '—'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Modèle</span><strong>{(selectedDetailItem as any).modele || '—'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Numéro de Série</span><strong className="font-mono">{(selectedDetailItem as any).serialNumber || 'SN-FABLAB'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Fournisseur</span><strong>{selectedDetailItem.supplier || 'Outillage Agadir'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Date d'Acquisition</span><strong>{(selectedDetailItem as any).acquisitionDate || '2022-01-01'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Date de Mise en Service</span><strong>{(selectedDetailItem as any).commissionDate || '2022-01-15'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Garantie</span><strong>{(selectedDetailItem as any).garantie || '12 mois'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Responsable Référent</span><strong>{(selectedDetailItem as any).responsable || 'Responsable FabLab'}</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Prix Unitaire</span><strong className="text-emerald-600 font-bold">{(selectedDetailItem.unitCostMAD || selectedDetailItem.priceMAD || 150).toLocaleString('fr-FR')} MAD</strong></div>
              <div><span className="text-zinc-400 block text-[9px] uppercase font-bold">Valeur Totale Stock</span><strong className="text-emerald-700 font-black">{(selectedDetailItem.quantity * (selectedDetailItem.unitCostMAD || selectedDetailItem.priceMAD || 150)).toLocaleString('fr-FR')} MAD</strong></div>
            </div>

            {/* Description & Usage */}
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-1">
              <h4 className="font-bold text-xs text-fab-blue flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Description & Usage Technique :
              </h4>
              <p className="text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                {selectedDetailItem.description || `${selectedDetailItem.name} - Matériel et équipement d'atelier FabLab.`}
              </p>
              {(selectedDetailItem as any).observations && (
                <div className="pt-2 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] border-t border-blue-200/60 dark:border-blue-800/40">
                  <strong>Observations :</strong> {(selectedDetailItem as any).observations}
                </div>
              )}
            </div>

            {/* IMAGES GALLERY */}
            {(selectedDetailItem as any).images && (selectedDetailItem as any).images.length > 0 && (
              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800/40 space-y-2">
                <h4 className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Galerie d'Images Réelles ({(selectedDetailItem as any).images.length}) :
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {(selectedDetailItem as any).images.map((img: any) => (
                    <div key={img.id} className="rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800 aspect-square bg-white">
                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ATTACHED DOCUMENTS */}
            {(selectedDetailItem as any).documents && (selectedDetailItem as any).documents.length > 0 && (
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40 space-y-2">
                <h4 className="font-bold text-xs text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Documents & Notices Rattachés ({(selectedDetailItem as any).documents.length}) :
                </h4>
                <div className="space-y-1.5 pt-1">
                  {(selectedDetailItem as any).documents.map((doc: any) => (
                    <div key={doc.id} className="p-2.5 px-3 bg-white dark:bg-zinc-800 rounded-xl border border-amber-200/80 dark:border-zinc-700 flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-fab-blue" /> {doc.name}
                      </span>
                      <a
                        href={doc.dataUrl}
                        download={doc.name}
                        className="px-3 py-1 bg-fab-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Télécharger
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODIFICATION HISTORY */}
            {(selectedDetailItem as any).historiqueModifs && (selectedDetailItem as any).historiqueModifs.length > 0 && (
              <div className="p-4 bg-slate-100 dark:bg-zinc-800/60 rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <History className="w-4 h-4" /> Historique des Modifications :
                </h4>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  {(selectedDetailItem as any).historiqueModifs.map((log: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between border-b border-slate-200/60 dark:border-zinc-700/60 pb-1">
                      <span>• {log.date} — {log.action}</span>
                      <span className="text-fab-blue font-bold">{log.user}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedDetailItem);
                }}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Éditer cet équipement
              </button>

              <button onClick={() => setIsDetailModalOpen(false)} className="px-5 py-2 bg-fab-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Stock;
