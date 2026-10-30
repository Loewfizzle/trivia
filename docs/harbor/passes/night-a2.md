# NIGHT-A2 — THE WEEKEND FIXES (Oct 29 2026; plan.md "OWNER'S NOTES — OCT 29 (the evening)"; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

The owner's review of NIGHT-A (Oct 29, 7–7:20 pm, his iPhone 16 Pro, Safari 402×660) before THIS WEEKEND — Fri Oct 30 a party night,
Sat Oct 31 Halloween AND a party night. Not here: the street party, the quiet building, the helicopter (NIGHT-B); the legends + the boxer
(SKY); PERF's full work.

### Group 0 — THE LOOK FIXES
- **THE NEW NIGHT LIGHT IS THE DEFAULT** (`core/harbor-light.js#LIGHT_DEFAULT = 'new'`): OLD stays a TOOLS row (`light-old`) + `&light=old`
  for comparing. The old light's own checks pin it: the unit file `tests/harbor-light.test.mjs` (FP3a's pools, C4c's hydrant corner)
  sets OLD at its top; the NIGHT-A test flips to NEW + back; a new test says NEW is the default and the OLD row stays.
  title-perf's `np-*` / `w-rain` scenes now run the default (NEW) light.
- **THE MIRROR DOOR IS SILENT** (`core/city-sounds.js#MOMENT_CUES.mirror = []`): it swings INSIDE the barbershop, behind its glass — its
  creak (`door-heavy`), the bar heard through it (`bar-open`) and the thud as it shuts (`door-heavy-close`) are gone; the motion stays.
  The slots stay filled (`bar-open` still plays when the speakeasy's SIDE door opens onto the street at night).
  **The other inside-a-window sounds** (listed, NOT changed — each has a reason the street could hear it or none was given): the toast's
  glasses clink (`toast`, a lit window — faint, through the glass), the blind rolling up (`wake`), the cat's meow + its landing on the
  sill (`cat` — on the sill, against the glass), the barbershop's bell (the shop's street door) + the scissors' snips (`shop-open` + the
  barber's day: inside the shop). The snips are the one the owner may want gone too.
- **THE TREES' NIGHT SHADOW** (the new light; `screens/harbor/trees.js#treeShadow`, `NIGHT_LIGHT.treeShadow` `{ throw 0.34, a 2, cap 0.55,
  blur 0.12 }`): darker — the benches' strength — and SOFT: the trunk + the crown's dapple each one blurred fill through
  `props-light.js#soft` (shadowBlur, baked once with the ground: no frame cost); still short (⅓ of the height), the crown beside + just
  behind the trunk, limb lines only when bare. Measured at 402×660 (2×), the shadow's pixels against the same cobbles in NIGHT-A's
  build: the maple's 1157 px **23 % darker** on average (77 → 59 luma; its core ~28 luma deeper), the crabapple's **18 %** (73 → 60; core
  ~42) — a visible step, never a cut-out (NIGHT-A's was ~5–8 %: "so faint you can't even see it").
- **THE BOSS's BLIND FULLY DOWN BY DAY** (`screens/harbor/window-paint.js#BOSS_COVER`): cover 1 × the daylight (0.9 at night — the lamp's
  glow under the hem), so by day no gap, no strip at the sill; the tap-peek still lifts it a hair (0.07); the spade tell + his night
  states unchanged. e2e `windows`: THE BOSS's BLIND FULLY DOWN BY DAY (the pane's foot is the linen, not the dark strip).
- **THE HARVEST DISPLAY**: the DRAWN one was already the default (`&prop=model` / the TOOLS row for the model) — unchanged.
  **A SOLID OBSTACLE** — the cause of the clipping: several planners build their OWN straight legs that never ask the router (the
  chestnut cart's roll, the dog walker's beat, the party line's guests, a stargazer's stroll, couples, the dance's watchers) — a long
  seeded run put people in the band just behind the display's front row of pumpkins (in front of its sort depth, so drawn OVER it: "walking
  through"). The guard is ONE place for everyone: `core/harbor-holidayprops.js#standingFootprints(L, HP)` (the pieces' GROUND footprints,
  padded by a person's half-width + a step: SOLID_PAD 0.45) → `core/harbor-people.js#aroundSolids` on every visit as it reaches the
  frame (folkAt): a stop inside a footprint moves to its nearest edge; a walk segment crossing one is routed round its corners (route() on
  the footprints alone); the leg keeps its t0 / t1 (a little quicker on the detour: ≤ 1.35× on a straight crossing). Cached per visit.
  The partner / dog offsets stay out of them too. **Covered:** the harvest display (`HARVEST_FOOT` — a unit test keeps it ≥ the drawn
  display's bottom tier + foot pieces), the giant jack-o'-lantern, Halloween's big pumpkin on its bale (the hydrant's stands on the front
  strip, nearer than the walkers' floor), Thanksgiving's spot pieces (the bench's bale + mums, the hydrant's, the corn-stalk bundles round
  the two trunks). **Not covered:** the pumpkins on the speakeasy's steps (they flank the door — the guests pass between them), the
  snowman + the Christmas-tree stand (their builders + sellers work AT them; 11b's pieces register in standingFootprints when built).
  **The test** (`tests/harbor-people.test.mjs`): a Thanksgiving evening, a Thanksgiving party night + a Halloween party night, 30 min each:
  nobody's drawn position inside any base; a detoured crossing ≤ 1.35× its pace; a way left ↔ right exists. The scratch probe over 2 h ×
  4 nights: without the guard people inside the display, the bench's bale + the stalks (stargazers, couples, the dog walker, the cart, the
  watchers — 786 samples of one watcher at the bale); with it **none**.

### Group 1 — THE BEAT (docs/audio.md, "NIGHT-A2 — A TRUSTED GRID ALWAYS PUNCHES")
- **THE RULE CHANGES** (`core/harbor-beat.js#stepSafety` + `safePunch`): a TRUSTED GRID ALWAYS PUNCHES — HALF strength (`SAFE.half`) from the
  song's first bar on the best lead it has, FULL once the kicks confirm the lead (+ `SAFE.hold` bars after); a settle, a deaf listener, a
  song whose kicks are off its beats (`deafSong`: agree < 0.5), a breakdown: half on the grid, never the breath. The breath stays for
  'tempo' + the direct element. The readout: `lights PUNCH HALF 50 % · half · the default lead · settling after start (bar 2) · 1st punch
  bar 0` → `lights PUNCH FULL · lead confirmed · 7 kicks · 1st punch bar 0, full bar 8`.
- **WHY +156 ms, AND WHY IT WAS SAVED AS +120**: his readout says the +156 was settled after `restarts 1 (last: focus)` — an engine restart
  — on a phone whose fresh sessions read −21 … −42 ms (8b1's −34…−42; his saved −21): the same kind of post-return shift iOS showed before
  (+107 / +237 ms after the home screen). So it was THIS VISIT's value, not the speaker's — and `leadToSave` CLAMPED it to LEAD_MAX (+120)
  and saved it, so every later visit started 120 ms off and re-settled. It can't be reproduced here (headless WebKit / Chromium on Windows
  have no iPhone output path: headless Chromium reports a fixed ~140 ms device), so the fix is the RULE: a lead is saved only when learned
  after the page's own start, never after a return / a restart / a rebuild / a route change / a skew, and never outside the range (not
  clamped) — the range stays −80 … +120 ms. Two more causes found on the way: `pageshow` fires on EVERY load (it marked every fresh load
  "settling" — now only a back/forward-cache restore), and the context reporting no latency for a moment at its start flapped the output
  bucket (wired → unknown → wired) on every reload — 'unknown' never replaces a named output now.
- **PER OUTPUT** (`outputKey`, `readLeads`, `na:beatlead`): `bt` / `wired` / `unknown` (iOS reports nothing → the confirm-before-save
  rule is its guard); his poisoned `na:beatcal` +120 is dropped on the migration (only values inside the range move over).
- **THE TIME TO THE FIRST PUNCH** (Chromium, 402×660, a Saturday party — a git-excluded probe): a fresh load with nothing saved —
  c2-party4: punch (k > 0.5) at **0.1 s** (bar 0), FULL at 15.4 s (bar 8, 7 kicks); c2-party9 (his song): punch at 0.1 s, HALF the whole
  30 s (it never confirms — below); a reload with the saved lead — c2-party5: punch at **0.0 s**, full at 17.3 s (bar 7); a return
  (visible): the punch never stops (a settle = half, then full again). Before: his iPhone breathed until 24 kicks (party4), or the whole
  song (party9).
- **SEND REPORT + /admin** carry `beat:` + `beat lead:` + the last 40 events (load / song / settle + why / locked / saved / route), e.g.
  `0.0 s load unknown: saved null` · `2.5 s route unknown → wired` · `2.6 s song c2-party5` · `19.6 s locked after start (24 kicks)` ·
  `19.6 s saved wired 0 ms` · `21.3 s settle visible`.
- **THE KICK TABLE** (`tests/integration/kick-table.mjs "<browser>" [--deck party] [--songs …] [--shift id=beats]` — the listener's exact
  chain over each song, decoded in Chromium; `strong` = the kicks ≥ 0.6 the lead learns from; on beat / half-beat = their share within
  ±0.15 beat of the beat / of the half-beat; confirms = the learner's first confirmed bar from a cold start):

  | song | bpm | grid | agree | kicks a bar (strong) | on beat | half-beat | confirms at bar | confirmed bars |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | c2-party1 | 100 | trusted | 0.63 | 4.6 (4.0) | 0.75 | 0.08 | 2 | 72 / 85 |
  | c2-party2 | 117 | trusted | 0.90 | 3.4 (2.9) | 0.92 | 0.04 | 12 | 108 / 136 |
  | c2-party3 | 106.9 | **untrusted → trusted** | 0.19 → 0.72 | 4.0 (3.6) | 0.15 → **0.72** | 0.72 → 0.15 | 21 (at −250 ms) → **4** (+10 ms) | 45 → 65 / 90 |
  | c2-party4 | 125 | trusted | 0.71 | 4.1 (2.1) | 0.89 | 0.06 | 8 | 140 / 153 |
  | c2-party5 | 106 | trusted | 0.90 | 3.7 (3.2) | 0.92 | 0.05 | 8 | 56 / 75 |
  | c2-party6 | 111 | trusted | 0.82 | 4.2 (3.5) | 0.79 | 0.15 | 19 | 55 / 82 |
  | c2-party7 | 140 | trusted | 0.59 | 3.4 (3.1) | 0.78 | 0.04 | 13 | 81 / 132 |
  | c2-party8 | 140 | trusted | 0.85 | 3.3 (3.2) | 0.90 | 0.05 | 11 | 115 / 147 |
  | **c2-party9** | 100 | trusted (lock 5.46) | 0.33 | **8.5 (8.0)** | 0.33 | 0.08 | **never** (991 scattered) | 0 / 124 |
  | c2-80s-retro-synthwave (new, EVENING) | 110 | trusted | 0.57 | 4.7 (2.8) | 0.79 | 0.12 | 7 | 81 / 119 |

  **party9 reads 0 kicks** because the listener feeds the lead only from a grid whose kicks land on its beats (agree ≥ 0.5) — and its low
  end is a busy 16th-note bass line (8 hits a bar, a third on the beat, most between), no four-on-the-floor kick: no band or threshold
  separates a kick that isn't there. Not fixable in the listener; its grid is strongly locked (5.46), so it now punches HALF all song.
  **party3 FIXED**: 72 % of its kicks sat exactly on the HALF-BEAT — its grid's phase was half a beat off (M2 read "its kicks off the
  beat" and left it untrusted, so it BREATHED on party nights). Its t0 moved half a beat (0.485 → 0.204, a `phase` note in its grid;
  `add-city2-music.py --regrid` keeps a grid with a `phase` note): 72 % on the beat, the lead confirms by bar 4 at +10 ms, now TRUSTED.
- Checks: unit 874 (the rule's tests rewritten — half from bar 0, full when confirmed, half after a settle / a deaf song / the hold; the
  saved lead never after a return or clamped; per output; the old clamped value not migrated); e2e music + party 128/128 (+ A TRUSTED GRID
  PUNCHES FROM ITS FIRST BAR; the SYNC line with its output).

### Add-on — ONE NEW EVENING SONG (the owner, Oct 29 evening)
`~/Downloads/Grok/city-sfx/night-music/80s-retro-synthwave.mp3` COPIED (the original untouched) into `~/Downloads/evening/`, the importer
(`--dry-run`, then for real) → **`c2-80s-retro-synthwave`** (`audio/music/c2-80s-retro-synthwave.mp3`, **3.6 MB**, 4:19 after the silence
trim, −16 LUFS, 112 kbps) in the EVENING deck (now 14 songs, 50 min). Its grid: **110.004 BPM, TRUSTED** (lock 1.19, agree 0.57 — the
kick table: confirms at bar 7). The note beside the file said "the NIGHT category"; the owner's message said EVENING — EVENING it is.
Credit: ☰ → CREDITS → THE MUSIC: "80s Retro Synthwave — Playsound, Pixabay — Pixabay Content License". Checked: MUSIC MOOD → EVENING at
402×660 (the device's bag seeded so it's next): it plays (the element's time advancing, the graph sounding), the beat on its 110 grid.

### Group 2 — HALLOWEEN + PARTY SPEED (Saturday Oct 31 = both)
His iPhone (party mode on Oct 29 with the Halloween props): 14.5 % slow, frames to 100 ms, a tier step 2 → 1/2 → 2, 577 canvases / 60.5 MB.
Reproduced Saturday 10 pm at 402×660 (Chromium at 3×, 4× CPU, tier 1; title-perf's new `hw-party` + `hw-party-noprops` scenes):
- **HALLOWEEN's PROPS COST NOTHING MEASURABLE**: hw-party vs the same night without the props: +1.5 ms against a ±11.5 ms noise ("same").
- **THE PARTY IS THE WEIGHT**: a plain night vs Saturday's party: work 28.5 → 50.3 ms a frame (+21.8, SLOWER). The party is planned
  heavy (the show, the beams, the crowd, the window party). The CPU profile of the party frame (6 s at 4×): native drawing + raster
  ≈ 55 % (`drawImage` 10 %, `fill` 3 %, `(program)` 30 %), the people ≈ 6 % (folk.js), scene.js 5 %, the speakeasy 3 %, the spiders'
  legs 1 % — spread out, no single hot spot except the one below.
- **THE CANVAS COUNT — no leak**: a canvas census (every canvas by the module that made it, WeakRefs, a forced GC): ~450 live, flat over
  a minute, the GC frees none (all in use: the sign tubes 100, the sky beams ~90, clouds 52, the wheel 28, the bakes 20 = 23 MB…) — a plain
  night has ~250. **But a party night BUILT ~24 canvases a second** (2 178 in 58 s; a plain night: ~5 a minute): the sky beams' sprites
  (a 64 × 256 sprite + its foot for nearly every colour step of the party's sweeps — the 40-entry cache kept evicting), the clouds' beam
  glows (the same, 16 kept), the tubes, + the barber pole's halo RE-PAINTED pixel by pixel every frame (its colour followed the punch).
  **FIXED (quick)**: the beams + the clouds' glows in 12-level colour steps with room for 96 / 48 sprites (+ ~4 MB), the pole's halo in
  16-level steps → **the party builds ~3 canvases a second** (skybeams 262 → 16–24 in 30 s; clouds 42 → 28; the pole's halo and the
  beams' sprite work gone from the profile's top 30). Live canvases ~450 → ~595 (the bigger caches), 67 → 72 MB, inside the 160 MB budget.
- **A/B** (title-perf `--ab` vs 624158e on a worktree, 4× CPU, 402×660, tier 1): hw-party −1.3 ms, np-party −3.6 ms, np-night +9.8 ms
  (this code isn't on a plain night — the noise of 2 + 2 windows) — all "same" (noise ±10.6 … ±11.1 ms). On the laptop the churn was real
  but small; on an iPhone a new canvas + the garbage cost more (Safari) — the owner's readout (`&debug=1`) on Saturday says whether it
  shows. THE BASELINE GUARD: plain night 0.95×, the forced bus 0.98×, the forced dog walk 0.96×. e2e party + sky + the guard 35/35.
- **→ PERF** (written up, not done here): the party frame itself (+~22 ms at 4× over a plain night): `drawImage` count per frame (the
  beams' 2–4 draws each, the feet, the flares, the cloud patches, the window party's pools), the 100 sign-tube canvases, the crowd's
  rigs (folk.js 6 %); the tier step on his phone is the tiering doing its job under that load.

### Group 3 — THE CLOUD's FIREBASE CHECK (failed in both of NIGHT-A's cloud runs: 4–5 IndexedDB transactions in 15 s, < 3 wanted)
Not polling, and not ours: a RACE in the test. Firebase starts AFTER the title's first paint for a first-time visitor (app.js) — the SDK
from gstatic with a cold cache in every fresh test context — and its start writes once in a ~20 ms burst: 4 transactions on
`firebaseLocalStorageDb` (the auth persistence's availability probe + the migration check — `indexedDBLocalPersistence` is second in our
list) + 5 on `firebase-heartbeat-database` (the once-a-day heartbeat; 1 on a reused profile). Measured with a scratch probe on Chromium
(the runner's major version) against the emulators: fresh 9, reused 4, all inside ~20 ms, then 0 for 20–30 s; holding the SDK back 4 s
(the runner's pace) put the whole burst inside the window. Our code never touches IndexedDB. **The check now** waits for Firebase's start
(`state.ready` — set on a sign-in AND on a failure) and counts the AUTH store only (the one polling would hit; every database's count in the
message): laptop **0** (`core` 18/18).

### The side test — A BLENDER STILL vs TODAY's BAKE (the owner's add-on; nothing shipped, nothing committed)
Blender 4.5 LTS (portable, outside the repo) rendered the harvest model in Cycles with the bake's exact camera (the shifted lens) + lights
(the warm key, the floods' rim, the 25 bulbs as point lights, the sky ambient, the violet glow): silhouette overlap 0.9989 with
night.png; ~40 s a still on 4 CPU threads (256 samples + denoise). Three stills at 402×660 (DRAWN / TODAY'S BAKE / BLENDER — the Blender
sprite swapped in by request interception) sent to the owner. One deviation: the bake puts the bottom swag's bulbs INSIDE the bottom bale
(fine in three.js, no shadows) — in Cycles they had to sit on the visible surface. It could become an option in scripts/bake-model.mjs
(`blender -b -P <recipe>.py`; ~0.9 GB install outside the repo, ~2–3 min a day / gold / night bake; the bakes stay committed, never
re-baked on CI).

### Decisions
- The new night light is the default; the old light's own checks keep running under `&light=old` / an OLD pin in their unit file.
- The mirror door: all three of its sounds removed (the creak, the bar through it, the thud) — the street can't hear inside the barbershop.
  The other inside-a-window sounds are listed above and kept (the scissors' snips are the one to drop next if the owner agrees).
- The standing props: ONE guard where every visit reaches the frame (not a fix per planner) — a detoured leg keeps its timing (a little
  quicker), so doors, buses and the crowd's counts stay as planned.
- The beat: the saved range stays −80 … +120 ms (the +156 was a post-restart shift, not the speaker's value); a lead is saved only after
  the page's own start; a NAMED output (Chrome's outputLatency) learns its own value after a route change, 'unknown' (iOS) never saves a
  lead learned after a change.
- party3's grid moved half a beat (its kicks say so: 72 % on the half-beat) and is trusted now — **the owner should listen once**: the
  lights should now punch WITH its kick drum. A `phase` note in its grid keeps `--regrid` from undoing it.
- party9 stays as it is: a song with no kick to hear punches at half strength on its strongly-locked grid.
- Saturday's speed: only the quick churn fix here; the party frame's real cost goes to PERF.
- The new song is in EVENING (the owner's message), not "NIGHT" (the note beside the file).

### Known issues
- The +156 ms can't be reproduced off an iPhone; the next SEND REPORT from his phone carries the lead's whole history (`beat lead:`).
- headless Chromium reports a ~140 ms output (its fake device) → the `bt` bucket in tests; harmless (a bucket is only a storage key).
- The party frame is still ~+22 ms over a plain night at 4× on the laptop (PERF); the churn fix's effect on the iPhone is unmeasured here.
- LOAD WEATHER's known flake (NIGHT-A) stays listed.

### Handoff → NIGHT-B (THE STREET PARTY)
- Every new holiday or party piece that STANDS on the floor registers its footprint in `standingFootprints` (the harvest display's
  pattern) — the crowd, the dancers, the conga line route round it automatically (`aroundSolids`); the cab-stand bench's dancers are the
  exception NIGHT-B builds on purpose.
- The crowd's sounds + the dance breaks will sit on a beat that always punches now: a dance break can start on the song's first bar.
- Saturday's measurement scenes are in title-perf (`hw-party`, `hw-party-noprops`); the canvas census + the profile probes are scratch
  (`tests/integration/_probe-canvases.mjs`, `_probe-prof.mjs`, git-excluded) — re-create them from this log if gone.
