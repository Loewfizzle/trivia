// HIGH RISE — THE SOUNDS LIST (S3 — docs/highrise.md "THE SOUNDS"; it was S2's SOUND AUDITION): the test page's SOUNDS sheet (THE SHEET —
// ui/sheet.js). The owner's picks are FINAL (Nov 19: ALL A — the B takes left the game): a plain list — EVERY sound, one PLAY each
// (THE PERFECT CHIME plays UP ITS SCALE: eight perfects in a row).
// ONE CHOICE IS OPEN AGAIN (S4A FIX's add-on — the owner, Nov 19: "the grow-back needs to be more pleasant on the ears"): GROW-BACK has
// FIVE takes — its row is five buttons, 1 · 2 · 3 · 4 · 5. A tap PLAYS that take IN CONTEXT — a perfect chime with the grow-back on
// top, three times in a quick streak (how it really sounds) — and CHOOSES it: remembered on this phone (sounds.js#GROW_KEY), the game
// plays it from the next run. COPY MY PICK copies the one line to send back.
// EVERY TAP ACTS: each button on its own press + lift (never a click).
import { h } from '../../ui/dom.js';
import { openSheet } from '../../ui/sheet.js';
import { SOUNDS, fetchSounds, decode, play, stopAll, grow, setGrow } from './sfx.js';
import { CHIME_STEPS, chimeRate, GROW_TAKES, growFile, growLine } from './sounds.js';

/** GROW-BACK in context: this many perfects in a row (the 7th, 8th, 9th — where the slab grows back), this far apart (s) */
export const GROW_DEMO = Object.freeze({ times: 3, gap: 0.62, from: 7 });

export function openAudition({ press, onClose = null } = {}) {
  fetchSounds(); fetchSounds(GROW_TAKES.map(growFile)); Promise.resolve(decode()).catch(() => {});   // (all five takes: heard at once when asked)
  let climb = 0, copied = 0;
  const stopClimb = () => { clearTimeout(climb); climb = 0; };
  const tube = (label, fn) => press(h('button.btn.btn-ghost.btn-sm.hi-au-play', { type: 'button' }, h('span', label)), fn);
  /** the chime up its scale: one step every 0.32 s, the last one twice (it HOLDS at the top) */
  const scale = () => { stopClimb(); let n = 1; const step = () => { play('perfect', { rate: chimeRate(n) }); if (++n <= CHIME_STEPS.length + 1) climb = setTimeout(step, 320); }; step(); };
  // ---- GROW-BACK: five takes, heard in context, one chosen
  const takes = GROW_TAKES.map(n => {
    const b = press(h('button.hi-tab.hi-au-take', { type: 'button', 'data-take': String(n), 'aria-pressed': 'false', 'aria-label': `Grow-back, take ${n}` }, String(n)), () => {
      stopClimb(); stopAll();
      setGrow(n); mark();
      for (let i = 0; i < GROW_DEMO.times; i++) { play('perfect', { rate: chimeRate(GROW_DEMO.from + i), delay: i * GROW_DEMO.gap }); play('grow-back', { take: n, delay: i * GROW_DEMO.gap + 0.02 }); }
    });
    return b;
  });
  const line = h('small.hi-au-pick', '');
  function mark() { const g = grow(); for (const b of takes) { const on = Number(b.dataset.take) === g; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); } line.textContent = `${growLine(g)} — this phone plays it`; }
  const copyT = h('span', 'COPY MY PICK');
  const copy = press(h('button.btn.btn-ghost.btn-sm.hi-au-copy', { type: 'button', 'data-gesture': '' }, copyT), () => {
    const text = growLine(grow()), done = ok => { copyT.textContent = ok ? 'COPIED' : 'COPY IT BY HAND ↑'; clearTimeout(copied); copied = setTimeout(() => { copyT.textContent = 'COPY MY PICK'; }, 1800); };
    try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
  });
  const growRow = s => h('div.hi-au-row.hi-au-grow', { 'data-id': s.id },
    h('div.hi-au-name', h('b', s.label), h('small', 'five takes — tap one: a perfect chime with it on top, three in a row'), line),
    h('div.hi-au-takes', { role: 'group', 'aria-label': 'Grow-back: pick a take' }, ...takes), copy);
  const rows = SOUNDS.map(s => {
    if (s.takes) return growRow(s);
    const b = tube('PLAY', () => (s.chime ? scale() : play(s.id)));
    b.dataset.snd = s.id;
    return h('div.hi-au-row', { 'data-id': s.id },
      h('div.hi-au-name', h('b', s.label), h('small', s.chime ? 'PLAY climbs its scale' : s.play ? 'in play now' : 'the match — not in play yet')), b);
  });
  mark();
  const body = h('div.hi-au', h('p.hi-au-k', 'Every sound of the game. Tap PLAY to hear one — and pick the GROW-BACK you like.'), ...rows);
  return openSheet({ title: 'SOUNDS', kicker: 'HIGH RISE · EVERY SOUND', body, cls: 'hi-au-sheet', onClose: () => { stopClimb(); clearTimeout(copied); stopAll(); if (onClose) onClose(); } });
}
