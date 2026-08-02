import { useState } from 'react';
import { Lock, Mail, Shield, Wrench, GraduationCap, User } from 'lucide-react';

const getProfiles = () => {
  const stored = localStorage.getItem('gmao_users');
  return stored ? JSON.parse(stored) : [];
};

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getProfiles().find((p: any) => p.email === email);
    
    if (user && password === 'password123') {
      onLogin(user);
    } else {
      setError("Email incorrect. (Mot de passe: password123)");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in">
        <div className="p-8">
          <div className="text-center mb-6 animate-fade-in-up">
            <div className="flex justify-center mb-4">
              <img src="./Fab.png" alt="Logo FabLab" className="h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">GMAO FabLab</h1>
            <p className="text-zinc-500 mt-2">Connectez-vous pour accéder à votre espace</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2">
            {getProfiles().slice(0, 4).map((prof: any) => {
              const Icon = prof.role === 'Superviseur' ? Shield :
                           prof.role === 'Ingénieur' ? GraduationCap :
                           prof.role === 'Technicien' ? Wrench : User;
              return (
                <button 
                  key={prof.email}
                  type="button"
                  onClick={() => setEmail(prof.email)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-all duration-300 hover:-translate-y-1 ${email === prof.email ? 'border-fab-blue bg-blue-50 dark:bg-blue-900/20 text-fab-blue dark:text-blue-300 shadow-md' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-fab-blue/50'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium truncate" title={prof.name}>{prof.name}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-zinc-900 dark:text-white"
                  placeholder="Selectionnez un profil au-dessus"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-zinc-900 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-neu w-full px-4 py-2.5 rounded-xl animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
