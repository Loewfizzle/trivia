# SKINS 1 — PRISM DROP: THE SKIN SYSTEM + WATERCOLOR + PAPER CUT-OUT + ROTATION + THE SKINS SETTING — Nov 14 2026

The plan: docs/games/plan.md "PRISM DROP — SKINS → SKINS 1" (Step 0, `0650dffd`). On the mini PC. **No database rules change** (the counter rides
the game node + the night's memory, like the paper). Still 8 functions; nothing server-side changed. The reference: docs/prism.md "THE SKINS".

## Group 1 — THE SKIN SYSTEM (`4d08a8e0`) — a refactor, not a pixel changed
- **A skin = ONE definition in `js/games/prism/skins.js`** (HOLD'EM's pattern): data (look + pool, unlock, CSS family, panel tokens, lettering,
  sounds) + hooks (the blocks' sprites + variants, the ghost, the danger drain, the well's grid, the incoming rows, a mini board's cell, the
  top-out shards, its moments on the board — `fx()`, the light layer / the flash, its world — the shader or its page painter, `enter` / `idle` /
  `warm` / `drop` / `count`). `board.js`, `view.js`, `rail.js`, `victory.js` + `page.js` draw ONLY through them.
- **Moved, not rewritten:** the neon tubes → `neon-art.js`; the retired glass → `glass-art.js` (a skin in no pool — what an unnamed look draws);
  the shared drawing → `skin-kit.js` (a leaf); `page.js` = a host + `CRAYON_PAGE`; the synth takes a skin's voices (`setVoices`).
  `.pd[data-skin]` + `--pd-sk-ink / -sub / -panel / -line` beside the family's `.pd[data-look]`.
- **THE PROOF** (`tests/integration/prism-skin-snap.html` + `.mjs` — a fixed clock, a seeded random, a fixed engine state): 152 frames saved on
  the commit before (`0650dffd`), re-rendered after every group — **152 / 152 IDENTICAL** each time (after Group 1, 2, 3 and 4). 136 board-level
  frames: crayon + neon (the sunset + the crystal palettes) × the board mid-game / the danger drain / frozen / no glow + no ghost, the incoming
  rows (+ reduced), a cancel (3 frames), a slam + lock (3), a 2-line + a 4-line combo clear (5 each), the reduced clear, the 2× tier, a 24-pt
  cell, HOLD / NEXT (7 pieces + small + dim), the minis (rail 3 pt, duel 4, podium 8 + 7, KO 3 + 8, the EMPTY well), the share cards' 36-pt minis
  (by look name), the day page (4 papers; all 5 worlds on the notepad; with + without the board). + 16 whole screens with the canvases hidden
  (day + night × play / podium / solo podium / count / spectate / KO / buttons / left). The floor: the baseline run twice, identical, before any
  change (one spot pinned: HOLD / NEXT fade when the falling piece passes under them — time).
- Three source-shape tests followed the move (`fr7-fixes-a` — the caches' clear; `prism-pd6` — the kick's light layer); the preload graph
  regenerated.

## Group 2 — ROTATION + OWNERSHIP + THE SETTING (`8d1db1d5`)
- **THE COUNTER** (`skin-deal.js`, a leaf the cartridge's index.js takes without the art): `game.sk`. A room's = `dealSkin(seed, used)` — +1 a
  match from `meta/used/prism/sk<k>`, the night's first = hash(seed) % 60; a solo run's = `soloSkin(settings.prismSkinK)` (+1 a run); THE DROP's =
  `dropSkin(settings, day)` (`settings.prismSkinDrop { d, k }` — a refresh keeps the day's skin).
- **`skinOf(game, look, phone)` = `pool[k % n]`**; `poolOf` = the owned skins of the look, a pin narrows it to one; `owned` (unlock null =
  everyone; a level unlock = a server grant later — nothing locked now). The view's `pickSkin()` reads the look, the counter + the pins each
  frame (a signature — recomputed only on a change).
- **THE SETTING:** `js/games/prism/picker.js` (lazy) → ☰ → Settings → PRISM DROP → DAY SKIN: ROTATE · CRAYON · WATERCOLOR · PAPER CUT-OUT, each a
  3-block sample in the skin's own sprites at a 19-pt cell. No NIGHT row yet (one night skin — SKINS 2 brings it).
- `prism-preview.html?skin=<id>` (+ `&sk=<k>`).

## Group 3 — WATERCOLOR (`20725b17`) · Group 4 — PAPER CUT-OUT (`a0b1df1c`)
What each is: docs/prism.md "THE SKINS" (WATERCOLOR · PAPER CUT-OUT). The look reviews (390 × 844 @3×, three refine passes each):
- **WATERCOLOR:** (1) the first blocks read as glossy candy — a spherical shade + a big gloss: flattened to washes, the layers pulled apart so
  each pass's dried edge shows, a crisp uneven pigment edge, a lift instead of a gloss; (2) the drips + the cancel's droplets were too small for
  a phone — bold (a drip 5–8 pt wide, 1–2.5 cells long; droplets 7–11 pt); the bloom's hard ring softened; (3) the world's wash a touch fainter
  (0.20 → 0.16), SLAM's streaks wider + softer.
- **PAPER CUT-OUT:** (1) the corner cut-out (the sun) sat behind the top line + the music button — it now rises over the page's top edge between
  them (every disc's paper is light: the top line's ink keeps ≥ 4.5:1 where Safari's toolbar layout crosses it — pinned); (2) the peel's shadow
  was a heavy band — halved; (3) spectating's footer was ink on the silhouettes — it sits on a paper label of its own.
- **The textures** come from ONE CC0 source already on this machine (ambientCG Paper001's 2K colour map — no download): `watercolor.webp`
  (40.6 KB, cold-press: a wide high-pass, the tooth lifted, `#f6f0e2`) + `kraft.webp` (22.5 KB, the fibres, `#c6a576`) through
  `scripts/build-prism-paper.py` (now: only the papers whose source is given, `--only`, a crop — the map's right edge has a column of print
  show-through). `assets/prism/paper/CREDITS.md` + the in-app credit line.
- **The clear's hold** (PAPER): `fx.event()` answers `{ hold, gap }` → the view holds the stack with the cleared rows EMPTY for the beat
  (`board.event` → `holdClear`); a lock ends it early; reduced effects ask for none. The crayon + watercolor ask for none (unchanged).

## Group 5 — QUALITY + PROOF
- **60 fps on the mid-range profile** (`prism-shots.mjs`, 390 × 844 @3, 7 opponents, a bot, **4× CPU**, GPU, each tier locked, ~300 frames; p50
  16.7 / p95 16.8 ms in every row):

  | skin | set | tier 3 — fps · CPU p75 / p95 | tier 0 — fps · CPU p75 / p95 |
  |---|---|---|---|
  | WATERCOLOR | rest (a bot playing) | 60 · 2.0 / 3.2 ms | 60 · 1.6 / 2.5 ms |
  | WATERCOLOR | heavy (a 4-line clear every 650 ms, the combo climbing, 6 incoming rows) | 60 · 3.1 / 4.2 ms | 60 · 2.8 / 3.9 ms |
  | PAPER CUT-OUT | rest | 60 · 1.9 / 2.7 ms | 60 · 1.8 / 2.5 ms |
  | PAPER CUT-OUT | heavy | 60 · 2.6 / 3.8 ms | 60 · 2.2 / 3.0 ms |
  | crayon (beside them) | rest · heavy | 60 · 1.9 / 2.8 — 59.8 · 5.3 / 6.2 ms | 59.8 · 1.8 / 2.6 — 59.8 · 3.2 / 4.0 ms |

- **The tiers:** a page skin's world silhouettes are dropped at tiers 0–1 (`lite`); the fx keep one drip every other cell / no confetti under
  the low tiers' cap (`sparks` ≤ 100). **Honest note:** by day AUTO steps straight 3 → 0 (PFIX-B: only the board's ratio moves a day frame), so
  on a slow phone the silhouettes + the extra particles go TOGETHER with the board's 3×, not before it (a manual tier 1 / 2 shows the staged
  drop). Nothing on the page costs a frame anyway (it is drawn once per change).
- **Only the shown skin's textures load:** a page lists its own file (`files()`), `enter()` loads only its own (pinned by a unit test); checked
  in the browser: WATERCOLOR fetched `watercolor.webp` + the marker font and no other paper; PAPER CUT-OUT `kraft.webp` + the font; the night
  fetched none.
- **Shots** (`SETS=skins`, kept out of git): 36 at 390 × 650 / 402 × 690 / 430 × 746 (Safari WITH its toolbars) + 36 at 390 × 844 / 402 × 874 /
  430 × 932 (the home-screen app, its safe areas) — each new skin mid-game, mid-clear (2 lines + 4 lines), with incoming rows, the podium, the
  settings sheet's DAY SKIN row — + 3 at 1440 × 900. No console error in any.

## What is real vs placeholder
- **REAL:** the system + the rotation + the pins + the setting; both skins' blocks, ghost, drain, incoming rows, grid, clears (the drips, the
  peel + the gap), lock / slam / cancel moments, pages, lettering, cards, minis, top-out; the textures; the code-made sounds.
- **FOR BEN'S EAR — not judged by me:** the four new voices (plip · swish · tap · rip) run without an error and are quiet by their gains, but
  nobody has heard them yet.
- **SIMPLE (worth a second look):** the worlds. WATERCOLOR's = the crayon's doodle shapes painted wide + soft (a loose wash, as specced);
  PAPER CUT-OUT's = three generic layer profiles a world (zig-zag peaks / skyline steps / spikes / rolling hills / waves) + one disc — readable
  as a place, not drawn like the crayon's doodles. The time box did NOT cut them.
- **NOT BUILT (by the plan):** level unlocks (every skin is everyone's), the NIGHT row (one night skin until SKINS 2), holiday variants of the
  new skins (holidays override crayon / neon only).
- **UNCHANGED ON PURPOSE:** the share cards / tickets / SHARE TODAY (crayon by day, neon by night), SLAM, the console's podium frame + slim
  cards, the corner buttons.

## New + changed files (sizes)
`skins.js` 20.7 KB · `skin-kit.js` 11.0 · `skin-deal.js` 2.9 · `skin-pages.js` 11.3 · `picker.js` 6.1 (lazy, the settings sheet's) · `water-art.js`
14.6 · `waterfx.js` 10.2 · `paper-art.js` 9.0 · `paperfx.js` 9.2 · `neon-art.js` 6.6 + `glass-art.js` 5.1 (moved out of `board.js`: 40.2 → 19.2 KB).
PRISM's preload graph: 46 modules / 466 KB → **52 modules / 534 KB** (the budget: 1.5 MB). Assets: `watercolor.webp` 40.6 KB · `kraft.webp` 22.5 KB
(each fetched only when its skin shows).

## Tests
Local, per THE LOCAL TESTING RULE (Step 0 — unit + the game's E2E + the harbor groups the pass touches; the FULL harbor runs in the cloud on the
tagged push). Fresh emulators + `serve.mjs --emu` on :5173 (+ :5195 with THE DROP's OFF row opened for e2e-drop). No rules change, no `/api`
change — those suites were not re-run.

| suite | result |
|---|---|
| unit (`node --test tests/*.test.mjs`) | **1867 / 1867** (+ 16: `tests/prism-skins.test.mjs` — the contract, the rotation, the counters, the wiring, the files, the tiers, the clear's hold, the cut-out's contrast) |
| THE PIXEL-IDENTICAL PROOF (`prism-skin-snap.mjs check`, `PAGE=1`) | **152 / 152 IDENTICAL** — after each group + on the final code |
| e2e-prism FAST | **66 / 66** (+ 3 skin checks; the rotation dealt PAPER CUT-OUT in the run) |
| e2e-prism full (8 phones) | **92 / 92** (+ 4: the same counter + pool[k % n] on every phone, a pin live / an un-owned pin = ROTATE, a solo run's own counter, the next match's counter = the last + 1 after a host change). The known REFRESH one-attack check was green this run |
| e2e-playnow | WebKit **36 / 36** · Chromium **36 / 36** (see below) |
| e2e-drop | **34 / 34** (see below) |
| smoke | **8 / 8** |
| harbor groups `shell, sololook, cartridge, tapfit, corners` | **46 / 46** |
| the speed run | 60 fps at 4× CPU in both new skins, rest + heavy, tiers 3 + 0 (the table above) |
| the shots | 75, no console error |

**Three reds on the first run — none from this pass, two fixed in the tests:**
- `e2e-playnow` "the song plays on from there" (both engines) + `e2e-drop` "the night set": **BY-DAY reds.** This pass ran in the morning — AUTO =
  the real sun = the DAY set — and both checks had only ever run at night. A/B on the commit before (`0650dffd`, a worktree on :5174, the same
  emulators): the playnow check is red there too, in both engines (heard at 14.84 s / 48.50 s — a day song starts at its CUE-IN and the heard
  position counts from the file's start). Fixed in the tests: playnow takes the cue off before comparing; e2e-drop pins THE GAME LOOK to NIGHT
  for the run + the pause (the refresh + the end still switch to DAY). Both green after.
- `e2e-playnow` Chromium, first run only: "both runs credited after leaving at once" (0 → 0) + "SCORE RUSH hidden 20 s … stand where they
  stopped" — green on the same code in the A/B's second run and in the full re-run (36 / 36). One-off timing under the suite's load (Chromium
  ran straight after WebKit + the 8-phone run); not chased further.

Servers: the emulators, :5173 (+ :5174 / :5195 for the A/B + THE DROP) were this pass's own and are STOPPED; :5190 (Ben's preview server) is left
running.
