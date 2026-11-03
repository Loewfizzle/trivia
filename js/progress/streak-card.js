// THE STREAK CARD (PROGRESSION A — the owner's mockup progression-moments.png 3): tap the flame (the dock's badge, the card's flame, the
// moment's streak row) → the count, this week as 7 dots (ice blue = a freeze covered it), freezes held, best ever, WIN IT BACK when it
// applies, and the VAGUE tease ("SOMETHING AT 30 NIGHTS" — when, never what). Reads only (the server keeps the streak).
import { h } from '../ui/dom.js';
import { streakView, streakDay, weekdayOf } from '../core/streak.js';
import { pgSheet, flameIcon, fanCrown } from './look.js';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYNAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let open = null;

/** st = pstats.st (from /api/profile me, or the outcome); → { el, close } */
export async function openStreakCard(st, { now = Date.now(), outage = null } = {}) {
  if (open) return open;
  await pgSheet();
  const v = streakView(st, streakDay(now), outage);
  const frozen = v.week.filter(d => d.s === 'frozen');
  const why = frozen.length ? `${frozen.map(d => DAYNAME[weekdayOf(d.day)]).join(' + ')} ${frozen.length > 1 ? 'were' : 'was'} covered by a freeze` : v.state === 'waiting' ? 'Play tonight to keep it lit' : v.state === 'lit' ? 'Tonight’s counted' : v.state === 'frozen' ? 'A freeze will cover the night you missed — play tonight' : 'Play a match to light it';
  const close = () => { if (!open) return; const o = open; open = null; o.el.classList.add('is-out'); setTimeout(() => o.el.remove(), 260); };
  const el = h('div.pg-sc', { role: 'dialog', 'aria-label': 'Your streak', onclick: e => { if (e.target === el || e.target.classList.contains('pg-veil')) close(); } },
    h('div.pg-veil'),
    h('div.pg-panel',
      fanCrown(),
      h('button.pg-x', { type: 'button', 'aria-label': 'Close', onclick: close }, '✕'),
      h('div.pg-sc-k', 'THE STREAK'),
      h('div.pg-sc-flame', flameIcon(v.state === 'out' ? 'out' : v.state, 92)),
      h('div.pg-sc-n', String(v.n)),
      h('div.pg-sc-sub', v.n === 1 ? 'night in a row' : 'nights in a row'),
      h('div.pg-box', h('b', 'THIS WEEK'), h('span.pg-dots', ...v.week.map(d => h('i', { class: `is-${d.s}`, title: d.day }, DOW[d.wd]))), h('div.pg-sc-why', why)),
      v.winBack ? h('div.pg-box.pg-sc-wb', h('b', 'WIN IT BACK'), h('span', `${v.winBack.have} of ${v.winBack.need} plays · your ${v.winBack.lost}-night run comes back`)) : null,
      h('div.pg-sc-two',
        h('div.pg-box', h('b', String(v.freezes)), h('span', v.freezes === 1 ? 'freeze held' : 'freezes held')),
        h('div.pg-box', h('b', String(v.best)), h('span', 'best ever'))),
      v.nextMilestone ? h('div.pg-box.pg-tease', h('b', `SOMETHING AT ${v.nextMilestone} NIGHTS`)) : null,
      h('p.pg-sc-foot', 'A day ends at 4 am · any match counts (and the dailies, once they’re in)')));
  document.body.append(el);
  open = { el, close, view: v };
  return open;
}
export const closeStreakCard = () => { if (open) open.close(); };
