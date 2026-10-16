// NEON PAR end to end: N players in separate browser contexts (default 4; N=8 for the big run).
//   node e2e-golf.mjs "<browser path>" ./shots
// Env: N=8 · MODE=full|quick6|quick3 · HOLES=9 (stop after this many holes) · SHOTS=0 (no screenshots)
// Covers: lobby card + ball picker + host options, zone card / flyover / par card, a real slingshot drag (pointer
// events) + putt + cancel, in-page bots that aim with the physics engine (with per-player error), ghosts
// (smoothness sampled across all players), an ACE (cinematic on every phone), a refresh mid-roll (the exact
// shot is re-simulated), the host's phone dying mid-hole (migration) and rejoining (ball + strokes restored),
// power-ups (arm from the HUD / use), sabotage (sheet → alert + effect on the target → expiry), the 30 s
// countdown, scorecards, final podium, game-night points, rematch, renderer memory across every hole, frame
// pacing on a 4× CPU "mid-range phone". Screenshots of every new screen at 390×844 and 412×915.
// Pages render at 1× DPR between screenshots (software WebGL in headless Chrome/Edge is slow at 2×).
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 4);
const MODE = process.env.MODE || 'full';
const HOLES = Number(process.env.HOLES || 99);
const SHOTS = process.env.SHOTS !== '0';
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
// bot skill: aim error (radians, ~1σ) — ALICE is a machine, the rest are human-ish
const NOISE = [0.004, 0.035, 0.06, 0.045, 0.08, 0.05, 0.07, 0.04];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const report = { holes: [], memory: [], ghosts: null, perf: null, refresh: null, migration: null, sabotage: null, power: null, countdown: null, ace: null };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };
const SMALL = { width: 260, height: 560, deviceScaleFactor: 1, isMobile: true, hasTouch: true }; // bots nobody watches

// GPU=1: use the machine's GPU (frame-pacing numbers); default: software WebGL (works everywhere, slow)
const GPU = !!process.env.GPU;
const PERF_HOLE = Number(process.env.PERF_HOLE ?? 6);
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=user-gesture-required', '--mute-audio', '--ignore-gpu-blocklist',
  ...(GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])] });
const pages = [];
const ctxs = [];
const dead = new Set();

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message, String(e.stack || '').split(String.fromCharCode(10)).slice(1, 4).join(' | ')); });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(i === 1 ? VIEW : SMALL);
  await page.goto(`${BASE}/?emu&slot=g${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  if (!SHOTS) return;
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(500);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(page === pages[1] ? VIEW : SMALL);
  await sleep(150);
}
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (await evalIn(page, fn, arg)) return; } catch { /* page busy */ }
    await sleep(150);
  }
  fail(`timeout: ${what}`);
}
const G = (page, expr) => page.evaluate(`(() => { const G = window.__golf; return G ? (${expr}) : null; })()`);
async function waitG(page, expr, what, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try { if (await G(page, expr)) return true; } catch { /* busy */ }
    await sleep(120);
  }
  fail(`timeout: ${what}`);
}
const click = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) throw new Error('no ' + s); el.click(); }, sel);
const tapReal = async (page, sel) => { const el = await page.waitForSelector(sel, { timeout: 15000 }); await el.tap(); };
const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
const hostPage = async () => {
  for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return pages[i]; } catch { /* */ } }
  return pages[alive()[0]];
};
const holePhase = page => evalIn(page, s => s.game && { hi: s.game.hi, phase: s.game.phase });

async function ready(page) {
  await waitG(page, 'G.state() && G.state().hi != null && (G.state().status === "aim" || G.state().status === "done")', 'ready to putt', 60000);
  await G(page, 'G.skipIntro()');
  // an ACE replay on screen blocks putting (as on a phone): wait it out
  await waitG(page, '!G.state().ace && !G.state().intro', 'no cinematic', 20000);
}
/** One bot putt: aims with the physics engine (plus this player's aim error). */
async function botPutt(i, extra = {}) {
  const page = pages[i];
  await ready(page);
  if (await G(page, 'G.state().status === "done"')) return 'done';
  return G(page, `G.autoShot(${JSON.stringify({ noise: NOISE[i % NOISE.length], pnoise: NOISE[i % NOISE.length] * 0.8, angStep: 5, powStep: 0.07, lead: 4, ...extra })})`);
}
async function botHole(i, hi, { maxPutts = 6 } = {}) {
  for (let k = 0; k < maxPutts + 2; k++) {
    if (dead.has(i)) return;
    const page = pages[i];
    const ph = await holePhase(page).catch(() => null);
    if (!ph || ph.phase !== 'play' || ph.hi !== hi) return;
    const r = await botPutt(i).catch(e => { if (!dead.has(i)) throw e; });
    if (r === 'done' || dead.has(i)) return;
    if (!r) { k--; await sleep(300); continue; } // couldn't putt right now (cinematic / phase change)
    await waitG(page, 'G.state() && G.state().status !== "roll" && G.state().status !== "fall"', 'ball at rest', 60000);
    if (await G(page, 'G.state().status === "done"')) return;
  }
}

try {
  // ---------------- lobby
  const first = await openPlayer(0);
  await first.waitForSelector('.title-actions .btn-primary', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await first.$('.setup-screen input.input')); k++) {
    await tapReal(first, '.title-actions .btn-primary').catch(() => {});
    await first.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await first.type('.setup-screen input.input', NAMES[0]);
  await tapReal(first, '.form-cta .btn-primary');
  await first.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  const code = await evalIn(first, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.invite-card', { timeout: 20000 });
    await tapReal(p, '.invite-card');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await tapReal(p, '.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  }
  await waitFor(first, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  log(`${N} players in the lobby`);
  const uids = [];
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);
  await first.evaluate(() => document.querySelector('.game-card[data-theme="golf"]').scrollIntoView({ block: 'center' }));
  await sleep(500);
  await shotBoth(first, 'g-01-lobby-card');
  // ball picker from the lobby (BOB: pink chrome sparks)
  await click(pages[1], '.gc-ball');
  await pages[1].waitForSelector('.gb-sheet', { timeout: 5000 });
  await sleep(450);
  await click(pages[1], '.gb-color[data-v="#ff4fa3"]');
  await click(pages[1], '.gb-opts .gb-opt[data-v="chrome"]');
  await click(pages[1], '.gb-opts .gb-opt[data-v="sparks"]');
  await sleep(250);
  await shotBoth(pages[1], 'g-02-ball-picker');
  await click(pages[1], '.gb-sheet .btn-primary');
  ok(await pages[1].evaluate(() => JSON.parse(localStorage.getItem('na:golfball')).f === 'chrome'), 'ball style saved on the device');
  const looks = [['#2ff5d2', 'neon', 'ribbon'], null, ['#ffb627', 'glass', 'pixels'], ['#a374ff', 'neon', 'sparks'], ['#36e6ff', 'chrome', 'ribbon'], ['#ff5a4f', 'neon', 'pixels'], ['#c8ff4f', 'glass', 'ribbon'], ['#f4f4ff', 'chrome', 'sparks']];
  for (let i = 0; i < N; i++) if (looks[i]) await pages[i].evaluate(l => localStorage.setItem('na:golfball', JSON.stringify({ c: l[0], f: l[1], t: l[2] })), looks[i]);
  await click(first, '.game-card[data-theme="golf"]');
  await first.waitForSelector('.modal .opt-list .opt-row', { timeout: 10000 });
  await sleep(400);
  await click(first, `.opt-row[data-v="${MODE}"]`);
  await shotBoth(first, 'g-03-options');
  await pages[1].evaluate(() => { window.__golfHoldIntro = true; });
  await click(first, '.modal .btn-primary.btn-xl');
  await waitFor(first, s => s.game && s.game.id === 'golf' && s.game.phase === 'play', 'golf play phase', 20000);
  const holes = await evalIn(first, s => s.game.holes);
  log('match started; holes', JSON.stringify(holes));

  // ---------------- hole 1 intro: zone card → flyover + par card
  await pages[1].waitForSelector('.gp-zone', { timeout: 40000 });
  log('· ' + "await pages[1].waitForSelector('.gp-zone");
  await sleep(1500);
  await shotBoth(pages[1], 'g-04-zone-card');
  await pages[1].evaluate(() => { window.__golfHoldIntro = 'fly'; });
  await pages[1].waitForSelector('.gp-par', { timeout: 8000 });
  log('· ' + "await pages[1].waitForSelector('.gp-par'");
  await sleep(1500);
  await shotBoth(pages[1], 'g-05-flyover-par');
  await pages[1].evaluate(() => { window.__golfHoldIntro = false; });
  await waitG(pages[1], '!G.state().intro', 'intro over', 15000);
  log('· ' + "await waitG(pages[1], '!G.state().intro'");
  for (const p of pages) await p.waitForFunction('!!window.__golf', { timeout: 40000 });
  log('· ' + 'for (const p of pages) await p.waitForFu');
  await sleep(400);
  await shotBoth(pages[1], 'g-06-tee');
  log('intro done');

  const total = Math.min(HOLES, holes.length);
  for (let hi = 0; hi < total; hi++) {
    let hp = await hostPage();
    await waitFor(hp, (s, h) => s.game && s.game.hi === h && s.game.phase === 'play', `hole ${hi + 1} play`, 90000, hi);
    log(`— hole ${hi + 1} (${holes[hi]})`);
    for (const i of alive()) await ready(pages[i]);
    const bots = new Set(alive());
    if (hi === 0 || hi === 3 || hi === 6) {
      const want = { 0: 'golf-rooftops', 3: 'golf-cyber', 6: 'golf-arcade' }[hi];
      const m = await pages[1].evaluate(() => window.__arcade.musicDebug());
      ok(m.desired === want, `zone music: ${m.desired} (want ${want})`);
    }

    if (hi === 0) {
      // a real slingshot drag on BOB: grab the ball, pull back, screenshot, release
      const b = pages[1];
      await sleep(300);
      const bs = await G(b, 'G.ballScreen()');
      await b.evaluate(([x, y]) => {
        const c = document.querySelector('.gp-canvas');
        const ev = (type, px, py) => c.dispatchEvent(new PointerEvent(type, { clientX: px, clientY: py, pointerId: 7, bubbles: true, cancelable: true, pointerType: 'touch' }));
        ev('pointerdown', x, y);
        for (let k = 1; k <= 8; k++) ev('pointermove', x + k * 3, y + k * 15);
      }, bs);
      await sleep(300);
      await shotBoth(b, 'g-07-aim');
      // (the screenshot resized the page: re-aim from the ball's new screen spot, then release)
      const bs1 = await G(b, 'G.ballScreen()');
      await b.evaluate(([x, y]) => {
        const c = document.querySelector('.gp-canvas');
        c.dispatchEvent(new PointerEvent('pointermove', { clientX: x + 24, clientY: y + 120, pointerId: 7, bubbles: true, pointerType: 'touch' }));
        c.dispatchEvent(new PointerEvent('pointerup', { clientX: x + 24, clientY: y + 120, pointerId: 7, bubbles: true, pointerType: 'touch' }));
      }, bs1);
      await waitG(b, 'G.state().strokes === 1', 'the drag putted', 5000);
      ok(true, 'slingshot drag + release putts');
      await waitG(b, 'G.state().status !== "roll" && G.state().status !== "fall"', 'BOB at rest', 40000);
      if (await G(b, 'G.state().status === "aim"')) {
        const bs2 = await G(b, 'G.ballScreen()');
        await b.evaluate(([x, y]) => {
          const c = document.querySelector('.gp-canvas');
          const ev = (type, px, py) => c.dispatchEvent(new PointerEvent(type, { clientX: px, clientY: py, pointerId: 8, bubbles: true, cancelable: true, pointerType: 'touch' }));
          ev('pointerdown', x, y); ev('pointermove', x + 10, y + 90); ev('pointermove', x + 2, y + 6); ev('pointerup', x + 2, y + 6);
        }, bs2);
        await sleep(200);
        ok(await G(b, 'G.state().strokes === 1'), 'dragging back onto the ball cancels the shot');
      }
      // ALICE goes for the ace (first holing line); everyone sees the cinematic
      await G(pages[0], 'G.autoShot({ firstHole: true })');
      await waitG(pages[0], 'G.state().status !== "roll"', 'ALICE at rest', 40000);
      if (await G(pages[0], 'G.state().score === 1')) {
        const watcher = pages[N > 2 ? 2 : 1];
        const seen = await waitG(watcher, 'G.ace()', 'ace cinematic on another phone', 6000).catch(() => false);
        ok(seen, 'ACE cinematic plays on every phone');
        await sleep(1500);
        await shotBoth(watcher, 'g-09-ace');
        report.ace = { hole: 1, by: 'ALICE' };
      } else log('ALICE missed the ace (fine): strokes', await G(pages[0], 'G.state().strokes'));
    }

    if (hi === 1) {
      // ghosts: sample everyone else's ball on BOB's phone every frame while the others roll
      const b = pages[1];
      await b.evaluate(() => {
        window.__gs = [];
        const t0 = performance.now();
        // 60 Hz probe of the interpolated ghost positions (headless software WebGL renders far below 60 fps)
        const iv = setInterval(() => { const g = window.__golf; if (g) window.__gs.push({ t: performance.now(), g: g.ghostProbe() }); if (performance.now() - t0 > 9000) clearInterval(iv); }, 16);
      });
      const shooters = alive().filter(i => i !== 1 && i !== 2);
      await Promise.all(shooters.map(i => botPutt(i)));
      // refresh mid-roll (CHARLIE): the exact shot is re-simulated after the reload
      if (N >= 3) {
        const c = pages[2];
        while (!(await botPutt(2, { noise: 0.2 }))) await sleep(300);
        const before = await G(c, 'G.state()');
        await sleep(150);
        await waitFor(c, (s, uid) => s.live && s.live.nodes && s.live.nodes[uid] && s.live.nodes[uid].sh && s.live.nodes[uid].s >= 1, 'CHARLIE shot published', 15000, uids[2]);
        const sh = await evalIn(c, (s, uid) => s.live.nodes[uid].sh, uids[2]);
        await c.reload();
        await c.waitForFunction('!!window.__golf && window.__golf.state()', { timeout: 40000 });
        const after = await G(c, 'G.state()');
        await waitG(c, 'G.state().status !== "roll" && G.state().status !== "fall"', 'CHARLIE rest after reload', 40000);
        const end = await G(c, 'G.state()');
        const expect = await c.evaluate(async (sh, hiNum) => {
          const P = await import('/js/games/golf/physics.js');
          const H = await import('/js/games/golf/holes/index.js');
          const s = P.simulate(H.holeByNumber(hiNum), [sh.x, sh.y], sh.a, sh.p, sh.t, sh.pu || null);
          return { x: s.x, y: s.y, holed: s.holed, oob: s.oob };
        }, sh, holes[hi]);
        const same = expect.holed ? end.status === 'done' : expect.oob ? end.strokes === before.strokes + 1 : Math.hypot(end.pos[0] - expect.x, end.pos[1] - expect.y) < 1e-3;
        report.refresh = { before: before.strokes, after: after.strokes, end: end.pos, expect };
        ok(after.strokes === before.strokes, `refresh mid-roll keeps the stroke count (${before.strokes})`);
        ok(same, `refresh mid-roll: the ball ends exactly where the shot goes (${JSON.stringify(end.pos)} vs ${expect.x.toFixed(3)},${expect.y.toFixed(3)})`);
      }
      await sleep(3500);
      const gs = await b.evaluate(() => window.__gs);
      let frames = 0, hitches = 0, maxJump = 0;
      const byUid = {};
      for (const f of gs) for (const g of f.g) (byUid[g.uid] = byUid[g.uid] || []).push({ t: f.t, x: g.x, y: g.y });
      for (const arr of Object.values(byUid)) {
        const steps = [];
        for (let k = 1; k < arr.length; k++) steps.push(Math.hypot(arr[k].x - arr[k - 1].x, arr[k].y - arr[k - 1].y) / Math.max(1, arr[k].t - arr[k - 1].t));
        for (let k = 2; k < steps.length - 2; k++) {
          const win = [steps[k - 2], steps[k - 1], steps[k + 1], steps[k + 2]].sort((a, b) => a - b);
          const med = (win[1] + win[2]) / 2;
          if (med < 0.0005) continue; // at rest
          frames++;
          if (steps[k] > Math.max(0.02, med * 3) || steps[k] < med * 0.05) hitches++;
          maxJump = Math.max(maxJump, steps[k]);
        }
      }
      report.ghosts = { players: Object.keys(byUid).length, samples: gs.length, movingFrames: frames, hitches, maxSpeedUnitsPerMs: +maxJump.toFixed(4) };
      log('ghost smoothness', JSON.stringify(report.ghosts));
      ok(frames > 20 && hitches <= Math.max(2, frames * 0.03), `ghosts move smoothly (${hitches} hitches in ${frames} moving frames)`);
    }

    if (hi === 2 && N >= 3) {
      // the host's phone dies mid-hole; someone else takes over and the hole still finishes; then it comes back
      hp = await hostPage();
      const h0 = pages.indexOf(hp);
      await botPutt(h0, { noise: 0.15 });
      await waitG(hp, 'G.state().status !== "roll" && G.state().status !== "fall"', 'host ball at rest', 40000);
      const before = await G(hp, 'G.state()');
      const oldHost = await evalIn(hp, s => s.uid);
      dead.add(h0);
      await hp.close();
      log(`killed the host (${NAMES[h0]}) mid-hole at strokes ${before.strokes}`);
      const other = pages[alive()[0]];
      await waitFor(other, (s, old) => s.meta.hostId && s.meta.hostId !== old, 'host migrated', 45000, oldHost);
      ok(true, 'host migrated mid-hole');
      const p = await openPlayer(h0);
      dead.delete(h0);
      await p.waitForFunction('!!window.__golf && window.__golf.state()', { timeout: 40000 });
      await sleep(500);
      const back = await G(p, 'G.state()');
      report.migration = { killed: NAMES[h0], before, back };
      ok(back.strokes === before.strokes && (before.status === 'done' || Math.hypot(back.pos[0] - before.pos[0], back.pos[1] - before.pos[1]) < 1e-3), 'rejoin mid-hole restores ball position + strokes');
      await G(p, 'G.skipIntro()');
    }

    // power-ups: BOB arms a magnet through the HUD button (cyber zone)
    if (hi === 3) {
      const b = pages[1];
      await G(b, 'G.givePower("magnet")');
      await sleep(400);
      await click(b, '.gp-pu');
      await sleep(400);
      ok(await G(b, 'G.state().armed'), 'power-up armed from the HUD');
      await shotBoth(b, 'g-10-power-armed');
      bots.delete(1);
      await botPutt(1);
      await sleep(500);
      await shotBoth(b, 'g-11-power-rolling');
      await waitG(b, 'G.state().status !== "roll" && G.state().status !== "fall"', 'magnet shot over', 40000);
      ok(await G(b, 'G.state().used === "magnet" && G.state().pu !== "magnet" || G.state().used === "magnet"'), 'the armed power-up is spent on the shot');
      report.power = { used: 'magnet', result: await G(b, 'G.state()') };
      bots.add(1);
    }

    // sabotage: anyone who earned it hits a player who hasn't putted yet
    if (hi >= 1 && !report.sabotage) {
      for (const i of alive()) {
        if (!(await G(pages[i], 'G.canSabotage()'))) continue;
        const sender = pages[i];
        const targets = [];
        for (const j of alive()) if (j !== i && bots.has(j) && await G(pages[j], 'G.state().status === "aim"')) targets.push(j);
        const tj = targets.find(j => j !== 1) ?? targets[0];
        if (tj == null) break;
        bots.delete(tj);
        await click(sender, '.gp-sab');
        await sender.waitForSelector('.gp-sab-sheet', { timeout: 5000 });
        await sleep(450);
        await click(sender, `.gp-sab-target[data-uid="${uids[tj]}"]`);
        await sleep(200);
        await shotBoth(sender, 'g-12-sabotage-sheet');
        await click(sender, '.gp-sab-kind[data-k="fog"]');
        const hit = await waitG(pages[tj], 'G.sabActive().includes("fog")', 'fog on the target', 6000).catch(() => false);
        ok(hit, `sabotage reaches the target (${NAMES[i]} → ${NAMES[tj]})`);
        await sleep(400);
        await shotBoth(pages[tj], 'g-13-sabotaged');
        ok(!(await G(sender, 'G.canSabotage()')), 'one sabotage per hole');
        await botPutt(tj);
        await waitG(pages[tj], 'G.state().status !== "roll" && G.state().status !== "fall"', 'target shot over', 40000);
        await sleep(500);
        ok(!(await G(pages[tj], 'G.sabActive().length')), 'sabotage ends after the target’s next shot');
        report.sabotage = { from: NAMES[i], to: NAMES[tj], kind: 'fog', hole: hi + 1 };
        bots.add(tj);
        break;
      }
    }

    // countdown: on hole 5 the last player idles; once more than half are in, they get 30 s, then a 7
    let idle = -1;
    if (hi === 4 && N >= 3) { idle = alive()[alive().length - 1]; bots.delete(idle); }
    if (SHOTS && (hi === 3 || hi === 6)) await shotBoth(pages[1], `g-14-zone-${hi + 1}`);

    // mid-range phone: 4× CPU on BOB while the arcade hole's balls roll (the quality tier may adapt)
    // mid-range phone: BOB at 4× CPU (and a phone's pixel density on GPU runs) while everyone else's ball rolls.
    // The bots finish their aim searches first and all putt at the same moment, so only rendering is measured.
    if (hi === PERF_HOLE) {
      const b = pages[1];
      const others = alive().filter(i => i !== 1 && bots.has(i));
      const fires = others.map(i => G(pages[i], `G.autoShot(${JSON.stringify({ noise: 0.05, angStep: 5, powStep: 0.07, lead: 10 })})`));
      await sleep(9800);
      if (GPU) await b.setViewport({ ...VIEW, deviceScaleFactor: 2.75 });
      const cdp = await b.createCDPSession();
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await sleep(500);
      await G(b, 'G.perfReset()');
      await sleep(5000);
      report.perf = { gpu: GPU, renderer: await b.evaluate(() => { const c = document.createElement('canvas').getContext('webgl'); const e = c && c.getExtension('WEBGL_debug_renderer_info'); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; }),
        tier: await G(b, 'G.tier()'), frames: await G(b, 'G.perf()'), ghostsRolling: (await G(b, 'G.ghostProbe()')).length };
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      await b.setViewport(VIEW);
      log('4x CPU', JSON.stringify(report.perf));
      await Promise.all(fires);
    }
    await Promise.all([...bots].map(i => botHole(i, hi)));

    if (idle >= 0) {
      const ip = pages[idle];
      await waitFor(ip, s => !!s.game.cdEndsAt, 'countdown starts', 30000);
      await sleep(1200);
      await shotBoth(ip, 'g-15-countdown');
      hp = await hostPage();
      await waitFor(hp, (s, h) => s.game.phase === 'card' && s.game.hi === h, 'countdown ends the hole', 45000, hi);
      const r = await evalIn(hp, (s, a) => s.game.results[a.hi][a.uid], { hi, uid: uids[idle] });
      report.countdown = { idle: NAMES[idle], recorded: r && r.s };
      ok(r && r.s === 7, 'an unfinished player records 7 when the countdown ends');
    }

    hp = await hostPage();
    await waitFor(hp, (s, h) => (s.game.phase === 'card' && s.game.hi === h) || s.game.phase === 'final' || s.game.hi > h, `hole ${hi + 1} scorecard`, 90000, hi);
    const res = await evalIn(hp, (s, h) => s.game.results && s.game.results[h], hi);
    report.holes.push({ hole: holes[hi], res: Object.fromEntries(Object.entries(res || {}).map(([u, r]) => [NAMES[uids.indexOf(u)], r.s])) });
    log(`hole ${hi + 1} results`, JSON.stringify(report.holes[report.holes.length - 1].res));
    report.memory.push({ hole: holes[hi], ...(await G(pages[1], 'G.memory()')) });
    if (hi === 0 || hi === 3) { await sleep(900); await shotBoth(pages[1], `g-08-scorecard-${hi + 1}`); }
    writeFileSync(`${OUT}golf-report.json`, JSON.stringify({ ...report, checks, errors }, null, 2));
  }

  // ---------------- final
  if (total === holes.length) {
    const hp = await hostPage();
    await waitFor(hp, s => s.game.phase === 'final', 'final', 30000);
    await sleep(4200);
    await shotBoth(pages[1], 'g-16-final');
    ok((await pages[1].evaluate(() => window.__arcade.musicDebug())).desired === 'victory', 'victory track on the podium');
    const night = await evalIn(hp, s => Object.keys(s.night || {}).length);
    ok(night >= 1, 'game-night points recorded');
    const mem = report.memory;
    ok(mem.length >= 2 && Math.max(...mem.map(m => m.geometries)) <= Math.min(...mem.map(m => m.geometries)) * 2 + 30 && mem[mem.length - 1].textures <= mem[0].textures + 12,
      `renderer memory stays flat across holes (${mem.map(m => `${m.geometries}g/${m.textures}t`).join(' ')})`);
    await hp.evaluate(() => [...document.querySelectorAll('.final-actions .btn-primary')].forEach(b => b.click()));
    await waitFor(hp, s => s.game && s.game.phase === 'play' && s.game.hi === 0, 'rematch starts', 30000);
    ok(true, 'rematch starts a new round of NEON PAR');
  }
  log('checks', `${checks.filter(c => c.ok).length}/${checks.length} passed`);
  log('errors', errors.length ? errors : 'none');
  if (errors.length) process.exitCode = 1;
} catch (e) {
  log('FAILED', e.message);
  errors.push(e.message);
  try { const p = pages[1] || pages[0]; if (p) await p.screenshot({ path: `${OUT}g-fail.png` }); } catch { /* */ }
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}golf-report.json`, JSON.stringify({ ...report, checks, errors }, null, 2));
  await browser.close();
}
