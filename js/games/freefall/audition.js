// FREEFALL — THE SOUNDS LIST (F2 — docs/freefall.md "THE SOUNDS"; HIGH RISE's): the test page's SOUNDS sheet (THE SHEET — ui/sheet.js):
// every sound, one PLAY each (THE NOTE plays UP ITS SCALE: eight clean floors in a row). Nothing to choose, nothing stored.
// EVERY TAP ACTS: each button on its own press + lift (never a click).
import { h } from '../../ui/dom.js';
import { openSheet } from '../../ui/sheet.js';
import { SOUNDS, fetchSounds, decode, play, stopAll } from './sfx.js';
import { SCALE_STEPS, scaleRate } from './sounds.js';

export function openAudition({ press, onClose = null } = {}) {
  fetchSounds(); Promise.resolve(decode()).catch(() => {});
  let climb = 0;
  const stopClimb = () => { clearTimeout(climb); climb = 0; };
  const tube = (label, fn) => press(h('button.btn.btn-ghost.btn-sm.ff-au-play', { type: 'button' }, h('span', label)), fn);
  /** the note: the bounce as recorded, then up its scale — one step every 0.3 s, the last one twice (it HOLDS at the top) */
  const scale = () => { stopClimb(); let n = 0; const step = () => { play('bounce', { rate: n ? scaleRate(n) : 1 }); if (++n <= SCALE_STEPS.length + 1) climb = setTimeout(step, 300); }; step(); };
  const rows = SOUNDS.map(s => {
    const b = tube('PLAY', () => (s.scale ? scale() : play(s.id)));
    b.dataset.snd = s.id;
    return h('div.ff-au-row', { 'data-id': s.id },
      h('div.ff-au-name', h('b', s.label), h('small', s.scale ? 'PLAY: a bounce, then up its scale' : s.play ? 'in play now' : 'the finish — not in play yet')), b);
  });
  const body = h('div.ff-au', h('p.ff-au-k', 'Every sound of the game. Tap PLAY to hear one.'), ...rows);
  return openSheet({ title: 'SOUNDS', kicker: 'FREEFALL · EVERY SOUND', body, cls: 'ff-au-sheet', onClose: () => { stopClimb(); stopAll(); if (onClose) onClose(); } });
}
