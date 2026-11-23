// JAYWALK VARIETY B1 — the look checks (tests/integration/jaywalk-lab.mjs `--vb1[=seam|sky|haze|shadows|traffic|perf]` [--ab <base>]): the
// lab (the pure engine in the tab) with the clock / the season / the weather forced → the shots (the pass's folder) + what must hold.
//   seam     — GROUP 1.4: THE SNOW-START SEAM, the start screen, before (--ab: the code before) / after, day + night × light / heavy / none
//   sky      — GROUP 1.2: THE SKYLINE SNOW, heavy + light × day + night, 390
//   haze     — GROUP 1.3: MORE CLEAR VIEW UP TOP, before / after at noon (+ sunrise · golden · sunset · overcast after) + night unchanged
//   tiers    — GROUP 1.1: THE TIER LOG — the real governor (no pinned tier) on a phone-like CPU (10× + 6× throttle), 45 s of hopping: every
//              tier change logged; it may step DOWN, never flap back up (the probe's cap verdict misread a busy CPU — the shadow pops)
//   shadows  — GROUP 1.1: THE SHADOW POPS — 30 s of hopping at tier 2 with a forced tier change: the sun shadows' strength never jumps
//   traffic  — GROUP 3: each area's traffic (day + night), the taxis + the emergency lights close, the long vehicles
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

export async function looksVB1({ open, up, ok, sleep, waitFor, out, what = '', b, errs = [], abBase = 'http://localhost:5174' }) {
  const all = !what;
  const pg = async (q, o = {}) => {
    const p = await open(390, 844, 3, `&preview=1&seed=${o.seed || 'look3'}&tier=${o.tier ?? 2}&zoom=8&angle=straight&cv=2${q}`, o);
    await up(p.p);
    return p;
  };
  const stage = async (o, { lane = 17, x = 4500, t = 2400, freeze = true, look = 'day', warp = true } = {}) => {
    await o.p.evaluate((l, xx, tt, fz, lk, wp) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); if (wp) { J.warp(l, { x: xx }); J.setT(tt); } if (fz) J.freeze(true); }, lane, x, t, freeze, look, warp);
    await sleep(2400);
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
  const winterIn = o => waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);

  // 1.4 — THE SNOW-START SEAM: the TAP TO START frame (the kid on lane 0, nothing warped), the ground's row under the kid read across
  if (all || what === 'seam') {
    const files = [], labels = [], seamJ = {};
    for (const [k, q, look] of [['noon-heavy', '&tod=noon&weather=clear&date=2027-01-20&snow=heavy', 'day'], ['noon-light', '&tod=noon&weather=clear&date=2027-01-20&snow=light', 'day'], ['noon-none', '&tod=noon&weather=clear&date=2027-01-20&snow=none', 'day'], ['night-heavy', '&tod=night&date=2027-01-20&snow=heavy', 'night'], ['night-none', '&tod=night&date=2027-01-20&snow=none', 'night']]) {
      for (const [side, base] of abBase ? [['before', abBase], ['after', null]] : [['after', null]]) {
        const o = await pg(q, base ? { base } : {});
        await winterIn(o);
        await stage(o, { look, warp: false });
        // the seam's tell: the brightness jump across lane 0's lower edge vs the jumps inside the snow just above + below it
        const [, sy] = await o.p.evaluate(() => window.__jwLab.project(1.5, 0));
        const f = await shotTo(o, `seam/${k}-${side}-390.png`);
        files.push(f); labels.push(`${k} · ${side.toUpperCase()}`);
        const j = await o.p.evaluate(async y => {
          const c = await new Promise(r => window.__jwLab.view.snap(r, 390));
          if (!c) return null;
          const g = c.getContext('2d'), w = c.width, h = c.height;
          const row = r => { const d = g.getImageData(0, Math.max(0, Math.min(h - 1, Math.round(r * h))), w, 1).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) { const x = i / 4 / w; if (x > 0.3 && x < 0.7) continue; s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n / 3; };   // (the sides only: the kid's ring stands in the middle)
          const dy = 3 / h, jump = Math.abs(row(y + dy) - row(y - dy)), ref = [-30, -18, 18, 30].map(k => Math.abs(row(y + (k + 3) / h) - row(y + (k - 3) / h)));
          return { jump, ref: Math.max(...ref) };
        }, sy);
        seamJ[`${k}-${side}`] = j;
        if (side === 'after') console.log(`     SEAM ${k}: no hard line across the ground under the start (the brightness step at lane 0's edge ${j ? j.jump.toFixed(1) : '?'} vs ${j ? j.ref.toFixed(1) : '?'} inside the snow${seamJ[`${k}-before`] ? ` — the code before: ${seamJ[`${k}-before`].jump.toFixed(1)}` : ''}) — a measure only: the proof is tests/jaywalk-variety-b1.test.mjs + the sheet`);
        errs.push(...o.errs); await o.close();
      }
    }
    await compose(files, labels, 'seam/sheet-390.png', abBase ? 4 : 5, 260);
  }

  // 1.2 — THE SKYLINE SNOW: heavy + light × day + night (the band's top crop + the whole frame)
  if (all || what === 'sky') {
    const files = [], labels = [];
    for (const [k, q, look] of [['heavy-day', '&tod=noon&weather=clear&date=2027-01-20&snow=heavy', 'day'], ['light-day', '&tod=noon&weather=clear&date=2027-01-20&snow=light', 'day'], ['heavy-night', '&tod=night&date=2027-01-20&snow=heavy', 'night'], ['light-night', '&tod=night&date=2027-01-20&snow=light', 'night'], ['heavy-sunset', '&tod=sunset&weather=clear&date=2026-12-24&snow=heavy', 'day'], ['none-day', '&tod=noon&weather=clear&date=2027-01-20&snow=none', 'day']]) {
      const o = await pg(q);
      await winterIn(o);
      await stage(o, { look, freeze: false });
      const s = await o.p.evaluate(() => window.__jwLab.view.season().sp);
      const want = k.split('-')[0];
      ok((s && s.skySnow) === (want === 'none' ? '' : want), `SKY SNOW ${k}: the band's snow layer is ${JSON.stringify(s && s.skySnow)}`);
      files.push(await shotTo(o, `sky/${k}-390.png`)); labels.push(k.toUpperCase());
      errs.push(...o.errs); await o.close();
    }
    await compose(files, labels, 'sky/sheet-390.png', 3, 260);
  }

  // 1.3 — MORE CLEAR VIEW UP TOP: noon before / after (+ the other day looks after, night before = after)
  if (all || what === 'haze') {
    const files = [], labels = [], fogs = {};
    for (const [k, q, look] of [['noon', '&tod=noon&weather=clear&date=2026-07-15', 'day'], ['night', '&tod=night&date=2026-07-15', 'night'], ['sunrise', '&tod=sunrise&weather=clear&date=2026-07-15', 'day'], ['golden', '&tod=golden&weather=clear&date=2026-07-15', 'day'], ['sunset', '&tod=sunset&weather=clear&date=2026-07-15', 'day'], ['overcast', '&tod=noon&weather=overcast&date=2026-07-15', 'day']]) {
      for (const [side, base] of abBase && (k === 'noon' || k === 'night') ? [['before', abBase], ['after', null]] : [['after', null]]) {
        const o = await pg(q, base ? { base } : {});
        await stage(o, { look });
        fogs[`${k}-${side}`] = await o.p.evaluate(() => window.__jwLab.view.info().fog);
        files.push(await shotTo(o, `haze/${k}-${side}-390.png`)); labels.push(`${k} · ${side.toUpperCase()}`);
        errs.push(...o.errs); await o.close();
      }
    }
    const fa = fogs['noon-after'], fb = fogs['noon-before'], na = fogs['night-after'], nb = fogs['night-before'];
    if (fb) ok(fa[0] > fb[0] + 1 && Math.abs(fa[1] - fb[1]) < 0.01, `HAZE noon: the haze starts further away (${fb[0].toFixed(1)} → ${fa[0].toFixed(1)}), still full at the same far edge (${fa[1].toFixed(1)})`);
    if (nb) ok(Math.abs(na[0] - nb[0]) < 0.01 && Math.abs(na[1] - nb[1]) < 0.01, 'HAZE night: unchanged');
    await compose(files, labels, 'haze/sheet-390.png', 4, 260);
  }

  if (all || what === 'tiers') {
    for (const rate of [10, 6]) {
      const o = await open(390, 844, 3, '&preview=1&seed=look3&zoom=8&angle=straight&cv=2&tod=noon&weather=clear&date=2026-07-15&look=day');
      await up(o.p);
      const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'look3'); J.bot(true); window.__tl = []; let last = -1; const t0 = performance.now(); setInterval(() => { const t = J.view.tier(); if (t !== last) { window.__tl.push([Math.round(performance.now() - t0), t, J.state().y]); last = t; } if (J.state().st === 'out') J.restart('solo'); }, 100); });
      await sleep(45000);
      const tl = await o.p.evaluate(() => window.__tl);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      console.log(`     TIER LOG at ${rate}× CPU: ${tl.map(([t, k, y]) => `${(t / 1000).toFixed(1)} s → tier ${k} (lane ${y})`).join(' · ')}`);
      ok(tl.every((r, i) => i === 0 || r[1] < tl[i - 1][1]), `TIERS at ${rate}× CPU: only steps DOWN over 45 s of hopping — no flap back up (${tl.map(r => r[1]).join(' → ')})`);
      errs.push(...o.errs); await o.close();
    }
  }
  // 1.1 — THE SHADOW POPS: 30 s of hopping (the bot) at noon, tier 2, a tier change forced at 10 s (→ 1) and 18 s (→ 2); every frame's
  // shadow strength recorded in the page — it may move at most 1 s's worth a second (the fade), never a jump; a frame strip every 2 s
  if (all || what === 'shadows') {
    const o = await pg('&tod=noon&weather=clear&date=2026-07-15&look=day');
    await stage(o, { look: 'day', freeze: false, warp: false });
    await o.p.evaluate(() => { const J = window.__jwLab; J.bot(true); window.__sh = []; const t0 = performance.now(); const f = () => { const i = J.view.info(); window.__sh.push([performance.now() - t0, i.sunF, i.tier, i.sunMap]); if (J.state().st === 'out') J.restart('solo'); if (window.__sh.length < 4000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const files = [];
    for (let s = 0; s < 30; s += 2) {
      if (s === 10) await o.p.evaluate(() => window.__jwLab.setTier(1));
      if (s === 18) await o.p.evaluate(() => window.__jwLab.setTier(2));
      files.push(await shotTo(o, `shadows/t${String(s).padStart(2, '0')}-390.png`));
      await sleep(2000);
    }
    const sh = await o.p.evaluate(() => window.__sh);
    let worst = 0, at = 0;
    for (let i = 1; i < sh.length; i++) { const d = Math.abs(sh[i][1] - sh[i - 1][1]) - (sh[i][0] - sh[i - 1][0]) / 1000; if (d > worst) { worst = d; at = sh[i][0]; } }
    const down = sh.filter(r => r[2] === 1), lo = sh.findIndex(r => r[2] === 1), gone = sh.findIndex((r, i) => i > lo && r[1] === 0);
    ok(sh.length > 600, `SHADOWS: ${sh.length} frames recorded over 30 s of hopping`);
    ok(worst < 0.02, `SHADOWS: the sun shadows' strength never jumps between frames (worst over the fade's own pace ${worst.toFixed(3)} at ${(at / 1000).toFixed(1)} s)`);
    ok(lo > 0 && gone > lo && sh[gone][0] - sh[lo][0] > 800, `SHADOWS: the forced step to tier 1 FADES them out over ${lo > 0 && gone > lo ? ((sh[gone][0] - sh[lo][0]) / 1000).toFixed(2) : '?'} s (≈ 1 s), never a snap`);
    ok(down.length && sh[sh.length - 1][1] === 1, 'SHADOWS: back on tier 2 they fade back to full');
    ok(sh[0][1] === 1 && sh.filter(r => r[2] === 2 && r[0] < 10000).every(r => r[1] === 1), 'SHADOWS: at tier 2 they are on from the first frame and stay on while hopping (never late, never off)');
    await compose(files, files.map((_, i) => `${i * 2} s${i * 2 === 10 ? ' · → TIER 1' : i * 2 === 18 ? ' · → TIER 2' : ''}`), 'shadows/strip-390.png', 5, 220);
    errs.push(...o.errs); await o.close();
  }
}
