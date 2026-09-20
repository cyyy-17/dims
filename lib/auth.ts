import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'dims_staff_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  return (
    process.env.DIMS_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'dims-asr-default-signing-key-2026-strict'
  );
}

interface SessionPayload {
  email: string;
  iat: number;
  exp: number;
  nonce: string;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Token format: <base64url_payload>.<hex_hmac_signature>
 */
export function createSignedSessionToken(email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getSessionSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a signed HMAC-SHA256 session token.
 * Validates integrity, signature, and expiration timestamp.
 */
export function verifySessionToken(token?: string): {
  valid: boolean;
  email?: string;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [payloadStr, signature] = parts;
  if (!payloadStr || !signature) {
    return { valid: false, error: 'Empty payload or signature' };
  }

  try {
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadStr)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadJson = Buffer.from(payloadStr, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Session expired' };
    }

    return { valid: true, email: payload.email };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Validation error';
    return { valid: false, error: msg };
  }
}
