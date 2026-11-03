// THE VAULT — THE SLIM STRIP (THE VAULT 1A; the owner: "THE SLIM CARD IS THE ONE PEOPLE SEE" — the lobby, menus, the board, the end of
// round show it far more than anyone opens a full card). The strip is the PRIMARY canvas: ~360 × 64 pt, the player's EMBLEM + NAME + LV
// on a readable glass plate over the card's art, its tier tag. The material is CSS (a real texture, crisp at the phone's full ratio, no
// canvas for a still card); the motion is one SLOT in the page's shared effect canvas (js/fx/renderer.js) — never a canvas per strip.
//   mountStrips(host, rows, { calm }) → { surface, els, destroy() }   rows: [{ card, name, lv, emblem?, seed? }]
// TIERS (decided): COMMON still · UNCOMMON one effect · RARE an effect + glowing edges · EPIC two effects · LEGENDARY a living scene +
// THE BORDER LASER. THE PROMINENCE RULE: emblems.js#prominence. Reduced motion: each strip's still frame.
import { h } from '../ui/dom.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { LAB } from './catalog.js';
import { TIER_NAMES, ITEM } from '../core/items.js';
import { emblemEl, hasArt } from './emblem-art.js';
import { applyGlow } from './glows.js';
import { emblemSvg, prominence, TEST_EMBLEMS } from './emblems.js';
import { fitName } from '../ui/fit.js';
import { isDevCard, ONE_OF_ONE } from '../core/dev-cards.js';

/** each card's strip: its material (css/vault.css .vl-m-*), its effect (js/fx), the emblem it's shown with in the lab */
export const LOOKS = Object.freeze({
  'card-brushed': { mat: 'brushed', fx: null, emblem: 'emb-test-prism' },
  'card-smoke': { mat: 'smoke', fx: 'smoke' },
  'card-frostbite': { mat: 'frost', fx: 'frost' },
  'card-inferno': { mat: 'inferno', fx: 'flames' },
  'card-prism': { mat: 'prism', fx: 'prism' },
  'card-marquee': { mat: 'marquee', fx: 'marquee' },
  'card-glitter': { mat: 'glitter', fx: 'glitter' },
  'card-sg-ufo': { mat: 'ufo', fx: 'ufo', emblem: 'emb-test-neon' },
  // THE VAULT 1B — the launch set, part 1 (what players meet first): the ORIGINAL GILDED + the early level rewards (tint = the effect's colour)
  'card-gilded': { mat: 'gilded', fx: null },
  'card-midnight': { mat: 'midnight', fx: null },
  'card-brass': { mat: 'brass', fx: null },
  'card-heartbreaker': { mat: 'heart', fx: 'hearts' },
  'card-emerald': { mat: 'emerald', fx: 'sheen', tint: '120,255,190' },
  'card-neonglass': { mat: 'neonglass', fx: 'tube', tint: '63,224,255' },
  'card-chrome': { mat: 'chrome', fx: 'sheen', tint: '200,225,255' },
  'card-champagne': { mat: 'champagne', fx: 'sheen', tint: '255,232,200' },
  // THE VAULT 1C — THE 8 SIGHTING CARDS (legendary: a living scene + THE BORDER LASER; each its own light in --sg — css/vault.css)
  'card-sg-tr3b': { mat: 'sg-tr3b', fx: 'sgTr3b' },
  'card-sg-blackbird': { mat: 'sg-blackbird', fx: 'sgBlackbird' },
  'card-sg-f22': { mat: 'sg-f22', fx: 'sgF22' },
  'card-sg-ghostship': { mat: 'sg-ghostship', fx: 'sgGhost' },
  'card-sg-aurora': { mat: 'sg-aurora', fx: 'sgAurora' },
  'card-sg-fireball': { mat: 'sg-fireball', fx: 'sgFireball' },
  'card-sg-skull': { mat: 'sg-skull', fx: 'sgSkull' },
  'card-sg-btc': { mat: 'sg-btc', fx: 'sgBtc' },
  // THE VAULT 1C — THE HELD-BACK CARDS (tiers: UNCOMMON one effect · RARE an effect + glowing edges · EPIC two · LEGENDARY a scene + the laser)
  'card-zebra': { mat: 'zebra', fx: 'sheen', tint: '255,79,184' },
  'card-camo': { mat: 'camo', fx: 'scan' },
  'card-velvet': { mat: 'velvet', fx: 'spot', tint: '255,214,150' },
  'card-aurora': { mat: 'auroraglass', fx: 'veil' },
  'card-rosegold': { mat: 'rosegold', fx: 'sheen', tint: '240,176,150' },
  'card-gold': { mat: 'foil', fx: 'rays', tint: '255,226,150' },
  'card-flame30': { mat: 'charcoal', fx: 'embers', tint: '255,140,50' },
  'card-marble': { mat: 'marble', fx: 'twinkle', tint: '255,220,150' },
  'card-neoncamo': { mat: 'neoncamo', fx: 'neoncamo' },
  'card-carbon': { mat: 'carbon', fx: 'sheen', tint: '90,209,255' },
  'card-confetti': { mat: 'confetti', fx: 'confetti' },
  'card-circuit': { mat: 'circuit', fx: 'circuit', tint: '61,255,160' },
  'card-noir': { mat: 'noir', fx: 'noir' },
  'card-sapphire': { mat: 'sapphire', fx: 'sapphire' },
  'card-legend': { mat: 'legend', fx: 'legend' },
  'card-century': { mat: 'century', fx: 'century' },
  'card-marquee-gold': { mat: 'marqueegold', fx: 'bulbs' },
  'card-penthouse': { mat: 'penthouse', fx: 'penthouse' },
  'card-wildfire': { mat: 'wildfire', fx: 'wildfire' },
  'card-eternal': { mat: 'eternal', fx: 'eternal' },
  'card-witness': { mat: 'witness', fx: 'witness' },
  // THE VAULT 2A — THE 3 HELD CARDS (the owner's picks, Nov 3 11:50 am)
  'card-founder': { mat: 'founder', fx: 'opening' },
  'card-house': { mat: 'house', fx: 'house' },
  'card-platinum': { mat: 'platinum', fx: 'platinum' },
  // THE VAULT 2B — THE TWO DEV CARDS (the owner's own: ONE OF ONE · DEV, his Nº on the plate)
  'card-dev-switchboard': { mat: 'devswitch', fx: 'devSwitch' },
  'card-dev-source': { mat: 'devsource', fx: 'devSource' },
});
/** a card's effect options on a surface (its tint rides along) */
export const fxOpts = (card, o = {}) => ({ ...o, tint: (LOOKS[card] || {}).tint });
export { vaultSheet } from './sheet.js';
const tierOf = id => (LAB.find(x => x.id === id) || {}).tier || 'common';
/** an emblem's tier (the lab's row, else the owner's item row; the sign-up shapes are commons) */
export const embTier = id => (id && ((LAB.find(x => x.id === id) || {}).tier || (ITEM[id] || {}).tier)) || 'common';

/** one strip: card (an id with a LOOK) — or plain (a card not approved yet: its palette's vars, a plain strip) + tier; embEl = the player's
 *  own emblem element (else a test emblem); the NAME always whole (ui/fit.js — shrunk, then two lines; never an ellipsis) */
export function stripEl({ card, name, lv, emblem, host, embEl, plain, tier: tierIn, no, avatar, color, tube, glow }) {
  const look = plain ? { mat: 'plain' } : (LOOKS[card] || LOOKS['card-brushed']), tier = tierIn || tierOf(card);
  // THE EMBLEM (THE VAULT 2A): the player's own (an emblem with art, else their sign-up shape in neon) with its tube style — or 1A's test pair
  let embId, mode, emb;
  if (embEl) { embId = ''; mode = 'even'; emb = embEl; }
  else if (TEST_EMBLEMS[emblem] || (!emblem && !avatar)) { embId = TEST_EMBLEMS[emblem] ? emblem : look.emblem || 'emb-test-neon'; const em = TEST_EMBLEMS[embId] || TEST_EMBLEMS['emb-test-neon']; mode = prominence(tier, em.tier); emb = emblemSvg(em.finish, mode); }
  else { embId = hasArt(emblem) ? emblem : ''; mode = prominence(tier, embTier(embId)); emb = emblemEl({ id: embId || null, avatar, color, tube, mode }); }
  // (the name glow follows the same rule: on a LEGENDARY card it holds its still, lit look — the card leads)
  // (THE VAULT 2B — a DEV card: ONE OF ONE · DEV for its tag, THE DEVELOPER · his № on the plate)
  const dev = !plain && isDevCard(card);
  const nameEl = applyGlow(h('b.vl-name', name), glow);
  if (tier === 'legendary') nameEl.classList.add('vg-still');
  const plate = h('div.vl-plate',
    h('span.vl-emb', emb),
    h('span.vl-who', fitName(nameEl, { min: 13, two: 14.5 }), h('small.vl-lv', dev ? `THE DEV · № ${no || '0001'}` : host ? `LV ${lv} · HOST` : `LV ${lv}`)));
  const el = h('div.vl-strip', { class: `vl-t-${tier} vl-s-${look.mat}${dev ? ' vl-dev1' : ''}`, style: plain || undefined, dataset: { card: card || '', tier, emblem: embEl ? '' : embId, lead: mode } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    plate,
    h('span.vl-tier', dev ? 'ONE OF ONE' : TIER_NAMES[tier] || tier.toUpperCase()),
    // (FOUNDING MEMBER — the member's REAL number in gold: a numbered first edition; THE VAULT 2A)
    card === 'card-founder' && !plain && no != null ? h('span.vl-no', `№ ${no}`) : null,
    h('i.vl-frame', { 'aria-hidden': 'true' }));
  el.setAttribute('aria-label', `${name}, level ${lv} (${TIER_NAMES[tier] || tier})`);
  return el;
}

/** a list of strips on ONE shared effect surface (the host becomes it) */
export function mountStrips(host, rows, o = {}) {
  host.classList.add('vl-list');
  const surface = createSurface(host, { label: o.label || 'strips' });
  const els = rows.map((r, i) => {
    const el = stripEl(r);
    host.append(el);
    const look = LOOKS[r.card];
    if (look && look.fx && FX[look.fx]) surface.add(el, FX[look.fx], fxOpts(r.card, { seed: r.seed != null ? r.seed : i + 1, calm: o.calm ? 1 : 0, radius: 12 }));
    return el;
  });
  return { surface, els, destroy() { surface.destroy(); els.forEach(e => e.remove()); } };
}
