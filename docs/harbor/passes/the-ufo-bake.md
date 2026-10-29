# THE UFO BAKE — the abduction's craft from a real 3D model (Oct 27 2026; plan.md "THE UFO FROM A REAL MODEL"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## THE UFO BAKE — the abduction's craft from a real 3D model (Oct 27 2026; plan.md "THE UFO FROM A REAL MODEL"; behind `?city=2`)

The hand-drawn saucer (11a-2) is replaced by **"UFO" by sebslom** (Sketchfab, CC BY 4.0, ~8k tris, 2K PBR + an emissive map), the owner's
pick ("the model looks gorgeous … replicate the model"). The city is Canvas 2D, so the model is **baked offline into sprites**; three.js
never reaches the site. **Nothing else changed**: the event's timing, the beam, the walker, the lift + the pose (`ufoAt`, `saucerAt`,
`bellyY`, `drawAbductee` untouched — the hull's radius now comes from `sR`, the same `sw / 2`), the spot beside a centrepiece, the
sounds. `&ufo=classic` = the hand-drawn saucer.

### The files
- `art/models/ufo/ufo-01-sebslom.glb` + `credits.txt` — the SOURCE, the unedited original (`.vercelignore`'d: never deployed, never
  fetched by a phone).
- `scripts/bake-ufo.mjs` — the bake (Playwright's Chromium + three.js 0.170 from jsDelivr, loaded by the bake's page only). **BNAME:
  now `scripts/bake-model.mjs ufo` + the recipe `scripts/bake/ufo.mjs`** (#the-bake-tool) — the re-bake is byte-for-byte the same.
- `assets/city/ufo/` — what ships: `body-hi.webp` (200 KB) + `lights-hi.webp` (52 KB), `body-lo.webp` (101 KB) + `lights-lo.webp`
  (23 KB), `ufo.json` (23 KB: the frames' layout + every port per frame) — **398 KB in all**, fetched only when an abduction is due.
- `js/screens/harbor/ufo-model.js` — the loader + the draw helpers (rows by view angle, the frame, body, lights, ports).
- `legends.js#drawUfo` — the hull branch: the model when `ready`, else the hand-drawn saucer.

### How the bake works
- **The model normalised**: its thin axis up, the hull's radius 1, the rim's plane (its widest ring) at y = 0, the dome side up
  (near the axis the dome reaches further than the belly). It has **12 ports + 12 radial seams: a 30° symmetry**, so the 24 turntable
  frames cover one period (1.25° a step — a smooth spin; only the worn texture's specks shift at the wrap, invisible at phone size).
- **The camera's real angles** (legends.js#hoverY against harbor-layout.js's horizon VPY): hovering, the craft sits ~5–7° above eye
  level (`hi`: 6°, the hull 480 px = 3 × its largest width, 160 pt at 430); on the approach + the exit ~15–20° (`lo`: 19°, 240 px — it is
  small there). The camera at 8 hull radii (F ≈ 600 pt for a ~150-pt hull: the city's own mild perspective); rendered 2× and
  downsampled; every frame cropped to the union of its row.
- **BODY — lit as NIGHT, true to the materials**: an equirect night as the environment (a dark sky, the city's violet-grey glow on the
  haze with its neon smears, a WARM lit street below — the underside is what we see — the moon high behind the viewer), plus a moon
  key, the city's pink + cyan rim lights from behind and a warm fill from below. ACES tone mapping.
- **THE GLASS**: the base map is opaque on the hull + the blue sphere; only the two rusty CAPS over the sphere are glass (alpha 0.88).
  The glTF loader draws a BLEND material without depth writes, so the sphere painted OVER the hull's near rim. The bake draws two
  passes: the solid craft with true depth (the caps cut out by alphaTest), then the caps as glass at 0.8 over it.
- **LIGHTS**: the emissive map alone (the model's own GREEN ports + the faint blue ring round the sphere), occluded by the hull, on
  black — drawn `'lighter'`. An AZIMUTH pass (each port's world angle round the rim) + a flood fill find every port per frame: its
  centre, size and angle go into `ufo.json`.

### How the city draws it
- **The view angle** = `atan((VPY − y) / F)` of the craft's centre. Each row is STRETCHED vertically to the true angle (the height on
  screen ≈ 0.46 + 0.89·sin(elev) hull radii, measured on the two bakes; clamped 0.8–1.3) and the hand-off happens at their midpoint
  (12.5°, ±0.3°, ~0.3 s of the approach) where both have the same silhouette. (A plain cross-fade over 9–15° showed the steep view's
  taller hull half-transparent — found with the iPhone safe areas on, which put the approach in that band.)
- **The spin**: 16°/s hovering, up to 60°/s as it lifts him, a dash (70°/s) as it leaves; held still on an `&lgs` preview.
- **The ports**: the model's layer at 55 % (100 % as he's taken), each port its own soft green glow + a hot core lit by THE RING's
  head (the same pace as before: calm 7 rad/s, racing to 37 as he's lifted, all of them flashing as he's taken, slowing as it leaves).
  The earlier ice-white ring is gone (the owner: the model's green).
- **The belly**: the old belly glow, smaller, on the sphere's underside — the emitter the beam comes out of.
- **Lazy**: `legends.js#warm('ufo')` (a minute ahead on a legendary night, at once for a preview) calls `loadUfoModel()`. Until the
  sprites are in, no hull is drawn; after 4 s of loading (a slow network) or a failure the hand-drawn saucer is baked and stands in.
  A normal night fetches none of it (e2e `legends`).

### Re-bake / swap the model
1. Put the new `.glb` + its `credits.txt` in `art/models/<name>/` (never edit the original); point `MODEL` in `scripts/bake/ufo.mjs` at it.
2. `node scripts/bake-model.mjs "<…/ms-playwright/chromium-*/chrome-win64/chrome.exe>" ufo` (~13 s) → `assets/city/ufo/`. `--look <dir>` writes
   the bake into `<dir>` instead, plus a neutral studio render + the night one at both angles and the base map's alpha (which parts are
   glass) — look before you ship.
3. A model with another symmetry: set `PERIOD` (360 / its ports); other view angles or sizes: `BAKE`.
4. The credit: one entry in `js/ui/credits.js#CREDITS` (group `3D MODELS`), word for word from its credits.txt.
5. Look: `node tests/integration/shots.mjs "<browser>" --preview --city 2 --safe --sizes 390x844,402x874,430x932 --scenes
   ufo-approach,ufo-hover,ufo-lift,ufo-leave,ufo-classic,ufo-pumpkin --crop ufo --dsf 3` (`--crop ufo` = the craft at its real size,
   unzoomed); speed: `title-perf.mjs "<browser>" --city 2 --scenes ufo-classic --vs sp6-ufo --cpu 4 --gpu`.

### Decisions made (unattended)
1. **WebP only, no PNG fallback**: the Harbor's floor is iOS 16 (WebP since iOS 14); a failed load falls back to the hand-drawn saucer.
2. **Two view-angle rows** (6° + 19°), not one: the approach + the exit are seen from noticeably further below; the steep row at half
   the pixels (the craft is small there). Stretched between them rather than more rows (bytes).
3. **24 frames over the 30° symmetry period**, not over 360° (15° steps would hop visibly at a slow spin).
4. **The glass caps at 0.8** (the model says 0.88): the blue sphere glows through a little; the physically right depth (the near rim
   in front of the dome) over the loader's no-depth look (the sphere floating over the hull).
5. **The lights in the model's own green**, chased at THE RING's existing pace; no recolour to cyan / magenta (the owner's call).
6. Night lighting tuned by eye against the city: a cooler horizon glow than the first try (it turned the steel lilac), a warm street
   below, a brighter moon + rim.
7. The bake fetches three.js from jsDelivr (pinned 0.170.0) at bake time only — no npm dependency added.
8. The model file keeps its original name (`ufo-01-sebslom.glb`, not plan.md's `ufo-sebslom.glb`): the unedited original.

### Measured
- **Sprites**: 398 KB in all (body-hi 200, lights-hi 52, body-lo 101, lights-lo 23, ufo.json 23), loaded only for an abduction.
- **Speed** (title-perf `--scenes ufo-classic --vs sp6-ufo`, one run, 4× CPU, --gpu, 390×844, 2 + 2 windows): t2 **same** (work
  24.2 → 23.5 ms, noise ±4.5), t0 **same** (15.2 → 16.2 ms, noise ±1.7). The model also skips the hand-drawn saucer's per-pixel bake.
- E2E `legends` 17/17 locally (three new checks: no sprites on a normal night; the model drawn, seen ~5° from below, no hand-drawn
  bake; `&ufo=classic` = the hand-drawn saucer, no sprites fetched). Unit suite 827/827.

### Known issues
- The turntable's wrap (frame 23 → 0) shifts the worn texture's rust specks by 30° — invisible at phone size, visible zoomed in.
- On a very slow network a forced preview shows no craft for up to 4 s, then the hand-drawn saucer.
- **THE FINAL CLOUD RUN (40582957813, the pass's only one)**: `show`, `audio`, `holiday`, `windows`, `street`, `wild` GREEN; `tests`
  (40582958002) green; `city` 92/93 + `panel`'s "the word gone" timeout — SP3's known clock-dependent LOAD WEATHER flake + the panel
  timeout that fails on the baseline too (SP6's known issues); neither touches the UFO. Not re-run (the two-run rule).
