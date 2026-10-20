// The look-review camera: screenshots of the title (or any URL state) at the sizes that matter, in one command.
// Replaces the throwaway _something-shots scripts. Needs scripts/serve.mjs (--emu for anything that opens a room).
//
//   node shots.mjs "<browser>" [--scenes night,day,halloween] [--sizes phones|desktop|all|390x844,412x915] [--place gr|ny|none]
//                  [--crop dock,corner,sign | --crop 0,1400,780,300] [--qs "wx=rain&force=lightning"] [--out ./shots-review]
//                  [--wait 2600] [--guest]
//
// Scenes (built in; or name=YYYY-MM-DDTHH:MM for any moment): night day ramp catch dawn first join halloween christmas
// valentine rejoin sun rain. "first" has no profile; --guest makes every scene a first-time visitor.
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
const PLACES = { gr: '&tz=America/Detroit&at=42.96,-85.67', ny: '&tz=America/New_York', none: '' };
const PLACE = PLACES[opt('place', 'gr')] ?? PLACES.gr;
const EXTRA = opt('qs', '') ? `&${opt('qs')}` : '';
const SIZE_SETS = { phones: '390x844,393x852,430x932,412x915', desktop: '1440x900', all: '390x844,393x852,430x932,412x915,1440x900', quick: '390x844,1440x900' };
const SIZES = String(SIZE_SETS[opt('sizes', 'quick')] || opt('sizes')).split(',').map(s => s.split('x').map(Number));
// [when, options] — dates are Grand Rapids' 19 Oct 2026 unless the scene is a holiday
const SCENE = {
  night: ['2026-10-19T22:30'], day: ['2026-10-19T13:30'], ramp: ['2026-10-19T18:20'], catch: ['2026-10-19T18:56'],
  dawn: ['2026-10-20T08:20'], first: ['2026-10-19T22:30', { guest: true }], join: ['2026-10-19T22:30', { act: 'join' }],
  halloween: ['2026-10-31T21:30'], christmas: ['2026-12-24T21:30'], valentine: ['2027-02-14T21:00'],
  rejoin: ['2026-10-19T22:30', { act: 'rejoin' }], sun: ['2026-10-19T13:30', { act: 'sun' }], rain: ['2026-10-19T22:30', { qs: 'wx=rain' }],
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
  const mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument(guest => {
    try { localStorage.setItem('nd:entered', '1'); if (!guest) localStorage.setItem('na:sh:profile', JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  }, GUEST || !!o.guest);
  await p.goto(`${BASE}/?emu&slot=sh&when=${when}${PLACE}${o.qs ? `&${o.qs}` : ''}${EXTRA}`);
  await p.waitForFunction(() => window.__district && window.__district.phase().done, { timeout: 25000 });
  await sleep(WAIT);
  if (o.act === 'join') { await p.evaluate(() => window.__district.dock.join(true)); await sleep(500); await p.type('.nd-code-in', 'mi'); await sleep(400); }
  if (o.act === 'rejoin') { await p.evaluate(() => window.__district.dock.preview({ rejoin: 'MINT' })); await sleep(700); }
  if (o.act === 'sun') { await p.evaluate(() => { const r = document.querySelector('.music-btn').getBoundingClientRect(); window.__district.dock.sunAt(r.left + r.width * 0.4, r.top + r.height * 0.55); }); await sleep(300); }
  const file = `${OUT}${name}-${w}x${h}`;
  if (!CROPS.length) { await p.screenshot({ path: `${file}.png` }); n++; }
  for (const c of CROPS) {
    let clip;
    if (PRESET[c]) {
      clip = await p.evaluate(([sel, pad]) => {
        const rs = [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(r => r.width);
        if (!rs.length) return null;
        const x0 = Math.min(...rs.map(r => r.left)) - pad, y0 = Math.min(...rs.map(r => r.top)) - pad;
        const x1 = Math.max(...rs.map(r => r.right)) + pad, y1 = Math.max(...rs.map(r => r.bottom)) + pad;
        return { x: Math.max(0, x0), y: Math.max(0, y0), width: Math.min(innerWidth, x1) - Math.max(0, x0), height: Math.min(innerHeight, y1) - Math.max(0, y0) };
      }, PRESET[c]);
    } else { const [x, y, cw, ch] = c.split(/[,x]/).map(Number); clip = { x, y, width: cw, height: ch }; }
    if (!clip) { console.log(`${name} ${w}x${h}: nothing to crop for "${c}"`); continue; }
    await p.screenshot({ path: `${file}-${PRESET[c] ? c : 'crop'}.png`, clip }); n++;
  }
  await ctx.close();
}
await browser.close();
console.log(`${n} shot(s) in ${OUT}`);
