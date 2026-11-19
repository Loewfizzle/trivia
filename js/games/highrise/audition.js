// HIGH RISE — THE SOUNDS LIST (S3 — docs/highrise.md "THE SOUNDS"; it was S2's SOUND AUDITION): the test page's SOUNDS sheet (THE SHEET —
// ui/sheet.js). The owner's picks are FINAL (Nov 19: ALL A — the B takes left the game): a plain list — EVERY sound, one PLAY each
// (THE PERFECT CHIME plays UP ITS SCALE: eight perfects in a row).
// GROW-BACK IS FINAL AGAIN (S4A FIX 2 — the owner picked take 1, "Heal Restore"): its chooser is gone — a plain PLAY like every sound.
// EVERY TAP ACTS: each button on its own press + lift (never a click).
import { h } from '../../ui/dom.js';
import { openSheet } from '../../ui/sheet.js';
import { SOUNDS, fetchSounds, decode, play, stopAll } from './sfx.js';
import { CHIME_STEPS, chimeRate } from './sounds.js';

export function openAudition({ press, onClose = null } = {}) {
  fetchSounds(); Promise.resolve(decode()).catch(() => {});
  let climb = 0;
  const stopClimb = () => { clearTimeout(climb); climb = 0; };
  const tube = (label, fn) => press(h('button.btn.btn-ghost.btn-sm.hi-au-play', { type: 'button' }, h('span', label)), fn);
  /** the chime up its scale: one step every 0.32 s, the last one twice (it HOLDS at the top) */
  const scale = () => { stopClimb(); let n = 1; const step = () => { play('perfect', { rate: chimeRate(n) }); if (++n <= CHIME_STEPS.length + 1) climb = setTimeout(step, 320); }; step(); };
  const rows = SOUNDS.map(s => {
    const b = tube('PLAY', () => (s.chime ? scale() : play(s.id)));
    b.dataset.snd = s.id;
    return h('div.hi-au-row', { 'data-id': s.id },
      h('div.hi-au-name', h('b', s.label), h('small', s.chime ? 'PLAY climbs its scale' : s.play ? 'in play now' : 'the match — not in play yet')), b);
  });
  const body = h('div.hi-au', h('p.hi-au-k', 'Every sound of the game. Tap PLAY to hear one.'), ...rows);
  return openSheet({ title: 'SOUNDS', kicker: 'HIGH RISE · EVERY SOUND', body, cls: 'hi-au-sheet', onClose: () => { stopClimb(); stopAll(); if (onClose) onClose(); } });
}
