# JAYWALK — PASS H6B: THE FINAL POLISH (Nov 17 2026)

The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 17 — DECIDED, H6B)". What it built, in full: `docs/jaywalk.md`
"THE FINAL POLISH". This page = the log: the groups, the named calls, THE MIX's table, BOTH fresh-eyes reviewers' reports VERBATIM,
what was done with each item, the checks, OPEN FOR BEN. **Everything is VIEW + SOUND (+ the lab's link): the rules, the proof, the
feats are untouched — REPLAY = LIVE stays green. No database rules change. No `/api` file. No boot JS file.**

## THE GROUPS
- **Step 0** (`f40811cb`): the decisions into `docs/games/plan.md`.
- **Group 0:** `scripts/lab-export.mjs` (224 marks — NO open FIX mark); the cloud run of `33702dc9`: tests green, harbor skipped (a
  game pass).
- **Group 1 — THE SKY BY NIGHT + THE LOOK SWITCH** (`ee834633`): 8 painted night skylines COPIED by
  `scripts/build-jaywalk-assets.py --only=skyline` (65–79 KB each; the originals only read), the same machinery as the day set;
  `skymarks.js` + the band's colour wash RETIRED; the lights + windows a landmark covers OFF (`skyline.js#SKY_OFF` — measured by the
  builder off the pictures, not typed in from the notes); night's own rest offset per area; THE LOOK SWITCH = a 1.5 s cross-fade of
  the whole band.
- **Group 2 — THE GATE SIGN, THE CHIPS, THE CARDS, THE LAB LINK** (`41acfb90`): the sign only on the approach; the compact chips;
  `?lane=N`; ONE countdown. **The two redone cards: nothing to rebuild** (below).
- **Group 3 — THE MOMENTS' FINISH** (`8679f8ae`): the solid UFO, the Blackbird's size + burners, the Mothership's port + the traffic
  stopping, DOWNTOWN's storefronts, + the inbox's 6:32 am add-on (THE TAIL LIGHT BAR).
- **Group 4 — THE SOUND MIX + THE CREDITS** (`2f0053bf`): NEW BEST = take B; the mix measured + set; the ducks; JAYWALK's Credits group.
- **Group 5 — THE FRESH-EYES REVIEW, TWICE** (`b938eed5` the frame · `70c16c40` the first fix round · `5133412f` the second).
- **THE LAST GROUP — the inbox's 8:50 am add-on: THE END SCREEN's MEMORY** (below; `docs/jaywalk.md` "THE END SCREEN's MEMORY").
- **Group 6 — the checks, the docs, the close.**

## THE NAMED CALLS (obvious / established-pattern — done, not asked)
1. **THE NIGHT CROP IS 84 ROWS HIGHER than H2's** (rows 204–636 of the 720). The prompt said "the same treatment as the day set";
   with the old night crop (the lower 60 %) the lighthouse's lamp + beam, downtown's spires, the control tower's cab and the cranes'
   tops were cut off at the band's top edge. The opening's `skyline-night.webp` is re-cut the same way (a gate's cross-fade must move
   nothing but the landmark): the night band now reads — the stars, the lane count in the sky, the city low, a strip of water, the
   sea wall. The poster keeps the rows it had.
2. **THE GATE SIGN hangs UNDER THE SEA WALL on the approach, not on the gate's crossbar.** 8–10 lanes out the gate itself is behind
   the skyline band and in the full far haze — a sign standing there cannot be read (measured: its foot at 17–22 % of the screen, the
   band's foot is at 24 %). The same painted board is drawn crisp over the far haze strip (the fogged far lanes — never one he is
   about to cross), up from 10 lanes out, gone 3 lanes from the gate; the gate's posts + crossbar come out of the haze under it.
3. **THE UFO is "smaller + higher" as far as the band allows:** 2.3 cells across (was 3.0) at 5.0 (was 4.7). At 6.2 the saucer was
   behind the skyline band whenever its ring was on screen (tried, shot, dropped).
4. **The kid goes INTO the saucer from below** (it is solid now: the hull closes over him as he rises through its middle, the hatch
   glowing under its belly) — not through a hatch drawn on its top, and not by standing the saucer on its edge to show its belly
   (from this camera the belly is only seen past a 50° tip).
5. **THE TWO REDONE CARDS — NOTHING REBUILT.** `Downloads\grok\jaywalk\cards\right-of-way.png` + `mothership.png` are dated Nov 17
   1:58 am and are **byte-identical** (SHA-256 `2f959e58…` / `6b5c8d9f…`) to the copies H6A built from at 2:04 am; the builder re-run
   changes no file. No lab version was bumped — the owner's Nov 17 approvals of RIGHT OF WAY (v2) + BEAM ME UP stand. (If a later
   re-delivery was meant — the prompt says 6:18 am — it is not in the folder.)
6. **THE PER-GAME BUDGET HELD (2,448 / 2,450 KB — not raised)** by shortening the header comments of `night.js` + `view.js` to
   pointers at `docs/jaywalk.md` (6 KB of prose the doc already holds) and by keeping every new piece on demand (`flyers.js`,
   `shops.js`) or in css. `skymarks.js` was already out of the eager graph: its removal freed no budget.
7. **A site-wide two-word css fix:** `.cr-by` / `.cr-lic` (`css/components.css`) now wrap a long address — a required CC BY credit
   line was cut off at the Credits sheet's edge (every game's long lines were).
8. **The chips' look in 3 areas with 8 players is shot in the lab with the game's own markup + css** (the real view's chips are shot
   by the 3- and 4-phone match checks); an 8-phone match to the Mothership was not run (the checks drive 3 and 4 real phones; the
   8-kid scene is the lab's measure, as in H5C / H6A).
9. **THE GATE HAS NO CROSSBAR** (the first review): it hid the traffic in the lane behind it. Two posts in the edge columns + a line
   on the ground between them (a neon line by night, a painted striped line by day — twice as bold after the second review).
10. **THE BLACKBIRD's afterburners are SOLID FLAME CONES** (the second review): additive ribbons washed to a white smear over the lit
   runway by night and read as see-through stripes by day. One opaque, unlit, tapered cone a nozzle — the same fire in both looks.
11. **DOWNTOWN's shops are turned half round + 1.8 wide, pastel walls by day, a fat awning + a fat neon sign:** Kenney's fronts faced
   away from this camera, and a dark grey kit building read as a block.
12. **The DAY band's rest offsets were re-tuned** (the cranes, the fish hall, the rail yard, downtown's towers were cut by the screen's
   edge) — numbers in `skyline.js#SKY_BIAS`; a truck by day is lit a touch under (its white box blew out).
13. **THE MOTHERSHIP's kids' lights are drawn on ONE bitmap canvas inside her sprite** (measured: eight DOM lights — and then a default
   canvas the browser moved to the GPU — cost one 150 ms frame as the first kid reached the rim).
14. **THE END SCREEN's MEMORY — three calls:** (a) the resting scene is a pixel-ratio-1 STILL, not a freed scene — PLAY AGAIN must stay
   instant (THE INSTANT AGAIN), so the scene's models + textures stay loaded; (b) the run's picture is KEPT (4.5 MB, was 9.6) while the
   end screen is up instead of being released after the upload — a second SHARE tap and the no-link fallback draw the card from it;
   (c) "measured on WebKit" was not possible here: the number is the pixels the page holds, counted in the page (the same in any
   engine) — see the table's caveat.

## THE MIX — the table (`node tests/integration/jaywalk-mix.mjs "<chromium>" --md`, Chromium's OfflineAudioContext, 48 kHz)
Integrated loudness (ITU-R BS.1770 K-weighting, 400 ms blocks, gated) + the loudest 0.4 s + the sample peak, AT THE SFX BUS'S DOOR
(after the cue's gain → THE SOFT LIMITER → the trim; the city's sounds: after their gain). "out" = at the default Effects slider
(− 6.2 dB); the music at its default sits at ≈ − 34 LUFS out. **22 cues — none clips.**

| cue | file's own (LUFS · peak dBFS) | gain | into the SFX bus (LUFS · loudest 0.4 s · peak dBFS) | out at the default slider (LUFS) |
| --- | --- | --- | --- | --- |
| hop | -13.5 · -3.3 | 1.25 | -30 · -30 · -14.7 | -36.2 |
| land-wood | -16.8 · -2.6 | 1.4 | -29.3 · -29.3 · -13.2 | -35.5 |
| hit | -18.2 · -2 | 2.1 | -26 · -26 · -10 | -32.2 |
| splash | -24.1 · -2.1 | 2.2 | -22.3 · -22.3 · -3 | -28.5 |
| horn | -23.4 · -13.8 | 0.5 | -27.1 · -25.1 · -18.9 | -33.3 |
| train-bell | -14.3 · -1 | 0.29 | -21 · -20.9 · -10.7 | -27.2 |
| train-horn | -7.3 · -1.3 | 0.23 | -19 · -16.6 · -13 | -25.2 |
| train-pass | -23.4 · -8.5 | 1.2 | -17.9 · -16.2 · -5.9 | -24.1 |
| lights-die | -25.8 · -2.7 | 1.6 | -22.4 · -20.5 · -8.7 | -28.6 |
| area-arrive | -11.2 · -1.2 | 0.36 | -19 · -16.4 · -9 | -25.2 |
| new-best | -23.2 · -4.4 | 1.45 | -17 · -14.4 · -6.7 | -23.2 |
| city · radio-static_1 | -20.3 · -1.9 | 0.34 | -26.7 · -22.3 · -11.3 | -32.9 |
| city · jet-scream | -20.2 · -3.5 | 0.62 | -21.3 · -16.6 · -7.7 | -27.5 |
| city · sonic-boom | -22.1 · -1.5 | 0.8 | -21.1 · -14.6 · -3.4 | -27.3 |
| city · ufo-hum | -24.5 · -9.1 | 0.3 | -33.4 · -31.6 · -23.6 | -39.6 |
| city · ufo-beam-on | -20.3 · -5.1 | 0.6 | -21 · -19.1 · -13 | -27.2 |
| city · ufo-lift | -20.4 · -5.8 | 0.5 | -21.3 · -18.7 · -11.8 | -27.5 |
| city · ufo-depart | -20.3 · -5.1 | 0.6 | -21.2 · -18.7 · -9.6 | -27.4 |
| city · ufo-beam-off | -20.2 · -7 | 0.46 | -25.6 · -20.9 · -13.7 | -31.8 |
| city · ufo-hum@ship (rate 0.5) | -24.5 · -9.1 | 0.75 | -27 · -25.6 · -17.1 | -33.2 |
| city · ufo-beam-on@ship (rate 0.62) | -20.3 · -5.1 | 0.72 | -20.8 · -16.6 · -11.5 | -27.0 |
| city · ufo-lift@ship (rate 0.75) | -20.4 · -5.8 | 0.6 | -21.2 · -17 · -10.2 | -27.4 |

22 cues — none clips (every peak under −0.3 dBFS at the SFX bus)

Before this pass (the same measure): train-bell − 11.2 LUFS into the bus · train-horn − 9.9 · area-arrive − 9.9 (against the hop's
− 28.4, the hit's − 26): 10–17 dB hot. The music ducks: the Blackbird's pass 0.45 · the abduction 0.4 · the Mothership 0.62 → 0.3 ·
the train 0.72 (as it was). **Nobody has heard it on a phone's speaker: the numbers are the engine's.**

## THE FRESH-EYES REVIEW — TWICE (Group 5; each a fresh read-only reviewer with no context but the shots, 390 × 844 @3)
The shots: `Downloads\NEON\jaywalk-h6b\` (the reviewers read phone-size copies). The first reviewer saw the full day + night set
(193 frames); the second saw ONLY the set re-shot after the first fix round (137 frames) — it never saw the first report.

### THE FIRST REVIEWER — the report, VERBATIM
> FRESH-EYES VISUAL REVIEW — JAYWALK H6B
>
> Opened: all 193 PNGs listed in C:\Users\benja\Downloads\NEON\jaywalk-h6b\_phone\FILES.txt at phone size, none failed to open. About 30 were also opened at full resolution from C:\Users\benja\Downloads\NEON\jaywalk-h6b\ (everything ranked in the top 10 below, except where noted). The viewer dropped older images as I went and refused some third looks, so a few groups (blackbird glint and hit frames, the docks chips, lane-395) are judged from one viewing only; nothing in them stood out.
>
> A) WEAK POINTS, WORST FIRST
>
> 1. The gate's crossbar hides traffic, in both looks, at every gate.
> Files: gates/day-4-bridge-e-in-the-gate, gates/day-7-lighthouse-d-3-lanes-out, gates/night-7-lighthouse-d-3-lanes-out, gates/night-3-rail-yard-d-3-lanes-out, shops/day-downtown-lane-253-left-edge, shops/night-downtown-lane-253-left-edge.
> - The name board is correctly gone by 3 lanes out, but a full-width raised bar remains across the road. It is striped by day (red/cream at the bridge, gold/cream at the lighthouse, pink/white in downtown) and a plain dull bar by night.
> - It covers the vehicle in the lane behind it. In day-4-bridge-e a red van is half hidden behind the red stripe, two to three lanes ahead of the kid, and its colour matches the stripe. In both lighthouse "d" shots the middle of a pink van is cut out by the bar. In day-253 the bar clips the tops of the yellow cars beside the kid.
> - By night the bar loses its stripes and reads as a blurry grey-bronze smear, the flattest object in the night scene.
> - It falls short because a hazard is hidden by decoration in a lane the kid is about to cross, which is the thing the gate-sign change was meant to end.
> - Suggestion: draw the gate as a painted line or tape on the ground with posts only in the edge columns, or fade the bar with the same window as the board.
>
> 2. A night band over a day world in a real match shot.
> File: e2e-match/match-day-ghosts (checked at full resolution).
> - The band is the plain night skyline with the night sea wall and unbacked night-style chips. Everything below the wall is full day: bright grass, grey roads, white fog, the day haze.
> - A still cannot tell whether this is a frame caught at the very start of a look switch or a phone whose band never switched. As a picture it is the most broken-looking frame in the set, with a hard horizontal seam at the wall.
> - Also in match-ghosts and match-day-ghosts: three players are on the chips at the same lane but only one kid is visible, with no ghost beside or behind him. A still cannot tell whether the ghosts are stacked exactly under the player's own kid. ship/night-1-the-warning and ship/day-1-the-warning do show ghosts clearly as translucent kids side by side.
>
> 3. The UFO by day while drifting is weak.
> File: ufo/day-1-drifting (full resolution).
> - The saucer sits up in the far haze under the wall with its top half swallowed. What shows is a flat grey-brown underside with a pale rim: a dull oval smudge, not chrome, with no visible rim lights.
> - The beam is a faint pale-green column that nearly vanishes over the tan paving. Only the green ground ring is strong.
> - This misses the pass's own aim of a solid chrome saucer with bright rim lights and a strong, clearly visible beam.
> - For contrast, ufo/day-2c-up-the-beam is exactly right: a full chrome hull with glass dome and rivets, the kid clearly rising, the world dimmed. The night saucer (sky/night-3-rail-yard, ufo/night-2b) is solid, with bright rim lights and a strong beam.
> - Suggestion: hold the day saucer one lane lower so it clears the haze, and give the day beam the same opacity it has in the abduction frames.
>
> 4. The chips still cover the landmark by day.
> Files: chips/day-lighthouse-8-players-top, chips/day-bridge-4-players-top, chips/day-bridge-8-players-top (the lighthouse one at full resolution).
> - By day the chips sit on a dark-blue veil about 83 pt wide. In the day lighthouse band the tower stands at x ≈ 65–100 pt, so the lane numbers and the veil's right end lie on the left half of the lighthouse from the lamp room down to the rocks.
> - In the day bridge band the left tower is under the chip block even with four players.
> - At night the same chips are clear of both landmarks (the night bridge tower and lighthouse sit further right), with the lighthouse touching the number column.
> - The compact layout itself (dot, short name, lanes, struck-through and ✕ for out players) is good and readable. The aim is met at night and not by day.
> - Suggestion: either shift the day pictures' rest offset so the left landmark starts right of ~90 pt in a match, or drop the day veil to a text shadow so the tower shows through.
>
> 5. Downtown's shops read as small grey boxes.
> Files: all eight in shops/ (day-264 and night-264 at full resolution).
> - At the right edge, three or four models show mostly their flat roofs and back walls: a charcoal upper storey with two tiny windows and one orange strip, then low white blocks with a single purple or cyan line. No awning face, door or shop window faces the camera.
> - At the left edge (lanes 253, 272) only a dark vertical sliver is on screen, reading as a slab.
> - By night the lit windows and neon strips help, but at 390 pt each shop is about 40 pt of mostly roof.
> - This is better than plain boxes, but not "real storefronts" to a player who was not told.
> - Suggestion: turn the fronts to face the camera/road and give each one a saturated awning large enough to read as a silhouette.
>
> 6. The Blackbird's burners and night silhouette.
> Files: blackbird/day-3a-the-burners, day-3b-the-shockwave, night-3-mid-pass, night-3a-the-burners (both 3a at full resolution).
> - Day: the two flames are flat, hard-edged orange and blue wedges with a row of evenly spaced white dots along each, like beads on a string. They are visible and bigger, but they read as vector stripes rather than fire, and they are the most clip-art element in the day set.
> - Night: the flames blow out into one white-pink glare with no distinct twin cores. The white shock ring is so large and bright that it sits in front of the near-black airframe, and the plane is lost against the dark road (the day silhouette is clear).
> - Suggestion: soft-edged tapered flames with a single hot core each and no dot row; at night a thin rim light on the airframe, and a thinner or shorter-lived ring.
>
> 7. Three landmarks are weaker than the rest.
> Files: sky/night-3-rail-yard (+ -top), sky/day-3-rail-yard-top, gates/day-4-bridge-e-in-the-gate, ufo/day-1-drifting.
> - Night rail yard: the water tower is a dark silhouette on a dark sky directly under the lane number, hard to pick out at phone size. The signal gantry (two red, one green) and the floodlights carry the picture alone. It is the dimmest of the eight night landmarks.
> - Day rail yard: the signal gantry and freight cars sit at the far right edge and are cut by the screen.
> - Day fish market: the fish sign and striped hall are also hard against the right edge, partly cut.
>
> 8. Night-picture lights showing on the day water.
> File: ufo/day-1-drifting (full resolution).
> - Purple and cyan pixel-window blocks sit on the blue day water at the left of the band (around x 45–75 and 185 of 924, plus scattered cyan dots).
> - ufo/day-2c at the same place is clean, so this may be a shot taken before a switch finished fading. A still cannot tell.
>
> 9. Small red dots in the night pictures.
> Files: every sky/night-*-top.
> - The base night skyline carries pairs of red dots side by side on dark towers (left-centre of every band). They read as pairs of eyes.
> - A single red dot floats just above the canal gables (right), above the hangar roof and above the right end of the market hall. None sits on a landmark's face and none looks like a dark block; they are small enough to pass as warning lights.
>
> 10. The Blackbird's tell by day is low-contrast.
> File: blackbird/day-1-the-tell.
> - The runway lights are pale cream dots on light grey and only the yellow chevron patch at the right carries the warning. blackbird/night-1-the-tell is unmistakable.
>
> 11. Spectating text.
> File: e2e-match/match-spectate.
> - "OUT / LOST IN THE FOG / 5 LANES" is caught translucent over the water, with "5 LANES" straddling the sea wall. It is washed out in this frame; it is mid-fade, so a still cannot settle it.
> - The bottom line ("WATCHING ALICE · TAP FOR THE NEXT · YOUR CALL · ALICE") wraps to two lines over white fog.
>
> 12. A faint green arc in the far haze.
> Files: taillights/night-a-busy-road, taillights/day-a-busy-road, shops/night-downtown-lane-264-right-edge.
> - A dim green crescent floats over the farthest lane just under the wall with nothing attached to it. It is probably the UFO's ground ring seen through the haze, and it reads as a smudge.
>
> 13. Credits wrapping.
> Files: credits/credits-jaywalk-1, -3.
> - Raw addresses break mid-word, and the monospace licence line leaves "/)" alone on its own line (twice in -1, once in -3). Everything else in the group is clean.
>
> 14. The Mothership warning line by night.
> File: ship/night-1-the-warning, ship/night-2-the-warning-last-seconds.
> - The red dot-matrix "THE MOTHERSHIP · 0:08" lies directly on the skyline's neon lights with no backing. It is legible but noisy. The day version has a dark strip behind it and is cleaner.
> - It is the only countdown on screen in both looks.
>
> B) ALREADY MEETS THE BAR
>
> - Night skylines: fish market (neon fish, striped awnings, lit stalls), bridge (cable lights), canal (lit gabled houses and arches), airfield (tower, lit hangar, windsock, parked plane), docks (floodlit cranes), lighthouse (lamp and beam). All are on screen and clear of the number; the lighthouse lamp is tight to the first digit (~5 pt) but clear. The opening picture is plain as intended.
> - Cross-fades: sky/night-1-docks-cross-fade-mid and both look-switch mids are clean blends with the wall staying put.
> - Gate name boards, all eight areas, both looks: readable at 9, 7 and 5 lanes out (neon outline boards by night, coloured boards by day), sitting under the wall over the far haze, and fully gone in every "d" and "e" shot.
> - Chips at night: compact, legible, clear of the bridge and the lighthouse.
> - UFO abduction sequence, both looks: solid hull, dome, bright rim lights, the kid visibly rising and going in, the world dimmed round the beam.
> - Mothership: one countdown, the arrival filling the top third, the traffic stopped, the kids rising as lights of their own colour into the port. e2e-match/h6a-ship-gold-finish is strong.
> - Tail lights: a thin red bar across the full rear plus one soft centred glow on every car, van, truck and the train, the same in both directions; by day plain red on the body with no glow.
> - blackbird/night-1-the-tell; the Blackbird's size and day silhouette.
> - Podium content from JAYWALK: the cause lines name the vehicle ("RUN DOWN BY A VAN", "CLIPPED BY A HATCHBACK").
> - The two cards and the credits' content.
>
> C) THE SINGLE WEAKEST THING
>
> The crossbar left across the road at each gate hides the vehicle in the lane behind it (a red van behind a red stripe, two lanes ahead of the kid, in gates/day-4-bridge-e-in-the-gate) and by night is a flat blurry bar.

### … and what was done with each point (commit `70c16c40`)
| # | the first reviewer's point | what was done |
| --- | --- | --- |
| 1 | the gate's crossbar hides the traffic in the lane behind it, both looks; a flat smear by night | **FIXED** — the crossbar is GONE: a gate = its two posts in the edge columns + a line ON THE GROUND between them (a striped painted line by day, a neon line by night). Nothing stands over a lane |
| 2 | a night band over a day world in the real match's day shot; no ghost seen beside the kid on the start cell | **CAPTURE** — the shot was taken the instant CHARLIE switched his look: the band's cross-fade (1.5 s) had just begun. Both end-to-end checks now WAIT for the band to show the day picture and assert it (so "a band that never switched" would fail them). The ghosts on the start cell: H5B's rule (a ghost standing on your own cell is hidden — NEAR YOU = FAINT) |
| 3 | THE UFO by day while drifting: half in the haze under the wall, dull, no rim lights seen, a faint beam | **FIXED** — it hovers LOWER while its ring is far up the screen (its top never above 31 % of the screen; back at its full height as the ring nears him); by day its rim lights are 1.4× + saturated (green / warm white) and its beam a saturated green with darker edge lines |
| 4 | the chips still cover the landmark BY DAY (the dark veil over the lighthouse / the bridge's left tower) | **FIXED** — by day the veil is faint (the picture reads through it) and the letters carry the day's own ink; the day lighthouse rests 12 pt further right (clear of the chips). The bridge's left tower still stands behind the chips' column — through the faint veil (the bridge spans the band's whole left half: there is nowhere else for either) |
| 5 | DOWNTOWN's shops read as small grey boxes: roofs + back walls, no front toward the camera | **FIXED** — measured: all four of the kit's fronts (the door, the awning, the shop window) faced AWAY from the camera; they are turned half round in the builder, and a touch bigger (1.8 wide). What an edge column shows at ZOOM 8 is still a part of each (the play's 9 columns fill the screen) |
| 6 | THE BLACKBIRD's burners: hard wedges + a row of white dots by day; one white glare by night; the ring in front of a lost airframe | **FIXED** — no row of dots (ONE hot core a nozzle), a soft warm aura round each flame by day, softer layers; by night narrower flames (two read as two), ONE thin brief vapor ring at half strength, the ground ring at 0.5, a cool light of its own on the airframe |
| 7 | three landmarks weaker: the night rail yard's water tower dark under the lane count; the day rail yard + fish market cut by the right edge | **PARTLY** — the DAY band's rest is re-tuned (docks + 16 · fish + 11 · yard + 17 · downtown + 5): the cranes, the fish hall, the rail yard, the towers are on the screen. The night rail yard's water tower is the painting itself (dark on dark, and no offset clears the count without losing the signal gantry) — OPEN FOR BEN |
| 8 | night-picture lights on the day water in the UFO's first day shot | **CAPTURE** — shot inside the look switch's cross-fade; the kits now wait a look change out before any shot |
| 9 | pairs of small red dots on dark towers in every night band ("pairs of eyes") | **LEFT** — the night picture's own aviation lights (they blink in the game: a still cannot show it), there since H2; the ones a landmark covers are off |
| 10 | THE BLACKBIRD's tell by day is low-contrast | **LEFT** — the owner: "the tell stays" (H6A); its yellow chevrons carry it by day. Listed under OPEN FOR BEN |
| 11 | the spectator's OUT words mid-fade; the WATCHING line wraps | **LEFT** — a frame caught mid-fade; the two-line WATCHING line is H4's (the match kit's call sits in it) |
| 12 | a faint green arc in the far haze with nothing over it | **FIXED** — a UFO's ground ring now fades with the far haze (it was drawn at full strength under the wall) |
| 13 | the credits: an address breaks mid-word; a lone "/)" on its own line | **PARTLY** — the three licence fields that repeated an address are now the licence's name alone (no more lone "/)"); a raw source address still wraps where it must (it was cut off before) |
| 14 | THE MOTHERSHIP's warning line by night lies on the skyline's neon | **FIXED** — its dark band is more solid (0.92) in both looks |

### THE SECOND REVIEWER — the report, VERBATIM
> OPENED: all 137 PNGs of the set at phone size (FOLDER\_reshot\...), none failed to open. Also opened 53 of the 1170 px originals (every item ranked 1-8 below was checked at full resolution, except where I say otherwise). One honest caveat: my image viewer could hold only a few pictures at a time, so I went through the set in several passes and kept written notes; where a finding rests on one or two frames I name them. Nothing was edited, run or created.
>
> A) WEAK POINTS, WORST FIRST
>
> 1. THE BLACKBIRD'S AFTERBURNERS BY NIGHT DO NOT READ AS FIRE (aim 5 does not hold at night; only half holds by day).
>    Files: blackbird/night-3a-the-burners, night-3-mid-pass, night-3b-the-shockwave; day-3a-the-burners, day-3-mid-pass.
>    Night: in 3a there are no two flames at all. Behind the tail is one white smear that merges into the big white shock ring; no blue-white cores, no orange, no pink tail. In 3-mid-pass the burners are a small white-pink streak cut off by the right screen edge. The amber runway lights underneath are brighter and more colourful than the jet's exhaust.
>    Day: 3a does show two long orange-red trails with pale blue-white centres, so the colour is there, but they are flat, see-through bands about half a screen long. They read as motion stripes, not flame, and where they cross a log they just tint the log red. In 3-mid-pass they are mostly off the right edge.
>    Two more things on the jet itself: the shock ring is drawn straight across the fuselage in both looks (night-3-mid-pass, day-3-mid-pass), which makes the airframe look see-through; and by day the jet sits on a hard pure-black oval shadow (day-3-mid-pass) that looks pasted on. The dark airframe itself is readable at night (slate grey over the lit runway) - that part holds.
>    Suggestion: short, opaque, tapered flame cones attached at the nozzles (white-blue core, saturated orange, pink tip) drawn on top of the ring and brighter than the runway lights at night; keep the long streak faint behind them. Ring behind the jet, not over it. Soften the day shadow.
>
> 2. DOWNTOWN'S EDGE SHOPS STILL READ AS DARK GREY BLOCKS (aim 7 holds only weakly).
>    Files: shops/day-downtown-lane-264-right-edge, night-...-264-right-edge (full-res); day/night ...-253-left-edge and ...-272-left-edge (phone size only).
>    Day 264: three small stacked buildings with dark charcoal roofs and grey walls, a few small blue windows, and one thin coloured strip each (green awning, orange, purple, cyan). What the player mostly sees is roof and grey wall; the "front" is a sliver along the bottom. They also look tilted/leaning. Against the candy-coloured cars, red hydrants and the bright skyline they are the drabbest objects on screen. The two left-edge shots show only a thin dark sliver at the screen edge - nothing a player would call a shop.
>    Night 264: better - white lit windows, a lit ground floor, thin neon strips - but still mostly dark mass, and the neon strips are hairlines.
>    Suggestion: turn the fronts so the awning and shop window face the camera, make the awning a fat saturated block (it is the "one bright accent"), lighten the walls by day, and at night make the neon sign a readable shape rather than a line.
>
> 3. THE MOTHERSHIP: THE OTHER KIDS' LIGHTS ARE WEAK BY DAY AND DO NOT CLEARLY GO INTO THE PORT BY NIGHT (aim 6, second half, holds only for your own kid by day).
>    Files: ship/day-4-the-lift, day-5-the-lift-higher, night-4-the-lift, night-5-the-lift-higher.
>    Day-5: your own light is a clean cyan dot sitting in the glowing central port - good. The other three kids are pale yellow / teal / green smears halfway up the beam, washed out by the cream beam; at phone size they are barely there.
>    Night-5: three small coloured rings (yellow, blue, green) sit at the hull's lower rim, not in the port, and the cyan dot sits above the port on the hull plating just under the lane number. In that frame the lights look like they are going past or around the port, not into it. A still cannot show the path, so I cannot say whether this is one frame of a correct motion - but the frame as shot does not show "into the central port".
>    The countdown half of aim 6 holds: one red line, readable in both looks.
>    Suggestion: solid, saturated dots (same style as your own) for every kid by day; end every path at the port's centre and let them vanish there.
>
> 4. THE MATCH CHIPS COVER PART OF THE LANDMARK BY DAY (aim 3 holds by night, not fully by day).
>    Files: chips/day-bridge-8-players-top, day-bridge-4-players-top, day-lighthouse-8-players-top; compare night-bridge-8, night-lighthouse-8.
>    Day bridge, 8 players: the chip column sits on the bridge's left tower and the left third of the span; the tower shows only through the veil, and the three struck-out names lie right on the cables and are hard to read. With 4 players the tower is still under the bottom chip.
>    Day lighthouse: the lane numbers (374, 367, 360...) touch the lighthouse's left side; the veil ends on the tower.
>    By night both are fine: the bridge towers start right of the column and the lighthouse stands just clear.
>    The chips themselves are compact and legible (dot, name, lanes), but 7-letter names are cut to "CHARL..." and "ALEXA..." - a very common name length; in e2e-match the real chip also reads "CHARL...".
>    Suggestion: by day shift the band's rest position (or the chip column) so the left tower / lighthouse clears the column; give the name one or two more characters.
>
> 5. THE UFO BY DAY: RIM LIGHTS AND THE DRIFTING BEAM ARE WEAK (aim 4 holds at night, partly by day).
>    Files: ufo/day-1-drifting, day-2b, day-2c, day-2d; compare night-1-drifting, night-2b.
>    The saucer is solid in both looks - never see-through - and the kid does go up and into it, and the world does dim round the beam. Night is strong: dark hull, big white rim lights, saturated green beam and ring.
>    By day: the "bright rim lights" are a few small green/yellow blobs tucked under the rim, mostly hidden; the hull is a plain light-grey disc with rivets (closer to a pot lid than chrome); while drifting, the beam cone is a pale wash and the moment reads mainly through the green ground ring. There is also a thin hard green vertical line down the left side of the beam in day-1, 2b, 2c and 2d that looks like a rendering artifact.
>    Suggestion: bigger, brighter rim lights on the visible upper rim by day; a stronger highlight band on the hull; denser beam cone; remove the line.
>
> 6. THE WHITE TRUCK TRAILERS ARE BLANK WHITE SLABS BY DAY.
>    Files: nearly every day shot with a truck - e.g. gates/day-2-fish-market-b, day-4-bridge-b, chips/day-bridge-*, blackbird/day-3-mid-pass.
>    The trailer is pure flat white with no shading, panel line or edge, so at phone size it is a white rectangle with a coloured stripe. It is the one flat, unfinished-looking vehicle in an otherwise well-shaded toy set. By night the same trailers have a lilac sheen and look fine.
>    Suggestion: a light grey side/top split or a faint panel line by day.
>
> 7. THE NIGHT BAND IS THIN IN PLACES: THE OPENING, AND TWO GATES.
>    Files: gates/night-1-docks-d-3-lanes-out (and the docks night gates generally), night-4-bridge-e-in-the-gate, night-8-airfield-e-in-the-gate.
>    Lanes 0-50 by night show only scattered small neon windows on black - no landmark, no silhouette. It is the first band a night player sees and the emptiest in the set. In the bridge gate (lane 200) the outgoing and incoming pictures are both dim, so the band is a murky double image. In the airfield gate (lane 400) the lighthouse is cut by the left screen edge and the control tower is a nearly invisible dark shape on a dark sky.
>    Suggestion: give the opening night picture one lit landmark; give the airfield tower lit windows / a beacon.
>
> 8. THE LOOK SWITCH HALF-WAY IS A DOUBLE EXPOSURE, NOT A CLEAN FADE (aim 2, second half: holds, with a blemish).
>    Files: sky/look-switch-day-to-night-mid(-top), look-switch-night-to-day-mid(-top).
>    Both pictures do show at once and the sea wall stays put - as intended. But the day lighthouse and the night lighthouse are different sizes and positions, so mid-fade there are two overlapping lighthouses and two sails. For 1.5 s it will pass, but it reads as a ghost image. I cannot judge the motion from stills. Both mid frames were shot on an end-of-run screen (blackout / fog), so I cannot say whether the ground fades with the band.
>
> 9. THE MATCH FRAMES: STREAKY FOG, AND NO NIGHT FRAME.
>    Files: e2e-match/match-day-ghosts, match-ghosts (full-res).
>    The fog bank at the bottom has visible horizontal banded smears. In match-ghosts the ghost standing in your own kid's square is a muddle (a small cap and a pink tint inside your ring). Both ghost frames are in the DAY look - the set contains no real-match frame by night, so the real chips and ghosts by night are unverified here (the lab chips by night are fine).
>
> 10. THE BIG LANE NUMBER COMES VERY CLOSE TO SOME LANDMARKS.
>    Files: gates/day-2-fish-market-e-in-the-gate (the cranes' tops meet "100"), sky/day-5-downtown-top (the "4" is a hair from the tallest spire), chips/night-docks-8-players-top (the crane boom runs behind the "2").
>    Aim 2's first half otherwise holds: in all eight day bands the landmark is fully on screen. With three-digit numbers the clearance is thin in these three.
>
> 11. THE DAY GATE IS VERY QUIET ONCE THE SIGN IS GONE.
>    Files: gates/day-*-e-in-the-gate. By day the gate is a pale paved strip with short red/orange dashes; by night it is a glowing neon line that looks great. By day a player could cross it without noticing. Minor; nothing is hidden.
>
> 12. CREDITS - SMALL THINGS ONLY.
>    Files: credits/credits-jaywalk-1..3. Long addresses break mid-word ("TommasoMottera / n"); the 3D-model credits appear twice (a summary entry, then full entries); "one a neighbourhood" reads oddly. Clean otherwise.
>
> B) ALREADY MEETS THE BAR
>
> - THE GATE SIGNS (aim 1 holds in every gate I checked, both looks): big, crisp, readable at 7 lanes out, hanging under the sea wall; fully gone at 3 lanes out and in the gate; the gate itself is posts at the edges plus a ground line and hides no vehicle or lane. The night neon-outline signs (DOWNTOWN, THE LIGHTHOUSE, THE CANAL) are the best-looking lettering in the set.
> - THE DAY BANDS: all eight painted skylines are rich, distinct and on screen (cranes, fish sign, train and water tower, bridge, towers, canal houses, lighthouse on its rock, control tower and hangar). The sea wall is solid at the band's foot everywhere.
> - THE NIGHT BANDS with a landmark: the lit bridge, the neon fish over the market stalls, the canal houses, the lighthouse with its beam, the floodlit cranes.
> - THE MOTHERSHIP itself: the arrival is the showpiece of the set in both looks - huge panelled hull, glowing port, the beam's pool on the ground. The single red countdown line is readable by day and night.
> - THE UFO BY NIGHT, and the abduction sequence in both looks (ring flare, beam, kid lifted, kid gone, world dimmed, "ABDUCTED").
> - THE BLACKBIRD'S TELL (runway lights + chevrons) and its silhouette; the shock ring is dramatic.
> - THE CHIPS' DESIGN: small, tidy, legible, eliminated players clearly struck out; by night they sit cleanly beside the landmark.
> - THE TAIL LIGHTS by night: one red bar and glow per vehicle, consistent and readable.
> - THE NIGHT LOOK OVERALL: neon lane number, glowing water, headlight streaks - consistently premium.
> - THE CREDITS: complete and readable.
>
> C) THE SINGLE WEAKEST THING
> By night the Blackbird's afterburners are a white smear lost in the shock ring - the one headline effect in the set that plainly does not show what it is meant to.

### … and what was done with each point (commit `5133412f`)
| # | the second reviewer's point | what was done |
| --- | --- | --- |
| 1 | THE BLACKBIRD's afterburners: a white smear lost in the ring by night; see-through "motion stripes" by day; the ring drawn across the fuselage; a hard black oval shadow by day | **FIXED** — the flames are SOLID CONES now (one opaque, unlit, tapered cone a nozzle: white-hot → blue → orange → a pink tip; it flickers in length; it glows by night — the bloom's layer), the same fire in both looks, in front of everything on the ground; the additive ribbons are down to a faint long tail + a soft glow; the vapor ring round the jet is GONE (it crossed the fuselage); the day shadow is soft + cool |
| 2 | DOWNTOWN's shops still read as dark grey blocks; hairline neon | **FIXED** — by day each shop's walls take a pastel of its sign's colour; a FAT saturated awning block stands over every shop front, toward the camera; the night sign is a fat tube. (The left edge still shows a sliver of a shop: the edge column is mostly off the screen at ZOOM 8) |
| 3 | THE MOTHERSHIP: the other kids' lights weak by day; by night they did not go INTO the port (your own light sat above it) | **FIXED** — a real bug: a light flew from the kid's CURRENT point (which keeps rising past the port) — it now flies STRAIGHT from where he went behind the rim to the port's centre and goes out there; every light has a dark ring behind it (it reads on the bright hull + in the cream beam); the lifted ghosts rise as you do (they reached the rim late); by day each rising kid's halo has a dark heart behind its colour. A new frame shows the lights at the port (`ship/…-5b-into-the-port`) |
| 4 | the chips cover part of the landmark BY DAY; a 7-letter name is cut | **PARTLY** — the name column is wider with no letter-spacing: a 7-letter name is whole (CHARLIE), the whole chip narrower (86 px); the day lighthouse rests a little further right (clear of the lanes column). **The day bridge still stands behind the column** — it spans the band's whole left half: OPEN FOR BEN |
| 5 | THE UFO by day: rim lights tucked under the rim, a "pot lid" hull, a pale drifting beam, a thin green line down the beam's side | **FIXED** — its rim lights sit ON its upper rim, bigger; a hard highlight band along its near rim; a dense saturated beam; the two edge lines are gone (one showed: it read as an artifact) |
| 6 | the white truck trailers are blank white slabs by day | **FIXED** — by day a truck is lit a touch under (its white box blew out on every face): its side reads under its top |
| 7 | the night band thin in places: the opening has no landmark; the airfield's tower dark on dark; a murky double image mid cross-fade at the bridge's gate | **LEFT — the paintings** (the opening keeps the plain night picture by decision; a cross-fade's half-way is two pictures). OPEN FOR BEN: a Grok touch-up of the night rail yard's water tower + the airfield's tower |
| 8 | the look switch half-way is a double exposure (two lighthouses) | **LEFT** — the decision is a cross-fade of two different paintings (their lighthouses differ in size + place); 1.5 s. Listed under OPEN FOR BEN |
| 9 | the match frames: streaky fog; the ghost in your own square a muddle; no real-match frame by night in the set | **LEFT / NOTED** — the fog bank is H5C's (not this pass's); a ghost on your own square is hidden by H5B's rule; the real match BY NIGHT is the 4-phone check (`e2e-match4/` — 81 / 81) |
| 10 | the lane count close to three landmarks with three digits | **LEFT** — the price of having each landmark whole on the screen (the cranes are wider than the room beside a 3-digit count) |
| 11 | the day gate is very quiet once the sign is gone | **FIXED** — its painted line is twice as bold |
| 12 | the credits: an address breaks mid-word; the 3D models twice; "one a neighbourhood" | **FIXED** — the summary line is gone (each model has its own line, the exact attribution); "one for each neighbourhood". A long address still wraps where it must |

## THE END SCREEN's MEMORY — before / after (the 8:50 am add-on; `tests/integration/kit/jaywalk-mem.mjs`)
MB of pixels the page HOLDS on the final screen at 390 × 844: the 3D canvas's buffer (colour + depth) + the bloom's targets + every 2D
canvas in the document + the run's kept picture. "Before" = the same checks against `night.js` + `view.js` of `5133412f`.

| the final screen | before | after |
| --- | --- | --- |
| SOLO @3 — five runs in a row | 40 · 40 · 40 · 40 · 40 | **7.6 · 7.6 · 7.6 · 7.6 · 7.6** |
| … of which: the 3D buffer | 22.6 (1170 × 2532) | 2.5 (390 × 844 — a still) |
| … the bloom's targets | 7.1 | 0 |
| … the run's picture | 9.6 (1080 × 2337) | 4.5 (1080 × 1080) |
| a 4-phone MATCH @2 — ALICE · BOB · CHARLIE · DANA | 29.7 · 32 · 32 · 32 | **7.6 · 10 · 10 · 10** (3 phones measured after the sprite's fix: 7.6 · 10 · 10; the 4-phone run: THE CHECKS) |
| … of which THE MOTHERSHIP's sprite (baked at the start, never seen in that match) | 6.5 | 0 |
| the same match @3 (the buffer + bloom of the solo row) | ≈ 46 – 48 | 7.6 – 10 |
| mid-run, for scale (@3) | 30.4 | 30.4 |
| JS heap on those screens (Chromium) | 80 – 142 | 60 – 128 (noise: the collector's timing) |
| Chromium's whole working set (Windows, the city + two phones) | 1,557 – 1,785 | 1,399 – 1,775 (no visible change) |

**THE BUDGET: 20 MB** (`JW_FINAL_BUDGET_MB`; the most after the fix ≈ 14 with the Mothership up + room). Asserted on all five solo
final screens (+ "never growing run over run") and on every phone's final screen of the 3- and 4-phone match + the Mothership's gold
finish. **Not proven on an iPhone** — the caveat in `docs/jaywalk.md`; one bug met on the way: the resting flag was declared below
the first `setLook` (the scene never built — the lab + the solo check caught it at once; pinned in the unit test).

## THE CHECKS (the mini PC, my own fresh emulators + `serve.mjs --emu`)
THE FINAL LOCAL RUN (Nov 17, after the last code change; the browser checks FIRST on fresh emulators, the rules + `/api` tests last;
nothing else busy). **No database rules change — nothing to re-publish.**

| the check | the result |
| --- | --- |
| unit — `node --test tests/*.test.mjs` (registration, cartridge, achievements, the budgets in it) | **2182 / 2182** |
| `e2e-jaywalk.mjs --perf` (the solo game, five runs) | **79 / 79** — tier 2 (@3) 59.9 fps · tier 1 (@2) 59.9 · tier 0 59.5, 4× CPU; PLAY AGAIN 55 – 70 ms; every final screen 7.6 MB |
| `e2e-jaywalk-match.mjs --perf` (3 phones) | **86 / 86** — 3 ghosts: 59.9 fps at tiers 2 · 1 · 0, 4× CPU (worst frame 17.1 ms); the final screens 7.6 · 10 · 10 MB |
| `e2e-jaywalk-match.mjs --four` (4 phones, by night) | **83 / 83** — the final screens 7.6 · 10 · 10 · 10 MB |
| the smoke test (THE PAGES LOAD, Chromium + WebKit) | **21 / 21**, no errors |
| harbor `ONLY=cartridge` | **3 / 3** |
| the lab check `jaywalk-lab.mjs --perf --webkit` | **139 / 139** |
| the lab `--h6b` (the full shot set, re-shot on the final code → `Downloads\NEON\jaywalk-h6b\`) | **258 / 258** |
| the lab `--h6b=perf` — a gate's cross-fade · THE LOOK SWITCH · DOWNTOWN with its shops; day + night; tiers 2 + 1; 4× CPU | **12 / 12** — 59.9 fps everywhere (p95 16.8 ms) except the session's FIRST look switch: 55.9 fps, ONE 133 ms frame |
| the lab `--h6a=perf` — the Blackbird's pass · the abduction · the Mothership + 8 kids | **15 / 15** — 59.9 fps; the Mothership's first arrival 59.0 (one 67 ms frame — H6A's level) |
| THE MIX — `jaywalk-mix.mjs` | 22 cues, none clips |
| `rules.test.mjs` · `server.test.mjs` (`/api`) · `share-card.test.mjs` | **83 / 83 · 66 / 66 · 2 / 2** |

**NOT RUN:** the full harbor suite (the cloud's, on the tagged push — a game pass: skipped there too) · the dailies' checks
(`wk-press` / `e2e-daily` — their known evening red is not this pass's) · the other games' E2Es (no file of theirs changed).

**Two races in the SOLO CHECK were found by this run and fixed in the check (not in the game):**
1. *A kid run down in the first seconds* (the course is picked after GO — about 1 first run in 3 stops on a road) earns XP, so the
   console's END-OF-ROUND MOMENT opens ≈ 4.5 s after the end screen, over PLAY AGAIN — and the check tapped under it (13 checks red
   in a row: the first run of this final suite, and one earlier). The check now waits out that window and taps CONTINUE first
   (`pastMoment` — as the match check always did).
2. *The bot's kid dying inside a 7 s perf window* starts a fresh view, so the frame list held 19 frames ("57 fps", one red check).
   The window is measured again on the new run.
Both exist on the code before this pass; neither is a frame-rate or a memory finding.
After the fix the solo check was run three more times: 79 / 79 (`--perf`), 76 / 76, and 76 / 76 on a first run that ended "RUN DOWN BY A
VAN" — the early-death path itself.

## REAL vs PLACEHOLDER
**No placeholder is left in the game.** What still waits is not H6B's: the owner's ear on the mix; the audition's `-b` backups of
the hop / the landing / the train pass (he picked all A); `tuning.js` + `CLOCK` (first-pass feel); the daily; the go-live flip.

## THE CARDS TO RE-APPROVE
**None.** (Named call 5: the two pictures are the ones already built + approved.)

## OPEN FOR BEN
1. THE END SCREEN's MEMORY is fixed by the numbers, NOT proven on your iPhone — a `killed` row on game:jaywalk/final after this build = the go-live review's (the next steps are named in docs/jaywalk.md).
2. NOBODY HAS HEARD THE MIX on a phone's speaker — the table is the engine's; your ear on the train's bell + horn, the area chime, NEW BEST (take B), the ducks.
3. The DAY BRIDGE stands behind the match chips' column (it spans the band's whole left half) — move the chips, or a Grok bridge that sits right?
4. Grok's NIGHT paintings: the rail yard's water tower + the airfield's tower are dark on dark; the opening has no landmark (by decision) — a touch-up?
5. THE LOOK SWITCH half-way is two paintings at once for 1.5 s (two lighthouses) — keep the cross-fade, or dip through dark?
6. The first look switch of a session costs ONE ≈ 130 ms frame (GPU-side; the same on H6A's code) — left.
7. THE BLACKBIRD's tell by day is low-contrast (decided: the tell stays) — the second reviewer still found it quiet.
8. DOWNTOWN's edge shops are partly off the screen at ZOOM 8 (the edge column is) — fine, or pull them a column in (they would cover a play column: not done).
9. H5C's fog bank shows banded streaks in match frames (not this pass's file) · the lane count sits close to three landmarks at 3 digits.

(The same list is in the inbox — `Downloads\NEON\ADDONS.md`, this pass's OPEN FOR BEN entry. The city-chat item was left for the city chat.)
