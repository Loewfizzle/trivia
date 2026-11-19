# HIGH RISE — S4A FIX: ZERO GARBAGE (the iPhone stalls) + UFO LIGHTS + PINK TAPE + THE ICON (Nov 19 2026 — on the Beelink)

The owner's decisions: `docs/games/plan.md` "HIGH RISE — S4A FIX" + "— S4A FIX, THE ADD-ONS". The game's page: `docs/highrise.md`
("THE LAG RULES" 7, "THE HITCH COUNTER", "THE WELCOME", "THE END", "THE FLYERS", "THE LINES", "THE SOUNDS"). No rules change, no
`/api` change — nothing to re-publish. Nothing counts (the switch stays OFF).

| group | what | commit |
| --- | --- | --- |
| Step 0 | the decisions into plan.md; the Lab's marks re-exported (no open FIX mark) | a9fb0776 |
| 1 | ZERO GARBAGE IN PLAY + THE HITCH COUNTER honest + the guard | b8ec092e |
| 2 · 3 · 4 | the UFO's far-side lamps · the pink tape's white core · THE ICON = THE TOWER | c2028a5b |
| 5 · 6 | (inbox 2:57 pm + 3:00 pm) THE WELCOME = A · THE SIGN · THE END = A · THE HERO NUMBER | aa327e05 |
| 7 · 8 | (inbox 3:31 pm + 4:02 pm) NO PINK FLASH at a run's end · GROW-BACK's five takes | 046d4f85 |
| close | the fresh-eyes review's two fixes, the docs, the final run | (the tagged push) |

## 1 · ZERO GARBAGE IN PLAY

**The report:** the owner's iPhone, `?fps=1`, Safari — 60 fps on average but HITCH 88 by day (floor 83) and HITCH 52 by night (floor
53), the last cause "gc 41 ms" both times: about one 2–3-frame stall a floor. A page that makes garbage every frame makes its
browser's collector run; Safari's pauses are long enough to see.

**How it was measured** (`tests/integration/highrise-alloc.mjs` — now the guard too): Chromium's own allocation sampler
(`HeapProfiler.startSampling`, the collected objects included) at a rate that catches nearly every allocation at its true size, over
60 s of a live run on /highrise-play (`?fps=1` on — the owner's own line), 390 × 844 @3, each look, from floor 30 (the flyby, then the
UFO), a bot dropping each slab at its perfect moment, every 9th a cut. Every allocation is charged to the function that made it and
TOLD APART by its size: **12 bytes = a BOXED NUMBER** — Chromium's own way of holding a fraction in a function its optimizer has not
reached (Safari keeps a fraction in the value itself: it allocates nothing for one) — anything else is an **OBJECT** (a list, a
record, a closure, a string): garbage in every engine. One-offs (≥ 1 KB, seen ≤ 3 times a site) are listed apart, not in the rates.
The BEFORE numbers are the same script against a worktree of S4A's code (35455930) on its own server.

**BEFORE → AFTER (KB a second, 60 s a look, the mini PC):**

| | night BEFORE | night AFTER | day BEFORE | day AFTER |
| --- | --- | --- | --- | --- |
| OBJECTS, all | **175.6** | **35.8** | **117.3** | **13.6** |
| … the game's own code | **69.4** | **3.7** | **70.6** | **3.6** |
| … three.js | 106.1 | 32.0 | 46.5 | 10.0 |
| boxed numbers (Chromium only) | 370.6 | 252.8 | 339.9 | 227.2 |
| the heap's growth | 443.2 | 240.5 | 379.7 | 208.6 |
| collections seen in the 60 s | 42 | 23 | 35 | 19 |

**The top sites BEFORE (night; objects, bytes a second):** three's `renderBufferDirect` 42,404 (a closure a draw call — below) ·
three's `Xt` (its program key) 20,841 · `kit/tiers.js quantile` → sort 17,597 + 12,072 (the tier rule copied + sorted its 120 samples
three times an asking) · three's `setup` 16,122 · `night.js draw` 9,780 (+ 126,480 of boxed numbers) · three's `update` 8,140 · its
render lists' `sort` 7,971 + `push` 6,378 · `updateRenderTargetMipmap` 5,006 · `engine.js slabAt` 4,060 (two records a frame) ·
`stage.js frame` 3,739 · `night.js info` 2,788 (the fps line's whole record) · by day also `bands.js plateMix` 2,819.

**The top sites AFTER (night):** three's `projectObject` 20,968 + its lists' `push` 6,370 (its render lists regrow every pass in
Chromium — below) · `updateRenderTargetMipmap` 4,386 · `stage.js frame` 1,392 (a landing's words + events) · three's `render` 644 ·
`fpsLine` 244 (once a second) · the audio engine's clock watch 214 · `engine.js drop` 146 · `sfx.js lateStart` 141 (a buffer source a
sound) · everything else under 125. **By day:** three's `push` 6,806 · `projectObject` 2,225 · `frame` 1,029 · the rest under 900.

**What changed** (the rules: docs/highrise.md "THE LAG RULES" 7):
- `kit/tiers.js` (the shared kit — JAYWALK + HOLD'EM too): the samples in two rings of numbers, a quantile off a scratch sorted in
  place — the SAME rule (a plain-list model of the old one agrees on 360,000 random frames).
- `stage.js`: `frame()` builds nothing — the frame times in a ring, the HUD's big number keeps its digit boxes (only a changed digit's
  text node is written), the announcer lane plays ONE kept animation a length, the two right-edge tags are placed ONCE A LANDING for
  where the camera will rest and a CSS transition rides them there, the sounds' cues are constants in a kept list, the run's events in
  a list whose room is made once, the fps line once a second in three kept text nodes.
- `night.js`: the camera only SLIDES (its turn worked out once — no `lookAt` / inverse a frame), every box written straight into the
  instance buffers through one scratch of doubles, the frame's fractions in typed scratches (never a variable two functions share: an
  engine boxes it), the plates' mix / the sliding slab / the day's air written INTO kept records, a floor's colour in a ring of kept
  triples, the tapes laid once, a uniform written only when it changed, the draw order fixed once (`sortObjects = false`), no
  function that runs every frame holds an inner function (its record is made at every call — both engines).
- `flyers.js` (a light = 14 numbers in the stage's scratch; THE MOTHERSHIP works nothing out while it is not in the sky) ·
  `tower.js` (the top is one record written in place, the slabs a pool) · `sfx.js` (a POOL of voices, each its own gain + `ended`
  handler: a sound = its buffer source, nothing else) · `engine.js#slabInto`, `bands.js#plateMixInto` + `hazeInto` (the old calls stay).
- **three.js is its READABLE build on every page** (`index.html` + the unlisted pages + the previews — the same pinned 0.160.0, the
  same CDN; +66 KB to download once): the MINIFIED build's minifier folded `setProgram` into `renderBufferDirect` as a function made +
  called on the spot — a closure at EVERY draw call. Measured with the final code (`--min-three`): three.js's objects **97.4 → 32.0**
  KB a second by night, **40.8 → 10.0** by day.

**THE TARGET — where it stands, honestly.** The pass's target was "≤ 20 KB a second, both looks, the flyers in". **The game's own
code: 3.6–3.7 KB a second in both looks** (what a landing changes) — the frame itself makes no objects, in any engine. **All objects:
13.6 by day (met), 35.8 by night (NOT met in Chromium):** what is left there is three.js's own — its render lists are emptied with
`length = 0` each pass, which in V8 drops their storage (five passes a frame under the bloom: the night look), and a small list per
render-to-target. JavaScriptCore keeps a short list's storage: on the iPhone that part should not exist — to be confirmed by the
owner's HITCH line, not claimed here. The boxed numbers (≈ 230–250 KB a second) are Chromium's alone: `night.js draw` is called once a
frame and stays in V8's first tiers for minutes (it kept falling back: "insufficient type feedback"), where every fraction is a
12-byte box. They do not exist in Safari; on Android they are short-lived young-generation garbage (scavenged in ≈ 1 ms) — a later
pass could split `draw` so V8 optimizes it sooner (OPEN FOR BEN).

**THE GUARDS:** `node tests/integration/highrise-alloc.mjs "<chromium>"` — 30 s a look with a flyer in the sky: FAILS if the game's
own code makes over 12 KB of objects a second, or three.js over its line (45 by night · 20 by day) · `tests/highrise-zero-garbage.test.mjs`
(8 — the pure twins equal the old calls, the cues are constants, the pool's priority rule = `admit()`, the tower's kept records, the
tier rule = its model, STATIC: no function that runs every frame builds a list / record / closure / spread / string or holds an inner
function, the honest counter, the readable three.js).

**THE HITCH COUNTER IS HONEST** (`stage.js#hitch`): "gc" only when a collection is KNOWN to have run in the stalled frame — a canary
object held by a `WeakRef` + a `FinalizationRegistry` (both in Safari; asked only while a stall is being named) — a touch has its own
mark (`tap`), slow frame code = `work`, nothing known = `unknown` (never guessed as gc). `?fps=1` now reads
`HITCH 3 (last: gc 41 ms @83 · gc 2 dom 1) · GC 14` — the count by cause + the collections seen this run.

## 2 · 3 · 4 — THE UFO · THE PINK TAPE · THE ICON
- **THE UFO** (`flyers.js`): the far rim lamps were drawn at 40 %, as glows over the body — nothing hid them. A lamp is now lit by how
  far the rim's outer face it sits on is turned to the lens (`LAMP_FROM` 0.03 → `LAMP_FULL` 0.25): fully off behind the hull, a short
  smooth fade as it rounds the rim, full in front; both looks. Shots: `Downloads\NEON\highrise-s4a-fix\ufo\`.
- **THE PINK TAPE** (`night-fx.js TAPE_F` `uCore`): a thin WHITE core at its heart, the pink a band either side, then the glow; a plum
  outline under it by day; the core on the edges turned to the camera only; the SAME program as the gold tape (`uCore` 0: unchanged);
  the friend's tag edge the same look. **The fresh-eyes review's fix (the close):** by night that was "a white line in a pink glow" —
  exactly what a pink slab's own edge is; the night tape's front edges now carry a WIDER, DEEPER pink band (`TAPE_CORE_NIGHT` 2.6) and
  the day's dark outline: white · solid pink · a dark edge. Shots: `…\tape\`.
- **THE ICON** (`core/marks.js` `highrise` = A · THE TOWER, the owner's three paths as given): no stroke leaves its box — but at the
  house tube width (7) its floor lines, 8 apart, closed into two solid blocks, so the mark names its own width (`w: 4.5` —
  `ui/mark-svg.js`; every other mark keeps 7). Shots: `…\icon\`.

## 5 · 6 — THE WELCOME = A · THE SIGN · THE END = A · THE HERO NUMBER (the inbox, 2:57 pm + 3:00 pm)
Both in docs/highrise.md ("THE WELCOME", "THE END"). ONE builder for the end (`endscreen.js#endCard` — the page's card AND the
cartridge's body). Shots: `…\screens\` (both looks, 390 × 844 + 375 × 667, a first visit / a best, a miss / a NEW BEST / MADE IT) +
`…\cartridge\`. **The fresh-eyes review's fix:** the dashed ghost's right arm ran through its "BEST 119 ↑" words where the screen's
edge left no room beside the corner — the words now sit OVER the arm's end there (`stage.js GHOST_TAG_UP`).

## 7 — NO PINK FLASH WHEN A RUN ENDS (the inbox, 3:31 pm)
**The cause:** the CONSOLE crowns its podium frame 2.5 s after it stands — `css/components.css .final.crowned::before` washes the
game's ACCENT at 55 % over the WHOLE screen for 0.6 s (a winner's flash); HIGH RISE's accent is its sign's hot pink. Recorded
(`tests/integration/kit/flash-watch.mjs` — the compositor's own screencast frames, each one's pink share): **84 % of the screen pink**
for a few frames, on the CARTRIDGE's end screen only. The test page builds its own card: every cause in both looks + PLAY AGAIN — it
never flashed. **The fix, at its source for this game:** `.hi-final .final::before { display: none; }` (14 % after). The watch FAILS on
the old code; it runs in `e2e-highrise.mjs` (the end coming up, 3.9 s — past the crown — + PLAY AGAIN) and `highrise-play.mjs` (each
cause × both looks). (The same crown flash fires on every game's SOLO end — in THAT game's accent; a note went to the city's inbox.)

## 8 — GROW-BACK's FIVE TAKES (the inbox, 4:02 pm)
The owner's five candidates (`Downloads\grok\highrise\sfx\grow-back-v2\` — COPIED, the originals untouched) → mono, all at −20 dBFS
RMS (`scripts/build-highrise-growback.mjs`), MP3 by the game's own encoder: `audio/highrise/grow-back-1…5.mp3` (~14 KB each; the old
`grow-back.mp3` is gone); the gain 0.5 keeps each under the chime. THE SOUNDS sheet: GROW-BACK's row = five buttons 1–5 — a tap plays
that take IN CONTEXT (a perfect chime with it on top, three in a quick streak) and CHOOSES it (this phone: `hi:play:snd:grow-back`);
the game — the page AND the cartridge — plays it; COPY MY PICK copies `HIGH RISE · GROW-BACK = n`. Default: take 1.
**The next pass keeps the picked take and removes the other four** (files + credits).

## THE CALLS (made, named)
- The guard counts OBJECTS, not Chromium's boxed numbers (they are not garbage on the phone the report came from).
- three.js as its readable build on EVERY page, the city's too (one cache entry for the whole site; +66 KB once).
- The mark's own tube width (4.5) instead of redrawing the owner's paths.
- THE WELCOME's first slab always comes from the far left (the mockup's); the run's real first slab comes from its seed's side.
- The cartridge says NEW BEST on this phone's first run (its best is the server's once counting is ON); the test page says YOUR BEST.
- The takes are numbered 1–5 (the buttons' own labels), not A–E; the cartridge has no SOUNDS sheet — the pick is made on the test page.
- All five takes' credits are in CREDITS.md NOW (the inbox said "only once picked"): the files ship today, and take 4's CC BY 4.0
  credit is required while it ships.
- The end's flash is switched off for HIGH RISE alone — the console's crown is another game's winner's moment.
- The night pink tape got a dark edge + a wider band (the fresh-eyes review) — still "a white core inside the pink".

## THE FRESH-EYES LOOK (a reviewer that built none of it — the UFO, the tape, the icon, the welcome, the end, the SOUNDS sheet)
OK: the UFO (no amber on or through the hull, both looks) · the icon (nothing clipped, the floors apart at 24 + 40 px) · the welcome
(no overlap, nothing cut at 375 × 667) · the sheet. **Two clear finds, both fixed** (above): the night pink tape lost among the pink
slabs · the dashed ghost through its own words. Left (minor, named): the icon's strokes are lighter than the sneaker's beside it (its
own width, above) · the unselected AUTO / NIGHT are pale on the day sky · the gold tape on the welcome is thin by night (the tag
carries it) · a tied best (floor = YOUR BEST) shows no tape at the end · in the cartridge the tower stops at the frame's foot.

## THE FINAL RUN (the mini PC, fresh emulators + servers, nothing else busy)
- the unit suite `node --test tests/*.test.mjs`: **2338 / 2338** (with `highrise-zero-garbage` 8 · `highrise-s4a-fix` 6 · the engine /
  server / sim / lab / play / cartridge files · the CLAUDE.md size (34.1 KB) + the boot budget + the preload graph + the file hashes)
- `e2e-highrise.mjs` (the emulators, the full run — counting OFF, then ON by the test flip): **61 / 61** — REPLAY = LIVE, WOULD COUNT ==
  the phone's result, the forged node refused, NO PINK FLASH at the end + at PLAY AGAIN, THE HITCH RUN inside the cartridge: 0 hitches
- `highrise-play.mjs` (the test page, the whole check): **238 / 238** · `highrise-lab.mjs`: **45 / 45**
- `sound-sync.mjs` (both games, music ON + OFF — the pooled voices): **42 / 42**
- `e2e-smoke.mjs` (THE PAGES LOAD in Chromium + WebKit — /highrise-play, /highrise-lab, /jaywalk-lab too — and the playable games on
  the readable three.js): **25 / 25** · `jaywalk-lab.mjs` (the shared tier rule + three.js): **103 / 103**
- `highrise-alloc.mjs` (THE GUARD, 30 s a look): **8 / 8** — the game's own code 4.7 (night) · 4.8 (day) KB of objects a second; three.js 32.1 · 11.0
- No rules / `/api` change: `rules.test.mjs` + `server.test.mjs` not run. The judge + REPLAY = LIVE are untouched (the engine's rules did
  not change: `slabAt` is `slabInto` into a new record — `tests/highrise-engine.test.mjs` + the page's replay check under every end).
- Every server this pass started is stopped (its own emulators, `serve.mjs` on :5173 / :5174 / :5175 — by PID); the BEFORE worktree is removed.

## OPEN FOR BEN
1. **The phone check** — https://neonspeakeasy.com/highrise-play?fps=1 (a long run in each look; the line now ends
   `HITCH n (last: … · the count by cause) · GC n`) · https://neonspeakeasy.com/highrise-play?floor=80 (the UFO's lamps). A
   screenshot of the line after ~80 floors tells whether the stalls are gone — and, if any are left, their real cause.
2. **GROW-BACK — pick by ear:** /highrise-play → SOUNDS → GROW-BACK 1–5 → COPY MY PICK → paste it. The next pass removes the other four.
3. **Chromium / Android:** `draw` stays in V8's slow tiers (boxed numbers, ≈ 240 KB a second of short-lived garbage) — split it in a
   later pass? Only if an Android phone shows hitches.
4. **The night total** is 35.8 KB of objects a second in Chromium (three.js's own lists) against the 20 target; the game's own code is
   3.7. Patching three.js itself (a vendored copy) would close it — not done without your call.
5. The welcome's slab always from the left · the cartridge's NEW BEST on a first run · the icon's thinner strokes — say if any should change.
6. S4A's own open items stand (docs/games/passes/highrise-s4a.md "OPEN FOR BEN").
