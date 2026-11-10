# LOAD FIX 2 — the city loads FAST again + the clouds never snap after the reveal (Nov 9 2026, evening; plan.md "OWNER'S NOTES — NOV 9 (evening)")

> The owner's iPhone, Safari, home Wi-Fi, 4:34 pm: THE SITE IS SLOW TO LOAD — EVERY time (so not the network: the boot's own bytes + work);
> THE CLOUDS once SNAPPED (jumped) then FADED to a different cloud right after the reveal (intermittent). A short City 2.0 pass between
> PRISM DROP's passes. ONLY these two — nothing else was started. The bible: [docs/harbor.md#performance](../../harbor.md#performance).

## Group 1 — MEASURED + FOUND (no fixes)

**The tools (new):**
- `tests/integration/boot-time.mjs` — THE BOOT CLOCK (Chromium; CDP: `--cpu n` + `--net wifi|4g|3g`; cold = a fresh profile, `--warm` = a
  second load with the service worker + the HTTP cache in place). Per load: the boot screen's first paint, THE REVEAL (scene.js `shownAt`),
  a tap on BOARD at the reveal → THE BOARD on screen, the requests + bytes BEFORE the reveal by kind (+ the service worker's own fetches on a
  warm load), the long tasks before the reveal with their pieces (`--trace`), the LOAD LOG (`--log`). `LIVE=1 --live --base
  https://neonspeakeasy.com --tap 0` = a READ-ONLY timing of the live site (&test=1: no profile, no member Nº, no room).
- `tests/integration/sky-snap.mjs` — THE CLOUD SNAP: the real boot on the live path with the weather + the clock answered by the script
  (`late`, `late-rain`, `stale`, `nearstale`, `twice`, `clock`); per frame for 8 s after the reveal the clouds' probe; exit 1 on a snap.
- In the city (diagnostics, no look change): the reveal's GATES (`scene.js#gateAt` — when each opened; `heldBy` — what held the reveal
  after them) as one LOAD LOG line at the reveal; THE CLOUD CUT (`clouds.js#plan` counts a set still on screen dropped by a re-plan —
  `stats().cuts`, the LOAD LOG's clouds row says `CUT` and counts as SEEN); `clouds.probe()` + `loadProbe().sky` (the plan, each set's
  shown mass, the set's mean place) for the probes. And the throwaway profilers in the pass's scratchpad (a CPU profile by function).

**1. THE BOOT, Nov 6 (THE LOAD FIX — b89b8b92, a worktree on :5174) → NOW (1b773a20, :5173)** — the same machine, the same throttles,
3 loads each (medians). Chromium, 402×874 @3; `wifi` = 30 ms a request + 50 Mbps (Chromium applies it per request; the local server is
HTTP/1.1 + no-store — so a warm load re-downloads). WebKit = `wk-load.mjs --scene grey --bars none` (no throttle in Playwright's WebKit).

| row | Nov 6 | now |
| --- | ---: | ---: |
| Chromium, cpu 4× + wifi, COLD — the reveal | 8.89 s | 8.90 s |
| … WARM — the reveal | 10.50 s | 9.12 s |
| … COLD — the first tap (BOARD on screen after a tap at the reveal) | 2.28 s | 2.06 s |
| Chromium, no throttle, COLD — the boot screen / the reveal / the tap | 40 ms / 3.45 s / 0.41 s | 40 ms / 3.45 s / 0.37 s |
| … WARM — the reveal | 3.56 s | 3.62 s |
| WebKit 402×874 @3, no throttle — the reveal (3 loads) | 2.63 / 2.65 / 2.72 s | 2.70 / 2.75 / 2.80 s |
| the LIVE site (Chromium, this line, no throttle) cold / warm | — | 3.01 / 2.89 s |
| requests before the reveal (cold) | 332 | 342 |
| bytes before the reveal (cold, on the wire) | 5244 KB | 5303 KB |
| … of it: scripts / the station's SONG / Firebase / fonts / sheets | 299 · 2332 KB / 2624 KB / 117 / 73 / 67 KB | 308 · 2387 KB / 2624 KB / 117 / 73 / 71 KB |
| the boot graph (static from js/app.js — `boot-bytes.mjs`) | 110 modules, 1787 KB | 113 modules, 1859 KB |
| the Harbor's graph (static from scene.js) | 233 modules | 237 modules |
| the longest import chain — the boot / the Harbor | 11 / 11 | 11 / 11 |
| long tasks before the reveal (Chromium, cold) | 7 = 1.52 s | 7 = 1.54 s |

**The verdict: NOTHING GREW much** (+72 KB of boot graph, +10 modules before the reveal, the reveal the same within noise). The site was
already this slow on Nov 6 — THE LOAD FIX made the load CLEAN, not faster. Where the ~3.4 s (Chromium, fast PC) / ~2.7 s (WebKit) goes:

- **≈ 0.7 s (WebKit) / 1.2 s (Chromium) before the scene even starts: THE MODULE WATERFALL.** 342 requests before the reveal, 308 of them
  scripts. The boot graph's longest chain is 11 imports; the Harbor's graph (237 modules) is a DYNAMIC import that starts only once the
  boot graph has been fetched + evaluated (title.js), and its own chain is 11 more — ~22 round trips IN A ROW before the city's code is in,
  then a third chain for the weather's effects (fog, rain, frost, the holiday props — `extras`). The site serves every file
  `max-age=0, must-revalidate` (Vercel's default) and the service worker is network-first with `cache: 'no-cache'`: on EVERY load (warm
  too) every one of the ~330 files goes back to the network (the live warm run: 329 service-worker fetches before the reveal). Each level
  of the chain = one round trip on the phone's Wi-Fi + Safari's service-worker hop.
- **THE STATION's SONG before any tap**: `audio/synced-songs.js` (the radio station on the server clock) fetches + decodes the WHOLE
  current song at boot (c2-morning4.mp3, 2.6 MB; 3.0 MB on the live site) — 50 % of the bytes before the reveal, competing with the
  scripts for the line. Nothing can play before the first tap.
- **THE LOOK TRAP** (scene.js#tryReveal): once every gate is open the reveal still re-reads the weather look if its signature moved
  (`lookAt = 0; return`) — but `refreshLook` throttles on `now - lookAt < 2500` with `now` = the PAGE's clock, so `lookAt = 0` cannot force
  anything until the page is 2.5 s old: on a fast load the city waited (Chromium: "held by the weather look 896–2206 ms, 80 frames" — every
  gate open at 887 ms). In WebKit (slower to its gates) it held 0–1 frame.
- **The scene's own first picture** (WebKit ≈ 2.0 s from the scene's start: the people ~1.0 s, the bake ~1.3–1.5 s, the clouds ~2.0 s —
  the gates line). Chromium also rasterises the whole first frame at ONE read of the canvas (the water's first mirror copy — a 900 ms task
  at 1× — `water.js#build` → `blit`): Chromium records 2D draws lazily; Safari rasterises call by call, so on the iPhone that cost is
  spread over the bake's slices instead. Its JS pieces (Chromium profile, 1×, before the reveal): the title's mount 184 ms, the city's
  layout 202 (the neon's layout 104), THE SIGN's HALO 109, the clouds' first bakes ~240, the workers' traces 94 (`crew#tracesAt` — the
  roof board's sync), the people 85, the bake pump 144.
- **After the gates, before the reveal, the timers**: the preview panel's module (`harbor/remote.js`, 27 KB) + 3 `/api/admin` calls, the
  intercom, the birthday + extras land at ~1.9 s — before the reveal on a slow load (on the main thread, nothing the picture needs).
- **With nothing kept on the device**, the reveal waits up to 2.5 s (WX_WAIT) for `/api/sky` (the live function answers in ~0.2–0.3 s from
  here, warm; ~0.6 s on a cold start).

**2. WHAT GREW since Nov 6** (the suspects checked, in the order the prompt named them; "before" = fetched before the reveal):
- THE DAILY MODULE: `daily/today.js` + `today-logic.js`, `core/streak.js`, `week.js`, `daily/clock.js` + `core/daily-points.js` — before (the
  dock's DAILY needs `today` for its first state: hidden / WAITING / ALL DONE — the picture needs it, or the dock changes after the reveal);
  ~12 KB; `/api/daily` once.
- THE TAP WATCH: `ui/tapwatch.js` — before (it must be on from the first tap); 1 file.
- THE HOLD'EM BILLBOARD: `core/harbor-holdem.js` + `holdem-art.js` + `holdem-glyphs.js` — before (the roof board's base poster is IN the
  first picture).
- The ticket art / paper grain, BOARD 2.0's strips, THE PLAYER PAGE, the cards' art + the fx engine, the BTC card, the gift reveal, the
  friends / invites, passkeys, the sightings: NOT before the reveal (each lazy, on its own open) — 0 bytes on the path.
- PRISM DROP's preload ("4 s in", `games/preload.js`): after the reveal in every run (its first request at ~4 s) — 0 before.
- The intercom / radio gate: `audio/intercom.js` + `core/radio-intercom.js` at ~1.9 s (a timer) — before the reveal on a slow load, not
  needed for the picture.
So the growth is ~60 KB of scripts the first picture does need. The cost is the STRUCTURE (the waterfall, the song, the trap).

**3. THE CLOUDS — the snap, reproduced** (`sky-snap.mjs`, Chromium, the live path, the answers scripted):
- `late` / `late-rain` (nothing kept; `/api/sky` after 3.6 s — past the reveal's 2.5 s wait): the reveal shows the SEEDED sky (8 fair
  cumulus), the real answer lands +2.1 s after it → the sky repaints over 6 s + the clouds re-plan with a 6-s blend — ONE change, no cut
  (the frames: the old set fades out as the new one fades in).
- `stale` / `nearstale` / `twice`: the answers landed INSIDE THE LOOK TRAP (the reveal held until the page was 2.5 s old) — no change after
  the reveal. Fixing the trap moves these answers after the reveal: Group 3 must make that safe.
- **`clock` — A SNAP**: the server's clock answered late (+2 s) and 20 min ahead: the cloud field's place JUMPED −61 → +134 pt in one frame
  (5.6 s after the reveal) — the field's time is `e0 + (clock − t0Clock)`, the city's clock jumps with the offset, so every cloud jumps.
  (A phone a few seconds off moves them < 1 pt; a phone minutes off — or an offset that crosses the 6-hour block / the date in the field's
  seed — jumps them, or re-plans a whole new field.)
- **THE CUT (the owner's "snap, then a different cloud")** — read in the code + proved by the new counter: `clouds.js#plan` FREES the set
  that is still fading out (`old`, on screen at `oldK`) the moment a SECOND re-plan comes inside a blend (SLOW_MS 6 s) — it vanishes in one
  frame (THE SNAP); and when the set fading IN isn't baked yet (`!born`) there is no set left to fade from, so the newest field fades in
  over 1.6 s from an EMPTY sky (A DIFFERENT CLOUD). The seed of the field (`clouds.js#drawAll`) is the date + the 6-hour block + the cover
  in eighths + the three layers in quarters + a rain flag — any two of: the kept answer → a fresh answer moments later, the rain flag
  (`LK.rain > 0.05`, which follows the rain RAMPING IN after a rainy answer lands), the clock offset moving the block / the date, a second
  answer — inside 6 s give it. Before this pass the LOAD LOG counted every slow re-plan as fine (`clouds … blended` was never SEEN), so the
  cut never showed in it; now it is a SEEN row (`CUT: the fading set … dropped`).
- **THE SLOW-PHONE PATH (the owner's iPhone, intermittent)** — `sky-snap.mjs --cpu 4` (the frames ~4 a second in headless Chromium at 4×):
  every case reveals LATE (`REVEAL_MAX` 4.5 s — "still waiting for the bake, the clouds"): the first cloud set is NOT baked at the reveal
  (`clouds.js#run` gives its jobs 10 ms a FRAME before the first set is born — frame-bound), so the reveal shows the sky with NO clouds,
  then a set fades in after it over 1.6 s — and a late answer landing meanwhile re-plans it (`late`: "+2.14 s clouds ⚠ re-planned · 2 (deck
  alto)" — a SEEN row: no slow blend, because there was no born set to blend from: `appearMs = old && shown ? SLOW_MS : 1600`). On a phone
  whose first set was born just before the change, the fading set is dropped instead (THE CUT). Either way: a sky that changes by a cut or
  a quick fade right after the reveal, on the loads where the phone is slow to its gates — the owner's "intermittent".

## Group 2 — THE BOOT, FASTER (no look change)

1. **THE LOOK TRAP fixed** (`scene.js#refreshLook`): `lookAt = 0` now FORCES the read (`lookAt !== 0 && …`) — the reveal no longer waits
   for the page to be 2.5 s old. Chromium, no throttle: the reveal 3.45 → 1.42 s from this alone (the old 900-ms first-frame task went
   with it — it ran inside the held frames; no long task appears after the reveal: `boot-time.mjs` now also lists the long tasks in the
   2.5 s AFTER it — none).
2. **THE BOOT PRELOAD** (`scripts/build-boot-preload.mjs` → index.html, GENERATED; `tests/boot-preload.test.mjs` fails when stale): ONE
   inline script asks for all 297 modules the first picture needs (`<link rel="modulepreload">` — the static graph of js/app.js + the city
   + the weather's effects + the holiday props' module + the dock's `today` + the profile it reads) the moment the four core sheets are in
   (index.html's `__cssDone` → `window.__bootPre`; at the latest 1.2 s in). The ~22-deep waterfall → ONE round trip. Measured first with
   the block ahead of the sheets: Chrome held the sheets' low-priority (print-media) requests behind 297 high-priority preloads on the
   local HTTP/1.1 server — the city laid out at 320×320 for 7 s — so the sheets go first. A/B on the Wi-Fi line (Chromium, cpu 1×, the
   local HTTP/1.1 server — the live site's HTTP/2 multiplexes, so the gain there should be larger): 4.20 / 4.20 → 3.91 / 3.89 s.
3. **NO SONG BEFORE A TAP** (`audio/party-music.js#partyMusicTick`): the station's synced player is made at the first tap (engine.js's
   unlock), not at boot — 2.6 MB (3.0 live) off the boot: the bytes before the reveal 5303 → 2639 KB. The song then loads + decodes after
   the first tap (partyClaims keeps this phone's own player quiet while it does — as on any station change): the music starts a moment
   after the first tap instead of with it. The harbor `stations` + `partysync` groups green.
4. **The preview panel** (`title.js`) — first moved to 1.5 s after the city's REVEAL; the end's full run caught it evaluating IN VIEW (the
   sightings group's capture: a 100-ms frame) → REPLACED in Group 5: preloaded with the boot (THE BOOT PRELOAD's `ENTRIES`) + started at the
   city's start, so its evaluation lands in the hidden frames before the reveal (the reveal never waits for it, as before, unless a JUST ME
   state is stored for the tab).
5. **The first picture's slices, hidden frames** — WebKit's last gates were the clouds' first set (~2.0 s) then the bake (~1.5 s), each fed a
   few ms a frame while the frames are invisible anyway (the boot screen above is CSS on the compositor): before the reveal the clouds'
   jobs get 22 ms a frame (`clouds.js#run` — 10 after it, as before), the city's bake 22 (was 14) and the lit windows 12 (was 8). After the
   reveal every slice is as before.

**After Group 2** (the same runs as Group 1's table, 3 loads, medians):

| row | Nov 6 | before (Group 1) | after Group 2 |
| --- | ---: | ---: | ---: |
| Chromium, no throttle, COLD — the reveal | 3.45 s | 3.45 s | **1.32 s** |
| … WARM — the reveal | 3.56 s | 3.62 s | **1.03 s** |
| Chromium, cpu 4× + wifi, COLD — the reveal | 8.89 s | 8.90 s | **8.48 s** |
| … WARM — the reveal | 10.50 s | 9.12 s | **8.62 s** |
| WebKit 402×874 @3, grey day (3 loads) | 2.63–2.72 s | 2.70–2.80 s | **2.20–2.23 s** |
| WebKit, night (3 loads) | — | 2.67–2.91 s | **2.32–2.40 s** |
| bytes before the reveal (cold) | 5244 KB | 5303 KB | **2639 KB** |
| the first tap — BOARD on screen (no throttle / 4× + wifi) | 0.41 / 2.28 s | 0.37 / 2.06 s | 0.45 / 2.22 s |

The 4× rows stay CPU-bound (headless Chromium at 4× draws the hidden city at ~4 frames a second — the slices are per frame); the TARGET
(at least as fast as Nov 6 on the same throttled run) holds: 8.89 → 8.48 s cold, 10.50 → 8.62 s warm; a normal load is 2.6× faster in
Chromium, ~0.5 s faster in WebKit locally (no network there — on the phone's line the preload + the 2.6 MB less add to it).

**No look change** — `pixdiff.mjs --pin --scenes night,party,noon,golden,dusk` against 1b773a20 on :5174: night 0 px; noon 29 px, golden
129, dusk 24 (the walkers in the promenade band — the usual residue); party 22,175 px — ALL of it the dancers' poses (the dance's phase
before a first tap: the station's song is no longer decoded by then) — the city, the sky, the signs: 0 (`shots-lf2-diff/party-diff.png`).
The harbor `load` group 19 / 19 + `stations` + `partysync` (36 / 36 together); `wk-load.mjs` 6 / 6 clean (no doubled frame, no chunk,
no #net pill, nothing between).

## Group 3 — THE CLOUDS, NEVER A SNAP

The causes from Group 1, each fixed where it starts (`clouds.js`, `scene.js`):
1. **THE CUT** (`clouds.js#plan` + `drawAll`): after the reveal a set on screen is never freed by a re-plan.
   - A new field while a blend shows BOTH sets (the old fading out, the new one in) WAITS (`blending` — the seed is read again every frame,
     so the newest field plans the moment the blend ends: two slow blends in a row, never one set dropped mid-fade).
   - A new field while the incoming set isn't baked yet (invisible — its appear is 0) REPLACES only the incoming one; the old set keeps
     showing at its level and the newest blends in from it.
   - THE CUT counter now counts only what is really freed while on screen (the first version counted the replaced, invisible incoming
     set — a false alarm at 4×).
2. **EVERY CHANGE AFTER THE REVEAL IS SLOW**: a set planned after the reveal always blends over SLOW_MS (6 s) — before, a re-plan with no
   baked set to blend from (`old` null) came in over 1.6 s from an empty sky. A LATE reveal (`REVEAL_MAX` — the first set not baked yet)
   lets that set drift in over 6 s once it is (`settle()`), and keeps a baked set still on hand on screen until then (never an empty sky
   at the reveal). And after the reveal ANY new weather answer counts as the weather changing (`wxChangedAt` — before: only a change of
   KIND): the sky, the bake's tones + the lit windows blend over WX_BLEND (6 s), never the 1.5-s repaint, when the same kind comes back
   with another cover.
3. **THE CLOCK's JUMP** (`clouds.js#drawAll`): after the reveal a jump of the city's clock that the real time doesn't explain (1.5 s …
   15 min — the server's offset landing, a phone's clock minutes off) is taken out of the field's time (`t0Clock += j`; `probe().jumps`):
   the clouds keep drifting where they are. A bigger jump (the preview panel's hours) crosses the 6-hour block → a new field → a slow blend.

**The proof** (`sky-snap.mjs`, Chromium; BEFORE = the Group 1 build f5e2ee59 on :5174 with the same test hook; the judge now reads each
cloud's own step a frame — the first judge read the set's MEAN place, which a cloud wrapping past the screen's edge (off screen) tripped):

| case | BEFORE | AFTER (1×, 2 runs each) | AFTER (4× CPU) |
| --- | --- | --- | --- |
| `twice` (a second answer inside the first blend) | **a CUT at 4.5 s** (the fading set dropped — SEEN in the LOAD LOG) | no snap (the 2nd field waits: plans at 1.9 + 7.9 s) | no snap |
| `clock` (the server's clock 5 min ahead, late) | **every cloud jumped 213 pt** | no snap (1 jump absorbed) | — |
| `late` / `late-rain` (no answer kept, it lands after the reveal) | one slow blend | one slow blend | no snap |
| `stale` / `nearstale` / `stale-rain` | (landed inside THE LOOK TRAP) | one slow blend after the reveal | no snap |

The harbor `load` + `sky` + `weather` groups: 70 / 70.

## Group 4 — THE GUARDS

- **THE BOOT BUDGET** — `tests/integration/boot-budget.json`: **310 modules / 6500 KB** of module source before the reveal (the static
  check, `tests/boot-budget.test.mjs` — THE BOOT PRELOAD's list; now 298 / 6191 KB; + no game cartridge / game screen in the boot) and
  **360 requests / 2900 KB on the wire, no audio** (the harbor `load` group's THE BOOT BUDGET — the real boot, cold, 402×874 @3; now
  332 / 2673 KB, none). Raising a number = a decision a pass names in its summary. `tests/boot-preload.test.mjs` keeps the generated
  preload in step with the imports.
- **NOTHING CHANGES AFTER THE REVEAL** — the `load` group's THE SKY AFTER THE REVEAL, two loads on the live path: a kept answer near its
  end + a late answer + a SECOND one inside its blend (6 s watched); the server's clock 5 min ahead answered late (9 s watched — the
  offset lands ~6 s in) — each: at least one real change happened (a re-plan / an absorbed jump — never a vacuous pass), no cut, no cloud
  jumping, the shown clouds never falling in a frame, nothing SEEN in the sky in the LOAD LOG. The load group: 22 / 22 (~75 s —
  harbor-jobs.mjs's SECONDS updated).
- docs/harbor.md#performance: THE BOOT BUDGET + NOTHING IN THE SKY CHANGES BY A CUT + the one command (`boot-time.mjs`).

## Group 5 — the end

- **THE BUSY-PC CHECK**: nothing but the emulators, my two `serve.mjs` (:5173 now, :5174 the worktree for the A/Bs) and Ben's :5190 preview
  server (his — left running).
- **Locally (the mini PC):** the unit suite **1483 / 1483** · rules **69 / 69** (unchanged — nothing to re-publish) · `/api` **44 / 44** ·
  smoke **6 / 6** · CONN green (0 sockets parked, 1 in a room) · `e2e-daily` **51 / 51** · `e2e-prism FAST=1` **56 / 56** (its preload
  untouched — the cartridges stay out of the boot) · THE BASELINE GUARD **3 / 3** (1.11–1.27× the baseline) · the FULL `e2e-harbor` suite
  at 4 shards **1222 / 1226**. The four reds, each re-run alone: `crew` (PUSH — a guest opens WIDE), `rebuild` (A2 at 4× — the worst task
  968 ms alone, 1530 under the 4-shard load) and `vault` (the GPU path's 8 sighting cards at 4× — 55 fps alone) **green alone** (the
  shards' load); `sightings` — "the capture never hitches the frame loop" — **RED alone too: a real one from this pass**: the preview
  panel, moved to 1.5 s after the reveal, evaluated during the capture (worst frame 100 ms; 50–66 ms before the pass and with it reverted —
  the song gate was tested and ruled out). Fixed (Group 2 item 4 — preloaded + started in the hidden frames): `sightings` + `load` +
  `panel` **74 / 74**, the reveal unchanged (Chromium 1.41 s; WebKit 2.27 / 2.39 s), THE BOOT PRELOAD 300 modules (inside the budget).
- **The sizes** (Chromium, the reveal): 390×844 1.29 s · 402×874 1.41 · 430×932 1.36 · 1440×900 1.79; WebKit 402×874 @3 2.2–2.4 s, 1440×900
  @3 3.54 s — every load clean (no doubled frame, no chunk, no #net pill, nothing between).
- **The rules: NOT changed** — nothing to re-publish. Still 8 functions.
- **Not started** (as the prompt said — ONLY the load + the clouds): nothing else from the lists.

**Known issues** (also docs/harbor.md KNOWN ISSUES):
- The music starts a moment AFTER the first tap (the station's song fetched + decoded then, ~0.5–1 s on Wi-Fi), not with it; before a tap
  the party crowd dances on the grid's stand-in clock (pixdiff: the dancers' phase only).
- THE BOOT PRELOAD's gain was measured on the local HTTP/1.1 server (4.20 → 3.90 s on the Wi-Fi line); the live site's HTTP/2 + Safari's
  service-worker hop are the owner's iPhone's to judge. The service worker still revalidates every file on every load (no per-file version
  to cache on; network-first stays — CLAUDE.md).
- A 4×-CPU phone stays CPU-bound (headless Chromium 8.90 → 8.48 s).

