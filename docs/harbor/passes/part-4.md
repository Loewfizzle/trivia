# Part 4 — THE WATER (+ Part 3 touch-ups) (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Part 4 — THE WATER (+ Part 3 touch-ups) (Oct 21 2026)
- [x] 0. The owner's Part 3 review: the outlines follow the Deco shapes · the icons + the billboard read · the centre breathes.
- [x] 1. The water: the mirror in perspective, the light columns, the ripples on the real wind, day / golden / night, the sun's +
  the moon's paths, the lapping edge, the quay lamps lit; hooks for Parts 5, 9, 10, 11a.
- [x] 2. Perf + memory (below). 3. Review: day, golden, sunset, night (calm), night (windy), the moon, party — at 390 / 402 / 412 /
  430 / 874 / 1440 + the water close up (`--crop water`) + the neon close up (`skyl, skyr`); two refine passes. Docs.

### The touch-ups, as built
- **THE OUTLINES FOLLOW THE DECO SHAPES** (`core/harbor-neon.js#outlines`): a tower's outline is ONE BENT TUBE A SIDE — up the
  shaft (from 45 % up: the foot is behind the base), stepping in along every setback, up each tier, over the crown's own steps when
  the crown is the building's colour (the word towers: the parapet bar + the two-step ziggurat; a stepped top, a pyramid, a dome,
  the mast's drum + lantern + spire), down the other side; a crown in an accent colour is its own tube (`crownPath`); the middle
  tier from its shaft's top (its stepped cap). **Deco FINS**: thin tubes (0.6×, `thin`) up every tier above the shaft (2–4 by the
  tier's width), never where a sign hangs (`outlines(L, signRects)`: host → the signs' world rects). Tested: every tier's edges on
  the contour, the bends, the fins, the word towers' ziggurat (≥ 6 heights), never across a word face.
- **THE SIGNS READ** (`SPOTS`): the icons ~20–21 pt (were 11–18; tested ≥ 19 pt at every phone) on calm walls — the near band's
  corners left (i-left) and right (i-r1, i-r2, i-r3: a small sign wall right of the lighthouse), under wordA's face (i-c1, i-c2),
  on JAZZ and PAR; **the billboard** moved to the left near band's wall and half as big again (66×32: `bb-left`), its name as big
  as the board allows (two words stack), the tag line only if it reads, its gooseneck lamps kept at their real size. (The stage
  option was weighed: a billboard there would crowd Part 7 / 8's stage and the water; the skyline wall reads at 66 pt.)
- **THE CENTRE BREATHES**: no icon on the needle, the dome, the step tower, the hotel or PULSE (behind the wheel) — the NEON NEEDLE,
  the sunburst's named sign, the wheel and the HOTEL blade stand alone (tested: no other sign within 50 pt of the needle). The
  word towers + the construction tower's spot unmoved; **no sign on wordV** (tested).

### THE WATER, as built (`screens/harbor/water.js`)
- **The surface** is world y = `LEVEL` (−0.8): the far quay's wall shows ~2–3 pt of stone above it (its lamps on top); the band
  runs from there (`waterBand(L).y0`) to the railing's foot (`y1` = the road's far edge; the road covers below it).
  `axisAt(L, z)`: where the water meets something standing in it at depth z (its reflection flips about that line).
- **The mirror = the frame itself.** Everything above the waterline is drawn before the water (the sky, the far + near city, their
  lit windows, the neon, the beacons, the rays, the fog, the searchlights' beams, the quay lamps), so the water copies THAT region
  of the frame (one `drawImage` of the scene's own canvas, 1 px a pt) and flips it about the waterline. Every light that is or
  ever will be drawn there reflects for free and stays in step — the neon's power + flicker, a word in the windows, a holiday
  scheme, the construction tower at whatever stage it is (Part 9), the searchlights. (`neon.reflections()`, `lights.beaconList()`
  are not needed for it; they stay for later parts.)
- **The light columns** (night × how dark): a bright-pass of that copy (src³ — `multiply` twice: only the lights survive, neon
  colours saturate) drawn as stretched, flipped copies (half resolution, additive): a light e pt above the waterline lands between
  s0·e and s1·e below it — a sign by the quay makes a short column, a crown light a long one reaching the near water. Calm: s 0.6–1.1,
  5 copies; windy: 0.24–1.28, 10 copies (a little sideways wobble each).
- **The ripples**: the mirror is drawn ROW BY ROW (strips 0.7 pt far → ~3.4 pt near; 59 at 402×874 tier 2) — one wave phase per
  depth (a wavefront is a line parallel to the shore): a sideways wobble, a vertical break (rows sample a little above / below) and
  a crest / trough brightness per row, all growing toward us and with the wind — so every reflected light breaks into shimmering
  bands. **FRESNEL + DEPTH**: each row's opacity = a mirror at the grazing far end (0.93) → the water's own colour looking down near
  us (the baked base under it: blue-green by day, orange at golden hour, near-black at night), less of a mirror in wind.
- **The wind** is the real one (`LK.wind`, m/s; `&wind=` in previews): roughness 0 under ~1.2 m/s (a glassy, crisp mirror) → 1
  at 11+ (choppy: bigger wobble, broken rows, longer columns, denser wavelets); real rain adds 0.35 (Part 9 adds the rings).
- **The wavelets**: two baked textures of perspective dashes (sky-lit crests in the hour's colour, dark troughs; their density per
  wind bucket) sliding against each other.
- **The paths** (additive): the SUN's gold glitter path toward us while it is low (−2..16°, the sun's drawn x; fades with real
  cloud): a hot soft column by the quay widening toward us + ~200 twinkling dashes; the MOON's silver path at night (its drawn place
  + phase, `fx`'s moonAt; P.moonA × its height × its phase × `moonVeil` — none when it is down or behind real cloud): mostly glints;
  BY DAY sun glints across the water, thicker toward the sun's side.
- **The near edge**: a slow surge (~7 s) lapping at the near quay wall's foot behind the railing — a wet band + a thin crest line.
- **The quay lamps** (`quay.js#drawQuayLamps`): lit at night with the city's power-on (a hot head, a halo, a pool on the quay's
  edge; all the lamps baked into ONE sprite per layout — `quayLampSprite` — and drawn additively, one draw a frame) — their warm
  columns run down into the water.
- **Cost**: the work is spread over a 6-frame cycle and never two steps in one frame — one frame BUILDS the mirror (re-reads the
  frame above the waterline, flips it, the objects in the water, the light columns: the SOURCE, 10 times a second — the city's
  lights change slowly and the ripples hide the steps), the others COMPOSE the water from it (the rows, the wavelets, the paths,
  the edge) into its canvas: 30 times a second at tier 2, 20 at tier 1 (wider rows, fewer copies, one wavelet texture); every
  frame shows that canvas. The glitter paths' + the day glints' dice are computed once per layout (only their twinkle per
  compose). **Tier 0 and reduced motion**: a calm baked mirror — built + composed about once a second with the ripples still (the
  lights still follow the city).

### The water's API + HOOKS (`harbor().water`)
| hook | what | used by |
| --- | --- | --- |
| `reflect(fn, axisY)` | `fn(ctx)` draws an object (screen coordinates) flipped about its own waterline `axisY` (`axisAt(L, z)`) into the mirror | the wheel + the lighthouse now (`scene.js#waterMirrors`: their rects of the baked harbor layer); **Part 5**: Rosie + her bulbs, the taxi, the tug, the sailboats, the train, the beam |
| `light(x, y, col, a, w)` | a light NOT in the frame above the waterline as a column in the water (like `reflect`: read when the mirror is BUILT, 10 times a second — call it every frame, 5 of 6 calls are simply dropped) | **Part 10**: fireworks high over the city (the finale's sparks), **11a**: the ghost ship's glow |
| `wake({ x, z, len, dir, k })` | a boat's wake (stored, max 16) | **Part 5** draws them |
| `set({ rain, fog })` | rain roughens the mirror now; the rings on the water + the fog over it | **Part 9** |
| `set({ off: true })` | the live water off (the baked base stays) — perf A/B on one page | tests |
| `band()`, `debug()` | `{ y0, y1, strips, copies, lights, paths, rough, ms: { copy, mirror, columns, build, strips, tex, paths, compose, blit }, tier, mb }` | tests |
Fireworks low enough to be in the frame above the waterline, Part 5's lit wheel and the train on the far waterfront (when drawn
before the water) reflect without any call. `&force=no-water` turns the live water off (perf before / after).

### Performance + memory (Part 4 — the clean comparison, Oct 21 2026)
Measured A-B-B-A against the previous commit (9d3fd7e = Part 3's code) on the same quiet machine, one after the other: previous,
Part 4, Part 4, previous — `title-perf.mjs --city 2`, 390×844 (DPR 3 capped to the tier), 4× CPU, mean ms of scene work, each
number the mean of its two runs; frames 16.7 ms everywhere:

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| night (`np-night`) | 4.7 → 5.7 | 4.7 → 4.6 | 3.3 → 3.5 |
| party (`np-party`) | 5.6 → 6.4 | 5.1 → 5.4 | 3.5 → 3.6 |
| the worst case (`neon`: the party moment + searchlights + a word) | 5.9 → 6.9 | 5.7 → 5.8 | 4.2 → **4.5** |
| golden hour (`np-golden`) | 4.9 → 5.9 | 4.6 → 4.9 | 3.5 → 3.8 |
| day (`np-day`) | 3.0 → 4.2 | 3.0 → 3.7 | 2.7 → 3.0 |

Every scene is within 8 / 6 / 4 except the worst case at tier 0, which was already over on the previous commit (4.1–4.3 in this
run; Known issues). The live water alone, on one page with `set({ off })` toggled (party, 4× CPU): +1.1 ms at tier 2, +0.5–0.7 at
tier 1, +0.15 at tier 0. To get there (the first Part 4 commit measured +2.4–2.9 at tier 2 against the previous commit — the party
night 8.7 and the worst case 8.8, over budget): the mirror's source re-read 10 times a second instead of 30, the glitter's dice
cached; **tier 1 (Part 3's neon)**: the core flutter off, the glass towers' LED facades held still (one cached image; the sweep +
the climbing band at tier 2 only); the quay lamps one sprite. The water's look is unchanged. Memory: the water's canvases ~2.4 MB
at 390×844 tier 2 (in `harbor().mem`, a layer of its own) — 25.4 MB of 64 in all. (Earlier in the session the machine ran ~3×
slower for everything for an hour — the previous commit measured 18.9 ms at the party peak — so only same-run comparisons count.)

### Known issues (Part 4)
- ~~**THE THIN BLACK BARS** (the owner's iPhone, at night: thin dark lines across the reflections)~~ — fixed in NEON PASS 4. The
  ripple strips sat at fractional rows (0.7–3.4 pt each, only 0.02 pt of overlap) with their own opacity: each strip's edge
  anti-aliased, two half-covered rows over the near-black base = a dark line at every seam (WebKit shows it most; here 3 % darker at
  tier 1). Now `water.js` lays the strips on WHOLE DEVICE ROWS edge to edge (`st.r`, `st.hd`; the water's canvas top = the waterline
  rounded to a device row, blitted 1:1 — never resampled; the wavelets' wrap on a whole column), and a strip's crest / trough is
  box-filtered over the wave phase it spans (`st.ck`: thin far rows no longer flip bright / dark row by row). Same strips, same cost.
  Tested: `harbor().water.grid` + `rows`, and e2e-harbor's NO SEAMS check (meeting rows as bright as any other, tiers 2 + 1). Look
  pixel by pixel: `shots.mjs … --crop water --zoom 3 [--zx 0.75] [--tier 1]`.
- ~~**The worst case at tier 0 is ~0.5 ms over its 4 ms**~~ — see cleanup pass 1's numbers + Known issues below.
- **The copy forces a raster flush mid-frame**: reading the scene's own canvas makes the browser rasterise what is drawn so far
  inside the water's build (~0.7–1.4 ms at 4× in headless Chrome, once every 6 frames now). If a phone shows otherwise, the fallback
  is to compose the copy from the baked layers + the neon instead (the beacons and beams would need their own draw).
- Fast lights reflect at the source's 10 a second (the party chasers, the game-start flash); fine on rippled water. Part 10's
  fireworks in the frame above the waterline would step — use `light()` per frame for the bursts, or raise the source rate then.
- The far half of a light column is a stretched copy, not a true glitter column (a light high on a tower reflects compressed toward
  the quay); it reads right at phone size.
- ~~The wheel's + the lighthouse's reflections come from the baked harbor layer's grey-box art~~ — Part 5.
- The moon's path follows the moon as drawn (its framed place in the sky), not its true elevation (the moon's art + place:
  Part 6).

### Handoff → Part 5 (harbor hero pieces)
Draw each hero piece's reflection with `harbor().water.reflect(ctx => draw(ctx), axisAt(L, z))` every frame (Rosie at z 142, the
taxi z 94, the tug / sailboats z 205–214, the wheel z 132 on its pier, the lighthouse z 150) — then drop the grey-box mirrors in
`scene.js#waterMirrors`. Rosie's bulbs and the wheel's bulbs: draw them in the reflected art (they then ripple with the water);
`light()` only for lights outside the frame above the waterline. Wakes: `water.wake()` stores them — draw them in `water.js`
(after the rows, before the paths: a V of foam dashes in perspective + a darker trough) or in the boats' layer. The ELEVATED TRAIN
on the far waterfront: draw it before the water (with the near group) and its lit windows reflect for free. The lighthouse beam:
a beam drawn before the water reflects; a beam sweeping over the water itself is a `light()` sweep or its own pass. Measure with
`title-perf.mjs --city 2 --scenes np-night,np-party,neon` before and after (`nw-` = without the live water).
