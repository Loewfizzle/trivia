// Frame-pacing probe for LAST SIGNAL's decay effects (2 players, host tab in the foreground).
//   node perf-signal.mjs "<browser path>"
import puppeteer from 'puppeteer-core';

const BROWSER = process.argv[2] || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://localhost:5173/?emu';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });

async function player(name, code) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await p.goto(code ? `${BASE}&room=${code}` : BASE);
  await p.waitForSelector(code ? '.nd-go' : '.nd-actions');
  await p.evaluate(sel => document.querySelector(sel).click(), code ? '.nd-go' : '.nd-host');
  await p.waitForSelector('.setup-screen input.input:not(.input-code)');
  await p.type('.setup-screen input.input:not(.input-code)', name);
  await p.evaluate(() => document.querySelector('.form-cta .btn-primary').click());
  await p.waitForSelector('.lobby-screen .room-code');
  return p;
}
const fps = page => page.evaluate(() => new Promise(res => {
  const t = []; const step = now => { t.push(now); if (now - t[0] < 3000) requestAnimationFrame(step); else {
    const g = t.slice(1).map((x, i) => x - t[i]); const avg = g.reduce((a, b) => a + b, 0) / g.length;
    res({ fps: Math.round(1000 / avg), worst: Math.round(Math.max(...g)), over33: g.filter(x => x > 33).length });
  } }; requestAnimationFrame(step);
}));

const host = await player('HOST');
const code = (await host.$eval('.room-code', e => e.textContent)).trim();
const guest = await player('GUEST', code);
await host.bringToFront();
await host.evaluate(() => document.querySelector('.game-card[data-theme="signal"]').click());
await host.waitForSelector('.modal .options');
await sleep(600);
await host.evaluate(() => document.querySelector('.modal .options .btn-primary').click());
await host.waitForSelector('.ls-play:not(.is-hidden)', { timeout: 30000 });
await sleep(800);
console.log('normal (decay 0)  ', JSON.stringify(await fps(host)));
await host.evaluate(() => { const r = document.querySelector('.ls'); r.style.setProperty('--decay', '1'); r.classList.add('decay-1', 'decay-2', 'decay-3'); });
await sleep(300);
console.log('max decay         ', JSON.stringify(await fps(host)));
await host.addStyleTag({ content: '.screen.ls::before, .screen.ls::after { display: none !important; }' });
await sleep(300);
console.log('decay, no layers  ', JSON.stringify(await fps(host)));
await host.addStyleTag({ content: '.bg-noise, .bg-grid { animation: none !important; }' });
await sleep(300);
console.log('+ static bg       ', JSON.stringify(await fps(host)));
await browser.close();
void guest;
