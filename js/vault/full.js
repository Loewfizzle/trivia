// THE FULL CARD (THE VAULT 1B) — a card at full size: from the picker's VIEW, a tapped strip, the podium, the end-of-round winner.
// Group 2 opens the Gilded membership card dressed in the card's palette; Group 3 gives each approved card its own full card.
//   openFullCard(id, who) → { close() }
import { h } from '../ui/dom.js';
import { gildedCard } from '../progress/card.js';
import { pgSheet } from '../progress/look.js';
import { vaultSheet } from './strip.js';

let open = null;
export async function openFullCard(id, who = {}) {
  if (open) open.close();
  await Promise.all([pgSheet(), vaultSheet()]);
  const card = gildedCard({ ...(who.pub || {}), n: who.name, a: who.avatar, c: who.color, cd: id }, {}, { card: id });
  const close = () => { el.remove(); document.removeEventListener('keydown', onKey); open = null; };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const el = h('div.vl-full', { role: 'dialog', 'aria-modal': 'true', onclick: e => { if (e.target === el) close(); } },
    h('div.vl-full-in', card, h('button.vl-full-x', { type: 'button', 'aria-label': 'Close', onclick: close }, 'CLOSE')));
  document.body.append(el);
  document.addEventListener('keydown', onKey);
  open = { close };
  return open;
}
