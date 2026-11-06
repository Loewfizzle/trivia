// OVERCLOCK — THE ANSWER after a challenge (OC1: TRIVIA LIGHTNING + TRUE OR FALSE in the kit's frame — js/games/kit/answer.js; OC2 gives every
// other challenge its own). Your PICKS are yours alone: kept on this device (sessionStorage — a refresh still shows them; never in the
// database, nobody else needs them), so the frame shows THE ANSWER + YOUR PICK struck through when you missed.
import { h } from '../../ui/dom.js';
import { answerFrame } from '../kit/answer.js';

const key = (m, ci) => `oc:pk:${m}:${ci}`;
export function savePicks(m, ci, picks) { try { sessionStorage.setItem(key(m, ci), JSON.stringify(picks)); } catch { /* private mode: this screen only */ } }
export function loadPicks(m, ci) { try { const v = JSON.parse(sessionStorage.getItem(key(m, ci)) || 'null'); return Array.isArray(v) ? v : []; } catch { return []; } }

const LETTER = 'ABCD';
const tfWord = v => (v ? 'TRUE' : 'FALSE');

function trivia(spec, picks) {
  return h('div.gk-answers.oc-answers',
    spec.questions.map((q, i) => {
      const p = picks[i];
      const state = p == null ? 'none' : p === q.c ? 'right' : 'wrong';
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
  const res = spec.items.map((it, i) => (picks[i] == null ? null : picks[i] === it.truth));
  const right = res.filter(r => r === true).length;
  // your misses first (up to two), else the last statement — 8 frames would not fit beside the leaderboard
  const misses = spec.items.map((it, i) => i).filter(i => res[i] === false).slice(0, 2);
  const show = misses.length ? misses : [spec.items.length - 1];
  const sum = h('div.oc-tf-sum',
    h('span.oc-tf-sum-k', misses.length ? (misses.length > 1 ? 'YOUR MISSES' : 'YOUR MISS') : right === spec.items.length ? 'CLEAN SWEEP' : 'THE LAST ONE'),
    h('span.oc-tf-pips', res.map(r => h('i', { class: r === true ? 'is-right' : r === false ? 'is-wrong' : null, 'aria-label': r === true ? 'right' : r === false ? 'wrong' : 'no answer' }, r === true ? '✓' : r === false ? '✕' : '–'))),
    h('b.oc-tf-sum-n', `${right}/${spec.items.length}`));
  return h('div.gk-answers.oc-answers', sum,
    show.map((i, k) => {
      const it = spec.items[i], p = picks[i];
      const state = p == null ? 'none' : p === it.truth ? 'right' : 'wrong';
      return answerFrame({
        q: it.text,
        answer: h('span.oc-ans-tf', h('i', it.truth ? '✓' : '✕'), tfWord(it.truth)),
        pick: p == null || p === it.truth ? null : h('span.oc-ans-tf', h('i', p ? '✓' : '✕'), tfWord(p)),
        state, note: p == null ? 'NO ANSWER' : '',
        delay: 200 + k * 300,
      });
    }));
}

export const ANSWERS = { trivia, truefalse };
export const hasAnswer = type => !!ANSWERS[type];
export const buildAnswer = (type, spec, picks) => (ANSWERS[type] ? ANSWERS[type](spec, picks || []) : null);
