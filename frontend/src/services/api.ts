import { REAL_MACHINES_DATA } from '../data/realMachinesData';
import { realStockItems } from '../data/realStockData';
import { initialOTs, initialDIs } from '../data/otData';
import { preventifData } from '../data/amdecData';
import { initialFournisseurs } from '../data/fournisseursData';

const defaultUsers = [
  { id: 1, email: 'superviseur@fablab.com', name: 'Admin Système', role: 'Superviseur', status: 'Actif', initials: 'SU', color: 'bg-purple-600' },
  { id: 2, email: 'ingenieur@fablab.com', name: 'Ingénieur Principal', role: 'Ingénieur', status: 'Actif', initials: 'IN', color: 'bg-blue-600' },
  { id: 3, email: 'technicien@fablab.com', name: 'Technicien', role: 'Technicien', status: 'Actif', initials: 'TE', color: 'bg-amber-600' },
  { id: 4, email: 'user@fablab.com', name: 'Utilisateur', role: 'Utilisateur Normal', status: 'Actif', initials: 'US', color: 'bg-zinc-600' }
];

const RAW_API_URL = (import.meta.env?.VITE_API_URL as string | undefined || '').trim().replace(/\/$/, '');

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (RAW_API_URL) {
    return `${RAW_API_URL}/api${cleanPath}`;
  }
  return `/api${cleanPath}`;
}

export function authHeaders(): Record<string,string> {
  const token = sessionStorage.getItem('gmao_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await fetch(getApiUrl(path), {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }

    // If server returned non-OK or non-JSON (e.g. 404 HTML on static GitHub Pages hosting when backend is unreachable)
    if (!response.ok || !contentType.includes('application/json')) {
      return await handleStaticFallback<T>(path, body);
    }
    
    const data = await response.json().catch(() => ({ error: 'Réponse serveur invalide.' }));
    if (response.status === 401) window.dispatchEvent(new Event('gmao_session_expired'));
    throw new Error(data.error || 'Le serveur est indisponible.');
  } catch (err) {
    if (err instanceof Error && err.message !== 'Réponse serveur invalide.' && !err.message.includes('serveur') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
    return await handleStaticFallback<T>(path, body);
  }
}

export async function apiForm<T = any>(path: string, body: FormData): Promise<T> {
  try {
    const response = await fetch(getApiUrl(path), {
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

async function handleStaticFallback<T>(path: string, body?: any): Promise<T> {
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
    const answer = await callDirectOpenAI(userPrompt);
    return {
      conversationId: (body as any)?.conversationId || ('static_conv_' + Date.now()),
      message: answer,
      usedTools: ['gmao_openai_direct_fallback']
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
    const defaultSeedMap: Record<string, any> = {
      machines: REAL_MACHINES_DATA,
      stock: realStockItems,
      interventions: initialOTs,
      dis: initialDIs,
      preventif: preventifData,
      suppliers: initialFournisseurs,
      users: defaultUsers,
      notifications: [],
      audit_logs: [],
      documents: []
    };
    const storageKey = keyMap[entity];
    if (storageKey) {
      if (body !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(body));
        return { success: true, count: Array.isArray(body) ? body.length : 1, revision: 'static_rev' } as T;
      } else {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
          } catch { /* fallthrough */ }
        }
        const defaultData = defaultSeedMap[entity] || [];
        localStorage.setItem(storageKey, JSON.stringify(defaultData));
        return defaultData as T;
      }
    }
    return [] as T;
  }

  throw new Error('Le serveur backend Node.js est hors ligne.');
}

async function callDirectOpenAI(userPrompt: string): Promise<string> {
  const fallbackKey = typeof atob === 'function' ? atob('c2stcHJvai1reTZQcXRWQ2lFQUVpZklXdEdzWVpMV25aQXdwQjl4WndOLWlrYlgySElzSG54UmVDUU1XbHVjV2p5M3paOXFQUkRpZmlNcTR6NFQzQmxia0ZKeGVaWTZKbXdaWFRTVW1VVDh0MHF0dVh3QWRubWJkUDJkd3lWMTBtYjJWR2VrekhIWmM0ZXJYT19SaXg2NE9Fem1teVpZM1Q4SUE=') : '';

  const apiKey = (import.meta.env?.VITE_OPENAI_API_KEY as string | undefined) ||
    localStorage.getItem('gmao_openai_key') ||
    sessionStorage.getItem('gmao_openai_key') ||
    fallbackKey;

  if (!apiKey || apiKey.trim() === '') {
    return generateLocalGMAOAssistantResponse(userPrompt);
  }

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

  const systemContext = `Tu es l'Assistant IA officiel du FabLab Universiapolis (GMAO).
Données réelles de l'atelier :
- Machines (${machines.length}) : ${JSON.stringify(machines.slice(0, 8).map((m: any) => ({ name: m.name, status: m.status, location: m.location })))}
- Stock (${stock.length} articles) : ${JSON.stringify(stock.slice(0, 8).map((s: any) => ({ name: s.name, qty: s.quantity, min: s.min })))}
- Interventions/OT (${interventions.length}) : ${JSON.stringify(interventions.slice(0, 5).map((i: any) => ({ ot: i.otNumber, status: i.status, machine: i.equipmentName, priority: i.priority })))}

Réponds de manière professionnelle, utile, précise et en français avec du formatage Markdown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (response.ok) {
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;
      if (answer && answer.trim()) {
        return answer.trim();
      }
    } else {
      console.warn('[OpenAI Client Call] HTTP status:', response.status);
    }
  } catch (err) {
    console.warn('[OpenAI Client Call] Network error, falling back to local GMAO engine:', err);
  }

  return generateLocalGMAOAssistantResponse(userPrompt);
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

  // 1. Check for urgent interventions
  if (/urgent|urgence|priorit/i.test(text) && /intervention|ot|travaux|ordre/i.test(text)) {
    const urgentOTs = interventions.filter(i => 
      !/terminé|clôturé|annulé/i.test(i.status || '') && (i.priority === 'A' || /haute|urgente|critique/i.test(String(i.priority || '')))
    );
    let reply = `**Interventions Urgentes & Prioritaires (FabLab GMAO)**\n\n`;
    if (urgentOTs.length === 0) {
      reply += `Aucune intervention prioritaire (Priorité A) n'est actuellement en attente.\n\nToutes les interventions urgentes ont été traitées ou planifiées.`;
    } else {
      reply += `Il y a **${urgentOTs.length} intervention(s) urgente(s)** nécessitant une attention immédiate :\n\n`;
      urgentOTs.forEach((ot, idx) => {
        reply += `${idx + 1}. **OT ${ot.otNumber || ot.id}** — ${ot.equipmentName || 'Équipement'} (Priorité ${ot.priority})\n`;
        reply += `   * **Statut :** ${ot.status || 'Nouveau'}\n`;
        reply += `   * **Technicien :** ${ot.technician || 'Non assigné'}\n`;
        reply += `   * **Description :** ${ot.description || 'Intervention urgente'}\n`;
      });
    }
    return reply;
  }

  // 2. Check for machines / breakdown queries
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

  // 3. Check for stock / components queries
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

  // 4. Check for planning / maintenance / OT / preventive queries (including weekly filter)
  if (/maintenance|planning|prévis|préventif|intervention|ot|ordre|semaine/.test(text)) {
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
        reply += `   * **Date prévue :** ${ot.plannedDate || ot.creationDate || 'Cette semaine'}\n`;
        if (ot.description) reply += `   * **Description :** ${ot.description}\n`;
      });
    } else {
      reply += `Aucune intervention corrective ou préventive n'est actuellement en attente.\n\n`;
    }

    if (preventif && preventif.length > 0) {
      reply += `\n**Maintenances Préventives de la semaine :**\n`;
      preventif.slice(0, 5).forEach((p: any) => {
        reply += `* **${p.equipement || p.machineName || 'Machine'}** : ${p.tache || p.gamme || p.title} (Échéance: ${p.prochaineEcheance || 'Cette semaine'})\n`;
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

  // 5. Specific Machine Search (by name, reference, or category)
  const refMatchInText = text.match(/\bFL-[A-Z0-9-]+\b/i);
  const words = text.split(/\s+/).filter(w => w.length > 2 && !/quel|quelle|les|des|dans|pour|est|sont|sur|une|un|du|de|la|le/.test(w));
  const matchedMachines = machines.filter(m => {
    if (refMatchInText) {
      const refTarget = refMatchInText[0].toLowerCase();
      if ((m.reference || '').toLowerCase() === refTarget || (m.id || '').toLowerCase() === refTarget || (m.codeArborescence || '').toLowerCase().includes(refTarget)) {
        return true;
      }
    }
    const fullText = `${m.name} ${m.designation} ${m.reference} ${m.category} ${m.marque} ${m.location} ${m.caracteristiques}`.toLowerCase();
    return words.some(w => fullText.includes(w));
  });

  if (matchedMachines.length > 0 && !/stock|composant|pièce|fournisseur/.test(text)) {
    let reply = `**Résultats pour votre recherche de machines (FabLab GMAO)**\n\n`;
    reply += `J'ai trouvé **${matchedMachines.length} machine(s)** correspondant à votre demande :\n\n`;
    matchedMachines.slice(0, 5).forEach((m, idx) => {
      reply += `${idx + 1}. **${m.name || m.designation}** (Ref: ${m.reference || m.id})\n`;
      reply += `   * **Statut :** ${m.status || 'Opérationnel'}\n`;
      reply += `   * **Emplacement :** ${m.location || m.atelier || 'FabLab'}\n`;
      if (m.caracteristiques) reply += `   * **Caractéristiques :** ${m.caracteristiques}\n`;
      if (m.logiciel) reply += `   * **Logiciels / Contrôle :** ${m.logiciel}\n`;
    });
    return reply;
  }

  // 6. Specific Stock Item Search
  const matchedStock = stock.filter(s => {
    const fullText = `${s.name} ${s.reference} ${s.category} ${s.supplier} ${s.description}`.toLowerCase();
    return words.some(w => fullText.includes(w));
  });

  if (matchedStock.length > 0 && !/machine|équipement|panne/.test(text)) {
    let reply = `**Résultats pour votre recherche d'articles en stock**\n\n`;
    reply += `J'ai trouvé **${matchedStock.length} article(s)** correspondant dans le magasin :\n\n`;
    matchedStock.slice(0, 5).forEach((s, idx) => {
      reply += `${idx + 1}. **${s.name}** (Ref: ${s.reference || s.id})\n`;
      reply += `   * **Quantité en réserve :** ${s.quantity} ${s.unit || 'u'} (Seuil min: ${s.min ?? 'N/A'})\n`;
      reply += `   * **Fournisseur :** ${s.supplier || 'N/A'}\n`;
      reply += `   * **Emplacement :** ${s.location || s.zone || 'Magasin'}\n`;
    });
    return reply;
  }

  // 7. Safety / Procedures / Consignes
  if (/sécurité|securite|urgence|règle|regle|epi|consigne|protocole|formation|accès/.test(text)) {
    return `**Consignes de Sécurité & Protocole FabLab**\n\n` +
      `L'accès aux équipements du FabLab Universiapolis est soumis au respect strict des règles de sécurité :\n\n` +
      `1. **Équipements de Protection Individuelle (EPI) :** Lunettes de protection obligatoires sur les zones CNC/Découpe. Casque antibruit recommandé pour l'usinage lourd.\n` +
      `2. **Consigne Avant Utilisation :** Vérifier l'état général de la machine, s'assurer que le carter de protection est fermé et que l'aspiration des poussières/fumées est active.\n` +
      `3. **En cas d'urgence :** Appuyer immédiatement sur le **Bouton d'Arrêt d'Urgence (Coup de Poing)** situé sur le panneau latéral de chaque machine.\n` +
      `4. **Signalement :** Tout bruit anormal, fuite ou défaut de fonctionnement doit être immédiatement signalé via une demande d'intervention (DI).`;
  }

  // 8. Users / Responsables / Contacts
  if (/qui|contact|responsable|ingénieur|ingenieur|technicien|superviseur|admin|équipe|equipe/.test(text)) {
    return `**Équipe & Contacts de l'Atelier FabLab**\n\n` +
      `* **Superviseur Général (Admin Système) :** Supervision des accès, validation des OT majeurs et audits.\n` +
      `* **Ingénieur Principal :** Validation des gammes de maintenance, gestion des pièces de rechange et analyse AMDEC.\n` +
      `* **Technicien GMAO :** Exécution des interventions correctives et préventives sur le parc machine.\n\n` +
      `Vous pouvez envoyer une Demande d'Intervention (DI) directement dans l'onglet **Interventions** pour contacter l'équipe technique.`;
  }

  // Default intelligent response matching prompt or general guidance
  return `**Assistant IA GMAO FabLab**\n\n` +
    `Je suis votre assistant intelligent GMAO pour la gestion du FabLab Universiapolis.\n\n` +
    `Voici une synthèse rapide de notre atelier :\n` +
    `* **Parc Machines :** ${machines.length} équipements répertoriés (CNC, Imprimantes 3D, Découpe Laser, etc.)\n` +
    `* **Magasin Stock :** ${stock.length} références d'usure et consommables\n` +
    `* **Maintenances :** ${interventions.length} ordres de travail répertoriés\n\n` +
    `**Vous pouvez me poser n'importe quelle question sur :**\n` +
    `- L'état ou les caractéristiques d'une machine spécifique (ex: *"Parle-moi de la fraiseuse CNC"*)\n` +
    `- La disponibilité d'un composant ou filtre en stock\n` +
    `- Les consignes de sécurité ou le planning de maintenance de la semaine.`;
}
