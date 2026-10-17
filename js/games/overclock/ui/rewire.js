// OVERCLOCK — REWIRE: rotate pipe tiles to power the core.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { rewirePower, rewireOk, REWIRE_SHAPES } from '../challenges.js';
import { fastButton } from '../shared.js';

export default function uiRewire(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-rewire');
  let idx = Math.min(1, Math.floor(chal.p));
  let solvedCount = Math.floor(chal.p);
  let pz, turns, vis, tiles, board, core, src, title;
  let pending = 0;
  const pipe = mask => {
    const seg = [];
    if (mask & 1) seg.push('<rect x="40" y="-2" width="20" height="52" rx="2"/>');
    if (mask & 2) seg.push('<rect x="50" y="40" width="52" height="20" rx="2"/>');
    if (mask & 4) seg.push('<rect x="40" y="50" width="20" height="52" rx="2"/>');
    if (mask & 8) seg.push('<rect x="-2" y="40" width="52" height="20" rx="2"/>');
    seg.push('<circle cx="50" cy="50" r="15"/>');
    return seg.join('');
  };
  const tileSvg = shape => `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="rw-dim">${pipe(REWIRE_SHAPES[shape])}</g><g class="rw-lit">${pipe(REWIRE_SHAPES[shape])}</g></svg>`;
  const save = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      const pw = rewirePower(pz, turns);
      api.progress(rewireOk(solvedCount, pw.reach), rewireOk(solvedCount, pw.reach), { rw: turns.join('') });
    }, 400);
  };
  const flow = (pw, animate) => {
    tiles.forEach((t, i) => {
      const on = pw.lit.has(i);
      t.style.setProperty('--d', animate && on ? `${pw.depth.get(i) * 70}ms` : '0ms');
      t.classList.toggle('is-lit', on);
    });
    src.classList.toggle('is-on', pw.lit.size > 0);
    core.classList.toggle('is-on', pw.solved);
  };
  const build = () => {
    pz = s.puzzles[idx];
    const saved = chal.extra.rw && chal.extra.rw.length === pz.n * pz.n && idx === Math.floor(chal.p) ? [...chal.extra.rw].map(Number) : null;
    turns = saved || pz.start.slice();
    vis = turns.slice();
    tiles = pz.tiles.map((shape, i) => {
      const t = fastButton('button.rw-tile', { 'aria-label': `Tile ${Math.floor(i / pz.n) + 1}-${(i % pz.n) + 1}` }, () => turn(i));
      t.innerHTML = tileSvg(shape);
      t.firstChild.style.transform = `rotate(${vis[i] * 90}deg)`;
      return t;
    });
    board = h('div.rw-grid', { style: { '--n': pz.n } }, tiles);
    src = h('div.rw-src', { style: { '--r': pz.src, '--n': pz.n }, 'aria-hidden': 'true' }, h('i'));
    core = h('div.rw-core', { style: { '--r': pz.core, '--n': pz.n }, 'aria-hidden': 'true' }, h('i'), h('span', 'CORE'));
    title = h('div.ch-prompt', `CIRCUIT ${idx + 1}/2 · ${pz.n}×${pz.n}`);
    wrap.replaceChildren(title, h('div.rw-frame', src, board, core), h('div.rw-hint', 'TAP A TILE TO ROTATE IT'));
    pulseClass(wrap, 'q-in');
    flow(rewirePower(pz, turns), false);
  };
  let busy = false;
  const turn = i => {
    if (chal.done || busy) return;
    vis[i] += 1;
    turns[i] = (turns[i] + 1) % 4;
    tiles[i].firstChild.style.transform = `rotate(${vis[i] * 90}deg)`;
    sfx('key');
    vibrate(5);
    const pw = rewirePower(pz, turns);
    flow(pw, true);
    if (pw.solved) {
      busy = true;
      solvedCount += 1;
      clearTimeout(pending);
      sfx(solvedCount >= 2 ? 'solve' : 'ocCorrect');
      vibrate([20, 40, 30]);
      wrap.classList.add('is-solved');
      if (solvedCount >= 2) { api.progress(2, 2, { rw: '' }, true, 1300); return; }
      api.progress(rewireOk(1, 0), 1, { rw: '' });
      setTimeout(() => { busy = false; wrap.classList.remove('is-solved'); idx = 1; chal.extra.rw = ''; build(); }, 1100);
    } else save();
  };
  build();
  return { el: wrap, destroy() { clearTimeout(pending); } };
}
