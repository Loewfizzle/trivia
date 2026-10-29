# FP3a — FOREGROUND POLISH 3a: THE FIXES EVERYONE SEES + THE CLEANUP + THE PEOPLE'S COLOURS (Oct 24 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## FP3a — FOREGROUND POLISH 3a: THE FIXES EVERYONE SEES + THE CLEANUP + THE PEOPLE'S COLOURS (Oct 24 2026; behind `?city=2`)
From `docs/harbor/review-3.md` §C items 1–6 (FREV), in that order; the owner's answers: the weather's area stays 0.5°, no multi-model
median yet; the day's surge holds its peak ~300 ms longer; the folded overlays at the TOP under the corner buttons; FP3b (items 7–13:
the facing + walk cycle, real doors, the dance circle, the facade, the jets + the bus livery) follows.

### 1. THE POLE CHECK (a test bug — FREV B5)
The party probe read ONE column down the middle of the glass, where the lit pole's LED core adds ≈ (118, 122, 128). It now reads two
columns at 0.25 + 0.75 of the glass's width (either passing) in one frame between beats — a hard `ok` again (`okF` → `ok`). The pole
itself was right.

### 2. THE SURGE — every time the music starts (`title.js` THE MUSIC STARTING, `district/neon-ramp.js#createStartDetector`)
The surge was lost to a tap-armed 6-s watch (a cold song start on cellular took longer) and a once-per-visit flag spent before the
answer ran (FREV B3). Now: ONE detector on the title's 100 ms tick — the song's clock silent ≥ 1 s (or since the page came up) and then
MOVING = a start — so the first tap, the music button back ON and a rescue after the background all answer the same way; ONE entry
`signSurge(reason)` with a **10 s cooldown** stamped only when it really ran; the gate on the sign's REAL lit state on screen
(`is-steady && !is-day` → `firstTapAnswer`'s new `lit`); an answer that can't run yet (the intro, a race / the catch running, the race's
SVGs not in) is **PENDING** and fires from `finish()` or the running race's end (within 8 s). By day the surge **holds its peak + bloom
~300 ms longer** (`RACE.surge.hold`). `__district.surge()` → `{ count, last, pending, cool, running }` (no more `spent`).

### 3. THE DEBUG STRIPS (`ui/debug-strip.js`; `audio/diag.js`; `scene.js#readout`)
The readout was drawn ON the canvas over the promenade's middle (and ran `measureText` per line per frame inside the `work` it
reported); the AUDIO panel sat over the sign. Both are DOM strips in ONE column at the TOP under the corner buttons (left 8 pt, clear of
the right-hand button column, max 38 % of the screen — the sky + the far skyline), 9 px text, each FOLDED to ONE line by a tap on its
title (pointerdown + pointerup with a 6 px move guard — never `click`): `t2 · 60 fps · 1% slow · beat grid ▸` /
`AUDIO ▸ sounding DIRECT · ctx running`; the fold is remembered on this DEVICE (`ui/debug-tools.js#debugFold`, beside the TOOLS
switches). The readout's text is still made in the frame loop (a stopped loop freezes it — the AUDIO panel's `city` row reads that)
twice a second. + the WEATHER lines (below).

### 4. THE WEATHER BY LAYERS (`core/weather.js#normalize`, `opaqueOf`, `veilOf`, `fogOf`; `core/sky.js#look`) → docs/title.md
Graded, conservative fog (a dense bank only for a fog code AND < 300 m; 300 m – 1 km = `mist`: the far haze + wider halos, no banks
— `weather-fx.js#fogLayer` li 3 — no foghorn); the sky by its LAYERS — `opaque` (low + 0.9 × mid) is what every "how overcast"
consumer reads now (look() hands it out as `cloud`; `cover` = the total, `veil` = thin high cover over an open sky). A veil in FP3a
just means "not overcast": `tones.js#harborSky` whitens the day sky toward `SKY_VEIL` by ~¼ × veil, `rays.js` halves the rays; the
sun keeps its side. The server's answer carries `src`, `code`, `vis`, `t`; real weather is good for 45 min (was 75). Previews:
`&wx=mist`, `&wx=stratus`, `&wx=highovercast` (+ the panel's WEATHER row). Pushed early (ef63851) so the afternoon's cirrostratus
stopped rendering as a grey deck.

### 5. THE LOAD GATE (`scene.js` — `onResize`, `measure`, `tryReveal`; `bake.js#plan`; `title.js#reveal`; `app.js#dismissBoot`)
The jumpy load (FREV B1) was the canvas following Safari's bars: every bar change re-laid the camera (the skyline squeezed into a new
height), stretched the stale bakes into the new bands, re-baked + crossfaded — twice (a second layout when the title re-reported the
moved dock). Now:
- **Resizes coalesced in the LOAD WINDOW** (until the reveal + 2.5 s): a height-only change under 25 % waits for the LAST one + 400 ms;
  a width change or a big one (a rotation) at 180 ms. The build runs from the next frame (`wantBuild`: the clear + the redraw share it).
- **Measured, not reported:** the title hands the scene `measure()` (its clear zones + text rects NOW) — one change = one layout;
  `maybeRelayout`'s threshold 1 → 2 pt.
- **THE REVEAL:** the title holds `.nd-scene` dark (`is-hold`) until the scene's `onReveal` — the first bake + the lit windows in,
  nothing pending, no resize for 400 ms, the fonts in (or 1.2 s) — or 4.5 s at the latest (+ the title's own 6 s safety); then ONE
  fade in (CSS 0.6 s + the layers' 900 ms). Before the reveal a re-bake swaps in without a crossfade. `harbor().shown` = revealed;
  `harbor().reveal` = `{ why: 'ready' | 'late', ms }`.
- **No stretch:** a re-plan keeps drawing a baked layer in the band it was baked for (`bake.js`), never stretched into the new one.
- **No tier step during load:** a starved context / 3 failed frames before the reveal + TIER_GRACE only RECORD the step
  (`tiering().wantStep`); the first judging pass applies it (`tiering().why`).
- **The boot screen stays** (the dark sky + the unlit sign) until the Harbor's module is in (`app.js#dismissBoot`, ≤ 8 s): on a slow
  network the bare shell's grid used to flash between the boot screen and the title.
Checked on a throttled network (`shots.mjs --load --net 3g --cpu 4 --every 300 --count 24`): boot screen → the dark title with the
sign + the dock → the city fading in; no grid, no stretch, no snap.

### 5b. THE CLEANUP (FREV A1 — no look change: `pixdiff.mjs --scenes night,noon,party` = the noise floor; the residue is people
walking + the WALK / WAIT lantern on the clock)
- **ONE LIGHT MODULE** `core/harbor-light.js` (PURE, `tests/harbor-light.test.mjs`): `pieceCtx`, the pools (`LIGHT`, `REACH`,
  `lightSources`, `lightField`), `sunShadow`, a face's lamp (`lampOn`, `FACE` — props.js#lightFor), the trees' lamps (`treeLamps`,
  `TREE_LAMP`), the road's (`roadLampAt`, `ROAD_LAMP`). Each consumer keeps its own numbers as a named profile (moved, not merged — the
  look didn't move); the stage ↔ props import cycle is gone; motorcar / centre / people read the pure module, not stage.js.
- **NO SOUND INSIDE A PAINTER:** `people.tick(env)` (footsteps, laughs, the cart, the line, the roof, the bus) and `roadLight.tick(f)`
  (the pass, its sound, the prefetch) run every frame whether or not they're drawn; the mirror door's thud + the cat's meow are
  `MOMENT_CUES` (sounds.js#life plays them on the clock — a moment joined mid-way stays silent, like the other cues).
- **THE FACADE'S POWER HOOK** `harbor().speakeasy.power(k)`: every light on the building × k (the rooms, the blade + its bulbs, the
  sconce + the awning lamps, the pole, the basement, the hush sign) — 8b's raid drives it.
- **DELETED:** the placeholder people (`L.people`, `drawPeople`, `shapes.js#person`, `&force=placeholders` + its panel row), the parked
  traffic (`L.bus`, `L.cars`, `drawTraffic`, `PARKED_TRAFFIC`, `shapes.js#vehicle`; the road band from `BUS_H()`); leftovers (`void x`
  lines, the never-painted ad canvas, `freeLampLight`; internal helpers no longer exported).
- **props.js split:** `props-light.js` (the light model + frame + `PROP_KIT`), `props-garden.js` (the DORMANT urn + mailbox),
  `props-test.js` (the test obelisk — loaded only by `&force=centrepiece-test`); the cart's spring flowers keep `dome / blob / foliage /
  tulips` in props.js.
- Stale comments rewritten (the strings, the cart, the people, the road, scene.js's draw order).

### 6. THE PEOPLE — pace, colour, the night rim, the cap by tier, the bus door (`core/harbor-people.js`, `folk.js`, `people.js`)
- **THE PACE** (`FOLK.speed`): ~25 % slower (walk 1.5 → 1.15, stroll 1.05 → 0.8, brisk 1.9 → 1.5, kid 1.75 → 1.35, the jog 3.1 kept:
  clearly faster); each person ±12 % of their gait (was ±8 %). Couples + strollers stroll; commuters are brisk.
- **BY DAY — never black cut-outs:** a lighter muted 1920s wardrobe (camel, tweed brown, navy serge, bottle green, burgundy, grey
  herringbone, dove grey, a cream mac; flannel trousers; felt hats), skin on faces + hands, HAIR (the back of the head walking away —
  it never drew: the facing wasn't passed — and under the hat in profile), THE BRIM'S SHADOW across the face (no drawn features), a
  LIT side + a SHADE side across the torso + the head from the real sun (warm at golden hour, softer under a deck).
- **AT NIGHT:** mostly silhouette (the lamps lift the cloth 0.17 → 0.1, the night mix 0.78 → 0.86) with a warm RIM of lamplight on the
  HEAD + SHOULDERS only (`rimUpper`; a cool street lamp's rim pulled toward a warm white) — the old whole-outline rim pass is gone.
- **THE CAP BY TIER** (`TIER_CAP` 12 / 9 / 6, `capByTier`: whole visits in a fixed order — every phone at a tier keeps the same
  people) + the roof's guests off at tier 0.
- **THE BUS DOOR:** riders off first, the boarders' window right after (they used to wait for the very end of a 16–26 s dwell — `boardN`
  was never set), the door shuts **3–5 s after the LAST rider** (`folkAt#doorShut`, from the riders the planner really placed — tested:
  3.0–5.0 s over a day), the bus pulls away on the next green.

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
The load: a fresh open on cellular (the link alone) · the first tap by day `&when=2026-10-25T13:00` · the music button by day (same) +
at night `&when=2026-10-25T22:00` · the folded overlays: tap AUDIO + the readout's title · the people at noon `&when=2026-10-22T12:30`,
golden hour `T18:15`, night `T21:40` · the bus at a stop `&when=2026-10-22T11:00&force=bus` · the weather: `&wx=mist`, `&wx=stratus`,
`&wx=highovercast` (`&when=2026-10-25T14:00`).

### Tests (FP3a)
Unit 601 (+ `harbor-light.test.mjs` 4; the start detector; firstTapAnswer's `lit`; the weather by layers on the day's real answers +
look()'s opaque / veil; a high veil isn't overcast through the tones; the bus door 3–5 s; the pace; the cap by tier). e2e-harbor:
the pole two columns (`speakeasy`); THE MUSIC STARTING ×6 (`neon`: the first tap by day, the button back ON, the cooldown, early in the
intro, the lit race at night, pending during a race); THE DEBUG STRIPS ×8 (`core`: at the top, folded to one line, remembered, open
again, at 390 + 430); the NEW `load` group ×8 (`city` job: ≤ 2 backing sizes through two bar changes, revealed only after the viewport
settled, dark before, no re-bake / crossfade / stretch for 3 s after, one clean fade, no tier step, a rotation re-lays); the night bed's
wait fixed (`sounds`). Locally: unit 601/601; `speakeasy` 18/18, `neon` 31/31 (+1), `core`, `sky` 32/32, `load` 8/8, `flags,dock,harbor`
19/19, `speakeasy,promenade,sounds,windows,people` 73/74 → the night bed's race fixed → `sounds` 15/15, `people,music,panel` 145/145;
smoke `GAMES=cipher` 3/3.

### Known issues (FP3a)
- The people still face only 4 ways (a diagonal walker is a profile gliding in depth) and the door + bus steps still FADE — FP3b items
  7 + 8 (the rig + real doors).
- The veil's real look (the milky sheen, the 22° halo) waits for 6b; FP3a's veil is a lightly whitened clear sky.
- A visit to the bus that can't reach the stop before its boarders' window is simply not planned (`planVisit` returns null) — fewer
  boarders than 8P on a slow day; by design.
- The reveal holds the city dark up to ~1 s on a fast phone (the first bake + the lit windows); on the throttled 3G + 4× CPU run the
  dark title showed ~1.2 s before the fade.
- **THE CLOUD (2 runs, the cap):** run 1 (478e222): show + street green; `audio` — the `dock` group threw (`street()`'s debug still read the
  deleted `L.people` — fixed); `city` — "DEBUG STRIPS 430: a second tap opens them" (the AUDIO strip's tap landed while the readout
  above it was opening — the test now waits for each fold to flip, one retry). Run 2 (a80da9e): audio, show, street green; `city` —
  `skyline`'s wait "the city laid out on the real text rects" asked for < 1 pt while the load gate re-lays only for moves over 2 pt
  (FREV B1's threshold): the wait now accepts ≤ 2 pt (passes here, `ONLY=skyline,water` 18/18) — CONFIRMED green in FP3b's first
  `[harbor]` run (c5b1e9c: the whole `city` job). Everything else in the `city` job (core, water, load, panel, perf) passed in both runs.
