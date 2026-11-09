# PD-4 — PRISM DROP: THE DAY LOOK (Nov 9 2026, night)

The fourth of PRISM DROP's rework passes (the owner's plan: docs/games/plan.md "PRISM DROP — THE REWORK PLAN" + "PD-4"): the DAY look — a coloring
book. Crayon blocks in the night's colour families, a paper the host deals each match, each song's world as a faint crayon doodle, paper panels, the
crayon moments, Permanent Marker callouts. The glass look is retired as the day look. + the owner's ADD-ON (Group 0): SHARE TODAY's ONE CARD, BALANCED.
**No rules change** (database.rules.json untouched — the paper rides the host-written `game` node + THE NIGHT'S MEMORY's existing `meta/used`).
**Still 8 functions.**

## Step 0
19c1a242 — docs/games/plan.md "PD-4 — THE DAY LOOK", appended unchanged.

## Group 0 — SHARE TODAY's ONE CARD, BALANCED (the owner's add-on, Nov 9 — his real share in a text thread: "cramped + half empty")
- **THE HEIGHT USED** (`js/daily/share-today.js`): the sections share ALL the room between the header and NEONSPEAKEASY.COM (no empty band above the
  foot); each section is handed its whole box (`paintSection(c, { …, W, H })`) and centres its block in it; a box under the section's smallest
  (`SECTION_H` 420 — 3+ dailies) is scaled as before.
- **THE HEADER ~1.4×**: the date 38 → 53 px, the streak line 32 → 45 px, the flame 52 → 72 px. Each daily's wordmark 0.62 → 0.87 of its card's sign.
- **THE PASSWORD** (`password/share.js#paintSection`): CENTRED — the headline (WELCOME IN / LOCKED OUT) + "n GUESSES · m:ss" on top, then the TWO GRIDS
  SIDE BY SIDE, centred, the cell as big as the box allows up to 56 px (was 40 — +40 %), the same 90 px gutter both sides; each grid headed by its
  small drawn door (a new piece `paintDoor` — the card's own `door()`); the "THE FRONT DOOR / THE BACK ROOM" names DROPPED on the combined card (the
  daily's own card keeps them). A tall run (more than 3 rows — every LOCKED OUT door has 6) puts each door BESIDE its grid so the height goes to the
  cells (~38 px instead of shrinking to ~27).
- **COAST CLEAR** (`coastclear/share.js#paintSection`): the result (the headline over its line) + THE BIG TIME (176 px) side by side, centred as a PAIR
  (measured), the beam behind a clear's headline; the three searchlights ~2× (S 2.6 → 5.2) centred under them; a caught run = the result centred,
  the searchlights under it. No dead column.
- **THE BAR**: at the 360-px downscale the grid colours, the time, the streak line + the address read (below). Each daily's OWN card unchanged —
  `share-same.html` **18 / 18 SAME** (both looks, every run). `e2e-daily` **51 / 51** (the card drawn from the server's real `today { share }`).
- The shots' tool: `daily-probe.mjs` gains `SHARE_ONLY=1` (the canvases only), `TAG=before|after`, `Q=` (another run) and saves each card's 360-px
  downscale; `daily-preview.html` `&pw=locked` = a LOCKED OUT run (the tallest grid).
- Shots (`pd-4/`): `share-night-before-after.jpg` · `share-day-before-after.jpg` (before · after · after with a LOCKED OUT + a CAUGHT run, full size) ·
  `share-night-360.jpg` · `share-day-360.jpg` (the same at the 360-px thread size).

## Group 1 — THE ASSETS (downloaded + licence-checked here; no Grok)
- **THE PAPERS** (`assets/prism/paper/` — CC0, the licence pages read Nov 9): OpenGameArt "CC0 PBR Paper Textures" (`CC0-Texture-Paper01.zip` →
  `PaperAlbedo.png`) → NOTEPAD + GRAPH; ambientCG **Paper001** → the COLORING PAGE, **Paper002** (fibrous) → CONSTRUCTION PAPER (ambientCG's CC0 set
  was the plan's backup — the OGA map alone has no coarse fibre for construction paper). `scripts/build-prism-paper.py`: the grain only — a full
  high-pass (the OGA map had a soft plaid that a half high-pass left in, round 1), made SEAMLESS (each tile blended with itself rolled by half — the
  coloring page showed a seam, round 2), the paper's colour baked in, WebP q82: **notepad 28 KB · graph 25 KB · construction 15 KB · coloring 12 KB
  = 81 KB**. `assets/prism/paper/CREDITS.md` + a CREDITS entry (ART).
- **THE FONT**: Permanent Marker — **its licence is the Apache License 2.0, NOT the SIL OFL 1.1 the plan expected** (Google Fonts lists it under
  `apache/permanentmarker`, METADATA `license: "APACHE2"`, Copyright 2010 Font Diner; the @fontsource package says the same). Equally free to self-host
  + ship: `assets/fonts/prism/permanent-marker-latin-400.woff2` (the latin subset, 30 KB, unchanged) + `LICENSE-PermanentMarker.txt` (the Apache text)
  + a CREDITS entry (TYPE). It has no `→` glyph — the callouts' arrow falls back to the UI font.
- **THE BUDGET**: the papers + the font load ONLY when the day look shows (`page.js#warmDay` — the FontFace API; never in the boot graph, never by
  night). The preload graph regenerated: prism **40 modules / 370 KB** (≤ 1.5 MB); the boot graph unchanged in the games' share (30 KB).

## Group 2 — THE CRAYON BLOCKS
- `crayon.js` (PURE): `CRAYON` = the night's families in crayon shades (turquoise, yellow, violet, green, red, blue, orange; graphite junk), each ≤ 4.3°
  off its JEWEL hue; `CRAYON_LINE` = the same crayon pressed harder. `tests/prism-crayon.test.mjs`: the family test (±15°), pairs ≥ ΔE 18 (min 29),
  junk ≥ 25, and per paper every fill ≥ ΔE 25 + every outline ≥ 3:1 + the ink ≥ 4.5:1 + the pencil ≥ 3:1; the deal's rotation (below).
- `crayon-art.js`: every drawing PRE-DRAWN ONCE (cached sprites at the board's 3×): the fill (unevenly pressed diagonal strokes, a darker wax band at
  the edges + the foot, THE TOOTH punched through — value noise thresholded), the wobbly outline drawn twice, a broken wax sheen (round 1 had a glossy
  white arc — too clip-art); SIX variants a colour (the stack by place, the falling piece by its own cell — it keeps its drawing while it falls). The
  pencil ghost, the grey drain, the pencil-sketch incoming cell (hot + cool), the outline (the boing), the crumbs (crayon + eraser — three sizes), the
  scribble, the star burst, the marks (bounce · impact · streak). `warmCrayon` warms the board's size + HOLD / NEXT's in ≤ 4 ms slices.
- `board.js`: `LOOKS.crayon` (its incoming hook), the skin `crayon`, a faint PENCIL grid (the pressure varying), `drawPiece` / `drawMini` in crayon
  (a mini under 18 device px = a fill + its outline; a KO'd board in graphite). `tests/integration/prism-crayon-sheet.html` shows every drawing on
  each paper (`prism-shots.mjs` set `sheet`).

## Group 3 — THE PAGE
- `page.js`: ONE canvas (`.pd-page`, under everything), redrawn only when the paper / the song's world / the screen / the board's place changes: the
  grain (tiled at ½ px), the rulings in code (notepad lines + a doubled margin · a 13 px graph grid · the coloring page's thick frame), THE WORLD
  DOODLE (a canvas per song, the tooth through it, at 0.24 — five doodles; the coloring page draws them as black outlines), the board's WELL washed
  with the paper (0.7 — round 1's 0.6 let the notepad's rulings + the sunset fight the grid; 0.82 hid the doodle; settled at 0.7) + its PENCIL frame
  (two passes, the corners overshooting). Spectating + the podium: no board drawn on the page (round 2 found the frame behind the cards).
- THE DEAL: `index.js#start` → `game.pp` = `crayon.js#pickPaper(seed, used.prism)` + `$room` `meta/used/prism/pp<k>-<i>` — a rotation through all four,
  never the same twice in a row, the same page on every phone (e2e-prism checks it); an older game takes its seed's (`paperOf`).
- The WebGL world is NOT drawn by day (`world.render` skipped), the light layer stays off. The panels go paper (css/prism.css "PD-4": `--pd-paper`,
  `--pd-ink`, `--pd-grain`, `--pd-tooth`).

## Group 4 — THE CRAYON MOMENTS (`crayonfx.js`, on the board's canvas)
The boing (0.26 s), the scribble (the rows held for the race, 120 + 20 × lines ms) → the crumbs (pop up, fall, fade — 2–3 a cell), the star burst
BEHIND the stack (4 LINES / a perfect clear), SLAM's speed lines (three a column) + impact ticks, the pencil-sketch incoming rows (shaking marks both
sides, a pressed leading edge) + the paper tag, a cancel's eraser crumbs, the finale's crayon crumbs (`fx.js` `crayon`). The callouts in Permanent Marker
with the tooth as a mask + a paper edge (BLOCKED! = `--good` through `color-mix`). Reduced effects: no motion; the scribble + the star at 0.45.
Found on the way: a mid-line comment swallowed the crumbs' colour + lifetime (no crumb ever showed — round 2).

## Group 5 — THE LOOK REVIEW (three rounds)
`prism-shots.mjs` set `pd4` (43 states) at 390 / 402 / 430 with each phone's safe areas + 1440 × 900 once; `sheet` (every drawing on each paper).
1. The blocks read at once (strokes, outlines, tooth at 3× — `crayon-3x-crop.jpg`); the doodle too strong inside the well; the sheen glossy; the
   scribble too regular; the podium hung the shot script (its `networkidle0` wait — now `load` + a bounded idle wait).
2. The boing, SLAM's lines, the marks + the crumbs too small to see (all enlarged; the crumbs found missing — a bug); the board's frame behind
   spectating; the console frame's WINNER line white on paper (→ ink marker) + its results rows dark glass (→ the slim cards straight on the paper).
3. Every state clean at 390 / 402 / 430; the scribble a real scribbled-out zig-zag (round 2's smooth wave read as a wave); the podium's wash no longer
   leaking past the phone column on a desktop; Reduced effects lighter. NIGHT unchanged — PD-3's world set re-shot (`night-unchanged-390.jpg`).

Shots: `papers-390.jpg` · `worlds-390.jpg` (the five doodles + the coloring page's city) · `moments-390.jpg` (the boing, SLAM, clears 1–4 mid-scribble)
· `crumbs-390.jpg` (the crumbs after 1 / 2 / 4 lines, a combo ×4, a perfect clear, reduced) · `battle-390.jpg` (the incoming rows, the eraser, every
callout) · `screens-390.jpg` (count, tip, KO card, Call the Winner, spectating, the duel, the podium, BUTTONS, SLAM LEFT, the hit, SCORE RUSH) ·
`sheet-402.jpg` · `sheet-430.jpg` · `desk-1440.jpg` · `crayon-3x-crop.jpg` · `crayon-sheet.jpg` · `night-unchanged-390.jpg`.

## Group 6 — SPEED
`prism-shots.mjs` PERF with `PERF_LOOK=day` (390 × 844 @3, 7 opponents, a bot playing, **4× CPU, GPU on**; each tier LOCKED, ~300 frames recorded).
HEAVY = a 4-line clear every 650 ms with the combo climbing + six incoming rows + the bot + 7 rail tiles.

| moment | tier | board | fps | p50 / p95 ms | CPU p75 / p95 ms |
|---|---|---|---|---|---|
| rest | 3 | 3× | 58.8 | 16.7 / 16.8 | 2.0 / 2.8 |
| rest | 2 | 3× | 59 | 16.7 / 16.8 | 2.0 / 2.8 |
| rest | 1 | 3× | 59 | 16.7 / 16.8 | 2.1 / 2.8 |
| rest | 0 | **2×** | 59 | 16.7 / 16.8 | 2.0 / 2.7 |
| HEAVY | 3 | 3× | 59.8 | 16.7 / 16.8 | 4.8 / 6.0 |
| HEAVY | 2 | 3× | 60 | 16.7 / 16.8 | 4.3 / 5.4 |
| HEAVY | 1 | 3× | 59.6 | 16.7 / 16.8 | 3.7 / 4.9 |
| HEAVY | 0 | **2×** | 60 | 16.7 / 16.8 | 3.0 / 3.8 |

**The top tier holds 60 fps (p95 16.8 ms) at rest AND in the heaviest moment**; the day costs less than the night (3.5 / 5.7 ms at the top tier) — the
WebGL world's work is skipped. A LIVE LOOK SWITCH mid-match (e2e-prism, 4× CPU off — the real app): night → day, the longest frame **17 ms**; day →
night **17 ms** (the crayon sprites are warmed in slices before; the page + the doodle draw once). (A desktop GPU — the real check is `?pdperf` on the
owner's iPhone.)

## Tests
All on the mini PC, on fresh emulators + `scripts/serve.mjs --emu` (+ a `DAILY_TEST=1` server on :5176 for `e2e-daily`):
- unit `node --test tests/*.test.mjs` **1467 / 1467** (+ `prism-crayon.test.mjs`).
- `e2e-prism` FAST **45 / 45** (+ DAY LOOK: THE CRAYON LOOK live — the page on, the world + the light layer off; both switches smooth; the crayon
  moments; THE PAPER the same on every phone) · FULL (8 phones) **69 / 69**.
- smoke **6 / 6** (both playable games; none of the ten hidden ones starts). `e2e-daily` **51 / 51**. `share-same.html` **18 / 18 SAME**.
- `/api`, rules, e2e-profiles: not run (no server, rules or profile change). The harbor suite: not run (no city change — a game pass, the ci tag).
- The preload graph regenerated (prism 40 modules, 370 KB).

## Not at the bar / left for later
- The numbers are the mini PC's (a desktop GPU at 4× CPU) — the owner's iPhone is the real check (`?pdperf`).
- The cleared rows are HELD on the page for the scribble's race (120–200 ms) over the rows that already dropped in (the engine's collapse is instant —
  unchanged rules); it reads as "the row being scribbled out". If it ever reads as a lag, drop the hold (the scribble alone stays).
- The star burst is drawn behind the stack — with a tall stack it mostly shows round the top; by design (never over a block).
- PD-5: the day SONGS (the music still follows the night set in both looks).

## Servers
Started fresh (none were running): the emulators (database + auth), `scripts/serve.mjs --emu` on :5173, a `DAILY_TEST=1` serve on :5176 for e2e-daily.
All stopped at the end; the owner's preview server on :5190 (re)started and LEFT RUNNING.
