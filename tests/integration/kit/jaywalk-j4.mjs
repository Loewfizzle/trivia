// JAYWALK J4 — WINTER's look checks (tests/integration/jaywalk-lab.mjs `--j4[=peek|strip|snow|wet|props|perf]`): the lab (the pure engine in
// the tab — no server) with the season clock forced (&date= · &snow= · &wet=) → the shots (the pass's folder) + what must hold: the seasonal
// pack is fetched ONLY in season, the run takes it before its first touch, the snow never changes a thing the rules see.
// The strips are composed IN THE BROWSER (a page of the shots side by side, screenshotted) — no image library.
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const STRIP = ['2026-11-30', '2026-12-01', '2026-12-12', '2026-12-24', '2027-01-15', '2027-02-25'];

export async function looksJ4({ open, up, ok, sleep, waitFor, out, what = '', b, errs = [] }) {
  const all = !what;
  const pg = async (w, q) => {
    const o = await open(w, w === 430 ? 932 : 844, 3, `&preview=1&seed=look3&tier=2&zoom=8&angle=straight&cv=2${q}`);
    await up(o.p);
    return o;
  };
  /** the pack in (when the date is in season) → a fresh run on the seed, the kid at lane `lane` (column x), the world frozen at tick t */
  const stage = async (o, { lane = 17, x = 4500, t = 2400, freeze = true, look = 'night', cam = [8, 'straight'] } = {}) => {
    await waitFor(o.p, '(() => { const s = window.__jwLab.view.season(); return s.pack || !(s.winter > 0) && !window.__jwLab.view.season().christmas; })()', 15000);
    await o.p.evaluate((l, xx, tt, fz, lk, c) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(c[0], c[1], true); J.warp(l, { x: xx }); J.setT(tt); if (fz) J.freeze(true); }, lane, x, t, freeze, look, cam);
    await sleep(2400);   // (a look change cross-fades the band)
  };
  const shotTo = async (o, name) => { const f = join(out, name); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f }); return f; };
  /** a row of shots (+ a label each) → one picture */
  const compose = async (files, labels, name, cols = files.length, hk = 1) => {
    if (!out) return;
    const ctx = await b.createBrowserContext(), p = await ctx.newPage();
    const imgs = files.map(f => `data:image/png;base64,${readFileSync(f).toString('base64')}`);
    const W = hk < 1 ? 560 : 300, H = Math.round(W * 844 / 390 * hk);
    await p.setViewport({ width: cols * (W + 8) + 8, height: Math.ceil(files.length / cols) * (H + 40) + 8, deviceScaleFactor: 1 });
    await p.setContent(`<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${W}px);gap:8px;padding:8px;font:700 16px system-ui;color:#eee">${imgs.map((s, i) => `<figure style="margin:0"><figcaption style="height:28px">${labels[i]}</figcaption><img src="${s}" style="width:${W}px;height:${H}px;display:block"></figure>`).join('')}</body>`, { waitUntil: 'load' });
    await p.screenshot({ path: join(out, name), fullPage: true });
    await ctx.close();
  };

  if (all || what === 'peek') {
    for (const look of ['night', 'day']) {
      const o = await pg(390, '&date=2026-12-24&snow=heavy');
      await stage(o, { look });
      const s = await o.p.evaluate(() => window.__jwLab.view.season());
      ok(s.pack && s.winter === 1, `PEEK ${look}: the pack in, Dec 24 full winter (${JSON.stringify(s)})`);
      if (out) await shotTo(o, `peek-${look}.png`);
      // (THE WALL over the snow: the blackout / the fog bank catching up with a kid standing still)
      await o.p.evaluate(() => { const J = window.__jwLab; J.freeze(false); J.state(); });
      await o.p.evaluate(() => { const J = window.__jwLab, s = J.state(); J.warp(s.y, { x: 4500, safe: false }); });
      await sleep(5200); if (out) await shotTo(o, `peek-${look}-wall.png`);
      errs.push(...o.errs); await o.close();
    }
  }

  if (all || what === 'strip') for (const look of ['night', 'day']) for (const w of [390, 430]) {
    const files = [];
    for (const d of STRIP) {
      const o = await pg(w, `&date=${d}&snow=none`);
      await stage(o, { look });
      const s = await o.p.evaluate(() => window.__jwLab.view.season());
      ok(d === '2026-11-30' ? !s.pack && s.winter === 0 : s.pack, `STRIP ${look} ${w} ${d}: winter ${s.winter} · christmas ${s.christmas} · the pack ${s.pack ? 'in' : 'not fetched'}`);
      if (d === '2026-11-30') ok(!o.reqs.some(u => /\/winter\//.test(u)), 'Nov 30: THE SEASONAL PACK is never fetched out of season');
      if (out) files.push(await shotTo(o, `strip/${look}-${w}-${d}.png`));
      errs.push(...o.errs); await o.close();
    }
    if (w === 390) await compose(files, STRIP.map(d => `${d}`), `season-strip-${look}.png`);
    else await compose(files, STRIP.map(d => `${d} · 430`), `season-strip-${look}-430.png`);
  }

  if (all || what === 'snow') {
    const files = [], labels = [];
    for (const look of ['night', 'day']) for (const sn of ['none', 'light', 'heavy']) {
      const o = await pg(390, `&date=2027-01-15&snow=${sn}`);
      await stage(o, { look, lane: 17 });
      if (out) files.push(await shotTo(o, `snow/${look}-${sn}.png`)); labels.push(`${look} · ${sn}`);
      errs.push(...o.errs); await o.close();
    }
    await compose(files, labels, 'snow-heavy-vs-none.png', 3);
  }

  if (all || what === 'wet') {
    const files = [], labels = [];
    for (const [d, nm] of [['2026-11-21', 'normal'], ['2026-12-24', 'winter']]) for (const wet of [0, 1]) {
      const o = await pg(390, `&date=${d}&snow=none${wet ? '&wet=1' : ''}`);
      const L = await o.p.evaluate(() => { const J = window.__jwLab; for (let l = 252; l < 300; l++) if (J.lane(l).type === 'grass' && J.lane(l + 1).type === 'road' && J.lane(l + 2).type === 'road') return l; return 255; });
      await stage(o, { look: 'night', lane: L, t: 3000 });
      const s = await o.p.evaluate(() => window.__jwLab.view.season());
      ok(wet ? s.wet > 0 : s.wet === 0, `WET ${nm} ${wet ? 'ON' : 'off'}: the switch reads ${s.wet}`);
      if (out) files.push(await shotTo(o, `wet/${nm}-${wet ? 'on' : 'off'}.png`)); labels.push(`${nm} night · wet ${wet ? 'ON' : 'off'}`);
      errs.push(...o.errs); await o.close();
    }
    await compose(files, labels, 'wet-streets.png', 4);
  }

  if (all || what === 'props') {
    const files = [], labels = [];
    for (const look of ['night', 'day']) for (const w of [390, 430]) {
      const o = await pg(w, '&date=2026-12-24&snow=none');
      // (the opening's grass lane with the most props on it — trees, planters, cones — the kid on the lane below it)
      const L = await o.p.evaluate(() => { const J = window.__jwLab; let best = 9, n = -1; for (let l = 4; l < 48; l++) { const q = J.lane(l); if (q.type !== 'grass' || q.mark) continue; const c = (q.obs || []).filter(Boolean).length; if (c > n) { n = c; best = l; } } return best; });
      for (const [lane, tag] of [[L - 1, 'pine + snowman'], [17, 'Christmas tree']]) {
        await stage(o, { look, lane, cam: [7, 'straight'] });
        if (out) { const f = join(out, `props/${look}-${w}-${lane}.png`); mkdirSync(dirname(f), { recursive: true }); const vw = w, vh = w === 430 ? 932 : 844; await o.p.screenshot({ path: f, clip: { x: 0, y: vh * 0.3, width: vw, height: vh * 0.42 } }); files.push(f); }
        labels.push(`${look} · ${w} · ZOOM 7 · ${tag}`);
      }
      errs.push(...o.errs); await o.close();
    }
    await compose(files, labels, 'props-closeup.png', 4, 0.42);
  }
}
