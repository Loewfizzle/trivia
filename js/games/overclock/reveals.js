// OVERCLOCK — the reveal panels shown above the leaderboard after a challenge.
import { h } from '../../ui/dom.js';
import { sfx } from '../../audio/sfx.js';
import { colorHex } from '../../config.js';
import { normWord, COMPASS_DIRS, COMPASS_TURN } from './challenges.js';
import { fmtVal, fmtStat } from './shared.js';

const solvedBoth = (game, uids) => { const res = (game.results && game.results[game.ci]) || {}; return uids.filter(u => res[u] && res[u].ok >= 2).length; };
function revealLink(spec, game, boards, uids) {
  const both = solvedBoth(game, uids);
  return h('section.rv.rv-ml',
    h('div.rv-kicker', 'THE MISSING LINKS', h('span.rv-ask', 'Each word joins the answer, before or after.')),
    spec.puzzles.map((p, k) => h('div.rv-ml-row', { style: { animationDelay: `${250 + k * 350}ms` } },
      h('span.rv-ml-words', p.words.join(' · ')), h('i', '→'), h('b', normWord(p.answer)))),
    h('div.rv-us-count', h('b', `${both}/${uids.length}`), ' LINKED BOTH'));
}
function revealSpell(spec) {
  return h('section.rv.rv-sp',
    h('div.rv-kicker', 'THE RIGHT SPELLINGS', h('span.rv-ask', 'Next to the usual mistake, crossed out.')),
    h('ol.rv-sp-list', spec.items.map((it, k) => h('li', { style: { animationDelay: `${200 + k * 150}ms` } },
      h('b', it.word), h('s', it.common)))));
}
function revealM24(spec, game, boards, uids) {
  const both = solvedBoth(game, uids);
  return h('section.rv.rv-m24',
    h('div.rv-kicker', 'ONE WAY TO MAKE 24', h('span.rv-ask', 'There’s often more than one.')),
    spec.puzzles.map((p, k) => h('div.rv-m24-row', { style: { animationDelay: `${250 + k * 350}ms` } },
      h('span.rv-m24-tiles', [...p.nums].sort((a, b) => a - b).map(n => h('i', String(n)))),
      h('b.rv-m24-sol', `${p.sol} = 24`),
      h('small', k ? 'HARD' : 'EASY'))),
    h('div.rv-us-count', h('b', `${both}/${uids.length}`), ' SOLVED BOTH'));
}
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
function revealHL(spec, game, boards, uids, ctx) {
  const res = (game.results && game.results[game.ci]) || {};
  const runs = uids.map(u => ({ u, s: Math.floor((res[u] && res[u].ok) || 0), p: (boards[u] && boards[u].p) || 0 }));
  const best = Math.max(0, ...runs.map(x => x.s));
  const leaders = runs.filter(x => best > 0 && x.s === best).map(x => ctx.player(x.u).name);
  // the pair that ended the most runs (a run that ended on a miss has p = streak + 1)
  const ends = {};
  for (const x of runs) if (x.p > x.s) ends[x.s] = (ends[x.s] || 0) + 1;
  const worst = Object.entries(ends).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const pair = P => h('div.rv-hl-pair',
    h('div.rv-hl-ask', P.ask),
    [P.a, P.b].map((x, i) => h('div.rv-hl-item', { class: i === P.ans ? 'is-win' : null }, h('span', x.name), h('b', fmtStat(P.unit, x.v, x.shown)))));
  return h('section.rv.rv-hl',
    h('div.rv-kicker', best ? `LONGEST STREAK · ${best}` : 'NO STREAKS THIS TIME', leaders.length ? h('span.rv-ask', leaders.join(' & ')) : null),
    worst ? [h('div.rv-hl-sub', `THE ONE THAT TRIPPED UP ${worst[1]} ${worst[1] === 1 ? 'PLAYER' : 'PLAYERS'}`), pair(spec.pairs[Number(worst[0])])]
      : best >= spec.pairs.length ? h('div.rv-hl-sub', 'A PERFECT 10 — NOBODY SLIPPED') : null);
}

const REVEAL = { missinglink: revealLink, spellcheck: revealSpell, make24: revealM24, compass: revealCompass, sortit: revealSort, higherlower: revealHL };
/** Challenge types that show a reveal panel above the leaderboard. */
export const hasReveal = type => !!REVEAL[type] || ['lexicon', 'timeline', 'closest', 'unscramble'].includes(type);

/**
 * The reveal above the leaderboard: the answers, best words, the right order, the number line…
 * ctx: { boards (this challenge's player nodes), uids (participants), player(uid), timers (array; the view clears them),
 *        sortLog (this phone's Sort It choices, or null) }
 */
export function buildReveal(game, spec, ctx) {
  const type = game.order[game.ci];
  const { boards, uids, player } = ctx;
  if (REVEAL[type]) return REVEAL[type](spec, game, boards, uids, ctx);
  if (type === 'unscramble') {
    const res = (game.results && game.results[game.ci]) || {};
    const solved = uids.filter(u => res[u] && res[u].ok >= 1).length;
    return h('section.rv.rv-us',
      h('div.rv-kicker', 'THE WORD WAS',
        h('div.rv-best', h('b', spec.word.toUpperCase()), h('small', `FROM ${spec.letters.join('').toUpperCase()}`))),
      h('div.rv-us-count', h('b', `${solved}/${uids.length}`), solved === 1 ? ' PLAYER CRACKED IT' : ' PLAYERS CRACKED IT'));
  }
  if (type === 'lexicon') {
    const rows = uids.map(uid => ({ uid, w: (boards[uid] && boards[uid].w) || '' })).sort((a, b) => b.w.length - a.w.length);
    return h('section.rv.rv-lex',
      h('div.rv-kicker', 'LONGEST POSSIBLE', h('div.rv-best', spec.best.map(w => h('b', w.toUpperCase())), h('small', `${spec.max} LETTERS`))),
      h('div.rv-words', rows.map((r, k) => {
        const p = player(r.uid);
        return h('div.rv-word', { class: r.w.length === spec.max ? 'is-max' : null, style: { '--c': colorHex(p.color), animationDelay: `${300 + k * 90}ms` } },
          h('span.rv-name', p.name), h('span.rv-w', r.w ? r.w.toUpperCase() : '—'), h('small', r.w ? String(r.w.length) : ''));
      })));
  }
  if (type === 'timeline') {
    return h('section.rv.rv-tl',
      h('div.rv-kicker', `${spec.title} · ${spec.dir}`, h('span.rv-ask', spec.ask)),
      h('ol.rv-order', spec.items.map((it, k) => h('li', { style: { animationDelay: `${250 + k * 220}ms` } },
        h('span.rv-pos', String(k + 1)), h('span.rv-label', it.label), h('b.rv-val', it.value)))));
  }
  return numberLine(spec, boards, uids, player);
}

function numberLine(spec, boards, uids, player) {
  const entries = uids.filter(u => boards[u] && typeof boards[u].g === 'number').map(u => ({ uid: u, g: boards[u].g, err: Math.abs(boards[u].g - spec.answer) / spec.answer }));
  const vals = [...entries.map(e => e.g), spec.answer];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const log = lo > 0 && hi / lo > 30;
  const f = v => (log ? Math.log10(Math.max(v, lo)) : v);
  let a = f(lo), b = f(hi);
  if (b - a < 1e-9) { a -= 1; b += 1; }
  const pad = (b - a) * 0.08;
  a -= pad; b += pad;
  const pos = v => Math.max(0, Math.min(1, (f(v) - a) / (b - a)));
  const best = entries.length ? Math.min(...entries.map(e => e.err)) : null;
  // labels alternate above / below the line, nudged apart when crowded
  const sorted = [...entries].sort((x, y) => x.g - y.g);
  const lanes = [-Infinity, -Infinity, -Infinity, -Infinity];
  const markers = sorted.map((e, k) => {
    const x = pos(e.g);
    let lane = k % 2;
    if (x - lanes[lane] < 0.18) lane += 2;
    if (lane > 3) lane = k % 4;
    lanes[lane] = x;
    const p = player(e.uid);
    return h('div.nl-mark', {
      class: [`lane-${lane}`, e.err === best ? 'is-closest' : ''].join(' '),
      style: { '--x': x, '--c': colorHex(p.color), animationDelay: `${200 + k * 120}ms` },
    }, h('i'), h('span.nl-tag', h('b', p.name), h('small', fmtVal(e.g))));
  });
  const answer = h('div.nl-answer', { style: { '--x': pos(spec.answer) } }, h('i'), h('span', h('small', 'ANSWER'), h('b', `${fmtVal(spec.answer)} ${spec.unit}`)));
  const winner = entries.filter(e => e.err === best).map(e => player(e.uid).name);
  sfx('shimmer');
  return h('section.rv.rv-cc',
    h('div.rv-kicker', spec.q),
    h('div.nl', h('div.nl-track'), h('div.nl-lo', fmtVal(Math.round(log ? 10 ** (a + pad) : lo))), h('div.nl-hi', fmtVal(Math.round(log ? 10 ** (b - pad) : hi))), markers, answer),
    winner.length ? h('div.nl-win', { style: { animationDelay: '2.3s' } }, 'CLOSEST: ', h('b', winner.join(' & ')), ' · +60') : h('div.nl-win', 'NO GUESSES'));
}
