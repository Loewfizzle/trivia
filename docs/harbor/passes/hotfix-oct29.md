# HOTFIX Oct 29 — THE FORCED BUS AT 5 FPS, THE HARVEST MODEL ON THE iPHONE, THE DOG's TURN (after C4d; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

Four things from the owner's iPhone 16 Pro (iOS 18.7 Safari, 402×660 pt), Oct 29 ~3 pm.

### 1 — THE FORCED-BUS LINK CRAWLED AT 5 FPS
`?city=2&…&when=2026-10-30T11:00&wx=clear&force=bus&debug=1` → the readout: 5 fps · work 199.9 / 235.0 ms (mean / p95) · 100 % slow;
plain `?city=2` pages 58–60 fps on the same phone.

**The cause:** `core/harbor-people.js#folkAt`'s plan cache was FIRST-IN-FIRST-OUT at 80 entries. `&force=bus` (a bus every signal cycle,
~47 s) touches ~95 keys a frame (36 `BB|` "is this bus blocked by a truck" checks, 15 `live|` + 15 `riders|` per-bus entries, the blocks…)
— more than the cache holds, so every frame evicted exactly what it was about to read and re-planned the whole promenade: ~4 800
`busBlocked` checks, ~3 100 rider plans, ~340 hourly bus schedules a frame. A plain day / night touches ~28 keys, so it never showed.
C4d's "WebKit 4.4 s departure = a slow headless frame loop" was this same bug. C4c paid part of it too (its one-a-minute forced bus).

**The fix:** the cache is LEAST-RECENTLY-USED (a hit moves to the back) with room for the frame + the plan warmed 70 s ahead
(`FOLK_CACHE` 320). Nothing about the plans changed (they're pure — the same answer, made once).

**Measured** (the forced bus at its stop; work = the scene's main-thread ms a frame):

| where | C4c | C4d (the bug) | the fix |
| --- | --- | --- | --- |
| node, `folkAt` alone, a frame | — | ~360 ms | 0.13 ms (plain day 0.09, night 0.33) |
| Chromium 4× CPU 402×660, tier 1 (title-perf --ab) | 59.3 ms | — | 20.8 ms (plain night 26.0 vs C4c 24.0: same) |
| Chromium 4× CPU 402×660, tier 0 (the e2e guard) | — | **1 083 ms** (70.7× the baseline) | 15.6–19.9 ms (0.9–1.3×) |
| WebKit (software-rendered here), 402×660 | — | **5 063 ms** | 43.3 ms (= the real bus at its day stop: 42.6) |

The JS profile (Chromium, 4× CPU, 6 s on the forced bus): C4d spent its frame in `segRect` 15 %, `route` 15 %, `busBlocked` 6 %,
`blockVisits` 6 %, `busesOf` 3 % — planning; the fix spends it drawing (`drawImage` 8 %, `fill` 4 %).
**THE REAL BUS** at its real stops (Oct 30 11:13:27 by day, 21:08:13 at night — found on the planner) costs the same on C4d and the fix in
WebKit (42.6 / 80 ms a frame) — it never had the bug. A/B vs C4c (title-perf `--ab`, 4× CPU, 402×660, tiers 1 + 0): np-night same,
np-party same, the bus faster.

**THE GUARDS:**
- unit (`tests/harbor-people.test.mjs`, "THE FORCED BUS NEVER RE-PLANS EVERY FRAME"): two minutes of frames replayed as people.js calls
  them (+ the warm-ahead) on a plain day with a bus, a plain night, `&force=bus`, `&force=dogwalk` — < 1 new plan a frame once warm
  (fails on the old cache).
- e2e (`ONLY=perf`, THE BASELINE GUARD): the mean scene work a frame on a plain night, the forced bus at its stop and the forced dog
  walk, pinned at tier 0 at 4× CPU, divided by a fixed JS loop timed in the same page (the machine's speed) — FAILS above 2× the baseline
  in `tests/integration/perf-baseline.json`. On CI without a runner baseline of its own: a warning from 2×, a failure from 4×. Proven: the
  C4d build fails it at 70.7×. A pass that changes the cost on purpose re-writes the file at its end:
  `PERF_BASELINE=write PERF_GUARD=only ONLY=perf node e2e-harbor.mjs …` (`PERF_GUARD=only` = just the guard, ~1.5 min).
- `title-perf.mjs` has the scenes `bus` (the owner's link) + `dog` (the forced dog walk).
- THE CLOUD: the guard puts the perf group at ~140 s and every cloud job was within ~25 s of its 5-min cap — `perf` + `tower` are now an
  EIGHTH job (`perf`, harbor-jobs.mjs + harbor.yml; `city` ~181 s, `perf` ~177 s): ≈ +4 cloud minutes a `[harbor]` run.

### 2 — THE HARVEST MODEL NEVER SHOWED ON HIS iPHONE
The pair (`when=2026-11-19T21:00&wx=clear&prop=model` vs without) looked identical on the phone — after CLEAR ALL and in a private tab
— while C4d proved it loads + draws in WebKit + Chromium. Not reproducible here, so this pass makes the phone SAY what happened:
- **the readout (`&debug=1`)**: its first line (expanded and folded) starts with the DEPLOYED BUILD — `GET /api/log` answers the commit
  (`VERCEL_GIT_COMMIT_SHA`, 7 characters; `local` without /api); a row `harvest: MODEL | drawn (…)` — `not asked` · `loading (try n)` ·
  `loaded 254×229 webp in 312 ms` (or `png (webp error)` — which file it fell back to and why) · `failed: <the error>`; `not on screen`
  when the display isn't drawn.
- **a failure → /admin** (errlog kind `harvest-model`, once a page — C4d's, kept).
- **the loader hardened for iOS** (`screens/harbor/harvest.js`): each sprite the WebP first, then a PNG of the same frame
  (`assets/city/harvest/{day,night}.png`, 63 + 54 KB; `scripts/bake/harvest.mjs` now writes both) when the WebP errors, times out (8 s)
  or loads but draws NOTHING (a 16 × 16 read-back with no opaque pixel); `decode()` only a hint (a rejection ignored, 2.5 s cap);
  `harvest.json`'s numbers built in (`MODEL_META`, a unit test keeps them equal) if its fetch fails; the sprites 254 × 229 — far inside
  iOS's canvas limits. A retry after 15 s (C4d's) stays.
- e2e `ONLY=thanks`: the WebPs made to fail (every harvest .webp's src pointed at a missing file) → the model drawn from the PNGs, the
  readout's first line a build id, its row `harvest: MODEL (loaded … png (webp error) …)`.
**Next:** the owner opens `…&prop=model&debug=1` on the phone and reads the `harvest:` row + the build id; we finish it from that.

### 3 — THE DOG's TURN
The owner: jittery when it turns away from an obstacle. Measured on the planner over the forced dog walks: the dog jumped up to **1.85 u
in one frame** (2–8 times a walk) — its place beside the walker came from the walker's 4-way facing (`dirOfHd`), so a heading near a
threshold (the walker's chord turning off a bench or a kerb) flipped it from one side to the other and back, mirrored.
Now (`core/harbor-people.js`):
- `dogHeading` — the walker's path heading at the dog's own lag point, averaged over the last 0.6 s with a tent (13 samples, each
  unwrapped onto the one before): a half turn becomes ONE ease-in-out over ~0.6 s; a wiggle round a threshold never shows.
- `dogOffset` — the place beside the walker a CONTINUOUS function of that heading: the same four places as before on the four headings
  (across: ahead + toward us; in / out: ahead + to the right), in line with the walker on the two diagonals where the side changes.
- `dogPlace` keeps it off the dock's edge + the railing BEFORE the hydrant sniff blends it (the sniff's start used to release that clamp
  in one frame: a 0.21 u step).
- swinging round a walker who turns in place it trots (its legs move), never slides.
- `folk.js#drawDog`: while it really turns (`st.turn` rad / s) its mirror-flip squashes through zero width — one turn — instead of
  jumping from 42 % one way to 42 % the other; walking straight it keeps its 42 % floor.
Measured: the biggest move a frame 1.85 → 0.13 u, the biggest turn a frame 0.10 rad, no facing flip back within ½ s (a unit test: "THE
DOG TURNS IN ONE EASED TURN"). The leash follows the collar (drawn from it). `shots.mjs --scenes dogwalk,dogwalk-day --cast <ms>`.

### Checks
unit 869/869 · e2e (local, Chromium 149) people 17/17 (+ THE DOG's TURN in the page: every frame for 20 s, the fastest 8 u/s, no flip
back), thanks + perf 38/38 with people (the guard 0.86–1.10×; the WebP-less harvest model drawn from its PNGs, the readout's row) · the guard
proven on the C4d build (70.7× → fail) · `shots --scenes dogwalk --cast 24000` at 402×660: the dog swings from the walker's right, toward us,
narrows front-on and comes out facing the other way over ~0.5 s — no snap.

### Known issues
- The harvest model on the owner's iPhone: still unexplained until the readout's row is read on the phone.
- The guard's baseline is the laptop's (`scenes`); the runner's own (`ci`) goes into the file by hand from a CI run's log (the guard's
  three lines print work + the loop) — until then CI warns from 2× and fails from 4×.
