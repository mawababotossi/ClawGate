/**
 * @license Apache-2.0
 * @geminiclaw/gateway — apiAuth middleware
 */
import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';

/**
 * Middleware requiring GEMINICLAW_API_TOKEN in Authorization: Bearer <token>
 */
export function requireApiToken(req: Request, res: Response, next: NextFunction): void {
    const expectedToken = process.env['GEMINICLAW_API_TOKEN'];

    if (!expectedToken) {
        if (process.env['NODE_ENV'] === 'production') {
            res.status(503).json({ error: 'GEMINICLAW_API_TOKEN not configured.' });
            return;
        }
        console.warn('[api/auth] WARNING: API is unprotected in dev mode!');
        next();
        return;
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing Authorization: Bearer <token>' });
        return;
    }

    const provided = Buffer.from(authHeader.slice(7));
    const expected = Buffer.from(expectedToken);

    // Padding for timingSafeEqual (identical lengths required)
    const maxLen = Math.max(provided.length, expected.length);
    const a = Buffer.concat([provided, Buffer.alloc(maxLen - provided.length)]);
    const b = Buffer.concat([expected, Buffer.alloc(maxLen - expected.length)]);

    if (!timingSafeEqual(a, b) || provided.length !== expected.length) {
        console.warn(`[api/auth] Bad token from ${req.ip}`);
        res.status(403).json({ error: 'Invalid API token' });
        return;
    }

    next();
}
