// THE PASSWORD — THE END SCREEN's result block, ONE builder (FIXES R2): the live end screen (view.js#end) + TAP A TICKET's sheet
// (js/daily/end-sheet.js — a finished run read back from the server, read-only). Pure DOM from a run view (logic.js#runView): the headline ·
// WELCOME IN = the big guess count + the time, LOCKED OUT = one small line · every door played: its marks grid + its word.
import { h } from '../../ui/dom.js';
import { scoreOf, headline, failLine, fmtTime, DOORS } from './logic.js';

export const miniGrid = d => h('div.pw-mini', { role: 'img', 'aria-label': `${d.guesses.length} guesses` },
  d.marks.map(m => h('div.pw-mini-row', m.map(x => h('i.pw-mini-c', { class: `is-${x}` })))));

/** run → { el: div.pw-end-result, title: its h2 (fitTitle), crack: every door opened } */
export function pwEndResult(run) {
  const s = scoreOf(run), crack = s.doors === DOORS;
  const title = h('h2.pw-end-t', headline(run));
  const played = run.doors.filter(d => d.guesses.length);
  const el = h('div.pw-end-result',
    title,
    // WELCOME IN: ONE big number + the time small under it · LOCKED OUT: one small line "6 GUESSES · 2:15" (no big number)
    crack ? h('div.pw-end-n', h('b', String(s.guesses)), h('span', s.guesses === 1 ? 'GUESS' : 'GUESSES')) : null,
    crack ? h('div.pw-end-time', fmtTime(s.time)) : h('div.pw-end-line', failLine(run)),
    h('div.pw-end-grids', played.map(d => h('div.pw-end-door', miniGrid(d), h('b.pw-end-word', { class: d.state === 'solved' ? 'is-open' : 'is-shut' }, d.word || '')))));
  return { el, title, crack };
}
