# FABLE REVIEW #2 — THE DAILY MODULE (Nov 8 2026, read-only)

> **DFIX2 (Nov 8 2026) fixed the MUST FIX, all seven SHOULD FIXes and two OPTIONAL items — each finding below carries its `DFIX2:` line. SCORES → YOUR TABLE became SLIM CARDS in the same pass (docs/progression.md "DFIX2").**

A fresh reviewer who did not build THE DAILY MODULE (DM1 + DM2) or either daily, over `main` at `8501cf2d` (DM2's last docs commit). Nothing in
the games, the server, the rules, the tests or the styles was changed. Every finding below was proved with a probe against the real `/api/daily`
on the emulators (node-level, the way `tests/integration/*.test.mjs` call it), a browser probe on the test server (`DAILY_TEST=1 node
scripts/serve.mjs 5195 --emu`), or a file + line. The probe scripts were deleted after the run; what each did is written beside its finding so
DFIX2 can turn it into a test. Read-only GETs against neonspeakeasy.com confirmed what the live site serves; nothing there was written.

## The verdict

**Safe to flip on for Ben and his friends after ONE small server fix.** The things that would hurt are solid: every daily node is closed to every
client (anonymous, signed-in, the owner on a phone — reads and writes), the switch is enforced on the server (OFF → 404 for start / guess / dig /
finish and an empty `today`), the fake daily and the test rows exist only under `DAILY_TEST` (Vercel has no such variable — a dashboard check), the
secret schedule + the day's board live only in the database, RESEED is owner-only on the server with a real dry run, the call budget is one
transaction (no gap for a burst), the sweep bonus and the daily XP land exactly once under racing finishes and retries, nothing leaks after 30
opens of the DAILY screen, and 60 fps holds at 4× CPU on the overlay and on both new cards. **The one MUST FIX:** a run that crosses 4 am Eastern
(DFIX1's "a run keeps its own day") resets the player's day counters when it finishes, so BOTH days lose their sweep and PERFECT WEEK's run — a
silent loss of rewards, a small fix in `core/progress.js`. **Before the dailies go PUBLIC** (the SHOULD FIXes): PENTHOUSE is decided at finish
time against the finishers so far (the day's best early finisher can never win it; a rank-1-for-now at 50 keeps it after better scores land),
a RESEED in the last minute before 4 am gives COAST CLEAR's new day the old key on a warm server, the title and the DAILY screen never turn over
at 4 am by themselves, the RESUME chip can outlive its run by a day, and the host's "MID-DAILY" poll is the module's biggest invocation cost after
the digs. **One decision only Ben can make:** THE THROWAWAY GATE stops a same-day profile from RANKING, but not from LEARNING — two throwaways
(of the 20 a day an IP gets) still hand an established profile today's two words and all 18 searchlights, exactly review #1's finding 2. That is
Wordle's problem too; it is fine for friends and wants a choice before the public.

## MUST FIX (blocks the switch)

### 1. A run that crosses 4 am wipes the other day's counters — both days lose THE SWEEP, PERFECT WEEK's run never grows
- **What:** `core/progress.js#dailyStep` (line 183) keeps ONE day's counters, `dl.day = { k, g, x, sw }`, and resets them whenever the finish's
  `day` differs from `dl.day.k`. DFIX1 made a run finish on ITS OWN day (`api/daily.js#dayOfCall` accepts yesterday). So: finish today's
  dailies after 4 am (`dl.day.k` = today), then finish the run you started at 3:50 (`day` = yesterday) → `dl.day` is replaced by `{ k: yesterday,
  g: { thatGame } }` — yesterday's OTHER finishes are gone (no sweep for yesterday even though every daily was finished on it), and today's are
  gone too (no sweep today when its last daily lands). `dl.sr` (PERFECT WEEK's run) can't grow either. The player sees nothing — the +10 and the
  cards simply never come.
- **Proved (the probe):** three fake dailies on the list (`registerTestDaily` fa + fb + `test`, the two real rows `on = false` — the same trick as
  `daily-module.test.mjs`). Day A 10 pm: fa + fb finished. Day A 3:50 am: `test` started, not finished. Day B 4:05 / 4:06: fa + fb finished
  (`dl.day = { k: B, g: { fa, fb } }`). Day B 4:10: `finish test { day: A }` → accepted (DFIX1) → `dl.day = { k: A, g: { test } }`, `swept false`.
  Day B 4:15: today's `test` → `dl.day = { k: B, g: { test } }`, `swept false`. Expected `dl.sw = 2, dl.sr = { d: B, n: 2 }`; got `dl.sw = 0,
  dl.sr = null`, `the-triple` never awarded, 6 `daily_*` keys in `m` (every finish counted once — the XP is right, only the sweep is lost).
- **Fix:** keep TWO days of counters: `dl.days = { [dayKey]: { g, x, sw } }` (prune anything older than yesterday), read / write the run's own
  day's entry, and when a sweep lands out of order (yesterday's after today's) recompute `dl.sr` from the two kept days (`d` = the later swept
  day, `n` += 1 when the earlier day is its predecessor). `dl.day` can stay as a mirror of today's entry for the screens. Pin the probe's
  timeline in `tests/daily.test.mjs` (pure `dailyStep`) + one `/api` case in `daily-module.test.mjs`.
- **Size:** small (≈ 20 lines + two tests).
**DFIX2: FIXED** — `core/progress.js#dailyStep` keeps EACH DAY's own counters (`dl.days = { [day]: { g, x, sw? } }`, the two newest; `dl.day` = a mirror of the newest), and PERFECT WEEK's run bridges a sweep that lands out of order (`sweepRun` — yesterday's late finish after today's; `dl.sp` holds the run that ended the day before while the gap may still close). The probe's timeline is pinned pure (`tests/daily.test.mjs` — both orders) and over `/api` (`daily-module.test.mjs`: fa + fb on A, the run from 3:50, fa + fb on B, the finish on A → A swept, B's finishes kept, B's `test` → `dl.sw = 2`, `dl.sr = { d: B, n: 2 }`, six keys, the XP exact).

## SHOULD FIX (before the dailies go public)

### 2. PENTHOUSE is decided at finish time, against the finishers so far
- **What:** `api/daily.js#finish` (line 188) passes `rank = stand.better + 1` and `n` = the finishers AT THAT MOMENT to `dailyStep`, which awards
  PENTHOUSE when `isPenthouse(rank, n)` (`core/daily.js:48` — n ≥ 50 and rank ≤ max(1, ⌊n / 100⌋)). So the 49 earliest finishers can never win it
  (n < 50 when they finish), whoever is rank 1 the moment n reaches 50 wins it even on a tie, and keeps it when better scores land later; every later
  tie at rank 1 wins it too. "Top 1 % of the day" is only true for whoever finishes last.
- **Proved (the probe):** 60 established profiles on the fake daily, scores: #1 = 950, #2–#49 = 500, #50 = 950, #51 = 1000, #52–#60 = 500. PENTHOUSE
  (`penthouse-suite` + `card-penthouse`, `dl.ph`) went to **#50 and #51 only**. #1, with the same 950 as #50 and the best score for 49 finishers,
  never had a chance; #50 is rank 2 of 60 by the day's end and keeps the card; the one true rank-1 is #51.
- **Fix:** decide at the day's close. One idempotent "close yesterday" step, run lazily by the first `/api/daily` call after 4 am (like THE 4 AM
  PICKER — a transaction on `dly/{game}/{yday}/closed`): read `dly/{game}/{yday}/r` (counted finishers only: skip `x/{pid}`), n ≥ 50 → rank them
  (ties share a rank), grant the top max(1, ⌊n / 100⌋) through a `pstats/{pid}` transaction each (`dl.ph += 1` + `awardAll`), and remember the
  winners under the day. The finish keeps awarding nothing for PENTHOUSE until then (or keep the at-finish award AND re-scan at close — adds only,
  nobody loses; Ben's call — question 2). The `today` answer can then show PENTHOUSE's result on yesterday's ticket line. Test: the probe's 60
  finishers → #51 only; a tie at the top → both; n = 49 → nobody; the close run twice → nothing more.
- **Size:** medium (≈ 60 lines + the test). Dormant until a day has 50 counting finishers — nothing for Ben and his friends, everything once public.
**DFIX2: FIXED (Ben's decision 2 — the day's close)** — `api/_lib/daily-close.js`: the first `start` / `today` after 4 am Eastern closes every unclosed day it finds (yesterday back to `LOOK_BACK` 7), each ONCE (`dly/{game}/{day}/c` claimed by a transaction — `busy` → `done`; a `busy` older than 10 min is retaken); the winners = `core/daily.js#penthouseWinners` (rank ≤ max(1, ⌊n / 100⌋) of the day's FINAL counting finishers, n ≥ 50, a non-counting `x` left out, ties at the cutoff all win) each get `progress.js#penthouseStep` in ONE pstats transaction (idempotent by `m/ph_<game>_<day>`) + `bumpOwners`; the finish awards NOTHING for PENTHOUSE any more (`dailyStep`'s branch gone). The player meets the card on their next visit. Tests: the probe's 60 → #51 only (#50 lost it, #1 never had it), a tie at the top → all, 49 → nobody, two racing closers → one grant, the stale `busy`, a week of silence closes every day once (`daily-module.test.mjs`; pure: `tests/daily.test.mjs`).

### 3. A RESEED in the last minute before 4 am gives COAST CLEAR's new day the OLD key on a warm server
- **What:** `api/_lib/daily-secret.js` caches the keys ~60 s per warm function (`TTL_MS`); `api/admin.js#dailyReseed` runs on the ADMIN function
  and its `clearSecretCache()` / `forgetPicks()` / `forgetPwDays()` clear only that instance. A warm `api/daily` instance that read the keys at
  3:59:30 still holds them at 4:00:05; the new day's first `start` builds COAST CLEAR's board from `dailySecret(newDay)` → the OLD base key →
  `boardFor` stores it (first write wins), and every fresh instance then reads that board. The day is consistent for everyone, but it is the
  board anyone who had the old key could have computed — the one thing RESEED exists to prevent. THE PASSWORD is NOT affected: `pwDay` reads the
  frozen schedule the reseed already rewrote (the key only matters when the schedule is extended).
- **Proved (the probe):** this process = the warm daily instance (keys filled at 3:59:30 on day A, day A's pair + board loaded); a CHILD process = the
  admin instance running `reseedDailies({ now: 3:59:35 })` (its clears never reach the parent). At 4:00:05 the parent's `dailySecret(dayB)` ===
  the reseeded key → **false** (it is the old base key); `boardFor(dayB, stale key)` stored a board that differs from `buildBoard(dayB, new key)`;
  `pwDay(dayB)` = the reseeded schedule's pair → **same**. At 4:01:05 (the TTL passed) the key is the new one. Every other memo is keyed by day
  (`PICKED`, `DAYS`, `MEM`) and so can never serve a stale day; the switch's 30 s cache means ON / OFF reaches every instance within 30 s.
- **Fix:** `pickDay` (api/_lib/dailies.js:92) calls `clearSecretCache()` before loading a day it has not seen (one extra read per day per instance),
  OR `dailyReseed` refuses within 2 minutes of 4 am Eastern with "try again after 4:02". The first is a one-liner and covers the 4 am turn
  itself. Test: the child-process probe above, in `daily-module.test.mjs` (a `dailyKeys(T0)` fill, a reseed through `adminAction` with a cleared
  cache, then `pickDay(dayB, T0 + 35 s)` → the stored board = the new key's).
- **Size:** small.
**DFIX2: FIXED (Ben's decision 5 — the one-liner)** — `api/_lib/dailies.js#pickDay` calls `clearSecretCache()` before loading a day this instance has not seen (one extra read a day per instance). Test: the warm instance's keys filled at 3:59:30, the new key written under it (the admin instance's reseed), `pickDay(dayB)` at 4:00:05 → the stored board = the NEW key's (`daily-module.test.mjs`).

### 4. Nothing turns over at 4 am by itself — the title and the DAILY screen keep yesterday until the page is hidden and shown
- **What:** `js/screens/daily.js#tickNext` (lines 202–206) only redraws the countdown each second; when it reaches zero it starts over at 24:00:00 and
  TODAY still shows yesterday's tickets as DONE, the sweep as SWEPT. `js/daily/today.js#loadToday` is asked only on a mount, a finish, the DAILY
  screen opening and the dock's `visibilitychange` (title-dock.js:248) — a phone left on the title overnight (the TV on the shelf, the iPad) keeps
  ALL DONE and the check until it is hidden and shown. A run opened from a stale TODAY still works (the server opens today's run; `run-day.js`
  asks for yesterday's only while it is unfinished).
- **Proved:** by reading — no caller of `loadToday` depends on the clock; `cache` has no day check (`today.js:16–27`).
- **Fix:** `today.js` keeps `cache.day`; a cheap 30 s tick (or the countdown's zero in `tickNext`) compares `streakDay(serverNow())` with it and calls
  `loadToday({ fresh: true })` once; the dock's `paint` runs from `onToday` as today. Test: `tests/daily-screens.test.mjs` with a fake clock, and
  one e2e-daily check with the server's `now` pushed past 4 am (the suites already stub time through `dailyAction(..., now)`).
- **Size:** small.
**DFIX2: FIXED** — `js/daily/today.js`: `today` carries its `day`; `loadToday` treats an answer from another day as stale whatever its age (`today-logic.js#dayTurned` — the dock's visibilitychange re-read included); ONE timer to the next day start (`armTurn` → `turnNow`, re-armed after every answer) and the DAILY screen's countdown reaching zero turns it over too — the tickets back to PLAY, the dock to WAITING, no reload; a run in flight keeps its own day. Tests: `tests/daily-screens.test.mjs` (`dayTurned`), `e2e-daily.mjs` (a stale answer on an open DAILY screen → the turn re-reads today, the screen stays).

### 5. RESUME YOUR DAILY can outlive its run by a day
- **What:** the chip's hold (`daily:held` — today.js:46) carries `{ id, day, at }` but the dock shows it on `hr && live && mine[hr.id] == null`
  (title-dock.js:237–240) with NO day check. A run held on Monday night and never resumed: Tuesday the chip still reads RESUME YOUR DAILY (Tuesday's
  COAST CLEAR is unplayed, so `mine` is empty); a tap opens Tuesday's fresh run (Monday's is lost to the 4 am rule — correct) under a chip that
  said RESUME. The hold is dropped only on a mount or a finish.
- **Proved:** by reading (the same lines); e2e-daily covers the same-day loop only.
- **Fix:** in the dock's `paint`: drop the hold when `hr.day` is older than yesterday's key, or when `today.day !== hr.day` and `today.started[hr.id]`
  is not set (the server says no run is in flight). Also finding 7 below makes `started` honest for yesterday's run. Test: a unit on the chip rule
  (`today-logic.js` gets a `chipState(today, held)`), one e2e line.
- **Size:** small.
**DFIX2: FIXED** — `today-logic.js#chipState` (the dock's `paint` uses it): 'show' only while the held run is still resumable — its daily live, no score of yours in, its day today's or yesterday's with the server saying a run is still in flight there (finding 7's `started` + `startedDay`); otherwise the hold is dropped and the chip clears itself. Tests: `tests/daily-screens.test.mjs` (every case), e2e-daily's chip loop as before.

### 6. The host's MID-DAILY poll is the module's biggest cost after the digs
- **What:** `js/screens/room-city.js#watchMid` (lines 313–330): while a phone is HOST, the room is not playing and a daily is live, it POSTs
  `/api/daily { action: 'room' }` every 20 s — 180 invocations an hour per open lobby, each reading 4 × games × players database nodes
  (`daily-room.js#midDaily`). It stops when the room plays or the host leaves. A party that chats in the lobby for an hour costs more
  invocations than both dailies played by all eight.
- **Proved:** by reading; the cost table below counts it.
- **Fix (two ways):** (a) cheapest to build: poll every 60 s and only while the room has ≥ 2 players; (b) zero invocations: a phone mid-daily writes
  `rooms/{CODE}/players/{uid}/dy: 1` (its own node — the rules already let a player write it; add a `dy` boolean validate), the host reads it from
  the mirrored room state, the server's `room` action stays for the e2e. (b) is a rules change → THE RULES-LAG (the ack + RE-PUBLISH). Question 4.
- **Size:** small either way.
**DFIX2: FIXED (Ben's decision 4 — the flag, zero invocations)** — `js/daily/room-flag.js`: a phone with a run OPEN or HELD while in a room writes `rooms/{CODE}/players/{uid}/dy = true` (its own node; `database.rules.json`: a boolean, the player's own, nothing else — THE RULES-LAG ack + RE-PUBLISH), cleared on finish / a close unheld / a dropped hold / leaving; `room-city.js#paintDock` counts the flags in the mirrored room — the 20 s poll is GONE (`room` stays for the tests). Tests: `rules.test.mjs` (own true / null / false ok; a number, a string, another player's, the host's hand, another field refused), `e2e-daily.mjs` (the host's line from the flag, the flag's life through the hold, the resume and the finish).

### 7. `today` says PLAY for a run that is still in flight from yesterday
- **What:** `api/daily.js#today` (lines 211–212) sets `started[g]` from TODAY's `s` / `r` only; `midDaily` (daily-room.js:34) knows about yesterday's
  unfinished run, `today` does not. Between 4 am and the resume, the ticket reads PLAY (not RESUME), the dock counts it as waiting, and a tap does
  resume the old run (run-day.js) — so the word is wrong, the behaviour right. Also feeds finding 5.
- **Fix:** the same `(!s && s0 && r0 == null)` check `midDaily` uses, → `started[g] = true` (+ `startedDay: yesterday` if the screen wants to say
  "FINISH YESTERDAY'S"). One `/api` test.
- **Size:** tiny.
**DFIX2: FIXED** — `api/daily.js` `today`: yesterday's unfinished run (no start today, a start and no score yesterday) → `started[g] = true` + `startedDay[g] = yesterday`; the ticket reads RESUME, the dock counts it, the chip's rule knows its day. Test: `daily-module.test.mjs` (finding 1's timeline checks it between the days).

### 8. A room of ONE counts as "a room that really started a game"
- **What:** `daily-room.js#roomStarted` accepts any room with `status: 'playing'` (or a fresh `go` stamp) that lists the player — a solo PRISM DROP
  room qualifies. So one player can stop COAST CLEAR's clock on purpose: 3 pauses, 20 minutes in all, +15 s each (the DFIX1 caps hold). GHOST RUN
  (≤ 50 s on the score clock) cannot be bought this way (two pauses already cost 30 s), a better LIGHTHOUSE time and a better rank can — 20 minutes of
  free thinking for +30 s.
- **Proved (the probe):** `rooms/SOLO = { meta: { status: 'playing' }, players: { solo } }` → `pause` accepted; resume after 19 min; a 2nd pause; the 3rd
  → 409 `pause_limit` (the 20-min cap closed it); the record `p = { n: 2, ms: 1200000 }`.
- **Fix:** require ≥ 2 live players in the room for THE ROOM WINS (`Object.keys(players).length >= 2`), or accept it (question 3). One test line.
- **Size:** tiny.
**DFIX2: FIXED (Ben's decision 3 — two players)** — `daily-room.js#roomStarted` needs `MIN_PARTY` (2) players in the room (distinct uids); a room of one → 409 `no_room_game`, the clock runs (the phone still holds the run + shows the banner / RESUME). Tests: `daily-module.test.mjs` (one → refused, two → accepted; the COAST CLEAR suite's fixture gained its host), `e2e-daily.mjs` (CASEY alone starts a game: the run held, no pause on the record).

## OPTIONAL (label: polish)

- **A 500 on the day's first start when the database hiccups** (**DFIX2: FIXED** — the second load's failure → 503 `busy`; a test)**:** `api/daily.js:92` swallows `pickDay`'s failure, then line 100 calls `cart.load` again
  and throws → a 500 (`server`) instead of a 503 the phone would retry. Let the second call's error map to 503 `busy`. Tiny.
- **The room banner wraps at 390** (**DFIX2: FIXED** — 12 px / 0.1 em, `white-space: nowrap`; one line at 390 / 393 / 412 / 430)**:** "GAME STARTING · YOUR DAILY IS / SAVED" is two lines at 390 (one at 402 / 430 — `css/daily.css:140–143`,
  12.5 px / 0.14 em on `max-width: 100vw − 32px`). DM2's refine aimed for one line; a 12 px letter-spacing 0.1 em fits 390. Look only.
- **YOUR SCORE COUNTS FROM TOMORROW** (DFIX2: LEFT — reads fine) wraps to two lines on the ticket at 390 (reads fine; the ticket grows 14 px). Look only.
- **THE LAB page** (admin-only) with 54 effect slots runs at 30 fps at 2× CPU and 14.5 at 4× — a tool, never a player screen; the cards alone hold
  60 (below). Nothing to do unless Ben reviews the lab on a phone.
- **Two per-id tables remain for the dailies' look** (DFIX2: LEFT for the third daily)**:** `screens/daily.js:228 themeInk` and `share-today.js:11 INK` (the two inks; a third daily gets the
  house pink) and `TICKET_ART` (a star for an unknown ticket key). Everything else walks the list; a new daily's row could carry `ink` + `ticket`
  art to make even these go away. Tiny, when the third daily comes.
- **DST:** `dayStartAt` finds the 4 am instant by testing 08:00 / 09:00 UTC (`core/streak.js:37–41`); checked for Nov 1 2026 (the fall-back day:
  09:00 UTC) and Mar 8 2026 (the spring-forward day: 08:00 UTC) — right on both. The gate's 3:59 / 4:01 edge is in `daily-module.test.mjs`.

## QUESTIONS FOR BEN (the code can't decide these)

**Ben, Nov 8 (DFIX2's Step 0): "go with all of his recommendations"** — 1 (a) accepted for now, (b) when public; 2 the day's close; 3 two players; 4 the flag; 5 the `pickDay` clear. All five built in DFIX2 except 1 (b), which waits for the public day (docs/games/plan.md DFIX2 — BEFORE PUBLIC).

1. **The throwaway leak — accept it for now?** THE THROWAWAY GATE works exactly as decided (a same-day profile plays, keeps its streak + XP, never
   ranks, never gets a reward, is missing from YOUR TABLE and the band — all re-proved). But it does not stop review #1's finding 2: the throwaway
   is still TOLD the word when a door closes and SHOWN all 18 lights when caught, and an established profile then plays with the answers.
   **Proved:** `t1` (made today) fails THE FRONT DOOR with six misses → `word` = W1 (counted false, nothing awarded); `t2` opens door 1 with it,
   fails THE BACK ROOM → W2; the established profile guesses W1, W2 → **score 2, counted, KEYHOLE + SAFECRACKER**, the day's n = 1. COAST CLEAR:
   `t1` digs three lights → `reveal` (18 cells); the established profile digs every safe cell in 10.8 s → **LIGHTHOUSE + GHOST RUN**. Two new
   profiles of the 20 an IP gets a day. Options: **(a) accept for the friends months (recommended now — Wordle lives with it, and there is no
   leaderboard anyone outside the table can see yet)**; (b) cheap, when public: a non-counting run gets NO reveal (LOCKED OUT without the word,
   CAUGHT without the lights) — blunts the fail-to-learn path, not solve-to-learn; (c) stronger: a new profile's first daily opens the NEXT day
   (no play on day 0) — a cheat then needs a day's notice per throwaway, and the IP cap bites across days. None of them closes it fully; a
   same-puzzle daily never can.
2. **PENTHOUSE's rule (finding 2):** decide it at the day's close (recommended — "top 1 % of the day" means the day), or keep the at-finish award and
   ADD a close-of-day scan so the early best finishers get it too (nobody loses a card they were shown)?
3. **THE ROOM WINS for a room of one (finding 8):** require two players (recommended — a room of one isn't a party), or leave it?
4. **The MID-DAILY line's cost (finding 6):** the player-node flag (a rules change + re-publish; zero invocations — recommended) or a 60 s poll?
5. **RESEED's clock rule (finding 3):** the one-line cache clear in `pickDay` (recommended), or an admin rule "never in the two minutes before 4 am"?

## WHAT'S SOLID (checked; DFIX2 need not re-check)

- **The rules:** as signed-out, as a signed-in player and as another player: `dly` (and every leaf: `b`, `r/{pid}`, `p/{pid}`), `dsched/password`,
  `dsecret` (+ a key), `progress/dailies`, `ppriv/{pid}/at`, `rl/dc_{uid}` → every read and write permission-denied; a player can't write their own
  `profiles/{pid}/at`, `pstats/{pid}/dl` or `uids/{uid}`; `pstats` readable by its owner only; one `profiles/{pid}` readable at a time by design
  (`at` is visible there, but the gate reads `ppriv/at`, server-only). The owner on a client is just a client. (The rules probe: 60 cases.)
- **The switch is server-side:** OFF → `start` / `guess` / `finish` 404 `no_daily` for the real dailies AND the fake, `today.dailies = []` → no
  button; ON → the list's rows answer, the fake never; `dailySwitch` / `dailyFresh` / `dailyReseed` sit behind the admin gate (`api/admin.js:224`,
  `ADMIN_PIDS`), every flip audited (`daily-module.test.mjs`). The fake daily + `registerTestDaily` need `DAILY_TEST=1` (`dailies.js:33–37`) — whether
  Vercel has it set is a dashboard check only Ben can do (it should not).
- **RESEED:** PREVIEW (no `confirm`) writes nothing (the keys + the schedule unchanged after a dry run); RESEED NOW needs `confirm: true` (the
  admin page's second tap); a new key from the NEXT 4 am only; today + the past + every result untouched; safe twice ("already reseeded"); THE
  PASSWORD's schedule keeps every word through today's pair, the same words after (the suite + the probe).
- **The secret + the public repo:** `api/_data/pw/answers.json` is public on GitHub — the LIST, not the order: the day's pair comes from THE DAILY
  SECRET (random, made once, stored in `dsecret`, never a file — `tests/daily-secrets.test.mjs`) through the frozen schedule; the board from the
  same key. The live site: `/api/_data/pw/answers.json`, `/api/_lib/pw.js`, `/api/_DATA/...`, `/api/%5Flib/...` → **404** (after the 308 to www);
  `/api/time` 200; `/api/daily` GET 405.
- **The day on the call:** `dayOfCall` takes today or yesterday-with-a-start, nothing else (400 `bad_day`); a start never opens yesterday afresh
  (`password.test.mjs`, re-run).
- **THE CALL BUDGET** is one transaction on `rl/dc_{uid}` (`limit.js`) — 400 calls per 10 min, refused at 401, no window between check and count.
- **The IP cap** reads the first entry of `x-forwarded-for` (`http.js#clientIp`); on Vercel that header is set by Vercel's proxy and a client's own
  value is overwritten (Vercel's documented behaviour — not provable from here without writing to the live site, so: Ben can confirm once with
  `/admin`'s error log, which records the ip). Loopback never counts (the emulators). 20 a day; the 21st → 429, nothing made (the suite).
- **The rewards under stress (probe):** two finishes at the same instant → `swept` once, `dl.sw = 1`, XP = 2 × 15 + 10 = 40 exactly; a retried
  finish → `again: true`, the stored score, `outcome: null`, XP unchanged; a same-day profile → `counted: false`, no band, out of the day's `n`.
  DAILY_XP once per daily per day (`m/daily_<game>_<day>`). The everyone band / line only from 50 counting finishers (`BAND_MIN`, both in `finish`
  and `today`).
- **PERFECT WEEK with the list changing mid-week:** the sweep is judged per day against THAT day's live list (`sweptDay(dl.day.g, today)`), so a daily
  added makes the next days harder and a daily removed easier — the run never resets from a list edit, only from a day without a sweep.
- **THE ROOM WINS, the honest cases:** no room / a lobby / a room the player isn't in / a stale `go` → 409 `no_room_game`; the `go` stamp (the walk
  inside) and `status: 'playing'` → accepted; the seat finds the room with no code; the caps 3 / 20 min hold (the suite + the probe); on screen the
  banner, the hold, the pause, RESUME, the unpause on mount (`coastclear/view.js:366`) — e2e-daily's full loop, 5 runs. The held run itself lives
  on the server (the record + the pause), so a phone lock, an app switch, a refresh, a host change mid-match or the match ending while this phone is
  offline change nothing; a second device simply sees the ticket IN PROGRESS → RESUME (the chip is per device) and the mount unpauses it.
- **Plug-and-play:** a fake 3rd + 4th daily join the picker, `today`, the sweep, the XP cap and SHARE TODAY with no other change (the suite; the
  screen's `?state=fake3` preview shows the third ticket with the star art and "1 OF 3 · THE SWEEP"); the only per-id tables are the two inks + the
  two ticket arts (OPTIONAL above).
- **No leaks:** 30 opens / closes of THE DAILY SCREEN over the live city (the real app on `?emu`): overlays 0 → 0, `cityHeld` false → false, timers
  12 → 13 (one more after the first open, not growing), canvases 3 → 3, the JS heap 56 → 50 MB, no page errors; with the screen open the city is held.
- **Speed:** 390 × 844 @3, 4 s of rAF — THE DAILY overlay at rest and during the sweep moment: 60.1–60.4 fps at 1× / 2× / 4× CPU, 0 frames over
  25 ms; PENTHOUSE (THE DIAL) strip + full card and PERFECT WEEK strip + full card, each alone on screen (the lab page with the other slots hidden):
  59.8–60.3 fps at 1× / 2× / 4×, 0 frames over 25 ms.
- **The look (390 / 402 / 430, both looks — shots.mjs `--page`):** TODAY (waiting, in progress, mixed, swept, gated, a 3rd daily), SCORES, THE
  PRACTICE HARBOR (steps 0 + 2), the banner, the dock WAITING + the count and ALL DONE + the check, both cards in THE LAB. No pills (the tickets are
  drawn, the buttons' radius 10 px), no emoji, no dev text, the check + the sweep segments as marks (never colour alone), the smallest type 11 px
  (the ticket's sub-line, one line at 390 except the two wraps noted), the share lines spoiler-free (`scoreLine`: guesses / LOCKED OUT, m:ss /
  CAUGHT), the practice harbor once per player on the profile (`pstats/{pid}/ls` — the suite). Ben approved all six daily cards in THE LAB (Nov 8).
- **DFIX1 still holds:** the day on the call, the pause caps, 400 on a stray action, THE PASSWORD's sounds + the first-tap catch in e2e-password,
  the finish retried 4×, no HELD line, the 11 px sublines, the countdowns on the server clock — all in the suites below, green 5 × 5 × 5.

## COST TABLE (the free plans; what the code does today)

| per active player-day | calls (= Vercel invocations) | database reads |
| --- | --- | --- |
| the title: `today` on each visit + each return to the tab | 2–4 | ~6 + 2 × friends × dailies (≤ 54) each |
| THE DAILY SCREEN: `today` on every open (+ friends once) | 2–4 | the same |
| THE PASSWORD: start + ≤ 12 guesses + finish (+ a retry) | 9–15 | ~5 a call |
| COAST CLEAR: start + 50–110 digs / chords + finish (+ pause / resume) | 55–115 | ~4 a call (the board is a memo) |
| the lesson (once ever) | 1 | 1 |
| **a player who plays both** | **≈ 70–140 (say 100)** | **≈ 600 small reads (≈ 150 KB)** |
| a HOST waiting in a lobby with a daily live (finding 6) | **180 an hour** | 4 × dailies × players each |

- **Vercel Hobby (1,000,000 invocations a month):** 100 players a day ≈ 300k a month + lobbies — fine. **1,000 players a day ≈ 3M a month — three
  times the Hobby limit on the dailies alone** (COAST CLEAR's one-call-per-dig is 80 % of it). Before ~350 players a day the dailies need either
  Pro or batched digs (one call per burst of taps — the view already pipelines them). The functions stay at 8 (≤ 12).
- **Firebase Spark (10 GB download a month, 1 GB stored, 100 simultaneous connections):** 1,000 players a day ≈ 4.5 GB download a month (fine);
  storage grows ≈ 1 KB per player per daily per day in `dly/` (the record `p`, `s`, `r`, `x`, the histogram) → **100 players: ≈ 6 MB a month (1 GB in
  ~13 years); 1,000 players: ≈ 60 MB a month (1 GB in ~16 months)** plus `pstats/m` (≈ 30 KB a player a year) and one `rl/dc_{uid}` a uid forever.
  **Cleanup of `dly/` (days older than ~30: keep `h` + `n`, drop `p` / `s` / `r` / `x`) must exist before the dailies pass ~500 players a day**, as
  an admin action or a lazy step at the 4 am close (the same hook finding 2 wants). The 100-connection limit: every warm Vercel instance holds one
  admin connection; a busy evening of digs could keep 20–40 warm — count them with the rooms' phones (THE PARKED DATABASE keeps title phones off).

## THE SUITES (the Beelink, the emulators + `DAILY_TEST=1 node scripts/serve.mjs 5195 --emu`, nothing else busy; nothing changed, so they must match DM2's green)

One after the other, in order (`scratchpad/run-suites.sh`, deleted after); every run green, **no flake in 15 E2E runs**:
- unit `node --test tests/*.test.mjs`: **1,376 / 1,376** (37 s).
- `rules.test.mjs` **68** · `server.test.mjs` **40** · `daily-module.test.mjs` **12** · `password.test.mjs` **9** · `coastclear.test.mjs` **12** · `progression.test.mjs` **10**.
- smoke `GAMES=overclock`: **5 / 5** (26 s).
- **e2e-password × 5: 40 / 40 every run** (28.2–28.3 s) · **e2e-coastclear × 5: 36 / 36 every run** (34.3 s; the 150 ms line: every press shown in the same
  event, ≤ 0.8 ms; 6 taps in flight answered in 193 ms) · **e2e-daily × 5: 36 / 36 every run** (30.8–31.1 s).
- the harbor groups DM2 touched, `ONLY=core,dock,cartridge,vault,room,gamestart,stripfit,platefit,corners,shell`: **143 / 143** (556 s; vault 277 s).
- The probes: the rules probe (60 cases, all denied), the gate-leak probe, the 4 am-turn probe, the PENTHOUSE probe (60 profiles), the stale-cache
  probe (a child process as the admin instance), the solo-room / race probe, the browser probe (30 opens; fps at 1× / 2× / 4×) — their numbers are
  in the findings above. The emulators + the test server were started fresh for this pass and stopped at its end.
- Not provable here: an iPhone (no WebKit on this machine); Vercel's `DAILY_TEST` and `x-forwarded-for` (dashboard checks); the live switch itself
  (never flipped, never written).
