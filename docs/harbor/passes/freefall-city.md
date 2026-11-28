# THE FREEFALL CITY PASS (Nov 28, 2026)

FREEFALL went live Nov 28 (6e1abe69) held OFF the city's signs. This pass installed its city side and lifted the hold, rebuilt THE END
SCREENS' shared frame + block (the owner's four Nov 27 entries), and built the small inbox items. **No rules change, no `/api` change.**
Commits: Group 0 `658e6c71` · Group 1 + 2 `@G1` · the close `@CLOSE` (the tagged push).

## OPEN FOR BEN
@OPEN

## GROUP 0 — FREEFALL IN THE CITY (658e6c71)
- **THE ROOF SIGN:** FREE / FALL stacked (`harbor-neon.js#SIGN_SPLIT.freefall`) — FREE hot pink `#ff4fa8` (`signs.js#SIGN_ACC` — was the teal:
  a two-tone name's FIRST word is SIGN_ACC, HIGH RISE's pattern), FALL electric teal `#27e0e6` (`SIGN_ACC2`). The roof signs only stack; no mark
  on a stacked roof sign (the glance test's letters).
- **THE SPEAKEASY BLADE:** FREE over FALL in ONE column with a gap (`speakeasy-blade.js#BLADE_COLUMN` + `BLADE_AS` — FREEFALL's name has no
  space, so the column reads it as 'FREE FALL'; workers.js's day repaint reads the same `bladeLetters`). Never the hotel blade (8 letters).
- **ITS DAY FACE (THE DAY PAINT):** FREE faded rose `[246,176,200]` + FALL sea-cream `[226,242,234]` on a deep petrol-teal board `[14,64,90]`,
  gold leaf. Refine 1: the first board `[16,70,80]` sat close to HOLD'EM's felt-green blade beside it — bluer; FALL a touch aqua.
- **THE MARK'S OWN WIDTHS:** every city mark painter reads `t.w` (`markTubes` → `k`; the icon / vbox / roof marks, the day paint, the poster
  painter) — FREEFALL's core flame is drawn thin, never fat; HIGH RISE's `w 4.5` marks follow too. `t.o` in marks.js is the DAY OUTLINE colour
  (`ui/mark-svg.js`, FREEFALL's ball) — not an opacity as the prompt guessed; the city's day paint keylines every stroke already.
- **THE BILLBOARD:** the tri-vision's ROW FACES (`ROW_FACES = ['freefall', 'highrise']` — HIGH RISE's "lit by its GAMES row" made ONE path):
  FREEFALL's OPEN NOW poster (`assets/city/freefall/billboard.webp`, drawn WHOLE by the lazy `screens/harbor/freefall-art.js`), the rotation
  FREEFALL → HIGH RISE → JAYWALK → HOLD'EM, the board OPENS on FREEFALL (the newest go-live). `tests/freefall-billboard.test.mjs` has its city
  line (exactly ONE city file draws it).
- **THE HOLD LIFTED:** `SIGN_HOLD = []`; the pinned tests flipped (harbor.test "THE SIGN HOLD", city-b-signs, highrise-golive,
  highrise-cartridge's regex already took `[]`, freefall-golive GROUP 1, city-b-drop, city-d-drop, city-part1-signs, highrise-s5).
- **SIX NAMES ON FOUR SIGNS — a rotation bug found by the flip:** the week's rotation stepped `d × 3 mod 6` → 0 · 3 · 0 · 3 (six names, three
  phone spots): OVERCLOCK sat out a whole week (city-b-signs' "every one up each week"). It now steps one more at each wrap. NEVER A GAME
  TWICE + NO NAMED SIGN EVER DARK + the hotel blade's PRISM / HOLDEM hold over a simulated year at 390 / 402 / 430.
- **THE BOOT BUDGET:** NOT raised. The passes since F5A had trimmed it to 5.3 KB of room; this pass's boot growth ~1.3 KB → **4.0 KB left of
  6500 KB** (the row faces' one loop is smaller than HIGH RISE's own line was).
- **Shots** (Downloads\NEON\freefall-city\sign\): `ffn` / `ffd` = Nov 29 (FREE / FALL on roof A) night + day at 390 / 402 / 430 + the zoomed
  `skyr`; `bladen` / `bladed` = Dec 29 (the speakeasy blade's FREEFALL week) at 375 × 667 / 390 / 1440 × 900. Two refine passes: (1) the day
  board's colour; (2) 375 + 1440 checked — nothing clipped, the billboard reads.

## GROUP 1 — THE END SCREENS (@G1)
@G1BODY

## GROUP 2 — THE SMALL ONES (@G1)
- **THE PLAY SHELF ICON COLOURS — the cause:** `title.js`'s `ACC` table (the PLAY shelf's `--ic`) had NO key for `jaywalk` / `highrise` →
  `#d6f0ff`; PICK A GAME read a different table (`tube-logo.js#LOGO_ACC` — JAYWALK cyan there). Now ONE table, `core/marks.js#GAME_ACC` (each
  game's own `--accent`): title.js's `ACC = GAME_ACC`, room-city reads it through `ui/mark-svg.js`. FREEFALL's teal checked.
- **THE LATE PROOF CHUNK:** see docs/harbor.md "THE FREEFALL CITY PASS" — a refused proof write after the room / the match = the quiet
  `late-proof`; THE PROOF WRITER sends nothing once the phone has LEFT its room (never a kick — THE RUN HOLD). The hint: a proof refusal is now
  reported only when the phone was in that room with that match live — the case the phone's state can not explain (real lag).
- **THE DUPLICATE-TAB BANNER** (FIX PASS B's note): it was `left: 50%` + a translate — its shrink-to-fit width was HALF the screen, so its
  words wrapped one a line; now the full width inside the gutters, a 12-pt-cornered rect, its button 10-pt corners (NO PILLS), the same words
  for every slot (no slot id).
- **THE HOUSEKEEPING PASS's three carried harbor reds:** @REDS

## THE FINAL RUN
@RUN

## Servers
@SERVERS
