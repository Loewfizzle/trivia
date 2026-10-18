// This device's global profile: created automatically (no signup) from the name / avatar / colour the player already
// uses, kept in step when they edit it, restorable on another device with the profile key.
// Everything here is best-effort: with the server down the app behaves exactly as before (no tag, no emblem).
//
//   syncMe()            after Firebase is ready and whenever the local name / avatar / colour changes
//   myPid(uid)          the profile id for room player nodes (only for the uid it was made for)
//   restoreKey(key)     link this device to the key's profile (a "new phone")
//   regenKey(), setShown(on), fetchMe(), myRanks(boards)
import { api, ApiFail } from './api.js';
import { loadProfile, saveProfile, loadMe, saveMe, loadKey, saveKey, loadNotes, saveNotes } from '../identity.js';
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
export function setNotes(patch) { const n = { ...loadNotes(), ...patch }; saveNotes(n); return n; }

function store(pid, profile) {
  saveMe({ uid: state.uid, pid, profile, at: Date.now() });
  setState({ me: { pid, profile } });
}

/** Creates / updates this device's profile from the local name, avatar and colour. Never throws. */
export function syncMe() {
  const p = loadProfile();
  if (!p || !p.name) return Promise.resolve(null);
  const sig = `${state.uid}|${p.name}|${p.avatar}|${p.color}`;
  if (syncing && sig === lastSig) return syncing;
  lastSig = sig;
  syncing = (async () => {
    try {
      await firebaseReady;
      const r = await api('profile', { action: 'ensure', name: p.name, avatar: p.avatar, color: p.color });
      if (r.key) { saveKey(r.key); setNotes({ saved: false }); }
      store(r.pid, r.profile);
      if (r.rename && r.rename.blocked && !sessionStorage.getItem('pf:renote')) {
        try { sessionStorage.setItem('pf:renote', '1'); } catch { /* fine */ }
        toast(`BOARD NAMES CHANGE ONCE A DAY — YOU’RE STILL ${r.profile.n.toUpperCase()}#${r.profile.t} ON THE BOARD`, 'info', 5200);
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
export async function restoreKey(input) {
  const raw = normalizeKey(input);
  if (!raw) throw new ApiFail(400, 'bad_key', 'That doesn’t look like a profile key — it reads NEON-XXXX-XXXX-XXXX.');
  const r = await api('profile', { action: 'restore', key: raw });
  saveKey(formatKey(raw));
  setNotes({ saved: true });
  store(r.pid, r.profile);
  // the room name / avatar / colour follow the restored profile
  const local = loadProfile() || {};
  saveProfile({ ...local, name: r.profile.n, avatar: r.profile.a, color: r.profile.c });
  lastSig = `${state.uid}|${r.profile.n}|${r.profile.a}|${r.profile.c}`;
  linkRoomSeat();
  return r;
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
  return r;
}

export async function myRanks(boards) {
  return (await api('profile', { action: 'ranks', boards })).ranks || {};
}

/** A match outcome from the server: the cached profile takes the new XP and rank at once (emblems everywhere). */
export function applyOutcome(o) {
  const m = loadMe();
  if (!o || !o.xp || !m || !m.profile || m.uid !== state.uid) return;
  m.profile = { ...m.profile, x: o.xp.to, r: o.rk ? o.rk.to : m.profile.r };
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
}
