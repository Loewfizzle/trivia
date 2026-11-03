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
import { avatar } from '../ui/components.js';
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

/** the full card's id in THE CARD LAB (its own mark: a strip can be approved before its full card) */
export const fullId = card => `full-${card}`;
const nameOf = id => ((LAB.find(x => x.id === id) || {}).name) || ((ITEM[id] || {}).name) || '';
const tierOf = id => ((LAB.find(x => x.id === id) || {}).tier) || ((ITEM[id] || {}).tier) || 'common';
const timeOf = at => { try { return new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase(); } catch { return ''; } };

/** the element: material + plate + words + frame (the effect is a slot: mountFull) */
export function fullCardEl({ card, tier, who = {}, spotted = null }) {
  const look = LOOKS[card] || LOOKS['card-brushed'], t = tier || tierOf(card), lv = who.lv || 1;
  const sighting = /^card-sg-/.test(card);
  const name = (who.name || 'MEMBER').toUpperCase();
  const plate = h('div.vl-fc-plate',
    h('span.vl-fc-emb', avatar(who.avatar || 'bolt', who.color || 'magenta', 46)),
    h('span.vl-fc-who', fitName(h('b.vl-fc-name', name), { min: 15, two: 17 }), h('small.vl-fc-lv', `${bandOf(lv).name} · LV ${lv}`)));
  const el = h('div.vl-fc', { class: `vl-t-${t} vl-s-${look.mat} vl-fcm-${look.mat}${sighting ? ' is-sight' : ''}`, dataset: { card, tier: t } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    t !== 'common' ? h('i.vl-fc-sheen', { 'aria-hidden': 'true' }, h('i')) : null,
    h('div.vl-fc-top', h('span.vl-fc-house', who.no ? `NEON SPEAKEASY · № ${who.no}` : 'NEON SPEAKEASY'), h('span.vl-tier', TIER_NAMES[t] || t)),
    who.fd && !sighting ? h('span.vl-fc-fd', 'FOUNDING MEMBER') : null,
    sighting ? h('div.vl-fc-title', h('b', nameOf(card)), h('small', spotted ? `spotted over the harbor · ${timeOf(spotted)}` : 'spotted over the harbor')) : null,
    plate,
    h('div.vl-fc-foot', h('span.vl-fc-since', h('small', 'MEMBER SINCE'), h('b', sinceOf(who.at))), sighting ? null : h('span.vl-fc-card', nameOf(card))),
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

let open = null;
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
  const close = () => { if (surface) surface.destroy(); el.remove(); document.removeEventListener('keydown', onKey); open = null; };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const stage = h('div.vl-full-stage', card);
  box.append(stage, h('button.vl-full-x', { type: 'button', 'aria-label': 'Close', onclick: close }, 'CLOSE'));
  const el = h('div.vl-full', { role: 'dialog', 'aria-modal': 'true', 'aria-label': nameOf(id), onclick: e => { if (e.target === el) close(); } }, box);
  document.body.append(el);
  if (ok) { surface = createSurface(stage, { label: 'full' }); mountFull(surface, card, id); }
  document.addEventListener('keydown', onKey);
  open = { close };
  return open;
}
