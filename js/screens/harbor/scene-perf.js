// CITY 2.0 — THE TIERING (SCHED — FR5 C1's cut: a pure MOVE out of scene.js, no behaviour changed): the session's frame stats, perf() (the
// costs a frame), judge() (when to step), the tier steps up + down + their log, the heavy moments' hold; one factory over ONE ctx of getters
// (+ setters) onto scene.js's own state (docs/harbor/review-5.md C1).


/** C: scene.js's state by getters (+ a setter where this code assigns it): baker, boats, bow, build, capped=, cool=, costs, DEBUG, dprTier=, fadeFrom, fastUntil=, frames, fw, graceDone=, heavyHeld=, heavyUntil, heavyWhy, lastJudge=, legendHeld=, legends, litBaker, LOADLOG, lockAt=, manualTier=, perfN=, probe=, PT, resizeT, shownAt, sky, slowN=, stepWhy, tier=, tierAt=, tierHold=, upAt=, upLock=, ups=, wantBake, wantBuild, wantStep=, wasHeavy9=, wheel */
export function createScenePerf(C) {

  // THE TIER (Part 6a, the owner's iPhone: tier 1 at 1–3 ms of work, 60 fps, 0 % slow): a step DOWN when the 75th-percentile
  // frame passes 19.5 ms (never in the first 2.5 s after the city shows: the first bakes + the power-on are a transient); a step
  // back UP when a stepped-down city has run 20 s at a steady 60 fps (p75 ≤ 17.5 ms, ≤ 5 % of frames over 20 ms) with light
  // work (the mean ≤ 4.5 ms, p95 ≤ 8) — at most twice a session, never again after a step-down that followed a step-up, never
  // after setTier() from outside (tests, perf runs: their tier stays)
  // THE SESSION COUNT (the readout's honest number, C1.5): every rAF interval since the city first showed — how many ran over
  // 20 ms (a missed vsync at 60 Hz), the longest run of them in a row, the longest single interval. Never reset (a hidden page
  // doesn't count: the loop stops and start() re-bases the clock).
  // DT1 (the owner's readout: "7 % slow" right after load): the same count again from LOAD_SKIP after the city showed (the
  // bakes, the fonts, the images settled) — the readout shows both; the second is the honest one
  const sess = { n: 0, slow: 0, run: 0, maxRun: 0, max: 0, t0: 0, after: { n: 0, slow: 0, run: 0, maxRun: 0, max: 0, t0: 0 } };
  const LOAD_SKIP = 10000;
  const count = (o, dt) => {
    if (!o.n) o.t0 = performance.now();
    o.n++;
    if (dt > o.max) o.max = dt;
    if (dt > 20) { o.slow++; if (++o.run > o.maxRun) o.maxRun = o.run; } else o.run = 0;
  };
  // (6b — THE DIRECTOR's passive long-session check: the slow share over the LAST 10 MINUTES, per-second buckets — the creep shows)
  const tenMin = { b: new Array(600).fill(null), sec: -1 };
  function tenMinSlow() { let n = 0, s = 0; for (const x of tenMin.b) if (x) { n += x[0]; s += x[1]; } return n ? (100 * s / n) : 0; }
  function session(dt) {
    if (C.shownAt < 0 || document.visibilityState !== 'visible') return;
    { const sec = Math.floor(performance.now() / 1000); if (sec !== tenMin.sec) { tenMin.sec = sec; tenMin.b[sec % 600] = [0, 0]; } const x = tenMin.b[sec % 600]; x[0]++; if (dt > 20) x[1]++; }
    count(sess, dt);
    if (performance.now() - C.shownAt >= LOAD_SKIP) count(sess.after, dt);
  }
  function perf(dt) {
    session(dt);
    // (C4c — THE CLIMB RE-ARMED (the owner, Oct 28: "are we too careful?"): the way back up used to be spent for the visit — twice a
    // session, never after a step down that followed a step up (upLock) — so one party peak could leave the city lower until the next
    // load. Now the END of a heavy moment (a legendary, the party, the fireworks) re-arms it, and a lock lifts after UP_RETRY anyway)
    { const hv9 = !!(C.legends && C.legends.active()) || C.PT.on > 0.5 || C.fw.busy(); if (C.wasHeavy9 && !hv9 && (C.upLock || C.ups >= 2)) { C.upLock = false; C.ups = 0; tierNote('re-armed', 'a heavy moment ended: the climb back may try again'); } C.wasHeavy9 = hv9; }
    C.frames.push(dt);
    if (C.frames.length > 90) C.frames.shift();
    if (C.cool > 0) { C.cool--; return; }
    const now = performance.now();
    // (DT1 — LOAD HITCHES NEVER COST A TIER: the owner's readout showed 2→1→2 at load — the first bakes, the lit windows, the
    // neon's sprites, the fonts + images landing; a probe there could even read the hitch as a capped phone. Nothing steps for
    // TIER_GRACE after the city shows, and the first window it judges holds no frame from before)
    // (POLISH 4 — A LEGENDARY HOLDS THE TIER: the owner's iPhone stepped 2→1→2 during the TR-3B — each step REBAKES the whole city,
    // mid-event; its ~50 s are judged by nobody, and the window after it starts fresh)
    if (C.legends && C.legends.active()) {
      C.legendHeld = true;
      // (9e — the owner's TR-3B link repeats the run every ~47 s, so the judge was held FOREVER there: WebKit at 9 fps stayed at t2 for
      //  580 frames. A legendary still holds the normal judging, but a CRAWL (the 75th-percentile frame over 40 ms — under 25 fps — on four
      //  half-second looks in a row) drops the live EFFECTS a step (no re-bake: invisible); the resolution waits for the run's end)
      if (C.tier > 0 && C.frames.length >= 90 && document.visibilityState === 'visible' && !(++C.perfN % 30)) {
        const s = [...C.frames].sort((a, b) => a - b);
        legSlow = s[67] > 40 ? legSlow + 1 : 0;
        if (legSlow >= 4) { legSlow = 0; stepDown(judge(now, 'a crawl under a legendary (< 25 fps)', 'down')); C.frames.length = 0; }
      }
      return;
    }
    if (C.legendHeld) { C.legendHeld = false; C.frames.length = 0; C.tierHold = Math.max(C.tierHold, now + 3000); return; }
    // (WIN2 — THE QUALITY STEP (the owner's iPhone: a step ~9.5 s after the reveal, a full-city crossfade for it): KNOWN HEAVY MOMENTS are
    // judged by nobody — a bake in flight, the crossfade of one, the sign's surge / race / a tapped letter — their frames never enter
    // the window, and the window after them starts fresh)
    { const hv = heavyNow(now); if (hv) { C.heavyHeld = hv; C.frames.length = 0; return; } if (C.heavyHeld) { C.heavyHeld = null; C.frames.length = 0; C.tierHold = Math.max(C.tierHold, now + 1500); return; } }
    if (C.frames.length < 90 || document.visibilityState !== 'visible' || now < C.tierHold || C.shownAt < 0 || now - C.shownAt < TIER_GRACE) return;
    if (!C.graceDone) { C.graceDone = true; C.frames.length = 0; return; }
    if (C.wantStep) { const w = C.wantStep; C.wantStep = null; if (C.tier > 0 || C.dprTier > 0) { judge(now, w, 'down'); stepDown(w); C.cool = 150; C.frames.length = 0; return; } }
    if (++C.perfN % 30) return;                 // (the sort every half second, not every frame)
    const s = [...C.frames].sort((a, b) => a - b);
    // NEON PASS 5 — A CAPPED FRAME RATE IS NOT A SLOW CITY (the owner's iPhone: a party night with NOTHING racing — tier 0): iOS
    // Low Power Mode (and Safari in some states) runs requestAnimationFrame at 30 Hz however light the page is, so the frames read
    // ~33 ms and the city stepped 2 → 1 → 0 in ~10 s, dropping the racing light, the effects and the glow, for nothing. Now a
    // step down is a PROBE: ~4 s later, if the frames didn't get faster (the median interval still ≥ 85 % of before), it was the
    // phone's cap, not the city — it steps back up and stops stepping down for frame timing (CAPPED; the readout says so); only
    // a real overload of its own work (mean > 12 ms a frame) still steps it down.
    if (C.probe && now - C.probe.at > 4000) {
      const p50 = s[45];
      if (p50 >= C.probe.p50 * 0.85) { C.capped = Math.round(1000 / p50); const back = C.probe.from; C.probe = null; C.LOADLOG.add('tier', `capped at ${C.capped} Hz — the step gave nothing: back to ${back.tier}/${back.dprTier}`); stepTo(back.tier, back.dprTier, 'capped: back'); C.cool = 150; C.frames.length = 0; return; }
      C.probe = null;
    }
    // (WIN2: SUSTAINED slowness only — the 75th-percentile frame over 19.5 ms on FOUR half-second looks in a row (≈ 3.5 s of frames),
    // never one bad window; what was measured goes to the LOAD log + the readout's tier line)
    C.slowN = s[67] > 19.5 ? C.slowN + 1 : 0;
    if (C.slowN >= 4 && (C.tier > 0 || C.dprTier > 0) && !C.probe) {
      const cs = C.costs.length ? C.costs.reduce((a, b) => a + b, 0) / C.costs.length : 0;
      if (C.capped && cs <= 12) return;
      if (C.upAt) { C.upLock = true; C.lockAt = performance.now(); }
      if (!C.capped) C.probe = { from: { tier: C.tier, dprTier: C.dprTier }, p50: s[45], at: now };
      const why = judge(now, 'the frame rate', 'down');
      C.slowN = 0; stepDown(why); C.cool = 150; C.frames.length = 0; return;
    }
    if ((C.tier < TOP_TIER || C.dprTier < TOP_TIER) && !C.manualTier && (!C.upLock || now - C.lockAt > UP_RETRY) && (C.ups < 2 || now - C.upAt > UP_RETRY) && now - C.tierAt > 20000 && C.costs.length >= 60) {
      const cs = [...C.costs].sort((a, b) => a - b), mean = cs.reduce((a, b) => a + b, 0) / cs.length, slow = s.filter(v => v > 20).length / s.length;
      if (s[67] <= 17.5 && slow <= 0.05 && mean <= 4.5 && cs[Math.floor(cs.length * 0.95)] <= 8) { C.ups++; C.upAt = now; judge(now, 'steady 60 fps', 'up'); stepUp(); C.cool = 150; C.frames.length = 0; }
    }
  }
  const TOP_TIER = 2, TIER_GRACE = 15000;
  let legSlow = 0;
  /** WIN2: a known heavy moment right now (its name) — nothing is judged in it */
  function heavyNow(now) {
    if (C.baker.pending || C.litBaker.pending || C.wantBake || C.wantBuild || C.resizeT) return 'a bake';
    if (C.fadeFrom >= 0) return 'the crossfade';
    if (now < C.heavyUntil) return C.heavyWhy;
    return null;
  }
  /** WIN2: what the judge measured — the window's frames (p50 / p75 / p95 / the worst), the work, the slow share — kept for the readout */
  function judge(now, why, dir) {
    const s = [...C.frames].sort((a, b) => a - b), cs = [...C.costs].sort((a, b) => a - b), n = s.length;
    const at = (now - C.shownAt) / 1000, p = q => (n ? s[Math.min(n - 1, Math.floor(n * q))] : 0), mean = cs.length ? cs.reduce((a, b) => a + b, 0) / cs.length : 0;
    const slow = n ? Math.round(100 * s.filter(v => v > 20).length / n) : 0;
    const text = `${dir === 'down' ? '↓' : '↑'} ${at.toFixed(1)} s after the reveal: frames p50 ${p(0.5).toFixed(1)} · p75 ${p(0.75).toFixed(1)} · p95 ${p(0.95).toFixed(1)} · worst ${(n ? s[n - 1] : 0).toFixed(0)} ms, ${slow} % slow over ${(n / 60).toFixed(1)} s · work ${mean.toFixed(1)} ms (${why})`;
    C.lastJudge = { at: +at.toFixed(1), dir, why, p50: +p(0.5).toFixed(1), p75: +p(0.75).toFixed(1), p95: +p(0.95).toFixed(1), worst: +(n ? s[n - 1] : 0).toFixed(1), slow, work: +mean.toFixed(1), n, text };
    return text;
  }
  // (C4c: the climb's retry + its log — every step with its time + why, for the readout + THE PHONE BENCH (the LOAD log stops 15 s after
  // the reveal); UP_RETRY: a locked or spent climb tries again after 3 min)
  const UP_RETRY = 180000, tierLog = [];
  function tierNote(dir, text) { tierLog.push({ at: +((performance.now() - (C.shownAt < 0 ? performance.now() : C.shownAt)) / 1000).toFixed(1), dir, tier: C.tier, dprTier: C.dprTier, text }); if (tierLog.length > 60) tierLog.shift(); }
  const tierHist = [C.tier];
  const applyFx = () => { C.wheel.setTier(C.tier); C.boats.setTier(C.tier); C.sky.setTier(C.tier); if (C.legends) C.legends.setTier(C.tier); if (C.bow) C.bow.setTier(C.tier); if (C.fw) C.fw.setTier(C.tier); };
  const histPush = () => { tierHist.push(C.dprTier === C.tier ? C.tier : `${C.tier}/${C.dprTier}`); if (tierHist.length > 8) tierHist.shift(); C.tierAt = performance.now(); };
  /** the whole step (before the reveal, from outside): the effects AND the resolution to t — a re-bake */
  function stepTier(t, why = 'the frame rate') { C.fastUntil = Math.max(C.fastUntil, performance.now() + 1500); const was = C.tier; C.tier = Math.max(0, Math.min(2, t)); C.dprTier = C.tier;   // (NEON PASS 5: build() clears the canvas — the battery saver must never skip the next draw: a black frame)
     C.LOADLOG.add('tier', `${was} → ${C.tier} (${why})`, { applied: C.shownAt >= 0 });
     histPush(); applyFx(); C.build('a tier step'); if (C.DEBUG) console.info('[harbor] tier', C.tier); }
  /** WIN2 — a step DOWN after the reveal: the EFFECTS first (live modules only — no bake, no crossfade: invisible), the canvas RESOLUTION
   *  last (a re-bake through the crossfade, the last resort); → true when something stepped */
  function stepDown(why) {
    const now = performance.now(), was = `${C.tier}/${C.dprTier}`; C.fastUntil = Math.max(C.fastUntil, now + 1500);
    let kind;
    if (C.tier > 0) { C.tier--; applyFx(); kind = 'effects — live, no re-bake'; }
    else if (C.dprTier > 0) { C.dprTier--; kind = 'resolution — a re-bake'; }
    else return false;
    C.stepWhy.push(why); C.LOADLOG.add('tier', `${was} → ${C.tier}/${C.dprTier} (${kind}; ${why})`, { applied: true }); tierNote('down', `${was} → ${C.tier}/${C.dprTier} (${kind}; ${why})`); histPush();
    if (kind[0] === 'r') C.build('a tier step'); if (C.DEBUG) console.info('[harbor] tier', C.tier, C.dprTier);
    return true;
  }
  /** a step UP after a step down: the resolution back first, then the effects */
  function stepUp() {
    const was = `${C.tier}/${C.dprTier}`; C.fastUntil = Math.max(C.fastUntil, performance.now() + 1500);
    if (C.dprTier < TOP_TIER) { C.dprTier++; C.LOADLOG.add('tier', `${was} → ${C.tier}/${C.dprTier} (resolution back)`, { applied: true }); tierNote('up', `${was} → ${C.tier}/${C.dprTier} (resolution back)`); histPush(); C.build('a tier step up'); }
    else if (C.tier < TOP_TIER) { C.tier++; applyFx(); C.LOADLOG.add('tier', `${was} → ${C.tier}/${C.dprTier} (effects back)`, { applied: true }); tierNote('up', `${was} → ${C.tier}/${C.dprTier} (effects back)`); histPush(); }
  }
  function stepTo(t, d, why) { const was = `${C.tier}/${C.dprTier}`, rb = d !== C.dprTier; C.tier = t; C.dprTier = d; applyFx(); C.LOADLOG.add('tier', `${was} → ${C.tier}/${C.dprTier} (${why})`, { applied: true }); tierNote('to', `${was} → ${C.tier}/${C.dprTier} (${why})`); histPush(); if (rb) C.build('a tier step'); }
  function setTier(t) { C.manualTier = true; stepTier(t); }
  return { LOAD_SKIP, TIER_GRACE, UP_RETRY, heavyNow, perf, sess, setTier, stepTier, tenMinSlow, tierHist, tierLog };
}
