// JAYWALK — THE SOUND AUDITION (H2 — docs/jaywalk.md "THE AUDITION"): the lab's SOUNDS sheet (THE SHEET — ui/sheet.js). EVERY JAYWALK sound,
// its pick + its `-b` backup side by side (PLAY · PLAY B), the train bell as a seamless LOOP (STOP), a choice a sound (A or B — remembered
// on this phone: sfx.js#setPick; the game plays the choice) and COPY MY PICKS — one short line for the owner to paste into chat.
// EVERY TAP ACTS: each button on its own press + lift (never a click — the page's rule); the copy runs INSIDE the lift (a user gesture).
// Audio unlocks on the first tap anywhere (the shared engine's rule — the tap that opened this sheet).
import { h } from '../../ui/dom.js';
import { openSheet } from '../../ui/sheet.js';
import { SOUNDS, fetchSounds, play, pick, setPick, picksLine, stopAll } from './sfx.js';

export function openAudition({ press, onClose = null } = {}) {
  fetchSounds(SOUNDS.map(s => s.id), true);   // (the audition hears a sound's pick AND its backup)
  const loops = new Map();   // 'id:a' → its handle (the bell)
  const stopLoops = () => { for (const l of loops.values()) l.stop(); loops.clear(); for (const b of body.querySelectorAll('.jw-au-play.is-on')) b.classList.remove('is-on'); };
  const tube = (label, cls, fn) => press(h(`button.btn.btn-ghost.btn-sm${cls}`, { type: 'button' }, h('span', label)), fn);
  const rows = SOUNDS.map(s => {
    const playBtn = ab => {
      const key = `${s.id}:${ab}`, b = tube(ab === 'b' ? 'PLAY B' : s.b ? 'PLAY A' : 'PLAY', '.jw-au-play', () => {
        if (!s.loop) { play(s.id, { ab }); return; }
        const was = loops.has(key);
        stopLoops();
        if (was) return;
        const keep = hd => { loops.set(key, hd); b.classList.add('is-on'); };
        const hd = play(s.id, { ab, loop: true, onLate: keep });
        if (hd) keep(hd);
      });
      b.dataset.snd = key;
      return b;
    };
    const choice = s.b ? ['a', 'b'].map(ab => press(h('button.jw-tab.jw-au-pick', { type: 'button', 'data-pick': `${s.id}:${ab}`, 'aria-label': `${s.label}: use ${ab.toUpperCase()}` }, ab.toUpperCase()), () => {
      setPick(s.id, ab); for (const c of choice) c.classList.toggle('is-on', c.dataset.pick === `${s.id}:${pick(s.id)}`); line.textContent = picksLine();
    })) : [];
    for (const c of choice) c.classList.toggle('is-on', c.dataset.pick === `${s.id}:${pick(s.id)}`);
    return h('div.jw-au-row', { 'data-id': s.id },
      h('div.jw-au-name', h('b', s.label), h('small', s.loop ? 'in play now · tap again or STOP to end it' : s.play ? 'in play now' : 'audition only')),
      h('div.jw-au-btns', playBtn('a'), s.b ? playBtn('b') : null),
      s.b ? h('div.jw-au-choice', h('span.jw-bar-k', 'USE'), ...choice) : h('div.jw-au-choice.is-one', 'ONE TAKE'));
  });
  const line = h('p.jw-au-line', picksLine()), said = h('p.jw-au-said', { 'aria-live': 'polite' }, '');
  const copy = press(h('button.btn.btn-primary.btn-block.jw-au-copy', { type: 'button' }, h('span', 'COPY MY PICKS')), () => {
    const text = picksLine();
    const done = ok => { said.textContent = ok ? 'COPIED — PASTE IT INTO CHAT' : 'PRESS AND HOLD THE LINE ABOVE TO COPY IT'; };
    try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
  });
  const stop = tube('STOP THE BELL', '.jw-au-stop', () => stopLoops());
  const body = h('div.jw-au', h('p.jw-au-k', 'Tap PLAY to hear a sound. Where there are two takes, pick the one the game should use.'), ...rows, stop, line, copy, said);
  const sheet = openSheet({ title: 'SOUNDS', kicker: 'JAYWALK · THE AUDITION', body, cls: 'jw-au-sheet', onClose: () => { stopLoops(); stopAll(); if (onClose) onClose(); } });
  return sheet;
}
