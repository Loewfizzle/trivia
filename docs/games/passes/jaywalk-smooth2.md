# JAYWALK SMOOTH 2 — THE AUTUMN HITCH · WINTER CHECK · THE ONE-OFF SPIKE · METER CHECK (Nov 23 2026)

The owner's prompt (Nov 23) and his iPhone numbers; his decision: `docs/games/plan.md` "JAYWALK SMOOTH 2"; as built: `docs/jaywalk.md` "SMOOTH 2".
**No look change, no rules change.** Course rules, replay, proof and `database.rules.json` are untouched. The inbox: no open entry for JAYWALK at the start, after each group, or before the final run. THE CARD LAB: `lab-export` read, 226 marks, no open FIX. Shots + tables: `Downloads\NEON\jaywalk-smooth2\`.

**NOT MEASURED ON AN iPHONE, AND THE AUTUMN STALL DID NOT REPRODUCE HERE.** On the Beelink, neither Chromium nor real WebKit shows a periodic ~35 ms autumn stall. The fixes below remove everything autumn was measured to add, but only the owner's meter can say whether his BIG frames went down.

## GROUP 1 — THE AUTUMN HITCH
**What was measured, autumn noon against summer noon (tier 2):**
- Played runs, Chromium, 390 @3, 4x CPU, four runs of 20 s each: **10 BIG frames against 8** in about 4,790 frames. No autumn stall.
- Real JavaScriptCore (Playwright WebKit), the JS side of each frame, three runs of 25 s: mean **2.17 against 2.09 ms**, worst **10 against 7 ms**. A 35 ms JS or garbage-collection pause is not there on this CPU.
- GPU timer queries per shader: autumn costs **4.15 against 3.70 ms** a frame, nearly all of it in the ground shader (2.30 against 1.93 ms).
- No timer, texture upload or shader compile belongs to the autumn layer.

**What changed:**
- The autumn ground shader skips work that can't show (a leaf's colour outside its shape, the lower leaf under a whole one, gutter leaves away from the curb, the gold noise on paving): ground **2.30 → 2.17 ms**, frame **4.15 → 4.01 ms** (summer 3.72).
- The seasonal frame paths make no closures, string keys, option objects or literal lists. Particles are pooled.
- The scene's hot loops lost their rest arrays, spreads, per-car strings and destructuring: **152 → 125 KB a frame** in V8's sampler. Much of what remains is V8 boxing numbers, which JavaScriptCore does not do, so this overstates the phone's garbage.

## GROUP 2 — WINTER + THE FIREWORKS
Dec 24 heavy, Jan 20 light and the Dec 31 finale, noon + night, tiers 2 + 1: **none adds BIG frames over summer** (table below). Nothing needed fixing beyond the shared garbage work. **To watch:** winter's ground costs the most GPU, **4.51 against 3.70 ms** a frame by day and 4.26 against 3.58 by night. If the phone shows winter BIG frames, start there.

## GROUP 3 — THE ONE-OFF SPIKE (found + fixed)
A fresh page, the bot from lane 0 at 4x CPU. **Before: 50 + 33 + 83 ms frames at lanes 39–50, every run. After: at most one 33 ms frame.** Three first-time stalls:
1. **The gate sign's pixel read-back** (`night.js#gateShow`): 44 ms at 4x CPU as each area's sign came up. A hidden sign is now just drawn again on its next approach, which also heals a wiped canvas.
2. **The first area banner** (lane 50, THE DOCKS, where the owner saw 122 ms): the GPU built its paint on the spot, 83–88 ms. It now paints once, all but invisible, before anyone plays (`arrival.js`).
3. **The flyers' shaders** linked mid-run (lane ~142). Three invisible stand-ins link them at the scene's quiet warm frame: **0 links during a run**.

The 122 ms frame itself was not reproduced on an iPhone; these are the sources found at that spot.

## GROUP 4 — ARE THE SMALL DROPS REAL?
- **The old meter was part of it, in WebKit:** DROPS per 10 s **4.7 with no meter · 9.0 with the old meter · 4.3 with the new one** (three runs each). In Chromium all three are under 1.
- **The live game = the lab:** the same hidden timing log, kid standing, 6 s, four runs: live **0.0** drops, lab with no meter **0.3**.
- **The meter now** repaints once a second, never during a 10 S TEST, in its own layer. Its line adds **LATE** (a late callback whose next frame wins the time back: no picture lost) and **JS** (BIG frames that followed 14 ms or more of JS; the rest came from the GPU or the system).
- The owner's p95 of 19–20 ms can't be whole lost frames on a 60 Hz beat (those are 33 ms), so many of his DROPS are probably timing jitter. LATE will show it on the phone. 120 Hz ProMotion can't be tested here.

## GROUP 5 — THE GATE + THE FINAL RUN (local, the Beelink, fresh emulators + `DAILY_TEST=1 JW_CV_SWITCH_MS=0 serve.mjs --emu`)
`--smooth=season[:reps:rate]`: a played run in every season, noon + night, tiers 2 + 1; a season fails if it adds BIG frames over summer's (more than 3 a run). The cloud only reports.

| look | tier | season | frames | BIG a run | dropped a run | p99 ms | worst ms | frame work ms (p50 / p99) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| noon | 2 | summer | 720 | 0.5 | 0.5 | 16.9 | 33 | 5.0 / 9.9 |
| noon | 2 | autumn | 721 | 0.0 | 0.0 | 16.9 | 17 | 6.0 / 10.3 |
| noon | 2 | dec 24 heavy | 721 | 0.0 | 0.0 | 16.8 | 17 | 5.4 / 9.9 |
| noon | 2 | jan 20 light | 721 | 0.5 | 0.5 | 16.9 | 33 | 5.6 / 10.5 |
| noon | 2 | dec 31 finale | 721 | 0.0 | 0.0 | 16.9 | 17 | 5.7 / 9.9 |
| noon | 1 | summer | 721 | 0.0 | 0.0 | 16.9 | 17 | 5.5 / 10.2 |
| noon | 1 | autumn | 721 | 0.5 | 0.5 | 16.9 | 33 | 5.6 / 10.2 |
| noon | 1 | dec 24 heavy | 720 | 1.0 | 1.0 | 16.9 | 34 | 6.3 / 11.6 |
| noon | 1 | jan 20 light | 720 | 1.0 | 1.0 | 16.9 | 34 | 6.2 / 11.8 |
| noon | 1 | dec 31 finale | 721 | 0.5 | 0.5 | 16.9 | 33 | 6.8 / 11.5 |
| night | 2 | summer | 720 | 0.0 | 0.0 | 16.8 | 17 | 6.2 / 11.4 |
| night | 2 | autumn | 721 | 0.5 | 0.5 | 16.9 | 33 | 6.7 / 12.3 |
| night | 2 | dec 24 heavy | 721 | 0.0 | 0.0 | 16.8 | 17 | 6.1 / 11.9 |
| night | 2 | jan 20 light | 721 | 0.0 | 0.0 | 16.9 | 17 | 6.3 / 11.5 |
| night | 2 | dec 31 finale | 721 | 0.0 | 0.0 | 16.9 | 17 | 7.1 / 12.9 |
| night | 1 | summer | 722 | 0.0 | 0.0 | 16.9 | 17 | 4.7 / 9.9 |
| night | 1 | autumn | 722 | 0.0 | 0.0 | 16.9 | 17 | 5.3 / 10.3 |
| night | 1 | dec 24 heavy | 721 | 0.0 | 0.0 | 16.9 | 17 | 5.9 / 11.0 |
| night | 1 | jan 20 light | 721 | 0.0 | 0.0 | 16.8 | 17 | 5.7 / 10.7 |
| night | 1 | dec 31 finale | 721 | 0.0 | 0.0 | 16.9 | 17 | 6.9 / 12.3 |

- unit **2,631 / 2,631** · `e2e-jaywalk` FAST today **119 / 119**, Dec 24 **120 / 120**, Nov 25 **120 / 120** (final-screen memory 7.6 MB of 20) · `e2e-jaywalk-match` **107 / 107**, **108 / 108**, **108 / 108** · `e2e-jaywalk-daily-run` **69 / 69** on all three days
- `jaywalk-lab.mjs` **103 / 103** · `--perf` 161 / 161 + the 5 shot-run checks in `--look` 7 / 7 · `--j4perf` 32 / 32 · `--jt1perf` 24 / 24 · `--va=perf` 81 / 81 · `--vb1=perf` 216 / 216 · `--smooth=hud` 24 / 24 · `--smooth=tiers` 3 / 3 · `--smooth=season` 16 / 16
- **THE SAME PICTURE** (`--smooth=same`, against the code before on its own server): **154 frozen frames, 11 looks (every season, day + night), tiers 2 + 1, four areas: 0.0000 % of pixels differ.**
- smoke **24 / 24** · `/api` **76 / 76** · rules: not touched

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. **The phone check:** three 10 S TESTs on each link in the pass summary. If autumn's BIG stays above summer's with **JS 0**, the stall is the GPU or the system, not the game's code, and the next step is a visual trade-off (a cheaper autumn ground on phones that can't hold it): your call, with those numbers.
