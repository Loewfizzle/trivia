# DT2 — THE DAY LOOK (Oct 23 2026; Day touch-up part 2 — real clouds, sunlit 3D buildings, windows; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## DT2 — THE DAY LOOK (Oct 23 2026; Day touch-up part 2 — real clouds, sunlit 3D buildings, windows; behind `?city=2`)
The owner's iPhone review of the Day Pass: the buildings read solid but "we're going to need more polish passes", and THE CLOUDS
NEEDED A LOT OF WORK (cartoon bubbles in rows with flat bottoms). The bar: the day as premium as the night, reviewed DAY next to
NIGHT at 402×874. **Proved with `pixdiff.mjs`** against the commit before: the night, the party, the blue hour and golden hour are
unchanged except where the clouds are (`night-nc`, `party-nc`, `dusk-nc`, `golden-nc` — the same looks with `&force=no-clouds`:
0–1 px beyond the noise; the blue hour's ~300 px are its power-up's randomly timed sputters, the A-A noise of a moving frame).
Run overnight, unattended — the decisions made on the way are listed at the end of this section.

### 1. THE CLOUDS — a full rework (`core/harbor-clouds.js` PURE + tested; `screens/harbor/clouds.js` bakes + draws)
- **THE KINDS FROM THE REAL WEATHER** (`cloudMix`): fair-weather CUMULUS (humilis → mediocris → congestus by the cover + the
  day's seed), STRATOCUMULUS patches on a greyer day, ALTOCUMULUS (a mid layer of small cells), high CIRRUS, the OVERCAST deck,
  SCUD (low dark fragments under it); several mix. **`/api/sky` now asks Open-Meteo for the cover by height** (`cloud_cover_low /
  _mid / _high` → `weather.js#layersOf` → `LK.cloudLayers { lo, mid, hi }`): with it the kinds follow the real sky (high cover =
  cirrus, mid = altocumulus, low = cumulus → patches → the deck); without it (the seeded day, `&wx=` previews) they come from the
  total cover. Rain / snow / a storm: always a deck.
- **PERSPECTIVE, NEVER ROWS** (`cloudPlan`): the clouds stand on a cloud field seen from below — the near (high) ones big, toward
  the horizon smaller, flatter + closer together, fading into the haze; in CLUSTERS whose centres spread through the depth (one
  near, one in the middle, one far …), most clouds near a centre, some alone; a far one often has a half-merged neighbour.
  **The row rule**: a cloud is moved elsewhere when two others of about its size already sit at about its height (anywhere across).
  Sizes lognormal (a few big, many small), never a sliver (≥ 30 × 10 pt). Deterministic per 6-hour block + cover (every phone the
  same sky; the drift runs on the city's clock, so a reload keeps the same clouds where they were).
- **REAL VOLUMES, SHADED PER PIXEL** (no outlines, no flat discs): a CUMULUS is a smooth union of 3D lobes — a broad flat-ish body,
  one to four domes at different heights, BILLOWS over each dome's whole upper silhouette (two sizes: billows on billows) and a few
  large shallow swells on its face — blended by a soft-max of their surfaces (soft creases, never seams), its edges made irregular
  by noise, its base flat but uneven (a slow wobble, a soft cut). STRATOCUMULUS: merged flat heaps on the same engine. ALTOCUMULUS
  + the OVERCAST DECK: noise fields laid out in true perspective (a cell overhead about as tall as wide, flattening toward the
  horizon; the deck a seamless tile sampled on a cylinder, darker overhead, lighter toward the horizon, broad rolls). CIRRUS: drawn
  filaments (bundles of combed strands along the wind, tapering, some hooking down — mares' tails).
- **THE LIGHT** (`skyLight` for the hour, `cloudLit` per cloud from where it is): the key light is the sun (the moon at night, when
  it's up) — its colour by elevation (white at midday → gold → orange low → coral + pink just after sunset → a dusky mauve; the
  clouds keep it ~1.6° longer than the street: they're high), its direction from the real elevation (from above by day, sideways
  low, FROM BELOW after sunset) and the sun's side of the screen; **backlit** clouds near the sun get a bright rim on their thin
  edges. **THE SELF-SHADOW**: each pixel marches toward the light through the cloud's own thickness — the far side + the bellies
  fall into a soft blue-grey, billows shade the ones behind them, and after sunset the bellies glow while the tops go lavender.
  The ambient: the sky above (the tops) + the light from below (the bellies) per look (day / gold / blue hour / night). A
  hue-keeping highlight knee (a sunset's orange stays orange, midday's white stays white). Far clouds dissolve into the horizon's
  colour. NIGHT: faint dark silhouettes, the city's violet glow under them (stronger low over the city); a PARTY night: the party
  palette's colours under them, and **the sky beams catch them** (`skybeams.js#onBeam` → `clouds.catchBeam`: a bright patch where
  a beam enters a cloud's belly, a softer glow up through it, in the beam's colour). The moon lights their edges when near.
- **DEPTH** (the rules): after the sun, the moon + the stars, before the skyline (behind every building), under the page (the NEON
  sign + the tagline draw over them; DT1's dark halo keeps SPEAKEASY readable — checked with a cloud right behind it), never over
  the dock. The sun glows through a thin edge (`coverAt` now reads the baked shape itself: `sun.through`).
- **THE COST** (the party's cost from review-2 in mind): each cloud's SHAPE (the lobes, the noise — the heavy part) is computed ONCE
  per plan into small typed arrays (normals + thickness + depth + texture: 6 bytes a pixel, at the phone's own resolution ≤ 2 px/pt);
  a LIGHT change only re-shades from them. Both run as time-sliced jobs (≤ 1.2 ms a frame once the sky shows; ≤ 10 ms a frame
  before the first clouds appear, inside the load's grace), a re-lit cloud crossfades in over 0.9 s; a drifting cloud re-lights
  only when its light moves a step (an eighth of the way round the sun). A frame: one `drawImage` a cloud. No per-frame bake, no
  pixel readback (`putImageData` into a fresh sprite). Memory: ~0.4 MB on a fair day, ~4.9 MB on a cloudy one at 402×874.
- **HOOKS**: Part 9 — `KINDS` (the shape builders: add `nimbus` (a heap with a dark flat base), `fog` …), `cloudMix`'s recipe
  (more deck / scud), `harbor().clouds.set({ grey, dark, base })` (greys + darkens the light, lowers the base — re-lit at once).
  Part 6b — the sky messages draw after the clouds (skywriting drifts through the same sky); `cloudLit` for any cloud lit by a
  special sky (an eclipse dims `sunK`). The preview: **`tests/integration/clouds-preview.html`** (every kind in every light, no
  Firebase: `?looks=noon,golden,sunset,dusk,night,party,overcast&cover=0.55&z=2`; `shots.mjs --page` shoots it).

### 2. THE BUILDINGS BY DAY — stronger 3D (`blocks.js`, the day channel only: golden hour, dusk + the night keep theirs)
- The sun's side warmer + brighter, the SHADE a clearly cooler, deeper blue-violet (`faces`: SKY_SHADE, −22 %); the side the
  camera sees decides more firmly by day (a noon sun still lights one side, shades the other); the fronts a touch darker under a
  low sun (the sunlit side faces are the brightest planes); the front's turn from its sunny edge to its shaded one stronger.
- Crisp edges: a brighter arris where the front meets the lit side, a fine cool line where it meets the side in shade; cornices +
  setback ledges catch a brighter top line; a setback tier throws a deeper, longer shadow on its ledge, with a cool wedge on the
  side away from the sun; cast shadows from taller neighbours a touch deeper.
- AERIAL PERSPECTIVE stronger by day (the far ones paler + bluer), the near ones richer (more saturated stone); the DAY SKY's
  horizon a step deeper (`tones.js#SKY_DAY`) so the cream towers stand out against it instead of dissolving into a pale band.
- MATERIALS at phone size: the gold crown richer by day with the sun catching each arch; the glass towers mirror the sky + its
  clouds, broken at each mullion (every glass column a touch offset — a real curtain wall's wobble), the city's darker reflection
  low, a bright sun streak on the sunny edge; the copper domes a richer verdigris.

### 3. WINDOWS BY DAY — not a grid (`blocks.js#dayPanes`, `windowStyle`, `farBands`)
Each building its own window character, by its seed: OFFICE floors (the panes joined into ribbon bands of glass, mullions),
APARTMENTS (framed panes with a transom, curtains in five colours drawn to the sides, blinds half down, a few open), DECO towers
(half of them TALL windows: two floors' panes joined in their recessed strips). Pane by pane the reflection varies (a quarter
catch more sky, a few show the dark room behind), lighter up the facade; the odd sun glint on the sunny half. FAR AWAY by day the
windows merge into soft tone bands (a band per floor) instead of tiny squares. All by the day's share: a window lit at dusk lands
on exactly its pane (`cellRect` unchanged).

### Decisions made overnight (the owner was asleep — each the most reasonable reading; easy to reverse)
1. **`/api/sky` also asks Open-Meteo for the cover by height** (low / mid / high) so the kinds follow the real sky; it only adds
   fields (City 1.0 ignores them). A shared `/api` file: the one-game smoke check passed.
2. **Clouds may pass behind SPEAKEASY + the tagline** (the brief: "never make SPEAKEASY hard to read — the DT1 halo helps"): the
   Day Pass's rule that kept them out of that band is gone; checked with a cloud right behind the word — readable.
3. **The day sky's horizon a step deeper blue** (`tones.js#SKY_DAY`): the cream towers dissolved into the pale band. The water's
   mirror of the day sky deepens with it. Night / dusk / golden hour unchanged.
4. **Golden hour's buildings kept exactly as DT1 left them** (backlit, warm rims, the gold window flashes): this pass's day
   lighting fades out as golden hour begins (pixdiff `golden-nc` = identical).
5. **Cirrus is drawn** (stroked filaments), not shaded per pixel — per-pixel fibres were blurry at phone size; **stratocumulus is
   built on the cumulus engine** (merged flat heaps) — the noise version read as a dappled smear.
6. The layout still re-rolls every 6 hours (the Day Pass's rule) and when the cover moves an eighth; the drift runs on the city's
   clock, so a reload keeps the sky where it was.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, afternoon `T16:00`, golden hour `T18:20`, sunset `T18:45`, dawn `2026-10-23T07:45`, a
cloudy day `2026-10-22T13:00&wx=clouds`, overcast `…T13:00&wx=overcast`, a clear day `…T12:30&wx=clear`, a night `T22:00`, a party
night `2026-10-24T23:00` (+ `&wx=clouds` to see the beams catch them); `&force=no-clouds` = the same moment without them (the cost
comparison on the phone). Shots: `shots.mjs --scenes d-morn,d-noon,d-aft,d-golden,d-clouds,d-overcast,d-night,d-party --crop
skyl3,skym,skyr3`; every kind in every light without the title: `tests/integration/clouds-preview.html`.

### Tests (DT2)
`harbor.test.mjs`: the kinds from the weather (+ the heights), the layout (perspective pooled over 12 skies, near + far in every
sky, never rows, never a sliver, deterministic, the deck, the drift), the light (every hour, the sun's side, backlit, from below
after sunset, haze, the bake's key, Part 9's greys); `e2e-harbor` `sky`: a cloudy day bakes ≥ 8 cumulus + patches in the band
with perspective in ≤ 9 MB, overcast = the deck + scud; `pixdiff` `dusk` + `*-nc`.

### Performance (A/B in one run, `title-perf.mjs --ab` against 6e89475, 402×874, the laptop without a GPU, 3 + 3 windows of 5 s)
| scene · tier | A (before): frame p95 · slow · work mean | B (DT2) | verdict |
| --- | --- | --- | --- |
| `np-clouds` t2 / t1 / t0 (4× CPU) | 17.2 · 0 % · 4.67 / 2.75 / 3.38 ms | 17.2 · 0 % · 3.80 / 3.12 / 3.37 | same ×3 |
| `np-day` t2 / t1 / t0 (4×) | 17.3 · 0 % · 4.17 / 2.71 / 4.22 | 17.2 · 0 % · 3.57 / 3.76 / 2.98 | same ×3 |
| `np-night` t2 / t1 / t0 (4×) | 16.8 · 0 % · 5.97 / 3.42 / 2.25 | 16.8 · 0 % · 4.21 / 3.42 / 3.37 | same ×3 |
| `np-party` t2 / t1 / t0 (2×) | 16.8 · 0 % · 7.59 / 4.59 / 3.08 | 16.8 · 0 % · 7.88 / 4.82 / 3.36 | same ×3 |
The party's t2 / t1 step themselves down at 4× without a GPU on both commits (C1.5's note) — measured at 2×. The clouds' cost
is in their bakes (time-sliced, during the load's grace + a few ms spread over seconds when the light moves), not the frame: a
frame adds one `drawImage` a cloud. The owner's iPhone decides: compare `&debug=1` with and without `&force=no-clouds`.

### Known issues (DT2)
- **WebKit still can't run here** — the owner's iPhone: the clouds' soft edges (crisp on the sunlit side), the load (the first
  bake runs in ≤ 10 ms slices before they fade in), the cloudy day's frame pacing vs `&force=no-clouds`.
- The day is still quieter than the night at a glance — by nature (no neon in the sun); it now has real massing, a deeper sky
  and a real cloudscape, but the near promenade + the speakeasy (Parts 7–8) are where the day's colour will grow next.
- A fair day's clouds are what the seeded weather says (cover 0.06–0.36 without the live weather: a few small cumulus) — golden
  hour + sunset are only as cloudy as the real sky; the previews use `&wx=clouds` to show them lit.
- The moon's silver on cloud edges is subtle at phone size (its light is weak by design: `skyLight` night key ≤ 0.5).
- Far clouds peek between the towers (behind the skyline) — intended; a bright one behind a thin tower can read as a smudge.

### Handoff → SKY POLISH (SP) — done, below; then Part 6b
The clouds are one system for every hour: `core/harbor-clouds.js` (what + where + the light) and `screens/harbor/clouds.js` (the
bake). For 6b: draw sky messages BETWEEN the cloud layers with `clouds.draw(c, fs, sun, 'back')` → the message → `clouds.draw(c,
fs, sun, 'front')` (the scene draws them all at once today); an eclipse dims the clouds through `skyLight` (`sunK`); the barnstormer
+ the special skies can reuse `cloudLit` for anything lit like a cloud. Part 9: storm / rain / snow / fog skies plug into `KINDS`,
`cloudMix`'s recipe and `harbor().clouds.set({ grey, dark, base })`.
