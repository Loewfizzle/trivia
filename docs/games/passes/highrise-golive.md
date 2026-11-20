# HIGH RISE — THE GO-LIVE (+ the day end screen fix + the share card's type) — Nov 20 2026 · the Beelink · Opus 5.5

**RE-PUBLISH: NOTHING.** No rules change (`database.rules.json` untouched — it equals `tests/fixtures/rules-live.json`, the owner's Nov 20
publish of S4B's file). The owner's calls: `docs/games/plan.md` "HIGH RISE — THE GO-LIVE". The bible: `docs/highrise.md` "THE GO-LIVE".
The mockups (approved): `Downloads\NEON\highrise-day-end-screen.png` (the RIGHT side) · `Downloads\NEON\highrise-share-floors-fix.png` (the
RIGHT side — its TYPE only).

| commit | what |
| --- | --- |
| `916d9583` | Step 0 — the owner's decisions into plan.md |
| `2152826d` | Group 1 — THE DAY END SCREEN to the mockup |
| `ff200b22` | Group 2 — THE SHARE CARD'S TYPE |
| (Group 3) | THE GO-LIVE FLIP + THE SIGN HOLD + the tests that flip |
| (the close) | the fresh-eyes review's fixes, the docs, this log, the final run (the ci tag) |

THE ADD-ON INBOX: read at the start, after each group's commit and before the final run — nothing addressed to this pass. The open
entries are to THE NEXT CITY PASS and to JAYWALK — left untouched. This pass ADDS one: to THE CITY PASS — "lift THE SIGN HOLD".
THE LAB EXPORT (the start): 224 marks, no FIX.

## GROUP 1 — THE DAY END SCREEN (Ben on his iPhone after FIX B: grey murk, no blue sky, the tower a blurred grey blob)
- **THE PULL-BACK**: a pose may now stand the camera farther back (`night.js#POSE_FAR`, eased like the pose's lift — τ 140 ms, settled long
  before the still at 650 ms). The day end = `endDay`: 1.7 × play's distance, the tower a touch higher (`POSE.endDay` −0.05) — the WHOLE
  top of the tower in the still, its edges visible, never a giant close-up block. `stage.js#endPose` picks it by the look ON SCREEN and
  follows a look switch under the end screen. Night's end: unchanged.
- **FAR LESS BLUR**: the still at HALF the width (was a quarter) + ONE soften pass (was two).
- **A NAVY TINT** `rgba(9, 15, 42, …)` (was a near-black grey): 0.86 over the words only (to 44 %), 0.46 → 0.34 → 0.46 from the middle
  down (the sky + the tower show), 0.7 at the foot; the foot's backing navy 0.55. The layout, colours, glow + buttons: unchanged.
- **EVERY LINE MEASURED** (Ben: "contrast measured for every line"): `highrise-play.mjs --end` now measures the header's three words, the
  cause, the number AND the stat lines (FIX B measured the stat lines only) — each line's own box, the words hidden, the brightest 5 % of
  its ground. Day worst **4.7 : 1** (390 × 844 + 375 × 667, every cause). It found a NIGHT problem FIX B never measured: the gold
  finish's header (RISE · MATCH) over THE MOTHERSHIP's lit hull at **2.8 : 1** → that one veil's top darker (0.86): 6.8+. The numbers:
  `Downloads\NEON\highrise-golive\end\contrast.txt`.
- Proof: `Downloads\NEON\highrise-golive\end\` — every cause, both looks, 390 × 844 + 375 × 667, + `side-by-side\` (the mockup's right side
  next to each day end). Refine passes: r1 (the pull-back 1.9, the tint) → r2 (lighter middle) → r3 (1.7, the top raised — the mockup's
  tower size + place).

## GROUP 2 — THE SHARE CARD'S TYPE (Ben, from the real card in Messages)
- **"10 FLOORS"**: FLOORS right beside the huge number on its baseline — bold cyan (72 px, 900, spacing 2, a small halo), the number +
  FLOORS centred together as ONE row (the number a size down only when the row would pass the margins).
- **THE BAND on its own line** under it in PINK neon — 68 px, 900, spacing 3 (was 42 px spaced 14, cyan, after "FLOORS ·").
- THE FINISH (the gold Mothership card): the same layout, all gold. Everything else unchanged; the hero shots NOT regenerated (A CLEAN
  BREAK, no sparks).
- At 300 px wide: FLOORS 14 px caps (3.3–4.1 : 1 on its ground — its own halo is that ground), the band 14 px caps (9.5–16 : 1).
  `highrise-share.mjs` 120 / 120. Cards at 1080 / 540 / 300: `Downloads\NEON\highrise-golive\share\`.

## GROUP 3 — THE GO-LIVE FLIP (JAYWALK's go-live pattern + the review's GO-LIVE CHECKLIST)
- **THE FLIP**: `config.js` GAMES row `playable: true, live: '2026-11-20'` (no `preview`) · `api/_lib/highrise.js#HIGHRISE_COUNTS = true`.
- **THE SURFACES**: the meta at boot (`registry.js#META`) · HOW TO PLAY WRITTEN (`ui/help.js` `RULES.highrise` — one line + HOW TO STACK /
  HOW IT ENDS, eleven lines ≤ 52 characters, one drawing each, checked against the rules; tab `HR`) · the tile THE TOWER (`ui/game-art.js`)
  · THE BOARD's seventh tab (`board/view.js#TABS`, `GAME_LIGHT` pink + cyan) · the room list's logo colour (`tube-logo.js`) · the Credits
  sheet's HIGH RISE group (`ui/credits.js` — the F-22's CC BY 4.0 line REQUIRED, the Blackbird + the UFO, the sounds + skies CC0, the Grok art).
- **NEW ON TOP**: by its `live` day — HIGH RISE first on the PLAY shelf + PICK A GAME, above JAYWALK, until Dec 3 (`core/game-order.js`).
- **THE WEEKLY GOAL**: HIGH RISE joins `GOAL_GAMES` by its row. This week's goal is unchanged ("Win 3 matches" — checked, no mid-week
  switch); "Play 5 different games" weeks start with the week of Dec 7 and count HIGH RISE (room matches, the existing rule).
- **THE DAILY CEILING**: 20, unchanged, every game.
- **/highrise-lab DELETED** (the page, `lab.js`, `graybox.js`, `css/highrise.css`, its two tests; `serve.mjs` + THE PAGES LOAD). Its one
  game check (THE VIEW'S TOWER == THE ENGINE'S) moved to `tests/highrise-tower.test.mjs`. /highrise-play stays and never counts.
- **THE TWO CARDS OUT OF THE LAB** (the owner: "the two cards' lab marks removed"): their four lab rows + lab text gone; their art SHIPS as
  it is (`vault/approved.js#SHIPPED` — strip + full card, no mark needed); their tiers without a lab row (`catalog.js#SHIPPED_TIERS`).
- **THE SIGN HOLD** (`core/harbor-neon.js#SIGN_HOLD = ['highrise']`): `signRoster` leaves it out, and the neon's own list now reads the
  roster (it filtered `playable` itself) — no named sign, no billboard pick, no blade, no ghost ad. The tri-vision's faces are their own
  list. THE CITY PASS lifts it (one line). Tests: `highrise-golive.test.mjs`, `city-b-signs`, `harbor.test` (THE DAY PASS skips a held
  game), the harbor `neon` group: "THE SIGN HOLD: no HIGH RISE sign anywhere in the city".
- **THE KILL SWITCH**: the would-count path is KEPT (the review called it dead code): `HIGHRISE_COUNTS = false` is the one-line way back.
  The emulators' flip `testHighriseCounts` is now two-way (true / false over the code) so `server.test.mjs` keeps the OFF path tested.
- **THE BUDGETS, no raise**: comments trimmed (meta.js ships at boot now; the new lines' own comments short). THE BOOT 308 / 310 modules ·
  `js/games` at boot 29.2 of 30 KB (was 30.2 → red) · JAYWALK's per-game line 2,449.7 of 2,450 KB (was 2,451.2 → red — the review's
  ~0.3 KB) · the real boot (harbor `load`): 338 requests (≤ 360), 2,769 KB on the wire (≤ 2,900).
- **THE TESTS THAT FLIP** (none deleted but the lab's; each rewritten to the playable truth): unit — cartridge (BUILDING `[]`, FIVE
  playable), registration (HIGHRISE_WAITS empty), highrise-cartridge (PLAYABLE · THE SWITCH ON · the cards out of THE LAB), highrise-server,
  highrise-play, harbor, city-b-signs, jaywalk-cartridge, holdem-board (seven tabs), the four day-end pins; `e2e-highrise` (A STRANGER — the
  shelf, the card, PLAY NOW, COUNTED, YOUR BEST from the server, SHARE = the LINK), `e2e-highrise-match` (a PLAIN host, the room's list for
  the host + a guest, COUNTED for all), `server.test` (two blocks: the kill switch forced OFF, then the code's ON — a stranger counted),
  `e2e-smoke` (five playable, ten hidden, HIGH RISE started by a regular host), the harbor `room` / `tapfit` / `cartridge` / `neon` groups.

## THE GO-LIVE CHECKLIST (the review's) — item by item
1. The inbox, the lab export, the budgets re-measured — done (above).
2. The live-rules record — already done by REVIEW FIX A (the owner published S4B's file; `rules-live.json` = `database.rules.json`).
3. The surfaces: meta, HOW TO PLAY (written), the tile, THE BOARD's tab, the logo colour, the credits group — done.
4. THE FLIP — done (two lines).
5. The pinned tests flipped — done (above).
6. The builders: boot preload, preload graph, file hashes, CLAUDE.md coverage (0 missing) — done.
7. The docs: CLAUDE.md (FIVE PLAYABLE), ROADMAP, the bible, testing.md, this log — done.
8. Fresh emulators, the full run, a fresh-eyes review, ONE tagged push — THE CLOSE (below).
- "The city grows a HIGH RISE sign at once" (MUST 4) — answered by THE SIGN HOLD (the owner's ORDER: the CITY pass after the go-live).
- "Seven tabs on THE BOARD" — they fit on one row (the harbor `tapfit` group; the shots).
- "Dead code after the flip" — kept as the kill switch (named above).
- "The cards are still pictures" — still pictures (the owner's call: out of THE LAB, ship as they are).

## THE FRESH-EYES REVIEW
(the close)

## THE FINAL RUN
(the close)

## THE CALLS MADE (obvious / established — overrule any)
(the close)

## OPEN FOR BEN
(the close)
