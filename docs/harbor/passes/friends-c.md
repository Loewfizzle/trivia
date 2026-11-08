# FRIENDS C — the city fixes (Nov 8 2026, morning)

A City 2.0 pass after FRIENDS B, before THE DAILY MODULE (the dailies chat). ONLY the list below (the owner's prompt, plan.md "OWNER'S NOTES —
NOV 8 (morning)") — nothing else started. Own servers: the emulators + `scripts/serve.mjs --emu` started at the top (a server left from 7:12 was
found serving the old /api mid-pass and replaced), every one stopped as the last step. **No rules change.**

## Step 0
plan.md "OWNER'S NOTES — NOV 8 (morning)" appended unchanged + the build table (FRIENDS B ✅ — rules published 6:54 am; FRIENDS C ← this; THE
DAILY MODULE after); decisions.md (FRIENDS C building, THE BLACK HELICOPTER, A SKY MOMENT IS NEVER HIDDEN BY WEATHER, THE INTERCOM IN SYNC).

## Group 1 — THE RADIO
- **A FIRED JACK PLAYS ONCE.** The cause: `scene-radio.js` kept its `played` record INSIDE the scene — every rebuilt city (back from YOUR CARD,
  setup, THE CITY PAUSE after a match) made a fresh record, saw the fired moment still inside its window and began it AGAIN as a "late load"
  (mid-way: the skytyped letters, the drone show, a legendary came back). Reproduced on the emulators (a repro script: fire SKYWRITE, go to the
  card + back → the smoke started a second time at 40 s). The fix: the one-shots this tab has STARTED are kept for the tab (sessionStorage
  `nd:rd-seen`, id → its end; pruned) — a rebuilt city never begins them twice; a HOLD (the searchlights, the beams, the party, a dance) is a
  state and still comes back on. A fresh tab that never saw it still joins mid-way (by design). Single-page runs of every jack (SKYWRITE by day +
  as THE DRONE SHOW at night, BANNER, BALLOONS, the UFO, the TR-3B — the dark ones written straight into the emulator's queue: the server's own
  after-dark check reads the real clock) each played exactly once.
  Proof: harbor `radio` — four one-shots at once (the drone show, a legendary, the balloons, the banner) watched over their whole window with
  the city REBUILT in the middle → each piece shown once (`{"drones":1,"legend":1,"balloons":1,"banner":1}`).
- **THE SCHEDULE VIEW's ORDER:** YOUR QUEUE · THE WEEK · then the night's timeline (EARLIER still folded) — `radio-program.js` (only a re-order);
  harbor `radio` checks the heads' order.
- **THE CREW RADIO's HEADER at 390:** "NEON SPEAKEASY ·" was clipped to 151 of its 175 px with THIS LOBBY ONLY beside it. The crew's plate is the
  brand's THIRD LINE now (`.rd-head.is-crew` = brand + ✕). Harbor `crew`: every piece whole + apart from the ✕ at 390 / 402 / 430 (the sheet
  set to each width — a page resize closes the radio).

## Group 2 — THE INTERCOM IN SYNC
- EVERYONE is stamped **50 s ahead** on the server clock (`radio.intercom` `lead.everyone` 2 → 50 — the city's ~45 s poll + the 15 s edge cache
  have it by then for most phones). Every phone that has it begins up to 4 s early (`audio/intercom.js` PREP_MS: the clip fetched + decoded),
  the sound SCHEDULED on the audio clock for `at`; the headline + the music's duck go up with the first chime. A phone that learns of it late
  JOINS MID-WAY (`late` = now − at) until its end, then skips it — never from the top out of step (`core/radio-intercom.js#icDecide`; the old
  `late` knob — 150 s from the top — retired). A phone that HELD it through a game plays it from the top (WAIT FOR THE LOBBY, by design).
  LOBBY ONLY unchanged; EVERYONE's lobby copies wait for the same `at` (every phone together).
- Proof: harbor `radio` — two watching pages given the city's copy of a REAL clip each fetch, decode + schedule it on their own: **0 ms apart, 0
  ms from its time**; a third told 3 s late joins on the same timeline (start 0 ms from its time, `playing (… 3.1 s late)`). The EVERYONE send's
  stamp checked at 50 s. (A JUST ME clip fed as the city's copy — nothing goes to the other shards' phones.)

## Group 3 — THE SKY UNDER WEATHER
- The cause: the show (the flyby, the air show, the missing man) was drawn inside `skyfx.sky()` — BEFORE the second cloud pass, the storm deck,
  the lightning and the far fog veil. The fix: `skyfx.showOver` draws it after all of them (after the far rain haze; the near skyline still in
  front), and the clouds THIN under its flight band (`jets.js#band` → `clouds.thin`, the same mechanism as skytyped words). In fog the skytyped
  words draw there too (the far veil washed them out by day).
- THE GRID (shots.mjs `--force <moment> --qs wx=<w>`, 402, day 1 pm + night 9 pm, two frames each; sheets in the scratchpad, summarised):

| moment | clear | overcast | rain | snow | fog |
| --- | --- | --- | --- | --- | --- |
| the flyby — BEFORE | ✓ | hidden by day | hidden by day, ghosted at night | hidden by day | hidden by day + night |
| the flyby — AFTER | ✓ | ✓ | ✓ | ✓ | ✓ |
| skywriting (day) / the drone show (night) | ✓ | ✓ | ✓ | ✓ | washed out by day → ✓ |
| the balloons | ✓ | ✓ | ✓ | ✓ | ✓ |
| the UFO | ✓ | ✓ | ✓ | ✓ | ✓ |
| the TR-3B (night) | ✓ (its blackout + craft) | ✓ | ✓ | ✓ | ✓ |
| THE BLACK HELICOPTER | ✓ | ✓ | ✓ | ✓ | ✓ (night: low over the lit water — the sheet's downscale hides it; full size reads) |

  Not judged by the grid: the forced airliner (`&force=planes` hadn't entered at the two sample times — an everyday plane, not a show moment)
  and the fireworks (night-only; its bursts weren't up at those times). The banner was already drawn after the clouds (LOBBY FIXES); the
  legendaries draw after the storm deck (`legends.sky`).

## Group 4 — THE BLACK HELICOPTER
- **The model:** Grok's `helicopter-main.glb` is BYTE-IDENTICAL (md5 bbb6fd68…) to the patrol's `art/models/helicopter/…18712.glb` — the same
  CC0 "Utility helicopter" by 3D Assets. No new model in the repo; a new RECIPE: `scripts/bake/blackhelo.mjs` (the patrol's page + its own paint,
  light and rotor): every material matte-to-satin BLACK (the glass dark smoked), a COLD blue-white RIM from above + behind (+ a second cool rim
  behind-left, the city's warm glow faint from below) — the top + back edges catch it, the body stays black; 12 headings at 300 px (it turns
  less than the patrol); the MAIN ROTOR alone baked as 6 MOTION-BLURRED spin frames (10 sub-renders each over a quarter turn of 4 blades) →
  `assets/city/blackhelo/{blackhelo.webp 60 KB, rotor.webp 24 KB, blackhelo.json}` — loaded only when it flies, dropped after (4.8 MB decoded).
- **The flight** (`air.js#blackPlan`, mode 'black', the patrol's own renderer + its rules — `avoidSky`, `heliOcc`, `clearLegs`): in LOW over
  the harbor from one side (1.55 × the patrol's near size: ~100 pt at 402), a 4.2 s HOVER over the water at the first spot across the harbor
  clear of every sign + near piece (it turns ~35° toward us), its SEARCHLIGHT sweeping wider + quicker and 1.5 × brighter with a GLINT where it
  hits the water, then it BANKS AWAY (a steeper tilt, climbing 46 pt + shrinking to 0.62 — away into the distance) off the other side.
- **The lights** (drawn live, sized for ~100 pt): the RED nav light on its port side + the GREEN on its starboard (the near side bright, the far
  one dimmer as it turns toward us), a WHITE STROBE double-flash every 1.2 s (the tail + the belly), the red anti-collision BEACON on top, each
  mirrored as a faint vertical streak on the harbor below (only on the water).
- **The moment:** the medium tier's night helicopter pass (`medium.heli` — "an extra helicopter pass at night") IS the black helicopter now:
  the SAME seeded times (kind 'heli' — THE GOLDEN TABLE unchanged, the medium mix untouched), the craft + flight its own (`knobs.black` in the
  timetable). NIGHT ONLY (the medium kind's `when: 'dark'`), never near a legendary or a dance break or a show (the patrol planner's own
  conflicts). **THE RADIO:** a jack on the desk — BLACK HELI (order 15, lane `legend` = never with another legendary, after dark; the crew's desk
  unchanged at 11 — the owner may add it). **The force flag:** `&force=blackhelo` + its panel row (AIRCRAFT). **THE DAY CHART** labels it.
- **The sound:** a quiet SYNTHESIZED rotor thump (`build-synth-sfx.py#thump` — soft low thuds at ~7.2 a second + a faint blade slap, a slow
  swell, a whisper of turbine; the 2nd harmonic lifted for a phone's speaker) → `audio/city/rotor-thump.mp3` (a 30.5 s loop, 16 kHz / 32 kbps,
  129 KB) under the patrol's recorded flybys while it's up, louder in the hover, panned with it (`sounds.js`). The city sounds' total 21.47 MB.
- **CREDITS:** the existing entry names it: "Utility helicopter" by 3D Assets (3dassets.dev) — the patrol + THE BLACK HELICOPTER.
- Shots: `&force=blackhelo` at 402 (night, a 5-frame sheet: in from the right, the hover over the water with the cone + the red nav light at
  real size, the climb away) + the weather grid above. Not done: the 390 / 430 + WebKit 402×874 @3 + 1440×900 set and the bench's 60 fps for
  it — see the summary.

## Group 5 — THE SLOW-3G START
- The cause (OC8): at the start every phone loaded the cartridge (index.js → its imports, one level a round trip), THEN its view (view.js → its
  ~40 modules) — two waterfalls back to back; a guest only learns the game at the start.
- The fix: `js/games/preload-graph.js` (GENERATED by `scripts/build-preload-graph.mjs`; `tests/preload-graph.test.mjs` fails when stale) = each
  playable cartridge's WHOLE static graph past the boot (OVERCLOCK 54 modules / 489 KB raw, PRISM DROP 26 / 201 KB — both under the 1.5 MB
  budget); `js/games/preload.js#wireGame` puts it on the wire AT ONCE (`<link rel="modulepreload">` + its two stylesheets — fetched + parsed,
  never run), `preloadGame` = wire + load: the host's options sheet + its tap, every phone at the start. THE LOBBY IS THE LOADING TIME: 4 s into
  a lobby every phone wires the playable cartridges (not on a Save-Data line). The boot graph unchanged (preload.js + the list are on demand;
  THE BOOT BYTES test: the console's game files at boot still under 30 KB).
- Measured — Chrome's Slow 3G (400 kbps, 2 s latency), 2 phones, `e2e-oc-slow.mjs MOUNT=1 SLOW=1` (the match screen's mount after the start's
  stamp; the walk = 5 s):

| | the host | the guest |
| --- | --- | --- |
| BEFORE | 45.1 s | 50.6 s |
| AFTER — a 30 s lobby on the slow line (`LOBBY=30000`) | 5.10 s | 5.03 s (together at the walk's end) |
| AFTER — the start at once, no lobby time (the lobby's wiring off) | 5.10 s | 21.6 s |

  The last row is the local server's HTTP/1.1 (Chrome's six connections a host: 54 modules ≈ 9 rounds × 2 s); Vercel serves HTTP/2, where they
  all go at once. A real lobby is longer than 4 s, so the wiring has it by the start.

## Group 6 — THE CLOUD REDS
- **(a) `holiday` — the Halloween spiders** (red in the last 4+ cloud runs). The cause: the dangle / landing / word / reel checks POLLED the
  spider's live pose — a 2-core runner's polls stepped over the short poses — and the tap missed a spider that stepped off its hub between the
  read and the tap. The fix: the spider keeps each TRIP's RECORD frame by frame (`dress-halloween.js` — `seen: { n, tuck, land, word, reel }`, the
  same conditions as before); the test reads the record (a trip STARTED = its count went up), five tap tries. No check loosened.
- **(b) `audio` — RETURN (rAF dropped):** the loop restarted fine every time; the red was the punch's peak, 0.842 vs a bar of 0.851 (70 % of the
  first window's peak) — a 2.6 s window holds ~5 beats and the song's bars differ in level. Now measured over 4 s (a whole bar of kicks), the
  same 70 % bar.
- **(c) `city` — LOAD WEATHER (kept on this device)** (red in OC5's + OC8's cloud runs: "bake crossfade 1200 ms · neon" right after the
  reveal). Only a roof-BILLBOARD swap bumps the neon's revision: the reveal is decided in the SKY pass, the board synced later in the frame
  (drawCity), and the workers' traces the board follows land a frame after the people are ready — so a reveal could precede the board's sync
  to its hint / game. The fix (code): `tryReveal` syncs the board itself first and waits (bounded, like the other load gates) for the traces;
  a swap then happens in the dark. Measured: the reveal unchanged (~2.2 s), the night load's board swap now "swap (dark) · neon" before it.
- **(d) the two lobby speed checks that need a display** (THE FULL ROOM at 1×, THE PARTY ROOM at 1×): the real compositor's frame rate —
  with no display they're SKIPPED with the reason now (the display rule, SHELL 2.0 B2 — `skipNoDisplay`, counted apart). With a display (this
  run had one) both measured: 60 fps.
- **(e) THE ROOM's OWN COST at 4× CPU:** with no display the page is now the GPU-pinned headless one (the software compositor rasterised the 2D
  canvas on the CPU — the old 39 → 48 ms). Measured with a display: 31.7 ms alone → 35.4 while 7 walk in → 31.9 standing → **38.9 with the
  guest list's 8 strips** (+7.2 against its 4 ms budget). A REAL cost, not a test fault: the strips' renderer competes with the city's frame at
  4× CPU. **Left red** (a design question — hold / slow the city behind the guest list, or lighten the strips' effects) → KNOWN ISSUES.
- **(f) the radio desk across refreshes + THE WORD TOWERS** (red only in the full 4-shard run): a fixed 1.5 s before the finger went to the
  bottom (the face still filling in) → the face's height steady 0.8 s first; the word towers' conditions given more time (20 s / 12 s — the
  same conditions).

## Group 7 — the end
- Docs: this log, harbor.md (THE FILE MAP + KNOWN ISSUES + the INDEX), audio.md (THE INTERCOM IN SYNC + the rotor thump), decisions.md,
  ROADMAP.md + roadmap-history.md, plan.md's build table.
- THE BUSY-PC CHECK: nothing else running for the full suite (the bakes + shot grids done before it). Locally, on the mini PC: unit **1358 / 1358**,
  rules **68 / 68**, `/api` (server.test) **40 / 40**, smoke **6 / 6**, CONN **21 / 21**, THE BASELINE GUARD **3 / 3** (1.14× / 1.13× / 0.98×), the
  FULL `e2e-harbor` at 4 shards **1215 / 1218** — the reds: `stuckjoin` (a browser protocol timeout under the 4-shard load — green alone), THE
  ROOM's OWN COST (the known one — left red, above), and THE PROGRAM's two checks in `vault` — **a real bug of Group 1's re-order**: the RARE +
  LEGENDARY filter repainted with `paint()[0]` (tonight was the first section) and would have swapped tonight for a copy of YOUR QUEUE → tonight
  is found by its mark now (`data-paper="tonight"`); `vault` **58 / 58** after.
- The cloud run: the harbor tag on the final push (see the summary).

## Decisions taken in the pass (for the owner)
- THE BLACK HELICOPTER = the medium tier's night helicopter pass (the same times — the golden table unchanged), not a new medium kind;
  its jack is NOT on the crew's desk.
- EVERYONE's intercom now waits ~50 s after SEND on every phone, the owner's own too (every phone together — the owner hears it with the city).

## Known issues (left)
- THE RADIO's test window saw the roof board re-bake twice in 3 s ("bake crossfade · neon") after the radio's own billboard messages + a
  fired Blackbird — the city keeps drawing (counted from the loop now), but the board's swaps under an open radio are worth a look.
- (e) THE ROOM's OWN COST: the guest list's 8 strips +7.2 ms at 4× CPU (budget 4).
- THE BLACK HELICOPTER against the brightest part of the night skyline is a dark silhouette over lit towers — it reads at full size (the rim,
  its lights + the beam), weaker in a downscaled sheet; the owner's iPhone to judge.
- The slow-3G guest with NO lobby time on HTTP/1.1 (local only) still ~16 s behind the host.
