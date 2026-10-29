# C4a — THE SHOPFRONT + THE GROUND (Oct 28 2026; review-4.md §E items 1–6, the owner's PROM look notes; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## C4a — THE SHOPFRONT + THE GROUND (Oct 28 2026; review-4.md §E items 1–6, the owner's PROM look notes; behind `?city=2`)

The first of FR4's three cleanup passes (C4b the people + the compass + the giant off, C4c the code / tests / docs). Every cause came
from review-4 §C1 / §C4 with its file:line; this section is what was built and the numbers that moved.

### Group 0 — windows.js split (no look change)
`windows.js` (2227 lines) → five files, pure moves (pixdiff night / noon / golden / party / halloween: the windows identical; the few
pixels beyond the noise were a door + roof people on their own clocks):
- `windows.js` (~340) — the life: the plan per frame (`frame`), `draw()`, the passer-by, the taps' `hit`, the TV's landing, the shared
  state `S` (the taps, the dance clock, the glow sprite, the lit look; `last` / `routines` / `smokeForced` / `catTap` read live through
  getters; `lastTv` + `cashTrace` written by the painters for the readout + the e2e).
- `window-rooms.js` — the glass + the 2.5D room box (`deepAt`, `paintBox`, `lampFall`, `walkIn`), `paintRoom` (the lit canvas's rooms),
  the tints, the little helpers — and C4a's SHOP ROOM (`shopGlass`, `SHOP_ROOM`, `barberChair`, `shopTones`, `paintShopRoom`).
- `window-figure.js` — the figure kit (`figure` / `figures`, the rim, the cast + the trace), the props, the sax, the cat, the palettes.
- `window-paint.js` — `createPaint(life)`: the rooms' states (the boss's shade + his TV room, the bar, the sax, the edge moods, the window
  party), THE LIT BLIND (`litBlind`), the barbershop's life (`shop`, `barberDay`, `seated`, `mirrorDoor`), the taps, `PAINT[id]`.
- `window-holiday.js` — `createHoliday({ glow, litP })`: which dressing a window wears, the ofrenda, the sill pumpkin, Thanksgiving's
  table + football, Halloween's ghost / mummy / witch / costume moments (11b's home).
- One slip caught by the windows E2E: the cash count's own local `S` shadowed the shared state (the scene dropped) — the factory's
  parameter is `life` now.

### Group 1 — THE SHOP (items 4, 2)
**THE BARBERSHOP AS A REAL 2.5D ROOM** (`window-rooms.js#paintShopRoom`, one painter for the bake, the night's lit canvas + the live life):
the shop's glass (u 3.3–7.9, v 0.78–3.12) as a room box about the scene's vanishing point (`roomBox`, depth 0.78, pull 0.12 — the
upstairs rooms' numbers): the back wall + the left wall + the floor's black + white tiles in perspective (4 rows × 9), the MIRROR WALL at
depth 1 (four panels, pitch 1.0, the third the hidden door: `shopMirrorDoor`), the counter + the tonics at 0.96, THE CHAIR at
`SHOP_ROOM.chairT` 0.5 (u 0.36 of the width: `barberChair` — the foot, the chrome column + footrest, the red seat, the armrests, the high
back + headrest), THE LAMP with a green enamel shade at u 0.63, 1.02 under the head, depth 0.62 (moved off the original spot — it hid
behind the HARBOR BARBERS arch; now it hangs right of the chair, under the letters, over the barber's side).
- **By day** the bake paints it in the daylight's tones (`shopTones(T)`); the live barber, his customer + the walk-in stand in the same
  box (`deepAt(…, chairT)`), and the seated chair IS the bake's chair (same painter, same tones — no colour step when someone sits).
- **At night: closed + DIM** — the lit canvas paints the room again in its lamp's warm, dark tones (walls [48–64, 34–46, 26–34]) and
  `lampFall` at 0.9 (`lit × SHOP_ROOM.dim 0.45 × 2`, reach 1.05, corners 0.75) + a DEFINED pool under the shade (r 0.8 u × the depth's
  scale, 0.30 → 0.19 → 0.06) + a warm rim on the chair's top edges; the shade's inside + the bulb lit.
- **Gone:** the bake's flat back wall / mirror panels / rectangle chair / lamp dot, the night VEIL over the pane (`M.inside` 0.55), the
  upright radial OVAL on the back wall, the floor smear, the four chair-edge bars, the halo (`paintLit`), the ADDITIVE `soft()` over the
  glass (`draw`; `glowAt.lamp` kept for the wet reflections).
- **THE GLASS READS AS GLASS** — its reflection moved IN FRONT of the room (the gilt layer, `giltOver`): the sky's tint in its head by
  day, the two hard sheens (0.08 by day → 0.04 at night), at night the lit awning's underside caught in its top (0.16 × the awning).
- **THE GILT** is lit ONLY by the awning's strip (`lamps: f.awning`, quantized to 1/8 in the cache key): lit gold under the strip (mix
  0.62 → 0.85 now nothing dodges it), DARK GILT after it goes off (night gilt [86,70,58] → [104,84,62], a faint glint [150,124,90]) —
  closes PROM's "gold after 1 am".
- **THE MIRROR DOOR** stands in the back wall (depth 1, clipped to its panel: the bar's amber, the shelves, the couple), its frame's lit
  edge, and its light LANDS in the shop through `lampFall` (amber, k 1.6 × open, reach 1.25, no corner darkening) — the three soft
  glows are gone. The opening's lamp-switch flicker is drawn at the lamp's own depth.

**THE AWNING lit from BELOW, BRIGHTER** (`speakeasy.js#awningUnder`, `AWN`): the stripes cream 0.52 → 1, red 0.26 → 0.55, the light a paler
warm white [255,196,132] → [255,208,150], the wall end of each stripe 0.3 → 0.15 of its front (the bulbs under the front edge aim up),
the valance's rim 0.6 → 0.85, the pavement pool 0.75 → 0.9; THE DODGE SPLIT — full from the strip to the WINDOW HEAD + its frame
(1 → 0.95 → 0.85), then 0.35 on the brick + the door beside / below it (→ 0.2 at the foot), and NONE on the glass (the pane cut out of
the mask: `destination-out`). Its hours (dusk by the photocell → 1 am, 2 am party nights), the blackout + the door's light unchanged.

### Group 2 — THE LIT BLIND (item 3)
`window-paint.js#litBlind(c, G, { hem, cloth, col, a, lamp, sil })`: the cloth dim (0.22 × a of the light through the weave), the lamp's
light ONE radial from where it stands (r 0.85 × the pane's width — review-4 said 1.3, which read even: the falloff has to land inside
the pane; stops 1 / 0.62 / 0.3 / 0.12 × a, source-over, never added), the lamp's silhouette through the cloth (a shade + its stem,
0.35 × a — none for a TV's glow), six soft vertical folds (light 0.08 / dark 0.1), the edges + the head darker (the recess), the hem bar,
the ring pull + its cord to the sill. The folds + the edges fade in with the light (`on = a / 0.15`) — no step at dusk.
- The boss's shade (the apartment, upper right): the lamp (low left of centre, its silhouette) and the party's TV glow (low right) both
  through it; the violet tell tints the cloth + the light; the dark / day looks unchanged.
- The edge windows (`edgeMood`): the mood's light is a LAMP in the room now (`lampFall` at 2.2 × the level, reach = its old radius,
  corners 0.6 — not two additive blobs), the roller shade a lit blind of the same painter (alpha 0.72 / 0.86 / 0.94 for down / half /
  up: the fan's blades + the passers still show through).
- THE BLIND CYCLE (9c's `cycleBlind`, the flat cream pane top-middle at dusk): the day linen as before + at night the lit blind over it
  (× the night, the room's lamp centre-high) — every window checked at dusk, night + a party night; no flat-glow pane left.
- Not built: the SASH's shadow review-4 proposed — POLISH 5 made every upper window ONE clear pane (no meeting rail), so there is no
  bar to cast it.

### Group 3 — THE GROUND + THE CROSSING (items 1, 5, 6)
**THE WET STREAKS → A SHEEN** (`street.js#wetPass`): the street under the dock no longer mirrors the IMPLIED lamps (`l.implied` skipped —
they stand behind the viewer); in their place a broad warm sheen over the wet street, 0 at its far edge → 0.05 halfway → 0.16 × the
lamps × wet at the screen's foot (their pools, mirrored); the puddles 0.62 → 0.78. THE BACK REFLECTIONS on the promenade
(`wetground.js`, the signals / the door lamp / the awning / the neon — the owner likes them): 0.55 → 0.42 at the light, 0.28 → 0.2 down
the stones, BROKEN by the cobbles (dashes 0.05–0.11 long at gaps 0.04–0.13, each 0.8 pt off the line), and while it rains each dash
wobbles sideways (± 1.2 pt × the rain) on a 0.4-s slot (the bake key gains the slot only while rain > 0.03).

**THE CROSSWALK's LIGHT** (`road.js`): ONE radial gradient per pool on a pool layer (no more nine concentric discs), its tail out to
d 1.25 (`poolFall(d²) = (1 − d²/1.5625)²`, PURE, shared with the cars' light), the layer FEATHERED 6 pt at the rail + the curb
(`destination-in`) instead of a hard clip; wider — the centre rx 7.2 → 9.5, rz 5.0 → 6.2, the edges rx 10 → 13 and k 0.7 → 0.5 (with the
long tails the edges joined the centre into one even band: the crossing must stay the brightest). The signals' tint on the asphalt 1.6×
wider along the road, its hot core softer (0.12 → 0.08).

**THE CARS LIT THROUGH IT** (`people.js#drawCar` + `vehicles.js#draw`): the back road's light sampled at the tail, the middle + the nose
(± 0.4 × the length, in the car's own order) → the lamp-lit body drawn through a horizontal gradient of the three (one scratch canvas),
so a car brightens ACROSS the crossing nose-first; the wheels lit at their own samples (the spokes catch it); the lamp look stronger
(shade −0.36 → −0.12, its blue cast 0.08 → 0.06, the hood + roof gloss 0.42 → 0.6, its share of the road's light 0.8 → 0.85); inside the centre pool the signal's colour cast over the body (0.25 × the pool).
`harbor().people.cars[i].at` = the body's middle on screen; `harbor().promenade.crossX` / `.crossing` (the box for `shots --crop crossing`).

### Tests
- Unit: `tests/harbor-people.test.mjs` "C4a — THE CROSSING's LIGHT IS A SPILL": `poolFall` monotone; along the road no step > 0.08 per
  0.2 u; rising to the crossing; the crossing ≥ 1.5 × 12 u away; a car's nose ahead of its tail by > 0.1 when its nose reaches it.
- E2E `weather`: "C4a THE WET SHEEN" — the dock at rest on a wet night: no column at an implied lamp's x > 1.12 × its neighbours, the
  foot ≥ 40 pt up. E2E `people`: "C4a THE CARS LIT THROUGH IT" (okT) — one car followed, its body 8 u out vs on the crossing ≥ 1.6×.
- `shots.mjs --crop crossing` (new) + `--crop shop` (FP2's) — the reviews at 390 / 402 / 430.

### Measured
- Unit: 850 / 850. E2E locally: `speakeasy,windows,doors` 79 / 79; `weather,promenade,people` 48 / 50 on the first run (the two new
  probes) → both fixed + green (`weather` the sheen; `people` 13 / 13 — the followed car 40 → 65, × 1.62 on the crossing).
- SPEED (`title-perf.mjs --ab` against the commit before the pass, 4× CPU, 390): a plain night SAME (t2 +1.3 ms / t0 +0.3, inside the
  noise); a RAINY night SAME / FASTER (t2 −6.9, t1 −4.0 — the dodge band + the shop's additive glow gone); a PARTY night SAME (it steps
  itself to tier 0 at 4×; +0.1 ms); a SNOWY night SAME / FASTER (−7 / −11 / −6.9 ms). No scene slower.

### Decisions made (unattended)
- The shop's lamp moved from review-4's spot (u 0.38, 0.48 under the head — behind the HARBOR BARBERS arch, invisible) to u 0.63,
  1.02 under the head: right of the chair, below the letters, over the barber's side; its pool lands right of the chair.
- The night room DIM: the lit tones were taken down twice in review (the first pass read cold grey, the second too bright once the awning
  went off at 1 am — the room is the same at 10:30 pm + 1:30 am, only its surroundings darken); the chair keeps a warm rim.
- The lit blind's radius 0.85 × the pane, not review-4's 1.3 (1.3 lands the falloff outside the pane: the cloth read even again).
- No sash bar on the blinds (POLISH 5's single panes win over review-4's "the sash's shadow").
- The crossing's edge pools k 0.7 → 0.5: with the softer, longer tails at 0.7 the road read as one even bright band.
- The cars' lamp light: the lit body brighter (shade −0.12) rather than a bigger share of the light (0.95 made the car 8 u out brighter
  too — the contrast across the crossing fell).
- The gilt at night under the strip: 0.85 of the lit gold (it was lifted by the dodge before; without it 0.62 read dull).
- The e2e car probe runs on a September night: from mid-October Halloween's giant ₿ pumpkin stands IN FRONT of the crossing (it hides the
  cars there — C4b takes the giant off).

### Known issues
- ~~HARBOR BARBERS … the owner's call: keep / valance / drop~~ — DROPPED by C4b (the owner, Oct 28 10:41 pm: #c4b).
- ~~The crossing's traffic is hidden by the giant pumpkin through Halloween's build-up~~ — closed by C4b (the giant off, the compass left).
- The wet reflections' rain ripple re-bakes the wet layer 2.5 × a second while it rains (only then; small — the perf A/B's rainy night).
- The street under the dock still shows no snow on a snowy night (unchanged; not this pass).
- THE CLOUD RUN (harbor 40804688140 + tests 40804849973, started by hand — the final push was docs-only): tests green, harbor 6 of 7
  jobs green; `street` 92 / 93 — "THE PLANTED FOOT NEVER SKATES" (the couple round the giant pumpkin's front): PROM's known open issue,
  code this pass didn't touch; C4b disables the giant first. Not re-run (the two-run cap).

### Handoff → C4b (the people + the compass + the giant off)
- The barbershop's box (`SHOP_ROOM`, `deepAt`) is where the doorman's / the barber's future moves live; the chair is one painter
  (`barberChair`) for the bake + the live seated figure.
- THE PEOPLE RULE's entries include the crossing — the cars at the crossing are now lit (`people.cars[i].at` for probes).
- The compass move (option C) must re-check the crossing's light + the cars once the giant is gone (`shots --crop crossing`).
