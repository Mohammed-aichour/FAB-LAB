"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = void 0;
const createResponse = async (body) => {
    if (!process.env.OPENAI_API_KEY)
        throw new Error("OPENAI_API_KEY n'est pas configurée sur le serveur.");
    const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: AbortSignal.timeout(45_000),
    });
    const data = await response.json();
    if (!response.ok) {
        const code = String(data.error?.code || '');
        console.error('[OpenAI API]', { status: response.status, code, type: data.error?.type, param: data.error?.param, message: data.error?.message });
        if (response.status === 401)
            throw new Error('La clé OpenAI configurée est invalide ou révoquée.');
        if (response.status === 429 && code === 'insufficient_quota')
            throw new Error('Le compte OpenAI ne dispose pas de quota API disponible. Vérifiez la facturation et les limites du projet API.');
        if (response.status === 429)
            throw new Error('Limite de requêtes OpenAI atteinte. Réessayez dans quelques instants.');
        if (response.status === 404)
            throw new Error(`Le modèle « ${body.model} » n’est pas disponible pour ce projet OpenAI.`);
        if (response.status === 400)
            throw new Error(`La configuration du modèle OpenAI est incompatible avec cette demande (${data.error?.message || 'bad request'}).`);
        throw new Error(`Service IA indisponible (${response.status}). Réessayez plus tard.`);
    }
    if (!Array.isArray(data.output))
        throw new Error('Réponse OpenAI invalide. Réessayez.');
    return data;
};
exports.createResponse = createResponse;
