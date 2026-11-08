// THE PROGRESSION SOUNDS (PROGRESSION A) → THE PODIUM SOUNDS (FRIENDS B, Nov 8): Grok's NEW set (Downloads\grok\podium-sfx — warm jazzy-neon,
// no hiss; already cut + levelled by him, copied as-is → audio/sfx/pg-*.mp3; the old builder's set retired). One palette:
// pgSfx('xp-tick' | 'xp-total' | 'level-up' | 'medal-flip' | 'flame-on' | 'flash' | 'polaroid' | 'card-reveal' | 'achievement' | 'victory', { gain, rate }).
// 'victory' = the podium frame's winner sting (ui/final.js — was the synth arpeggio the owner heard as a hiss; a cartridge with
// OWN_VICTORY_SOUND skips it).
// Quiet + felt (CLAUDE.md): through the engine's SFX bus (the SFX slider + mute apply), decoded once on first use. Audio is POLISH: before
// the unlock, muted, missing files or a dead graph — nothing plays, nothing throws. `flash` + `polaroid` are PROGRESSION B's (the sightings'
// flashbulb) — shipped now so B just plays them.
import { getContext, getSfxBus, isUnlocked } from './engine.js';

export const PG_SOUNDS = ['xp-tick', 'xp-total', 'level-up', 'medal-flip', 'flame-on', 'flash', 'polaroid', 'card-reveal', 'achievement', 'victory'];
// the files' revision — bump on a new set so phones fetch it past the week-long audio cache (vercel.json)
export const PG_REV = 2;
// the house level of each on the SFX bus (the files are already quiet; the tick sits lowest — it repeats)
const GAIN = { 'xp-tick': 0.55, 'xp-total': 0.8, 'level-up': 0.8, 'medal-flip': 0.75, 'flame-on': 0.8, flash: 0.8, polaroid: 0.8, 'card-reveal': 0.85, achievement: 0.85, victory: 0.7 };
const bufs = new Map();      // name → AudioBuffer | Promise | null (failed)
let bufCtx = null;
const last = {};

function load(name) {
  const ctx = getContext();
  if (!ctx) return null;
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  if (bufs.has(name)) return bufs.get(name);
  const p = fetch(`/audio/sfx/pg-${name}.mp3?v=${PG_REV}`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
    .then(a => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej)))
    .then(b => { bufs.set(name, b); return b; })
    .catch(() => { bufs.set(name, null); return null; });
  bufs.set(name, p);
  return p;
}

/** Decode the moment's sounds ahead (the end-of-round moment calls this as it opens). */
export function pgPrefetch(names = PG_SOUNDS) { try { for (const n of names) load(n); } catch { /* polish */ } }

/** Play one (never throws). */
export function pgSfx(name, { gain = 1, rate = 1 } = {}) {
  try {
    if (!isUnlocked() || !PG_SOUNDS.includes(name)) return;
    const now = performance.now();
    if (now - (last[name] || 0) < (name === 'xp-tick' ? 40 : 90)) return;   // (de-dupe a burst)
    last[name] = now;
    const ctx = getContext(), bus = getSfxBus();
    const play = b => {
      if (!b || !ctx || ctx.state !== 'running') return;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b; s.playbackRate.value = rate;
      g.gain.value = (GAIN[name] || 0.8) * gain;
      s.connect(g); g.connect(bus || ctx.destination);
      s.start();
    };
    const b = load(name);
    if (b && typeof b.then === 'function') b.then(play); else play(b);
  } catch { /* polish */ }
}
