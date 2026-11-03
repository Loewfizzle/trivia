// THE PROFILE under the GILDED card (PROGRESSION A — the owner's mockups progression-membership-card.png A + progression-moments.png 4): the
// level bar, the stats (matches · wins · best streak · bests), the streak (tap → the streak card), the ACHIEVEMENTS you hold (+ X% OF
// PLAYERS HAVE THIS), THE VAULT = ONLY WHAT YOU OWN (cards · name glows · tube styles · emblems — tap one to wear it). No locked slots, no
// totals, no "3 of 12", no list of what's left (the owner: "I want them to guess"). PROGRESSION B: CITY SIGHTINGS = THE ALBUM (album-view.js).
import { h } from '../ui/dom.js';
import { levelInfo } from '../core/levels.js';
import { streakView, streakDay } from '../core/streak.js';
import { heldOf } from '../core/achievements.js';
import { ownedOf, ITEM } from '../core/items.js';
import { itemSwatch } from './moment.js';
import { num, pctFor, pctLine, flameIcon } from './look.js';
import { albumSection } from './album-view.js';
import { birthdayPanel, favorPanel } from './extras.js';
import { cardPicker, stylePicker } from '../vault/picker.js';
import { createSurface } from '../fx/renderer.js';

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

  const owned = s.it || {};
  const wear = { card: p.cd || 'card-gilded', glow: p.g || null, tube: p.tb || null, shape: p.es || null };
  // THE VAULT's ONE effect surface (2A): the cards' + the style rows' strips are all slots on it (one canvas, one GPU context)
  const vault = h('section.pg-panel.pg-vault.fx-host');
  const surface = createSurface(vault, { label: 'vault' });
  // YOUR CARDS (THE VAULT 1B): the real slim strips — tap one to wear it, VIEW for the full card (js/vault/picker.js)
  const cards = ownedOf(owned, 'card');
  const picker = cards.length ? cardPicker({ surface, cards, wearing: wear.card, who: { name: o.name, lv: L.lvl, avatar: p.a, color: p.c, no: p.t, shape: wear.shape, tube: wear.tube, glow: wear.glow },
    onWear: id => o.onWear && o.onWear('card', id), onView: id => o.onView ? o.onView(id) : import('../vault/full.js').then(m => m.openFullCard(id, { name: o.name, lv: L.lvl, avatar: p.a, color: p.c, pub: p, no: p.t, at: p.at, fd: !!p.fd, shape: wear.shape, tube: wear.tube, glow: wear.glow })) }) : null;
  // EMBLEMS · TUBE STYLES · NAME GLOWS (THE VAULT 2A): rows like the cards — each on the player's own strip (js/vault/picker.js#stylePicker)
  const who = { name: o.name, lv: L.lvl, avatar: p.a, color: p.c, no: p.t };
  const styleRow = (kind, slot, label) => {
    const items = ownedOf(owned, kind);
    if (!items.length) return [];
    const sp = stylePicker({ surface, kind, items, wearing: wear, who, onWear: id => o.onWear && o.onWear(slot, id) });
    return [h('div.pg-vault-k', label), sp.el];
  };
  vault.append(
    h('div.pg-prof-h', h('span', 'THE VAULT'), h('em', 'tap one to wear it')),
    ...(picker ? [h('div.pg-vault-k', 'YOUR CARDS'), picker.el] : []), ...styleRow('emblem', 'shape', 'EMBLEMS'), ...styleRow('tube', 'tube', 'TUBE STYLES'), ...styleRow('glow', 'glow', 'NAME GLOWS'),
    h('p.pg-only', 'Only what you own — the rest is for you to find.'));
  const album = albumSection(s);
  const extras = [favorPanel(data, o), data.priv || o.birthday ? birthdayPanel(data, o) : null];
  const els = [level, stats, streak, ach, album, vault, ...extras].filter(Boolean);
  pctFor().then(P => { for (const e of els) e.querySelectorAll('.pg-pct').forEach(x => { x.textContent = pctLine(P.a[x.dataset.a]); }); }).catch(() => {});
  return els;
}

export { ITEM };
