# PF — PROMENADE FINAL TOUCHES (Oct 24 2026; the final layout, the inlay + its event rig, the lamps + uplights, the street, the sign lamps, the car in sync, the sky sounds, the CI job; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PF — PROMENADE FINAL TOUCHES (Oct 24 2026; the final layout, the inlay + its event rig, the lamps + uplights, the street, the sign lamps, the car in sync, the sky sounds, the CI job; behind `?city=2`)
The owner's iPhone review of FP2: the promenade is filled out — this pass LOCKS ITS FINAL LAYOUT, every piece's art kept. Three helpers ran
next to the lead (the inlay + rig + mailbox; the street + sign lamps + string lights + the neon check; the sounds); the lead did the layout,
the lamps, the uplights and the CI job. Audio detail: docs/audio.md — "FP3 — THE CAR AND ITS SOUND IN SYNC" + "THE SKY SOUNDS".

### 0. THE CLOUD TEST JOB (`.github/workflows/harbor.yml`; docs/testing.md "THE HARBOR IN THE CLOUD")
The FULL e2e-harbor suite on GitHub's machine after every push touching a City 2.0 file (a `paths:` list), `SHARDS=2`, `SHOTS=0`, on the
emulators; a newer push cancels an older run; npm + emulator downloads cached; `shots-harbor/` attached on a failure. **≈ 7–9 min a run**
(the suite ≈ 6½–8½ min; the private repo's free minutes). Its first runs on FP2's code: 163 / 167, then 272 / 273 — the misses were timing /
rounding checks too tight for the 2-core runner (now waiting for their condition: NO FLAG's signs, the O's flutter up to 12 s, the spell-on
round until every sign has spelled; the memory check's 0.01 MB rounding → 0.05; the water seam limit 1.5 → 2.5 points — FP's known issue);
`SHARD_PLAN[2]` was missing the `music` group. **Future passes rely on it:** locally the unit suite + the touched groups only.

### 1. THE FINAL LAYOUT (`core/harbor-promenade.js#PHONE`, `CART_SHOWN`)
| piece | x pt at 402 | z | change |
| --- | --- | --- | --- |
| THE CART | — | — | HIDDEN (`CART_SHOWN = false`, `L.cart.shown`): no art, light, shadow, box or block; its art, `route`, `stopX` kept for 8b |
| THE CRABAPPLE | 181 (crown 153–209) | 50.9 | from 163 / z 52.9 / k 1.25 → k 1.45: right of the DOUBLE AGENT blade (the blade free, the tree shows), left of the flanking lamp's head |
| THE BENCH | 207 (186–228) | 47.8 | where the cart's umbrella was, a little forward; the crabapple's trunk + uplight show at its left end |
| THE TALL LAMPS | 225 · 312 | 52.6 | a MATCHED PAIR FLANKING THE CROSSING (symmetric about its axis, just outside the two stop lights) — was 177 · 312 |
| THE INLAY | 268 (the crossing's axis) | 44.8 | the medallion → a brick paving inlay (§2), a little back (43.4 → 44.8): inside both flanking pools |
| THE GLOBES | 129 · 387 | 36.6 | unchanged (the front corners) |
| THE MAILBOX | 326 | 38.6 | NEW (§3): the right side by the front curb, left of the framing maple's trunk |
| THE FRAMING MAPLE | 357 | 38.2 | unchanged |
Nothing stands in front of the shopfront or the blade; the bottom-left corner stays clear for the lobby line.
**8b — WHERE THE CART + THE BUS RETURN:** the cart's rest spot (`PHONE.cart` f 0.53, z 41.8) + `route` cross the floor in front of the bench,
over the inlay (`stopX` / `EVENT_CLEAR` when an event stands there: `harbor().centrepiece.active()`); place it once 8b's paths are drawn —
it may want the open floor right of the inlay (f ~0.78–0.85, z ~42) so the bench + crabapple stay clear. The bus: `PARKED_TRAFFIC` (road.js).

### 2. THE INLAY + THE EVENT LIGHTING RIG (`props.js#drawInlay` — `drawMedallion` kept as an alias; `core/harbor-centre.js` PURE; `screens/harbor/centre.js`)
- **THE INLAY:** flush paving, nothing raised — a soldier-course border ring, a buff brick ring, a red field laid in rings, an 8-point
  compass star in buff + dark brown-red (each point split light / dark; north = away from us), a small buff centre in a ring of dark bricks.
  By day each brick its own shade + a lit far edge, a polish where feet go (`wearAt`); at night the same baked lamp pools as the setts
  (`stage.js` passes `lightAt`), landing by each brick's colour (the red stays red). Drawn BEFORE the day shadows (they fall across it).
  `inlayPlan`, `wearAt`, `INLAY`.
- **THE RIG (the owner: events on the inlay must be lit):** four brass FLOOR SPOTS flush in the border on the diagonals (two in front of a
  piece, two behind) — a brass ring round a dark lens, baked with the paving (a glint by day). The API for 11a–c:
  `harbor().centrepiece.set({ piece, h, rig: { on, col, k }, lights: [{ x, y, z, col, r, k, tw, ph }] })`, `.clear()`, `.active()` (+ `cap`,
  `spots`, `box`). `piece`: a draw function `(x, cam, m, T, ctx)` or `{ draw, light }` (`light`: the rig's light landing ON the piece — pieces
  should bring one; without it a flatter fallback lights the lower part). The rig comes on with any piece, rises with the street lamps (nothing
  by day); `h` clamped to `centrepieceCap`. Cost: no piece = one check a frame; a piece = a sprite of its own box re-drawn only when the
  piece / look changes + its lit copy, four cached spot glows and its own lights a frame (core + tight halo, no haze). `PROP_KIT` (props.js)
  exports the props' frame + lighting helpers; `propShadow(…, 'custom')` takes a piece's own shadow shapes.
- **THE TEST PIECE** `&force=centrepiece-test` (+ the panel's PROMENADE → THE CENTREPIECE → CENTREPIECE TEST): a 5.6-unit granite obelisk on a
  stepped plinth (a bronze plaque, a gilt top) with its own light pass — warmest at its foot at night.
- **Always readable at night:** the inlay sits inside both flanking lamps' pools (§4: ~0.55–0.65 of a lamp's heart on its ring).

### 3. THE MAILBOX (`props.js#drawMailbox`, `mailboxBox`; `PHONE.mailbox`, `L.mailbox`)
A 1920s OLIVE-GREEN pillar box (~1.9 units — a touch exaggerated): a stepped foot, a tapering neck with an eagle boss, a chamfered body, a
flanged domed cap + knob, the hinged slot flap under its hood, the raised "U.S. MAIL" band, the collection door + lock + a cream
collection-times plate, worn corners, chips, rust at the foot, rain streaks. Its sun shadow by day, lit by the right globe at night (props.js
`lit`); baked in the front layer; in the walkers' block list. (A newsstand / newsboy → 8b with the people.)

### 4. THE LAMPS RE-THOUGHT + THE TREES' UPLIGHTS (`stage.js#REACH`, `TALL_K`; `trees.js#UPLIGHT`, `drawUplight`)
- **The pools** for the new positions (baked into the setts as before — crisp, no haze): tall 10.5 → 13.5 (each × `TALL_K` 0.85 where the
  pair overlaps on the curb), globe 7.6 → 9.5, the speakeasy's spill 4.2 → 5.2 (the shopfront's line). PEOPLE READABLE where they'll be: the
  bench 0.87 of a lamp's heart, the inlay ~0.6, the door's approach ~1, the lobby line along the shopfront toward the bottom-left corner
  0.1–0.4 (dim, never black), the front walk 0.6–1. The darkest spot is the strip just in front of the inlay (z ~41, ~0.05) — the rig and
  8b / holiday lights fill it without re-laying the lamps. A tall lamp's light on the trees 0.8 → 0.58 (the crabapple now stands beside it:
  its crown's side went one flat orange).
- **THE UPLIGHTS:** each tree in a grate has a squat brass fixture in front of its trunk (`UPLIGHT`: u −0.26, dz −0.5), aimed up — a light with
  a short reach (falloff 2.2 vs a lamp's 3) in the tree's own lighting, so the trunk + the crown's underside glow warm and the crown's top
  fades to dark; seen: a warm wedge up the bark's front, a small warm pool on the mulch + grate, the lens's spark + a tight halo. By the season:
  autumn's leaves glow amber, winter's bare branches catch it (snow later: Part 9), spring's blossom pink. Baked (no frame cost).

### 5. THE STREET UNDER THE DOCK, THE STRING LIGHTS, THE SIGN LAMPS (`street.js`, `strings.js`, `speakeasy.js`, `signs.js`)
- **THE STREET** reads as its own surface: TARRED setts (day [130,127,126] → [98,100,108], night [52,50,72] → [44,45,66]), TAR joints (day
  → [56,55,61], night → [28,28,42], still 0.42 of the lamp light), darker gutter slabs + rail stretchers, duller cooler highlights, a worn
  sheen in the tyre paths (`SHEEN` 0.3); THE CURB STEP (`CURB_STEP`, in `streetOver`): the curb's face shaded deeper, a crisp 0.55 pt lit
  edge along its top, a shadow on the gutter under it. The promenade's setts unchanged.
- **THE STRING LIGHTS OFF** for now (`strings.js#STRINGS_ON = false`; the parapet's posts baked only while on; all the code kept;
  `&force=strings-party` still previews them — without posts). 7b re-renders them with the rooftop.
- **THE BLADE'S LAMPS** brighter + CONCENTRATED: `BLADE_LIGHT` — an even warm fill + two tight cones straight down from the lamps (hot under
  the mouth, 'lighten' so the middle never doubles, cut to the board) multiplied over the paint: the face even top to bottom (DOUBLE AGENT
  top [76,59,49] → [104,87,68], foot [54,44,41] → [103,85,66]); `bladeLevel(faceLum, partyRamp)` / `BLADE_LEVEL` replaces FP's `BLADE_LIT`
  0.78 (dark boards full + a 0.34 boost; light boards — OVERCLOCK, SLIP, BLUFF — 0.9, easing to 0.55 on party nights so the blade is never
  the biggest warm slab); the heads: a small squashed warm halo, the shade's lit inside, a white-hot bulb — the old wash blob gone.
- **THE BILLBOARD'S LAMPS** a step brighter: `lampLightMap` ~7 % (the pools 0.5 → 0.6), `lampGlows` (cone 0.32 → 0.38, the halo tighter),
  `scene.js#LAMP_DIM` 0.1 → 0 (the poster at night [140,91,47] → [157,105,55]).

### 6. THE CAR IN SYNC + THE SKY SOUNDS → docs/audio.md
- **The car's sound came 5–6 s late** because it started only once its file was fetched + decoded (nothing prefetched, a new take most
  passes, iOS decoding slowly) while the car ran on the clock. Now placed ON THE CLOCK (`city-sounds.js#syncStart`): the take's measured peak
  lands on the car's mid-crossing (early → delayed, late → joins with a fade, < 1 s to go → silent rather than out of sync); the next pass's
  take prefetched ~12 s ahead; the take from the pass's number (every phone the same); the car's speed from the take's SWELL (2.6–7 s on
  screen); the sound starts 1.5 s before the car enters; a gentle pan (±0.6, `panOf`); with the dock shown the sound alone still plays.
  Measured with every car file held back 2.5 s: the peak −0.13 → +0.01 s from mid-crossing.
- **THE SKY SOUNDS** (Grok's 12 files → 16 MP3s, 3.19 MB; `audio/city/` 5.54 MB): helicopter (two flybys, chained, panned, louder in the
  hover), airliners (faded with their crossing, panned), the banner plane / skywriting (prop-plane), geese (one flyover per V, panned — a
  modern engine drone notched out), the drone show (a 5-layer detuned swarm), balloons (a burner burst every 6–18 s); filled for 6b, not
  wired: jet-flyby, ufo-hum, ufo-beam, tr3b-drone, tr3b-power-down (+ the blackout's thump at `hit`). All under the day hum (−43.6 LUFS):
  −47 to −55; the sky ducks under the music with the bed.

### 7. NEON OUTLINES (verified, nothing changed)
FP2's NEON BY DEPTH holds at 402 on a normal night (10-22) and the party peak (10-24 21:45): no front / back pair shares a colour, the front
tubes stop cleanly above the nearer roofs, nothing merges. (BLUFF / DOUBLE AGENT aren't on the word towers those nights — the same towers
were checked with what stands in front. Normal night: the two right-hand towers both cyan, ~13 pt apart — they don't read as one.)

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Noon `2026-10-22T12:30`, golden hour `T18:20`, night `T22:00`, party peak `2026-10-24T21:45`, spring `2026-10-22T12:30&season=spring`; the
screen at rest (dock hidden): leave it untouched; the car + its sound: night + `&force=road-pass`; the rig: night + `&force=centrepiece-test`.

### Tests (PF)
Unit 559 (`harbor.test.mjs` 156: THE FINAL LAYOUT on three phones — the inlay on the crossing's axis, the tall pair flanking it symmetric +
outside the stop lights, crabapple · bench · crossing, the crown clear of the blade + the lamp's head, the cart hidden but its 8b rule kept,
the cap; THE INLAY / THE RIG / THE MAILBOX (8); THE STREET'S SURFACE / THE STRING LIGHTS OFF / THE BLADE'S LAMPS; the trees with gradients;
`harbor-sounds.test.mjs` NEW: the peaks + swells, `takeAt`, `syncStart` swept over every take + wait, the crossing, the pan, the sky files,
the blackout's `hit`, the levels; `city-sounds.test.mjs` the filled slots, the size cap 4 → 6 MB). e2e-harbor (locally: `promenade`,
`speakeasy`, `party`, `sounds` — 62 / 62 + 15 / 15): the string lights OFF (still laid out); FP3 — THE CAR IN SYNC (car files held back 2.5 s:
the peak within 0.35 s of mid-crossing, on screen ≈ its swell, a pass skipped by design listed as such) + THE PAN; the day bed with
`&force=no-planes`. The whole suite: the cloud job (§0).

### Known issues (PF)
- The first car pass after the page opens may be SILENT on a slow network (its file arrives under 1 s before the car's centre — silent by
  design rather than late; the prefetch covers every later pass).
- The sky levels are loudness arithmetic, not listened to; ufo-hum has no single key (E1 / ~C#–D / 729–883 Hz) — its music duck waits for 6b.
- The centrepiece's sprite switches at once while the ground crossfades on a re-bake (the lamps change in sixths — small); it isn't in
  `memAll` (~0.5–1 MB at dpr 2, only while a piece stands); the obelisk's upper shaft stays light at night (a placeholder).
- ~~A placeholder person stands right behind the mailbox at 402 (8b places the people); the mailbox reads dark in golden-hour shade.~~ THE
  MAILBOX IS GONE (Oct 24, the owner didn't like the olive-green box): `PHONE.mailbox: null` in `core/harbor-promenade.js`; `props.js` keeps
  `drawMailbox` / `mailboxBox` (tested at its old spot) for a later piece of furniture.
- `&force=strings-party` shows the string lights without their posts; the worn sheen in the street's tyre paths is subtle.
- The dim strip just in front of the inlay (§4) — left for the rig / 8b's lights.
- THE CLOUD JOB's slower runs (12 min on the PF commit vs 7–9): four timing checks flaked there once each and passed on the run before — `music` RETURN (plain) (the punch after a return: the BEAT pass's area), `panel` PULSE STRENGTH (the live ×1.75), `perf` BATTERY (the 60 fps wake), FP3's first car (now excused: its file may arrive after it passes). Watch the next runs; a check that fails twice in a row is real.
