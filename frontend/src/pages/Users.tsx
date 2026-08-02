import { useState, useEffect } from 'react';
import Modal from '../components/shared/Modal';

const Users = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('gmao_users');
    if (stored) {
      setUsers(JSON.parse(stored));
    }
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Technicien', status: 'Actif' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Générer initials et couleur
    const initials = newUser.name.substring(0, 2).toUpperCase();
    const color = newUser.role === 'Superviseur' ? 'bg-purple-600' : 
                  newUser.role === 'Ingénieur' ? 'bg-blue-600' : 
                  newUser.role === 'Technicien' ? 'bg-amber-600' : 'bg-zinc-600';

    let updatedUsers;
    if (editingId) {
      updatedUsers = users.map(u => u.id === editingId ? { ...u, ...newUser, initials, color } : u);
    } else {
      updatedUsers = [{ id: Date.now(), ...newUser, initials, color }, ...users];
    }
    
    setUsers(updatedUsers);
    localStorage.setItem('gmao_users', JSON.stringify(updatedUsers));
    
    setIsModalOpen(false);
    setEditingId(null);
    setNewUser({ name: '', email: '', role: 'Technicien', status: 'Actif' });
  };

  const openEdit = (user: any) => {
    setEditingId(user.id);
    setNewUser({ name: user.name, email: user.email, role: user.role, status: user.status });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setNewUser({ name: '', email: '', role: 'Technicien', status: 'Actif' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Utilisateurs</h1>
        <button onClick={openAdd} className="btn-neu px-4 py-2 rounded-xl text-sm">
          + Ajouter un Utilisateur
        </button>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-3 font-medium">Nom</th>
              <th className="px-6 py-3 font-medium">Email</th>
              <th className="px-6 py-3 font-medium">Rôle</th>
              <th className="px-6 py-3 font-medium">Statut</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-200">
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'Actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(user)} className="btn-neu px-3 py-1.5 rounded-lg text-xs">Modifier</button>
                  <button 
                    onClick={() => {
                      const updated = users.filter(u => u.id !== user.id);
                      setUsers(updated);
                      localStorage.setItem('gmao_users', JSON.stringify(updated));
                    }} 
                    className="btn-neu btn-neu-danger px-3 py-1.5 rounded-lg text-xs"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Aucun utilisateur trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier Utilisateur" : "Nouvel Utilisateur"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet</label>
            <input required type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none focus:border-fab-blue bg-white dark:bg-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none focus:border-fab-blue bg-white dark:bg-zinc-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rôle</label>
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md outline-none focus:border-fab-blue bg-white dark:bg-zinc-900">
              <option>Superviseur</option>
              <option>Ingénieur</option>
              <option>Technicien</option>
              <option>Utilisateur Normal</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-neu btn-neu-danger px-4 py-2 rounded-xl text-sm">Annuler</button>
            <button type="submit" className="btn-neu px-4 py-2 rounded-xl text-sm">Enregistrer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
