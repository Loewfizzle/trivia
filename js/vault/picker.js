// THE VAULT PICKER (THE VAULT 1B — the owner's profile check, Nov 3 6:29 am: "tap to wear" showed placeholder swatches with a line, uneven
// tiles, names wrapping to three lines). Now: a VERTICAL LIST of each owned card's REAL SLIM STRIP — what everyone else sees (the player's
// emblem + name + LV on the card's art, the calmer cut) — its CARD NAME + TIER over it, a clear WEARING mark; TAP THE STRIP to wear it;
// VIEW → the full card. ONE shared effect surface for the whole list (js/fx/renderer.js — the GPU path; only on-screen strips move).
// Only APPROVED art shows (js/vault/approved.js): a card the owner hasn't approved in THE CARD LAB keeps a plain strip in its palette.
// VAULT 2 gives emblems + name glows the same rows.
//   cardPicker({ cards: [{ id, name, tier }], wearing, who: { name, lv, avatar, color }, onWear(id), onView(id) }) → { el, destroy() }
import { h } from '../ui/dom.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { TIER_NAMES, TIERS, ITEM } from '../core/items.js';
import { emblemEl, hasArt, tubeApplies, TUBE_STYLES } from './emblem-art.js';
import { prominence } from './emblems.js';
import { embTier } from './strip.js';
import { stripEl, LOOKS, vaultSheet, fxOpts } from './strip.js';
import { approvedIds } from './approved.js';
import { cardVars } from '../progress/look.js';

export function cardPicker(o) {
  vaultSheet();
  const cards = [...(o.cards || [])].sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier));
  const list = h('div.vl-picks'), el = h('div.vl-picker', list);
  const own = !o.surface, surface = o.surface || createSurface(el, { label: 'picker' });      // (the host wraps the list: a repaint replaces the rows, never the canvas; 2A: or the caller's ONE surface)
  const rows = new Map();
  let wearing = o.wearing, approved = null;
  const who = o.who || {};
  // (THE VAULT 2A: the player's emblem — its art + tube style — + their name glow on every card's strip)
  const shape = hasArt(who.shape) ? who.shape : null;
  const emb = c => emblemEl({ id: shape, avatar: who.avatar || 'bolt', color: who.color || 'magenta', tube: who.tube, mode: prominence(c.tier, embTier(shape)) });

  function strip(c) {
    const real = approved && approved.has(c.id) && LOOKS[c.id];
    const el = stripEl({ card: real ? c.id : null, tier: c.tier, name: (who.name || 'YOU').toUpperCase(), lv: who.lv || 1, embEl: emb(c), glow: who.glow, plain: real ? null : cardVars(c.id), no: who.no });
    if (real && LOOKS[c.id].fx && FX[LOOKS[c.id].fx]) surface.add(el, FX[LOOKS[c.id].fx], fxOpts(c.id, { seed: 1 + cards.indexOf(c), calm: 1, radius: 12 }));
    return el;
  }
  function row(c) {
    const on = c.id === wearing;
    const s = strip(c);
    const wear = h('button.vl-pick-wear', { type: 'button', 'aria-pressed': String(on), 'aria-label': `Wear ${c.name} (${TIER_NAMES[c.tier] || c.tier})`, onclick: () => { if (c.id !== wearing && o.onWear) o.onWear(c.id); } }, s);
    const el = h('div.vl-pick', { class: on ? 'is-on' : '', dataset: { id: c.id, tier: c.tier } },
      h('div.vl-pick-h',
        h('b.vl-pick-n', c.name),
        h('span.vl-pick-t', { class: `vl-tt-${c.tier}` }, TIER_NAMES[c.tier] || c.tier),
        on ? h('span.vl-pick-on', 'WEARING ✓') : null,
        h('button.vl-pick-view', { type: 'button', 'aria-label': `View ${c.name}`, onclick: () => o.onView && o.onView(c.id) }, 'VIEW')),
      wear);
    rows.set(c.id, { el, strip: s });
    return el;
  }
  function paint() {
    for (const { strip: s } of rows.values()) surface.remove(s);
    rows.clear();
    list.replaceChildren(...cards.map(row));
  }
  paint();
  approvedIds().then(a => { approved = a; paint(); }).catch(() => {});
  return {
    el,
    /** the card now worn (the server said yes) */
    setWearing(id) { wearing = id; paint(); },
    destroy() { for (const { strip: s } of rows.values()) surface.remove(s); if (own) surface.destroy(); },
  };
}

// THE VAULT 2A — EMBLEMS · TUBE STYLES · NAME GLOWS as rows like the cards (the owner's 1B review: the old tiles cut "LOEWFIZZLE" to
// "LOE"). Each row = the player's OWN strip (their worn card — its approved art, else plain; the calmer cut) WEARING that option: the
// emblem on their plate, the tube style on their neon emblem, the glow on their name — at its real size; WEARING ✓; tap to wear; tap
// the worn one again (or the first row) to go back to none. A tube style lights NEON emblems only: worn under a special finish, the
// row previews it on the player's own sign-up shape + says so.
//   stylePicker({ kind: 'emblem' | 'tube' | 'glow', items: [{ id, name, tier }], wearing: { card, shape, tube, glow }, who, onWear(id | '') })
const NONE = { emblem: ['YOUR OWN EMBLEM', 'the shape you picked when you joined'], tube: ['PLAIN TUBE', 'steady neon'], glow: ['NO GLOW', 'your name, plain'] };
export function stylePicker(o) {
  vaultSheet();
  const kind = o.kind, slot = kind === 'emblem' ? 'shape' : kind;
  const items = [...(o.items || [])].sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier));
  const list = h('div.vl-picks'), el = h('div.vl-picker', { dataset: { kind } }, list);
  const own = !o.surface, surface = o.surface || createSurface(el, { label: `picker-${kind}` });
  const who = o.who || {}, W = { ...(o.wearing || {}) };
  let approved = null;
  const rows = [];
  function strip(over, i) {
    const w = { ...W, ...over }, card = w.card || 'card-gilded', c = { id: card, tier: (ITEM[card] || {}).tier || 'common' };
    const real = approved && approved.has(card) && LOOKS[card];
    const shape = kind === 'tube' && !tubeApplies(w.shape) ? null : w.shape;
    const s = stripEl({ card: real ? card : null, tier: c.tier, name: (who.name || 'YOU').toUpperCase(), lv: who.lv || 1, plain: real ? null : cardVars(card),
      emblem: hasArt(shape) ? shape : null, avatar: who.avatar || 'bolt', color: who.color || 'magenta', tube: w.tube, glow: w.glow, no: who.no });
    if (real && LOOKS[card].fx && FX[LOOKS[card].fx]) surface.add(s, FX[LOOKS[card].fx], fxOpts(card, { seed: 1 + i, calm: 1, radius: 12 }));
    return s;
  }
  function row(it, i) {
    const id = it ? it.id : '', on = (W[slot] || '') === id;
    const s = strip({ [slot]: id || null }, i);
    const name = it ? it.name : NONE[kind][0], sub = it ? null : NONE[kind][1];
    // (an item whose art 2B is still making wears as the plain look until then — said on its row, never hidden: you own it)
    const note = kind === 'emblem' && it && !hasArt(it.id) ? 'its own neon arrives soon — your shape until then'
      : kind === 'tube' && it && !TUBE_STYLES[it.id] ? 'its own light arrives soon — a plain tube until then'
      : kind === 'tube' && it && !tubeApplies(W.shape) ? 'shown on your own shape — tube styles light NEON emblems' : null;
    const wear = h('button.vl-pick-wear', { type: 'button', 'aria-pressed': String(on), 'aria-label': `Wear ${name}${it ? ` (${TIER_NAMES[it.tier] || it.tier})` : ''}`,
      onclick: () => { if (!o.onWear) return; o.onWear(on && id ? '' : id); } }, s);
    const r = h('div.vl-pick', { class: `${on ? 'is-on' : ''}${it ? '' : ' is-none'}`, dataset: { id: id || 'none', tier: it ? it.tier : '' } },
      h('div.vl-pick-h',
        h('b.vl-pick-n', name),
        it ? h('span.vl-pick-t', { class: `vl-tt-${it.tier}` }, TIER_NAMES[it.tier] || it.tier) : h('span.vl-pick-sub', sub),
        on ? h('span.vl-pick-on', 'WEARING ✓') : null),
      wear, note ? h('p.vl-pick-note', note) : null);
    rows.push(s);
    return r;
  }
  function paint() {
    for (const s of rows) surface.remove(s);
    rows.length = 0;
    list.replaceChildren(row(null, 0), ...items.map((it, i) => row(it, i + 1)));
  }
  paint();
  approvedIds().then(a => { approved = a; paint(); }).catch(() => {});
  return { el, setWearing(slotName, id) { W[slotName] = id || null; paint(); }, destroy() { for (const s of rows) surface.remove(s); if (own) surface.destroy(); } };
}
