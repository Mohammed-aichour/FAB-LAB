import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/shared/Sidebar';
import Topbar from '../components/shared/Topbar';
import Modal from '../components/shared/Modal';
import { AlertTriangle } from 'lucide-react';
import { db } from '../services/db';
import { NotificationPanel, type NotificationItem } from '../components/shared/NotificationPanel';

const Layout = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(true);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [showGlobalAlerts, setShowGlobalAlerts] = useState(false);
  const [rawAlerts, setRawAlerts] = useState<any[]>([]);

  // Fonction pour jouer un son de notification style Téléphone
  const playNotificationSound = () => {
    if (hasPlayedSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playRings = () => {
        const playBurst = (start: number) => {
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
          osc1.frequency.value = 440; osc2.frequency.value = 480;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
          gain.gain.setValueAtTime(0.2, start + 0.35);
          gain.gain.linearRampToValueAtTime(0, start + 0.4);
          osc1.start(start); osc2.start(start);
          osc1.stop(start + 0.4); osc2.stop(start + 0.4);
        };

        playBurst(audioCtx.currentTime);
        playBurst(audioCtx.currentTime + 0.5);
        playBurst(audioCtx.currentTime + 2.0);
        playBurst(audioCtx.currentTime + 2.5);
      };

      if (audioCtx.state === 'suspended') {
        const resumeAndPlay = () => {
          audioCtx.resume().then(() => {
            playRings();
            setHasPlayedSound(true);
          });
          document.removeEventListener('click', resumeAndPlay);
          document.removeEventListener('keydown', resumeAndPlay);
        };
        document.addEventListener('click', resumeAndPlay);
        document.addEventListener('keydown', resumeAndPlay);
      } else {
        playRings();
        setHasPlayedSound(true);
      }
    } catch(e) {
      console.log('Audio non supporté', e);
    }
  };

  useEffect(() => {
    const checkAlerts = () => {
      let combinedAlerts: any[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let interventions = db.getInterventions();
      let interventionsUpdated = false;

      // 1. GÉNÉRATION AUTOMATIQUE CURATIF (Machines en panne)
      const machines = db.getMachines();
      machines.forEach((m: any) => {
        if (m.status && (m.status.toLowerCase().includes('hors service') || m.status.toLowerCase().includes('en panne'))) {
          const exists = interventions.find((i: any) => (i.equipmentName === m.name || i.machine === m.name) && (i.maintenanceType === 'Corrective' || i.type === 'Corrective') && i.status !== 'Terminé');
          if (!exists) {
            interventions.unshift({
              id: Date.now() + Math.random(),
              otNumber: `OT-AUTO-${Math.floor(Math.random() * 1000)}`,
              diNumber: '-',
              creationDate: today.toISOString().split('T')[0],
              maintenanceType: 'Corrective',
              equipmentId: m.reference || m.id || 'FL-001',
              equipmentName: m.name,
              atelier: m.atelier || 'FabLab',
              priority: 'A',
              description: 'Machine déclarée HS - Génération Automatique',
              gammeRef: '-',
              technician: 'Non assigné',
              plannedDate: today.toISOString().split('T')[0],
              startDate: '',
              endDate: '',
              realDurationHours: 0,
              partsUsed: [],
              partsCostMAD: 0,
              laborCostMAD: 150,
              totalCostMAD: 150,
              status: 'Nouveau',
              supervisorVisa: 'En attente',
              observations: ''
            });
            interventionsUpdated = true;
          }
        }
      });

      if (interventions.length > 0) {
        const dueInterventions = interventions.filter((i: any) => {
          if (i.status === 'Terminé' || !i.date) return false;
          const targetDate = new Date(i.date);
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3) {
            i.diffDays = diffDays;
            i.alertType = 'intervention';
            return true;
          }
          return false;
        });
        combinedAlerts = [...dueInterventions];
      }

      // Vérification des Maintenances Préventives (GMAO)
      let preventif = db.getPreventif();
      if (preventif && preventif.length > 0) {
        const duePreventif = preventif.filter((p: any) => {
          if (!p.nextDate) return false;
          const targetDate = new Date(p.nextDate);
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3) {
            p.diffDays = diffDays;
            p.alertType = 'preventif';
            return true;
          }
          return false;
        });

        preventif.forEach((p: any) => {
          if (!p.nextDate) return;
          const targetDate = new Date(p.nextDate);
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            const exists = interventions.find((i: any) => (i.equipmentName === p.equipement || i.machine === p.equipement) && (i.maintenanceType === 'Préventive' || i.type === 'Préventive') && i.status !== 'Terminé' && i.description === p.action);
            if (!exists) {
              interventions.unshift({
                id: Date.now() + Math.random(),
                otNumber: `OT-PREV-${Math.floor(Math.random() * 1000)}`,
                diNumber: '-',
                creationDate: today.toISOString().split('T')[0],
                maintenanceType: 'Préventive',
                equipmentId: p.equipementCode || 'FL-001',
                equipmentName: p.equipement,
                atelier: p.atelier || 'FabLab',
                priority: 'B',
                description: p.action,
                gammeRef: '-',
                technician: 'Non assigné',
                plannedDate: targetDate.toISOString().split('T')[0],
                startDate: '',
                endDate: '',
                realDurationHours: 0,
                partsUsed: [],
                partsCostMAD: 0,
                laborCostMAD: 150,
                totalCostMAD: 150,
                status: 'Nouveau',
                supervisorVisa: 'En attente',
                observations: ''
              });
              interventionsUpdated = true;
            }
          }
        });
        
        combinedAlerts = [...combinedAlerts, ...duePreventif];
      }

      // 3. VÉRIFICATION MACHINES EN PANNE
      const dueMachines = machines.filter((m: any) => {
        if (m.status && (m.status.toLowerCase().includes('hors service') || m.status.toLowerCase().includes('en panne'))) {
          m.alertType = 'machine';
          return true;
        }
        return false;
      });
      combinedAlerts = [...combinedAlerts, ...dueMachines];

      // 4. VÉRIFICATION STOCK INSUFFISANT
      const stock = db.getStock();
      const dueStock = stock.filter((s: any) => {
        if (s.quantity <= s.min) {
          s.alertType = 'stock';
          return true;
        }
        return false;
      });
      combinedAlerts = [...combinedAlerts, ...dueStock];

      if (interventionsUpdated) {
        db.saveInterventions(interventions);
      }

      // Transform combinedAlerts into NotificationItem[]
      const notifs: NotificationItem[] = combinedAlerts.map((alt, idx) => {
        const id = alt.id ? String(alt.id) : `notif-${idx}-${Date.now()}`;
        const nowStr = new Date().toLocaleDateString('fr-FR');
        const ts = Date.now() - idx * 10000;

        if (alt.alertType === 'machine') {
          return {
            id,
            title: `Panne Machine — ${alt.name}`,
            message: `L'équipement ${alt.name} (${alt.reference || alt.id}) est déclaré Hors Service / En panne.`,
            category: 'Alertes',
            date: nowStr,
            timestamp: ts,
            read: false,
            priority: 'Haute',
            machine: alt.name,
            reference: alt.reference,
            targetUrl: '/machines'
          };
        } else if (alt.alertType === 'stock') {
          return {
            id,
            title: `Alerte Stock — ${alt.name}`,
            message: `Le niveau de stock (${alt.quantity} ${alt.unit || 'u'}) est inférieur au seuil min (${alt.min}).`,
            category: 'Stock',
            date: nowStr,
            timestamp: ts,
            read: false,
            priority: 'Moyenne',
            reference: alt.reference,
            targetUrl: '/stock'
          };
        } else if (alt.alertType === 'preventif') {
          return {
            id,
            title: `Maintenance Préventive — ${alt.equipement || alt.machine}`,
            message: `Opération : ${alt.action || alt.description || 'Gamme de révision périodique'}.`,
            category: 'Maintenance',
            date: nowStr,
            timestamp: ts,
            read: false,
            priority: 'Moyenne',
            machine: alt.equipement || alt.machine,
            targetUrl: '/interventions'
          };
        } else {
          return {
            id,
            title: `Intervention Prévue — ${alt.equipmentName || alt.machine || 'Équipement'}`,
            message: `OT N° ${alt.otNumber || 'OT-AUTO'} — Technician: ${alt.technician || 'Non assigné'}.`,
            category: 'Maintenance',
            date: nowStr,
            timestamp: ts,
            read: false,
            priority: alt.priority === 'A' ? 'Haute' : 'Moyenne',
            machine: alt.equipmentName || alt.machine,
            targetUrl: '/interventions'
          };
        }
      });

      if (combinedAlerts.length > 0) {
        setRawAlerts(combinedAlerts);
        setNotificationsList(notifs);
        if (!sessionStorage.getItem('hasSeenGlobalAlerts')) {
          setShowGlobalAlerts(true);
          playNotificationSound();
        }
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [hasPlayedSound]);

  // Notification List Management Handlers
  const handleDeleteOne = (id: string) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id));
  };

  const handleDeleteAll = () => {
    setNotificationsList([]);
  };

  const handleMarkAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getRoleFeatures = (role: string) => {
    switch(role) {
      case 'Superviseur':
        return [
          'Accès total aux analyses d\'ingénierie (TRS, Pareto)', 
          'Gestion complète du Parc Machines & Fournisseurs', 
          'Gestion des Comptes Utilisateurs', 
          'Droit de suppression de tous les enregistrements'
        ];
      case 'Ingénieur':
        return [
          'Suivi des indicateurs du tableau de bord', 
          'Ajout et modification du Parc Machines', 
          'Création et gestion des Interventions', 
          'Mise à jour du Stock'
        ];
      case 'Technicien':
        return [
          'Déclaration et clôture d\'interventions de maintenance', 
          'Consultation de l\'état du Stock en temps réel', 
          'Consultation des Machines disponibles', 
          'Ajout de Documents techniques'
        ];
      default:
        return [
          'Consultation du Parc Machines', 
          'Consultation de l\'état du Stock', 
          'Lecture seule des Documents'
        ];
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 selection:bg-fab-blue/20 selection:text-fab-blue text-slate-900 dark:text-slate-100">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 overflow-hidden relative md:ml-20 transition-all duration-300">
        <Topbar user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div key={location.pathname} className="animate-page-enter w-full h-full">
            <Outlet context={user} />
          </div>
        </main>
      </div>

      <Modal isOpen={showWelcome} onClose={() => setShowWelcome(false)} title={`Bienvenue dans l'espace ${user?.role}`}>
        <div className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            Voici les fonctionnalités (droits d'accès) activées pour votre profil <strong className="text-fab-blue">{user?.role}</strong> :
          </p>
          <ul className="space-y-3 mt-4">
            {getRoleFeatures(user?.role).map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-800 dark:text-zinc-200">
                <span className="w-2 h-2 rounded-full bg-fab-red shadow-[0_0_8px_rgba(225,29,72,0.6)]"></span>
                <span className="font-medium text-sm">{feat}</span>
              </li>
            ))}
          </ul>
          <div className="pt-6 flex justify-end">
            <button 
              onClick={() => setShowWelcome(false)} 
              className="btn-neu px-6 py-2.5 rounded-xl"
            >
              Démarrer ma session
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showGlobalAlerts} onClose={() => { setShowGlobalAlerts(false); sessionStorage.setItem('hasSeenGlobalAlerts', 'true'); }} title="⚠️ ALERTES IMPORTANTES GMAO">
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-500/20">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-bold">Le système a détecté des anomalies nécessitant votre attention immédiate.</p>
          </div>
          
          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {rawAlerts.filter(a => a.alertType === 'machine').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-500 uppercase">Machines en Panne</h4>
                {rawAlerts.filter(a => a.alertType === 'machine').map((m, i) => (
                  <div key={`m-${i}`} className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-red-200 dark:border-red-500/30 flex justify-between items-center">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{m.name}</span>
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">Panne</span>
                  </div>
                ))}
              </div>
            )}
            
            {rawAlerts.filter(a => a.alertType === 'stock').length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase">Stock Critique</h4>
                {rawAlerts.filter(a => a.alertType === 'stock').map((s, i) => (
                  <div key={`s-${i}`} className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-orange-200 dark:border-orange-500/30 flex flex-col gap-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{s.name} ({s.reference})</span>
                    <span className="text-xs text-orange-600 font-medium">Quantité actuelle: {s.quantity} (Seuil: {s.min})</span>
                  </div>
                ))}
              </div>
            )}

            {rawAlerts.filter(a => a.alertType === 'preventif' || a.alertType === 'intervention').length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-zinc-500 uppercase">Tâches Urgentes</h4>
                {rawAlerts.filter(a => a.alertType === 'preventif' || a.alertType === 'intervention').map((t, i) => (
                  <div key={`t-${i}`} className="bg-white dark:bg-zinc-800 p-3 rounded-lg border border-blue-200 dark:border-blue-500/30 flex flex-col gap-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{t.equipement || t.machine}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{t.action || t.description || 'Intervention'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="pt-4 flex justify-end">
            <button onClick={() => { setShowGlobalAlerts(false); sessionStorage.setItem('hasSeenGlobalAlerts', 'true'); }} className="btn-neu px-6 py-2 rounded-xl text-sm font-bold bg-fab-blue text-white">
              J'ai compris
            </button>
          </div>
        </div>
      </Modal>

      {/* NOISY NOTIFICATION PANEL AT BOTTOM RIGHT */}
      <NotificationPanel
        notifications={notificationsList}
        onDeleteOne={handleDeleteOne}
        onDeleteAll={handleDeleteAll}
        onMarkAllRead={handleMarkAllRead}
        onToggleRead={handleToggleRead}
      />
    </div>
  );
};

export default Layout;
