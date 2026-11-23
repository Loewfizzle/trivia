# JAYWALK VARIETY B2 — THE B1 FIXES · AREA TREES + PLANTERS · EDGE DECORATION · WINTER SNOWPLOWS + SALT TRUCKS (Nov 22 2026)

The owner's prompt (Nov 22); his decisions: `docs/games/plan.md` "JAYWALK VARIETY B2" (Step 0); as built: `docs/jaywalk.md` "VARIETY B2".
**A VIEW only — no rules change** (nothing in `database.rules.json` moved). Course rules (v1 + v2 frozen), traffic density / speeds / gaps,
every vehicle's slot + length + hit box, the lane props' count + positions + blocked cells, the replay + the proof: untouched
(`tests/jaywalk-variety-b2.test.mjs`). The inbox: no open entry for JAYWALK at the start, after each group, before the final run. THE CARD LAB:
`lab-export` read — 226 marks, all APPROVE, no open FIX. Shots: `Downloads\NEON\jaywalk-variety-b2\` (white · taps · traffic · trees · edge ·
plows · perf).

## GROUP 1 — THE B1 FIXES (5ceff67e · 555b318e · c18f849a)
1. **WHITE VEHICLES BY DAY** — the vehicles' paint gets a soft off-white for near-white paint + a highlight roll-off past a knee (hue kept, never
   clipped flat); both exact no-ops at night. Before / after at 390, every day look + overcast + snow + night: `white/sheet-before.png` ·
   `white/sheet-after.png` · `white/noon-compare.png` (the bendy's roof panels, the semi's trailer, the box truck's roof, the white van's windows).
2. **THE TAPS** — the cause measured: B1's loader parsed a model inside a frame, **8–17 ms a model at 6× CPU** (`parseGlb`: a DataView call + a
   `pow` per element). Now ~1 ms (typed-array views + a byte table; identical geometry ≤ 6e-8 on every shipped GLB) and ONE loading step a frame
   at the frame's END, none in a busy frame (7 ms) or the frame a hop starts in, frees spread too. THE MEASURE (`--vb2=taps`, the kid on a
   DOWNTOWN grass lane, a real touch TAP every 300 ms for 9 s, every model let go + wanted again twice — the worst load: all files from the
   cache at once; the code before on its own server :5174, the same harness):

   | | taps taken | median tap | worst tap | worst frame while loading | p95 frame while loading |
   | --- | --- | --- | --- | --- | --- |
   | 6× CPU, before | 30 / 30 | 55.5 ms | 207.6 ms | 66.6 ms | 49.9 ms |
   | 6× CPU, **after** | 30 / 30 | 52.7 ms | 182.4 ms | **33.3 ms** | **33.2 ms** |
   | 4× CPU, before | 30 / 30 | 60.1 ms | 78.7 ms | 16.9 ms | 16.8 ms |
   | 4× CPU, **after** | 30 / 30 | 59.3 ms | 84.6 ms | 16.8 ms | 16.8 ms |

   Read honestly: loading no longer costs a frame (at 6× the load frames are back on the 33 ms baseline), no tap is dropped, but the MEDIAN tap
   did not move and the 4× worst is within noise. The 6× worst tap = the page's FIRST gesture building the AudioContext (`engine.js` — profiled:
   ~100 ms at 6×; in the game that gesture happens back in the city). **THE BIGGER COST, found by profiling (c18f849a):** the occluder, bloom + sun
   passes drew on layers the three lights were not on, so three saw the light state change 2–3 times a frame and looked up EVERY material's
   program again, every frame on tier 2, day + night. The lights now sit on every layer: 0.000 % of the pixels differ (six frozen frames, tier 2),
   and the frame's WORK at 4× CPU, tier 2, 8 kids (median ms, three interleaved runs each, B1's code → this pass WITH the new trees + edge
   pieces): **DOWNTOWN noon 8.80 → 7.40 · night 9.50 → 6.70 · THE CANAL noon 6.20 → 5.40.** Measured in throttled Chromium on the Beelink, NOT on
   an iPhone: whether taps FEEL better is the owner's check.
3. **SLIMMER DOWNLOADS** — Kenney's wheels → a 10-sided wheel (tyre + hub), undersides dropped, every triangle no camera angle sees dropped,
   unused vertices pruned: the 15 files **875 → 481 KB** (5ceff67e's message says 896 → 494: bytes ÷ 1000 — these are the KB B1 reported in). Per area
   (the traffic set): the opening / DOWNTOWN **350 → 196** · THE DOCKS / FISH MARKET **220 → 122** · THE RAIL YARD **169 → 90** · THE BRIDGE **151 → 96** ·
   THE CANAL / LIGHTHOUSE **176 → 85** · THE AIRFIELD **237 → 114** KB. NEW on top: each area's trees + edge pieces (the opening 46 · DOWNTOWN 41 · DOCKS /
   FISH 25 · RAIL YARD 5 · BRIDGE 14 · CANAL 26 · LIGHTHOUSE 28 · AIRFIELD 5 KB) + on a winter run the snowplow 50 + the salt truck 22 KB. No visible loss at 390:
   `traffic/close-sheet.png` (every model close, after).
4. **THE TIMING FLAKES** — the three root causes: the Dec 24 match (a phone's seasonal pack — a lazy chunk — missing GO on a loaded box: the
   normal look by J4's rule, so "ONE season for the room" compared a packless phone → the pack's modules in each page's module cache first) ·
   the Dec 24 solo (the greedy test bot dying short of the old best → THE STEADY BOT) · the daily's try 3 (one fixed tap at (195, 520) in a room
   whose dock sits low → the stage's own middle, tapped again until the run starts). The first 3× run caught a SECOND spot of the solo flake (the greedy
   bot dying at lane 5, short of LIAM's line — the YOU ROW's reds followed from it) → THE STEADY BOT there too. Each 3× in a row on the final code: below.
5. **START ROOM** — every trailing note + multi-line doc block of JAYWALK's 29 own preloaded modules → `docs/games/jaywalk-notes.md` (verbatim,
   token-identical): JAYWALK's graph **531.2 → 465.7 KB**; THE START LINE **2,590 → 2,535 KB** of 2,600 (55 KB freed net, after B2's own code; 65 KB of room now).

## GROUPS 2 · 3 · 4 — AREA TREES · EDGE DECORATION · THE WINTER TRUCKS (9c8357e3)
- **THE AREA TREES** (`props-plan.js` + `props.js`, lazy, per area): thin / oak / palm (Kenney Nature Kit) + the tall tree (Mini Forest), CC0, 29
  KB for all four. The mix as built: the opening thin street trees + a few oaks (palms by THE DOCKS' gate) · DOWNTOWN 40 % of its planters as
  thin street trees · THE CANAL oaks + thin · THE LIGHTHOUSE palms + the odd oak. Shots: `trees/sheet-*.png` (each area, summer day + night,
  autumn, winter day + night).
- **THE EDGE DECORATION**: only in an edge-column slot that is EMPTY today; 62 KB for the ten files + seven code-built pieces. Shots:
  `edge/sheet-summer-day-390.png` + `edge/<area>-<look>-390.png`.
- **THE WINTER TRUCKS**: built at asset time (no free model exists); a winter run's van-slot top tenth; amber beacons by night; one spray. Shots:
  `plows/sheet-390.png` (day + night × light + heavy snow).
- Calls (overrule any): the areas with no tree cell get their mix as MARGIN trees (the edge slots); DOWNTOWN's edge hydrants become its street
  furniture (its edge column is always full); THE BRIDGE gets nothing (its edge is the railing); the opening's park keeps ~20 % oaks among its
  thin trees; the rail yard's signals are painted + unlit (only the crossings' signals flash — H5B); the winter trucks take the van slot's top
  tenth of draws (plain vans before — the van slot's plain share there goes from ≥ 58 % to ≥ 48 % on winter days); the lines PLOWED BY A
  SNOWPLOW · SALTED BY A SALT TRUCK; the salt truck keeps the delivery truck's own colours + an orange hopper; the beacons flash ~1.4 a second.

## GROUP 5 — THE MEASURE + THE FINAL RUN (local, the Beelink — my own fresh emulators + `DAILY_TEST=1 JW_CV_SWITCH_MS=0 serve.mjs --emu`; all on the final code)
**THE MEASURE** (`jaywalk-lab.mjs --vb1=perf` — every area with its traffic + trees + edge pieces in, 8 kids, 390 × 844 @3, the world running 7 s at 4× CPU; night + noon, + Dec 24 heavy snow at DOWNTOWN + THE CANAL, + a January night at THE DOCKS + THE AIRFIELD) — **144 / 144**:

| area | worst frame, tier 2 · 1 · 0 (draw calls) | lowest median fps |
| --- | --- | --- |
| the opening | 56 · 31 · 30 | 59.9 |
| THE DOCKS | 74 · 38 · 38 | 59.9 |
| THE FISH MARKET | 58 · 31 · 31 | 59.9 |
| THE RAIL YARD | 60 · 32 · 32 | 59.9 |
| THE BRIDGE | 56 · 31 · 30 | 59.9 |
| DOWNTOWN | 76 · 41 · 41 | 59.9 |
| THE CANAL | 70 · 38 · 38 | 59.9 |
| THE LIGHTHOUSE | 57 · 31 · 30 | 59.9 |
| THE AIRFIELD | 58 · 31 · 30 | 59.9 |

The lines: tier 2 ≤ 96 (worst **76**, DOWNTOWN Dec 24 night), tiers 1 + 0 ≤ 64 (worst **41**, DOWNTOWN Dec 24 noon); **59.9 fps median** at every tier.
- THE LINE: the city 2,070 + JAYWALK 465.7 = **2,535 KB of 2,600**. THE PACKS: autumn **87.2 KB** · winter **120.8 KB** — each of its own 150 (the winter trucks load per area, outside the pack).
- **THE FINAL RUN**: unit **2,614 / 2,614** · `e2e-jaywalk` FAST today **119 / 119** · Dec 24 **120 / 120 ×3 in a row** · Nov 25 **120 / 120** · `e2e-jaywalk-match` FAST today **107 / 107** · Dec 24 **108 / 108 ×3 in a row** · Nov 25 **108 / 108** · `e2e-jaywalk-daily-run` **69 / 69 ×3 in a row** + Dec 24 **69 / 69** + Nov 25 **69 / 69** (it now takes `JW_DAY`) · `jaywalk-lab.mjs` **103 / 103** · `--perf` 139 / 139 · `--j4perf` 24 / 24 · `--jt1perf` 16 / 16 · `--va=perf` 54 / 54 · `--vb1=perf` 144 / 144 · `--vb1=traffic` 55 / 55 · `--vb2=taps` 2 / 2 · smoke **24 / 24** · `/api` **76 / 76** · rules: not touched. The memory guard runs inside the solo + match E2Es' final screens. The look modes (`--vb2=white|trees|edge|desk`) are shots, reviewed by eye; 1440 × 900: `desk/sheet-1440.png`.
- Every server this pass started is stopped (the emulators, :5173, the before-code :5174 + its worktree); the preview server :5190 left up.

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. **TAPS — please feel them on the phone.** The stalls + the per-frame work are measurably down, but the median tap latency in the lab did not move and none of this ran on a real iPhone.
3. **THE DOCKS, THE FISH MARKET + THE BRIDGE show almost no trees.** They have no tree cells, and their edge columns are nearly full of crates, stalls + railings; with counts + positions locked the palms only land in the rare empty slot (on the test seed: none in the first stretch). Turning some edge crates into palms would fix it — your call.
4. DOWNTOWN's traffic set hit the target (196 KB), but its new trees + edge pieces add 41 KB (237 in all).
5. Calls to overrule: DOWNTOWN's edge hydrants became its street furniture (its edge column is always full) · ~20 % oaks among the opening's thin trees · the winter trucks take the van slot's top tenth (a plain van's share there ≥ 58 % → ≥ 48 % on winter days at most; the snowplow is rare: about 1 in 80 lanes) · the lines PLOWED BY A SNOWPLOW · SALTED BY A SALT TRUCK · the salt truck keeps the delivery truck's colours + an orange hopper · the rail yard's signals painted + unlit.
6. The edge pieces sit in the edge columns, the screen's outer ~10 % at 390 (the camera is pinned): side dressing rather than features.
