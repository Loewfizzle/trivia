// OVERCLOCK — MEMORY SEQUENCE: watch the nodes, then repeat them.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';

export default function uiMemory(s, api) {
  const { chal } = api;
  const nodes = [];
  const grid = h('div.mem-grid');
  let mode = chal.p > 0 ? 'input' : 'watch';
  let pos = chal.p;
  const timers = [];
  const status = h('div.ch-prompt', mode === 'watch' ? 'WATCH THE SEQUENCE' : 'REPEAT IT');
  const counter = h('div.mem-count');
  const paintCount = () => { counter.textContent = mode === 'watch' ? `LENGTH ${s.seq.length}` : `${pos} / ${s.seq.length}`; };
  for (let i = 0; i < 9; i++) {
    const b = h('button.mem-node', { type: 'button', dataset: { sfx: 'none' }, disabled: mode === 'watch', onclick: () => tap(i) }, h('i'));
    nodes.push(b);
    grid.append(b);
  }
  const glow = (i, ms) => { pulseClass(nodes[i], 'lit', ms); };
  const tap = i => {
    if (mode !== 'input' || chal.done) return;
    glow(i, 260);
    sfx('node', { i });
    const right = s.seq[pos] === i;
    pos++;
    paintCount();
    if (!right) {
      pulseClass(nodes[i], 'miss', 500);
      pulseClass(nodes[s.seq[pos - 1]], 'hint', 700);
      chal.p = pos;
      sfx('ocWrong');
      vibrate([20, 30, 20]);
      mode = 'over';
      api.finish();
      return;
    }
    chal.p = pos - 1; // api.part() increments
    api.part(true, true);
  };
  if (mode === 'watch') {
    const startAt = 700;
    s.seq.forEach((n, k) => timers.push(setTimeout(() => { glow(n, s.stepMs * 0.75); sfx('node', { i: n }); }, startAt + k * s.stepMs)));
    timers.push(setTimeout(() => {
      mode = 'input';
      status.textContent = 'REPEAT IT';
      nodes.forEach(b => { b.disabled = false; });
      grid.classList.add('is-input');
      paintCount();
    }, startAt + s.seq.length * s.stepMs + 150));
  } else grid.classList.add('is-input');
  paintCount();
  const el = h('div.ch.ch-memory', status, grid, counter);
  return { el, destroy() { timers.forEach(clearTimeout); } };
}
