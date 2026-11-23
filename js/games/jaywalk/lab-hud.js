// JAYWALK LAB — THE FRAME METER (SMOOTH, `&hud=1` — docs/jaywalk.md "SMOOTH"): the owner's proof tool on the real iPhone. Lazy, the lab's only:
// never the live game, never the start bundle (tests/jaywalk-smooth.test.mjs). It judges DROPPED + WORST frames, never the median alone.
import { h } from '../../ui/dom.js';

import { DROP_MS, BIG_MS, frameStats, dropKinds } from './lab-hud-stats.js';
export { DROP_MS, BIG_MS, frameStats, dropKinds };
// (SMOOTH 2: the text repaints once a second and never during a 10 S TEST, in its own compositor layer: the meter must not cause what it measures)
const RING = 1500, PAINT_MS = 1000, TEST_MS = 10000, KEEP = 3;

/** the summary line a 10 s test leaves on screen */
export const testLine = (s, w, k = { late: 0, bigJs: 0 }) => `${s.drops} DROPS ${s.big} BIG · W ${s.worst.toFixed(0)}\n${k.late} LATE · JS ${k.bigJs} · T${w.tier}${w.sun ? ' SUN' : ''}${w.smooth ? '' : ' OLD'}${w.blendOld ? ' B-OLD' : ''}`;

/** read() → { tier, dpr, sun, loading, changes, smooth } (the lab's) */
export function createFrameMeter(parent, read) {
  const at = new Float64Array(RING), dts = new Float32Array(RING);
  let n = 0, head = 0, paintAt = 0, testFrom = 0, test = null, testW = null, last = 0;
  const big = h('div.jw-m-big', '—'), l1 = h('div.jw-m-l'), l2 = h('div.jw-m-l'), l3 = h('div.jw-m-l'), l4 = h('div.jw-m-l'), res = h('div.jw-m-res');
  const btn = h('button.jw-m-btn', { type: 'button', 'aria-label': 'Record a ten second test' }, '10 S TEST');
  const box = h('div.jw-meter', big, l1, l2, l3, l4, btn, res);
  const results = [];
  const stop = e => e.stopPropagation();
  for (const ev of ['pointerdown', 'touchstart']) box.addEventListener(ev, stop, { passive: true });
  let pid = null;
  btn.addEventListener('pointerdown', e => { pid = e.pointerId; e.stopPropagation(); });
  btn.addEventListener('pointerup', e => { e.stopPropagation(); if (pid === e.pointerId) { pid = null; start(); } });
  btn.addEventListener('pointercancel', () => { pid = null; });
  parent.append(box);
  function start() { if (test) return; test = []; testW = []; testFrom = 0; btn.textContent = 'RECORDING 10'; btn.classList.add('is-on'); }
  function finish() {
    const s = frameStats(test), w = read(), k = dropKinds(test, testW);
    results.unshift(testLine(s, w, k)); results.length = Math.min(results.length, KEEP);
    res.textContent = results.join('\n'); test = null; testW = null; paintAt = 0;
    btn.textContent = '10 S TEST'; btn.classList.remove('is-on');
    api.last = { ...s, ...w, ...k };
  }
  function paint(now) {
    const from = now - 10000, L = [];
    for (let k = 0; k < n; k++) { const i = (head - 1 - k + RING) % RING; if (at[i] < from) break; L.push(dts[i]); }
    const s = frameStats(L), w = read();
    big.textContent = `${s.fps.toFixed(0)} FPS`;
    l1.textContent = `10 S DROPS ${s.drops} · BIG ${s.big}`;
    l2.textContent = `p95 ${s.p95.toFixed(0)} · WORST ${s.worst.toFixed(0)} ms`;
    l3.textContent = `T${w.tier} @${w.dpr} · SUN ${w.sun ? 'ON' : 'OFF'}${w.smooth ? '' : ' · OLD'}${w.blendOld ? ' · B-OLD' : ''}`;
    l4.textContent = `LOAD ${w.loading ? 'YES' : '—'} · STEPS ${w.changes}`;
    box.classList.toggle('is-drop', s.big > 0);
    api.now = { ...s, ...w };
  }
  const api = {
    el: box, now: null, last: null, start,
    /** once a frame, from the lab's loop: the rAF timestamp + the JS work of the frame before it (ms) */
    frame(now, work = 0) {
      if (last) {
        const dt = now - last;
        if (dt < 250) {   // (a hidden tab / a paused sheet is no dropped frame)
          at[head] = now; dts[head] = dt; head = (head + 1) % RING; if (n < RING) n++;
          if (test) { if (!testFrom) testFrom = now; test.push(dt); testW.push(work); const left = Math.ceil((TEST_MS - (now - testFrom)) / 1000); if (left > 0 && btn.dataset.left !== String(left)) { btn.dataset.left = String(left); btn.textContent = `RECORDING ${left}`; } if (now - testFrom >= TEST_MS) finish(); }
        }
      }
      last = now;
      if (!test && now - paintAt >= PAINT_MS) { paintAt = now; paint(now); }
    },
    /** a hidden page: the gap is not a drop */
    gap() { last = 0; },
    destroy() { box.remove(); },
  };
  return api;
}
