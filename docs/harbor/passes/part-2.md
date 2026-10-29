# Part 2 — THE SKYLINE (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Part 2 — THE SKYLINE (Oct 21 2026)
- [x] 0. The owner's iPhone review first: the hierarchy (two dominant towers + the needle, the middle tier in clusters, the
  bands low; one gold crown; the EMPIRE stepped tower; two glass towers far back); the wheel on its pier over water; the tagline
  fade; one squeeze for every phone; the water strip checked (89–98 pt, as the approved mockup — kept; the owner: "keep the camera").
- [x] Findings 1, 4, 5 (above) fixed and tested.
- [x] The facades (blocks.js), the two skyline groups (skyline.js), the lit windows (lights.js + core/harbor-windows.js), the rays
  (rays.js), the searchlights (searchlights.js), the sun's + the moon's arches (district/sun.js + fx.js: opt-in fields, City 1.0
  unchanged), the tagline fade + slot (title.js / title.css).
- [x] Tests: `tests/harbor.test.mjs` 36 (+ the corridors vs the whole silhouette, the dense base, one skyline on every phone, the
  hierarchy, the wheel, the word faces, stable grids, the light timeline, the font + layout, night-only events);
  `e2e-harbor.mjs` 23 (+ the tagline fading with nothing moving, the words + the searchlights, the wheel + the lit layer).
- [x] Review: day, golden, night, 1:30 am, searchlights, spell=2027 at 390 / 402 / 412 / 430 / 1440 + skyline close-ups; two refine
  passes (the rays: a fan per corridor, contained under the sign; the beams' soft body; the far bands raised for depth; the Deco
  piers + terracotta spandrels, the faces' turn, the ledges, the glints).

### The skyline, as built
- **Day vs night — two cities.** Day: limestone, cream, terracotta, granite, slate; brick only in the near band; the glass towers
  mirror the sky (a sheen, mullions). The towers are Deco: piers rising past recessed terracotta spandrels, the pier's edge toward
  the sun lit and the other in shade, cornices, setback ledges with their shadows, weathering under the sills (near), a mottling,
  brick courses near. The real sun (`tones.js#sunLook`, in the bake key: a few re-bakes a day): we face south, so a morning sun
  lights the faces turned east (the right half's side faces), an afternoon sun the west; each front turns from its sunlit edge to
  shade; a taller neighbour on the sun's side throws a slanted shadow across a front (long when the sun is low). Distant windows
  by day are dark glass with a cool glint — never light. Golden hour: the backlit city (fronts dusky), the faces toward the sun
  glowing, a rim of light on every edge and crown toward it, panes flashing orange; the RAYS. Night: the facades go dark (the far
  ones bluer and softer: the haze by depth), the street's glow at their feet, the crowns floodlit (the sunburst gold, the EMPIRE
  white, the needle cool, the dome warm: cones from the setback with falloff), red beacons blinking on the tallest crowns.
- **The lit windows** (lights.js; the timeline: core/harbor-windows.js): City 1.0's exact rule — each window that can light has
  one uniform order and is lit when order ≤ the palette's `P.win` (NIGHT 1, LATE 0.32, DAWN 0.22, GOLDEN 0.5, DAY 0; sky.js#lateK:
  fewer from ~10 pm, a third from 2 am, party nights lit till 2 am, the few kitchens before dawn, off in the morning; ALWAYS NIGHT
  1), the season's warmth toward amber. Tungsten mostly, ~6 % TV-blue, ~10 % curtained, a rare neon; the glass towers' floors
  cool white, their crowns' thin light lines. Far windows are glitter (a few flare now and then); near ones show a hint of the
  room (the ceiling's light, furniture low, curtains). Every 6–15 s a light somewhere goes off (or one comes on) for a minute or
  three. THE POWER-ON at the title's tap is City 1.0's exactly (`lights.js#drawWave`, while `S.wave` < 1): each lit window comes
  on by itself — bottom first with scatter (delay = (1 − height)·0.82 + rand·0.16), over 0.07 of the wave, flickering as it
  catches — then the baked layer takes over. So it lands early in the wave, the very first bake waits (≤ 300 ms) for the
  title's real text rects and takes a bigger slice of the frame while only the sky draws (the lit layer bakes alongside it).
- **The rays** (rays.js): at golden hour / dawn with the sun low (−1.5..14°) and clear air: from the sun through each corridor
  within reach, a fan between the directions to the slot's top and its floor, broken into shafts, falling off along their
  length; behind the near buildings (after the far layer) and a fainter veil over the city. Contained in the air over the city.
- **The searchlights** (searchlights.js): three on the roofs (the EMPIRE's first setback, the hotel, wordB's top; a panorama two
  more): drum, yoke, fins, lens — dark metal by day. Running: soft beams (a wide body, a core) sweeping slowly and crossing;
  above the city's fog, so a foggy / low-cloud night is the dramatic one (brighter, wider, the cloud base lit where they hit).
- **The arches** (scene.js#archFor → `fs.arch` / `fs.moonArch`; the district never passes them): the sun keeps its real timing,
  path, season and phase; on a phone its arch fits the BASE's roofline (the bands + the quay) — it rises and sets behind the
  city and may pass behind the towers, the wheel, the lighthouse — and its top stays clear under the tagline (summer: tag bottom
  + r + 6) or lower among the crowns (winter: 42 % of the way from the limit to the base's median roofline). A wide screen keeps
  the district's arch over the sign but rises from behind the base and clears the towers by ~10°. The moon: from behind the base
  at its ends (10–90 % across) to under the tagline (a wide screen: over the sign), half the pass, half its real elevation.
- **The tagline** (title.js#armTagline, City 2.0 only): fades out 15 s after the title appears (`&tagms=N`) and stays gone —
  opacity only (its rect, and so the city, never move: tested); `scene.set({ tagGone })` hands its band to `sky-low`;
  `S.tagSlot(text, ms)` brings a line back briefly (the NYE countdown's own dressing is untouched).

### ADDRESSABLE WINDOWS + WORDS IN THE WINDOWS (the API)
- Every band block, tower tier and hero block has `win = { cols, rows, u0, v0, pitch: [pu, pv] }` (world units from the face's
  left edge and its foot) and a `seed` from its id (the band + its index; a tower's id) — never from its size or place: a relayout
  never re-rolls a window. A window = (building id, tier, col, row); `winHash(seed, tier, col, row, channel)` its dice,
  `winTraits()` its character (can it light, its order, its colour class, its brightness), `isLit(traits, share)`.
- `blocks.js#cellRect(cam, box, col, row, deco)` → its pane on screen (the facade's glass and the lit layer use the same).
- The word towers: `harbor().windows.faces` → { wordA: { cols 19, rows 11 }, wordB: { 15, 12 }, wordV: { 5, 18 }, rect } (the
  face = the rows nothing nearer covers, tested); windows 3.0 × 4.7 pt (A, B) and 4.7 × 4.6 pt (V) at 402 — a letter 9 × 23 pt /
  14 × 23 pt.
- The font (`harbor-windows.js#FONT`): 5 rows, digits + A–Z (M, N, W, Q wider), ♥ ★ ⚑ (`<3`, `*`, `[flag]`). `layoutText(text,
  towers, { tower, vertical })`: a short word of letters down wordV (one letter under the other: "JOY", "BOO", "USA"); else one
  line on wordA, else two lines on A, else across A + B ("HAPPY NEW YEAR" = HAPPY / NEW on A, YEAR on B); null if it can't fit
  (never a cut word).
- `harbor().spell(text, { tower, style: 'steady'|'wipe'|'twinkle', colour, ms, at })` (lights.spell) — the rest of that tower's
  face dims, the letters light (the wipe climbs floor by floor from the bottom); night only (× the night); `clearSpell()`.
  Random words go through the scheduler (`spell` event); fixed-time ones (a countdown 10 → 1, NYE) call it on the clock.
- `harbor().setWindow(towerId, tier, col, row, { col: [r,g,b], a } | null)` — any window by its address, drawn every frame over
  the lit layer (flags, party waves, holiday windows; null gives it back to the timeline).
- Preview: `&force=spell&text=HELLO` (`&style=wipe|steady|twinkle`, `&tower=wordA|wordB|wordV`), also `2027`, `BOO`.

### Known issues (Part 2)
- ~~**A plane's contrail grows the frame cost**~~ — FIXED in Part 6a: the Harbor's own planes keep ≤ 60 samples a contrail, drawn in six batched strokes (`air.js`). (Was: the district's `aircraft.js`, reused as is): its puffs accumulate across the sky
  for the plane's whole pass — measured 3.3 → 5.6 ms of scene work at 4× CPU over 40 s at a fixed tier (the profile: `drawImage`
  in `aircraft.js` ~ line 137, `puff` line 80). It makes `title-perf.mjs`'s later tiers look slower (it measures t2 → t1 → t0 in
  order: measure with `&force=no-planes`). Not Part 2's code; **Part 6** rebuilds the planes' artwork — cap the trail there.
- The desktop panorama's extra towers are a little uniform in height (a wall from 1440 wide); Part 12's desktop pass.
- The day sky at noon in summer sits the sun just under the tagline on a phone; with the tagline gone that band is open sky —
  check it in June (the arch's summer peak: `archFor`).

### Handoff → Part 3 (neon + signs + billboards) — done, below
Start from `quay.js` (the hero blocks' sign frames), `blocks.js#crown` (the crowns the roof tubes stand by) and the word towers
(never put a sign on their faces: `harbor().windows.faces`). Lit windows are their own layers: a sign's glow is drawn after
`nearLit`. The hotel moved 2 units left (10..24). Keep the corridors clear (`L.cuts`; tested): a roof sign taller than the base's
floor must not stand in one. Measure with `title-perf.mjs --city 2 --scenes "…&force=no-planes"` before and after.
