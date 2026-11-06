// OVERCLOCK — THE OVERDRIVE FEEDBACK + THE COMBO METER (OC1 — docs/overclock.md "Look"). Visual + sound only (no vibration on iPhone web).
//   RIGHT: the tile bursts (a pre-rendered ring scales out) + sparks stream into the score (each spark one transform animation); the tile then
//          RESTS with the --good edge + a soft inner glow + the ✓ in its socket (css .oc-tile-ok — a static layer, its opacity eases in).
//   WRONG: never flat red (OC2 — the owner's ADD-ON 5): the tile stays DARK GLASS + a red EDGE FLASH + glowing hairline CRACKS + a shake, then
//          RESTS dark with a red edge / tint + the ✕ in its dark-glass socket (css .oc-tile-bad); the screen's red edge + a small KICK.
//   THE COMBO: right answers in a row across the match (logic.js#comboFold — the game's combo/{uid} + this challenge's marks). The meter is
//   HIDDEN at ×0 / ×1 and appears from ×2 (OC2). THE CUES NEVER BLOCK PLAY (OC2 — the owner, after playing OC1: the old OVERDRIVE banner
//   covered the answers + lingered): x4 OVERDRIVE + x10 live ONLY in the header band + on the screen's very edges — THE METER ITSELF IGNITES
//   (it slams up a size, OVERDRIVE inside it, a hot flare) while a light STREAK sweeps the top edge + both side edges; pointer-events none
//   everywhere; ≤ CUE_MS; one flare per milestone (a new one restarts it — never stacked); then the meter simply STAYS lit (a steady glow)
//   while the streak lasts. NO "card unlocked" text: the cards are the console's reveal after the match (the server replays the record).
// 60 fps: transform + opacity only; every glow a static layer whose opacity / scale animates. Positions are read once per tap (an event,
// never a frame loop). Reduced motion: no sparks, no shake, no kick, no slam, no streak — the colors, marks and the lit meter still say it.
import { h, reducedMotion } from '../../ui/dom.js';
import { ocSfx } from './sfx.js';

export const OD_AT = 4;      // OVERDRIVE: the meter ignites
export const X10_AT = 10;    // the white-hot flare (gameplay polish — it unlocks nothing)
export const SHOW_AT = 2;    // the meter shows from ×2 (hidden at ×0 / ×1 — OC2)
export const CUE_MS = 760;   // a cue's whole length (the owner: ≤ ~0.8 s)
const SPARKS = 9;

/** a class re-trigger (on a tap / an answer — one reflow, never in a frame loop) */
const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

/** the combo meter: COMBO ×n + four pips toward OVERDRIVE (hidden below ×2) */
export function createCombo() {
  const n = h('b.oc-combo-n', '×0');
  const pips = Array.from({ length: OD_AT }, () => h('i'));
  const el = h('div.oc-combo', { 'aria-live': 'polite' },
    h('span.oc-combo-glow', { 'aria-hidden': 'true' }), h('span.oc-combo-flare', { 'aria-hidden': 'true' }),
    h('span.oc-combo-k', 'COMBO'), n, h('span.oc-combo-pips', pips), h('span.oc-combo-od', 'OVERDRIVE'));
  let cur = -1, cueT = 0;
  const clearCue = () => el.classList.remove('is-ignite', 'is-ignite-od', 'is-ignite-10');
  return {
    el,
    get value() { return Math.max(0, cur); },
    /** → what crossed: { up, hitOD, hit10 } (silent on the first set — a refresh never replays a moment) */
    set(v) {
      const prev = cur;
      cur = Math.max(0, v | 0);
      n.textContent = `×${cur}`;
      pips.forEach((p, i) => p.classList.toggle('is-on', i < Math.min(cur, OD_AT)));
      const wasLive = el.classList.contains('is-live');
      el.classList.toggle('is-live', cur >= SHOW_AT);
      el.classList.toggle('is-od', cur >= OD_AT);
      el.classList.toggle('is-x10', cur >= X10_AT);
      if (cur < SHOW_AT) { clearTimeout(cueT); clearCue(); }
      if (prev < 0) return { up: false, hitOD: false, hit10: false };
      const up = cur > prev;
      const hitOD = prev < OD_AT && cur >= OD_AT, hit10 = prev < X10_AT && cur >= X10_AT;
      if (up && !hitOD && !hit10 && cur >= SHOW_AT && !reducedMotion()) replay(el, wasLive ? 'is-pop' : 'is-in');
      return { up, hitOD, hit10 };
    },
    /** THE IGNITION (x4 'od' / x10 'x10'): the meter slams up a size + flares, ≤ CUE_MS, then it stays lit (.is-od). A new one restarts it. */
    ignite(kind = 'od') {
      clearTimeout(cueT);
      el.classList.remove('is-pop', 'is-in');
      clearCue();
      if (reducedMotion()) return;
      void el.offsetWidth;
      el.classList.add('is-ignite', kind === 'x10' ? 'is-ignite-10' : 'is-ignite-od');
      cueT = setTimeout(clearCue, CUE_MS);
    },
    /** true while a cue runs (the E2E taps an answer during it) */
    get cueing() { return el.classList.contains('is-ignite'); },
    destroy() { clearTimeout(cueT); },
  };
}

/** the sound of a combo step */
export function comboSound(n) {
  if (n >= 4) ocSfx('combo5'); else if (n === 3) ocSfx('combo3'); else if (n === 2) ocSfx('combo2');
}

// hairline cracks: a soft red glow stroke (the pre-rendered glow) under a thin white-hot core — drawn once, only their opacity animates
const CRACK_D = 'M52 0 L47 11 L56 17 L44 27 L50 40 M47 11 L33 7 L24 12 M56 17 L71 13 L82 20 L90 17 M44 27 L29 31 M71 13 L74 4';
const CRACK = `<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path class="oc-crack-glow" d="${CRACK_D}"/><path class="oc-crack-core" d="${CRACK_D}"/></svg>`;

/** the full-screen feedback layer (the view appends `el` once; everything inside is pointer-events: none) */
export function createFx(root) {
  const red = h('i.oc-fx-red');
  // THE STREAK (x4 / x10): a hot light sweeping the screen's top edge + both side edges — thin pre-rendered bars on the very edge, each one
  // transform animation (they live in the gutter: never over the question or a tile)
  const streak = h('div.oc-fx-streak', h('i.oc-fx-st-top'), h('i.oc-fx-st-l'), h('i.oc-fx-st-r'));
  const el = h('div.oc-fx', { 'aria-hidden': 'true' }, red, streak);
  let streakT = 0;
  return {
    el,
    /** a right answer on this tile: the burst + the sparks into `target` (the score) */
    right(tile, target) {
      if (tile) { tile.append(h('i.oc-ring')); replay(tile, 'oc-burst'); }
      if (!tile || !target || reducedMotion()) return;
      const a = tile.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
      for (let i = 0; i < SPARKS; i++) {
        const s = h('i.oc-spark');
        el.append(s);
        const sx = x0 + (i - (SPARKS - 1) / 2) * (a.width / (SPARKS + 1)), mx = (sx + x1) / 2 + (i % 2 ? 40 : -40), my = Math.min(y0, y1) - 30 - (i % 3) * 18;
        const anim = s.animate([
          { transform: `translate(${sx}px, ${y0}px) scale(1)`, opacity: 1 },
          { transform: `translate(${mx}px, ${my}px) scale(0.9)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x1}px, ${y1}px) scale(0.4)`, opacity: 0.2 },
        ], { duration: 520 + i * 24, delay: i * 18, easing: 'cubic-bezier(0.3, 0.1, 0.4, 1)', fill: 'both' });
        anim.onfinish = () => s.remove();
      }
      setTimeout(() => { if (target.isConnected) replay(target, 'oc-bump'); }, 520);
    },
    /** a wrong answer on this tile (or none): the cracks (under the text) + the shake, the screen's red edge, the kick */
    wrong(tile) {
      if (tile) {
        const c = h('i.oc-crack');
        c.innerHTML = CRACK;
        const under = tile.querySelector('.oc-tile-bad') || tile.querySelector('.oc-tile-face');
        if (under) under.after(c); else tile.append(c);
        if (!reducedMotion()) replay(tile, 'oc-shake');
      }
      replay(red, 'is-on');
      if (!reducedMotion() && root) root.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(-5px, 2px)' }, { transform: 'translate(4px, -2px)' }, { transform: 'translate(-2px, 1px)' }, { transform: 'translate(0, 0)' }], { duration: 260, easing: 'ease-out' });
    },
    /** x4 / x10: the edge streak (the meter's own ignition is combo.ignite) — ≤ CUE_MS, one at a time */
    streak(kind = 'od') {
      clearTimeout(streakT);
      streak.classList.remove('is-on', 'is-10');
      if (reducedMotion()) return;
      void streak.offsetWidth;
      streak.classList.add('is-on');
      if (kind === 'x10') streak.classList.add('is-10');
      streakT = setTimeout(() => streak.classList.remove('is-on', 'is-10'), CUE_MS);
    },
    destroy() { clearTimeout(streakT); el.remove(); },
  };
}
