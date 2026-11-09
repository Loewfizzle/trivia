// THE FULL CARD (THE VAULT 1B Group 3) — a card at full size: the profile's VIEW, a tapped strip, the podium, the end-of-round winner,
// THE CARD LAB's FULL CARDS tab. The same art + motion as the card's approved SLIM STRIP, given the room a membership card has (the
// ID-1 shape, 1.586 : 1): its material (css/vault.css .vl-s-*), its effect at FULL scale (one SLOT in the page's shared surface —
// js/fx, opts.full: each effect lays itself out for the big card), a foil sheen (rare and up), the tier's frame; NEON SPEAKEASY + the
// tier on top, the player's emblem + NAME (never cut off — ui/fit.js) + BAND · LEVEL on a glass plate, MEMBER SINCE + the CARD's
// name along the foot. A LEGENDARY sighting is a whole scene: `card-sg-ufo` = the real baked UFO over the harbor, its beam + motes,
// the skyline, the gold-and-neon frame, the corner brackets, the title in neon + when it was spotted, THE BORDER LASER.
// Only APPROVED art shows to players (its full card's own lab mark — `full-<card id>` — js/vault/approved.js): until then the Gilded
// membership card in the card's palette stands in.
//   fullCardEl({ card, tier, who: { name, lv, avatar, color, at }, spotted }) → element (no motion yet)
//   mountFull(host, el, card, o) → slot (host: a surface from js/fx/renderer.js#createSurface)
//   openFullCard(id, who) → { close() }   (a sheet over the page; its own surface)
import { holdCity } from '../ui/city-hold.js';
import { h } from '../ui/dom.js';
import { gildedCard, sinceOf } from '../progress/card.js';
import { pgSheet } from '../progress/look.js';
import { bandOf } from '../core/levels.js';
import { TIER_NAMES, ITEM } from '../core/items.js';
import { createSurface, fxCover } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { LOOKS, vaultSheet, fxOpts, stepPlate } from './strip.js';
import { watchFull } from './layout.js';
import { LAB } from './catalog.js';
import { fitName, onFontsLoaded } from '../ui/fit.js';
import { approvedIds } from './approved.js';
import { emblemEl, hasArt } from './emblem-art.js';
import { applyGlow } from './glows.js';
import { prominence } from './emblems.js';
import { embTier } from './strip.js';
import { isDevCard, isOneOfOne, ONE_OF_ONE } from '../core/dev-cards.js';
import { isGiftCard } from '../core/gift-cards.js';
import { gemEl } from './gems.js';
import { takeLayer, onCloseAll } from '../ui/layers.js';

/** the full card's id in THE CARD LAB (its own mark: a strip can be approved before its full card) */
export const fullId = card => `full-${card}`;
const nameOf = id => ((LAB.find(x => x.id === id) || {}).name) || ((ITEM[id] || {}).name) || '';
const tierOf = id => ((LAB.find(x => x.id === id) || {}).tier) || ((ITEM[id] || {}).tier) || 'common';
/** the sighting's line under its title (THE VAULT 1C: the ship sails ON the harbor) */
const spotOf = card => (card === 'card-sg-ghostship' ? 'sighted on the harbor' : 'spotted over the harbor');
const timeOf = at => { try { return new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase(); } catch { return ''; } };

// THE VAULT 2C — FOUNDER + THE BADGE SLOT (the owner, Nov 3 6:35 pm: "the FOUNDING MEMBER pill sits over the VU meter's needle — the moving
// part matters more"). The badge reads FOUNDER (the CARD keeps its name FOUNDING MEMBER) and sits in each card's declared SLOT, clear of that
// card's MOVING PARTS — its feature pieces (a needle, the lamps, the jacks, a lit sign, a window scene), in fractions of the card [x, y, w, h].
// (Ambient motion that fills a whole card — confetti, sparkles, flames, a firework's trails, a material's sheen — is the card's ground, not a
// part.) slot: 'pill' (under the top line, left — the default) · 'top' (in the top line itself: "NEON SPEAKEASY · FOUNDER") · 'stamp'
// (FOUNDING MEMBER's own gold stamp is its badge). tests/integration/harbor-e2e/vault.mjs proves no overlap at 390 / 402 / 430.
export const BADGE = Object.freeze({
  'card-dev-switchboard': { slot: 'top', moving: [[0.065, 0.185, 0.15, 0.115], [0.24, 0.215, 0.33, 0.06], [0.66, 0.205, 0.25, 0.095], [0.05, 0.39, 0.9, 0.52]] },
  'card-dev-source': { slot: 'top', moving: [[0.49, 0.6, 0.43, 0.21], [0.07, 0.2, 0.62, 0.075]] },
  'card-founder': { slot: 'stamp', moving: [[0.362, 0.205, 0.276, 0.2], [0.41, 0.6, 0.14, 0.22]] },
  'card-house': { slot: 'pill', moving: [[0.47, 0.14, 0.47, 0.75]] },
  'card-sg-ufo': { slot: 'pill', moving: [[0.3, 0.16, 0.4, 0.4]] },
});
export const badgeOf = card => BADGE[card] || { slot: 'pill', moving: [] };

/** the element: material + plate + words + frame (the effect is a slot: mountFull) */
// LOBBY 2.0 B — THE TOP LINE NEVER CLIPS (the owner, Nov 4 7:12 am: on THE SWITCHBOARD "1 OF 1 · DEV" cut off FOUNDER): the line's words
// (NEON SPEAKEASY · FOUNDER / · № n) + the tier pill must sit side by side, whole, at every width — the letter-spacing tightens FIRST (0.34em
// → 0.08em), only then the size (never below 10 px — THE CARD TEXT STANDARD, Nov 6; the "№ n" short form fits first). Measured when the fonts are in + when the line's width changes (a ResizeObserver —
// never a frame loop). The pill keeps its size: it's the card's tier, the words are the house's.
const TOP_LS = [0.34, 0.28, 0.22, 0.17, 0.13, 0.1, 0.08];
export function fitTop(top) {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return top;
  let was = false;
  const fit = () => {
    const house = top.querySelector('.vl-fc-house'), pill = top.querySelector('.vl-fc-gem');
    if (!top.isConnected) return was ? false : undefined;
    was = true;
    if (!house) return;
    house.style.letterSpacing = ''; house.style.fontSize = '';
    if (house.dataset.long) { house.firstChild.nodeValue = house.dataset.long; delete house.dataset.long; }
    // (SHELL 2.0 A: the gem's own margins count — the 1-OF-1 badge is inset from the corner)
    const pm = pill ? (cs => (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0))(getComputedStyle(pill)) : 0;
    const room = () => top.clientWidth - (pill ? pill.offsetWidth + pm : 0) - 6;
    // (the words' REAL extent — a Range over them: the span's own box can be narrower than its bold FOUNDER inside)
    const rg = document.createRange();
    const need = () => { rg.selectNodeContents(house); return Math.ceil(rg.getBoundingClientRect().width); };
    if (!room() || need() <= room()) { top.dataset.fit = 'css'; return; }
    for (const ls of TOP_LS.slice(1, 4)) { house.style.letterSpacing = `${ls}em`; if (need() <= room()) { top.dataset.fit = `ls${ls}`; return; } }
    // (CARD FIXES — the owner, Nov 5 4:58 pm: "NEON SPEAKEASY · Nº 0001" ran UNDER the 1 OF 1 badge → a line that would reach the badge
    //  SHORTENS to "№ 0001" before its letters squeeze any further)
    if (house.dataset.short && house.firstChild && house.firstChild.nodeType === 3) { house.dataset.long = house.firstChild.nodeValue; house.firstChild.nodeValue = house.dataset.short; house.style.letterSpacing = ''; if (need() <= room()) { top.dataset.fit = 'short'; return; } }
    for (const ls of TOP_LS.slice(4)) { house.style.letterSpacing = `${ls}em`; if (need() <= room()) { top.dataset.fit = `ls${ls}`; return; } }
    const base = parseFloat(getComputedStyle(house).fontSize) || 10;
    const size = Math.max(10, Math.floor(base * (room() / need()) * 10) / 10 - 0.1);
    house.style.fontSize = `${size}px`; top.dataset.fit = `px${size}`;
  };
  let w = -1;
  const tro = new ResizeObserver(es => { for (const e of es) { if (e.target !== top) { fit(); return; } const nw = Math.round(e.contentRect.width); if (nw !== w) { w = nw; fit(); } } });
  tro.observe(top);
  const pill = top.querySelector('.vl-fc-gem'); if (pill) tro.observe(pill);   // (CARD FIXES: the badge growing — its font in — re-fits the line too)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  onFontsLoaded(fit);   // (THE SPEED PASS: a face that lands after fonts.ready re-fits the line too — ui/fit.js)
  return top;
}

// LOBBY FIXES — THE PLATE COVERS ITS WIDEST LINE (the owner, Nov 4 2:58 pm: "THE DEVELOPER · Nº 0001" ran past the plate — it was sized to
// the name, and the plate's own max-width cut the subtitle's room). The name still fits itself (ui/fit.js); the plate's second line (the
// level / the dev line) sets the plate's floor: its words' real width + the emblem + the paddings, as a min-width (which beats the cap).
// ONE shared ResizeObserver, when a line's size changes (the fonts in) — never a layout read in a frame loop.
let coverRO = null;
function coverWidest(plate) {
  if (typeof ResizeObserver === 'undefined') return;
  if (!coverRO) coverRO = new ResizeObserver(es => { for (const e of es) { const pl = e.target.closest('.vl-fc-plate'); if (pl) layCover(pl); } });
  const lv = plate.querySelector('.vl-fc-lv'); if (lv) coverRO.observe(lv);
  coverRO.observe(plate);
}
function layCover(plate) {
  const lv = plate.querySelector('.vl-fc-lv'), who = plate.querySelector('.vl-fc-who'), emb = plate.querySelector('.vl-fc-emb');
  if (!lv || !who || !plate.isConnected) return;
  const r = document.createRange(); r.selectNodeContents(lv);
  const need = Math.ceil(r.getBoundingClientRect().width) + 1;
  if (Math.abs((parseFloat(who.style.minWidth) || 0) - need) > 0.5) who.style.minWidth = `${need}px`;
  const cs = getComputedStyle(plate), full = Math.ceil(parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + (emb ? emb.offsetWidth : 0) + (parseFloat(cs.columnGap) || 0) + need + 2);
  const cur = parseFloat(plate.style.minWidth) || 0;
  if (full > plate.offsetWidth + 0.5 || (cur && Math.abs(cur - full) > 0.5)) plate.style.minWidth = `${full}px`;
}

// SHELL 2.0 A — THE FULL CARD's TIER GEM (the owner, Nov 4 8:12 pm + Nov 5 — docs/harbor/refs/shell/tier-gem-cards.png): the tier pill's words
// → the SAME tier gem the slim strips wear (vault/gems.js), bigger (28 pt) with its glow, in the card's TOP-RIGHT corner; the tier's NAME
// stays where cards are picked (CUSTOMIZE's grid, THE LAB) + in the card's label for a screen reader. THE 1-OF-1 BADGE (dev + gift cards —
// oneofone-corner.png): the animated RAINBOW gem in the corner, "1 OF 1" to its LEFT on the same line in the gem's own light — a little
// bigger + brighter than the mock (readable on gold), the gem inset so its glow clears the rounded corner.
function tierBadge(t, dev) {
  return h('span.vl-fc-gem', { class: dev ? 'is-1of1' : null, dataset: { tier: dev ? 'dev' : t } },
    dev ? h('b.vl-fc-1of1', h('i.vl-fc-1of1-t', ONE_OF_ONE)) : null, gemEl(dev ? null : t, { dev }));   // (its size: css/vault.css; B2: the rainbow on the inner span, the backing on the outer)
}
/** the sighting cards rebuilt on Grok's art (the standard full-card layout — vault/layout.js keeps the plate off their hero) */
export const ART_SIGHTINGS = new Set(['card-sg-btc']);
export function fullCardEl({ card, tier, who = {}, spotted = null }) {
  const look = LOOKS[card] || LOOKS['card-brushed'], t = tier || tierOf(card), lv = who.lv || 1;
  // (a sighting card keeps its own layout — the title + the spot line, the plate at the foot — EXCEPT one rebuilt on premium art, laid out like
  //  every other full card: THE BTC CARD — the owner's approved mock mock-btc-v1: the top line, the plate mid-left, MEMBER SINCE + the name)
  const sighting = /^card-sg-/.test(card) && !ART_SIGHTINGS.has(card);
  const name = (who.name || 'MEMBER').toUpperCase();
  const plate = h('div.vl-fc-plate',
    // (THE VAULT 2A: the player's emblem + tube style + name glow — as on their strip)
    h('span.vl-fc-emb', emblemEl({ id: hasArt(who.shape) ? who.shape : null, avatar: who.avatar || 'bolt', color: who.color || 'magenta', tube: who.tube, mode: prominence(t, embTier(hasArt(who.shape) ? who.shape : null)) })),
    // (BOARD 2.0 A — A 12-LETTER NAME ON ONE LINE: the name shrinks to its column down to 13 px — THE CARD TEXT STANDARD's name floor — before
    //  it ever splits; was 15, which sent MAXIMILIANOS to two lines on THE BTC CARD at 390 — its plate stops before the balloon)
    h('span.vl-fc-who', fitName(applyGlow(h('b.vl-fc-name', { class: t === 'legendary' ? 'vg-still' : '' }, name), who.glow), { min: 13, two: 17 }), h('small.vl-fc-lv', `LV ${lv}`)));
  coverWidest(plate); stepPlate(plate);   // (CARD FIXES: the full card's plate steps too — the step / THE REVERSE STEP)
  const dev = isOneOfOne(card), badge = badgeOf(card);   // (B2: `dev` here = any 1-of-1 — the rainbow gem + 1 OF 1; the plate's dev line reads isDevCard)
  const el = h('div.vl-fc', { class: `vl-t-${t} vl-s-${look.mat} vl-fcm-${look.mat}${sighting ? ' is-sight' : ''}${dev ? ' vl-dev1' : ''}${isGiftCard(card) ? ' vl-gift-fc' : ''}`, dataset: { card, tier: t } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    t !== 'common' ? h('i.vl-fc-sheen', { 'aria-hidden': 'true' }, h('i')) : null,
    fitTop(h('div.vl-fc-top', badge.slot === 'top'
      ? h('span.vl-fc-house', { dataset: { short: `№ ${who.no || '0001'}` } }, `NEON SPEAKEASY · № ${who.no || '0001'}`, who.fd ? [' · ', h('b.vl-fc-fd.is-top', 'FOUNDER')] : null)   // (CARD FIXES' 6:04 pm ADD-ON: his № back on the top line — it left the plate)
      : h('span.vl-fc-house', { dataset: who.no ? { short: `№ ${who.no}` } : {} }, who.no ? `NEON SPEAKEASY · № ${who.no}` : 'NEON SPEAKEASY'), tierBadge(t, dev))),
    // (CARD FIXES — the owner: NO FOUNDER PILL on any GIFT card; elsewhere vault/layout.js sets it a clear gap under the top line)
    who.fd && !sighting && badge.slot === 'pill' && !isGiftCard(card) ? h('span.vl-fc-fd', 'FOUNDER') : null,
    sighting ? h('div.vl-fc-title', { class: nameOf(card).length > 18 ? 'is-long' : '' }, h('b', nameOf(card)), h('small', spotted ? `${spotOf(card)} · ${timeOf(spotted)}` : spotOf(card))) : null,
    plate,
    // (BOARD 2.0 A: a sighting rebuilt on premium art keeps the SIGHTING's title + spot line — the printed name in the sighting's glow with the spot
    //  line under it, at the foot: vault/layout.js keeps the plate clear of them, the balloon's hero box above them)
    h('div.vl-fc-foot', h('span.vl-fc-since', h('em.vl-fc-rank', isDevCard(card) ? `DEV · ${bandOf(lv).name}` : bandOf(lv).name), h('small', 'MEMBER SINCE'), h('b', sinceOf(who.at))),
      sighting ? null : ART_SIGHTINGS.has(card) ? h('span.vl-fc-card.vl-fc-sgt', h('b', nameOf(card)), h('small.vl-fc-spot', spotted ? `${spotOf(card)} · ${timeOf(spotted)}` : spotOf(card))) : h('span.vl-fc-card', nameOf(card))),
    // FOUNDING MEMBER (THE VAULT 2A): the member's REAL number, stamped in gold — a numbered first edition (+ MEMBER SINCE moves in)
    card === 'card-founder' ? h('div.vl-fc-stamp', h('small', 'FOUNDING MEMBER'), h('b', who.no != null ? `№ ${who.no}` : '№ —'), h('em', `SINCE ${sinceOf(who.at)}`)) : null,
    t === 'legendary' ? h('i.vl-fc-brackets', { 'aria-hidden': 'true' }, h('i'), h('i')) : null,
    h('i.vl-frame', { 'aria-hidden': 'true' }));
  el.setAttribute('aria-label', `${nameOf(card)} (${dev ? ONE_OF_ONE : TIER_NAMES[t] || t}) — ${name}, level ${lv}`);
  return watchFull(el);   // (CARD FIXES — THE CARD's LAYOUT: nothing overlaps, the plate off the hero — vault/layout.js)
}

/** the card's effect, at full scale, as a slot of a surface */
export function mountFull(surface, el, card, o = {}) {
  const look = LOOKS[card];
  if (!look || !look.fx || !FX[look.fx]) return null;
  return surface.add(el, FX[look.fx], fxOpts(card, { seed: o.seed || 3, calm: 0, radius: 18, full: true }));
}

/** may this card show its full card? (its own lab mark APPROVED + a look) */
export const canShowFull = id => (id && LOOKS[id] ? approvedIds().then(a => a.has(fullId(id))).catch(() => false) : Promise.resolve(false));
/** a full card mounted in a host of its own (the profile's card): { el, destroy() } */
export function mountFullCard(host, id, who = {}) {
  const el = fullCardEl({ card: id, who, spotted: who.spotted || null });
  host.replaceChildren(el);
  const surface = createSurface(host, { label: 'full-card' });
  mountFull(surface, el, id);
  return { el, destroy() { surface.destroy(); } };
}

// THE SIGHTING'S SCENE (THE VAULT 1C): the full card's art WITHOUT its words — the reveal's pair + the album's tile when this device has
// no photo of it. Only once the owner APPROVED that full card in THE CARD LAB (full-<card>); until then the caller keeps its placeholder.
/** the scene-only card element (the material + the frame; its scene is a slot: mountScene) */
export function sceneCardEl(card) {
  const look = LOOKS[card] || {};
  return h('div.vl-fc.vl-fc-scene', { class: `vl-t-legendary vl-s-${look.mat || 'plain'}`, dataset: { card } }, h('i.vl-mat', { 'aria-hidden': 'true' }), h('i.vl-frame', { 'aria-hidden': 'true' }));
}
/** the scene on a surface (its full-card layout, a smaller radius) */
export function mountScene(surface, el, card, o = {}) {
  const look = LOOKS[card];
  if (!look || !look.fx || !FX[look.fx]) return null;
  return surface.add(el, FX[look.fx], fxOpts(card, { seed: o.seed || 3, calm: 0, radius: o.radius || 10, full: true }));
}
/** swap a placeholder for the approved scene (it keeps the placeholder otherwise): → Promise<{ el, surface } | null> */
export async function upgradeScene(placeholder, card, o = {}) {
  if (!placeholder || !LOOKS[card] || !LOOKS[card].fx) return null;
  const ok = await canShowFull(card); if (!ok || !placeholder.isConnected) return null;
  await vaultSheet();
  const el = sceneCardEl(card), box = h('div.vl-scene-box', el);
  placeholder.replaceWith(box);
  const surface = createSurface(box, { label: o.label || 'scene' });
  mountScene(surface, el, card, o);
  return { el: box, surface };
}

let open = null;
onCloseAll(() => { if (open) open.close(); });   // (FR6 FIXES A — B1)
// SPEED PASS B — THE COVER: the fx surfaces behind held, the page's CSS animations paused (css/vault.css: body.vl-covered — everything but
// the full card itself), the city held (title.js listens for 'vl-cover'); covers count (a card opened over a card) → uncover()
let coverN = 0;
function coverBehind(el) {
  const fx = fxCover(el);
  const city = holdCity();   // (DM2: the city's hold is shared + counted — ui/city-hold.js — a daily overlay may hold it too)
  if (!coverN++) document.body.classList.add('vl-covered');
  let done = false;
  return () => { if (done) return; done = true; fx(); city(); if (!--coverN) document.body.classList.remove('vl-covered'); };
}
/** a sheet with the full card (approved art — else the Gilded card in its palette) */
export async function openFullCard(id, who = {}) {
  if (open) open.close();
  await Promise.all([pgSheet(), vaultSheet()]);
  const ok = await canShowFull(id);
  let surface = null, card;
  const box = h('div.vl-full-in');
  if (ok) {
    card = fullCardEl({ card: id, who, spotted: who.spotted || null });
  } else card = gildedCard({ ...(who.pub || {}), n: who.name, a: who.avatar, c: who.color, cd: id }, {}, { card: id });
  let release = null, uncover = null;
  const close = () => { if (surface) surface.destroy(); el.remove(); open = null; if (release) release(); if (uncover) { uncover(); uncover = null; } if (who.onClose) try { who.onClose(); } catch { /* fine */ } };
  const stage = h('div.vl-full-stage', card);
  // (LOBBY FIXES: `who.foot` — a row under the card, e.g. the owner's CREW switch on a room player's card)
  // (SHELL 2.0 B2 — THE GIFT's reveal: `who.head` above the card (the gift line), `who.flip` = the card flips in; `who.onClose`)
  if (who.flip) box.classList.add('vl-full-flip');
  box.append(who.head || '', stage, who.foot || '', h('button.vl-full-x', { type: 'button', 'aria-label': 'Close', onclick: close }, who.closeWord || 'CLOSE'));
  // (THE VAULT 2B: a backdrop click in its first 350 ms is the finger that opened it lifting — a long-press — never a close)
  const born = performance.now();
  const el = h('div.vl-full', { role: 'dialog', 'aria-modal': 'true', 'aria-label': nameOf(id), onclick: e => { if (e.target === el && performance.now() - born > 350) close(); } }, box);
  release = takeLayer(el, { close: () => close() });   // (SHELL 2.0 A: the one Esc — ui/layers.js — closes it when it's on top)   // (THE LAYER STACK: on top of whatever opened it — a sheet, CUSTOMIZE, the room's profile)
  // (SPEED PASS B — the owner's 8:05 pm lag: EVERYTHING behind the full card holds still while it's up — the fx slots on their current
  //  frame (renderer.js#fxCover), every CSS animation paused (body.vl-covered), the city's frames held — resumed on CLOSE)
  uncover = coverBehind(el);
  document.body.append(el);
  if (ok) { surface = createSurface(stage, { label: 'full' }); mountFull(surface, card, id); }
  open = { close };
  return open;
}
