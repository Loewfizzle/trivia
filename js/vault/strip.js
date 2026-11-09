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
import { isDevCard, isOneOfOne } from '../core/dev-cards.js';
import { gemEl } from './gems.js';
import { HERO } from './hero.js';
import { layFull } from './layout.js';

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
  'card-sg-btc': { mat: 'sg-btc', fx: 'btcCard' },   // (THE BTC CARD: Grok's art = the material, js/fx/btc-card.js the motion — was the city-model scene sgBtc)
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
  'card-penthouse': { mat: 'penthouse', fx: 'phDial' },   // (DM2 — the owner's design A · THE DIAL, drawn in code: js/fx/ph-dial.js — was the window over the city)
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
  // SHELL 2.0 B2 — THE GIFT CARDS (1 OF 1): the art = the material (css/vault.css .vl-s-g-*), the motion = js/fx/gift.js
  'card-gift-playerone': { mat: 'g-playerone', fx: 'gift:card-gift-playerone' },
  'card-gift-halloffame': { mat: 'g-halloffame', fx: 'gift:card-gift-halloffame' },
  'card-gift-enforcer': { mat: 'g-enforcer', fx: 'gift:card-gift-enforcer' },
  'card-gift-linebacker': { mat: 'g-linebacker', fx: 'gift:card-gift-linebacker' },
  'card-gift-underlights': { mat: 'g-underlights', fx: 'gift:card-gift-underlights' },
  'card-gift-sunsetstrip': { mat: 'g-sunsetstrip', fx: 'gift:card-gift-sunsetstrip' },
  'card-gift-goldenhour': { mat: 'g-goldenhour', fx: 'gift:card-gift-goldenhour' },
  'card-gift-goldenboot': { mat: 'g-goldenboot', fx: 'gift:card-gift-goldenboot' },
  'card-gift-youngbuck': { mat: 'g-bruh', fx: 'gift:card-gift-youngbuck' },   // (Liam's tape card — the id kept)
  'card-gift-icecold': { mat: 'g-icecold', fx: 'gift:card-gift-icecold' },
  'card-gift-anarchist': { mat: 'g-anarchist', fx: 'gift:card-gift-anarchist' },
  'card-gift-buzzed': { mat: 'g-buzzed', fx: 'gift:card-gift-buzzed' },   // (THE SEEING-STARS CARD, Nov 6 — its own strip picture)
  // THE CARD PASS (Nov 7) — the seven gifts, each with its own strip picture (the hero far right — THE SLIM-CARD LONG-NAME STANDARD)
  'card-gift-dispatcher': { mat: 'g-dispatcher', fx: 'gift:card-gift-dispatcher' },
  'card-gift-outoforder': { mat: 'g-outoforder', fx: 'gift:card-gift-outoforder' },
  'card-gift-notguilty': { mat: 'g-notguilty', fx: 'gift:card-gift-notguilty' },
  'card-gift-wastelander': { mat: 'g-wastelander', fx: 'gift:card-gift-wastelander' },
  'card-gift-survivor': { mat: 'g-survivor', fx: 'gift:card-gift-survivor' },
  'card-gift-zadomovinu': { mat: 'g-zadomovinu', fx: 'gift:card-gift-zadomovinu' },
  'card-gift-starimost': { mat: 'g-starimost', fx: 'gift:card-gift-starimost' },
  // OVERCLOCK CARDS (Nov 5 night): Grok's art = the material (css/vault.css .vl-s-oc-*), the game's layers = js/fx/oc-cards.js
  'card-redline': { mat: 'oc-redline', fx: 'ocRedline' },
  'card-photofinish': { mat: 'oc-photofinish', fx: 'ocPhoto' },
  // PW2 — THE PASSWORD's card: Grok's art = the material (css/vault.css .vl-s-pw-*), the game's layers = js/fx/pw-cards.js
  'card-safecracker': { mat: 'pw-safecracker', fx: 'pwSafe' },
  // CC2 — COAST CLEAR's card: Grok's art = the material (css/vault.css .vl-s-cc-*), the game's layers = js/fx/cc-cards.js
  'card-ghost-run': { mat: 'cc-ghost-run', fx: 'ccGhost' },
  // DM2 — THE DAILY MODULE's card: PERFECT WEEK = Grok's fan of tickets (css/vault.css .vl-s-dm-*) + js/fx/dm-cards.js
  'card-perfect-week': { mat: 'dm-week', fx: 'dmWeek' },
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
  // (THE VAULT 2B — a DEV card: THE DEVELOPER on the plate; 2C: THE DEV GEM for its tag; FRIENDS B: the slim dev line reads just DEV)
  const dev = !plain && isDevCard(card), one = !plain && isOneOfOne(card);   // (B2: a GIFT card is 1-of-1 too — the gem; the plate's dev line stays the dev cards')
  const nameEl = applyGlow(h('b.vl-name', name), glow);
  if (tier === 'legendary') nameEl.classList.add('vg-still');
  const plate = h('div.vl-plate',
    h('span.vl-emb', emb),
    h('span.vl-who', fitName(nameEl, { min: 13, two: 14.5 }), h('small.vl-lv', dev ? 'DEV' : host ? `LV ${lv} · HOST` : `LV ${lv}`)));
  const el = h('div.vl-strip', { class: `vl-t-${tier} vl-s-${look.mat}${one ? ' vl-dev1' : ''}${one && !dev ? ' vl-gift' : ''}`, style: plain || undefined, dataset: { card: card || '', tier, emblem: embEl ? '' : embId, lead: mode } },
    h('i.vl-mat', { 'aria-hidden': 'true' }),
    plate,
    // (THE VAULT 2C — THE TIER GEM, the owner's approved mock: no words on the strip — a small gem in the corner; the DEV cards' own
    //  PRISMATIC gem outshines them all; the full card + CUSTOMIZE still spell the tier)
    gemEl(plain && !tierIn ? 'common' : tier, { dev: one }),
    // (FOUNDING MEMBER — the member's REAL number in gold: a numbered first edition; THE VAULT 2A)
    card === 'card-founder' && !plain && no != null ? h('span.vl-no', `№ ${no}`) : null,
    h('i.vl-frame', { 'aria-hidden': 'true' }));
  el.setAttribute('aria-label', `${name}, level ${lv} (${TIER_NAMES[tier] || tier})`);
  stepPlate(plate);
  return el;
}

// ---------------------------------------------------------------- THE PLATE (FRIENDS B: THE STEP DROPPED — one clean box; the history below)
// A long name used to stretch the smoked-glass plate across BOTH rows, hiding the card's art. Now the plate is full length only on the
// NAME row; the LEVEL row below reaches just past "LV n" (+ HOST / the dev line), then steps in with a rounded inner corner — the art
// shows under the name. The plate keeps its own glass (each card's colours); a clip-path cuts the step and a thin line follows its edge
// (the plate's own inset line, read once). Measured by ONE shared ResizeObserver when a plate's size changes (the name fitted, the
// fonts in) — never in a frame loop. A short name (the step would be tiny) = the plate as it was.
// CARD FIXES (the owner, Nov 5 4:54 + 5:04 pm — reverse-step-mock.png): THE REVERSE STEP — when the SECOND row is the longer one (the dev
// line, LV n · HOST, a short name), the NAME row steps in instead (hugs the name, a rounded corner + the same thin edge line) and only the
// long row runs full length: the upside-down L. The full card's plate steps too (vault/full.js — the same function, its own rows). A GIFT
// strip's plate keeps off the card's hero (vault/hero.js — its face): the plate's max-width ends before it (the name fits smaller first).
// The plate says what it did: data-step = n (normal) · r (reverse) · '' (none), data-x2 / data-y1 = the step's corner in plate px.
// FRIENDS B: the step itself is gone — this observer now only keeps a strip's plate capped before its hero + tells a full card it can lay out.
let stepRO = null;
const ROWS = el => [el.querySelector('.vl-name, .vl-fc-name'), el.querySelector('.vl-lv, .vl-fc-lv')];
export function stepPlate(plate) {
  if (typeof ResizeObserver === 'undefined') return;
  if (!stepRO) stepRO = new ResizeObserver(es => { for (const e of es) layStep(e.target.closest('.vl-plate, .vl-fc-plate')); });
  stepRO.observe(plate);
  for (const r of ROWS(plate)) if (r) stepRO.observe(r);
}
/** a strip with a HERO (js/vault/hero.js): the plate's max-width ends before it — px, or ''. THE CARD PASS — THE SLIM-CARD LONG-NAME STANDARD:
 *  every strip that declares one (was: the gift strips only) — a NAME_MAX-letter name shrinks / goes to two lines, never over the subject */
function heroRoom(plate) {
  const strip = plate.parentElement;
  if (!strip || !strip.classList.contains('vl-strip')) return '';
  const b = (HERO[strip.dataset.card] || [])[0]; if (!b) return '';
  return `${Math.max(120, Math.floor(b[0] * strip.clientWidth - plate.offsetLeft - 6))}px`;
}
function layStep(plate) {
  if (!plate || !plate.isConnected) return;
  // (THE CARD PASS: a STRIP's plate only — a full card's plate has its own cap from vault/layout.js#layFull; writing '' here wiped it, the two
  //  then fought through the ResizeObserver + Safari ended UNCAPPED: a 12-letter name ran over a gift card's face)
  if (!plate.classList.contains('vl-fc-plate')) { const room = heroRoom(plate); if (plate.style.maxWidth !== room) plate.style.maxWidth = room; }
  // (FRIENDS B — DROP THE STEP, the owner: both kinds gone — every plate is ONE clean rounded box as wide as its longest row; the hero cap
  //  above stays. data-step = '' says so to vault/layout.js, which lays a full card once it reads it)
  const was = plate.dataset.step;
  plate.style.clipPath = ''; plate.classList.remove('vl-stepped', 'vl-rstep'); plate.dataset.step = '';
  const o = plate.querySelector(':scope > .vl-step'); if (o) o.remove();
  if (was !== '' && plate.classList.contains('vl-fc-plate')) layFull(plate.closest('.vl-fc'));
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
