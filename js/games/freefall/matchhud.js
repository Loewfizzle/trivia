// FREEFALL — THE MATCH's HUD (F4B — docs/freefall.md "THE DEPTH RAIL" · "THE MATCH"): the DOM over the scene in a match — 3 · 2 · 1 + the (→ §1, docs/freefall.md MODULE NOTES)
import { h } from '../../ui/dom.js';
import { MODES } from './tuning.js';
import { OUT_CALL_MS, OUT_CALL_MAX, LAST_CARD_MS } from './ghosts.js';

/** THE BOTTOM — the rail's foot (a match's finish) */
const FOOT = MODES.match.finish || 200;
/** FIX A — THE RAIL's NAMES: a name's line height (px — names closer than this are nudged apart) · the longest name shown (trimmed: '…') */
export const NAME_GAP = 14, NAME_MAX = 7;
export const railName = s => { const t = String(s || '').toUpperCase(); return t.length > NAME_MAX ? `${t.slice(0, NAME_MAX - 1)}…` : t; };
/** FIX A — the rivals' names beside their dots: [{ y }] (sorted by y IN PLACE) → each its own `ny`, never closer than `gap`, inside 0 … h (PURE) */
export function spreadNames(list, gap, h) {
  list.sort((a, b) => a.y - b.y);
  for (let i = 0; i < list.length; i++) list[i].ny = i ? Math.max(list[i].y, list[i - 1].ny + gap) : Math.max(list[i].y, 0);
  for (let i = list.length - 1; i >= 0; i--) { const top = i === list.length - 1 ? h : list[i + 1].ny - gap; if (list[i].ny > top) list[i].ny = top; }
  return list;
}

export function createMatchHud({ busy = () => false } = {}) {
  const countN = h('div.ff-count-n'), countNames = h('div.ff-count-names');
  const count = h('div.ff-count', { hidden: true, 'aria-live': 'assertive' }, countN, countNames);
  const railIn = h('div.ff-rail-in'), rail = h('div.ff-rail', { hidden: true, 'aria-hidden': 'true' }, h('i.ff-rail-line'), h('i.ff-rail-foot'), railIn);
  const spread = [];
  const clockT = document.createTextNode(''), clock = h('div.ff-clock', { hidden: true }, clockT);
  const over = h('div.ff-over');
  const watchT = document.createTextNode(''), watch = h('div.ff-watch', { hidden: true, role: 'status' }, watchT);
  // F5C — RIVAL OUT's callouts (≤ OUT_CALL_MAX lines, a third waits) + LAST ONE STANDING's card (JAYWALK's look)
  const outs = h('div.ff-outs', { 'aria-live': 'polite' }), outQ = [];
  let outN = 0, lastCard = null, outTotal = 0, lastTotal = 0;
  const el = h('div.ff-match', rail, clock, count, outs, over, watch);
  let outWait = 0;
  function nextOut() {
    // (FIX A — the callouts live in the BANDS' zone under the number now: one waits while an arrival band is up)
    if (outQ.length && busy()) { if (!outWait) outWait = setTimeout(() => { outWait = 0; nextOut(); }, 250); return; }
    while (outN < OUT_CALL_MAX && outQ.length) {
      const o = outQ.shift(), line = h('div.ff-out', { style: { '--c': o.hex } }, o.text);
      outs.append(line); outN++; outTotal++;
      setTimeout(() => { line.remove(); outN--; nextOut(); }, OUT_CALL_MS);
    }
  }
  const dots = new Map();   // uid → { el, y, cls, hex, name: { el, t, text, ny } | null }
  let railH = 0, countKey = null, namesKey = null, clockKey = '', watchKey = '', outCard = null;
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { railH = railIn.clientHeight; for (const d of dots.values()) d.y = -1; }) : null;
  if (ro) ro.observe(railIn);

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
        if (!d) {
          d = { el: h(`i.ff-rail-dot${r.me ? '.is-me' : ''}`), y: -1, cls: '', hex: '', name: null };
          // (FIX A — THE EDGE MARKERS are gone: each RIVAL's name sits beside its dot, in its colour)
          if (!r.me) { const t = document.createTextNode(''); d.name = { el: h('span.ff-rail-name', t), t, text: '', ny: -1 }; railIn.prepend(d.name.el); }
          dots.set(r.uid, d); if (r.me) railIn.append(d.el); else railIn.prepend(d.el);
        }
        if (d.hex !== r.hex) { d.hex = r.hex; d.el.style.setProperty('--c', r.hex); if (d.name) d.name.el.style.setProperty('--c', r.hex); }
        if (d.name) { const n = railName(r.name); if (n !== d.name.text) { d.name.text = n; d.name.t.data = n; } }
        const k = r.floor >= FOOT ? 1 : r.floor <= 0 ? 0 : r.floor / FOOT, y = Math.round(k * railH * 2) / 2;
        if (y !== d.y) { d.y = y; d.el.style.transform = `translate3d(0, ${y}px, 0)`; }
        const cls = r.end === 'made' ? 'is-made' : r.end === 'out' ? 'is-out' : r.lost ? 'is-lost' : '';
        if (cls !== d.cls) { if (d.cls) { d.el.classList.remove(d.cls); if (d.name) d.name.el.classList.remove(d.cls); } if (cls) { d.el.classList.add(cls); if (d.name) d.name.el.classList.add(cls); } d.cls = cls; }
      }
      if (dots.size > rows.length) for (const [uid, d] of dots) if (!rows.some(r => r.uid === uid)) { d.el.remove(); if (d.name) d.name.el.remove(); dots.delete(uid); }
      // the names nudged apart (never over each other), each moved by one transform when its place changed
      spread.length = 0;
      for (const d of dots.values()) if (d.name) { d.name.y0 = d.y; spread.push(d.name); }
      for (const n of spread) n.y = n.y0;
      spreadNames(spread, NAME_GAP, railH);
      for (const n of spread) { const y = Math.round(n.ny * 2) / 2; if (y !== n.at) { n.at = y; n.el.style.transform = `translate3d(0, ${y}px, 0)`; } }
    },
    /** F5C — RIVAL OUT: "MIA IS OUT" in their colour for OUT_CALL_MS (two at once; a third waits) */
    callout(text, hex) { outQ.push({ text, hex }); nextOut(); },
    /** F5C — LAST ONE STANDING: JAYWALK's moment card, once a match (the stage decides when) */
    last(words) {
      if (busy()) { setTimeout(() => this.last(words), 250); return; }   // (FIX A: in the bands' zone — it waits for a band to leave)
      if (lastCard) lastCard.remove();
      const c = lastCard = h('div.ff-last', { role: 'status' }, h('b', 'LAST ONE STANDING'), h('span', String(words).replace(' · ', ' · ')));   // (FIX A: a wrapped line breaks AFTER the dot)
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
      for (const d of dots.values()) { d.el.remove(); if (d.name) d.name.el.remove(); }
      dots.clear(); rail.hidden = true;
      clockKey = ''; clock.hidden = true; watchKey = ''; watch.hidden = true;
      outQ.length = 0; outs.replaceChildren(); outN = 0; outTotal = 0; lastTotal = 0; if (lastCard) { lastCard.remove(); lastCard = null; }
      if (outCard) { outCard.remove(); outCard = null; }
      over.replaceChildren();
    },
    info: () => ({ count: countKey || '', names: countNames.childElementCount, rail: !rail.hidden, dots: [...dots].map(([uid, d]) => ({ uid, y: d.y, cls: d.cls, name: d.name ? d.name.text : '', ny: d.name ? d.name.at : null })), clock: clockKey, watching: watchKey, outCard: !!outCard, railH, outs: [...outs.children].map(e => e.textContent), outTotal, last: lastCard ? lastCard.textContent : '', lastTotal }),
    destroy() { if (ro) ro.disconnect(); },
  };
}
