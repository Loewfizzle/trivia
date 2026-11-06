// THE TITLE SLAM + 3-2-1 (OC1 — docs/cartridge.md D9, the kit: `gk-`). Between challenges: the challenge's NAME slams in on a slanted card
// with a motion-blur swipe across it, the rules card under it the first time a type appears, then 3 · 2 · 1 STAMP in and GO — all INSIDE
// the phase the director already gives it (OVERCLOCK: READY_MS 3.2 s, or BRIEF_MS 7 s with the rules — the owner's timings, never
// stretched). Timed from the phase's server-time start + end: a refresh mid-way lands on the right number, and the slam itself only plays
// when the card is seen from its start (a late mount shows it settled). Transform + opacity only; reduced motion = no slam, no swipe.
//   createSlam({ now, startAt, endsAt, kicker, name, sub, rules: [], tone: 'hot' | 'final', onIntro(), onCount('3'|'2'|'1'|'GO') })
//     → { el, destroy() }     (`now` REQUIRED — firebase.js#serverNow)
//   slamPhase(now, startAt, endsAt) → { slam, count } (PURE)
import { h, reducedMotion } from '../../ui/dom.js';

export const SLAM_MS = 520;        // the card's slam (its CSS animation runs this long)
export const SLAM_LATE_MS = 350;   // mounted later than this into the phase → shown settled, no slam
export const GO_HOLD_MS = 450;

export function slamPhase(now, startAt, endsAt) {
  const t = now - startAt, left = endsAt - now;
  const count = left > 3000 ? '' : left > 0 ? String(Math.ceil(left / 1000)) : left > -GO_HOLD_MS ? 'GO' : '';
  return { slam: t < SLAM_LATE_MS, count, t, left };
}

export function createSlam({ now, startAt, endsAt, kicker = '', name = '', sub = '', rules = [], tone = 'hot', onIntro = null, onCount = null } = {}) {
  if (typeof now !== 'function') throw new Error('createSlam: pass now (firebase.js#serverNow)');
  const p0 = slamPhase(now(), startAt, endsAt);
  const quiet = reducedMotion();
  const count = h('div.gk-slam-count', { 'aria-live': 'assertive' });
  const card = h('div.gk-slam-card',
    h('span.gk-slam-plate'),
    quiet ? null : h('span.gk-slam-swipe', { 'aria-hidden': 'true' }),
    h('span.gk-slam-name', { 'data-text': name }, name),
    sub ? h('span.gk-slam-sub', sub) : null);
  const el = h('div.gk-slam', { class: [`is-${tone}`, p0.slam && !quiet ? 'is-slam' : 'is-settled', rules && rules.length ? 'has-rules' : ''].join(' ') },
    kicker ? h('div.gk-slam-kicker', kicker) : null,
    card,
    rules && rules.length ? h('ol.gk-slam-rules', rules.map((r, i) => h('li', { style: { '--i': i } }, r))) : null,
    count);
  if (p0.slam && onIntro) onIntro();
  let raf = 0, last = null, gone = false;
  const tick = () => {
    raf = 0;
    if (gone) return;
    const p = slamPhase(now(), startAt, endsAt);
    if (p.count !== last) {
      const first = last === null;
      last = p.count;
      count.replaceChildren(p.count ? h('span.gk-stamp', { class: p.count === 'GO' ? 'is-go' : null }, p.count) : '');
      if (!first && p.count && onCount) onCount(p.count);
      else if (first && p.count && p.left > 2700 && onCount) onCount(p.count);   // a mount right on "3"
    }
    if (p.left > -GO_HOLD_MS - 100) raf = requestAnimationFrame(tick);
  };
  tick();
  return { el, destroy() { gone = true; cancelAnimationFrame(raf); } };
}
