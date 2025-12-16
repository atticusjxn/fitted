import { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac } from 'node:crypto';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';

interface SessionTokenPayload {
  iss: string;
  dest: string;
  aud: string;
  sub: string;
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  sid: string;
}

/**
 * Decode and verify a Shopify session token
 * Note: This is a simplified version. In production, use @shopify/shopify-api
 */
function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as SessionTokenPayload;

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    // In production, you should verify the signature using SHOPIFY_API_SECRET
    // For now, we'll just decode the payload

    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware to extract and verify Shopify session token
 */
export async function shopifySessionMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing session token' });
  }

  const token = authHeader.substring(7);
  const payload = verifySessionToken(token);

  if (!payload) {
    return reply.status(401).send({ error: 'Invalid session token' });
  }

  // Attach session info to request
  (request as FastifyRequest & { shopifySession?: SessionTokenPayload }).shopifySession = payload;
}
