// The results moments, on every game's podium (ui/final.js): what this match did for you on the global boards.
// Sleek plaques (CITY F: a thin neon frame in the game's accent + an icon; #1 WORLDWIDE the one gold) — NEW PERSONAL BEST, #14 WORLDWIDE, ENTERED THE TOP 10,
// #1 THIS WEEK — then the XP you earned filling your bar, then THE END-OF-ROUND MOMENT (PROGRESSION A — js/progress/moment.js: the
// XP lines, the level + its level-up, the streak, the achievements; it replaced the old RANK UP overlay).
// The server's answer can arrive late (a phone offline at the podium): the plaques appear whenever it does.
import { h, reducedMotion, vibrate } from '../ui/dom.js';
import { loadMe } from '../identity.js';
import { countUp } from '../ui/components.js';
import { RANK_COLORS } from '../ui/emblems.js';
import { boardDef, fmtValue } from '../core/boards.js';
import { levelInfo } from '../core/levels.js';
import { state } from '../store.js';
import { GAMES } from '../config.js';
import { onOutcome, outcomeFor, matchKey } from './queue.js';
import { boardSfx } from '../board/audio.js';
import { settings } from '../audio/settings.js';
import { lazyImport } from '../ui/lazy-import.js';
import { soloXpText } from '../core/solo-line.js';

const reduced = () => !!settings.reducedFx || reducedMotion();
// adds the class on the next frames (so the transition runs), with a timer fallback for a tab whose frames are paused
function turnOn(el, cls) {
  let done = false;
  const go = () => { if (!done && el) { done = true; el.classList.add(cls); } };
  requestAnimationFrame(() => requestAnimationFrame(go));
  setTimeout(go, 120);
}
const num = n => Math.round(n).toLocaleString('en-US');
// (CITY F — THE RESULTS PLAQUES' icons: drawn lines, currentColor — the frame's accent (gold on #1 WORLDWIDE))
const PLAQUE_ICONS = {
  crown: '<path d="M4 18h16"/><path d="M4.6 15 3.4 7.5l4.8 3.6L12 4.6l3.8 6.5 4.8-3.6-1.2 7.5z"/>',
  rise: '<path d="M3.5 17 9.5 11l4 4 7-7.5"/><path d="M15 7.5h5.5V13"/>',
  globe: '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2"/><path d="M12 3.4c-3.4 3.6-3.4 13.6 0 17.2"/><path d="M12 3.4c3.4 3.6 3.4 13.6 0 17.2"/>',
  laurel: '<path d="M8.4 20.5C4 17.2 3.2 10.4 6.6 4.6"/><path d="M15.6 20.5c4.4-3.3 5.2-10.1 1.8-15.9"/><path d="M5.2 8.6 7.6 9.4M4.6 12.6l2.6.2M5.8 16.6l2.2-1"/><path d="M18.8 8.6l-2.4.8M19.4 12.6l-2.6.2M18.2 16.6l-2.2-1"/>',
  calendar: '<rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2"/><path d="M3.6 10h16.8M8.2 3.4v4M15.8 3.4v4"/>',
};
function plaqueIcon(id) {
  const i = h('span.rc-ico', { 'aria-hidden': 'true' });
  i.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PLAQUE_ICONS[id] || PLAQUE_ICONS.rise}</svg>`;
  return i;
}
const gameName = id => (GAMES.find(g => g.id === id) || { name: '' }).name;
const label = def => (def.game === 'pulse' && def.song ? `${def.label} · ${def.diff.toUpperCase()}` : def.kind === 'career' ? `${gameName(def.game)} · ${def.label}` : def.label);

/** The plaques worth showing, best first (at most three). */
export function plaquesFor(o) {
  if (!o || o.none || o.skip) return [];
  const out = [];
  const pbBoards = new Set((o.pbs || []).map(p => p.b));
  for (const r of o.ranks || []) {
    const def = boardDef(r.b);
    if (!def) continue;
    const a = r.all || {}, w = r.week || {};
    const career = def.kind === 'career';
    // career boards only make a moment near the top; records whenever they're on the board
    // (CITY F — THE RESULTS PLAQUES: each plaque's ICON says what it is — #1 WORLDWIDE = the gold CROWN (the ONE gold moment), a worldwide
    //  rank = the GLOBE, the top 10 = the LAUREL, this week's = the CALENDAR, a personal best = the RISING ARROW)
    if (a.rank === 1 && (!career || a.prev !== 1)) out.push({ k: 'first', pri: 0, title: '#1 WORLDWIDE', sub: label(def), rank: 1, sound: 'first', icon: 'crown', gold: true });
    else if (w.rank === 1 && (!career || w.prev !== 1)) out.push({ k: 'first', pri: 1, title: '#1 THIS WEEK', sub: label(def), rank: 1, sound: 'first', icon: 'calendar' });
    else if (a.rank && a.rank <= 10 && (a.prev == null || a.prev > 10)) out.push({ k: 'top10', pri: 2, title: 'ENTERED THE TOP 10', sub: `${label(def)} · #${a.rank} WORLDWIDE`, rank: a.rank, sound: 'top10', icon: 'laurel' });
    else if (a.rank && (pbBoards.has(r.b) || (career && a.rank <= 100 && a.prev !== a.rank)) && a.rank <= (career ? 100 : 1e9)) out.push({ k: 'world', pri: 4, title: `#${num(a.rank)} WORLDWIDE`, sub: label(def), rank: a.rank, count: true, sound: 'top10', icon: 'globe' });
    else if (w.rank && w.rank <= 10 && (w.prev == null || w.prev > w.rank)) out.push({ k: 'week', pri: 5, title: `#${w.rank} THIS WEEK`, sub: label(def), rank: w.rank, count: true, sound: 'top10', icon: 'calendar' });
  }
  for (const p of o.pbs || []) {
    const def = boardDef(p.b);
    if (!def) continue;
    out.push({ k: 'pb', pri: 3, title: p.first ? 'PERSONAL BEST SET' : 'NEW PERSONAL BEST', sub: label(def), value: fmtValue(def, p.v), was: p.prev != null ? fmtValue(def, p.prev) : null, sound: 'pb', icon: 'rise' });
  }
  // the same moment on several boards reads as one plaque: "#1 WORLDWIDE — BEST MATCH · FASTEST 5-LETTER SOLVE"
  const merged = [];
  for (const p of out.sort((a, b) => a.pri - b.pri)) {
    const key = p.k === 'pb' ? 'pb' : p.title;
    const m = merged.find(x => x.key === key);
    if (!m) { merged.push({ ...p, key, n: 1 }); continue; }
    m.n += 1;
    m.sub = `${m.sub} · ${p.sub}`;
    if (p.k === 'pb') { m.title = `${m.n} NEW PERSONAL BESTS`; m.value = null; m.was = null; }
  }
  return merged.slice(0, 3);
}

/** Mounts the results slot on a podium. Returns { el, destroy }. */
export function attachCallouts(code, game) {
  const key = matchKey(code, game.matchId);
  const el = h('div.rc', { 'aria-live': 'polite' });
  // (THE FREEFALL CITY PASS — THE XP LINE AS THE FOOTER (the owner, Nov 27 12:04 pm): the XP is ONE small line the frame pins at the very
  //  bottom, under SHARE · HOME (ui/final.js `.final-xp`) — never a box in the podium's body: no end screen scrolls for it)
  const foot = h('div.rc-foot', { 'aria-live': 'polite' });
  const t0 = performance.now();
  const timers = [];
  let shown = false, destroyed = false, moment = null;
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!destroyed) fn(); }, ms));

  function show(o) {
    if (shown || destroyed || !o || o.none) return;
    shown = true;
    // (PROGRESSION A — RAINMAKER / SNOWED IN: a counted match → the server looks up the REAL weather where this phone is)
    if (!o.skip) lazyImport(import('./events.js'), './events.js').then(m => m.progressEvent('weather', { again: true })).catch(() => {});
    // wait for the podium's crown (≈ 2.6 s after the podium appears)
    const wait = Math.max(0, 2900 - (performance.now() - t0));
    later(() => play(o), reduced() ? 0 : wait);
  }

  function play(o) {
    const list = plaquesFor(o);
    const step = reduced() ? 120 : 650;
    // (PD-6 ADD-ON — THE SOLO PODIUM SAYS WHAT IT PAID: a solo run's outcome carries the server's count `so` → ONE plain line under the score,
    //  first, in place of the XP box (the podium fits in Safari with its toolbars); an outcome without it (an older server) shows no line)
    const sl = soloLine(o);
    if (sl) { foot.append(sl); turnOn(sl, 'is-in'); }
    list.forEach((p, i) => later(() => plaque(p), i * step));
    if (o.xp && o.xp.gain && !sl) later(() => xpLine(o), list.length * step + 150);
    // PROGRESSION A — THE END-OF-ROUND MOMENT right after the podium (the crown + the board's plaques): the XP, the level (its level-up +
    // unlocks), the streak, the tease, the achievements — every phone its own; CONTINUE comes back here (REMATCH / LOBBY as today).
    // (it replaces the old RANK UP overlay: a new band is the moment's level-up now)
    if (o.xp && o.xp.gain) later(() => openTheMoment(o), list.length * step + (reduced() ? 400 : 1600));
    if (list.length && !reduced()) vibrate(list[0].k === 'first' ? [30, 50, 30, 50, 90] : [24, 40, 24]);
  }

  function openTheMoment(o) {
    const night = (state.night && Object.keys(state.night).length) || 1;
    const me = loadMe();
    lazyImport(import('../progress/moment.js'), '../progress/moment.js').then(m => { if (!destroyed) return m.openMoment(o, { game: game.id, match: night, name: (me && me.profile && me.profile.n) || '', avatar: me && me.profile && me.profile.a, color: me && me.profile && me.profile.c }).then(x => { moment = x; }); }).catch(() => {});
  }

  /** the solo line: "+15 XP · SOLO RUN · 3 OF 4 TODAY" while it pays, "TODAY’S SOLO XP DONE · MORE AT 4 AM" once it doesn't — null without the
   *  server's count (or a skipped / capped outcome) */
  function soloLine(o) {
    const t = soloXpText(o);
    return t ? h('p.rc-solo', { dataset: { paid: o.xp && o.xp.gain ? '1' : '0' } }, t) : null;
  }

  function plaque(p) {
    let counter = null;
    const title = p.count
      ? h('b.rc-n', '#', counter = h('span', num(Math.max(p.rank * 4, 50))), ` ${p.title.replace(/^#[\d,]+ /, '')}`)
      : h('b.rc-n', p.title);
    // (CITY F — THE RESULTS PLAQUES: a thin neon line frame in the GAME's accent + its icon; #1 WORLDWIDE alone is GOLD — the crown, a gold
    //  frame, a foil sweep + a few sparks on arrival (once, transform + opacity only; reduced motion = the still). Never a box, never a pill)
    const item = h('div.rc-plaque', { class: `is-${p.k}${p.gold ? ' is-gold' : ''}` },
      p.gold ? h('span.rc-sweep', { 'aria-hidden': 'true' }) : null,
      p.gold ? h('span.rc-sparks', { 'aria-hidden': 'true' }, ...[0, 1, 2, 3, 4, 5].map(i => h('i', { style: { '--i': String(i) } }))) : null,
      plaqueIcon(p.icon),
      h('div.rc-body', title, h('span.rc-sub', p.sub)),
      p.value ? h('div.rc-val', h('b', p.value), p.was ? h('small', `was ${p.was}`) : null) : null);
    el.append(item);
    turnOn(item, 'is-in');
    if (counter) countUp(counter, Math.max(p.rank * 4, 50), p.rank, reduced() ? 1 : 1100, v => num(v));
    boardSfx(p.sound);
  }

  // THE XP LINE (the footer): "+42 XP · STREET · LEVEL 7 ›" — still the way to your card (FRIENDS B: a real <button>, so iOS sends the tap);
  // the parts, the bar, the streak are THE END-OF-ROUND MOMENT's (progress/moment.js) — the line says what you earned + where you stand
  function xpLine(o) {
    const to = levelInfo(o.xp.to), gain = h('b', '+0');
    const line = h('button.rc-xp', { type: 'button', style: { '--rk': RANK_COLORS[to.band.r] }, 'aria-label': 'Your card', onclick: () => lazyImport(import('../screens/profile.js'), '../screens/profile.js').then(m => m.openCard()) },
      h('span.rc-xp-top', gain, h('span', ' XP')), h('span.rc-xp-step', `${to.band.name} · LEVEL ${to.lvl}`), h('span.rc-xp-chev', { 'aria-hidden': 'true' }, '›'));
    foot.append(line);
    turnOn(line, 'is-in');
    countUp(gain, 0, o.xp.gain, reduced() ? 1 : 900, v => `+${num(v)}`);
  }

  const off = onOutcome((k, o) => { if (k === key) show(o); });
  show(outcomeFor(key));

  return {
    el,
    foot,
    destroy() {
      destroyed = true;
      off();
      timers.forEach(clearTimeout);
      if (moment) { moment.close(); moment = null; }   // (the podium left — a rematch, the lobby: the moment goes with it)
    },
  };
}
