# JAYWALK H2 — THE NIGHT LOOK + THE KID + THE HOP — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK … H2's DECISIONS" (Step 0, `78244310`). The reference: docs/jaywalk.md ("THE NIGHT LOOK" · "THE
ASSETS" · "THE SOUNDS + THE AUDITION" · "THE LAB"). On the mini PC. **No rules change, no `/api` change, no boot file touched.** JAYWALK IS
NOT PLAYABLE (THE ONE SWITCH stays off).

The live preview (owner-gated, no room, no database writes): **https://neonspeakeasy.com/jaywalk-lab.html** · `?fps=1` · `?gray=1`.

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing addressed to JAYWALK
  (read at the start, after each group's commit, before the final tests).
- **H1's cloud** (`7f54dbd1`): `tests` green, both jobs (unit + whole-match simulations · rules + /api + smoke). The `harbor` workflow was
  SKIPPED on purpose (a ci tag — a game pass).
- **What H1 didn't run, run here on my own emulators:**
  - **THE FULL HARBOR SUITE**: 1,242 checks green; 3 red in the full run — THE ROOM NOTE's idle minute (`roomnote`), THE ROOM's OWN COST at 4×
    CPU (`roomperf`), THE DANCERS' ARMS NEVER JUMP (`motion`) — all three timing / CPU-load checks that ran while this pass's own browsers were
    taking shots. **Re-run ALONE on the quiet machine: `ONLY=roomnote,roomperf,motion` 19 / 19 green.** Nothing of JAYWALK's.
  - **e2e-profiles: RED — PRE-EXISTING** (not JAYWALK's registration): it hangs after its 6th check — step 3's page call that writes the
    synthetic CIPHER final into the room never returns (`Runtime.callFunctionOn timed out`, 180 s). **The same hang on `238c669b` — the commit
    BEFORE H1** (a worktree served on :5174 against the same emulators). Not fixed here (a frozen game's podium in an app test — the next app /
    city pass).
  - **e2e-playnow: 20 / 21 — PRE-EXISTING**: "the shelf never opened" — the `lost` section's second `openCard`, right after BACK TO THE CITY at
    once on the SCORE RUSH podium (the PLAY tab's shelf not in within its 5 s). `--only lost` fails the same check on `238c669b` too (the full
    run there got further once: 33 / 34, the same message later). Not fixed here.
- Nothing JAYWALK's registration broke was found.

## Group 1 — THE FILES IN (`933f2d20`) — `scripts/build-jaywalk-assets.py` (the originals in Downloads\grok\jaywalk only READ)
| what | from → to | bytes |
| --- | --- | --- |
| the 12 Kenney models (CC0) | `models\*.glb` → `assets/jaywalk/models/` + `LICENSE.txt` | 1,174,448 → **276,072** (+ 2,952) |
| the night skyline band | `backdrop\skyline-night.png` (1280 × 720, 497 KB) → `assets/jaywalk/skyline-night.webp` (1280 × 432, q95) | **65,824** |
| the sounds | `sfx\` → `audio/jaywalk/` — 17 MP3s (every pick + every -b) + the 2 bells as 16-bit mono WAV + `CREDITS.md` | **593,755** (+ 3 KB) |
- **THE MODELS' TEXTURE — a named call:** the brief said "they each embed the same Kenney colormap — share ONE texture". Measured: the four
  kits embed FOUR DIFFERENT colormaps (the delivery's notes say so too), each ~12 KB — the weight was the geometry (tangents + float
  attributes), not the texture. And every face sits on ONE swatch of its palette (measured per triangle: ≤ 7 / 255 off across the set; 20
  triangles of the hatchback on a gradient stripe) → the colormap is BAKED INTO VERTEX COLOURS and **no texture ships at all**; tangents +
  UVs dropped; int16 positions, int8 normals (Kenney's own — never recomputed). A car's body paint is found by its dominant saturated hue and
  marked in the vertex colour's alpha → the view re-tints only the paint. Still plain glTF 2.0 (any viewer opens them).
- The bells: 24-bit → 16-bit, the SAME sample counts (84,405 · 78,572): the whole file is the loop. Only the WAVs ship (MP3 / AAC would click).
- `tests/repo-growth.test.mjs` + THE CARRY green (`file-hashes.json` rebuilt). **Added to the repo + the deploy: ~939 KB.**

## Groups 2 + 3 + 4 — THE NIGHT LOOK · THE KID + THE HOP · THE SOUNDS + THE AUDITION (`ca30d29c`)
New: `night.js` (the scene), `night-fx.js` (the shaders, the paint patch, the environment, the bloom), `models.js` (the GLB reader + the
code-built kid / tree / log / tuft / truck box), `sounds.js` (the PURE table + the voice rule), `sfx.js`, `audition.js`, `lab-prefs.js`;
`lab.js` + `css/jaywalk.css` + `jaywalk-lab.html` (components.css for THE SHEET). What each is: docs/jaywalk.md.
Decided while building (named calls — all in docs/jaywalk.md):
- **No loader add-on, no composer:** the page's import map carries three's core only → a ~40-line GLB reader for our own re-packed files and
  a ~40-line bloom (the LIGHTS alone — layer 1 — into a half-res target, blurred at a quarter, added back). The ground is ONE shader.
- **THE WIDER VIEW = the same rig, further back** (scaled about the kid by (cols + 0.42) / 9.42) — not a wider lens: the columns keep their
  shape. **A mover's next lap is drawn** (always outside the 9 columns) and **a train is drawn ~10 ticks before + after its pass**: with 11
  columns seen, H1's bodies would pop in / out inside the edge column. The rules are untouched.
- **THE KID is drawn 1.3 × a lane's unit** (the first shots: 21 pt at WIDTH 11 — a blob). Measured now at 390 × 844: **≈ 27 pt at WIDTH 11 ·
  ≈ 34 pt at WIDTH 9** (± 0.3 with his idle bob). The rules' box stays 0.6 of a cell.
- **The long vehicles:** a 1-cell car = sedan / hatchback / taxi; 2 cells = the van; 3 cells = the van + a code-built box (Kenney has no
  truck) — every vehicle's drawn length = its rules length (a hit is what it looks like).
- **The water's reflections** are streaks in the skyline's colours drawn in the water's shader + each log's own glow (not flipped copies of
  every light — one draw call, no second pass).
- **The lane count's font = the numbers' font** (Chakra Petch 700, a neon tube look): Orbitron's heavy 0 read as a slashed block (the site's
  own note on `--font-num`).
- **The tile (`ui/game-art.js`) is NOT built**: it is a boot file and the boot's bytes are at their limit; the owner's Step 0 keeps JAYWALK
  out of the boot until the city's CHROMEBOOK pass → `JAYWALK_WAITS.art` now names the go-live pass.
- **The shared audio engine on the lab**: `installAudio()` after the door (the first tap unlocks, as everywhere). Its own leave report (the
  owner's phone, as on every page) is the one other thing the page may send; the lab itself still makes ONE call (whoami).
Three refine passes on the shots (Downloads\NEON\jaywalk-h2\ — out of git):
1. the kid 1.3 ×; the van + its box lower; calmer light quads + bloom (0.85 → 0.6); the barrier across the lane; the edge columns dimmer
   (0.62 → 0.52); the count's font; the fps readout off the WIDTH row.
2. the kid from behind was one blob → a smaller cap dome over brown hair, a WHITE backwards brim, a darker hoodie, bigger sneakers; the cap
   is its own piece (as a child of the flattened body it sheared when a car knocked it off); the train's lit windows up on its side.
3. the train's tell bolder (the rails catch more red); the box smaller; the cap's tint no longer clips; the look checks start a fresh run
   before a warp back down the course (the wall follows the BEST lane — the shot was all blackout).

## Group 5 — THE CHECKS
- `tests/jaywalk-night.test.mjs` (5 — the files, the sounds' table + the voice rule, the scene's contract, the lab's tools) + the older
  `jaywalk-lab.test.mjs` (5) unchanged and green.
- `tests/integration/jaywalk-lab.mjs` rewritten for H2 — **95 checks** with `--perf --webkit` (Chromium + Playwright's WebKit as an iPhone):
  a stranger gets the door (no scene, model, skyline or sound fetched) · the night look renders (12 models + the skyline; no graybox unless
  `?gray=1`) · WIDTH 11 by default, 9 on its own press, remembered · the kid's measured height · every tap acts · the bot's whole run →
  REPLAY = LIVE · a hop asks for its sound (pitch ± 6 %, gain ± 2 dB) and SOUNDS · the audition (12 rows, PLAY A · PLAY B, the bell as a
  loop + STOP, a pick remembered, COPY MY PICKS — refused → the line to hold; taken → COPIED) · the run holds under the sheet, the game plays
  the pick · `?gray=1` = the graybox · the sizes 402 / 430 / 1440 × 900 · WebKit: the scene, a hop, the sheet, every PLAY tap, a pick.
- **MEASURED** (390 × 844, the bot playing, 15 s a row, a tier pinned with `?tier=`; headless Chromium on the mini PC's Radeon — the owner's
  iPhone is the real test: `?fps=1`):

| tier | canvas | CPU | fps | frame ms (p95 / worst) | work ms (median / p95) | draw calls | triangles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 (+ the bloom) | @3 | 1× | 59.9 | 16.7 (17.2 / 17.9) | 1.3 / 1.9 | 25 | ~124 k |
| 2 (+ the bloom) | @3 | **4×** | **59.9** | 16.7 (16.8 / 17.0) | 4.4 / 6.8 | 25 | ~123 k |
| 1 | @2 | 1× | 59.9 | 16.7 (17.2 / 18.0) | 0.9 / 1.3 | 19 | ~123 k |
| 1 | @2 | **4×** | **59.9** | 16.7 (16.8 / 16.9) | 2.4 / 3.9 | 20 | ~122 k |
| 0 | @1.5 | 1× | 59.9 | 16.7 (17.2 / 17.8) | 0.9 / 1.3 | 19 | ~118 k |
| 0 | @1.5 | **4×** | **59.9** | 16.7 (16.8 / 17.0) | 2.3 / 3.9 | 19 | ~118 k |

  0 frames over 33 ms in every row. (H1's graybox: 8 calls, ~1,200 triangles, 1.2 ms of work.) The triangles are mostly Kenney's wheels
  (332 a wheel) + the trees — the first thing to thin if the owner's phone says so.
- THE PAGES LOAD: unchanged (a stranger gets the door) — green in the smoke test.

## Group 6 — THE CLOSE
docs/jaywalk.md (the night look, the kid, the assets, the sounds + the audition, the lab, real vs placeholder, the index) · this log ·
docs/testing.md "JAYWALK H2" · docs/cartridge.md (the tile's wait) · ROADMAP · CLAUDE.md (the JAYWALK line). Builders: file hashes, the
preload graph + the boot preload (both unchanged: the cartridge's view is still the stub; no boot file touched).

## THE FINAL LOCAL RUN (my own emulators + `DAILY_TEST=1 scripts/serve.mjs 5173 --emu`, the mini PC — NEVER THE LIVE SITE)
unit **2081 / 2081** · rules **83 / 83** · `/api` server **63 / 63** + progression **10 / 10** · smoke **20 / 20** (THE PAGES LOAD 12 / 12: the six
pages × Chromium + WebKit, `/jaywalk-lab` among them) · e2e-daily **95 / 95** · wk-press **43 / 43** · harbor `ONLY=cartridge,neon` **42 / 42** ·
jaywalk-lab **87 / 87** with `--webkit` (**95 / 95** with `--perf --webkit` on the quiet machine — the table above). Registration + cartridge:
in the unit suite (green). Group 0's extra runs: the FULL harbor suite (1,242 green + its 3 load reds green alone, 19 / 19), e2e-profiles +
e2e-playnow (both PRE-EXISTING reds, named above).
- The order (H1's lesson): the server as `DAILY_TEST=1`, rules → `/api` → smoke → e2e-daily BEFORE wk-press → the harbor groups → the lab.
- A wrong red of my own making: the first unit run of the final chain started before this log existed (THE DOCS' LINKS: docs/jaywalk.md names
  it) → re-run with the file in place: green.
- My servers (the emulators + :5173; a second server on :5174 for the pre-H1 comparison) stopped at the end; :5190 was not running when the
  pass started and was left that way.

## REAL vs PLACEHOLDER
REAL: everything H1 called real + the night look (the ground, the cars + their lights, the logs, the trains + their signals, the trees +
props + lamps, the skyline band + its night life, THE BLACKOUT, THE WIDER VIEW), the kid + the hop + the hits + the camera, the neon lane
count, hop / land-wood / hit / splash in play, THE SOUND AUDITION, the automatic tiers.
PLACEHOLDER: THE BLACKBIRD (a dark dart + a burner) and THE UFO (a disc + its beam ring) — decided before H6; the end screens' words; the
match screen (still the stub: the night look reaches a real match in H4); the sounds' levels (H6's mix) + the eight sounds not yet in play;
every tuning number; the day look (H5); the tile, the boards, HOW TO PLAY.

## KNOWN / FOR THE NEXT PASSES
- **The owner's phone decides the look's speed** (`?fps=1`): the tiers step down by themselves; if tier 2 doesn't hold on an iPhone, thin the
  wheels / the trees first (the triangles), then the bloom.
- The sounds' picks: the owner auditions on the lab → COPY MY PICKS → the chat; the unpicked takes then leave `audio/jaywalk/` (their
  credits with them). Three takes are CC BY 4.0 (train-pass-b, lights-die, new-best-b): their credit goes in ☰ → CREDITS when they ship in play.
- H4: the night look into the real match view (`view.js`) — `createNight` already renders purely from (run, course).
- PRE-EXISTING, outside JAYWALK (Group 0): e2e-profiles hangs at its CIPHER podium step; e2e-playnow `lost`: the shelf never opened.
- H1's notes still stand (the chunks' time stamps: H4; the offline player's end: H4; the feel numbers: the owner's hand).
