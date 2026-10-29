# C4b — THE PEOPLE + THE LAYOUT (Oct 28–29 2026; review-4.md §E items 7–11 + the owner's notes "OWNER'S NOTES — OCT 28 (C4a's review)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## C4b — THE PEOPLE + THE LAYOUT (Oct 28–29 2026; review-4.md §E items 7–11 + the owner's notes "OWNER'S NOTES — OCT 28 (C4a's review)"; behind `?city=2`)

The second of FR4's three cleanup passes (C4c the code / tests / docs is next). The owner's later decisions won over review-4 where they
differed: the giant comes OFF, so §C3's option C is the plan — the compass LEFT.

### Group 0 — THE GIANT OFF
Halloween's giant ₿ pumpkin is DISABLED in the calendar (`core/harbor-holiday.js#GIANT_ON = false` — the code + its bake kept for next
October's decision); `&force=giant` (+ a HALLOWEEN panel row "THE GIANT ₿ PUMPKIN (OFF)") still shows it on its dates — its e2e checks
run with it. Its closed floor, its floods + the dance's ring go with it (they all read `pieces.giant`). The motion group's planted foot:
0.29–0.30 → **0.06** of the body's speed — PROM's known issue closed.

### Group 1 — THE LAYOUT (the numbers; `core/harbor-promenade.js#PHONE`)
A promenade `f` is the screen fraction at any depth, and the world positions are the same on every upright phone (hw(z) ∝ z).
| piece | before | C4b | 390 / 402 / 430 (pt) |
| --- | --- | --- | --- |
| THE COMPASS (ring 3.05, z 42.6) | f 0.6675 (x 4.78) | **f 0.515** (x 0.43) | centre 201 / 207 / 221 ± 42 / 43 / 46; its right edge 243 / 250 / 267 vs the crossing's near-left corner 243 / 251 / 268 — CLEAR |
| THE WATER BENCH (z 47.8, faces the harbor) | f 0.515 | **f 0.42** (x −2.56) — in front of the crabapple | 144–184 / 148–190 / 158–203; behind + left of a snowman-size piece on the compass (5 pt clear at 390) |
| THE FRAMING MAPLE (z 42) | f 0.875 | **f 0.9** (+0.70 u) — `seedF` keeps its crown (the plan's seed from its old spot) | its leaves end 389 / 401 / 429 — 1–4 pt inside the edge, never cut (0.905 would clip at 430) |
| THE CAB-STAND BENCH (z 38) | f 0.875 | **f 0.9025** (the same +0.70 u) | 327–377 / 337–389 / 359–415 |
| THE CART (z 38.4, hand −1) | f 0.47, in from the left edge | **f 0.69** (x 4.89), **from BELOW THE DOCK** (`from: 'below'`: up from the front street at `CART_IN_Z` 30.4 → its spot, the vendor beside it) | 269 / 277 / 297; its left end clear of the ring's right edge; `stopX = medallion.x + EVENT_CLEAR` |
- THE SIDE DOOR's landing with the dance circle's closed floor (3.9 u) on the compass: **3.1 u** (≥ 2.5). The route from the side door to
  the cab stand round a closed compass runs BEHIND it, in front of the water bench (1.3 u between the circle + the bench's block).
- The cart's customers keep their spot on the handle side (hand −1, 4.3 u: x 0.6, in front of the compass's rim on open floor) — review-4
  asked for 2.6 u, which lands on the vendor (he stands at 2.95); the cart never comes out while the compass is in use (VENDOR's rule), so
  the rim spot is free when they're there.
- THE CAB STAND's taxi still stops whole on screen (cabstand.js clamps its stop to the screen's edge: it pulls up a little LEFT of the
  bench); the holiday spots follow the pieces (core/harbor-spots.js reads L): `maple` at the moved grate, `corner-right` left of the moved
  cab bench, `bench-left` / `-right` at the water bench (the Christmas-tree stand now beside the speakeasy's corner, under the blade —
  spotProblems clear), `compass-left` / `-right` round the moved compass.
- THE CHRISTMAS TREE on the compass is 11b's (not built yet): for the water bench to stay clear its base must stay within ±1.3 u of the
  compass's centre (a wider skirt starts to cover the bench's right end).

**THE CAB STAND's OWN LAMP** (`core/harbor-light.js#cabLamp` / `CAB_LAMP`; the owner, 10:03 + 10:37 pm): a lamp nobody sees, ~2 u past
the screen's right edge at the front curb (dx 4.0, dz −1.3 from the cab bench), h 4.8 — kind `hidden` like POL4's lamp behind the
blade, so it's BAKED with the lamps' ramp (its hours, the dusk, the blackout's dimming are theirs). It lights:
- THE MAPLE's LEAVES (`TREE_LAMP.cab` k 0.95, fall 2.1, its depth offset × 0.4 + 0.6 lower in the tree's frame — `wK` / `y`): trees.js's
  per-leaf light, so each cluster on the crown's LOWER RIGHT catches it with its own highlights, brightest nearest the lamp, falling off
  up + left into the crown's shade (from 5 u in front every leaf on the right was the same distance from it — a flat half — the reason for
  `wK`). Every season through the same rig: summer greens warm, autumn's orange blazing, spring's blossom + new leaves, winter's bare
  branches (+ their snow).
- the cab bench + its waiters from the RIGHT (lampOn's hidden light: a face blend of the implied lamps + this), a soft pool on the cobbles
  (`pool` dx −3.1, dz +1.2, k 0.42 — a spill, no edge), the shadows falling LEFT (`lampShadow` takes it within `shadowR` 7.5).

### Group 2 — THE PEOPLE (§E items 7–10)
- **THE CAB-STAND SITTER** (folk.js): a second seated rig when the sitter faces us / away (|cz| > 0.5) — the knees forward + OUT (a 0.27,
  b ±0.1, y 0.3), the feet planted under them; facing us the shins drawn 1.3× thicker with the seat's shadow filling between them (nothing
  of the bench shows through), THE LAP — the coat's skirt from the hips to both knees over the seat's front edge, its top lit (the thighs
  catching the light: it reads as a seat, not a standing coat) — a slight slump, the hands on the knees.
- **THE WATER BENCH's BACK lower + SOLID** (props.js#drawBenchBack — seen from behind only): the back's top 1.32 → 1.12 u, its three boards
  edge to edge: the sitters' HEAD + SHOULDERS + HAT clearly above it, no slats over their bodies.
- **`&force=waterbench`** + its panel row (ON THE PROMENADE): a sitter from the left edge seated within ~10 s of the link (measured ~9 s) +
  a couple stopping beside it to watch the skyline; again every 100 s (`core/harbor-people.js#WATERBENCH`).
- **THE DOORMAN OPENS THE DOOR** (`core/harbor-crew.js#doormanAt`, `doormanHolds`, `DOORMAN`): at rest `attend` at his post right of the
  side door, a step off the wall (`doormanWall` z0 − 0.62), FACING US, hands clasped at the belt, a slow weight shift now + then; for every
  guest through the side door (in or out) he steps to its HANDLE side (`doormanHoldSpot`, just right of the frame) 0.85 s ahead, swings it
  open, holds it (`holdDoor`: the far arm out on the leaf) through their whole passage, TIPS HIS PEAKED CAP (`st.tip`: the near hand up to
  the peak), lets it close, steps back; guests < 6 s apart share one hold. His window IS the door's motion (folkAt's MAX over every swing —
  nothing double-swings; the 9d door closer unchanged). Look: `hat: 'peaked'`, the long coat, the brass buttons + a fine line under them
  = ONE light stripe (`L.trimLine`). The lean + the push-off + the nod are gone; his head still follows the guests (people.js#doormanWatch).
  The line nights' doorman attends the same way between admissions.
- **THE PEOPLE RULE** (`core/harbor-witness.js#rejoinVisits`, `REJOIN`; people.js#guard) — next to THE WINDOW RULE: NOBODY APPEARS OR
  VANISHES IN VIEW. (1) The planner: the visits a legendary / a raid held back stay away for good (they used to come back at visitAt the
  instant the window ended — mid-promenade: the owner's snap after the UFO); those that would still be out then are PLANNED AGAIN from their
  own way in (`spec` kept on each block visit: an edge, the side door, the crossing, the bus …), each 8–120 s after the window — the
  promenade refills over ~2 min. (2) The live safety net (people.js#guard): a visit whose first frame ON THIS DEVICE is not at a way in (off
  a screen edge, in a doorway, the back road / the far kerb, the front street under the dock) is never drawn for that visit — a holiday's
  visits switching on while watched, a preview row toggled; the first frame + a clock jump (> 5 s: a link, the panel's time, back from the
  background) show everyone where they are, like a load. `harbor().people.guard` = { hidden, total }.

### Group 3 — THE CROSSWALK, THE MIRROR DOOR, THE BENCHES IN THE WEATHER, THE GOLD LEAF OFF, THE LIGHTS IN THE BLACKOUT
- **THE CROSSWALK DIMMER** (road.js#CROSS, the owner's 10:34 pm note): the centre pool k 1.15 → **0.4**, the edges' 0.5 → **0.14**; the
  stripes' lift a fixed share of the light (`stripe` 0.2, `gloss` 0.1) — pale paint, never the full white. Measured at 402 down the crossing's
  middle (a September night, e2e `people`): the stripes **180** vs the gaps **37** — × 4.9 (≥ 2), the brightest 214 (never clipped); the
  wet street the same within a few levels (screenshots, × 5.7 at the earlier 0.3 lift — the reflections don't wash it back).
- **THE CROSSING's LIGHT IS LIVE** (road.js#createCrossLight — the owner's 10:55 pm note: "the new lights ignore the drain"): the road's bake
  keeps the bare asphalt + the stripes' unlit paint; the pools + the stripes' lift are ONE small layer made once per layout + dpr and drawn
  each frame with 'lighter' at the lamps' ramp × THE POWER at the crossing (`legendPow`) — the TR-3B's drain + the blackout take it, the
  lamps' hours bring it back (`lightAudit().crossing`). The cars' crossing light × the same power (people.js#drawCar).
- **THE MIRROR DOOR's CHOPPY OPENING** (window-paint.js#mirrorDoor): measured with `--cast` frame by frame at 402 — a one-frame jump at the
  swing's start (0.83 vs ~0.2 a frame): the leaf was painted a flat dark board over the whole doorway the instant it moved, unlike the lit
  mirror the room's bake shows there. Now the bar beyond is painted only in the GAP the leaf uncovers and the leaf fades in as it turns
  (`sm(0, 0.35, o)`): the opening ramps 0.31 → 0.44 a frame and holds — no jump. (The clock was never stepped: `loc.sec` is continuous.)
- **RAIN + SNOW OVER THE BENCHES** (PROM's known issue): while it rains or snows the benches' sharp overlays CROSSFADE OUT on the
  precipitation's own blend (0.03 → 0.15) and the city's bench under them — drawn before the rain, so it falls over it — shows; back when
  it stops. Their seats + the water bench's back already carry the snow (props.js, ctx.snow).
- **HARBOR BARBERS OFF THE GLASS** (the owner, 10:41 pm — DECIDED): the gold leaf removed in every state (`paintGilt` + `GILT` deleted from
  speakeasy-bake.js, the dead `env.gilt` hook gone); the glass layer keeps only its faint reflection (`speakeasy.js#glassOver`, renamed
  from giltOver — the two sheens, the sky's tint by day, the lit awning's underside at night). The barber pole says barbershop. Checked at
  390 / 402 / 430 by day + night: the window reads finished (the room, the chair, the tonics, the lamp).
- **EVERY NEW LIGHT FOLLOWS THE BLACKOUT** (the owner, 10:55 pm): the crossing (above); THE BENCHES' sharp overlays get the city's dark veil
  on their own pixels (`source-atop`, the veil's level in their key — the bench + whoever stands in front of it, like the city canvas
  under them); EVERY BAKED POOL on the cobbles — the implied lamps', the hidden + the cab stand's lamps', the speakeasy's spill — is taken
  down at its own ellipse first in the blackout (`stage.js#dimPools(…, all)`, up to 0.85 of its light), then the veil; the shop's lamp, the
  mirror door's spill, the lit blinds + the awning already ride the speakeasy's power hook (the windows' life is skipped below 4 % power).
  THE TEST (e2e `legends`, `&force=tr3b&lgnow=1` at 402): at the blackout's depth no light zone — the crossing's stripes, both benches (the
  overlays composited in), the shop window, the implied pool at the front curb — is brighter than the dark city round it (a ring 14 pt out:
  in ≤ ring × 1.25 + 8).

### Tests
- Unit: `harbor-holiday` (the giant off; on with `giant: true`), `harbor-people` (the new layout's routes; &force=waterbench; THE DOORMAN
  — his hold contains the guest's, at the door at tOpen, held open through two close guests, the cap tipped, back at his post, never in the
  doorway; THE PEOPLE RULE — a UFO night + a TR-3B night at 0.25 s steps at 390 + 402: every first frame at a way in, the promenade refilled;
  checked against the old filter: it fails there at exactly the window's end), `harbor-light` (the cab lamp: off-screen right, the maple's
  lower right ≥ 1.5× its upper right + 3× its upper left, the pool, the shadow left), the layout tests to the new spots, the edges' spill.
- E2E: `legends` "C4b THE PEOPLE RULE after the UFO" (8×, the UFO started through the API once the page has settled — `&lgnow=1` starts
  it at the load, before its lazy module, so the planner would learn of it after the fact; every walker's first frame at a way in, with one
  frame's walk of slack; the safety net ≤ 3) + "C4b THE NEW LIGHTS FOLLOW THE BLACKOUT";
  `people` "C4b THE CROSSWALK DIMMER" (stripes ≥ 2× the gaps, the gaps < 70, never > 235) + the cars' probe retuned to ≥ 1.12× (gentler);
  `doors` — the snap probe counts only a close it watched from its swing (the doorman's hold may be under way when the page opens).
- `folk-preview.html?only=sit,doorman` (the sitters on real benches facing us / from behind / side; the doorman attend · hold · tip ½ · 1).

### Measured
- Unit 854 / 854. E2E locally: `motion,holiday` 36 / 37 (Group 0 — the miss the known spider-tap flake F10); `promenade,people` 29 / 30
  (Group 1 — the cars' probe at the old 1.6, retuned in Group 3); `doors,people,legends,motion` 45 / 48 → fixed (the doors' probe window,
  the cars, a borderline pace sample); `people,legends,speakeasy,windows,weather,promenade` **155 / 155**; then `people,legends` after the
  probes were tightened: the crosswalk 180 vs 37; THE PEOPLE RULE after the UFO — 4 walked in, all at a way in, the safety net hid 0; THE
  BLACKOUT probe — crossing 3.9 vs its ring 6 · cab bench 5 vs 5.1 · water bench 5.8 vs 6.3 · shop window 4.5 vs 4.5 · implied pool 5.2 vs 4.9.
- The mirror door at 402 (`--cast`, every painted frame, the shop's box): the swing's first frame 0.83 → none (0.31 → 0.44 a frame, smooth).
- THE CLOUD RUN #1 (harbor 40822157405 + tests 40822157473): tests green; harbor 6 of 7 jobs green, `city` 122 / 123 — "MEMORY: 20
  title↔setup cycles leave one city, heap 124.2 MB" (≤ 6). CAUSE: the gilt's removal renamed giltCv → glassCv but the speakeasy's
  `destroy()` still cleared `giltCv` — it threw, so every city torn down on the way to HOST / JOIN stayed in memory (~6.7 MB a trip).
  Fixed (one name); measured locally after: +9.1 / +10.1 MB over 20 cycles, flat, vs the commit before the pass +7.7 (the same wander).
  THE CLOUD RUN #2 (harbor 40823948601 + tests 40823948577, the pass's last): ALL GREEN — tests + the harbor's 7 jobs; Vercel deployed cfed6d2.
- SPEED (`title-perf.mjs --ab` against the commit before the pass, b19f803 on :5174; 390 × 844, 4× CPU): a PLAIN NIGHT same (t2 +0.9 /
  +0.2 ms, t0 flagged +4.5 vs noise ±3.1 in the first run, then +1.5 vs ±2.3 in a re-run — noise); a PARTY NIGHT same at every tier (+4.6
  ms each, inside its ±4.6–17.6 noise — a consistent offset worth PERF's look); a SNOWY NIGHT faster at t2 (−4.9), t0 same (−2.8), t1
  flagged +6.1 on 1 + 2 windows (too few to judge). No new per-frame canvas work beyond one small drawImage (the crossing's light).

### Decisions made (unattended)
- The maple at f 0.9, not the notes' ≈ 0.905–0.91: at 0.905 its leaves cross the edge at 430 (431 of 430); 0.9 leaves 1–4 pt at every
  width. The cab bench moved the same world distance (0.70 u → f 0.9025), so they stay one group.
- The maple keeps its CROWN (`seedF` → `t.seedX`: the tree's plan is seeded from its position — moving it re-rolled a different tree).
- The cab lamp is a `hidden` lamp (POL4's model), not a new kind: the pools, the faces, the trees' rig + the blackout already handle it.
  Its light on the crown is pulled nearer + lower in the tree's own frame (`wK` 0.4, `y` −0.6): physically from 5 u in front it lit the
  whole right half evenly — the "flat tint" the owner ruled out.
- The cart's customers keep their 4.3 u spot (review-4's 2.6 u lands on the vendor at 2.95 u); the cart comes up from the front street at
  z 30.4 (it crosses the street under the dock — seen only while the dock rests — then over the curb).
- The doorman holds the door from its HANDLE side (right of the frame — his post is right of the door, a one-step move), not review-4's
  hinge side (left, across the doorway from his post).
- THE PEOPLE RULE's guard is per VISIT (a group, a dog walker hide together) and only for visits that START mid-screen on this device;
  a first frame / a clock jump > 5 s is a load (everyone shown where they are); it remembers a visit 20 s (a plan swapped for a frame is no
  newcomer) and allows the distance a walker covers since the last frame (a stalled frame lets a real entrant get further in).
- The benches' sharp overlays go OUT in rain + snow (a crossfade) rather than redrawing the precipitation on them each frame — the 2× bench
  under the rain shows meanwhile; their sharpness returns when it stops.
- The crossing's light is a live layer (one cached canvas, drawn with globalAlpha) — the only way the drain can take a light baked with
  'lighter' out of a multiply-veiled road; the stripes' unlit paint stays in the bake.

### Known issues
- e2e `legends` "THE BLACKOUT KILLS EVERY LIGHT" failed once on `rainSigns 7.4`: the NIGHT page takes the live / climate weather, it rained
  that run, and the rain's sign lights are refreshed every 300 ms at most — the audit read a value from before the drain. Code C4b didn't
  touch; passed in the two other runs. For C4c: pin `&wx=clear` on that page or refresh the rain's lights with the drain.
- The spider-tap check (F10) missed once in Group 0's run — FR4's known flake, C4c's.
- THE PACE IS HUMAN (e2e `motion`) measured a couple at 74 steps/min (≥ 75) once — the other couple 87; untouched code (the stride), a
  borderline sample: watched, not changed.
- Under heavy parallel load (three shots.mjs captures + an e2e suite at once) a capture caught a half-drawn frame (a flat purple sky, a
  black ground) — the baseline server did the same in the same run; not seen in a single capture. A capture-under-load artifact.
- The 11b Christmas tree on the compass must keep its base within ±1.3 u to leave the water bench clear (it isn't built yet).
- The street under the dock still shows no snow on a snowy night (old; ATM).

### Handoff → C4c (the code / tests / docs)
- `&dpr=3`: the cab stand's lamp + the new seated rig are worth a look on the owner's iPhone; the benches' overlays now carry a veil level +
  a precipitation fade in their crisp key.
- The cloud's five flakes (FR4 F6–F17): F6 (the foot slide) is closed by the giant off; the doors' snap probe now skips the first 30 frames.
- The memory guard, the climb, the phone bench: unchanged by C4b (one new small canvas: the crossing's light layer, W × the road band at ≤ 2×).
