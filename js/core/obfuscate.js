// Casual, unicode-safe obfuscation for data that sits in the room before players
// should see it (upcoming questions, correct answers). Friends-level anti-cheat:
// it keeps answers out of plain sight in the database and dev tools, nothing more.
const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
}
function fromB64(b64) {
  const s = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
function xor(bytes, key) {
  const k = enc.encode(key);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ k[i % k.length] ^ ((i * 31) & 0xff);
  return out;
}

export function encodeJSON(value, key) {
  return toB64(xor(enc.encode(JSON.stringify(value)), key));
}

export function decodeJSON(str, key) {
  if (!str) return null;
  try { return JSON.parse(dec.decode(xor(fromB64(str), key))); } catch { return null; }
}
