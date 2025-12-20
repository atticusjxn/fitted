import crypto from 'node:crypto';
import { env } from '../env.js';

export interface SessionTokenPayload {
  iss: string; // https://{shop}/admin
  dest: string; // https://{shop}
  aud: string; // API key
  sub: string; // User ID
  exp: number; // Expiration timestamp
  nbf: number; // Not before timestamp
  iat: number; // Issued at timestamp
  jti: string; // JWT ID
  sid: string; // Session ID
}

/**
 * Decode and verify a Shopify session token (JWT)
 * Session tokens are signed with the app's API secret
 */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const message = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.SHOPIFY_API_SECRET)
      .update(message)
      .digest('base64url');

    if (signatureB64 !== expectedSignature) {
      console.error('Session token signature verification failed');
      return null;
    }

    // Decode payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson) as SessionTokenPayload;

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('Session token expired');
      return null;
    }

    // Verify not before
    if (payload.nbf > now) {
      console.error('Session token not yet valid');
      return null;
    }

    // Verify audience (API key)
    if (payload.aud !== env.SHOPIFY_API_KEY) {
      console.error('Session token audience mismatch');
      return null;
    }

    return payload;
  } catch (err) {
    console.error('Failed to verify session token:', err);
    return null;
  }
}

/**
 * Extract shop domain from session token
 */
export function getShopFromSessionToken(token: string): string | null {
  const payload = verifySessionToken(token);
  if (!payload) {
    return null;
  }

  // Extract shop from dest URL (https://{shop})
  try {
    const url = new URL(payload.dest);
    return url.hostname;
  } catch {
    return null;
  }
}
