// OVERCLOCK's sounds (OC1 — the owner's Grok set: scripts/build-oc-sfx.py → audio/sfx/overclock/*.mp3, mono 96 kbps, Grok's four loudness tiers
// kept; credits.txt beside them). Felt more than heard: through the console's engine (its SFX bus — the SFX slider + THE ONE MUTE apply; the
// console owns the unlock-on-tap). Audio is POLISH: before the unlock, muted, a missing file or a dead graph — nothing plays, nothing throws.
// preloadSounds() FETCHES the bytes during the walk inside (no AudioContext needed: they decode on first use).
//   ocSfx(name, { gain }) → bool        ocSfxBytes(names) → Promise   (index.js#preload)
// A name can be a SLICE of a file: 07-321-go.mp3 = three beeps 0.35 s apart + a hit at 1.05 s — faster than the slam's 3 · 2 · 1 (one a
// second), so each number plays the beep alone and GO plays the hit.
import { getContext, getSfxBus, isUnlocked } from '../../audio/engine.js';

const DIR = new URL('../../../audio/sfx/overclock/', import.meta.url);
// name → [file, gain, offset s, duration s, min gap ms]
export const OC_SOUNDS = Object.freeze({
  correct: ['01-correct', 0.55, 0, 0, 60],
  wrong: ['02-wrong', 0.55, 0, 0, 60],
  combo2: ['03-combo-x2', 0.5, 0, 0, 200],
  combo3: ['03-combo-x3', 0.5, 0, 0, 200],
  combo5: ['03-combo-x5', 0.55, 0, 0, 200],
  tick: ['04-tick', 0.6, 0, 0, 300],
  tickUrgent: ['05-tick-urgent', 0.6, 0, 0, 300],
  timesUp: ['06-times-up', 0.5, 0, 0, 800],
  count: ['07-321-go', 0.5, 0, 0.3, 300],
  go: ['07-321-go', 0.55, 1.03, 0.65, 300],
  intro: ['08-challenge-intro', 0.42, 0.28, 0, 600],
  tap: ['09-tap', 0.55, 0, 0, 50],
  submit: ['11-submit', 0.5, 0, 0, 120],
  // OC2 — THE RESULTS FLOW: the round winner's stamp, the standings' re-sort, a climb, THE WINNER's sign powering up (17 — the owner's main
  // fanfare, never the rejected -b)
  stamp: ['18-bonus', 0.45, 0, 0, 300],
  swoosh: ['15-standings-swoosh', 0.42, 0, 0, 400],
  rankUp: ['16-rank-up', 0.4, 0, 0, 600],
  fanfare: ['17-winner-fanfare', 0.5, 0, 0, 3000],
});
/** the files this pass plays (the rest of the set waits for its pass — OC2 … OC5) */
export const OC1_FILES = [...new Set(Object.values(OC_SOUNDS).map(s => s[0]))];

const bytes = new Map();    // file → Promise<ArrayBuffer | null>
const bufs = new Map();     // file → AudioBuffer | Promise | null (per context)
let bufCtx = null;
const last = {};

const fetchBytes = file => {
  if (!bytes.has(file)) bytes.set(file, fetch(new URL(`${file}.mp3`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return bytes.get(file);
};
/** fetch these files' bytes now (the preload — no AudioContext needed) */
export const ocSfxBytes = (files = OC1_FILES) => Promise.all(files.map(fetchBytes));

function buffer(file) {
  const ctx = getContext();
  if (!ctx) return null;
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  if (bufs.has(file)) return bufs.get(file);
  const p = fetchBytes(file).then(a => (a ? new Promise((res, rej) => ctx.decodeAudioData(a.slice(0), res, rej)) : null))
    .then(b => { bufs.set(file, b); return b; }, () => { bufs.set(file, null); return null; });
  bufs.set(file, p);
  return p;
}

/** play one (never throws) */
export function ocSfx(name, { gain = 1 } = {}) {
  try {
    const def = OC_SOUNDS[name];
    if (!def || !isUnlocked()) return false;
    const [file, g0, offset, dur, gap] = def;
    const now = performance.now();
    if (now - (last[name] || 0) < gap) return false;
    last[name] = now;
    const ctx = getContext(), bus = getSfxBus();
    const play = b => {
      if (!b || !ctx || ctx.state !== 'running') return;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b;
      g.gain.value = g0 * gain;
      s.connect(g); g.connect(bus || ctx.destination);
      if (dur) s.start(0, offset, dur); else s.start(0, offset);
    };
    const b = buffer(file);
    if (b && typeof b.then === 'function') b.then(play); else play(b);
    return true;
  } catch { return false; }
}
