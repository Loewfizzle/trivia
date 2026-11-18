# DAILY A — COAST CLEAR's touch-down + the fitted board · DAILY BEST (server, all four) · JAYWALK's daily, the server half (Nov 18 2026)

The owner's decisions: `docs/games/plan.md` "DAILY A / B — approved Nov 18". Ships OFF (JAYWALK's daily row `on: false`); DAILY B builds the
screens. The inbox: no OPEN entry addressed to this pass (start, after each group, before the final tests). The lab export: 224 marks, no
open FIX.

## GROUP 0 — COAST CLEAR (docs/coastclear.md "DAILY A")
- **CC_DIG_ON** (`logic.js`, default `'down'`): DIG mode digs on the TOUCH-DOWN, BUOY mode lays its buoy on the down, an open number chords on
  the down — no press-and-hold buoy. `'up'` = DFIX5's path exactly. Both: the tile presses in + ONE pulse in the ticket's colour (`.cc-touch`)
  + its digging state until the number surfaces; under 'up' a long press turns cleanly into the buoy. THE TOUCH GUARD: one finger at a time.
- **THE FITTED BOARD**: the cell from the height actually left — `.cc-play`'s own box (a flex child) minus the status row / the hint / the
  owner's readout, measured by ONE ResizeObserver → `--cc-fit`. At 375 × 667 the cell is now 35–36 px (the width's), the last row ends ≥ 37 px
  above DIG / BUOY at every size, both looks, with and without the hint.
- e2e-coastclear's buoys now come from the BUOY switch (a long press digs under 'down').

## GROUP 1 — DAILY BEST (docs/progression.md "DAILY BEST")
- ONE pure table (`js/core/daily-best.js`), `pstats/{pid}/db/{game}`, written in THE DAILY's own stats transaction; the finish + `today` carry
  `{ best, newBest, first }`; `today` already carried the place + the day's players (`place`).
- **Obvious call, named**: `newBest` = beat a best from an EARLIER day — beating your own first JAYWALK try the same day is not a NEW DAILY
  BEST (the first test run showed it after try 2 on a first day).
- **Obvious call, named**: a non-counting result (THE THROWAWAY GATE) still sets the player's own best; a run before THE PROGRESS RESET doesn't.
- **THE BACKFILL** (/admin → THE DAILIES → DAILY BEST · PREVIEW → a second tap; audited; safe twice): reads `dly/{game}/{day}/r` from
  `d20261101` or the reset's day, whichever is later. **Not run on the live site by this pass** (it is the owner's tap after the deploy). What
  it cannot recover, by construction: any day before THE PROGRESS RESET's day (THE ONE DAY LINE), any day `dailyFresh` wiped, THE DROP / JAYWALK
  days before they went live (none were played), and a profile since removed. On the emulators: every kept day + daily recovered; the preview
  lists the empty days per daily.

## GROUP 2 — JAYWALK's DAILY, the server half (docs/jaywalk.md "THE DAILY")
- `api/_lib/jaywalk-daily.js` (JAYWALK_DAILY in `SERVER_CARTS`) + pure `api/_lib/jaywalk-tries.js`; `config.js#DAILIES` row `on: false`,
  `tries: 3`, `measure: 'lanes'`, ticket `jaywalk` (orange in `TICKET_INK`).
- 3 tries, the best counts; the FIRST closed try counts the day, a better one RAISES (`api/daily.js#raiseRun`); START always opens a new try
  (an open one closed first); a 4th → `409 no_tries`.
- **Obvious call, named — the proof node's place**: `dly/jaywalk/{day}/w/{uid}/{try}` (`w`, not `p`: `p/{pid}` is the server's record, as
  in every daily). **The window**: `z` = go + 5:00 + 90 s — a try started before 4 am keeps its day (A RUN KEEPS ITS OWN DAY) but no chunk
  lands past its own window; START is always today's (unused tries expire at 4 am).
- **Obvious call, named — `today` closes an open try** only once it can't be in play: its `e`, past `z`, or no chunk for 20 s (a phone that
  plays uploads every second). START always closes it; THE DAY'S CLOSE forces it.
- **THE ROOM WINS** = a new action `roomWins { game, room }` (the player in that room with 2+ players — no game needed); `pause` is refused.
- **The points curve**: FLOOR 10 + 90 × (lanes / 300)^0.6, 300+ = 100 (0 → 10 · 50 → 40 · 100 → 56 · 150 → 69 · 200 → 80 · 250 → 90) — the
  greedy bot over 120 daily courses: p10 37 · median 207 · p90 282 lanes.
- `/admin`'s dailies list: JAYWALK's rows come from the same stats (started / finished per day) + its score line (`meta.js#scoreLine` —
  "N LANES"); its GO-LIVE row shows OFF until scheduled.
- **THE TEST PAGE** `tests/integration/jaywalk-daily.html`: `?emu` = the real path; without it = THE LOCAL JUDGE (the server's own pure code
  in the page, a fixed test course) — the owner's phone link on the plain 5190 server.
- RULES CHANGED (`dly/jaywalk/$day/w/$uid/$try`) — RE-PUBLISH (the ack: `tests/fixtures/rules-live.ack.json`).

## THE SIZES
- THE PER-GAME BUDGET: JAYWALK 2,449 of 2,450 KB (not raised) — the row + `core/daily-points.js`'s row are in the boot graph; their comments
  kept to one line (the detail lives in the docs). CLAUDE.md: two JAYWALK lines moved VERBATIM to docs/jaywalk.md "THE RULES FROM CLAUDE.md
  (moved Nov 18)" to make room for DAILY BEST's one line (40,709 of 40,960 bytes).

## THE FINAL RUN (fresh emulators + `DAILY_TEST=1 node scripts/serve.mjs 5173 --emu`, nothing else busy)
(filled in below by the final run)

## OPEN FOR BEN
(see the summary — copied below at the end of the pass)
