# THE DROP B — THE TICKET, TODAY, SHARE + THE SCHEDULED GO-LIVE (+ Group 0: the pause-on-hide fix, + Ben's two add-ons) — Nov 13 2026

The plan: docs/games/plan.md "THE DROP — PASS B" (Step 0, `6f881027`; Ben's two add-ons appended there). On the mini PC. **No database rules change**
(rules 82 / 82 — the schedule lives at `progress/dlive`, server-only by the rules' default deny). Still 8 functions. **THE DROP stays OFF** until Ben
schedules it (`config.js#DAILIES` `on: false` + THE SCHEDULED GO-LIVE). The references: docs/prism.md "THE DROP B", docs/progression.md "THE DAILY
MODULE — THE DROP B", docs/cartridge.md "THE DROP B".

## Group 0 — PASS A's TWO GAPS (`aa6cf96a`)
- **(a) HIDING THE PAGE = AN AUTOMATIC PLAYER PAUSE.** `visibilitychange → hidden` / `pagehide` → a `ppause` with the freshest chunk (keepalive) — one
  of the 3, server-timed; back on the page the board stays hidden behind RESUME, ONE line `PAUSED · n LEFT` (the tap's pause card took the same
  line). An unanswered hide pause is asked again on the return; a `pause_limit` answer turns it into a no-pause hide. **No pause left** → the hide's
  checkpoint (keepalive), the clock runs; back within 20 s the run catches up; later the phone steps at most 15 s of gravity past the hide and
  uploads with `aw: 1` → `drop-judge.js#upload` checks the gap on the server's clock and ends the run `late` at the checkpoint + 15 s (a short hide's
  `aw` is only a checkpoint). The driver runs no frame while hidden. **A reload's own pagehide pauses it first** — that IS its one pause (the start
  resumes into it), and the LAST CHECKPOINT line shows for both reload paths.
- **(b) THE SONGS.** A DROP run deals PRISM DROP's day / night set by the phone's look (10 songs from the day's seed) onto the view's synced player —
  the quick start, the heard-beat clock, the night gains. The row's `ownMusic: true` keeps the console's decks silent; the meta's `MUSIC = null`.
- **+ THE ONE-TIME HINT** (the row's `lesson: true`, `drop/index.js#HINT`): one line at the board's top through the 3-2-1, gone at the first move or
  6 s of play, seen once (`pstats/{pid}/ls/drop`).

## Groups 1 + 2 — THE TICKET, TODAY, SHARE (`8f014213`)
- **THE TICKET:** `TICKET_ART.drop` = the prism + its split light (three spectral tubes that keep their own colours); ONE per-id ink table
  `ticket-art.js#TICKET_INK` (the DAILY screen's `--tk0` / `--tkd` / `--tks` — the old CSS day-ink rules folded into it). **A call for Ben:** PRISM
  DROP's accent is ice blue (`#8fd8ff`), which would twin COAST CLEAR's cyan (`#5fe1ff`) — so THE DROP's ink is PRISM DROP's WHITE LIGHT (its theme
  accent, `#eef1ff`) by night and a spectral violet (`#6a3fd0`) by day, told apart at a glance by the prism's split beam; one line in `TICKET_INK`
  changes it.
- **TODAY with three:** the meter + the rows count the server's live list; to play · RESUME · done (`dropLine` + the table line + ADMITTED) — centred,
  nothing clipped at 390 × 650 / 402 × 690 / 430 × 746 in WebKit.
- **THE SHARE:** `js/games/drop/share.js` — SHARE YOUR RUN's card + PRISM DROP's board middle with **every junk row drawn SOLID** (`solidJunk`, the
  server runs it too), THE DROP · the day, the time big, the lines; SHARE on the run's end card; SHARE TODAY's section (the board + the time pair);
  the server's spoiler-free inputs (`api/_lib/drop.js#share`, the run replayed once on the tap; `today { share }` now awaits a cartridge's share).

## Group 3 — THE SCHEDULED GO-LIVE (`d70dbb00`)
- **/admin → THE DAILIES → THE DROP → GO LIVE AT THE NEXT 4 AM** (owner only, TAP AGAIN TO CONFIRM, audited) → `progress/dlive/drop = { from: <the
  next streak day> }`; the daily opens BY ITSELF at that 4 am turn (`core/daily.js#rowOpenOn` — day keys, never a time; the day from each call's
  clock, the 30-s cache holds only the schedule) — never mid-day; CANCEL only before its day (`already_live` after). The row: **LIVE** / **LIVE FROM
  <date> 4 AM** + CANCEL / **OFF** + the button. Any `on: false` row, no code edit, no deploy. Only while THE GO-LIVE SWITCH is ON.
- **THE SET OF A DAY** (`dailies.js#liveFor(day)`): THE SWEEP / the XP cap / PERFECT WEEK read the RUN's day's set — the day before is swept with
  two, a crossed run keeps its own day's set, a sweep already earned stays.
- **/board:** a DAILIES board's answer carries today's `live` list → a scheduled daily's chip appears without a deploy.

## Group 4 — THE LOOK REVIEW (`8175d75a` — three rounds — WebKit at 390 × 650 / 402 × 690 / 430 × 746, + 1440 × 900 once)
r1 the DROP's prism enlarged to the door's / the lighthouse's box · r2 a two-line ticket hook balanced (`text-wrap: balance` — RESUME's width left
"on." alone at 430) · r3 the run's end card with SHARE, the pause / hide card, the share card (junk rows solid, the day) + SHARE TODAY for 1 / 2 / 3,
/admin's go-live rows — no change needed. No pills anywhere (the game card's two went in Group 6).

## Group 5 — THE SLAM ADD-ON (Ben, Nov 13 9:56 pm) (`fbb66030`)
SLAM = the whole strip from the board's edge to the screen's safe edge − 4 pt each side, in EVERY layout, centred across that strip at the column's
foot (`layout.js` — `slamX` → `--slamX`, LEFT mirrors it), the board + the rail tiles unchanged, capped at 84 (a desktop).

| screen | strip | SLAM before → now |
| --- | --- | --- |
| home-screen app 390 × 844 (safe 47 / 34) | 54.3 | 40 → **46** |
| home-screen app 402 × 874 (62 / 34) | 55.3 | 40 → **47** |
| home-screen app 430 × 932 (59 / 34) | 54.3 | 40 → **46** |
| Safari 390 × 650 | 88 | 62 → **80** |
| Safari 402 × 690 | 80 | 54 → **72** |
| Safari 430 × 746 | 81.3 | 55 → **73** |

Ben's ≈ 52 pt estimate for the home-screen app assumed ~60 pt of strip; the real strip there is 54–55 pt, so the rule as written gives 46–47 (the
board would have to shrink to give more, which the add-on forbids). The BUTTON SIZE slider now sizes the BUTTONS scheme's bar only.

## Group 6 — THE GAME CARD ADD-ON (Ben, Nov 13 10:17 pm) (`5a4775c8`)
A card with a solo list (PRISM DROP) draws all three full-width buttons as the SAME plain white tube (`cardActions` → `equal`) — same size, labels,
sub lines, order; no pink on that card (THE SHELL's test asks no MAIN of a screen — nothing to override). A game without a list keeps its single
pink PLAY NOW. The two pills → ONE plain quiet line "SOLO · 2–8 PLAYERS · ABOUT 5 MIN".

## The close — local runs
My own servers: emulators (restarted FRESH before the last PRISM run + the full harbor), `serve.mjs --emu` on :5173, `DAILY_TEST=1` on :5176
(e2e-daily), `DAILY_TEST=1 DAILY_TEST_OFF=drop` on :5177 (e2e-drop + the previews), pass A's tip in a worktree on :5174 (the A/B). Ben's :5190 untouched.

| suite | result |
| --- | --- |
| unit | **1846 / 1846** (+ drop-share 4, daily-golive 2, prism-drop-judge +1, prism-layout +1, play-now) |
| rules | 82 / 82 (no rules change) |
| `/api` server.test · daily-module · daily-drop | **57 / 57 · 21 / 21** (+ THE SCHEDULED GO-LIVE) **· 11 / 11** (+ the hides, the share inputs) |
| e2e-drop | **34 / 34** (was 21) |
| e2e-daily | 53 / 53 |
| e2e-playnow WebKit · Chromium | **29 / 29 · 29 / 29** (+ the equal tubes + the one line) |
| share-same.html | **25 / 25 SAME** (+ each of the three dailies alone inside SHARE TODAY) |
| admin-probe `GOLIVE=1` | OFF → LIVE FROM SAT NOV 14 4 AM → cancelled, in the real /admin (390 / 402 / 430 / 1440) |
| e2e-prism FAST · full | **63 / 63** · 85 / 88 → 87 / 88 → 87 / 88 (fresh emulators) — see below |
| e2e-prism-leak · smoke | 6 / 6 · 8 / 8 |
| harbor groups (cartridge, shell, sololook, gameflows, tapfit, corners, progress, dock, keypop, oneseat, leaveroom, load, panel) | **153 / 153** |
| **FULL e2e-harbor** (fresh emulators, nothing else busy, ~35 min) | **1313 / 1315** — the two reds (NO TWO CAMERAS at the reveal — `cameras`; the city's frame rate under the open radio — `radio`) **68 / 68 alone** |

**THE PRISM FULL RUN's reds are NOT this pass's** (an A/B on pass A's tip `a62554a6`, same emulators): `REFRESH: one clear = ONE attack` failed
in 2 of my 3 runs AND in pass A's second run; `DISCONNECT: ALICE … is out` in one of mine AND pass A's second; pass A's first run had 4 other reds
(the slow-3G audio + QUICK START). Nothing this pass changed is on those paths (PRISM's view only got `--slamX`). **A real small bug found on the
way (for the FABLE REVIEW):** an attack is written at `prismq/{match}/{target}/{sender}-{piece}` with the target picked fresh at each send
(`view.js#sendAttack`) — PFIX-A's create-only key refuses a refresh's replay only on the SAME target; if auto-target moved across the reload, the
same clear lands once more on the new target ([4, 4]). The full run's 8 phones expose it some of the time.

**Pass A's cloud runs** (`a62554a6`): `tests` ✔ success; `harbor` ✘ — 2 city reds (LOAD WEATHER's first-frame layout rect; THE DELAY reopening the
countdown) — `load` + `panel` green here (inside the 153 / 153 above).
