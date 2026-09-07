import type { RequestHandler } from 'express';
export function rateLimit(max: number, windowMs = 60_000): RequestHandler {
  const hits = new Map<string,{ count: number; reset: number }>();
  return (req,res,next) => {
    const now = Date.now();
    for (const [key,value] of hits) if (value.reset <= now) hits.delete(key);
    const key = req.ip || 'unknown';
    const hit = hits.get(key) || { count: 0, reset: now + windowMs };
    hits.set(key,hit);
    if (++hit.count > max) { res.status(429).json({error:'Trop de demandes. Réessayez dans une minute.'}); return; }
    next();
  };
}
