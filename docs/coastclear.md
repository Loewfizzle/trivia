# COAST CLEAR — a daily, server-judged Minesweeper-type (CC1, Nov 7 2026 — ships OFF)

The owner's decisions: `docs/games/plan.md` (CC1). The contract it plugs into: `docs/cartridge.md` (THE DAILY PLUG-IN, D2). The pattern it follows:
THE PASSWORD (`docs/password.md`). THE DAILY MODULE (a later pass) opens it once a day, owns the banner, the pause + the RESUME chip, the rankings and
the streak hooks; until THE SWITCH-OVER `daily.on` is `false`, the server answers it only under `DAILY_TEST=1`, and the game is reachable only through
its preview + its E2E. **Slip a small boat across the night harbor past 18 hidden patrol SEARCHLIGHTS on a 9 × 12 board; buoys mark the lights you've
worked out.** Digging a light = SPOTTED (+30 s, play goes on); the 3rd spot ends the run (CAUGHT). Score = server time + 30 s a spot + 15 s a pause
(lower = better); a caught run ranks below every finished run.

| file | what |
| --- | --- |
| `js/games/coastclear/meta.js` | THE THIN META (pure, no imports): 9 × 12 · 18 lights · +30 s a spot · +15 s a pause · 3 spots ends it, SOLO, BANNER_NAME, `chatLocked` → false, `LOOKS: ['night']` (CC2 adds the day harbor), `CC_EPOCH` (the share line's day 1 — CC2 / THE SWITCH-OVER) |
| `js/games/coastclear/logic.js` | THE RULES, pure — the server imports it: neighbours + counts, `flood` (BFS from the tap), `applyMove` (dig / chord), `serverAct` (the server's one action on a record: dig · chord · pause · resume), `runView` (the phone's view: opened cells + spotted lights only), `scoreOf` + `bucketOf` (300 buckets), `replay` (the server's check), the phone's `foldAnswer` (answers in any order) + `clockMs` + `chordTargets` |
| `js/games/coastclear/daily.js` | THE DAILY PLUG-IN: `daily = { on: false, create, resumeKey, result, replay, problems }` — a day set carries NO board (`{ v: 1, day }`) |
| `js/games/coastclear/index.js` | THE CARTRIDGE (every REQUIRED piece; a DAILIES row — a room never starts it) |
| `js/games/coastclear/judge.js` | THE JUDGE on the phone: start / dig / chord / pause / resume / finish through `/api/daily` (js/profile/api.js — no socket) |
| `js/games/coastclear/view.js` + `css/coastclear.css` | THE SCREEN (below); every colour a `--cc-*` token; `window.__coastclear` = the test hook |
| `api/_lib/cc.js` | THE SERVER's cartridge (`core/daily.js#registerDaily`, `judged: true`, `moves`, `load` = the day's board, `act`, `verify` from the record) |
| `api/_lib/cc-board.js` | THE DAY's BOARD: the seed from THE PEPPER (the `dailySeed('coastclear', day)` form; `…:<day>:<attempt>` for a retry), built once + stored at `dly/coastclear/{day}/b`, kept warm in memory |
| `api/_lib/cc-solve.js` | THE NO-GUESS MAKER + THE SOLVER (pure — the preview imports it through the dev server's `/__dev/api-lib/` door for its fixed test board) |
| `tests/coastclear.test.mjs` · `tests/cc-board.test.mjs` | the rules (11) · the maker + solver over 1,200 days (4) |
| `tests/integration/coastclear.test.mjs` | `/api/daily` for COAST CLEAR on the emulators (6) |
| `tests/integration/coastclear-preview.html` · `coastclear-daily.html` · `e2e-coastclear.mjs` | the look preview (a local fake server, a fixed test board) · the E2E's page (the real judge on the emulators) · the E2E (18) |

## The game (what the phone does)
The view holds ONE thing: **the run view** — `{ w, h, lights, open: [[cell, n]…], lit: [cell…], spots, done, out, startedAt, finishedAt, paused,
pausedAt, pausedMs, pauses }` — and every bit of it comes from the server: `judge.start()` hands back the opening + the run so far, every dig / chord
answers with the cells it opened (a 0's whole calm area in ONE answer) or the light it was spotted by, and `logic.js#foldAnswer` folds it in
(everything only grows, so answers landing out of order are fine). The **buoys** are the phone's alone (no server call, ever): kept in
`localStorage` per day + player so a refresh keeps them; on a CLEAR every cell still shut must be a light, so the phone buoys them all (deduced,
never told).

**THE INSTANT FEEL:** `pointerdown` on a cell presses it (`.is-press` — `scale(0.88)`, in the same event: 0.6 ms on a 150 ms line in the E2E);
`pointerup` (before the 380 ms long-press, without a 12 pt slide) fires the move AT ONCE — a dig is `pending` (`.is-wait`, a soft shimmer on opacity)
and never waits for an earlier answer (pipelined: six taps in flight at once on the 150 ms line). The number POPS in when its answer lands (the dark
still face fades in on `::before`, the digit springs up — both transform / opacity); a flood RIPPLES out ring by ring from the tapped cell (30 ms a
ring — the Chebyshev distance). A tap on a buoyed cell does nothing; a long-press in DIG mode = a buoy; in BUOY mode a tap = a buoy. A tap on an open
number whose buoys (+ its spotted lights) equal it = a CHORD (one call; otherwise a small nudge). A lost answer retries (250 ms → 1.5 s, a repeat is
free on the server); a quiet **RECONNECTING** line only once an answer is ~2 s late; an out-of-step refusal (a finished run, a chord the server
counts differently) re-syncs from `start`. The clock is SERVER time (the offset from the answer with the lowest round trip), the pauses stopped,
+ 30 s a spot + 15 s a pause — a spot flashes `+30` beside it.

**The screen (CC1, NIGHT):** the sign COAST CLEAR (a static text glow, clear of ☰ + the music) · the status row — the TIME in plain neon type, THREE
DRAWN SEARCHLIGHTS (a lamp + its beam; lit gold = spotted), a DRAWN BUOY + the buoys left — no pills, no boxes · the 9 × 12 water (~38 pt cells at 390,
up to 46; 2 pt gaps): dark glass tiles over ONE shimmer layer sliding on transform, opened water darker + still, the numbers in bright neon (1 cyan · 2
green · 3 pink · 4 yellow · 5 orange · 6 violet · 7 red · 8 white — the digit itself carries the meaning), buoys = drawn orange floats with a lamp, a
spotted cell = a gold searchlight that stays lit (a one-time burst ring) · the DIG / BUOY switch in the thumb zone (two big halves, 12 pt corners — not
a capsule; the active half glows cyan / orange). Status + board sit together, centred between the sign and the switch. **The end (a PLACEHOLDER):**
the switch's place takes COAST CLEAR + the time + "1 SPOT · 1 PAUSE", or CAUGHT + "2:41 · THE THIRD LIGHT FOUND YOU"; the board dims. `judge.finish()`
once (a retry gets the stored score back); only a failed finish shows a quiet NOT RECORDED · NO SIGNAL. CC2 builds the lighthouse win, the caught
screen, the share, the DAY harbor + the live swap, the sounds and the rewards (LIGHTHOUSE · GHOST RUN).

**Resume / suspend:** an unmount (the room starting a game, an app switch) drops nothing the server doesn't have (only the in-flight answers — the
re-mount's `start` brings them back); the re-mount resumes from the server's record. A run PAUSED by THE DAILY MODULE resumes itself when the screen
comes back (`judge.resume()` on mount); any move resumes it too.

## The board maker (`api/_lib/cc-board.js` + `cc-solve.js`)
ONE ATTEMPT: a start cell in the middle band (x 2…6, y 4…7) with its 3 × 3 kept clear (so it is a 0), the 18 lights scattered over the rest by a
seeded shuffle, the opening = the start's flood — kept only at **10–20 cells**. Then **THE SOLVER** plays it from that opening with pure logic:
(1) single cells — a number whose lights are all known → the rest safe; a number needing every unknown neighbour → all lights; (2) PAIRS — two
constraints sharing cells: the bounds on the shared part decide each side's own cells (this covers the subset rule, 1-2-1, 1-1…); (3) THE LIGHT COUNT
— the lights left vs the cells left, and the count paired with each number (the rest of the board as one more constraint). A round that finds nothing
= a guess would be needed → the board is thrown away and the next attempt's seed tried (`daily:coastclear:<day>:<a>`; attempt 0 is exactly
`dailySeed('coastclear', day)`). The solver opens only a cell it has PROVEN safe and throws if it ever calls a cell wrong (a self-check).
**The numbers (1,200 days in `tests/cc-board.test.mjs`):** 15.5 attempts a board on average (max 131 — almost all of them a rejected opening size; ~1
in 2 good openings needs a guess), **under 1 ms a board** (0.87 ms). Built once a day (the first `start` / move of the day — a transaction keeps one
copy) and stored as `{ v, w, h, l: 'cell,…', s: start, a: attempts }` (~95 bytes); a warm function keeps the last 3 days in memory.

## The server flow (`POST /api/daily` — api/daily.js + api/_lib/cc.js)
- **THE BOARD STAYS ON THE SERVER.** `start { game: 'coastclear' }` → `{ day, startedAt, done?, run, now }` — the run from the stored record (the
  opening even before the first move) and **NO seed**. A refresh = the same try, the same run.
- **The moves** (CC1 added a generic path for a judged cartridge's `moves` — `dig` · `chord` · `pause` · `resume`, no new function): the day's board +
  the start read in parallel, then ONE transaction on the record (`dly/coastclear/{day}/p/{pid} = { st, mv: ['d45', 'c30:21,22' …], p?: { n, ms, at? },
  e?, o? }` — the moves, never a cell's content). A repeat (a dig on an open cell — its own number back; a spotted light; a chord with nothing left) =
  `already: true` and **nothing written**. A transaction's first call may see null (nothing cached in the function): it never aborts on that — it writes
  the move's record so the server checks it against the stored one and retries with the real value. Every answer carries the server's `now`.
  - `dig { cell }` → `{ cells: [[cell, n]…], lit: [cell…], spots, done, out?, finishedAt?, resumed? }` · a bad cell 422 `bad_cell` · after the end 409 `finished`
  - `chord { cell, buoys }` → the same shape: the phone's buoys (only those around the number count) + the spotted lights must equal it (else 422
    `chord_count`, no cost); every other unopened neighbour is dug — the light a WRONG buoy left unmarked = SPOTTED
  - `pause` / `resume` → `{ paused, pauses, pausedMs }` — the clock stopped from `at` to the resume, +15 s a pause; a second pause = free; a move resumes
- `finish` → scores from THE SERVER's record (`logic.js#replay` — the phone's `result` is ignored; unfinished → 409 `not_done`), then the existing
  streak / standing code (`better: 'low'`, 300 buckets: 0…239 = 5-second steps to 20 min · 240 = longer · 241…299 = caught, by the safe cells left).
  No flags yet (CC2's rewards).
- Registered by `api/_lib/dailies.js#loadDailies` **only under `DAILY_TEST=1`**: production answers 404 `no_daily`. No rules change (`dly/` is the
  rules' default deny — server-only).

## The preview (no Firebase — `tests/integration/coastclear-preview.html`)
The real view against a LOCAL FAKE SERVER (`logic.js#serverAct` on a local record) on a FIXED no-guess test board (the real maker on a fixed seed —
never the real day; the first seed with a big second calm area). `&state=opening | mid | spotted1 | spotted2 | caught | clear` (played forward by the
SOLVER's own deductions — no cell made up; the buoys on the lights it found) · `&flood=1` (the biggest calm area dug once ready — film it: `shots.mjs
--cast 1100 --strip 8 --js "__coastclear.tap(__preview.play.bigZero().cell)"`) · `&lat=40` (the fake's answer time; 190 = a slow line) · `&drop=1` (answers
lost for 3 s → RECONNECTING) · `&mode=buoy` · `&paused=1` · `&t=95` · `&seed=` · `&corner=0`. Shots: `Downloads/NEON/coastclear/shots/` — `cc1-g4a` (every
state at 390 / 402 / 430, desktop, the flood strip), `cc1-e2e` (the E2E's).

## The numbers (CC1, measured on the Beelink)
- **The flood at 60 fps:** a 16–20-cell ripple at 390 × 844: 60.7 fps (p95 16.7 ms, 0 long frames); with the CPU slowed 4×: 57.8 fps (1 frame > 25 ms).
- **The dig round trip** (the phone → serve.mjs → the emulators): p50 13 ms · p95 15 ms (45 answers). **On a 150 ms line** (CDP latency): p50 170 ms ·
  p95 178 ms — the tap's press still in the same event (0.6 ms), six taps in flight at once, all six answered in 182 ms. On the live site expect the
  phone ↔ Vercel leg plus ~3 database round trips per move (the start read in parallel with the board, then the transaction's null guess + the real
  one): roughly 100–250 ms — the press never waits for it.
- **A run's cost:** ~50 `/api/daily` calls (the E2E's clean run: 50 — 42 digs + chords, the start ×4 with the refreshes, a pause, a finish; the solver
  needs ~40 digs on average). The record ends at ~330 bytes; each move reads the record once (+ the start key, ~20 bytes) and writes it once; the board
  is read once per cold function a day.
- **At 100 players a day** (30 days): ~150,000 function calls a month (Vercel Hobby: 1,000,000 invocations — ~15 %; Active CPU at ~10–20 ms a call ≈ 25–50
  min of Hobby's 4 h); the database download ≈ 50 calls × ~0.6 KB + the finish's streak transaction ≈ 40–50 KB a run → ~150 MB a month (Firebase Spark:
  10 GB — ~1.5 %); storage ≈ 0.4 KB a player a day → ~1.2 MB a month (Spark: 1 GB; `dly/` is never pruned yet — THE DAILY MODULE's job). The
  connections are the functions' own (a warm instance holds one; Spark: 100). (The plan limits as of this writing — check the dashboards.)

## Tests + proof
- Pure: `node --test tests/coastclear.test.mjs tests/cc-board.test.mjs tests/cartridge.test.mjs`.
- `/api` on the emulators: `cd tests/integration && node --test coastclear.test.mjs` (DAILY_TEST=1 inside; run it ALONE — it and password.test.mjs wipe
  the same nodes) — start (the opening, no seed, the board stored once), digs (one cell, a whole flood, a repeat writes nothing), the chord right /
  wrong / short, three spots → caught + nothing after, a clean clear with a pause (the clock stopped, +15), one finish, every answer honest, production
  refuses it.
- The E2E (the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`): `E2E_BASE=http://localhost:<port> node e2e-coastclear.mjs "<browser>"
  ./shots-coastclear` (≈ 20 s, 18 checks).

## Real vs placeholder (CC1)
REAL: the rules, the no-guess maker + solver, the server keeping the board + answering every move, the record + the replay + the score, the pause /
resume, the screen + the night look, the instant feel (press, pipelining, the ripple, retries), resume after a refresh / a tear-down, the preview, the
E2E. PLACEHOLDER: the end (time + spots only). NOT BUILT (CC2): the lighthouse win + the caught screen + the share, the DAY harbor + the live swap
(`LOOKS` is night-only now), the sounds, LIGHTHOUSE + GHOST RUN. NOT BUILT (THE DAILY MODULE): the way in, the banner, the pause call + the RESUME chip,
the rankings, the streak hooks, the switch-over.
