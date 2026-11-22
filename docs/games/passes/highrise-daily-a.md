# HIGH RISE DAILY A — THE DAILY ITSELF (server + run; ships HIDDEN) — Nov 21 2026

The owner's decisions: `docs/games/plan.md` "THE HIGH RISE DAILY" (Step 0). The area's doc: `docs/highrise.md` "THE DAILY". Built on JAYWALK J3
(9d6d82e) + J4 (d094d85). The row `config.js#DAILIES.highrise` ships `on: false` — nothing of it is reachable on the live site; on the
emulators it opens with `DAILY_TEST=1 DAILY_TEST_OFF=highrise`. The inbox: no entry addressed to this pass (read at the start, after each
group's commit, before the final tests). The lab export (224 marks): no open FIX.

**RE-PUBLISH: database.rules.nov21-hrdaily.json** (`Downloads\NEON\`) — the new `dly/highrise/{day}/w/{uid}/{leg}` (+ every earlier
unpublished path: J2's `jw/…/cv`, CITY PART 2's `gv`, THE CONSOLE FIX's `pt` + the `t0` stamps, if still not published). Any time after the
deploy: the daily is OFF, nothing live writes there; every other path is unchanged. The ack: `tests/fixtures/rules-live.ack.json`.

## WHAT WAS BUILT
- **G1 — THE ENGINE'S DAILY MODE + THE HOLD** (`engine.js#hold`, `replay.js`, `rules.js`, the pure `held.js`): the daily row gains its
  hold numbers (`holds: 3`, `roomHolds: 3` — the rule-set table; solo + match have none). A hold is a LOGGED event `{ k: 'hold', t, r? }` in
  the run's log; the replay applies it to the run as it stood after the event before it (never stepped to its tick: no fuse, no spawn in the
  gap) — the next floor's slab enters at `t`, its sweep from tick 0; a 4th player hold is refused by the engine AND the judge. THE HELD RUN
  = LEGS (`held.js`): the record's legs (each GO, window, PLAY tick) + each leg node's server-stamped chunks in LOCAL ticks → ONE log; every
  leg passes THE SPEED CHECK on its own clock. Tests: `tests/highrise-daily.test.mjs` (10 — REPLAY = LIVE with holds at random floors over
  50 seeds × four bots, half of them losing a tap the server never got; a hold never moves a placed floor; the 200 finish; the ranking keys;
  the 4th hold; the legs' log + each leg's clock (ahead · cut · past z · a hole); the next hold's tick; the share inputs).
- **G2 — THE SERVER HALF** (`api/_lib/highrise-daily.js` → `SERVER_CARTS.highrise`; `api/daily.js` knows a `held` cartridge — start,
  finish, settleRun — never the game's name): START = a fresh run · a RESUME (THE UNDO GUARD — the open leg closed first, then read, T picked,
  a new leg in ONE record transaction) · the run ENDED + scored (no hold left · over · a refused log · a past day's held run). FINISH = the run
  ended → THE JUDGE replays every leg → `finishRun` (the streak, DAILY_XP once, THE SWEEP, PERFECT WEEK, THE THROWAWAY GATE, DAILY POINTS,
  EVERYONE, PENTHOUSE, DAILY BEST, THE ONE DAY LINE — reused, never forked). THE ROOM WINS = `pause { room }` → a FREE hold owed. `today` /
  THE DAY'S CLOSE settle what can't come back. Rows: `daily-best.js` (most floors), `daily-points.js` (FLOOR + 90 × (floors / 200)^0.6),
  `metas.js` scoreLine "N FLOORS", `share.js#MEASURES` + 'floors'. The share inputs `{ f, p, w[], x[], pf[] }`. No split boards.
- **G3 — THE RULES + THE PRUNE**: `dly/highrise/$day/w/$uid/$leg` — own uid, append-only server-stamped chunks (the packed tap grammar,
  canonical), nothing before go / past z / after e (FIN or the server's close at the next hold), legs 0 … 6 only (the run + 3 holds + THE
  ROOM WINS' 3 — the server opens them; the player-hold cap of 3 is the engine's + the judge's), never read by a phone, the record + the
  scores server-only. `rules.test.mjs` +1 case (101). THE PRUNE: the leg nodes past 7 days, once (`pr`).
- **G4 — THE PHONE'S RUN PATH** (`daily-run.js` — `js/screens/daily.js#DAILY_RUNS.highrise`; never the cartridge, so never HIGH RISE's
  preload graph / budget): the real stage in mode 'daily'; START → the 3 · 2 · 1 → every tap's chunk at once (the proof writer's `pipe`);
  hidden with a hold left → HELD (`stage.js#hold` — the clock stands, no touch drops a slab) → back: ≤ 1.5 s for the last chunk to land, START
  = the hold, the stage adopts the server's log + the hold (`adopt({ events })`); no hold left → a hide ENDS the run (`e` + FINISH keepalive).
  The end card (minimal, JAYWALK's daily card classes): the SERVER's floors, the place / DAILY BEST, BACK TO THE DAILIES — no TRY AGAIN.
  The stage gained (additive — solo + match unchanged, their E2Es + the zero-garbage guard green): `hold(on)` / `held()` / `log()`, a held
  branch in the frame (one compare, nothing made), adopt of a log with holds, the end card's REPLAY = LIVE on the same log.
- **G5 — TESTS**: `tests/integration/daily-highrise.test.mjs` (7 — /api: one shot, a full run, THE HELD RUN (3 holds, the lost tap, the 4th
  ends it), refused (ahead of the clock · another day's node · a day two back), THE ROOM WINS, the abandoned run (today · THE RACE · the close
  · yesterday's held run), THE PRUNE) · `tests/integration/e2e-highrise-daily.mjs` (17 — a real phone on the real dailies screen: START,
  hidden mid-run 6 s (nothing fell), back (leg 1, the 3 · 2 · 1, the tower as it was), finish → the end card's floors = the phone's run = the
  SERVER's replay of both legs; a second START = the day's score; the shots at 390 / 402 / 430 / 1440).

## THE VISUAL REVIEW (the run's own screens — DAILY B restyles them)
- Refine 1: the hold line ("ONE SHOT · 3 HOLDS LEFT") sat on the big floor number and the 3 · 2 · 1 on the tower's top → the line moved to
  the foot (a dark halo over the tower's lines), the count into the sky (22 vh down).
- Refine 2: at 1440 × 900 the stage's phone column sat at the left → centred (the stage is a column by its own CSS; THE DESKTOP COMES FREE).
- Checked: 390 · 402 · 430 · 1440 (the end card), 390 (the welcome, the count, play, the resume's count).

## THE CALLS I NAMED (obvious / established-pattern — yours to overrule)
1. **THE HELD RUN = LEGS on JAYWALK's daily pattern** (the phone appends server-stamped chunks to a node the server opens; the rules check
   them) — not THE DROP's per-call checkpoints: a tap-per-chunk run would be ~200 function calls. A hold = a NEW leg the server opens; the old
   leg is CLOSED by the server first (its `e`), so the rules refuse any queued tap from before the hold — what the server read is final.
2. **THE UNDO GUARD**: every tap's chunk is sent the moment it lands (no batching at all); back on screen, the phone waits ≤ 1.5 s for the last
   chunk, then the hold's START closes the leg. A tap that still never landed is gone with the hold — bounded by the 3 holds. The same bound
   covers the one thing a hold can undo on purpose: a phone that cuts its own signal right before a miss / the fuse lands (its end never
   reaches the server) and then hides gets that floor again — at most 3 times a run, and only by going offline mid-run.
3. **A hold costs no run time**: the server picks the slab's entry tick T from the log it has (`nextHoldTick` — the natural entry after the
   last server tap); the 3 · 2 · 1 and the hidden time are off the PLAY clock. The ranking's "earlier tick" is that play tick.
4. **The 5:00 cap stays** (the rule-set table's daily row, since S1) — of PLAY time. A match has 6:00; say if the daily should match it.
5. **THE ROOM WINS = a FREE hold** (THE DROP's free room pause), capped at 3 a run (`roomHolds`) — the rules' legs 0 … 6 make room for them.
6. **Leaving with the back button = a hold** (the ticket says RESUME; the hold is taken by the next START). With no hold left, leaving ends it.
7. **A held run's day closes at its 4 am**: a run IN PLAY across 4 am plays on (A RUN KEEPS ITS OWN DAY); a HELD one is scored at its last
   server tap by the next call / THE DAY'S CLOSE.
8. **A refused log scores 0 floors** (JAYWALK's rule: the day's one shot is spent; `bad` on the record) — never a 422.
9. **A daily run doesn't touch HIGH RISE's YOUR BEST / cards** (JAYWALK's daily got that by the owner's later call — not asked here).
10. The seed is `h<n>` (HIGH RISE's seed grammar: printable ASCII); the bucket = 2 floors (101 buckets); the points curve's top = THE
    MOTHERSHIP (200 = 100); a server-closed leg carries `x` (so `settle` never takes a hold's close for the phone's own FIN).
11. The phone's resume shows the stage's announcer line for the replayed streak (e.g. PERFECT ×5) — the rejoin's own behaviour, kept.

## THE RACE THE E2E FOUND (fixed + guarded)
On the return the app's own `today` call ran `settle` beside the resume's START: START had just closed leg 0 (its `e`) and `settle` read that
as the phone's own FIN → the run ended at 14 floors while the phone played on. Now the server's close writes `x` first and `settle` skips a
leg it closed; `/api` case "THE RACE" + the E2E.

## OPEN FOR BEN
- **RE-PUBLISH THE RULES** (above).
- Nothing else new — DAILY B carries the look (the ticket, the recolour, the share card incl. THE BIG FIVE — your claude/HIGHRISE-PLAN.md).
  Call 4 (the 5:00 cap) and call 9 (YOUR BEST / cards) are yours to flip if you want them different.

## THE FINAL RUN (the Beelink; fresh emulators + `DAILY_TEST=1 DAILY_TEST_OFF=highrise node scripts/serve.mjs 5173 --emu`)
- unit 2,524 / 2,524 (+ `highrise-daily.test.mjs` 9) · rules 101 / 101 · /api: server 72 / 72 (fresh emulators — one run beside the
  daily suites read 71: a STATS count off by leftover day data, green fresh) · daily-highrise 7 · daily-drop 15 · daily-jaywalk 8 ·
  daily-module 24
- e2e-highrise-daily 17 / 17 · e2e-highrise (FAST) 70 / 70 · e2e-highrise-match (FAST) 35 / 35 · highrise-alloc 12 / 12 (ZERO GARBAGE —
  the stage's frame touched) · e2e-daily 122 / 122 (a server with `DAILY_TEST=1` only — with `DAILY_TEST_OFF=highrise` its dock count is 4,
  not 3: that suite's own setup) · smoke 24 / 24
- Budgets: HIGH RISE 2,543 of 2,600 KB (the run module is outside the graph); THE BOOT green (boot-budget.test). CLAUDE.md 39.4 KB.
- Not run: the harbor groups (no city file touched — the dailies screen's one DAILY_RUNS line + the judge's pass-through only).
- Every server this pass started is stopped (the emulators, serve.mjs :5173); Ben's :5190 left running.
