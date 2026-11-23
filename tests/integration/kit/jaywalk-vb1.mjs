// JAYWALK VARIETY B1 — the look checks (tests/integration/jaywalk-lab.mjs `--vb1[=seam|sky|haze|shadows|traffic|perf]` [--ab <base>]): the
// lab (the pure engine in the tab) with the clock / the season / the weather forced → the shots (the pass's folder) + what must hold.
//   seam     — GROUP 1.4: THE SNOW-START SEAM, the start screen, before (--ab: the code before) / after, day + night × light / heavy / none
//   sky      — GROUP 1.2: THE SKYLINE SNOW, heavy + light × day + night, 390
//   haze     — GROUP 1.3: MORE CLEAR VIEW UP TOP, before / after at noon (+ sunrise · golden · sunset · overcast after) + night unchanged
//   tiers    — GROUP 1.1: THE TIER LOG — the real governor (no pinned tier) on a phone-like CPU (10× + 6× throttle), 45 s of hopping: every
//              tier change logged; it may step DOWN, never flap back up (the probe's cap verdict misread a busy CPU — the shadow pops)
//   shadows  — GROUP 1.1: THE SHADOW POPS — 30 s of hopping at tier 2 with a forced tier change: the sun shadows' strength never jumps
//   traffic  — GROUP 3: each area's traffic (day + night), the taxis + the emergency lights close, the long vehicles
import { frameCheck } from './frame-report.mjs';
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
  // GROUP 3 — THE AREA TRAFFIC: every area, day + night (the kid on a calm lane inside it, the world frozen once its models are in) + close-ups:
  // the emergency light bars + the taxis at night, the long vehicles by day
  if (all || what === 'traffic' || what.startsWith('traffic:')) {
    const AREAS = [['opening', -1], ['docks', 0], ['fish', 1], ['yard', 2], ['bridge', 3], ['downtown', 4], ['canal', 5], ['lighthouse', 6], ['airfield', 7]];
    const only = what.startsWith('traffic:') ? what.slice(8).split('+') : null;
    const files = [], labels = [], seen = {};
    const lane0 = ar => (ar < 0 ? 8 : 50 * (ar + 1) + 10);
    for (const [name, ar] of AREAS.filter(a => !only || only.includes(a[0]))) {
      for (const look of ['day', 'night']) {
        const o = await pg(`&tod=${look === 'day' ? 'noon' : 'night'}&weather=clear&date=2026-07-15`);
        const L0 = await o.p.evaluate(l => { const J = window.__jwLab; for (let i = l; i < l + 30; i++) if (J.lane(i).type === 'grass' && J.lane(i + 1).type === 'road') return i; return l; }, lane0(ar));
        await o.p.evaluate((l, lk) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); J.warp(l, { x: 4500 }); J.setT(2400); J.freeze(true); }, L0, look);
        const inn = await waitFor(o.p, `(() => { const v = window.__jwLab.view.info().variety; return v && v.loading === 0 && v.queued === 0 && v.held.length > 0; })()`, 30000);
        await sleep(1500);
        const r = await o.p.evaluate(l => { const J = window.__jwLab, n = {}; for (let i = l - 4; i < l + 18; i++) for (const it of J.items(i).items || []) if (it.what && it.what !== 'log') n[it.what] = (n[it.what] || 0) + 1; return { n, v: J.view.info().variety, calls: J.view.info().calls }; }, L0);
        seen[`${name}-${look}`] = r;
        const plain = ['sedan', 'hatchback', 'taxi', 'van', 'truck'].reduce((a, k) => a + (r.n[k] || 0), 0), all2 = Object.values(r.n).reduce((a, b) => a + b, 0);
        ok(inn, `TRAFFIC ${name} ${look}: the area's models in (${r.v.held.join(' · ')})`);
        ok(all2 === 0 || plain / all2 > 0.5, `TRAFFIC ${name} ${look}: plain vehicles are the majority (${plain} of ${all2} in view: ${JSON.stringify(r.n)})`);
        files.push(await shotTo(o, `traffic/${name}-${look}-390.png`)); labels.push(`${name.toUpperCase()} · ${look}`);
        errs.push(...o.errs); await o.close();
      }
    }
    await compose(files, labels, `traffic/areas-390${only ? '-' + only.join('-') : ''}.png`, 6, 220);
    // the close-ups: find the vehicle on screen (its lane + the moment), the kid two lanes below, the world frozen → a crop round it
    const close = async (id, ar, look, tag) => {
      const o = await pg(`&tod=${look === 'day' ? 'noon' : 'night'}&weather=clear&date=2026-07-15`);
      await o.p.evaluate(l => { const J = window.__jwLab; J.restart('solo', 'look3'); J.setCamera(8, 'straight', true); J.warp(l, { x: 4500 }); }, lane0(ar));
      await waitFor(o.p, `(() => { const v = window.__jwLab.view.info().variety; return v && v.loading === 0 && v.queued === 0 && v.held.length > 0; })()`, 30000);
      const at = await o.p.evaluate((idd, l0) => {
        const J = window.__jwLab;
        for (let t = 2400; t < 2400 + 60 * 40; t += 40) { J.setT(t); for (let i = l0; i < l0 + 40; i++) { const I = J.items(i); for (const q of I.items || []) { if (q.what !== idd) continue; for (const k of [-1, 0, 1]) { const lf = q.left + k * (I.per || 0); if (lf > 1.2 && lf + q.len < 7.8) return { lane: i, t, c: lf + q.len / 2, len: q.len, left: q.left }; } } } }
        return null;
      }, id, lane0(ar));
      if (!at) { ok(false, `CLOSE ${tag}: a ${id} found on screen`); await o.close(); return null; }
      await o.p.evaluate((a, lk) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.ghosts(0); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); J.warp(a.lane - 2, { x: 4500 }); J.setT(a.t); J.freeze(true); }, at, look);
      await sleep(1600);
      const [sx, sy] = await o.p.evaluate(a => window.__jwLab.project(a.c, a.lane + 0.5), at);
      const cw = Math.min(390, 120 + at.len * 60), ch = 150, clip = { x: Math.max(0, Math.min(390 - cw, Math.round(sx * 390 - cw / 2))), y: Math.max(0, Math.min(844 - ch, Math.round(sy * 844 - ch * 0.6))), width: cw, height: ch };
      const f = await shotTo(o, `traffic/close-${tag}-390.png`, clip);
      const line = await o.p.evaluate(a => { const J = window.__jwLab, q = J.items(a.lane).items.find(it => Math.abs(it.left - a.left) < 0.01); return q ? q.what : ''; }, at);
      ok(line === id, `CLOSE ${tag}: the ${id} drawn (lane ${at.lane}, ${at.len} cells)`);
      errs.push(...o.errs); await o.close();
      return f;
    };
    if (!only) {
      const cf = [], cl = [];
      for (const [id, ar, look, tag] of [['police', 4, 'night', 'police-night'], ['ambulance', 5, 'night', 'ambulance-night'], ['firetruck', 7, 'night', 'firetruck-night'], ['taxi', 4, 'night', 'taxi-night'], ['taxi', 4, 'day', 'taxi-day'], ['police', 4, 'day', 'police-day'], ['semi', 0, 'day', 'semi-day'], ['bendy', 4, 'day', 'bendy-day'], ['schoolbus', 6, 'day', 'schoolbus-day'], ['semi', 2, 'night', 'semi-night'], ['citybus', 3, 'day', 'citybus-day'], ['tug', 7, 'day', 'tug-day'], ['forklift', 0, 'day', 'forklift-day'], ['dump', 2, 'day', 'dump-day'], ['tanker', 3, 'day', 'tanker-day'], ['garbage', 1, 'day', 'garbage-day'], ['delivery', 7, 'day', 'delivery-day'], ['suv', 6, 'day', 'suv-day'], ['sports', 4, 'day', 'sports-day']]) { const f = await close(id, ar, look, tag); if (f) { cf.push(f); cl.push(tag.toUpperCase()); } }
      await compose(cf, cl, 'traffic/close-sheet.png', 4, 300, 150 / 300);
    }
  }
  // GROUP 4 — THE MEASURE: every area (its traffic in), night + noon (+ Dec 24 heavy snow noon), tiers 2 · 1 · 0, 8 kids (the kid + 7 ghosts), the
  // world running 7 s at 4× CPU: the WORST frame's draw calls (≤ 96 tier 2 · ≤ 64 tiers 1 + 0, daylook.js#CALLS_MAX) + the median fps
  if (what === 'perf' || what.startsWith('perf:')) {
    const { CALLS_MAX } = await import('../../../js/games/jaywalk/daylook.js');
    const AREAS = [['opening', -1], ['docks', 0], ['fish', 1], ['yard', 2], ['bridge', 3], ['downtown', 4], ['canal', 5], ['lighthouse', 6], ['airfield', 7]];
    const only = what.startsWith('perf:') ? what.slice(5).split('+') : null;
    const rows = [];
    for (const [name, ar] of AREAS.filter(a => !only || only.includes(a[0]))) for (const [look, q] of [['night', '&tod=night&date=2026-07-15'], ['noon', '&tod=noon&weather=clear&date=2026-07-15'], ...(name === 'downtown' || name === 'canal' ? [['noon-snow', '&tod=noon&weather=clear&date=2026-12-24&snow=heavy'], ['night-snow', '&tod=night&date=2026-12-24&snow=heavy']] : []), ...(name === 'airfield' || name === 'docks' ? [['night-jan', '&tod=night&date=2027-01-20&snow=light']] : [])]) for (const tier of [2, 1, 0]) {
      const o = await pg(q, { tier });
      if (/snow=/.test(q)) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      const L0 = ar < 0 ? 6 : 50 * (ar + 1) + 6;
      await o.p.evaluate((l, lk) => { const J = window.__jwLab; J.freeze(false); J.bot(false); J.restart('solo', 'look3'); J.setLook(lk); J.setCamera(8, 'straight', true); J.warp(l, { x: 4500, safe: true }); J.ghosts(7); }, L0, look.startsWith('night') ? 'night' : 'day');
      await waitFor(o.p, `(() => { const i = window.__jwLab.view.info(), v = i.variety, p = i.props; return v && v.loading === 0 && v.queued === 0 && !v.staged && v.held.length > 0 && (!p || (p.loading === 0 && p.queued === 0 && !p.staged)); })()`, 30000);   // (VARIETY B2: the trees + the edge pieces in too)
      await sleep(1200);
      const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await o.p.evaluate(() => { const J = window.__jwLab; J.clearFrames(); window.__mc = 0; window.__go = true; const f = () => { if (!window.__go) return; const c = J.view.info().calls; if (c > window.__mc) window.__mc = c; if (J.state().st === 'out') { J.restart('solo', 'look3'); } requestAnimationFrame(f); }; requestAnimationFrame(f); });
      await sleep(7000);
      const { list, ...r } = await o.p.evaluate(() => { window.__go = false; const fr = window.__jwLab.frames().slice(10).sort((a, b) => a - b); return { calls: window.__mc, med: fr.length ? 1000 / fr[Math.floor(fr.length / 2)] : 0, worst: fr.length ? fr[fr.length - 1] : 0, n: fr.length, list: fr }; });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      rows.push({ name, look, tier, ...r });
      console.log(`     PERF ${name} ${look} tier ${tier}: worst ${r.calls} calls (≤ ${CALLS_MAX[tier]}) · median ${r.med.toFixed(1)} fps · worst frame ${r.worst.toFixed(1)} ms (${r.n} frames)`);
      frameCheck(ok, `${name} ${look} tier ${tier}, 4× CPU`, list);
      ok(r.calls <= CALLS_MAX[tier], `PERF ${name} ${look} tier ${tier}: ${r.calls} draw calls ≤ ${CALLS_MAX[tier]}`);
      ok(r.med >= 58, `PERF ${name} ${look} tier ${tier}: median ${r.med.toFixed(1)} fps at 4× CPU`);
      errs.push(...o.errs); await o.close();
    }
    if (out) { mkdirSync(join(out, 'perf'), { recursive: true }); (await import('node:fs')).writeFileSync(join(out, 'perf', `perf${only ? '-' + only.join('-') : ''}.json`), JSON.stringify(rows, null, 1)); }
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
