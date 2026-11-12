# FR7 FIXES A — "what a stranger or a player can hit" (Nov 12 2026)

A fix pass after FR7-A (`docs/harbor/review-7a.md`) + FR7-B (`docs/games/review-7b.md`). ONLY what the prompt listed — nothing else was started.
The owner's six decisions: plan.md "OWNER'S NOTES — NOV 12" (+ decisions.md §15 "FR7 — THE OWNER'S DECISIONS").
The tests of this pass: `tests/fr7-fixes-a.test.mjs` (each fails before its fix) + the emulator cases named per finding.

(The log is filled group by group; the summary + the final checks at the end.)

## Group 1 — THE MUST-FIXES (+ THE EARLY DEPLOY)

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| PD1 PRISM DROP's robot hook ships | FIXED `12916c2e` | `view.js` installs `__prism` through the kit's `installTestHook` (emu · localhost · a `/tests/` preview page — never deployed) | unit PD1 (the gate on a live-looking page) |
| OC1 STANDARD boards take 3× the max | FIXED `12916c2e` | `match-report.js#ocRunPlausible` — QUICK solo's bound for STANDARD too (each result ≤ `ptsCeiling`, a real order, ≤ `matchMax`) | unit OC1 (the 6,720 forge refused, an honest perfect match kept) |
| DY1 RESUME YOUR DAILY on a fresh page: no sheet | FIXED `12916c2e` | `screens/daily.js#overlay` loads `css/daily.css` itself + stays hidden until it is in; the banner too | unit DY1 + `e2e-daily` (reload → the chip → styled) + a WebKit cold-page run (old code: `position: absolute; z-index: auto`, no tokens — new: styled) |
| DY2 THE PASSWORD: a lost answer = a guess counted twice | FIXED `12916c2e` | the guess carries `k` (its place in the run); `logic.js#guessAgain` — a repeat is answered FROM THE RECORD, nothing written; a different word on a filled row → `out_of_step` (resync); no `k` = the old path | unit DY2 + `password.test.mjs` "FR7 FIXES A — DY2" (HTTP: the door-opening answer lost + retried, the finishing one) |
| E1 the back-fill undoes THE LAUNCH RESET | FIXED `6d6c9a81` | `progressReset` stamps `progress/resetAt` (in its update; the backup keeps the old one, RESTORE puts it back); `boardsBackfill` rebuilds only from after it (`core/board-fill.js#sinceReset`); COUNTED PLAYS still read every record (E4 is the owner's) | unit E1 + `server.test.mjs` THE PROGRESS RESET (reset → back-fill → the reset holds; restore → the epoch back) |

**THE EARLY DEPLOY:** PD1 + OC1 + DY1 + DY2 alone, `12916c2e` (the ci tag), pushed ~9:38 am Eastern — Vercel BUILT. Its cloud `tests` run: rules + /api
+ smoke GREEN; the unit job RED on one line — the docs-link test (C4d) caught this file named before it existed (the new test file's header). Not a
site defect; this file fixes it.

## Group 2 — THE GAMES' REAL BUGS (FR7-B)

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| PD4 the dead board (out by the director before the screen mounted) | FIXED | `prism/view.js#ensureEngine` treats `game.out[me]` like a self-reported out, with or without a node — the KO card (AWAY / SIGNAL LOST) → the call → spectating | the preview's new `&state=away` (`&node=1`) on the real view at 390 / 402 / 430: the card, then spectating, 0 errors |
| PD5 no WebGL → the night look threw every frame, no HOLD + NEXT | FIXED | `if (light) light.setReduced(…)` | unit PD5 + the real view with WebGL stubbed off: 0 errors in 3 s at 390 / 402 / 430 |
| PD6 a 30 Hz cap (Low Power Mode) read as a slow phone | FIXED | the city's rule: a step down is a PROBE — `CAP_PROBE_MS` later, frames no faster = the cap → back up, no more steps for timing (only real work ≥ `CAP_WORK_MS`); in PRISM's own tier rule AND the kit's `createTiers` (`kit/tiers.js#capProbeSaysCapped`) | unit PD6 (30 Hz + light work ends at the top tier; a phone the step really helps stays down) |
| PD7 the sprite caches kept for the page's life (19–26 MB) | FIXED | `board.js#clearSprites` (+ the neon set), `crayon-art.js#clearCrayon` (+ the tooth), `fx.js#clearShards` — the pixels zeroed; dropped `DROP_MS` (60 s) after the match's screen goes, cancelled by the next mount (a rematch redraws nothing) | unit PD7 |
| OC3 SORT IT's dead screen kept dealing + locked the next challenge | FIXED | `ui/sortit.js` keeps its deal timers (cleared + `dead` on destroy); every challenge screen gets ITS OWN api (`ui/scoped.js#scopedApi`) — its writes are no-ops once its challenge isn't current | unit OC3 |
| HE1 a late tap applied on the NEXT street | FIXED | `holdem-dealer.js#applyOp`: an `act` whose catch-up moved the hand / street / seat to act / bet → 409 `stale` (`advanced`); a tap inside the time bank still counts | unit HE1 (the review's heads-up repro: refused; the bank tap: applied); HE10's A14 test now expects `stale` for the past-the-bank tap (the same refusal, the right reason) |
| HE2 a host who quit to the room stops poking | FIXED | the cartridge's `prepare()` pokes on the host's tick when no table is mounted (`logic.js#hostPoke` — due + 100 ms, the view's back-off, ≤ 8 retries; an ended match's clean-up too); `host.js` hands `prepare` the clock + the live data | unit HE2 |
| DY5 THE ROOM WINS' pause sent once, lost silently | FIXED | `screens/daily.js#pause` → `js/daily/retry.js#retryWhile` (1, 2, 4 … 30 s) while that room starts / plays; the first try always (the go stamp comes before 'playing' — `e2e-daily` caught exactly that on this fix's first try) | unit DY5 + `e2e-daily` 53 / 53 |
| DY6 COAST CLEAR: a lost flood answer left 1 cell open | FIXED | a repeat dig answers the cell's WHOLE flood (`logic.js#applyMove`); a light again = `lit: [i]` | unit DY6 (+ coastclear.test's opening-cell line updated to the new answer) |
| DY7 THE PASSWORD: a resume in a dead spot = an empty unlocked board | FIXED | the keys stay locked until the server's run is in; a lost `start` retries (RECONNECTING) | unit DY7 + the preview's new `&deadstart=N`: locked + RECONNECTING, then the server's rows, at 390 / 402 / 430 |

## Group 3 — THE OWNER'S DECISIONS (plan.md "OWNER'S NOTES — NOV 12")

1. **THE BOUNDS + OVERCLOCK GRADED BY THE HOST** — `js/games/overclock/grade.js`: each phone seals its per-part PICKS (`a` — the picks THE ANSWER already
   kept) in its own write beside the board; after PENCILS DOWN the host rebuilds the dealt challenge (`challenges.js#generate`) and grades them
   (`gradeRoom` → the director's `computeResults(…, graded)` — the phone's own `ok` can only LOWER it). THE HUMAN FLOOR (`humanFloorMs`: 350 ms a part;
   CLOSEST 1.5 s, TIMELINE 2 s, SORT IT + HIGHER OR LOWER 3 s): under it no speed bonus + `fl` on the result (no REDLINE — `match-report.js`). The rules
   side (`doneAt` only with `done`, the picks' field) is Group 4; until the re-publish the old rules refuse the picks → the host keeps the phones' `ok`
   (the fallback). **HOST-GRADED:** trivia · true or false · quick math · pattern lock · spellcheck · color clash · odd one out · quick count · sort it ·
   timeline · closest call. **STILL TRUSTS THE PHONE (accepted — no pick to grade):** signal lock (a reaction time is the phone's own clock), memory,
   unscramble, missing link, higher or lower, compass, rewire; DUMB LUCK is the host's draw already. **THE HONEST LIMIT:** a challenge — so its right
   answers — is built on every phone (that is what makes it instant): a guest who digs them out of their own phone and writes the right PICKS still
   scores them. Grading closes the one-line self-grade (`ok: 3` with wrong or no answers); the real closer is server-dealt answers (after THE LAUNCH,
   if ever). The host stays trusted (the owner's line: a cheater must be the host). PRISM DROP's margin: NOT tightened here (it needs a fresh
   `scripts/sim-prism-rush.mjs` run against the new number — left for FR7 FIXES B); its flags were already bounded by PFIX-B; the attack's number = PD3
   (Group 4). Test: unit "decision 1" (a guest's perfect self-grade with wrong picks scores 0; the honest run keeps its points; the old rules = the phones' ok).
2. **THE DAILY CEILING** — `core/progress.js#matchStep`: past `DAILY_CEILING` (20) counted ROOM matches in an Eastern day a match is counted once (`m`),
   the gap's clock runs — and it pays 0 XP, no win / record / counter / counted play; the end-of-round moment shows ONE line (`CEILING_LINE`: TODAY'S
   LIMIT · XP AGAIN AFTER 4 AM); the solo lane + the dailies are separate. Test: unit "decision 2".
3. **DY4 ACCEPTED** — written in docs/progression.md (no code).
4. **COAST CLEAR's room pause doesn't count** — `coastclear/logic.js`: a pause the SERVER verified as THE ROOM WINS (`api/daily.js` passes its own
   check, never the phone's claim) is a ROOM pause (`p.r`): not in `MAX_PAUSES` / `PAUSE_CAP_MS`; its own safety bound (`ROOM_MAX_PAUSES` 12,
   `ROOM_PAUSE_CAP_MS` 3 h); the phone's clock reads the room's cap (`runView#pauseCap`). Test: unit "decision 4" (a 60-minute HOLD'EM pause + three more).
5. **END GAME through the dealer** — a new dealer op `endGame` (still 8 functions): host only; a TOURNAMENT ends now, placed by CHIP COUNT
   (`match.js#endTournament` — a hand in progress VOIDED: each keeps what it had before it; equal stacks share), credited from 3 hands through the normal
   end (`settleReport` → `applyMatch`, once) — else `short`, NO RESULT; CASH = END SESSION; the ☰ row's confirm says which (`holdem/meta.js#endGameLine`),
   the podium follows. Test: unit "decision 5".
6. **THE REAL PLAYER COUNT, in that room** — a leaver counts only with their OWN node of THAT match in THAT room (`api/report.js#PROOF_PATHS` — PRISM's
   board, OVERCLOCK's first challenge's board / combo marks: only they could write it, only in play). Test: `server.test` "FR7-A C1" (the leaver with
   their board still counts; a real but absent account pays nothing — a 2-player 95, never 3).

## Group 4 — THE RULES PASS (ONE re-publish)

THE RULES AS PUBLISHED: `tests/fixtures/rules-live.json` = the Nov 10 file (HE2 + PFIX-B — live: HOLD'EM plays on real phones, which it can't
without `hole`), synced this pass; `tests/fixtures/rules-live.ack.json` names the new hash + the RE-PUBLISH line (docs/testing.md "THE RULES-LAG").

| path | before → after | why | its fallback on the old rules |
| --- | --- | --- | --- |
| `rooms/{CODE}/meta` | `hasChildren(hostId, status, createdAt)` → `+ activeAt` | C3 — a room with no activeAt could never be swept | every client create already writes it |
| `rooms/{CODE}/meta/activeAt` | `isNumber()` → `isNumber() && <= now` | C3 — an activeAt in 2100 = a room nobody could delete (all 798 hush words held) | every client write is `serverTimestamp()`; the dealer's is the admin SDK |
| `rooms/{CODE}/meta/settings/{game}/{key}(/{sub})` | `hasChildren()` → a key ≤ 24, a value bool / number / string ≤ 64, one level of nesting | C5 — the caps a rule can set | the honest settings are well inside |
| `rooms/{CODE}/meta/used/{game}/{id}` | `isBoolean()` → `+ $game ≤ 16, $id ≤ 64` | C5 | — |
| `rooms/{CODE}/night/{m}` | `hasChildren(g, p, at)` → `+ g ≤ 16 · p/{u} 0–3 · n/{u} ≤ 24 · b/{u} 0–10 · nothing else` | C5 — a host's record bounded per entry (the COUNT is the server's: THE REAL PLAYER COUNT) | host.js writes exactly that shape |
| `rooms/{CODE}/prismq/{m}/{target}/{key}` | the key's number free → `i` required, `$key === uid + '-' + i`, `i ≤ prism/{m}/{uid}/sv/n + 15` | PD3 — no board, no attacks; the key's number no longer free | refused with `i` → the same attack once more without it (view.js#sendAttack; the page then stops sending `i`) — proved on the fixture |
| `rooms/{CODE}/oc/{m}/{c}/{uid}/doneAt` | `=== now` → `+ done === true` | OC2 — a stamp from the start no longer pays the full speed bonus | the phone writes `doneAt` only with `done` already |
| `seal/{CODE}/oc/{m}/{c}/{uid}/a` | — (`$other` false) → a string ≤ 400 | HOST-GRADED OVERCLOCK — the sealed picks | their own write: refused alone; the host keeps the phones' `ok` (grade.js#gradeRoom) — proved on the fixture |

**C4 — NOT DONE.** "The room list = stale rooms only" (`query.endAt <= now − 1 h`) can't be proved: the emulator never evaluates `query.endAt` as
a comparable value — as a number or as a string (probed with four rule variants: `!= null` passes, every comparison is denied, even `< 99999999999999`).
An unproved rule could break the idle sweep (`room.js#cleanupStaleRooms`) on the live database. The live list stays as it is (bounded at 25, by
activeAt). The options for the owner: the idle sweep moved to the server (FR7 FIXES B — then the client query can be closed outright), or accept it in
writing (the door has a LOCK). **C5's two whole-tree /api reads** (admin STATS, the radio's `openRooms`) — not in this pass (server code, no rules) → FR7 FIXES B.

Tests: `tests/integration/rules.test.mjs` "FR7 FIXES A — C3 / C5 / PD3 / OC2 + HOST-GRADED" + "THE RULES-LAG" (the fallbacks on the fixture); the older
PRISM attack cases now carry `i` (their boards seeded with `sv.n`). 81 / 81.

## Group 5 — THE CONSOLE'S FOUR (FR7-A B2 / C6)

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| the INITIATE guard | FIXED | `host.js#startGameNow` refuses while the room's game runs and isn't at its podium (`core/room-logic.js#gameRunning` — A GAME IS STILL ON · WAIT FOR ITS END); the podium's REMATCH still starts | unit B2 |
| the solo snapshot win | FIXED in `678395fe` (C1) | a solo snapshot = the solo lane, never a win | `server.test` "FR7-A C1" part 5 |
| the names on THE PLAYER PAGE | FIXED | `api/_lib/player.js`: the HOUSE NICKNAME for a rude name unless you are that player or their friend | `server.test` "offensive names …" |
| a friend request | FIXED | `api/_lib/friends.js#friendsState`: the requests (in + out) + the blocked through `publicName` | `server.test` "offensive names …" |

## Group 6 — the end

**The commits:** Step 0 `206c1248` · the early deploy `12916c2e` (the ci tag — Vercel BUILT ~9:38 am Eastern) · E1 `6d6c9a81` · this log `400f17cc` ·
Groups 2 + 3 + 5 `7f0c11c6` (one commit: they share the same files) · Group 4 `b4ec0d28` · the preload graph · the docs + the test fixes + the final
push (the harbor tag on its top commit).

**Local, on the mini PC (my own emulators + `serve.mjs --emu`; Ben's :5190 left alone):** the unit suite 1,671 / 1,671 · rules 81 / 81 · `/api`
(`server.test`) 45 / 45 · `password.test` 10 / 10 · `coastclear.test` 14 / 14 (its pause-cap case rewritten for decision 4) · `friends.test` 8 / 8 ·
`holdem-server.test` (alone) 18 / 18 · smoke 8 / 8 · CONN 21 / 21 · `e2e-daily` 53 / 53 · `e2e-password` 40 / 40 · `e2e-coastclear` 38 / 38 ·
`e2e-prism FAST=1` 63 / 63 · `e2e-oc-2` (N = 4 — OVERCLOCK has no FAST path) 27 / 27 · `e2e-holdem FAST=1` 22 / 22 (twice) · the WebKit cold-page
RESUME check (DY1) · the full `e2e-harbor` suite 1,261 / 1,262 (~33 min, 4 shards) — the one red the sightings capture-hitch timing check under the
shard load (FR7-A's F line); `ONLY=sightings,perf` alone 23 / 23, THE BASELINE GUARD 1.08× / 1.25× / 0.97× (≤ 2×).

**Known issues (each a test's own, none a site defect — FR7 FIXES B's test list already names them):**
- `e2e-holdem FAST=1` went red once in three (20 / 21: "its result sent (short)") — FR7-A's F line: the FAST bots sometimes shove out in under 3 hands,
  which HE10 made `short`; the test expects `done`.
- `e2e-oc-2` timed out once in four on SORT IT's standings right after its host is killed mid-challenge (27 / 27 on the rerun and both runs before) —
  the host-kill path's timing; nothing refused, no page error.
- `e2e-profiles`: 141 / 142 with `DAILY_TEST=1` (YOUR TABLE's "NOT PLAYED YET" line, live dailies, matches THE PROFILE check's old-words regex — the check
  passes with the dailies off) and 141 / 142 on a second run on the same emulators (THE PLAYER PAGE from a board row takes the FIRST other row and expects
  BOB — FR7-A's F line; my notes: run it first, on fresh emulators).

**NOT DONE (said plainly):** C4 (the room list — unprovable on the emulator: Group 4); C5's two whole-tree `/api` reads (FR7 FIXES B); PD2's tighter
`RUSH_PACE.margin` (it wants a fresh `sim-prism-rush.mjs` — FR7 FIXES B). Nothing else from the prompt's list was left; nothing outside it was started.
