// THE VAULT PICKER (THE VAULT 1B — the owner's profile check, Nov 3 6:29 am: "tap to wear" showed placeholder swatches with a line, uneven
// tiles, names wrapping to three lines). Now: a VERTICAL LIST of each owned card's REAL SLIM STRIP — what everyone else sees (the player's
// emblem + name + LV on the card's art, the calmer cut) — its CARD NAME + TIER over it, a clear WEARING mark; TAP THE STRIP to wear it;
// VIEW → the full card. ONE shared effect surface for the whole list (js/fx/renderer.js — the GPU path; only on-screen strips move).
// Only APPROVED art shows (js/vault/approved.js): a card the owner hasn't approved in THE CARD LAB keeps a plain strip in its palette.
// VAULT 2 gives emblems + name glows the same rows.
//   cardPicker({ cards: [{ id, name, tier }], wearing, who: { name, lv, avatar, color }, onWear(id), onView(id) }) → { el, destroy() }
import { h } from '../ui/dom.js';
import { avatar } from '../ui/components.js';
import { createSurface } from '../fx/renderer.js';
import { FX } from '../fx/index.js';
import { TIER_NAMES, TIERS } from '../core/items.js';
import { stripEl, LOOKS, vaultSheet, fxOpts } from './strip.js';
import { approvedIds } from './approved.js';
import { cardVars } from '../progress/look.js';

export function cardPicker(o) {
  vaultSheet();
  const cards = [...(o.cards || [])].sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier));
  const list = h('div.vl-picks'), el = h('div.vl-picker', list);
  const surface = createSurface(el, { label: 'picker' });      // (the host wraps the list: a repaint replaces the rows, never the canvas)
  const rows = new Map();
  let wearing = o.wearing, approved = null;
  const who = o.who || {};
  const emb = () => avatar(who.avatar || 'bolt', who.color || 'magenta', 34);

  function strip(c) {
    const real = approved && approved.has(c.id) && LOOKS[c.id];
    const el = stripEl({ card: real ? c.id : null, tier: c.tier, name: (who.name || 'YOU').toUpperCase(), lv: who.lv || 1, embEl: emb(), plain: real ? null : cardVars(c.id), no: who.no });
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
    destroy() { surface.destroy(); },
  };
}
