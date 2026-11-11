// HOLD'EM (HE7) — ROTATE ANY TIME, on the preview's MOTION DEMO (no emulators — the real view, the real dealer core + THE LEAN WIRE on the
// real clock): the phone turns sideways + back again and again MID-MOTION (a deal, the chips, a showdown, the pots one at a time) and every
// turn: the layout follows at once (portrait ↔ wide, the stage), the motion in flight SNAPS to its end (nothing left animating, nothing
// jumps back), no sound is planned by the turn itself (no replay), no page error, the table's pieces where the layout says. Then a desktop
// window (the stage scaled) and back. Exit code 1 on a failure.
//   node tests/integration/holdem-rotate.mjs "<browser>"        (E2E_BASE = a plain `node scripts/serve.mjs 5190`)
import puppeteer from './kit/puppeteer.mjs';

const browserPath = process.argv[2];
const base = process.env.E2E_BASE || 'http://localhost:5190';
const fails = [];
const ok = (cond, what) => { console.log(`${cond ? '  ✓' : '  ✗'} ${what}`); if (!cond) fails.push(what); };
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e && e.message || e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const SIDE = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
await page.setViewport(PHONE);
await page.goto(`${base}/tests/integration/holdem-preview.html?play=1&n=6&mute=1&lv=12&seed=turn`, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__holdem && window.__holdem.layout && window.__holdem.layout(), { timeout: 20000 });
const read = () => page.waitForFunction(() => window.__holdem && window.__holdem.layout() && document.querySelector('.he-stage'), { timeout: 8000 }).then(() => page.evaluate(() => {
  const H = window.__holdem, L = H.layout(), root = document.querySelector('.he');
  const seat = document.querySelector('.he-seat'), r = seat && seat.getBoundingClientRect();
  return { orient: root.dataset.orient, wide: !!L.wide, motion: H.motion(), planned: H.planned().length, k: L.k, seq: H.pub() && H.pub().seq,
    seatAt: r ? [Math.round(r.x), Math.round(r.y)] : null, seatWant: L.seats[0] ? [Math.round(L.seats[0].x), Math.round(L.seats[0].y)] : null,
    stage: getComputedStyle(document.querySelector('.he-stage')).transform };
}));

// turn mid-motion: wait for the motion to be running, then turn — 10 turns
let turns = 0, snapped = 0, quiet = 0, followed = 0;
for (let i = 0; i < 10; i++) {
  await page.waitForFunction(() => window.__holdem && window.__holdem.motion(), { timeout: 30000, polling: 30 }).catch(() => {});
  const before = await read();
  await page.setViewport(i % 2 ? PHONE : SIDE);
  await page.waitForFunction(w => { const r = document.querySelector('.he'); return !!r && r.dataset.orient === (w ? 'wide' : 'tall'); }, { timeout: 5000 }, !(i % 2));
  const after = await read();
  turns++;
  if (after.wide === !(i % 2)) followed++;
  if (!after.motion) snapped++;
  // (no sound planned by the turn: the same count, unless the table itself moved on in the same moment)
  if (after.planned === before.planned || after.seq !== before.seq) quiet++;
  ok(after.seatWant && after.seatAt && Math.abs(after.seatAt[0] - after.seatWant[0]) < 3 && Math.abs(after.seatAt[1] - after.seatWant[1]) < 3, `turn ${i + 1} (${after.orient}): the first seat where the layout says (${after.seatAt} ≈ ${after.seatWant})`);
  await new Promise(r => setTimeout(r, 400 + (i % 3) * 300));
}
ok(followed === turns, `the layout followed every turn (${followed}/${turns})`);
ok(snapped === turns, `the motion in flight snapped to its end on every turn (${snapped}/${turns})`);
ok(quiet === turns, `no sound planned by a turn (${quiet}/${turns})`);

// the motion plays on after the turns (the next events animate in the new layout)
const p0 = (await read()).planned;
await page.waitForFunction(n => window.__holdem && window.__holdem.planned().length > n, { timeout: 20000 }, p0).catch(() => {});
ok((await read()).planned > p0, 'the next events still play (sounds + motion) after the turns');

// a DESKTOP window: the stage scaled, centred; then a phone again (portrait = no stage transform)
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.waitForFunction(() => { const st = document.querySelector('.he-stage'); return !!st && getComputedStyle(st).transform !== 'none'; }, { timeout: 5000 }).catch(() => {});
const desk = await read();
ok(desk.wide && /matrix\(1\.6/.test(desk.stage), `desktop 1440×900: the sideways table, scaled (${desk.stage})`);
await page.setViewport(PHONE);
await page.waitForFunction(() => { const r = document.querySelector('.he'); return !!r && r.dataset.orient === 'tall'; }, { timeout: 8000 }).catch(() => {});
const back = await read();
if (back.wide) console.log('  (debug)', JSON.stringify(await page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, rw: document.querySelector('.he').clientWidth, rh: document.querySelector('.he').clientHeight }))));
ok(!back.wide && back.stage === 'none', 'back upright: the portrait table, no stage transform');
ok(errors.length === 0, `no page errors${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL GOOD');
process.exit(fails.length ? 1 : 0);
