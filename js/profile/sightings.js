// CITY SIGHTINGS from this phone (PROGRESSION B) — the claim after a tap on a legendary (api/_lib/sightings.js decides; the phone only says
// WHAT + WHEN on the server's clock + its zone). Polish: with /api down (or no profile yet) the tap still plays everything; the claim
// waits in a small queue (localStorage, ≤ 20, ≤ core/sightings.js#QUEUE_MS old) and goes the next time a claim does / the title opens.
// A PREVIEW NEVER CLAIMS (a &force= / &when= / &tz= page, the preview panel): the caller passes live:false.
//   claimSighting({ id, t, tz, live }) → { state: 'counted' | 'again' | 'queued' | 'refused' | 'preview', r? (the server's answer) }
//   flushSightings() → the queued claims' answers (each that unlocked something says so: a toast)
import { api } from './api.js';
import { myPid } from './me.js';
import { lazyImport } from '../ui/lazy-import.js';

// (FR7 FIXES B: QAGE = core/sightings.js#QUEUE_MS — 15 min; a 'no_stamp' answer (the server's city-open stamp hasn't caught up) is KEPT +
//  retried: on 'online', after the city's next hello (harbor/remote.js), the next claim)
const QKEY = 'nd:sg-q', QMAX = 20, QAGE = 15 * 60e3;
const retryLater = r => !!(r && r.ok === false && r.why === 'no_stamp');
const readQ = () => { try { const v = JSON.parse(localStorage.getItem(QKEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const writeQ = q => { try { localStorage.setItem(QKEY, JSON.stringify(q.slice(-QMAX))); } catch { /* private mode: lost — polish */ } };

async function send(c) {
  return api('profile', { action: 'sighting', id: c.id, t: Math.round(c.t), tz: c.tz });
}
/** offline / the server down / no profile → keep it for later; a real refusal (4xx with an answer) → dropped */
const keepFor = e => !e || e.status === 0 || e.status >= 500 || e.code === 'no_profile';

export async function claimSighting({ id, t, tz, live = true }) {
  if (!live) return { state: 'preview' };
  const c = { id, t, tz };
  if (!myPid()) { writeQ([...readQ(), c]); return { state: 'queued' }; }
  try {
    const r = await send(c);
    if (retryLater(r)) { writeQ([...readQ(), c]); return { state: 'queued', r }; }
    flushSightings().catch(() => {});
    if (!r || !r.ok) return { state: 'refused', r };
    return { state: r.counted ? 'counted' : 'again', r };
  } catch (e) {
    if (keepFor(e)) { writeQ([...readQ(), c]); return { state: 'queued' }; }
    return { state: 'refused', r: e && e.body };
  }
}

let flushing = null;
export function flushSightings() {
  if (flushing) return flushing;
  flushing = (async () => {
    const q = readQ().filter(c => c && Date.now() - c.t < QAGE);
    if (!q.length || !myPid()) { writeQ(q); return []; }
    const left = [], out = [];
    for (const c of q) {
      try { const r = await send(c); if (retryLater(r)) { left.push(c); continue; } out.push(r); if (r && r.counted && r.items && r.items.length) told(r, c.id); }
      catch (e) { if (keepFor(e)) left.push(c); }
    }
    writeQ(left);
    return out;
  })().finally(() => { flushing = null; });
  return flushing;
}

/** a queued sighting that unlocked its pair later: a quiet toast + the bell (the reveal plays only live) */
async function told(r, id) {
  try {
    const [{ SIGHTING }, { toast }, { pgSfx }] = await Promise.all([lazyImport(import('../core/sightings.js'), '../core/sightings.js'), lazyImport(import('../ui/toast.js'), '../ui/toast.js'), lazyImport(import('../audio/progress-sfx.js'), '../audio/progress-sfx.js')]);
    const s = SIGHTING[id];
    if (!s || !r.first) return;
    toast(`SPOTTED · ${s.name}`, 'ok', 4800);
    pgSfx('achievement');
  } catch { /* polish */ }
}
// (FR7 FIXES B: back online → the queue goes)
if (typeof window !== 'undefined') window.addEventListener('online', () => { flushSightings().catch(() => {}); });
