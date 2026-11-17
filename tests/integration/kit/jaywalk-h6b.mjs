// JAYWALK H6B — THE FINAL POLISH's look checks (tests/integration/jaywalk-lab.mjs `--h6b[=sky|gates|ufo|jet|ship|shops|lane|perf]`): the
// lab (the pure engine in the tab — no server) driven to each thing, DAY + NIGHT, at 390 × 844 @3 → the shots (<group>/…) + what must
// hold: THE PAINTED NIGHT SKYLINES (one a area, cross-faded at a gate, ≤ 2 held, the lights a landmark covers OFF), THE LOOK SWITCH (a
// cross-fade, never a jump), THE GATE SIGN (only on the approach — gone 3 lanes out), THE UFO (solid, high, into the hatch), THE
// BLACKBIRD (bigger), ONE Mothership countdown, the lab's ?lane=N.
const IDS = ['docks', 'fish-market', 'rail-yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'], SKY = ['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'];
export async function looksH6B(p, { ok, shot, sleep, waitFor, what = '', reqs = [], top, open, up }) {
  const L = js => p.evaluate(js), all = !what;
  const fresh = (look, mode = 'solo') => L(`window.__jwLab.freeze(false); window.__jwLab.ghosts(0); window.__jwLab.ghostsAt(null); window.__jwLab.bot(false); window.__jwLab.restart('${mode}', 'look3'); window.__jwLab.setCamera(8, 'straight', true); window.__jwLab.setLook('${look}'); window.__jwLab.hop('u')`);
  const stand = (lane, col) => p.evaluate((l, c) => { const J = window.__jwLab; if (J.state().over) { J.restart('solo', 'look3'); J.hop('u'); } const y = J.find('grass', l); J.warp(y, c == null ? {} : { x: c * 1000 + 500 }); return y; }, lane, col);
  const sky = () => p.evaluate(() => window.__jwLab.state().info.sky);
  const settled = () => waitFor(p, '!window.__jwLab.state().info.sky.fading', 6000);

  if (all || what === 'sky') {
    // ---- THE PAINTED NIGHT SKYLINES
    await fresh('night'); await sleep(900);
    let s = await sky();
    ok(s.now === 'skyline-night.webp' && s.held.length <= 2, `by night the opening keeps skyline-night (${s.now}; held ${s.held.join(' + ')})`);
    ok(!reqs.some(u => /skyline-night-[a-z]+\.webp/.test(u)), 'no night area\'s picture is fetched at the start');
    ok(!reqs.some(u => /skymarks\.js/.test(u)), 'the drawn night landmarks are RETIRED: skymarks.js is never fetched');
    await top('sky/night-0-the-opening-top.png'); await shot(p, 'sky/night-0-the-opening.png');
    await stand(38); await sleep(700); s = await sky();
    ok(s.now === 'skyline-night.webp' && s.held.includes('skyline-night-docks.webp'), `12 lanes before THE DOCKS' gate its night picture is fetched ahead (held ${s.held.join(' + ')})`);
    const f0 = s.fades;
    await stand(50); await sleep(800); s = await sky();
    ok(s.fading, 'at the gate the band is CROSS-FADING');
    await top('sky/night-1-docks-cross-fade-mid.png');
    await settled(); s = await sky();
    ok(s.now === 'skyline-night-docks.webp' && s.fades === f0 + 1 && s.held.length <= 2, `… to the docks' night picture (${s.now}, fades ${s.fades}, held ${s.held.join(' + ')})`);
    for (let k = 0; k < 8; k++) {
      await stand(50 * (k + 1) + 9, 4); await sleep(600); await settled(); await sleep(500); s = await sky();
      ok(s.now === `skyline-night-${SKY[k]}.webp` && s.held.length <= 2, `${IDS[k]} by night: the band shows its painted night skyline; ≤ 2 pictures held (${s.held.join(' + ')})`);
      // nothing blinks or flickers ON the landmark: the lights it covers are hidden — and only those
      const life = await p.evaluate(() => ({ l: [...document.querySelectorAll('.jw-sky-l')].map(e => e.hidden), n: [...document.querySelectorAll('.jw-sky-n')].map(e => e.hidden) }));
      const M = await p.evaluate(async f => { const m = await import('/js/games/jaywalk/skyline.js'); return { off: m.skyOff(f), bias: m.SKY_BIAS_NIGHT }; }, s.now);
      ok(life.l.every((h, i) => h === M.off.l.includes(i)) && life.n.every((h, i) => h === M.off.n.includes(i)), `${IDS[k]}: the lights + windows its landmark covers are OFF, the rest live (lights off ${M.off.l.join(',') || '—'} · windows off ${M.off.n.join(',') || '—'})`);
      ok(Math.abs(s.bias - M.bias[SKY[k]]) < 0.01, `${IDS[k]}: the band rests at the NIGHT's own offset (${s.bias})`);
      await top(`sky/night-${k + 1}-${IDS[k]}-top.png`); await shot(p, `sky/night-${k + 1}-${IDS[k]}.png`);
    }
    await stand(459, 4); await sleep(600); await settled(); s = await sky();
    ok(s.now === 'skyline-night-docks.webp', `the loop (lane 450 +) repeats the night pictures (${s.now})`);
    // ---- THE LOOK SWITCH: a cross-fade of the whole band (never a jump), in every area's own pictures
    await stand(359, 4); await sleep(600); await settled(); await sleep(300);
    const f1 = (await sky()).fades;
    await L("window.__jwLab.setLook('day')"); await sleep(650); s = await sky();
    const mid = await p.evaluate(() => { const o = document.querySelectorAll('.jw-sky-pic')[1], w = document.querySelector('.jw-seawall i.is-day'), l = document.querySelector('.jw-sky-life'); return { o: +getComputedStyle(o).opacity, w: +getComputedStyle(w).opacity, l: +getComputedStyle(l).opacity }; });
    ok(s.fading && mid.o > 0.03 && mid.o < 0.97, `THE LOOK SWITCH night → day: the band is mid cross-fade 0.65 s in (the over layer at ${mid.o.toFixed(2)})`);
    ok(mid.w > 0.03 && mid.w < 0.97 && mid.l > 0.03 && mid.l < 0.97, `… the sea wall's stone + the night's lights fade with it (wall ${mid.w.toFixed(2)} · lights ${mid.l.toFixed(2)})`);
    await top('sky/look-switch-night-to-day-mid-top.png'); await shot(p, 'sky/look-switch-night-to-day-mid.png');
    await settled(); s = await sky();
    ok(s.now === 'skyline-day-lighthouse.webp' && s.fades === f1 + 1, `… and lands on the day picture (${s.now})`);
    await sleep(300); await top('sky/look-switch-day-after-top.png');
    await L("window.__jwLab.setLook('night')"); await sleep(700); await top('sky/look-switch-day-to-night-mid-top.png'); await shot(p, 'sky/look-switch-day-to-night-mid.png');
    await settled(); s = await sky();
    ok(s.now === 'skyline-night-lighthouse.webp', `… and back (${s.now})`);
    // the day set, as before (the whole band, for the review)
    await fresh('day'); await sleep(600);
    for (let k = 0; k < 8; k++) { await stand(50 * (k + 1) + 9, 4); await sleep(600); await settled(); await sleep(500); await top(`sky/day-${k + 1}-${IDS[k]}-top.png`); await shot(p, `sky/day-${k + 1}-${IDS[k]}.png`); }
  }

  // ---- THE GATE SIGN: only on the approach — full ≥ 4.5 lanes out, FULLY GONE 3 lanes from the gate (and at it, and through it)
  if (all || what === 'gates') for (const look of ['night', 'day']) {
    await fresh(look); await sleep(500);
    for (let k = 0; k < 8; k++) {
      const G = 50 * (k + 1);
      const at = async d => { await p.evaluate((l) => { const J = window.__jwLab; J.freeze(false); J.warp(l, { x: 4500 }); J.freeze(true); }, G - d); await sleep(d === 11 ? 1500 : 420); return p.evaluate(() => { const s = window.__jwLab.state(); return { g: s.info.gate, kid: s.kidY, y: s.y }; }); };
      let q = await at(11); ok(!q.g, `${IDS[k]} (${look}): 11 lanes out: no sign yet`);
      q = await at(9); ok(q.g && q.g.a > 0.9 && q.g.y > 0.24, `${IDS[k]} (${look}): 9 lanes out the gate's sign is UP — whole, crisp, under the band (${q.g ? `opacity ${q.g.a.toFixed(2)}, its foot ${q.g.y.toFixed(2)} down the screen` : 'no sign'})`);
      await shot(p, `gates/${look}-${k + 1}-${IDS[k]}-a-9-lanes-out.png`);
      q = await at(7);
      ok(q.g && q.g.on && q.g.a > 0.9 && q.g.y > 0.24 && q.g.y < q.kid - 0.2, `${IDS[k]} (${look}): 7 lanes out the gate's sign is up, whole, under the band + well above him (${q.g ? `opacity ${q.g.a.toFixed(2)}, its foot ${q.g.y.toFixed(2)} down the screen` : 'no sign'} · the kid ${q.kid.toFixed(2)})`);
      await shot(p, `gates/${look}-${k + 1}-${IDS[k]}-b-7-lanes-out.png`);
      q = await at(5); ok(q.g && q.g.a > 0.9, `${IDS[k]} (${look}): 5 lanes out it still reads (${q.g ? q.g.a.toFixed(2) : '—'})`);
      if (k === 0 || k === 4 || k === 6) await shot(p, `gates/${look}-${k + 1}-${IDS[k]}-c-5-lanes-out.png`);
      q = await at(4); ok(q.g && q.g.a > 0.3 && q.g.a < 0.9, `${IDS[k]} (${look}): 4 lanes out it is FADING (${q.g ? q.g.a.toFixed(2) : '—'})`);
      q = await at(3); ok(!q.g, `${IDS[k]} (${look}): 3 lanes from the gate the sign is FULLY GONE`);
      await shot(p, `gates/${look}-${k + 1}-${IDS[k]}-d-3-lanes-out.png`);
      q = await at(1); ok(!q.g, `${IDS[k]} (${look}): … and stays gone as he comes up to it`);
      q = await at(0); ok(!q.g, `${IDS[k]} (${look}): in the gate: no sign over the lanes ahead`);
      await shot(p, `gates/${look}-${k + 1}-${IDS[k]}-e-in-the-gate.png`);
      q = await at(-2); ok(!q.g, `${IDS[k]} (${look}): through it: nothing`);
    }
    await L('window.__jwLab.freeze(false)');
  }

  // ---- THE MATCH CHIPS (the look only: the game's own markup + css over the lab's scene — the real view's are shot by e2e-jaywalk-match):
  // 4 + 8 players in THE BRIDGE, THE LIGHTHOUSE (the landmark painted on the band's LEFT) + THE DOCKS, day + night
  if (all || what === 'chips') {
    const NAMES = ['BEN', 'CHARLOTTE', 'MAX', 'ALEXANDER', 'ZOE', 'GRANDPA JOE', 'SAM', 'OLIVIA'], HEX = ['#00f0ff', '#ff2bd6', '#f3ff3a', '#3dff8b', '#ff8c1a', '#a66bff', '#ff3355', '#3d7bff'];
    const chips = (n, base) => p.evaluate((n, base, NAMES, HEX) => {
      document.querySelector('.jw-order')?.remove();
      if (!n) return null;
      const ol = document.createElement('ol'); ol.className = 'jw-order';
      for (let i = 0; i < n; i++) { const li = document.createElement('li'); li.className = [i === 1 ? 'is-me' : '', i >= n - (n > 4 ? 3 : 1) ? 'is-out' : ''].filter(Boolean).join(' '); li.style.setProperty('--c', HEX[i]); li.innerHTML = `<i class="jw-order-dot" aria-hidden="true"></i><span class="jw-order-n"></span><b></b>${li.className.includes('is-out') ? '<span class="jw-order-out">OUT</span>' : ''}`; li.children[1].textContent = NAMES[i]; li.children[2].textContent = String(base - i * 7 - (i > 4 ? 40 : 0)); ol.append(li); }
      document.querySelector('.jw-stage').append(ol);
      const r = ol.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.left - document.querySelector('.jw-stage').getBoundingClientRect().left, y: r.top, row: ol.firstChild.getBoundingClientRect().height, font: parseFloat(getComputedStyle(ol.firstChild).fontSize) };
    }, n, base, NAMES, HEX);
    for (const look of ['night', 'day']) {
      await fresh(look); await sleep(400);
      await L("document.querySelector('.jw-snd')?.style.setProperty('visibility', 'hidden'); document.querySelector('.jw-seed')?.style.setProperty('visibility', 'hidden')");
      for (const [k, lane] of [[3, 222], [6, 372], [0, 72]]) {
        await stand(lane, 4); await sleep(700); await settled(); await sleep(400);
        for (const n of [4, 8]) {
          const r = await chips(n, lane + 2);
          ok(r.w <= 92 && r.row <= 13.5 && r.h <= n * 14 && r.x <= 1, `${IDS[k]} (${look}), ${n} players: the chips are COMPACT (${r.w.toFixed(0)} × ${r.h.toFixed(0)} px — a row ${r.row.toFixed(1)} px, ${r.font} px letters)`);
          await top(`chips/${look}-${IDS[k]}-${n}-players-top.png`);
        }
      }
      await chips(0);
      await L("document.querySelector('.jw-snd')?.style.removeProperty('visibility'); document.querySelector('.jw-seed')?.style.removeProperty('visibility')");
    }
  }

  // ---- THE LAB LINK: /jaywalk-lab?lane=N — a look check from lane N: WARPED, never counts, never a replay; ZERO server calls
  if (all || what === 'lane') {
    const o = await open(390, 844, 3, '&seed=look3&lane=395&look=night'); await up(o.p); await sleep(900);
    const J = js => o.p.evaluate(js);
    let s0 = await J('({ ...window.__jwLab.state(), warped: window.__jwLab.warped(), lane0: window.__jwLab.lane0(), type: window.__jwLab.lane(window.__jwLab.state().y).type, mark: document.querySelector(".jw-mark").textContent })');
    ok(s0.lane0 === 395 && s0.y > 385 && s0.y <= 395 && s0.type === 'grass' && s0.best === s0.y, `?lane=395: the kid stands on the grass lane nearest 395 (lane ${s0.y}), the count says ${s0.best}`);
    ok(s0.warped && !s0.started && s0.t === 0, 'it is a LOOK CHECK: WARPED from its first frame; the world waits for the first touch');
    ok(/^LOOK CHECK · LANE \d+ · TAP TO HOP$/.test(s0.mark), `the page says so (${s0.mark})`);
    await sleep(700); await shot(o.p, 'lane/lane-395-night.png');
    const g = await J('window.__jwLab.state().info.gate');
    ok(g && g.text === 'THE AIRFIELD' && g.a > 0.9, `a few lanes before THE AIRFIELD's gate: its sign is up (${g && g.text})`);
    await J('window.__jwLab.bot(true)');
    await waitFor(o.p, 'window.__jwLab.ends.length > 0', 240000);
    const e = await J('({ e: window.__jwLab.ends[0], check: document.querySelector(".jw-check").textContent, cls: document.querySelector(".jw-check").className })');
    ok(/^WARPED \(a look check\) — no replay$/.test(e.check) && !/is-ok|is-bad/.test(e.cls), `its end says WARPED — never REPLAY = LIVE (${e.check}; lane ${e.e && e.e.live.lanes})`);
    await J('window.__jwLab.bot(false)'); await sleep(900);
    s0 = await J('({ ...window.__jwLab.state(), warped: window.__jwLab.warped() })');
    ok(o.reqs.every(u => !/\/api\/|firebaseio|googleapis\.com\/identitytoolkit|:9000|:9099/.test(u)), 'ZERO server calls: nothing is sent, nothing counts');
    await o.close();
    const o2 = await open(390, 844, 3, '&seed=look3&lane=abc'); await up(o2.p); await sleep(500);
    const s2 = await o2.p.evaluate(() => ({ y: window.__jwLab.state().y, lane0: window.__jwLab.lane0(), warped: window.__jwLab.warped() }));
    ok(s2.lane0 === 0 && s2.y === 0 && !s2.warped, 'a link without a real number is the ordinary lab (lane 0, a real run)');
    // ONE COUNTDOWN: the lab's quiet mode clock never says THE MOTHERSHIP
    await o2.p.evaluate(() => { window.__jwLab.restart('match', 'look3'); window.__jwLab.hop('u'); }); await sleep(500);
    const sub = await o2.p.evaluate(() => document.querySelector('.jw-sub').textContent);
    ok(/^MATCH · \d:\d\d$/.test(sub), `the lab's small line is the mode's quiet clock (${sub}) — never a second MOTHERSHIP countdown`);
    await o2.close();
  }

  // ---- DOWNTOWN's EDGE SHOPS: Kenney's storefronts, fetched ON DEMAND (never at the lab's start), lit by night
  if (all || what === 'shops') {
    ok(!reqs.some(u => /shops\.js|shop-[a-d]\.glb/.test(u)) || what !== 'shops', 'ON DEMAND: the shops\' module + models are not fetched at the lab\'s start');
    for (const look of ['night', 'day']) {
      await fresh(look); await sleep(400);
      let n = 0;
      for (const [lane, col] of [[252, 0], [262, 8], [272, 0], [284, 8]]) {
        const y = await stand(lane, col); await sleep(1500);
        await waitFor(p, 'window.__jwLab.state().info.shops === 4', 15000);
        await sleep(500); await shot(p, `shops/${look}-downtown-lane-${y}-${col ? 'right' : 'left'}-edge.png`); n++;
      }
      const i = await p.evaluate(() => window.__jwLab.state().info);
      ok(i.shops === 4 && reqs.filter(u => /shop-[a-d]\.glb/.test(u)).length >= 4, `DOWNTOWN (${look}): the four storefront models are in (${i.shops}), fetched as the area came up`);
    }
  }

  // ---- THE TAIL LIGHTS (the 6:32 am add-on — "more uniform instead of one light"): a light bar across each vehicle's rear + ONE centred
  // glow — a car, a van, a truck going EACH way + a busy road (night), the busy road by day (no glow) → taillights/
  if (all || what === 'tail') {
    for (const [veh, name] of [['sedan', 'a-car'], ['van', 'a-van'], ['truck', 'a-truck']]) for (const dir of [1, -1]) {
      let from = 12, done = false;
      for (let tries = 0; tries < 6 && !done; tries++) {
        await fresh('night'); await sleep(300);   // (each its own fresh run: nothing catches a standing kid mid-shot)
        const at = await p.evaluate((w, d, f) => { const J = window.__jwLab; for (let i = f; i < f + 320; i++) if (J.find('road', i) === i && J.find('grass', i - 1) === i - 1 && !J.ufoAt(i - 1) && J.lane(i).dir === d && J.items(i).items.some(q => q.what === w)) return i; return -1; }, veh, dir, from);
        if (at < 0) break;
        from = at + 1;
        await p.evaluate(l => window.__jwLab.warp(l - 1, { x: 4500 }), at);
        await waitFor(p, `window.__jwLab.state().over || window.__jwLab.items(${at}).items.some(q => q.what === '${veh}' && q.left > 2.2 && q.left + q.len < 6.8)`, 30000);
        if (await p.evaluate(() => window.__jwLab.state().over)) continue;
        await sleep(120); await shot(p, `taillights/night-${name}-going-${dir > 0 ? 'right' : 'left'}.png`); done = true;
      }
      ok(done, `THE TAIL LIGHTS: ${name.slice(2)} going ${dir > 0 ? 'right' : 'left'} — shot`);
    }
    await fresh('night'); await sleep(300); await stand(262, 4); await sleep(1500); await shot(p, 'taillights/night-a-busy-road.png');
    await L("window.__jwLab.setLook('day')"); await sleep(1900); await shot(p, 'taillights/day-a-busy-road.png'); await L("window.__jwLab.setLook('night')");
  }

  // ---- THE CREDITS: JAYWALK's own group in the site's Credits sheet (☰ → Credits) — every sound + model + the art created with Grok
  if (all || what === 'credits') {
    const o = await open(390, 844, 3, '&seed=look3');
    await o.p.goto(`${new URL(o.p.url()).origin}/?emu`, { waitUntil: 'load' });
    await waitFor(o.p, "!!document.querySelector('#app') && !document.querySelector('#boot:not([hidden])') || document.readyState === 'complete'", 20000); await sleep(2500);
    const r = await o.p.evaluate(async () => {
      const m = await import('/js/ui/credits.js'); m.openCredits();
      await new Promise(q => setTimeout(q, 600));
      const g = [...document.querySelectorAll('.cr-group')].find(x => x.querySelector('.cr-head').textContent === 'JAYWALK');
      if (!g) return null;
      g.scrollIntoView({ block: 'start' });
      const rows = m.CREDITS.filter(c => c.group === 'JAYWALK');
      return { n: g.querySelectorAll('.cr-item').length, rows: rows.length, by: rows.map(c => c.by).join(' ¦ '), h: g.getBoundingClientRect().height };
    });
    ok(r && r.n === r.rows && r.n >= 12, `the Credits sheet has JAYWALK's own group (${r && r.n} lines)`);
    for (const need of ['"Fantasy Achievement Unlock Magical Stinger" by TommasoMotteran', 'Licensed under CC BY 4.0', '"Neon ON OFF" by SkyernAklea', '"Railroad Crossing Bell" by Brylon Terry (SoundBible.com), CC BY 3.0', '"Train Diesel Double Horn from Class 142 with Reverb" by AMBIOSIS (Freesound), CC BY 4.0', '"Train Passing A" by InspectorJ', 'by Kiiba (https://sketchfab.com/Kiiba), licensed under CC-BY-4.0', 'Poly by Google', 'Skyline art created with Grok', 'Card art created with Grok', 'City Kit (Commercial)'])
      ok(r && r.by.includes(need), `… with: ${need}`);
    await sleep(400); await shot(o.p, 'credits/credits-jaywalk-1.png');
    await o.p.evaluate(() => { const g = [...document.querySelectorAll('.cr-group')].find(x => x.querySelector('.cr-head').textContent === 'JAYWALK'), it = g.querySelectorAll('.cr-item'); it[Math.min(it.length - 1, 6)].scrollIntoView({ block: 'start' }); });
    await sleep(400); await shot(o.p, 'credits/credits-jaywalk-2.png');
    await o.p.evaluate(() => { const g = [...document.querySelectorAll('.cr-group')].find(x => x.querySelector('.cr-head').textContent === 'JAYWALK'), it = g.querySelectorAll('.cr-item'); it[it.length - 1].scrollIntoView({ block: 'end' }); });
    await sleep(400); await shot(o.p, 'credits/credits-jaywalk-3.png');
    await o.close();
  }
}
