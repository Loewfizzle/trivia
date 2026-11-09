# PD-3 — PRISM DROP: THE NIGHT LOOK (Nov 9 2026, night)

The third of PRISM DROP's rework passes (the owner's plan: docs/games/plan.md "PRISM DROP — THE REWORK PLAN" + "PD-3"): the NIGHT look — neon tube
blocks in each world's own shade, a calmer world behind the board, and a GPU LIGHT ENGINE (the spill, the landing pulse, SLAM's trail + sparks, the
clears' race + burst, 4 LINES' flash, the combo's frame) with four quality tiers. The glass look stays the DAY placeholder until PD-4. + the owner's
ADD-ON (Group 0): WHO GETS LISTED on the public boards. **No rules change** (database.rules.json untouched — nothing to re-publish: `pstats` is
server-only already). **Still 8 functions.**

## Step 0
e6006a57 — docs/games/plan.md "PD-3 — THE NIGHT LOOK", appended unchanged.

## Group 0 — WHO GETS LISTED (the owner's add-on, Nov 9) — 4b99cac5
- A profile is on the public boards from its **3rd COUNTED PLAY** — a counted ROOM match (2+ players) OR a counted DAILY finish (THE THROWAWAY GATE's
  `counts`); a SOLO run never counts. Found on the way: the old floor counted `g.*.p` — which a solo run ALSO bumps (its row carries `p: 1`), so solo
  runs were quietly counting toward the 3-match floor.
- `pstats.cp` = the count, kept by `core/progress.js#matchStep` (+1 for a room match, +0 solo) + `dailyStep` (+1 when `counts`) in their own
  transactions; `countedPlays(stats)` reads it (a profile from before it: its counted matches + its counted daily finishes — an estimate until the
  back-fill); `boardHidden(prof, stats, min)` = THE rule, `lb.js#hiddenOf` calls it. `profiles/{pid}/m` = the same count, now written by a daily too; a
  counted daily that crosses the floor runs `syncBoards` (every game's boards up at once, like a match). `countsOn` (THE THROWAWAY GATE) moved to
  `core/streak.js` (pure; api/daily.js re-exports it).
- THE BACK-FILL (/admin → THE BOARDS → BACK-FILL — the owner's tap): `core/board-fill.js#countedPlaysFromRecords` re-counts every profile EXACTLY from
  the records (results/{key} with 2+ players and not skipped; a record from before `n` counts as a room match + every counted daily run) → `pstats.cp`,
  then EVERY board row is rewritten (not only the overall ones) + `profiles/{pid}/m`; its PREVIEW shows `listedNow` → `listedAfter`.
- THE BOARD's pinned row: "N MORE PLAYS TO JOIN THE BOARD" (was MATCHES). `tests/listing.test.mjs`: 2 dailies + 1 room match = listed; 3 solo runs = not
  listed; a daily from a profile made after that day's 4 am = not counted (then counts the next day); no double count on a replay; the old-profile
  estimate; the back-fill's re-count. /api 44 / 44.

## Group 1 — THE NEON LOOK
- `board.js#neonSprite` beside the glass sprites: a solid DARK core (a deep tint of the colour, a little lighter at the top), the tube's light baked into
  the core's edges (a clipped shadowBlur — once, at bake time), the HOT EDGE tube in the colour + a near-white core line down its middle, a fine glass
  sheen; three variants (a hotter stretch — top-left / bottom-right); the glow = a soft ring sprite drawn 'lighter' under the stack (static). The landing
  ghost = an unlit tube; junk = a grey tube; the danger drain unchanged. `LOOKS.neon.incoming` = PD-2's ghost-row rules through the neon sprites (a red
  tube + hatching — never a block; the leading edge a hot red line). `drawPiece` / `drawMini` take `look` + `pal` (HOLD / NEXT, the rail's duel, spectating,
  the podium).
- `neon.js` (PURE): the palettes — every hue pulled toward its world's by a capped share (`PIECE_PULL` — yellow + orange are 15° apart: they barely move),
  saturation + lightness shaded, the glow leaned toward the world; `edge` / `frame` / `well` / `sparks` / `flash` per world. `tests/prism-neon.test.mjs`.
- The view (`watchLook`): `body[data-look] === 'day'` → glass, else neon — live, a cheap attribute read each frame; the palette follows the song's world
  (`setPalette` → `--pd-edge` / `--pd-frame` / `--pd-well`). The CSS (`.pd[data-look='neon']`): the board's frame a neon tube in the world's edge colour with a
  white-hot core line, HOLD / NEXT + the rail tiles edged in light, the top line in white neon, the callouts lit (BLOCKED! in `--good`, a word too), the
  incoming tag a red tube, the KO / count / tip cards edged; SLAM stays the red push button (a red neon halo round it).

## Group 2 — THE CALMER WORLD
`worlds.js`: `uCalm` + `uBoard` (the board's rect in uv, from the layout — never per frame): behind the board the world drops to ~50 % — its hue kept, a
little less colour, the brights compressed (`c / (1 + 1.1 · lum)`), feathered over ~2 cells; the vignette lighter in the neon look (the top + the edges
stay vivid). The neon board's own glass 0.3 (glass look: 0.5).

## Group 3 — THE LIGHT ENGINE
- `light.js`: ONE WebGL canvas above the board (`.pd-light`, z 3; the overlays moved to 4), sized from a ResizeObserver × the tier's scale; soft light quads
  (blob · streak with a tapering tail · soft rect · frame ring) in one vertex batch (≤ 900 quads); then the bloom: a BRIGHT-PASS in the first down pass
  (only light above 0.42) + a dual-filter chain ½ → ¼ → ⅛ and back (each level adding its own at 0.7), composited at 0.85 with a soft tonemap; the canvas
  writes premultiplied (rgb, a = max(rgb)) — the page adds it (`light + below × (1 − a)`), no CSS blend mode. It hides itself when nothing is lit. Sparks
  are ANALYTIC (a launch + gravity — a frozen still is exact), each a short streak along its motion (the glowing trail) + a hot point.
- `neonfx.js`: the engine's events → the light: the SPILL (the falling piece's light on the well, the nearer wall catching more, a pool on the floor near
  the bottom), THE LANDING PULSE (the locked cells' tubes ring + a soft fill, 0.26 s), SLAM (per column a trail from where it was to where it landed + an
  impact flash + sparks), the CLEARS (the race along each row's tubes — rows alternate direction — then the burst: a white-hot flash, sparks, the shards
  in `fx.js` behind the board at the same instant via `onBurst`; 4 LINES / a perfect clear: a breath of light + the frame flares; a combo lifts the frame),
  a cancel's faint red flash. Every effect ≤ ~0.6 s, additive (never covering the stack or the incoming rows). Reduced effects / reduced motion: × 0.35,
  no motion (no trail, no sparks, no shards, an instant race).
- **THE BLOOM CHOICE — by measurement** (`tests/integration/prism-upload-cost.mjs`, the mini PC's Chromium, 4× CPU, GPU on): copying the 3× board canvas
  (970 × 1940 = 7.5 MB) into a texture every frame — **0.7 ms to issue (p95 0.9), 2.4 ms to finish (p95 4.0)** — on desktop Chrome, where the 2D canvas
  already lives on the GPU; on an iPhone it is rasterised on the CPU (THE GL PAINTER's reason), so the copy is a CPU → GPU upload every frame. The
  chosen design never leaves the GPU: the light layer's whole cost is **~0.5 ms a frame** (the A/B below). So: the moving lights + effects bloom on the
  GPU; the static glow lives in the sprites.
- Sounds: PRISM's own synth effects as before (in the song's key, on its beat) — no new files.

## Group 4 — THE LOOK REVIEW (three rounds + the overlays)
`prism-shots.mjs`'s `pd3` set (35 states; the light layer FROZEN at an effect's age through `__prism.freeze(ms)`, the effects fired down the real path by
`__prism.fire('slam' | 'lock' | 'clear', …)`), at 390 / 402 / 430 with each phone's safe areas + 1440 × 900:
1. The tubes didn't draw (a colour helper returned `rgb(…)` where a hex was expected — dark grey rims); the spill was a heavy fog over the piece; 4 LINES'
   flash whited out the whole board; the square drifted orange in NEON CITY (too close to the L).
2. Fixed + found: the race filled the cells pastel (→ the TUBES surge: a ring of light per cell); the bloom's haze lifted the board's blacks on a combo /
   a 4-line clear (→ the bright-pass + lower gains); the dim behind the board turned AURORA's bright POLAR DAWN sky into a flat brown panel (→ the hue kept,
   the brights compressed).
3. Every state clean at 390 / 402 / 430 (crisp tubes at 3× — `tubes-3x-crop.jpg`), the overlays in neon (the count card, the KO card, Call the Winner's
   ring, the tip, SURVIVAL, the solo podium), Reduced effects, DAY still the glass look (+ PD-2's hatched ghost rows), 1440 × 900 = the phone column.

Shots: `pd-3/worlds-390.jpg` (each world mid-game) · `light-390.jpg` (spill, pulse, SLAM, combo ×4, perfect clear, a reduced SLAM) · `clears-390.jpg`
(1 / 2 / 3 / 4 lines mid-race + mid-burst) · `battle-390.jpg` (the ghost rows, the shatter, the callouts, a reduced 4-line clear) · `screens-390.jpg` (the
duel, spectating, the podium, DAY + DAY's ghost rows) · `sheet-402.jpg` · `sheet-430.jpg` · `desk-1440.jpg` · `tubes-3x-crop.jpg`.

## Group 5 — SPEED
`prism-shots.mjs` PERF (390 × 844 @3, 7 opponents, a bot playing, **4× CPU, GPU on**; each tier LOCKED — `__prism.lockTier` — and ~300 frames RECORDED
over 5 s — `__prism.record`: the old reset `fps().length = 0` emptied a copy, so PD-1 / PD-2's numbers were the last 90 frames' ring). HEAVY = `&heavy=1`:
a 4-line clear every 650 ms with the combo climbing + six ghost rows + the bot + 7 rail tiles.

| moment | tier | board | light layer | fps | p50 / p95 ms | CPU p75 / p95 ms |
|---|---|---|---|---|---|---|
| rest | 3 | 3× | 390 × 844, bloom 3 | 59.6 | 16.7 / 16.8 | 3.5 / 4.2 |
| rest | 2 | 3× | 293 × 633, bloom 2 | 60 | 16.7 / 16.8 | 3.5 / 4.0 |
| rest | 1 | 3× | 195 × 422, no bloom / spill | 60 | 16.7 / 16.8 | 2.6 / 3.6 |
| rest | 0 | **2×** | 195 × 422 | 60 | 16.7 / 16.8 | 2.7 / 4.0 |
| HEAVY | 3 | 3× | 390 × 844, bloom 3 | 60 | 16.7 / 16.8 | 5.7 / 6.6 |
| HEAVY | 2 | 3× | 293 × 633, bloom 2 | 60 | 16.7 / 16.8 | 5.3 / 6.2 |
| HEAVY | 1 | 3× | 195 × 422 | 60 | 16.7 / 16.8 | 4.8 / 5.7 |
| HEAVY | 0 | **2×** | 195 × 422 | 60 | 16.7 / 16.8 | 4.0 / 4.7 |

**The top tier holds 60 fps (p95 16.8 ms ≤ 16.8) at rest AND in the heaviest moment.** What each tier drops (`tiers.js`): 3 → 2 the light layer to 0.75×,
bloom 2 levels, sparks 260 → 160, shards 200 → 130, the world 0.45 → 0.34; 2 → 1 the bloom + the spill off, the light 0.5×, sparks 90, shards 80, the
world 0.28; 1 → 0 the BOARD 3× → 2×, the stack's glow ring off, sparks 40, shards 40, the world 0.24 / 1 octave.
**A/B against PD-2** (`8872d102` served from a worktree on :5174, the same page, tier top, 6 s): rest 2.7 vs 2.2 ms CPU (p75), with six ghost rows
3.8 vs 3.0 ms — both 60 fps, p95 16.8 ms. (A desktop GPU — the real phone check is `?pdperf` on the owner's iPhone.)

## Tests
All on the mini PC, on fresh emulators:
- unit `node --test tests/*.test.mjs` **1462 / 1462** (+ `prism-neon.test.mjs` — the palettes; `listing.test.mjs` — WHO GETS LISTED; the tiers' order in
  `prism-layout.test.mjs`).
- `e2e-prism` FAST **41 / 41** (+ NIGHT LOOK: the neon tubes in the world's palette + the light layer lit by a SLAM + a 4-line clear; DAY LOOK: back to
  the glass live, the light layer off; the frame pacing at the four tiers).
- `e2e-prism` FULL (8 phones) **65 / 65** (the first run 64 / 65: SPECTATE's DUEL SOON — the final duel ended within seconds of starting, so the spectator saw one board + CHARLIE WINS, in the day look; a timing race, not the look: the re-run 65 / 65).
- smoke **6 / 6** (both playable games; none of the ten hidden ones starts).
- `/api` server.test **44 / 44** (Group 0). `e2e-profiles` **134 / 134** on fresh emulators + a fresh serve.mjs (THE BOARD's "N MORE PLAYS" line; its 3-match top-up now seeds `pstats.cp` too). Rules: unchanged — not run. The full harbor
  suite: not run (no city change — a game pass, the ci tag).
- The preload graph regenerated (`neon.js`, `light.js`, `neonfx.js`, `tiers.js`): prism 35 modules, 302 KB (≤ 1.5 MB).

## Not at the bar / left for later
- The numbers are a desktop GPU's (the mini PC's Radeon) at 4× CPU — the owner's iPhone is the real check (`?pdperf`: fps, CPU, the tier, the world's
  size); THE BEAT (PD-5) still drives the light's timing from the server clock.
- The burst lights the cleared rows' OLD place — after the collapse that's the rows that dropped into it (0.26 s, additive); the engine's collapse is
  instant (unchanged rules), so there is no "row hanging" moment to light instead.

## Servers
Started fresh (the leftover emulators of an earlier pass stopped first): the emulators (database + auth) + `scripts/serve.mjs --emu` on :5173, PD-2's
worktree on :5174 for the A/B. The owner's preview server on :5190 (re)started at the end and LEFT RUNNING. Everything else stopped (the emulators' Java
+ node, serve.mjs, :5174 + its worktree removed).
