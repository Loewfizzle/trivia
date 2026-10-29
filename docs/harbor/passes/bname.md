# BNAME — THE CRANE FROM A REAL 3D MODEL + THE TOWER'S SHORTER CYCLE + ONE BAKE TOOL (Oct 28 2026; plan.md "OWNER'S NOTES — OCT 28 (after 9f)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## BNAME — THE CRANE FROM A REAL 3D MODEL + THE TOWER'S SHORTER CYCLE + ONE BAKE TOOL (Oct 28 2026; plan.md "OWNER'S NOTES — OCT 28 (after 9f)"; behind `?city=2`)

(The pass's other half — THE BOARD's PUBLIC NAMES — is in docs/profiles.md.)

### The bake tool
`node scripts/bake-model.mjs "<chromium>" <recipe> [--look DIR] [--model FILE] [--out DIR]` — ONE harness (serves the model + the
recipe's page, launches Playwright's Chromium on SwiftShader, saves) + a RECIPE per model in `scripts/bake/<recipe>.mjs` (`MODEL`,
`OUT`, `page({ THREE })`, `run(ctx)`). `ufo` = `scripts/bake-ufo.mjs`'s page + steps moved over VERBATIM: **proved byte-for-byte** —
the old script re-baked into a scratch folder matched the shipped `assets/city/ufo/` (cmp, all five files: SwiftShader is
deterministic), then the new tool's bake matched too (sha256 body-hi 73b84657…, body-lo ebbcb926…, lights-hi 37156c15…, lights-lo
47dcea12…, ufo.json f7328dcd…). `bake-ufo.mjs` is retired. ADD A MODEL: a new recipe (copy `crane.mjs`: the normalise + the turntable +
the atlases + a json the loader reads), its `.glb` + `credits.txt` in `art/models/<name>/`, its CREDITS entry.

### THE CRANE
- **The model:** "Crane" by J-Toastie (poly.pizza, CC BY 3.0, 9.9k tris, 543 KB) from Grok's SKYLINE folder
  (`Downloads/grok/Skyline/skyline-assets/models/m1-crane-jtoastie.glb`) — copied unedited to `art/models/crane/crane-01-jtoastie.glb`;
  `credits.txt` written from Grok's CREDITS.md (the folder had no credits.txt of its own). Picked from the four cranes there (rendered
  side by side at the camera's angle): Kieran Farr's (Grok's phone pick) is chunky with a fat mast and NO cab; the two Sketchfab ones
  (Chamod 15 MB, KB-674 3 MB) are heavy with finer lattices; J-Toastie's has every part the brief names (the jib, the counter-jib + a
  grey counterweight, the white cab, the trolley + a yellow hook block) and the hand-drawn crane's yellow-jib-on-a-slim-mast look.
- **The bake** (`scripts/bake/crane.mjs`): normalised from its own vertices — the mast's axis (the middle of the vertices 15–45 % up),
  the jib (the farthest point high up → +x, 1 unit), THE SLEWING LINE (going up the mast, the first slice reaching past 1.6 × the mast's
  radius: the cab's floor, 47.6 % up). The camera: far + narrow (nearly flat, as the slot is ~470 units away at F 600), ~9° below (the
  crane's top ~95 pt above the horizon). **TOP** (clipped above the slewing line): 45 slew frames over ±66° (the hand-drawn swing's
  ±1.1 rad), 3° a step, 100 px per jib unit (33 pt at DPR 3), 4× supersampled — DAY + NIGHT atlases with identical silhouettes + each
  frame's anchor / apex / jib tip. **MAST** (clipped below): one strip at a fixed 34° yaw; its lattice PERIOD found by the strip's own
  autocorrelation (11 px), a head + a tile of whole periods ending above the concrete foot (the first look tiled the foot in).
  **The light** (never a studio): DAY — the afternoon sun from the front-left, the blue sky above, the warm street below (exposure 0.82
  keeps the yellow); NIGHT — a dark violet sky, the city's glow behind as a rim, two warm WORK FLOODS from the deck below (9f's site);
  three night passes dimmed it from day-bright gold to a dark crane with warm edges.
- **Bytes:** `assets/city/crane/` = top-day.webp 95 KB + top-night.webp 89 KB + mast.webp 2 KB + crane.json 3 KB = **≈ 180 KB**,
  fetched ONLY while the crane is up (`crane-model.js#craneModel()` is first called from `tower.js#crane`), decoded to bitmaps first.
- **The draw** (`js/screens/harbor/crane-model.js#drawCrane`, from `tower.js#crane`): the same swing as before (`sin(t·0.045 + 1.3)·1.1`
  rad, ~140 s; 0.5 rad with reduced motion) → the two neighbouring frames cross-faded; NIGHT drawn over DAY at `litK('lamps')`; the jib
  sized 24·s pt (9e's), the slewing line at `top + 15·s` (2·s under the frame's top: the cab sits at the top deck, the jib clears it —
  the first placement floated the cab ~10 pt above the frame); the mast's head + tiles down to the slot's foot (the roofs in front
  clip it, as before). THE BEACONS stay code on the model's own apex + jib tip (`beacons()`, shared with the hand-drawn crane: the
  skyline's slow pulse, steady + dimmer beside the NEON letters). `&crane=classic` = the hand-drawn crane (also the stand-in while the
  sprites load or if they fail). `harbor().tower.fx.crane` = `model` · `loading` · `not asked` · `classic`.
- **Looked at** unzoomed at 390 / 402 / 430 (DPR 3) by day + at 22:00 with the site lit, next to `&crane=classic` — three passes
  (1: the mast missing — the loader overwrote the mast's numbers with its image; 2: the night too bright → dimmer floods + exposure;
  3: the cab lowered to the deck). The lattice does NOT mush: the mast reads as a yellow lattice by day, the jib's truss + the
  counterweight + the cab + the hook block read as separate shapes at all three widths; at night a dark-gold crane with warm edges
  where the hand-drawn one was a black silhouette.
- Tests: e2e-harbor `tower` (+2 checks: the model while rising, never asked for while the crane is down — standing / finished — and
  `&crane=classic`).

### THE SHORTER CYCLE (the owner, Oct 28 10:16 am — DECIDED)
`core/harbor-tower.js` CYCLE `{ rise: [6, 1], top: [9, 1], finish: [9, 8], craneOff: [9, 15] }` + `openingDay(y)` = the FIRST Saturday
of OCTOBER at 7 pm (was the second Saturday of November): rising June 1 → Sept 1 (~3 months, was 4.5), topping out Sept 1–8,
finishing (clad, dark — NO neon on the construction, the work-bulb lines only) with the crane down Sept 15, the grand opening Oct 1–7.
The implosion (the third Sunday of April) + the rubble + the cleanup unchanged; the sun's envelope unchanged (the stage only changes the
drawing). The panel's TOWER rows say the new dates. `tests/harbor-tower.test.mjs`: the dates, half-way by mid-July, the crane down
mid-September, the opening the first Saturday of October 2027–2033.

### Decisions made (unattended)
1. **The model:** J-Toastie's (above), not Grok's phone pick (Kieran Farr's) — it has the cab the brief lists and the hand-drawn
   crane's proportions; its finer lattice still reads at 33 pt because the jib is a solid beam with the truss on top.
2. **No credits.txt in Grok's folder:** `art/models/crane/credits.txt` written from Grok's `CREDITS.md` line ("Crane by J-Toastie, CC BY
   3.0 (poly.pizza)" + the source URL); the CREDITS sheet entry uses that line.
3. **Night = lit, not black:** the bake's night is the crane under the site's own work floods (9f) — a dark crane with warm edges,
   brighter than the hand-drawn black silhouette. The owner judges it on the phone (the review list).
4. **The hook's sway is gone** with the model (the baked hook block hangs still; the drawn load + its sway were part of the hand-drawn
   crane only). `&crane=classic` keeps them.
5. **Frames over ±66° only** (the swing the code plays), not a full turn: 45 frames, 180 KB.

### Known issues
- e2e-profiles: about one run in three times out waiting for the podium's plaques (`.rc-plaque.is-in`) — the SAME on the unchanged code
  (a worktree at 95cecaf on :5174: 1 of 3 runs), so it predates BNAME.
- **The cloud (one run each, by hand — the last push was docs only):** `tests` 40731296102 green; `harbor` 40731301014: audio, show,
  city (the tower group's new crane checks), windows, holiday, wild green; `street` 82/83 — THE DANCERS' ARMS NEVER JUMP saw 2 jumps over
  1 rad in 366 frames: the known cloud flake (SP5's section: the trace starts as the circle forms on the cloud's slow frames); BNAME
  touches no dancer code. Not re-run (the two-run rule).

### Handoff → ATM (the FABLE ATMOSPHERE pass)
The plan's next row: ATM (Fable). Owed by the owner first: re-publish `database.rules.json` (the `profiles` read rule), and the look of the
crane by day + at night on his phone (`&crane=classic` to compare).
