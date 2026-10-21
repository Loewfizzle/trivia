// The look-review camera: screenshots of the title (or any URL state) at the sizes that matter, in one command.
// Replaces the throwaway _something-shots scripts. Needs scripts/serve.mjs (--emu for anything that opens a room).
//
//   node shots.mjs "<browser>" [--scenes night,day,halloween] [--sizes phones|desktop|all|390x844,412x915] [--place gr|ny|none]
//                  [--crop dock,corner,sign | --crop 0,1400,780,300] [--qs "wx=rain&force=lightning"] [--out ./shots-review]
//                  [--wait 2600] [--guest] [--preview] [--city 2] [--safe]
// --preview: shoot title-preview.html (the real title, no Firebase / emulators needed; HOST and JOIN don't open rooms there).
// --city 2: CITY 2.0, THE HARBOR (docs/harbor.md): adds &city=2 (any extra flag via --qs, e.g. "grid=1" or "force=demo");
//   --sizes harbor = the six review sizes (four phones upright, a phone sideways, desktop); --safe emulates the iPhone's
//   safe areas (62 / 34 pt upright, 21 pt at the bottom sideways); --crop stage = the near stage (the road to the dock);
//   --crop skyline = the skyline close up (above the crowns to the far quay); skyl / skyr = its left / right half (signs + neon
//   up close); logo = the NEON logo; water = the harbor's water close up (Part 4: from 60 pt above the waterline to the road).
//   e.g. node shots.mjs "<browser>" --preview --city 2 --safe --sizes harbor --scenes day,golden,night,party,rain,snow
//
// Scenes (built in; or name=YYYY-MM-DDTHH:MM for any moment): night day ramp catch dawn first join halloween christmas
// valentine rejoin sun rain rainbow rainbow2 moonbow neonbow blossom summer autumn autumn-night winter plow owl day-bus golden
// street-party street-rain umbrellas party-line hail small-hours halloween-kids nye-sparklers door door-day party snow. --crop street: the street strip (the towers' feet down to the dock). "first" has no profile; --guest makes every scene a first-time visitor.
// Each shot gets its own browser context (no profile leaking between shots). Files: <scene>-<w>x<h>[-<crop>].png
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const argv = process.argv.slice(2);
const BROWSER = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true); };
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const OUT = String(opt('out', './shots-review')).replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const WAIT = Number(opt('wait', 2600));
const GUEST = !!opt('guest', false);
const PREVIEW = !!opt('preview', false);
const PLACES = { gr: '&tz=America/Detroit&at=42.96,-85.67', ny: '&tz=America/New_York', none: '' };
const PLACE = PLACES[opt('place', 'gr')] ?? PLACES.gr;
const CITY = opt('city', '') ? `&city=${opt('city')}` : '';
const SAFE = !!opt('safe', false);
const EXTRA = opt('qs', '') ? `&${opt('qs')}` : '';
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
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });
let n = 0;
for (const [w, h] of SIZES) for (const [name, when, o] of scenes) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log(`${name} ${w}x${h} PAGEERROR`, e.message));
  const mobile = w < 1000;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  if (SAFE) await p.evaluateOnNewDocument((st, sb) => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `:root{--safe-t:${st}px !important;--safe-b:${sb}px !important}`; document.head.appendChild(s); }); }, mobile && h > w ? 62 : 0, mobile ? (h > w ? 34 : 21) : 0);
  await p.evaluateOnNewDocument(guest => {
    try { localStorage.setItem('nd:entered', '1'); if (!guest) localStorage.setItem('na:sh:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  }, GUEST || !!o.guest);
  const qs = `when=${when}${PLACE}${o.qs ? `&${o.qs}` : ''}${CITY}${EXTRA}`;
  await p.goto(PREVIEW ? `${BASE}/tests/integration/title-preview.html?${qs}${GUEST || o.guest ? '&guest=1' : ''}` : `${BASE}/?emu&slot=sh&${qs}`);
  await p.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 25000 });
  await sleep(WAIT);
  if (o.act === 'join') { await p.evaluate(() => window.__district.dock.join(true)); await sleep(500); await p.type('.nd-code-in', 'mi'); await sleep(400); }
  if (o.act === 'rejoin') { await p.evaluate(() => window.__district.dock.preview({ rejoin: 'MINT' })); await sleep(700); }
  if (o.act === 'sun') { await p.evaluate(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); window.__district.dock.sunAt(r.left + r.width * 0.4, r.top + r.height * 0.55); }); await sleep(300); }
  const file = `${OUT}${name}-${w}x${h}`;
  if (!CROPS.length) { await p.screenshot({ path: `${file}.png` }); n++; }
  for (const c of CROPS) {
    let clip;
    if (c === 'street') {
      clip = await p.evaluate(() => { const s = window.__district.street(); if (!s || !s.HZ) return null; const k = s.K || 1; const y = Math.max(0, s.HZ - 78 * k); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight - y, 120 * k) }; });
    } else if (c === 'stage') {
      // CITY 2.0: the near stage — from above the road's stop lights down to the dock's top
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam, k = c.F / 600; const y = Math.max(0, c.VPY + c.F * c.CAMH / 64 - 70 * k); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight, c.dock.y + 8) - y }; });
    } else if (c === 'skyline') {
      // CITY 2.0: the skyline close up — from above the tallest crown down to the far quay
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam, y = Math.max(0, c.limitY - 24); return { x: 0, y, width: innerWidth, height: c.VPY + c.F * c.CAMH / 230 + 14 - y }; });
    } else if (c === 'water') {
      // CITY 2.0: the water close up — the city's foot (what it mirrors) down to the road
      clip = await p.evaluate(() => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb || !hb.water) return null; const y = Math.max(0, hb.water.y0 - 60); return { x: 0, y, width: innerWidth, height: Math.min(innerHeight, hb.water.y1 + 12) - y }; });
    } else if (c === 'skyl' || c === 'skyr' || c === 'logo') {
      // CITY 2.0: close-ups — the skyline's left / right half (its signs + neon up close), the NEON logo
      clip = await p.evaluate(cc => { const hb = window.__district.harbor && window.__district.harbor(); if (!hb) return null; const c = hb.cam;
        if (cc === 'logo') { const r = document.querySelector('.nd-logo-wrap').getBoundingClientRect(); return { x: Math.max(0, r.left - 20), y: Math.max(0, r.top - 30), width: Math.min(innerWidth, r.width + 40), height: r.height + 60 }; }
        const y = Math.max(0, c.limitY - 24), hh = c.VPY + c.F * c.CAMH / 230 + 14 - y, w = innerWidth / 2; return { x: cc === 'skyl' ? 0 : w, y, width: w, height: hh }; }, c);
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
    await p.screenshot({ path: `${file}-${PRESET[c] || ['street', 'stage', 'skyline', 'skyl', 'skyr', 'logo', 'water'].includes(c) ? c : 'crop'}.png`, clip }); n++;
  }
  await ctx.close();
}
await browser.close();
console.log(`${n} shot(s) in ${OUT}`);
