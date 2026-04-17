import argon2 from 'argon2';

// Pre-computed dummy hash to run verifyPassword against when the user doesn't exist,
// so login timing is identical whether or not the account is real.
export const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$5jS1aBANBcgAedND+vQ1Tw$dAsf9IZAH42nQGbFe/z7+ixYrk9LH4ZD9+MyU2wUsuI';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
