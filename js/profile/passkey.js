// FRIENDS B — FACE ID / PASSKEY SIGN-IN, the browser side (the server: api/_lib/passkeys.js; docs/profiles.md "PASSKEYS").
//   passkeysOk()         this browser can make / use a passkey (WebAuthn on a secure page)
//   pkWord()             what the phone calls it: FACE ID (iPhone / iPad) · TOUCH ID (Mac) · PASSKEY (Windows Hello, Android, anything else)
//   addPasskey()         ACCOUNT → ADD FACE ID SIGN-IN: the phone asks "Save a passkey for neonspeakeasy.com?" → Face ID → stored → { pk }
//   signInWithPasskey()  BRING YOUR CARD / RESTORE YOUR ACCOUNT → SIGN IN WITH FACE ID → this device joins the card (me.js#adoptCard)
//   removePasskey(h)     ACCOUNT → REMOVE (+ the browser's Signal API, where it exists, drops it from the phone's list)
// Hand-written (no library in the shipped site): the JSON options ↔ ArrayBuffers, nothing kept on the device beyond what the browser keeps
// itself (the passkey lives in the phone's keychain — iCloud Keychain syncs it across Apple devices; a Windows / Android device uses the
// iPhone by the browser's QR code). Every failure is a readable ApiFail-like error; a cancel says so quietly.
import { api, ApiFail } from './api.js';
import { lazyImport } from '../ui/lazy-import.js';

export const passkeysOk = () => typeof window !== 'undefined' && !!window.PublicKeyCredential && !!navigator.credentials && window.isSecureContext !== false;
export function pkWord() {
  const ua = navigator.userAgent || '', touch = navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touch)) return 'FACE ID';
  if (/Macintosh/.test(ua)) return 'TOUCH ID';
  return 'PASSKEY';
}

const b64uToBuf = s => { const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
const bufToB64u = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };

/** the browser's refusal → a readable error (a cancel / a timeout = code 'pk_cancel', never an alarm) */
function why(e, kind) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'AbortError') return new ApiFail(0, 'pk_cancel', 'Cancelled — nothing changed.');
  if (n === 'InvalidStateError' && kind === 'add') return new ApiFail(409, 'pk_have', 'This device already has a passkey for your card.');
  if (n === 'SecurityError') return new ApiFail(400, 'pk_origin', 'Face ID sign-in works on neonspeakeasy.com.');
  if (e instanceof ApiFail) return e;
  return new ApiFail(0, 'pk_fail', 'Your phone couldn’t make the passkey — your key still works.');
}

/** ADD FACE ID SIGN-IN → { pk: [{ h, n, at, u }] } (throws a readable error) */
export async function addPasskey() {
  if (!passkeysOk()) throw new ApiFail(0, 'pk_none', 'This browser can’t save a passkey — your key still works.');
  const { options: o } = await api('profile', { action: 'pkRegOptions' });
  const publicKey = {
    ...o,
    challenge: b64uToBuf(o.challenge),
    user: { ...o.user, id: b64uToBuf(o.user.id) },
    excludeCredentials: (o.excludeCredentials || []).map(c => ({ ...c, id: b64uToBuf(c.id) })),
  };
  let cred;
  try { cred = await navigator.credentials.create({ publicKey }); } catch (e) { throw why(e, 'add'); }
  if (!cred) throw new ApiFail(0, 'pk_cancel', 'Cancelled — nothing changed.');
  const r = cred.response;
  const response = {
    id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type,
    clientExtensionResults: (cred.getClientExtensionResults && cred.getClientExtensionResults()) || {},
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    response: {
      clientDataJSON: bufToB64u(r.clientDataJSON), attestationObject: bufToB64u(r.attestationObject),
      transports: typeof r.getTransports === 'function' ? r.getTransports() : undefined,
    },
  };
  return api('profile', { action: 'pkRegister', response });
}

/** SIGN IN WITH FACE ID → the card ({ pid, profile }) — this device joins it like a restore key (me.js#adoptCard) */
export async function signInWithPasskey({ onRetry } = {}) {
  if (!passkeysOk()) throw new ApiFail(0, 'pk_none', 'This browser can’t use a passkey — paste your key instead.');
  let o;
  for (let i = 0; ; i++) {   // (the server's cold start: a network failure retries, like the restore — an answer is final)
    try { ({ options: o } = await api('profile', { action: 'pkAuthOptions' }, { timeout: i ? 15000 : 9000 })); break; }
    catch (e) { if (!(e instanceof ApiFail) || e.status !== 0 || i >= 2) throw e; if (onRetry) onRetry(i + 1); await new Promise(res => setTimeout(res, 900 * (i + 1))); }
  }
  const publicKey = { ...o, challenge: b64uToBuf(o.challenge), allowCredentials: (o.allowCredentials || []).map(c => ({ ...c, id: b64uToBuf(c.id) })) };
  let cred;
  try { cred = await navigator.credentials.get({ publicKey, mediation: 'optional' }); } catch (e) { throw why(e, 'get'); }
  if (!cred) throw new ApiFail(0, 'pk_cancel', 'Cancelled — nothing changed.');
  const r = cred.response;
  const response = {
    id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type,
    clientExtensionResults: (cred.getClientExtensionResults && cred.getClientExtensionResults()) || {},
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    response: {
      clientDataJSON: bufToB64u(r.clientDataJSON), authenticatorData: bufToB64u(r.authenticatorData), signature: bufToB64u(r.signature),
      userHandle: r.userHandle ? bufToB64u(r.userHandle) : undefined,
    },
  };
  let out;
  try { out = await api('profile', { action: 'pkAuth', response }, { timeout: 15000 }); }
  catch (e) {
    // (a passkey the server no longer knows — removed on ACCOUNT: the Signal API, where it exists, drops it from the phone's list)
    if (e instanceof ApiFail && e.code === 'pk_unknown') { try { window.PublicKeyCredential.signalUnknownCredential && await window.PublicKeyCredential.signalUnknownCredential({ rpId: o.rpId, credentialId: cred.id }); } catch { /* fine */ } }
    throw e;
  }
  const { adoptCard } = await lazyImport(import('./me.js'), './me.js');
  adoptCard(out, null);
  return out;
}

/** ACCOUNT → REMOVE → { pk } */
export async function removePasskey(h) {
  const r = await api('profile', { action: 'pkRemove', h });
  const sg = r.signal;
  try { if (sg && sg.userId && window.PublicKeyCredential && window.PublicKeyCredential.signalAllAcceptedCredentials) await window.PublicKeyCredential.signalAllAcceptedCredentials({ rpId: sg.rpId, userId: sg.userId, allAcceptedCredentialIds: sg.ids }); } catch { /* fine */ }
  return r;
}
