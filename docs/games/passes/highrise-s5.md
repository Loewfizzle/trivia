# HIGH RISE — S5: BEN'S NOTES (THE PLACE NUMBER · 18 s · THE SHARE IMAGE · THE B1 BILLBOARD · THE EFFECTS REBUILD) (Nov 20 2026)

**No rules change** (`database.rules.json` untouched — nothing to re-publish). HIGH RISE stays HIDDEN (the owner's phone only) and
NOTHING COUNTS (`HIGHRISE_COUNTS` off). The owner's decisions: `docs/games/plan.md` "HIGH RISE — S5". The bible: `docs/highrise.md`
"THE MATCH" · "THE SHARE IMAGE" · "THE BILLBOARD" · "THE EFFECTS REBUILD".

| commit | what |
| --- | --- |
| `353933b7` | Step 0 — Ben's notes into plan.md; the Lab's marks re-exported (no open FIX mark) |
| `757742c3` | Group 1 — THE PLACE NUMBER + THE RANKED LIST IN WATCH + 18 s + THE ANNOUNCER CHECK + ZERO GARBAGE IN A MATCH |
| `c2caacd8` | Group 2 — THE SHARE IMAGE |
| `6245257a` | Group 3 — THE POSTER → THE B1 BILLBOARD ART |
| `7c8de15a` | Group 4 — THE EFFECTS REBUILD |
| `e9e99b3e` | the close — THE FRESH-EYES REVIEW's fixes |
| the close (top) | the docs, the final run (the ci tag) |

THE ADD-ON INBOX: read at the start, after every group's commit and before the final run — nothing new arrived. Built: the Nov 20 12:49 am entry "GARBAGE IN A LIVE MATCH" (Group 1 — marked done; the real 2-phone mirror measure stays open). Left open: the Nov 20 12:49 am "LEAF WRITES" entry (a rules change on live JAYWALK — REVIEW FIX). Added at the close: OPEN FOR BEN · TO JAYWALK (the red e2e-jaywalk).

## GROUP 1 — THE PLACE NUMBER + THE RANKED LIST IN WATCH + 18 s + THE ANNOUNCER CHECK
- **THE ALTIMETER IS GONE from live play.** **THE PLACE NUMBER** (`matchhud.js#place`): one big still number top-left under ☰ —
  `3RD / 8` (the ordinal 50 px in the game's numerals, `/ 8` 20 px + dimmer; `1ST` gold), clear of THE DROP ZONE + the tags' column.
  Your place = 1 + the players strictly over your floor (`rivals.js#placeOf` — a level player shares it: everyone climbs in step and
  a rival's height is a network's beat old). Written ONLY when it changes (the same place handed 5 × = 0 DOM mutations); a change =
  ONE pulse of its glow copy (up cyan · down soft pink — opacity + transform, 650 ms). Rivals stay ON THE TOWER (tapes + tags).
- **THE RANKED LIST — WATCH only**: big rows (44 pt): the place · a colour bar · the name (15 px) · the floor (19 px); the watched row
  lit, YOU outlined, OUT a cross + a struck name, the finish a gold diamond, a silent phone a hollow bar. Tap a row = watch them; a tap
  elsewhere = the next. The HUD column steps right of the list (the watched tower's number never under it).
- **Found + fixed on the way:** WATCH swapped between LEVEL players at every floor (the leader was re-picked at every pump) — the one
  you follow now STAYS while they climb (the cartridge's `view.js` + the test page's bots).
- **The test page's bot room** (`?mode=match&rivals=7`) now has OUT = WATCH too (`matchsim.js`): the page's own end card comes once
  every bot is down, or after 45 s of watching (`SIM_WATCH_MS`).
- **18 s**: `match.js#IDLE_OUT_MS = 18000` — pinned equal to JAYWALK's by a test.
- **THE ANNOUNCER CHECK** (measured at 390 × 844, both looks — `highrise-place.mjs`): the match lane was **12 px — too small for a
  glance → 16 px**, one line (31 px tall), held 1.5 s (1.32 s on screen before its fade), inside the HUD column — never over the stack
  (it ends at 204, THE DROP ZONE starts at 324) nor a tag; **the same words twice inside 4 s are said once** (`REPEAT_MS` — three in a
  burst → 1). The solo lane: **PERFECT 0.7 → 1.5 s, FASTER 1.1 → 1.5 s** (0.7 s was gone before it was read; the next perfect still
  replaces it — the same priority).
- **ZERO GARBAGE IN A MATCH** (the inbox's Nov 20 12:49 am entry): `nearest` · `mergeTags` · `matchCalls` fill kept scratch (the same
  answers — tested call after call), `stage.js#placeRivals` pools its records; the cartridge's pump keeps ONE row a rival (a change
  found field by field — no key string), the live key once a game (no JSON 10 × a second), `S.me(record)` for your own numbers, the
  count's roster not rebuilt from the same list. **7 bot rivals: the game's own code 42.6 → 8.0 KB/s** (the guard's line 12; the
  test page's own bots excluded by site — the guard has a MATCH row now).
**Shots**: `Downloads\NEON\highrise-s5\match\` — `place-{night,day}-390x844-{first,mid,last,pulse-up,pulse-down}.png` ·
`watch-{night,day}-390x844-{list,picked}.png` · `pixel\` (the 8-player pixel test's samples).

## GROUP 2 — THE SHARE IMAGE (the owner's mockup `Downloads\NEON\highrise-share-image.png`)
- **THE FRAME** (`shot.js` + `night.js#snap`): a beat after YOUR tower's end the next frame drawn is copied off the canvas IN that frame
  (no preserveDrawingBuffer) with where the top slab stands on it — per cause (`SHOT_AT`: a miss 170 ms — the slab still falling past
  the top · too thin 200 · too slow 300 · the bell 60 · THE FINISH 1.7 s — its gold light poured); kept on this phone under the run's
  key (the cartridge: its match id) until the next run.
- **THE CARD** (`share.js#drawHiCard` on the kit's `drawRunCard`): 1080 × 1350 — the kit's sign + `HIGH RISE · SOLO` / `· MATCH` in the
  accent; THE HERO FRAME = JAYWALK's box (984 × 792 at 48, 348), one neon edge, the real frame zoomed on the tower's top (the full width
  — the falling slab beside it) and lifted by night; the cause ONCE in a dark tab top-left (58 px — `MISSED THE STACK` on one line, `MADE
  IT TO THE / MOTHERSHIP` on two); THE TOWER (`core/marks.js`) top-right; `THE CLOUDS · 93 PERFECTS` lavender over the floor in the GAME's
  numerals (Chakra Petch — Orbitron's zero is slashed, the mockup's is not; JAYWALK's `drawNum` for the 1's foot), white-hot with a
  CYAN glow, + FLOORS (a size down when a long number would pass the edge); the name under the frame; the kit's foot.
  **THE FINISH = ALL GOLD** (the edge, the title line, the cause, the band line, the number), the gold-lit top under THE MOTHERSHIP's beam.
- **SHARE on the universal footer** (`index.js#shareRun`, lazy — solo + match): the card is drawn while the end screen is read
  (`final.js` → `warmShare`), the link uploaded only at the first SHARE tap (prepShare's onTap), fitted under the server's cap
  (`fitPng` — moved from JAYWALK's share.js into the kit, JAYWALK re-exports it unchanged). **Behind the switch:** the server takes a
  run's card only with its own COUNTED result (`api/_lib/share-card.js#RUN_GAMES` + `highrise`) — none while `HIGHRISE_COUNTS` is off;
  the phone asks nothing once the server has said WOULD COUNT (`globalThis.__hiWould`) → the picture alone goes out, no text.
**Shots**: `Downloads\NEON\highrise-s5\share\` — `card-{night-miss,day-miss,night-long-match,night-made}-{1080x1350,540x675}.png` +
the raw frames `frame-*.jpg`.

## GROUP 3 — THE POSTER → THE B1 BILLBOARD ART (NOT installed in the city)
- **THE POSTER** (`poster.js` — the test page's `?poster=1`, JAYWALK's lab pattern): the REAL night scene staged the same every time —
  the seed `poster2` (its slabs violet-blue in THE CLOUDS: the mockup's tower; `poster` came out orange), climbed to floor 78, ONE cut
  dropped (its falling piece + its sparks), the game FROZEN 140 ms later, the frame copied (`night.js#snap`), cropped to the board's
  848 : 448 round the tower's top and darkened for the words.
- **B1** (`billboard.js` — pure canvas): HIGH (white-hot, hot-pink edge, thick dark outline) over RISE (white-hot, cyan edge), centred,
  each cap 0.255 of the board; the DARK foot band with a pink neon line along its top; OPEN NOW big, WHITE, heavy (cap 0.14 — never
  black-on-pink). The lettering = path data in BOWLBY ONE (`billboard-glyphs.js`, GENERATED by `scripts/build-highrise-billboard.mjs`
  — OFL; no font load on the site).
- **The output**: `assets/city/highrise/billboard.webp` (848 × 448, 34 KB — the words baked in: JAYWALK's OPEN NOW face is drawn whole
  the same way) + its glyph file + `Downloads\NEON\highrise-s5\billboard\highrise-billboard-2x.png` (1696 × 896) · `-1x.png` ·
  `-art-2x.png` (the scene alone). **Not wired into the city** (a unit test pins the city's files) — the CITY chat installs it at go-live.
- **THE READABILITY PROOF** (`tests/integration/highrise-billboard.mjs` — IN THE CITY at 390 × 844, LOCAL ONLY: the roof board's JAYWALK
  OPEN NOW face forced, then its picture's request answered with HIGH RISE's file in the test — nothing committed into the city; both
  posters drawn whole in the SAME poster box, the box on screen 82.8 × 45.0 pt; each poster's letters measured in its own picture × the
  box's scale):

  | on screen at 390 × 844 | JAYWALK (live) | HIGH RISE (B1) | |
  | --- | --- | --- | --- |
  | the word | JAYWALK 9.0 pt | HIGH 11.2 pt · RISE 10.9 pt | ✓ 1.22 × |
  | the bar | NOW OPEN 3.7 pt | OPEN NOW 6.1 pt | ✓ 1.63 × |

**Shots**: `Downloads\NEON\highrise-s5\billboard\` — the PNGs + `city-390x844-{jaywalk,highrise}-open.png` + their `-board.png`
close crops + `billboard-measure.json`.

## GROUP 4 — THE EFFECTS REBUILD (Ben's A/B: `?lean=1` halved Safari's slow frames)
**THE BISECT** (`tests/integration/highrise-paint.mjs --bisect` — a Chromium trace of the owner's OWN link `?trace=1&fps=1`, 20 s of a bot's
run, by night + by day; `?lean=<name>` turns ONE effect off: `num` · `call` · `band` · `clock` · `tag` · `fps` · `ann` · `place`). Every DOM /
CSS effect drawn over the 3D view during a run: the floor number's text-shadow (4 layers, a 34 px blur) · the announcer's lane (a 26 px
glow + its Web Animation pop) · the band's name (a 10 px halo; its swell at an arrival) · the match clock (an 8 px halo) · the tags (a
transform transition, the friend's box-shadow) · the `?fps=1` line (an 8 px halo — 22 px by day — rewritten EVERY SECOND) · the match lane +
THE PLACE NUMBER. No filter / backdrop-filter / blend mode anywhere in the sheet. **Ranked by raster time** (what the GPU / Safari spends
re-rasterising; the paint COUNTS were the same with and without lean — ≈ 5–7 a second — the cost is the blur inside them):

| raster ms a second | night | day |
| --- | --- | --- |
| the plain link — BEFORE | **0.74** | **0.79** |
| … the floor number's share | 0.33 | 0.36 |
| … the announcer's | 0.27 | 0.10 |
| … the band's (it shares the number's invalidation) | 0.20 | 0.09 |
| … the fps line's | 0.15 | 0.33 |
| … the tags' | 0.07 | 0 |
| **the plain link — AFTER** | **0.17** | **0.15** |
| `?lean=1` (unchanged) | 0.10 | 0.10 |

**THE REBUILD — the same look** (before / after at 390 × 844, the SAME frozen instant, the old DOM glow switched back on for the before:
`Downloads\NEON\highrise-s5\effects\hud-{night,day}-before-left-after-right.png` · the number alone: `num-{night,day}-before-after.png`):
1. **THE FLOOR NUMBER** (`bakedtext.js#bakedNumber`): the ten digits drawn WITH their glow ONCE a style — read off the number's own
   computed style (font, colour, every text-shadow: the gold, the day's ink, `?lean`'s switches all still come from the CSS) — into small
   bitmaps; a landing COPIES 1 – 3 of them into ONE canvas over the number (no blur, no text layout). The digit boxes stay for the layout
   + the reading (transparent, shadowless). A style change (gold · the sky's tone · a resize · the font landing) bakes again.
   (Found on the way: the face's numerals are PROPORTIONAL — the baked 1 first sat in a 0's box; each digit now keeps its own advance.)
2. **THE ANNOUNCER's LANE** (`bakedtext.js#bakedLine`): its pieces ("PERFECT ×", "NEW BEST", "FASTER", each digit …) baked once a style;
   a call composes their bitmaps; the pop stays a Web Animation (transform + opacity on the compositor).
3. **THE FPS LINE**: its halo → one plain text draw on a flat dark plate (by day too) — it is rewritten every second.
Kept as it was (cheap — measured ≈ 0): the band's name (only rewritten at an arrival), the tags (a transform transition), the place +
the lane in a match (written only at a change). `?lean=1` still works (and `?lean=<name>` for one effect) — the owner's A/B is unchanged.
**WebKit**: not measured — Playwright's WebKit on the Beelink draws WebGL in software (~21 fps): its frame times say nothing about
paint (the memory "Beelink frame-timing quirks"); the owner's iPhone A/B is the measure.

## THE CALLS MADE (obvious / established pattern — the owner may overrule: OPEN FOR BEN 2)
1. **The place rule**: 1 + the players strictly over your floor — a level player SHARES your place (everyone climbs in step; a rival's
   height is a network's beat old: a place that flickered between 1ST and 4TH at every landing would be the moving text you cut). The
   podium still breaks ties by perfects + the earlier tick.
2. **"1ST / 8" while level with everyone** (the shared place) — gold, as asked for 1ST.
3. **The place number's spot**: top-left under ☰ (the tags own the right edge); hidden in WATCH, on the out card, the end, the podium.
4. **The ranked list** sits top-left under ☰ (8 rows = 352 pt; rows 7–8 overlap the watched tower's left at 8 players, on a dark strip);
   the HUD column steps right of it so the watched tower's number is never under it.
5. **The test page's bot room** now goes to WATCH when your run ends (the cartridge's flow — Ben's phone check needs it); its own end
   card comes once every bot is down or after 45 s of watching.
6. **The announcer**: the solo lane's PERFECT / FASTER held 1.5 s (was 0.7 / 1.1) — each new perfect still replaces the last.
7. **The share card's hero crop**: the full frame width (zoom 1.0 — the missed slab beside the top), the top at 44 % of the box (60 % for
   the finish, so THE MOTHERSHIP's beam pours in from above — the ship's hull itself hangs above the view; a crop that held it squeezed
   the gold top under the number).
8. **The share card's numerals**: the game's own face (Chakra Petch, JAYWALK's `drawNum` for the 1's foot) — Orbitron's zero is slashed,
   the mockup's is not.
9. **No SHARE on the test page**: its door stays shut (the share kit reaches config.js + the dailies' sheet → Firebase). The card is seen
   from the hidden cartridge's SHARE on the owner's phone (OPEN FOR BEN 1).
10. **The billboard's file = the whole poster with its words baked in** (`billboard.webp`, 848 × 448 — JAYWALK's OPEN NOW face is shown
    whole the same way); the glyph file is its lettering's source (+ for a crisp re-letter if the city chat wants one). Seed `poster2`
    (violet-blue slabs — the mockup's tower; `poster` came out orange).
11. **The per-game budget**: highrise 2450 → 2500 KB, modules 160 → 165 (the place number + the list, the share module's lazy reach,
    bakedtext.js).
12. **`fitPng` moved into the share kit** (JAYWALK re-exports it unchanged) — ONE copy for both games' run cards.
13. **The fps line** (`?fps=1`, the owner's own debug line) now sits on a flat dark plate instead of a glow — it is rewritten every
    second.
14. **The billboard's in-city proof measures each poster's letters in its own picture × the board's on-screen box** (both drawn whole in
    the same box) — the letters' light faces, not their outlines.

## THE FRESH-EYES REVIEW (the close — two separate read-only agents that wrote none of it, narrow briefs: the match side · the share /
billboard / effects side). Every finding was checked against the code before anything changed.
**FIXED (12)**
| # | what the review found | the fix |
| --- | --- | --- |
| 1 | the test page's bot room was DEAD after WATCH: the card came back hidden (`card` stayed false) — no tap could restart | `unwatch()` puts the card up (its hold from now) + clears the watched tower's tapes + tags; tested (card up + PLAY AGAIN) |
| 2 | a WATCH tap's pick was never spent — after that player went out the leader was re-picked every pump (the level-swap back) | the pick cleared once followed (view.js + matchsim.js) |
| 3 | the list's order waited under a finger, nothing re-applied it at the lift | the last list applied at pointerup / cancel |
| 4 | the place number's show rule out-ranked its hide rules (WATCH relied on JS alone) | the show rule excludes is-watch / is-over / is-final |
| 5 | a NEW BEST re-baked the ten gold digits IN its frame (+ the "warms both styles" comment was untrue) | `warmHud()` bakes the gold set behind the welcome; ≤ 2 sets kept, an evicted set zeroed |
| 6 | the announcer's first PERFECT / STREAK / NEW BEST / FASTER baked in their frame (the S4A FIX 2 prewarm rule) | the lane's words + digits warmed behind the welcome, each class |
| 7 | a dpr change (desktop zoom) kept the old backing size — the digits drawn clipped | a new dpr resets the size (number + lane) |
| 8 | the bell's shot took the miss's beat | its own (`run.st` for a non-out end) |
| 9 | the share card's numbers came from the phone's frame over THE JUDGE's | the judge's whenever it has answered; the frame gives the picture |
| 10 | `?lean=num` no longer took the number's glow off (baked at the welcome) | re-baked at going live when a lean switch is on |
| 11 | a font that landed late left the call on screen in the fallback face | redrawn |
| 12 | a hidden tab could snap the WATCHED tower as YOUR picture · `fonts.check` can throw on an empty font | no shot while watching · the check guarded |
**NOT CHANGED — named:** "the DOM digits were tabular" — Chakra Petch has no tabular set: the frozen-instant before / after shows a 1
narrow in both (the bake keeps each digit's own advance). A rival's name / colour frozen at the record's birth (a late `players/`
entry shows GHOST) — older than S5 → THE REVIEW.

## THE FINAL RUN (the Beelink — this pass's own emulators + `serve.mjs --emu`, nothing else busy)
| suite | result |
| --- | --- |
| unit — `node --test tests/*.test.mjs` | 2372 / 2372 |
| rules — `rules.test.mjs` (no rules change) | 89 / 89 |
| `/api` — `server.test.mjs` · `share-card.test.mjs` (+ "HIGH RISE S5 — A RUN's CARD") | 68 / 68 · 3 / 3 (the first run caught my own test leaving its `shrx/{day}` index behind — the CITY E test then counted two; fixed + run three times) |
| smoke — `e2e-smoke.mjs` | 26 / 26 |
| `e2e-highrise.mjs` (the full run — SHARE → the picture alone) | 85 / 85 |
| `e2e-highrise-match.mjs` (three phones + a late joiner — THE PLACE NUMBER, THE RANKED LIST) | 55 / 55, errors none |
| `e2e-jaywalk-match.mjs` (FAST — JAYWALK's share.js re-exports the kit's fitPng) | 91 / 91 |
| `e2e-jaywalk.mjs` (FAST) | **4 / 7 — RED, NOT THIS PASS:** PLAY NOW never reaches JAYWALK's screen in 25 s — the SAME on the pre-pass code (`21dae81f`, a worktree on :5174) and on FRESH emulators (OPEN FOR BEN 3) |
| the test page — `highrise-play.mjs` · `--end` · `--s3` · `--webkit` | 237 / 237 (REPLAY = LIVE ✓) · 52 / 52 · 125 / 125 · 6 / 6 |
| ZERO GARBAGE `highrise-alloc.mjs` (solo night + day + THE MATCH row, 7 bots) | 12 / 12 — the match's own code 8.0 KB/s (≤ 12) |
| THE PIXEL TEST `highrise-rivals.mjs` (8 players, day + night) | 10 / 10 — 0 rival pixels in the play zone (THE PLACE NUMBER in its allowed map) |
| THE PLACE NUMBER `highrise-place.mjs` · THE SHARE IMAGE `highrise-share.mjs` · THE BILLBOARD `highrise-billboard.mjs` | 82 / 82 · 28 / 28 · 6 / 6 |
| the flyers' path · the landing · THE PRE-WARM · the sound sync | 26 / 26 · 7 / 7 · 35 / 35 · 42 / 42 |
| WHAT REPAINTS `highrise-paint.mjs` · `--bisect` | 13 / 13 (a match landing 7.9 paints — the line 6.5 → 8.5: THE BAKED HUD's two canvases are image copies, the bisect's raster is the cost) · 2 / 2 |
**The servers**: every server this pass started is STOPPED at the end (the emulators' npm / firebase / java + `serve.mjs` on :5173, by PID;
the pre-pass worktree's :5174 + the worktree itself removed).

## OPEN FOR BEN
**RE-PUBLISH: nothing** — no rules change in S5 (S4B's file `Downloads\NEON\database.rules.nov20-s4b.json` is still the one to publish
if you have not yet: the match needs it).

**1 · YOUR PHONE CHECKS**
- **THE LAG A/B again** — the same kind of run on each, compare the "> 33 MS" counts on the two end cards:
  https://neonspeakeasy.com/highrise-play?trace=1&fps=1
  https://neonspeakeasy.com/highrise-play?trace=1&fps=1&lean=1
  The plain link should now be close to lean (on this machine its raster went 0.74 → 0.17 ms a second, lean 0.10). One effect off at a
  time, if you want to see which one costs on YOUR phone: `&lean=num` · `&lean=call` · `&lean=band` · `&lean=fps` · `&lean=tag`.
- **THE PLACE NUMBER + THE WATCH LIST**: https://neonspeakeasy.com/highrise-play?mode=match&rivals=7 — climb (the number top-left,
  "3RD / 8", a pulse when it changes), then let a slab drop: WATCH with the ranked list — tap a name, tap elsewhere for the next; the
  page's own card comes once every bot is down (or after 45 s).
- **THE SHARE CARD**: the test page keeps its door shut (no share kit there) — see it from the hidden cartridge: open a room on
  neonspeakeasy.com → pick HIGH RISE · TEST → play a solo run → on the end screen tap **SHARE**: while counting is OFF the picture
  itself goes to your share sheet (save it / send it). The card's look: `Downloads\NEON\highrise-s5\share\card-*.png`.
- **THE BILLBOARD**: `C:\Users\benja\Downloads\NEON\highrise-s5\billboard\highrise-billboard-2x.png` (1696 × 896) ·
  `…\highrise-billboard-1x.png` (848 × 448) · in the city at 390 × 844 (local only): `…\city-390x844-highrise-open.png` + its
  `-board.png` close-up beside JAYWALK's (`…-jaywalk-open-…`). Not installed — the CITY chat does it at go-live.

**2 · THE CALLS I MADE — overrule any** (the list above, "THE CALLS MADE"). The ones most worth your eye:
- A LEVEL player shares your place — while everyone climbs in step you read "1ST / 8" (gold).
- The ranked list in WATCH sits top-left under ☰; with 8 players its last rows overlap the watched tower's left edge (on a dark strip).
- The share card's finish shows the gold-lit top under THE MOTHERSHIP's beam — the ship's hull itself is above the frame's view.
- No SHARE on the test page (its door): the card is seen from the cartridge.
- The `?fps=1` line now sits on a flat dark plate (it was a glow).
- PERFECT now stays 1.5 s on screen (it was 0.7 — the announcer check).

**3 · NOT DONE / STILL OPEN**
- **`e2e-jaywalk.mjs` is red at PLAY NOW** (the stranger's JAYWALK card → the game's screen never comes in 25 s) — on the PRE-PASS code
  too and on fresh emulators: not S5's. JAYWALK's match E2E is green. → the inbox, to the next JAYWALK / city pass.
- **THE LEAF WRITES + Call the Winner's no-run case** (the inbox's Nov 20 12:49 am entry, JAYWALK + HIGH RISE): a rules change on live
  JAYWALK — not this pass (no rules change was planned); → REVIEW FIX.
- **The match's mirror in a REAL 2-phone match** (the room re-reads the whole proof tree at each rival's chunk) — needs two phones:
  a match with your brother + `?trace=1` would show it.
- **WebKit's paint cost** is not measurable on the Beelink (software GL) — your iPhone A/B is the measure.
- A rival whose `players/` entry lands late keeps "GHOST" for the match (older than S5) → THE REVIEW.
