# FREEFALL — THE REVIEW (REPORT ONLY) — Nov 27 2026 · the Beelink · Fable 5.2

**This pass changed NO game code.** It read, played, measured and reported. Its only commits: the Step 0 plan note
(`docs/games/plan.md` "FREEFALL — THE REVIEW") + this report. FREEFALL stays HIDDEN (`config.js` untouched), THE SWITCH stays OFF, nothing
was opened on the live site (every match = the emulators / the test page's bots). **RE-PUBLISH: nothing** (no rules-file change).

How it was done: the whole FREEFALL test set run fresh (below) · ≈ 480 fresh shots at 375 × 667 · 390 × 844 · 430 × 932, both looks, looked
at as REAL-SIZE contact sheets (`Downloads\NEON\freefall-review\sheets\`) · the HUD's contrast measured from the pixels · four probes on the
local test page (a first-timer who only taps · memory over 8 runs · PAUSED's cover · a lost context inside each breakthrough) · the 2,000-seed
sims re-run · two cold read-only code reviewers (the rules + trusted scoring with pure Node probes against the real judge · the match +
end screens + sounds + credits), their top claims re-run / re-read by this pass before they went in here. Grok reviews in parallel; Claude
merges both lists into ONE fix list for THE FIX PASS (Opus).

## THE VERDICT (5 lines)
1. **By NIGHT, FREEFALL is at the JAYWALK / HIGH RISE bar**: the opening, the six areas, the three breakthroughs, the end screens and the
   share cards read premium at real phone size; a MEASURED 60 fps at every tier at 1× + 4× CPU in both looks, through every breakthrough and with 8 ghosts.
2. **By DAY it is one step below**: the HUD has no ground behind it (the score measures 1.1–1.3 : 1 on the rooftop, the offices and the
   harbor), the water at 119 and the roof's painting are the two soft pictures — all three fixable in THE FIX PASS.
3. **The rules, the proof and the judge are sound** (every suite green, REPLAY = LIVE, the sims unchanged, forged / foreign-seed / over-spin /
   late logs refused); what is open is what JAYWALK + HIGH RISE also carry today — a script or a copied rival's log is a LEGAL log.
4. **The match "just works" in every E2E case** (refresh, lock, drop, host change, late joiner, 8 players); the holes are edge cases found
   by reading: a silent-but-online drop of 18 s+, a leaver's 93 s wait, WATCH on a dead phone.
5. **Go-live after ONE fix pass**: 3 MUST + the two already-decided items + the top SHOULDs; nothing found needs a redesign.

**THE COUNTS: MUST FIX 3 · SHOULD FIX 16 · NICE TO HAVE 15.** Sizes: S = under an hour · M = a group of a pass · L = a pass.

## ALREADY DECIDED FOR THE FIX PASS — both CONFIRMED REAL (not re-reported)
- **(1) THE WATER at floor 119, both looks** — still reads as "code water" at phone size: a flat disc of colour with even vertical dashes
  (night: dark teal + pale dashes; day: a saturated blue + dark dashes + one lavender smear under the floor), no swell, no ring round the
  tower. Shots: `sheets\area-night-375-2.png` (117) · `sheets\area-day-375-2.png` (117) · `sheets\day-plunge.png` (119). The plunge itself
  (the crown, the banner, the first frame under water) is fine. **One measured thing for the rebuild:** the water's FIRST frame costs
  150–217 ms today (I, below) — the new water must be warmed behind the opening.
- **(2) "MIA IS OUT" + LAST ONE STANDING sit over the floors below the ball** — at 60 % / 50 % of the screen, exactly on the two floors the
  player is about to land on. Shots: `sheets\moments-night.png` · `sheets\end-night-375.png` (4th frame, 375 × 667).

---

## MUST FIX (before go-live)

### M1 · THE LOOK IS NOT LOCKED — day / night can flip in the middle of a run or a match
- **What:** the checklist's "day/night switch locked per match" does not exist. The look is the console's PER-DEVICE setting, read LIVE
  ("NO LOCK": `js/games/kit/look.js:1-6`); the stage polls it four times a second and flips the scene at once
  (`js/games/freefall/stage.js:746` → `:199` `setLook`). AUTO re-reads the sun every 60 s, so a run that crosses sunrise / sunset — or a
  player who opens ☰ → Settings → Game look — changes every colour under the ball mid-fall; `night.js:828-835` then fetches the other
  look's pictures and re-bakes the number + the bands (a hitch). Two phones in one match can show different looks (the rules + the tower
  are the same in both; red is drawn in both).
- **Where:** `js/games/freefall/stage.js:91, 197-199, 746` · `js/games/kit/look.js`.
- **Reproduce:** `/freefall-play?look=night`, start a run, in the console `__ffPlay.setLook('day')` mid-fall (the same call the poll makes);
  in the cartridge: ☰ → Settings → Game look while falling.
- **Fix:** freeze `lookT` from the run's start (`t0 != null`) to its end at `stage.js:746` — a change applies at the next opening / the
  podium (S). The same look on EVERY phone of a match = the host stamps `game.look` at the start and the view passes it as `lookNow`
  (M — it overrides the console's per-device rule: OPEN FOR BEN 2).
- **Size:** S (per phone) · M (per match).

### M2 · BY DAY THE HUD HAS NO GROUND — the score is 1.1–1.3 : 1 on three of the six areas
- **What:** by day the dark fall behind the HUD is switched off (`css/freefall-play.css:151` `.ff-shade::before { background: none }`) and
  THE BIG NUMBER is hot pink `#ff3fa8` with a thin outline (`:157`). Measured from the shots (the number's box, the pink against what is
  behind it — `scratchpad contrast.mjs`): **rooftop 1.13 : 1 · offices 1.28 · harbor 1.28 · rooftop-30 2.3 · speakeasy 3.2 · water 3.2 ·
  the deep 4.4** (by night: 9.6–16.8 : 1). The thin digits ("1", "11", "14") sink into the bridge and the skyline; a pink haze sits behind
  the number. The small lines share the problem: **YOUR BEST n** and **n PLAYING** are dark grey over the panorama's buildings on the
  rooftop — unreadable at 390. The project's rule is ≥ 4.5 : 1 for all text; this is the score, in the most-played 40 floors.
- **Where:** `css/freefall-play.css:151-158` (the day's shade, number, gold number) · the top line's day colour next to them.
- **Reproduce:** `/freefall-play?look=day` → floors 1–40; `?look=day&floor=46`; `?look=day&floor=128`. Shots: `sheets\first-day-1.png` ·
  `sheets\first-day-3.png` · `sheets\area-day-375-1.png` · `sheets\area-day-375-2.png` · `sheets\day-roof-390.png` (YOUR BEST).
- **Fix:** give the day its own ground — a soft navy fall behind the HUD's column (the foot already has one: `:152`) AND/OR a white (gold
  when NEW BEST) number with the navy outline, as night's; re-measure every area ≥ 4.5 : 1 (the number may be judged as large text, ≥ 3 : 1,
  but 1.1 is neither). The top line: white with the dark outline on every area.
- **Size:** S.

### M3 · THE BUDGETS ARE FULL — the fix pass and the go-live flip cannot land without room
- **What:** measured today: **THE BOOT BUDGET has 21 B left** (6,655,979 of 6,656,000 B, 306 / 310 modules — F5C left 188 B; THE END-BOARD
  SWITCH-ON used 167) and **FREEFALL's per-game line has 1.4 KB left** (608.6 of 610 KB, 42 / 46 modules). The water rebuilt from a ripple
  map, the moved callouts and M1 / M2 all add code to the cartridge; the go-live adds `live: '…'` to `config.js`'s row (boot) and
  FREEFALL's entries to `LOGO_ACC` / `ACC` / `SIGN_ACC` (boot) — `tests/boot-budget.test.mjs` + `tests/game-budget.test.mjs` go red.
- **Where:** `tests/integration/boot-budget.json` (`moduleKB` 6500) · `tests/integration/game-budget.json` (`freefall` 46 / 610).
- **Reproduce:** `node --test tests/boot-budget.test.mjs tests/game-budget.test.mjs` after adding ~30 bytes to any boot module.
- **Fix:** THE FIX PASS's Group 0: free room first — FREEFALL's long history comments out of `night.js` / `stage.js` / `break-fx.js` /
  `breaks.js` (≈ 290 KB between them, comment-heavy — the standing rule moves a module's long history to its doc), `config.js`'s FREEFALL row
  comment trimmed (boot) — or a NAMED raise (FREEFALL's line; the boot's 6500 KB has never been raised — OPEN FOR BEN 4).
- **Size:** S (trim) — it is a blocker only because both next passes start red without it.

---

## SHOULD FIX

### S1 · A dropped signal of 18 s+ can end the match under a player who is still falling (JAYWALK's + HIGH RISE's rule too)
- **What:** the host ends the match when every node has `e` OR has been silent `IDLE_OUT_MS` = 18 s; the 75 s `DROP_WAIT_MS` is added only
  when PRESENCE says offline (`js/games/freefall/match.js:26, 67`). Presence is the server's socket state: after a HARD drop (airplane mode,
  a tunnel) it can stay "online" for up to about a minute. If everyone else has ended, `final` is written 18 s into the drop; the dropped
  player keeps falling, their late chunks are still accepted by the rules, but `game.results` + `night/{matchId}` are never corrected and
  their own podium shows the host's early row (`view.js:411-414` — `liveWait` skips its own uid). The 2-player shape is the bad one: the
  player still falling is usually the winner-to-be.
- **Where:** `js/games/freefall/match.js:26, 58-67` · `director.js:92` · `js/host.js:252, 275-287` · `view.js:131, 411-414`.
- **Reproduce (real phones — DevTools "Offline" closes the socket cleanly and will NOT show it; the E2E's drop case is a clean close):** A
  hosts, B joins; A goes out at ~0:10; B turns on airplane mode and keeps falling 25–40 s, then turns it off. Look for A's podium ~18 s
  into the drop, then B's podium showing fewer floors than B reached and A as the winner.
- **Confidence:** the director / podium / night path READ, certain; the presence lag needs the phone check (OPEN FOR BEN 5).
- **Fix:** (a) S — a phone whose own run ended after `g.endAt` shows `scoredNow(g)` (its podium is at least true); (b) M — the host
  re-scores `results` + night when a participant's `e` lands after `endAt` and before the cap, or a silent-but-online player gets the drop
  wait too (a longer wait for a locked phone: OPEN FOR BEN 3). Whatever is chosen belongs in JAYWALK + HIGH RISE as well (the numbers are
  pinned equal).
- **Size:** S + M.

### S2 · THE COPYCAT — a rival's log is a valid log for MY node (new; proven on the real judge)
- **What:** in a match every phone mirrors the whole `ff/{matchId}` tree (the ghosts) and everyone shares one seed + one clock. A modified
  client writes the leader's chunks into its OWN node a moment later (the judge allows 8 s behind). Each node is judged alone, never
  compared (`api/_lib/freefall.js:82-97`, `js/games/freefall/proof.js:252`). It earns a shared win, raises the `freefall-solo` best
  (`js/core/match-report.js:456`) and the cards — and the log is a HUMAN's, so no plausibility check would catch it.
- **Reproduce (pure Node, re-run by this pass — `scratchpad\audit-rules\p2-copycat.mjs` · `p2b-copy-plus-one.mjs`):** B = A's chunk texts
  stamped 400 ms later → "12 matches: the copy TIED FOR FIRST in 12"; B = A's moves 1.5 s behind + ONE scripted landing where A died →
  "B placed AHEAD of A in 12 of 12" (A 160 → B 161).
- **Fix:** in `freefallMatch`, compare the on-time nodes' LANDING SEQUENCES (floor, landing tick) from the replays: two players identical
  over ~30+ landings → the later-arriving node is refused as `copy` (kept as "played" through `prefixFloor`). Exact-text matching alone is
  beaten by ±1-unit jitter; the landing sequence is not. JAYWALK + HIGH RISE have no such check either (`api/_lib/` grep) — same pattern,
  same fix, their own passes.
- **Size:** M (server only).

### S3 · A perfect script is a legal run — no plausibility hold exists (known since F4A; now measured)
- **What:** the judge proves a log is LEGAL (ticks rising, ≤ 171 units a tick, on time after the seed existed); it cannot tell a hand from a
  script. The seed is computable milliseconds after GO.
- **Reproduce (`scratchpad\audit-rules\p1-perfect.mjs`, through `verifyRun` / `freefallMatch`):** a naive script at MAX SPIN → `ok, floor
  401 in 2:00, bounces 1, bestRun 401, all three cards`; in a match → floor 200 in 1:00 against the sims' "great" bot's 197. Reference for a
  threshold: the great bot over 200 floors has 146–178 bounces and a best no-bounce run of 7–11; TERMINAL VELOCITY itself is 15.
- **Where:** `js/games/freefall/replay.js:29-57` (the only input bounds) · `proof.js:158-210` (the clock only) · `api/_lib/freefall.js:57`.
- **Fix:** a server-side HOLD on the judged row (e.g. bestRun ≥ ~40, or < 0.3 bounces a floor over 100+ floors): XP paid, the board row +
  the cards held for /admin — OVERCLOCK + PRISM DROP already have bounds of this kind (`js/core/match-report.js:173, 259`). OPEN FOR BEN 1.
- **Size:** M.

### S4 · Slow motion at the END of a run is taken whole (known since F4B; now measured)
- **What:** a run that ENDS inside a dropped-signal burst is never held to "back on the clock within 15 s" — the loop ends with `drop`
  still open (`js/games/freefall/proof.js:199-207`).
- **Reproduce (`p4-endburst.mjs`, a run finishing floor 200 at tick 3600):** the last 20 s landing 80 s later (4×) → `ok, made`; the last
  10 s landing 82 s later (8.2×) → `ok, made`; the WHOLE 60 s run in one burst 82 s after tick 0 → `ok, made`; 83 s → cut at floor 134.
  In a match the room really waits 18 + 75 s for an offline player, so the window is usable (a modified client).
- **Fix:** in a MATCH, a burst that ends the run counts only if its silence was ≤ 15–20 s (else cut at `drop.events`), or the row is
  marked `late` and kept off the board + the tie-break. Costs an honest player who dies during a long outage their last floors.
- **Size:** S.

### S5 · A hold has no maximum length
- **What:** `h/{i}` may be (re)written until `e`, for 3 h after GO; the judge only checks the stamp is not BEFORE the hold
  (`database.rules.json:908-909`, `proof.js:172`). A hold at tick 2 = "stop the clock for hours with the seed known" — on its own no more
  than S3, but it defeats any human-likeness check S3 adds.
- **Reproduce (`p3-holds.mjs`):** `ONE hold … away 2 h 50 min → ok, floor 64, holds 1`.
- **Fix:** the judge cuts at a hold whose stamp is more than N minutes (10?) after the hold's wall time (no rules change).
- **Size:** S.

### S6 · A player who leaves — or never started — keeps everyone else waiting up to 93 s
- **What:** (a) a QUIT mid-run flushes + closes the writer but never writes `e` (`view.js:487-491`; `kit/proof-writer.js:129-144`), and
  leaving makes the player offline → the room waits 18 + 75 s on "WAITING FOR B · NO SIGNAL". (b) a tab closed in the 3 · 2 · 1: no GO at
  all → `endedFor(undefined)` waits the same from `playAt` (`match.js:58-67`), although after `g0 + GO_WINDOW_MS` (5 s) that player can
  never have a run — `core/proof.js:85` `liveGoers` already says so (the two rules disagree).
- **Reproduce (two phones / two emulator tabs):** (a) A goes out early, B taps ☰ → LEAVE while falling: time A's wait; (b) B closes the tab
  during the count, A goes out at 0:10: A waits until ≈ 1:33.
- **Fix:** (a) a deliberate leave writes `e` for a live proven run; (b) `endedFor` is true for a node with no on-time GO once
  `now > g0 + GO_WINDOW_MS + ~3 s`.
- **Size:** S each.

### S7 · WATCH THE LEADER parks on a dead phone; "n PLAYING" counts it; it blocks LAST ONE STANDING
- **What:** `follow()` picks the deepest rival that is not over — `lost` rows included — and keeps `stay` while it is not over; a dead
  phone never becomes over on this screen (`js/games/freefall/ghosts.js:215-225`; `view.js:351-355`). The picture freezes before the
  fatal landing; only TAP: NEXT gets the watcher away. The same `!over` test counts a no-show / dead phone in the top line
  (`stage.js:530`) and blocks LAST ONE STANDING for the whole match (`ghosts.js:180`).
- **Reproduce:** 3 phones; C closes its tab mid-run while deepest; A goes out → A watches C's frozen ball.
- **Fix:** the leader among `!over && !lost`; leave a `stay` lost for > ~2 s; lost rows out of the count.
- **Size:** S.

### S8 · A non-participant in a SOLO-mode room gets a playable uncounted run, a false rules alarm and a dead BACK
- **What:** in a room of 2+ where only the host was online at the start the game is in solo mode; a friend who comes back mounts the solo
  view on THE OPENING and nothing checks `mine(g)` before a drag starts a run (`stage.js:424`; `view.js:163-199`). `soloGo` tries 7 times
  (~3 s), the rules refuse (rightly), `refused()` logs "re-publish database.rules.json" to /admin's errors (`view.js:140, 177`), the friend
  plays NOT COUNTED inside the owner's run; on that card BACK calls `backToLobby()` — a silent no-op for a non-host (`js/host.js:499`), the
  button stays busy (`view.js:430-433`). The same dead BACK meets a solo player whose host role migrated.
- **Reproduce:** owner + friend in a room; lock the friend's phone; the owner starts FREEFALL; unlock the friend's phone and drag.
- **Fix:** `!mine(g)` in solo mode → watch, or a plain "PLAYING — WAIT FOR THE REMATCH" with no GO; `leave()` falls back to
  `setState({ quit: matchId })` when not the host (as `js/ui/final.js:113`).
- **Size:** S.

### S9 · The match podium shows NO standings if the end-board chunk fails to load
- **What:** in a FREEFALL match the WINNER line is hidden by CSS and the console's own list is suppressed, so the lazy `ui/end-board.js`
  block is the only place that says who won. Import fails → the block is removed and the list was already computed empty; its kits fail →
  the error is swallowed and "THIS MATCH" stands over nothing (`css/freefall-play.css:295`; `js/games/freefall/final.js:50`;
  `js/ui/final.js:75, 198`; `js/ui/end-board.js:85-98`).
- **Reproduce:** DevTools → block `js/ui/end-board.js` (or `strip-board.js`), finish a 2-player match → a podium with only your own number.
- **Fix:** on failure render the console's plain `leaderboard(rows)` / a three-line text list.
- **Size:** S.

### S10 · The solo end board is read ONCE a session — stale after a counted NEW BEST (shows at the switch-on)
- **What:** `worldRows` / `tableRows` are cached for the session with no invalidation in shipped code (`js/ui/end-board.js:43-53`). After
  a counted NEW BEST the top 3 and "YOU · 12TH · 88 FLOORS" keep the old row until a reload. Invisible while counting is OFF; live today
  in JAYWALK + HIGH RISE (the block went on this morning).
- **Reproduce:** the emulators with `testFreefallCounts`: two counted runs, the second a new best → the YOU line.
- **Fix:** drop the board's cached read when the server's answer carries a pb for it.
- **Size:** S.

### S11 · The FRIENDS ONLY tick remembers "ON" after it unticks itself — "NO FRIENDS YET" on every later end screen, every game
- **What:** a tap writes the choice (`js/ui/end-board.js:108` `if (byTap) writeFr(friends)`); with no friends the block unticks itself by
  `setFriends(false, false, 'NO FRIENDS YET')` (`:112`) — `byTap` false, so `ns:endb:fr` stays `'1'`. From then on every end screen (all
  five games — the setting is shared) reads the table again, unticks again and prints NO FRIENDS YET under an unticked box.
- **Reproduce:** a player with no friends taps ☐ FRIENDS ONLY once, then PLAY AGAIN → the next end screen. Shot: `sheets\e2e-solo.png`
  (frames 2 + 3: the E2E taps once on the first end; the second end screen says it again, untapped).
- **Fix:** the self-untick writes `'0'`; the note shows only on the tap that caused it. (S10 + S11 are in the SHARED block: the next CITY
  pass already rebuilds its header + list — the inbox's Nov 27 12:01 pm + 12:06 pm entries — so they can ride with it.)
- **Size:** S.

### S12 · A first-timer who TAPS (no drag) loses at floor 0 with nothing on screen telling them why
- **What:** the first PRESS starts the run (`stage.js:424` `begin(...)` on pointerdown), the title + the DRAG TO SPIN hint fade
  (`:355`), and with no turn the ball bounces in place: THE LIGHTS ARE GOING OUT at ~6 s, THE LIGHTS WENT OUT · 0 FLOORS at 9.0 s
  (the probe: `logs\probes.log` "TAP"). "Tap to start" is the reflex on a title screen; the hint that would teach the drag is exactly what
  the tap removes. Everything else about the first play is right (no red before floor 10, red patterned, the gap finds itself).
- **Reproduce:** `/freefall-play` (a new phone) → tap once, wait. Shot: `sheets\tap-first-timer.png`.
- **Fix (no rules change):** keep the thumb-sweep hint + DRAG TO SPIN on screen until the tower has actually been turned (or floor 1 is
  passed); it may come back if the ball has bounced 2 s on floor 0 untouched.
- **Size:** S.

### S13 · THE DEEP + THE TRENCH by night: the SAFE slices are almost as dark as the wall
- **What:** the night floor tone from floor 160 down is `0x1c1a5c` / `0x2a2478` (`js/games/freefall/palettes.js:21, 25`) on a dark blue
  wall with a dark pillar: a safe slice and a GAP are told apart only by the slice's lilac rim line. By day the same floors are a clear
  lavender (`0xa48cea`). This is the area with the most red (69–81 % of a floor) and the least time; red itself reads fine (and in
  greyscale — `sheets\grey-night.png`).
- **Reproduce:** `/freefall-play?look=night&floor=165` · `&floor=204`. Shot: `sheets\deep-night-vs-day-430.png` (night · night · day).
- **Fix:** lift the night tone (towards `0x3a34a8`–`0x4a40c0`) or give the top face a sheen, keeping THE COLOUR RULE (≥ 60° from red).
- **Size:** S.

### S14 · LAST ONE STANDING's words are untrue when a rival FINISHED (+ it fires twice after a refresh)
- **What:** `lastStanding` treats `made` as over, so with a rival on floor 200 the card reads "N FLOORS TO THE LEAD · KEEP FALLING"
  (`ghosts.js:175-182`) — the lead cannot be taken: equal floors lose on the earlier tick (`logic.js:58`). Firing it is right (F5C's
  named call); the words are not. `lastSaid` is reset in `adoptMatch` (`stage.js:498`) → a refresh says it again.
- **Fix:** a rival's end is `made` → "MIA HIT THE BOTTOM · KEEP FALLING FOR 2ND" (or measure to the deepest rival that did NOT finish);
  keep `lastSaid` per match id. Build it with the decided move (item 2 above).
- **Size:** S.

### S15 · The match clock is anchored ONCE to `performance.now()` (SUSPECTED — a real iPhone only)
- **What:** `t0 = perfOf(playAt)` is set at adoption (`view.js:137, 310-312`; `stage.js:498`) and never re-anchored in `show()`
  (`stage.js:589-593`). If the page clock does not advance while an iPhone sleeps, after a lock the ball is still alive where it was (a
  free pause in a match), the cap clock + the ghosts are late by the sleep, and the judge cuts the run ~15 s later (`proof.js:198-205`)
  while the player plays on. Headless Chromium keeps the clock running: the E2E's "hidden 10 s" case cannot show it.
- **Reproduce:** lock an iPhone 20–30 s mid-match, unlock. Expected: OUT · THE LIGHTS WENT OUT. The bug: the ball still falling.
- **Fix (cheap either way):** in a match `show()` re-anchors `t0` from `serverNow()`.
- **Size:** S.

### S16 · The roof's PAINTING is the soft picture of the first 40 floors by day (known since F5A — still true)
- **What:** by day floors 30–39 put the roof deck across the lower half of the screen: the AC units, the pipes and a dark stain are a
  blurred, blotchy painting next to razor-sharp floors (the grain F5A added helps the concrete only). By night the neon lines carry it.
- **Reproduce:** `/freefall-play?look=day&floor=36`. Shots: `sheets\day-roof-390.png` (frame 2) · `sheets\area-day-430-1.png` (frame 4).
- **Fix:** F5A's Grok brief (a TRUE 2048² top-down roof painting) — an asset, not code.
- **Size:** M (with Grok's delivery).

---

## NICE TO HAVE
- **N1 · Call the Winner offers picks that cannot count** — a no-show (no GO) and lost rivals are in the list (`view.js:344`); picking one
  is refused by the rules ("YOUR CALL DID NOT GO THROUGH"); after a long lock the sheet opens although `scoreCalls` drops a call made > 16 s
  after the judge's end tick (`match.js:95`). Fix: candidates = on-time GO and not lost; no sheet past the window. S.
- **N2 · SHARE draws a misleading card in three edge cases** — an unproven match, a refused row or a "missed the start" phone still shows
  SHARE (`js/ui/final.js:170`): "0 FLOORS · THE RUN IS OVER · MATCH · 1ST OF n" over the frame of a deeper run (`share.js:17-21`;
  `card.js:65-69`); a cut run pairs the judge's floor with the phone's frame. Fix: no SHARE when `game.unproven` / a bad row / no run. S.
- **N3 · The finish's share card has the weakest picture** — "YOU HIT THE BOTTOM · 200" (the game's top result) frames a ball on flat
  sand, by night a purple-grey blur (`sheets\cards-night.png` · `sheets\cards-day.png`, 3rd card); the celebration (the gold ring, the
  fireworks, the rocks) is in the moment (`sheets\finish-night.png`) but not in the staged frame. Fix: `shot.js`'s `made` frame staged at
  the ring's widest + pulled back. S.
- **N4 · Credits text** — `audio/freefall/CREDITS.md:1, 5` + `sounds.js:1` say "all CC0 … no CC BY", but FREEFALL plays
  `audio/jaywalk/new-best.mp3` (CC BY 4.0, TommasoMotteran — the attribution DOES ship in JAYWALK's ungated group, `js/ui/credits.js:135`,
  and FREEFALL's row points there, `:219`): fix the two lines, name the author in FREEFALL's own row. `assets/freefall/roof/grain.webp`
  (made in code) has no line in `assets/freefall/CREDITS.md`. S.
- **N5 · HOW TO PLAY has no "a match never pauses" line** (in the comment `js/ui/help.js:408`, not in the list `:419-424`). S.
- **N6 · Floor 201 is the one landing whose fairness rests on the VIEW** — floors 40 + 120 are red-free, floor 201 (the first with MOVING
  RED, `tuning.js:114`) is landed on during the impact's ring / dust / camera kick: 1,500 towers, the slice straight below, tower not turned
  → SAFE 37.8 % · GAP 8.4 % · **RED 53.8 %** (floor 41 + 121: RED 0.0 %). Fix: `blind: [40, 120, 201]` + `move.from: 202` (nothing recorded
  yet → no new row). S.
- **N7 · The `ff` node carries no rule-set id** — the judge always replays on `classic` (`proof.js:246`); the `ff` rules have no `rs` leaf
  (HIGH RISE's node has one). Fine while nothing is recorded; after go-live the first tuning change needs the leaf + a re-publish, or a run
  in flight across a deploy is judged on the wrong row. Add it now or write it into the go-live note. S (a rules change = a re-publish).
- **N8 · A truncated log can earn up to +5 floors** (mean +1.8 in 15 of 40 runs — a modified client only; the judge plays any prefix out
  with the tower held still, `replay.js:85`). No fix needed beyond S3; note it in the doc.
- **N9 · Garbage in play outside the frame functions** — `pumpMatch` (10 Hz + once per rival chunk, ~27 a second with 8 players) allocates
  a `startOf` object + two string hashes a call (`view.js:387` → `match.js:35` → `logic.js:22`): memoise by `g0`. Change-frames only:
  `matchhud.js:80`, `ghosts.js:207`, `stage.js:531`. The frame functions themselves: clean (no layout read, typed arrays). S.
- **N10 · View state not rebuilt after a refresh** — the "YOUR CALL · MIA" line is lost though `runs[uid].k` is mirrored (`view.js:303`);
  the OUT card shows again; `liveWait.held` is lost (`view.js:414`). S.
- **N11 · While THE SWITCH is off the cartridge shows no YOUR BEST / NEW BEST** (`view.js:89`, `final.js:62` — gone at the switch-on);
  the profile mirror's AVG can overwrite the server's fresher one if its import resolves later (`final.js:63-66`). S.
- **N12 · The test page only** — `matchhud.reset()` zeroes `outN` while callout timers still decrement it (> 2 lines possible later:
  `matchhud.js:38, 114`); the page's SHARE fires on `pointerup` (`stage.js:71-77, 661-667` — if iOS gives no activation there the
  "PRESS AND HOLD TO SAVE" sheet shows; the cartridge uses a real click). S.
- **N13 · Small looks by day** — the gold "YOU HIT THE BOTTOM" reads cream on the pale sand (`sheets\crop-made-day.png`); the top line
  says "0 PLAYING" once you have finished (`sheets\match-2.png`, frame 3); the pillar's end hangs in the water above the seabed at 199
  (`sheets\day-finish.png`, frame 1); THE DEEP's lamps are soft amber blobs with no fixture (`sheets\area-day-375-3.png`). S each.
- **N14 · Seed shopping is free** — GO → read the tower → abandon → PLAY AGAIN costs nothing, and an abandoned run never reaches the
  AVERAGE (no night record → no report). Shared with JAYWALK + HIGH RISE; the owner's call whether an abandoned GO should count as a run.
- **N15 · Doc drift** — `docs/freefall.md:78` (the ranking without the blazes) · `:236` (an empty log ends "at tick 1140": it is 540) ·
  `:64, :92, :215` ("the daily never holds" against `:734-737`; the code today: `modes.daily.holds: 0`, `tuning.js:119`) · `:976` ("a 4 s
  grace": 9 s, `match.js:20`) · `:1032-1034` (the old edge markers). The darkness is exactly 6 s through floor **101** (the first eased
  floor is 102) — the doc's "0–100", the prompt's "0–99".

---

## THE CHECKLIST, A – K — what was checked and what it found
| | item | result |
| --- | --- | --- |
| A | FIRST PLAY (title-05 + glint, DRAG TO SPIN, the first 10 floors) | **PASS** for a player who drags: the opening is the best screen in the game; no red before floor 10; red is patterned. **One hole: the tapper (S12).** Shots `first-night-1…4` · `first-day-1, 3` |
| B | EVERY AREA + LOOK, RED readable | **Night PASS** (rooftop, offices, speakeasy, harbor premium; the deep / trench floors too dark — S13). **Day**: the HUD (M2), the water (decided), the roof painting (S16); offices / speakeasy / harbor / deep fine. RED reads in every area + in greyscale (the chevrons), both looks. No seam, no banding, no placeholder found; the panorama's join at 0.5 clean |
| C | THE BREAKTHROUGHS | skylight 40 · splashdown 120 · THE BOTTOM 200 (solo shelf + match finish): **PASS, both looks** — no glitch; the skylight's haze lasts ~0.3 s; floors 40 + 120 carry NO red on 1,500 / 1,500 towers (240 / 320 do: only 40 / 120 are hidden); a lost context INSIDE each breakthrough rebuilds and the run goes on (probe). Floor 201: N6. Frames: I |
| D | THE RULES | darkness 6.00 s to floor 101 → 7.00 at 130 → 8.00 from 160, integer-only, one function for phone + judge; a staller is out at 9.0 s (2,000 / 2,000); **no bot out in the dark from floor 100 down**; THE BLAZE + F2's saved landing always escapable (longest red run 8 slices: 1,366 units to solid ground against 1,632 reachable); the tie-break ONE comparator on host + server (floors → earlier tick → more blazes → draw), shared clock (a late GO only loses time); the pause: 3 a solo run, 0 in a match (refused by name), no input while held / in the count (probe: the log 315 → 315), a re-hide in the count spends nothing, no stamp → cut at the hold, the grant within 2 s. **PASS** — open: S5 (no maximum length) |
| E | THE MATCH + STABILITY | E2E 109 / 109: a real 3- + 8-player match, a late joiner, a host change, a lock, a signal drop, a refresh, the cap. By reading: host-private state none; the cap on `serverNow()`; two hosts' `final` identical. Open: S1 · S6 · S7 · S8 · S9 · S14 · S15 · N1 · N10 |
| F | TRUSTED SCORING | a claimed floor is never read; over-spin / teleport → `spin`; ahead 2 s refused, behind 8 s cut, the chunk ceiling before unpacking; a log on another seed → floor 0 (40 seeds); another player's node → own uid only; the same match twice → credited once; THE SWITCH asked once and returned before `credit()`; no other path credits FREEFALL. Open: S2 · S3 · S4 · S5 · N7 · N8 |
| G | END SCREENS + SHARE | one screen, no scrolling at 375 · 390 · 430 (+ sideways), the logo always, YOUR BEST n · AVG n / NEW BEST, the top-3 block, the YOU line, a shared place; SHARE = one PNG, synchronous from the click to `navigator.share({ files })`, never text; the name on the card; every cause has a frame, none stale (255 / 255). Open: S10 · S11 · N2 · N3 |
| H | HOW TO PLAY · MIX · CREDITS · LOOK LOCK | HOW TO PLAY complete but one line (N5), lazy only, gated by playable; 14 sounds = 14 files, none unplayed; 23 assets, none unreferenced; every sound asks `isUnlocked()`; the duck cannot stick. Credits text: N4. **THE LOOK LOCK: missing — M1** |
| I | SPEED | **PASS** — 60 fps at every tier, 1× + 4× CPU, both looks, each breakthrough, 8 ghosts; no leak over 8 runs; a lost context rebuilds. Two hitches to pre-warm: the water's first frame (150–217 ms) and the finish at 4× (100 ms) — the table below |
| J | FREE PLAN | re-measured, unchanged since F4B: 8 players all falling = 1,068 writes a minute (134 a player), up 164 KB, down 1,232 KB a minute → a full 3:00 match **3,204 writes · 480 KB up · 3.61 MB down** (F4B: 3,189 · 482 KB · 3.62 MB); 3 players 1,353 · 207 KB · 625 KB. Spark's 10 GB a month ≈ 2,800 full-length 8-player matches (the match as played, 52 s: ≈ 0.97 MB); 100 connections = 12 full rooms. **THE BOOT: 21 B left, not 188 — M3** |
| K | GO-LIVE READINESS | the checklist below; blockers: M1 · M2 · M3 + the two decided items |

## I — SPEED (measured on the Beelink, headless Chromium + ANGLE d3d11, 390 × 844; "4×" = CDP's CPU throttle — the mid-range profile)
| what (`freefall-play.mjs`) | rows | result |
| --- | --- | --- |
| `--perf` — THE SPEAKEASY + UNDER THE HARBOR, the bot shattering with the fire on · tiers 2 / 1 / 0 · 1× + 4× · night + day | 24 | **59.9–60.1 fps**, p95 16.8–17.2 ms, worst 16.8–18.2 ms — every row but one (below) |
| `--perf` — THE SKYLIGHT · THE SPLASHDOWN · THE BOTTOM (solo: the crack) · tiers 2 + 0 · 1× + 4× · both looks | 24 | **59.9–60.3 fps through each**, worst 16.9–17.9 ms at 1×; at 4× one or two long frames of 33–67 ms tagged `snd` / `dom` 3–4 floors BEFORE the break (floors 36 / 116 / 196 — the arrival's sound + band) |
| `--perf` — THE BOTTOM as a FINISH (the firework / THE DAY CELEBRATION) | 8 | 60.1–60.2 fps at 1× (worst 18.3 ms); **at 4×: 58.8–58.9 fps, ONE 100 ms frame** in all four rows (`snd` 50–67 / `pic` 33–50 @196) |
| `--perf` — THE WATER SURFACE in the picture (floor 119) | 12 | 58.2–60.0 fps; **one long frame as the water first shows: 150–167 ms in every 4× row, 217 ms once at 1× (night, tier 2)**, 33–83 ms in the other 1× rows |
| `--perf8` — 8 GHOSTS in the picture, tags on · the speakeasy + the harbor · tiers 2 / 1 / 0 · 1× + 4× · both looks | 24 | **59.9–60.1 fps**, p95 16.8–17.1 ms, worst 16.9–19.0 ms — every row but one (below) |
| `--stutters` — a WHOLE run, the roof to the trench (floor 212), 4× CPU | 2 | day: **HITCH 0**, worst 17.0 ms · night: HITCH 1 (one 250 ms frame @128 — below) |

- **The one red row is the MACHINE, not the game:** "day · THE SPEAKEASY · tier 0 · 1×" stalled ONE 250 ms frame in BOTH tables (56.2 / 55.5 fps) —
  the 11th row of each, ≈ 2 minutes after that browser launched, as did the night stutters run's one hitch: the Beelink's known headless-Chromium
  stall. Re-run ALONE three times (`--perf --one=day-84-0-1`): **60.0 fps, worst 17.5–17.9 ms, three of three.** (`logs\perf.log` · `perf8.log` · `stutters.log`.)
- **Two real hitches for THE FIX PASS to pre-warm** (both pass the suite's 58 fps bar, both are seen): **(a) the water's first frame, 150–217 ms**
  at floors ~117–119 (its program's first draw) — the rebuilt water must be compiled + drawn once behind the opening (`night.js#warm`);
  **(b) the finish at 4× CPU, one 100 ms frame** at the 200th floor (the firework's first draw + its sounds) — warm it the same way. The `snd` long
  frames before each breakthrough at 4× (33–67 ms): decode the three breakthrough sounds at the run's start (`audio/sfx-kit.js#decodeOnce`).
- **Memory** (the probe, 8 runs through PLAY AGAIN, the heap after a forced GC): 5.61 → 5.84 MB (flat from run 3), 268 DOM nodes and 9 canvases
  constant, 0 errors. **On hide** the scene gives its render targets back (`night.js:859` `rest`: the wall target 2 × 2, the bloom 4 × 4); leaving the
  game disposes everything + forces the context lost (`night.js:925-933`).
- **Lost context:** the suite's own case + the probe INSIDE the skylight (night), the splashdown (day) and the finish (night, match): rebuilt, the
  run goes on, frames moving, 0 errors (`sheets\hold-lose.png`, frame 4).
- **Not measurable here:** a real iPhone's numbers (`?fps=1` on /freefall-play is the owner's check — F3B's 59 fps · worst 34 ms stands).

## THE GO-LIVE CHECKLIST (what the go-live pass must do — JAYWALK's + HIGH RISE's pattern)
**The two flips**
1. `js/config.js:82` — `playable: true`, drop `preview: true`, add `live: '<the day>'` (NEW ON TOP + the NEW tag by its `live` day:
   `js/core/game-order.js:47`).
2. `api/_lib/freefall.js:54` — `FREEFALL_COUNTS = true` (keep the would-count path: it is the one-line kill switch; make the emulators'
   `testFreefallCounts` two-way so the OFF path stays tested — HIGH RISE's go-live did).

**Follows `playable` by itself (nothing to flip — check, don't build):** the server's owner gate (`api/report.js:90-104`) · the guest
host's REMATCH · HOW TO PLAY's tab (`js/ui/help.js:524`) · **the Credits group goes public** (`js/ui/credits.js:232`) · the games-list order
(`api/_lib/activity.js:49`) · the PLAY shelf + the room's list (`js/screens/title-taps.js:241`, `room-city.js:260`).

**Silently stays OFF — or breaks — after the two flips**
3. THE BOARD's tab: `js/board/view.js:61` add `'freefall'` to `TABS` (EIGHT tabs: re-shoot 390 — the row scrolls), `:67` `HIDDEN_TABS` → `[]`.
4. THE CITY: `signRoster` takes every playable game (`js/core/harbor-neon.js:927-928`) but FREEFALL has no sign, no day face, no accent and
   the billboard is not installed → either **the city chat ships them in the same deploy** (the handoff is in the inbox: "Nov 27 — TO THE
   CITY CHAT", the mark `js/core/marks.js` B · THROUGH THE FLOOR — read `t.w` / `t.o` on a tube — and
   `assets/city/freefall/billboard.webp` 848 × 448 with OPEN NOW) **or** `harbor-neon.js:925` `SIGN_HOLD = ['freefall']` as HIGH RISE's
   go-live did (the city pass lifts it). Otherwise `tests/harbor.test.mjs:1834, 3337` + `tests/city-b-signs.test.mjs:33` go red.
5. THE ACCENTS: no `freefall` in `js/ui/tube-logo.js:11` `LOGO_ACC`, `js/screens/title.js:117` `ACC`, `js/screens/harbor/signs.js:15`
   `SIGN_ACC` → the list icon + the game card fall back to `#d6f0ff`, not the teal `#27e0e6` (boot modules: M3).
6. THE SMOKE START: `tests/integration/e2e-smoke.mjs` has no `['freefall', {…}]` row and `:194-195` pins FREEFALL among the 11 that cannot
   start; `tests/registration.test.mjs:25-28, 78` still waits for it.
7. THE WEEKLY GOAL: `GOAL_GAMES` gains FREEFALL by its row (`js/core/boards.js:65`) — a MID-WEEK flip changes this week's featured-game
   pick (`js/core/ranks.js:108`, index % length): flip on a Monday 4 am line or pin this week's pick.
8. THE CARDS out of the hidden catalog (SPLASHDOWN · TERMINAL VELOCITY · ROCK BOTTOM — HIGH RISE's "the cards out of THE LAB");
   `api/_lib/lab-text.js:83-85` still says "HIDDEN until FREEFALL goes live".
9. THE TESTS THAT FLIP (each rewritten to the playable truth, none deleted): `tests/freefall-cartridge.test.mjs:62-66, 77, 140, 227` ·
   `freefall-lab.test.mjs:50-67` · `freefall-play.test.mjs:72` · `freefall-server.test.mjs:33` · `freefall-share.test.mjs:174-175` ·
   `cartridge.test.mjs:36` (`BUILDING`) + `:117` · `registration.test.mjs` · `e2e-freefall.mjs` ("hidden from a guest", the WOULD COUNT
   line) · `e2e-freefall-match.mjs` (the guest's REMATCH "Coming soon") · `server.test.mjs` (the stranger's 409 `not_reportable` + the OFF
   snapshots, ~`:1222-1492`).
10. /freefall-lab DELETED (the page, `lab.js`, `graybox.js`, `css/freefall-lab.css`, its tests, `serve.mjs` + THE PAGES LOAD) — HIGH RISE's
    pattern; /freefall-play stays and never counts.
11. THE DOCS + THE WORDS: CLAUDE.md "FIVE PLAYABLE" → SIX; ROADMAP; `docs/freefall.md` (the doc drift, N15); the meta row's comment.

**Wired and already tested with the switch ON** (the emulators — `server.test.mjs:1353-1371, 1481-1491`; `e2e-freefall.mjs` section 7):
solo XP + the streak day · the `freefall-solo` best + its AVG day row · SPLASHDOWN (card + achievement) · a match's win / XP / streak for
all three players · a match run raising the best · credited once.
**Wired but NOT yet seen tested with the switch ON — the go-live pass adds the cases:** TERMINAL VELOCITY + ROCK BOTTOM actually awarded ·
the F5C tie-break / a shared first place through the report (a draw's win flags) · the AVERAGE shown from the 5th run · THE DAILY CEILING
+ `countedPlays` for a FREEFALL row · the tab on public /board · the run's share-card upload · the `ff` rules on the LIVE project (F4A's
re-publish — never checked from here: the live site was not touched).

**What blocks it today:** M1 · M2 · M3 · the two decided items (the water, the callouts) — and Ben's word on OPEN FOR BEN 1.

## OPEN FOR BEN
1. **How much anti-cheat before THE SWITCH goes on?** A script (S3) and a copied rival's log (S2) are legal runs today — in FREEFALL exactly
   as in JAYWALK + HIGH RISE, which are live without either check. Proposed: FREEFALL ships with S3's hold (a too-perfect row is paid XP but
   its board row + cards wait for /admin) and S2's landing-sequence check; the same two then go to the other two games. Or: go live at the
   other games' level and do all three together later.
2. **THE LOOK LOCK (M1):** locked per PHONE for the run (S — the fix pass does this either way), or the SAME look on every phone of a match
   (M — the host's look wins over each player's own Game look setting)?
3. **A silent phone in a match (S1):** today 18 s and the room moves on (a locked phone never holds the others up long); waiting the full
   drop time for a silent-but-online player protects a tunnel but makes everyone wait up to 93 s for a phone that was simply put down.
   Proposed: keep 18 s, but re-score if that player's end arrives before the cap.
4. **THE BUDGETS (M3):** trim comments (proposed) or raise — the boot's 6500 KB has never been raised.
5. **TWO PHONE CHECKS only a real iPhone can do** (in a hidden match you host): lock your phone 20–30 s mid-match and unlock — is the ball
   still falling (S15)? · airplane mode 30 s while the other player is already out — does their podium come up early and yours show fewer
   floors than you reached (S1)?

## THE TESTS (local, fresh emulators + this pass's own `serve.mjs --emu`, one suite at a time; logs `Downloads\NEON\freefall-review\logs\`)
| suite | result |
| --- | --- |
| unit — `node --test tests/*.test.mjs` | **2,840 / 2,840** (before this file existed: 2,839 — the docs' links test wanted the report the plan note names) |
| the sims — `node scripts/freefall-sim.mjs 2000` | the table unchanged: solo great 242 (164–357) · good 136 · human 149 · sloppy 62; a staller out at 9.0 s (2,000 / 2,000); **0 bots out in the dark from floor 100 down**; A STOPPED BALL HAS 6.00 s (0–100) · 6.50 (115) · 7.00 (130) · 7.50 (145) · 8.00 (160+) |
| `e2e-freefall.mjs` (the hidden cartridge, solo) | **64 / 64** |
| `e2e-freefall-match.mjs` (3 + 8 players, late joiner, host change, lock, drop, refresh, the network) | **109 / 109** |
| `freefall-play.mjs` (the test page) · `--f3b` · `--f4a` · `--f4b` | **172 / 172** · 29 / 29 · 18 / 18 · 17 / 17 |
| `freefall-share.mjs` (the cards from real end frames) | **255 / 255** |
| `freefall-lab.mjs` | 57 / 57 |
| `e2e-smoke.mjs` (+ THE PAGES LOAD) | **28 / 28** |
| `freefall-play.mjs --perf` · `--perf8` · `--stutters` | 67 / 68 · 23 / 24 · 2 / 2 — the two reds = ONE row, the machine's stall (I, above: green alone × 3) |
| rules — `node --test rules.test.mjs` | **101 / 106** — every FREEFALL case green; the five reds are JAYWALK + HIGH RISE fixtures (below) |
| `/api` — `node --test server.test.mjs` | **76 / 78** — every FREEFALL case green; the two reds are JAYWALK fixtures (below) |

**The JAYWALK / HIGH RISE reds — still failing, and WHY:**
- **Rules, 5 reds — THE SWITCH-OVER's date passed this morning.** THE PROOF PASS let a GO land in a tree WITHOUT the `t0` stamp until a fixed
  server time: `js/core/proof.js:19` `T0_SUNSET_MS = Date.UTC(2026, 10, 27, 9, 0, 0)` = **Nov 27, 4 am New York**, twice in
  `database.rules.json` as `now < 1795770000000`. Since then every GO needs the stamp — as designed. Five OLDER cases still GO in an unstamped
  tree and expect it to land (`set …/jw/mm1/p2/go failed: permission_denied`): JAYWALK H1 + H3 + H4 (the jw node) · JAYWALK J2 (`cv`) · HIGH RISE
  S4A (the hr node) · S4B THE LIVE LOCK · S4B `rs`. F5B ran before 4 am (106 / 106), F5C after it (101 / 106) — F5C's "time-bound" was right, this
  is the date. **Stale fixtures, not a live bug** (a live phone stamps; FREEFALL's `ff` GO always needed the stamp). Fix (the next JAYWALK /
  HIGH RISE pass, S): the five fixtures stamp `t0` first; the dead `: now < 1795770000000` branch can leave the rules at the next rules change.
- **`/api`, 2 reds — NOT the date** (they were already red in F5B's 2:36 am run): JAYWALK H6A's match report answers 403 `not_in_match`
  (`server.test.mjs:3130`) and THE PROOF PASS's verified-solo case gets `outcome.skip` (`:3586`). JAYWALK-only fixtures; FREEFALL's + HIGH RISE's
  report cases pass on the same emulators. Not traced further here (not FREEFALL's code) — for the JAYWALK chat.

Every server this pass started (the emulators, `serve.mjs --emu` on :5173) was stopped at its end; the owner's preview server on :5190 was left running.

## THE SHOTS — `Downloads\NEON\freefall-review\` (never the repo)
- `sheets\` — the REAL-SIZE contact sheets named above (one or more per MUST / SHOULD item): `first-night-1…4` · `first-day-1…4` ·
  `area-<look>-375-1…3` · `area-<look>-430-1…3` · `brk-night-skylight / -splash / -bottom` · `day-plunge` · `day-finish` · `day-roof-390` ·
  `finish-night` · `moments-night` · `end-night-375` · `match-1…3` · `cards-night` · `cards-day` · `grey-night` · `dark-hold-night` ·
  `hold-lose` · `tap-first-timer` · `deep-night-vs-day-430` · `e2e-solo` · `crop-made-day`.
- `shots\` (every area at 375 + 430, both looks; the first play) · `look\` (the suite's own review scenes, ≈ 480 files) · `probes\` ·
  `e2e\` · `e2e-match\` · `share\` (the cards from real end frames) · `logs\` (every suite's log, the sims, the probes).
- The scoring probes: the session's scratchpad `audit-rules\` (`p1-perfect` · `p2-copycat` · `p2b-copy-plus-one` · `p3-holds` ·
  `p4-endburst` · `p5-rules` · `p6-truncate`) — copied to `Downloads\NEON\freefall-review\probes-scoring\` for THE FIX PASS.
