// THE STREAK CARD — "THE BIG FLAME" (the owner's redesign, Nov 2 — PROGRESSION B's add-on; it replaces PROGRESSION A's crowned card): tap a
// flame (the dock's badge, the card's flame, the moment's streak line) → no crown, a small YOUR STREAK caption + the big ✕; THE FLAME the
// hero (flame-art.js — three nested neon tubes, the licks flickering, the core breathing; reduced motion = lit, still); THE NUMBER huge in
// ivory-white with a warm glow + NIGHTS IN A ROW; THIS WEEK as seven small flames (lit / frozen / a dark outline) over M T W T F S S, today
// in white; SOMETHING NEW (the vague tease — when, never what) with its bar; FREEZE HELD + BEST EVER; WIN IT BACK when it applies; one quiet
// line. Ivory text everywhere (THE IVORY decision) — no gold text, no serif. Reads only (the server keeps the streak).
import { h } from '../ui/dom.js';
import { streakView, streakDay } from '../core/streak.js';
import { pgSheet } from './look.js';
import { flameArt } from './flame-art.js';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
let open = null;
/** the tease's bar: how far from the last milestone to the next */
const MARKS = [0, 3, 7, 14, 30, 50, 100, 200, 365];
const fracTo = (n, next) => { const prev = [...MARKS].reverse().find(m => m < next) || 0; return Math.max(0.04, Math.min(1, (n - prev) / Math.max(1, next - prev))); };

/** st = pstats.st (from /api/profile me, or the outcome); → { el, close } */
export async function openStreakCard(st, { now = Date.now(), outage = null } = {}) {
  if (open) return open;
  await pgSheet();
  const v = streakView(st, streakDay(now), outage);
  const close = () => { if (!open) return; const o = open; open = null; o.el.classList.add('is-out'); setTimeout(() => o.el.remove(), 260); };
  const state = v.n ? (v.state === 'frozen' ? 'frozen' : v.state === 'lit' ? 'lit' : 'waiting') : 'out';
  const day = d => d.s === 'played' || d.s === 'won' ? 'lit' : d.s === 'frozen' ? 'frozen' : d.s === 'outage' ? 'waiting' : 'out';
  const week = h('div.pg-sk-week', ...v.week.map(d => h('div.pg-sk-day', { class: `is-${d.s}`, title: d.day }, flameArt(day(d), 26), h('b', DOW[d.wd]))));
  const tease = v.nextMilestone ? h('div.pg-sk-tile.pg-sk-next',
    h('div.pg-sk-row', h('b', 'SOMETHING NEW'), h('em', `${v.n} / ${v.nextMilestone} NIGHTS`)),
    h('div.pg-sk-bar', h('i', { style: { transform: `scaleX(${fracTo(v.n, v.nextMilestone)})` } }))) : null;
  const win = v.winBack ? h('div.pg-sk-tile.pg-sk-win', h('b', 'WIN IT BACK'), h('span', `${v.winBack.have} of ${v.winBack.need} plays · your ${v.winBack.lost}-night run comes back`)) : null;
  const el = h('div.pg-sc.pg-sk', { role: 'dialog', 'aria-label': 'Your streak', onclick: e => { if (e.target === el || e.target.classList.contains('pg-veil')) close(); } },
    h('div.pg-veil'),
    h('div.pg-panel',
      h('button.pg-x', { type: 'button', 'aria-label': 'Close', onclick: close }, '✕'),
      h('div.pg-sk-cap', 'YOUR STREAK'),
      h('div.pg-sk-flame', flameArt(state, 160)),
      h('div.pg-sk-n', String(v.n)),
      h('div.pg-sk-sub', v.n === 1 ? 'NIGHT IN A ROW' : 'NIGHTS IN A ROW'),
      h('div.pg-sk-tile.pg-sk-wk', h('div.pg-sk-k', 'THIS WEEK'), week),
      win, tease,
      h('div.pg-sk-two',
        h('div.pg-sk-tile', h('b.pg-sk-ice', `❄ ${v.freezes}`), h('span', v.freezes === 1 ? 'FREEZE HELD' : 'FREEZES HELD')),
        h('div.pg-sk-tile', h('b', String(v.best)), h('span', 'BEST EVER'))),
      h('p.pg-sk-foot', 'Play any match before 4 am to keep it lit')));
  document.body.append(el);
  open = { el, close, view: v };
  return open;
}
export const closeStreakCard = () => { if (open) open.close(); };
