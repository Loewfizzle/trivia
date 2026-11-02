// DESKTOP Group 1 — THE CRATE GUY's REWORK (the owner's WINDOWS review: "very jittery + snappy"): his whole shift sampled at 30 fps through
// the REAL painter (screens/harbor/crate.js, on a canvas that draws nothing) — no joint may jump between two frames, his facing never flips,
// he never teleports between jobs (only off-screen, fetching a crate). node --test tests/harbor-crate-motion.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { crateRoom } from '../js/screens/harbor/crate.js';
import { SCENE_TIMING } from '../js/core/harbor-scenes.js';

// a 2D context that accepts every call + property and draws nothing
const noop = () => {};
const grad = { addColorStop: noop };
const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : k === 'getTransform' ? () => ({ a: 1, b: 0 }) : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => grad : noop), set: (o, k, v) => { o[k] = v; return true; } });
const G = { cw: 1, ch: 1.2, g0: 0, h0: 0, h1: 1.2 };
const T = SCENE_TIMING.crate, LEN = 2 * 3600;
const at = (phase, s) => {
  const st = phase === 'enter' ? { phase, t: s, sec: T.up + s, workLen: LEN } : phase === 'work' ? { phase, work: s, sec: T.up + T.enter + s, workLen: LEN } : { phase, t: s, sec: T.up + T.enter + LEN + s, workLen: LEN, pull: 0, shade: 0 };
  return crateRoom({ c: ctx, G, t: st.sec, mo: true }, st, { key: '2026-11-04', seed: 1924 });
};

test('THE CRATE GUY — ONE CONTINUOUS MOTION: no joint jumps between frames over his whole shift, no facing flips, no teleports', () => {
  const dt = 1 / 30, frames = [];
  for (let s = 0; s < T.enter; s += dt) frames.push(at('enter', s));
  for (let s = 0; s < LEN; s += dt) frames.push(at('work', s));
  for (let s = 0; s < T.exit - T.pull - 0.5; s += dt) frames.push(at('exit', s));
  let worstJ = 0, worstAt = '', worstF = 0, worstX = 0;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    if (!a.pts || !b.pts) continue;                                   // (out of view, fetching a crate)
    for (let k = 0; k < a.pts.length; k++) { const d = Math.hypot(b.pts[k][0] - a.pts[k][0], b.pts[k][1] - a.pts[k][1]); if (d > worstJ) { worstJ = d; worstAt = `${b.phase} ${b.job} frame ${i} joint ${k}`; } }
    worstF = Math.max(worstF, Math.abs(b.face - a.face)); worstX = Math.max(worstX, Math.abs(b.x - a.x));
  }
  // (a brisk walk moves a foot ~0.02 of the pane a frame; a snap between poses was 0.1–0.4)
  assert.ok(worstJ < 0.035, `the biggest joint jump between two frames ${worstJ.toFixed(3)} of the pane (${worstAt})`);
  assert.ok(worstF < 0.12, `his facing never flips (the biggest change a frame ${worstF.toFixed(3)})`);
  assert.ok(worstX < 0.02, `he never teleports (the biggest step a frame ${worstX.toFixed(3)} of the pane)`);
});
