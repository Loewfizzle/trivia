// CITY 2.0 — THE HARBOR end to end: the `wild` cloud job's groups (wildlife, workers, legends, weather, bench) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=wild, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, SHOTS, sleep, ok, okT, GR, NIGHT, open, ev, waitFor, tapAt, harborUp, G } from './kit.mjs';

// ================================================================ PART 9a — THE WEATHER (only when real or forced): no weather on a clear day,
// each state forced + its look, the lightning's safety caps, reduced motion, the weather on the sign + the glass (the labels clear), the
// drying street, the festival's line-up
G('weather', async () => {
  const P = 'window.__district.harbor()', W = `${P}.weather`;
  // (SP4 — the owner: the awning's drips fell at ONE rate whatever the rain) checked after the loop: drizzle an occasional drip, rain a
  // steady line, heavy a running fringe (core/harbor-weather.js#dripRate)
  // ---- a CLEAR day: no rain, no fog, no lightning, nothing on the glass, no weather beds
  { const Q = await open({ slot: 'wx0', qs: `when=2026-10-22T13:00${GR}`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const w = await ev(Q.page, W);
    ok(w && w.state === 'clear' && w.rain === 0 && w.fog === 0 && !w.lightning && w.rainFx.drops === 0 && !w.glass.on && w.wet === 0, `NO WEATHER ON A CLEAR DAY: ${w && w.line}`);
    await Q.ctx.close(); }
  // ---- EACH STATE, forced by name (&force=…): the model's state + its look on the city
  const STATES = [
    ['drizzle', w => w.state === 'drizzle' && w.rain > 0.1 && w.rain < 0.35 && w.rainFx.drops > 20],
    ['rain', w => w.state === 'rain' && w.rain > 0.35 && w.rainFx.drops > 60 && w.wet === 1],
    ['heavy-rain', w => w.state === 'heavy' && w.rain > 0.7 && w.rainFx.drops > 120],
    ['storm', w => w.state === 'storm' && w.lightning && w.rain > 0.6],
    ['fog', w => w.state === 'fog' && w.fog > 0.6 && w.rainFx.drops === 0],
    ['mist', w => w.state === 'mist' && w.fog > 0.2 && w.fog < 0.6],
    ['windy', w => w.state === 'windy' && w.wind > 10 && w.rain === 0],
    ['freezing-rain', w => w.state === 'freezing' && w.ice > 0.3 && w.rain > 0.2],
  ];
  const dripCheck = () => { const d = dripRates; ok(d.drizzle > 0.5 && d.drizzle < 3 && d.rain > 8 && d.rain < 16 && d['heavy-rain'] >= 25 && d['heavy-rain'] > d.rain && d.rain > d.drizzle, `THE AWNING'S DRIPS BY THE RAIN: drizzle ${d.drizzle} · rain ${d.rain} · heavy ${d['heavy-rain']} drops a second (occasional → a steady line → a running fringe)`); };
  const dripRates = {};
  for (const [id, test] of STATES) {
    const Q = await open({ slot: `wx-${id}`, qs: `when=2026-10-22T22:30${GR}&force=${id}`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1200);
    const w = await ev(Q.page, W);
    ok(w && test(w), `THE WEATHER — ${id.toUpperCase()}: ${w && w.line} · drops ${w && w.rainFx.drops}`);
    if (w && w.ground) dripRates[id] = w.ground.dripRate;
    if (id === STATES[STATES.length - 1][0]) dripCheck();
    if (id === 'rain') {
      // the night rain catches the tubes' + the lamps' light; the beads on the NEON sign; the dock's glass beaded — never over a label
      await waitFor(Q.page, `${W}.glass.beads > 8`, 'beads on the sign', 12000).catch(() => {});
      const g = await ev(Q.page, `${W}.glass`), lit = await ev(Q.page, `${W}.rainFx.lit`);
      ok(g.beads > 8 && g.layers.includes('sign') && lit > 50, `THE SIGN IN THE RAIN: ${g.beads} beads on the tubes (layers ${g.layers.join(',')}), the rain lit by ${lit} light cells`);
      // SP3 — REAL WATER on the dock + the corner buttons: the drops land, grow, streak + drip; each canvas INSIDE its button, UNDER its
      // label / icon (the labels draw on top: the corner ones at z −1 in the button's own stacking context, the dock's inside the disc /
      // the pill's glass, below the labels)
      await waitFor(Q.page, `(() => { const w = ${W}.glass.water || {}; return Object.values(w).reduce((a, v) => a + v.drops, 0) > 8; })()`, 'water on the glass', 15000).catch(() => {});
      await waitFor(Q.page, `(() => { const w = ${W}.glass.water || {}; return Object.values(w).some(v => v.streaking || v.trails); })()`, 'a streak', 20000).catch(() => {});
      const gw = await ev(Q.page, `${W}.glass`);
      const tot = Object.values(gw.water || {}).reduce((a, v) => a + v.drops, 0), streak = Object.values(gw.water || {}).some(v => v.streaking || v.trails);
      ok(tot > 8 && streak && ['join', 'host', 'pill', 'menu', 'music'].every(id => gw.glassLayers.includes(id)), `REAL WATER ON THE GLASS: ${tot} drops on ${gw.glassLayers.join(', ')} — ${streak ? 'a drop streaking down' : 'NO streak'} (${JSON.stringify(gw.water)})`);
      const under = await ev(Q.page, `(() => [...document.querySelectorAll('canvas.nd-wxg')].map(cv => { const p = cv.parentElement, corner = p.matches('.menu-btn, .music-btn'); return [p.className.split(' ')[0], corner ? cv.style.zIndex === '-1' && getComputedStyle(p).zIndex !== 'auto' : p.matches('.nd-hdisc, .nd-bar-glass')]; }))()`);
      ok(under.length >= 5 && under.every(([, u]) => u), `THE LABELS DRAW ON TOP: every glass canvas sits inside its button, under its label / icon (${under.map(([c, u]) => `${c}${u ? '' : ' OVER'}`).join(', ')})`);
      // THE BUTTONS' RAIN FADES WITH THEM (the owner's iPhone: two rings of dots stayed in the corners at rest): at rest every glass canvas
      // is as invisible as its button (it inherits the button's opacity — nothing of a hidden button's weather remains)
      await ev(Q.page, 'window.__district.idle && window.__district.idle()');
      await sleep(2300);
      const vis = await ev(Q.page, `[...document.querySelectorAll('canvas.nd-wxg')].map(cv => { let o = 1; for (let e = cv; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return +o.toFixed(3); })`);
      ok(vis.length >= 5 && vis.every(o => o < 0.02), `THE GLASS's WEATHER HIDES WITH ITS BUTTON at rest: the canvases' opacity ${vis.join(', ')}`);
      if (SHOTS) await Q.page.screenshot({ path: `${OUT}weather-rain-night-402x874.png` });
    }
    if (id === 'storm') {
      // THE LIGHTNING's SAFETY: over ~14 s the flash never passes its cap, the strikes >= 4.5 s apart, the city never washed white
      const tr = await ev(Q.page, `new Promise(res => { const out = [], t0 = performance.now(); (function lp() { const z = ${W}.zap; out.push([performance.now() - t0, z.flash, z.strikes]); if (performance.now() - t0 < 14000) setTimeout(lp, 40); else res(out); })(); })`);
      const mx = Math.max(...tr.map(r => r[1])), st = []; for (let i = 1; i < tr.length; i++) if (tr[i][2] > tr[i - 1][2]) st.push(tr[i][0]);
      const gaps = st.slice(1).map((t2, i) => t2 - st[i]);
      ok(mx <= 0.43 && gaps.every(g2 => g2 >= 4400), `THE LIGHTNING IS CAPPED: the brightest flash ${mx.toFixed(2)} (<= 0.42), ${st.length} strikes ${gaps.length ? `${Math.round(Math.min(...gaps))} ms+ apart` : ''}`);
      if (SHOTS) await Q.page.screenshot({ path: `${OUT}weather-storm-night-402x874.png` });
    }
    if (id === 'freezing-rain') { const g = await ev(Q.page, `${W}.glass`); ok(g.ice > 0.3 && g.frost === 0 && g.glassLayers.includes('pill'), `FREEZING RAIN: the glaze on the tubes (${g.ice}), no frost on the buttons' glass — 9d, the pane only (${g.frost}), layers ${g.layers.join(',')} + ${g.glassLayers.join(',')}`); }
    await Q.ctx.close();
  }
  // ---- REDUCED MOTION (the app's setting): no lightning flash, no weather on the glass UI
  { const Q = await open({ slot: 'wx-rm', qs: `when=2026-10-22T22:30${GR}&force=storm`, view: [402, 874], init: { fn: () => { try { const k = 'na:settings', s = JSON.parse(localStorage.getItem(k) || '{}'); s.reducedFx = true; localStorage.setItem(k, JSON.stringify(s)); } catch { /* fine */ } }, arg: null } });
    await harborUp(Q.page);
    const tr = await ev(Q.page, `new Promise(res => { let mx = 0; const n0 = ${W}.zap.strikes, t0 = performance.now(); (function lp() { mx = Math.max(mx, ${W}.zap.flash); if (performance.now() - t0 < 9000) setTimeout(lp, 50); else res({ mx, n: ${W}.zap.strikes - n0, water: ${W}.glass.water }); })(); })`);
    ok(tr.mx <= 0.13 && Object.keys(tr.water || {}).length === 0, `REDUCED MOTION: only a DIMMED flash (${tr.mx} ≤ 0.13 — ATM-B: dimmed, one soft pulse, no bolt) through ${tr.n} strikes (the thunder still rumbles), the glass only a few STILL beads (no water moving: ${JSON.stringify(tr.water)})`);
    await Q.ctx.close(); }
  // ---- THE WET STREET DRYING: 12 min after the rain stopped (&rained=12) — still wet, drying; the puddles still there
  { const Q = await open({ slot: 'wx-dry', qs: `when=2026-10-22T22:30${GR}&wx=clear&rained=12`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1200);
    const w = await ev(Q.page, W);
    ok(w.rain === 0 && w.wet > 0.6 && w.wet < 0.85 && w.ground.puddles >= 5, `THE WET STREET DRYING: wet ${w.wet} 12 min after the rain, ${w.ground.puddles} puddles (drying one by one), no rain`);
    await Q.ctx.close(); }
  // ---- C4a — THE WET STREET UNDER THE DOCK (the owner: two dotted streaks "going their own ways" = the IMPLIED lamps, behind us): with the
  // dock at rest on a wet night, no column at an implied lamp's x brighter than its neighbours by > 12 %; the sheen brightest at the foot
  { const probe = async wet => {
      const Q = await open({ slot: `wx-sheen${wet ? 'w' : 'd'}`, qs: `when=2026-10-21T22:30${GR}&wx=clear${wet ? '&force=wet-street' : ''}`, view: [402, 874] });
      await harborUp(Q.page);
      await ev(Q.page, 'window.__district.idle()'); await waitFor(Q.page, 'window.__district.isIdle()', 'the dock at rest', 8000).catch(() => {}); await sleep(2600);
      const r = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, x2 = cv.getContext('2d'), H = cv.clientHeight, W = cv.clientWidth;
        const lum = (x, y0, y1, w = 2) => { const d = x2.getImageData(Math.round(x * k), Math.round(y0 * k), Math.max(1, Math.round(w * k)), Math.max(1, Math.round((y1 - y0) * k))).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]; return s / (d.length / 4); };
        const xs = ${P}.promenade.lamps.filter(l => l.kind === 'implied').map(l => l.at[0]).filter(x => x > 14 && x < W - 14), y0 = H - 70, y1 = H - 6;
        res({ cols: xs.map(x => ({ x: Math.round(x), r: +(lum(x, y0, y1) / Math.max(1, (lum(x - 9, y0, y1) + lum(x + 9, y0, y1)) / 2)).toFixed(3) })), foot: lum(8, H - 10, H - 4, W - 16), up: lum(8, H - 50, H - 44, W - 16) }); }))`);
      await Q.ctx.close(); return r; };
    const w = await probe(true), d = await probe(false), worst = Math.max(1, ...w.cols.map(c => c.r)), addFoot = w.foot - d.foot, addUp = w.up - d.up;
    ok(worst <= 1.12 && addFoot >= addUp - 0.5, `C4a THE WET SHEEN: no implied lamp's streak under the dock (worst column ${worst.toFixed(2)} × its neighbours: ${w.cols.map(c => `${c.x}:${c.r}`).join(' ') || 'none on screen'}); the sheen adds ${addFoot.toFixed(1)} at the foot vs ${addUp.toFixed(1)} 40 pt up`); }
  // ---- THE BALLOON FESTIVAL's LINE-UP (the owner's order) + the long flight
  { const Q = await open({ slot: 'wx-bal', qs: `when=2026-10-24T09:30${GR}&wind=1&force=balloon-festival`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `!!${P}.sky.state.balloons`, 'the festival', 10000).catch(() => {});
    const b = await ev(Q.page, `${P}.sky.state.balloons`);
    ok(b && b.order.join() === 'btc-orange,alien,bitcoin,bullseye,smiley,flag' && b.dur >= 3600 && b.dur <= 5400, `THE FESTIVAL: ${b && b.order.join(' → ')} · a ${b && Math.round(b.dur / 60)}-min flight`);
    await Q.ctx.close(); }
  // ---- ATM-B — HEAVY SNOW IN LAYERS + THE BLIZZARD: heavy snow = the far veil (a 'snow' look) + more, bigger flakes; the blizzard = a
  // WHITEOUT with depth, the snow driven sideways, the heads bowed, the blizzard's bed in the mix
  { const H1 = await open({ slot: 'hs1', qs: `when=2026-12-15T12:30${GR}&force=heavy-snow`, view: [402, 874] });
    await harborUp(H1.page); await sleep(1500);
    const hw = await ev(H1.page, W);
    ok(hw.state === 'snow' && hw.fogDepth.mode === 'snow' && !(hw.line || '').includes('BLIZZARD'), `ATM-B HEAVY SNOW IN LAYERS: ${hw.line} · the veil ${hw.fogDepth.mode} (${hw.fogDepth.veils} veils)`);
    await H1.ctx.close();
    const B1 = await open({ slot: 'bz1', qs: `when=2026-12-15T12:30${GR}&force=blizzard`, view: [402, 874] });
    await harborUp(B1.page); await tapAt(B1.page, 30, 300); await sleep(2500);
    const bw = await ev(B1.page, W), fw = await ev(B1.page, `${P}.people.wind`), beds = await ev(B1.page, `${P}.sounds && ${P}.sounds.beds ? ${P}.sounds.beds : null`).catch(() => null);
    ok(/BLIZZARD/.test(bw.line) && bw.fogDepth.mode === 'whiteout' && bw.fogDepth.x > 0.8 && fw.down > 0.8 && fw.flap > 0.3, `ATM-B THE BLIZZARD: ${bw.line} · the whiteout ${bw.fogDepth.mode} (x ${bw.fogDepth.x}), heads down ${fw.down}, coats ${fw.flap}${beds ? ` · beds ${JSON.stringify(beds)}` : ''}`);
    await B1.ctx.close(); }
  // ---- ATM-B — FREEZING RAIN READS AS ICE: icicles on the ledges + the signs' frames + the railing, the ice sheen, people's careful steps
  { const Q = await open({ slot: 'fz1', qs: `when=2026-11-20T21:30${GR}&force=freezing-rain`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const w = await ev(Q.page, W), fw = await ev(Q.page, `${P}.people.wind`);
    ok(w.ice > 0.4 && w.iceFx.icicles >= 40 && w.iceFx.edges >= 10 && fw.icy > 0.5, `ATM-B FREEZING RAIN = ICE: ${w.iceFx.icicles} icicles on ${w.iceFx.edges} edges (ice ${w.ice}), careful steps (icy ${fw.icy})`);
    await Q.ctx.close(); }
  // ---- ATM-B — THE STORM: the deck rolls in (the low heavy base + the cumulonimbus towers), the panel's CLOSE STRIKE (&force=strike) lands
  // a thick fork on a crown / the water / THE NEEDLE within ~15 s, the flash still capped
  { const Q = await open({ slot: 'st1', qs: `when=2026-11-03T21:30${GR}&force=storm,strike`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${W}.zap.kinds.close >= 1 && ${W}.storm.k > 0.5`, 'a close strike', 20000).catch(() => {});
    const sw = await ev(Q.page, W), z = sw.zap;
    ok(sw.storm.k > 0.5 && sw.storm.deck.towers >= 2 && z.kinds.close >= 1 && (z.kinds.crown || 0) + (z.kinds.water || 0) + (z.kinds.needle || 0) >= 1, `ATM-B THE STORM: the deck in (${sw.storm.k}, ${sw.storm.deck.towers} towers, ${sw.storm.deck.mb} MB), the CLOSE STRIKE landed (${JSON.stringify(z.kinds)})`);
    // (ATM-C — THE RECORDED THUNDER ON ITS OWN CRACK: the close strike picked one of Grok's close takes and the crack is HEARD at the flash +
    // the distance delay — the flash held back by `lead`, or the file by `wait` (lead − wait = crack − delay); the synthesized crack gone)
    const tl = ((await ev(Q.page, 'window.__district.harbor().sounds.thunderLog')) || []).filter(e => e.crack != null);
    const e0 = tl[0];
    ok(e0 && /^thunder-(close-[1-5]|alt-close-(crackle|deepslam))$/.test(e0.take) && Math.abs((e0.lead - e0.wait) - (e0.crack - e0.delay)) < 0.03, `ATM-C THE CLOSE THUNDER IS RECORDED + ON ITS CRACK: ${e0 ? `${e0.take} — crack ${e0.crack} s in, the distance ${e0.delay} s → the flash held ${e0.lead} s, the file ${e0.wait} s${e0.second ? `, a second flash ${e0.second.toFixed(2)} s on` : ''}` : 'no close thunder logged'}`);
    await Q.ctx.close(); }
  // ---- ATM-B — FOG AS DEPTH (fogdepth.js; the owner: "fog doesn't really do anything"): DENSE fog = the veils by depth (the far rows gone,
  // the middle ghostly, the stage clear) + the lights' halos + the drifting banks; MIST its own lighter look; the skyline's contrast
  // measured against a clear night (the band above the water: its spread of brightness falls)
  { const spread = Q => ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, wb = ${P}.water.band;
      const y1 = Math.round(((wb && wb.y0) || 640) * k), h = Math.round(110 * k), d = cv.getContext('2d').getImageData(0, y1 - h, cv.width, h).data; let n = 0, s = 0, s2 = 0;
      for (let i = 0; i < d.length; i += 4 * 13) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; n++; s += v; s2 += v * v; } const m = s / n; res(+Math.sqrt(s2 / n - m * m).toFixed(1)); }))`);
    const at = `when=2026-11-03T21:30${GR}`;
    const C0 = await open({ slot: 'fg0', qs: `${at}&wx=clear`, view: [402, 874] }); await harborUp(C0.page); await sleep(1500);
    const sc = await spread(C0); await C0.ctx.close();
    const F = await open({ slot: 'fg1', qs: `${at}&force=fog`, view: [402, 874] }); await harborUp(F.page); await sleep(1500);
    const fd = await ev(F.page, `${W}.fogDepth`), sf = await spread(F);
    ok(fd && fd.mode === 'dense' && fd.veils >= 5 && fd.halos >= 3 && fd.banks >= 1 && sf < sc * 0.7, `ATM-B DENSE FOG = DEPTH: ${fd && `${fd.veils} veils, ${fd.halos} halos, ${fd.banks} banks`}; the skyline's contrast ${sf} vs a clear night's ${sc}`);
    await F.ctx.close();
    const M = await open({ slot: 'fg2', qs: `${at}&force=mist`, view: [402, 874] }); await harborUp(M.page); await sleep(1500);
    const md = await ev(M.page, `${W}.fogDepth`), sm = await spread(M);
    ok(md && md.mode === 'mist' && sm < sc && sm > sf, `ATM-B MIST ≠ FOG: mist ${md && md.mode} (contrast ${sm}) between a clear night's ${sc} and dense fog's ${sf}`);
    await M.ctx.close(); }
  // ---- ATM-A — THE WIND AS ONE SYSTEM (core/harbor-wind.js): still air keeps the crowns at rest, a WINDY day sways them (the gust waves
  // rolling through), a GALE bends them hard; the moving crowns are CUT from their layer (no ghost); the water is never a mirror (its
  // roughness floor); in a gale the gusts are HEARD on the visual waves (after a tap)
  { const amps = async (Q, ms) => { let mx = 0; const end = Date.now() + ms; while (Date.now() < end) { const s = await ev(Q.page, `${W}.sway`); if (s && s.amps) mx = Math.max(mx, ...s.amps.map(Math.abs)); await sleep(150); } return mx; };
    const C = await open({ slot: 'wd0', qs: `when=2026-10-22T13:00${GR}&wx=clear&wind=0`, view: [402, 874] });
    await harborUp(C.page);
    const c0 = await amps(C, 3000), wC = await ev(C.page, `${W}.windF`), rC = await ev(C.page, `${P}.water.rough`);
    ok(c0 < 1.2 && wC && wC.look === 'calm', `ATM-A STILL AIR: the crowns near rest (max ${c0.toFixed(2)} pt), the wind ${wC && wC.look}`);
    ok(rC >= 0.2, `ATM-A THE WATER NEVER A MIRROR: roughness ${rC} at 0 m/s (the floor 0.2)`);
    await C.ctx.close();
    const Wd = await open({ slot: 'wd1', qs: `when=2026-10-22T13:00${GR}&force=windy`, view: [402, 874] });
    await harborUp(Wd.page);
    const a1 = await amps(Wd, 6000), s1 = await ev(Wd.page, `${W}.sway`), w1 = await ev(Wd.page, `${W}.windF`);
    ok(w1 && w1.look === 'windy' && a1 > 3 && s1.cut >= 1, `ATM-A A WINDY DAY: the crowns sway up to ${a1.toFixed(1)} pt at the top (${s1.cut} cut from their layer — no ghost), the wind ${w1 && `${w1.speed} m/s, gusts ${w1.gust}`}`);
    await Wd.ctx.close();
    const G2 = await open({ slot: 'wd2', qs: `when=2026-10-22T13:00${GR}&force=gale`, view: [402, 874] });
    await harborUp(G2.page); await tapAt(G2.page, 30, 300);
    const a2 = await amps(G2, 9000), w2 = await ev(G2.page, `${W}.windF`);
    const snd = await ev(G2.page, 'window.__district.harbor().sounds ? window.__district.harbor().sounds.wind : null').catch(() => null);
    ok(w2 && w2.look === 'gale' && a2 > a1 && a2 > 6, `ATM-A A GALE: the crowns bent up to ${a2.toFixed(1)} pt (a windy day's ${a1.toFixed(1)}), the wind ${w2 && `${w2.speed} m/s`}`);
    okT(!snd || snd.gusts >= 1, `ATM-A THE GUSTS HEARD on the visual waves: ${snd ? `${snd.gusts} gust sounds in ~9 s` : 'no sounds readout'}`);
    // ATM-B — COATS + SCARVES STREAM (the owner, Oct 31): in a gale the people's coats + scarves stream downwind (folk.js#setFolkWind's
    // flap); a calm day's stay still (the still-air page above read 0)
    { const fw = await ev(G2.page, `${P}.people.wind`);
      ok(fw && fw.flap > 0.4 && fw.lean > 0.02 && fw.side === w2.side, `ATM-B THE COATS + SCARVES STREAM in a gale: flap ${fw && fw.flap}, lean ${fw && fw.lean} rad, downwind ${fw && fw.side > 0 ? 'right' : 'left'}`); }
    await G2.ctx.close(); }
});
// ---- PART 8b1 — THE WILDLIFE (core/harbor-wildlife.js + screens/harbor/wildlife.js + fauna.js): the animals drawn where they stand,
// the pigeons flushing + coming back, the night's coyote, the can, the gulls landing, every panel row showing its animal
G('wildlife', async () => {
  const P = 'window.__district.harbor()', W = `${P}.wildlife`;
  const band = p => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, c = ${P}.cam, y0 = Math.round((c.dock.y - 130) * k), h = Math.round(120 * k);
    const d = cv.getContext('2d').getImageData(0, y0, cv.width, h).data, out = []; for (let i = 0; i < d.length; i += 4 * 97) out.push(d[i] + d[i + 1] + d[i + 2]); res(out); }))`);
  // ---- THE FLOCK (&force=pigeons at noon, no people: nothing scares them): all eight out, every one on screen above the dock; drawn
  { const Q = await open({ slot: 'wl1', qs: `when=2026-10-22T12:00${GR}&force=pigeons,no-people`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${W}.pigeons.filter(p => !p.away).length >= 6`, 'the flock out', 10000).catch(() => {});
    const wl = await ev(Q.page, W), cam = await ev(Q.page, `${P}.cam`);
    const out = wl.pigeons.filter(p => !p.away), scr = await ev(Q.page, `${W}.pigeons.filter(p => !p.away).map(p => [p.x, p.y, p.z])`);
    const ys = scr.map(([x, y, z]) => cam.VPY + cam.F * (cam.CAMH - y) / z);
    ok(out.length >= 6 && ys.every(y => y < cam.dock.y - 1), `THE PIGEONS (&force=pigeons): ${out.length} of 8 out (${[...new Set(out.map(p => p.spot))].join(', ')}), every one above the dock (lowest ${Math.max(...ys).toFixed(0)} < ${cam.dock.y})`);
    const a = await band(Q.page);
    const O = await open({ slot: 'wl1b', qs: `when=2026-10-22T12:00${GR}&force=pigeons,no-people,no-wildlife`, view: [402, 874] });
    await harborUp(O.page);
    const b = await band(O.page), diff = a.reduce((s, v, i) => s + (Math.abs(v - b[i]) > 30 ? 1 : 0), 0);
    ok(diff > 3, `THE WILDLIFE is drawn: the promenade's band differs from &force=no-wildlife in ${diff} samples (the flock + the hydrant)`);
    const hy = await ev(Q.page, `${W}.hydrantState()`);
    ok(hy && hy.spray === 0, `THE FIRE HYDRANT by the front-left lamp, shut at noon in October (${JSON.stringify(hy)})`);
    await O.ctx.close(); await Q.ctx.close(); }
  // ---- THE SCATTER (&force=pigeons-scatter: a scare every 25 s): they burst up — in the air within the loop, then each lands on a
  // ledge or is away a while (never back on the same cobbles at once)
  { const Q = await open({ slot: 'wl2', qs: `when=2026-10-22T12:00${GR}&force=pigeons,pigeons-scatter,no-people`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${W}.pigeons.some(p => p.air)`, 'a pigeon in the air', 30000);
    await waitFor(Q.page, `${W}.pigeons.some(p => p.ov === 'away' || (p.ov === 'at' && p.spot !== 'air'))`, 'landed on a ledge / away', 15000);
    const wl = await ev(Q.page, W);
    ok(wl.pigeons.some(p => p.ov), `THE SCATTER: the flock burst up — now ${wl.pigeons.map(p => (p.away ? 'away' : p.spot) + (p.ov ? `(${p.ov})` : '')).join(' ')}`);
    await Q.ctx.close(); }
  // ---- THE NIGHT: the coyote (its stop under the lamp + the eye-flash)
  { const Q = await open({ slot: 'wl3', qs: `when=2026-10-22T23:40${GR}&force=coyote`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `!!${W}.coyote`, 'the coyote', 15000);
    const eyes = await waitFor(Q.page, `${W}.coyote && ${W}.coyote.eyes > 0.3`, 'the eye-flash under the lamp', 40000).then(() => true).catch(() => false);
    ok(eyes, 'THE COYOTE: trots in, stops under the tall lamp, turns its head to us — the green-gold eye-flash');
    await Q.ctx.close(); }
  // ---- THE PANEL: every WILDLIFE row brings its animal (JUST ME), the night ones at night
  for (const [when, list] of [[`when=2026-07-10T12:00${GR}`, [['pigeons', 'w.pigeons.some(p => !p.away)'], ['gulls-land', 'w.gulls.length > 0'], ['squirrel', '!!w.squirrel'], ['snowy-owl', '!!w.owl'], ['heron', '!!w.heron'], ['fish', 'w.fish > 0'], ['cat-out', '!!w.cat']]],
    [`when=2026-07-10T23:30${GR}`, [['coyote', '!!w.coyote'], ['fireflies', 'w.fireflies > 0']]]]) {
    const Q = await open({ slot: `wl4${list.length}`, qs: `${when}&panel=1`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!!window.__district.remote()', 'the panel', 10000);
    const got = [], missing = [];
    for (const [id, cond] of list) {
      await ev(Q.page, `window.__district.remote().setMine({ force: ['${id}'] })`);
      const okk = await waitFor(Q.page, `(() => { const w = ${W}; return !!(${cond}); })()`, id, 12000).then(() => true).catch(() => false);
      (okk ? got : missing).push(id);
      await ev(Q.page, 'window.__district.remote().setMine({})');
      await waitFor(Q.page, '!window.__district.harbor().flags.remote', 'cleared', 4000).catch(() => {});
    }
    ok(!missing.length, `THE PANEL'S WILDLIFE (${/T12/.test(when) ? 'by day' : 'at night'}): ${got.join(', ')} each appeared within 12 s${missing.length ? ` — MISSING: ${missing.join(', ')}` : ''}`);
    await Q.ctx.close();
  }
});
// ================================================================ PART 8b1 — THE WORKERS' SCHEDULE (ONLY=workers)
G('workers', async () => {
  const P = 'window.__district.harbor()';
  // ---- THE MILK TRUCK (&force=work-milk — one every 3 minutes): the dairy van parks at the stop, the milkman round its nose to the
  // barbershop's step, his bottles left there (a trace), the van away on green
  { const Q = await open({ slot: 'wk1', qs: `when=2026-10-22T13:00:02${GR}&force=work-milk`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(${P}.people.crew || {}).trucks && ${P}.people.crew.trucks.some(T => T.parked)`, 'the dairy van at the stop', 60000);
    const c1 = await ev(Q.page, `${P}.people.crew`);
    ok(c1.trucks.length === 1 && c1.trucks[0].model === 'van', `THE MILK TRUCK: the ${c1.trucks[0] && c1.trucks[0].model} parked at x ${c1.trucks[0] && c1.trucks[0].x}`);
    await waitFor(Q.page, `${P}.people.crew.traces.milk`, 'the bottles on the step', 90000);
    const c2 = await ev(Q.page, `${P}.people.crew`);
    ok(c2.traces.milk && c2.members.some(m => m.kind === 'milk'), `THE MILK TRUCK: the bottles on the step, the milkman ${(c2.members.find(m => m.kind === 'milk') || {}).pose} on his way back`);
    await Q.ctx.close(); }
  // ---- THE BILLPOSTER (&force=work-billposter): up on the roof's catwalk, the new poster pasted over the old one sheet by sheet
  { const Q = await open({ slot: 'wk2', qs: `when=2026-10-22T13:06:00${GR}&force=work-billposter`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(${P}.people.crew.roof || []).some(m => m.kind === 'billposter' && m.y > 1)`, 'the billposter on the catwalk', 60000);
    const c = await ev(Q.page, `${P}.people.crew`);
    ok(!!c.traces.board.pasting, `THE BILLPOSTER: on the catwalk (y ${c.roof.find(m => m.kind === 'billposter').y}), pasting ${c.traces.board.pasting && c.traces.board.pasting.from} → ${c.traces.board.pasting && c.traces.board.pasting.to}`);
    await Q.ctx.close(); }
  // ---- THE SIGN PAINTERS (&force=work-painters: the Monday repaint compressed into 20 minutes): the ladder against the blade, the
  // old name painted out, the new one going on
  { const Q = await open({ slot: 'wk3', qs: `when=2026-10-22T13:07:00${GR}&force=work-painters`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(${P}.people.crew.props || []).includes('ladder') && !!${P}.people.crew.traces.blade`, 'the ladder up, the repaint on', 60000);
    const c = await ev(Q.page, `${P}.people.crew`);
    ok(c.members.filter(m => m.kind === 'painter').length === 2, `THE SIGN PAINTERS: two painters, the ladder up, the blade at '${c.traces.blade.stage}'`);
    await Q.ctx.close(); }
  // ---- THE REAL DAY: a Monday 8:31 am — the barber at his shop, the newsboy at his stand (fixed times, no &force)
  { const Q = await open({ slot: 'wk4', qs: `when=2026-10-26T08:31:00${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(${P}.people.crew.works || []).includes('barber')`, 'the barber out', 30000);
    const c = await ev(Q.page, `${P}.people.crew`);
    ok(c.works.includes('newsboy') && c.props.includes('stand'), `THE REAL DAY (Mon 8:31): out — ${c.works.join(', ')}; props ${c.props.join(', ')}`);
    await Q.ctx.close(); }
  // ---- THE WITNESSES (Group 3, &force=ufo on a busy Saturday night): they look up, then RUN as the beam opens; the promenade empties
  { const Q = await open({ slot: 'wk5', qs: `when=2026-11-07T22:10:00${GR}&force=ufo&lgnow=1`, view: [402, 874] });   // (11a-2: a November Saturday — the giant stands on the compass Oct 20 → 31)
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.running >= 2`, 'the witnesses fleeing at a run', 60000);
    const p1 = await ev(Q.page, `${P}.people`);
    ok(p1.witness && p1.witness.kind === 'ufo', `THE WITNESSES: ${p1.running} running from the saucer (${p1.witness && p1.witness.n} reacting)`);
    await waitFor(Q.page, `${P}.people.members.filter(m => m.role !== 'dog' && m.z < 53).length === 0`, 'the promenade empty', 40000);
    ok(true, 'THE WITNESSES: the promenade empty after they fled');
    await Q.ctx.close(); }
  // ---- 8b2 — THE CABS: a weeknight's drop at the curb (20:44:54 on Thu Oct 22 — core/harbor-cabs.js, seeded): the cab at the stop, its
  // lamp dark with a fare aboard, its fare out onto the promenade
  { const Q = await open({ slot: 'wk7', qs: `when=2026-10-22T20:44:40${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(${P}.people.cars || []).some(c => c.model === 'taxi' && Math.abs(c.speed) < 0.05)`, 'the cab at the curb', 40000).catch(() => {});
    const cab = await ev(Q.page, `(${P}.people.cars || []).find(c => c.model === 'taxi' && Math.abs(c.speed) < 0.05) || null`);
    ok(!!cab, `THE CABS: a cab stopped at the curb (${cab ? cab.x : '—'})`);
    await Q.ctx.close(); }
  // ---- 8b2 — THE RAID (&force=raid on a weeknight): the patrol cars out, the speakeasy dark the instant they show, the officer's flashlight,
  // the lights back after they're gone
  { const Q = await open({ slot: 'wk6', qs: `when=2026-10-22T22:00:00${GR}&force=raid`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(${P}.raid || {}).phase === 'dark' && ${P}.raid.cars > 0 && ${P}.speakeasy.power() < 0.05`, 'the patrol cars out + the speakeasy dark', 90000);
    const r1 = await ev(Q.page, `${P}.raid`), pw = await ev(Q.page, `${P}.speakeasy.power()`);
    ok(r1.cars >= 1 && pw === 0, `THE RAID: ${r1.cars} patrol cars on the road, the speakeasy's power ${pw}`);
    await waitFor(Q.page, `(${P}.raid || {}).beam > 0.5`, 'the officer flashlight', 60000);
    ok(true, 'THE RAID: the officer sweeps the windows with his flashlight');
    await waitFor(Q.page, `(${P}.raid || {}).phase === 'back' && ${P}.raid.power > 0.9`, 'the lights back', 80000);
    ok(true, 'THE RAID: the lights back after the cars are gone');
    await Q.ctx.close(); }
});
// ================================================================ PART 6b — THE LEGENDARY SKY (ONLY=legends)
G('legends', async () => {
  const P = 'window.__district.harbor()';
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  // ---- a normal night never loads the legendary module (it's lazy: a legendary night, a preview or the API only)
  { const Q = await open({ slot: 'lg0', qs: NIGHT, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const st = await ev(Q.page, `${P}.legend.state`);
    // (jets.js is shared with skytyping + the air show — the legendary module itself, legends.js, is the lazy one)
    ok(!Q.files.some(f => /harbor\/legends\.js/.test(f)) && !st.run, `THE LEGENDARY SKY: a normal night never loads its module (${Q.files.filter(f => /legends\.js/.test(f)).length} files)`);
    ok(!Q.files.some(f => /assets\/city\/ufo\//.test(f)), `THE UFO BAKE: a normal night never fetches the craft's sprites (${Q.files.filter(f => /city\/ufo\//.test(f)).length} files)`);
    ok(!Q.files.some(f => /assets\/city\/f22\//.test(f)), `THE F-22 BAKE (SKY-A): a normal night never fetches the jet's sprites (${Q.files.filter(f => /city\/f22\//.test(f)).length} files)`);
    await Q.ctx.close(); }
  // ---- THE UFO ABDUCTION held mid-lift (&lgs=14): the module loaded on demand, the beam a bright pale column over the compass
  // (11a-2: a NOVEMBER night — from Oct 20 the giant pumpkin stands on the compass, and no abduction is scheduled over a centrepiece)
  { const Q = await open({ slot: 'lg1', qs: `when=2026-11-04T22:00${GR}&force=ufo&lgs=14&force=no-people`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.legend.state.phase === 'lift'`, 'the abduction loaded + lifting', 20000);
    const m = (await ev(Q.page, `${P}.promenade`)).medallion, c = await px(Q.page, m[0] - 22, m[1] - 70);
    // (11a-2 — THE REDESIGN: the beam a PALE GREEN — green the strongest channel, still bright; the ring RACING while he's lifted)
    ok(lum(c) > 150 && c[1] >= c[0] && c[1] >= c[2] - 6, `THE ABDUCTION: the beam lights the air over the compass a pale green (rgb ${c.join(',')})`);
    await sleep(600);
    const lg = await ev(Q.page, `${P}.legend.state`);
    ok(!lg || !lg.ring || lg.ring.w > 9, `THE RING RACES while he's lifted: ${lg && lg.ring ? lg.ring.w : '?'} rad/s (calm 7)`);
    // THE UFO BAKE: the craft is sebslom's model (its sprites fetched for the run, drawn — the hand-drawn saucer never baked), its turntable
    // frame + the view angle from the camera (hovering: seen from a few degrees below its rim)
    await waitFor(Q.page, `${P}.legend.state.model === 'ready' && ${P}.legend.state.frame >= 0`, 'the model drawn', 10000).catch(() => {});
    { const s2 = await ev(Q.page, `${P}.legend.state`), got = Q.files.filter(f => /assets\/city\/ufo\//.test(f)).length;
      ok(s2.model === 'ready' && !s2.saucer && s2.frame >= 0 && s2.elev > 2 && s2.elev < 25 && got >= 5, `THE UFO BAKE: the model's craft (${s2.model}, frame ${s2.frame}, seen ${s2.elev}° from below, ${got} sprite files), no hand-drawn bake (${s2.saucer})`); }
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}legend-ufo-402x874.png` });
    await Q.ctx.close(); }
  // ---- C4b — THE PEOPLE RULE (the owner saw everyone snap back after the abduction): the UFO at 8× — the witnesses flee, the promenade
  // stays empty, then refills; every walker's FIRST frame after the page's first is at a way in (off a screen edge, a doorway, the back
  // road / the far kerb, the front street under the dock); nobody walks in before the empty spell ends
  // (started through the API once the page has settled — as a scheduled night or the panel does: &lgnow=1 starts the craft at the load,
  // before its lazy module, so the planner would learn of it after the fact)
  { const Q = await open({ slot: 'lgrule', qs: `when=2026-11-04T21:40${GR}&wx=clear&speed=8`, view: [402, 874] });
    await harborUp(Q.page); await waitFor(Q.page, `!${P}.pending && !${P}.fading`, 'settled', 20000).catch(() => {});
    await ev(Q.page, `${P}.legend.start('ufo')`);
    await ev(Q.page, `(() => { const H = () => window.__district.harbor(), seen = new Map(); window.__rule = { firsts: [], t0: null };
      // (from the moment the planner knows the legendary — &lgnow starts it at the load, before its lazy module: on a real night it's known a
      // minute ahead; slack: the distance a walker covers in one frame at 8×)
      let last = null; const tick = () => { try { const h = H(), cam = h.cam, lg = h.legend.state, ms = (h.people && h.people.members) || [], pn = performance.now(), dt = last == null ? 0 : (pn - last) / 1000 * 8; last = pn;
        if (!window.__rule.started && (!lg || !lg.run)) { requestAnimationFrame(tick); return; } const first = !window.__rule.started; window.__rule.started = true; const slack = 3.2 * dt;
        for (const m of ms) { if (m.role !== 'lead' || seen.has(m.id)) continue; seen.set(m.id, 1); if (first) continue;
          const hw = m.z * cam.W / 2 / cam.F, way = Math.abs(m.x) >= hw + 0.9 - slack || !!m.door || m.z >= 53.5 - slack || m.z < 38.35 + slack || m.a < 0.2;
          window.__rule.firsts.push({ id: m.id, kind: m.kind, x: m.x, z: m.z, way, lgT: lg && lg.t != null ? lg.t : null }); }
        window.__rule.guard0 = window.__rule.guard0 == null ? h.people.guard.total : window.__rule.guard0; window.__rule.guard = h.people.guard; } catch { /* next frame */ } requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
    await sleep(52000);
    const R = await ev(Q.page, 'window.__rule'), bad = R.firsts.filter(f => !f.way);
    // (the planner does the work: the live safety net should rarely have anyone to hide — ≤ 3 at 8×)
    ok(R.firsts.length >= 2 && !bad.length && R.guard && R.guard.total - (R.guard0 || 0) <= 3, `C4b THE PEOPLE RULE after the UFO: ${R.firsts.length} walked in, all at a way in${bad.length ? ` — NOT: ${bad.map(b => `${b.kind} at ${b.x.toFixed(1)}, ${b.z.toFixed(1)}`).join('; ')}` : ''} (the safety net kept ${R.guard ? R.guard.total : '?'} off screen)`);
    await Q.ctx.close(); }
  // ---- THE UFO BAKE: &ufo=classic = the hand-drawn saucer (no sprites fetched)
  { const Q = await open({ slot: 'lg1c', qs: `when=2026-11-04T22:00${GR}&force=ufo&lgs=7&ufo=classic&force=no-people`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.legend.state.saucer`, 'the classic saucer', 20000).catch(() => {});
    const s2 = await ev(Q.page, `${P}.legend.state`);
    ok(s2.model === 'classic' && s2.saucer && !Q.files.some(f => /assets\/city\/ufo\//.test(f)), `THE UFO BAKE: &ufo=classic draws the hand-drawn saucer (${s2.model}, baked ${s2.saucer}), no sprites fetched`);
    await Q.ctx.close(); }
  // ---- 9c — THE UFO HIGHER, NOT FURTHER (the owner: it got confused with the Ferris wheel): hovering, its whole hull (the belly ~0.42
  // radii under its rim) above the wheel's top, its size as before; at 390 / 430 too
  for (const [w, h] of [[390, 844], [430, 932]]) {
    const Q = await open({ slot: `ufo-hi-${w}`, qs: `when=2026-09-15T23:00${GR}&force=ufo&lgs=7`, view: [w, h] });
    await harborUp(Q.page);
    await waitFor(Q.page, `!!(${P}.legend.state.craft && ${P}.legend.state.model === 'ready')`, 'the craft hovering', 25000).catch(() => {});
    const s2 = await ev(Q.page, `${P}.legend.state`), cr = s2.craft;
    ok(cr && s2.wheelTop && cr.y + cr.R * 0.42 < s2.wheelTop && cr.R > 60, `9c THE UFO above the wheel at ${w}: its belly ${cr && (cr.y + cr.R * 0.42).toFixed(0)} < the wheel's top ${s2.wheelTop} (hull ${cr && cr.R} pt)`);
    await Q.ctx.close();
  }
  // ---- 9a: THE LIGHT AUDIT's control — a normal night: the wheel's bulbs + its cabins, the promenade's lamps, the pier lit (so the
  // blackout check above can't pass on zeros)
  { const Q = await open({ slot: 'lg0', qs: `${NIGHT}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(() => { const a = ${P}.lightAudit(); return a.wheelBulbs > 0.5 && a.lampsPost > 0.5; })()`, 'the night lit', 15000).catch(() => {});
    const au = await ev(Q.page, `${P}.lightAudit()`);
    ok(au.wheelBulbs > 0.5 && au.wheelCars >= 10 && au.lampsPost > 0.5 && au.pier > 0.3, `THE LIGHT AUDIT on a normal night: the wheel ${au.wheelBulbs} (${au.wheelCars} cabins lit), the lamps ${au.lampsPost}, the pier ${au.pier}`);
    await Q.ctx.close(); }
  // ---- THE TR-3B arriving (&lgs=6): the city flickering out from the side it comes in on — some strips dead, not all
  { const Q = await open({ slot: 'lg2a', qs: `${NIGHT}&force=tr3b&lgs=6`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.legend.state.phase === 'cross'`, 'the TR-3B loaded + arriving', 20000);
    const d = (await ev(Q.page, `${P}.legend.drain('city')`)) || [], span = d.reduce((a, cl) => a + cl.x1 - cl.x0, 0);
    ok(span >= 60 && span < 402, `THE TR-3B ARRIVING: ${Math.round(span)} pt of the city flickering out (${d.length} strips) — not all of it yet`);
    await Q.ctx.close(); }
  // ---- SKY-A — THE TR-3B AT FULL RES (&lgs=15, a 3× phone at tier 2): its own overlay at the phone's dpr (the crowns cut out of it), its
  // own lights on the craft — and (ATM-A, the owner: "no reflected light on the city at all") NOTHING CAST on the drained city: no glow on the
  // rooftops, no pools on the harbor; TOOLS → TR-3B SOFT = the city's own 2× copy
  for (const [slot, extra, hi] of [['lg2h', '', true], ['lg2k', ',no-legend-crisp', false]]) {
    const Q = await open({ slot, qs: `${NIGHT}&wx=clear&force=tr3b${extra}&lgs=15`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page); await ev(Q.page, 'window.__district.setTier(2)');
    await waitFor(Q.page, `${P}.legend.state.phase === 'cross' && ${P}.tr3bLight.lights > 0`, 'the TR-3B crossing', 20000).catch(() => {});
    await sleep(800);
    const st = await ev(Q.page, `${P}.legend.state`), wl = await ev(Q.page, `${P}.tr3bLight`), cv = await ev(Q.page, `!!document.querySelector('canvas.hl-tri')`);
    if (hi) {
      ok(st.triHi && st.triDpr >= 2.9 && cv, `THE TR-3B AT FULL RES: its own overlay at ${st.triDpr}× (the city's canvas is 2×)`);
      ok(wl && wl.cast === false && wl.lights === 4, `ITS LIGHTS STAY ON THE CRAFT: ${wl && wl.lights} lights (three corners + the orb) on it, nothing cast on the drained city (ATM-A)`);
      if (SHOTS) await Q.page.screenshot({ path: `${OUT}legend-tr3b-fullres-402x874.png` });
    } else ok(!st.triHi && !cv, 'TOOLS → TR-3B SOFT: back on the city’s own canvas (no overlay)');
    await Q.ctx.close();
  }
  // ---- SKY-A — THE F-22 MODEL in the chase (&lgs=30.4: mid-pass): the baked jets (assets/city/f22/), a TIGHT VIC (the lead + a wingman
  // tucked behind either side: one above, one below it) BANKING together mid-screen
  { const Q = await open({ slot: 'lg2j', qs: `${NIGHT}&wx=clear&force=tr3b&lgs=30.4`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(() => { const c = ${P}.legend.state.chase; return !!(c && c.model); })()`, 'the chase on the F-22 model', 20000).catch(() => {});
    const ch = (await ev(Q.page, `${P}.legend.state`)).chase, got = Q.files.filter(f => /assets\/city\/f22\//.test(f)).length;
    const lead = ch && ch.jets.find(j => j.i === 0), w = ch ? ch.jets.filter(j => j.i !== 0) : [], dir = (await ev(Q.page, `${P}.legend.state.run.dir`)) || 1;
    ok(ch && ch.model && got >= 4, `THE F-22 MODEL: the chase flies the baked jet (${got} sprite files${ch ? `, model ${ch.model}` : ''})`);
    ok(ch && lead && w.length === 2 && w.every(j => (lead.x - j.x) * dir > 20) && Math.min(...w.map(j => j.y)) < lead.y && Math.max(...w.map(j => j.y)) > lead.y, `…A TIGHT VIC: the lead at ${lead && `${lead.x}, ${lead.y}`}, the wingmen behind it either side (${w.map(j => `${j.x}, ${j.y}`).join(' · ')})`);
    ok(ch && ch.roll > 8, `…BANKING TOGETHER mid-screen: ${ch && ch.roll}° at u ${ch && ch.u}`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}legend-f22-chase-402x874.png` });
    await Q.ctx.close(); }
  // ---- THE TR-3B over the city (&lgs=15) — POLISH 4: THE TOTAL BLACKOUT: every depth dead (its lights not drawn at all), the dark
  // city's bake in place (no floodlit crowns), the lit windows gone from the skyline
  { const Q = await open({ slot: 'lg2', qs: `${NIGHT}&wx=clear&force=tr3b&lgs=15` /* (C4c: clear — a live rainy night lit the rain's signs a moment late, C4b's flake) */, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.legend.state.phase === 'cross'`, 'the TR-3B loaded + crossing', 20000);
    await waitFor(Q.page, `(() => { const k = ${P}.legend.dark(); return k.far && k.near; })()`, 'the dark city baked', 20000);
    const bo = await ev(Q.page, `${P}.legend.blackout()`);
    ok(bo && bo.dead.far && bo.dead.city && bo.dead.harbor && bo.dead.near && bo.k > 0.99, `THE TR-3B's BLACKOUT: every depth dead (${JSON.stringify(bo && bo.dead)}), k ${bo && bo.k}`);
    // (8b2 — the scene APPLIES it: the speakeasy's power hook dark — the check the old test lacked when the scene stopped reading it)
    await waitFor(Q.page, `${P}.speakeasy.power() < 0.05`, 'the speakeasy dark', 10000).catch(() => {});
    ok((await ev(Q.page, `${P}.speakeasy.power()`)) < 0.05, 'THE TR-3B BLACKOUT reaches the scene: the speakeasy dark');
    // (9a — the owner: the WHEEL kept its lights after POLISH 5's recolour; EVERY light source the blackout should kill, as the frame drew it)
    { const au = await ev(Q.page, `${P}.lightAudit()`), lit = Object.entries(au).filter(([, v]) => v > 0.02);
      ok(lit.length === 0, `THE BLACKOUT KILLS EVERY LIGHT (the wheel's bulbs + cabins, the pier, the quay, the beam, the boats, the windows, the neon, the beacons, the lamps, the signals, the strings, the speakeasy, the beams): ${lit.length ? `still lit — ${lit.map(([k, v]) => `${k} ${v}`).join(', ')}` : 'all dark'}`); }
    // C4b — THE NEW LIGHTS FOLLOW THE BLACKOUT (the owner, Oct 28 10:55 pm: the crosswalk + the cab-stand bench stayed lit mid-TR-3B): at the
    // blackout's depth no known light zone — the crossing's stripes, the two benches (their sharp overlays composited in), the shop window,
    // the implied pools at the front curb — is brighter than the dark city round it (a ring 14 pt out)
    { const pr = await ev(Q.page, `${P}.promenade`), zones = [['crossing', pr.stripes ? [pr.stripes[0][0], pr.stripes[0][1], pr.stripes[1][0], pr.stripes[1][1]] : null], ['cab bench', pr.cabStand ? [pr.cabStand[0] - 26, pr.cabStand[1] - 22, pr.cabStand[0] + 26, pr.cabStand[1]] : null],
        ['water bench', [pr.bench[0] - 20, pr.bench[1] - 18, pr.bench[0] + 20, pr.bench[1]]], ['shop window', pr.shopWin ? [pr.shopWin[0][0], pr.shopWin[0][1], pr.shopWin[1][0], pr.shopWin[1][1]] : null], ['implied pool', pr.pool && pr.pool.lit ? [pr.pool.lit[0] - 20, pr.pool.lit[1] - 10, pr.pool.lit[0] + 20, pr.pool.lit[1] + 4] : null]].filter(z => z[1]);
      const lum = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const d = devicePixelRatio || 1, cs = [...document.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 0), o = document.createElement('canvas'); o.width = innerWidth * d; o.height = innerHeight * d; const x = o.getContext('2d');
        for (const c of cs) { const r = c.getBoundingClientRect(); if (r.width < 1) continue; try { x.drawImage(c, r.left * d, r.top * d, r.width * d, r.height * d); } catch { /* tainted */ } }
        const Lm = (x0, y0, x1, y1, ex) => { const X0 = Math.max(0, Math.round(Math.min(x0, x1) * d)), Y0 = Math.max(0, Math.round(Math.min(y0, y1) * d)), X1 = Math.round(Math.max(x0, x1) * d), Y1 = Math.round(Math.max(y0, y1) * d); const im = x.getImageData(X0, Y0, Math.max(1, X1 - X0), Math.max(1, Y1 - Y0)).data, w = Math.max(1, X1 - X0); let s = 0, n = 0;
          for (let i = 0; i < im.length; i += 4) { const px = (i / 4) % w + X0, py = Math.floor(i / 4 / w) + Y0; if (ex && px >= ex[0] * d && px <= ex[2] * d && py >= ex[1] * d && py <= ex[3] * d) continue; s += 0.2126 * im[i] + 0.7152 * im[i + 1] + 0.0722 * im[i + 2]; n++; } return n ? s / n : 0; };
        res(${JSON.stringify(zones)}.map(([id, b]) => { const g = 14, xa = Math.min(b[0], b[2]), ya = Math.min(b[1], b[3]), xb = Math.max(b[0], b[2]), yb = Math.max(b[1], b[3]); return { id, in: +Lm(xa, ya, xb, yb).toFixed(1), ring: +Lm(xa - g, ya - g, xb + g, yb + g, [xa, ya, xb, yb]).toFixed(1) }; })); }))`);
      const hot = lum.filter(z => z.in > z.ring * 1.25 + 8);
      ok(lum.length >= 4 && !hot.length, `C4b THE NEW LIGHTS FOLLOW THE BLACKOUT: ${lum.map(z => `${z.id} ${z.in} vs its ring ${z.ring}`).join(' · ')}${hot.length ? ` — STILL LIT: ${hot.map(z => z.id).join(', ')}` : ''}`); }
    // Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: the hold is on (from 4 s before the craft until the jets are gone + the power is back);
    // no car, cab, bus or truck ENTERED inside it (one already rolling finishes); the street under the dock adopts no new pass
    { const hd = await ev(Q.page, `${P}.legend.hold`), tr = await ev(Q.page, `${P}.people.traffic`), rd = await ev(Q.page, `${P}.road`);
      const entered = [...tr.cars.map(c => c.ts), ...tr.buses.map(b => b.tE), ...tr.trucks.map(T => T.tE)].filter(x => x != null && hd && x >= hd.t0 && x < hd.t1);
      ok(hd && hd.on && hd.t1 - hd.t0 > 35 && entered.length === 0 && !(rd.pass && rd.pass.center / 1000 > hd.t0), `NO TRAFFIC DURING THE LEGENDARIES: the hold on (${hd && (hd.t1 - hd.t0).toFixed(1)} s), nothing entered under it (${tr.cars.length} cars, ${tr.buses.length} buses, ${tr.trucks.length} trucks on screen — all from before), the street's pass ${rd.pass ? 'from before' : 'none'}`); }
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}legend-tr3b-402x874.png` });
    await Q.ctx.close(); }
  // ---- SP3 — THE RAIN ON THE SIGN FOLLOWS ITS POWER (the owner's iPhone: the TR-3B in the rain left the beads glowing pink + the streaks
  // pink): under the blackout the beads' light + the rain's light from the signs are dark; a normal rainy night lights both (the control)
  for (const [slot, qs, dark] of [['lg2r', `${NIGHT}&force=tr3b,rain&lgs=15`, true], ['lg2c', `${NIGHT}&force=rain`, false]]) {
    const Q = await open({ slot, qs, view: [402, 874] });
    await harborUp(Q.page);
    if (dark) await waitFor(Q.page, `(() => { const k = ${P}.legend.dark(); return k.far && k.near; })()`, 'the dark city', 25000).catch(() => {});
    else await waitFor(Q.page, `${P}.lightAudit().signWx > 0.3`, 'the sign lit in the rain', 15000).catch(() => {});
    await sleep(800);
    const au = await ev(Q.page, `${P}.lightAudit()`);
    ok(dark ? au.signWx < 0.15 && au.rainSigns < 0.05 : au.signWx > 0.3 && au.rainSigns > 0.3, `THE SIGN's WEATHER LIGHT ${dark ? 'DIES IN THE BLACKOUT' : 'on a normal rainy night (the control)'}: the beads' light ${au.signWx}, the signs' light on the rain ${au.rainSigns}`);
    await Q.ctx.close();
  }
  // ---- 9c — THE SIGN's SNOW FOLLOWS THE POWER (the owner's screenshot: the tubes dark, the snow on them still bright white): a snowy
  // night's sign snow is lit (+ glows the tube's colour); under the TR-3B's blackout it drops to the moon's faint grey
  { const lum = {};
    for (const [slot, qs, dark] of [['lg2s', `${NIGHT}&force=tr3b&lgs=15&snow=fresh&temp=-6`, true], ['lg2t', `${NIGHT}&snow=fresh&temp=-6`, false]]) {
      const Q = await open({ slot, qs, view: [402, 874] });
      await harborUp(Q.page);
      if (dark) await waitFor(Q.page, `(() => { const k = ${P}.legend.dark(); return k.far && k.near; })()`, 'the dark city', 25000).catch(() => {});
      await waitFor(Q.page, `${P}.snow.sign > 0.02 && ${P}.snow.signLum > 0`, 'the sign holding snow', 15000).catch(() => {});
      await sleep(800);
      lum[dark ? 'dark' : 'lit'] = await ev(Q.page, `${P}.snow.signLum`);
      await Q.ctx.close();
    }
    ok(lum.dark > 0 && lum.dark < 135 && lum.lit > lum.dark + 40, `THE SIGN's SNOW FOLLOWS THE POWER: lit night ${lum.lit} → the blackout ${lum.dark} (the moon's grey)`); }
  // ---- 8b2: THE BLACKOUT WINS OVER THE PARTY (the owner forced the TR-3B with PARTY ON: the show stayed lit) — the show off while dead
  { const Q = await open({ slot: 'lg2p', qs: `${NIGHT}&force=tr3b,party&lgs=15`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.legend.state.phase === 'cross'`, 'the TR-3B loaded + crossing', 20000);
    await waitFor(Q.page, `window.__district.party().on < 0.05 && ${P}.speakeasy.power() < 0.05`, 'the party show dark under the blackout', 15000).catch(() => {});
    const pt = await ev(Q.page, 'window.__district.party()');
    ok(pt.on < 0.05 && pt.beams < 0.05, `THE BLACKOUT WINS OVER THE PARTY: the show ${pt.on.toFixed(2)}, the sky beams ${pt.beams}`);
    await Q.ctx.close(); }
  // ---- 6b: THE AIR SHOW, a 3-PAGE drone message (POLISH 5: the barnstormer removed)
  { const Q = await open({ slot: 'lg3', qs: `when=2026-10-21T13:00${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await ev(Q.page, `${P}.sky.airshow('airshow')`);
    await waitFor(Q.page, `!!${P}.sky.state.show && ${P}.sky.state.heavy`, 'the air show', 8000);
    ok(true, 'THE AIR SHOW: the diamond up (both sky lanes, the city calmed)');
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'lg4', qs: `${NIGHT}&force=drones&text=WELCOME%20TO%20THE%20NEON%20SPEAKEASY%20WHERE%20YOUR%20FRIENDS%20ARE%20ALREADY%20INSIDE%20AND%20THE%20MUSIC%20NEVER%20STOPS`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `!!${P}.sky.state.drones`, 'the drone show', 15000);
    const d = (await ev(Q.page, `${P}`)).sky.state.drones;
    ok(d.shapes.length === 3 && d.n >= 180, `THE DRONE SHOW pages a long message (POLISH 4: the message only — no figures): ${d.shapes.length} pages (${d.shapes.join(' | ')}), ${d.n} drones`);
    await Q.ctx.close(); }
  // ---- 9g — THE ABDUCTION, HEARD (Grok's real recordings — nobody has listened; the owner picks by ear): a link's UFO waits for the
  // first tap (9g Group 0), so the sounds play the whole film: the hover's spin-up + its loop, the beam on / idle / off, the lift, the
  // departure + the spin-down — in order, once each; the crowd only with people to flee (no-people here). Then the panel's picks:
  // &hum=b (the deep throb: no spin-up, its own loop) + &depart=layered (both takes at once)
  // (PROM: the defaults are HUM A + DEPART LAYERED (the owner's picks); the alternates &hum=b + &depart=a. lgs1 is a COLD load — the
  // FIRST run must play the spin-up from its start, never late or joined half-way: the sounds are fetched ahead now)
  for (const [slot, qs, want] of [['lgs1', '', 'A'], ['lgs2', '&hum=b&depart=a', 'B']]) {
    const Q = await open({ slot, qs: `when=2026-11-04T22:00${GR}&force=ufo,no-people${qs}`, view: [402, 874] });
    await harborUp(Q.page);
    await tapAt(Q.page, 201, 420);
    await waitFor(Q.page, `${P}.legend.state.run && ${P}.legend.state.s > 26.5`, `${slot}: the abduction played through`, 60000);
    const r = await ev(Q.page, `import('/js/audio/city-sound.js').then(m => ({ log: m.cityLog.filter(x => /^ufo-|^crowd-flee/.test(x.slot)).map(x => ({ slot: x.slot, f: x.f, at: x.at, off: x.off, late: !!x.late })), loops: ${P}.sounds.player.loops.filter(l => /^ufo-/.test(l.slot)).map(l => ({ slot: l.slot, file: l.file })) }))`);
    const order = r.log.map(x => x.slot), files = r.log.map(x => x.f);
    const hum = (await ev(Q.page, `${P}.sounds.beds`) || []).find(b => b.slot === 'ufo-hum');
    if (want === 'A') {
      const exp = ['ufo-hum-up', 'ufo-beam-on', 'ufo-lift', 'ufo-beam-off', 'ufo-depart', 'ufo-hum-down'];
      const uniq = order.filter((x, i) => order.indexOf(x) === i);
      ok(JSON.stringify(uniq) === JSON.stringify(exp) && files.includes('ufo-depart.mp3') && files.includes('ufo-depart-2.mp3'),
        `9g THE UFO HEARD (HUM A + DEPART LAYERED, PROM's defaults): ${order.join(' → ')} (the depart: ${files.filter(f => /depart/.test(f)).join(' + ')}); no crowd with nobody on the promenade`);
      const up = r.log.find(x => x.slot === 'ufo-hum-up');
      ok(up && !up.late && (up.off || 0) < 0.6, `PROM THE FIRST RUN AFTER A COLD LOAD PLAYS THE SPIN-UP from its start (joined ${up ? up.off : '—'} s in${up && up.late ? ', LATE' : ''})`);
    } else {
      ok(!order.includes('ufo-hum-up') && !order.includes('ufo-hum-down') && files.includes('ufo-depart.mp3') && !files.includes('ufo-depart-2.mp3'),
        `9g THE PANEL's PICKS: HUM B (no spin-up / down) + DEPART A alone (${files.filter(f => /depart/.test(f)).join(' + ')})`);
    }
    const beds = await ev(Q.page, `${P}.sounds.beds.map(b => b.slot + ':' + (b.file || ''))`);
    ok(true, `9g …the beds heard: ${beds.filter(b => /ufo/.test(b)).join(', ') || '(already faded)'}`);
    await Q.ctx.close();
  }
});
G('bench', async () => {
  const P = 'window.__district.harbor()';
  // C4c — THE PHONE BENCH (&bench=1): never without the flag (a normal page has none); with it a START card waits for a tap; once started it
  // plays its scenes through the panel's switch (the panel's re-apply held off), measures, and on STOP the report shows on screen (COPY)
  // + goes to /admin (kind 'bench'); the page goes back to its own state
  { const Q = await open({ slot: 'bnc0', qs: `${NIGHT}&wx=clear`, view: [402, 874] });
    await harborUp(Q.page);
    ok((await ev(Q.page, `${P}.phoneBench`)) == null && !(await ev(Q.page, `!!document.querySelector('.hb-bench')`)), 'THE PHONE BENCH: nothing without the flag');
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'bnc1', qs: `${NIGHT}&wx=clear&bench=1&benchfast=1`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `!!(${P}.phoneBench) && !!document.querySelector('.hb-bench')`, 'the bench card', 15000);
    const b0 = await ev(Q.page, `(() => { const b = ${P}.phoneBench; return { running: b.running, text: document.querySelector('.hb-bench').textContent }; })()`);
    ok(!b0.running && /START/.test(b0.text), `THE PHONE BENCH waits for a tap: a START card (${b0.text.slice(0, 60)}…)`);
    await ev(Q.page, `${P}.phoneBench.start()`).catch(() => {});
    // (MODELS — the cloud caught a read landing mid-navigation (the bench loads each scene's page): every read here retries across one)
    const evN = async js => { for (let k = 0; k < 20; k++) { try { return await ev(Q.page, js); } catch (e) { if (!/context was destroyed|navigation|Target closed|detached/i.test(String(e && e.message))) throw e; await sleep(250); } } return null; };
    // (SKY-B: EVERY SCENE ON A FRESH PAGE — the bench loads each scene's link: its bakes finished, a cool-down with the city paused, settle, measure)
    const seen = new Set(), phases = new Set(); let loads = 0, lastUrl = '';
    const tB = Date.now();
    while (Date.now() - tB < 90000) {
      const r = await evN(`(() => { const h = window.__district && window.__district.harbor && window.__district.harbor(), b = h && h.phoneBench; return b ? { rows: b.rows, i: b.i, phase: b.phase, running: b.running, url: location.search } : null; })()`).catch(() => null);
      if (r) { if (r.url !== lastUrl) { loads++; lastUrl = r.url; seen.add(new URLSearchParams(r.url).get('when')); } if (r.phase) phases.add(r.phase); if (r.rows >= 2 && r.i >= 2) break; }
      await sleep(150);
    }
    const mid = await evN(`({ b: ${P}.phoneBench, q: location.search })`);
    ok(mid.b.running && mid.b.i >= 2 && /benchrun=1/.test(mid.q) && loads >= 3 && seen.size >= 2, `THE PHONE BENCH: every scene on a FRESH PAGE, in order (${mid.b.rows} measured, ${loads} pages: ${[...seen].join(' · ')})`);
    ok(['ready', 'cool', 'settle', 'measure'].every(p => phases.has(p)), `THE PHONE BENCH: its bakes finished, then a COOL-DOWN (the city paused), settle, measure (${[...phases].join(' → ')})`);
    await evN(`${P}.phoneBench.stop()`);
    await waitFor(Q.page, `${P}.phoneBench.done && ${P}.phoneBench.sent !== null`, 'the report sent (or refused)', 15000).catch(() => {});
    const end = await ev(Q.page, `(() => { const b = ${P}.phoneBench, ta = document.querySelector('.hb-bench textarea'), btns = [...document.querySelectorAll('.hb-bench button')].map(x => x.textContent); return { b, report: ta ? ta.value : '', btns }; })()`);
    ok(end.b.done && /THE PHONE BENCH/.test(end.report) && /a party peak/.test(end.report) && /memory guard:/.test(end.report) && /painted a frame: [\d.]+ MP/.test(end.report) && /outside/.test(end.report) && /CPU speed/.test(end.report) && end.btns.includes('COPY'), `THE PHONE BENCH's REPORT on screen with COPY (${end.report.split('\n').length} lines: the frame side, the pixels painted, the CPU speed) + sent to /admin: ${end.b.sent}`);
    console.log(end.report);
    await Q.ctx.close(); }
  // C4c — THE MEMORY GUARD's VERDICT, then + now (MEASURE=1 only — a measurement for the docs, not a check): at 390 / 402 / 430 on a 3×
  // phone, at every tier, what the baked layers want at full dpr — and whether the OLD budgets (24 / 40 / 64 MB, the bakes only) would
  // have stepped any of them down (softer) — vs the new guard (64 / 96 / 160 MB, every live canvas counted)
  if (process.env.MEASURE) for (const [w, h, q3] of [[390, 844, ""], [402, 874, ""], [430, 932, ""], [402, 874, "&dpr=3"]]) {
    const Q = await open({ slot: `bnm${w}${q3 ? "d3" : ""}`, qs: `${NIGHT}&wx=clear${q3}`, view: [w, h], dpr: 3 });
    await harborUp(Q.page);
    for (const t of q3 ? [2] : [2, 1, 0]) {
      await ev(Q.page, `window.__district.setTier(${t})`);
      await waitFor(Q.page, `${P}.mem.guard && ${P}.mem.guard.tier === ${t} && !${P}.fading`, `tier ${t} baked`, 20000).catch(() => {});
      const m = await ev(Q.page, `${P}.mem`), g = m.guard || {}, OLD = [24, 40, 64][t];
      const oldStep = (g.wantBake > OLD ? 'the skyline + stage bakes' : '') + (g.wantLit > Math.max(0, OLD - Math.min(g.wantBake, OLD)) ? `${g.wantBake > OLD ? ' + ' : ''}the lit windows` : '');
      console.log(`MEMORY GUARD ${w}x${h} @3${q3} tier ${t} (city ${g.dpr}x): bakes want ${g.wantBake} + lit ${g.wantLit} MB · old budget ${OLD} -> ${oldStep ? `WOULD STEP DOWN ${oldStep}` : 'nothing stepped'} · new ${g.budget} (+ ${g.others} else live) -> ${g.stepped && g.stepped.length ? 'STEPPED' : 'nothing stepped'} · every live canvas ${m.tracked} MB`);
    }
    await Q.ctx.close();
  }
});

// ================================================================ SKY-A — THE BLACKBIRD (ONLY=blackbird; the `legend` cloud job): ONE flyby —
// the tell, the crossing above the lit sign under the corner buttons (its own full-dpr overlay, gone after), the vapor cone + the shock
// ring, the late double boom; its triggers: a preview, EVERY TR-3B chase (across the dark sign, the chase's direction), THE WATCHER's
// reward (60 visible minutes, this device), a SOLO sighting on its timetable
G('blackbird', async () => {
  const B = 'window.__district.harbor().blackbird';
  // ---- 1. THE FLYBY (&force=blackbird): the tell first, then across the strip above the sign; the cone, the ring, the boom; its overlay
  { const Q = await open({ slot: 'bb1', qs: `when=2026-10-21T22:00${GR}&wx=clear&force=blackbird`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page);
    await waitFor(Q.page, `!!(${B}.kind)`, 'the Blackbird planned', 15000);
    const t0 = await ev(Q.page, B);
    ok(t0.kind === 'forced' && (t0.tell || t0.e < 0.2), `THE TELL FIRST: the flyby planned ${t0.e != null ? `${t0.e} s` : ''} — the radio static ~${3} s before it enters`);
    const seen = { cone: 0, ring: 0, on: 0, ys: [], overlay: 0, dpr: 0 };
    const end = Date.now() + 9000;
    while (Date.now() < end) {
      const d = await ev(Q.page, `(() => { const b = ${B}, c = document.querySelector('canvas.hb-bb'); return { ...b, ov: !!(c && c.width > 0), ovd: c && c.width ? +(c.width / parseFloat(c.style.width)).toFixed(2) : 0 }; })()`);
      if (d.on) { seen.on++; seen.ys.push(d.y); if (d.ov) { seen.overlay++; seen.dpr = d.ovd; } }
      if (d.cone > 0.3) seen.cone++; if (d.ring != null) seen.ring++;
      if (d.e > 3) break;
      await sleep(40);
    }
    const tr = await ev(Q.page, 'window.__district.harbor().ladder.sign'), cb = await ev(Q.page, `Math.max(...[...document.querySelectorAll('.menu-btn, .music-btn')].map(e => e.getBoundingClientRect().bottom))`);
    ok(seen.on >= 5 && seen.ys.every(y => y > cb && y < tr.y), `ACROSS ABOVE THE LIT SIGN, under the corner buttons: y ${Math.round(Math.min(...seen.ys))}–${Math.round(Math.max(...seen.ys))} (the buttons end at ${Math.round(cb)}, the sign starts at ${Math.round(tr.y)}; ${seen.on} frames)`);
    ok(seen.cone >= 1 && seen.ring >= 2, `IT BREAKS THE SOUND BARRIER: the vapor cone (${seen.cone} frames) + the shock ring (${seen.ring})`);
    ok(seen.overlay >= 3 && seen.dpr >= 2.9, `ITS OWN OVERLAY at the phone's full dpr (${seen.dpr}×) above the sign while it flies`);
    await waitFor(Q.page, `!document.querySelector('canvas.hb-bb')`, 'the overlay gone', 6000).catch(() => {});
    ok(!(await ev(Q.page, `!!document.querySelector('canvas.hb-bb')`)), 'GONE AFTER: its overlay removed (no memory held between flybys)');
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}blackbird-solo-402x874.png` });
    await Q.ctx.close(); }
  // ---- 2. THE CHASE: every TR-3B — the Blackbird once the F-22s are ~⅓ across, the same direction, ACROSS the dark sign
  { const Q = await open({ slot: 'bb2', qs: `when=2026-10-24T23:00${GR}&wx=clear&force=tr3b&lgs=29`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `(() => { const b = ${B}; return !!(b && b.kind === 'chase'); })()`, 'the chase\'s Blackbird', 25000).catch(() => {});
    const d = await ev(Q.page, B), run = await ev(Q.page, 'window.__district.harbor().legend.state.run'), tr = await ev(Q.page, 'window.__district.harbor().ladder.sign');
    ok(d && d.kind === 'chase' && run && d.dir === (run.dir || 1), `THE CHASE GETS THE BLACKBIRD: ${d && d.kind}, flying ${d && d.dir > 0 ? 'right' : 'left'} like the jets (${run && run.dir})`);
    ok(d && tr && d.y > tr.y && d.y < tr.y + tr.h, `…ACROSS THE DARK SIGN: y ${d && d.y} inside the sign's ${Math.round(tr.y)}–${Math.round(tr.y + tr.h)} (in front of it: its overlay sits above the sign)`);
    if (SHOTS) { await waitFor(Q.page, `(() => { const b = ${B}; return !!(b && b.on && b.e > 0.4); })()`, 'mid-pass', 8000).catch(() => {}); await Q.page.screenshot({ path: `${OUT}blackbird-chase-402x874.png` }); }
    await Q.ctx.close(); }
  // ---- 3. THE WATCHER's REWARD: 59 m 55 s watched today (this device's clock) → one flyby within a few seconds, once (got = today)
  { const init = { fn: () => { try { localStorage.setItem('na:bbwatch', JSON.stringify({ day: '2026-10-21', acc: 3595, last: Date.now() / 1000 - 2, got: null })); } catch { /* */ } } };
    const Q = await open({ slot: 'bb3', qs: `when=2026-10-21T21:00${GR}&wx=clear`, view: [402, 874], init });
    await harborUp(Q.page);
    await waitFor(Q.page, `(() => { const b = ${B}; return !!(b && b.kind === 'watcher'); })()`, 'the watcher\'s reward', 20000).catch(() => {});
    const d = await ev(Q.page, B);
    ok(d && d.kind === 'watcher' && d.watch && d.watch.got === '2026-10-21', `THE WATCHER's REWARD: 60 visible minutes → a flyby (${d && d.kind}; given today: ${d && d.watch && d.watch.got})`);
    await Q.ctx.close(); }
  // ---- 4. A SOLO SIGHTING on its timetable (core/harbor-blackbird.js#soloDay): open a few seconds before one — it flies at its time
  { const M = await import('../../../js/core/harbor-blackbird.js');
    let f = null; for (let d = 0; d < 120 && !f; d++) { const L = M.soloDay(Date.parse('2026-11-01T12:00:00-04:00') / 1000 + d * 86400, -300, 1924); if (L.length) f = L[0]; }
    ok(!!f, `a solo sighting on the timetable (${f && new Date(f.t * 1000).toISOString()})`);
    if (f) {
      const when = new Date((f.t - 6) * 1000 - 5 * 3600e3).toISOString().slice(0, 19);
      const Q = await open({ slot: 'bb4', qs: `when=${when}&tz=America/Detroit&at=42.96,-85.67&wx=clear`, view: [402, 874] });
      await harborUp(Q.page);
      await waitFor(Q.page, `(() => { const b = ${B}; return !!(b && b.kind === 'solo'); })()`, 'the solo sighting', 20000).catch(() => {});
      const d = await ev(Q.page, B);
      ok(d && d.kind === 'solo' && Math.abs(d.at / 1000 - f.t) < 1 && d.dir === f.dir, `THE SOLO SIGHTING at its time (${d && d.kind}, ${d && d.dir > 0 ? 'right' : 'left'})`);
      await Q.ctx.close();
    }
  }
});

// THE MODELS PASS — THE MOTHMAN (core/harbor-mothman.js + screens/harbor/mothman.js): perched on the needle's tip from a link within ~5 s of the
// reveal, two red eyes, his own overlay at the phone's dpr; the leaving: the needle's stutter (its light dark at the swap), the glide away,
// the overlay gone after; an ordinary night never fetches his sprites
G('mothman', async () => {
  const M = 'window.__district.harbor().mothman';
  { const Q = await open({ slot: 'mm1', qs: `when=2026-11-03T03:00${GR}&wx=clear&force=mothman`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page);
    const t0 = await ev(Q.page, 'performance.now()');
    await waitFor(Q.page, `(() => { const m = ${M}; return !!(m && m.model === 'perch' && m.box); })()`, 'perched', 8000);
    const dt = (await ev(Q.page, 'performance.now()')) - t0, d = await ev(Q.page, M);
    ok(dt < 5000, `A LINK SHOWS HIM WITHIN ~5 s of the reveal: perched after ${(dt / 1000).toFixed(1)} s`);
    const talonY = d.box.y + d.box.h * (1 - 0.383 * 296 / 306);
    ok(Math.abs(d.box.x + d.box.w / 2 - d.tip[0]) < 6 && Math.abs(talonY - d.tip[1]) < 8, `ON THE NEEDLE's TIP: his middle ${Math.round(d.box.x + d.box.w / 2)} vs the tip ${d.tip[0]}, the talons ~${Math.round(talonY)} vs ${d.tip[1]}`);
    ok(d.box.h > 70 && d.box.h < 110, `~84 pt tall at 402 (${d.box.h} pt — the hem draping round the spire)`);
    const ov = await ev(Q.page, `(() => { const c = document.querySelector('canvas.hb-moth'); return c ? { dpr: +(c.width / parseFloat(c.style.width)).toFixed(2), z: getComputedStyle(c).zIndex } : null; })()`);
    ok(ov && ov.dpr >= 2.9, `HIS OWN OVERLAY at the phone's full dpr (${ov && ov.dpr}×)`);
    // the eyes: red pixels at both sockets, a few pt apart (sampled from the overlay)
    const red = await ev(Q.page, `(() => { const c = document.querySelector('canvas.hb-moth'), x = c.getContext('2d'), k = c.width / parseFloat(c.style.width), L = parseFloat(c.style.left), T = parseFloat(c.style.top); const m = ${M}; return m.eyes.map(([ex, ey]) => { let best = 0; for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 2; dy++) { const p = x.getImageData(Math.round((ex - L + dx) * k), Math.round((ey - T + dy) * k), 1, 1).data; best = Math.max(best, p[0] - (p[1] + p[2]) / 2); } return best; }); })()`);
    ok(red.filter(v => v > 60).length >= 1, `TWO RED EYES (the reds at the sockets: ${red.join(', ')} — a blink may close one)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}mothman-perch-402x874.png` });
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'mm2', qs: `when=2026-11-03T03:00${GR}&wx=clear&force=mothman-leave`, view: [402, 874] });
    await harborUp(Q.page);
    let dark = 0, glide = 0, xs = [];
    const end = Date.now() + 24000;
    while (Date.now() < end) {
      const d = await ev(Q.page, M);
      if (d && d.needle != null && d.needle < 0.1) dark++;
      if (d && d.model === 'glide') { glide++; xs.push(d.x); }
      if (d && d.phase === 'gone') break;
      await sleep(60);
    }
    ok(dark >= 2, `THE NEEDLE STUTTERS DARK (${dark} samples) — the swap hides in it`);
    ok(glide >= 20 && xs[xs.length - 1] !== xs[0], `HE GLIDES AWAY (${glide} samples, x ${xs[0]} → ${xs[xs.length - 1]})`);
    await waitFor(Q.page, `!document.querySelector('canvas.hb-moth')`, 'his overlay gone', 8000).catch(() => {});
    ok(!(await ev(Q.page, `!!document.querySelector('canvas.hb-moth')`)), 'GONE AFTER: his overlay removed');
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'mm3', qs: `when=2026-11-04T03:00${GR}&wx=clear`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const net = await ev(Q.page, `performance.getEntriesByType('resource').some(e => e.name.includes('assets/city/mothman/'))`);
    ok(!net && !(await ev(Q.page, `!!document.querySelector('canvas.hb-moth')`)), 'AN ORDINARY NIGHT: no Mothman, his sprites never fetched');
    await Q.ctx.close(); }
});

// THE MODELS PASS — TWO DEVICES IN STEP (the owner's iPhone + the mini PC through a TV + soundbar: the same station song, a slight lag): two
// pages on one station stay within a few ms (each schedules by what its browser reports it HEARS); SETTINGS → SPEAKER DELAY (a TV /
// soundbar's own delay, past what a page can see) plays that page's song that much EARLIER
G('speaker', async () => {
  const D = '(() => { const d = window.__arcade && window.__arcade.partyMusicDebug(); return d && d.heard ? { id: d.heard.id, at: d.heard.at, tl: d.at, synced: d.synced, lat: d.lat, spk: d.speaker } : null; })()';
  const init = { fn: () => { try { const s = JSON.parse(localStorage.getItem('na:settings') || '{}'); s.speakerDelay = 150; localStorage.setItem('na:settings', JSON.stringify(s)); } catch { /* */ } } };
  const A = await open({ slot: 'spa', qs: `${GR.slice(1)}&wx=clear`, view: [402, 874] }), B = await open({ slot: 'spb', qs: `${GR.slice(1)}&wx=clear`, view: [402, 874], init });
  for (const P of [A, B]) { await harborUp(P.page); await tapAt(P.page, 201, 420); }
  for (const P of [A, B]) await waitFor(P.page, `(() => { const d = ${D}; return !!(d && d.synced); })()`, 'the station synced', 20000);
  const gaps = [];
  for (let i = 0; i < 6; i++) { const [a, b] = await Promise.all([A, B].map(P => ev(P.page, D))); if (a && b && a.id === b.id) gaps.push(Math.round(((b.at - b.tl) - (a.at - a.tl)) * 1000)); await sleep(400); }
  const a = await ev(A.page, D), b = await ev(B.page, D), med = gaps.sort((x, y) => x - y)[gaps.length >> 1];
  ok(gaps.length >= 4 && Math.abs(med - 150) < 25 && b.spk === 150, `SPEAKER DELAY 150 ms plays that page ${med} ms earlier than its twin on the same station (the browser reports out ${a.lat && a.lat.out} + base ${a.lat && a.lat.base} ms — already scheduled for)`);
  await A.ctx.close(); await B.ctx.close();
});
