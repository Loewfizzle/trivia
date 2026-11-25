// THE CITY POLISH PASS — Group 0: THE PLAY BOUNCE (Nov 24 — a new player tapped JAYWALK, "it wouldn't let him"; backing out + trying again
// worked). The cause: host.js's stall clock was module-global — the time on the title was read as a STALL at the next solo room's first tick
// → THE WAKE HOLD held the start → PLAY NOW left the room SILENTLY. Playwright (Chromium 4× CPU, WebKit as an iPhone), 390 × 844, on the
// emulators (scripts/serve.mjs --emu):
//   bounce    PLAY NOW → JAYWALK lands on game:jaywalk → leave → 6.5 s on the city → PLAY NOW again → game:jaywalk, no error message, NO WAKE
//             at the start's gate (host.js#wakeStats) — ROUNDS times (red on the old code: a wake every second try)
//   newphone  a BRAND-NEW phone (empty storage): PLAY → JAYWALK → PLAY NOW → the name page at once → PLAY NOW → the game
//   deploy    the same new phone across a deploy (ONE DEPLOY AT A TIME's two builds through THE LINE + the worker): build A boots, build B goes
//             live with a JAYWALK cartridge that needs a NEW export of a boot module (the worst case) → PLAY NOW is never a dead tap: the game,
//             or COULDN'T START + ONE reload, and the tap after it plays on B
//   quick     LAST MILE — THE REUSED START: PLAY NOW → the game → leave → PLAY NOW again inside 500 ms (inside the first start's ~2 s walk)
//             → game:jaywalk:* in the NEW room, a NEW match — QUICK times in a row (red on the old code: the last room's start reused, no game
//             written, the title in an orphan solo room)
//   HIGH RISE PAD + GO: `--game highrise` runs bounce + quick for HIGH RISE (the fix is the console's — host.js: proven for the second proof game;
//             newphone + deploy stay JAYWALK's: they patch its cartridge)
//   node tests/integration/e2e-play-bounce.mjs [--browser chromium|webkit] [--base http://localhost:5173] [--only bounce,newphone,deploy,quick] [--game jaywalk|highrise] [--rounds 4] [--quick 10] [--latency ms]
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import { startLine } from './kit/line-proxy.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BASE = guardUrl(opt('base', 'http://localhost:5173'), 'e2e-play-bounce'), BROWSER = opt('browser', 'chromium');
const GAME = opt('game', 'jaywalk') === 'highrise' ? 'highrise' : 'jaywalk', NAME = GAME === 'highrise' ? 'HIGH RISE' : 'JAYWALK';
const ONLY = (opt('only', '') || (GAME === 'highrise' ? 'bounce,quick' : '')).split(',').filter(Boolean), ROUNDS = Number(opt('rounds', 4)), CPU = Number(opt('cpu', 4)), LAT = Number(opt('latency', 0));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pw = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
const browser = await pw[BROWSER].launch(BROWSER === 'chromium' ? { executablePath: process.env.CHROME || 'C:/Users/benja/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe', args: ['--mute-audio'] } : {});
const results = [];
const ok = (c, what) => { results.push({ ok: !!c, what }); console.log(c ? 'OK  ' : 'FAIL', `${BROWSER}: ${what}`); };
const S = 'window.__arcade.state';
const UP = '!!(window.__district && window.__district.harbor() && window.__district.harbor().shown) && !!window.__arcade';
const ROUTE = "(window.__arcade && window.__arcade.route ? window.__arcade.route() : '')";

/** a phone: { named } = a saved profile (a returning player); { fresh } = empty storage (a brand-new phone) */
async function phone({ name = 'BOUNCER', fresh = false, base = BASE, sw = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: BROWSER === 'webkit', hasTouch: true });
  const slot = `pb${Date.now() % 100000}`;
  await ctx.addInitScript(([s, n, f, w]) => {
    try { if (!f) { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: n, color: 'magenta', avatar: 'bolt' })); } } catch { /* fine */ }
    // every red message the page shows (THE MESSAGE — ui/toast.js: .sh-msg-err)
    window.__pbErr = [];
    new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches && n.matches('.sh-msg-err')) window.__pbErr.push(n.textContent.replace('×', '').trim()); }).observe(document, { childList: true, subtree: true });
    if (w && navigator.serviceWorker) document.addEventListener('DOMContentLoaded', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
  }, [slot, name, fresh, sw]);
  const p = await ctx.newPage();
  const errs = [], navs = [], cons = [];
  p.on('pageerror', e => { if (!/ResizeObserver loop/i.test(e.message)) errs.push(e.message); });
  p.on('console', m => cons.push(`${m.type()}: ${m.text()}`));
  p.on('domcontentloaded', () => navs.push(Date.now()));   // (a real load — framenavigated also fires on the app's own address changes)
  if (BROWSER === 'chromium' && CPU > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); if (LAT) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: LAT, downloadThroughput: -1, uploadThroughput: -1 }); } }
  const ev = js => p.evaluate(js);
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(100); } return false; };
  const url = `${base}/?emu&slot=${slot}&city=2&when=2026-11-10T20:30&conngrace=4000`;
  await p.goto(url);
  if (!await waitFor(UP, 90000)) throw new Error('the city never came up');
  await waitFor(`!!(${S}.ready && ${S}.uid)`, 20000);
  return { ctx, p, ev, waitFor, errs, navs, cons, url, red: () => p.evaluate('window.__pbErr.splice(0)').catch(() => []) };
}
/** the dock's PLAY → THE GAMES SHELF → JAYWALK's card → its PLAY NOW (the card's solo tube) */
async function tapPlayNow(P, game = 'jaywalk') {
  await P.waitFor("!!document.querySelector('.nd-tab-play')", 20000);
  await P.ev("document.querySelector('.nd-tab-play').click()");
  if (!await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row')", 8000)) throw new Error('the shelf never opened');
  await P.ev(`document.querySelector('.nd-shelf-row[data-game="${game}"]').click()`);
  if (!await P.waitFor(`!!document.querySelector('.nd-card-sheet.is-in .nd-card[data-game="${game}"] .nd-card-solo')`, 8000)) throw new Error(`${game}'s card never opened`);
  await sleep(350);
  await P.ev(`document.querySelector('.nd-card-sheet.is-in .nd-card-solo').click()`);
}
// (a wake at the start's gate: host.js#justWoke — true for 30 s after any wake; the old code woke at every second room's first tick)
const wakes = P => P.ev("import('/js/host.js').then(h => ({ woke: h.justWoke(), why: (h.wakeState() || {}).why || '' }))").catch(() => ({ woke: null }));
const inGame = (P, ms = 30000) => P.waitFor(`${ROUTE}.startsWith('game:${GAME}') && !!(${S}.game && ${S}.game.id === '${GAME}')`, ms);
async function leave(P) {
  await P.ev('globalThis.__nsPlayNow && globalThis.__nsPlayNow.leave()').catch(() => {});
  return P.waitFor(`!${S}.code && ${ROUTE} === 'title'`, 20000);
}

try {
  if (!ONLY.length || ONLY.includes('bounce')) {
    const P = await phone();
    let bounced = 0;
    for (let i = 1; i <= ROUNDS; i++) {
      const w0 = await wakes(P);
      const t0 = Date.now();
      await tapPlayNow(P, GAME);
      const landed = await inGame(P, 30000);
      const w1 = await wakes(P), red = await P.red();
      if (!landed || red.length || w1.woke !== false) bounced++;
      ok(landed && red.length === 0 && w1.woke === false && w0.woke === false, `try ${i}: PLAY NOW → ${NAME} landed on ${await P.ev(ROUTE)} in ${((Date.now() - t0) / 1000).toFixed(1)} s · red messages ${red.length ? JSON.stringify(red) : 'none'} · a wake at the gate: ${w1.woke}${w1.why ? ` (${w1.why})` : ''}`);
      if (landed) await sleep(2500);   // (into the run's own start — then out, as the nephew did)
      ok(await leave(P), `try ${i}: left → the city`);
      await sleep(6500);   // (past STALL_GAP_MS on the city: the old clock read this as a stall)
    }
    ok(bounced === 0, `no bounce in ${ROUNDS} tries (${bounced} bounced)`);
    ok(P.errs.length === 0, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('quick')) {
    // (the start's promise is held through THE SOLO START's ~2 s walk — the game screen comes up as it ends — so the leave falls INSIDE the walk:
    //  the moment the match is written; then PLAY NOW's own call (title-taps.js: the card's solo tube → host.js#playSolo), no sheet in between)
    const P = await phone({ name: 'QUICK' }), N = Number(opt('quick', 10));
    const PLAY = `import('/js/host.js').then(h => { window.__pbSolo = null; h.playSolo('${GAME}').then(v => { window.__pbSolo = v; }, () => { window.__pbSolo = 'threw'; }); return true; })`;
    let good = 0;
    for (let i = 1; i <= N; i++) {
      const t0 = Date.now();
      await P.ev(PLAY);
      const wrote = await P.waitFor(`!!${S}.code && !!(${S}.game && ${S}.game.id === '${GAME}')`, 15000);
      const was = await P.ev(`({ code: ${S}.code, m: (${S}.game || {}).matchId || '' })`), tWrote = Date.now();
      await P.ev('globalThis.__nsPlayNow.leave().then(() => true)').catch(() => {});
      const out = await P.waitFor(`!${S}.code`, 8000), tLeft = Date.now();
      await P.ev(PLAY);
      const gap = Date.now() - tLeft;
      const landed = await P.waitFor(`${ROUTE}.startsWith('game:${GAME}:') && !!${S}.code && ${S}.code !== ${JSON.stringify(was.code)} && !!(${S}.game && ${S}.game.id === '${GAME}' && ${S}.game.matchId !== ${JSON.stringify(was.m)})`, 10000);
      const now = await P.ev(`({ route: ${ROUTE}, code: ${S}.code, m: (${S}.game || {}).matchId || '', solo: window.__pbSolo })`), red = await P.red();
      if (wrote && landed && !red.length) good++;
      ok(wrote && out && landed && gap <= 500 && red.length === 0, `quick ${i}: play (written ${tWrote - t0} ms) → left ${tLeft - tWrote} ms later → PLAY NOW again ${gap} ms after → ${now.route || 'the title'} · room ${was.code} → ${now.code || 'none'} · match ${now.m || 'NONE'} · playSolo → ${now.solo} · red ${red.length ? JSON.stringify(red) : 'none'}`);
      await leave(P);   // (out of the game — or out of the old code's orphan room — and straight into the next round)
    }
    ok(good === N, `quick: ${good} of ${N} landed on game:${GAME}:* in a row`);
    ok(P.errs.length === 0, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('newphone')) {
    const P = await phone({ fresh: true });
    const t0 = Date.now();
    await tapPlayNow(P);
    const named = await P.waitFor("!!document.querySelector('.setup-screen .input-name')", 3000);
    ok(named, `a brand-new phone: PLAY NOW → the name page at once (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    if (named) {
      await P.p.fill('.setup-screen .input-name', 'NEPHEW');
      await P.ev("document.querySelector('.setup-screen .form-cta .btn-primary').click()");
      const landed = await inGame(P, 40000);
      const red = await P.red();
      ok(landed && red.length === 0, `the name page's PLAY NOW → the game (${await P.ev(ROUTE)}; red messages ${red.length ? JSON.stringify(red) : 'none'})`);
    }
    ok(P.errs.length === 0, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
    await P.ctx.close();
  }
  if (!ONLY.length || ONLY.includes('deploy')) {
    // ONE DEPLOY AT A TIME's two builds (wk-onebuild's setup): build B = a boot module gains an export + JAYWALK's cartridge imports it
    const PORT = BROWSER === 'webkit' ? 5185 : 5186, A = 'aaaa1111', B = 'bbbb2222';
    const line = await startLine({ port: PORT, to: BASE, rtt: 15, mbps: 100, prod: true, build: A });
    // (THE HOUSEKEEPING PASS: the list AS SERVED — the bundle's row is the deploy's / the local server's, never in the committed file)
    const HASHES = (await (await fetch(`${BASE}/file-hashes.json`)).json()).files;
    const listRule = (path, tag) => ({ re: '^/file-hashes\\.json$', from: `"${path}":"${HASHES[path]}"`, to: `"${path}":"${tag.toLowerCase().repeat(12).slice(0, 12)}"` });
    // (a real deploy that changes a boot module changes THE FIRST-VISIT BUNDLE's copy of it + the bundle's hash too — wk-edge's rig)
    const rulesB = [listRule('/js/config.js', 'B'), listRule('/js/games/jaywalk/index.js', 'B'), listRule('/boot-bundle.json', 'C'),
      { re: '^/boot-bundle\\.json$', from: '["js/config.js","', to: '["js/config.js","export const __onlyB = 1;\\n' },
      { re: '^/js/config\\.js$', prepend: 'export const __onlyB = 1;\n' },
      { re: '^/js/games/jaywalk/index\\.js$', prepend: "import { __onlyB } from '../../config.js'; globalThis.__jwB = __onlyB;\n" }];
    try {
      const P = await phone({ fresh: true, base: `http://localhost:${PORT}`, sw: true });
      await P.waitFor('!!(navigator.serviceWorker && navigator.serviceWorker.controller)', 20000);
      if (!(await P.ev('!!(navigator.serviceWorker && navigator.serviceWorker.controller)'))) { await P.p.reload(); await P.waitFor(UP, 90000); }   // (the worker controls from the second load)
      await sleep(3500);   // (past the worker's 3-s trust in its build answer)
      line.set({ build: B, rules: rulesB });
      const n0 = P.navs.length;
      await tapPlayNow(P);
      if (await P.waitFor("!!document.querySelector('.setup-screen .input-name')", 5000)) {
        await P.p.fill('.setup-screen .input-name', 'NEPHEW');
        await P.ev("document.querySelector('.setup-screen .form-cta .btn-primary').click()");
      }
      const first = await P.waitFor(`${ROUTE}.startsWith('game:jaywalk') || window.__pbErr.length > 0`, 40000);
      const red = await P.ev('window.__pbErr.slice()').catch(() => []);
      const played = await P.ev(`${ROUTE}.startsWith('game:jaywalk')`).catch(() => false);
      ok(first, `after the deploy, PLAY NOW answered: ${played ? 'the game' : `a message ${JSON.stringify(red)}`} — never a dead tap`);
      if (!played) {
        // the ONE reload at this safe moment (the city, no sheet, no match) — then PLAY NOW again plays on B
        const t = Date.now(); while (P.navs.length === n0 && Date.now() - t < 10000) await sleep(150);
        ok(P.navs.length - n0 === 1, `a failed cartridge after a deploy → ONE reload (${P.navs.length - n0})`);
        await P.waitFor(UP, 90000); await sleep(1500);
        await tapPlayNow(P);
        ok(await inGame(P, 40000), `after the reload: PLAY NOW → the game (${await P.ev(ROUTE)})`);
        ok(await P.ev('globalThis.__jwB === 1'), "… on build B's cartridge (its new import linked)");
      } else ok(true, 'the cartridge linked on the first tap (the network\'s file agreed)');
      ok(P.navs.length - n0 <= 1, `never a reload loop (${P.navs.length - n0} reloads)`);
      if (P.navs.length - n0 > 1 || !played) console.log(P.cons.filter(c => /skew|boot|reload|error|gone/i.test(c)).slice(-16).join('\n'));
      await P.ctx.close();
    } finally { await line.close(); }
  }
} catch (e) { ok(false, `the run: ${e.message}`); }
await browser.close();
const bad = results.filter(r => !r.ok);
console.log(`e2e-play-bounce (${BROWSER}): ${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
