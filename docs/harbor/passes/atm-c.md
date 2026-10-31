# ATM-C — THE CLEANUP: THE OWNER's ATM-A + ATM-B REVIEWS (Oct 31 2026, City 2.0)

A cleanup pass — the owner reviewed ATM-A + ATM-B together (plan.md "OWNER'S NOTES — OCT 31 (the ATM reviews)", both reviews COMPLETE at
9:35 + 11:17 am) + his 12:03 pm add-on (THE ADMIN PANEL TIDIED). Fix what he named, nothing new beyond it. NOT in it: Part 10, FR5, PERF;
the bus crawling in a blizzard + ice on the cart (deferred); the visible wind (his open decision — no change).

## Step 0
The notes appended to plan.md unchanged + decisions.md updated (THE WINDOW STANDARD + NOTHING TOO SMALL TO NOTICE + JUDGE IT THE WAY THE
OWNER SEES IT as standing rules; the visible wind an open question; the bus crawl + the cart's ice deferred) — "docs: plan.md — the owner's
notes, part 39" (f6cc533).

## Group 0 — the two "fixed but not fixed"
- **THE PATROL's HOVER** (MODELS + ATM-A both said fixed). REPRODUCED the owner's way: a FRESH load of his link
  (`when=2026-11-03T21:30&wx=clear&force=helicopter`, no warm-up) in Chromium AND in WebKit (installed for this — `C:\Users\benja\wk`,
  Playwright 1.56.1 + its WebKit 2215 unzipped by hand: the npx installer's unzip stalls on this machine too) at 402×874, every frame sampled.
  FOUND: the near pieces' rects (the speakeasy + its roof billboard) are registered ~0.6–0.8 s after the load — BEFORE the patrol starts
  (~2.6–3.3 s) on both engines, so the "planned before the rects exist" theory was NOT the cause. The HOVER itself sat above the billboard;
  the LEGS were the bug: the leg OUT of that hover dived straight back down through the billboard + the speakeasy's roof to the off-screen
  exit, the low pass left the screen behind the speakeasy, and (WebKit's seed) the leg from the over-the-billboard hover to a low stop over the
  water cut down through the board. FIX (`air.js#clearLegs`, inside heliPlan): a near leg to / from an off-screen point gets that end RAISED until
  its straight line clears every near piece's top (the craft's belly + 6 pt; a stop already over a piece levels out from it); a leg between two
  on-screen points that would pass behind a piece lifts its LOWER end to the clearing height (the craft crosses level, then looks down); one
  straight eased leg each, no waypoints (every leg eases in + out — a waypoint would stop the craft). + a RE-PLAN safety net: when the near
  pieces' rects change after a flight is planned (a slow phone), the route is planned again from the same start + seed and taken from the point
  AFTER the leg it's on (no jump). PROOF (e2e `heli`, run from a FRESH load — `wait: false`, dpr 3): no stop or near leg sampled behind the
  speakeasy / its billboard; every near leg of the planned route clear; **200 patrol seeds** planned from the real frame's pieces
  (`harbor().heli.planFor(seed)`) — none behind. The old build fails the leg check (`leg 8 (105,487 → -64,586) behind the billboard`). WebKit,
  fresh load: 0 of 142 near samples hidden; the hover above GRIDLOCK in open sky.
- **PANEL PARTY ON** (missed again after ATM-B's fix). Looped 4 pages at once until it missed (2 in 12 / 16 / 5 / 20 — reproduced every time),
  then traced the hand-over every 40 ms: the miss was a FALSE "heard" — a synced voice JOINING MID-SONG has its origin in the past but starts
  ~50 ms from now, and NIGHT-C's guard ("both before origin and start") let it through; its gain node read its intrinsic 1 for that moment,
  so `now()` said "c2-party4 heard" once at full volume, then nothing while the real fade-in was still under 0.05 — the check's waitFor saw the
  yes, the next read got null. Nothing audible was wrong. FIX (`audio/synced-songs.js#now`): a voice counts only from its own start + 20 ms.
  0 misses in 32 runs at the original timing (was 2 in 5–20).

## Group 1 — THE SKY
- **THE VEIL READS** (`clouds.js#veilLook` — the owner: "just looks like a sun dog"): a MILKY WHITE SHEEN over the whole sky (20 % at the top →
  32 → 46 % at the horizon, warm-tinted at golden hour and 25 % lighter there), the sky round the sun whiter (a wide radial), FIBRES — one
  baked tile (640×220 at 1×, ~0.5 MB, made on first use) of long soft streaks + finer threads wrapped across the sky and drifting with the wind
  (still under reduced motion), the sun SOFTENED (the sheen over its disc + a broad soft bloom). THE HALO + SUN DOGS RARE + FAINT
  (`core/harbor-clouds.js#haloOf`): ~1 veil day in 7 (was 4), the dogs on ~1 in 3 of those (was 1 in 2); the ring half as bright, the dogs
  fainter still.
- **THE SUN's COLOUR FOLLOWS ITS HEIGHT** (`district/sun.js#sunColourAt`, Harbor only — the owner: at 5:45 pm "almost too white", the sky too
  purple). Checked against the real sun first: the owner's approved 9:30 am sun is 11.4° up, his "too white" 5:45 pm one 8.2° — so the white-hot
  core now fades in from 7.6° to 11.6° (8.2°: 6 % — gold; 11.4°: ~100 % — as approved); below it GOLD → AMBER (~4°) → deep ORANGE at the horizon,
  the glow + bloom warm with it. One sprite BETWEEN the two looks (`between()` — the core whitening, the edge softening in one gradient) instead
  of a crossfade: the crisp disc at a third strength under the soft white core read as the "paper plate" again. THE WARM SKY
  (`tones.js#harborWarm` → `harborSky` + the sky's low glow): with the sun UP, the golden hour's + the sunrise's sky warm gold (blue overhead,
  gold toward the horizon round the low sun); the lavender + pink (City 1.0's dusk) come back as the sun goes down (−1.5° → +2°). The approved
  skies (the mixed sky, the overcast, the 9:30 am sun) unchanged.

## Group 2 — THE WEATHER's LOOKS
- **ONE SOFT-FLAKE FIX** (`snowfx.js#flakeArt`): every flake a pre-baked soft sprite — a bright centre feathering out (never a rim), two or
  three offset blobs (irregular), four shapes × three softnesses (far / mid / near) × the batch's colour, made on first use (≤ 140 small
  canvases); each flake its own brightness; THE FLUTTER (its width breathing as it tumbles); the NEAR layer bigger, softer + translucent and
  ADDED (`lighter` — close to the lens a flake glows brighter than the air: over the blizzard's pale veil a plain soft flake vanished); in the
  blizzard the mid + near flakes carry a SHORT SOFT SMEAR along their flight (three slants a side, baked), never a rod. HEAVY SNOW DENSER: ×2.6
  the flakes at full heavy (was ×1.35), the near layer mostly SMALL crisp flakes, a third big + soft. The blown tree chunks soft clumps that
  swell + thin as they blow (were squares). Found on the way: a FRESH load's snow filled only the top half for ~14 s (the weather fades in, so
  its flakes came in at the top edge) — while it fills, a new flake starts anywhere on the screen, fading in over 0.6 s. (An upwind spawn band
  for the snow was tried + REVERTED: the snow already WRAPS round the screen's sides, and the band put three flakes in four off screen.)
- **THE RAIN's CORNERS** (`rainfx.js#spawn`): a drop's head runs k·y sideways as it falls — the spawns now cover the screen PLUS that whole run
  on the upwind side (the count scaled to keep the density): the storm's bottom-right is wet.
- **FREEZING RAIN READS AS ICE** (`icefx.js`, `scene.js#iceEdgesNow`): CHUNKY icicles on the nearest ledges (`big`: the awning, the window heads,
  the shop window, the cornice, the blade's foot — half as many, ~2× wide, ~1.7× long, a glassy bulged body, a cold shadow edge, a bright lit
  side, a bead of light at the tip + a soft glow at night), drawn FIRST so the tier's icicle cap never runs out before them; a GLASSY GLAZE
  (thicker, with specular glints sliding along it in the neon's / lamps' colours, white by day); the ground an ICE SHEET (a stronger cold sheen,
  long mirror streaks in the neon colours + white cores, AND the wet ground's real reflections at full strength while the ice lasts — an ice
  sheet is a mirror); FROSTED PANES (the speakeasy's + the shop's glass); a COLDER blue-white grade.
- **THE LIGHTHOUSE IN FOG** (`lighthouse.js`): the beam was 3.2× wide + its lit patches + a 19-lamp halo + a 35-lamp glow, all ADDED = the
  "huge flat white blob". Now a soft halo (4 + 3·fog lamps), a smaller fainter scattered glow, a visible SHAFT barely wider in fog (×1.5 at most),
  its patches faint, the flare softer; BY DAY (`f.night` from the scene) the shaft at 15 % — a modest glow at the lamp. **THE RED BEACONS IN FOG
  ONLY** (`lights.js#drawBeacons`, the fog-halo pass): halo r × (6.5 + 3.5·heavy) at 0.5 (was 9 + 7·heavy at 0.75) — the normal pass unchanged.

## Group 3 — THE SOUNDS
(docs/audio.md "THE THUNDER RECORDED + THE BOXER's BAG")
- **THE THUNDER RECORDED**: Grok's 9 takes → `thunder-close` (5 + 2 alternates at weight 0.3) + `thunder-mid` (2), 0.63 MB, −23 LUFS (a per-take
  `lufs` added to the importer); ATM-B's synthesized `cityCrack` REMOVED; THE FLASH ON EACH TAKE's OWN CRACK (the take picked first, the strike
  held back by `lead`, a second flash on close-4's + the crackle's second crack); never the same close take twice; the distance delay + the
  music duck kept. Credits: the four CC BY lines (Spennnyyy, George_Papargyris, lonemonk, dobroide) exact; Pingel + Fission9 CC0 + Soundrangers
  (Sonniss) as a courtesy (☰ → CREDITS + audio/city/CREDITS.md). The importer's credit lookup reads a sub-folder name (`alternates/x.wav`).
- **THE BOXER's BAG** +3 dB + VARIETY BY PUNCH + the combo hits (6 takes cut from two CC0 combos, ~20 KB) + the chain ~1 in 3 heavy hits.

## Group 4 — THE CITY's PIECES
- **THE TR-3B**: its REFLECTION ON THE WATER back (`water.light` per light — the buildings still get nothing); THE BLACKOUT BUILDING BY BUILDING
  (`scene.js#drainGeoFor / drainCity`: the drain's 12-pt strips split top to bottom by the BUILDING seen there — the nearest first, a taller one
  behind owning the strip above — each roof sign joined to the tower it stands on, every strip on its building's power: one stutter + one
  moment per building, rolling in the craft's direction; the live neon outlines + signs dim WITH their building too — `neon.js#drawItems`
  `f.legendDim`); THE CORNER FLARES BREATHE (each corner light its own flare, smoothstep over its pulse's top third — was one flare jumping to
  the brightest corner).
- **RIDERS USE THE DOOR THAT OPENS** (`cabstand.js`): the fare walks round the cab's TAIL to its near door (the one the kit draws open) — the
  people's pass draws him behind the car, the cab stand draws him in front of it (`people.drawFare`) — the door opens as he reaches it, he steps
  up IN through the doorway (the kit's `inside`, centred in the opening, fading into the dark), it shuts, the cab pulls away. Checked by reading:
  the street cabs' fares + the bus's riders already step through their vehicle's open near door (people.js, clipped to the doorway).
- **UMBRELLAS HELD** (`folk.js`): the umbrella arm bent at the elbow, the hand steady in front of the chest (measured: 0 movement against the
  shoulder through the stride; a free arm swings 0.26), the canopy riding a fixed shaft above it with a lean into the wind + a tilt in a gust; the
  other arm swings.
- **THE TV ROOM's MAN IS SOLID** (`window-paint.js` — the boss at his shade on a party night): his darkness was 0.9 × the TV's glow (he flickered
  WITH the set); now fully opaque + steady, a thin rim of the screen's light on his edges; the TV room's crossing shadow a steadier, darker core.
- **THE BLADE's LETTERING**: 'inline' OUT of `BLADE_FONTS` (an old `&blade=inline` falls back to the week's style); block / condensed / slab
  checked at the real size, day + night — at blade size the column squeezes all three to solid one-colour letters (block + condensed render
  identically there), so all three stay; the day render's offset shadow subtle (0.32, half the offset).
- **THE WINDOW STANDARD**: a line in CLAUDE.md's City 2.0 rules + docs/harbor.md's standing rules + decisions.md.
- **THE ADMIN PANEL TIDIED** (the owner's 12:03 pm add-on; `remote.js#block`, `css/harbor-remote.css`): every block with more than 12 rows FOLDS
  behind its heading (closed by default, its row count shown, remembered on the device — `nd:hr-folds`; a search opens the folds it finds rows in)
  — CITY SOUNDS (318), the off switches (19), the weather's + the snow's + the holidays' lists; the blocks with LIVE CONTROLS (the party's ON,
  the music, the beat's slider, the debug tools) stay open. The sections in screen order (SKY + WEATHER, LEGENDARY, LIGHTS + MUSIC, SPEAKEASY,
  PEOPLE + WORKERS, HARBOR, WILDLIFE, WINTER, HOLIDAYS, TOOLS). CLEAR ALL also switches the readout + its LOAD log + the AUDIO panel off and
  takes `debug=1` out of the address.

## Group 5 — the numbers
- **SPEED** (`title-perf.mjs --ab` against the build before the pass — a worktree of f6cc533 on :5174; 4× CPU, tier 2, 402×874, 3 + 3
  windows): clear night SAME (+3.7 ms, noise ±9), the party SAME (+2.2, ±11.7), heavy snow SAME (+5.2, ±12), freezing rain SAME (−3.3, ±10.7),
  dense fog SAME (−0.05, ±4), the veil SAME (+8.6 after its bake; the first version was SLOWER, +22 — four full-sky fills a frame), the
  blizzard **+12 ms of 116 (~10 %, just over its ±7.6 noise)** — the first version was SLOWER by +143: the soft smear on EVERY driven flake
  (~55 ms) + 30 % more flakes; now the blizzard keeps its old count, only the few big near flakes smear, the far dust is a batched path again
  (the blizzard with its snowfall off: SAME, −1.7 — the whole delta is the snow). Clear weather: no new per-frame work (the veil + the snow +
  the ice draw only in their weather).
- **NEW CANVASES**: the veil's fibres tile (640×220, made once, ~0.56 MB) + its half-res bake (~0.35 MB at 402); the flake sprites (≤ 140 small
  canvases of 32–96 × 32–48 px, ~0.3 MB at most — every one through `ctx2d`, counted by the memory guard).
- **SOUNDS SHIPPED**: the thunder 0.63 MB (9 takes), the boxer's combo hits ~20 KB (6) → audio/city/ 20.15 MB (the test's cap 20.2).
- **LOCAL RUN** (the mini PC, alone): unit 937 · rules 45 · /api 25 · smoke `GAMES=cipher` 3 / 3 · THE FULL e2e-harbor suite **776 / 779** in 28 min
  (the two known machine-timing checks — the toast's arm step 0.262, the calm load at 2× CPU — fail the same before the pass; PANEL SOUNDS read the
  folded CITY SOUNDS rows as 0 pt high → the test opens the fold first, as a person would) + `neon` (a shard-load protocol timeout) and
  `sounds` alone: 57 / 57.

## Decisions
- **The patrol's bug was the legs, not the timing**: both engines register the near pieces before the patrol starts; the re-plan stays as a
  safety net for a slower phone.
- **The white-hot core from 7.6° → 11.6°** (both of the owner's suns satisfied: 8.2° gold, 11.4° white as approved); a sunrise warms the sky the
  same way (the dawn look with the sun up).
- **The near snow is ADDED (`lighter`)** — close to the lens a flake glows brighter than the air (a plain soft flake vanished over the
  blizzard's pale veil); the smear only on the few big near flakes (the speed).
- **The snow keeps wrapping** round the screen's sides (the corners were never dry for snow); the upwind band is the rain's alone.
- **Block / condensed / slab all stay on the blade**: at blade size the column squeezes them to the same solid letters — only 'inline' split
  the strokes.
- **The cab stand's fare goes round the TAIL** (the bench is right of the cab's stop, the tail the near end): the door the kit draws open is the
  near one, so that's the one he uses.
- **The admin panel's live-control blocks stay open** (the party's ON, the music, the beat, the debug tools) — every other list over 12 rows folds.
- **Thunder at −23 LUFS + slot gain 0.26** — the close crack lands over the far rolls and under THE SONIC BOOM (the slot test keeps the boom the
  loudest).

## Known issues
- The blizzard costs ~10 % more than before at 4× CPU (above).
- The cab stand's fare walks round the tail even when the cab stopped close to the screen's right edge (its tail can sit just off screen —
  he's then hidden for a moment behind the edge, never by the car).
- The blade's icicles hang behind the holiday pines in December (they stand in front of it).
- The boss's shadow is solid only on party nights' lit shade (the one place a person stands in front of the TV's light); the TV room has no person.
- The TR-3B's neon outlines dim with their building's power — a building's outline belongs to the building its sprite overlaps most; two
  buildings sharing one outline dim together.
- The two local timing checks ATM-A / ATM-B listed (the calm load at 2× CPU, the toast's arm step) still depend on the TV's 29 Hz.

## Handoff to Part 10
- THE WINDOW STANDARD is a standing rule now: any window scene Part 10 adds (the party rooms in the fireworks' light) meets it.
- The panel's folds: a new long list (> 12 rows) folds by itself; a block with a live control goes in `KEEP_OPEN` (remote.js).
- The flake sprites (`snowfx.js#flakeArt`) are cheap per flake but cost a call each — any new particle field (Part 10's sparks) should batch
  or go to the WebGL layer the owner already chose for the fireworks.
