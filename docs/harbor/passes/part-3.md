# Part 3 — NEON + SIGNS + BILLBOARDS + BUILDING NEON + THE NEON LOGO (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Part 3 — NEON + SIGNS + BILLBOARDS + BUILDING NEON + THE NEON LOGO (Oct 21 2026)
- [x] 0. The owner's Part 2 review: FAR GLITTER (lights.js: far + mid windows are fine irregular points — each its own size,
  place and brightness inside its pane, a few bright, now and then a lit floor as a thin strip; the addresses unchanged; near
  windows as they were) · WORD TOWERS (narrowed to pitch 1.1, wordA 0.759 / wordB 0.928, the lighthouse into the slot between
  them, the sunset corridor 0.851 → 0.84; the faces' cover counts the lighthouse; tested at the four phones: both faces whole on
  screen, ≥ 4 pt in, nothing nearer over them — the lighthouse, the wheel, the boats, the signs) — the lit letters fill their
  bays (94 × 90 %), warm with a hotter centre and a soft glow, on a face darkened to 82 % · THE SCROLL (`style: 'scroll'`, or
  any message too long for the faces: a ticker one window-column a step, 120 ms, any length up to 120 characters,
  `scrollColumns()`) · THE TAGLINE (its 15 s now start in `run()` — when the title appears — not at the end of the power-on:
  the preview showed it ~18 s) · BEACONS (every tower's tip incl. the spires + the NEON NEEDLE's tip, the bands' 8 tallest;
  ONE clock — `beaconPulse(t)`: a slow red pulse 30 a minute with a faint ember between; by day a white strobe on the tallest).
- [x] 1. Signs built like sign-shop neon (tubes.js + signs.js), the spots + tonight's pick (core/harbor-neon.js), billboards.
- [x] 1b. The neon outlines on the buildings, the NEON NEEDLE, the LED facades, the palette in roles, the moments' hooks.
- [x] 2. The NEON logo's premium pass (`logoSvg({ premium })`, ?city=2 only) + `LOGO_ANCHORS` (+ `&force=anchors`).
- [x] 3. Timing: City 1.0's (the neon plan, the stagger, the sputter-on / stutter-off, the rare flicker) for signs + outlines.
- [x] 4. Perf + memory (below); 5. review (night, day, golden, the catch, the words + the scroll, the moments, close-ups, the
  logo night + day, the logos preview at 390 / 402 / 430 / 1440; two refine passes), docs.

### The neon, as built
- **THE TUBE** (tubes.js): every tube is a polyline (core/tube-path.js#flattenPath: SVG M L H V Q C A Z) with a light per point
  (`tubeLight`: hotter on the bends, dimmer within ~4 widths of an open end). LIT = a wide gaussian glow + a near one (canvas
  shadowBlur, baked) → the body (segment by segment, brighter where hotter) → the white-hot core → a fine highlight; drawn once
  into a SPRITE and every frame additively with its power. UNLIT (`drawGlass`) = by day clear glass tinted by its coating, the
  gas tint, the sun's highlight on the sun's side, a soft shadow on the wall; at night dark glass; electrode caps; clips.
- **THE SIGNS** (signs.js): `vbox` (a vertical cabinet: enamel face, trim, its depth toward the middle, brackets, the name
  stacked in the tube alphabet, its mark on top only when the cabinet is ≥ 14 pt wide), `box` (horizontal, mark + name),
  `icon` (the game's tube mark on a painted raceway), `script` (JAZZ: slanted open tubes on a raceway), the HOTEL (red, chaser
  bulbs every 3.4 pt running in threes), `billboard` (painted paper on a steel frame + catwalk + legs, the game's mark painted,
  its name in Orbitron + its tag line, seams, a peeled corner, weathered by day; at night three GOOSENECK lamps light it —
  bright under each lamp, falling off). The housings + the billboards' boards are BAKED with the facades (static per look: the
  end of the near / far facade bake, `neon.housingStep`) — nothing nearer stands in front of a sign (tested), so no occlusion is
  lost; the lit parts are sprites (border, mark, name: they boot one by one).
- **THE SPOTS** (`SPOTS`, designed on the reference phone in pt at a depth, converted to world units once — every upright phone
  the same; tower signs centred on the shaft, as wide as the narrowest tier they cross): **4 named** (Part 4 moved the icons + the billboard: see Part 4) — the SUNBURST's shaft
  (vertical, ≤ 10 letters), a rooftop box over the near band left (≤ 9), NEON PAR's facade (vertical, ≤ 6), the EMPIRE's main
  shaft (vertical, ≤ 5) · **8 icons** — on the hotel, behind the wheel on PULSE's facade, on PAR, under JAZZ, the needle, the dome,
  the stepped tower, the near band left · **fixed** HOTEL + JAZZ · **1 billboard** on a wall right of the lighthouse. Each checked
  (`spotConflicts`): on screen, never over a word face, the lighthouse, the wheel (an icon may sit behind its spokes), another
  sign, nor behind anything nearer. A wide screen adds a named vertical sign on each panorama tower (drops any phone spot that
  ends up hidden there): 1440×900 = 9 named + 8 icons. **A phone sideways: 7 spots** (some games sit out that night — Known issues).
- **TONIGHT'S PICK** (`assignSigns(games, spots, nightKey(local))`, the owner's call): a new shuffle each night (the evening's date;
  before noon it is still last night); the named spots (longest cap first) take the first games whose name fits, the icons the
  rest; a longer or shorter game list fills more or fewer spots. The scene re-picks only while every item is dark (by day), so a
  sign never changes while you watch. The billboard advertises a game with no named sign tonight.
- **THE OUTLINES** (`outlines(L)`): the hero towers + the panorama's (every tier's edges from up the shaft, the setback ledges, two
  Deco fins on the top tier — not on a tower carrying a sign — and the crown: the sunburst's arches + its needle, the mast, the
  spire, pyramids, domes, the stepped tops), the word towers (their frame + their parapet — never across a face: tested), the
  middle tier (setbacks + crowns), the glass towers (their roofline), the hero blocks (their roofline), the bands (a few faint
  threads: a share of the near / mid / far blocks' rooflines, coloured by cluster). Projected and CUT where a nearer building of
  the same group stands in front (the nearer buildings' top envelope, per group), each point keeping its light; the unlit glass
  is drawn right after its building in the facade bake (so nearer things cover it; faint by day: only a glint of clear glass).
  **THE NEON NEEDLE**: the needle tower's spire carries one tall tube (`t.needle` 7 units above the crown tip, squeezed with it;
  1.5× wide, 1.6× glow), its beacon at the very tip.
- **THE PALETTE** (`NEON`, `SCHEMES`, `roleColour(role, scheme)`): roles b0 b1 b2 (base: electric blue, cyan, ice white), h0 h1
  (heat: the NEON pink, violet), a0 a1 a2 (accent: amber, signal red, acid green). Per building ≤ 2 roles (main + crown accent):
  the sunburst pink + amber, the needle violet + the pink needle, the EMPIRE ice + blue, the word towers cyan / ice, the middle
  tier by cluster, threads by screen fraction (tested: base > heat > accent by length). STRENGTH = the brightness hierarchy
  (tube 1.5 / 1.25 / 1.0 / 0.7 pt at the reference scale, glow 7 → 3.2, alpha 1 → 0.5: heroes → word → mid → far).
- **THE LED FACADES** (glassL, glassR): per frame, clipped to the face's part above the nearer buildings — slow vertical
  gradients (cyan → violet → blue, 26 s a cycle) + a band of light climbing every 9 s + thin floor lines; party colours at a party (tier 2; Part 4: held still at tier 1 — one cached image).
- **POWER** (City 1.0's, `neon.powerTick`): the neon plan's per-item states (title.js#neonNow: `signCount()` = the items: the
  signs, the billboard, every outline) → each its sputter-on / stutter-off (`alpha`, City 1.0's segAlpha: tube by tube), the
  boot stagger 0.25 + i · min(0.6, 4.5 / n) s (≈ 4.5 s for the whole city), a rare flicker (25–70 s), a faint core flutter
  (tier 2; Part 4: off at tier 1). By day everything is unlit glass. A re-layout never blanks the neon: the new set builds behind the old one and
  takes over its power states (like the baker).
- **MOMENTS** (hooks; `harbor().moment(name, v)`): `party` (k: the chasers — coloured runs racing along the heroes' + word
  towers' + panorama's tubes while their tubes sink back, the outlines breathing with PT.breath, the LED facades in party
  colours) — `&force=neon-party`; `chase` (on/off); `flash` ({ game }: the game's mark colours sweep the skyline left → right in
  1.6 s) — `&force=neon-flash&game=pulse`; `scheme` (a SCHEMES name: the outlines re-lit; halloween, christmas, july4,
  valentine, stpatrick, nye, thanksgiving, easter, party) — `&force=neon-scheme&scheme=halloween`. `billboard(id, { game } |
  { title, sub, bg, ink })` changes a billboard (re-bakes). Part 4: `harbor().reflections()` → every lit item's rect + colour.
- **THE NEON LOGO, premium** (ui/logo.js `premium: true`, title.js passes it with ?city=2 only; letters, positions, colours and
  the app icons / link previews unchanged): the glass wall (a pale rim: the tube's thickness), hot spots on the hard bends (2 per
  N, 2 on the E; the O's gentle curves stay even), dimmer electrodes, the highlight leaning toward the light (`--hix`: the real
  sun's side, moving through the day), sun glints by day; at night its glow tints the haze around it (scene.js#logoHaze, in the
  sign's colour); a faint core flutter = a rare 70–130 ms dip in one lit tube (each is one repaint of the sign — never a per-frame
  animation on the filtered SVG). **ANCHORS** (`LOGO_ANCHORS`, logo coordinates 0..332 × 0..100): `tops` (per letter), `garland`
  (a sagging run end to end), `gaps`, `base`, `centre`, `corners`; `anchorsSvg()` + `&force=anchors` shows them.
- **EACH GAME'S TUBE LOGO** (ui/tube-logo.js `gameLogoSvg(game, { lit, premium })`): the mark + the name (one or two lines) in
  the tube alphabet, built exactly like the NEON logo with its class names (`.ndl`, `.ndl-light` …) so the title's CSS lights it
  letter by letter; filters in user space (no clipped glows). Preview: `tests/integration/logos-preview.html` (night + day).

### Performance + memory (Part 3, `title-perf.mjs --city 2`, 390×844, 4× CPU, mean ms of scene work t2 / t1 / t0)
np-party 5.9 / 5.0 / 3.9 · np-night 4.3 / 4.3 / 2.9 · np-day 3.2 / 3.0 / 2.7 · np-golden 4.5 / 4.4 / 3.6 · the worst case
(`neon`: a party moment + the searchlights + a word) 6.1 / 5.6 / 4.0 — within 8 / 6 / 4, frames 16.7 ms. The E2E's party peak:
5.8 / 5.6 / 4.2. **Tier 0 = the calm neon:** no chasers, no beat, no flicker or flutter; once a group's neon is steady (all on,
the boot done) it is ONE composite image (the LED facades still inside it). Memory: the neon's sprites ≈ 2 MB at tier 2 (+ the
tier-0 composites, ≤ 1 MB), the baked layers unchanged (22.9 MB of 64 at 390×844).

### Known issues (Part 3)
- A phone held SIDEWAYS has room for 7 sign spots (2 named): some games sit out that night (the pick rotates). Desktop 9 named +
  8 icons. Part 12's desktop pass can add named roof signs along the panorama's near band.
- The `flash` moment is verified by state (E2E) and by eye in motion, not in a still (it lasts 1.6 s).
- The far / mid-tier outlines are cut by the far group's envelope; a far band block standing in FRONT of a mid tower's crown
  (rare) cuts a few points of its crown tube.
- The logo's core flutter is a rare dip, not a continuous shimmer (a per-frame animation on the filtered SVG costs a repaint
  of the whole sign every frame).

### Handoff → Part 4 (water) — done, below
The lights to put in the water: `neon.reflections()` (every lit sign / billboard / outline: its rect, colour, power), the lit
windows' layers (`farLit`, `nearLit`), the beacons (`lights.beaconList()`), the quay lamps (quay.js), the logo's haze is sky only.
The water band is the `water` baked group (z 64–230). The lighthouse moved (f 0.8502 on a phone): its reflection + beam (Part 5)
start there. Measure with `title-perf.mjs --city 2 --scenes np-night,np-party,neon` before and after.
