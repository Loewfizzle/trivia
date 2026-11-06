// THE ANSWER frame (OC1 — docs/cartridge.md D9, the kit: `gk-`; docs/overclock.md "After every challenge"). What every challenge shows
// once its round closes: the QUESTION in bold white; the RIGHT ANSWER as a white-hot tile labelled THE ANSWER with a laser underline that
// sweeps in (orange → blue in OVERDRIVE — the skin's --gk-laser); if you were WRONG, your pick below it as a dim tile struck through by a
// red laser line, labelled YOUR PICK. Right / close use the shared --good / --close tokens (COLOUR-BLIND swaps them) AND a shape (✓ · ✕ ·
// ≈ for a half) — never colour alone. THE MARKS (OC1 ADD-ONs 3 + 4 — the owner: the filled circles "read as stock emoji"): a NEON TUBE
// stroke in a small slanted DARK-GLASS SOCKET (tubeMark — the letter badge's slant; a static glow path under the tube = the pre-rendered
// layer); THE ANSWER always wears the ✓, + an orange YOU tag when it was your pick; a wrong YOUR PICK wears a thin red tube ✕ beside the strike.
// A SLOT under the tiles takes challenge-specific content (passes OC2–OC4 fill it: a number line, an order, a grid …). Transform + opacity only: the tiles rise in, the lasers scale in on X; reduced motion = everything at rest.
//   answerFrame({ q, answer, pick, state: 'right' | 'wrong' | 'close' | 'none', label, pickLabel, note, slot, upright, delay })  → el
//   answerList(frames, { title }) → el   (a short stack: TRIVIA's three, TRUE OR FALSE's misses)
//   answerMark(state) → { sym, cls, say } (PURE)
import { h, svgEl } from '../../ui/dom.js';

export const ANSWER_LABEL = 'THE ANSWER';
export const PICK_LABEL = 'YOUR PICK';
const MARKS = {
  right: { sym: '✓', cls: 'is-right', say: 'You got it' },
  wrong: { sym: '✕', cls: 'is-wrong', say: 'Your pick was wrong' },
  close: { sym: '≈', cls: 'is-close', say: 'Close — half credit' },
  none: { sym: '–', cls: 'is-none', say: 'No answer' },
};
export const answerMark = state => MARKS[state] || MARKS.none;

const TUBE = {
  check: 'M5.5 13.8 L10.6 18.8 L20.8 7.4',
  cross: 'M7.5 7.5 L18.5 18.5 M18.5 7.5 L7.5 18.5',
  approx: 'M5.5 10.5 C8 7.5 10.5 7.5 13 10.5 S18 13.5 20.5 10.5 M5.5 17 C8 14 10.5 14 13 17 S18 20 20.5 17',
};
/** a neon-tube mark in its dark-glass socket: kind 'check' (--good) · 'cross' (red) · 'approx' (--close) */
export function tubeMark(kind = 'check', label = '') {
  const d = TUBE[kind] || TUBE.check;
  return h(`span.gk-sock.is-${kind in TUBE ? kind : 'check'}`, { role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true' },
    svgEl(`<svg viewBox="0 0 26 26" aria-hidden="true"><path class="gk-tube-glow" d="${d}"/><path class="gk-tube" d="${d}"/><path class="gk-tube-core" d="${d}"/></svg>`));
}

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
      h('span.gk-answer-end', state === 'right' ? h('span.gk-you', { 'aria-label': 'Your pick' }, 'YOU') : null, tubeMark('check', state === 'right' ? m.say : 'The right answer')),
      h('span.gk-laser', { 'aria-hidden': 'true' })),
    showPick ? h('div.gk-pick-tile', { class: m.cls },
      h('span.gk-answer-label', pickLabel),
      h('b.gk-pick-text', pick),
      h('span.gk-answer-end', tubeMark(state === 'close' ? 'approx' : 'cross', m.say)),
      state === 'wrong' ? h('span.gk-strike', { 'aria-hidden': 'true' }) : null) : null,
    !showPick && state !== 'right' && note ? h('div.gk-pick-tile.is-none', h('span.gk-answer-label', pickLabel), h('b.gk-pick-text', note)) : null,
    slot ? h('div.gk-answer-slot', slot) : null);
}

/** THE ANSWER as a PANEL (OC2): the white-hot slanted THE ANSWER plate + its laser, then a challenge's own content in the slot — for the
 *  reveals that show more than one answer (a number line, an order, both sides of a sort). `sub` = one short line on the plate. */
export function answerPanel({ label = ANSWER_LABEL, sub = '', slot = null, delay = 0 } = {}) {
  return h('section.gk-answer.is-panel', { style: { '--d': `${delay}ms` } },
    h('div.gk-answer-tile.gk-answer-plate',
      h('span.gk-answer-glow', { 'aria-hidden': 'true' }),
      h('span.gk-answer-label', label),
      sub ? h('b.gk-answer-text', sub) : null,
      h('span.gk-laser', { 'aria-hidden': 'true' })),
    slot ? h('div.gk-answer-slot', slot) : null);
}

/** a short stack of frames under one title (each delayed a little after the one before) */
export function answerList(frames, { title = '', step = 260, start = 120 } = {}) {
  return h('div.gk-answers',
    title ? h('div.gk-answers-title', title) : null,
    frames.map((f, i) => answerFrame({ ...f, delay: start + i * step })));
}
