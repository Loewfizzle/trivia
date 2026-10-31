# THE MODELS PASS (City 2.0, Oct 30 2026) — the first pass on the MINI PC

Scope: plan.md "OWNER'S NOTES — OCT 30 (evening)" (part 36) — the docs + the bench for the new build machine, THE LINKS RULE; THE MOTHMAN (two
baked models); THE SR-71 MODEL behind the Blackbird's art switch + the cone / boom fixes; THE TR-3B's pink glow; THE HELICOPTER MODEL + the
patrol fixes; THE SHADOWBOXER's window reworked + his 20 sounds; the stations' two-device lag. (In progress — each group adds its section.)

## Group 0 — the new machine, the bench, the links
- **THE MINI PC** (CLAUDE.md → Testing, docs/testing.md#testing, docs/harbor.md): the laptop-era limits out ("never the whole suite locally —
  out of memory", "no Java here"); before every final push the unit suite, rules + `/api`, the smoke test AND the FULL harbor suite run locally.
  The sandbox rule (`.claude/settings.local.json`, uncommitted) was already there: `node tests/integration/e2e-*`, `shots.mjs`, `title-perf.mjs`,
  `pixdiff.mjs`… run outside Claude Code's sandbox.
- **THE BENCH RUNS SILENT** (`&bench=1` → audio/settings.js#PAGE_SILENT: this page muted + its music off, never saved; the AUDIO strip — whose red
  NEEDS TAP / LOCKED the owner read as "tap for sound" — stays down on a bench page). **THE LOAD FREEZE** per scene (bench.js#watchLoad /
  loadLine): the page's first frame, the longest stall between frames until the bakes are done (+ when), the stalls ≥ 0.25 s, when it was steady
  (20 frames in a row under 50 ms), the longest main-thread task where the browser reports it (Chrome; Safari has no long-task API), the bake time.
- **THE LINKS RULE**: (1) THE ~90 s TR-3B LINK — the live link, tapped, started 4.0 s after the tap in Chrome; the likely cause on the owner's
  phone: an EVERYONE preview state REPLACED the link's own `&force` (a 5-s toast said so). Now a page whose own link FORCES something
  (`&force=…`) keeps it — EVERYONE's state yields on that page (an info toast says so); a link with only `&when` / `&wx` still takes EVERYONE's
  state, as before; JUST ME, chosen in that tab, still wins (screens/harbor/remote.js#apply). (2) The link's lead after the tap 4 → 2.5 s and its sounds' decode wait 4 → 2.5 s at most: a legendary from a
  link starts ≤ 5 s after the tap (scene.js#LINK_LEAD; the e2e `freeze` group reads `link.lead`).

## Group 1 — THE MOTHMAN
- **THE BAKE** (scripts/bake/mothman.mjs — the harness serves a recipe's `MODELS` at `/m/<key>.glb`; both GLBs MESHOPT-compressed → the
  page's `GLTFLoader.setMeshoptDecoder`): the PERCH (mothman-folded-small.glb) at the city camera's view (9° below, facing us), the GLIDE
  (mothman-spread-small.glb) in two views × three banks — `away` (yaw 150°, 24° below, leaning 22° into flight: the rear three-quarter) and
  `toward` (yaw 35°, 22° below: the arrival). The models' KHR_materials_specular (2.0) read pale + shiny in a lit room → specular 0.25, env
  0.35; NIGHT LIGHT per model: the perch the needle's pink from straight below (11) + a cool moon edge (7); the glide away from the needle
  (pink 2.6 — the first glide render was lit full pink from below, a pink bat). Output assets/city/mothman/: perch 10 KB (173×306), glide 51 KB
  (2 rows × 3, 328×318), mothman.json (anchors: feet, top, mid, the EYES projected from model space found on the close-up renders).
- **HIS NIGHTS** (core/harbor-mothman.js, the timetable's `legend.mothman` now LIVE): p 0.075 a night → **1.9 a month** (2026–28), never a
  legendary night, never Halloween, never two nights running; in 2:00–2:30, out 5:00–5:30; EYES IN THE HAZE never shares his night
  (harbor-moments.js#eyesNights calls mothmanNight — the old `ctx.mothman` hook gone; a conflicts row). Next real ones: the night of Nov 1 →
  2:07 am Nov 2, Nov 24, Dec 30.
- **THE SWAP** (stutterAt): the needle's light dips, flicks, goes FULLY DARK for ~0.5 s — the model changes there — stammers back. The needle's
  outline item dimmed through a new `neon.moment('itemK', { needle: k })` (tier 0's one-image composite skipped while it runs).
- **THE VIEW** (screens/harbor/mothman.js, its own overlay at the device dpr, zIndex 2 — above the tagline; perched it redraws only when a blink,
  the look, the needle or the veil changes): 84 pt at 402 (the timetable's `size` — the plan's ~70 pt of HIM above the tip, his hem draping
  round the spire: 70 pt read small), the talons on the tip; THE EYES two red glows spread 1.4× apart (at 84 pt the sockets are 2.7 pt apart —
  one red blob unspread), each its own blink clock + a double blink now + then, a slow look round; THE GLIDE in / out in the band UNDER the
  tagline (the first path climbed across the lit NEON letters — a dark cut-out over the sign), shrinking with the distance, fading out; the
  arrival eases into a hover just above the tip; a slight 2D bank. Weather in front (rain, snow, fog, a storm) fades him; reduced motion: no glide.
- **THE PREVIEWS** (panel rows, IN THE SKY): `&force=mothman` (perched within ~1 s of the reveal), `mothman-arrive`, `mothman-leave` (each waits
  for the reveal + 1.5 s), `no-mothman` (TOOLS). Unit `tests/harbor-mothman.test.mjs`; e2e `ONLY=mothman` (the `perf` job — the lightest; 9 checks, ~30 s).
- **CREDITS**: both models (Tencent HY 3D, AI-generated), the SR-71 (CC BY), the helicopter (CC0, made with AI tools) in ☰ → CREDITS.

## Group 2 — THE BLACKBIRD's MODEL + FIXES, THE TR-3B's GLOW
- **THE SR-71 MODEL** (scripts/bake/sr71.mjs, from the F-22's recipe; "SR-71 blackbird (FREE) downloadable" by pablogcg05, CC BY 4.0):
  untextured, the iron-ball black with a blue cast, level, nose → +x, seen 22° from below (a true profile is a needle at 96 pt — the delta's
  underside gives it mass), yaw 8°, the three lights → assets/city/sr71/ (≈ 10 KB). THE ART SWITCH's DEFAULT IS NOW THE MODEL
  (blackbird.js#BB_ART_DEFAULT): at 402 it reads as the real aircraft (the delta, the nacelles, the chines) where the drawing is a stylised
  profile; by day it's the clear win, at night both are silhouettes (the model gets the drawn one's neon rim). `&bbart=drawn` + TOOLS →
  THE BLACKBIRD DRAWN = the A/B; the model loads with the flyby's sounds (prefetch), the drawing stands in until it's there. The owner judges.
- **THE VAPOR CONE NEVER CLIPPED**: the overlay now reaches the screen's top (its strip used to start under the corner buttons — the cut the
  owner saw), the cone + ring drawn whole; toward the LIT letters only a soft fade over the last ~18 pt (destination-out, the cone + ring
  only — the craft + plumes drawn after); the flight sits at 44 % of the strip (more room below). BIGGER (the bell 0.74 × the body long,
  0.34 tall — no room clamp), BRIGHTER (the bell 0.8, the bloom 0.42), IT LASTS: BB.coneHold 0.5 → 2.6 s (it swells a touch while held),
  coneFade 1.4 → 2.6 s, the ring 1.8 → 2.8 s.
- **THE SONIC BOOM +10 %** (the 6:43 pm note — supersedes +5 %): the slot 0.24 → 0.264, both thumps; still the loudest slot (a unit test
  says nothing else is as loud); the music dips deeper under it (0.5 → 0.6, held 1.4 s); the master bus's soft limiter (−12 dB, 4:1) stays.
- **THE TR-3B's PINK GLOW**: not the party (a Thursday cast + a pixel diff against Saturday: the same) — THE DARK CITY BAKE (the drained
  skyline drawn in place of the lit one) kept the facades' night base, and the near band's rose + lavender walls behind the wheel read as a
  pink glow in the dead city. Now the dark bake is pulled toward a cool near-black inside its own pixels (far 0.38, near 0.5 — once a bake,
  nothing a frame); the TR-3B's white + red light on the tower tops is drawn after it, untouched.

## Group 3 — THE HELICOPTER MODEL + THE PATROL FIXES
- **THE BAKE** (scripts/bake/heli.mjs; "Utility helicopter" by 3D Assets, CC0, made with AI tools): its `main-rotor` + `tail-rotor` nodes
  hidden, its `rotor-spin` clip ignored; 24 HEADINGS (0° nose right · 90° toward us · 180° left · 270° away), 9° from below, a DAY + a NIGHT
  light (at night the navy lifted to a slate blue + the glass lighter, a cool rim from above + a warm one from below — Grok's note that the
  paint sinks at night); 200 px a fuselage → assets/city/heli/ (2 × ~76 KB, 6 × 4 sheets of 208×119 frames, ~2.4 MB decoded each); per heading
  the hubs, the belly lamp, the beacon, the tail light + the nose projected into heli.json.
- **THE DRAW** (air.js#drawModel; the drawn chopper stands in until the sprites load, or if they fail): the two nearest headings
  cross-faded (never a stepped turn), the day + night sheets blended by the hour; THE ROTORS live — the main disc a thin ellipse at the hub
  (radius 4.25 m, seen from 9° below) with two blades flicking, the tail disc face-on from the side / edge-on head-on; the lights — the belly
  lamp, the red beacon, the nav light (green flying right, red left), the white tail light — at their projected points. Anchored by the hub
  at the drawn craft's own rotor height, so every planner + clearance check sees the same box (the break flight's "never in front of a sign"
  check caught the first anchoring).
- **IT TURNS IN 3D**: the patrol now has a heading (the break's turn(), extended): on a stop it turns ~35° toward the viewer (its cabin's
  front shows) and back onto its course as it moves on.
- **ITS SIZE FOLLOWS ITS DISTANCE**: `helicopter.patrol.near` 1.6 → 2.3 — the near pass 64 pt at 402 (was ~45), the far pass behind the
  towers ~20 pt (its `far` unchanged: a third of the near).
- **NO HOVER BEHIND THE SPEAKEASY**: the scene hands the plan the speakeasy's front (ground → its crest) + any sign over it
  (scene.js#heliOcc); a stop whose craft would sit behind them climbs ABOVE them into open sky and looks down at the promenade (the first
  close pass's stop at x ~130 now hovers at y ~551, above the roof, behind its string lights — visible).
- **THE SEARCHLIGHT SWEEPS SMOOTHLY**: the beam's angle jumped by ~0.8 rad in one frame as the craft slowed into a stop (−0.5·dir in flight
  → the sweep on a stop) and stepped with the party's beat; now an eased follow every frame (τ 0.5 s), the 'front' part drawing the very angle
  the 'near' part settled; e2e: the biggest change between ⅛-s samples 0.11 rad.
- NOT on the crisp layer: the patrol flies BEHIND the near pieces (the trees, the speakeasy, the signs) — a full-res overlay would have to
  cut them all out; it stays in the city's canvas (the sprites baked at 200 px — ~3× its drawn size at the near pass). The dance-break flight
  stays OFF (`&force=break-heli` flies it — on the model now too).
- e2e `heli` (+ its 4th page: the model, the near pass ≥ 55 pt, the turn, no stop behind the speakeasy, the smooth beam — 21 checks); a 10th
  cloud job `models` (the Mothman + the shadowboxer: every other job sat at its ~5-min cap).

## Group 4 — THE SHADOWBOXER's WINDOW, REWORKED + HIS SOUNDS
- **THE BAG BUG**: its side was SEEDED PER ROUND (`bagSide = r() < 0.5 ? −1 : 1`) and defaulted to the right between rounds — it jumped
  sides. Now ONE fixed spot on the right (core/harbor-boxer.js#BAG_SIDE), swinging only from his hits; only he turns. e2e: the bag's x
  the same through a round + its rest.
- **THE ROUNDS** (roundOf, rewritten): MOSTLY SHADOWBOXING IN THE AIR, mid-room, turned AWAY from the bag (facing left — his straight reaches
  ~⅓ of the room, so the open floor sits mid-room and a full jab never leaves the frame): long, obvious COMBINATIONS (one-two,
  jab-jab-cross, jab-cross-hook, jab-cross-hook-cross, five, SIX), each punch ~0.27 s apart, FULLY OUT (a straight's fist a whole reach
  away), SLIPS / DUCKS / a pull / a weave after half of them; ALI's FOOTWORK — always bouncing on his toes (~2.3 a second, the heels up),
  the weight rocking, the head riding the bounce, the SHUFFLE (the feet flicking past each other), quick STEPS side to side. Then a BURST ON
  THE BAG: a TURN through his front (the silhouette narrows — never a flip), a step over, short hard combinations — the bag swings out a
  beat after each hit (a delayed pendulum, capped at 0.2 rad: never out of the frame), the chain after a hard one — and back. Rounds 2, 5 +
  8 open on the bag (three bursts), the rest get one mid-round. Unit: air > 2× the bag, a six-punch combination, > 40 defences, turns
  through |face| < 0.5, facing away from the bag in the air + toward it at the bag.
- **THE REST** (restAt): he walks it off to the open side's wall, SHAKES OUT his arms (loose, shoulders rolling, a lazy bounce), SITS ON
  THE FLOOR — his back to the wall, knees up, arms over the knees, head down, breathing — ~36 s, gets up + bounces back for the bell.
  THE 10-MIN BREAK: the same (4 min sitting), then he walks out of the frame; the rope + the speed bag are heard off in the room only after
  he's gone (rope + speed bag in turn from ~4.8 min).
- **THE LOOK** (screens/harbor/boxer.js, rewritten on an explicit skeleton — hip, shoulders, head, knees, feet, elbows, fists — every pose a
  bold silhouette: thick limbs, big round gloves, a strong V torso; the bulb's warm rim): NO WALL SHADOW (the bulb's swinging pool stays);
  every move eased (punches: out 0.11 s, held 0.06, back 0.17; the torso + head turning into a cross); poses blended for the sit-down + the
  get-up. Judged at 3× bursts of his window through a rest, an air round, a bag burst + Friday's wrap-up (the towel, the walk out, the
  blind down lit).
- **HIS SOUNDS** — Grok's 20 files in (copies staged under their slot names; boxer-claude-notes.txt read): `boxer-bag` five takes (the four
  real-bag qubodup hits — hard-cut at 0.5 s → faded — + the Gamemaster body hit), `boxer-chain` two (InspectorJ's distant jingles),
  `boxer-bell3` NEW — the real ding-ding-ding burst (Mateusz_Chenc, CC0) at a round's start, `boxer-bell` the end's single ding
  (Benboncan, **CC BY 4.0 — credited** in ☰ → CREDITS), `boxer-rope`, `boxer-speedbag` NEW; all HEARD THROUGH A CRACKED-OPEN WINDOW:
  low-passed (~1.1 kHz thuds, 2.6 kHz bells), a small room, the slots' quiet gains, panned to his window (sounds.js). ~170 KB shipped.
  Not used: the bag combos (bag-combo-1/-2/-3 — the thuds follow his own punches; combo-3's CC BY not needed), bag-hit-5/6/8/9/10 (spares),
  chain-3 (the longest), the speed-bag's own clipping trimmed (−3 dB).

## Group 5 — THE STATIONS' TWO-DEVICE LAG
- **MEASURED** (two pages, separate browser contexts, one station, the mini PC's Chromium): their synced players **within 0–2 ms of each
  other**; each schedules its song ~50 ms AHEAD of the timeline — exactly the 40 ms `outputLatency` + 10 ms `baseLatency` this browser
  reports (`getOutputTimestamp` available) — so the reported output delay was ALREADY compensated (games/pulse/clock.js#ctxAtServer
  schedules by what the browser says is heard). No second-plus gap → no sync bug in the page.
- **WHAT's LEFT** (the owner's iPhone + the mini PC through a TV + a soundbar over eARC): the TV's + the soundbar's own processing
  (typically ~100–200 ms) is past what any page can see — Windows reports only its own output path. **SETTINGS → SPEAKER DELAY (MS)**
  (OFF · 50 · 100 · 200 · 300 — this device only, saved): its synced songs play that much EARLIER (synced-songs.js#speakerLead), so a
  TV's sound leaves the speakers in step with a phone's; e2e `speaker`: 150 ms set → 148 ms earlier than its twin. This device's OWN
  player (the fallback before the synced one decodes, or the direct path) adds the speaker delay too (party-music.js#partyCue). (Adding the
  reported output latency there as well put it ~40 ms off the timeline — past the 50-ms ride-along tolerance — and broke the first tap's
  hand-over to the synced player: the local full suite's `neon` group caught it; taken out.)
- **WHAT EACH BROWSER REPORTS**: the readout's station line now ends `lat out N base M ts · spk S` (out / base = the reported latencies,
  ts = getOutputTimestamp) — Windows Chrome here: out 40, base 10, ts. iOS Safari: read it off the iPhone's own `&debug=1` line (not
  measurable from here). Comparing the two lines + the ear sets the TV's delay; the owner's size of the lag is still pending.

## Group 6 — the end: the numbers
- **THE FULL HARBOR SUITE ON THE MINI PC** (all 10 jobs' groups, `SHARDS=3` + panel + perf, nothing else running): **24 min 05 s**,
  **762 / 769**, the machine's memory peak **13.3 GB of 32** (Chrome ≤ 5.8 GB) → it fits: THE NEW STANDARD before a final push. (The first
  try, with a SwiftShader model bake + shot bursts beside it, timed every group out on "the harbor baked": run it alone.) The 7 failures,
  each classified: `neon`'s first-tap race + PENDING — A REAL REGRESSION of Group 5 (the own player +40 ms off the timeline: fixed, 40/40);
  the break helicopter's lantern check — a latent near-miss at the drift's end, revealed by a page-timing shift (fixed: the drift's ends
  clear every sign, 21/21); the evening's FIRST TAP surge + 9c's crisp list by day — SKY-B's known flakes; the calm load's tier step + the
  battery's 60-fps moment — FAIL ON THE PRE-PASS BUILD TOO (this machine's headless Chromium paints at ~30 fps: 33.4-ms frames).
- **THE BASELINE GUARD**: a plain night 0.58×, the forced bus 0.79×, the dog walk 0.65× (≤ 2×). **THE 20-CYCLE MEMORY CHECK**: offscreen
  13.86 → 13.86 MB, heap 4.3 MB — flat (it sat at +6.1 → +6.6 MB in the cloud: SKY-A / SKY-B; the cloud run says whether that holds there).
- **`title-perf.mjs --ab`** (A = 454bc71, the commit before the pass, on :5174; 4× CPU): np-night same · np-party same · mm-perch same (the
  Mothman perched costs nothing measurable) · sa-patrol same at every tier once the model's sprite is CACHED (the first A/B: tier 1
  SLOWER +3.3 ms — up to four scaled drawImages a frame; now the two views × the two lights blend once into a small canvas when the heading,
  the light or the size moves on: one drawImage, as the drawn chopper).
- **THE PHONE BENCH**: + `mothman` (perched, then the glide) + `patrol` (the baked helicopter) scenes; silent; a load-freeze line a scene.
- **LOCAL CHECKS** before the push: unit 925 / 925 (~75 s) · rules 45 / 45 (27 s) · `/api` 25 / 25 (2 s) · smoke `GAMES=cipher` 3 / 3 (30 s).
- **THE BAKES' WEIGHT**: assets/city/mothman 62 KB, sr71 10 KB, heli 157 KB; audio/city/boxer-* ~170 KB.

## The cloud's run 1 (0c472a9) → the fixes (run 2)
- tests ✅; harbor 8 / 10 (`models` ✅ first time). **legend**: (1) the break helicopter's lantern check AGAIN (220, 625) — the real cause:
  scene.js#heliAvoid MEMOIZED its list per layout, and a list built before the WAIT / WALK lantern's box (+ the signs) existed left the
  lantern out for good — the break band never avoided it (the local passes were the samples missing the drift's end). Now the memo is keyed
  on what it holds (the signs' count, the lantern, the NEON rect; heliOcc the same), the band's "beside" margin covers the beam root's offset
  (+0.12 L) and the "below" margin the hover's bob (3 → 5 pt): the craft hovers 9–11 pt higher there, clear. (2) the bench group crashed on a
  read landing mid-navigation (the bench loads each scene's page) — its reads now retry across a navigation. **audio**: FIRST TAP late —
  SKY-B's known first-tap flake (a station's first song decodes slowly on CI). Local: heli + bench 26 / 26.

## The cloud's run 2 (fe326fa — the last, the cap)
- tests ✅; harbor **8 / 10**: `legend` ✅ (the break helicopter's lantern + the bench fixed), `models` ✅ again. **audio**: FIRST TAP day +
  morning — the first-tap surge family (a different time of day fails each run: a station's first song decodes slowly on CI's 2-core
  machine; SKY-B's known issue). **perf**: THE 20-CYCLE MEMORY CHECK — heap 6.4 MB vs its 6-MB limit, offscreen 13.86 → 13.87 MB (flat);
  locally heap 4.3 MB — FR5's known item (+6.1 SKY-A, +6.6 SKY-B, now 6.4). Not re-run (the two-run cap). Vercel deployed fe326fa.
- THE LINKS on the live site (headless Chromium, a returning visitor, timed from the navigation): the Mothman perched 4.1 s · leaving 5.4 s ·
  the Blackbird (model) 7.1 s · (drawn) 7.2 s · the TR-3B 3.5 s after the tap · the patrol 3.5 s · the boxer Monday 8 pm 2.7 s · on the bag
  (Mon 7:04:08 pm) 2.7 s · sitting out a rest (Mon 8:05:20 pm) 2.7 s · Friday's wrap-up 2.7 s.

## Decisions
- The Mothman 84 pt (not 70) — 38 % of the tucked model is the hem below his talons.
- The stations' remaining two-device lag is the TV + soundbar's own delay: a per-device SPEAKER DELAY setting, not a guess.
- The shadowboxer works the air FACING LEFT mid-room (his reach vs a ~square window); rounds 2, 5, 8 open on the bag.
- The patrol stays in the city's own canvas (not the crisp layer): it flies behind the near pieces.
- A 10th cloud job (`models`) instead of stretching the 5-minute cap.
- The Blackbird's default art is the baked SR-71 (the owner judges on his phone; TOOLS → THE BLACKBIRD DRAWN for the A/B).
- EVERYONE's preview yields to a page whose own link carries `&force` (not to a clock-only link — the panel's own EVERYONE test opens night links).

## Known issues
- The break flight (OFF by default, `&force=break-heli`) is now on the model too — not reviewed by the owner.
- The patrol is not on the crisp layer (it flies behind the near pieces) — its sprites are baked at ~3× its near-pass size, so the 2×
  canvas is the only softness.
- The Mothman's glide sprite is one bank frame + a 2D lean (the baked banks unused so far — a swap would pop); the look round is the eyes
  only (one mesh: no separate head).
- The stations' lag on the owner's TV: the browser can't see the TV + soundbar's delay — he sets SPEAKER DELAY on the mini PC by ear;
  iOS's reported latencies: read off his phone's `&debug=1` station line.
- On this machine headless Chromium paints at ~30 fps: `perf`'s calm-load + battery 60-fps checks fail locally on any build (the cloud's
  runners are the judge for those).
- SKY-B's known flakes stand (the evening's / late first-tap surge on a slow first decode — local + cloud; 9c's crisp list by day).

## Handoff to ATM
- Clouds, wind, fog, storm, freezing rain, the sun (decisions.md §10) — the Mothman fades in rain / snow / fog / a storm (his veil from
  LK.rain / snow / fog / storm): ATM's real weather drives it for free; a storm deck over the needle could hide him (his overlay has no
  cloud in front of it — ATM decides if he should sit behind a low deck).
- The full harbor suite runs locally in ~24 min: run it before ATM's final push, alone.
