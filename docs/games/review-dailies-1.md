# FABLE REVIEW #1 — THE DAILIES: THE PASSWORD + COAST CLEAR (Nov 7 2026, read-only)

A fresh reviewer who did not build either game, over `main` at `dcde1208` (CC2 — the cloud fix). Nothing in the games, the server, the tests or
the styles was changed; every finding below was proved with a probe against the real `/api/daily` action on the emulators (node-level, the way
`tests/integration/*.test.mjs` call it), a failing case, or a file + line. The probe scripts were deleted after the run; what they did is
written out beside each finding so the fix pass can turn it into a test.

## The verdict

The two dailies are well built where it matters most: the answers and the board never leave the server, every guess and every dig is judged
inside one transaction on a server-side record, the score and the rewards come from a replay of that record (a phone's claim is ignored), a
repeated or reordered move is free, production without `DAILY_TEST` refuses both with 404 `no_daily`, `api/_data` and `api/_lib` are 404 on the
live site, and the no-guess board maker is sound (an independent exact check of 1,500 real boards found every one of the solver's 95,065
declared cells forced and never wrong). The unit, `/api` and E2E suites pass and are not flaky (5 runs each). Two things must land before
the dailies count for anything: **the 4 am Eastern day turn loses a run in flight** (a finished run whose `finish` lands at 4:00:30 is refused
`not_started` and never recorded — no score, no streak day, no card; a run mid-door simply vanishes and the player gets a different puzzle), and
**a throwaway profile gives the whole puzzle away** (a new anonymous uid is a new try on the same words / the same harbor: 22 `/api` calls turn
into a score-2 SAFECRACKER + KEYHOLE, a caught run's reveal into a 15-second GHOST RUN). The first is a small server fix; the second is a
design decision for THE DAILY MODULE (gate the standing + the rewards on an established profile, rate-limit new profiles) that this review
cannot make for the owner. Under those: unbounded pauses (a scoring exploit), a 500 on a stray action, and THE PASSWORD's sounds never
having been wired into its preview or its E2E page — the most likely reason the owner heard nothing on his iPhone.

## MUST FIX

### 1. The 4 am Eastern turn loses a run in flight (data loss + a broken one-try)
**DFIX1: FIXED** — every call after `start` carries its `day` (`js/daily/run-day.js` in both judges); `api/daily.js#dayOfCall` takes today's or yesterday's with a start there (made up / two back / tomorrow → 400 `bad_day`, no start → 409); the finish scores + streaks on the run's day (`progress.js#playDay(…, day)`); a refresh across the turn resumes (`start { day }`); the review's probe is now `/api` tests in both suites.
- **What:** every `/api/daily` call recomputes the day from the server clock (`api/daily.js:36` `const day = streakDay(now)`) and looks the run up
  under that day only. A run started before 4:00 am ET whose next call lands after it gets 409 `not_started`: a `guess` / `dig` mid-run, AND the
  `finish` of a run that was already complete at 3:59. The phone's view treats `not_started` as out of step and re-syncs from `start` — which
  opens a NEW try on the new day with other words / another harbor. The old day's record stays unfinished forever: no score, no streak day,
  no KEYHOLE / SAFECRACKER / LIGHTHOUSE / GHOST RUN, and the player has silently been handed a second puzzle.
- **Proved:** THE PASSWORD started at 3:58:00 ET (Dec 2 2026), both doors cracked by 3:58:40 (`done: true`), `finish` at 4:00:30 → `409 not_started`;
  `start` at 4:00:31 → a fresh run (door 0, 0 guesses, `done: null`). A second player mid-door: `guess` at 4:00:30 → `409 not_started`. COAST CLEAR
  started at 3:58, one dig, a dig at 4:00:30 → `409 not_started`. COAST CLEAR's `record()` (view.js:437) treats 409 as non-retryable → "NOT RECORDED ·
  NO SIGNAL" on the end screen; THE PASSWORD's `end()` (view.js:233) the same.
- **Fix:** let a call name its day. `start` already returns `day`; the judges (`password/judge.js`, `coastclear/judge.js`) send it back on every
  guess / move / finish; `api/daily.js` accepts `body.day` when it is today's or YESTERDAY's streak-day key AND `dly/{game}/{day}/s/{pid}` exists
  (else today's); `finish` on yesterday's key runs `dailyStep` with that day (it already takes `day`). The board for yesterday still loads (it is
  stored). Add the straddling case to `tests/integration/password.test.mjs` + `coastclear.test.mjs` (the probe above is the test). THE DAILY MODULE's
  "one try" then means: a run may be finished until 4 am the day after it began, never started twice.
- **Size:** small–medium (server ~15 lines, the two judges one line each, two tests, the docs' "one try" sentence).

### 2. A throwaway profile gives the puzzle away (the rewards + the standing can be bought for free)
**DFIX1: LEFT FOR THE DAILY MODULE** — the owner chose the rule (docs/games/plan.md DFIX1): a daily COUNTS (standing, THE BOARD, rewards, ranking) only for a profile that existed before that day's 4 am Eastern start (not the review's "3 counted matches" — it would block solo players), + a per-IP limit on new profiles. Not built here.
- **What:** everyone gets the same two words / the same harbor, and a new anonymous Firebase uid is a new profile (`api/_lib/profiles.js#ensureProfile`
  creates one for any uid with no limit — the limits there are for `restore` only) and so a new try. A closed door's word and a finished run's
  `reveal` are handed to their own player (the owner KEPT the caught reveal, Nov 7 — plan.md). So: throwaway 1 fails THE FRONT DOOR → its word;
  throwaway 2 opens it in one and fails THE BACK ROOM → its word; the real profile scores 2 → KEYHOLE + SAFECRACKER + the top of the day. COAST
  CLEAR: a throwaway digs blind until CAUGHT (~18 digs) → the reveal of all 18 lights → the real profile digs every safe cell → GHOST RUN + LIGHTHOUSE.
  No rule is broken, the replay is honest; the server cannot tell. (Clearing site data, a private window or a second phone is enough — the
  "ALREADY A MEMBER? BRING YOUR CARD" prompt can be declined.)
- **Proved:** three fresh uids on the emulator, 22 `/api/daily` calls: the real profile's finish → `score 2`, `ach: keyhole + safecracker`. COAST
  CLEAR: the throwaway's third light → `reveal` (18 cells); the real profile's 51 digs 0.3 s apart → `score 15`, `ach: lighthouse + ghost-run`.
- **Fix (the owner's call — THE DAILY MODULE's design):** (a) count a daily for the standing, THE BOARD and the rewards only from an ESTABLISHED
  profile — the simplest rule already in the house: ≥ 3 counted matches, like THE BOARD's `BOARD_MIN_MATCHES` floor (or ≥ 7 days since the profile
  was made, or a profile that has restored its key once); the run is still played + recorded for everyone, the module just says so; (b) a
  per-IP limit on NEW profile creation in `ensureProfile` (the `limited()` helper is right there: e.g. 5 an hour), which also blunts every other
  multi-account trick; (c) NOT recommended: hiding the word / the reveal on a lost run — a throwaway that solves still learns it. Wordle lives with
  this because it has no leaderboard and no cards; NEON SPEAKEASY has both.
- **Size:** medium (the gate in `api/daily.js#finish` + `dailyStep`'s caller ~20 lines, the IP limit ~10 lines, a test each; the module's banner
  text). Decide before the switch-over; nothing else in the two games needs to change.

## SHOULD FIX

### 3. Pauses are unbounded — a scoring exploit (COAST CLEAR)
**DFIX1: FIXED (the owner's caps: 3 pauses + 20 minutes in all — not the review's 2 + 30)** — `logic.js#MAX_PAUSES` / `PAUSE_CAP_MS`; past either → 409 `pause_limit`, the clock running; an open pause closed AT the cap on the next call; the phone's clock + the replay cap the same; unit + `/api` tests.
- **What:** `pause` / `resume` are plain `/api/daily` moves any client may call (`coastclear/judge.js:21`); `logic.js#serverAct` (line 177) caps
  neither the count nor the length. The clock stops for as long as the player likes at a flat +15 s each — so anyone who thinks longer than 15 s
  between moves gains by pausing, and the opening can be studied for free before the first dig (a GHOST RUN's first five deductions planned
  with the clock stopped for 15 s).
- **Proved:** start → pause → 30 min → resume → accepted (`pausedMs 1800000`); 25 more pause / resume cycles of 5 min; the clear → `score 401` = 11 s on
  the clock + 26 × 15 s; `p.n 26`, 155 min stopped.
- **Fix:** in `serverAct`: at most 2 pauses a run (THE DAILY MODULE pauses for a room game; a second one is plausible, a third is not — a third
  `pause` → `409 pause_limit`), and a pause longer than 30 min stops counting as stopped time (`unpause` adds `min(now − at, 30 min)`); the view
  already resumes on mount. Pin both in `tests/coastclear.test.mjs`.
- **Size:** small.

### 4. A stray `guess` on COAST CLEAR is a 500
**DFIX1: FIXED** — 400 `bad_action` for any move a daily doesn't own (guess on COAST CLEAR, dig / chord / pause / resume on THE PASSWORD); a null / non-object body → 400 too (it was a 500 as well); tests in both suites.
- **What:** `api/daily.js:55` calls `cart.judge(...)` for any `judged` cartridge; COAST CLEAR is judged but has no `judge` → `TypeError` → 500
  `server` (logged as `console.error` on Vercel — noise a script can generate at will).
- **Proved:** `{ action: 'guess', game: 'coastclear', word: 'CRANE' }` → an error with no status / code (the route sends 500).
- **Fix:** `if (!cart.judged || typeof cart.judge !== 'function') throw new ApiError(400, 'bad_action', …)` — the moves path already checks `act`
  that way (line 70). One test line.
- **Size:** small.

### 5. THE PASSWORD's sounds: never heard in the preview or the E2E, and iOS-fragile in the game
**DFIX1: FIXED** — both PASSWORD pages install the unlock; ONE daily sound engine (`js/daily/sfx.js`, was COAST CLEAR's) gives THE PASSWORD the first-tap catch + decode-at-unlock; e2e-password proves the sounds start after a trusted tap + the catch (and nothing without a tap); the silent-switch line in docs/password.md. Still unproven on a real iPhone (no WebKit audio here).
- **Why Ben heard nothing in the preview:** `tests/integration/password-preview.html` and `password-daily.html` never call
  `audio/engine.js#installAudio()` — nothing ever unlocks the AudioContext there, `isUnlocked()` stays false and `pwSfx()` (sfx.js:50) returns
  before playing. By construction, silent. COAST CLEAR's two pages install it (coastclear-preview.html:46, coastclear-daily.html:28) and its E2E
  proves its sounds start; THE PASSWORD's E2E never checked a sound (no `played` hook exists in pw sfx.js).
- **In the real game** the console installs the unlock, so sounds will play on an iPhone — with two caveats: (a) no FIRST-TAP CATCH: the kit
  keyboard fires on `pointerdown` (keyboard.js:51), iOS unlocks on the later `touchend`, so the very first key tap's sound (and any sound asked
  in the same tap that unlocks) is dropped — COAST CLEAR's sfx.js holds it ≤ 400 ms and plays it; THE PASSWORD's does not; (b) THE SILENT
  SWITCH: the audio session is `'playback'` only while the music is ON (engine.js:93 `sessionWant`); with music off or muted it is `'ambient'`,
  and iOS mutes Web Audio under the ring/silent switch — a preview page has no music, so even with the unlock installed a phone on silent
  hears nothing. Unproven without WebKit: the catch's timing on a real iPhone, `decodeAudioData` of these mp3s on iOS (CC's are the same
  encoding and were not proven on a device either — docs/coastclear.md says so).
- **Fix:** install the unlock in both PASSWORD pages (two lines); move THE FIRST-TAP CATCH + the decode-at-unlock into ONE shared daily sfx module
  (finding 10) or copy it into pw sfx.js; add a `played` hook + the "sounds start on the context" check to e2e-password like CC's; one line in
  docs/password.md: music off + silent switch = no effects (by design).
- **Size:** small–medium.

### 6. THE PASSWORD's finish is tried once; COAST CLEAR's four times
**DFIX1: FIXED** — `view.js#record()` like COAST CLEAR's (4 tries backed off, nothing on screen while it waits).
- **What:** `password/view.js:233` `await judge.finish()` once; a transient failure (status 0 / 5xx) leaves "NOT RECORDED · NO SIGNAL" until the player
  reloads (a reload re-syncs → `end()` → finish again, so it self-heals, but only on a reload). `coastclear/view.js:437` retries 4× with backoff.
- **Fix:** the same `record()` loop in THE PASSWORD (or the shared daily helper — finding 10).
- **Size:** small.

### 7. "HELD" still shows under the grid on a held door
**DFIX1: FIXED** — the line under the grid is gone (the owner: "no HELD anywhere — LOCKED OUT only"); e2e-password checks no line + no HELD during the held beat.
- **What:** the owner's ADD-ON (plan.md, PW2): "no HELD anywhere". `password/view.js:97` still writes `THE FRONT DOOR HELD · THE WORD WAS <word>` into
  `.pw-reveal` when a door fails; it is on screen for `HELD_MS` (1.1 s) + `LEAVE_MS` (0.4 s) before the end screen covers it, and again for 0.4 s on
  a re-mount onto a lost run. The E2E asserts it (e2e-password.mjs: "HELD · THE WORD WAS" under the grid) and separately asserts no HELD on the
  end screen — so the rule was applied to the end screen only. Ask Ben whether that line should read LOCKED OUT · THE WORD WAS or go.
- **Size:** small.

### 8. The suites: green, not flaky — nothing to fix, two weak spots to know about
**DFIX1:** (a) FIXED — e2e-password now checks the sounds; (b) + (c) LEFT (known, not flakes).
Run on the Beelink against the emulators + `DAILY_TEST=1 node scripts/serve.mjs 5195 --emu`, one after the other, nothing else busy:
- unit (the dailies' files: password, pw-day, password-list, coastclear, cc-board, coastclear-cc2, cartridge, achievements, kit-oc1): 64 / 64.
- `/api`: password.test.mjs 6 / 6 · coastclear.test.mjs 9 / 9.
- **e2e-password × 5: 32 / 32 every run** (26.5–27.0 s each, 0 errors). **e2e-coastclear × 5: 36 / 36 every run** (34.0–34.4 s, 0 errors); the 60 fps
  check held every time at 1× (the sweep 59.8–60 · the catch 59.9–60 · the lighthouse 59.6–60 fps, p95 16.7–16.8 ms); at 4× CPU 52.9–58.4 fps with
  2–8 frames over 25 ms in a 4-second window — fine for "a phone's worst moments" (the check asserts 1× only). The dig round trip on the
  emulators p50 13–14 ms / p95 17–19 ms; on the 150 ms line p50 173–181 ms, the press itself 0.5–0.8 ms.
- Weak spots (not flakes): (a) e2e-password never checks a sound (finding 5); (b) e2e-coastclear's 60 fps runs on the PREVIEW page (no network, the
  fake server) — right for frame timing, but the real page's flood + the server answer landing together is never timed; (c) both E2Es keep a
  handful of fixed `sleep()`s (e2e-coastclear.mjs: 2500 ms for the pause, 120 / 150 / 700 ms around the first-tap catch) — each is a timed thing by
  design (a measurement window), so they pass CLAUDE.md's rule, but the catch's 150 ms one is the most likely future flake on a loaded machine.
- Not provable here: an iPhone (no WebKit on this machine — the catch's timing, the audio session, `ui-rounded`); the share sheet itself (headless
  has none); production's env (`DAILY_TEST` unset on Vercel is a dashboard check).

### 9. Phone readability: good at 390 / 402 / 430 — three small things
**DFIX1:** the sublines FIXED (11 px, one line at 390 / 402 / 430 both looks — the row's gaps tightened so the names fit too; an E2E check); the unlit lamps FIXED (a touch brighter, both looks); the low board at 430 + the 38 pt cells — WON'T FIX now (the owner's layout / decide after the play-test).
Looked at (shots.mjs `--page`, 390 × 844 · 402 × 874 · 430 × 932, both looks): THE PASSWORD mid THE BACK ROOM with all three marks, WELCOME IN,
LOCKED OUT (day); COAST CLEAR mid-run, COAST CLEAR won, CAUGHT (day). No pills, no emoji, no dev text, nothing clipped, the marks never by colour
alone (the bar / the dot read at arm's length), the numbers' colours distinct, the keys 54 pt, the tiles 58 pt, SHARE one tube, the leftover space
at the foot on every end screen as the owner asked.
- **The door row's sublines are 9.5 px** (`css/password.css:124` `.pw-dr-sub` — "4 OF 6 LEFT", "2 GUESSES", "LOCKED OUT"; the names 9–10.5 px, line 122).
  That is the smallest type in either game and under the house floor of 11–12 px (the kit's notes use 11, the countdowns 12). It reads on the
  Beelink's shot; on a phone held normally it is the one line a parent squints at. Raise to 11 px (the row has the width: 390 − the two doors −
  the gap). Small.
- **COAST CLEAR's unlit status lamps** (the three drawn searchlights, 30 pt wide, `--cc-lamp-off` at opacity 0.5, `css/coastclear.css:137`) are faint grey on the night harbor; a player
  mid-run cannot tell at a glance whether one is lit until the gold comes on. Fine by design (lit = gold = obvious), but a slightly brighter
  "off" stroke would let the count be read. Small, optional.
- At 390 × 844 COAST CLEAR's board + status sit centred between the sign and the switch, which leaves ~110 pt of empty harbor above the clock; at
  430 × 932 more. It is the decided layout ("status + board sit together, centred"); it looks a little low on the tall phone. Owner's taste.
- The ~38 pt cells are the owner's known deviation from the 44 pt tap rule (plan.md's 8 × 11 fallback) — see 15.

## NICE TO HAVE

### 10. Duplicated logic the two games should share before THE DAILY MODULE
**DFIX1: LEFT FOR THE DAILY MODULE** — its first two pieces landed (`js/daily/sfx.js` — the sound engine; `js/daily/run-day.js` — the run's day); the rest (clock, share, judge factory, end scaffold) is the module's first group.
Identical or near-identical in `js/games/password/*` and `js/games/coastclear/*` (file:line of the PASSWORD copy, the CC copy mirrors it):
- `logic.js#msToTurn` (password 190 / coastclear 301 — byte-identical), `fmtClock` ↔ `fmtCountdown` (h:mm:ss), `dayNumber` (two implementations of
  the same epoch arithmetic), the `shareLine` shape, `SITE`.
- `share.js` (135 + 109 lines): the two LOOK tables, `rr`, `glowText`, the 1080 × 1350 canvas, the sky / sun / clouds painting, the share-sheet call
  with its three fallbacks (file → line → copy + save).
- `sfx.js` (72 + 104 lines): `fetchBytes` / `buffer` / `start` / the gap table; only CC has the catch + the decode-at-unlock + the `played` hook.
- `judge.js`: the `/api` wrappers; `daily.js`: `daySetProblems`, `create`, `resumeKey`, the `daily` object; `index.js#musicFor` (identical).
- `view.js`: `tickClock` (NEXT … IN h:mm:ss to 4 am), `record` / the finish call, `share`, the `resync` shape, the end-screen scaffold
  (headline · one number · one line · SHARE · the countdown · a quiet NOT RECORDED line), `later` / `wait`.
A `js/daily/` kit (the clock + the countdown, the share canvas + sheet, the sfx engine with the catch, the judge factory, the day-set checks,
the end scaffold) would cut ~400 lines and give the module one place to add the banner, the pause call and the RESUME chip. **Size:** medium —
best done as the module's first group, not before.

### 11. Dead code
**DFIX1: LEFT** — `js/daily/contract.js`, `statusLine`, `resultFor` are the module's to keep or cut when it builds the shared kit.
- `js/daily/contract.js` (`startDaily` / `finishDaily` / `dailyToday`): nothing imports it — both judges call `api('daily', …)` directly.
- `password/logic.js#statusLine`: only a unit test uses it ("no longer on screen").
- `index.js#resultFor` (both games): exported, read by nothing; `feats` is named in cartridge.js's comment but no server path reads a daily's feats.

### 12. Docs that don't match the code
**DFIX1: FIXED** — the first-null write (docs/coastclear.md), progression.md's "none real yet", the `dly/` node in docs/data-model.md, password.md's check count + a cost paragraph, CLAUDE.md's LOOKS line.
- docs/coastclear.md ("a repeat / a refusal → nothing written"): a REFUSED move on a player with no record yet writes `{ st }` (api/daily.js:76 — the
  first-null write). Proved: a chord with no buoys before any move → 422 `chord_count`, the record afterwards `{"st":…}`. Harmless; say so.
- docs/progression.md:124 "none real yet" — two real dailies exist behind `DAILY_TEST`.
- docs/data-model.md has no `dly/` node (`dly/{game}/{day}/s · r · h · n · p · b`) — it is server-only (the rules' default deny, checked), but it is
  the dailies' whole data model.
- docs/password.md:148 "30 checks" (the E2E prints 32); docs/password.md has no cost paragraph (COAST CLEAR's has one — see 14).
- CLAUDE.md's CC bullet still says `LOOKS: ['night']` until CC2 — CC2 shipped both looks (`meta.js:25`).

### 13. The secret schedule is fragile to a list edit
**DFIX1: LEFT FOR THE DAILY MODULE** (freeze before go-live — docs/password.md "The schedule" says so); the list changed now while it is free to.
`pw-day.js` shuffles the WHOLE list per cycle from the pepper; any change to `answers.json` after launch (one word cut) reorders every day of the
current cycle — words already played come back, others are skipped — and nothing records which words a day used. Also: the first day of a cycle
may repeat the last day's word (a new order), and the odd 1,449th word is never drawn in a cycle. **Fix:** at the switch-over freeze the list behind
a version in the HMAC label (`pw-order:<listVersion>:<cycle>`) and make the content test fail on an edit without a bump; or store each cycle's order
once in `dly/password/order/{cycle}` (server-only) and read it back. Small.

### 14. No rate limit on `/api/daily` (cost)
**DFIX1: LEFT FOR THE DAILY MODULE** (a per-player `/api/daily` budget + pruning `dly/`).
Every action costs a function invocation + 2–4 database round trips; `not_a_word` / `chord_count` / `already` are free to the player and unlimited.
A script can burn invocations at will. `api/_lib/limit.js#take` exists: a per-pid budget (e.g. 600 daily calls a day — a COAST CLEAR run needs
~50) costs one more transaction a call; or count only refusals. Small. **The honest numbers:** THE PASSWORD ≈ 10–15 calls a run (start + ≤ 12
guesses + resumes + finish); COAST CLEAR ≈ 50 (docs/coastclear.md's measurement holds). At 100 players × both × 30 days ≈ 200k invocations a month
(Vercel Hobby: 1M), the database traffic ≈ 200 MB (Spark: 10 GB), storage ≈ 2 MB a month; `dly/` is never pruned (the module's job). Fine on the free plans.

### 15. Smaller notes
**DFIX1:** the countdowns on the SERVER clock — FIXED (both games; a run that crossed the turn reads TODAY'S … IS OPEN); the cells — after the play-test; `rankOf`'s shape — the module; the simulations + the share tokens — no change needed.
- The countdowns ("NEXT PASSWORD IN", "NEXT HARBOR IN") run on the phone's clock (`Date.now()`); the server's `now` is in hand on every judged
  answer — use the offset like COAST CLEAR's clock does. Small.
- COAST CLEAR's cells are ~38 pt at 390 wide (CLAUDE.md asks ≥ 44 pt touch targets); the owner chose 9 × 12 knowing it, with the 8 × 11 / 42 pt
  fallback written in plan.md. Decide after the first real play-test, not now.
- `rankOf` / `result()` on the phone side of COAST CLEAR's `daily.js` returns `rank: null` while THE PASSWORD's returns a number — the module will
  want one shape.
- The simulations: COAST CLEAR's GHOST_S = 50 s is the p10 of a bot with GUESSED human think-times (1.4 / 4.2 / 7.5 s log-normal); THE PASSWORD's
  bot cracks ≤ 6 in 22.4 % of runs against a ~10 % target and the doc says so honestly. Both thresholds are reasonable first settings; the real
  `pcount` share after the switch-over is the measurement that matters. Sound as far as a model can be; not validated against people.
- The share cards already read `--good` / `--close` from the live tokens (password/share.js:20, coastclear/share.js:19) — the colour-blind swap
  reaches the image. Good.

## What was checked and found right (so the fix pass doesn't re-check it)
- **Leaks:** no response names an unopened cell or an unplayed door's word (the `/api` tests' `honest()` + `noLeak()`, re-run; a mid-run `start`
  carries no `reveal`); the answer list ⊆ the public `valid-5.json` (1,449 / 6,496; the server's copy is byte-identical to the public one — so
  `not_a_word` can never act as an oracle for the list); `api/_data/*` and `api/_lib/*` → 404 on the live site and on `scripts/serve.mjs`;
  `/__dev/api-lib/` is the dev server's only; no page imports `api/`; the service worker never caches `/api`; `dly/` is under the rules' root
  deny. The day's words / board need the pepper (HMAC); the emulator's `emulator-pepper` is public and irrelevant to production.
- **Scores:** `finish` ignores the phone's `result` (a forged `{ score: 1 }` scores from the record); a forged record with a move after the end replays
  to null; 8 guesses fired at once → exactly 6 accepted, the record holds 6; 3 finishes at once → one claim, `again: true` on the others, one
  histogram entry, `dl.n 1`; a light dug twice → one spot; a dig retried after its flood → `already`, nothing written; a chord with lying buoys →
  the hidden light is dug = SPOTTED; `chord_count` / `not_a_number` tell a light from safe water in no way (the same answers for both).
- **Input fuzz:** strings, floats, negatives, out-of-range cells, 5,000-entry buoy arrays, objects, `null` — every one 422 / 400 except the 500 in
  finding 4; `Number(true) = 1` and `'0x1' = 1` are accepted as cell 1 (harmless).
- **Rewards:** at 50 s → GHOST RUN + LIGHTHOUSE, 51 s → LIGHTHOUSE only, one spot → never GHOST RUN; ≤ 6 → SAFECRACKER + KEYHOLE, 7 → KEYHOLE;
  a held door → nothing; never twice (`grant()` + `dailyStep`'s day key); nothing in production (no cartridge registered without `DAILY_TEST`
  — `tests/integration/*.test.mjs` flip the env and get 404; whether Vercel has the variable set is a dashboard check only the owner can do).
- **No-guess boards:** an independent exact checker (backtracking per frontier component, combined with the global count of 18, self-tested
  against brute force on 400 small states with 0 mismatches) over 1,500 real boards from the server's own `makeBoard` path: 24,903 solver rounds,
  95,065 declared cells, **0 not forced, 0 wrong against the hidden board**, 0 rounds too big to check (the largest frontier 37 cells). ~15
  attempts an accepted board (93 % of rejections are the 10–20-cell opening window, not solvability); of 20 boards the solver REJECTED as stuck,
  8 still had a forced cell by exact logic — the solver is conservative (weaker than exact logic), which is the safe direction.
- **Resume / suspend:** both E2Es tear the screen down mid-reveal, mid-sweep, mid-flood, with typed letters, on the end screen, and reload mid-run;
  the run comes back from the server's record each time, the unsent letters cleared, the buoys from localStorage. The one hole is the 4 am turn (1).
- **Look switching + colour-blind:** every colour a `--pw-*` / `--cc-*` token; `body[data-look="day"]` retokens both; `--good` / `--close` carry right /
  close in the tiles, the keys (css/kit.css:217–221), the mini grids and the share cards; right / close never by colour alone (the bar + the dot; the
  digit itself in COAST CLEAR). The E2Es flip the look mid-guess, mid-dig, mid-flood, mid-sweep and on the end screens with nothing reset. Hard-coded
  colours remain only where they are part of the drawn object (the day sky gradient, `#fff` highlights, the red `#c0304a` fail text by day).
- **Speed:** the E2E's real rAF timing through the sweep, the catch and the lighthouse at 1× and 4× CPU (numbers in 8); every animation transform /
  opacity; layout read once per beam (`spotGeo`), never in a loop; timers and WAAPI nodes cleared on unmount; the rtt / played buffers capped.

## The word-list cuts (api/_data/pw/answers.json — 1,449 words, read in full)
The list is clean on the hard rules: no rude, adult, alcohol, drug or death words survived the two reviewers and the blocklists (the kid-safe list
in `scripts/pw-words/blocklist.mjs` is thorough). What I would still cut, with why:
- **Mean / bullying (the owner's "rude", for a family daily):** taunt · snide · sneer · spite · catty · dorky · inane · vapid.
- **Gloomy or unpleasant:** gaunt · eerie · dingy (keep if the owner likes atmosphere; they read sad).
- **Adult vocabulary / obscure for a kid who plays with the family** (Wordle uses some of these; the owner asked for everyday words): banal · trite ·
  pithy · terse · tepid · stoic · acrid · adage · chide · croon · drawl · elude · ensue · feign · feint · flout · foray · frond · gaffe · gamut · gauzy ·
  gavel · heady · leery · levee · lurch · mosey · moxie · parch · plait · preen · primp · qualm · segue · shirk · shuck · sidle · skimp · skulk · splay ·
  spurn · strew · taupe · tinge · trope · wield · fjord (a famous Wordle trap by spelling, not a kid's word).
- **Doubles that make a day feel repetitive if drawn close:** gauze / gauzy, noise / noisy, juice / juicy, spice / spicy, shine / shiny, stone / stony —
  harmless; left to the owner.
Cutting the first three groups (≈ 55 words) leaves ~1,390 answers ≈ 695 days a cycle. Not cut on purpose: bluff (a game's name, a card word),
witch · genie · ninja · pixie (play), bingo · derby · dicey (not gambling to a kid), latte · mocha · decaf (coffee), siren · armor · cadet · squad
(not violence), belly · snout · drool (fine).

## Ready for THE DAILY MODULE?
**Yes, after two small server changes and one decision.** Land finding 1 (the day on the call) and finding 4 (the 500) first — both are an hour
with their tests; cap the pauses (3) in the same pass. The throwaway-profile gate (2) is the module's design, not the games': decide the rule
(established profile = ≥ 3 counted matches is the house floor already) before the switch-over, and add the per-IP limit on new profiles then.
The module should start by pulling the shared pieces (10) into `js/daily/` so the banner, the pause call and the RESUME chip are written once.
Everything else above is polish that can ride with it.

## A fix-pass plan (one ~3–4 h pass, in order)
1. **The day on the call** (1): `api/daily.js` accepts `body.day` (today / yesterday with a start), both judges send it, two `/api` tests for the
   straddle (a finish at 4:00:30 counts for yesterday; a mid-door guess continues), e2e-password's "one try" line updated. ~75 min.
2. **The 500 → 400** (4) + **the pause cap + the 30-minute ceiling** (3) with their tests. ~35 min.
3. **THE PASSWORD's sounds** (5): `installAudio()` in password-preview.html + password-daily.html; THE FIRST-TAP CATCH + decode-at-unlock copied from
   CC's sfx.js (or the shared module if the pass has time); a `played` hook + one E2E check; the silent-switch line in docs/password.md. ~45 min.
4. **The finish retry in THE PASSWORD** (6) + **the HELD line** (7, after Ben's answer) + the dead code (11). ~25 min.
5. **Docs** (12) + the word-list cuts Ben approves (`scripts/pw-words/cuts.json` + a rebuild — the schedule is not live yet, so a cut costs nothing now;
   after the switch-over it needs 13 first). ~30 min.
6. The full local run: unit, rules + `/api` (password, coastclear alone), smoke `GAMES=overclock`, e2e-password + e2e-coastclear; the ci tag on the final push.
Deferred to THE DAILY MODULE: the throwaway gate + the IP limit (2), the shared `js/daily/` kit (10), the schedule freeze (13), a `/api/daily` budget (14).

## DFIX1 — the fix pass (Nov 7 2026)
Every finding above is marked FIXED / LEFT FOR THE DAILY MODULE / LEFT / WON'T FIX. Also in the pass: the owner's ADULT-VOCABULARY cut (47 words →
**1,402 answers, a 701-day cycle**; the mean + gloomy words kept), and the owner's OVERCLOCK add-ons on COLOR CLASH (docs/overclock.md — colour WORDS in a
derangement of text colours, TAP THE TEXT COLOR only).
**The local run before the push (the Beelink, the emulators, `DAILY_TEST=1 node scripts/serve.mjs 5190 --emu`):** unit **1,346 / 1,346** · rules **66** · `/api` server **38** +
password **9** + coastclear **12** · smoke `GAMES=overclock` **5 / 5** · e2e-password **40 / 40 × 5** · e2e-coastclear **36 / 36 × 5** (60 fps every run: the sweep / the
catch / the lighthouse 59.7–60.1) · e2e-oc-2 **27 / 27** · the no-sideways guard **312 / 312**. No rules change (nothing to re-publish).
