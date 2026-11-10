# PFIX-B — PRISM DROP: ANTI-CHEAT RULES + THE SHOULD-FIXES + THE POLISH (Nov 10 2026)

FABLE REVIEW #1 of PRISM DROP (docs/games/review-prism-1.md) → its MUST FIX 6–7, SHOULD FIX 8–10 and the optionals (11–17, 19, 20, 22); the
decisions: docs/games/plan.md "PFIX-B" (question C's CHEAP BOUNDS — they narrow forgery, nothing replays the board; PERFECT CLEAR in SOLO stays;
optional 21 stays as designed). **A RULES CHANGE: `rooms/{CODE}/prism/{match}/{uid}` + `rooms/{CODE}/prismq/{match}/{target}/{key}` → Ben
re-publishes database.rules.json** (`tests/fixtures/rules-live.ack.json` names it). Every new rule keeps the game working on the OLD rules (the
new client only writes a subset of what the old rules allowed — proven by a FAST run on the old rules). Still 8 functions. Never the live site
(one read-only GET of the public `/api/board?b=prism-rush` — the bound's report). Never the three words. Each fix: its pin first (red), then the fix.

## Step 0
cf42d477 — docs/games/plan.md "PFIX-B — ANTI-CHEAT RULES + THE SHOULD-FIXES + THE POLISH", appended unchanged.

## Group 1 — THE RULES (findings 6 + 7)
- **The board node** (`prism/{m}/{uid}`): written only in PLAY, the countdown from GO − 2 s (GO lands before the host's tick; a host gap leaves the
  phase at `count` for 10 s+), SCORE RUSH's END for its final save — never past `endAt` + 4 s (also while the host is away); FROZEN once its own
  `st` is out or `game/out/{uid}` exists (the director's gone / away); `at` = `now`. `sv` CLOSED: every field of `engine.js#save` typed + bounded
  (`st` = four counts — quads / twists / perfect clears ≤ pieces ≤ 20 a second of play + 40; `n` the same + 60; `ln` ≤ 4 × pieces; `mc` ≤ pieces;
  `se` ≤ 30 × pieces; `pk` 0–40; `pd` rows `[n 1–30, gap 0–9, from ≤ 40, id ≤ 80, wait, risen]`; `h` / `ct` 0–7, `fr` 0–1…). The published stats
  bounded by the play clock (`sc` ≤ 20 000 a second + 50 000 and ≤ 10⁸; `ln` ≤ 10 a second + 40; `se` ≤ 10 a second + 60; `mc` ≤ 1 000; `pd` ≤ 400);
  `best: 'quad'` needs `ln ≥ 4` (`'pc'` ≥ 2) in the same node. **The view writes only inside that window** (`logic.js#boardWritable`, a little
  inside the rules' edges) — publish, the hide-save, the top-out.
- **The attack** (`prismq`): the key must be `{auth.uid}-{digits}` (one per piece, create-only — a push key refused), `at === now`, neither the
  sender's nor the target's board out (their `st` or `game/out`); BATTLE + PLAY only, never yourself (kept). **The receiver** drops an attack that
  would take its queue past `QUEUE_MAX` = 40 rows (marked taken — a refresh doesn't take it either).
- **The KO credit** (`logic.js#creditedBy`): `by` counts only if the victim's queue holds an attack FROM that player stamped in
  [KO − 20 s − 2.5 s (the longest rise), KO]; `index.js#livePaths` mirrors `prismq/{m}` as `queues`. Optional 19's comment at `validBy`.
- **The award flags** (`match-report.js#prismExtra`): quad needs `ln ≥ 4`; PERFECT CLEAR `ln ≥ 2 × pc` + `pn ≥ 5 × pc` (SCORE RUSH — no junk) /
  `2 × pc` (junk under you); both only from ≥ 15 s played (`PRISM_AWARD_MIN_MS` — GO to their KO / the end) at ≤ 10 pieces a second. `pn` (the
  pieces) is new in the director's results.
- **Pins:** `rules.test.mjs` 73 / 73 — 4 new tests: the honest writes ALLOWED (a publish, a full real save, a save with nothing pending, a real
  quad, the top-out), every forged write REFUSED (`sv.st = [1, 1, 1, 99]`, quads > pieces, 99 999 pieces in a minute, 3 / 5 counts, `pk` 41,
  500 lines, a 1 MB `sv.x`, `sv.sc` 999 999 999, a 40-row pending attack, a 7-field row, `h` 9, `fr` 3, `sc` 999 999 999 / 5 M in a minute,
  5 000 lines, a quad with one line, an extra field, a phone-clock `at`; the credit / score / save rewritten after the KO; the director's out;
  a battle's END; before GO; 10 s after the song — in END and in PLAY; a back-dated attack, a push key, a key in someone else's name, a non-number
  piece, at a board that says out, at a player the director put out, from a board that says out, the countdown, SURVIVAL). **On the OLD rules
  the 3 refusal tests fail** (70 / 73). `tests/prism.test.mjs`: a forged `by` → nobody (no queue, someone else's row, too old, another queue),
  a real row → credited, the same patch twice; the whole-match sims now carry real queues (KOs still credited); `boardWritable`'s window.
  `tests/profiles.test.mjs` (+ the fixture's `playStartAt` + `pn`): the review's forged match → no flag (quad with 1 line, pc with 1 line, 5 in
  9 lines, 3 from 8 pieces in a rush, 5 000 pieces in 90 s, a 5-second match, a solo run's 4 in 3 lines), the honest ones still flag, a solo
  run's real one stays. Red on the old `match-report.js`. `e2e-profiles.mjs` (the real server): BOB's one-line quad → no FOUR ON THE FLOOR,
  ALICE's quad in an 8-second match → none, an honest quad → the card (the path works).

## Group 2 — THE SHOULD-FIXES
- **8 — the ghost rows** (`incoming.js#ghostBands`): the room goes to the rows that land first — the scheduled row, then the queue from its
  OLDEST band; drawn bottom-up as before. The review's queue (OLD 4 · MID 6 · NEW 6) → NEW 2 · MID 6 · OLD 4 = what the engine lands. Pin + 400
  random queues (every band but the last drawn whole).
- **9 — THE SCORE RUSH BOUND** (`scripts/sim-prism-rush.mjs [runs] [pps]` → `match-report.js#maxRushScore` / `maxRushLines` / `rushLineCeiling`):
  full-skill bot runs (bot.js, skill 1) on the real engine, REBOOT as the view does, every song (the day set too). 12 runs a song at 4 pieces a
  second: the best 217 k (prism4, 126.7 s, 176 lines) … 511 k (prismd2, 228 s, 275 lines) — fitted ≈ 1.4 lines a second × ≈ 130 points a line a
  level. The bound = 3 × 130 × (L + L² / 20) + 20 000, L = 1.4 × the song's seconds → **3.19–4.57 × each song's best run** (the longest ≈ 2.18 M,
  the RUSH_MAX_S cap 2.37 M — was ≈ 222 M for 923 lines); at 3 pieces a second the margin is 4.3 ×, a 5-pieces-a-second bot still sits under it
  (1.6 ×). A score is also never above what its lines can be worth (~1 250 × the level a line + 80 a piece of drops — the "level curve"); lines ≤
  2.5 a second + 20 (≥ 1.9 × the best run). Pin: `tests/profiles.test.mjs` runs the sim (4 runs, the shortest + the longest song: ≥ 2.5 ×,
  ≤ 6 ×, an honest best keeps its record; 60 M / 900 lines, 222 M / 923, 3 M / 500, 500 k / 10 lines refused). **THE BOARD's `prism-rush`:
  0 rows (all-time and this week, the public GET) — nothing above the new bound.**
- **10 — the day tiers** (`tiers.js#stepTier`): by day a step goes to the next tier whose BOARD ratio differs (3 → 0 down, 0 → 3 up); by night one
  at a time. The view judges 90 frames OR ≥ 20 frames covering ~1.5 s (a 15-fps phone: ~1.5 s, was ~6 s per step + 120 frames' cool-down — the
  step-down cool-down is 30 frames now). Pin: `tests/prism-neon.test.mjs` (each day step changes the board's ratio; night one at a time).

## Group 3 — THE POLISH
- **11** `neonfx.js#endsHold` (a lock / rows landing) → `board.endHold()` in the view's event loop: the live stack + the landing preview at once;
  the clearing piece's own lock comes before its clear (the clear's hold stays). Pin: `tests/prism-pd5b.test.mjs` (the real engine's events).
- **12** `logic.js#playlistAdvance` at `start` (night `meta/prism/n` = pos + 1, day `meta/used/prism/dn<pos+1>`; a room's first match writes the
  seed with it). Pin: `tests/prism.test.mjs` + the e2e's END GAME check (`dn<pl0+1>` in the night's memory after a mid-match END GAME).
- **13** a band never rises past the one in front of it (`ghostBands`' `cap`) — never HOT before the head. Pin.
- **14** the INCOMING tag also stays above the landing preview (`view.js#paintTag` — the ghost piece's top cell); a rising ghost cell is drawn only
  where every stack row it overlaps is empty (`board.js#ghostBlocked` — both looks), else tinted. Pin + the shots (`inc1` / `inc3` / `d-inc3` at 390).
- **15** the console's rows take a `scoreText` (`ui/final.js`'s podium + `components.js#leaderboard` — shown as is, never counted up); PRISM's
  SURVIVAL label TIME. Shot: `surv-final` reads 2:31 / 2:14 / 1:57.
- **16** `pumpAnnounce`: the header's `has-ann` comes off as the announcement starts its fade (the `.pd-info` 0.2 s fade crossfades) — not after.
- **17 (partly)** `view.js#warmDayArt` — at night, 1.5 s after GO, in idle slices (`requestIdleCallback`, ≤ 60 ms away — a busy 4× phone gets
  no idle time at all): the crayon TOOTH noise made a few rows a slice (`crayon-art.js#toothStep` / `warmTooth` — the lettering's mask, the
  doodle's tile, SLAM's streak, the scribble's three, the 4-LINES star's two), the mask's URL, the current world's doodle (`page.js#warm` — CPU
  only, no paper or font fetched). The SCRIBBLE punched a 970 × 970 tile for a 970 × 36 strip (×3 combo levels, ≈ 11 MB of canvas + ~0.25 s of
  noise at 4× on the first clear by day) → a repeated 256-px tile (`punchRepeat` — the same noise + strength). `board.size` keeps its three
  canvases when nothing resized. **Measured** (`tests/integration/prism-lookswitch.mjs` — new, a report: 4× CPU, GPU on, 390 × 844 @3, the bot,
  3 runs × day / night / day): the first switch to day — before 3–4 frames over 34 ms (worst 100) → **2** (worst 100); the warm switches as
  before (one 50–67 ms frame). The profile of what is left: no JS noise any more — the day PAPER image arriving (its `load` → the page redraw:
  a GPU readback ~47 ms) + the compositor. Loading the paper + font ahead (an experiment) removed one frame more only — they stay day-only (PD-4's
  rule); Ben's call if he wants it (~13–29 KB + 30 KB a match at night).
- **19** the comment at `director.js#validBy`. **20** REBOOT in docs/prism.md (Score Rush). **22** the FAST e2e ends "PASSED" (the planned stop is no
  failure — its own summary line now), `prism-shots.mjs`'s PERF waits for `load` + a bounded settle, `fake-firebase.js#push` is thenable.
- **+** `e2e-prism.mjs` counts every write the rules refused (firebase.js#write's "[rules] refused:" line) — **no board write refused** on the
  new rules; the one refused attack = the REFRESH step's deliberate replay.

## Tests
All local, on this pass's own fresh servers (the emulators + `serve.mjs 5173 --emu`):
- `node --test tests/*.test.mjs` **1510 / 1510** (the PRISM files 98 — were 90; + profiles' 2; the preload graph regenerated: prism 43 modules, 422 KB).
- `rules.test.mjs` **73 / 73** (70 / 73 on the old rules — the 3 refusal tests). `server.test.mjs` **44 / 44**.
- `e2e-profiles.mjs` **142 / 142** (run first on fresh emulators; + the 3 forged-match checks).
- `FAST=1 e2e-prism.mjs` on the NEW rules **61 / 61** PASSED (+ END GAME, + THE RULES).
- The FULL 8-phone `e2e-prism.mjs` on the NEW rules **88 / 88** PASSED (was 86 — + END GAME, + THE RULES), errors none, 311 s.
- `e2e-prism-leak.mjs` **6 / 6** — live canvas 34.7 → 34.8 MB over 6 rematches (PFIX-A: 34.3 flat; the + 0.4 MB = the day art now warmed at night), the old roots collected.
- The smoke test **6 / 6** (both playable games).
- **On the OLD rules** (the emulators started on `git show HEAD:database.rules.json` — the rules as published before this pass, checked over the emulator's REST): `FAST=1 e2e-prism.mjs` **63 / 63** PASSED, no board write refused — the game works until Ben re-publishes.
- Every server this pass started was stopped at its end (the emulators' Java + node — both runs, serve.mjs :5173, the browsers); Ben's :5190 preview server untouched (left running for his links).
