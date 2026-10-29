# PART 7a — THE SPEAKEASY'S LOOK (+ the layout, the first tap, the beat after returning, near brick + the lighthouse) (Oct 23 2026; behind `?city=2`, the corner buttons everywhere)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 7a — THE SPEAKEASY'S LOOK (+ the layout, the first tap, the beat after returning, near brick + the lighthouse) (Oct 23 2026; behind `?city=2`, the corner buttons everywhere)
The owner reordered the build: the placeholder foreground was about half the phone screen and skewed every judgement of the city, so the
foreground's LOOK comes before the sky (7a the speakeasy → 8a the promenade → 6b). The bar: the night + party city — the speakeasy, the
closest and biggest building on screen, must be the most crafted thing in it. Five pieces ran in parallel (the lead: the speakeasy;
helpers: the layout + the first tap, the beat + the pulse + the spell-on round, the preview panel, the near brick + the lighthouse, the
sun's colour). The audio detail lives in docs/audio.md#7a--the-beat-in-direct-mode; the title's layout in docs/title.md.

### 0. The layout, the first tap, the beat (section 0)
- **THE LAYOUT (both cities):** the round corner buttons are 36 pt (`--cb` in components.css; were 44 / 42), each with an invisible
  44 × 44 tap area (`::after`), icons 16 px; everything hanging off them re-fitted (in games the music button at +54, the menu panel,
  the chat dot 9 px, `.game-head` / `.bar` padding 44 px, PRISM's pair, THE BOARD's back button). **THE CORNERS SPLIT on the title + the
  lobby** (`body.nd-on`, `body.cb-split` from app.js): ☰ top-LEFT, ♪ top-right; games keep both on the right. **The NEON sign ~24 pt
  higher** (`.nd-sign` margin `clamp(16px, calc(8.5vh - 24px), 72px)`; short phones 12 px). The Harbor reads the ☰ as `cam.cornerL`
  (scene.js#rects) and `laneRects` starts any lane that would reach it 4 pt right of it (sky-high ≈ 52,66 · 278×76 at 390). `REF_TITLE`
  is unchanged: the skyline doesn't grow into the freed sky — the city just has more sky. LEAVE ROOM + the TEST pill sit right of the ☰.
- **THE MUSIC'S FIRST TAP** (City 2.0; no "tap for music" hint): `music.js#musicClock()` (the song's own clock, −1 when off / muted /
  not sounding); title.js watches it after the visit's first tap and, once per page load when the clock really starts, the NEON sign
  answers: BY DAY `raceLogo('surge')` — a bright head + tail races N → E → O → N through the unlit glass, each letter blazing as it
  passes, the bloom swelling, back to daytime glass in ~1.6 s; AT NIGHT `raceLogo('first')`, a quicker brighter race. Never during the
  intro (the power-on is the answer) or the golden-hour warm-up (the tap does what the catch does today); reduced motion: one soft bloom.
  (8a: the surge whenever the sign is NOT lit — morning, day, golden hour, dusk — and the catch only in the evening warm-up window:
  `district/neon-ramp.js#firstTapAnswer`, see PART 8a §0.)
  `&force=first-tap` (2.4 s after the intro, then every 5 s); `__district.signSurge()` / `surge()`.
- **THE BEAT AFTER RETURNING** (docs/audio.md#7a): the beat clock always had the song (`nowPlaying` reads the direct element); a FROZEN
  graph's analyser keeps its last window forever, so the kick listener reported "live, no kicks" and the city calmed to a quarter.
  Now `core/harbor-beat.js#beatMode(song, kick)` picks the source and ignores the listener on the direct element; on it the element's
  own clock with no output / lead (iOS's media pipeline compensates its own output). The readout's beat line names the source:
  `grid` · `kicks` · `direct-grid` · `tempo` (an untrusted grid: a gentle steady pulse at its tempo) · `calm`.
- **THE PULSE A STEP STRONGER** (+25–38 %, no new passes): the tubes `1.15·pe` (was 0.9), the crowns' flare `min(1.9, 1.7k)` (1.4, 1.3k),
  the signs `0.9 + 0.72p`, the wheel whole `0.82 + 0.6p` / hub `0.9 + 0.92p` / rims `+0.6p`, the sky beams `0.5 + 1.0p` (a deeper dip
  between beats), the NEON logo's party glow `min(0.95, 1.02p)`, SPEAKEASY's rings 1.2p / word 1.45p.
- **THE SPELL-ON ROUND** (the owner's add-on): EVERY named sign (the blade, both roof signs, any panorama sign) spells on in its turn —
  one every 120–240 s on a normal night on the city clock (seeded: every phone the same), never two at once, never the same sign twice
  running; on a party night only across a scene change (the scene's last bar → the next one's first), shortened to fit
  (`core/harbor-show.js#spellNow / spellParty / spellWho`, neon.js#planSpell). `&force=spell-on` (the next sign every 6 s).
- **THE SUN'S COLOUR BY ALTITUDE** (the owner's add-on: "bright white at 17:57, ~6° up"): `district/sun.js#sunColourAt(el)` (pure, no
  steps): white above ~15°, warm yellow-white 6–15°, golden amber 2–6°, deep orange-red in the last 2° and squashed (0.86 at 0°); the
  white core from 10–18° (was 4.5°), the halo from 3.5–15°; the golden haze now under the disc, the rays start outside it (rays.js) —
  three glows had bleached an amber disc white. The city's light follows in the morning too (`tones.js#toneWeights`: all gold below
  ~5°, daylight from ~9°; the evening untouched). City 1.0's sun untouched.
- **THE AUDIO PANEL'S HEADER** matches its detail (`audio/diag.js#audioStatus`: sounding / sounding DIRECT / LOCKED (no tap yet) / …).

### 1. THE SPEAKEASY (`core/harbor-speakeasy.js` PURE + tested; `screens/harbor/speakeasy.js`)
- **How it's drawn:** each wall is PAINTED FLAT in its own units (u across, v up — ~13.6 pt a unit on a 402 phone) with the skyline's
  material system (`blocks.js#faces`: brick / cream terracotta / granite for this look — day / golden / night tones, the real sun's
  side + height, overcast) and projected: the front faces us (one affine map: drawn straight into the bake), the side wall recedes
  (painted into its own canvas, then one source column per device pixel — exact perspective for a vertical wall). Baked into `stage` in
  8 small steps per look key (the rooftop pieces, the side wall, its strips, the blade, the front's structure, the windows, the ground
  floor, the light + weather + ivy, what stands out: awning, steps, posts, lamps). The bake key adds this week's ad + the month (the ivy).
- **The facade** (`SPEAK_V`): a granite plinth (rusticated, a lit water table) · the ground floor · a terracotta belt course with a carved
  chevron frieze · two floors of windows between brick PIERS (a lit edge toward the light, a shade edge away; stepped terracotta capitals
  with a fan) · carved SPANDREL panels (a fan + chevron wings) · a frieze with DENTILS + the crown moulding and its shadow (deeper with a
  high sun) · a brick parapet with a terracotta coping · a stepped Deco CREST (brick steps capped in cream, a carved fan medallion with a
  gilt boss) · finials on the piers · stone QUOINS up the corner (both walls). Brick: a 16 × 16 tile of kiln-coloured bricks (3 device px
  a course, a lighter top edge by day) + batch tints per floor and bay. WORN: soot streaks from the cornice + coping, rain streaks, a dirty
  foot, small chipped terracotta, the gilt faded, BOSTON IVY up the corner (a fan of small leaves; autumn reds, summer greens, winter bare
  twigs — by the month).
- **THE BARBERSHOP** (the cover): the big window (u 3.5–7.7) — inside a tiled floor, a MIRROR WALL of silvered panels (the hook for
  7b's hidden door), a shelf of tonics, the counter, THE BARBER CHAIR (porcelain pedestal, red leather, chrome), a milk-glass lamp; on
  the glass GOLD LEAF "HARBOR BARBERS" arched + "SHAVE & HAIRCUT" (gilt, a dark keyline, a shade), the street's reflection + a sheen by
  day. Its glazed door (left, behind the corner tree) with the card: OPEN by day, CLOSED at night. The striped AWNING over both (12
  faded red / cream panels, a sewn-on PATCH, iron arms, the valance "EST. 1924", scallops, its side flap). THE BARBER POLE (live) on
  its brackets by the side door — see below. THE UNMARKED SIDE DOOR (the knock's target, unchanged): a granite surround, oak planks,
  iron strap hinges, the little GRILLE, a brass knob, two worn granite steps, the SCONCE over it. THE BASEMENT WINDOW in the plinth
  (barred): a faint warm amber, day + night, breathing a little — the one hint of the secret.
- **THE WINDOWS** (`ROOMS`; ~26 × 30 pt): deep recesses (the left jamb's face, the sill's top, the head's shadow on the glass), bottle-
  green sashes (three lites over one), terracotta sills + their shadows, soldier-course heads. BY DAY the sky in the glass (light at
  the top, the room's dark below), roller shades at different heights, curtains (red / olive / gold), a plant on the edge window's
  sill, the apartment's WINDOW BOX of geraniums. AT NIGHT (live, `roomLight` by the hour): THE BAR (the one clear window — the gold
  back-bar mirror, three shelves of bottles, a pendant, the counter, a patron in a hat), THE JAZZ ROOM (an amber shade ¾ down, the sax
  player's shadow on it), THE APARTMENT (warm wallpaper, a fringed lamp, a picture, the armchair, curtains tied back), THE BACK ROOM
  (three players round a green-felt table under a low green-shaded lamp, cards, its cone of light), the EDGE windows (curtains drawn,
  glowing, a bright gap; ambient only); their warm spill on the brick. The bar goes dark at 3 am, the back room + jazz at 2, the
  apartment's lamp at 1:30 and on again before dawn (7b: its TV glow).
- **THE EDGE WINDOWS:** the screen's left edge cuts the edge column at **45 %** on every upright phone (the speakeasy's x0 is placed
  by screen pt × F, so every width shows the same) — tested at 390 / 402 / 412 / 430.
- **THE BARBER POLE** (the owner's add-on, live): a glass cylinder of red / white / blue spirals in chrome caps that ALWAYS turns — by
  day unlit at the shop's pace (0.42 stripes / s); from DUSK until MORNING lit from inside with a soft incandescent glow (the white a
  cream-yellow, the red warm, the blue dusky violet, a small warm halo; never LED-bright) and turning SLOWLY (0.16), even with the
  CLOSED card up — the secret "we're open". The phase carries over (no jump at the switch). Hook: `harbor().speakeasy.pole({ on:
  false })` snaps it dark + still (7b's raid), `{ on: true }` gives it back.
- **THE ROOFTOP:** the stair BULKHEAD with its door + the CHIMNEY behind the parapet (the deck itself is hidden by the parapet from this
  camera — 7b's parties + the garden stand on it and show above it); the STRING LIGHTS ON (`STRINGS_ON`), MOUNTED on iron posts over
  each pier, round the corner and along the side wall's parapet (no run to a roof pole — it drew a loop over the wheel); bulbs never
  closer than ~5.5 pt on screen (a foreshortened run made one glare). **No water tower:** at ~60 pt it would stand over the OVERCLOCK
  billboard's foot — the plan said "if it reads".
- **THE FRONT ROW** (a new baked group `front`): the furniture nearer than the speakeasy's face (the corner trees, the near lamp, the
  cart, the planters) bakes on its own and draws OVER the speakeasy's live layer — a tree in front of a lit window stays in front of its
  light (`stage.js#furnitureSteps(L, T, keep)`; ~3 MB at 402 tier 2).

### 2. THE GHOST AD + THE CORNER (the plan's SIZE CHECK) — the owner decides
- **THE WEEKLY AD** (`ghostAdGame(ms, ids, avoid)`): one game a week (`AD_ORDER`, each every 12 weeks, the same for everyone), the swap
  Monday 09:00 UTC (4 am Eastern in winter). The billboard right behind the speakeasy picks tonight's game on its own, so on a night it
  shows THE SAME game the ad steps to the next in the rotation for that night (~1 night in 12).
- **THE CORNER TURNED** (`&force=corner-turn`, the panel's SPEAKEASY → CORNER TURNED; `harborLayout(cam, seed, { corner })`): the side
  wall swung out 30° (12 units, its far end in front of the road's kerb) → **78 / 81 / 86 pt** across at 390 / 402 / 430 — the ghost
  ad reads: a faded hand-painted 1920s wall sign (the game's sign colours sun-bleached toward the brick, the FULL NAME condensed + a drop
  shade, its tag line, "— PLAY TONIGHT —"), worn ALONG THE COURSES (runs of bricks where the paint let go, the lower corners worst, the
  mortar lines reading through), under THREE GOOSENECK LAMPS (the billboard's `drawGooseneck`) whose warm pools light it at night
  (`lamp` = the billboard's own `bill` ramp). The west stop light moves just past the wall's end; the wheel + the door stay where they
  were. **THE COST:** the wall's far end reaches the middle of the screen and hides the wheel's left leg + the pier deck — the wheel then
  reads as standing on the speakeasy's roof (Part 2's rule: "never reads as on a roof"). So it is a preview, not the default.
- **THE DEFAULT (the corner as it is) — the plan's fallback (3):** the front has no free brick band without losing windows (fallback 2),
  so the ad is a PAINTED BLADE SIGN (`BLADE`, `bladeGeo`, `paintBlade`): a wooden board on scrolled iron brackets out from the side
  wall by the corner, facing us (~22 × 75 pt), a stepped Deco top, the same weekly game in its sign colours — the full name stacked (two
  words: two columns), faded, the paint worn at the edges, the grain — and TWO GOOSENECK LAMPS over it lighting it warm at night (a lit
  copy, brightest at the top). Clear of the wheel's legs, the pier and the dock (tested at four phones).
- **ASK THE OWNER:** keep the blade (default), or the turned corner + the wall ad (and then move the wheel ~40 pt right, or accept it on
  the roof line)? Either way the weekly rotation, the lamps and Part 8's sign painters work the same (a ladder for the blade).

### 3. THE NEAR BRICK + THE LIGHTHOUSE (the owner's noon notes)
- **The bake resolution** was already right: `near` / `far` / `nearLit` bake at DPR 2 = the main canvas's at tier 2 (390: 33.1 / 64 MB,
  402: 35.7, 430: 41.7; nothing steps down). The softness was the M3 mortar: a half-device-pixel line at 0.36 alpha blurred into a
  tone. Now every brick line snaps to whole device pixels (`blocks.js#pxGrid`).
- **STYLISED READABLE BRICK** (day only, near + mid blocks): 3 device px a course on near blocks (2 on mid), running bond with kiln
  colours brick by brick, darker mortar (full bed joints, fainter heads), panel-to-panel batches (2–4 bays × 2–3 floors), SOLDIER-COURSE
  heads over the windows (`brickTrim(…, F)`), STONE QUOINS (`brickQuoins`), a stone CORNICE with dentils + a soldier frieze
  (`brickCornice`), sills with weathering streaks; the RETURNS in shade (`brickSide`: courses in perspective, darker toward the back) —
  a high sun darkens a side face a step; a low sun still lights it.
- **THE LIGHTHOUSE by day** (`lighthouse.js#cylinderTone`, `dayTower`, `dayPlinth`; laid over by `min(1, 2·T.day)` — never at night,
  golden hour or dusk): Lambert shading from the real sun's side (lit flank, terminator, a cool core shadow, a thin bounce light on the
  far edge, the limbs darker), the red / white stripes snapped to device rows (crisp + bold), faint painted-masonry courses, rust
  streaks under the gallery corbels + each window, a salt-worn mottled base, a coursed rough-stone plinth. Proved with `pixdiff.mjs`:
  night 89 px (the billboard's lamps' noise), party 1 px, dusk 0, golden only the drifting clouds.

### 4. THE PREVIEW PANEL, TIDIED
(`core/harbor-remote.js` + `screens/harbor/remote.js` + `css/harbor-remote.css`; the owner: "it's getting so cluttered")
- **COLLAPSIBLE CATEGORIES from the registry** (`CATS`; every EVENT names its `cat`, `group` is its sub-heading; `catOf(id)` falls back to
  TOOLS; `checkRegistry()` + a unit test): TIME · WEATHER (+ rainbows, lightning, freeze) · SKY EVENTS (messages, aircraft, up high,
  fireworks + the holiday sky, birds) · LIGHTS (the towers, the waterfront) · SIGNS (the city's neon + SPELL-ON, the billboard's lamps, the
  NEON sign + FIRST-TAP) · PARTY SHOW · HARBOR (the wheel, the beam, Rosie, the taxi) · SPEAKEASY (the string lights' party, CORNER
  TURNED) · HOLIDAYS · MUSIC · TOOLS (readout, grid). Collapsed by default; the open ones remembered on this device (`nd:hr-open`);
  each header 52 pt with a count, a dot when something inside is on (green JUST ME / pink EVERYONE), a one-line "what's on", a chevron.
- **PINNED** (sticky, opaque): the title, JUST ME / EVERYONE, the status (two lines) + CLEAR ALL. While the sheet PEEKS (a sky piece just
  started) only the status + CLEAR ALL. EVERYONE mode may grow to 84dvh; its send bar is one row.
- **TIME, in order:** SUNRISE (the real sunrise + 5 min) · MORNING · NOON · AFTERNOON · GOLDEN HOUR · SUNSET (the real sunset − 5 min) · DUSK
  · NIGHT (+ MORE: 3 AM · POWER-DOWN · DAWN · POWER-UP); a tap sends a concrete `when` (Grand Rapids, Oct 22: 08:09 + 18:43).
- **THE WORD TOWERS' TEXT BOX** (`core/harbor-windows.js#towerCapacity / fitText / badChars`, `lights.js#build` — several tickers at once):
  type a message, pick AUTO / A / B / VERTICAL / A + B / A + B + V (+ the style, now with SCROLL), the room per tower live under the box
  ("A HAPPY 5 of 5 · B BIRTHDAY 8 of 4 — SCROLLS"). A message too long for one tower goes ONE WORD PER TOWER; a word too wide for its tower
  SCROLLS there. **The limits (every upright phone + desktop): 3 towers — A 19 × 11 windows (2 lines of ~5 letters), B 15 × 9 (1 line of
  ~4), V 5 × 18 (3 letters down).** Most letters are 3 windows wide (N Q 4; M W ♥ ★ 5; ⚑ 7; I ! . ' 1). 44 characters: A–Z, 0–9,
  ! ? - . ' and ♥ (type <3), ★ (*), ⚑ ([flag]); a scrolling message up to 120 characters. A phone sideways: A has no room, B 4 letters on 2
  lines, V 1 letter.
- **New rows:** CORNER TURNED, FIRST-TAP SURGE (the title reads the live force set: `scene.forced(id)`), SPELL-ON ROUND.
- The pill shows only once its stylesheet has loaded (it flashed unstyled at the page's foot); beside the music button under a dev slot's
  TEST SLOT tag. E2E (`panel`, 21 checks): each preview in its registry category, all collapsed at first, headers ≥ 44 pt, the open ones
  remembered, CLEAR ALL pinned at the bottom, the word towers from JUST ME and from EVERYONE (`city2/live`).

### Hooks for 7b (THE LIFE)
`harbor().speakeasy`: `windows()` → `[{ id, room, floor, col, edge, rect }]` (screen pt; the rooms in `ROOMS`), `light(id, k | null)`
(a window's own level over the timeline), `roomDraw(id, fn(c, win, f))` (a moment's own painter over its window, each frame),
`mirror(k)` (the hidden door's opening — a hook only; the mirror wall is painted in the shop), `pole({ on })` (the raid), `door` (the
knock's rect), `ad`, the debug numbers (`k`, `sidePt`, `mb`). The rooms' still looks live in `speakeasy.js#room()` (one branch per
`lit` kind) — 7b's moments draw over them. `GROUND` names the shop + the basement. The roof deck is free for the parties + the garden
(`L.roof.planters` mark where the beds go; the deck shows only what stands above the parapet).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, golden hour `T18:20`, night `T22:00`, party `2026-10-24T23:00`, overcast `2026-10-22T13:00&wx=overcast`;
the corner turned: any of them + `&force=corner-turn`; the first-tap surge: a PRIVATE tab by day (no saved audio unlock), tap once
with the music on — or `&force=first-tap`; the spell-on round: `&force=spell-on`; the beat after returning: a party night, music on,
one tap, the home screen for ~30 s, back WITHOUT a tap — the lights keep punching, the readout says `beat direct-grid …`, the AUDIO
header `sounding DIRECT`.

### Tests (7a)
`harbor.test.mjs` (+12: the ghost ad's week + rotation + the billboard rule; the rooms by the hour; the speakeasy on four phones — the
front's size, the edge windows at half, the blade clear of the wheel + the dock, the turned wall ≥ 70 pt with the wheel + the door
unchanged + the west signal outside; the beat's source; the spell-on round; the panel's categories; the word towers' capacity; the
bake DPR; the brick by day only; the lighthouse cylinder; the sun's stages), e2e-harbor (+ the `speakeasy` group: six rooms, the edge
windows at 45 %, the rooms lit at night + the bar's warm pixel, unlit by day, the ad ≠ the billboard, the turned wall 78 / 86 pt; the
string lights on + mounted; music §9 THE BEAT IN DIRECT MODE; the FIRST TAP per mood; the spell-on cycle; the panel's categories).

### Performance (A/B in one run, `title-perf.mjs --ab` against eb6bbbb, 402×874, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | 5.27 → 3.84 · 5.47 → 3.61 · 2.31 → 2.37 | 16.8–17.2 · 0 % both | same ×3 |
| `np-night` (4×) | 6.69 → 4.66 · 3.66 → 3.80 · 2.45 → 3.97 | 16.8–17.4 · 0 % both | same ×3 |
| `np-party` (2×) | 8.36 → 8.44 · 4.67 → 5.00 · 3.47 → 3.77 | 16.8–17.1 · 0 / 0.3 % | same ×3 |
The first round (run while a helper's tests still loaded the machine) called tier 0 at night SLOWER (+0.9 ms of scene draw: the string
lights are ON now + the speakeasy's live layer); the one fix: at tier 0 the soft spill glows (round the windows, the sconce's wash, the
pole's halo, the blade's lamp cones) are skipped — the lit rooms, the lamps' lit paintings and the bulbs stay. Re-measured: same. The new
`front` layer is one more full-width band to blend (~220 pt tall).

### Known issues (7a)
- ~~The ghost ad's place is the owner's call~~ — the BLADE (8a; the corner-turn preview removed).
- ~~The corner tree hides the shop's door~~ — 8a's promenade keeps the door + the shop window clear.
- The ad steps aside for one night when the billboard shows the same game (it can't be both weekly AND never doubling the board).
- The back of the speakeasy's roof deck is hidden by its own parapet from this camera — 7b's rooftop life must stand taller than the
  parapet (people, the bar cart, the garden's tall plants) or the parapet needs a lower run there.
- No water tower (it would stand over the OVERCLOCK billboard).
- On a desktop the speakeasy is small at the left of the panorama (the wide camera) and its edge windows aren't cut at half (the rule is
  the upright phone's).
- The returns in shade on the near brick are a fairly deep maroon-violet (the city's shade colour) — `skyBlock#sideOf`'s 0.45 mix if heavy.
- The direct element's output figure (0) is reasoned, not measured on WebKit.

### Handoff → 8a (THE PROMENADE'S LOOK)
The front row now bakes on its own (`front`), over the speakeasy's live layer; `furnitureSteps(L, T, keep)` splits by depth. The corner
trees (`rel(-6)` z 37.4 and the right one) are placeholders that cover the shop's door — 8a decides the trees around the dock and the
shopfront. The speakeasy's side door (the knock), its two steps and the sconce mark where the doorman / the line stand (7b / 8b). The
string lights' `catenary` now spaces bulbs by screen distance (Part 8's promenade strings get that for free).
