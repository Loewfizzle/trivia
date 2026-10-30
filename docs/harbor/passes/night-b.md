# NIGHT-B — THE STREET PARTY (Oct 29 2026; plan.md "OWNER'S NOTES — OCT 29 (the afternoon)" + "(the evening)" + "(late)"; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md). The current decisions: [decisions.md](../decisions.md).

The party night becomes a real street party — the crowd all night, the dance breaks, the big conga, dancers in the street + on the bench,
the crowd's sounds — on a tidied codebase with THE TIER TABLE, THE CITY TIMETABLE and THE SOLIDS, under THE STAGE LIGHT (behind a switch).
Not here: the helicopter, the roof signs at 3×, the quiet building (NIGHT-C, next); the fireworks (Part 10); the legends + the boxer (SKY).

### Step 0
The owner's notes appended to plan.md as "OWNER'S NOTES — OCT 29 (late)"; the build table: NIGHT-A2 ✅ (bb00ff2), NIGHT-B ← NEXT, NIGHT-C
added, FR5 before PERF, DESKTOP + SWITCH-OVER split out of 12, 11c moved to the end; the order line under the table (699ed5a).

### Group 0 — THE TIDY-UP + THE SOLIDS (a9ba245)
- **e2e-harbor.mjs SPLIT** (484 KB, one file): `tests/integration/e2e-harbor.mjs` is now the entry + runner (the same CLI + env: `JOB=`,
  `ONLY=`, the shards — harbor.yml unchanged but one `paths:` line), `harbor-e2e/kit.mjs` the shared helpers + state + `G`, and one file
  per cloud job (`harbor-e2e/audio|show|city|perf|street|windows|wild|holiday.mjs`). Done by a script that copied every top-level
  statement verbatim (acorn); a static proof against HEAD: the same 36 groups, 42 bodies byte-identical in order, the same check calls
  (534 ok · 29 okT · 4 okF · 3 skipCI). Real runs: flags + dock 8/8, the perf guard 3/3, JOB=audio started. ADDING A GROUP: its `G()` in
  its job's file + the name in `harbor-jobs.mjs` (tests/harbor-jobs.test.mjs reads every file).
- **docs/harbor/decisions.md** — NEW (42 KB): the CURRENT decisions in 17 sections (superseded notes left out, each bullet sourced);
  plan.md stays the archive (its header points to decisions.md). From now on Step 0 appends to plan.md AND updates decisions.md.
- **CLAUDE.md TRIMMED** 40 → 37 KB, nothing lost — MOVED, verbatim, to docs/harbor.md#city-20-in-claudemd--the-full-text: the ground
  rules' City 2.0 bullets (`&debug=1`, a legendary from a link, `&dpr=3` + `&bench=1`, the memory, the standing-rules paragraph) → one
  line per rule + a pointer; the testing bullets THE HARBOR IN THE CLOUD + THE BASELINE GUARD → shorter; the docs table's harbor row
  (+ a decisions.md row); the audio paragraph's CITY 2.0 MUSIC sentence; the file layout's seven Harbor lines → one line + the file map.
- **THE SOLIDS** (`core/harbor-solids.js` — the owner's walker through the chestnut cart): ONE registry — both benches (their sitters +
  the bench dancers excepted), the two trunks, the hydrant (a smaller pad: the dog sniffs it), the crossing's two poles, THE CART (parked:
  its body + handles + the cider board — the drawn body reaches ~1 u deeper than the walkers' map had it: THAT was the clip; rolling: its
  corridor, so people step aside), every holiday piece (standingFootprints), the street party's pockets (time-windowed). `aroundSolids`
  bends EVERY visit as it reaches the frame: per leg, only the solids whose window overlaps it; never into a closed circle; never round
  the cart's front corners (under the dock); the walkers' own map's furniture kept in the detour (a detour round one piece never cuts
  through another), a stop squeezed between two pieces moved ring by ring to the nearest free spot; a partner's clamp under the dock now
  happens BEFORE the pull-in (it used to undo it). Not solid: the pumpkins on the speakeasy's steps (they flank the door — the guests pass
  between them, NIGHT-A2's call kept). **The test** (`tests/harbor-solids.test.mjs`): a plain October evening with the cart, a party night,
  Halloween's party, a Thanksgiving build-up evening with the cider board, 1 h each at 390 / 402×660 / 430: nobody's drawn body (a body's
  0.2 u) inside any base.
- **"wired"** → the sync line says `speaker/wired (short)` / `wireless? (long)` / `output unknown` (`core/harbor-beat.js#outputLabel`): the
  bucket is only the reported latency; the saved key (`wired` / `bt` / `unknown`) unchanged.
- pixdiff (night / party / Halloween at 402×660 vs 699ed5a): 0.01–0.07 % of the pixels beyond the noise, all people's paths near the door.

### Group 1 — THE TABLES (1997f28, with Group 2's first cut)
- **THE CITY TIMETABLE** (`core/harbor-schedule.js`): every timed thing a row — id, its TRIGGER (clock / calendar / darkness / beat /
  event), status (live / planned), where it lives, its knobs (only clock + calendar rows have times to tune) + its conflicts. This pass's
  rows: `party.night`, `party.crowd` (warm 20:30 → full 21:45, thin 1:00 → gone 2:00), `party.songs`, `party.break` (21:00 → 1:24, every 20
  min ± 3, ≥ 12 apart), `party.break.force`, `party.spill` (the hold: 14 s before → 16 s after), `party.bench`, `party.conga`, `cart.party`
  (packs up by 20:24), `party.fireworks` (planned, Part 10), `rosie.bell` (FIXED at :00); the rest of the city as rows pointing at their
  modules (the lamps, the windows at dusk, the signs' modes, the pulse, the holidays, the workers, the sky, the helicopter's patrol
  (NIGHT-C), the boxer (SKY), the legendaries, the blackout, the raid). **THE CONFLICTS** in one table (the legendaries × traffic, a break ×
  the front street, a break × the cab stand, the raid / a legendary × a break, the helicopter up for every break, fireworks × a storm, the
  boxer × the window party). `timetableText()` = the whole day readable. The older systems migrate at SCHED.
- **THE TIER TABLE** (`core/harbor-tiers.js`, t0 / t1 / t2): walkers 6 / 9 / 12 (core/harbor-people.js#TIER_CAP reads it), pockets 3 / 5
  / 8, conga 6 / 12 / 20, benchDancers 1 / 2 / 3, spill 2 / 4 / 7, crowdVoices 1 / 3 / 5, crowdBeds 1 / 2 / 2. The plan is the tier-2
  plan everywhere; a tier decides what's DRAWN (whole pockets by rank, the line's first n). The older systems migrate in PERF.
- `tests/harbor-tables.test.mjs`: every row valid; the new code (harbor-streetparty.js) imports both and has no `N * 3600`, no hour
  compared with a literal, no `tier === n`, no `[a, b, c]` triplet of its own.

### Group 2 — THE STREET PARTY (1997f28)
`core/harbor-streetparty.js` (pure, seeded by the evening: every phone the same, joined mid-way the same), wired into `folkAt`:
- **THE CROWD ALL PARTY NIGHT**: POCKETS of every size by rank — pair, small, loner, big, small, big, pair, small (tier 0 draws a pair,
  a small group + a loner) — placed per night from a candidate grid, ranks alternating the floor's FRONT half (nearer, bigger: the first
  look put them all at the back) and its back, the farthest of six picks, a walking gap between any two, clear of the side door's landing
  + its swing + the approach, THE LINE, the speakeasy's face, the crossing's landing, the cab bench + its front, every solid, a
  centrepiece. Each pocket opens as the crowd's curve passes its threshold (rank by rank, slot by slot), and is a SOLID while it stands
  (the walkers thread between them — the test: a way left ↔ right at the front, the middle + the back). Each slot's OCCUPANTS change on
  tenures (5.5–15 min): the next walks in off a screen edge as the last walks off the other way (THE PEOPLE RULE). Mingling (folk.js
  `mingle`): each person's own cycle of TALKING (the near hand gesturing, big), LISTENING (hands on hips, a nod), a LAUGH with the head
  back (the shoulders shaking), a SIP (a drinker's glass up), the weight shifting from leg to leg; ~55 % hold a drink. The everyday crowd
  eases back while the pockets stand (`MOOD.streetCut` 0.5 — the walkers passing through stay).
- **THE DANCE BREAKS** on THE PARTY's OWN SONG CLOCK (seeded songs back to back from 8 pm, 3:05–4:10 each): aimed every 20 min (± 3) from
  21:00, each the first party song starting at its aim, ONE song long, never the same kind twice, none while a raid / a legendary blocks
  it. Each phone plays its own music (the mood decks' bags are per device), so a break can't start on every phone's heard song at once:
  the break keeps the shared clock (every phone the same), the MOVES lock to whatever beat the phone plays (wands.js on the beat grid; a
  gap in the phone's music idles them). The kinds (`wands.js#KIND_SETS`): THE BOUNCE (fist pumps + a HOP landing on every beat), WANDS UP
  (overhead sways + waves), SWING PAIRS (the slots paired off, twirling round each other a turn every 8 beats + the spin), THE CONGA, A
  MIX (swing pairs + the conga). In a break almost everyone in the pockets dances (the rig blends mingle ↔ dance over a third of a second
  — the legs carry it, no snap), a CHEER (both arms up) for its first 2 s. Saturday Oct 24: 14 breaks (mix · bounce · conga · wands · mix ·
  swing · wands · mix · bounce · swing · conga · mix · swing · mix).
- **THE BIG CONGA**: 20 in off the RIGHT edge on the back lane, a U-turn down to the middle lane going right, another to the front lane,
  off the LEFT edge (in front of THE LINE) — each lane routed round the pockets standing then + the solids + the furniture, corner-cut
  twice into a snake; one gap (0.92 u) apart at a conga step (0.82 u/s): ~2.5 min across. One hand forward on the shoulder in front, the
  other UP waving its wand (one wand each); the line keeps ONE path (no per-person detours).
- **INTO THE STREET**: 7 in along the front strip from the nearer edge, down off the curb to their places across the street's upper band
  (z 33.9–35), dancing the break's moves, back up + off before the cars return; the FRONT STREET HOLDS (scene.js#frontHoldNow — the
  timetable's `party.break × traffic.front`: the passing car + the cab stand's taxi don't start). The dock's glass a touch darker behind
  JOIN, HOST + the pill while they're there (body.nd-spill, an opacity fade); the dock at rest shows them fully.
- **DANCERS ON THE BENCH**: three in off the right edge to the cab stand's bench, a step UP onto its seat (y 0.6), wands up, a hop DOWN as
  the song ends, off the right; the cab stand pauses (no waiter sits down in a break).
- **THE CART PACKS UP** by 20:24 on a party night (any other night 21:30 ± 11 min).
- **THE OLD CIRCLE RETIRED**: the party nights' hourly circle is gone from folkAt (the breaks replace it); `&force=circle` keeps it as a
  preview (TOOLS: THE OLD DANCE CIRCLE); `&force=dance` = the street party + a break every 5 min, the kinds in turn; `&dance=` picks one.
- Halloween's party: the pockets, the conga, the spill + the bench come in costume (folkAt's HWK).
- Checks: `tests/harbor-streetparty.test.mjs` (the curve; the breaks — on a song's start, one song, kinds, the same on every phone, none on
  a Thursday, none blocked; the pockets at 390 / 402×660 / 430 — the mix, clear of every zone, spread, a way through; a whole Saturday —
  THE PEOPLE RULE for every street-party visit, the conga in off the right + off the left, mostly mingling, ≥ 85 % dancing in a break, the
  street + the bench only in a break, the cart packed before the warm-up, the cab stand paused; joined mid-way = the same; tier 0 < 1 < 2
  and the same people per tier; a planned frame's median cost < 3 ms). The older tests updated where they counted "everyone" (POLISH 4's
  counts: the everyday crowd 5–12 on a party night + the pockets 16–28 on top; 8P: the spill + the bench's exceptions; FP3b + 11a-2: the
  circle driven by `forceCircle`). e2e `streetparty` (the city job).

### Group 3 — THE CROWD's SOUNDS (c22fa75)
docs/audio.md#the-street-partys-crowd: 2 beds + 13 one-shots, 1.1 MB; the files used, the ones left out + why; the mix; ☰ → CREDITS →
SOUND EFFECTS (15 lines). e2e: the walla sounding + a one-shot after the first tap.

### Group 4 — THE STAGE LIGHT + THE PARTY DIM (3302d00) — behind `&stage=1|0` + TOOLS → THE STAGE LIGHT · ON (OFF by default)
- `core/harbor-light.js#washAt` (+ `STAGE`, `setStageMode`): the promenade keeps its wash; the street under the dock no longer warms toward
  the screen's foot — the front's wash carried across the curb, a little less toward the viewer. First try (street 0.6 / foot 0.5) read
  HALF the promenade's front on the screen — too dark; now 1.0 / 0.88: the street ~⅓ darker (luma 0.62–0.64 of the promenade's front at
  402×660; ×0.71 against today's light), never black, no step at the curb (unit: < 0.01 between points 0.05 u apart), wet reflections kept.
  Every painter reads washAt; a switch re-bakes the stage (bakeParts' light key).
- THE PARTY DIM (with the stage on): the wash −12 % + the street another −16 % × the crowd's curve — a cached gradient over the ground
  (32 steps), never a re-bake.
- The vehicles' lamps: every vehicle already lights its head + tail lamps at night (motorcar.js, vehicles.js, bus.js) — they glow on the
  darker street unchanged.
- Checks: unit (the curve); e2e `light` + THE STAGE LIGHT's ladder at 3× (night + party: the neon still the brightest); e2e `streetparty`
  (the street ×0.71 of today's against the promenade's front, luma 43 — never black).

### Group 5 — the speed + the end
- **THE BASELINE GUARD** (`PERF_GUARD=only ONLY=perf`): a plain night 0.45×, the forced bus 0.41×, the forced dog walk 0.50× (≤ 2×) — no
  re-write (none of its scenes has a street party).
- **title-perf `--ab`** vs 699ed5a (the commit before NIGHT-B, a worktree on :5174), 402×660, 4× CPU, tier 1 (the laptop's absolute
  numbers are ~3× a phone's — relative only): a plain night **same** (+0.5 ms ± 2.6); the street party's peak, mingling (`sp-peak`)
  **same** (+2.9 ms ± 4.8); THE CONGA BREAK (`sp-break`: the pockets bouncing + the 12-strong conga at tier 1 + the spill + the bench —
  the heaviest moment, ~twice the people the old circle drew) **+15 ms** first, **+8.9 ms** (± 1.9) after the street dancers' wand
  TRAILS went to tier 2 only (the frame p95 the same, 83 ms both); the rest is the figures themselves. On the iPhone 16 Pro (≈ ⅓ of the
  laptop's 4× numbers) that's ~+3 ms for the length of a conga break; a weaker phone steps its tier down (tier 1 draws 12 of the conga, 5
  of the pockets; tier 0 6 + 3).
- **THE PHONE BENCH** gets a 7th scene, `party-break` (the conga break ~40 s in) — the owner's `&bench=1` run on the iPhone is the judge
  (e2e bench 4/4). PERF (after Part 10) owns the rest: the tier table's numbers are its knobs.

### Decisions (this pass)
- **The breaks keep a SHARED party song clock**, not each phone's heard song (the phones' songs differ): every phone sees the same break at
  the same moment; the moves follow the phone's own beat. To make them start on the HEARD song everywhere, the party deck would have to
  play on the server clock (every phone the same song) — the owner's call (asked below).
- **The old hourly circle is retired** (not deleted: `&force=circle`).
- **The pockets fill the floor's middle + right**: the left half is the door, its approach + THE LINE (the owner's 4:02 pm shot: everything
  piled up there). The conga leaves by the left in front of THE LINE.
- **Not listen-checked**: the sounds were chosen by measurement (loudness envelopes) — the group takes first to judge by ear.
- **The stage light stays OFF** until the owner picks.

### Known issues
- The spill's dancers stand mostly UNDER the dock's glass (the street's upper band is behind its top edge at every phone size — only
  their heads + wands show above it, more when the dock rests); the darker glass keeps JOIN + HOST readable.
- A big break at tier 2 draws ~55 people (the pockets ~22 + the conga 20 + the spill 7 + the bench 3 + the walkers) — the frame cost:
  Group 5's numbers; the iPhone's readout on Saturday is the judge.
- The party's song clock vs the phone's song: a break may begin mid-song on a phone (see Decisions).
- e2e `holiday` on the laptop: ITS NERVES ("calm again within 18 s") fails here — the SAME on 699ed5a (the commit before this pass, served
  from a worktree): not this pass's code; the cloud run is the judge.
- The retired circle's preview (`&force=circle`) keeps its dancers on their own ring (`solidsOk`): with the giant up + the cart parked one
  stands in the cart's footprint, as before THE SOLIDS (the giant is off since C4b).

### Handoff → NIGHT-C
THE HELICOPTER: its patrol + its dance-break role register in THE CITY TIMETABLE (`helicopter.patrol` is a planned row; `party.break`'s
conflicts list it) — the breaks are `danceBreaks(day0, key)` / `forcedBreaks` (core/harbor-streetparty.js); the beam over the crowd can
read `people.party()` (the break, its level) + the pockets' positions. THE ROOF SIGNS AT 3× + THE QUIET BUILDING: untouched here.
