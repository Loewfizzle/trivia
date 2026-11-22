# JAYWALK JT2 — TOUCH-UP: ROOM · THE MATCH FLAKE · THE FRIEND LINE · TAP TO START · THE CONTROLLER · THE BOARD's AVERAGE (Nov 22 2026)

The owner's prompt (Nov 22); his decisions: `docs/games/plan.md` "JAYWALK JT2"; as built: `docs/jaywalk.md` "JT2 — TOUCH-UP" + `docs/match-kit.md`
"THE CONTROLLER". No rules change (nothing in `database.rules.json` moved — the average is server-written on paths the server already owns).
The inbox: no open entry for JAYWALK at the start, after each group, before the final run. THE CARD LAB: `lab-export` read — no open FIX mark.

## GROUP 0 — ROOM
Every comment block of 2+ lines in the 44 modules JAYWALK preloads → `docs/games/jaywalk-notes.md`, VERBATIM (each keeps its first line +
" …"; a module's header keeps a pointer line). **The city + JAYWALK 2,584 → 2,540 KB** (the game alone 515 → 470 KB — 44 KB freed, the target
was ≥ 15). Behaviour unchanged, proven: acorn's token streams of all 45 files identical before / after; unit 2,579 green; the preload graph
regenerated (same 44 modules). After the pass's new code: **2,549 KB** (the game alone 45 modules / 479 KB — + `core/board-avg.js`).

## GROUP 1 — THE MATCH FLAKE (the root cause)
**The cause, in one paragraph:** the match E2E plays its three phones with bots, and the flow needs ALICE and CHARLIE still IN when BOB goes
out (CALL THE WINNER opens only with two players in; HEAD TO HEAD, the duel strip, LAST ONE STANDING, BOB's call + the night record's call
points all follow from it). Those players were LAZY GREEDY BOTS — and a Node simulation of that exact bot on 400 courses shows it is out
inside 45 s on 96 of them (24 %, almost all by a car it stood in front of while waiting for the wall): when it happened to ALICE or CHARLIE
before BOB's step, the call never opened and 16–19 checks went red together — the "85 / 101 the night record" (J2 FIX), "84 / 103 the watch /
call section" (JT1) and J1's "both bots died at lane 7" signatures. A loaded machine made it likelier: the view asked the bot once a FRAME,
so a stalled frame let the engine catch up several ticks past its last decision. J4's "STACKED TAGS MERGE none seen" was the second, smaller
cause: the test POLLED for a merged name tag that is on screen for a second or two — under load the poll missed it. Reproduced here: under a
14-thread CPU load the old code went red 1 run in 2 (STACKED TAGS MERGE); green 7 / 7 idle + loaded runs before that.
**The fix (test code, no game rule):** THE STEADY BOT (`bot.js#steadyBot`) searches 480 ticks ahead through the real engine — a move, then the
next choice, backtracking on a death, a dead-state memo — and plays the first move of a run that lives: **0 of 1,000 courses out in 90 s**
(worst decision 3.4 ms in Node). Every TEST bot is asked once a TICK (`view.js#tick`): a stalled phone makes the same moves (unit-tested). The
phone keeps the last merged tag it SHOWED (`state().merged`, `clearMerged()`); the E2E reads that. Under the same CPU load the fix: 3 / 3.
`tests/jaywalk-jt2.test.mjs`: the lazy bot out on ≥ 5 of 60 courses, the steady bot on none; a 37-tick frame = the same hops at the same ticks.

## GROUP 2 — THE FRIEND LINE
Thinner (0.22 night / 0.26 day deep), half strength, a pale pink core (no white-hot line for the bloom), ON THE GROUND at the lane's far
edge — a car on its lane hides it, the next lane's cars stand clear of it — and its words depth tested (under the traffic; YOUR BEST unchanged).
`lines.js#friendFade`: full at ≥ 4 lanes ahead, 0 at ≤ 1, smoothstep; the posts sink with it; the crossing's burst + chime unchanged. The draw
calls: none added (the same kinds). Shots: `Downloads\NEON\jaywalk-jt2\friend\` (night + day, far = 6 lanes, near = 2, a car on the lane).
**A named call:** the owner's TOUCH-UP PASS made the lines' words read OVER a taxi; the friend's now lie UNDER the traffic (this pass's
decision: the line must never hide a hazard) — YOUR BEST's still read over a van.

## GROUP 3 — TAP TO START
As built: `docs/jaywalk.md` "TAP TO START". The calls (overrule any):
1. The tap that starts a solo run is also its FIRST HOP (the prompt's "HOP TO START") — carried to tick 0 once the GO lands (~a round trip).
2. THE DAILY keeps the server's 3 · 2 · 1 after the tap (its START answers go = now + 3 s) — the try, its clock + 5:00 run from that.
3. PLAY AGAIN / TRY AGAIN start at once — that tap was the start (INSTANT AGAIN's `__nsAgainAt`).
4. The daily's veil redraws the scene twice a second under the blur (a near-still: no blur re-run every frame).
Proof: THE STAMP at the tap (the E2E waits **60 s** on the start screen — no tick, no stamp, no GO written — then taps: t0 → GO 2 ms, the run
counts). Shots: `jt2-tap-to-start-night-390.png` · `-day-390.png` · `jt2-daily-start-390.png`.

## GROUP 4 — THE CONTROLLER
`js/games/kit/gamepad.js` (5.4 KB, lazy — never in the start bundle): see docs/match-kit.md "THE CONTROLLER". **Calls:** the press that
CONNECTS a pad (Safari exposes it only then) says "🎮 CONNECTED" and does nothing else; a Nintendo-labelled pad's A is its right button (the
label wins over the position); A in the run = a tap (a hop forward / the next player when watching); B in the run = nothing (a "back" mid-run
would throw the run away) — B acts on end cards only. `ui/final.js` marks REMATCH / PLAY AGAIN `data-pad="a"`, ROOM / CITY `b`; the daily's
TRY AGAIN / BACK TO THE DAILIES `a`, COME BACK LATER `b`. Test: `e2e-jaywalk.mjs` 6d (a fake Xbox pad: CONNECTED, A = PLAY AGAIN, the D-pad
3 hops, the stick one step, the deadzone nothing, the server's replay counts the run). Shot: `jt2-pad-connected-390.png`.

## GROUP 5 — THE BOARD's AVERAGE
As built: `docs/jaywalk.md` "THE BOARD's AVERAGE". **The back-fill: none possible** — `results/` keeps every counted solo run (its time, a new
best when it was one, 50-lane splits) but never a run's lanes; the average builds from this deploy. **Calls:** the AVG sits UNDER the best on
THE BOARD (the rank column's second line — the established two-line slot, HOLD'EM's wins · KOs), "AVG —" under 5 runs; the end card says
YOUR BEST · 296 · AVG 225 (a NEW BEST: the AVG on its own line under the gold — it did not fit beside it at 390); under 5 runs the end card
says nothing of it. Stored on the profile (`profiles/{pid}/av/{board}`) — THE BOARD's rows already read the profile (no extra read). The
/api test: `server.test.mjs` "JAYWALK H3 — THE SOLO RUN" (+ the AVG block). Shots: `Downloads\NEON\jaywalk-jt2\board\` (375 + 390, a dash
row, YOUR row) + the end card.

## THE FINAL RUN (local, the Beelink — my own fresh emulators + `DAILY_TEST=1 JW_CV_SWITCH_MS=0 serve.mjs --emu`, nothing else busy)
- unit `node --test tests/*.test.mjs` **2,589 / 2,589** (+ `jaywalk-jt2` 10; `jaywalk-lines` / `-day` / `-solo` / `shell` updated to the new code)
- v2 `e2e-jaywalk-match` FAST **5 × in a row: 104 · 104 · 104 · 104 · 104 / 104** · `--four` **102 / 102** · `--two` **7 / 7**
- v2 `e2e-jaywalk` FAST **117 / 117** (TAP TO START + its 60 s wait, THE CONTROLLER's fake-pad run) · `e2e-jaywalk-daily-run` v2 **69 / 69** ·
  on a server without the v2 switch **69 / 69** (the day's version is v2 now — the switch date has passed, so that run plays v2 too)
- smoke **24 / 24** · rules **103 / 103** · `/api` `server.test.mjs` **76 / 76** (+ THE BOARD's AVERAGE)
- `jaywalk-lab --perf` **132 / 132** · `--j4perf` **24 / 24** · `--jt1perf` **16 / 16** (the worst frame 64 draw calls — the limit, unchanged
  from JT1 — 59.9 fps at 390, 60 at 430, 4× CPU) · `--jt2=friend` **7 / 7**
- THE LINE: the city + JAYWALK **2,549 KB** (2,584 before the pass); the game alone 45 modules / 479 KB; THE SEASONAL PACK untouched.
- No rules change. Every server this pass started is stopped (the emulators, :5173); the preview server :5190 left up.

## THE ADD-ONS (the owner, after the first push — built as the last group; a second tagged push)
### THE FINAL SCREEN's MEMORY WITH THE SEASONAL PACK (/admin: one PAGE KILLED, game:jaywalk/final, iOS 18.7, build a0019bc — before JT1)
Measured every final screen on the heavy days (`JW_DAY=` — the page's test-only `&jwday=`; the game takes no clock, so Dec 31 = the regular
night bursts, not the 23:59 finale) at 390 × 844, against `JW_FINAL_BUDGET_MB` = 20 (never raised). **All under, before and after:**
| scene | pixels held on the final screen | the season behind it |
| --- | --- | --- |
| solo, Nov 25 autumn (5 runs in a row) | 7.6 MB each (the 3D still 2.5 + the gate sign 0.7 + the run's picture 4.4) | was ALIVE: 150 leaves falling → **at rest** |
| solo, Dec 24 heavy snow (5 runs) | 7.6 MB each | was ALIVE: 760 flakes → **at rest** |
| solo, Dec 31 (5 runs) | 7.6 MB each | at rest, the fireworks' canvas freed (0 px) |
| 3-player match, Nov 25 · Dec 24 · Dec 31 | 10 MB a phone (+ the city's backdrop 2.2) | at rest |
| THE MOTHERSHIP's final, Dec 31 | was **4.2 MB — the fireworks' canvas 900 × 304 held** → **3.2 MB** | at rest, 0 px |
| 8-player match end, Dec 24 (`--eight`) | 9.1 MB on each of the 8 phones | at rest |

**Found + fixed:** (1) the pack's snow / leaves kept falling behind the final screen — the scene draws its last frames into the still and the
pack re-showed the fall in them (`seasonal.js`: never while resting); (2) the fireworks' canvas was only CLEARED at rest — now FREED (0 × 0,
no spark, no rocket) and made again on the next run; a resize behind the final screen made it again (the Dec 31 MOTHERSHIP final's 900 × 304)
— no longer; (3) a pack or a fireworks canvas that lands while the scene rests is rested at once. The footprints + the burst piles are let go
too. **The final screen itself:** nothing held twice — its canvases flat over 5 runs (2 solo · 4 match: the gate sign, the run's picture
kept for SHARE, the city's backdrop); the confetti / podium are DOM. **THE GUARD:** `kit/jaywalk-mem.mjs#seasonRest` on every final screen of
`e2e-jaywalk.mjs`, `e2e-jaywalk-match.mjs` (+ THE MOTHERSHIP's) and `--eight` (+ a canvases-never-pile-up check), `tests/jaywalk-jt2.test.mjs`.
Runs: solo Nov 25 / Dec 24 / Dec 31 **120 / 120** each · match Nov 25 / Dec 24 / Dec 31 **106 / 106** each · `--eight` **6 / 6** · today's
match **105 / 105** · solo **119 / 119** · unit **2,590**.

### THE GRAVESTONES READ CLEARLY (`moments.js#graveAhead` · css `.jw-x.is-grave`)
The settled X stays CLEARLY visible all match: ×0.62 (smaller than the flash) at 92 %, brighter red with a soft static glow by night (no
bloom, no filter), strong red + a thin dark edge by day; the name 12 px at 100 % (the player list: 10 px). Near the kid: ONLY on the lane he
is about to hop into (0.5 → 1.5 lanes ahead) → 50 %, never lower; full on his own lane, once passed, or further up. Visual only;
`tests/jaywalk-moments.test.mjs` updated. Shots: `Downloads\NEON\jaywalk-graves\v2\` (night + day, 8 players, 4 out, MAXIMILIANOS's X right
in front of the kid at 50 %).

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. The calls above (the tap = the first hop, the daily's 3 · 2 · 1 kept, PLAY AGAIN starts at once, the connecting press does nothing, B
   does nothing mid-run, the friend's words under the traffic, AVG under the best / its own line under a NEW BEST, no back-fill possible).
3. HIGH RISE + the next games: THE CONTROLLER is one line each (`wirePad`) — not wired in this pass.
4. THE ADD-ONS came after the first push: built + pushed as a SECOND tagged deploy (the pass's two cloud runs).
5. The gate sign's canvas (0.7 MB) stays behind a final screen (small; the budget holds) — free it too in a later pass if you want every byte.
