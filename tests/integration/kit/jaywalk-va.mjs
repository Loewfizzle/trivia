// JAYWALK VARIETY A — the look checks (tests/integration/jaywalk-lab.mjs `--va[=pile|day|tod|fog]`): the lab (the pure engine in the tab) with
// the clock / the season / the weather forced (&tod= · &weather= · &date= · &snow=) → the shots (the pass's folder) + what must hold.
//   pile — GROUP 1: Nov 25, night + day, 390: Polyfork's leaf pile one lane ahead of the kid (+ a close-up) and its burst
//   day  — GROUP 3: the day look, before (&va=0) / after, 390 — the whole frame + a close-up of each piece
//   tod  — GROUP 4: the five times of day + overcast, 390 (+ sunrise heavy snow, sunset autumn)
//   fog  — GROUP 5: the white fog at the foot in every look × season, one sheet
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export async function looksVA({ open, up, ok, sleep, waitFor, out, what = '', b, errs = [] }) {
  const all = !what;
  const pg = async (w, q, o = {}) => {
    const p = await open(w, w === 430 ? 932 : 844, 3, `&preview=1&seed=look3&tier=${o.tier ?? 2}&zoom=8&angle=straight&cv=2${q}`, o);
    await up(p.p);
    return p;
  };
  const stage = async (o, { lane = 17, x = 4500, t = 2400, freeze = true, look = 'night', pack = false } = {}) => {
    if (pack) await waitFor(o.p, `(() => { const s = window.__jwLab.view.season(); return !!s.sp && (${pack === 'pile' ? 's.sp.pileModel' : 's.pack || !(s.winter > 0)'}); })()`, 15000);
    await o.p.evaluate((l, xx, tt, fz, lk) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); J.warp(l, { x: xx }); J.setT(tt); if (fz) J.freeze(true); }, lane, x, t, freeze, look);
    await sleep(2400);
  };
  const shotTo = async (o, name, clip) => { if (!out) return null; const f = join(out, name); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f, ...(clip ? { clip } : {}) }); return f; };
  const season = o => o.p.evaluate(() => window.__jwLab.view.season());
  const compose = async (files, labels, name, cols = files.length, W = 300, aspect = 844 / 390) => {
    if (!out || !files.length) return;
    const ctx = await b.createBrowserContext(), p = await ctx.newPage();
    const imgs = files.map(f => (f ? `data:image/png;base64,${readFileSync(f).toString('base64')}` : ''));
    const H = Math.round(W * aspect);
    await p.setViewport({ width: cols * (W + 8) + 8, height: Math.ceil(files.length / cols) * (H + 40) + 8, deviceScaleFactor: 1 });
    await p.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${W}px);gap:8px;padding:8px;font:700 15px system-ui;color:#eee">${imgs.map((s, i) => `<figure style="margin:0"><figcaption style="height:28px;${/CHANGED/.test(labels[i]) ? 'color:#ffcf3a' : ''}">${labels[i]}</figcaption>${s ? `<img src="${s}" style="width:${W}px;height:${H}px;object-fit:cover;display:block">` : ''}</figure>`).join('')}</body>`);
    await p.screenshot({ path: join(out, name), fullPage: true });
    await ctx.close();
  };
  const near = async (o, w, cw = 170, ch = 190, dy = 0) => {
    const [sx, sy] = await o.p.evaluate(d => { const J = window.__jwLab, st = J.state(); return J.project(st.x, st.y + 0.5 + d); }, dy);
    const H = w === 430 ? 932 : 844;
    return { x: Math.max(0, Math.min(w - cw, Math.round(sx * w - cw / 2))), y: Math.max(0, Math.min(H - ch, Math.round(sy * H - ch * 0.7))), width: cw, height: ch };
  };

  // THE TIMES OF DAY (+ overcast, + the day look BEFORE this pass): one frame each at 390, the kid at lane `lane`, the world frozen
  const todShot = async (name, q, { look = 'day', lane = 17, x = 4500, t = 2400, pack = true, tier = 2 } = {}) => {
    const o = await pg(390, q, { tier });
    await stage(o, { look, lane, x, t, pack });
    const f = await shotTo(o, name), td = await o.p.evaluate(() => window.__jwLab.view.tod());
    errs.push(...o.errs); await o.close();
    return { f, td };
  };
  if (all || what === 'tod' || what.startsWith('tod:')) {
    const only = what.startsWith('tod:') ? what.slice(4).split('+') : null;
    const rows = [['before', '&tod=noon&weather=clear&va=0'], ['sunrise', '&tod=sunrise&weather=clear'], ['noon', '&tod=noon&weather=clear'], ['golden', '&tod=golden&weather=clear'], ['sunset', '&tod=sunset&weather=clear'], ['night', '&tod=night'], ['overcast', '&tod=noon&weather=overcast'], ['sunrise-heavy-snow', '&tod=sunrise&weather=clear&date=2026-12-24&snow=heavy'], ['sunset-autumn', '&tod=sunset&weather=clear&date=2026-11-25'], ['golden-light-snow', '&tod=golden&weather=clear&date=2027-01-20&snow=light'], ['overcast-heavy-snow', '&tod=noon&weather=overcast&date=2026-12-24&snow=heavy']].filter(r => !only || only.includes(r[0]));
    const files = [], labels = [];
    for (const [k, q] of rows) {
      const r = await todShot(`tod/${k}-390.png`, q, { look: k === 'night' ? 'night' : 'day' });
      const kk = k.split('-')[0];
      ok(!!r.td && (k === 'before' ? r.td.tod === 'noon' : kk === 'overcast' ? r.td.overcast : r.td.tod === kk), `TOD ${k}: the scene shows ${JSON.stringify(r.td && { tod: r.td.tod, overcast: r.td.overcast, sun: r.td.sun })}`);
      if (kk !== 'night' && kk !== 'overcast' && k !== 'before') ok(r.td.sun === true, `TOD ${k}: THE SUN's SHADOWS drawn (tier 2)`);
      if (kk === 'overcast') ok(r.td.sun === false, 'TOD overcast: no sun shadows');
      files.push(r.f); labels.push(k.toUpperCase());
    }
    await compose(files, labels, `tod/sheet-390${only ? `-${only.join('-')}` : ''}.png`, Math.min(files.length, 6), 260);
  }

  // THE DAY LOOK — before (&va=0) / after at noon, 390: the whole frame + close-ups (the sun's + the contact shadows, the cars' shine, the
  // grass, the asphalt, the cloud shadows) at tier 2, + tier 1 (no depth pass: the cheap sun blob + the contact shadows)
  if (all || what === 'day') {
    const crops = { kid: { x: 60, y: 470, width: 270, height: 200 }, road: { x: 0, y: 360, width: 390, height: 140 }, grass: { x: 0, y: 590, width: 390, height: 140 }, far: { x: 0, y: 150, width: 390, height: 160 } };
    const files = [], labels = [];
    for (const [k, q, tier] of [['before', '&tod=noon&weather=clear&va=0', 2], ['after', '&tod=noon&weather=clear', 2], ['after-t1', '&tod=noon&weather=clear', 1], ['after-t0', '&tod=noon&weather=clear', 0]]) {
      const o = await pg(390, q + '&date=2026-07-15', { tier });
      await stage(o, { look: 'day', lane: 17 });
      files.push(await shotTo(o, `day/${k}-390.png`)); labels.push(k.toUpperCase());
      for (const [c, clip] of Object.entries(crops)) await shotTo(o, `day/${k}-390-${c}.png`, clip);
      const td = await o.p.evaluate(() => window.__jwLab.view.tod());
      if (k !== 'before') ok(td.sun === (tier === 2), `DAY ${k}: the sun's depth pass ${tier === 2 ? 'ON (tier 2)' : 'OFF (tier ' + tier + ')'}`);
      errs.push(...o.errs); await o.close();
    }
    await compose(files, labels, 'day/before-after-390.png', 4, 300);
    if (out) for (const c of Object.keys(crops)) await compose([join(out, `day/before-390-${c}.png`), join(out, `day/after-390-${c}.png`)], [`BEFORE · ${c}`, `AFTER · ${c}`], `day/ba-${c}.png`, 2, 390, crops[c].height / crops[c].width);
  }

  // THE FOG CHECK — the white fog bank at the foot (the kid near the wall) in every look × season at 390: one sheet, the changed ones marked
  if (all || what === 'fog') {
    const looks = [['sunrise', '&tod=sunrise&weather=clear'], ['noon', '&tod=noon&weather=clear'], ['golden', '&tod=golden&weather=clear'], ['sunset', '&tod=sunset&weather=clear'], ['overcast', '&tod=noon&weather=overcast'], ['night', '&tod=night']];
    const seasons = [['summer', '&date=2026-07-15'], ['autumn', '&date=2026-11-25'], ['winter-none', '&date=2027-01-20&snow=none'], ['winter-light', '&date=2027-01-20&snow=light'], ['winter-heavy', '&date=2026-12-24&snow=heavy']];
    const files = [], labels = [];
    for (const [sk, sq] of seasons) for (const [lk, lq] of looks) {
      const o = await pg(390, lq + sq);
      const win = /winter/.test(sk);
      if (win) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      await stage(o, { look: lk === 'night' ? 'night' : 'day', lane: 17, pack: true });
      await o.p.evaluate(() => { const J = window.__jwLab; J.wallAt(2.6); for (const b of document.querySelectorAll('.jw-bar, .jw-bar2, .jw-bar3')) b.style.visibility = 'hidden'; });   // (the bank 2.6 lanes behind the kid: in view at the foot; the lab's bars off the shot)
      await sleep(400);
      const td = await o.p.evaluate(() => window.__jwLab.view.tod()), se = await season(o);
      if (win && sk !== 'winter-none') ok(se.pack && se.winter > 0.5, `FOG ${sk} ${lk}: the winter pack in (${se.pack} · winter ${se.winter})`);
      files.push(await shotTo(o, `fog/${sk}-${lk}-390.png`, { x: 0, y: 404, width: 390, height: 440 }));
      labels.push(`${sk} · ${lk}${td.fogDark > 0 && lk !== 'night' ? ' · CHANGED' : ''}`);
      errs.push(...o.errs); await o.close();
    }
    await compose(files, labels, 'fog/sheet-390.png', 6, 220, 440 / 390);
  }

  // THE TIERS' MEASURE (`perf` — run it alone, nothing else busy): DOWNTOWN's busy runway, 8 kids, every time of day + overcast + the heavy
  // seasons, at tier 2 · 1 · 0: the worst draw-call frame over a whole runway lap (≤ daylook.js#callsMax) + 4× CPU: the MEDIAN fps + the worst frames
  if (what === 'perf' || what.startsWith('perf:')) {
    const { callsMax } = await import('../../../js/games/jaywalk/daylook.js');
    const sel = what.startsWith('perf:') ? what.slice(5).split('+') : null;
    const scenes = [['noon', '&tod=noon&weather=clear'], ['sunrise', '&tod=sunrise&weather=clear'], ['golden', '&tod=golden&weather=clear'], ['sunset', '&tod=sunset&weather=clear'], ['overcast', '&tod=noon&weather=overcast'], ['night', '&tod=night'],
      ['nov25-golden', '&tod=golden&weather=clear&date=2026-11-25'], ['dec24-noon-heavy', '&tod=noon&weather=clear&date=2026-12-24&snow=heavy'], ['dec24-sunset-heavy', '&tod=sunset&weather=clear&date=2026-12-24&snow=heavy']].filter(r => !sel || sel.includes(r[0]));
    const rows = [];
    for (const [k, q] of scenes) for (const tier of [2, 1, 0]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed2&tier=${tier}&zoom=8&angle=straight&cv=2${q}`);
      await up(o.p);
      await waitFor(o.p, "(() => { const s = window.__jwLab.view.season(); return !s.any || (!!s.sp && (s.pack || !(s.winter > 0))); })()", 30000);
      await o.p.evaluate(() => window.__jwLab.restart('solo', window.__jwLab.state().seed));
      const R = await o.p.evaluate(() => { const J = window.__jwLab; J.ghosts(7); return J.runway(250, 1); });
      if (!R) { console.log(`VAPERF ${k} t${tier}: no runway`); await o.close(); continue; }
      await o.p.evaluate(y => { const J = window.__jwLab; J.warp(y); J.ghosts(7); }, R.y0 - 1);
      await sleep(1500);
      let worst = 0;
      for (let t = R.period * 8; t < R.period * 9; t += 4) {
        const c = await o.p.evaluate(async tt => { const J = window.__jwLab; J.setT(tt); J.freeze(true); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return J.state().info.calls; }, t);
        if (c > worst) worst = c;
      }
      await o.p.evaluate(() => window.__jwLab.freeze(false));
      await o.p.emulateCPUThrottling(4);
      await sleep(1200); await o.p.evaluate(() => window.__jwLab.clearFrames());
      let runCalls = 0;
      for (let i = 0; i < 40; i++) { await sleep(200); runCalls = Math.max(runCalls, await o.p.evaluate(() => window.__jwLab.state().info.calls)); }
      const fr = (await o.p.evaluate(() => window.__jwLab.frames())).sort((a, c) => a - c);
      await o.p.emulateCPUThrottling(1);
      const td = await o.p.evaluate(() => window.__jwLab.view.tod());
      const med = fr[Math.floor(fr.length / 2)], row = { scene: k, tier, worstCalls: worst, runCalls, limit: callsMax(tier), frames: fr.length, fpsMedian: +(1000 / med).toFixed(1), p95Ms: +fr[Math.floor(fr.length * 0.95)].toFixed(1), worstMs: +fr[fr.length - 1].toFixed(1), worst3: fr.slice(-3).map(v => +v.toFixed(1)), sun: td && td.sun };
      rows.push(row); console.log('VAPERF', JSON.stringify(row));
      ok(row.worstCalls <= row.limit && row.runCalls <= row.limit, `${k} tier ${tier}: the worst runway frame ${row.worstCalls} draw calls (running ${row.runCalls}) ≤ ${row.limit}`);
      ok(row.fpsMedian >= 59 && !o.errs.length, `${k} tier ${tier}: 4× CPU, 8 kids on the runway — MEDIAN ${row.fpsMedian} fps (p95 ${row.p95Ms} ms · worst ${row.worstMs} ms · ${row.worst3.join(' / ')})`);
      errs.push(...o.errs); await o.close();
    }
    if (out) { const { writeFileSync } = await import('node:fs'); writeFileSync(join(out, `vaperf${sel ? '-' + sel.join('-') : ''}.json`), JSON.stringify(rows, null, 1)); }
  }

  if (all || what === 'pile') for (const look of ['night', 'day']) {
    const o = await pg(390, '&date=2026-11-25');
    await stage(o, { look, lane: 6, pack: 'pile' });
    const s = await season(o);
    ok(s.autumn === 1 && s.sp && s.sp.pileModel, `PILE ${look}: Nov 25 — full autumn, Polyfork's pile model in (${JSON.stringify({ a: s.autumn, m: s.sp && s.sp.pileModel })})`);
    ok(o.reqs.some(u => /\/autumn\/leaf-pile\.glb/.test(u)) && !o.reqs.some(u => /\/winter\//.test(u)), `PILE ${look}: the pile fetched from the pack's autumn folder, no winter model`);
    const P = await o.p.evaluate(() => window.__jwLab.view.seasonPile(8));
    ok(!!P, `PILE ${look}: a leaf pile on the course (${JSON.stringify(P)})`);
    const files = [];
    if (P) {
      // the kid on the pile's own lane, two cells beside it (the pile fully seen, near the kid) → then one lane under it, one hop up into it
      const side = P.col < 4 ? 2 : -2;
      await o.p.evaluate((l, c) => { const J = window.__jwLab; J.freeze(false); J.warp(l, { x: (c + 0.5) * 1000 }); J.setT(2400); J.freeze(true); }, P.lane, P.col + side);
      await sleep(900);
      files.push(await shotTo(o, `pile/${look}-390.png`));
      { const c = await near(o, 390, 330, 230, 0); files.push(await shotTo(o, `pile/${look}-390-close.png`, { ...c, x: Math.max(0, Math.min(390 - 330, c.x)) })); }
      const s1 = await season(o);
      ok(s1.sp.piles >= 1, `PILE ${look}: drawn on screen (${s1.sp.piles})`);
      await o.p.evaluate((l, c) => { const J = window.__jwLab; J.freeze(false); J.warp(l - 1, { x: (c + 0.5) * 1000 }); }, P.lane, P.col);
      await sleep(700);
      await o.p.evaluate(() => window.__jwLab.hop('u'));
      for (const [k, ms] of [[1, 150], [2, 150], [3, 300]]) { await sleep(ms); files.push(await shotTo(o, `pile/${look}-390-burst-${k}.png`)); }
      const s2 = await season(o);
      ok(s2.sp.bursts >= 1, `PILE ${look}: the hop-through burst kept (${s2.sp.bursts})`);
    }
    await compose(files.filter(Boolean), ['PILE AHEAD', 'CLOSE', 'BURST 1', 'BURST 2', 'BURST 3'].slice(0, files.length), `pile/${look}-strip.png`, files.length, 300, 844 / 390);
    errs.push(...o.errs); await o.close();
  }
}
