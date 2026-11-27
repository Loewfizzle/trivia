# THE END-BOARD SWITCH-ON PASS (Nov 27 2026 — Opus 5.5, high effort)

The owner's final shape (FREEFALL F5B + F5C, 72a9c8be) switched on for every playable solo game: each cartridge's OPT-IN
(`END_BOARD = { b, word, avg }` — ONE shared block, `js/ui/end-board.js`, never a second copy) + HIGH RISE's STORED AVERAGE (server-side)
+ the owner's two add-ons of the morning + the inbox's ONE ICON PER GAME + THE INBOX WRITE RULE. **No rules-file change** (nothing to re-publish).
Shots: `Downloads\NEON\endboard\` — `final\` (every game, solo + match + NEW BEST + FRIENDS ticked, night + day; 375 × 667 · 390 × 844 ·
402 × 874 · 430 × 932 · 1440 × 900) · `freefall-unchanged\` (FREEFALL A/B against 72a9c8be) · `icons\` (HOW TO PLAY) · `e2e\` (the runs) ·
`r1\` `r2\` `try\` (the refine passes) · `accents-sheet.png`.

## OPEN FOR BEN
1. **A SOLO run can't join two of these boards.** PRISM DROP's solo SCORE RUSH never writes `prism-rush` (the solo lane maps a solo record to
   `<board>-solo`, and there is no `prism-rush-solo`), and OVERCLOCK's solo QUICK run writes no `overclock-quick` row (THE FIX PASS S4: room
   matches with 2+ verified players only). Their solo end screens now show the board's top 3 — a board that solo run can't enter (the YOU line
   shows only if a ROOM match put you on it). Count solo runs on those boards (a server change + anti-cheat thought), or leave it?

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| 1 + 2 — THE OPT-INS + HIGH RISE's AVERAGE | 24181d90 | END_BOARD in 4 cartridges; the frame's `on(game)` / `match: false`; the block's board formats; JAYWALK's + HIGH RISE's own tables gone; every end screen fits; `highrise-solo` avg + the report row |
| 1b — the owner's add-ons (9:23 + 9:46 am) | a818c82d | the block in each game's accent (FREEFALL's pink kept); JAYWALK's splits off its end screens; the E2Es moved onto the block |
| 3 — ONE ICON PER GAME + THE INBOX WRITE RULE | 8e3de833 | HOW TO PLAY's tabs = the neon marks; CLAUDE.md's inbox line |
| the close | (this commit) | the docs, the pass log, the inbox marks |

## PER GAME
| game | on | AVG | board · word | fits 375 × 667 (day + night) | what gave the room |
| --- | --- | --- | --- | --- | --- |
| JAYWALK | solo + match | yes | `jaywalk-solo` · LANES | yes (scroll 0 — solo, NEW BEST, match, both looks) | YOUR SPLITS off (the owner's add-on); under 760 px tall: the cause 28 px, the lanes 72 px (were 34 / 92), the gaps |
| HIGH RISE | solo + match | yes (from this deploy) | `highrise-solo` · FLOORS (the tower number prints its floor) | yes | under 760 px: the cause 28 px, the floor 72 px (were 29 / 78 there), the empty WOULD COUNT slot takes no room |
| PRISM DROP | SCORE RUSH, solo + match | no | `prism-rush` · POINTS | yes | the solo frame's SOLO RUN · name · score line (the moment says it); under 760 px a match's winning board at 5-pt cells + WINNER 40 px; the gaps |
| OVERCLOCK | a QUICK run, solo only | no | `overclock-quick` · POINTS | yes (OVERCLOCK has no day look) | under 760 px: OVERCLOCKED 34 px, the score 72 px |
| FREEFALL | (as F5C) | yes | `freefall-solo` · FLOORS | (as F5C) | nothing — pixel-identical on 13 A/B shots |
| NEON PAR · SLIPSTREAM · HOLD'EM | off — untouched | | | | |

Nothing scrolls at 390 / 402 / 430 / 1440 × 900 either (the tall sizes keep every game's own hero sizes — the squeeze is only under 760 px tall).
The block's rows never shrink below FREEFALL F5C's (46-pt strips, 12.5 px lines).

## THE NAMED CALLS (obvious / established-pattern — overrule any)
- **The plaques fold** (NEW PERSONAL BEST / #14 WORLDWIDE) on every game with the block on — FREEFALL F5B's call, now the block's (`.final.has-eb`).
  A results slot holding only plaques takes no room (each game's sheet — FREEFALL's frame left exactly as F5C).
- **A match with the block = the block IS the list**: THIS MATCH's top 3 + YOU from 4th; the console's own list with each player's cause line
  goes (the owner's final shape: "no per-player cause line"). JAYWALK's + HIGH RISE's own line "57 FLOORS · YOU FINISHED 2ND" stays in the body.
- **OVERCLOCK's match keeps its 2-1-3 podium** (it IS the match's top 3 — a second top 3 under it would be a copy): `match: false`.
- **PRISM DROP: SCORE RUSH only** (`on(game)`) — BATTLE + SURVIVAL have no board; their end screens exactly as they were.
- **PRISM DROP's solo frame drops SOLO RUN · BENNY · 98450** with the block on (the other three games' solo ends show no winner line either;
  the moment card keeps "98,450 POINTS · 60 LINES · BEST COMBO ×6"). Its own "YOUR BEST n" = the server's best as last told this phone.
- **HIGH RISE's test page** keeps "YOUR BEST · n" (its card gets no AVG); the cartridge says "YOUR BEST n · AVG n" (FREEFALL's words).
- **JAYWALK's splits** came off the local (unproven / no-signal) end too — it is the same end screen; the DAILY's end card keeps them.
- **A 5+ character score** (PRISM DROP's 98,450, OVERCLOCK's 4,120): the score column narrower + a 16 px numeral + the list into the block's
  side margins, so a 12-letter name stays whole (FREEFALL's 3-digit rows untouched).
- **PRISM DROP by day (the paper)**: the block's words in the paper's ink; its accent = PRISM DROP's own day blue #1d5aa6 (its sky blue fails on cream).
- HOLD'EM's neon mark at tab size: a gold card + spade, dimmer than the others when unselected (0.5 like every unselected tab) — readable;
  PRISM DROP's prism reads well. No redesign.

## GROUP 2 — HIGH RISE's STORED AVERAGE
`core/boards.js` highrise-solo `avg: { days: 14, min: 5 }` + `core/match-report.js#highriseExtra`: a counted SOLO run (`sv`) adds its FLOORS
(`Math.floor(r.f)` — never the tower's sort number) to `pstats.av/highrise-solo`; the server writes `profiles/{pid}/av/highrise-solo` (THE BOARD's
rows + the room's mirror read it — public faces only, no pid) — the same path as JAYWALK's JT2 + FREEFALL's. The ranking value stays the BEST
tower. **No backfill**: `results/` keeps no per-run floor (the outcome carries a best only when it moved, and is compacted after 14 days) — the
average counts from this deploy ("AVG —" until 5 counted solo runs in the last 14 played days). No rules change (profiles/ + pstats/ are server-written).

## THE ADD-ONS (the owner, Nov 27 — both built here)
- **9:23 am — EACH END SCREEN STAYS ITS GAME'S OWN:** `--eb-acc` / `--eb-you` / `--eb-tick` on `.eb` (defaults = F5C's pink), `.final.has-accent
  .eb` ← the frame's `--fin` / `--fin-ink` (the foot bar's token). JAYWALK #ff4fc4 · HIGH RISE #ff4fd8 · PRISM DROP #8fd8ff (day #1d5aa6) ·
  OVERCLOCK #ff6a1a — 6.4 to 12.9 : 1 on their grounds; the ✓ in `--fin-ink`. FREEFALL: `.ff-final .final.has-eb .eb` keeps #ff4fa8 / #ff8fe0
  (13 A/B shots: 0 px). THE YOU ROW's glow unchanged. The tick stays a box + a check mark (colour-blind rule).
- **9:46 am — JAYWALK: THE TIME SPLITS OFF THE END SCREEN:** `victory.js` (podium solo + match) + `view.js#showLocalEnd`; `splits-card.js` stays
  in use (the daily's end card `daily-run.js`, the lab); `keepOwnSplits`, `rememberBests`, the server's replay + pstats.jsp untouched.

## GROUP 3 — ONE ICON PER GAME
- HOW TO PLAY's tabs (`ui/help.js`) = `markSvg(g)` — the PLAY shelf's + PICK A GAME's neon marks (PRISM DROP + HOLD'EM no longer wear their
  poster tiles there). Swept: THE BOARD's tabs (words only), the end screens (THE END NEON words), the dock / sheets (the marks already).
- `gameArtSvg` stays in ONE place — THE GAME CARD sheet's 120-pt poster (`screens/title-taps.js` — its fallback is the mark).
  (`screens/title.js` imports `gameArt` / `gameArtSvg` and uses neither — a boot module: left alone, named here.)
- Shots `icons\`: HOW TO PLAY from the city (night · day · HOLD'EM's tab) + from inside PRISM DROP (night · day), 390 × 844.

## THE TESTS (the mini PC, own emulators + serve.mjs --emu, nothing else busy)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **2,840 / 2,840** (new: `tests/endboard-switch.test.mjs` — 7 tests) |
| smoke | **28 / 28** (the pages load in Chromium + WebKit) |
| e2e-jaywalk | **123 / 123** (THE END-SCREEN BOARD on the solo end: FRIENDS ONLY = your table + YOU · 4TH, THE YOU ROW in JAYWALK's pink, no scroll 360-1440, both looks; no splits card) |
| e2e-highrise | **118 / 118** (0 / 1 / 3 / 8 friends through the block; floors as floors; YOUR BEST n · AVG —) |
| e2e-highrise-match | **59 / 59** |
| e2e-jaywalk-match | **94 / 96** — the 2 reds = section 8c (the scripted H6A match's server report: "no outcome" → the cards + YOUR BEST ANYWHERE). **ALREADY RED BEFORE THIS PASS**: the same E2E against a worktree of 72a9c8be (its own /api on the emulators) fails the same two (`e2e\jwmatch-old.log`) — F5B's "OPEN FOR BEN 6" (`not_in_match`). The podium checks (THIS MATCH's top 3, no cause lines) green. |
| e2e-prism | **95 / 95** (+ THE END-SCREEN BOARD on the SCORE RUSH solo end) |
| e2e-oc-2 (N=4) | **27 / 27** |
| e2e-freefall · e2e-freefall-match | **64 / 64 · 109 / 109** (FREEFALL as F5C left it) |
| e2e-play-bounce | **30 / 30** |
| e2e-profiles | **148 / 148** |
| harbor `ONLY=afterparty,cartridge,gameflows,sololook,helpcold,shell,stripfit` | **46 / 46** |
| rules `rules.test.mjs` | **101 / 106** — F5C's exact five (the time-bound JAYWALK / HIGH RISE proof-node cases); no rules file touched |
| /api `server.test.mjs` (fresh emulators) | **76 / 78** — F5B's two (H6A match report `not_in_match` · THE PROOF PASS verified-solo); the first run after the E2Es had a 3rd (CITY D STATS → THE DAILIES: this week's daily rows the E2Es left — green on fresh emulators) |
| FREEFALL A/B (13 end-screen shots vs 72a9c8be) | **0 px** changed |
| the look preview, every game × solo / match / NEW BEST × night / day × 5 sizes | **scroll 0** everywhere (`final\`, 86 shots) |

## THE SERVERS
Started: the emulators (`tests/integration` `npm run emulators` — restarted fresh once for /api), `serve.mjs --emu` (:5173), a worktree of 72a9c8be
on :5174 (A/B + the pre-existing check). All stopped at the end; the worktree removed. Ben's :5190 preview server left running (not this pass's).
