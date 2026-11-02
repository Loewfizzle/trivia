// CITY CONTROLS B — "A ROOM JUST OPENED": Web Push to the owner's phone, with NO new service and NO new dependency — node's own crypto
// does the two standards a push needs: VAPID (RFC 8292: an ES256 JWT the push service checks) and the payload's encryption (RFC 8291,
// aes128gcm). The keys live in Vercel's env (VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY, base64url — the raw P-256 point + scalar; VAPID_SUBJECT
// a mailto:); on the local emulators a key pair is made per process. iOS: Web Push only for a site ADDED TO THE HOME SCREEN (16.4+) with
// the permission granted — docs/profiles.md "A ROOM JUST OPENED".
import { createECDH, createHmac, createCipheriv, randomBytes, createPrivateKey, sign } from 'node:crypto';
import { emulated } from './fb.js';

const b64u = b => Buffer.from(b).toString('base64url');
const unb64u = s => Buffer.from(String(s || ''), 'base64url');
/** the push services a subscription may point at (https only; the emulators also take a local test receiver) */
const HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/, /^updates\.push\.services\.mozilla\.com$/];
export function okEndpoint(ep) {
  let u; try { u = new URL(String(ep || '')); } catch { return false; }
  if (emulated() && u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost')) return true;
  return u.protocol === 'https:' && HOSTS.some(r => r.test(u.hostname)) && String(ep).length < 600;
}

let devKeys = null;
/** the VAPID keys → { pub, priv, subject } | null (not set up: the toggle says so) */
export function vapid() {
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) return { pub, priv, subject: process.env.VAPID_SUBJECT || 'mailto:owner@neonspeakeasy.com' };
  if (emulated()) { if (!devKeys) { const e = createECDH('prime256v1'); e.generateKeys(); devKeys = { pub: b64u(e.getPublicKey()), priv: b64u(e.getPrivateKey()), subject: 'mailto:dev@localhost' }; } return devKeys; }
  return null;
}
/** a fresh pair to paste into Vercel's env (node -e "import('./api/_lib/push.js').then(m => console.log(m.newVapidKeys()))") */
export function newVapidKeys() { const e = createECDH('prime256v1'); e.generateKeys(); return { VAPID_PUBLIC_KEY: b64u(e.getPublicKey()), VAPID_PRIVATE_KEY: b64u(e.getPrivateKey()) }; }

function vapidAuth(endpoint, V, now = Date.now()) {
  const pub = unb64u(V.pub), d = unb64u(V.priv);
  const key = createPrivateKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)), d: b64u(d) }, format: 'jwk' });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), body = b64u(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: V.subject }));
  const sig = sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${V.pub}`;
}
const hkdf = (salt, ikm, info, len) => { const prk = createHmac('sha256', salt).update(ikm).digest(); return createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, len); };
/** RFC 8291 (aes128gcm): the payload for one subscription { keys: { p256dh, auth } } → the request body */
export function encrypt(payload, sub, o = {}) {
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const e = createECDH('prime256v1'); if (o.priv) e.setPrivateKey(o.priv); else e.generateKeys();
  const as = e.getPublicKey(), shared = e.computeSecret(ua);
  const ikm = hkdf(auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), ua, as]), 32);
  const salt = o.salt || randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const head = Buffer.alloc(21); salt.copy(head, 0); head.writeUInt32BE(4096, 16); head.writeUInt8(65, 20);
  return Buffer.concat([head, as, ct]);
}
/** send one push → the push service's HTTP status (0: not sent) */
export async function sendPush(sub, data, o = {}) {
  const V = vapid();
  if (!V || !sub || !okEndpoint(sub.endpoint) || !sub.keys) return 0;
  try {
    const r = await fetch(sub.endpoint, { method: 'POST', headers: { TTL: String(o.ttl || 3600), Urgency: 'high', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', Authorization: vapidAuth(sub.endpoint, V) }, body: encrypt(JSON.stringify(data), sub) });
    return r.status;
  } catch { return 0; }
}
