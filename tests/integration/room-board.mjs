// FIXES R2 — GROUP 3, THE BOARD IN A ROOM (the owner's nephew): the room dock's 5th tab. At 390 / 402 / 430 (Chromium as a touch phone, the
// emulators): HOST a room → the dock reads YOU · GUESTS · GAMES · BOARD · CHAT, every tab ≥ 44 × 44, the icons + labels at their size, the two
// rings fully on screen and clear of the pill; a tap on BOARD → THE BOARD's own screen (the room kept — still in it); its BACK → the room again.
//   node tests/integration/room-board.mjs "<chromium>"        (scripts/serve.mjs --emu + the emulators)
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
try {
  for (const [w, hgt] of [[390, 844], [402, 874], [430, 932]]) {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    const slot = `rb${w}`;
    await p.evaluateOnNewDocument(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, slot);
    await p.setViewport({ width: w, height: hgt, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    p.on('pageerror', e => fails.push(`${w}: page error ${e.message}`));
    await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&idle=1`, 'room-board.mjs'));
    await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
    await p.evaluate(() => document.querySelector('.nd-hostbtn').click());
    await p.waitForFunction(() => window.__arcade.state.code && document.querySelector('.rdk-board'), { timeout: 25000 });
    await new Promise(r => setTimeout(r, 1500));
    const m = await p.evaluate(() => {
      const tabs = [...document.querySelectorAll('.rdk-pill .rdk-tab')].map(t => { const r = t.getBoundingClientRect(), ic = t.querySelector('.nd-tab-ic').getBoundingClientRect(), lb = t.querySelector('.rdk-lbl'); return { l: lb.textContent, w: Math.round(r.width), h: Math.round(r.height), ic: Math.round(ic.width), fs: parseFloat(getComputedStyle(lb).fontSize), lw: Math.round(lb.getBoundingClientRect().width) }; });
      const pill = document.querySelector('.rdk-pill').getBoundingClientRect();
      const rings = [...document.querySelectorAll('.rdk-dock .nd-rslot')].map(x => x.getBoundingClientRect()).map(r => ({ l: Math.round(r.left), r: Math.round(r.right) }));
      return { tabs, pill: { l: Math.round(pill.left), r: Math.round(pill.right) }, rings, vw: innerWidth };
    });
    console.log(`  · ${w}: ${m.tabs.map(t => `${t.l} ${t.w}×${t.h} (icon ${t.ic}, label ${t.fs}px ${t.lw} wide)`).join(' · ')} · rings ${JSON.stringify(m.rings)} · pill ${m.pill.l}–${m.pill.r}`);
    ok(m.tabs.map(t => t.l).join(' · ') === 'YOU · GUESTS · GAMES · BOARD · CHAT', `${w}: the five tabs in order (${m.tabs.map(t => t.l).join(' · ')})`);
    ok(m.tabs.every(t => t.w >= 44 && t.h >= 44), `${w}: every tab ≥ 44 × 44 (${m.tabs.map(t => `${t.w}×${t.h}`).join(', ')})`);
    ok(m.tabs.every(t => t.fs === 8.5 && t.ic >= 24) && m.tabs.every(t => t.lw <= t.w), `${w}: the icons + labels at their CURRENT size, every label inside its tab`);
    ok(m.rings.length === 2 && m.rings[0].l >= 0 && m.rings[1].r <= m.vw && m.rings[0].r <= m.pill.l && m.rings[1].l >= m.pill.r, `${w}: both rings on screen, clear of the pill`);
    const code = await p.evaluate(() => window.__arcade.state.code);
    await p.evaluate(() => document.querySelector('.rdk-board').click());
    const opened = await p.waitForFunction(() => !!document.querySelector('.bd-screen'), { timeout: 15000 }).then(() => true, () => false);
    if (process.env.SHOTS && w === 390) await p.screenshot({ path: `${process.env.SHOTS}/room-board-open-390.png` });
    const still = await p.evaluate(() => window.__arcade.state.code);
    ok(opened && still === code, `${w}: BOARD → THE BOARD's screen, still in room ${code} (${opened ? 'opened' : 'NOT opened'}, ${still})`);
    await p.evaluate(() => { const b = document.querySelector('.bd-screen .bd-back, .bd-screen [aria-label="Back"]'); if (b) b.click(); });
    const back = await p.waitForFunction(() => !document.querySelector('.bd-screen') && !!document.querySelector('.rdk-board'), { timeout: 20000 }).then(() => true, () => false);
    ok(back, `${w}: THE BOARD's BACK → the room's dock again`);
    // PICK A GAME (the host's GAMES): every game wears its NEON MARK (the PLAY sheet's own — ui/mark-svg.js), its tagline + its line kept
    await new Promise(r => setTimeout(r, 1200));
    await p.evaluate(() => document.querySelector('.rdk-games').click());
    const pg = await p.waitForFunction(() => document.querySelectorAll('.rc-games .rc-game').length > 0, { timeout: 10000 }).then(() => p.evaluate(() => [...document.querySelectorAll('.rc-games .rc-game')].map(b => ({ g: b.dataset.game, mark: b.querySelectorAll('.rc-game-ic svg.nd-shelf-mark path').length, tile: !!b.querySelector('.rc-game-art') || !!b.querySelector('.rc-mark') || (() => { const i = b.querySelector('.rc-game-ic svg'); const cs = i && getComputedStyle(i); return !i || cs.backgroundImage !== 'none' || getComputedStyle(i.parentElement).backgroundImage !== 'none' || Math.round(i.getBoundingClientRect().width) !== 40; })(), tag: (b.querySelector('.rc-game-t small') || {}).textContent || '', line: (b.querySelector('.rc-game-t > span') || {}).textContent || '' }))), () => []);
    ok(pg.length >= 3 && pg.every(x => x.mark > 0 && !x.tile && x.tag && x.line), `${w}: PICK A GAME — each game the PLAY sheet's mark (40 px, nothing behind it) + tagline + line (${pg.map(x => `${x.g}: ${x.mark} tubes`).join(', ') || 'no sheet'})`);
    if (process.env.SHOTS && w === 390) { await new Promise(r => setTimeout(r, 700)); await p.screenshot({ path: `${process.env.SHOTS}/pick-a-game-390.png` }); }
    await ctx.close();
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
