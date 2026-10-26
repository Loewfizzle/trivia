// The look-review camera: screenshots of the title (or any URL state) at the sizes that matter, in one command.
// Replaces the throwaway _something-shots scripts. Needs scripts/serve.mjs (--emu for anything that opens a room).
//
//   node shots.mjs "<browser>" [--scenes night,day,halloween] [--sizes phones|desktop|all|390x844,412x915] [--place gr|ny|none]
//                  [--crop dock,corner,sign | --crop 0,1400,780,300] [--qs "wx=rain&force=lightning"] [--out ./shots-review]
//                  [--wait 2600] [--guest] [--preview] [--city 2] [--safe] [--tier 0|1|2] [--zoom 3 [--zx 0.5]]
// --tier: CITY 2.0 — the scene forced to that quality tier (setTier) before the shot. --zoom N: each crop's device pixels blown
//   up N × N (nearest neighbour: no blur), its width cut to 1/N around --zx (0..1 across, default the middle) — seams, ripples
//   and tubes looked at pixel by pixel. A custom crop in pt: --crop XxYxWxH (a comma separates crops).
// --page <path?query>: shoot any page of the site instead of the title (e.g. tests/integration/clouds-preview.html?looks=noon), full
//   length, once its body has data-ready (or after --wait); one shot per size, named by --name (default "page").
// --preview: shoot title-preview.html (the real title, no Firebase / emulators needed; HOST and JOIN don't open rooms there).
// --city 2: CITY 2.0, THE HARBOR (docs/harbor.md): adds &city=2 (any extra flag via --qs, e.g. "grid=1" or "force=demo");
//   --sizes harbor = the six review sizes (four phones upright, a phone sideways, desktop); --safe emulates the iPhone's
//   safe areas (62 / 34 pt upright, 21 pt at the bottom sideways); --crop stage = the near stage (the road to the dock);
//   --crop skyline = the skyline close up (above the crowns to the far quay); skyl / skyr = its left / right half (signs + neon
//   up close); logo = the NEON logo; water = the harbor's water close up (Part 4: from 60 pt above the waterline to the road).
//   bill = THE BILLBOARD close up (its lamps, the poster, the steel; M3). shop = the barbershop's front close up (FP2's lights);
//   pole = the barber pole alone (with --every 16 --count 12 --zoom 4 --dsf 3: its turn frame by frame, at an iPhone's dpr).
//   e.g. node shots.mjs "<browser>" --preview --city 2 --safe --sizes harbor --scenes day,golden,night,party,rain,snow
//
// Scenes (built in; or name=YYYY-MM-DDTHH:MM for any moment): night day ramp catch dawn first join halloween christmas
// valentine rejoin sun rain rainbow rainbow2 moonbow neonbow blossom summer autumn autumn-night winter plow owl day-bus golden
// street-party street-rain umbrellas party-line hail small-hours halloween-kids nye-sparklers door door-day party snow. --crop street: the street strip (the towers' feet down to the dock). "first" has no profile; --guest makes every scene a first-time visitor.
// --idle: the screen AT REST before the shot (the dock + the tagline faded away: title.js#goIdle, then the 1.8 s fade) — FP2's
//   street under the dock. --crop band = the band under the dock (the promenade's front edge down to the screen's foot).
// --load: FP3a — THE LOAD GATE's burst: the shots start at the navigation itself (--every ms --count n from t = 0, no wait for the
//   intro), so the reveal is seen frame by frame. --net 3g|4g: a cellular network (Fast 3G 1.6 Mbps / 150 ms; 4G 9 Mbps / 60 ms) —
//   a fresh context has no cache: a first visit on a phone. --cpu N: the CPU slowed N × (4 ≈ a phone's worst moments).
//   e.g. node shots.mjs "<browser>" --city 2 --scenes day --sizes 402x874 --load --net 3g --cpu 4 --every 250 --count 24
// --until "<expr>": SP5 — wait until the expression is truthy in the page (≤ --until-ms, 90 s) before the shot — e.g. --until "__district.harbor().speakeasy.life.boss.watch"
// --cast ms: C2 — a TRUE frame burst: a CDP screencast for ms after the wait (+ --js), every frame the page paints saved as
//   <scene>-<w>x<h>-cast-<nnn>-<t ms>.jpg (t from the cast's start) — a flicker a 200 ms screenshot burst steps over shows here
//   (e.g. the TR-3B's power coming back: --qs "force=tr3b" --js "__district.harbor().legend.start('tr3b',{at:Date.now()-32000})" --cast 9000)
// Each shot gets its own browser context (no profile leaking between shots). Files: <scene>-<w>x<h>[-<crop>].png
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const BROWSER = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = String(opt('out', './shots-review')).replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const WAIT = Number(opt('wait', 2600));
// --every ms --count n: a burst of n shots of each scene, ms apart (motion: the lighthouse's beam, the wheel's bulb show, a boat)
const EVERY = Number(opt('every', 0)), COUNT = EVERY ? Number(opt('count', 4)) : 1;
const GUEST = !!opt('guest', false);
const PREVIEW = !!opt('preview', false);
const PLACES = { gr: '&tz=America/Detroit&at=42.96,-85.67', ny: '&tz=America/New_York', none: '' };
const PLACE = PLACES[opt('place', 'gr')] ?? PLACES.gr;
const CITY = opt('city', '') ? `&city=${opt('city')}` : '';
const SAFE = !!opt('safe', false);
const TIER = opt('tier', '') === '' ? null : Number(opt('tier')), ZOOM = Number(opt('zoom', 0)) || 0, ZX = Number(opt('zx', 0.5));
const IDLE = !!opt('idle', false);
// --dsf N: the device scale factor (default 2 on a phone size, 1 on desktop) — FP2: the barber pole's frame burst at dpr 3 (an iPhone)
const DSF = Number(opt('dsf', 0)) || 0;
const EXTRA = opt('qs', '') ? `&${opt('qs')}` : '';
// --when 2026-10-26T06:00:30: every scene at that moment instead of its own (8b1: a worker's show, a wildlife moment)
const WHEN = opt('when', '') || '';
const LOAD = !!opt('load', false), NET = { '3g': { latency: 150, down: 1.6e6, up: 0.75e6 }, '4g': { latency: 60, down: 9e6, up: 3e6 } }[opt('net', '')] || null, CPU = Number(opt('cpu', 0)) || 0;
const SIZE_SETS = { phones: '390x844,393x852,430x932,412x915', desktop: '1440x900', all: '390x844,393x852,430x932,412x915,1440x900', quick: '390x844,1440x900', harbor: '390x844,402x874,412x915,430x932,874x402,1440x900' };
const SIZES = String(SIZE_SETS[opt('sizes', 'quick')] || opt('sizes')).split(',').map(s => s.split('x').map(Number));
// [when, options] — dates are Grand Rapids' 19 Oct 2026 unless the scene is a holiday
const SCENE = {
  night: ['2026-10-19T22:30'], day: ['2026-10-19T13:30'], ramp: ['2026-10-19T18:20'], catch: ['2026-10-19T18:56'],
  dawn: ['2026-10-20T08:20'], first: ['2026-10-19T22:30', { guest: true }], join: ['2026-10-19T22:30', { act: 'join' }],
  halloween: ['2026-10-31T21:30'], christmas: ['2026-12-24T21:30'], valentine: ['2027-02-14T21:00'],
  rejoin: ['2026-10-19T22:30', { act: 'rejoin' }], sun: ['2026-10-19T13:30', { act: 'sun' }], rain: ['2026-10-19T22:30', { qs: 'wx=rain' }],
  // RAINBOWS (forced: they fade in over 8 s — use --wait 10000; the fade itself: --wait 4500)
  rainbow: ['2026-10-19T17:15', { qs: 'force=rainbow' }], rainbow2: ['2026-10-19T17:15', { qs: 'force=rainbow2' }],
  moonbow: ['2026-10-26T22:00', { qs: 'force=moonbow' }], neonbow: ['2026-10-23T22:30', { qs: 'force=neonbow' }],
  // THE STREET (lamps + trees through the year, buses, the stop light, plows, shadows, the street's party night)
  blossom: ['2026-04-05T20:30'], summer: ['2026-07-10T22:15'], autumn: ['2026-10-24T16:30', { qs: 'wind=11&force=gust' }],
  'autumn-night': ['2026-10-24T22:00'], winter: ['2026-12-18T19:00'], plow: ['2027-01-15T19:00', { qs: 'wx=snow&force=plow' }],
  owl: ['2026-10-22T01:10', { qs: 'force=owl' }], 'day-bus': ['2026-10-20T11:00', { qs: 'force=bus' }], golden: ['2026-10-20T18:15'],
  'street-party': ['2026-10-23T23:00', { qs: 'force=partybus,chase' }], 'street-rain': ['2026-10-23T23:00', { qs: 'wx=rain&force=partybus' }],
  // THE STREET, Part 2 (the people)
  umbrellas: ['2026-10-21T21:30', { qs: 'wx=rain&force=peds,umbrellas' }], 'party-line': ['2026-10-23T23:15', { qs: 'force=line,door' }],
  hail: ['2026-10-21T21:30', { qs: 'force=hail,peds' }], 'small-hours': ['2026-10-22T03:00'], 'halloween-kids': ['2026-10-31T19:30', { qs: 'force=halloween-kids' }],
  // party nights (a Saturday at the peak) and real snow — both cities
  party: ['2026-10-24T23:00'], snow: ['2026-12-18T21:00', { qs: 'wx=snow' }],
  // THE WATER (City 2.0, Part 4): a calm night (a crisp mirror), a windy one (broken columns), the moon's path (a waxing gibbous
  // high in the south-east at 21:00 on Oct 24), sunset's gold path
  calm: ['2026-10-19T22:30', { qs: 'wind=0.5' }], windy: ['2026-10-19T22:30', { qs: 'wind=13' }], moon: ['2026-10-25T20:30', { qs: 'wind=3' }], sunset: ['2026-10-20T18:30', { qs: 'wind=3' }],
  'nye-sparklers': ['2027-01-01T00:01'], door: ['2026-10-21T22:00', { qs: 'force=door,hint' }], 'door-day': ['2026-10-21T13:00'],
  // CITY 2.0, Part 6a — THE EVERYDAY SKY (each forced piece; wait: how long it flies before the shot). --crop sky = the sky lanes
  'sky-day': ['2026-10-21T13:00', { qs: 'force=planes' }], 'sky-night': ['2026-10-21T22:00', { qs: 'force=approach' }],
  'sky-golden': ['2026-10-20T18:20', { qs: 'force=planes' }],
  banner: ['2026-10-21T13:00', { qs: 'force=banner&text=FRESH%20LEMONADE|AT%20THE%20PIER', wait: 15000 }],
  skywrite: ['2026-10-21T13:00', { qs: 'force=skywrite&text=HELLO&wind=2', wait: 26000 }],
  skytype: ['2026-10-21T13:00', { qs: 'force=skytype&text=HAPPY%20BIRTHDAY%20STEVE&wind=2', wait: 24000 }],
  helicopter: ['2026-10-21T22:00', { qs: 'force=helicopter', wait: 20000 }], 'helicopter-day': ['2026-10-21T13:00', { qs: 'force=helicopter', wait: 20000 }],
  'balloons-dawn': ['2026-10-21T08:40', { qs: 'force=balloons&wind=1', wait: 9000 }], 'balloons-dusk': ['2026-07-10T21:20', { qs: 'force=balloon-festival&wind=1', wait: 9000 }],
  gulls: ['2026-10-21T15:00', { wait: 4000 }], geese: ['2026-10-21T15:00', { qs: 'force=geese', wait: 14000 }], swifts: ['2026-07-10T21:25', { qs: 'force=swifts,bats-dusk', wait: 6000 }],
  moonrise: ['2026-10-26T19:40'], harvest: ['2026-09-26T20:05'], crescent: ['2026-11-14T19:30'], 'crescent-dawn': ['2026-10-07T06:00'], eclipse: ['2026-10-26T22:30', { qs: 'force=eclipse', wait: 20000 }],
  aurora: ['2026-10-21T23:30', { qs: 'force=aurora', wait: 5000 }],
  // CITY 2.0 — THE DAY PASS (Oct 22 2026, Grand Rapids): morning, high noon, afternoon, golden hour, a fair-weather + an overcast day,
  // and the night + the party to compare side by side (--sizes 402x874 --crop skyl,skym,skyr)
  'd-morn': ['2026-10-22T09:00'], 'd-noon': ['2026-10-22T12:30'], 'd-aft': ['2026-10-22T16:00'], 'd-golden': ['2026-10-22T18:20'],
  'd-clouds': ['2026-10-22T13:00', { qs: 'wx=clouds' }], 'd-overcast': ['2026-10-22T13:00', { qs: 'wx=overcast' }],
  'd-night': ['2026-10-22T22:00'], 'd-party': ['2026-10-24T23:00'],
  // FP2 (Oct 24): the party's earlier night (the warm-up from 8:30, the peak from 9:30) + spring noon (the crabapple's blossom)
  'fp-warm': ['2026-10-24T20:45'], 'fp-peak': ['2026-10-24T21:45'], 'fp-spring': ['2026-10-22T12:30', { qs: 'season=spring' }],
  // (8a — the trees through a season, by the real date: the crabapple's buds, its full blossom, the maples' late autumn thinning)
  'tr-bud': ['2026-04-16T11:00'], 'tr-bloom': ['2026-05-05T11:00'], 'tr-early': ['2026-10-01T11:00'], 'tr-late': ['2026-11-15T11:00'],
  // (7a §0: the title's ☰ menu open — the split corners: it drops from the top-left)
  'menu-open': ['2026-10-22T22:00', { act: 'menu' }],
  // CITY 2.0 — SKY POLISH (Oct 23 2026): the owner's review list (--sizes 402x874 --crop sky,skyl3,skym,skyr3); sp-plane: a forced
  // airliner with its contrail; sp-cirrus / sp-veil: the high cloud by its height (&wx=cirrus / &wx=veil — the moon's 22° halo)
  'sp-morn': ['2026-10-22T09:00'], 'sp-noon': ['2026-10-22T12:30'], 'sp-cloudy': ['2026-10-22T13:00', { qs: 'wx=clouds' }],
  'sp-overcast': ['2026-10-22T13:00', { qs: 'wx=overcast' }], 'sp-golden': ['2026-10-22T18:20', { qs: 'wx=clouds' }],
  'sp-sunset': ['2026-10-22T18:45', { qs: 'wx=clouds' }], 'sp-dawn': ['2026-10-23T07:45'], 'sp-night': ['2026-10-22T22:00', { qs: 'wx=clouds' }],
  'sp-party': ['2026-10-24T23:00', { qs: 'wx=clouds' }], 'sp-plane': ['2026-10-22T11:00', { qs: 'force=planes', wait: 16000 }],
  'sp-cirrus': ['2026-10-22T11:00', { qs: 'wx=cirrus' }], 'sp-cirrus-set': ['2026-10-22T18:45', { qs: 'wx=cirrus' }], 'sp-veil': ['2026-10-26T23:30', { qs: 'wx=veil' }],
  // CITY 2.0 — THE PREVIEW PANEL (the owner's test remote; --city 2 --preview): the sheet open (JUST ME / EVERYONE, events on,
  // scrolled down to the time + weather, the bottom with the tools). PART 7a §0: the categories — cats: the open ones (none = all
  // collapsed; '*' = every one); panel-on: two open with things on; panel-dots: collapsed, the dots + what's on; panel-end: all open, the bottom
  panel: ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel' }], 'panel-on': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', cats: ['sky', 'signs'], on: { force: ['drones', 'spell', 'neon-scheme'], text: 'HI THERE', show: 'heart', colours: 'ff2e97,2ee6ff', scheme: 'halloween' } }],
  'panel-dots': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', on: { force: ['aurora', 'road-pass', 'neon-scheme'], scheme: 'halloween', wx: 'rain', when: '2026-10-24T23:00', speed: 20 } }],
  'panel-all': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', mode: 'all', cats: ['time'] }], 'panel-time': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', cats: ['time', 'weather'], on: { wx: 'snow' } }],
  'panel-end': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', scroll: 1, mode: 'all', cats: '*' }],
  'panel-towers': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', cats: ['lights'], scroll: 0.36, on: { force: ['spell'], text: 'HAPPY BIRTHDAY SAM &', tower: 'wordA,wordB,wordV' } }],
  // C2 — THE PANEL REWORK (full screen, nine sections): the legendaries + the people open; LIGHTS + MUSIC with the party on. The search
  // and the 3-2-1 chip: --js "__district.remote().search('rain')" / --js "__district.remote().close(), __district.remote().previewCountdown('me', 3)"
  'panel-legend': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', cats: ['legendary', 'people'], on: { force: ['ufo', 'work-milk'] } }],
  'panel-lights': ['2026-10-22T21:30', { qs: 'panel=1', act: 'panel', cats: ['lightsmusic'], on: { party: 'on', scene: 'climb+crowns', force: ['searchlights'] } }],
  drones: ['2026-10-21T22:00', { qs: 'force=drones&text=HELLO&show=heart', wait: 26000 }], 'drones-launch': ['2026-10-21T22:00', { qs: 'force=drones&text=HELLO&show=heart', wait: 9000 }], 'drones-text': ['2026-10-21T22:00', { qs: 'force=drones&text=HELLO&show=heart', wait: 40000 }],
};
const scenes = String(opt('scenes', 'night,day')).split(',').filter(Boolean).map(s => {
  const [name, when] = s.split('=');
  if (when) return [name, when, {}];
  if (!SCENE[name]) throw new Error(`unknown scene "${name}" (known: ${Object.keys(SCENE).join(' ')}, or name=YYYY-MM-DDTHH:MM)`);
  return [name, SCENE[name][0], SCENE[name][1] || {}];
});
const CROPS = String(opt('crop', '') || '').split(',').filter(Boolean);
// crop presets: an element's box, padded (the dock: the whole group; the corner: both buttons; the sign: logo + tagline)
const PRESET = { dock: ['.nd-actions', 24], corner: ['.menu-btn, .music-btn', 10], sign: ['.nd-sign', 16] };

const sleep = ms => new Promise(r => setTimeout(r, ms));
// --zoom: the shot's own pixels drawn N × N on a page of their own (image-rendering: pixelated — no blur) and shot again
async function magnify(ctx, buf, k, path) {
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), q = await ctx.newPage();
  await q.setViewport({ width: w * k, height: h * k, deviceScaleFactor: 1 });
  await q.setContent(`<body style="margin:0;background:#000"><img src="data:image/png;base64,${buf.toString('base64')}" style="display:block;width:${w * k}px;height:${h * k}px;image-rendering:pixelated"></body>`);
  await q.waitForFunction(() => document.images[0].complete);
  await q.screenshot({ path }); await q.close();
}
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });
const PAGE = opt('page', '');
if (PAGE) {
  for (const [w, h] of SIZES) {
    const p = await browser.newPage();
    p.on('pageerror', e => console.log('PAGEERROR', e.message));
    await p.setViewport({ width: w, height: h, deviceScaleFactor: DSF || 1 });   // (11a-1: --dsf on a --page too)
    await p.goto(`${BASE}/${String(PAGE).replace(/^\/+/, '')}`);
    await p.waitForFunction(() => document.body && document.body.dataset.ready, { timeout: 60000 }).catch(() => {});
    await sleep(opt('wait', 0) ? WAIT : 300);
    await p.screenshot({ path: `${OUT}${opt('name', 'page')}-${w}x${h}.png`, fullPage: true }); await p.close();
  }
  console.log(`${SIZES.length} page shot(s) in ${OUT}`);
  await browser.close(); process.exit(0);
}
let n = 0;
for (const [w, h] of SIZES) for (const [name, when, o] of scenes) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log(`${name} ${w}x${h} PAGEERROR`, e.message));
  const mobile = w < 1000;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: DSF || (mobile ? 2 : 1), isMobile: mobile, hasTouch: mobile });
  if (SAFE) await p.evaluateOnNewDocument((st, sb) => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `:root{--safe-t:${st}px !important;--safe-b:${sb}px !important}`; document.head.appendChild(s); }); }, mobile && h > w ? 62 : 0, mobile ? (h > w ? 34 : 21) : 0);
  await p.evaluateOnNewDocument(guest => {
    try { localStorage.setItem('nd:entered', '1'); if (!guest) localStorage.setItem('na:sh:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  }, GUEST || !!o.guest);
  const qs = `when=${WHEN || when}${PLACE}${o.qs ? `&${o.qs}` : ''}${CITY}${EXTRA}`;
  if (NET || CPU) {
    const cdp = await p.target().createCDPSession();
    if (NET) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET.latency, downloadThroughput: NET.down / 8, uploadThroughput: NET.up / 8 }); }
    if (CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  }
  const nav = p.goto(PREVIEW ? `${BASE}/tests/integration/title-preview.html?${qs}${GUEST || o.guest ? '&guest=1' : ''}` : `${BASE}/?emu&slot=sh&${qs}`, { timeout: 90000 });
  if (!LOAD) {
    await nav;
    await p.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 25000 });
    if (TIER !== null) await p.evaluate(t => window.__district.setTier(t), TIER);
    await sleep(o.wait && !opt('wait', 0) ? o.wait : WAIT);
  } else nav.catch(() => {});
  if (o.act === 'join') { await p.evaluate(() => window.__district.dock.join(true)); await sleep(500); await p.type('.nd-code-in', 'mi'); await sleep(400); }
  if (o.act === 'rejoin') { await p.evaluate(() => window.__district.dock.preview({ rejoin: 'MINT' })); await sleep(700); }
  if (o.act === 'panel') {
    await p.waitForFunction(() => window.__district.remote && window.__district.remote(), { timeout: 15000 });
    await p.evaluate(o => { const r = window.__district.remote(); r.setMode(o.mode || 'me'); if (o.on) r.setMine(o.on); r.open(); if (r.openCats) r.openCats(o.cats || []); }, o);
    await sleep(700);
    if (o.scroll) { await p.evaluate(k => { const s = document.querySelector('.hr-sheet'); s.scrollTop = (s.scrollHeight - s.clientHeight) * k; }, o.scroll); await sleep(200); }
  }
  if (o.act === 'menu') { await p.click('.menu-btn'); await p.waitForSelector('.gm-panel'); await sleep(400); }
  if (o.act === 'sun') { await p.evaluate(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); window.__district.dock.sunAt(r.left + r.width * 0.4, r.top + r.height * 0.55); }); await sleep(300); }
  // (POL4: --js "<expression>": run in the page before the shot — e.g. "__district.harbor().speakeasy.power(0)")
  if (opt('js', '')) { await p.evaluate(String(opt('js'))); await sleep(400); }
  // (SP5: --until "<expression>": wait (≤ --until-ms, default 90 s) until it is truthy in the page before the shot — a seeded moment, a stand at the shade)
  if (opt('until', '')) { const ms = Number(opt('until-ms', 90000)) || 90000; await p.waitForFunction(String(opt('until')), { timeout: ms, polling: 100 }).catch(e => console.warn(`  --until never came true within ${ms} ms`)); }
  if (IDLE) { await p.evaluate(() => window.__district.idle()); await p.waitForFunction(() => window.__district.isIdle(), { timeout: 5000 }).catch(() => {}); await sleep(2100); }
  const CAST = Number(opt('cast', 0)) || 0;
  if (CAST) {
    const cdp = await p.target().createCDPSession(), t0 = Date.now(); let k = 0;
    cdp.on('Page.screencastFrame', f => { writeFileSync(`${OUT}${name}-${w}x${h}-cast-${String(k++).padStart(3, '0')}-${Date.now() - t0}.jpg`, Buffer.from(f.data, 'base64')); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, everyNthFrame: 1, maxWidth: w * (DSF || (mobile ? 2 : 1)), maxHeight: h * (DSF || (mobile ? 2 : 1)) });
    await sleep(CAST); await cdp.send('Page.stopScreencast'); n += k; console.log(`${name} ${w}x${h}: ${k} frames in ${CAST} ms`);
    await ctx.close(); continue;
  }
  for (let shot = 0; shot < COUNT; shot++) {
  if (shot) await sleep(EVERY);
  const file = `${OUT}${name}-${w}x${h}${IDLE ? '-idle' : ''}${TIER !== null ? `-t${TIER}` : ''}${COUNT > 1 ? `-${shot}` : ''}`;
  if (!CROPS.length) { await p.screenshot({ path: `${file}.png` }); n++; }
  for (const c of CROPS) {
    let clip;
    if (c === 'street') {
      clip = await p.evaluate(() => { const s = window.__district.street(); if (!s || !s.HZ) return null; const k = s.K || 1; const y = Math.max(0, s.HZ - 78 * k); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight - y, 120 * k) }; });
    } else if (c === 'stage') {
      // CITY 2.0: the near stage — from above the road's stop lights down to the dock's top
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam, k = c.F / 600; const y = Math.max(0, c.VPY + c.F * c.CAMH / 64 - 70 * k); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight, c.dock.y + 8) - y }; });
    } else if (c === 'cart' || c === 'treel' || c === 'compass') {
      // CITY 2.0 (POL4): the chestnut cart's spot close up (130 × 100 pt round it) / the tree left of the crossing (behind the blade) + the
      // bench under it (the hidden lamp + its uplight)
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); const pr = hb && hb.promenade; if (!pr) return null;
        if (cc === 'compass') { const [x, y] = pr.medallion; return { x: Math.max(0, x - 100), y: Math.max(0, y - 75), width: Math.min(200, innerWidth - Math.max(0, x - 100)), height: 100 }; }
        if (cc === 'cart') { const [x, y] = pr.cart; return { x: Math.max(0, x - 75), y: Math.max(0, y - 80), width: Math.min(150, innerWidth - Math.max(0, x - 75)), height: 100 }; }
        const t = [...pr.trees].sort((a, b) => a.at[0] - b.at[0])[0]; if (!t) return null; const [x, y] = t.at, r = t.r;
        return { x: Math.max(0, x - r * 1.6), y: Math.max(0, y - r * 3.4), width: Math.min(innerWidth, r * 3.6), height: r * 4 }; }, c);
    } else if (c === 'band') {
      // CITY 2.0 (FP2): the band under the dock — from a little above the promenade's front edge to the screen's foot
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const y = Math.max(0, hb.cam.dock.y - 40); return { x: 0, y, width: innerWidth, height: innerHeight - y }; });
    } else if (c === 'shop' || c === 'pole') {
      // CITY 2.0 (FP2): the barbershop's front close up (the window, the pole, the side door + its sconce, the cobbles under them) /
      // the barber pole alone (padded 8 pt: its glass, halo + the brick beside it — the frame burst's crop)
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); const sp = hb && hb.speakeasy; if (!sp || !sp.poleRect) return null; const r = sp.poleRect, k = hb.cam.F / 600;
        if (cc === 'pole') return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: r.w + 16, height: r.h + 16 };
        const sx = sp.glowAt && sp.glowAt.sconce ? sp.glowAt.sconce[0] : r.x, x1 = Math.min(innerWidth, Math.max(r.x + r.w, sx) + 40 * k), y = Math.max(0, r.y - 44 * k);
        return { x: 0, y, width: x1, height: Math.min(innerHeight - y, r.h + 100 * k) }; }, c);
    } else if (c === 'facade' || c === 'upper' || c === 'crest') {
      // CITY 2.0 (7b): THE SPEAKEASY's facade close up — facade: the whole front from the crest + its string lights down to the
      // pavement; upper: the six windows (the moments' stage). With --zoom the device pixels are blown up whole (no width cut).
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); const sp = hb && hb.speakeasy; if (!sp || !sp.box) return null; const b = sp.box, k = hb.cam.F / 600;
        if (cc === 'upper') { const ws = sp.windows(); const x0 = 0, y0 = Math.min(...ws.map(w => w.rect.y)) - 10 * k, x1 = Math.max(...ws.map(w => w.rect.x + w.rect.w)) + 12 * k, y1 = Math.max(...ws.map(w => w.rect.y + w.rect.h)) + 8 * k; return { x: x0, y: Math.max(0, y0), width: Math.min(innerWidth, x1), height: y1 - Math.max(0, y0) }; }
        if (cc === 'crest') { const y = Math.max(0, b.y - 6 * k); return { x: 0, y, width: Math.min(innerWidth, b.x + b.w * 0.75), height: b.h * 0.2 }; }   // (POL4: the crest + the date stone)
        const y = Math.max(0, b.y - 26 * k); return { x: 0, y, width: Math.min(innerWidth, b.x + b.w + 6 * k), height: Math.min(innerHeight - y, b.h + 30 * k) }; }, c);
    } else if (c === 'skyline') {
      // CITY 2.0: the skyline close up — from above the tallest crown down to the far quay
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam, y = Math.max(0, c.limitY - 24); return { x: 0, y, width: innerWidth, height: c.VPY + c.F * c.CAMH / 230 + 14 - y }; });
    } else if (c === 'water') {
      // CITY 2.0: the water close up — the city's foot (what it mirrors) down to the road
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb || !hb.water) return null; const y = Math.max(0, hb.water.y0 - 60); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight, hb.water.y1 + 12) - y }; });
    } else if (c === 'sky') {
      // CITY 2.0 (Part 6a): the sky lanes — from the safe top to a little under the skyline's limit
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; return { x: 0, y: 0, width: innerWidth, height: Math.min(innerHeight, hb.cam.limitY + 60) }; });
    } else if (c === 'skyl' || c === 'skyr' || c === 'skym' || c === 'logo') {
      // CITY 2.0: close-ups — the skyline's left / right half (its signs + neon up close), the NEON logo; the Day Pass's thirds:
      // skyl3 / skym / skyr3 (left, middle, right third)
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam;
        if (cc === 'logo') { const r = document.querySelector('.nd-logo-wrap').getBoundingClientRect(); return { x: Math.max(0, r.left - 20), y: Math.max(0, r.top - 30), width: Math.min(innerWidth, r.width + 40), height: r.height + 60 }; }
        const y = Math.max(0, c.limitY - 24), hh = c.VPY + c.F * c.CAMH / 230 + 14 - y, w = innerWidth / 2;
        if (cc === 'skym') return { x: innerWidth / 3, y, width: innerWidth / 3, height: hh };
        return { x: cc === 'skyl' ? 0 : w, y, width: w, height: hh }; }, c);
    } else if (c === 'skyl3' || c === 'skyr3') {
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam;
        const y = Math.max(0, c.limitY - 24), hh = c.VPY + c.F * c.CAMH / 230 + 14 - y, w = innerWidth / 3; return { x: cc === 'skyl3' ? 0 : w * 2, y, width: w, height: hh }; }, c);
    } else if (c === 'blade') {
      // CITY 2.0: THE GAME BLADE close up (n-blade + what stands around / in front of it)
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); const b = hb && hb.neon.signs.find(s => s.id === 'n-blade'); if (!b) return null; const r = b.rect, k = hb.cam.F / 600;
        return { x: Math.max(0, r.x - 40 * k), y: Math.max(0, r.y - 30 * k), width: r.w + 80 * k, height: r.h + 60 * k }; });
    } else if (c === 'bill') {
      // CITY 2.0: THE BILLBOARD close up (its lamps, the poster, the steel down to the roof)
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); const b = hb && hb.neon.boards[0]; if (!b || !b.rect) return null; const r = b.rect, k = hb.cam.F / 600;
        return { x: Math.max(0, r.x - 30 * k), y: Math.max(0, r.y - 24 * k), width: r.w + 60 * k, height: r.h + 44 * k }; });
    } else if (['wheel', 'lighthouse', 'rosie', 'harbor', 'boats'].includes(c) || c.startsWith('boat-')) {
      // CITY 2.0 (Part 5): close-ups of the harbor's hero pieces — the wheel (with its legs on the pier), the lighthouse (+ the
      // beam's sweep), Rosie (wherever she is now), the harbor strip (the wheel's top to the road)
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb || !hb.wheel) return null; const w = hb.wheel, k = hb.cam.F / 600, box = (x, y, ww, hh) => ({ x: Math.max(0, x), y: Math.max(0, y), width: Math.min(innerWidth - Math.max(0, x), ww), height: Math.min(innerHeight - Math.max(0, y), hh) });
        if (cc === 'wheel') return box(w.x - w.r * 1.35, w.y - w.r * 1.2, w.r * 2.7, w.deck - w.y + w.r * 1.2 + 40 * k);
        if (cc === 'lighthouse') { const l = hb.lighthouse; return box(l.x - 90 * k, l.y - 60 * k, 180 * k, 190 * k); }
        if (cc === 'rosie') { const b = hb.boats.boats.find(o => o.id === 'rosie'); return b ? box(b.x - 75 * k, w.y - 10 * k, 150 * k, 120 * k) : null; }
        // (8b2 Group 3: any other boat, close — boat-taxi / boat-tug / boat-fish / boat-sail / boat-sail2: a box round it wherever it is)
        if (cc.startsWith('boat-')) { const b = hb.boats.boats.find(o => o.id === cc.slice(5)); return b && b.y != null ? box(b.x - 40 * k, b.y - 44 * k, 80 * k, 56 * k) : null; }
        return box(0, w.y - w.r - 12, innerWidth, hb.water.y1 + 10 - (w.y - w.r - 12)); }, c);
    } else if (PRESET[c]) {
      clip = await p.evaluate(([sel, pad]) => {
        const rs = [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(r => r.width);
        if (!rs.length) return null;
        const x0 = Math.min(...rs.map(r => r.left)) - pad, y0 = Math.min(...rs.map(r => r.top)) - pad;
        const x1 = Math.max(...rs.map(r => r.right)) + pad, y1 = Math.max(...rs.map(r => r.bottom)) + pad;
        return { x: Math.max(0, x0), y: Math.max(0, y0), width: Math.min(innerWidth, x1) - Math.max(0, x0), height: Math.min(innerHeight, y1) - Math.max(0, y0) };
      }, PRESET[c]);
    } else { const [x, y, cw, ch] = c.split(/[,x]/).map(Number); clip = { x, y, width: cw, height: ch }; }
    if (!clip) { console.log(`${name} ${w}x${h}: nothing to crop for "${c}"`); continue; }
    if (ZOOM > 1 && !['shop', 'pole', 'facade', 'upper', 'crest', 'cart', 'treel', 'compass'].includes(c)) { const cw = clip.width / ZOOM; clip = { ...clip, x: clip.x + (clip.width - cw) * Math.max(0, Math.min(1, ZX)), width: cw }; }   // (shop / pole: already close — zoomed whole)
    const path = `${file}-${PRESET[c] || ['street', 'stage', 'band', 'shop', 'pole', 'facade', 'upper', 'skyline', 'sky', 'skyl', 'skyr', 'skym', 'skyl3', 'skyr3', 'logo', 'water', 'wheel', 'lighthouse', 'rosie', 'harbor', 'boats', 'blade', 'bill', 'crest', 'cart', 'treel', 'compass'].includes(c) || c.startsWith('boat-') ? c : /^\d/.test(c) ? `c${c}` : 'crop'}${ZOOM > 1 ? `-z${ZOOM}` : ''}.png`;
    if (ZOOM > 1) await magnify(ctx, await p.screenshot({ clip }), ZOOM, path); else await p.screenshot({ path, clip });
    n++;
  }
  }
  await ctx.close();
}
await browser.close();
console.log(`${n} shot(s) in ${OUT}`);
