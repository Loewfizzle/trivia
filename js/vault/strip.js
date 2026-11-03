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
import { TIER_NAMES } from '../core/items.js';
import { emblemSvg, prominence, TEST_EMBLEMS } from './emblems.js';
import { fitName } from '../ui/fit.js';

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
});
/** a card's effect options on a surface (its tint rides along) */
export const fxOpts = (card, o = {}) => ({ ...o, tint: (LOOKS[card] || {}).tint });
/** css/vault.css on any page that shows a strip (the app loads it with the profile's sheet; a page that didn't gets it here) */
let sheetP = null;
export function vaultSheet() {
  if (sheetP) return sheetP;
  sheetP = new Promise(res => {
    if (typeof document === 'undefined' || document.querySelector('link[data-vl]') || [...document.styleSheets].some(x => x.href && x.href.endsWith('/css/vault.css'))) { res(); return; }
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/vault.css'; l.dataset.vl = '1';
    l.onload = () => res(); l.onerror = () => res(); document.head.append(l); setTimeout(res, 2500);
  });
  return sheetP;
}
const tierOf = id => (LAB.find(x => x.id === id) || {}).tier || 'common';

/** one strip: card (an id with a LOOK) — or plain (a card not approved yet: its palette's vars, a plain strip) + tier; embEl = the player's
 *  own emblem element (else a test emblem); the NAME always whole (ui/fit.js — shrunk, then two lines; never an ellipsis) */
export function stripEl({ card, name, lv, emblem, host, embEl, plain, tier: tierIn }) {
  const look = plain ? { mat: 'plain' } : (LOOKS[card] || LOOKS['card-brushed']), tier = tierIn || tierOf(card);
  const embId = emblem || look.emblem || 'emb-test-neon', em = TEST_EMBLEMS[embId] || TEST_EMBLEMS['emb-test-neon'];
  const mode = prominence(tier, em.tier);
  const plate = h('div.vl-plate',
    h('span.vl-emb', embEl || emblemSvg(em.finish, mode)),
    h('span.vl-who', fitName(h('b.vl-name', name), { min: 13, two: 14.5 }), h('small.vl-lv', host ? `LV ${lv} · HOST` : `LV ${lv}`)));
  const el = h('div.vl-strip', { class: `vl-t-${tier} vl-s-${look.mat}`, style: plain || undefined, dataset: { card: card || '', tier, emblem: embEl ? '' : embId, lead: mode } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    plate,
    h('span.vl-tier', TIER_NAMES[tier] || tier.toUpperCase()),
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
