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
