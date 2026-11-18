// JAYWALK THE TOUCH-UP PASS — the lab's looks for this pass (`jaywalk-lab.mjs --touchup[=probe|kid|words]`; the shots → kid/ · probe/ · words/)
//   probe: every cause's end BY NIGHT + BY DAY, the game's own frame grab (night.js#snap) at a row of moments after the hit → one contact
//          sheet a cause (probe/<look>-<cause>.png) — how the frame's moment per cause (shot.js#SHOT_AT) was chosen
//   kid:   THE SHARE PICTURE SHOWS THE KID — every cause's end, its frame taken at shot.js#shotMs (the moment view.js takes it), on the game's own
//          card (share.js#drawRunMiddle on kit/share-run.js#drawRunCard) at 1080 × 1350 + 540 × 675 + the link preview (two a row on a 390 pt
//          phone) + a check: the kid is IN the picture (his screen point inside the frame the card shows)
//   words: THE PINK WORDS OVER THE PLAY — a friend's line + the ghosts' name tags over a yellow taxi, by day + by night
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const CAUSES = ['car', 'car-far', 'train', 'water', 'wall', 'blackbird', 'ufo', 'ship'];   // (car-far: a fast lane far up the course)

/** drive the lab's run to this cause's end; resolves true once the run is over (taken, for the ship) */
async function endBy(p, what, look, { sleep, waitFor }) {
  const L = js => p.evaluate(js);
  const fresh = (mode = 'solo') => L(`(() => { const J = window.__jwLab; J.freeze(false); J.ghosts(0); J.bot(false); J.restart('${mode}', 'look3'); J.setCamera(8, 'straight', true); J.setLook('${look}'); J.hop('u'); })()`);
  const isEnd = c => `window.__jwLab.state().over && window.__jwLab.state().cause === '${c}'`;
  if (what === 'ship') {
    await fresh('match'); await sleep(500);
    await L('window.__jwLab.warp(3, { x: 4500 })');
    await waitFor(p, "(window.__jwLab.view.info().fly || {}).ship === true", 20000); await sleep(400);
    await L('window.__jwLab.setT(6 * 60 * 60 - 150)');
    return waitFor(p, "window.__jwLab.state().st === 'taken'", 8000);
  }
  if (what === 'ufo') {
    // (straight into the ring — a run that met anything else first is begun again: one run, one end)
    for (let tries = 0; tries < 8; tries++) {
      await fresh(); await sleep(500 + tries * 500);
      const y0 = await L("window.__jwLab.find('ufo', 100)"), U = await p.evaluate(l => window.__jwLab.ufoAt(l), y0);
      await p.evaluate(u => { const J = window.__jwLab; J.warp(Math.floor(u.y), { x: Math.max(600, Math.min(8400, u.x)) }); }, U);
      if (await waitFor(p, "window.__jwLab.state().over", 1500) && await L("window.__jwLab.state().cause === 'ufo'")) return true;
    }
    return false;
  }
  if (what === 'blackbird') {
    await fresh(); await sleep(500);
    const F = await L('window.__jwLab.flight(150)');
    await p.evaluate(l => { const J = window.__jwLab; for (let d = 2; d < 9; d++) if (J.find('grass', l - d) === l - d) { J.warp(l - d, { x: 4500 }); return; } J.warp(l - 2, { x: 4500 }); }, F.lane);
    await waitFor(p, "(window.__jwLab.view.info().fly || { models: [] }).models.includes('blackbird')", 20000); await sleep(600);
    await p.evaluate(ff => { const J = window.__jwLab, t = J.state().t, k = Math.floor((t - ff.phase) / ff.period) + 2; J.warp(ff.lane, { x: 4500 }); J.setT(ff.phase + k * ff.period - 3); J.freeze(false); }, F);
    return waitFor(p, isEnd('blackbird'), 6000);
  }
  await fresh(); await sleep(900);
  if (what === 'train') {
    const i = await L("window.__jwLab.find('rail', 25)");
    await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
    return waitFor(p, isEnd('train'), 25000);
  }
  if (what === 'car' || what === 'car-far') {
    // (a car the kid stands in the path of — the lab's first road lane far enough up (or far up the course: a fast lane); any vehicle)
    const i = await L(`window.__jwLab.find('road', ${what === 'car' ? 24 : 330})`);
    await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
    return waitFor(p, isEnd('car'), 25000);   // (car-far ends by 'car' too)
  }
  if (what === 'water') {
    const i = await p.evaluate(() => { const J = window.__jwLab; for (let l = 24; l < 400; l++) if (J.lane(l).type === 'water' && J.lane(l - 1).type === 'grass') return l; return J.find('water', 24); });
    await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
    return waitFor(p, isEnd('water'), 25000);
  }
  const i = await L("window.__jwLab.find('grass', 30)");          // (the wall: stand still on grass until the dark comes)
  await p.evaluate(l => window.__jwLab.warp(l, { safe: false }), i);
  return waitFor(p, isEnd('wall'), 60000);
}

/** in the page, BEFORE the end is driven: watch every frame for THIS cause's end (a run seen going first — the last one's end is not it),
 *  then grab the scene (the game's own snap) at each of `ms` after that frame ('shot' = shot.js#shotMs, as view.js takes it) → window.__tuGrab */
const arm = (p, want, ms, w) => p.evaluate((wnt, list, W) => {
  window.__tuGrab = new Promise(res => {
    const J = window.__jwLab, v = J.view, out = [];
    let fresh = false, t0 = 0, k = 0, at = list;
    const step = async () => {
      const s = J.state();
      if (!t0) {
        if (!s.over) fresh = true;
        else if (fresh && (wnt === 'ship' ? s.st === 'taken' : s.cause === wnt.replace('-far', ''))) {
          t0 = performance.now();
          if (list === 'shot') { const H = await import('/js/games/jaywalk/shot.js'), R = J.raw(); at = [H.shotMs(R.run, R.course)]; }
        }
      }
      if (t0 && k < at.length && performance.now() - t0 >= at[k] - 8) {
        const a = at[k++];
        v.snap(cv => {
          if (!cv) { out.push(null); return; }
          out.push({ at: a, ms: Math.round(performance.now() - t0), kidX: v.kidScreenX(), kidY: (v.kidScreenY() * cv.full - cv.top) / cv.height, canvas: cv });
        }, W, W);
      }
      if (t0 && out.length >= at.length) { window.__tuOut = out; res(out.map(o => o && { at: o.at, ms: o.ms, kidX: o.kidX, kidY: o.kidY })); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, want, ms, w);
const grabbed = p => p.evaluate(() => window.__tuGrab);

/** PROBE: a contact sheet a cause — the frame at each moment, its ms under it */
export async function looksProbe(p, { ok, sleep, waitFor, OUT, only }) {
  const MS = [20, 50, 80, 120, 180, 260, 460, 700, 1000, 1300];
  for (const look of ['night', 'day']) for (const what of CAUSES) {
    if (only && !only.includes(what)) continue;
    await arm(p, what, what === 'ship' ? [300, 600, 900, 1200, 1500, 1800, 2200, 2600, 3000, 3500] : MS, 360);
    const end = await endBy(p, what, look, { sleep, waitFor });
    ok(end, `${look}: the run ended by ${what}`);
    if (!end) continue;
    await grabbed(p);
    if (!OUT) continue;
    const sheet = await p.evaluate(async title => {
      const r = window.__tuOut;
      const W = 360, cv = document.createElement('canvas'); cv.width = W * 5; cv.height = (W + 30) * 2 + 30; const c = cv.getContext('2d');
      c.fillStyle = '#111'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#fff'; c.font = '700 22px sans-serif'; c.fillText(title, 10, 22);
      for (let i = 0; i < r.length; i++) {
        if (!r[i]) continue;
        const x = (i % 5) * W, y = 30 + Math.floor(i / 5) * (W + 30);
        c.drawImage(r[i].canvas, x, y, W, W);
        c.strokeStyle = '#f0f'; c.lineWidth = 2; c.beginPath(); c.arc(x + r[i].kidX * W, y + r[i].kidY * W, 12, 0, 7); c.stroke();
        c.fillStyle = '#fff'; c.fillText(`${r[i].at} ms (${r[i].ms})`, x + 8, y + W + 22);
      }
      for (const o of r) if (o) { o.canvas.width = 0; o.canvas.height = 0; }
      return cv.toDataURL('image/png');
    }, `${look} · ${what}`);
    mkdirSync(join(OUT, 'probe'), { recursive: true });
    writeFileSync(join(OUT, 'probe', `${look}-${what}.png`), Buffer.from(sheet.split(',')[1], 'base64'));
  }
}

/** KID: every cause's card, its frame at shot.js#shotMs — the moment view.js takes it */
export async function looksKid(p, { ok, sleep, waitFor, OUT, only }) {
  const cards = [];
  for (const look of ['night', 'day']) for (const what of CAUSES) {
    if (only && !only.includes(what)) continue;
    await arm(p, what, 'shot', 1080);
    const end = await endBy(p, what, look, { sleep, waitFor });
    if (!end) { ok(false, `${look}: the run ended by ${what}`); continue; }
    const [g] = await grabbed(p);
    const r = await p.evaluate(async () => {
      const J = window.__jwLab, G = window.__tuOut[0], cv = G && G.canvas, wait = G && G.at;
      const [S, K] = await Promise.all([import('/js/games/jaywalk/share.js'), import('/js/games/kit/share-run.js')]);
      await Promise.all(['900 66px Orbitron', '700 64px "Chakra Petch"'].map(f => document.fonts.load(f)));
      await new Promise(res => { const f = () => (J.state().shown ? res() : setTimeout(f, 50)); setTimeout(f, 0); setTimeout(res, 7000); });   // (this run's own words)
      const s = J.state();
      const kidY = G ? G.kidY : 0, kidX = G ? G.kidX : 0;
      const shot = cv ? { canvas: cv, line: s.line, lanes: s.best, kidY, kidX } : null;
      const card = K.drawRunCard({ ...S.jwRunCard({ mode: s.mode === 'match' ? 'match' : 'solo', results: { u: { l: Math.max(1, s.best) } } }, { uid: 'u', name: 'BEN' }), line: s.line }, (c, box, k) => S.drawRunMiddle(c, box, k, shot), S.JW_CARD);
      const half = document.createElement('canvas'); half.width = 540; half.height = 675; half.getContext('2d').drawImage(card, 0, 0, 540, 675);
      window.__tuCards = (window.__tuCards || []).concat([card]);
      return { wait, line: s.line, kidX, kidY, shot: !!shot, full: card.toDataURL('image/png'), half: half.toDataURL('image/png') };
    });
    const inFrame = r.kidX > 0.04 && r.kidX < 0.96 && r.kidY > 0.04 && r.kidY < 0.96;
    ok(r.shot && inFrame, `THE SHARE PICTURE SHOWS THE KID — ${look}, ${what} → "${r.line}": the frame at ${r.wait} ms (taken ${g && g.ms}), the kid at (${r.kidX.toFixed(2)}, ${r.kidY.toFixed(2)}) inside the picture`);
    if (OUT) {
      mkdirSync(join(OUT, 'kid'), { recursive: true });
      writeFileSync(join(OUT, 'kid', `${look}-${what}-1080x1350.png`), Buffer.from(r.full.split(',')[1], 'base64'));
      writeFileSync(join(OUT, 'kid', `${look}-${what}-540x675.png`), Buffer.from(r.half.split(',')[1], 'base64'));
    }
    cards.push(`${look} · ${what} · ${r.line}`);
  }
  // THE LINK PREVIEW: the cards as a chat shows them (≈ 176 pt wide on a 390 pt phone — two a row), one sheet a look
  if (OUT) for (const [k, look] of [[0, 'night'], [1, 'day']]) {
    const n = (only || CAUSES).length;
    await p.evaluate((a, b) => {
      const o = document.createElement('div'); o.id = 'pcards';
      o.style.cssText = 'position:fixed;inset:0;z-index:99;background:#0b0716;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px;align-content:start;justify-items:center';
      for (const cv of window.__tuCards.slice(a, b)) { const c = cv.cloneNode(); c.getContext('2d').drawImage(cv, 0, 0); c.style.cssText = 'width:150px;height:187px;border-radius:12px'; o.append(c); }
      document.body.append(o);
    }, k * n, (k + 1) * n);
    await sleep(300); await p.screenshot({ path: join(OUT, 'kid', `preview-${look}-390x844.png`) });
    await p.evaluate(() => document.getElementById('pcards').remove());
  }
  await p.evaluate(() => { window.__tuCards = []; });
  return cards;
}
