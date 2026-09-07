import { Router } from 'express';
import crypto from 'crypto';
import { authenticate, requireRoles } from '../middleware/auth';
import { appendAudit } from '../services/audit.service';
import { isEntityName, readEntity, withWriteLock, writeEntity } from '../services/json-store';
import type { AuthenticatedRequest } from '../types/auth';
import { suppliers } from '../services/purchasing.service';

const router = Router();
const publicEntities = new Set(['machines', 'stock', 'interventions', 'dis', 'preventif', 'amdec', 'suppliers', 'notifications', 'users', 'audit_logs', 'orders', 'documents']);
const writeRoles: Record<string, string[]> = {
  machines: ['Superviseur', 'Ingénieur'],
  stock: ['Superviseur', 'Ingénieur', 'Technicien'],
  interventions: ['Superviseur', 'Ingénieur', 'Technicien'],
  dis: ['Superviseur', 'Ingénieur', 'Technicien'],
  preventif: ['Superviseur', 'Ingénieur', 'Technicien'],
  suppliers: ['Superviseur', 'Ingénieur'],
  notifications: ['Superviseur', 'Ingénieur', 'Technicien'],
  users: ['Superviseur'],
  documents: ['Superviseur', 'Ingénieur', 'Technicien'],
};

router.use(authenticate);

const revision = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
router.get('/:entity', (req: AuthenticatedRequest, res) => {
  const entity = String(req.params.entity);
  if (!isEntityName(entity) || !publicEntities.has(entity)) return res.status(404).json({ error: 'Entité inconnue.' });
  if (['users','audit_logs'].includes(entity) && req.user!.role !== 'Superviseur') return res.status(403).json({error:'Accès réservé au superviseur.'});
  res.setHeader('X-Data-Revision', revision(readEntity(entity)));
  return res.json(entity === 'suppliers' ? suppliers() : readEntity(entity));
});

router.post('/:entity', async (req: AuthenticatedRequest, res) => {
  const entity = String(req.params.entity);
  if (!isEntityName(entity) || !writeRoles[entity]) return res.status(404).json({ error: 'Entité inconnue.' });
  const allowed = requireRoles(...writeRoles[entity]);
  let denied = false;
  allowed(req, { status: (code: number) => ({ json: (body: unknown) => { denied = true; res.status(code).json(body); } }) } as any, () => undefined);
  if (denied) return;
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Un tableau JSON est requis.' });
  if (req.body.length > 10000 || req.body.some((r: any) => !r || typeof r !== 'object' || !['string','number'].includes(typeof r.id))) return res.status(400).json({error:'Enregistrements invalides.'});
  if (new Set(req.body.map((r: any) => String(r.id))).size !== req.body.length) return res.status(400).json({error:'Identifiants dupliqués.'});
  if (entity === 'stock' && req.body.some((r: any) => !Number.isFinite(r.quantity) || r.quantity < 0)) return res.status(400).json({error:'Quantité de stock invalide.'});
  if (entity === 'users' && req.body.some((r: any) => !['Superviseur','Ingénieur','Technicien','Utilisateur Normal'].includes(r.role) || !['Actif','Inactif'].includes(r.status))) return res.status(400).json({error:'Rôle ou statut invalide.'});

  return withWriteLock(() => {
    const previous = readEntity(entity);
    if (req.header('X-Data-Revision') !== revision(previous)) return res.status(409).json({error:'Les données ont changé. Rechargez avant de modifier.'});
    writeEntity(entity, req.body);
    appendAudit(req.user!, 'Mise à jour manuelle', entity, null, previous, req.body, crypto.randomUUID());
    return res.json({ success: true, entity, count: req.body.length, revision: revision(req.body) });
  });
});

export default router;
