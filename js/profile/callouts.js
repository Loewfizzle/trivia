// The results moments, on every game's podium (ui/final.js): what this match did for you on the global boards.
// Elegant plaques with a light sweep and a counting rank — NEW PERSONAL BEST, #14 WORLDWIDE, ENTERED THE TOP 10,
// #1 THIS WEEK — then the XP you earned filling your bar, then THE END-OF-ROUND MOMENT (PROGRESSION A — js/progress/moment.js: the
// XP lines, the level + its level-up, the streak, the achievements; it replaced the old RANK UP overlay).
// The server's answer can arrive late (a phone offline at the podium): the plaques appear whenever it does.
import { h, reducedMotion, vibrate } from '../ui/dom.js';
import { loadMe } from '../identity.js';
import { countUp } from '../ui/components.js';
import { emblem, RANK_COLORS } from '../ui/emblems.js';
import { boardDef, fmtValue } from '../core/boards.js';
import { levelInfo } from '../core/levels.js';
import { state } from '../store.js';
import { GAMES } from '../config.js';
import { onOutcome, outcomeFor, matchKey } from './queue.js';
import { boardSfx } from '../board/audio.js';
import { settings } from '../audio/settings.js';

const reduced = () => !!settings.reducedFx || reducedMotion();
// adds the class on the next frames (so the transition runs), with a timer fallback for a tab whose frames are paused
function turnOn(el, cls) {
  let done = false;
  const go = () => { if (!done && el) { done = true; el.classList.add(cls); } };
  requestAnimationFrame(() => requestAnimationFrame(go));
  setTimeout(go, 120);
}
const num = n => Math.round(n).toLocaleString('en-US');
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
    if (a.rank === 1 && (!career || a.prev !== 1)) out.push({ k: 'first', pri: 0, title: '#1 WORLDWIDE', sub: label(def), rank: 1, sound: 'first' });
    else if (w.rank === 1 && (!career || w.prev !== 1)) out.push({ k: 'first', pri: 1, title: '#1 THIS WEEK', sub: label(def), rank: 1, sound: 'first' });
    else if (a.rank && a.rank <= 10 && (a.prev == null || a.prev > 10)) out.push({ k: 'top10', pri: 2, title: 'ENTERED THE TOP 10', sub: `${label(def)} · #${a.rank} WORLDWIDE`, rank: a.rank, sound: 'top10' });
    else if (a.rank && (pbBoards.has(r.b) || (career && a.rank <= 100 && a.prev !== a.rank)) && a.rank <= (career ? 100 : 1e9)) out.push({ k: 'world', pri: 4, title: `#${num(a.rank)} WORLDWIDE`, sub: label(def), rank: a.rank, count: true, sound: 'top10' });
    else if (w.rank && w.rank <= 10 && (w.prev == null || w.prev > w.rank)) out.push({ k: 'week', pri: 5, title: `#${w.rank} THIS WEEK`, sub: label(def), rank: w.rank, count: true, sound: 'top10' });
  }
  for (const p of o.pbs || []) {
    const def = boardDef(p.b);
    if (!def) continue;
    out.push({ k: 'pb', pri: 3, title: p.first ? 'PERSONAL BEST SET' : 'NEW PERSONAL BEST', sub: label(def), value: fmtValue(def, p.v), was: p.prev != null ? fmtValue(def, p.prev) : null, sound: 'pb' });
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
  const t0 = performance.now();
  const timers = [];
  let shown = false, destroyed = false, moment = null;
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!destroyed) fn(); }, ms));

  function show(o) {
    if (shown || destroyed || !o || o.none) return;
    shown = true;
    // (PROGRESSION A — RAINMAKER / SNOWED IN: a counted match → the server looks up the REAL weather where this phone is)
    if (!o.skip) import('./events.js').then(m => m.progressEvent('weather', { again: true })).catch(() => {});
    // wait for the podium's crown (≈ 2.6 s after the podium appears)
    const wait = Math.max(0, 2900 - (performance.now() - t0));
    later(() => play(o), reduced() ? 0 : wait);
  }

  function play(o) {
    const list = plaquesFor(o);
    const step = reduced() ? 120 : 650;
    list.forEach((p, i) => later(() => plaque(p), i * step));
    if (o.xp && o.xp.gain) later(() => xpLine(o), list.length * step + 150);
    // PROGRESSION A — THE END-OF-ROUND MOMENT right after the podium (the crown + the board's plaques): the XP, the level (its level-up +
    // unlocks), the streak, the tease, the achievements — every phone its own; CONTINUE comes back here (REMATCH / LOBBY as today).
    // (it replaces the old RANK UP overlay: a new band is the moment's level-up now)
    if (o.xp && o.xp.gain) later(() => openTheMoment(o), list.length * step + (reduced() ? 400 : 1600));
    if (list.length && !reduced()) vibrate(list[0].k === 'first' ? [30, 50, 30, 50, 90] : [24, 40, 24]);
  }

  function openTheMoment(o) {
    const night = (state.night && Object.keys(state.night).length) || 1;
    const me = loadMe();
    import('../progress/moment.js').then(m => { if (!destroyed) return m.openMoment(o, { game: game.id, match: night, name: (me && me.profile && me.profile.n) || '' }).then(x => { moment = x; }); }).catch(() => {});
  }

  function plaque(p) {
    let counter = null;
    const title = p.count
      ? h('b.rc-n', '#', counter = h('span', num(Math.max(p.rank * 4, 50))), ` ${p.title.replace(/^#[\d,]+ /, '')}`)
      : h('b.rc-n', p.title);
    const item = h('div.rc-plaque', { class: `is-${p.k}` },
      h('span.rc-sweep', { 'aria-hidden': 'true' }),
      h('span.rc-mark', { 'aria-hidden': 'true' }),
      h('div.rc-body', title, h('span.rc-sub', p.sub)),
      p.value ? h('div.rc-val', h('b', p.value), p.was ? h('small', `was ${p.was}`) : null) : null);
    el.append(item);
    turnOn(item, 'is-in');
    if (counter) countUp(counter, Math.max(p.rank * 4, 50), p.rank, reduced() ? 1 : 1100, v => num(v));
    boardSfx(p.sound);
  }

  function xpLine(o) {
    const from = levelInfo(o.xp.from), to = levelInfo(o.xp.to);
    const fill = h('span.rc-xp-fill', { style: { '--f0': String(from.lvl === to.lvl ? from.frac : 0), '--f': String(to.frac) } });
    const gain = h('b', '+0');
    const line = h('div.rc-xp', { style: { '--rk': RANK_COLORS[to.band.r] } },
      emblem(to.band.r, 22),
      h('div.rc-xp-main',
        h('div.rc-xp-top', gain, h('span', ' XP'), h('span.rc-xp-parts', o.xp.parts.map(p => p.label).join(' · '))),
        h('div.rc-xp-bar', fill)),
      h('span.rc-xp-next', ...xpNext(o)));
    el.append(line);
    turnOn(line, 'is-in');
    countUp(gain, 0, o.xp.gain, reduced() ? 1 : 900, v => `+${num(v)}`);
  }

  // under the bar: the band + the level, what the next level needs, the streak, and the card
  function xpNext(o) {
    const to = levelInfo(o.xp.to);
    return [
      // (SHELL 2.0 A — ADD-ON: the band · level OVER what the next needs — two lines, so YOUR CARD fits beside them at 390 and nothing collides)
      h('span.rc-xp-lv', h('span.rc-xp-step', `${to.band.name} · LEVEL ${to.lvl}`), to.max ? null : h('span.rc-xp-need', `${num(to.need)} XP TO ${to.lvl + 1}`)),
      o.streak >= 2 ? h('span', `${o.streak}-NIGHT STREAK 🔥`) : null,
      h('button.btn.btn-ghost.btn-sm.rc-xp-card', { type: 'button', onclick: () => import('../screens/profile.js').then(m => m.openCard()) }, 'YOUR CARD'),   // (SHELL 2.0 A: a small quiet tube)
    ];
  }

  const off = onOutcome((k, o) => { if (k === key) show(o); });
  show(outcomeFor(key));

  return {
    el,
    destroy() {
      destroyed = true;
      off();
      timers.forEach(clearTimeout);
      if (moment) { moment.close(); moment = null; }   // (the podium left — a rematch, the lobby: the moment goes with it)
    },
  };
}
