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
