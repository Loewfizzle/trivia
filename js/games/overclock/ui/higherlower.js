// OVERCLOCK — HIGHER OR LOWER: pick the winner of each pair; a miss ends the streak.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass, vibrate } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { fmtStat, fastButton } from '../shared.js';

export default function uiHigherLower(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-hl');
  let k = Math.floor(chal.ok);
  let locked = false;
  let opts = [];
  const streak = h('div.hl-streak');
  const paintStreak = () => streak.replaceChildren(h('small', 'STREAK'), h('b', String(k)), h('span', `/${s.pairs.length}`));
  const show = () => {
    if (chal.done || k >= s.pairs.length) return;
    const P = s.pairs[k];
    opts = [P.a, P.b].map((x, side) => fastButton('button.hl-opt', { 'aria-label': x.name }, () => choose(side), h('span.hl-name', x.name), h('span.hl-val')));
    wrap.replaceChildren(
      h('div.hl-head', h('span.hl-stat', P.stat), streak),
      h('p.hl-ask', P.ask),
      h('div.hl-opts', opts[0], h('div.hl-vs', 'VS'), opts[1]));
    paintStreak();
    pulseClass(wrap, 'q-in');
  };
  const choose = side => {
    if (locked || chal.done) return;
    locked = true;
    const P = s.pairs[k];
    const right = side === P.ans;
    [P.a, P.b].forEach((x, j) => { opts[j].querySelector('.hl-val').textContent = fmtStat(P.unit, x.v, x.shown); opts[j].classList.add('is-shown'); });
    opts[P.ans].classList.add('is-correct');
    opts[1 - P.ans].classList.add(right ? 'is-dim' : 'is-wrong');
    sfx(right ? 'ocCorrect' : 'ocWrong');
    vibrate(right ? 12 : [20, 30, 20]);
    if (!right) { api.step(k, k + 1, 'miss', true, 1700); return; }
    k += 1;
    paintStreak();
    pulseClass(streak, 'tick');
    api.step(k, k, 'ok', k >= s.pairs.length, 1200);
    if (k < s.pairs.length) setTimeout(() => { locked = false; show(); }, 1250);
  };
  api.key = e => { if (e.key === '1' || e.key === 'ArrowUp') choose(0); else if (e.key === '2' || e.key === 'ArrowDown') choose(1); };
  show();
  return { el: wrap, destroy() { api.key = null; } };
}
