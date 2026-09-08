"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const audio_transcription_service_js_1 = require("../src/services/audio-transcription.service.js");
(0, node_test_1.default)('la transcription audio envoie un fichier contrôlé et retourne le texte', async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    const previousModel = process.env.OPENAI_TRANSCRIPTION_MODEL;
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.OPENAI_TRANSCRIPTION_MODEL;
    try {
        const fakeFetch = async (_url, init) => {
            strict_1.default.equal((init?.headers).Authorization, 'Bearer test-key');
            const form = init?.body;
            strict_1.default.equal(form.get('model'), 'gpt-4o-mini-transcribe');
            strict_1.default.equal(form.get('language'), 'fr');
            const file = form.get('file');
            strict_1.default.equal(file.type, 'audio/webm');
            strict_1.default.equal(file.name, 'demande-vocale.webm');
            return new Response(JSON.stringify({ text: 'État de la CNC 01' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        };
        const result = await (0, audio_transcription_service_js_1.transcribeAudio)(new Uint8Array([1, 2, 3]), 'audio/webm;codecs=opus', fakeFetch);
        strict_1.default.equal(result, 'État de la CNC 01');
    }
    finally {
        if (previousKey === undefined)
            delete process.env.OPENAI_API_KEY;
        else
            process.env.OPENAI_API_KEY = previousKey;
        if (previousModel === undefined)
            delete process.env.OPENAI_TRANSCRIPTION_MODEL;
        else
            process.env.OPENAI_TRANSCRIPTION_MODEL = previousModel;
    }
});
(0, node_test_1.default)('la transcription refuse un format audio non autorisé', async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'test-key';
    try {
        await strict_1.default.rejects((0, audio_transcription_service_js_1.transcribeAudio)(new Uint8Array([1]), 'application/octet-stream'), /Format audio non pris en charge/);
    }
    finally {
        if (previousKey === undefined)
            delete process.env.OPENAI_API_KEY;
        else
            process.env.OPENAI_API_KEY = previousKey;
    }
});
