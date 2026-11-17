// JAYWALK H6B — THE FINAL POLISH's look checks (tests/integration/jaywalk-lab.mjs `--h6b[=sky|gates|ufo|jet|ship|shops|lane|perf]`): the
// lab (the pure engine in the tab — no server) driven to each thing, DAY + NIGHT, at 390 × 844 @3 → the shots (<group>/…) + what must
// hold: THE PAINTED NIGHT SKYLINES (one a area, cross-faded at a gate, ≤ 2 held, the lights a landmark covers OFF), THE LOOK SWITCH (a
// cross-fade, never a jump), THE GATE SIGN (only on the approach — gone 3 lanes out), THE UFO (solid, high, into the hatch), THE
// BLACKBIRD (bigger), ONE Mothership countdown, the lab's ?lane=N.
const IDS = ['docks', 'fish-market', 'rail-yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'], SKY = ['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'];
export async function looksH6B(p, { ok, shot, sleep, waitFor, what = '', reqs = [], top }) {
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
}
