// CITY 2.0 — THE HARBOR end to end: the `street` cloud job's groups (speakeasy, sounds, people, motion, freeze) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=street, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, SHOTS, t0, log, sleep, ok, okT, GR, NIGHT, open, ev, waitFor, tapAt, harborUp, settled, G } from './kit.mjs';

// ================================================================ PART 7a — THE SPEAKEASY (ONLY=speakeasy)
G('speakeasy', async () => {
  // a pixel of the main canvas (pt), after the scene drew; a window's centre
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  const settle = p => waitFor(p, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 20000);
  // ---- the night: the rooms lit, the edge windows half cut, the blade sign (the corner as it is), the knock's door unchanged
  { const Q = await open({ slot: 'sp1', qs: `${NIGHT}&force=no-people,vig-canvas`, view: [402, 874] }); // (SKY-B: these probes read the CANVAS's pixels — the vignette is a page layer now; vig-canvas puts it back in the canvas: the same picture they judged)   // (8P: nobody walking through the light probes)
    await harborUp(Q.page); await settle(Q.page);
    // (6b, FP3b's Known issue: the light probes below read at ONE tier on every machine — the cloud's runner sat at a lower tier, where
    // the pole's halo + its light on the brick are drawn differently: its far point read +17 there, 0.0 here. setTier pins it: no auto steps)
    await ev(Q.page, 'window.__district.setTier(2)'); await settle(Q.page);
    await waitFor(Q.page, 'window.__district.harbor().speakeasy.k > 0.9', 'the city powered on (the rooms lit)', 20000);
    const sp = await ev(Q.page, '(() => { const s = window.__district.harbor().speakeasy; return { ...s, wins: s.windows() }; })()');
    ok(sp.wins.length === 6 && ['edge2', 'bar', 'jazz', 'edge3', 'apartment', 'back'].every(id => sp.wins.some(w => w.id === id)), `THE SPEAKEASY: six windows with their rooms (${sp.wins.map(w => w.id).join(', ')})`);
    const edge = sp.wins.filter(w => w.edge), seen = edge.map(w => (w.rect.x + w.rect.w) / w.rect.w);
    ok(edge.length === 2 && seen.every(v => v > 0.35 && v < 0.65), `THE EDGE WINDOWS: the screen's left edge cuts each at about half (${seen.map(v => Math.round(v * 100) + ' %').join(', ')} showing)`);
    ok(sp.k > 0.9 && sp.lit && !sp.turned && sp.ad, `THE ROOMS LIT AT NIGHT (k ${sp.k}); the corner as it is; this week's ad: ${sp.ad} (on the blade sign)`);
    // (6b: the condition, polled — the cloud read rgb 150,92,45 once while the room's light was still ramping up)
    const bar = sp.wins.find(w => w.id === 'bar').rect; let c = [0, 0, 0];
    // (WIN2 — ACT BIG: the bar's back wall is darker under the lit people (WALL_DARK 0.6: rgb ~101,69,55 on the runner, 103,81,76 here) — still warm)
    for (let i = 0; i < 40 && !(c[0] > 90 && c[0] > c[2] + 20); i++) { if (i) await sleep(250); c = await px(Q.page, bar.x + bar.w * 0.5, bar.y + bar.h * 0.28); }
    ok(c[0] > 90 && c[0] > c[2] + 20, `THE BAR at night: warm light in its window (rgb ${c.join(',')}; the wall darker under the lit people since WIN2)`);
    const board = (await ev(Q.page, 'window.__district.harbor().neon')).boards[0];
    ok(!board || board.game !== sp.ad, `THE AD never doubles tonight's billboard (board ${board && board.game}, ad ${sp.ad})`);
    ok(sp.mb < 4, `THE SPEAKEASY's live layer: ${sp.mb} MB`);
    // FP — THE BARBER POLE at night: the hero light of the shopfront (its glass brighter than the sconce's + the shop lamp's glow), turning
    // smoothly (the phase moving at the slow night pace between samples); the raid's hook snaps it dark + still, then gives it back
    { const lumA = cs => Math.max(...cs.map(c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]));
      const pr = sp.poleRect, col = async () => { const o = []; for (const f of [0.25, 0.4, 0.55, 0.7]) o.push(await px(Q.page, pr.x + pr.w * 0.5, pr.y + pr.h * f)); return o; };
      const lp = lumA(await col()), ga = sp.glowAt;
      // (the sconce + the shop lamp: their glow's mean over a 6 × 6 pt patch round each — a bulb is a point; the pole's glass a column)
      const patch = async ([X, Y]) => { let t = 0, n = 0; for (let dx = -3; dx <= 3; dx += 1.5) for (let dy = -3; dy <= 3; dy += 1.5) { const c = await px(Q.page, X + dx, Y + dy); t += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; n++; } return t / n; };
      const ls = await patch(ga.sconce), ll = await patch(ga.lamp);
      ok(pr && lp > 150 && lp > ls * 1.1 && lp > ll * 1.1, `THE POLE lit at night: its glass ${lp.toFixed(0)} — brighter than the sconce (${ls.toFixed(0)}) + the shop lamp (${ll.toFixed(0)}): the hero light of the shopfront`);
      const ph0 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), t0 = Date.now();
      await sleep(1500);
      const ph1 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), d = ((ph1 - ph0 + 1) % 1) / ((Date.now() - t0) / 1000);
      okT(d > 0.08 && d < 0.3, `THE POLE turns slowly at night: ${d.toFixed(3)} periods a second`);
      // FP2 — red / white / blue on a normal night (vivid through the LED-lit glass)
      { const cs = []; for (let f = 0.15; f < 0.86; f += 0.035) cs.push(await px(Q.page, pr.x + pr.w * 0.3, pr.y + pr.h * f));   // (8P: off the LED core down the middle — a red stripe under it read pink, g 120–121 vs < 120)
        ok(cs.some(c => c[0] > 180 && c[0] > c[1] + 60 && c[0] > c[2] + 50) && cs.some(c => c[2] > 180 && c[0] < 140) && cs.some(c => Math.min(...c) > 200), `THE POLE at night: red, blue + a bright cool white on the glass (${cs.slice(0, 6).map(c => c.join(',')).join(' · ')}…)`); }
      // FP2 — THE SLIDE, frame by frame: the stripes' rendered offset (the column's fundamental, in device px) follows the clock's phase on
      // every drawn frame — even, never a stall or a jump (the owner: "still jittery")
      { const run = await ev(Q.page, `new Promise(res => { const hb = window.__district.harbor(), r = hb.speakeasy.poleRect, cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, g = cv.getContext('2d');
          const x = Math.round((r.x + r.w / 2) * k), y0 = Math.round((r.y + r.w * 0.6) * k), y1 = Math.round((r.y + r.h - r.w * 0.6) * k), rows = []; let last = '', n = 0;
          const tick = ts => { const d = g.getImageData(x - 1, y0, 3, y1 - y0).data, pf = []; for (let i = 0; i < y1 - y0; i++) { let s = 0; for (let j = 0; j < 3; j++) s += d[(i * 3 + j) * 4] - d[(i * 3 + j) * 4 + 2]; pf.push(s / 3); }
            const key = pf.join(','); if (key !== last) { last = key; rows.push({ ts, pf, ph: window.__district.harbor().speakeasy.polePh }); } if (++n < 50) requestAnimationFrame(tick); else res({ rows, Pd: 4.4 * (r.w / 2) * k }); };
          requestAnimationFrame(tick); })`);
        const Pd = run.Pd, phaseOf = pf => { const m = pf.reduce((a, b) => a + b, 0) / pf.length; let re = 0, im = 0; pf.forEach((v, i) => { re += (v - m) * Math.cos(2 * Math.PI * i / Pd); im += (v - m) * Math.sin(2 * Math.PI * i / Pd); }); return Math.atan2(im, re) / (2 * Math.PI) * Pd; };
        const wrap = v => { while (v > Pd / 2) v -= Pd; while (v < -Pd / 2) v += Pd; return v; };
        const res = [0], st = [];
        for (let i = 1; i < run.rows.length; i++) { const m = wrap(phaseOf(run.rows[i].pf) - phaseOf(run.rows[i - 1].pf)), dph = run.rows[i].ph - run.rows[i - 1].ph, e = -((dph + 1.5) % 1 - 0.5) * Pd; st.push(m); res.push(res[i - 1] + m - e); }
        const mr = res.reduce((a, b) => a + b, 0) / res.length, dev = Math.max(...res.map(v => Math.abs(v - mr)));
        ok(st.every(s => s < 0), `THE POLE'S SLIDE: ${run.rows.length} drawn frames, every one moving the same way (steps ${Math.min(...st.map(Math.abs)).toFixed(2)}–${Math.max(...st.map(Math.abs)).toFixed(2)} px)`);
        okT(run.rows.length >= 12 && dev < 0.45, `THE POLE'S SLIDE in time: ${run.rows.length} drawn frames, within ${dev.toFixed(2)} px of the clock`); }
      // FP2 — NO SMOKE: what the lit pole adds round it (lit − the raid's dark) — light on the brick right beside the glass, nothing ~15 pt
      // away (FP's warm wash reached ~28 pt: ~17–20 levels at 15 pt; the noise floor here ±5)
      const lumP = async ([X, Y]) => { let t = 0, n = 0; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const c = await px(Q.page, X + dx, Y + dy); t += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; n++; } return t / n; };
      await waitFor(Q.page, 'window.__district.harbor().speakeasy.k > 0.985', 'the power-on done (the city still brightening would read as a difference)', 15000).catch(() => {});
      // (FP3b, FREV A5: GATED, not moved — the basement's passing shadows + its flicker and the shop's mirror door are held still while
      // the probe reads, so only the pole's own light differs between its two readings)
      await ev(Q.page, 'window.__district.harbor().speakeasy.quiet(true)'); await sleep(200);
      const pcx = pr.x + pr.w / 2, mid = pr.y + pr.h / 2;
      const nearAt = [[pr.x - 3.5, mid], [pr.x + pr.w + 3.5, mid - 6]], farAt = [[pcx + 15, mid + 6], [pcx, pr.y - 15], [pcx - 16, pr.y + 4], [pcx + 28, mid]];
      const on1 = { near: [], far: [] }; for (const p of nearAt) on1.near.push(await lumP(p)); for (const p of farAt) on1.far.push(await lumP(p));
      await ev(Q.page, 'window.__district.harbor().speakeasy.pole({ on: false })');
      await sleep(300);
      const a = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'); await sleep(500);
      const b = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), ld = lumA(await col());
      ok(a === b && ld < lp * 0.6, `THE RAID's hook: the pole dark (${ld.toFixed(0)}) + still`);
      { const nd = []; for (const [i, p] of nearAt.entries()) nd.push(on1.near[i] - await lumP(p)); const fd = []; for (const [i, p] of farAt.entries()) fd.push(on1.far[i] - await lumP(p));
        ok(Math.max(...nd) > 10, `THE POLE's light on the brick beside it +${nd.map(v => v.toFixed(1)).join(' / +')}`);
        // (6b: a WARNING — one far point read +15–18 in the cloud only (0.0 on every local run) over two FP3b runs; the tier is pinned to 2
        // above, the likeliest cause; a warning until a cloud run shows it's gone — the look itself is checked by eye at phone size)
        ok(fd.every(v => Math.abs(v) < 6), `NO SMOKE round the pole: ~15–28 pt away ${fd.map(v => v.toFixed(1)).join(' / ')} (≈ 0)`); }
      await ev(Q.page, 'window.__district.harbor().speakeasy.quiet(false)');
      await ev(Q.page, 'window.__district.harbor().speakeasy.pole({ on: true })');
      // (the condition, not a fixed pause: the parallel run's loaded frames can take longer than 400 ms to show it)
      let lit = 0; for (let i = 0; i < 25 && !(lit > lp * 0.85); i++) { await sleep(200); lit = lumA(await col()); }
      ok(lit > lp * 0.85, `THE RAID over: the pole lit again (${lit.toFixed(0)} vs ${lp.toFixed(0)})`); }
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}speakeasy-night-402x874.png` });
    await Q.ctx.close(); }
  // ---- FP2: a PARTY night — the pole's stripes in the party's neon (magenta + electric blue on gold), the same slow turn
  { const Q = await open({ slot: 'sp3', qs: `${NIGHT}&force=party`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, 'window.__district.harbor().speakeasy.k > 0.9 && window.__district.party().on > 0.9', 'the party on, the rooms lit', 20000);
    const sp = await ev(Q.page, 'window.__district.harbor().speakeasy'), pr = sp.poleRect;
    // (TWO columns down the glass, at 0.25 + 0.75 of its width, read in ONE frame BETWEEN beats — the punch washes every colour toward white
    // for a moment, and a column read pixel by pixel over ~20 frames on the loaded cloud machine always caught one; up to 5 tries. Never the
    // centre: the lit pole's LED core runs down the middle and adds ≈ (118, 122, 128) there — FREV B5 — so either column passing is the pole)
    const party = cs => cs.some(c => c[0] > 180 && c[2] > 100 && c[1] < 130) && cs.some(c => c[2] > 180 && c[0] < 150), red = cs => cs.some(c => c[0] > 180 && c[1] < 110 && c[2] < 90);
    const column = () => ev(Q.page, `new Promise(res => { const t0 = performance.now(); const tick = () => { const p = window.__district.party() || {};
      if (!(p.beatU > 0.55 && p.beatU < 0.88) && performance.now() - t0 < 3000) return requestAnimationFrame(tick);
      const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, x = cv.getContext('2d'), out = [];
      for (const fx of [0.25, 0.75]) { const c = []; for (let f = 0.15; f < 0.86; f += 0.035) c.push(Array.from(x.getImageData(Math.round((${pr.x} + ${pr.w} * fx) * k), Math.round((${pr.y} + ${pr.h} * f) * k), 1, 1).data).slice(0, 3)); out.push(c); }
      res({ cols: out, u: p.beatU, punch: p.punch }); }; requestAnimationFrame(tick); })`);
    let cs = [], sawRed = false, at = null, good = false;
    for (let k = 0; k < 5; k++) { const r = await column(); at = r; sawRed ||= r.cols.some(red); const hit = r.cols.find(party); cs = hit || r.cols[0]; if (hit) { good = true; break; } await sleep(300); }
    ok(!sawRed, `THE POLE on a party night: no plain red (${cs.slice(0, 6).map(c => c.join(',')).join(' · ')}…)`);
    ok(good, `THE POLE on a party night: neon magenta + electric blue (read between beats: beatU ${at && at.u != null ? at.u.toFixed(2) : '?'}, punch ${at && at.punch != null ? (+at.punch).toFixed(2) : '?'}; ${cs.slice(0, 6).map(c => c.join(',')).join(' · ')}…)`);
    const ph0 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), t0 = Date.now(); await sleep(1500);
    const ph1 = await ev(Q.page, 'window.__district.harbor().speakeasy.polePh'), d = ((ph1 - ph0 + 1) % 1) / ((Date.now() - t0) / 1000);
    okT(d > 0.08 && d < 0.3, `THE POLE's party turn: the same slow turn (${d.toFixed(3)} periods a second)`);
    await Q.ctx.close(); }
  // ---- by day: the windows not lit, the basement's amber still glowing (the one hint), the pole turning
  { const Q = await open({ slot: 'sp2', qs: `when=2026-10-22T12:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    const sp = await ev(Q.page, '(() => { const s = window.__district.harbor().speakeasy; return { ...s, wins: s.windows() }; })()');
    const bar = sp.wins.find(w => w.id === 'bar').rect, c = await px(Q.page, bar.x + bar.w * 0.5, bar.y + bar.h * 0.28);
    ok(sp.k < 0.05 && !(c[0] > 150 && c[0] > c[2] + 60), `BY DAY: the rooms unlit (k ${sp.k}), the bar's glass not glowing (rgb ${c.join(',')})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}speakeasy-day-402x874.png` });
    await Q.ctx.close(); }
});
// ================================================================ PART 8a — THE CITY SOUNDS (ONLY=sounds; docs/audio.md#the-city-sounds)
G('sounds', async () => {
  const { SLOTS, filledSlots } = await import('../../../js/core/city-sounds.js');
  const SND = 'window.__district.harbor().sounds';
  const PLAYER = "import('/js/audio/city-sound.js')";
  const loops = p => ev(p, `${SND}.player.loops`);
  // ---- 1. BY DAY (1 pm): silent until the first tap; then the bed — the water + the DAY hum (the night hum not even loaded)
  // (&force=no-planes: a passing airliner's flyby — 2.7 MB decoded — would cloud the bed's memory check)
  const P = await open({ slot: 'sd', qs: `when=2026-10-22T13:00${GR}&panel=1&force=no-planes`, view: [402, 874] });
  await harborUp(P.page);
  const l0 = await loops(P.page);
  ok(l0.every(l => !l.voices), `BED: nothing sounds before the first tap (audio locked: ${l0.map(l => l.slot).join(', ') || 'no loops'})`);
  await tapAt(P.page, 30, 300);
  await waitFor(P.page, `${SND}.player.loops.filter(l => l.ready && l.voices > 0).length >= 2`, 'the bed sounding', 20000);
  const d = await ev(P.page, `(() => { const s = ${SND}; return { mix: s.mix, loops: s.player.loops, mb: s.player.mb, rate: s.player.decodeRate }; })()`);
  const has = id => d.loops.find(l => l.slot === id && l.voices > 0);
  ok(has('water-lapping') && has('city-hum-day') && !d.loops.some(l => l.slot === 'city-hum-night') && d.mix.day > 0.95 && d.mix.night < 0.05,
    `BED by day: water ${has('water-lapping') && has('water-lapping').gain} + the DAY hum ${has('city-hum-day') && has('city-hum-day').gain} (mix day ${d.mix.day} / night ${d.mix.night}, darkness ${d.mix.dark}); the night hum not loaded`);
  ok(d.mb > 0 && d.mb < 14, `BED: ${d.mb} MB decoded (mono; the water at 32 kHz, the hum at 16: ${d.rate} Hz)`);
  // FP — the water far + soft under the hum (its gain + a low-pass); the whole bed ducked while the music is on, back up with it off
  { const w = has('water-lapping'), hd = has('city-hum-day'), mOn = await ev(P.page, "import('/js/audio/settings.js').then(m => !m.settings.musicOff && !m.settings.muted && m.settings.music > 0.01)");
    ok(w.lp === 1600 && w.gain < hd.gain * 0.75 && (mOn ? d.mix.k < 0.8 : d.mix.k === 1),
      `FP BED: the water ${w.gain} through a ${w.lp} Hz low-pass, under the day hum ${hd.gain}; the music ${mOn ? 'on → ducked' : 'off →'} ×${d.mix.k}`);
    await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ musicOff: true }))");
    await waitFor(P.page, `${SND}.mix.k === 1 && ${SND}.player.loops.find(l => l.slot === 'city-hum-day').gain > ${hd.gain} + 0.005`, 'the bed up with the music off', 8000).catch(() => {});
    const off = await ev(P.page, `(() => { const s = ${SND}; return { k: s.mix.k, hum: (s.player.loops.find(l => l.slot === 'city-hum-day') || {}).gain }; })()`);
    ok(off.k === 1 && off.hum > hd.gain, `FP BED: MUSIC OFF → the bed is the main sound (×${off.k}: the day hum ${hd.gain} → ${off.hum})`);
    await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ musicOff: false }))"); }
  // ---- 2. a one-shot from a slot (the road's cars, the gulls) + an EMPTY slot is silent
  const r = await ev(P.page, `(() => { const s = window.__district.harbor().sounds, car = s.play('car-1920s-pass', { pan: -0.5 }), gull = s.play('gulls'), cat = s.play('sleigh-bells'), mute = s.loop('traffic-far');
    return { car: car && { take: car.take, peak: car.peak }, gull: gull && gull.take, cat, mute: !!mute.silent }; })()`);
  await sleep(600);
  const log = await ev(P.page, `${PLAYER}.then(m => m.cityLog.slice(-4).map(x => x.slot))`);
  ok(r.car && r.car.peak > 5 && /car-1920s-pass/.test(r.car.take) && r.gull && log.includes('car-1920s-pass') && log.includes('gulls'),
    `ONE-SHOTS: play('car-1920s-pass') → ${r.car && r.car.take} (nearest at ${r.car && r.car.peak} s); play('gulls') → ${r.gull}; both sounded (${log.join(', ')})`);
  ok(r.cat === null && r.mute, 'EMPTY SLOTS: play(\'sleigh-bells\') → null, loop(\'traffic-far\') → a silent handle (no error, no beep)');
  // ---- 3. THE SEAM: a loop started 4 s before its end crossfades into a fresh pass (2 voices for 2.5 s), then carries on with one
  const seam = await ev(P.page, `${PLAYER}.then(async m => { const h = m.cityLoop('city-hum-day', { start: 66, fadeIn: 1, gain: 0.01 }); const v = []; for (let i = 0; i < 18; i++) { await new Promise(r => setTimeout(r, 500)); v.push(h.debug().voices); } h.stop(0.2); return v; })`);
  ok(seam.includes(2) && seam[seam.length - 1] === 1 && seam.indexOf(2) > 0, `THE SEAM: voices over 9 s ${seam.join('')} — one pass, the crossfade (two), one again`);
  // ---- 4. EFFECTS OFF: the bed stops (nothing playing into a muted bus); back on, it comes back faded in
  await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ sfx: 0 }))");
  await waitFor(P.page, `${SND}.player.loops.every(l => !l.voices)`, 'the bed stops with the effects off', 5000);
  await ev(P.page, "import('/js/audio/settings.js').then(m => m.updateSettings({ sfx: 0.7 }))");
  await waitFor(P.page, `${SND}.player.loops.filter(l => l.voices > 0).length >= 2`, 'the bed back', 5000);
  ok(true, 'EFFECTS: off → the bed stops; on → it comes back');
  // ---- 5. THE PANEL's SOUNDS: every slot, filled / empty, ▶ on the filled ones only; ▶ plays it
  await ev(P.page, 'window.__district.remote().open()');
  await ev(P.page, "window.__district.remote().openCats(['sounds'])");
  await waitFor(P.page, "!!document.querySelector('.hr-sec[data-cat=\"sounds\"] .hr-snd')", 'the SOUNDS rows', 5000);
  const rows = await ev(P.page, `[...document.querySelectorAll('.hr-sec[data-cat="sounds"] .hr-snd')].map(r => ({ id: r.dataset.slot, filled: r.classList.contains('is-filled'), dis: r.querySelector('.hr-snd-play').disabled, st: r.querySelector('.hr-snd-st').textContent, h: r.getBoundingClientRect().height }))`);
  const filled = rows.filter(x => x.filled).map(x => x.id).sort();
  ok(rows.length === SLOTS.length && filled.join() === filledSlots().sort().join() && rows.every(x => x.filled !== x.dis) && rows.filter(x => !x.filled).every(x => x.st === 'EMPTY') && rows.every(x => x.h >= 44),
    `PANEL SOUNDS: ${rows.length} slots, ${filled.length} filled (${filled.join(', ')}), ▶ only on those, the rest EMPTY, rows ≥ 44 pt`);
  await ev(P.page, `(() => { const b = document.querySelector('.hr-snd[data-slot="water-lapping"] .hr-snd-play'); b.scrollIntoView({ block: 'center' }); b.click(); })()`);
  await waitFor(P.page, `${SND}.player.loops.filter(l => l.slot === 'water-lapping').length >= 2`, 'the preview loop', 5000);
  ok(true, 'PANEL SOUNDS: ▶ water-lapping plays a preview over the bed');
  await waitFor(P.page, "/water-lapping/.test(document.querySelector('.hr-snd-now').textContent)", 'the SOUNDING NOW line', 5000);
  if (SHOTS) { await ev(P.page, "document.querySelector('.hr-snd[data-slot=\"water-lapping\"]').scrollIntoView({ block: 'center' })"); await sleep(400); await P.page.screenshot({ path: `${OUT}sounds-panel-402x874.png` }); }
  await P.ctx.close();
  // ---- 6. AT NIGHT (10 pm): the NIGHT hum, not the day one; THE NEON TAP ~25 % quieter (dropout 0.5 × 0.5625)
  const N = await open({ slot: 'sn', qs: NIGHT, view: [390, 844] });
  await harborUp(N.page);
  await tapAt(N.page, 30, 300);
  // (FP3a: wait for the two loops checked — "any two" let the club's murmur, also a night bed, win the race against the hum's file)
  await waitFor(N.page, `(() => { const on = ${SND}.player.loops.filter(l => l.ready && l.voices > 0).map(l => l.slot); return on.includes('city-hum-night') && on.includes('water-lapping'); })()`, 'the night bed', 20000).catch(() => {});
  const n = await ev(N.page, `(() => { const s = ${SND}; return { mix: s.mix, loops: s.player.loops.filter(l => l.voices > 0).map(l => l.slot) }; })()`);
  ok(n.loops.includes('city-hum-night') && n.loops.includes('water-lapping') && !n.loops.includes('city-hum-day') && n.mix.night > 0.95, `BED at night: ${n.loops.join(' + ')} (mix night ${n.mix.night}, darkness ${n.mix.dark})`);
  const lr = await ev(N.page, "(() => { const s = document.querySelector('.nd-logo-wrap svg.nd-logo') || document.querySelector('svg.nd-logo'); const b = s.getBoundingClientRect(); return { x: b.left + b.width * 0.12, y: b.top + b.height / 2 }; })()");
  const n0 = await ev(N.page, "import('/js/audio/ambience.js').then(m => m.neonLog.length)");
  await tapAt(N.page, lr.x, lr.y);
  await waitFor(N.page, `import('/js/audio/ambience.js').then(m => m.neonLog.length >= ${n0} + 2)`, 'the tap\'s two sounds', 6000).catch(() => {});
  const tapLog = await ev(N.page, `import('/js/audio/ambience.js').then(m => m.neonLog.slice(${n0}).map(x => ({ name: x.name, gain: x.gain })))`);
  ok(tapLog.length >= 2 && tapLog.every(x => Math.abs(x.gain - 0.5 * 0.5625) < 1e-6), `NEON TAP: its dropout + power-on at ${tapLog.map(x => `${x.name.replace('neon-', '').replace('.wav', '')} ${x.gain}`).join(', ')} (was 0.375: × 0.75 ≈ −2.5 dB)`);
  // 11a-2 — THE TAP's HUM FOLLOWS THE RACE (the owner: "way too long"): the power-on cut + the hum faded ≤ 1.5 s in all; two quick taps
  // on another letter never stack (one strike, the cooldown)
  { const sl = await ev(N.page, 'window.__district.neonSoundLog()'), last = sl[sl.length - 1] || {};
    const pw = await ev(N.page, `import('/js/audio/ambience.js').then(m => m.neonLog.slice(${n0}).filter(x => /power-on/.test(x.name)).map(x => x.dur))`);
    ok(last.kind === 'tap' && last.total <= 1.5 && pw.length >= 1 && pw.every(d => d <= 1.5), `NEON TAP's HUM: ${last.kind} ${last.total} s in all, the strike ${pw.join(', ')} s (≤ 1.5 — it was 2.1 s + a hum held 1.5 s + a 10 s fade)`);
    const l2 = await ev(N.page, "(() => { const s = document.querySelector('.nd-logo-wrap svg.nd-logo') || document.querySelector('svg.nd-logo'); const b = s.getBoundingClientRect(); return { x: b.left + b.width * 0.62, y: b.top + b.height / 2 }; })()");
    await sleep(2600);
    const k0 = await ev(N.page, 'window.__district.neonSoundLog().length');
    await tapAt(N.page, l2.x, l2.y); await sleep(1700); await tapAt(N.page, l2.x + 40, l2.y); await sleep(1700);
    const k1 = await ev(N.page, `window.__district.neonSoundLog().slice(${k0})`);
    const gaps = k1.slice(1).map((x, i) => x.at - k1[i].at);
    ok(k1.length >= 1 && gaps.every(g => g >= 350), `NEON TAP: no stacking — ${k1.length} power-on(s), ${gaps.length ? `${gaps.join(', ')} ms apart` : 'one'} (each stops the last; ≥ 350 ms between strikes)`); }
  await N.ctx.close();
  // ---- 7. FP3 — THE CAR IN SYNC (the owner: its sound came 5–6 s after the car): every car file held back 2.5 s (a slow phone
  // network) — the take's PEAK still lands on the car's mid-crossing (it used to start whenever its file arrived: late by the wait);
  // the pass's own take; the car on screen for its take's crossing; the pan follows the car's side
  { const C = await open({ slot: 'sc', qs: `${NIGHT}&force=road-pass`, view: [402, 874] });
    await C.page.setRequestInterception(true);
    C.page.on('request', r => { if (r.isInterceptResolutionHandled()) return; if (/\/audio\/city\/car-/.test(r.url())) setTimeout(() => r.continue().catch(() => {}), 2500); else r.continue().catch(() => {}); });
    await harborUp(C.page);
    await tapAt(C.page, 30, 300);
    await waitFor(C.page, "import('/js/audio/engine.js').then(m => m.isUnlocked())", 'audio unlocked', 8000);
    await ev(C.page, 'window.__district.idle()');
    const res = await ev(C.page, `(async () => {
      const m = await import('/js/audio/city-sound.js'), cs = await import('/js/core/city-sounds.js'), seen = new Map(), t0 = performance.now();
      await new Promise(done => { const f = () => { const rd = window.__district.harbor().road; if (rd.car && rd.pass) { const now = performance.now(), s = seen.get(rd.pass.id) || { first: 1e12, last: 0, take: rd.pass.take, cross: rd.pass.cross }; s.first = Math.min(s.first, now); s.last = Math.max(s.last, now); seen.set(rd.pass.id, s); }
        if (performance.now() - t0 < 30000) requestAnimationFrame(f); else done(); }; f(); });
      const takes = cs.takesOf('car-1920s-pass');
      const sounds = m.cityLog.filter(x => x.slot === 'car-1920s-pass' && !x.late).map(x => { const t = takes.find(k => k.f === x.f); return { f: x.f, pan: x.pan, peakAt: x.at + (x.wait + t.peak - x.off) * 1000 }; });
      const late = m.cityLog.filter(x => x.slot === 'car-1920s-pass' && x.late).map(x => x.f);
      return { late, cars: [...seen.values()].filter(s => s.first > t0 + 200 && s.last < t0 + 29800).map(s => ({ mid: (s.first + s.last) / 2, on: (s.last - s.first) / 1000, cross: s.cross, f: takes[s.take].f })), sounds };
    })()`);
    // (PF: a sound is paired with its own car only — one whose peak lands within 8 s of it; a car whose sound was SKIPPED by design
    // (its file arrived under 1 s before the centre: `late`, silent rather than out of sync — the first pass after the page opened)
    // has none, and is listed as such — so may the FIRST car in the window on a slow machine: its file may not even arrive before it passes)
    const pairs = res.cars.map(c => { const s = res.sounds.filter(x => x.f === c.f && Math.abs(x.peakAt - c.mid) < 8000).sort((a, b) => Math.abs(a.peakAt - c.mid) - Math.abs(b.peakAt - c.mid))[0]; return { ...c, dt: s ? (s.peakAt - c.mid) / 1000 : null, skipped: !s && (res.late.includes(c.f) || c === res.cars[0]) }; });
    const heard = pairs.filter(q => !q.skipped);
    okT(heard.length >= 1 && heard.every(q => q.dt != null && Math.abs(q.dt) < 0.35) && pairs.every(q => Math.abs(q.on - q.cross) < 0.4),
      `FP3 — THE CAR IN SYNC (car files held back 2.5 s): ${pairs.map(q => `${q.f} on screen ${q.on.toFixed(2)} s (its swell's ${q.cross} s), its sound's peak ${q.skipped ? 'SKIPPED (late, silent by design)' : q.dt == null ? 'MISSING' : `${q.dt >= 0 ? '+' : ''}${q.dt.toFixed(2)} s`} from mid-crossing`).join(' · ')}`);
    ok(res.sounds.every(x => Math.abs(x.pan) <= 0.6 + 1e-6) && res.sounds.some(x => Math.abs(x.pan) > 0.3), `FP3 — THE PAN: each sound starts on its car's side, gentle (${res.sounds.map(x => x.pan).join(', ')}; ±0.6 at most)`);
    await C.ctx.close(); }
  // ---- 9e — THE STREET UNDER THE DOCK IS A STAGE + THE QUICK FADE (the owner, DECIDED): a car crossing that began at rest drives on under the
  // dock when a tap brings it back (never cut or faded); that tap's dock fades again in ~2 s; a further touch → the normal 10 s
  { const C = await open({ slot: 'stage9e', qs: `${NIGHT}&force=road-pass&idle=1`, view: [402, 874] });
    await harborUp(C.page);
    await waitFor(C.page, '(window.__district.idle(), window.__district.isIdle())', 'the dock at rest', 20000);
    await waitFor(C.page, 'window.__district.harbor().road.vis > 0.9 && window.__district.frontBusy()', 'a car crossing at rest, on screen', 45000).catch(() => {});
    const before = await ev(C.page, 'window.__district.harbor().road.vis');
    await tapAt(C.page, 200, 300);
    await sleep(400);
    const a = await ev(C.page, `({ vis: window.__district.harbor().road.vis, idle: window.__district.isIdle(), quick: window.__district.quickIdle() })`);
    await sleep(2300);
    const b = await ev(C.page, `({ idle: window.__district.isIdle() })`);
    await tapAt(C.page, 200, 300); await sleep(250); await tapAt(C.page, 200, 320); await sleep(2600);
    const c2 = await ev(C.page, `({ idle: window.__district.isIdle(), quick: window.__district.quickIdle() })`);
    ok(before > 0.9 && a.vis > 0.9 && !a.idle && a.quick && b.idle && !c2.idle && !c2.quick, `9e THE STAGE + THE QUICK FADE: the car at rest (${before}) drives on under the dock after the tap (${a.vis}); the dock back for the tap (${!a.idle}, quick ${a.quick}) and gone again 2.7 s later (${b.idle}); a second touch → the normal 10 s (still up 2.6 s on: ${!c2.idle})`);
    await C.ctx.close(); }
});
// ================================================================ 8P — THE PEOPLE (+ section 0's hush word sign + the lamps' life)
G('people', async () => {
  const P = 'window.__district.harbor()';
  let hushRect = null, hushRed = 0;
  // ---- C4a — THE CARS LIT THROUGH THE CROSSING (the owner: they passed through its light unlit): ONE car followed — its body's
  // brightness 8 u before the crossing vs on it ≥ 1.6× (the lamp-lit body through its tail → nose gradient: vehicles.js)
  const CARLIT = 1.12;   // (C4b: the crossing's light down hard — the car still brightens through it, gentler: was 1.6)
  { const Q = await open({ slot: 'pp-carlit', qs: `when=2026-09-16T22:30${GR}&wx=clear&force=vig-canvas`, view: [402, 874] }); // (SKY-B: these probes read the CANVAS's pixels — the vignette is a page layer now; vig-canvas puts it back in the canvas: the same picture they judged)   // (September: no holiday piece stands in front of the crossing — Halloween's giant hides it)
    await harborUp(Q.page);
    // C4b — THE CROSSWALK DIMMER (the owner: "you can see people and see the white stripes, just so you can see it's a crosswalk"): down the
    // crossing's middle, the stripes ≥ 2× the asphalt between them, the gaps dark (never washed grey), the stripes pale — never clipped white
    { await waitFor(Q.page, `!${P}.pending && !${P}.fading && ${P}.lightAudit().crossing > 0.8`, 'the crossing lit', 20000).catch(() => {}); await sleep(600);
      const sr = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const b = ${P}.promenade.stripes, cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, x = cv.getContext('2d');
        const cx = Math.round((b[0][0] + b[1][0]) / 2 * k), y0 = Math.round(Math.min(b[0][1], b[1][1]) * k), y1 = Math.round(Math.max(b[0][1], b[1][1]) * k), d = x.getImageData(cx - 6, y0, 13, y1 - y0).data, rows = [];
        for (let r = 0; r < y1 - y0; r++) { let s = 0; for (let c = 0; c < 13; c++) { const i = (r * 13 + c) * 4; s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; } rows.push(s / 13); }
        const so = [...rows].sort((a, b) => a - b), n = so.length, t = Math.max(1, Math.floor(n / 3)), lo = so.slice(0, t).reduce((a, b) => a + b, 0) / t, hi = so.slice(-t).reduce((a, b) => a + b, 0) / t;
        // (the bars: the profile's peaks — a peak, then a valley under 70 % of the smaller neighbour before the next; each bar's depth = its
        // rows above halfway between its peak + the deeper valley beside it, each gap's = the rows under halfway between the two)
        const pk = []; for (let i = 0; i < rows.length; i++) { const v = rows[i]; if (v < lo * 1.5 + 20) continue; if ((i === 0 || v >= rows[i - 1]) && (i === rows.length - 1 || v >= rows[i + 1])) { const p = pk[pk.length - 1]; if (p && Math.min(...rows.slice(p, i + 1)) > 0.7 * Math.min(rows[p], v)) { if (v > rows[p]) pk[pk.length - 1] = i; } else pk.push(i); } }
        const bars = [], gaps = [];
        pk.forEach((p, j) => { const vl = j ? Math.min(...rows.slice(pk[j - 1], p + 1)) : Math.min(...rows.slice(0, p + 1)), vr = j < pk.length - 1 ? Math.min(...rows.slice(p, pk[j + 1] + 1)) : Math.min(...rows.slice(p)), th = (rows[p] + Math.max(vl, vr)) / 2;
          let n = 0; for (let i = p; i >= 0 && rows[i] >= th; i--) n++; for (let i = p + 1; i < rows.length && rows[i] >= th; i++) n++; bars.push(n);
          if (j < pk.length - 1) { const seg = rows.slice(p, pk[j + 1] + 1), v = Math.min(...seg), t2 = (v + Math.min(rows[p], rows[pk[j + 1]])) / 2; gaps.push(seg.filter(x => x < t2).length); } });
        res({ lo: +lo.toFixed(1), hi: +hi.toFixed(1), max: +so[n - 1].toFixed(1), bars, gaps }); }))`);
      // NIGHT-C — A REAL ZEBRA (the owner, Oct 30: ~8 thin stripes read as one grey block): FIVE bars down the crossing's middle, the dark gaps
      // between them about as deep as the bars (each gap within ½–2× its neighbour bar's depth on screen, perspective and all)
      { const ok5 = sr.bars.length === 5 && sr.gaps.length === 4 && sr.gaps.every((g, i) => g >= 0.5 * sr.bars[i + 1] && g <= 2 * sr.bars[i]);
        ok(ok5, `NIGHT-C A REAL ZEBRA: ${sr.bars.length} bars (device px, near → far ${[...sr.bars].reverse().join(' / ')}) with gaps ${[...sr.gaps].reverse().join(' / ')} — five wide bars, each gap about a bar deep`); }
      ok(sr.hi >= 2 * sr.lo && sr.hi > 60 && sr.lo < 70 && sr.max < 235, `C4b THE CROSSWALK DIMMER: the stripes ${sr.hi} vs the gaps ${sr.lo} (× ${(sr.hi / Math.max(1, sr.lo)).toFixed(2)}, ≥ 2), the brightest ${sr.max} (< 235: never clipped white)`); }
    const lum = id => ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const h = ${P}, c = h.people.cars.find(o => o.id === ${JSON.stringify(id)}); if (!c || !c.at) return res(null);
      const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, d = cv.getContext('2d').getImageData(Math.round((c.at[0] - 6) * k), Math.round((c.at[1] - 3) * k), Math.round(12 * k), Math.round(6 * k)).data;
      let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; res({ l: s / (d.length / 4), dx: +(c.x - h.promenade.crossX).toFixed(2) }); }))`);
    let far = null, near = null, id = null;
    for (let tries = 0; tries < 3 && !(far && near); tries++) {
      id = null;
      for (const end = Date.now() + 60000; !id && Date.now() < end;) { id = await ev(Q.page, `(() => { const h = ${P}; const c = h.people.cars.find(o => { const dx = o.x - h.promenade.crossX; return Math.abs(dx) > 7.4 && Math.abs(dx) < 9 && dx * (o.lane === 'near' ? 1 : -1) < 0 && o.at; }); return c ? c.id : null; })()`).catch(() => null); if (!id) await sleep(60); }
      if (!id) break;
      far = await lum(id);
      await waitFor(Q.page, `(() => { const h = ${P}, c = h.people.cars.find(o => o.id === ${JSON.stringify(id)}); return !!c && Math.abs(c.x - h.promenade.crossX) < 0.6; })()`, 'the same car on the crossing', 20000).catch(() => {});
      near = await lum(id);
    }
    okT(far && near && near.l >= CARLIT * far.l, `C4a THE CARS LIT THROUGH IT: car ${id} — ${far ? far.l.toFixed(0) : '—'} at ${far ? far.dx : '—'} u → ${near ? near.l.toFixed(0) : '—'} on the crossing (${near ? near.dx : '—'} u): × ${far && near ? (near.l / far.l).toFixed(2) : '—'} (≥ ${CARLIT}: C4b's dimmer crossing — gentler)`);
    await Q.ctx.close(); }
  const settle = p => waitFor(p, `!${P}.pending && !${P}.fading`, 'settled', 20000);
  // the stage band's pixels, as one fingerprint (the A/B against &force=no-people)
  const band = p => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, c = ${P}.cam, y0 = Math.round((c.dock.y - 130) * k), h = Math.round(120 * k);
    const d = cv.getContext('2d').getImageData(0, y0, cv.width, h).data, out = []; for (let i = 0; i < d.length; i += 4 * 97) out.push(d[i] + d[i + 1] + d[i + 2]); res(out); }))`);
  // ---- PROM — THE CAB STAND: a waiter sits on the front bench (&force=cabstand); only once the dock RESTS does the taxi pull up on the
  // front street — the waiter gets in (gone from this device's promenade) and it drives off; with the dock up nothing comes
  { const Q = await open({ slot: 'pp-cab', qs: `when=2026-09-15T21:30${GR}&wx=clear&force=cabstand`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.members.some(m => m.kind === 'cabwait' && m.pose === 'sit')`, 'a waiter sitting at the cab stand', 40000).catch(() => {});
    await sleep(4500);
    const up = await ev(Q.page, `${P}.promenade.cabTaxi`);
    await ev(Q.page, 'window.__district.idle()');
    await waitFor(Q.page, `!!${P}.promenade.cabTaxi.run`, 'the taxi pulling up (the dock at rest)', 15000).catch(() => {});
    const run = await ev(Q.page, `${P}.promenade.cabTaxi`);
    await waitFor(Q.page, `(() => { const c = ${P}.promenade.cabTaxi; return !c.run && c.taken.length > 0; })()`, 'the taxi gone with its fare', 25000).catch(() => {});
    const done = await ev(Q.page, `${P}.promenade.cabTaxi`), still = await ev(Q.page, `${P}.people.members.filter(m => m.kind === 'cabwait').map(m => m.id)`);
    ok(!up.run && up.runs === 0 && run.run && done.taken.includes(run.run.vid), `PROM THE CAB STAND: no taxi with the dock up (${up.runs}); the dock rests → the taxi came for ${run.run ? run.run.vid : '—'} + took them (${done.taken.join(', ')})`);
    void still;
    await Q.ctx.close(); }
  // ---- midday (a Thursday): people out on the promenade, inside the cap, on screen + never under the dock; THE HUSH SIGN says OPEN
  { const Q = await open({ slot: 'pp1', qs: `when=2026-10-22T12:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    await waitFor(Q.page, `${P}.people.n >= 3`, 'people out at midday', 10000).catch(() => {});
    const pp = await ev(Q.page, `${P}.people`), cam = await ev(Q.page, `${P}.cam`);
    ok(pp.n >= 3 && pp.n <= 12, `THE PEOPLE at 12:30: ${pp.n} out (+ ${pp.dogs} dogs) — ${[...new Set(pp.members.map(m => m.kind))].join(', ')}`);
    // (PROM: the cab stand's bench stands at the front curb, z 38 — its waiters sit there, still above the dock: the check is on screen)
    { const footY = m => cam.VPY + cam.F * cam.CAMH / m.z, low = Math.max(...pp.members.map(footY));
      ok(pp.members.every(m => footY(m) < cam.dock.y - 4), `nobody under the dock (the lowest foot ${low.toFixed(0)} vs the dock ${cam.dock.y.toFixed(0)}; nearest z ${Math.min(...pp.members.map(m => m.z)).toFixed(2)}: ${pp.members.filter(m => m.z < 38.1).map(m => `${m.kind}/${m.role}@${m.z}`).join(' ')})`); }
    const hs = await ev(Q.page, `${P}.speakeasy.hush()`);
    ok(!hs.text && hs.lit === 0, `THE HUSH WORD SIGN at noon, no lobby: absent (${hs.text})`);
    const a = await band(Q.page);
    const O = await open({ slot: 'pp1b', qs: `when=2026-10-22T12:30${GR}&force=no-people`, view: [402, 874] });
    await harborUp(O.page); await settle(O.page);
    const b = await band(O.page), diff = a.reduce((s, v, i) => s + (Math.abs(v - b[i]) > 30 ? 1 : 0), 0);
    ok(diff > 8, `THE PEOPLE are drawn: the promenade's band differs from &force=no-people in ${diff} samples`);
    void cam; await O.ctx.close(); await Q.ctx.close(); }
  // ---- THE LOBBY LINE preview + THE HUSH SIGN with a lobby word at night (lit, letter by letter)
  { const Q = await open({ slot: 'pp2', qs: `when=2026-10-22T22:30${GR}&force=line,hushsign&n=6&hush=SWING`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    const pp = await ev(Q.page, `${P}.people`);
    ok(pp.line === 6, `THE LOBBY LINE: &force=line&n=6 → ${pp.line} guests at the door`);
    await waitFor(Q.page, `${P}.speakeasy.hush().since > 3`, 'the word lit through', 8000).catch(() => {});
    const hs = await ev(Q.page, `${P}.speakeasy.hush()`);
    hushRect = hs.rect;
    // (WIN: THE HUSH WORD ON THE WALL — the letters stacked on the corner pier's plate; nothing on the glass any more)
    const cyanShare = () => ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('canvas.nd-hushc'); if (!cv) { res(0); return; } const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i + 2] > 215 && d[i + 1] > 180) n++; res(n / (cv.width * cv.height)); }))`);
    let red = 0; for (let i = 0; i < 6 && red < 0.006; i++) { red = Math.max(red, await cyanShare()); if (red < 0.006) await sleep(400); }   // (the overlay redraws when a level moves — sampled a few times)
    hushRed = red;
    ok(hs.text === 'SWING' && hs.lit === 1 && hs.overlay && red > 0.006 && hs.rows.join('') === 'SWING', `THE HUSH WORD SIGN at night with a lobby: ${hs.rows.join(' / ')} stacked in ice-cyan neon tubes on the door's plate (${(red * 100).toFixed(1)} % of the plate glowing, ${hs.capPt} pt caps)`);
    // the plate INSIDE the corner pier's run, the letters inside the plate, a clear gap to the blade's board, the overlay = the plate — at
    // 402 / 390 / 430 (the live rects after each re-layout)
    const fits = [];
    const fit = async (w, h) => { const o = await ev(Q.page, `(() => { const s = ${P}.speakeasy.hush(), cv = document.querySelector('canvas.nd-hushc'), r = cv && cv.getBoundingClientRect(); return { w: ${P}.cam.W, inside: s.inside, inPier: s.inPier, gap: s.gapBlade, letters: s.letters, rect: s.rect, pier: s.pier, css: s.css, capPt: s.capPt, dom: r && { x: r.x, y: r.y, w: r.width, h: r.height } }; })()`);
      const domOk = o.dom && o.css && Math.abs(o.dom.x - o.css.x) < 1.5 && Math.abs(o.dom.y - o.css.y) < 1.5 && Math.abs(o.dom.w - o.css.w) < 1.5 && Math.abs(o.dom.h - o.css.h) < 1.5;
      const plateOk = o.rect && o.css && Math.abs(o.css.x - o.rect.x) <= 1.5 && Math.abs(o.css.y - o.rect.y) <= 1.5 && Math.abs(o.css.w - o.rect.w) <= 2.5 && Math.abs(o.css.h - o.rect.h) <= 2.5;
      fits.push({ w: o.w, inside: o.inside, inPier: o.inPier, gap: o.gap, domOk, plateOk, capPt: o.capPt, rect: o.rect }); return o; };
    await fit(402, 874);
    for (const [w, h] of [[390, 844], [430, 932]]) { await Q.page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await waitFor(Q.page, `${P}.cam.W === ${w}`, 'the re-layout', 8000).catch(() => {}); await sleep(700); await fit(w, h); }
    ok(fits.length === 3 && fits.every(f => f.inside && f.inPier && f.gap != null && f.gap >= 3 && f.domOk && f.plateOk && f.capPt >= 11), `THE WALL SIGN IN ITS PIER at ${fits.map(f => f.w).join(' / ')}: ${fits.map(f => `${f.w}: letters ${f.inside ? 'in the plate' : 'OUTSIDE'}, the plate ${f.inPier ? 'in the pier' : 'OFF THE PIER'} (${f.rect ? `${f.rect.w.toFixed(1)}×${f.rect.h.toFixed(1)} pt` : '?'}), ${f.gap} pt to the blade, ${f.capPt} pt caps`).join(' · ')}`);
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'pp3', qs: `when=2026-10-22T22:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await settle(Q.page);
    const hs = await ev(Q.page, `${P}.speakeasy.hush()`), lamps = await ev(Q.page, `${P}.lampLife()`);
    const red0 = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('canvas.nd-hushc'); if (!cv) { res(0); return; } const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200 && d[i + 2] > 215 && d[i + 1] > 190 && d[i + 2] > d[i] + 50) n++; res(n / (d.length / 4)); }))`);
    ok(!hs.text && hs.lit === 0 && !hs.overlay && red0 < hushRed / 3, `THE HUSH WORD SIGN at night, no lobby: absent (the pier's neon cyan ${(red0 * 100).toFixed(2)} % vs ${(hushRed * 100).toFixed(2)} % with the word)`);
    ok(lamps && lamps.levels.length >= 4 && lamps.levels.filter((v, i) => !(lamps.moment && lamps.moment.i === i)).every(v => v === 1), `THE LAMPS' LIFE at 10:30 pm: every lamp on (${lamps && lamps.levels.join(' ')}; switch-on order ${lamps && lamps.th.join(' ')})`);
    await Q.ctx.close(); }
  // ---- THE BUS (&force=bus: one a minute): it comes, stops at the curb short of the crossing with its door open, then goes
  { const Q = await open({ slot: 'pp4', qs: `when=2026-10-22T11:00${GR}&force=bus`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.buses.some(b => b.door)`, 'a bus at the stop, its door open', 60000);
    const pp = await ev(Q.page, `${P}.people`), cw = await ev(Q.page, `${P}.crossing`), b = pp.buses.find(x => x.door);
    ok(b && Math.abs(b.x - b.stop) < 0.05, `THE BUS stopped at the curb (x ${b && b.x}, its stop ${b && b.stop}), door open`);
    // (C4d — THE DWELL: the owner, Oct 29 "it waits too long" — away 1–2 s after the door is shut, never a long idle at the stop)
    const shutAt = await ev(Q.page, `new Promise(res => { const t0 = performance.now(), iv = setInterval(() => { const b = ${P}.people.buses.find(x => Math.abs(x.x - x.stop) < 0.05); if (!b || b.doorPhase === 'shut' || performance.now() - t0 > 30000) { clearInterval(iv); res(performance.now()); } }, 50); })`);
    const goneAt = await ev(Q.page, `new Promise(res => { const t0 = performance.now(), iv = setInterval(() => { const b = ${P}.people.buses.find(x => Math.abs(x.x - x.stop) < 0.05); if (!b || performance.now() - t0 > 40000) { clearInterval(iv); res(performance.now()); } }, 50); })`);
    ok((goneAt - shutAt) / 1000 < 3, `THE BUS's DWELL (C4d): away ${((goneAt - shutAt) / 1000).toFixed(1)} s after its door is shut (C4c's: ~13 s on average)`);
    void cw; await Q.ctx.close(); }
  // ---- C4d — &force=dogwalk (the owner's dog check): a walker + dog on screen within ~10 s of the scene, by night
  { const Q = await open({ slot: 'pp-dog', qs: `when=2026-10-29T19:12${GR}&wx=clear&force=dogwalk`, view: [402, 874] });
    await harborUp(Q.page);
    const t0 = Date.now();
    await waitFor(Q.page, `${P}.people.dogs > 0 && ${P}.people.rigs().some(r => r.kind === 'dogwalker' && /^dw\./.test(r.id) && r.fx > 20 && r.fx < 382)`, 'a forced dog walk on screen', 20000);
    okT(Date.now() - t0 < 12000, `&force=dogwalk (C4d): a walker + dog on screen ${((Date.now() - t0) / 1000).toFixed(1)} s after the reveal`);
    // HOTFIX Oct 29 — THE DOG's TURN in the real page: every frame for 20 s — it never moves faster than a scamper round its walker
    // (~8 u / s; the old side-to-side jump was 1.85 u in one frame ≈ 110 u / s), its facing never flips back within ½ s
    const tr = await ev(Q.page, `new Promise(res => { const out = [], t0 = performance.now(); const f = () => { const p = window.__district.harbor().people; out.push({ t: performance.now(), d: p.dogAt || [] }); if (performance.now() - t0 < 20000) requestAnimationFrame(f); else res(out); }; requestAnimationFrame(f); })`);
    let fast = 0, back = 0, n = 0, worst = 0; const last = new Map(), flip = new Map();
    for (const fr of tr) for (const d of fr.d) {
      const q = last.get(d.id), sg = Math.cos(d.hd) < 0 ? -1 : 1;
      if (q && fr.t - q.t < 120) { const v = Math.hypot(d.x - q.x, d.z - q.z) / Math.max(1 / 60, (fr.t - q.t) / 1000); n++; worst = Math.max(worst, v); if (v > 11) fast++;
        if (q.sg !== sg) { if (fr.t - (flip.get(d.id) || -1e9) < 500) back++; flip.set(d.id, fr.t); } }
      last.set(d.id, { t: fr.t, x: d.x, z: d.z, sg });
    }
    ok(n > 100 && fast === 0 && back === 0, `THE DOG's TURN (HOTFIX Oct 29) in the page, 20 s: ${n} dog frames, the fastest ${worst.toFixed(1)} u/s (≤ 11), ${fast} faster, ${back} facing flips back within ½ s`);
    await Q.ctx.close(); }
  // ---- THE ROOF on a party night: guests up there (through the hatch), the promenade's party guests
  { const Q = await open({ slot: 'pp5', qs: `when=2026-10-24T21:45${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    const pp = await ev(Q.page, `${P}.people`);
    ok(pp.roof >= 2 && pp.roof <= 6, `THE ROOF on a party night: ${pp.roof} guests (${pp.roofMembers.map(m => m.pose).join(', ')})`);
    await Q.ctx.close(); }

});
// ================================================================ PEO — THE PEOPLE'S MOTION (ONLY=motion; the `street` cloud job)
// A trace of every drawn figure's rig ON SCREEN, frame by frame (harbor().people.rigs(), read right after the scene's own rAF: the state
// the screen shows) on a weekday afternoon and on a party night's dance circle. Judged per figure and dt-NORMALISED (the cloud's software
// GL draws ~8–10 fps, a phone 60): a walker never JUDDERS (a frame under half its median speed beside one over 1.5× — the stop-then-double
// signature of uneven frames; ≤ 1 % of its walking frames; the single worst step ≤ 4× as a warning), the planted foot never
// skates on a straight (under 25 % of the body's speed; a turn is reported — the rig pivots about its middle there; a partner used to swing
// round the lead at 28 px/s, 3× the body's speed, on the planner's shared distance: now the lead's own ~11), the pace + cadence in the human range, and the city at 60 fps while anyone walks
// ('people' in rate.fast — the 30 ↔ 60 flips were the owner's afternoon stutter); the dancers' arms never jump (the hand's angle about
// the shoulder: never over 1 rad between two frames closer than 60 ms, and under 20 rad/s at the p99 — the hand's angle carries the bend + the foreshortening too).
const motionTrace = secs => `new Promise(res => { const D = window.__district, out = [], t0 = performance.now();
  (function loop() { const h = D.harbor(), lp = D.loop();
    out.push({ t: performance.now(), drawn: lp ? lp.drawn : 0, fast: h.rate ? h.rate.fast : '', rigs: h.people.rigs().map(r => ({ id: r.id + '|' + r.role, kind: r.kind, pose: r.pose, hd: r.hd || 0, y: r.y || 0, v: r.v, fx: r.fx, fy: r.fy, H: r.H, feet: r.feet, planted: r.planted, heel: r.heel, hands: r.hands, shs: r.shs })) });
    if (performance.now() - t0 < ${secs * 1000}) requestAnimationFrame(loop); else res(out); })(); })`;
function motionReport(frames) {
  const D = []; for (let i = 1; i < frames.length; i++) if (frames[i].drawn !== frames[i - 1].drawn) D.push(frames[i]);
  const med = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const pct = (a, q) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * q))]; };
  const by = new Map(); for (const f of D) for (const r of f.rigs) { if (!by.has(r.id)) by.set(r.id, []); by.get(r.id).push({ t: f.t, ...r }); }
  const walkers = [], dancers = [];
  for (const [id, seq] of by) {
    const sp = [], slide = [], slideT = [], ang = []; let plants = 0, walkT = 0, jump = 0, prevA = null, maxRs = 0, wandsT = null;
    for (let i = 1; i < seq.length; i++) {
      const a = seq[i - 1], b = seq[i], dt = (b.t - a.t) / 1000; if (dt <= 0 || dt > 0.3) { prevA = null; wandsT = null; continue; }
      // (C4d — F7: a "jump" counted only once the dancer has danced ≥ 1 s (still arriving when the trace starts at dance.k > 0.9) and only
      // after a NORMAL-length frame (the runner's 50–100 ms pacing made dt < 0.06 itself an accident: a short frame after a long one)
      const dt0 = i > 1 ? (a.t - seq[i - 2].t) / 1000 : 1;
      if (a.pose === 'wands' && b.pose === 'wands') {
        if (wandsT == null) wandsT = a.t;
        const settled = b.t - wandsT >= 1000 && dt0 > 0 && dt0 < 0.06;
        const an = [0, 1].map(k => Math.atan2(b.hands[k][1] - b.shs[k][1], b.hands[k][0] - b.shs[k][0])), ln = [0, 1].map(k => Math.hypot(b.hands[k][1] - b.shs[k][1], b.hands[k][0] - b.shs[k][0]));
        // (an arm pointing at / away from us mid-spin projects to a 1–2 px stub — its screen angle means nothing: skipped under 0.12 heights)
        if (prevA) for (let k = 0; k < 2; k++) { if (ln[k] < 0.12 || prevA.ln[k] < 0.12) continue; let d = an[k] - prevA[k].a; d = Math.atan2(Math.sin(d), Math.cos(d)); ang.push(Math.abs(d) / dt); if (settled && dt < 0.06 && Math.abs(d) > 1) jump++; if (Math.abs(d) / dt > maxRs) maxRs = Math.abs(d) / dt; }
        prevA = { ...an.map((v, k) => ({ a: v, ln: ln[k] })), ln }; continue;
      }
      prevA = null; wandsT = null;
      if (!(a.pose === 'walk' && b.pose === 'walk' && a.v > 0.1 && b.v > 0.1)) continue;
      const d = Math.hypot(b.fx - a.fx, b.fy - a.fy); sp.push(d / dt); walkT += dt;
      for (let k = 0; k < 2; k++) {
        if (!a.planted[k] && b.planted[k]) plants++;
        if (a.planted[k] && b.planted[k] && a.heel[k] === 0 && b.heel[k] === 0 && a.y === b.y) { const s0 = Math.hypot((b.fx + b.feet[k][0] * b.H) - (a.fx + a.feet[k][0] * a.H), (b.fy - b.feet[k][1] * b.H) - (a.fy - a.feet[k][1] * a.H)) / dt; (Math.abs(b.hd - a.hd) < 0.005 ? slide : slideT).push(s0); }
      }
    }
    if (ang.length > 60) dancers.push({ id, n: ang.length, p99: +pct(ang, 0.99).toFixed(1), max: +maxRs.toFixed(1), jumps: jump });
    // (JUDDER = the stop-then-double signature of uneven frames — a frame under half the figure's median speed beside one over 1.5× — not a
    // single fast moment (a partner stepping round the lead can legitimately double for a frame))
    let judder = 0; { const m = med(sp); for (let i = 0; i < sp.length; i++) if (sp[i] < 0.5 * m && ((i > 0 && sp[i - 1] > 1.5 * m) || (i + 1 < sp.length && sp[i + 1] > 1.5 * m))) judder++; }
    if (sp.length >= 20) { const m = med(sp); walkers.push({ id, kind: seq[0].kind, n: sp.length, pxs: +m.toFixed(1), judder, ratio: +(Math.max(...sp) / (m || 1e-9)).toFixed(2), slide: +(pct(slide, 0.95) / (m || 1e-9)).toFixed(2), slideT: slideT.length >= 8 ? +(pct(slideT, 0.95) / (m || 1e-9)).toFixed(2) : null, spm: walkT > 3 ? Math.round(plants / walkT * 60) : null, mps: +(med(seq.filter(r => r.pose === 'walk').map(r => r.v)) * 0.833).toFixed(2) }); }
  }
  const walkingFrames = D.filter(f => f.rigs.some(r => r.pose === 'walk' && r.v > 0.1)), fast = walkingFrames.filter(f => f.fast).length;
  const iv = []; for (let i = 1; i < D.length; i++) iv.push(D[i].t - D[i - 1].t);
  return { frames: frames.length, drawn: D.length, iv: { med: +med(iv).toFixed(1), p95: +pct(iv, 0.95).toFixed(1) }, walkers, dancers, fastShare: walkingFrames.length ? +(fast / walkingFrames.length).toFixed(2) : null, why: [...new Set(D.map(f => f.fast || 'calm'))] };
}
G('motion', async () => {
  const P = 'window.__district.harbor()';
  // ---- a weekday afternoon (the owner's "stutter now and then on an ordinary afternoon")
  { const Q = await open({ slot: 'mo1', qs: `when=2026-10-26T15:10${GR}`, view: [402, 874] });
    await harborUp(Q.page); await waitFor(Q.page, `!${P}.pending && !${P}.fading`, 'settled', 20000);
    await waitFor(Q.page, `${P}.people.rigs().some(r => r.pose === 'walk' && r.v > 0.1)`, 'someone walking', 60000).catch(() => {});
    const R = motionReport(await ev(Q.page, motionTrace(12)));
    const W = R.walkers, worstR = W.reduce((a, w) => (w.ratio > a.ratio ? w : a), { ratio: 0 }), worstS = W.reduce((a, w) => (w.slide > a.slide ? w : a), { slide: 0 }), worstT = W.filter(w => w.slideT != null).reduce((a, w) => (w.slideT > a.slideT ? w : a), { slideT: 0 });
    const jud = W.reduce((s, w) => s + w.judder, 0), judN = W.reduce((s, w) => s + w.n, 0);
    ok(W.length >= 1 && jud <= Math.max(1, judN * 0.01), `THE WALKERS NEVER JUDDER (${W.length} walkers, ${R.drawn} drawn frames at ${R.iv.med} / ${R.iv.p95} ms): ${jud} stop-then-double frames of ${judN}`);
    okT(worstR.ratio <= 4, `THE WALKERS' SPEED IS EVEN: the worst per-frame step is ${worstR.ratio}× its median (${worstR.kind || '-'})`);
    ok(W.length >= 1 && worstS.slide <= 0.25, `THE PLANTED FOOT NEVER SKATES on a straight: ≤ ${worstS.slide} of the body's speed (${worstS.kind || '-'}); through a turn ≤ ${worstT.slideT} (${worstT.kind || '-'} — the rig pivots about its middle there: a known sweep)`);
    // (C4d: ≥ 70 steps/min, was 75 — the cloud's street job read the SAME couple at 0.89 m/s · 74 steps/min in C4b + C4d (its taller member's
    // longer stride: 0.72 m; the partner beside him 87): a slow stroll's cadence runs into the low 70s for a tall walker — inside the human range)
    ok(W.every(w => w.mps >= 0.8 && w.mps <= 2.9 && (w.spm == null || (w.spm >= 70 && w.spm <= 175))), `THE PACE IS HUMAN: ${W.map(w => w.kind + ' ' + w.mps + ' m/s' + (w.spm != null ? ' · ' + w.spm + ' steps/min' : '')).join(', ')}`);
    ok(R.fastShare != null && R.fastShare >= 0.9, `60 FPS WHILE ANYONE WALKS: ${R.fastShare == null ? 'nobody walked' : Math.round(R.fastShare * 100) + ' % of the walking frames fast'} (${R.why.join(', ')})`);
    await Q.ctx.close(); }
  // ---- the dance circle on a party night (&force=circle — NIGHT-B): the dancers' arms on the beat, never a jump
  { const Q = await open({ slot: 'mo2', qs: `when=2026-10-24T22:30${GR}&force=circle`, view: [402, 874] });   // (NIGHT-B: the old circle is its own preview now)
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.dancers >= 4 && ${P}.people.dance.k > 0.9`, 'the circle formed', 90000);
    const R = motionReport(await ev(Q.page, motionTrace(15)));
    const Dn = R.dancers, worst = Dn.reduce((a, d) => (d.p99 > a.p99 ? d : a), { p99: 0 }), jumps = Dn.reduce((a, d) => a + d.jumps, 0);
    ok(Dn.length >= 4 && jumps === 0, `THE DANCERS' ARMS NEVER JUMP (${Dn.length} dancers over ${R.drawn} frames): ${jumps} jumps over 1 rad in a frame`);
    okT(worst.p99 <= 20, `THE DANCERS' ARMS move at a human speed: the p99 angular speed ${worst.p99} rad/s (max ${Math.max(...Dn.map(d => d.max))}) — the cloud's uneven frames read 23.6 on the first run: a warning`);
    await Q.ctx.close(); }
});
// ================================================================ HOTFIX (Oct 27) — NEVER FREEZE AT NIGHT (ONLY=freeze; the `street` cloud job)
// The owner's iPhone froze on night loads right after the power-on: a window scene (the PEEK behind a curtain — the back window) threw
// every frame since SP4 (an undefined `col`) and the loop stopped itself after 30 failed frames. Every night page here is opened like the
// iPhone opens it (402×874 at DPR 3 — the crisp layer on — the full power-on with &intro=1) and watched for 20 s after the power-on: no
// frame error, no window scene dropped, the loop running and still drawing, the picture still moving, no canvas / memory climb. The peek
// link waits for the peek to play in the BACK window (its 2nd loop) — the scene that froze.
G('freeze', async () => {
  const LINKS = [
    { id: 'tr3b-snow', qs: `when=2027-01-15T21:30&snow=fresh&temp=-6&force=tr3b&lgs=15${GR}`, held: true },
    // (9d: the same Friday party night + fresh snow + the frost with the TR-3B's WHOLE run — the blackout, the jets, the power's return)
    // (9e: watched for the WHOLE run — the owner's iPhone stuck with the craft at its dip: the craft's clock must move every 2 s until it ends)
    { id: 'tr3b-run', qs: `when=2027-01-15T21:30&snow=fresh&temp=-6&force=tr3b${GR}`, whole: true },
    { id: 'peek', qs: `when=2026-10-27T21:00&force=window&moment=peek${GR}`, until: "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'peek' && e.win === 'back')", what: 'the peek in the back window' },
    { id: 'night', qs: `when=2026-10-27T21:00${GR}` },
    { id: 'night-late', qs: `when=2026-10-21T23:30${GR}` },
  ];
  const SNAP = `(() => { const h = window.__district.harbor(), l = window.__district.loop(), cv = document.querySelector('canvas');
    const x = document.createElement('canvas'); x.width = 100; x.height = 218; const c = x.getContext('2d'); c.drawImage(cv, 0, 0, 100, 218);
    const px = Array.from(c.getImageData(0, 0, 100, 218).data.filter((v, i) => i % 4 !== 3)); x.width = 0;
    return { running: l.running, failStop: l.failStop, drawn: l.drawn, canvases: [...document.querySelectorAll('canvas')].filter(c => !/hc-crisp|hl-tri|hb-bb/.test(c.className)).length,   // (SKY-A: the LASTING canvases — the crisp layer's items come + go by design (freed 2 s unseen: the old build failed this count too once they came back after the blackout), the legends' full-res overlays live only while they fly)
      cls: [...document.querySelectorAll('canvas')].map(c => c.className || (c.parentElement && c.parentElement.className) || '-').join(' '),
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0, dropped: h.speakeasy.life.dropped || [],
      failed: ((h.loadLog && h.loadLog.lines) || []).filter(s => /frame failed|loop stopped/.test(s)), px,
      lg: h.legend && h.legend.state && h.legend.state.run ? +h.legend.state.s.toFixed(2) : null, at: performance.now(), watch: !!(window.__district.report() || {}).watching }; })()`;
  const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 3) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++; return n; };
  await Promise.all(LINKS.map(async L => {
    const P = await open({ slot: `fz${L.id.slice(0, 4)}`, qs: `${L.qs}&intro=1`, view: [402, 874], dpr: 3, cores: 6 });
    await harborUp(P.page);
    // (9g: a link's TR-3B waits for the first tap — tapped at once, the run follows ~4 s later)
    if (L.whole) { await tapAt(P.page, 201, 420); await waitFor(P.page, 'window.__district.harbor().legend.state && !!window.__district.harbor().legend.state.run', `${L.id}: the run after the tap`, 15000); }
    if (L.until) await waitFor(P.page, L.until, `${L.id}: ${L.what}`, 45000);
    const s = [];
    const NS = L.whole ? 24 : 10;
    for (let i = 0; i <= NS; i++) { s.push(await ev(P.page, SNAP)); if (i < NS) await sleep(2000); }
    const a = s[0], z = s[s.length - 1], still = s.slice(1).filter((q, i) => q.drawn <= s[i].drawn).length;
    const moving = s.slice(1).filter((q, i) => diff(q.px, s[i].px) >= 20).length;
    const med = arr => arr.slice().sort((p, q) => p - q)[arr.length >> 1];
    const h0 = med(s.slice(0, 4).map(q => q.heap)), h1 = med(s.slice(-4).map(q => q.heap));
    ok(z.running && !z.failStop && !s.some(q => q.failed.length) && !z.dropped.length,
      `NEVER FREEZE (${L.id}): 20 s after the power-on the loop runs — no failed frame, no window scene dropped${z.failed.length ? ` (${z.failed.join('; ')})` : ''}${z.dropped.length ? ` (dropped: ${z.dropped.join(', ')})` : ''}`);
    ok(still === 0 && z.drawn - a.drawn > 100, `NEVER FREEZE (${L.id}): frames keep painting (${z.drawn - a.drawn} drawn in 20 s, ${still} stalled 2-s windows)`);
    ok(moving >= NS * 0.8, `NEVER FREEZE (${L.id}): the picture keeps moving (${moving}/${NS} two-second windows changed)`);
    ok(z.watch, `9e THE HANG WATCH runs (${L.id}): the worker that reports a stuck main thread to /admin`);
    if (L.whole) {
      // (the craft's clock: every 2-s look while the run is on moves it ~2 s on — a stuck clock = the owner's "the craft is just stuck")
      // (its seconds against the page's own time between the looks — several pages share the CPU, a look can come late)
      const runs = s.map(q => q.lg), steps = runs.slice(1).map((v, i) => (v != null && runs[i] != null && v > runs[i] ? (v - runs[i]) / ((s[i + 1].at - s[i].at) / 1000) : null)).filter(v => v != null);
      // (each look: it MOVED (a starved page draws late + catches up, so one look's rate varies); over the whole run: real time)
      const pairs = runs.slice(1).map((v, i) => (v != null && runs[i] != null && v > runs[i] - 0.01 ? [v - runs[i], (s[i + 1].at - s[i].at) / 1000] : null)).filter(Boolean);
      const rate = pairs.reduce((a, q) => a + q[0], 0) / Math.max(1e-6, pairs.reduce((a, q) => a + q[1], 0));
      ok(pairs.length >= 12 && pairs.every(q => q[0] > 0.05) && rate > 0.8 && rate < 1.2, `9e THE TR-3B's WHOLE RUN never sticks: its clock moved on all ${pairs.length} looks, ${rate.toFixed(2)} × real time over the run (${runs.filter(v => v != null).length} looks with the run on)`);
    }
    ok(z.canvases <= s[3].canvases + 2 && (!h0 || h1 <= h0 * 1.5 + 25), `NEVER FREEZE (${L.id}): no climb (from 6 s in: the power-on adds its overlays first) — canvases ${s[3].canvases} → ${z.canvases} (${s[3].cls} → ${z.cls}), JS heap ${h0} → ${h1} MB`);
    if (L.held) {
      // 9d: a HELD preview (&lgs=) is a still — the song never stuck at half speed, no crackle repeating forever; the &temp= override
      // reaches the snowman (the owner's log read "slumping · 12 °C" on this −6 °C link)
      const q = await ev(P.page, `(() => { const h = window.__district.harbor(); return { snd: h.sounds.legend, sm: h.snowman && h.snowman.why }; })()`);
      ok(q.snd && q.snd.rate === 1 && q.snd.crackles === 0, `NEVER FREEZE (${L.id}): the held preview never bends the music or repeats the crackle (rate ${q.snd && q.snd.rate}, crackles ${q.snd && q.snd.crackles})`);
      ok(!q.sm || !/\b(1[0-9]|[5-9]) °C/.test(q.sm), `&temp= reaches the snowman (${q.sm || 'none standing'})`);
    }
    await P.ctx.close();
  }));
  // ---- 9g — A LEGENDARY FROM A LINK WAITS FOR THE REVEAL + THE FIRST TAP (the owner: the TR-3B "worked perfectly" from ☰ → ADMIN,
  // glitched from &force=tr3b — the link started it under the load, before the tap unlocked the music): nothing runs until the tap,
  // then the run starts at its beginning ~4 s after it. The implosion's link: the tower held at the countdown's start until then.
  // + OPENED MID-DRAIN (a visitor arriving while the scheduled TR-3B is under way — Dec 5 2026, 22:51 Grand Rapids): the reveal never
  // stutters beyond the same page a minute earlier, and the first tap mid-sag starts the song SILENT (no tape joining mid-sag) until the
  // lights come back, then fades it in at its own speed.
  const GAP = `(() => { const R = window.__gaps = { last: performance.now(), rows: [] }; const f = () => { const n = performance.now(); R.rows.push([n, n - R.last]); R.last = n; if (R.rows.length < 4000) requestAnimationFrame(f); }; requestAnimationFrame(f); })()`;
  const gapInit = { fn: js => { window.addEventListener('DOMContentLoaded', () => { (0, eval)(js); }); }, arg: GAP };
  const worstAfterReveal = p => ev(p, `(() => { const s = window.__district.harbor().legend.link.shown, rows = window.__gaps.rows.filter(r => r[0] > s && r[0] < s + 3000).map(r => r[1]).sort((a, b) => b - a); return { worst: Math.round(rows[0] || 0), p95: Math.round(rows[Math.floor(rows.length * 0.05)] || 0), n: rows.length }; })()`);
  await Promise.all([
    (async () => {
      const P = await open({ slot: 'fzlk', qs: `when=2026-10-27T21:00&force=tr3b${GR}`, view: [402, 874], dpr: 3, cores: 6 });
      await harborUp(P.page);
      await sleep(3000);
      const a = await ev(P.page, `(() => { const g = window.__district.harbor().legend; return { run: !!(g.state && g.state.run), held: g.link.held, warm: g.state && g.state.warm }; })()`);
      ok(!a.run && a.held.includes('tr3b'), `9g A LINK's TR-3B WAITS: 3 s after the reveal with no tap nothing runs (held: ${a.held.join(', ')}; pre-baked: ${a.warm || '-'})`);
      const tapT = await ev(P.page, 'performance.now()');
      await tapAt(P.page, 201, 420);
      await waitFor(P.page, 'window.__district.harbor().legend.state && !!window.__district.harbor().legend.state.run', "the link's TR-3B starts after the tap", 15000);
      const b = await ev(P.page, `(() => { const g = window.__district.harbor().legend; return { s: g.state.s, now: performance.now(), tap: g.link.tap, go: g.link.go }; })()`);
      ok(b.go - b.tap > 3500 && b.go - b.tap < 4500 && b.s < 1.5 && b.tap >= tapT - 50, `9g …then starts ${((b.go - b.tap) / 1000).toFixed(1)} s after the first tap, from its beginning (s ${b.s})`);
      await P.ctx.close();
    })(),
    (async () => {
      const P = await open({ slot: 'fzli', qs: `when=2026-09-16T10:00&wx=clear&force=implosion${GR}`, view: [402, 874], dpr: 3, cores: 6 });
      await harborUp(P.page);
      const s0 = await ev(P.page, 'window.__district.harbor().tower.st.s'); await sleep(2500);
      const s1 = await ev(P.page, 'window.__district.harbor().tower.st.s');
      ok(s0 === s1, `9g A LINK's IMPLOSION WAITS: the tower held at the countdown's start until the tap (s ${s0} → ${s1})`);
      await tapAt(P.page, 201, 420);
      await waitFor(P.page, `window.__district.harbor().tower.st.s > ${s1} + 0.5`, 'the implosion runs after the tap', 15000);
      ok(true, '9g …and runs once the tap + 4 s have passed');
      await P.ctx.close();
    })(),
    (async () => {
      // (the same page a minute before the run: the reveal's frames to compare with)
      const runs = {};
      for (const [k, when] of [['plain', '2026-12-05T22:50:00'], ['mid', '2026-12-05T22:51:06']]) {
        const P = await open({ slot: `fzm${k[0]}`, qs: `when=${when}&wx=clear${GR}`, view: [402, 874], dpr: 3, cores: 6, init: gapInit });
        await P.page.emulateCPUThrottling(4);
        await harborUp(P.page);
        await sleep(3200);
        runs[k] = await worstAfterReveal(P.page);
        if (k === 'mid') {
          const g = await ev(P.page, `(() => { const h = window.__district.harbor(); return { s: h.legend.state.s, kind: h.legend.state.run && h.legend.state.run.kind }; })()`);
          ok(g.kind === 'tr3b' && g.s > 5 && g.s < 30, `9g OPENED MID-DRAIN: the scheduled TR-3B joined mid-way (${g.kind} at ${g.s} s)`);
          await P.page.emulateCPUThrottling(1);
          await tapAt(P.page, 201, 420);
          const B = (await import('../../../js/core/harbor-legend.js')).BLACK;
          await sleep(1500);
          const m1 = await ev(P.page, `(() => { const h = window.__district.harbor(); return { s: h.legend.state.s, ...h.sounds.legend }; })()`);
          ok(m1.tapS != null && m1.tapS > 5 && m1.rate === 1 && m1.duck === 0, `9g …the first tap mid-sag (at ${m1.tapS} s): the song starts SILENT, no tape (rate ${m1.rate}, duck ${m1.duck})`);
          await waitFor(P.page, `window.__district.harbor().legend.state && window.__district.harbor().legend.state.s > ${B.on0 + 2.6}`, 'the lights back', 40000);
          const m2 = await ev(P.page, 'window.__district.harbor().sounds.legend');
          ok(m2.duck > 0.5 && m2.rate === 1, `9g …the music fades in at its own speed as the lights come back (duck ${m2.duck}, rate ${m2.rate})`);
        }
        await P.ctx.close();
      }
      okT(runs.mid.worst <= runs.plain.worst * 1.5 + 60, `9g OPENED MID-DRAIN: the reveal never stutters (at 4× CPU, the 3 s after it: worst frame ${runs.mid.worst} ms, p95 ${runs.mid.p95} — the same page a minute earlier ${runs.plain.worst} / ${runs.plain.p95})`);
    })(),
  ]);
});
