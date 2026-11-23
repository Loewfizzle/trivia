// JAYWALK VARIETY B2 — the look + measure checks (tests/integration/jaywalk-lab.mjs `--vb2[=white|taps|trees|edge|plows|perf]`): the lab (the
// pure engine in the tab) with the clock / the season / the weather forced → the shots (the pass's folder) + what must hold.
//   white  — GROUP 1.1: the white vehicles by day (every time of day + overcast + snow), close-ups → a sheet (`--tag before|after`)
//   taps   — GROUP 1.2: tap → hop start latency + the worst frame WHILE an area set loads (a throttled phone: 4× / 6× CPU + a slow line)
//   trees  — GROUP 2: each area's trees + planters, day + night, autumn + winter
//   edge   — GROUP 3: the edge decoration per area, day + night, winter
//   plows  — GROUP 4: the snowplow + the salt truck, day + night, light + heavy snow
//   perf   — GROUP 5: every area × night + noon (+ winter) × tiers 2 · 1 · 0 at 4× CPU, 8 kids: the worst frame's draw calls + the median fps
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const AREAS = [['opening', -1], ['docks', 0], ['fish', 1], ['yard', 2], ['bridge', 3], ['downtown', 4], ['canal', 5], ['lighthouse', 6], ['airfield', 7]];
export const lane0 = ar => (ar < 0 ? 8 : 50 * (ar + 1) + 10);

export async function looksVB2({ open, up, ok, sleep, waitFor, out, what = '', b, errs = [], tag = 'after', abBase = null }) {
  const all = !what;
  const pg = async (q, o = {}) => {
    const p = await open(o.w || 390, o.h || 844, 3, `&preview=1&seed=${o.seed || 'look3'}&tier=${o.tier ?? 2}&zoom=8&angle=straight&cv=2${q}`, o);
    await up(p.p);
    return p;
  };
  const shotTo = async (o, name, clip) => { if (!out) return null; const f = join(out, name); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f, ...(clip ? { clip } : {}) }); return f; };
  const compose = async (files, labels, name, cols = files.length, W = 300, aspect = 844 / 390) => {
    if (!out || !files.length) return;
    const ctx = await b.createBrowserContext(), p = await ctx.newPage();
    const imgs = files.map(f => (f ? `data:image/png;base64,${readFileSync(f).toString('base64')}` : ''));
    const H = Math.round(W * aspect);
    await p.setViewport({ width: cols * (W + 8) + 8, height: Math.ceil(files.length / cols) * (H + 40) + 8, deviceScaleFactor: 1 });
    await p.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${W}px);gap:8px;padding:8px;font:700 15px system-ui;color:#eee">${imgs.map((s, i) => `<figure style="margin:0"><figcaption style="height:28px;${/AFTER|NEW/.test(labels[i]) ? 'color:#ffcf3a' : ''}">${labels[i]}</figcaption>${s ? `<img src="${s}" style="width:${W}px;height:${H}px;object-fit:cover;object-position:top;display:block">` : ''}</figure>`).join('')}</body>`);
    await p.screenshot({ path: join(out, name), fullPage: true });
    await ctx.close();
  };
  const varietyIn = o => waitFor(o.p, `(() => { const v = window.__jwLab.view.info().variety; return v && v.loading === 0 && v.queued === 0 && v.held.length > 0; })()`, 30000);
  // a close-up: the vehicle `id` found on screen in area `ar` (its lane + the moment), the kid two lanes below, the world frozen → a crop round it
  const close = async (id, ar, q, look, file, span = 40) => {
    const o = await pg(q);
    if (/snow=/.test(q)) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
    await o.p.evaluate(l => { const J = window.__jwLab; J.restart('solo', 'look3'); J.setCamera(8, 'straight', true); J.warp(l, { x: 4500 }); }, lane0(ar));
    await varietyIn(o);
    const at = await o.p.evaluate((idd, l0, sp) => {
      const J = window.__jwLab;
      for (let t = 2400; t < 2400 + 60 * 40; t += 40) { J.setT(t); for (let i = l0; i < l0 + sp; i++) { const I = J.items(i); for (const it of I.items || []) { if (it.what !== idd) continue; for (const k of [-1, 0, 1]) { const lf = it.left + k * (I.per || 0); if (lf > 1.2 && lf + it.len < 7.8) return { lane: i, t, c: lf + it.len / 2, len: it.len, left: it.left }; } } } }
      return null;
    }, id, lane0(ar), span);
    if (!at) { ok(false, `CLOSE ${file}: a ${id} found on screen`); await o.close(); return null; }
    await o.p.evaluate((a, lk) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); J.warp(a.lane - 2, { x: 4500 }); J.setT(a.t); J.freeze(true); }, at, look);
    await varietyIn(o);
    await sleep(1600);
    const [sx, sy] = await o.p.evaluate(a => window.__jwLab.project(a.c, a.lane + 0.5), at);
    const cw = Math.min(390, 120 + at.len * 60), ch = 150, clip = { x: Math.max(0, Math.min(390 - cw, Math.round(sx * 390 - cw / 2))), y: Math.max(0, Math.min(844 - ch, Math.round(sy * 844 - ch * 0.6))), width: cw, height: ch };
    const f = await shotTo(o, file, clip);
    errs.push(...o.errs); await o.close();
    return f;
  };

  // 1.1 — WHITE VEHICLES BY DAY: the white-bodied ones × every day look + overcast + snow (the close-ups — a sheet a row a vehicle)
  if (all || what === 'white') {
    const TIMES = [['noon', '&tod=noon&weather=clear&date=2026-07-15', 'day'], ['sunrise', '&tod=sunrise&weather=clear&date=2026-07-15', 'day'], ['golden', '&tod=golden&weather=clear&date=2026-07-15', 'day'], ['sunset', '&tod=sunset&weather=clear&date=2026-07-15', 'day'], ['overcast', '&tod=noon&weather=overcast&date=2026-07-15', 'day'], ['snow', '&tod=noon&weather=clear&date=2027-01-20&snow=heavy', 'day'], ['night', '&tod=night&date=2026-07-15', 'night']];
    const CARS = [['bendy', 4], ['citybus', 4], ['delivery', 4], ['ambulance', 5], ['semi', 0], ['truck', 4], ['van', 4]];
    const files = [], labels = [];
    for (const [id, ar] of CARS) for (const [tn, q, look] of TIMES) {
      files.push(await close(id, ar, q, look, `white/${tag}/${id}-${tn}-390.png`)); labels.push(`${id} · ${tn} · ${tag.toUpperCase()}`);
    }
    await compose(files, labels, `white/sheet-${tag}.png`, TIMES.length, 240, 150 / 300);
  }

  // 1.2 — THE TAPS: a phone profile (6× / 4× CPU), the kid on a DOWNTOWN grass lane (its set: the most models), a real touch TAP every 300 ms
  // for 9 s; at 0.4 s + 4.6 s every area model is let go + the near areas wanted again (`varietyAgain` — an area's arrival, the files from the
  // HTTP cache, so they all queue at once: the worst case). Each tap's latency (its pointerup → the frame whose tick took the hop) + every
  // frame's time while the sets come in. `--ab <base>` = the code before (its own server). Every tap must be taken (none dropped / late).
  if (all || what === 'taps') {
    const rows = [];
    for (const rate of [6, 4]) {
      const o = await pg('&tod=noon&weather=clear&date=2026-07-15', { tier: 2, ...(abBase ? { base: abBase } : {}) });
      const L0 = await o.p.evaluate(() => { const J = window.__jwLab; const C = J.raw().course; for (let i = 262; i < 298; i++) if (J.lane(i).type === 'grass' && J.lane(i + 1).type === 'grass' && !(C.lane(i + 1).obs || [])[4] && !(C.lane(i).obs || [])[4]) return i; return 262; });
      await o.p.evaluate(l => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook('day'); J.setCamera(8, 'straight', true); J.warp(l, { x: 4500 }); }, L0);
      await varietyIn(o); await sleep(1500);
      const cdp = await o.p.createCDPSession();
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await sleep(800);
      await o.p.evaluate(l => {
        const J = window.__jwLab;
        window.__tp = { ups: [], lat: [], fr: [], t0: performance.now(), L0: l, hops: J.state().hops, sets: [] };
        const T = window.__tp, q = [];
        window.addEventListener('pointerup', e => { q.push(e.timeStamp); T.ups.push(e.timeStamp); }, true);
        let last = 0;
        const f = now => { const s = J.state(); if (s.hops > T.hops) { const n = s.hops - T.hops; T.hops = s.hops; for (let k = 0; k < n && q.length; k++) T.lat.push(performance.now() - q.shift()); if (s.asked === s.hops) J.warp(T.L0, { x: 4500 }); }
          if (last) T.fr.push([now - T.t0, now - last]); last = now; const v = J.view.info().variety; T.sets.push([now - T.t0, v.held.length, v.loading + v.queued + (v.staged || 0)]); if (now - T.t0 < 20000) requestAnimationFrame(f); };
        requestAnimationFrame(f);
        setTimeout(() => J.view.varietyAgain(), 400); setTimeout(() => J.view.varietyAgain(), 4600);
      }, L0);
      const tc = await o.p.createCDPSession();
      const box = await o.p.evaluate(() => { const r = document.querySelector('canvas.jw-canvas').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.62]; });
      for (let k = 0; k < 30; k++) {
        const tp = [{ x: box[0], y: box[1], id: 1, radiusX: 4, radiusY: 4, force: 1 }];
        await tc.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp });
        await sleep(40);
        await tc.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await sleep(260);
      }
      await sleep(1500);
      const T = await o.p.evaluate(() => window.__tp);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      // the load windows: from each varietyAgain to the frame its last model is in (nothing loading / queued, the set back) + 300 ms
      const busy = T.sets.filter(s => s[2] > 0).map(s => s[0]);
      const inLoad = t => busy.some(b => t >= b - 50 && t <= b + 300) || (t >= 400 && t <= 700) || (t >= 4600 && t <= 4900);
      const lat = T.lat.slice().sort((a, b) => a - b), during = T.fr.filter(f => inLoad(f[0])).map(f => f[1]).sort((a, b) => b - a);
      const calm = T.fr.filter(f => !inLoad(f[0]) && f[0] > 200).map(f => f[1]).sort((a, b) => b - a);
      const r = { rate, taps: T.ups.length, taken: T.lat.length, medLat: lat[Math.floor(lat.length / 2)] || 0, worstLat: lat[lat.length - 1] || 0, worstFrame: during[0] || 0, p95Frame: during[Math.floor(during.length * 0.05)] || 0, loadFrames: during.length, calmWorst: calm[0] || 0, held: T.sets.length ? T.sets[T.sets.length - 1][1] : 0 };
      if (process.env.VB2_DEBUG) { const tr = []; let pv = ''; for (const s2 of T.sets) { const k = `${s2[1]}/${s2[2]}`; if (k !== pv) { tr.push(`${Math.round(s2[0])}:${k}`); pv = k; } } console.log('     sets', tr.join(' '), '| lat', T.lat.map(x => Math.round(x)).join(' '), '| ups', T.ups.length, 'big frames', T.fr.filter(f => f[1] > 25).map(f => `${Math.round(f[0])}:${Math.round(f[1])}`).join(' ')); }
      rows.push(r);
      console.log(`     TAPS ${tag} at ${rate}× CPU: ${r.taken}/${r.taps} taps taken · latency median ${r.medLat.toFixed(1)} ms · worst ${r.worstLat.toFixed(1)} ms · WHILE the sets came in (${r.loadFrames} frames, ${r.held} models): worst frame ${r.worstFrame.toFixed(1)} ms · p95 ${r.p95Frame.toFixed(1)} ms · (no load: worst ${r.calmWorst.toFixed(1)} ms)`);
      ok(r.taken === r.taps, `TAPS at ${rate}×: every tap taken (${r.taken}/${r.taps})`);
      errs.push(...o.errs); await o.close();
    }
    if (out) { mkdirSync(join(out, 'taps'), { recursive: true }); writeFileSync(join(out, 'taps', `taps-${tag}.json`), JSON.stringify(rows, null, 1)); }
    return rows;
  }

  // GROUP 2 + 3 — THE AREA TREES + THE EDGE DECORATION: every area (the kid on a ground lane inside it, the camera following to one side so the
  // edge column shows), summer day + night, autumn day, winter day (Jan 20, the snow lying, none falling) — the world frozen once its pieces are in
  if (all || what === 'trees' || what === 'edge' || what.startsWith('trees:')) {
    const only = what.startsWith('trees:') ? what.slice(6).split('+') : null;
    const LOOKS = [['summer-day', '&tod=noon&weather=clear&date=2026-07-15', 'day'], ['summer-night', '&tod=night&date=2026-07-15', 'night'], ['autumn-day', '&tod=noon&weather=clear&date=2026-11-10', 'day'], ['winter-day', '&tod=noon&weather=clear&date=2027-01-20&snow=none', 'day'], ['winter-night', '&tod=night&date=2027-01-20&snow=none', 'night']];
    for (const [name, ar] of AREAS.filter(a => !only || only.includes(a[0]))) { const aF = [], aL = []; for (const [lk, q, look] of LOOKS) {
      const o = await pg(q);
      if (lk.startsWith('winter')) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      await waitFor(o.p, '!!window.__jwLab.view.info().props', 20000);
      // the lane whose next 9 lanes hold the most trees (or edge pieces) — the kid 2 lanes below it, the camera to that side
      const [L0, side] = await o.p.evaluate((l0, edge) => { const J = window.__jwLab, V = J.view; J.warp(l0 + 20, { x: 4500 }); let best = [l0, 0, -1];
        for (let l = l0; l < l0 + 36; l++) for (const sd of [0, 1]) { let n = 0; for (let i = l + 1; i < l + 10; i++) for (const q of V.decorAt(i)) { const okSide = sd ? q.c >= 7 : q.c <= 1; if (okSide && (edge ? q.deco : (q.k === 'tree' || q.tk))) n++; } if (n > best[2]) best = [l, sd, n]; }
        return [best[0], best[1]]; }, lane0(ar) - 6, what === 'edge');
      await o.p.evaluate((l, lk2, side) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk2); J.setCamera(8, 'straight', true); J.warp(l, { x: side ? 8500 : 500 }); J.setT(2400); J.freeze(true); }, L0, look, side);
      await waitFor(o.p, `(() => { const i = window.__jwLab.view.info(), v = i.props; return v && v.loading === 0 && v.queued === 0 && !v.staged && i.variety.loading === 0 && i.variety.queued === 0; })()`, 30000);
      await sleep(1800);
      aF.push(await shotTo(o, `${what === 'edge' ? 'edge' : 'trees'}/${name}-${lk}-390.png`)); aL.push(`${name.toUpperCase()} · ${lk}`);
      errs.push(...o.errs); await o.close();
    } await compose(aF, aL, `${what === 'edge' ? 'edge' : 'trees'}/sheet-${name}-390.png`, LOOKS.length, 220); }   // (a sheet an area: 45 full shots in one page ran it out of memory)
  }

  // GROUP 4 — THE WINTER TRUCKS: the snowplow + the salt truck close, day + night × light + heavy snow (a winter day), + the same run in summer
  // has none (the season gate)
  if (all || what === 'plows') {
    const files = [], labels = [];
    for (const id of ['plow', 'salt']) for (const [tn, q, look] of [['day-light', '&tod=noon&weather=clear&date=2027-01-20&snow=light', 'day'], ['day-heavy', '&tod=noon&weather=clear&date=2026-12-24&snow=heavy', 'day'], ['night-light', '&tod=night&date=2027-01-20&snow=light', 'night'], ['night-heavy', '&tod=night&date=2026-12-24&snow=heavy', 'night']]) {
      files.push(await close(id, 4, q, look, `plows/${id}-${tn}-390.png`, 140)); labels.push(`${id.toUpperCase()} · ${tn}`);
    }
    await compose(files, labels, 'plows/sheet-390.png', 4, 300, 150 / 300);
    const o = await pg('&tod=noon&weather=clear&date=2026-07-15');
    const n = await o.p.evaluate(() => { const J = window.__jwLab; let c = 0; for (let i = 250; i < 300; i++) for (const it of J.items(i).items || []) if (it.what === 'plow' || it.what === 'salt') c++; return c; });
    ok(n === 0, `PLOWS: none on a summer run (${n})`);
    errs.push(...o.errs); await o.close();
  }
}
