# THE FIX PASS — after THE FABLE REVIEW (Nov 22 2026)

The spec: `Downloads\NEON\reviews\review-nov22.md` (the findings by id). Its "CHECKED AND FOUND SOUND" section was not redone; its LEAVE
ALONE list (S7, S10, D5, D7, D9–D11, P9–P15, C2–C4, C6, M4, M5, M7–M10) + B2 T4, B3 F1, B3 F7 left alone. THE LAB: `scripts/lab-export.mjs`
against the live site at the start — 226 marks, no open FIX mark. THE ADD-ON INBOX: no entry addressed to this pass (checked at the start,
after each group, before the final tests). Own emulators + `serve.mjs --emu` (+ a `--h2` server on :5197 for the bundle's numbers), all
stopped at the end; Ben's :5190 left as found.

**RULES CHANGED — RE-PUBLISH `Downloads\NEON\database.rules.nov22-fix.json`** (`rooms/.read` false — THE ROOM LIST closed; an idle room
deleted only by a SEATED player). The fallback on the old rules: nothing on the phone needs the list any more (the sweep is the server's).

## Each finding

| id | what was done | how proven |
| --- | --- | --- |
| S1 | done by the owner (8:00 am) — the published file copied over `tests/fixtures/rules-live.json`, the before-launch ack cleared | `rules-live.test.mjs` |
| C1 | `e2e-drop`: PRISM DROP on the top line / end card / bar (its separator is a `::before` — innerText has none); the "faster than the clock" forgery was a 1 s log (topped out at tick 120 — inside FAST_TOL_MS) → 30 s at the start, refused `too_early`; the stale fixture names; `daily-drop`'s "THE DROP:" errlog check (red before this pass) | e2e-drop, daily-drop 15/15 |
| S2 | `rooms/.read` = false; THE STALE-ROOM SWEEP on the server (`api/_lib/room-sweep.js`, hourly via `api/_lib/due.js#claimDue`, from `/api/daily today` + the log prune; the pure plan `core/room-logic.js#roomSweepPatch`); the phone's `cleanupStaleRooms` gone; an idle room deleted only by a seated player | rules 103 (+ the case: proof1's queries REFUSED, a room by its word still read), /api (the sweep), the review's `proof1.mjs`: both listing pages REFUSED |
| D1 | /admin's 30 s poll asks `live` only (the rooms by the index), only on screen AND focused | unit (fix-pass) |
| D2 | the results compaction claims its DAY in the database (`due.js#claimDay`) | /api case: a second cold function does nothing |
| D3 + P6 + P7 | THE FIRST-VISIT BUNDLE on every visit but Safari's; the worker pins + carries `/boot-bundle.json` (visit two = ONE request); never on 2g / < 0.4 Mbps; the early bail past 35 s (its size `z` in its first bytes) | e2e-bundle (Chromium + WebKit), wk-edge 6/6 both paths, boot-bundle unit |
| D4 | the share picture answers ONE canonical query (anything else → 302 there, no picture read) | share-card 4/4 (+ four odd URLs) |
| S3 a | THE CHUNK CEILING (`core/proof.js#overChunkCeiling`) in both judges — seconds × the game's own writer bound + 10 (JAYWALK 9/s, HIGH RISE 7/s — the review's ×2 would refuse an honest fast match: NAMED) | unit: the review's 2,000-chunk burst refused with 0 strings read; an honest max-rate node taken |
| S3 b | `/api/report`'s per-uid CALL BUDGET (`api/_lib/budget.js` — api/daily.js's, one helper): 240 / 10 min | /api case |
| P5 | the music off = no song fetched / decoded (`synced-songs.js#tick` asks the rest hub first; `music.js#prefetch` too) | `fix-pass-audio.test.mjs` (red on the old code) |
| P4 | the `running` branch clears THE MEDIA CUT's latch + closes the leave episode before the resume listeners | same file (red on the old code) |
| P2 | THE WAKE HOLD's fresh check = ONE WRITE (`host.js#roundTrip` — the host's hostBeat) | city-part1-host, e2e-stall-host 8/8 |
| P3 | ROOM IDLE only after the round trip, for every seated phone (a guest: its own presence/lastSeen) | console-fix, city-part1-host |
| P8 | lazy-view's boundary: one retry, then `ui/game-broke.js#brokeCard` (SOMETHING BROKE + BACK TO THE ROOM / THE CITY), reported; the store's notify loop + the router's update survive a throw | e2e-fix-pass (new) |
| P1 | JAYWALK + HIGH RISE feature-detect import maps → UPDATE YOUR iPHONE TO PLAY <GAME> + BACK TO THE ROOM; the floor table's row | e2e-fix-pass (new) |
| S5 | the leg / try node names its profile; another profile's START ends + judges the open run first; the judge refuses another leg's node | daily-highrise 8/8 (+ the shared phone), daily-jaywalk 8/8, the review's `hr-clobber.mjs` → 'other leg' REFUSED |
| S6 | every cartridge's room pause takes `roomGameProof` (another COUNTED profile in the started game); THE DROP: one pause a game start (`rg`) | daily-drop, daily-module |
| S4 | solo OVERCLOCK QUICK plays + pays XP, no board row; only room matches with 2+ verified players write `overclock-quick` | /api, e2e-profiles |
| S8 | no tag digits / member Nº on any non-friend card (friendsState, friendLinkGet) — the pid's own exposure named below | unit |
| S9 | `seen/` swept once a day (`api/_lib/seen.js#sweepSeen`) | unit (the pure plan) |
| D8 | an end screen left open stops stamping after 15 min | unit |
| M1 | `tests/proof-lists.test.mjs` + report.js's pure lists in `api/_lib/trust-lists.js` + a load-time guard | unit |
| M2 | THE PER-GAME BUDGET = the game alone (new lines named in game-budget.json) | unit |
| M3 | CLAUDE.md 40,582 → 37,681 B (five long lines moved verbatim; every stale line fixed) | claude-md-coverage 0 missing, claude-md-size |
| M6 | contract.js THE PROOF block + SHEETS; the two tests loop over VERIFIED_SOLO / every file; review C5 (css/highrise.css) with it | unit |
| D6 | docs/backup.md Restore step 6 + Ben's step 0: KEY_PEPPER in the password manager | — (the owner's step) |

## The calls named (overrule any)
- **THE CHUNK CEILING's rate is each game's own writer bound, not the review's "× 2":** a match sends each move within 120 / 150 ms
  (stop-and-wait) — × 2 would refuse an honest fast JAYWALK match after ~10 s. The burst is still refused at once.
- **The bundle on RETURN visits too (D3 + P6):** the review's P6 fix (re-fetch the ~300 modules after the reveal) would have put the requests
  back on visit one; the worker keeping the ONE bundle file per build makes visit two one request. A deploy that changes a boot module costs
  a returning Chrome phone the new bundle once (~1.7 MB br); a warm Chromium boot from blob modules gets no V8 code cache (not measurable on
  the local rigs — named).
- **The bundle costs ~0.8 s on a fast 4G first visit** (HTTP/2 measured 9.58 → 10.34 s; Slow 4G 19.99 → 17.16 s) — the owner's "every first
  visit except Safari" taken as decided.
- **S8's pid:** `pfr/{me}/out`'s KEYS are pids and the owner reads `pfr/{me}`; `profiles/{pid}` is readable by any signed-in client — so the
  pid of a requested stranger stays learnable. The full close = re-key pfr by board id + narrow `profiles/` (a rules change + a data move) —
  a later pass, not built here.
- **S5's end word:** another profile's START closes the first profile's run with `o: 'close'` (a word its card already knows).
- **The card's way out:** BACK TO THE ROOM = the menu's QUIT TO THE ROOM (`state.quit`); a solo room: BACK TO THE CITY.
- **The boot bytes:** 19.1 → 12.4 KB under the line (P8's card + P2/P3's round trip are real code; the comments trimmed) — no budget raised.

## Before / after — requests per first visit
(cold, Chrome's Android profile, 4× CPU, `boot-time.mjs`'s new EDGE count = http(s) to the site off the network)
- HTTP/2 + brotli (`serve.mjs --h2`), 3 runs, medians: **455 → 157** for the whole first visit (328 → 25 before the reveal).
- HTTP/1.1: 448 → 146. Through the worker (`wk-edge.mjs --qs &bundle=1`): visit 1 56 · visit 2 28 · warm 13 (the modules: 410 · 21 · 13).
- Safari (every iPhone browser) keeps the modules: ~375 a first visit.

## The final run (the Beelink, fresh emulators, `serve.mjs --emu` restarted on this pass's code)
- unit **2,571** · rules **103** · /api **76** · daily-module 24 · daily-drop 15 · daily-highrise 8 · daily-jaywalk 8 · share-card 4
- smoke **24/24** · e2e-profiles **148/148** · e2e-jaywalk **102/102** · e2e-jaywalk-match **104/104** · e2e-oc-2 **27/27** · e2e-oc-new
  **75/75** · e2e-drop **55/55** · e2e-fix-pass **7/7** · e2e-bundle **28/28** (Chromium + WebKit) · e2e-stall-host **8/8** · wk-edge **6/6**
  (+ `--qs &bundle=1` **6/6**)
- e2e-highrise **78/81** + e2e-highrise-match **57/59** — **PRE-EXISTING** (the SAME checks red on the pre-pass code `c924b801` in a
  worktree on :5174 — the old code's touch-path bot even stopped at floor 4): the solo touch-path bot ended at 58 floors (the check wants
  63; the run COUNTED, 58 / 58 perfects, the server agreed) so ABOVE THE CLOUDS wasn't reached; the match's SIGNAL-DROP step reads CHARLIE's
  own tower as not climbing offline. Left for HIGH RISE's next pass (inbox).
- the harbor groups this pass touches: core · load · bootfloor · weakstart · music · mediacut · room · leaveroom · gameflows · cartridge ·
  oldrules — the first run 210/217: every red in `load` (+ one in `core`) was a check of THE MODULES' path now running on the bundle (a
  broken module request that never happens) → the `load` group asks `?nobundle` (Safari's path, every fallback's), core's "harbor modules
  load" accepts the bundle's blob; re-run of core + load: **52/52**.
- A trap named for the next pass: `serve.mjs` caches every `/api` module — the first E2E round ran against the server code from BEFORE
  Groups 1–6 (the reds then were partly that); restart it after any `api/` change (docs/testing.md).
