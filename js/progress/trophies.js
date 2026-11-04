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

/** one trophy row (a fresh element each call: the page's latest 3 + THE TROPHY CASE build their own) */
function trophyRow(a, data, o, now) {
  const s = data.stats || {};
  const it = ITEM[a.item] || null, tier = (it && it.tier) || 'common', kind = it && it.kind;
  const worn = () => !!(kind && WORN[kind] && (data.profile || {})[WORN[kind]] === a.item);
  let chip = null;
  if (it && SLOT[kind]) {
    const say = h('span.pg-rw-n', it.name || '');
    const state = h('em.pg-rw-on');
    chip = h('button.pg-rw', { type: 'button', dataset: { id: a.item, kind }, 'aria-label': `Equip ${it.name || 'it'}` }, rewardArt(a.item), say, state);
    const paint = () => { const on = worn(); chip.classList.toggle('is-on', on); state.textContent = on ? 'EQUIPPED ✓' : 'TAP TO EQUIP'; chip.setAttribute('aria-pressed', String(on)); };
    chip.addEventListener('click', async () => { if (worn() || !o.onWear) return; chip.classList.add('is-busy'); const ok = await o.onWear(SLOT[kind], a.item); chip.classList.remove('is-busy'); if (ok !== false) { data.profile = { ...(data.profile || {}), [WORN[kind]]: a.item }; paint(); } });
    paint();
  } else if (it) chip = h('span.pg-rw', rewardArt(a.item), h('span.pg-rw-n', it.name || ''));
  const at = s.ac[a.id], fresh = at > 1e12 && now - at < NEW_MS;
  return h('div.pg-tr.pg-ach', { dataset: { id: a.id, tier }, class: fresh ? 'is-new' : '' },
    medal(a, tier),
    h('div.pg-tr-t',
      h('b.pg-tr-n', a.name, fresh ? h('span.pg-tr-new', 'NEW') : null),
      h('span.pg-tr-l', a.line),
      h('em.pg-pct', { dataset: { a: a.id } }),
      h('div.pg-tr-f', chip ? h('small.pg-tr-k', 'UNLOCKED') : null, chip, h('small.pg-tr-d', dateOf(at)))));
}
/** what you hold, NEWEST FIRST (the date each was earned — the older test entries without a real date keep their order, last) */
export const heldNewest = ac => heldOf(ac).map((a, i) => ({ a, i, t: (ac || {})[a.id] > 1e12 ? ac[a.id] : 0 })).sort((x, y) => (y.t - x.t) || (x.i - y.i)).map(x => x.a);
// LOBBY 2.0 A — the owner, Nov 3 9:32–9:33 pm: achievements will pile up → the profile shows only THE LATEST 3 (one earned in the last 48 h
// carries NEW), then ALL ACHIEVEMENTS · N › → THE TROPHY CASE (a sheet: every trophy, newest first — the same medals, X% + tap to equip)
export const LATEST = 3, NEW_MS = 48 * 3600e3;

export function trophiesSection(data, o = {}) {
  const s = data.stats || {}, now = o.now || Date.now();
  const held = heldNewest(s.ac);
  const rows = held.slice(0, LATEST).map(a => trophyRow(a, data, o, now));
  const all = held.length > LATEST ? h('button.pf-more', { type: 'button', onclick: () => openTrophyCase(data, o) }, h('span', `ALL ACHIEVEMENTS · ${held.length}`), h('b', '›')) : null;
  return h('section.pg-panel.pg-trophies',
    h('div.pg-prof-h', h('span', 'ACHIEVEMENTS'), h('em', 'tap a reward to equip it')),
    h('div.pg-trs', ...rows), all);
}

/** THE TROPHY CASE — every trophy you hold, newest first (a pop-up over the profile; ‹ goes back to it) */
export async function openTrophyCase(data, o = {}) {
  const { openPfSheet } = await import('../profile/sheets.js');
  const s = data.stats || {}, now = o.now || Date.now(), held = heldNewest(s.ac);
  const list = h('div.pg-trs.pf-case', ...held.map(a => trophyRow(a, data, o, now)));
  const sh = openPfSheet({ kicker: `${held.length} EARNED · NEWEST FIRST`, title: 'THE TROPHY CASE', body: [h('p.pfs-note', 'Tap a reward to equip it.'), list], cls: 'pf-case-sheet' });
  import('./look.js').then(L => L.pctFor().then(P => { list.querySelectorAll('.pg-pct').forEach(x => { x.textContent = L.pctLine(P.a[x.dataset.a]); }); })).catch(() => {});
  return sh;
}
