// Finished matches → the server, never lost and never counted twice.
// Every phone in a match queues one report when the podium appears (the host's and the others' are the same request:
// the server counts the first and hands everyone their own outcome). The queue lives in localStorage, so a phone that
// was offline, locked or refreshed sends it later; the server keys every match (room + match id) and every player's
// stats remember the matches they already hold, so retries are harmless.
//
//   queueReport(code, game)   once per match (the podium)
//   onOutcome(fn)             fn(key, outcome) when the server answers (the results callouts listen)
//   outcomeFor(key)           an outcome already received (refresh on the podium)
import { api } from './api.js';
import { loadQueue, saveQueue, loadDone, saveDone } from '../identity.js';
import { firebaseReady } from '../firebase.js';
import { countMatch, applyOutcome } from './me.js';

const MAX_AGE = 5 * 3600_000;
const SNAP_MAX = 250_000;
const listeners = new Set();
const outcomes = new Map();
let timer = 0;
let busy = false;

export const matchKey = (code, matchId) => `${code}_${matchId}`;

export function queueReport(code, game) {
  if (!code || !game || !game.matchId) return;
  const k = matchKey(code, game.matchId);
  const q = loadQueue();
  if (q.some(x => x.k === k) || loadDone().includes(k)) return;
  let snap = null;
  try { const s = JSON.stringify(game); if (s.length < SNAP_MAX) snap = JSON.parse(s); } catch { snap = null; }
  q.push({ k, code, matchId: game.matchId, snap, at: Date.now(), n: 0, next: 0 });
  saveQueue(q);
  countMatch();
  flush();
}

export function onOutcome(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function outcomeFor(k) {
  if (outcomes.has(k)) return outcomes.get(k);
  try { const s = sessionStorage.getItem(`rc:${k}`); return s ? JSON.parse(s) : null; } catch { return null; }
}
export const pending = k => loadQueue().some(x => x.k === k);

function deliver(k, outcome) {
  outcomes.set(k, outcome);
  applyOutcome(outcome);
  try { sessionStorage.setItem(`rc:${k}`, JSON.stringify(outcome)); } catch { /* fine */ }
  for (const fn of listeners) { try { fn(k, outcome); } catch (e) { console.warn('outcome', e); } }
}

function done(k) {
  const d = loadDone().filter(x => x !== k);
  d.push(k);
  saveDone(d.slice(-60));
  saveQueue(loadQueue().filter(x => x.k !== k));
}

const backoff = n => Math.min(5 * 60_000, 2500 * 2 ** n);

export async function flush(force = false) {
  if (busy) return;
  busy = true;
  try {
    await firebaseReady;
    for (const item of loadQueue()) {
      if (Date.now() - item.at > MAX_AGE) { done(item.k); continue; }
      if (!force && item.next > Date.now()) continue;
      try {
        const r = await api('report', { code: item.code, matchId: item.matchId, snap: item.snap || undefined });
        if (r.ok === false && r.retry) throw Object.assign(new Error(r.code), { status: 425 });   // still settling: soon
        done(item.k);
        deliver(item.k, r.ok === false ? { none: true, error: r.code } : r.outcome || { none: true });
      } catch (e) {
        const permanent = e.status >= 400 && e.status < 500 && ![401, 408, 425, 429].includes(e.status);
        if (permanent) { done(item.k); deliver(item.k, { none: true, error: e.code }); continue; }
        // unreachable / busy / not final yet: try again later (sooner while the match is still settling)
        const q = loadQueue();
        const x = q.find(y => y.k === item.k);
        if (x) { x.n += 1; x.next = Date.now() + (e.status === 425 ? 2000 : backoff(x.n)); saveQueue(q); }
      }
    }
  } finally {
    busy = false;
    schedule();
  }
}

function schedule() {
  clearTimeout(timer);
  const q = loadQueue();
  if (!q.length) return;
  const next = Math.max(800, Math.min(...q.map(x => x.next || 0)) - Date.now());
  timer = setTimeout(flush, Math.min(next, 60_000));
}

export function startQueue() {
  window.addEventListener('online', () => flush(true));   // the network is back: try now, not after the backoff
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') flush(); });
  flush();
}
