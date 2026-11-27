# FREEFALL — PASS F5B: THE FIXES + THE WATER SWAP + THE SHARED END SCREENS (Nov 27 2026)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F5B (approved Nov 27)". The design notes: `docs/freefall.md` "F5B — THE FIXES + THE
WATER SWAP + THE SHARED END SCREENS"; the shared block: `docs/cartridge.md` "THE END-SCREEN BOARD". FREEFALL stays HIDDEN (`playable`
false), THE SWITCH stays OFF. **No rules-file change — nothing to re-publish.** The boot budget untouched (83 B left, measured).
Shots: `Downloads\NEON\freefall-f5b\` (share\, banners\, crown\, water\, end\, others-unchanged\, mark\, e2e\).

## THE GROUPS

| group | commit | what |
| --- | --- | --- |
| Step 0 | 34859841 | the decisions in docs/games/plan.md (+ the lab export: no open FIX marks) |
| 0 — THE FIXES | 2cdf194e | SHARE = the picture only · the banners proven · the mark through the floor · the gold card · floors 40 + 120 no red · no "0 BLAZES" + one bottom wording · the crown · the water hitches · the inbox's add-on (the smudge, the deep's lamps, the stump) |
| 1 — THE WATER SWAP | 688a9f3f | night under = the day's water in night inks · day above = ocean blue + NIGHT's streaks + glints + crests |
| 2 — THE END SCREENS | (the close) | `js/ui/end-board.js` (shared, opt-in: END_BOARD) + FREEFALL's FINAL SHAPE (solo + match), no WOULD COUNT line, nothing scrolls |

## GROUP 0 — THE FIXES (how each was found + judged)
1. **SHARE (the owner's iPhone: a TEXT + a link card, no picture).** The text "I fell 10 floors in FREEFALL" is the TEST PAGE's own SHARE
   (`stage.js#sharePage` handed `{ title, text, url }` — it never had a picture); the cartridge's uploaded the card AT THE TAP (`prepShare`'s
   `onTap` upload — a network wait, then the share sheet: iOS refuses it then and the card fell back). Not F5A's staged frame (the frame is
   taken before the end card shows: END_HOLD_MS > every SHOT_AT). Now `card.js` (the drawing) + `send.js` (THE PAYLOAD = `{ files: [png] }`,
   `navigator.share` in the tap's own turn, the picture shown to save when files can't be shared) on both; the cartridge's footer calls the
   loaded module directly (`final.js#shareNow`). Proof: `tests/freefall-share.test.mjs` (the real `send.js`, a stub sheet: keys `files`,
   one `image/png`, called synchronously) + `freefall-share.mjs` (the cartridge's + the test page's SHARE in Chromium: 1080 × 1350, keys
   `files`, in the tap's turn, 0 calls to /api). The test page's module graph gains `card.js` + `send.js` (lazy) + the share kit's DRAWING
   (`kit/share-run.js` → `daily/share.js` → `config.js`'s data) — `tests/freefall-play.test.mjs` names that branch and proves it asks no server.
2. **THE BANNERS:** in code every area's band was ALREADY floor 120's (one rule, one box, one 1.6 s — shots `banners\before\sheet-*.png`: the
   same place in all five). A browser check now pins it. If the phone still shows a difference, it is not the band (OPEN FOR BEN 3).
3. **THE MARK:** the floor raised to the ball's middle, re-centred; the tile re-centred (`mark\`).
4. **THE GOLD CARD:** `share\before` → `share\after2` (360 px: the ball, a tight gold ring, the sand; night + day).
5. **FLOORS 40 + 120:** `gen.blind` — 2,400 towers, the rest bit for bit (`tests/freefall-tower.test.mjs`); F1's digest kept on the row without it.
6. **"0 BLAZES" + the wording:** END_WORDS.made = YOU HIT THE BOTTOM everywhere.
7. **THE CROWN:** `crown\before\sheet-*.png` (white puffs piled up by night) → six spread puffs in the water's aqua / cyan.
8. **THE WATER HITCHES** (`freefall-play.mjs --water`): the splashdown 116 → 124: worst 16.9 – 17.8 ms at 1× + 4× CPU, both looks — the
   target met. Standing on 119 the long frames are (a) the darkness's FIRST step (named `dom`, 67 ms once at night 1×) — `.ff-dark` + its
   veil now rest at 0.001 (kept painted) — and (b) the run's END (the darkness takes the ball: the end card + the staged share frame + the
   card's drawing — 150 – 230 ms at 4×, after play).
- **THE INBOX's ADD-ON** (F5A's review 10 · 20 · 21): (a) the smudge = the match HUD's EMPTY names row (`.ff-count-names` — a dark radial
  ground at x 183 … 207, y 143 … 159 on every screen: found with the page's own boxes) → `:empty { display: none }` · (b) the tan slab =
  THE DEEP's day lamps sliced at their grid cells' borders → the 4 nearest cells · (c) the stump → none · (d) the crown.

## GROUP 1 — THE WATER SWAP
`water\before\sheet.png` (F5A's code) · `water\after2\sheet.png` · `water\beside-f5a.png` (night 121 + day 119, before | after). Speed:
night UNDER THE HARBOR 60.0 – 60.1 fps, worst ≤ 17.6 ms (tiers 2 + 0, 1× + 4×) — new rows in `--perf`.

## GROUP 2 — THE END SCREENS
`end\sheet-solo.png` · `end\sheet-match.png` · `end\sheet-cases.png` (the look preview `tests/integration/ffend-preview.html` — the real
podium + FREEFALL's body + the shared block, the board answered from a fixture; `shots.mjs --page … --sizes 375x667,390x844,430x932`).
Nothing scrolls at the three sizes (the preview's `__ffEnd()` + the cartridge E2E: 0 px over). The other games: `others-unchanged\before`
vs `\after` (JAYWALK's + HIGH RISE's E2E end shots, PRISM DROP's `pd6-pod`) — they never load the block (no END_BOARD).
