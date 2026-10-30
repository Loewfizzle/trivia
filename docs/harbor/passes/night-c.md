# NIGHT-C — THE HELICOPTER, THE ROOF SIGNS, THE QUIET BUILDING (Oct 30 2026; plan.md "OWNER'S NOTES — OCT 29 (late)" + "OCT 30 (after midnight)"; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md). The current decisions: [decisions.md](../decisions.md).

The night finished: the stage light on by default + a real zebra crossing; the party song in sync on every phone (the dance breaks start on
the song each phone hears); the helicopter (its patrol + up for every dance break); the roof signs at 3×; the quiet building (the parked
windows) + the live windows at 3×. Not here: the legends + the shadowboxer's room (SKY — discussed with the owner first); the Halloween +
dance-break slowdown (PERF); the fireworks (Part 10); the lanterns (a future idea).

### Step 0 (68e2fa6)
The owner's notes appended to plan.md as "OWNER'S NOTES — OCT 30 (after midnight)"; decisions.md updated (the stage light ON, the same party
song on every phone, Veterans Day skipped this year, the lanterns as a future idea, Halloween's party break → PERF's list); the build table:
NIGHT-B ✅ (9c9e813), NIGHT-C ← NEXT.

### Group 0 — the stage light ON + A REAL ZEBRA (db2ef3e)
- **THE STAGE LIGHT ON BY DEFAULT** (`core/harbor-light.js#STAGE_DEFAULT`): `&stage=0` + a new TOOLS row THE STAGE LIGHT · OFF for A/B (the
  ON row + `&stage=1` kept). The tests follow the default (the ladder at 3× on the default path; the street-vs-promenade check vs `&stage=0`).
- **A REAL ZEBRA** (`screens/harbor/road.js#zebraBars`, the owner's iPhone close-up: ~8 thin stripes read as one grey block): FIVE wide bars,
  each as deep as its dark gap (9 equal slots), stopping short of both kerbs (0.45 u from the curb, 1.3 u from the far side — clear of the
  far kerb's granite). The crossing's light layer now feathers its POOLS only: the stripes' lift is drawn after the mask, so the end bars
  light like the middle ones (the first try: the outer two read dim). Contrast kept: bars 183 vs gaps 37 (× 4.96), the brightest 214.
  Looked at 390 / 402 / 430 — day, night, wet. e2e `people`: A REAL ZEBRA (five peaks, each gap ½–2× a bar; it fails on the old crossing).

### Group 1 — THE PARTY SONG IN SYNC (0525f30) — docs/audio.md#the-party-song-in-sync
- `core/party-deck.js` (PURE): the PARTY deck as one timeline — seeded shuffle cycles, back to back with the crossfade, from an anchor (a
  party night's 8 pm seeded by the evening; the force moment for `&force=dance`; a fixed epoch for the panel's PARTY); found at any time in O(n).
- `audio/party-music.js`: the timeline on the SERVER clock through the synced-songs player (the lobby's); this phone's own player starts the
  timeline's song AT ITS PLACE too (app.js's mood provider), rides along within 0.12 s, else the synced player joins (0.35 s on the same
  song); a late joiner lands mid-song; a dead / frozen graph (iOS) and a TR-3B's tape stop hand the song back to this phone's own player at
  its place; the city's dips + its low-pass reach the synced voices.
- **The live city runs on the server clock** (`core/sky.js#setRealNow(serverNow)` — the saved offset while parked, no socket).
- **The dance breaks on the heard song**: `core/harbor-streetparty.js#partyTimeline` + danceBreaks / forcedBreaks plan on the deck's REAL songs
  (one song = one break; fast = its tempo ≥ `fastBpm`); `&force=dance` = a fresh deck from the force moment, a break on its first song (6 s
  in), then on the first song starting 5 min after the last began + a mingling gap after it ended; the reveal waits for the songs.
- `synced-songs.js` fix (the lobby's too): a song queued to start later no longer reports as sounding (its gain read 1 before its first
  scheduled value — the beat followed the wrong song). The beat follows the synced song (`beat.js`: lobby || party).
- The &debug=1 readout: `party NIGHT · c2-party4 1:23 / 4:53 · SYNCED (server clock) · next in 3:30 · break CONGA (this song)`.
- Saturday Oct 24's conga moved to **22:05:41** (the real songs' lengths): e2e `streetparty`, title-perf `sp-break`, the bench's `party-break`.
- e2e `partysync` 8/8: each phone within ~41–50 ms of the timeline, the break on the heard song (0.2–1.0 s into it as the level rises),
  three live phones + a late joiner (15 s later) within 13–48 ms of each other. The music group 119/119 (its direct-path checks with
  `&force=no-party-sync`: they drive this phone's own player).

### Group 2 — THE HELICOPTER (f138222)
- `core/harbor-heli.js` (PURE): THE PATROL — hourly from dusk → ~2 am (a seeded minute; Tue Oct 27: 19:36 … 1:31), every 2–3 h by day (8:53,
  10:54, 13:07, 15:54) — every phone the same; never near tonight's legendary (`legendWindow`), never over a dance break; the sky scheduler
  flies it in exactly its slot (a new `timed` rarity: the sky-low lane stays exclusive); skipped in a storm / wind ≥ 14. A 2-min look over the
  harbor, its searchlight sweeping the water — on a party night in the party's colours, swept ON THE BEAT (a smooth swing, no strobe; the
  beacon at its slow pace).
- UP FOR EVERY DANCE BREAK: in from a side (over the crowd as the song starts), hovering the whole song, off the other side (a patrol up at the
  time flies over from where it is). Drawn after the people (`air.js#breakDraw` via `skyfx.heliBreak`): a searchlight cone + a bright pool
  on the floor swept across the dancers on the beat (a turn each 8 beats, a slow drift back ↔ front), the party colour cross-faded bar to
  bar; the light stops at the dock's top. Its sound: the existing helicopter slot. THE TIER TABLE: `heliBeam` 1 / 2 / 3. TOOLS → NO BREAK
  HELICOPTER. Refine 1: the beam read too faint at phone size → a narrower, brighter cone + a bright pool.
- e2e `heli` 6/6.

### Group 3 — THE ROOF SIGNS AT 3× (f4946dd)
- The two tower roof signs on the crisp layer at the phone's full dpr: the housing (cabinet + frame + stand — `signs.js#drawHousing`, the
  bake's own drawing; the beacon's post above the cabinet stays the city's) + the LIGHT at full-dpr sprites, added like the city's own neon
  (CSS `plus-lighter`). **neon.js's per-item drawing is ONE function now (`drawOne` — a mechanical move)** the city and the crisp copy both
  run, so every effect routes through (modes, a burnt-out letter, the restart flicker, the party's punch + colours, the spelling dim, the
  spill); the city's copy fades as the crisp one rises (additive — never a pop).
- The tower's neon crown line stays IN FRONT of the crisp stand (the first look covered it: it is added again over the stand's own pixels,
  masked by the housing).
- THE WHOLE-SKY RULE: the crisp copy YIELDS to the city's (a crossfade) while rain / snow, fog, a storm, a legendary (the drain + the
  blackout), the drone show, or a helicopter / its beam is in front. Tier ≥ 1 (`roofCrisp`). TOOLS → ROOF SIGNS SOFT.
- e2e `roofcrisp` 3/3: both at 3.00×, the luma over each sign 82 / 116 vs the city's own 84 / 112, rain → the city's copy; e2e `light` 7/7.

### Group 4 — THE QUIET BUILDING + the live windows at 3× (f648e73)
- `core/harbor-moments.js#parkedNight / parkedLevel` + THE CITY TIMETABLE's `windows.parked` (a DARKNESS row): at night, not on a party
  evening, the bar, the jazz room + the upper middle (`back` — the shadowboxer's, SKY) are PARKED: the blind rolls down (the blind cycle) as
  the rooms' night begins, a seeded mix of 1–2 warm-lit behind it (never all dark, never all lit), each lit lamp clicking off one by one
  between 10:15 pm and 1:30 am. Their moments sleep — the holidays' scenes too (Halloween week's costume party ran every ~45 s through the
  blind: not a quiet building); the sill pieces stay; the tango skips them; the routines keep their hour. The panel's WINDOWS rows still
  play every moment (a preview). Party nights + the day unchanged. TOOLS → THE BUSY BUILDING (A/B).
- THE LIVE WINDOWS AT 3× (`speakeasy.js#drawWindow` → `windows.js#draw` with `env.only` / `env.skip`): at night the boss's TV room + the two
  side rooms on the crisp layer (the same painters), the city skipping each once its copy covers it; they yield on rain on the glass, a
  raid, a legendary, the Christmas strings, a worker at the facade. Tier ≥ 1 (`liveWin3x`). TOOLS → LIVE WINDOWS SOFT.
- e2e `quietbuilding` 8/8 (parked + 2 of 3 lit, no moment in a parked room for 12 s, lit blinds 137–139 vs a dark one 33, all out by 1:40,
  a party night + the day unchanged, Monday 8 pm's upper middle parked, the live windows at 3×); `windows`: WIN3's quiet night now sees DARK
  BLINDS in the parked rooms (luma ~32 — the threshold < 40 there), its normal night the parked rooms.

### Group 5 — the speed + the end
- **THE BASELINE GUARD** (`PERF_GUARD=only ONLY=perf`): a plain night 0.39×, the forced bus 0.46×, the dog walk 0.42× (≤ 2×) — no re-write.
- **Memory at 3×** (a plain Tuesday night, 402×874): the tracked canvases 59.1 → 62.2 MB (+3.1), 207 → 228 canvases; the crisp overlays
  0.65 → 1.51 MB. The guard's budgets (64 / 96 / 160 MB) untouched.
- **title-perf `--ab`** vs 68e2fa6 (the code before this pass, a worktree on :5174), 402×660, 4× CPU, tier 1 (relative only — the laptop is
  ~3× a phone; the scenes at the phone's 3×, so B includes both crisp layers):
  a plain Tuesday night `nc-night` **same** (work −9.7 ms ± 20.9 — the quiet building draws less), the party peak `sp-peak` **same**
  (−2.5 ms ± 6.4), a forced dance break WITH the helicopter `nc-break` **same** (−2.3 ms ± 5.9; the older build's break has no helicopter).
- THE PHONE BENCH: its `party-break` scene (Sat 10:06 pm) is now the conga break WITH the helicopter over it (the scene's time moved with
  the real songs).

### Decisions (this pass)
- **Two players, one song**: the party song plays through the synced player (sample-accurate) but this phone's own player follows the same
  timeline, so a dead graph, a locked context or a TR-3B's tape stop never makes a phone play ANOTHER song — only a less exact one.
- **The live city runs on the server clock** (the saved offset — no socket): the breaks + the music agree on every phone.
- **`&force=dance`** plays its own deck from the force moment (the old "a break every 5 min" became "on the first song 5 min after the last
  began + a gap": about every other song).
- **The quiet building parks the holidays' window scenes too** (on non-party nights) — the owner's "every other window parked"; the
  barbershop's window (street level) is not one of the building's windows and is unchanged.
- **The crisp layers yield** (rain, fog, a legendary, the drones, the helicopter, a raid…) rather than trying to draw what passes in front:
  the sign / window is the city's soft copy for those moments, never covered wrongly.

### Known issues
- The direct-path music checks run with the sync off; the sync's own yield on a dead graph is reasoned + unit-free (its trigger is the
  engine's frozen clock) — the iPhone after a lock screen is the real check.
- A bird / a Halloween bat crossing a crisp roof sign or a live window would pass BEHIND it for that moment (rare; not seen).
- The break helicopter's beam crosses the SIGNAL blade on some nights (soft light, by design).
- THE CLOUD, run 1 (`gh workflow run harbor` on c5dd391 — the tagged push held only docs, so the path filter skipped it): 7 of 8 jobs green;
  `perf` red on (1) partysync — a phone whose own player started within 0.12 s of the timeline RODE along and the test only accepted the
  synced player → FIXED: the ride now needs ≤ 0.05 s, is decided ONCE a song (an element's jitter flipped it, which could have restarted the
  phone's own player under the synced one), never once the synced player sounds; the test accepts a riding phone; the music group's SONG
  CLOCK checks run with `&force=no-party-sync` (they drive the element); (2) MEMORY — 20 title↔setup cycles: heap +6.3 MB vs the 6 MB limit.
  NIGHT-B's cloud runs measured +5.1 and +5.9; the same machine, the same run: the old build +4.8, this one +5.0 MB — the check sits at
  its limit (noise), not a leak; left as it is.
- THE CLOUD, run 2 (2f037ba — the ride fix): tests GREEN; harbor 7 of 8 green (perf now green: partysync + the memory check); `windows`
  red on ONE check: 9c's crisp items by day listed exactly blade-board / datestone / roofboard (+ the benches) — the roof signs' two new
  items (rs-body / rs-lit, by design) weren't in its list → the expectation updated (a test-only commit after the cap: e2e snow + blackout
  30/30 locally). The two-run cap reached — not re-run in the cloud.
- No Java on the laptop: the smoke test + the rules + /api suites (a shared file touched: app.js, music.js, synced-songs.js, sky.js) run in
  the cloud's tests workflow on the final push only.
- e2e THE DOG's TURN (one frame at 11.0–11.2 vs ≤ 11 u/s) fails on the laptop — the same on 68e2fa6 (a timing flake, not this pass).
- To judge on the iPhone: the party song's ride tolerance (0.12 s) on Bluetooth; `plus-lighter` on iOS Safari (15.4+); the helicopter's beam
  strength unzoomed.

### Handoff → SKY (discussed with the owner first)
The shadowboxer's room is `back` (the upper middle) — PARKED today (`core/harbor-moments.js#PARKED_ROOMS`): SKY makes it LIVE while he
trains (drop it from the parked set for his hours; its blind going UP is his entrance — the windows.js parked blind eases) and adds it to
the live windows at 3× (`LIVE_ROOMS` / `liveWinCrisp`). The legends' timetable rows go in core/harbor-schedule.js; the helicopter's patrol
already keeps clear of tonight's legendary (`legendWindow`).
