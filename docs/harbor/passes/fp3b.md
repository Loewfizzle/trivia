# FP3b — FOREGROUND POLISH 3b: THE PEOPLE WALK RIGHT + REAL DOORS + THE DANCE CIRCLE + THE FACADE (Oct 24 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## FP3b — FOREGROUND POLISH 3b: THE PEOPLE WALK RIGHT + REAL DOORS + THE DANCE CIRCLE + THE FACADE (Oct 24 2026; behind `?city=2`)
From `docs/harbor/review-3.md` §C items 7–13 + the owner's checks after FP3a (plan.md 8P REVIEW NOTES (14)) + two add-ons sent during
the pass (the apartment's window box, THE CHESTNUT ROASTER).

### 7. THE PEOPLE WALK RIGHT (`folk.js` — one 2.5-D rig; `core/harbor-people.js` — the heading)
- **THEY FACE WHERE THEY GO:** every state carries `hd` (the heading on the ground: 0 right, π/2 away, π left, −π/2 toward us; `dir` is
  derived from it for the old readers). `folk.js#jointsOf` builds every joint in the figure's own frame (forward · lateral · up) and ONE
  projection draws every facing — side-on only crossing the screen, 3/4 on diagonals, the FRONT walking toward us (a face under the hat
  brim, hair as a fringe), the BACK walking away (the back of the head is hair). Depth: the far limbs a shade darker + drawn first, and a
  joint further away sits a little higher on screen (the ground's slope at its distance) — so a front walker's stride reads.
- **TURNS ARE NEVER A SNAP:** a route's heading is the CHORD 0.55 units behind → ahead (smooth through any corner, however short its
  segments); a pose turns from the arrival heading to its own facing over 0.6 s; a walk after a pose turns over its first steps; a half
  turn goes through the FRONT (`lerpHd`). Partners, friends + groups walk in the lead's own frame (no jump at a 4-way threshold) and STEP
  into a chat / a knot (a few steps, then a turn), never slide; a short pose (a moment at the kerb) keeps the walking formation. Tested:
  no heading change over 0.5 rad in a frame over 20 minutes of a busy noon.
- **THE WALK CYCLE** (keyed like the classic 8 poses): a duty factor of 0.6, the STANCE LEG STRAIGHT (the leg is exactly the hip's height —
  the owner's "squatting" was the old 0.524 leg on a 0.49 hip), the hip riding a gentle pendulum, the knee bending on the swing leg only
  (~55° at the passing pose), the heel lifting at push-off, the pelvis + the shoulders counter-rotating, the arms opposite the legs.
  STANDING, WAITING, CHATTING: straight legs at full height (tested at three facings). JOGGERS: their own run cycle — a short stance with a
  flexed knee, a flight phase, the heel kicked up, the arms bent ~90° pumping, a forward lean.
- **NO SKATING, ON A DIAGONAL TOO:** the planted foot holds still on screen in x AND y (< 0.03 pt a step of 0.02 units, side-on, 3/4,
  toward + away; tested).
- **THE PACE back up ~12 %** (the owner after FP3a: "a little too slow"): walk 1.29, brisk 1.68, stroll 0.9, kid 1.5 (the jog 3.1); and
  SHORTER STEPS (0.35 of a height): a long step at a slow speed read as a slow-motion glide.
- **THE BENCH AT NOON:** sitters wear cloth AWAY from the oak's browns (navy, bottle green, burgundy, slate, dove grey, a cream mac) + a
  light edge round head + shoulders where they meet the bench's back; the bench's cast iron a DARK GREEN (the slats + the sitters
  separate from it). `folk-preview.html?only=headings,lady,turn,toward,jog` shows the facings + the turn + the stride toward us.

### 8. REAL DOORS (`core/harbor-people.js#doorLeg`, `doorOpenK`, `folkAt().doors`; `screens/harbor/doors.js`; `speakeasy.js#doors`)
Nobody fades on the promenade any more (tested over a day): a `door` leg — the door SWINGS OPEN (0.55 s), they STEP THROUGH at ~¾ of
their gait, it starts to close once they're 0.8 units past the threshold and is shut 0.65 s later; going in they walk on into the dark
while it shuts behind them, coming out it opens on them standing inside. A group falls into single file at a doorway. `doors.js` draws
over the bake: the doorway's reveal (the side door's stairwell glowing AMBER at night), whoever is inside it (people.js#drawInside —
clipped to the opening, dimming as they go deeper), the oak LEAF swung inward (so a closing door sweeps over them), and at night the
side door's SPILL: a crisp warm pool on its two granite steps + the cobbles (never a haze). Sounds on the swing: `street-door` /
`street-door-close` (new slots, empty → silent) + `bar-open` (the club's burst) at night; the shop's bell on its door. THE BUS: riders
step DOWN off its floor through the open door, boarders step UP (the door's rect clips them; its shut still 3–5 s after the last one,
now from their threshold time). &force=doors (the panel's THE DOORS): someone through a door every 24 s.

### 9. THE GLOW-WAND DANCE CIRCLE — the ROUTINES layer's skeleton (`core/harbor-routines.js`; `wands.js`; `people.js`; `centre.js#dance`)
- **THE ROUTINES** (FREV A2 row 8): set pieces ON THE CLOCK beside the random blocks — planned per slot from a seed (every phone the same,
  joined mid-way), reserving their people (the blocks plan around their occupancy, `capByTier` keeps them first) and their floor (while
  one runs the blocks route round the inlay: the map with the compass closed — a visit planned before it that would still be out is
  re-planned round it; a goal on the compass moves to its edge). 8b adds the workers' day as more entries of the same shape.
- **THE CIRCLE:** on a party night at its peak (22:00 → 00:45), ~¾ of the quarter hours: 6 dancers come out of the speakeasy's side
  door (real doors) to their spots round the compass (a square for the first four), dance ~6 minutes, then go back in one by one; 3–5
  watchers drift in to spots behind + beside it (never in front of the dancers) — clapping, bobbing on the beat, watching. The inlay's
  FLOOR SPOTS come on with it in the phrase's palette colour (the rig without a piece: `centrepiece.dance`). While it dances nobody gets
  off the bus there (the cap of 12 holds).
- **THE MOVES** (`wands.js#danceMoves`, PURE): an 8-beat phrase each, the circle in step (the odd dancers mirrored): UP (a V shooting up
  on every beat) · SWING (one arm up as the other comes down, a sway) · SPIN (arms out, a turn over four beats) · SIGNAL (the arms trading
  up / out, crisp on the beat). Arms raised in the FRONTAL plane so they read from the front; a dip on every beat.
- **THE WANDS:** two per dancer, along the forearm — a tight halo, the coloured tube, a white-hot core (crisp, no blur); the party
  palette by phrase; a bright RACE round the ring every half beat, SIGNAL strobing them on the beat; a seeded GLITCH now and then (a dim
  flicker + a twitch, like a tired tube); SHORT trails (the last 3 positions as thin fading quads). Tier 0: the first four dancers, no
  trails, no halo. Without a party song: a steady 120 bpm. &force=dance (the panel's THE DANCE CIRCLE): a circle every 5 minutes;
  &force=no-dance: a party night without it (the speed A/B).

### 10. THE FACADE (`speakeasy.js` split first: `speakeasy-geo.js` · `speakeasy-blade.js` · `speakeasy-bake.js`; speakeasy.js keeps the
live layer + re-exports everything — no importer changed, the night facade 9 px apart)
- **THE IVY:** a few branching woody VINES from the bed by the door ALL THE WAY UP the corner pier to the parapet, the brick showing
  between, small clusters of three-lobed leaves at the nodes (fuller low, sparse at the top). September turning, October crimson +
  scarlet with a few amber + green, November thinning, BARE vines in winter, fresh green in spring, deep green in summer. (Two refine
  passes + a third: it reads as a climbing vine at phone size — kept.)
- **THE DATE STONE:** a carved limestone tablet across the parapet under the crest — "EST. 1924" in INCISED letters (the cut dark, its
  lower lip catching the light), a raised moulded border, small Deco scrolls at its ends; softly lit from a hidden cornice lamp at night.
  The two inner pier finials gave way to it (the outer one stays).
- **THE STONE TRIM:** the cream warmed to a LIMESTONE / terracotta (mats' cream × [1, 0.92, 0.78]) with a fine grain (`stoneTex`), CRISP
  shadow lines under the cornice, every dentil, the belt course + the sills (then a soft fall), and SOOT streaking down the brick from
  every ledge (`sootUnder`).
- **THE TV WINDOW BY DAY** (FREV L4) is already glass by day since SP2 (the TV only lights from dusk) — checked, nothing changed.
- **ADD-ON — THE WINDOW BOX** (the owner): its mound + blooms rose above the sill into the TV window's glass. Now nothing rises above the
  sill: the plants sit inside the box's top edge (clipped at the sill line), the trailing ivy hangs down its front; the morning's
  watering (the 'wake' moment) still pours onto them.

### 11. THE JETS + THE BUS (`core/city-sounds.js`; `bus.js`) → docs/audio.md
The jets +3 dB (0.14 → 0.198) with a slightly deeper music dip (−3.6 → −5 dB), the peaks reaching just into the player's soft-cap knee.
THE BUS repainted CREAM OVER DEEP MAROON with a thin gold pinstripe + gold lettering (not green — it clashed with the cart), lined-out
riveted panels, a lit HARBOR LINE destination sign, a chrome radiator grille + bumpers, a round headlamp on its stalk, wooden-spoked
wheels, a warm-lit interior at night (a ceiling lamp a bay). Its stop stays left of the crossing: right of it the framing maple + the
cart's new spot would hide it; the crabapple covers its rear half there, its door end stays clear.

### 11b. THE VENDOR SPOT + THE CHESTNUT ROASTER (`core/harbor-routines.js#VENDOR`, `cartEvening`, `cartAt`; `props.js#drawCart`; `people.js`)
- **THE SPOT** (the owner, Oct 24): the front curb, just in front of the compass inlay — RIGHT of it on screen (f 0.805, z 38.4): centred
  in front of it the cart's body would cover the compass's front half at every phone size (the strip is ~70 pt deep — checked in node
  first); its left end clears the inlay by ~3 pt, its right end ~10 pt short of the framing maple's trunk, its wheels ~15 pt above the
  dock at 390 / 402 / 430 (tested), ~0.9 of its old size. The old spot is cleared; the crowd routes round it only while it's out.
- **SHARED BY TIME:** the CHESTNUT cart from ~6:30 pm to ~9:30 pm (± ~11 min a day) in the COLD months only (October → March), WHEELED
  IN from the right edge by its vendor (who sells from its left end, beside the stove, facing the promenade — behind it he'd hide under
  its counter at phone size) and out again; never while the inlay is in use (a centrepiece; &force=dance), never in HEAVY rain (Part 9's
  hook: ctx.rain > 0.6); customers stop only while it stands there. The NEWSBOY's hours (7–10 am, 4:30–6:30 pm) are kept as the hook for 8b.
- **ADD-ON — THE ROASTER** (the owner: "REMOVE the big umbrella — it blocks too much of the promenade"): a LOW, COMPACT period roaster
  cart — painted wood WORN at its edges, a brass counter rail catching the light, wooden-spoked wheels with depth; on its LEFT half a
  black-iron coal STOVE on short legs (its grate's coals glowing orange — an ember by day, bright at night — a crisp tight halo, a
  roasting pan of chestnuts) with a TIN CHIMNEY (≥ 1.6 pt wide, seamed, a conical cap on stays), the tray of chestnuts on its right, a
  LANTERN on an iron hook over the handles; in DRIZZLE a small striped canvas hood flips up over the stove. LIVE: a SMOKE wisp off the
  cap (soft puffs growing + thinning, bending with the REAL wind, warm-lit low down at night) + a breath of STEAM off the pan; its own
  warm pool on the cobbles at night. (The stove sits on the left so the smoke rises clear of the framing maple's lowest leaves — on the
  right it vanished into the crown.) A sprite while it stands, painted directly while it rolls (its wheels turning).

### 12. TESTS + CI
- Unit (606): the diagonal stride test (x + y on screen, seven headings, four looks), straight legs (standing poses + the stance),
  the heading (no snap over 20 min, the half turn through the front), real doors (nobody fades over a day; the doors open only for
  someone), the dance circle (party nights only, at the peak, the cap, tier 0's four, the crowd never on the compass while it dances,
  out of + back into the side door), the vendor spot (October evenings only, parked at the spot with its vendor, customers only then,
  never in July / with a centrepiece / with the dance), the PF layout (the new spot's screen rules), the pace, the jets.
- E2E: the NEW `life` group (cloud job `show`): a real door opening with someone in its doorway, nobody fading, shut again; the circle
  formed with the cart away. The NO SMOKE probe is GATED now (`speakeasy.quiet(true)`: the basement steady, the windows' moments paused
  while it reads) instead of moved. `SECONDS.life` 90 (a guess — refine from the cloud).
- The quick `tests` workflow skips docs-only pushes (`paths-ignore: docs/**, **/*.md` — FREV A5's ~7 minutes each).
- Not run locally: the emulator-backed E2E (no Java on this machine) — the `[harbor]` cloud run covers it (see Known issues).

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
People walking: noon `&when=2026-10-22T12:30` · golden hour `&when=2026-10-22T18:15` · night `&when=2026-10-22T21:40` · the side door at
night `&when=2026-10-22T22:00&force=doors` · the barbershop door by day `&when=2026-10-22T13:00&force=doors` · the dance circle on a
party night `&when=2026-10-24T22:26&force=dance` · the facade at noon `&when=2026-10-22T12:30` + night `&when=2026-10-22T21:40` · the bus
at a stop `&when=2026-10-22T11:00&force=bus` · the chestnut roaster `&when=2026-10-22T20:30` (in drizzle: `+&wx=drizzle`) · the jets: the
panel's sky events (JETS).

### Performance (ONE A-B-B-A round, `title-perf.mjs --scenes "…&force=dance" --vs "…&force=no-dance"`, a party night at 22:26, 402×874, 4× CPU, the laptop without a GPU)
Tier 0 (the slow phone): the circle formed **13.5 ms** of work a frame vs **14.8** without it → **same** (inside the noise, ±2.5 ms); the
slow-frame share the same. Tier 2 at 4× CPU: INVALID (the laptop's tier stepped down during every window — as in earlier passes); the
owner's iPhone readout on a party night decides (`&force=dance`, &debug=1: tier, slow %). The wands are ~12 strokes a dancer + 3 short
trail quads a wand; tier 0 drops the trails + the halos and two dancers. The roaster: a sprite while it stands + ~16 soft puffs.

### Known issues (FP3b)
- **The emulator-backed E2E couldn't run on this laptop** (no Java): the new + touched checks were checked in the preview + node, then in
  the cloud. **THE CLOUD (2 runs, the cap):** run 1 (c5b1e9c): audio, show (+ the new `life` group), **city** green — FP3a's skyline wait
  fix confirmed — and the quick tests green; `street` red on "NO SMOKE round the pole" (one far point +15 between the two readings: the
  CI machine's slower power-on, its wait times out silently, the facade still ramping up). Fixed: `speakeasy.quiet()` also freezes the
  facade's light levels while it holds (locally every far point 0.0 apart). Run 2 (29b3ecd, the `street` job alone): 72 / 74 — the
  same far point still +17.9 in the cloud (0.0 in every local reading: so it is not the facade ramping; the likeliest cause is the CI
  machine's LOWER TIER — the pole's halo / its light on the brick drawn differently there, reaching ~16 pt left of the pole's top) and a
  one-off "THE BAR at night: warm light in its window" (passed in run 1; rgb 150,92,45 read mid-ramp). Both logged, not re-run (the
  two-run cap). NEXT: force the tier to 2 for the NO SMOKE probe (`setTier(2)` before it) or compare the pole's own halo radius by tier;
  the bar probe's wait the same way as the pole's.
- The ROOF's guests still come up + go down through the hatch with a short fade (the hatch has no door art yet — 8b's roof pass).
- The bus's grille + headlamp are ~3 pt at the far road: detail that only shows zoomed.
- The dance circle's moves are the same four for every song; the beat is the song's (`PT.beatsF`) — a song without a beat analysis
  falls back to the party's own clock.
- The cart's smoke + the chimney's cap sit under the framing maple's crown when the wind blows hard to the right (the plume bends into
  the leaves after ~1 unit).
- The newsboy's stand (the morning + evening editions) is only a time window in `VENDOR` — 8b builds him.
