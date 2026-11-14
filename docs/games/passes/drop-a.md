# THE DROP A — PRISM DROP's DAILY: THE ENGINE + THE SERVER's REPLAY (+ Group 0: PD-6's review fixes) — Nov 13 2026

The plan: docs/games/plan.md "THE DROP" (Step 0, `5cd4e261`). On the mini PC. **No database rules change** (rules 82 / 82 — THE DROP's nodes live
under `dly/`, server-only by the rules' default deny). Still 8 functions. **THE DROP's row ships OFF** (`config.js#DAILIES` `on: false`): nothing a
player sees changes except Group 0. The reference: docs/prism.md "THE DROP".

## Group 0 — PD-6's review fixes (`6fb0e567`)
- **(a) SLAM as big as the column allows** — `layout.js` `SLAM_PAD` 10 → 6, `SLAM_MAX` = `COL_MAX` − 6 = 66. Centred across the column at its foot
  (unchanged CSS); the home-screen-app numbers unchanged (width-bound → PD-1's).

  | screen (Safari with its toolbars) | column | SLAM PD-6 → now |
  | --- | --- | --- |
  | 390 × 650 | 68 | 56 → **62** |
  | 402 × 690 | 60 | 50 → **54** |
  | 430 × 746 | 61.33 | 51 → **55** |
  | 375 × 553 (an SE) | 72 | 56 → 66 |

  Shots (`prism-shots.mjs SETS=pd6 NOSAFE=1 SIZES=390x650,402x690,430x746 ONLY=c-solo,c-play7,c-left,c-day5`): the button fills the column, its
  chrome rim 3 pt clear of each edge, with 7 opponents, mirrored LEFT, by day; the DROP run's own shots show it solo.
- **(b) THE DUCK** — `audio.js`: a gain of its own in the song chain (filter → lift → **duck** → out — the finale's fade + the duel's swell never
  fight it); on a SLAM −4 dB: 20 ms down, held 0.1 s, back over 0.12 s, on the audio clock; ONE dip per 0.32 s (`DUCK_GAP`); none with the music
  off / muted; no songs = nothing to duck. **Measured live** (prism-preview, the music playing, SLAM pressed 10 times in ~1 s): 4 dips, each to
  0.631 and back to 1.0 between them, 1.0 after — never a long dip.
- **(c) THE LOST RUN** — the leave settles the report first (`host.js#soloLeave` → `profile/queue.js#settle`, ≤ 3 s, lazy) + a held report keeps
  its CHECKED extract (`results/{key}.xs` — `api/report.js#credit`), so its resend needs no room. `server.test` +1; `e2e-playnow --only lost`:
  BACK TO THE CITY at once after a SCORE RUSH, then a SURVIVAL inside the 45-s gap → the day's solo count 0 → 2.

## Group 1 — THE DROP's RUN, PURE (`55420abb`)
`js/games/prism/drop.js`. The schedule: SURVIVAL's rows to 4:00, then a smoothstep over 3 min to one every 0.6 s, THE END at 8:00 (`END_TICK`
57 600). The log `<ticks since the last><code>` (+ a `K` at every natural lock); THE HUMAN FLOOR ≤ 24 a tick, ≤ 160 a second, a slam ≥ 0.1 s
after the last — **tightened from 50 ms** after the first measurements: at 50 ms a bot reached 19 pieces a second and 3 069 lines; at 0.1 s the
fastest bot tops out sooner (the slams queue) and no human is near it. An exact snapshot (one JSON string). Unit `prism-drop` 9 / 9.

**THE REPLAY's COST (node, the mini PC):**

| run | play | pieces | log | whole replay |
| --- | --- | --- | --- | --- |
| the heaviest bot run (a key every 20 ms) | 351.5 s | 2 747 | 24.6 KB | 16.5 ms |
| a bot every 40 ms | 241 s | 1 206 | 10.7 KB | 8.4 ms |
| a bot every 70 ms | 225 s | 709 | 6.2 KB | 5.2 ms |
| a typical test run | 117 s | 510 | 4.5 KB | 3.5 ms |
| one checkpoint's chunk (6 s) | — | — | ~300 B | < 1 ms |

Nothing outlasts 8:00, so a log is bounded (`LOG_MAX` 120 K chars ≈ 5× the heaviest). The finish over /api on the emulators: **25–36 ms in
all, the replay 6.7–9.2 ms** (Server-Timing `replay;desc="…"`). api/daily.js's `maxDuration` is 10 s — the replay is ~1/1000th of it.

**Projected Vercel use — after Group 5's add-on** (a checkpoint every 30 s of play → ~9 calls a 3-minute run, ~19 an 8-minute one, + 2 a
pause; a checkpoint ≈ 2–3 ms of CPU — the token check + JSON, NO replay; the finish ≈ 15–25 ms with its one replay; ~150 ms of wall time a call
waiting on the database):

| players a day | invocations / month | active CPU / month | wall time / month (1 GB) | database download / month |
| --- | --- | --- | --- | --- |
| 10 | ~3 000 | ~15 s | ~0.1 GB-h | ~8 MB |
| 100 | ~30 000 | ~2.5 min | ~1.3 GB-h | ~75 MB |

(Hobby: 1 M invocations, 4 h active CPU, 360 GB-h; Firebase Spark: 10 GB download, 1 GB stored.) Before the add-on (a replayed checkpoint every
6 s) it was ~3.5× the calls; storing the whole log in the record would have re-sent it every checkpoint (~18 GB/month at 100 players).

## Group 2 — THE SERVER HALF (`2c32f05d`) — its checkpoint replay + 6-s rhythm REPLACED by Group 5
`api/_lib/drop.js` + `js/games/prism/drop-judge.js` (PURE); the generic path's new optional pieces (`begin` · `stash` · async `resume` / `verify`
· `abandoned` / `abandon`), `finishRun` / `settleRun`, THE DAY'S CLOSE's `sweepRuns`, `DAILY_TEST_OFF`. Unit `prism-drop-judge` 8 / 8;
`/api` `daily-drop.test` 8 / 8.

**THE SLOW-MOTION CHECK, as built:** the pass text says "wall-clock start → finish ≥ engine time − the pauses (+ a tolerance)" — that bound stops a
log built FASTER than real time (a bot's perfect 8 minutes uploaded at once → 422 `too_early`). A run played in SLOW MOTION breaks the other
bound (engine time far BEHIND the wall clock): every upload checks both — 20 s+ behind ends the run at its last checkpoint + 15 s of play. An
honest phone stays inside both: it steps its run to the server's clock before every upload (a hidden tab catches up, never lags).

## Group 3 — THE ROW + THE POINTS, OFF (`48ceae8f`)
The row (`on: false`), the points curve 10 + 90 × (t / 8:00)^0.6, /board's chips skip an OFF row. The PROGRESS RESET clears THE DROP like the others.

## Group 4 — THE PHONE SIDE, plain + functional (`b8e34b6c`)
`js/games/drop/` + PRISM's view's DROP MODE. `e2e-drop.mjs` 21 / 21. Look review (390 × 650 / 402 × 690 / 430 × 746, night + day): the run (the
PAUSE control at the rail's top, `3` under its bars), PAUSED (board + HOLD + NEXT hidden, the card centred over the board), the refresh's one line
(LAST CHECKPOINT · 1 PAUSE USED — the first wording wrapped at 402, shortened), the end card (PRISM's own KO card was showing under it with the
ROOM clock's "SURVIVED 0:28" — suppressed in DROP mode, as is the room write a top-out made). Fixed on the way: the pause card painted "3 LEFT"
before the server's answer.

**Left for THE DROP B:** the ticket (its art + colour), TODAY with three tickets, SHARE TODAY for three + the share picture (the junk rows solid),
the one-time hint, the polish (the run's countdown, the songs — THE DROP plays THE DAILY KIT's decks, no PRISM song in sync; the pause card's look);
an honest phone with no signal at its top-out is scored at its last checkpoint + 15 s (on the BEFORE-PUBLIC list with the throwaways learning the day).

## Group 5 — THE ADD-ON: THE COST CHECK (the city chat, Nov 13 — `3db98043`; plan.md's lines appended)
- **CHECKPOINTS every 30 s of play** + a pause + the page hiding / pagehide — the hide's checkpoint sent with `keepalive` (THE DAILY KIT's judge
  `$ka` + `profile/api.js`), so a reload's own checkpoint lands (e2e-drop: the refresh resumed past the pause, tick 4366 vs 3515). No auto-pause on
  hide (the 3 are the player's). **Requests a run: ≈ 19 for 8 minutes** (start + 16 + the final upload + finish; measured 9 for a 3.3-min run), + 2 a pause.
- **THE RE-PLAY CHECK ONCE a run** (the finish, or an abandoned run's close at its last checkpoint); a checkpoint only SIZE- / ORDER- / TIME-bounded
  (a forged lock is stored by its checkpoint, then refused by the one replay — 422, no score: unit + /api).
- **THE PRUNE** (`api/_lib/drop.js#prune` from THE DAY'S CLOSE's sweep, days 2 … 9 back, its own `pr` marker; the day's own keys — never a profile
  scan): the board final → the top 10 runs keep record + log for 7 days, everyone else the score row. **A run's stored size:** the record ≈ 160–250 B
  + its log (≈ 2 KB a minute of play — 6.5 K chars for 3.3 min) while it runs; ≈ 60 B (`s` + `r`) once pruned; a top-10 run ≈ 10–20 KB for a week.

## The close — local runs
My own servers: fresh emulators + `serve.mjs --emu` on :5173 (restarted after each `/api` change); `DAILY_TEST=1` on :5176 (e2e-daily);
`DAILY_TEST=1 DAILY_TEST_OFF=drop` on :5177 (e2e-drop). The emulators were restarted fresh before the last group re-runs (below).

| suite | result |
| --- | --- |
| unit | 1838 / 1838 (+ prism-drop 9, prism-drop-judge 8, board-points +1) |
| rules | 82 / 82 (no rules change) |
| `/api` server.test · daily-module · daily-drop (NEW) | 57 / 57 (+1: the lost run) · 20 / 20 · 9 / 9 |
| e2e-drop (NEW) | 21 / 21 |
| e2e-playnow WebKit · Chromium (all cases + `lost`) | 28 / 28 · 28 / 28 |
| e2e-daily | 53 / 53 |
| e2e-prism FAST · full | 63 / 63 · 88 / 88 (the first full run 87 / 88: one board write refused in CHARLIE's refresh replay — not reproduced on the re-run; nothing in that path changed — DROP mode is all behind `state.drop`) |
| e2e-prism-leak · smoke | 6 / 6 · 8 / 8 |
| harbor groups (cartridge, shell, sololook, gameflows, afterparty, tapfit, corners, oneseat, leaveroom, load) | 110 / 111 → the cartridge count 5 → 6 (THE DROP) → 3 / 3 |
| **FULL e2e-harbor** (4 shards + the tails, ~35 min) | **1310 / 1315** — each red checked alone: SIGHTINGS' capture hitch, A2's rebuild at 4× CPU, a dancer's arm frame → `sightings,rebuild,people` 33 / 33 alone; THE ONE WRITE PATH (oldrules) + THE ERRORS GROUP (makehost) — a refused closeRoom write reported: red alone on the pass-long emulators too, **8 / 8 on fresh emulators** (the day's accumulated rooms + rested words — state, not code) |

All servers I started were stopped at the end (the emulators, :5173 / :5176 / :5177); Ben's :5190 preview started and left running.
