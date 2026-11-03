// THE VAULT 2A — NAME GLOWS (the owner, Nov 3 7:46 am: "NAME GLOWS light the NAME ONLY (never the level line), always readable; tiered:
// COMMON still colours → rarer with movement"). A glow is a class on the name element (+ for a moving one, a few small aria-hidden
// pieces that TOUCH the letters — a glint, an arc — never over them); motion on transform + opacity only (css/vault.css .vg-*); still
// under reduced motion; the name's own text node stays its first child (ui/fit.js#fitName keeps working: LOEWFIZZLE fits, then two lines).
// 2A built three (EMBER · GOLD LEAF · ELECTRIC); 2B the rest — every glow item has a look now (css/vault.css .vg-*).
//   applyGlow(nameEl, id) → nameEl   ·   glowLook(id) → 'ember' | 'goldleaf' | 'electric' | null
import { ITEM } from '../core/items.js';
import { vaultSheet } from './sheet.js';

export const GLOW_ART = Object.freeze({
  'glow-ember': { look: 'ember' },
  'glow-gold': { look: 'goldleaf', deco: 'glint', n: 3 },
  'glow-spark': { look: 'electric', deco: 'arc', n: 4 },
  // THE VAULT 2B — the rest (COMMON still → rarer moving; `dup`: a copy of the name as a layer of its own — data-t → ::before / ::after —
  // that only fades / shifts: the compositor's work, nothing repaints)
  'glow-afterglow': { look: 'afterglow' },
  'glow-ice': { look: 'ice' },
  'glow-neon': { look: 'neon', dup: true },
  'glow-candle': { look: 'candle', dup: true },
  'glow-frost': { look: 'frost', deco: 'xtal', n: 4 },
  'glow-fire': { look: 'fire', deco: 'tongue', n: 5 },
  'glow-starlight': { look: 'starlight', deco: 'star', n: 5 },
  'glow-tinsel': { look: 'tinsel', deco: 'tin', n: 6 },
  'glow-champagne': { look: 'champagne', deco: 'bub', n: 5 },
  'glow-prism': { look: 'prism', deco: 'pglint', n: 3, dup: true },
  'glow-glitch': { look: 'glitch', dup: true },
});
export const glowLook = id => (GLOW_ART[id] ? GLOW_ART[id].look : null);
/** a glow on a name element (a glow without 2A art: today's still look; nothing for no glow) */
export function applyGlow(el, id) {
  if (!el || !id) return el;
  const art = GLOW_ART[id];
  if (!art) {
    const it = ITEM[id];
    if (it && it.kind === 'glow') el.classList.add('is-plain-ink', `nm-glow-${it.old || 'neon'}`);
    return el;
  }
  vaultSheet();
  el.classList.add('vg', `vg-${art.look}`);
  // (the pieces sit along the TEXT, not the box: --n = its letters → --w ≈ its width in em, so they follow fitName's size + its two lines)
  const txt = (el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild.nodeValue : el.textContent) || '';
  el.style.setProperty('--n', String(Math.max(2, txt.trim().length)));
  if (art.dup) el.dataset.t = txt;
  for (let i = 0; i < (art.n || 0); i++) { const d = document.createElement('i'); d.className = `vg-${art.deco} vg-${art.deco}${i}`; d.setAttribute('aria-hidden', 'true'); el.append(d); }
  return el;
}
