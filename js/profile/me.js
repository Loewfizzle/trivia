// This device's global profile: created automatically (no signup) from the name / avatar / colour the player already
// uses, kept in step when they edit it, restorable on another device with the profile key.
// Everything here is best-effort: with the server down the app behaves exactly as before (no tag, no emblem).
//
//   syncMe()            after Firebase is ready and whenever the local name / avatar / colour changes
//   myPid(uid)          the profile id for room player nodes (only for the uid it was made for)
//   restoreKey(key)     link this device to the key's profile (a "new phone")
//   regenKey(), setShown(on), fetchMe(), myRanks(boards)
import { api, ApiFail } from './api.js';
import { loadProfile, saveProfile, loadMe, saveMe, loadKey, saveKey, loadNotes, saveNotes, testMode } from '../identity.js';
import { state, setState } from '../store.js';
import { firebaseReady } from '../firebase.js';
import { formatKey, normalizeKey } from '../core/pkey.js';
import { toast } from '../ui/toast.js';

let syncing = null;
let lastSig = '';

/** The profile id to put on this uid's room player node, or null. */
export function myPid(uid = state.uid) {
  const m = loadMe();
  return m && m.pid && m.uid === uid ? m.pid : null;
}
export const myPublic = () => { const m = loadMe(); return m && m.uid === state.uid ? m.profile : null; };
export const myKey = () => loadKey();
export const notes = () => loadNotes();
export function setNotes(patch) { const n = { ...loadNotes(), ...patch }; saveNotes(n); try { window.dispatchEvent(new Event('ns:notes')); } catch { /* fine */ } return n; }   // (LOBBY 2.0 A: the key pop-up's dot follows)

function store(pid, profile) {
  const was = loadMe();
  saveMe({ uid: state.uid, pid, profile, at: Date.now() });
  setState({ me: { pid, profile } });
  // (PERF-A: the admin check re-asks when this device's profile changes — a key restore, a first link — never a stale "no")
  if (!was || was.pid !== pid || was.uid !== state.uid) { try { window.dispatchEvent(new CustomEvent('nd:me', { detail: { pid } })); } catch { /* fine */ } }
}
/** PERF-A — THE KEY ON THIS DEVICE IS NEVER OVERWRITTEN (Grok 1.3, verified at this file's ensure: a lost guest login + a typed name made
 *  a NEW profile and its key replaced the old one on the device): a held offer → { key (the device's old key), fresh (the new profile's
 *  key, kept aside) } or null. The membership card asks "THIS DEVICE ALREADY HAD A KEY — RESTORE IT?" */
export const keyOffer = () => { const n = loadNotes(); return n.heldNew && loadKey() ? { key: loadKey(), fresh: n.heldNew } : null; };
/** KEEP THE NEW ONE: the new profile's key becomes this device's (the old key stays in the notes — never destroyed) */
export function keepNewKey() {
  const n = loadNotes(); if (!n.heldNew) return;
  const old = loadKey();
  saveKey(n.heldNew);
  saveNotes({ ...n, heldNew: null, saved: false, oldKeys: [...(n.oldKeys || []), old].filter(Boolean).slice(-3) });
  setState({ keyOffer: null });
}

/** FR6 FIXES A (C2): the last key this device held before a restore / a new key it kept (null: none) — ACCOUNT's YOUR PREVIOUS KEY */
export const previousKey = () => { const k = (loadNotes().oldKeys || []).filter(Boolean); return k.length ? k[k.length - 1] : null; };
/** forget the previous key on this device (its profile is untouched on the server) */
export function forgetPreviousKey() { const n = loadNotes(), k = previousKey(); if (!k) return; saveNotes({ ...n, oldKeys: (n.oldKeys || []).filter(x => x !== k) }); }

/** Creates / updates this device's profile from the local name, avatar and colour. Never throws. */
export function syncMe() {
  const p = loadProfile();
  // (FR6 FIXES A — G7: a TEST tab never makes a profile — no member Nº for a throwaway player; js/identity.js#testMode)
  if (!p || !p.name || testMode) return Promise.resolve(null);
  const sig = `${state.uid}|${p.name}|${p.avatar}|${p.color}`;
  if (syncing && sig === lastSig) return syncing;
  lastSig = sig;
  syncing = (async () => {
    try {
      await firebaseReady;
      const r = await api('profile', { action: 'ensure', name: p.name, avatar: p.avatar, color: p.color });
      if (r.key) {
        // (a NEW profile while a key is already on this device: keep the device's key + its "saved" note; the new key waits aside)
        if (loadKey() && normalizeKey(loadKey()) !== normalizeKey(r.key)) { setNotes({ heldNew: r.key }); setState({ keyOffer: keyOffer() }); }
        else { saveKey(r.key); setNotes({ saved: false }); }
      }
      store(r.pid, r.profile);
      if (r.rename && r.rename.blocked && !sessionStorage.getItem('pf:renote')) {
        try { sessionStorage.setItem('pf:renote', '1'); } catch { /* fine */ }
        toast('Board names change once a day', 'info', { ms: 5200, sub: `You’re still ${r.profile.n}#${r.profile.t} on the board.` });
      }
      linkRoomSeat();
      return r;
    } catch (e) {
      if (!(e instanceof ApiFail) || e.status >= 500 || e.status === 0) console.info('profile sync later:', e.message);
      syncing = null; lastSig = '';
      return null;
    }
  })();
  return syncing;
}

// in a room already? put the profile id on our player node so the lobby and chat can show the emblem and tag
async function linkRoomSeat() {
  if (!state.code || !state.players[state.uid] || state.players[state.uid].pid === myPid()) return;
  try { const { updateMyProfile } = await import('../room.js'); await updateMyProfile(loadProfile()); } catch { /* next join */ }
}

/** Links this device to the profile a key belongs to. Throws ApiFail with a readable message. */
export async function restoreKey(input, { onRetry } = {}) {
  const raw = normalizeKey(input);
  if (!raw) throw new ApiFail(400, 'bad_key', 'That doesn’t look like a profile key — it reads NEON-XXXX-XXXX-XXXX.');
  // (PERF-A — FR5 E5 / Grok 2.1: one 9-s try met the server's cold start — "COULDN'T REACH THE SERVER" twice. A network failure / a
  //  timeout (status 0) retries up to 3× with a short backoff + a longer wait; a server that ANSWERED (a bad key, a limit) is final)
  let r = null;
  for (let i = 0; ; i++) {
    try { r = await api('profile', { action: 'restore', key: raw }, { timeout: i ? 15000 : 9000 }); break; }
    catch (e) { if (!(e instanceof ApiFail) || e.status !== 0 || i >= 3) throw e; if (onRetry) onRetry(i + 1); await new Promise(res => setTimeout(res, 900 * (i + 1))); }
  }
  adoptCard(r, raw);
  return r;
}

/** This device JOINED a card ({ pid, profile }) — by its restore key (raw) or a PASSKEY (raw null — FRIENDS B: profile/passkey.js). */
export function adoptCard(r, raw = null) {
  const n0 = loadNotes(), was = loadMe();
  // (FR6 FIXES A — C2: the restore used to overwrite the device's previous key without keeping it — PERF-A's keepNewKey protected only
  //  the ensure path. The previous key (+ a held new one, never adopted) goes into oldKeys: ACCOUNT shows it as YOUR PREVIOUS KEY)
  // (FRIENDS B: a passkey brings no key — the device's own key stays only if it is THIS card's; another card's goes to oldKeys)
  const same = !raw && was && was.pid === r.pid && loadKey();
  const prevs = same ? [n0.heldNew].filter(Boolean) : [loadKey(), n0.heldNew].filter(k => k && (!raw || normalizeKey(k) !== raw));
  if (raw) saveKey(formatKey(raw)); else if (!same) saveKey(null);
  saveNotes({ ...n0, saved: raw ? true : !!(same && n0.saved), pkIn: raw ? null : Date.now(), heldNew: null, oldKeys: [...(n0.oldKeys || []).filter(k => !prevs.includes(k) && (!raw || normalizeKey(k) !== raw)), ...prevs].slice(-3) });
  setState({ keyOffer: null });
  store(r.pid, r.profile);
  // the room name / avatar / colour follow the restored profile
  const local = loadProfile() || {};
  saveProfile({ ...local, name: r.profile.n, avatar: r.profile.a, color: r.profile.c });
  lastSig = `${state.uid}|${r.profile.n}|${r.profile.a}|${r.profile.c}`;
  linkRoomSeat();
}

export async function regenKey() {
  const r = await api('profile', { action: 'regen' });
  saveKey(r.key);
  setNotes({ saved: false });
  return r.key;
}

/** Wear a finish / a glow from THE VAULT (the server checks it's unlocked). */
export async function setStyle(patch) {
  const r = await api('profile', { action: 'style', ...patch });
  const m = loadMe();
  if (m && r.profile) { m.profile = { ...m.profile, ...r.profile }; saveMe(m); setState({ me: { pid: m.pid, profile: m.profile } }); }
  return r.profile;
}

export async function setShown(on) {
  const r = await api('profile', { action: 'show', on: !!on });
  const m = loadMe();
  if (m && m.profile) { m.profile.h = !on || r.priv.banned; saveMe(m); setState({ me: { pid: m.pid, profile: m.profile } }); }
  return r.priv;
}

/** Profile + stats for the profile screen. */
export async function fetchMe() {
  const r = await api('profile', { action: 'me' });
  store(r.pid, r.profile);
  if (r.priv && typeof r.priv.cb === 'boolean') import('../ui/colorblind.js').then(m => m.adoptProfileCb(r.priv.cb)).catch(() => {});   // (SHELL 2.0 B1)
  return r;
}

export async function myRanks(boards) {
  const r = await api('profile', { action: 'ranks', boards });
  // BNAME: keep the cached profile's match count current (THE BOARD's pinned row: "N MORE MATCHES TO JOIN THE BOARD")
  const m = loadMe();
  if (m && m.profile && typeof r.m === 'number' && (m.profile.m !== r.m || m.profile.mm !== r.mm)) {
    m.profile = { ...m.profile, m: r.m, mm: r.mm };
    saveMe(m);
  }
  return r.ranks || {};
}

/** A match outcome from the server: the cached profile takes the new XP and rank at once (emblems everywhere). */
export function applyOutcome(o) {
  const m = loadMe();
  if (!o || !o.xp || !m || !m.profile || m.uid !== state.uid) return;
  m.profile = { ...m.profile, x: o.xp.to, r: o.rk ? o.rk.to : m.profile.r, ...(typeof o.played === 'number' ? { m: o.played } : {}) };
  saveMe(m);
  setState({ me: { pid: m.pid, profile: m.profile } });
}

/** Profile-key prompts: after the 3rd finished match, again after the 10th, until the player says it's saved. */
export function countMatch() {
  const n = loadNotes();
  return setNotes({ games: (n.games || 0) + 1 });
}
export function shouldPromptKey() {
  const n = loadNotes();
  if (n.saved || !loadKey()) return false;
  const g = n.games || 0;
  return (g >= 3 && (n.prompted || 0) < 1) || (g >= 10 && (n.prompted || 0) < 2);
}

// when the local profile changes (the setup screen saves) or a new uid signs in, sync again
export function watchProfile() {
  window.addEventListener('storage', e => { if (e.key && /:profile$/.test(e.key)) syncMe(); });
  const m = loadMe();
  if (m && m.uid && state.uid && m.uid === state.uid) setState({ me: { pid: m.pid, profile: m.profile } });
  setState({ keyOffer: keyOffer() });
}
