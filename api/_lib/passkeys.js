// FRIENDS B — FACE ID / PASSKEY SIGN-IN (the owner, Nov 7 — DECIDED; docs/profiles.md "PASSKEYS").
// A passkey is a second way to bring your card to a device: ACCOUNT → ADD FACE ID SIGN-IN saves one in the phone's keychain (iCloud Keychain
// syncs it to every Apple device; a Windows / Android device signs in with the iPhone by the browser's QR code); BRING YOUR CARD / RESTORE
// YOUR ACCOUNT → SIGN IN WITH FACE ID links this device exactly like a restore key (profiles.js#linkDevice). THE RESTORE KEY STAYS the fallback.
//
// WebAuthn through ONE library on the server only (@simplewebauthn/server — never shipped to phones). The browser side is js/profile/passkey.js.
//   pkc/{pid}/{h}: { id, pk, c, rp, n, at, u?, tr?, bk? }   server only — a passkey: its credential id + COSE public key (base64url), the
//                                                          signature counter, the RP ID it was made for, its label ("iPhone"), added / last used
//   pkx/{h}: pid                                           server only — credential → profile (h = sha256(credential id), 32 hex)
//   pkch/{uid}: { r?, a? }                                 server only — the ONE live challenge a device holds per kind (r = add, a = sign in):
//                                                          { c, rp, o, x (expires), p? (the pid, for r) } — used ONCE (taken in a transaction)
//   ppriv/{pid}/wh                                         the profile's opaque WebAuthn user handle (never the pid)
// No rule names these nodes: the root's ".read": false / ".write": false keeps every phone out (rules.test.mjs "PASSKEYS").
import { createHash, randomBytes } from 'node:crypto';
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL, decodeClientDataJSON } from '@simplewebauthn/server/helpers';
import { ref, val } from './fb.js';
import { ApiError } from './http.js';
import { publicProfile, signInLimit, linkDevice, isPid } from './profiles.js';

export const PK = {
  ttlMs: 5 * 60_000,     // a challenge lives 5 min, once
  max: 10,               // passkeys a profile
  rpName: 'NEON SPEAKEASY',
};
const PROD = ['https://neonspeakeasy.com', 'https://www.neonspeakeasy.com'];

/** the RP for a request's origin: neonspeakeasy.com (+ http://localhost:* off production — the emulators + tests). Anything else refuses. */
export function rpOf(origin) {
  const o = String(origin || '').trim().replace(/\/+$/, '').toLowerCase();
  if (PROD.includes(o)) return { origin: o, rpID: 'neonspeakeasy.com' };
  if (process.env.VERCEL_ENV !== 'production' && /^http:\/\/localhost(:\d{2,5})?$/.test(o)) return { origin: o, rpID: 'localhost' };
  throw new ApiError(400, 'pk_origin', 'Face ID sign-in works on neonspeakeasy.com.');
}
/** the request's origin (its Origin header; else proto + host) — tests without a request pass body.origin */
export function originOf(req, body) {
  if (!req) return (body && body.origin) || '';
  const hd = req.headers || {};
  if (hd.origin) return String(hd.origin);
  const host = hd['x-forwarded-host'] || hd.host || '';
  const proto = String(hd['x-forwarded-proto'] || (/^localhost(:|$)/.test(host) ? 'http' : 'https')).split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}
/** a passkey's label from the device that ADDED it — a fixed word, never the raw user agent */
export function deviceLabel(ua) {
  const s = String(ua || '');
  if (/iPhone/.test(s)) return 'iPhone';
  if (/iPad/.test(s)) return 'iPad';
  if (/Android/.test(s)) return 'Android';
  if (/Macintosh|Mac OS X/.test(s)) return 'Mac';
  if (/Windows/.test(s)) return 'Windows';
  if (/CrOS/.test(s)) return 'Chromebook';
  if (/Linux/.test(s)) return 'Linux';
  return 'Passkey';
}
export const credKey = id => createHash('sha256').update(String(id)).digest('hex').slice(0, 32);

async function userHandle(pid) {
  const cur = await val(`ppriv/${pid}/wh`);
  if (cur) return cur;
  const wh = isoBase64URL.fromBuffer(randomBytes(16));
  const r = await ref(`ppriv/${pid}/wh`).transaction(c => c || wh);
  return r.snapshot.val() || wh;
}
/** the profile's passkeys for ACCOUNT: [{ h, n, at, u }] (newest first) — never the key material */
export async function passkeyList(pid) {
  const all = (await val(`pkc/${pid}`)) || {};
  return Object.entries(all).filter(([, c]) => c && c.id).map(([h, c]) => ({ h, n: c.n || 'Passkey', at: c.at || 0, u: c.u || 0 })).sort((a, b) => b.at - a.at);
}

async function putChallenge(uid, kind, rec) { await ref(`pkch/${uid}/${kind}`).set(rec); }
/** takes the device's live challenge of this kind — ONCE (a transaction: two racing calls → one wins) — and checks it is the one answered */
async function takeChallenge(uid, kind, response, now) {
  let cd = null;
  try { cd = decodeClientDataJSON(String(response && response.response && response.response.clientDataJSON || '')); } catch { cd = null; }
  if (!cd || !cd.challenge) throw new ApiError(400, 'pk_bad', 'That passkey answer didn’t read right.');
  let got = null;
  await ref(`pkch/${uid}/${kind}`).transaction(cur => { got = cur; return null; });
  if (!got || got.c !== cd.challenge) throw new ApiError(400, 'pk_stale', 'That sign-in expired — try again.');
  if (now > got.x) throw new ApiError(400, 'pk_stale', 'That sign-in expired — try again.');
  return got;
}

/** ADD FACE ID SIGN-IN, step 1: the creation options for the browser (a discoverable passkey, user verification REQUIRED) */
export async function regOptions(pid, uid, { origin, now = Date.now() } = {}) {
  const rp = rpOf(origin);
  const prof = await publicProfile(pid);
  if (!prof) throw new ApiError(404, 'no_profile');
  const all = (await val(`pkc/${pid}`)) || {};
  if (Object.keys(all).length >= PK.max) throw new ApiError(409, 'pk_full', `A card holds ${PK.max} passkeys — remove one first.`);
  const wh = await userHandle(pid);
  const opts = await generateRegistrationOptions({
    rpName: PK.rpName, rpID: rp.rpID,
    userName: prof.t ? `${prof.n}#${prof.t}` : prof.n, userDisplayName: prof.n,
    userID: isoBase64URL.toBuffer(wh),
    attestationType: 'none',
    timeout: PK.ttlMs,
    excludeCredentials: Object.values(all).filter(c => c && c.id && c.rp === rp.rpID).map(c => ({ id: c.id, transports: c.tr || undefined })),
    authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
    supportedAlgorithmIDs: [-7, -257],
  });
  await putChallenge(uid, 'r', { c: opts.challenge, rp: rp.rpID, o: rp.origin, x: now + PK.ttlMs, p: pid });
  return { options: opts };
}

/** ADD FACE ID SIGN-IN, step 2: the browser's answer → verified → stored (the label from the device that added it) */
export async function register(pid, uid, response, { origin, ua = '', now = Date.now() } = {}) {
  rpOf(origin);
  const ch = await takeChallenge(uid, 'r', response, now);
  if (ch.p !== pid) throw new ApiError(400, 'pk_stale', 'That sign-in expired — try again.');
  let v;
  try {
    v = await verifyRegistrationResponse({ response, expectedChallenge: ch.c, expectedOrigin: ch.o, expectedRPID: ch.rp, requireUserVerification: true });
  } catch (e) { throw new ApiError(400, 'pk_bad', 'That passkey couldn’t be checked.', { why: String(e && e.message || e).slice(0, 120) }); }
  if (!v || !v.verified || !v.registrationInfo) throw new ApiError(400, 'pk_bad', 'That passkey couldn’t be checked.');
  const { credential, credentialBackedUp } = v.registrationInfo;
  const h = credKey(credential.id);
  const owner = await val(`pkx/${h}`);
  if (owner && owner !== pid) throw new ApiError(409, 'pk_taken', 'That passkey belongs to another card.');
  const all = (await val(`pkc/${pid}`)) || {};
  if (!all[h] && Object.keys(all).length >= PK.max) throw new ApiError(409, 'pk_full', `A card holds ${PK.max} passkeys — remove one first.`);
  await ref('/').update({
    [`pkc/${pid}/${h}`]: {
      id: credential.id, pk: isoBase64URL.fromBuffer(credential.publicKey), c: credential.counter || 0, rp: ch.rp,
      n: deviceLabel(ua), at: now, tr: Array.isArray(credential.transports) && credential.transports.length ? credential.transports.slice(0, 6).map(String) : null,
      bk: !!credentialBackedUp,
    },
    [`pkx/${h}`]: pid,
  });
  return { ok: true, h, pk: await passkeyList(pid) };
}

/** SIGN IN WITH FACE ID, step 1: the request options (no account named — the phone offers the passkeys it holds for this site) */
export async function authOptions(uid, { origin, now = Date.now() } = {}) {
  const rp = rpOf(origin);
  const opts = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: 'required', timeout: PK.ttlMs, allowCredentials: [] });
  await putChallenge(uid, 'a', { c: opts.challenge, rp: rp.rpID, o: rp.origin, x: now + PK.ttlMs });
  return { options: opts };
}

/** SIGN IN WITH FACE ID, step 2: the signed answer → the passkey's card → this device joins it (the restore key's path + its limit) */
export async function authenticate(uid, response, { origin, ip = '', now = Date.now() } = {}) {
  rpOf(origin);
  await signInLimit(uid, ip, now);
  const ch = await takeChallenge(uid, 'a', response, now);
  const id = String(response && (response.id || response.rawId) || '');
  if (!id) throw new ApiError(400, 'pk_bad', 'That passkey answer didn’t read right.');
  const h = credKey(id);
  const pid = await val(`pkx/${h}`);
  const cred = isPid(pid) ? await val(`pkc/${pid}/${h}`) : null;
  if (!cred || !cred.id) throw new ApiError(404, 'pk_unknown', 'That passkey isn’t on a card any more — use your key instead.');
  if (cred.rp !== ch.rp) throw new ApiError(400, 'pk_origin', 'That passkey was made for another address.');
  const uh = response.response && response.response.userHandle;
  if (uh) { const wh = await val(`ppriv/${pid}/wh`); if (wh && uh !== wh) throw new ApiError(400, 'pk_bad', 'That passkey couldn’t be checked.'); }
  if (!(await val(`profiles/${pid}/n`))) throw new ApiError(404, 'pk_unknown', 'That passkey isn’t on a card any more — use your key instead.');
  let v;
  try {
    v = await verifyAuthenticationResponse({
      response, expectedChallenge: ch.c, expectedOrigin: ch.o, expectedRPID: ch.rp, requireUserVerification: true,
      credential: { id: cred.id, publicKey: isoBase64URL.toBuffer(cred.pk), counter: cred.c || 0, transports: cred.tr || undefined },
    });
  } catch (e) { throw new ApiError(400, 'pk_bad', 'That passkey couldn’t be checked.', { why: String(e && e.message || e).slice(0, 120) }); }
  if (!v || !v.verified) throw new ApiError(400, 'pk_bad', 'That passkey couldn’t be checked.');
  await ref(`pkc/${pid}/${h}`).update({ c: v.authenticationInfo.newCounter || 0, u: now });
  const out = await linkDevice(uid, pid, now);
  return { ...out, via: 'passkey', rpID: ch.rp };
}

/** ACCOUNT → a passkey's REMOVE (the phone keeps its copy; the server no longer accepts it) */
export async function removePasskey(pid, h) {
  const k = String(h || '');
  if (!/^[0-9a-f]{32}$/.test(k)) throw new ApiError(400, 'pk_bad');
  const cur = await val(`pkc/${pid}/${k}`);
  if (cur) await ref('/').update({ [`pkc/${pid}/${k}`]: null, [`pkx/${k}`]: null });
  const wh = await val(`ppriv/${pid}/wh`);
  const list = await passkeyList(pid);
  const ids = Object.values((await val(`pkc/${pid}`)) || {}).filter(c => c && c.id && cur && c.rp === cur.rp).map(c => c.id);
  // (the browser's Signal API — where it exists — drops the removed one from the phone's list: the RP, the handle, the ids still accepted)
  return { ok: true, pk: list, signal: cur ? { rpId: cur.rp, userId: wh || null, ids } : null };
}
