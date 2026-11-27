// FREEFALL — THE MATCH's HUD (F4B — docs/freefall.md "THE DEPTH RAIL" · "THE MATCH"): the DOM over the scene in a match — 3 · 2 · 1 + the
// names · THE DEPTH RAIL (a thin glowing rail at the right edge: everyone's dot by depth, mine larger, out = a crossed dot, THE BOTTOM
// marked at its foot — HIGH RISE's altimeter turned upside down) · THE EDGE MARKERS (F5C — the owner: a rival five floors below / two above:
// "MIA ↓12" ONE line each, bigger, in the player's own colour, at the screen's EDGE on the side of the tower they really are — left or
// right; below → the lower band, above → the upper band; never stacked small text at the bottom centre) · the last half minute's clock · the OUT card · the WATCHING line. WRITTEN ONLY WHEN SOMETHING CHANGES (a dot
// moves by ONE transform; a marker's words are set only when they differ) — never in a frame that changed nothing; no pills.
import { h } from '../../ui/dom.js';
import { MODES } from './tuning.js';
import { OUT_CALL_MS, OUT_CALL_MAX, LAST_CARD_MS } from './ghosts.js';

/** THE BOTTOM — the rail's foot (a match's finish) */
const FOOT = MODES.match.finish || 200;
/** the markers' rows each way (ghosts.js MARKS_MAX) */
const ROWS = 3;
/** F5C — at most this many marker lines on one side (the nearest first) */
const SIDE_MAX = 2;

export function createMatchHud() {
  const countN = h('div.ff-count-n'), countNames = h('div.ff-count-names');
  const count = h('div.ff-count', { hidden: true, 'aria-live': 'assertive' }, countN, countNames);
  const railIn = h('div.ff-rail-in'), rail = h('div.ff-rail', { hidden: true, 'aria-hidden': 'true' }, h('i.ff-rail-line'), h('i.ff-rail-foot'), railIn);
  const mk = () => { const t = document.createTextNode(''); return { el: h('div.ff-mark', { hidden: true }, t), t, text: '', hex: '' }; };
  // (four edge groups — above · below × left · right — ROWS slots each: a marker's slot is set only when its words / colour change)
  const group = cls => { const slots = Array.from({ length: ROWS }, mk); return { slots, el: h(`div.ff-marks.${cls}`, { 'aria-hidden': 'true' }, ...slots.map(m => m.el)) }; };
  const UL = group('is-up.is-l'), UR = group('is-up.is-r'), DL = group('is-dn.is-l'), DR = group('is-dn.is-r');
  const ups = [...UL.slots, ...UR.slots], dns = [...DL.slots, ...DR.slots], sideL = [], sideR = [];
  const clockT = document.createTextNode(''), clock = h('div.ff-clock', { hidden: true }, clockT);
  const over = h('div.ff-over');
  const watchT = document.createTextNode(''), watch = h('div.ff-watch', { hidden: true, role: 'status' }, watchT);
  // F5C — RIVAL OUT's callouts (≤ OUT_CALL_MAX lines, a third waits) + LAST ONE STANDING's card (JAYWALK's look)
  const outs = h('div.ff-outs', { 'aria-live': 'polite' }), outQ = [];
  let outN = 0, lastCard = null, outTotal = 0, lastTotal = 0;
  const el = h('div.ff-match', rail, UL.el, UR.el, DL.el, DR.el, clock, count, outs, over, watch);
  function nextOut() {
    while (outN < OUT_CALL_MAX && outQ.length) {
      const o = outQ.shift(), line = h('div.ff-out', { style: { '--c': o.hex } }, o.text);
      outs.append(line); outN++; outTotal++;
      setTimeout(() => { line.remove(); outN--; nextOut(); }, OUT_CALL_MS);
    }
  }
  const dots = new Map();   // uid → { el, y, cls, hex }
  let railH = 0, countKey = null, namesKey = null, clockKey = '', watchKey = '', outCard = null;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { railH = railIn.clientHeight; for (const d of dots.values()) d.y = -1; }) : null;
  if (ro) ro.observe(railIn);

  function marksInto(list, slots) {
    for (let i = 0; i < ROWS; i++) {
      const s = slots[i], m = list[i];
      if (!m) { if (s.text) { s.text = ''; s.el.hidden = true; } continue; }
      if (s.text !== m.text) { s.text = m.text; s.t.data = m.text; s.el.hidden = false; }
      if (s.hex !== m.hex) { s.hex = m.hex; s.el.style.setProperty('--c', m.hex); }
    }
  }
  return {
    el, over,
    /** 3 · 2 · 1 · GO (+ GET READY) — and, once, the names lined up ([{ name, hex, me }]) */
    count(text, names) {
      const key = text || '';
      if (key !== countKey) { countKey = key; countN.textContent = key; count.hidden = !key; countN.classList.toggle('is-go', key === 'GO'); countN.classList.toggle('is-word', key.length > 2); }
      if (names !== namesKey) { namesKey = names; countNames.replaceChildren(...(names || []).map(p => h(`span.ff-count-name${p.me ? '.is-me' : ''}`, { style: { '--c': p.hex } }, p.me ? `${p.name} · YOU` : p.name))); }
    },
    /** THE DEPTH RAIL: rows [{ uid, hex, floor, over, end ('out' | 'made' | 'cap' | ''), lost, me }] — a dot is made once a player, moved by one transform when its floor changed */
    rail(rows) {
      if (rail.hidden) rail.hidden = false;
      if (!railH) railH = railIn.clientHeight;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        let d = dots.get(r.uid);
        if (!d) { d = { el: h(`i.ff-rail-dot${r.me ? '.is-me' : ''}`), y: -1, cls: '', hex: '' }; dots.set(r.uid, d); if (r.me) railIn.append(d.el); else railIn.prepend(d.el); }
        if (d.hex !== r.hex) { d.hex = r.hex; d.el.style.setProperty('--c', r.hex); }
        const k = r.floor >= FOOT ? 1 : r.floor <= 0 ? 0 : r.floor / FOOT, y = Math.round(k * railH * 2) / 2;
        if (y !== d.y) { d.y = y; d.el.style.transform = `translate3d(0, ${y}px, 0)`; }
        const cls = r.end === 'made' ? 'is-made' : r.end === 'out' ? 'is-out' : r.lost ? 'is-lost' : '';
        if (cls !== d.cls) { if (d.cls) d.el.classList.remove(d.cls); if (cls) d.el.classList.add(cls); d.cls = cls; }
      }
      if (dots.size > rows.length) for (const [uid, d] of dots) if (!rows.some(r => r.uid === uid)) { d.el.remove(); dots.delete(uid); }
    },
    /** THE EDGE MARKERS: ghosts.js#edgeMarks's answer { up: [], down: [] } — each to its side's group (nearest first in each) */
    marks(M) {
      for (const [list, L, R] of [[M.up, UL, UR], [M.down, DL, DR]]) {
        sideL.length = 0; sideR.length = 0;
        for (let i = 0; i < list.length; i++) { const to = list[i].side === -1 ? sideL : sideR; if (to.length < SIDE_MAX) to.push(list[i]); }   // (the nearest first: at most SIDE_MAX lines a side — the review: three stacked over the tower)
        marksInto(sideL, L.slots); marksInto(sideR, R.slots);
      }
    },
    /** F5C — RIVAL OUT: "MIA IS OUT" in their colour for OUT_CALL_MS (two at once; a third waits) */
    callout(text, hex) { outQ.push({ text, hex }); nextOut(); },
    /** F5C — LAST ONE STANDING: JAYWALK's moment card, once a match (the stage decides when) */
    last(words) {
      if (lastCard) lastCard.remove();
      const c = lastCard = h('div.ff-last', { role: 'status' }, h('b', 'LAST ONE STANDING'), h('span', words));
      el.append(c); lastTotal++;   // (never in .ff-over: that layer hides the rail — Call the Winner's sheet)
      setTimeout(() => { c.remove(); if (lastCard === c) lastCard = null; }, LAST_CARD_MS);
    },
    /** the last half minute: "0:27" ('' = hidden) */
    clock(text) { if (text !== clockKey) { clockKey = text; clockT.data = text; clock.hidden = !text; } },
    /** OUT / THE BOTTOM / TIME'S UP — the cause's words over the scene for a moment: { kicker, words, floors, made, ms } */
    outCard(o) {
      if (outCard) { outCard.remove(); outCard = null; }
      if (!o) return;
      outCard = h(`div.ff-outcard${o.made ? '.is-made' : ''}`, h('div.ff-outcard-k', o.kicker), h('div.ff-outcard-w', o.words), h('div.ff-outcard-n', `${o.floors} ${o.floors === 1 ? 'FLOOR' : 'FLOORS'}`));
      over.append(outCard);
      const c = outCard;
      setTimeout(() => { if (c.isConnected) c.classList.add('is-gone'); }, o.ms || 2300);
    },
    /** WATCHING MIA · 57 · TAP FOR THE NEXT ('' = hidden) */
    watching(text) { const t = text || ''; if (t !== watchKey) { watchKey = t; watchT.data = t; watch.hidden = !t; } },
    reset() {
      countKey = null; namesKey = null; count.hidden = true; countN.textContent = ''; countNames.replaceChildren();
      for (const d of dots.values()) d.el.remove();
      dots.clear(); rail.hidden = true;
      for (const s of [...ups, ...dns]) { s.text = ''; s.hex = ''; s.el.hidden = true; }
      clockKey = ''; clock.hidden = true; watchKey = ''; watch.hidden = true;
      outQ.length = 0; outs.replaceChildren(); outN = 0; outTotal = 0; lastTotal = 0; if (lastCard) { lastCard.remove(); lastCard = null; }
      if (outCard) { outCard.remove(); outCard = null; }
      over.replaceChildren();
    },
    info: () => ({ count: countKey || '', names: countNames.childElementCount, rail: !rail.hidden, dots: [...dots].map(([uid, d]) => ({ uid, y: d.y, cls: d.cls })), up: ups.filter(s => s.text).map(s => s.text), down: dns.filter(s => s.text).map(s => s.text), clock: clockKey, watching: watchKey, outCard: !!outCard, railH, outs: [...outs.children].map(e => e.textContent), outTotal, last: lastCard ? lastCard.textContent : '', lastTotal }),
    destroy() { if (ro) ro.disconnect(); },
  };
}
