// OVERCLOCK — NO SIDEWAYS SCROLL, EVER (OC3 Group 0 — the owner's phone after OC2: the VICTORY screen slid left, the BEST STREAK chip + the
// XP box cut off). EVERY Overclock screen — each challenge playing + its answer, the round winner, the standings at 8 players, the final
// standings, the victory at 2 / 8 / co-winners / solo — at 390 / 402 / 430 pt wide, on the no-Firebase preview (overclock-preview.html —
// the REAL view; only scripts/serve.mjs needed, no emulators):
//   1. nothing can scroll sideways: the document's scrollWidth ≤ the viewport, and no scroll container (overflow-x auto / scroll — a box
//      that scrolls DOWN scrolls sideways too unless it says otherwise) is wider inside than out — read twice (the victory's rays turn);
//   2. a real sideways finger swipe (CDP touch, an iPhone-sized touch screen) moves nothing: window.scrollX + every element's scrollLeft
//      stay 0.
//   node tests/integration/e2e-oc-sideways.mjs "<browser>"   (ONLY=victory,answer… · SIZES=390x844 · E2E_BASE)
import puppeteer from './kit/puppeteer.mjs';

const BROWSER = process.argv[2];
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SIZES = (process.env.SIZES || '390x844,402x874,430x932').split(',').map(s => s.split('x').map(Number));
const TYPES = ['unscramble', 'memory', 'oddone', 'math', 'pattern', 'trivia', 'stroop', 'reflex', 'count', 'truefalse', 'timeline', 'closest', 'rewire',
  'missinglink', 'spellcheck', 'compass', 'sortit', 'higherlower'];
const SCEN = [
  ...TYPES.map(t => ({ g: 'play', name: `play-${t}`, qs: `type=${t}&at=play` })),
  ...TYPES.map(t => ({ g: 'answer', name: `answer-${t}`, qs: `type=${t}&at=answer&beat=answer&still=1&n=4` })),
  { g: 'typing', name: 'typing-math', qs: 'type=math&at=typing' },
  { g: 'typing', name: 'typing-missinglink', qs: 'type=missinglink&at=typing' },
  { g: 'demo', name: 'demo-pattern', qs: 'type=pattern&at=brief&still=1' },
  { g: 'demo', name: 'demo-missinglink', qs: 'type=missinglink&at=brief&still=1' },
  { g: 'results', name: 'banner-8', qs: 'type=trivia&at=answer&beat=banner&still=1&n=8' },
  { g: 'results', name: 'banner-tie', qs: 'type=trivia&at=answer&beat=banner&still=1&n=8&win=tie' },
  { g: 'results', name: 'stand-8', qs: 'type=trivia&at=answer&beat=stand&still=1&n=8&ready=1' },
  { g: 'results', name: 'final-8', qs: 'type=trivia&at=answer&final=1&beat=final&still=1&n=8' },
  { g: 'victory', name: 'victory-2', qs: 'type=trivia&at=answer&final=1&beat=victory&still=1&n=2' },
  { g: 'victory', name: 'victory-8', qs: 'type=trivia&at=answer&final=1&beat=victory&still=1&n=8' },
  { g: 'victory', name: 'victory-cowin', qs: 'type=trivia&at=answer&final=1&beat=victory&still=1&n=8&cowin=1' },
  { g: 'victory', name: 'victory-solo', qs: 'type=trivia&at=answer&final=1&beat=victory&still=1&n=1' },
];
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const list = ONLY.length ? SCEN.filter(s => ONLY.some(o => s.g === o || s.name.includes(o))) : SCEN;

const sleep = ms => new Promise(r => setTimeout(r, ms));
// every box that would let a finger scroll it sideways: wider inside than out + overflow-x auto / scroll (the document counts too)
const PROBE = () => {
  const vw = window.innerWidth, bad = [];
  const de = document.documentElement;
  if (de.scrollWidth > vw + 1) bad.push(`document ${de.scrollWidth} > ${vw}`);
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowX)) continue;
    if (el.scrollWidth > el.clientWidth + 1) bad.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ${el.scrollWidth} > ${el.clientWidth}`);
  }
  return bad;
};
const MOVED = () => {
  const out = [];
  if (window.scrollX) out.push(`window scrollX ${window.scrollX}`);
  for (const el of document.querySelectorAll('*')) if (el.scrollLeft) out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} scrollLeft ${el.scrollLeft}`);
  return out;
};

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });
let pass = 0, fail = 0;
const t0 = Date.now();
for (const [w, h] of SIZES) {
  const p = await browser.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const cdp = await p.target().createCDPSession();
  for (const s of list) {
    errs.length = 0;
    await p.goto(`${BASE}/tests/integration/overclock-preview.html?${s.qs}`);
    await p.waitForFunction(() => document.body && document.body.dataset.ready, { timeout: 30000 }).catch(() => {});
    await sleep(s.g === 'victory' ? 2600 : s.g === 'answer' || s.g === 'results' ? 1200 : 500);
    const a = await p.evaluate(PROBE);
    await sleep(700);
    const b = await p.evaluate(PROBE);
    // a real finger: a sideways swipe right → left across the middle of the screen (then left → right) — Chromium's own touch gesture
    const y = Math.round(h * 0.45);
    let moved1 = null;
    for (const yy of [y, Math.round(h * 0.2), Math.round(h * 0.75)]) {
      await cdp.send('Input.synthesizeScrollGesture', { x: Math.round(w / 2), y: yy, xDistance: -(w - 80), yDistance: 0, gestureSourceType: 'touch', speed: 1600, preventFling: true }).catch(() => {});
      // + a sideways trackpad / wheel swipe at the same spot (Chromium's touch gesture skips a box a child takes the touch for)
      await p.mouse.move(Math.round(w / 2), yy); await p.mouse.wheel({ deltaX: 300 });
      await sleep(200);
      const m = await p.evaluate(MOVED);
      if (m.length) { moved1 = m; break; }
    }
    const moved = moved1 || await p.evaluate(MOVED);
    const bad = [...new Set([...a, ...b])];
    const label = `${s.name} ${w}x${h}`;
    if (!bad.length && !moved.length) { pass++; console.log(`  ✓ ${label}`); }
    else { fail++; console.log(`  ✗ ${label}${bad.length ? ` — wider: ${bad.join(' · ')}` : ''}${moved.length ? ` — the swipe moved: ${moved.join(' · ')}` : ''}`); }
    if (errs.length) console.log(`    (page errors: ${errs.slice(0, 2).join(' | ')})`);
  }
  await p.close();
}
await browser.close();
console.log(`\nNO SIDEWAYS SCROLL: ${pass}/${pass + fail} in ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(fail ? 1 : 0);
