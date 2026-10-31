// CITY 2.0 — THE HARBOR end to end: the `show` cloud job's groups (neon, party, sky, life) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=show, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, SHOTS, sleep, ok, okT, okF, GR, NIGHT, open, ev, waitFor, tapAt, tap, harborUp, G } from './kit.mjs';

// ================================================================ NEON PASS 5 — the owner's iPhone view: the party at 11 pm, 402×874
// (every hero + word tower's sky beam rising behind the sign, the rotating palette, the racing light moving, the beat half-time,
// the NEON logo punching, the tired tube) + A CAPPED FRAME RATE (iOS Low Power Mode's 30 Hz) keeps the tier
async function neonPass5Party() {
  const Q = await open({ slot: 'h13', qs: `when=2026-10-24T23:00${GR}`, view: [402, 874] });
  await harborUp(Q.page);
  await ev(Q.page, 'window.__district.setTier(2)');
  await waitFor(Q.page, "(() => { const p = window.__district.party(), n = window.__district.harbor().neon; return p.show.racing > 0 && n.pal && n.pal.built > 20 && !n.queued && !window.__district.harbor().pending; })()", 'the party + its palette', 25000);
  const h = await ev(Q.page, 'window.__district.harbor()'), tr = (await ev(Q.page, 'window.__district.scene()')).textRects;
  const towers = h.towers.filter(t => (t.rank === 'hero' || t.rank === 'word') && t.x + t.w / 2 > 6 && t.x + t.w / 2 < 396).length;
  const free = h.skyBeams.beams.filter(b => b.top < tr.tag.y);
  ok(h.skyBeams.beams.length >= Math.min(6, towers) && free.length >= h.skyBeams.beams.length - 1,
    `THE SKY BEAMS (NEON PASS 5): every hero + word tower's beam (${h.skyBeams.beams.map(b => b.id).join(', ')} — ${h.skyBeams.beams.length} of ${towers} towers), ${free.length} rising behind the sign to the top`);
  ok(h.neon.pal.on && h.neon.pal.mains >= 5 && h.neon.scheme === 'city', `THE PARTY PALETTE: the rotating palette on (${h.neon.pal.mains} main colours built, scene ${h.neon.pal.scene}) — never one pink scheme`);
  // the motion at phone size: the share of skyline pixels changing by > 24 between frames 250 ms apart (the racing light, the
  // sweeps, the beat) + the half-time beat + the NEON logo's punch, sampled together over ~3 s
  const m = await ev(Q.page, `new Promise(res => {
    const cv = document.querySelector('.nd-scene canvas'), x = cv.getContext('2d'), k = cv.width / cv.clientWidth, hb = window.__district.harbor();
    const y0 = Math.round(hb.cam.limitY * k), y1 = Math.round((hb.cam.VPY + 10) * k), w = cv.width;
    const grab = () => x.getImageData(0, y0, w, y1 - y0).data;
    const shares = [], beats = [0, 0, 0, 0], lg = document.querySelector('.nd-logo-glow'); let prev = null, lo = 9, hi = 0, t0 = performance.now(), n = 0;
    const tick = () => {
      const p = window.__district.party(); if (p.beatIdx % 2 === 0 || (p.beatU > 0.2 && p.beatU < 0.8)) beats[p.beatIdx] = Math.max(beats[p.beatIdx], p.punch);   // (beats 2 + 4: mid-beat — their last 50 ms are the next strong beat's attack)
      const o = lg ? +getComputedStyle(lg).opacity : -1; lo = Math.min(lo, o); hi = Math.max(hi, o);
      if (++n % 15 === 0) { const d = grab(); if (prev) { let c = 0, s = 0; for (let i = 0; i < d.length; i += 16) { s++; if (Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2]) > 24) c++; } shares.push(c / s); } prev = d; }
      if (performance.now() - t0 < 3200) requestAnimationFrame(tick); else res({ shares, beats, lo, hi, tired: document.querySelectorAll('.nd-logo .ndl.is-tired').length });
    };
    requestAnimationFrame(tick);
  })`);
  const share = m.shares.reduce((a, b) => a + b, 0) / Math.max(1, m.shares.length);
  ok(share > 0.05, `THE PARTY MOVES at phone size: ${(100 * share).toFixed(1)} % of the skyline's pixels change between frames ~250 ms apart`);
  // (C4d — F8: beats 2 + 4 are BEAT_WEIGHT 0.45 BY DESIGN (core/harbor-beat.js); 0.35 passed only when sampled mid-decay — the design + a margin)
  ok(m.beats[0] > 0.5 && m.beats[1] < m.beats[0] * 0.55 && m.beats[3] < m.beats[0] * 0.55 && m.beats[2] > m.beats[0] * 0.5,
    `HALF-TIME: the punch on beats 1 + 3 (${m.beats[0].toFixed(2)}, ${m.beats[2].toFixed(2)}), beats 2 + 4 calm (${m.beats[1].toFixed(2)}, ${m.beats[3].toFixed(2)})`);
  ok(m.hi > 0.35 && m.lo < 0.15, `THE NEON LOGO PUNCHES with the city: its glow layer ${m.lo.toFixed(2)} → ${m.hi.toFixed(2)} (gentler than the skyline)`);
  ok(m.tired <= 2, `THE TIRED TUBE: ${m.tired} tired letter(s) right now (0–2, rotating)`);
  // NEON PASS 6 (the owner, her iPhone: "they almost stop between pulses and jitter"): the racing light's speed comes from the tempo
  // alone — sampled through ~2 s (several beats), it never dips between the punches
  const rv = await ev(Q.page, `new Promise(res => { const v = []; const iv = setInterval(() => { v.push(window.__district.harbor().neon.show.raceV || 0); if (v.length >= 20) { clearInterval(iv); res(v); } }, 100); })`);
  const rlo = Math.min(...rv), rhi = Math.max(...rv);
  ok(rlo > 20 && rlo / rhi > 0.85, `THE RACING FLOWS: a steady ${rlo.toFixed(0)}–${rhi.toFixed(0)} pt/s through the beats (never a stop-and-go)`);
  if (SHOTS) await Q.page.screenshot({ path: `${OUT}np5-party-402x874.png` });
  await Q.ctx.close();
  // NEON PASS 6 — THE NEON LOGO RACES (&force=race: every 6 s): a head running the letters by transform, each letter blazing in turn,
  // then SPEAKEASY's sweep
  { const R = await open({ slot: 'h16', qs: `${NIGHT}&force=race`, view: [402, 874] });
    await waitFor(R.page, 'window.__district.harbor().neon.signs.every(s => s.on)', 'the neon on', 15000);
    const r = await ev(R.page, `new Promise(res => {
      const ls = [...document.querySelectorAll('.nd-race-l')], hd = document.querySelector('.ndr-hd'), w = [...document.querySelectorAll('.nd-word-r i')];
      const peak = [0, 0, 0, 0], first = [-1, -1, -1, -1], pos = new Set(); let word = 0, t0 = performance.now();
      const tick = () => { const e = performance.now() - t0;
        ls.forEach((l, i) => { const o = +getComputedStyle(l).opacity; if (o > peak[i]) peak[i] = o; if (o > 0.5 && first[i] < 0) first[i] = e; });
        if (+getComputedStyle(hd).opacity > 0.5) pos.add(hd.getAttribute('transform'));
        for (const x of w) word = Math.max(word, +getComputedStyle(x).opacity);
        if (e < 8500) requestAnimationFrame(tick); else res({ peak, first, moves: pos.size, word });
      };
      requestAnimationFrame(tick);
    })`);
    const inTurn = r.first.every(v => v >= 0) && r.first[0] < r.first[1] && r.first[1] < r.first[2] && r.first[2] < r.first[3];
    ok(inTurn && Math.min(...r.peak) > 0.6 && r.moves > 20 && r.word > 0.5, `THE NEON LOGO RACES: N → E → O → N blaze in turn (at ${r.first.map(v => Math.round(v)).join(' / ')} ms, peaks ${r.peak.map(v => v.toFixed(2)).join(' ')}), the head moved through ${r.moves} places, SPEAKEASY swept (${r.word.toFixed(2)})`);
    await R.ctx.close(); }
  // A 30 Hz FRAME RATE (iOS Low Power Mode): the city tries one step down, sees no faster frames, steps back up + stays (the owner's
  // iPhone ran a party night at tier 0: nothing racing). requestAnimationFrame throttled to 30 Hz in the page.
  const C = await open({ slot: 'h14', qs: NIGHT, view: [402, 874], init: { fn: () => { const raf = window.requestAnimationFrame.bind(window); let q = [], last = 0, armed = false, id = 0; const pump = t => { if (t - last < 31) { raf(pump); return; } last = t; const run = q; q = []; armed = false; for (const e of run) e[1](t); }; window.requestAnimationFrame = cb => { q.push([++id, cb]); if (!armed) { armed = true; raf(pump); } return id; }; window.cancelAnimationFrame = i => { q = q.filter(e => e[0] !== i); }; }, arg: null } });
  await harborUp(C.page);
  await waitFor(C.page, '(() => { const t = window.__district.tiering(); return t.capped > 0 && !t.probe && t.tier === 2; })()', 'the cap found, the tier back', 40000).catch(() => {});
  const ti = await ev(C.page, 'window.__district.tiering()');
  ok(ti.tier === 2 && ti.capped >= 24 && ti.capped <= 36, `A 30 Hz PHONE KEEPS ITS TIER: tier ${ti.tier} (${ti.hist.join('→')}), the cap found: ${ti.capped} Hz — no step down for a frame rate the city can't change`);
  await C.ctx.close();
}
G('neon', async () => {
  // ================================================================ 3c. Part 3: the neon — signs, outlines, billboards, beacons, the scroll, moments
  { const N = await open({ slot: 'h8', qs: NIGHT });
    await waitFor(N.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued && n.signs.every(s => s.on); })()', 'the neon built + lit', 15000);
    const h = await ev(N.page, 'window.__district.harbor()'), sc = await ev(N.page, 'window.__district.scene()');
    const games = h.neon.signs.filter(s => s.game).map(s => s.game), bb = h.neon.boards[0] && h.neon.boards[0].show;
    // (NEON PASS 5: 4 named + 6 icons — the small icon left of the wheel and PAR's narrow name are gone; the billboard advertises a
    // game with no sign tonight, the nightly shuffle rotates the rest)
    // (NEON PASS 6, the owner: the tiny floating icons are gone — 4 named signs + the billboard a fifth game)
    // (DT1: the left roof slot is gone — 3 named signs: the blade + the two roof signs; the billboard a fourth game)
    ok(new Set(games).size === 3 && h.neon.signs.filter(s => s.kind === 'named').length === 3 && !h.neon.signs.some(s => s.kind === 'icon') && h.neon.signs.every(s => s.on) && bb && !games.includes(h.neon.boards[0].game),
      `SIGNS: 3 named games in the skyline tonight (${h.neon.signs.filter(s => s.kind === 'named').map(s => s.game).join(', ')}; stacked roof signs + the blade), no icons, the billboard a fourth (${bb}), every sign lit at night`);
    ok(h.neon.outlines.length >= 12 && h.neon.outlines.some(o => o.id === 'needle') && h.neon.led === 2 && h.beacons.length >= 10,
      `NEON OUTLINES: ${h.neon.outlines.length} buildings outlined (the needle, the heroes…), the 2 glass towers' LED facades, ${h.beacons.length} aircraft beacons`);
    const sg = h.neon.signs.find(s => s.game), hit = await ev(N.page, `window.__district.hit(${sg.rect.x + sg.rect.w / 2}, ${sg.rect.y + sg.rect.h / 2})`);
    ok(hit && hit.kind === 'sign' && hit.id === sg.game, `A TAP ON A SIGN: ${sg.id} → ${hit && hit.kind} ${hit && hit.id} (its HOW TO PLAY)`);
    // (DT1 — THE BLUE-HOUR POWER-UP: the Harbor's neon follows the darkness's stagger, not the title's plan — at night all of it)
    ok(h.powerUp && h.powerUp.on === h.powerUp.of && h.power === 1, `THE POWER-UP at night: every light on (${h.powerUp && h.powerUp.on} of ${h.powerUp && h.powerUp.of}, tonight's sweep ${h.powerUp && h.powerUp.sweep})`);
    const scroll = await ev(N.page, "(() => { const hb = window.__district.harbor(); const okk = hb.spell('HAPPY BIRTHDAY SAMANTHA', { style: 'scroll' }); return okk && window.__district.harbor().windows.spelling; })()");
    ok(scroll && scroll.style === 'scroll' && scroll.towers[0] === 'wordA', `THE SCROLL: a long message tickers across ${scroll && scroll.towers}`);
    await ev(N.page, "window.__district.harbor().moment('flash', { game: 'pulse' }), window.__district.harbor().billboard('bb-left', { game: 'rum' })");
    await waitFor(N.page, 'window.__district.harbor().neon.moment.flash', 'the flash', 3000);
    const h2 = await ev(N.page, 'window.__district.harbor()');
    ok(h2.neon.moment.flash && h2.neon.boards[0].show === 'RUMRUNNER', `MOMENTS + BILLBOARDS: a game's flash sweeps the skyline; a billboard shows ${h2.neon.boards[0].show}`);
    ok(h2.mem.mb + h2.neon.mb <= h2.mem.budget, `MEMORY (neon): the sprites ${h2.neon.mb} MB + the baked layers ${h2.mem.mb} MB ≤ ${h2.mem.budget}`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part3-neon-390x844.png` });
    void sc;
    await N.ctx.close();
  }
  // DT1 — THE BLUE-HOUR POWER-UP: late golden hour = sunlight (no building neon, the billboard's lamps the first light, a few
  // windows); mid blue hour = some lit, some still dark (never all at once); the sign + the billboard on the darkness's stagger
  { const out = [];
    for (const [when, label] of [['2026-10-22T18:30', 'golden'], ['2026-10-22T19:04', 'blue']]) {
      const P = await open({ slot: `hp${label}`, qs: `when=${when}${GR}` });
      await harborUp(P.page);
      await waitFor(P.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued; })()', 'the neon built', 15000);
      out.push({ label, h: await ev(P.page, '(() => { const h = window.__district.harbor(); return { pu: h.powerUp, lamps: h.lamps, power: h.power, share: h.windows.share, dark: h.dark }; })()') });
      await P.ctx.close();
    }
    const [g, b] = out.map(o => o.h);
    ok(g.pu && g.pu.on <= 1 && g.lamps > 0.5 && g.power === 0 && g.share > 0 && g.share < 0.2 && b.pu.on > 2 && b.pu.on < b.pu.of && b.power > 0.2 && b.power < 0.9,
      `THE POWER-UP: golden hour ${g.pu && g.pu.on} lit (the billboard's lamps ${g.lamps}), ${Math.round(g.share * 100)} % of the windows; mid blue hour ${b.pu && b.pu.on} of ${b.pu && b.pu.of} lit (power ${b.power}), the rest still to come`);
  }
  { const D = await open({ slot: 'h9', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page);
    await waitFor(D.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items; })()', 'the neon built (by day)', 15000);
    const h = await ev(D.page, 'window.__district.harbor()');
    ok(h.neon.signs.every(s => !s.on), 'BY DAY: the neon is off (the signs + outlines as unlit glass)');
    await D.ctx.close();
  }

});
G('sky', async () => {
  // ================================================================ 3f. Part 6a: THE EVERYDAY SKY — the tier on an iPhone, the sky's pieces + API, lanes, the moon
  { const I = await open({ slot: 'h6', qs: `when=2026-10-21T13:00${GR}&wind=2`, dpr: 3, cores: 2 });
    await harborUp(I.page);
    const sc = await ev(I.page, 'window.__district.scene()');
    ok(sc.tier === 2 && sc.dpr === 2, `THE TIER ON AN iPHONE: DPR 3 + iOS's capped core count start the Harbor at tier ${sc.tier} (DPR ${sc.dpr}) — the step-down still guards a slow phone`);
    await waitFor(I.page, '!!window.__district.scene().textRects', 'the sign measured', 8000);
    const b = await ev(I.page, "window.__district.harbor().sky.banner(['FRESH LEMONADE', 'AT THE PIER'])");
    const t = await ev(I.page, "window.__district.harbor().sky.skytype('HAPPY BIRTHDAY STEVE')");
    await waitFor(I.page, '(() => { const h = window.__district.harbor(), st = h.sky.state; return st.banner && st.smoke && st.smoke.puffs > 100 && h.density.road < 1; })()', 'the banner + the skytypers (+ the city calmed)', 8000).catch(() => {});
    const st = (await ev(I.page, 'window.__district.harbor()')).sky.state;
    ok(b && st.banner && st.banner.lines.length === 2 && st.banner.panels.every(p => p.h >= 19), `THE BANNER PLANE (API): ${st.banner && st.banner.lines.join(' / ')} — panels ${st.banner && st.banner.panels.map(p => p.w + '×' + p.h).join(', ')} pt`);
    ok(t && st.smoke && st.smoke.kind === 'skytype' && st.smoke.text === 'HAPPY / BIRTHDAY / STEVE' && st.smoke.pages === 1 && st.smoke.puffs > 100, `SKYTYPING (API): "${st.smoke && st.smoke.text}" — ${st.smoke && st.smoke.puffs} puffs, one page wrapped for the biggest letters (6b)`);
    // (6b: the sign makes room — the NEON sign a ghost + the tagline gone while it types; the banner fades the tagline only)
    await waitFor(I.page, '(() => { const d = window.__district.signDim(); return d && d.logo <= 0.2; })()', 'the sign down to its ghost (after the flicker)', 5000).catch(() => {});
    const sd = await ev(I.page, 'window.__district.signDim()');
    ok(sd && sd.by.includes('msg') && sd.logo <= 0.2 && sd.tag === 0, `THE SIGN MAKES ROOM: the NEON sign dims to ${sd && sd.logo} + the tagline to ${sd && sd.tag} while the message types (${sd && sd.by.join(', ')})`);
    const h = await ev(I.page, 'window.__district.harbor()');
    ok(st.used.includes('sky-high') && st.used.includes('sky-low') && st.heavy && h.density.road < 1 && h.density['sky-high'] === 1, `HEAVY SKY: the skytypers hold both sky lanes (no plane there), the rest of the city calms (road density ${h.density.road})`);
    ok(h.rate.fast !== '', `THE SKY KEEPS 60 FPS while it writes (${h.rate.fast})`);
    if (SHOTS) await I.page.screenshot({ path: `${OUT}part6-skytype-390x844.png` });
    await I.ctx.close(); }
  // (the drone show runs on the clock: &speed=4 flies its first formation in a quarter of the time — the same checks)
  { const D = await open({ slot: 'h7', qs: `${NIGHT}&force=drones&text=HELLO%20THERE&speed=4` });   // (POLISH 4: a message only — no heart)
    await harborUp(D.page);
    await waitFor(D.page, '!!window.__district.harbor().sky.state.drones', 'the drone show', 10000);
    await waitFor(D.page, '(() => { const d = window.__district.harbor().sky.state.drones; return d && d.lit > 100; })()', 'the formation lit', 30000);
    const st = (await ev(D.page, 'window.__district.harbor()')).sky.state;
    ok(st.drones && st.drones.n >= 140 && st.drones.lit > 100 && st.used.includes('water') && st.barge && st.barge.w > 40,
      `THE DRONE SHOW (&force=drones): ${st.drones && st.drones.n} drones, ${st.drones && st.drones.lit} lit in "${st.drones && st.drones.shapes.join(' → ')}" at ${st.drones && st.drones.e} s; the barge ${st.barge && Math.round(st.barge.w)} pt on the harbor`);
    const m = st.cel && st.cel.moon;
    ok(m && m.discA > 0.6 && m.r > 14, `THE MOON (the Harbor's art): drawn at r ${m && m.r} pt, visible ${m && m.discA}, amber ${m && m.amber}`);
    if (SHOTS) await D.page.screenshot({ path: `${OUT}part6-drones-390x844.png` });
    await D.ctx.close(); }
});
G('neon', async () => {
  // ================================================================ 3g. NEON PASS 2: clean tubes, solid signs, the waterfront, the drones' colours
  for (const view of [[390, 844], [430, 932]]) {
    const P = await open({ slot: `hn${view[0]}`, qs: NIGHT, view });
    await harborUp(P.page);
    await waitFor(P.page, 'window.__district.harbor().neon.signs.every(s => s.on)', 'the neon on', 15000);
    const r = await ev(P.page, `(() => { const h = window.__district.harbor(), W = innerWidth; let pts = 0, edge = 0, inSign = 0;
      const rs = h.neon.signs.map(s => s.rect);
      for (const o of h.neonRuns()) for (const run of o.runs) for (const [x, y] of run) { pts++; if (x < 2.4 || x > W - 2.4) edge++; if (rs.some(q => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h)) inSign++; }
      return { pts, edge, inSign, clipped: h.neon.signs.filter(s => s.rect.x < 3 || s.rect.x + s.rect.w > W - 3).map(s => s.id), wf: h.waterfront }; })()`);
    ok(r.pts > 1500 && r.edge === 0 && r.inSign === 0 && !r.clipped.length, `CLEAN NEON at ${view[0]}: ${r.pts} tube points, none within 2.4 pt of the screen's edge, none through a sign; no sign clipped (${r.clipped.join(', ') || 'none'})`);
    ok(r.wf.fronts >= 8 && !r.wf.words && r.wf.shops.includes('marquee') && r.wf.shops.includes('cocktail'), `THE WATERFRONT at ${view[0]}: ${r.wf.fronts} storefronts read by shape on a phone (${[...new Set(r.wf.shops)].join(', ')}), no small words`);
    await P.ctx.close();
  }
});
G('sky', async () => {
  // ================================================================ DT2: THE CLOUDS — the real weather's kinds, baked + drawn, in the sky band, in budget
  { const C = await open({ slot: 'h31', qs: 'when=2026-10-22T13:00&tz=America/Detroit&at=42.96,-85.67&wx=clouds', view: [402, 874] });
    await harborUp(C.page);
    await waitFor(C.page, '!!(window.__district.harbor().clouds || {}).born', 'the clouds baked', 20000);
    const c = (await ev(C.page, 'window.__district.harbor()')).clouds;
    const cu = c.at.filter(d => d.k === 'cumulus');
    ok(cu.length >= 8 && c.kinds.includes('strato') && c.mix.cumulus > 0.3, `THE CLOUDS (a cloudy day): ${c.clouds} clouds — ${cu.length} cumulus + ${c.kinds.filter(k => k === 'strato').length} stratocumulus patches (the cover's mix ${JSON.stringify(c.mix)})`);
    ok(cu.every(d => d.y > 62 && d.y < 520 && d.w >= 30 && d.h >= 10), 'THE CLOUDS in the sky band, never a sliver (≥ 30 × 10 pt)');
    const near = cu.filter(d => d.s > 0.55), far = cu.filter(d => d.s < 0.4);
    ok(near.length && far.length && Math.max(...far.map(d => d.w)) < Math.max(...near.map(d => d.w)), `PERSPECTIVE: the near ones bigger (${near.length} near up to ${Math.max(...near.map(d => d.w))} pt, ${far.length} far up to ${Math.max(...far.map(d => d.w))} pt)`);
    ok(c.mb < 9, `THE CLOUDS' MEMORY: ${c.mb.toFixed(1)} MB (sprites + their cached shapes)`);
    okT(c.pending === 0, `THE CLOUDS baked in time: ${c.pending} left to bake`);
    await C.ctx.close(); }
  { const C = await open({ slot: 'h32', qs: 'when=2026-10-22T13:00&tz=America/Detroit&at=42.96,-85.67&wx=overcast', view: [402, 874] });
    await harborUp(C.page);
    await waitFor(C.page, '!!(window.__district.harbor().clouds || {}).born', 'the overcast baked', 25000);
    const c = (await ev(C.page, 'window.__district.harbor()')).clouds;
    // (6b, the owner: "the small dark floating puffs look off" — under a FULL deck the deck alone: no scud, no small cumulus)
    ok(c.deck && !c.kinds.includes('scud'), `OVERCAST: the deck alone — no scud / small puffs under it (${c.kinds.join(', ')})`);
    await C.ctx.close(); }
});
G('sky', async () => {
  // (&speed=8: the message holds after ~36 s of the show's clock — ~5 s here)
  { const D = await open({ slot: 'h8', qs: `${NIGHT}&force=drones&text=HI%20THERE&colours=ff2e97,2ee6ff&by=word&speed=8` });
    await harborUp(D.page);
    await waitFor(D.page, '!!window.__district.harbor().sky.state.drones', 'the drone show', 10000);
    await waitFor(D.page, "(() => { const d = window.__district.harbor().sky.state.drones; return d && d.e > 22; })()", 'the message held', 45000);   // (POLISH 4: the drones rise straight into the message: formed by ~15 s, held to ~30)
    const d = (await ev(D.page, 'window.__district.harbor()')).sky.state.drones;
    ok(d.colours === 2 && d.lit > 60, `THE DRONES' COLOURS (&colours=…&by=word): "HI THERE" in ${d.colours} colours, a colour per word (${d.lit} lit)`);
    // (6b, the owner: "it only uses a very small part of the sky") the formation fills the OPEN SKY — from under the corner buttons down
    // to over the tallest crown — IN FRONT of the sign, which dims to a ghost while the show flies
    const g = await ev(D.page, `(() => { const h = window.__district.harbor(); return { crown: Math.min(...h.boxes.filter(b => b.kind === 'sky').map(b => b.y)), btn: document.querySelector('.music-btn').getBoundingClientRect().bottom, dim: window.__district.signDim() }; })()`);
    ok(d.box && d.box[3] < g.crown - 2 && d.box[1] > g.btn && g.dim.logo <= 0.2, `THE DRONES IN OPEN SKY: the formation ${d.box && d.box[1]}–${d.box && d.box[3]} pt, under the corner buttons (${Math.round(g.btn)}), over the tallest crown (${Math.round(g.crown)}); the sign a ghost (${g.dim.logo})`);
    await D.ctx.close(); }
});
G('neon', async () => {
  // ================================================================ 3h. NEON PASS 3: the night spectacular, the lighthouse in neon, the party show, the everyday motion
  { const N = await open({ slot: 'h9', qs: NIGHT, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, 'window.__district.harbor().neon.signs.every(s => s.on) && !!window.__district.harbor().daily', 'the neon on + the motion tonight', 15000);
    const h = await ev(N.page, 'window.__district.harbor()');
    const bands = h.neon.outlines.filter(o => o.id.startsWith('threads-near') || o.id.startsWith('threads-mid'));
    ok(bands.length >= 5 && bands.reduce((a, o) => a + o.runs, 0) >= 20 && h.neon.outlines.some(o => o.id === 'lighthouse' && o.runs >= 6), `THE NIGHT CITY LIT: ${bands.length} neon clusters on the near + mid buildings (${bands.reduce((a, o) => a + o.runs, 0)} runs), the lighthouse in neon (${(h.neon.outlines.find(o => o.id === 'lighthouse') || {}).runs} runs)`);
    // (NEON PASS 6: no icon signs any more — nothing cycles its colour)
    ok(h.daily && h.daily.spell.length >= 2 && h.daily.blink.length >= 1 && h.daily.chase.length >= 3, `THE EVERYDAY MOTION (NEON PASS 4: alive): ${h.daily.spell} spells on, ${h.daily.blink} blink, ${h.daily.chase.join(' + ')} chase slowly`);
    ok(h.neon.scheme === 'city' && !h.neon.partyLook, 'A NORMAL NIGHT: the city\'s own colours');
    ok(!h.show.scene && h.beams === 0, 'A NORMAL NIGHT: no party show, no searchlights');
    ok(h.daily.rotate.length >= 1 && h.daily.stages.length >= 1, `COLOURS THROUGH THE NIGHT: ${h.daily.rotate.join(' + ')} rotate slowly, ${h.daily.stages.join(' + ')} change scheme by the hour`);
    await N.ctx.close(); }
  // 7a — THE SPELL-ON ROUND's preview (&force=spell-on): the next sign every 6 s, every named sign in turn, never two at once (PF: watched
  // until every sign has spelled — up to 40 s on the CI's slower machine — never a fixed window only)
  { const N = await open({ slot: 'h9', qs: `${NIGHT}&force=spell-on`, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, 'window.__district.harbor().neon.signs.every(s => s.on) && !!window.__district.harbor().daily', 'the neon on', 15000);
    const r = await ev(N.page, `new Promise(res => { const seen = [], t0 = performance.now(); let shot = null; const tick = () => { const d = window.__district.harbor().daily; const s = d && d.spellOn; if (s && (!seen.length || seen[seen.length - 1].k !== s.k)) seen.push({ id: s.id, k: s.k }); const n = new Set(seen.map(v => v.id)).size, el = performance.now() - t0; if ((el < 19500 || n < Math.min(3, (d && d.spell || []).length)) && el < 40000) requestAnimationFrame(tick); else res({ seen, all: d.spell }); }; requestAnimationFrame(tick); })`);
    const ids = new Set(r.seen.map(s => s.id));
    ok(r.seen.length >= 3 && ids.size >= Math.min(3, r.all.length) && r.seen.every((s, i) => !i || s.id !== r.seen[i - 1].id), `SPELL-ON ROUND (&force=spell-on): ${r.seen.map(s => s.id).join(' → ')} — every sign in turn (${r.all.join(', ')})`);
    if (SHOTS) { await waitFor(N.page, '(() => { const s = window.__district.harbor().daily.spellOn; return s && s.u > 1.4 && s.u < 1.9; })()', 'mid-spell', 8000).catch(() => {}); await N.page.screenshot({ path: `${OUT}neon-spell-on-402x874.png` }); }
    await N.ctx.close(); }
  { const N = await open({ slot: 'h12', qs: `${NIGHT}&force=burnout`, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, '!!(window.__district.harbor().daily || {}).burnout', 'the burnt-out letter', 15000);
    const b = (await ev(N.page, 'window.__district.harbor()')).daily.burnout, sg = (await ev(N.page, 'window.__district.harbor()')).neon.signs.find(s => s.id === b.id);
    ok(sg && sg.kind === 'named', `A BURNT-OUT LETTER (&force=burnout): letter ${b.letter + 1} of ${b.id} is dead tonight (never the NEON logo)`);
    await N.ctx.close(); }
});
G('neon', async () => {
  // ================================================================ SP3: THE ROOF SIGNS' HOURLY MODES — one mode a sign this hour, neighbours
  // different, one big move at a time; the previews put every sign in one mode and its turn comes round
  { const N = await open({ slot: 'rm1', qs: NIGHT, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, '!!window.__district.harbor().roofModes', 'the roof modes', 15000).catch(() => {});
    // (11a-1: on a slow runner a sign can join the skyline a moment after the modes first exist — wait until every lit sign has its mode)
    await waitFor(N.page, '(() => { const h = window.__district.harbor(), rm = h.roofModes; return !!rm && h.neon.signs.filter(s => s.rect).every(s => rm.modes[s.id]); })()', 'every sign its mode', 15000).catch(() => {});
    const rm = await ev(N.page, 'window.__district.harbor().roofModes'), sg = (await ev(N.page, 'window.__district.harbor().neon.signs')).filter(s => s.rect).sort((a, b) => a.rect.x - b.rect.x).map(s => s.id);
    const md = rm ? sg.map(id => rm.modes[id]) : [];
    ok(rm && md.length >= 3 && md.every(Boolean) && md.every((m, i) => !i || m !== md[i - 1]), `THE ROOF SIGNS' MODES this hour: ${sg.map((id, i) => `${id} ${md[i]}`).join(', ')} (neighbours never the same)`);
    await N.ctx.close(); }
  // (SP6: + WORD FLASH, LAYERS, TWO-TONE; each probe ends once two signs have taken their turn — ≤ 30 s)
  for (const mode of ['spell', 'race', 'wordflash', 'layers', 'twotone']) {
    const N = await open({ slot: `rm-${mode}`, qs: `${NIGHT}&force=roof-${mode}`, view: [402, 874] });
    await harborUp(N.page);
    const seen = await ev(N.page, `new Promise(res => { const ids = new Set(); let two = false; const t0 = performance.now(); (function lp() { const m = window.__district.harbor().roofModes; if (m && m.move) ids.add(m.move.id + ':' + m.move.kind); if (performance.now() - t0 < 30000 && ids.size < 2) setTimeout(lp, 150); else res({ ids: [...ids], two }); })(); })`);
    ok(seen.ids.length >= 2 && seen.ids.every(s => s.endsWith(':' + mode)), `THE ROOF SIGNS — ${mode.toUpperCase()} (&force=roof-${mode}): the signs take turns (${seen.ids.join(', ')})`);
    await N.ctx.close();
  }
  // ================================================================ C1.5: THE O KEEPS ITS WHITE CORE (review-2.md §2) + the holiday O + the sign-dim hook
  { const N = await open({ slot: 'h21', qs: NIGHT, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, "document.querySelector('.nd-sign').classList.contains('is-steady')", 'the sign steady', 20000);
    // make the flutter land on the O: for a few seconds Math.random alternates "flutter now" / "the third lit letter"
    const landed = await ev(N.page, `new Promise(res => {
      const o = document.querySelector('.nd-logo .ndl-3 .ndl-core'); let seen = false;
      const mo = new MutationObserver(() => { if (o.classList.contains('is-flut')) seen = true; }); mo.observe(o, { attributes: true });
      const rnd = Math.random; let k = 0; Math.random = () => (k++ % 2 ? 0.55 : 0.1);
      const end = () => { Math.random = rnd; setTimeout(() => { mo.disconnect(); res(seen); }, 400); };
      const t0 = Date.now(), poll = setInterval(() => { if (seen || Date.now() - t0 > 12000) { clearInterval(poll); end(); } }, 250);
    })`);
    const cores = await ev(N.page, "[...document.querySelectorAll('.nd-logo .ndl-core')].map(c => ({ style: c.hasAttribute('style'), stroke: getComputedStyle(c).stroke, flut: c.classList.contains('is-flut') }))");
    okF(landed, `THE O'S WHITE CORE: the flutter landed on the O within 12 s (${landed})`);
    ok(cores.every(c => !c.style && c.stroke !== 'none' && !c.flut), `THE O'S WHITE CORE: every letter keeps its core — no style attribute left, stroke ${[...new Set(cores.map(c => c.stroke))].join(' / ')}`);
    // (the CSS half: even an empty style="" on the plain O no longer takes its core away)
    const s2 = await ev(N.page, "(() => { const o = document.querySelector('.nd-logo .ndl-3 .ndl-core'); o.setAttribute('style', ''); const s = getComputedStyle(o).stroke; o.removeAttribute('style'); return s; })()");
    ok(s2 !== 'none', `THE O'S WHITE CORE: the holiday rule reaches only the swapped O (a stray style="" leaves stroke ${s2})`);
    // THE SIGN-DIM HOOK (built for Part 6b's sky messages): the logo dims, the tagline fades, and both come back
    await ev(N.page, "window.__district.signDim('test', { logo: 0.3, tag: 0, ms: 150 })");
    await sleep(600);
    const dim = await ev(N.page, "(() => { const s = document.querySelector('.nd-sign'); return { logo: +getComputedStyle(s.querySelector('.nd-logo-wrap')).opacity, word: +getComputedStyle(s.querySelector('.nd-word-g')).opacity, tag: +getComputedStyle(s.querySelector('.nd-tag')).opacity, by: window.__district.signDim().by }; })()");
    await ev(N.page, "window.__district.signDim('test', null)");
    // (the tagline eases back over its own transition: wait for it, never a fixed sleep — the cloud's machine read 0.969 at 600 ms)
    await waitFor(N.page, "+getComputedStyle(document.querySelector('.nd-sign .nd-tag')).opacity > 0.98", 'the tagline back', 5000).catch(() => {});
    const back = await ev(N.page, "(() => { const s = document.querySelector('.nd-sign'); return { logo: +getComputedStyle(s.querySelector('.nd-logo-wrap')).opacity, word: +getComputedStyle(s.querySelector('.nd-word-g')).opacity, tag: +getComputedStyle(s.querySelector('.nd-tag')).opacity }; })()");
    ok(Math.abs(dim.logo - 0.3) < 0.02 && Math.abs(dim.word - 0.3) < 0.02 && dim.tag < 0.02 && dim.by.includes('test') && back.logo === 1 && back.word === 1 && back.tag > 0.98, `THE SIGN-DIM HOOK: dimmed logo ${dim.logo} / SPEAKEASY ${dim.word} / tagline ${dim.tag} → back ${back.logo} / ${back.word} / ${back.tag}`);
    await N.ctx.close(); }
  for (const [when, kind, core] of [['2026-10-31T22:00', 'halloween', 'rgb(255, 244, 224)'], ['2027-03-17T22:00', 'stpatrick', 'rgb(240, 255, 246)']]) {
    const N = await open({ slot: `h22${kind[0]}`, qs: `when=${when}${GR}`, view: [402, 874] });
    await harborUp(N.page);
    await waitFor(N.page, `!!document.querySelector('.nd-logo .ndl-3[data-kind="${kind}"]')`, `the ${kind} O`, 20000);
    const o = await ev(N.page, `(() => { const g = document.querySelector('.nd-logo .ndl-3'); return { cores: [...g.querySelectorAll('.ndl-core')].map(c => getComputedStyle(c).stroke), styled: [...g.querySelectorAll('path.ndl-body[style]')].map(c => getComputedStyle(c).stroke) }; })()`);
    ok(o.cores.length > 1 && o.cores.every(c => c !== 'none') && o.cores.includes(core) && o.styled.every(c => c !== 'none'), `THE ${kind.toUpperCase()} O: its parts keep their colours (cores ${[...new Set(o.cores)].join(' / ')}; the coloured parts ${[...new Set(o.styled)].join(' / ') || '—'})`);
    await N.ctx.close();
  }
});
G('neon', async () => {
  // ================================================================ FP3a — THE MUSIC STARTING (FREV B3): the sign answers EVERY start of the music
  // (the first tap, the music button back ON), from its real lit state, with a 10 s cooldown; a start during the intro is PENDING, not lost
  const CLOCK = "import('/js/audio/music.js').then(m => m.musicClock())";
  const DAY = `when=2026-10-23T13:00${GR}&intro=1`;
  // (1) the real FULL intro, a tap 300 ms in (it skips the intro) → the music starts → a surge through the daytime glass
  { const P = await open({ slot: 'fs1', qs: DAY, view: [402, 874], wait: false });
    await sleep(300); await tapAt(P.page, 30, 300);
    await waitFor(P.page, "!!document.querySelector('.nd-sign.is-day.nd-surge')", 'the surge through the daytime glass', 12000).catch(() => {});
    await waitFor(P.page, '(window.__district.surge().last || {}).why === "music"', 'the answer to the music', 4000).catch(() => {});
    const sg = await ev(P.page, 'window.__district.surge()');
    ok(sg.last && sg.last.why === 'music' && sg.last.did === 'surge' && sg.count === 1, `THE MUSIC STARTING (the first tap, by day): the sign surged (${JSON.stringify(sg.last)})`);
    // (2) the music button OFF ≥ 1 s, then ON (after the 10 s cooldown) → the same surge again
    await waitFor(P.page, '!window.__district.surge().running && window.__district.surge().cool === 0', 'the cooldown over', 15000);
    await tap(P.page, '.music-btn'); await waitFor(P.page, `${CLOCK}.then(c => c < 0)`, 'the music off', 5000); await sleep(1300);
    await tap(P.page, '.music-btn');
    await waitFor(P.page, 'window.__district.surge().count === 2', 'the second surge', 15000).catch(() => {});
    const s2 = await ev(P.page, 'window.__district.surge()');
    ok(s2.count === 2 && s2.last.why === 'music' && s2.last.did === 'surge', `THE MUSIC BUTTON back ON: the sign surged again (${s2.count}, ${JSON.stringify(s2.last)})`);
    // (9a — the owner's add-on: ON A BEAT — the race waits for the song's next beat (the next downbeat within 0.6 s) on a trusted grid)
    okT(!s2.last.onBeat || (s2.last.onBeat.wait <= 1500 && (s2.last.onBeat.err == null || Math.abs(s2.last.onBeat.err) <= 0.1)), `THE SURGE ON THE BEAT: ${s2.last.onBeat ? `waited ${s2.last.onBeat.wait} ms, fired ${s2.last.onBeat.err} beats off the ${s2.last.onBeat.down ? 'downbeat' : 'beat'}` : 'no trusted grid — at once'}`);
    // (3) OFF / ON again inside 10 s → the cooldown (toggling can't spam it)
    await tap(P.page, '.music-btn'); await waitFor(P.page, `${CLOCK}.then(c => c < 0)`, 'the music off', 5000); await sleep(1300);
    await tap(P.page, '.music-btn');
    // (ATM-A: a cooldown skip is kept apart in surge().skip — `last` stays the last REAL answer)
    await waitFor(P.page, '(window.__district.surge().skip || {}).did === "skip:cool"', 'the cooldown answer', 15000).catch(() => {});
    const s3 = await ev(P.page, 'window.__district.surge()');
    ok(s3.count === 2 && s3.skip && s3.skip.did === 'skip:cool' && s3.last.did === 'surge', `THE MUSIC BUTTON inside 10 s: the cooldown (${s3.count}, skip ${JSON.stringify(s3.skip)}, last ${JSON.stringify(s3.last)})`);
    await P.ctx.close(); }
  // (4) a tap ~100 ms into the intro (on a fast machine too early to skip it: the music starts while the sign powers on → PENDING → it
  // fires after the intro; on a slower one the tap skips the intro — either way the answer is never lost)
  { const P = await open({ slot: 'fs2', qs: DAY, view: [402, 874], wait: false });
    await sleep(100); await tapAt(P.page, 30, 300);
    await waitFor(P.page, 'window.__district.surge().count === 1', 'the pending surge after the intro', 15000).catch(() => {});
    const sg = await ev(P.page, 'window.__district.surge()'), ph = await ev(P.page, 'window.__district.phase()');
    ok(sg.count === 1 && sg.last && sg.last.why === 'music' && sg.last.did === 'surge' && ph.done, `THE MUSIC STARTING early in the intro: answered once the sign was free (${JSON.stringify(sg.last)})`);
    await P.ctx.close(); }
  // (5) at night (the sign lit): the lit race, not the day's surge
  { const P = await open({ slot: 'fs3', qs: NIGHT, view: [402, 874] });
    await waitFor(P.page, "document.querySelector('.nd-sign').classList.contains('is-steady')", 'the sign steady', 20000);
    await tapAt(P.page, 30, 300);
    await waitFor(P.page, 'window.__district.surge().count === 1', 'the lit race', 15000).catch(() => {});
    const sg = await ev(P.page, 'window.__district.surge()');
    ok(sg.count === 1 && sg.last.did === 'first', `THE MUSIC STARTING at night: the lit sign's quick race (${JSON.stringify(sg.last)})`);
    // (6) PENDING, deterministic: an answer asked for while a race runs is kept and fires from that race's end — never lost
    await waitFor(P.page, '!window.__district.surge().running', 'the race over', 8000);
    const a = await ev(P.page, '[window.__district.signSurge(), window.__district.signSurge(), window.__district.surge().pending]');
    await waitFor(P.page, 'window.__district.surge().count === 3', 'the pending answer after the race', 8000).catch(() => {});
    const s6 = await ev(P.page, 'window.__district.surge()');
    ok(a[0] === 'first' && a[1] === 'skip:busy' && a[2] === true && s6.count === 3 && !s6.pending, `PENDING: a second answer during a race (${a.join(' · ')}) fired at its end (count ${s6.count})`);
    await P.ctx.close(); }
});
G('party', async () => {
  { const Q = await open({ slot: 'h10', qs: `when=2026-10-24T23:00${GR}&scene=climb%2Bcrowns`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, 'window.__district.party().show.scene === "climb+crowns" && window.__district.party().show.racing > 0', 'the party show at its peak', 20000);
    // (NEON PASS 5: tiers 1–2 wear THE ROTATING PALETTE — the baked 'party' scheme is tier 0's still party)
    await waitFor(Q.page, "(() => { const n = window.__district.harbor().neon; return n.pal && n.pal.on && n.pal.built > 20 && !n.queued; })()", 'the party colours rolled in', 15000);
    const p = await ev(Q.page, 'window.__district.party()'), hq = await ev(Q.page, 'window.__district.harbor()'), ws = await ev(Q.page, 'window.__district.harbor().wheel.scheme()');
    ok(p.show.moving >= 6 && p.show.racing >= 6 && ws === 'party', `THE PARTY SHOW (11 pm): scene "${p.show.scene}", ${p.show.racing} buildings racing + ${p.show.moving - p.show.racing} running an effect, the wheel in party colours`);
    // NEON PASS 4: obvious in one frame — the party scheme, the sky beams, the beat punching, the string lights in colour
    const pk = await ev(Q.page, `new Promise(res => { let lo = 9, hi = 0, n = 0; const tick = () => { const v = window.__district.party().punch; lo = Math.min(lo, v); hi = Math.max(hi, v); if (++n < 150) requestAnimationFrame(tick); else res({ lo, hi }); }; requestAnimationFrame(tick); })`);
    ok(hq.skyBeams.beams.length >= 2 && p.show.beams > 0.5, `THE SKY BEAMS: ${hq.skyBeams.beams.map(b => b.id + (b.under ? '' : ' (to the top)')).join(', ')}`);
    ok(pk.hi - pk.lo > 0.3, `THE HARD BEAT: the punch swings ${pk.lo.toFixed(2)} → ${pk.hi.toFixed(2)} over ~2.5 s`);
    // PART 7a: the roof string lights are ON, mounted on the parapet's posts (NEON PASS 5 had them off until the speakeasy was built)
    ok(hq.strings.on === true && hq.strings.bulbs >= 8 && hq.strings.runs >= 3, `THE CAFÉ LIGHTS: ON (SP2 — big Edison bulbs on deep swags between posts on the roof: ${hq.strings.runs} swags, ${hq.strings.bulbs} bulbs)`);
    await Q.ctx.close(); }
  await neonPass5Party();
  { const Q = await open({ slot: 'h11', qs: `when=2026-10-24T21:00${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!!window.__district.party().show.scene', 'the warm-up show', 20000);
    const p = await ev(Q.page, 'window.__district.party()');
    ok(p.name === 'warm' && p.show.lights === 0 && ['glow', 'sweep-slow', 'climb-slow', 'chase-heroes'].includes(p.show.scene), `THE WARM-UP (9 pm): a classy scene ("${p.show.scene}"), no searchlights yet`);
    await Q.ctx.close(); }
  // FP2 — PARTY TIMING EARLIER: nothing at 8:15 pm (the warm-up is 8:30), THE PEAK from 9:30 pm (core/harbor-show.js#harborPartyPlan)
  for (const [when, want] of [['2026-10-24T20:15', 'off'], ['2026-10-24T21:45', 'peak']]) {
    const Q = await open({ slot: 'h12', qs: `when=${when}${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    if (want === 'peak') await waitFor(Q.page, "window.__district.party().name === 'peak'", 'the peak at 9:45 pm', 20000);
    else await sleep(1500);         // (timed: the party would have switched on by now)
    const p = await ev(Q.page, '({ on: window.__district.party().on, name: window.__district.party().name, plan: window.__district.party().plan })');
    ok(want === 'off' ? !(p.on > 0) : p.name === 'peak' && p.on > 0, `FP2 TIMING ${when.slice(11)}: ${want === 'off' ? 'no show before the 8:30 warm-up' : 'THE PEAK'} (on ${p.on}, ${p.name}; plan ${p.plan ? `${p.plan.warm}/${p.plan.peak}` : '?'})`);
    await Q.ctx.close(); }
});
// ---- FP3b — THE PEOPLE'S LIFE: REAL DOORS + THE GLOW-WAND DANCE CIRCLE (their own group: the `show` cloud job has the room)
G('life', async () => {
  const P = 'window.__district.harbor()';
  // ---- FP3b — REAL DOORS (&force=doors at night: someone through the side door every ~24 s): the door swings open with someone in
  // its doorway — nobody fading anywhere — and shuts again behind them
  { const Q = await open({ slot: 'pp6', qs: `when=2026-10-22T22:00${GR}&force=doors`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.doors.side > 0.9`, 'the side door open for someone', 60000);
    const pp = await ev(Q.page, `${P}.people`);
    ok(pp.members.some(m => m.door === 'side') && pp.members.every(m => m.a === 1), `REAL DOORS: the side door open (${pp.doors.side}) with ${pp.members.filter(m => m.door === 'side').length} in its doorway, nobody fading`);
    await waitFor(Q.page, `${P}.people.doors.side === 0`, 'the door shut again', 30000);
    ok(true, 'REAL DOORS: the side door shut again behind them');
    await Q.ctx.close(); }
  // ---- FP3b — THE GLOW-WAND DANCE CIRCLE (&force=circle since NIGHT-B: one every 5 minutes) on a party night: it forms on the compass, the cart away
  { const Q = await open({ slot: 'pp7', qs: `when=2026-10-24T22:25${GR}&force=circle`, view: [402, 874] });   // (NIGHT-B: the retired circle — its own preview)
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.dance.k > 0.99`, 'the circle formed', 90000);
    const pp = await ev(Q.page, `${P}.people`);
    ok(pp.dancers >= 4 && !(pp.cart && pp.cart.on), `THE DANCE CIRCLE: ${pp.dancers} dancers on the compass, ${pp.watchers} watching, the chestnut cart away`);
    await Q.ctx.close(); }
});
