# DT1 — THE LIGHTS + SIGNS PASS (Oct 23 2026; Day touch-up part 1 — the blue-hour power-up, floodlights, the signs rethink; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## DT1 — THE LIGHTS + SIGNS PASS (Oct 23 2026; Day touch-up part 1 — the blue-hour power-up, floodlights, the signs rethink; behind `?city=2`)
The owner's notes (plan.md DAY TOUCH-UP (4), (5), (5b)–(5c), (6)): the city shouldn't light up in golden hour; more floodlight for
depth; one-word signs like "STAKES" tell nobody anything; the billboard floats and goes grey at night; the tagline is hard to read
over the moon; load hitches cost a tier. **Proved with `pixdiff.mjs`** against the commit before (a Thursday night at 402×874):
the change is only where this pass meant it — the signs (the left roof sign gone, the slot rule's names, the blade), the billboard,
the wheel backdrop's accent, the lit wall right of the lighthouse; noon and City 1.0 (noon 0 px; its night only its blades' timed
rotation, the old noise) unchanged. **This pass supersedes "City 1.0's light timeline is kept exactly" for the Harbor** (the
evening's order + its golden-hour half-lit windows); the small hours' thinning and the kitchens before dawn are still City 1.0's.

### 1. THE BLUE-HOUR POWER-UP (`core/harbor-dark.js`, PURE + tested; on the ONE darkness input)
- **Why nothing could stagger before:** the sky model's darkness (palette.js `P.dark`) sat FLAT at 0.35 from +5° to −4° (golden
  hour's own value) — the neon at 30 %, half the windows lit, all through golden hour. **THE DUSK CURVE** (`DUSK`, `duskDark(el)`):
  the Harbor's darkness now follows the real sun's elevation — 0 by day, ~0.06 at +4° (the billboard's lamps), 0.2 at sunset
  (−0.8°), 0.9 at the end of the blue hour (−7°, ~30–35 min at 43° N), 1 at −12°; the same curve at dawn. `darkness({ sky, el,
  cloud, storm, eclipse })` takes the elevation (ALWAYS NIGHT passes none: the sky model's 1); Part 9's storm term still darkens it.
- **THE POWER-UP:** `power(k)` = 0 at sunset → 1 at −7°. Every light has its place in it (`powerOrder(nightKey, items)`, seeded by
  the date): the OUTLINES follow tonight's SWEEP (left → right, right → left, the centre out, the edges in — `SWEEPS`) with a
  little scatter, so neighbouring buildings (a band's 3-block cluster is one item) light close together — CLUSTER BY CLUSTER; the
  SIGNS land one by one anywhere in their stage (`STAGE.signs` 0.04–0.72, `STAGE.neon` 0.06–0.84); each switches with its own
  sputter (neon.js#powerTick — the title's per-sign plan is no longer used by the Harbor; the NEON logo keeps its own timing). The
  morning: the same thresholds in reverse (the last on is the first off). Tested: never all at once (≥ 15 separate moments in the
  blue hour), a different order each night, nothing in golden hour, everything by night.
- **THE RAMPS re-cut for the curve** (`LIT`): `bill` (the billboard's lamps, the first light ~+4°), `lamps` (street lamps, stop
  lights' glow, quay + pier lamps, the waterfront strip, the wheel's + boats' lights — around sunset; the street lamps + stop
  lights moved off the tone weights), `logo`, `beams` (the lighthouse from sunset), `water`, `city`, `neon`, `glow`, `strings`,
  `flood` (new: THE FLOODLIGHTS fade up mid blue hour, baked in sixths — `T.flood`, blocks.js#floodK). Every ramp is full by 0.9,
  so the night looks exactly as before. `partyReady(k)`: a party night powers up first, then the show warms up as before.
- **THE WINDOWS** (`windowShare`, `windowBias`, `windowThreshold`; lights.js): golden hour ~5 % of the windows (a few — the LOWER
  floors first: a window lights when its order ≤ share^(1 + bias·(1 − low))), the blue hour → every window by its end; capped by
  City 1.0's timeline (P.win, golden hour's half counted whole) so the small hours still thin. Monotonic: through the power-up a
  window only comes on. At night the bias is 0 — City 1.0's order exactly. ("The sunlit faces show gold reflections" — Part 2.)
- **THE BLUE HOUR'S SKY + TONES** (`tones.js#blueHour`, `harborWeights`; palette.js `LOOKS.blue` — City 1.0's weights never carry
  it): the sky model turns from golden hour to night only by −14°, so the power-up ran against a salmon sky. The Harbor's look
  passes through a BLUE look (deep luminous blue overhead, softer low, a cool city glow, the first stars) — in from sunset to −4°,
  held to −7°, out by −12° (the same at dawn); the facades take the night's tones meanwhile (silhouettes against the blue, their
  windows + neon coming on). Golden hour and the night unchanged.
- **Previews:** the panel's TIME = POWER-UP (sunset − 28 min) / POWER-DOWN (sunrise − 52 min) at SPEED 20;
  `&when=2026-10-22T18:20&speed=20`, `&when=2026-10-23T07:30&speed=20`. `harbor().power` (0..1), `.powerUp` (tonight's sweep, the
  items on, each item's place), `.lamps`.

### 2. FLOODLIGHTS (`blocks.js`, baked; in the power-up, never by day)
- **THE WHEEL BACKDROP'S NEON ROOF ACCENT** (`core/harbor-neon.js` item `wheel-accent`): one fine GOLD Deco roofline on each floodlit
  near block behind the wheel (the cornice + a short step at each end), the only tubes allowed behind the wheel's disc — a thinner
  tube, a soft glow at 42 % (strength `accent`), never in the party's racing light or effects: calmer than the wheel.
- **BEHIND THE LIGHTHOUSE** (`behindLighthouse`, `cam.lhWall`): a warm uplight on the brick of the near + mid blocks standing behind
  the tower (a touch softer than the wheel's backdrop), laid over the finished face additively so it reads on the brick and the
  glass alike; the windows untouched (their own layer). **The beam brightens the wall** (`lighthouse.js#wall`): where the beam
  pointing away from us meets the wall, a soft warm patch slides across it, under the tower.
- **THE UPLIT LANDMARKS** (`UPLIT`, our picks): the EMPIRE (cool white), the SUNBURST (gold), the right edge's middle-tier tower
  (warm) — uplight washes up their shafts from the visible foot, each against the darker far towers.
- **THE WATERFRONT ROW** (`&force=flood-front`, off by default — the owner compares): the near band's front buildings get a low warm
  uplight on their bottom third, uneven (0.38–0.8 of full, ~1 in 5 dark), dimmer than the wheel's backdrop; the water mirrors it.
- (All washes start at the VISIBLE foot — the ground floor + the storefront strip hide the real one: drawn from the real foot they
  were invisible.)

### 3. THE SIGNS RETHINK (`core/harbor-neon.js` SPOTS + THE SLOT RULE, `signs.js`)
- **THE LEFT ROOF-SIGN SLOT IS GONE** (`n-roof`): the EMPIRE behind it shows whole — its full outline, fins, ledges and windows
  (nothing was keyed to the spot: the cut, the lit-window cut-out and the outlines follow). **3 named signs a night + the
  billboard**: the blade, the two right roof signs.
- **THE FULL NAMES** (`signs.js#signName`, `SIGN_NAMES`): HIGH STAKES, DOUBLE AGENT, NEON PAR always whole; the rest their one-word
  city names (SIGNAL, CIPHER, BLUFF, PRISM, PULSE, OVERCLOCK, GRIDLOCK, SLIPSTREAM, RUMRUNNER — the names the owner lists as
  one-word). **THE SLOT RULE** (`fitsSpot`): the blade one word ≤ 6 letters (the glance test: ≥ 10 pt letters), a roof sign one
  word ≤ 6 or TWO words each ≤ 6 STACKED on two lines (the same letter height, no mark — the mark would push them under 10 pt),
  the billboard any name on one line. OVERCLOCK / GRIDLOCK / SLIPSTREAM / RUMRUNNER fit no named sign at a readable size (9–10
  letters: ~7 pt on the blade) — they take the BILLBOARD. **THE WEEK'S ROTATION** (`assignSigns`, `billboardPick`): each calendar
  week a new seeded order rotated night by night through the spots (the blade first), the long single words on the billboard on
  the week's first nights — tested: every game shows every week; no cut-down name ever, at 390 / 402 / 430, 120 nights.
- **THE ROOF SIGNS' STEEL** (`frameGeom`, `roofFrame`, `frameLight`): heavier lattice legs + lacing, X braces, a CATWALK (a plank deck
  past both ends) with a thin RAILING (posts, a top + a mid rail) under each cabinet; at night the same steel drawn in the sign's
  own light (with its spill) so the frame reads as built. Size kept.
- **THE BLADE**, bolder: thicker, whiter letter tubes (lh × 0.17, a touch more glow); its marquee bulbs bigger (a socket ring + a
  glass bulb by day; lit dots 1.75–2.8 pt with a white-hot heart), the unlit ones warmer, spaced 4.1 pt.
- **THE BILLBOARD** (`buildBillboard`): ONE poster by day and night — the game's mark at top centre on a Deco sunburst, the FULL NAME
  across it in a condensed sign-writer's hand (80 % width; no tag line), a moulded frame; **BUILT**: it stands ON the roof of the
  near block behind it — those blocks are lowered so their roof lands 9 ref pt under the board (`core/harbor-layout.js#BILLBOARD`;
  their old roofs were hidden behind the board) — on three A-frames + X braces, a CATWALK along its foot with a thin RAILING and a
  ladder (Part 8's billposter climbs it), galvanised steel in the sun by day, dark at night. **How many billboards: ONE** (`bb-left`,
  phones; a wide screen drops it — its panorama blades carry the games).
- Tests: the slot rule, the full names at three sizes, every game every week, the glance test per spot, the billboard on its roof
  at three sizes; e2e: 3 named + the billboard.

### 4. THE BILLBOARD'S LAMPS (`signs.js#gooseneckLamps`, `drawGooseneck`, `lampLightMap`, `lampGlows` — reusable: Part 7's ghost ad)
FOUR 1920s gooseneck lamps over the top edge, two each side of the mark (the conduit, the arched neck, an enamelled shade) —
hardware all day. Warm incandescent (~2700 K, `LAMP_C`). ON from late golden hour (`LIT.bill`, ~+4°: the first light of the
power-up — a warm pool down the poster, brightest at the top, a faint cone under each shade), a DIM WASH once the neon is up
(`LAMP_DIM` 0.5 — M3: 0.1, the whole board lit all night, #m3-fix-pass — judged side by side with off / full: off is the old dull dark board, full competes; the wash reads as a lamp-lit
poster beside the neon), on again at dawn until a little after sunrise, off by day. The board item switches with them (its
sputter). Hooks: `harbor().moment('lamps', 0 | 1 | null)` (Part 7's raid, the TR-3B's drain); `&force=lamps-on` / `lamps-off`.

### 5. THE THIN GLASS TOWER (`glassL`)
A FINE full outline every night (up both edges from the foot, over the roof — the glass towers' contour, ice white; deep: thin + dim),
3–4 seeded LIT FLOORS down the glass (lights.js), its LED facade's soft glow as before; on a party night its outline joins the show
and it gets A SKY BEAM (`skybeams.js`: thinner + fainter than the others, ice-white with a touch of the colour sweep — the row's
gap filled). It stays the calmest tower.

### 6. THE SIGN'S DARK HALO + THE MOON (title.css `.nd-c2`, scene.js#signHalo / tagMoonDim)
A soft dark halo hugging each letter, always on: the TAGLINE by CSS (stacked text-shadows; stronger with the sun / moon right behind
it), the NEON word's tubes + SPEAKEASY's letters painted on the sky behind the sign (one cached sprite of the letters, blurred —
`blurWorks()` or a shadow on Safari < 18; the LIVE rects: `textRects.neon` + the new `textRects.glyphs`). Dark on the dark night
sky (invisible), it shows only where something bright sits behind — the moon, the day sky, a beam. Never a box. THE MOON dims
~27 % while its disc sits in the tagline's band (eased ~1 s). `&force=no-halo` turns both off (the comparison). City 1.0's sign
untouched (`.nd-c2` is City 2.0's root class).

### 7. Small fixes
- **LOAD HITCHES NEVER COST A TIER** (scene.js#perf): nothing steps for `TIER_GRACE` 8 s after the city shows, and the first window
  judged after it holds no frame from before (the owner's 2→1→2 at load — a probe there could even read the hitch as a capped
  phone). THE SESSION line now has a twin: `after 10 s …` (the same count from 10 s after the city showed — the honest one).
- **THE `&debug=1` READOUT** moved to the BOTTOM: just above the dock, over the promenade, full width minus the 16 pt gutters, a
  dark translucent box (canvas: taps pass through), long lines cut with "…" — checked at 390 / 402 / 430.
- The panel: a LIGHTS group (WATERFRONT FLOODLIGHTS, BILLBOARD LAMPS ON / OFF, SIGN HALO OFF) + TIME = POWER-UP / POWER-DOWN.
- `shots.mjs`: a custom crop's file is named by it (`-c0x420x150x140`); `e2e-smoke.mjs`: `GAMES=cipher` (the one-game smoke check).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Golden hour `2026-10-22T18:20`; the power-up `…T18:20&speed=20`; a normal night `T22:00`; the party `2026-10-24T23:00`; the waterfront
flag `T22:00&force=flood-front`; dawn `2026-10-23T07:30&speed=20`; noon `T12:30`; the moon behind the tagline `T22:00` (and
`&force=no-halo` to compare). Shots: `shots.mjs --scenes d-golden,d-night,d-party,d-noon --crop skyl3,skym,skyr3`.

### Performance
PERF (A/B in one run, `title-perf.mjs --ab` against 673d4ac, 402×874, 4× CPU, the laptop without a GPU, 3 + 3 windows of 5 s):
| scene · tier | A (before): frame p95 · slow · work mean | B (DT1) | verdict |
| --- | --- | --- | --- |
| `np-night` t2 | 16.8 ms · 0 % · 6.26 ms | 17.1 · 0 % · 4.19 | same (noise ±3.2 ms) |
| `np-night` t1 | 17.4 · 0 % · 3.37 | 17.3 · 0 % · 3.47 | same |
| `np-night` t0 | 17.2 · 0 % · 2.12 | 17.1 · 0 % · 3.44 | same (noise ±1.4 ms) |
| `np-party` t1 | 16.8 · 0 % · 7.51 | 16.8 · 0 % · 7.40 | same |
| `np-party` t0 | 17.2 · 0 % · 4.67 | 17.2 · 0 % · 4.73 | same |
| `np-golden` t2 | 17.1 · 0 % · 4.97 | 17.2 · 0 % · 3.49 | same |
| `np-golden` t1 | 17.3 · 0 % · 3.23 | 17.4 · 0 % · 2.92 | same |
| `np-golden` t0 | 17.1 · 0 % · 4.93 | 17.2 · 0 % · 3.11 | faster (no neon in golden hour now) |
The party's tier 2 stepped itself down on BOTH commits here (raster-bound without a GPU, as in C1.5) — the owner's `&debug=1`
SESSION line (now with its `after 10 s` twin) is its measure. The budget warnings (party t1 > 6 ms, t0 > 4 ms) are the same on
both commits. New per-frame costs are small: the halo (one drawImage), the wall glow (≤ 2 drawImages), the billboard's light
(its sprite, as before), the glass tower's beam (one more sprite on a party night).

### Known issues (DT1)
- **WebKit still can't run here** — the owner's iPhone: the halo's blur (`blurWorks()` / the shadow fallback), the lamps, the readout.
- The long single-word names (OVERCLOCK, GRIDLOCK, SLIPSTREAM, RUMRUNNER) only ever hang on the billboard on a phone (the blade
  and the roof signs can't show them ≥ 10 pt): each gets the board once a week. The owner listed OVERCLOCK among the blade's names —
  it doesn't fit readably; her call if a bigger slot is wanted.
- The waterfront row is behind `&force=flood-front` until the owner decides; the uplit landmarks are our picks (EMPIRE, sunburst,
  m-right) — easy to change (`blocks.js#UPLIT`).
- The billboard's tiny steel (the A-frames are ~9 pt tall) reads as a frame, not as detail, at phone size — enough to stand it.
- The facades' blue-hour tones step in sixths (a crossfaded re-bake each); the dawn's last step to day (~sunrise) is a visible
  change over its 1.2 s crossfade, as before.

### Handoff → DAY TOUCH-UP PART 2 (DT2 — the day look) — done, below
The day itself is next: real clouds (`clouds.js` — a full rework), stronger sunlit / shaded faces, windows less grid-like (the sunlit
faces' GOLD REFLECTIONS in golden hour belong there — `blocks.js#dayPanes`). The light logic is done: every light reads `DK` through
a ramp or the power-up (`core/harbor-dark.js`); Part 9's storm afternoons only need `DARK_TERMS.storm` / `cloud` turned on.
