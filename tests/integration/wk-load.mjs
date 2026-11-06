// THE LOAD FIX (Nov 6) — THE BOOT IN WEBKIT: the owner's four load problems on his iPhone (Safari, random loads) read from the REAL boot in
// Safari's engine (Playwright's WebKit — ~/wk/node_modules/playwright, or WK_PLAYWRIGHT), 402×874 @3 as an iPhone, cold + warm:
//   1. THE DOUBLED LETTERING — every sign's lettering twice, the copy a little lower (the live layers + the crisp lettering at one camera,
//      the baked city still at the old one / the city canvas CSS-scaled while the crisp layer is not)
//   2. THE CHUNKS — pieces of the city showing before the reveal (the sign, the dock, the corner buttons over the dark)
//   3. THE #net PILL — the SIGNAL LOST pill seen at the top centre with no lost signal
//   4. THE STRAY SCREEN — a frame that is neither the boot screen nor the city (another screen, the glitch flash, the bare shell)
// Safari's bar is played as the viewport's HEIGHT changing (874 → 800 → 874) at moments of the load: before the reveal, during the fade,
// just after it, and later (past the 2 s the dock's bar-move is forgiven). --safari keeps the city's 100lvh box at the LARGE viewport
// (874) while the window shrinks — Safari's own behaviour (the bars move the dock, never the canvas); without it the whole viewport
// changes (a rotation-like resize). A probe on every frame (installed before the page mounts) records what each problem needs; --shots
// takes a screenshot burst (WebKit headless on Windows ≈ 10 fps) from the first paint to 5 s after the reveal.
//
//   node tests/integration/wk-load.mjs [--scene day|grey|night|all] [--bars pre|fade|after|late|none|all] [--safari] [--warm] [--shots DIR]
//                                      [--size 402x874] [--runs n] [--json out.json]
// Exit 1 when any of the four was seen. On the emulators + scripts/serve.mjs --emu (the boot signs in like a phone's).
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import { PROBE, judge } from './kit/load-probe.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const [VW, VH] = String(opt('size', '402x874')).split('x').map(Number);
const FONTS_MS = Number(opt('fonts-delay', 0)) || 0, SKY_MS = Number(opt('sky-delay', 0)) || 0, LIVE = !!opt('live', false);
const SAFARI = !!opt('safari', false), WARM = !!opt('warm', false), SHOTS = opt('shots', '') || '', RUNS = Number(opt('runs', 1)) || 1;
const SCENES = { day: 'when=2026-11-06T13:00&wx=clear', grey: 'when=2026-11-06T13:02&wx=overcast', night: 'when=2026-11-06T21:30&wx=clear' };
const sceneArg = String(opt('scene', 'grey')), barsArg = String(opt('bars', 'all'));
const scenes = sceneArg === 'all' ? Object.keys(SCENES) : sceneArg.split(',');
const BARS = ['pre', 'fade', 'after', 'late'];
const barsList = barsArg === 'all' ? BARS : barsArg.split(',');
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { webkit } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await webkit.launch();
const results = [];

async function run(scene, bars, tag) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(([lvh]) => {
    try { localStorage.setItem('nd:entered', '1'); localStorage.setItem('na:wl:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
    // (--safari: the LARGE viewport stays put while the window's height changes — iOS Safari's 100lvh under its bars)
    if (lvh) document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `.nd-scene.nd-lvh { height: ${lvh}px !important; }`; document.head.append(s); });
  }, [SAFARI ? VH : 0]);
  await ctx.addInitScript(PROBE);
  // (--fonts-delay / --sky-delay: a slow phone network — Google's fonts / the live weather answering late)
  if (FONTS_MS) await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => setTimeout(() => r.continue().catch(() => {}), FONTS_MS));
  if (SKY_MS) await ctx.route(/\/api\/sky/, r => setTimeout(() => r.continue().catch(() => {}), SKY_MS));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = guardUrl(`${BASE}/?emu&slot=wl${LIVE ? '' : `&${SCENES[scene]}${GR}`}&city=2`, 'wk-load.mjs');
  const once = async (shoot) => {
    const t0 = Date.now(), shots = [];
    const nav = page.goto(url, { waitUntil: 'commit', timeout: 60000 });
    let shooting = !!shoot, revealAt = null;
    const shooter = (async () => {
      let k = 0;
      while (shooting) {
        const ms = Date.now() - t0;
        try { const buf = await page.screenshot({ scale: 'css', timeout: 4000 }); shots.push({ ms, buf, k: k++ }); } catch { await sleep(30); }
      }
    })();
    const vp = h => page.setViewportSize({ width: VW, height: h }).catch(() => {});
    const shown = () => page.evaluate('!!(window.__district && window.__district.loadProbe && window.__district.loadProbe() && window.__district.loadProbe().shown)').catch(() => false);
    const waitShown = async (ms) => { const e = Date.now() + ms; while (Date.now() < e) { if (await shown()) return true; await sleep(25); } return false; };
    if (bars === 'pre') { await sleep(300); await vp(800); await sleep(500); await vp(VH); }
    await nav.catch(() => {});
    const ok = await waitShown(30000);
    revealAt = Date.now() - t0;
    if (bars === 'fade') { await vp(800); await sleep(300); await vp(VH); }
    if (bars === 'after') { await sleep(1000); await vp(800); await sleep(600); await vp(VH); }
    if (bars === 'late') { await sleep(2800); await vp(800); await sleep(2600); await vp(VH); }
    await sleep(5200);
    shooting = false; await shooter;
    const P = await page.evaluate('window.__lp ? window.__lp.dump() : null').catch(() => null);
    const LG = await page.evaluate('(() => { const h = window.__district && window.__district.harbor && window.__district.harbor(); return h && h.loadLog ? h.loadLog.rows.filter(r => /layout|bake|lit|reveal|resize|dock|fonts|wx|canvas/.test(r.kind)).map(r => `${Math.round(r.t || r.ms || 0)} ${r.kind} ${r.msg}`) : []; })()').catch(() => []);
    return { ok, revealAt, shots, P, LG };
  };
  if (WARM) await once(false);
  const r = await once(!!SHOTS);
  const J = judge(r.P);
  const name = `${scene}-${bars}${SAFARI ? '-safari' : ''}${WARM ? '-warm' : ''}${FONTS_MS ? `-f${FONTS_MS}` : ''}${SKY_MS ? `-s${SKY_MS}` : ''}${LIVE ? '-live' : ''}${tag}`;
  if (SHOTS) {
    const dir = join(SHOTS, name); mkdirSync(dir, { recursive: true });
    for (const s of r.shots) writeFileSync(join(dir, `${String(s.k).padStart(3, '0')}-${String(s.ms).padStart(5, '0')}ms.png`), s.buf);
  }
  results.push({ name, revealed: r.ok, revealAt: r.revealAt, ...J, errs, log: r.LG });
  if (opt('log', false)) for (const l of r.LG || []) console.log('    ' + l);
  const line = (k, v) => `${k} ${v.n ? `✗ ${v.n} frames — ${v.what}` : '✓'}`;
  console.log(`${name.padEnd(28)} reveal ${r.ok ? `${r.P ? r.P.revealMs : '?'} ms` : 'NEVER'} · ${line('DOUBLED', J.doubled)} · ${line('CHUNKS', J.chunks)} · ${line('NET', J.net)} · ${line('STRAY', J.stray)}${errs.length ? ` · errors ${errs.length}: ${errs[0]}` : ''}`);
  await ctx.close();
}

for (let i = 0; i < RUNS; i++) for (const sc of scenes) for (const b of barsList) await run(sc, b, RUNS > 1 ? `-${i + 1}` : '');
await browser.close();
if (opt('json', '')) writeFileSync(opt('json'), JSON.stringify(results, null, 1));
const bad = results.filter(r => r.doubled.n || r.chunks.n || r.net.n || r.stray.n || !r.revealed);
console.log(`\n${results.length} loads · ${bad.length} with a problem`);
process.exit(bad.length ? 1 : 0);
