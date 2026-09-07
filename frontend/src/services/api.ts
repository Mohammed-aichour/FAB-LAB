import { REAL_MACHINES_DATA } from '../data/realMachinesData';
import { realStockItems } from '../data/realStockData';
import { initialOTs } from '../data/otData';
import { preventifData } from '../data/amdecData';

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

  // 4. Assistant Chat Fallback for Static Hosting (GitHub Pages)
  if (path === '/assistant/chat') {
    const userPrompt = typeof body === 'object' && body !== null ? ((body as any).message || (body as any).prompt || '') : '';
    const answer = generateLocalGMAOAssistantResponse(userPrompt);
    return {
      conversationId: (body as any)?.conversationId || ('static_conv_' + Date.now()),
      message: answer,
      usedTools: ['gmao_local_database_fallback']
    } as T;
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

function generateLocalGMAOAssistantResponse(userPrompt: string): string {
  const text = (userPrompt || '').toLowerCase();

  let machines: any[] = [];
  try {
    const raw = localStorage.getItem('gmao_machines_v21');
    machines = raw ? JSON.parse(raw) : REAL_MACHINES_DATA;
  } catch { machines = REAL_MACHINES_DATA; }

  let stock: any[] = [];
  try {
    const raw = localStorage.getItem('gmao_stock_v21');
    stock = raw ? JSON.parse(raw) : realStockItems;
  } catch { stock = realStockItems; }

  let interventions: any[] = [];
  try {
    const raw = localStorage.getItem('gmao_interventions_v2');
    interventions = raw ? JSON.parse(raw) : initialOTs;
  } catch { interventions = initialOTs; }

  let preventif: any[] = [];
  try {
    const raw = localStorage.getItem('gmao_preventif_v5');
    preventif = raw ? JSON.parse(raw) : preventifData;
  } catch { preventif = preventifData; }

  // 1. Check for machines / breakdown queries
  if (/machine|panne|équipement|état|parc|hors service|indisponible/.test(text)) {
    const brokenOrMaint = machines.filter(m => 
      /panne|maintenance|hors service|critique|arrêt|inactif/i.test(m.status || '')
    );
    const operational = machines.filter(m => 
      /opérationnel|fonctionnel|actif|en service|bon/i.test(m.status || '')
    );

    if (brokenOrMaint.length === 0) {
      return `**État du Parc Machine (FabLab GMAO)**\n\nToutes les **${machines.length} machines** de l'atelier sont actuellement **opérationnelles** et en service.\n\n* **Machines en service :** ${operational.length}/${machines.length}\n* **Machines en panne :** 0\n\nAucune panne majeure n'est enregistrée pour le moment.`;
    }

    let reply = `**État des Machines & Pannes Actuelles (FabLab GMAO)**\n\n`;
    reply += `Sur un total de **${machines.length} machines**, **${brokenOrMaint.length} machine(s)** nécessitent une intervention ou sont hors service :\n\n`;
    brokenOrMaint.forEach((m, idx) => {
      reply += `${idx + 1}. **${m.name || m.designation}** (${m.reference || m.id})\n`;
      reply += `   * **Statut :** ${m.status || 'En panne'}\n`;
      reply += `   * **Emplacement :** ${m.location || m.atelier || 'FabLab'}\n`;
      if (m.criticite) reply += `   * **Criticité :** ${m.criticite}\n`;
    });
    reply += `\n**Machines opérationnelles :** ${operational.length}/${machines.length} machines sont prêtes à l'emploi.`;
    return reply;
  }

  // 2. Check for stock / components queries
  if (/stock|composant|pièce|rupture|critique|fournisseur|quanti/.test(text)) {
    const criticalStock = stock.filter(s => 
      (s.quantity <= (s.min ?? 5)) || /critique|rupture|faible/i.test(s.status || '')
    );

    if (criticalStock.length === 0) {
      return `**État du Stock & Pièces de Rechange**\n\nTous les **${stock.length} articles** en stock sont au-dessus du seuil d'alerte minimal.\n\nAucune rupture de stock ou réapprovisionnement urgent n'est requis actuellement.`;
    }

    let reply = `**Alerte Stock & Composants Critiques (FabLab GMAO)**\n\n`;
    reply += `Il y a **${criticalStock.length} article(s)** en stock sous le seuil d'alerte minimal :\n\n`;
    criticalStock.forEach((s, idx) => {
      reply += `${idx + 1}. **${s.name}** (Ref: ${s.reference || s.id})\n`;
      reply += `   * **Quantité actuelle :** ${s.quantity} ${s.unit || 'u'} (Seuil min: ${s.min ?? 'N/A'})\n`;
      reply += `   * **Fournisseur recommandé :** ${s.supplier || 'N/A'}\n`;
      reply += `   * **Emplacement :** ${s.location || s.zone || 'Magasin'}\n`;
    });
    reply += `\n*Recommandation : Lancez une demande d'achat pour ces références afin d'éviter tout blocage sur le parc machine.*`;
    return reply;
  }

  // 3. Check for planning / maintenance / OT / preventive queries
  if (/maintenance|planning|prévis|préventif|intervention|ot|ordre/.test(text)) {
    const upcomingOTs = interventions.filter(i => 
      !/terminé|clôturé|annulé/i.test(i.status || '')
    );

    let reply = `**Planning & Maintenances Prévues (FabLab GMAO)**\n\n`;
    if (upcomingOTs.length > 0) {
      reply += `Il y a **${upcomingOTs.length} opération(s) de maintenance** planifiées ou en cours :\n\n`;
      upcomingOTs.forEach((ot, idx) => {
        reply += `${idx + 1}. **OT ${ot.otNumber || ot.id}** — ${ot.equipmentName || 'Équipement'} (${ot.maintenanceType || 'Intervention'})\n`;
        reply += `   * **Statut :** ${ot.status || 'Planifié'} (Priorité ${ot.priority || 'B'})\n`;
        reply += `   * **Technicien assigné :** ${ot.technician || 'Non assigné'}\n`;
        reply += `   * **Date prévue :** ${ot.plannedDate || ot.creationDate || 'Prochainement'}\n`;
        if (ot.description) reply += `   * **Description :** ${ot.description}\n`;
      });
    } else {
      reply += `Aucune intervention corrective ou préventive n'est actuellement en attente.\n\n`;
    }

    if (preventif && preventif.length > 0) {
      const activePrev = preventif.slice(0, 3);
      reply += `\n**Actions préventives AMDEC prioritaires :**\n`;
      activePrev.forEach((p: any) => {
        reply += `* **${p.machineName || p.title || 'Machine'}** : ${p.gamme || p.action || p.title} (${p.frequence || 'Mensuel'})\n`;
      });
    }
    return reply;
  }

  // 4. Daily Summary / Resume du jour
  if (/résumé|resume|synthèse|synthese|jour|aujourd'hui|bilan|général|general/.test(text)) {
    const broken = machines.filter(m => /panne|maintenance|hors service/i.test(m.status || '')).length;
    const critical = stock.filter(s => s.quantity <= (s.min ?? 5)).length;
    const pendingOT = interventions.filter(i => !/terminé|clôturé/i.test(i.status || '')).length;

    return `**Résumé du Jour — FabLab GMAO Intelligence System**\n\n` +
      `Voici la synthèse opérationnelle en direct du FabLab Universiapolis :\n\n` +
      `* **Parc Machine :** **${machines.length - broken}**/${machines.length} machines fonctionnelles (${broken} en panne/maintenance)\n` +
      `* **Gestion des Stocks :** **${critical}** article(s) sous le seuil critique\n` +
      `* **Ordres de Travail (OT) :** **${pendingOT}** intervention(s) en cours ou planifiée(s)\n\n` +
      `**Action suggérée :** Vous pouvez me poser des questions spécifiques sur l'état d'une machine, consulter le détail des stocks critiques ou générer un rapport de maintenance.`;
  }

  // Default intelligent response matching prompt or general guidance
  return `**Assistant IA GMAO FabLab**\n\n` +
    `Je suis votre assistant intelligent GMAO pour la gestion du FabLab. Voici les informations disponibles en direct :\n\n` +
    `* **Parc Machines :** ${machines.length} équipements répertoriés\n` +
    `* **Articles en Stock :** ${stock.length} références gérées\n` +
    `* **Interventions :** ${interventions.length} ordres de travail répertoriés\n\n` +
    `**Suggestions de questions :**\n` +
    `1. *"Quelles machines sont actuellement en panne ?"*\n` +
    `2. *"Quels composants sont en stock critique ?"*\n` +
    `3. *"Quelles maintenances sont prévues cette semaine ?"*\n` +
    `4. *"Résume-moi l'état du FabLab aujourd'hui."*`;
}
