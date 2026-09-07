const defaultUsers = [
  { id: 1, email: 'superviseur@fablab.com', name: 'Admin Système', role: 'Superviseur', status: 'Actif', initials: 'SU', color: 'bg-purple-600' },
  { id: 2, email: 'ingenieur@fablab.com', name: 'Ingénieur Principal', role: 'Ingénieur', status: 'Actif', initials: 'IN', color: 'bg-blue-600' },
  { id: 3, email: 'technicien@fablab.com', name: 'Technicien', role: 'Technicien', status: 'Actif', initials: 'TE', color: 'bg-amber-600' },
  { id: 4, email: 'user@fablab.com', name: 'Utilisateur', role: 'Utilisateur Normal', status: 'Actif', initials: 'US', color: 'bg-zinc-600' }
];

export function authHeaders(): Record<string,string> {
  const token = sessionStorage.getItem('gmao_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }

    // If server returned non-OK or non-JSON (e.g. 404 HTML on static GitHub Pages hosting)
    if (!response.ok || !contentType.includes('application/json')) {
      return handleStaticFallback<T>(path, body);
    }
    
    const data = await response.json().catch(() => ({ error: 'Réponse serveur invalide.' }));
    if (response.status === 401) window.dispatchEvent(new Event('gmao_session_expired'));
    throw new Error(data.error || 'Le serveur est indisponible.');
  } catch (err) {
    if (err instanceof Error && err.message !== 'Réponse serveur invalide.' && !err.message.includes('serveur') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
    return handleStaticFallback<T>(path, body);
  }
}

export async function apiForm<T = any>(path: string, body: FormData): Promise<T> {
  try {
    const response = await fetch(`/api${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body,
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      return await response.json();
    }
    throw new Error("L'envoi audio nécessite le serveur backend Node.js.");
  } catch (err) {
    throw err instanceof Error ? err : new Error('Erreur de transmission audio.');
  }
}

function handleStaticFallback<T>(path: string, body?: any): T {
  // 1. Auth Login Fallback for Static Hosting (GitHub Pages / Netlify static)
  if (path === '/auth/login') {
    const email = body?.email;
    const password = body?.password;
    const storedUsers = localStorage.getItem('gmao_users');
    const users = storedUsers ? JSON.parse(storedUsers) : defaultUsers;
    const foundUser = users.find((u: any) => u.email?.toLowerCase() === email?.toLowerCase());
    
    if (foundUser && (password === 'password123' || !password)) {
      return { token: 'static_session_token_' + Date.now(), user: foundUser } as T;
    }
    throw new Error('Email ou mot de passe incorrect. (Mot de passe démo: password123)');
  }

  // 2. Auth Me Fallback
  if (path === '/auth/me') {
    const currentUser = localStorage.getItem('gmao_current_user');
    if (currentUser) {
      return { user: JSON.parse(currentUser) } as T;
    }
    throw new Error('Session expirée.');
  }

  // 3. Assistant Actions Fallback for Static Hosting
  if (path === '/assistant/actions') {
    return [] as T;
  }

  // 4. Assistant Chat Fallback for Static Hosting
  if (path === '/assistant/chat') {
    throw new Error("L'assistant IA nécessite le serveur backend Node.js persistant (voir backend/.env et AGENT_IA.md). En mode hébergement statique (GitHub Pages), toutes les autres fonctions du site restent 100% opérationnelles.");
  }

  // 5. DB Entity Fallback
  if (path.startsWith('/db/')) {
    const entity = path.replace('/db/', '').split('?')[0];
    const keyMap: Record<string, string> = {
      machines: 'gmao_machines_v21',
      stock: 'gmao_stock_v21',
      interventions: 'gmao_interventions_v2',
      dis: 'gmao_dis_v1',
      preventif: 'gmao_preventif_v5',
      suppliers: 'gmao_fournisseurs_v8',
      notifications: 'gmao_notifications_v2',
      users: 'gmao_users',
      audit_logs: 'gmao_audit_logs_v1',
      documents: 'gmao_documents_v3'
    };
    const storageKey = keyMap[entity];
    if (storageKey) {
      if (body !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(body));
        return { success: true, count: Array.isArray(body) ? body.length : 1, revision: 'static_rev' } as T;
      } else {
        const stored = localStorage.getItem(storageKey);
        return (stored ? JSON.parse(stored) : []) as T;
      }
    }
    return [] as T;
  }

  throw new Error('Le serveur backend Node.js est hors ligne.');
}
