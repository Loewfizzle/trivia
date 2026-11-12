// Match kit — quality tiers (2 high / 1 mid / 0 low) from measured frame pacing.
// Steps down when the p75 frame time > 19.5 ms; steps back up after 8 s of p75 < 17.2 ms with < 6 ms of work a frame
// (never back to a tier that failed). The same rule every renderer in the app uses.
//
//   const tiers = createTiers({ apply: t => { scene.setTier(t); sky.setTier(t); } });
//   frame: const w0 = performance.now(); …draw…; tiers.sample(now, performance.now() - w0); tiers.tick(now);
//   tiers.get() / tiers.set(t) (tests) / tiers.fps() / tiers.work()
/**
 * FR7 FIXES A — PD6, A CAPPED FRAME RATE IS NOT A SLOW PHONE (the city's rule since NEON PASS 5 — screens/harbor/scene-perf.js): iOS Low Power
 * Mode runs requestAnimationFrame at 30 Hz however light the page is, so the frames read ~33 ms and a tier rule stepped all the way down for
 * nothing. A step down is a PROBE: CAP_PROBE_MS later, if the frames didn't get faster (the median interval still ≥ 85 % of before) it was the
 * phone's cap → back up, and no more steps for frame timing (only real work — `CAP_WORK_MS` a frame — still steps it down). PURE.
 */
export const CAP_PROBE_MS = 4000, CAP_WORK_MS = 12;
export const capProbeSaysCapped = (beforeP50, nowP50) => Number(nowP50) >= Number(beforeP50) * 0.85;
export const quantile = (a, p) => { const x = [...a].sort((m, n) => m - n); return x[Math.floor(x.length * p)] ?? 99; };

export function createTiers({ apply, initial = 2, max = 2, window = 120, minSamples = 90 } = {}) {
  let tier = initial, cool = 0, failed = -1, goodSince = 0, lastFrame = 0, probe = null, capped = false;
  const frames = [], works = [];
  const q = quantile;
  const set = t => { tier = Math.max(0, Math.min(max, t)); if (apply) apply(tier); frames.length = 0; works.length = 0; };
  return {
    /** Call once per frame: `now` = the rAF timestamp, `work` = CPU ms spent in this frame. */
    sample(now, work) {
      if (lastFrame) { frames.push(now - lastFrame); if (frames.length > window) frames.shift(); }
      lastFrame = now;
      works.push(work); if (works.length > window) works.shift();
    },
    /** Pass your own frame-time array if the renderer keeps one (e.g. scene.fps). */
    tick(now, frameTimes = frames) {
      // (PD6: the probe's verdict — the step down gave nothing = the phone's cap: back up, and timing alone never steps it down again)
      if (probe && now - probe.at > CAP_PROBE_MS && frameTimes.length >= 20) {
        const back = probe.from;
        if (capProbeSaysCapped(probe.p50, q(frameTimes, 0.5))) { capped = true; probe = null; failed = -1; set(back); cool = now + 2500; goodSince = 0; return; }
        probe = null;
      }
      if (frameTimes.length < minSamples || now < cool) return;
      const p75 = q(frameTimes, 0.75), work = q(works, 0.75);
      if (p75 > 19.5 && tier > 0) {
        if (capped && work <= CAP_WORK_MS) return;
        if (!capped && !probe) probe = { from: tier, p50: q(frameTimes, 0.5), at: now };
        failed = tier; set(tier - 1); cool = now + 2500; goodSince = 0; return;
      }
      if (p75 < 17.2 && work < 6 && tier < max && tier + 1 !== failed) {
        if (!goodSince) goodSince = now;
        else if (now - goodSince > 8000) { set(tier + 1); cool = now + 4000; goodSince = 0; }
      } else goodSince = 0;
    },
    set, get: () => tier, capped: () => capped,
    fps: () => frames.slice(), work: () => works.slice(),
    reset() { frames.length = 0; works.length = 0; lastFrame = 0; },
  };
}
