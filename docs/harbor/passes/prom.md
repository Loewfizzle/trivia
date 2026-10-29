# PROM — THE PROMENADE, FINAL + the 9g follow-ups (Oct 28 2026; plan.md "THE PROMENADE WITHOUT LAMPPOSTS" → "A SECOND BENCH FACING THE WATER" + "OWNER'S NOTES — OCT 28 (the 9g review)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PROM — THE PROMENADE, FINAL + the 9g follow-ups (Oct 28 2026; plan.md "THE PROMENADE WITHOUT LAMPPOSTS" → "A SECOND BENCH FACING THE WATER" + "OWNER'S NOTES — OCT 28 (the 9g review)"; behind `?city=2`)
The promenade's FINAL layout (LOCKED by the owner, Oct 28 2:32 pm) — the stage every holiday, parade + centrepiece is set on from now.

### Group 0 — the 9g follow-ups
- **THE LEGENDARIES' SOUNDS LOADED AHEAD** (the owner: the UFO's first spin-up was silent after opening the link — its files were fetched
  + decoded on first use): `sounds.js#prefetchLegend(kind, picks)` fetches, decodes + PINS a legendary's whole set (`legendTakes`: the
  UFO's hum-up / hum (the picked take) / beam on-idle-off / lift / depart (the pick) / hum-down / crowd; the TR-3B's presence, drone,
  power-failure / -down / -restore, crackles, the jets; the implosion's siren, horn (the pick), charges, rumble) — `city-sound.js#
  cityPrefetch(slot, i, { hold })` keeps them out of the one-shots' LRU for the legendary's span. WHEN: `scene.js#legendSoundsWarm`, every
  ½ s — a link's held legendary (from the reveal; tried again until the tap unlocks the audio), tonight's due within the minute or running
  (`legends.warming()`), the implosion's countdown. THE START WAITS FOR ITS HUM: a link's gate (`linkGate`) holds up to 4 s more while the
  key takes decode (`legendReady`); a preview started on this phone (the panel's JUST ME) up to 3 s (`legends.tick` → `fs.soundsReady`);
  an EVERYONE preview / tonight's real run keeps the shared clock — the spin-up is placed ON THE RUN's CLOCK (`citySound … sync: { mark:
  'start' }`): a file still late joins part-way at the right second, never starts its 5 s over the loop. Test: e2e-harbor `legends`
  (`lgs1` is a cold load — the spin-up joined 0.04 s in).
- **THE IMPLOSION's NEW TIMELINE** (the owner: "it takes way too long"): `core/harbor-tower.js#IMPLODE` siren −42.6 s → 10 s after it
  ENDS (10.5 s) the horns at −22.1 / −15.9 / −9.7 (HORN B, 4.65 s each, 1.55 s apart) → 5 s after the last one ENDS the charges + the fall
  at 0 (was siren −60 / horns −20 −12 −5). The visuals read the same IMPLODE (the flashes, the drop, the dust) — in sync by construction;
  the `&force=implosion` loop (its siren 10 s in) + the real Sunday 10 am both use it. The siren's slot 0.16 → 0.176 (+10 %, ~+0.8 dB).
  Tests: tests/harbor-tower.test.mjs (the gaps), e2e `tower` (the heard gaps at &speed=4: 20.4 s + 12.3 s).
- **THE PICKS' DEFAULTS** (`core/city-sounds.js#SOUND_PICKS` `def`): HORN **B** (warning-horn), HUM **A** (ufo-hum-2), DEPART **LAYERED**;
  the panel's rows list the default first ('') + the alternates (HORN A · DESTROYER / C · SYNTHESIZED; DEPART A / B alone).
- **THE JOGGERS IN RUNNING KIT** (folk.js#lookOf 'jogger'): 55 % SHORTS + a light SLEEVELESS SINGLET (bare arms + legs, no hat), 45 % a GREY
  WOOL SWEATSUIT (a flat cap now + then); THE ARMS TUCKED (jointsOf: a jogger's elbows ~90–105° close to the ribs, a small swing mostly
  BACK, the hand closing toward the chest as it comes forward — anyone else running keeps the pump). 9g's legs kept.
  Preview: tests/integration/folk-preview.html?only=jog.

### Group 1 — THE LAYOUT + THE LIGHT (the numbers)
| piece | before | PROM |
| --- | --- | --- |
| the lampposts | 2 tall double lamps (curb, f 0.559 / 0.776, z 52.6) + 2 globes (front corners, f 0.322 / 0.962, z 36.6) | **none** — the IMPLIED LAMPS (below) |
| the compass | r 1.55, ring 2.6, f 0.6675, z 44.8 | **r 1.8, ring 3.05, z 42.6** (on the crossing's axis) |
| the framing maple | f 0.888, z 38.2 (front edge) | **f 0.875, z 42.0** (out on the floor — its whole crown on screen) |
| THE CAB STAND bench | — | **f 0.875, z 38.0**, facing the street (≈ 13 pt above the dock at 390 / 402 / 430) |
| THE WATER BENCH | f 0.515, z 47.8, facing us | the same spot, **facing the harbor** (seen from behind) |
| the vendor cart | f 0.805, z 38.4, from the right edge, handles right | **f 0.47**, z 38.4, **from the LEFT edge, handles + vendor + customers on its left** |
| the hydrant | right of the front-left globe (f ≈ 0.34) | **f 0.035 — the left curb** |
- THE CAMERA IS ANCHORED TO THE DOCK: every piece's height above the dock is the same with Safari's bars shown or hidden (the feasibility run
  at 390 × 844 / 664, 402 × 874 / 708, 430 × 932 / 746): the cab stand's foot 13 pt over the dock, its sitters' heads 44 pt; the compass
  21 pt over it + 50 pt under the WAIT / WALK lantern; the cart's right end ≈ 13 pt short of the ring.
- **THE IMPLIED LAMPS** (`core/harbor-promenade.js#IMPLIED` z 21.5 — below the screen's foot, z ≈ 23.5 — h 5.6, 9 apart, half a gap off the
  centre; `kind: 'implied'`, never drawn): their light `core/harbor-light.js#impliedAt` — a cone fanning out from the lamp: across a gaussian
  (`sx0 1.2 + sxK 0.09 × dz` — distinct POOLS on the street under the dock + two at the front curb, merging up the floor), along `1 / (1 +
  ((dz − 8) / 6.5)²)` × 1.5 (brightest on the street + the front curb, the back half toward the railing a soft dim). Faces: `FACE.implied`
  (reach 36, from the front + above); the trees: `TREE_LAMP.implied` (a far, front light — the crowns lit from the front / below); the
  road under the dock: `roadLampAt` unchanged (z ≤ 40). THE SHADOWS CLIMB UP THE SCREEN: `lampShadow` / `castShadow` (the sun's by day,
  the lamps' at night: away from the nearest implied lamp, 0.95 × the height) — the people (folk.js passes x, z), the props' cast
  shadows, the trees' (trees.js#treeShadow's night branch). THE LAMPS' LIFE runs on the implied pools (`stage.js#dimPools` darkens each
  pool's ellipse `impliedEll`; the dusk switch-on one by one, the rare stutter / outage, a bad night's stutter; the two pools nearest the
  compass stay steady during an event). The lampman's stepladder job is RETIRED (no post to climb; `work-lamp` off the panel).
- **THE CROSSWALK AT NIGHT** (road.js#crossPools): the back road's implied lamps just past the screen's left + right edges (`CROSS.edge`)
  + the crossing's own pool (the brightest strip), warm; the stripes catch it; THE SIGNALS TINT THE ASPHALT red / amber / green under each
  head (drawSignalLamps — live, with the cycle); a car's headlamps sweep it (people.js's back-road cars, lit by the same light).
- **THE CENTREPIECES KEEP TODAY's SIZE** (`centreK(L)` = z / 44.8 ≈ 0.951, `floods.js#atCentreScale` about the piece's foot): centre.js's
  pieces (the snowman, the tree stand …), the giant jack-o'-lantern + the harvest display. A piece may be marked bigger later, case by case.
- **A TREE OUT ON THE FLOOR** (the maple at z 42 — walkers pass in front of it AND behind it): the whole tree in the stage layer (under the
  walkers), its CROWN again in the front layer — everything above a walker's head just in front of its trunk (`scene.js#floorTree` /
  `crownCut`); a block circle just behind its trunk.
- **THE HOLIDAY ANCHORS** (`core/harbor-spots.js`): no lamp / globe spots — `maple` (its grate's left), `compass-left` / `-right` (outside
  the ring at its front diagonals), `hydrant` (the left curb), `bench-left` / `-right` (the water bench), `corner-right` (left of the cab
  stand), the railing's three. Halloween's big jack-o'-lanterns: the hydrant + the bench's far end (unchanged ids). Day of the Dead: the
  marigold garlands wind up the TWO TREES' trunks + frame the side door (`garlandPosts`), clumps at the compass's diagonals, papel picado
  from the speakeasy's corner wall + the crabapple across to the maple + ALONG THE RAILING (`papelRuns`: `rail` runs on the ground pass, under
  the traffic; the lantern + the crossing's landing left clear). Thanksgiving: the corn-stalk bundles round the two trees. The first of
  Christmas (the crew's strings, the tree stand at `bench-left`) unchanged. 11b reads the same ids.
- **THE WET REFLECTIONS** (wetground.js `o.reflect`, scene.js#wetReflect): the blade's neon, the side door's sconce, the shop's lamp, the
  awning's light (Group 2), the stop lights in their colour now — long broken streaks + the puddles' vertical glints; the implied lamps
  have none (nothing of them is in view); the falling rain is lit from the screen's foot by them.
- **THE WATER BENCH** faces the harbor: `props.js#drawBenchBack` (the frame's depth mirrored — the leaning back nearest us, its rear face
  toward us); its sitters reach it from the water side (`folkMap` nodes `bench` z + 0.95 / `benchFront` z + 2.05, `benchFace` 2), the strip
  behind it open from its right (the corner under the blade still closed).
- **THE CART** comes in from the LEFT edge (`L.cart.hand` −1: harbor-people.js cartIn, the vendor + his customers on its left) — the cab stand
  stands on its old way in from the right; at f 0.47 its right end clears the ring + Halloween's giant.

### Group 2 — THE LIFE + THE SHOPFRONT
- **THE CAB STAND** (`core/harbor-cabs.js#standEvents / standPlan` — PURE, every phone the same): 7:30 am → 1:24 am, a waiter in ~42 % of the
  8-minute blocks (72 % on party nights), none in heavy rain; walks up + SITS facing the street on one of two seats (the block's parity) for
  55–150 s; then GIVES UP — most walk off an edge, 38 % (in the cabs' hours) cross to the back road's curb + HAIL a cab of their own
  (`cabPlan` with `start`: the waver's cab kept first, the night's calls round it; no cab possible → they walk off). THE TAXI is the
  device's own (`screens/harbor/cabstand.js`): only while the dock RESTS (≥ 1.2 s), for a waiter seated ≥ 3.5 s with ≥ 14 s of sitting
  left, no other car on the front street, no legendary / parade / raid hold, 40 s after the last — the checker taxi (motorcar.js + the
  kit's TAXI lamp + door) pulls up on the curb lane (right → left, stopped whole on screen), the waiter walks round to its kerb-side door +
  in (`people.override`: drawn where it puts them, then hidden for the rest of their plan), the lamp goes out, it drives off; the motorcar's
  passes hold meanwhile. A scene under way finishes under the dock. Preview: `&force=cabstand` (a waiter every 100 s; the panel's CAB STAND).
- **THE WATER BENCH**: `bench` + `lunch` sit facing the water; `skyline` — a couple stopped beside it watching the skyline from behind
  (afternoon 0.8, evening 1.4, late 1; none in rain).
- **THE DOORMAN AGAINST THE WALL** (folk.js pose `wall`: his back to the brick RIGHT of the side door — `harbor-crew.js#doormanWall`, under
  the blade — a boot up against the wall, arms crossed; `st.off` pushes him off, both feet down, arms down, for the NOD). His HEAD follows
  each guest (`people.js#doormanWatch`: the nearest person within 6.5 units → `st.look`, eased; folk.js draws the head + the hair + the face +
  the HAT from it — the fedora's brim swings + dips toward where he looks: a clear left / front / right); a guest within ~2 units of the door
  (or in it) pushes him off the wall. The nightly doorman (crew PLAN.doorman) + the party line's (`lineNight`: at the wall between
  admissions, stepping out to beckon at each).
- **THE BARBERSHOP AWNING LIT FROM UNDERNEATH** ("B"): the three lamps, their fixtures + their baked light are gone; LIVE
  (`speakeasy.js#awningUnder`): the canvas's stripes glowing from below (warmest at the front edge), the scallops' warm rim, the shopfront
  under it lit as SURFACES through the doors' dodge (a band from the strip down — the brick, the glass, the HARBOR BARBERS lettering), a long
  warm pool on the pavement, the shop door's leaf from the strip over it (9d's doorLight). HOURS (`core/harbor-speakeasy.js#awningLight`,
  tested): the PHOTOCELL (darkness 0.16 → 0.34), OFF at 1:00 am Sun–Thu, 2:00 am Fri / Sat + holiday party nights (a 36 s fade), off in the
  TR-3B's blackout (`speak.power`); after, the shop's faint night lamp. `&force=no-awning-light` = off.

### Group 3 — THE STILL PIECES SHARP + GROK's MODELS
- **THE BENCHES at the phone's FULL dpr in their place**: `still.js` draws both live in the near pass (z-sorted with the walkers — the water
  bench's back over its sitters' legs) from sprites at the device's dpr, AND lays each as a 9c crisp overlay (the city's canvas is capped at
  2×) that draws again whoever stands IN FRONT of it (`people.js#overKey / redrawOver` — the near pass's figures as drawn this frame), so
  a walker still passes in front. `&force=no-still-crisp` = off. The flat paving — THE COMPASS INLAY, THE TREE GRATES — stays in the 2× bake
  (DECISION: everyone stands on it — the dance, the centrepieces, the snowman's builders — an overlay would redraw a crowd every frame; it is
  a brick texture, not lettering). THE HYDRANT stays on the city canvas (17 × 20 pt — its spray + wet patch are live).
- **GROK's MODELS** (art/models/promenade/: fancy_bench, park_bench, fire_hydrant, american_fire_hydrant — copied unmodified, MD5s match
  credits.txt; the .glb's git-ignored): baked by `scripts/bake/promenade.mjs` (`node scripts/bake-model.mjs "<chromium>" promenade --model …
  --look DIR`) at the city camera's own shifted lens (no tilt) at their real depth + size (the bench 3.3 units at z 38 / 47.8, the hydrant
  1.0 at z 37.2), day + night, four yaws. VERDICT (unzoomed, side by side): both benches read as dark, generic benches at ~40–50 pt (the
  fancy one's scroll ends vanish front-on) — the hand-drawn bench (warm oak, green Deco iron, finials, the brass plaque) reads better + is the
  city's palette; the hydrant model (a dark bonnet, weathered paint, chains) reads worse than the drawn domed red 1920s hydrant; the American
  one is two green copies on a checker material. **The hand-drawn pieces stay; nothing ships, no credits added.**

### Measured
- Unit suite 849 / 849. E2E groups run locally: legends + tower 36 / 36, promenade + holiday + weather + snow (the snow group's one
  multi-group miss passed alone), people (the cab stand's taxi came + took its fare only with the dock at rest), doors, citylife.
- title-perf `--ab` (A = 302697b, the pass's Group 0, on :5174; B = the working tree; 390 × 844, 4× CPU, tier 2, 2 + 2 windows): np-night
  +3.9 ms work (noise ±6.3: same), np-party −1.5 (same), w-rain −3.0 (faster), np-snow −2.2 (same), np-halloween −3.0 (same).

### Decisions made
- The implied lamps at z 21.5 (just below every phone's foot), 9 apart; their light tuned by the side-by-side (three passes: a daylight
  wash → too flat → two pools at the front curb + the falloff).
- The vendor cart f 0.5 → **0.47** (the owner's "~0.5"; at 0.5 its right end touched the ring and crowded Halloween's giant) and **wheeled
  in from the left** (from the right it would roll through the cab stand); its handles + vendor + customers on its left.
- The giant's "through" test reads its DRAWN size (centreK) and allows the front strip passing just in front of it (the compass came
  forward: in front is fine, through is not).
- The cab stand's planned waiters give up on their own (no shared state can know a phone's dock); the taxi is local + hides its fare
  locally — another phone simply sees them walk off later.
- Retired, not half-working: the lampman (no post), `work-lamp`, the lamp / globe dressing spots, the lamps' crossarm perches.
- The awning's light is LIVE (its 1 am / 2 am switch-off fades on the clock; a bake would swap). Its gilt keeps its baked lamp-lit gold.
- The brim turn only for a head turned on its own (`J.look`) — every other figure's hat is unchanged.

### Known issues
- ~~The gilt HARBOR BARBERS keeps its night gold after the awning goes off at 1 / 2 am~~ — closed by C4a (the gilt is lit by the awning's level only: #c4a).
- ~~The bench overlays (crisp) don't carry the rain streaks / falling snow over the benches' own pixels~~ — closed by C4b (the overlays crossfade out while it falls: #c4b).
- A cab-stand waiter's taxi has no sound of its own yet (the city's sounds have no car-door slot).
- The `water` walkers can pass a few pt in front of the old floor line at the left (still above the dock — the e2e checks the screen now).
- **THE CLOUD RUN (harbor 40781830582): 4 of 7 jobs green; 3 red, all PROM's** (the third — the foot slide — CLOSED by C4b: the giant is off, the couple's partner 0.06 of the body's speed) — two fixed after the run (not re-run: the pass's two cloud
  runs were spent): the promenade debug had TWO `cabStand` keys (the taxi's debug overwrote the bench's place — the taxi's is `cabTaxi`
  now) and the 9c crisp test listed its overlays (now + the two benches). THE THIRD IS OPEN: e2e `motion` "THE PLANTED FOOT NEVER SKATES"
  — a couple's partner at 0.29–0.30 of the body's speed (≤ 0.25; the pre-PROM build measures 0.05). CAUSE (measured): from Oct 24 the
  giant jack-o'-lantern stands on the compass, and the compass came forward — its closed floor (RING.clear + a step, r 5.45) reaches
  z ≈ 37.2, IN FRONT of the walkable floor (zMin 38.75), so walkers detour round the giant's front at z ≈ 37 (still ~8 pt above the dock)
  on the circle's tight chords, and a couple's partner skates through those bends. Three fixes tried + reverted (a closed strip in front
  of the piece; that strip open to a step-out; no detour point in front of the floor) — each sent someone straight through the giant,
  because the way round BEHIND it (past the water bench, under the blade) has no route. The fix: open a route behind the compass when a
  piece stands on it (or a smaller closed floor for the giant's drawn size) — a follow-up before Halloween 2027 (only the build-up dates).
- 9g's known flake again: e2e `panelrows` "A WITCH AT HER CAULDRON" fired nothing once with panel + people + panelrows together (24 of 25
  rows) — load-dependent, code PROM doesn't touch.
- A frame failed silently in the browser during Group 2 (`st` out of scope in folk.js's head painter) — caught by the load log; the
  probe `harbor().loadLog.rows` "a frame failed" is the first thing to read when a preview shows a black promenade.

### Handoff → ATM (THE ATMOSPHERE pass)
- The clouds / wind / fog / storm / freezing-rain pass reads the same promenade: the implied lamps' light (`impliedAt`) is the ground's light
  in fog (the halos belong to the visible lights: the signals, the sconce, the awning's strip, the blade); the wet reflections list
  (`wetReflect`) takes new lights; the trees' sway still copies the maple's crown from the FRONT layer (its crown lives there now).
