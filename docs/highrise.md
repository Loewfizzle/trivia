# HIGH RISE (id `highrise`) — the tower-stacking game

**BEING BUILT — S1 (Nov 18 2026, `docs/games/passes/highrise-s1.md`): THE RULES ONLY.** A 3D neon glass-slab tower: one tap drops each
slab, the overhang slices off, a PERFECT snaps into place. Its signs will read HIGH / RISE stacked. JAYWALK is its quality benchmark AND
its engine formula (docs/jaywalk.md): a pure engine, a result = THE REPLAY of the player's own input log, a lab page on the live site.
The owner's decisions: `docs/games/plan.md` "HIGH RISE — S1 (approved Nov 18)".

**HIGH RISE IS INVISIBLE TO PLAYERS**: no GAMES entry, no `config.js` change, no boot / cartridge / registry change, no Firebase rules
change, no `/api` endpoint wiring (`tests/highrise-lab.test.mjs` "HIGH RISE IS INVISIBLE"). S1 = the engine + the judge + the bot sims +
a graybox lab. Read this page before a HIGH RISE pass.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| S1 — THE RULES | Nov 18 2026 | `docs/games/passes/highrise-s1.md` | the engine, the replay + the judge (server half), the bot sims + the tuned speed curve, THE LAB (/highrise-lab) |

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
- **THE MODES:** SOLO = endless · MATCH = floor 200 + a 6:00 cap · DAILY = floor 200 + a 5:00 cap. Floor 200 = **MADE IT TO THE
  MOTHERSHIP** (a finish, not an out). The cap ends a run where it stands. **THE RANKING:** height, then the EARLIER tick.
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
| THE SPEED CURVE | `SWEEP` — the ticks ONE sweep takes: **140 at floor 1 → 84 by floor 120 → held** (straight line, integers); the seeded wobble `WOBBLE` ±3 ticks, never out of the band [84, 140] |
| the modes | `MODES` solo { finish null, capTicks null } · match { 200, 21600 } · daily { 200, 18000 } |
| the feats (S3's cards) | `CLOUDS_FLOOR` 60 (`reachedClouds`) · `TOP_FLOOR` 200 (`reachedTop`) |
| the log's bounds | `MAX_TAPS` 20000 (solo; a finishing mode's = its 200 floors) · `SEED_MAX` 64 · `FLOOR_TICKS_MAX` = BEAT + 2 × 140 = 292 |

At the held speed (84 ticks a sweep = 357 units a tick) a pass still has 2–3 PERFECT ticks (33–50 ms); at floor 1, 4–5 (≈ 75 ms).

## THE ENGINE
`js/games/highrise/` — JAYWALK's split: `tuning.js` (all numbers + MODES) · `engine.js` (the pure step) · `logic.js` (the end's words, the
seed, THE RANKING, the feats) · `replay.js` (the replay, THE JUDGE, the packed log) · `bot.js` (the sim players) · `tower.js` (view-only,
pure: the tower a view draws, built from the events). PURE: no DOM, no
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
`api/_lib/jaywalk.js` does): `judgeRun` · `judgePacked({ seed, mode, log })` · `serverRow(v)` (the row a report will read). **NOT WIRED**
into `/api/report` — S2 (the solo run node), S4 (the match), S5 (the daily) do that. `tests/highrise-server.test.mjs`: honest bot logs
accepted, every forged case refused by name, the judge == the live engine for 500 bot runs across all modes.

**FOR S2 (the wiring — the review's notes, nothing calls the judge yet):** an EMPTY log is an honest run (`ok`, floor 0, TOO SLOW) — a
report must not count it as a play · the judge knows nothing of the SERVER's clock: a perfect log can be computed offline, so the run
node needs JAYWALK's server-timestamped chunks + THE SPEED CHECK (docs/jaywalk.md "THE REPLAY + THE PROOF") · `replay`'s `until` (a
match scored as it stands) takes a whole tick ≥ 0 — a bad one counts nothing · a run is on the wall clock: hiding the app lets THE
FUSE end it (the owner's call for the solo game + the daily).

## THE SIMS
`bot.js`: a bot AIMS AT THE PERFECT MOMENT of each slab (half a sweep after it enters) and taps with a GAUSSIAN timing error σ (its own
seeded rng) — **sloppy 60 ms · casual 40 · good 25 · near-perfect 10**. They play through the real `tap()` (what they log, the judge accepts).
`node scripts/highrise-sim.mjs [seeds]` — 2,000 seeds a bot, solo + match. THE TARGETS (the owner's) set THE SPEED CURVE:
sloppy median 30–60 s · good 2–3 min · near-perfect on floor 200 in ≈ 3:00–4:00, most of its runs · casual between.

**The final table (2,000 seeds a bot; SWEEP 140 → 84 by floor 120, ±3; PERFECT 500; GROW 400 after 6; BEAT 12):**

| mode | bot | σ ms | time med (p10–p90) | floor med (p10–p90) | ≥ 60 | ≥ 200 | to floor 200 med (p10–p90) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| solo | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| solo | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| solo | near-perfect | 10 | (never out: all 2,000 stopped at floor 1200, 18:35) | 1200 | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |
| match | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| match | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| match | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| match | near-perfect | 10 | 3:28 (3:28–3:28) | 200 (200–200) | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |

What changed from the starting numbers, and why: `docs/games/passes/highrise-s1.md` "THE TUNING". `tests/highrise-sim.test.mjs` = the
FAST version (200 seeds) asserting the bands — a future tuning slip goes red there.

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

## THE FILE MAP + THE TESTS
```
highrise-lab.html  css/highrise.css                 THE LAB's page + its plain-text HUD (prefix hi-)
js/games/highrise/tuning.js engine.js logic.js replay.js    THE RULES (pure — the phone AND the server)
js/games/highrise/bot.js                            the sim bots          scripts/highrise-sim.mjs   the 2,000-seed table
js/games/highrise/lab.js graybox.js tower.js        THE LAB (view only; tower.js = the tower from the events, pure)
api/_lib/highrise.js                                THE JUDGE's server half (pure, not wired)
tests/highrise-engine.test.mjs (20) · highrise-server.test.mjs (5) · highrise-sim.test.mjs (4) · highrise-lab.test.mjs (6)
tests/integration/highrise-lab.mjs (45 — the browser)
```

## COMING
- **S2** — the NIGHT look, the SOLO game, the solo run node (the tap log as server-timestamped chunks; `/api/report` wired to the judge).
- **S3** — the DAY look, the heights (the clouds at floor 60 … the top), the flyers (Blackbird / F-22), the cards.
- **S4** — the MATCH (floor 200 + the 6:00 cap; the match tapes).
- **S5** — the DAILY (floor 200 + the 5:00 cap).
