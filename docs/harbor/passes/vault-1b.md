# THE VAULT 1B — SPEED FIRST, THE OWNER's FIXES, THE FULL CARDS + THE LAUNCH SET (Nov 3 2026)

Step 0 = plan.md "OWNER'S NOTES — NOV 3 (morning)" (part 55): VAULT 1A done, all 8 strips + both test emblems APPROVED in THE CARD LAB, the
owner's iPhone measured A FULL LOBBY of 8 legendaries at ~42 fps (38 scrolling, already at a soft tier 0, "0 ms" of fx time), the no-tap
UFO still firing, the picker, the name cut off, the bottom sheets, SAVED ✓, the key's SHARE line. One session, the groups in order, + the
owner's ADD-ON (THE PROGRAM shows the full day) as the last work group. The deep doc: `docs/vault.md`.

## What changed
**Group 1 — SPEED FIRST.** The cost was the 2D canvas itself: on iOS Safari a 2D canvas is rasterised by CoreGraphics ON THE CPU in its GPU
process, call by call — the page only records the calls, so `performance.now()` around the draw reads ~0 while ~900 calls a frame still
hold every frame back (a soft tier 0 couldn't help: the cost is per call, not per pixel). **THE GL PAINTER** (`js/fx/gl.js`): a 2D-context
look-alike over WebGL2 — the approved effects keep their code; their calls become triangles in one vertex batch (a draw only per blend
change), the baked sprites in ONE atlas texture, gradients as rows of a LUT (baked by a real 2D canvas — the same colours), 1-px AA
fringes (no MSAA memory), the rounded clip an SDF in the shader, any other clip the stencil. The 2D canvas stays the fallback (no WebGL2,
a lost context, `&fx=2d`, the lab's GPU DRAW switch). The top tier draws at the phone's full 3× (`fxDprGl`). **Scroll-pause**: a scroll or
a moving touch holds the effects (no redraw — the canvas is a layer; their clock pauses) until ~160 ms after. **The guard's probation**: a
step down that doesn't make frames ≥ 12 % faster is undone + the tier held 30 s. **THE DIAGNOSTICS ROW** (the lab): CSS GLOWS · EMBLEMS ·
CANVAS FX · THE LASER · UFO SPRITES · SCROLL-PAUSE · GPU DRAW, remembered per device (`vl:diag`), `&diag=` for a visit; the readout: fps,
ms/frame, slow frames a second, SCROLL-HELD, the tier (HELD), the ratio, the script's ms, GPU + draws or 2D, slots, MP. **THE VAULT
BENCH** (`tests/integration/vault-bench.mjs`): A FULL LOBBY (bare: all 8 on screen) at any CPU slowdown with each switch off in turn.
Then the GPU path's own CPU side (Group 5 found it — the tessellation): a round join only at a sharp turn, no round cap on a hairline,
curves within half a device px, THE MARQUEE's sockets baked once, frost's ~100 clip circles flattened coarse (`c.fxTol`).

**Group 2 — the owner's fixes.** THE NO-TAP SIGHTING: WebKit at 402 × 874 (touch, a returning visitor) never fires with zero input or a tap
away — every path to the photo is a real pointerdown + pointerup (or `&sgdemo`). What reaches the page on an iPhone with nobody meaning to
tap is iOS's own touch as Safari comes to the front (a tap on its card in the app switcher lands mid-screen, where a forced legendary
hovers). Now a sighting needs a TRUSTED touch that began ≥ 800 ms after the page was last shown (load · back on screen · focus), its DOWN
and its UP on the same legendary (`scene.sightAt` checks the down without firing); every sighting on a preview link sends its trace to
/admin's Errors from phones (`SIGHTING TRACE …`). THE VAULT PICKER (`js/vault/picker.js`): the profile's cards = a vertical list of the REAL
SLIM STRIPS (the player's emblem + name + LV, the calmer cut, one surface), the card's name + tier over each, WEARING ✓, tap the strip to
wear, VIEW → the full card; an unapproved card = a plain strip in its palette. THE NAME NEVER CUTS OFF (`js/ui/fit.js`): shrunk to fit,
then two BALANCED lines (WWWWWW / WWWWWW), never an ellipsis — the membership card, the strips, the full cards, the podium. EVERY BOTTOM
SHEET FLOATS (`components.css` + `js/ui/vv.js`): its whole rounded border above the safe area + whatever the visual viewport hides
(`--vv-ob`); the chat keeps its keyboard math. THE LAB: SAVED ✓ on each mark. THE KEY: "Send it to yourself — anyone with your key can use
your card." under COPY · SHARE.

**Group 3 — THE FULL CARDS** (`js/vault/full.js`): the ID-1 card (1.586 : 1, cqi), the strip's material, its effect at full scale (`opts.full`
— `kit.unit` keeps the strip's proportions; the prism + the arrow right of the plate; the UFO centred high over a lower skyline), a foil
sheen (rare +), the tier's frame, NEON SPEAKEASY (+ №) + the tier, FOUNDING MEMBER, the plate (emblem + name + BAND · LV), MEMBER SINCE +
the card's name; a SIGHTING = the whole scene + its title in neon + when it was spotted + the corner brackets + THE BORDER LASER. The lab's
FULL CARDS tab (each its own mark: `full-<card>`); shown on the profile (the card you wear, once approved), VIEW, the podium's winner (a tap).

**Group 4 — THE LAUNCH SET + NAMES ONLY TO OWNERS.** Eight new cards, the ones players meet FIRST: GILDED (everyone) · MIDNIGHT · BRASS DECO ·
HEARTBREAKER · EMERALD & BRASS · NEON GLASS · SILVER CHROME · MIDNIGHT & CHAMPAGNE (strips + full cards, three refine passes each; new
effects `hearts`, `sheen`, `tube`); SMOKE ROOM / FROSTBITE / PRISM / INFERNO unlock at levels 12 / 16 / 22 / 42. **Names only to owners**: the
catalog moved to the SERVER (`api/_lib/catalog.js` — items, the 30 achievements, what each level + milestone gives; `api/_lib/lab-text.js` —
the lab's names, admins only); the shared modules keep the logic + registries the server fills; every /api answer runs through `withShow`
(display rows for exactly the ids it holds); the client's /api wrapper registers them (+ keeps this device's own). Card names scrubbed from
the vault + effect code's comments.

**ADD-ON — THE PROGRAM SHOWS THE FULL DAY** (`radio-program.js`): every row of the day chart (a Friday ~180), ALL · RARE + LEGENDARY
(remembered — `rd:prog`), the RARE tag (a scene the timetable gives under half the nights); `tests/integration/program-preview.html`.

## Decisions
- **The GPU path is THE path** (not a look change: the GPU frame matches the approved 2D frame side by side in Chromium + WebKit); the 2D
  canvas the fallback. The top tier at the phone's full 3× (the GPU pays pixels, not calls).
- **Measured** (the mini PC, 4× CPU — the stress case; the bench now draws all 8 on screen): 8 legendaries 60 fps (0/180 slow), every card
  alone ~60, the busiest mix (THE 8 SAMPLES) 55.7; the 2D path on the same bench 31 / 23. The iPhone is the verdict: the lab's readout.
- **Scroll-pause on by default** (the brief's "a still frame while a finger scrolls"); the switch in the diagnostics row.
- **Full cards have their own lab marks** (a strip can ship before its full card).
- **The catalog's ids stay in the site** (they're the art's keys — LOOKS, CSS classes): names, lines, what unlocks what + the achievements
  are the server's. The old VAULT's finishes + glows (public since before PROGRESSION — `core/ranks.js`) stay.
- **Rare on THE PROGRAM** = a window scene the timetable gives under half the nights (its `p`), the legendaries, the raid, the holidays' big
  moments, the fireworks.

## Known issues
- **Not built this pass (the bar first — "fewer, better"):** the rest of the launch set — VELVET ROOM, AURORA, ONYX & ROSE GOLD, GOLD FOIL,
  VELVET NOIR, SAPPHIRE & SILVER, PRISM LEGEND, PLATINUM, THE HOUSE, THE 30-NIGHT FLAME, CENTURY, WILDFIRE, ETERNAL FLAME, ZEBRA, CAMO, MARBLE &
  GOLD, THE MARQUEE · GOLD BULBS, NEON CAMO, CARBON, THE WITNESS, PENTHOUSE, CONFETTI, CIRCUIT, FOUNDING MEMBER + the 8 other sighting cards
  (LIGHTS OUT, SKY KING, AFTERBURNER, THE FLYING DUTCHMAN, SKY DANCER, MAKE A WISH, HOT AIR, COLD BLOOD, FIX THE MONEY, FIX THE WORLD — each from
  the city's real baked model, at the I WANT TO BELIEVE class). Until each is built + approved its owner sees a plain strip in its palette +
  the Gilded card. → THE VAULT 1C (or folded into VAULT 2).
- **THE MARKS EXPORT is public** (ids + marks + notes) → behind the admin check before launch (THE SWITCH-OVER's list).
- **The owner's `?preview=` pages on the live site** show only the items this device has names for (the catalog is the server's).
- **The iPhone's frame rate after the GPU path is unmeasured** — the owner's readout (A FULL LOBBY → 8 LEGENDARIES, then THE 8 SAMPLES).
- The no-tap cause on his phone is inferred (WebKit can't reproduce iOS's app-switch touch); the trace in /admin will name it if it recurs.

## Hand-off to VAULT 2 (emblems + name glows)
The picker's rows are the pattern for emblems + glows; THE EFFECT LIBRARY on the GPU path takes emblem finishes as slots on the same
surface; every new card / emblem: its row in `api/_lib/catalog.js` + `lab-text.js` + its LOOK + the lab; read `docs/vault-lab-marks.md` first.

## Tests (this pass)
unit (+ `tests/vault-names.test.mjs` — no catalog in the shipped code, the shared modules alone hold one item, withShow) · `/api`: server,
progression (+ NAMES ONLY TO OWNERS on `me`), sightings, lab · rules (the file unchanged — no re-publish) · the profile E2E (the picker) ·
smoke · the harbor `vault` group (21: the GPU path at the full tier, scroll-pause + diagnostics, the full cards + SAVED ✓, the picker + the
name, the floating sheet, THE PROGRAM, the no-tap sighting in WebKit) · the full harbor suite (see below).

## THE FULL LOCAL RUN (the mini PC, Nov 3)
unit 1076/1076 (incl. vault-names 3) · rules 58/58 (the rules FILE unchanged — no re-publish) · /api: server 29/29, progression 10/10 (+ NAMES ONLY
TO OWNERS on me), sightings 4/4, lab 2/2 · smoke 6/6 · the profile E2E 75/75 (the picker's strips; the board-order check passes on the
re-run, as in 1A) · THE FULL HARBOR SUITE 917/921 at 4 shards (~21.5 min): THE SEQUENCE's pair names (the &sgdemo preview gets them from
/api/admin now — fixed, the sightings group 10/10), THE RESIZE + THE DANCERS' ARMS green alone (desktop 12/12, motion 7/7 — side-load
timing), LOAD WEATHER's holiday-night jump the existing failure 1A logged (it fails on the pre-1A build too); the vault group 21/21.
