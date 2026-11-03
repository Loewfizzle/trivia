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
});
const tierOf = id => (LAB.find(x => x.id === id) || {}).tier || 'common';

export function stripEl({ card, name, lv, emblem, host }) {
  const look = LOOKS[card] || LOOKS['card-brushed'], tier = tierOf(card);
  const embId = emblem || look.emblem || 'emb-test-neon', em = TEST_EMBLEMS[embId] || TEST_EMBLEMS['emb-test-neon'];
  const mode = prominence(tier, em.tier);
  const plate = h('div.vl-plate',
    h('span.vl-emb', emblemSvg(em.finish, mode)),
    h('span.vl-who', h('b.vl-name', name), h('small.vl-lv', host ? `LV ${lv} · HOST` : `LV ${lv}`)));
  const el = h('div.vl-strip', { class: `vl-t-${tier} vl-s-${look.mat}`, dataset: { card, tier, emblem: embId, lead: mode } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    plate,
    h('span.vl-tier', TIER_NAMES[tier] || tier.toUpperCase()),
    h('i.vl-frame', { 'aria-hidden': 'true' }));
  el.setAttribute('aria-label', `${name}, level ${lv} — ${(LAB.find(x => x.id === card) || {}).name || card} (${TIER_NAMES[tier]})`);
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
    if (look && look.fx && FX[look.fx]) surface.add(el, FX[look.fx], { seed: r.seed != null ? r.seed : i + 1, calm: o.calm ? 1 : 0, radius: 12 });
    return el;
  });
  return { surface, els, destroy() { surface.destroy(); els.forEach(e => e.remove()); } };
}
