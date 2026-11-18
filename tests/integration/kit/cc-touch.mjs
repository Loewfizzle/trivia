// DAILY A — COAST CLEAR's TOUCH-DOWN + THE FITTED BOARD, checked on the REAL view (coastclear-preview.html — the fake judge, no Firebase):
//   · CC_DIG_ON 'down' (the default): a pointer DOWN alone fires the dig (the call in flight before the lift), the tile presses in + pulses +
//     shows its digging state until the number surfaces; a long press is still ONE dig (never a buoy); BUOY mode lays the buoy on the down
//   · 'up' (&dig=up): the down alone digs nothing — the tile presses in + pulses + shows its digging state; the lift digs; a long press turns
//     it cleanly into a buoy (the digging state gone, no call)
//   · THE TOUCH GUARD: a second finger (a non-primary touch while one is held) never digs
//   · THE FITTED BOARD at 375×667 · 390×844 · 402×874 · 430×932, night + day (+ the hint shown): the last row's bottom edge inside the
//     viewport and above DIG / BUOY
// Called by e2e-daily.mjs (section 0); alone:  node tests/integration/kit/cc-touch.mjs "<browser>" [--base http://localhost:5173]
import { guardUrl } from './live-guard.mjs';

export const FIT_SIZES = [[375, 667], [390, 844], [402, 874], [430, 932]];

/** → the results through ok(cond, what) */
export async function ccTouchChecks({ browser, base, ok, log = console.log }) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const open = async (q, size = [390, 844]) => {
    await p.setViewport({ width: size[0], height: size[1], deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(guardUrl(`${base}/tests/integration/coastclear-preview.html?corner=0&toggle=0&lat=250&${q}`, 'cc-touch'));
    await p.waitForFunction(() => document.body.dataset.ready === '1' && window.__coastclear && window.__coastclear.ready(), { timeout: 30000 });
  };
  /** a safe, shut, unbuoyed cell (the fake board is known to the page) */
  const freeCell = (skip = []) => p.evaluate(sk => { const P = window.__preview, v = window.__coastclear.view(), open = new Set(v.open.map(c => c[0])), L = new Set(P.board.lights), bu = new Set(window.__coastclear.buoys());
    for (let i = 0; i < 108; i++) if (!open.has(i) && !L.has(i) && !bu.has(i) && !sk.includes(i) && P.counts[i] > 0) return i; return null; }, skip);
  const centre = i => p.evaluate(k => { const r = document.querySelector(`.cc-cell[data-i="${k}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, i);
  const cellState = i => p.evaluate(k => { const c = document.querySelector(`.cc-cell[data-i="${k}"]`); return { press: c.classList.contains('is-press'), wait: c.classList.contains('is-wait'), open: c.classList.contains('is-open'), buoy: c.classList.contains('is-buoy'), touch: !!c.querySelector('.cc-touch'), calls: window.__judge.calls, inflight: window.__coastclear.inflight() }; }, i);
  const settle = () => p.waitForFunction(() => window.__coastclear.state().pending === 0 && window.__coastclear.state().inflight === 0, { timeout: 10000 });

  // ---- 'down' (the default)
  await open('state=mid');
  ok(await p.evaluate(() => window.__coastclear.digOn()) === 'down', 'COAST CLEAR: CC_DIG_ON\'s default is DOWN');
  let i = await freeCell();
  let [x, y] = await centre(i);
  await p.mouse.move(x, y); await p.mouse.down();
  await p.waitForFunction(() => window.__coastclear.inflight() > 0 || window.__judge.calls > 0, { timeout: 2000 }).catch(() => {});
  const d1 = await cellState(i);
  ok(d1.press && d1.touch && d1.wait && (d1.inflight > 0 || d1.calls > 0) && !d1.open, `DOWN: the finger DOWN alone fires the dig — the tile presses in + pulses + digs (in flight before the lift) ${JSON.stringify(d1)}`);
  await new Promise(r => setTimeout(r, 520));   // (held past the old long-press: still the ONE dig, never a buoy)
  await p.mouse.up();
  await settle();
  const d2 = await cellState(i);
  ok(d2.open && !d2.buoy && !d2.wait && !d2.press, `DOWN: a long press is still ONE dig (no buoy) — the number surfaced, the digging state gone ${JSON.stringify(d2)}`);
  // BUOY mode: the buoy on the down, no call
  await p.evaluate(() => window.__coastclear.setMode('buoy'));
  i = await freeCell(); [x, y] = await centre(i);
  const c0 = await p.evaluate(() => window.__judge.calls);
  await p.mouse.move(x, y); await p.mouse.down();
  const b1 = await cellState(i);
  await p.mouse.up();
  ok(b1.buoy && b1.calls === c0, `DOWN · BUOY mode: the buoy lands on the touch-down (no server call) ${JSON.stringify(b1)}`);
  await p.evaluate(() => window.__coastclear.setMode('dig'));
  // THE TOUCH GUARD: a second finger while the first is held never digs
  { const a = await freeCell([i]), b = await freeCell([i, a]);
    const [ax, ay] = await centre(a), [bx, by] = await centre(b);
    const cdp = await p.createCDPSession();
    const n0 = await p.evaluate(() => window.__coastclear.downs());
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ax, y: ay, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: ax, y: ay, id: 1 }, { x: bx, y: by, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ax, y: ay, id: 1 }, { x: bx, y: by, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settle();
    const g = await p.evaluate((k, n) => ({ downs: window.__coastclear.downs() - n, guarded: window.__coastclear.guarded(), second: document.querySelector(`.cc-cell[data-i="${k}"]`).classList.contains('is-open'), pending: window.__coastclear.pending() }), b, n0);
    ok(g.downs === 1 && !g.second && g.guarded >= 1, `THE TOUCH GUARD: a second finger while one is held never digs (one dig, the second cell still shut) ${JSON.stringify(g)}`); }

  // ---- 'up' (DFIX5's path, kept)
  await open('state=mid&dig=up');
  ok(await p.evaluate(() => window.__coastclear.digOn()) === 'up', 'COAST CLEAR &dig=up: the UP setting');
  i = await freeCell(); [x, y] = await centre(i);
  let n0 = await p.evaluate(() => window.__judge.calls);
  await p.mouse.move(x, y); await p.mouse.down();
  const u1 = await cellState(i);
  ok(u1.press && u1.touch && u1.wait && u1.calls === n0 && u1.inflight === 0, `UP: the DOWN presses in + pulses + shows the digging state — nothing sent yet ${JSON.stringify(u1)}`);
  await p.mouse.up();
  await settle();
  const u2 = await cellState(i);
  ok(u2.open && u2.calls > n0 && !u2.wait, `UP: the LIFT digs — the number surfaced ${JSON.stringify(u2)}`);
  i = await freeCell(); [x, y] = await centre(i);
  n0 = await p.evaluate(() => window.__judge.calls);
  await p.mouse.move(x, y); await p.mouse.down();
  await new Promise(r => setTimeout(r, 520));
  const u3 = await cellState(i);
  await p.mouse.up();
  const u4 = await cellState(i);
  ok(u3.buoy && !u3.wait && !u3.press && u4.buoy && !u4.open && u4.calls === n0, `UP: a LONG PRESS turns cleanly into a buoy — the digging state gone, no dig ${JSON.stringify(u4)}`);

  // ---- THE FITTED BOARD: every size, both looks (+ the one-time hint under the board, the tallest case)
  for (const size of FIT_SIZES) for (const look of ['night', 'day']) for (const hint of [0, 1]) {
    await open(`state=mid&look=${look}${hint ? '&hint=1' : ''}`, size);
    await p.waitForFunction(() => !!window.__coastclear.fit(), { timeout: 5000 }).catch(() => {});
    await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const f = await p.evaluate(() => {
      const last = document.querySelector('.cc-cell[data-i="107"]').getBoundingClientRect(), first = document.querySelector('.cc-cell[data-i="0"]').getBoundingClientRect();
      const mode = document.querySelector('.cc-mode').getBoundingClientRect(), hintEl = document.querySelector('.cc-hint'), hr = hintEl && !hintEl.hidden ? hintEl.getBoundingClientRect() : null;
      return { bottom: Math.round(last.bottom * 10) / 10, top: Math.round(first.top), mode: Math.round(mode.top * 10) / 10, vh: innerHeight, cell: Math.round(last.width * 10) / 10, hint: hr ? Math.round(hr.bottom) : null, fit: window.__coastclear.fit() };
    });
    ok(f.bottom <= f.vh && f.bottom <= f.mode && (f.hint == null || f.hint <= f.mode) && f.top >= 0, `THE FITTED BOARD ${size.join('×')} ${look}${hint ? ' + the hint' : ''}: the last row ends at ${f.bottom} px, above DIG / BUOY (${f.mode}) inside ${f.vh} — a ${f.cell} px cell`);
  }
  ok(!errs.length, `COAST CLEAR touch + fit: no page errors${errs.length ? ` (${errs.join(' · ')})` : ''}`);
  await ctx.close();
}

// ---- alone: node tests/integration/kit/cc-touch.mjs "<browser>" [--base …]
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const { default: puppeteer } = await import('./puppeteer.mjs');
  const argv = process.argv.slice(2);
  const base = (k => (k < 0 ? 'http://localhost:5173' : argv[k + 1]))(argv.indexOf('--base'));
  const browser = await puppeteer.launch({ executablePath: argv[0], headless: true });
  let bad = 0;
  const ok = (c, what) => { if (!c) bad++; console.log(c ? 'OK  ' : 'FAIL', what); };
  try { await ccTouchChecks({ browser, base, ok }); } finally { await browser.close(); }
  console.log(bad ? `${bad} FAILED` : 'ALL GREEN');
  process.exit(bad ? 1 : 0);
}
