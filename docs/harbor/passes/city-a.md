# CITY A — COSTS + STABILITY (Nov 14 2026, the mini PC)

The owner's order (Step 0 — `docs/harbor/decisions.md`, plan.md "OWNER'S NOTES — NOV 14"): the Fable review's fixes → the daily fix → **CITY A**
→ CITY B (the city's looks) → CITY C (cards + social) → THE MAINTENANCE REVIEW → JAYWALK → THE GIRL CARDS → THE TOWER MOVE → the reset.
**No rules change.** 8 functions. One push, the harbor tag on its last commit.

## Group 0 — left for the city
- **C2 (FABLE REVIEW 2) — a layer nobody gives back killed every city tap.** `ui/layers.js#layersOpen()` drops an entry whose element left the
  page (`layerGone` — once seen in the page, or 1 s after it was taken: a layer taken one line before its append is never dropped);
  THE RADIO's `destroy()` releases its desk; `?preview=card`'s ✕ (and Esc) give its layer back. Proven: `city-covered.test.mjs` (pure + source)
  and `e2e-taps.mjs` both engines — a leaked layer + the real `?preview=card` ✕, then a touch on a billboard opens its card.
- **C3 — a sheet opened on a pointer-up was closed by that tap's click.** ONE just-born guard, `ui/layers.js#bornGuard` (350 ms), shared by
  the sheet's scrim and the full card (its own copy removed). `e2e-daily`'s teeth now wait 700 ms and require the card to STAY (it passed
  while the card was only fading out).
- **PFIX-3's cloud reds.** LOAD WEATHER: the cause was THE TRI-VISION turning inside the check's window (a turn every 45–60 s on the server
  clock's seconds — the test pins the hour, not the seconds); a board swap whose re-bake lands UNDER the turning slats is now logged, not a
  visible change. THE DELAY: on the slow runner the ☰ menu + its settle outlasted the 3-s countdown — it RAN OUT before the reopen; the case
  runs on the 5-s delay and the panel's own count (`cdCancels` / `cdFired`) proves the reopen landed inside it (the code was right). THE
  DANCERS' ARMS: a step is timed by the largest of its rAF stamp, the draw's REAL start (`loop().drawnPerf` — the planner's clock moves the
  heading) and the beat; a step across a draw the sampler missed is skipped. The rule (1 rad inside 60 ms) is unchanged.

## Group 1 — EVERY TAP ACTS (item 5) + the add-on (Nov 14 7:56 pm)
- **ONE rule in THE TAP WATCH** (`ui/tapwatch.js` §4): a control marked `data-press` acts on its own press + lift — a touch / pen
  pointerdown + pointerup of the same finger that began on it, < 10 px, ≤ 600 ms, not cancelled (a scroll) → its click is dispatched AT THE
  LIFT, once; the browser's own click, if it still comes, is swallowed (any trusted click near the lift point for 800 ms). A lift counts when
  the control MOVED under a still finger or was replaced by its twin. A SHEET SETTLES: a click in a pop-up younger than 350 ms (`data-born`)
  that no press began on is swallowed. No new import — a lazy chunk only writes the attribute (THE STALE-MODULE RULE). The mouse + keyboard
  keep the plain click.
- **On the owner's list:** THE BOARD's tabs / period / board chips / show-all, `bd-open`, the radio's tabs, ×, jacks + presets, the slim cards
  (`fr-open`, `rg-row`), the games shelf rows, EVERY `dy-` button (but SHARE — Safari's own gesture for `navigator.share`), the push paper's
  SEND A TEST (the lever keeps its click: the notification prompt). NOW PLAYING already changes TEXT only; the push paper is never
  re-rendered on a timer (unit-tested).
- **The add-on:** every `.btn.btn-block` app-wide and every `.btn` in a `data-press-all` screen (the YOU page + the room's overlay) act the
  same way, no attribute each (`PRESS_IMPLICIT`); never on `[data-gesture]` (the share sheets, the passkeys), copy / share, a form's submit,
  a `pressTap` control (never twice) — and off while a game runs.
- **Proven:** `wk-press.mjs` (Playwright WebKit as an iPhone, the page's trusted clicks KILLED the way iOS drops them): every control acts
  once with 0 rescues, with the click killed and with it arriving (swallowed); THE MOVED ROW (38 px) and CUSTOMIZE YOUR CARD moved 6 px under
  a still finger both act. `e2e-taps` both engines green (its JOIN reset waited < 800 ms and was ignored by `pressTap` — a test bug on the
  code before this pass too; the SETTINGS case aimed below the screen at a fixed 200 ms in headless WebKit — now taps once the row is on screen).

## Group 2 — NO ROOM WRITES AFTER YOU'RE GONE (item 6)
- **Black-box proof** (`e2e-gone.mjs`): every write frame the phone's Firebase socket sends (put · merge · onDisconnect) and every
  `permission_denied` back, read from the moment each case is over: LEAVE (+ the socket dropped and back), LOST HOST (MAKE HOST, then the
  server moving it), THE CLOSE (the last one out), THE SOLO PODIUM → BACK TO THE CITY — 0 writes, 0 refusals, no new RULES REFUSED row.
  (The guards from THE ERRORS GROUP / THE CHAT FALSE ALARM held; nothing in the app needed a change.)
- **THE QUIET COUNTS:** a refusal that still races a hand-off is COUNTED — `errlog.js#countQuiet('gone')` → `/api/log` → `logstats/gone`
  (≤ 3 an hour per IP + kind), one line in /admin's errors card — never a row per write, never a toast. Server-tested.

## Group 3 — THE BILLBOARD FLASH (item 7)
- **Reproduced** by `tri-flash.mjs` (every painted frame of the roof board, `&force=trivision`, each slat matched against the two faces at
  rest): **by DAY on a 4× slower CPU** — 24 slat + 55 whole-board frames of the OLD face, 5.6 s after a turn, exactly when the slow re-bake
  landed. The cause: by day the CRISP poster copy is switched off while a swapped board's bake is out, and came BACK through its crossfade —
  fading FROM the face it last held. It now CUTS to the new face (the city's canvas under it already shows it) → **0 flashes**.
- Also: the slats HOLD the new face until its bake has landed (`harbor-trivision.js#triProgress` — the fixed 3 s is gone; `holdMax` 20 s is a
  timetable knob, the safety cap only); the turn works for **N faces** (`triClock(…, faces)` — CITY B's THE DROP is the third).
- The matrix (3 sizes × night + day, 46–60 fps) + day / night at 4× CPU: 0 flashes, 0 holds run out. A board-event ring (`tri().log`) prints
  around any flash.

## Group 4 — THE CATCH-UP RELOAD (item 10)
- A page whose build is gone keeps going on the live files (`mix` — the way a match already did) and its ONE reload is QUEUED
  (`ui/lazy-import.js#queueReload`): it runs only at a RETURN (visibilitychange → visible after hidden), never mid-tap, never mid-match, never
  with a pop-up open or a finger down (`app.js` → `holdSkewReload(hold, { gate, where })`). Each one is LOGGED to /admin's reports first (kind
  `reload` — the build from → to, the screen, the reason, how long it waited; sendBeacon). `wk-onebuild.mjs` 19/19 (WebKit): no reload at the
  tap, none on a return with a sheet open, ONE on the next clean return, the /admin row there.

## Group 5 — THE PHONE KEEPS ITS FILES (item 14) — no build step kept
- `/file-hashes.json` (`scripts/build-file-hashes.mjs` — 1105 files, 48 KB; `tests/file-hashes.test.mjs` fails when stale): each build's
  list is kept in the worker's META; a new build CARRIES every file whose hash didn't change from the old build's cache (the same bytes —
  ONE DEPLOY AT A TIME still holds), then the old cache goes. A miss waits for the carry ≤ 2.5 s.
- `/audio` BY VERSION: a song (its name + `music.js#REV`) kept in `na-audio-v1` — whole, on its second page load (a one-time visitor never
  pays twice), the media element's range requests answered from it (206 slices); a new REV replaces it.
- **The numbers** (`req-count.mjs` — Playwright WebKit through THE LINE with Vercel's own headers; at the live site's pace — the emulators
  poll the city feed every 1.5 s, the live site every 5 min):

| visit | requests | KB | before CITY A |
| --- | --- | --- | --- |
| COLD (a first visit, no worker yet) | 384 | 7,620 | the same |
| WARM (the same build) | **13** | 69 | 15 (+ the song's 2 range requests) |
| right AFTER A DEPLOY (one changed file) | **17** | 119 | ~315 / ~6,800 (every file again) |

  A BUNDLER (numbers only — none added): the cold visit's 329 module files (6,617 KB raw) would be ~3–5 requests; stripping comments +
  indentation alone ≈ 4,226 KB (−36 %), before gzip on both. THE EDGE CACHE + ONE DEPLOY AT A TIME unchanged.

## Group 6 — A GAME COSTS NOTHING UNTIL IT'S PICKED (item 15)
- The lobby wired EVERY playable cartridge a few seconds in (140 modules / ~1.4 MB for three games). Now only the room's PICKED game
  (`room-city.js#pickedGame` — the start's stamp, the match in play / just played, meta.back), re-wired on a change; the host's options sheet
  still wires its own pick at the tap.
- THE PER-GAME BUDGET (`tests/game-budget.test.mjs` + `tests/integration/game-budget.json`): the city + one game — OVERCLOCK 175 modules /
  2,511 KB · PRISM DROP 179 / 2,642 · HOLD'EM 149 / 2,310 (budgets +5 %; raising one is a named decision).

## Group 7 — THE CITY
- **NO TRAFFIC DURING THE FIREWORKS (item 20):** a show is a hold like a legendary's (`trafficHold({ kind: 'fireworks', t0, len })`) — the
  people planner's cars / buses / cabs (`ctx.trafficLegend`), the road light, the cab stand; the witnesses still react to legendaries only;
  boats untouched. Found on the way: the lane sims were keyed on the hold's START only — a stale lane let cars in (keyed on its end too).
  THE GOLDEN TABLE identical.
- **THE BOSS'S SIZE JUMP (item 21):** his shadow was drawn up to **1.35×** while soft — on each walk-up / away (Saturday's stand 2 begins at
  ≈ 22:28:40 — the owner's "10:30"). ONE size now (THE WINDOW STANDARD): the walk reads by the blur + the fade; the blur fades out before it
  ends, the ember's hold eases with his walk. Unit test: no step in near / a / hold over a whole party night (3 seeds).
- **THE FIREBALL'S PHOTO (item 25):** its box = the head + the near trail (≤ 80 px of it, every length); a live craft's crop holds its whole box
  (2.3× its half size, the default at least, the screen at most). `sgfast` + a 420-px fireball: all four 100 %, the rule as strict (the test
  taps only a craft whose WHOLE box is on the screen — the Blackbird's 85 % was a box half off the edge).
- **THE 8-CARD LOBBY (item 19)** (`lobby8.mjs`, 402 × 874 @3): at 1× — HOST → the room's first paint 1,037 ms (one 117-ms frame), 7 guests'
  name tags 25 ms after the write (no long frame), GUESTS → the sheet in 454 ms with 8 cards (was 519 — its module + the slim cards' warmed
  with the picked game's wiring). At 4× CPU every city frame is itself a 100–200 ms task here; the room's own spikes above it: ~616 ms
  around HOST, ~430 ms as 7 guests land, ~360 ms opening GUESTS (the sheet in ~4.6 s). Left for CITY C (cards + social): the GUESTS sheet
  builds its 8 slim strips in one go.

## Group 8 — small fixes
- **EXTENSION NOISE (item 28):** an error whose message / stack names a browser extension (`runtime.sendMessage`, `chrome.runtime`,
  `browser.runtime`, `safari-web-extension://`, `chrome-extension://`, `moz-extension://`) is COUNTED (`countQuiet('ext')`), never a row.
- **THE LEAVING SQUEAL (item 29):** while MUTED (or the music AND the effects off) NOTHING RUNS — the master ramps to 0, the context is
  SUSPENDED, every element paused, the direct path's src released, no silent activation loop; a tap no longer resumes it; UNMUTE in a tap
  resumes + re-activates inside the gesture and ramps up from 0. ONLY the master reaches `ctx.destination` now (THE PROBE's tap, the beat's
  and PRISM DROP's analysers, the unlock blip went straight to it). `audio-hush.mjs` 9/9 (the graph recorded from the first line; the ramp
  0 → 0.195 → 0.675 → 1 over 250 ms); `audio-hush.test.mjs` sweeps the code for any node wired to the destination. Safari's iOS simulator is
  not on this machine — Ben's check on his iPhone below.
- **THE RADIO'S POLL BY FACE (item 31):** 3 s only on the live DESK, 15 s on a paper face (+ at once when it opens or is tapped), closed 20 s
  — calls an hour with the radio open on a paper face **1,200 → 240** (the desk 1,200, closed 180 unchanged).
- **COAST CLEAR's END LINE (item 32):** every number kept with its unit (no-break spaces — `logic.js#endLineNb`, the share card's line
  untouched) + the letter-spacing tightens 0.2 → 0.16 → 0.12 em before a wrap; `e2e-coastclear` checks 3 sizes × 2 looks × 0–3 pauses ×
  0–2 spots break only at " · ".

## Tests (local, the mini PC — my own emulators + `DAILY_TEST=1 scripts/serve.mjs --emu`, nothing else running)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **1951 / 1951** |
| harbor groups `core,dock,load,panel,motion,people,trivision,billboard,windows,fireworks,sheetstack,shell,tapfit,sightings,roomperf,legends,blackbird,desktop` | 304 / 309 → the 5 reds fixed + re-run `people,panel,roomperf` **63 / 63**; `sgfast` 1 / 1 (NO full local harbor — the cloud runs it) |
| smoke | **8 / 8** |
| e2e-daily | **92 / 92** (its dock-states helper read after a fixed 400 ms — now waits for the state each URL asks for) |
| e2e-coastclear | **42 / 42** (incl. THE END LINE matrix) |
| `/api` `server.test.mjs` | 57 / 58 — the one red ("TEST PLAYERS … the grouped logs") fails the same on the code BEFORE this pass (the base worktree, same emulators); THE QUIET COUNTS' new test green |
| e2e-taps | Chromium **30 / 30** · WebKit **28 / 28** |
| wk-press (WebKit) | **29 / 29**, 0 rescues |
| e2e-gone | **10 / 10** |
| audio-hush | **9 / 9** |
| sw-cache (WebKit) | **3 / 3** |
| wk-onebuild | WebKit **19 / 19** · Chromium **19 / 19** |
| tri-flash | 6 / 6 (3 sizes × night + day) + day / night at 4× CPU @3: 0 flashes |
| req-count | 3 / 3 |
The harbor batch's reds and their causes: THE DELAY's new count sat on the wrong line (moved into `open()`); the cab stand (×3) — its test
moment, 21:30 on Sep 15, IS a fireworks show: the taxi is now rightly held (NO TRAFFIC DURING THE FIREWORKS) → the tests moved to 21:40;
roomperf's 4× cost +4.1 ms "standing" (limit 3) — green on the re-run.

## The cloud run
FILLED AT THE CLOSE.

## Left open
- THE 8-CARD LOBBY at 4× CPU: the GUESTS sheet builds its 8 slim strips in one go (~4.6 s to come in) → CITY C.
- THE LEAVING SQUEAL: no iOS simulator here — proven in Chromium's Web Audio graph; Ben's iPhone decides.
- MUSIC OFF with the effects ON keeps the context for the effects (the city's beds are effects) — "nothing runs" is muted / everything off.

## For Ben's iPhone
- THE TAPS: https://neonspeakeasy.com/ — DAILY → SCORES → ALL TIME / TODAY, the FRIENDS box, BACK; BOARD's game tabs + WEEK / ALL TIME;
  PLAY → a game's row; YOU → CUSTOMIZE YOUR CARD — each should act on the first tap, every time.
- THE BILLBOARD TURNING (by day is where the flash was): https://neonspeakeasy.com/?force=trivision
- MUTE + LEAVE: https://neonspeakeasy.com/ — ☰ → sound off, then switch to another app (the city, the DAILY screen, a PRISM DROP match):
  no squeal. Then sound on with a tap — the music comes back without a pop.
- FIREWORKS TRAFFIC: https://neonspeakeasy.com/?force=fireworks — no car, bus or taxi enters while the show runs; boats keep moving.
- THE BOSS (one size, his walk by the blur): https://neonspeakeasy.com/?force=boss-watch (his walk-up / away on a short loop) — or a party
  night: https://neonspeakeasy.com/?when=2026-11-14T22:28
