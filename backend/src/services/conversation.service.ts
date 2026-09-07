import crypto from 'crypto';
import { readEntity, writeEntity } from './json-store';
import type { AuthenticatedUser } from '../types/auth';
import { runAssistant, type ChatMessage } from './assistant.service';
type Conversation = { id: string; userId: string; messages: ChatMessage[]; updatedAt: number };
const busy = new Set<string>();
export function getConversation(id: string, user: AuthenticatedUser) {
  const c = readEntity<Conversation[]>('assistant_conversations').find(c => c.id === id && c.userId === String(user.id));
  if (!c || Date.now() - c.updatedAt > 24*3600_000) throw new Error('Conversation expirée ou inaccessible.');
  return c;
}
export async function chat(message: string, id: string | undefined, user: AuthenticatedUser) {
  const key = String(user.id);
  if (busy.has(key)) throw new Error('Une demande est déjà en cours.');
  busy.add(key);
  try {
    const c = id ? getConversation(id,user) : { id: crypto.randomUUID(), userId: key, messages: [], updatedAt: Date.now() };
    const messages: ChatMessage[] = [...c.messages, { role: 'user', content: message }];
    const result = await runAssistant(messages,user);
    c.messages = [...messages, { role: 'assistant', content: result.message + (result.pendingAction ? '\nAction proposée : '+JSON.stringify({ summary: result.pendingAction.summary, details: result.pendingAction.newValue }) : '') }].slice(-24) as ChatMessage[];
    c.updatedAt = Date.now();
    const list = readEntity<Conversation[]>('assistant_conversations').filter(x => x.id !== c.id && Date.now()-x.updatedAt < 24*3600_000);
    writeEntity('assistant_conversations',[c,...list].slice(0,500));
    return { ...result, conversationId: c.id };
  } finally { busy.delete(key); }
}
