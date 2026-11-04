// THE VAULT 2C — ACHIEVEMENTS AS TROPHIES (the owner, Nov 3 6:16–6:29 pm; the approved mock profile-rearranged.png). Each achievement you
// HOLD as a trophy: a round neon MEDAL with its own icon, its ring in the TIER colour (the reward's tier — the one palette); the name; the
// line; "X% of players have this" (pink — the SERVER's counts, computed + cached: /api/profile 'pct' → look.js#pctFor; never a client list of
// profiles); "UNLOCKED · <reward chip>" — a PROPER preview (an emblem at its real size, a glow lit on the word GLOW, a card's own swatch, a
// tube style on a neon star — never the player's name crammed in); TAP the chip = wear it (WEARING once worn); the date earned.
// Only what you hold (names reach a phone only for what it owns — the leak test); readable at 390 unzoomed.
//   trophiesSection(data, o) → section     o = { onWear(slot, id) → Promise<boolean>, now }
import { h } from '../ui/dom.js';
import { heldOf } from '../core/achievements.js';
import { ITEM } from '../core/items.js';
import { cardVars } from './look.js';
import { emblemEl, hasArt } from '../vault/emblem-art.js';
import { applyGlow } from '../vault/glows.js';

const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const dateOf = at => { if (!(at > 1e12)) return ''; const d = new Date(at); return `${MON[d.getMonth()]} ${d.getDate()}`; };   // (a real date only)
const SLOT = { card: 'card', glow: 'glow', tube: 'tube', emblem: 'shape' };
const WORN = { card: 'cd', glow: 'g', tube: 'tb', emblem: 'es' };
// the medal's icon when the reward isn't an emblem of its own: the achievement's group as a neon sign-up shape (one look, crisp at 3×)
const GROUP_ICON = { playing: 'star', city: 'moon', sightings: 'alien', dailies: 'target', specials: 'diamond', prism: 'cube', overclock: 'target' };
const ICON = { 'first-round': 'bolt', 'top-shelf': 'crown', 'made-man': 'crown', kingpin: 'crown', 'full-house': 'diamond', 'the-host': 'star', 'comeback-kid': 'bolt', 'party-animal': 'wave', 'patience-pays': 'eye', 'the-witness': 'eye', 'many-happy-returns': 'star' };

/** the medal: a ring in the tier colour, the icon inside */
function medal(a, tier) {
  const it = ITEM[a.item] || {};
  const icon = it.kind === 'emblem' && hasArt(a.item) ? emblemEl({ id: a.item, mode: 'quiet', size: 30 })
    : emblemEl({ avatar: ICON[a.id] || GROUP_ICON[a.group] || 'star', color: tier === 'legendary' ? 'yellow' : tier === 'epic' ? 'violet' : tier === 'rare' ? 'cyan' : tier === 'uncommon' ? 'green' : 'magenta', mode: 'quiet', size: 28 });
  return h('span.pg-medal', { class: `pg-medal-${tier}`, 'aria-hidden': 'true' }, h('i.pg-medal-ring'), icon);
}
/** the reward's own preview (never the player's name crammed in) */
function rewardArt(id) {
  const it = ITEM[id]; if (!it) return null;
  if (it.kind === 'emblem') return h('span.pg-rw-art.is-emb', emblemEl({ id: hasArt(id) ? id : null, avatar: it.sign || 'star', color: 'magenta', mode: 'quiet', size: 22 }));
  if (it.kind === 'glow') return h('span.pg-rw-art.is-glow', applyGlow(h('b.vl-name.pg-rw-glow', 'GLOW'), id));
  if (it.kind === 'card') return h('span.pg-rw-art.is-card', { style: cardVars(id) }, h('i'));
  if (it.kind === 'tube') return h('span.pg-rw-art.is-emb', emblemEl({ avatar: 'star', color: 'cyan', tube: id, mode: 'quiet', size: 22 }));
  return null;
}

export function trophiesSection(data, o = {}) {
  const s = data.stats || {}, p = data.profile || {};
  const held = heldOf(s.ac);
  const rows = held.map(a => {
    const it = ITEM[a.item] || null, tier = (it && it.tier) || 'common', kind = it && it.kind;
    const worn = () => !!(kind && WORN[kind] && (data.profile || {})[WORN[kind]] === a.item);
    let chip = null;
    if (it && SLOT[kind]) {
      const say = h('span.pg-rw-n', it.name || '');
      const state = h('em.pg-rw-on');
      chip = h('button.pg-rw', { type: 'button', dataset: { id: a.item, kind }, 'aria-label': `Wear ${it.name || 'it'}` }, rewardArt(a.item), say, state);
      const paint = () => { const on = worn(); chip.classList.toggle('is-on', on); state.textContent = on ? 'WEARING' : ''; chip.setAttribute('aria-pressed', String(on)); };
      chip.addEventListener('click', async () => { if (worn() || !o.onWear) return; chip.classList.add('is-busy'); const ok = await o.onWear(SLOT[kind], a.item); chip.classList.remove('is-busy'); if (ok !== false) { data.profile = { ...(data.profile || {}), [WORN[kind]]: a.item }; paint(); } });
      paint();
    } else if (it) chip = h('span.pg-rw', rewardArt(a.item), h('span.pg-rw-n', it.name || ''));
    return h('div.pg-tr.pg-ach', { dataset: { id: a.id, tier } },
      medal(a, tier),
      h('div.pg-tr-t',
        h('b.pg-tr-n', a.name),
        h('span.pg-tr-l', a.line),
        h('em.pg-pct', { dataset: { a: a.id } }),
        h('div.pg-tr-f', chip ? h('small.pg-tr-k', 'UNLOCKED') : null, chip, h('small.pg-tr-d', dateOf(s.ac[a.id])))));
  });
  void p;
  return h('section.pg-panel.pg-trophies',
    h('div.pg-prof-h', h('span', `ACHIEVEMENTS · ${held.length}`), h('em', 'tap a reward to wear it')),
    h('div.pg-trs', ...rows));
}
