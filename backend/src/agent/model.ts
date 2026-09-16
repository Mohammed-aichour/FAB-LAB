export type ModelResponse = Record<string, any>;
export type ModelClient = (body: ModelResponse) => Promise<ModelResponse>;

async function callOpenAiWithKey(apiKey: string, body: ModelResponse): Promise<ModelResponse> {
  const chatModel = /^gpt-4o/i.test(body.model) ? body.model : 'gpt-4o-mini';
  const chatMessages: any[] = [];
  if (body.instructions) chatMessages.push({ role: 'system', content: body.instructions });
  if (Array.isArray(body.input)) {
    for (const item of body.input) {
      if (item.type === 'function_call_output') {
        chatMessages.push({ role: 'tool', tool_call_id: item.call_id, content: String(item.output) });
      } else if (item.type === 'function_call') {
        chatMessages.push({ role: 'assistant', tool_calls: [{ id: item.call_id, type: 'function', function: { name: item.name, arguments: item.arguments } }] });
      } else if (item.role === 'user' || item.role === 'assistant' || item.role === 'system') {
        chatMessages.push(item);
      }
    }
  }

  const chatPayload: Record<string, any> = {
    model: chatModel,
    messages: chatMessages,
    max_tokens: body.max_output_tokens || 2048,
  };
  if (Array.isArray(body.tools) && body.tools.length > 0) {
    chatPayload.tools = body.tools.map((t: any) => {
      const fn = t.function || (t.name ? t : null);
      if (!fn) return t;
      const parameters = JSON.parse(JSON.stringify(fn.parameters || {}));
      delete parameters.$schema;
      delete parameters.additionalProperties;
      return {
        type: 'function',
        function: {
          name: fn.name,
          description: fn.description,
          parameters
        }
      };
    });
    chatPayload.tool_choice = body.tool_choice || 'auto';
  }

  const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(chatPayload), signal: AbortSignal.timeout(45_000),
  });

  const chatData = await chatRes.json() as any;
  if (!chatRes.ok) {
    const code = String(chatData.error?.code || '');
    const msg = String(chatData.error?.message || '');
    console.error('[OpenAI API /v1/chat/completions error]', { status: chatRes.status, code, message: msg });
    if (chatRes.status === 401) throw new Error('La clé OpenAI configurée est invalide ou révoquée.');
    if (chatRes.status === 429 && code === 'insufficient_quota') throw new Error('Le compte OpenAI ne dispose pas de quota API disponible.');
    if (chatRes.status === 404) throw new Error(`Le modèle « ${chatModel} » n’est pas disponible.`);
    throw new Error(`OpenAI API error (${chatRes.status} / ${code || 'no_code'}): ${msg || 'Erreur inconnue'}`);
  }

  const msg = chatData.choices?.[0]?.message;
  const output: any[] = [];
  if (msg?.tool_calls?.length) {
    for (const tc of msg.tool_calls) {
      output.push({
        type: 'function_call',
        call_id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments || '{}'
      });
    }
  } else if (msg?.content) {
    output.push({
      type: 'message',
      content: [{ type: 'output_text', text: msg.content }]
    });
  }

  return { status: 'completed', output };
}

export const createResponse: ModelClient = async body => {
  const envKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!envKey) {
    throw new Error("Clé API OpenAI non configurée sur le serveur. Veuillez définir OPENAI_API_KEY dans les variables d'environnement du serveur.");
  }
  return await callOpenAiWithKey(envKey, body);
};
