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

/**
 * JAYWALK SMOOTH — THE STUTTER RULE (opt-in: `createTiers({ stutter: true })`; a game that doesn't ask keeps the rule above, step for step).
 * ≥ `count` dropped frames in the last `span` ms, seen again `again` ms later (one burst — a load, a banner — never counts), steps down, though the p75 looks fine. A dropped frame is judged against the phone's OWN
 * cadence (past `ms` AND `over` × its median), so a steady 30 Hz Low Power cap counts none. The step is a PROBE: CAP_PROBE_MS later, if the
 * drops did not fall below `helped` of what they were, the tier was not the cause → back up, and this rule stays off for the page (no flapping).
 */
export const STUTTER = Object.freeze({ ms: 25, over: 1.5, count: 6, span: 2000, again: 3000, helped: 0.6 });
/** PURE, makes nothing: the dropped frames in the newest `span` ms of a ring (`head` = where the next value goes) */
export function dropsIn(a, n, head, size, p50) {
  const line = Math.max(STUTTER.ms, p50 * STUTTER.over);
  let c = 0, sum = 0;
  for (let k = 1; k <= n && sum < STUTTER.span; k++) { const v = a[(head - k + size) % size]; sum += v; if (v > line) c++; }
  return c;
}

/** in place: the first `n` values of `a`, rising (an insertion sort — 120 samples at most; no list, no comparator made) */
function sortN(a, n) {
  for (let i = 1; i < n; i++) { const v = a[i]; let j = i - 1; while (j >= 0 && a[j] > v) { a[j + 1] = a[j]; j--; } a[j + 1] = v; }
}

/**
 * ZERO GARBAGE (HIGH RISE S4A FIX — the owner's iPhone: one stall a floor, the collector's): the rule is asked from a game's FRAME, so
 * it makes NOTHING while it runs — the samples live in two rings of numbers made once, a quantile is read off a scratch copy sorted in
 * place. (It used to copy + sort its 120 samples three times an asking, each with a comparator of its own.) The rule itself is unchanged.
 */
/**
 * JAYWALK LAST MILE — TIER SWITCHES ONLY AT QUIET MOMENTS (opt-in: `createTiers({ quiet: () => bool })`; a game that doesn't ask keeps the rule
 * above, step for step). A tier change reallocates the canvas (+ the glow's targets): one big stall. With `quiet`, a step the rule DECIDES in
 * play is only remembered (the rule rests — one decision at a time) and made at the next quiet moment (the start line, a run's end, the final
 * screen: `quiet()` true — the game ticks there too). A still screen is never judged: its samples are dropped when play resumes, and a probe's
 * clock starts there (it compares play with play). `ask(t)` = a step from outside through the same queue; `set(t)` stays at once (a pin).
 */
export function createTiers({ apply, initial = 2, max = 2, window = 120, minSamples = 90, stutter = false, quiet = null } = {}) {
  let tier = initial, cool = 0, failed = -1, goodSince = 0, lastFrame = 0, capped = false;
  let probeOn = false, probeFrom = 0, probeP50 = 0, probeAt = 0;
  let spOn = false, spFrom = 0, spCount = 0, spAt = 0, spFailed = -1, spOff = false, spSeen = 0;   // (THE STUTTER RULE's probe)
  const frames = new Float64Array(window), works = new Float64Array(window), sf = new Float64Array(window), sw = new Float64Array(window);
  let fn = 0, fh = 0, wn = 0, wh = 0;   // (how many are in · where the next one goes)
  const clear = () => { fn = fh = wn = wh = 0; spSeen = 0; };
  const set = t => { tier = Math.max(0, Math.min(max, t)); if (apply) apply(tier); clear(); };
  // (LAST MILE: the decision waiting for a quiet moment — its kind, the numbers its commit needs; all plain numbers, nothing made in a frame)
  let pend = 0, pendTo = 0, pendP50 = 0, pendDrop = 0, wasQuiet = false;
  /** a step the rule decided: 1 the cap probe's "back up" · 2 the stutter probe's · 3 the timing step down · 4 the stutter step down · 5 up · 6 asked */
  function commit(k, now, p50, dropped, to) {
    if (k === 1) { capped = true; probeOn = false; failed = -1; set(probeFrom); cool = now + 2500; goodSince = 0; }
    else if (k === 2) { spOff = true; failed = spFailed; set(spFrom); cool = now + 2500; goodSince = 0; }
    else if (k === 3) { if (!capped && !probeOn) { probeOn = true; probeFrom = tier; probeP50 = p50; probeAt = now; } spOn = false; failed = tier; set(tier - 1); cool = now + 2500; goodSince = 0; }
    else if (k === 4) { spOn = true; spFrom = tier; spCount = dropped; spAt = now; spFailed = failed; failed = tier; set(tier - 1); cool = now + 2500; goodSince = 0; }
    else if (k === 5) { set(tier + 1); cool = now + 4000; goodSince = 0; }
    else { set(to); cool = now + 2500; goodSince = 0; }
  }
  const decide = (k, now, p50, dropped) => { if (quiet && !quiet()) { pend = k; pendP50 = p50; pendDrop = dropped; } else commit(k, now, p50, dropped, 0); };
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
      if (quiet) {
        if (quiet()) { if (pend) { const k = pend; pend = 0; commit(k, now, pendP50, pendDrop, pendTo); } wasQuiet = true; return; }
        // (play resumes: the still screen's samples go, a probe's clock starts here)
        if (wasQuiet) { wasQuiet = false; clear(); if (probeOn) probeAt = now; if (spOn) spAt = now; goodSince = 0; return; }
        if (pend) return;
      }
      const n = frameTimes ? frameTimes.length : fn, probeDue = probeOn && now - probeAt > CAP_PROBE_MS && n >= 20, spDue = spOn && now - spAt > CAP_PROBE_MS && n >= 60;
      if (!probeDue && !spDue && (n < minSamples || now < cool)) return;
      let p50, p75;
      if (frameTimes) { p50 = quantile(frameTimes, 0.5); p75 = quantile(frameTimes, 0.75); }
      else { for (let i = 0; i < n; i++) sf[i] = frames[i]; sortN(sf, n); p50 = n ? sf[Math.floor(n * 0.5)] : 99; p75 = n ? sf[Math.floor(n * 0.75)] : 99; }
      for (let i = 0; i < wn; i++) sw[i] = works[i];
      sortN(sw, wn);
      const work = wn ? sw[Math.floor(wn * 0.75)] : 99;
      // (PD6: the probe's verdict — the step down gave nothing = the phone's cap: back up, and timing alone never steps it down again.
      //  VARIETY B1 — THE SHADOW POPS: only with LIGHT work. A phone whose frames are slow because its CPU is busy (work > CAP_WORK_MS) is
      //  not capped — the probe read it as capped and jumped back to the top tier, and JAYWALK's sun shadows went off · on · off.)
      if (probeDue) {
        if (capProbeSaysCapped(probeP50, p50) && work <= CAP_WORK_MS) { decide(1, now, p50, 0); return; }
        probeOn = false;
      }
      const dropped = !stutter ? 0 : frameTimes ? dropsIn(frameTimes, n, n, n || 1, p50) : dropsIn(frames, fn, fh, window, p50);
      if (spDue) {   // (the step gave nothing: not the tier's cost — back up, and this rule rests for the page)
        spOn = false;
        if (dropped > spCount * STUTTER.helped) { decide(2, now, p50, dropped); return; }
      }
      if (n < minSamples || now < cool) return;
      if (p75 > 19.5 && tier > 0) {
        if (capped && work <= CAP_WORK_MS) return;
        decide(3, now, p50, dropped); return;
      }
      if (stutter && !spOff && !spOn && !probeOn && !capped && tier > 0) {
        if (dropped < STUTTER.count) { if (spSeen && now - spSeen >= STUTTER.again) spSeen = 0; }
        else if (!spSeen || now - spSeen > STUTTER.again * 1.6) spSeen = now;
        else if (now - spSeen >= STUTTER.again) {
          decide(4, now, p50, dropped); return;
        }
      }
      if (p75 < 17.2 && work < 6 && tier < max && tier + 1 !== failed && dropped <= 1) {
        if (!goodSince) goodSince = now;
        else if (now - goodSince > 8000) decide(5, now, p50, dropped);
      } else goodSince = 0;
    },
    set(t) { pend = 0; set(t); }, get: () => tier, capped: () => capped,
    /** (LAST MILE) a step asked from outside: at once on a quiet screen (or with no `quiet`), else at the next quiet moment · what waits (-1 = nothing) */
    ask(t) { if (quiet && !quiet()) { pend = 6; pendTo = t; } else { pend = 0; set(t); } },
    pending: () => (!pend ? -1 : pend === 1 ? probeFrom : pend === 2 ? spFrom : pend === 5 ? Math.min(max, tier + 1) : pend === 6 ? Math.max(0, Math.min(max, pendTo)) : Math.max(0, tier - 1)),
    fps: () => list(frames, fn, fh), work: () => list(works, wn, wh),
    reset() { clear(); lastFrame = 0; },
  };
}
