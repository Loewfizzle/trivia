// OVERCLOCK — MEMORY SEQUENCE: watch the nodes, then repeat them. OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"):
//   a 3×3 of ROUND GLASS NODES; the played node BLAZES orange (a pre-rendered blaze + a white-hot core — their opacity / scale move) with its
//   OWN TONE (Grok's nine memory tones — one per node, ocSfx mem0…mem8; the shared synth tone if they can't play); a slanted STEP BAR shows how
//   far the sequence goes (it lights step by step as it plays, then fills as you repeat it). Your taps blaze the same way. A wrong tap = the
//   REAL-GLASS CRACK on that node, glowing RED, the right one glowing GREEN (no ✓ / ✕ on the nodes — the owner, Nov 6; the crack is the shape)
//   — and your turn ENDS, points kept for every step before it (the owner's rule).
//   Timings unchanged: the playback starts 700 ms in, a step every stepMs (each lit 0.75 of it), your turn 150 ms after the last; a tap
//   blazes 260 ms; a slip 500 ms (the right node's hint 700 ms).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';

export const MEM_START_MS = 700;   // the playback's first step (unchanged)
export const MEM_TURN_MS = 150;    // your turn after the last step (unchanged)
/** a node's tone: its own recorded tone (OC8 — A9: never the console's synth beside it; audio is polish — silent when it can't play) */
export const nodeTone = (api, i) => { if (api && api.sfx) api.sfx(`mem${i}`); };
/** one round glass node (shared with THE ANSWER's replay board) */
export const memNode = (tag = 'i') => h(`${tag}.oc-mem-node`, h('i.oc-mem-glass'), h('i.oc-mem-blaze'), h('i.oc-mem-core'), h('i.oc-mem-mark'));

export default function uiMemory(s, api) {
  const { chal } = api;
  const N = s.seq.length;
  const nodes = [];
  const grid = h('div.oc-mem-grid');
  let mode = chal.p > 0 ? 'input' : 'watch';
  let pos = chal.p;
  const timers = [];
  const segs = Array.from({ length: N }, () => h('i'));
  const bar = h('div.oc-segbar.oc-mem-bar', { 'aria-hidden': 'true' }, segs);
  const title = h('b.oc-mem-title');
  const sub = h('span.oc-mem-sub');
  const qn = h('b', String(N));
  const paint = (played = -1) => {
    title.textContent = mode === 'watch' ? 'WATCH' : mode === 'over' ? 'SLIP!' : 'YOUR TURN';
    sub.textContent = mode === 'watch' ? 'THE SEQUENCE' : mode === 'over' ? 'TURN OVER' : 'REPEAT IT';
    wrap.classList.toggle('is-watch', mode === 'watch');
    wrap.classList.toggle('is-input', mode === 'input');
    segs.forEach((g, i) => {
      g.className = mode === 'watch' ? (i <= played ? 'is-on' : '') : mode === 'over' && i === pos - 1 ? 'is-crack' : i < pos ? 'is-on' : i === pos && mode === 'input' ? 'is-cur' : '';
    });
  };
  for (let i = 0; i < 9; i++) {
    const b = memNode('button');
    b.type = 'button';
    b.dataset.sfx = 'none';
    b.dataset.i = String(i);
    b.setAttribute('aria-label', `Node ${i + 1}`);
    b.disabled = mode === 'watch';
    b.addEventListener('pointerdown', e => { e.preventDefault(); tap(i); });
    b.addEventListener('click', e => { if (e.detail === 0) tap(i); });
    nodes.push(b);
    grid.append(b);
  }
  const glow = (i, ms) => { pulseClass(nodes[i], 'is-lit', ms); };
  const tap = i => {
    if (mode !== 'input' || chal.done) return;
    glow(i, 260);
    nodeTone(api, i);
    const right = s.seq[pos] === i;
    pos++;
    if (!right) {
      if (api.pick) api.pick(0, { at: pos - 1, n: i });   // (OC2 — THE ANSWER: the step you slipped on + the node you tapped)
      const hint = nodes[s.seq[pos - 1]];
      pulseClass(nodes[i], 'is-miss', 500);
      // (the owner, Nov 6: no ✓ / ✕ on the nodes — the right one glows GREEN, the wrong one RED + CRACKED; the crack is the shape that
      // tells them apart without colour)
      nodes[i].classList.add('is-wrong');
      nodes[i].setAttribute('aria-label', `Node ${i + 1} — wrong`);
      hint.classList.add('is-right');
      hint.setAttribute('aria-label', `Node ${s.seq[pos - 1] + 1} — the right one`);
      pulseClass(hint, 'is-hint', 700);
      chal.p = pos;
      mode = 'over';
      paint();
      nodes.forEach(b => { b.disabled = true; });
      if (api.fx) api.fx(nodes[i], false, { k: i });
      if (api.sfx) api.sfx('wrong');   // (OC8 — A9: the slip = 02-wrong, the Overclock set · A15: no vibrate)
      api.finish();
      return;
    }
    chal.p = pos - 1; // api.part() increments
    paint();
    api.part(true, true);
  };
  const wrap = h('div.ch.oc-mem.oc-ownbar',
    h('div.oc-qhead', h('span.oc-chip', 'MEMORY'), h('span.oc-qn', 'LENGTH ', qn)),
    bar,
    h('div.oc-mem-head', title, sub),
    grid);
  if (mode === 'watch') {
    s.seq.forEach((n, k) => timers.push(setTimeout(() => { glow(n, s.stepMs * 0.75); nodeTone(api, n); paint(k); }, MEM_START_MS + k * s.stepMs)));
    timers.push(setTimeout(() => {
      mode = 'input';
      nodes.forEach(b => { b.disabled = false; });
      grid.classList.add('is-input');
      paint();
    }, MEM_START_MS + N * s.stepMs + MEM_TURN_MS));
  } else grid.classList.add('is-input');
  paint();
  return { el: wrap, destroy() { timers.forEach(clearTimeout); } };
}
