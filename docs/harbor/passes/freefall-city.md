# THE FREEFALL CITY PASS (Nov 28, 2026)

FREEFALL went live Nov 28 (6e1abe69) held OFF the city's signs. This pass installed its city side and lifted the hold, rebuilt THE END
SCREENS' shared frame + block (the owner's four Nov 27 entries), and built the small inbox items. **No rules change, no `/api` change.**
Commits: Group 0 `658e6c71` · Groups 1 + 2 `95905450` · the close (the tagged push — its tests + docs).

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change, no `/api` change).
2. **OVERCLOCK's MATCH podium with 4+ players still scrolls** (its own 2-1-3 stair + the console's results list from 4th): at 375 × 667 it
   was 402 px over with 5 players and is 294 now (the XP line's room + the stair's short-screen tightening); 2–3 players fit every size. One
   screen with 4–8 players needs OVERCLOCK's stair itself reworked (e.g. the shared block for its match, or a compact stair) — a call for
   the OVERCLOCK chat, not made here.
3. **Named calls (overrule any):** FREEFALL's day face = rose FREE + sea-cream FALL on deep petrol-teal enamel, gold leaf (cream boards were
   HIGH RISE's look) · the speakeasy blade reads FREE over FALL in ONE column (HIGH RISE's call) · ticked FRIENDS ONLY reads "FRIENDS TOP 3"
   (your words) though the window holds the whole table · the block's rows grow from 46 to at most 72 pt; room past that is shared evenly over
   the body, the block and the foot · JAYWALK's end red = `#ff3344` (the sneaker mark's) for the bar + block, `#ff4252` for the red TEXT
   (≥ 4.5 : 1 on the veil); its daily end card keeps its ticket red `#ff4058` (already red; the ticket's ink is pinned) and its pink tube
   button (THE SHELL: a main tube is pink — only an end screen's BAR takes the game's colour) · the duplicate-tab banner says the same words
   for every slot.
4. **The billboard by day** is the same picture as by night (HIGH RISE's B1 too — CITY PART 1's open call: a day variant from the games chat).
5. **Not proven on your iPhone:** the FRIENDS window's finger scroll (momentum, the fades, a new best arriving mid-scroll), the XP line's tap
   to your card, FREEFALL's signs at night + by day.

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
  6500 KB** after Group 0 (the row faces' one loop is smaller than HIGH RISE's own line was); **2.3 KB** after the whole pass (the late-proof hubs in firebase.js + room.js, the accent table).
- **Shots** (Downloads\NEON\freefall-city\sign\): `ffn` / `ffd` = Nov 29 (FREE / FALL on roof A) night + day at 390 / 402 / 430 + the zoomed
  `skyr`; `bladen` / `bladed` = Dec 29 (the speakeasy blade's FREEFALL week) at 375 × 667 / 390 / 1440 × 900. Two refine passes: (1) the day
  board's colour; (2) 375 + 1440 checked — nothing clipped, the billboard reads.

## GROUP 1 — THE END SCREENS (95905450)
THE SHARED FRAME (`ui/final.js` + `profile/callouts.js`) and THE SHARED BLOCK (`ui/end-board.js`) — one change each, every game gets it
(docs/cartridge.md "THE END-SCREEN BOARD" → THE REBUILD has the full rules):
- **THE XP LINE AS THE FOOTER:** the XP box left the podium; ONE line under SHARE · HOME (`.final-xp`, its 16 pt always kept — the foot's old
  bottom margin) — the solo line or "+42 XP · INSIDER · LEVEL 22 ›" (your card on a tap; its 44-pt tap area never past the foot — found: on a
  screen with no home indicator it made the frame scroll 10 px).
- **JAYWALK GOES RED:** `END_ACCENT` (THE CONTRACT, optional) — the frame reads it before ACCENT; JAYWALK `#ff3344` (its sneaker's red): the
  bar (dark words, 5.4 : 1), the block's tick / YOU line, the headline glow + its NEON row (the text red `#ff4252`); its share card, HUD,
  signs and logo untouched; HIGH RISE keeps its pink.
- **THE HEADER + MEDALS:** GLOBAL TOP 3 left · ☐ FRIENDS ONLY right (FRIENDS TOP 3 ticked); 1 / 2 / 3 = THE DECO MEDALS, a number from 4;
  the medal column only as wide as the medal (narrower under 375 wide — a 12-letter name whole at 360).
- **THE FRIENDS WINDOW:** the whole table in exactly three rows, scrolling inside (`overscroll-behavior: contain`), fades where rows sit, your
  row in view on open; S10's re-read waits for a lifted finger; S11 unchanged. GLOBAL TOP 3 stays three + the YOU line.
- **FILL THE SPACE:** the block grows into the frame (`container-type: size`; rows 46 → 72 pt, the medal + BEST follow); room past that shared
  evenly; 375 × 667 never scrolls.
- **THIS BOARD COUNTS ROOM MATCHES:** `END_BOARD.soloCounts: false` (OVERCLOCK QUICK, PRISM DROP SCORE RUSH) — the line in the YOU line's place.
- **Found + fixed:** THE YOU ROW's glow (z 4) painted over the sticky foot (z 3 → 5) · OVERCLOCK's match frame tightened under 760 px tall (2–3
  players on one screen at 375) · the look preview never rendered FRIENDS (YOUR TABLE's read waited on a sign-in — a fake one now; `&many=1`).
- **The proof (Downloads\NEON\freefall-city\end\):** `before\` (the pre-pass code, a worktree at 6e1abe69) + `after\` — every game ×
  solo / match × night / day × 375 × 667 / 390 / 402 / 430 / 1440 × 900 + FRIENDS ticked; `side-by-side\` = one sheet each, before over
  after. BEFORE: every MATCH podium scrolled at 375 (FREEFALL 105 px · JAYWALK 69 · HIGH RISE 44 · PRISM DROP 101 · OVERCLOCK 402), PRISM DROP's
  match at every size. AFTER: **0 px at every size, solo + match, every game** — except OVERCLOCK's match with 4+ players (OPEN FOR BEN 2).
  Two refine passes: (1) the room past 64 pt sat in one band over the foot → rows to 72 pt + the room shared evenly, the medal sized by the
  column; (2) the FRIENDS window + 360-wide names, the glow over the foot, OVERCLOCK's 3-player match.

## GROUP 2 — THE SMALL ONES (95905450)
- **THE PLAY SHELF ICON COLOURS — the cause:** `title.js`'s `ACC` table (the PLAY shelf's `--ic`) had NO key for `jaywalk` / `highrise` →
  `#d6f0ff`; PICK A GAME read a different table (`tube-logo.js#LOGO_ACC` — JAYWALK cyan there). Now ONE table, `core/marks.js#GAME_ACC` (each
  game's own `--accent`): title.js's `ACC = GAME_ACC`, room-city reads it through `ui/mark-svg.js`. FREEFALL's teal checked.
- **THE LATE PROOF CHUNK:** see docs/harbor.md "THE FREEFALL CITY PASS" — a refused proof write after the room / the match = the quiet
  `late-proof`; THE PROOF WRITER sends nothing once the phone has LEFT its room (never a kick — THE RUN HOLD). The hint: a proof refusal is now
  reported only when the phone was in that room with that match live — the case the phone's state can not explain (real lag).
- **THE DUPLICATE-TAB BANNER** (FIX PASS B's note): it was `left: 50%` + a translate — its shrink-to-fit width was HALF the screen, so its
  words wrapped one a line; now the full width inside the gutters, a 12-pt-cornered rect, its button 10-pt corners (NO PILLS), the same words
  for every slot (no slot id).
- **THE HOUSEKEEPING PASS's three carried harbor reds:** **all three were TEST bugs, now fixed (green locally):** (1) `crew` "D back in
  the lobby" — the check polled `import('/js/store.js')` from the first instant after a reload, BEFORE THE FIRST-VISIT BUNDLE's import map:
  Chrome drops the map's rule and the check read a second, empty store (the app had rejoined) → it reads `window.__arcade`; plus a clean
  `radio/crew` at its start (a stopped run left its crew in, CAP 10) — **22 / 22**. (2) the roof board's ONE face (`trionce`, 402 at 4× CPU):
  by design a slow phone waits on the base face until the pick's picture lands, then CUTS to it — that prefix is allowed; any other face after
  the pick (the H2 flicker) still fails — green; `trivision-rebuild` now expects FOUR faces (+ FREEFALL) — **4 / 4**. (3) A7 (`partyroom`):
  since S8 a profile is readable only by a player SEATED in the room — the seven fake guests are seated now — **2 / 2**.

## THE FINAL RUN
| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2877 / 0** (`freefall-city.test.mjs` new — 11) |
| smoke (+ THE PAGES LOAD) | **27 / 27** |
| `e2e-freefall` · `e2e-freefall-match` | **61 / 61** (2 block checks updated to the new header) · **123 / 123** |
| `e2e-jaywalk` · `e2e-jaywalk-match` | **123 / 123** (the bar red, FRIENDS = the whole table, the rank red) · 94 / 96 — the two KNOWN pre-existing JAYWALK fixtures (the server replay's cards + YOUR BEST — THE GO-LIVE pass logged the same two); the foot check now skips the XP line's button |
| `e2e-highrise` · `e2e-highrise-match` | **107 / 107** (FRIENDS counts = the whole table) · **35 / 35** (its first run here was red 6 checks on watch timing — green on fresh emulators) |
| `e2e-prism` · `e2e-oc-2` | **68 / 68 · 27 / 27** |
| `e2e-play-bounce` | green on fresh servers (the first run: 1 of 10 bounces at 538–672 ms > its 500 ms bound, a busy machine) |
| `e2e-profiles` | **148 / 148** |
| rules (`rules.test.mjs`) | 102 / 107 — the five KNOWN JAYWALK + HIGH RISE proof fixtures (THE GO-LIVE pass logged the same five); no rules change |
| `/api` (`server.test.mjs`) | 76 / 78 on fresh emulators — the two KNOWN JAYWALK fixtures (the same two as THE GO-LIVE pass); the /api graph imports none of this pass's changes but `harbor-trivision.js` (its radio helpers, untouched) |
| harbor groups (core, skyline, load, neon, billboard, trivision, trivision-rebuild, trionce, cartridge, gameflows, shell, crew, partyroom) | 135 / 138 → the three carried reds fixed (above) → `crew` **22 / 22** · `trivision-rebuild` + `trionce` **4 / 4** · `partyroom` **2 / 2**; THE XP LINE FITS (9 / 9 sizes × levels) |
| THE BOOT BUDGET | not raised — 306 modules, **2.3 KB left** of 6500 KB |
- The full harbor suite: the cloud's, on the tagged push (THE LOCAL TESTING RULE).

## Servers
Every server this pass started was stopped at its end by exact PID: the emulators (twice — restarted fresh for the re-runs), `serve.mjs --emu`
on :5173 (twice), the pre-pass worktree's `serve.mjs` on :5174 (+ the worktree removed).
