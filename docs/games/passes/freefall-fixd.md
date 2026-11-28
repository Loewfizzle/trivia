# FREEFALL — THE FIX PASS D: THE IN-PLAY HUD INSIDE THE 3D PICTURE (Nov 27 2026 · the Beelink · Opus 5.5)

`docs/games/plan.md` — "FREEFALL — FIX D". THE LAST SPEED FIX. FREEFALL stays HIDDEN (`config.js` GAMES[].playable untouched), THE SWITCH
(counting) stays OFF. VIEW ONLY: no rules / engine / judge / proof change, no `database.rules.json` change. The rules: docs/freefall.md
"THE FIX PASS D".

## STEP 0 — `docs/games/plan.md` (committed first)
THE SPEED CAUSE, FOUND (Ben's iPhone, `?fps=2`: 15 / 75 after FIX C · `&hud=0` 4 / 65 · `&empty=1` 0 in 1,800 frames — the HTML HUD over the
canvas) · GO-LIVE gets a small /admin HELD list + RELEASE · HOW TO PLAY: "Multiplayer never pauses".

## GROUP 1 — THE IN-PLAY HUD INTO WEBGL (`js/games/freefall/hudgl.js`, new — `bakedtext.js` gone)
1. **WHAT MOVED:** everything on screen while the ball falls — THE BIG NUMBER (+ its glow, the gold NEW BEST set) · the top line (YOUR BEST n ·
   n PLAYING) · THE DEPTH RAIL (the line + foot, every dot's states: plain · lost · made · out (the cross), my own, the names + their
   made / dimmed states, nudged apart, 0.2 s moves) · the AREA BANDS (+ THE BOTTOM's gold one) · the calls (BLAZE! · SMASH! · CLOSE CALL ·
   NEW BEST) · the callouts (MIA IS OUT) · LAST ONE STANDING · THE LIGHTS ARE GOING OUT (its blink) · the last half minute's clock · the
   WATCHING line (+ spectate's) · the page's note while a run is on. Drawn by the 3D picture's LAST pass (after the bloom + THE VEIL —
   `night.js#setOverlay`), never in a staged share frame.
2. **HOW — THE STYLESHEET STAYS THE ONE SOURCE:** every piece's HTML node stays in the page, HIDDEN, and is PAINTED from its own computed
   style (hudgl.js's painter: backgrounds, linear / radial gradients, borders, box + text shadows, ::before / ::after + their transforms)
   into a texture ONCE, uploaded at once (`initTexture` — never at a first draw in a fall), its canvas let go. When: a look's pieces at the
   opening (+ the other look in a quiet moment), a match's rail / names / callouts at a ROSTER change (one atlas, one upload), a real resize
   when it settles, a font landing late. Words that change re-lay quads from a GLYPH ATLAS per style (the number's DIGIT ATLAS — the plain +
   the gold sets; the top line; FLOOR n; the clock; the watch line; LAST ONE STANDING's line): no bake, no upload, no string built a frame.
   Glows ≥ 12 px at 1× (soft at any size), the letters + their tight edges at the device's own ratio, every letter's BASELINE snapped to
   the canvas's pixels (the browser's rule). Premultiplied, sRGB with no conversion (the page's own layers' blend).
3. **THE SAME MOTION:** the old keyframes + transitions, number for number (css @keyframes ff-out / ff-last + their per-segment ease-out;
   the bands' + the call's Web Animation frames + whole-run easing; the plate's steps(2) blink; `.ff-hud`'s fade; the rail's 0.2 s linear) —
   `tests/freefall-fixd.test.mjs` holds the stylesheet's numbers and the GL HUD's together.
4. **STAYS HTML** (not on screen while falling): the opening + its title, PAUSED + the count, HOW TO PLAY, 3 · 2 · 1 + the names, the OUT
   card + Call the Winner, the end card / the podium, the share sheet, ☰ / SOUNDS (hidden in play on the test page; the console's corner
   buttons are static).
5. **IN A FALL NO HTML OVER THE CANVAS CHANGES** — NEW BEST's gold + the plate are FLAGS (no class); data-dark / data-area are not written
   (the veil draws the darkness since FIX C); ONE visually hidden screen-reader line remains (the floor every 10 floors + the arrivals +
   LAST ONE STANDING — at most once a floor). The fps line (`?fps=`) is hidden while a run is on (as `&hud=0` had it) — its summary at the end.
6. **THE TESTS THAT READ THE HUD FROM THE PAGE** now read the GL HUD's state (`__ffPlay.state().gl` — its words, its laid lines' boxes +
   baselines, its alphas, the names baked) or the hidden sources' boxes + inks (the stylesheet): no check deleted.

## GROUP 2 — SMALL
- HOW TO PLAY (`js/ui/help.js`, FREEFALL's tab): "Multiplayer never pauses." (was "A MATCH never pauses.") — the one shared file this pass
  touched: a FREEFALL-only string in a lazy chunk (unit + smoke ran; no other game's text moved).

## THE SIDE-BY-SIDE (`freefall-play.mjs --hudab` on each build — the old HTML HUD on a worktree of 512c0acb at :5174 — then `--hudab-join`)
`Downloads\NEON\freefall-fixd\hud\` — `old\` · `new\` · `side\` (old | new at real size + the top of the screen at 2×): 375 × 667 · 390 × 844 ·
430 × 932, both looks; the number + the top line · BLAZE! · SMASH! · a band · NEW BEST (gold) · THE LIGHTS ARE GOING OUT · THE BOTTOM's gold
band · the rail + a callout · LAST ONE STANDING · WATCHING · spectate. Each moment frozen in a flat stretch of its motion.
**The fresh-eyes reviewer** (all 58 pairs): INDISTINGUISHABLE — NEW BEST (gold), THE LIGHTS ARE GOING OUT, the top line, the rail line,
the names' plates, no blur / halo / fringe anywhere. FIXED from its list: (1) the WATCHED number was solid where the old one was see-through
(a layer-by-layer fade — now ONE group fade through a small target) · (2) MIA IS OUT 6 px right (the hidden source's own entry animation
was scaling the box it was measured from — the sources' animations are off now) · (3) overlapping rail dots stacked the other way (the old
page's prepend order restored) · (4) the band's words ~1 px low (the old band's MIDDLE baseline restored). Left as is (enlarged only, ≤ 1 px
by measure): the watch line's + LAST ONE STANDING's last pixel. Re-shot + checked after the fixes: `side\*-390-*`.
Expected differences named for the reviewer: the 3D scene behind (each build frozen a few frames apart) · the callout's ink in the rig.

## THE CALLS I MADE (named — yours to overrule)
1. **The stylesheet stays the source of the look** — the GL HUD PAINTS each piece from its hidden HTML node's computed style (no second copy
   of the inks / glows to keep in step). The cost: a small painter in the cartridge (FREEFALL's line **603 of 610 KB** — FIX C left 567).
2. **The HUD is drawn at the canvas's pixel ratio** — the device's at tier 2 (an iPhone's 3×); a lower tier draws it at 2× / 1.5× with the
   picture (a second full-resolution canvas would be a layer over the canvas again).
3. **The screen-reader line** — kept: ONE visually hidden line, the floor every 10 floors + the arrivals + LAST ONE STANDING (never more
   than once a floor). The number's per-floor `aria-label` went (it was a page write every floor).
4. **The fps line (`?fps=`) is hidden while a run is on** (as `&hud=0` had it — the measure never disturbs what it measures); its summary
   comes back on the end screen as before.
5. **Stays in the page:** the 3 · 2 · 1 + the names (before the fall), the OUT card + Call the Winner (after MY fall), PAUSED, the end.
6. **The opening's dark hold** — the canvas fades in over 0.5 s at a page's first frames; the top line (in the picture now) fades with it.
7. **Short fades** (a band, a call, a callout, the card) stay layer by layer — only the number's 0.82 while WATCHING + `.ff-hud`'s fades are
   group fades (the long, visible ones).

## THE LINKS FOR BEN's iPHONE (in order — ~30 s each, a screenshot of each result)
1. https://neonspeakeasy.com/freefall-play?fps=2 — compare: **15 hitches / 75 floors** before (FIX C) and **4 / 65 with `&hud=0`**
2. https://neonspeakeasy.com/freefall-play?fps=2&look=day
3. https://neonspeakeasy.com/freefall-play?mode=match&rivals=7&fps=2 — the rail + 7 names + the callouts in a busy match
**How to read them:** link 1 near `&hud=0`'s rate (≈ 0.6 a 10 floors) = the HUD's cost is gone; still near 2.0 a 10 floors = something else
over the canvas (the console's corner buttons are the only page layer left in a run).

## SPEED (the Beelink, headless Chromium + ANGLE d3d11, 390 × 844; "4×" = CDP's CPU throttle) — NOTHING GOT SLOWER
| what | FIX D | FIX C |
| --- | --- | --- |
| `--perf` (68 rows) | 67 / 68 — 56.0–60.3 fps, p95 ≤ 17.3 ms; the red = ONE 250 ms frame (day · THE SPEAKEASY · tier 1 · 4×) | 67 / 68 — 56.2–60.2, p95 ≤ 17.4; the same red |
| `--perf8` (8 ghosts + tags) | 23 / 24 — 56.0–60.1 fps; the red the same single 250 ms frame | 23 / 24 |
| `--stutters` (the roof to the trench, 4×) | day **HITCH 0**, worst 17.0 ms · night HITCH 1 (the 250 ms frame @128) | day 0 · night 1 (@128) |
The single 250 ms frame is this machine's known headless stall (FIX A · B · C, the same spots). What FIX D saves is a PHONE's compositing
(Safari's layer tree over WebGL) — the Beelink composites in ANGLE, so Ben's links decide.

## THE TESTS (local — this pass's own fresh emulators + `serve.mjs --emu`; one suite at a time)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **2,862 / 2,862** (new: `tests/freefall-fixd.test.mjs` — 4 tests: nothing written in a fall, the last pass + uploads at bake, the keyframes = the stylesheet's, the sources + HOW TO PLAY) |
| **`freefall-play.mjs --fixd` (NEW — the zero-DOM test)** | **14 / 14** — 30 s of a solo fall (bands, BLAZE! · SMASH! · NEW BEST, the plate) + a bot match's fall (the rail, the callouts): **0 page changes over the canvas, 0 running animations**, both looks; the reader's line ≤ once a floor (5 writes / 45 floors) |
| the test page `freefall-play.mjs` | **199 / 199** (the HUD reads moved to the state hook; the LAST ONE STANDING no-break space restored) · `--f4a` **19 / 19** · `--f4b` **17 / 17** · `--fixc` **26 / 26** |
| the share cards `freefall-share.mjs` | **255 / 255** |
| `e2e-freefall` (FAST) · `e2e-freefall-match --fast` | **65 / 65** (a first run 64 / 65: a late hold chunk's timing — green on the re-run, nothing of the HUD) · **120 / 120** |
| smoke `e2e-smoke.mjs` | **28 / 28** (the pages load in Chromium + WebKit) |
| speed | above — nothing slower |
Not run: rules / `/api` (no rules or server file touched) · other games' suites (no shared file touched but `js/ui/help.js`'s FREEFALL
string — unit + smoke cover it) · THE HARBOR suite (THE LOCAL TESTING RULE — the cloud runs it on the tagged push).

## OPEN FOR BEN
0. **THE PASS's SERVERS** — its own emulators + `serve.mjs --emu` (+ the old build's `serve.mjs :5174` on a worktree for the side-by-side) —
   all STOPPED at the end, the worktree removed. Your preview server on :5190 untouched.
1. **RE-PUBLISH: NO** — no rules-file change this pass (FIX C's re-publish — `Downloads\NEON\database.rules.nov27-ff-fixc.json` — still
   stands if you have not done it).
2. **YOUR iPHONE SPEED TEST** — the three links above, ~30 s each, a screenshot of each result (compare 15 / 75 before · 4 / 65 with `&hud=0`).
3. **FREEFALL's budget line: 603 of 610 KB** (FIX C left 567 — the GL HUD's painter + atlases are 36 KB after its comments moved to the docs).
   Nothing raised. Go-live's /admin HELD list lives in /admin (not FREEFALL's line); a big FREEFALL change after go-live will need room.
4. **Go-live (your Nov 27 call, in plan.md):** the small /admin HELD list + RELEASE button for runs the anti-cheat holds.
5. **A look on your phone:** /freefall-play — a band, BLAZE!, NEW BEST (gold), THE LIGHTS ARE GOING OUT, and `?mode=match&rivals=3` (the
   rail, MIA IS OUT, LAST ONE STANDING, WATCHING) — it should look exactly as before.
