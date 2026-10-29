# CLEANUP C1.5 — CLEANUP + SPEED (Oct 22 2026; the fixes from review #2 — no visual change)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## CLEANUP C1.5 — CLEANUP + SPEED (Oct 22 2026; the fixes from review #2 — no visual change)
The source of every item: `docs/harbor/review-2.md` (Fable's audit). **Proved unchanged** with `tests/integration/pixdiff.mjs`
against the commit before at 402×874 (A with `&wheelbg=d`, the owner's pick): a normal night, the party at 23:00, noon, golden
hour, Halloween + St Patrick's (the swapped O) — nothing beyond the run-to-run noise (night: 297 px = 0.009 % next to the windows
that switch at random; noon / golden: one 3×6 pt spot under the noise; party, Halloween, St Patrick's: 0 px); the party as 8 moving
frames 250 ms apart side by side: the same punch, beams, wheel and neon. The O only differs in time: it no longer loses its core.

### 1. The O's white core (review §2)
The holiday O's rules (`css/title.css`) now need the swapped O (`.ndl-3[data-kind] …`, set by `title.js#swapO`) and fall back to
the logo's own pinks; the flutter (`title.js#premiumLogo`) adds / removes a class (`.ndl-core.is-flut`, opacity 0.8 — it outranks
the tired core as the inline style did), never `core.style`. E2E (`neon` group): the flutter forced onto the O → every core keeps
its stroke and no `style` attribute; a stray `style=""` on the plain O keeps the core; the Halloween + St Patrick's O keep their
colours.

### 2. The wheel's backdrop: d, for everyone
The owner's pick — ARCHITECTURAL FLOODLIGHTING (`blocks.js#floodWash` under dark panes, the dusky violet-blue tones, no rim light,
no lit windows behind the wheel) — is the only version; a / b / c, their rim light + roof silhouettes, the window injection and the
`&wheelbg` flag are gone (scene.js, blocks.js, lights.js, the docs). The roof accent + more floodlights are the Day touch-up's.

### 3. THE SAFARI FLOOR
- **The games + City 1.0 still parse on old iOS:** the top-level `await` in `title.js` is gone — `harborReady` (a promise; a failed
  load falls back to City 1.0) and `harborPending()`; `app.js` keeps the title on the boot screen until it settles (a few ms;
  `title-preview.html` awaits it). `tests/safari-floor.test.mjs` parses every module in `js/` as a classic script (imports /
  exports stripped): a top-level `await` anywhere fails the unit suite.
- **The Harbor's floor is iOS 16 / Safari 16** (the owner's decision): `roundRect` (~35 calls) and `Array.prototype.at` stay;
  `color-mix()` in the party glow degrades gracefully before 16.2; `ctx.filter` only behind `blurWorks()` (Safari < 18 has none).
- **Out of canvas memory never freezes the city:** every Harbor `getContext` goes through `canvas-safe.js#safeCtx` (a unit test
  forbids a raw call under `js/screens/harbor/`): a refused context returns a stand-in that draws nothing (the layer comes out
  blank) and counts the miss — the scene steps its tier down (≤ once per 2 s) to free memory. A frame that throws anyway is
  caught: logged once, 3 in a row step the tier down, 30 in a row stop the loop on the last good frame (a later `start()` — the
  page shown again — tries again).
- Risky on older iPhones (written down, not changed): the frost pane (a full-screen canvas while it freezes), the rainbow's 4–5
  bakes, the skywriting layer — together ~15 MB of transients outside `memAll()` (review §1c; the readout under-reports them).

### 4. THE SPEED GATE + THE PHONE'S READOUT
- **THE GATE IS A RELATIVE A/B IN ONE RUN** (the owner's decision): `node title-perf.mjs "<browser>" --city 2 --ab
  http://localhost:5174 --scenes np-night,np-party` (A = a `git worktree` of the commit before on :5174, B = the working tree on
  :5173). Both pages load once; the one being measured comes to the front so the other is hidden and its city stops (CDP's
  "frozen" state can't be used: a thawed page stays hidden in headless Chrome); A B B A A B windows (`--pairs`, the same 2 s
  warm-up), each started only on a settled city (no bake, crossfade or tier probe, the tier asked for) and thrown away if the
  tier moved during it. Measured with a `requestAnimationFrame` wrapper installed before the page's scripts (works on any commit):
  the frame intervals and the rAF callbacks' work per frame (+ the scene's own `cost()`). Verdict per tier: `SLOWER (frame
  pacing)` when B's slow share is > 2 points worse, beyond the windows' spread and with p95 10 % worse; `SLOWER (work)` when
  > 0.5 ms, > 10 % and beyond the spread; else `same` / `faster`; exit 1 on SLOWER. The absolute budgets (8 / 6 / 4 ms) print as
  WARNINGS. `--vs <scene>` measures a flag's cost on one server. Model the device: tier 2 = `--cpu 1–2` (a party night at 4×
  without a GPU steps itself down: setTier pins only against stepping up), tier 0 = 4×.
- **This laptop's limits, measured:** headless Chrome without a GPU is raster-bound on a party night — frames 33–100 ms at 4×
  and ~57 % slow even at 1× on BOTH commits, the tier probing down on its own. So: the party's tier 0 and the night's every tier
  are A/B-able here; the party's tier 2 is the phone's call. The E2E's `perf` group reports the numbers as warnings (its check:
  it measured), and reads MEMORY at tier 0 (the party stepped the tier between its two readings: a flaky check before).
- **THE SESSION on `&debug=1`:** a new readout line — `session 2.4% slow · 87 of 3605 in 61 s · run 3 · max 52 ms`: every rAF
  interval since the city first showed (a hidden page doesn't count), how many ran over 20 ms (a missed vsync at 60 Hz), the
  longest run of them in a row, the longest frame. One honest number after a minute (the 1.5 s line above it flickers). Also
  `scene.session()` for tests.

### 5. The party's fill (review §1b) — what was cheaper without a look change, and what wasn't
- **THE SKY BEAMS** (§1b-3): the sprite's shape (each pixel's alpha + its run to white — the beam is linear in its colour) is
  computed once; a new colour is a few multiplies a pixel (no `Math.pow`), the foot comes from the same table (no `getImageData`
  readback), the cache drops its oldest of 40 instead of wiping all 24. The same pixels (pixdiff), the rebuild during a colour
  sweep a fraction of before.
- **THE WATER'S BUILD** (§1b-2): the 10 Hz mirror build never starts on a punch frame (the neon's punch > 0.2) — it waits ≤ 160 ms
  from the last build (the mirror is 0–95 ms old anyway): the two heaviest things of a party frame no longer land on one frame.
- **THE PUNCH** (§1b-1): **not changed — no cheaper draw gives the same pixels.** The punch is `dst + a·sprite` for a > 1 (two
  additive draws: 1, then a − 1); one draw can't exceed alpha 1, and a pre-brightened sprite saturates in the tube's bright body
  (it would dim the decay frames). On this laptop its second draw measured within the noise (`--vs n4-punch`, 1×: −0.36 ms,
  noise ±3); the live water (−2.65 ms) and the beams' fill (−2.09 ms) weigh more here. **Her iPhone decides** with the flags
  below; if `no-punch` alone drops the session's slow share to 0–3 %, the options (each a small look change — her call): punch
  with alpha at tier 2 (the tier-0 way: dimmer between beats instead of brighter on them), or punch only the outlines.

PERF (A/B in one run, against 61e4764, 402×874, A B B A A B × 4 s, the laptop without a GPU):
| scene · tier · CPU | A (before): frame p95 · slow · work mean | B (C1.5) | verdict |
| --- | --- | --- | --- |
| `np-night` t2 · 2× | 17.1 ms · 0 % · 2.26 ms | 17.0 · 0 % · 2.32 | same (noise ±2.3 ms) |
| `np-night` t1 · 2× | 17.1 · 0 % · 1.99 | 16.8 · 0 % · 1.92 | same |
| `np-night` t0 · 4× | 16.9 · 0.4 % · 5.45 | 17.0 · 0.4 % · 5.49 | same |
| `np-party` t0 · 4× | 33.4 · 47 % · 16.48 | 33.4 · 53 % · 16.19 | same (noise ±24 pts: raster-bound here) |
| `np-day` t2 · 2× | 16.8 · 0 % · 1.89 | 16.8 · 0 % · 1.83 | same |
| `np-day` t1 · 2× | 16.8 · 0 % · 2.99 | 16.8 · 0 % · 2.68 | same |
At 4× the night's + the day's tiers 2 / 1 probed down mid-window on BOTH commits that afternoon (thrown away, as designed); the
party's tier 2 is raster-bound here (above). The fill fixes (the beams' rebuild, the water off punch frames) don't show in these
means — they are spikes during colour sweeps and on punch frames: the owner's SESSION line on her iPhone is their measure.

### 6. Two foundations (no visible change today)
- **ONE "HOW DARK IS IT" INPUT** (`core/harbor-dark.js`, PURE + tested): `darkness({ sky, cloud, storm, eclipse })` — the sky
  model's darkness (palette.js `P.dark`: the real sun through City 1.0's light timeline) plus terms that only darken (all 0 today:
  `DARK_TERMS`), computed with the palette (`DK` in scene.js) and read by every lighting decision through a NAMED RAMP (`litK(DK,
  name)`: `water` 0.15+0.5, `neon` 0.2+0.5, `city` 0.25+0.5, `lamps` 0.3+0.45, `strings` 0.3+0.4, `logo` / `glow` 0.3+0.5, `beams`
  0.35+0.4 — each exactly the old threshold, unit-tested), `windowsNight` (the light key's switch) and `isNight` (the sign caught,
  tier 0's calm). `harbor().dark` shows it. **For the Day touch-up:** the blue-hour staggered power-up is a per-light stagger over
  these ramps. **For Part 9:** turn on `storm` / `cloud` (from `clouds.set({ dark })` + the real cover) and a storm afternoon lights
  the city. Still on the tone weights (`T.night`, the light's colour, baked per look key) and not routed yet — the Day touch-up
  moves them with the power-up: the street lamps + the stop lights' glow (scene.js), the floodlights / the wheel's backdrop / the
  crowns (blocks.js, baked), the wheel's + the boats' own night looks.
- **THE SIGN-DIM HOOK** (depth rule 2; `core/harbor-signdim.js`, PURE + tested): `harbor().dimSign(id, { logo, tag, ms })` asks
  (defaults: the logo to 0.35, the tagline gone, 1.2 s), `dimSign(id, null)` lets go; several asks resolve to the dimmest; the last
  one gone brings the sign back. `scene.signDim()` reads it; `title.js#applySignDim` turns it into `--sd-logo` (opacity on the
  logo's wrapper + SPEAKEASY's letters — nothing else writes those) and `nd-tag-sky` + `--sd-tag` (the tagline), transitioned over
  `--sd-ms` (opacity only). E2E: dims to 0.3 / 0.3 / 0 and comes back to 1. **Unused until Part 6b** (the drones, skywriting,
  skytyping, the banner plane call it). The older `holdTag` (the drone show's tagline step-aside) stays until 6b moves it here.

### 7. Tidy-ups
UFO + THE MOON CAT hidden in the panel (`ready: false` in `core/harbor-remote.js#EVENTS`; `PANEL_EVENTS`; the ids stay valid);
LIGHTNING's hint "with WEATHER = STORM"; playwright reverted (tests/integration/package.json); dead code gone (`STRENGTH`,
`boatSpeed`, `LIT_GROUPS`, `skyPos` + `fs.skyPos`); the searchlights' warm-up (`beamK`) per 60 Hz frame (it ran at half speed at
30 Hz — Low Power Mode). `title-perf.mjs` rewritten (above), `pixdiff.mjs` new.

**Left for later (visual, or a later part's — review list B):** the stars' DPR + `memAll()` telling the truth (§1c: the merge at
tier 1 / 0 — touches the look, measure first: C2), `core/mathx.js` + `glowDot` (C4 / C8: the next part touching ≥ 5 files),
`core/harbor-tiers.js` + named fades (C5 / C7), splitting scene.js / neon.js / harbor-neon.js / harbor-layout.js (C9: the first step
of the part that next touches each), the pair sprites without `shadowBlur` + the pump's per-job budget + one searchlight draw
(§1b-4 / 5: Part 10), the water's columns K on a party (a look change), a messages lane over the sign (D3: 6b), the hooks E2E +
clouds / day E2E + a `blit` unit test (T3: Part 9), seasons in the tones (Part 9), one party switch (C11: Part 10), the seeded
everyday sky + the beat seed (C13: Part 11), 44 pt pads on the eggs (D4: Part 12), a profanity filter + a rate bucket on
`/api/admin` (A1 / A2: Part 13), the BATTERY + RE-LAYOUT probes made condition-based (T2), a harbor CI job (T6).

### Tests (C1.5)
The unit suite 463 (+ `safari-floor.test.mjs`: no top-level await, no raw `getContext` in the Harbor, `safeCtx`; `harbor.test`: the
darkness input = the old thresholds, the sign-dim hook, the panel's hidden rows); e2e-harbor 100 checks (+ the O's core, the holiday
O, the sign-dim hook; `perf` = warnings + MEMORY at tier 0) — the emulators now run here (the project's JRE on the PATH:
docs/testing.md); rules 45, `/api` 20, the smoke test 14 / 14, e2e-title `gate,neon` 35 / 35; City 1.0 pixel-diffed against the
commit before: noon 0 px, the night's only change its blade signs' timed rotation (the old commit against itself: the same).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
A normal night `2026-10-22T22:00`; the party `2026-10-24T23:00`, then the same with `&force=no-punch`, `no-water`, `no-beams`,
`no-clouds` — read the readout's SESSION line after a minute each (music on); the one that drops it most names the cost; noon
`2026-10-22T12:30`.

### Known issues (C1.5)
- **The punch's second draw is unchanged** (§5): the owner's iPhone with `&force=no-punch` decides whether to trade a little of
  the look for it.
- **The party's tier 2 can't be A/B'd on this laptop** (headless, no GPU: raster-bound, it steps itself down at 1× too); its
  tier 0 and the night can. WebKit still can't run here.
- The everyday sky's pieces still spawn on `Math.random` (planes, satellites, birds): `pixdiff` turns them off for its stills.

### Handoff → THE DAY TOUCH-UP (DT)
Build the blue-hour staggered power-up on `core/harbor-dark.js` (the ramps; move the `T.night` gates listed in §6 onto it), the
wheel's roof accent + floodlit buildings on top of the d backdrop (`blocks.js#floodWash`), and prove each look with `pixdiff.mjs`
(night unchanged) + the A/B gate (`title-perf.mjs --ab`). 6b: call `harbor().dimSign()` from the message pieces.
