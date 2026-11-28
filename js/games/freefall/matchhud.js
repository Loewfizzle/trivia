// FREEFALL — THE MATCH's HUD (F4B — docs/freefall.md "THE … matchhud.js#1
// FIX D: THE RAIL, the callouts, LAST ONE STANDING, the clock + the watch line are drawn IN THE 3D PICTURE (hudgl.js); their nodes here are the
// hidden sources of their look. 3 · 2 · 1 (before the fall) + the OUT card + Call the Winner's sheet (after it) stay in the page.
import { h } from '../../ui/dom.js';
import { MODES } from './tuning.js';
import { OUT_CALL_MS, OUT_CALL_MAX, LAST_CARD_MS, outWords } from './ghosts.js';

/** THE BOTTOM — the rail's foot (a match's finish) */
const FOOT = MODES.match.finish || 200;
// FIX A — THE RAIL's NAMES: a name's line height (px — names … matchhud.js#2
export const NAME_GAP = 17, NAME_MAX = 7;   // (GO-LIVE G0.2: a name's box is 14.4 px — 17 = never touching)
export const railName = s => { const t = String(s || '').toUpperCase(); return t.length > NAME_MAX ? `${t.slice(0, NAME_MAX - 1)}…` : t; };
// FIX A — the rivals' names beside their dots: [{ y }] … matchhud.js#3
export function spreadNames(list, gap, h) {
  list.sort((a, b) => a.y - b.y);
  for (let i = 0; i < list.length; i++) list[i].ny = i ? Math.max(list[i].y, list[i - 1].ny + gap) : Math.max(list[i].y, 0);
  for (let i = list.length - 1; i >= 0; i--) { const top = i === list.length - 1 ? h : list[i + 1].ny - gap; if (list[i].ny > top) list[i].ny = top; }
  return list;
}

export function createMatchHud({ busy = () => false, hud: H } = {}) {
  const countN = h('div.ff-count-n'), countNames = h('div.ff-count-names');
  const count = h('div.ff-count', { hidden: true, 'aria-live': 'assertive' }, countN, countNames);
  const railIn = h('div.ff-rail-in'), rail = h('div.ff-rail', { hidden: true, 'aria-hidden': 'true' }, h('i.ff-rail-line'), h('i.ff-rail-foot'), railIn);
  const src = { dot: h('i.ff-rail-dot'), name: h('span.ff-rail-name') };
  const clock = h('div.ff-clock'), over = h('div.ff-over'), watch = h('div.ff-watch', { role: 'status' });
  const outs = h('div.ff-outs'), out = h('div.ff-out'), outQ = [];
  const i1 = h('i'), i2 = h('i'), lspan = h('span', i1, i2), lastEl = h('div.ff-last', { hidden: true, 'aria-hidden': 'true' }, h('b', 'LAST ONE STANDING'), lspan);
  const sr = h('span.ff-banner-live', { role: 'status', 'aria-live': 'polite' });   // (LAST ONE STANDING + a rival out, for a reader)
  let outN = 0, outTotal = 0, lastTotal = 0, lastText = '', lastT = 0;
  const el = h('div.ff-match', rail, clock, count, outs, over, watch, lastEl, sr);
  let outWait = 0, gen = 0; // matchhud#4
  const lines = [];
  function nextOut() {
    // (FIX A — the callouts live in the BANDS' zone under the number now: one waits while an arrival band is up)
    if (outQ.length && busy()) { if (!outWait) outWait = setTimeout(() => { outWait = 0; nextOut(); }, 250); return; }
    while (outN < OUT_CALL_MAX && outQ.length) {
      const o = outQ.shift();
      H.callout(`${o.text}|${o.hex}`, OUT_CALL_MS); lines.push(o.text); outN++; outTotal++;
      const g0 = gen;
      setTimeout(() => { if (g0 !== gen) return; lines.shift(); outN--; nextOut(); }, OUT_CALL_MS);
    }
  }
  const recs = new Map();   // uid → the rail's record { uid, me, hex, name, rn, out, cls, y, ny } (the GL HUD eases + draws it)
  const list = [], spread = [];
  let railH = 0, countKey = null, namesKey = null, clockKey = '', watchKey = '', outCard = null, keyNow = '';
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { railH = railIn.clientHeight; }) : null;
  if (ro) ro.observe(railIn);

  return {
    el, over, src: { rail: { el: rail, inner: railIn, dot: src.dot, name: src.name }, outs, out, last: { el: lastEl, span: lspan, i: [i1, i2] }, clock, watch },
    /** 3 · 2 · 1 · GO (+ GET READY) — and, once, the names lined up ([{ name, hex, me }]) */
    count(text, names) {
      const key = text || '';
      if (key !== countKey) { countKey = key; countN.textContent = key; count.hidden = !key; countN.classList.toggle('is-go', key === 'GO'); countN.classList.toggle('is-word', key.length > 2); }
      if (names !== namesKey) { namesKey = names; countNames.replaceChildren(...(names || []).map(p => h(`span.ff-count-name${p.me ? '.is-me' : ''}`, { style: { '--c': p.hex } }, p.me ? `${p.name} · YOU` : p.name))); }
    },
    // THE DEPTH RAIL: rows [{ uid, hex, name, floor, over, end ('out' | 'made' | …), lost, me }] → the records (a dot's y on the rail, its
    // state; a rival's name beside it, nudged apart — spreadNames) — no page write: the GL HUD draws them
    rail(rows) {
      if (rail.hidden) { rail.hidden = false; railH = railIn.clientHeight; }
      if (!railH) railH = railIn.clientHeight;
      let key = '';
      list.length = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        let d = recs.get(r.uid);
        if (!d) { d = { uid: r.uid, me: !!r.me, hex: '', name: '', rn: '', out: '', cls: '', y: 0, ny: null }; recs.set(r.uid, d); }
        if (d.hex !== r.hex || d.name !== r.name) { d.hex = r.hex; d.name = r.name; d.rn = railName(r.name); d.out = outWords(r.name || 'A RIVAL'); }
        key += `${r.uid}:${d.rn}:${d.hex}|`;
        const k = r.floor >= FOOT ? 1 : r.floor <= 0 ? 0 : r.floor / FOOT;
        d.y = Math.round(k * railH * 2) / 2;
        d.cls = r.end === 'made' ? 'is-made' : r.end === 'out' ? 'is-out' : r.lost ? 'is-lost' : '';
        list.push(d);
      }
      for (const uid of recs.keys()) if (!rows.some(r => r.uid === uid)) recs.delete(uid);
      // the names nudged apart (never over each other)
      spread.length = 0;
      for (const d of list) if (!d.me) { d.ns ||= { y: 0, ny: 0 }; d.ns.y = d.y; spread.push(d.ns); }
      spreadNames(spread, NAME_GAP, railH);
      for (const d of list) d.ny = d.me ? null : Math.round(d.ns.ny * 2) / 2;
      keyNow = key;
      // (the rivals first, my dot over them — the page's old order)
      list.sort((a, b) => (a.me === b.me ? 0 : a.me ? 1 : -1));
      H.rail(list, key);
    },
    /** F5C — RIVAL OUT: "MIA IS OUT" in their colour for OUT_CALL_MS (two at once; a third waits) */
    callout(text, hex) { outQ.push({ text, hex }); nextOut(); },
    /** F5C — LAST ONE STANDING: JAYWALK's moment card, once a match (the stage decides when) */
    last(words) {
      if (busy()) { const g0 = gen; setTimeout(() => { if (g0 === gen) this.last(words); }, 250); return; }   // (FIX A: in the bands' zone — it waits for a band to leave)
      // (FIX B: TWO lines, the dot ENDS the first — "CHARLIE HIT … matchhud.js#6
      const W = String(words), k = W.indexOf(' · ');
      H.last(k < 0 ? [W] : [`${W.slice(0, k)}\u00a0·`, W.slice(k + 3)], LAST_CARD_MS);   // (FIX B: a no-break space — the dot ends line 1)
      lastText = `LAST ONE STANDING${W.replace(' · ', '\u00a0·')}`; lastTotal++; sr.textContent = `LAST ONE STANDING — ${W}`;
      clearTimeout(lastT); const g0 = gen; lastT = setTimeout(() => { if (g0 === gen) lastText = ''; }, LAST_CARD_MS);
    },
    /** the last half minute: "0:27" ('' = hidden) */
    clock(text) { if (text !== clockKey) { clockKey = text; H.clock(text); } },
    // OUT / THE BOTTOM / TIME'S UP — the cause's words over the … matchhud.js#7
    outCard(o) {
      if (outCard) { outCard.remove(); outCard = null; }
      if (!o) return;
      outCard = h(`div.ff-outcard${o.made ? '.is-made' : ''}`, h('div.ff-outcard-k', o.kicker), h('div.ff-outcard-w', o.words), h('div.ff-outcard-n', `${o.floors} ${o.floors === 1 ? 'FLOOR' : 'FLOORS'}`));
      over.append(outCard);
      const c = outCard;
      setTimeout(() => { if (c.isConnected) c.classList.add('is-gone'); }, o.ms || 2300);
    },
    /** WATCHING MIA · 57 · TAP FOR THE NEXT ('' = hidden) */
    watching(text) { const t = text || ''; if (t !== watchKey) { watchKey = t; H.watch(t); } },
    /** Call the Winner's sheet is up (the rail never shows through its edge) */
    sheet() { for (const c of over.children) if (!c.classList.contains('ff-outcard')) return true; return false; },
    reset() {
      countKey = null; namesKey = null; count.hidden = true; countN.textContent = ''; countNames.replaceChildren();
      recs.clear(); list.length = 0; rail.hidden = true; H.railOff();
      clockKey = ''; watchKey = ''; H.clock(''); H.watch('');
      gen++; clearTimeout(outWait); outWait = 0; clearTimeout(lastT);
      outQ.length = 0; lines.length = 0; outN = 0; outTotal = 0; lastTotal = 0; lastText = '';
      H.reset();
      if (outCard) { outCard.remove(); outCard = null; }
      over.replaceChildren();
    },
    info: () => ({ count: countKey || '', names: countNames.childElementCount, rail: !rail.hidden, dots: list.map(d => ({ uid: d.uid, y: d.y, cls: d.cls, name: d.me ? '' : d.rn, ny: d.ny })), clock: clockKey, watching: watchKey, outCard: !!outCard, railH, outs: lines.slice(), outTotal, last: lastText, lastTotal, key: keyNow }),
    destroy() { if (ro) ro.disconnect(); clearTimeout(lastT); },
  };
}
