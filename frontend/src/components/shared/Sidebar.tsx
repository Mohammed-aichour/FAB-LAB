import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Server, Wrench, Users, Box, FileText, Truck, ShieldAlert, CalendarClock } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Machines', path: '/machines', icon: Server },
  { name: 'Criticité AMDEC', path: '/criticite', icon: ShieldAlert },
  { name: 'Plan Préventif', path: '/plan-preventif', icon: CalendarClock },
  { name: 'Bons de Travail', path: '/interventions', icon: Wrench },
  { name: 'Stock & Pièces', path: '/stock', icon: Box },
  { name: 'Fournisseurs', path: '/fournisseurs', icon: Truck },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Utilisateurs', path: '/users', icon: Users },
];

const Sidebar = ({ user }: { user?: any }) => {
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => {
    if (!user) return true;
    if (user.role === 'Utilisateur Normal' || user.role === 'Utilisateur') {
      return ['/', '/machines', '/documents'].includes(item.path);
    }
    if (user.role === 'Technicien' || user.role === 'Ingénieur') {
      return item.path !== '/users' && item.path !== '/fournisseurs';
    }
    return true;
  });

  return (
    <aside className="w-20 hover:w-64 group bg-gradient-to-b from-[#2f3874] via-[#232959] to-[#181c3d] text-white hidden md:flex flex-col shadow-[6px_0_30px_rgba(0,0,0,0.2)] z-40 transition-all duration-300 ease-in-out overflow-hidden absolute h-full select-none border-r border-white/10">
      {/* Brand Header with FabLab Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0 min-w-[16rem] justify-between bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-black/20 shrink-0 border border-white/20">
            <img src="./Fab.png" alt="Logo FabLab" className="w-full h-full object-contain" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <h1 className="text-sm font-black text-white tracking-tight leading-none">
              GMA <span className="text-[#e0a61e]">LAB</span>
            </h1>
            <span className="text-[10px] font-medium text-white/70">Universiapolis Agadir</span>
          </div>
        </div>
      </div>

      {/* Navigation Links with Brand Palette */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 min-w-[16rem] overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group/link",
                isActive 
                  ? "bg-[#b92721] text-white shadow-lg shadow-[#b92721]/40 border border-white/20" 
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
              title={item.name}
            >
              <Icon className={cn("w-5 h-5 shrink-0 transition-transform group-hover/link:scale-110", isActive ? "text-white" : "text-white/80")} />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap tracking-wide">{item.name}</span>
              {isActive && (
                <div className="absolute right-2.5 w-2 h-2 rounded-full bg-[#e0a61e] shadow-sm shadow-[#e0a61e]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Badge */}
      {user && (
        <div className="p-3 border-t border-white/10 bg-black/20 min-w-[16rem]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-[#e0a61e] text-[#2f3874] font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name || 'Utilisateur'}</p>
              <p className="text-[10px] text-[#e0a61e] font-semibold truncate">{user.role || 'Superviseur'}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
