# CITY D — FIXES (Nov 15 2026, the mini PC)

The owner's order (`docs/harbor/decisions.md`): … CITY C ✅ → **CITY D** (fixes) → CITY E (THE BOARD's restyle + THE TAPPABLE SHARE CARD + the Lab
items + the trimmed text panel) → THE MAINTENANCE REVIEW → JAYWALK → THE GIRL CARDS → THE TOWER MOVE → the reset. **No rules change** (the new data
lives in nodes the server already owns: `progress/statsSnap` v 2 with `who`, `phonelog` kind `killed`). 8 functions.

**Step 0** — `decisions.md` (the order, a CITY D + CITY E bullet, the hotel blade PRISM / HOLDEM only) + `plan.md` "OWNER'S NOTES — NOV 15 (CITY D's
Step 0)".

## Group 0a — THE PRESENCE RED: a FLAKE of the test, not the game
`e2e-presence.mjs` "the challenge resolves once BOB is done" timed out on three cloud runs (Nov 13, PD-6, CITY C) and never locally (3 / 3 plain, 3 / 3
with every phone 4× CPU-throttled — `SLOW=4`). The cause: **DUMB LUCK never ends early** — it runs its 27.7 s (`luck.js#DL_MS`) whatever the boards
say — and `buildOrder` deals it FIRST ~5.7 % of the time (measured over 2 000 seeds); every red timed out ~25.3 s into the challenge (< 27.7 s). The
refresh case now runs on the first SKILL challenge (the test waits on the real condition; the check is unchanged). + a diag of the host's director
on a stuck resolve. The game's refresh path itself was fine (the rules refuse a not-done write over a done board; `liveKey` waits for every path).

## Group 0b + 1 — THE MEMORY KILLS (SCORES, CUSTOMIZE)
- **THE LIVE LANE** (`js/ui/live-lane.js` — `K.liveList(list)`, the surface API): every slim-card LIST (the dailies' SCORES today + all time, THE
  BOARD + its pinned YOU, the room's guests, a game's results, the friends lists, the knock + add-link cards, the title's preview) shows its BAKED
  STILLS; at most **3** strips ON SCREEN (≥ half in view) run live page-wide — topmost first, a joiner's entrance `prio` — each on its OWN small 2D
  canvas (`createSurface(el, { gpu: false })` — never a GPU context), ONE started a frame, chosen ~200 ms after the screen settles; a strip that
  leaves the screen stops + frees its canvas at once; reduced motion = none. WHO'S ON / STATS / the radio's room lists were stills already.
- **CUSTOMIZE YOUR CARD**: the grid's tiles = stills (no canvas in the grid at all); the pinned strip is the one live card; the profile behind it is
  HELD (`fxCover`); a hold opens the full card on its own surface.
- **THE PROOF** (`tests/integration/scores-memory.mjs`, 390 × 844 @3, 4× CPU; `daily-preview.html &many=1` = 48 fancy cards a daily;
  `profile-preview.html &all=1&dev=1` = every card owned — 80):

  | | before | after |
  |---|---|---|
  | SCORES · ALL TIME / TODAY + SHOW ALL × 5 — canvas pixels | 5.2 MP (2 GPU canvases) | 0.12 – 0.22 MP |
  | — GPU contexts made over the 5 rounds | 31 | 0 |
  | — effects drawn a frame | 6 – 9 | ≤ 3 |
  | — the whole browser (Windows working set) | 807 → 1 077 MB | 637 → 755 MB, flat after round 1 |
  | CUSTOMIZE (80 cards) scrolled × 3 — effects drawn | 12 | 0 in the grid |
  | — canvas pixels / browser | 2.86 MP / 1 140 → 1 242 MB | 0.38 MP / 851 → 914 MB |

  No reload in any run. Shots: `Downloads\NEON\city-d\scores-*.png`, `customize-390x844.png` (the stills read — no black tile).
- **A KILLED-PAGE MARKER** (`js/errlog.js#markScreen` — app.js every 2 s while visible, a write only on a change): the screen a page is on (the
  dailies' tab + TODAY / ALL TIME, CUSTOMIZE, a full card, the top sheet) in `sessionStorage ns:alive`, cleared on every clean exit (pagehide, hidden —
  an evicted background tab is no crash); a load that finds it sends ONE quiet report kind `killed` — "PAGE KILLED (likely memory) · screen · device ·
  build" — a row in /admin's phone reports (grouped, counted; never a toast, never from a robot). `tests/killed-page.test.mjs`.

## Group 2 — THE LEAVING SQUEAL WITH EFFECTS ON
`js/audio/engine.js`: on the EARLIEST leave signal (a touch phone's **blur** · pagehide · hidden · freeze) the master goes to **0 at once**
(`setValueAtTime` — no ramp), every BED / LOOP stops (`holdBed` — the neon hum, OVERCLOCK's loop; a lazy chunk through the hub
`globalThis.__nsAudioBeds`), the music's voices pause under the silence (30 ms), the context suspends ~60 ms later; back on screen the master ramps up
from 0 and the beds ramp back in. A blur that stays on screen (the share sheet) comes back after ~400 ms; a desktop's blur is no leave. **WebKit
couldn't run it here**: Playwright's WebKit on Windows has NO Web Audio (`AudioContext` undefined) — the proof is Chromium
(`tests/integration/audio-leave.mjs`): effects on + music off · music on + effects off · both on — sounding before (the output's peak 0.02 – 0.14), at the
suspend the master 0, 0 loops, 0 elements playing, **the output's peak 0**; back = 1.00. The city's long one-shot takes + the synced party song stay
scheduled under the zero master on purpose (their place on the server clock). `audio-hush.mjs` 9 / 9; `tests/audio-hush.test.mjs` + every `.loop = true`
in the shipped code is a bed.

## Group 3 — THE DROP's END CARD SHRINKS
A SCORED end card holds 1.5 s (`drop/view.js#BAR_MS`), then becomes a slim STRAIGHT-EDGED bar (3 px corners) at the board's foot — THE DROP · 2:10.7 ·
SHARE — so the finished board shows; a tap outside the card shrinks it at once, a tap on the bar (not SHARE) opens the card again; ‹ stays the way
back. Transform + opacity only. e2e-drop (+ the bar: 58 pt, 8 pt off the foot; the taps); `prism-skin-snap PAGE=1 SKINS=all` 60 / 60 IDENTICAL.
Shots `tests/integration/shots-drop/drop-04b-bar-*.png` (day — PRISM's crayon).

## Group 4 — NO MESSAGES A SOLO PLAYER NEVER NEEDED · A SILENT RECONNECT STAYS SILENT
- A SOLO room (PLAY NOW's one seat) leaves without a word: every `exitRoom` message (ROOM CLOSED, YOU WERE DISCONNECTED, a leave's reason) + the boot's
  YOUR ROOM CLOSED AFTER AN HOUR + the expired-invite line are skipped for it (`room.js#exitRoom`'s `solo`, app.js `wasSolo`). A daily has no room;
  chat's "left the room" lives only in rooms with others.
- SIGNAL LOST shows once the signal has been gone 1.5 s; SIGNAL RESTORED only when SIGNAL LOST was on screen ≥ 1.5 s (a 0.6-s drop: nothing; a
  3.6-s drop: LOST → RESTORED). `tests/city-d-quiet.test.mjs`.

## Group 5 — THE OWNER's SLIM CARD SHOWS HIS LEVEL
`vault/strip.js`: the plate line reads LV n for the dev cards too (was DEV) — every slim card; ✦ PROPRIETOR ✦ stays on the full card, the dev gem
stays. Shots `Downloads\NEON\city-d\owner-scores-390x844.png` + `owner-board-390x844.png` (`&dev=1` on both previews).

## Group 6 — THE SKYLINE, NO GAME TWICE
`core/harbor-neon.js#assignSigns`: the four named signs — roof A, roof B, the hotel blade + the speakeasy blade's weekly game — show FOUR DIFFERENT
games every night (the roofs now skip the speakeasy blade's game too — the week's, then a Monday morning's last week's); a repeat only if names <
signs, never a dark sign. THE HOTEL's VERTICAL SIGN = PRISM / HOLDEM only (`n-blade` lost its `split`). The year-of-nights tests at 390 / 402 / 430
(`city-b-signs.test.mjs` + four different every night; `harbor.test.mjs`'s weekly check counts the speakeasy blade). The timetable + THE GOLDEN
TABLE untouched. Shot `Downloads\NEON\city-d\night-390x844-skyline.png`.

## Group 7 — SCORES SHOWS INSTANTLY
- **Where it went**: the emulator alone answers `every` in 23 ms cold / 5 ms warm after a ~310-ms module import (firebase-admin ~250 of it) — the
  live ~5 s is a cold Vercel function + its first database connection + the serial trips, before the screen can draw anything.
- **The client**: the daily screen keeps the LAST scores it saw today (this player's: EVERYONE today, the ALL TIME boards, YOUR TABLE's averages + the
  day's own list — `ns:dy:scores`) and paints them AT ONCE, marked UPDATING; each fresh answer replaces them in place once any finger is up.
- **The server**: THE DAY'S CLOSE (dailies × 7 days, one after another on every fresh function) + the sweep + the prune run side by side; `today`
  reads each daily's result + start + NOT COUNTED in one trip, a finished run's pieces side by side, the friends list beside them; `every` asks its
  pid + the faces module while the switch is read.
- **Before → after**: `/api` at a simulated 40-ms database trip (`tests/integration/scores-timing.mjs RTT_MS=40`): **today cold 1 031 → 152 ms**, warm
  232 → 140; **every cold 255 → 164**, warm 140 → 93. The real app at 150-ms latency (`tests/integration/scores-open.mjs`, a cold server + a fresh page):
  the list after the screen ~555 → ~200 ms on a return (the kept scores — the rest is the game metas' module fetch); a warm return **211 → 56 ms**. The
  screen itself (~0.8 s on that network, a fresh page) is its module graph, unchanged.

## The add-ons (THE ADD-ON INBOX)
- **SAVE YOUR KEY → SHARE** (10:43 am): every gesture control (data-act share / copy, data-gesture) acts INSIDE the touch's own lift
  (`tapwatch.js#gestureControl` — a pointerup is a user activation); THE RESCUE never clicks one (logged); a refused share shows the KEY + COPY at once.
  WebKit (`wk-press.mjs`, clicks killed): share() 1× with a live user activation, COPY copies, 0 rescues.
- **THE STATS SHEET on the phone** (10:46 am): the list wore the header row's `.st-top` (its justify-content shrank the grid) → `.st-players`, built
  once the list HAS a width, stills, each card full width with the count under it; neon-underline tabs (no pill, no gold).
- **STATS → THE DAILIES — WHO** (10:47 am): TODAY · THIS WEEK, newest first, slim cards with the result / NOT DONE YET / DIDN'T FINISH, NOT COUNTED,
  +N MORE past 10 — from `dly/{g}/{day}/s · r · x` inside the 5-min snapshot (`api/admin.js#dailyWho`), faces by index (no pid). /api test.
- **THE DROP never in the roof board's rotation** (11:29 + 11:33 am — part 1 only): the chain walked on the emulators (switch + schedule → goLive →
  radioPublic.drop → the cached GET → nd:drop: all right); the last link broke — the scene judged THE DROP's window on the board's WORK DAY (still
  yesterday until the billposter's evening turn), so on its go-live day it was filtered out. Now judged on the 4 am ET streak day
  (`harbor-trivision.js#dropKey`); the order + the clock unchanged. `tests/city-d-drop.test.mjs`.

## Left open
- WebKit can't play Web Audio on this machine (the leave proof is Chromium's).
- The DROP bar shot is by day (PRISM's crayon); the night skins use the same card CSS (the board's pixels proven identical).
