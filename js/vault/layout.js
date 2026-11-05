// CARD FIXES — THE CARD's LAYOUT IS COLLISION-AWARE (the owner, Nov 5 4:58 + 5:04 pm: "don't let the overlap happen; make it smart, the
// nameplate strategic" · "the layout must show THE MOST OF THE CARD"). On a FULL card the pieces — the top line (NEON SPEAKEASY · Nº), the
// tier gem / the 1 OF 1 badge, the FOUNDER pill, the plate, MEMBER SINCE + the card's name — are measured together and placed so that
// NOTHING overlaps, and the plate keeps off the card's HERO (its main feature: js/fx/gift-specs.js `heroFull`/`hero` for a gift card;
// FULL_HERO below for any other card that declares one):
//   · the FOUNDER pill sits a clear gap under the top line (it crowded the gold line);
//   · THE PLATE PLACEMENT RULE: the plate hugs its text (css — shrink-to-fit, the step + THE REVERSE STEP: vault/strip.js#stepPlate); with a
//     hero its max-width ends before the hero (the name fits smaller — ui/fit.js — before the plate would grow over it); then the plate
//     takes the spot that covers the least art: its own place (mid-left) unless that touches the hero, else the nearest clear spot between
//     the top pieces and the foot (lower-left / upper-left);
//   · the top line never reaches the badge (vault/full.js#fitTop: tighter letters, then the short form "№ 0001", then smaller).
// ONE shared ResizeObserver (the card + its plate), never a layout read in a frame loop. Sightings + FOUNDING MEMBER keep their own layouts.
// Proof: tests/integration/harbor-e2e/vault.mjs 'cardfit' (every card at 390 / 402 / 430 — founder or not, short + long names, HOST).
import { GIFT_SPECS } from '../fx/gift-specs.js';
import { artMap } from '../fx/gift.js';

/** any other card's full-card hero, as fractions of the card [x, y, w, h] (none declared yet — a NEW focal full card adds its row) */
export const FULL_HERO = Object.freeze({});
/** the card's hero on a full card of w × h → [x, y, w, h] in px (or null) */
export function heroBox(card, w, h) {
  const S = GIFT_SPECS[card];
  if (S && (S.heroFull || S.hero)) { const M = artMap(w, h, S.full || [50, 50]), [x, y, bw, bh] = S.heroFull || S.hero; return [M.ox + x * M.k, M.oy + y * M.k, bw * M.k, bh * M.k]; }
  const f = FULL_HERO[card]; return f ? [f[0] * w, f[1] * h, f[2] * w, f[3] * h] : null;
}
/** the plate's real shape at (x, y): its two rows when stepped (vault/strip.js#layStep says where: data-step, -x2, -y1), else its box */
export function shape(plate, x, y, w, h) {
  const st = plate.dataset.step, x2 = +plate.dataset.x2, y1 = +plate.dataset.y1;
  if (st === 'n') return [[x, y, w, y1], [x, y + y1, x2, h - y1]];
  if (st === 'r') return [[x, y, x2, y1], [x, y + y1, w, h - y1]];
  return [[x, y, w, h]];
}
export const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

let ro = null;
/** watch one full card (call once, after it's built) */
export function watchFull(el) {
  if (typeof ResizeObserver === 'undefined' || !el) return el;
  if (!ro) ro = new ResizeObserver(es => { const done = new Set(); for (const e of es) { const c = e.target.closest('.vl-fc'); if (c && !done.has(c)) { done.add(c); layFull(c); } } });
  ro.observe(el);
  const pl = el.querySelector('.vl-fc-plate'); if (pl) ro.observe(pl);
  return el;
}

/** lay one full card out (exported for the tests) */
export function layFull(el) {
  if (!el || !el.isConnected || el.classList.contains('is-sight') || el.dataset.card === 'card-founder') return;
  const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
  const C = el.getBoundingClientRect(), sc = C.width / W || 1;
  const box = n => { if (!n) return null; const r = n.getBoundingClientRect(); return [(r.left - C.left) / sc, (r.top - C.top) / sc, r.width / sc, r.height / sc]; };
  const text = n => { if (!n) return null; const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); return [(r.left - C.left) / sc, (r.top - C.top) / sc, r.width / sc, r.height / sc]; };
  const gap = Math.max(6, H * 0.025), bottom = b => (b ? b[1] + b[3] : 0);
  // 1 · the FOUNDER pill: a clear gap under the top line
  const house = text(el.querySelector('.vl-fc-house')), gem = box(el.querySelector('.vl-fc-gem'));
  const fd = el.querySelector('.vl-fc > .vl-fc-fd');
  if (fd && house) { const t = `${Math.round(bottom(house) + gap)}px`; if (fd.style.top !== t) fd.style.top = t; }
  // 2 · the zone the plate may use: under the top pieces, above the foot
  const zTop = Math.max(bottom(house), bottom(gem), fd ? bottom(box(fd)) : 0) + gap;
  const feet = [box(el.querySelector('.vl-fc-since')), text(el.querySelector('.vl-fc-card'))].filter(b => b && b[2] > 0 && b[3] > 0);   // (an empty piece measures nothing)
  const zBot = Math.min(H, ...feet.map(b => b[1])) - Math.max(gap, H * 0.04);   // (a clear gap above the rank line)
  const plate = el.querySelector('.vl-fc-plate'); if (!plate) return;
  const hero = heroBox(el.dataset.card, W, H);
  // 3 · its width: the hero's left edge is the wall (the name fits smaller first — ui/fit.js; the level line is the floor)
  if (hero) { const mw = `${Math.max(W * 0.34, Math.floor(hero[0] - plate.offsetLeft - gap))}px`; if (plate.style.maxWidth !== mw) plate.style.maxWidth = mw; }
  // 4 · its spot: its own place unless that touches the hero or a top / foot piece → the nearest clear spot in the zone
  if (plate.dataset.top0 == null) plate.dataset.top0 = (plate.offsetTop / H).toFixed(4);   // (its CSS place, as a fraction: the card resizes)
  const top0 = +plate.dataset.top0 * H, pw = plate.offsetWidth, ph = plate.offsetHeight, x = plate.offsetLeft;
  if (plate.dataset.step == null) return;   // (its step not measured yet — vault/strip.js#layStep lays the card again once it is)
  const clear = y => y >= zTop - 0.5 && y + ph <= zBot + 0.5 && !(hero && shape(plate, x, y, pw, ph).some(b => hit(b, hero)));
  let best = top0;
  if (!clear(top0)) {
    best = null;
    for (let d = 0; d <= H; d += 2) { if (clear(top0 + d)) { best = top0 + d; break; } if (clear(top0 - d)) { best = top0 - d; break; } }
    if (best == null) best = Math.max(zTop, Math.min(top0, zBot - ph));   // (no clear spot: the zone's nearest — the test says so)
  }
  const t = `${Math.round(best)}px`;
  if (Math.round(best) === Math.round(top0)) { if (plate.style.top) plate.style.top = ''; }
  else if (plate.style.top !== t) plate.style.top = t;
  el.dataset.laid = hero ? 'hero' : 'plain';
}
