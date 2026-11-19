# HIGH RISE (id `highrise`) — the tower-stacking game

**BEING BUILT — S1 (Nov 18 2026): THE RULES · S2 (Nov 18–19 2026): THE NIGHT LOOK + SOLO on an unlisted test page · S3 (Nov 19 2026):
THE DAY LOOK + THE LOOK SWITCH + THE FLYERS + DEEP SPACE + THE MOTHERSHIP, the 2 cards' art prepared · S4A (Nov 19 2026): THE SOUND
SYNC, THE HIDDEN CARTRIDGE (the owner's phone only, SOLO in a room), COUNTING built end to end — and switched OFF.** A 3D neon
glass-slab tower: one tap drops each slab, the overhang slices off, a PERFECT snaps into place. Its signs read HIGH / RISE stacked.
JAYWALK is its quality benchmark AND its engine formula (docs/jaywalk.md): a pure engine, a result = THE REPLAY of the player's own input
log, a preview on the live site. The owner's decisions: `docs/games/plan.md` "HIGH RISE — S1" · "— S2" · "— S2 FIX" · "— S3" · "— S4A"
(**NO DAILY for HIGH RISE** — the owner, Nov 18: the seed barely changes play; the engine's daily mode stays unused).

**HIGH RISE IS HIDDEN FROM PLAYERS (S4A)**: a HIDDEN cartridge — its `config.js` GAMES row is `playable: false` + `preview` (BEING BUILT):
no sign, no list, no board tab, no HOW TO PLAY, no meta at boot; **only THE OWNER's phone can start it** ("THE CARTRIDGE", below), and
**NOTHING IS AWARDED UNTIL GO-LIVE** ("THE SWITCH"). Its two addresses stay UNLISTED: **/highrise-play** (THE TEST PAGE — the real game's
two looks, SOLO; its door shut: **NOTHING COUNTS**, zero server calls) and **/highrise-lab** (S1's graybox — never counts). Read this page
before a HIGH RISE pass.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| S1 — THE RULES | Nov 18 2026 | `docs/games/passes/highrise-s1.md` | the engine, the replay + the judge (server half), the bot sims + the tuned speed curve, THE LAB (/highrise-lab) |
| S2 — THE NIGHT LOOK + SOLO | Nov 18–19 2026 | `docs/games/passes/highrise-s2.md` | THE TEST PAGE (/highrise-play — nothing counts): the glass tower, the cut + sparks, the perfect's ring, grow-back, the night plates + the reflection map, the HUD, YOUR BEST (this phone), the sounds + the audition; the rules: SOLO PAST 200 KEEPS TIGHTENING · the ranking by perfects |
| S2 FIX — THE LAG HUNT | Nov 19 2026 | `docs/games/passes/highrise-s2-fix.md` | the owner's phone check: the lag spikes found + fixed (THE LAG RULES, THE HITCH COUNTER on `?fps=1`), YOUR BEST's tape = a thin gold OUTLINE, THE END's FOOT (the PLAY AGAIN bar), the sounds as MP3 (121 KB) |
| S4A — THE SOUND SYNC + THE HIDDEN CARTRIDGE + COUNTING (OFF) | Nov 19 2026 | `docs/games/passes/highrise-s4a.md` | THE SOUND SYNC (a live run holds the audio context awake — HIGH RISE + JAYWALK), THE HIDDEN CARTRIDGE (the owner's phone only, SOLO in a room — the stage in the console's frame), THE PROOF (the `hr` node + its rules), THE JUDGE on the server, THE SWITCH (counting OFF: judged, WOULD COUNT, nothing awarded), the board, YOUR TABLE, THE NEXT FRIEND's pink tape, the 2 cards in the catalog (hidden) |
| S3 — THE DAY LOOK + THE FLYERS + DEEP SPACE | Nov 19 2026 | `docs/games/passes/highrise-s3.md` | THE DAY LOOK (frosted glass, one sun), THE LOOK SWITCH (AUTO · DAY · NIGHT, a 1.5 s cross-fade, never a hitch), THE FLYERS (the seed's Blackbird OR F-22 pair at 35–45 · the UFO at 85 · THE MOTHERSHIP from ~180), floor 200 (solo: the moment, then DEEP SPACE · `?mode=match`: THE FINISH + the gold card), the sounds final (ALL A), the 2 cards' art prepared |

## THE RULES (the owner's)
- **THE ONE RULE:** the same seed + the same TAP LOG → the exact same run on any phone and on the server (**REPLAY = LIVE**). Integers /
  fixed point only; no float, no `Date` / `Math.random` / `performance` in the rules.
- Square slabs. The slide alternates direction every floor (even floors along x, odd floors along z); THE SEED picks only which end each
  slab enters from (fully off the tower) — and its sweep's small wobble.
- **A DROP** = a tap on the sliding slab (or THE FUSE). The overlap with the slab below, on the slide axis:
  **PERFECT** (within 5 % of the STARTING width — a fixed window, it never shrinks) → it snaps exactly onto the slab below, the streak +1 ·
  **no overlap** → OUT, **MISSED THE STACK** · else the slab is **CUT** to the overlap (the streak ends) — and under 5 % of the start
  width on a side → OUT, **SLIPPED OFF**.
- **GROW-BACK:** after 6 perfects in a row, each further perfect (the 7th in a row and on) adds 4 % of the starting width back on that
  drop's slide axis — never past the start size.
- **THE FUSE:** an untapped slab drops by itself at the end of its 2nd sweep — the SAME drop; if it ends the run the cause is **TOO SLOW**.
- **THE LANDING BEAT:** 12 ticks after each drop there is no slab — a tap then is not a drop (ignored, never logged; the judge refuses a
  log that holds one).
- **THE MODES:** SOLO = endless · MATCH = floor 200 + a 6:00 cap · DAILY = floor 200 + a 5:00 cap (**UNUSED — NO DAILY for HIGH RISE**,
  the owner, Nov 18: the seed barely changes play; the mode stays in the engine). Floor 200 = **MADE IT TO THE
  MOTHERSHIP** (a finish, not an out). The cap ends a run where it stands. **THE RANKING (S2 — the owner, Nov 18):** THE FLOOR
  first; at the SAME floor (above all: the Mothership's finishers — every clean run stands on floor 200 within a second, the curve sets
  the pace) → **THE MOST PERFECTS** → then the EARLIER tick. Match + daily alike (`logic.js#rankCompare` / `standings`); the podium's
  line under a name = `perfectsLine` ("182 PERFECTS").
- **SOLO PAST 200 KEEPS TIGHTENING (S2 — the owner, Nov 18; SOLO only):** S1's curve was HELD from floor 120, so a near-perfect player
  never fell. Past floor 200 the sweep loses 3 ticks every 10 floors (floor 210, 220, …), never under 24 (`tuning.js#TIGHT`) — even a
  near-perfect player falls (the σ 10 ms bot on floor 383, 5:33 in; THE SIMS). MATCH + DAILY end ON floor 200 (their slab 201 never
  enters): **unchanged, tick for tick** — pinned by digests of S1's runs (`tests/highrise-engine.test.mjs` "SOLO PAST 200").
- **HIDING THE APP = NO PAUSE (S2 — the owner, JAYWALK's rule):** the run is on the clock; behind a hidden tab THE FUSE ends it (TOO
  SLOW).
- **FAIR TAPS:** a tap counts at the finger's TOUCH (the pointerdown's `event.timeStamp` → its tick), never "the next frame".

## THE NUMBERS (fixed point — `js/games/highrise/tuning.js`, every number of the rules in one place)
| what | value |
| --- | --- |
| the tick | 1/60 s (`TICK_HZ` 60) |
| the STARTING WIDTH (both axes) | `START` 10000 units |
| the PERFECT window | `PERFECT` 500 (\|offset\| ≤ 500) |
| GROW-BACK | `GROW` 400 a perfect once the streak is past `GROW_STREAK` 6, capped at 10000 on that axis |
| TOO THIN | `THIN` 500 (either side under it) |
| the travel | `TRAVEL` ±15000 (1.5 × the start width) round the top slab — at either end even two full-size slabs do not touch |
| THE FUSE | `FUSE_SWEEPS` 2 |
| THE LANDING BEAT | `BEAT` 12 ticks |
| THE SPEED CURVE | `SWEEP` — the ticks ONE sweep takes: **140 at floor 1 → 84 by floor 120 → held to floor 200** (straight line, integers); the seeded wobble `WOBBLE` ±3 ticks, never out of the band [84, 140] |
| SOLO PAST 200 (S2) | `TIGHT` { from 200, every 10, by 3, min 24 }: floor 210 → 81 · 220 → 78 · 300 → 54 · 390 → 27 · from 400 → **24**; the wobble's floor past 200 = 24 (`sweepFloorMin`). Under 30 ticks an ODD sweep has no perfect tick (the slab is never closer than 30000 / (2 S) > 500 units): nobody — no machine — climbs for ever |
| the modes | `MODES` solo { finish null, capTicks null } · match { 200, 21600 } · daily { 200, 18000 } |
| the feats (S3's cards) | `CLOUDS_FLOOR` 60 (`reachedClouds`) · `TOP_FLOOR` 200 (`reachedTop`) |
| the log's bounds | `MAX_TAPS` 20000 (solo; a finishing mode's = its 200 floors) · `SEED_MAX` 64 · `FLOOR_TICKS_MAX` = BEAT + 2 × 140 = 292 |

At the held speed (84 ticks a sweep = 357 units a tick) a pass still has 2–3 PERFECT ticks (33–50 ms); at floor 1, 4–5 (≈ 75 ms);
past floor 200 it narrows a notch every 10 floors (floor 300: 54 ticks a sweep = 1–2 perfect ticks).

## THE ENGINE
`js/games/highrise/` — JAYWALK's split: `tuning.js` (all numbers + MODES) · `engine.js` (the pure step) · `logic.js` (the end's words, the
seed, THE RANKING, the feats) · `replay.js` (the replay, THE JUDGE, the packed log) · `bot.js` (the sim players) · `tower.js` (view-only,
pure: the tower a view draws, built from the events) — S2's view modules: "THE TEST PAGE" on. PURE: no DOM, no
three.js; integers + `Math.floor` / `Math.imul` only; the one import outside the folder is `core/rng.js#hashString` (an integer hash).

**EVENT-DRIVEN.** The slide is a pure function of the tick, so nothing happens between a slab's entry, its drop and the next entry —
the engine jumps from one to the next (a judge's replay costs one step a tap, not one a tick).
- `createRun({ seed, mode })` → the run. The base slab (10000 × 10000, centred on 0) "landed" at tick 0: **the first slab enters at tick 12**.
- `stepTo(run, tick, ev?)` — every entry and every FUSE drop up to that tick, in order. THE CAP ends the run AT its tick, before
  anything else that tick (an entry, a fuse). A tick that is not a whole number moves nothing.
- `tap(run, tick, ev?)` → `true` = it dropped the sliding slab (the caller LOGS the tick) · `false` = no slab to drop then (a landing
  beat, the run over, the log full) — never logged.
- the state (read-only for a view): `floor` · `at` (the tick the last floor landed — THE RANKING's tick) · the top slab's EDGES
  `x0 x1 z0 z1` (integers; `topOf(run)` → `{ cx, cz, w, d }` for a view) · `st` ('beat' | 'slide' | 'out' | 'made' | 'cap') · `s0` `S` `e`
  (the slab's entry tick, its sweep ticks, its entry end ±1) · `streak` `perfects` `maxStreak` `taps` · `cause` ('miss' | 'thin' | 'slow') · `end`.
- `slabAt(run, tick)` → the sliding slab's edges + offset at a tick (a view eases between two ticks itself).
- `resultOf(run)` → `{ floor, tick, end, over, cause ('miss' | 'thin' | 'slow' | 'made' | 'cap' | ''), made, perfects, maxStreak, taps, feats: { reachedClouds, reachedTop } }`.
- **THE EVENTS** (`ev`, for the VIEW — each with its tick `t`): `spawn { floor, axis, from, S }` · `drop { floor, axis, off, fuse }` ·
  `perfect { floor, streak }` · `grow { floor, axis, by }` · `cut { floor, axis, side, piece: { lo, hi, size } }` (the piece's size + side
  are rules data; its fall is the view's) · `land { floor, x0, x1, z0, z1 }` (the slab as it lies) · `out { cause }` · `made` · `cap`.
  A drop's own events come together, in order: `drop` → `perfect` / `grow` / `cut` → `land` | `out`.
- **THE TOWER A VIEW DRAWS** = `tower.js#createTower(run, { onPerfect, onFall })` fed with those events — pure, and the slab lies where
  the engine's own `land` says, so no batching (two drops in one frame, a tap + the fuse with no frame between) can lose or double a slab
  (`tests/highrise-lab.test.mjs` "THE VIEW'S TOWER == THE ENGINE'S" — the fresh-eyes review's find). S2's looks build on it.
- **THE PURE EXTRAS** (view-only, but the same on every phone): `flyerFor(seed)` → 'blackbird' | 'f22' · `paletteFor(seed, floor)` → a
  colour index 0 … 23 (the seed picks where the wheel starts; one step a floor).

**THE TIMELINE of one floor** (a drop at tick `d`): the next slab enters at `s0 = d + 12`; it can be tapped at any tick `s0 … s0 + 2S − 1`;
at `s0 + 2S` THE FUSE drops it. A tap AT the fuse's tick, or AT the cap's tick, is too late. Two drops are never closer than 12 ticks
and never further apart than 292 (the judge's cheap bounds).

**THE SLIDE** (`slideOff(S, e, k)` — `k` ticks after entry): `offset = e × (15000 − floor(30000 × kk / S))`, `kk` = `k` on the first
sweep, `2S − k` on the second — a triangle wave; the floor is taken on the unsigned distance so the two directions mirror exactly (and
never a negative zero). The offset is the slab's low edge minus the top slab's low edge: 0 = dead on, at half a sweep.

**THE DROP's MATH** (integers, on the slide axis; `size` = the top slab's side): `|off| ≤ 500` → PERFECT (the edges = the slab below's;
past a streak of 6: + `min(400, 10000 − size)`, half on each side) — **PERFECT IS JUDGED FIRST** (the plan's order: a slab cut to exactly
500 and dropped exactly 500 off snaps on; pinned by a test) · `|off| ≥ size` → OUT (miss) · else the kept edges are the overlap
(`off > 0`: the low edge moves up by `off`; `off < 0`: the high edge moves down) and a side under 500 → OUT (thin). A missed / slipped
slab does not count as a floor.

**FAIR TAPS in the engine:** `tap(run, T)` takes the tick of the TOUCH, which may be EARLIER than the tick the run was already stepped
to (a frame ran between the finger and the handler). While a slab slides nothing else happens, so the drop at `T` is exact — and the
judge, which plays the log in order, lands on the same state (`tests/highrise-engine.test.mjs` "FAIR TAPS"). The clock → tick mapping is
`logic.js#tickOf` (the NEAREST tick).

**The builder's calls (S1 — the owner may overrule):** the travel is centred on the TOP SLAB (so "dead on" is always half a sweep after
a slab enters, whatever the tower's drift) · PERFECT is judged before "no overlap" · with the travel at ±1.5 widths the fuse's slab is back at its entry end, fully off the
tower — THE FUSE's drop always misses (the code path is still the one drop: only the cause differs) · the base "lands" at tick 0 (a
beat before the first slab) · grow-back is centred on the slab · the cap's words are TIME'S UP (`logic.js#END_WORDS`) · the wobble is
clamped to the band (floor 1 only wobbles faster, the held speed only slower).

## THE JUDGE
`replay.js#judgeRun({ seed, mode, taps })` — ONE function for the phone's check and the server: `{ ok: true, floor, tick, end, cause,
made, perfects, maxStreak, taps, feats }` | `{ ok: false, why }`. The floor is the judge's own replay — there is no field for a claimed one.
**`mode` is REQUIRED** (a missing one is never quietly judged as solo — no finish, no cap). Nothing throws: every hostile input gets its
`{ ok: false, why }`. `taps` = the ticks the player tapped at, rising (`packTaps` / `unpackTaps`: the gaps in base 36, '.' between — S2's
run node; CANONICAL only — `packTaps(unpackTaps(s)) === s` — and a string longer than any log packs to is refused unread: `why: 'log'`).

| refused (`why`) | what |
| --- | --- |
| `mode` | missing, or not 'solo' / 'match' / 'daily' (only the MODES' own names: never 'constructor') |
| `seed` | not 1 … 64 printable ASCII characters, no space (nothing a transport could turn into another seed; `seedOf` makes [0-9a-z]) |
| `taps` | not a list |
| `too many taps` | more taps than the mode has floors (200) / than any run holds (20000) |
| `entry` | a tick that is not a whole number ≥ 0 |
| `ticks not rising` | a tick ≤ the one before it |
| `in the landing beat` | a tap with no slab to drop (closer than 12 ticks to the drop before it; before the first slab) |
| `past the cap` | a tick at / after the mode's cap |
| `after the fuse` | a gap of 292 ticks or more — the fuse had dropped that slab ("a log longer than any honest run could be") |
| `past the end` | a tap after the run was over (an out, the finish, the fuse's own drop) — found by the replay itself |

The cheap bounds (`tapsProblem`) only NAME what the engine's own `tap()` refuses: the judge then replays the log and refuses any tap
that `tap()` returns false for. A log the phone's recorder made (it logs a tick only when `tap()` returned true) always passes.

**THE SERVER HALF:** `api/_lib/highrise.js` — PURE, NOT a function (the 8 stay 8), imports the SAME `js/games/highrise` modules (as
`api/_lib/jaywalk.js` does): `judgeRun` · `judgePacked({ seed, mode, log })` · `serverRow(v)` (the row a report reads) · S4A:
`verifyNode` · `highriseSolo` · `highriseMatch` (S4B's half) · `HIGHRISE_COUNTS`. **WIRED into `/api/report` since S4A — behind THE
SWITCH** ("THE PROOF" + "THE SWITCH", below). `tests/highrise-server.test.mjs`: honest bot logs
accepted, every forged case refused by name, the judge == the live engine for 500 bot runs across all modes.

**FOR S4 (the wiring — S1's review notes; counting moved from S2 to S4, nothing calls the judge yet):** an EMPTY log is an honest run (`ok`, floor 0, TOO SLOW) — a
report must not count it as a play · the judge knows nothing of the SERVER's clock: a perfect log can be computed offline, so the run
node needs JAYWALK's server-timestamped chunks + THE SPEED CHECK (docs/jaywalk.md "THE REPLAY + THE PROOF") · `replay`'s `until` (a
match scored as it stands) takes a whole tick ≥ 0 — a bad one counts nothing · a run is on the wall clock: hiding the app lets THE
FUSE end it (the owner's call for the solo game + the daily).

## THE SIMS
`bot.js`: a bot AIMS AT THE PERFECT MOMENT of each slab (half a sweep after it enters) and taps with a GAUSSIAN timing error σ (its own
seeded rng) — **sloppy 60 ms · casual 40 · good 25 · near-perfect 10**. They play through the real `tap()` (what they log, the judge accepts).
`node scripts/highrise-sim.mjs [seeds]` — 2,000 seeds a bot, solo + match. THE TARGETS (the owner's) set THE SPEED CURVE:
sloppy median 30–60 s · good 2–3 min · near-perfect on floor 200 in ≈ 3:00–4:00, most of its runs · casual between.

**The final table (S2 — 2,000 seeds a bot; SWEEP 140 → 84 by floor 120, ±3; past floor 200: −3 every 10 floors, ≥ 24; PERFECT 500; GROW 400 after 6; BEAT 12):**

| mode | bot | σ ms | time med (p10–p90) | floor med (p10–p90) | ≥ 60 | ≥ 200 | to floor 200 med (p10–p90) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| solo | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| solo | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| solo | near-perfect | 10 | **5:33 (5:22–5:40)** | **383 (359–398)** | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |
| match | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| match | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| match | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| match | near-perfect | 10 | 3:28 (3:28–3:28) | 200 (200–200) | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |

(S1's table is the same but for the solo near-perfect row: it was never out — all 2,000 runs stopped at floor 1200. With the
tightening a 7-ms player falls on floor ≈ 418, a 5-ms machine on ≈ 447 at 5:59: the game's ceiling is about six minutes.)
What changed from the starting numbers, and why: `docs/games/passes/highrise-s1.md` "THE TUNING" + `highrise-s2.md` "THE TUNING".
`tests/highrise-sim.test.mjs` = the FAST version (200 seeds) asserting the bands — a future tuning slip goes red there.

## THE LAB
**https://neonspeakeasy.com/highrise-lab** — `highrise-lab.html` (the site root — it deploys; noindex nofollow; linked from nowhere) +
`js/games/highrise/lab.js` + `graybox.js` + `css/highrise.css` (prefix `hi-`). Open to anyone with the link.
- **THE GRAYBOX** (three.js 0.160 — the same import map as jaywalk-lab.html): flat-shaded boxes; **THE DIAGONAL CAMERA** the real game
  will use (`graybox.js#CAM`: turned 45°, 33° down, a narrow 20° lens) climbing with the top slab; the first slab = 60 % of the screen
  width (on a wide screen, of a phone-shaped column — DESKTOP COMES FREE); the cut piece just falls away; a PERFECT flashes the top
  edge white. It builds its own tower from the engine's EVENTS (the lab's check: its top == the engine's).
- **Tap anywhere to drop** — the pointerdown's `event.timeStamp` → its tick (FAIR TAPS). The first touch only STARTS the run (tick 0 =
  that touch); TAP TO RETRY is the next run's start (the end's words stay 0.6 s first). Space / Enter on a keyboard.
- **THE HUD** (plain text, readable at 390 × 844): FLOOR big at the top · STREAK · the mode + its clock · SOLO / MATCH / DAILY (`?mode=`) ·
  the seed (`?seed=` = the same slabs on every retry; else a random one, shown) · on OUT the cause's words big in the middle band (between
  the HUD and the top slab — the falling slab stays in view) + TAP TO RETRY. The mode switch + the seed are OFF the screen while a run is
  live (a thumb at the foot is a drop, never a restart) and back with the end's words.
- **After every run** the recorded log is replayed through a FRESH engine: **REPLAY = LIVE ✓** (or ✗ + the first differing tick).
  `?fps=1` = a frame-rate readout.
- **THE LAB NEVER COUNTS:** zero `fetch` / XHR / web socket / Firebase; it imports nothing from `/api`, the profile, progression, the
  report, share or the cards; nothing is stored. EVERY import is STATIC (its own engine files + `core/rng.js` + three.js): no dynamic
  import, so not even the skew wrapper's deploy check can run. No web font (the HUD is the system's monospace). (Precisely: this is the
  PAGE. On a phone the site's service worker already controls, `sw.js` itself asks `GET /api/time` at any navigation in its scope — ONE
  DEPLOY AT A TIME's build check, read-only, the same for /jaywalk-lab and every page; nothing of the run is in it.)
- **The tests:** `tests/highrise-lab.test.mjs` (unit — the page, the WHOLE module graph walked and proven clean, HIGH RISE invisible) +
  `tests/integration/highrise-lab.mjs "<chromium>" [outDir]` (the browser half, outside the sandbox: the lab at 390 × 844, a bot run
  through REAL taps, NO request but the page's own static files + the three.js CDN, no counted module, REPLAY = LIVE ✓, the shots).
  THE PAGES LOAD (`kit/page-loads.mjs`) opens it in the smoke test. The page's hook for the checks: `window.__hiLab`.

## THE TEST PAGE — https://neonspeakeasy.com/highrise-play (S2 — `highrise-play.html` · `js/games/highrise/play.js` + `stage.js` · `css/highrise-play.css`)
The real game's two looks + SOLO, on the live site, on a phone: the owner tests on cellular, his brother from a shared link.
**S4A: its run loop is `stage.js` — ONE module the page AND the cartridge mount** (the scene, the HUD, YOUR BEST, the flyers, the
sounds); `play.js` = the page itself: THE DOOR, its `?…` flags, its best (`hi:play:best`), and `createStage(app, { page: true, … })` —
the page's own pieces (the look switch, the SOUNDS list, the note, its own end card every run) are behind `o.page`. The page hands the
stage no proof, no report, no friends: it still counts nothing (`tests/highrise-play.test.mjs`).
**UNLISTED** (noindex nofollow; no page, no script, no manifest names it), **OPEN** (no gate, no sign-in). `?seed=` (the same slabs
every run) · `?fps=1` (the frame rate + **THE HITCH COUNTER** — below) · `?tier=0|1|2` (pins a quality tier) · `?mode=match|daily` (the
finish + the cap — **`?mode=match` = THE FINISH's preview**, S3: floor 200 → the white-gold light → the gold card; the page itself is
SOLO) · `?look=day|night` (S3: that look for this visit — nothing stored) · **`?floor=N`** (S3 — the LOOK CHECK, the JAYWALK lab's
`?lane=N`: the START tap plays N clean drops at once through the real engine and the run goes on LIVE from floor N — the flyby from
~30, the UFO from ~80, THE MOTHERSHIP + floor 200 from ~190, the finish with `?mode=match&floor=193`; REPLAY = LIVE holds; it never
moves YOUR BEST; the note says FROM FLOOR N).
- **NOTHING COUNTS UNTIL GO-LIVE (the owner, Nov 18):** no XP, no streak, no server best, no YOUR TABLE, no cards, no share card —
  scores start clean at launch (the tuning may still change). The run is the pure engine in the tab: **ZERO server calls, ZERO database
  writes**; the page's whole module graph (static + lazy) holds nothing from `/api`, the profile, progression, the report, share, the
  cards, Firebase or the store (`tests/highrise-play.test.mjs`). Its only requests: its own static files (its modules, the plates, the
  reflection maps, the sounds; S3: + the site's sun rule for AUTO — `games/kit/look.js` → `core/sky.js` + the three pure modules it
  reads —, the flyers' models `assets/jaywalk/models/{blackbird,ufo}.glb` + `assets/highrise/models/f22.glb` + JAYWALK's GLB reader, the
  city's four jet / UFO sound files), three.js from the import map's CDN, the fonts. Its only storage: `hi:play:best` (YOUR BEST —
  THIS PHONE) + `hi:play:look` (S3: the look's choice; S2's `hi:play:snd:<id>` picks are gone — the owner's are final). COUNTING (the judge wired into `/api`, the solo run node + the match proof node = ONE
  rules change) is S4.
- **THE DOOR (`play.js`, before the page mounts):** a shared module may call the server from wherever it runs — today the audio engine
  COUNTS a leave once (CITY G: `errlog.js#countQuiet('snd')` → one anonymous beacon to `/api/log`) and the skew wrapper asks `/api/time`
  if a module fails to link. On THIS page `fetch` + `sendBeacon` to `/api/…` stop before they leave the phone. PROVEN in the browser
  check: the page hidden with its sound on → the counter's module loads, **0 requests to `/api/`**. (The site's service worker, on a
  phone it already controls, still asks `/api/time` at a navigation — ONE DEPLOY AT A TIME, the same for every page; not the page's code.)
- **THE RUN** (`stage.js`): tick 0 = the START touch (S4A: START first waits ≤ 0.6 s for every sound's decode — "THE SOUND SYNC"); FAIR TAPS (the pointerdown's `event.timeStamp` → its tick); a tap in a landing
  beat is never logged; the events of a frame → `tower.js` (the engine's own `land`) → the view's moments → the sounds' cues. **NO
  PAUSE**: the clock runs on behind a hidden tab — back from it THE FUSE has ended the run (TOO SLOW; its batch sounds only its OUT:
  `LATE_MS` 900). While a run is LIVE the SOUNDS button + the foot note are off the screen (a thumb anywhere is a drop). THE END CARD
  comes 0.7 s after EVERY end — the fuse's or a tap's (the missed slab is seen falling) — and stays 0.6 s before a tap is PLAY AGAIN (a new seed).
  **REPLAY = LIVE ✓** under every end (the tap log through a FRESH engine, event by event — the owner's determinism check on a real iPhone).
- **THE HUD** (DOM over the canvas; written only when it changes; no layout read in the frame — the sizes are a ResizeObserver's): the
  big FLOOR NUMBER (84 px, each digit its own box; gold once YOUR BEST is passed) · THE BAND's NAME under it (it swells + lights up at
  an arrival) · THE ANNOUNCER LANE under that, one call at a time, a bigger moment never wiped by a smaller: PERFECT · PERFECT ×N ·
  STREAK ×10 (every 10) · NEW BEST (gold) · FASTER (every notch of the tightening past 200 — under a bigger call it waits its turn).
  Its one-shot + the band's arrival are Web Animations (opacity + transform; restarted with NO forced layout). (The altimeter = the match, S4.)
- **THE START**: the sign (HIGH / RISE stacked, pink over cyan), TAP TO START, the one rule, YOUR BEST n · THIS PHONE, and (S3) the three
  choices **AUTO · DAY · NIGHT** ("THE LOOK SWITCH", below). **THE END CARD**:
  the cause's words (the game's own table), FLOOR n, the band reached, "N PERFECTS · BEST STREAK n", YOUR BEST n /
  NEW BEST · WAS n (**MADE IT TO THE MOTHERSHIP = the whole card in GOLD** — the words, the floor, the perfects — and it waits 2.6 s
  (`MADE_HOLD_MS`) for THE FINISH's light: S3) — its foot above the top slab (the tower stays in view), its head under the SOUNDS button's row
  (≥ 58 px down — a phone in a Safari TAB is only ~660 px tall), on every size.
- **THE END's FOOT (S2 FIX — END-SCREEN STANDARD A, the owner):** ONE big SOLID glowing **PLAY AGAIN** bar at the foot of the end
  screen, in HIGH RISE's accent (`--hi-accent` — its sign's hot pink `#ff4fd8`, dark ink): full width inside the 16 pt gutters, 62 pt
  tall (58 on a short phone), a rounded RECTANGLE (8 px corners — never a pill), the replay arrow + the words, the glow static, on its
  OWN press + lift. **A tap ANYWHERE after 0.6 s is still PLAY AGAIN** — and the bar keeps the same wait (it comes up where the thumb
  was dropping slabs: a rhythm's next tap must not wipe the card unread). The card's own "TAP TO PLAY AGAIN" line is gone (one cue).
  With `?fps=1` the fps line moves up, clear of the bar. (The page builds its own bar — it loads no `ui/final.js`.)
- **THE HITCH COUNTER (S2 FIX — `?fps=1`, the last words of the line: `HITCH 2 (last: plate 48 ms @21)`):** the frames over **33 ms**
  in THIS run (after its first second; a tab that was away is not one; and over 1.5 × the phone's own usual frame — Low Power Mode
  draws at 30 Hz, every frame 33.3 ms: none of them a hitch) + the last one's CAUSE and floor — for the owner's screenshot.
  The cause = the one-off work the page did since the frame before: **plate** (a backdrop uploaded) · **compile** (a program built /
  the tier stepped) · **audio** (a decode landed / the limiter built) · **dom** (the HUD was written in that frame) · **gc** (none of
  those and the page's own frame code was quick — the pause was the browser's: most often a collection) · **unknown** (the page's own
  frame code was slow, with no mark). `window.__hiPlay.hitches()` = the list.
- **DESKTOP COMES FREE:** a wide screen gets the phone's own column (0.6 of the height wide), centred.
- **THE LOST CONTEXT** (JAYWALK's lesson): `webglcontextlost` → the scene is REBUILT — destroyed + created again on the SAME tower
  object, tier + gold tape — the moment the context is restored, or after 1.5 s; the listeners come OFF before any destroy (its own
  `forceContextLoss` is never "lost"). The browser check loses a context on purpose mid-run: a new canvas within 1.5 s, the run never stopped.
  A rebuild that gets NO context says so and KEEPS TRYING (every 1.5 s, eight times, and at once when the page is back in front) — the
  run goes on meanwhile. The glass shader asks for `derivatives`: it builds on a WebGL 1 phone too.
- **Locally:** `http://localhost:5173/highrise-play` · `node tests/integration/highrise-play.mjs "<chromium>" [outDir] [--look] [--perf]`
  (`--look` = the review's shots in BOTH looks: every band, the moments, YOUR BEST, the end, the sizes (`LOOKS=day`) · `--fly` = the
  flyers' shots · `--perf` = the measure (`PERF_Q='&look=day'`) · `--webkit` = Playwright's WebKit as an iPhone · `--review` = S2's
  fresh-eyes finds · `--s3` = S3's checks alone · `--hitch` = the long run, `HITCH_Q='&look=day'` by day). THE PAGES LOAD
  covers it. The page's hook for the checks: `window.__hiPlay` (`climb(n, off)` = real drops through the real engine, played at once · S3: `pickLook` /
  `setLook` / `look()` · `plan()` · `fly(kind)` · `flyInfo()`).

## THE NIGHT LOOK (S2 — `night.js` + `night-fx.js`; three.js 0.160 core only — the bloom + the sparks are ours)
A VIEW: it reads the run + the tower the page builds from the events; it never writes them; the rules never import it.
- **THE GLASS** — smoked glass + neon edges, **NOT three.js transmission**: ONE instanced mesh for EVERY box on screen (the slabs, the
  building's floors under the first slab, the sliding slab + its trail, the falling pieces, YOUR BEST's tape — `BOXES` 55) on a custom
  shader: the slab's colour as dark glass (the top face the brightest with a soft sheen, the left face lit, the right in shade, each
  side brighter up at its lit edge) · **THE REFLECTION MAP** (below) held in + half-tinted by the glass · a fresnel lift · **THE LIT
  EDGES** drawn from each face's own distance to its border (crisp at any size, no texture; a white-hot core + a halo in the slab's
  colour) · the tower dims as it falls away under the top slab (`uFadeH`). The sliding slab: a stronger colour, a brighter edge, a
  short trail behind it (tier ≥ 1).
- **THE BUILDING** under the first slab = full-size floors of the same glass, each its own colour: a tower from the first second.
- **THE CUT**: the overhang tumbles away (8 pooled pieces, fading) in **GPU SPARKS** along the cut (a spark = its start + its throw +
  its birth; the shader flies it under gravity as a streak — nothing is stepped on the CPU; 224 in a ring buffer; 12 / 22 / 34 a cut by
  tier; none with reduce motion). **A PERFECT**: the slab flashes white-hot + **A RING OF LIGHT** runs off its outline (the distance
  to its rectangle, in a shader; it reaches further as the streak grows). **GROW-BACK**: the slab swells out from the size it snapped
  to (240 ms) + a second ring in its colour. A landing: the edges flare + a small camera dip (none with reduce motion). A miss: the
  whole slab falls.
- **THE CAMERA** = `camera.js` (the lab's diagonal camera — 45° turn, 33° down, a 20° lens, the first slab 60 % of the screen's width;
  pinned equal to `graybox.js#CAM` by a test), climbing with the top slab.
- **TIERS** (the match kit's `createTiers`, automatic): **2** = the device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM (every material's
  `uBloom` pass — its lit edges, the sparks, the rings; the glass itself black, still hiding what is behind it — a half-res target,
  blurred at a quarter, added back) · **1** = DPR ≤ 2, no bloom · **0** = DPR ≤ 1.5, fewer sparks, no trail. **THE WARM FRAME**: one of
  everything far under the tower + one hidden frame (the bloom too) before the first slab moves. A resize only ASKS — the frame
  resizes first, then renders.
- **THE LAG RULES (S2 FIX — the owner felt random lag spikes at 60 fps; `docs/games/passes/highrise-s2-fix.md` has the numbers) —
  nothing is DECODED, COMPILED or THROWN AWAY in a frame:**
  (1) **A PLATE IS DECODED + UPLOADED AHEAD** — its bytes → `createImageBitmap` (decoded off the main thread; an `<img>.decode()` where
  it is missing) → `renderer.initTexture` AT ONCE, a whole band before the seam that first shows it (three's `TextureLoader` hands the
  GPU an `<img>`, decoded at its first draw: a 33–50 ms frame at every seam). An ImageBitmap's first row is at v = 0: the plate
  shader flips it (`uFlipA / uFlipB`).
  (2) **THE BLOOM PASS DRAWS TWINS** — a material drawn to the screen AND into a render target changes program each time in three.js
  (the target's colour space): it re-worked the program's whole key SIX times a frame — ≈ 2.7 MB of garbage a second. Every mesh has
  a twin material (the same shader, the SAME uniforms object) that is only ever drawn in the bloom pass (`night-fx.js#createBloom`
  "twins"). A NEW material that the bloom pass draws needs its twin (`night.js#twin`).
  (3) **THE WARM FRAME BUILDS EVERYTHING** — the tape's program too; a program built in a later frame is counted (`compile`).
  (4) **THE BLOOM IS KEPT through a tier step down** (Low Power Mode's probe steps 2 → 1 → 2 within four seconds — it used to throw
  the bloom's programs + targets away and build them again mid-run); it is built + drawn at tier 2 only.
  (5) **NO GARBAGE IN A FRAME THAT CHANGES NOTHING**: the HUD compares two numbers (no text built), the tag is written only when it
  moved, the plates' list is walked only at a seam's edge, the tier rule is asked six times a second (each asking sorts its samples).
  (6) **THE SOUNDS' one-off work is done at the unlock** — the decode AND the limiter (not in the first drop's frame).
- **MEASURED (the mini PC, 390 × 844 @3, the bot playing high in the clouds — a cut + its sparks every third drop; `--perf`):**
  **60.0 fps at every tier at 1× and 4× CPU** (p95 ≤ 17.3 ms, no frame over 18 ms) · tier 2: 10 draw calls a frame (4 the picture +
  the bloom's 6), ≈ 1,950 triangles · tiers 1 / 0: 4 calls, ≈ 970 triangles. A desktop GPU's numbers — the tiers are the phone's margin.

## THE DAY LOOK (S3 — the SAME scene + the SAME programs: `night.js` · `night-fx.js` `uDay` · `bands.js`; the owner's mockup: `Downloads\grok\highrise\mockups\highrise-day.png`)
Night = smoked glass + neon; day = **frosted glass in the sun**. The look is a VIEW (no rule, no replay, no server file knows it).
- **ONE SET OF PROGRAMS**: every material carries `uDay` (0 night … 1 day); the day's maths sit behind it, the night's are untouched at 0
  — so a look switch **builds nothing** (THE LAG RULES) and can cross-fade.
- **THE GLASS by day** (`GLASS_F`'s day branch): a milky body with **the band's pastel showing through the MIDDLE of each side face**
  (frosted toward the rims); **ONE SUN** behind the tower on the left (`night.js#SUN` −0.42 · 0.78 · 0.46) + the sky's cool fill — the
  top the brightest (warm where it faces the sun, cool away from it — never plain white: it keeps the band's tint), the face turned
  to the sun lit, **the other clearly darker + more saturated** (the fresh-eyes review: the two sides must read apart at phone size);
  **the slab above throws its shadow on a ledge** (each box is told the slab lying on it: `aUp` — a soft contact shadow + the cast
  one, on the side away from the sun); **a chrome rim** (a THIN bright line where it catches the sun + a darker line just inside it
  that is seen — polished metal reads by its contrast, a thick white line read as a line drawing); the
  DAY reflection map mirrored in it; **a soft glint** slanting down the lit face of the whole tower (it rides with the camera); **a
  light height haze** in the band's own air (`bands.js#DAY_HAZE`) where the night dims to black. **No bloom by day** (it fades with
  the night through a switch).
- **THE SLIDING SLAB by day** = **its band's ACCENT at full strength** (`bands.js#sliderColor`: the floor's pastel pulled 70 % of the
  way to `DAY_ACCENT` — a silver / white step would vanish on a sunlit sky) + a white-hot rim and its faces lifting to white toward
  the rim: the clearest thing on the screen. When it lands it is its floor's pastel (the landing's flare covers the turn).
- **THE DAY's LIGHTS ARE PAINT**: the sparks, the rings, the flyers' lights are drawn ONE · ONE_MINUS_SRC_ALPHA — by night their alpha is
  0 (added light, exactly as before), by day they are paint in their own colour: **a cut's sparks WARM GOLD** (1.7 × the night's
  size — paint must be seen), **a perfect's ring GOLD-WHITE** with a white-hot heart (gone sooner than the night's: a faint ring left
  hanging read as a smudge). **The gold tape** by day is **twice as thick** + gets **a darker outline** on both sides (no glow, no
  back edges: frosted glass is not seen through).
- **THE DAY BAND COLOURS** (`bands.js#SLAB_SETS.day` — the owner's pairs): rooftops = warm teal / white · skyline = sky blue / silver ·
  clouds = peach / rose · stars = deep blue / ice · deep space = violet / aurora. The day plates 4 + 5 are dark (the edge of space,
  deep space): there the day look is frosted glass on a dark sky.
- **THE WORDS BY DAY** (`css/highrise-play.css` `.hi-stage[data-sky='bright']`): **dark navy `#0d1740` on a soft LIGHT HALO** — the
  number, the band's name, the calls, the start + end screens; **GOLD by day = a bright amber-gold `#ffb81f` with a NAVY EDGE** (the
  mockup's own PERFECT ×7 — the number past YOUR BEST, PERFECT / STREAK / NEW BEST, the best lines; a dark gold read as rust: the
  fresh-eyes review); the PLAY AGAIN bar keeps HIGH RISE's hot pink; the tag + the note keep their own dark strips. **`data-sky`** = `bands.js#skyTone(look, floor)`: `bright` by day
  up to floor ~108, **`dark` from THE STARS up** (the day plates are dark there — the words go back to light) and always by night.
  Measured on the real pixels (the letters against what is right round them — `--s3`): the number 8.7–8.9 : 1 (gold, a navy edge),
  the band's name 6.4–12 : 1 (navy on its halo — the 6.4 over the clouds plate's royal blue).

## THE LOOK SWITCH (S3 — `look.js` · `play.js` · `night.js#setLook`)
- **AUTO · DAY · NIGHT on the START screen**: three plain neon-underline choices under the sign (≥ 44 pt, no pill, no label — they
  say what they are, and the row sits over the open water between the banks), each on its OWN press + lift (never the START tap); **remembered on this phone** (`hi:play:look`, try / catch); `?look=day|night` = that look for
  a visit. **AUTO = the real sun, by THE SITE's OWN SUN RULE** (`games/kit/look.js#sunUpNow` → `core/sky.js`: the city's sun at this
  phone's place — the same rule JAYWALK's GAME LOOK uses), asked again every minute; before it has answered (a lazy module) the
  clock's own guess (day 7–19) — its first answer before a run snaps, later ones cross-fade. (At go-live the game reads the
  console's GAME LOOK — `body[data-look]` — like every game; this switch is the test page's.)
- **THE SWITCH NEVER HITCHES**: `setLook` first brings the OTHER look's pictures in — the current band's two plates + its reflection
  map, all through the decode-ahead loader (bytes → `createImageBitmap` → `initTexture`) — and only THEN cross-fades over **1.5 s**
  (`LOOK_FADE_MS`; it never waits longer than 5 s for them). The plate shader holds BOTH looks' pairs (`tA tB` night · `tC tD` day —
  one program, one draw); the slabs' colours are blended in step. **Settled, only the look on screen keeps its plates + its
  reflection map** (`holds(look)`); a run in one look never even asks for the other's files. The page's words turn half way
  (`data-look`). Measured: a switch mid-run = **0 hitches, 0 new programs** (`--s3`).

## THE FLYERS (S3 — `flyplan.js` (PURE: when + which) · `flyers.js` (a LAZY module: the flying + its sounds) · `night.js`'s stage · `night-fx.js` `FLY_*` / `LIGHT_*`)
**SPECTACLE ONLY — never a hazard, never over the play zone, never under the HUD's numbers.** A VIEW: the rules know nothing of it.
- **THE PLAN** (`flyplan.js#flyPlan(seed)` — the same on every phone): **THE SKYLINE FLYBY** on a seeded floor **35 … 45** — the seed's
  `engine.js#flyerFor` picks ONE: **THE BLACKBIRD** alone, or **TWO F-22s in formation** — + the side it comes from · **THE UFO at
  floor 85** · **THE MOTHERSHIP** seen from ~178, colossal at **200**. A landing starts its moment (`flyDue` — two floors late still
  counts; further, it is missed).
- **LAZY, AND NEVER A HITCH**: `flyers.js` is fetched from **floor 20**; each MODEL + its sounds when its own moment nears
  (`flyNeeds`: the jets' from 20, the UFO's from 70, THE MOTHERSHIP's from 160). The two programs every flyer is drawn with (`FLY` a
  body · `LIGHT` its lights) + their bloom twins are **built in THE WARM FRAME on a stand-in triangle**; a model that lands brings
  only its buffers, **uploaded in an ordinary frame long before it flies** (`night.js#STAGE.upload` — one speck far under the tower);
  **a model is READ FAST** (`flyers.js#readFlyer`: the flyers' one GLB layout straight through typed arrays — 0.35 ms for the F-22's
  15,843 vertices where JAYWALK's general reader takes 6: a model lands mid-run, on a slow phone too).
  **Each flyer is REMOVED + FREED after its moment** (the next run fetches it again from the phone's cache).
- **IN THE CAMERA's OWN FRAME**: a flyer = a place on the screen + a depth BEHIND the tower (`toWorld`), so it keeps to **its band of
  sky — between the HUD's foot and THE DROP ZONE's upper edge** — while the tower climbs; drawn before the tower (the tower covers
  it). Checked on the canvas's own pixels: the play zone is the SAME with a flyer up as without (`--s3`). A flyer still in the sky
  when the END CARD comes fades out in a third of a second.
- **THE SKYLINE FLYBY** (3.4 s): in from one side near, round BEHIND the tower, out by the other — **banking round it (≈ 52°) so its
  top side shows**. THE BLACKBIRD = 46 % of the screen's width; each F-22 28 %, the wingman behind + beside the leader. **Night**:
  burner glow + a flame from each nozzle, red / green nav lights, a white tail strobe, a rim of light round a near-black jet;
  **day**: **the darkest thing in the sky** (the Blackbird near-black, hardly any haze over a jet) + **two white vapour trails**. **The city's jet sound** (`audio/city/jet-scream` — the Blackbird ·
  `jets-formation` — the pair), its loudest moment on the pass's middle, **panned with it**.
- **THE UFO** (8 s): JAYWALK's saucer model, **never JAYWALK's look** — **ten AMBER lamps** chasing round its rim (amber to their
  heart: `LIGHT_F` kind 4) + **a soft VIOLET underglow** (its belly + a flat pool of light under it); **no beam, no ground ring, no green**. Seen almost from the side
  (the classic saucer), wobbling; the city's UFO hum, quiet, panned.
- **THE MOTHERSHIP**: from floor ~178 a colossal DARK ship (2.7 screens wide) comes down overhead — its hull **built in code**
  (`flyers.js#shipHull`: a smooth 120-sided disc of near-black steel PLATING — every terrace three bands of plates, each its own
  shade, a darker seam between two —, three stepped terraces, a thick rim; JAYWALK's 28-sided saucer read as a pale polygon at this
  size), **MANY SMALL LIGHTS**: four turning rings on its belly + its rim's (~225 points, every 8th a brighter lamp, a wave running
  through them) + a lens, a deep hum building. The hull gives almost no light of its own — it stays DARK. **FLOOR 200, SOLO = the moment**: the camera glances up, its lights pulse, **"THE MOTHERSHIP"**
  in the announcer lane + the band-arrival sound — then it leaves (up and away, 5.4 s in all) and the climb goes on. **MATCH
  (`?mode=match`) = THE FINISH**: **a white-gold light pours onto the top slab** (a warm gold cone from where the ship's lens is SEEN
  down to the slab — widest + brightest ON the slab —, a pool on its top, gold rings running off it, rising sparks; the slab
  white-gold), the run is MADE → 2.6 s later the end card in GOLD (the hull stays dark and the lens + the light's head are turned
  down behind the card: its words stand on the dark ship).
- **THE MODELS**: `assets/jaywalk/models/{blackbird,ufo}.glb` = JAYWALK's own files (shared, cached; read by JAYWALK's GLB reader) ·
  **`assets/highrise/models/f22.glb`** (399 KB, 15,843 vertices) = the city's source model found on the Beelink
  (`art/models/f22/f22_raptor_free.glb`, 25 MB, git-ignored) through `node scripts/bake-model.mjs "<chromium>" highrise-f22`: the
  **gear-retracted** pose, the wheels + the ladder left out, its softened base maps baked into vertex colours, thinned by vertex
  clustering. Credits (CC BY — REQUIRED): `assets/highrise/models/CREDITS.md`.
- **ITS NUMBERS** = `flyers.js#FLY` · the sounds' mix = `MIX`. An effect asks `isUnlocked()` (a napping context plays); a hum stops
  at once when the page is left (the engine's bed hub).

## DEEP SPACE (S3 — `night.js` `SPACE_FROM` 200 · `SPACE_FULL` 212 · `night-fx.js` `space()`)
Solo, past THE MOTHERSHIP: over the last plate **slow drifting stars in two depths** (they twinkle) **+ an aurora's two ribbons**
(green into violet, waving slowly) come in from floor 200 to 212 and hold from there — both looks. Light only, in the plate's own
shader (one uniform, no new program, no extra draw).

## THE CARDS' ART — PREPARED (S3; the cards themselves are S4's)
**ABOVE THE CLOUDS** (floor 60 — `reachedClouds`) + **TOP OF THE WORLD** (floor 200 — `reachedTop`; Grok's v2: the colossal ship)
through JAYWALK's card pipeline: the masters COPIED to `art/highrise-cards/src/` → `node scripts/build-highrise-cards.mjs "<browser>"
[previewDir]` → `assets/vault/hi/above-the-clouds.webp` (34 KB) + `top-of-the-world.webp` (47 KB), 1280 × 720; **`js/fx/hi-specs.js`**
= each card's slim + full crops in JAYWALK's format (the picture set RIGHT — the hero 0.81 / 0.78 across the slim card, the left its
dark ground for a 12-letter name; the full card's art right at 80 % by its width) + the hero boxes. **NOTHING reads them yet**: no
catalog entry, no CSS class, no achievement, no award (`tests/highrise-play.test.mjs`). S4 adds + awards the cards (server-judged
runs only, hidden until go-live) and writes `.vl-s-hi-*` / `.vl-fcm-hi-*` from those numbers.

## THE HEIGHT AREAS (S2 — `bands.js`, PURE; the plates: `assets/highrise/plates/night-1…5.webp` · S3: `day-1…5.webp`)
| band | floors | its plate | its slab colours (four neons, walked one step a floor — `engine.js#paletteFor`) |
| --- | --- | --- | --- |
| THE ROOFTOPS | 0–24 | the harbour canal by night | pink → violet → blue → cyan |
| THE SKYLINE | 25–59 | the city far below | cyan → blue → violet → teal |
| THE CLOUDS | 60–109 | the cloud layer lit from below | rose → amber → magenta → lilac |
| THE STARS | 110–169 | the edge of space | ice → blue → violet → starlight |
| DEEP SPACE | 170 on | the aurora + the planet's curve | gold → coral → violet → aurora green |
- The plate is a screen-filling quad behind everything (in WebGL — the bloom + the glass blend over it); it COVERS the screen with
  `SLACK` 20 % of its height to DRIFT through — slower than the tower: from its foot as its band fades in to its top as the next takes
  over (the last band's drifts on, ever slower). Round a seam the two plates CROSS-FADE over 8 floors (12 at the skyline → clouds
  seam), centred on the upper band's first floor; a slab's colour blends the two bands' sets the same way.
- **Only the current look's set is asked for; only the current band's plate + the next one's are ever held** (`night.js#holdPlates` —
  a third is disposed the frame it is not needed) — plus the FIRST band's again while the end card is up (PLAY AGAIN never starts on a
  blank sky). No plate yet = a plain dark sky (the game never waits for a picture).
- **THE DAY SET (S3)**: the same five bands by day (day 1 = the owner's approved v2 redo) — the harbour canal in the sun · the city far
  below under a pale sky · inside the sunlit cloud layer (its top deep royal blue) · the edge of space (dark indigo, the earth's
  curve) · deep space (the aurora band, lighter than the night's). Their slab colours: "THE DAY LOOK", above.

## THE LINES — YOUR BEST (S2 — `best.js`, PURE · `night.js#setBest` · `play.js`)
- **YOUR BEST = a GOLD TAPE — a THIN glowing gold OUTLINE round the tower** (S2 FIX, the owner: the first one, four gold boxes, "read
  as a slab"): ONE line of light at the mid height of the slab of your best floor, all the way round — ≈ 3 px at 3× (its width follows
  the pixel: never under ~2 device px at any tier), a soft glow off it, NO fill, no lid; the edges turned away from the camera are
  drawn FAINT through the glass. Its own small mesh (`night-fx.js TAPE_F` — one draw, only while a tape lies on the tower; the line
  covers what is behind it, so its gold stays gold on a cyan slab; a deeper gold than the flash's). It lies on the tower at your best floor. **While that floor is
  ABOVE you** there is no tower there yet: it is a **right-edge tag "BEST 57 ▲12"** (gold, flat — no pill) at its floor's own height,
  HELD in the clear column between the HUD's foot and **THE DROP ZONE's upper edge** (`best.js#tagY` · `night.js#zoneTop` = the highest
  point the sliding slab's path reaches) — never over the drop zone. Standing ON it: "BEST 57 · ONE MORE". (A best more than 100 floors
  up is projected AS IF 100 up: further, the point is behind the diagonal camera and comes back mirrored.)
- **CROSSING IT** (the landing on floor best + 1 — once a run): the gold band appears round the slab of your best floor with a flash
  (a gold ring), **NEW BEST** in the announcer lane, the streak's sparkle a step higher, and the floor number turns GOLD for the rest
  of the run. **No tag, no tape on a first-ever run** (no best yet).
- **S2: the best is THIS PHONE's** (`hi:play:best`, written at a run's end when it is beaten — nothing counts until go-live). In the
  cartridge: the SERVER's best once counting is ON (`hi:best` — only ever written from the server's own answer), this phone's while OFF.
- **THE NEXT FRIEND = THE PINK TAPE (S4A — `lines.js`, PURE · `stage.js` · `night.js#setFriend`; the owner, Nov 19):** the LOWEST friend
  best still ABOVE you, from YOUR TABLE's HIGH RISE bests (the board `highrise-solo` through `/api/profile { action: 'table' }` — the
  SERVER's; **empty while counting is OFF**, so no friend line shows until go-live — the e2e proves the look with a fixture). Above
  you = the gold tag's twin **in PINK** at the right edge: **"LIAM 57 ▲12"** ("LIAM 57 · ONE MORE" on their floor), held in the same
  clear column — between the HUD's foot and THE DROP ZONE's upper edge — and a step above / below the gold tag when the two would
  meet. **Crossing it** (the landing on floor v + 1): a thin PINK tape lies round the slab of their floor (the gold tape's shader —
  the SAME program: a second tape builds nothing; its twins in the bloom pass), **PASSED LIAM** in the announcer lane (pink), the
  sparkle a step up — and the next friend above takes the tag. ONE friend at a time (one tag, one pink tape); SOLO only; never on the
  test page (it hands the stage no list). Gold stays YOUR BEST's, nothing else.

## THE SOUNDS (S2 — `sounds.js` (the PURE table + the triggers) · `sfx.js` · `audition.js` (the SOUNDS list); the files: `audio/highrise/`)
- **THE PICKS ARE FINAL (S3 — the owner, Nov 19: ALL A)**: drop as recorded · the chime starting an octave down · the slice = the
  glassy snap · every other sound its one take. **The B takes left the game** (the slice's backup file, the two in-code variants,
  this phone's picks, PLAY A / B + COPY MY PICKS): `sounds.js` = ONE take a sound.
- **THE FILES ARE MP3 (S2 FIX — the owner):** nine files, **117 KB** (S2 FIX shipped ten, 121 KB) (44.1 kHz mono, 128 kbps — `node scripts/build-highrise-sounds.mjs
  --lame <…/@breezystack/lamejs/dist/lamejs.js>`: a pure-JS encoder from npm, a BUILD TOOL given by path — never in package.json, never
  shipped; the build machine has no ffmpeg). The same level as the WAVs (each within 0.4–1.0 dB, decoded). **AN MP3's LEAD-IN IS
  SKIPPED AT PLAY** (`sfx.js#leadOf`): the encoder puts ~25 ms of near-silence in front of every sound — each starts at its first
  audible sample, so a drop's sound stays ON its tap.
- Through the SHARED engine (`audio/engine.js` — JAYWALK's pattern): the bytes fetched early (no AudioContext — nothing sounds before a
  tap), decoded once at the unlock, each sound a buffer source → its gain → a soft limiter (−8 dB, 8 : 1) + a trim → the console's SFX
  bus. **8 VOICES by PRIORITY** (your OUT 4 > the chime · the streak · a band's arrival 3 > the slice · grow-back 2 > a drop · the
  falling piece 1). Muted / locked / a missing file = nothing plays, nothing throws. With the site's MUSIC OFF (PODCAST MODE: the
  context naps between effects) the sounds still play — a source's own start wakes it (`sfx.js` asks `isUnlocked()`, never `running`).
- **THE TRIGGERS** (`sounds.js#cuesOf` — PURE: one frame's engine events → the cues): **drop** — every landing, never the same twice
  (pitch ± 4 %, gain ± 1.5 dB) · **perfect** — THE CHIME · **slice** — a cut · **falling-piece** — 0.1 s after its slice ·
  **grow-back** · **streak** — every 10 perfects in a row · **out** · **band-arrival** (the page's — it knows the band) · NEW BEST =
  the streak's sparkle at × 1.12 · **pass** = the match's (S4; in the audition only). A batch that came back from a hidden tab sounds
  only its OUT.
- **THE PERFECT CHIME climbs a bright MAJOR-PENTATONIC scale** — one step a perfect in a row, HOLDING at the top after 8
  (`CHIME_STEPS` 0 · 2 · 4 · 7 · 9 · 12 · 14 · 16 semitones: do re mi so la do′ re′ mi′) — the crystal bell's playback rate.
- **THE SOUNDS LIST** (the SOUNDS button, top left between runs → THE SHEET; it was S2's SOUND AUDITION): every sound, ONE **PLAY**
  each (the chime climbs its scale) — nothing to choose, nothing stored. Kept (the call) so every sound — PASS too, not in play
  yet — can still be heard on the test page. The game holds still under the sheet. THE FLYERS' sounds are the city's own files
  (`flyers.js#MIX` — "THE FLYERS", above).
- The levels are a FIRST MIX (set from each file's measured loudness — the pass log's table); the measured mix is the review's.
- A sound replaced: bump `sfx.js#HI_SFX_REV`; a picture: `night.js#HI_ART_REV`. After any change: `node scripts/build-file-hashes.mjs`.

## THE ASSETS (S2 — `python -P -E scripts/build-highrise-assets.py` COPIES the owner's delivery; Downloads\grok\highrise is only read)
- `assets/highrise/plates/night-1…5.webp` — the five painted NIGHT plates (Grok Imagine, 720 × 1280 → WebP q 90): **252 KB** ·
  `day-1…5.webp` (S3 — `--look=day`; day 1 = `day-1-rooftops-v2`): **251 KB**. Only the look on screen is fetched.
- `assets/highrise/env-night.png` — **THE REFLECTION MAP**: "Shanghai Bund" (Greg Zaal, Poly Haven, CC0) — its UPPER (sky) HALF ONLY
  (the slabs' side faces mirror it downward: the promenade, its people and its street-level signs never ship), 256 × 64, blurred (smoked
  glass is no mirror), tone-curved into 8 bits (`v = x / (1 + x)`, gamma 2.2 — the shader undoes it: the lights come back hot): **14 KB**
  (the 1.6 MB HDRI never ships). `env-day.png` (S3) = "Kloofendal 48d Partly Cloudy (Pure Sky)" (Greg Zaal + Jarod Guest, Poly
  Haven, CC0), the same way: **15 KB**.
- `audio/highrise/` — the nine sounds as **MP3** (S3: the slice's backup left with the B takes) (S2 FIX: 44.1 kHz mono, 128 kbps — `build-highrise-assets.py`
  makes the 16-bit mono WAVs from the delivery, `scripts/build-highrise-sounds.mjs` turns them into the MP3s that ship + removes
  the WAVs): **117 KB**, fetched after the page is up. All CC0 1.0 — `CREDITS.md` +
  `LICENSE.txt` (the site's Credits sheet gets its HIGH RISE group at go-live).
- `assets/highrise/models/f22.glb` (S3 — 399 KB; `scripts/bake/highrise-f22.mjs`) + `CREDITS.md` · `assets/vault/hi/*.webp` + their
  masters `art/highrise-cards/src/` (S3 — "THE CARDS' ART"; `/art` never deploys).

## THE SOUND SYNC (S4A — the owner, Nov 19: "sometimes the sound isn't in sync with the blocks"; he plays with MUSIC OFF, the phone's speaker)
- **THE CAUSE:** PODCAST MODE (CITY I — the site's music off, the effects on) NAPS the audio context 150 ms after each sound, and a
  drop comes every 1.4–2.4 s — so EVERY drop's sound had to wake the context first. On iOS a context resumes only inside a gesture's
  END (the finger's lift): the sound landed a variable beat after its slab.
- **THE FIX (1) — A LIVE RUN HOLDS THE CONTEXT AWAKE:** `audio/engine.js#holdAwake(on, who)` (a lazy chunk reads its hub
  `globalThis.__nsHoldAwake` — THE STALE-MODULE RULE). **A LEASE, never a latch:** a hold lasts `HOLD_LEASE_MS` 3 s and the game
  RENEWS it once a second from its own frame loop — so a game that ends, unmounts, crashes or is hidden loses it by itself; the end
  card lets it go at once (the context naps again on the start / end screens); a leave drops it in the same step as ever. It never
  changes the session type (still `ambient`: the phone's podcast keeps playing), never touches the music, the hush (muted = nothing
  runs) or THE CUT; with the music ON it is a no-op. **HIGH RISE** (the test page + the cartridge — `stage.js`) holds it from START
  to the end card; **JAYWALK** (the game, the daily, the lab) from the run's start to its end.
- **(2) — A DROP's SOUNDS ARE ASKED IN THE TOUCH** (`stage.js#soundNow`): the tap handler itself plays the cues of the events its
  drop made — never a frame later (`sounded` keeps the frame from asking them twice; the fuse's drop + the moments' cues stay the
  frame's).
- **(3) — EVERY SOUND IS DECODED BEFORE THE FIRST TAP:** START waits ≤ `START_WAIT_MS` 0.6 s for the decodes (`sfx.js#ready` /
  `whenReady`; a first-ever tap is also the audio's unlock) — so no sound of a run takes the late path (`sfx.js#lates()` = 0 in play:
  the checks assert it). In the console the sounds are decoded as the stage mounts.
- **MEASURED** (`node tests/integration/sound-sync.mjs "<chromium>"` — real touches, BOTH games, music ON and OFF; `--before` = the
  same run with the hold switched off in the page): each landing event (HIGH RISE drop · perfect · slice — JAYWALK hop) → the moment
  its sound was asked (`syncs`) → the engine's own record of that source's start (`voiceStarts`: at + how long it waited for a
  sleeping context). **AFTER: every gap ≤ 0.4 ms, 0 wake-ups, 0 naps in a live run; the context naps again on the end card. BEFORE
  (music off): a wake-up on most effects (8–9 in a 14-tap run), 10–13 ms each even in desktop Chromium** — on an iPhone the wait is
  the finger's lift. `tests/audio-session.test.mjs` "THE HOLD" = the same on the real engine over a fake context.

## THE CARTRIDGE (S4A — HIDDEN: THE OWNER'S LIVE TEST, JAYWALK H1 / H3's pattern; `meta.js` · `director.js` · `index.js` · `view.js` · `final.js`)
- **WHO CAN START IT: THE OWNER ALONE.** `config.js` GAMES row `{ id: 'highrise', … playable: false, preview: true }` → `isPlayable` /
  `isOwnerTest` are true only on a phone the SERVER said is the owner's (the radio gate — `ADMIN_PIDS`). **How:** the dock's **PLAY →
  HIGH RISE · TEST → PLAY NOW** (a private solo room), or HOST a room → PICK A GAME → HIGH RISE · TEST with nobody else in it. Nobody
  else's shelf, list, sign, board or HOW TO PLAY changes; a start from any other phone is refused (COMING SOON); the server counts a
  game being built for the owner alone (`api/report.js#reportableGame`) — and, until go-live, for nobody ("THE SWITCH").
- **S4A = THE SOLO RUN** (`index.js#start` returns null for a room of two or more — the console's COULD NOT START; **THE MATCH = S4B**).
- **THE BOOT IS UNTOUCHED BY THE GAME:** no meta at boot (the registry loads the cartridge by id — `registration.test.mjs`
  `HIGHRISE_WAITS`: meta · help · art · the board's tab → the go-live pass · smoke → S4B); THE BOOT BUDGET stays green (307 / 310
  modules, 6,478 of 6,500 KB — the pass added the GAMES row, the stand-in mark, the loader line, the board's row, the engine's hold).
- **THE SCREEN** = THE STAGE (`stage.js` — the SAME module the test page mounts) in the console's game frame: ☰ top-left + music
  top-right, the look = the console's GAME LOOK read LIVE (`body[data-look]` — no switch of its own), the music by look (`index.js
  #musicFor`: the day deck by day, the evening deck by night — JAYWALK's rule). None of the test page's own pieces.
- **THE RUN:** TAP TO START → **GO** ("THE PROOF") → the run on the SERVER's clock (tick 0 = GO; back on screen the clock is read
  again; hiding the app = no pause — THE FUSE ends it). A refresh mid-run takes the run back from its node.
- **THE END = THE CONSOLE's PODIUM FRAME** (`ui/final.js`; the body = `final.js#finalScene`): how the tower ended (the game's own
  words), FLOOR n, the band, the perfects, YOUR BEST / NEW BEST (the server's answer), YOUR TABLE (you + your friends' bests — slim
  cards, shown when a friend has one), and — while counting is OFF — the small line **WOULD COUNT · FLOOR 85 · +15 XP**. The foot is
  the console's: **PLAY AGAIN** (END-SCREEN STANDARD A, the game's ACCENT) · CITY.
- **PLAY AGAIN = THE INSTANT AGAIN** (`index.js#soloAgain` → `games/kit/again.js`): the next run = a match of its own (its own id,
  proof node, report), started at once — the tap WAS the PLAY AGAIN; **the stage is parked over the remount** (its WebGL context,
  programs, plates, decoded sounds kept ≤ 2.5 s — any other unmount frees it at once).
- **AN UNPROVEN RUN** (GO refused / unanswered for 4 s: no signal, or the rules not yet re-published): the game still PLAYS — on a seed
  of its own, never counted — and ends on the stage's own card (**NOT COUNTED — NO LINE TO THE BOARD**, PLAY AGAIN · BACK TO THE
  CITY). A proven run whose end never reaches the room (no signal) gets the same card after 6 s: NO SIGNAL — YOUR RUN COUNTS WHEN
  IT IS BACK.

## THE PROOF (S4A — `proof.js`, PURE: the phone, the host's director AND the server run it; JAYWALK's `jw` node, copied)
- **THE NODE** `rooms/{CODE}/hr/{matchId}/{uid}` = `{ go` (the SERVER's time, written ONCE at GO — the rules: `=== now`; **the seed is
  picked from it**: `logic.js#seedOf(code, matchId, go)` — nobody can shop for a tower; tick 0)`, c/{i} = { s, at }` (the packed taps
  of that chunk — the gaps in base 36, '.' between — + the SERVER's time it ARRIVED; append only, i 0–9999, ≤ 400 chars)`, e { f, t, w }`
  (the run's end, once — a SIGNAL for the host's step: never read as a score)`, k` (S4B's Call the Winner — its rule ships now)` }`.
  `registry.js#PROOF_NODE_LIST` + `NEW_PLAYER_NODES` (`hr`): the next start / PLAY AGAIN never wipes the just-finished run's node.
- **THE RULES** (`database.rules.json` `hr` — mirrored from `jw`; `rules.test.mjs` "the hr proof node"): the player's own uid + their
  own match only, only while it is on; GO once; a chunk written once with the server's time, never re-stamped, never deleted, bounded;
  the end once; **+ stricter than `jw`: no chunk and no end before GO, NOTHING after the end**; the host may delete ONE finished
  match's tree — never the live one's, never a player's node. **A RULES CHANGE: RE-PUBLISH `database.rules.json`.**
- **A LATE GO ANSWER NEVER TOUCHES A RUN THAT WENT ON** (the review — `view.js#askGo` `stale()`): every answer checks its own call
  first; a GO that lands after the 4 s wait marks the match's one GO spent (the next run there is unproven too); a rejoin reads the
  node from the SERVER, never the mirror.
- **THE VIEW's THREE WRITES** (`view.js`): GO (set, then READ BACK — never the phone's own estimate), a chunk (one a second while
  there are new taps), `e` (right behind the last chunk). Never anything once the match left `play` (an expected refusal — counted,
  never a row: JAYWALK's THE LATE PROOF CHUNK).
- **THE JUDGE OF A NODE** (`proof.js#judgeNode` / `judgeSolo`): the chunks → the tap log + its clock → **THE SPEED CHECK, BOTH WAYS**
  (`CLOCK` — JAYWALK's numbers: a chunk's last tap at most 2 s AHEAD of its own server time — a sped-up game, a log made in advance →
  REFUSED; its first tap more than 8 s BEHIND with no silence to explain it — slow motion → the run is CUT at its last on-time tap;
  **THE DROPPED SIGNAL** — a silence ≤ 75 s, then the queued chunks landing together and back on the clock within 15 s — is never
  held against the run) → `replay.js#judgeRun` (the SAME engine the phone ran). The host's podium rows (`director.js#scoreNode`) and
  the server's result both come through it. A phone's claimed floor is never read. **The host's podium reads its LIVE MIRROR**
  (`judgeNode({ mirror: true })` — the review: a chunk still in flight carries the phone's ESTIMATE of the server's time, a round
  trip early; the podium takes the times as never running backwards) — **the SERVER's judge is strict** (acknowledged stamps only).
- **THE SERVER** (`api/report.js` `PROOF_GAMES` — JAYWALK's two paths, generalised: `{ node, solo, match }`): a SOLO run is judged from
  the node on BOTH paths (the room still on that match · the room already moved on — PLAY AGAIN: `src: 'proof'`). `highriseSolo` builds
  the match (`sv`) the report reads; only an `sv` match earns a record / a card flag (`core/match-report.js#highriseExtra`); an EMPTY
  log (floor 0) is never a play; a refused log is named in `rejected`. `highriseMatch` = S4B's half, ready (THE FIRST GO's seed).
- **Known limit** (JAYWALK's): a bot that plays in real time is indistinguishable from a very good player.

## THE SWITCH (S4A — COUNTING STAYS OFF UNTIL GO-LIVE: the owner, Nov 19)
- **ONE server-side flag: `api/_lib/highrise.js#HIGHRISE_COUNTS = false`** — THE GO-LIVE PASS flips this ONE line.
- **OFF:** `/api/report` still does all the judging (the gate, the night record, the proof node replayed, every check) — then
  **returns before any claim or credit**: `{ ok, status: 'would_count', outcome: { none: true, would } }`. `would` = `{ floor,
  perfects, cause, xp, streak, best, table (the board's value), cards: ['clouds' | 'top'] }` — what the counted path WOULD have done,
  from the SAME pure step on a copy (`api/_lib/stats.js#wouldApply` — reads only) — or `{ skip }` (a refused / an empty run).
  **NOTHING is written**: no `results/`, no pstats, no profile, no board row, no card, no streak day, no owners' count
  (`server.test.mjs` + `e2e-highrise.mjs` compare the database before / after). The end card shows **WOULD COUNT · FLOOR n · +XP**.
- **ON (go-live):** JAYWALK's normal counted path — XP + the streak by JAYWALK's rules (THE SOLO LANE: a small XP for the day's first
  4 solo runs, `QUICK_SOLO`: no 45 s gap between quick solo runs), the best on the board **`highrise-solo`** (TALLEST TOWER — a tower
  as ONE sort number: the floor, then THE MOST PERFECTS, then the earlier tick — `logic.js#towerScore`, `core/boards.js` fmt
  `floor`; no tab on THE BOARD until go-live), YOUR TABLE, the cards.
- **The test flip:** on the LOCAL EMULATORS only, the database switch `testHighriseCounts` turns it on (`api/report.js#highriseCounts`
  — `emulated()`; never honoured in production).

## THE CARDS (S4A — in the catalog, HIDDEN until go-live)
**ABOVE THE CLOUDS** (`card-abovetheclouds`, rare — floor 60 in ONE run, any mode) + **TOP OF THE WORLD** (`card-topoftheworld`,
legendary — floor 200) and their achievements `above-the-clouds` / `top-of-the-world` (`api/_lib/catalog.js`): unlocked ONLY by the
feat flags of a run the SERVER judged (`highrise-clouds` · `highrise-top` — the proof node's replay → the row's `ft` →
`match-report.js#highriseExtra` → `pa.gf`; never a number a phone sends, never a host-written result). **Hidden** = nothing is awarded
while THE SWITCH is OFF, and a collection shows only what its player owns (the owner sees them in THE LAB: 225–228). S3's art +
`js/fx/hi-specs.js` are read now: `js/vault/strip.js` (the materials), `css/vault.css` `.vl-s-hi-*` / `.vl-fcm-hi-*` (the crops = the
specs' numbers — pinned), `vault/hero.js` + `layout.js` (the hero boxes), `api/_lib/lab-text.js`. No layer of their own yet (still
pictures).

## THE FILE MAP + THE TESTS
```
highrise-play.html  css/highrise-play.css           THE TEST PAGE + its HUD (prefix hi-; the site's tokens + THE SHEET)
highrise-lab.html  css/highrise.css                 THE LAB's page + its plain-text HUD (self-contained)
js/games/highrise/tuning.js engine.js logic.js replay.js    THE RULES (pure — the phone AND the server)
js/games/highrise/bot.js                            the sim bots          scripts/highrise-sim.mjs   the 2,000-seed table
js/games/highrise/tower.js                          the tower a view draws, from the events (pure — the lab AND the game)
js/games/highrise/play.js stage.js                  THE TEST PAGE (its door, its flags, its best) · THE STAGE: the run loop, the HUD, YOUR BEST, the lost context — the page AND the cartridge mount it
js/games/highrise/meta.js director.js index.js      THE CARTRIDGE (S4A — hidden): the thin meta · the pure host step · the contract
js/games/highrise/view.js final.js                  … its screen (the stage in the console's frame + the proof's writes) · the end screen's body + YOUR TABLE
js/games/highrise/proof.js lines.js                 THE PROOF (pure: the node's chunks, THE SPEED CHECK, the judge of a node) · THE NEXT FRIEND (pure)
js/games/highrise/night.js night-fx.js camera.js    THE TWO LOOKS (one scene, `uDay`): the scene + the flyers' stage · the shaders + the bloom · the camera's numbers (pure)
js/games/highrise/bands.js best.js                  THE HEIGHT AREAS + both looks' slab colours, the day's haze + the sky's tone · YOUR BEST's tag / tape (both pure)
js/games/highrise/look.js                           THE LOOK SWITCH's choice (AUTO · DAY · NIGHT — this phone; AUTO = the site's sun rule)
js/games/highrise/flyplan.js flyers.js              THE FLYERS: when + which from the seed (pure) · the flying, the lights, the sounds (LAZY)
js/games/highrise/sounds.js sfx.js audition.js      THE SOUNDS: the table + the triggers (pure) · the engine glue · the SOUNDS list
js/fx/hi-specs.js                                   THE 2 CARDS' ART as data (S3 — nothing reads it until S4)
js/games/highrise/lab.js graybox.js                 THE LAB (S1's graybox)
api/_lib/highrise.js                                THE JUDGE's server half (pure) + THE SWITCH (HIGHRISE_COUNTS) — wired into api/report.js (PROOF_GAMES) since S4A
assets/highrise/  audio/highrise/                   the plates + the reflection maps + the F-22 · the sounds   scripts/build-highrise-assets.py [--look=day]
assets/vault/hi/  art/highrise-cards/src/           the 2 cards' art + its masters   scripts/build-highrise-cards.mjs · scripts/bake/highrise-f22.mjs
scripts/build-highrise-sounds.mjs                   the WAVs → the MP3s that ship (a pure-JS encoder from npm, given by path)
tests/highrise-engine.test.mjs (21) · highrise-server.test.mjs (5) · highrise-sim.test.mjs (5) · highrise-lab.test.mjs (6) · highrise-play.test.mjs (16) · highrise-cartridge.test.mjs (13 — S4A)
tests/integration/e2e-highrise.mjs (59 — the emulators: the hidden cartridge end to end; `--fast` skips the counting-ON run) · sound-sync.mjs (42 — both games; `--before`) · rules.test.mjs "the hr proof node" · server.test.mjs "HIGH RISE S4A"
tests/integration/highrise-play.mjs (217 — the browser; --review · --s3 (125) · --webkit · --look · --fly · --perf · --hitch = THE LAG HUNT's long run) · highrise-lab.mjs (45)
```

## COMING
- **S4B** — THE MATCH: a room of two or more (the count, THE FIRST GO → the seed — `logic.js#matchStart` + `highriseMatch` are
  ready), the other towers' height tapes + the play-zone test, the altimeter, the announcer, WATCH, Call the Winner (its `k` rule
  shipped with S4A), THE FINISH, REMATCH, the smoke start. Each phone in its own day / night look (JAYWALK's accepted rule).
- **THE GO-LIVE PASS** (after THE REVIEW): `playable: true` + `HIGHRISE_COUNTS = true` (ONE line each), its meta at boot, HOW TO
  PLAY, its tile + icon, the board's tab, the site's Credits sheet's HIGH RISE group (the F-22, the Blackbird, the saucer: CC BY —
  `assets/highrise/models/CREDITS.md`), the cards' own motion.
- **NO DAILY** (the owner, Nov 18 — the seed barely changes play; parked idea only: a one-shot "TODAY'S TWIST"). Then THE REVIEW (+ the
  icon + the billboard poster briefs) and THE GO-LIVE PASS.
