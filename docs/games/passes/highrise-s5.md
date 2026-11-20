# HIGH RISE — S5: BEN'S NOTES (THE PLACE NUMBER · 18 s · THE SHARE IMAGE · THE B1 BILLBOARD · THE EFFECTS REBUILD) (Nov 20 2026)

**No rules change** (`database.rules.json` untouched — nothing to re-publish). HIGH RISE stays HIDDEN (the owner's phone only) and
NOTHING COUNTS (`HIGHRISE_COUNTS` off). The owner's decisions: `docs/games/plan.md` "HIGH RISE — S5". The bible: `docs/highrise.md`
"THE MATCH" · "THE SHARE IMAGE" · "THE BILLBOARD" · "THE EFFECTS REBUILD".

| commit | what |
| --- | --- |
| `353933b7` | Step 0 — Ben's notes into plan.md; the Lab's marks re-exported (no open FIX mark) |
| `757742c3` | Group 1 — THE PLACE NUMBER + THE RANKED LIST IN WATCH + 18 s + THE ANNOUNCER CHECK + ZERO GARBAGE IN A MATCH |
| Group 2 | THE SHARE IMAGE |

THE ADD-ON INBOX: read at the start, after every group's commit and before the final run (see THE CLOSE).

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
