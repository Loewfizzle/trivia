# SKY-B — THE PARTY's SPEED, THE PATROL + THE BLACKBIRD, THE SHADOWBOXER, THE RADIO STATIONS (Oct 30 2026; plan.md "OWNER'S NOTES — OCT 30 (midday)"; behind `?city=2`)

Scope (the owner's order): (0) the party at full quality with HEADROOM for the fireworks on the iPhone; (1) the owner's SKY-A review —
the patrol + the Blackbird; (2) THE SHADOWBOXER's room + his sounds; (3) music as RADIO STATIONS. Not here: the Mothman, the SR-71 model,
the helicopter model (→ THE MODELS PASS), the fireworks (Part 10), ATM.

### Group 0 — THE PARTY's SPEED (563ad4e, with Group 1)
WHAT THE LAPTOP CAN SAY (the phone is the judge — SKY-A's lesson: the iPhone's party JS was ~10 ms a frame while its frames took 18–24 ms,
so the cost is on the GPU-process side: Safari rasterizes every canvas draw in its GPU process with CoreGraphics on the CPU):
- **THE FILL METER** (a scratch probe — every 2D draw into an on-page canvas, its device-pixel area by module / line / blend, + paths): a
  dance break (Sat Oct 24 22:06:20, 402×660 at 3×, tier 2) paints **9.71 MP a frame** (~9 screens of the city's canvas) + **~2,300 path
  fills / strokes** + ~880 draws. By module: the baked layers' blits ~3.5 MP (sky 0.94, the bands 1.74, the merged band 0.78), the vignette
  0.82, Halloween's sign dressing 1.24 (Oct 24 is in its build-up), the neon 1.2, the logo's haze 0.39, the party wash + dim 0.56, the beams
  0.27, the crisp items 0.59. Paths: the crowd's figures (folk.js) ~1,140, the window figures ~410, the wands ~260, Halloween's dress ~200.
- **SAFARI'S ENGINE ON THE LAPTOP** (Playwright's WebKit: its canvas rasterizes on the CPU like CoreGraphics; ~15× slower than the
  iPhone, so only the SHARES mean anything) — one piece off at a time on the same break: **the crowd's figures ≈ 37 % of the frame**
  (drawFolk: work 106 → 67 ms; their bodies alone ~20 %), every other piece 1–5 % (the wands ~3 %, the window figures ~1 %, the vignette
  ~3 %, the water, crisp, wheel, beams, strings, the holiday props, the clouds ~1–6 % each). No single JS hot spot either (a CPU profile
  of the break: folk.js 6.7 % of the JS, the rest spread thin).
THE CUTS (no look change):
- **THE VIGNETTE AS A LAYER** (foreground.js#createVignetteLayer): the same half-res vignette canvas on the page over the city's canvas,
  under every overlay, its strength as the element's opacity — the phone's compositor (the real GPU) blends it for free. **9.71 → 8.52 MP a
  frame on the break (−12 %, with the helicopter off).** `&force=vig-canvas` = the A/B; the frozen pane still draws it on the canvas.
- **THE BREAK HELICOPTER OFF** (the owner): `&force=break-heli` flies it (a panel row, PROMENADE); its code + tests kept (the e2e runs it
  with the flag); THE CITY TIMETABLE's row `helicopter.break` status `off`; FUTURE: back with the baked model.
- **THE CANVAS CLIMB** (615 → 724 on his phone): the census over a break — the sky beams' cache churns (96 colours + their feet: the
  sweeps' in-between shades) and an evicted sprite's FOOT stayed alive in a WeakMap until a GC (Safari's lazy GC = a climbing count): now
  freed with its sprite. **A 10-minute party night (Sat 10:00 → 10:10 pm across the 10:05 break): 633 canvases → 672 in the break → 633
  after, 75.5 MB flat.** The rest of the count is bounded caches (the beams' 96 + feet, the party palette's sprites per item).
- **THE PHONE BENCH TELLS THE TRUTH** (bench.js) — every scene on a FRESH PAGE (sessionStorage carries the run: a direct visit, the last
  scene's canvases released), its bakes + crossfades + neon sprites FINISHED first, an 8-s COOL-DOWN with the city paused, settle, measure;
  per scene the FRAME SIDE ("outside" = frame p50 − work p50: the GPU process + the compositor), the pixels painted a frame (MP, screens,
  draws, paths, the page's canvases — counted 1.5 s AFTER the measured window), a CPU-SPEED index before + after each scene (a warm phone
  throttling), the screen's idle rate (≈ 30 = LOW POWER MODE), the battery when the browser says. **WHAT COSTS THE PARTY** (the PROFILE):
  the dance break with ONE piece off at a time at a pinned tier 2 — any people / the street party / the wands / the crisp layers / the sky
  beams / the live water / the vignette back on the canvas — each row's delta vs everything on. Buttons: START (all, ~11 min) · SCENES
  (~6 min) · PROFILE (~5 min). `&force=no-wands` added for it.
- **THE HEADROOM** — not measurable here: the laptop can't run the iPhone's GPU process. What the numbers say: the crowd's figures are the
  one big raster cost; everything else is small slices. **The owner's PROFILE run is the measurement** (the "without ANY people" and
  "without the street party" rows give the crowd's share of HIS frame; "outside" gives the GPU side). If the crowd dominates there too, the
  next cut is drawing the crowd cheaper (a cached-pose approach for the stationary dancers — a look-sensitive change: his OK first).

### Group 1 — THE PATROL + THE BLACKBIRD (563ad4e)
- **THE PATROL: A SLOW CIRCLE ROUND THE CITY** (air.js#heliPlan; the timetable's `helicopter.patrol`): CLOSER — the near pass a 44.8-pt
  craft (1.6× SKY-A's 28) low over the harbor's water in front of the skyline, under every skyline sign that hangs near it (the SIGNAL
  blade, the roof signs); the near pieces (OVERCLOCK, the WAIT / WALK lantern, the promenade's trees) stand IN FRONT of it, as they would;
  round BEHIND THE TOWERS (the far pass ~20 pt, drawn in the sky layer: the skyline hides it as it passes, its lights wink through the
  gaps); back — 3 loops by day, 4 at night (night 3–4 min, day 2–3 min: the timetable's frequency kept), MOVING most of the time (~33 % of
  its on-screen time stopped); 1–2 STOPS a near pass where it slows into a hover and its searchlight SWINGS onto a spot + HOLDS (a tighter,
  brighter pool + a hot centre): a BOAT (boats.js#spots, kept for the stop), the far quay's ROOFS (it climbs first, only where no sign hangs),
  the WATER, the PROMENADE (the pool after the people, never over the dock). Drawn after the near boats (it flies over the near water).
- **THE BLACKBIRD**: (1) THE RADIO CRACKLE heard — its slot was 0.07 (−10 dB under the boom's 0.24, the files all normalized alike): now
  0.22; its sounds fetched + decoded AHEAD (25 s before a solo sighting, at a TR-3B's start; the forced tell 1.5 s after its start); with the
  music on the music DIPS under the crackle + the boom (the city's own duck). It's an effect: the music button never mutes it (iOS's silent
  switch with the music off — the 'ambient' session — still does, by design). (2) THE VAPOR CONE CENTRE STAGE: it forms as the craft's
  middle crosses the screen's centre (0.6 s in), a big bright white bell (~0.6 × the body tall — kept to the strip above the lit sign),
  its sharp leading edge + two striations + a wide bloom; it STAYS where the barrier broke as the craft tears on out of it: blooms in 0.08
  s, holds 0.5 s, dissipates 1.4 s (swelling, softening); the shock ring 1.8 s with it. The boom stays 0.9 s after the cone. (3) A LONGER
  needle body: 96 pt at 402 (was 68), 15 % deeper than true (was a third); the plumes 1.3 bodies.

### Group 2 — THE SHADOWBOXER (b6a3ba0)
- core/harbor-boxer.js (PURE): MON / WED / FRI 7 → 11 pm; a SET = 10 rounds of 3 min + 1-min rests → a 10-min break (he leaves the frame —
  the rope heard off in the room) → again from 7 pm; at 11 he finishes the set (out at 11:00 with the 50-min cycle); FRIDAY seeded ~50/50:
  wraps up at 8:30 (the round he's in) or stays to 11 through the party (TONIGHT, Fri Oct 30: he stays; Fri Nov 6: he wraps). A legendary
  DURING his evening sits him out (the UFO's 12:15 am or a TR-3B after 11 leave him his training). Rounds seeded: shadow / weave / BAG
  (rounds 2, 5 + 8 always the bag) — jab, jab-jab, jab-cross, hook, cross-hook, a four-punch combo, ducks, weaves, steps, a bounce, a
  breath between combinations; the bag + the bulb swing on every hit (damped).
- screens/harbor/boxer.js — the confirmed look: ONE bare bulb on its cord (the room's only light, swinging on his hits; its pool on the
  amber wall + his and the bag's shadows swing with it), the floor darker, the side walls in shade, the HEAVY BAG on its chain, HIM a solid
  black profile silhouette (~70 % of the window: bold limbs, big round gloves) with a warm rim from the bulb; he works the bag facing it,
  the open side of the room otherwise; walks in, rests in his corner (a drink, shaking out the arms), towels off + walks out.
- windows.js: the upper middle's blind is HIS (up = his entrance; down warm-lit after his last set; the bulb out 90 s later); the room
  drawn whole; its other moments wait; a stay-Friday keeps his room out of the window party; a raid ends his night; on a 3× phone his room
  is on the crisp layer at night (`win-back`).
- HIS SOUNDS (sounds.js on his clock — panned to his window, ×0.55 under the music): the bell (ding-ding-ding at a round's start, one at
  its end), a thud per bag hit, the chain after a hard one, the rope in his long break — slots `boxer-bag / -chain / -bell / -rope`, EMPTY:
  `~/Downloads/Grok/city-sfx/boxer/` hadn't arrived. When it does: copy (never edit the originals), process through
  `scripts/add-city-sfx.py` (muffled + distant: a low-pass at import), ~1 MB, credits in ☰ → CREDITS — the cues already call the slots.
- THE PANEL: WINDOWS → THE SHADOWBOXER (`&force=boxer`) + its ROUND input (`&round=1..10`: the blind up, then that round — 2, 5, 8 = the bag).

### Group 3 — MUSIC AS RADIO STATIONS (a4c407a)
- audio/party-music.js: every City 2.0 mood deck on the SERVER CLOCK — each MUSIC MOOD (+ AUTO following the city's day) a STATION (its
  deck on its own seeded timeline from the epoch — core/party-deck.js's cycles + window); everyone tuned to it hears the same song at the
  same moment; joining lands mid-song with a 1.2-s fade-in; a mood change = a station change at once. The PARTY on a party night keeps the
  evening's 8 pm timeline (the dance breaks), on the same deck from the first tick. docs/audio.md#the-radio-stations.
- THE RESTART FIX (found here, affects the party nights too): the synced player was re-keyed when the server clock's offset settled in the
  first seconds after a load → re-created + the song decoded again: a second of silence + a second "start". Now it re-places its voices.
- The panel's SKIP on a station steps THIS phone off it (its own shuffle until the mood changes / a reload). `&force=no-stations` = A/B.

### The numbers
- THE BASELINE GUARD (`ONLY=perf PERF_GUARD=only`): 0.39× / 0.50× / 0.50× (a plain night / the bus / the dog walk).
- THE FILL: a dance break 9.71 → 8.52 MP a frame (−12 %); paths ~2,300 (unchanged — the crowd).
- THE CANVASES: a 10-minute party night 633 → 672 (the break) → 633, 75.5 MB flat.
- THE STATIONS: two phones on one station in step within 22–107 ms over six laptop runs (the synced player re-places a voice once it's > 120 ms off — the e2e checks that tolerance); a late joiner within 1–70 ms; a station change in ~0.5 s.

### Decisions (Claude Code's calls — the owner may overrule)
- The patrol's near pass flies over the near water BEHIND the near-layer pieces (OVERCLOCK, the lantern, the trees) — they're nearer the
  camera; "never in front of a sign" read as the skyline's signs. The far pass is fully behind the city (the sky layer), lights only.
- The roof stop = the far quay's roofs (the only roofs below a helicopter that low); a rooftop under a sign → it looks at the water.
- The cone stays where the barrier broke (it can't linger 2 s on a craft that crosses the screen in 1 s); above the LIT sign it's kept to
  the strip (never over the letters).
- The boxer: bag rounds 2, 5, 8; a legendary only sits him out when it falls inside his evening; 90 s from his blind down to the bulb out.
- Stations: AUTO retunes AT ONCE at a mood boundary (every phone in a place switches together); SKIP steps this phone off the station.
- The bench's PROFILE uses the dance break; the cool-down is 8 s.

### Known issues
- THE HEADROOM IS UNMEASURED on the iPhone — the owner's bench PROFILE run decides the next cut (likely the crowd's figures).
- The boxer's sounds are silent until the owner's files arrive (the slots + cues are wired).
- The joiner's 1.2-s fade-in is sometimes over before the e2e's first sample (logged, not failed); it was seen ramping on most runs.
- The smoke test couldn't run locally (no Java for the emulators) — the cloud's tests job runs it.
- The own player's recovery checks (resume, a stuck context, the music button, the evidence, the song clock) now run on
  `&force=no-stations` (that path is the stations' fallback); the stations' own recovery after a lock screen is the synced player's
  (NIGHT-C: a dead graph hands the song to this phone's own player at its place) — the owner's phone confirms.

### The handoff to THE MODELS PASS
THE MOTHMAN from its two Hunyuan models (the tucked perch + the spread-wing glide, swapped in the needle's dark stutter), THE SR-71 model
behind the Blackbird's ART SWITCH (`blackbird.js#setArt`; A/B drawn vs model — the drawn one is now 96 pt), THE HELICOPTER as a baked model
(~24–36 yaw steps; the patrol's circle + its stops already drawn from one sprite + code lights — the model drops into `heliSprite`; the break
helicopter comes back with it: `&force=break-heli`). Plus, whenever the owner's bench PROFILE is in: the crowd's cost.
