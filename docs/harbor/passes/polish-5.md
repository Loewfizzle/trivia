# POLISH 5 — THE LOAD, THE SPEAKEASY'S GLASS, THE COLOURS, THE HYDRANT, THE SKY'S MESSAGES (Oct 25 2026; plan.md "OWNER'S NOTES — OCT 25 (after C2)" + "(after PEO)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## POLISH 5 — THE LOAD, THE SPEAKEASY'S GLASS, THE COLOURS, THE HYDRANT, THE SKY'S MESSAGES (Oct 25 2026; plan.md "OWNER'S NOTES — OCT 25 (after C2)" + "(after PEO)"; behind `?city=2`)

### 0. THE LOAD STILL JUMPED — measured, then fixed (`core/harbor-loadlog.js` PURE; `scene.js` — `tryReveal`, `fontsReady`, `rectsMoved`, `holdSky`; `title.js#restRect`; `district/live-weather.js`; `clouds.js#stats`/`settle`)
**THE LOAD LOG** (`&debug=1`, a third strip, `load`, FOLDED by default — its one line: `LOAD ready 1.12 s · still after ▸`; a tap opens
the rows; `harbor().loadLog` for tests): from the first frame to 15 s after the reveal, every change to the picture with its cause — a
`resize` (the window / visualViewport / screen sizes before → after + what the canvas was), `canvas` (W×H@dpr before → after), `layout`
(why + the camera's signature before → after), `bake` (swap in the dark / CROSSFADE + which of the key's parts changed: season, lamps,
road, tones, sun, camera, neon, flood, facade), `lit` (the lit windows), `tier` (a step, or one recorded for later), `wx` (the cached /
live answer + what the city reads), `sky` (repainted: faded over how long), `clouds` (planned / re-planned + kinds), `fonts`, `dock` (the
title's rects moved — re-laid or kept), `extras`, `reveal` (why + ms + what it still waited for), and two watches: `pix` (&debug only:
the picture shrunk to 12×24 four times a second, a band jumping > 9 levels — anything not instrumented) and `power` (the same during
the intro's power-on: the neon tube by tube, the windows — by design, never counted). **⚠** marks the rows the eye sees after the
reveal. HOW TO READ IT on the phone: open the strip a few seconds after a load; anything marked ⚠ is what moved, and its row says why.
Repro tool: `node tests/integration/load-log.mjs "<browser>" [--bars 716,760@500] [--net 3g] [--cpu 4] [--warm] [--live] [--intro]`
(a Safari-like load: the viewport's height changing as a tab's bars settle; prints the log; exit 1 on a visible change).

**What moved (measured on Chrome; WebKit can't install here):**
1. **The screen's entrance transform** — THE main jump: `.screen` enters with `translateY(14px) scale(0.985)` → none (0.42 s; up to ~2 s
   under a busy first second), and the title measured the sign + the dock WHILE it ran (up to ~19 pt off); the city was laid out on those
   numbers, then re-laid when the title reported again after its power-on — AFTER the reveal: the skyline shifted + the whole city
   crossfaded. Now every rect the title hands the scene is measured through the screen's transform UNDONE (`title.js#restRect`).
2. **The fonts** — Google's stylesheet arrives late (a preload swapped to a stylesheet): until it lands `document.fonts` holds none of the
   title's faces and reads `loaded`, so the old check let the reveal through and the tagline's JetBrains Mono swapped in after it (16 pt).
   Now the reveal (and the first bake) waits until the three families are registered and the title's weights loaded (≤ 3 s), and the
   title is measured once more right before the reveal (a move > 2 pt re-lays in the dark).
3. **The live weather** — its module loaded 1.2 s after mount, the answer only kept per SESSION, the look re-read every 2.5 s: the city
   showed clear, then faded to overcast + repainted the sky (a hard jump) EVERY load. Now the answer is kept per DEVICE (localStorage while
   fresh, 45 min), read before the first bake; with nothing fresh the ask starts at once and the reveal waits for it (≤ 2.5 s); an answer
   that lands after the reveal BLENDS: the bake + the sky crossfade over 6 s, the clouds' new set over 6 s (`WX_BLEND`).
4. **The weather's effects + the clouds** — the fog / rain / frost modules now load at once (the reveal waits for them); the first clouds
   are baked in the dark and shown at once with the city (`clouds.settle()`), never fading in on their own after it.
5. **A tier step** recorded during the load is applied BEFORE the reveal (still dark), never after it.
6. **Safari's bars** — City 2.0's canvas is `100lvh` (the large viewport, anchored at the top): the bars settling / sliding never resize
   it; a dock move that comes with them (a resize in the last 2 s) keeps the city where it is (`dock … the city kept` in the log).
   Untested on a real iPhone (no WebKit here) — the owner's load log decides.
After: the throttled loads (4G/3G, 4× CPU, cold + warm, the full intro, the bars 716 → 760) log **0 changes after the reveal**; the
reveal itself comes a little later on a slow load (~2.1 s at 4× CPU, warm) — the city is dark a beat longer and then holds still.
Tests: the `load` group +5 (the bars → 0 changes; the weather kept on this device → the first frame overcast; answered in 1.2 s → the
reveal waits; answered after 6 s → it blends, no jump; the full intro → 0 changes); unit `harbor-loadlog.test.mjs` (3).

### 1. THE SPEAKEASY + THE DOCK
- **THE HUSH WORD SIGN** (`core/harbor-hush.js#HUSH`, `hushsign.js`, `tubes.js#drawLit` + `core`): ICE-CYAN (the room's amber's
  complement), WHITE-HOT cores (0.55 of the tube), TIGHT halos (glow 2.3 → 1.15 × the tube), bolder block letters filling the glass (lw
  0.66 → 0.84, gaps 0.14 → 0.1, rows 0.2 → 0.13, the tube 0.12 → 0.17 of the cap, margin 0.09 → 0.05), the room DIMMED behind it while
  lit (40 % at night, 20 % by day — the dancers still pass behind); by day bright cyan glass round a near-white core.
- **SINGLE BIG PANES** on every upper window: the meeting rail is gone everywhere (the bake, the lit rooms, the moments, the hush sign's
  overlay); the deep reveal, the sill + the day sheen kept. **THE WINDOW BOX** gone (+ its flowers); the morning wake keeps the blind +
  the stretch + a look out — no watering, no sash, the sash sounds dropped from its cues.
- **JOIN + HOST ALWAYS LIT**: the words crisp white with a faint glow 24/7 (by day, dusk, night, in the blackout); the rings keep their rules.
- **THE MUSIC TOAST REMOVED** (both cities): the button says it — OFF = the note dimmed (42 %) + a crisp white slash on a dark edge, the
  glass darker — plus an aria-live line for screen readers (`.mh-sr`); the one exception: ALL sound muted → "SOUND IS OFF — SETTINGS" as a
  pill in the corner row left of the button (2.6 s; a tap opens settings) — never over the sign.

### 2. THE COLOURS + THE TREE
- **ROSIE** (`boats.js` palette): white with DEEP NAVY trim (the boot stripe, the paddle box + its wheel's boards, the roof, the pennants)
  + black stacks; the gold kept on her name + the stacks' bands. **THE WHEEL**: the frame a heritage red (168,40,48 → 138,30,38); the
  gondolas ALL one deep navy (no window band / mullions / trim — a few pt on a phone), at night each a dark shape with ONE warm glow.
  **The lights unchanged — proved**: `pixdiff.mjs --scenes party,night,noon` against 5b6ea3c: on the party night the only changes beyond
  the noise sit on the 16 gondolas (+ their reflections) and Rosie; the rim bulbs, the spokes, the hub + the show are pixel-identical
  (the bulbs' code was not touched).
- **THE CRABAPPLE behind the blade** (`core/harbor-trees.js`): to the big maple's standard — a sturdier trunk (0.27 → 0.38) + limbs, a fuller
  layered crown (24 → 42 clusters, fewer on the tips), a small window at the fork instead of the dark hollow, the autumn mix wider (gold
  on the sun's side, rust-bronze in the shade), deeper inner clusters, the fruit as small bunches of 3–4 on the outer clusters (a dark
  underside each) — never specks; spring + summer checked too. Nudged left (f 0.45 → 0.42, k 1.45 → 1.4) so the cab at its stop shows
  whole at 402 (the crown may tuck a little behind the blade — drawn in front of it).

### 3. THE PROMENADE
- **THE FIRE HYDRANT** (`core/harbor-promenade.js#HYDRANT`/`hydrantSpot` — L.hydrant, the can's old spot by the front-left lamppost;
  `fauna.js#drawHydrant`, `drawHydrantSpray`, `drawHydrantWet`): bold red cast iron — the base flange + bolts, the barrel + its nozzle
  ring, two capped side nozzles, the chain, the domed bonnet + its pentagon nut, a brass ring, a crisp highlight stripe; at night it keeps
  some red under its lamp. **THE TRASH TRUCK** keeps its visit: the collector walks off screen RIGHT along the curb for the street's cans,
  comes back with one on his shoulder, tips it in, carries it back out (left is the bench's corner + the building).
- **THE DOG SNIFFS IT** (~42 % of dog walkers, `core/harbor-people.js` — `nodes.hydrant`, the goal `sniff`): the walker waits facing it,
  the dog trots forward on its leash off the floor's edge to the hydrant, head down, tail going, and back.
- **THE HOT-DAY SPRAY** (`core/harbor-workers.js#SHOWS.hydrant` — afternoons 13:36–16:42, the real temperature ≥ `HOT_C` 29 °C, ~2 hot
  days in 3; `core/harbor-crew.js#PLAN.hydrant`, `HYD`, `hydrantTrace`): a city worker in from the left with his wrench, the cap off + the
  stem turned, the SPRAY (a thick white arc from the right nozzle — a core stream, droplets riding + breaking off it, the mist + the splash
  where it lands, sun glints / the lamp's), he stands back left of it, A KID runs through it (in from the right, out left), shut + capped,
  away; the WET PATCH spreads over the first 40 s and dries over 12 min. Its sound `hydrant-spray` (a loop: the stream's hiss + the splash,
  SYNTHESIZED — `scripts/build-synth-sfx.py`, imported through add-city-sfx.py) follows the spray, panned to it. Previews: `&force=hydrant`
  (= WORKERS → THE HYDRANT); `&temp=<°C>` forces the day's temperature; panel rows `hydrant` (PEOPLE) + `work-hydrant` (WORKERS).
- **EVERY FORCED EVENT STARTS AT THE MOMENT IT FIRES** (`scene.js#forceSince` / `forceAtOf`: the city clock when each `&force=` flag was
  switched on — the link's load or the panel's 3-2-1): every worker kind's first visit 3 s after the fire (`forcedWork(kind, t, { forceAt })`
  — in from off screen with its props; tested for every kind), the dance circle (`danceSlot`), the bus (no bus joined mid-stop), Rosie's
  turn loop, the timetable's bell / whistle / horn (the first 1.5 s in); THE RAID: its siren at once, the convoy in ~7 s at every phase of
  the signal (a forced convoy keeps to the light like the trucks: held at the line on red, away on the green with time to clear before
  WALK — `core/harbor-raid.js#raidPlan holdRed`), was 10–50 s. The window moments already started on the fire. Real days still join
  mid-way.
- **C2's leftovers**: the walk-up's hands on the rails — a two-bone IK to exactly where the ladder model puts them (`folk.js#reach` with
  `HANDS.up` / `LADDER.hR` at the person's own size); the cab no longer half behind the crabapple at 402.

### 4. THE SKY
- **THE BARNSTORMER REMOVED** (the owner: "I don't like it"): `barnstorm.js` deleted, its day (`barnstormDay`, `BARN_LEN`), its panel row,
  its scheduler slot, its overlay canvas, its tests.
- **THE BALLOONS** (`balloons.js`): the REAL ₿ — a bold B (stem + two bowls, the counters cut: one even-odd fill) with two strokes standing
  clearly above + below, at the logo's tilt; orange on black by day, BLACK on the lit orange envelope at night (laid over the day's look,
  not added — added, the mark went orange-on-orange). **THE FESTIVAL LAUNCH**: each balloon its own launch moment (the ₿ first, the alien,
  then the rest ~21 s apart), RISING from behind the buildings (from just under the roofline at its x — hidden: the sky draws first) over
  70–95 s, the burners flaring every ~3 s while it climbs, then away on the wind; never a fade-in; `&force=balloon-festival` starts at the launch.
- **SKY MESSAGES** (`smoke.js`; `core/harbor-sky.js#MSG`): a page holds 3 lines × 16 ("HAPPY BIRTHDAY" ×3 on one page — tested); the dots
  CRISPER + DENSER (0.42 → 0.55 of the pitch, a firm core + a short falloff), holding their shape while read (the swell 0.035 → 0.008 a s,
  the softening 45 → 18 %), the dark halo a tighter edge, firmer near the sun; **CLOUDS NEVER COVER A MESSAGE**: while one is skytyped every
  cloud draws BEHIND the letters, and the clouds over its box thin to a quarter (easing in + out over ~1.8 s: `clouds.thin`). The DRONE
  messages: the same 3-line pages; their lights crisper (a firmer white core, a touch bigger).
- **THE BANNER PLANE** (`banner.js`, rebuilt): a 1920s Stearman-style BIPLANE (navy fuselage + a cream stripe, chrome-yellow wings,
  cabane + interplane struts + flying wires, the radial's cowl, open cockpits + a pilot, the gear, the tail; shaded), its nose along a
  gently undulating line of flight, a spinning propeller (a disc + two whipping blades); the banner on ONE slack tow line to a Y-bridle at
  the weighted pole, every slice where the plane was a moment before (its distance ÷ the speed) — it LAGS the path through each rise +
  dip — trailing BELOW (+ a little more toward its end), a ripple travelling down it in gusts (two incommensurate waves + a slow gust
  envelope), stronger toward the free end, the last fifth fluttering, slices shaded by their slope; the letters bigger (21 → 25 pt panels,
  76 % caps, 800 weight) + crisp. Numbers: `BANNER`.
- **THE PERISCOPE's SONAR PING** (`periscope-ping`, synthesized: a 1.25 kHz ping, 5 ms attack, a slight glide, a 3.6 s dark underwater
  reverb + two discrete returns, band-passed 450 Hz–4.2 kHz for a phone's speaker): registered + imported; `sounds.periscope()` plays it
  DUCKED (the music to 50 % for 1.6 s, back over 3.2 s). The periscope's legendary itself isn't built yet (a later part) — it plays the
  ping as it breaks the surface; hear it now in the panel's SOUNDS rows.
- **THE OWNER'S ADD-ON — THE SLANTED GLASS TOWER** (`glassL`, `core/harbor-neon.js`, `lights.js`): its tube now runs up both vertical edges
  and ALONG THE SLANTED ROOF EDGE (ice — cool white / ice-blue), at the far step's weight like its neighbours (`zNeon` 330 — not the deep
  band's thread); at night the crown's glass catches the city glow (a warm-violet reflection rising from its foot, a cool sheen along the
  slant) + its top floors lit; the party + blackout rules are the other outlines' (it is one). Checked at night + party, 390 / 402 / 430.

### 5. THE LOBBY LINE — WHO IS WHO (feasibility only: `&lineproto=1`, NEVER on by default; `core/harbor-people.js#linePlaces2`)
With `&force=line&n=4|6|8&lineproto=1`: everyone outside in a STAGGERED TWO-DEEP line — pairs offset half a step, the front pair at the
door, running left along the barbershop front and stepping DOWN toward the camera; each COAT in the player's colour (the room's eight:
magenta, cyan, yellow, green, orange, violet, red, blue — a touch deep so it reads as cloth); a glowing PIN over each head in that colour
(the first — "you" — brighter, slowly pulsing). The shots (18): `docs/harbor/refs/lobby-line/line{4,6,8}-{day,night}-{390x844,402x874,430x932}-shop.png`.
Read: by day the coats alone say who is who; at night the coats sink into the silhouettes and the PINS carry it; at 8 the line reaches
the left edge (it steps down rather than packing); the night's own visitors (the doorman, guests at the door) stand beside it.

### Decisions made (each the most reasonable reading; easy to reverse)
- The load log starts FOLDED (one line) — the readout + AUDIO strips stay as they were; the debug column's height is capped at 40 % of the
  screen so three strips never reach the skyline.
- The canvas is 100lvh in City 2.0 only; City 1.0 is untouched.
- A live weather answer kept per device for 45 min (its TTL); a slow ask holds the reveal at most 2.5 s, then the city shows seeded and
  the answer blends in over 6 s.
- The music button's OFF state is a dimmed note + a slash (no red); the muted hint sits left of the button in the corner row.
- The crabapple moved ~12 pt left so the cab shows; the PF rule "the crown clear of the blade" relaxed to "≥ 75 % of it right of the
  blade" (the blade is drawn in front; the owner calls it the tree behind the blade).
- The trash collector fetches the cans off screen RIGHT (left is blocked by the bench's corner + the building on the people's map).
- The hydrant's spray: ~2 hot afternoons in 3 (≥ 29 °C), a worker + a kid; people "stepping round" the patch isn't built (the floor's
  walkers keep to the floor; the patch is in front of it).
- A forced raid keeps to the traffic light (held on red) instead of waiting for a convoy-wide green; a real raid is unchanged.
- The festival's ₿ balloon launches first; the night ₿ is laid over (not added); the banner plane is a Stearman-style biplane (navy +
  chrome yellow: Rosie's navy, no more red); the periscope ships as a sound + a ducked hook (its event belongs to the legendary part).
- The lobby-line prototype's eight colours are the room's player colours in their order; "you" is the first in line.

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against b7f6b88 — the commit before the pass — 402×874, tier 2, 2× CPU, the GPU)
| scene | A (b7f6b88) work mean / p95 ms | B (POLISH 5) work mean / p95 ms | frame p95 / slow | verdict |
| --- | --- | --- | --- | --- |
| a weekday afternoon (`np-day`, 2× CPU) | 8.26 / 11.8 | 6.91 / 9.4 | 17.3 → 16.8 ms, 0 % slow both | **same** (−1.35 ms, noise ±1.72) |
| a party night (`np-party`, 1× CPU — at 2× both sides stepped their tier: invalid) | 7.03 / 9.0 | 7.10 / 8.8 | 33.4 / 14.1 % both | **same** (+0.07 ms, noise ±0.19) |
The laptop's tier-2 party is over the 8 ms budget and capped at 30 Hz on both sides (a warning; the owner's iPhone decides). The new
pieces cost only while they run (the hydrant's spray, the thinned clouds under a message, the load log's strip + its pixel watch with
&debug=1 only).

### Known issues (POLISH 5)
- **WebKit can't run here**: the load fixes are proven on Chrome (the throttled + bar-changing loads log 0 changes after the reveal);
  the Safari tab's bars + `100lvh` are untested on a real iPhone — the owner's LOAD LOG screenshot decides. A home-screen install has no
  bars (it should log nothing about them).
- **The other ladder poses** (the push upright, the catch, the haul, the raise) keep their fixed arm angles (the walk-up is IK now) — a
  pixel or two at 402 in those moments.
- **The drone message's first line** sits under the NEON sign's ghost (15 %) — the existing sign-dim rule (not changed).
- **The banner can fly behind a cloud** (only skytyped messages push the clouds back); **the plane's banner lags its path** — on the
  undulating line of flight the train is never perfectly level (by design).
- **The hydrant's patch** isn't walked round (nobody walks there — it lies in front of the floor).
- **The cloud (one run, 40254745016)**: audio, show, city, wild green; `street` 66/67 — THE DANCERS' ARMS NEVER JUMP saw **1** jump over 1 rad
  in 489 frames on the cloud's slow, uneven frames. Locally the `motion` group passes (0 jumps over 638 frames, p99 17.4 rad/s). Likely
  this pass's "start at the fire": `&force=dance` now begins its circle 8 s after the page opens, so the 15-s trace covers the first
  phrases (a dancer settling into the wands pose) where it used to join a circle mid-dance. Not re-run (the two-run rule). Next pass: either
  start the trace a few seconds into the dance, or look for a jump at the first phrase's start.
- **Not run locally**: the `music`, `flags`, `perf`, `tape` groups (untouched areas) — green in the cloud run.

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **THE LOAD + its log**: the plain link `https://neonspeakeasy.com/?city=2&debug=1` (NO `&tz` / `&at` / `&when` — those make a preview clock
  with no live weather) opened in a Safari tab, cold (a new tab) — then tap the `LOAD …` strip: anything marked ⚠ moved after the reveal.
  Compare a home-screen install the same way.
- **THE HUSH SIGN + the single panes at night**: `&when=2026-10-22T22:30&force=hushsign&hush=JAZZ` · by day `&when=2026-10-22T13:00&force=hushsign&hush=JAZZ`.
- **JOIN / HOST by day**: `&when=2026-10-22T13:00` (the words white on the unlit rings) · the music OFF look: tap the note.
- **Rosie + the wheel**: by day `&when=2026-10-22T13:00` · a party night `&when=2026-10-24T23:00` (the bulbs + the show unchanged).
- **The crabapple**: `&when=2026-10-22T13:00` (autumn) · `&season=spring` · `&season=summer` · at night `&when=2026-10-22T22:30`.
- **The hydrant**: `&when=2026-10-22T13:00` · the spray `&when=2026-07-14T15:00&force=hydrant` (the worker walks in from the left) ·
  a hot day for real: `&temp=31&when=2026-07-15T13:38:20` (that afternoon's seeded visit: the worker walks in, the spray ~30 s later).
- **A panel-fired worker**: open the panel → PEOPLE + WORKERS → any worker (e.g. LAMP REPAIR), START 3 S — he walks in with his ladder.
- **The ₿ balloon + the launch**: `&when=2026-10-24T10:00&force=balloon-festival` (the ₿ up first, the rest rising from behind the city)
  · at night `&when=2026-10-24T21:30&force=balloon-festival`.
- **A 3-line skytyped message by day**: `&when=2026-10-21T10:30&force=skytype&wind=2&text=HAPPY%20BIRTHDAY%20HAPPY%20BIRTHDAY%20HAPPY%20BIRTHDAY`
  (near the sun; the clouds thin behind it) · the drones `&when=2026-10-21T22:00&force=drones&text=HAPPY%20BIRTHDAY%20JESSICA`.
- **The banner plane**: `&when=2026-10-21T13:00&force=banner&text=FRESH%20LEMONADE|AT%20THE%20PIER`.
- **The periscope's ping**: the panel → TOOLS → SOUNDS → `periscope-ping` ▶.
- **The slanted glass tower**: `&when=2026-10-22T22:00` · a party `&when=2026-10-24T23:00`.
- **The lobby line feasibility**: `&when=2026-10-22T14:00&force=line&n=8&lineproto=1` (· `n=4`, `n=6`; at night `T22:30`).
