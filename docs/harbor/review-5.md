# CITY 2.0 — REVIEW #5 (FR5, read-only, Nov 1 2026: THE CITY's ENGINE — speed, memory, code health, the pass overhead)

Fresh eyes on the city after PART 10, at commit `bf16920` (Step 0's two docs committed on their own). Nothing but this file and Step 0
was written — no code, no tests, no config. Method: every number below was MEASURED on the mini PC (Chromium 1248 with the GPU on,
Playwright's WebKit 2215 for the owner's engine, the emulators up) — `title-perf.mjs` on the ten worst scenes at tiers 2 and 0; a CPU profile
of the FIRST 12 s of a fresh load of the owner's own links (fog, blizzard, storm, a clear night, the party finale) cold and warm, with and
without `&debug=1`; an 8-s steady-state profile of each heavy scene held at tier 2; a 12-minute soak through the Saturday 10 pm show sampling
every live canvas by its creation site; the full local suite at 3 (the logs), 4 and 5 shards; the cloud's last two harbor runs read job by
job from GitHub's own step timings; three parallel read-only investigations (the code's health + the scene.js map; the tests + the cloud; the
profile / tab path), every headline claim re-read in the code by hand. In parallel GROK reviews the code AROUND the city from the public repo;
the ONE overlap is section E (the profile + tabs) — a cross-check. Sizes: **S** < 30 min · **M** 1–2 h · **L** half a day or more.

## In plain words (for the phone)

**What's slow.** Two things, and neither is the fireworks. (1) **The crowd**: a party peak costs 2.4× a plain night's frame, the conga break
2.9× — the dancers' rigs are re-derived and re-coloured per figure per frame; the fireworks add nothing measurable to the main thread
(−1.8 ms, inside the noise) — PART 10's GPU engine does what it promised. (2) **The first seconds** of every link are real: at 4× CPU the
first 12 s are 60–75 % long tasks and the bakes finish at 16–18 s on every scene, worst in the blizzard. **The blizzard's freeze has one
cause** — the `&debug=1` readout's PIXEL WATCH reads the canvas back from the GPU four times a second from 1 s after the reveal; in the
blizzard that read waits for everything the GPU still has queued (the flakes, the frost, the Christmas wire baking) — a **4.5-second stall**,
3.2 s of CPU in 12 s, 160 ms in a clear night. Your review links all carry `&debug=1`; **the instruments cost ~40 % of the load you judge**
(fog: the bakes done at 10.2 s without the readout, 16.5 s with). Three smaller load costs sit under it: the Christmas wire traced live from
the logo's SVG on every December load (1.2 s at 4×), a date formatter rebuilt on every call (0.3–0.8 s), the promenade's whole first minute
planned in the first frames (0.8–1.5 s).

One more to read off the owner's bench: in WebKit (a CPU rasteriser, like the iPhone's canvas path) **dense fog costs 1.8× a plain night**
where Chromium reads 0.6× — the fog's whole-sky veils + halos are the candidate if his fog scene reads slow.

**What's risky.** (1) Nothing leaks: 12 minutes through the show, the canvases sit at 650–690 / 93–99 MB, the heap breathes 51–90 MB, the
GL layer comes at 10:00:00 and goes after the smoke. (2) **No player loses a profile by the code we read** — but the Oct 31 scare was NOT
"a second tab in limited mode" (there is no limited mode: a duplicate tab is only toasted, and the admin cache is per tab, never shared). The
blank card means that tab had EMPTY storage for its slot: a test slot stuck in the tab (`?slot=2` sticks in sessionStorage forever), a private
tab, or an old tab on the apex origin. Three S fixes make it impossible to mistake for a wiped account. The apex → www redirect has been there
since Oct 26 at the latest; the repo cannot say whether it was there on Oct 17 — your Vercel domain settings can. (3) **The cloud's red checks
are five test bugs and ONE real city behaviour** (LOAD WEATHER: a window-share step crossfades 1.2 s right after the reveal — a one-line fix in
scene.js). (4) `scene.js` is 3,891 lines / 397 KB and 190 commits in 12 days; the split is drawn below and is ~2 days of M steps.

**What we'd gain.** On the phone: the blizzard's load freeze gone (S), the fog / clear loads ~1 s lighter at 4× (S + M), the WAIT / WALK lettering
+ the flake lookups ~0.5 ms a frame (S). In a pass: the full local suite **~25 → ~19 min** by refreshing the shard table and adding the missing
`fireworks` row (S, no test changes), **→ ~14–15 min** with the windows group's 31 pages opened 3–4 at a time (M); the unit suite **83 → ~20 s**
on this machine by splitting one test file (S); the cloud: the minutes are the tests (3,904 of 4,150 s — caches already hit, Chrome is the
runner's own), so −5 billed minutes a run from the perf job's warnings-only loop + the fixed sleeps; a pass's cloud stays ~75 billed / 10.5 wall
minutes. **The red checks → green on the first run** with six S fixes (one in the city). Together: **~15–20 minutes off a pass** without dropping a
check — the owner's number.

## THE TOP 10 (the highest gain for the lowest risk, ranked)

| # | finding | gain | risk | size |
| --- | --- | --- | --- | --- |
| 1 | **THE PIXEL WATCH is a GPU read-back** — `scene.js:2918 pixWatch`: `drawImage(canvas → 12×24)` + `getImageData` 4× a second for 15 s after the reveal on every `&debug=1` page; the blizzard link's 4.5-s freeze IS this (A3). Draw the watch's 12×24 from a 1× copy the scene makes itself at the end of its frame, or run it only once `baker.pending` is false, or put it behind TOOLS | the blizzard's load freeze gone; every review link's load ~40 % lighter | none (debug only) | S |
| 2 | **Refresh `SECONDS` + add `fireworks`** (`tests/integration/harbor-jobs.mjs:16–46`): the table under-reads the groups 1.39× (legends 3.4×, workers 3.1×, windows 2.7×…), so SHARDS=3 runs 1299 / 1277 / 813 s — the heaviest shard decides. Re-costed from the cloud's own per-group seconds: 3 shards ~25 min, **4 shards ~19 min** (D2) | **−6 to −9 min a full local run**, no test touched | none | S |
| 3 | **LOAD WEATHER is a real city behaviour** — `scene.js:1990`: a `share` / `bias` key step within the post-reveal grace crossfades the lit layer 1200 ms unless the weather changed; on the real clock that step lands in the 4-s window every few minutes. Let a share step inside `TIER_GRACE` (15 s) ride `WX_BLEND` like a weather change | the city job green on the first run; a phone loading at that second sees no window flash | none | S |
| 4 | **Five test bugs, not five flakes** (D3): the toast walk-in's frame-COUNT clause (`windows.mjs:294 ds.length > 60`), the arm step + the dog's turn sampled on the test's rAF clock not the scene's (×2 under load), the spiders' 18 s measured from OUR poke while the title re-pokes them every 25 s, the party-sync joiner judged on a spread stricter than the engine's own 120 ms. Each a `waitFor` / the right quantity — never a wider tolerance | GREEN MEANS GREEN | none | S each (the sampler shared) |
| 5 | **TWO fireworks engines on every `&force=fireworks` preview** — `district/fx.js:203` fires City 1.0's `Math.random()` rockets in the sky layer whenever the force set has `fireworks`; the bench's fw-week / fw-snow, title-perf's p10-week / p10-snow and the e2e `fireworks` group all measure the GPU show PLUS it (`district/fireworks.js:68 draw` 151 ms of 9.2 s). Strip it from the sky fx's force set at `scene.js:2405` (where `witch` / `bats` are stripped) | honest bench numbers; a seeded sky | none | S |
| 6 | **THE WINDOWS GROUP's 31 pages open one after another** (`harbor-e2e/windows.mjs:7–483`, 446 s in the cloud, 0 `Promise.all`, no shared state) — 3–4 at a time | **446 → ~150 s**: the suite's floor (one shard can't be shorter than its longest group) → ~14–15 min at 4 shards | low (each page its own context; watch the machine's load) | M |
| 7 | **`core/sky.js:51 localParts` builds a new `Intl.DateTimeFormat` on every call** — 450–830 ms of the first 12 s at 4× in fog (the planners + `look`); cache the formatter per zone + memo the parts per (zone, minute) | 0.3–0.8 s off every load at 4× (~0.1–0.2 s on the phone) | none | S |
| 8 | **THE CHRISTMAS WIRE is traced live** — `title.js:243 xmasWrapSvg` walks every letter's tube path with `getPointAtLength` every 1.4 units at mount (1,227 ms self time at 4× on Dec 15); bake the points once per letter set (a JSON beside the logo) or trace after the reveal in idle time | 1.2 s off every December load at 4× — both cities | none | S |
| 9 | **The profile / tab scare, made impossible to misread** (E): the card names its slot when `slot !== '1'` + a RESET button; a `me.uid !== state.uid` card says "THIS DEVICE'S SIGN-IN CHANGED — RESTORE WITH YOUR KEY" instead of `PLAYER`; `checkAdmin` never pins `admin:false` until `whoami` returns a linked pid, and `restoreKey` clears it; `fetchJson` retries once on a status-0 abort | no blank card ever looks like a wiped account; ADMIN back within one check | none | S ×4 |
| 10 | **The scene.js split** — seven M cuts in a proven order (fireworks → legend → holiday → weather → party → perf → panel), each a factory over a `ctx` of the ~20 hot inputs, each proven by pixdiff + the baseline guard; then `draw()` quartered along its four markers (C1) | every pass stops working in one 3,900-line closure | medium (a no-look-change refactor; the single sources stay by construction) | M ×7 + L |

Beside the ten: the memory guard made honest (the district modules the Harbor still imports create canvases outside `canvasMb()` — C2c, S); THE WIND's five leaks (C2d, S); `harbor-moments.js:97`'s second definition of a party night (C2a, S); the unit suite's one 79-s file (D5, S); the smoke test's 14-s watch per game (D1, S, −78 s a cloud run).

---

## A. SPEED ON THE PHONE

**How it was measured.** `title-perf.mjs --city 2 --gpu --cpu 2 --tiers 2,0 --size 402x874` on the ten worst scenes (the GPU on, as PART 10
measured — software WebGL puts the fireworks on the main thread); a CPU profile (CDP `Profiler`, 0.5-ms samples) of the FIRST 12 s of a fresh
load at 4× CPU, 402×874 DPR 3, on the real `?emu&city=2` page with the owner's link flags, cold + warm, with + without `&debug=1`; an 8-s
steady-state profile of each heavy scene held at tier 2 (2× CPU); WebKit (the owner's engine, Playwright 1.56's WebKit 2215 hand-installed in
`C:\Users\benja\wk`) at 402×660 DPR 3 for the frame side. The numbers are RELATIVE within one run — the mini PC at 2× is not the iPhone (the
owner's bench PROFILE, Oct 30: a break 59 fps, 17 / 19 ms frames, 5.6 ms work — against ~50 / 27 ms here).

### A1. Where the frame goes — the worst cases (tier 2 · work = main-thread ms a frame, mean / p95; `scene` = the city's own draw)

| scene (title-perf id) | t2 work | t2 frame p95 · % slow | t0 work | what it says |
| --- | --- | --- | --- | --- |
| a plain night (`np-night`) | 11.2 / 15.0 | 16.8 · 0 % | 8.8 | the floor |
| the party peak, no show (`p10-party0`) | 27.3 / 34.3 | 50.1 · 91 % | 13.7 | **the crowd is the cost** |
| the party finale over the crowd (`p10-party`) | 25.5 / 33.6 | 50.0 · 94 % | 13.6 | **the fireworks add ~0 ms on the main thread** (−1.8, noise ±2.5) |
| the weeknight show (`p10-week`) | 11.1 / 13.8 | 16.8 · 0 % | 7.4 | the GPU engine is free |
| the show in light snow (`p10-snow`) | 22.2 / 115.8 | 166.6 · 13.5 % | 12.7 | the p95 is the profiler's own 1.4-s start (A2); its p50 = a plain night's; + the SECOND engine (A4.1) |
| the conga break (`sp-break`) | **32.3 / 40.2** | 50.7 · 99 % | 15.0 | **the heaviest moment in the city**: the dancers' rigs + the wands |
| the fog on a party night (`atmd-fogparty`) | 21.6 / 25.9 | 33.4 · 66 % | 16.3 | the veils + halos over the crowd |
| the blizzard (`atmb-blizzard`) | 15.6 / 22.4 | 33.4 · 24 % | 10.3 | the soft flakes (ATM-C's +10 % holds) |
| dense fog (`atmb-fog`) | 6.6 / 14.6 | 16.8 · 0 % | 6.1 | cheap (ATM-B's halo cap held) |
| the storm (`atmb-storm`) | 10.6 / 13.5 | 16.8 · 0 % | 6.4 | cheap |

**The headroom at the party peak.** On this machine at 2× there is none (every party scene is over 50-ms frames at tier 2 — the laptop-class
early warning, as always). On the owner's iPhone the bench's PROFILE read the break at 59 fps / 5.6 ms work; the finale adds nothing measurable
to the main thread here, so the phone's remaining headroom is the GPU's — only his `&bench=1` run (fw-party, the frame side) can state it.
**The crowd is the whole story**: the peak costs 2.4× a plain night, the break 2.9×.

### A2. The steady-state profiles (8 s at tier 2, 2× CPU; self time) — what is drawn, not computed

- **The dancers** (`sp-break`): `folk.js` 1,053 ms of 9,302 — `body` :646, `jointsOf` :226, `leg` :650, `armP` :660, `hat` :879, `lit` :595,
  `arm` :371, `rgb` :21 (the rig re-derived + re-coloured per figure per frame); `wands.js#drawWands` :162 301 ms; `harbor-people.js#pointAt`
  :576 87 ms + `folkAt` :962 + its LRU `get` :967; native `fill` 328 + `stroke` 109 + `drawImage` 854. The party peak (`p10-party0`): `folk.js`
  700 ms, `road.js#word` :259 149 ms, `dress-halloween.js#drawLegs` :647 48 ms (the spiders — every party frame in October).
- **The GPU engine:** `fireworks.js` appears in NO profile (`fw.draws` = 3 a frame, ~0 ms of JS). PART 10's design holds.
- **The blizzard:** `snowfx.js#flakeArt` :20 181 ms + `draw` :67 135 ms in 8 s — `flakeArt` is a cache LOOKUP that still costs 23 ms/s because
  its key is a string built from `(col, d, v, sm)` per flake per frame; `xlights.js#paintXLights` :29 54 ms (the C9 strings, Dec 15);
  `glasswx.js#drawSign` :394 38 ms (the snow on the sign).
- **`road.js#word` :259** — the crossing's WAIT / WALK lettering drawn with `measureText` + `fillText` + a glow every frame (149 ms of 9.4 s at
  the peak, 121 in the break, 80 in the blizzard: 0.8–1.6 % of every frame). A two-state sprite per tier dpr makes it ~0.
- **The measurement's own artefact:** every steady window shows ONE 1.4–1.6-s gap in its first second (`np-night` too): V8's profiler starting
  (the `(program)` share 2–3.5 s of 9). Not the city — and `p10-snow`'s title-perf p95 above is the same artefact caught in the window.

### A3. THE LOAD FREEZE — the owner's fog + blizzard links (a fresh load, 4× CPU, 402×874 DPR 3; the first 12 s profiled)

| link (`?city=2&…`) | reveal | longest frame gap | stalls ≥ 250 ms (20 s) | long tasks (20 s) | the biggest tasks |
| --- | --- | --- | --- | --- | --- |
| a clear night `when=2026-11-03T21:30&wx=clear&debug=1` | 4.5 s (late) | 2.7 s at 1.3 s | 11 | 77 (14.2 s) | 1.7 s at 2.5 s · 1.7 s at 4.3 s · 1.5 s at 7.6 s · 1.1 s at 1.4 s |
| fog `force=fog&debug=1` | 4.6 s | 2.6 s at 1.2 s | 9 | 79 (12.9 s) | 1.6 · 1.1 · 1.0 · 0.7 s |
| **fog, no `&debug=1`** | 4.5 s | 2.2 s at 0.9 s | 7 | **56 (7.9 s)** | 1.2 · 1.0 · 0.5 · 0.5 s — **the bakes done at 10.2 s (16.5 s with the readout)** |
| **the blizzard** `force=blizzard&debug=1` | 5.5 s | **4.6 s at 8.4 s** | **21** | 73 (**21.4 s**) | **4.5 s at 8.6 s** · 2.7 s at 2.1 s · 1.4 s at 7.1 s · 1.1 s |
| **the blizzard, no `&debug=1`** | 4.6 s | **3.0 s at 0.9 s** | **6** | **74 (11.7 s)** | 1.9 · 1.1 · 1.1 · 0.4 s — **the 4.5-s stall at 8.5 s is GONE**; what is left is the clear night's load + the Christmas wire (672 ms) + the frost pane (245 ms) |
| the storm `wx=storm&force=strike&debug=1` | 5.6 s | 3.2 s at 1.2 s | 9 | 89 (15.1 s) | 2.2 · 1.2 · 1.1 · 1.0 s |
| the party at 22:00 `force=finale&debug=1` | 6.2 s | 3.4 s at 0.9 s | 10 | 61 (14.2 s) | 2.6 · 1.6 · 0.9 · 0.9 s |

(Warm = cold within noise on every scene: the cache is not the cost. "Reveal late" everywhere: the gate waits for the bake + the clouds and
gives up at ~4.5 s by design.) **The bakes finish ("ready") at 16–18 s at 4× with the readout on; the first 12 s are 60–75 % long tasks** —
the owner's "slowdown in the first seconds" is on every link, the blizzard's the worst. Where the first 12 s go (self time at 4×; ÷ ~4 for the phone):

| what | clear | fog | blizzard | file:line | verdict · fix · size |
| --- | --- | --- | --- | --- | --- |
| **THE PIXEL WATCH** (`&debug=1`: the load log's `pix` rows) | 160 ms | 159 ms | **3,226 ms + the 4.5-s stall** ("the city stalled 4509 ms (the loop restarted (watchdog))" at 11.9 s) | `scene.js:2918 pixWatch` — `drawImage(canvas, 0, 0, 12, 24)` + `getImageData` 4× a second from 1 s after the reveal (`:2919`), gated only by `debugTool('readout', DEBUG)` (`:2901`) | **a GPU read-back**: `getImageData` on a canvas the GPU is still drawing into waits for every queued draw; in the blizzard (the flake sprites, the frost pane, the C9 wire baking) that is the freeze. Read the 12×24 from a 1× copy the scene draws itself at the end of its frame, or start the watch once `baker.pending` is false, or a TOOLS switch. **S** |
| **THE DEBUG READOUT as a whole** | fog: 12.9 → 7.9 s of long tasks without it; ready 16.5 → 10.2 s | | | `scene.js:2901` readout + loadStrip + pixWatch + `ui/debug-strip.js` DOM twice a second | the owner judges the load with the instruments on. Keep the readout; move its text-building off the load window (first 15 s: once a second) — or accept and READ the load with the bench's load-freeze line instead (which runs without the strips). **S** |
| **THE CHRISTMAS WIRE** | — | — | **1,227 ms** | `title.js:247 pt` inside `xmasWrapSvg` (:235, called at `:1141` for `hol.id === 'christmas'` — Dec 15 is the build-up): `getPointAtLength` every 1.4 units along every letter's tube path, on the main thread at mount | bake the wire's points once per letter set (a JSON beside the logo, or trace after the reveal under `requestIdleCallback`). Not a City 2.0 file: both cities pay it on every December load. **S** |
| the people's PLAN at load | 1,478 ms | 1,145 ms (845 without the readout) | 848 ms | `harbor-people.js:245 segRect` 346–446 ms, `:265 route` 130–225, `:258 inRect`; `harbor-crew.js` 200–358 | the promenade's first ~70 s of blocks planned in the first frames (visits routed round THE SOLIDS: `segRect` is the hot leaf). Spread the warm-up: plan one block a frame behind the bake pump (the LRU already warms 70 s ahead, `FOLK_CACHE`). **M** |
| `Intl.DateTimeFormat` per call | 743 ms | **829 ms** (451 without the readout) | 270 ms | `core/sky.js:51 localParts` — `new Intl.DateTimeFormat(…)` on EVERY call, then `formatToParts`; callers `look` :466 (every 2.5 s), `sunTimes` :122, `sunArc` :144, the planners + the panel | cache the formatter per zone + memo the parts per (zone, minute). **S** |
| the clouds' bake | 332 ms | 514 ms (`n3` :40, `fbm3` :48, `layerField` :253) | — | `clouds.js` | by design (DT2's time slices) — keep |
| the lit layers + the tubes' sprites | 490 ms | 268 + 216 + 287 | 125 | `canvas-safe.js#blit`, `tubes.js#drawLit` :48, `lights.js#drawLit` :67 | the bake pump at `bakeMs × 3 + 2` before the reveal (`scene.js:2327`) — by design |
| the frost pane | — | — | 314 ms | `district/frost.js:22 bake`, `:96 pane` — a whole-screen 2× canvas baked at load in freezing weather | FR4's H18 still open: size it to the glass; bake it after the reveal. **S** |
| `title.js`'s own mount | 273 ms | 273 ms | 1,514 ms (the wire) | `mount` :332, `tagShade` :640, `title-dock.js#pick` :115 | fine |

The phone bench's load-freeze line should show the same shape at ~¼ of these numbers (the blizzard's one long stall ~1 s on the iPhone).
**The single fix with the biggest gain is #1**; then the readout's cadence during the load, the Christmas wire, `localParts`, the plan's warm-up.

### A4. Work that runs when nothing on screen needs it

| # | what · where | why it matters | fix | gain | risk | size |
| --- | --- | --- | --- | --- | --- | --- |
| A4.1 | **TWO fireworks engines on `&force=fireworks`**: `district/fx.js:203` `s.force.has('fireworks') \|\| (dark > 0.5 && hol && (nye \|\| july4))` fires City 1.0's 2D rockets (`Math.random()`, unseeded) in the Harbor's sky layer — called from `scene.js:2405 fx.back(c, fs)` with `fs.force = clock.force` (`:1695`); the profile: `district/fireworks.js:68 draw` 151 ms + `fx.js:143 back` 32 ms of 9.2 s in `p10-snow` | the bench's fw-week / fw-snow and title-perf's p10-week / p10-snow carry a phantom engine (~2 % of the frame; a different sky on every phone); on a real night nothing fires (no flag) — until NYE / July 4, when the OLD rockets fire on their own behind the skyline | strip `fireworks` (+ the holiday ids once 11b lands) from the force set the sky fx gets — the same line that strips `witch` / `bats` (`scene.js:2405`) | honest bench numbers | none | S |
| A4.2 | `road.js:259 word` — WAIT / WALK via `measureText` + `fillText` + glow every frame | 0.8–1.6 % of every frame (A2) | a two-state sprite at the tier's dpr | −0.1–0.3 ms a frame | none | S |
| A4.3 | `snowfx.js:20 flakeArt` — a string key per flake per frame | 181 ms / 8 s in the blizzard (2.3 %) | hold the sprite on the flake (`b.spr`), re-pick on a colour change | −0.2 ms a frame in snow | none | S |
| A4.4 | gradients built every frame in `draw()`: `scene.js:2397` (the sky's night glow, every night frame), `:2738` (the party wash, every party frame), **`:2813–2818` a `createLinearGradient` PER TREE per frame** (the grates' dark band) | ~6 gradient objects a frame + GC | cache by `(y1, HZ, nk 1/32)`, `(yR, H0, pk 1/32)`, per tree `(x, w, dpr)` | small, sure | none | S |
| A4.5 | `scene.js:2855` — `snowfall.draw(c, { ...snowEnv(), layer: 'near' })` is not gated on snow > 0: `snowEnv()` + a spread every frame of every scene, then `snowfx.js:72` returns | GC churn | gate on `LK.snow > 0 \|\| SN.cover > 0` like `:2766` | ~0 | none | S |
| A4.6 | per-frame allocations in `draw()`: `:2564 neon.signLights().map` (foggy frames), `:2788 speak.windows().filter().map()`, `:2765–2767 L.trees.map` + `[…].filter(Boolean)` (snowy frames), `{ ...nf, off: true }` ×4 (2488, 2510, 2597, 2661), ~35 env literals a frame | GC, not CPU — pool only if a profile shows GC (it shows 2–3 % today) | — | — | none | S each, later |
| A4.7 | `window.devicePixelRatio` read in frame paths: `scene.js:800` (fwTick), `:2755`, `:1778`, `:1818` | cheap; `dpr` is a closure value | use `dpr` | ~0 | none | S |
| A4.8 | the scene's own 2D fallback `fw.draw(c, dt, S.motion)` (`:2448`) every frame | a loop over 0 shells — fine | gate on `fw.count() > 0` | ~0 | none | S |

Verified NOT wasteful (each early-returns when its thing is off): `fireworks.js:371` (frees the GL layer 4 s after the smoke), `lightning.js:124/142`,
`stormdeck.js:195` (+ the scene gate `:2437`), `fogdepth.js:87–89` (`frame` :78–83 recomputes `fogColours` + a `look` object at fog 0 — cheap),
`snowfx.js:72`, `rainfx.js:111/129` (called ungated at `scene.js:2849`, both bail cheaply), `icefx` + `wetground` gated in the scene (`:2619/2758`,
`:2679`), `skybeams.js:146`. No cache keyed per frame (grep `${t}` / `${now}` / `Math.round(t *` in keys: 0); no layout read in a frame path
(`:1034` in `layout()`, `:3555/3563` in `onResize`, `:1727` behind a `W×H|laneKey` key) — verified.

### A5. WebKit — the frame side on the owner's engine (402×660 DPR 3, held at tier 2, two 8-s windows a scene)

Playwright's WebKit on Windows rasterises the canvas in the web process (no GPU; WebGL in software), so its "work" ≈ JS + raster — close
to what the iPhone's GPU process spends on the canvas (SKY-B found Safari rasterises canvas draws with CoreGraphics on the CPU), while its
absolute frames (60–110 ms) mean nothing. **The ratios are the finding** (the second window of two, 8 s each; work = ms a frame):

| scene | work (ms) | vs a plain night | canvases (n / MB) | what it says |
| --- | --- | --- | --- | --- |
| a plain night | **16.1** | 1.0× | 245 / 62.7 | |
| the party peak, no show | 29.3 | 1.8× | 561 / 71.8 | |
| the party finale | 31.3 | 1.9× (+2 ms for the show — WebKit's WebGL is software here; on the iPhone it is the GPU) | 576 / 74.9 | |
| the conga break | **40.2** | **2.5×** | 527 / 70.8 | the heaviest, as in Chromium |
| Halloween's party break | 27.5 | 1.7× | 573 / 71.4 | the costumes cost ~0 beside the dancers |
| **dense fog** | **28.7** | **1.8×** | 234 / 53.2 | **in Chromium fog was 0.6× — the veils + halos (big soft gradients) are expensive on a CPU rasteriser**: the phone's fog number to read off the bench |
| the blizzard | 29.1 | 1.8× | 276 / 59.6 | the flakes + the frost + the wire |
| the weeknight show | 31.1 | 1.9× (software WebGL — not the phone's number) | 266 / 64.2 | |

The load in WebKit (no CPU throttle): the first frame at 0.8 s on every scene, the longest gap 263–687 ms (the blizzard's at 2.9 s), 1–3 stalls ≥ 250 ms — the
blizzard again the worst. **For PERF:** the crowd's 1.8–2.5× agrees with Chromium's 2.4–2.9×; the fog's 1.8× on a CPU rasteriser is new — if the owner's bench
fog scene reads slow, the fog's whole-sky veils (fogdepth.js `veil`) and the signs' halos are the place (fewer, larger, pre-blended strips instead of per-frame gradients).

---

## B. MEMORY + THE CANVASES

### B1. The soak — a Saturday 21:57 → 22:09 through the 10 pm show, tier 2, Chromium with the GPU, every 30 s (every live canvas tracked by its creation site)

| min | frames / 30 s · p50 / p95 ms | long tasks (cum.) | heap MB | DOM nodes · `<canvas>` elements | live canvases (n / MB) | `canvasMb()` (n / MB) | the bakes MB |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0.0 (21:57) | (settling) | 0 | 59.5 | 775 · 15 | 553 / 93.4 | 548 / 89.5 | 45.7 |
| 1.0 | 1418 · 16.7 / 33.4 | 1 (52 ms) | 72.8 | 775 · 15 | 643 / 96.8 | 638 / 92.9 | 46.5 |
| 2.5 | 1373 · 16.7 / 33.5 | 1 | 80.7 | 775 · 15 | 657 / 96.9 | 652 / 93.0 | 46.6 |
| **3.0 (22:00 — the show starts)** | **965 · 16.8 / 100.1** | 3 (231 ms) | 81.9 | 776 · **16** (the GL layer) | 667 / 98.8 | 662 / 95.0 | 45.9 |
| 4.5 | 1729 · 16.7 / 17.3 | 3 | 66.4 | 776 · 16 | 683 / 99.1 | 678 / 95.2 | 46.0 |
| 6.5 | 1801 · 16.7 / 16.9 | 3 | 65.7 | 776 · 16 | **690 / 99.2** (the peak) | 685 / 95.3 | 46.0 |
| 7.0 (the finale over) | 1801 · 16.7 / 16.8 | 3 | 61.9 | 776 · 16 | 654 / 98.8 | 649 / 94.9 | 46.0 |
| 9.0 (the smoke gone) | 1795 · 16.7 / 16.8 | 3 | 89.8 | 775 · **15** (the GL layer freed) | 665 / 96.2 | 660 / 92.4 | 46.0 |
| 12.0 (22:09) | 1797 · 16.7 / 16.8 | 4 (292 ms) | 78.3 | 775 · 15 | 685 / 96.6 | 680 / 92.7 | 46.0 |

**No leak.** The canvases fill from 553 to ~690 in the first five minutes (the party's sprite caches warming: the sky beams' 96 colours, the tubes'
111 sprites) and then sit at 654–690 / 96–99 MB through the show, the finale and after; the heap is a GC saw-tooth 51–90 MB with no slope; the DOM
holds at 775–776; `setInterval`s open 10–11 the whole time; the GL layer is one `<canvas>` that appears at 22:00:00 and is gone by 22:06 (`fireworks.js:371`
frees it 4 s after the smoke). **The readout agrees with the WeakRef census within 5 canvases / 4 MB** (`canvasMb()` 680 / 92.7 vs 685 / 96.6 —
FR4's H19 is fixed; the 4 MB gap is the district modules of C2c). By creation site at the end: `bake.js:16 mk` 20 × 30.5 MB (the two bake sets),
`tubes.js:167 sprite` 111 × 8.6, `skybeams.js:61 spriteFor` 96 × 6.3, `signdress.js:143 mk` 2 × 6.2 (Halloween's dressing at the tier's dpr — H17
done), `dom.js:10 h` 1 × 5.6 (the main canvas), `wheel.js:62` 37 × 4.4, `scene.js:3318 pair` 2 × 4.3.

**The show's first half-minute costs frames**: 965 frames in the 30 s that held 22:00:00 (p95 100 ms) against ~1,400 before and 1,800 after —
the GL layer's init (`fireworks.js:207` compiles two programs + uploads the mask), the takes' decode + pin (`scene.js:774 fwSoundTick` fetches 9
slots × 8 takes from 30 s before) and the crowd's re-plan as it stops to look up land in the same seconds. On the phone that is the "hitch when the
show starts" to look for in the bench's fw-party line; a fix is to `init()` the GL layer at T−20 s (the engine already knows the show is near:
`fwShowsNow` includes `t0 − 20`) instead of on the first shell. **S.**

**Watched, not a leak:** ~12.7 `setTimeout` calls a second on a party night (380 per 30 s, every one firing — not cleared, not open). Churn from the
sounds' scheduling (`sounds.js:570`) and the UI; harmless, but a caller worth naming in PERF's readout (S).

### B2. The 20-cycle memory check

ATM-A found the growth (+6.2 MB of V8 compiled code against +0.35 MB of objects) and the check now reads the heap WITHOUT code
(`harbor-e2e/kit.mjs:118 heapNoCode`) under the same 6-MB limit — it read 0.9 MB locally in ATM-A and **heap +1.0 MB (+ 5.3 MB of compiled code, not counted), the offscreen canvases 13.86 → 13.86 MB** in this review's 4-shard run in this review's full runs. The owner's
question ("what grows per title ↔ setup trip") is answered: the JIT's code, which grows with how long and how fast the page ran, not with the cycles. The
limit is honest now; nothing to set.

### B3. Canvases outside the count (the memory guard's blind spot — FR4 H19's gap)

`js/screens/harbor/` has **0 raw `getContext(`** — every Harbor context goes through `safeCtx` / `ctx2d` / `glCtx` (verified). But the Harbor still
imports City 1.0 modules with their own `mk()` + raw `getContext('2d')`, outside `canvasMb()` (`ui/canvas-safe.js:54`): `district/stars.js:82, 87` (the
stars, 3.5 MB — `scene.js:29`), `district/fx.js:18, 44, 68, 437` (`:30`), `district/sun.js:264–418` (imports canvas-safe yet calls `getContext` 9×; `:31`),
`district/fireworks.js:15` (`:32`), `district/rainbow.js:87–215` (`:37`), `district/frost.js:10, 26` + `district/weather-fx.js:53–249` (lazy, `:880`),
`district/aircraft.js:79, 81` (`air.js:18`, suspect). 14 copies of `mk` across `district/`. **Fix:** one `ui/canvas-safe.js#mk(w, h)` and the six
modules switched to it — the guard then counts the whole picture. **S.**

---

## C. CODE HEALTH

### C1. `scene.js` — THE SPLIT (3,891 lines / 397 KB; one closure `createHarbor` 159–3892; 190 commits since Oct 20 — ~16 a day; 6 of the last 12 pass commits)

**Measured:** 476 closure-level declarations — 153 functions, 207 consts (53 of them `createX(…)` subsystems), 116 `let` statements declaring 309
variables; `draw()` = **2314–2902 (589 lines)** with four section markers (the sky 2370, the city 2454, the hero pieces 2582, the weather 2848); the
`harbor()` API object (3693–3892) carries 52 keys.

**The shared-state problem is smaller than it looks.** Counting the closure functions that touch each `let` (of 250 incl. arrow consts): `L` 49, `LK` 49,
`W` 32, `cam` 25, `tier` 22, `legends` 21, `shownAt` 21, `WXS` 17, `dpr` 16, `DK` 16, `H` 13, `P` 11, `bakeTones` 11, `WF` 10, `LB` 10, `t0` 10, `SN` 10,
`dprTier` 8, `destroyed` 8, `fastUntil` 8 — everything else ≤ 6. **The file is ~20 globals wide, not 309**, and those 20 are exactly the frame's inputs:
the layout (`L` `cam` `W` `H` `dpr`), the look (`LK` `DK` `bakeTones` `P`), the weather (`WXS` `WF` `SN`), the tier (`tier` `dprTier`), the legend
(`legends` `LB`), the clock (`t0` `shownAt`). So every cut module is a factory taking ONE `ctx` object that holds those by reference (`ctx.L`, `ctx.LK`… —
assigned by scene.js, never copied) plus the subsystems it owns.

**The map** (closure-level functions by concern, current lines):

| concern | lines | what lives there |
| --- | --- | --- |
| boot + the dressings (lazy) | 160–276 (`dressTick` 214, `hpropsEnv` 241, `paradeItems` 247, `hpropsDraw` 266) | the sign dressing, the ghost ship, the holiday props, the parade |
| the light modes + the legends' wiring | 282–384 (`linkGate` 311, `needLegends` 336, `legendSoundsWarm` 352, `wetReflect` 364, `legendSoon` 378) | |
| the drain + the dark city + the raid | 385–580 (`drainGeoFor` 397, `drainCity` 439, `darkStart` 471, `darkPump` 491, `veilFront` 510, `raidPlanNow` 544, `raidSounds` 571; `WXS` 526, `WF` 530) | |
| the sounds + THE LOAD LOG + the load gate | 581–629 | |
| **the fireworks (PART 10)** | 630–813 (`fwSignJoins` 636 … `fwTick` 790) | the shows, the sounds, the overlay's tick |
| the weather sources | 821–937 (`iceEdgesNow` 837, `extrasT` 877, `wxNow` 899, `climateNow` 912) | |
| the holiday + xmas + the forced-moment sync | 939–1019 (`holidayTick` 946, `duskFor` 985, `workTraceNow` 1001) | |
| **the camera + layout + the bake plan** | 1020–1240 (`rects` 1021, `build` 1033, `layout` 1041, the band tops 1128, `archFor` 1152, the snowpack 1196) | the one place the camera is made |
| the crisp layer | 1239–1360 (`roofCrisp` 1258, `liveWinCrisp` 1293, `crispTick` 1309) | |
| the snowman + the weather env + the sway + `weatherTick` | 1362–1553 | the frame's weather inputs |
| the lamps' life + the party wash + the board sync | 1560–1631 | |
| the people + wildlife inputs + the clock | 1632–1722 (`harborClock` 1642, `legendForPeople` 1661, `peopleEnv` 1699) | |
| the Blackbird / Mothman / helicopter | 1723–1892 (`bbTick` 1736, `mmTick` 1812, `cityCut` 1830, `heliAvoid` 1841) | |
| the window moments + the speakeasy bake + the look | 1893–2053 (`speakCtx` 1921, `rebake` 1935, `rebakeLights` 1985, `refreshLook` 2010) | the bake keys |
| the rainbows + the party | 2055–2146 (`bowTarget` 2058, `partyTick` 2085, `startFinale` 2140) | `PT` |
| the frame loop + the stall + the report + the tower | 2148–2311 (`frame` 2149, `frameGap` 2189, `towerTick` 2210, `reportText` 2241, `fastNow` 2285) | |
| **`draw()`** | 2314–2902 | |
| the debug strips + the readout | 2906–3020 (`pixWatch` 2918, `readout` 2976) | |
| the hero pieces' frame + the water + the halos | 3023–3211 (`harborFrame` 3035, `drawWater` 3123, `signHalo` 3141) | |
| THE PREVIEW PANEL + the events | 3212–3370 (`realCity` 3223, `applyRemote` 3241, `eventsTick` 3348) | |
| **the tiering / perf** | 3372–3515 (`perf` 3399, `judge` 3474, `stepTier…` 3492) | |
| the loop's wake / resize / reveal / fonts | 3516–3692 (`wakeLoop` 3527, `onResize` 3554, `tryReveal` 3582, `fontsReady` 3615) | |
| the API + `memAll` | 3693–3892 | |

**The cut** — seven modules, each `createX(ctx, deps)`:

1. **`scene-fireworks.js`** (630–813, ≈ 185 lines) — owns `fwx`, `fwState`, the show memo; reads `ctx.LK / W / H / tier / WF / shownAt` + `clock`;
   exports `{ tick(nowS), soundTick, crowd(), shows(), lights(), joins() }`. Leaf-most (`fwState` is read by 8 closure functions).
2. **`scene-legend.js`** (332–520 + 1661–1677 + 1736–1892: the legends' wiring, the drain / dark-city bakes, the Blackbird / Mothman / helicopter) —
   owns `legends`, `LB`, the drain canvases; exports `{ tick, pow(x, group, seed), dim(), dead(), forPeople(), bbTick, mmTick, heliAvoid, heliOcc }`
   (`legendPow` is called ~10× inside `draw` — keep the name).
3. **`scene-weather.js`** (526–530, 821–937, 1192–1234, 1362–1553: `WXS` / `WF` / `SN`, the sources, the snowpack, the sway, `weatherTick`, `snowEnv` /
   `rainEnv` / `rainLights`) — owns the rain / lightning / ice / fog / snow / wet modules; exports `{ tick(dt), env: { snow(), rain(fs, which), lights },
   sway: { plan, layer, trees }, lines() }`. **WF is created here only and handed down as `ctx.WF`** — THE WIND stays one state by construction.
4. **`scene-holiday.js`** (160–276, 939–1019) — owns `HS / HP / HR`, `dress`, `hprops`, `parade`; exports `{ tick, env(fadeIn, lit, mon), draw(pass), items(fadeIn) }`.
5. **`scene-party.js`** (1560–1631 + 2055–2146) — owns `PT`, `bow`, `beat`; exports `{ tick(dt), PT, bowTarget, startFinale, punchAt }`. **Do it WITH H8**
   (one `PT.party` boolean, C3) or the cut only relocates five thresholds.
6. **`scene-perf.js`** (2148–2311 + 3372–3568: the frame loop, the stall, `fastNow`, `perf`, the tier steps, `wakeLoop`, `onResize`) — owns `tier`,
   `dprTier`, `costs`, `tierLog`; exports `{ start, stop, frame, stepTier / Down / Up / To, snap(), tiering() }`; takes `draw` + `build` + `applyFx` as callbacks.
7. **`scene-panel.js`** (3212–3370 + 2906–3020: `realCity`, `applyRemote`, `neonMoments`, the events, the readout) — exports `{ apply(state), readout(), eventsTick, drawEvents }`.
8. **scene.js keeps** the state + the layout + the bake plan (1020–1240), the crisp layer, the bake keys (1893–2053), `draw()`, the hero frame + the water
   (3023–3211), the reveal / fonts / API ≈ 1,600 lines. **Then `draw()` is quartered** along its four markers into `drawSky(F)`, `drawCity(F)`, `drawHarbor(F)`,
   `drawWeather(F)` in the same file (its locals `fs`, `nf`, `fadeIn`, `deadCity`, `fogOn`, `pplEnv` become one `F` object made at 2314).

**THE ORDER** (leaf-most first; each step = `pixdiff.mjs` against a worktree on :5174 (night, party, noon, golden, halloween, the `-nc` pair) +
`ONLY=perf` under the baseline guard + the touched e2e group — nothing else): **fireworks (1) → legend (2) → holiday (4) → weather (3; it touches the
most draw sites: 2436–2446, 2497–2501, 2607–2619, 2679, 2766–2767, 2849–2867) → party (5, with H8) → perf (6) → panel (7) → the draw() quartering.**
THE SOLIDS / THE TIMETABLE / THE TIER TABLE / THE LIGHT are imported pure modules nothing in the cut re-implements. Each of 1–7 is **M**; the quartering
**L**; the whole ≈ 2 days — PERF does 1–3 (the files its own work lands in) and leaves the rest to the next passes, one cut each.

### C2. The standing rules, bypassed

**(a) THE CITY TIMETABLE** (`core/harbor-schedule.js`, 36 rows): importers **12 modules** — scene, air, boxer, mothman; harbor-blackbird, -boxer, -fireworks,
-heli, -moments, -mothman, -routines, -streetparty. **Every system built since Oct 29 reads it — no new stray** (verified). What still carries its own clock
(the pre-Oct-29 systems "listed with `src`, migrate at SCHED" — not started): `core/harbor-workers.js:27–110` (a second timetable: `EVERY`, `at: 21.0`, the
windows), `core/harbor-holiday.js:114–133, 189–196, 242` (trick-or-treat `< 21.25`, zombies `>= 20`, the parade `8.5–11.6`, pies, tables, monarchs),
`core/harbor-people.js:121–141, 341–350, 1530–1533` (the weekend `dow === 5 && h >= 17`, late `h >= 22 || h < 1`, Sunday, the roof crowd, the gardener),
`core/harbor-promenade.js:317–318` (the hourly density ladder), `core/harbor-traffic.js:50` (the day / evening / late / party bands), `core/harbor-wildlife.js:110,
387`, `core/harbor-xmas.js:50`, `core/harbor-speakeasy.js:51–52, 121–123`, `core/harbor-show.js:380` (`nightStage` 22 / 1 / 12), `core/harbor-routines.js:60`,
`core/harbor-ghost.js:53–88`, `core/harbor-cabs.js:41–49`, `screens/harbor/winterfolk.js:25–28, 156–161`, `air.js:820`, `window-rooms.js:163`,
`window-paint.js:11, 328, 339`, `wheel.js:34/38`, `lighthouse.js:24`. **The one to fix now: `core/harbor-moments.js:97`** — `((dow === 5 || dow === 6) && h >= 19.5) ||
((dow === 6 || dow === 0) && h < 2.25)` re-derives the party evening beside the timetable's `party.night` row (`from: 20`) — **two definitions of the same night**.
~20 systems carry a time of day, 12 read the table; the migration = one row per system with its numbers as `knobs`. **S** for moments.js, **M** for the sweep (SCHED).
`setTimeout` / `setInterval` in Harbor code are mechanics only (`scene.js:877` extras, `:3549` watchdog, `:3560` resize; `sounds.js:570`) — none a city time.

**(b) THE TIER TABLE** (`core/harbor-tiers.js`, 19 rows; `tierVal` imported by 7 files). **29 files still compare `tier` to literals at ~120 sites** (neon.js ×27,
boats.js ×12, water.js ×9, glasswx.js ×8, birds ×4, moon ×3, legends ×4, lighthouse ×5 — the legacy painters). **Post-table strays (new code), verified:**
`fogdepth.js:143` (`tier < 1 && which !== 'road'`, Oct 31 — its own comment at :110 says "the tier table's count"), `legends.js:494` (`tier === 2 ? 70 : tier === 1 ? 44 : 22`
in a file that imports `tierVal`), **`scene.js:150 TIERS = [{ dpr, bakeMs }…]` — the scene's own three-row tier table beside harbor-tiers.js** (read at `:1036`,
`:2327–2341`), `scene.js:225` (`dressDpr: [1.5, 2, 3][dprTier]`), `:2531` (`tier === 0 ? 0.8 : 0`), `:3046`. **Fix:** `TIERS`' dpr / bakeMs / dressDpr become
harbor-tiers rows; the four new sites → `tierVal`. **S**; the legacy sweep **M** (PERF's "tier-table migration").

**(c) Canvases:** see B3 — 0 strays in `js/screens/harbor/`; the district modules the Harbor imports are the gap. **S.**

**(d) THE WIND** (`core/harbor-wind.js`, Oct 31): 7 importers; `WF` reaches (scene.js) the holiday props 242/255, the fireworks 800, the snow 1401, the rain 1405,
the sway 1446, the people 1707, the weather 2412, the fog 2497, the snowfall 2766–2767, the leaves 2831, the water 3133 — verified. **Still blowing their own
wind (verified):** `air.js:317` (its own `sin(windDir) × min(10, wind) × 0.3` — the contrails / balloons), `chimneys.js:74` (`LK.wind` / `LK.windDir` for the
smoke's lean — though `hpropsEnv` already hands it `wind: WF.v(0.5)`), `dayfx.js:74` (`f.LK.wind` — the flags + glints), `clouds.js:603` (`windX(LK)` — the mean
wind, no gusts), **`banner.js:152` (a synthetic `gust = 0.72 + 0.28·sin·sin` — not the wind at all)**. **Fix:** `windF: WF` in the four env objects, `WF.v(u)` /
`WF.at(u)`; delete the banner's sine. **S.** (`harbor-weather.js:136`'s smoothing is WF's INPUT — fine.)

**(e) THE LIGHT:** one model — `harbor-light.js` is imported by 19 files; `stage.js:72–73, 220–221` draw the pools from `REACH` / `IMPLIED_LIGHT`;
`roadlight.js:43` = `roadLampAt`; `lightField` is the one field. Two adjacent models by design, flag only: `core/harbor-rooms.js:51 lampPool` (the window interiors)
and `raid.js:62 pool` (the raid's wash). FR4's dead lamppost painters (H1) are gone. **Healthy.**

**(f) The force flags:** `node --test tests/harbor-remote.test.mjs` → 9 / 9. An independent scan of every receiver (`*force`, `off`, `f`, `ff` across harbor +
core/harbor-* + core/city-* + title / audio) against the live registry's 275 ids: **0 strays**. One gap in the TEST: its regex (`tests/harbor-remote.test.mjs:117`)
matches `clock.force|force|off|f|ff` only, while the code also reads flags through `s.force` (8 sites), `f.force` (5), `fs.force` (3), `w.force` (2), `ctx.force`
(1) — all registered today, but a new stray through those receivers would pass. **Fix:** `[\w.]*force` in the regex. **S.**

### C3. FR4's health list — what stands (counts today)

| # | status | now |
| --- | --- | --- |
| H1 the lamppost painters | **done** (C4d) | |
| H2 the radial-glow caches | **stands, grew** | 16 private glow Maps (air.js:196/294, blackbird:119, centre:35, chimneys:20, clouds:659, drones:32, fogbeam:25, fogdepth:45, glasswx:79, mothman:41, skybeams:26, strings:50, vehicles:589, windows:40, moon:126); **190 `createRadialGradient` in 74 files** (was 170 / 60); no `ui/glow-sprite.js` — the `glowSprite` helper lives in `vehicles.js:593`. PERF's cheap win: one cache keyed by `(col, stops, size)` |
| H3 the night thresholds | **stands** | 57 sites of `(night\|k\|dk\|lit) > 0.3 / 0.4` in 14 painters (window-paint.js 11, neon 4, air 4, wheel / people / lighthouse / icefx / holidayprops / folk 3 each); `harbor-dark.js` read by 8 modules only |
| H6 `mix` / `clamp01` / `smooth` / `rgb` copies | **stands, grew** | `clamp01` 88 files, `smooth` 30, `mix` 20, `rgb` 18, `lerp` 14 — 170 copies of five one-liners (`shapes.js:5–7` exports three, 26 importers) |
| H7 the RNG copies | **stands, grew** | **44 sites in 30 files**: mulberry32 ×5 (balloons:25, drones:24, glasswx:25, moon:27, wands:32); FNV-1a ×4 (wands:31, harbor-boxer:236, harbor-dark:119, harbor-roofmodes:24); the `374761393 / 668265263` 2-D hash ×6 (snow:77, speakeasy:36, wands:155, wheel:223, harbor-show:134); the `0x9e3779b9 / 0x85ebca6b` hash ×6 (ghostship:22, window-rooms:14, harbor-ghost:14, harbor-holiday:85, harbor-moments:379, harbor-flight:18); sin-hash ×6 (fauna:474, glasswx:264, lighthouse:26, moon:338, rays:52, water:37); Knuth ×6 (air:349/423, clouds:637, vehicles:105 = harbor-traffic:31, harbor-clouds:332, harbor-wind:42); an LCG icefx:13 — while `core/rng.js` exports `hashString`, `rngFrom`, `randInt`, `pick`, `shuffle` and no 2-D hash. **Fix:** `rng.js#hash2(a, b)` + `hash01(n, salt)`. S–M |
| H8 "is a party night" | **stands, grew** | `PT.on >` in scene.js: `> 0` ×18, `> 0.02`, `> 0.05` ×2, `> 0.3` ×6, `> 0.5` ×8 — 35 sites, five cuts; `harbor-moments.js:97` + `harbor-legend.js:42` re-derive the evening. One `PT.party` — with the `scene-party.js` cut |
| H9 the vehicle kinds mirrored | **stands, diverging** | `core/harbor-traffic.js:26–28` "mirrors vehicles.js#vehicleFor" — `vehicles.js:99–103`'s `SEQ` now has `back` + `street` keys while traffic's is a flat array (suspect) |
| H10 the import cycles | **stands, grew** | `harbor-people.js` imports 15 harbor-* modules; **11 import it back** (cabs, crew, holidayfolk, legend, parade, promenade, raid, routines, solids, traffic, witness; was 6) |
| H11 the course loop twice | **stands** | `stage.js:82–105` vs `street.js:143–175` |
| H17 the dressing's dpr | **done** | `signdress.js:134–136` reads `env.dressDpr` |
| H18 the frost pane | **stands** | `district/frost.js:23` whole-screen `min(2, dpr)` — A3's 314 ms at load |
| H19 the memory readout | **mostly done** | `canvasMb()` + the WeakRef census agree within 4 MB (B1); the district modules are the gap (B3) |

### C4. Dead code + duplication

**Exports (175 files, 1,598 exports): 155 with no importer anywhere (FR4: 259 — down), 361 imported only by tests (288 — up).** Verified dead:
`core/harbor-streetparty.js` 10 (`breakLevel`, `streetHold`, `pocketSolid`, `slotWindow`, `watchShows`, `occupant`, `congaPath`, `congaPlan`, `spillPlan`, `benchPlan`
— `spillPlan` / `congaPlan` appear only as `src` strings in the timetable), `core/harbor-beat.js` 13 constants (`ATTACK_S`, `DECAY_S`, `FAST_STEP`, `SLOW_STEP`,
`SKEW_S`, `START_WHYS`, `OUTPUT_LABEL`, `SC_SLEW`, `SC_JUMP`, `SC_STUCK`, `LEAD_KEEP / SPREAD / DONE`), `core/city-sounds.js` 8 (`takeBySrc`, `SOUND_PICKS`, `DUCK_*`,
`BARBER_*`), `screens/harbor/props-light.js` 8, `core/harbor-neon.js` 5 (`NEON`, `floorY`, `roleClash`, `PALE`, `fxAt`). Exported AND unused in their own file:
`core/harbor-speakeasy.js:40 GROUND`, `core/harbor-workers.js:255 BUNDLES`, `core/harbor-light.js:29 LIGHT_MODES`, `core/harbor-boxer.js eveningSec`,
`air.js heliModelReady`; still dead from FR4: `signs.js drawGooseneck / lampLightMap / lampGlows`. **A dead hook:** `water.js:417 wake()` pushes into `wakes` (:80)
that nothing draws (the boats draw their own; the only reader is the debug API `scene.js:3840`) — delete with its ":416 stored, not yet drawn" comment.
**Stale comments:** `clouds.js:18` ("PART 9 PLUGS IN…"), `:317` ("ATM adds its own 'nimbus'…" — shipped), `water.js:416`, `core/harbor-remote.js:27` (`&panel`, a
dead flag). **Fix:** un-export (one script pass), delete the verified-dead, four comments. **S.**

---

## D. THE TESTS + THE PASS OVERHEAD

### D1. THE CLOUD's time, measured (harbor run 41269772550, PART 10's final; the same shape in 41267077437)

| job | setup (checkout · node · java · `npm ci` ×2 · caches) | **the e2e step** | billed min |
| --- | --- | --- | --- |
| street | 23 s | **461** | 9 |
| windows (✗) | 24 | **596** | 11 |
| legend | 35 | 392 | 8 |
| show | 25 | 351 | 7 |
| perf | 23 | 413 | 8 |
| audio | 23 | 327 | 6 |
| wild | 22 | 489 | 9 |
| city | 24 | 371 | 7 |
| holiday | 22 | 342 | 7 |
| models | 19 | 162 | 4 |
| **10 jobs** | **240 s (6 %)** | **3,904 s** | **76 billed · ~10.5 wall** |

**The setup is already cached — the premise "the 10 jobs re-download each run" is false** (verified in five job logs): Chrome is the runner's own
(`CHROME: /usr/bin/google-chrome`, 0 "Downloading chrom" lines); the emulator cache HITS every run (`Cache hit for: firebase-emulators-…`, 30 MB restored
in 0.5 s — no jar download); setup-node's npm cache hits (it caches npm's download cache, not `node_modules`, so `npm ci` still unpacks: 2 s + 11 s per job);
setup-java 0–1 s (Temurin pre-installed). A `node_modules` cache would save ~5–9 s a job (≈ 60–90 s a run) and billing rounds each job UP to a whole minute,
so it rarely crosses a boundary. **The cloud minutes are the tests: 3,904 of ~4,150 s.** Inside the e2e steps, per group (the cloud's own seconds): windows
**446**, perf **270**, workers 229, music 207, legends 189, weather 183, holiday 174, people 161, neon 159, heli 141, panel 126, freeze 120, snow 98, panelrows 97,
boxer 83, party 75, sounds 72, tower 68, motion 66, partysync 57, tape 58, load 51, core 46, life 45, thanks 45, streetparty 40, wildlife 39, quietbuilding 39,
promenade 35, light 35, mothman 30, speakeasy 30, stations 29, fireworks 30, blackbird 27, bench 25, roofcrisp 25, blackout 25, dock 23, sky 18, water 18,
citylife 14, doors 14, skyline 8, speaker 8, flags 5, harbor 4. `timeout-minutes: 15` vs the longest job 10.4 min (windows).

**The `tests` workflow (41269772577): 11 billed min** — unit 178 s (2 cores) → 4 min; integration 399 s → 7 min: the emulators' boot 10 s, rules 8 s, `/api` 5 s,
**the smoke test 227 s** (`e2e-smoke.mjs:14 WATCH_MS = 14000` × 13 entries = 182 s of fixed watching for "no stray null" — 8 s would save 78 s), **CONN 92 s**
(its "no socket opens" windows at `e2e-conn.mjs:80, 85, 190–193` — legitimate), the Install 36 s (`tests.yml:56–57` runs `npm ci` WITHOUT `--no-audit --no-fund`;
harbor.yml:83–84 has them and takes 11 s — S).

**Cloud cuts (safe):** the perf job's section 5 (frame pacing at 4× — every check `okT` / warning on CI, CALM LOAD `skipCI`; the 30-s calm page + 3 × (re-bake ≤ 30 s +
6-s window) run for warnings only) skipped on CI → **−100 s / −2 billed min**; the fixed sleeps below (music 57 s, legends 52 s) → −2 min; the smoke's watch
→ −78 s. ≈ **−5 billed minutes a run**, the wall time unchanged (the windows job is the critical path — D2's M fix cuts it to ~5 min).

### D2. THE LOCAL SUITE's shape (the mini PC)

`e2e-harbor.mjs:41 SHARDS = 3`; `localShards` (`harbor-jobs.mjs:87–94`) spreads the 47 groups heaviest-first by `SECONDS`, then `panel` + `perf` run serially
in the parent. **`fireworks` is missing from `SECONDS`** (defaults to 30; PART 10 added the group without its time). Computed, then re-costed with the cloud's
measured seconds (the cloud's 2-core numbers ARE the mini PC's under three shards: the re-costed 3-shard prediction, 28.3 min, matches the logs' 24–28):

| SHARDS | the table's shard sums (s) | the same shards re-costed (s) | predicted wall (+ panel 126 + perf 270) | measured |
| --- | --- | --- | --- | --- |
| 3 | 840 / 841 / 840 | **1,299** / 1,277 / 813 | **28.3 min** | 24–28 min (models.md, atm-c.md, atm-d.md) |
| 4 | 631 / 630 / 628 / 632 | 943 / 698 / 780 / **966** | 22.7 min | **22.0 min measured** (1,320 s: the shards ended at 702 / 784 / 952 / 954 s, then panel 111 + perf 254; **798 / 800** — the two misses the known ones: the party-sync joiner at 178 ms under load (D3, a test bug) + the calm load (a machine check); no group timed out) |
| 5 | 507 / 501 / 504 / 503 / 506 | **940** / 631 / 468 / 525 / 824 | 22.3 min | **21.5 min measured** (1,291 s: the shards ended at 467 / 575 / 580 / 850 / **981** s — windows 468 + weather 248 on one shard — then panel 102 + perf 207; **800 / 801** — the one miss LOAD WEATHER's JUST-ME holiday jump (F13: the roof board's `neon` re-pick crossfading 1.2 s after the reveal — a known race, the fix named in harbor.md's KNOWN ISSUES); the calm load PASSED this time; no group timed out) |
| 6 | 420 … 427 | 826 / 474 / 423 / 452 / 534 / 679 | 20.4 min | — |

The table under-reads 1.39× overall (the sum 2,716 s vs 3,785 measured); the groups ≥ 2× their entry: legends 3.4×, workers 3.1×, freeze 2.7×, windows 2.7×,
weather 2.6×, people 2.3×, panel 2.3×, holiday 2.3×. **The cost is imbalance, not shard count**: a stale table puts 1,299 s on one shard and 813 on another.
**Refreshing `SECONDS` to the cloud's numbers (+ `fireworks: 30`) rebalances to ~1,129 s a shard → ~25 min at 3 shards, ~19 min at 4, with no test changed**
(S). **The floor:** `windows` (446 s) is one indivisible group and panel + perf (397 s) run after the shards — no shard count gets under ~14 min until those move.

**The eight longest groups, what is inside (verified by reading):**
1. **windows 446 s** (`windows.mjs:7–483`): 31 pages one after another, 0 `Promise.all`, 32 waits — many for a moment's own clock ('the eyes on' 40 s, 'the count on'
   36 s, 'the ghost at the glass' 30 s, 'a toast starting' 25 s ×2, 'the tango on' 25 s, 'the rooms lit' 25 s, 4× 'settled' 20 s); fixed sleeps only 9.2 s. No shared
   state (no `city2/live` writes) → **open 3–4 pages at a time (each `open()` is its own context): 446 → ~150 s** — the single biggest saving in the suite. **M.**
2. **perf 270 s** (`perf.mjs:7–157`): serial by design; on CI every pacing check is a warning + CALM LOAD is skipped — the pacing loop runs ~100 s for warnings only.
   Hard there: MEMORY (20 cycles), HIDDEN TAB, BATTERY. **S** (skip section 5 on CI).
3. **workers 229 s** (`wild.mjs:251–316`): 7 pages serial, 11 waits for scheduled work — waits on city time; parallel pages **M**.
4. **music 207 s** (`audio.mjs:91–650`): 14 pages serial, 39 waits, **57.4 s of fixed sleeps in 50 calls** (1.9 s `vis('visible')` ×4 at :250, :263, :328, :334; 2.5 s ×4 at
   :154, :237, :489, :498; 2.0 s ×5 at :405, :423, :562, :615, :623) — "past the listener's 2-s live window" pauses → `waitFor` the listener's state. **S.**
5. **legends 189 s** (`wild.mjs:317–538`): 16 pages, **one `sleep(52000)` at `wild.mjs:365`** — the UFO's PEOPLE-RULE trace runs 52 s in-page at 8× city speed then
   reads `window.__rule`; the condition exists (`lg.run` ending) → `waitFor(!lg.run && firsts.length >= 2)`. **S.**
6. **weather 183 s** (`wild.mjs:9–195`): 17 pages serial, 19 s of sleeps (`harborUp` then `sleep(1500)` ×6 at :15, :108, :119, :157, :159, :163 — `settled()`
   exists, `kit.mjs:129`). **S.**
7. **holiday 174 s** (`holiday.mjs:8–210`): 4 pages, 30 waits — the spiders' trip / climb / calm chain (18 + 24 + 18 s timeouts at :112, :113, :119).
8. **people 161 s** (`street.mjs:253–454`): 9 pages; `sleep(4500)` at :304 after a 40-s wait for the cab waiter, then reads `cabTaxi` → `waitFor(cabTaxi)`. **S.**

**Fixed sleeps in the suite: 222 literal `sleep(N)` calls, 332.8 s of fixed waiting** (an upper bound) — audio.mjs 71 / 102.9 s, wild.mjs 24 / 77.9, city.mjs 32 / 42.2,
street.mjs 27 / 35.8, windows.mjs 32 / 24.1, perf.mjs 11 / 18.0, show.mjs 8 / 14.1, holiday.mjs 11 / 11.7. The ten biggest: `wild.mjs:365` 52 s (a wait, not a window — above);
`audio.mjs:776` 15 s ("a LATE JOINER 15 s later" — the scenario; 5 s proves the same); `city.mjs:379` 15 s (the IndexedDB-polling count — a legitimate negative window);
`audio.mjs:814` 10 s (a late joiner — scenario); `perf.mjs:73` 6 s ×3 (the measuring window — legitimate); `show.mjs:417` 6 s ("the show's opening salvo + its smoke" —
`waitFor(shells > N)` exists in the state); `e2e-harbor.mjs:77` 5 s (a `Promise.race` cap on `browser.close()`); `street.mjs:304` 4.5 s ("to be safe"); `city.mjs:615` 4.2 s
(the LOAD log's post-reveal window — legitimate); `audio.mjs:981` / `perf.mjs:39` 4 s (windows). **The pattern `await harborUp(p); await sleep(1500)` appears 20+ times**
(wild.mjs:15, 108, 119, 157, 159, 163, 323, 690; windows.mjs:559, 562, 710, 718, 756; holiday.mjs:10, 131, 163, 213; perf.mjs:229) — `settled()` is the condition.

### D3. THE FLAKY / RED CHECKS — a test bug or a city bug? (so GREEN MEANS GREEN)

| check (job · file:line) | what it measures · the evidence | verdict | the fix (never a wider tolerance) | size |
| --- | --- | --- | --- | --- |
| **THE TOAST WALKS IN** (windows · `windows.mjs:287–295`; red on run 41269772550: "0.76 → 0.14 over 3 s, the biggest step 0.056 (never a cut)") | `ok(ds.length > 60 && ds[0] > 0.6 && ds[last] < 0.3 && jump < 0.06)`: the message shows 0.76 ✓, 0.14 ✓, 0.056 < 0.06 ✓ → **the clause that failed is `ds.length > 60`** — `winTrace(3.2)` (:143–146) samples one entry per rAF and keeps the frames where two 'bar' figures share a depth; the 2-core runner's ~30 fps gives ~60–96 samples in 3.2 s, fewer with the pair | **test bug** (a frame-COUNT clause inside a hard check) | `ds.length >= 0.8 * fr.length` ("the pair seen in most frames") + dt-normalise `jump` as the arm check does | S |
| **THE TOAST'S BIGGEST ARM STEP** (windows · `:174 okT(maxStep < 0.25)`; 0.26–0.31 locally on EVERY build since WIN2, 0.285 on the pre-ATM-A build) | the max single arm-joint move between consecutive DRAWN frames ÷ `max(0.5, Δt / 16.7)` (:161–165) over ~360 samples; the sampler's clock is the TRACE's rAF stamp, and the trace callback + the scene's loop are both re-registered every frame, so under load their order flips — one sample carries two frames of pose over one Δt (×2). The TV: `kit/puppeteer.mjs:16` already forces `--disable-gpu-compositing` (Chromium's own 60-Hz clock) since ATM-A and the check still read 0.26–0.31 (atm-b.md) → **the display's rate was never the cause after ATM-A** | **measurement artefact** (a max statistic on the wrong clock) | stamp samples with the scene's own frame counter (`lp.drawn` is already read) and divide by the scene's Δt; log the figure + the moment of the max so a real snap is nameable; keep 0.25 | S (one kit sampler, shared with the dog) |
| **ITS NERVES — calm within 18 s** (holiday · `holiday.mjs:116–120`; red on 41267077437 + "A LETTER TAP BESIDE IT … NEVER" right after) | pokes `race` and waits ≤ 18 s for BOTH spiders at `scared === 0 && crouch === 0`. A scare = freeze ≤ 0.59 s + dash + hold ≤ 3 s + a WARY RETURN of 3–4 bursts with stills ≈ 7–11 s (`dress-halloween.js:514, 536–551`) — 18 s is a 7-s margin **when nothing else pokes**; but `title.js:322` pokes `tired` every 25 s while a tube is tired, `:951` on every logo race, `:1316` on a letter tap; `scareNow` refuses only within 4 s of the last scare (:491) — a poke mid-return restarts the ~11 s, and this page has been open ~60 s (the trip + climb before it, :99–113). The LETTER TAP fails next for the same re-poke (a race swallows the tap) | **test design** — the check assumes it is the only poker; the city behaves as designed (fails on the pre-pass build too, night-b.md) | expose the spiders' last-poke time in `state()` (:748) and wait for calm within 18 s **of the LAST poke** (the clock restarts on a re-poke); or open the page with a flag that mutes the sign's own pokes (none exists — a TOOLS row) | S/M |
| **LOAD WEATHER — kept on this device** (city · `city.mjs:664–665`; red on 41267077437: "lit crossfade 1200 ms · share") | the city on the REAL clock (no `&when`, :656) with a cached overcast answer; asserts no VISIBLE load-log row for ~4 s after the reveal. `scene.js:1985–1993 rebakeLights`: a `lightKey()` change after the reveal logs a visible 1,200-ms crossfade unless `slow` = the weather changed within 12 s (`wxRecent`); the key's first part is `Math.round(winShare() * 60)` (:1978) — City 1.0's hourly window share in 1/60 steps, which crosses a boundary every few minutes on the real clock; land in the 4-s window and the lit layer crossfades. Every pass log calls it "SP3's clock-dependent flake" (9c.md:138, 9e.md:169, win.md:162…) | **a REAL city behaviour the owner's rule forbids** — a phone that loads at that second sees a 1.2-s window flash after the reveal; the test is right to be on the real clock | `scene.js:1990`: `slow = fade && (wxRecent() \|\| now − shownAt < TIER_GRACE) && /^(share\|bias\|…)$/` — a share / bias step inside the post-reveal grace (`TIER_GRACE` 15 s, :3463) rides `WX_BLEND` like a weather change | **S (city)** |
| **A CALM LOAD STEPS NOTHING** (perf · `perf.mjs:11–20`; fails locally on every build since WIN2; `skipCI`) | at 2× CPU, 30 s after the reveal, `calm = one tier entry, no step reason, tier 2 / dpr 2`; `machine = judge.p75 > 28` makes it `okT` — the check knows it measures the machine. The kit forces software compositing whenever `GPU` is unset, so **today's runs never touch the GPU and the TV's 60 Hz changes nothing by itself**; with the TV at 60 Hz the owner can run `GPU=1 ONLY=perf` (→ `--enable-gpu`, no disable flag) and GPU compositing plausibly holds 60 fps at 2× | **a machine check**, decidable in one run | `GPU=1 ONLY=perf` once — this review's full runs (D2) record its local state — **it FAILED in the 4-shard run (serial, nothing else running: frames p50 66.7 ms, work 29.8 ms at 2× — software compositing of the 804×1748 canvas) and PASSED in the 5-shard run and with `GPU=1` (33 s, "tier 2/2, steps 2")**: a machine check that flips with the machine's own state; with the GPU on it passes at once. Make `GPU=1` the local default for `ONLY=perf` (the TV is 60 Hz now, so the kit's software-compositing fix is no longer needed for the frame clock), or keep it `okT` locally; if it still steps with the GPU, the city at 2× really steps on this machine and it is a city question | S |
| **THE PARTY-SYNC LATE JOINER** (audio · `audio.mjs:777–785 ok(spread < 100)`; 127 ms under four shards in PART 10, 16 alone, 13–48 in NIGHT-C) | `start = wall − at·1000` across three phones; each `at = ctx.currentTime − origin` (`synced-songs.js:165–176`), and the player re-places a voice only once it is **> 120 ms off** (:151) — the engine's own tolerance; the per-phone check (:751) allows ±100 ms, so two phones at +60 / −67 pass it and give a 127-ms spread | **test bug — the wrong quantity** (stricter than the engine; sky-b.md:94 says so) | the hard check = the TIMELINE's agreement across phones (`wall − want·1000`, the server clock — within a few ms) + each phone's `\|err\| ≤ 0.12` (the engine's design number), the joiner included | S |
| **THE DOG's TURN** (street · `street.mjs:383–393 ok(fast === 0)`; 11.0–11.5 u/s on every build for six passes, 8–9.4 alone) | `v = Δpos / max(1/60, Δt)` per rAF sample, `v > 11` counts. The dog's place is a continuous function eased over 0.6 s (`harbor-people.js:872, 1265–1272`): a 90° turn ≈ 5–8 u/s. The 1/60 floor + the rAF-order flip (above) inflate a sample ×1.4–2 under load — 8 × 1.4 ≈ 11.2, the readings; passes alone at a steady 60 fps | **measurement artefact** (the same mechanism as the arm step); the city's dog is at ~8 | sample `dogAt` with the people sim's own time and compute `v` over the sim's Δt (or ≥ 100-ms windows); keep ≤ 11 | S (the same kit sampler) |

**With these seven (one in the city), all of PART 10's cloud reds and the standing local reds have a fix that widens nothing.** Also from the cloud's logs: the
`legend` job's 7-min re-run in ATM-D (its groups total 381–392 s today — within the cap).

### D4. The unit suite

`node --test tests/*.test.mjs`: **953 pass, 83.3 s wall** on the mini PC (16 cores; the cloud 178 s on 2). Node runs the 104 files in parallel, so the wall time
is the slowest FILE: **`tests/harbor-people.test.mjs` 79.0 s** alone (46 sequential `test()`s: "THE PEOPLE over two days at 390 / 402 / 430" 20.3 s, THE DANCE
CIRCLE 8.8, THE BENCHES ARE SOLID 8.2, THE SIDE DOOR 7.8, REAL DOORS 6.3, EVERY LEASH 4.9, THE BENCH'S SEATS 4.9, A CAB 4.6); then slip-course 17.2, harbor-streetparty
9.8, sun 8.6, harbor 7.7, harbor-solids 7.5. **Split harbor-people.test.mjs into 3–4 files** (walks / doors / bench / dogs; the 20-s "two days at three widths" is three
tests) → the suite's wall ≈ the next file, **~20 s locally** (the cloud's 2-core sum stays ~175 s). Run 4–6 times a pass → **−4 to −6 min a pass.** **S.**

### D5. Where a pass spends its time (the owner: "shave off 15 minutes here and there")

| part of a pass | today (measured where marked) | the cut | after |
| --- | --- | --- | --- |
| Step 0 + the docs (the pass log ~15–20 KB, decisions, harbor.md's index + file map + KNOWN ISSUES, ROADMAP + history, audio.md) | ~30–45 min of model time a pass (estimate from the logs' size; not measured) | the pass log's "Known issues" + "the numbers" as the ONLY places a number lives (the other docs point) — a doc rule, not a tool | ~−10 min |
| the touched groups while working (`ONLY=…`, 30–130 s each) | ~5–8 runs a pass | the `harborUp + sleep(1500)` → `settled()`; the music / legends sleeps → `waitFor` | −1 min a run |
| the unit suite | 83 s (measured), 4–6 runs | D4 | **−4 to −6 min** |
| **the FULL local suite** | **24–28 min (3 shards; measured 3×)**, 1–2 runs | the `SECONDS` refresh + `fireworks` (S) → ~19 min at 4 shards; the windows group's pages in parallel (M) → ~14–15 min | **−6 to −13 min a run** |
| the cloud | ~10.5 min wall / 76 billed (measured), ≤ 2 runs | −5 billed a run (D1); the wall follows the windows job (M) → ~7 min | −3 min wall |
| the look loops (`shots.mjs`, ~8 s a shot; `--cast` bursts) | not measured (varies by pass) | THE LINKS RULE already; no cut proposed | — |
| the link checks (the owner's phone) | — | — | — |

**≈ 15–25 minutes off a City 2.0 pass, nothing dropped** — most of it in the full local suite (D2) and the unit file (D4); the cloud's minutes stay (they are tests).
The owner's shard question ("4–5 on this machine — does any group time out under load?"): **measured in this review: 3 shards 24–28 min (the logs) → 4 shards 22.0 min (798 / 800) → 5 shards 21.5 min (800 / 801); nothing timed
out at 4 or 5 — but the gain flattens because the stale `SECONDS` table lands windows + weather + workers on one shard (981 s at 5 shards while another
finished at 467) and panel + perf add 5–6 serial minutes after it.** The order that pays: (1) refresh `SECONDS` + add `fireworks` (S: the predicted
4-shard makespan drops from 954 to ~850 s → ~20 min); (2) the windows group's pages in parallel (M: 468 → ~150 s → the longest shard ~700 s → ~16–17 min at 4
shards); (3) only then more shards. Under 4–5 shards the two shard-load misses (the party-sync joiner at 178 ms, F13's crossfade) are exactly D3's test bugs —
fix them and SHARDS=4 is a clean default.

---

## E. THE PROFILE + TAB HANDLING (the overlap with Grok — Oct 31's scare, plan.md "THE LOST PROFILE")

### E1. The headline (verified in the code)

**There is no "limited mode", no second-tab lock, and no shared admin cache** — the hypothesis in plan.md ("the 'already open in another tab' limited mode, no identity …
checkAdmin cached 'not admin' for 6 h") is wrong on both counts:
- A duplicate tab is only TOASTED, never restricted: `js/identity.js:80–90` is a BroadcastChannel hello / here handshake (`na-slot-${slot}`) whose sole effect is
  `onDuplicate()` → `js/app.js:264–266 toast(…, 'warn', 6000)`. Both tabs keep the same slot, the same Firebase app, the same auth user, the same localStorage. No
  lock, so nothing can be stale or held by a suspended tab; no TTL; nothing to release.
- `checkAdmin` caches in **sessionStorage** (per tab), not localStorage: `js/screens/harbor/remote.js:53 ADMIN_KEY = 'nd:hr-admin'`, `:55–58` the `ss` wrapper is
  `sessionStorage`. One tab cannot poison another.

So the tab the owner saw was not "a second tab of his identity in a limited state". `PLAYER` + no local name + `NO KEY ON THIS DEVICE` + 0 XP means **that tab's
`na:<slot>:profile`, `na:<slot>:me` and `na:<slot>:pkey` all read EMPTY** — `js/screens/profile.js:248–250 paintLocal()` renders `memberCard(loadMe()?.profile, loadProfile() || {}, …)`;
the name falls to `local.name` then `'PLAYER'` (:79, :131); the key card reads `myKey()` = `loadKey()` with no uid check (`js/profile/me.js:25`). A changed Firebase uid
alone would NOT blank the key or the name. Three candidates, each consistent with "closing every tab and opening one fresh fixed it":

1. **A sticky test slot (the strongest same-origin explanation).** `identity.js:9–17`: `?slot=N` is written to `sessionStorage['na:slot']` and **sticks to the tab forever**
   (the URL is cleaned by `setUrlRoom`, :68–77; the slot survives every reload and iOS Safari's tab restore). Any tab ever opened with `?slot=2` (a second-player test) is
   permanently player "slot-2": keys `na:2:*` (:29) → an empty profile / key, a separate Firebase app `slot-2` (`js/firebase.js:62`) → its own anonymous uid → `whoami`
   says `admin:false` (`api/admin.js:176–178`). The toast for slot ≠ 1 reads "SLOT 2 IS ALREADY OPEN IN ANOTHER TAB" (`app.js:266`) — the owner's recollection fits either text.
2. **A different origin.** `neonspeakeasy.com` → `www.` is a different origin, storage per origin (E4). An old tab still ON the apex (or `games.loewfizzle.com`) shows the
   apex's storage — but a reload 308s to www, so this explains a blank www tab beside working www tabs only if the WORKING tabs were the odd ones.
3. **A private tab.** Storage isolated per private window; BroadcastChannel does not cross private / normal. Weak.

Whichever: the restore then worked (`restoreKey` links ANY uid to the key's profile — `api/_lib/profiles.js:161–174`), **but the ADMIN row stayed away until the tab died
because `nd:hr-admin = { admin: false }` sits in THAT TAB's sessionStorage for 6 h** (`remote.js:217–218`; sessionStorage survives reloads). That part of the hypothesis
stands, per tab. Note: the ADMIN row exists **only on `?city=2`** — `js/screens/title.js:51, 363–367` load `harbor/remote.js` solely when the URL has `city=2`
(`remote.js:233 setMenuExtra('admin', …)`): a plain `https://www.neonspeakeasy.com/` tab never shows ADMIN, admin or not. Worth asking which URL the blank tab had.

### E2. `checkAdmin` (`remote.js:215–222`, verified)

`TEST_PANEL` (`?panel=1`, :105) short-circuits true; the cache `sessionStorage['nd:hr-admin'] = { admin, at }` is honoured for `6 × 3600e3` ms (:218); a THROWN call
(offline, 401, 503, the 9-s abort) is `catch { return false; }` and **not cached** (:221) — good. A successful `whoami` with `admin:false` IS cached 6 h — right for a real
non-admin, **wrong when the uid was simply not yet linked**: `checkAdmin()` runs at the remote's mount (:223, the title's first paint) while `syncMe()` (`app.js:277`) may
still be creating / linking the profile; on a brand-new uid the first `whoami` legitimately returns `admin:false` (`api/admin.js:176 pidOf(uid)` → null) and is pinned 6 h.
Nothing invalidates it after `restoreKey()` succeeds (`me.js:69–82` writes no `nd:hr-admin`). **Fix (S):** cache `admin:false` only when `whoami` returned a non-null `pid`,
and for ≤ 10 min; clear `nd:hr-admin` in `restoreKey()` / `syncMe()` when the pid changes; re-check on `visibilitychange`.

### E3. Firebase Auth's persistence (C4d, 8f7abb1 — verified against the SDK in `tests/integration/node_modules/@firebase/auth` 1.10.8)

`firebase.js:67` `persistence: [browserLocalPersistence, indexedDBLocalPersistence]` (before Oct 29 the reverse). The key: `firebase:authUser:${apiKey}:${appName}` — `[DEFAULT]`
for slot 1, `slot-N` otherwise (:62): each slot's user is its own key, verified. The migration (`PersistenceUserManager.create`): it walks EVERY persistence in order calling
`_get(key)`; the first blob found selects it; if found in a non-first one, the first migration-capable persistence wins, the user is written there and **removed from all
others**; both web persistences allow migration. So a device whose user lived in IndexedDB reads it on the first boot after C4d, copies it to localStorage, deletes the IDB
copy — **the same uid**. Matches the C4d comment. **The hazard (suspect, one-shot):** each `_get` is wrapped in `catch {}`; IndexedDB on iOS Safari can fail transiently
(a background tab, storage pressure) — if `localStorage._get` is null and `indexedDB._get` throws after its 3 retries, the user is skipped → `auth.currentUser` null →
`firebase.js:78 signInAnonymously` **mints a new uid**, and the following `_remove` may delete the old IDB user. Only on the first www visit after the Oct 29 deploy;
not what the owner saw (his blank KEY / NAME are plain localStorage reads). ITP: Safari caps script-writable storage at 7 days without interaction — a daily visitor is
unaffected; an occasional player could lose uid + key + saved session together: the key restore is the designed recovery (`profile.js:238`). **Fix (S):** in `initFirebase`,
if `auth.currentUser` is null AND `localStorage['na:1:me']` exists, log it to `/api/log` before `signInAnonymously` (we would then know how often a uid is lost in the wild) and
surface the key-restore prompt on the next title paint.

### E4. The origin (verified in the repo; the redirect itself lives in Vercel's dashboard — `vercel.json` has only path rewrites)

Today (curl, Nov 1): `https://neonspeakeasy.com/` → **308** → `https://www.neonspeakeasy.com/`; `games.loewfizzle.com` → 301 → www. **Everything in the repo is the APEX:**
`index.html:20–21, 28` (`og:url https://neonspeakeasy.com/`), `board.html:15–16, 23`, `manifest.webmanifest` (`start_url "/?source=pwa"`, `scope "/"` — relative, whatever
origin installed it), the invite link is `location.origin` (`js/screens/lobby.js:37`), `CLAUDE.md:4, 299` and `ROADMAP.md:11` name only `neonspeakeasy.com`, `docs/profiles.md`
"Setup (production)" covers env vars only — **no domain / primary-host setup is documented anywhere**. `www.neonspeakeasy` first appears in the repo on **Oct 26** (`fbdecee`,
sp4.md:189 — a test URL), then 8f7abb1 (Oct 29) and plan.md (Oct 31); the domain dates from Oct 17 (`9adb117`). **So the redirect existed by Oct 26 at the latest; whether it
existed from Oct 17 the repo cannot say — only Vercel's domain settings can.** If it was added after Oct 17: every anonymous uid, `na:1:*` (profile, me, pkey, session, the
results queue `rq`) and the service worker on the apex became unreachable; each phone landed on www as a fresh player with no key on the device. Recovery = the key restore,
but only for players who saved their key (`shouldPromptKey` asks after 3 / 10 matches, `me.js:138–143`); a stranded `rq` is lost. **Fix (M, mostly ops):** decide the primary
host (apex, the one every tag / link / doc uses — or www, then change `og:url`, the docs, CLAUDE.md:299's authorized domains and verify www is in Firebase Auth's authorized
domains: anonymous sign-in on an unauthorized domain fails); document it in `docs/profiles.md` Setup with the date the redirect began; a one-time toast on a first www load
with `performance.getEntriesByType('navigation')[0].redirectCount > 0` and no `na:1:me`: "NEW ADDRESS — RESTORE YOUR PROFILE WITH YOUR KEY".

### E5. The restore's "COULDN'T REACH SERVER" ×2 (verified)

`js/profile/api.js:10 TIMEOUT = 9000`; `fetchJson` (:12–25) aborts at 9 s and maps ANY fetch rejection to `ApiFail(0, 'offline', 'Couldn't reach the server.')` (:19); **no retry
anywhere** (`me.js:69–82 restoreKey` is one `api()` call; `profile.js:383–390` toasts `e.message` at once). Per attempt the server does `requireUser` → `fb()` cold init
(firebase-admin + `cert()`), `verifyIdToken` (the first call fetches Google's certs), then `restore` (two rate-limit transactions, two reads, a multi-path update); `vercel.json`
gives `api/profile.js` `maxDuration 10`. A cold start on a weak link plausibly exceeds the client's 9 s; the abort does not stop the server (attempt 1 likely completed and used
one of `RESTORE_LIMIT.uid = 10`/h). **Fix (S):** retry once on status 0 for the idempotent actions (`restore`, `me`, `whoami`, `ensure`) with a longer second timeout (9 → 15 s);
"TAKING LONGER THAN USUAL — TRYING AGAIN" for the abort vs a true network error; warm `/api/profile` with a ping when the Membership screen opens.

### E6. What a real player could lose, how, and the fixes

**Loss paths:** (a) the origin change apex → www — uid + key + saved session + queued results at once, for everyone who had used the apex (recoverable only with a saved key);
(b) ITP's 7-day eviction on Safari for an occasional player (the same set); (c) the one-shot IndexedDB `_get` failure during C4d's migration → a new uid (the profile / key
stay in localStorage, `me.uid !== state.uid`, so the card shows local-only until `syncMe` creates a NEW blank profile for the new uid — the old one orphaned unless the key is
restored); (d) a tab stuck on a test slot shows a fresh identity and, after a restore, binds the owner's profile to a throwaway `slot-N` uid.
**Fixes (TOP 10 #9):** (1) an honest tab state instead of a blank card — the card names its slot when `slot !== '1'` ("TEST SLOT 2 — NOT YOUR PROFILE" + RESET TO SLOT 1,
which clears `na:slot` and reloads); never let `?slot` stick without the URL on a phone; the dup-tab toast says the slot and that the tab is NOT limited; a `loadMe()` whose
`uid !== state.uid` says "THIS DEVICE'S SIGN-IN CHANGED — RESTORE WITH YOUR KEY" rather than `PLAYER` (S/M); (2) `checkAdmin` never pins a provisional "no" (E2, S); (3) the
origin decided + documented + the redirect's date recorded (E4, M); (4) the restore's retry (E5, S); (5) the migration's log line (E3, S). The storage inventory for the
origin question (every key the app writes) is in the session's notes: localStorage per slot `na:${slot}:profile / me / pkey / pnotes / rq / rdone / session`; device-wide
`na:srvoff`, `na:settings`, `na:beatcal`, `na:beatlead`, `nd:moodbag:*`, `na:chat:read:*`, the games' own (`na:golfball`, `na:prism:target`, `na:pulse:calib`, `na:slipride`),
`na:hushmiss`, `nd:wx` / `nd:wet`, `na:dbgtools`, `na:bbwatch`, `bd:dev`, `nd:hr-open / -delay / -recent / -folds`; sessionStorage (per tab) `na:slot`, `na:emu`, `nd:back`,
`pf:renote`, `rc:*`, `nd:kp`, `nd:hr-me / -mode / -admin`, `bd:period`, `gl:plan:*`, `hs:bet:*`; Firebase's `firebase:authUser:<apiKey>:[DEFAULT]` / `:slot-N`.

---

## PERF's PLAN (the order; each group fits a pass)

**Group 0 — the owner's PART 10 review fixes** (Nov 1): the closing DRAGON-EGG salvo across the FULL width (`core/harbor-fireworks.js:95` — today 4 shells at
`x: 0.55 + i * 0.12` = the right third → ~6–8 shells left edge → right edge, behind the lit sign); the visible NEAR launches (the `barge` + `light` layers' tails seen leaving
the water, bursting lower + closer, BELOW the sign, never in front of it — `FW_LAYERS`, `placeOf`); the blizzard's ground-snow streamers OFF behind a switch (`snowfx.js#ground`).
+ **A4.1** (the second engine stripped at `scene.js:2405`) so the bench's fw scenes are honest BEFORE the owner's bench run feeds Group 2.

**Group 1 — THE LOAD (the owner's fog + blizzard freeze):** #1 the pixel watch's read-back + the readout's cadence during the load (S, S); #8 the Christmas wire baked
(S); #7 `localParts` cached (S); the frost pane after the reveal + sized to the glass (H18, S); the people's plan warm-up spread over frames (M). Proof: the bench's
load-freeze line on the fog + blizzard links (`&bench=1`) and `loadfreeze`-style profiles — the blizzard's longest stall from 4.5 s to the clear night's.

**Group 2 — THE FRAME (set by the owner's bench run):** the GL layer's `init()` at T−20 s (the show's first half-minute, B1, S); A4.2 WAIT / WALK sprite, A4.3 the flake key,
A4.4 the per-frame gradients (S each); FR4's cheap wins (one glow-sprite cache H2 — 190 radial gradients in 74 files; the bar's day repaint); the dancers only if the
bench's fw-party line says the GPU is short (the crowd is 2.4–2.9× the night: its win is in `folk.js#body / jointsOf / leg` — a per-figure pose cache keyed by (rig, phase 1/32,
heading 1/16) is the one M that moves it).

**Group 3 — GREEN MEANS GREEN:** #3 LOAD WEATHER's share step inside `TIER_GRACE` (scene.js:1990, S); the six test-side fixes of D3 (the walk-in's count clause, one
"motion per scene-time" sampler for the arm step + the dog, the spiders' last-poke clock, the joiner's quantity); `GPU=1 ONLY=perf` once for the calm load.

**Group 4 — THE PASS OVERHEAD (D):** `SECONDS` refreshed to the cloud's seconds + `fireworks` (S) and SHARDS=4 the new default if the full run below confirms it;
`harbor-people.test.mjs` split (S); the `harborUp + sleep(1500)` → `settled()` pattern, the music / legends sleeps → `waitFor` (S); the perf job's pacing loop skipped on CI,
the smoke's watch 14 → 8 s, `--no-audit --no-fund` in tests.yml (S); the windows group's pages 3–4 at a time (M).

**Group 5 — THE RULES + THE SPLIT:** one `canvas-safe.js#mk` for the district modules (B3, S); THE WIND's five leaks (C2d, S); `harbor-moments.js:97` → the timetable
(S); the four new tier strays + `TIERS` into harbor-tiers (C2b, S); the force-flag test's regex (C2f, S); then the scene.js cuts in order — `scene-fireworks.js`,
`scene-legend.js`, `scene-holiday.js` in PERF (M each, pixdiff + the guard after each), the rest one per later pass.

**Later (not PERF):** the timetable sweep (C2a, SCHED), the tier sweep of the legacy painters (M), H6 / H7 / H8 / H9 / H10 / H11 (mechanical, S–M each), the exports (C4), the
origin decision (E4, the owner + Vercel).

## What's healthy (what NOT to touch)

- **The GPU fireworks engine**: 0 ms of JS a frame in every profile, 3 draws, the layer freed 4 s after the smoke, 11 MB only while a show is near. Leave the engine; only the
  salvo's placement + the near launches (Group 0) and the T−20 s init (Group 2).
- **Memory**: no leak in 12 minutes through the show; the readout and a WeakRef census agree within 4 MB; the 20-cycle check reads the heap without V8's code and is honest.
- **THE LOAD GATE + THE LOAD LOG**: they found this review's biggest finding (the pixel watch) by naming the stall; keep both — just move the watch's read off the GPU.
- **Every idle system early-returns** (A4's list); no cache keyed per frame; no layout read in a frame path.
- **THE SOLIDS, THE TIMETABLE (every system since Oct 29), THE LIGHT, the force-flag registry**: one source each; 0 strays in the new code.
- **The cloud's setup**: Chrome is the runner's, the emulator + npm caches hit every run; nothing to cache.
- **The windows' split, the dressing's dpr, the dead lamppost painters** — FR4's items that were done stayed done.
- **The profile / tab code**: no lock to go stale, the admin cache per tab, Firebase's migration correct — the fixes are about SAYING what a tab is, not about identity.
