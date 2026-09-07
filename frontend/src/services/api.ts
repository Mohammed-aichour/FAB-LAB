export function authHeaders(): Record<string,string> {
  const token = sessionStorage.getItem('gmao_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json().catch(() => ({error:'Réponse serveur invalide.'}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('gmao_session_expired'));
    throw new Error(data.error || 'Le serveur est indisponible.');
  }
  return data;
}

export async function apiForm<T = any>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  });
  const data = await response.json().catch(() => ({error:'Réponse serveur invalide.'}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('gmao_session_expired'));
    throw new Error(data.error || 'Le serveur est indisponible.');
  }
  return data;
}
