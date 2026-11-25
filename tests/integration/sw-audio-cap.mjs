// THE HOUSEKEEPING + AUDIO PASS (Nov 25) — THE SONG CAP in a real browser (sw.js: the na-audio-v1 cache kept EVERY song a phone ever heard):
// the worker registered by the test (localhost skips it), a SMALL cap set through its local-only rig (ns:test-audio-cap), real songs fetched
// whole (what music.js's prefetch does):
//   · songs within the cap are all kept; one more → the LEAST RECENTLY USED goes
//   · a song USED again (a hit — the song playing) is kept, the next-oldest goes instead
//   · the newest `keep` stay even over the cap; an EFFECT (/audio/sfx/…) is never counted or evicted
//   · the index survives the worker (META /__ause) — read back from the cache itself
//   node tests/integration/sw-audio-cap.mjs "<chromium>"     (scripts/serve.mjs on :5173; E2E_BASE for another port)
import puppeteer from './kit/puppeteer.mjs';
import { readdirSync, statSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = guardUrl(process.env.E2E_BASE || 'http://localhost:5173', 'sw-audio-cap');
const fails = [];
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); if (!c) fails.push(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
// six real songs, the smallest ones (the test downloads them from the local server)
const DIR = new URL('../../audio/music/', import.meta.url);
const songs = readdirSync(DIR).filter(f => f.endsWith('.mp3')).map(f => ({ f, z: statSync(new URL(f, DIR)).size })).sort((a, b) => a.z - b.z).slice(0, 6);
const url = s => `/audio/music/${s.f}?v=1`;
const sum = list => list.reduce((n, s) => n + s.z, 0);

const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
try {
  const p = await browser.newPage();
  await p.goto(`${BASE}/404.html`);
  await p.evaluate(() => navigator.serviceWorker.register('/sw.js'));
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload();
  for (let i = 0; i < 100 && !(await p.evaluate('!!navigator.serviceWorker.controller')); i++) await sleep(100);
  ok(await p.evaluate('!!navigator.serviceWorker.controller'), 'the worker controls the page');
  await p.evaluate(() => caches.delete('na-audio-v1'));
  const cap = (max, keep) => p.evaluate(([max, keep]) => new Promise(res => { const on = e => { if (e.data && e.data.t === 'ns:audio-cap') { navigator.serviceWorker.removeEventListener('message', on); res(e.data); } }; navigator.serviceWorker.addEventListener('message', on); navigator.serviceWorker.controller.postMessage({ t: 'ns:test-audio-cap', max, keep }); setTimeout(() => res(null), 3000); }), [max, keep]);
  const kept = () => p.evaluate(() => caches.open('na-audio-v1').then(c => c.keys()).then(ks => ks.map(k => new URL(k.url).pathname + new URL(k.url).search)));
  const get = async u => { await p.evaluate(u => fetch(u).then(r => r.arrayBuffer()).then(b => b.byteLength), u); await sleep(350); };   // (a whole file, like music.js's prefetch; the put + the trim follow the answer)
  const waitKept = async (want, ms = 6000) => { const t0 = Date.now(); let k = []; while (Date.now() - t0 < ms) { k = (await kept()).filter(x => x.startsWith('/audio/music/')).sort(); if (JSON.stringify(k) === JSON.stringify(want.slice().sort())) return k; await sleep(120); } return k; };

  // the cap: room for exactly the three BIGGEST of the first four (so the fourth song forces one out), the newest 2 always kept
  const [a, b, c, d, e, f] = songs;
  const max = sum([b, c, d]) + 1000;
  const set = await cap(max, 2);
  ok(set && set.max === max && set.keep === 2, `the rig set the cap: ${(max / 1048576).toFixed(1)} MB, the newest 2 always kept (the live rule: 60 MB, 3)`);
  await get('/audio/sfx/' + readdirSync(new URL('../../audio/sfx/', import.meta.url)).filter(x => x.endsWith('.mp3'))[0]);
  const fx = (await kept()).filter(x => x.startsWith('/audio/sfx/'));
  ok(fx.length === 1, `an EFFECT is kept as before (${fx[0]})`);
  await get(url(a)); await get(url(b)); await get(url(c));
  let k = await waitKept([url(a), url(b), url(c)]);
  ok(k.length === 3, `three songs within the cap: all kept (${k.length})`);
  await get(url(d));                                           // over the cap now: a + b + c + d > max
  k = await waitKept([url(b), url(c), url(d)]);
  ok(JSON.stringify(k) === JSON.stringify([url(b), url(c), url(d)].sort()), `a fourth song → the LEAST RECENTLY USED (${a.f}) is evicted; kept: ${k.map(x => x.split('/').pop().split('?')[0]).join(' ')}`);
  // USE b again (the song playing: a hit), then a fifth song: c — now the least recently used — goes, b stays
  await get(url(b));
  await get(url(e));
  k = await waitKept([url(b), url(d), url(e)]);
  const sizes = Object.fromEntries(songs.map(s => [url(s), s.z]));
  ok(k.includes(url(b)) && !k.includes(url(c)), `a song USED again is kept — the next-oldest goes instead (kept: ${k.map(x => x.split('/').pop().split('?')[0]).join(' ')})`);
  ok(k.reduce((n, u) => n + (sizes[u] || 0), 0) <= max || k.length <= 2, `the kept songs fit the cap (${(k.reduce((n, u) => n + (sizes[u] || 0), 0) / 1048576).toFixed(1)} of ${(max / 1048576).toFixed(1)} MB)`);
  // a cap smaller than ONE song: the newest two still stay (the song playing + the station's next)
  await cap(1000, 2);
  await get(url(f));
  k = await waitKept([url(e), url(f)]);
  ok(JSON.stringify(k) === JSON.stringify([url(e), url(f)].sort()), `under a cap smaller than one song the newest two STAY (${k.map(x => x.split('/').pop().split('?')[0]).join(' ')})`);
  ok((await kept()).filter(x => x.startsWith('/audio/sfx/')).length === 1, 'the effect was never counted or evicted');
  const st = await cap(0, -1);
  ok(st && st.evicted >= 4 && Object.keys(st.index).length === 2, `the worker's index holds exactly the kept songs (${Object.keys(st.index).length}); ${st.evicted} evicted in all`);
  // the kept song still answers a RANGE request from its copy (the media element's way)
  const rng = await p.evaluate(u => fetch(u, { headers: { Range: 'bytes=0-99' } }).then(async r => ({ s: r.status, n: (await r.arrayBuffer()).byteLength, cr: r.headers.get('content-range') })), url(f));
  ok(rng.s === 206 && rng.n === 100 && /^bytes 0-99\//.test(rng.cr || ''), `a kept song still answers a range from its copy (${rng.s}, ${rng.n} bytes, ${rng.cr})`);
  await p.evaluate(() => caches.delete('na-audio-v1').then(() => navigator.serviceWorker.getRegistrations()).then(rs => Promise.all(rs.map(r => r.unregister()))));
} finally { await browser.close(); }
console.log(fails.length ? `${fails.length} FAILED` : 'sw-audio-cap: all green');
process.exit(fails.length ? 1 : 0);
