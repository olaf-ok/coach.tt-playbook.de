import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Use only for inputs with a fixed expected length (e.g. sha256 hex = 64 chars).
// The length-mismatch early return leaks length via timing, which is safe for
// fixed-length hashes but unsafe for variable-length secrets.
export function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
