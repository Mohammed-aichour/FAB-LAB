"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const json_store_1 = require("../services/json-store");
const rate_limit_1 = require("../middleware/rate-limit");
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1).max(256) });
router.post('/login', (0, rate_limit_1.rateLimit)(10), async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: 'Identifiants invalides.' });
    const users = (0, json_store_1.readEntity)('users');
    const user = users.find((candidate) => candidate.email.toLowerCase() === parsed.data.email.toLowerCase());
    const credential = (0, json_store_1.readEntity)('credentials').find(c => c.userId === String(user?.id));
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
        return res.status(503).json({ error: 'JWT_SECRET doit être configuré sur le serveur.' });
    if (!user || !credential || user.status !== 'Actif' || !(await bcryptjs_1.default.compare(parsed.data.password, credential.hash))) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    return res.json({ token: (0, auth_1.signAccessToken)(user), user });
});
router.get('/me', auth_1.authenticate, (req, res) => res.json({ user: req.user }));
exports.default = router;
