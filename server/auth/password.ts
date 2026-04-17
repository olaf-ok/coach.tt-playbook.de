import { hash, verify } from '@node-rs/argon2';

// Pre-computed dummy hash to run verifyPassword against when the user doesn't exist,
// so login timing is identical whether or not the account is real.
export const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$5jS1aBANBcgAedND+vQ1Tw$dAsf9IZAH42nQGbFe/z7+ixYrk9LH4ZD9+MyU2wUsuI';

// Explicit parameters matching OWASP 2023+ recommendation; pinned so a future
// library update can't silently lower them.
// algorithm = 2 maps to Argon2id in @node-rs/argon2's Algorithm enum
// (inlined because verbatimModuleSyntax blocks importing const enums).
const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hashStr: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashStr, plain);
  } catch (err) {
    // Malformed hashes are expected (e.g. legacy formats, user-supplied tokens).
    // Anything else is a bug or ops incident — surface it without failing the caller.
    console.error('[auth] verifyPassword unexpected error:', err);
    return false;
  }
}
