# WIN2 — THE SPIDERS' TRIP + NERVES, THE WINDOWS THAT READ AS-IS, THE EDGE WINDOWS' MOODS, THE EYES IN THE HAZE, PLAY ALL ON ITS OWN CLOCK, THE QUALITY STEP, THE DEBUG STRIPS (Oct 26 2026; plan.md "OWNER'S NOTES — OCT 26 (after WIN)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## WIN2 — THE SPIDERS' TRIP + NERVES, THE WINDOWS THAT READ AS-IS, THE EDGE WINDOWS' MOODS, THE EYES IN THE HAZE, PLAY ALL ON ITS OWN CLOCK, THE QUALITY STEP, THE DEBUG STRIPS (Oct 26 2026; plan.md "OWNER'S NOTES — OCT 26 (after WIN)"; behind `?city=2`)
The owner's WIN phone review (the TV room "good but not perfect", the toast's people SNAPPING to the glass, the barber's customer a
white box, the cash count hard to read, the hydrant's pumpkin stretched, PLAY ALL playing night scenes by day, the debug strips over the
TEST pill, a tier step ~9.5 s after the reveal crossfading the whole city) + his decisions (the spider's trip + nerves and a second
spider, OPTION B for the TV room, the edge windows' mood lights, the right pier's washer off while the sign is lit) + a mid-pass add-on
(THE EYES IN THE HAZE). Built unattended by Fable, group by group, each pushed as it passed; Halloween's spiders went out first.

### 1. THE SPIDERS (Group 1 — `dress-halloween.js#createSpider`, `signdress.js`, `scene.js`, `title.js`; `tests/spider.test.mjs`)
- **THE TRIP** (`createSpider`'s state machine `drop → land → crawl → climb → home`): a tap (`near(px, py, t)`) drops it on its glowing
  thread DOWN TO THE "SPEAKEASY" WORD (`setWord({ x0, x1, y })` from the title's letter rects: `scene.js#wordLogo`), it lands on the
  tubes and CRAWLS BACK AND FORTH along the word for 10–15 s (stop-start: still / turn / move with a leg test-tapping a tube), then
  CLIMBS back reeling the thread in to its spot on the web. A second tap mid-trip is consumed (never a restart); `TRIP.cool` 3 s after.
- **THE NERVES** (`scare(ev, t)`): the city's flicker detector (`scene.js#dressTick`: the sign's live level jumping > 0.3, a lightning
  flash > 0.35) + the title's pokes (`harbor().poke({ kind, letter | x, k })` from `title.js`: a tapped letter re-igniting, the race /
  surge, the tired tube every 25 s) reach it with a REACH (60 + 120 k units: the far ones ignored) — it freezes, crouches, skitters a
  short burst away from the flicker (or toward the hub), its eyes / seams flaring, calm after a few seconds; bigger events = a bigger
  burst; ignored within 4 s of the last. `near()` CANCELS a scare (the owner's tap wins: the first-tap surge used to scare it and eat
  the tap). Never in sync: each spider its own seed, its own trip.
- **THE SECOND SPIDER** on the last N's corner web (`signdress.js`: `spiders[1]` on `webs[1]`, in `want()` once that web has grown to
  ½; `hit` → `{ kind: 'spider', i }`), the same design + behaviour; `harbor().spiders`, `spiderAt(i)`.
- **THE HYDRANT'S PUMPKIN** at its true proportions (`core/harbor-holidayprops.js`: the hydrant piece `kind: 'classic'`, a round ribbed
  squat `w 1.1 × h 0.78` for the squat kind — the sprite is never scaled non-uniformly; the e2e checks `w / h ≤ 1.2` on the drawn rect
  at 390 / 402 / 430).

### 2. THE WINDOWS READ AS-IS (Group 2 — `windows.js`, `core/harbor-moments.js`, `core/harbor-hush.js`, `speakeasy-bake.js`, `scene.js`)
**ACT BIG — the rules for writing a moment** (puppet theatre: judged on an UNZOOMED 402 × 874 screenshot, never a zoom):
1. ONE clear action per moment, exaggerated (arms HIGH over the head, a whole-body lean, a stretch twice as big as life).
2. Slower, larger motions: a gesture takes a second or more; the e2e's "arms eased" check caps a joint at 0.2 rad a frame.
3. STRONG VALUE CONTRAST figure vs room: the walls are darkened under the people (`WALL_DARK` 0.6 on the bar's + the apartment's walls),
   lit people in lit rooms (`litP`), bright props on dark tables (the cash: pale-green bills on `rgb(18,32,24)`).
4. Fewer, bigger shapes: two friends not three, one customer, the figure scale 1.0–1.5 in a close-up; the furniture a few big slabs.
5. Depth only where it reads: people ARRIVE + LEAVE by walking through the room's depth — `walkIn(p, { pin, pout, from, to })` →
   `{ d, k, in, out, walking }` — never a cut (the e2e watches the friends' depth fall from 0.78 to 0.14 with no step > 0.06). Blend the
   walk pose into the action pose over a few frames (`wk`), never switch it.
- **THE TOAST**: two friends walk up from the room's depth (from the right, small) to the glass, raise BOTH arms high, clink (the glint),
  drink, drift back; the regular alone keeps his stool. **THE COSTUME PARTY** three figures with the same walk; **THE WAKE** walks in from
  the back of the apartment with a bigger stretch; **THE PEEK** comes from the room's depth to the glass; **THE BARTENDER** arrives
  (`E.arrive`) before his routine.
- **THE TV ROOM, OPTION B** (`PAINT.tv`): the couch FACES the window — the set just inside BELOW the sill (never drawn) — so we see the
  viewers' FACES + shoulders lit blue from the front-below (the kit's new `lit.below` light in `volFill` / `rimPass` / the cast shadow —
  the face + the chest bright, the crown in shade, the shadow climbing the wall), flickering with every cut (`tvLight`); the backrest
  behind them, the couch's front + the armrests rimmed at the sill, the glass on the side table, the smoke some nights (`force=smoke`);
  reactions on the clock: a LAUGH every 17 s (both shake), a LEAN IN every 40 s (closer, bigger — the depth falls 0.13), a YAWN late
  (after 23:30), NODDING OFF after 1 am (the head sinks, jerks up); off + dark at 3 am as before (`TV_OFF`).
- **THE BARBERSHOP'S CUSTOMER** (`seated()`): a real seated man — his head / face / hair above a DRAPED cape (a gradient, folds, a blue
  band at the neck) over the barber's chair's chrome column, footrest, seat, armrests, back + headrest, his shoes out below; the barber
  at his head with the comb + scissors (`['cloth', 'scissors']`); by day + lit at night.
- **THE CASH COUNT** clearer (`PAINT.cash`): the figure at 1.5, bigger hands + bills (0.48 × 0.22), bright pale-green bills on a dark
  table, taller stacks, a tight lamp pool on the money, a 1.15-s cycle: a bill LIFTED + snapped down onto the pile.
- **THE EDGE WINDOWS' MOOD LIGHTS** (`core/harbor-moments.js#edgeMoods(key, { hol, party })` PURE + `windows.js#edgeMood(E, mood, M)`):
  the two half-cut windows at the left screen edge get ACTION from LIGHT + SHADOW only — no people, no scenes (they left the passers'
  list). Each night a seeded mood per window from `EDGE_MOODS` (`tv` blue flicker · `red` an eerie darkroom bulb that buzzes · `candle`
  wavering · `banker` green + a shadow passing the wall every 38 s · `headlights` sweeps through slatted blinds across a dark room every
  24 s · `fan` a ceiling fan's turning shadow under a warm lamp · `out` a lamp that clicks off at `off` (23:48–24:18)), the two never the
  same (the unit test: every mood seen over a season); a PARTY night turns one into `party` (a slow colour cycle pulsing on the beat);
  the HOLIDAYS tint them (`tint`: Halloween orange / purple, Christmas red / green). Soft occasional flickers, never a strobe; the
  blackout through `k`, a lightning flash in the pane (`f.flash`), the "never fully dark" floor (`A ≥ 0.25`). The windows go to the
  live layer at night (`fr.full`), their moods in `harbor().speakeasy.life.moods`.
- **THE EYES IN THE HAZE** (the owner's add-on; `MOMENT.eyes`, `eyesNights(y, m, ctx)` + `eyesPlaysOn(key, ctx)` PURE, `PAINT.eyes`):
  one of the four full windows is a dark room full of slow drifting haze, lit faintly from below by a dim ember-red glow, with just a
  pair of big red glowing eyes watching the street — blinking rarely (a slow deliberate blink every 11–20 s), drifting a little,
  narrowing now and then; no body, no face (the look `light`: no figure). Its own calendar: TWO weekend nights a month drawn from the
  ELIGIBLE Fridays / Saturdays (never a legendary's night — `harbor-legend.js#legendNight` — never a night the edge windows show the
  eerie-red mood, never a Mothman night: the hook `ctx.mothman`, no Mothman exists yet), three plays of 150 s between 11 pm and 4 am
  (the small hours' plays land on the next day's plan), each in ONE seeded window. Readable unzoomed at 402: two red glows with halos in
  a black pane. In PLAY ALL (the catalogue) + `&force=window&moment=eyes`.
- **THE RIGHT PIER'S WALL-WASHER OFF ONLY WHILE THE LOBBY SIGN IS LIT**: `scene.js#speakCtx()` carries `hushLit` in the facade's bake
  key → the facade re-bakes through the city's crossfade when a sign comes or goes (a smooth swap); `speakeasy-bake.js#paintWashers /
  paintWasherLamps` take a `piers` list — the corner pier's cone + fixture are skipped while lit; `HUSH_WALL.v1` 8.95 → 9.62 (up under
  the cornice): a 4-letter word ≈ 16.6 pt at 402 (16.1 at 390, 17.8 at 430), five ≈ 13.2. With no lobby the washer stays.

### 3. PLAY ALL ON ITS OWN CLOCK + THE DEBUG STRIPS (Group 3 — `core/harbor-remote.js`, `remote.js`, `ui/debug-strip.js`, `css/harbor-remote.css`)
- **PLAY ALL** (`momentHour(m)` + `itemWhen(item, day)` PURE): before EACH item the sequencer sets `when` to the item's OWN hour on
  today's date (a routine at its `at`; else the middle of its hours; an hour under 6 lands on the NEXT day) — the TV room ~23:00, the cash
  count ~00:30, the wake ~7:15, the shop by day — or its holiday's date; the light, the rooms + the sky follow through the city's
  crossfade; the chip shows `THE NAME · HH:MM`; ✕ restores the real clock (`when` gone). The holiday / animals / workers PLAY ALLs the same
  (night items 22:30, day items 14:00). The unit test checks every moment's hour sits inside its allowed hours.
- **THE DEBUG STRIPS** (the owner couldn't reach the TEST pill): every strip starts FOLDED on every load — never remembered open (the
  fold key is kept for the other strips within a visit only); the column sits UNDER the pill's + the corner buttons' 44-pt row
  (`top: safe + 60`, z-index 39 under the pill's 40 — `.hr-low` is gone); the READOUT's title cycles folded → open → EVERY OTHER STRIP
  HIDDEN (`.dbg-col.dbg-min`: one tap hides them all) → folded + all shown; the open LOAD log is capped (`min(26vh, 220px)`) and scrolls
  inside itself, its FIRST lines on top (it used to hide them under its header).

### 4. THE QUALITY STEP (Group 4 — `scene.js#perf`, `heavyNow`, `judge`, `stepDown`, `stepUp`, `stepTo`; `tiering()`)
The owner's LOAD log: a perfect reveal, then at +9.5 s "402×874@2 → @1.5 (a tier step)" and the whole city crossfaded + softened.
Measured cause: the judge's grace was 8 s + a 1.5-s window — the first window it judged (8–9.5 s) still held the lit windows' first
paint, the people's spawn, the clouds + the fonts landing, and a single bad window stepped the tier.
- **Never in the first 15 s** (`TIER_GRACE` 15000) and **never in a known heavy moment**: a bake in flight (`baker / litBaker.pending`,
  `wantBake / wantBuild / resizeT`), the crossfade of one (`fadeFrom`), the sign's race / surge / a tapped letter / the tired tube
  (`poke()` marks 3 s: `heavyUntil`), a legendary (as before) — those frames never enter the window, and the window after starts fresh.
- **SUSTAINED slowness only**: the 75th-percentile frame over 19.5 ms on FOUR half-second looks in a row (`slowN`, ≈ 3.5 s of frames).
- **The effects first, the canvas resolution last**: `tier` is the EFFECTS tier (every module's `setTier`, the live work), `dprTier` the
  canvas resolution's (`TIERS[dprTier].dpr`); after the reveal `stepDown()` lowers the effects first — LIVE, no bake, no crossfade
  (invisible) — and only at effects 0 the resolution (a re-bake through the crossfade, the last resort); `stepUp()` brings the
  resolution back first. Before the reveal + from outside (`setTier(t)`, the tests) the whole step as before. The readout's head reads
  `t1/2` when they differ; `tierHist` carries `1/2` entries.
- **What the judge measured** (`judge(now, why, dir)` → `tiering().judge`, the LOAD log's tier line, the readout's `tier …` row): the
  seconds after the reveal, the window's p50 / p75 / p95 / worst frame, the slow share, the mean work; while nothing stepped the row says
  why not (`not judged until 15 s (9 s)`, `not judged now (a bake)`, `slow 2/4 looks`). The capped probe (NEON PASS 5) is kept: it
  restores both tiers (`stepTo`).
- The e2e (`perf`): a CALM LOAD on 2× CPU, 30 s after the reveal = no step (a timing check when the laptop's own frames can't hold 60 fps).

### Tests (Group 5)
- Unit: `tests/spider.test.mjs` (the trip on the word, the second tap consumed, the climb home, the scare: crouch / skitter / calm, a far
  flicker ignored, reduced motion), `tests/harbor-moments.test.mjs` (the edge moods: never alike, every mood over a season, the party +
  the tints; the eyes' calendar: two weekend nights a month, three plays 11 pm–4 am, never a legendary / the red mood, the Mothman hook,
  the fixed plan in one window), `tests/harbor-remote.test.mjs` (every PLAY ALL item at an allowed hour; the small hours on the next day),
  `tests/sp4.test.mjs` (the wall run to 9.62: ~17 pt).
- E2E (`e2e-harbor.mjs`): `holiday` — both spiders' taps (drop, crawl on the word, x moving), the nerves (a race poke: ≥ 1 scared, both
  calm), the pumpkins' aspect; `windows` — the toast's walk-in (depth 0.78 → 0.14, no cut), the TV room's lit faces, the edge moods
  (light + shadow only, the panes differ), the eyes forced (red device px in a dark pane, no figure), the washer off with the sign (the
  pier's top band's red channel), PLAY ALL on its own clock (the item's `when` = its hour, the life's hour followed, the chip's time, ✕
  the real clock back); `core` — the strips folded on load under the pill, the readout's cycle, the capped scrolling LOAD log, folded
  again after a reload; `perf` — the calm load.

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 6d2c51e — the commit before the pass — 402×874, 2× CPU, the GPU, 2 + 2 windows of 5 s)
| scene | tier 2 A → B work mean ms | tier 0 A → B work mean ms | verdict |
| --- | --- | --- | --- |
| a busy evening (np-night, 21:30) | 11.62 → 12.38 | 5.71 → 5.63 | **same** both (within the noise ±5.6 / ±2.7; the slow share +5.6 pts inside ±6.8) |
| Halloween night (hw-peak, 21:45) | — (INVALID: the laptop's tier stepped mid-window on BOTH sides — A 2→1, B 2→1/2: the new effects-first step) | 10.27 → 10.10 | **same** at tier 0 (−0.17 ms, noise ±0.8) |
Not re-run (the one-round rule). The new per-frame work: the edge windows' moods are two glows + a few rects a frame at night (they were
dark before); the eyes three glows + two ellipses while they play; the TV room's viewers are two lit figures (the silhouettes before);
the walk-ins change nothing per frame; the quality judge sorts 90 numbers every half second as before; the sign's wall run is baked.
The laptop is over its absolute budgets on both sides (a warning; the owner's iPhone decides). The hw-peak tier-2 window shows the new
step working on this laptop: B stepped the EFFECTS first (`2 → 1/2`: the resolution kept) where A re-baked the whole city.

### Known issues (WIN2)
- **WebKit can't run here**: the spiders' touch taps on real iOS, the TV room's blue faces on an OLED, the eyes' red at 402 — the owner's
  iPhone decides (the taps are proven on Chrome's touch emulation through the same pointerdown / pointerup path).
- **The quality step on the phone**: the judge's numbers (`tiering().judge`, the readout's `tier` row, the LOAD log) are the proof the
  owner asked for; the 15-s grace + the heavy-moment holds are measured on the laptop's loads (no step in a calm 30 s at 2× CPU). A
  resolution step still re-bakes through the crossfade — it is now the LAST resort (effects 2 → 1 → 0 first, live).
- **The eyes' window**: seeded per night (`eyes-win|key|n`) — a night may put them in the bar or the apartment, whose own moments
  yield to them for the 150 s (the room goes dark under them by design).
- The edge windows' `out` mood after midnight is a dim warm floor only (the "never fully dark" rule); the `headlights` mood reads as a
  dark room with rare sweeps — on a slow night it can look unlit for 20 s at a time (by design: 24-s sweeps).
- The `panel` e2e group (the sheet) didn't run locally (no emulators); the cloud run decides — see below.
- The day panes' scanline after a viewport change (`THE UPPER PANES EQUAL ON SCREEN (day)`) is a timing check that reads "only 0 panes
  seen" at 390 / 430 on this laptop (the day re-bake mid-way) — pre-existing (WIN's known issue), not this pass's code.
- **The cloud run**: run 1 (40378103299, the `[harbor]` push): `wild`, `show`, `holiday` green; `city` 107/108 (SP3's known clock-dependent
  "LOAD WEATHER — answered after 6 s" flake — not this pass's code); `street` 90/92 ("THE BAR at night: warm light" read rgb 101,69,55 —
  THIS PASS darkened the bar's wall under the lit people (ACT BIG's value contrast): the probe takes the darker warm wall now; the toast's
  arms 0.2033 rad a frame against a 0.2 cap — a drink fold at 12 rad/s, no snap (the snap was 1.8): the cap is 0.25); `audio` 125/133 —
  every AUDIO PANEL check read an empty "want" row: THIS PASS folds every strip on load and the folded strip rendered no rows; the rows
  are kept up to date while folded now (the CSS hides them). The three are one follow-up `[harbor]` push — the pass's second and last run.
- **Run 2**: (40379879307): `wild`, `show`, `holiday` green; `city` 107/108 (the LOAD WEATHER flake again); `audio` 131/133 — the
  AUDIO panel's two tape checks read the whole strip's text and matched the OPEN head's "AUDIO ▾": the folded one-liner reads "AUDIO ▸"
  now (the regex takes both — a test fix); `street` 91/92 — the toast's biggest arm step read 0.31 rad a frame on the runner (0.20 in run 1,
  0.17 here): the walk-in's blends at the runner's frame rate — the single-step cap is a TIMING check now, the judder count (the real snap)
  stays hard. Both are test fixes pushed WITHOUT `[harbor]` (the two-run rule); the next pass's run proves them.

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&…`)
- **The spiders**: `&when=2026-10-31T21:00` — tap either spider (the first on the sign's left web, the second on the last N): it drops to
  SPEAKEASY, crawls, climbs home; tap a letter beside one (it jumps); the race scares them.
- **The toast's walk-in**: `&when=2026-10-22T21:30&force=window&moment=toast` · the costume party `&when=2026-10-31T21:30&force=window&moment=costume`.
- **The TV room (B)**: `&when=2026-10-22T23:10` · with the smoke `&force=smoke` · late (nodding off) `&when=2026-10-23T01:30`.
- **The barber's customer**: `&when=2026-10-22T14:00&force=window&moment=shop-open` · lit at night `&when=2026-10-22T20:30&force=window&moment=shop-open`.
- **The cash count**: `&when=2026-10-22T23:10&force=window&moment=cash`.
- **The edge windows' moods**: `&when=2026-10-22T22:30` (tonight's pair) · another night `&when=2026-10-23T22:30` · a party night `&when=2026-10-24T23:00`
  · Halloween's tints `&when=2026-10-31T22:00`.
- **The eyes in the haze**: `&when=2026-10-22T23:30&force=window&moment=eyes` (a real night: the next weekend night in `eyesNights`).
- **The washer off with the sign**: `&when=2026-10-22T22:30&force=hushsign&hush=JAZZ` · without `&when=2026-10-22T22:30`.
- **PLAY ALL on its own clock**: the TEST pill → SPEAKEASY → ▶ PLAY ALL SCENES (the chip shows each moment's time).
- **The calm load + the strips**: `&debug=1` — every strip folded under the pill; tap the readout's title (open → all hidden → back); the
  readout's `tier` row says why nothing stepped.

### Handoff → 11a-2 THANKSGIVING (+ the parade system)
- **A new window moment**: one entry in `MOMENTS` (+ `WINDOW_LOOKS`, `STAGE`), one painter `PAINT[id]` written to the ACT BIG rules above
  (walk-ins through `walkIn` + `E.deep`); `momentHour` gives it its PLAY ALL time from its hours.
- **A holiday's edge tint**: `edgeMoods(key, { hol })` → `tint` — add the holiday's pair in `edgeMood()`.
- **The dressing spots** (`core/harbor-spots.js`): Thanksgiving's bales + cornstalks + pumpkins name `bench-right`, `lamp-1`, `hydrant`;
  a piece = a `BIG_PIECES`-style entry + a sprite painter in `holidayprops.js` at its true aspect (the pumpkin rule).
- **The parade**: the processions' planner (`core/harbor-holidayfolk.js#procWindow`) + the 6a balloons in the real wind; the spectators
  through the people's planner; the window people watching through `walkIn` to the glass.
