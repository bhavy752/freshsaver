/**
 * PIN hashing utilities.
 *
 * The PIN is a convenience lock on top of an already-authenticated session,
 * not a primary security boundary. Still, we avoid plaintext storage and use
 * a per-user salt (the user's UUID) plus multiple SHA-256 rounds (key
 * stretching) to make offline brute-force of the 4-digit space more expensive.
 *
 * For stronger protection, move hashing to a Supabase Edge Function and use
 * bcrypt/argon2 instead of client-side SHA-256.
 */

const PEPPER = '_freshsaver_pin_v1';
const HASH_ROUNDS = 1000;

export async function hashPin(pin: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  let data = encoder.encode(`${pin}:${userId}:${PEPPER}`);

  for (let i = 0; i < HASH_ROUNDS; i++) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    data = new Uint8Array(hashBuffer);
  }

  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPin(pin: string, userId: string, expectedHash: string): Promise<boolean> {
  const actual = await hashPin(pin, userId);
  // Constant-time comparison to avoid timing attacks.
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return diff === 0;
}
