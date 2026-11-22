// JAYWALK JT1 — SEASONS' look checks (tests/integration/jaywalk-lab.mjs `--jt1[=ab|autumn|santa|prints|fw|party]`): the lab (the pure engine
// in the tab — no server) with the season clock forced (&date= · &snow= · &clock= · &hat=0) → the shots (the pass's folder) + what must hold.
//   ab     — GROUP 1, ROOM FIRST: Dec 24 (heavy snow) night + day at 390, reduced motion (nothing moves), the hats off (&hat=0 — the one new
//            thing on that day): the code BEFORE the pass (`--ab <base>`, a worktree on :5174) vs this one — the pixels must agree
//   autumn — Nov 25 night + day, 390 + 430: the turned trees, the leaves, a LEAF PILE + its burst (frames through the 0.5 s)
//   santa  — Dec 10 (light snow): the Santa hat, a close-up + the full frame, night + day
//   prints — Dec 10: the footprints + the snow puff behind a few hops, night + day
//   fw     — Dec 31 23:59 (the finale) night + day
//   party  — Jan 1: the party hat (+ the light fireworks by night)
// The strips are composed IN THE BROWSER (a page of the shots side by side, screenshotted) — no image library.
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export async function looksJT1({ open, up, ok, sleep, waitFor, out, what = '', b, errs = [], abBase }) {
  const all = !what;
  const pg = async (w, q, o = {}) => {
    const p = await open(w, w === 430 ? 932 : 844, 3, `&preview=1&seed=look3&tier=2&zoom=8&angle=straight&cv=2${q}`, o);
    await up(p.p);
    return p;
  };
  /** the season in (the pack's pieces) → a fresh run on the seed, the kid at lane `lane` (column x), the world frozen at tick t */
  const stage = async (o, { lane = 17, x = 4500, t = 2400, freeze = true, look = 'night', models = false } = {}) => {
    await waitFor(o.p, `(() => { const s = window.__jwLab.view.season(); return ${models ? 's.pack' : '!!s.sp || !s.any'}; })()`, 15000);
    await o.p.evaluate((l, xx, tt, fz, lk) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); J.warp(l, { x: xx }); J.setT(tt); if (fz) J.freeze(true); }, lane, x, t, freeze, look);
    await sleep(2400);   // (a look change cross-fades the band)
  };
  const shotTo = async (o, name, clip) => { if (!out) return null; const f = join(out, name); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f, ...(clip ? { clip } : {}) }); return f; };
  const season = o => o.p.evaluate(() => window.__jwLab.view.season());
  /** a row of shots (+ a label each) → one picture */
  const compose = async (files, labels, name, cols = files.length) => {
    if (!out || !files.length) return;
    const ctx = await b.createBrowserContext(), p = await ctx.newPage();
    const imgs = files.map(f => `data:image/png;base64,${readFileSync(f).toString('base64')}`);
    const W = 300, H = Math.round(W * 844 / 390);
    await p.setViewport({ width: cols * (W + 8) + 8, height: Math.ceil(files.length / cols) * (H + 40) + 8, deviceScaleFactor: 1 });
    await p.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${W}px);gap:8px;padding:8px;font:700 16px system-ui;color:#eee">${imgs.map((s, i) => `<figure style="margin:0"><figcaption style="height:28px">${labels[i]}</figcaption><img src="${s}" style="width:${W}px;height:${H}px;object-fit:cover;display:block"></figure>`).join('')}</body>`);
    await p.screenshot({ path: join(out, name), fullPage: true });
    await ctx.close();
  };
  /** two PNG files → the share of pixels where a channel moves by more than thr (in a page: no image library) */
  const diff = async (fa, fb, thr = 24) => {
    const ctx = await b.createBrowserContext(), p = await ctx.newPage();
    const r = await p.evaluate(async (a, c, t) => {
      const load = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = src; });
      const [A, B] = await Promise.all([load(a), load(c)]), w = A.width, h = A.height, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const x = cv.getContext('2d'); x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, w, h).data; x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, w, h).data;
      let n = 0; const rows = new Array(20).fill(0);
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) > t || Math.abs(da[i + 1] - db[i + 1]) > t || Math.abs(da[i + 2] - db[i + 2]) > t) { n++; rows[Math.floor((i / 4 / w) / h * 20)]++; }
      return { share: n / (w * h), w, h, same: A.width === B.width && A.height === B.height, rows: rows.map(r => +(r / (w * h / 20) * 100).toFixed(2)) };
    }, `data:image/png;base64,${readFileSync(fa).toString('base64')}`, `data:image/png;base64,${readFileSync(fb).toString('base64')}`, thr);
    await ctx.close();
    return r;
  };

  if (all || what === 'ab') {
    for (const look of ['night', 'day']) {
      const files = [];
      for (const [k, base] of [['before', abBase], ['before-again', abBase], ['after', undefined]]) {
        const o = await pg(390, '&date=2026-12-24&snow=heavy&hat=0', { base, reduce: true });
        await stage(o, { look, models: true });
        files.push(await shotTo(o, `ab/winter-dec24-${look}-390-${k}.png`));
        if (k === 'after') { const s = await season(o); ok(s.pack && s.winter === 1 && s.snowfall === 'heavy' && s.sp && !s.sp.hat, `AB ${look}: this code — the pack in, Dec 24 full winter, heavy snow, the hats off (${s.sp && s.sp.hat})`); }
        errs.push(...o.errs); await o.close();
      }
      if (out) {
        const floor = await diff(files[0], files[1]), d = await diff(files[0], files[2]);
        console.log(`JT1 AB ${look}: BEFORE vs BEFORE ${(floor.share * 100).toFixed(3)} % (the noise floor) · BEFORE vs AFTER ${(d.share * 100).toFixed(3)} % (thr 24) — by twentieths of the height: ${d.rows.join(' ')}`);
        ok(d.same && d.share <= floor.share + 0.002, `AB ${look}: Dec 24 winter — the code BEFORE vs THIS one: ${(d.share * 100).toFixed(3)} % of the pixels differ, the noise floor ${(floor.share * 100).toFixed(3)} % (identical: within the floor + 0.2 %)`);
        await compose([files[0], files[2]], [`BEFORE · ${look}`, `AFTER · ${look}`], `ab/winter-dec24-${look}-ab.png`);
      }
    }
  }

  if (all || what === 'autumn') for (const look of ['night', 'day']) for (const w of [390, 430]) {
    const o = await pg(w, '&date=2026-11-25');
    await stage(o, { look, lane: 6 });
    const s = await season(o);
    ok(s.autumn === 1 && !s.winter && !s.hat, `AUTUMN ${look} ${w}: Nov 25 — full autumn, no winter, no hat (${JSON.stringify({ a: s.autumn, w: s.winter, h: s.hat })})`);
    ok(!o.reqs.some(u => /\/winter\//.test(u)), `AUTUMN ${look} ${w}: the winter models are never fetched in autumn`);
    const files = [await shotTo(o, `autumn/${look}-${w}.png`)];
    // A LEAF PILE + ITS BURST: the kid one lane under the first pile from lane 8, in its column — one hop up into it
    const P = await o.p.evaluate(() => window.__jwLab.view.seasonPile(8));
    ok(!!P, `AUTUMN ${look} ${w}: a leaf pile on the course (${JSON.stringify(P)})`);
    if (P) {
      await o.p.evaluate((l, c) => { const J = window.__jwLab; J.freeze(false); J.warp(l - 1, { x: (c + 0.5) * 1000 }); }, P.lane, P.col);
      await sleep(900);
      files.push(await shotTo(o, `autumn/${look}-${w}-pile.png`));
      await o.p.evaluate(() => window.__jwLab.hop('u'));
      for (const [k, ms] of [[1, 160], [2, 140], [3, 160], [4, 260]]) { await sleep(ms); files.push(await shotTo(o, `autumn/${look}-${w}-burst-${k}.png`)); }
      const s2 = await season(o);
      ok(s2.sp.bursts >= 1, `AUTUMN ${look} ${w}: the kid hopped INTO the pile — it burst (${s2.sp.bursts})`);
      await sleep(700);
      files.push(await shotTo(o, `autumn/${look}-${w}-after.png`));
    }
    await compose(files.filter(Boolean), ['NOV 25', 'A PILE AHEAD', 'BURST 1', 'BURST 2', 'BURST 3', 'BURST 4', 'SCATTERED'].slice(0, files.length), `autumn/${look}-${w}-strip.png`, 4);
    errs.push(...o.errs); await o.close();
  }

  if (all || what === 'santa') for (const look of ['night', 'day']) for (const w of [390, 430]) {
    const o = await pg(w, '&date=2026-12-10&snow=light');
    await stage(o, { look, models: true });
    const s = await season(o);
    ok(s.hat === 'santa' && s.sp && s.sp.hat === 'santa', `SANTA ${look} ${w}: Dec 10 — every kid's Santa hat on (${s.sp && s.sp.hat})`);
    await shotTo(o, `santa/${look}-${w}-full.png`);
    // the close-up: round the kid (the lab's projection of his cell)
    const [sx, sy] = await o.p.evaluate(() => { const J = window.__jwLab, st = J.state(); return J.project(st.x, st.y + 0.5); });
    const H = w === 430 ? 932 : 844, cw = 150, ch = 170, clip = { x: Math.max(0, Math.min(w - cw, Math.round(sx * w - cw / 2))), y: Math.max(0, Math.min(H - ch, Math.round(sy * H - ch * 0.78))), width: cw, height: ch };
    await shotTo(o, `santa/${look}-${w}-close.png`, clip);
    // + the 8 kids (the rivals' hats: the same kid model)
    await o.p.evaluate(() => window.__jwLab.ghostsAt([[-2, 0], [2, 0], [-1, 1], [1, 1], [-3, 1], [3, 1], [0, 2]]));
    await sleep(500);
    await shotTo(o, `santa/${look}-${w}-eight.png`);
    errs.push(...o.errs); await o.close();
  }

  if (all || what === 'prints') for (const look of ['night', 'day']) for (const w of [390, 430]) {
    const o = await pg(w, '&date=2026-12-10&snow=light');
    await stage(o, { look, models: true, lane: 3, freeze: false });
    // a few hops on the opening's snowy grass (lanes 3 + 4 on this seed): left, right, right, up, left, left — the prints behind
    for (const d of ['l', 'r', 'r', 'u', 'l', 'l']) { await o.p.evaluate(dd => window.__jwLab.hop(dd), d); await sleep(330); }
    await sleep(200);
    const s = await season(o);
    ok(s.sp && s.sp.prints >= 3, `PRINTS ${look} ${w}: the footprints behind the hops (${s.sp && s.sp.prints} pairs)`);
    await shotTo(o, `prints/${look}-${w}.png`);
    errs.push(...o.errs); await o.close();
  }

  if (all || what === 'fw') for (const look of ['night', 'day']) for (const w of [390, 430]) {
    const o = await pg(w, '&date=2026-12-31&clock=23:59');
    await stage(o, { look, models: true, freeze: false });
    await sleep(3200);
    const s = await season(o);
    ok(s.fireworks === 'eve' && s.sp && s.sp.fw && s.sp.fw.bursts > 0, `FIREWORKS ${look} ${w}: Dec 31 23:59 — the finale is on (${JSON.stringify(s.sp && s.sp.fw)})`);
    await shotTo(o, `fireworks/${look}-${w}.png`);
    await sleep(700); await shotTo(o, `fireworks/${look}-${w}-b.png`);
    errs.push(...o.errs); await o.close();
  }

  // THE ADD-ON (Nov 22) — THE BLACKBIRD's SONIC-BOOM CLOUD removed: DOWNTOWN's first runway, NIGHT, 8 kids, 390 — frames through the pass +
  // the worst draw calls / glow instances over its whole lap (BOOM_TAG=before|after names the shots; the before = the code with the cloud)
  if (what === 'boom') {
    const tag = process.env.BOOM_TAG || 'now', files = [];
    const o = await open(390, 844, 3, '&preview=1&seed=perfseed2&tier=2&zoom=8&angle=straight&cv=2&look=night&date=2026-07-01');
    await up(o.p); await sleep(800);
    const R = await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed2'); J.setLook('night'); return J.runway(250, 1); });
    ok(!!R && R.trail > 0, `BOOM ${tag}: DOWNTOWN's first v2 runway (lane ${R && R.y0}, trail ${R && R.trail})`);
    if (R) {
      await o.p.evaluate(y => { const J = window.__jwLab; J.warp(y); J.ghosts(7); }, R.y0 - 1);
      await sleep(1500);
      const ph = R.lanes[0].phase, base = R.period * 8 + ((ph % R.period) + R.period) % R.period;
      let worst = 0, flat = 0;
      for (let u = -6; u < R.pass + 60; u += 2) {
        const [c, fi] = await o.p.evaluate(async tt => { const J = window.__jwLab; J.setT(tt); J.freeze(true); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const i = J.state().info; return [i.calls, i.inst.flat]; }, base + u);
        worst = Math.max(worst, c); flat = Math.max(flat, fi);
      }
      for (const u of [8, 14, 22, 32]) {
        await o.p.evaluate(async tt => { const J = window.__jwLab; J.setT(tt); J.freeze(true); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, base + u);
        await sleep(250);
        files.push(await shotTo(o, `boom/${tag}-night-390-u${u}.png`));
      }
      console.log(`JT1 BOOM ${tag}: the pass's worst frame ${worst} draw calls · ${flat} glow-ground instances at the most (DOWNTOWN, night, 8 kids, 390)`);
      ok(worst <= 64, `BOOM ${tag}: ≤ 64 draw calls through the pass (${worst})`);
      await compose(files.filter(Boolean), [8, 14, 22, 32].map(u => `${tag.toUpperCase()} · ${u} ticks into the pass`), `boom/${tag}-night-390-strip.png`, 4);
      if (out && tag === 'after') { const bf = join(out, 'boom/before-night-390-u32.png'); try { readFileSync(bf); await compose([bf, files[3]], ['BEFORE · the sonic-boom cloud', 'AFTER · the cloud gone'], 'blackbird-boom-before-after-390.png', 2); } catch { /* no before shot */ } }
    }
    errs.push(...o.errs); await o.close();
  }

  if (all || what === 'party') for (const look of ['night', 'day']) {
    const o = await pg(390, '&date=2027-01-01');
    await stage(o, { look, models: true });
    const s = await season(o);
    ok(s.hat === 'party' && s.sp && s.sp.hat === 'party', `PARTY ${look}: Jan 1 — the party hats on (${s.sp && s.sp.hat})`);
    await shotTo(o, `party/${look}-390-full.png`);
    const [sx, sy] = await o.p.evaluate(() => { const J = window.__jwLab, st = J.state(); return J.project(st.x, st.y + 0.5); });
    await shotTo(o, `party/${look}-390-close.png`, { x: Math.max(0, Math.min(390 - 150, Math.round(sx * 390 - 75))), y: Math.max(0, Math.min(844 - 170, Math.round(sy * 844 - 132))), width: 150, height: 170 });
    errs.push(...o.errs); await o.close();
  }
}
