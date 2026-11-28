# FREEFALL — THE FIX PASS, PART C: SPEED ROUND 2 + SCORING + THE TEST PAGE + THE LAST ITEMS (Nov 27 2026 · the Beelink · Opus 5.5)

The last fix pass before go-live. FREEFALL stays HIDDEN (`config.js` GAMES[].playable untouched), THE SWITCH (counting) stays OFF.
**RE-PUBLISH (rules): YES** — `database.rules.json` gained the `ff/{matchId}/{uid}/rs` leaf (N7); the file to publish:
`Downloads\NEON\database.rules.nov27-ff-fixc.json` (it also carries the earlier pending changes the ack names — F4A's `ff` node, `pt`'s
`g: 'ff'`, S8's `profiles/.read`, `pfr/.read`, the Nov 22 fix pass's `rooms/.read` + `rooms/{CODE}/.write`).

## STEP 0
`docs/games/plan.md` — "FREEFALL — THE FIX PASS, PART C": FIX C = the last fix pass; Ben's iPhone A/B (no switch helps, every hitch
"gpu"); anti-cheat ships with FREEFALL; the finish card's bursts + day vignette. THE ADD-ON INBOX: nothing open for this pass at the start,
after each group, before the final tests. THE LAB: no FIX marks (232 marks exported).

## GROUP 0 — ROOM + SPEED ROUND 2
1. **THE ROOM** — FREEFALL's own graph was **602 of 610 KB**. The long comments of its 26 cartridge files moved VERBATIM into
   `docs/freefall.md` "THE CODE NOTES" (a scanner that only touches whole-line `//` blocks ≥ 120 B and trailing `//` comments ≥ 90 chars
   OUTSIDE strings / template literals — the GLSL is never touched; every file `node --check`ed; each left a `<file>#<n>` pointer):
   **49 KB freed → 553 KB**. With everything this pass added (veil.js, the copycat, the rule-set leaf, the view's fixes): **567 KB of 610 —
   43 KB free** for go-live. Nothing raised (the boot budget untouched).
2. **TWO NEW SWITCHES** (named in the fps line like the others): `?hud=0` — every HTML layer over the canvas hidden while a run is on (the
   number, the top line, the rail, the bands, the calls, the fps line, the veil); the end card + the fps summary come back at the end ·
   `?empty=1` — THE CONTROL (`js/games/freefall/empty.js`, lazy, page-only): the same column + pixel ratio (3 on an iPhone), a plain
   spinning mesh, the same kind of loop + the SAME hitch meter as `?fps=2` (ours / busy / gpu), no game, no HTML layer — 30 s, then the
   line; a tap = again. The run summary also names its seconds now (hitches per second compare).
3. **THE COMPOSITING FIX — THE VEIL** (`veil.js`): the audit of what sat over the canvas in play found the number baked (one 2D canvas, a
   write per floor), the bands baked, every text write gated on a change, no filter / backdrop / blur in play (the pause's blur only while
   PAUSED) — and THREE FULL-SCREEN HTML LAYERS always composited over the 3D picture at the phone's 3×: the darkness (`.ff-dark` + its
   `::after` vignette, kept at opacity 0.001 since F5B so its first step costs nothing) and the shade's top fall (on for the whole run). A
   layer the size of the screen at 3× = ~12 MB read + blended every frame, whatever the canvas's own switches do — the one cost Ben's
   A/B could never move. They are now the 3D picture's LAST PASS: one full-screen triangle, the same shapes + colours + eases (shots:
   `Downloads\NEON\freefall-fixc\speed\veil\` — 18 frames, the darkness steps 3 · 2 · 1 in three areas × both looks, old vs new within
   ~1 level of brightness), never in a share frame. Plus: the hint's sweep (DRAG TO SPIN's dot) animated under the INVISIBLE foot the
   whole run — it now runs only while the foot shows.
4. **THE LINKS FOR BEN's iPHONE** — below.

## GROUP 1 — ANTI-CHEAT (server-side unless named; REPLAY = LIVE untouched)
1. **S3 THE HOLD** (`js/core/match-report.js#ffTooPerfect`, `FF_HOLD = { bestRun: 40, from: 100, rate: 0.3 }`): a judged row with a
   no-bounce run ≥ 40, or < 0.3 bounces a floor over 100+ floors → HELD: the XP is paid, the board row + THE AVERAGE + the cards are not
   written; `rejected` names it `'held'` with f · b · br (the report logs it + counts it in `results/{key}.rej`). **The sims (200 seeds a
   bot, solo + match):** sloppy · good · great · human — the best no-bounce run 12–18, the fewest bounces a floor 0.53 over 100+ floors —
   NEVER held. The scripts: MAX SPIN = 401 floors / 1 bounce / a 401 run (held) · a human's spin (68) = no-bounce runs of 76–126 (held)
   · a slow spin (40) = 0.12 bounces a floor over 105+ (held). The unit test runs 30 seeds × 4 bots × 2 modes + 18 scripts each time.
2. **S2 THE COPYCAT** (`api/_lib/freefall.js#copyScore` · `isCopy` · `COPY = { run: 30, tol: 24, min: 60, share: 0.9 }`): the server's
   replay of every on-time node yields its LANDINGS `[floor, tick, the tower's angle]` (the engine's land event now carries `a`). A copy =
   30 landings in a row alike (angle within 24 units — a ±1 jitter changes nothing) OR 90 % of the shorter run's landings (60+) at the same
   floor + tick → the node whose chunks arrived LATER on average is refused `copy` (still PLAYED through `prefixFloor`). **The review's
   probes:** `p2-copycat` (the copy 400 ms behind) — tied for first in **0 of 12** (was 12 of 12) · `p2b-copy-plus-one` (A's moves 1.5 s
   behind + one scripted landing) — ahead of A in **0 of 12** (was 12 of 12). **Honest:** 60 rooms × 8 bots on one tower (1,680 pairs —
   the "great" bots near-clones of each other): at most **17** landings in a row alike, at most **73 %** shared — none flagged.
3. **S4 A MATCH's END-BURST** (`proof.js#END_BURST_MS` 20 s): a run that ENDS inside a dropped-signal burst takes it only when its silence
   was ≤ 20 s, else it is CUT where the silence began (14 s → whole · 40 s → cut, unit-tested). A solo keeps the old rule. **S5 A HOLD's
   LONGEST** (`HOLD_MAX_MS` 10 min): a way back stamped > 10 min after the hold's wall time = no way back → CUT at the hold (no rules
   change); the phone says "NOT COUNTED PAST THE PAUSE — OVER 10 MINUTES" (the same path as an unstamped way back).
4. **N6 FLOOR 201** — `blind: [40, 120, 201]` + the moving red from 202 (the impact's ring / dust / camera kick lands the ball on it). Nothing
   recorded yet → no new rule-set row; the tower tests prove every other floor 0 … 320 unchanged on 120 towers, floor 201 red-free on 2,400.
5. **N7 THE RULE-SET LEAF** — `ff/{matchId}/{uid}/rs` (HIGH RISE's S4B rule, `hr` → `ff`): its player's, ONCE, ≤ 10 s after its GO,
   before its first chunk + its end, `^[a-z0-9-]{1,16}$`. The phone writes `classic` right behind its GO (solo + match; best effort — a
   refusal on the old rules is expected + quiet). The judge reads none as classic, refuses a set the table lacks ('rules'), and a match
   is played on THE FIRST GO's player's set (`match.js#matchRules` — the director writes `game.rs`; the server passes `rules: S.rs`).
   **A RULES CHANGE** — the ack (`tests/fixtures/rules-live.ack.json`) names it; the file to publish is above.
6. **N8** — written into docs/freefall.md (a truncated log can earn up to +5 floors, a modified client only — covered by THE HOLD).
7. **The inbox** — TO JAYWALK + HIGH RISE (each in its own chat): the same HOLD + COPYCAT (+ the end-burst and a hold's longest).

## GROUP 2 — THE SHARED END BOARD (`js/ui/end-board.js` — every game with the block on)
- **S10** — the block listens to the report queue's outcomes (`profile/queue.js#onOutcome`, lazy, once a session): a counted run whose
  answer carries a NEW BEST (`pbs`) for a board PATCHES that board's kept world list (your row at the new value, ranked again — the review: a refetch is stale behind the caches) and reads YOUR TABLE again; every block on screen showing it redraws (the
  top 3 + "YOU · 12TH · …" show the new row — no reload). A mounted block takes itself off the list when it goes.
- **S11** — when ☐ FRIENDS ONLY unticks itself it remembers '0' only when you have NO friends at all (the table now answers its friends count — the fresh-eyes review); friends with no run on that board = off for that screen only ("NO FRIENDS ON THIS BOARD YET"); the line shows only on the tap that caused it.
- The inbox — TO THE CITY CHAT: S10 + S11 are fixed here; its next end-board pass keeps them.

## GROUP 3 — THE TEST PAGE (/freefall-play only; the cartridge path untouched)
1. **THE BOT MATCH** (`botmatch.js` — lazy, page-only; `?mode=match&rivals=N`, N ≤ 7 = MATCH_MAX − 1): driven through the SAME stage
   hands the cartridge's match view uses (count · adopt · setGhosts · feedGhost · watch · the watch line · the OUT card): the real
   3 · 2 · 1 + the names BEFORE any drag (from the stage's warm frame — a cold load never eats it), the bots from GO, my out → the OUT
   card → WATCH THE LEADER (a tap = the next; "WATCHING CHARLIE · 20 / TAP FOR THE NEXT"), everyone down → THE RESULTS ("YOU CAME 2ND"
   · every place + floors, YOU marked) + REMATCH (a new round, a new seed, the count again; no solo PLAY AGAIN). The results card uses
   the podium's own `is-final` (the HUD's lines put away under it).
2. **`?spectate=1`** (with `mode=match&rivals=N`): no ball of my own — the stage adopts as a WATCHER (as a real spectator), follows the
   leader from GO; a tap switches; the ghosts, the tags, THE DEPTH RAIL + names, the outs, THE LIGHTS GO OUT, THE BLAZE, the breakthroughs
   are the watched run's own (the stage's watch replays that player's log exactly — the real spectator view, not an echo); "YOU WATCHED"
   + REMATCH.
   The OLD bot room (the drag starts it, `&watch=1`, `&simshift=`) stays as **`&room=1`** — every look / speed rig in the E2E names it.
3. **HOW TO PLAY** — a ☰ top-left (36 pt, a 44 pt tap) on the opening, the pause + the end card → the ONE opener
   (`ui/help-open.js`), FREEFALL's tab ALONE (`openHelp('freefall', { only: true })` — the page never shows HOLD'EM's tab, whose rankings
   button is the help chunk's one lazy import into the console; the page's "nothing counts" graph test names that exception). N5: "A MATCH
   never pauses." in the rules list.
4. **N12** — the page's SHARE acts on a real `click` (`clickPress`), so iOS's share sheet always has its user activation.
5. **lab.js** — its document key listeners are kept and removed in `stop()`.

## GROUP 4 — THE FINISH SHARE CARD (`card.js#BURSTS`, THE BOTTOM's gold card only)
Three big neon bursts (18 rays, a spark at each tip, a hot heart, a soft dark ground behind each so the colour never washes to white) —
**gold + cyan by night, gold + teal by day** — top right + the two sides at the ball's height, clear of the cause's tab and the floors;
by DAY a dark navy vignette round the ball (the card is never milky). Fixed shapes (the same run = the same card). Three refine passes at
360 px (`Downloads\NEON\freefall-fixc\cards\v1 … v4`, `v3\beside-fixb.png` = FIX B's beside this pass's). The other cards (red · dark ·
match · zero, both looks) are unchanged (`v4\others.png`). A SOLO run never ends at THE BOTTOM (solo is endless) — the gold card is the
match's (and the daily's, later).

## GROUP 5 — SMALL ITEMS
- **N1** Call the Winner: the picks = the players still falling with an ON-TIME GO and news (never a no-show, never a lost phone); no sheet
  once less than 4 s of the judge's window is left (after a long lock the call could never count).
- **N2** NO SHARE on a misleading podium — the contract's new optional `shareOk(game, me)` (ui/final.js asks it); FREEFALL's: false on an
  unproven match or a refused row (a late / no GO = "missed the start", a copy, a bad log).
- **N4** the credits: audio/freefall/CREDITS.md + FREEFALL's own row in the Credits sheet name JAYWALK's NEW BEST (CC BY 4.0,
  TommasoMotteran); "all CC0" now says "its own files"; `roof/grain.webp` (made in code) is in assets/freefall/CREDITS.md.
- **N10** after a refresh: the "YOUR CALL · MIA" line is rebuilt from the mirrored call; the OUT card is not shown again; "the podium
  waited on a live run" is kept in the tab's session (`ff:lw:<code>:<match>`).
- **N15 + the doc drift** (docs/freefall.md): the ranking with the blazes · the empty log ends at tick 540 · the daily's pause DECIDED
  (Ben, Nov 26: allowed, 3 a run — switched on by the DAILY pass; `MODES.daily.holds` 0 until then) · the match's grace = END_GRACE_MS 9 s ·
  the darkness exactly 6 s through floor 101 · the edge markers → the rail's names.

## THE FRESH-EYES REVIEW (a separate reviewer: the Group 1 + Group 2 diffs read cold, the shots judged at phone size; read only)
**FIXED (commit de254613):**
- **MUST 1 — S11 wiped FRIENDS ONLY for every game:** the table drops friends with no row on THAT board, so "nobody but you" also meant
  "your friends haven't played this game yet" — and the '0' is shared by all five games. Now `boardTable` answers `friends` (the count
  it looked at): '0' is remembered only with NO friends at all; otherwise off for this screen only, "NO FRIENDS ON THIS BOARD YET".
- **MUST 2 — S10's re-read came back stale** (the board fetch's 12 s cache, the browser's 10 s, the edge's 20 s + 60 s SWR). Now the
  kept world list is PATCHED in place (`end-board.js#patchMine` — your row at the new value, ranked again, a tie shares its place;
  unit-tested); YOUR TABLE (a POST, uncached) is read again. A best that enters the top 100 for the first time shows at the next
  session's read (named).
- **MUST 3 — THE COPYCAT's "later" could be gamed** (a mean over chunks — a copier recuts its own). Now per shared landing (`laterOf`:
  the arrival of each node's first chunk reaching the landing's tick, the median difference); the review's scenario (an honest leader
  whose last 20 chunks came in a 5 s burst) is a test — the leader is never the one refused.
- **SHOULD 4 — S4 could cut an honest lock's tail** (moves made just before iOS suspends arrive > 20 s later). Now the cut is at the
  first move PLAYED during the silence (past its start + 8 s of play); the pre-lock tail is kept (a test for both).
- **SHOULD 5 — a HELD row still credited the wins board + `sv`.** Now: no `c.w`, no `sv` (my call: the room's own podium + night
  points stand — the hold is about the boards).
- **SHOULD 7 — the phone vs the judge on the 10-min hold:** the phone says "OVER 10 MINUTES" 30 s early.
- **LOOKS:** the finish card — a crisp GOLD RING round the ball (there was none to see), the day vignette closes in round the ball (the
  pale band through its row), the top-right burst moved inside the frame (it was clipped) — `cards\v5\beside-fixb.png`; the page's note
  hidden under the WATCHING line (they overlapped); HOME centred under REMATCH; "YOU · YOU" was already fixed (an older shot).
**NOT TAKEN (named):** SHOULD 6 — N7's rule set comes from THE FIRST GO's player (HIGH RISE's own rule, which this mirrors); with only
"classic" it can not bite — a second rule set should come from the host's settings: OPEN FOR BEN / the next tuning pass. NICE — an outcome
landing before the block's lazy listener resolves is missed (the next end screen reads it) · N6 edits "classic" in place (nothing was
recorded; phones on two deploys could disagree at floors 201–202 for one deploy) · the grey dust next to the bursts is the 3D frame's own.
**CLEAN (the reviewer):** an idle start can never trip COPY (≤ 15 landings) · COPY's limits sit above the sims' maxima · nodes with no
`rs` judge as classic · S5's break cuts (never refuses) · the end-burst on the host's live podium only flickers mid-match · S10's one
listener + each mount's clean-up · S11 never writes on a slow / failed read.

## SPEED (the Beelink, headless Chromium + ANGLE d3d11, 390 × 844; "4×" = CDP's CPU throttle) — NOTHING GOT SLOWER
| what | FIX C | FIX B |
| --- | --- | --- |
| `--perf` (68 rows: areas · tiers · 1× + 4× · both looks · the water · each breakthrough) | 67 / 68 — 56.2–60.2 fps, p95 ≤ 17.4 ms; the red = ONE 250 ms frame (day · THE SPEAKEASY · tier 1 · 4×) | 67 / 68 — 56.3–60.3 fps, p95 ≤ 17.2 ms; the same kind of red |
| `--perf8` (8 ghosts + tags, 24 rows) | 23 / 24 — 55.6–60.1 fps, p95 ≤ 17.1 ms; the red the same single 250 ms frame | 23 / 24 |
| `--stutters` (the roof to the trench, 4×) | day **HITCH 0**, worst 17.0 ms · night HITCH 1 (the 250 ms frame @128) | day 0 · night 1 (@128) |
| `?empty=1` (the control, headless) | 1,801 frames in 30 s, **HITCH 0**, worst 18 ms, our work 0.11 ms a frame | — |
The single 250 ms frame is this machine's known headless stall (FIX A + FIX B, the same spots); THE VEIL's own pass costs nothing
measurable here — the compositing it saves is a phone's (the Beelink composites in ANGLE, not Safari's layer tree): Ben's links decide.

## THE TESTS (local — this pass's own fresh emulators + `serve.mjs --emu` (restarted after every /api change), one suite at a time)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **2,858 / 2,858** (new: `tests/freefall-fixc.test.mjs` — 12 tests: the hold on the sims + the scripts, the copycat on the probes + honest rooms + the leader's late burst, the end-burst + an honest lock's tail, a hold's longest, `rs`, the held match row, the test page, the card, Group 5; `end-board.test.mjs` + S10's `patchMine`) |
| smoke | **28 / 28** (the pages load in Chromium + WebKit) |
| the test page `freefall-play.mjs` | **199 / 199** — after the haze + the frame-bar checks were pointed at the 3D picture alone (`&hud=0`: THE VEIL draws the darkness IN the canvas now, and those checks stand the ball still while the darkness creeps); `--f4a` 19 / 19 (one timing flake on the first rerun, green on the next) · `--f4b` 17 / 17 · **`--fixc` 26 / 26** (`?hud=0`, `?empty=1`, the bot match, spectate, REMATCH) |
| the share cards `freefall-share.mjs` | **255 / 255** (the page's SHARE by a real click) |
| `e2e-freefall` (FAST) · `e2e-freefall-match --fast` | **65 / 65 · 120 / 120** |
| every other game (the shared end board, final.js, /api, the rules changed) | e2e-jaywalk **123 / 123** · e2e-highrise **107 / 107** (the 0-friends case now expects S11's quiet untick) · e2e-highrise-match **35 / 35** · e2e-prism **68 / 68** · e2e-oc-2 **27 / 27** · e2e-holdem **24 / 24** · e2e-play-bounce **30 / 30** · e2e-profiles **148 / 148** · e2e-jaywalk-match **94 / 96** — the 2 reds = section 8c ("no outcome" → the cards + YOUR BEST ANYWHERE), ALREADY RED before this pass (THE END-BOARD SWITCH-ON proved it on a worktree of 72a9c8be) |
| rules `rules.test.mjs` | **102 / 107** — FREEFALL's new `rs` case green; the 5 reds = F5C's exact five time-bound JAYWALK / HIGH RISE proof-node cases (no JAYWALK / HIGH RISE rule touched) |
| /api `server.test.mjs` | **76 / 78** — F5C's same two (JAYWALK H6A's report + THE PROOF PASS's counted solo plays — time-bound, untouched) |
| speed | above — nothing slower |
THE HARBOR suite: not run locally (THE LOCAL TESTING RULE — the cloud runs it on the tagged push); the city files this pass touched: `js/ui/help.js` / `help-open.js` (an optional `only`), `js/ui/credits.js` (FREEFALL's row), `js/ui/final.js` (`shareOk`), `js/ui/end-board.js`.

## THE LINKS FOR BEN's iPHONE SPEED TEST (in order — ~30 s each, a screenshot of each result)
1. https://neonspeakeasy.com/freefall-play?fps=2 — the game WITH this pass's compositing fix (compare: FIX B's baseline 31 hitches / 94 floors)
2. https://neonspeakeasy.com/freefall-play?fps=2&hud=0 — the same with NO HTML layer over the canvas during the run
3. https://neonspeakeasy.com/freefall-play?fps=2&empty=1 — THE CONTROL: no game, a plain spinning shape, the same meter (30 s by itself)
**How to read them:** if 3 (empty) hitches at about the same rate as 1, it is **iPhone Safari's own frame pacing** — nothing in our
picture or our page; then FIX B's smoothing (the tower drawn ahead to the frame's time) is the answer, and the go-live ships as it is. If
1 is clearly better than FIX B's 31 / 94, the compositing fix (THE VEIL) was the cause. If 2 is clearly better than 1, the HTML that
remains over the canvas costs (the next step: bake more of the HUD into the canvas).

## THE CALLS I MADE (named — yours to overrule)
1. **THE VEIL** — the darkness + the shade moved INTO the canvas (the prompt asked for "drawn once / static"; they were already static —
   the cost was three full-screen layers composited at 3× every frame, so they left the compositor). Same look (the shots).
2. **THE HOLD's numbers** — a no-bounce run ≥ 40 or < 0.3 bounces a floor over 100+ floors (2.2× the best honest run of 18; 0.53 the
   lowest honest rate). A held run: XP paid, no board row / average / cards / wins-board win / `sv`; the room's podium stands.
3. **THE HOLD's /admin side** — the held row is named in the report's `rejected` ('held', with its floors + bounces + best run), logged
   and counted in `results/{key}.rej` — **no /admin list or RELEASE button yet** (nothing is held until THE SWITCH is on): OPEN FOR BEN 3.
4. **THE COPYCAT's numbers** — 30 in a row (angle within 24 units) or 90 % of 60+ (honest sims: 17 · 73 %).
5. **The test page's old bot room** → `&room=1` (every look / speed rig in the E2E names it); `?mode=match&rivals=N` is the new bot match.
6. **The page's ☰** shows FREEFALL's tab alone (the help sheet's `only` option — the shared opener's one new argument).
7. **N2** — `shareOk(game, me)`: a new OPTIONAL contract export (docs/cartridge.md) — only FREEFALL uses it.
8. **S10** — patch, don't refetch; a first-time top-100 entry shows at the next session's read.
9. **The finish card** — the celebration is drawn on the card (2D), not staged in the 3D frame: fixed, never missing, readable at 360.

## OPEN FOR BEN
0. **THE PASS's TESTS ran against this pass's own servers, all STOPPED at the end** (the emulators + `serve.mjs --emu`; your preview
   server on :5190 untouched).
1. **RE-PUBLISH: YES** — `Downloads\NEON\database.rules.nov27-ff-fixc.json` in the Firebase console (Realtime Database → Rules → paste →
   Publish). New: the `ff/{matchId}/{uid}/rs` leaf. Still pending from earlier (the same file carries them): F4A's `ff` node, `pt`'s
   `g: 'ff'`, S8's `profiles/.read`, `pfr/.read`, the Nov 22 fix pass's `rooms/.read` + `rooms/{CODE}/.write`. Nothing breaks on the old
   rules (the `rs` write is refused quietly; the judge reads none as classic). After publishing: copy database.rules.json over
   tests/fixtures/rules-live.json and delete the ack.
2. **YOUR iPHONE SPEED TEST** — the three links above, ~30 s each, a screenshot of each result. The verdict rule is written there.
3. **THE HOLD's /admin queue** — held runs are named + logged, but /admin has no HELD list or RELEASE button yet (it can only matter after
   THE SWITCH): build it at go-live, or keep "held = no board row" as the whole rule?
4. **THE RULE SET's owner (N7, latent)** — today the first GO's player names the match's set (HIGH RISE's rule); with a second set it
   should come from the host's settings. Only "classic" exists — for the next tuning pass.
5. **YOUR PHONE CHECKS on /freefall-play:** `?mode=match&rivals=3` (the count, WATCH, THE RESULTS, REMATCH) · `&spectate=1` · ☰ →
   HOW TO PLAY · a finish (`?mode=match&floor=196&rivals=3`) → SHARE → the new gold card both looks · SHARE opens the share sheet on iOS.
6. **The inbox:** TO JAYWALK + HIGH RISE (THE HOLD + THE COPYCAT for their own passes) · TO THE CITY CHAT (S10 + S11 are fixed in the
   shared end board).
