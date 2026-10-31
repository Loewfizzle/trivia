// CITY 2.0 — THE HARBOR end to end: the `perf` cloud job's groups (tower, perf) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=perf, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { OUT, CPU, BUDGET_MS, log, sleep, ok, okT, ON_CI, skipCI, GR, GUARD_SCENES, NIGHT, open, ev, waitFor, tapAt, harborUp, settled, heapNoCode, G } from './kit.mjs';

G('perf', async () => {
  // ---- WIN2 — THE QUALITY STEP: a CALM LOAD on a mid phone profile (2x CPU) — 30 s after the reveal, NO tier step: nothing is judged in
  // the first 15 s, in a bake, the crossfade or the sign's surge, and only SUSTAINED slowness steps (the effects first, live — never the
  // full-city crossfade the owner saw ~9.5 s after the reveal); what the judge measured is in tiering().judge + the readout's tier line
  if (process.env.PERF_GUARD !== 'only') { const C2 = await open({ slot: 'calm', qs: `when=2026-10-22T21:30${GR}&debug=1`, view: [402, 874] });
    await C2.page.bringToFront();
    const cd = await C2.page.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: 2 });
    await harborUp(C2.page);
    await waitFor(C2.page, '(window.__district.tiering().sinceReveal || 0) >= 30', '30 s after the reveal', 60000).catch(() => {});
    const ti = await ev(C2.page, 'window.__district.tiering()');
    const calm = ti.hist.length === 1 && ti.why.length === 0 && ti.tier === 2 && ti.dprTier === 2;
    const machine = !!(ti.judge && ti.judge.p75 > 28);   // (this machine itself can't hold 60 fps here: a timing check, not the city's)
    if (ON_CI) { ok(ti.grace >= 15000, `A CALM LOAD: nothing judged in the first ${ti.grace / 1000} s (≥ 15)`); skipCI('A CALM LOAD STEPS NOTHING', `the runner's p75 ${ti.judge ? ti.judge.p75 : '?'} ms can't hold 60 fps`); }
    else (machine ? okT : ok)(calm && ti.grace >= 15000, `A CALM LOAD STEPS NOTHING (2x CPU, 30 s): tier ${ti.tier}/${ti.dprTier}, steps ${ti.hist.join('->')}${ti.why.length ? ` (${ti.why.join(' | ')})` : ''}, judged from ${ti.grace / 1000} s${ti.judge ? `; the judge: ${ti.judge.text}` : ''}`);
    await cd.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await C2.ctx.close(); }
  // ---- HOTFIX Oct 29 — THE BASELINE GUARD (the owner's iPhone: &force=bus at 5 fps, 200 ms of work a frame — the people's plan cache
  // re-planned the whole promenade every frame; no check saw it, C4d's "slow headless departure" was this): the mean scene work a frame
  // on a plain night + the forced-event links, at tier 0 and CPU× throttle, divided by a fixed JS loop timed in the same page (the
  // machine's speed: one baseline serves the laptop + the runner) — it FAILS above 2× tests/integration/perf-baseline.json (on CI with
  // no runner baseline of its own: a warning from 2×, a failure from 4× — the laptop's ratio of draw to JS isn't the runner's).
  // A pass that changes the cost ON PURPOSE re-writes the file at its end: PERF_BASELINE=write PERF_GUARD=only ONLY=perf.
  { const file = new URL('../perf-baseline.json', import.meta.url), BL = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { scenes: {} }, got = {};
    const own = ON_CI ? BL.ci : null; let base = own || BL.scenes;
    const CAL = `(() => { const cal = []; for (let k = 0; k < 5; k++) { const t0 = performance.now(); let x = 0; for (let i = 0; i < 2e6; i++) x += Math.sin(i * 0.001) * (i & 7); window.__calSink = x; cal.push(performance.now() - t0); } cal.sort((a, b) => a - b); return cal[2]; })()`;
    for (const [id, sc] of Object.entries(GUARD_SCENES)) {
      const G2 = await open({ slot: `pg-${id}`, qs: `${sc.qs}${GR}`, view: [402, 660] });
      await G2.page.bringToFront();
      const cd = await G2.page.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      await harborUp(G2.page);
      await ev(G2.page, 'window.__district.setTier(0)');
      await waitFor(G2.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 30000).catch(() => log(`perf guard: ${id} — not settled in 30 s; measured anyway`));
      if (sc.wait) await waitFor(G2.page, sc.wait, sc.waitWhat, 60000).catch(() => log(`perf guard: ${id} — ${sc.waitWhat} not seen; measured anyway`));
      await sleep(4000);   // (the measuring window: cost() keeps the last 90 frames)
      const r = await ev(G2.page, '(() => { const c = window.__district.cost(); return { work: c.reduce((a, b) => a + b, 0) / Math.max(1, c.length), n: c.length }; })()');
      const cal = await ev(G2.page, CAL);
      got[id] = { work: +r.work.toFixed(2), cal: +cal.toFixed(1), norm: +(r.work / cal).toFixed(4), frames: r.n };
      await cd.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await G2.ctx.close();
    }
    if (process.env.PERF_BASELINE === 'write') {
      const out = ON_CI ? { ...BL, ci: got } : { ...BL, scenes: got, at: new Date().toISOString().slice(0, 10), cpu: CPU };
      writeFileSync(file, JSON.stringify(out, null, 1) + '\n'); log('perf guard: the baseline written', JSON.stringify(got)); base = got;
    }
    for (const [id, g] of Object.entries(got)) {
      const b = base[id], k = b ? g.norm / b.norm : 0, txt = `THE BASELINE GUARD — ${GUARD_SCENES[id].label}: work ${g.work} ms a frame (${g.frames} frames, the machine's loop ${g.cal} ms) = ${k ? `${k.toFixed(2)}× the baseline` : 'no baseline'} (≤ 2×)`;
      if (!b) okT(false, `${txt} — run PERF_BASELINE=write ONLY=perf`);
      else if (ON_CI && !own) (k > 4 ? ok : okT)(k <= 2, `${txt} (the laptop's baseline on the runner)`);
      else ok(k <= 2, txt);
    }
  }
  if (process.env.PERF_GUARD === 'only') return;   // (PERF_GUARD=only ONLY=perf: just the guard, ~1.5 min — a baseline re-write, a quick check)
  // ================================================================ 5. frame pacing at 4× CPU, memory over 20 cycles, a hidden tab
  const Q = await open({ slot: 'hq', qs: `when=2026-10-24T23:00${GR}` });   // a Saturday at the party's peak
  await harborUp(Q.page);
  await Q.page.bringToFront();
  const cdp = await Q.page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
    // (one plain-value read; a page torn down under 4× throttle + GC once lost a pending evaluate: "Promise was collected" — retried)
    for (let k = 0; k < 2; k++) {
      try {
        await ev(Q.page, `window.__district.setTier(${t})`);
        // (FP2: 30 s — at 4× CPU without a GPU a frame costs ~110 ms here and the bake runs a step a frame; FP2's smaller night steps
        // (the setts two rows a step, the street, the neon's depth plan) pushed the re-bake past 15 s — the commit before missed it too on
        // its first try)
        await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 're-bake', 30000);
        await sleep(6000);   // (the measuring window)
        const r = await ev(Q.page, '(() => { const d = window.__district, c = d.cost(), f = [...d.frames()].sort((a, b) => a - b); return { now: d.scene().tier, cost: c.reduce((a, b) => a + b, 0) / Math.max(1, c.length), p50: f.length ? f[Math.floor(f.length / 2)] : 0 }; })()');
        perf.push({ tier: t, now: r.now, cost: +r.cost.toFixed(2), p50: +r.p50.toFixed(1) });
        break;
      } catch (e) {
        // (FP2: say WHAT is still pending — the bake, the windows' light key, a fade — before retrying / failing)
        const st = await ev(Q.page, '(() => { const h = window.__district.harbor(), w = h.windows || {}; return JSON.stringify({ tier: window.__district.scene().tier, pending: h.pending, fading: h.fading, bakes: h.bakes, key: h.key, win: { key: w.key, pending: w.pending, bakes: w.bakes } }); })()').catch(x => x.message);
        log('perf: state', st);
        if (k) throw e; log('perf: retrying tier', t, e.message); }
    }
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  // C1.5 (the owner's decision): absolute numbers on this laptop are WARNINGS — the gate is the relative A/B in one run
  // (title-perf.mjs --ab) and her iPhone (&debug=1's session line). Headless Chrome without a GPU is raster-bound on a party
  // night (frames 33–100 ms at 4× on the commit before C1.5 too, the tier stepping down): the check is that it measured.
  ok(perf.length === 3 && perf.every(p => p.cost > 0), `PERF (city 2, party peak, ${CPU}× CPU) measured: ${perf.map(p => `t${p.tier}${p.now !== p.tier ? `→${p.now}` : ''}: p50 ${p.p50} ms, work ${p.cost} ms`).join(' · ')}`);
  for (const p of perf) {
    if (p.cost > BUDGET_MS[p.tier]) log(`WARN  PERF: t${p.tier} scene work ${p.cost} ms > the ${BUDGET_MS[p.tier]} ms budget on this laptop (a warning — the A/B + the phone decide)`);
    if (p.p50 > 18 || (p.tier > 0 && p.now === 0)) log(`WARN  PERF: t${p.tier} frames p50 ${p.p50} ms${p.now === 0 && p.tier > 0 ? ', fell to tier 0' : ''} (a warning on this laptop)`);
  }
  // (MEMORY at tier 0: it can't step lower — a party night on this laptop steps 2 → 1 on its own, and memory scales with the tier)
  await setTierBack();
  async function setTierBack() { await ev(Q.page, 'window.__district.setTier(0)'); await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 're-bake', 15000); }
  const memH0 = await ev(Q.page, 'window.__district.harbor()'), mem0 = memH0.mem.mb;
  // (C4d — the laptop's "Protocol error (Runtime.callFunctionOn): Promise was collected" (Chromium 149): each cycle AWAITED a dynamic
  // import() inside page.evaluate right after a forced GC — CDP lost the pending promise. The store is imported ONCE, before the GC, and
  // the cycles call it synchronously; the screens are waited for as before)
  await Q.page.evaluate(() => import('/js/store.js').then(m => { window.__e2eStore = m; return true; }));
  const q0 = await heapNoCode(cdp);   // (ATM-A: the heap without V8's compiled code — kit.mjs#heapNoCode)
  for (let i = 0; i < 20; i++) {
    await Q.page.evaluate(() => { window.__e2eStore.setState({ view: 'setup', setupMode: 'host' }); return true; });
    await waitFor(Q.page, "!!document.querySelector('.setup-screen') && !window.__district", 'the setup screen', 8000).catch(() => {});
    await Q.page.evaluate(() => { window.__e2eStore.setState({ view: 'title' }); return true; });
    await waitFor(Q.page, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'the title again', 10000);
  }
  await waitFor(Q.page, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'back on the title', 15000);
  await sleep(800);
  await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled (the memory is read between crossfades)', 15000);
  // (the same tier as the first reading: a loaded laptop may probe a tier down — NEON PASS 5's tiering — and memory scales with the tier)
  if ((await ev(Q.page, 'window.__district.harbor().mem.tier')) !== memH0.mem.tier) { await ev(Q.page, `window.__district.setTier(${memH0.mem.tier})`); await settled(Q.page, 'the same tier again'); }
  const q1 = await heapNoCode(cdp);
  const mem1 = (await ev(Q.page, 'window.__district.harbor()')).mem.mb;
  const scenes = await ev(Q.page, `document.querySelectorAll('.nd-scene').length`);
  const lay = h => h.mem.layers.map(l => `${l.name.split(' ')[0]}:${l.mb}`).join(' ');
  const hq0 = memH0, hq1 = await ev(Q.page, 'window.__district.harbor()');
  ok(scenes === 1 && q1.rest - q0.rest < 6e6 && Math.abs(mem1 - mem0) < 0.05, `MEMORY: 20 title↔setup cycles leave one city, heap ${Math.round((q1.rest - q0.rest) / 1e5) / 10} MB (+ V8's compiled code ${Math.round((q1.code - q0.code) / 1e5) / 10} MB, not counted), offscreen ${mem0} → ${mem1} MB${Math.abs(mem1 - mem0) >= 0.05 ? ` (tier ${hq0.mem.tier} → ${hq1.mem.tier}; ${lay(hq0)} → ${lay(hq1)})` : ''}`);
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === false, 'HIDDEN TAB (city 2): the Harbor stops rendering');
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === true, 'VISIBLE AGAIN: it resumes');

  // ================================================================ 5b. BATTERY (cleanup pass 1): a calm night draws every other frame; a hidden page draws none
  // (SKY-B: a TUESDAY — Wednesday's NIGHT has the shadowboxer moving in his window: motion, 60 fps — the saver is tested on a still night)
  { const C = await open({ slot: 'hc', qs: `when=2026-10-20T22:00${GR}&force=no-planes,no-birds,no-people` });   // (PEO: anyone walking keeps 60 fps now — the saver is tested on an empty promenade)
    await C.page.bringToFront();   // (C4d: the group's perf page stays open — behind it, Chromium 149's headless tab got no animation frames: 0 drawn)
    await harborUp(C.page);
    await waitFor(C.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 15000);
    await waitFor(C.page, "window.__district.harbor().rate.fast === ''", 'the city calm (the neon booted)', 20000);   // (the boot's sputters count as motion)
    // (a 3 s window with nothing fast in it — a loaded laptop may re-bake mid-window (the tier's probe): then the next window, ≤ 4)
    let r0, r1;
    for (let k = 0; k < 4; k++) {
      await waitFor(C.page, "window.__district.harbor().rate.fast === ''", 'calm again', 20000).catch(() => {});
      await sleep(500);
      r0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(3000); r1 = await ev(C.page, 'window.__district.harbor().rate');
      if (r1.fast === '') break;
    }
    const fps = (r1.drawn - r0.drawn) / 3;
    if (ON_CI) skipCI('BATTERY: a calm night draws every other frame', `the runner drew ${fps.toFixed(0)} a second`); else okT(r1.fast === '' && fps > 22 && fps < 40, `BATTERY: a calm night draws ${fps.toFixed(0)} frames a second (every other rAF; fast: '${r1.fast || 'calm'}')`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(400); const h0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(600); const h1 = await ev(C.page, 'window.__district.harbor().rate');
    ok(h1.drawn === h0.drawn && h1.running === false, `BATTERY: hidden, nothing is drawn (${h0.drawn} → ${h1.drawn})`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(600); const v = await ev(C.page, 'window.__district.harbor().rate');
    ok(v.running && v.fast !== '', `BATTERY: visible again, it resumes (fast: ${v.fast})`);
    if (ON_CI) skipCI('BATTERY: visible again, at 60 fps for a moment', `${v.drawn - h1.drawn} frames in 0.6 s on the runner`); else okT(v.drawn > h1.drawn + 20, `BATTERY: visible again, at 60 fps for a moment (${v.drawn - h1.drawn} frames in 0.6 s)`);
    await C.ctx.close(); }
  await Q.ctx.close();
});
// ================================================================ 9e — THE CONSTRUCTION TOWER (ONLY=tower; the `city` cloud job)
// THE SUN MUST NOT BREAK: the sun's arch the same at every stage (the envelope keeps the slot full height); the frame + the crane while it
// rises; the empty lot after the implosion; the implosion itself running (the old building live, then the dust)
G('tower', async () => {
  const A = {}, P = 'window.__district.harbor()';
  for (const st of ['standing', 'rubble', 'rising', 'finished']) {
    const Q = await open({ slot: `tw-${st}`, qs: `when=2026-09-16T10:00${GR}&wx=clear&build=${st}`, view: [402, 874] });
    await harborUp(Q.page);
    if (st === 'rising') await waitFor(Q.page, `${P}.tower.fx.crane === 'model'`, 'the crane model', 10000).catch(() => {});
    A[st] = await ev(Q.page, `({ arch: ${P}.arch, tower: ${P}.tower })`);
    A[st].craneFetched = A[st].tower.fx.crane !== 'not asked';
    await Q.ctx.close();
  }
  // (BNAME — THE CRANE FROM J-TOASTIE's MODEL: baked sprites, fetched only while the crane is up; &crane=classic = the hand-drawn one)
  ok(A.rising.tower.fx.crane === 'model' && A.rising.craneFetched && !A.standing.craneFetched && !A.finished.craneFetched,
    `BNAME THE CRANE: the model while the frame rises (${A.rising.tower.fx.crane}), its sprites fetched only then (rising ${A.rising.craneFetched} · standing ${A.standing.craneFetched} · finished ${A.finished.craneFetched})`);
  { const Q = await open({ slot: 'tw-classic', qs: `when=2026-09-16T10:00${GR}&wx=clear&build=rising&crane=classic`, view: [402, 874] });
    await harborUp(Q.page);
    const t = await ev(Q.page, `${P}.tower`);
    ok(t.fx.crane === 'classic', `BNAME &crane=classic: the hand-drawn crane (${t.fx.crane})`);
    await Q.ctx.close(); }
  // (9f: within 0.01 pt — the arch's apex is measured from the NEON logo's DOM rect, which can differ by ~1e-5 px between page loads)
  const near = (a, b) => !!a && !!b && ['peak', 'low', 'top'].every(k => Math.abs((a[k] ?? 0) - (b[k] ?? 0)) < 0.01);
  const same = ['rubble', 'rising', 'finished'].every(st => near(A[st].arch, A.standing.arch));
  ok(same, `9e THE SUN MUST NOT BREAK: the arch at every stage = today's (${JSON.stringify(A.standing.arch)} · ${['rubble', 'rising', 'finished'].map(st => JSON.stringify(A[st].arch)).join(' · ')})`);
  ok(A.rising.tower.fx.works === 'frame' && A.rising.tower.st.crane && A.rubble.tower.fx.works === 'gone' && !A.standing.tower.fx.works && A.finished.tower.st.design !== A.standing.tower.st.design,
    `9e THE TOWER's stages: rising = a frame + the crane (${A.rising.tower.fx.works}, ${A.rising.tower.st.crane}), the lot after (${A.rubble.tower.fx.works}), a new design when finished (${A.finished.tower.st.design} vs ${A.standing.tower.st.design})`);
  { const Q = await open({ slot: 'tw-imp', qs: `when=2026-09-16T10:00${GR}&wx=clear&build=implosion&builds=6`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.tower && ${P}.tower.fx && ${P}.tower.fx.old`, "the old building's sprite (made on the first draw after the fade-in)", 15000).catch(() => {});   // (C4d: the cloud read it before that draw)
    const t = await ev(Q.page, `${P}.tower`);
    ok(t.st.stage === 'implosion' && Math.abs(t.st.s - 6) < 0.01 && t.fx.works === 'gone', `9e THE IMPLOSION at 6 s: drawn live (${t.st.stage}, s ${t.st.s}), the slot empty in the bake (${t.fx.works})`);
    // (9f — THE REAL TOWER IMPLODES: the slot's original block baked into its own sprite with the skyline's skyBlock — the same building)
    ok(t.fx.old && t.fx.old.w > 10 && t.fx.old.h > 60 && t.fx.old.form && t.fx.old.form !== 'block', `9f THE REAL BUILDING comes down: its own sprite (${t.fx.old ? `${t.fx.old.w}×${t.fx.old.h} pt, form ${t.fx.old.form}` : 'none — the plain block'})`);
    await Q.ctx.close(); }
  // (9f — THE SITE AT NIGHT: the bulb strings, the floods, the obstruction lights — drawn on a night the frame rises; a party night's
  // work-light beam from the deck)
  { const Q = await open({ slot: 'tw-night', qs: `when=2026-09-16T22:00${GR}&wx=clear&build=rising&force=beams`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.tower.fx.bulbs`, 'the bulb strings', 8000).catch(() => {});
    const t = await ev(Q.page, `${P}.tower`), lum = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, f = ${P}.tower.fx, x = cv.getContext('2d').getImageData(Math.round((f.x - 8) * k), Math.round((f.frameTop + 2) * k), Math.round(16 * k), Math.round(6 * k)).data; let m = 0; for (let i = 0; i < x.length; i += 4) m = Math.max(m, 0.2126 * x[i] + 0.7152 * x[i + 1] + 0.0722 * x[i + 2]); res(Math.round(m)); }))`);
    ok(t.fx.bulbs && lum > 150, `9f THE SITE AT NIGHT: the bulb strings + the floods light the rising frame (the brightest in its top floors ${lum})`);
    await Q.ctx.close(); }
  // ---- 9g — THE IMPLOSION HEARD (&speed=4): the siren once (the music dipped under it), THREE horn blasts on HORN B (PROM: the
  // default — the old warning horn), ONE rumble (the take now one crash + the settling: core/… importer). PROM — THE NEW TIMELINE (the
  // owner: "it takes way too long"): 10 s after the siren ENDS the horns, 5 s after the last blast ENDS the fall (÷ 4 at &speed=4)
  { const Q = await open({ slot: 'tw-snd', qs: `when=2026-09-16T10:00${GR}&wx=clear&force=implosion&speed=4`, view: [402, 874] });
    await harborUp(Q.page);
    await tapAt(Q.page, 201, 420);
    await waitFor(Q.page, `${P}.tower.st && ${P}.tower.st.s > 6`, 'the implosion fell', 60000);
    const raw = await ev(Q.page, `import('/js/audio/city-sound.js').then(m => m.cityLog.filter(x => /^tower-|^implosion/.test(x.slot)).map(x => ({ k: x.slot + ':' + x.f, at: x.at + (x.wait || 0) * 1000 })))`);
    const log = raw.map(x => x.k), n = re => log.filter(x => re.test(x)).length;
    ok(n(/^tower-siren:/) === 1 && n(/^tower-horn:warning-horn\.mp3/) === 3 && n(/^tower-horn:/) === 3 && n(/^implosion-rumble:/) === 1,
      `9g THE IMPLOSION HEARD: the siren ×${n(/^tower-siren:/)}, HORN B (PROM's default) ×${n(/^tower-horn:warning-horn/)} (of ${n(/^tower-horn:/)}), ONE rumble ×${n(/^implosion-rumble:/)} — ${log.join(', ')}`);
    const at = re => (raw.find(x => re.test(x.k)) || {}).at, horns = raw.filter(x => /^tower-horn:/.test(x.k)).map(x => x.at);
    const g1 = (horns[0] - at(/^tower-siren:/)) / 1000 * 4, g2 = (at(/^implosion-rumble:/) - horns[2]) / 1000 * 4;
    okT(Math.abs(g1 - 20.5) < 4 && Math.abs(g2 - 12.1) < 3, `PROM THE NEW TIMELINE: the siren → the first horn ${g1.toFixed(1)} s (want 20.5: its 10.5 s + 10 s), the last horn → the rumble ${g2.toFixed(1)} s (want 12.1: its 4.65 s + 5 s + the fall's start)`);
    await Q.ctx.close(); }
  // ---- 9g — THE RIVET GUN as SHORT BURSTS (the owner: "it almost sounds like a bug"): by day on the rising site, after the tap, a burst
  // (a one-shot take of 1.5–4 s) — never a loop
  { const Q = await open({ slot: 'tw-rivet', qs: `when=2026-09-16T10:00${GR}&wx=clear&build=rising`, view: [402, 874] });
    await harborUp(Q.page);
    await tapAt(Q.page, 201, 420);
    await waitFor(Q.page, `import('/js/audio/city-sound.js').then(m => m.cityLog.some(x => x.slot === 'rivet-gun'))`, 'a rivet burst', 30000).catch(() => {});
    const r = await ev(Q.page, `import('/js/audio/city-sound.js').then(m => ({ shots: m.cityLog.filter(x => x.slot === 'rivet-gun').map(x => x.f), loop: ${P}.sounds.player.loops.some(l => l.slot === 'rivet-gun') }))`);
    ok(r.shots.length >= 1 && r.shots.every(f => /^rivet-gun-\d\.mp3$/.test(f)) && !r.loop, `9g THE RIVET: a short burst (${r.shots.join(', ') || 'none in 30 s'}), no loop`);
    await Q.ctx.close(); }
  // ---- 9g — THE CRANE NEVER PULSES BY DAY (the owner: "it almost looks like it's pulsing … something crawling around in that code"):
  // BNAME laid the next slew frame over the current one at the blend — the lattice thickened through each 3° step + snapped back.
  // Now the nearest of 133 frames (1° a step) is drawn whole: frame by frame at an iPhone's DPR, the lattice's ink (its yellow over the
  // sky) never jumps against its own slow trend
  { const Q = await open({ slot: 'tw-pulse', qs: `when=2026-09-16T11:00${GR}&wx=clear&build=rising&force=no-planes,no-birds,no-people&cranet=36`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.tower.fx.crane === 'model' && !!${P}.tower.fx.craneAt`, 'the crane model drawn', 15000);
    await settled(Q.page); await sleep(1500);   // (past the reveal's own fade-in)
    const ink = await ev(Q.page, `new Promise(res => {
      const cv = document.querySelector('canvas'), k = cv.width / cv.clientWidth, x = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const a0 = ${P}.tower.fx.craneAt, J = a0.J, R = { x: Math.floor((a0.mx - J * 1.9) * k), y: Math.floor((a0.ay - J * 0.9) * k), w: Math.ceil(J * 3.8 * k), h: Math.ceil(J * 1.3 * k) };
      x.canvas.width = R.w; x.canvas.height = R.h; const out = [], deg = [];
      const f = () => { x.clearRect(0, 0, R.w, R.h); x.drawImage(cv, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h); const d = x.getImageData(0, 0, R.w, R.h).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) n += Math.max(0, d[i] - d[i + 2] - 10);
        out.push(n); deg.push(${P}.tower.fx.craneAt.deg); if (out.length < 240) requestAnimationFrame(f); else res({ out, deg }); };
      requestAnimationFrame(f); })`);
    const med = (a, i) => { const q = a.slice(Math.max(0, i - 15), i + 16).sort((p, r) => p - r); return q[q.length >> 1]; };
    const dev = ink.out.map((v, i) => Math.abs(v - med(ink.out, i)) / Math.max(1, med(ink.out, i))).sort((a, b) => a - b);
    const p95 = dev[Math.floor(dev.length * 0.95)];
    if (p95 >= 0.006) log('tw-pulse', 'ink', ink.out.slice(0, 60).join(' '));
    ok(p95 < 0.006, `9g THE CRANE NEVER PULSES: the lattice's ink frame to frame within ${(p95 * 100).toFixed(2)} % of its trend (p95; BNAME's blend: 1.2 %) over ${Math.abs(ink.deg[ink.deg.length - 1] - ink.deg[0]).toFixed(1)}° of the swing`);
    await Q.ctx.close(); }
});
