"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const assistant_actions_service_1 = require("../services/assistant-actions.service");
const conversation_service_1 = require("../services/conversation.service");
const rate_limit_1 = require("../middleware/rate-limit");
const json_store_1 = require("../services/json-store");
const multer_1 = __importDefault(require("multer"));
const audio_transcription_service_1 = require("../services/audio-transcription.service");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRoles)('Superviseur'), (0, rate_limit_1.rateLimit)(20));
const audioUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, done) => done(null, ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.mimetype.split(';')[0].toLowerCase())),
});
router.get('/debug', async (req, res) => {
    try {
        const { tools } = await import('../agent/tools.js');
        const { createResponse } = await import('../agent/model.js');
        const testRes = await createResponse({
            model: 'gpt-4o-mini',
            instructions: 'Test',
            input: [{ role: 'user', content: 'Crée une intervention' }],
            tools: tools.filter((t) => t.name === 'create_intervention'),
            tool_choice: 'auto'
        });
        return res.json({ status: 'ok', envModel: process.env.OPENAI_MODEL, testRes });
    }
    catch (err) {
        return res.json({ status: 'error', error: err.message, stack: err.stack });
    }
});
router.get('/actions', (req, res) => res.json((0, json_store_1.readEntity)('assistant_pending_actions').filter(a => a.userId === String(req.user.id) && a.status === 'pending' && new Date(a.expiresAt).getTime() > Date.now())));
const chatSchema = zod_1.z.object({ message: zod_1.z.string().trim().min(1).max(5000), conversationId: zod_1.z.uuid().optional() }).strict();
router.post('/chat', async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Conversation invalide.' });
    try {
        return res.json(await (0, conversation_service_1.chat)(parsed.data.message, parsed.data.conversationId, req.user));
    }
    catch (error) {
        console.error('[Assistant IA] demande échouée');
        return res.status(400).json({ error: error instanceof Error ? error.message : "Erreur de l'assistant IA." });
    }
});
router.post('/transcribe', (req, res, next) => {
    audioUpload.single('audio')(req, res, error => {
        if (error)
            return res.status(400).json({ error: error instanceof multer_1.default.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 'Enregistrement trop long (8 Mo maximum).' : 'Format audio non pris en charge.' });
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'Enregistrement audio requis.' });
        return res.json({ text: await (0, audio_transcription_service_1.transcribeAudio)(req.file.buffer, req.file.mimetype) });
    }
    catch (error) {
        console.error('[Assistant vocal] transcription échouée');
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Transcription impossible.' });
    }
});
router.post('/actions/:id/confirm', async (req, res) => {
    try {
        if (req.body?.confirm !== true)
            return res.status(400).json({ error: 'Confirmation explicite requise.' });
        return res.json(await (0, assistant_actions_service_1.confirmPendingAction)(String(req.params.id), req.user));
    }
    catch (error) {
        return res.status(409).json({ error: error instanceof Error ? error.message : "Impossible de confirmer l'action." });
    }
});
router.post('/actions/:id/cancel', async (req, res) => {
    try {
        return res.json({ action: await (0, assistant_actions_service_1.cancelPendingAction)(String(req.params.id), req.user) });
    }
    catch (error) {
        return res.status(409).json({ error: error instanceof Error ? error.message : "Impossible d'annuler l'action." });
    }
});
exports.default = router;
