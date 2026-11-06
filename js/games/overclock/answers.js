// OVERCLOCK — THE ANSWER after EVERY challenge (OC1: TRIVIA LIGHTNING + TRUE OR FALSE; OC2: the other sixteen — js/games/kit/answer.js's frame).
// The first beat of the after-challenge screen: the question bold white, the RIGHT ANSWER on the white-hot tile, YOUR PICK struck through
// when you missed it; right / close on --good / --close + a shape (✓ / ≈ / ✕ — never color alone). Drawn only once the challenge has
// CLOSED (the view builds it in 'standings' / 'final' — THE SEAL holds until then).
//  - The eight that had NO reveal get a simple one here (the challenge-specific DRESSING comes with each one's rebuild in OC3 / OC4):
//    QUICK MATH (the sum = the answer), PATTERN LOCK (the sequence + the next number), MEMORY (the sequence replayed as numbered nodes),
//    ODD ONE OUT (the odd one + why, one line), QUICK COUNT (the real count — off by one = --close + the half shape), COLOR CLASH (the word +
//    its color named), SIGNAL LOCK (your time vs the room's best), REWIRE (solved or not + the time).
//  - The eight that HAD a reveal (MISSING LINK, SPELLCHECK, COMPASS, SORT IT, HIGHER OR LOWER, TIMELINE, CLOSEST CALL, UNSCRAMBLE) move
//    INTO THE ANSWER frame as they are (reveals.js — their content in its slot; not redesigned here).
// YOUR PICKS are yours alone: kept on this device (sessionStorage — a refresh still shows them; never in the database). No "flag this
// question" button anywhere.
import { h } from '../../ui/dom.js';
import { answerFrame, answerPanel } from '../kit/answer.js';
import { STROOP_COLORS } from './challenges.js';
import { buildReveal } from './reveals.js';
import { fmtVal } from './shared.js';

const key = (m, ci) => `oc:pk:${m}:${ci}`;
export function savePicks(m, ci, picks) { try { sessionStorage.setItem(key(m, ci), JSON.stringify(picks)); } catch { /* private mode: this screen only */ } }
export function loadPicks(m, ci) { try { const v = JSON.parse(sessionStorage.getItem(key(m, ci)) || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } }

const LETTER = 'ABCD';
const tfWord = v => (v ? 'TRUE' : 'FALSE');
const box = (...kids) => h('div.gk-answers.oc-answers', ...kids);
/** the row of every part's mark (✓ · ≈ · ✕ · –) + n / N: a challenge with many parts shows your misses as frames and the rest here */
function sumRow(res, label) {
  const right = res.filter(r => r === 'right').length;
  return h('div.oc-tf-sum',
    h('span.oc-tf-sum-k', label),
    h('span.oc-tf-pips', res.map(r => h('i', { class: r === 'right' ? 'is-right' : r === 'wrong' ? 'is-wrong' : r === 'close' ? 'is-close' : null, 'aria-label': r === 'right' ? 'right' : r === 'wrong' ? 'wrong' : r === 'close' ? 'close' : 'no answer' }, r === 'right' ? '✓' : r === 'wrong' ? '✕' : r === 'close' ? '≈' : '–'))),
    h('b.oc-tf-sum-n', `${right}/${res.length}`));
}
/** many parts: your misses first (up to two), else the last one — eight frames would not fit */
function missesFirst(res) {
  const misses = res.map((r, i) => (r === 'wrong' || r === 'close' ? i : -1)).filter(i => i >= 0).slice(0, 2);
  return { show: misses.length ? misses : [res.length - 1], label: misses.length ? (misses.length > 1 ? 'YOUR MISSES' : 'YOUR MISS') : res.every(r => r === 'right') ? 'CLEAN SWEEP' : 'THE LAST ONE' };
}
const st = (p, ans) => (p == null ? 'none' : p === ans ? 'right' : 'wrong');

// ---------------------------------------------------------------------------------------------- OC1
function trivia(spec, picks) {
  return box(spec.questions.map((q, i) => {
    const p = picks[i];
    const state = st(p, q.c);
    return answerFrame({
      q: q.q,
      answer: h('span.oc-ans-opt', h('i.oc-badge', LETTER[q.c]), q.a[q.c]),
      pick: p == null || p === q.c ? null : h('span.oc-ans-opt', h('i.oc-badge', LETTER[p]), q.a[p]),
      state, note: p == null ? 'NO ANSWER' : '',
      delay: 120 + i * 260,
    });
  }));
}
function truefalse(spec, picks) {
  const res = spec.items.map((it, i) => st(picks[i], it.truth));
  const { show, label } = missesFirst(res);
  return box(sumRow(res, label), show.map((i, k) => {
    const it = spec.items[i], p = picks[i];
    return answerFrame({
      q: it.text,
      answer: h('span.oc-ans-tf', h('i', it.truth ? '✓' : '✕'), tfWord(it.truth)),
      pick: p == null || p === it.truth ? null : h('span.oc-ans-tf', h('i', p ? '✓' : '✕'), tfWord(p)),
      state: res[i], note: p == null ? 'NO ANSWER' : '',
      delay: 200 + k * 300,
    });
  }));
}

// ---------------------------------------------------------------------------------------------- OC2 — the eight with no reveal before
// QUICK MATH: the sum, = the answer
function math(spec, picks) {
  const res = spec.problems.map((pr, i) => st(picks[i], pr.ans));
  const { show, label } = missesFirst(res);
  return box(sumRow(res, label), show.map((i, k) => {
    const pr = spec.problems[i], p = picks[i];
    return answerFrame({ q: `${pr.text} = ?`, answer: h('span.oc-ans-num', fmtVal(pr.ans)), pick: p == null || p === pr.ans ? null : h('span.oc-ans-num', fmtVal(p)), state: res[i], note: p == null ? 'NO ANSWER' : '', delay: 200 + k * 300 });
  }));
}
// PATTERN LOCK: the sequence + the next number
function pattern(spec, picks) {
  return box(spec.seqs.map((sq, i) => {
    const p = picks[i];
    return answerFrame({
      q: h('span.oc-ans-seq', sq.shown.map(v => h('span', fmtVal(v))), h('span.is-q', '?')),
      answer: h('span.oc-ans-num', fmtVal(sq.ans)), pick: p == null || p === sq.ans ? null : h('span.oc-ans-num', fmtVal(p)),
      state: st(p, sq.ans), note: p == null ? 'NO ANSWER' : '', delay: 120 + i * 300,
    });
  }));
}
// MEMORY: the sequence replayed as numbered nodes (a mini 3 × 3 each, the step's node lit + its number); your slip marked
const miniGrid = (n, cls = '') => h(`span.oc-mg${cls}`, { 'aria-hidden': 'true' }, Array.from({ length: 9 }, (_, i) => h('i', { class: i === n ? 'is-on' : null })));
function memory(spec, picks) {
  const slip = picks[0] && typeof picks[0] === 'object' ? picks[0] : null;
  const seq = h('span.oc-ans-mem', spec.seq.map((n, k) => h('span.oc-mg-step', { class: slip && slip.at === k ? 'is-slip' : null, style: { '--k': k } }, h('b', String(k + 1)), miniGrid(n))));
  return box(answerFrame({
    q: `THE SEQUENCE · ${spec.seq.length} STEPS`,
    answer: seq,
    pick: slip ? h('span.oc-ans-mem-pick', `STEP ${slip.at + 1}`, miniGrid(slip.n, '.is-bad')) : null,
    state: slip ? 'wrong' : 'right',
    delay: 120,
  }));
}
// ODD ONE OUT: the odd one + why (one short line)
const ODD_WHY = {
  'O|Q': ['no tail', 'the tail'], 'E|F': ['the bottom bar', 'no bottom bar'], 'P|R': ['no leg', 'the leg'], 'C|G': ['no crossbar', 'the crossbar'],
  'V|Y': ['no stem', 'the stem'], 'M|N': ['two peaks', 'one diagonal'], 'T|Y': ['a flat top', 'a split top'], 'b|d': ['its bowl on the right', 'its bowl on the left'],
  'p|q': ['its bowl on the right', 'its bowl on the left'], '6|9': ['its loop at the bottom', 'its loop at the top'], 'u|v': ['a round bottom', 'a pointed bottom'],
  'm|n': ['two humps', 'one hump'], 'h|n': ['the tall stem', 'a short stem'], 'K|X': ['a straight back', 'two crossed lines'], '3|8': ['open on the left', 'two closed loops'],
  'O|0': ['round', 'narrow — a zero'], 'l|1': ['no flag', 'the flag'], 'I|l': ['bars top + bottom', 'no bars'], '5|S': ['a flat top', 'curves only'],
  '8|B': ['round on both sides', 'the flat back'], 'Z|2': ['a flat top', 'a curved top'], 'e|c': ['the bar', 'no bar'], 'G|6': ['open at the top', 'a closed loop'],
};
export function oddWhy(odd, base) {
  const a = ODD_WHY[`${odd}|${base}`], b = ODD_WHY[`${base}|${odd}`];
  const why = a ? a[0] : b ? b[1] : '';
  return why ? `${odd} has ${why}`.replace(/has (round|narrow|open)/, 'is $1') : `${odd} among the ${base}s`;
}
function oddone(spec, picks) {
  return box(spec.grids.map((g, i) => {
    const p = picks[i], n = g.size;
    const rc = k => `ROW ${Math.floor(k / n) + 1} · COL ${(k % n) + 1}`;
    const state = p == null ? 'none' : p === g.idx ? 'right' : 'wrong';
    return answerFrame({
      q: `GRID ${i + 1} · ${n}×${n} OF “${g.base}”`,
      answer: h('span.oc-ans-odd', h('b.oc-ans-glyph', g.odd), h('span', h('small', rc(g.idx)), oddWhy(g.odd, g.base))),
      pick: state === 'wrong' ? h('span.oc-ans-odd', h('b.oc-ans-glyph', g.base), h('span', h('small', rc(p)), 'one of the ordinary ones')) : null,
      state, note: p == null ? 'NO ANSWER' : '', delay: 120 + i * 240,
    });
  }));
}
// QUICK COUNT: the real count — off by one = CLOSE (half credit): --close + the ≈ shape
const SHAPE_NAME = { tri: 'triangle', dot: 'circle', sq: 'square', dia: 'diamond' };
const shapeEl = id => h('i.oc-ans-shape', { dataset: { s: id }, role: 'img', 'aria-label': SHAPE_NAME[id] });
function count(spec, picks) {
  const res = spec.items.map((it, i) => { const p = picks[i]; return p == null ? 'none' : p === it.ans ? 'right' : Math.abs(p - it.ans) === 1 ? 'close' : 'wrong'; });
  const { show, label } = missesFirst(res);
  return box(sumRow(res, label), show.map((i, k) => {
    const it = spec.items[i], p = picks[i];
    return answerFrame({
      q: h('span.oc-ans-count', `${i + 1} · HOW MANY `, shapeEl(it.target), ' ?'),
      answer: h('span.oc-ans-num', String(it.ans)), pick: p == null || p === it.ans ? null : h('span.oc-ans-num', String(p), res[i] === 'close' ? h('small', ' OFF BY ONE · HALF') : null),
      state: res[i], note: p == null ? 'NO ANSWER' : '', delay: 200 + k * 300,
    });
  }));
}
// COLOR CLASH: the word (as it was shown) + its color named
const swatch = id => h('span.oc-ans-color', h('i', { style: { '--sw': STROOP_COLORS[id].hex } }), STROOP_COLORS[id].name);
function stroop(spec, picks) {
  const res = spec.items.map((it, i) => st(picks[i], it.ink));
  const { show, label } = missesFirst(res);
  return box(sumRow(res, label), show.map((i, k) => {
    const it = spec.items[i], p = picks[i];
    return answerFrame({
      q: h('span.oc-ans-cc', 'THE WORD ', h('b', { style: { color: STROOP_COLORS[it.ink].hex } }, STROOP_COLORS[it.word].name), ' WAS IN'),
      answer: swatch(it.ink), pick: p == null || p === it.ink ? null : swatch(p),
      state: res[i], note: p == null ? 'NO ANSWER' : '', delay: 200 + k * 300,
    });
  }));
}
// SIGNAL LOCK: your time vs the room's best. Your own taps are on this device (exact); the room's are their reaction credit
// (challenges.js#reflexCredit — 230 ms = full, −1 per 6 ms) turned back into ms: an EFFECTIVE time, shown with ≈ (a miss counts slow)
const credMs = (ok, parts) => Math.round(230 + 600 * (1 - Math.max(0, Math.min(1, (Number(ok) || 0) / Math.max(1, parts)))));
function reflex(spec, picks, ctx) {
  const mine = picks.slice(0, spec.parts);
  const hits = mine.filter(v => typeof v === 'number');
  const res = (ctx.game.results && ctx.game.results[ctx.game.ci]) || {};
  const room = ctx.uids.map(u => ({ u, ms: res[u] ? credMs(res[u].ok, spec.parts) : null })).filter(x => x.ms != null).sort((a, b) => a.ms - b.ms);
  const best = room[0];
  const meRes = res[ctx.me];
  const myMs = hits.length ? Math.round(hits.reduce((a, b) => a + b, 0) / hits.length) : meRes ? credMs(meRes.ok, spec.parts) : null;
  const exact = hits.length > 0;
  const iWon = best && best.u === ctx.me;
  return box(answerFrame({
    q: room.length > 1 ? 'THE ROOM\'S FASTEST' : 'YOUR REACTION',
    answer: room.length > 1 && best ? h('span.oc-ans-rx', h('b', `≈ ${best.ms} ms`), h('small', ctx.player(best.u).name)) : h('span.oc-ans-rx', h('b', myMs == null ? '—' : `${exact ? '' : '≈ '}${myMs} ms`), h('small', 'AVERAGE')),
    pick: room.length > 1 && !iWon && myMs != null ? h('span.oc-ans-rx', h('b', `${exact ? '' : '≈ '}${myMs} ms`), h('small', 'YOUR AVERAGE')) : null,
    pickLabel: 'YOUR TIME',
    state: room.length < 2 ? (myMs == null ? 'none' : 'right') : iWon ? 'right' : myMs == null ? 'none' : 'close',
    note: myMs == null ? 'NO TAPS' : '',
    slot: mine.length ? h('div.oc-ans-rx-log', mine.map(v => h('span', { class: typeof v === 'number' ? 'is-hit' : 'is-miss' }, typeof v === 'number' ? `${v}` : '✕'))) : null,
    delay: 120,
  }));
}
// REWIRE: solved or not + the time (game.tm — the ms to the finish, OC2)
function rewire(spec, picks, ctx) {
  const r = ((ctx.game.results && ctx.game.results[ctx.game.ci]) || {})[ctx.me];
  const t = ctx.game.tm && ctx.game.tm[ctx.game.ci] && ctx.game.tm[ctx.game.ci][ctx.me];
  const solved = r ? Math.floor(r.ok) : 0;
  const all = solved >= spec.puzzles.length;
  const secs = typeof t === 'number' ? `${(t / 1000).toFixed(1)} s` : '';
  // the tile states the GOAL (both circuits live — + your time when you made it); where you got to is YOUR PICK
  const power = r ? Math.round(Math.min(1, Math.max(0, r.ok - solved) / 0.6) * 100) : 0;
  return box(answerFrame({
    q: `${spec.puzzles.length} CIRCUITS · POWER TO THE CORE`,
    answer: h('span.oc-ans-rw', h('b', 'BOTH CIRCUITS LIVE'), all && secs ? h('small', `IN ${secs}`) : null),
    pick: !r || all ? null : h('span.oc-ans-rw', h('b', `${solved}/${spec.puzzles.length} LIVE`), h('small', `${power}% POWER ON THE ONE LEFT`)),
    pickLabel: 'WHERE YOU GOT TO',
    state: !r ? 'none' : all ? 'right' : solved ? 'close' : 'wrong',
    note: r ? '' : 'NOT PLAYED',
    delay: 120,
  }));
}

export const ANSWERS = { trivia, truefalse, math, pattern, memory, oddone, count, stroop, reflex, rewire };
/** the eight older reveals — into THE ANSWER's panel as they are (their own kicker stays inside the slot) */
export const PANELS = new Set(['missinglink', 'spellcheck', 'compass', 'sortit', 'higherlower', 'timeline', 'closest', 'unscramble']);
export const hasAnswer = type => !!ANSWERS[type] || PANELS.has(type);
/**
 * THE ANSWER for a closed challenge. ctx: { game, me, uids, player(uid), boards (this challenge's boards + the unsealed answers), timers,
 * sortLog } — the reveals' old ctx + who's looking.
 */
export function buildAnswer(type, spec, picks, ctx = {}) {
  if (ANSWERS[type]) return ANSWERS[type](spec, picks || [], ctx);
  if (PANELS.has(type) && ctx.game) return box(answerPanel({ slot: buildReveal(ctx.game, spec, ctx), delay: 80 }));
  return null;
}
