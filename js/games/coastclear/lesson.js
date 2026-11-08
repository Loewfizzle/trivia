// COAST CLEAR — THE PRACTICE HARBOR (DM2 — the owner's Step 0; docs/coastclear.md "THE PRACTICE HARBOR"): the FIRST time a player opens COAST
// CLEAR, a fixed 5 × 5 harbor in the game's own look (both looks — css/coastclear.css .cc-lesson) teaches the three moves in three short steps —
// TAP A CELL (the calm water opens) · WHAT A NUMBER MEANS · PLACE A BUOY — then "YOU'RE READY" → today's real run (its clock starts only then).
// SKIP from the first step. Never scored, never the day's board, nothing sent but "seen" (the DAILY screen's run host: api/daily.js `lesson`,
// remembered on the profile — a new device never repeats it). Any daily declares a lesson the same way: its row's `lesson: true` +
// `createLesson` exported by its cartridge (js/screens/daily.js#openRun).
//   createLesson({ onDone }) → { mount(el), unmount(), next(), state() }
import { h, reducedMotion } from '../../ui/dom.js';

export const LW = 5, LH = 5;
/** the fixed harbor: ONE searchlight in the top-right corner; its three neighbours read 1, the rest is calm water (0) */
export const LIGHT = 4;
const nb = i => { const x = i % LW, y = Math.floor(i / LW), out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < LW && Y < LH) out.push(Y * LW + X); } return out; };
export const NUM = Array.from({ length: LW * LH }, (_, i) => (i === LIGHT ? -1 : nb(i).includes(LIGHT) ? 1 : 0));
/** the steps: the cell lit for the tap, the line (one short line each — no reading walls) */
export const STEPS = Object.freeze([
  { k: 'dig', cell: 20, line: 'Tap the glowing water to dig.' },
  { k: 'number', cell: 9, line: 'A 1 means one searchlight hides right next to it.' },
  { k: 'buoy', cell: LIGHT, line: 'Switch to BUOY, then tap where the light hides.' },
  { k: 'ready', cell: null, line: 'Every safe cell opened, every light buoyed. That’s the game.' },
]);
const SVGNS = 'http://www.w3.org/2000/svg';
const svg = (cls, inner) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls); s.innerHTML = inner; return s; };
const BUOY = '<circle class="cc-bu-halo" cx="12" cy="7" r="5.5"/><path class="cc-bu-mast" d="M12 3.5V9"/><circle class="cc-bu-lamp" cx="12" cy="4.6" r="1.7"/>'
  + '<path class="cc-bu-body" d="M4.5 17.2 C5 11.4 8.4 9 12 9 C15.6 9 19 11.4 19.5 17.2 Z"/><path class="cc-bu-band" d="M6.1 13.4 H17.9"/><path class="cc-bu-band2" d="M8.4 10.6 H15.6 M4.9 16.1 H19.1"/><path class="cc-bu-wl" d="M3 19.6 Q7.5 18 12 19.6 T21 19.6"/>';
const RIPPLE = '<circle cx="12" cy="12" r="2.2"/><path d="M12 4.5 A7.5 7.5 0 1 1 11.99 4.5 Z M12 1.5 V4.2 M12 19.8 V22.5 M1.5 12 H4.2 M19.8 12 H22.5"/>';

/** the calm area a dig opens (a 0 floods out to its edge of numbers) */
export function flood(i) {
  const open = new Set(), q = [i];
  while (q.length) { const c = q.shift(); if (open.has(c) || NUM[c] < 0) continue; open.add(c); if (NUM[c] === 0) q.push(...nb(c)); }
  return open;
}

export function createLesson({ onDone } = {}) {
  let root = null, step = 0, mode = 'dig', open = new Set(), buoy = false, gone = false;
  const els = {}, cells = [];
  function build() {
    root.classList.add('cc-screen', 'cc-lesson');
    els.skip = h('button.cc-ls-skip', { type: 'button', onclick: () => finish() }, 'SKIP THE LESSON');
    els.head = h('header.cc-head', h('h1.cc-sign', h('span.cc-sign-t', 'COAST CLEAR'), h('span.cc-sign-dot', { 'aria-hidden': 'true' }, '.')));
    els.kick = h('div.cc-ls-kick', 'THE PRACTICE HARBOR');
    els.dots = h('div.cc-ls-dots', { 'aria-hidden': 'true' }, ...STEPS.slice(0, 3).map(() => h('i')));
    els.line = h('p.cc-ls-line', { role: 'status', 'aria-live': 'polite' });
    els.board = h('div.cc-board.cc-ls-board', { role: 'grid', 'aria-label': 'the practice harbor' });
    els.board.style.setProperty('--cc-cols', String(LW));
    els.board.append(h('div.cc-water', { 'aria-hidden': 'true' }));
    for (let i = 0; i < LW * LH; i++) {
      const c = h('div.cc-cell', { role: 'gridcell', 'data-i': String(i), onpointerup: () => tap(i) }, h('span.cc-n'));
      cells.push(c); els.board.append(c);
    }
    els.dig = h('button.cc-mode-b', { type: 'button', 'data-m': 'dig', onclick: () => setMode('dig') }, svg('cc-mode-i cc-mode-dig', RIPPLE), h('span', 'DIG'));
    els.buoy = h('button.cc-mode-b', { type: 'button', 'data-m': 'buoy', onclick: () => setMode('buoy') }, svg('cc-mode-i cc-mode-buoy', BUOY), h('span', 'BUOY'));
    els.mode = h('div.cc-mode.cc-ls-mode', { role: 'radiogroup', 'aria-label': 'what a tap does' }, els.dig, els.buoy);
    els.go = h('button.btn.btn-primary.cc-ls-go', { type: 'button', hidden: true, onclick: () => finish() }, h('span', 'TODAY’S HARBOR'));
    els.ready = h('div.cc-ls-ready', { hidden: true }, h('b.cc-ls-ready-t', 'YOU’RE READY'), els.go);
    root.append(els.head, h('div.cc-ls-body', els.kick, els.dots, els.line, els.board, els.ready, els.skip), els.mode);
    setMode('dig');
    paint();
  }
  function setMode(m) {
    mode = m;
    els.dig.classList.toggle('is-on', m === 'dig'); els.buoy.classList.toggle('is-on', m === 'buoy');
    els.dig.setAttribute('aria-checked', String(m === 'dig')); els.buoy.setAttribute('aria-checked', String(m === 'buoy'));
    paint();
  }
  function tap(i) {
    if (gone) return;
    const S = STEPS[step];
    if (S.k === 'dig' && i === S.cell && mode === 'dig') { open = flood(i); advance(); return; }
    if (S.k === 'number' && i === S.cell) { advance(); return; }
    if (S.k === 'buoy' && i === LIGHT && mode === 'buoy') { buoy = true; advance(); return; }
    // anything else: the lit cell nudges (a soft shake), never a penalty
    const c = cells[S.cell != null ? S.cell : i];
    if (c && !reducedMotion()) { c.classList.remove('cc-ls-nudge'); void c.offsetWidth; c.classList.add('cc-ls-nudge'); }
  }
  function advance() { step = Math.min(STEPS.length - 1, step + 1); paint(); }
  function paint() {
    if (!root) return;
    const S = STEPS[step];
    root.dataset.step = S.k;
    els.line.textContent = S.line;
    [...els.dots.children].forEach((d, i) => { d.classList.toggle('is-on', i <= step); });
    cells.forEach((c, i) => {
      const o = open.has(i), n = NUM[i];
      c.classList.toggle('is-open', o);
      c.dataset.n = o ? String(n) : '';
      c.firstChild.textContent = o && n > 0 ? String(n) : '';
      c.classList.toggle('cc-ls-hint', S.cell === i && !(S.k === 'buoy' && mode !== 'buoy'));
      const b = i === LIGHT && buoy;
      c.classList.toggle('is-buoy', b);
      if (b && !c.querySelector('.cc-buoy')) c.append(svg('cc-buoy', BUOY));
    });
    els.buoy.classList.toggle('cc-ls-hint', S.k === 'buoy' && mode !== 'buoy');
    els.ready.hidden = S.k !== 'ready'; els.go.hidden = S.k !== 'ready';
    els.skip.hidden = S.k === 'ready';
  }
  let doneOnce = false;
  function finish() { if (doneOnce) return; doneOnce = true; if (onDone) onDone(); }
  return {
    mount(el) { root = el; build(); },
    unmount() { gone = true; if (root) { root.classList.remove('cc-screen', 'cc-lesson'); delete root.dataset.step; root.replaceChildren(); } },
    next() { const S = STEPS[step]; if (S.k === 'dig') { setMode('dig'); tap(S.cell); } else if (S.k === 'number') tap(S.cell); else if (S.k === 'buoy') { setMode('buoy'); tap(LIGHT); } },
    state: () => ({ step: STEPS[step].k, open: open.size, buoy, mode }),
  };
}
