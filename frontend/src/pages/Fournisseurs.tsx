import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from '../components/shared/Modal';
import { realStockItems } from '../data/realStockData';
import { initialFournisseurs } from '../data/fournisseursData';
import type { Supplier } from '../data/fournisseursData';
import { Truck, ShoppingBag, Plus, Search, CheckCircle2, FileText, Trash2, AlertCircle, DollarSign, Clock, ShieldCheck, Printer } from 'lucide-react';

export interface OrderItem {
  partRef: string;
  designation: string;
  quantity: number;
  unitPriceMAD: number;
}

const Fournisseurs = () => {
  const location = useLocation();
  const [fournisseurs, setFournisseurs] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvaluation, setFilterEvaluation] = useState('');
  
  // Modal State for Supplier Edit / Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    code: '',
    name: '',
    domain: '',
    contact: '',
    email: '',
    phone: '',
    delaiJours: 7,
    paymentTerms: '30 jours',
    francoMAD: '1 000 MAD',
    evaluation: 'Bon',
    status: 'Actif'
  });

  // Order / Re-order Modal (Formulaire Demande de Réapprovisionnement)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    reapproRef: `CDE-2026-003`,
    date: new Date().toISOString().split('T')[0],
    applicantName: 'Magasinier FabLab',
    supplierCode: 'F01',
    supplierName: '3D Distrib. Maroc',
    orderItems: [] as OrderItem[],
    motive: 'Réappro. sur alerte seuil (Stock mini)',
    urgency: 'Normale',
    budgetImputed: 'Fonctionnement Atelier',
    supervisorVisa: 'Validé - Responsable GMAO',
    decision: 'Approuvé'
  });

  // Selected item addition in Order Form
  const [selectedPartRef, setSelectedPartRef] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState(1);

  const [orderResult, setOrderResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gmao_fournisseurs_v6');
    if (stored) {
      setFournisseurs(JSON.parse(stored));
    } else {
      localStorage.setItem('gmao_fournisseurs_v6', JSON.stringify(initialFournisseurs));
      setFournisseurs(initialFournisseurs);
    }
  }, []);

  // Detect redirection from Stock page
  useEffect(() => {
    if (location.state && (location.state as any).openOrderModal) {
      const stockId = (location.state as any).selectedStockId;
      openOrderModal(undefined, stockId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Active Selected Supplier
  const activeSupplier = fournisseurs.find(f => f.code === orderForm.supplierCode || f.name === orderForm.supplierName) || fournisseurs[0];

  // Calculated Order Total MAD
  const orderTotalMAD = (orderForm.orderItems || []).reduce((sum, item) => sum + (item.quantity * item.unitPriceMAD), 0);

  // Franco de Port Calculation
  const parseFrancoVal = (francoStr: string) => {
    if (!francoStr || francoStr.toLowerCase().includes('non')) return 0;
    const match = francoStr.match(/\d[\d\s]*/);
    return match ? parseInt(match[0].replace(/\s/g, ''), 10) : 0;
  };

  const francoThresholdMAD = activeSupplier ? parseFrancoVal(activeSupplier.francoMAD) : 0;
  const isFrancoReached = francoThresholdMAD > 0 && orderTotalMAD >= francoThresholdMAD;
  const francoMissingMAD = francoThresholdMAD > 0 && orderTotalMAD < francoThresholdMAD ? francoThresholdMAD - orderTotalMAD : 0;

  // Open Edit Supplier Modal
  const handleOpenEdit = (supp: Supplier) => {
    setEditingSupplier(supp);
    setSupplierForm(supp);
    setIsModalOpen(true);
  };

  // Open Add Supplier Modal
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    const count = fournisseurs.length + 1;
    setSupplierForm({
      code: `F${count.toString().padStart(2, '0')}`,
      name: '',
      domain: '',
      contact: 'Service commercial',
      email: '',
      phone: '+212 5 ',
      delaiJours: 7,
      paymentTerms: '30 jours',
      francoMAD: '1 000 MAD',
      evaluation: 'Bon',
      status: 'Actif'
    });
    setIsModalOpen(true);
  };

  // Save Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Supplier[];

    const fullSupplier: Supplier = {
      id: editingSupplier ? editingSupplier.id : Date.now(),
      code: supplierForm.code || `F${(fournisseurs.length + 1).toString().padStart(2, '0')}`,
      name: supplierForm.name || '',
      domain: supplierForm.domain || '',
      contact: supplierForm.contact || 'Service commercial',
      email: supplierForm.email || '',
      phone: supplierForm.phone || '',
      delaiJours: Number(supplierForm.delaiJours || 7),
      paymentTerms: supplierForm.paymentTerms || '30 jours',
      francoMAD: supplierForm.francoMAD || 'Non',
      evaluation: supplierForm.evaluation as any || 'Bon',
      status: supplierForm.status as any || 'Actif'
    };

    if (editingSupplier) {
      updated = fournisseurs.map(f => f.id === editingSupplier.id ? fullSupplier : f);
    } else {
      updated = [...fournisseurs, fullSupplier];
    }

    setFournisseurs(updated);
    localStorage.setItem('gmao_fournisseurs_v6', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  // Delete Supplier
  const handleDeleteSupplier = (id: number) => {
    const updated = fournisseurs.filter(f => f.id !== id);
    setFournisseurs(updated);
    localStorage.setItem('gmao_fournisseurs_v6', JSON.stringify(updated));
  };

  // Open Re-order Form Modal
  const openOrderModal = (supplier?: Supplier, stockId?: string) => {
    const supp = supplier || (fournisseurs.length > 0 ? fournisseurs[0] : null);
    const stockItem = stockId ? realStockItems.find(s => s.id === stockId) : realStockItems[0];
    const cdeCount = Math.floor(Math.random() * 800) + 100;

    const initialItems: OrderItem[] = stockItem ? [
      {
        partRef: stockItem.reference,
        designation: stockItem.name,
        quantity: 4,
        unitPriceMAD: (stockItem as any).unitCostMAD || (stockItem as any).priceMAD || 25
      }
    ] : [
      {
        partRef: 'PR-001',
        designation: 'Buse laiton 0.4 mm (FDM)',
        quantity: 4,
        unitPriceMAD: 25
      }
    ];

    setOrderForm({
      reapproRef: `CDE-2026-${cdeCount}`,
      date: new Date().toISOString().split('T')[0],
      applicantName: 'Magasinier FabLab',
      supplierCode: supp ? supp.code : 'F01',
      supplierName: supp ? supp.name : '3D Distrib. Maroc',
      orderItems: initialItems,
      motive: 'Réappro. sur alerte seuil (Stock mini atteint)',
      urgency: 'Normale',
      budgetImputed: 'Fonctionnement Atelier',
      supervisorVisa: 'Validé - Responsable GMAO',
      decision: 'Approuvé'
    });

    setSelectedPartRef('');
    setSelectedPartQty(1);
    setOrderResult(null);
    setIsOrderModalOpen(true);
  };

  // Add Part Item to Order
  const handleAddPartToOrder = () => {
    if (!selectedPartRef) return;
    const item = realStockItems.find(s => s.reference === selectedPartRef || s.id === selectedPartRef);
    if (!item) return;

    const newItem: OrderItem = {
      partRef: item.reference,
      designation: item.name,
      quantity: Number(selectedPartQty),
      unitPriceMAD: (item as any).unitCostMAD || (item as any).priceMAD || 50
    };

    setOrderForm(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, newItem]
    }));

    setSelectedPartRef('');
    setSelectedPartQty(1);
  };

  // Remove Part Item from Order
  const handleRemovePartFromOrder = (index: number) => {
    setOrderForm(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter((_, i) => i !== index)
    }));
  };

  const handleSupplierCodeChange = (code: string) => {
    const supp = fournisseurs.find(f => f.code === code || f.name === code);
    if (supp) {
      setOrderForm(prev => ({
        ...prev,
        supplierCode: supp.code,
        supplierName: supp.name
      }));
    }
  };

  // Submit Order Reappro
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      setOrderResult({
        reapproRef: orderForm.reapproRef,
        supplierCode: activeSupplier?.code,
        supplierName: activeSupplier?.name,
        supplierEmail: activeSupplier?.email,
        paymentTerms: activeSupplier?.paymentTerms,
        orderItems: orderForm.orderItems,
        totalEstimatedMAD: orderTotalMAD,
        isFranco: isFrancoReached,
        date: orderForm.date,
        status: 'Commande Générée & Transmise au Magasinier'
      });
      setIsSubmitting(false);
    }, 600);
  };

  // Filtering Suppliers
  const filteredFournisseurs = fournisseurs.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEval = filterEvaluation === '' || f.evaluation.includes(filterEvaluation);
    return matchSearch && matchEval;
  });

  const getEvaluationBadge = (ev: string) => {
    if (ev.includes('Très bon')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    if (ev.includes('Bon')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Fournisseurs
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Référentiel officiel des 11 fournisseurs et formulaire de réapprovisionnement du magasin (MAD)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openOrderModal()}
            className="btn-neu px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Bon de Commande (Réappro.)
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn-neu px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter un Fournisseur
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher code (F01-F11), fournisseur, domaine..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-fab-blue"
            />
          </div>

          <select
            value={filterEvaluation}
            onChange={e => setFilterEvaluation(e.target.value)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-fab-blue"
          >
            <option value="">Toutes les évaluations</option>
            <option value="Très bon">Très bon</option>
            <option value="Bon">Bon</option>
            <option value="Moyen">Moyen</option>
          </select>
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          Total : <strong className="text-zinc-900 dark:text-white">{filteredFournisseurs.length}</strong> / 11 Fournisseurs
        </div>
      </div>

      {/* SUPPLIER TABLE (CARNET DES FOURNISSEURS) */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-slate-100 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Domaine d'activité</th>
                <th className="px-4 py-3">Contact & Email</th>
                <th className="px-4 py-3 text-center">Délai Moyen</th>
                <th className="px-4 py-3">Conditions Paiement</th>
                <th className="px-4 py-3 text-right">Franco de Port</th>
                <th className="px-4 py-3 text-center">Évaluation</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFournisseurs.map(f => (
                <tr key={f.id} className="border-b border-slate-100 dark:border-zinc-800/50 hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-fab-blue bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded">
                      {f.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {f.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 max-w-[200px] truncate" title={f.domain}>
                    {f.domain}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200">{f.contact}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{f.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{f.delaiJours} jours</span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {f.paymentTerms}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">
                    {f.francoMAD}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getEvaluationBadge(f.evaluation)}`}>
                      {f.evaluation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openOrderModal(f)}
                        className="px-2.5 py-1 text-xs bg-fab-blue/10 hover:bg-fab-blue/20 text-fab-blue font-bold rounded-md"
                        title="Commander chez ce fournisseur"
                      >
                        Commander
                      </button>
                      <button
                        onClick={() => handleOpenEdit(f)}
                        className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-md"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(f.id)}
                        className="p-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md"
                        title="Supprimer le fournisseur"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFournisseurs.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-zinc-500">
                    Aucun fournisseur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULAIRE DEMANDE DE RÉAPPROVISIONNEMENT */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="FORMULAIRE — Demande de Réapprovisionnement & Bon de Commande"
      >
        {orderResult ? (
          <div className="space-y-4 text-xs py-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Demande de Réapprovisionnement Validée avec Succès !</h3>
                <p className="text-emerald-700 dark:text-emerald-400 text-xs">
                  N° Commande : <strong className="font-mono font-bold">{orderResult.reapproRef}</strong> • Transmise au magasinier GMAO.
                </p>
              </div>
            </div>

            {/* Bon de commande printable summary */}
            <div className="border border-slate-200 dark:border-zinc-700 p-4 rounded-xl bg-white dark:bg-zinc-900 space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div>
                  <h4 className="font-bold text-sm text-fab-blue">BON DE COMMANDE — FABLAB UNIVERSIAPOLIS</h4>
                  <p className="text-[10px] text-zinc-400">Date : {orderResult.date} | Ref: {orderResult.reapproRef}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-zinc-900 dark:text-white block">{orderResult.supplierName} ({orderResult.supplierCode})</span>
                  <span className="text-[10px] text-zinc-400">{orderResult.supplierEmail}</span>
                </div>
              </div>

              <table className="w-full text-xs text-left bg-slate-50 dark:bg-zinc-800/40 rounded border border-slate-100 dark:border-zinc-800">
                <thead className="bg-slate-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-semibold">
                  <tr>
                    <th className="px-3 py-1.5">Réf. Pièce</th>
                    <th className="px-3 py-1.5">Désignation</th>
                    <th className="px-3 py-1.5 text-center">Quantité</th>
                    <th className="px-3 py-1.5 text-right">Prix U. (MAD)</th>
                    <th className="px-3 py-1.5 text-right">Total (MAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {orderResult.orderItems.map((it: OrderItem, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-zinc-800/50">
                      <td className="px-3 py-1.5 font-mono font-bold text-fab-blue">{it.partRef}</td>
                      <td className="px-3 py-1.5 text-zinc-800 dark:text-zinc-200">{it.designation}</td>
                      <td className="px-3 py-1.5 text-center font-bold">{it.quantity}</td>
                      <td className="px-3 py-1.5 text-right">{it.unitPriceMAD} MAD</td>
                      <td className="px-3 py-1.5 text-right font-bold text-emerald-600">{it.quantity * it.unitPriceMAD} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-2 font-bold text-xs">
                <span>Conditions : {orderResult.paymentTerms}</span>
                <span className="text-sm text-emerald-600">Total Commande : {orderResult.totalEstimatedMAD} MAD</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button onClick={() => window.print()} className="px-4 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800">
                <Printer className="w-4 h-4" /> Imprimer Bon de Commande
              </button>
              <button onClick={() => setIsOrderModalOpen(false)} className="btn-neu px-6 py-2 rounded-xl text-xs font-bold">
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar text-xs">
            {/* 1. Identification & Fournisseur */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
              <h4 className="font-bold text-fab-blue uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 1. Identification & Fournisseur Pressenti
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1">N° Demande (Auto)</label>
                  <input type="text" readOnly value={orderForm.reapproRef} className="w-full px-2 py-1 font-mono font-bold bg-zinc-100 dark:bg-zinc-800 border rounded" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1">Date</label>
                  <input type="date" value={orderForm.date} onChange={e => setOrderForm({...orderForm, date: e.target.value})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1">Demandeur</label>
                  <input type="text" value={orderForm.applicantName} onChange={e => setOrderForm({...orderForm, applicantName: e.target.value})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1">Fournisseur *</label>
                  <select value={orderForm.supplierCode} onChange={e => handleSupplierCodeChange(e.target.value)} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold text-fab-blue">
                    {fournisseurs.map(f => (
                      <option key={f.code} value={f.code}>{f.code} - {f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fiche synthétique du fournisseur actif */}
              {activeSupplier && (
                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-fab-blue shrink-0" />
                    <span><strong>{activeSupplier.name}</strong> ({activeSupplier.domain})</span>
                  </div>
                  <div className="flex items-center gap-4 text-zinc-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Délai: <strong>{activeSupplier.delaiJours} j</strong></span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Franco: <strong>{activeSupplier.francoMAD}</strong></span>
                    <span>Paiement: <strong>{activeSupplier.paymentTerms}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Sélection Multi-Articles */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
              <h4 className="font-bold text-fab-blue uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> 2. Références et Quantités Demandées
              </h4>
              
              {/* Part selector */}
              <div className="flex gap-2 items-end bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                <div className="flex-1">
                  <label className="block text-[10px] font-medium mb-1">Ajouter une pièce de rechange du catalogue</label>
                  <select value={selectedPartRef} onChange={e => setSelectedPartRef(e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-transparent font-bold">
                    <option value="">Sélectionner une pièce...</option>
                    {realStockItems.map(s => (
                      <option key={s.id || s.reference} value={s.reference || s.id}>
                        {s.reference || s.id} - {s.name} ({((s as any).unitCostMAD || (s as any).priceMAD || 50)} MAD / unité)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-medium mb-1">Quantité</label>
                  <input type="number" min="1" value={selectedPartQty} onChange={e => setSelectedPartQty(Number(e.target.value))} className="w-full px-2 py-1 text-xs border rounded bg-transparent text-center font-bold" />
                </div>
                <button type="button" onClick={handleAddPartToOrder} className="px-3 py-1 bg-fab-blue text-white rounded text-xs font-bold hover:bg-blue-700">
                  + Ajouter
                </button>
              </div>

              {/* Order Items Table */}
              {(orderForm.orderItems || []).length > 0 ? (
                <div className="space-y-1.5">
                  {(orderForm.orderItems || []).map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-900 px-3 py-1.5 rounded border border-slate-200 dark:border-zinc-800 text-xs">
                      <span className="font-mono font-bold text-fab-blue w-20">{it.partRef}</span>
                      <span className="flex-1 px-2 text-zinc-700 dark:text-zinc-300 font-medium truncate">{it.designation}</span>
                      <span className="font-bold mr-4">{it.quantity} x {it.unitPriceMAD} MAD = <strong className="text-emerald-600">{it.quantity * it.unitPriceMAD} MAD</strong></span>
                      <button type="button" onClick={() => handleRemovePartFromOrder(idx)} className="text-rose-600 font-bold hover:underline text-[11px]">Retirer</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic text-center py-2">Aucun article ajouté au bon de commande.</p>
              )}

              {/* Franco de Port Indicator Alert */}
              {francoThresholdMAD > 0 && (
                <div className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${isFrancoReached ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'}`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Seuil Franco de port ({activeSupplier.francoMAD}) :</span>
                  </div>
                  {isFrancoReached ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 Franco atteint ! Frais de livraison offerts.</span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300">🟡 Il manque <strong>{francoMissingMAD} MAD</strong> pour le franco.</span>
                  )}
                </div>
              )}

              {/* Total Summary */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-zinc-700">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Montant Total Estimé de la Commande :</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> {orderTotalMAD} MAD
                </span>
              </div>
            </div>

            {/* 3. Motif, Urgence & Visas */}
            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
              <h4 className="font-bold text-fab-blue uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 3. Justification & Validation
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium mb-1">Motif de la Commande</label>
                  <select value={orderForm.motive} onChange={e => setOrderForm({...orderForm, motive: e.target.value})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900">
                    <option value="Réappro. sur alerte seuil">Réappro. sur alerte seuil (Stock mini)</option>
                    <option value="Réappro. périodique">Réappro. périodique</option>
                    <option value="Commande ponctuelle OT">Commande ponctuelle rattachée à un OT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1">Urgence</label>
                  <select value={orderForm.urgency} onChange={e => setOrderForm({...orderForm, urgency: e.target.value})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold">
                    <option value="Normale">Normale</option>
                    <option value="Haute (Rupture)">Haute (Rupture)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium mb-1">Visa Responsable</label>
                  <input type="text" value={orderForm.supervisorVisa} onChange={e => setOrderForm({...orderForm, supervisorVisa: e.target.value})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold" />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-zinc-800">
              <button type="button" onClick={() => setIsOrderModalOpen(false)} className="btn-neu btn-neu-danger px-4 py-2 rounded-xl text-xs font-bold">
                Annuler
              </button>
              <button type="submit" disabled={isSubmitting || (orderForm.orderItems || []).length === 0} className="btn-neu px-5 py-2 rounded-xl text-xs font-bold">
                {isSubmitting ? "Génération en cours..." : "Valider et Générer le Bon de Commande"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL ÉDITION / CRÉATION FOURNISSEUR */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `ÉDITION FOURNISSEUR — ${editingSupplier.code}` : "NOUVEAU FOURNISSEUR"}
      >
        <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1">Code (ex: F01-F11) *</label>
              <input type="text" required value={supplierForm.code} onChange={e => setSupplierForm({...supplierForm, code: e.target.value})} className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-zinc-900 font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">Nom du Fournisseur *</label>
              <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-zinc-900 font-bold" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium mb-1">Domaine d'activité *</label>
            <input type="text" required value={supplierForm.domain} onChange={e => setSupplierForm({...supplierForm, domain: e.target.value})} className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-zinc-900" placeholder="ex: Consommables impression 3D, Optiques laser..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1">Contact référent</label>
              <input type="text" value={supplierForm.contact} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-zinc-900" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">Email</label>
              <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full px-2.5 py-1.5 border rounded bg-white dark:bg-zinc-900 font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1">Délai moyen (jours)</label>
              <input type="number" value={supplierForm.delaiJours} onChange={e => setSupplierForm({...supplierForm, delaiJours: Number(e.target.value)})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold text-center" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">Franco de port (MAD)</label>
              <input type="text" value={supplierForm.francoMAD} onChange={e => setSupplierForm({...supplierForm, francoMAD: e.target.value})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold" placeholder="ex: 1 500 MAD ou Non" />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1">Évaluation</label>
              <select value={supplierForm.evaluation} onChange={e => setSupplierForm({...supplierForm, evaluation: e.target.value as any})} className="w-full px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-bold">
                <option value="Très bon">Très bon</option>
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-zinc-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-neu btn-neu-danger px-4 py-2 rounded-xl text-xs font-bold">
              Annuler
            </button>
            <button type="submit" className="btn-neu px-5 py-2 rounded-xl text-xs font-bold">
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Fournisseurs;
