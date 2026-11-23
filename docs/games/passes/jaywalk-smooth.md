# JAYWALK SMOOTH — THE FRAME METER · STUTTER-AWARE TIERS · CHEAPER SUN SHADOWS · SMALLER LOADING STEPS (Nov 23 2026)

The owner's prompt (Nov 23); his decision: `docs/games/plan.md` "JAYWALK SMOOTH"; as built: `docs/jaywalk.md` "SMOOTH".
**No look change, no rules change.** Course rules, replay, proof and `database.rules.json` are untouched. The inbox: no open entry for JAYWALK at the
start, after each group, or before the final run. THE CARD LAB: `lab-export` read, 226 marks, no open FIX. Shots + logs: `Downloads\NEON\jaywalk-smooth\`.

**NOT MEASURED ON AN iPHONE.** Everything below ran on the Beelink (Chromium, its Radeon GPU, a throttled CPU). The owner's stutter is on an iPhone's
tiled GPU, which this machine can't reproduce. THE FRAME METER exists so the real answer comes from the real phone.

## GROUP 1 — THE FRAME METER (`js/games/jaywalk/lab-hud.js` + `lab-hud-stats.js`, `&hud=1`)
Top left, clear of the lane counter and the lanes at 390 / 402 / 430 / 1440: fps · DROPS (> 20 ms) and BIG (> 33 ms) in the last 10 s · p95 + worst · tier +
DPR · sun on / off · loading · tier steps. **10 S TEST** records 10 s and keeps the last three summary lines on screen. Lazy, the lab's only: never the live
game, never the start bundle (`tests/jaywalk-smooth.test.mjs`).

## GROUP 2 — THE STUTTER RULE (`kit/tiers.js`, opt-in: `createTiers({ stutter: true })`)
- **6+ dropped frames in 2 s, seen again 3 s later**, steps down. A dropped frame = past 25 ms AND 1.5 × the phone's own median, so a steady 30 Hz Low Power
  cap counts none. One burst (a load, a banner) never counts.
- **The step is a probe:** 4 s later, if the drops did not fall below 60 %, the tier was not the cause → back up once, and the rule rests for the page. No flap
  by construction.
- **JAYWALK turns it on; HIGH RISE + HOLD'EM keep the old rule step for step** (the model test in `highrise-zero-garbage.test.mjs` still holds); PRISM has its own loop.
- 45 s of hopping, every tier change logged (`--smooth=tiers`): 10× CPU 2 → 1 → 0 (old: the same) · 6× stays 2 (old in that run: 2 → 1 → 0 at 27 s) · 4× stays 2. No step back up anywhere.

## GROUP 3 — CHEAPER SUN SHADOWS (`night.js#sunPass`)
- **Measured first:** the depth pass drew **137k triangles a frame** into the map, about as many as the main pass (145k).
- **THE CUT:** a shadow falls away from the camera (`SUN.z < 0`), and past the fog's far edge the ground is pure fog colour. A caster wholly beyond the last
  ground the fog leaves visible can't show, so the pass stops there: **137k → 99k triangles** at DOWNTOWN. The check lives in the sun pass; nothing was added to `put`.
- **No depth written back:** the map's depth buffer is invalidated after the pass. A tiled phone GPU would otherwise store it each frame (about 8 MB). No effect on this machine, so the gain is inferred, not measured.
- On the Beelink's GPU the pass went 0.22 → 0.18 ms and its JS 0.5 → 0.3–0.4 ms.
- **Left alone, by measurement:** the ground shader (its four sun samples cost nothing measurable here: 3.33 ms with, 3.34 without) · a smaller map (not needed) · a cached static map (traffic moves in the box every frame, so it would rarely hit).
- **THE SAME PICTURE** (`--smooth=same`): 56 frozen frames against `&smooth=0`, every look × tier 2 + 1 × four areas, six consecutive ticks on moving cars: **0.0000 % of pixels differ.**

## GROUP 4 — SMALLER LOADING STEPS (`variety.js#piece`, `models.js#parseGlbSteps`)
- A model's parse is split into four pieces; the loader takes **ONE piece a frame** (a slice of a parse, a new model, or a drop), never in a busy frame or as a hop starts. A new model goes live alone, so GPU uploads never stack. A model now takes 5 frames instead of 2.
- **The prompt's ~2 ms box was built first and REJECTED by measurement:** several pieces in one frame left later frames ~60 % slower in 5 of 6 pages at 6× CPU (0 of 6 with one piece a frame, 0 of 8 after the fix). **The cause was not found.**
- Six interleaved runs each, a real tap every 300 ms while the area's models load:

| CPU | taps taken | median tap, before → after | worst frame while loading, before → after |
| --- | --- | --- | --- |
| 4× | 180 / 180 | 53.3 → 52.9 ms | 16.9 → 16.9 ms |
| 6× | 180 / 180 | 56.1 → 52.8 ms | 33.5 → 33.5 ms |

## GROUP 5 — THE TESTS SEE STUTTER (`tests/integration/kit/frame-report.mjs`)
Every perf run (`--perf` · `--j4perf` · `--jt1perf` · `--va=perf` · `--vb1=perf` · HIGH RISE's · PRISM's) prints p50 · p95 · p99 · worst · dropped · big. **The budget: ≤ 1 % dropped and ≤ 1 % big**, from the baseline (154 runs at 4× CPU: at most 0.3 %). Under 120 frames, or on the cloud's GPU-less runner, it only reports.

**THE BEFORE / AFTER** (`--smooth=table:2`: 6× CPU, 390 @3, 8 kids, two runs each, interleaved; before = `&smooth=0`):

| look | where | tier | dropped a run | big a run | p95 ms | worst ms | frame work ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| noon | DOWNTOWN | 2 | 1.5 → 2.0 | 1.5 → 2.0 | 16.8 → 16.8 | 34 → 33 | 9.90 → 9.60 |
| noon | DOWNTOWN | 1 | 1.0 → 2.5 | 1.0 → 2.5 | 16.8 → 16.8 | 33 → 33 | 9.05 → 10.00 |
| noon | area change | 2 | 14.0 → 1.5 | 14.0 → 1.5 | 25.0 → 16.8 | 50 → 33 | 10.75 → 9.45 |
| noon | area change | 1 | 1.5 → 3.0 | 1.5 → 3.0 | 16.8 → 16.8 | 50 → 33 | 10.25 → 9.90 |
| golden | DOWNTOWN | 2 | 54.0 → 2.0 | 54.0 → 2.0 | 25.1 → 16.8 | 50 → 50 | 13.70 → 9.65 |
| golden | DOWNTOWN | 1 | 2.5 → 38.0 | 2.5 → 38.0 | 16.8 → 25.1 | 67 → 50 | 9.50 → 12.90 |
| golden | area change | 2 | 2.0 → 3.5 | 2.0 → 3.5 | 16.8 → 16.8 | 33 → 33 | 9.95 → 9.45 |
| golden | area change | 1 | 3.0 → 1.0 | 3.0 → 1.0 | 16.8 → 16.8 | 50 → 50 | 10.50 → 9.40 |
| night | DOWNTOWN | 2 | 4.0 → 6.5 | 4.0 → 6.5 | 16.8 → 16.8 | 34 → 33 | 8.25 → 8.40 |
| night | DOWNTOWN | 1 | 1.0 → 1.0 | 1.0 → 1.0 | 16.8 → 16.8 | 33 → 33 | 8.70 → 8.20 |
| night | area change | 2 | 2.5 → 3.5 | 2.5 → 3.5 | 16.8 → 16.8 | 50 → 34 | 8.00 → 7.90 |
| night | area change | 1 | 1.0 → 2.0 | 1.0 → 2.0 | 16.8 → 16.8 | 33 → 33 | 7.80 → 7.90 |
| snow | DOWNTOWN | 2 | 49.5 → 1.5 | 49.5 → 1.5 | 33.3 → 16.8 | 34 → 50 | 13.40 → 9.50 |
| snow | DOWNTOWN | 1 | 107.5 → 5.0 | 107.5 → 5.0 | 33.4 → 16.8 | 34 → 34 | 17.25 → 10.75 |
| snow | area change | 2 | 56.0 → 2.0 | 56.0 → 2.0 | 33.4 → 16.8 | 34 → 34 | 13.80 → 9.60 |
| snow | area change | 1 | 51.0 → 2.0 | 51.0 → 2.0 | 25.1 → 16.8 | 34 → 50 | 12.90 → 9.55 |

Totals over 32 runs each: **704 → 154 dropped frames**. Read it honestly: most of that gap is an intermittent slow state (work ~60 % higher for a whole page) that hit **9 of 32 old pages and 1 of 32 new**. Its cause is unknown, so this table is evidence, not proof, of what a phone will feel. In the pages that stayed fast, old and new are about equal, and at 4× CPU neither drops frames.

## GROUP 6 — THE SWITCH + THE FINAL RUN (local, the Beelink, fresh emulators + `DAILY_TEST=1 JW_CV_SWITCH_MS=0 serve.mjs --emu`)
`&smooth=0` on the lab turns off the stutter rule, the sun savings and the loading steps.
- unit (the last run below) · `e2e-jaywalk` FAST today **119 / 119**, Dec 24 **120 / 120**, Nov 25 **120 / 120** · `e2e-jaywalk-match` **107 / 107**, **108 / 108**, **108 / 108** · `e2e-jaywalk-daily-run` **62 / 62** on all three days (B2's 69: seven time-board checks skip when no try reaches lane 50 on the day's course) · the memory guard inside the solo + match E2Es
- `jaywalk-lab.mjs` **103 / 103** · `--perf` 166 / 166 · `--j4perf` 32 / 32 · `--jt1perf` 24 / 24 · `--va=perf` 81 / 81 · `--vb1=perf` 216 / 216 · `--smooth=tiers` 3 / 3 · `--smooth=hud` 24 / 24 · `--smooth=same` 20 / 20
- HIGH RISE: perf night 18 / 18, day 18 / 18 (at most 0.2 % dropped) · `e2e-highrise` FAST 70 / 70 · PRISM: `e2e-prism` 94 / 94 · smoke **24 / 24** · `/api` **76 / 76** · rules: not touched
- Draw calls: worst **76** at tier 2 (line 96), **41** at tiers 1 + 0 (line 64). THE START LINE: JAYWALK's graph 466 → 472 KB, about **2,541 of 2,600 KB**.
- **PRISM's frame-pacing run (`PERF_ONLY=1 e2e-prism`) is RED, and it is NOT this pass:** the same red on the code before it, 4 of 4 runs each. The check sets a tier by hand and PRISM's own cap probe moves it back (tier 1 reads back as 3). PRISM's code is unchanged. Left for PRISM's next pass (the inbox).

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. **The phone check:** the meter's 10 S TEST on the links in the pass summary, new against `&smooth=0`. If DROPS stay high on the new code at noon, the next step is the visual trade-off (cheaper or no sun shadows on phones that can't hold them): your call, with those numbers.
3. Calls to overrule: the stutter rule is on for JAYWALK only · one loading piece a frame instead of the 2 ms box.
