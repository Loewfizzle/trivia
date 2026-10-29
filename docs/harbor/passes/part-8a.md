# PART 8a — THE PROMENADE'S LOOK (+ the 7a follow-ups, the sound slots) (Oct 23 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 8a — THE PROMENADE'S LOOK (+ the 7a follow-ups, the sound slots) (Oct 23 2026; behind `?city=2`)
The owner's iPhone review of 7a: the speakeasy 7–8 / 10 at night, "cozy" — but the placeholder promenade's lamps cast a weird haze over
everything, so the foreground couldn't be judged. This pass gives the foreground its real look. The bar: the night city. Four helpers ran
next to the lead (the sound slots, the pulse + the first tap, the trees, the props); the grey-box stopped twice for the owner (her notes
below). The audio detail lives in docs/audio.md (#the-city-sounds, #8a--the-pulse-after-returning).

### 0. The 7a follow-ups (section 0)
- **THE BILLBOARD ONTO THE SPEAKEASY'S ROOF** (`core/harbor-layout.js#BILLBOARD`, `L.roof.board`; `core/harbor-neon.js` spot `bb-left`, mount
  `speak`; `signs.js#buildBillboard` + its DUNNAGE): over the left half-plus of the roof (u 0.6–7.4, 1 unit in from the roof's back edge — the
  deck in front stays open for 7b's guests + 8b's billposter), raised on its steel lattice frame (0.95 units of open frame ≈ ¼ of the board's
  3.7, the city showing through), catwalk + ladder + the four gooseneck lamps unchanged. **Its feet:** from this camera the deck itself hides
  behind the parapet (7a's note), so the frame stands on a DUNNAGE platform (steel I-beams on short posts from the deck, the way real rooftop
  billboards sit) whose top clears the parapet's line by ≥ 4 pt — the base plates + bolts always show. **Its own baked group `bill`**
  (scene.js: a band from its lamps to the dunnage's posts), drawn right before the `stage` layer — the speakeasy's bulkhead, chimney,
  parapet + string lights stand in front of it; its lamps' light (`neon.draw(c, 'bill')`) the same. At 402: 24 → 99 pt across, 499 → 539
  down; fully inside the left edge at 390 / 402 / 430, clear of the wheel's rim and the vertical word tower's letters (tested). The old
  billboard's lowered near-band roof is gone (the skyline block keeps its own height).
- **THE BLADE SIGN, the name BIGGER** (`speakeasy.js#BLADE`, `paintBlade`): it can't grow wider — the wheel's left leg lands ~3 pt right of
  it — so it grows DOWN the side wall (its foot just above door height, clear of the west stop light) and up to the cornice: ~24 × 104 pt
  at 402 (was 22 × 75). The letters fill their column (up to 1.5× the face's width, a sign-writer's broad stroke). A bug fixed on the way:
  the name was split on `/s+/` (the letter s), so a two-word name ran down ONE column with a gap — DOUBLE | AGENT now stand side by side
  (~10 pt letters); a 9-letter word (OVERCLOCK) ~10 pt a letter. **THE CORNER TURN IS GONE** (the owner picked the blade): `&force=corner-turn`,
  `CORNER_TURN`, the turned wall's painted ad + its three lamps, the layout's `opts.corner`, their tests — all removed.
  **Crowded?** The speakeasy with the roof billboard + the blade + the string lights reads busy but as one lively corner (the lead's call);
  the easy option if the owner feels otherwise: the blade's lamps dimmer at night so the billboard leads.
- **THE FIRST-TAP SURGE whenever the sign is NOT on** — `district/neon-ramp.js#firstTapAnswer` (the sign's real state, not a day / night guess):
  night → `first`; the morning goodbye, day, golden hour's early sputters, polar day → `surge`; the evening WARM-UP window (from the first letter
  sticking to the catch, the last few minutes) → `catch` (lights it for good); reduced motion → `soft`; the intro / a race running → skip.
  (The owner may want the whole hour-long ramp to catch instead: `warmAt` → `plan => plan.startAt`.)
- **THE PULSE AFTER RETURNING** — the city's frame loop died on iOS returns (docs/audio.md#8a); a watchdog restarts it; the readout's beat line
  shows `pulse` (the punch the lights got in the last ½ s); the AUDIO panel's `city` row. **PULSE STRENGTH** (LIGHTS): 50–250 %, default 130 % (FP: 175 %)
  (`core/harbor-beat.js#PULSE_DEFAULT = 1.3` — the owner's pick locks in there, + the two lines in harbor.test.mjs).
- **THE NEON TAP SOUNDS ~25 % quieter** (`title.js#NEON_TAP_LEVEL` × 0.75); the power-on + the catch unchanged.
- **THE SOUND SLOTS + the first five recordings** — docs/audio.md#the-city-sounds (65 slots, 6 filled, `scripts/add-city-sfx.py`, the panel's
  SOUNDS category).

### 1. The layout (the owner approved the grey-box on its third round)
Round 1 (her notes): everything on the promenade far too small next to the speakeasy (a person ~⅓ of its door) → **people ~⅔ of the door
(SIZE.person 20 → 27 pt at z 47), everything else in proportion, the nearest pieces biggest**; fill the bare lower middle; trees by the REAL
date (October: autumn maples), the crabapples small accents; the flagpole floated over the water → then **REMOVED** (flags only on holidays —
a later part dresses the lamp posts); the stop lights + crosswalk off the wheel's base. Round 2: the medallion into the MIDDLE of the open plaza
(the big seasonal pieces stand there: open space round them, never the door or the shop window; an 11-unit Christmas tree there stays under
the wheel's hub — tested); the far-left globe lamp dropped (it stood in front of the barbershop window).
`core/harbor-promenade.js` (PURE): `PROM` (the bands' depths), `PIECE` (the sizes), `PHONE` (where everything stands, by SCREEN FRACTION at its
depth — every phone the same picture; a panorama keeps the phone's stage beside the speakeasy and repeats the curb band), `promenadeLayout()`:
| band | z | what (402 pt) |
| --- | --- | --- |
| the waterside road | 54–64 | the two pole-top 1920s stop lights at f 0.60 / 0.735 (arm 0 — the heads on the poles; `road.js#signalSteps` keeps the mast arm for later), THE CROSSWALK between them, right of the wheel's base |
| the curb band | 52.6 | a sugar maple (f 0.818, crown ~56 pt), a tall double-head Deco lamp (f 0.93, ~70 pt); nothing under the wheel's pier |
| the plaza + the middle | 41–49 | THE MEDALLION (f 0.47, z 42.6 — its ring ~74 pt), the bench (0.665, z 47), the cart (0.778, z 44.4), a crabapple accent (0.405, z 49) |
| the front walk | 36.6–38.8 | two globe lamps (0.355, 0.69; ~60 pt), two big planters (0.15 under the shop window, 0.618), THE FRONT MAPLE (0.893, z 37.2, crown ~80 pt — the nearest, framing the right) |
| the implied road | < 35.6 | its granite curb just under the dock's top, the asphalt below — no car ever drawn |
`L.zones` (8b's walkable areas: the plaza, the walk, the front, the curb + what blocks them), `L.edge`, `L.impliedRoad`, `L.crosswalk`.

### 2. THE GROUND + THE LAMPS (`stage.js`)
- **THE SETTS:** rounded granite in staggered courses, EXAGGERATED ~3× real size (0.95 × 0.72 units) so they read on a phone like the bricks,
  stone by stone its own shade (warm / cool now and then, a worn darker one), the far half — its top facing the sky — lighter, a bright lip by
  day; the joints sand + grime. The curb band: big granite pavers in a running bond. The front curb: long dressed blocks, a lit rounded top,
  the face in shade. The implied road's asphalt: its grain + two worn wheel tracks.
- **THE NIGHT LIGHT — POOLS, NEVER A HAZE** (the owner's "weird haze" was Part 1's wide warm wash over everything): every lamp's pool is
  BAKED INTO THE STONES (`lightField`: each sett takes the light where it lies — lit tops, dark joints; the tall street lamps a clean cool
  white, the globes warm, the speakeasy's warm spill at its door + shop window), overlapping so every path is lit, the shadows between a dim
  violet-grey (never black). The pools' strength is the lamps' ramp in sixths (`T.lamps`, in the bake key — they come up through dusk in a few
  crossfaded re-bakes, like the floodlights): no per-frame cost, and everything standing on the cobbles is drawn OVER its pool. Live, every
  frame: only the lamps' GLASS lit (an opal globe glowing from inside, a white-hot heart) + a small soft halo round each.
  `&force=no-lamp-light` (an A/B tool): no pools baked.
- **THE LAMPS** (crafted, baked): painted cast iron (a deep green-black, its sun side catching the light), brass collars, opal glass. The TALL
  lamp: a stepped Deco plinth, a fluted tapering post with a brass collar + a band, a stepped capital, a crossarm on scrolled brackets, two
  opal globes + a centre finial. The GLOBE lamp: a flaring bell base, a slim fluted post, a Deco cup, one big opal globe + a finial. At night
  the ironwork under each globe catches its light. By day their shadows along the real sun (`sunShadow`: the camera looks north — a morning
  sun on the left throws them right and away).

### 3. THE TREES (`trees.js` + `core/harbor-trees.js` PURE + tested) and THE PROPS (`props.js`)
- **THE TREES** — two sugar maples (the curb one ~56 pt, the big front one ~80 pt framing the right) + a flowering crabapple accent. What a
  tree IS is pure (`core/harbor-trees.js#treePlan`: its skeleton — a trunk with root flare + bark furrows forking into 4 limbs + a leader (the
  crabapple 5 vase limbs) down to fine twigs; ~34 overlapping leaf CLUSTERS (21 on the crabapple), never a ball, the lower middle open so the
  fork shows; its colours; what lies under it), seeded by where it stands (the same branches all year, only the leaves change). `trees.js`
  lights it: every leaf dab lit by its own normal — the sun's side warm + bright, the far side + the underside cool (autumn shadows deep
  crimson / burnt orange, never olive); golden hour warm + low; overcast flat; at night deep tones with the side facing the nearest lamp lit
  (warm under a globe, cool-white under the tall lamp; `ctx.lampK`) + a faint sky rim. A square cast-iron GRATE (a Deco sunburst of bars)
  with fallen leaves / petals. **THE SEASONS:** autumn (today) each maple its own mix (the curb one scarlet-crimson, the front one blazing
  orange with gold + red), some inner clusters green early, thinner crowns + more leaves down after phase 0.7, the crabapple yellow-bronze with
  little red apples; spring the maples leafing out light green, the crabapple in full pink-white BLOSSOM + petals on the ground; summer full
  deep greens; winter fully bare, finely branched (the crabapple keeps a few apples; `ctx.snow` > 0 lays simple snow on the level limbs + the
  grate — 0 today; `ctx.wet` darkens the bark). **`treeShadow`:** dappled crown + trunk + branch shadows along the same sun as the lamps'.
  **`createLeaves`** (live): autumn leaves from the maples, spring petals from the crabapple, a rare leaf late summer, none in winter — more
  later in the season + in a stronger wind, drifting with the real wind, fluttering, landing by their tree, fading ~2.5 s; ≤ 12 at tier 2,
  ≤ 5 at tier 1, none at tier 0 / reduced motion; plain fills. **Cost:** ~1.1–1.5 ms a maple, ~0.75 the crabapple at 1× CPU (~5–6 ms at 4×) —
  each tree bakes in a step of its own (`stage.js#furnitureSteps`: `heavy`).
- **THE PROPS** — one lighting model for all (each surface by the way it faces: the sky + the real sun by day, warm amber at golden hour,
  flat under overcast, deep cool tones at night with the lamp-facing side lit, `ctx.lampK`; brass + enamel glints); depth exaggerated a little
  (×1.35–1.8) so the seats + planter tops read from the camera; cast shadows along `stage.js#sunShadow` + a contact shadow always.
  **THE BENCH:** painted cast-iron Deco ends (curled feet, a stepped knee, curled armrests, stepped finials), oak slats with grain, knots, lit
  edges + bolts, a brass plaque. **THE CART** (by the season, unless `cart.kind` says otherwise): autumn + winter a green HOT CHESTNUTS cart
  (an iron firebox with glowing coals, a brass domed roaster, a chimney with a rain cap, a pan heaped with chestnuts, a scoop, paper bags);
  summer a cream ICE CREAM cart (a pink umbrella, chrome tub lids, a cone on a rod); spring a FRESH FLOWERS cart (a yellow umbrella, zinc
  buckets of tulips + daffodils) — four spoked wheels with gilt pinstripe + brass hubs, push handles, gilt-striped panels, a 14-panel striped
  umbrella with a scalloped valance whose BULBS glow at night with the lantern + the cart's own warm light. **THE PLANTERS:** cast-stone Deco
  (a two-step base, corner pilasters, a fluted panel, a carved chevron band under a projecting lip, speckle, rain streaks, lichen) brimming by
  the season — autumn mums (rust, gold, burgundy) + ornamental kale; summer red geraniums, trailing ivy, white alyssum; spring red + yellow
  tulips over pansies; winter evergreen boughs, red berries, pine cones, birch twigs (`ctx.snow` on the boughs + the lip). **THE MEDALLION:**
  a ring of polished pale granite in 12 slabs (a sheen, a dark joint to the setts), a brass band, a dark green granite field, a compass
  sunburst of 8 brass + 8 cream terrazzo rays (each split light / dark — raised), a brass heart + boss; glinting by day, catching the lamps
  at night.

### 4. THE IMPLIED ROAD (`screens/harbor/roadlight.js`, `core/harbor-promenade.js#roadPassAt`) — the owner's idea, on by default
Cars along the bottom edge are never drawn (moving cars behind JOIN / HOST would be the busiest thing behind the most important buttons) —
only their LIGHT: at night a car's headlights sweep across the near cobbles (a long soft warm pool + a brighter core near the curb) gliding
left or right with it; by day a soft shadow slides along the front walk. ON THE CLOCK (`roadPassAt`: a 40 s slot holds at most one car, its
chance by the hour — `roadBusy`: the evening rush busiest, ~3 am nearly empty; every phone the same; a pass under way joins mid-way, silent);
its SOUND (`car-1920s-pass`, a random take) starts with the pass and the light peaks when the car is nearest (the take's `peak`, ~9 s).
`&force=no-implied-road` switches it off (the setts then run to the screen's foot); `&force=road-pass` a car every ~13 s. THE RAID's hook
(7b): `harbor().road.wash({ col, k })` — a coloured wash rolling up from the front.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, golden hour `T18:20`, night `T22:00`, party `2026-10-24T23:00`; the seasons: `&season=spring|summer|winter`
(or the panel's PROMENADE → SEASON); the implied road off: `&force=no-implied-road`; a car passing: `&force=road-pass`. THE PREVIEW PANEL's new
**PROMENADE** category: SPRING · SUMMER · AUTUMN · WINTER · IMPLIED ROAD OFF · A CAR PASSING.

### Hooks for 8b (THE LIFE) + Part 9 (seasons + weather)
- 8b: `L.zones` (walkable rects + the pieces to walk round), the plaza in front of the door (8 guests, the party line), the medallion's spot
  (`L.medallion` — the seasonal centrepieces), the bench (`L.bench` — sitting), the cart (`L.cart` — its seasonal kind), the curb (the bus stops
  there: no shelter), the crosswalk + the stop lights (`L.signals`, the cycle), `harbor().road` (a pass now — 8b's traffic can sync with it), the
  lamps switching on one by one (the city schedule: today they come up together with the lamps' ramp; a per-lamp switch needs a live overlay or a
  re-bake per lamp).
- Part 9: `pieceCtx(L)` carries `snow` + `wet` (0..1) into every piece's art (the trees' snow on branches, the planters); the ground's hooks: the
  setts' joints (snow settles there first), a wet sheen + the lamps' reflections + puddles (the light field `lightField` is the reflection's
  source); `L.snow` / `L.wet` are 0 today.

### Tests (8a)
`harbor.test.mjs`: the roof billboard (inside the left edge at 390 / 402 / 430, clear of the wheel + the word towers' letters, its feet above the
parapet, ~¼ open frame); the promenade (the medallion clear of the door, the shop window + the furniture, an 11-unit centrepiece under the wheel's
hub, nothing under the dock, no tree cut by an edge, no flag, the stop lights right of the wheel's base); the season by the date / forced / the
south; the implied road's passes (the same for everyone, the evening busier than 3 am); the size rules at the owner's scale; the trees (crowns
inside their boxes, the seasons' plans) + the props (every prop × season × look draws clean, the shadows by day only); the panel's PROMENADE rows;
the sound slots (`city-sounds.test.mjs`); the pulse + the first tap. e2e-harbor: the new `promenade` group (the layout, autumn on Oct 21, the
lamps' glass, the medallion, THE POOLS — a patch by a globe lamp lit vs `&force=no-lamp-light`, a forced car pass + a forced season, the road
off), `sounds`, `music` §10, `panel`.

### Performance (A/B in one run, `title-perf.mjs --ab` against 8b73a7e, 402×874, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | — · 6.54 → 6.12 · 2.66 → 4.34 | 16.8–17.0 · 0 % both | same (t1, t0) |
| `np-night` (4×) | 7.77 → 4.79 · 4.19 → 4.18 · 2.75 → 4.63 | 16.8–16.9 · 0 % both | same ×3 |
| `np-party` (2×) | 9.39 → 8.97 · 6.2 → 6.33 · 4.22 → 4.39 | 16.8–17.0 · 0.3 → 0 % | same ×3 |
The promenade is BAKED (the setts, the pools, the trees, the props): per frame it adds the lamps' lit glass (5 small sprites), the road's light
(a pass at a time: 2–3 sprites) and the falling leaves (≤ 12 fills). The bakes: each tree its own step (~5–6 ms at 4× — the heaviest step).

### Known issues (8a)
- The pools step in sixths of the lamps' ramp (re-bakes crossfaded over 1.2 s) — a lamp can't switch on alone yet (8b's city schedule).
- The tall lamp's pool on the curb band sits behind the front maple's crown at 402 (the maple frames the right side — the owner's ask).
- DESKTOP / the wide camera: the panorama's promenade is sparse (a wide sea of setts, a few lamps + trees repeating) — Part 12's desktop pass.
- The placeholder people (8b) stand where 8b will walk them — some over the planters / by the medallion in the shots.
- ~~The bench is the farthest prop from the lamps: at night it reads as a dim silhouette~~ — FP: the bounce light + a tall lamp beside it.
- Winter's bare branches are dim at night until Part 9's snow; the crabapple's blossom could be fluffier / whiter.
- The levels of the five recordings were set by analysis, not by ear (docs/audio.md) — the owner's ear decides.
- WebKit can't run here: the pulse-after-returning fix is proven on Chrome with WebKit's failure emulated; the owner's iPhone decides.
- e2e-harbor's `perf` group fails on this machine with `Protocol error (Runtime.callFunctionOn): Promise was collected` — the SAME on the
  commit before (8b73a7e, run the same way): a harness / Chrome flake, not this pass; the A/B perf (title-perf.mjs) is the gate and says same.
- The `core` group's RE-LAYOUT probe now averages an 8 × 8 pt patch of the cobbles in front of the shop (Part 1's single pixel sat on the
  placeholder corner tree, gone — on the shop window's edge it read the DPR change as a 73-point jump).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The foreground is now real: judge the city's look with it. 8b walks the people on `L.zones`, drives the cars + the bus on the road (the
implied road's passes are on the clock: sync the traffic with `roadPassAt`), the stop lights' cycle, the city schedule (lamps on one by one: a
live overlay over the baked pools), the gulls on the roof billboard's top edge + catwalk, the billposter on the roof (the billboard's catwalk
+ ladder), the sign painters on the blade (a ladder), the dog walkers on the front walk.
