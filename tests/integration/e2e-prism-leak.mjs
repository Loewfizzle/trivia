// PRISM DROP — THE LEAK CHECK (PFIX-A, FABLE REVIEW finding 3): two phones, a BATTLE, then REMATCH after REMATCH. Every match must give
// its whole screen back: the old match roots collected, the live canvas memory flat, the DOM nodes + listeners flat, ONE reverb a page.
//   node tests/integration/e2e-prism-leak.mjs "<browser path>"          (env MATCHES=6 — the review's probe ran 30: MATCHES=30 for the log)
//   GAME=overclock — the same probe on OVERCLOCK (3 rematches is enough to see a slope; no PRISM-only counts)
// Probes injected before the page's own scripts: every canvas by WeakRef (+ its pixels), the convolvers made; after two forced collections
// CDP's DOM nodes + listeners. Measured on the HOST's phone at 390 × 844 @2, at each podium. On the emulators (scripts/serve.mjs --emu).
import puppeteer from './kit/puppeteer.mjs';

const BROWSER = process.argv[2];
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const GAME = process.env.GAME || 'prism';
const MATCHES = Number(process.env.MATCHES || (GAME === 'prism' ? 6 : 3));
const NAMES = ['ALICE', 'BOB'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const PROBE = () => {
  window.__leak = { canvases: [], convolvers: 0, roots: [] };
  const mk = Document.prototype.createElement;
  Document.prototype.createElement = function (tag, ...rest) {
    const el = mk.call(this, tag, ...rest);
    if (String(tag).toLowerCase() === 'canvas') window.__leak.canvases.push(new WeakRef(el));
    return el;
  };
  for (const C of [window.BaseAudioContext, window.AudioContext].filter(Boolean)) {
    const cc = C.prototype.createConvolver;
    if (cc && !cc.__probed) { C.prototype.createConvolver = function (...a) { window.__leak.convolvers++; return cc.apply(this, a); }; C.prototype.createConvolver.__probed = true; }
  }
  window.__leak.read = () => {
    let px = 0, alive = 0, inPage = 0;
    for (const r of window.__leak.canvases) { const c = r.deref(); if (!c) continue; alive++; px += c.width * c.height; if (c.isConnected) inPage++; }
    return { mb: +(px * 4 / 1e6).toFixed(1), alive, inPage, convolvers: window.__leak.convolvers, roots: window.__leak.roots.map(r => !!r.deref()) };
  };
};

const browser = await puppeteer.launch({
  executablePath: BROWSER, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--js-flags=--expose-gc', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])],
});
const pages = [];
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
  throw new Error(`timeout: ${what}`);
}
async function openPlayer(i, qs = '') {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  await page.evaluateOnNewDocument(PROBE);
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=leak${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
// (no ElementHandle is ever kept: a handle is a DevTools "global handle" — it pinned the podium, and with it match 1's whole screen)
const seen = (page, sel, o = {}) => page.waitForFunction(q => !!document.querySelector(q), { timeout: o.timeout || 30000 }, sel).then(h => h.dispose());
async function counters(page) {
  const c = await page.target().createCDPSession();
  for (let k = 0; k < 2; k++) { await c.send('HeapProfiler.collectGarbage'); await sleep(200); }
  const dom = await c.send('Memory.getDOMCounters');
  const heap = await c.send('Runtime.getHeapUsage');
  await c.detach();
  const l = await page.evaluate(() => window.__leak.read());
  return { ...l, nodes: dom.nodes, listeners: dom.jsEventListeners, heapMB: +(heap.usedSize / 1e6).toFixed(1) };
}

// RETAINERS=1: the shortest strong path from the GC roots to match 1's screen (a heap snapshot through CDP) — what still holds it
async function retainerPath(page, tag) {
  const c = await page.target().createCDPSession();
  await c.send('HeapProfiler.enable');
  for (let k = 0; k < 2; k++) await c.send('HeapProfiler.collectGarbage');
  let chunks = '';
  c.on('HeapProfiler.addHeapSnapshotChunk', e => { chunks += e.chunk; });
  await c.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  await c.detach();
  const snap = JSON.parse(chunks);
  const m = snap.snapshot.meta, nf = m.node_fields.length, ef = m.edge_fields.length;
  const N = snap.nodes, Ed = snap.edges, S = snap.strings, nTypes = m.node_types[0], eTypes = m.edge_types[0];
  const count = N.length / nf;
  const firstEdge = new Uint32Array(count + 1);
  for (let i = 0, e = 0; i < count; i++) { firstEdge[i] = e; e += N[i * nf + 4] * ef; }
  firstEdge[count] = Ed.length;
  const rev = Array.from({ length: count }, () => []);
  for (let i = 0; i < count; i++) for (let e = firstEdge[i]; e < firstEdge[i + 1]; e += ef) if (eTypes[Ed[e]] !== 'weak') rev[Ed[e + 2] / nf].push([i, e]);
  let target = -1;
  for (let i = 0; i < count; i++) if (S[N[i * nf + 1]] === tag && nTypes[N[i * nf]] === 'object') { target = i; break; }
  if (target < 0) return 'collected (no ' + tag + ' in the heap)';
  const next = new Map([[target, null]]);   // node → [the node it leads to (towards the target), the edge]
  const q = [target];
  let root = -1;
  while (q.length) { const x = q.shift(); if (x === 0) { root = x; break; } for (const [from, e] of rev[x]) if (!next.has(from)) { next.set(from, [x, e]); q.push(from); } }
  if (root < 0) return 'no strong path';
  const lines = [];
  for (let cur = root; cur !== target;) {
    const [nx, e] = next.get(cur);
    const et = eTypes[Ed[e]], en = et === 'element' || et === 'hidden' ? Ed[e + 1] : S[Ed[e + 1]];
    lines.push(`${nTypes[N[cur * nf]]}:${String(S[N[cur * nf + 1]]).slice(0, 60)} -[${et}:${String(en).slice(0, 40)}]->`);
    cur = nx;
  }
  lines.push(String(S[N[target * nf + 1]]).slice(0, 60));
  return lines.join('\n  ');
}

try {
  // ---------------------------------------------------------------- the room (two phones)
  const A = await openPlayer(0);
  await seen(A, '.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await A.evaluate(() => !!document.querySelector('.setup-screen input.input'))); k++) {
    await A.click('.nd-host').catch(() => {});
    await seen(A, '.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await A.type('.setup-screen input.input', NAMES[0]);
  await A.click('.form-cta .btn-primary');
  await seen(A, '.title-screen.is-room .rdk-dock', { timeout: 20000 });
  const code = await evalIn(A, s => s.code);
  const B = await openPlayer(1, `room=${code}`);
  await seen(B, '.nd-go', { timeout: 20000 });
  await B.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
  await B.click('.nd-go');
  await seen(B, '.input-code');
  await B.type('.setup-screen input.input:not(.input-code)', NAMES[1]);
  await B.click('.form-cta .btn-primary');
  await seen(B, '.title-screen.is-room', { timeout: 20000 });
  await waitFor(A, s => Object.keys(s.players).length === 2, 'two players');
  const base = await counters(A);
  log('in the room', JSON.stringify(base));

  // ---------------------------------------------------------------- match after match
  const rows = [];
  let prevMatch = null;
  for (let m = 1; m <= MATCHES; m++) {
    if (m === 1) await A.evaluate(async g => { const r = await import('/js/games/registry.js'); const h = await import('/js/host.js'); return h.startGame(g, g === 'prism' ? { mode: 'battle' } : { ...((r.metaOf(g) || {}).DEFAULT_SETTINGS || {}) }); }, GAME);
    else await A.evaluate(() => import('/js/host.js').then(h => h.rematch()));
    await waitFor(A, (s, p) => s.game && s.game.matchId !== p && (s.game.phase === 'play' || s.game.phase === 'count' || s.game.phase === 'intro' || s.game.phase === 'q'), `match ${m} on`, 60000, prevMatch);
    prevMatch = await evalIn(A, s => s.game.matchId);
    if (GAME === 'prism') {
      await waitFor(A, s => s.game.phase === 'play', `match ${m} GO`, 30000);
      await A.waitForFunction(() => window.__prism && window.__prism.engine(), { timeout: 20000 });
      await B.waitForFunction(() => window.__prism && window.__prism.engine(), { timeout: 20000 });
      await A.evaluate(k => { const r = document.querySelector('.pd'); const n = `LeakTag${k}`; r.__leakTag = new ({ [n]: class {} })[n](); window.__leak.roots.push(new WeakRef(r)); }, m);
      await A.evaluate(s => window.__prism.bot({ skill: 0.9, every: 120, seed: s }), m);
      await B.evaluate(s => window.__prism.bot({ skill: 0.6, every: 200, seed: s }), m + 50);
      await sleep(2500);
      await B.evaluate(() => window.__prism.topOut());
      await waitFor(A, s => s.game.phase === 'final', `match ${m} results`, 40000);
      await seen(A, '.final .pd-fs', { timeout: 15000 }).catch(() => {});
    } else {
      // OVERCLOCK: a QUICK match played by its own end (both phones idle — the challenges time out), to the podium
      await waitFor(A, s => s.game && s.game.phase === 'final', `match ${m} results`, 900000);
      await seen(A, '.final', { timeout: 15000 }).catch(() => {});
    }
    await sleep(1500);
    const c = await counters(A);
    rows.push({ m, ...c });
    log(`after match ${m}`, JSON.stringify(c));
    if (process.env.RETAINERS && m >= 3) log(`match 1 screen held by:\n  ${await retainerPath(A, 'LeakTag1')}`);
  }
  await A.evaluate(() => import('/js/host.js').then(h => h.backToLobby()));
  await waitFor(A, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
  await sleep(2500);
  const room = await counters(A);
  log('back in the room', JSON.stringify(room));

  // ---------------------------------------------------------------- the table + the checks
  console.log('\n| after match | ' + rows.map(r => r.m).join(' | ') + ' | back in the room |');
  console.log('| --- |' + rows.map(() => ' --- |').join('') + ' --- |');
  for (const [k, label] of [['mb', 'live canvas pixels, MB'], ['alive', 'canvases alive'], ['nodes', 'DOM nodes'], ['listeners', 'listeners'], ['heapMB', 'JS heap, MB'], ['convolvers', 'convolvers made']]) {
    console.log(`| ${label} | ${rows.map(r => r[k]).join(' | ')} | ${room[k]} |`);
  }
  console.log('');
  const first = rows[Math.min(1, rows.length - 1)], last = rows[rows.length - 1];
  const span = Math.max(1, last.m - first.m);
  if (GAME === 'prism') {
    const roots = last.roots;
    const old = roots.slice(0, -2);   // every match before the last two (the previous one may still be on its way out)
    ok(old.length > 0 && old.every(x => !x), `THE OLD SCREENS GO: match roots 1–${old.length} collected (${roots.map(x => (x ? '●' : '○')).join('')} — ● alive, ○ collected)`);
    ok(last.mb - first.mb <= 12, `CANVAS MEMORY FLAT: ${first.mb} MB after match ${first.m} → ${last.mb} MB after match ${last.m} (within one match's worth, 12 MB)`);
    ok(last.nodes - first.nodes <= 330, `DOM NODES FLAT: ${first.nodes} → ${last.nodes} (+${((last.nodes - first.nodes) / span).toFixed(0)} a match; the leak was +327)`);
    ok(last.listeners - first.listeners <= 17, `LISTENERS FLAT: ${first.listeners} → ${last.listeners} (+${((last.listeners - first.listeners) / span).toFixed(1)} a match; the leak was +17)`);
    ok(last.convolvers === rows[0].convolvers, `ONE REVERB A PAGE: no convolver made after the first match (${rows.map(r => r.convolvers).join(' → ')} in the page — the city's own + PRISM's one)`);
    ok(room.mb <= last.mb + 60, `BACK IN THE ROOM: ${room.mb} MB of canvas (the city on top)`);
  } else {
    log(`${GAME}: +${((last.mb - first.mb) / span).toFixed(1)} MB canvas, +${((last.nodes - first.nodes) / span).toFixed(0)} nodes, +${((last.listeners - first.listeners) / span).toFixed(1)} listeners a match`);
  }
} catch (e) {
  errors.push(`FATAL ${e.message}`);
  log('FAILED', e.message);
}

const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
await browser.close();
process.exit(errors.length ? 1 : 0);
