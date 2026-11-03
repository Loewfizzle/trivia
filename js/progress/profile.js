// THE PROFILE under the GILDED card (PROGRESSION A — the owner's mockups progression-membership-card.png A + progression-moments.png 4): the
// level bar, the stats (matches · wins · best streak · bests), the streak (tap → the streak card), the ACHIEVEMENTS you hold (+ X% OF
// PLAYERS HAVE THIS), THE VAULT = ONLY WHAT YOU OWN (cards · name glows · tube styles · emblems — tap one to wear it). No locked slots, no
// totals, no "3 of 12", no list of what's left (the owner: "I want them to guess"). PROGRESSION B: CITY SIGHTINGS = THE ALBUM (album-view.js).
import { h } from '../ui/dom.js';
import { levelInfo } from '../core/levels.js';
import { streakView, streakDay } from '../core/streak.js';
import { heldOf } from '../core/achievements.js';
import { ITEM } from '../core/items.js';
import { itemSwatch } from './moment.js';
import { num, pctFor, pctLine, flameIcon } from './look.js';
import { albumSection } from './album-view.js';
import { birthdayPanel, favorPanel } from './extras.js';
import { dressPanel } from '../vault/dress.js';

const sum = (g, k) => Object.values(g || {}).reduce((a, x) => a + ((x && x[k]) || 0), 0);

/**
 * data = /api/profile 'me' ({ profile, stats: { xp, g, b, st, it, ac } }); o = { name, onWear(slot, id), onFlame(), now }
 * → [elements] (the level, the stats, the streak, the achievements, THE VAULT)
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
    h('div.pg-bar', h('i.pg-bar-had', { style: { transform: `scaleX(${L.frac})` } })),
    h('div.pg-band', { style: { marginTop: '9px' } }, h('b', L.band.name), h('em', ` · ${L.band.line}`)));
  const stats = h('section.pg-panel.pg-stats',
    h('div', h('b', num(sum(s.g, 'p'))), h('span', 'MATCHES')),
    h('div', h('b', num(sum(s.g, 'w'))), h('span', 'WINS')),
    h('div', h('b', num(best)), h('span', 'BEST STREAK')),
    h('div', h('b', num(bests)), h('span', 'BESTS')));
  const streak = sv ? h('button.pg-box.pg-row-btn.pg-streak.is-on', { type: 'button', onclick: () => o.onFlame && o.onFlame() },
    flameIcon(sv.n ? (sv.state === 'frozen' ? 'frozen' : sv.state === 'lit' ? 'lit' : 'waiting') : 'out', 30),
    h('div.pg-streak-t', h('b', sv.n ? `${sv.n} NIGHT STREAK` : 'NO STREAK RIGHT NOW'),
      h('span', sv.state === 'lit' ? 'Tonight’s counted · see you tomorrow' : sv.state === 'out' ? (sv.winBack ? 'WIN IT BACK — three plays and the run returns' : 'Play a match tonight to light it') : 'Play tonight to keep it lit'))) : null;

  const held = heldOf(s.ac);
  const ach = held.length ? h('section.pg-panel',
    h('div.pg-prof-h', h('span', 'ACHIEVEMENTS'), h('em', 'only the ones you’ve earned')),
    h('div.pg-achs', ...held.map(a => h('div.pg-box.pg-ach', { dataset: { id: a.id } }, itemSwatch(a.item, o.name),
      h('div', h('b', a.name), h('span', a.line), h('em.pg-pct', { dataset: { a: a.id } })))))) : null;

  // THE VAULT 2B — DRESS YOUR CARD (the owner's approved mock, Nov 3 3:27 pm): ONE panel — your strip as it is now, the worn pieces'
  // names, a big DRESS YOUR CARD button (the dress screen: js/vault/dress.js) — + YOUR COLLECTION's count line. The long lists are gone.
  const [vault, collection] = dressPanel(data, { name: o.name, wear: o.onWear, view: o.onView });
  const album = albumSection(s);
  const extras = [favorPanel(data, o), data.priv || o.birthday ? birthdayPanel(data, o) : null];
  const els = [vault, level, stats, streak, ach, album, collection, ...extras].filter(Boolean);
  pctFor().then(P => { for (const e of els) e.querySelectorAll('.pg-pct').forEach(x => { x.textContent = pctLine(P.a[x.dataset.a]); }); }).catch(() => {});
  return els;
}

export { ITEM };
