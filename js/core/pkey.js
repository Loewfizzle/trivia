// Profile restore keys, PURE: NEON-XXXX-XXXX-XXXX from a 32-letter alphabet without look-alikes (no O, 0, I, 1).
// 12 symbols × 5 bits = 60 bits of randomness; the server keeps only an HMAC of the key and rate-limits restores,
// so guessing one is hopeless. The plain key lives only on the player's devices (localStorage) and in their head.
export const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const KEY_LEN = 12;

/** bytes: 12 random bytes (crypto). 256 is a multiple of 32, so `& 31` keeps every letter equally likely. */
export function keyFromBytes(bytes) {
  if (!bytes || bytes.length < KEY_LEN) throw new Error('need 12 random bytes');
  let s = '';
  for (let i = 0; i < KEY_LEN; i++) s += KEY_ALPHABET[bytes[i] & 31];
  return s;
}

export const formatKey = raw => `NEON-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;

/** Whatever the player typed or pasted → the 12 key letters, or '' when it can't be a key. */
export function normalizeKey(input) {
  let s = String(input || '').toUpperCase().replace(/[\s\-_.·]/g, '');
  if (s.startsWith('NEON') && s.length === KEY_LEN + 4) s = s.slice(4);
  if (s.length !== KEY_LEN) return '';
  for (const ch of s) if (!KEY_ALPHABET.includes(ch)) return '';
  return s;
}
