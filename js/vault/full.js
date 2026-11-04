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
import { h } from '../ui/dom.js';
import { gildedCard, sinceOf } from '../progress/card.js';
import { pgSheet } from '../progress/look.js';
import { bandOf } from '../core/levels.js';
import { TIER_NAMES, ITEM } from '../core/items.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { LOOKS, vaultSheet, fxOpts } from './strip.js';
import { LAB } from './catalog.js';
import { fitName } from '../ui/fit.js';
import { approvedIds } from './approved.js';
import { emblemEl, hasArt } from './emblem-art.js';
import { applyGlow } from './glows.js';
import { prominence } from './emblems.js';
import { embTier } from './strip.js';
import { isDevCard, ONE_OF_ONE } from '../core/dev-cards.js';
import { takeLayer, isTopLayer, onCloseAll } from '../ui/layers.js';

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
  'card-dev-switchboard': { slot: 'top', moving: [[0.065, 0.185, 0.15, 0.115], [0.24, 0.215, 0.33, 0.06], [0.765, 0.35, 0.19, 0.13], [0.05, 0.39, 0.9, 0.52]] },
  'card-dev-source': { slot: 'top', moving: [[0.49, 0.6, 0.43, 0.21], [0.07, 0.2, 0.62, 0.075]] },
  'card-founder': { slot: 'stamp', moving: [[0.362, 0.205, 0.276, 0.2], [0.41, 0.6, 0.14, 0.22]] },
  'card-house': { slot: 'pill', moving: [[0.47, 0.14, 0.47, 0.75]] },
  'card-sg-ufo': { slot: 'pill', moving: [[0.3, 0.16, 0.4, 0.4]] },
});
export const badgeOf = card => BADGE[card] || { slot: 'pill', moving: [] };

/** the element: material + plate + words + frame (the effect is a slot: mountFull) */
// LOBBY 2.0 B — THE TOP LINE NEVER CLIPS (the owner, Nov 4 7:12 am: on THE SWITCHBOARD "1 OF 1 · DEV" cut off FOUNDER): the line's words
// (NEON SPEAKEASY · FOUNDER / · № n) + the tier pill must sit side by side, whole, at every width — the letter-spacing tightens FIRST (0.34em
// → 0.08em), only then the size (never below 8 px). Measured when the fonts are in + when the line's width changes (a ResizeObserver —
// never a frame loop). The pill keeps its size: it's the card's tier, the words are the house's.
const TOP_LS = [0.34, 0.28, 0.22, 0.17, 0.13, 0.1, 0.08];
export function fitTop(top) {
  if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return top;
  const fit = () => {
    const house = top.querySelector('.vl-fc-house'), pill = top.querySelector('.vl-tier');
    if (!house || !top.isConnected) return;
    house.style.letterSpacing = ''; house.style.fontSize = '';
    const room = () => top.clientWidth - (pill ? pill.offsetWidth : 0) - 6;
    // (the words' REAL extent — a Range over them: the span's own box can be narrower than its bold FOUNDER inside)
    const rg = document.createRange();
    const need = () => { rg.selectNodeContents(house); return Math.ceil(rg.getBoundingClientRect().width); };
    if (!room() || need() <= room()) { top.dataset.fit = 'css'; return; }
    for (const ls of TOP_LS.slice(1)) { house.style.letterSpacing = `${ls}em`; if (need() <= room()) { top.dataset.fit = `ls${ls}`; return; } }
    const base = parseFloat(getComputedStyle(house).fontSize) || 10;
    const size = Math.max(8, Math.floor(base * (room() / need()) * 10) / 10 - 0.1);
    house.style.fontSize = `${size}px`; top.dataset.fit = `px${size}`;
  };
  let w = -1;
  new ResizeObserver(es => { const nw = Math.round(es[0].contentRect.width); if (nw !== w) { w = nw; fit(); } }).observe(top);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  return top;
}

export function fullCardEl({ card, tier, who = {}, spotted = null }) {
  const look = LOOKS[card] || LOOKS['card-brushed'], t = tier || tierOf(card), lv = who.lv || 1;
  const sighting = /^card-sg-/.test(card);
  const name = (who.name || 'MEMBER').toUpperCase();
  const plate = h('div.vl-fc-plate',
    // (THE VAULT 2A: the player's emblem + tube style + name glow — as on their strip)
    h('span.vl-fc-emb', emblemEl({ id: hasArt(who.shape) ? who.shape : null, avatar: who.avatar || 'bolt', color: who.color || 'magenta', tube: who.tube, mode: prominence(t, embTier(hasArt(who.shape) ? who.shape : null)) })),
    h('span.vl-fc-who', fitName(applyGlow(h('b.vl-fc-name', { class: t === 'legendary' ? 'vg-still' : '' }, name), who.glow), { min: 15, two: 17 }), h('small.vl-fc-lv', isDevCard(card) ? `THE DEVELOPER · № ${who.no || '0001'}` : `${bandOf(lv).name} · LV ${lv}`)));
  const dev = isDevCard(card), badge = badgeOf(card);
  const el = h('div.vl-fc', { class: `vl-t-${t} vl-s-${look.mat} vl-fcm-${look.mat}${sighting ? ' is-sight' : ''}${dev ? ' vl-dev1' : ''}`, dataset: { card, tier: t } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    t !== 'common' ? h('i.vl-fc-sheen', { 'aria-hidden': 'true' }, h('i')) : null,
    fitTop(h('div.vl-fc-top', badge.slot === 'top'
      ? h('span.vl-fc-house', 'NEON SPEAKEASY', who.fd ? [' · ', h('b.vl-fc-fd.is-top', 'FOUNDER')] : null)   // (2C: his № is under his name — the line carries FOUNDER)
      : h('span.vl-fc-house', who.no ? `NEON SPEAKEASY · № ${who.no}` : 'NEON SPEAKEASY'), h('span.vl-tier', dev ? ONE_OF_ONE : TIER_NAMES[t] || t))),
    who.fd && !sighting && badge.slot === 'pill' ? h('span.vl-fc-fd', 'FOUNDER') : null,
    sighting ? h('div.vl-fc-title', { class: nameOf(card).length > 18 ? 'is-long' : '' }, h('b', nameOf(card)), h('small', spotted ? `${spotOf(card)} · ${timeOf(spotted)}` : spotOf(card))) : null,
    plate,
    h('div.vl-fc-foot', h('span.vl-fc-since', h('small', 'MEMBER SINCE'), h('b', sinceOf(who.at))), sighting ? null : h('span.vl-fc-card', nameOf(card))),
    // FOUNDING MEMBER (THE VAULT 2A): the member's REAL number, stamped in gold — a numbered first edition (+ MEMBER SINCE moves in)
    card === 'card-founder' ? h('div.vl-fc-stamp', h('small', 'FOUNDING MEMBER'), h('b', who.no != null ? `№ ${who.no}` : '№ —'), h('em', `SINCE ${sinceOf(who.at)}`)) : null,
    t === 'legendary' ? h('i.vl-fc-brackets', { 'aria-hidden': 'true' }, h('i'), h('i')) : null,
    h('i.vl-frame', { 'aria-hidden': 'true' }));
  el.setAttribute('aria-label', `${nameOf(card)} (${TIER_NAMES[t] || t}) — ${name}, level ${lv}`);
  return el;
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
  let release = null;
  const close = () => { if (surface) surface.destroy(); el.remove(); document.removeEventListener('keydown', onKey); open = null; if (release) release(); };
  const onKey = e => { if (e.key === 'Escape' && isTopLayer(el)) close(); };
  const stage = h('div.vl-full-stage', card);
  // (LOBBY FIXES: `who.foot` — a row under the card, e.g. the owner's CREW switch on a room player's card)
  box.append(stage, who.foot || '', h('button.vl-full-x', { type: 'button', 'aria-label': 'Close', onclick: close }, 'CLOSE'));
  // (THE VAULT 2B: a backdrop click in its first 350 ms is the finger that opened it lifting — a long-press — never a close)
  const born = performance.now();
  const el = h('div.vl-full', { role: 'dialog', 'aria-modal': 'true', 'aria-label': nameOf(id), onclick: e => { if (e.target === el && performance.now() - born > 350) close(); } }, box);
  release = takeLayer(el);   // (THE LAYER STACK: on top of whatever opened it — a sheet, CUSTOMIZE, the room's profile)
  document.body.append(el);
  if (ok) { surface = createSurface(stage, { label: 'full' }); mountFull(surface, card, id); }
  document.addEventListener('keydown', onKey);
  open = { close };
  return open;
}
