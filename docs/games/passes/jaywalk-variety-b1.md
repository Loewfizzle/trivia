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
