import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRoles } from '../middleware/auth';
import { cancelPendingAction, confirmPendingAction } from '../services/assistant-actions.service';
import { chat } from '../services/conversation.service';
import { rateLimit } from '../middleware/rate-limit';
import { readEntity } from '../services/json-store';
import type { AuthenticatedRequest } from '../types/auth';
import multer from 'multer';
import { transcribeAudio } from '../services/audio-transcription.service';

const router = Router();
router.use(authenticate, requireRoles('Superviseur'), rateLimit(20));
const audioUpload=multer({
  storage:multer.memoryStorage(),
  limits:{fileSize:8*1024*1024,files:1},
  fileFilter:(_req,file,done)=>done(null,['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav','audio/x-wav'].includes(file.mimetype.split(';')[0].toLowerCase())),
});

router.get('/debug', async (req, res) => {
  try {
    const { tools } = await import('../agent/tools.js');
    const { createResponse } = await import('../agent/model.js');
    const testRes = await createResponse({
      model: 'gpt-4o-mini',
      instructions: 'Test',
      input: [{ role: 'user', content: 'Crée une intervention' }],
      tools: tools.filter((t: any) => t.name === 'create_intervention'),
      tool_choice: 'auto'
    });
    return res.json({ status: 'ok', envModel: process.env.OPENAI_MODEL, testRes });
  } catch (err: any) {
    return res.json({ status: 'error', error: err.message, stack: err.stack });
  }
});
router.get('/actions', (req: AuthenticatedRequest, res) => res.json(readEntity<any[]>('assistant_pending_actions').filter(a => a.userId === String(req.user!.id) && a.status === 'pending' && new Date(a.expiresAt).getTime() > Date.now())));

const chatSchema = z.object({ message: z.string().trim().min(1).max(5000), conversationId: z.uuid().optional() }).strict();
router.post('/chat', async (req: AuthenticatedRequest, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Conversation invalide.' });
  try {
    return res.json(await chat(parsed.data.message, parsed.data.conversationId, req.user!));
  } catch (error) {
    console.error('[Assistant IA] demande échouée');
    return res.status(400).json({ error: error instanceof Error ? error.message : "Erreur de l'assistant IA." });
  }
});

router.post('/transcribe',(req,res,next)=>{
  audioUpload.single('audio')(req,res,error=>{
    if(error) return res.status(400).json({error:error instanceof multer.MulterError && error.code==='LIMIT_FILE_SIZE' ? 'Enregistrement trop long (8 Mo maximum).' : 'Format audio non pris en charge.'});
    next();
  });
},async (req: AuthenticatedRequest,res)=>{
  try {
    if(!req.file) return res.status(400).json({error:'Enregistrement audio requis.'});
    return res.json({text:await transcribeAudio(req.file.buffer,req.file.mimetype)});
  } catch(error) {
    console.error('[Assistant vocal] transcription échouée');
    return res.status(400).json({error:error instanceof Error ? error.message : 'Transcription impossible.'});
  }
});

router.post('/actions/:id/confirm', async (req: AuthenticatedRequest, res) => {
  try {
    if (req.body?.confirm !== true) return res.status(400).json({ error: 'Confirmation explicite requise.' });
    return res.json(await confirmPendingAction(String(req.params.id), req.user!));
  } catch (error) {
    return res.status(409).json({ error: error instanceof Error ? error.message : "Impossible de confirmer l'action." });
  }
});

router.post('/actions/:id/cancel', async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({ action: await cancelPendingAction(String(req.params.id), req.user!) });
  } catch (error) {
    return res.status(409).json({ error: error instanceof Error ? error.message : "Impossible d'annuler l'action." });
  }
});

export default router;
