// The results moments, on every game's podium (ui/final.js): what this match did for you on the global boards.
// Elegant plaques with a light sweep and a counting rank — NEW PERSONAL BEST, #14 WORLDWIDE, ENTERED THE TOP 10,
// #1 THIS WEEK — then the XP you earned filling your bar, and when it crosses a line, the RANK UP: the old emblem
// dissolves, the new one forges in light, the name resolves (≈ 3 s, tap to skip).
// The server's answer can arrive late (a phone offline at the podium): the plaques appear whenever it does.
import { h, reducedMotion, vibrate } from '../ui/dom.js';
import { loadMe } from '../identity.js';
import { countUp } from '../ui/components.js';
import { emblem, RANK_COLORS } from '../ui/emblems.js';
import { boardDef, fmtValue } from '../core/boards.js';
import { RANKS, progress, step, stepIndex, unlockedBetween } from '../core/ranks.js';
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
  let shown = false, destroyed = false, upEl = null;
  const later = (fn, ms) => timers.push(setTimeout(() => { if (!destroyed) fn(); }, ms));

  function show(o) {
    if (shown || destroyed || !o || o.none) return;
    shown = true;
    // wait for the podium's crown (≈ 2.6 s after the podium appears)
    const wait = Math.max(0, 2900 - (performance.now() - t0));
    later(() => play(o), reduced() ? 0 : wait);
  }

  function play(o) {
    const list = plaquesFor(o);
    const step = reduced() ? 120 : 650;
    list.forEach((p, i) => later(() => plaque(p), i * step));
    if (o.xp && o.xp.gain) later(() => xpLine(o), list.length * step + 150);
    // THE VAULT: what this match unlocked, shown as the thing itself
    const ul = o.xp ? unlockedBetween(o.xp.from, o.xp.to) : [];
    ul.forEach((u, k) => later(() => unlocked(u), list.length * step + 900 + k * 700));
    if (o.rk && o.rk.to > o.rk.from) later(() => rankUp(o.rk.from, o.rk.to), list.length * step + (reduced() ? 300 : 1500));
    if (list.length && !reduced()) vibrate(list[0].k === 'first' ? [30, 50, 30, 50, 90] : [24, 40, 24]);
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
    const from = step(o.xp.from), to = step(o.xp.to);
    const fill = h('span.rc-xp-fill', { style: { '--f0': String(stepIndex(o.xp.from) === stepIndex(o.xp.to) ? from.frac : 0), '--f': String(to.frac) } });
    const gain = h('b', '+0');
    const line = h('div.rc-xp', { style: { '--rk': RANK_COLORS[to.i] } },
      emblem(to.i, 22),
      h('div.rc-xp-main',
        h('div.rc-xp-top', gain, h('span', ' XP'), h('span.rc-xp-parts', o.xp.parts.map(p => p.label).join(' · '))),
        h('div.rc-xp-bar', fill)),
      h('span.rc-xp-next', ...xpNext(o)));
    el.append(line);
    turnOn(line, 'is-in');
    countUp(gain, 0, o.xp.gain, reduced() ? 1 : 900, v => `+${num(v)}`);
  }

  // under the bar: the new step (a step up inside a rank is its own small moment), the streak, and the card
  function xpNext(o) {
    const to = step(o.xp.to);
    const up = stepIndex(o.xp.to) > stepIndex(o.xp.from) && !(o.rk && o.rk.to > o.rk.from);
    if (up) { boardSfx('forge'); }
    return [
      h('span.rc-xp-step', up ? `NEW: ${to.name}` : to.name),
      h('span', to.nextName ? `${num(to.need)} TO ${to.nextName}` : ''),
      o.streak >= 2 ? h('span', `${o.streak}-NIGHT STREAK 🔥`) : null,
      h('button.rc-xp-card', { type: 'button', onclick: () => import('../screens/profile.js').then(m => m.openCard()) }, 'YOUR CARD'),
    ];
  }

  function unlocked(u) {
    import('../screens/profile.js').then(m => {
      const me = loadMe();
      const pub = me && me.profile ? me.profile : null;
      const show = u.kind === 'finish'
        ? m.memberCard(pub, {}, 1e9, { fin: u.id, mini: true })
        : h('span.rc-ul-name', { class: `nm-glow-${u.id}` }, (pub && pub.n) || 'YOU');
      const item = h('div.rc-plaque.rc-unlock', { class: `is-${u.kind}` },
        h('span.rc-sweep', { 'aria-hidden': 'true' }),
        h('div.rc-ul-show', show),
        h('div.rc-body', h('b.rc-n', `UNLOCKED · ${u.name}`), h('span.rc-sub', u.line)),
        h('button.rc-xp-card', { type: 'button', onclick: () => m.openCard() }, 'WEAR IT'));
      el.append(item);
      turnOn(item, 'is-in');
      boardSfx('forge');
      if (!reduced()) vibrate([20, 40, 60]);
    }).catch(() => {});
  }

  function rankUp(from, to) {
    if (document.querySelector('.rc-up')) return;
    const shards = Array.from({ length: 16 }, (_, i) => h('i', { style: { '--a': `${(360 / 16) * i + (i % 3) * 7}deg`, '--d': `${70 + (i % 4) * 22}px` } }));
    const letters = RANKS[to].name.split('').map((ch, i) => h('span', { style: { '--i': i } }, ch));
    upEl = h('div.rc-up', { role: 'dialog', 'aria-label': `Rank up: ${RANKS[to].name}`, style: { '--rk': RANK_COLORS[to], '--rk0': RANK_COLORS[from] }, onclick: () => close(true) },
      h('div.rc-up-veil'),
      h('div.rc-up-stage',
        h('span.rc-up-rays'),
        h('span.rc-up-old', emblem(from, 150, { mini: false })),
        h('span.rc-up-shards', ...shards),
        h('span.rc-up-ring'),
        h('span.rc-up-new.rk-big', emblem(to, 176, { mini: false }))),
      h('div.rc-up-kicker', 'RANK UP'),
      h('div.rc-up-name', ...letters),
      h('div.rc-up-line', RANKS[to].line),
      h('div.rc-up-skip', 'TAP TO CONTINUE'));
    document.body.append(upEl);
    turnOn(upEl, 'is-on');
    boardSfx('forge');
    if (!reduced()) vibrate([20, 60, 20, 300, 60]);
    later(() => close(false), reduced() ? 2200 : 4300);
  }

  function close(skip) {
    const u = upEl;
    if (!u) return;
    upEl = null;
    if (skip && !u.classList.contains('is-done')) { u.classList.add('is-done'); setTimeout(() => fade(u), 450); return; }
    fade(u);
  }
  const fade = u => { u.classList.add('is-out'); setTimeout(() => u.remove(), 500); };

  const off = onOutcome((k, o) => { if (k === key) show(o); });
  show(outcomeFor(key));

  return {
    el,
    destroy() {
      destroyed = true;
      off();
      timers.forEach(clearTimeout);
      if (upEl) { upEl.remove(); upEl = null; }
    },
  };
}
