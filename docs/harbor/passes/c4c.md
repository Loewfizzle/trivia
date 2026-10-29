# C4c — THE OWNER'S BUGS + THE MEASURING TOOLS (Oct 29 2026; plan.md "OWNER'S NOTES — OCT 29 (C4b's review)" + "OCT 28 (C4a's review)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## C4c — THE OWNER'S BUGS + THE MEASURING TOOLS (Oct 29 2026; plan.md "OWNER'S NOTES — OCT 29 (C4b's review)" + "OCT 28 (C4a's review)"; behind `?city=2`)

The third cleanup pass from FR4: the owner's C4b review (his iPhone screenshots, Oct 29 7:40–7:54 am) + the measuring tools from his Oct 28
notes. C4d (review-4's code / tests / docs) is next.

### Group 0 — THE BLACKOUT, FOR REAL
C4b's blackout probe passed on a plain September night AT 2× — where the benches' sharp overlays don't exist (crisp.js: only above the city's
2×) and no holiday piece stands. Re-run AT 3× on four dates (e2e group `blackout`, the windows job) it found what the owner saw: the cab
bench **39** vs the dark city round it **23**, the Thanksgiving mum by the hydrant **18** vs **8**. The causes, three:
- **The lamp light PAINTED INTO sprites** — the benches (still.js) + every holiday prop (holidayprops.js / harvest.js) bake the lamps' light
  into their colours at the lamps' level (`L.lampK`, `env.dark`), with no power term. Now **THE STEPPED POWER** (`scene.js#stepPow`: the
  promenade's lamp power in steps 0 · ¼ · ½ · ¾ · 1, a step only on a move ≥ 0.3 or at the ends — a re-light per step, never per frame of
  the stutter) multiplies the lamps' level those sprites are lit with (`hpropsEnv.dark`, `still.items/sprites(…, pw)`, the wildlife's +
  the hydrant's `wlEnv.dark`).
- **The props' TOP pass drew AFTER the veil** (the hydrant's mum + pumpkin, the cab stand's corner piece): it now draws right after the front
  row, before the veil (the car's headlights + the leaves pass over it, as they should).
- **The right maple's crown** (lit by the cab stand's lamp, baked into the 'front' layer) reaches ABOVE the veil's top (the road's): the
  front layer is now darkened through ITS OWN ALPHA (`scene.js#veilFront`: a mask of the layer filled with the night's dark, laid on with
  'multiply' at the veil's level — made once per bake, only during a legendary, freed after).
After: the cab bench **12.8 vs 15.4**, the mum **13.7 vs 8.6** (inside its ring × 1.25 + 8), the maple's crown **18 → 4** (its brightest tenth
6 vs a ring of 5.7) — on all four dates (props probed: Halloween's step pumpkins + bale + hydrant piece, Thanksgiving's stalks + bale +
hydrant mums, December's tree stand). The crown is judged by its p90 too (`p90 ≤ ring × 1.6 + 12`): its mean hid a lit lower right.
- **C4b's rain-signs flake** (`rainSigns 7.4` once): the NIGHT page took the live weather (it rained that run) and the rain's sign lights were
  rebuilt every 300 ms at most, the audit kept a value from before the drain — now `&wx=clear` on that page, the audit reset on its early
  return, and the rain's lights every 100 ms under a legendary (rainfx.js#lights `every`).

### Group 1 — THE OWNER'S BUGS
1. **THE BUS DOOR NEVER SNAPS** (core/harbor-people.js#busDoorAt): the door was a boolean (open from tA + 0.8 to the shut time — one
   frame each way). Now its open amount eases 0 → 1 over 0.7 s and back over 0.85 s ENDING at the shut time (the last rider 6–9 s clear by
   then — the unit test: the fold back starts ≥ 1 s after the last rider, ≤ 0.045 a 60 fps frame); bus.js draws the two leaves FOLDING to the
   frame (narrowing, a crease, their chrome edge turning to us); the sound at the fold back's start; 60 fps while it moves. The cab stand's
   taxi door already eased (vehicles.js#drawDoorOpen smoothsteps its 0.35 s ramps); the back road's cab is smooth (harbor-cabs.js#doorOf);
   the police car + the trucks have no drawn door (their people step from behind the body).
2. **THE DOGS** — the cause: AFTER DARK every dog was mixed 74 % to the night's near-black with a sliver (0.17) of the lamps, next to a walker
   lit like SP4's figures — a black blob on dark cobbles, the leash running to nothing; late October every evening walk is after dark ("I
   haven't seen a dog in a while"). Also: on the iPhone the benches' 3× overlays re-drew the walker in front of them but not the dog; and
   since PROM moved the hydrant to the left curb the sniff stop stood OFF the screen. Fixed: the coat keeps its colour in the lamps' light
   (0.5 to the night, 0.45 of the lamp back), a LIT EDGE along its back + head, a red COLLAR; the dog + its leash re-drawn over the overlays
   (`drawnNear`); the sniff from the hydrant's RIGHT (the walker at + 1.1, the nose at + 0.62 — a gap the hydrant's holiday spot now leaves:
   1.2 → 2.1). The unit test: every dog walker has its dog, on screen whenever the walker is, the sniff with both on screen, dogs by day + evening.
   (A dog passing BEHIND the hydrant's big jack-o'-lantern is hidden for a moment — it is behind it; the owner's crop may have been that.)
3. **THE HAY BALE OFF THE WALL**: the bench-left spot stood 0.47 u inside the speakeasy's side wall (C4b moved the water bench to 1.4 u from
   it). The spot keeps `WALL_CLEAR` 1.3 off the wall (the tree stand is 2.3 wide); where that lands on the bench's end it steps FORWARD to stand
   just in front of the bench's left end; Thanksgiving's mum there moved to the bale's right. `spotProblems` has a new rule (never inside a
   building) + a test over every holiday's pieces (Halloween's bigs + bales, Thanksgiving's parts, the tree stand) at 390 / 402 / 430.
4. **THE HYDRANT CORNER's LAMP** (`core/harbor-light.js#cornerLamp`, `CORNER_LAMP`): the cab stand's twin on the left — unseen ~3 u past the
   left edge at the front curb, k 0.7 (dimmer than the cab's 0.9), its pool k 0.27 (0.36 was 387 vs the shopfront's 361 — the rule: never
   brighter than the shopfront), the shadows falling right; kind 'hidden' (baked with the lamps' ramp, dark in the blackout). The hydrant's
   highlight + its lit side face the lamp at night (fauna.js — they followed the sun's side even at night). Unit test: off screen at every
   width, the ground at the hydrant + its spot ≥ 1.4× without it, never brighter than the shopfront.
5. **THE MAPLE IN EVERY SEASON**: every season's leaves are clamped to the crown's box (core/harbor-trees.js), winter's twigs to 0.97 of it — but
   the box ended 1 pt inside the edge and the wind's sway leans it ~2 pt: cut. The maple f 0.9 → **0.888** (+ the cab stand 0.9025 → 0.889,
   the same 0.34 u — the "cab stand in front of the maple" rule): the box ≥ 4 pt inside at 390 / 402 / 430 (harbor.test.mjs).
6. **THE BENCHES ARE SOLID**: the cab stand's bench had NO obstacle in the planner — the front lane (z ≥ zMin 38.75) ran through its back half.
   Now a rect from its seat's front edge to its back (`front`: its front corners are waypoints too, in front of the lane), the waiter's first
   stop at its front-left corner (`standSpots.up`), the water bench's rect the whole bench (its seat a route's END — a sitter steps in from the
   water side); a group's partner pulled in toward the lead out of a bench (`M.solid`); the sweeper's last pass 39.6 → 40.1; the forced water
   sitter's lead 3 → 5.5 s (the walk round the solid bench's right end). Unit test: nobody's feet inside either footprint except a sitter on it,
   a day + forced cab waiters at 390 / 402 / 430.
7. **THE SIDE DOOR SWINGS OUT toward the doorman** (doors.js `DOORS.side.out`): hinged at its RIGHT jamb (his side — the barber pole is on the
   left), the leaf swung OUT over the steps (its outer face turning to the camera), cut at the top step's tread (`sill` 0.27); the bake's
   strap hinges on the right, the knob on the left, a granite SILL to 0.27 (the live doorway + leaf stop at it — the latch's hand-off showed
   the lit doorway's foot until the bake took over: the e2e snap probe, 387 vs 75 px). Everyone who opens it stands OUTSIDE its arc
   (`DOOR.stepSide` 0.95 → 1.55: guests, the line, the crew, the raid, the witnesses, the trick-or-treaters); one coming out is out of the arc
   before it closes; the step after the door goes on + a little LEFT (it went back toward the wall); the OPEN LEAF is an obstacle (a route from
   the door to the right goes round its free edge — the dancers cut behind it); a partner hurrying to a hiding lead runs. THE DOORMAN holds it
   from just right of its open free edge (`doormanHoldSpot` u1 + 0.12, z0 − 1.5), the guests passing on its left. Unit test: over a Saturday
   night the moving leaf never passes through anyone (nobody within its reach at its own angle ± 12°).

### Group 2 — THE MEASURING TOOLS
- **`&dpr=3`** (review-4 §E 17): `ui/canvas-safe.js#BAKE_CAP` (2, or 3 under the flag, read once at load) — the top tier's dpr + every 2× cap in
  the Harbor (28 sites: the bakes, the neon, the water, the wheel, the boats, the props …) go through it; the crisp layer switches itself off
  (the city is already at the phone's dpr); the moon draws into the city's canvas, so it follows. For the owner's LOOK judgement only.
- **THE PHONE BENCH** (`&bench=1`, js/screens/harbor/bench.js, lazy): a START card (never by itself) → six scenes through the panel's own switch
  (`applyRemote`; the panel's 4-s re-apply held while it runs): a party peak (Sat 11 pm), a party in snow, Halloween's props night, the UFO over a
  crowd + the TR-3B's drain + the chase (started directly, as the debug API does — the TR-3B measured 40 s), a summer storm; 6 s to settle + 20 s
  measured each (~3 min); per scene the frames (fps, p50 / p95 / worst, slow %), the city's work per frame, the tier at start → end + every step
  in it, the canvases' honest total, why it ran at 60; at the end the REPORT on screen (a textarea + COPY) AND to /admin (`api/log.js` kind
  'bench' → "Reports from phones", BENCH); `&benchfast=1` = 10× shorter (the e2e). The laptop's own first sample (headless, 2×, no throttle):
  a party peak 59.8 fps, work 9.8 / 13.1 ms.
- **THE MEMORY GUARD** — the owner's question ("are we throttling ourselves on memory?"): **NO — nothing ever stepped down for memory.**
  Measured (`MEASURE=1 ONLY=bench`, a 3× phone, every tier): at tier 2 the bakes want **28–35 MB** (skyline + stage 20–25, the lit windows 8–10)
  against the old 64 — at 390 / 402 / 430, and far under at tiers 1 + 0. Only **`&dpr=3`** would have hit it (the bakes 49 + 20 MB > 64: the
  old guard would have softened the lit windows). Now `MEM_BUDGET_MB` 24 / 40 / 64 → **64 / 96 / 160** and the guard counts EVERY live canvas
  (`canvasMb()`: every canvas through `safeCtx` / `ctx2d`, held by a WeakRef — review-4 H19's part the guard needs); its verdict in the LOAD
  log ('memory') + `harbor().mem.guard`; the readout's new row: every live canvas · the bakes · the guard. Every live canvas on a night:
  **54–72 MB** (tiers 0–2), **133 MB** at `&dpr=3` (< 15 % of iOS's ~1 GB canvas ceiling).
- **THE CLIMB BACK** (scene.js#perf): the end of a heavy moment (a legendary, the party, the fireworks) RE-ARMS it (`upLock` off, `ups` 0), and
  a locked or spent climb tries again after `UP_RETRY` 3 min; the capped-phone probe kept. Every step goes to its own log (`tierLog`, the
  readout + the bench: the LOAD log stops 15 s after the reveal) — `harbor().tierLog`, `harbor().upLock`.

### Group 3 — THE HARVEST DISPLAY AS A 3D MODEL (a test)
Grok's model was in `Downloads\Grok\Thanksgiving Props\harvest-display\` (textured_mesh.glb 8.1 MB + notes.txt: Grok Imagine → Tencent
Hunyuan3D 2.1, the free Hugging Face Space). Copied to `art/models/harvest/` (+ `credits.txt` = its notes, `source-ref-3.png`). **The licence**
(Tencent Hunyuan 3D 2.1 Community License) does not forbid commercial use on a website — but it **doesn't cover the EU, the UK + South Korea**,
asks that AI-generated content shown publicly be **identified as AI-generated**, and needs a separate licence above 1 M monthly users — the
owner's call before it ships. Baked with the one bake tool (recipe `harvest`, scripts/bake/harvest.mjs: the city camera's real view of the
compass, F 600, z 42.6, 3× × 2 supersampled; the model's footprint is SQUARE + 0.8 as tall → 4.4 u across, 3.5 tall (the drawn horn tip 3.15);
yaw 0 = its front; day = the afternoon sun, night = three implied lamps in front + the violet glow behind) → `assets/city/harvest/` (day + night
webp, 254 × 229, 18 KB). harvest.js draws it in place of the drawn display behind **`&prop=model`** or the HOLIDAYS row **THE HARVEST DISPLAY ·
3D MODEL** (lazy: never fetched without the switch — the e2e `thanks` check), night over day by the darkness, its baked lamp light taken down
with the lamps (the blackout), THE EDISON BULBS (code) along its two ledges (`MODEL_SWAGS`, measured on the bake), the floods' rim from its
sprite. Its credit is READY in js/ui/credits.js (`HARVEST_MODEL_CREDIT`), not listed.
Looked at 390 / 402 / 430 on a build-up night + day (Nov 19): by night the model reads as a solid stepped hay pyramid with its mums, pumpkins +
cornucopia, the bulbs on its ledges; the drawn one reads softer + glowier. By day its hay is browner than the drawn straw.

### Tests
- Unit 862 / 862: + busDoorAt, EVERY LEASH HAS ITS DOG, THE BENCHES ARE SOLID, THE SIDE DOOR SWINGS OUT (harbor-people), the corner lamp
  (harbor-light), the maple ≥ 4 pt in (harbor), NO HOLIDAY PIECE INSIDE A BUILDING (harbor-holidayprops), the bench's pure parts (harbor-bench).
- E2E: new groups `blackout` (the windows job) + `bench` (the wild job); `thanks` + the model's switch; `legends`' night page pinned clear.
  Locally: `blackout` 4/4 (before the fix 0/4) · `legends,holiday` 57/57 · `doors,people,promenade,holiday,blackout` 65/67 → `doors` 2/2 after
  the sill (the other miss: the spider tap, F10) · `bench` 4/4 · `thanks` 9/9.

### Measured
- SPEED (`title-perf.mjs --ab` vs b425789 — the commit before the pass — on :5174; 390 × 844, 4× CPU, one run): **SAME everywhere** — a plain night t2 −2.2 ms (noise ±3.5) · t1 +1.4 (±8.7) · t0 −0.7 (±4.9); a party night t2 +3.6 (±15.2) · t1 −4.4 (±5.2) ·
  t0 +1.3 (±3.2) — C4b's consistent +4.6 at every tier is gone (it was noise); a snowy night t2 +0.6 (±5.0) · t1 +2.3 (one window each) · t0 −0.4
  (±2.9). The new per-frame work: the bench's hook (one null check), the stepped power (one legendPow under a legendary), the front row's mask
  (one drawImage, only in a blackout). The before / after looks at 390 / 402 / 430 (a plain night, Halloween week, the Thanksgiving build-up,
  a snowy winter day): only the pieces above changed.
- Memory: above (Group 2).

### Decisions made (unattended)
- The maple 6 pt in from the edge (f 0.888), not the 1 pt C4b chose: the sway leans the crown ~2 pt; the cab stand moved with it.
- The hydrant's light is an unseen lamp past the left edge (the cab stand's model), not a wider implied pool: a pool wide enough to reach the
  curb lit the whole left third; k 0.7 / pool 0.27 by the shopfront rule.
- The hydrant's holiday spot moved right (+1.2 → +2.1) to leave the sniffing dog a gap; the sniff is from the hydrant's right.
- The water bench's left spot steps FORWARD in front of the bench's left end (it can't fit between the wall + the bench).
- The door's sill is BAKED (0.27, granite) so the live doorway + leaf stop where the bake's door does — no hand-off seam.
- The bench's legendaries start directly (not `&force=`: a forced TR-3B repeats; the panel's own flags stay untouched).
- The model test at 4.4 u (3.5 tall): at 4.8 it stood above the water bench's back by day; its front faces us (yaw 0).
- The memory budget counts every live canvas (stricter) but is 2.5× higher — no layer steps down anywhere measured.

### Known issues
- The spider-tap check (F10) missed once in `holiday` — FR4's known flake, C4d's.
- A dog walking past the hydrant's big holiday piece is hidden for ~1 s (it is behind it); not changed.
- The model has only day + night looks (the drawn display re-lights per golden hour / overcast); its hay reads browner by day.
- The side door's amber spill lays over the out-swung leaf's foot (light over the wood); a small thing at ~2 pt.
- The memory guard's first layout counts nothing else live (nothing exists yet) — every later re-plan counts it.
- The street under the dock still shows no snow on a snowy night (old; ATM).
- LOCALLY the e2e `perf` group stops after its party measurement ("Protocol error (Runtime.callFunctionOn): Promise was collected" at its
  MEMORY cycles' first evaluate) — the commit before the pass does the same on this laptop (Chromium 149, Windows); the cloud ran it green in
  C4b. Not this pass's code; the cloud run is the judge.

### Handoff → C4d (review-4's code / tests / docs)
- Items 12–16 + 18 as planned; H19's readout part is done (the readout's canvases row) — the rest of 14 (the dressing at the tier's dpr, the frost
  pane sized to the glass) is C4d's. The cloud's flakes: F10 (the spider tap) seen again.
- PERF (after ATM) sizes itself from the owner's PHONE BENCH report.
