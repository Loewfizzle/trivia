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
(filled in below)

## SPEED (the Beelink — no slower)
(filled in below)

## THE TESTS
(filled in below)

## THE LINKS FOR BEN's iPHONE SPEED TEST (in order — ~30 s of play each from the rooftop, a screenshot of each END screen: the summary is on it)
1. https://neonspeakeasy.com/freefall-play?fps=2 — the baseline: the BREAKDOWN says ours / busy / gpu
2. https://neonspeakeasy.com/freefall-play?fps=2&dpr=2 — fewer pixels (tier 2 draws at 3×)
3. https://neonspeakeasy.com/freefall-play?fps=2&bloom=0 — no glow pass
4. https://neonspeakeasy.com/freefall-play?fps=2&fx=0 — no particles / fire / trails
5. https://neonspeakeasy.com/freefall-play?fps=2&wall=0 — the shaft's wall pass skipped
6. https://neonspeakeasy.com/freefall-play?fps=2&tier=1 — the middle tier, pinned
7. https://neonspeakeasy.com/freefall-play?fps=2&dpr=1.5&bloom=0&fx=0&wall=0 — everything off at once (if THIS still stutters, it is not our picture)
8. https://neonspeakeasy.com/freefall-play?fps=2&smooth=0 — the old tower (feel the difference while dragging)
