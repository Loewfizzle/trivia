// Room chat — data layer. Lives in its own little store (not the app store), so a new message never
// re-renders a running game. Loaded lazily the first time the player is in a room.
//
// chats/{code}/m/{key}:  { u, t, at } (player) or { s, x, at } (system line, host-written)
// chats/{code}/rate/{uid}: server time of that player's last message (rules: ≥ 800 ms apart)
// chats/{code}/typing/{uid}: server time while typing (onDisconnect removes it)
import {
  dbRef, update, set, remove, onValue, onDisconnect, serverTimestamp, serverNow, query, orderByChild,
  limitToLast, limitToFirst, endAt, push, get, goOffline, goOnline,
} from '../firebase.js';
import { state, subscribe, isHost } from '../store.js';
import { liveKeyFor, GAME_MODULES } from '../games/registry.js';
import { GAMES } from '../config.js';
import { sfx } from '../audio/sfx.js';
import { vibrate } from '../ui/dom.js';
import { chatLocked, cleanText, unreadCount, KEEP, CLIENT_GAP_MS, TYPING_IDLE_MS } from './logic.js';

const C = code => `chats/${code}`;
export const chat = {
  code: null,
  msgs: [],            // sorted by `at`: { k, u?, t?, s?, x?, at }
  loaded: false,
  typing: {},          // uid -> server time
  outbox: new Map(),   // key -> { k, t, at, status: 'pending' | 'failed' }
  unread: 0,
  open: false,         // the chat sheet is showing
  denied: false,
};
const listeners = new Set();
/** fn(kind) with kind 'msgs' | 'typing' | 'unread' | 'outbox' */
export const onChat = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = kind => listeners.forEach(fn => { try { fn(kind); } catch (e) { console.warn('chat ui', e); } });

let unsubs = [];
let lastSendAt = 0;
let typingSince = 0, typingTimer = 0, typingArmed = '';
const debug = { sounds: 0, notified: 0 };

// ---------------------------------------------------------------- lifecycle (follows the room)
subscribe(st => {
  const want = st.code && st.ready !== false && st.uid ? st.code : null;
  if (want !== chat.code) attach(want);
  else if (want) refreshUnread();
});

function attach(code) {
  unsubs.forEach(u => u());
  unsubs = [];
  Object.assign(chat, { code, msgs: [], loaded: false, typing: {}, unread: 0, denied: false });
  chat.outbox = new Map();
  typingArmed = '';
  emit('msgs'); emit('typing'); emit('unread');
  if (!code) return;
  const q = query(dbRef(`${C(code)}/m`), orderByChild('at'), limitToLast(KEEP));
  unsubs.push(onValue(q, snap => {
    if (chat.code !== code) return;
    const prev = new Set(chat.msgs.map(m => m.k));
    const list = [];
    snap.forEach(c => { const v = c.val(); if (v && typeof v.at === 'number') list.push({ k: c.key, ...v }); });
    const fresh = chat.loaded ? list.filter(m => !prev.has(m.k)) : [];
    chat.msgs = list;
    chat.full = list.length >= KEEP;
    chat.loaded = true;
    emit('msgs');
    refreshUnread();
    if (fresh.length) notify(fresh);
  }, err => { console.warn('chat', err && err.message); chat.denied = true; emit('msgs'); }));
  unsubs.push(onValue(dbRef(`${C(code)}/typing`), snap => { chat.typing = snap.val() || {}; emit('typing'); }, () => {}));
}

// ---------------------------------------------------------------- unread + notifications
const readKey = () => `na:chat:read:${chat.code}`;
function lastRead() { try { return Number(localStorage.getItem(readKey())) || 0; } catch { return 0; } }
export function markRead() {
  const latest = chat.msgs.length ? chat.msgs[chat.msgs.length - 1].at : 0;
  try { localStorage.setItem(readKey(), String(Math.max(latest, serverNow()))); } catch { /* */ }
  refreshUnread();
}
function refreshUnread() {
  const n = chat.open ? 0 : unreadCount(chat.msgs, state.uid, lastRead());
  if (n !== chat.unread) { chat.unread = n; emit('unread'); }
  if (chat.open && chat.msgs.length) { try { localStorage.setItem(readKey(), String(chat.msgs[chat.msgs.length - 1].at)); } catch { /* */ } }
}

/** Is chat locked for me right now (active play)? */
export function locked() {
  const g = state.meta && state.meta.status === 'playing' ? state.game : null;
  if (!g) return false;
  const live = state.liveKey && state.liveKey === liveKeyFor(g) ? state.live : null;
  return chatLocked(g, state.uid, live);
}

// a soft sound + tap for messages from others — never during active play, never with the sheet open
function notify(fresh) {
  const others = fresh.filter(m => m.u && m.u !== state.uid);
  if (!others.length || chat.open || locked() || document.hidden) return;
  debug.sounds++;
  sfx('chat');
  vibrate(6);
}

// ---------------------------------------------------------------- sending
/** Returns 'ok' | 'empty' | 'slow' | 'off' */
export function send(text, retryKey = null) {
  const t = cleanText(text);
  if (!t) return 'empty';
  if (!chat.code || !state.uid) return 'off';
  const now = Date.now();
  if (now - lastSendAt < CLIENT_GAP_MS) return 'slow';
  lastSendAt = now;
  if (retryKey) chat.outbox.delete(retryKey);
  const code = chat.code;
  const k = push(dbRef(`${C(code)}/m`)).key;
  chat.outbox.set(k, { k, t, at: serverNow(), status: 'pending' });
  emit('outbox');
  stopTyping();
  const n = String((state.players[state.uid] && state.players[state.uid].name) || 'PLAYER').slice(0, 16);
  update(dbRef(C(code)), { [`m/${k}`]: { u: state.uid, n, t, at: serverTimestamp() }, [`rate/${state.uid}`]: serverTimestamp() })
    .then(() => { chat.outbox.delete(k); emit('outbox'); })
    .catch(e => {
      console.warn('chat send', e && e.message);
      const o = chat.outbox.get(k);
      if (o) { o.status = 'failed'; emit('outbox'); }
    });
  return 'ok';
}
export const retry = k => { const o = chat.outbox.get(k); return o ? send(o.t, k) : 'off'; };
export const discard = k => { chat.outbox.delete(k); emit('outbox'); };

// ---------------------------------------------------------------- typing indicator
export function typingPing() {
  if (!chat.code || !state.uid) return;
  const path = `${C(chat.code)}/typing/${state.uid}`;
  if (typingArmed !== chat.code) { typingArmed = chat.code; onDisconnect(dbRef(path)).remove().catch(() => {}); }
  const now = Date.now();
  if (now - typingSince > 2000) { typingSince = now; set(dbRef(path), serverTimestamp()).catch(() => {}); }
  clearTimeout(typingTimer);
  typingTimer = setTimeout(stopTyping, TYPING_IDLE_MS);
}
export function stopTyping() {
  clearTimeout(typingTimer);
  if (!typingSince || !chat.code || !state.uid) return;
  typingSince = 0;
  remove(dbRef(`${C(chat.code)}/typing/${state.uid}`)).catch(() => {});
}

// ---------------------------------------------------------------- host: system lines, pruning, clearing
const SYS_MAX = 80;
export function system(kind, text, key = null) {
  if (!state.code || !isHost()) return Promise.resolve();
  const k = key || push(dbRef(`${C(state.code)}/m`)).key;
  return set(dbRef(`${C(state.code)}/m/${k}`), { s: kind, x: String(text).slice(0, SYS_MAX), at: serverTimestamp() }).catch(() => {});
}

export async function clearChat() {
  if (!state.code || !isHost()) return;
  await remove(dbRef(`${C(state.code)}/m`)).catch(e => console.warn('clear chat', e));
  await system('clear', 'The host cleared the chat');
}

let watch = null;         // host's view of the room last tick: { code, host, players, online, lost }
let lastPrune = 0;
const announcedWins = new Set();
const nameOf = (players, uid) => (players[uid] && players[uid].name) || 'A player';

/** Called by host.js on every tick (every client; only the host writes). */
export function hostTick() {
  if (!state.code || !state.meta) { watch = null; return; }
  const host = isHost();
  const players = state.players || {};
  const online = {};
  for (const uid of Object.keys(players)) online[uid] = !(state.presence[uid] && state.presence[uid].online === false);
  const prev = watch && watch.code === state.code ? watch : null;
  watch = { code: state.code, host: state.meta.hostId, players, online, lost: prev ? prev.lost : {}, since: prev ? prev.since : {} };
  if (!prev || !host) return; // the first look is a baseline; only the host speaks
  const now = Date.now();
  if (prev.host !== state.meta.hostId && state.meta.hostId === state.uid) system('host', `${nameOf(players, state.uid)} is now the host`);
  for (const uid of Object.keys(players)) if (!prev.players[uid]) system('join', `${nameOf(players, uid)} joined`);
  for (const uid of Object.keys(prev.players)) {
    if (players[uid]) continue;
    system(state.kicked && state.kicked[uid] ? 'kick' : 'left', `${nameOf(prev.players, uid)} ${state.kicked && state.kicked[uid] ? 'was removed by the host' : 'left the room'}`);
    delete watch.lost[uid];
  }
  // signal lost only after a few seconds offline (a refresh shouldn't spam the chat)
  for (const uid of Object.keys(players)) {
    if (!online[uid]) {
      watch.since[uid] = watch.since[uid] || now;
      if (!watch.lost[uid] && now - watch.since[uid] > 6000) { watch.lost[uid] = true; system('lost', `${nameOf(players, uid)} — signal lost`); }
    } else {
      delete watch.since[uid];
      if (watch.lost[uid]) { delete watch.lost[uid]; system('back', `${nameOf(players, uid)} reconnected`); }
    }
  }
  // the winner, once per match (a deterministic key: a new host never repeats it)
  const g = state.game;
  if (g && g.phase === 'final' && !announcedWins.has(g.matchId)) {
    announcedWins.add(g.matchId);
    const mod = GAME_MODULES[g.id];
    const ranks = mod && mod.finalRanks ? mod.finalRanks(g) : [];
    const winners = ranks.filter(r => r.rank === 1).map(r => nameOf(players, r.uid));
    const name = (GAMES.find(x => x.id === g.id) || {}).name || g.id;
    const line = winners.length === 1 ? `${winners[0]} won ${name}`
      : winners.length === 2 ? `${winners[0]} & ${winners[1]} tied for the win in ${name}`
        : `${winners.length}-way tie for the win in ${name}`;
    if (winners.length) system('win', line, `s-win-${g.matchId}`);
  }
  // keep the newest 100
  if (chat.code === state.code && chat.full && now - lastPrune > 20_000 && chat.msgs.length) {
    lastPrune = now;
    prune(chat.msgs[0].at).catch(() => {});
  }
}

async function prune(oldestKeptAt) {
  const snap = await get(query(dbRef(`${C(state.code)}/m`), orderByChild('at'), endAt(oldestKeptAt - 1), limitToFirst(200)));
  const patch = {};
  snap.forEach(c => { patch[`m/${c.key}`] = null; });
  if (Object.keys(patch).length) await update(dbRef(C(state.code)), patch);
}

/** Host: announce a new match (called from host.js#startGame). */
export const announceStart = (gameId, matchId) => {
  const name = (GAMES.find(x => x.id === gameId) || {}).name || gameId;
  return system('start', `${name} started`, `s-start-${matchId}`);
};

// test hooks (emulator runs only)
if (/[?&]emu\b/.test(location.search)) {
  window.__chat = {
    state: () => ({ code: chat.code, n: chat.msgs.length, loaded: chat.loaded, unread: chat.unread, open: chat.open, denied: chat.denied, locked: locked(), outbox: [...chat.outbox.values()].map(o => o.status), typing: Object.keys(chat.typing) }),
    msgs: () => chat.msgs.map(m => ({ u: m.u, t: m.t, s: m.s, x: m.x })),
    send: t => send(t),
    rawSend: t => { lastSendAt = 0; return send(t); },
    debug,
    goOffline, goOnline,
    write: (path, v) => set(dbRef(path), v).then(() => 'ok', e => String(e && e.message)),
  };
}
