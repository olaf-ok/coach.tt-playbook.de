import argon2 from 'argon2';

// Pre-computed dummy hash to run verifyPassword against when the user doesn't exist,
// so login timing is identical whether or not the account is real.
export const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$5jS1aBANBcgAedND+vQ1Tw$dAsf9IZAH42nQGbFe/z7+ixYrk9LH4ZD9+MyU2wUsuI';

// Explicit parameters matching OWASP 2023+ recommendation; pinned so a future
// library update can't silently lower them.
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    // Malformed hashes are expected (e.g. legacy formats, user-supplied tokens).
    // Anything else is a bug or ops incident — surface it without failing the caller.
    console.error('[auth] verifyPassword unexpected error:', err);
    return false;
  }
}
