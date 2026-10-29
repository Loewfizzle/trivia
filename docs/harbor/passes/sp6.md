# SP6 — THE FIXES BEFORE WINTER: THE CLOUD MINUTES, THE BLUE TV WINDOW, THE BOSS's PARTY WINDOW, THE UFO's BEAM + SPOT, CREDITS, THE THREE ROOF MODES, THE VEHICLES' LETTERING + THE FOREGROUND TRAFFIC (Oct 27 2026; plan.md "OWNER'S NOTES — OCT 27 (after 11a-2)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## SP6 — THE FIXES BEFORE WINTER: THE CLOUD MINUTES, THE BLUE TV WINDOW, THE BOSS's PARTY WINDOW, THE UFO's BEAM + SPOT, CREDITS, THE THREE ROOF MODES, THE VEHICLES' LETTERING + THE FOREGROUND TRAFFIC (Oct 27 2026; plan.md "OWNER'S NOTES — OCT 27 (after 11a-2)"; behind `?city=2`)

### The cloud minutes (Group 0)
- `tests.yml` no longer runs on every push: a push runs its jobs only when one of its commit messages carries **`[ci]`** (a game / app pass's
  final push) or **`[harbor]`** (a City 2.0 pass's final push, which runs both workflows); pull requests + `gh workflow run tests` always run.
  Any other push shows a SKIPPED run (0 minutes). A concurrency group per mode (full / skip): a newer full run cancels an older one, a skipped
  push never cancels a full one (harbor.yml already worked this way). CLAUDE.md + docs/testing.md updated. **Budget ≈ 30–40 cloud minutes a pass**
  (tests ≈ 10: unit ≈ 1 + integration ≈ 6–9; the harbor's 7 jobs ≈ 25–30 billed).
- **NEVER write the tags inside a commit message's text by accident**: "runs on a [ci] / [harbor] push" in a message IS the tag (GitHub's
  `contains()` matches the text). SP6's own Group 0 message did that and spent one of the pass's two cloud runs.
- 11a-2's two `holiday` failures (not flakes): the giant check now waits for **the giant's own first frame** (`hprops.giant.drawn > 0` — its
  sliced bake draws after the small jack-o'-lanterns on the slow runner; real phones were never affected); BOTH spiders' taps wait until that
  spider stands STILL, read where it IS just before the tap, and tap once more on a miss (the cloud missed the second at 430, then the first at 390).

### THE BLUE TV WINDOW (windows.js#tvRoom, core/harbor-moments.js#TV_PAL / tvScenes / tvScene; Group 1)
- **The colours are the owner's picked set** (`TV_PAL`, each [the light near the set, the deeper wash]): **B** deep royal [40,90,255]→[20,45,170]
  (HOME), **A** 7b's first look, **H** royal with the ceiling catching it, **N** sapphire; **F** violet-blue briefly; **W** amber, a brief warm
  scene. `tvScenes(slot)` (pure, seeded per minute: every phone the same): a cut every ~3–8 s, a quarter of the B scenes a LONG steady
  12–20 s stretch, F + W 1.2–2.2 s and always back to B, the others drifting home often — never a metronome. tvLight's flicker is unchanged; its
  late channel-flipping burst picks a palette per flip; its quiet stretches show B. 11a-2's pale `TV_BLUE` (white added) is gone.
- **THE PRIMARY GLOW (the owner, mid-pass, on a 4-frame burst: "the first image on the left, that's the glow I'm looking for — cycle and
  flicker, but make the primary glow just like it")**: that frame was scene B at a normal level (the pane ≈ [38,64,150] in the facade crop);
  the other three were tvLight's quiet stretch (a dim navy most of the time). Now `tk = quiet ? 0.92 : 0.6 + 0.4·min(1, k·1.18)` and the wash
  `L = a·(0.62 + 0.38·tk)`: a quiet stretch HOLDS the primary glow, the cuts + the flicker move round it, a dim spell dips only a little
  (measured: B scenes ≈ [26,57,162] in the probe's crop, quiet stretches the same, a dim spell ≈ [22,48,143]).
- **The room**: the whole pane washed with the set's light (every box face the blue at a value — never grey), strongest LOW AT THE FRONT
  RIGHT (the unseen set below the sill) with a hot core just over the couch, the ceiling catching it (more on H); the room's shapes DARK
  against it with a lit side toward the set: an EMPTY COUCH's back low across (two cushions, a thin bright rim along its top, brightest toward
  the set), a FLOOR LAMP (off) just past the curtain (its shade's underside + right edge lit), a PICTURE FRAME on the back wall (its glass
  catching the light). STILL NO PERSON. The curtain's inner edge + the landing on the sill/brick in the same blue (`tvCols(tv, t).near`).
  The edge windows' 'tv' mood uses the same palette. Compared at 402 against 7b's first look (a worktree of 3c5c17a): the whole-pane glow
  is back, in today's room; next to the warm windows it reads "a TV is on in there" from across the street.

### THE BOSS's PARTY WINDOW + THE REAL SHADE (windows.js#apartmentState / bossShade)
- On a party night the shade glows with the **TV from the party's start** (state 'lamp' → glow 'tv'): the one cool-blue window all party night;
  its glow `(0.5 + 0.5·k)·TV_LIFT` (a quiet stretch never sinks it); the blue landing on the brick from the party's start too (softened ×0.55: through the cloth).
- **The shade drawn as a real shade whenever it's lit** (the lamp's evenings + the party's TV): a broad glow through the cloth + a soft HOT SPOT
  where the light is (the lamp low left of centre; the set low at the front right), the cloth's faint horizontal weave, two sag lines from the
  hem's corners, the EDGES darker + the top under the roller darker. By day the shade stays exactly as SP5 drew it (the darker edges ran by day at
  first and shrank the day pane-equality check's measured width by 1 pt — lit only now). The violet spade + his shadow untouched.

### THE UFO (legends.js; Group 2)
- **THE REAL MODEL WAS NOT ON THE MACHINE** (`~/Downloads/city-models/ufo/` doesn't exist; nothing named *sebslom* / *.glb in Downloads, Desktop,
  Documents, OneDrive): as the brief says, the hand-drawn saucer (11a-2's) stays, the bake is skipped (no `art/`, no `scripts/bake-ufo.mjs`, no
  sprites). TO DO IT LATER: drop `ufo-01-sebslom.glb` + its `credits.txt` into `~/Downloads/city-models/ufo/` and ask for "the UFO bake" — the
  plan stands as written in plan.md (24 yaw frames at the camera's angles, body / lights / dome layers, the model's own look, `&ufo=classic`).
- **THE BEAM's HORIZONTAL LINES — FIXED**: the cone was drawn in 12 horizontal slices overlapping by half a pixel, three passes deep (the veil,
  the light, the shimmer), so every seam drew twice — 11 evenly spaced lines across the beam AND its haze (the sprite reaches |s| < 1.45 of the
  cone). Now each pass is ONE drawImage: fully open, the bake itself; while it opens, the bake masked once a frame into a same-size canvas
  (`beam.mask`, freed with the bake) by a soft gradient at its reach. Checked at DPR 3: one smooth cone.
- **THE SPOT BESIDE A CENTREPIECE**: when `fs.centre` (a centrepiece or the giant ₿ pumpkin is up) the whole abduction — the walker, the beam, the
  craft, the lamps' shadows — moves to `GIANT.clear + 1.3` units off the compass on the side with room for the saucer (right when it fits on
  screen, else left — at 390 / 402 / 430 the giant sits right of centre: LEFT); on the left the walk-in is mirrored (in from the left, never
  through the piece). The walk is translated, never changed; **the lift, the pose, the timing (drawAbductee, core/harbor-legend.js#ufoAt)
  untouched** — not in the diff. `harbor().legend.state()` reports `beside` + `spot`.

### THE CREDITS SHEET (js/ui/credits.js; Group 2)
- ☰ → **CREDITS** (the title, the lobby + in a game: settings-panel.js#openMenu, after SETTINGS): a glass sheet, groups in order — THE CITY SOUNDS
  (a summary line: Freesound CC0, Sonniss GDC, Mixkit, Pixabay — the full list stays in audio/city/CREDITS.md), THE TYPE (Orbitron, Chakra Petch,
  JetBrains Mono — OFL 1.1, each linked). **ADD A CREDIT**: one entry in `CREDITS` ({ group, title, by, licence, link? }), copied word for word
  from its credits.txt — the UFO model's line goes there when it is baked. Classes `cr-` (components.css). Reviewed at 390 + 430.

### THE THREE NEW ROOF-SIGN MODES (core/harbor-roofmodes.js, neon.js, signs.js; Group 3)
- `ROOF_MODES` = spell, race, breath + **wordflash, layers, twotone**; `BIG_MOVES` (everything but breath) take TURNS — one sign at a time, the
  same slot logic. `roofModes(ids, hour, { noTwoTone })` picks among six, neighbours never the same, **never TWO-TONE on tonight's colour-cycling
  sign nor a sign without a border tube** (the blade). Lengths: wordflash 7.4 s, layers 6.4 s, twotone 6 s.
- **WORD FLASH** (`wordFlashAt(u, n)`): hard switches, twice through, then held — a stacked two-word name word by word (the top line, the bottom,
  both; neon.js#roofWords clips the letters' box into its two halves, the burnt-out letter still dark inside each); a one-word sign alternates
  the word ↔ its icon + border. **LAYERS** (`layersAt`): out, then the border strikes on (a stutter), the letters, the icon, held. **TWO-TONE**
  (`twoToneAt`): the border + the letters trade colours twice (25 ms crossfades) then settle — a second sprite set (`sign.litSwap(dpr)`: the
  border in the sign's colour, the letters toward white-ice `mix(col, ICE, 0.82)` so the trade reads at phone size), built ahead (queued the
  hour a sign takes the mode), freed with the item.
- Off as before on party nights / tier 0 / reduced motion. Previews `&force=roof-wordflash` / `roof-layers` / `roof-twotone` (+ the old three),
  now **panel rows** (THE CITY'S NEON). tests/harbor-roofmodes.test.mjs (the levels, two trades, the cycle-sign rule); the `neon` e2e group
  probes all five big moves (each probe ends once two signs have taken their turn).
- **A CRASH CAUGHT IN THE PASS** (worth remembering): the first version read `it.sg.id` for every item — outline items have no `sg` — so on any
  night with a BURNT-OUT LETTER every frame threw; scene.js#frameFailed stepped the tier down and stopped the loop after 30 failures: the city
  never revealed. Only `&force=burnout` showed it (the console has only a warning). The `neon` group's burnout block caught it.

### THE SMALL FIXES (Group 4)
- **THE VEHICLES' LETTERING READS ON AN iPHONE** (the owner, mid-pass: "POLICE, TAXI, BAKERY — big enough to read; city sanitation → just
  SANITATION"): `vehicles.js#letter()` sizes every word to its panel (two-word names stacked when that reads bigger: HARBOR / DAIRY), squeezes to
  72 % at most before shrinking, a dark OUTLINE (by night too), Chakra Petch 700. The van's trade fills its box panel (~2× the old size); POLICE
  ≈ 2× tall on the white door, clear of the rear fender + the star; SANITATION across the dump bed; the TAXI roof sign 1.15 × 0.44 units (was
  0.6 × 0.24; its lit face at night at the new size, the word drawn dark on it in source-over — the additive lamp layer had swallowed it);
  the van's lettering lifted by night.
- **NEVER MIRRORED**: a vehicle is baked facing right and flipped for a trip to the left, which mirrored every word ("YRIAD ROBRAH"); a lettered
  model (van, trucks with trades, the taxi, the patrol car) now bakes its words pre-mirrored for a left trip (`o.mir`, its own cache key).
- **THE LETTERED CARS AS FOREGROUND TRAFFIC** (the owner: "those cars should be driving in the foreground too, just randomly as traffic"): the
  street under the dock (seen while the dock rests) — `SEQ.street` (the far lane, or both when one lane) gains the PATROL CAR (2.1 tall: under
  the dock's top); a new `SEQ.streetNear` (the near lane's passes when the street has two) takes the van + the SANITATION truck too: measured at
  402, a 2.6-tall van's roof on the far lane would stand ~9 pt over the dock's top line (the truck ~3 pt), on the near lane well under it.
  roadlight.js picks the cycle by the pass's lane.
- The PIES (1.6×) + the SHOPPING BAGS (1.5×) bigger, a dark outline round each, the crust's / the fold's top edge lit (folk.js#carry).
- THE CHIMNEY SMOKE against a bright pink sky: at golden hour a darker cool grey-violet [96,86,108], a touch denser (backlit smoke) — it held the
  warm grey of the sunset before and vanished.

### Decisions made
- The real UFO model absent → the classic saucer, no bake (the brief's rule); the credits sheet built anyway with what the site already uses.
- The abduction's side: the side with room on screen (left at phone sizes), the walk mirrored there — the lift untouched.
- TWO-TONE's letters go toward white-ice (not the border's pale tint): a straight trade was invisible at phone size.
- The TV's primary glow = the owner's picked frame (B at a normal level), held through the quiet stretches.
- The van + the truck only on the near lane (no rule conflict: measured, not guessed).
- Pies / bags / smoke: the minimum that reads; the holidays' real polish waits for the HOLIDAY POLISH PASS (the owner, Oct 27).

### Measured
- The speed round (title-perf --ab against e01601e in ONE run, 4× CPU, 390×844, 2 + 2 windows; no SLOWER anywhere): **sp6-tv** (a normal night
  23:00, the blue TV on) — t2 same (work 32.0 → 29.9 ms, noise ±2.3), t0 same (15.0 → 16.7, noise ±1.7); **np-party** (the peak: the boss's blue
  shade) — t2 faster (59.2 → 51.1, noise ±7.5), t0 same (23.3 → 24.5, noise ±5.5); **sp6-ufo** (the abduction) — t2 **faster** (24.3 → 18.9 ms,
  slow frames 72 → 40 %: the beam's 36 slice draws a frame → 3 images), t0 same (14.7 → 14.7). Absolute numbers are this laptop's (warnings only).
- Cloud minutes: this pass ran the full cloud TWICE (Group 0's accidental tag + the final run, by hand: the final push held no City 2.0 path).
- **THE FINAL CLOUD RUN (40517936043)**: `windows`, `audio`, `holiday`, `street`, `wild` GREEN (the holiday fixes hold); `tests` (40517935676)
  green; `show` 73/74 — SP5's known HALF-TIME near-miss again (beats 2 + 4 at 0.36 vs the limit 0.343, the beat code untouched); `city` 85/85
  checks with `panel`'s "the word gone" + `perf`'s "re-bake" timeouts (both fail on the baseline locally too). Not re-run (the two-run rule).

### Known issues
- `panel`'s "the word gone" timeout fails locally on the baseline too (and on the cloud's accidental Group-0 run) — not this pass's code; open.
- `perf`'s "A CALM LOAD STEPS NOTHING" + "BATTERY: 60 fps for a moment" fail on this laptop on the baseline too (timing; warnings on CI).
- `city`'s LOAD WEATHER flake (SP3's, clock-dependent) on the cloud again.
- `holiday`'s "THE SPIDER'S TAP (touch)" missed once locally in the final run (the spider had already gone from 'crawl' to SP5's 'skitter'
  when sampled — it dropped onto the word and moved 10 pt; the same check passed twice earlier in this pass, untouched code) — a timing race in the check.
- The near street's van / truck / patrol car are not forced by any preview (the cycle brings one round every few passes; `&force=road-pass`
  sends a pass every ~13 s).

### Handoff → 9b WINTER (+ the construction tower)
- The UFO bake when the model file is on the machine (see above); the credits entry with it.
- Chimney smoke's golden-hour tone is ready for winter's cold afternoons (`chimneys.set(k)`).
