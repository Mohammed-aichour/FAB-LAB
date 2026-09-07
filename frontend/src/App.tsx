import { api } from './services/api';
import { refreshFromServer } from './services/db';
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
        Initialisation de votre espace GMA LAB (<strong className="text-white">{user.role}</strong>)...
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
  const [user, setUser] = useState<any>(null);
  const [ready,setReady] = useState(false);
  const [syncError,setSyncError] = useState('');
  useEffect(() => {
    let active=true;
    const restore = async () => {
      try { if (sessionStorage.getItem('gmao_token')) { const r=await api('/auth/me'); await refreshFromServer(); if(active) setUser(r.user); } }
      catch { sessionStorage.removeItem('gmao_token'); localStorage.removeItem('gmao_current_user'); }
      finally { if(active) setReady(true); }
    };
    void restore();
    const expired=()=>{setUser(null);sessionStorage.removeItem('gmao_token');localStorage.removeItem('gmao_current_user');};
    const failed=(e: Event)=>setSyncError((e as CustomEvent<string>).detail);
    window.addEventListener('gmao_session_expired',expired); window.addEventListener('gmao_sync_error',failed);
    return ()=>{active=false;window.removeEventListener('gmao_session_expired',expired);window.removeEventListener('gmao_sync_error',failed);};
  },[]);
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
    sessionStorage.removeItem('gmao_token');
    localStorage.removeItem('gmao_current_user');
    sessionStorage.removeItem('hasSeenGlobalAlerts');
  };

  if (!ready) return <div className="min-h-screen grid place-items-center text-zinc-600" role="status">Chargement de la session…</div>;

  return (
    <QueryClientProvider client={queryClient}>
      {syncError && <div role="alert" className="fixed top-0 inset-x-0 z-[100] p-4 bg-red-100 text-red-900">{syncError} <button onClick={()=>{void refreshFromServer().then(()=>setSyncError('')).catch(e=>setSyncError(e.message));}}>Recharger les données serveur</button></div>}
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
