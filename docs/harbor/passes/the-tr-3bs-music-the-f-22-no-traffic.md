# THE TR-3B's MUSIC, THE F-22, NO TRAFFIC (Oct 25 2026; the owner's Oct 25 notes part 2 — plan.md; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## THE TR-3B's MUSIC, THE F-22, NO TRAFFIC (Oct 25 2026; the owner's Oct 25 notes part 2 — plan.md; behind `?city=2`)

### 1. THE TR-3B's MUSIC — THE TAPE STOP IN WEB AUDIO (`audio/tape-stop.js`, `core/mp3-slice.js`, `core/tape-math.js`; `audio/music.js`, `audio/diag.js`, `core/harbor-legend.js#DRAIN_M`, `sounds.js#legendSounds`)
- **The evidence read**: with 8b2's raised floor live the panel still read NOT SOUNDING, the song clock still, 13 reloads failing; with the
  TR-3B off it was sounding. The music system was healthy — THE BEND ALONE killed the song: iOS Safari stalls a media element whose
  `playbackRate` changes (a reload keeps the bent rate, so every heal stalled too). The element's rate is never touched again.
- **Now**: as the craft arrives the song's next ~42 s are decoded from the file's own MP3 frames (placed to one frame) into a buffer; the
  first bend crossfades an AudioBufferSourceNode in at the element's exact song time and pauses the element; the SOURCE's rate ramps
  (speed + pitch together) to ~0.5 × (`DRAIN_M.rate` 0.5 — no iOS floor on a buffer), a wow + a flutter from two oscillators on the rate
  (`DRAIN_M.wow` 0.025, `flutter` 0.008 — `tr3bAt().music` gives the base `rate` + the depths), a light duck (0.72) + a partial low-pass
  (2.2 kHz); after the jets the rate ramps back, the element is seeked to where the tape got to, played, seen moving, faded back in. A
  watchdog reloads an element that doesn't move within 1 s; a frozen graph / the page hidden / a new song abort cleanly. Full detail:
  docs/audio.md#the-tape-stop-in-web-audio.
- **What the AUDIO panel shows**: `sounding` throughout; the el row `ON THE TAPE 0.50× (bent) · song 97.3 ▲ · behind 12 s · el paused`,
  then `el playing · tape 1 run`; the events `tape ready / on / off`, `tape watchdog … loaded again` if iOS stalled the element.

### 2. THE F-22 (`jets.js` — one shared jet: the chase, the air show, the missing man, the surprise flyby)
- The owner: the F-16s "look too cartoonish". ONE F-22 Raptor-style stealth fighter, realism from SILHOUETTE + SHADING: the faceted chined
  forebody (a hard light / dark edge along the chine, a bright hairline on it), the long gold-tinted bubble canopy with a hot spot + the
  pilot, raked parallelogram intakes with a dark mouth + a lit lip, the DIAMOND wing from just below (its root fold darker, a lit leading
  edge), diamond stabilators, TWIN CANTED fins (the far one a sliver), 2-D vectoring nozzles with serrated edges, the closed sawtooth bay
  doors on the belly (internal weapons — nothing hangs outside), gunmetal greys with a specular spine line + per-panel tone shifts (no
  flat fills, no outlines), a low-vis grey-on-grey star-and-bar + the fin's flash; night: the strips on the chine / aft fuselage / fin tip,
  the wingtip nav light, the tail light, the beacon on the spine. Live: HEAT HAZE behind the engines (pale wavering blobs beyond the
  diamonds), a hint of MOTION BLUR on full burn (two fainter copies trailing), the Mach diamonds + afterburners kept. The chase's jets
  `W × 0.235` (64–140 pt; was 0.2) so the facets read at 402. Three passes at 1440 (`tests/integration/jets-preview.html`), the chase at
  402 at night (`&force=tr3b&lgs=36`), the air show by day (`&force=jets`). The panel's labels say F-22s.

### 3. NO TRAFFIC DURING THE LEGENDARIES (`core/harbor-legend.js#trafficHold`, `HOLD`; `harbor-traffic.js`, `harbor-people.js`, `harbor-workers.js`, `roadlight.js`, `motorcar.js`, `scene.js`)
- **THE HOLD** on every vehicle's START: from 4 s before the craft shows until the jets are gone + the power is back (the TR-3B: 41.7 s in)
  / the saucer has left (the abduction: 32 s). PURE, from the legend `{ kind, t0 }` the scene already hands the people (live — a forced
  run — or the seeded night, now known a minute ahead).
- **Who obeys it**: the back road's spawns (`simulateLane` keeps none inside it; `carsAt` keyed by the hold so a forced run takes at
  once), the buses (one due under it rides on), the cabs, the workers' shows on a seeded legendary night (`workDay` holds its minutes:
  their trucks never drive in under the craft), the street under the dock (`roadLight`: no new pass adopted while it holds — nor one
  that began under it, which would pop in mid-street), a forced raid (its clock keeps moving back until the sky is clear). A vehicle
  already rolling / at the curb finishes; in the blackout its lamps die with the city (`motorcar.js#lamps` — the lamps only, never
  its night look; the back road's cars already read the power).
- **Tests**: `trafficHold` (legend), the lane simulation + `carsAt` (traffic), a bus due / already there + a whole TR-3B's cars (people),
  every legendary night Oct 2026 → Mar 2027 without a show across it (workers); e2e-harbor `legends`: the hold on, nothing entered
  under it, the street's pass from before.

### Decisions made (each the most reasonable reading; easy to reverse)
- The title's mood music goes on from where the tape got to (no skip ahead) — "the right song time" for a free-running song; only a
  room-clocked song (`setMusicClocked`) makes up the lost time. Nothing sets it yet: the lobby's synced song is `synced-songs.js`.
- The drain's base speed 0.5 × (the owner's "~0.5"); the low-pass 2.2 kHz; the duck unchanged (0.72 / 0.55 under the jets).
- The hold ends at 41.7 s (the power coming back), not at the run's end (50 s): a car starting then takes seconds to show.
- A forced legendary (the panel) does not postpone a worker's truck already planned in that minute — the crew's itineraries are built
  from the truck's times; seeded nights never clash (the schedule holds the legendary's minutes).

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against d9b896d — the commit before — 402×874, tiers 2 + 0, the laptop without a GPU)
- `tr3b-jets` (the F-22 chase): t2 work 14.36 → 12.57 ms (−1.8, noise ±2.2) · slow 7.5 → 2.7 % · t0 8.71 → 8.78 (+0.07, ±1.66) → **same**
- `tr3b-dark` (the dark city, the hold on): t2 10.73 → 6.5 ms (−4.2, noise ±5.3) · t0 4.51 → 4.61 (+0.1, ±1.55) → **same**
- (the absolute budgets are warnings on this laptop as always; the phone decides)

### Known issues
- **WebKit not run here**: Playwright's WebKit download stalled twice (224 KB of ~100 MB) — the tape stop is proven on Chrome (the E2E) and
  on the fakes; the owner's AUDIO panel decides (below).
- The tape's first bend can start late on a cold cache (the 4 MB fetch): the sag begins when the slice is ready, skipped past ~12 s in
  (`minAhead`) — the duck still dips the music.
- The panel's forced run + a worker's truck in the same minute (above).
- **The cloud (two runs, 40220340354 + 40221373738)**: the `tape`, `legends`, `workers` + the audio / show / city groups green; the first
  run's `wild` job failed on the workers group because the people's new `traffic` hook threw inside `harbor()` (a crew truck carries no
  `tE`) — fixed in 38431fa; the second run's `wild` job lost 30 s launching Chrome for the wildlife group ("waiting for the WS endpoint
  URL", then workers + tape 24/24) and its `street` job passed 75/75 but the speakeasy page's emulator dropped (auth/network-request-failed
  + the RTDB websocket) and the harness counts those as errors. Both the cloud's own; not re-run (the two-run rule).

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **THE TR-3B's MUSIC**: `&when=2026-10-22T22:00&force=tr3b` — tap so the music plays, watch the whole event with the AUDIO panel open:
  "sounding" throughout, the el row `ON THE TAPE`, the song slowing deep + warbling, then speeding back up after the jets, `el playing`
  after; then once more with the party on `&force=tr3b,party`; the panel looping it back to back.
- **THE F-22**: the chase `&when=2026-10-22T22:00&force=tr3b&lgs=36` · the air show by day `&when=2026-10-22T13:00&force=jets`.
- **NO TRAFFIC**: `&when=2026-10-22T22:00&force=tr3b` — no car, bus or cab enters while it crosses; the street under the dock still.
