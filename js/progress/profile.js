// THE PROFILE's SECTIONS (PROGRESSION A; THE VAULT 2C — THE PROFILE REARRANGED, the owner's approved mock profile-rearranged.png with ONE
// change: the top is the FULL CARD). Top → bottom: 1 YOUR FULL CARD + CUSTOMIZE YOUR CARD (the caller's hero — screens/profile.js); 2 LEVEL
// + the bar (gold, a slow glint); 3 THE STREAK (→ the streak card); 4 STATS; 5 ACHIEVEMENTS AS TROPHIES; 6 CITY SIGHTINGS (the album); then
// the caller's MASTERY + ACCOUNT. LESS GOLD: the panels are faint dark glass; gold only for the section headers, your card's frame,
// CUSTOMIZE YOUR CARD + the level bar (hot pink stays the end of round's "just earned").
// Collections show ONLY what a player owns — no locked slots, no totals, no "3 of 12" (the owner: "I want them to guess").
import { h } from '../ui/dom.js';
import { levelInfo } from '../core/levels.js';
import { streakView, streakDay } from '../core/streak.js';
import { heldOf } from '../core/achievements.js';
import { ITEM, ownedOf, signOf } from '../core/items.js';
import { num, pctFor, pctLine, flameIcon } from './look.js';
import { albumSection } from './album-view.js';
import { favorPanel } from './extras.js';
import { trophiesSection } from './trophies.js';
import { openDress } from '../vault/dress.js';
import { vaultSheet } from '../vault/sheet.js';

const sum = (g, k) => Object.values(g || {}).reduce((a, x) => a + ((x && x[k]) || 0), 0);

/** under the hero card: CUSTOMIZE YOUR CARD (gold — the most used) + YOUR COLLECTION's count line (what you own, never a total) */
export function customizeBar(data, o = {}) {
  vaultSheet();
  const owned = (data.stats || {}).it || {};
  const n = k => ownedOf(owned, k).length;
  const cnt = (v, one, many) => h('span', h('b', String(v)), ` ${v === 1 ? one : many}`);
  return h('div.pg-cz',
    h('button.vl-dp-go.pg-cz-go', { type: 'button', onclick: () => openDress(data, { name: o.name, wear: o.onWear, view: o.onView }) }, 'CUSTOMIZE YOUR CARD'),
    h('div.vl-dc-row.pg-cz-n', { 'aria-label': 'Your collection' }, cnt(n('card'), 'card', 'cards'), cnt(n('emblem'), 'emblem', 'emblems'), cnt(n('glow'), 'glow', 'glows'), cnt(n('tube'), 'tube', 'tubes')));
}

/**
 * data = /api/profile 'me' ({ profile, stats: { xp, g, b, st, it, ac } }); o = { name, onWear(slot, id), onFlame(), now }
 * → [elements] in the owner's order: LEVEL · THE STREAK · STATS · ACHIEVEMENTS · CITY SIGHTINGS (+ a favor to call in, when held)
 */
export function progressSections(data, o = {}) {
  const p = data.profile || {}, s = data.stats || {};
  const now = o.now || Date.now();
  const L = levelInfo(s.xp || p.x || 0);
  const sv = s.st ? streakView(s.st, streakDay(now)) : null;
  const best = Math.max((s.st && s.st.b) || 0, (s.st && s.st.n) || 0);
  const bests = Object.values(s.b || {}).filter(x => x && x.a != null).length;

  const level = h('section.pg-panel.pg-prof-lv',
    h('div.pg-prof-h', h('span', `LEVEL ${L.lvl}`), h('em.pg-xp', L.max ? `${num(s.xp)} XP · THE TOP` : `${num(L.into)} / ${num(L.to - L.from)} XP`)),
    h('div.pg-bar.pg-bar-gold', h('i.pg-bar-had', { style: { transform: `scaleX(${L.frac})` } }), h('i.pg-bar-glint', { 'aria-hidden': 'true', style: { '--f': String(L.frac) } }, h('i'))),
    h('div.pg-band', { style: { marginTop: '9px' } }, h('b', L.band.name), h('em', ` · ${L.band.line}`)));
  const streak = sv ? h('button.pg-box.pg-row-btn.pg-streak.is-on', { type: 'button', onclick: () => o.onFlame && o.onFlame() },
    flameIcon(sv.n ? (sv.state === 'frozen' ? 'frozen' : sv.state === 'lit' ? 'lit' : 'waiting') : 'out', 30),
    h('div.pg-streak-t', h('b', sv.n ? `${sv.n} NIGHT STREAK` : 'NO STREAK RIGHT NOW'),
      h('span', sv.state === 'lit' ? 'Tonight’s counted · see you tomorrow' : sv.state === 'out' ? (sv.winBack ? 'WIN IT BACK — three plays and the run returns' : 'Play a match tonight to light it') : 'Play tonight to keep it lit'))) : null;
  const stats = h('section.pg-panel.pg-stats',
    h('div', h('b', num(sum(s.g, 'p'))), h('span', 'MATCHES')),
    h('div', h('b', num(sum(s.g, 'w'))), h('span', 'WINS')),
    h('div', h('b', num(best)), h('span', 'BEST STREAK')),
    h('div', h('b', num(bests)), h('span', 'BESTS')));
  // ACHIEVEMENTS AS TROPHIES (js/progress/trophies.js): a medal in the tier colour, X% of players (the server's counts), the reward as a real
  // preview (tap = wear it), the date earned — only the ones you hold
  const ach = heldOf(s.ac).length ? trophiesSection(data, o) : null;
  const album = albumSection(s);
  const favor = favorPanel(data, o);
  const els = [level, streak, stats, ach, album, favor].filter(Boolean);
  pctFor().then(P => { for (const e of els) e.querySelectorAll('.pg-pct').forEach(x => { x.textContent = pctLine(P.a[x.dataset.a]); }); }).catch(() => {});
  return els;
}

export { ITEM, signOf };
