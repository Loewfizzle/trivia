# SP3 — THE SPEAKEASY + CRISP NEON (Oct 26 2026; plan.md "OWNER'S NOTES — OCT 26 (after 9a)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## SP3 — THE SPEAKEASY + CRISP NEON (Oct 26 2026; plan.md "OWNER'S NOTES — OCT 26 (after 9a)"; behind `?city=2`)

### 0. 9a's review + the owner's 9a notes
- **THE RAIN ON THE SIGN FOLLOWS ITS POWER** (`glasswx.js#drawSign`, `scene.js#signLive`, `#rainLights`): every weather layer that borrows
  the NEON sign's light scales with its LIVE level — the sun plan × the boot / catch × every dim (`signDim`: the TR-3B's blackout, a sky
  message). Unlit at night a bead is a DARK clear drop with a faint glint (no more pink dots on dead letters); by day clear water on the
  pale glass. The rain's light grid drops the sign below its blackout ghost (≤ 0.1) and the roof signs' light follows `legendPow`. The
  light audit gained `signWx` + `rainSigns`; the `legends` group checks them under the blackout in rain + a normal rainy night (control).
- **REAL WATER on the dock + ☰ / ♪** (`glasswx.js` — WATER, `stepWater`, `waterSprite`): drops LAND (more + faster with the rain: drizzle
  rare, rain steady, heavy constant), BEAD, grow as more land on them + MERGE (volumes add), and past the critical size (`WATER.rc`) BREAK
  FREE — a stick-slip run down the glass, picking up what they meet, a fading wet trail that leaves tiny beads, a drip off the bottom edge;
  each drop a lens (the sky / the city flipped into its lower half, the button's light, a specular point, a dark rim). Dry off over a
  minute or two after the rain. Budget: ≤ 8 a corner button, 12 a disc, 22 on the pill (60 % at tier 0). Reduced motion: a few still
  beads. Frost as 9a built it (same canvas).
- **THE BUTTONS' RAIN FADES WITH THEM**: each glass shape's canvas now lives INSIDE its element (`.menu-btn` / `.music-btn` at z-index −1
  — over the glass, under the icon; JOIN / HOST inside `.nd-hdisc`; the pill inside `.nd-bar-glass`) — it inherits the button's opacity
  at rest, behind menus, in games, through the TR-3B. Checked: every `canvas.nd-wxg` inside its button + its effective opacity 0 at rest.
- **DRIZZLE / RAIN / HEAVY clearly apart** (`rainfx.js#rainLook` — RAIN = the anchor, × 1): drizzle ~⅙ of the streaks, shorter (0.45),
  slower (0.58), fainter; heavy ~3× the streaks (cap 2.2 × RAIN_CAP), 1.6× longer, 1.3× faster + brighter, SHEETS sweeping across in
  waves with the wind, the skyline GREYED behind a rain haze (`scene.js#rainHaze`: the far rows most, the near a little; the city's glow
  colour at night), more splashes + rings, the rain shafts heavier, a share of the few people out RUNNING (`harbor-people.js#planVisit`
  `dash`), the rain beds louder (`sounds.js`). Not built: rivulets in the gutter (logged).
- **THE NEON LOGO LIGHTS IN A DARK STORM** (`scene.js#stormLit`, `title.js#neonNow` — `stormOn`): on a storm / heavy-rain afternoon the
  sign powers up with the skyline's neon on the shared darkness (on > 0.55, off < 0.35) and returns to daylight glass as it clears.
- **THE TREE CROWNS SWAY** (`scene.js#swayTrees`, `trees.js#crownDiscs`): in real wind (from ~3.5 m/s, gusts from 7) the BAKED crown is
  copied live from its own layer, clipped to its clusters + sheared (the trunk's foot still, the top ~1–2 pt), a slow rock + a flutter, a
  lean downwind, gusts rolling through from upwind; the OVERCLOCK blade + any lamp in front of the crown stay put. (FOUND WITH IT: a
  throw in the new code silently cut the frame short — the scene's frame loop swallows errors; caught before the commit.)
- **THE FESTIVAL AT 402** (`balloons.js`): the six drift TOGETHER on one wind speed (their spacing holds the whole flight) and
  x-neighbours alternate high / low — sampled 90 s of the FAST preview at 402: zero overlap.
- **ROSIE ON THE MOVE** (`core/harbor-boats.js#ROSIE_SERVICE`, `ROSIE_TABLE`, `tableAt`): every hour 7 am → 11 pm: in from off screen
  ~4 min before (her homecoming stretched 1.6×), DOCKED AT :00 (the ship's bell), 3 min boarding, cast off (her horn; 7 pm = the dinner
  cruise's blast), gone by ~:06; off screen otherwise (no service in the small hours). Party nights: her strings CHASE in the party
  colours (two bands a beat once the grid is trusted, else 6 a second — `boats.set({ chase })`).
- **THE WEATHER'S SOURCE, DECIDED ONCE** (the owner's load log: `+0.48 s wx none (seeded)`) — the cause: a SAVED answer is aged from the
  weather's own 15-min slot, so one fetched up to ~30 min old went stale moments after a reload's reveal while the 15-min poll waited.
  Now (`scene.js#wxNow`, `district/live-weather.js`): after the reveal the last answer is HELD (≤ 3 h) until a new one arrives (a
  differing answer blends slowly as before; never a fall-back to seeded); a saved answer within 15 min of stale is re-asked at once
  (then at most once a minute); a FAILED first ask (offline / 5xx) is asked once more before the gate counts it settled; the load log
  notes the ask (`wx asked: HTTP 200 in 412 ms`), the reveal row + the readout name the source (`live · 9 min old` / `cached · …` /
  `held (…)` / `seeded (…)`). The cloud `load` flake of 9a is most likely the runner's ask failing — the retry covers it, the note shows it.
- **THE DEBUG STRIPS STACK**: the readout, AUDIO, then the LOAD log — the log gives way first (its oldest lines clipped), every title in
  view + tappable. The header counts post-reveal changes only (it always did — `visibleRow`; the wording now says so).

### 1. CRISP NEON — measured, then fixed
**Measured** (Chrome at dpr 3, `shots.mjs … --dsf 3`, `docs/harbor/refs/crisp-neon/`; WebKit can't run on this laptop):
1. **The city's canvas is capped at 2×** (`scene.js#TIERS`): on a 3× iPhone every tube in it is upscaled 1.5× — the hush sign's ~1-pt
   tubes show it most.
2. **The hush sign's halo was wide for its stroke** (glow 1.15 × the tube), and its core was drawn in ~0.9-pt segments with round caps at
   a partial alpha: the joints' seams BEADED the core into dots.
3. **The NEON logo on Chrome is crisp** — its softness is on the edge: the near glow at full strength right against the body (an edge step
   of 69 levels across the tube's edge at 3×). Safari's own rasterising of the SVG's filter layers can't be measured here — the owner's
   iPhone decides.
**Fixed:**
- **THE HUSH SIGN** (`hushsign.js`): its letters on their own small overlay canvas (`canvas.nd-hushc`, inside `.nd-scene`, over its
  window) at the phone's FULL dpr, every sprite on whole points; one continuous body + core per tube (`tubes.js#drawLit` `whole`), a halo
  sized to the stroke (0.75 ×), the dark edge kept. The room + its dimming stay in the city's canvas under it; redrawn only when a level
  moves (the strike, the fade).
- **THE NEON LOGO** (City 2.0's premium SVG only — `ui/logo.js`, `title.css` "CRISP NEON"): the city's tube recipe — the near glow a step
  under the body (0.6 → 0.72 lit), a wider white-hot core (0.34 → 0.4 of the tube), a crisper glass highlight; the edge step 69 → 117 at
  3×. Everything it does is the same SVG + classes (the boot, the flicker, the catch + the race, taps, the punch, the tired tube, the dim).
  City 1.0 unchanged.
- **SPEAKEASY IN WHITE NEON** (`ui/word-neon.js`, `title.css` "SPEAKEASY IN WHITE NEON"): single-stroke squarish tube letters (S P E A K Y
  in a 12 × 10 box), the side rules + diamonds as thin tubes (data-URL SVGs: dim glass → lit → milky by day). Each character of the
  word's DOM stays (invisible): the layout, the screen reader, the dark halo's measure (`textRects().glyphs`), the race's letter-by-letter
  writer (`.nd-word-r i`) and the beat punch (`.nd-word-p`) work unchanged — both now carry the tube letters' light alone. By day milky
  phosphor glass (reads unlit), at night a calm white glow (calmer than NEON). The shimmer layer is gone in City 2.0.

### 2. THE WINDOWS + THEIR PEOPLE
- **THE PANES** (`core/harbor-speakeasy.js#SPEAK_V`, `SPEAK_WIN`, `SPEAK_PIERS`; layout + the bake + the wall-washers read them): all
  four upper windows EQUAL — 2.2 × 2.25 units (was 1.9 × 2.2 / 1.9 × 2.0): +16 % wider, +12 % taller upstairs, ~+24 % glass. FEASIBILITY
  (checked before building): the belt (4.3) → the cornice (9.85) holds two sills, two glass rows, two lintels + a spandrel — 2.25 is the
  most an equal row gets (20 % taller would push the lintel into the cornice); the lintels slimmed 0.26 → 0.2, piers 0.95 for the
  washers. The hush sign + every moment re-fit by themselves (they read the window rects).
- **ONE STAR WINDOW AT A TIME** (`core/harbor-moments.js#starOnly`): of the moments on, the routines + the one that started first; the rest
  wait. The other lit windows keep **SLOW LIFE** (`windows.js#passing`: now and then someone passes deep in the room, a soft shadow, ~8 s
  every 50–110 s, seeded per window).
- **THE STAGING** (`STAGE`, `STAGE_ROOM`): each moment plays through a zoom about the pane's foot — CLOSE moments bold at the glass, cropped
  by the frame (peek 1.55, toast 1.45, wake 1.4, lights-out / bartender / sax / cat 1.3: head + shoulders ~60–70 % of the pane), ROOM
  moments a little deeper (dance 1.18, fan 1.1, the tango + the mirror as drawn); the rooms' steady figures (the jazz player, the TV couch,
  the bar's afternoon) 1.22. (The figure kit itself — `figure()` — is unchanged: the Halloween ghosts ride on STAGE next.)
- **THE ROOMS' LIGHT** (`windows.js#paintRoom`, `paintLampRoom`): soft warm whites, each room its own — the jazz room HONEY behind its
  shade, the edge windows CREAM curtains, the apartment a faint ROSE lamp, the back room's pool cream, the TV's blue; the bar keeps its
  amber (the basement too).
- **THE TV ROOM AFTER 3 AM** (the owner's bug: blue → ORANGE): `roomState` 'tvoff' (a last flicker, the picture shrinking away over 3.2 s)
  → 'dark' until the wake. NEVER FULLY DARK moves to the lower EDGE window: a lamp left on low behind its curtains all night
  (`EDGE_NIGHT` 0.4) — a light that reads half-seen at the screen's edge.
- **THE PROMENADE's PEOPLE + THE ANIMALS ~9 % BIGGER** (`folk.js#FOLK_SCALE` / `BODY_H` — the body, the stride + the reach scale together;
  the dog; `core/harbor-wildlife.js#WILD_SCALE` on every animal's size).

### 3. THE ROOF SIGNS + THE HIGH STAKES BOARD
- **THE HOURLY MODES** (`core/harbor-roofmodes.js` PURE + `tests/harbor-roofmodes.test.mjs`; `neon.js#planRoof`, `roofRace`): the named
  signs (the CIPHER blade, PULSE, NEON PAR — not the logo, not the billboard) each run SPELL / RACE / BREATH for the hour (seeded per sign
  per UTC hour, neighbours never the same); ONE big move at a time (each spelling / racing sign's turn about once a minute, staggered);
  a restart flicker in the first 1.7 s of the hour. SPELL: dark, the letters in order, a hold, two flashes, settled (the existing letter
  reveal + the burnt-out letter's cut-out: `signText` / `deadText` 'roofspell'). RACE: a white-hot pulse + its tail once round the sign's
  own border tube (a bare sign gets a thin track). BREATH: 0.72 → 1 over 5.2 s, its own phase, never on the beat. Off on a party night,
  at tier 0, under reduced motion. Previews: `&force=roof-spell` / `roof-race` / `roof-breath`; `&force=no-roofmodes`. `harbor().roofModes`.
- **HIGH STAKES** (`signs.js#gooseneckLamps(R, 5)`, `lampLightMap(…, lift)`): the roof board on the speakeasy now has FIVE gooseneck
  lamps evenly spaced (the centre one over the spade), + a small lift of its night light: +14 % on the board at night (measured, 3×),
  the lettering still crisp; by day unchanged. The other billboards keep four.

### Decisions made (each the most reasonable reading; easy to reverse)
- The logo stays the SVG (the owner allowed "an SVG whose blurs never scale"): a canvas rebuild of everything it does (the boot, the
  catch, the race, taps, the punch, the holiday dressings, City 1.0) wasn't safe inside SP3's time box with Halloween next.
- The windows: 2.25 tall, not 20 % taller (infeasible — above); the four upper panes equal.
- The star window = the moment that started first; the others are skipped, not queued (the schedule fills the evening anyway).
- NEVER FULLY DARK: the lower edge window's lamp, not the apartment's.
- The tree sway draws a sheared live copy of the baked crown (a hair of the original shows on the trailing side at the strongest gusts).
- The roof modes switch on the UTC hour (whole-hour time zones: the local top of the hour).
- The border race runs along each sign's own border tube (all three have one) instead of adding a second line.
- Rosie: off screen overnight (none in the small hours — the owner's "like a real ferry"); her homecoming stretched 1.6× to ~4 min.
- Heavy rain's people RUN (the jog gait) rather than vanish; "almost gone" comes from the existing rain + storm cuts.
- The weather after the reveal is held for up to 3 h with no new answer, then seeded.

### Tests
Unit: `harbor-roofmodes.test.mjs` (3), `harbor-moments.test.mjs` (the TV off + dark, NEVER FULLY DARK with the edge lamp, ONE STAR),
`harbor-life.test.mjs` (Rosie's hourly run). E2E (no new groups): `weather` (real water + streaks, the labels on top, the rain hides with
its button), `legends` (the sign's weather light dies in the blackout + the control), `core` (the strips stack), `neon` (the roof modes:
neighbours differ, spell + race take turns), `windows` (one star window, the equal panes; 3:30 am: the TV room dark), `people` (the hush
sign read from its overlay).

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 2500664 — the commit before the pass — 402×874, 2× CPU, the GPU, 2 + 2 windows of 5 s)
| scene | tier 2 A → B work mean ms | tier 0 A → B work mean ms | verdict |
| --- | --- | --- | --- |
| a normal night (np-night) | 7.06 → 5.92 | 4.45 → 2.59 | **same** both (within the noise ±3.2 / ±2.1) |
| a party night (np-party) | — (INVALID: the laptop's tier stepped 2 → 1 mid-window on BOTH sides) | 7.12 → 7.26 | **same** at tier 0 (±0.39) |
Not re-run (the one-round rule). The new per-frame work: the glass water (redrawn only while it changes; ≤ 50 drops), the tree sway
(two clipped drawImages in wind only), the roof modes (one level a sign + a dozen dots during a race), the hush overlay (redrawn only
while its level moves). The laptop's tier-0 party is over its absolute budget on both sides (a warning; the owner's iPhone decides).

### Known issues (SP3)
- **WebKit can't run here**: the logo's iPhone softness (Safari's SVG filter rasterising), the glass water's look, the overlay canvases —
  the owner's iPhone decides; if the logo is still soft on the phone, the next step is the logo's crisp layers (glass, body, core,
  highlight) on a full-dpr canvas with the glows kept in the SVG.
- **The figure kit** (`figure()`) is unchanged — the people are bigger + closer through STAGE, not new silhouettes; hats / hair / a warm
  rim from the room's lamp at the new size are the Halloween pass's first job (its window ghosts ride on it).
- **Rivulets in the gutter** (heavy rain) not built.
- **The tree sway** at the strongest gust shows a hair of the baked crown on its trailing side.
- **The cloud run (40278509066)**: audio, show, street, wild green; `city` 103/104. 9a's flake ("LOAD WEATHER — answered in 1.2 s") now
  PASSES in the cloud (revealed `wx overcast (live · 0 min old)`). The one failure: "answered after 6 s … 0 jumps" — passes locally twice;
  the cloud's late bake diff reads `sun, flood` (locally `sun`): the test runs on the REAL clock and the runner is on UTC (06:15 — dawn
  there), where the overcast arriving also re-bakes the windows / floodlights with a crossfade the load log counts as visible — 9a's
  dawn behaviour, clock-dependent, not this pass's change. The check now prints the visible rows + the reveal; not re-run (the two-run
  rule). Fix next: pin that test's clock (`&when=` a mid-afternoon) or let a weather-caused lit re-bake ride the slow blend.

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **NEON + SPEAKEASY**: night `&when=2026-10-22T22:30` · day `&when=2026-10-22T13:00` · the dusk catch `&when=2026-10-22T18:52` (tap).
- **The hush sign**: `&when=2026-10-22T22:30&force=hushsign&hush=JAZZ`.
- **The windows through an evening**: `&when=2026-10-24T20:30` (a Saturday — the star moving window to window; the panel's speed).
- **A close moment**: `&when=2026-10-22T21:30&force=window&moment=toast` (`peek`, `dance`, `sax`, `wake`).
- **The TV room switching off at 3 am**: `&when=2026-10-23T02:59:50` · dark at `&when=2026-10-23T03:30`.
- **The roof signs' modes**: `&when=2026-10-22T22:30&force=roof-spell` · `&force=roof-race` · `&force=roof-breath`.
- **HIGH STAKES's board at night**: `&when=2026-10-22T22:30` (the roof board on the speakeasy — five lamps).
- **A dark storm afternoon (the logo lit early)**: `&when=2026-10-22T15:00&force=storm`.
- **The trees in the wind**: `&when=2026-10-22T15:00&force=windy`.
- **The festival at 402**: `&when=2026-10-24T09:30&wind=1&force=balloon-festival-fast`.
- **Drizzle / rain / heavy rain**: `&when=2026-10-22T22:30&force=drizzle` · `&force=rain` · `&force=heavy-rain` (by day: `T14:00`).
- **The dock + buttons in the rain**: `&when=2026-10-22T22:30&force=rain&idle=0` (stays up) · at rest: drop `&idle=0`, wait 10 s.
- **The blackout in the rain (dark beads)**: `&when=2026-10-22T22:30&force=tr3b,rain&lgs=15`.
- **Rosie's hourly run**: `&when=2026-10-22T13:55` (in at ~13:56, docked 14:00, gone by ~14:06) · a party night `&when=2026-10-24T21:55`.

### Handoff → 11a-1 HALLOWEEN + DAY OF THE DEAD
- **The window kit**: `windows.js#figure` (hats incl. 'top' / 'cloche', hair, dresses, props) + `STAGE` (add the Halloween moments'
  closeness) + `starOnly` (one star at a time — a ghost scene is the star) + `passing` (slow life) + `paintRoom`'s per-room tones (a
  candle-orange / a ghostly green room for the night are one entry each). New moments: an entry in `core/harbor-moments.js#MOMENTS` + a
  `PAINT[id]`.
- **The sign's dressing anchors**: `ui/logo.js#LOGO_ANCHORS` / `anchorsSvg` (webs, the spider — City 1.0's), SPEAKEASY's letters
  (`ui/word-neon.js`: a per-letter SVG — a letter's tube can take a holiday colour through CSS on `.wn-body` / `.wn-glow`).
- **The roof signs**: `core/harbor-roofmodes.js` — a holiday can force a mode for the night (`&force=roof-…` shows how).
