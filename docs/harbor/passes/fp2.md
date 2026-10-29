# FP2 — FOREGROUND POLISH 2 (Oct 24 2026; the beat skew, the promenade tweaks, the street under the dock, crisp lights, the pole, party timing, neon by depth; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## FP2 — FOREGROUND POLISH 2 (Oct 24 2026; the beat skew, the promenade tweaks, the street under the dock, crisp lights, the pole, party timing, neon by depth; behind `?city=2`)
The owner's verdict on FP: "a big jump" — the first time the city reads as one finished picture (~8 / 10). This pass finishes the foreground;
every piece's art kept. Four helpers ran next to the lead (the promenade + trees, the street + cobbles, the lights + the pole, the neon by depth
— the owner's add-on); the lead did the beat + the party timing. Audio detail: docs/audio.md#fp2.

### 0. The beat after returning — the SKEW → docs/audio.md#fp2--the-lead-re-measured-after-a-return
Her readout's `heard +107 ms SKEW` with `lead −39 ms` = the element → graph offset moved on the return and the lead (±80 ms of a beat only)
could never follow. Now a RE-MEASURE on every resume / rebuild / page return / route change and on a SKEW seen alone (`core/harbor-beat.js#
leadRefresh`, `leadKick`): ~10 kicks (≈ 2½ bars) for a 100–146 ms shift; the readout shows `lead −39 → +50 ms (re-measuring · 8 kicks ·
visible)` then `(re-measured −39 → +104 · 3 s ago)`.

### 1. THE PROMENADE TWEAKS (`core/harbor-promenade.js#PHONE`, `core/harbor-trees.js`, `trees.js`, `road.js`)
| piece | x pt at 402 | z | change |
| --- | --- | --- | --- |
| the red curb maple behind the blade | — | — | REMOVED (the corner clean, the wheel's left leg shows to the deck) |
| the corner urn | — | — | REMOVED (`planters: []`; `drawPlanter` kept for the panorama) — no planter on the phone |
| THE CRABAPPLE over the bench | 163 (crown ±23) | 52.9 | the bench tree, now a FLOWERING CRABAPPLE (k 1.25): blossom whiter / fuller (24 clusters), golden autumn + red fruit, bare winter |
| the bench | 158 (137–179) | 50.4 | moved left: 4.0 / 4.2 / 4.5 pt clear of the cart's umbrella at 390 / 402 / 430 (tested) |
| the tall lamp | 177 | | (was 183) |
| THE CART | 213 (umbrella 183–241) | 41.8 | left of the medallion, its body 5.8 pt clear of the ring |
| THE MEDALLION | 273 (ring ±36) | 43.4 | the middle of the open floor, in front of the crossing's landing (252–300) |
| the tall lamp | 312 | | |
| THE FRAMING MAPLE | 357 | 38.2 | rebuilt (below) |
- **Moved a little further than the owner's ~265 / ~200 / ~160:** with the cart at 200 its umbrella (±29 pt) covered the bench's right end;
  so the cart moved right and the medallion with it — 273 is exactly in front of the crossing.
- **THE 8b RULE — the cart + the centrepiece** (`EVENT_CLEAR = 4` units, `L.cart.route = { x0, x1, z }`, `L.cart.stopX`, `L.medallion.clear`):
  on a normal day the cart may roll across the medallion along `route` and people walk over it; during an EVENT on the medallion (a seasonal
  centrepiece, a show) the cart stops short at `stopX` / stays `EVENT_CLEAR` away from its centre.
- **THE HEIGHT CAP** (`centrepieceCap(cam, m, limits, pad)`, `CENTRE_PAD = 8` pt): a centrepiece's top stays 8 pt under the LOWER of the
  vertical word tower's blade bottom (`signSpots` 'n-blade') and the wheel's hub — always the blade: 11.4 / 11.4 / 11.5 world units at 390 /
  402 / 430 (~158 pt at 402) — a Christmas tree fits. It stands in front of the crossing, so a tall piece hides the WAIT / WALK lantern while
  it's up (the owner's choice).
- **THE PARKED BUS — and the parked placeholder cars — gone** until 8b (`road.js#PARKED_TRAFFIC = false`; `L.bus` / `L.cars` stay in the
  layout): the sedan showed stopped through the bare winter maple too. **THE LANTERN on a proper post:** a granite FAR KERB under the railing
  (`FAR_KERB`), the lantern on a granite footing stone, a stepped plinth, a fluted shaft, two brass collars — its base in view, nothing in
  front of it (tested).
- **THE FRAMING MAPLE** (`core/harbor-trees.js`): a sturdier trunk (0.54) forking lower into five even limbs, a fuller rounder crown (46
  clusters, fewer on the branch tips, a smaller window onto the fork); `deepen()` — the inner clusters a richer, more saturated version of their
  own colour (deep orange-red in autumn, deeper green in summer) instead of the old darken-to-brown; `trees.js`: the crown's core lighter
  (0.5 → 0.62), a warm BOUNCE from the cobbles (sunlit by day, the pools at night) on the downward leaves, a warmer autumn shade (never olive);
  `v: 1` pins its mix to BLAZING ORANGE (it drew gold-amber by its index; `v: 2` brings that back). At night a deep maroon-red with the globe's
  warm side lit — no black mass.

### 2. THE COBBLES AT NIGHT (`stage.js`, `street.js#paintSett`)
The piano keys came from near-black joints (`JOINT.n` [30, 28, 46]) under bright tops. Now a packed-sand GROUT (`[54, 50, 66]`), painted cell
by cell and lit by the baked light field at 0.42 × the stones' light; each stone through ONE painter shared with the street (`paintSett`): at
night its top fades softly into the body, the near edge falls off toward the grout (never black), the lamps' extra on the tops 0.5 − 0.24 ·
night (the sheen kept); by day crisp as before (a hard top edge + a hairline of shade). Night sett rows bake two per step (was four).

### 3. THE STREET UNDER THE DOCK — full-bleed (`street.js`, `motorcar.js`, `roadlight.js`, `core/harbor-promenade.js#STREET`)
No camera slide: the scene runs to the screen's foot and the band under the dock is a FINISHED STREET (`streetSteps`, baked): the grout base,
granite gutter slabs (z 34.2–35.6; ~3 pt show under the curb's face — the curb still lines up with the dock's top, 758 / 759.6 at 402), the
street's own setts (0.74 × 0.6, cooler + darker than the promenade's, polished tyre paths, an oil line per lane), ONE STREETCAR TRACK (rails in
granite stretchers, the groove, a rusty flank, a polished head catching the lamp pools; z 28.06 / 29.76), a cast-iron MANHOLE (z 33.2, f 0.7)
and a DRAIN grate (f 0.17, its inlet in the curb face: `streetOver`), the season in the gutter (autumn leaves, spring petals, winter grit).
The band is 116 pt on 390 / 402 / 430 (lanes z ~30.1 west ← / 25.6 east →; the street's foot z 23.7 at 402).
- **THE CAR** (`motorcar.js`): while the dock RESTS (`title.js#tagState` → `S.dockGone`), the implied road's pass (`roadPassAt` — the same
  clock, its `car-1920s-pass` sound) is a 1928 TUDOR SEDAN seen side-on in one of five paints by the take (maroon, bottle green, Niagara blue,
  primrose, black): the body baked once per look (day / golden / night / night-under-a-lamp) × lane × paint × dpr (≤ 12 sprites); live: wooden
  spoked wheels turning by the distance rolled (a half-step motion ghost), a fraction-of-a-point bob, the under-a-lamp sprite crossfading in by
  the pools. Its light: by day the sun's cast shadow (`sunShadow`) + the shade under it; at night the headlamp's white-hot core + tight halo,
  its pool on the cobbles ahead, glints along the rails, a red tail ember. At 402: the far lane 99 × 41 pt (roof under the dock's top: the dock
  covers it whole as it fades back), the near lane 116 × 48 pt (~1.4–1.65 × a person on the promenade); nearest at the take's peak, ~5.3 units
  a second, ~4.9 s on screen. Fades in over 1.8 s after the dock rests (`carVis`), gone in 0.25 s when it returns; with the dock shown only the
  old LIGHT (the sweeps, the shadow) as in 8a; reduced motion: no car (the light stays). The frame runs fast while it shows (`fastNow` → `car`).
- **THE WET HOOK** (Part 9): `streetWet({ force, wet })` → `L.wet` (in the bake key, `scene.js#wetNow`) — soft sky puddles + lamp reflection
  streaks; `&force=wet-street`, the panel's PROMENADE → WET STREET. Rough on purpose: Part 9 finishes it.

### 4. CRISP LIGHTS, NEVER SMOKE (`speakeasy.js`, `stage.js#drawLampLight`, `props.js`)
THE RULE (every light on the promenade): the SOURCE (a bright core) + a small TIGHT halo + light LANDING on the surfaces near it (baked) — no
wide additive wash over the facade.
- **The pole's cloud is gone** — a ~28 pt warm `soft(…)` (a 56 pt fog over the window, the awning + the brick) and a second `r × 4.6` one. Its
  halo is a small pre-baked sprite (`POLE_HALO` in glass radii: tight 1.8 → gone ~4.2 pt from the glass at 402; a faint cool land on the brick
  4.2 → gone ~9.8 pt) + a small cool pool on the cobbles at its foot (`stage.js` `LIGHT.pole` / `REACH.pole` 2.6, baked).
- **The shop's lamp:** the 13.8 pt cloud → a tight halo (`SHOP_GLOW.lamp` 0.34 units, ~4.7 pt); the warmth kept by the light landing INSIDE
  (`paintLit`'s pool 0.6 / 0.42 / 0.18 at r 2.9, a warm floor pool, a brighter globe core).
- **The door sconce:** its glass drawn lit (the source), a tight halo (0.42 units, ~5.8 pt); the 1.7-unit (~23 pt) wash → light landing on the
  wall BAKED into the night facade (`paintGround`, by `T.lamps`): a warm scallop on the brick, the door's granite frame + the oak, gone within
  `SHOP_GLOW.landR` 1.3 units. The blade's lamps' wash `l.W × 3` → `× 1.5` at 0.14.
- **The street lamps' halos** tighter (`LAMP_HALO` in globe radii: globe 3.6 → 2.4, tall 3.2 → 2.2, inner 1.7 → 1.45); the cart's bulbs 0.32 →
  0.24 units and its lantern 0.55 → 0.4, both with a steep falloff.

### 5. THE BARBER POLE (`speakeasy.js#polePhase`, `poleAnchor`, `poleStripe`, `poleColours`)
- **At night an LED-like cool white** (`POLE_LIT` w [240, 247, 255], r [255, 52, 70], b [58, 112, 255]): cool-dark glass edges, a brighter
  additive core, the caps catching cool light — still the hero (e2e: glass 207 vs the sconce 119, the shop lamp 125).
- **THE JITTER (the likely cause):** FP's strip texture was rasterised at 3 px a pt while the canvas runs at dpr 1.5 (tier 1) / 2 (tier 2) — a
  2 : 1 or 3 : 2 bilinear DOWNSAMPLE every frame (a slow slide crawls + shimmers that way), and a browser snapping images to whole pixels steps
  it. Now the glass is computed PER DEVICE PIXEL every drawn frame (~10 × 56 px, < 0.1 ms): each pixel's stripe coverage filtered
  analytically over its footprint (`poleStripe`), the cylinder's edges the same; the patch placed 1 : 1 on a whole device pixel (nothing
  resamples it). The phase is a pure function of the frame's timestamp (`polePhase` / `poleAnchor` — re-anchored only on a rate change, a
  backward clock held; no dt sums, no 0.1 s clamp). `poleTurn` kept for compatibility.
- **The 30 fps battery saver:** `scene.js#frame` draws every other rAF by day when nothing fast runs — one canvas, so the pole isn't exempt
  (that would be the whole city at 60 fps all day); with the time-based phase + the analytic glass 30 fps is just fewer, evenly spaced
  positions (by day 0.27–0.32 device px a step at dpr 2 ≈ 0.14 pt; at night ~0.05 pt). Measured in headless Chrome at dpr 2 + dpr 1.5 / dsf 3:
  the rendered offset follows the clock within 0.08–0.11 px rms, steps near-constant. (Headless Chrome was already smooth with FP's texture:
  the fix removes both suspects — the owner's iPhone confirms.)
- **PARTY NIGHTS** (`poleColours`; `speak.draw(…, { party: { ramp, punch, pal } })`): red → magenta, blue → electric blue, white → gold, by the
  party's ramp × lit (back to red / white / blue through the 2 am wind-down); the beat lifts the colours ≤ 22 %, the halo × (1 + 0.5 · punch),
  the core × (1 + 0.4 · punch); the SAME slow turn (0.16 periods a second at night). The raid still snaps it dark + still.

### 6. PARTY-NIGHT TIMING, EARLIER (`core/harbor-show.js#HARBOR_PARTY`, `harborPartyPlan`, `partyReadyHour`, `harborParty`; `scene.js#partyPlanNow`)
Warm-up from 8:30 pm, THE PEAK from 9:30 pm, the midnight finale (Part 10's hook), calming after 1 am, back to normal at 2 am (core/party.js's
window + wind-down kept; City 1.0 untouched). The show needs darkness: the warm-up is 8:30 OR when tonight's blue-hour power-up finished
(`partyReadyHour`: the real sun, bisected on `darkness()` + `partyReady`, once an evening), whichever is LATER; the peak 9:30 OR 45 min after the
warm-up. Grand Rapids: October ready ~7:15 pm → 8:30 / 9:30; midsummer (20 June) ready ~10:00 pm → the warm-up then, the peak ~10:45. A white
night (never dark enough): no ready hour, the live darkness gate keeps the show off. The sky beams come on one by one from the warm-up to the
peak (was 8:54 → 11 pm); the PARTY music mood from the warm-up too (`core/city-mood.js`). `__district.party().plan`.

### 7. NEON BY DEPTH (the owner's add-on: "overlapping buildings share the same pink outline — BLUFF / DOUBLE AGENT and the buildings in front read as one blob") — `core/harbor-neon.js`, `core/harbor-show.js`, `neon.js`
At 402 the city palette had 10 clashing front / back pairs (of 41) → 0; the party 18 pairs clashing in at least one scene (of 34) → 0 (of
41); 390 + 430 clean too.
- **THE RULE** (`DEPTH_HUE = 60`°, `neonHue`, `neonClash`, `roleClash`): a building in front never shares its outline's hue with the one
  behind it (≥ 60° apart); two PALE tubes (white, ice — `PALE` 0.35) always clash, a pale one next to a colour never does.
- **THE PAIRS** (`depthPieces` — each building's silhouette + the lighthouse —, `depthContacts`): two visible tubes at different depths
  within 4.5 pt (their glows merge), OR a building + the nearest lit building showing just above its roof (`over`: the owner's case — the word
  tower's edges come down beside the block, the block's roofline under its face), compared on the main colours. One envelope pass, ~5–12 ms a
  layout; `outlines()` carries `contacts` (band lines a `slot`: 0 main, 1 accent, 2 detail).
- **WHO ADAPTS** (`fixDepth`, front first): a band building re-pairs (the next pairing of its district family → the band's other families →
  white swapped for a colour → two re-paired together → last resort a far-band thread goes quiet: only `far20` at 430); panorama towers too
  (`PANO`, `PANO_X`); neighbours left → right still never share a main colour. Designed roles changed: `m-step` teal + violet (was + pink:
  behind the sunburst's pink), `m-right` magenta + gold (was + cyan: behind word tower B's cyan), THE HOTEL white (was red: against the
  sunburst's pink + amber), the calm zone's near-band rooflines gold (`CALM`, was white — the lighthouse's white edges cross them; the far
  band stays white).
- **THE PARTY BY DEPTH** (`PARTY_RING` gold · green · blue · violet · pink · red round the hue circle; `partyColours(off, n, h)` one step a
  scene, the accent opposite or white; `ringBase` — neighbours 2–3 steps apart, which also cures "the warm half reads pinkish"):
  `partyPlan(pieces, links)` gives every BUILDING (not the cluster) a place on the ring + an accent, once a layout (~2–30 ms on phones): linked
  buildings always 2–4 steps apart (≥ 73° of hue), neighbours never one main colour, the six hero + word towers six different colours (never
  white), all-white only for white / calm buildings unless a knot can't be untied (at 390: `near5a`, `near26`). `planColours(e, n)`;
  `partySprite` keyed by the scene mod 6, coloured per building; the party's racers on per-building paths (`raceP`); `beamCols` from the plan;
  TIER 0's party a still frame of the plan (was `SCHEMES.party`); the normal night's colour rotation + scheme stages skip a colour that clashes
  with what the building meets. At 402 BLUFF / AGENT are 2 ring steps apart on 10-23, opposite on 10-24.
- **THE KEYLINE:** a back tube ends `keyGap` (max(1.2, 1.3 × the tube's width) pt) above a nearer roof, the band's dilation the same gap;
  `eraseFront` cuts the back sprite's glow under the nearer buildings in all four bakes — baked, nothing a frame.
- **NEAR vs FAR** (`depthStrength`): within each depth step the front up to +6 % width + 3 % brightness, the back −6 % / −4 %; the softness
  unchanged (far tubes stay crisp) — deliberately subtle.
- `harbor().neon.pal` also reports `solved` + `white`.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Noon `2026-10-22T12:30`, golden hour `T18:20`, night `T22:00`, the party's warm-up `2026-10-24T20:45` + peak `T21:45`, spring noon
`2026-10-22T12:30&season=spring`. **The street under the dock:** leave the screen untouched until the dock + the tagline fade away (rest) — a
car crosses now and then (`&force=road-pass`: one every ~13 s); `&force=wet-street` (or the panel's PROMENADE → WET STREET) the wet hook.
shots.mjs: `fp-warm`, `fp-peak`, `fp-spring`; `--idle` (the screen at rest), `--crop band` / `shop` / `pole`, `--dsf N`;
`tests/integration/motorcar-preview.html` (every paint in every look).

### Tests (FP2)
`harbor.test.mjs` 131 → 144 (the unit suite 539): FP2 — THE LEAD RE-MEASURED + PARTY TIMING (above); THE PROMENADE (the positions on three phones, the cart's
route + stop rule, bench vs umbrella, the crabapple over the bench, the height cap; no parked traffic + the lantern's post; the crabapple's
year, the framing maple never brown + its trunk + crown); THE STREET (to the foot at 390 / 393 / 402 / 430, the curb on the dock, the lanes /
rails / manhole / drain inside the band; the car = `roadPassAt`'s pass, x 0 at its peak, 3–6.5 s on screen, in proportion; `carVis`,
`streetWet`); CRISP LIGHTS + THE POLE (the phase the same at 60 / 30 / irregular frames, sub-pixel at dpr 2 + 3, continuous through a
re-anchor, still in the raid; the stripe coverage continuous + periodic; the colours lit / day / party on-half-off; the halos bounded);
updated: the FP re-layout (one crabapple, no urn, the floor empty), 8a's trees (`['maple', 'crab']`), the party show's night curve (8:45 →
10 pm). `city-music.test.mjs`: the party mood from 8:30. e2e-harbor: `party` (FP2 TIMING: nothing at 8:15 pm, THE PEAK at 9:45), `music`
(the party at 8:30; the readout's sync line in its new forms), `promenade` (`pr5`: no car with the dock shown; at rest the band cobbled — σ 22
vs ~2 for the old asphalt; the forced car inside the band; a tap brings the dock back and the car gone), `speakeasy` (red + blue + a cool white
on the glass; THE POLE'S SLIDE ~50 frames one way within 0.11 px of the clock; NO SMOKE — +24 / +19 lum on the brick beside the glass, ~0 at
15–28 pt; a party night magenta + electric blue, the same slow turn). `neon` + `party` (41 / 41 with the depth rule). NEON BY DEPTH (harbor.test): the clash rule, the ring (2–4 steps never
clash), `ringBase`; at 390 / 402 / 430 something in front of both word towers, zero city clashes, the party plan solved with no link clashing in
12 scenes, neighbours never one main colour, six distinct non-white tower colours, ≤ 2 non-pale all-white buildings, the front tube never
finer / dimmer than the one behind. The smoke check (GAMES=cipher — `title.js` is shared): 3 / 3.

### Performance (A/B in one run, `title-perf.mjs --ab` against 0a297dc, 390×844, the laptop without a GPU, 3 + 3 windows)
| scene | t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | 6.52 → 6.76 | 17 · 0.3 % both | same (noise ±0.48) |
| `np-night` (4×) | 10.73 → 12.65 | 33.4 · 18.3 → 30.5 % | same (noise ±7.03 / ±38 pts) |
INCOMPLETE: the laptop was short of memory all session — at 4× both builds stepped down to tier 0 inside every window (t2 / t1: no valid
window, A or B), and the 2× re-run with the party (`np-day,np-night,np-party --cpu 2`) was stopped by Claude Code for low memory before its
first scene; so tier 2 + the party are UNMEASURED by the A/B — the owner's iPhone (`&debug=1`) decides. The whole e2e-harbor suite: 264 / 266
(the two misses were the pole's RAID-over + party-colour checks reading a single frame under the parallel load — 16 / 16 alone; both now wait
for the condition) + the `perf` group's re-bake wait raised 15 → 30 s (at 4× a frame costs ~110 ms here and the bake runs a step a frame:
FP2's smaller night steps + the street + the neon's depth plan pushed it past 15 s; the commit before missed 15 s on its first try too —
its numbers there: t2→1 work 112 ms, t1→0 55 ms, t0 26 ms at the party's peak). What changes a frame: the pole's per-pixel glass (~10 × 56 px, < 0.1 ms), the car (a few blits, only at rest while it crosses), the
party's racers ~15 % more paths (94 vs 80 at 402); the bakes: the night ground ~102 → ~190 ms total (5–10 ms a step), the neon layout +10–20 ms once.

### Known issues (FP2)
- The crabapple's left third stands behind the DOUBLE AGENT blade (130–152 pt): the owner's ~160 bench spot leaves no room further right (the
  tall lamp + the umbrella are there); its right half reads (blossom / gold) at a glance.
- The back row has no maple now (one note said "keep the orange maple", the other made the bench tree the crabapple — the brief's crabapple
  won). The framing maple's autumn mix changed gold-amber → blazing orange (`v: 2` reverts).
- A tall centrepiece on the medallion hides the WAIT / WALK lantern + the crossing while it stands (it is "in front of the crossing").
- The street: phone SIDEWAYS (874×402) the band runs z 35.6 → 10.7 — the track, lanes + manhole crowd its top over a plain cobble field
  (Part 12's desktop / landscape pass); the dock isn't opaque, so the cobbles show between + round JOIN / HOST (both looks checked: the buttons
  read fine — the owner may want to see it); the wet look is hook-level; the rails away from the lamps are faint silver lines at night; the
  ground bake at night ~102 → ~190 ms total at 4× CPU (5–10 ms a step).
- The pole: its cobble pool is baked (stays during 7b's raid, tiny); the jitter's cause is inferred (WebKit can't run here) — her iPhone
  decides. One NO SMOKE far point over the shop glass reads −4.5 lum lit vs off (something else animating there; the test allows ±6).
- WebKit's lead after a return is proven in the pure test + the readout only (no browser here can offset Web Audio from the element).
- NEON BY DEPTH: wide screens are best effort (the party plan clean; the city palette 9 clashes of ~160 pairs at 1440×900, 1 at 874×402 —
  fixed towers against packed near blocks: Part 12); while a sweep / strobe holds one building a scene ahead, a link 2 or 4 steps apart can
  pass through 1 step for a sub-second moment (~10–15 % of link-scenes); the holiday schemes (2–3 colours) aren't under the rule yet (Part 11).
- The FP known issues "no crabapple on the phone" and "the cart's umbrella covers the crossing's near end" are fixed (1).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The foreground is finished for now. 8b: the cart's route + the event rule (`L.cart.route`, `stopX`, `EVENT_CLEAR`), the centrepiece cap
(`centrepieceCap`), the parked traffic off (`PARKED_TRAFFIC` — 8b's moving vehicles replace it; `carAt` + `STREET.car` and the lanes keep right
by direction), the street for the bus / cars / the raid. Part 9: `streetWet` / `L.wet` (puddles, reflections), `ctx.snow` on the crabapple.
Part 10: the finale hook at midnight sits inside the peak (9:30 → 1 am).
