// THE ANSWER frame (OC1 — docs/cartridge.md D9, the kit: `gk-`; docs/overclock.md "After every challenge"). What every challenge shows
// once its round closes: the QUESTION in bold white; the RIGHT ANSWER as a white-hot tile labelled THE ANSWER with a laser underline that
// sweeps in (orange → blue in OVERDRIVE — the skin's --gk-laser); if you were WRONG, your pick below it as a dim tile struck through by a
// red laser line, labelled YOUR PICK. Right / close use the shared --good / --close tokens (COLOUR-BLIND swaps them) AND a shape (✓ · ✕ ·
// ≈ for a half) — never colour alone. A SLOT under the tiles takes challenge-specific content (passes OC2–OC4 fill it: a number line, an
// order, a grid …). Transform + opacity only: the tiles rise in, the lasers scale in on X; reduced motion = everything at rest.
//   answerFrame({ q, answer, pick, state: 'right' | 'wrong' | 'close' | 'none', label, pickLabel, note, slot, upright, delay })  → el
//   answerList(frames, { title }) → el   (a short stack: TRIVIA's three, TRUE OR FALSE's misses)
//   answerMark(state) → { sym, cls, say } (PURE)
import { h } from '../../ui/dom.js';

export const ANSWER_LABEL = 'THE ANSWER';
export const PICK_LABEL = 'YOUR PICK';
const MARKS = {
  right: { sym: '✓', cls: 'is-right', say: 'You got it' },
  wrong: { sym: '✕', cls: 'is-wrong', say: 'Your pick was wrong' },
  close: { sym: '≈', cls: 'is-close', say: 'Close — half credit' },
  none: { sym: '–', cls: 'is-none', say: 'No answer' },
};
export const answerMark = state => MARKS[state] || MARKS.none;

/** one frame. pick is shown only when it differs from the answer (wrong / close / none-with-a-note) */
export function answerFrame({ q = '', answer = '', pick = null, state = 'none', label = ANSWER_LABEL, pickLabel = PICK_LABEL, note = '', slot = null, upright = false, delay = 0 } = {}) {
  const m = answerMark(state);
  const showPick = pick != null && pick !== '' && state !== 'right';
  return h('section.gk-answer', { class: [m.cls, upright ? 'is-upright' : ''].join(' '), style: { '--d': `${delay}ms` } },
    q ? h('p.gk-answer-q', q) : null,
    h('div.gk-answer-tile',
      h('span.gk-answer-glow', { 'aria-hidden': 'true' }),
      h('span.gk-answer-label', label),
      h('b.gk-answer-text', answer),
      state === 'right' ? h('i.gk-answer-mark', { 'aria-label': m.say }, m.sym) : null,
      h('span.gk-laser', { 'aria-hidden': 'true' })),
    showPick ? h('div.gk-pick-tile', { class: m.cls },
      h('span.gk-answer-label', pickLabel),
      h('b.gk-pick-text', pick),
      h('i.gk-pick-mark', { 'aria-label': m.say }, m.sym),
      state === 'wrong' ? h('span.gk-strike', { 'aria-hidden': 'true' }) : null) : null,
    !showPick && state !== 'right' && note ? h('div.gk-pick-tile.is-none', h('span.gk-answer-label', pickLabel), h('b.gk-pick-text', note)) : null,
    slot ? h('div.gk-answer-slot', slot) : null);
}

/** a short stack of frames under one title (each delayed a little after the one before) */
export function answerList(frames, { title = '', step = 260, start = 120 } = {}) {
  return h('div.gk-answers',
    title ? h('div.gk-answers-title', title) : null,
    frames.map((f, i) => answerFrame({ ...f, delay: start + i * step })));
}
