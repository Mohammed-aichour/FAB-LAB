"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudio = transcribeAudio;
const extensions = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
};
async function transcribeAudio(audio, mimeType, request = fetch) {
    if (!process.env.OPENAI_API_KEY)
        throw new Error("OPENAI_API_KEY n'est pas configurée sur le serveur.");
    if (!audio.byteLength)
        throw new Error('Enregistrement audio vide.');
    const normalizedType = mimeType.split(';')[0].toLowerCase();
    const extension = extensions[normalizedType];
    if (!extension)
        throw new Error('Format audio non pris en charge.');
    const form = new FormData();
    const audioBuffer = Uint8Array.from(audio).buffer;
    form.append('file', new Blob([audioBuffer], { type: normalizedType }), `demande-vocale.${extension}`);
    form.append('model', process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe');
    form.append('language', 'fr');
    form.append('response_format', 'json');
    const response = await request('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(45_000),
    });
    const result = await response.json();
    if (!response.ok) {
        const code = String(result.error?.code || '');
        console.error('[OpenAI Audio]', { status: response.status, code });
        if (response.status === 401)
            throw new Error('La clé OpenAI configurée est invalide ou révoquée.');
        if (response.status === 429 && code === 'insufficient_quota')
            throw new Error('Le compte OpenAI ne dispose pas de quota audio disponible.');
        if (response.status === 429)
            throw new Error('Limite de transcription atteinte. Réessayez dans quelques instants.');
        throw new Error('La transcription vocale a échoué. Réessayez.');
    }
    const text = String(result.text || '').trim();
    if (!text)
        throw new Error('Aucune parole n’a été détectée.');
    return text.slice(0, 5000);
}
