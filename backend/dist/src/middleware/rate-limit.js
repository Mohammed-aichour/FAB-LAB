"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
function rateLimit(max, windowMs = 60_000) {
    const hits = new Map();
    return (req, res, next) => {
        const now = Date.now();
        for (const [key, value] of hits)
            if (value.reset <= now)
                hits.delete(key);
        const key = req.ip || 'unknown';
        const hit = hits.get(key) || { count: 0, reset: now + windowMs };
        hits.set(key, hit);
        if (++hit.count > max) {
            res.status(429).json({ error: 'Trop de demandes. Réessayez dans une minute.' });
            return;
        }
        next();
    };
}
