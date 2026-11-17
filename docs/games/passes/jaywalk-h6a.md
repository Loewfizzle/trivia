# JAYWALK — PASS H6A: THE BIG MOMENTS + YOUR BEST ANYWHERE (Nov 17 2026)

The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 16–17 — DECIDED, H6A)". What it built, in full: `docs/jaywalk.md`
"THE BIG MOMENTS" (THE BLACKBIRD · THE UFO · THE MOTHERSHIP) + "THE CARDS" + "YOUR BEST". This page = the log: the groups, the
fresh-eyes reviewer's report VERBATIM, what was done with each item, the checks, OPEN FOR BEN.

## THE GROUPS
- **Step 0** (`0a9c921e`): the decisions into `docs/games/plan.md`.
- **Group 0:** `scripts/lab-export.mjs` (222 marks — NO open FIX mark); the cloud run of `a1494089`: tests green, harbor skipped (a game pass).
- **Groups 1–3 — THE BIG MOMENTS** (`f3573e31` + this pass's later commits): ONE view module fetched ON DEMAND, `js/games/jaywalk/flyers.js`
  (JAYWALK's per-game budget had 4 KB spare of 2,450 — the three moments could never live in the eager graph; the placeholders they
  replace left `night.js` + `models.js`). The three models COPIED + re-packed by `scripts/build-jaywalk-assets.py --only=flyers`
  (blackbird 271 → 119 KB · ufo 67 → 61 KB · mothership 366 → 108 KB; the originals only read); their CC BY credits in
  `assets/jaywalk/models/CREDITS.md` + `LICENSE-flyers.txt` + `js/ui/credits.js`. The sounds = the city's own files (`audio/city/`).
  **THE MOTHERSHIP's model was judged LIT at phone size and kept** (the fallback — the UFO scaled huge — was not needed); because the
  skyline band is DOM over the 3D canvas, the ship is BAKED ONCE into a sprite through the scene's own renderer and stands over the band.
- **Group 4 — THE CARDS + YOUR BEST ANYWHERE:** the feats `{ boom, ufo, airfield, mothership }` (airfield: solo OR match; mothership:
  `taken` — a capped run) ride each result row as `f`; `core/match-report.js#jaywalkExtra` reads them — and a match run's lanes — only
  from the server's own match (`sv`). Four achievements (game `jaywalk`); **BEAM ME UP = a NEW card, `card-beammeup`, EPIC** (a named
  call: between the two rares and the legendary lane-400 feat) from Grok's `mothership.png`; **RIGHT OF WAY's picture swapped for
  Grok's redo** (the real kid), its motion re-fitted, v2 in the lab. NEW BEST shows on a MATCH end screen.
- **THE CATCH-UP: NOT BUILT — the data was never kept** (below, OPEN FOR BEN).

## THE FRESH-EYES REVIEW — the reviewer's report, VERBATIM
*(a subagent with a fresh context, read-only, given THE QUALITY BAR, the Step 0 designs and the 47 shots in
`Downloads\NEON\jaywalk-h6a\h6a\` — the set as it stood BEFORE the fix round below)*

```
FRESH-EYES VISUAL REVIEW — JAYWALK H6A (read-only; nothing edited, nothing run)

All 47 PNGs under C:\Users\benja\Downloads\NEON\jaywalk-h6a\h6a\ opened (blackbird 16, ufo 12, ship 12, game 7). None failed to open. Stills only, so motion (pulse, shimmer, spin) cannot be judged; where a design item is motion-only I say so.

Two capture problems first, because they hide things from this review:
- ship\night-5-the-lift-higher.png and ship\day-5-the-lift-higher.png are identical to the -6-the-lab-end shots (the lab's end words are already up). No frame shows the kids going into the ship.
- game\h6a-ship-podium-guest.png is not a podium: it is a LEVEL UP 3 overlay ("UNLOCKED MIDNIGHT") over a dimmed "4TH PLACE" sheet. What a lifted guest sees for the mothership finish is not shown anywhere.

======== A) WEAK POINTS, WORST FIRST ========

1. THE MOTHERSHIP — there is no beam, and the kids get lost in the lift (the match's climax).
Files: ship\night-3-the-arrival.png, night-4-the-lift.png, day-3-the-arrival.png, day-4-the-lift.png.
What I see: no white-gold beam column at all. The "beam" is a milky yellow-white wash over the whole playfield (roads go beige, cars go pastel) plus a soft glow blob on the grass. It reads as a low-contrast fog overlay, not as light from the ship's port. In the -4 shots the kids have risen straight up the screen to the road just under the ship's rim, where they sit on top of trucks and cars. In night-4 I can find a yellow blob (left) and a green one (right) but cannot find the player's own cyan kid. In day-4 the three visible kids are dark, grey-brown see-through figures with a faint tint — they look like shadows, the opposite of "glowing in their colour". They also rise toward the rim, not toward the glowing port in the middle.
Why it falls short: the design is ONE huge beam lifting EVERY kid, each glowing. Neither the beam nor the kids read. This is the frame players will screenshot.
Suggestion: draw a real cone from the port to the ground (hard bright core, soft edge, additive, with motes rising), and darken everything OUTSIDE the cone instead of whitening everything. Converge the kids on the port's centre line. Draw kids opaque and brighter than anything else, with a thick colour halo and a short trail, above traffic. Freeze or fade traffic inside the cone. Make the player's kid the biggest and last to go in.

2. THE UFO ABDUCTION by NIGHT — the kid is invisible for the whole lift.
Files: ufo\night-2a-the-circle-flares.png, night-2b-the-beam-slams-down.png, night-2c-up-the-beam.png, night-2d-into-the-saucer.png.
What I see: the beam core and ring are blown out to solid white; the kid is a white smudge in 2a, one cyan shard in 2b, and not findable in 2c or 2d. The four shots are nearly the same picture — no escalation from flare to slam to lift to swallow. The saucer hangs so low that the beam is a short stub between its rim and the ground, so there is no height for a float-up. A truck drives through the beam's foot in 2c and 2d and covers it.
Why it falls short: the owner asked for "more impressive", and the key beat (the kid floating up, spinning, shrinking) cannot be seen.
Suggestion: raise the saucer during the abduction so there is a long beam. Keep the beam's core see-through and put brightness in its edges and the ground flare. Draw the kid on top of the beam with a dark outline or its own colour glow. Stage distinct beats (ring flare only → beam hits with a ground shock ring → kid up → saucer lights flash). Hold or hide vehicles inside the circle for those 2 seconds.

3. THE UFO by DAY — the beam is almost invisible, the ring is dull, the saucer is not chrome.
Files: ufo\day-1-drifting.png, day-2a-the-circle-flares.png, day-2b-the-beam-slams-down.png, day-2c-up-the-beam.png, day-2d-into-the-saucer.png.
What I see: the saucer is a matte cream / beige disc with a pale teal dome — it reads as a dinner plate or straw hat, with one soft white highlight. No sky reflection, no hard sun glint. "The beam slams down" (day-2b) shows a faint green tint and nothing else. The ground ring is a soft, darkish, see-through green on grey asphalt — in day-1 it is a murky smudge under a van. The one good thing: the kid IS visible by day (tilted in 2a/2b, tiny under the rim in 2c).
Why it falls short: the design says a chrome saucer in the sun with a beam still clearly visible, and a BRIGHT green pulsing ring. Day is washed out where night is blown out — a clear day / night mismatch.
Suggestion: give the saucer a real chrome look (sky-blue top reflection, dark horizon band, warm ground bounce, a sharp sun star). By day, draw the beam as a saturated green-white shaft with a darker edge line and a cast-light patch on the ground, not an additive haze. Make the ring an opaque bright green line with a white inner edge.

4. THE MOTHERSHIP WARNING — no giant shadow, no build.
Files: ship\night-1-the-warning.png, day-1-the-warning.png, night-2-the-warning-last-seconds.png, day-2-the-warning-last-seconds.png.
What I see: at 0:08 the scene is ordinary gameplay with a red timer; no shadow on the road, skyline unchanged. At 0:01 the whole picture is uniformly dimmer and a pale sliver peeks in at the very top edge. There is no shadow EDGE sliding over the lanes — it reads as "the screen dimmed", not "something colossal is overhead". By day the red timer sits on the busiest part of the skyline (the lighthouse cuts through MOTHERSHIP, the digits sit on buildings); legible but noisy.
Suggestion: a hard-edged, elliptical dark shadow that enters from the far side and visibly crosses lane after lane over the 10 s, with rim lights reflecting on the road at night. Start the skyline darkening by 0:08. Put a dark plate or strong outline behind the red timer by day.

5. THE BLACKBIRD's glint + afterburner flare — too small, not at the edge, nearly invisible by day.
Files: blackbird\day-2a-the-glint-begins.png, day-2-the-glint.png, night-2a-the-glint-begins.png, night-2-the-glint.png.
What I see: a small white four-point sparkle about a tenth of the screen width in from the right edge. In night-2 it is readable; in night-2a it is a speck. By day it is a faint white star on light grey asphalt — I would miss it on a phone. No afterburner flare in any of the four (nothing blue-white, nothing at the actual edge). Meanwhile the yellow chevron block, the brightest thing on the band, has travelled to the OPPOSITE side by then, so the eye is pulled away from where the jet comes from.
Why it falls short: the design says a glint + an afterburner flare AT the edge, readable at phone size. It is also the fairness cue for direction.
Suggestion: a large flare hugging the entry edge (a third of the band's height or more), blue-white core with an orange rim, with a dark halo by day so it holds on grey. Keep the chevrons pointing from that edge so tell and flare agree.

6. THE BLACKBIRD HIT — no shockwave, looks arbitrary.
Files: blackbird\night-4-a-hit.png, day-4-a-hit.png.
What I see: the kid is upside down over the river at the left; on the band where he stood is a small, dim grey ring (nearly invisible by day). No jet, no blast, no flash in the frame.
Why it falls short: the design says the shockwave BLASTS the kid away. This reads as the kid being flicked into the water for no visible reason — unfair-looking.
Suggestion: keep the jet's tail and burner trail in frame at the hit, a bright expanding ring centred on the kid, a white streak along the throw, dust or debris, a frame or two of screen flash.

7. THE BLACKBIRD PASS by DAY — the jet is good, everything around it is timid.
Files: blackbird\day-3-mid-pass.png, day-3b-the-shockwave.png.
What I see: the black jet is sharp and reads well. But the shock ring is a hairline, pale circle that vanishes over the water and grey road; the afterburners are two thin white streaks with dots; there is no white flash on the band; and I see NO jet shadow on the lanes. Heat shimmer cannot be judged in a still. Because the jet is drawn up over the river lanes (altitude) with no shadow beneath, it is not clear which lanes it is actually over.
Why it falls short: the design names the shadow sweeping the lanes as the day signature, and it is absent. Night's band goes nuclear white; day barely reacts.
Suggestion: a hard dark jet-shaped shadow on the two band lanes directly under it, burner cones with blue-white cores and visible length, a thick ring with a dark trailing edge, a brief bright strip on the band.

8. THE BLACKBIRD PASS by NIGHT — a flat white slab and a ghostly jet.
Files: blackbird\night-3-mid-pass.png, night-3b-the-shockwave.png, night-3c-after-it.png.
What I see: in night-3 the band is a clipped white-yellow slab from edge to edge that swallows the runway lights and bleeds over the truck in the next lane. The jet is a hazy mid-grey, partly washed out — not a crisp dark silhouette with a rim light. The afterburners are a vague bluish glow, not two blazing cones. The shock ring is a thin white arc. In 3b the ring has become two disconnected pale arcs plus horizontal white smears — hard to read as one expanding ring. In 3c two hairline white-blue lines remain across the river and band edge and look like a rendering glitch.
Suggestion: keep the jet near-black with a thin warm rim light from the runway lights; cap the band flash so the lights still read; make the burners the brightest, most saturated thing; draw the ring as one thick continuous ring; fade the leftover lines faster or widen them into a soft trail.

9. THE MOTHERSHIP itself — flat, faceted, identical by day and night, and it covers the score.
Files: ship\night-3-the-arrival.png, day-3-the-arrival.png (and the -4, -5, -6 shots).
What I see: a dark navy dish with visible straight polygon edges on its rim, a thin pink ring line, scattered small white dots, and a white port. Big, but plain — flat fills, no panel detail, no rim glow. By day it is the exact same dark render with no sunlit side, so it looks pasted on. It fully hides the big lane number.
Why it falls short: "colossal" is delivered by size only. The BEAM ME UP card's ship (game\the-two-new-cards-full.png — concentric bands of warm lights, glowing hull) is far richer than the in-game one.
Suggestion: bring the in-game ship toward the card's — concentric rings of chasing lights, panel lines, a warm rim; a day version with a lit edge and sky reflection; smooth the silhouette; keep the score readable.

10. THE UFO's leftovers — rings with no saucer, and a green smear.
Files: ufo\night-2e-it-zips-off.png, day-2e-it-zips-off.png (the second ring also in night-2b / 2c / 2d, day-2c / 2d).
What I see: after the saucer leaves, two green rings stay on the ground — a faded one at the capture spot and a bright one to the right with nothing above it. During the abduction that second ring is already sliding away to the right while the saucer stays put. In day-2e a wide murky green haze fans down from the top of the playfield and tints the crates and bricks — it looks like a dirty stain.
Why it falls short: "the beam snaps out" is not what the stills show, and a bright ring with no saucer is confusing (is it still dangerous?).
Suggestion: once the saucer zips, kill the capture ring instantly and show no ring until a saucer is visibly above it again; replace the green haze with a short bright streak in the exit direction.

11. THE UFO DRIFTING — the saucer is clipped and dull, its beam is barely there.
Files: ufo\night-1-drifting.png, day-1-drifting.png.
What I see: the saucer's top is cut off by the far-edge band at the top of the playfield. At night it is a dark grey riveted disc on dark ground (a hubcap) with a few small dots and a faint dim-green column. By day, the beige plate and no visible beam. The night ring itself is bright and reads well, but vehicles drive over it, and its mint-white colour is not far from the player's own cyan ring.
Suggestion: keep the saucer fully inside the playfield, add bright rim lights and a visible thin beam while drifting, push the ring to a clearly yellower green so it cannot be mistaken for the player's ring.

12. THE PODIUM's reveal — an empty sheet, text bleeding through, and no moment for the new cards.
Files: game\h6a-reveal-1-the-moment.png, h6a-reveal-2-step-1.png, h6a-ship-podium-guest.png.
What I see: reveal-1 is the 1ST PLACE sheet with only the word TOTAL and a large black void above CONTINUE — as a still it looks broken. In reveal-2 the LEVEL UP overlay is not dark enough: the rows behind ("1 NIGHT STREAK", "UNLOCKED · UNCOMMON", "17% of players have this", "+4 MORE") show through and collide with "TAP TO CONTINUE" and the unlock card. The celebrated item is HEARTBREAKER, a level unlock; none of the four JAYWALK achievements gets a moment — they are only rows in the list.
Suggestion: never hold the empty sheet (first row in immediately); make the overlay's backdrop opaque enough that nothing behind reads; give an EPIC unlock like BEAM ME UP its own beat.

13. THE GOLD FINISH — good, but the crown is flat and the screen repeats itself.
File: game\h6a-ship-gold-finish.png.
What I see: the headline and the big 518 look premium. The crown is a flat three-point gradient shape — the one clip-art element on the screen. "518 / LANES" is followed at once by "518 LANES · YOU FINISHED 1ST", then "NEW BEST · WAS 20", then a "NEW PERSONAL BEST … 518 was 20" row — the same facts three times. WINNER is lemon neon yellow while the mothership line is warm cream-gold; two yellows that do not match. The burst rays are faint.
Suggestion: a crown with facets, jewels and a highlight (or the site's deco-medal treatment); drop the duplicate line; one gold; stronger rays.

14. NEW BEST on a match end screen — small issues.
File: game\new-best-on-a-match-end-screen.png.
What I see: reads fine overall. "ALICE WENT THE FARTHEST" is small blue-grey text over the blue day water — low contrast. "NEW BEST" is a modest pale-green line. The row says "PERSONAL BEST SET" here but "NEW PERSONAL BEST" on the gold finish — may be intended (first best vs beaten best), but it reads inconsistent.
Suggestion: darken behind the subtitle; give NEW BEST the gold treatment.

15. THE TWO CARDS — strong art, two nits.
File: game\the-two-new-cards-full.png.
What I see: both look premium. On RIGHT OF WAY there is a pinkish dotted strip along the right inner edge with a small glow spot just outside the lower-right corner; if that is the foil sweep caught mid-frame, fine, but in the still it looks like an artifact. The cards' kid is a smooth character with a face and a pink cap, while the in-game kid is a faceless voxel block — a style gap.
Suggestion: check the right-edge strip in motion.

Not ranked (per the brief): the plain swatch tiles in game\h6a-reveal-3-the-cards.png and reveal-2.

======== B) ALREADY MEETS THE BAR ========
- blackbird\night-1-the-tell.png — runway lights + gold chevrons are bright, clear, unmistakably a warning.
- blackbird\day-1-the-tell.png — reads clearly by day (softer than night but fine).
- blackbird\day-3-mid-pass.png — the jet model alone: sharp, black, recognisably an SR-71 at phone size.
- ufo\night-1-drifting.png — the green ground ring alone (bright, clearly green, not blue).
- ship\night-1-the-warning.png, night-2-the-warning-last-seconds.png — the red timer line itself is big and legible at night.
- game\h6a-ship-gold-finish.png — the gold headline + big number; says "MADE IT", never "TAKEN".
- game\h6a-reveal-3-the-cards.png — clean, readable list; achievement names and lines are clear.
- game\the-two-new-cards-full.png — both cards' art.
- The word "TAKEN" appears in none of the 47 shots.

======== C) THE WEAKEST MOMENT ========
THE MOTHERSHIP: of its designed parts (sliding shadow, darkening skyline, colossal ship, ONE white-gold beam, every kid glowing in colour) only the timer and a plain big dish are on screen — the beam is a fog wash and the kids, the player's included, are lost against the traffic, by day and by night.
```

## WHAT WAS DONE WITH EACH ITEM (the fix round — the set in `Downloads\NEON\jaywalk-h6a\h6a\` is re-shot AFTER it)
| # | the reviewer's point | what was done |
| --- | --- | --- |
| capture | the ship's -5 shots = the lab's end; the guest's podium under a LEVEL UP sheet | FIXED: the lift's shots are timed from the cap (0.5 · 1.35 · 2.25 s) and the scene is held 4.2 s (`holdMs`); the guest's own moment is tapped away before the shot |
| 1 | THE MOTHERSHIP: no beam, the kids lost | FIXED (the main work of the round): the whitening wash is gone (a 0.2 s flash only); everything OUTSIDE the beam goes DARK (`.jw-ship-shade`); a real cone from the port + its pool + ring; every lifted kid is drawn BRIGHT (ghosts no longer fade as they rise), in a thick halo of their own colour with a white heart + a short trail, and is drawn to the beam's middle as he goes. NOT done: traffic is not frozen / faded inside the beam (the world is the rules'); the kids still pass under the ship's rim, not into the port itself (the ship is a sprite over the canvas) |
| 2 | THE ABDUCTION by night: the kid invisible | FIXED: the beam is see-through in its heart (its light is in its edge, its foot, its ring); the saucer CLIMBS as it locks on (a long beam); the kid is lit, in a halo of his colour, with a trail, and shrinks later; a ground shock ring as the beam lands. NOT done: vehicles are not held out of the circle |
| 3 | THE UFO by day: beam invisible, ring dull, not chrome | FIXED: a saturated green column with dark edge lines + white motes; the ring = opaque green paint, thick, a white inner edge, on a dark ring; the saucer = full metal, a hard gloss, a cool tint + a sun star on its shoulder. (How chrome it reads in the sun is still the model's flat-shaded low-poly: PARTLY) |
| 4 | THE WARNING: no shadow, no build | FIXED: a hard-edged elliptical shadow comes in from the far side and crosses the road lane after lane (by its end it lies over him), its rim lights on the road by night; the skyline darkens from the first seconds; the red timer stands on a dark band (it read badly over the day skyline) |
| 5 | the glint: too small, not at the edge, invisible by day | FIXED: it sits AT the camera's own edge on the band's row (`edgeX`), it starts at 45 % of its size, a blue heart in an orange rim behind a 7-cell star, on a dark halo by day. NOT changed: the tell's racing lights (the owner: "the tell stays") |
| 6 | THE BLACKBIRD's hit: no shockwave | FIXED (`blast`): a white flash where he stood, a thick ring bursting out from him, a bright streak along his throw, sparks; he is thrown less far (he stays in the frame) |
| 7 | the pass by day timid, no shadow | FIXED: the jet's shadow = a hard dark shape laid on the band under it (over the band's lights); flame CONES (they widen as they fade) + a white-hot dart; a thick ring with a dark trailing edge; the flash |
| 8 | the pass by night: a white slab, a ghostly jet | FIXED: the runway's lights no longer all blaze through the pass and the flash is capped (the lights still read; the jet stays a dark silhouette), the burners are the brightest thing, ONE thick ring, the contrails are a soft widening trail that fades in 34 ticks (never hairlines) |
| 9 | THE MOTHERSHIP flat, same by day, hides the score | FIXED: panel seams + spokes, six rings of lights, a lit rim that rounds the faceted outline, a bigger lens — drawn on the bake; BAKED PER LOOK (a sunlit rim + the sky on its flanks by day); the lane count stays over it |
| 10 | rings with no saucer, a green smear | FIXED: while its saucer is away the ring is dim and comes back WITH the saucer (0.45 s after the abduction); the beam no longer stretches after the saucer as it zips (that was the smear). The ring itself is the rules' hazard: it is never hidden |
| 11 | the saucer dull while drifting | FIXED: bigger, brighter rim lights, a brighter steel, a clearer thin beam; the ring is a YELLOW-green (never the mint of a kid's ring). NOT changed: a far saucer is cut by the far edge (everything is — H5C's rule) |
| 12 | the podium's moment: an empty sheet mid-way, the LEVEL UP overlay bleeding through, no own beat for an epic | NOT JAYWALK's: the console's shared end-of-round moment (`js/progress/moment.js`, the city chat's) — in the inbox for the city chat |
| 13 | the crown flat, the lanes said twice | FIXED: a five-point crown with facets, a jewelled band + jewels on its points; the gold finish says its lanes ONCE (the big number); stronger rays. NOT changed: the console's WINNER word is its own yellow |
| 14 | NEW BEST on a match: modest; "PERSONAL BEST SET" vs "NEW PERSONAL BEST" | KEPT: NEW BEST is the solo end screen's own green (one look everywhere); the two row words are the console's (first best vs a beaten one) |
| 15 | the cards: a strip on RIGHT OF WAY's edge | CHECKED: the legendary's border laser caught mid-frame (it runs round the edge) — as on every legendary |

## THE CHECKS (the mini PC, my own fresh emulators + `serve.mjs --emu`)
- **The final local run, one suite after the other:** unit 2171 / 2171 · rules 83 / 83 (no rules change) · `/api` server 66 / 66
  (+ "JAYWALK H6A") + share-card 2 / 2 · smoke 21 / 21 (THE PAGES LOAD, Chromium + WebKit) · harbor `cartridge` 3 / 3 ·
  `e2e-jaywalk` 75 / 75 with its perf measure · `e2e-jaywalk-match` 83 / 83 (3 phones, with its perf measure — + step 8c) and
  80 / 80 (4 phones) · the lab's `--h6a` 39 / 39 + `--h6a=perf` 15 / 15 · the lab check 139 / 139 with `--perf --webkit` (59.9 fps at every tier at
  1× and 4× CPU; DOWNTOWN · THE LIGHTHOUSE · THE RAIL YARD by night + day as before). (The match check's first run of the pass showed 9 reds that never came back in five further runs — its log was not
  kept; named, not explained.) `wk-press` / `e2e-daily` (the dailies' known evening red, another area) were not run.
- **Perf — 390 × 844 @3, 4× CPU, `--h6a=perf`:** THE BLACKBIRD's pass 59.9 fps · THE ABDUCTION 59.9 · THE MOTHERSHIP's arrival + the lift
  with 8 kids 59.9 — by night AND by day, at tier 2 AND tier 1 (p95 16.8 ms). **THE ON-DEMAND LOAD: no hitch** — the module + the
  model arrive while the bot plays on: worst frame 33.3 ms, none over 34 (the first try compiled the new program in the scene's warm
  frame: ONE 117 ms frame — now `compileAsync`). One honest footnote: the lab's first capped run of a page jumps to the cap 1.8 s
  after its start, so the ship's bake can land inside that window (one 67 ms frame, night tier 2, 58.8 fps); in a match the bake is in
  the 3 · 2 · 1.
- **Real vs placeholder:** REAL — the three moments (models, effects, sounds wired), the four cards + their flags, YOUR BEST ANYWHERE.
  **NOBODY HAS HEARD ANY OF THE NEW SOUNDS** (levels, timing: a first mix — H6B). Not built: the daily (its mothership at 5:00 is the
  same code — `MODES.daily.cap`).

## OPEN FOR BEN
1. **THE CATCH-UP FOUND NOTHING TO CREDIT — your 212 cannot be restored from data.** The server never kept a counted match's
   per-player lanes: `results/{CODE}_{matchId}` holds each player's XP outcome only, and the lanes lived in the room's proof nodes,
   which leave with the room. No number was invented. From this pass on a counted match run raises YOUR BEST by itself. If you want
   the 212 back: an owner-only "set a best" action in /admin (audited) would be a NEW thing — say the word.
2. **BEAM ME UP's tier = EPIC** (my call: between the two rares and the legendary lane-400 card). Change it with one word.
3. **The cards' tiles in the podium's reveal show a plain palette until you APPROVE each card in THE LAB** (the site's rule):
   SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY (v2 — the new picture) · BEAM ME UP (new) wait for your mark.
4. **The reviewer's leftovers that are yours:** traffic still drives through the Mothership's beam and a UFO's circle during the
   moments (freezing / fading it is a look call over the rules' world); the kids go under the ship's rim, not into its port.
5. H6B's list is unchanged (the painted night skylines, the gate sign, the match chips, NEW BEST's B take, DOWNTOWN's shops, the
   mix, the credits screen) + **listen to the three moments' sounds** — nobody has.
