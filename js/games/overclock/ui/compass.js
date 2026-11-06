// OVERCLOCK — COMPASS: follow the turns in your head, tap the final heading. OC4 — THE OVERDRIVE LOOK (docs/overclock.md "Challenge looks"):
//   a GLASS RING with four big N / E / S / W buttons round it, a glowing ORANGE ARROW in its middle (an HTML-wrapped neon arrow — it turns by
//   a transform), the heading card in bold ("YOU'RE FACING NORTH" → each turn → "WHICH WAY NOW?"), a step pip per turn. Right = the button
//   glows green, wrong = red + the real-glass crack (no ✓ / ✕ — the owner, Nov 6); the arrow then sweeps to the right heading. Your answer is
//   kept for THE ANSWER (api.pick). Rules + timings unchanged (COMPASS_START_MS · COMPASS_STEP_MS · COMPASS_GAP_MS · COMPASS_FLASH_MS).
// A challenge screen: (spec, api) → { el, destroy? }. api: chal, part(), progress(), step(), finish(), key, game(), fx(), pick(), sfx() — view.js.
import { h, pulseClass } from '../../../ui/dom.js';
import { sfx } from '../../../audio/sfx.js';
import { serverNow } from '../../../firebase.js';
import { COMPASS_DIRS, COMPASS_STEP_MS, COMPASS_GAP_MS, COMPASS_START_MS, COMPASS_FLASH_MS } from '../challenges.js';
import { DIR_NAME, TURN_TEXT, TURN_SVG, fastButton } from '../shared.js';

// the ring: a glass dial with ticks (static), the arrow: a neon tube arrow (static SVG; its HTML wrapper turns)
export const RING_SVG = (() => {
  const p = (r, a) => { const t = (a * Math.PI) / 180; return [(100 + r * Math.sin(t)).toFixed(1), (100 - r * Math.cos(t)).toFixed(1)]; };
  const ticks = [];
  for (let a = 0; a < 360; a += 15) {
    const big = a % 90 === 0;
    const [x1, y1] = p(90, a), [x2, y2] = p(big ? 76 : 83, a);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${big ? '#9aa3b8' : '#4a5263'}" stroke-width="${big ? 4 : 2}" stroke-linecap="round"/>`);
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="none" stroke="#3a4253" stroke-width="5"/><circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1.5"/><circle cx="100" cy="100" r="66" fill="none" stroke="#252b37" stroke-width="2"/>${ticks.join('')}</svg>`;
})();
const ARROW_D = 'M100 30L126 104H110V158H90V104H74Z';
export const ARROW_SVG = `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="${ARROW_D}" fill="none" stroke="#ff6a1a" stroke-width="22" stroke-opacity="0.22" stroke-linejoin="round"/><path d="${ARROW_D}" fill="rgba(255,106,26,0.18)" stroke="#ff7a2e" stroke-width="9" stroke-linejoin="round"/><path d="${ARROW_D}" fill="none" stroke="#fff3e6" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="104" r="9" fill="#fff3e6"/></svg>`;
/** the dial: the ring + the arrow (its wrapper turned with `point(dir)`) — shared with the demo + THE ANSWER */
export function compassDial(cls = '') {
  const arrow = h('i.oc-cp-arrow', { html: ARROW_SVG });
  const el = h(`div.oc-cp-dial${cls}`, { 'aria-hidden': 'true' }, h('i.oc-cp-glass'), h('i.oc-cp-ring', { html: RING_SVG }), arrow);
  let rot = 0;
  return {
    el, arrow,
    /** turn the arrow the short way to heading d (0 N · 1 E · 2 S · 3 W) */
    point(d) { rot += ((((d * 90 - rot) % 360) + 540) % 360) - 180; arrow.style.transform = `rotate(${rot}deg)`; },
    set(deg) { rot = deg; arrow.style.transform = `rotate(${rot}deg)`; },
  };
}

export default function uiCompass(s, api) {
  const { chal } = api;
  const wrap = h('div.ch.oc-cp.oc-ownbar');
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  let r = chal.p;
  let mode = 'idle';
  const dial = compassDial();
  const card = h('div.oc-cp-card');
  const dots = h('div.oc-cp-dots');
  const qn = h('b', String(r + 1));
  const turnsK = h('span.oc-cp-k');
  const segs = s.rounds.map(() => h('i'));
  const bar = h('div.oc-segbar.oc-cp-bar', { 'aria-hidden': 'true' }, segs);
  const btns = COMPASS_DIRS.map((d, i) => fastButton(`button.oc-cp-dir.oc-cp-${d.toLowerCase()}`, { disabled: true, 'aria-label': DIR_NAME[d] },
    () => answer(i), h('span.oc-tile-face'), h('span.oc-tile-ok'), h('span.oc-tile-bad'), h('b', d)));
  const paintBar = () => segs.forEach((g, i) => { g.className = i < chal.p ? 'is-on' : i === chal.p ? 'is-cur' : ''; });
  const setDirs = on => btns.forEach(b => { b.disabled = !on; b.classList.remove('is-right', 'is-wrong', 'is-dim'); b.querySelectorAll('.oc-gc').forEach(n => n.remove()); });
  const round = () => {
    if (chal.done || r >= s.rounds.length) return;
    const R = s.rounds[r];
    mode = 'start';
    qn.textContent = String(r + 1);
    turnsK.textContent = `${R.turns.length} TURNS`;
    setDirs(false);
    wrap.classList.remove('is-asking');
    dial.el.classList.remove('is-hidden-arrow');
    dial.point(R.start);
    card.className = 'oc-cp-card is-start';
    card.replaceChildren(h('small', 'YOU’RE FACING'), h('b', DIR_NAME[COMPASS_DIRS[R.start]]));
    pulseClass(card, 'is-tick');
    dots.replaceChildren(...[...R.turns].map(() => h('i')));
    paintBar();
    sfx('select');
    let t = COMPASS_START_MS[r];
    [...R.turns].forEach((turn, k) => {
      later(() => {
        mode = 'turns';
        dial.el.classList.add('is-hidden-arrow');
        card.className = 'oc-cp-card is-turn';
        card.replaceChildren(h('span.oc-cp-ico', { html: TURN_SVG[turn] }), h('b', TURN_TEXT[turn]));
        pulseClass(card, 'is-tick');
        dots.children[k] && dots.children[k].classList.add('is-on');
        sfx('node', { i: k % 9 });
      }, t);
      t += COMPASS_STEP_MS[r];
      later(() => { card.className = 'oc-cp-card is-gap'; }, t);
      t += COMPASS_GAP_MS;
    });
    later(() => {
      mode = 'ask';
      (chal.local.askAt ||= [])[r] = Math.round(serverNow() - api.game().playStartAt); // E2E: when each question came up
      card.className = 'oc-cp-card is-ask';
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
    if (api.pick) api.pick(r, d);   // (OC4 — THE ANSWER shows your heading per round)
    setDirs(false);
    wrap.classList.remove('is-asking');
    btns[R.ans].classList.add('is-right');
    if (!right) btns[d].classList.add('is-wrong');
    btns.forEach((b, i) => { if (i !== R.ans && i !== d) b.classList.add('is-dim'); });
    if (api.fx) api.fx(btns[d], right, { k: d });
    dial.el.classList.remove('is-hidden-arrow');
    dial.point(R.ans);
    card.className = `oc-cp-card ${right ? 'is-right' : 'is-miss'}`;
    card.replaceChildren(h('b', right ? 'CORRECT' : `IT WAS ${DIR_NAME[COMPASS_DIRS[R.ans]]}`));
    api.part(right);
    r = chal.p;
    paintBar();
    if (!chal.done) later(round, COMPASS_FLASH_MS);
  };
  api.key = e => {
    const k = { arrowup: 0, n: 0, arrowright: 1, e: 1, arrowdown: 2, s: 2, arrowleft: 3, w: 3 }[e.key.toLowerCase()];
    if (k != null) { e.preventDefault(); answer(k); }
  };
  wrap.append(
    h('div.oc-qhead', h('span.oc-chip', 'ROUND ', qn, ` / ${s.rounds.length}`), turnsK),
    bar, card, dots,
    h('div.oc-cp-grid', btns[0], btns[3], dial.el, btns[1], btns[2]));
  later(round, 350);
  return { el: wrap, destroy() { timers.forEach(clearTimeout); api.key = null; } };
}
