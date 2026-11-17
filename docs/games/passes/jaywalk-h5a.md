# JAYWALK H5A — THE KID + THE AREAS + THE SOUNDS — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 16 — DECIDED, H5A)" (Step 0, `c9612b35`). The reference: docs/jaywalk.md
("THE AREAS" · "THE KID + THE HOP's FEEL" · "THE SOUNDS" · "THE ASSETS" · "THE POSTER"). On the mini PC.
**NO database RULES change** (the rules FILE is untouched — nothing to re-publish for this pass; H4's `jw … k` rule must be
published for a JAYWALK run to count, as before). **THE GAME's RULES changed** (the lane mix by area — every course changed).
No `/api` file, no boot file touched (THE BOOT BUDGET untouched). **JAYWALK IS NOT PLAYABLE** (THE ONE SWITCH stays off).

The links: **https://neonspeakeasy.com** (the owner: PLAY → JAYWALK · TEST, or HOST a room → GAMES → JAYWALK · TEST) ·
**https://neonspeakeasy.com/jaywalk-lab.html** (the lab) · **https://neonspeakeasy.com/jaywalk-lab.html?poster=1** (the poster).

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing open for
  JAYWALK (read at the start, after each group's commit, before the final tests). The cloud result of `59a9e00b` + `73418cbd`
  (H4B's two pushes): `tests` green both times, `harbor` skipped (a game pass) — nothing to fix.

## Group 1 — THE QUICK FIXES
- **THE LIGHT TRAILS ARE GONE** on every vehicle (the cars, the taxi, the van, the box truck, the train): `night.js` no longer lays a
  streak; kept: both tail lights on the body, the soft red glow on the road behind, the soft headlight glow in front.
  Before / after at 390 × 844: `Downloads/NEON/jaywalk-h5a/g1-before-*.png` · `g1-after-*.png`.
- **THE SHARE = THE PICTURE ONLY** was already built by H4B's add-on (`73418cbd`: `navigator.share({ url })`, the cause once, the
  frame 984 × 792, zoomed + brighter) — nothing left to build; checked again by both E2Es in this pass's final run (the share sheet
  stubbed: the url alone, the link's page, its 540 × 675 picture). The share frame + the poster now show the new kid and no trails.

## Group 2 — THE NEW KID
- `scripts/build-jaywalk-assets.py --only=kid,landmarks` COPIES `Downloads\grok\jaywalk\models\kid\kid.glb` (never moved, renamed
  or edited) → `assets/jaywalk/models/kid.glb`: **325 KB → 33 KB**. Measured in the file: every vertex sits on ONE bone (the rig is
  rigid) — so a pose is 7 matrices, and the build writes the skin matrices of the clips the game uses (idle 16 · jump 12 · fall 8
  frames + a hand-made SPLAY) into the GLB; the other 33 clips, the texture (a palette → vertex colours), UVs, tangents, weights
  do not ship. THE PAINT (COLOR_0's alpha, as the cars') = the shirt (the delivery's material "top") + **the whole cap** (the
  head's faces on the colormap's right-hand column: its orange crown + brim AND its white front panel — white takes a lighter
  shade of the player's colour). `LICENSE-kid.txt` + `CREDITS.md` ("3D models: Kenney — kenney.nl (CC0)") for H6's CREDITS.
- **The scene:** ONE skinned geometry, instanced — the poses in a float texture, two blended per instance in the vertex shader
  (`night-fx.js#paintMaterial` `skin`): one draw call for the kid, one for every ghost. No animation mixer, no per-kid bone work.
- **THE HOP** = Kenney's jump clip timed to `HOP_TICKS` (in on the push, out on the landing) + the squash / stretch / squash, the
  turn, a lean; his idle between hops; the blob shadow + the ring in his colour stay (the pool under him softer: his face, arms,
  sneakers read). **THE HITS:** flattened = squashed straight down under his cap in the splay (arms out, sneakers kicked out — a
  cartoon flat kid with his cap on top); the splash + sink, the train, the edge, the beam = Kenney's fall; the blackout as before;
  ABDUCTED + the Blackbird stay placeholders (H6).
- **Found while looking:** Kenney's kid faces +z (as his cars do — the delivery's note said −z): the first shots showed his back
  at the start and his face while hopping away. `KID_YAW` + the splay's legs + the lean's sign follow.
- **HIS HEIGHT: 38.5 pt at ZOOM 8 on a 390 pt phone** (measured — `kidHeightPx()`; the code-built kid: 39–40).
- Shots: `Downloads/NEON/jaywalk-h5a/kid-*.png` (the start · mid-hop up / left / right / back · on a log · each hit).

## Group 3 — THE 8 AREAS
- **THE RULES** (`tuning.js#AREAS`, `course.js#area` / `gateName` / `rawType` / `specials` / `typeAt` / `buildLane`): each area's
  lean = a percentage on the heat's own mix weights; DOWNTOWN's heavier traffic (one more car a lap, 65 % of the spare room — the
  crossable gap untouched); THE AIRFIELD's two flight bands for sure (no UFO there); never more than 3 rail lanes in a row (as the
  water) — and a long raw run now goes ON after its break (every 4th lane ground), so the canal / the rail yard read as water /
  rails with footings. Lanes 0–49 are untouched.
- **A bug the new sims caught:** the first cut of the run-length rule looked back at most 16 lanes — a raw run longer than that
  (the rail yard's second lap: ≈ 70 % raw rails) lost its breaks: 8 rail lanes in a row. Fixed (the look-back runs to the run's
  start); `tests/jaywalk-sim.test.mjs` "FAIR IN EVERY AREA" holds it.
- **Measured (200 seeds a stretch; the bot dropped at the gateway, 300 seeds, 15 s):**

  | lanes | area | grass · road · water · rail · flight % | the bot in 15 s |
  | --- | --- | --- | --- |
  | 0–49 | the opening | 49 · 41 · 10 · 0 · 0 | + 50 lanes |
  | 50–99 | THE DOCKS | 48 · 28 · 23 · 1 · 0 | + 56 |
  | 100–149 | THE FISH MARKET | 48 · 33 · 17 · 1 · 0 | + 53 |
  | 150–199 | THE RAIL YARD | 38 · 28 · 7 · 25 · 1 | + 56 |
  | 200–249 | THE BRIDGE | 14 · 51 · 32 · 2 · 2 | + 34 |
  | 250–299 | DOWNTOWN | 21 · 69 · 4 · 4 · 2 (4.0 cars a lap — the others 3.0) | + 25 |
  | 300–349 | THE CANAL | 28 · 23 · 44 · 4 · 2 | + 45 |
  | 350–399 | THE LIGHTHOUSE | 35 · 24 · 35 · 4 · 2 | + 47 |
  | 400–449 | THE AIRFIELD | 22 · 53 · 9 · 8 · 8 | + 31 |
  | 450–849 | the loop's lap 2 | less ground, more rails everywhere (THE RAIL YARD 52 % rails, THE CANAL 54 % water, DOWNTOWN 73 % roads) | + 14 … 46 |

  The wall caught the dropped bot on 0–5 of 300 drops a stretch (a stuck bot — never a wall of lanes).
- **THE LOOK** (`areas.js` + `night-fx.js#areaGround` + `night.js`): per area its ground, its obstacles, its edge dressing, its
  lamps, its signature pieces, the skyline's tint — the table in docs/jaywalk.md "THE AREAS".
  - **What changed on the way (two refine passes on the look, a third on the gateway + the apron):** (1) the first cut drew every
    area obstacle as a TREE (the tree fallback ran before the areas' pieces) — fixed, and held by a test; (2) the first cut stood
    the big pieces (the crane, the lighthouse, the tower …) on raised decks 1.5 columns past the play edge, the lanes running
    under them: **at ZOOM 8 a phone never shows that far — they were off-screen.** Reworked: the crane + the bridge's towers
    STRADDLE their lanes on thin legs that stand on the lane lines; every other piece stands in the edge column of a GROUND lane
    (scaled to fit one lane); no decks; (3) the gateway's name was wider than the screen (8.6 cells → 7.3), its arch a string of
    dots (→ a continuous tube); the airfield's apron wore a dashed centre line and read as a road (→ a solid taxi line along its foot).
- **THE ARRIVAL GATEWAY:** the arch + the name on the lane; `view.js`: the landmark sound + the name flashing once (`.jw-mark.is-flash`).
- Shots: `Downloads/NEON/jaywalk-h5a/areas/` — every area's gateway + three views (33 pictures at 390 × 844).

## Group 4 — THE SOUNDS
- `cues.js` (PURE) decides WHEN; `sfx.js#onCue` plays (the pan, a sound's own cap, the bell's one loop + its fade); `sounds.js` (the
  priority + `TRAIN_DUCK`); `view.js` (the cues for this phone's own living kid, the music's duck + its return); `lab.js` (the same cues).
- The limits, on real runs through the engine (`tests/jaywalk-cues.test.mjs`): 30 runs through the rail yard — the bell = "a near
  rail is in its tell" at EVERY tick, one train-pass a pass; 40 runs downtown — a car-pass only on a near miss, never 3 at once,
  horns ≥ 3 s apart; the lights die only with the dark within 3 lanes.
- The `-b` takes still ship for the audition (the owner picked ALL A): the game now fetches only the take it plays; removing the
  backups + the audition's A / B is H6's (the mix).

## Group 5 — THE POSTER
- `poster.js#findStage` re-staged in THE DOCKS with a clear foreground; the first render had a box truck + a drum in front of the
  low camera (the kid's body hidden) — the stage now asks for open pier / water between him and the camera.
  `Downloads/NEON/jaywalk-h5a/poster/jaywalk-poster-1696x896.png` + `-848x448.png`. The city's billboard is NOT changed.

## The add-on (THE ADD-ON INBOX, Nov 16 7:03 pm — TO JAYWALK H5A) — THE BIG NUMBERS MERGE
- The owner's iMessage share card: "172" read like "N2". Built once, before the final tests: `numerals.js` — more room between two
  digits + a "1" on a base foot (drawn: the fonts' own 1 has none), in every place JAYWALK draws its big neon numerals: the share
  card, the end screen, the in-game lane counter (the game + the lab), the YOUR BEST / friend lines' words. docs/jaywalk.md "THE BIG
  NUMERALS". Shots — 17 · 71 · 111 · 117 · 172 · 711 at the card's size, as the small preview, on the counter + the end screen:
  `Downloads/NEON/jaywalk-h5a/nums/`.
- Caught by its own look check before it shipped: the end screen's digits (now spans) matched the small LANES label's CSS rule.

## Group 6 — THE CHECKS
- **PERF (the mini PC, 390 × 844 @3, 4× CPU, the bot playing — the lab check's `--perf`):**

  | where | tier 2 (the bloom) | tier 1 | draw calls | triangles |
  | --- | --- | --- | --- | --- |
  | the opening | 59.9 fps | 59.9 | 26 · 21 | ≈ 94 k |
  | DOWNTOWN | 59.9 fps (p95 16.8 ms) | 59.9 | ≤ 32 · 27 | 172–183 k |
  | THE LIGHTHOUSE (its beam) | 59.9 fps | 59.9 | ≤ 31 · 24 | 165–189 k |
  | THE RAIL YARD | 59.9 fps | 59.9 | ≤ 32 · 26 | 176–179 k |
  | 8 KIDS (the kid + 7 ghosts), DOWNTOWN | 59.8 fps | 59.9 | 35 · 29 | ≈ 185 k |

  The real views: the solo run 59.9 fps at every tier; a 4-kid match (3 ghosts) 59.9 at every tier. A desktop GPU's numbers — the
  areas add ≈ 80 k triangles; the owner's phone is the judge (docs/jaywalk.md "PERFORMANCE — H5A").
- **`e2e-jaywalk.mjs` step 6c — THROUGH THE AREAS:** a bot's solo run past lane 155 (1–2 tries): THE DOCKS · THE FISH MARKET ·
  THE RAIL YARD flashed under the lane count, the landmark sound asked, the world's cues (bell · horn · car-pass · lights-die),
  the server's own replay = the phone's lanes, the solo best = that run.
- **Three test-side traps on the way (all in the checks, none in the game):** the lab's sound lists keep their last 200 entries —
  with the world's cues a long run fills them, so "how many started since" read 0 (→ `sfx.js#totals`, a running count); the end
  screen's unit label was read with `.jw-fin-n span`, which now finds a digit box first (→ `.jw-fin-n > span`); the E2E's
  later "the best is untouched" compared against a best the long run had just raised.
- **THE FINAL LOCAL RUN (my own fresh emulators + `serve.mjs --emu`):** unit **2150 / 2150** · rules **83 / 83** · /api server
  **65 / 65** + share-card **2 / 2** · smoke **21 / 21** (THE PAGES LOAD 12 / 12) · harbor `cartridge` **3 / 3** · the lab check
  **133 / 133** with `--perf --webkit` (+ `--h5` 3 / 3, `--nums` 3 / 3) · `e2e-jaywalk` **70 / 70** with `--perf` · `e2e-jaywalk-match`
  **55 / 55** with `--perf` (the share = the link alone in both).
- **RED, NOT THIS PASS's (logged in THE ADD-ON INBOX for the dailies' next pass, not touched):** `wk-press.mjs` **32 / 35** — its
  three DAILY-screen checks ("the DAILY screen opened" ×2, the SCORES row) — and `e2e-daily.mjs` stops at "the DAILY button" (5 / 5
  before it). **The SAME three wk-press reds on the code from before this pass** (`73418cbd` served on :5174, fresh emulators) —
  H4B's run this afternoon had both green (43 / 43 · 95 / 95). Both of tonight's runs were after 7 pm ET = past midnight UTC: the
  likely cause is a day computed in UTC against the 4 am ET streak day (the test's seeding, or the daily's own day) — not looked into.


## What is real, what is a placeholder
REAL (new in H5A): the kid (Kenney's skate boy), the 8 areas' rules + night looks + gateways, every sound in play, the poster's
frame. PLACEHOLDER still: THE BLACKBIRD (a dark dart) + THE UFO (a disc) + THE MOTHERSHIP + their cause lines (H6); the day look
(H5B — every area by day); the sounds' levels + the `-b` takes (H6's mix); each area's lean (`AREAS` — first-pass feel, tune from
real play); the poster's frame (the owner judges it).
