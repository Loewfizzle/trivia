// Trivia repeats across rematches: plays Overclock / Last Signal several times in one room (live trivia
// APIs, emulators + scripts/serve.mjs) and checks no question is dealt twice. Usage: node trivia-rematch.mjs "<browser path>"
import puppeteer from 'puppeteer-core';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = 'http://localhost:5173/?emu';
const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true });
const errors = [];
async function player(slot, name) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await p.setViewport({ width: 390, height: 844, isMobile: true });
  await p.goto(`${BASE}&slot=t${slot}`);
  await p.waitForSelector('.nd-host');
  await sleep(800);
  return p;
}
const host = await player(1, 'HOST');
await host.evaluate(() => document.querySelector('.nd-host').click());
await host.waitForSelector('.setup-screen input.input');
await host.type('.setup-screen input.input', 'HOST');
await host.evaluate(() => document.querySelector('.form-cta .btn-primary').click());
await host.waitForSelector('.lobby-screen .room-code');
const code = await host.evaluate(() => window.__arcade.state.code);
const ctx2 = await b.createBrowserContext();
const guest = await ctx2.newPage();
guest.on('pageerror', e => errors.push('GUEST: ' + e.message));
await guest.setViewport({ width: 390, height: 844, isMobile: true });
await guest.goto(`${BASE}&slot=t2&room=${code}`);
await guest.waitForSelector('.nd-go', { timeout: 20000 });
await guest.evaluate(() => document.querySelector('.nd-go').click());
await guest.waitForSelector('.input-code');
await guest.type('.setup-screen input.input:not(.input-code)', 'GUEST');
await guest.evaluate(() => document.querySelector('.form-cta .btn-primary').click());
await guest.waitForSelector('.lobby-screen', { timeout: 20000 });

await sleep(2500);

const seenBy = {};
let repeats = 0;
const plan = ['overclock', 'overclock', 'overclock', 'signal', 'overclock', 'signal'];
for (const [i, id] of plan.entries()) {
  const started = await host.evaluate(async (id) => (await import('/js/host.js')).startGame(id, id === 'signal' ? { hp: 100, cats: [] } : { mode: 'standard' }), id);
  if (!started) throw new Error('start failed');
  await sleep(1500);
  const info = await host.evaluate(() => { const s = window.__arcade.state; return { matchId: s.game.matchId, seen: Object.keys(s.game.trivia.seen || {}), used: Object.keys((s.meta.used && s.meta.used.trivia) || {}).length }; });
  const dup = info.seen.filter(h => seenBy[h]);
  repeats += dup.length;
  info.seen.forEach(h => { seenBy[h] = info.matchId; });
  console.log(`match ${i + 1} ${id}: ${info.seen.length} questions banked, ${dup.length} repeated from earlier matches, room remembers ${info.used}`);
  await host.evaluate(async () => (await import('/js/host.js')).backToLobby());
  await sleep(6000); // Open Trivia DB allows one request per 5 s
}
await b.close();
if (errors.length) console.log('PAGE ERRORS', errors);
if (repeats || errors.length) { console.log(`FAILED: ${repeats} repeats`); process.exit(1); }
console.log('NO REPEATS ACROSS MATCHES');
