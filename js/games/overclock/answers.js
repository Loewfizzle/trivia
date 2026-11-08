// OVERCLOCK — THE ANSWER after EVERY challenge (OC1: TRIVIA LIGHTNING + TRUE OR FALSE; OC2: the other sixteen — js/games/kit/answer.js's frame).
// The first beat of the after-challenge screen: the question bold white, the RIGHT ANSWER on the white-hot tile, YOUR PICK struck through
// when you missed it; right / close on --good / --close + a shape (✓ / ≈ / ✕ — never color alone). Drawn only once the challenge has
// CLOSED (the view builds it in 'standings' / 'final' — THE SEAL holds until then).
//  - The eight that had NO reveal get a simple one here (the challenge-specific DRESSING comes with each one's rebuild in OC3 / OC4):
//    QUICK MATH (the sum = the answer), PATTERN LOCK (the sequence + the next number), MEMORY (the sequence replayed as numbered nodes),
//    ODD ONE OUT (the odd one + why, one line), QUICK COUNT (the real count — off by one = --close + the half shape), COLOR CLASH (the word +
//    its color named), SIGNAL LOCK (your time vs the room's best), REWIRE (solved or not + the time).
//  - The ones that HAD a reveal sat INTO THE ANSWER frame as they were (reveals.js — their content in its slot) until each one's rebuild:
//    COMPASS still does (OC4).
//  - OC3B — THE CARD + LIST CHALLENGES' own dressing: SPELLCHECK (the tricky letters underlined, your wrong ones marked), HIGHER OR LOWER (your
//    streak as the hero, your run, the pair that ended it with both numbers), TIMELINE (the rows slide into the right order beside the value
//    rail, ✓ / ✕ each), SORT IT (two columns under the sides, every card where it belongs, a miss slides in from the side you put it on).
//  - OC3 — THE TYPING CHALLENGES' own dressing: QUICK MATH (the sum = the answer), PATTERN LOCK (the number dropped into the sequence + its
//    rule), CLOSEST CALL (how far off on a slanted scale + the room's closest), MISSING LINK (each clue joined to the link), UNSCRAMBLE (the
//    scrambled tiles fly into the word).
// YOUR PICKS are yours alone: kept on this device (sessionStorage — a refresh still shows them; never in the database). No "flag this
// question" button anywhere.
import { h, reducedMotion } from '../../ui/dom.js';
import { answerFrame, answerPanel, tubeMark } from '../kit/answer.js';
import { trickyLetters, wrongLetters, spellRuns } from './spell.js';
import { hlRightDir, statEl, DIR_WORD } from './ui/higherlower.js';
import { STROOP_COLORS, clashAnswer, COMPASS_DIRS, COMPASS_TURN, closestCredit, linkAccepts, normWord } from './challenges.js';
import { colorHex } from '../../config.js';
import { buildReveal } from './reveals.js';
import { fmtVal, joinedWord, joinedText } from './shared.js';
import { tubeLayers, rwSource } from './ui/rewire.js';
import { memNode } from './ui/memory.js';
import { oddFace } from './ui/oddone.js';
import { oddWhy } from './odd.js';
import { shapeEl } from './ui/count.js';
import { compassDial } from './ui/compass.js';
import { dlOf, raceScript } from './luck.js';

const key = (m, ci) => `oc:pk:${m}:${ci}`;
export function savePicks(m, ci, picks) { try { sessionStorage.setItem(key(m, ci), JSON.stringify(picks)); } catch { /* private mode: this screen only */ } }
export function loadPicks(m, ci) { try { const v = JSON.parse(sessionStorage.getItem(key(m, ci)) || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } }

const LETTER = 'ABCD';
const tfWord = v => (v ? 'TRUE' : 'FALSE');
const box = (...kids) => h('div.gk-answers.oc-answers', ...kids);
/** the row of every part's mark (✓ · ≈ · ✕ · –) + n / N: a challenge with many parts shows your misses as frames and the rest here */
function sumRow(res, label) {
  if (LOST) return null;   // (A8: the picks are gone — a row of dashes would read 0/N)
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
// (OC8 — A8, THE FABLE REVIEW: YOUR PICK lives in this tab's sessionStorage only — a killed browser, a second device or a new tab mid-match said
// NO ANSWER on every part while the score said 3/3) the view passes ctx.lost when this phone's picks are gone but the room's board says it
// answered: every "NO ANSWER" reads ANSWERED, and the per-part row (unknown here) is left out
let LOST = false;
const NONE = () => (LOST ? 'ANSWERED' : 'NO ANSWER');

// ---------------------------------------------------------------------------------------------- OC1
function trivia(spec, picks) {
  return box(spec.questions.map((q, i) => {
    const p = picks[i];
    const state = st(p, q.c);
    return answerFrame({
      q: q.q,
      answer: h('span.oc-ans-opt', h('i.oc-badge', LETTER[q.c]), q.a[q.c]),
      pick: p == null || p === q.c ? null : h('span.oc-ans-opt', h('i.oc-badge', LETTER[p]), q.a[p]),
      state, note: p == null ? NONE() : '',
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
      state: res[i], note: p == null ? NONE() : '',
      delay: 200 + k * 300,
    });
  }));
}

// ---------------------------------------------------------------------------------------------- OC2 — the eight with no reveal before
// QUICK MATH (OC3 — its dressing): the sum = THE ANSWER on the white-hot tile ("104 ÷ 8 + 46 = 59"), YOUR PICK struck through when wrong
const MINUS = '−';
const signed = v => (typeof v === 'number' && v < 0 ? `${MINUS}${fmtVal(-v)}` : fmtVal(v));
function math(spec, picks) {
  const res = spec.problems.map((pr, i) => st(picks[i], pr.ans));
  const { show, label } = missesFirst(res);
  return box(sumRow(res, label), show.map((i, k) => {
    const pr = spec.problems[i], p = picks[i];
    return answerFrame({
      answer: h('span.oc-ans-sum', h('span.oc-ans-sum-q', String(pr.text).replace(/-/g, MINUS)), h('i', '='), h('b', signed(pr.ans))),
      pick: p == null || p === pr.ans ? null : h('span.oc-ans-num', signed(p)), state: res[i], note: p == null ? NONE() : '', delay: 200 + k * 300,
    });
  }));
}
// PATTERN LOCK (OC3 — its dressing): the whole sequence with the right number DROPPED into the slot, + the RULE in one short line
function pattern(spec, picks) {
  return box(spec.seqs.map((sq, i) => {
    const p = picks[i], d = 120 + i * 320;
    return answerFrame({
      q: h('span.oc-ans-seq', sq.shown.map(v => h('span.oc-ans-seq-c', signed(v))), h('span.oc-ans-seq-c.is-drop', { style: { '--dd': `${d + 520}ms` } }, signed(sq.ans))),
      answer: h('span.oc-ans-pat', h('b', signed(sq.ans)), sq.say ? h('small', sq.say) : null),
      pick: p == null || p === sq.ans ? null : h('span.oc-ans-num', signed(p)),
      state: st(p, sq.ans), note: p == null ? NONE() : '', delay: d,
    });
  }));
}
// CLOSEST CALL (OC3 — its own answer, no longer the old panel): THE ANSWER + YOUR GUESS, a short slanted SCALE between them that shows how
// far off you were ("+120 km · 12% OFF"; DEAD ON = full credit, within 5 % — the server's own rule for the achievement), and the room's
// closest guess named (ties together — the same "closest" the director's bonus reads)
function closest(spec, picks, ctx) {
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const boards = ctx.boards || {};
  const guess = u => (boards[u] && typeof boards[u].g === 'number' ? boards[u].g : null);
  const g = guess(ctx.me);
  const credit = g == null ? 0 : closestCredit(g, spec.answer);
  const state = g == null ? 'none' : credit >= 1 ? 'right' : credit > 0 ? 'close' : 'wrong';
  const err = g == null ? 0 : Math.abs(g - spec.answer) / Math.max(1e-9, Math.abs(spec.answer));
  const delta = g == null ? 0 : Math.round((g - spec.answer) * 100) / 100;
  const room = (ctx.uids || []).map(u => ({ u, g: guess(u) })).filter(x => x.g != null).map(x => ({ ...x, e: Math.abs(x.g - spec.answer) }));
  const best = room.length ? Math.min(...room.map(x => x.e)) : null;
  const tops = room.filter(x => x.e === best);
  const nm = u => (u === ctx.me ? 'YOU' : ctx.player(u).name);
  let scale = null;
  if (g != null) {
    const side = Math.sign(delta) || 1;
    const reach = state === 'right' ? 0 : 0.17 + 0.27 * Math.min(1, err / 0.6);   // the guess's distance from the centre (0.17 … 0.44 of the bar — the two labels never meet)
    const y = 0.5 + side * reach;
    scale = h('div.oc-cl-scale', { class: `is-${state}${side < 0 ? ' is-under' : ''}`, style: { '--y': y, '--lo': Math.min(0.5, y), '--hi': Math.max(0.5, y) } },
      h('i.oc-cl-track'), h('i.oc-cl-span'),
      h('span.oc-cl-mk.is-answer', h('i'), h('small', 'ANSWER')),
      state === 'right' ? null : h('span.oc-cl-mk.is-you', h('i'), h('small', 'YOU')),
      h('b.oc-cl-gap', state === 'right' ? 'DEAD ON' : `${delta > 0 ? '+' : MINUS}${fmtVal(Math.abs(delta))}${unit}`, state === 'right' ? null : h('small', ` · ${Math.round(err * 100)}% OFF`)));
  }
  const roomLine = room.length > 1 || (room.length === 1 && room[0].u !== ctx.me)
    ? h('div.oc-cl-room', h('span.oc-cl-room-k', tops.length > 1 ? 'CLOSEST IN THE ROOM · A TIE' : 'CLOSEST IN THE ROOM'),
      h('span.oc-cl-room-v', tops.slice(0, 3).map((x, i) => [i ? h('i', ' & ') : null, h('b', { style: { '--c': colorHex(ctx.player(x.u).color) } }, nm(x.u))]), h('span', ` · ${fmtVal(tops[0].g)}${unit}`)))
    : null;
  return box(answerFrame({
    q: spec.q,
    answer: h('span.oc-ans-num', fmtVal(spec.answer), h('small.oc-ans-unit', unit)),
    pick: g == null ? null : h('span.oc-ans-num', fmtVal(g), h('small.oc-ans-unit', unit)),
    pickLabel: 'YOUR GUESS',
    state, note: g == null ? 'NO GUESS' : '',
    slot: scale || roomLine ? h('div.oc-cl-slot', scale, roomLine) : null,
    delay: 120,
  }));
}
// MISSING LINK (OC3 — its own answer): per puzzle, the three clues each JOINED to the link, the link WHITE-HOT on THE ANSWER tile, YOUR PICK
// (your last guess) struck through when you never got it; the room's count under them. OC3B — THE NEUTRAL JOIN: each clue + the link are
// joined by a short lit tube (shared.js#joinTube), never an arrow. OC7 — the bank records each clue's SIDE: every clue shows its WHOLE word /
// phrase with the link part lit (shared.js#joinedWord: SUN|FLOWER · FIRE|WORK · ICE CREAM); the tube only where a row has no side (none do)
function missinglink(spec, picks, ctx) {
  const res = ((ctx.game && ctx.game.results && ctx.game.results[ctx.game.ci]) || {})[ctx.me];
  const both = (ctx.uids || []).filter(u => { const r = ((ctx.game && ctx.game.results && ctx.game.results[ctx.game.ci]) || {})[u]; return r && r.ok >= 2; }).length;
  const frames = spec.puzzles.map((pz, k) => {
    const link = normWord(pz.answer), p = picks[k];
    const right = p != null ? linkAccepts(p, pz) : !!(res && res.ok >= 2);
    const state = right ? 'right' : p != null ? 'wrong' : 'none';
    const d = 120 + k * 380;
    return answerFrame({
      // OC7 — each clue as the WHOLE word / phrase it makes with the link, the link part lit (SUN|FLOWER · FIRE|WORK · ICE CREAM)
      q: h('span.oc-ans-ml', pz.words.map((w, i) => {
        const j = pz.joins && pz.joins[i];
        return h(`span.oc-ans-ml-join${j ? '.is-whole' : ''}`, { 'aria-label': joinedText(w, link, j), style: { '--j': `${d + 520 + i * 110}ms` } }, ...joinedWord(w, link, j));
      })),
      answer: h('span.oc-ans-link', link),
      pick: state === 'wrong' ? h('span.oc-ans-link.is-pick', p) : null,
      state, note: state === 'none' ? (k === 0 && res && res.p >= 1 && !right && !LOST ? 'SKIPPED' : NONE()) : '',
      delay: d,
    });
  });
  const count = (ctx.uids || []).length > 1 ? h('div.oc-ans-count', h('b', `${both}/${(ctx.uids || []).length}`), ' LINKED BOTH') : null;
  return box(...frames, count);
}
// UNSCRAMBLE (OC3 — its own answer): the SCRAMBLED tiles FLY into the right word on THE ANSWER tile (each from its scrambled place — a
// transform each), YOUR PICK (your last full guess) struck through when you never cracked it; the room's count
function unscramble(spec, picks, ctx) {
  const results = (ctx.game && ctx.game.results && ctx.game.results[ctx.game.ci]) || {};
  const mine = results[ctx.me];
  const solved = !!(mine && mine.ok >= 1);
  const p = picks[0];
  const state = solved ? 'right' : p ? 'wrong' : 'none';
  // each letter of the word ← the scrambled place it came from (repeats take the first one left)
  const left = spec.letters.map((ch, i) => ({ ch, i }));
  const from = [...spec.word].map(ch => { const k = left.findIndex(x => x && x.ch === ch); const at = left[k].i; left[k] = null; return at; });
  const word = h('span.oc-ans-us', [...spec.word].map((ch, i) => h('i.oc-ans-us-t', { style: { '--dx': from[i] - i, '--i': i } }, ch.toUpperCase())));
  const cracked = (ctx.uids || []).filter(u => results[u] && results[u].ok >= 1).length;
  return box(answerFrame({
    q: h('span.oc-ans-us-from', 'FROM ', spec.letters.map(ch => h('i', ch.toUpperCase()))),
    answer: word,
    pick: state === 'wrong' ? h('span.oc-ans-link.is-pick', String(p).toUpperCase()) : null,
    state, note: state === 'none' ? 'NO WORD' : '', delay: 120,
    slot: (ctx.uids || []).length > 1 ? h('div.oc-ans-count', h('b', `${cracked}/${(ctx.uids || []).length}`), cracked === 1 ? ' PLAYER CRACKED IT' : ' PLAYERS CRACKED IT') : null,
  }));
}
// ---------------------------------------------------------------------------------------------- OC3B — THE CARD + LIST CHALLENGES
// SPELLCHECK: each word's RIGHT SPELLING white-hot on THE ANSWER tile in the plain upright face, the letters people usually get wrong
// UNDERLINED in --good (spell.js#trickyLetters — vs the bank's most common misspelling); YOUR PICK under it struck through with ITS wrong
// letters marked — a ✕ over them + a red zigzag underline, a red caret where a letter is missing (never color alone). The marks row on top.
function spellWord(word, marks, miss = null, kind = 'good') {
  return h('span.oc-sp-ans', { style: { '--len': String(word).length } }, spellRuns(word, marks, miss).map(r => (r.gap
    ? h('i.oc-sp-gap', { role: 'img', 'aria-label': 'a letter missing here' })
    : r.mark ? h(`u.oc-sp-m.is-${kind}`, { 'aria-label': kind === 'good' ? `${r.t} — the tricky part` : `${r.t} — wrong` }, r.t) : r.t)));
}
// OC7 — THE HARD LETTERS, exactly: the bank's `hard` indexes (the letters its most common misspelling gets wrong); an older deal without them →
// the OC3B alignment
export const hardMarks = it => (Array.isArray(it.hard) && it.hard.length ? [...String(it.word)].map((_, i) => it.hard.includes(i)) : trickyLetters(it.word, it.common));
function spellcheck(spec, picks) {
  const res = spec.items.map((it, i) => st(picks[i], it.ans));
  const b = box(sumRow(res, 'YOUR FIVE WORDS'), spec.items.map((it, i) => {
    const p = picks[i];
    const mine = p == null || p === it.ans ? null : it.options[p];
    const wl = mine ? wrongLetters(mine, it.word) : null;
    return answerFrame({
      answer: spellWord(it.word, hardMarks(it)),
      pick: mine ? spellWord(mine, wl.bad, wl.miss, 'bad') : null,
      state: res[i], note: p == null ? NONE() : '', upright: true,
      delay: 160 + i * 170,
    });
  }));
  b.classList.add('oc-sp-answers');
  return b;
}
// HIGHER OR LOWER: YOUR STREAK as the hero number (its 10-segment bar, cracked where the run ended), YOUR RUN — the pairs you got through as
// chips (your call ▲ / ▼ + the hidden one + ✓), then THE ONE THAT ENDED IT with BOTH numbers (the known one in the question, the hidden one
// white-hot + the right call; your call struck) — or the one you were on when the time ran out; the room's longest run under it
const arrow = dir => h('i.oc-hl-dir', { class: `is-${dir}`, 'aria-hidden': 'true' });
function higherlower(spec, picks, ctx) {
  const results = (ctx.game && ctx.game.results && ctx.game.results[ctx.game.ci]) || {};
  const boards = ctx.boards || {};
  const N = spec.pairs.length;
  const mine = results[ctx.me];
  const room = (ctx.uids || []).map(u => ({ u, s: results[u] ? Math.floor(results[u].ok || 0) : 0 }));
  const best = Math.max(0, ...room.map(x => x.s));
  const leaders = room.filter(x => best > 0 && x.s === best);
  const nm = u => (u === ctx.me ? 'YOU' : ctx.player(u).name);
  const roomLine = room.length > 1 ? h('div.oc-ans-count.oc-hl-room', best ? [h('span', 'LONGEST RUN IN THE ROOM · '), h('b', String(best)), h('span', ` · ${leaders.slice(0, 3).map(x => nm(x.u)).join(' & ')}`)] : 'NOBODY GOT ONE RIGHT') : null;
  if (!mine) return box(h('div.oc-hl-hero', h('span.oc-hl-hero-k', 'THE ROOM\'S LONGEST RUN'), h('b.oc-hl-hero-n', String(best)), h('span.oc-hl-hero-of', `/ ${N}`)), roomLine);
  const s = Math.floor(mine.ok || 0);
  const P = s < N ? spec.pairs[s] : null;
  const right = P ? hlRightDir(P) : null;
  const missed = !!P && ((picks[s] != null && picks[s] !== right) || ((boards[ctx.me] || {}).p || 0) > s);
  const segs = Array.from({ length: N }, (_, i) => h('i', { class: i < s ? 'is-on' : i === s && missed ? 'is-crack' : null, style: { '--i': i } }));
  const hero = h('div.oc-hl-hero', { class: s >= N ? 'is-perfect' : null },
    h('span.oc-hl-hero-k', s >= N ? 'A PERFECT RUN' : 'YOUR STREAK'),
    h('div.oc-hl-hero-row', h('b.oc-hl-hero-n', String(s)), h('span.oc-hl-hero-of', `/ ${N}`)),
    h('div.oc-segbar.oc-hl-bar.is-big', { class: missed ? 'is-cracked' : null, style: { '--at': s }, 'aria-hidden': 'true' }, segs, missed ? h('span.oc-hl-crack') : null));
  const run = s ? h('div.oc-hl-run', h('div.oc-hl-run-k', 'YOUR RUN'), h('div.oc-hl-run-list', spec.pairs.slice(0, s).map((Q, i) => {
    const d = picks[i] || hlRightDir(Q);
    return h('span.oc-hl-chip', { class: String(Q.b.name).length > 12 ? 'is-long' : null, style: { '--i': i }, 'aria-label': `${Q.b.name}: ${DIR_WORD[d]} than ${Q.a.name} — right` }, arrow(d), h('span.oc-hl-chip-t', Q.b.name), tubeMark('check'));
  }))) : null;
  const known = P ? h('span.oc-ans-hl-q', h('span.oc-ans-hl-stat', P.stat), h('span', P.a.name), statEl(P, P.a, '.is-known')) : null;
  const frame = P ? answerFrame({
    q: known,
    label: missed ? 'THE ONE THAT ENDED IT' : 'WHERE THE TIME RAN OUT',
    answer: h('span.oc-ans-hl', h('span.oc-ans-hl-name', P.b.name), statEl(P, P.b), h('em.oc-ans-hl-call', arrow(right), DIR_WORD[right])),
    pick: missed ? h('span.oc-ans-hl-call.is-pick', arrow(right === 'up' ? 'down' : 'up'), DIR_WORD[right === 'up' ? 'down' : 'up']) : null,
    pickLabel: 'YOUR CALL',
    state: missed ? 'wrong' : 'none', note: missed ? '' : 'OUT OF TIME',
    delay: 520,
  }) : null;
  return box(hero, run, frame, roomLine);
}

// TIMELINE: THE ANSWER plate (the direction), then the four rows in YOUR order SLIDE into the right one (a transform each), their VALUES on a
// rail beside them (they light as the rows land); each row carries your number + ✓ (in place — the --good edge) or ✕ (red edge) — never color
// alone. Your order = this phone's own (api.pick); a spectator / no lock-in sees the rows slide from the screen's order
function timeline(spec, picks) {
  const order = Array.isArray(picks[0]) && picks[0].length === 4 ? picks[0] : null;   // screen indexes in the order you tapped them
  let inPlace = 0;
  const rows = spec.items.map((it, k) => {
    const idx = spec.shown.indexOf(k);
    const mine = order ? order.indexOf(idx) : -1;
    const ok = mine === k;
    if (ok) inPlace++;
    return h('div.oc-tla-row', { class: order ? (ok ? 'is-right' : 'is-wrong') : 'is-none', style: { '--from': order ? mine : idx, '--to': k, '--k': k } },
      h('span.oc-tla-glass', { 'aria-hidden': 'true' }), h('span.oc-tla-edge', { 'aria-hidden': 'true' }),
      order ? h('span.oc-tla-you', { 'aria-label': `you put it ${mine + 1}${ok ? ', in place' : `, it belongs ${k + 1}`}` }, h('small', 'YOU'), h('b', String(mine + 1))) : null,
      h('span.oc-tla-t', it.label),
      order ? tubeMark(ok ? 'check' : 'cross') : null);
  });
  const rail = h('div.oc-tla-rail', { 'aria-label': 'the values in order' }, h('i.oc-tla-line', { 'aria-hidden': 'true' }),
    spec.items.map((it, k) => h('span.oc-tla-val', { class: String(it.value).length > 7 ? 'is-long' : null, style: { '--k': k } }, h('i', String(k + 1)), h('b', it.value))));
  return box(answerPanel({
    sub: spec.dir,
    slot: h('div.oc-tla',
      h('p.oc-tla-ask', spec.ask),
      h('div.oc-tla-k', h('span', 'THE RIGHT ORDER'), order ? h('span', h('b', `${inPlace}/4`), ' IN PLACE') : h('span', 'NO ORDER LOCKED IN')),
      h('div.oc-tla-board', rail, h('div.oc-tla-rows', rows))),
    delay: 80,
  }));
}
// SORT IT: the two sides' plates (blue left · orange right) over two columns — every card under the side it BELONGS to; yours ✓ (--good edge)
// or ✕ (red edge): a miss SLIDES IN from the side you put it on (it shows where it belonged), too slow = SLOW, never reached = –. Your sorts =
// this phone's own (api.pick, or the screen's log); a spectator sees the columns plain
function sortit(spec, picks, ctx) {
  const log = spec.cards.map((c, i) => {
    const p = picks[i];
    if (p === 0 || p === 1 || p === -1) return p;
    const L = ctx.sortLog;
    return L && i in L ? (L[i] == null ? -1 : L[i]) : null;
  });
  const played = log.some(v => v != null);
  let right = 0, wrong = 0;
  const col = side => h(`div.oc-sa-col.is-${side ? 'r' : 'l'}`,
    h('div.oc-sa-label', h('span.oc-sa-glass', { 'aria-hidden': 'true' }), h('b', side ? spec.right : spec.left)),
    spec.cards.map((c, i) => ({ c, i })).filter(x => x.c.s === side).map(({ c, i }, j) => {
      const v = log[i];
      const state = !played ? 'plain' : v == null ? 'none' : v === -1 ? 'slow' : v === side ? 'right' : 'wrong';
      if (state === 'right') right++; else if (state === 'wrong' || state === 'slow') wrong++;
      return h('div.oc-sa-card', { class: `is-${state}`, style: { '--j': j, '--from': side ? -1 : 1 } },
        h('span.oc-sa-glass', { 'aria-hidden': 'true' }), h('span.oc-sa-t', c.t),
        state === 'right' ? tubeMark('check', 'Sorted right') : state === 'wrong' ? tubeMark('cross', 'You sorted it the other way') : state === 'slow' ? h('small.oc-sa-tag', 'SLOW') : state === 'none' ? h('small.oc-sa-tag', '–') : null);
    }));
  const cols = h('div.oc-sa-cols', col(0), col(1));
  return box(answerPanel({
    sub: 'WHERE THEY BELONG',
    slot: h('div.oc-sa',
      played ? h('div.oc-sa-k', h('span', h('b.is-ok', `✓ ${right}`), ' SORTED RIGHT'), h('span', h('b.is-bad', `✕ ${wrong}`), ' MISSED')) : null,
      cols,
      played && wrong ? h('div.oc-sa-note', '✕ SLIDES IN FROM THE SIDE YOU PUT IT ON') : null),
    delay: 80,
  }));
}

// MEMORY (OC4 — its dressing): THE SEQUENCE REPLAYED on a small board of the same round glass nodes — each step's node blazes in turn
// with its number on it (a timer each — the view clears them; reduced motion: the board at rest) — then the steps as numbered mini grids under
// it, where you slipped marked ✕ (your wrong node lit red on that step); YOU GOT n / N on the plate's line
const miniGrid = (n, cls = '', bad = -1) => h(`span.oc-mg${cls}`, { 'aria-hidden': 'true' }, Array.from({ length: 9 }, (_, i) => h('i', { class: i === n ? 'is-on' : i === bad ? 'is-bad' : null })));
function memory(spec, picks, ctx) {
  const slip = picks[0] && typeof picks[0] === 'object' ? picks[0] : null;
  const N = spec.seq.length;
  const res = ctx.game && ctx.game.results && ctx.game.results[ctx.game.ci] && ctx.game.results[ctx.game.ci][ctx.me];
  const got = slip ? slip.at : res ? Math.min(N, Math.floor(res.ok || 0)) : N;
  const nodes = Array.from({ length: 9 }, () => memNode('i'));
  const nums = nodes.map(n => { const b = h('b.oc-mem-num'); n.append(b); return b; });
  const board = h('div.oc-mem-replay', { 'aria-hidden': 'true' }, nodes);
  const T0 = 350, STEP = Math.min(330, Math.floor(2100 / Math.max(1, N)));   // (inside the answer beat: 3 s on the 8-s screen — the owner's timing)
  const still = reducedMotion();
  const mark = () => {
    if (!slip) return;
    // (no ✓ / ✕ on the nodes — the owner: green + red; your node carries the crack)
    nodes[slip.n].classList.add('is-wrong', 'is-cracked'); nodes[slip.n].setAttribute('aria-label', 'Your tap');
    nodes[spec.seq[slip.at]].classList.add('is-right'); nodes[spec.seq[slip.at]].setAttribute('aria-label', 'The right node');
  };
  if (still || !ctx.timers) mark();
  else {
    spec.seq.forEach((n, k) => {
      ctx.timers.push(setTimeout(() => { if (!board.isConnected) return; nums[n].textContent = String(k + 1); nodes[n].classList.add('is-lit', 'is-num'); }, T0 + k * STEP));
      ctx.timers.push(setTimeout(() => { nodes[n].classList.remove('is-lit'); }, T0 + k * STEP + 250));
      ctx.timers.push(setTimeout(() => { nodes[n].classList.remove('is-num'); }, T0 + (k + 1) * STEP - 10));
    });
    ctx.timers.push(setTimeout(() => { if (board.isConnected) mark(); }, T0 + N * STEP + 120));
  }
  const steps = h('div.oc-ans-mem', spec.seq.map((n, k) => h('span.oc-mg-step', { class: slip && slip.at === k ? 'is-slip' : k < got ? 'is-done' : null, style: { '--k': k } },
    h('b', String(k + 1)), miniGrid(n, '', slip && slip.at === k ? slip.n : -1), slip && slip.at === k ? tubeMark('cross', `You slipped on step ${k + 1}`) : null)));
  const line = h('div.oc-mem-got', { class: slip ? 'is-slip' : 'is-clean' },
    h('span', 'YOU GOT '), h('b', String(got)), h('span', ` / ${N}`), slip ? h('em', ` · SLIPPED ON STEP ${slip.at + 1}`) : got >= N ? h('em', ' · CLEAN') : null,
    tubeMark(slip ? 'cross' : 'check'));
  return box(answerPanel({ sub: `THE SEQUENCE · ${N} STEPS`, slot: h('div.oc-mem-ans', board, steps, line), delay: 80 }));
}
// ODD ONE OUT's letters family: the odd glyph's own line where one is written ("0 is narrow — a zero"), else odd.js#oddWhy's general one
const ODD_WHY = {
  'O|Q': ['no tail', 'the tail'], 'E|F': ['the bottom bar', 'no bottom bar'], 'P|R': ['no leg', 'the leg'], 'C|G': ['no crossbar', 'the crossbar'],
  'V|Y': ['no stem', 'the stem'], 'M|N': ['two peaks', 'one diagonal'], 'T|Y': ['a flat top', 'a split top'], 'b|d': ['its bowl on the right', 'its bowl on the left'],
  'p|q': ['its bowl on the right', 'its bowl on the left'], '6|9': ['its loop at the bottom', 'its loop at the top'], 'u|v': ['a round bottom', 'a pointed bottom'],
  'm|n': ['two humps', 'one hump'], 'h|n': ['the tall stem', 'a short stem'], 'K|X': ['a straight back', 'two crossed lines'], '3|8': ['open on the left', 'two closed loops'],
  'O|0': ['round', 'narrow — a zero'], 'l|1': ['no flag', 'the flag'], 'I|l': ['bars top + bottom', 'no bars'], '5|S': ['a flat top', 'curves only'],
  '8|B': ['round on both sides', 'the flat back'], 'Z|2': ['a flat top', 'a curved top'], 'e|c': ['the bar', 'no bar'], 'G|6': ['open at the top', 'a closed loop'],
};
export function glyphWhy(odd, base) {
  const a = ODD_WHY[`${odd}|${base}`], b = ODD_WHY[`${base}|${odd}`];
  const why = a ? a[0] : b ? b[1] : '';
  return why ? `the ${odd} has ${why}`.replace(/has (round|narrow|open)/, 'is $1') : '';
}
// ODD ONE OUT (OC4 — its dressing): each grid small, THE ODD ONE RINGED white-hot (your wrong cell red + the crack's color), the odd one big
// beside it + WHAT MADE IT ODD in one short line (odd.js#oddWhy — "the arrow turned 30°", "a 5 among 6s", "the 0 among the Os"); ✓ / ✕ for
// your pick of that grid
function oddone(spec, picks) {
  const rows = spec.grids.map((g, k) => {
    const p = picks[k];
    const state = p == null ? 'none' : p === g.idx ? 'right' : 'wrong';
    const mini = h('div.oc-odd-mini', { class: `is-${g.fam}`, style: { '--n': g.size }, 'aria-hidden': 'true' },
      Array.from({ length: g.size * g.size }, (_, i) => h('i.oc-odd-mc', { class: i === g.idx ? 'is-odd' : i === p ? 'is-bad' : null }, oddFace(i === g.idx ? g.odd : g.base, g.fam))));
    return h('div.oc-odd-arow', { class: `is-${state}`, style: { '--k': k } },
      mini,
      h('div.oc-odd-why',
        h('small', `GRID ${k + 1} · ${g.size}×${g.size}`),
        h('span.oc-odd-big', { class: `is-${g.fam}` }, oddFace(g.odd, g.fam)),
        h('b', oddWhy(g, glyphWhy)),
        h('span.oc-odd-you', state === 'none' ? NONE() : state === 'right' ? 'YOU FOUND IT' : 'YOU MISSED IT', state === 'none' ? null : tubeMark(state === 'right' ? 'check' : 'cross'))));
  });
  return box(answerPanel({ sub: 'THE ODD ONES', slot: h('div.oc-odd-ans', rows), delay: 80 }));
}
// QUICK COUNT (OC4 — its dressing): THE GRID AGAIN with the asked shape LIT and COUNTED — 1, 2, 3 … ticking on cell by cell (a timer
// each, inside the answer beat), the rest dim; THE ANSWER = the real count, YOUR PICK under it (off by one = --close + ≈ + HALF — never
// color alone)
function count(spec, picks, ctx = {}) {
  const res = spec.items.map((it, i) => { const p = picks[i]; return p == null ? 'none' : p === it.ans ? 'right' : Math.abs(p - it.ans) === 1 ? 'close' : 'wrong'; });
  const { show, label } = missesFirst(res);
  const still = reducedMotion() || !ctx.timers;
  return box(sumRow(res, label), show.map((i, k) => {
    const it = spec.items[i], p = picks[i];
    let n = 0;
    const ticks = [];
    const grid = h('div.oc-qc-agrid', { style: { '--n': it.size }, 'aria-hidden': 'true' }, it.cells.map(c => {
      if (!c) return h('span.oc-qc-cell');
      if (c !== it.target) return h('span.oc-qc-cell', shapeEl(c));
      const t = h('b.oc-qc-tick', String(++n));
      ticks.push(t);
      return h('span.oc-qc-cell.is-t', shapeEl(c), t);
    }));
    const t0 = 380 + k * 300, step = Math.min(170, Math.floor(1500 / Math.max(1, ticks.length)));
    if (still) ticks.forEach(t => t.classList.add('is-on'));
    else ticks.forEach((t, j) => ctx.timers.push(setTimeout(() => t.classList.add('is-on'), t0 + j * step)));
    return answerFrame({
      q: h('span.oc-ans-count', `${i + 1} · HOW MANY `, shapeEl(it.target, '.oc-ans-shape'), ' ?'),
      answer: h('span.oc-ans-num', String(it.ans)), pick: p == null || p === it.ans ? null : h('span.oc-ans-num', String(p), res[i] === 'close' ? h('small', ' OFF BY ONE · HALF') : null),
      state: res[i], note: p == null ? NONE() : '', delay: 200 + k * 300,
      slot: h('div.oc-qc-ans', grid),
    });
  }));
}
// COLOR CLASH (OC4 — its dressing; the ADD-ONS, Nov 7: answered with color WORDS — clashAnswer): the word as it was shown (big, in its text color),
// THE ANSWER as a solid chip + its NAME (the name says it — never the color alone), your pick's chip + name struck through
const swatch = id => h('span.oc-ans-color', h('i', { style: { '--sw': STROOP_COLORS[id].hex } }), STROOP_COLORS[id].name);
function stroop(spec, picks) {
  const res = spec.items.map((it, i) => st(picks[i], clashAnswer(spec, it)));
  const { show, label } = missesFirst(res);
  return box(sumRow(res, label), show.map((i, k) => {
    const it = spec.items[i], p = picks[i], ans = clashAnswer(spec, it);
    return answerFrame({
      q: h('span.oc-ans-cc', h('b', { style: { color: STROOP_COLORS[it.color].hex } }, STROOP_COLORS[it.word].name), h('small', 'THE TEXT WAS')),
      answer: swatch(ans), pick: p == null || p === ans ? null : swatch(p),
      state: res[i], note: p == null ? NONE() : '', delay: 200 + k * 300,
    });
  }));
}
// SIGNAL LOCK (OC4: your rounds as chips, your BEST lit): your time vs the room's best. Your own taps are on this device (exact); the room's are their reaction credit
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
  const bestMs = hits.length ? Math.min(...hits) : null;   // (OC4: your best round lit)
  return box(answerFrame({
    q: room.length > 1 ? 'THE ROOM\'S FASTEST' : 'YOUR REACTION',
    answer: room.length > 1 && best ? h('span.oc-ans-rx', h('b', `≈ ${best.ms} ms`), h('small', ctx.player(best.u).name)) : h('span.oc-ans-rx', h('b', myMs == null ? '—' : `${exact ? '' : '≈ '}${myMs} ms`), h('small', 'AVERAGE')),
    pick: room.length > 1 && !iWon && myMs != null ? h('span.oc-ans-rx', h('b', `${exact ? '' : '≈ '}${myMs} ms`), h('small', 'YOUR AVERAGE')) : null,
    pickLabel: 'YOUR TIME',
    state: room.length < 2 ? (myMs == null ? 'none' : 'right') : iWon ? 'right' : myMs == null ? 'none' : 'close',
    note: myMs == null ? 'NO TAPS' : '',
    slot: mine.length ? h('div.oc-ans-rx-log', mine.map(v => h('span', { class: typeof v === 'number' ? (v === bestMs ? 'is-hit is-best' : 'is-hit') : 'is-miss', 'aria-label': typeof v === 'number' ? `${v} ms${v === bestMs ? ' — your best' : ''}` : 'a miss' }, typeof v === 'number' ? `${v}` : '✕'))) : null,
    delay: 120,
  }));
}
// REWIRE (OC4 — its dressing): BOTH CIRCUITS SOLVED + LIT on two small boards (stage 1 orange · stage 2 blue — the solution's turns, the path
// lit, the core blazing), your time on THE ANSWER tile; or WHERE YOU GOT TO (n / 2 live + how far the power reached on the one left)
const solvedBoard = (pz, k) => {
  const path = new Set(pz.path);
  return h('div.oc-wire-board.oc-wire-mini', { class: k ? 'is-blue' : 'is-orange', style: { '--n': pz.n }, 'aria-hidden': 'true' },
    rwSource(pz.src, pz.n),
    h('div.oc-wire-grid', { style: { '--n': pz.n } }, pz.tiles.map((shape, i) => {
      const rot = tubeLayers(shape);
      rot.style.transform = `rotate(${pz.solution[i] * 90}deg)`;
      return h('i.oc-wire-tile', { class: path.has(i) ? 'is-lit' : null }, h('i.oc-wire-glass'), rot);
    })),
    h('i.oc-wire-core.is-on', { style: { '--r': pz.core, '--n': pz.n } }, h('i.oc-wire-lead'), h('i.oc-wire-ring', h('i.oc-wire-ring-glow'), h('i.oc-wire-ring-hot'))));
};
function rewire(spec, picks, ctx) {
  const r = ((ctx.game.results && ctx.game.results[ctx.game.ci]) || {})[ctx.me];
  const t = ctx.game.tm && ctx.game.tm[ctx.game.ci] && ctx.game.tm[ctx.game.ci][ctx.me];
  const solved = r ? Math.floor(r.ok) : 0;
  const all = solved >= spec.puzzles.length;
  const secs = typeof t === 'number' ? `${(t / 1000).toFixed(1)} s` : '';
  // the tile states the GOAL (both circuits live — + your time when you made it); where you got to is YOUR PICK
  const power = r ? Math.round(Math.min(1, Math.max(0, r.ok - solved) / 0.6) * 100) : 0;
  const boards = spec.puzzles.every(Boolean) ? h('div.oc-wire-ans', spec.puzzles.map((pz, k) => h('div.oc-wire-ans-one', { style: { '--k': k } }, solvedBoard(pz, k), h('small', `CIRCUIT ${k + 1} · ${pz.n}×${pz.n}`)))) : null;
  return box(answerFrame({
    q: `${spec.puzzles.length} CIRCUITS · POWER TO THE CORE`,
    answer: h('span.oc-ans-rw', h('b', 'BOTH CIRCUITS LIVE'), all && secs ? h('small', `IN ${secs}`) : null),
    slot: boards,
    pick: !r || all ? null : h('span.oc-ans-rw', h('b', solved ? `${solved}/${spec.puzzles.length} LIVE` : 'NOT SOLVED'), h('small', `${power}% POWER ON ${solved ? 'THE ONE LEFT' : 'CIRCUIT 1'}`)),
    pickLabel: 'WHERE YOU GOT TO',
    state: !r ? 'none' : all ? 'right' : solved ? 'close' : 'wrong',
    note: r ? '' : 'NOT PLAYED',
    delay: 120,
  }));
}

// COMPASS (OC4 — its dressing; the last old panel is gone): per round, where you STARTED, the turns replayed on a small ring — the arrow sweeps
// turn by turn to the right heading while each turn's chip lights (a timer each, inside the 12-s screen's answer beat) — the heading, and
// YOUR PICK (✓ green · ✕ red + struck — this phone's own)
const TURN_CHIP = { L: 'LEFT', R: 'RIGHT', A: '180°' };
function compass(spec, picks, ctx = {}) {
  const still = reducedMotion() || !ctx.timers;
  const rows = spec.rounds.map((R, k) => {
    const dial = compassDial('.is-mini');
    dial.set(R.start * 90);
    const chips = [...R.turns].map(t => h('span.oc-cpa-turn', TURN_CHIP[t]));
    const out = h('b.oc-cpa-out', COMPASS_DIRS[R.ans]);
    const p = picks[k];
    const state = p == null ? 'none' : p === R.ans ? 'right' : 'wrong';
    const you = h('span.oc-cpa-you', { class: `is-${state}` }, state === 'none' ? '–' : COMPASS_DIRS[p], state === 'none' ? null : tubeMark(state === 'right' ? 'check' : 'cross', state === 'right' ? 'You got it' : 'Your pick'));
    const row = h('div.oc-cpa-row', { style: { '--k': k } }, h('span.oc-cpa-start', h('small', 'START'), h('b', COMPASS_DIRS[R.start])), dial.el, h('div.oc-cpa-turns', chips), out, you);
    let deg = R.start * 90;
    const steps = [...R.turns].map(t => { deg += COMPASS_TURN[t] === 3 ? -90 : COMPASS_TURN[t] * 90; return deg; });
    if (still) { dial.set(steps[steps.length - 1]); chips.forEach(c => c.classList.add('is-on')); out.classList.add('is-on'); }
    else {
      const t0 = 650 + k * 260, step = 330;
      steps.forEach((d, j) => ctx.timers.push(setTimeout(() => { if (!row.isConnected) return; dial.set(d); chips[j].classList.add('is-on'); }, t0 + j * step)));
      ctx.timers.push(setTimeout(() => { if (row.isConnected) out.classList.add('is-on'); }, t0 + steps.length * step + 80));
    }
    return row;
  });
  const right = spec.rounds.filter((R, k) => picks[k] === R.ans).length;
  return box(answerPanel({ sub: 'THE TURNS, PLAYED OUT', slot: h('div.oc-cpa', h('div.oc-cpa-k', h('span', 'YOU STARTED FACING · THE TURNS · WHERE YOU END'), picks.length ? h('span', h('b', `${right}/${spec.rounds.length}`), ' RIGHT') : null), rows), delay: 80 }));
}

// DUMB LUCK (OC5 — its THE FINISH was the race's own answer; this is the after-screen's first beat): THE WINNER on the white-hot tile (its
// color + its odds), YOUR HORSE struck when it lost (none = NO TICKET — from the room's record, so another device shows it too), the whole
// field's FINISHING ORDER in its colors, and who got PAID
const horseChip = (x, cls = '') => h(`span.oc-ans-horse${cls}`, { style: { '--hc': x.c } }, h('i', { 'aria-hidden': 'true' }), h('b', x.name), h('small', `${x.n}-1`));
function dumbluck(spec, picks, ctx) {
  const g = ctx.game, d = g && dlOf(g, g.ci);
  if (!d) return box(answerFrame({ q: 'WHO WON THE RACE?', answer: '—', delay: 120 }));
  const f = spec.field[d.w];
  const mine = d.pk[ctx.me];
  const state = mine == null ? 'none' : mine === d.w ? 'right' : 'wrong';
  const order = raceScript(g.seed, g.ci, d.w).order;
  const paid = (ctx.uids || []).filter(u => d.pk[u] === d.w);
  return box(answerFrame({
    q: 'WHO WON THE RACE?', answer: horseChip(f), pick: mine != null ? horseChip(spec.field[mine]) : null, pickLabel: 'YOUR HORSE',
    state, note: 'NO TICKET',
    slot: h('div.oc-ans-dl',
      h('div.oc-ans-dl-k', 'THE FINISH'),
      h('ol.oc-ans-dl-order', order.map((lane, i) => {
        const x = spec.field[lane];
        const who = (ctx.uids || []).filter(u => d.pk[u] === lane).map(u => (u === ctx.me ? 'YOU' : ctx.player(u).name));
        return h('li', { class: [lane === mine ? 'is-mine' : '', i === 0 ? 'is-win' : ''].join(' '), style: { '--hc': x.c, '--i': i } },
          h('span.oc-ans-dl-pl', String(i + 1)), h('i.oc-ans-dl-dot', { 'aria-hidden': 'true' }), h('b.oc-ans-dl-name', x.name), h('span.oc-ans-dl-odds', `${x.n}-1`),
          h('span.oc-ans-dl-who', i === 0 && who.length ? `+${x.pay} · ${who.join(' · ')}` : who.join(' · ')));
      })),
      paid.length ? null : h('div.oc-ans-dl-house', 'THE HOUSE KEEPS IT — NOBODY BACKED THE WINNER')),
    delay: 120,
  }));
}
export const ANSWERS = { trivia, truefalse, math, pattern, closest, missinglink, unscramble, spellcheck, higherlower, timeline, sortit, memory, oddone, count, stroop, reflex, rewire, compass, dumbluck };
/** the older reveals still in THE ANSWER's panel as they are (their own kicker stays inside the slot) until each one's rebuild */
export const PANELS = new Set();   // (OC4: every challenge has its own dressed answer now — COMPASS was the last old panel)
export const hasAnswer = type => !!ANSWERS[type] || PANELS.has(type);
/**
 * THE ANSWER for a closed challenge. ctx: { game, me, uids, player(uid), boards (this challenge's boards + the unsealed answers), timers,
 * sortLog } — the reveals' old ctx + who's looking.
 */
export function buildAnswer(type, spec, picks, ctx = {}) {
  LOST = !!ctx.lost && !(picks && picks.length);
  try { if (ANSWERS[type]) return ANSWERS[type](spec, picks || [], ctx); } finally { LOST = false; }
  if (PANELS.has(type) && ctx.game) return box(answerPanel({ slot: buildReveal(ctx.game, spec, ctx), delay: 80 }));
  return null;
}
