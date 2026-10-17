// OVERCLOCK — COMPASS: follow the turns in your head, tap the final heading.
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game() — see view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { serverNow } from '../../../firebase.js';
import { COMPASS_DIRS, COMPASS_STEP_MS, COMPASS_GAP_MS, COMPASS_START_MS, COMPASS_FLASH_MS } from '../challenges.js';
import { ROSE_SVG, NEEDLE_SVG, DIR_NAME, TURN_TEXT, TURN_SVG, fastButton } from '../shared.js';

export default function uiCompass(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.ch-compass');
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  let r = chal.p;
  let mode = 'idle';
  let rot = 0;
  const needle = h('div.cp-needle', { html: NEEDLE_SVG });
  const rose = h('div.cp-rose', { html: ROSE_SVG }, needle);
  const card = h('div.cp-card');
  const dots = h('div.cp-dots');
  const title = h('div.ch-prompt');
  const btns = COMPASS_DIRS.map((d, i) => fastButton(`button.cp-dir.cp-${d.toLowerCase()}`, { disabled: true, 'aria-label': DIR_NAME[d] }, () => answer(i), d));
  const point = dir => { rot += ((((dir * 90 - rot) % 360) + 540) % 360) - 180; needle.style.transform = `rotate(${rot}deg)`; };
  const setDirs = on => btns.forEach(b => { b.disabled = !on; b.classList.remove('is-correct', 'is-wrong'); });
  const round = () => {
    if (chal.done || r >= s.rounds.length) return;
    const R = s.rounds[r];
    mode = 'start';
    title.textContent = `ROUND ${r + 1}/${s.rounds.length} · ${R.turns.length} TURNS`;
    setDirs(false);
    wrap.classList.remove('is-asking');
    needle.classList.remove('is-hidden');
    point(R.start);
    card.className = 'cp-card is-start';
    card.replaceChildren(h('small', 'YOU’RE FACING'), h('b', DIR_NAME[COMPASS_DIRS[R.start]]));
    pulseClass(card, 'tick');
    dots.replaceChildren(...[...R.turns].map(() => h('i')));
    sfx('select');
    let t = COMPASS_START_MS[r];
    [...R.turns].forEach((turn, k) => {
      later(() => {
        mode = 'turns';
        needle.classList.add('is-hidden');
        card.className = 'cp-card is-turn';
        card.replaceChildren(h('span.cp-ico', { html: TURN_SVG[turn] }), h('b', TURN_TEXT[turn]));
        pulseClass(card, 'tick');
        dots.children[k] && dots.children[k].classList.add('on');
        sfx('node', { i: k % 9 });
      }, t);
      t += COMPASS_STEP_MS[r];
      later(() => { card.className = 'cp-card is-gap'; }, t);
      t += COMPASS_GAP_MS;
    });
    later(() => {
      mode = 'ask';
      (chal.local.askAt ||= [])[r] = Math.round(serverNow() - api.game().playStartAt); // E2E: when each question came up
      card.className = 'cp-card is-ask';
      card.replaceChildren(h('b', 'WHICH WAY NOW?'));
      wrap.classList.add('is-asking');
      setDirs(true);
    }, t);
  };
  const answer = d => {
    if (mode !== 'ask' || chal.done) return;
    mode = 'shown';
    const R = s.rounds[r];
    const right = d === R.ans;
    setDirs(false);
    wrap.classList.remove('is-asking');
    btns[R.ans].classList.add('is-correct');
    if (!right) btns[d].classList.add('is-wrong');
    needle.classList.remove('is-hidden');
    point(R.ans);
    card.className = `cp-card ${right ? 'is-right' : 'is-miss'}`;
    card.replaceChildren(h('b', right ? 'CORRECT' : `IT WAS ${DIR_NAME[COMPASS_DIRS[R.ans]]}`));
    api.part(right);
    r = chal.p;
    if (!chal.done) later(round, COMPASS_FLASH_MS);
  };
  api.key = e => {
    const k = { arrowup: 0, n: 0, arrowright: 1, e: 1, arrowdown: 2, s: 2, arrowleft: 3, w: 3 }[e.key.toLowerCase()];
    if (k != null) { e.preventDefault(); answer(k); }
  };
  wrap.append(title, card, dots, h('div.cp-grid', btns[0], btns[3], rose, btns[1], btns[2]));
  later(round, 350);
  return { el: wrap, destroy() { timers.forEach(clearTimeout); api.key = null; } };
}
