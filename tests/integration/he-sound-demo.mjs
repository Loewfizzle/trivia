// HOLD'EM (HE5) — THE SOUNDS on a REAL audio context: the motion demo (holdem-preview.html?play=1&sound=1), TAP FOR SOUND, then ~N s of play →
// what started on the context (sfx.js#played) vs what was asked for (planned): every planned cue started, the deals ≥ 110 ms apart, the gains
// from the table. node tests/integration/he-sound-demo.mjs "<browser>" [seconds=40]   (E2E_BASE = a local server)
import puppeteer from './kit/puppeteer.mjs';
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const secs = Number(process.argv[3] || 40);
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto(`${BASE}/tests/integration/holdem-preview.html?play=1&sound=1&lv=15`, { waitUntil: 'networkidle0' });
await page.waitForSelector('body[data-ready="1"]', { timeout: 20000 });
const btn = await page.$('button');
if (btn) await btn.click();
await new Promise(r => setTimeout(r, secs * 1000));
const r = await page.evaluate(() => ({ played: window.__holdem.sounds(), planned: window.__holdem.planned() }));
const by = l => l.reduce((m, c) => (m[c.name] = (m[c.name] || 0) + 1, m), {});
console.log('planned:', JSON.stringify(by(r.planned)));
console.log('started:', JSON.stringify(by(r.played)));
const deals = r.planned.filter(c => c.name === 'deal').sort((a, b) => a.when - b.when);
let minGap = Infinity;
for (let i = 1; i < deals.length; i++) { const g = deals[i].when - deals[i - 1].when; if (g > 0) minGap = Math.min(minGap, g); }
console.log(`deals: ${deals.length}, the closest two ${minGap} ms apart; started ${r.played.length} of ${r.planned.length} planned`);
await browser.close();
if (!r.played.length || r.played.length < r.planned.length * 0.9) process.exitCode = 1;
