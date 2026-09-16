"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../middleware/auth");
const audit_service_1 = require("../services/audit.service");
const json_store_1 = require("../services/json-store");
const purchasing_service_1 = require("../services/purchasing.service");
const router = (0, express_1.Router)();
const publicEntities = new Set(['machines', 'stock', 'interventions', 'dis', 'preventif', 'amdec', 'suppliers', 'notifications', 'users', 'audit_logs', 'orders', 'documents']);
const writeRoles = {
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
router.use(auth_1.authenticate);
const revision = (value) => crypto_1.default.createHash('sha256').update(JSON.stringify(value)).digest('hex');
router.get('/:entity', (req, res) => {
    const entity = String(req.params.entity);
    if (!(0, json_store_1.isEntityName)(entity) || !publicEntities.has(entity))
        return res.status(404).json({ error: 'Entité inconnue.' });
    if (['users', 'audit_logs'].includes(entity) && req.user.role !== 'Superviseur')
        return res.status(403).json({ error: 'Accès réservé au superviseur.' });
    res.setHeader('X-Data-Revision', revision((0, json_store_1.readEntity)(entity)));
    return res.json(entity === 'suppliers' ? (0, purchasing_service_1.suppliers)() : (0, json_store_1.readEntity)(entity));
});
router.post('/:entity', async (req, res) => {
    const entity = String(req.params.entity);
    if (!(0, json_store_1.isEntityName)(entity) || !writeRoles[entity])
        return res.status(404).json({ error: 'Entité inconnue.' });
    const allowed = (0, auth_1.requireRoles)(...writeRoles[entity]);
    let denied = false;
    allowed(req, { status: (code) => ({ json: (body) => { denied = true; res.status(code).json(body); } }) }, () => undefined);
    if (denied)
        return;
    if (!Array.isArray(req.body))
        return res.status(400).json({ error: 'Un tableau JSON est requis.' });
    if (req.body.length > 10000 || req.body.some((r) => !r || typeof r !== 'object' || !['string', 'number'].includes(typeof r.id)))
        return res.status(400).json({ error: 'Enregistrements invalides.' });
    if (new Set(req.body.map((r) => String(r.id))).size !== req.body.length)
        return res.status(400).json({ error: 'Identifiants dupliqués.' });
    if (entity === 'stock' && req.body.some((r) => !Number.isFinite(r.quantity) || r.quantity < 0))
        return res.status(400).json({ error: 'Quantité de stock invalide.' });
    if (entity === 'users' && req.body.some((r) => !['Superviseur', 'Ingénieur', 'Technicien', 'Utilisateur Normal'].includes(r.role) || !['Actif', 'Inactif'].includes(r.status)))
        return res.status(400).json({ error: 'Rôle ou statut invalide.' });
    return (0, json_store_1.withWriteLock)(() => {
        const previous = (0, json_store_1.readEntity)(entity);
        if (req.header('X-Data-Revision') !== revision(previous))
            return res.status(409).json({ error: 'Les données ont changé. Rechargez avant de modifier.' });
        (0, json_store_1.writeEntity)(entity, req.body);
        (0, audit_service_1.appendAudit)(req.user, 'Mise à jour manuelle', entity, null, previous, req.body, crypto_1.default.randomUUID());
        return res.json({ success: true, entity, count: req.body.length, revision: revision(req.body) });
    });
});
exports.default = router;
