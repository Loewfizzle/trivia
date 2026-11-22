// Match kit — quality tiers (2 high / 1 mid / 0 low) from measured frame pacing.
// The long notes: docs/games/jaywalk-notes.md
/**
 * FR7 FIXES A — PD6, A CAPPED FRAME RATE IS NOT A SLOW PHONE (the city's rule since NEON PASS 5 — screens/harbor/scene-perf.js): iOS Low Power
 * Mode runs requestAnimationFrame at 30 Hz however light the page is, so the frames read ~33 ms and a tier rule stepped all the way down for
 * nothing. A step down is a PROBE: CAP_PROBE_MS later, if the frames didn't get faster (the median interval still ≥ 85 % of before) it was the
 * phone's cap → back up, and no more steps for frame timing (only real work — `CAP_WORK_MS` a frame — still steps it down). PURE.
 */
export const CAP_PROBE_MS = 4000, CAP_WORK_MS = 12;
export const capProbeSaysCapped = (beforeP50, nowP50) => Number(nowP50) >= Number(beforeP50) * 0.85;
export const quantile = (a, p) => { const x = [...a].sort((m, n) => m - n); return x[Math.floor(x.length * p)] ?? 99; };

/** in place: the first `n` values of `a`, rising (an insertion sort — 120 samples at most; no list, no comparator made) */
function sortN(a, n) {
  for (let i = 1; i < n; i++) { const v = a[i]; let j = i - 1; while (j >= 0 && a[j] > v) { a[j + 1] = a[j]; j--; } a[j + 1] = v; }
}

/**
 * ZERO GARBAGE (HIGH RISE S4A FIX — the owner's iPhone: one stall a floor, the collector's): the rule is asked from a game's FRAME, so
 * it makes NOTHING while it runs — the samples live in two rings of numbers made once, a quantile is read off a scratch copy sorted in
 * place. (It used to copy + sort its 120 samples three times an asking, each with a comparator of its own.) The rule itself is unchanged.
 */
export function createTiers({ apply, initial = 2, max = 2, window = 120, minSamples = 90 } = {}) {
  let tier = initial, cool = 0, failed = -1, goodSince = 0, lastFrame = 0, capped = false;
  let probeOn = false, probeFrom = 0, probeP50 = 0, probeAt = 0;
  const frames = new Float64Array(window), works = new Float64Array(window), sf = new Float64Array(window), sw = new Float64Array(window);
  let fn = 0, fh = 0, wn = 0, wh = 0;   // (how many are in · where the next one goes)
  const clear = () => { fn = fh = wn = wh = 0; };
  const set = t => { tier = Math.max(0, Math.min(max, t)); if (apply) apply(tier); clear(); };
  /** a ring's values, oldest first, as a plain list (the tests' + a view's own reading — never asked in a frame) */
  const list = (a, n, h) => { const out = []; for (let i = 0; i < n; i++) out.push(a[(h - n + i + window) % window]); return out; };
  return {
    /** Call once per frame: `now` = the rAF timestamp, `work` = CPU ms spent in this frame. */
    sample(now, work) {
      if (lastFrame) { frames[fh] = now - lastFrame; fh = (fh + 1) % window; if (fn < window) fn++; }
      lastFrame = now;
      works[wh] = work; wh = (wh + 1) % window; if (wn < window) wn++;
    },
    /** Pass your own frame-time array if the renderer keeps one (e.g. scene.fps). */
    tick(now, frameTimes) {
      // (a renderer that hands its own list in is read the old way — nobody in a frame does; the ring is read through the scratch)
      const n = frameTimes ? frameTimes.length : fn, probeDue = probeOn && now - probeAt > CAP_PROBE_MS && n >= 20;
      if (!probeDue && (n < minSamples || now < cool)) return;
      let p50, p75;
      if (frameTimes) { p50 = quantile(frameTimes, 0.5); p75 = quantile(frameTimes, 0.75); }
      else { for (let i = 0; i < n; i++) sf[i] = frames[i]; sortN(sf, n); p50 = n ? sf[Math.floor(n * 0.5)] : 99; p75 = n ? sf[Math.floor(n * 0.75)] : 99; }
      // (PD6: the probe's verdict — the step down gave nothing = the phone's cap: back up, and timing alone never steps it down again)
      if (probeDue) {
        const back = probeFrom;
        if (capProbeSaysCapped(probeP50, p50)) { capped = true; probeOn = false; failed = -1; set(back); cool = now + 2500; goodSince = 0; return; }
        probeOn = false;
      }
      if (n < minSamples || now < cool) return;
      for (let i = 0; i < wn; i++) sw[i] = works[i];
      sortN(sw, wn);
      const work = wn ? sw[Math.floor(wn * 0.75)] : 99;
      if (p75 > 19.5 && tier > 0) {
        if (capped && work <= CAP_WORK_MS) return;
        if (!capped && !probeOn) { probeOn = true; probeFrom = tier; probeP50 = p50; probeAt = now; }
        failed = tier; set(tier - 1); cool = now + 2500; goodSince = 0; return;
      }
      if (p75 < 17.2 && work < 6 && tier < max && tier + 1 !== failed) {
        if (!goodSince) goodSince = now;
        else if (now - goodSince > 8000) { set(tier + 1); cool = now + 4000; goodSince = 0; }
      } else goodSince = 0;
    },
    set, get: () => tier, capped: () => capped,
    fps: () => list(frames, fn, fh), work: () => list(works, wn, wh),
    reset() { clear(); lastFrame = 0; },
  };
}
