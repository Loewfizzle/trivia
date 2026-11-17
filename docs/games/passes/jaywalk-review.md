# JAYWALK — THE GO-LIVE REVIEW (Nov 17 2026)

The owner: JAYWALK is FEATURE-COMPLETE after H6B. This pass proves it READY TO GO LIVE — premium with no weak points, rock-solid,
fair, light — fixes what isn't, and writes the exact go-live checklist (`docs/games/passes/jaywalk-golive-checklist.md`). It does
NOT flip `playable`. Every fix is a VIEW / SOUND / STABILITY fix unless the audit found a real rules or server bug (named below).
The decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 17 — DECIDED, THE GO-LIVE REVIEW)". What changed in the game:
`docs/jaywalk.md` "THE GO-LIVE REVIEW".

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| STEP 0 | `02641ab0` | the owner's decisions into `docs/games/plan.md` |
| 0 — THE START | (no change) | `node scripts/lab-export.mjs <live>`: 224 marks, **no open FIX**. The cloud result of `a6f885e2`: `tests` green, `harbor` skipped (a ci tag) — nothing red |
| 1 — THE AUDIT | — | ONE fresh read-only auditor (it built nothing): its report VERBATIM below |
| 2 — THE KNOWN FIXES | `421ff9a3` + `ec1ae793` | the Blackbird's day tell · the fog's banding · the first look switch's long frame · the lane count + the chips against the landmarks · Grok's two night touch-ups · the size budget kept |
| 3 — FIX THE AUDIT | see "… and what was done with each finding" | every real finding fixed; the second fresh reviewer's report VERBATIM below |
| 4 — THE CHECKLIST | `ec1ae793` (+ the close) | `docs/games/passes/jaywalk-golive-checklist.md` |
| 5 — THE CHECKS + THE CLOSE | the tagged push | below |

## GROUP 2 — THE KNOWN FIXES (the detail: `docs/jaywalk.md` "THE GO-LIVE REVIEW")
| the item | what was found | what was done | measured / shot |
| --- | --- | --- | --- |
| THE BLACKBIRD's DAY TELL | white-hot lamps + a yellow band on a light-grey runway: low contrast | red / amber signal lamps on dark backings, wig-wagging 3 a second off the rules' tick (steady under reduce motion); the whole lane = amber-on-dark hazard chevrons inside the tell's first sixth; the racing band near-black + yellow-white; a solid edge flare. The tell's length untouched | `jaywalk-review\blackbird\day-1-the-tell.png` · `day-2-the-glint.png` (before: `jaywalk-h6b\blackbird\`) |
| THE FOG BANK's banded streaks | NOT a gradient's steps: (1) every camera-facing puff was CUT by the ground it leans into — a hard horizontal line across each; (2) the bank's body ended in one ruler-straight edge; (3) the ground's mottle met the plain fog in a line | the glow's shape 10 (a puff fades INTO the ground, dithered) · a soft LIP on the body's edge · the mottle fades out before the plain fog | `jaywalk-review\h5c\fog\day-*.png` — contrast-boosted crops show no edge left |
| THE FIRST LOOK SWITCH's ≈ 130 ms frame | NOT the 3D scene: bisected to the sea wall's DAY stone (two sized repeating gradients) painted for the first time — ≈ 120 ms under a 4× CPU throttle | the stone = ONE small SVG tile · the other look's sky map + programs warmed in the start's hidden frame | the first night → day switch: **150 ms → 33 ms** worst (every other frame 16.8); the perf kit fails a switch frame over 70 ms |
| THE DAY BRIDGE behind the match chips | the chips' column = 86 × 111 pt (8 players); the bridge is painted over the picture's left 38 %, the band has ± 17 % of room | in a MATCH the bridge + the lighthouse are pinned as far right as the picture goes (`SKY_MATCH_PIN`): the lighthouse (both looks) + the night bridge stand clear; **the day bridge's left tower cannot** (OPEN FOR BEN) | `jaywalk-review\chips\*.png` |
| THE 3-DIGIT LANE COUNT near three landmarks | measured: at 76 px a 3-digit count is 166 pt wide — FIVE day + FOUR night landmarks stood in it (not three); no offset clears them without cutting the landmark | the count steps down a size (60 px from 100 lanes, 44 px from 1,000 — measured: 888 stands at x 129–261 of 390) + `SKY_MAX`: the band's slide stops where the count would meet the landmark; the rest offsets re-measured | `jaywalk-review\sky\*-top.png` (all 16) |
| THE TWO DARK NIGHT TOWERS | Grok's own touch-ups were in the folder (12:04–12:05 pm; the inbox's 12:10 pm entry) before the code lift was started | re-encoded through the asset builder (2 webps; the other 16 byte-identical; the masked lights unchanged) — **no code lift built** | `jaywalk-review\sky\night-3-rail-yard*.png` · `night-8-airfield*.png` |
| THE SIZE BUDGET (found by the unit suite) | the fixes put JAYWALK 5.6 KB OVER its 2,450 KB line (it stood 1 KB under) | 14,042 B of pass-history comments cut from `night.js` (a subagent; every code line identical — checked line by line) — the line NOT raised | **2,442 of 2,450 KB** |

## GROUP 1 — THE AUDIT (ONE fresh read-only auditor: it built nothing, it was given THE GOAL + `docs/jaywalk.md` + the repo at `02641ab0` + H6B's shot set; the six known items of Group 2 were named to it as already in hand) — its report, VERBATIM

> # JAYWALK — THE GO-LIVE AUDIT (commit 02641ab0, read-only)
>
> ## VERDICT
>
> **NOT READY — two small fixes away on the rules side.** The phone's own recorder can write a hop log that the judge refuses whole, in two honest situations. A tap in the Mothership's own tick voids the finisher's entire run (#1), and a one-second multi-finger mash voids any run (#2). In both, the host's podium and the server show 0 lanes for a player who did nothing wrong. Next in line: the Mothership's hum, rumble and music duck stay on through the podium (#3), and a lost WebGL context is never noticed (#4). Everything else is medium or lower. The engine, the replay, the course's fairness and the server's count held up under every probe I ran.
>
> All line numbers are at 02641ab0. My scripts are in the session's scratch folder (`…\scratchpad\audit\`). Nothing in the repo was touched.
>
> ## FINDINGS (most severe first)
>
> 1. **BLOCKER · areas 1 / 2 · a tap in the Mothership's tick voids the whole run.**
>    - **Evidence:** `view.js:241` logs a queued input at `run.t` whenever `engine.js:170 canLog` allows it, including at `run.t === cap`. `engine.js:80` lifts the kid at that tick without playing the input. `replay.js:44` refuses any entry with `t >= cap` ("past the cap"), and `logic.js:79` then scores the run as a kid who never hopped.
>    - **Reproduced** (`cap3.mjs`): a real 2,437-hop run to the Mothership judges as `l: 2043, w: 'taken', f: 'boom ufo airfield mothership'`. With one more entry at `t = cap` (which `canLog` allows) it judges as `l: 0, bad: 'past the cap'`, and `jaywalkMatch` gives the win to a 1-lane player.
>    - **How often** (`cap.mjs`): 317 of 4,000 simulated finishers tapping 4–6 times a second, about 8 %.
>    - **Why it matters:** the best player in the room loses the match, the BEAM ME UP card and their best, at the game's reward moment.
>    - **Fix (VIEW + a tolerant judge):** `hop()` / `tick()` never log at `run.t >= cap` (give `canLog` the mode's cap); have `logProblem` or `judgeRun` drop a trailing entry at or past the cap instead of refusing; add a unit test that drives the phone's loop through the cap.
>
> 2. **HIGH · areas 1 / 2 · a fast mash voids the whole run.**
>    - **Evidence:** `replay.js:45` refuses more than 20 inputs in any 60 ticks ("too fast"). The recorder only enforces the 2-tick gap (`engine.js:170`), so `view.js:234–241` can log 30 a second. `docs/jaywalk.md:144` and `tests/jaywalk-server.test.mjs:68` claim the recorder never makes a refused log; the test checks the gap only.
>    - **Reproduced** (`mash2.mjs`, the phone's loop with a 70-tick mash mid-run): 0 of 43 runs refused at 16 taps a second, 13 of 43 at 20, 43 of 43 at 21 and above. A match row came back `l: 0, bad: 'too fast'` where the phone showed 39 lanes.
>    - **Why it matters:** 21 taps a second is two thumbs at about 10.5 Hz each, a child drumming three fingers, or several keys on desktop. Ignored inputs still count, because they are logged.
>    - **Fix (VIEW):** `canLog` enforces `MAX_INPUTS_PER_SEC` too, dropping the input unlogged and unplayed. Better still, do not log an input the engine will ignore (already buffered).
>
> 3. **HIGH · areas 3 / 5 (sound) · the Mothership's hum, rumble and music duck stay on through the podium.**
>    - **Evidence:** `flyers.js:610` — `quiet()` stops the ship loops only when `!ship.on`, and `ship.on` is true from the warning's first frame (`:525`). `view.js:557` — `showFinal` calls `night.rest(true)`; `night.js:522` then returns from `draw`, so `shipAt` (`flyers.js:557–561`) never runs again and the gains freeze. `duckNow` freezes too.
>    - **Path A:** the last players go out during the 10 s warning. The podium arrives 850 ms later with the hum at its warning level and the music held down.
>    - **Path B:** a player already out and watching at 6:00. The lifted kids write `e` at once, the host ends the match (`director.js:67`), and the watcher's podium covers the arrival within about a second, with the hum at full and the music at 0.3. The watcher also never sees the lift.
>    - It lasts until the view unmounts. Read from the code, not heard; it needs a match that reaches 5:50.
>    - **Fix (SOUND / VIEW):** `flyers.rest(true)` and `quiet()` fade the ship loops unconditionally and reset the duck; `showFinal` / `showLocalEnd` call `quiet()`; a watcher's podium waits out the arrival's hold.
>
> 4. **HIGH · area 3 · no WebGL context-loss handling.**
>    - **Evidence:** no `webglcontextlost` or `webglcontextrestored` listener anywhere in `js/games/jaywalk` (grep at the commit returns nothing).
>    - **Why it matters:** if iOS drops the context (an app switch under memory pressure), the playfield goes blank while the HUD, the sounds and the engine carry on, since the run is on the server's clock (`view.js:475–481`). The kid dies unseen and nothing is reported. Whether a restored context draws correctly again was not tested; the subagent's reading is that the environment maps and the ship's bake would not be rebuilt.
>    - **Fix (STABILITY):** on loss, flag it, report it to `/admin` and show a line; on restore, rebuild the environment maps, warm and re-bake; if not restored in about 1.5 s, destroy and recreate the scene.
>
> 5. **MEDIUM · area 2 (storage) · the run's share card is uploaded without a tap.**
>    - **Evidence:** `share.js:153–171` uploads 1.5 s after every counted end screen. The three cards in the shot set are 262–264 KB, stored as base64 (about 350 KB) in `shr/{code}`, one slot per player per day, kept 7 days (`share-card.js:28, 34`).
>    - **Arithmetic:** about 2.4 MB per daily player per week, so roughly 400 daily JAYWALK players fills Spark's 1 GB.
>    - **Function calls:** each changed picture is a 350 KB POST, with up to 4 tries. After the 12-a-day cap the server answers 429, and I found nothing on the phone that remembers the cap, so later runs appear to keep POSTing (read, not run).
>    - **Fix (owner's cost call):** upload at the first press of SHARE, or shrink the link picture to about 60 KB, or keep run cards 2 days; remember the 429 for the day.
>
> 6. **MEDIUM · areas 3 / 4 · every hop in a match re-exports every player's whole log on every phone.**
>    - **Evidence:** `room.js:373–377` listens with `onValue` on `rooms/{CODE}/jw/{matchId}` and calls `s.val()` on the full tree, then `setState`. A match flushes within 120 ms of each hop.
>    - **Why it matters:** with 8 players at 3 hops a second, that is about 24 full-tree exports a second, over a tree that grows to thousands of chunk objects by minute 4–6. The cost and the garbage grow through the match. This is an estimate from the code, not measured; the 3- and 4-phone bot matches would not show it.
>    - **Fix (STABILITY):** listen per player with child-added on `c`, or append to each ghost from the child events and skip the whole-tree export.
>
> 7. **MEDIUM · area 2 · the host can delete a live match's proof tree.**
>    - **Evidence:** `database.rules.json:699–701` lets the host delete `jw` or `jw/{match}` at any time.
>    - **Consequence (read from the rules and the code, not run on the emulators):** a host on a modified client deletes the tree mid-match and writes a new `go`. `startOf` moves every phone to a new course. The honest phones keep `haveGo` true (`view.js:182–187`) and never rewrite their `go`, so the server scores them `bad: 'no go'` (`api/_lib/jaywalk.js:73`) while they still count as players, and the host wins a counted match. In solo the same delete lets a player re-roll the course after seeing it.
>    - **Fix (a RULES change, so THE RULES-LAG applies):** refuse the delete while `game/matchId === $match` and the phase is `count` or `play`. The phones should also rewrite `go` when their node has none.
>
> 8. **MEDIUM · area 2 · a run whose report is delayed can be lost for good.**
>    - **Evidence:** PLAY AGAIN keeps only the last 4 runs' proofs (`again.js:16, 49`), and BACK TO THE CITY deletes the solo room (`room.js:177–180`). The report is counted only from the proof node (`api/report.js:228–231`).
>    - **Why it matters:** if `/api` is slow or down when a best run ends, five more runs or leaving the room makes that run unverifiable. Read from the code, not run. The in-memory `recent` list also resets on a reload, so older proofs then stay until the room goes — bounded, not a leak.
>    - **Fix (STABILITY):** do not prune a proof, or close the solo room, while that match's report is still queued.
>
> 9. **MEDIUM · area 4 · the quality tier is measured while nothing is drawn.**
>    - **Evidence:** `view.js:523` samples and ticks the tiers every frame, including behind the end screen and while waiting for GO. `kit/tiers.js:45–47` steps up after 8 good seconds, and `view.js:124` saves it for 14 days.
>    - **Why it matters:** each PLAY AGAIN is a fresh mount, so a phone remembered at a lower tier climbs behind the end screen, starts the next run too high, stalls and steps down again, every run.
>    - **Fix (VIEW):** sample only while the run is drawn.
>
> 10. **MEDIUM · area 4 · about 15 MB of decoded audio is never released.**
>     - **Evidence:** module-level buffer maps in `sfx.js:30–31` and `flyers.js:70–79`, cleared nowhere. The subagent computed the size from the files' headers: `ufo-hum.mp3` alone is 33 s, about 6 MB decoded.
>     - **Why it matters:** it sits outside the 20 MB final-screen budget, on the screen where the iPhone kill was logged, and stays in the city afterwards.
>     - **Fix (SOUND):** drop the decoded buffers on a non-parked unmount; cut the hum to a short seamless loop.
>
> 11. **MEDIUM · area 5 (sound) · the Mothership's rumble is not in the mix table and is likely hot.**
>     - **Evidence:** `flyers.js:112–118, 560` — noise × 3.2 through an 85 Hz low-pass at gain 0.5, sent straight to the SFX bus, past `sfx.js`'s limiter.
>     - The subagent's offline recomputation gives peaks of +3.6 to +5.9 dBFS at the bus. That is not a browser measurement.
>     - **Why it matters:** inaudible on a phone speaker, very loud on headphones, and it pumps the shared compressor.
>     - **Fix (SOUND):** scale it down, add it to `jaywalk-mix.mjs`.
>
> 12. **MEDIUM · area 5 (look) · your kid can vanish against traffic of its own colour.**
>     - **Shots:** `gates/day-6-canal-d-3-lanes-out.png` (a cyan kid against two cyan vans; I looked at this one), `e2e-match4/ghosts-3-two-seconds-in.png`, `sky/night-8-airfield.png` (a train or truck cab hides the kid from the chest down, ring included).
>     - **Fix (VIEW):** never draw a vehicle in the viewer's own colour, or give your own kid a white rim and a marker drawn after the vehicles.
>
> 13. **MEDIUM · area 6 · HOW TO PLAY is wrong by day and silent on four ways to go out.**
>     - **Evidence:** `help.js:11` says "Hop across the night harbor"; `:22` says "THE LIGHTS go out behind you" (by day it is the fog, and the end line is LOST IN THE FOG).
>     - **Missing:** the Blackbird's runway, the UFO's green ring, a log carrying you off the edge, the match rules (farthest wins, the Mothership at 6:00), the desktop keys.
>     - **Fix:** rewrite before `RULES` moves into `ui/help.js`.
>
> 14. **MEDIUM · area 6 · the game takes its camera from the public lab page's settings.**
>     - **Evidence:** `view.js:71, 118` read ZOOM and ANGLE from `jw:lab:*` (`lab-prefs.js:3`); `sfx.js:23` reads the A / B sound takes the same way. `/jaywalk-lab` is open to anyone.
>     - **Why it matters:** a player who sets ZOOM 9 there plays counted runs with a wider view — a hidden setting on a ranked board.
>     - **Fix (owner call):** pin the game to the defaults at go-live, or make it a real setting.
>
> 15. **MEDIUM · area 6 · go-live steps nothing tests.**
>     - THE BOARD has no JAYWALK tab (`js/board/view.js:50`, five tabs), and `tests/registration.test.mjs` does not check for one.
>     - The four cards' art is not approved in THE LAB. `e2e-match/h6a-reveal-3-the-cards.png` shows three near-black swatches at the reward moment — the site's palette rule, but it reads as a failed image.
>     - No tile art; `preview: true`; the tests pinned to "not playable"; the billboard's open day.
>
> 16. **MEDIUM · area 6 · three CC BY credit lines lack the licence link.**
>     - **Evidence:** `js/ui/credits.js:127` (the bell, CC BY 3.0), `:128` (the train horn, CC BY 4.0), `:133` (the two saucers, CC BY 3.0). Title, author, source and licence name are there; the other CC BY lines carry the link.
>     - `:133` also says "landing legs removed" for both saucers; only the UFO's were cut.
>     - **Fix:** add the URLs and update `tests/jaywalk-h6b.test.mjs:126–135`.
>
> 17. **LOW–MEDIUM · area 4 · on a muted phone every sound call adds a listener that is never removed.**
>     - **Evidence:** `sfx.js:80` → `engine.js:325–326` (`onUnlock` adds to a Set with no removal). Hundreds a run.
>     - **Fix (SOUND):** return early when muted.
>
> 18. **LOW–MEDIUM · area 4 · forced layout reads inside the frame.**
>     - **Evidence:** `void el.offsetWidth` at `view.js:528` (every new best lane), `:249`, `:283`, `:404`. The project rule forbids layout reads in a frame loop.
>     - **Fix (VIEW):** restart the animations with the Web Animations API.
>
> 19. **LOW–MEDIUM · area 4 · steady per-frame work in the scene.**
>     - Every instanced kind re-uploads its whole buffers each frame, used or not (`night.js:109, 996–997`).
>     - Several hundred small arrays, closures and strings a frame in `night.draw`; `drawOrder` maps, sorts and joins every frame (`view.js:378–383`).
>     - The frame loop runs at full rate behind the end screen.
>     - Read, not measured.
>
> 20. **LOW · area 5 · the match chips.**
>     - `css/jaywalk.css:214`: 10 px names, the only game text under 11 px.
>     - A 7-letter name is cut ("CHARL…") as soon as the count has two digits (`chips/day-docks-8-players-top.png`).
>     - By day, white and grey-struck names sit on the pale sky with only their shadow.
>
> 21. **LOW · area 5 · Call the Winner and the watch line.**
>     - The call card is see-through over traffic and covers the kid being watched (`e2e-match/match-out-call.png`).
>     - "1 LANES" (`view.js:457`).
>     - A refused call toasts the raw database error (`kit/call.js:49`).
>     - The watch line wraps with an orphan (`e2e-match/match-spectate.png`).
>
> 22. **LOW · area 4 · smaller holds.**
>     - The 1080 px run picture outlives the game (`shot.js:3–5`; never cleared in `reset()` or on unmount).
>     - The Mothership's bake is a large transient (a 4× MSAA 1408 × 768 target plus a synchronous readback), repeated on every wake and look switch (`flyers.js:458–475`).
>     - The hidden skyline layer keeps its previous picture (`night.js:348, 363`).
>
> 23. **LOW · area 5 (sound) · click risks.**
>     - The flyers' one-shots start mid-file at full gain with no fade-in (`flyers.js:96, 100`).
>     - `stopAll` and a dropped voice hard-stop sounds (`sfx.js:100, 108`).
>     - The train bell is not a registered bed, so it can sound for a moment on return from a hidden page.
>
> 24. **LOW · area 5 · something worse about the known fog (b).** Things the fog swallows show as bright pastel cut-outs, brighter than the fog (`e2e-match/match-spectate.png`, `match-out-call.png`). In `smoke/smoke-jaywalk.png` the bottom quarter is a flat pale rectangle with a hard edge.
>
> 25. **LOW · area 6 · the docs and the code disagree in about a dozen places.**
>     - `docs/jaywalk.md:174, 1046` say `LOOKS ['night']`; `meta.js:12` has both.
>     - `:745–758` hold stale Blackbird / UFO numbers (the doc's own later section supersedes them).
>     - `:347` names a `landmark` sound that does not exist (the code plays `area-arrive`).
>     - `:967` says 13 credit lines; there are 12.
>     - `:1139` gives the wrong sound counts and sizes.
>     - `:1180` says the `-b` takes leave with H6; three still ship.
>     - Shipped and unused: `crate-box.glb`, `traffic-barrier.glb`, the three `-b` sounds.
>
> 26. **LOW · area 2 · `results/{CODE}_{matchId}` is never pruned.** One record per counted run, forever (`js/core/board-fill.js:2` says so). This is site-wide, but solo PLAY AGAIN is its fastest writer. I did not check whether the daily ceiling stops the record being written.
>
> 27. **NIT**
>     - The end-of-round sheet's CONTINUE button and level bar are capsules (the console's, not JAYWALK's; there are none in JAYWALK's own HUD).
>     - A solo run past 10,000 chunks (about 2.8 hours) stops being proven.
>     - Dead `.jw-stub` CSS (`css/jaywalk.css:4–8`).
>
> ## CHECKED AND FOUND SOUND
>
> - **The unit tests:** `node --test tests/jaywalk-*.test.mjs` — 148 of 149 pass. The one failure (`tests/jaywalk-day.test.mjs:71`) is against the other engineer's uncommitted `night-fx.js` edit (the Blackbird's day tell), not this commit.
> - **No stretch a perfect player cannot pass** (`solver.mjs` — a breadth search through the real engine, every reachable state within 7 lanes of the front):
>   - Solo: 30 seeds from lane 0 to lane 1000, 0 dead ends, worst stall 119 ticks.
>   - Match: 12 seeds to 6:00, all reach the Mothership at about 2,050 lanes, worst stall 113 ticks, through the wall's fastest pace.
>   - This is a windowed search on 42 seeds, not a proof. A third batch that dropped the kid onto lane 640 was discarded: it placed him on a road or water lane, which is my artefact.
> - **REPLAY = LIVE:** the 2,437-hop Mothership run replays to the same lanes, cause and feats, all hops used; no mismatch across about 300 mash runs.
> - **The look cannot touch the rules:** a grep of `tuning.js`, `engine.js`, `course.js`, `replay.js`, `logic.js`, `director.js` and `api/_lib/jaywalk.js` finds no look, DOM, clock, `Math.random`, or sin / cos / pow / sqrt. Their imports are each other plus `core/rng.js`, `meta.js` and `core/playlist.js`. The rng is integer `Math.imul`.
> - **The tells:** train 60 ticks, Blackbird 108 (minimum 90), Mothership 10 s, as documented. Seen readable: the night Blackbird chevrons, the UFO's green ring by day, the night train, the Mothership timer, both lines.
> - **The cap:** a hit in the cap's own tick is OUT, not lifted. Ties share the place.
> - **The server:**
>   - A solo run and a match are counted only from the replay of proof nodes. `go` and each chunk's `at` must equal the server's `now`, and are written once by their own uid (`database.rules.json:703–716`).
>   - Nothing the host wrote is read for a match's placings.
>   - A report is exactly-once (`results/` transaction, `api/report.js:289–298`).
>   - A reporter must be in the match, seated, and have their own node.
>   - Feats and YOUR BEST come only from a server-built match (`match-report.js:349–355`).
>   - A log ahead of the clock is refused; one behind is cut.
>   - Accepted limits the docs already name (`docs/jaywalk.md:297–299`): a real-time bot, and a faked drop over the last 75 s.
> - **Storage:** every proof node lives under `rooms/{CODE}/jw` and leaves with its room. A start keeps the previous and new match; PLAY AGAIN keeps 4. A room is deleted by its host, by the last one out, or by any client once idle an hour (`database.rules.json:12`, `room.js:549–555`). An abandoned solo room goes that way. Share cards are swept after 7 days.
> - **Function calls per run, per player (read from the code):** 1 report (plus a retry while the record settles); at most 1 table call per 90 s; 0 to 4 share POSTs. None during a run.
> - **Stability by reading:** a refresh or rejoin replays the node's log to now, solo and match. The clock is re-anchored on return from hidden. The host holds no private state. A silent player ends the match after 18 s, plus 75 s if offline. One scene alive at most; `destroy()` releases the GPU resources, the observers and the DOM. The bell and the UFO hum always reach a stop. All CSS animations are transform / opacity and respect reduced motion.
> - **Completeness:** no file without a licence trail, no NC licence, nothing credited that is not shipped (16 source pages fetched by the subagent). No dev text, no "TAKEN" or "ink" on a player's screen, no borrowed names. Test hooks are gated to localhost + `?emu`. No lab file is in the game's module graph. No pills in JAYWALK's own CSS.
>
> ## NOT CHECKED
>
> - **Anything in a browser:** no fps, memory, audio or context-loss measurement (as instructed), no E2E, no emulator run. Findings 3, 4, 6–11 and 17–19 are from reading the code. The audio sizes and levels are the subagent's offline arithmetic.
> - **The shots:** the visual subagent lost most of its early views. About 61 images are reliably reviewed, plus 11 I looked at myself. Not reliably reviewed: the Blackbird's pass, burners, shockwave and hit frames; most of the UFO and Mothership night sequences; most gate "5 lanes out" shots; the `-top` skyline crops; the credits pages 2–3. A second pass over `blackbird/`, `ufo/`, `ship/` and `e2e/` (about 44 images) would close this.
> - **Contrast figures** are computed from the CSS, not seen; text over the 3D scene depends on what is behind it.
> - **Not looked at:** the daily mode (not built); `ghosts.js` under real network lag; the report queue's exact handling of a refused report (finding 8 rests on `report.js` and `again.js` only); Vercel and Spark quota numbers beyond the 1 GB storage figure; whether xAI's terms cover the Grok art.
> - **The working-tree edits in progress** (`night.js`, `night-fx.js`, `flyers.js`): every finding is about 02641ab0.

(The one edit to the text above: the scratch folder's full path is shortened in the verdict's last line.)

### … and what was done with each finding
| # | severity | what was done | commit |
| --- | --- | --- | --- |
| 1 | BLOCKER | **FIXED, tests first.** THE RECORDER AND THE JUDGE ARE ONE BOUND (`engine.js#inputProblem`; `replay.js#logProblem` reads the same function): the recorder logs — and plays — an input only where the judge takes it; nothing is ever logged at or past the cap. The judge is exactly as strict as it was (NOT made tolerant: with one function the two can not differ, and a tolerant judge would be a looser anti-cheat bound). `tests/jaywalk-recorder.test.mjs`: the audit's own 2,043-lane run to the Mothership as a fixture (`tests/fixtures/jaywalk-ship-run.mjs`), played through the phone's loop with a thumb coming down in her tick → judged TAKEN at the phone's lanes | `2ae3583d` |
| 2 | HIGH | **FIXED, tests first** (the same function: 20 in any one second). 60 mash runs at 16 · 20 · 21 · 30 · 60 taps a second: every log accepted, the judge's run = the phone's. The bound both ways, across every mode's cap | `2ae3583d` |
| 3 | HIGH | **FIXED.** `flyers.js#rest(true)`: the ship's hum + rumble fade as the scene rests, the duck lets go (the music comes back up); a WATCHER's podium waits her lift out (`view.js` — `SHIP_SEEN`, 4.2 s past 6:00, when someone was still standing). Read + unit-pinned; NOT heard (it needs a match that reaches 5:50) | `23bd8209` |
| 4 | HIGH | **FIXED + proven in the browser.** `view.js#watchGL`: on `webglcontextlost` /admin is told once; the scene is REBUILT (destroy + create: the same look, tier, zoom, colour, reveal; resting again if it was) the moment the context is restored, or after 1.5 s. `e2e-jaywalk` step 7c loses the context on purpose mid-run: a new scene within 1.5 s, it draws, the run never stopped. Chromium only (WebKit on Windows has no WEBGL_lose_context to test with) | `23bd8209` |
| 5 | MEDIUM | **OPEN FOR BEN** (a cost call) — see below. Not changed: the card built before the tap is the owner's own rule (THE CARD IS BUILT BEFORE THE TAP) | — |
| 6 | MEDIUM | **OPEN — the go-live checklist names it.** The listener is `js/room.js` — a BOOT file, and the boot has 67 bytes of room: it can not be changed before the city's trim. An estimate, not measured: the checklist asks for an 8-phone bot match's frame times at minute 5 before the flip | — |
| 7 | MEDIUM | **FIXED — a RULES change (RE-PUBLISH).** `jw` + `jw/{match}`: the host's delete is refused while that match is LIVE (count / play) after the write; an older match's prune, the end, a new start, another game's start all still clear it (as `host.js` + `kit/again.js` make them — each in its own write). `rules.test.mjs` "the host never deletes the LIVE match's proof tree". No client change is needed on the old rules (nothing honest deletes a live tree). Not done: the phones rewriting a missing `go` (with the rule, a live node can not lose it) | `23bd8209` |
| 8 | MEDIUM | **NOT CHANGED — named.** Read, not run; the window = `/api` down while a best run ends AND five more runs played, or the room left. `KEEP_RUNS` 4 was built for the slow-report case. The report queue is the console's (boot files). For the next JAYWALK / city pass: never prune a proof whose report is still queued | — |
| 9 | MEDIUM | **FIXED.** The tier is sampled + ticked only while the scene is drawn (not behind an end screen) | `23bd8209` |
| 10 | MEDIUM | **FIXED (the release) · OPEN (the file).** Leaving the game (not PLAY AGAIN) lets go of the decoded sounds — `sfx.js#release` + the moments' buffers with their scene; the fetched bytes stay. The 33 s hum cut to a short loop = an asset change: not done | `23bd8209` |
| 11 | MEDIUM | **FIXED (the level) · not in the mix script.** The rumble's noise is normalised: 0.9 × `DUCK.rumble` 0.5 = −7 dBFS peak at the bus at most, by construction. Not added to `jaywalk-mix.mjs` (it is made in code, not a file) | `23bd8209` |
| 12 | MEDIUM | **FIXED.** Never a car in YOUR kid's colour (`night.js#carTint`: the palette walked past any tint near the kid's — all 8 player colours × 5 slots tested). A VIEW: each phone's own. A truck's cab over the kid's lower half (the camera's angle) is unchanged | `23bd8209` |
| 13 | MEDIUM | **FIXED.** HOW TO PLAY: "Hop across the harbor … In a match, the farthest wins"; + the runway, + the UFO's green ring, the lights "(fog by day)", the logs' edge — nine lines, nine drawings. Not in it: the Mothership (the 10 s warning says it), the desktop keys | `23bd8209` |
| 14 | MEDIUM | **OPEN FOR BEN + the checklist** (pin ZOOM 8 · STRAIGHT + the A takes at go-live, or make ZOOM a real setting) | — |
| 15 | MEDIUM | **Into the checklist** (THE BOARD's tab + its test; the tile; the tests that flip; the open day). The cards WERE approved in THE LAB on Nov 17 (the shot is older than the approval) | — |
| 16 | MEDIUM | **FIXED.** The bell, the horn + the saucers' lines carry the licence's link; "the UFO's landing legs removed" | `23bd8209` |
| 17 | LOW–MED | **FIXED.** A locked / muted phone keeps ONE waiting sound, never a listener a call | `23bd8209` |
| 18 | LOW–MED | **FIXED where it is frequent** (the count's pop on every new lane: two names, one animation — no layout read). The three rare ones (a new best's flash, an area's name, the call) stay | `23bd8209` |
| 19 | LOW–MED | **NOT CHANGED** (read, not measured; the measured frame is 59.9 fps at every tier under a 4× throttle). Behind an end screen the scene already draws nothing (H6B) | — |
| 20 | LOW | **NOT CHANGED** — the chips' size is the owner's (H6B: COMPACT). Named under OPEN FOR BEN | — |
| 21 | LOW | **FIXED:** "1 LANE"; a refused call says YOUR CALL DID NOT GO THROUGH. Not changed: the call card over the watched kid, the watch line's wrap | `23bd8209` |
| 22 | LOW | **FIXED (the run's picture goes when the game is left).** The Mothership's bake + the hidden skyline layer: unchanged (transient / one picture) | `23bd8209` |
| 23 | LOW | **NOT CHANGED** (no click was heard or measured) — with the owner's ear on the mix | — |
| 24 | LOW | **PARTLY** — the flat rectangle with a hard edge is Group 2's fog fix (the lip + the puffs). The swallowed things brighter than the fog: unchanged (OPEN FOR BEN, small) | `ec1ae793` |
| 25 | LOW | **FIXED (four lines):** `LOOKS` twice, `landmark` → `area-arrive`, 12 credit lines. Left: the older sections' Blackbird / UFO numbers (the doc says the later section wins), the sound counts at "THE ASSETS", the unused `crate-box` / `traffic-barrier` models + the three `-b` takes (the owner's audition still offers them) | `23bd8209` |
| 26 | LOW | **An inbox entry TO THE CITY** (site-wide: `results/` is never pruned) | — |
| 27 | NIT | The dead stub css is gone. The console's capsules = the city's; the 10,000-chunk limit (2.8 h of one run) stands | `23bd8209` |

## GROUP 3 — THE SECOND REVIEWER (a fresh read-only reviewer over the RE-SHOT set + the fixed list only — `Downloads\NEON\jaywalk-review\`; it opened 101 pictures itself) — its report, VERBATIM

> ## VERDICT
>
> **NOT READY — close.** The Blackbird's day tell, the 3-digit count and the two night towers have landed. What remains is mostly in the real-game (`e2e`) shots, not the lab ones: unreadable small text on the DAY end screen, a day skyline over a night world on the solo start screen, a van in the ringed kid's colour in a match shot, and the 2-digit count sitting on the opening skyline's lighthouse. The fog still has one ruler-straight step.
>
> Method: I opened every image myself (no delegation). Zoom crops and phone-scale (390-wide) contact sheets were written only to my scratchpad; nothing in the repo or the shots folder was touched. Contrast figures are the brightest text pixel against the median background, so they are upper bounds.
>
> ## THE FIXED LIST
>
> | # | Item | Verdict | Files | What I saw |
> |---|---|---|---|---|
> | 1 | Blackbird's day tell | **GOOD** (two nits) | `blackbird\day-1-the-tell`, `day-2a`, `day-2`, `day-3`, `day-3a`, `day-3b`, `day-3c`, `day-4`, `day-4b`; `night-1`, `night-2`, `night-3` | At 390 pt the lane is unmissable: amber-on-dark chevrons, three rows of red / amber lamps, the cream racing band, then the orange flare at the right edge (`day-2a`, `day-2`). It reads as "hazard" at least as fast as by night, and can not be taken for a rail lane or water. It is LOUDER than night (night is one elegant chevron block on runway dots); by day it is on the edge of garish, but not pasted on. Nit: zoomed, several lamps are split red-over-amber by a dead-straight horizontal line and the cream lamps have flat-cut bottoms. Nit: once the tell ends (`day-3c`) the idle runway is a grey lane with white dashes — close to an ordinary road by day, where night keeps its runway lights. |
> | 2 | Fog bank by day | **MOSTLY GOOD — one line left** | `h5c\fog\day-1…4`, `night-1…4`; `e2e\run-day`, `e2e-match\match-day-band`, `match-ghosts`, `match-out-call` | The streaks and the hard-edged rectangle are gone; the lip is soft and billowy and reads as fog. Left over: a full-width, ruler-straight tone step on the grass just above the lip (`day-2-near`, `day-3-close` — same screen row in both, so it looks like a per-lane haze / shade step). Faint at phone size by day; clearly visible in the blackout (`night-2-near`, `night-3-close`: two or three straight-edged bands, and the purple bank meets pure black on a straight line). In the real game (`e2e\run-day`) the bottom ~12 % is a featureless pale slab with a pink van bleached to near-white inside it. |
> | 3 | Lane count vs landmarks | **GOOD for 3 digits; STILL WEAK for 2 digits on the opening band** | all 8 `sky\day-*-top`, all 8 `sky\night-*-top`, `night-0-the-opening-top`, the look-switch tops; `gates\night-6-canal-d-3-lanes-out`, `gates\day-1-docks-a…e`; `e2e-match\match-day-band`, `match-spectate`, `match-out-call` | No 3-digit count touches a landmark in any of the 16 area tops. Tightest: night downtown at 297 (`gates\night-6-canal-d`) — the first tower is 5–7 pt right of the "7", inside the count's glow; night docks 59 ≈ 13 pt from the crane apex; lighthouse 359 ≈ 18–20 pt day and night; airfield 417 ≈ 17 pt. The 3-digit size (≈ 45 pt tall against ≈ 58 pt) is still big and does not look like a mistake. BUT a 2-digit count on the OPENING skyline stands on the small lighthouse: the "1" of 13 / 10 ends 1.5–2.5 pt above its finial (`match-day-band`, `match-spectate`); the "4" of 41–47 is ≈ 5 pt above it in the lab (`gates\day-1-docks-a…d`). |
> | 4 | Match chips vs left landmarks | **Lighthouse: clear, barely. Night bridge: clear at 4, cables under rows 5–8 at 8. Day bridge: STILL WEAK (known)** | all 12 `chips\*-top` | **Day bridge, 4:** the red left tower stands straight behind the "210" / "203" column, cables through the chip backing — legible, untidy. **Day bridge, 8:** rows 3–8 veil the whole left tower and the left deck; "196" sits on the deck, the struck-out names tangle with the cables. Moderate: nothing unreadable, but the landmark's left third is lost and it is the one band that looks unplanned. **Night bridge, 4:** fully clear. **8:** the last two rows sit on the left cable's light dots — legible, busy. **Day lighthouse, 4 + 8:** clear by 4–5 pt. **Night lighthouse, 4 + 8:** clear by only 1–3 pt ("374" all but abuts the gallery), and the chip backing shows as a hard-edged dark box where it crosses the lamp's beam (row 1). **Chips:** names and numbers read by day (white, dark edge, slate backing) and by night. Struck-out names are not really readable ("CRAND…"?), their numbers are. In the real match (`e2e-match`) the chips' caps are ≈ 8 pt — small but legible. |
> | 5 | The two night towers | **GOOD** (rail yard the weakest of the eight) | `sky\night-3-rail-yard-top` + full; `night-8-airfield-top` + full; `e2e\areas-rail-yard-run` | Airfield: lit cab, red beacon, warm hangar, windsock, plane — fully on par with the other six. Rail yard: the water tower now reads (rim light, lamp strip) and the gantry is carried by its two red + one green signals and the floodlights; the gantry's steel itself is still brown on near-black. At phone size it says "rail yard", but it is the dimmest of the eight. |
> | 6 | Never a car in your kid's colour | **GOOD in the fresh lab + solo shots (cyan kid); CONTRADICTED by one match shot; other colours NOT SHOWN** | `gates` (16), `ufo` (8), `blackbird`, `ship`; `e2e\run-day`, `run-hops`, `line-*`; `e2e-match\match-day-band`, `match-out-call` | In ~50 lab and solo frames no vehicle is cyan (purple, pink, red, yellow, cornflower blue, white trucks). But `e2e-match\match-day-band.png` shows a CYAN VAN in the same lane, right beside the cyan ringed kid. Two caveats: `e2e-match\` is stamped 12:48–12:50, about 45 minutes older than the rest of the set, so it may pre-date the fix; and I can not tell whether that phone is Charlie's own or a watcher's. Hard-to-find frames otherwise: at night the kid renders light BLUE and stands on bright blue water with his ring lost in the glow (`gates\night-7-lighthouse-a`, `night-4-bridge-b`, `night-8-airfield-a`); a train in the nearer lane hides his legs and ring (`ufo\night-1-drifting`). A kid of any other colour in traffic is not in these shots. |
> | 7 | Anything else | **STILL WEAK** | see the ranked list | — |
>
> ## STILL WEAK — ranked
>
> 1. **Day end screen: small text fails contrast.** `e2e\end-day.png`. On the magenta wash: "LANES" 2.5:1, "YOUR TABLE" 2.7:1, the rank numbers 3.3:1, "JAYWALK · SOLO" 2.0:1. The same screen by night (`end-new-best.png`) is 6.1:1. Every day-look run ends here, and the flat pink reads cheaper than the night version. Fix: darken the day scrim to the night one's value, or give those labels the white-with-dark-edge treatment.
> 2. **Day skyline over a night world on the solo start screen.** `e2e\run-start.png` (sunny band, dark neon world, neon count); `e2e\line-friend-coming.png` (band still mid-fade at lane 2). It is not labelled a look-switch shot, and it is identical in the before set. If the E2E toggles the look just before the shot, this is a harness artefact; if not, it is the first thing a player sees. Fix: snap the band to the look before the first reveal; cross-fade only on a switch made during play.
> 3. **A van in the ringed kid's colour.** `e2e-match\match-day-band.png` (also visible at the left edge of `match-out-call.png`). Re-shoot the match set on the current build. If it is still there on the kid's own phone the fix does not reach matches; if it is a watcher's phone, decide whether the rule should cover the kid being watched.
> 4. **2-digit count on the opening lighthouse.** `e2e-match\match-day-band`, `match-spectate`, `match-out-call`; `gates\day-1-docks-a…d`. 1.5–5 pt above the finial for much of the first area (seen at 10, 13, 41–47), solo and match. Fix: give the opening band the same offset rule the 8 areas got (lighthouse ≥ 12 pt left of the count's left edge), or step the 2-digit count down too.
> 5. **Day bridge under the chips (known).** `chips\day-bridge-4`, `-8`. Moderate, as described in item 4. Fix: mirror the day bridge picture so its tall tower is on the right, or give the chips an opaque backing over the band in this area.
> 6. **Fog's straight steps and flat foot.** `h5c\fog\day-2`, `day-3`, `night-2`, `night-3`; `e2e\run-day`. Fix: fade the haze / shade across the lane boundary instead of per lane; break the foot with two or three large, very low-contrast puffs; let the night bank end on the same billow as its top.
> 7. **Day captions over bright ground.**
>    - "TAP TO HOP · SWIPE TO STEP" on day grass: 2.4:1 (`e2e-match\match-count.png`; night is 5.5:1).
>    - "WATCHING ALICE · TAP FOR THE NEXT · YOUR CALL · ALICE" is white on white fog (fill 1.7:1), held only by its dark edge, and wraps to two lines (`match-spectate.png`).
>    - "8 LANES" of the out banner straddles the sea wall's edge (`match-out-call.png`).
>    - Fix: a dark soft plate or full dark text by day; keep the banner's last line off the wall.
> 8. **Night crowding at the left and at downtown.** `chips\night-lighthouse-4`, `-8` (numbers 1–3 pt from the tower; backing box cuts the beam); `gates\night-6-canal-d-3-lanes-out` (297, tower 5–7 pt inside the glow). Fix: 6–8 pt more pin for the night lighthouse; feather the chip backing; stop the night downtown slide about 8 pt earlier.
> 9. **Area title on the landmark.** `e2e\areas-rail-yard-run.png`: "THE RAIL YARD" under the count sits on the water tower's roof. Readable, but it is text on the landmark the pass worked to keep clear. Fix: raise it or shorten its stay.
> 10. **Blackbird tell polish.** `blackbird\day-1`, `day-3c`. Round off the lamps' hard two-tone split and flat bottoms; consider two rows of lamps instead of three; give the idle day runway one permanent cue (edge lamps or threshold stripes).
> 11. **Night kid on water.** `gates\night-7-lighthouse-a`, `night-4-bridge-b`. Fix: a dark or white rim on the ring over water lanes, or dim the night water about 15 % under the kid.
> 12. **Podium shows a second screen through it.** `e2e-match\match-podium-winner.png`: faint "JAYWALK · MATCH 1", "Three … yours", "TOTAL" and a "CONTINUE" button outline show behind the cards. If this is not a mid-transition capture, it is broken.
> 13. **Smaller things.**
>     - Stray 1-pt pink squares under the count in many lab shots (`sky\night-2`, `-3`, `-6`, `-8`; `day-2`, `-3`, `-8`), not in the `e2e` shots — if they can appear in the game they read as dead pixels.
>     - The match count screen by day has an empty pale-blue haze over the top third of the world, with half-objects cut at both edges (`match-count.png`).
>     - The solo share card's picture has no kid in it (`share-card-solo.png`).
>     - No pill-shaped label seen anywhere; gate signs, name tags and chips are all rectangular.
>
> ## LOOKED AT (original files opened, singly or in a phone-scale sheet I built)
>
> - `blackbird\` — 12 (all 9 day; night-1, -2, -3)
> - `h5c\fog\` — 8 (all)
> - `sky\` — 22 (all 8 day tops, all 8 night tops, `night-0-the-opening-top`, the three look-switch tops, `night-1-docks-cross-fade-mid`, full `night-3-rail-yard`, full `night-8-airfield`)
> - `chips\` — 12 (all)
> - `ship\` — 7 (day-1, -3, -5, -6; night-1, -3, -5b)
> - `ufo\` — 8 (day-1, -2a, -2b, -2e; night-1, -2a, -2c, -2d)
> - `gates\` — 17 (day: docks a / c / d / e, rail yard a, downtown b, lighthouse a, airfield a, canal d; night: fish market a, rail yard a, bridge b, airfield a, downtown c, canal d, lighthouse a, docks e)
> - `e2e\` — 9 (`run-start`, `run-day`, `run-hops`, `end-day`, `end-new-best`, `line-friend-coming`, `line-best-coming`, `areas-rail-yard-run`, `share-card-solo`)
> - `e2e-match\` — 6 (`match-count`, `match-ghosts`, `match-day-band`, `match-out-call`, `match-spectate`, `match-podium-winner`)
> - before set — 1 (`jaywalk-h6b\e2e\run-start`, comparison only)
> - **Total: 101 review images + 1 before.**
>
> ## NOT LOOKED AT
>
> - `wk-mem\` — all 7
> - `blackbird\` — the other 6 night frames
> - `sky\` — the 16 full-height area shots other than night-3 / night-8, `night-0-the-opening` full, the two look-switch full frames
> - `ship\` — 7 frames (day-2, -4, -5b; night-2, -4, -5, -6)
> - `ufo\` — 4 (day-2c, -2d; night-2b, -2e)
> - `gates\` — the remaining ~53
> - `e2e\` — `owner-shelf`, `owner-card`, `line-friend-crossed`, `line-best-crossed`, `share-link-solo-540`, `lost-context-rebuilt`
> - `e2e-match\` — the four `ghosts-*`, `match-day-ghosts`, `match-spectate-2`, `match-podium`, both share images, all five `h6a-*`

### … and what was done with each point
| # | what it is | what was done |
| --- | --- | --- |
| 1 | the day end screen's "magenta wash" | **A TEST-SHOT ARTEFACT — found.** The end screen itself is the same dark screen by day as by night (the same file's `end-new-best.png` IS a day-look end screen — "LOST IN THE FOG" — and is dark; so is the WebKit run's). The wash is the console's XP moment (`js/progress/moment.js` — the city's) fading IN over the end screen in the very frame the check took its picture (the first run earns XP; the wash is `#ff4fc4` at ≈ 50 %, over the band too, not over the foot). The check now waits the moment out before the shot. The moment's own look over a game's end screen = the city chat's inbox entry (Nov 17, from H6A) |
| 2 | a day band over a night world at the start | **A TEST-SHOT ARTEFACT — found.** The check sets NIGHT two lines before the shot (the phone's AUTO was DAY at 1:34 pm): the picture is the first instant of THE LOOK SWITCH's 1.5 s cross-fade (the owner's decision: kept). A fresh mount shows its look's band at once (`skyFresh = true`). The check now waits the cross-fade out |
| 3 | a van in the ringed kid's colour (match) | **The shot was older than the fix** (12:48; the fix: 1:30 pm). The match set re-shot on the fixed build (`e2e-match\`, `e2e-match4\`): a yellow kid among pink / cyan / violet cars, a cyan kid among pink / violet / blue / red — no car in the kid's colour. (THE TAXI keeps its yellow beside a yellow kid: its roof sign + shape are its own — named under OPEN) |
| 4 | a 2-digit count on the opening skyline's lighthouse | **FIXED.** Measured: the plain day picture's small lighthouse stands at 43 % — x ≈ 154 of 390 with the band centred, under the count (141–249). THE OPENING BY DAY rests 6.5 % right (`skyline.js#SKY_OPEN_DAY`) and never slides back past 5.5 % (`min` — the plan's new lower limit): the lighthouse's right edge ≤ x 131 at every slide. By night the plain picture has no lighthouse |
| 5 | the day bridge under the chips | known — OPEN FOR BEN |
| 6 | the fog's straight step · the flat foot · the bleached van | **PARTLY FIXED:** what the fog bank takes now fades INTO the fog's own colour (`night.js` the pool's `put`: by day a `k` over 1 was a brightness — trees + vans came out as bright pastel cut-outs, brighter than the fog). The faint straight tone step above the lip (the lane's own shade) and the blackout's lane-by-lane bands (the lights die lane by lane: H5C's design) are unchanged — OPEN |
| 7 | day captions over bright ground | not changed — each already has its dark edge (the reviewer's figure is the fill alone); the watch line's wrap + the out banner's last line on the wall: OPEN |
| 8 | night crowding | **FIXED (downtown):** the night downtown's slide stops at 5.5 % (it was 6.75; the rest 5.25). The night lighthouse is already pinned at the room's edge — it can not go further; the chip's backing over the beam: OPEN |
| 9 | the area's title on the landmark | not changed (0.6 s, once an area) — OPEN |
| 10 | the day lamps' flat bottoms | **FIXED:** a day signal lamp stands ON the tarmac (it was sunk to its middle). Three rows → two, an idle day cue: not changed — OPEN |
| 11 | the night kid on water | not changed — OPEN |
| 12 | the podium "shows a second screen through it" | the console's moment sheet behind the podium, mid-transition — the city's (the same inbox entry as 1) |
| 13 | the stray pink squares · the count screen's haze · the share card without a kid | the squares are the LAB's (its mark line; never in the game's shots) · the count screen: the far haze by design · the card's kid was in the fog (LOST IN THE FOG) — not changed |

**A THIRD reviewer was not spawned** (the prompt asked for two); the fixes after the second report were shot again and looked at by the pass itself.

