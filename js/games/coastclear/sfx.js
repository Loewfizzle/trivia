// COAST CLEAR's sounds (CC2 — the dailies chat's Grok set 12–19: scripts/build-cc-sfx.py → audio/sfx/coastclear/*.mp3, mono 96 kbps; credits.txt
// beside them + ☰ → CREDITS). Quiet-leaning — OK in bed: through the console's engine (its SFX bus — the SFX slider + THE ONE MUTE apply; the
// console owns the unlock-on-tap: audio/engine.js#installAudio). Audio is POLISH: before the unlock, muted, a missing file or a dead graph —
// nothing plays, nothing throws. Modelled on THE PASSWORD's sfx.js, plus THE FIRST-TAP CATCH (iOS): a sound asked for while the context is
// still waking from the tap that unlocked it (resume() is async) is held ≤ 400 ms and played the moment the context runs — never lost, never
// late beyond that; and once the audio unlocks every buffer is decoded at once, so the first dig never waits on a decode.
//   ccSfx(name, { gain }) → bool        ccSfxBytes() → Promise
// THE MAP: dig (a single cell) · flood (a calm area) · buoy / unbuoy · mode (the DIG / BUOY switch) · spotted (with the sweep) · caught (the
// third light — never louder than the win) · win (COAST CLEAR, with the lighthouse sweep).
import { getContext, getSfxBus, isUnlocked, audioUnlocked, onUnlock } from '../../audio/engine.js';

const DIR = new URL('../../../audio/sfx/coastclear/', import.meta.url);
// name → [file, gain, min gap ms]   (the level trims are baked in at import — build-cc-sfx.py: mode +4 dB, caught −5 dB + a low cut ~120 Hz)
export const CC_SOUNDS = Object.freeze({
  dig: ['12-dig', 0.42, 45],
  flood: ['13-open-area', 0.45, 120],
  buoy: ['14-buoy-place', 0.45, 40],
  unbuoy: ['15-buoy-remove', 0.42, 40],
  mode: ['16-mode-toggle', 0.5, 60],
  spotted: ['17-spotted', 0.42, 300],          // (a short siren blip)
  caught: ['18-caught', 0.62, 1500],           // (firmer — still ~5 LU under the win: build-cc-sfx.py measured −26.3 vs −20 LUFS)
  win: ['19-coast-clear-win', 0.55, 2000],
});
export const CC_FILES = [...new Set(Object.values(CC_SOUNDS).map(s => s[0]))];
export const CATCH_MS = 400;

const bytes = new Map();    // file → Promise<ArrayBuffer | null>
const bufs = new Map();     // file → AudioBuffer | Promise | null (per context)
let bufCtx = null, held = null, hooked = false;
const last = {};
const played = [];          // the test hook: what played (name, ms)

const fetchBytes = file => {
  if (!bytes.has(file)) bytes.set(file, fetch(new URL(`${file}.mp3`, DIR)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return bytes.get(file);
};
/** fetch every file's bytes now (the mount — no AudioContext needed) + decode them all the moment the audio unlocks */
export function ccSfxBytes(files = CC_FILES) {
  if (!hooked) { hooked = true; try { onUnlock(() => { for (const f of CC_FILES) buffer(f); }); } catch { /* no engine */ } }
  return Promise.all(files.map(fetchBytes));
}

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
function start(name, gain) {
  const [file, g0] = CC_SOUNDS[name];
  const ctx = getContext(), bus = getSfxBus();
  const play = b => {
    if (!b || !ctx || ctx.state !== 'running') return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b;
    g.gain.value = g0 * gain;
    s.connect(g); g.connect(bus || ctx.destination);
    s.start(0);
    played.push({ name, at: Math.round(performance.now()) }); if (played.length > 60) played.shift();
  };
  const b = buffer(file);
  if (b && typeof b.then === 'function') b.then(play); else play(b);
}
/**
 * THE FIRST-TAP CATCH: the audio isn't running YET — iOS sends a tap's pointerup BEFORE the touchend that unlocks it (audio/engine.js), and the
 * context's resume() is async after that — so hold this ONE sound ≤ CATCH_MS and play it the moment the context runs. No tap at all = it
 * simply expires (a sound never plays without a gesture behind it).
 */
function go() {
  const ctx = getContext();
  if (!held || !ctx || ctx.state !== 'running' || !audioUnlocked()) return;
  const h0 = held; held = null;
  if (performance.now() - h0.at <= CATCH_MS) start(h0.name, h0.gain);
}
let unlockHooked = false;
function hold(name, gain) {
  const at = performance.now();
  held = { name, gain, at };
  if (!unlockHooked) { unlockHooked = true; try { onUnlock(() => setTimeout(go, 0)); } catch { /* no engine */ } }
  try { const ctx = getContext(); if (ctx) ctx.addEventListener('statechange', go, { once: true }); } catch { /* old Safari */ }
  for (const ms of [40, 120, 220, 320]) setTimeout(go, ms);
  setTimeout(() => { go(); if (held && held.at === at) held = null; }, CATCH_MS);
  return true;
}

/** play one (never throws) */
export function ccSfx(name, { gain = 1 } = {}) {
  try {
    const def = CC_SOUNDS[name];
    if (!def) return false;
    const gap = def[2], now = performance.now();
    if (gap && now - (last[name] || 0) < gap) return false;
    if (!isUnlocked()) return hold(name, gain) && ((last[name] = now), true);
    last[name] = now;
    start(name, gain);
    return true;
  } catch { return false; }
}
/** the test hook: the sounds that actually started on the context (name + when) */
export const ccSfxPlayed = () => played.slice();
