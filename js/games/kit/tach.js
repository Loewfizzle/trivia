// THE TACH TIMER (OC1 — docs/cartridge.md D9, the kit: `gk-`). A row of slanted segments that FILL as the clock runs (a tachometer climbing
// to the red line), on serverNow() — every phone the same, a refresh lands at the right segment. The last `hotMs` (3 s) go WHITE-HOT (a
// pre-rendered layer fading in — opacity only) and the screen's EDGES tint (`tach.edge`: a fixed layer the game appends at its root — a static
// inset glow whose OPACITY animates); the tick cue speeds up (`onTick('tick' | 'urgent' | 'up', sec)` — the game plays its own sounds).
// 60 fps: one rAF loop that reads the clock only (never layout); a segment changes class only when it lights. Reduced motion: no pulse.
//   createTach({ now: serverNow, segments: 20, hotMs: 3000, tickFrom: 5, label: true, onTick }) → { el, edge, set(endsAt, totalMs), stop(), destroy() }
//   `now` is REQUIRED — the game passes firebase.js#serverNow (never Date.now: every phone shares one clock). The module imports no
//   firebase itself, so its pure part loads in node.
//   tachState(leftMs, totalMs, segments, hotMs) → { lit, hot, sec, frac } (PURE — tests/kit-oc1.test.mjs)
import { h } from '../../ui/dom.js';

export function tachState(left, total, segments = 20, hotMs = 3000) {
  const T = Math.max(1, total || 1), L = Math.max(0, Math.min(T, left || 0));
  const frac = 1 - L / T;                                        // 0 → 1 as the time runs out
  const lit = L <= 0 ? segments : Math.min(segments, Math.floor(frac * segments + 1e-9));
  return { lit, hot: L > 0 && L <= hotMs, sec: Math.ceil(L / 1000), frac, done: L <= 0 };
}

export function createTach({ now, segments = 20, hotMs = 3000, tickFrom = 5, label = true, onTick = null } = {}) {
  if (typeof now !== 'function') throw new Error('createTach: pass now (firebase.js#serverNow)');
  const segs = Array.from({ length: segments }, (_, i) => h('i.gk-tach-seg', { class: i >= segments - Math.max(2, Math.round(segments * 0.15)) ? 'is-red' : null },
    h('b.gk-tach-on')));
  const hot = h('span.gk-tach-hot', { 'aria-hidden': 'true' });
  const num = label ? h('span.gk-tach-num', '') : null;
  const el = h('div.gk-tach', { role: 'timer', 'aria-label': 'Time left' }, h('div.gk-tach-row', segs, hot), num);
  const edge = h('div.gk-edge', { 'aria-hidden': 'true' });
  let endsAt = 0, total = 1, raf = 0, lit = -1, wasHot = null, lastSec = -1, running = false;
  const frame = () => {
    raf = 0;
    const left = endsAt - now();
    const s = tachState(left, total, segments, hotMs);
    if (s.lit !== lit) {
      for (let i = 0; i < segments; i++) { const on = i < s.lit; if ((i < lit) !== on || lit < 0) segs[i].classList.toggle('is-lit', on); }
      lit = s.lit;
    }
    if (s.hot !== wasHot) { wasHot = s.hot; el.classList.toggle('is-hot', s.hot); edge.classList.toggle('is-on', s.hot); }
    if (s.sec !== lastSec) {
      const first = lastSec === -1;
      lastSec = s.sec;
      if (num) num.textContent = String(s.sec);
      el.classList.toggle('is-done', s.done);
      if (!first && onTick) {
        if (s.done) onTick('up', 0);
        else if (s.sec * 1000 <= hotMs) onTick('urgent', s.sec);
        else if (s.sec <= tickFrom) onTick('tick', s.sec);
      }
    }
    if (running && left > -200) raf = requestAnimationFrame(frame);
  };
  return {
    el, edge,
    /** run toward endsAt (server ms) over totalMs; the same pair again is a no-op */
    set(e, t) {
      if (e === endsAt && t === total && running) return;
      endsAt = e; total = Math.max(1, t || 1); lastSec = -1; lit = -1; wasHot = null; running = true;
      cancelAnimationFrame(raf); frame();
    },
    stop() { running = false; cancelAnimationFrame(raf); raf = 0; edge.classList.remove('is-on'); el.classList.remove('is-hot'); },
    destroy() { this.stop(); edge.remove(); },
  };
}
