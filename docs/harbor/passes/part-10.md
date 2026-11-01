# PART 10 — THE FIREWORKS (+ THE OWNER's ATM-D REVIEW FIXES) (Oct 31 2026, City 2.0)

The fireworks pass: one premium GPU engine, every night's shows on THE CITY TIMETABLE, the city's reaction, Grok's recorded sounds +
the party-song sync — with the owner's ATM-D review (Oct 31 8:10–8:24 pm) as its Group 0 and two add-ons he sent during the pass (8:32 pm:
the shadowboxer every night; 9:05 pm: the fireworks go off BEHIND the lit sign). NOT in it: the superyacht (its own later pass), New Year's
Eve + July 4th's shows (11b / 11c — on this engine's scripted format), FR5, PERF. Looks judged the owner's way: fresh loads in WebKit at
402×874 dpr 3 (`C:\Users\benja\wk\wk-shot.mjs`, contact sheets with `sheet.mjs`), unzoomed, moving.

## Step 0
The owner's notes appended to plan.md ("OWNER'S NOTES — OCT 31 (night)", the second section of that name — FR5 + the Grok review in
parallel, FR5 measures the pass overhead, the ATM-D review) + decisions.md (FR5's two prompts, PERF's cuts, the ATM-D review in §10, the
weather scenes' load freeze in §13) — "docs: plan.md — the owner's notes, part 41" (f28222d). The two add-ons appended + recorded as
they came (§7 the boxer, §6 the sign).

## Group 0 — THE OWNER's ATM-D REVIEW (six fixes, each built + looked at by its own fork in parallel)
- **THE STORM CLOUDS = REAL CUMULONIMBUS** (`stormdeck.js`): the deck overhead a dark band with a broad, FLAT, ragged underside at the old
  base height (no pouches); two far THUNDERHEADS (three on wide screens) each fully in view — a flat dark base half-way between the deck
  and the skyline, stepped towers widest at the base with one tall updraft, a flat-topped ANVIL spreading downwind, a soft rain shaft
  under the base; lit from inside by a strike (the gaps stay dark). WHY THE FIRST TRIES FAILED: a cloud tall enough to reach into the
  rain haze shows only its anvil on a narrow stem — a funnel; and a cloud that crosses the sky's value (darker at its foot, lighter up
  top) falls apart — by day lighter than the storm grey all the way up, at night bright at the base from the city glow. Still one baked
  tile (5.21 MB at 402); the extra work is in the bake.
- **THE SILENT FLASHES** (`sounds.js`, `lightning.js`, `core/city-sounds.js#thunderWhen / thunderLevel / thunderVerdict`): THREE causes —
  (1) every non-close roll waited for the last roll + 6 s, so in a busy storm a far / intra-cloud flash's thunder came 6–20 s late (often
  after the next flash) → a roll keeps its spacing but is never more than 1.2 s late; (2) intra-cloud flashes are about as bright as a
  close strike but rumbled at ~¼ of a far roll with no duck → a slowed low rumble (rate 0.85) at 0.4–0.8 by the flash's brightness, a
  light duck; (3) a take was downloaded + decoded on its first use (its crack late by the decode) → in a storm the close takes are
  decoded + PINNED, the mid + far fetched; a close strike prefers a decoded take. THE READOUT (&debug=1): `thunder N flashes · ok ·
  waiting · SILENT · LATE` + the last three (time, kind, brightness, km → take · heard after s). `tests/thunder-flash.test.mjs` (a 10–20
  min simulated storm on the real planner) + the weather group's "NO BRIGHT FLASH IS SILENT" + "A BUSY STORM's ROLLS ALL HEARD".
- **THE BLIZZARD's GROUND SNOW — WISPY** (`snowfx.js#ground`): ATM-D's ten ribbons → WISPS spawned at random spots on the promenade,
  ~0.35/s in the lulls up to ~3/s in a strong gust (WF.at), at most 7 alive; each 1.1–3 s, lifting 15–32 pt, curling, spreading + thinning
  to nothing, drifting only 40–110 pt downwind; five soft puffs each on the flake sprites (≤ ~35 draws a frame, was ~110); the building
  clipped out, none spawned behind its foot.
- **THE FOG's HORIZONTAL SPLICE** (`fogbeam.js`, `fogdepth.js`, `scene.js`, `title.js`): it was THE PARTY's SKY BEAMS — in dense fog every
  beam is a soft body the fog shortens by the same amount, so all six ended at ~y 222 (under SPEAKEASY) with ~3 % of their light at their
  widest end: one hard line across the sky, hidden while the sign's glow is on. The beam body's last quarter now fades to nothing (the
  shared sprite: the lighthouse + searchlight beams in fog fade at their far end too); the logo's fog glow + haze follow the sign's real
  light (lit share, a dim, the TR-3B's drain); the party bloom fades with a dim; the fog halos' rims ease out. A 6-row jump of +7.4 levels
  → a smooth ramp (≤ ~1.6 per 6 rows).
- **THE CAB PICKUP's MIDDLE** (`core/harbor-cabs.js#pickupPlan / pickupPath / pickupFareAt`, `cabstand.js`, `people.js#drawFare`,
  `folk.js#rigOf blendS`): the "vanish" was the crisp bench layer covering him (it redraws only the people in front of it, and the cab
  stand's fare wasn't on that list); and he went straight from sitting to walking. Now he's redrawn over the bench every frame (the wheel-
  line clip kept), RISES over 0.95 s where he sat, turns onto his path in his first steps and walks out of the seat side round every solid
  to the curb door. Unit test (390 / 402 / 430, both seats: never in the bench, never more than 0.08 u a frame) + the people group's check.
- **THE SHADOWBOXER WALKS UP INTO PLACE** (`core/harbor-boxer.js#boxerPreview`, `boxer.js`, `windows.js`): the snap was the preview of round
  2+ (round 1 already walked in) — now the blind goes up, he walks in from the open side over 3.5 s easing into his spot (shorter steps as
  he slows), a 0.7 s turn through his front (never a flip), then the bell; the BAG +5 % (0.152 → 0.16). THE OWNER's 8:32 pm ADD-ON: he
  trains EVERY NIGHT (the timetable row `boxer`: days 0–6, `partyDays` [5, 6] — the old Friday rule on both party nights).

## Group 1 — THE FIREWORKS ENGINE
- **THE PLANNER** (`core/harbor-fireworks.js`, PURE, seeded, `tests/harbor-fireworks.test.mjs`): `fireworksNight(day0, key, ctx)` → the
  evening's shows; `planShow(kind, seed)` → the cues; THE SCRIPTED FORMAT `scriptShow({ dur, cues, fill })` (cues `{ t (the BURST), type,
  layer, x, h, s, c1, c2 }` + fill sections with a rate, types, layer weights, salvos) — the weeknight, the party + the midnight shows are
  scripts on it, NYE + July 4th are authored on it later; `fireworksWeather`; `fireworksBusy`; `syncToBeat` (Group 3).
- **THE SHELLS**: peony (a sphere seen — the rim denser), chrysanthemum (trails), gold willow (long, slow, drooping gold), palm (thick
  comet arms), ring (a tilted circle), crossette (stars that split in four — the children start where the parent is, the closed form on
  the CPU), glitter / strobe / crackle (twinkle, white flashes, the last-moment pops), comets, multi-break (an inner second break). Real
  colours (strontium red, barium green, copper blue, sodium gold, titanium silver, white, purple, orange).
- **THE THREE LAYERS** (`FW_LAYERS`): BARGES (sites 0.42–0.88 of the width — right of where the speakeasy hides the water — firing FANS
  across the whole sky, the big shells), BEHIND THE SKYLINE (smaller, launched from behind the roofline, the towers mask them), THE
  LIGHTHOUSE (its breakwater). Sizes on the phone: a barge shell's reach ≈ 0.235 × the width (≈ 95 pt at 402), the far layer ≈ ½ of it.
- **THE RENDERER** (`screens/harbor/fireworks.js`): a WebGL2 layer, each spark ONE instance (origin, velocity, birth, life, drag, gravity,
  colour, size, trail, kind) whose flight is CLOSED FORM on the GPU — p = o + v₀·e + w·(t − e), e = (1 − e^(−kt))/k, w = (the wind, g/k):
  the drag carries it to the wind + its terminal fall — so the CPU writes a shell ONCE at its launch (a ring buffer, `fwRing`) and every
  frame is THREE instanced draws (the smoke, the sparks + blooms + the city's wash, their reflections). A phone joining mid-show builds
  the shells already up from the same seeds: the same sky. Each spark a soft capsule from where it was a trail ago to where it is, cooling
  WHITE → COLOUR → EMBER, dim while the stars are still packed (no white ball at the heart), sputtering at the end; THE COMET of each
  launch + its spitting tail; THE BLOOM of each burst; THE WASH on the city (strong on the buildings below the roofline, softer on the
  water + the near pieces, faint in the sky); THE SMOKE (puffs on a baked atlas, building up over a show, drifting on THE WIND, LIT FROM
  INSIDE by the 8 brightest bursts); THE REFLECTIONS (the near layers mirrored + rippled into the water band, the scene adds the light
  columns — water.light). THE MASK (one 1-px-high texture per 4 pt): the roofline (the far layer) + the top of the nearest piece in front
  (the speakeasy, its billboard, the signs). No WebGL2 → the district's 2D fireworks (never broken).
- **BEHIND THE LIT SIGN** (the owner, 9:05 pm — superseding his 5:02 pm "in front, the sign dims"): the layer sits INSIDE the scene's box
  right after the city's canvas — above the city, under the crisp lettering + the sign. The sign never dims for fireworks; it JOINS the
  show: a big near burst flares its bloom (`S.onSignFlash` → title.js — any night), in a party show's finale every burst swells the
  party's pulse (PT.swell). The party's sky beams stand down for a show (×0.12).

## Group 2 — THE SHOWS + THE CITY's REACTION
- **THE TIMETABLE** (`core/harbor-schedule.js`): `fireworks.show` (9:30 pm on every night that isn't a party night, ~62–88 s),
  `fireworks.party` (10 pm on a party night, ~250–290 s, a 40-s finale + the gold willow curtain), `fireworks.midnight` (2–4 shells, low,
  every night) — each at its hour OR ONCE PROPERLY DARK (the sun at −7.5°) if later; none past `latest`. CONFLICTS: a show WAITS for
  tonight's legendary / the ghost ship / the raid (+ its gap); the dance breaks + the helicopter patrol give way to a show; the weather
  calls it off (rain > 0.12, a storm, a gale ≥ 16 m/s, dense fog > 0.55, heavy snow > 0.5 — light snow + clear cold nights go ahead); a
  show that turns bad stops launching (the ones up finish).
- **THE CROWD STOPS + LOOKS UP**: the everyday walkers through THE WITNESSES (`core/harbor-witness.js`, a new `fireworks` kind: stop, face
  the harbor — their backs to us — heads up, a few point first, a share waves through the finale, then on their way; nobody held away);
  the party's pockets through `core/harbor-streetparty.js#watchShows` (their mingling cut into WATCHING for every show; no break during a
  show). THE TR-3B IN A PARTY (it's party-nights-only, 22:09 → 00:30): the pockets watch it the same way. FOUND ON THE WAY: the street
  party never received the scene's `blocked` rule (people.js passes a whitelist) — "no dance break during a raid / a legendary" (THE
  CONFLICTS) now applies on the people's side too.
- **THE WINDOWS' TOAST** — NOT BUILT: at ~40 pt a raised glass in a lit window doesn't read against a sky full of bursts (the phone-first
  rule) — the rooms keep their own routines.
- **THE PREVIEWS** (each a panel row): `&force=fireworks` (a weeknight show), `&force=fireworks-party` (the full show — plays the party song
  it's synced to), `&force=fireworks-midnight`, `&force=finale` (the party show from its finale) — from the force moment + 3.6 s (the first
  comet rises ~4 s after the load), again after a pause. `&force=no-fw-sync` = the show on its own timing (A/B).

## Group 3 — THE SOUND + THE SYNC
- **THE IMPORT** — see docs/audio.md#the-fireworks-sounds (the slots, the takes, the levels, the size, the CC BY credits).
- **THE LAYERING** (`scene.js` fwHooks): the LAUNCH thump (+ a WHISTLE on ~16 % of the shells) → the BOOM at the burst after the
  distance's delay (the barges 0.36–0.56 s, the lighthouse 0.42 s, the far layer behind the skyline 0.95–1.3 s), lined up on each take's
  marked hit (city-sound.js's sync) — near booms for the barges + the lighthouse, far booms for the skyline → CRACKLE (crackle / glitter /
  strobe) or the WILLOW's sizzle (willow / palm) → THE FINALE's barrage (the music ducks to ~74 % under it; a crackle bed on a party night)
  → the crowd's OOH on a big one (≤ 1 per 9 s) + a CHEER at the end. Never the same take twice in a row; in the finale the barrage carries
  the din (single booms thinned to one per 0.26 s). Muted / locked = a silent show that still looks right.
- **THE PARTY SYNC** (`core/harbor-fireworks.js#syncToBeat`): on a party night the show's cues snap to THE SONG every phone hears (the
  party deck on the server clock + its analysed beat grid, data/mood-music.json songs[id].grid): every burst ON A BEAT, the big shells ON
  A BAR, THE GOLD WILLOW CURTAIN on a PHRASE (4 bars); a cue moves at most half its unit; never launched before the show starts.

## Group 4 — the numbers
(filled in at the end of the pass)

## Decisions
- **BEHIND THE LIT SIGN** (the owner's 9:05 pm add-on) — the engine's layer inside the scene box under the sign; the sign joins the show
  by its bloom (one element's opacity — a compositor change, never a filter).
- **The closed form on the GPU**: no per-frame CPU work per spark — the cost is the fill, trimmed by the tier table (fewer sparks, shorter
  trails, fewer lit lights, no reflection pass on tier 0), never fewer shells (the plan is the same on every phone).
- **Reflections are stylised**: the visible water band (~80–100 pt) is far too short for a true mirror of a burst 300 pt up; the near
  layers are mirrored SQUASHED into the band + rippled, the scene adds the light columns.
- **A show waits** for a legendary / a raid / the ghost ship (rather than the other way round): they're rarer + have their own rules.
- **The windows' toast not built** (doesn't read at 40 pt).

## Known issues
(filled in at the end of the pass)

## Handoff to FR5 + the Grok review
(filled in at the end of the pass)
