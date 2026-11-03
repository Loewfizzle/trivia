// THE VAULT 2A — NAME GLOWS (the owner, Nov 3 7:46 am: "NAME GLOWS light the NAME ONLY (never the level line), always readable; tiered:
// COMMON still colours → rarer with movement"). A glow is a class on the name element (+ for a moving one, a few small aria-hidden
// pieces that TOUCH the letters — a glint, an arc — never over them); motion on transform + opacity only (css/vault.css .vg-*); still
// under reduced motion; the name's own text node stays its first child (ui/fit.js#fitName keeps working: LOEWFIZZLE fits, then two lines).
// 2A builds three (for the owner's marks): EMBER (common, still) · GOLD LEAF (rare: gold + a slow glint) · ELECTRIC (rare: small arcs);
// the other glows keep today's look (css/card.css .nm-glow-*) until 2B builds theirs from his marks.
//   applyGlow(nameEl, id) → nameEl   ·   glowLook(id) → 'ember' | 'goldleaf' | 'electric' | null
import { ITEM } from '../core/items.js';
import { vaultSheet } from './sheet.js';

export const GLOW_ART = Object.freeze({
  'glow-ember': { look: 'ember' },
  'glow-gold': { look: 'goldleaf', deco: 'glint', n: 3 },
  'glow-spark': { look: 'electric', deco: 'arc', n: 4 },
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
  for (let i = 0; i < (art.n || 0); i++) { const d = document.createElement('i'); d.className = `vg-${art.deco} vg-${art.deco}${i}`; d.setAttribute('aria-hidden', 'true'); el.append(d); }
  return el;
}
