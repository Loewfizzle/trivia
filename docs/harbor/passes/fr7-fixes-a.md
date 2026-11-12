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
