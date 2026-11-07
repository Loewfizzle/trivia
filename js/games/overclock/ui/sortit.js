// OVERCLOCK — SORT IT: swipe or tap each card to its side; the window shrinks card by card. OC3B — THE OVERDRIVE LOOK (docs/overclock.md
// "Challenge looks"): the two SIDES labelled big on slanted glass plates at the left + right (BLUE left · ORANGE right), their EDGES glowing
// down both sides of the table, ONE BIG TILTING GLASS CARD with the item in the middle, the shrinking window as THE TACH under it (the kit's
// tach on this card's own clock — each card's window from sortWindowMs, unchanged).
//   Drag: the card follows your finger + TILTS toward the side you lean, that side's edge + plate glow (the lean is an opacity — no layout).
//   Right: the card flies off into its side and LANDS in that side's glow (the edge flashes, the burst + the sparks into the score).
//   Wrong: it BOUNCES BACK off the side with a red edge flash (+ the cracks), then drops out; too slow: it sinks away. The next card comes
//   230 ms after a sort (unchanged) while the old one is still leaving — the flying card is its own layer on top.
// Swipe, tap a half of the screen (or a side's plate), or ← / → on a computer. Your sorts are kept for THE ANSWER (api.pick — this device only).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h } from '../../../ui/dom.js';
import { sortWindowMs, sortOk } from '../challenges.js';
import { sortSplit } from '../shared.js';
import { createTach } from '../../kit/tach.js';

export default function uiSortIt(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.oc-st');
  const loc = chal.local.sort || (chal.local.sort = { ...sortSplit(chal.ok, chal.p), log: [] });
  let i = chal.p;
  let busy = true;
  let card = null;
  let timer = 0;
  let drag = null;
  const plate = (k, label) => h(`div.oc-st-side.is-${k ? 'r' : 'l'}`, { 'aria-hidden': 'true' }, h('span.oc-st-side-glass'), h('span.oc-st-side-glow'), h('i.oc-st-side-arrow'), h('b', label));
  const sideL = plate(0, s.left), sideR = plate(1, s.right);
  const edge = k => h(`div.oc-st-edge.is-${k ? 'r' : 'l'}`, { 'aria-hidden': 'true' }, h('i.oc-st-edge-base'), h('i.oc-st-edge-glow'), h('i.oc-st-edge-land'), h('i.oc-st-edge-bad'));
  const edgeL = edge(0), edgeR = edge(1);
  const deck = h('div.oc-st-deck');
  // (each card's window is this phone's own local pacing — the card's setTimeout below — so its tach runs on the same local clock)
  const tach = createTach({ now: () => performance.now(), segments: 16, hotMs: 700, label: false });
  const nIdx = h('b'), nOk = h('b'), nBad = h('b');
  const count = h('div.oc-st-count', h('span.oc-st-n', 'CARD ', nIdx, ` / ${s.cards.length}`), h('span.oc-st-tally', h('span.is-ok', '✓ ', nOk), h('span.is-bad', '✕ ', nBad)));
  const hint = h('div.oc-st-hint', 'SWIPE THE CARD — OR TAP A SIDE');
  const paintCount = () => { nIdx.textContent = String(Math.min(i + 1, s.cards.length)); nOk.textContent = String(loc.right); nBad.textContent = String(loc.wrong); };
  const makeCard = t => h('div.oc-st-card', h('div.oc-st-face',
    h('span.oc-st-glass'), h('span.oc-st-lean.is-l'), h('span.oc-st-lean.is-r'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('span.oc-st-t', { style: { '--len': String(t).length, '--word': Math.max(...String(t).split(/\s+/).map(w => w.length)) } }, t)));
  const lean = (dx = 0) => {
    const l = Math.max(0, Math.min(1, -dx / 90)), r = Math.max(0, Math.min(1, dx / 90));
    wrap.style.setProperty('--lean-l', l.toFixed(2));
    wrap.style.setProperty('--lean-r', r.toFixed(2));
  };
  const deal = () => {
    if (chal.done || i >= s.cards.length) return;
    // the leaving card (if any) keeps flying on its own layer; the rest of the deck is dealt fresh
    for (const el of [...deck.children]) if (!el.classList.contains('is-out')) el.remove();
    if (i + 1 < s.cards.length) deck.prepend(h('div.oc-st-card.is-back', h('div.oc-st-face', h('span.oc-st-glass'))));
    card = makeCard(s.cards[i].t);
    card.classList.add('is-live', 'is-in');
    deck.append(card);
    const ms = sortWindowMs(i);
    tach.set(performance.now() + ms, ms);
    clearTimeout(timer);
    timer = setTimeout(() => commit(null), ms);
    busy = false;
    paintCount();
  };
  const flashEdge = (k, cls) => { const e = k ? edgeR : edgeL; e.classList.remove('is-land', 'is-bad'); void e.offsetWidth; e.classList.add(cls); };
  const commit = (side, from = 0) => {
    if (busy || chal.done || !card) return;
    busy = true;
    clearTimeout(timer);
    tach.stop();
    const c = s.cards[i];
    const ok = side === c.s;
    if (ok) loc.right += 1; else loc.wrong += 1;
    loc.log[i] = side;
    api.pick(i, side == null ? -1 : side);
    const el = card;
    card = null;
    lean(0);
    const dir = side == null ? 0 : side === 0 ? -1 : 1;
    el.classList.remove('is-live', 'is-in', 'is-drag');
    el.style.setProperty('--dir', String(dir));
    el.style.setProperty('--x0', `${from}px`);
    el.style.setProperty('--r0', `${(from / 16).toFixed(1)}deg`);
    el.style.transform = '';
    el.classList.add('is-out', ok ? 'is-fly' : side == null ? 'is-slow' : 'is-bounce');
    const face = el.firstChild;
    face.classList.add(ok ? 'is-right' : 'is-wrong');
    api.fx(face, ok);
    if (ok) flashEdge(c.s, 'is-land'); else if (side != null) flashEdge(side, 'is-bad');
    hint.textContent = ok ? 'SWIPE THE CARD — OR TAP A SIDE' : side == null ? `TOO SLOW — ${c.s ? s.right : s.left}` : `NOPE — ${c.s ? s.right : s.left}`;
    hint.classList.toggle('is-warn', !ok);
    api.sfx(ok ? 'correct' : 'wrong');
    setTimeout(() => el.remove(), 720);
    i += 1;
    api.step(sortOk(loc.right, loc.wrong), i, ok ? 'ok' : 'miss', i >= s.cards.length, 600);
    paintCount();
    if (i < s.cards.length) setTimeout(deal, 230);
  };
  const springBack = () => { if (card) { card.classList.remove('is-drag'); card.style.transform = ''; } lean(0); };
  wrap.addEventListener('pointerdown', e => {
    if (busy || !card || chal.done || drag) return;
    e.preventDefault();
    const now = performance.now();
    drag = { id: e.pointerId, x: e.clientX, t: now, dx: 0, moved: false, lx: e.clientX, lt: now, vx: 0 };
    try { wrap.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    card.classList.add('is-drag');
  });
  wrap.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id || !card) return;
    const now = performance.now();
    drag.dx = e.clientX - drag.x;
    if (now > drag.lt) { drag.vx = (e.clientX - drag.lx) / (now - drag.lt); drag.lx = e.clientX; drag.lt = now; }
    if (Math.abs(drag.dx) > 8) drag.moved = true;
    card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 16}deg)`;
    lean(drag.dx);
  });
  wrap.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!card) return;
    // (one layout read per tap — an event, never a frame loop)
    const box = wrap.getBoundingClientRect();
    if (Math.abs(d.dx) > 70 || (Math.abs(d.dx) > 24 && Math.abs(d.vx) > 0.45)) commit(d.dx < 0 ? 0 : 1, d.dx);
    else if (!d.moved && performance.now() - d.t < 450) { springBack(); commit(e.clientX < box.left + box.width / 2 ? 0 : 1); }
    else springBack();
  });
  wrap.addEventListener('pointercancel', () => { drag = null; springBack(); });
  api.key = e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); commit(0); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); commit(1); }
  };
  wrap.append(h('div.oc-st-sides', sideL, sideR), count, h('div.oc-st-table', edgeL, deck, edgeR), h('div.oc-st-window', tach.el), hint);
  paintCount();
  setTimeout(deal, 300);
  return { el: wrap, destroy() { clearTimeout(timer); tach.destroy(); api.key = null; } };
}
