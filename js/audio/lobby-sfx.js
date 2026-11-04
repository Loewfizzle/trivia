// LOBBY 2.0 A — THE LOBBY SOUNDS (Grok's — cut + levelled by scripts/build-lobby-sfx.py → audio/sfx/lb-*.mp3; docs/audio.md): one palette —
// lobbySfx('card-in' — a strip slides into the guest list · 'invite' — an invite goes out · 'friend' — a friend arrives in the line).
// Felt more than heard: through the engine's SFX bus (the SFX slider + mute apply), decoded once on first use. Audio is POLISH: before the
// unlock, muted, a missing file or a dead graph — nothing plays, nothing throws; everything works silent.
import { getContext, getSfxBus, isUnlocked } from './engine.js';

export const LB_SOUNDS = ['card-in', 'invite', 'friend'];
const GAIN = { 'card-in': 0.7, invite: 0.75, friend: 0.7 };
const bufs = new Map();
let bufCtx = null;
const last = {};

function load(name) {
  const ctx = getContext();
  if (!ctx) return null;
  if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
  if (bufs.has(name)) return bufs.get(name);
  const p = fetch(`/audio/sfx/lb-${name}.mp3`).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
    .then(a => new Promise((res, rej) => ctx.decodeAudioData(a, res, rej)))
    .then(b => { bufs.set(name, b); return b; })
    .catch(() => { bufs.set(name, null); return null; });
  bufs.set(name, p);
  return p;
}

/** Play one (never throws). A burst of the same sound (8 strips sliding in) plays once a beat: 'card-in' at most every 160 ms. */
export function lobbySfx(name, { gain = 1, rate = 1 } = {}) {
  try {
    if (!isUnlocked() || !LB_SOUNDS.includes(name)) return false;
    const now = performance.now();
    if (now - (last[name] || 0) < (name === 'card-in' ? 160 : 400)) return false;
    last[name] = now;
    const ctx = getContext(), bus = getSfxBus();
    const play = b => {
      if (!b || !ctx || ctx.state !== 'running') return;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b; s.playbackRate.value = rate;
      g.gain.value = (GAIN[name] || 0.7) * gain;
      s.connect(g); g.connect(bus || ctx.destination);
      s.start();
    };
    const b = load(name);
    if (b && typeof b.then === 'function') b.then(play); else play(b);
    return true;
  } catch { return false; }
}
