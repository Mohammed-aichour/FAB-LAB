import { useState, useMemo } from 'react';
import { amdecData } from '../data/amdecData';
import { Info, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

const Criticite = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasse, setFilterClasse] = useState<string>('TOUS');

  const currentAmdec = useMemo(() => {
    try {
      const stored = localStorage.getItem('gmao_amdec_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return amdecData;
  }, []);

  const filteredData = useMemo(() => {
    return currentAmdec.filter((item: any) => {
      const eq = (item.equipement || '').toLowerCase();
      const sys = (item.systeme || item.SousSysteme || '').toLowerCase();
      const code = (item.codeEq || '').toLowerCase();
      const def = (item.modeDefaillance || item.defaillance || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchSearch = query === '' || eq.includes(query) || sys.includes(query) || code.includes(query) || def.includes(query);
      const matchClasse = filterClasse === 'TOUS' || (item.classe || '').toUpperCase() === filterClasse;

      return matchSearch && matchClasse;
    });
  }, [currentAmdec, searchTerm, filterClasse]);

  const stats = useMemo(() => {
    const total = currentAmdec.length;
    const classeA = currentAmdec.filter((i: any) => (i.classe || '').toUpperCase() === 'A').length;
    const classeB = currentAmdec.filter((i: any) => (i.classe || '').toUpperCase() === 'B').length;
    const classeC = currentAmdec.filter((i: any) => (i.classe || '').toUpperCase() === 'C').length;
    return { total, classeA, classeB, classeC };
  }, [currentAmdec]);

  const getClasseBadge = (classe: string) => {
    const cl = (classe || '').toUpperCase();
    switch(cl) {
      case 'A':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800';
      case 'B':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'C':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200';
    }
  };

  const getNiveauStyle = (niveau: string) => {
    const niv = (niveau || 'N1').toUpperCase();
    if (niv.includes('N3')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200';
    if (niv.includes('N2')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200';
    return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Analyse de Criticité AMDEC
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2f3874] text-white">
              Analyse AMDEC
            </span>
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 font-medium">
            Évaluation rigoureuse des modes de défaillance (Indice IC = Fréquence × Gravité × Détectabilité)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilterClasse('TOUS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterClasse === 'TOUS' ? 'bg-[#2f3874] text-white shadow-md' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
          >
            Toutes ({stats.total})
          </button>
          <button 
            onClick={() => setFilterClasse('A')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterClasse === 'A' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}
          >
            Classe A ({stats.classeA})
          </button>
          <button 
            onClick={() => setFilterClasse('B')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterClasse === 'B' ? 'bg-amber-500 text-white shadow-md' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}
          >
            Classe B ({stats.classeB})
          </button>
          <button 
            onClick={() => setFilterClasse('C')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${filterClasse === 'C' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}
          >
            Classe C ({stats.classeC})
          </button>
        </div>
      </div>
      
      {/* Legend & Methodology Card */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-[#2f3874] dark:bg-blue-950/50 dark:text-blue-300 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Formule AMDEC Officielle</p>
            <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
              <strong className="text-slate-800 dark:text-zinc-200">IC = F × G × D</strong> (Formule d'analyse calculée)<br/>
              Échelle d'évaluation : 1 à 5 pour chaque facteur.
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Seuils de Classification</p>
            <ul className="space-y-1 text-slate-600 dark:text-zinc-300 font-medium">
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600"></span> <strong>Classe A (IC ≥ 45)</strong> : Préventif systématique renforcé</li>
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> <strong>Classe B (20 ≤ IC &lt; 45)</strong> : Préventif périodique</li>
              <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> <strong>Classe C (IC &lt; 20)</strong> : Préventif de base / ronde</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white mb-1">Niveaux d'Intervention (NF X60-010)</p>
            <ul className="space-y-1 text-slate-600 dark:text-zinc-300 font-medium">
              <li><strong>N1</strong> : Opérateur / Maintenance de 1er niveau</li>
              <li><strong>N2</strong> : Technicien de maintenance FabLab</li>
              <li><strong>N3</strong> : Expert / Prestataire spécialisé externe</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-800/40">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input 
              type="text" 
              placeholder="Filtrer par machine, sous-système, défaillance..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-[#2f3874]/20 focus:border-[#2f3874] transition-all"
            />
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            Affichage de <span className="text-[#2f3874] dark:text-blue-400 font-extrabold">{filteredData.length}</span> sur <span className="font-extrabold">{currentAmdec.length}</span> fiches d'analyse
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto relative">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#2f3874] text-white sticky top-0 z-10 shadow-md text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5 border-r border-white/10">Code / Équipement Principal</th>
                <th className="px-4 py-3.5 border-r border-white/10">Sous-Système / Organe</th>
                <th className="px-4 py-3.5 border-r border-white/10 min-w-[240px]">Mode de Défaillance Principal</th>
                <th className="px-3 py-3.5 text-center border-r border-white/10" title="Fréquence (1-5)">F</th>
                <th className="px-3 py-3.5 text-center border-r border-white/10" title="Gravité (1-5)">G</th>
                <th className="px-3 py-3.5 text-center border-r border-white/10" title="Détectabilité (1-5)">D</th>
                <th className="px-4 py-3.5 text-center border-r border-white/10 font-black">IC (F×G×D)</th>
                <th className="px-3.5 py-3.5 text-center border-r border-white/10">Classe</th>
                <th className="px-4 py-3.5 border-r border-white/10 min-w-[220px]">Stratégie Recommandée</th>
                <th className="px-3 py-3.5 text-center">Niveau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredData.map((row: any, i: number) => {
                const fVal = row.f ?? row.F ?? 1;
                const gVal = row.g ?? row.G ?? 1;
                const dVal = row.d ?? row.D ?? 1;
                const icVal = row.ic ?? row.IC ?? (fVal * gVal * dVal);
                const classeVal = (row.classe || 'C').toUpperCase();

                return (
                  <tr key={row.id || i} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800">
                      <div className="font-bold text-slate-900 dark:text-white">{row.equipement}</div>
                      <div className="text-[10px] font-mono font-bold text-[#2f3874] dark:text-blue-400 mt-0.5">{row.codeEq}</div>
                    </td>
                    <td className="px-4 py-3 border-r border-slate-100 dark:border-zinc-800">
                      <div className="font-bold text-slate-800 dark:text-zinc-200">{row.systeme || row.SousSysteme}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.codeSs || row.codeSys}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-zinc-300 font-medium border-r border-slate-100 dark:border-zinc-800 leading-relaxed">
                      {row.modeDefaillance || row.defaillance}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800">{fVal}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800">{gVal}</td>
                    <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800">{dVal}</td>
                    <td className="px-4 py-3 text-center font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800/40 border-r border-slate-100 dark:border-zinc-800 text-sm">
                      {icVal}
                    </td>
                    <td className="px-3.5 py-3 text-center border-r border-slate-100 dark:border-zinc-800">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border font-black text-xs shadow-xs ${getClasseBadge(classeVal)}`}>
                        {classeVal}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-zinc-300 border-r border-slate-100 dark:border-zinc-800 font-medium leading-relaxed">
                      {row.action || 'Maintenance préventive recommandée'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getNiveauStyle(row.niveau)}`}>
                        {row.niveau || 'N1'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    Aucune fiche AMDEC ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Criticite;
