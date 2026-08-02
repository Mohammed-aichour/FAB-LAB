import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GmaoProvider } from './context/GmaoContext';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Fournisseurs from './pages/Fournisseurs';
import Interventions from './pages/Interventions';
import Users from './pages/Users';
import Documents from './pages/Documents';
import Stock from './pages/Stock';
import Login from './pages/Login';
import Criticite from './pages/Criticite';
import PlanPreventif from './pages/PlanPreventif';
import { BonTravailPage } from './components/bt/BonTravailPage';

const queryClient = new QueryClient();

const defaultUsers = [
  { id: 1, email: 'superviseur@fablab.com', name: 'Admin Système', role: 'Superviseur', status: 'Actif', initials: 'SU', color: 'bg-purple-600' },
  { id: 2, email: 'ingenieur@fablab.com', name: 'Ingénieur Principal', role: 'Ingénieur', status: 'Actif', initials: 'IN', color: 'bg-blue-600' },
  { id: 3, email: 'technicien@fablab.com', name: 'Technicien', role: 'Technicien', status: 'Actif', initials: 'TE', color: 'bg-amber-600' },
  { id: 4, email: 'user@fablab.com', name: 'Utilisateur', role: 'Utilisateur Normal', status: 'Actif', initials: 'US', color: 'bg-zinc-600' }
];

if (!localStorage.getItem('gmao_users')) {
  localStorage.setItem('gmao_users', JSON.stringify(defaultUsers));
}

const IntroScreen = ({ user }: { user: any }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p < 100 ? p + 4 : 100)); // Rempli en environ 2.5 secondes
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="absolute inset-0 bg-fab-blue rounded-full blur-[60px] opacity-40 animate-pulse"></div>
        <img src="./Fab.png" alt="Logo FabLab" className="relative w-32 h-32 object-contain animate-bounce" style={{ animationDuration: '2s' }} />
      </div>
      <h1 className="mt-10 text-3xl font-bold text-white animate-fade-in-up">
        Bienvenue, <span className="text-fab-yellow">{user.name}</span>
      </h1>
      <p className="mt-2 text-slate-400 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        Initialisation de votre espace <strong className="text-white">{user.role}</strong>...
      </p>
      <div className="mt-10 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-fab-blue via-fab-yellow to-fab-red transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('gmao_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showIntro, setShowIntro] = useState(false);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem('gmao_current_user', JSON.stringify(loggedInUser));
    setShowIntro(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 2800); // Durée de l'intro
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gmao_current_user');
    sessionStorage.removeItem('hasSeenGlobalAlerts');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <GmaoProvider>
      <HashRouter>
        <Routes>
          {!user ? (
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          ) : showIntro ? (
            <Route path="*" element={<IntroScreen user={user} />} />
          ) : (
            <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
              <Route index element={<Dashboard />} />
              <Route path="machines" element={<Machines />} />
              <Route path="fournisseurs" element={<Fournisseurs />} />
              <Route path="interventions" element={<Interventions />} />
              <Route path="bons-de-travail" element={<BonTravailPage user={user} />} />
              <Route path="users" element={<Users />} />
              <Route path="documents" element={<Documents />} />
              <Route path="stock" element={<Stock />} />
              <Route path="criticite" element={<Criticite />} />
              <Route path="plan-preventif" element={<PlanPreventif />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </HashRouter>
      </GmaoProvider>
    </QueryClientProvider>
  );
}

export default App;
