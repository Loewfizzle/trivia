# PD-1 — THE BOARD's TOP (Group 0) + PRISM DROP: THE MAX BOARD + THE SLAM BUTTON (Nov 9 2026, evening)

The first of PRISM DROP's rework passes (the owner's plan: docs/games/plan.md "PRISM DROP — THE REWORK PLAN"). Layout + controls ONLY: PRISM's
pieces + worlds keep TODAY's look (PD-3 night / PD-4 day replace it), the battle rules are unchanged (PD-2). **No rules change**
(database.rules.json untouched — nothing to re-publish). **Still 8 functions** (the friends answer's `wx` changed inside the existing action).

## Step 0
914a2366 — docs/harbor/plan.md "PD-1 GROUP 0 — THE BOARD's TOP + BOARD 2.0 B's two leftovers" + docs/games/plan.md "PRISM DROP — THE REWORK PLAN"
(the owner's decisions, Nov 1–9) + "PD-1 — LAYOUT + CONTROLS", appended unchanged.

## Group 0 — THE BOARD's TOP + B's two leftovers (de221827)
The owner's iPhone 390 screenshot. Before → after: `pd-1/board-before-*.jpg` → `pd-1/board-after-*.jpg` (390 / 402 / 430 / 1440, through
`board-preview.html`, which now draws the shared ☰ + music pair as the app does — `&nocorners` leaves them out).
- **THE TOP BAR** = ☰ · ‹ · the music, nothing else: the gold emblem / LV button beside ‹ (it opened YOUR CARD) is gone (`board/view.js` — the
  public page's pad stays). THE BOARD's title on its own row, 12 pt of air under the corner row (8 on a short phone).
- **THE TABS**: four equal tabs (`width: 100%` of four equal grid columns, the same 1 px border on and off — the selected one changes colour + fill
  only), the panel's gutter; the letter-spacing shrinks with the width (`clamp(0.02em, …, 0.08em)`), never a wrap — PRISM DROP fits at 390.
- **NO DOUBLE "YOU"**: the pinned row at the panel's foot shows ONLY while your own card is NOT on screen in the list — one IntersectionObserver
  on your row (`view.js#watchMine`, the list's scroller its root, ≥ 60 % in view = on screen → `.bd-me[data-inlist='1']` hidden). Stable both ways
  (hiding the foot only grows the list's view). `pd-1/board-after-390x844.jpg` (you 3rd: no foot) · `board-after-me14-390x844.jpg` (you 14th: the foot).
- **THE HIDDEN FRIEND**: a friend who opted out of the public boards (`profiles/{pid}/h`) gets `wx: null` in the friends answer (`api/_lib/friends.js`)
  → no XP line under their card, sorted as 0 (`friends-ui.js`); only they see their own number. Proof: server.test (BOARD 2.0 A's test + the case).
- **THE PLAYER PAGE**: its backdrop is OPAQUE (`css/player.css` — a near-black plum radial) — the list behind no longer shows through.

## Group 1 — the split (58faad2b)
`view.js` (1,096 lines) → `layout.js` (the sizes — PURE) + `victory.js` (the podium); no behaviour change: e2e-prism FAST 18 / 18. The preload graph
regenerated (`js/games/preload-graph.js`). Group 2 then added `rail.js` (THE SLIM RAIL) and rebuilt `layout.js`'s numbers.

## Group 2 — THE MAX BOARD (85b6ff93)
- `layout.js#prismLayout` (PURE — `tests/prism-layout.test.mjs`): the corner row 52 pt under the safe area, then THE FIELD centred:
  `[12][THE BOARD 10 × 20][8][THE RAIL 34][12]`; the cell = the width's, checked against the height (20 rows always fit), snapped to the device's
  pixels: **32.33 pt at 390 · 33.33 at 402 · 36.33 at 430** (was ~25); spare height centres it (~32 pt above + below at 390). The view reads the
  safe areas once per layout (`.pd-ui`'s resolved paddings) — never in the frame loop.
- **THE TOP LINE** between ☰ and the music (`var(--cb-room)` both sides): `BATTLE · 5 LEFT` / `SCORE RUSH · <score>` + the world's name (SCORE RUSH:
  `2:17 LEFT ·` first); its size computed from the text's length + the room (no measuring), never wrapping. An announcement takes the line.
- **HOLD + NEXT** inside the board's top corners (HOLD 2 × 1.6 cells · NEXT 4.5 × 1.6, three pieces) as slim see-through glass; a piece or the stack
  under one (`panelCells`) → it fades to 0.3. `pd-1/prism-under-390.jpg`.
- **THE SLIM RAIL** (`rail.js`): a 54 pt tile per opponent (shrinks to fit 7): colour stripe + border, initial, the stack as a fill (red edge from
  65 %), KO, a white outline flash when your attack lands (`rail.hit` — the attack's ring now rises from that tile), the target's ring, a red notch on
  whoever is hitting you; SCORE RUSH in score order with ranks; a FINAL DUEL's one tile shows their board. The side columns (badges · TARGET · the
  stats) + the mini-board row are gone (their data stays in the game state).
- **3×**: `board.js` draws at the full device pixel ratio (the cap of 2 lifted — the pieces + minis too); the tiers step the BOARD to 2× / 1.5×;
  the world + the shards keep their own reduced resolution.
- The countdown card + numbers sit over the board, not the screen's centre.

## Group 3 — THE SLAM BUTTON (85b6ff93)
A glossy RED PUSH BUTTON (40 pt at the default button size, a 52 pt tap area) at the rail's foot, leaning OUT into the screen margin (≥ 5 pt from
the board): a chrome bezel (light top → dark bottom) + a dark groove, a red dome (bright top-left → deep red), a gloss, SLAM in white (Chakra Petch
700 — Orbitron didn't fit the dome); the press sinks + darkens it (`.is-down`), the release flashes (`.is-flash`); the hard drop's sound. transform +
opacity only; nothing like a shell DANGER tube. LEFT (Settings → SLAM BUTTON) mirrors the rail + SLAM (the junk meter moves to the board's right).
THE BUTTONS scheme: the board shrinks to fit the button bar (27.67 pt at 390), no SLAM. The gestures unchanged (e2e: every GESTURE check as before
+ a tap on SLAM hard-drops). `pd-1/prism-slam-crop.jpg` · `prism-slam-down-crop.jpg` · `prism-slam-left-crop.jpg` · `prism-buttons-390.jpg`.

## Group 4 — THE CONSOLE'S PODIUM + THE PRELOAD (85b6ff93)
- `index.js` exports `finalScene` (`victory.js`): THE WINNING BOARD (the winner's last published board, frozen — `drawMini`) + one line (BATTLE:
  "3 KNOCKOUTS · 31 LINES SENT"; SCORE RUSH: points · lines · the best combo), then the TOP 3 as the console's slim cards (`leaderboard()`); a name
  with a profile opens THE PLAYER PAGE. The frame (WINNER, BACK TO THE ROOM, the XP box, the list from 4th, the console's sting) is the console's;
  PRISM's BATTLE REPORT table is gone. `ACCENT = '#8fd8ff'` (meta.js). `pd-1/prism-final-390.jpg`.
- THE BOARD's PRISM DROP tab: `match-report.js` / `boards.js` untouched (the results the server reads are the same fields).
- `preload()`: the manifest + the first song's analysis (~5 KB; a room's first match all five, ~25 KB) — far under 1.5 MB. The worlds are shaders in
  code (in the preloaded module graph: 29 modules, 213 KB). **For PD-5:** the song FILE (1.8–3.2 MB) is fetched whole + decoded before it plays —
  the match never waits (the server clock runs everything), but on a slow line the first seconds are silent; a slice-first start would fix it.

## Group 5 — THE LOOK REVIEW
`prism-preview.html` now mounts the REAL view through the fake database (scripted states: `&n=1..7 &state=play|count|ko|duel|final|spec &rush=1
&scheme=buttons &slam=left &under=1 &down=1 &hit=1 &st=&sb=`); `prism-shots.mjs` shoots every state at 390 / 402 / 430 with each phone's real
safe areas + the frame timing. Three rounds, looked at:
1. SLAM's label overflowed its dome; the 40 pt button poked 3 pt past the 34 pt rail and touched the board's glass in LEFT; the podium shot caught
   the frame mid-entrance; the preview gave the store no live boards (the winning board missing).
2. SLAM's label in Chakra Petch; SLAM leans out into the margin; the corner fade 0.2 → 0.3 (the NEXT pieces stay readable under a new piece); the
   body's "LAST ONE STANDING" repeated the frame's line → "THE WINNING BOARD", "3 KOS" → "3 KNOCKOUTS"; the countdown card spilled onto the rail.
3. The count over the board; every state clean at the three widths (`pd-1/prism-sheet-390.jpg`, `prism-sheet-430.jpg`) + 1440 × 900 (the phone
   column — the same layout, nothing desktop-only: `prism-play5-1440.jpg`).
Still the old look on purpose: the worlds are bright behind the board (PD-3 calms them); spectating + Call the Winner as before (PD-2).

**The frame rate** (prism-shots.mjs: 390 × 844 @3, 7 opponents, a bot playing, 4× CPU, GPU) — the new view vs the view before PD-1 on the same page
(a worktree on :5174): **60 fps at every tier both (p50 16.7 / p95 16.8 ms); the new one at 1.7 ms of CPU a frame** with the board at 97 device px a
cell. No slower.

## Tests
All on the mini PC, on the emulators:
- unit `node --test tests/*.test.mjs` **1443 / 1443** (+ `tests/prism-layout.test.mjs` — the layout at 390 / 402 / 430 / 375 / 412, the buttons
  scheme, 7 tiles, the tiers, the corner zones); the cartridge + preload-graph tests green (the graph regenerated).
- `/api` server.test **44 / 44** (+ the hidden friend's `wx: null`, a shown friend keeps theirs).
- `e2e-prism` FAST **23 / 23** (+ LAYOUT: board + rail, SLAM clear of the board, HOLD / NEXT inside the board, LEFT mirrors; a tap on SLAM hard-drops;
  the podium = the frame + PRISM's body + the accent) · the FULL 8-phone run **48 / 48** (every GESTURE check unchanged; 7 tiles on the rail).
- smoke **6 / 6** (both playable games; none of the ten hidden ones starts).
- `e2e-profiles` **134 / 134** on fresh emulators (THE BOARD's floor, the pinned row's rank, THE PLAYER PAGE from a board row). A first run
  showed 133 / 134: the player-page check taps the FIRST other row and expects BOB — my own server.test run had just left its rows (UALL1 …) on the
  same emulator; clean emulators → green. (Worth knowing: run e2e-profiles before server.test, or on fresh emulators.)
- harbor `ONLY=corners,playercard,youpage,shell` **25 / 25** · `vault` **58 / 58** (alone — a serial group) · `cartridge,gameflows` **7 / 7**
  (THE CARTRIDGE PLUG: prism meets the contract with finalScene + ACCENT + preload).
- Rules: unchanged (no rules test needed). The full harbor suite: not run (no city change — a game pass, the ci tag).

## Servers
Started fresh: the emulators (database + auth) + `scripts/serve.mjs --emu` on :5173 (+ a worktree's serve on :5174 for the A/B, stopped after it);
the owner's preview server on :5190 was left running. All stopped at the end (the Java database emulator + the emulators' node + serve.mjs); the emulators were restarted once mid-pass for clean data.
