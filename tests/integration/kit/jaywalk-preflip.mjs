// JAYWALK — BEFORE THE FLIP's look checks (tests/integration/jaywalk-lab.mjs `--preflip`): THE AREA ARRIVAL on the lab (the same night.js +
// the same banner module the game draws — arrival.js), at 390 × 844 @3, ZOOM 8 · STRAIGHT (the pinned camera), DAY + NIGHT, three areas
// (THE DOCKS · THE RAIL YARD · DOWNTOWN): the GATE SIGN 8 + 5 lanes out (up, whole, under the band, above the kid) · THE ARRIVAL BANNER at
// the crossing (the area's name + LANE n, at the top: under the lane count, its foot above the far haze's — never over a lane). The
// lab's own tool bars are hidden for the shots (the game has none). The shots → arrival/.
const AREAS = [[0, 'docks', 'THE DOCKS'], [2, 'rail-yard', 'THE RAIL YARD'], [4, 'downtown', 'DOWNTOWN']];
// + THE INBOX's Nov 17 6:58 pm add-on (`--preflip=water`): ONE BODY OF WATER — 2 and 3 water lanes in a row, day + night → water/.
export async function looksPreflip(p, { ok, shot, sleep, waitFor, what = '' }) {
  const L = js => p.evaluate(js);
  await L("for (const e of document.querySelector('.jw-stage').children) if (!e.matches('.jw-play, .jw-hud, .jw-arrive, .jw-blackout')) e.style.visibility = 'hidden'");
  let lookNow = '';
  if (!what || what === 'water') {
    // the first run of exactly 2 water lanes + the first of 3 or more (seed look3), from lane 12 on
    const runs = await L("(() => { const J = window.__jwLab, out = {}; let i = 12; while (i < 900 && !(out[2] && out[3])) { if (J.lane(i).type !== 'water') { i++; continue; } let n = 0; while (J.lane(i + n).type === 'water') n++; const k = n >= 3 ? 3 : n; if (k >= 2 && !out[k]) out[k] = i; i += n; } return out; })()");
    ok(!!runs[2] && !!runs[3], `ONE BODY OF WATER: a run of 2 water lanes at lane ${runs[2]}, of 3+ at lane ${runs[3]} (seed look3)`);
    for (const look of ['night', 'day']) {
      await L(`window.__jwLab.freeze(false); window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('${look}'); window.__jwLab.hop('u')`);
      if (look !== lookNow) { lookNow = look; await sleep(2100); }
      for (const n of [2, 3]) {
        if (!runs[n]) continue;
        await p.evaluate(l => { const J = window.__jwLab; J.freeze(false); J.warp(l, { x: 4500 }); J.freeze(true); }, runs[n] - 2);
        await sleep(1300); await waitFor(p, '!window.__jwLab.state().info.sky.fading', 5000);
        await shot(p, `water/${look}-${n}-water-lanes.png`);
      }
    }
    if (what === 'water') { await L("window.__jwLab.freeze(false); for (const e of document.querySelector('.jw-stage').children) e.style.visibility = ''"); return; }
  }
  for (const look of ['night', 'day']) {
    await L(`window.__jwLab.freeze(false); window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('${look}'); window.__jwLab.hop('u')`);
    if (look !== lookNow) { lookNow = look; await sleep(2100); }
    const cam = await L('window.__jwLab.state().info');
    ok(cam.zoom === 8 && cam.angle === 'straight', `(${look}) the pinned camera: ZOOM ${cam.zoom} · ${String(cam.angle).toUpperCase()}`);
    for (const [k, id, name] of AREAS) {
      const G = 50 * (k + 1);
      const at = async d => { await p.evaluate(l => { const J = window.__jwLab; J.freeze(false); J.warp(l, { x: 4500 }); J.freeze(true); }, G - d); await sleep(d >= 8 ? 1400 : 500); await waitFor(p, '!window.__jwLab.state().info.sky.fading', 5000); return p.evaluate(() => { const s = window.__jwLab.state(); return { g: s.info.gate, kid: s.kidY }; }); };
      for (const d of [8, 5]) {
        const q = await at(d);
        ok(q.g && q.g.text.startsWith(name) && q.g.a > 0.9 && q.g.y > 0.24 && q.g.y < 0.34 && q.g.y < q.kid - 0.2,
          `${name} (${look}): ${d} lanes out THE GATE SIGN is up — whole (${q.g ? q.g.a.toFixed(2) : '—'}), under the band, its foot ${q.g ? q.g.y.toFixed(3) : '—'} down the screen, well above the kid (${q.kid.toFixed(2)})`);
        await shot(p, `arrival/${look}-${k + 1}-${id}-a-${d}-lanes-out.png`);
      }
      // THE CROSSING: the kid on the gate lane + the banner exactly as the crossing shows it (the real crossing's event path: e2e-jaywalk)
      await p.evaluate(l => { const J = window.__jwLab; J.freeze(false); J.warp(l, { x: 4500 }); J.freeze(true); }, G);
      await sleep(900);
      await L(`window.__jwLab.arriveAt(${G}, '${look}')`);
      await sleep(620);   // (past its entrance: the flicker / the swing)
      const b = await L("(() => { const e = document.querySelector('.jw-arrive'), r = e.querySelector('.jw-arrive-board').getBoundingClientRect(), n = document.querySelector('.jw-lanes').getBoundingClientRect(); return { on: e.classList.contains('is-on'), look: e.dataset.look, text: e.textContent, top: r.top, bottom: r.bottom, left: r.left, right: r.right, count: n.bottom, h: innerHeight, w: innerWidth, op: +getComputedStyle(e).opacity }; })()");
      ok(b.on && b.look === look && b.text === `${name}LANE ${G}` && b.top >= b.count - 2 && b.bottom <= b.h * 0.28 && b.left >= 8 && b.right <= b.w - 8 && b.op > 0.9,
        `${name} (${look}): THE ARRIVAL BANNER at the crossing — "${b.text}" under the lane count (its top ${Math.round(b.top)} pt, the count's foot ${Math.round(b.count)}), its foot ${Math.round(b.bottom)} pt (≤ 28 % = ${Math.round(b.h * 0.28)}: never over a lane), inside the screen (${Math.round(b.left)}–${Math.round(b.right)} pt), opacity ${b.op.toFixed(2)}`);
      await shot(p, `arrival/${look}-${k + 1}-${id}-c-the-crossing.png`);
      await sleep(2200);
      ok(!(await L("document.querySelector('.jw-arrive').classList.contains('is-on')")), `${name} (${look}): … gone after ≈ 2.5 s`);
    }
  }
  await L("window.__jwLab.freeze(false); for (const e of document.querySelector('.jw-stage').children) e.style.visibility = ''");
}

// THE INBOX's Nov 17 6:58 pm add-on, item (2) — "RANDOM WEIRD FLASHES OF WHITE LIGHT" BY DAY (`--preflip=flash`): a 2-minute DAY bot run
// through every area (≈ 14 s in each, warped to its gate), the page's frames streamed (CDP screencast, small JPEGs) → each frame's mean
// brightness + its share of near-white pixels; a SUDDEN jump (vs the median of the frames just before — never the 1.5 s after a warp /
// a restart) is a flash: logged with what the scene was doing (the moments, the band's fade, the tier, the fog) + its frame kept.
export async function flashScan(p, { ok, sleep, out, decode, writeFile }) {
  const L = js => p.evaluate(js);
  await L("for (const e of document.querySelector('.jw-stage').children) if (!e.matches('.jw-play, .jw-hud, .jw-arrive, .jw-blackout')) e.style.visibility = 'hidden'");
  await L("window.__jwLab.freeze(false); window.__jwLab.bot(false); window.__jwLab.restart('solo', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('day'); window.__jwLab.hop('u')");
  await sleep(2200);
  const cdp = await p.createCDPSession(), frames = [];
  let quietUntil = 0, area = 0;
  cdp.on('Page.screencastFrame', async f => {
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    const t = Date.now();
    try {
      const img = decode(Buffer.from(f.data, 'base64'), { useTArray: true }), d = img.data;
      let sum = 0, white = 0;
      for (let i = 0; i < d.length; i += 4) { const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; sum += y; if (y > 238) white++; }
      frames.push({ t, mean: sum / (d.length / 4), white: white / (d.length / 4), quiet: t < quietUntil, area, jpg: f.data });
      if (frames.length > 40) frames[frames.length - 41].jpg = null;   // (only the latest few frames' pictures are held)
    } catch { /* a frame that did not decode */ }
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: 195, maxHeight: 422, everyNthFrame: 1 });
  const events = [];
  let steps = 0;
  const watch = setInterval(async () => {
    const n = frames.length; if (n < 12) return;
    const f = frames[n - 1]; if (f.quiet || f.seen) return; f.seen = true;
    const prev = frames.slice(n - 11, n - 1).filter(x => !x.quiet).map(x => x.mean).sort((a, b) => a - b), med = prev[prev.length >> 1];
    const prevW = frames.slice(n - 11, n - 1).map(x => x.white).sort((a, b) => a - b)[5];
    if (prev.length >= 6 && (f.mean - med > 22 || f.white - prevW > 0.12)) {
      const s = await L("(() => { const s = window.__jwLab.state(), i = s.info || {}; return { y: s.y, over: s.over, tier: s.tier, fly: i.fly ? { jets: i.fly.jets, ufos: i.fly.ufos, ship: i.fly.shipOn, abd: i.fly.abducting, dim: i.fly.dim } : null, sky: i.sky ? { now: i.sky.now, fading: i.sky.fading } : null, gate: i.gate ? i.gate.text : '', fog: i.fog }; })()").catch(() => null);
      events.push({ at: f.t, area: f.area, jump: +(f.mean - med).toFixed(1), white: +(f.white - prevW).toFixed(3), state: s });
      if (out && f.jpg) writeFile(`${out}/flash-${events.length}-area${f.area + 1}.jpg`, Buffer.from(f.jpg, 'base64'));
      const b4 = frames[n - 2]; if (out && b4 && b4.jpg) writeFile(`${out}/flash-${events.length}-area${f.area + 1}-before.jpg`, Buffer.from(b4.jpg, 'base64'));
    }
  }, 30);
  for (let k = 0; k < 8; k++) {
    area = k; quietUntil = Date.now() + 1500;
    await p.evaluate(l => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.setLook('day'); J.hop('u'); } J.freeze(false); J.warp(J.find('grass', l)); J.bot(true); }, 50 * (k + 1) - 3);
    const end = Date.now() + 14000;
    let flip = Date.now() + 3000;
    while (Date.now() < end) { await sleep(400);
      // (a TIER STEP, as a phone's own: fired in a frame AFTER that frame's draw — the game's tiers.tick runs after night.draw)
      if (Date.now() > flip) { flip = Date.now() + 3000; steps++; await L('requestAnimationFrame(() => { const J = window.__jwLab; J.setTier(J.state().tier === 2 ? 1 : 2); })'); } if (await L('window.__jwLab.state().over')) { quietUntil = Date.now() + 1800; await p.evaluate(l => { const J = window.__jwLab; J.restart('solo', 'look3'); J.setLook('day'); J.hop('u'); J.warp(J.find('grass', l)); J.bot(true); }, 50 * (k + 1) + 4); } }
  }
  clearInterval(watch);
  await cdp.send('Page.stopScreencast').catch(() => {});
  await L('window.__jwLab.bot(false)');
  const n = frames.length, secs = n ? (frames[n - 1].t - frames[0].t) / 1000 : 0;
  console.log(`   FLASH SCAN: ${n} frames over ${secs.toFixed(0)} s by DAY, 8 areas, ${steps} tier steps · ${events.length} sudden brightness jumps`);
  for (const e of events) console.log('   FLASH', JSON.stringify(e));
  await L("for (const e of document.querySelector('.jw-stage').children) e.style.visibility = ''");
  return { frames: n, secs, events, steps };
}
