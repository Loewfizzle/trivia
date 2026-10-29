# SP — SKY POLISH (Oct 23 2026; the owner's iPhone review of the Day Look — "the clouds are a 7 out of 10"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## SP — SKY POLISH (Oct 23 2026; the owner's iPhone review of the Day Look — "the clouds are a 7 out of 10"; behind `?city=2`)
The bar: the night + party city are "stunningly beautiful… premium" — the sky must reach it. Three refine passes on
`tests/integration/clouds-preview.html` + the real city at 402×874 (stills, frame bursts, zoomed crops), once at 390 + 430.
**Proved with `pixdiff.mjs`** against af8c06c: `night-nc` + `dusk-nc` identical; `golden-nc` = the sun's disc only (its colour,
below); `party-nc` = a few neon outline segments caught mid-animation (the party show's clock between the two pages — no neon
code touched).

### 1. THE HIGH STREAKS → real CIRRUS (`clouds.js#cirrusGen`, `core/harbor-clouds.js#cloudPlan`)
The owner: they read as hard, straight, parallel speed lines crossing behind SPEAKEASY. Now each cirrus patch is a small GROUP
(2–5) of WISPS, drawn: **FIBRATUS** (a bundle of fine fibres combed along a gently curved Bézier backbone, clumped into 2–5
sub-bundles that wander across it, frayed + fanning at both ends), **UNCINUS** — mares' tails (a hooked head curling up at the
downwind end, the fall streak trailing back + down, spreading + thinning to nothing) and **TUFTS** (short dense brushes). Each fibre
its own length, width (0.45–1.6 device px), brightness and slow wobble; a soft body under them (the backbones wide + faint, drawn
at a sixth of the size and scaled up); the sprite's edges feathered (never a box). Never ruler-straight, never a parallel stack
(a wisp at the same angle right over another moves on), never evenly spaced; the blue shows through. The hooks point downwind
(the real wind's side). **CIRROSTRATUS**: a lot of high cover (`veil` in `cloudMix`: the high layer ≥ ~0.5) adds one wide thin
milky veil behind them. THE LIGHT (`cirrusLight`): the highest cloud — white by day, lit ~3° longer than the street and redder after
sunset, and with a low sun they GLOW (brighter + warmer: the gold / pink wisps over a darker city); at night barely there, a faint
silver when the moon is up. THE PLACE: 1–4 groups high in the sky, **above the tagline's band** (`box.avoid` = SPEAKEASY's top →
the tagline's foot, from `scene.js#tagBand`; behind the NEON letters is allowed), never stacked on each other. At the phone's own
resolution (the fibres are a pixel wide). The previews: **`&wx=cirrus`** (a fair day's cirrus over a few cumulus) and **`&wx=veil`**
(a hazy cirrostratus day / night) — `core/weather.js#forcedWeather` now carries the cover by height for them; THE PREVIEW PANEL's
weather list has HIGH CIRRUS, HAZY VEIL and OVERCAST.

### 2. THE CUMULUS, finished (`clouds.js#heapLobes`, `heapField`, `stratoLobes`; the plan's forms)
- **The base**: slightly flat but soft (a wider soft cut), uneven (a slow wobble + a finer ragged one) and its ENDS ROUNDED — within
  its own thickness of either tip the base curls up on a quarter circle of that thickness (a flat base meeting a sloping top drew a
  pointed "saucer" rim); low in the cloud the shade only where it is thick, so the base is lighter at its edges. No grey slab.
- **No seams**: the self-shadow now marches through its own smooth thickness field (`F.m` — each lobe's (1−e)² profile): the
  silhouette's square-root profile drew a crease down the body wherever one lobe ended inside another (the "bubbles stuck together").
  The domes blend over a slightly wider soft crease; each dome its own size.
- **Shape variety** (`cloudPlan`): most are heaps; some a **TOWER** (narrower + ~1.5× taller — more on a taller day), a few broken,
  ragged **FRACTUS** (scud's builder: no billow-foam, frayed by the noise); the small far ones stay simple puffs.
- **Stratocumulus**: the heaps overlap into one lumpy mass, each with its own small billows, a wide blend — never a string of
  sausages or a smooth lens.

### 3. OVERCAST + grey days
- **A real deck** (`cloudMix`): under a full deck nothing puffy floats in front of it — the cumulus + stratocumulus fade out as the
  deck closes (`shut`), only the SCUD stays (darker than the deck now: low wet fragments in its shade). The deck's own grey texture +
  the sun's brighter patch behind it (`sun.through`) were already right.
- **The light on the city flat + cool-grey** (`tones.js#sunLook` → `ovc`, `blocks.js#faces`): by day under ≥ ~0.8 cover the sun has
  no side (no cast shadows, sun streaks or glints) and the facades converge on a soft cool grey — the materials still read, muted.
- **The owner's pink 1 pm + the "lit" logo** (Claude's notes on her screenshot): in Chrome `&wx=overcast` at 13:00 has a grey sky (the
  harbor greys its own day sky by the cover) and the NEON sign stays the unlit day glass (`is-day`: the pink is the glass's inner
  filament, brighter against grey) — `darkness()` has no cloud term (`DARK_TERMS.cloud = 0`), so cloud can't power the sign. The pink
  sky + separate puffs on her phone match the deck NOT drawing there — see Known issues.

### 4. THE MOON + THE SUN
- **The moon's light** (`moon.js`): the owner — "too concentrated", a big faint ring cut through the tagline. The ring was the 22°
  HALO firing on ANY 18–62 % cover. Now: a WIDE SOFT GLOW with a gaussian fall-off (no edge at any size; wider + a little brighter in
  haze — the aureole) + the tight corona in clear air; **the 22° halo only under a cirrostratus veil** (`moonLook({ veil })` from
  `clouds.veil()`), very faint, a soft band (no stroke), and it fades out while any part of it would cross the tagline's band.
- **The sun's colour by altitude** (`district/sun.js#sunColorHarbor`, the Harbor only): at 9 am (8.7° up) it was a flat orange ball —
  now near-white with its bloom once it is clearly up (the white core from ~4.5°, the bloom from ~3.5°), golden-orange only in the
  last few degrees, red at the horizon. Golden hour's sun (4°) is a touch lighter; the rest of golden hour unchanged (pixdiff).

### 5. BEAMS IN THE CLOUDS (`clouds.js#rayHit`, `beamPatch`; `skybeams.js`, `searchlights.js#drawBeams`)
Light doesn't pass through a cloud as if it weren't there: `rayHit(x, y, ux, uy, len)` finds where a beam goes INTO a cloud (a short
march — ≤ 40 samples — through the baked shapes of the clouds it crosses) and how much gets through (the cloud's thickness along it);
the beam is drawn in pieces — full up to the cloud, then ×(0.1 + 0.9 × what gets through) beyond it, then the next cloud (two at
most). `beamPatch` lights the cloud there in the beam's colour: the underside bright where it goes in (wider than the beam), the
light running along the belly, the glow scattering up through the body — **masked by the cloud's own sprite** (the light lands on
the cloud only, never on the clear sky round it) + a little in the air under the belly. Thin cloud: a weak patch, the beam shows
through. The party's SKY BEAMS (vertical) and the sweeping SEARCHLIGHTS (a moving lit patch across a cloud base) both use it.
DEPTH: only the clouds up over the city (the upper half of the sky, s ≥ 0.42) catch the beams — a cloud just over the crowns is far
beyond the city and the beam passes in front of it. Each patch is rendered once into a small canvas (pooled) and kept while it lands on
the same 2 pt of the same cloud; the beat is only its alpha.

### 6. THE CLOUDY PARTY'S COST (her iPhone: 4.2 % slow, ~3× a clear party)
Found (the clouds' debug: `harbor().clouds` → `ms`, `jobMs`, `relit`, `beamMs`, `hitMs`, `renders`):
1. **Every cloud was re-lit right after it appeared**: its first bake was lit at its starting place, but it had drifted since the
   6-hour block began — 22 re-shades + canvas uploads + crossfades at once. Now the first bake is lit where it is (`plan` → `driftX`).
2. **By moonlight they kept re-lighting** as they drifted (~1–3 a second: a re-shade sliced over frames + a new canvas uploaded + a
   0.9 s crossfade each) — the slow frames on a phone. By moonlight the light barely changes with the place: no drift re-lights (the
   global key still re-lights them all when the light really moves; `cloudLit`'s key is coarser by moonlight too).
3. **The old beam-catch** scanned each cloud's whole pixel column every frame (~0.33 ms a frame here). The new ray march + cached
   patches: ~0.06 ms for the hits + ~0.2 ms for the patches.
Measured in one probe (party 23:00 &wx=clouds, the laptop without a GPU, 1×): re-lights 51 → 0 over the same 8 s, the clouds' draw
0.3 → 0.16 ms. The A/B gate below: the cloudy party within noise of the clear one.
**The readout's "30 fps" by day** with "frame 17 ms": that is the BATTERY SAVER (cleanup pass 1, `scene.js#fastNow`) — when nothing
fast is on screen (a calm day, a quiet night) the city draws every OTHER frame (30 fps; every third under reduced motion) and comes
back to 60 the moment anything fast appears (a plane, birds, the party, rain, a bake, a tap). "frame" is the rAF interval (every
rAF, drawn or not: 16.7 ms on a 60 Hz screen), "fps" the frames actually drawn. The readout's last line says why ('calm').

### 7. CONTRAILS, smooth (`air.js#drawTrail`)
The owner: "too jagged, skippy, jumpy" — they were six batched polyline strokes through samples 0.35 s apart (visible steps where
the batches' widths changed, a head that jumped). Now ONE continuous trail of soft gaussian puffs on the plane's real path (the
engines' place every 0.1 s, interpolated sub-pixel), each puff tied to the moment it was laid (a fixed grid of times — it never crawls
or jumps between frames at 60 or 30 Hz): it only ages — spreading, softening, drifting with the real wind, fading out evenly. As
the trail spreads, every other puff fades out smoothly while its neighbours grow to cover it (~90 sprites a plane at most). The
first half-second: the two thin engine lines from the engines themselves, merging (a steady head). Golden hour + dawn: warm.

### 8. THE BUILDINGS BY DAY — one small step (`blocks.js#faces`, the day channel only)
The sunlit side a touch brighter + warmer, the shade a touch deeper + cooler (side by side with the before: small, safe). Golden
hour, dusk + the night keep theirs (pixdiff).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, a cloudy day `T13:00&wx=clouds`, overcast `T13:00&wx=overcast`, golden hour
`T18:20&wx=clouds`, sunset `T18:45&wx=clouds`, dawn `2026-10-23T07:45`, a cloudy night `2026-10-22T22:00&wx=clouds`, a cloudy party
`2026-10-24T23:00&wx=clouds`, high cirrus `2026-10-22T11:00&wx=cirrus` (+ at sunset `T18:45&wx=cirrus`), the veil + the moon's halo
`2026-10-26T23:30&wx=veil`; **a plane with its contrail**: `2026-10-22T11:00&force=planes` (a plane every ~9 s; give it 10–15 s to
lay a trail). Shots: `shots.mjs --scenes sp-morn,sp-noon,sp-cloudy,sp-overcast,sp-golden,sp-sunset,sp-dawn,sp-night,sp-party,
sp-plane,sp-cirrus,sp-cirrus-set,sp-veil`; the clouds alone: `clouds-preview.html?…&layers=0,0,0.6&kinds=cirrus&band=1`.

### Tests (SP)
`harbor.test.mjs` (+3, 102): cirrus groups (a few, above the tagline's band, never stacked) + the veil + the preview weathers; the
overcast deck (nothing puffy in front of it; `sunLook` flat by day, never at night); the moonlight re-light steps; the halo only under
a veil (+ the aureole's haze); the 9° sun pale. e2e-harbor 112/112; the unit suite 472; the one-game smoke check (shared files:
`core/weather.js`, `district/sun.js`).

### Performance (A/B in one run, `title-perf.mjs --ab` against af8c06c, 402×874, 2× CPU, the laptop without a GPU, A B B A)
| scene · tier 2 | A (before): frame p95 · slow · work mean | B (SP) | verdict |
| --- | --- | --- | --- |
| `np-pclouds` (a cloudy party — new) | 16.8 · 0.7 % · 8.98 ms | 16.8 · 0.3 % · 8.71 ms | same |
| `np-clouds` (a cloudy day) | 17.2 · 0 % · 2.36 ms | 17.3 · 0 % · 2.02 ms | same |
| `np-party` (clear) | 16.8 · 0.3 % · 8.39 ms | 16.8 · 0.3 % · 8.35 ms | same |
The cloudy party is now within the noise of the clear one here (8.71 vs 8.35). The phone decides: `&debug=1` on the cloudy party
vs `&force=no-clouds` — the "after 10 s" line.

### Known issues (SP)
- **WebKit still can't run here.** Her overcast screenshot (separate puffs with gaps under a pink-violet sky, E-O-N looking lit)
  doesn't happen in Chrome (a grey deck, a grey sky, the sign's unlit day glass). The deck is the one big cloud sprite (~260 k px):
  if it fails to draw on her iPhone, the sky under it shows. To check on her phone: `&wx=overcast` at 13:00 with `&debug=1` — if the
  grey deck is missing, `__district.harbor().clouds` (deck, pending, mb) says why. The NEON sign can't be powered by cloud today.
- The cirrus need real high cover to show: the seeded day (no live weather) gives them on ~60 % of days, small; `&wx=cirrus` shows
  them on demand. On a live day they follow Open-Meteo's high layer.
- A faint inner seam can still show on a big heap where two towers meet (the column-depth shading); a strong-contrast close look
  only.
- The beam patches mostly land on clouds behind the NEON letters on a phone (where the clouds are), so the sign's own glow covers
  much of them; the searchlights + the side beams show them best.
- The altocumulus layer (a mid-cover day) is still a noise field and reads a little blotchy up close — the owner hasn't flagged it;
  6b / 9 can rebuild it on the heap engine like the stratocumulus.

### Handoff → Part 6b (the special-occasion sky)
The sky's pieces are in place: cirrus groups (`cirrusGen`, reusable for a holiday's tinted high cloud), the moon's soft glow + the
gated 22° halo (`moon.js#skyIs` gets the tagline's band + the veil each frame — 6b's sign raise + arch re-fit should re-check the
halo's clear-of-the-words fade), beams that meet clouds (`clouds.rayHit` / `beamPatch` — any new beam: the tribute lights, a holiday's
beams, the barnstormer's landing lights can use them), smooth contrails (6b's "fluffy contrails like City 1" is done — a skywriter
can reuse the time-grid puff trail in `air.js#drawTrail`). Sky messages still draw between `clouds.draw(…, 'back')` and `'front'`.
