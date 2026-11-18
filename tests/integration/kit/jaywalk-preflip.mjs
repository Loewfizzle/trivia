// JAYWALK — BEFORE THE FLIP's look checks (tests/integration/jaywalk-lab.mjs `--preflip`): THE AREA ARRIVAL on the lab (the same night.js +
// the same banner module the game draws — arrival.js), at 390 × 844 @3, ZOOM 8 · STRAIGHT (the pinned camera), DAY + NIGHT, three areas
// (THE DOCKS · THE RAIL YARD · DOWNTOWN): the GATE SIGN 8 + 5 lanes out (up, whole, under the band, above the kid) · THE ARRIVAL BANNER at
// the crossing (the area's name + LANE n, at the top: under the lane count, its foot above the far haze's — never over a lane). The
// lab's own tool bars are hidden for the shots (the game has none). The shots → arrival/.
const AREAS = [[0, 'docks', 'THE DOCKS'], [2, 'rail-yard', 'THE RAIL YARD'], [4, 'downtown', 'DOWNTOWN']];
export async function looksPreflip(p, { ok, shot, sleep, waitFor }) {
  const L = js => p.evaluate(js);
  await L("for (const e of document.querySelector('.jw-stage').children) if (!e.matches('.jw-play, .jw-hud, .jw-arrive, .jw-blackout')) e.style.visibility = 'hidden'");
  let lookNow = '';
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
