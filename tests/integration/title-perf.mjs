// The title city's frame pacing + work, per scene and tier (no Firebase: the real title in title-preview.html).
//
//   A/B (THE GATE — C1.5, the owner's rule: only a relative A/B in ONE run means anything on this laptop):
//     node title-perf.mjs "<browser>" --city 2 --ab http://localhost:5174 [--scenes np-party,np-night] [--tiers 2,1,0]
//                         [--pairs 3] [--cpu 4] [--gpu] [--size 402x874] [--secs 5]
//     A = the --ab server (a `git worktree` of the commit before on :5174), B = E2E_BASE (the working tree on :5173). Both pages
//     load once; the one being measured is brought to the front, so the other is HIDDEN and its city stops (the scenes stop on a
//     hidden page) — they never compete for the CPU. Each
//     scene × tier runs A B B A A B … (--pairs windows each, the same warm-up); every window starts only when the city is settled
//     (no bake, no crossfade, no tier probe, the tier asked for) and is thrown away (re-run) if the tier moved during it.
//     Judged on FRAME PACING (the rAF interval p95 + the share over 20 ms: what a person feels and what the tiering acts on), with
//     the work as a second line: SLOWER when B's median is worse than A's by more than the noise (the windows' own spread) AND by
//     > 10 % and > 0.5 ms of work / > 2 points of slow frames. Exit code 1 on SLOWER.
//   A FLAG'S COST (one server): --vs <scene> — A = the --scenes scene, B = the --vs scene (e.g. --scenes np-party --vs n4-punch),
//     the same interleaving + verdict ("faster" = what the flag saves).
//   ABSOLUTE (one server): node title-perf.mjs "<browser>" --city 2 [--scenes …] — the numbers, with the per-tier budgets
//     (City 2.0: 8 / 6 / 4 ms of work at tier 2 / 1 / 0) printed as WARNINGS, never a failure (the laptop is not the phone).
//
// What it measures (the same on any commit, no hook needed): a wrapper round requestAnimationFrame installed before the page's
// scripts — the interval between frames, and the main-thread time spent in rAF callbacks per frame (the scene's draw + the
// title's party frame: "rAF work"); plus the scene's own cost() (its draw per drawn frame, the last 90) at each window's end.
// Model a real device: tier 2 = a fast phone (--gpu, --cpu 1 or 2); tier 0 = the slow phone the auto-tier lands on (--cpu 4).
// (A party night at 4× without a GPU steps itself down from tier 2 — setTier() pins against stepping UP only — so its tier-2
// windows are thrown away: measure tier 2 at --cpu 1–2. Without --gpu the fill is main-thread work: a fair proxy for a fill cost.)
// Needs scripts/serve.mjs on :5173 (and a second one on :5174 for --ab).
import puppeteer from 'puppeteer-core';

const BROWSER = process.argv[2];
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const CITY = arg('city', '1');
const CPU = Number(arg('cpu', 4));
const SECS = Number(arg('secs', 5));
const PAIRS = Math.max(1, Number(arg('pairs', 3)));
const TIERS = arg('tiers', '2,1,0').split(',').map(Number);
const [VW, VH] = arg('size', '390x844').split('x').map(Number);
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const VS = arg('vs', null);            // --vs <scene>: A = each --scenes scene, B = this one, on the same server (a flag's cost)
const BASE_A = arg('ab', null) || (VS ? BASE : null);
const BUDGET = { 2: 8, 1: 6, 0: 4 };   // City 2.0's absolute budgets: warnings only (docs/harbor.md#performance)
// Grand Rapids by default (the owner's city); party = a Saturday at the peak (10 pm–midnight)
const AT = '&tz=America/Detroit&at=42.96,-85.67';
const SCENES = {
  party: 'when=2026-10-17T23:00&wx=clear',
  night: 'when=2026-10-14T21:30&wx=clear',
  day: 'when=2026-10-14T14:00&wx=clear',
  golden: 'when=2026-10-14T18:30&wx=clear',
  rain: 'when=2026-10-14T21:30&wx=rain',
  snow: 'when=2026-12-15T21:30&wx=snow',
  // CITY 2.0's worst night so far: the searchlights sweeping + a word in the windows
  show: 'when=2026-10-14T21:30&wx=clear&force=searchlights,spell&text=2027',
  // CITY 2.0, Part 3: the neon's party moment (chasers + the beat + the LED facades) on top of the show; and the plain scenes
  // without the planes (their contrail grows the cost over a pass: docs/harbor.md Known issues) — np-party, np-night, np-day
  neon: 'when=2026-10-17T23:00&wx=clear&force=no-planes,neon-party,searchlights,spell&text=2027',
  'np-party': 'when=2026-10-17T23:00&wx=clear&force=no-planes', 
  // 9a — THE WEATHER's A/B scenes (both sides read &wx=: A draws City 1.0's rain + fog, B the Harbor's own): rain + a storm at night, fog by day
  'w-rain': 'when=2026-10-14T21:30&wx=rain&force=no-planes', 'w-storm': 'when=2026-10-14T21:30&wx=storm&force=no-planes', 'w-fog': 'when=2026-10-14T13:00&wx=fog&force=no-planes',
  // NEON PASS 4: the party peak with one new piece off at a time (the A/B of its cost on one page)
  'n4-race': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-race', 'n4-punch': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-punch', 'n4-shim': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-shimmer',
  'n4-beams': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-beams', 'n4-str': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-strings', 'n4-all': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-race,no-punch,no-shimmer,no-beams,no-strings',
  'np-night': 'when=2026-10-14T21:30&wx=clear&force=no-planes',
  // NIGHT-A: THE NEW NIGHT LIGHT (&light=new: an older build ignores the flag — its own light): a plain night, a party night, a rainy night
  // NIGHT-A2: SATURDAY OCT 31 — Halloween AND a party night (the owner's iPhone: 14.5 % slow, frames to 100 ms); -noprops = the same
  // night without the holiday's props (the props' share of it); np-* / w-rain run the DEFAULT light (NEW since NIGHT-A2)
  // NIGHT-B — THE STREET PARTY: Saturday Oct 24 at 22:15 (the pockets mingling between breaks) + 22:06:36 (its conga break ~55 s in — NIGHT-C: on the deck's real songs:
  // the pockets bouncing, the 20-strong conga, the spill in the street, the bench dancers — the heaviest moment) + the stage light on
  'sp-peak': 'when=2026-10-24T22:15&wx=clear&force=no-planes', 'sp-break': 'when=2026-10-24T22:06:36&wx=clear&force=no-planes', 'sp-break-stage': 'when=2026-10-24T22:06:36&wx=clear&force=no-planes&stage=1',
  // NIGHT-C: a plain Tuesday night (THE QUIET BUILDING + the roof signs + the live windows on the crisp layer at 3×) + a forced dance break
  // on a Thursday (B: on the party deck WITH the helicopter over the crowd; an older build: its own forced break, no helicopter)
  // SKY-A: the conga break WITHOUT the helicopter (--vs sp-break: the helicopter's own cost) + a night patrol at its look over the harbor
  'sa-break-noheli': 'when=2026-10-24T22:06:36&wx=clear&force=no-planes,no-heli', 'sa-patrol': 'when=2026-10-21T22:00&wx=clear&force=no-planes,helicopter',
  'nc-night': 'when=2026-10-27T21:30&wx=clear&force=no-planes', 'nc-break': 'when=2026-10-22T22:00&wx=clear&force=no-planes,dance',
  'hw-party': 'when=2026-10-31T22:00&wx=clear&force=no-planes', 'hw-party-noprops': 'when=2026-10-31T22:00&wx=clear&force=no-planes,no-holiday-props',
  'na-night': 'when=2026-10-14T21:30&wx=clear&force=no-planes&light=new', 'na-party': 'when=2026-10-17T23:00&wx=clear&force=no-planes&light=new', 'na-rain': 'when=2026-10-14T21:30&wx=rain&force=no-planes&light=new',
  // HOTFIX Oct 29: the owner's forced-bus link (5 fps on his iPhone: the people's plan cache re-planned every frame) + the forced dog walk
  bus: 'when=2026-10-30T11:00&wx=clear&force=bus', dog: 'when=2026-10-30T19:12&wx=clear&force=dogwalk',
  // PROM: the promenade pass's A/B — a snowy night + Halloween night (the giant on the bigger compass, the re-anchored dressing)
  'np-snow': 'when=2027-01-14T21:30&snow=fresh&wx=snow&temp=-6&force=no-planes', 'np-halloween': 'when=2026-10-31T21:30&wx=clear&force=no-planes',
  // (11a-2's speed round: the parade at its peak (balloons + the band + the crowd), Halloween night with the giant, an ordinary November day)
  'tg-parade': 'when=2026-11-26T09:20&wx=clear&force=no-planes', 'hw-giant': 'when=2026-10-31T21:30&wx=clear&force=no-planes', 'nov-day': 'when=2026-11-18T14:00&wx=clear&force=no-planes', 'tg-parade-nb': 'when=2026-11-26T09:20&wx=clear&force=no-planes,no-holiday-props', 'tg-parade-np': 'when=2026-11-26T09:20&wx=clear&force=no-planes,no-people',
  // 11a-1 — HALLOWEEN NIGHT at its peak (a Saturday: the party + the zombies + the spooky light + the web + the pumpkins + the ghost ship forced) ·
  // DAY OF THE DEAD's procession at dusk (Nov 2: the candles along the waterside + the papel picado + the ofrendas)
  'hw-peak': 'when=2026-10-31T21:45&wx=clear&force=no-planes,ghost-ship', 'dd-proc': 'when=2026-11-02T18:20&wx=clear&force=no-planes',
  // (the night's pieces off one at a time — the attribution of hw-peak's cost: the ghost ship + witch, the ground props, the people)
  'hw-nosky': 'when=2026-10-31T21:45&wx=clear&force=no-planes,no-ghost-ship,no-witch', 'hw-noprops': 'when=2026-10-31T21:45&wx=clear&force=no-planes,ghost-ship,no-holiday-props', 'hw-nopeople': 'when=2026-10-31T21:45&wx=clear&force=no-planes,ghost-ship,no-people',
  // C1.5: the party's three fill costs, one flag each (review-2.md §1b), against np-party (n4-punch, n4-beams are the other two)
  'f-water': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-water', 'f-all': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-punch,no-water,no-beams',
  'np-day': 'when=2026-10-14T14:00&wx=clear&force=no-planes', 'np-golden': 'when=2026-10-14T18:30&wx=clear&force=no-planes',
  // (THE DAY PASS: a cloudy day — the Harbor's own clouds, the most of them a phone draws)
  'np-clouds': 'when=2026-10-14T14:00&wx=clouds&force=no-planes',
  // SP: the owner's iPhone case — a cloudy party night (the clouds + the beams in them) vs np-party (clear); a sky of cirrus by day
  'np-pclouds': 'when=2026-10-17T23:00&wx=clouds&force=no-planes', 'np-cirrus': 'when=2026-10-14T14:00&wx=cirrus&force=no-planes',
  // CITY 2.0, Part 4: the water — a windy night (the most light-column copies + the broken mirror); nw- = the same scenes without
  // the live water (only its baked base: Part 3's cost), for a before / after
  'np-windy': 'when=2026-10-14T21:30&wx=clear&wind=13&force=no-planes',
  // SP6: a normal night with the blue TV window on (23:00); the UFO's abduction (the beam drawn as one image now)
  's9-fresh': 'when=2027-01-15T22:00&wx=clear&snow=fresh&force=no-planes', 's9-fall': 'when=2027-01-14T22:30&snow=fresh&force=snowfall,no-planes', 's9-plow': 'when=2027-01-14T13:00&snow=fresh&force=plow,no-planes', 's9-thaw': 'when=2027-01-15T22:00&wx=clear&snow=thaw&force=no-planes', 's9-party': 'when=2027-01-15T22:30&wx=clear&snow=fresh&force=party,no-planes',   // (9b: WINTER — the snow vs none)
  'sp6-tv': 'when=2026-10-14T23:00&wx=clear&force=no-planes', 'sp6-ufo': 'when=2026-09-15T23:00&wx=clear&force=no-planes,ufo&lgnow=1',
  // 9d: the owner's TR-3B + snow + party night (held at the blackout), a night with the doors in use (their real light + the swinging
  // baked leaf), the floodlit giant (its floods as light on its own normals)
  '9d-tr3b': 'when=2027-01-15T21:30&snow=fresh&temp=-6&force=tr3b&lgs=15', '9d-doors': 'when=2026-10-21T22:00&wx=clear&force=doors,no-planes', '9d-giant': 'when=2026-10-25T22:00&wx=clear&force=no-planes',
  // (the UFO bake: the abduction with the hand-drawn saucer — --scenes ufo-classic --vs sp6-ufo = the model's cost)
  'ufo-classic': 'when=2026-09-15T23:00&wx=clear&force=no-planes,ufo&ufo=classic&lgnow=1',
  // (9c: a deep-freeze snowy night — the glowing sign snow + the frozen pane; the floodlit giant; a normal day with the crisp layer; the UFO
  // flight is sp6-ufo)
  's9c-freeze': 'when=2027-01-15T22:00&wx=clear&snow=fresh&temp=-14&force=no-planes', 's9c-giant': 'when=2026-10-27T21:30&wx=clear&force=no-planes', 's9c-day': 'when=2026-10-27T13:00&wx=clear&force=no-planes',
  // (9e's speed round: a plain night, a party night with the TR-3B, a snowy night (the flakes landing on the sign), a day with the tower's crane)
  's9e-night': 'when=2026-09-16T21:30&wx=clear&force=no-planes', 's9e-tr3b': 'when=2026-10-16T23:00&wx=clear&force=no-planes,tr3b&lgnow=1', 's9e-snow': 'when=2027-01-14T21:30&wx=snow&snow=fresh&temp=-6&force=no-planes', 's9e-crane': 'when=2026-09-16T14:00&wx=clear&build=rising&force=no-planes',
  // (9f's speed round: the owner's TR-3B link (a Friday party + fresh snow), the site rising at night, the site on a party night (its beam), the implosion mid-fall)
  's9g-site': 'when=2026-09-16T12:30&wx=clear&build=rising&force=no-planes,joggers&cranet=36',   // (9g: the day crane mid-swing (one frame, no blend) + the joggers' new stride)
  's9f-tr3b': 'when=2027-01-15T21:30&wx=clear&snow=fresh&temp=-6&force=no-planes,tr3b&lgnow=1', 's9f-site': 'when=2026-09-16T22:00&wx=clear&build=rising&force=no-planes', 's9f-sitep': 'when=2026-10-17T23:00&wx=clear&build=rising&force=no-planes', 's9f-imp': 'when=2026-09-16T10:00&wx=clear&build=implosion&builds=6&force=no-planes',
  'nw-night': 'when=2026-10-14T21:30&wx=clear&force=no-planes,no-water', 'nw-party': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-water',
  'nw-neon': 'when=2026-10-17T23:00&wx=clear&force=no-planes,no-water,neon-party,searchlights,spell&text=2027',
  // CITY 2.0, Part 5: the harbor's worst — the neon's party + searchlights + a word, a real fog (the beam at its widest), the
  // water taxi crossing non-stop (its wake + its own reflection), the wheel's show, Rosie, the beam
  'h-worst': 'when=2026-10-17T23:00&wx=fog&force=no-planes,neon-party,searchlights,spell,taxi&text=2027',
  'h-night': 'when=2026-10-14T21:30&wx=clear&force=no-planes,taxi',
  // (one Part 5 piece off at a time, against h-night: its cost on one page)
  'h-nb': 'when=2026-10-14T21:30&wx=clear&force=no-planes,taxi,no-boats', 'h-nw': 'when=2026-10-14T21:30&wx=clear&force=no-planes,taxi,no-wakes',
  'h-nwh': 'when=2026-10-14T21:30&wx=clear&force=no-planes,taxi,no-wheel', 'h-nbm': 'when=2026-10-14T21:30&wx=clear&force=no-planes,taxi,no-beam',
  'h-none': 'when=2026-10-14T21:30&wx=clear&force=no-planes,taxi,no-boats,no-wheel,no-beam', 'h-day': 'when=2026-10-14T14:00&wx=clear&force=no-planes,taxi',
  // 8b2 Group 3 — ROSIE IN 3D: at her landing at night (lit, her bulbs, the wheel idling) / by day; coming home (on any commit: she
  // moves — before 8b2 astern, now bow-first into her turn); her turn on a loop (&force=rosie-turn; --vs r-dock: the turn's cost)
  'r-dock': 'when=2026-10-14T22:30&wx=clear&force=no-planes', 'r-dock-day': 'when=2026-10-14T13:00&wx=clear&force=no-planes',
  'r-arrive': 'when=2026-10-14T21:38:20&wx=clear&force=no-planes', 'r-turn': 'when=2026-10-14T22:30&wx=clear&force=no-planes,rosie-turn', 'r-turn-day': 'when=2026-10-14T13:00&wx=clear&force=no-planes,rosie-turn',
  // CITY 2.0, Part 6a: THE EVERYDAY SKY — each piece forced (on the commit before, the same URL is the plain scene: A-B-B-A gives
  // the piece's whole cost): planes by day (+ the gulls, the capped contrails), a night approach, the banner plane, skytyping, the
  // helicopter at night (its searchlight), the drone show (its launch + the first formation), the aurora, and the worst sky: a
  // party peak + the drone show
  's-day': 'when=2026-10-14T14:00&wx=clear&force=planes', 's-night': 'when=2026-10-14T21:30&wx=clear&force=approach',
  's-banner': 'when=2026-10-14T14:00&wx=clear&force=no-planes,banner', 's-skytype': 'when=2026-10-14T14:00&wx=clear&wind=2&force=no-planes,skytype&text=HAPPY%20BIRTHDAY%20STEVE',
  's-heli': 'when=2026-10-14T21:30&wx=clear&force=no-planes,helicopter', 's-drones': 'when=2026-10-14T21:30&wx=clear&force=no-planes,drones&text=HELLO&show=heart',
  // PART 8b1: THE WILDLIFE — a busy weekday noon with the whole flock + the gulls landing + the squirrel + the fish (wl-noon), a party
  // night with the coyote + the cat out (wl-party); -off: the same with every animal off (--vs: the wildlife's cost)
  'wl-noon': 'when=2026-10-14T12:15&wx=clear&force=no-planes,pigeons,gulls-land,squirrel,fish', 'wl-noon-off': 'when=2026-10-14T12:15&wx=clear&force=no-planes,pigeons,gulls-land,squirrel,fish,no-wildlife',
  'wl-party': 'when=2026-10-17T23:00&wx=clear&force=no-planes,coyote,cat-out', 'wl-party-off': 'when=2026-10-17T23:00&wx=clear&force=no-planes,coyote,cat-out,no-wildlife',
  // 8b1's speed round (A-B-B-A against the commit before the pass): a busy weekday late morning with the workers (the window washers,
  // the newsboy, a truck) + the wildlife, and a Saturday party night (the line, the doorman, the dance, the animals)
  'life-noon': 'when=2026-10-27T11:20&wx=clear&force=no-planes', 'life-noon-forced': 'when=2026-10-27T11:20&wx=clear&force=no-planes,pigeons,gulls-land', 'life-party': 'when=2026-10-24T22:30&wx=clear&force=no-planes',
  // 8b2's speed round: THE TR-3B on a normal weeknight (it must cost what the same night costs) — the whole 50 s event looping; vs the night
  'tr3b': 'when=2026-10-22T22:00&wx=clear&force=no-planes,tr3b&lgnow=1', 'tr3b-night': 'when=2026-10-22T22:00&wx=clear&force=no-planes',
  // (held moments of it: the city dead overhead, the flicker-out as it arrives, the jets' pass; + PARTY ON under it)
  'tr3b-dark': 'when=2026-10-22T22:00&wx=clear&force=no-planes,tr3b&lgs=20', 'tr3b-dying': 'when=2026-10-22T22:00&wx=clear&force=no-planes,tr3b&lgs=6',
  'tr3b-jets': 'when=2026-10-22T22:00&wx=clear&force=no-planes,tr3b&lgs=30.4', 'tr3b-party': 'when=2026-10-22T22:00&wx=clear&force=no-planes,party,tr3b&lgs=20',
  // 8b2's raid (the patrol cars, the wash, the flashlight + the front car's spotlight) on a weeknight; on the commit before: the plain night
  'raid': 'when=2026-10-22T22:00&wx=clear&force=no-planes,raid',
  // 8b2: a busy harbor by day with Rosie in 3D on the move (casting off at 2 pm; the taxi crossing) — and at night returning lit
  'h-rosie': 'when=2026-10-26T14:00:30&wx=clear&force=no-planes,taxi', 'h-rosie-night': 'when=2026-10-26T21:38:30&wx=clear&force=no-planes,taxi',
  's-aurora': 'when=2026-10-14T23:30&wx=clear&force=no-planes,aurora', 's-worst': 'when=2026-10-17T23:00&wx=clear&force=no-planes,neon-party,drones&text=HELLO&show=heart',
};
const names = arg('scenes', 'party,night,day').split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * f))] : 0; };
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const med = a => q(a, 0.5);
const r2 = v => +v.toFixed(2);

// the rAF wrapper (installed before any page script): intervals between distinct frames + the callbacks' time per frame
const BENCH = `(() => {
  const raf = window.requestAnimationFrame.bind(window);
  const B = window.__bench = { on: false, iv: [], work: [], ts: -1, w: 0,
    start() { this.iv = []; this.work = []; this.ts = -1; this.w = 0; this.on = true; },
    stop() { this.on = false; return { iv: this.iv, work: this.work }; } };
  window.requestAnimationFrame = cb => raf(ts => {
    if (B.on && ts !== B.ts) { if (B.ts >= 0) { B.iv.push(ts - B.ts); B.work.push(B.w); } B.ts = ts; B.w = 0; }
    const t0 = performance.now();
    try { cb(ts); } finally { if (B.on) B.w += performance.now() - t0; }
  });
})();`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio', ...(process.argv.includes('--gpu') ? ['--enable-gpu', '--use-angle=d3d11'] : [])] });

async function openPage(base, name) {
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.evaluateOnNewDocument(BENCH);
  const mobile = VW < 800;
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
  await page.goto(`${base}/tests/integration/title-preview.html?${SCENES[name] || name}${AT}${CITY !== '1' ? `&city=${CITY}` : ''}`);
  const end = Date.now() + 25000;
  while (Date.now() < end && !(await page.evaluate('!!(window.__district && window.__district.phase().done)').catch(() => false))) await sleep(150);
  const cdp = await page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  return { page, cdp, errs, base };
}
// (the page measured comes to the front; the other turns hidden and its scene stops. CDP's frozen state can't be used: a page
// thawed from it stays hidden with no rAF in headless Chrome)
const front = P => P.page.bringToFront();
// the city settled: no bake, no crossfade, no tier probe, the tier asked for (City 1.0: the tier only)
const SETTLED = t => `(() => { const d = window.__district; if (!d) return false; const s = d.scene(); if (!s || s.tier !== ${t}) return false;
  const h = d.harbor && d.harbor(), tg = d.tiering && d.tiering();
  if (tg && tg.probe) return false;
  return !h || (h.shown && !h.pending && !h.fading && (!h.rate || h.rate.fast !== 'bake')); })()`;
async function settle(P, t, ms = 15000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await P.page.evaluate(SETTLED(t)).catch(() => false)) return true; await sleep(200); }
  return false;
}
async function setTier(P, t) { await P.page.evaluate(`window.__district.setTier(${t})`); return settle(P, t); }
const HIST = "JSON.stringify(window.__district.tiering ? window.__district.tiering().hist : [])";
const PROBE_LOG = new Set();
/** one measuring window on page P at tier t: { iv, work, cost } — or null when the tier kept moving / it never settled */
async function windowOn(P, t) {
  for (let k = 0; k < 2; k++) {
    if (!(await settle(P, t))) { await P.page.evaluate(`window.__district.setTier(${t})`); continue; }
    await sleep(2000);                                           // the same warm-up every time (after coming to the front too)
    const h0 = await P.page.evaluate(HIST);
    await P.page.evaluate('window.__bench.start()');
    await sleep(SECS * 1000);
    const r = await P.page.evaluate('window.__bench.stop()');
    const cost = await P.page.evaluate('window.__district.cost()');
    const h1 = await P.page.evaluate(HIST), tier = (await P.page.evaluate('window.__district.scene()')).tier;
    if (tier === t && h0 === h1) return { iv: r.iv, work: r.work, cost };
    if (!PROBE_LOG.has(P.base)) { PROBE_LOG.add(P.base); console.log(`  (${P.base}: the tier moved during a window — thrown away, re-run; the tiering: ${h1})`); }
    await setTier(P, t);
  }
  return null;
}
const sum = w => ({ p95: q(w.iv, 0.95), slow: 100 * w.iv.filter(v => v > 20).length / Math.max(1, w.iv.length), work: mean(w.work), wp95: q(w.work, 0.95), cost: mean(w.cost) });
const fmt = s => `frame p95 ${r2(s.p95)} · ${s.slow.toFixed(1)}% slow · work ${r2(s.work)} / p95 ${r2(s.wp95)} · scene ${r2(s.cost)}`;
const FIELDS = ['p95', 'slow', 'work', 'wp95', 'cost'];

const out = [];
let failed = false;
for (const name of names) {
  if (!BASE_A) {
    // ---- ABSOLUTE: one page, the numbers + the budgets as warnings
    const P = await openPage(BASE, name);
    const row = { scene: name, city: CITY, cpu: CPU, size: `${VW}x${VH}`, tiers: [] };
    for (const t of TIERS) {
      await setTier(P, t);
      const w = await windowOn(P, t);
      row.tiers.push(w ? { tier: t, ...sum(w) } : { tier: t, invalid: true });
    }
    row.errors = P.errs; out.push(row);
    console.log(`${name.padEnd(9)} city ${CITY} ${CPU}x CPU ${VW}x${VH}`);
    for (const r of row.tiers) {
      const warn = CITY === '2' && !r.invalid && r.work > BUDGET[r.tier] ? `   WARNING: over the t${r.tier} budget (${BUDGET[r.tier]} ms) on this laptop — check the phone (&debug=1)` : '';
      console.log(`  t${r.tier}: ${r.invalid ? 'INVALID (the tier kept moving)' : fmt(r)}${warn}`);
    }
    if (P.errs.length) console.log(`  ERRORS ${P.errs.join('; ')}`);
    await P.page.close();
    continue;
  }
  // ---- A/B in one run: both pages loaded, the idle one frozen, A B B A A B … per tier
  const A = await openPage(BASE_A, name), B = await openPage(BASE, VS || name);
  const row = { scene: name, city: CITY, cpu: CPU, size: `${VW}x${VH}`, tiers: [] };
  console.log(`${name.padEnd(9)} city ${CITY} ${CPU}x CPU ${VW}x${VH} — A ${VS ? name : BASE_A} vs B ${VS || BASE}, ${PAIRS} windows each of ${SECS} s`);
  for (const t of TIERS) {
    for (const P of [A, B]) { await front(P); await setTier(P, t); }
    const runs = { A: [], B: [] };
    const order = Array.from({ length: PAIRS * 2 }, (_, i) => (i % 4 === 0 || i % 4 === 3 ? 'A' : 'B'));
    for (const k of order) {
      const P = k === 'A' ? A : B;
      await front(P);
      const w = await windowOn(P, t);
      if (w) runs[k].push(sum(w));
    }
    const pick = k => Object.fromEntries(FIELDS.map(f => [f, med(runs[k].map(r => r[f]))]));
    const spread = f => Math.max(...['A', 'B'].map(k => { const v = runs[k].map(r => r[f]); return v.length ? Math.max(...v) - Math.min(...v) : 0; }));
    const res = { tier: t, A: pick('A'), B: pick('B'), n: [runs.A.length, runs.B.length] };
    const noiseW = spread('work'), noiseS = spread('slow');
    const dW = res.B.work - res.A.work, dS = res.B.slow - res.A.slow, dP = res.B.p95 - res.A.p95;
    const slowerW = dW > 0.5 && res.B.work > res.A.work * 1.1 && dW > noiseW;
    const slowerS = dS > 2 && dS > noiseS && dP > res.A.p95 * 0.1;
    res.verdict = !runs.A.length || !runs.B.length ? 'INVALID' : slowerS ? 'SLOWER (frame pacing)' : slowerW ? 'SLOWER (work)' : dW < -0.5 && -dW > noiseW ? 'faster' : 'same';
    if (/SLOWER/.test(res.verdict)) failed = true;
    row.tiers.push(res);
    console.log(`  t${t}: A ${fmt(res.A)}\n      B ${fmt(res.B)}\n      → ${res.verdict} (work ${dW >= 0 ? '+' : ''}${r2(dW)} ms, slow ${dS >= 0 ? '+' : ''}${dS.toFixed(1)} pts; noise ±${r2(noiseW)} ms / ±${noiseS.toFixed(1)} pts; ${res.n.join(' + ')} windows)`);
    if (CITY === '2' && res.B.work > BUDGET[t]) console.log(`      WARNING: B over the t${t} budget (${BUDGET[t]} ms) on this laptop — a warning only; the phone decides (&debug=1)`);
  }
  row.errors = [...A.errs, ...B.errs]; out.push(row);
  if (row.errors.length) console.log(`  ERRORS ${row.errors.join('; ')}`);
  await A.page.close(); await B.page.close();
}
console.log("(frame = rAF interval ms; slow = share over 20 ms; work = main-thread ms in rAF callbacks a frame, mean / p95; scene = the scene's own draw per drawn frame)");
if (process.argv.includes('--json')) console.log(JSON.stringify(out, null, 1));
await browser.close();
if (BASE_A && !VS && failed) process.exit(1);
