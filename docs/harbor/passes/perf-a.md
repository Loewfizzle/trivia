# PERF-A — THE OWNER's FIXES + THE LOADS + THE FRAMES (FOG FIRST) + GREEN MEANS GREEN + THE PROFILE (Nov 1 2026, City 2.0)

The first of two speed passes, built from FR5 (`docs/harbor/review-5.md` — its PERF's PLAN), the Grok review (its profile / admin part)
and THE OWNER's PHONE BENCH (Nov 1, iPhone, iOS 18.7, 402×660, dpr 3: 60 fps nearly everywhere; DENSE FOG 41.4 fps / 12.3 MP painted; the
PARTY FINALE 56.7 fps, tier 2 → 1 at 42 s; the conga 58.2; the frame mostly OUTSIDE the JS). ONE session, the groups in order, no helper
agents (the owner's choice); each group committed + pushed on its own. Measured on the mini PC: WebKit 2215 at the owner's 402×660 dpr 3
(the canvas rasterised on the CPU inside the draw calls — the closest thing to the iPhone's GPU-process raster: FR5 A5's method) and
Chromium 1248 with the GPU at 2× / 4× CPU; "before" = the commit before the pass (d044eb7) served from `C:\Users\benja\Documents\trivia-ab`
on :5174. The probes live outside the repo (`C:\Users\benja\wk\` — `wkperf.mjs`, `wkbisect.mjs`, `fogfill.mjs`, `crload.mjs`, `fwload.mjs`,
`wkburst.mjs`, `sheetf.mjs`, `crop.mjs`, `colprof.mjs`, `rowstep.mjs`), like FR5's.

## Step 0
The owner's notes appended to plan.md ("OWNER'S NOTES — NOV 1 (late night)") + decisions.md (the build order: FR5 ✅ + Grok ✅ → PERF-A →
PERF-B → APP FIXES; the bench in §13; the crisp layers KEEP; no `&debug=1` on review links; the two bitcoin balloons + the balloons over the
billboards in §11; the profile scare corrected in §16; KEY_PEPPER set; Vercel Analytics → the launch list) — "docs: plan.md — the owner's
notes, part 43" (d044eb7).

## Group 0 — THE QUICK OVERHEAD WINS (ae700b1)
- **THE SHARD TABLE** (`tests/integration/harbor-jobs.mjs#SECONDS`): every row from the cloud's own per-group seconds (FR5 D1, run
  41269772550) + the missing `fireworks` row. The 4-shard plan now balances to 846–849 s a shard (was 943 / 698 / 780 / 966 under the stale
  table). The jobs' size check (`tests/harbor-jobs.test.mjs`) only held because the old guesses under-read the suite 1.39×: its cap is now
  the honest 10 min (600 s) under harbor.yml's 15-min timeout (the real jobs: 151–583 s).
- **THE PEOPLE TEST SPLIT** (FR5 D4): `tests/harbor-people.test.mjs` (79 s alone — the unit suite's wall time is its slowest file) → six
  files of ~8–15 s (`-dance`, `-solids`, `-doors`, `-counts`, `-walks` + the main), the same 46 checks. **The unit suite 83 → 30 s.**
- **SHARDS = 4 the local default** (`e2e-harbor.mjs`): the full suite measured **20.9 min** (the shards ended at 827–930 s, then panel 103 s +
  perf 222 s; 795 / 797 — the two misses: the calm load (a machine check, now run with the GPU — Group 4) + THE SHOW IS HEARD (a real race,
  fixed in Group 1); the bench's crash was my mid-run edits being served live, it passed on the settled code); nothing timed out. Was 24–28.

## Group 1 — THE OWNER's FIXES (2c20e54)
- **THE CLOSING DRAGON EGGS ACROSS THE FULL WIDTH** (`core/harbor-fireworks.js#partyScript`): 8 crackle shells, x 0.07 → 0.93, a rolling
  salvo (0.16 s apart, alternating heights) behind the lit sign after the curtain — the whole sky crackling at the very end (was 4 over the
  right third). Test: `harbor-fireworks.test.mjs` (6–8 eggs, edge to edge, after the curtain).
- **THE NEAR LAUNCHES** — a fourth layer, `near` (`FW_LAYERS.near`, `screens/harbor/fireworks.js#placeOf`, `scene.js#fwGeomNow`): launched
  from the PIER's far end + two spots on the BREAKWATER by the lighthouse (on this screen — `geom.near`), the tails seen leaving the water,
  bursting LOW + CLOSE: between the skyline's roofs (h 0) and just under the NEON sign (h 1 — a burst's whole radius below its foot, never in
  front of it), in front of the skyline, bigger (s 1.15), the strongest reflections; the lighthouse's own layer bursts low the same way.
  ~1 every 4.5–9 s through the party show, thicker in the 40 s before the finale (~67 a show), a few in the weeknight show; their booms a
  touch sooner + louder than the barges'.
- **THE WILLOW CURTAIN's HORIZONTAL LINE** — found in WebKit at the owner's 402×660: the finale's golden glow ended in a STRAIGHT EDGE right
  under SPEAKEASY. Not a clip: every burst's light WASH is a square quad (~1,100 pt across) whose Gaussian was still ~4 % bright at its edge
  — a big low burst (the curtain's sky willows) drew that edge across the sky. The wash's outer 30 % now eases to exactly 0 at the quad's
  edge (inside 0.7 of its radius the glow is what it was); the bloom + a spark's halo reach 0 at their quads' edges too. Frames compared
  old / new at the same moments: the edge gone, the glow over the skyline as bright.
- **THE PHANTOM SECOND ENGINE** (FR5 #5): every `&force=fireworks` preview also fired City 1.0's 2D rockets in the Harbor's sky
  (`district/fx.js`) — stripped (`scene.js`: `fireworks` out of the sky fx's force set + `fs.noFireworks`, which also keeps them off the real
  NYE / July 4). The bench's fw-week / fw-snow were measuring both.
- **THE BLIZZARD's GROUND STREAMERS OFF** (`snowfx.js#GROUND_WISPS = false`): the wisps stop at the switch; the drifts stay; the rest of the
  blizzard unchanged.
- **THE BALLOONS OVER THE BILLBOARDS** (`balloons.js`, `scene.js#skyTopsNow`, `neon.js#roofRects`): a balloon's floor now holds the roof +
  tower signs and the roof billboards (+ the lamps over a board) across its width and half a balloon AHEAD on the wind (no tuck — it rises
  as it reaches one, eased like over a tall tower), + the thin tips (a spire, the needle's tube) only right under its body (counting them
  across the whole window lifted every balloon into one row — not a blanket lift). Still under the tagline. At 402 the strip under the
  tagline is a balloon's height, so the festival flies in a near-row there (the owner's "a balloon's height of room").
- **THE TWO BITCOIN BALLOONS — THE OPPOSITES** (`balloons.js`): 'btc-orange' = an ORANGE envelope with a BLACK ₿ at every hour (lit orange at
  night with its black ₿ — the look the owner keeps exactly); 'bitcoin' = a BLACK envelope with an ORANGE ₿ at every hour (still black at
  night, its ₿ glowing). Never neighbours: `apartSpots` swaps the black one to 3 spots across from the orange one (opposite halves; no extra
  random draws — the same plan on every phone; `harbor-balloons.test.mjs`, 500 shuffles). Day + night looked at 390 / 402 / 430.
- **A TIMED BOOM NEVER DROPPED WHILE ITS SLOT LOADS** (`audio/city-sound.js`): the cloud's "THE SHOW IS HEARD" was a real race — on the
  first tap all 72 firework takes start downloading and the first boom's random take could still be decoding (dropped as late). A sound
  whose peak is on the clock now plays an already-decoded take of the same slot while the rest load; the fireworks prefetch takes the
  first take of EVERY slot first. 3 / 3 green after.

## Group 2 — THE LOADS (ace8019; the pixel watch's line rode in 2c20e54)
- **THE PIXEL WATCH** (`scene.js#pixWatch`, `&debug=1` only; FR5 #1): its `getImageData` is a GPU read-back that waits for everything
  queued — the blizzard's 4-s load freeze. It now reads only while nothing bakes (the bakes, the lit layer, the neon's sprites, a
  crossfade); the debug strips refresh once a second for the first 15 s after the reveal (then twice). Measured (Chromium, GPU, 4× CPU,
  402×874, the blizzard link with `&debug=1`, two loads each): before — one load froze **4.1 s at 7.3 s** (the 4.0-s long task), 16–17 s
  of long tasks; after — no freeze past the first second's load, 14–15 s of long tasks. WebKit never showed it (no GPU read-back there).
- **THE CHRISTMAS WIRE** (`title.js#xmasWire`, FR5 #8): traced once per letter set and kept (memory + this device's localStorage,
  `nd:xwire:*`); `k` (how many are lit) stays live. A warm December load: the longest task **1.3 → 0.65 s**, long tasks 5.1 → 4.3 s (4×).
  Pixdiff: the wire identical (the only change was moving sparks that also differ between two old runs).
- **ONE DATE FORMATTER PER ZONE** (`core/sky.js#localParts`, FR5 #7).
- **THE WEEKNIGHT SHOW's LOAD** (the bench's slowest, first frame 4.7 s): its extra was the phantom 2D engine — 9.3–9.7 s of long tasks at
  4× before vs a plain night's 6.9; after: 6.4–6.8 (= a plain night). The GL layer's init already happens at T−20 s (the engine's look-ahead).
- **pixdiff.mjs FIXED**: puppeteer now returns screenshots as a `Uint8Array`, whose `toString('base64')` is a comma list — the diff's
  images never loaded and every run hung at the protocol timeout. `Buffer.from(…)`. + scenes `christmas`, `fog`, `fog-party`, `mist`.
- NOT done (→ PERF-B): the frost pane after the reveal + sized to the glass (H18, 245–314 ms at 4× in freezing weather), the people's plan
  warm-up spread over frames (M).

## Group 3 — THE FRAMES (f446815 fog, 2d0e08e the finale)
- **DENSE FOG** (the owner's #1). Where its pixels went (WebKit 402×660, fog vs a clear night 9:30 pm): 11.3 vs 5.7 MP a frame — the five
  veils 1.95 MP, the drifting banks 1.52, a full-screen cloud deck 0.92, the halos 0.52, the water fog 0.54, the lamp glow 0.24. Bisected by
  frame cost (each part off in turn on one page): the veils ~6 ms, the halos ~2, the water fog ~2, the banks ~1.5, the glow ~0.5 of the fog's
  ~16 ms over a clear night. The fixes, none visible:
  · the five VEILS, the LAMP GLOW and the water fog's BODY: cached 1-pixel-wide strips of the same gradient at the screen's device rows,
    stretched across (an image draw instead of per-pixel gradient shading — the veils ~6 ms → 0.4);
  · the BANKS' + the water WISPS' two drifting layers composited into one strip at CSS resolution (the tiles are softer than that) and
    drawn once (source-over / lighter twice into the strip then once onto the city = the same picture);
  · the CLOUD DECK not painted under a dense far veil (≥ 0.82: it showed through at ≤ 18 % — pixdiff with the clouds off: no pixel past Δ 24).
  **WebKit fog frame 34.5 → 25.9 ms (−25 %); the fog's cost over a clear night 17 → 8.4 ms; 11.3 → 9.2 MP painted.** Pixdiff: fog, fog on a
  party night, a clear night — nothing beyond the noise (mist: only the 9:30 pm show's burst moved — Group 1's new shells).
- **THE PARTY FINALE** (tier 2 → 1 on the iPhone at 42 s): its JS is unchanged (Chromium A/B: the same), so the target is the GPU fill. Every
  burst's light WASH covers most of the screen (a quad ~1,100 pt across), ~10 alive in a finale — ~10 MP of fragment work a frame at
  tier 2's dpr 2 for the smoothest thing on screen. The washes now render into a QUARTER-resolution buffer (1/16 of the fragments) added
  once through a linear upsample; a context without the buffer falls back to the old pass. The look compared frame by frame in WebKit:
  the same glow, no blockiness. **Unmeasurable on the mini PC** (Chromium's GPU and WebKit's software GL both sit outside the frame's JS):
  the owner's bench run states it.
- **THE CONGA** (WebKit 36.2 → 35.6 ms, the same): the crowd's figures (FR5: the rigs re-derived per figure per frame) are the cost — the
  per-figure pose cache (M) is PERF-B's if the owner's next bench still shows the conga short.
- **THE CRISP LAYERS — KEPT** (the owner): the roof signs' crisp copies already yield in fog (scene.js#roofCrisp's `fogK`); nothing dropped.
- NOT done (→ PERF-B): A4.2 the WAIT / WALK sprite, A4.3 the flake key, A4.4 the per-frame gradients in `draw()`, the one glow-sprite cache
  (H2) — each ~0.1–0.3 ms of JS, and the phone's frame is mostly outside the JS.

## Group 4 — GREEN MEANS GREEN (e809375)
- **LOAD WEATHER — fixed in the city** (FR5 #3): a window share / bias / warm / night / holiday step in the 15 s after the reveal
  (`TIER_GRACE`) rides the slow blend like a weather change (`scene.js#rebakeLights`) — on the real clock a step landed there every few
  minutes: a 1.2-s window flash for a phone loading at that second.
- **The test-side bugs** (FR5 D3) — each now fails on the bug it guards, passes on the real city, never a wider tolerance:
  · THE TOAST WALKS IN: the frame-count clause → the pair seen in most frames;
  · THE TOAST's BIGGEST ARM STEP + THE DOG's TURN: sampled on the SCENE's clock (`loop().drawnAt` — the drawn frame's own rAF stamp; ≥ 0.1-s
    windows for the dog): **0.26–0.31 → 0.14 rad** (under 0.25), **11+ → 7.5 u/s** (under 11);
  · ITS NERVES: calm within 18 s of the LAST poke that scared one (the title re-pokes them);
  · THE LATE JOINER: the timelines agree (8 ms) + each phone within the engine's own 120 ms (42 / 51 / 42 ms).
- **THE PERF GROUP WITH THE GPU locally** (`e2e-harbor.mjs`: its own child, GPU=1, unless CI / GPU / VSYNC is set): the TV is 60 Hz now —
  A CALM LOAD STEPS NOTHING passes (tier 2 held); the baseline guard 0.54–0.81×.

## Group 5 — THE PROFILE + TABS + ADMIN (a2b236d)
FR5 section E + the Grok review's area 1, both verified in the code (Grok was right on the key overwrite — `me.js` ensure).
- **NEVER OVERWRITE A SAVED KEY** (`profile/me.js`): when `ensure` makes a NEW profile while a different key is on the device (a lost guest
  login, a failed IndexedDB migration), the device KEEPS its key + its "saved" note, the new key waits aside (`pnotes.heldNew`), the
  membership card offers **THIS DEVICE ALREADY HAD A KEY — RESTORE IT?** (RESTORE IT / No — keep the new profile: the old key then kept in
  `pnotes.oldKeys`, never destroyed).
- **NEVER CACHE "NOT ADMIN"** (`screens/harbor/remote.js#checkAdmin`): only a yes with a real pid is kept (6 h, per tab); a whoami with no
  pid waits for this device's profile sync + asks once more; every profile change (`me.js` → `nd:me`: a restore, a first link) asks again;
  an old pinned "no" is dropped.
- **THE SECOND TAB** (`identity.js#watchDuplicateTabs`, `app.js`, `host.js`): one tab of a slot stays the player, a newer one YIELDS — a
  banner that stays ("ALREADY OPEN IN ANOTHER TAB — USE THAT ONE"; a test slot names itself; never `?slot=2`) + its host loop stops
  (`state.dupTab`); USE THIS TAB swaps them; a yielded tab takes over once the other has not answered for 9 s (closed, or frozen in the
  background). No lock, nothing stored.
- **THE EMPTY CARD SAYS WHY** (`screens/profile.js`): no key + no profile → "Nothing saved on this address yet (<host>) — if you have a key,
  enter it below. Your profile wasn't deleted."; a cached profile of another login is never painted as the member ("THIS DEVICE'S SIGN-IN
  CHANGED — RESTORE WITH YOUR KEY" when its key is here).
- **THE RESTORE RETRIES** (`me.js#restoreKey`, `api.js`): a network failure / timeout (status 0) retries 3× with a backoff + a 15-s wait
  ("WAKING THE SERVER — TRYING AGAIN"); a server that answered is final; the invalid sound only for a refused key.
- **THE ORIGIN** (apex → www, the owner's Vercel setting): the code now SAYS which address an empty card is on and never overwrites a key;
  a player landing on the other address sees "Nothing saved on this address yet (www.neonspeakeasy.com) … your profile wasn't deleted" and
  restores with the key. The primary host itself stays the owner's decision (FR5 E4).
- Proof: `e2e-profiles.mjs` 49 / 49 (+ 7b the key kept + the offer + RESTORE IT, 7c the second tab + USE THIS TAB + the close, 7d the empty
  card), `e2e-conn.mjs` 18 / 18.

## THE FINAL LOCAL RUN (the mini PC, alone)
Unit 954 / 954 (30 s) · rules 45 / 45 · /api 25 / 25 · smoke (`GAMES=cipher`) 3 / 3 · profiles 49 / 49 · CONN 18 / 18 · **THE FULL HARBOR SUITE
801 / 801 in 20.2 min** (4 shards: 826–918 s, then panel 100 s + perf 192 s with the GPU) — every check green, the calm load included.

## THE NUMBERS (before → after)
| scene | WebKit 402×660 dpr 3, frame work (ms) | painted a frame | Chromium GPU 2× (work ms) | load |
| --- | --- | --- | --- | --- |
| dense fog, 9:30 pm | **34.5 → 25.9** | 11.3 → 9.2 MP | 8.3 → 6.2 (noise ±2.9) | the readout's freeze: n/a in fog |
| the party finale | 36.0 → 36.2 (the GPU's washes: 1/16 the fragments — the phone decides) | — | 21.1 → 20.7 (same) | — |
| the conga break | 36.2 → 35.6 (same) | 8.5 MP | 27.2 → 27.2 | — |
| the weeknight show | **35.5 → 21.6** | — | **11.2 → 9.7** | **9.5 → 6.6 s** long tasks at 4× (= a plain night) |
| a plain night | 17.5 → 17.7 (same) | 5.7 MP | — | — |
| the blizzard + `&debug=1` | — | — | — | a **4.1-s** freeze in 1 of 2 loads → none |
| December, a warm load | — | — | — | the longest task **1.3 → 0.65 s** |
Memory: the 20-cycle check + the baseline guard pass (0.54–0.81× the baseline); canvases: two fog strips (~0.2 MB) + the quarter-res wash
buffer only while a show is near (~0.2 MB at tier 2).

**The pass overhead**: the unit suite 83 → 30 s (run 4–6× a pass: −4 to −5 min); the full local suite 24–28 → ~21 min (4 shards); the calm
load green locally; ≈ 8–12 min off a pass. PERF-B takes the rest (the windows group's pages in parallel: → ~15 min).

## Decisions
- **The near launches are a fourth layer** (`near`), not the barges moved: the barges stay the big far-water fans behind the skyline's
  front; the near ones read as depth (low, close, under the sign, tails off the water). The lighthouse's own shells burst low too.
- **The washes at quarter resolution** — a Gaussian ~100 pt wide loses nothing at 2 pt texels; the hard near-edge step (0.32 → 0.16 at the
  speakeasy's top) softens by ~2 pt, invisible.
- **The cloud deck skipped under dense fog** by measurement (pixdiff Δ ≤ 24), not by guess; mist keeps it.
- **Balloons**: the thin spire tips count only under a balloon's body, the boards across its width + ahead — the owner's "never parked
  behind one, not a blanket lift".
- **The second tab**: the OLDER tab stays the player (a reload of the old one starts clean); the newer yields with a button to swap.
- **A lost login keeps its key + OFFERS the restore** (the owner's words) rather than restoring silently.

## Known issues
- **The finale + the conga on the phone**: the finale's GPU saving (the washes) and the conga's crowd can only be judged by the owner's
  `&bench=1` run; if the finale still steps 2 → 1, PERF-B: the crowd's pose cache (M), then the crisp layers at the party peak (the
  owner's last resort).
- **Group 2's frost pane + the people's plan warm-up** and **Group 3's small JS items** (WAIT / WALK sprite, flake key, per-frame gradients,
  one glow-sprite cache) → PERF-B.
- **THE SET IS NEVER SEEN** (windows, an `okF` flaky check): failed once in a group run (the TV room's brightest cell 197 vs 175 at a random
  flicker peak) — nothing in this pass touches that room; it passed in the full run. Watch it.
- At 402 the balloon festival flies in a near-row under the tagline (the strip of open sky is a balloon's height there).
- The near launches' x come from the scene's three water spots (the pier's end + the breakwater); a phone sideways / a desktop may show
  them clustered right — DESKTOP's pass.

## Handoff
- **PERF-B**: the windows group's 31 pages in parallel (446 → ~150 s: the suite ~15 min), the fixed sleeps (`harborUp + sleep(1500)` →
  `settled()`, the music / legends sleeps), the cloud's leftover minutes (the perf job's warnings-only loop, the smoke's 14-s watch,
  `--no-audit --no-fund`), the standing-rule leaks (FR5 C2: the wind's five leaks, `harbor-moments.js:97`, the tier strays, the force-flag
  test's regex, one `canvas-safe.js#mk` for the district modules), the first three scene.js cuts (fireworks, legends, holidays — pixdiff +
  the guard each; pixdiff works again), + this pass's leftovers above.
- **APP FIXES** (the ci tag): Grok's other findings — presence healing + a fresh hostBeat blocks a claim (client + rules), the radio after
  unlock + the title's clock offset + stop / gain / seek, the rules holes, chat locks for stakes / rum, the lobby chat leak. The owner
  RE-PUBLISHES THE RULES after it.
