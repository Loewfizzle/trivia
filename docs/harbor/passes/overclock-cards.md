# OVERCLOCK CARDS — REDLINE + PHOTO FINISH (Nov 5 2026, night)

A short card pass between OVERCLOCK pass 1 (5406585) and pass 2: ONLY the two cards + their unlocks, then the owner's 10:54 pm ADD-ON (from his
iPhone after a SOLO run). **No rules change** (database.rules.json untouched — nothing to re-publish).
**NOT this pass** (Step 0's other notes — not started): the FRIENDS list (the whole XP box tappable, the reason line, the score off the podium's slim
cards, the bottom-left glass backing, DROP THE STEP, the intercom in sync, the black helicopter, cartridge.md's daily line), THE PODIUM SOUNDS (the
first city pass after OVERCLOCK), THE DISPATCHER (Sunday, Nov 8).

## Step 0
plan.md — "OWNER'S NOTES — NOV 5 (night, after CARD FIXES)" appended unchanged (part 72) + its build table line; decisions.md (the table row + the
night's decisions). aecb7fe.

## Group 1 — THE ART + THE LAYERS (5528b0c)
- **The files**: copies of Grok's `redline-master`, `redline-fx-sparks`, `redline-fx-heat`, `photofinish-master-v2`, `photofinish-fx-flash`,
  `photofinish-fx-sparks` (+ notes.txt) in `art/oc-cards/src/` (never the originals; NOT the rejected masters, NOT the ambientCG textures).
  `scripts/build-oc-cards.mjs` → `assets/vault/oc/` (7 WebPs, 308 KB): the masters converted (61 + 53 KB); the FX plates turned into LIGHT WITH ALPHA
  (alpha = the brightest channel, the colour divided out — drawn `'lighter'` they add back exactly the plate's light, so no black box can show — a CSS
  blend on the shared canvas would have blended every card on it), cropped to their light + halved.
- **Measured on the real pixels** (a headless page over the PNGs): the dial's ticks run 131° (7:30) clockwise to 49° (4:30), r ≈ 196–247; the cap at
  (897, 339); Grok's heat S-curve's RIGHT CRESCENT fits a circle at (863.5, 295.3), r 154 → scaled ×1.48 onto the dial (its bright arc on the tick ring,
  r 228) + MASKED to the red zone's ring sector (r 168 → 300, −40° → 58°, feathered) — baked, its box (1037, 165, 157 × 382). The cap cut out of the
  master as a feathered disc (r 62 → 67) so the needle pivots UNDER it. PHOTO FINISH's line at x 923, the noses at x 935, y 300 / 423 (notes.txt).
- **THE MOTION** (`js/fx/oc-cards.js`; the numbers in `js/fx/oc-specs.js`): REDLINE — the needle (a baked tapered blade, white-hot core + an
  orange-red glow) waits a beat at rest, revs up faster + faster, SLAMS past the peg (393°), bounces back into the red (376° ≈ 3:30) and SHAKES: a
  stepped judder (31 Hz + 67 Hz) from ±5.6° settling to a ±1° tremble that never stops, a rev every 6.4 s; the heat pulses with the shake (lit only
  once the needle is in the red); the sparks pour off the tip (two staggered copies drifting out, flickering, following the shake); THE BORDER LASER
  in molten orange. PHOTO FINISH — the laser line on the finish line + a bright point scanning top → bottom + back (2.8 s a pass); passing between the
  noses → the FLASH (a 250 ms bloom) + the SPARKS crackling (a 22 Hz flicker, fading over 0.55 s); a sheen sliding back along each car's trails.
  Reduced motion = the mock's frame (pegged in the red / the point between the noses, a soft flash).
- **The burst checks**: `shots-oc/pf-burst.png` (24 frames, 120 ms): the point down the line, the flash on frame 3 as it crosses, the sparks crackle +
  fade; `shots-oc/redline-sweep.png`: the needle in the red, jittering frame to frame. The sweep's own timing is a unit test (`needleAt`: rest →
  faster + faster → the slam within 0.5° of the overshoot → pegged ±9°, still shaking).
- **Bugs found + fixed on the way**: (1) `gift.js#artMap` keeps the gift art's 800-px height in its DRAWN height even when another height is passed
  (a 720-px art landed 40 px high — the cap doubled) → these cards use their own exact `ocMap`. **KNOWN**: BRUH's own strip picture (1280 × 256) goes
  through the same line — its strip layers were placed (and approved) on the current numbers, so it is LEFT as is (→ FRIENDS: check BRUH's strip
  layers against the exact map). (2) **A STILL FRAME NEVER WAITED FOR ITS IMAGES**: reduced motion draws each slot once — before the cap had loaded,
  REDLINE's still frame had no needle (the gift cards' image layers had the same gap) → `sg-kit.js#image` calls `renderer.js#fxAssetIn()` when a
  picture lands (every surface draws again; a moving surface doesn't care).
- **THE HERO BOXES + THE PLATE**: REDLINE's strip hero = the cap + the pegged needle (its tip at 0.878 — clear of the gem's corner at 0.88); its full
  card's = the cap + the needle's sweep + the red zone. The first try (the WHOLE dial) left the plate 143 px at 390 and LOEWFIZZLE broke onto two
  lines → now 204 px, one line, the plate over the dial's cold left rim (as in the owner's mock). PHOTO FINISH's full hero = the cars' fronts + the
  line (both whole cars left no room for a 10-letter name's plate; the mock lets the plate cover the trails). `heroMisses()` = [] .
- **THE REDLINE STRIP's GEM** (the owner's flag on the mock): the strip is width-bound (the art's width = the strip's), so a crop nudge can't move the
  dial off the gem → a DARK DISC behind the gem (`.vl-s-oc-redline > .vl-gem::before`, its gold light kept small in the middle). Before → after:
  `overclock-cards/redline-gem-before-after.png` (top = the standard legendary glow, the gem lost in the sparks + the red edge; bottom = the backing).
- **Wired like every card**: `api/_lib/catalog.js` (C rows: REDLINE legendary "Six for six. Pinned in the red." · PHOTO FINISH rare "Won by a nose. One
  point."), `js/vault/catalog.js` (n 182–185, strips then full cards), `js/vault/strip.js#LOOKS`, `js/fx/index.js`, `css/vault.css` (materials; PHOTO
  FINISH's glowing edges in electric blue), `vault/hero.js` + `vault/layout.js`, `api/_lib/lab-text.js` (each card's motion), the credit "Card art
  created with Grok" (xAI's terms ask for it — notes.txt). Both show in THE LAB as NEW (only approved art ships: until the owner's APPROVE they
  unlock but show as the lab says — the palette).
- **The look review**: 390 · 402 · 430 (+ a 10-letter name with FOUNDER), the lab's lobby test (8 of one, + STILL), 1440 × 900, WebKit 402 × 874 @3 —
  the shots in `overclock-cards/`.

## Group 2 — THE UNLOCKS (server-checked)
- `core/match-report.js#overclockExtra` (the room's OWN copy — never a number a phone sends), 2+ participants only (alone, "every challenge" is
  automatic): **`sweep`** = a QUICK match (`settings.mode` quick, `total` 6, all 6 results) with this player ALONE on top of every challenge (strictly
  the most points, > 0 — a tie or a challenge nobody scored = not won) → `redline` → `card-redline`; **`photo`** = the win, alone in first, by
  exactly ONE point over second (any mode) → `photo-finish` → `card-photofinish`. 32 achievements now (`GAME_ACHIEVEMENTS.overclock` = dead-on,
  overclocked, redline, photo-finish). THE REVEAL = the console's end-of-round moment on the podium (the achievement row: the card's tile + "X % of
  players have this") — nothing new in Overclock's screens, never mid-match.
- **A LIVE BUG FOUND BY THE E2E**: the counters kept a game's flag as `pa.gf['overclock.exact']` — a DOT in a database key. The emulator (and the real
  database) refuse it: the server's WHOLE transaction failed, so **any match that raised a game flag was never counted** — DEAD ON's exact Closest
  Call, PRISM DROP's four-line clear (FOUR ON THE FLOOR), and the new two. Now `gf['<game>-<flag>']` (a dash, like the board ids); nothing was ever
  stored the old way (every such write failed). A phone's queued report for such a match may now go through on its next flush. Guard:
  `tests/overclock-cards.test.mjs` "THE FLAGS ARE DATABASE-SAFE" (every key a match writes).
- **Tests**: `tests/overclock-cards.test.mjs` — sweep ✓ 6/6 alone, ✓ the fixture, ✗ 5/6, ✗ a tied challenge, ✗ a challenge nobody scored, ✗ STANDARD,
  ✗ solo, ✗ a missing challenge, ✗ second place; photo ✓ by 1 (+ QUICK), ✗ the runner-up, ✗ by 2, ✗ tied for first, ✗ solo; the achievements award the
  cards; the same match twice = skipped, a second sweep = nothing new; the wiring (the lab, the lab text, the CSS crop = the effect's, the hero boxes,
  the credit); the needle; the flags database-safe. The profile E2E (`e2e-profiles.mjs` §5b): a scripted QUICK match → REDLINE revealed on the
  podium + granted to ALICE only; a one-point win → PHOTO FINISH; a re-sent report counted once.

## ADD-ON — the after-match screen (the owner, 10:54 pm, after a SOLO run on his iPhone)
1. **THE REAL ITEM** (`progress/moment.js#itemSwatch`): the achievement / unlock rows showed a text glyph in a wide box (HOUSE WARMING's key a tiny boxed
   symbol). Now ONE square tile (56 pt): an emblem = the vault's own emblem (its shape + finish, 42 pt), a glow = your name's letters in it, a tube
   style = your sign-up shape in that tube, the flame; a card = a mini of its real art in a card-shaped tile (86 pt wide — readable unzoomed) — approved
   art only (else its palette, as everywhere). The vault's pieces load on demand: the tile shows at once, its picture a beat later. Before → after:
   `overclock-cards/moment-before-390.png` → `moment-after-390.png` (+ the tiles at 402 @3).
2. **SOLO RUN · Just you** (`placeLine`: n 1 / `solo` — + the score when the outcome carries one); any n = 1 reads "One player".
3. **A SOLO RUN NEVER HOSTS** (`core/achievements.js#noteMatch`): ho / h4 move only for a hosted match with 2+ players; nobody loses HOUSE WARMING.
   Unit: a solo match leaves ho unchanged, a 2-player one counts, a held HOUSE WARMING stays. E2E §5b: a scripted SOLO run → "SOLO RUN · Just you",
   ho unchanged, HOUSE WARMING kept. The shots: `overclock-cards/pf-oc-*.png` (the 2-player REDLINE + PHOTO FINISH screens, the SOLO run's).

## Group 3 — the end
- **Docs**: this log; docs/vault.md "OVERCLOCK CARDS"; docs/overclock.md (THE FINAL card list — REDLINE + PHOTO FINISH built, the HORSESHOE stays,
  LONG SHOT / OVERDRIVE / SOLO dropped; OC2 + OC5's lines fixed); docs/progression.md (32 achievements, the dash key, HOUSE WARMING's 2+ players);
  decisions.md; ROADMAP + roadmap-history; plan.md's build table (OVERCLOCK CARDS ✅, OVERCLOCK pass 2 next); harbor.md's index; CLAUDE.md (32).
- **THE BUSY-PC CHECK**: every suite below ran alone (the first profile-E2E run beside the unit suite had the level-up hold red — green alone).
- **The local run** (the mini PC): unit **1205 / 1205** · rules **66 / 66** (database.rules.json unchanged) · `/api` server.test **38 / 38** + lab
  **2 / 2** · the profile E2E **91 / 91** (§10: REDLINE + PHOTO FINISH revealed + granted, a re-send counted once, the SOLO run) · smoke
  `GAMES=overclock` **5 / 5** · harbor `platefit, cardfit, fullcard, progress` **36 / 36** · harbor `vault` alone **50 / 50** (its three fixed counts
  +2: 52 lab cards, 51 full cards) · THE VAULT BENCH, a lobby of 8 at 4× CPU, the GPU path: REDLINE **60 fps, 0 slow** (busy 2.7 ms) · PHOTO FINISH
  **60 fps, 0 slow** (0.5 ms). No City 2.0 (Harbor) file changed — `js/fx` + `js/vault` only, like CARD FIXES → the ci tag, the harbor groups that
  touch the cards run here. The full harbor suite was not run (no city file).
- **A NOTE ON THE LOCAL SERVER**: `scripts/serve.mjs` caches every `/api` module from its start — the :5173 server (started 2:48 pm by an earlier
  session) still answers with the old match code; the runs above used fresh servers on :5175 / :5176 (`E2E_BASE`), left running (this session
  could not stop processes). Restart :5173 before the next local run.

## Known issues
- **BRUH's strip layers** were placed on `gift.js#artMap`'s numbers, which keep the gift art's 800-px height for its 256-px strip picture → check them
  against the exact map in FRIENDS (left as approved).
- **A card's tile on the after-match screen shows its art only once the owner APPROVES it** in THE LAB (the rule for every card) — until then its
  palette. REDLINE + PHOTO FINISH are NEW in the lab.
- PHOTO FINISH's full card: with a long name the plate covers the cars' rear halves (the noses + the line stay clear — its hero); the owner's mock
  had a shorter plate.
- The game flags fix (a dash, not a dot): players who earned DEAD ON / FOUR ON THE FLOOR's flag before tonight had that match refused by the
  server; a queued report may now land, otherwise those achievements come on their next flagged match.
