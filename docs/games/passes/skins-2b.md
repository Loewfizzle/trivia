# SKINS 2B — PRISM DROP: THE SHARE CARD's ONE RULE + ARCADE PIXEL + GALAXY + THE NIGHT ROTATION + GROK's NIGHT SOUNDS — Nov 14 2026

The plan: docs/games/plan.md "PRISM DROP — SKINS → SKINS 2B" (Step 0, `05cc9959`; + Ben's 11:16 am add-on, recorded there). On the mini PC.
**No database rules change, no `/api` change.** The reference: docs/prism.md "THE SKINS → SKINS 2B" · docs/progression.md "THE ONE RULE" ·
docs/audio.md "PRISM DROP's SKIN SOUNDS". One local commit from SKINS 2A (`4aea476e`, its cloud results) rode this pass's push.

## Group 0 — THE SHARE CARD's ONE RULE (`12df182b`)
Ben's rule (from a mockup I never saw — built from his words) **+ his 11:16 am add-on, which arrived mid-group and replaced two parts of it**
("the names can't be white no matter what"):
- **(1) THE NAME carries the result.** THE PASSWORD / COAST CLEAR in a clean GREEN neon when made, RED when failed — small (40 px in a
  section, the same for all), a MODEST glow (one soft pass under a lighter core — never WELCOME IN's blazing headline). THE DROP stays WHITE
  (no win / lose). By day: the same green / red / navy in the day palette (`#17703d` / `#b02040` / `#16305c`, each ≥ 4.5:1 on the sky).
  **No win word anywhere** — WELCOME IN, LOCKED OUT, CAUGHT and COAST CLEAR's name-swap are gone from the cards.
- **(2) ONE big TIME**, white, the same size for all (84 px — THE DROP's was 92), a caught / locked-out run's time too.
- **(3) ONE grey stat line** — "5 GUESSES" · "1 SPOTTED · +30 s" · "3 SPOTTED" · "101 LINES". No red word (the first build, before the
  add-on, put a small red CAUGHT / LOCKED OUT there — removed).
- **(4) The art strip, a little taller** (145, was 128): THE PASSWORD = THE TILES ONLY, bigger (≤ 46 px a cell, was 36 beside a door; a
  six-row door = 21 px, was 18) · COAST CLEAR = the three lamps, as tall as the strip · THE DROP = the board's top 8 rows (was 6).
- **THE SHARED DRAW CODE:** the three text pieces are the KIT's painters now — `js/daily/share.js#paintName(…, result)` · `paintBig` ·
  `paintStat` (+ `INK`, `MADE`, `FAILED`, `nameInk`) — called by every daily's section AND its own card; the dailies' own `paintSign` /
  `paintHead` / `paintLine` / `paintTime`, `WORD_K` and `doubledName` are removed. Each daily's OWN card follows the same rule (THE PASSWORD's
  keeps its two doors + names over the tiles; THE DROP's own card is SHARE YOUR RUN's — untouched).
- **COAST CLEAR's caught time** was only inside its line ("3 SPOTTED · 1:58"): `coastclear/share.js#partsOf` (PURE) reads it off the end —
  **the server's share inputs + `SHARE_KEYS` are untouched** (no `/api` change).
- **share-same — the expected copies updated ON PURPOSE:** `tests/integration/_old/pw-share.js` + `_old/cc-share.js` re-taken (a frozen copy
  of each daily's share.js as of this pass — WHICH: both, every card of both dailies changed: the name's painter + colour, the big time, the
  stat line); + 6 name-check rows (all made / one failed / both failed × night + day: each name's row inked in its result's colour and no
  other; the time + the stat line carry no green / red) → **35 / 35 SAME**. A shell runner for it: `tests/integration/share-same.mjs`.
- **THE WATERCOLOR SETTINGS TILE shows the bleed:** `picker.js#drawSample` calls the skin's own `seams` hook on the 3-block sample (the
  optional `sampleAt` — the watercolor's = the first board place whose two seams bleed); the tiles' labels fit (WATERCOLOR overflowed at 390).
- **Look review** (the canvases themselves at 1080 × 1350 + the 360-px thread size — `daily-probe.mjs CARDS=… Q="&cc=caught"`): round 1 —
  the name sat 12 px over the big time while the other gaps were 17 (the display font's caps sit lower than the model) → the rhythm re-spaced
  (name 18 · big 87 · stat 141 · art 167); round 2 (after the add-on) — the names in green / red / white, all made · one failed · both
  failed, night + day, 1 / 2 / 3 dailies + each own card.
- **Told:** the dailies chat (Downloads\NEON\MAILBOX.md — the rule, the kit's painters, what was removed from their share.js files).

## Group 1 — ARCADE PIXEL (`2a1513a1`) · Group 2 — GALAXY (`fe4b8890`)
What they are: docs/prism.md "SKINS 2B". How they are built (the decision worth knowing): **both are PAGE skins of the night family** — the
page host paints the background once per change, their moments are their own `fx()` on the board's canvas, **the WebGL world + the light
layer do NO work** (so a night skin of this kind is cheaper than the neon), and what moves behind the board is a few DOM pieces in a new
generic **SKY layer** (`.pd-sky` — the skin's `enter({ sky })`), moved by CSS on the compositor. The view gained three generic lines (no
skin named): the sky, `.pd[data-lite]` (the lower tiers) and `.pd[data-still]` (reduced effects).
- **The galaxy's "bloom on the rims"** is the BAKED glow ring (what the neon's static glow is — drawn as added light under the stack + the
  piece, on the tier's `glow`), not the WebGL light pass: the brief said "the light layer adds a gentle bloom" — the same look for no shader
  work, and its clear can then be its own stardust on the board.
- **The pixel's LINE! vs the callouts:** the view's callout already names 4 LINES / TWIST / PERFECT CLEAR / COMBO — the pixel's own word
  on the rows is LINE! / DOUBLE! / TRIPLE! only (never the name twice); the callouts print in Press Start 2P by the CSS.
- **Refine rounds (390 × 844 @3, read at 1×):** pixel r1 → the callout kept the neon family's glow (a specificity miss) → crisp hard
  shadows on every callout kind; the 4-line word doubled the callout → `clearWord` null there. Galaxy r1 read as PALE CANDY (a white core +
  lifted clouds + a white rim) → the fill deepened toward the corners, the clouds less white, the core in the colour, the ghost's line
  firmer; r2 (the glance test) → a touch richer again.
- **Press Start 2P:** `@fontsource/press-start-2p` 5.2.7's latin woff2, unchanged (12.5 KB) + its OFL text; fetched by a `FontFace` only
  when the pixel skin shows. It has no `→` glyph (a callout's arrow falls back to the UI font).

## Group 3 — THE NIGHT ROTATION + THE GLANCE TEST (`c457a03a`)
- **The night pool is live** (neon · pixel · galaxy — `pool[k % n]`, pins as SKINS 1); **the NIGHT SKIN row appears** (ROTATE · NEON ·
  ARCADE PIXEL · GALAXY, live tiles — nothing new in the picker: a look with 2+ owned skins gets its row). HONEST: the two skins joined the
  pool in Groups 1 + 2 (the preview's `&skin=` forcer pins a pool skin) — Group 3 is the tests, the glance test and the credits, not a switch.
- **THE GLANCE TEST** (`prism-glance.html?look=night`, `prism-shots.mjs SETS=nglance`, `GLANCE_DSF=1` — the real view three times, the same
  night board, each a phone wide, at the size a hand holds it):
  - **Round 1 (390):** all three obvious — neon = glowing OUTLINE tubes with dark centres over the song's world; pixel = flat bevelled
    SQUARE chunks that touch, inside a cyan pixel frame; galaxy = FILLED glowing rounded clouds with gaps, on deep space. The galaxy read
    a touch pale beside the pixel's flat colour → richer.
  - **Round 2 (390 / 402 / 430):** each obvious at a glance; the galaxy does not read as neon (filled vs hollow) nor as pixel (round +
    glowing vs square + flat). **Judged by me from the shots — Ben's eye, at speed, is the real test.**
- Unit: `tests/prism-skins-2b.test.mjs` (the pool, the row, pins + the un-owned fallback — `ownedOf` / `poolOf` take an optional registry
  so a locked skin can be tested; nothing is locked today).

## Group 4 — GROK's NIGHT SOUNDS (`827961f1`)
| file | what | source | size | length |
|---|---|---|---|---|
| `pixel-lock.mp3` | an 8-bit blip | "sfx_sounds_Blip6.wav", Juhani Junkala (SubspaceAudio) — CC0 | 1,567 B | 0.13 s |
| `pixel-clear.mp3` | an 8-bit rising sting | "sfx_sounds_powerup8.wav", the same pack — CC0 | 5,016 B | 0.42 s |
| `galaxy-lock.mp3` | a star chime | generated (Grok) | 2,821 B | 0.24 s |
| `galaxy-clear.mp3` | a stardust whoosh + a shimmer tail | generated (Grok) | 9,404 B | 0.78 s |

- **Copies only:** the 16 originals still match their SHA-256 after the import; the four day files came out byte-identical. No backup was
  needed. Each skin fetches only its own two, only when it shows; the code-made voices are the fallback.
- **The lock's pitch:** ± 3 % a play on both new locks (the same `lockRate` as the day skins').
- **Balanced on the game's sound bus — BY MEASUREMENT, NOT BY EAR** (`prism-sfx-level.mjs`): as first wired the pixel's lock sat 2.4 dB OVER
  the other skins' and its clears 2.7 / 1.5 dB over (dense 8-bit); the galaxy's clears 2.5 / 1.9 / 3.0 dB over — **its 4-line clear was
  louder than the song** (−31.8 vs −34.3). Now: locks −50.2 (pixel) · −50.1 (galaxy) beside −50.2 (neon); clears × 1 −43.7 · −44.4 beside
  −44.2; × 2 −40.2 · −41.7 beside −41.0; × 4 −35.2 · −35.2 beside −35.0; the song −34.3. The numbers to move if Ben's ear disagrees:
  `audio.js#SAMPLE_GAIN` (blip · chime · chip · dust) + `NOTE_GAIN`.
- **A thing only an ear can judge:** the pixel's sting is a PITCHED rising sweep and the galaxy's chime sits near 2.1 kHz — neither is in
  the song's key (the clear's own notes under them are). They may rub against a song; the code-made voices (in key) are one line away.

## THE ADD-ONS (Ben, mid-pass — the first local test run was STOPPED for them: they touch files the suites load; every suite ran once after)
### THE PASSWORD's CARDS (11:25 am — `aa7b2249`)
- **Its own card:** each room = ONE centred column — the small door, its label (THE FRONT DOOR / THE BACK ROOM), then ITS OWN grid, all on
  one centre; both columns TOP-ALIGNED, the pair centred, an even 110-px gap (`password/share.js#paintRooms` + `ROOMS`). The old
  `paintDoors` drew each label to the RIGHT of its door, so "THE FRONT DOOR" ran up to the second door and neither sat over its grid —
  gone. A held room's door + label stay red; a room never played = its door + label alone; a six-row room fits the art box (545 of 560).
- **Tall grids in SHARE TODAY:** tiles never under a FLOOR (`TILE_FLOOR` — 22 px ON THE CARD at any section scale); a grid that needs more
  than the strip makes ITS strip grow (`stripOf` / `sectionH`, PURE). SHARE TODAY now fits ONE scale to the SUM of the sections' natural
  heights (a daily may export `sectionH`; default `RHYTHM.H`) and records each section's place (`cv.sections`). At 3 dailies + a streak a
  six-row grid: 22.0-px tiles, its section 9 units taller, the other two at the rhythm's box, everything 3 % smaller.
- share-same: THE PASSWORD's copy re-taken ON PURPOSE again + 4 rows → **39 / 39**. Shots (night + day, 1080 × 1350): the own card + SHARE
  TODAY with both rooms in 2–3 guesses · the Back Room failed after 6 · the Front Door failed (`daily-preview.html` `&pw=locked` / `&pw=front`).

### THE TAP THROUGH THE DAILY SCREEN — Ben's LIVE BUG (`097dcc34`)
- **What happened:** DAILY → SCORES, a tap on ZACK's slim card opened PRISM DROP's game card.
- **THE EXACT LEAK:** the city hears every `pointerdown` / `pointerup` on the WINDOW, and `title-taps.js#onCityTap` let through every
  target not on a short list of classes. The DAILY screen is a body-level overlay that takes its layer with NO element and whose slim
  cards / gaps / padding are plain divs — not on the list → the city answered at that x, y. (NOT the strips' effect canvas: the overlay's
  own surface took the DOM event; the window listener did not care whose it was. The same hole was open under every body-level screen with
  plain surfaces — and for the sign's letters, the sightings and the door, not just billboards.)
- **THE FIX, at the shared layer** (docs/title.md "A SCREEN ON TOP OF THE CITY OWNS THE TOUCH"): `ui/layers.js#cityCovered` (PURE) — a
  layer open · the city held · a touch that began off the city's root; `title-taps.js#covered` asks it at the DOWN, at the TAP (before the
  class list, the sightings, the billboards, the door) and for the hover. No new boot module (THE BOOT PRELOAD stays 307 — a first version
  added two and sat one under THE BOOT BUDGET's 310: folded back).
- **A SCORES slim card still does nothing on a tap** (it never had a handler — nothing to keep or remove).
- **TEST — e2e-daily + 9 (53 → 62):** REAL touches on every SCORES card (middle + four edges), the gaps, the padding, SCORES · ALL TIME,
  TODAY's results list, and on a billboard's OWN points under the screen (14 / 10 / 13): no pop-up EVER opens (counted by a
  MutationObserver — the first version only looked at the end and MISSED the bug, because the next tap closed the card again); closed, the
  same tap opens the game's card. **With the rule switched off the run goes red with the game card opening under every billboard tap** —
  Ben's bug reproduced, then fixed.
- **HONEST:** "repeat for the results list" is done for THE DAILY screen's lists (TODAY's SCORES, ALL TIME, TODAY's tickets). A room's
  podium / results over the city is covered by the same rule (its screen is not inside the city's root) and by the unit pin, but has NO
  real-touch E2E of its own in this pass.

## QUALITY + PROOF
- **60 fps on the mid-range profile** (`prism-shots.mjs`, 390 × 844 @3, 7 opponents, a bot, 4× CPU, GPU, each tier locked, ~300 frames):

  | | rest — tier 3 | rest — tier 0 | heavy (a 4-line clear every 650 ms) — tier 3 | heavy — tier 0 |
  |---|---|---|---|---|
  | ARCADE PIXEL | 60 fps · CPU p75 / p95 1.9 / 2.7 ms | 60 · 1.9 / 3.0 | 60 · 3.0 / 3.9 | 60 · 2.3 / 3.5 |
  | GALAXY | 60 fps · 2.8 / 4.9 ms | 60 · 2.5 / 3.8 | 60 · 5.7 / 6.9 | 60 · 3.7 / 5.4 |
- **The tier steps** (`prism-tier-probe.mjs` — AUTO, heavy, 10× CPU): both skins **3 → 1 at 0.8 s** (the sky still, the pixel's scanlines
  off, the fx's lean cap — the board STILL 3×) **→ 0 at ~2.3 s** (the board's 2×). HONEST: in this headless run the 2× board made frames no
  faster, so the view's cap probe then called the machine CAPPED and went back up (0 → 3 at ~6.3 s, then 3 → 1 again) — the existing Low
  Power Mode rule doing what it was built to do under an artificial throttle; not changed here.
- **Only the shown skin's assets load** (`prism-sfx-probe.mjs`, a real page): the pixel font is fetched by the pixel skin alone; the neon +
  the galaxy fetch no font + no texture; each skin with sounds fetches only its own two files.
- **Nothing else moved** (`prism-skin-snap.mjs` A/B against a worktree of the commit before the pass): crayon + neon **152 / 152
  IDENTICAL**, watercolor + paper **86 / 86 IDENTICAL**.
- **Shots** (`tests/integration/shots-skins2b/` — out of git): each new skin mid-game, mid-clear, with incoming rows, the podium, the
  settings sheet's NIGHT row at 390 × 650 / 402 × 690 / 430 × 746 (Safari WITH its toolbars) and 390 × 844 / 402 × 874 / 430 × 932 (the
  home-screen app, safe areas); mid-game + mid-clear at 1440 × 900.

## What is real vs placeholder
- **REAL:** the share card's rule (every section + own card, both looks, made + failed); both skins' blocks, ghosts, incoming rows, clears,
  locks, slams, cancels, minis, pages, skies, panels, lettering; the rotation + the row; the four sounds with their fallbacks; the tiers.
- **FOR BEN TO JUDGE (not judged by me):** the share card against the mockup he approved (I built from the text) · pixel + galaxy AT SPEED
  on the phone (the flash bar's 0.1 s, the stardust's drift) · the glance test · **the four night sounds — nobody has heard them in the
  game** (levels by measurement; the two pitched ones against the songs).
- **SIMPLE / worth a second look:** the galaxy's nebula is three generic soft clouds (the same in every song — the song's world is not in
  either new skin's background) · the pixel's podium + spectating cards are the night family's with square corners (the console's slim
  cards on the podium are not pixel-styled) · the pixel's SLAM trail is two dotted columns a cell (busy on a long drop) · the scanlines are
  CSS-pixel lines (3 device px on an iPhone — crisp, a little coarse).
- **NOT DONE:** a holiday override for the new skins (crayon + neon only, as before) · a level unlock (everyone owns all three) · the song's
  world in the new skins' backgrounds.

## Tests
Local, per THE LOCAL TESTING RULE (unit + the games' E2E + the harbor GROUPS the pass touches; the FULL harbor runs in the cloud on the tagged
push). Fresh emulators + `serve.mjs --emu` on :5173 (+ :5195 with THE DROP's OFF row opened for e2e-drop · :5196 `DAILY_TEST=1` for e2e-daily ·
:5174 / :5175 = a worktree of the commit before the pass, for the A/Bs). No rules change, no `/api` change — those suites were not re-run. The
first run was STOPPED when Ben's two add-ons arrived; every suite below ran on the FINAL code, one after another, nothing else running.

| suite | result |
|---|---|
| unit (`node --test tests/*.test.mjs`) | **1895 / 1895** (+ 15: `prism-skins-2b` 10, `city-covered` 3, `share-rhythm` + 2) |
| share-same (`share-same.mjs`) | **39 / 39 SAME** (the expected copies re-taken ON PURPOSE; + the name check, + THE PASSWORD's floor) |
| THE PIXEL-IDENTICAL PROOF (`prism-skin-snap.mjs` A/B) | crayon + neon **152 / 152**, watercolor + paper **86 / 86** IDENTICAL |
| e2e-prism FAST | **64 / 64** |
| e2e-prism full (8 phones) | **92 / 92** (the known REFRESH one-attack check was green) |
| e2e-playnow | WebKit **36 / 36** · Chromium **36 / 36** (see the note) |
| e2e-drop | **34 / 34** |
| e2e-daily | **62 / 62** (+ 9: the tap-through checks) |
| smoke | **8 / 8** |
| harbor groups `core, billboard, sightings, room, afterparty, shell, sololook, cartridge, tapfit, corners` | **118 / 118** |
| prism-sfx-probe (a real page, the audio unlocked) | **52** sound checks + the asset checks — all ok |

- **The one red on the way — a test's race, fixed in the test:** e2e-playnow Chromium's "SCORE RUSH hidden 20 s mid-song" failed in 2 of 4
  full runs (never alone, never in WebKit). It samples the clock, hides the page, and demanded the hide's stamp be STRICTLY later — the two
  calls sit a millisecond or so apart, and in the same millisecond `<` is false though nothing is wrong. Now `<=` (the hide never moves the
  clock back). Not on any path this pass touches; said here because it is a test changed to go green.
- Servers: the emulators, :5173, :5174, :5175, :5195 and :5196 were this pass's own and are STOPPED at the end; :5190 (Ben's preview server)
  is left running.

## New + changed files
Share: `js/daily/share.js` (the three painters, INK, RHYTHM) · `share-today.js` (the natural heights, `cv.sections`) · `games/password/share.js`
(`paintRooms`, `stripOf`, `sectionH`) · `games/coastclear/share.js` (`partsOf`) · `games/drop/share.js` (8 rows). Skins: `prism/pixel-art.js` ·
`pixelfx.js` · `galaxy-art.js` · `galaxyfx.js` · `night-pages.js` (new) · `skins.js` (pixel, galaxy, `sampleAt`, the registry argument) ·
`view.js` (the sky, `data-lite`, `data-still`) · `picker.js` (the seams in a tile) · `audio.js` (four voices + their levels) · `css/prism.css`
(the two skins) · `assets/fonts/prism/press-start-2p-latin-400.woff2` + `LICENSE-PressStart2P.txt` · `audio/sfx/prism/` (+ 4 mp3, 18.8 KB) ·
`scripts/build-prism-skin-sfx.py`. The tap-through: `js/ui/layers.js` (`cityCovered`) · `screens/title-taps.js` · `title.js`. Tests:
`tests/prism-skins-2b.test.mjs`, `city-covered.test.mjs`, `share-rhythm.test.mjs` (rewritten); tools `share-same.mjs`, `prism-tier-probe.mjs`,
`prism-glance.html?look=night`, `prism-shots.mjs SETS=nskins,nglance`, `prism-sfx-level.mjs SKINS=`, `prism-sfx-probe.mjs` (+ assets).
PRISM's preload graph: 52 modules / 553 KB → 57 modules / 614 KB (the budget: 1.5 MB). THE BOOT PRELOAD: 307 modules (unchanged).

## The cloud (the ONE push — `52b660dc`, the harbor tag; not re-run)
- **tests: GREEN** (7m17s — unit + the whole-match simulations; rules + /api + smoke).
- **harbor: GREEN — 15 of 15 jobs** (11m2s: perf · lobbyfix · legend · wild · show · lobbyfix2 · audio · street · windows · lobby · room2 · city ·
  models · speed · holiday). None of the known city timing checks tripped this run.
