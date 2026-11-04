// THE PROFILE's SECTIONS (PROGRESSION A; THE VAULT 2C — THE PROFILE REARRANGED; LOBBY 2.0 A — THE PROFILE POLISH, the owner's 2C review).
// Top → bottom: 1 YOUR FULL CARD + CUSTOMIZE YOUR CARD (the caller's hero — screens/profile.js; the screen's ONE gold button); 2 LEVEL + the
// bar (the sign's HOT-PINK tube, a slow glint) + the streak's row (→ the streak card); 3 THE GOAL TILE (neon cyan — the one thing to DO);
// 4 STATS; 5 the LATEST 3 TROPHIES + ALL ACHIEVEMENTS › (THE TROPHY CASE sheet); 6 the latest CITY SIGHTINGS + ALL ›; then the caller's
// MASTERY + ACCOUNT. The panels are faint dark glass; gold only for CUSTOMIZE YOUR CARD, the section headers + your card's frame.
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
import { weeklyGoal, goalProgress, GOAL_XP } from '../core/ranks.js';
import { GOAL_GAMES } from '../core/boards.js';
import { weekKey, weekEndsAt } from '../core/week.js';
import { GAMES } from '../config.js';

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

  // LOBBY 2.0 A — THE LEVEL BAR leaves gold (the owner: CUSTOMIZE + a gold bar under it = too much gold): the sign's HOT-PINK NEON as a lit
  // TUBE that fills (a white-hot core in a pink glow, a slow glint) — the end of round's own pink, so the bar is one colour everywhere. The
  // streak rides in the same tile as one slim row (→ the streak card) — the page keeps the owner's list: card · level · goal · stats · …
  const level = h('section.pg-panel.pg-prof-lv',
    h('div.pg-prof-h', h('span', `LEVEL ${L.lvl}`), h('em.pg-xp', L.max ? `${num(s.xp)} XP · THE TOP` : `${num(L.into)} / ${num(L.to - L.from)} XP`)),
    h('div.pg-bar.pg-bar-tube', h('i.pg-bar-had', { style: { transform: `scaleX(${L.frac})` } }), h('i.pg-bar-glint', { 'aria-hidden': 'true', style: { '--f': String(L.frac) } }, h('i'))),
    h('div.pg-band', { style: { marginTop: '9px' } }, h('b', L.band.name), h('em', ` · ${L.band.line}`)),
    sv ? h('button.pg-lv-streak', { type: 'button', onclick: () => o.onFlame && o.onFlame() },
      flameIcon(sv.n ? (sv.state === 'frozen' ? 'frozen' : sv.state === 'lit' ? 'lit' : 'waiting') : 'out', 22),
      h('span.pg-lv-st', h('b', sv.n ? `${sv.n} NIGHT STREAK` : 'NO STREAK RIGHT NOW'),
        h('small', sv.state === 'lit' ? 'Tonight’s counted · see you tomorrow' : sv.state === 'out' ? (sv.winBack ? 'WIN IT BACK — three plays and the run returns' : 'Play a match tonight to light it') : 'Play tonight to keep it lit')),
      h('i', '›')) : null);
  const goal = goalTile(data, now);
  const stats = h('section.pg-panel.pg-stats',
    h('div', h('b', num(sum(s.g, 'p'))), h('span', 'MATCHES')),
    h('div', h('b', num(sum(s.g, 'w'))), h('span', 'WINS')),
    h('div', h('b', num(best)), h('span', 'BEST STREAK')),
    h('div', h('b', num(bests)), h('span', 'BESTS')));
  // ACHIEVEMENTS AS TROPHIES (js/progress/trophies.js): the LATEST 3 + ALL ACHIEVEMENTS › (THE TROPHY CASE) — a medal in the tier colour, X% of
  // players (the server's counts), the reward as a real preview (tap = equip it), the date earned — only the ones you hold
  const ach = heldOf(s.ac).length ? trophiesSection(data, o) : null;
  const album = albumSection(s);
  const favor = favorPanel(data, o);
  const els = [level, goal, stats, ach, album, favor].filter(Boolean);
  pctFor().then(P => { for (const e of els) e.querySelectorAll('.pg-pct').forEach(x => { x.textContent = pctLine(P.a[x.dataset.a]); }); }).catch(() => {});
  return els;
}

/** LOBBY 2.0 A — THE GOAL TILE (the owner: "if goals unlock rewards, players must SEE that — make it bigger, a bigger deal"): right under
 *  LEVEL (it's the one thing to DO; stats are just a record) — its own dark glass tile with a neon-CYAN edge; "THIS WEEK'S GOAL · N DAYS
 *  LEFT" small on top; the goal in BIG type; a THICK cyan neon-tube bar + "3 / 8"; THE REWARD as a real chip; done = lit + CLAIMED ✓ */
export function goalTile(data, now = Date.now()) {
  const s = data.stats || {};
  const wk = s.wk || weekKey(now), goal = weeklyGoal(wk, GOAL_GAMES), gp = goalProgress(goal, s.gw);
  const paid = s.gd === wk, days = Math.max(1, Math.ceil((weekEndsAt(now) - now) / 86_400_000));
  const gname = goal.game ? (GAMES.find(g => g.id === goal.game) || {}).name : null;
  const frac = Math.max(0, Math.min(1, gp.have / Math.max(1, gp.n)));
  return h('section.pf-goal-t', { class: paid ? 'is-done' : '', 'aria-label': 'This week’s goal' },
    h('div.pf-gt-h', h('span', 'THIS WEEK’S GOAL'), h('span', paid ? 'DONE THIS WEEK' : `${days} DAY${days > 1 ? 'S' : ''} LEFT`)),
    h('b.pf-gt-goal', goal.kind === 'game' ? `Play 4 matches of ${gname}` : goal.text),
    h('div.pf-gt-row',
      h('div.pf-gt-bar', h('i', { style: { transform: `scaleX(${paid ? 1 : frac})` } })),
      h('span.pf-gt-n', paid ? `${gp.n} / ${gp.n}` : `${gp.have} / ${gp.n}`)),
    h('div.pf-gt-f',
      h('span.pf-gt-k', paid ? 'REWARD' : 'THE REWARD'),
      h('span.pf-gt-chip', h('b', `+${GOAL_XP}`), ' XP'),
      paid ? h('span.pf-gt-claimed', 'CLAIMED ✓') : null));
}

export { ITEM, signOf };
