# ATM-D — THE CLEANUP: THE OWNER's ATM-C REVIEW + THE PUDDLES + THE PUMPKIN (Oct 31 2026, City 2.0)

A cleanup pass — the owner's ATM-C review (plan.md "OWNER'S NOTES — OCT 31 (evening)", COMPLETE at 4:54 pm) + the two items queued earlier
that day (the puddles, the Halloween pumpkin). Fix what he named, nothing new beyond it. NOT in it: PART 10 (the fireworks — its decisions
+ Grok's sounds are recorded for it), the superyacht, FR5, PERF. Every look judged the owner's way: a FRESH load of the preview link in
WebKit (`C:\Users\benja\wk` — `wk-shot.mjs` for a link at 402×874 dpr 3 (+ `--suncrop`, `--tap`), `wk-strike.mjs` catches a close strike,
`wk-cab.mjs` a cab pickup, `deck-join.mjs` the overcast deck's wrap, `sun-probe.mjs` / `col-probe.mjs` pixel rows), unzoomed.

## Step 0
The notes appended to plan.md unchanged + decisions.md updated (THE ROADMAP REORDERED as the current order; the future / to-discuss list;
PART 10's decisions in §6 "FOR PART 10"; the superyacht split off; the FR5 extra-tab scare) — "docs: plan.md — the owner's notes, part 40"
(ca56110). plan.md's build table: ATM-D ← NEXT, then PART 10, the rest in the new order.

## Group 1 — THE SKY + THE STORM
- **THE SUN AS A GLOWING LIGHT** (`district/sun.js#lightSun`, Harbor only — the owner: golden hour "almost looks like an EGG", sunrise "a big
  flat orange COIN"). Measured first (`sun-probe.mjs`): the sky round a low sun is ALREADY near-white (236–246 across ±2 r) — so an added
  white core vanished (tried: a white blob on white) and a painted falloff came out darker than the sky (tried: a faint ring). Built: below
  the approved white sun (white share < 0.99, i.e. under ~11.6°) ONE painted sprite 3.2 r across — a white-hot core (≤ 0.2 r) easing into the
  stage's GOLD by ~0.75 r, the gold fading into the sky over 3 r with a gaussian-like fall (no plateau = no rim); in the last couple of degrees
  (d = 1 − smooth(1°, 3.5°)) it morphs into a DEFINED orange disc (its plateau ~0.8 r) whose edge still falls off over ~0.3 r; at the top
  (white share → 1) its stops meet `hot`'s exactly (+ a faint tail), so the approved 9:30 am (11.4°) + noon suns are the unchanged `hot`
  sprite. ATM-C's `between` (the crisp disc morphing) removed. Judged at 5:00 / 5:30 / 5:45 / 6:05 / 6:20 / 6:28 pm + 8:20 / 8:35 / 8:50 /
  9:30 am, Oct 31, 402, a fresh load each.
- **THE STORM's RAIN FINER + FAINTER + VARIED** (`rainfx.js`, with the heavy share — heavy rain → the storm): far drops 46 → 64 % of them,
  near 20 → 8 %; every streak 34 % thinner; the UNLIT drops darker (night: base toward [112,124,160], alpha × 0.58; day × 0.78) — the light
  grid still lifts the ones by the lamps / neon / signs; lighter over the NEON logo (× 0.3–0.55 inside its rect, `s.logo`). Drizzle + rain
  unchanged (the heavy share is 0 there): drizzle < rain < heavy < storm.
- **THE THUNDER's LAG** (`lightning.js#thunderDelay(km, close)`): a CLOSE strike booms within 0.5 s (0.12 + 0.22 · km, capped 0.5 — was
  km / 0.343 = 1–4.5 s); far + intra-cloud strikes 0.6 + 0.4 · km, capped 3 s (was up to 16 s). Each take's crack still lands on its flash
  (sounds.js's lead / wait split unchanged — the e2e check `lead − wait = crack − delay` holds).
- **THE CLOSE LIGHTNING** (`lightning.js`): a close strike lands on the NEAREST BUILDINGS' roofs (`scene.js#nearRoof` = roofline(z ≤ 252):
  the near row + the quay heroes) — never one hidden behind the speakeasy / its billboard / a sign (`s.occ` = the scene's heliOcc) — or on the
  HARBOR WATER (or the needle, 1 in 6, as before); drawn in the FAR strikes' style a size up (8.5 / 3.4 / 1.5 pt glow / body / core — was the
  13 / 5.5 / 2.4 rope), 2–3 branches (was 3–5), sub-branches rarer, and EVERY branch ends above its landing point (no fork reaches down over
  the promenade / the stage). The safety caps unchanged.

## Group 2 — THE GROUND
- **THE PUDDLES** (`wetground.js`): CLUSTERED in 3–4 low spots (the front edge, the curb, the building's foot) — a main puddle (1.4–3.2
  half-length) + 1–3 smaller satellites (0.5–1.4) each, so 6–16 in all; each its own IRREGULAR outline (`puddleShape`: a lumpy 22-point radius
  + 1–3 thin FINGERS seeping sideways along the paving's joints); a DAMP RING (two darker soft patches round it) + a few glints on the soaked
  stones; the water a DARK MIRROR — by day the sky's colour well below the stones' value with its far edge catching the bright sky (a fine lip
  along the lumpy outline), at night the city's violet glow mirrored; the TREES behind it reflected (a dark trunk straight down from under its
  foot, the crown's mass beyond); the lights + the neon as before (the reflect list + the rain's light grid); ICED in freezing rain (matte
  whitish, a frosty rim, three cracks, no reflections — `o.ice` from WXS.ice). Drying: the old thresholds (each puddle its own depth).
  **THE DEPTH ORDER**: the trees stand in the STAGE bake, under the wet layer — so every tree's trunk is cut OUT of the wet layer from its foot
  up (destination-out, a flared trunk shape): on the ground plane anything above a tree's foot lies behind it, so the trunk always covers it
  (the owner's screenshot twice). Benches, people, the cart + the props draw after the wet layer: they covered the puddles already.
- **THE BLIZZARD's GROUND SNOW DANCES** (`snowfx.js#ground`): 10 streamers, each a RIBBON of 11 soft puffs (the near flake's sprite) trailing
  its head downwind — curling (a travelling wave along it), rising + dipping with the gust over it (1.2–4.4 pt — it hugs the ground), the head
  swirling, the thickness swelling + thinning, a moving gap pattern BREAKING it up + reforming, every streamer its own speed + thickness; a
  streamer that leaves the screen comes back at another depth. By day a faint cool shadow under each puff shapes it on the lying snow; at
  night the puffs are ADDED (blown snow catching the street's light — a white puff vanished on the grey-blue ground). THE BUILDING CLIPPED OUT
  (`s.bld`: the speakeasy's front-right foot + its side's far foot — the front face + the side face above their foot line), so a streamer
  passes behind its corner, never across the facade.
- **THE FOG's LINE** (the owner's night-fog screenshot: a thin vertical line under the NEON sign). FOUND on a PARTY night (the owner reviewed
  on Halloween, a Saturday): the party's SKY BEAMS in dense fog kept 8 % of their crisp beam (`skybeams.js`: crisp = 1 − 0.92 · vol) — a faint
  thin line to the top of the sky. Now crisp = (1 − vol)²: in fog a beam is only its soft volume (mist keeps its crisp beams — the subtle one,
  approved). + THE VEILS' HARD TOPS (`fogdepth.js#veil`): the mid + the harbor veils started at full strength on their first row — two hard
  horizontal lines across the sky, cutting the beams + halos in two; a veil below the screen's top now fades in over its first ~50 pt. + the
  overcast deck's wrap (`clouds.js`): its two copies met at a fractional device pixel — snapped to whole device pixels (checked at the join:
  no measurable line before or after on a fog night — a correctness fix, not the owner's line). Seamless at 390 / 402 / 430, dpr 3, day +
  night, fog + mist.

## Group 3 — THE PIECES
- **THE SEARCHLIGHT's CLEAR LINE** (`air.js#lookAt`): a stop's spot is taken only when the straight line from the lamp to it clears every near
  piece (`s.heliOcc` — the speakeasy, its billboard, the blade, the signs), never the speakeasy's own ground (a promenade spot must lie right
  of the building + 18 pt); the chosen kind first (a boat / the far roofs / the promenade), then the water at five places, else NO spot (the
  beam keeps its own sweep). The approved patrol path unchanged. The e2e `heli` group samples every look for 30 s: 17 looks, none blocked.
  THE CLOUD's FIRST RUN caught a flight whose stops all hovered just over the billboard — none found a spot, and the fresh-load check (which
  counted a stop only by its look) saw no stop: the fallbacks added (`spotFor` — the far quay's roofs + the FAR water at long diagonals; the
  near water line is too low to reach from up there), the stop counted by its hover, and a 200-seed sweep (`planFor(seed).spots`): 1123
  on-screen stops, 58 (5.2 %) without a spot — the hovers right over the billboard's shoulder, where everything on the ground is behind it
  (no pool, the beam keeps its sweep; the building covers it).
- **THE CAB PICKUP ON THE CURB SIDE** (`cabstand.js`, `vehicles.js#drawFarDoorTop`): the fare walks from the bench to the curb beside the
  cab's FAR REAR door (behind the car — the cab stand draws him BEFORE the car, so its body covers him below the shoulders); the far rear
  door opens (the kit draws only its TOP EDGE swinging up above the roofline — the frame + the dark of its glass, its free edge rising as it
  swings away from us); he steps in + DUCKS DOWN out of sight as he sits (sinking 1.6 m behind the body, clipped at the car's wheel line so
  nothing of him shows under it — no fade); the door shuts; it pulls away. The camera-side doors stay shut. The street cabs on the back road
  already board through their near door (the curb IS the near side there) — unchanged; the cab stand only picks up (no drop-offs on the front
  street).
- **THE BOXER's BAG** +8.6 % (`core/city-sounds.js`: the bag + its combo hits 0.14 → 0.152); still muffled, the variety by punch kept.
- **THE HALLOWEEN PUMPKIN at the O's FULL SIZE** (`screens/title.js#O_ALT` — the shared title, both cities): the old body (scaled ×1.24 about
  its foot) spanned y 9.5 → 97 of the letters' 0 → 100. Redrawn NATIVELY in the O's box, no transform: the body from the cap height to the
  baseline with a hair of overshoot (a round shape reads small, like a typeface's O), the O's full width, widest at its middle (a straight-
  sided first try read as a capsule), the letters' own tube (9); the face kept in proportion; only the stem + vine rise above. Checked on
  Oct 31 day + night.

## Group 4 — the numbers
- **SPEED** (`title-perf.mjs --ab` against ca56110 — the build before the pass, a worktree on :5174; 4× CPU, tier 2, 402×874, 3 + 3 windows):
  a clear night SAME (+0.9 ms, noise ±4.9) · the sunrise sun SAME (+13.8, ±15.2 — one bigger soft sprite) · the wet promenade by day SAME
  (+2.2, ±6.1) · the rainy night's puddles SAME (+4.7, ±6.3) · the storm SAME (+5.1, ±15.3) · the blizzard SAME (−4.6, ±8.2) · dense fog SAME
  (+1.0, ±3.6) · THE FOG ON A PARTY NIGHT FASTER (−13.5 ms, ±8.7 — the beams' crisp lines no longer drawn in fog). New title-perf scenes:
  atmd-sunrise, atmd-wet, atmd-wetnight, atmd-fogparty. Clear weather: no new per-frame work (the puddles bake on a wetness step, the
  streamers + the fog fade only in their weather; the sun's sprite replaces ATM-C's).
- **NEW CANVASES**: none per frame. The sun's glowing-light sprites (128², quantised to tenths of the white share + the disc share: a few a
  day, ≤ 40 cached); the snow streamers reuse the flake sprites.
- **LOCAL RUN** (the mini PC, alone): unit 937 / 937 · rules 45 / 45 · /api 25 / 25 · smoke `GAMES=cipher` 3 / 3 (title.js is shared) · THE FULL
  e2e-harbor suite **784 / 786** in 25 min — the two misses are the two known machine-timing checks (the toast's arm step 0.31 rad vs 0.25,
  the calm load at 2× CPU stepping a tier on the TV's 29 Hz) that fail the same before the pass (ATM-A / ATM-C); the new searchlight check
  passed (17 looks, none blocked).
- **THE CLOUD**: run 1 (the harbor workflow by hand — the final push's own files were docs + tests, outside its path filter): tests ✅, harbor
  9 / 10 — legend ✗ (the searchlight's stops over the billboard, above; fixed, 25 / 25 locally); run 2 = the legend job alone: ✅ (7 min). The fix live with a deploy-only push (26433cf).

## Decisions
- **The low sun is PAINTED, not added**: the sky round a low sun is already near-white — an added core can't be seen; the light reads by a
  warm gold bloom round a white core.
- **The storm's rain changes with the heavy share only**: drizzle + rain look exactly as before (the owner's anchor), the storm gets finer.
- **Far thunder capped at 3 s** (a game's sky, not physics: 16 s of silence after a far flash read as nothing happening).
- **The close strikes' "nearest buildings" = the near row + the quay heroes** (z ≤ 252), never one the speakeasy / its billboard / a sign hides.
- **The puddles' depth order by a trunk cut-out**, not by re-baking the stage with the puddles in it (the wet layer re-bakes on every
  wetness step; the stage bake is the heavy one).
- **The fog line was the party's sky beams**, not the half-resolution veil (that one is the DAY veil's sheen — never drawn at night).
- **The cab's fare sinks behind the body** (no fade at all) and is clipped at the car's wheel line.
- **The pumpkin is drawn natively in the O's box** (a non-uniform scale would have thickened its tube unevenly).

## Known issues
- The storm's drops keep the depth they were born with: a page that turns from rain into a storm keeps rain's mix until the drops recycle
  (a fresh load is right).
- The ground snow is subtle by day (white blown snow over white lying snow — its cool shadow carries it); clearer at night.
- The overcast deck's join fix could not be shown to change a pixel (the fog veil covers the deck at night) — kept as a correctness fix.
- The cab-stand taxi still has no door sound (no car-door slot yet — an old known issue).

## Handoff to PART 10 (the fireworks)
- The owner's decisions are in decisions.md §6 "FIREWORKS — FOR PART 10" + plan.md "OWNER'S NOTES — OCT 31 (evening)": every night (a short
  show at 9:30 pm, 2–4 shells at midnight), the party nights' full show at 10 pm synced to the party song, three launch layers (barges,
  behind the skyline, the lighthouse), the NEON sign dims for the show like the TR-3B, cancelled in rain / storms / gales / dense fog, the
  crowd stops + looks up (and the same for the TR-3B in a party). The superyacht split off.
- GROK's FIREWORKS SOUNDS are waiting: `Downloads\Grok\city-sfx\fireworks\` (+ alternates\, credits.txt with the CC BY block, claude-notes.txt).
- In fog a sky beam is only its volume now (`skybeams.js`): any new beam in fog should follow the same rule (no crisp line to the top).
- Painting a light on the bright golden sky: paint it (a gaussian fall), don't add it — an added glow vanishes there (the sun's lesson).
