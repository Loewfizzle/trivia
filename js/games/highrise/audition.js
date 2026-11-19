// HIGH RISE — THE SOUND AUDITION (S2 — docs/highrise.md "THE SOUNDS"; JAYWALK's pattern): the test page's SOUNDS sheet (THE SHEET —
// ui/sheet.js). EVERY sound, its pick + its B side by side (PLAY A · PLAY B — B = the delivery's backup file, or an IN-CODE VARIANT: the
// same file at another pitch), a choice a sound (remembered on this phone: sfx.js#setPick — the page plays the choice), THE PERFECT CHIME
// played UP ITS SCALE (eight perfects in a row), and COPY MY PICKS — one short line for the owner to paste into chat.
// EVERY TAP ACTS: each button on its own press + lift (never a click); the copy runs INSIDE the lift (a user gesture).
import { h } from '../../ui/dom.js';
import { openSheet } from '../../ui/sheet.js';
import { SOUNDS, fetchSounds, play, pick, setPick, picksLine, stopAll } from './sfx.js';
import { CHIME_STEPS, chimeRate } from './sounds.js';

export function openAudition({ press, onClose = null } = {}) {
  fetchSounds();
  let climb = 0;
  const stopClimb = () => { clearTimeout(climb); climb = 0; };
  const tube = (label, cls, fn) => press(h(`button.btn.btn-ghost.btn-sm${cls}`, { type: 'button' }, h('span', label)), fn);
  /** the chime up its scale: one step every 0.32 s, the last one twice (it HOLDS at the top) */
  const scale = ab => { stopClimb(); let n = 1; const step = () => { play('perfect', { ab, rate: chimeRate(n) }); if (++n <= CHIME_STEPS.length + 1) climb = setTimeout(step, 320); }; step(); };
  const rows = SOUNDS.map(s => {
    const two = !!s.takes.b;
    const playBtn = ab => { const b = tube(ab === 'b' ? 'PLAY B' : two ? 'PLAY A' : 'PLAY', '.hi-au-play', () => (s.chime ? scale(ab) : play(s.id, { ab }))); b.dataset.snd = `${s.id}:${ab}`; return b; };
    const choice = two ? ['a', 'b'].map(ab => press(h('button.hi-tab.hi-au-pick', { type: 'button', 'data-pick': `${s.id}:${ab}`, 'aria-label': `${s.label}: use ${ab.toUpperCase()}` }, ab.toUpperCase()), () => {
      setPick(s.id, ab); mark(); line.textContent = picksLine();
    })) : [];
    const mark = () => { for (const c of choice) c.classList.toggle('is-on', c.dataset.pick === `${s.id}:${pick(s.id)}`); };
    mark();
    const about = two ? `A: ${s.about.a} · B: ${s.about.b}` : s.play ? 'in play now' : 'the match — not in play yet';
    return h('div.hi-au-row', { 'data-id': s.id },
      h('div.hi-au-name', h('b', s.label), h('small', s.chime ? `${about} · PLAY climbs its scale` : about)),
      h('div.hi-au-btns', playBtn('a'), two ? playBtn('b') : null),
      two ? h('div.hi-au-choice', h('span.hi-au-k2', 'USE'), ...choice) : h('div.hi-au-choice.is-one', 'ONE TAKE'));
  });
  const line = h('p.hi-au-line', picksLine()), said = h('p.hi-au-said', { 'aria-live': 'polite' }, '');
  const copy = press(h('button.btn.btn-primary.btn-block.hi-au-copy', { type: 'button' }, h('span', 'COPY MY PICKS')), () => {
    const text = picksLine();
    const done = ok => { said.textContent = ok ? 'COPIED — PASTE IT INTO CHAT' : 'PRESS AND HOLD THE LINE ABOVE TO COPY IT'; };
    try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
  });
  const body = h('div.hi-au', h('p.hi-au-k', 'Tap PLAY to hear a sound. Where there are two takes, pick the one the game should use.'), ...rows, line, copy, said);
  return openSheet({ title: 'SOUNDS', kicker: 'HIGH RISE · THE AUDITION', body, cls: 'hi-au-sheet', onClose: () => { stopClimb(); stopAll(); if (onClose) onClose(); } });
}
