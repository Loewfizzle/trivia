# THE BTC CARD — the ₿ balloon card's premium art + THE BURNER FLARE (Nov 8–9 2026, late night)

A short vault pass after CITY FIXES + HOLD'EM, before BOARD 2.0 A. **ONLY** the card `card-sg-btc` (its art + its motion) + proving its unlock —
nothing else from the notes was started. **No rules change** (database.rules.json untouched — nothing to re-publish). No City 2.0 (Harbor) file
changed: `js/fx`, `js/vault`, `css/vault.css`, `api/_lib/lab-text.js`, `js/ui/credits.js` + tests → the ci tag.
The card keeps its id, its name, its LEGENDARY tier, its line ("The ₿ balloon. Tick tock, next block.") and its matched emblem `emb-sg-btc` —
only its ART + MOTION changed (it was drawn from the city's own balloon model — `js/fx/sg-balloons.js#btc`, still registered as `sgBtc`, unused).
The approved look: [btc-card/mock-btc-v1.png](btc-card/mock-btc-v1.png) (LEFT burner off, RIGHT burner on).

## Step 0
plan.md — "OWNER'S NOTES — NOV 8 (night)" appended unchanged (part 80) + the build table line; decisions.md (the current line, THE BTC CARD row,
BOARD 2.0 split into A + B, the roof board's 15 % KEPT). a3fe05f8.

## Group 1 — THE ART + THE LAYERS (3029ff08)
- **The files**: copies of Grok's `card-btc-backup.png` (THE MASTER — the untouched composition, the bigger balloon; NOT `card-btc.png`: shrunk onto
  an extended sky with a box seam), `card-btc-fx-glow.png`, `card-btc-fx-coins.png` + `notes.txt` in `art/btc-card/src/` (never the originals).
  `scripts/build-btc-card.mjs` → `assets/vault/btc/` (11 WebPs, ≈ 233 KB; the master itself 52 KB, 1280 × 720 like the other full cards' art).
- **Measured on the real pixels** (the bake prints them; `js/fx/btc-specs.js` holds them): the envelope x 754 → 1075 (59 → 84 %), y 77 → 481
  (11 → 67 %), its centre 71.5 % across; the ₿ 870–961 × 182–312 (its centre 34 % down); the burner's flame (911, 438) (63 % down — the master's
  brightest point under the mouth); the basket 870–959 × 489–543; FIVE coins (706.5, 305.5 r 24.5) · (760.5, 382.5 r 24.5) · (1027, 425.5 r 22.5) ·
  (1072.5, 376.5 r 23.5) · (1108.5, 312.5 r 23.5); Grok's glow plate's hot core (917, 494.4) — 56 px below the real burner (notes.txt's own
  miss), so the effect moves it onto (911, 440); Grok's "coins" plate holds NO coins — coin-edge glints (crescents) + star sparks (kept above the
  skyline: masked off below y 520).
- **The layers** (each LIGHT WITH ALPHA where it is light — alpha = the brightest channel, the colour divided out):
  - `btc` the master = the card's MATERIAL (`css/vault.css .vl-s-sg-btc`); `btc-clean` = the master with the balloon + the coins FILLED IN (a
    push-pull fill from the sky around them + a little grain) — the effect's opaque BASE;
  - `btc-balloon` = THE BALLOON CUT OUT: the envelope (its colour mask — loose, the shaded left is a deep red-orange — the blob from a seed, then
    filled ROW BY ROW between its outline, the outline smoothed over 7 rows) + the rigging (ropes, burner, basket — only the pixels that differ
    from the sky estimate, so the real clouds between the ropes stay in the base);
  - `btc-lit` = THE FLARE's inside light — the envelope's own shape, hottest at the mouth (an ellipse 190 × 370 round it), fading up the panels,
    the gores' own light kept (a seam stays darker); `btc-mark` = the ₿ + a soft gold glow; `btc-sheen` = the ₿ alone; `btc-bloom` = the
    envelope's outline blurred wide (a quarter size); `btc-coins` = the five coins (56-px cells); `btc-flame` + `btc-glints` = Grok's plates
    (halved); `btc-water` = the bright part of the harbor's reflections.
- **THE CARD LAYOUT**: the full card is laid out like every other full card (the mock — the top line, the plate mid-left, MEMBER SINCE + the
  printed name at the foot), not the sighting layout (`vault/full.js#ART_SIGHTINGS`); its HERO = the balloon (envelope + rigging + basket,
  `heroFull` [750, 74, 330, 470]) — the plate, the top line + the foot never on it (`vault/layout.js`); the name zone (left ~47 %) + the foot
  darkened as the mock does (the CSS material's gradients + the same ones drawn by the effect over its base), THE CARD TEXT STANDARD's wash on top.
  At 390 a 12-letter name takes two lines on the full card (the plate stops before the balloon); one line at 402 / 430.
- **THE SLIM STRIP — its OWN band** (`strip: [50, 29.3]` = art y 144 → 374, 20 → 52 %): the ₿ + the coins, no harbor; the envelope's centre
  0.715 across (inside HERO_BAND 0.60–0.84 — the owner's brief: ≥ 0.60; the mock's own spot; the strip is width-bound, so the art is not zoomed
  out — a zoom would leave a hard edge on the purple sky); the plate capped before it (`strip.js#heroRoom`), the gem corner clear (the coins fade
  there). `'W'.repeat(12)` goes to two lines, MAXIMILIANOS one, both whole.
- **Wired**: `js/fx/index.js` (`btcCard`), `vault/strip.js#LOOKS` (fx `btcCard`), `vault/hero.js` + `vault/layout.js` (the hero boxes from
  btc-specs.js), `css/vault.css` (the material, its dark = the night sky's violet), `vault/catalog.js#LAB_V` (card + full card → 2),
  `api/_lib/lab-text.js` (LAB_CHANGES "new premium art + the burner flare", both motion lines), the credit "Card art created with Grok"
  (`ui/credits.js` — titled "The ₿ balloon card", never the item's name: `tests/vault-names.test.mjs`). THE LAB shows it CHANGED.

## Group 2 — THE MOTION (1a6aa6b5) — `js/fx/btc-card.js`, on the shared surface, transform + opacity, the full card AND the strip
1. **THE FLARE** (the owner's must): a seeded 30-s loop of burns (`btc-specs.js#BURNS` — 0.6–1.2 s each, gaps 1.6–2.9 s, never the same twice in a
   row); on each burn the whole envelope lights up from inside (`btc-lit`), the ₿ blazes (`btc-mark`), a soft bloom round the envelope + the
   burner's light in the air round the mouth, the flame flares (Grok's glow plate ON THE REAL BURNER + a white-hot core), the harbor water catches
   the flicker (a warm column + its glint on the water — the full card). Off a burn = the master as it is. A lobby's strips burn apart (by seed).
2. **THE BLOCK RING**: every 10 s a BLOCK burn — a gold ring pulses out from the ₿ (60 → 530 art px over 2.2 s) with the ₿'s pulse.
3. **THE COINS**: the five coins rise slowly past the balloon (210 art px over 13–17 s each, fading in + out), spinning (a scaleX flip — the gold
   rim edge-on, the back mirrored) with a glint when they face you; Grok's glints drift up + twinkle round them (two crossfaded copies).
4. **THE SWAY**: a SEPARATED balloon layer (the cut-out over the clean base — clean, nothing tears): it bobs ±4–6 art px + sways ±1° round the
   envelope's middle; its light, the ₿, the flame + the ring move with it.
5. **THE SHEEN**: every ~7.3 s a soft gold band slides across the ₿ (12 slices of the ₿'s own pixels — it never leaves the letter); the harbor's
   reflections shimmer in six slices (opacity only).
6. **THE REVEAL** (a full card — the podium's / the sighting's scene / the profile's): the balloon RISES into the card (from 300 art px below,
   1.9 s, eased) then a BIG first burn (+ the ring) lights the card; the burns follow in a quiet stretch.
- THE PROMINENCE RULE: legendary → the strip + the full card keep the emblem + name glow still (unchanged code). THE BORDER LASER in Bitcoin gold.
  Reduced motion = THE LIT FRAME (mid-burn, the ring round the envelope — the mock's right): `btc-card/still-402x620.png`.
- **Fixed on the way**: (1) **light on a transparent canvas** — 'lighter' adds fully only over an opaque canvas pixel; over the old feathered
  patch the glow added, outside it a little less → two dark FINS beside the basket (found by diffing the frame with + without the effect). Now the
  effect draws the clean master as its opaque base under everything (+ the full card's two darkening gradients), so every light adds the same.
  (2) **THE ATLAS** — a 560 × 540 patch on top of the base overflowed the GL painter's shared 2048² atlas in a lobby of the 8 sighting cards (it
  refilled every few frames: 36 fps, p95 100 ms on the software canvas) → one clean 1280 × 720 base (an external texture) — 57.8 fps.
  (3) The coins + their glints grouped by blend (a blend change flushes the GPU batch). (4) The bloom after the balloon (under it, the rigging's
  sky edges stayed un-bloomed).
- **THE UNLOCK — no change, PROVED** (`tests/integration/sightings.test.mjs` "THE ₿ BALLOON", on the emulators through `/api/profile` sighting):
  the balloon scheduler replayed at the place finds a flight with a ₿ (`bitcoin` / `btc-orange`) → a tap then grants `card-sg-btc` + `emb-sg-btc`
  (counted, first, X% = 1); the same balloon again = a reaction, nothing granted; a ₿ balloon on another day = counted, the card NOT granted twice;
  a tap while only a flight WITHOUT a ₿ is up → `not_on_screen`, no card.
- **The speed** (the mini PC, 402 × 874 @3, 4× CPU, the real compositor): the full card + a strip **59.5 fps** (median 16.7 ms, 2/240 slow); THE
  VAULT BENCH 8 of the strips **60.0** (GPU) / **60.0** (software canvas); a lobby of THE 8 SIGHTING CARDS **55 fps GPU** (median 16.8 ms; the old
  scene 57–58) / **57.8 software** (the old 56.3).
- **The shots** (`btc-card/`): `full-strip-390x520` · `-402x520` · `-430x540` (@3, MAXIMILIANOS LV 100) · `full-strip-wk-402x874` (WebKit @3) ·
  `full-strip-1440x900` · `strip-12w-390/402/430x200` (W × 12) · `still-402x620` (reduced motion = the lit frame) · `burst-402x874-strip` (11 s:
  the rise, the big burn + the ring, burner off, a burn, the block burn + its ring).

## Group 3 — the end
- Docs: this log; docs/vault.md "THE BTC CARD"; decisions.md; ROADMAP.md + roadmap-history; plan.md's build table (THE BTC CARD ✅, BOARD 2.0 A
  next); harbor.md's pass index.
- THE BUSY-PC CHECK: CPU 3 % average over 24 s before the runs (nothing else busy); every suite below ran alone.
- **The local run** (the mini PC, fresh emulators + `serve.mjs --emu`): unit **1402 / 1402** (+ `tests/btc-card.test.mjs` 5) · rules **69 / 69**
  (database.rules.json unchanged) · `/api` server.test **42 / 42** · sightings.test **5 / 5** (the new ₿ balloon unlock) · smoke `GAMES=overclock`
  **5 / 5** · harbor `platefit, cardfit, stripfit, fullcard, progress, sightings` **49 / 49** · harbor `vault` alone **58 / 58** (its lab counts +1:
  16 CHANGED rows, 28 NEED YOU; THE 8 SIGHTING CARDS 55.7 fps, median 16.7 ms). No City 2.0 file changed → the ci tag; the full harbor suite not run.
- The cloud run: below.

## Known issues
- **A lobby of the 8 sighting cards** at 4× CPU on the GPU path: 55 fps vs 57–58 with the old scene (the vault group's bar is ≥ 54 + a median
  ≤ 18 ms — passing; the card alone or beside a full card holds 60).
- The filled-in sky behind the balloon keeps a soft warm column where the master's halo was — visible only while the balloon rises in (≈ 2 s).
- The full card no longer prints the sighting's title + spot line (the standard layout of the approved mock).
- At 390, a 12-letter name wraps to two lines on the full card (the plate stops before the balloon).
