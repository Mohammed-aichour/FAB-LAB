"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = void 0;
exports.signAccessToken = signAccessToken;
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const json_store_1 = require("../services/json-store");
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        return 'supersecret_jwt_key_for_dev_only_32chars_min';
    }
    return secret;
};
function signAccessToken(user) {
    return jsonwebtoken_1.default.sign({ sub: String(user.id), email: user.email }, getJwtSecret(), { expiresIn: '8h' });
}
function authenticate(req, res, next) {
    try {
        const header = req.header('authorization');
        if (!header?.startsWith('Bearer '))
            return res.status(401).json({ error: 'Authentification requise.' });
        const decoded = jsonwebtoken_1.default.verify(header.slice(7), getJwtSecret());
        const users = (0, json_store_1.readEntity)('users');
        const user = users.find((candidate) => String(candidate.id) === decoded.sub && candidate.status === 'Actif');
        if (!user)
            return res.status(401).json({ error: 'Session invalide ou utilisateur désactivé.' });
        req.user = user;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Session invalide ou expirée.' });
    }
}
const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Vous ne disposez pas des autorisations nécessaires.' });
    }
    next();
};
exports.requireRoles = requireRoles;
