# JAYWALK VARIETY B1 — THE VARIETY A FIXES · ROOM · THE AREA TRAFFIC (Nov 22 2026)

The owner's prompt (Nov 22); his decisions: `docs/games/plan.md` "JAYWALK VARIETY B" (Step 0); as built: `docs/jaywalk.md` "VARIETY B1".
**A VIEW only — no rules change** (nothing in `database.rules.json` moved). Course rules (v1 + v2 frozen), traffic density / speeds / gaps,
every vehicle's slot + length + hit box, the lane props, the replay + the proof: untouched (`tests/jaywalk-variety-b1.test.mjs` THE GAMEPLAY LOCK).
The inbox: no open entry for JAYWALK at the start, after each group, before the final run. THE CARD LAB: `lab-export` read — no open FIX mark.
Shots: `Downloads\NEON\jaywalk-variety-b1\` (seam · sky · haze · shadows · traffic · perf).

## GROUP 1 — THE VARIETY A FIXES (d0c7631c)
1. **THE SHADOW POPS** — both causes checked; (a) was real: the tier governor (`kit/tiers.js`) FLAPPED on a CPU-bound phone. Logged with the real
   governor at 10× CPU (`--vb1=tiers`): 2 → 1 → 0 → **2** → 1 → 0 — the cap probe (PD6) saw "no faster after the step" and called it a 30 Hz Low
   Power cap, jumping back to the top tier; the sun shadows went off · on · off. Fixed in the kit: a cap verdict needs LIGHT work (≤ `CAP_WORK_MS`)
   too. After: 10× → 2 → 1 → 0 once (stays) · 6× → stays 2. (b) the shadow camera already covered 9 back → 33 ahead and drew every frame before the
   scene; now TEXEL-SNAPPED (no swimming) + the sun's angle in whole degrees. And the shadows FADE over 1 s on any tier change (never a snap).
   Proof (`--vb1=shadows`, 30 s of hopping, tier 2, forced → 1 at 10 s, → 2 at 18 s): no jump (worst 0.012 over the fade's pace), the fade-out
   1.16 s, on from the first frame. Strip: `shadows/strip-390.png`.
2. **THE SKYLINE SNOW** — one compositor layer over the band (`sky-snow.js`): two parallax tiles (far = smaller + slower), transform-only,
   light / heavy, day white / night blue-white, still with reduce motion. Shots: `sky/sheet-390.png` (heavy + light × day + night + sunset).
3. **MORE CLEAR VIEW UP TOP** — the day looks' haze starts 2.2 lanes before the sea wall's foot (was 4.4; night unchanged; the far edge the same).
   Noon's fog near 21.3 → 23.2, far 25.0 both. Shots: `haze/sheet-390.png` (noon + night before / after, sunrise · golden · sunset · overcast after).
4. **THE SNOW-START SEAM** — found: NOT the fog, NOT the start area's ground — the ground shader's noise coordinate `mod(lane, 64)` read lane −1
   as 63, so the snow's drifts (+ the grass, the asphalt) jumped at lane 0's lower edge in EVERY look and season (the white snow showed it most).
   `lwOf` wraps only on a gateway lane now. Shots: `seam/sheet-390.png` (before / after: noon heavy · light · none, night heavy · none).

## GROUPS 2 + 3 — ROOM + THE AREA TRAFFIC (cbda170b)
- **ONE PACK PER SEASON** (`season.js#PACKS`): autumn + winter live (each = the core + its own code + its own models ≤ its own 150 KB), spring +
  Halloween rows ready (off). The skyline snow is the winter pack's own lazy chunk. Sizes: below.
- **PER-AREA MODEL LOADING** (`variety.js#createVariety`): the areas from 12 back to 52 ahead wanted; one parse a frame; freed once passed; the
  opening + THE DOCKS from the scene's first frame (the menu / the count), the opening's files warmed in the cartridge preload; a failed file →
  the plain vehicle, asked again 5 s later.
- **THE FLAKY 6d** (e2e-jaywalk — THE CONTROLLER): a watcher records the CONNECTED line the moment it shows; the step waits for that state (20 s
  ceiling), not a fixed 3 s.
- **THE AREA TRAFFIC**: 15 free models (`--only=variety`), the owner's area sets (the bendy bus + the semi in the 3-cell slot, the school bus in the
  box truck's), each scaled to EXACTLY its slot's length; emergency light bars (night, flashing, bloom; unlit by day); THE TAXI (deeper yellow,
  a checker band, a TAXI roof sign lit at night); 11 car colours; plain cars the majority (a 1-cell slot ≥ 2/3 plain everywhere). The end line
  names the vehicle drawn (`causes.js#vehicleAt` ← variety.js KNOWN). Credits: four JAYWALK lines in ☰ → Credits + `assets/jaywalk/variety/CREDITS.md`.
  Calls (overrule any): the lines' words (BUSTED BY A POLICE CAR · SMOKED BY A SPORTS CAR · SCOOPED BY A FORKLIFT · TRASHED BY A GARBAGE TRUCK ·
  RUN OVER BY AN AIRPORT TUG …); the emergency vehicles + the work trucks keep their own colours (only the SUV, the sports sedan + the delivery
  truck take the palette); the tanker recoloured (a red cab, a steel tank — it shipped olive + oxblood); the city bus's white toned down; the
  bars red one side / blue the other, ≈ 2.6 flashes a second; the taxi sign's word in the house font.

## GROUP 4 — THE MEASURE + THE FINAL RUN (local, the Beelink — my own fresh emulators + `DAILY_TEST=1 JW_CV_SWITCH_MS=0 serve.mjs --emu`)
**THE MEASURE** (`jaywalk-lab.mjs --vb1=perf` — every area with its traffic in, 8 kids, 390 × 844 @3, the world running 7 s at 4× CPU; the
worst frame's draw calls · the median fps) — **120 / 120**:
| area | night t2 · t1 · t0 | noon t2 · t1 · t0 |
| --- | --- | --- |
| the opening | 52 · 27 · 26 | 46 · 29 · 28 |
| THE DOCKS | 64 · 33 · 32 | 58 · 35 · 34 |
| THE FISH MARKET | 58 · 29 · 29 | 51 · 31 · 31 |
| THE RAIL YARD | 54 · 27 · 27 | 48 · 29 · 29 |
| THE BRIDGE | 60 · 31 · 31 | 53 · 33 · 33 |
| DOWNTOWN | 71 · 36 · 36 | 64 · 38 · 38 |
| DOWNTOWN, Dec 24 heavy snow | 72 · 37 · 37 | 65 · 39 · 39 |
| THE CANAL | 62 · 32 · 31 | 56 · 34 · 33 |
| THE LIGHTHOUSE | 52 · 27 · 26 | 46 · 29 · 28 |
| THE AIRFIELD | 57 · 29 · 27 | 50 · 31 · 31 |
Every row **59.9 fps median** at every tier (worst single frames ≤ 17 ms but a few 33–50 ms — headless Chromium's known stall on the Beelink — and
one 250 ms at THE RAIL YARD noon tier 1). The lines: tier 2 ≤ 96 (worst **72**), tiers 1 + 0 ≤ 64 (worst **39**). The older checks: `--j4perf`
24 / 24 · `--jt1perf` 16 / 16 · `--va=perf` 54 / 54 · `--perf` (tiers 2 · 1 · 0) all within the lines.
- THE LINE: the city 2,069.6 + JAYWALK 520.7 = **2,590 KB of 2,600** (+ `variety.js`, the scene's hooks; NO model in it). The game alone 48 modules
  / 520.7 KB of 52 / 610 (JT2's ROOM line 520 → 530, a named call).
- THE PACKS: autumn **87.0 KB** (code 54.6 + the pile 32.4) · winter **120.6 KB** (code 67.5 + models 53.1) — each of its own 150.
- THE AREA DOWNLOADS (fetched ahead, per area): the opening / DOWNTOWN 350 KB · THE DOCKS / FISH MARKET 220 · THE RAIL YARD 169 · THE BRIDGE 151 ·
  THE CANAL / LIGHTHOUSE 176 · THE AIRFIELD 237 (875 KB in all).
- **THE FINAL RUN**: unit `node --test tests/*.test.mjs` **2,606 / 2,606** (+ `jaywalk-variety-b1` 11) · `e2e-jaywalk` FAST **119 / 119** (today) · Dec 24
  **120 / 120** · Nov 25 **120 / 120** · `e2e-jaywalk-match` FAST **107 / 107** · Dec 24 **108 / 108** · Nov 25 **108 / 108** · `e2e-jaywalk-daily-run`
  **69 / 69** · `jaywalk-lab.mjs` **103 / 103** · `--j4perf` 24 / 24 · `--jt1perf` 16 / 16 · `--va=perf` 54 / 54 · `--perf` 134 (its two failures =
  the two lab checks below, fixed) · `--vb1=perf` 120 / 120 · `--vb1=traffic` 55 / 55 · smoke **24 / 24** · `/api` `server.test.mjs` **76 / 76** ·
  rules: not touched.
  The first pass of the final run had five reds: three were the new traffic meeting old checks (fixed — the lab's 14–48 draw-call sanity range →
  64; "every vehicle names itself" demanded all 20 inside lanes 6–260 → the plain five + ≥ 4 area models, never a wrong name; e2e-jaywalk rebuilt the
  end line in Node where no area model is "in" → the plain OR the area's name), and three timing ones that went green on the re-run with no
  change: Dec 24 match (one of three phones started without the winter models — J4's "not in by the start" rule), Dec 24 solo (the NEW RECORD
  flash), the daily run's try 3 (not started within 30 s).
- Every server this pass started is stopped (the emulators, :5173, the before-code :5174 + its worktree); the preview server :5190 left up.

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. The calls above (the lines' words, which vehicles keep their own colours, the tanker + city bus recolours, the bar's colours + pace, the
   tier probe's fix in the shared kit — HIGH RISE + PRISM get it too).
3. THE LINE: 2,590 of 2,600 KB — B2 has ~10 KB of start-bundle room; its trees + planters + edge pieces + snowplows go in the area loader / the
   winter pack (winter now 120.6 of 150).
4. The area downloads are 150–350 KB an area (Kenney's Car Kit wheels are most of each file's triangles) — if a phone on a slow line shows plain
   cars for a stretch, slimming the wheels at build time is the lever.
