# PART 6b — THE SPECIAL SKY (Oct 24 2026; the legendary events, the jets, the barnstormer, the balloons, sky messages, the clouds, the arch; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 6b — THE SPECIAL SKY (Oct 24 2026; the legendary events, the jets, the barnstormer, the balloons, sky messages, the clouds, the arch; behind `?city=2`)
Run unattended (the owner away): "Decisions made while Ben was away" below. Out of scope as asked: the foreground (FP3b is under review),
weather on the city (Part 9 — but the fog beam + beacons are in), fireworks + the party yacht (Part 10), the holiday skies (Part 11: the
witch, Santa's sleigh, skydivers — hooks below), the noctilucent clouds.

### 0. Housekeeping (Group 0)
- **THE FLAKY PROBES (FP3b's Known issues):** the speakeasy's night page now PINS tier 2 (`setTier(2)` — the cloud's runner sat at a lower
  tier, where the pole's halo is drawn differently: its far "NO SMOKE" point read +17 there, 0.0 here); the bar window's check POLLS for its
  warm light (it was read mid-ramp once); the far NO SMOKE reading is an `okF` warning until a cloud run proves it gone (the near reading —
  the pole lights the brick — stays hard).
- **GROK'S LIFE + WORKERS + WILDLIFE SOUNDS** imported (28 slots filled, 19 new, +2.05 MB; four left empty on purpose) → docs/audio.md#6b.
  Wired now: the doors, the dance circle (a wand swish on the big moves, clap bursts while watchers clap, a rare whoop), the water taxi's
  putter, the TR-3B's crackle. The rest wait for 8b's workers + wildlife.

### 1. THE TWO LEGENDARY EVENTS (`core/harbor-legend.js` PURE + `tests/harbor-legend.test.mjs`; `screens/harbor/legends.js`, `jets.js`)
- **WHEN** (`legendNight`): ~1.5 nights a month EACH (≈ 17 abductions + 14 TR-3B nights a year), seeded by the EVENING's date (every
  phone the same, after midnight belongs to the evening before), never both on one night, never two legendary nights in a row, at a
  seeded time 21:30 → 00:45; a dark, dry night (the abduction) / any night but a storm (the TR-3B); THE DIRECTOR may hold it (below).
  Joined mid-way: `legendAt(local)` → the seconds in. The module is LAZY: loaded only a minute before a legendary, for a preview or the
  API — a normal night never fetches it (tested).
- **THE UFO ABDUCTION** (~30 s; the owner's reference `docs/harbor/refs/abduction.jpeg`): THE CRAFT — a dark glossy saucer seen from below
  (deep violet, the city's pink / cyan / amber sliding on its hull, the dome cap over the far rim, a glossy rim with a lit lower lip,
  radial seams, the concentric emitter rings, 16 rim lights chasing), gliding in from the left under the tagline (small + far → near),
  a slow silent hover over the COMPASS, a pause, then gone FAST up and away (a streak). THE BEAM — a WIDE SOFT CONE baked per size: rays
  converging on the emitter, faint colour shifts (violet / teal edges, warmer low), soft edges; drawn as a pale VEIL (a body of light in
  the air) + the light added + a hot core + a soft haze round it; it OPENS DOWNWARD with a soft front (in slices — never a cut edge),
  shimmers, and carries ~70 / 44 / 22 rising motes (by tier); it lights the paving (a pool + a wide wash over the trees + the lamps),
  the water under the craft (its reflection column), and throws the TALL LAMPS' SHADOWS long + outward. THE FIGURE — a lone late walker
  (folk.js's rig + look) strolls in from the right, stops on the compass, turns to look up, POINTS; then the LIFT (slow, then faster):
  his own 2.5-D arched rig (chest highest, the head dropped back, the arms hanging loose with open fingers, the knees bent, the feet
  trailing), a slow sway round side-on (end-on the arch read as a hunch), the coat tails lifting in the updraft, the HAT off first
  (tumbling up into the light), rim-lit from above, drawn 1.2× (the glance test), his shadow shrinking under him, dissolving into the
  light at the belly. THE CITY — the lamps under it stutter, the lights near it dip; the music DIPPED + MUFFLED (a low-pass); the hum +
  the beam's riser (its peak as he leaves the ground).
- **THE TR-3B + THE JET CHASE** (~50 s): a huge matte-black TRIANGLE (its hull's thickness along the near edges, faint panel lines + spars,
  a thin rim of city light) crossing the WHOLE screen slowly through the band just above the crowns (against the city's glow; the tallest
  crowns in front of its belly; it blots out the stars + the moon), three pale corner orbs pulsing in turn + a heavy red-orange centre.
  THE POWER DRAIN: the city's own UNLIT bake laid back over the lit one in ~W/12 columns under it (`scene.js#drainCity`) — windows, neon,
  signs, beacons dead right under it; the edge of its range SPUTTERS (each column its own flicker); the zone TRAILS it (the lights come
  back late + unevenly behind it, each column its own lag); the harbor (the wheel, the pier's lamps, the boats, the lighthouse) dims hard
  by distance; the promenade (the lamps, the speakeasy, the string lights) is the edge of its range (a sputter + a dip to ~45 %); the
  NEON SIGN glitches while it passes under it (the sign-dim hook, ~9 Hz). THE MUSIC POWERS DOWN: a TAPE STOP (`audio/music.js#bendMusic`
  — the speed + the pitch sagging to 0.42, the time lost made up when it's back, so a lobby's synced song stays on the room's clock),
  muffled to ~380 Hz, almost gone; the drone, the power-down's thump as the city dies, crackles while it drains. THE CHASE: three F-16s
  in an echelon scream across after it (afterburners with MACH DIAMONDS, the roar panned along their pass with the music ducked round its
  peak), then the music + the power come back.
- **THE F-16** (`jets.js`, shared with the air show): a sharp silhouette (the radome, the gold-tinted bubble canopy, the chin intake, the
  tall swept fin, the cropped delta from just below, the stabilator, ventral fins), two-tone grey camo (the sun on the spine, warm at
  golden hour; a dark shape lit from below by the city at night), wingtip AIM-9s + an under-wing store + a centreline tank. THE
  AFTERBURNER: a tapered plume (orange-pink outer, violet inner, a white-hot core) + FIVE MACH DIAMONDS (white-hot → blue-white → violet
  → orange → dim orange, crisp rhombi + a tight glow, flickering a touch), a soft glow round the plume at night. Night: the green
  FORMATION strips, the near wingtip's nav light (green flying right, red flying left), a white tail light, a red beacon.

### 2. THE JETS, THE BARNSTORMER, THE BALLOONS, THE SKY MESSAGES
- **THE AIR SHOW + THE MISSING MAN** (`jets.js#showLead`, `showJets`, `createAirShow`): flights on an analytic path (every phone the same).
  THE AIR SHOW — a DIAMOND of four, smoke on by day: a low pass, a big LOOP in the open sky (the smoke drawing the circle; the jets go
  inverted over the top), a VERTICAL PULL-UP on full afterburner with vapour cones. THE MISSING MAN — a finger-four in a calm flat pass;
  #3 pulls up + away alone. On the clock: the missing man on Memorial + Veterans Day at 11:00, the air show on July 4th at 15:30
  (`SKY_HOLIDAYS[].show`, clear + by day); both sky lanes (heavy); the roar on each pass.
- **THE BARNSTORMER THROUGH THE SIGN** (`barnstorm.js`; `core/harbor-legend.js#barnstormDay`: ~3 days a week, 1 in 5 after dark): a red
  1920s biplane (an open cockpit, the pilot's helmet + goggles, a WHITE SCARF streaming, the upper wing on struts, a blurred prop, the
  wheels) weaving THROUGH the NEON letters: behind the first N's uprights + in front of its diagonal, in front of the E, THROUGH THE O
  (behind its left side, in front of its right), a LOOP round the last N, then away climbing. The plane is drawn on a small OVERLAY canvas
  (`canvas.nd-skyfront`, z 60 — above the sign, under the corner buttons at 70; made for the flight, removed after) with the strokes it's
  behind CUT OUT of it (their tube paths from ui/logo.js, mapped like the sign's dark halo) — the real glass shows over it there. By day a
  thin smoke trail (behind the sign); at night its wingtip + tail lights and the sign's pink on its top; the letters flicker a touch in its
  wake (the sign-dim hook).
- **THE BALLOONS, PREMIUM + THE WHOLE SKY** (`balloons.js`): each GORE puffed between its tapes, a sheen on the sun's side, the dark MOUTH
  seen from below, the skirt, cables, two tiny passengers; the burner lights the envelope from inside AND the basket + the air round the
  mouth. They use the whole sky (from under the corner buttons to the crowns, behind the sign): far = small + high, near = bigger + lower;
  a festival spread across it. THE SPECIALS (always at the festival, ~1 in 8 each on a normal flight): THE ₿ BALLOON (black with a big
  orange ₿ by day — drawn, never a font's glyph; at night all orange with a black ₿, lit from inside all the time) and THE ALIEN HEAD (a
  green special shape, big glossy black almond eyes, seamed).
- **SKY MESSAGES — ONE LAYOUT** (`core/harbor-sky.js#messagePages`, `dotLayout`): up to 3 LINES (~16 letters) a PAGE, up to 3 PAGES
  (≈ 140 characters; " | " forces a page), each page wrapped into whatever line count makes its letters BIGGEST in the box ("HAPPY /
  BIRTHDAY / JESSICA", "HAPPY NEW YEAR / FROM NEON / SPEAKEASY"). THE BOX: the whole open sky from under the corner buttons down to just
  above the tallest crown across it. SKYTYPING (`smoke.js`, rebuilt): a formation of five JETS (jets.js, afterburners lit) types each
  line in turn; a page READABLE 15 s once complete, then BLOWN AWAY in ~5 s before the next; the last page stays while the sign comes
  back and fades behind it (~70 s). THE DRONE SHOW: a page per formation, the fleet growing to the longest page (`DRONES_CAP` 360 / 280 /
  200 by tier — a drone a dot), the letters' glow wider so the dots merge. **THE SIGN MAKES ROOM** (`skyfx.js#signFor`, the sign-dim hook):
  while a message types / a show flies the NEON sign + the tagline power down with a flicker or two to a GHOST (15 %) — the canvas's dark
  halo behind the letters fades with it (by day it read as a dark NEON on the blue) — and re-ignite once the last page has been read (the
  show's scatter). Drones + smoke draw in front of the moon. **SKYWRITING IS CUT**: the code, its alphabet, the panel row (an old
  `&force=skywrite` link / `sky.skywrite()` types instead); the holidays skytype (Valentine's "♥ LOVE ♥", Halloween "BOO!").
- **THE BANNER PLANE** flies just under SPEAKEASY through the tagline's band (its lane from the word's live rect); the tagline fades out
  while it's up and back after (the sign-dim hook: logo 1, tag 0).

### 3. THE EVERYDAY SKY'S FIXES ("6b section 0")
- **THE GEESE** (`core/harbor-flight.js#geesePlan`, `goosePose` PURE + `tests/harbor-flight.test.mjs`): uneven arms, irregular spacing, each
  bird drifting in its slot, 1–2 STRAGGLERS trailing with a gap and flapping 30–45 % faster, timed events (one drops back + catches up, two
  trade places). **THE BATS' JITTER** — the cause: each bat's height read the RAW roofline (a step function: 34 jumps > 8 pt at 402 wide,
  up to 91 pt) — crossing a building edge jumped it, its wobble flicked it between two heights. Now a smoothed roofline + smooth paths
  (three sines an axis) with quick eased DARTS (zig-zag, the odd swoop down, a bank into each), frame-rate independent. (The swifts had
  the same roofline bug — fixed too.)
- **ROSIE** never turns in sight (`core/harbor-boats.js`): she BACKS IN to her landing from past the right edge (astern: the wheel turning
  backward), holds bow-out four minutes, steams out bow-first — the same berth times (there was no place to hide a turn: the pier +
  breakwater draw under her). Tested at the six sizes over a day.
- **THE HELICOPTER's DEPTH** (`air.js`): it flies OVER THE HARBOR in front of the skyline (~58 pt above the waterline, right of the wheel),
  drawn after the city (`skyfx.city`) — never behind a tower; its searchlight's upper part with it, the rest + its pool after the water;
  at night its belly lamp + a warm cockpit glow (it read invisible on the dark towers).
- **FLUFFY CONTRAILS** (City 1.0's look): a billowy five-lobe puff sprite, each puff its own seeded size + a little sideways billow,
  spreading faster, a 30 s life — the same capped cost.
- **SHOOTING STARS RARER + THEIR OWN ART** (`meteors.js`; `fx.js`'s opt-in `s.meteorArt` — City 1.0 unchanged): a normal clear night ~1 every
  38 min, a shower's peak ~1 every 2.5 min, ±1 day ~1 every 9 min, a rare FIREBALL (a few a year: big, slow, green-white, breaking up); a
  tapered streak with a hot tinted head, varied speed / length / brightness, the odd flare shedding sparks, a lingering train; on shower
  nights they fly out of the radiant (east: up-left). The moon's three-tap star stays City 1.0's. &force=meteor, &force=fireball.
- **THE AURORA, BACK TO CITY 1.0's** (`aurora.js`): the wide overlapping feathered strands summed into one smooth curtain (gaussian edges —
  "blends more"), re-fitted to the whole sky down to the crowns, taller + brighter on a storm night, + a soft reflection on the water. 6a's
  nights unchanged. (6a's ray curtain in moon.js is no longer called.)
- **THE RAINBOWS** (`core/rainbow.js#bowGeometry`'s `o.harbor`; City 1.0 unchanged): a big tall arc, its top just under the NEON word
  (behind SPEAKEASY + the tagline, never across NEON), its legs down behind the skyline at the screen edges. Every bow (day, double,
  moonbow, neon bow).
- **THE MOON REDONE** (`moon.js`; the owner: "the craters look off"): a real PHOTOGRAPHIC map of the near side — NASA SVS's CGI Moon Kit
  (svs.gsfc.nasa.gov/4720, the LRO LROC WAC mosaic, public domain), projected once into a 256² grayscale disc (`assets/moon-near.jpg`,
  17 KB, loaded lazily — the drawn texture is the fallback, turned the same way) — the soft grey MARIA (the "man in the moon"), bright
  highlands, Tycho's rays at the bottom, no drawn craters. TURNED TO THE PLAYER'S SKY (`moonSky(L)`: the moon's north from the latitude,
  longitude + time; the lit side toward the real sun — a GR moonrise tilted ~30°, an evening crescent lit lower-right, Sydney upside
  down), lit per pixel in its real phase (a soft terminator ~5 % of the radius, a gently soft limb), earthshine, the amber moonrise (the
  seas softened ~30 % so it reads golden), the harvest moon, the supermoon, the eclipse's copper (a touch see-through: the seas faintly
  in it). Cached by phase / earthshine / amber / turn (~3 ms a rebuild on the laptop, every few minutes at most). Fixed with it: a low
  amber crescent drawn as a full disc, an opaque pale earthshine disc, a leftover amber fill fading the next moon.
- **THE DIRECTOR** (`core/harbor-director.js` PURE + tested): every HEAVY moment asks before it STARTS — the party, a drone show, the air show,
  a skytyped message, a legendary, the balloon festival — against a per-tier SPECTACLE BUDGET (1 / 2 / 2 heavy at once) and the owner's
  PRIORITIES (holiday 5 > party 4 > legendary 3 > rare 2 > routine 1); what runs keeps its slot, a lower one waits (a tier-0 phone on a
  party night skips the legendary). Previews bypass it. The legendary module is lazily loaded (the pattern for the holidays' + seasons'
  assets). THE PASSIVE LONG-SESSION CHECK: the readout's new line `last 10 min x% slow · heavy n/budget` (per-second buckets) — leave the
  iPhone on the city with &debug=1 after this part and read it.

### 4. THE CLOUDS + THE ARCH + THE FOG LIGHTS
- **THE CLOUDS** (`core/harbor-clouds.js`, `clouds.js`): THE LAYERING BUG — the plan sorted far-first by NEARNESS before the kind, so a high
  cirrus low on the screen drew after a cumulus; now the HIGH kinds (deck, cirrus, alto) always draw first. A HEAP cloud's body is OPAQUE at
  night too (the night's "body" factor thinned it to 66 %: the cirrus showed through) — only the layer clouds thin. Under a FULL deck: no
  scud and no small cumulus (the deck alone; only big cumulus melting into it). CIRRUS ~1.5× longer + flatter, softer (a wider silky body,
  fainter + wider fibres, baked at a lower resolution). CLOUDS EVOLVE: each heap / patch slowly swells + changes shape (anchored at its
  base) and thins + re-forms over minutes (a pure function of the sky's clock). THE HIGH VEIL's real look: a MILKY SHEEN over the blue
  (whiter toward the horizon), the sun softened in a wide watery glow, and on ~1 veil day in 4 (seeded) a faint 22° HALO round the sun
  (&force=halo with &wx=veil).
- **THE ARCH, HIGHER** (`scene.js#archFor`; `district/sun.js`'s `ar.pow`; fx.js's moon `arch.pow`): the APEX just under the NEON tubes (the
  summer-solstice noon); December's noon CLEARLY ABOVE the tallest crowns (about half-way up the arc); the seasons between on a COMPRESSED
  curve (pow 0.75) — at 402: December ~333 pt, late October ~283 pt, June ~183 pt (under the sign, behind SPEAKEASY); rise + set still
  behind the skyline; the moon on the same mapping. The sun's glare draws in tight near the top (a fainter wide halo, a smaller bloom).
- **THE LIGHTHOUSE BEAM IN FOG** (`lighthouse.js`): the denser the fog, the WIDER, SHORTER and SOFTER the cone (layered fans), with a big glow
  at the lamp (at tier 0 too); a light fog keeps a faint crisp shaft. **THE BEACONS IN FOG** (`lights.js#drawBeacons`'s halo pass, drawn
  after the fog layer): every top blooms into a soft RED halo glowing through the murk, breathing slowly in unison (they stay red — the
  plan's call). (The searchlights + sky beams in fog: unchanged — see Known issues.)

### Decisions made while Ben was away (each the most reasonable reading; easy to reverse)
1. **The abductee is the event's own figure** — a lone late walker who strolls in, stops on the compass, looks up and points — not someone
   taken out of the promenade's planned crowd (the people's plan is a pure function of the clock; removing a member mid-route would ripple
   through it). He's drawn 1.2× while lifted (the glance test: the hero of the moment).
2. **The saucer hovers over the COMPASS INLAY** (the open floor, framed by the two tall lamps whose shadows it throws) and comes in from the
   LEFT under the tagline — from the sky-high lane it was hidden behind the NEON sign (the page draws over the canvas).
3. **The TR-3B's drain = the city's own UNLIT bake laid back over it in columns** (no new bakes, no masks): whole buildings sputter + die
   + come back late. Its direction is seeded per night. Its sign glitch rides the sign-dim hook (opacity), ~9 Hz.
4. **Legendary hours 21:30 → 00:45**, dark nights only; a tier-0 phone on a party night lets the party win (THE DIRECTOR).
5. **The figure's turn is a slow sway round side-on**, not a full rotation (end-on, the arch reads as a hunch — seen in the first burst).
6. **Sky messages dim the sign to a 15 % ghost** (the plan's ~15 %) with a quick flicker; no "dropout" sound (no slot exists for it).
7. **Skywriting is gone entirely** (code, alphabet, panel row); old links + `sky.skywrite()` type the text instead; Valentine's day types
   "♥ LOVE ♥", Halloween "BOO!".
8. **The air show on July 4th at 15:30, the missing man at 11:00 on Memorial + Veterans Day** (before their skytyped messages); the barnstormer
   ~3 days a week, 1 in 5 after dark; the legendary + barnstormer days use the evening's / the day's date seeds.
9. **Rosie backs in** (bow-out at her berth, astern on arrival) — the pier + breakwater draw under her, so no turn could be hidden.
10. **Under a full deck there are no small clouds at all** (the plan allowed "ragged + melting in, or dropped": dropped — the deck alone read best).
11. **The 22° halo on ~1 veil day in 4** (seeded by the date); the sun's halo only (the moon's 22° halo already exists in haze).
12. **THE DIRECTOR's budget: 1 / 2 / 2 heavy effects** at tiers 0 / 1 / 2; previews always bypass it.
13. **Sounds left empty:** traffic-far (modern), trash-truck (a modern diesel standing still — no arrival / departure to cut), raccoon-chitter
    (a harsh hiss: judged scary), tv-murmur (no new file). police-car-1920s cut from the 1929 Volvo's passes.
14. **The aurora's foot sits ~34 pt under the crowns' line** (the towers stand in front of its brightest edge, as on City 1.0).

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
THE UFO ABDUCTION `&when=2026-10-22T22:00&force=ufo` (it repeats; `&lgs=14` holds it mid-lift) · THE TR-3B + THE CHASE
`&when=2026-10-22T22:00&force=tr3b` (`&lgs=15` over the city, `&lgs=35.5` the jets) · a real legendary night: the TR-3B at 23:44 on Oct 21
`&when=2026-10-21T23:43:40` · THE AIR SHOW `&when=2026-10-22T13:00&force=jets` · THE MISSING MAN `&when=2026-10-22T13:00&force=missing-man` ·
THE BARNSTORMER `&when=2026-10-22T13:00&force=barnstormer` (+ at night `&when=2026-10-22T21:40&force=barnstormer`) · THE BALLOON FESTIVAL
`&when=2026-10-22T09:30&force=balloon-festival` · SKYTYPING `&when=2026-10-22T13:00&force=skytype&text=HAPPY%20BIRTHDAY%20JESSICA` · a 3-page
DRONE SHOW `&when=2026-10-22T22:00&force=drones&text=GAME%20NIGHT%20TONIGHT%209%20PM%20BRING%20FRIENDS%20%7C%20SEE%20YOU%20INSIDE&show=heart` ·
THE BANNER `&when=2026-10-22T13:00&force=banner` · THE MOON `&when=2026-10-26T23:30` · THE AURORA `&when=2026-10-22T22:00&force=aurora` · THE
RAINBOW `&force=rainbow` (+ rainbow2, moonbow, neonbow) · METEORS `&when=2026-10-22T22:00&force=meteor` / `&force=fireball` · THE HELICOPTER
`&when=2026-10-22T22:00&force=helicopter` · THE GEESE `&force=geese` · BATS `&when=2026-07-15T21:40&force=bats-dusk` · THE CLOUDS at noon
`&when=2026-10-22T13:00` · overcast `&wx=overcast` · THE VEIL + its halo `&when=2026-10-22T13:00&wx=veil&force=halo` · THE ARCH: December
`&when=2026-12-21T12:40`, October `&when=2026-10-24T13:35`, June `&when=2026-06-21T13:45` · FOG at night `&when=2026-10-22T22:00&wx=fog`.
All are in THE PREVIEW PANEL (JUST ME + EVERYONE: the sky's LEGENDARY group, AIRCRAFT, UP HIGH, WEATHER FX).

### Tests (6b)
- Unit 620: `tests/harbor-legend.test.mjs` (the legendary rarity over 3 years — ~1–2 a month each, never two in a row, the same for
  everyone; joined mid-way + after midnight; the barnstormer's days; the abduction's film in order + never end-on while arched; the TR-3B's
  crossing, drain, chase + the music back; the drain's falloff + its trailing tail; the formations; THE DIRECTOR's budget + priorities),
  `tests/harbor-flight.test.mjs` (the geese + bats), the sky messages' pages (the owner's three examples), Rosie never turning in sight at
  six sizes, the holidays skytyped, the panel's rows.
- E2E: the new `legends` group (cloud job `audio`): a normal night never loads the module; the abduction mid-lift (the beam bright over the
  compass); the TR-3B's drain; the barnstormer's overlay (above the sign, under the buttons, removed after); the air show; a 3-page drone
  message. The `sky` group's skytyping + the sign-makes-room check; the speakeasy group's probes (Group 0).
- Not run locally: the emulator-backed E2E (no Java here) — the `[harbor]` cloud run covers it; every preview was checked in the
  no-Firebase title (title-preview.html) with frame bursts.

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 93283a6 — the commit before this pass — 402×874, the laptop without a GPU, 2 + 2 windows of 5 s)
| scene | tier 2 (2× CPU): work A → B · slow frames | tier 0 (4× CPU): work A → B · slow frames | verdict |
| --- | --- | --- | --- |
| a party night (`party`) | 15.5 → 15.3 ms · 22.9 → 26.1 % (both loaded) | 14.5 → 15.0 ms · 17.5 → 18.3 % | **same** (inside the noise) |
| THE TR-3B over the city (`&force=tr3b&lgs=15`) — first build | 8.6 → 12.4 · 2.7 → 15.2 % | 8.9 → 12.9 · 1.7 → 12.9 % | slower |
| THE TR-3B — after the two fixes (re-measured) | 7.8 → 9.7 · 0.0 → 0.3 % | 8.2 → 11.3 · 0.3 → 3.1 % (frame p95 16.8 both) | +2 ms at tier 2, +3 ms at tier 0 |
| THE ABDUCTION mid-lift (`&force=ufo&lgs=14`) | (disturbed: a helper's screenshots overlapped) | 9.3 → 10.7 · 0.7 → 0.7 % | +1.5 ms, frames the same |

The two fixes: THE DRAIN's strips merge by level (eighths) and start at the skyline's own top (−48 pt for the roof signs) — the
transparent sky above the roofs cost the same to copy; at tier 0 the near rows are redrawn only where it's dead + the sign's glitch is
~4 Hz (each one restyles the page's sign). What's left is a legendary's own price for ~50 s once or twice a month — the owner's iPhone
readout decides (`&force=tr3b&debug=1`: tier, slow %, the new `last 10 min` line). Memory: the legendary module is loaded only for its
night; its sprites (the saucer ~1.2 MB at dpr 2, the beam ~0.4, the triangle ~0.7) go with it.

### Known issues (6b)
- **THE CLOUD (2 runs, the cap):** run 1 (7232578): `street` + `city` green (Group 0's probe fixes held), `audio` + `show` red on four checks that
  still described the old design (the deck + scud, the drones under the word, the sign read during its opening flicker, jets.js counted as
  the lazy module) — brought to this pass's design; run 2 (the next commit): all four jobs green; the quick `tests` workflow green on every push.
- **The speed round ran while a helper pass took screenshots** for part of it (the abduction's A side read 76 % slow — noise); the TR-3B
  + abduction rows were re-measured on a quiet machine (Performance). The iPhone readout on `&force=tr3b` / `&force=ufo` decides.
- The searchlights + the party's sky beams in fog are unchanged (still brighter in fog — "dramatic"): only the lighthouse got the wide soft
  fog cone. Part 9 can give them the same treatment.
- The air show's first pass starts its roar as it crosses (the take's peak comes ~5 s later); the loop + the pull-up are timed right.
- Skydivers, the witch + Santa's sleigh (the old 6b list) are Part 11's holiday skies now: the sky manager's piece pattern (draw / on /
  stop / debug / used / heavy) + THE DIRECTOR's `holiday` priority are their hooks; the witch + the sleigh still run as City 1.0's art.
- The geese + bats are random per phone (as the everyday sky is); their flight is now seeded per flock, so a shared seed is a one-line change.
- The ₿ is drawn (never a font glyph) — a bold B with its two bars; reads at ~40 pt, a little blocky zoomed in.
- 6a's ray aurora (moon.js) is no longer called (aurora.js draws it); its code stays until the cleanup pass.

### Handoff → 8b (THE LIFE)
The sounds for 8b are in (Grok's workers + wildlife: `police-whistle`, `trash-can-lid`, `crates-clink`, `newspaper-rustle`, `ladder-clank`,
`squeegee`, `jogger-trip`, pigeons, the duck, the squirrel, the coyotes — docs/audio.md#6b): wire them as their routines are built (the
routines layer: core/harbor-routines.js). THE DIRECTOR is where the raid + the police cars ask for their slot (`rare`), and a legendary's
power drain is the model for the raid's blackout (`legends.power(x, band)` — the lamps, the speakeasy, the strings already read it).
Rosie in 3D can turn on the water again (she backs in until then).
