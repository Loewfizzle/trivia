// THE PASSWORD's sounds (PW2 — the dailies chat's Grok set: scripts/build-pw-sfx.py → audio/sfx/password/*.mp3, mono 96 kbps; credits.txt
// beside them + ☰ → CREDITS). Quiet-leaning — OK in bed: through the console's engine (its SFX bus — the SFX slider + THE ONE MUTE apply;
// the console owns the unlock-on-tap). Audio is POLISH: before the unlock, muted, a missing file or a dead graph — nothing plays, nothing
// throws. pwSfxBytes() FETCHES the bytes at mount (no AudioContext needed: they decode on first use). Modelled on OVERCLOCK's sfx.js.
//   pwSfx(name, { gain }) → bool        pwSfxBytes() → Promise
// THE MAP: tap · back · submit · hit / near / miss (one per flipping tile, as its mark lands) · refuse (the shake) · unlock + open (the door
// reveal) · win (YOU'RE IN) · fail (a held door).
import { getContext, getSfxBus, isUnlocked } from '../../audio/engine.js';

const DIR = new URL('../../../audio/sfx/password/', import.meta.url);
// name → [file, gain, offset s, duration s, min gap ms]
export const PW_SOUNDS = Object.freeze({
  tap: ['01-key-tap', 0.5, 0, 0, 40],
  back: ['02-key-delete', 0.5, 0, 0, 40],
  submit: ['03-guess-submit', 0.45, 0, 0, 150],
  hit: ['04-tile-hit', 0.42, 0, 0, 0],
  near: ['05-tile-near', 0.4, 0, 0, 0],
  miss: ['06-tile-miss', 0.4, 0, 0, 0],
  refuse: ['07-not-a-word', 0.5, 0, 0, 300],
  unlock: ['08-door-unlock', 0.55, 0, 0, 800],
  open: ['09-door-open', 0.5, 0, 0, 800],
  win: ['10-win-sting', 0.5, 0, 0, 2000],
  fail: ['11-fail', 0.5, 0, 0, 1500],
});
export const PW_FILES = [...new Set(Object.values(PW_SOUNDS).map(s => s[0]))];

const bytes = new Map();    // file → Promise<ArrayBuffer | null>
const bufs = new Map();     // file → AudioBuffer | Promise | null (per context)
let bufCtx = null;
const last = {};

const fetchBytes = file => {
  if (!bytes.has(file)) bytes.set(file, fetch(new URL(`${file}.mp3`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return bytes.get(file);
};
/** fetch every file's bytes now (the mount — no AudioContext needed) */
export const pwSfxBytes = (files = PW_FILES) => Promise.all(files.map(fetchBytes));

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
export function pwSfx(name, { gain = 1 } = {}) {
  try {
    const def = PW_SOUNDS[name];
    if (!def || !isUnlocked()) return false;
    const [file, g0, offset, dur, gap] = def;
    const now = performance.now();
    if (gap && now - (last[name] || 0) < gap) return false;
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
