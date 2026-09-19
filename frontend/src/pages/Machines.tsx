import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import Modal from '../components/shared/Modal';
import { db } from '../services/db';
import { getMachinePhotoCandidates, hasValidMachinePhoto } from '../lib/machinePhotos';
import { 
  QrCode, Printer, CheckCircle, XCircle, Search, Server, Star, 
  Layers, Camera, ImageOff, LayoutGrid, Table as TableIcon 
} from 'lucide-react';

// Reusable Machine Image Component with automatic candidate fallback and clean placeholder
const MachineImage = ({ 
  machine, 
  className = "", 
  alt = "",
  objectFit = "object-cover"
}: { 
  machine: any; 
  className?: string; 
  alt?: string;
  objectFit?: "object-cover" | "object-contain";
}) => {
  const candidates = useMemo(() => getMachinePhotoCandidates(machine), [machine]);
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCandidateIdx(0);
    setHasError(false);
  }, [machine]);

  if (hasError || candidateIdx >= candidates.length) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-800/80 text-slate-400 p-4 text-center select-none ${className}`}>
        <ImageOff className="w-8 h-8 text-amber-500/80 mb-1" />
        <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">Photo non disponible</span>
      </div>
    );
  }

  return (
    <img
      src={candidates[candidateIdx]}
      alt={alt || machine?.name || "Machine"}
      className={`${objectFit} ${className}`}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) {
          setCandidateIdx(prev => prev + 1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
};

const Machines = () => {
  const user = useOutletContext<any>();
  const [machines, setMachines] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('TOUS');
  const [filterMode, setFilterMode] = useState<'MAJEURES' | 'TOUTES'>('TOUTES');
  const [displayMode, setDisplayMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Photo Viewer Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoMachine, setPhotoMachine] = useState<any>(null);
  const [hasPhotoError, setHasPhotoError] = useState(false);

  const loadMachines = () => setMachines(db.getMachines());

  useEffect(() => {
    loadMachines();
    window.addEventListener('gmao_data_updated', loadMachines);
    window.addEventListener('storage', loadMachines);
    return () => {
      window.removeEventListener('gmao_data_updated', loadMachines);
      window.removeEventListener('storage', loadMachines);
    };
  }, []);

  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [newMachine, setNewMachine] = useState({ reference: '', name: '', category: 'Atelier Impression 3D', status: 'Opérationnel' });
  const [searchTerm, setSearchTerm] = useState('');

  // Identifiants / Codes des Grandes Machines Principales
  const grandMachineCodes = useMemo(() => new Set([
    'FL-010', 'EQ1',
    'FL-009', 'EQ2',
    'FL-068', 'EQ3',
    'FL-007', 'FL-008', 'EQ4', 'EQ4a', 'EQ4b',
    'FL-069', 'EQ5'
  ]), []);

  const isGrandMachine = (m: any) => {
    const code = (m.codeEq || '').toUpperCase();
    const ref = (m.reference || m.id || '').toUpperCase();
    const name = (m.name || '').toLowerCase();

    if (grandMachineCodes.has(ref) || grandMachineCodes.has(code)) return true;
    if (name.includes('technodrill') || name.includes('tprod') || name.includes('raise3d') || (name.includes('laser') && name.includes('co2')) || name.includes('3d industrielle')) return true;
    return false;
  };

  const validPhotoMachines = useMemo(() => {
    return machines.filter(hasValidMachinePhoto);
  }, [machines]);

  const categoriesList = useMemo(() => {
    const setCat = new Set<string>();
    validPhotoMachines.forEach(m => {
      if (m.category) setCat.add(m.category);
    });
    return Array.from(setCat).sort();
  }, [validPhotoMachines]);

  const toggleMachineStatus = (id: string | number) => {
    const updated = machines.map(m => {
      if (m.id === id) {
        const nextStatus = (m.status === 'Opérationnel' || m.status === 'Marche') ? 'Hors service' : 'Opérationnel';
        return { ...m, status: nextStatus };
      }
      return m;
    });
    setMachines(updated);
    db.saveMachines(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    
    if (editingId) {
      updated = machines.map(m => m.id === editingId ? { 
        ...m, 
        reference: newMachine.reference, 
        name: newMachine.name, 
        category: newMachine.category,
        status: newMachine.status 
      } : m);
    } else {
      const machine = {
        id: newMachine.reference || `FL-${Date.now().toString().slice(-3)}`,
        reference: newMachine.reference || `FL-${Date.now().toString().slice(-3)}`,
        codeEq: 'Niveau 1',
        name: newMachine.name,
        category: newMachine.category,
        atelier: newMachine.category.replace('Atelier ', ''),
        location: `Zone ${newMachine.category.replace('Atelier ', '')}`,
        manufacturer: newMachine.name.split(' ')[0],
        model: newMachine.name,
        serialNumber: `SN-${Date.now()}`,
        yearInService: 2024,
        criticite: 'B',
        quantity: 1,
        status: newMachine.status,
        description: `${newMachine.name} - Matériel FabLab Universiapolis`,
        logiciel: 'GMAO Universiapolis',
        level: 1
      };
      updated = [machine, ...machines];
    }
    setMachines(updated);
    db.saveMachines(updated);
    
    setIsModalOpen(false);
    setEditingId(null);
    setNewMachine({ reference: '', name: '', category: 'Atelier Impression 3D', status: 'Opérationnel' });
  };

  const openEditModal = (machine: any) => {
    setEditingId(machine.id);
    setNewMachine({ 
      reference: machine.reference, 
      name: machine.name, 
      category: machine.category,
      status: (machine.status === 'Marche' || machine.status === 'Opérationnel') ? 'Opérationnel' : 'Hors service'
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewMachine({ reference: '', name: '', category: 'Atelier Impression 3D', status: 'Opérationnel' });
    setIsModalOpen(true);
  };

  const openQrModal = (machine: any) => {
    setSelectedMachine(machine);
    setIsQrModalOpen(true);
  };

  const openPhotoModal = (machine: any) => {
    setPhotoMachine(machine);
    setHasPhotoError(false);
    setIsPhotoModalOpen(true);
  };

  const filteredMachines = useMemo(() => {
    return validPhotoMachines.filter(m => {
      if (filterMode === 'MAJEURES' && !isGrandMachine(m)) {
        return false;
      }

      const query = searchTerm.toLowerCase().trim();
      const matchSearch = query === '' ||
        (m.name || '').toLowerCase().includes(query) || 
        (m.reference || '').toLowerCase().includes(query) ||
        (m.codeEq || '').toLowerCase().includes(query) ||
        (m.category || '').toLowerCase().includes(query) ||
        (m.manufacturer || m.marque || '').toLowerCase().includes(query);

      const matchCat = activeCategory === 'TOUS' || m.category === activeCategory;

      return matchSearch && matchCat;
    });
  }, [validPhotoMachines, searchTerm, activeCategory, filterMode, grandMachineCodes]);

  const countMajeures = useMemo(() => validPhotoMachines.filter(isGrandMachine).length, [validPhotoMachines]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-6 h-6 text-[#2f3874] dark:text-blue-400" />
              Parc Machines & Équipements du FabLab
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              Base de Données Centralisée ({validPhotoMachines.length} Machines)
            </span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Référentiel unique du système de gestion des équipements — Synchronisé en temps réel avec toutes les pages de la GMAO
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher: Grid / Table */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
            <button
              onClick={() => setDisplayMode('GRID')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                displayMode === 'GRID' 
                  ? 'bg-[#2f3874] text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
              title="Vue Cartes (Grille)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayMode('TABLE')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                displayMode === 'TABLE' 
                  ? 'bg-[#2f3874] text-white shadow-xs' 
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
              title="Vue Tableau"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200/80 dark:border-zinc-700/80">
            <button
              onClick={() => setFilterMode('MAJEURES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'MAJEURES'
                  ? 'bg-[#2f3874] text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-[#e0a61e]" />
              <span>Grandes Machines ({countMajeures})</span>
            </button>
            <button
              onClick={() => setFilterMode('TOUTES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'TOUTES'
                  ? 'bg-[#2f3874] text-white shadow-md'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tout le Parc ({validPhotoMachines.length})</span>
            </button>
          </div>

          {(user?.role === 'Superviseur' || user?.role === 'Ingénieur') && (
            <button 
              onClick={openAddModal}
              className="btn-primary cursor-pointer"
            >
              + Ajouter une Machine
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
        <button
          onClick={() => setActiveCategory('TOUS')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeCategory === 'TOUS'
              ? 'bg-[#2f3874] text-white shadow-md'
              : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
          }`}
        >
          Tous les Ateliers ({filteredMachines.length})
        </button>
        {categoriesList.map(cat => {
          const count = machines.filter(m => m.category === cat && (filterMode === 'TOUTES' || isGrandMachine(m))).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#2f3874] text-white shadow-md'
                  : 'bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-100'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Bar & Counter Header */}
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, code FL-xxx, marque..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#2f3874]/20 focus:border-[#2f3874] transition-all"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold">
          Affichage de <span className="text-[#2f3874] dark:text-blue-400 font-extrabold">{filteredMachines.length}</span> {filterMode === 'MAJEURES' ? 'grandes machines principales' : 'équipements'}
        </span>
      </div>

      {/* DISPLAY MODE 1: GRID / CARDS */}
      {displayMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMachines.map(machine => (
            <div 
              key={machine.id} 
              className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
            >
              {/* Card Photo Header */}
              <div 
                onClick={() => openPhotoModal(machine)}
                className="relative h-48 w-full bg-slate-950 overflow-hidden cursor-pointer group/img"
              >
                <MachineImage 
                  machine={machine} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  alt={machine.name}
                />
                
                {/* Badges on Top of Photo */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                    {isGrandMachine(machine) && <Star className="w-3 h-3 text-[#e0a61e]" />}
                    {machine.reference || machine.id}
                  </span>
                  
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-md ${
                    (machine.status === 'Opérationnel' || machine.status === 'Marche')
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-red-950/80 text-red-300 border-red-500/50'
                  }`}>
                    {machine.status}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-bold flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Cliquer pour agrandir
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 
                      onClick={() => openPhotoModal(machine)}
                      className="font-extrabold text-slate-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-snug line-clamp-2"
                    >
                      {machine.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black shrink-0 border ${
                      machine.criticite === 'A' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300' 
                        : machine.criticite === 'B' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300'
                    }`}>
                      Classe {machine.criticite || 'B'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {machine.description || machine.designation}
                  </p>
                </div>

                {/* Specs metadata */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-300">
                    <span className="text-slate-400">Marque / Modèle:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">
                      {machine.marque && machine.modele ? `${machine.marque} ${machine.modele}` : (machine.marque || machine.modele || machine.manufacturer || '—')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-300">
                    <span className="text-slate-400">Atelier & Zone:</span>
                    <span className="font-medium text-right truncate max-w-[170px]">{machine.category || machine.atelier}</span>
                  </div>
                  {machine.codeEq && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-300 font-mono text-[10px]">
                      <span className="text-slate-400">Code EQ:</span>
                      <span className="font-bold bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{machine.codeEq}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openPhotoModal(machine)}
                      className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-[#2f3874] dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                      title="Voir la photo complète"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => openQrModal(machine)}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-purple-100 text-purple-700 dark:hover:bg-purple-950/50 dark:text-purple-300 border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                      title="Fiche & QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleMachineStatus(machine.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        (machine.status === 'Opérationnel' || machine.status === 'Marche')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
                      }`}
                      title="Basculer le statut"
                    >
                      {(machine.status === 'Opérationnel' || machine.status === 'Marche') ? 'Opérationnel' : 'Hors service'}
                    </button>
                    {(user?.role === 'Superviseur' || user?.role === 'Ingénieur') && (
                      <button 
                        onClick={() => openEditModal(machine)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-[11px] font-bold cursor-pointer"
                      >
                        Éditer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredMachines.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white/80 dark:bg-zinc-900/80 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-400 font-medium">
              Aucun équipement ne correspond à votre recherche.
            </div>
          )}
        </div>
      )}

      {/* DISPLAY MODE 2: TABLE */}
      {displayMode === 'TABLE' && (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto relative custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#2f3874] text-white sticky top-0 z-10 shadow-md text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-3 py-3.5 text-center border-r border-white/10 w-16">Photo</th>
                  <th className="px-4 py-3.5 border-r border-white/10">Code / Réf.</th>
                  <th className="px-3.5 py-3.5 text-center border-r border-white/10">Code EQ</th>
                  <th className="px-4 py-3.5 border-r border-white/10 min-w-[220px]">Désignation & Détails</th>
                  <th className="px-4 py-3.5 border-r border-white/10 min-w-[180px]">Domaine / Atelier</th>
                  <th className="px-4 py-3.5 border-r border-white/10 min-w-[160px]">Fabricant / Modèle</th>
                  <th className="px-3 py-3.5 text-center border-r border-white/10">Qté</th>
                  <th className="px-3.5 py-3.5 text-center border-r border-white/10">Criticité</th>
                  <th className="px-4 py-3.5 text-center border-r border-white/10">État</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredMachines.map(machine => (
                  <tr key={machine.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    {/* Machine Photo Avatar Cell */}
                    <td className="px-3 py-2 text-center border-r border-slate-100 dark:border-zinc-800">
                      <div 
                        onClick={() => openPhotoModal(machine)}
                        className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 mx-auto cursor-pointer border border-slate-200 dark:border-zinc-700 shadow-xs hover:scale-110 transition-transform"
                        title="Cliquer pour afficher la photo"
                      >
                        <MachineImage 
                          machine={machine} 
                          className="w-full h-full object-cover"
                          alt={machine.name}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-[#2f3874] dark:text-blue-400 border-r border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        {isGrandMachine(machine) && <span title="Grande Machine Principale"><Star className="w-3.5 h-3.5 text-[#e0a61e] shrink-0" /></span>}
                        <span>{machine.reference || machine.id}</span>
                      </div>
                    </td>

                    <td className="px-3.5 py-3.5 text-center border-r border-slate-100 dark:border-zinc-800">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 font-mono font-bold text-[11px] text-slate-700 dark:text-zinc-300">
                        {machine.codeEq || 'Niveau 1'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-100 dark:border-zinc-800">
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                        <button
                          onClick={() => openPhotoModal(machine)}
                          title="Voir la photo réelle"
                          className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2f3874] dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <span onClick={() => openPhotoModal(machine)} className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                          {machine.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed truncate max-w-xs">{machine.description}</div>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-100 dark:border-zinc-800 font-medium">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">{machine.category || machine.atelier}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{machine.location}</div>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-100 dark:border-zinc-800 font-medium">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {machine.marque && machine.modele ? `${machine.marque} ${machine.modele}` : (machine.marque || machine.modele || machine.manufacturer || machine.model || '—')}
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-center font-extrabold text-slate-900 dark:text-white border-r border-slate-100 dark:border-zinc-800">
                      {machine.quantity || 1}
                    </td>

                    <td className="px-3.5 py-3.5 text-center border-r border-slate-100 dark:border-zinc-800">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${
                        machine.criticite === 'A' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border-red-300' 
                          : machine.criticite === 'B' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300'
                      }`}>
                        Classe {machine.criticite || 'B'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center border-r border-slate-100 dark:border-zinc-800">
                      <button 
                        onClick={() => toggleMachineStatus(machine.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          (machine.status === 'Opérationnel' || machine.status === 'Marche')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-200 border border-red-300'
                        }`}
                      >
                        {(machine.status === 'Opérationnel' || machine.status === 'Marche') ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Opérationnel</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            <span>Hors service</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-right flex justify-end gap-1.5">
                      <button 
                        onClick={() => openPhotoModal(machine)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-[#2f3874] dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Voir la photo réelle"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Photo</span>
                      </button>
                      <button 
                        onClick={() => openQrModal(machine)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-purple-100 text-purple-700 dark:hover:bg-purple-950/50 dark:text-purple-300 border border-slate-200 dark:border-zinc-700 text-xs font-bold transition-all cursor-pointer"
                        title="Générer QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      {(user?.role === 'Superviseur' || user?.role === 'Ingénieur') && (
                        <button 
                          onClick={() => openEditModal(machine)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Modifier
                        </button>
                      )}
                      {user?.role === 'Superviseur' && (
                        <button 
                          onClick={() => {
                            if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${machine.name} ?`)) {
                              const updated = db.deleteMachine(machine.id);
                              setMachines(updated);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold transition-all cursor-pointer"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredMachines.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Aucun équipement ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Visualisation Photo Réelle Machine */}
      {photoMachine && (
        <Modal 
          isOpen={isPhotoModalOpen} 
          onClose={() => setIsPhotoModalOpen(false)} 
          title={`Photo Réelle : ${photoMachine.name}`}
          maxWidthClass="max-w-3xl"
        >
          <div className="flex flex-col space-y-5">
            {/* Photo Container */}
            <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-xl flex items-center justify-center p-2 min-h-[320px] max-h-[65vh] group/zoom">
              {!hasPhotoError ? (
                <>
                  <img 
                    src={getMachinePhotoCandidates(photoMachine)[0]} 
                    alt={photoMachine.name}
                    className="max-w-full max-h-[58vh] object-contain rounded-xl transition-transform duration-500 ease-out group-hover/zoom:scale-105"
                    onError={() => setHasPhotoError(true)}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-3 bg-slate-900/90 w-full rounded-xl select-none">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700 shadow-inner">
                    <ImageOff className="w-8 h-8 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Aucune photo disponible</h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
                      Aucune photo n'est associée à cet équipement (<strong className="font-mono text-blue-400">{photoMachine.reference || photoMachine.id}</strong>). Les données métier restent intactes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Machine Meta Summary Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-[#2f3874] dark:text-blue-400 text-xs px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800">
                    {photoMachine.reference || photoMachine.id}
                  </span>
                  {photoMachine.codeEq && (
                    <span className="font-mono font-bold text-xs text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-700">
                      Code EQ: {photoMachine.codeEq}
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                    {photoMachine.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-medium">
                  {photoMachine.category || photoMachine.atelier} — <span className="font-mono text-slate-700 dark:text-zinc-300">{photoMachine.location}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  (photoMachine.status === 'Opérationnel' || photoMachine.status === 'Marche')
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-300'
                }`}>
                  {photoMachine.status}
                </span>
                <button 
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="btn-secondary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Ajouter / Modifier */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingId(null); }} title={editingId ? "Modifier la machine" : "Ajouter une nouvelle machine"}>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Code / Référence (ex: FL-070) *</label>
            <input required type="text" value={newMachine.reference} onChange={e => setNewMachine({...newMachine, reference: e.target.value})} className="input-premium font-mono font-bold" placeholder="Ex: FL-070" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Désignation de la Machine *</label>
            <input required type="text" value={newMachine.name} onChange={e => setNewMachine({...newMachine, name: e.target.value})} className="input-premium font-bold" placeholder="Ex: Imprimante 3D SLA Formlabs" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">Catégorie / Atelier *</label>
            <select value={newMachine.category} onChange={e => setNewMachine({...newMachine, category: e.target.value})} className="input-premium cursor-pointer">
              <option value="Atelier Impression 3D">Atelier Impression 3D</option>
              <option value="Atelier Découpe Laser">Atelier Découpe Laser</option>
              <option value="Atelier Usinage CNC">Atelier Usinage CNC</option>
              <option value="Atelier Électronique">Atelier Électronique</option>
              <option value="Atelier Bois & Outillage">Atelier Bois & Outillage</option>
              <option value="Atelier Textile & Vinyle">Atelier Textile & Vinyle</option>
              <option value="Équipements Généraux">Équipements Généraux</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">État initial</label>
            <select value={newMachine.status} onChange={e => setNewMachine({...newMachine, status: e.target.value})} className="input-premium cursor-pointer">
              <option value="Opérationnel">Opérationnel</option>
              <option value="Hors service">Hors service</option>
              <option value="À contrôler">À contrôler</option>
            </select>
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editingId ? "Enregistrer les modifications" : "Créer la machine"}</button>
          </div>
        </form>
      </Modal>

      {/* Modal QR Code */}
      {selectedMachine && (
        <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title={`Fiche & QR Code : ${selectedMachine.name}`}>
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`GMAO-EQUIPEMENT:${selectedMachine.reference}|${selectedMachine.name}`)}`} 
                alt="QR Code"
                className="w-44 h-44 object-contain"
              />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">{selectedMachine.name}</h3>
              <p className="font-mono text-xs font-bold text-[#2f3874] dark:text-blue-400">Réf: {selectedMachine.reference} • Code EQ: {selectedMachine.codeEq || 'Niveau 1'}</p>
              <p className="text-xs text-slate-500">{selectedMachine.category} — {selectedMachine.location}</p>
            </div>
            <button onClick={() => window.print()} className="btn-primary w-full mt-2">
              <Printer className="w-4 h-4" /> Imprimer le QR Code
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Machines;
