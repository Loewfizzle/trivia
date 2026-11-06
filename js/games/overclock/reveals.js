// OVERCLOCK — the older reveal panels, inside THE ANSWER's frame (answers.js#answerPanel) until each challenge's rebuild: COMPASS, SORT IT,
// TIMELINE. (OC3 moved MISSING LINK, CLOSEST CALL + UNSCRAMBLE into answers.js — their own dressing; OC3B SPELLCHECK + HIGHER OR LOWER.)
import { h } from '../../ui/dom.js';
import { COMPASS_DIRS, COMPASS_TURN } from './challenges.js';

function revealCompass(spec, game, boards, uids, ctx) {
  const TURN_CHIP = { L: 'L', R: 'R', A: '180°' };
  const rows = spec.rounds.map((R, k) => {
    const needle = h('i.rv-cp-needle');
    const turns = h('div.rv-cp-turns', [...R.turns].map(t => h('span', TURN_CHIP[t])));
    const out = h('b.rv-cp-out', COMPASS_DIRS[R.ans]);
    let rot = R.start * 90;
    needle.style.transform = `rotate(${rot}deg)`;
    [...R.turns].forEach((t, j) => ctx.timers.push(setTimeout(() => {
      rot += COMPASS_TURN[t] === 3 ? -90 : COMPASS_TURN[t] * 90;
      needle.style.transform = `rotate(${rot}deg)`;
      turns.children[j].classList.add('on');
      if (j === R.turns.length - 1) out.classList.add('on');
    }, 700 + k * 90 + j * 420)));
    return h('div.rv-cp-row', { style: { animationDelay: `${120 + k * 90}ms` } },
      h('span.rv-cp-start', COMPASS_DIRS[R.start]), h('div.rv-cp-rose', needle), turns, out);
  });
  return h('section.rv.rv-cp', h('div.rv-kicker', 'THE TURNS, PLAYED OUT', h('span.rv-ask', 'Where you started, every turn, where you ended.')), h('div.rv-cp-list', rows));
}
function revealSort(spec, game, boards, uids, ctx) {
  const mine = ctx.sortLog;
  const col = side => h('div.rv-st-col',
    h('div.rv-st-label', side ? spec.right : spec.left),
    spec.cards.map((c, i) => ({ c, i })).filter(x => x.c.s === side).map(({ c, i }) => h('span.rv-st-chip', {
      class: mine && i in mine && mine[i] !== side ? 'is-miss' : null,
      style: { animationDelay: `${200 + i * 60}ms` },
    }, c.t)));
  return h('section.rv.rv-st',
    h('div.rv-kicker', 'WHERE THEY BELONG', h('span.rv-ask', 'All twelve cards, on the right side.')),
    h('div.rv-st-cols', col(0), col(1)),
    mine && mine.some((v, i) => v !== spec.cards[i].s) ? h('div.rv-st-note', 'RED = YOU SORTED IT THE OTHER WAY') : null);
}
const REVEAL = { compass: revealCompass, sortit: revealSort };
/** Challenge types that show a reveal panel above the leaderboard. */
export const hasReveal = type => !!REVEAL[type] || ['timeline'].includes(type);

/**
 * The reveal above the leaderboard: the answers, best words, the right order, the number line…
 * ctx: { boards (this challenge's player nodes), uids (participants), player(uid), timers (array; the view clears them),
 *        sortLog (this phone's Sort It choices, or null) }
 */
export function buildReveal(game, spec, ctx) {
  const type = game.order[game.ci];
  const { boards, uids, player } = ctx;
  if (REVEAL[type]) return REVEAL[type](spec, game, boards, uids, ctx);
  if (type === 'timeline') {
    return h('section.rv.rv-tl',
      h('div.rv-kicker', `${spec.title} · ${spec.dir}`, h('span.rv-ask', spec.ask)),
      h('ol.rv-order', spec.items.map((it, k) => h('li', { style: { animationDelay: `${250 + k * 220}ms` } },
        h('span.rv-pos', String(k + 1)), h('span.rv-label', it.label), h('b.rv-val', it.value)))));
  }
  return null;
}
