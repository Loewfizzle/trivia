# FREEFALL — THE FIX PASS, PART B: SPEED BY EXPERIMENT + THE MATCH + STABILITY (Nov 27 2026 · the Beelink · Opus 5.5)

THE FIX PASS is now three parts (`docs/games/plan.md` "FREEFALL — THE FIX PASS, three parts"): A ✓ (the look + the feel) · **B (this)** ·
C (scoring + the rules leaf + the shared end board + the test page + the small items) · then the go-live. FREEFALL stays HIDDEN
(`config.js` `playable` untouched), THE SWITCH stays OFF. REPLAY = LIVE: no rule, engine, judge or proof change — view, match flow and
host logic only. No `database.rules.json` change. No budget raised.

## STEP 0
`docs/games/plan.md`: the three parts, Ben's iPhone numbers after FIX A (HITCH 29 / 35, single 36–44 ms stalls on calm floors, the spike
rule took the tier 2 → 1 → 0 without stopping them; the Beelink 0–1 = a device-only cause), the method (A/B switches now, the real fix in
PART C), THE WATER "good enough for now". THE ADD-ON INBOX: nothing open for this pass at the start, after each group, before the final
tests. THE LAB: no FIX marks (232 marks exported).

## GROUP 0 — SPEED BY EXPERIMENT
1. **THE SPIKE RULE ONLY STEPS DOWN IF IT HELPS** (`stage.js#SPIKE` · `hitchNow` · `trialTick`): 4 hitches in 20 s → one tier down ON
   TRIAL — the hitch rate of the next 10 s of PLAY (the step's own 0.5 s skipped) against the rate of the 20 s before it. Not halved →
   the tier goes BACK UP and the rule rests for the page (the same phone, the same cause — Ben keeps the full look). Halved → kept. Never
   below tier 1 on spikes alone (the average rule — p75 > 19.5 ms — still can). The clocks are play time: a run's end pauses a trial.
2. **`?fps=2` — THE BREAKDOWN** (`stage.js` `breakdownNow` · `breakdownLine`): every hitch is split into OUR work in the frames before the
   gap (the update · the scene build · the render submit — `night.js#submitAt`), the main thread BUSY elsewhere in the gap (a 4 ms
   ping that could not run: the collector, Safari's own work, another task) and the WAIT with the thread free (the GPU / the compositor /
   the display) — over the last TWO gaps (Chromium stamps a frame that waited behind a blocked thread with its old begin time, so the long
   `dt` lands one frame late). Each hitch goes in the biggest: `ours` · `busy` · `gpu`. The live line names the last hitch's split; the
   END-OF-RUN SUMMARY adds `WHY · gpu 24× (avg 38, 44 ms @61) · …` + `ON A HITCH · ours … (upd · build · submit) · busy · wait · every
   frame ours … · long tasks n` (PerformanceObserver — Chromium; Safari says n/a). Proven: a real 60 ms block of the main thread → `busy`.
3. **THE A/B SWITCHES** (the test page only — `play.js#AB`, never the cartridge): `?bloom=0` (no glow pass) · `?fx=0` (no sparks / flames
   / trail / shards / motes) · `?wall=0` (the shaft's wall pass skipped — a plain colour) · `?ghosts=0` (rivals run, none drawn) ·
   `?smooth=0` (the old tower, below) · with `?dpr=` · `?tier=` (as before). Combinable; every `?fps=` line opens with them
   (`AB dpr 1.5 · bloom 0 · fx 0 · wall 0 · tier 1 pinned · smooth 0 — …`) so a screenshot says which were on.
4. **SMOOTH MOTION THROUGH A MISSED FRAME** (VIEW ONLY — `stage.js#spinAhead`): the ball + the camera were already drawn from the run's
   own clock (`tau`, a fraction into the tick); the TOWER's angle was the engine's at the last whole tick — it stepped once a tick: at a
   120 Hz frame every other frame (0, 60, 0, 60 units), and at 60 Hz whenever the frame's stamp jittered over a tick's edge (a 0 then a
   120 — measured on a 1 ms-stamped clock drifting against the tick). Now the view draws it at the real time: the turn the NEXT tick will
   make (the finger's owed turn + a held key, within MAX SPIN — exactly what `settle()` applies at that tick, before its landing) times
   the fraction of the tick gone — so at the tick the drawn angle IS the angle the landing uses. Nothing in the engine, the log or the
   judge sees it (the A/B's `?smooth=0` is the old way). Measured on a virtual clock: 120 Hz 85 / 85 frames move their true share (30
   units each; the old way 0 / 60 alternating), 60 Hz drifting 85 / 85 (the old way 4 frames off: 0 then 120), a 36 ms frame 45 / 45.

## GROUP 1 — GROK's CODE BUGS
1. **A LOST CONTEXT IN A MATCH** (`stage.js#rebuild`): the new scene gets the ghosts + their names again; a WATCH adopts the watched run
   on the next frame. Proven: 7 rivals → lose → 7 again (their tags baked); watching → the rebuilt camera on the watched floor.
2. **A YIELDED DUPLICATE TAB NEVER WRITES PROOF** (`view.js#dup`): while `state.dupTab` — no strand, no GO (solo: its run plays NOT
   COUNTED — OPEN IN ANOTHER TAB, the GO left unspent), no chunk, no end; a running match is adopted as a WATCHER ("PLAYING IN YOUR OTHER
   TAB · WATCHING …"). USE THIS TAB (dupTab → false) = a refresh: the match adopted again — this player's own moves replayed from the node
   — proven, writing on; the other tab yields.
3. **THE CALLOUTS' TIMERS** (`matchhud.js`): a generation counter — a timer from before `reset()` never touches the new count (and
   LAST ONE STANDING's 250 ms retry never paints after a reset).

## GROUP 2 — THE MATCH + STABILITY (JAYWALK + HIGH RISE get the same in their own chats — the inbox note)
1. **S1 A SILENT PHONE** (the owner's call: 18 s + a re-score): the podium records whose ends it had (`game.ends`); when another one lands
   AFTER the final and before the cap's grace, the host's step (`director.js#rescore`) scores the match again from the nodes as they stand
   — `results` + the calls, written with `phase: 'final'` so `host.js#roomPatch` writes the night record again from the new ranks; the
   podium's moment (`phaseStartAt` / `endAt`) kept; once per landing (the judge never runs a tick). An end that changes no row only marks
   itself seen. Every phone's podium is built again on a re-score (`game.rescored`); the late phone's OWN podium is scored from the nodes
   as they stand (`scoredNow`) whenever its run ended after the host's `endAt` — never the host's stale early row.
2. **S6 LEAVERS**: (a) a deliberate LEAVE (the room left) mid-run with a live proven run writes `e` (`w: 'left'`) at once — the writer
   sends it behind the last chunk even closed; (b) a phone with NO ON-TIME GO is ended 3 s after THE FIRST GO's 5 s window
   (`match.js#noRunFor` — the same players `core/proof.js#liveGoers` leaves out), never 18 + 75 s.
3. **S7 A LOST PHONE**: THE LEADER = the deepest rival still HEARD falling (`!over && !lost`); a followed rival is left once silent >
   `LOST_GONE_MS` (2 s — `row.gone`); a gone phone is not "n PLAYING", never in LAST ONE STANDING's way, never a tap's next.
4. **S8 A NON-PARTICIPANT in a solo-mode room**: no GO, no run — "PLAYING — WAIT FOR THE REMATCH" (the stage's note; a drag starts
   nothing — `stage.js#block`); the podium comes as for everyone. BACK on a phone that is not the host → `setState({ quit })` (the
   console's own way out — `ui/final.js`'s), never a silent no-op.
5. **S9 THE PODIUM's FALLBACK**: 3 s after a match podium, no rows in the shared block (its import failed — the block removed — or its
   kits failed) → a plain three-line list in the body (`view.js#plainList`, `.ff-fin-plain`): the winner is always named.
6. **S15 THE CLOCK AFTER A LOCK**: in a match `show()` anchors tick 0 again from the server's time (`o.matchT0` → `view.js#perfOf`) — a
   page clock that slept with the phone no longer resumes a ball where it hung. Proven with a page clock set back 20 s across a hide.

## GROUP 3 — SMALL FIXES FROM FIX A
1. **THE FINISH SHARE CARD ZOOMED IN** (`shot.js` `SHOT_ZOOM.made` 1.14 → 0.5 · `stagingOf().party` · `night.js#shot`): the ball ≈ 70 px
   of the 360-px card (was ≈ 25), the gold ring a stronger, wider stroke (`break-fx.js`: the crisp ring × 1.9), the celebration (the
   dust, the fireworks' sparks, the ring's light) KEPT in the staged frame (it was quieted for FIX A's pulled-back card). Three rounds:
   0.56 (the ring cut off) · 0.74 (the reviewer: the ball too small) · 0.5. Shots `Downloads\NEON\freefall-fixb\cards\v3\`. A solo run
   has no finish (it goes on into THE TRENCH) — the finish card is the match's (and the daily's later).
2. **LAST ONE STANDING's line**: TWO explicit lines (`matchhud.js#last`, `.ff-last span i`), the dot ENDING the first — "CHARLIE HIT THE
   BOTTOM ·" / "KEEP FALLING FOR 2ND" — never leading the second; a 12-letter name fits at 375 + 390 (measured mid-run, `--fixb` 8).
3. **THE FINISH's one long frame at 4× @196**: see SPEED — the warm frame already draws the breakthroughs' pieces + one firework's program
   (`night.js#warm` → `breaks.force`); the tag on that frame (`snd` / `pic`) is a `?floor=196` start's own late decodes (the start waits
   ≤ 600 ms for them).
4. **THE PILLAR at 199 — REAL, fixed**: the core does go into the sand (the bed is one floor under the last floor), but the sand had no
   shade where it goes in — it read as a stub HANGING over the seabed (`cards\f3b-*-42p-pillar-199*.png`). A soft contact shade on the bed
   round the core's foot for a finish (`break-fx.js#sand`, `step(uHole, 0)` — THE TRENCH's mouth untouched).

## THE FRESH-EYES REVIEW (a separate reviewer: the shots cold at phone size + the Group 1–2 diffs read cold)
- **MUST → FIXED:** the duplicate tab's take-over only re-adopted a tab that had been a WATCHER from the start — a tab that yielded MID-RUN
  kept its stale run (a later take-over could append diverging events). Now EVERY edge re-adopts in a match: yield = a watcher, take-over
  = a rejoin from the node; a solo run proven when its tab yielded writes nothing until the take-over.
- **SHOULD → FIXED:** `game.ends` could be `{}` (the database drops it → never re-scored) → `{ _: 1, … }` · `outSrv` was stamped after
  the end hold (the last finisher of an ordinary match read as "late") → stamped at the `e` moment; `scoredNow` keeps the host's podium
  time · the leave `e` gated on the room code only → also on this player's row being gone · `lost` comes after 0.9 s of a held
  projection, so a 3 s network blip fired the once-a-match LAST ONE STANDING → the count + LAST ONE STANDING use `LOST_OUT_MS` = 8 s
  (the WATCH still leaves at 2 s) · the not-here screen still showed the drag hint + DRAG TO SPIN → hidden, the line made the screen's
  word · the podium fallback named nobody in words → "ALICE FELL THE DEEPEST" over the list; a block that lands late removes it; never
  "undefined FLOORS" · S15 re-anchored on 40 ms (the server offset's own jitter) → only a jump over 250 ms · the LAST ONE STANDING shot was
  over the title → re-shot mid-run.
- **NOT TAKEN (named):** the finish card's further asks (2–3 coloured bursts 2–3× bigger, a dark vignette by day) = new celebration art,
  not framing — OPEN FOR BEN · the duplicate-tab banner (app.js — word-by-word wrap, rounded pill shapes, the test slot id showing) is the
  CITY's older code → the inbox · a re-score rebuilds the podium (a share sheet open on it closes) — rare, accepted · the dup-tab shot's
  empty stage = a hidden tab (it draws no frames while hidden — the real behaviour).
- **CLEAN:** `spinAhead` (view only), the spike trial, `?fps=2` (nothing made in a frame), `noRunFor`, S8's code, the re-score's loop / cost.

## SPEED (the Beelink, headless Chromium + ANGLE d3d11, 390 × 844; "4×" = CDP's CPU throttle) — logs `Downloads\NEON\freefall-fixb\speed\`
NOTHING GOT SLOWER — row for row as FIX A:
| what | FIX B | FIX A |
| --- | --- | --- |
| `--perf` (68 rows: areas · tiers · 1× + 4× · both looks · the water · each breakthrough) | 67 / 68 — 56.3–60.3 fps, p95 ≤ 17.2 ms; the red = ONE 250 ms frame (day · THE SPEAKEASY · tier 0 · 1× — the machine's known headless stall) → alone **59.9 fps, worst 17.8 ms** | 67 / 68, the same kind of red |
| `--perf8` (8 ghosts + tags, 24 rows) | 23 / 24 — the red the same single 250 ms frame | 23 / 24 |
| `--stutters` (a whole run, the roof to the trench, 4×) | day **HITCH 0**, worst 17.0 ms · night HITCH 1 (the 250 ms frame @128 — the same spot as the review + FIX A) | day 0 · night 1 |
| THE BOTTOM (a finish) at 4× | 58.7–59.2 fps through it; its long frame(s) at @196 tagged `snd` / `pic` (33–117 ms) | one 83–117 ms frame @196 |
**THE FINISH's frame @196 (G3.3):** it is the FIRST SECOND of a `?floor=196` start — the sounds' decodes + a picture landing behind a
start that waits ≤ 600 ms for them; the warm frame already draws the breakthroughs' pieces + a firework's program. A whole run from the
rooftop has them all long before floor 196 (`--stutters` day HITCH 0 to the trench). Not a finish's own cost — left as measured.

## THE TESTS (local — this pass's own fresh emulators + `serve.mjs --emu`, one suite at a time; logs in the session's scratchpad)
- Unit `node --test tests/*.test.mjs`: **2,846 / 2,846** (new: `tests/freefall-fixb.test.mjs` — S1 the re-score, S6 (b), S7, the
  leave, the switches' static guards). Budgets: the boot unchanged · FREEFALL alone 42 modules / **600 KB of 610** (FIX A: 580 — this
  pass's code + comments; nothing raised).
- The test page `freefall-play.mjs` **198 / 198** (+ `--fixb` 24: the spike trial both ways, `?fps=2`'s `busy`, the switches' line,
  `?ghosts=0`, SMOOTH MOTION at 120 Hz / a drifting 60 Hz / a 36 ms frame, G1 lost context + WATCH, G3 the callout timers, LAST ONE
  STANDING's two lines at 375 + 390) · the share cards `freefall-share.mjs` **255 / 255** · `e2e-freefall.mjs` (FAST) **64 / 64**.
- `e2e-freefall-match.mjs --fast` parts A + D + E: **117 / 120** in the long run — the 3 reds = ONE case (part A: BOB's scripted turn
  onto the red was caught by the darkness first, so the red's card / rank / body checks followed) → part A ALONE **93 / 93**. New
  parts: **D 20 / 20** (a yielded duplicate tab writes nothing, then takes over · S15 a slept page clock → OUT at once · S6 (a) a LEAVE
  writes `e` at once · the podium 3.6 s after the last out · S9 the plain list) · **E 7 / 7** (S8: back after a solo start → the line,
  a drag starts nothing, no node).
- Shared files: only `js/games/preload-graph.js` (its generated comment line — no game's graph changed) → no other game's suite.
  Rules + /api: untouched (no rules or api change). THE HARBOR suite: not touched (the cloud runs it on the tagged push).

## THE LINKS FOR BEN's iPHONE SPEED TEST (in order — ~30 s of play each from the rooftop, a screenshot of each END screen: the summary is on it)
1. https://neonspeakeasy.com/freefall-play?fps=2 — the baseline: the BREAKDOWN says ours / busy / gpu
2. https://neonspeakeasy.com/freefall-play?fps=2&dpr=2 — fewer pixels (tier 2 draws at 3×)
3. https://neonspeakeasy.com/freefall-play?fps=2&bloom=0 — no glow pass
4. https://neonspeakeasy.com/freefall-play?fps=2&fx=0 — no particles / fire / trails
5. https://neonspeakeasy.com/freefall-play?fps=2&wall=0 — the shaft's wall pass skipped
6. https://neonspeakeasy.com/freefall-play?fps=2&tier=1 — the middle tier, pinned
7. https://neonspeakeasy.com/freefall-play?fps=2&dpr=1.5&bloom=0&fx=0&wall=0 — everything off at once (if THIS still stutters, it is not our picture)
8. https://neonspeakeasy.com/freefall-play?fps=2&smooth=0 — the old tower (feel the difference while dragging)

## THE CALLS I MADE (named — yours to overrule)
- THE SPIKE RULE: "helped" = the hitch rate at least HALVED over 10 s of play; a step that did not help rests the rule for the PAGE (the
  prompt said the run — the same phone has the same cause, and every new run would lose the full look for 10 s again).
- SMOOTH MOTION draws the tower at the real time by the turn the NEXT tick will make (no added delay) rather than between the last two
  ticks (a tick behind the finger + the ball) — the same smoothness, and at each tick the drawn angle is exactly the one the landing uses.
- The breakdown's classes: `ours` (our JS in the frames before the gap) · `busy` (the main thread held by other work) · `gpu` (the wait
  with the thread free) — the biggest wins; over the last two gaps (Chromium stamps a blocked frame with its old time).
- S1: a re-score writes `phase: 'final'` again so the night record follows (host.js writes it on that patch); the podium's own time kept.
- S7: the WATCH leaves a silent rival after 2 s; "n PLAYING" + LAST ONE STANDING after 8 s (`LOST_OUT_MS` — the reviewer's network-blip case).
- S8: the line on the stage's note, in the display font; the podium comes for that phone as for everyone.
- S9: the fallback list 3 s after the podium, the winner line over it ("ALICE FELL THE DEEPEST" / "A SHARED FIRST").
- A yielded SOLO tab: its run plays NOT COUNTED — OPEN IN ANOTHER TAB; its GO is never spent (the tab that plays keeps it).
- The finish card: zoom 0.5 + the celebration kept; the pillar: a contact shade, not a geometry change.

## OPEN FOR BEN
0. **THE PASS's TESTS ran against this pass's own servers, all STOPPED at the end** (the emulators + `serve.mjs --emu`; your preview server on :5190 left running).
1. **RE-PUBLISH: nothing** — no `database.rules.json` change (`game.ends` / `game.rescored` ride under `rooms/$code/game`, which has no
   child whitelist).
2. **YOUR iPHONE SPEED TEST** — the links above, in order, ~30 s each from the rooftop, a screenshot of each END screen (the summary + the
   `WHY` / `ON A HITCH` lines are on it). What they tell PART C: mostly `gpu` with `ours` small = the GPU / Safari's compositor (then the
   switch that drops the HITCH count is the cost to cut); `busy` = the main thread (the collector / Safari); `ours` = our code. Also try a
   drag on `?smooth=0` vs the plain link — the tower's steps at a tick are gone.
3. **THE FINISH CARD** (`Downloads\NEON\freefall-fixb\cards\v3\`): zoomed in as you asked; the reviewer would go further — 2–3 coloured
   bursts 2–3× bigger, a dark vignette round the ball by day (new celebration art for PART C or the go-live look pass).
4. **Your phone checks (a hidden match)**: lock your phone 20–30 s mid-match — the ball should be OUT on return (S15) · airplane mode 30 s
   while the other player is already out — your podium should show YOUR real floors, and theirs update when you are back (S1).
5. **For the CITY chat (inbox)**: the duplicate-tab banner (`app.js` `.dup-tab`) wraps word by word at 390, is a rounded pill with a pill
   button (NO PILLS), and shows the slot id on a slot-2 test tab.
6. **For JAYWALK + HIGH RISE (inbox)**: the same match fixes — S1 the re-score, S6 leavers, S7 lost phones, S9 a podium fallback, S15 the
   clock after a lock, the yielded duplicate tab.
