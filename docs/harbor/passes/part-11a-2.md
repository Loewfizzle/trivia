# PART 11a-2 — THANKSGIVING + THE PARADE (+ HALLOWEEN's LAST TOUCHES, THE BOSS's TWEAKS, THE UFO REDESIGNED, THE WITCH SMOOTH, BLACK FRIDAY) (Oct 26–27 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 11a-2 — THANKSGIVING + THE PARADE (+ HALLOWEEN's LAST TOUCHES, THE BOSS's TWEAKS, THE UFO REDESIGNED, THE WITCH SMOOTH, BLACK FRIDAY) (Oct 26–27 2026; behind `?city=2`)
The plan's 11a-2 + the owner's notes (plan.md "OWNER'S NOTES — OCT 26 (after SP5)") + four add-ons mid-run (the giant BITCOIN pumpkin, BIG
HOLIDAY PIECES CHANGE OFF-CAMERA, the abduction UFO redesigned, the witch's chop). Run unattended; the calls made are in "Decisions made".

### Group 0 — HALLOWEEN's LAST TOUCHES + THE BOSS's TWEAKS
- **THE GIANT BITCOIN PUMPKIN** (`screens/harbor/giant.js`, `core/harbor-holidayprops.js#GIANT / giantPiece / giantDecor`; the owner: "huge,
  impressive … carve the Bitcoin B, well lit from within by fire … twice the mockup's size"): a ray-marched 3D pumpkin (16 ribs, a warty rind,
  a curled stem) on a ragged straw bed on the compass, ~110 pt across at 402 — baked per pixel in ≤ 4 ms slices (≈ 180 ms over ~40 frames,
  never a frame over budget; sprites capped at dpr 2). The ₿ is CARVED through the rind (a knife's rough walls, the bars above + below), lit
  from inside by a FIRE (three flicker states cross-faded, a warm pool on the cobbles, its light on the people round it — `pointLight()`),
  amber candle jars on the bed's front edge, a warty + a white pumpkin with gourds beside it. The calendar (`core/harbor-holiday.js#GIANT_DAYS`):
  there from Oct 20 (uncarved), carved from 4 am Oct 28, lit nightly, gone Nov 1. The corner jack-o'-lantern that stood in front of it
  retired (`BIG_PIECES`: the hydrant + the bench's left end).
- **THE DANCE RINGS IT** (`core/harbor-routines.js#RING / ringAt`, `core/harbor-people.js#planRing`): the hourly party dance (Halloween night,
  and any night a centrepiece stands — the Thanksgiving harvest display too) walks an OVAL round it instead of the compass's circle; walkers
  route round its floor (12 waypoints on a big circle; the event map kept through `mapAt`).
- **BIG HOLIDAY PIECES CHANGE OFF-CAMERA** (the owner's rule, every holiday): `core/harbor-holiday.js#latchBig` + `BIG_KEYS` (the giant, the big
  pumpkins, the harvest display, the centrepiece, the spot pieces, the stalks, the mums, the bales) — a big piece appears / goes / moves to its
  next stage ONLY at a load, a return from the background (hidden → visible) or a jump of the clock (> 90 s: a preview, the panel). Never on
  screen. Exceptions: scenes meant to be WATCHED (Black Friday's crew stringing the lights — below). The tree stand latches the same way.
- **The letter tap's race hum** ≤ ~1.5 s, never stacked (`title.js#NEON_SOUND`: a tap's 1.2 s strike + 0.3 up / 0.35 hold / 1.1 fade, a
  350 ms cooldown, a new strike stops the last one's hum); the dusk catch 2.14 s; the surge has no sound (checked). `ambience.js#playNeon` cuts
  at its `dur` with a 0.35 s tail.
- **THE BOSS's SHADOW at the party** (`core/harbor-moments.js#BOSS_WATCH / bossWatchPlan / bossWatchAt`): he walks UP to the shade from the
  room's depth (blurred far → sharp near), stands ~15–18 min (a head turn now and then, his weight shifting, the cigar's ember to his mouth),
  walks AWAY for ~10–13 min, back… ~1 h 45 at the party's peak; `&force=boss-watch` = a demo cycle (2 s → 40 s up → 12 s away).
- **The violet SPADE** bolder (one non-zero union: the body, two lobes, a flared stem — readable at phone size); **the boss's TV** a lighter,
  glowing blue (`TV_BLUE`) × 1.18. Withdrawn by the owner: the normal-night room stays as it is. Not touched (parked): the cash count, the
  poker-table window.
- **THE ABDUCTION UFO REDESIGNED** (`screens/harbor/legends.js` — the CRAFT + THE BEAM ONLY): a per-pixel GUNMETAL saucer (Fresnel metal, seams,
  brushed grain, a specular key off the moon, a smoked-glass dome with its own highlight; the belly never seen), a RING of ice-white lights
  RACING round its rim (30 slots: calm while it hovers, accelerating as it lifts the person, a flash of all of them as he's taken, slowing
  as it leaves), a pale GREEN beam with dust motes rising in it. THE ABDUCTION ITSELF IS BYTE-IDENTICAL: the rig, the walker, the figure,
  `saucerAt`, `bellyY`, `ufoAt` untouched — proved by a script + `docs/harbor/refs/ufo/abduction-before-after.jpg` (the lift at 4 / 14 /
  20.5 s, before | after).
- **THE WITCH NO LONGER CHOPPY**: the cause was NOT her canvases (the brief's guess) but her clock — the Halloween sky read the local time in
  WHOLE SECONDS (`LK.local`), so she stood still for most frames and jumped ~126 pt once a second. Fixed: `scene.js#fineLocal()` (the local
  time to the millisecond for the sky's holiday pieces) + one canvas instead of two (rims, then the silhouette; dpr ≤ 2, grown, never
  re-created; her ripple repainted ~30 fps). Before (4× CPU, a real pass): 97 % of frames still, the biggest jump 126 pt; after: 0 % still,
  median 4 pt, max 15–23 pt; her draw 1.29 → 1.12 ms.

### Group 1 — THE NOVEMBER BUILD-UP
- **THE CALENDAR**: a THANKSGIVING row (`HOLIDAY_TABLE`: the build-up Nov 4 → the Wednesday's 5:30 pm — 'build'; that evening → Thursday 3 am
  — 'night' (`eve`: THE HOMECOMING, below); the day → Friday 4 am — 'day'). `thanksgivingPieces(H, { hour })` grows BY DATE: mums (1 → 4) →
  straw bales (stage ≥ .09) → corn stalks round the lamp posts (≥ .18) → the spots' pumpkins (0 → 3 by .5) → the harvest display (≥ .42,
  ~Nov 13) → the sign's wreath ((stage − .5) / .42: up Nov 15 → 25) → amber tubes on the day; the raker (to Nov 22, mornings), cider at the
  cart, the geese ×2.2, the chimneys + the pies + the tables on the day. `holidaySeason`: the trees HOLD their peak autumn crown through the
  build-up + the day (the real season's bare trees from Black Friday).
- **THE HARVEST DISPLAY** on the centre circle (`screens/harbor/harvest.js`): a three-tier straw-bale pyramid (fibres, twine), pumpkins + gourds
  + potted mums on its ledges + at its foot, a woven wicker CORNUCOPIA on top spilling grapes, apples + gourds, warm Edison bulbs swagged along
  the ledges after dark. Rung by the dance on the homecoming night.
- **THE SPOT PIECES** (`core/harbor-holidayprops.js#thanksgivingSpots`, the dressing spots): a bale with pumpkins + gourds + a white pumpkin + a
  rust mum at the bench's left end; mums + a squat pumpkin by the hydrant; CORN-STALK BUNDLES tied round both tall lamp posts (+ a mum, a
  warty pumpkin) + the front globe post.
- **THE SIGN's HARVEST WREATH** (`screens/harbor/dress-thanksgiving.js`, the sign decoration system): a real wreath framing the O — a grapevine
  ring, plump golden wheat, 48 lobed oak leaves in rust / red / gold, five little gourds, a raffia bow, warm bulbs (glowing after dark) — and
  wheat-and-leaf swags over N, E, N. No cartoon turkey. `&force=sign-thanks`.
- **THE LEAF RAKER** (`SHOWS.raker`: Nov 4 → 22, late mornings Mon–Sat; `PLAN.raker`): a groundskeeper in a rust coat rakes the fallen leaves
  under two trees into piles that GROW as he works (`workers.js#leafPile`), bags them, carries the sack off. `&force=work-raker`.
- **THE CART's HOT CIDER** chalkboard (`props.js#ciderBoard`).

### Group 2 — THE PARADE SYSTEM (`core/harbor-parade.js`, PURE + `tests/harbor-parade.test.mjs`) + THANKSGIVING's BALLOON PARADE
- **The system** (reusable — the BIRTHDAY EVENT next): `PARADE` (the pace 0.78 u/s, the two files on the near lane z 55.5 / 56.9, the lead-in,
  the gap between units, the kerb, the crowd's size) · `UNIT` (each kind's length: band, balloon, float) · `PARADES[id]` (its start hour,
  length, CYCLE of units, balloons' order) → `paradeWindow(t, { off, forceAt })` (on the clock — joined mid-way), `paradeUnits(W)` (each unit's
  start, length, kind, balloon), `unitsAt` / `unitHead` (where each is now), `unitPeople(u)` (the band's drum major, brass, tuba, drums; a
  balloon's handlers + their rope k; a float's farmers), `paradeCrowd(...)` (spectators at the kerb + their CHEER windows as each balloon
  passes), `paradeHold(W)` (the traffic held), `balloonMotion(kind, t, wind)` (sway + bob in the REAL wind). The marchers + the crowd are
  people visits (`core/harbor-people.js#paradeVisit / crowdVisit`; `noCross` while it runs). The workers' trucks stay home that day.
- **HOW TO ADD A PARADE**: a row in `PARADES` (from, len, cycle, balloons) + the day that calls `paradeWindow` with it (the people planner's
  `holidayVisits`, `scene.js#paradeItems` + `#paraSound`); a new BALLOON = its painter in `parade.js#paintBalloon` + `BALLOONS[kind]` (w, h,
  lift, handlers) + its rope anchors; a new UNIT kind = `UNIT[kind]` + its people in `unitPeople` + its look in `folk.js#paradeLook`. The
  route: the waterside road (the near lane, in from behind the speakeasy → off the right edge); the front street under the dock is there for
  a parade that hides the dock (not used by Thanksgiving).
- **THANKSGIVING MORNING 9:00 → ~11:25** (`&force=parade` — from its start): GIANT BALLOONS (`screens/harbor/parade.js`, original, unbranded): a
  TURKEY with its fanned tail, a ribbed PUMPKIN with its curling vine, an ACORN under its scaled cap, a CIDER MUG with a cinnamon stick + its
  steam — inflated volumes, seams, sheen, their shadows on the road, swaying in the wind on their handlers' ropes; the handlers in cream
  coveralls + navy caps; a MARCHING BAND in red tunics + white-plumed shakos (the drum major's mace, brass, a tuba, drums); a HARVEST FLOAT; the
  crowd at the kerb waving + cheering as each balloon passes; no traffic.
- **Its sounds** (`docs/audio.md#11a-2`): the crowd's bed, a cheer per balloon at the middle, the 1923 band two blocks away following the
  nearest band, the balloons' fabric — each panned.

### Group 3 — THE HOMECOMING, THANKSGIVING's DAY, BLACK FRIDAY
- **THE HOMECOMING** (the night before Thanksgiving is a party night): `core/party.js#partyDow` — that Wednesday counts as a Friday (its
  evening), Thanksgiving as a Sunday (only the party's small hours; its own evening stays quiet). Every planner asking "a party night?" asks
  with the date now (`harbor-moments.js#partyAtT` / `partyAt(dow, h, key)`): the party show, the sky beams, the window party, the line, the
  roof, the cabs, the raid's dice, the hourly dance (RINGING the harvest display). Both cities (the title's district parties that night too).
- **THANKSGIVING's DAY**: the sign's tubes AMBER, the wheel + the roof's café lights in HARVEST golds (`strings.js` / `wheel.js` — the schemes
  the light rules named were missing), ~2 in 5 of the skyline's lit windows the amber of a family dinner after dark (`lights.js#AMBERW`; the
  lit-window tint was hard-wired to Halloween's green — `holLit` names the holiday now), CHIMNEY SMOKE from late morning
  (`screens/harbor/chimneys.js` — the speakeasy's own chimney + the near skyline's roof vents, leaning downwind in the real wind, lit grey after
  dark; reusable for 9b's winter: `chimneys.set(k)`; `&force=chimneys`), people carrying PIES to dinner (noon → 6:30 pm, ~1 in 3), the window
  scenes (WINDOWS below), the workers' trucks home (`harbor-workers.js#holidayOff`: the parade has the road).
- **BLACK FRIDAY** (`core/harbor-xmas.js`, PURE + `tests/harbor-xmas.test.mjs`): Thanksgiving's dressing gone overnight (4 am; the big pieces at
  the next load). `xmasPrelude(lc, { dusk })` → the SHOPPING RUSH (6:30 am → 9 pm: more people out, most hurrying — `mixNow`'s `rush`: a stroll
  → a walk, a walk → brisk — with SHOPPING BAGS + wrapped BOXES), the CHRISTMAS-TREE STAND by the bench (`screens/harbor/treestand.js`: firs on
  a timber rack, two in cross-stands, FRESH TREES, a hurricane lantern glowing after dark; LATCHED; Black Friday 7:30 am → Christmas Eve 9 pm;
  `&force=treestand`), the banner plane's SALE (`core/harbor-sky.js#SALE_DAYS`: three passes of BLACK FRIDAY SALE · EVERYTHING MUST GO at 11;
  two of three random banners carry the sale lines — no store, no brand; `&force=shoppers` = the rush any day) and **THE FIRST CHRISTMAS CREW**
  (`SHOWS.xlights` 9:45 → 12:15, `PLAN.xlights`; `&force=work-xlights`): the electrician's van (HOLIDAY LIGHTING) at the stop; two riggers
  carry cartons of strings in at the side door, let the WINDOW WASHERS' RIG down the front and work it bay by bay; the third strings the
  awning's edge from his stepladder (two stands), loads the ladder + drives the van off; the riggers walk off when the rig is wound back up.
  **The strings appear as they work** (`sillsAt(k)` — the rig's order; a scene meant to be WATCHED): big C9 bulbs (red, green, gold, blue,
  orange) on a green wire, swagged along every upper sill, under the cornice + along the awning (`screens/harbor/xlights.js` — one painter for
  the crew's prop + the evenings after). From that evening they SWITCH ON at dusk (eased; × the facade's power) every evening to Jan 6, the
  roof's café lights in Christmas colours with them (`&force=xmas-lights`).
- The title's sign was AMBER on Black Friday: City 1.0's calendar keeps Thanksgiving "full" Wed → Fri — the Harbor ignores City 1.0's
  Thanksgiving now, as it does its Halloween.
- **THE WINDOWS on Thanksgiving** (a fork; `core/harbor-moments.js` + `windows.js`; a new rarity `'holiday'` the random draws never pick, gated
  by the DATE alone — the fourth Thursday — played as back-to-back 15-min chunks so anyone opening at 4 or 7 pm walks straight into them; random
  moments keep out of their windows while they run; never the boss's room): **THE FAMILY TABLE** in the `back` window 3:00 → 9:30 pm — a
  candlelit dining room in the 2.5D box, the turkey on its platter, a family of four lit from below by the candles (the lit-figure kit), a
  64-s loop of talk, a dish passed, forks raised, a laugh, a toast; they walk in through the room's depth in the first chunk + out in the last
  (`&force=window-table`). **THE GAME ON TV** in the `jazz` window 12:30 → 7 pm — a wooden set with a green field + two teams' dots running,
  three on a red couch lit by the screen, a 48-s loop: the drive, a sip, a SCORE (the screen flashes, all three jump up, arms high); the sax
  player stands aside while it's on (`&force=window-football`). Their panel rows come from the moment list (WINDOWS · THANKSGIVING); PLAY ALL
  shows each for 75 s.

### Previews + the panel
- THE PREVIEW PANEL: HOLIDAYS → THANKSGIVING (the date jumps thanks-10, thanks-20, thanks-wed, thanksgiving, blackfriday + PARADE, SIGN ·
  HARVEST WREATH, CHIMNEY SMOKE), BLACK FRIDAY (THE FIRST CHRISTMAS STRINGS, THE CHRISTMAS-TREE STAND, THE BLACK FRIDAY RUSH), WORKERS →
  THE LEAF RAKER + THE CHRISTMAS LIGHTS CREW, WINDOWS → the table + the game. `&when=2026-11-01…28` walks the build-up day by day.

### Tests
- Unit: `tests/harbor-parade.test.mjs` (the window, the order, the spacing, joined mid-way, the crowd's cheers, the wind),
  `tests/harbor-xmas.test.mjs` (Black Friday's calendar, the crew's order, the workers + Thanksgiving's day off, the rush, the sale),
  `tests/harbor-holiday.test.mjs` (the November build-up by date, the giant's calendar, latchBig, THE HOMECOMING on both clocks),
  `tests/harbor-spots.test.mjs` (the November spot pieces at three sizes), `tests/harbor-moments.test.mjs` (the boss's cycle, the table +
  the game). E2E: THE NEW GROUP `thanks` (job `holiday`): Nov 10, Nov 20, the homecoming, the parade (+ its sounds once unlocked), the evening,
  Black Friday morning + evening; `holiday` (the giant Oct 27 / 28, the ring, the ₿'s glow), `windows` (the boss's walk-up), `sounds` (the
  hum), `legends` (the new UFO's green beam + racing ring).

### Performance (A/B in one run, `title-perf.mjs --ab` against 4bae30c — the commit before this pass, 402×874, 2× CPU, the laptop without a GPU, A B B A)
| scene · tier 2 | A (before): frame p95 · slow · work mean | B (11a-2) | verdict |
| --- | --- | --- | --- |
| `tg-parade` (Nov 26, 9:20 — the parade at its peak) | 17.3 · 0 % · 6.48 ms | 16.8 · 0.3 % · 11.84 ms | slower work (+5.4 ms), the same pacing |
| `hw-giant` (Halloween night, the giant lit) | 50 · 51 % · 19.1 ms | 33.5 · 38 % · 17.2 ms | faster |
| `nov-day` (Nov 18, 2 pm) | 17.2 · 0 % · 6.53 ms | 17.1 · 0 % · 6.44 ms | same |
The parade's cost is its PEOPLE (`--vs` with `&force=no-people`: −9.8 ms; without its balloons: −0.85, the noise): ~24 figures more than an
ordinary morning at ~0.3 ms each here. The crowd went 14 → 10 for it (was +6.2 ms). Frame pacing held (p95 16.8, ≤ 0.3 % slow).

### Decisions made (the run was unattended — the owner's rule: take the most reasonable reading, write it down)
1. The giant: a 3D ray-marched pumpkin with the ₿ carved through + a fire inside (not a jack-o'-lantern face); "twice the mockup" = ~110 pt
   across at 402; the corner jack-o'-lantern in front of it retired; the decor (warty + white pumpkins, candle jars) moved onto its bed.
2. The off-camera rule covers the spot pieces + the stalks + the mums + the bales too (they're big, readable pieces), and the tree stand.
3. The witch: fixed at the CAUSE (the whole-second clock) + the canvas change the brief asked for — both.
4. The UFO's ring colour: ice-white (the brief: "cool WHITE / ice-cyan"), the beam pale green; the saucer's glows green-white to match.
5. The parade: the waterside road (the near lane) — the front street under the dock stays available to the system (the dock is up on
   Thanksgiving morning). Balloons: a turkey, a pumpkin, an acorn, a cider mug — no characters, no brands. The crowd 10 (the speed round).
6. The homecoming party applies to both cities (the shared party clock); Thanksgiving's own evening stays quiet.
7. The window scenes are DATE-gated (no new hook into the scene); the football in the jazz room (the sax steps aside), the table in `back`.
8. Black Friday's strings stay up every evening to Jan 6 (11b takes them over); the roof's café lights go Christmas with them; the
   wheel stays the city's until 11b.
9. The Black Friday banner lives in a new SALE_DAYS list, not the holiday sky (a holiday there must have a skytyped message + a drone show).
10. Thanksgiving is a day off for every workers' TRUCK show (the parade has the road) — the regulars (the newsboy, the cop…) still come.
11. The trees go bare again on Black Friday (the real season after the holiday's hold) — at the 4 am rebake.
12. City 1.0's Thanksgiving is ignored by the Harbor (it kept the sign amber through Black Friday).

### Known issues (11a-2)
- **The parade's people cost ~5 ms** of work a frame on the laptop at 2× CPU (pacing held). The phone decides: `&when=2026-11-26T09:20&debug=1`
  — if the readout's work is over budget, the next step is a per-figure cache for the spectators standing still (they're a third of it).
- **The milk van's side lettering reads mirrored** ("YRIAD ROBAH") when it faces left — older than this pass (the vehicle kit), logged.
- **The trees snap bare at 4 am Nov 27** if someone is watching then (the holiday's season hold ends; the rebake is a crossfade).
- **The pies + the shopping bags are small** at 402 (a figure is ~22 pt): they read as a light-coloured parcel / a bag — not a hero detail.
- **The chimney smoke is subtle by design** (the owner's "felt more than seen"); on a bright pink sky it can nearly vanish.
- **The geese's V call** (`geese-v`) plays only when a V crosses — not forced by any test (no `&force=` for a V with sound on).
- The window agent's `windows` run had one timing-only miss (the boss's room sampled 8 frames in 3 s, needs 12) — a slow-machine flake.
- **THE CLOUD RUN (40495579126, by hand after the billing fix — the pass's only run):** `street` 54/54, `show` 71/71, `audio` 133/133,
  `windows` 57/57, `wild` 51/51 green; `city` 106/107 — SP3's known clock-dependent "LOAD WEATHER — answered after 6 s" flake (not this
  pass's code; not re-run); `holiday` 62/64 — (1) **"THE GIANT on Oct 27: on its plinth (0 frames)"** — this pass's new check: it waits
  for the two big jack-o'-lanterns, not the giant, so on the slow runner it read the giant before its sliced bake drew a frame (the
  Oct 28 check, which waits for `giant.lit`, passed at 109.8 pt) — **FIXED in SP6** (the check now waits for the giant's own first frame;
  locally 53 frames drawn; real phones were never affected — the owner saw the giant on Oct 27);
  (2) "10-29 at 430: BOTH TAPPABLE — the second drops on its tap (false)" — the roaming second spider missed at 430 only (390 passed in
  the same run); the spiders' code is SP5's, 11a-2 only added the Thanksgiving wreath beside them in signdress.js — likely the tap
  landing where the spider was a moment before (it roams), first seen here — **FIXED in SP6** (the tap waits till the spider stands still,
  reads where it IS, and taps once more on a miss; it passed locally at 390 + 430 before and after). The quick `tests` run (40452962389, re-run) green.

### Handoff → 9b WINTER (+ the city-life fill-ins)
- Chimney smoke is ready for winter: `chimneys.set(k)` from 9b's cold (e.g. the real temperature ≤ 3 °C after 4 pm, more in snow).
- The first Christmas strings (`xlights.js`, up to Jan 6) + the tree stand (to Christmas Eve) + the roof's café lights in Christmas colours
  are already there for 11b to build round; snow on the strings + the stand's firs is 9b's.
- The parade system is ready for the BIRTHDAY EVENT (a `PARADES` row + its own balloons / units).
- City-life fill-ins for 9b: shovelers + salt (the crew system's PLAN), people in heavier coats + scarves (`lookOf`'s season), the cart's
  hot cider through the winter (`L.cart.cider`), the chestnut smoke in the cold; THE WEATHER's CLIMATE-AWARE FALLBACK (plan.md, DECIDED) first.
