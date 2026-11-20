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
| `c7107f5c` | Group 3 — THE GO-LIVE FLIP + THE SIGN HOLD + the tests that flip |
| `71a64d88` | the close — THE FRESH-EYES REVIEW's fixes + THE BOARD's seven tabs on a narrow phone |
| the close (top) | this log, the final run (the ci tag) |

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

## THE BOARD's SEVEN TABS (found in the shots, the close — `Downloads\NEON\highrise-golive\board\`)
The harbor `tapfit` geometry passed ("one row of 7") but the picture did not: the seven labels filled 357 of 358 px at 390 (no air between
the words) and were CUT at 375 + 360 (the row's flex shrank the long words). Fix: HIGH RISE's tab reads **HIGH / RISE stacked** (its signs'
two-word rule) · under 390 the tabs never shrink below their words, a size down (9.5 px; 9 px under 370). Measured at 390 / 375 / 360: no
word cut, ≥ 5 px between words, every tab ≥ 44 px, no sideways scroll. `tapfit` now runs 360 too, checks a cut by the words' OWN box
against the tab (the old scrollWidth check could not see it) and saves the shots.

## THE FRESH-EYES REVIEW (a separate read-only agent that wrote none of it — the whole pass's diff; its finds, all fixed in `71a64d88`)
"Nothing serious. The flip looks clean." (it ran the unit suite: 2385 / 0). THE SIGN HOLD checked path by path (the named signs, the blades,
the ghost ad, the billboard pick, the tri-vision's own list, a sign tap): clean. The emulator flip: production can't honour it (`emulated()`).
The vault: nothing else needs a lab row; SHIPPED only decides art for a card someone owns. The share row: fits 1–3 digits + the gold.
1. **LOW-MEDIUM** — a WebGL rebuild while WATCHING (out, spectating) by day took the day end's pull-back (`stage.js` rebuild posed
   `shown ? endPose()`) → a rebuild while watching keeps play's camera; the end pose only under the end screen itself.
2. **LOW** — HOW TO PLAY said "6 PERFECTS in a row and the slab GROWS BACK"; the engine grows from the 7th → "After 6 PERFECTS in a row,
   each PERFECT GROWS BACK." (pinned in `highrise-golive.test.mjs`).
3. **LOW** — the flyers stood off the eye by play's distance during the pull-back → `FR.dist = dist × the pull-back`.
4. **LOW (tests)** — a failed server block could leave `testHighriseCounts = false` on the emulators → `t.after` resets it; both E2Es clear
   it at their start.
5. **LOW** — the being-built registration check now loops over nothing → it says so, and asserts HIGH RISE is checked as playable.
6. **LOW** — stale "hidden / until go-live" comments (the cartridge, the catalog, boards, match-report, the timetable row) → updated.

## THE FINAL RUN (fresh emulators + this pass's own `serve.mjs --emu`, one at a time, nothing else running; logs `Downloads\NEON\highrise-golive\logs\`)
| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2385 / 0** |
| smoke (THE PAGES LOAD — /highrise-lab gone: 2 page loads fewer) | **24 / 24** — five playable, ten hidden, HIGH RISE started by a regular host |
| `e2e-highrise` (full — A STRANGER, counted; the long run past 60, ABOVE THE CLOUDS) | **81 / 81** |
| `e2e-highrise-match` (3 phones + a late joiner, REMATCH, the dead host) | **58 / 58** — a plain host; COUNTED for all; each best = the judge's floor |
| the test page `highrise-play.mjs` (REPLAY = LIVE ✓ every run) · `--webkit` | **237 / 237 · 6 / 6** |
| THE END SCREEN `--end` (390 × 844 + 375 × 667, both looks, EVERY line) | **152 / 152** — day worst 4.7 : 1, night worst 4.6 (`end\contrast.txt`) |
| THE SHARE CARD `highrise-share.mjs` | **120 / 120** |
| ZERO GARBAGE `highrise-alloc.mjs` | first run **11 / 12** (the 7-bot MATCH 14.3 KB/s over the 12 line — the sites: the bots' sim, three.js, the match HUD; nothing this pass runs in a live frame) → alone, nothing else busy: **12 / 12** (solo 6.0 night / 5.4 day, MATCH 10.4 — FIX B read 10.3): run-to-run spread, named |
| THE TOP HUD `highrise-place.mjs` · SPECTATE `highrise-spectate.mjs` · THE PIXEL TEST `highrise-rivals.mjs` | **150 / 150 · 32 / 32 · 10 / 10** |
| rules (`rules.test.mjs`) · `/api` (`server.test.mjs`) — last, after the browser E2Es | **89 / 0 · 68 / 0** |
| the harbor groups (`neon, cartridge, room, tapfit, trivision, load, gamestart, sololook, gameflows, vault`) | **203 / 203, errors none** — THE SIGN HOLD in a real city; PICK A GAME = 5; the real boot 338 requests · 2,769 KB; then `tapfit` again with 360 + the cut check: **26 / 26** |
- The full harbor suite: the cloud's, on the tagged push (THE LOCAL TESTING RULE).
- Every server this pass started (the emulators: npm · cmd · firebase · java; `serve.mjs --emu`; the earlier plain `serve.mjs`) stopped at
  the end, by exact PID.

## THE CALLS MADE (obvious / established — overrule any)
- THE DAY END: the pull-back 1.7 × with the tower a touch higher (the mockup's tower size + place); the navy `rgba(9, 15, 42)`; the still at
  half the width + one soft pass; the NIGHT finish's veil top darker (its header measured 2.8 : 1 over THE MOTHERSHIP's hull).
- THE SHARE TYPE: FLOORS 72 px bold cyan with a small halo (at 300 px its own glow is its ground: 3.3–4.1 : 1 — it reads); the band 68 px.
- HOW TO PLAY's eleven lines + drawings (my words, checked against the rules) — and "After 6 PERFECTS in a row, each PERFECT GROWS BACK".
- THE BOARD: HIGH RISE's tab stacked HIGH / RISE; the tabs a size down under 390.
- The tile THE TOWER over a low pink-edged skyline; the logo colour hot pink; the credits group's wording (the CC BY lines copied exactly).
- THE KILL SWITCH kept (the review called the would-count path dead code); the emulator flip made two-way to keep it tested.
- The two cards: out of THE LAB AND their art shipped as it is (the owner's "lab marks removed" read as: no lab review needed — they ship).
  If you wanted them kept in THE LAB for a later mark, say so: one revert of `approved.js#SHIPPED` + the four rows.
- NEW on top by `live: '2026-11-20'` (the 4 am streak day of today); HIGH RISE above JAYWALK (both NEW) until Dec 3.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing.** No rules change (`database.rules.json` = what you published Nov 20).
2. **YOUR PHONE CHECKS** (after the deploy):
   - The game from the city: https://neonspeakeasy.com → PLAY → HIGH RISE (top, NEW, no TEST) → PLAY NOW. A counted run: the end screen
     says YOUR BEST from the server, no WOULD COUNT line.
   - A DAY run's end screen (the fix): https://neonspeakeasy.com/highrise-play?look=day — play to the end: a blue sky, the whole top of
     your tower, the words on navy. (The test page never counts.)
   - SHARE from a real counted run: the cartridge's end screen → SHARE → the link; open it in Messages — the card says "10 FLOORS" with
     the band in pink under it.
   - A match with your brother: https://neonspeakeasy.com → HOST → PICK A GAME → HIGH RISE — counted for both of you.
   - THE BOARD's HIGH RISE tab: https://neonspeakeasy.com/board (seven tabs, HIGH / RISE stacked).
3. **CALLS YOU CAN OVERRULE**: see "THE CALLS MADE" above — the two cards shipping as they are is the one most worth a look.
4. **NOT DONE / NEXT**: THE PROOF PASS (the host-trust holes — before strangers are invited) → THE CITY PASS (its signs; it lifts THE SIGN
   HOLD — the inbox has the entry). SHOULD 7 (the F-22's 1.1 MB before the first tap) still wants your iPhone A/B.
