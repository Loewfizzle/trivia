// JAYWALK H6A — THE BIG MOMENTS' look checks (tests/integration/jaywalk-lab.mjs `--h6a[=blackbird|ufo|ship]`): the lab (the pure engine in
// the tab — no server) driven to each moment, day + night, at 390 × 844 @3 → the shots (h6a/<group>/) + what must hold: the moments'
// module + models are fetched ON DEMAND (never at the lab's start), the real models are on screen, the glint stands inside the tell's
// last 0.5 s, THE UFO's ring is where the rules have it, THE ABDUCTION runs its ≈ 2 s, THE MOTHERSHIP warns for 10 s then lifts every
// kid — and nothing a player reads says "TAKEN".
export async function looksH6A(p, { ok, shot, sleep, waitFor, what = '', reqs = [] }) {
  const L = js => p.evaluate(js), all = !what;
  let lookNow = await p.evaluate(() => window.__jwLab.look());   // (the look the page is in: only a CHANGE cross-fades)
  const fresh = async (look, mode = 'solo') => { await fresh0(look, mode); if (look !== lookNow) { lookNow = look; await sleep(2100); } };   // (H6B: a look change CROSS-FADES the band — a shot waits it out)
  const fresh0 = (look, mode = 'solo') => L(`window.__jwLab.freeze(false); window.__jwLab.ghosts(0); window.__jwLab.bot(false); window.__jwLab.restart('${mode}', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('${look}'); window.__jwLab.hop('u')`);
  const fly = () => p.evaluate(() => window.__jwLab.view.info().fly);
  /** stand on a grass lane 2–8 below `lane` (the centre column) */
  const below = (l, x = 4500) => p.evaluate((ln, xx) => { const J = window.__jwLab; for (let d = 2; d < 9; d++) if (J.find('grass', ln - d) === ln - d) { J.warp(ln - d, { x: xx }); return ln - d; } J.warp(ln - 2, { x: xx }); return ln - 2; }, l, x);
  /** the lab's tick put `u` ticks into the band's lap (the next lap from now), the world held there */
  const lapTo = (F, u) => p.evaluate((f, uu) => { const J = window.__jwLab, t = J.state().t, k = Math.floor((t - f.phase) / f.period) + 2; J.setT(f.phase + k * f.period + uu); J.freeze(true); }, F, u);
  if (all || what === 'perf') ok(!reqs.some(u => /flyers\.js|blackbird\.glb|ufo\.glb|mothership\.glb/.test(u)), 'ON DEMAND: the moments\' module + the three models are not fetched at the lab\'s start');

  if (all || what === 'blackbird') for (const look of ['night', 'day']) {
    await fresh(look); await sleep(400);
    const F = await L('window.__jwLab.flight(150)');
    ok(!!F, `a flight path is on the course (lane ${F && F.lane}, dir ${F && F.dir})`);
    const at = await below(F.lane); await sleep(900);
    await waitFor(p, "(window.__jwLab.view.info().fly || { models: [] }).models.includes('blackbird')", 20000);
    let f = await fly();
    ok(f && f.models.includes('blackbird'), `THE BLACKBIRD's model is fetched as its flight path nears (the kid at lane ${at}; ${f && f.models})`);
    await lapTo(F, F.period - F.tell + 34); await sleep(350); await shot(p, `h6a/blackbird/${look}-1-the-tell.png`);
    await lapTo(F, F.period - 30 + 4); await sleep(250); await shot(p, `h6a/blackbird/${look}-2a-the-glint-begins.png`);
    await lapTo(F, F.period - 8); await sleep(250); await shot(p, `h6a/blackbird/${look}-2-the-glint.png`);
    f = await fly(); ok(f.jets === 0, 'the glint stands INSIDE the tell: the jet itself is not over the lanes yet');
    await lapTo(F, 5); await sleep(250); f = await fly();
    ok(f.jets === 1, `mid-pass: the real SR-71 is over the band (${f.jets})`);
    await shot(p, `h6a/blackbird/${look}-3-mid-pass.png`);
    await lapTo(F, 8); await sleep(250); await shot(p, `h6a/blackbird/${look}-3a-the-burners.png`);   // (H6B: the jet mid-screen, both afterburners in the frame)
    await lapTo(F, 10); await sleep(250); await shot(p, `h6a/blackbird/${look}-3b-the-shockwave.png`);
    await lapTo(F, 22); await sleep(250); await shot(p, `h6a/blackbird/${look}-3c-after-it.png`);
    // a hit: standing on the band as it passes
    await p.evaluate((ff) => { const J = window.__jwLab, t = J.state().t, k = Math.floor((t - ff.phase) / ff.period) + 2; J.warp(ff.lane, { x: 4500 }); J.setT(ff.phase + k * ff.period - 3); J.freeze(false); }, F);
    const hit = await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'blackbird'", 6000);
    ok(hit, 'standing on the band as it passes = BUZZED BY THE BLACKBIRD');
    await sleep(300); await shot(p, `h6a/blackbird/${look}-4-a-hit.png`);
    await sleep(350); await shot(p, `h6a/blackbird/${look}-4b-a-hit-later.png`);
    await waitFor(p, 'window.__jwLab.state().shown', 4000);
    ok((await L('window.__jwLab.state().line')) === 'BUZZED BY THE BLACKBIRD', 'its words: BUZZED BY THE BLACKBIRD');
  }

  if (all || what === 'ufo') for (const look of ['night', 'day']) {
    await fresh(look); await sleep(400);
    const y0 = await L("window.__jwLab.find('ufo', 100)");
    ok(y0 > 0, `a UFO's zone is on the course (from lane ${y0})`);
    let U = await p.evaluate(l => window.__jwLab.ufoAt(l), y0);
    const at = await p.evaluate((u, z) => { const J = window.__jwLab; let y = Math.floor(u.y) - 3; for (let d = 0; d < 6; d++) if (J.find('grass', y - d) === y - d) { y -= d; break; } J.warp(y, { x: Math.max(1500, Math.min(7500, u.x)) }); return y; }, U, y0);
    await sleep(700);
    await waitFor(p, "(window.__jwLab.view.info().fly || { models: [] }).models.includes('ufo')", 20000);
    await sleep(500); await L('window.__jwLab.freeze(true)'); await sleep(200);
    let f = await fly();
    ok(f && f.ufos >= 1, `THE UFO: the real saucer drifts over its ring (the kid at lane ${at}; ${f && f.ufos} in view)`);
    await shot(p, `h6a/ufo/${look}-1-drifting.png`);
    // THE ABDUCTION: the kid steps into the ring
    let took = false;
    for (let tries = 0; tries < 6 && !took; tries++) {
      await L('window.__jwLab.freeze(false)');
      U = await p.evaluate(l => window.__jwLab.ufoAt(l), y0);
      await p.evaluate(u => { const J = window.__jwLab; J.warp(Math.floor(u.y), { x: Math.max(600, Math.min(8400, u.x)) }); }, U);
      took = await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'ufo'", 1500);
      if (!took) { await fresh(look); await sleep(500 + tries * 700); }
    }
    ok(took, 'stepping into the ring = taken by THE UFO');
    const t0 = Date.now(), wait = async ms => { const d = ms - (Date.now() - t0); if (d > 0) await sleep(d); };
    await wait(170); await shot(p, `h6a/ufo/${look}-2a-the-circle-flares.png`);
    await wait(520); await shot(p, `h6a/ufo/${look}-2b-the-beam-slams-down.png`);
    f = await fly(); ok(f.abducting, 'THE ABDUCTION is running (the saucer locked on over him)');
    await wait(1050); await shot(p, `h6a/ufo/${look}-2c-up-the-beam.png`);
    ok(!(await L('window.__jwLab.state().shown')), 'the end\'s words wait for the abduction (≈ 2 s)');
    await wait(1520); await shot(p, `h6a/ufo/${look}-2d-into-the-saucer.png`);
    await wait(1800); await shot(p, `h6a/ufo/${look}-2e-it-zips-off.png`);
    await waitFor(p, 'window.__jwLab.state().shown', 4000);
    ok((await L('window.__jwLab.state().line')) === 'ABDUCTED', 'its word: ABDUCTED');
  }

  // THE MEASURE (`--h6a=perf`): the three moments at 390 × 844 @3 under a 4× CPU throttle, day + night, tier 2 + tier 1 — the Blackbird's
  // whole pass (the glint → the jet → the ring + the trails), an abduction, THE MOTHERSHIP's arrival with 8 kids; + the on-demand load:
  // the frames while the module + the model arrive as the flight path nears (a cold page)
  if (what === 'perf') {
    const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const measure = async (name, ms, floor = 58) => {
      await L('window.__jwLab.clearFrames()'); await sleep(ms);
      const f = (await L('window.__jwLab.frames()')).slice(2).sort((a, b) => a - b), avg = f.reduce((a, b) => a + b, 0) / f.length, p95 = f[Math.floor(f.length * 0.95)], worst = f[f.length - 1];
      console.log('PERF', JSON.stringify({ moment: name, frames: f.length, fps: +(1000 / avg).toFixed(1), p95Ms: +p95.toFixed(1), worstMs: +worst.toFixed(1) }));
      ok(1000 / avg >= floor && p95 < 21, `${name}, 4× CPU: ${(1000 / avg).toFixed(1)} fps (p95 ${p95.toFixed(1)} ms, worst ${worst.toFixed(1)})`);
      return worst;
    };
    // THE ON-DEMAND LOAD (first: the page is cold — nothing of the moments fetched yet): the bot plays up to the flight path
    await fresh('night'); await L('window.__jwLab.setTier(2)'); await sleep(500);
    const F0 = await L('window.__jwLab.flight(150)');
    await p.evaluate(l => { const J = window.__jwLab; J.warp(J.find('grass', l - 44), { x: 4500 }); }, F0.lane); await sleep(1200);
    ok(!(await fly()), 'the moments\' module is not there yet, 40 + lanes before the flight path');
    await L('window.__jwLab.clearFrames(); window.__jwLab.bot(true)');
    const got = await waitFor(p, "(window.__jwLab.view.info().fly || { models: [] }).models.includes('blackbird')", 30000);
    await sleep(600);
    const lf = (await L('window.__jwLab.frames()')).slice(2), lw = Math.max(...lf), over = lf.filter(x => x > 34).length;
    console.log('PERF', JSON.stringify({ moment: 'the on-demand load (flyers.js + blackbird.glb) as the flight path nears', frames: lf.length, worstMs: +lw.toFixed(1), framesOver34: over }));
    ok(got && lw < 60 && over <= 2, `THE ON-DEMAND LOAD causes no hitch: the module + the model arrived while the bot played on (${lf.length} frames, worst ${lw.toFixed(1)} ms, ${over} over 34 ms)`);
    await L('window.__jwLab.bot(false)');
    for (const look of ['night', 'day']) for (const tier of [2, 1]) {
      const tag = `${look}, tier ${tier}`;
      await fresh(look); await L(`window.__jwLab.setTier(${tier})`); await sleep(500);
      const F = await L('window.__jwLab.flight(150)'); await below(F.lane); await sleep(1200);
      await p.evaluate(f => { const J = window.__jwLab, t = J.state().t, k = Math.floor((t - f.phase) / f.period) + 2; J.setT(f.phase + k * f.period - 50); }, F);
      await measure(`THE BLACKBIRD's pass (${tag})`, 2000);
      const y0 = await L("window.__jwLab.find('ufo', 100)");
      let took = false;
      for (let i = 0; i < 6 && !took; i++) {
        await fresh(look); await L(`window.__jwLab.setTier(${tier})`); await sleep(400 + i * 600);
        const U = await p.evaluate(l => window.__jwLab.ufoAt(l), y0);
        await p.evaluate(u => { const J = window.__jwLab; J.warp(Math.floor(u.y) - 2, { x: Math.max(1500, Math.min(7500, u.x)) }); }, U); await sleep(1300);
        const U2 = await p.evaluate(l => window.__jwLab.ufoAt(l), y0);
        await p.evaluate(u => { const J = window.__jwLab; J.warp(Math.floor(u.y), { x: Math.max(600, Math.min(8400, u.x)) }); }, U2);
        took = await waitFor(p, "window.__jwLab.state().over && window.__jwLab.state().cause === 'ufo'", 1200);
      }
      if (took) await measure(`THE ABDUCTION (${tag})`, 1900); else ok(false, `an abduction to measure (${tag})`);
      await fresh(look, 'match'); await L(`window.__jwLab.setTier(${tier}); window.__jwLab.warp(3, { x: 4500 }); window.__jwLab.ghosts(7)`); await sleep(1500);
      // (H6B: as in a real match — the ship's bake + its sprite's + sparks' first paint happen in the count, long before the cap: the
      //  measure waits for them, then jumps to 2 s before the cap)
      await waitFor(p, '(window.__jwLab.view.info().fly || {}).ship === true', 15000); await sleep(800);
      await L('window.__jwLab.setT(6 * 60 * 60 - 130)'); await sleep(300);
      await measure(`THE MOTHERSHIP's arrival + the lift, 8 kids (${tag})`, 5200);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await cdp.detach();
    return;
  }

  if (all || what === 'ship') for (const look of ['night', 'day']) {
    await fresh(look, 'match'); await sleep(500);
    await L('window.__jwLab.warp(3, { x: 4500 }); window.__jwLab.ghosts(3)');
    await sleep(600);
    await waitFor(p, "(window.__jwLab.view.info().fly || {}).ship === true", 20000);
    let f = await fly();
    ok(f && f.ship, 'THE MOTHERSHIP\'s model is fetched + baked at the run\'s start (a capped run) — never at the warning');
    ok(f && !f.shipOn, 'no ship, no warning before the cap − 10 s');
    await L('window.__jwLab.setT(6 * 60 * 60 - 10 * 60 + 110)'); await sleep(900);
    f = await fly(); ok(/^THE MOTHERSHIP · 0:0\d$/.test(f.shipText), `THE WARNING: "${f.shipText}"`);
    await shot(p, `h6a/ship/${look}-1-the-warning.png`);
    await L('window.__jwLab.setT(6 * 60 * 60 - 150)'); await sleep(1500);
    await shot(p, `h6a/ship/${look}-2-the-warning-last-seconds.png`);
    const taken = await waitFor(p, "window.__jwLab.state().st === 'taken'", 8000);
    ok(taken, 'at the cap every kid still in is lifted (the run\'s state: taken — the internal key)');
    const t1 = Date.now(), at = async ms => { const d = ms - (Date.now() - t1); if (d > 0) await sleep(d); };
    await at(520); await shot(p, `h6a/ship/${look}-3-the-arrival.png`);
    await at(1350); await shot(p, `h6a/ship/${look}-4-the-lift.png`);
    await at(2250); await shot(p, `h6a/ship/${look}-5-the-lift-higher.png`);
    await at(2800); await shot(p, `h6a/ship/${look}-5b-into-the-port.png`);   // (H6B: the kids' lights reaching the port)
    ok(!(await L('window.__jwLab.state().shown')), 'the end\'s words wait for the lift (the scene is held ≈ 4 s)');
    await waitFor(p, 'window.__jwLab.state().shown', 8000);
    const line = await L('window.__jwLab.state().line');
    ok(line === 'MADE IT TO THE MOTHERSHIP', `its words: ${line}`);
    ok(!/TAKEN/.test(await L('document.body.innerText')), 'nothing a player reads says TAKEN');
    await sleep(300); await shot(p, `h6a/ship/${look}-6-the-lab-end.png`);
  }
}
