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
