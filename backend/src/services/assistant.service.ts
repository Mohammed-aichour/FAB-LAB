import { createPendingAction, MUTATION_TOOL_NAMES, type MutationToolName } from './assistant-actions.service';
import { legacyReadTool } from './gmao-read.service';
import { tools } from '../agent/tools';
import { extraTools, extraRead, readSchemas } from '../agent/extra-tools';
import { createResponse, type ModelClient } from '../agent/model';
import { systemInstructions } from '../agent/instructions';
import type { AuthenticatedUser } from '../types/auth';
export type ChatMessage = { role: 'user' | 'assistant'; content: string };
export const allTools = [...tools, ...extraTools];
const actionPattern = /\b(mets?|mettre|passe|passer|ajoute|ajouter|cr[ée]e|cr[ée]er|modifie|modifier|change|changer|affecte|affecter|assigne|assigner|planifie|planifier|commande|commander|pr[ée]pare|pr[ée]parer|ajuste|ajuster|d[ée]clare|d[ée]clarer|supprime|supprimer|annule|annuler|approuve|approuver|r[ée]ceptionne|r[ée]ceptionner)\b/i;
export function selectTools(messages: ChatMessage[]) {
  const lastUserMessage = [...messages].reverse().find(message => message.role === 'user')?.content || '';
  const mutation = actionPattern.test(lastUserMessage);
  const selected = allTools.filter(tool => mutation === MUTATION_TOOL_NAMES.has(tool.name as MutationToolName));
  return { mutation, tools: selected };
}
export function readTool(name: string, raw: unknown) {
  const schema = readSchemas[name as keyof typeof readSchemas];
  if (!schema) throw new Error('Outil de lecture non autorisé.');
  const args = schema.parse(raw);
  const result = tools.some(t => t.name === name) ? legacyReadTool(name,args) : extraRead(name,args);
  return Array.isArray(result) ? { total: result.length, items: result.slice(0,100), truncated: result.length > 100 } : result;
}
export async function runAssistant(messages: ChatMessage[], user: AuthenticatedUser, model: ModelClient = createResponse) {
  if (user.role !== 'Superviseur' || user.status !== 'Actif') throw new Error('Accès réservé au superviseur.');
  const input: any[] = messages.slice(-24);
  const usedTools: string[] = [];
  const selected = selectTools(messages);
  for (let turn = 0; turn < 8; turn++) {
    const validModels = new Set(['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo']);
    const envModel = (process.env.OPENAI_MODEL || '').trim();
    const currentModel = validModels.has(envModel) ? envModel : 'gpt-4o-mini';
    const request: Record<string, any> = {
      model: currentModel,
      instructions: systemInstructions(),
      input,
      tools: selected.tools,
      tool_choice: turn === 0 && !selected.mutation ? 'required' : 'auto',
      parallel_tool_calls: false,
      store: false,
      max_output_tokens: 2048
    };
    if (/^o1|^o3/i.test(currentModel)) {
      request.reasoning = { effort: 'none' };
    }
    let response = await model(request);
    let hasUsableOutput = (response.output || []).some((item: any) => item.type === 'function_call' || item.type === 'message');
    if (response.status === 'incomplete' && !hasUsableOutput && response.incomplete_details?.reason === 'max_output_tokens') {
      response = await model({ ...request, max_output_tokens: 4096 });
      hasUsableOutput = (response.output || []).some((item: any) => item.type === 'function_call' || item.type === 'message');
    }
    if (response.status === 'incomplete' && !hasUsableOutput) {
      console.error('[Assistant incomplete]', { details: response.incomplete_details, outputTypes: (response.output || []).map((item: any) => item.type), usage: response.usage });
      throw new Error('Le modèle n’a pas terminé sa réponse. Réessayez avec une question plus courte.');
    }
    const calls = (response.output || []).filter((item: any) => item.type === 'function_call');
    if (!calls.length) {
      const message = (response.output || []).filter((item: any) => item.type === 'message').flatMap((item: any) => item.content || []).filter((part: any) => part.type === 'output_text').map((part: any) => part.text).join('\n').trim();
      return { message: message || 'Je n’ai pas cette information dans les données actuelles de la GMAO.', usedTools };
    }
    // Replay full output items for stateless Responses, including reasoning.
    input.push(...response.output);
    for (const call of calls) {
      let result: unknown;
      try {
        if (!selected.tools.some(t => t.name === call.name)) throw new Error('Outil non autorisé pour cette demande.');
        const args = JSON.parse(call.arguments || '{}');
        if (MUTATION_TOOL_NAMES.has(call.name)) {
          const clean = Object.fromEntries(Object.entries(args).filter(([,v]) => v !== null));
          const pendingAction = createPendingAction(call.name as MutationToolName, clean, user);
          return { message: 'Vérifiez les détails. Cette action nécessite votre confirmation et n’a pas encore été exécutée.', pendingAction, usedTools: [...usedTools,call.name] };
        }
        result = readTool(call.name,args);
        usedTools.push(call.name);
      } catch (error) {
        result = { error: error instanceof Error ? error.message : 'Données invalides.' };
      }
      input.push({ type: 'function_call_output', call_id: call.call_id, output: JSON.stringify(result) });
    }
  }
  throw new Error('La demande nécessite trop d’étapes. Précisez une machine ou une référence.');
}
