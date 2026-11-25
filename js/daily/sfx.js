// THE DAILIES' SOUND ENGINE (DFIX1 — one engine for THE PASSWORD + COAST CLEAR; was COAST CLEAR's CC2 sfx.js). Each game keeps its own TABLE
// (password/sfx.js, coastclear/sfx.js); this plays it through the console's engine (its SFX bus — the SFX slider + THE ONE MUTE apply; the
// console owns the unlock-on-tap: audio/engine.js#installAudio — a page without it is silent by construction). Audio is POLISH: before the
// unlock, muted, a missing file or a dead graph — nothing plays, nothing throws.
//   THE FIRST-TAP CATCH (iOS): a sound asked for while the context is still waking from the tap that unlocks it (THE PASSWORD's keys fire on
//   pointerdown, iOS unlocks on the later touchend; resume() is async after that) is held ≤ CATCH_MS and played the moment the context runs —
//   never lost, never late beyond that; no gesture at all = it simply expires (a sound never plays without a gesture behind it).
//   DECODE AT UNLOCK: once the audio unlocks every game's buffers decode at once (ONE module-level unlock hook), so a first sound never waits.
// (THE GARDEN PARTY PASS — HEAR THE HARBOR: the music off is 'playback' too now, so the effects sound with the ring / silent switch on; ALL OFF = none.)
//   const s = createDailySfx({ dir: URL, sounds: { name: [file, gain, gap ms, offset s?, dur s?] } })
//   s.play(name, { gain }) → bool · s.bytes() → Promise (fetch every file now — no AudioContext needed) · s.played() → [{ name, at }] (the test hook)
import { getContext, getSfxBus, isUnlocked, audioUnlocked, onUnlock } from '../audio/engine.js';

export const CATCH_MS = 400;

const engines = new Set();   // every game's engine — the one unlock hook decodes them all + plays a held sound
let hooked = false;
function hookUnlock() {
  if (hooked) return;
  hooked = true;
  try { onUnlock(() => { for (const e of engines) e.unlocked(); }); } catch { /* no engine */ }
}

const RETRY_MS = 8000, retryLater = (map, k, was) => setTimeout(() => { if (map.get(k) === was) map.delete(k); }, RETRY_MS);
export function createDailySfx({ dir, sounds }) {
  const files = [...new Set(Object.values(sounds).map(s => s[0]))];
  const bytesOf = new Map();   // file → Promise<ArrayBuffer | null>
  const bufs = new Map();      // file → AudioBuffer | Promise | null (per context)
  let bufCtx = null, held = null, decodeOnUnlock = false;
  const last = {};
  const log = [];

  const fetchBytes = file => {
    // (THE AUDIO FIXES, Nov 25: a FAILED fetch / decode is not kept for the session — forgotten RETRY_MS later, the next ask loads again)
    if (!bytesOf.has(file)) { const p = fetch(new URL(`${file}.mp3`, dir)).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null).then(a => { if (!a) retryLater(bytesOf, file, p); return a; }); bytesOf.set(file, p); }
    return bytesOf.get(file);
  };
  function buffer(file) {
    const ctx = getContext();
    if (!ctx) return null;
    if (bufCtx !== ctx) { bufs.clear(); bufCtx = ctx; }
    if (bufs.has(file)) return bufs.get(file);
    const p = fetchBytes(file).then(a => (a ? new Promise((res, rej) => { const q = ctx.decodeAudioData(a.slice(0), res, rej); if (q && q.catch) q.catch(rej); }) : null))
      .then(b => b || null, () => null)
      .then(b => { if (bufs.get(file) === p) { bufs.set(file, b); if (!b) { retryLater(bufs, file, null); retryLater(bytesOf, file, bytesOf.get(file)); } } return b; });
    bufs.set(file, p);
    return p;
  }
  function start(name, gain) {
    const [file, g0, , offset = 0, dur = 0] = sounds[name];
    const ctx = getContext(), bus = getSfxBus();
    const play = b => {
      if (!b || !ctx || !isUnlocked()) return;   // (CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP: an effect asks isUnlocked() — THE ONE GATE (engine.js), never the context's state)
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = b;
      g.gain.value = g0 * gain;
      s.connect(g); g.connect(bus || ctx.destination);
      if (dur) s.start(0, offset, dur); else s.start(0, offset);
      log.push({ name, at: Math.round(performance.now()) }); if (log.length > 60) log.shift();
    };
    const b = buffer(file);
    if (b && typeof b.then === 'function') b.then(play); else play(b);
  }
  /** the held sound, the moment the context runs (within CATCH_MS of being asked for) */
  function go() {
    const ctx = getContext();
    if (!held || !ctx || !isUnlocked() || !audioUnlocked()) return;   // (CITY PART 1 — SILENT WITH MUSIC OFF, THE SWEEP: an effect asks isUnlocked() — THE ONE GATE (engine.js), never the context's state)
    const h0 = held; held = null;
    if (performance.now() - h0.at <= CATCH_MS) start(h0.name, h0.gain);
  }
  function hold(name, gain) {
    const at = performance.now();
    held = { name, gain, at };
    hookUnlock();
    try { const ctx = getContext(); if (ctx) ctx.addEventListener('statechange', go, { once: true }); } catch { /* old Safari */ }
    for (const ms of [40, 120, 220, 320]) setTimeout(go, ms);
    setTimeout(() => { go(); if (held && held.at === at) held = null; }, CATCH_MS);
    return true;
  }
  const engine = {
    unlocked() { if (decodeOnUnlock) for (const f of files) buffer(f); setTimeout(go, 0); },
  };
  engines.add(engine);

  return {
    /** fetch every file's bytes now (the mount) + decode them all the moment the audio unlocks */
    bytes() { decodeOnUnlock = true; hookUnlock(); try { if (isUnlocked()) for (const f of files) buffer(f); } catch { /* fine */ } return Promise.all(files.map(fetchBytes)); },
    /** play one (never throws) */
    play(name, { gain = 1 } = {}) {
      try {
        const def = sounds[name];
        if (!def) return false;
        const gap = def[2], now = performance.now();
        if (gap && now - (last[name] || 0) < gap) return false;
        last[name] = now;
        if (!isUnlocked()) return hold(name, gain);
        start(name, gain);
        return true;
      } catch { return false; }
    },
    /** the test hook: the sounds that actually started on the context (name + when) */
    played: () => log.slice(),
  };
}
