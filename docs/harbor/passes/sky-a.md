# SKY-A — THE HELICOPTER, THE F-22s, THE BLACKBIRD, THE TR-3B (Oct 30 2026; plan.md "OWNER'S NOTES — OCT 30 (morning)"; behind `?city=2`)

SKY was split by the owner (Oct 30 8:40 am): **SKY-A** (this pass) = the helicopter's rework + its speed, THE F-22 MODEL, THE BLACKBIRD,
THE TR-3B at full res + the legends' craft at 3×; **SKY-B** (next) = THE MOTHMAN, THE SHADOWBOXER's room, MUSIC AS RADIO STATIONS.
Mid-pass the owner added (Group 3): the TR-3B's lights must be REAL LIGHT SOURCES — lighting the craft, the drained city + the harbor.

### Group 0 — THE HELICOPTER, REWORKED (155c832)
- THE DANCE-BREAK FLIGHT (`air.js#breakFly / breakAt / breakDraw0`, `skyfx.js#breakBand`): a 54-pt craft (was 34) LOW over the water in
  front of the skyline, in a band under every sign above it (the SIGNAL blade, the roof signs) and clear of every sign beside / below it
  (OVERCLOCK, the WAIT / WALK lantern) — never the NEON sign or JOIN / HOST; it DRIFTS BACK AND FORTH over the crowd the whole song
  (`core/harbor-heli.js#breakDrift`, on the clock: every phone the same, 0 at both ends — no jump in or out of the hover) and TURNS to face
  where it flies (a yaw through its narrow head-on profile, never under 0.2 of its width; its nose tilting toward its motion); lit by the
  city at night (a mid-tone paint, the neon's cool rim on top, the crowd's warm light under it) — it read as one more dark shape on the
  breakwater before.
- THE BEAM DIFFUSED: a soft wide cone (a gaussian feather across it, a whisper of dither: no 8-bit banding) + a soft pool, baked per palette
  colour BEFORE the flight (16 s before the song: no first-swing hitch); a colour cross-fade = the two baked sprites ADDED (`beamPair` — the
  beam is additive, so the pair IS the in-between shade).
- THE CANVAS LEAK (the owner's 949 live canvases): NIGHT-C's beam minted a NEW 32×32 glow canvas for every in-between colour of each bar's
  cross-fade (~30 a bar, kept forever in an unbounded map) — the count + the per-frame canvas + gradient builds were the break's extra cost on
  his iPhone. Measured in one run, the old build vs the new: 645 → 740 → 815 → 851 canvases over one minute of the break (old) vs 601 → 615 →
  634 (new); a 10-minute party night (Sat 10:00 → 10:10 pm, across the 10:05 break): 560–620 throughout, ~600 after. The glow cache is
  bounded (40) + only palette colours ever reach it.
- THE PATROL: the original route as a circuit — in low over the harbor, a look (the searchlight sweeping the water), out; round behind the
  city; back along the FAR side (62 % size, higher, slower on screen, a short look); TWO LOOPS — every ~30 min dusk → 1:30 am (3–4 min:
  202 s at 402), hourly by day (2–3 min) (THE CITY TIMETABLE's `helicopter.patrol`; the sky lane held 3 slots). Its night paint lifted so
  the small patrol craft separates from the towers.
- THE SYNCED NIGHT's OWN PLAYER: `party-music.js#partyClaims` — the synced player claims the song while it loads; this phone's own player
  starts nothing first (it still covers on a dead graph, a legendary's hold, a failed load or an 8-s stall).
- THE HELICOPTER's OWN COST: ~0.10 ms a frame for the break flight + its beam, ~0.12 ms for the patrol (`harbor().heli.ms`, main thread, the
  laptop at 1×) — under 2 % of the scene's ~7–10 ms.

### Group 1 — THE F-22 MODEL, EVERYWHERE (ea3d32e)
- "F22 Raptor FREE" by NLM (CC BY 4.0; ☰ → CREDITS) baked by `scripts/bake-model.mjs f22` (a new recipe): the gear-UP pose (the clip's
  start — its 25-s animation lowers the gear + opens the bays), the crew's boarding ladder hidden, the stencils softened away (every base map
  through a small blur), the pale museum greys darkened to gunmetal; in profile a little from below + a hair toward its near side, at four
  banks (0 / 6 / 12 / 18°, its top toward the viewer) in the city's three lights → `assets/city/f22/` (three 4-frame sheets, 54 KB).
- `f22-model.js` loads it LAZILY (a TR-3B's warm-up, an air show / flyby / skytype start — never a normal night) and builds each sprite at 3×
  by BLENDING the lights by the hour + the two nearest banks (no pop); every F-22 flies it (`&f22=drawn` = the A/B); the afterburner, Mach
  diamonds, heat haze + the lights stay code on top (the nav light moved to the model's near wingtip).
- THE CHASE: a TIGHT VIC (the lead + a wingman tucked behind either side; the far one a touch smaller) + a small slow UNISON BANK mid-screen
  (`chaseBank`: 0 → 12° → 0).

### Group 2 — THE BLACKBIRD (c94d61f)
- ONE flyby (`core/harbor-blackbird.js#bbAt`): the radio-static TELL 3 s before → across in ~1 s (1.8× the F-22s: it passes them + is gone
  first) → the VAPOR CONE 0.18 s after it enters (0.4 s, a bright bell round its tail half) + ONE thin SHOCK RING (0.8 s, it stays where it
  broke through) → the plumes to full MACH DIAMONDS → the DOUBLE BOOM ~0.9 s after the cone (0.22 s apart) → its SCREAM. The boom shakes the
  city a touch: the roof signs flicker once (`neon.jolt`), a few pigeons lift, the dock's glass glints — never the logo.
- DRAWN (`screens/harbor/blackbird.js`): a near-black SR-71 in profile — the needle nose + its chine's lit edge, the cockpit's hump, the
  nacelle + its inlet spike, the twin canted fins, the neon's rim at night; drawn a third DEEPER than true (a true-proportioned SR-71 is a
  needle at 68 pt). Two plumes, 4–5 bold Mach diamonds, a speed streak. On its OWN full-device-dpr overlay ABOVE the NEON sign (a fixed
  canvas the size of its strip, removed after) — so it crosses IN FRONT of the dark sign in the chase. ONE ART SWITCH (`&bbart=model` once a
  baked model exists — a slot; the drawing stays until then).
- THE TRIGGERS (THE CITY TIMETABLE `blackbird.chase / .solo / .watcher`): EVERY TR-3B chase (the F-22s' lead ⅓ across, the same direction,
  ACROSS the dark sign while the drain holds it, above it if it's powering back) · rare SOLO sightings (~2 a month, a seeded day + time 11 am
  → 11 pm, never a legendary night; 5 passes on July 4) above the lit sign under the corner buttons (≥ 28 pt; a short screen: the open sky
  under the tagline) · THE WATCHER's REWARD (60 visible minutes on this device; a gap under 5 min pauses the count, longer resets it; once a
  day; never announced — `localStorage na:bbwatch`).
- THE SOUNDS: Grok's Sonniss takes imported (copies — the originals untouched): `bb-static` (three tells), `bb-boom`, `bb-scream` (an F-16
  pass sped up 1.25×). `&force=blackbird` + the panel's LEGENDARY row (again every ~8 s while on).
- A ninth cloud job, `legend` (legends + blackbird + bench): `wild` was at its cap.

### Group 3 — THE TR-3B AT FULL RES + ITS LIGHTS ARE LIGHT + THE LEGENDS' REGISTRY (Group 3's commit)
- THE LOOK CHECK (the owner, Oct 28: "a flat cut-out casting a shadow"): the hull's side wall was DARKER than the belly and offset under the
  near edges — a drop shadow. Now a gunmetal face a touch lighter than the belly, thinner, its lower lip lit: one solid unit, no shadow.
- FULL RES (`legends.js#triOverlay`): the craft on its own overlay at the phone's dpr (a canvas the size of its sprite, moved with it: ~2.6 MB
  at 3×, only while it flies) over the city + under the sign; what stands in front of it is CUT OUT with the city's own skyline bitmaps
  (`scene.js#cityCut`: far, near, the harbor's pieces, the billboards — the crowns in front of its belly to the pixel; a roofline clip punched
  rectangles). It yields to the city's own 2× copy in rain / snow / fog / a storm. THE TIER TABLE `legendCrisp`: the TOP TIER only (see the
  numbers). TOOLS → TR-3B SOFT = the A/B.
- ITS LIGHTS ARE LIGHT (the owner, mid-pass) — every one a cached sprite ADDED, nothing built per frame: (1) they light the craft (clipped to
  the hull: each corner light washes the metal round it, the red orb washes the belly, pulsing with it); (3) real glow (a wide bloom + a hot
  core round each light, a faint horizontal flare on the brightest); (2) they LIGHT THE WORLD (`scene.js#triWorldLight`): the drained city's
  only light — a soft white / red pool falls from each light onto the crowns + roofs under it, masked to the buildings' own silhouettes (the
  far + near bakes, a mask built once per skyline), at half resolution, sliding with the craft; + their reflections on the harbor
  (`water.light`).
- THE LEGENDS' REGISTRY (FR4): `legend.ufo / .tr3b / .ghostship / .flyby / .mothman (planned) / .rule` rows in THE CITY TIMETABLE with their
  triggers, rarities + conflicts (the numbers mirror the code that rolls them — a test checks; they move INTO the table at SCHED).

### The owner's touch-ups during Group 4
- THE TR-3B's LIGHT ON THE SKYLINE (the owner, looking at the first pass: "it almost looks too bright" — whole towers lit top to bottom like
  a floodlight): a SHALLOW pool just under each light — the crowns nearest it catch it, the walls below stay dark; a lower peak (corners
  0.24, the orb 0.34); the orb's red a warmer, less saturated red-orange (light on stone, not a red filter). Looked at in motion at 402.
- THE F-22s' LIGHTS (the owner: fewer dots): the GREEN FORMATION STRIPS longer + softer (a strip's glow along each — the forebody, the aft
  fuselage, the fin's tip, now ON the model's shorter fin: at −0.24 it floated as a dash above it), ONE slow RED beacon (a soft flash every
  1.3 s, never a strobe), the NAV LIGHT on the near wingtip by direction (flying right: green; left: red — checked both ways); the tail-light
  dot + the extra glow dots gone. The helicopter's nav light already follows its heading; the Blackbird shows only its beacon.

### Group 4 — THE NUMBERS
All on the laptop (Chrome headless + GPU, 402×660 at 3×; the phone-like 4× CPU saturates this laptop in a party scene — both builds
~55–65 ms a frame — so the A/Bs ran at 2× / 1×; A = d668e7b, the commit before the pass, on :5174):
- THE BASELINE GUARD (`ONLY=perf PERF_GUARD=only`): 0.38× / 0.48× / 0.47× of the baseline (a plain night / the forced bus / the dog walk).
- `title-perf --ab` at 2× CPU, tiers 2 + 1: the conga break (`sp-break`, the helicopter over it) **same** (t2 +7.2 ms ± 128, t1 −4.6 ± 7.8
  — saturated, wide noise); a plain Tuesday night (`nc-night`) **same** (t2 +7.3 ± 11.9, t1 −2.4 ± 7.2); a night patrol (`sa-patrol`) **same**
  (t2 −1.7 ± 1.9, t1 −0.3 ± 1.0). The plain night re-measured alternating A / B four times at 2×: A 14.1 ms, B 13.8 ms a frame — the same.
- THE HELICOPTER's own draw: ~0.10 ms (the break flight + its beam), ~0.12 ms (the patrol) a frame at 1×.
- THE BLACKBIRD while it flies (~1.3 s): +1.1 ms a frame at 1× (6.3 → 7.4 ms).
- THE TR-3B at full res (`&lgs=15`, 1×): the scene's work the same (7.2–7.5 ms with the overlay vs 7.4–7.9 without), the frame pacing worse
  on the laptop's compositor (p95 17.6 → 33 ms) → the top tier only.
- THE CANVASES + MEMORY: a plain night (3×) 237 canvases / 60.7 MB before AND after; a dance break: 645 → 851 over a minute before, ~600
  steady after; a 10-minute party night 560–620. The overlays while they fly: the TR-3B ~2.6 MB, the Blackbird ~1–2 MB, freed after.
- iPhone-equivalent: his 16 Pro ran NIGHT-B's break at 3.8 % slow — the helicopter now adds ~0.1 ms + no canvas churn (the leak was the
  difference); the phone bench (`&bench=1`) has `party-break` (with the helicopter), `tr3b` (the full-res craft, its lights, the F-22 vic, the
  Blackbird) + a new `blackbird` scene for him to confirm.

### Decisions (Claude Code's calls — the owner may overrule)
- The break helicopter's band: as LOW as the signs allow over the near water's bright reflections (y ≈ 610 at 402×874), clear of OVERCLOCK on
  the left; it TURNS at each end of its drift (a helicopter faces where it flies) rather than flying backward.
- The patrol's "back around": the far pass at 62 % size, higher, behind the near pass's line — the circuit, twice.
- The F-22's paint: GUNMETAL (the model's own greys read as a pale museum jet by day).
- The Blackbird: crossing ~1 s (the decisions said 1–1.5 s; 1.3 s wasn't "much faster" than the jets — 1.4×); drawn a third deeper than
  true; the watcher's clock is real time on this device (not the city's preview clock); solo sightings 11 am → 11 pm.
- The TR-3B at full res on the TOP TIER only; its world-light pools at half resolution (a glow is soft).
- A ninth cloud job (`legend`) instead of squeezing the Blackbird into a full one.

### Known issues
- The laptop can't judge the speed: a dance break saturates it even at 2× CPU (both builds ~30–40 ms a frame), so the A/B reads "same" with
  a wide noise; THE PHONE decides — `&bench=1` (party-break now carries the helicopter, tr3b the chase's Blackbird + the full-res craft, a new
  blackbird scene) + `&debug=1`.
- THE TR-3B's overlay: the same main-thread work, but this laptop's headless compositor paced it worse (frame p95 17.6 → 33 ms at 1×) —
  hence the top tier only; if the iPhone shows a hitch, TOOLS → TR-3B SOFT A/Bs it.
- The F-22s (the chase + the shows) + the UFO are still drawn in the city's 2× canvas (a chase overlay = a later pass; the UFO has the front
  row in front of it). The Blackbird + the TR-3B are full-res.
- The Blackbird's art switch has no baked model yet: Grok's "SR-71 blackbird (FREE)" by pablogcg05 (CC BY 4.0, untextured, 6 MB) is already
  in `~/Downloads/grok/models/blackbird/` — a `blackbird` recipe (the F-22's, re-pointed) would bake it.
- Birds / bats flying in front of the TR-3B now pass behind its overlay (rare: the sky's birds avoid a legendary night).

### The handoff to SKY-B
THE MOTHMAN (the drawn stand-in behind its ART SWITCH — the Blackbird's pattern: `blackbird.js#setArt`), THE SHADOWBOXER's room (the boxer
row `boxer` is still `planned` in the timetable), MUSIC AS RADIO STATIONS. The legends' registry already holds `legend.mothman` (planned).
