// FREEFALL — THE MATCH's HUD (F4B — docs/freefall.md "THE DEPTH RAIL" · "THE MATCH"): the DOM over the scene in a match — 3 · 2 · 1 + the
// names · THE DEPTH RAIL (a thin glowing rail at the right edge: everyone's dot by depth, mine larger, out = a crossed dot, THE BOTTOM
// marked at its foot — HIGH RISE's altimeter turned upside down) · THE EDGE MARKERS (a rival more than five floors away: "MIA ↓12" at the
// foot, "↑3" at the top) · the last half minute's clock · the OUT card · the WATCHING line. WRITTEN ONLY WHEN SOMETHING CHANGES (a dot
// moves by ONE transform; a marker's words are set only when they differ) — never in a frame that changed nothing; no pills.
import { h } from '../../ui/dom.js';
import { MODES } from './tuning.js';

/** THE BOTTOM — the rail's foot (a match's finish) */
const FOOT = MODES.match.finish || 200;
/** the markers' rows each way (ghosts.js MARKS_MAX) */
const ROWS = 3;

export function createMatchHud() {
  const countN = h('div.ff-count-n'), countNames = h('div.ff-count-names');
  const count = h('div.ff-count', { hidden: true, 'aria-live': 'assertive' }, countN, countNames);
  const railIn = h('div.ff-rail-in'), rail = h('div.ff-rail', { hidden: true, 'aria-hidden': 'true' }, h('i.ff-rail-line'), h('i.ff-rail-foot'), railIn);
  const mk = () => { const t = document.createTextNode(''); return { el: h('div.ff-mark', { hidden: true }, t), t, text: '', hex: '' }; };
  const ups = Array.from({ length: ROWS }, mk), dns = Array.from({ length: ROWS }, mk);
  const up = h('div.ff-marks.is-up', { 'aria-hidden': 'true' }, ...ups.map(m => m.el)), dn = h('div.ff-marks.is-dn', { 'aria-hidden': 'true' }, ...dns.map(m => m.el));
  const clockT = document.createTextNode(''), clock = h('div.ff-clock', { hidden: true }, clockT);
  const over = h('div.ff-over');
  const watchT = document.createTextNode(''), watch = h('div.ff-watch', { hidden: true, role: 'status' }, watchT);
  const el = h('div.ff-match', rail, up, dn, clock, count, over, watch);
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
    /** THE EDGE MARKERS: ghosts.js#edgeMarks's answer { up: [], down: [] } */
    marks(M) { marksInto(M.up, ups); marksInto(M.down, dns); },
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
      if (outCard) { outCard.remove(); outCard = null; }
      over.replaceChildren();
    },
    info: () => ({ count: countKey || '', names: countNames.childElementCount, rail: !rail.hidden, dots: [...dots].map(([uid, d]) => ({ uid, y: d.y, cls: d.cls })), up: ups.filter(s => s.text).map(s => s.text), down: dns.filter(s => s.text).map(s => s.text), clock: clockKey, watching: watchKey, outCard: !!outCard, railH }),
    destroy() { if (ro) ro.disconnect(); },
  };
}
