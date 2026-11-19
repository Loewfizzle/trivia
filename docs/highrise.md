# HIGH RISE (id `highrise`) — the tower-stacking game

**BEING BUILT — S1 (Nov 18 2026): THE RULES · S2 (Nov 18–19 2026): THE NIGHT LOOK + SOLO on an unlisted test page.** A 3D neon
glass-slab tower: one tap drops each slab, the overhang slices off, a PERFECT snaps into place. Its signs read HIGH / RISE stacked.
JAYWALK is its quality benchmark AND its engine formula (docs/jaywalk.md): a pure engine, a result = THE REPLAY of the player's own input
log, a preview on the live site. The owner's decisions: `docs/games/plan.md` "HIGH RISE — S1" + "HIGH RISE — S2".

**HIGH RISE IS INVISIBLE TO PLAYERS**: no GAMES entry, no `config.js` change, no boot / cartridge / registry change, no Firebase rules
change, no `/api` endpoint wiring (`tests/highrise-play.test.mjs` "HIGH RISE IS STILL INVISIBLE"). Its two addresses are UNLISTED:
**/highrise-play** (THE TEST PAGE — the real night look, SOLO; **NOTHING COUNTS UNTIL GO-LIVE**) and **/highrise-lab** (S1's graybox —
never counts). Read this page before a HIGH RISE pass.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| S1 — THE RULES | Nov 18 2026 | `docs/games/passes/highrise-s1.md` | the engine, the replay + the judge (server half), the bot sims + the tuned speed curve, THE LAB (/highrise-lab) |
| S2 — THE NIGHT LOOK + SOLO | Nov 18–19 2026 | `docs/games/passes/highrise-s2.md` | THE TEST PAGE (/highrise-play — nothing counts): the glass tower, the cut + sparks, the perfect's ring, grow-back, the night plates + the reflection map, the HUD, YOUR BEST (this phone), the sounds + the audition; the rules: SOLO PAST 200 KEEPS TIGHTENING · the ranking by perfects |

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
  MOTHERSHIP** (a finish, not an out). The cap ends a run where it stands. **THE RANKING (S2 — the owner, Nov 18):** THE FLOOR
  first; at the SAME floor (above all: the Mothership's finishers — every clean run stands on floor 200 within a second, the curve sets
  the pace) → **THE MOST PERFECTS** → then the EARLIER tick. Match + daily alike (`logic.js#rankCompare` / `standings`); the podium's
  line under a name = `perfectsLine` ("182 PERFECTS").
- **SOLO PAST 200 KEEPS TIGHTENING (S2 — the owner, Nov 18; SOLO only):** S1's curve was HELD from floor 120, so a near-perfect player
  never fell. Past floor 200 the sweep loses 3 ticks every 10 floors (floor 210, 220, …), never under 24 (`tuning.js#TIGHT`) — even a
  near-perfect player falls (the σ 10 ms bot on floor 383, 5:33 in; THE SIMS). MATCH + DAILY end ON floor 200 (their slab 201 never
  enters): **unchanged, tick for tick** — pinned by digests of S1's runs (`tests/highrise-engine.test.mjs` "SOLO PAST 200").
- **HIDING THE APP = NO PAUSE (S2 — the owner, JAYWALK's rule):** the run is on the clock; behind a hidden tab THE FUSE ends it (TOO
  SLOW). The daily will follow JAYWALK's daily rule (S5).
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
`api/_lib/jaywalk.js` does): `judgeRun` · `judgePacked({ seed, mode, log })` · `serverRow(v)` (the row a report will read). **NOT WIRED**
into `/api/report` — S2 (the solo run node), S4 (the match), S5 (the daily) do that. `tests/highrise-server.test.mjs`: honest bot logs
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

## THE TEST PAGE — https://neonspeakeasy.com/highrise-play (S2 — `highrise-play.html` · `js/games/highrise/play.js` · `css/highrise-play.css`)
The real game's NIGHT LOOK + SOLO, on the live site, on a phone: the owner tests on cellular, his brother from a shared link.
**UNLISTED** (noindex nofollow; no page, no script, no manifest names it), **OPEN** (no gate, no sign-in). `?seed=` (the same slabs
every run) · `?fps=1` · `?tier=0|1|2` (pins a quality tier) · `?mode=match|daily` (the pass's own check of the finish + the cap — the
page itself is SOLO).
- **NOTHING COUNTS UNTIL GO-LIVE (the owner, Nov 18):** no XP, no streak, no server best, no YOUR TABLE, no cards, no share card —
  scores start clean at launch (the tuning may still change). The run is the pure engine in the tab: **ZERO server calls, ZERO database
  writes**; the page's whole module graph (static + lazy) holds nothing from `/api`, the profile, progression, the report, share, the
  cards, Firebase or the store (`tests/highrise-play.test.mjs`). Its only requests: its own static files (its modules, the plates, the
  reflection map, the sounds), three.js from the import map's CDN, the fonts. Its only storage: `hi:play:best` (YOUR BEST — THIS PHONE)
  + `hi:play:snd:<id>` (the audition's picks). COUNTING (the judge wired into `/api`, the solo run node + the match proof node = ONE
  rules change) is S4.
- **THE DOOR (`play.js`, before the page mounts):** a shared module may call the server from wherever it runs — today the audio engine
  COUNTS a leave once (CITY G: `errlog.js#countQuiet('snd')` → one anonymous beacon to `/api/log`) and the skew wrapper asks `/api/time`
  if a module fails to link. On THIS page `fetch` + `sendBeacon` to `/api/…` stop before they leave the phone. PROVEN in the browser
  check: the page hidden with its sound on → the counter's module loads, **0 requests to `/api/`**. (The site's service worker, on a
  phone it already controls, still asks `/api/time` at a navigation — ONE DEPLOY AT A TIME, the same for every page; not the page's code.)
- **THE RUN** (`play.js`): tick 0 = the START touch; FAIR TAPS (the pointerdown's `event.timeStamp` → its tick); a tap in a landing
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
- **THE START**: the sign (HIGH / RISE stacked, pink over cyan), TAP TO START, the one rule, YOUR BEST n · THIS PHONE. **THE END CARD**:
  the cause's words (the game's own table; MADE IT in gold), FLOOR n, the band reached, "N PERFECTS · BEST STREAK n", YOUR BEST n /
  NEW BEST · WAS n, TAP TO PLAY AGAIN — its foot above the top slab (the tower stays in view), its head under the SOUNDS button's row
  (≥ 58 px down — a phone in a Safari TAB is only ~660 px tall), on every size.
- **DESKTOP COMES FREE:** a wide screen gets the phone's own column (0.6 of the height wide), centred.
- **THE LOST CONTEXT** (JAYWALK's lesson): `webglcontextlost` → the scene is REBUILT — destroyed + created again on the SAME tower
  object, tier + gold tape — the moment the context is restored, or after 1.5 s; the listeners come OFF before any destroy (its own
  `forceContextLoss` is never "lost"). The browser check loses a context on purpose mid-run: a new canvas within 1.5 s, the run never stopped.
  A rebuild that gets NO context says so and KEEPS TRYING (every 1.5 s, eight times, and at once when the page is back in front) — the
  run goes on meanwhile. The glass shader asks for `derivatives`: it builds on a WebGL 1 phone too.
- **Locally:** `http://localhost:5173/highrise-play` · `node tests/integration/highrise-play.mjs "<chromium>" [outDir] [--look] [--perf]`
  (`--look` = the review's shots: every band, the moments, YOUR BEST, the end, the sizes · `--perf` = the measure · `--webkit` = Playwright's
  WebKit as an iPhone · `--review` = the fresh-eyes review's finds). THE PAGES LOAD
  covers it. The page's hook for the checks: `window.__hiPlay` (`climb(n, off)` = real drops through the real engine, played at once).

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
- **MEASURED (the mini PC, 390 × 844 @3, the bot playing high in the clouds — a cut + its sparks every third drop; `--perf`):**
  **60.0 fps at every tier at 1× and 4× CPU** (p95 ≤ 17.3 ms, no frame over 18 ms) · tier 2: 10 draw calls a frame (4 the picture +
  the bloom's 6), ≈ 1,950 triangles · tiers 1 / 0: 4 calls, ≈ 970 triangles. A desktop GPU's numbers — the tiers are the phone's margin.

## THE HEIGHT AREAS (S2 — `bands.js`, PURE; the NIGHT plates: `assets/highrise/plates/night-1…5.webp`)
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
- (S3: the DAY set — `--look=day` in the builder; THE FLYERS; deep space past 200; THE MOTHERSHIP at 200.)

## THE LINES — YOUR BEST (S2 — `best.js`, PURE · `night.js#setBest` · `play.js`)
- **YOUR BEST = a GOLD TAPE** (a thin outline band round the slab, no fill) on the tower at your best floor. **While that floor is
  ABOVE you** there is no tower there yet: it is a **right-edge tag "BEST 57 ▲12"** (gold, flat — no pill) at its floor's own height,
  HELD in the clear column between the HUD's foot and **THE DROP ZONE's upper edge** (`best.js#tagY` · `night.js#zoneTop` = the highest
  point the sliding slab's path reaches) — never over the drop zone. Standing ON it: "BEST 57 · ONE MORE". (A best more than 100 floors
  up is projected AS IF 100 up: further, the point is behind the diagonal camera and comes back mirrored.)
- **CROSSING IT** (the landing on floor best + 1 — once a run): the gold band appears round the slab of your best floor with a flash
  (a gold ring), **NEW BEST** in the announcer lane, the streak's sparkle a step higher, and the floor number turns GOLD for the rest
  of the run. **No tag, no tape on a first-ever run** (no best yet).
- **S2: the best is THIS PHONE's** (`hi:play:best`, written at a run's end when it is beaten — nothing counts until go-live). THE NEXT
  FRIEND's tape (the same in PINK) arrives with S4's counting.

## THE SOUNDS + THE AUDITION (S2 — `sounds.js` (the PURE table + the triggers) · `sfx.js` · `audition.js`; the files: `audio/highrise/`)
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
- **THE SOUND AUDITION** (the SOUNDS button, top left between runs → THE SHEET): every sound, PLAY (the chime climbs its scale); where
  there are two takes PLAY A · PLAY B + USE A / B (remembered on this phone; the page plays the choice) — **slice**: the pick (a glassy
  snap) vs the delivery's backup (shorter, clickier) · **drop**: as recorded vs lower, "a heavier slab" (an IN-CODE variant) ·
  **perfect**: the chime starting an octave down vs a fifth down (in-code); **COPY MY PICKS** → one line ("HIGH RISE SOUNDS: drop A ·
  perfect B · …") to paste into chat. The game holds still under the sheet.
- The levels are a FIRST MIX (set from each file's measured loudness — the pass log's table); the measured mix is the review's.
- A sound replaced: bump `sfx.js#HI_SFX_REV`; a picture: `night.js#HI_ART_REV`. After any change: `node scripts/build-file-hashes.mjs`.

## THE ASSETS (S2 — `python -P -E scripts/build-highrise-assets.py` COPIES the owner's delivery; Downloads\grok\highrise is only read)
- `assets/highrise/plates/night-1…5.webp` — the five painted NIGHT plates (Grok Imagine, 720 × 1280 → WebP q 90): **252 KB**.
- `assets/highrise/env-night.png` — **THE REFLECTION MAP**: "Shanghai Bund" (Greg Zaal, Poly Haven, CC0) — its UPPER (sky) HALF ONLY
  (the slabs' side faces mirror it downward: the promenade, its people and its street-level signs never ship), 256 × 64, blurred (smoked
  glass is no mirror), tone-curved into 8 bits (`v = x / (1 + x)`, gamma 2.2 — the shader undoes it: the lights come back hot): **14 KB**
  (the 1.6 MB HDRI never ships).
- `audio/highrise/` — the nine sounds + the slice's backup as 16-bit 44.1 kHz MONO WAV (the stereo takes mixed down; **no MP3 encoder
  on the build machine** — an MP3 set would be ≈ 120 KB): **633 KB**, fetched after the page is up. All CC0 1.0 — `CREDITS.md` +
  `LICENSE.txt` (the site's Credits sheet gets its HIGH RISE group at go-live).
- The day plates + `day.hdr` + the two cards' art + the flyers' models are S3's.

## THE FILE MAP + THE TESTS
```
highrise-play.html  css/highrise-play.css           THE TEST PAGE + its HUD (prefix hi-; the site's tokens + THE SHEET)
highrise-lab.html  css/highrise.css                 THE LAB's page + its plain-text HUD (self-contained)
js/games/highrise/tuning.js engine.js logic.js replay.js    THE RULES (pure — the phone AND the server)
js/games/highrise/bot.js                            the sim bots          scripts/highrise-sim.mjs   the 2,000-seed table
js/games/highrise/tower.js                          the tower a view draws, from the events (pure — the lab AND the game)
js/games/highrise/play.js                           THE TEST PAGE: the run loop, the HUD, YOUR BEST, THE DOOR, the lost context
js/games/highrise/night.js night-fx.js camera.js    THE NIGHT LOOK: the scene · the shaders + the bloom · the camera's numbers (pure)
js/games/highrise/bands.js best.js                  THE HEIGHT AREAS + the slab colours · YOUR BEST's tag / tape (both pure)
js/games/highrise/sounds.js sfx.js audition.js      THE SOUNDS: the table + the triggers (pure) · the engine glue · THE AUDITION
js/games/highrise/lab.js graybox.js                 THE LAB (S1's graybox)
api/_lib/highrise.js                                THE JUDGE's server half (pure, not wired)
assets/highrise/  audio/highrise/                   the plates + the reflection map · the sounds   scripts/build-highrise-assets.py
tests/highrise-engine.test.mjs (21) · highrise-server.test.mjs (5) · highrise-sim.test.mjs (5) · highrise-lab.test.mjs (6) · highrise-play.test.mjs (11)
tests/integration/highrise-play.mjs (86 — the browser; --review · --webkit · --look · --perf) · highrise-lab.mjs (45)
```

## COMING
- **S3** — the DAY look, THE FLYERS (the Blackbird OR an F-22 pair · the UFO · THE MOTHERSHIP at 200), deep space, the 2 cards' art staged.
- **S4** — COUNTING + THE MATCH: the judge wired into `/api` (solo + match), the solo run node + the match proof node (ONE rules
  change, ships OFF until go-live), the height tapes + the play-zone test, the altimeter, the announcer, WATCH, Call the Winner, the
  finish, REMATCH, the cards awarded, the pink friend tape. (The review's S1 notes for the wiring: "FOR S4" under THE JUDGE, above.)
- **S5** — THE DAILY (best of 3, ships OFF). Then THE REVIEW (+ the icon + the billboard poster briefs) and THE GO-LIVE PASS.
