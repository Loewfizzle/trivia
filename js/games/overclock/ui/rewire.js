// OVERCLOCK — REWIRE: rotate the tiles to route power from the SOURCE to the CORE. OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"):
//   the board = dark GLASS TILES (≈ 75 pt at 4×4) each holding a section of GLASS NEON TUBE, UNLIT until it's connected to the source; a tap
//   ROTATES the tile (a snappy transform); a connected tube LIGHTS in the stage's colour (stage 1 ORANGE · stage 2 BLUE) with a live LIGHT FLOW
//   running through it from the source (each tube's flow layer pulses with a delay by its distance from the source — a wave travelling along
//   the circuit; opacity only, on HTML-wrapped layers); on completion a SURGE races source → core (a white-hot copy of every lit tube flashing
//   in order) and THE CORE BLAZES. Rules + timings unchanged (the saves 400 ms after a turn, the next circuit 1100 ms after the first, the
//   done screen 1300 ms after the last; rewirePower / rewireOk are the scoring's).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { rewirePower, rewireOk, REWIRE_SHAPES } from '../challenges.js';
import { fastButton } from '../shared.js';

export const RW_SURGE_STEP = 55;   // ms per step of the surge (source → core) …
export const RW_SURGE_MAX = 760;   // … the core reached by then whatever the path's length (the next circuit comes at 1100 ms — unchanged)
export const surgeStep = far => Math.min(RW_SURGE_STEP, Math.floor(RW_SURGE_MAX / (far + 1)));
/** the tube's path for a shape in its base orientation (the tile turns it): I = straight N–S; L = N → E BENT like real neon (a quarter arc
 *  round the tile's corner — it leaves each edge square, so it meets the next tile's tube); T = straight N–S + an arm east from a joint */
export const tubePath = shape => (shape === 'I' ? 'M50 -2V102' : shape === 'L' ? 'M50 -2V0A50 50 0 0 0 100 50H102' : 'M50 -2V102M50 50H102');
const JOINT = { T: true };
// a tube drawn as stacked strokes (outer → inner): [colour, width, opacity]; the joint at the centre a disc of the same layers
const LAYERS = {
  dim: [['#323a49', 21, 1], ['#191d26', 13, 1], ['#4a5367', 3, 0.9]],               // unlit glass: the body, its dark inside, a cold highlight
  lit: [['currentColor', 38, 0.09], ['currentColor', 27, 0.16], ['currentColor', 15, 1], ['#fff3e6', 5, 1]],   // lit: a soft two-step glow, the coloured tube, the white-hot core
  flow: [['#ffffff', 9, 0.95]],                                                     // the light running through it
  surge: [['#ffffff', 22, 0.55], ['#ffffff', 12, 1]],                               // the surge: the whole tube white-hot
};
const svg = (d, cls, joint) => `<svg viewBox="0 0 100 100" aria-hidden="true" class="${cls}">${LAYERS[cls.replace('oc-wire-', '').replace('-svg', '')].map(([c, w, o]) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}"/>${joint ? `<circle cx="50" cy="50" r="${(w / 2 + 3.5).toFixed(1)}" fill="${c}" fill-opacity="${o}"/>` : ''}`).join('')}</svg>`;
/**
 * one tile's glass + tube layers: the unlit glass tube (a dark body, a faint inner core, a highlight), the LIT tube (its glow, the coloured
 * tube, the white-hot core — a static picture, its opacity switches), the FLOW layer (a bright core whose opacity pulses) + the SURGE copy.
 * Every moving layer is an HTML element wrapping its SVG (never a CSS animation on an SVG element). → { el (the turning part), ... }
 */
export function tubeLayers(shape) {
  const d = tubePath(shape);
  const rot = h('i.oc-wire-rot', { html: svg(d, 'oc-wire-dim', JOINT[shape]) },
    h('i.oc-wire-lit', { html: svg(d, 'oc-wire-lit-svg', JOINT[shape]) }),
    h('i.oc-wire-flow', { html: svg(d, 'oc-wire-flow-svg', JOINT[shape]) }),
    h('i.oc-wire-surge', { html: svg(d, 'oc-wire-surge-svg', JOINT[shape]) }));
  return rot;
}
/** the source plug + the core (shared with the demo + THE ANSWER's boards) */
export const rwSource = (row, n) => h('i.oc-wire-src', { style: { '--r': row, '--n': n }, 'aria-hidden': 'true' }, h('i.oc-wire-lead'), h('i.oc-wire-plug'));
export const rwCore = (row, n) => h('i.oc-wire-core', { style: { '--r': row, '--n': n }, 'aria-hidden': 'true' }, h('i.oc-wire-lead'), h('i.oc-wire-ring', h('i.oc-wire-ring-glow'), h('i.oc-wire-ring-hot')), h('b.oc-wire-core-k', 'CORE'));

export default function uiRewire(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.oc-wire.oc-ownbar');
  let idx = Math.min(1, Math.floor(chal.p));
  let solvedCount = Math.floor(chal.p);
  let pz, turns, vis, tiles, rots, core, src, board;
  let pending = 0, timer = 0;
  const segs = [h('i'), h('i')];
  const bar = h('div.oc-segbar.oc-wire-bar', { 'aria-hidden': 'true' }, segs);
  const qn = h('b', '1');
  const sizeK = h('span.oc-wire-size');
  const save = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      const pw = rewirePower(pz, turns);
      api.progress(rewireOk(solvedCount, pw.reach), rewireOk(solvedCount, pw.reach), { rw: turns.join('') });
    }, 400);
  };
  const paintBar = () => segs.forEach((g, i) => { g.className = i < solvedCount ? 'is-on' : i === idx ? 'is-cur' : ''; });
  const flow = pw => {
    tiles.forEach((t, i) => {
      const on = pw.lit.has(i);
      t.style.setProperty('--fd', `${on ? pw.depth.get(i) * 110 : 0}ms`);
      t.classList.toggle('is-lit', on);
    });
    src.classList.toggle('is-on', pw.lit.size > 0);
    core.classList.toggle('is-on', pw.solved);
    // THE FLOW restarts in step on every turn (one reflow per tap — an event): the wave leaves the source again through the new circuit
    if (board) { board.classList.remove('is-flowing'); void board.offsetWidth; board.classList.add('is-flowing'); }
  };
  const build = () => {
    pz = s.puzzles[idx];
    const saved = chal.extra.rw && chal.extra.rw.length === pz.n * pz.n && idx === Math.floor(chal.p) ? [...chal.extra.rw].map(Number) : null;
    turns = saved || pz.start.slice();
    vis = turns.slice();
    rots = [];
    tiles = pz.tiles.map((shape, i) => {
      const rot = tubeLayers(shape);
      rot.style.transform = `rotate(${vis[i] * 90}deg)`;
      rots.push(rot);
      return fastButton('button.oc-wire-tile', { 'aria-label': `Tile ${Math.floor(i / pz.n) + 1}-${(i % pz.n) + 1}` }, () => turn(i), h('i.oc-wire-glass'), rot);
    });
    const grid = h('div.oc-wire-grid', { style: { '--n': pz.n } }, tiles);
    src = rwSource(pz.src, pz.n);
    core = rwCore(pz.core, pz.n);
    board = h('div.oc-wire-board', { class: idx ? 'is-blue' : 'is-orange', style: { '--n': pz.n } }, src, grid, core);
    qn.textContent = String(idx + 1);
    sizeK.textContent = `${pz.n}×${pz.n}`;
    paintBar();
    wrap.replaceChildren(
      h('div.oc-qhead', h('span.oc-chip', 'CIRCUIT ', sizeK), h('span.oc-qn', qn, ' / 2')),
      bar,
      h('p.oc-q.oc-wire-q', 'ROUTE THE POWER TO THE CORE'),
      board,
      h('p.oc-wire-hint', 'TAP A TILE TO TURN IT'));
    pulseClass(board, 'q-in');
    flow(rewirePower(pz, turns));
  };
  let busy = false;
  const turn = i => {
    if (chal.done || busy) return;
    vis[i] += 1;
    turns[i] = (turns[i] + 1) % 4;
    rots[i].style.transform = `rotate(${vis[i] * 90}deg)`;
    sfx('key');
    vibrate(5);
    const pw = rewirePower(pz, turns);
    flow(pw);
    if (pw.solved) {
      busy = true;
      solvedCount += 1;
      clearTimeout(pending);
      sfx(solvedCount >= 2 ? 'solve' : 'ocCorrect');
      vibrate([20, 40, 30]);
      surge(pw);
      paintBar();
      if (solvedCount >= 2) { api.progress(2, 2, { rw: '' }, true, 1300); return; }
      api.progress(rewireOk(1, 0), 1, { rw: '' });
      timer = setTimeout(() => { busy = false; idx = 1; chal.extra.rw = ''; build(); }, 1100);
    } else save();
  };
  // THE SURGE: every lit tube flashes white-hot in order from the source, then the core blazes (the board's own classes — CSS keyframes on
  // HTML layers, transform + opacity)
  const surge = pw => {
    let far = 0;
    for (const i of pw.lit) far = Math.max(far, pw.depth.get(i));
    const step = surgeStep(far);
    for (const i of pw.lit) tiles[i].style.setProperty('--sd', `${pw.depth.get(i) * step}ms`);
    core.style.setProperty('--sd', `${(far + 1) * step}ms`);
    board.classList.add('is-surge');
  };
  build();
  return { el: wrap, destroy() { clearTimeout(pending); clearTimeout(timer); } };
}
