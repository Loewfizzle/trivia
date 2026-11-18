# JAYWALK — THE GO-LIVE PASS (Nov 17 2026 · the Beelink · Opus 5.5)

THE RULE (the checklist's): this pass FLIPS `playable` and changes NOTHING else about the game — no look, rules, course, replay, proof,
sound, moment or card change. The plan: `docs/games/passes/jaywalk-golive-checklist.md` section 1, step by step. The owner's decisions:
`docs/games/plan.md` "JAYWALK (the owner, Nov 17 — DECIDED, THE GO-LIVE PASS)". The bible: `docs/jaywalk.md`.

## THE COMMITS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 1022c557 | the owner's decisions into plan.md |
| 0 | 4f8044cd | the rules-live fixture (the owner re-published) · the lab export · the boot re-measured |
| 1 | ef6fa90f | THE BOOT + THE SURFACES: the meta, HOW TO PLAY, the tile, THE BOARD's tab |
| 2 | e6bc1255 | THE FLIP: the GAMES row, the waits emptied, the signs' stand-in gone, the unit tests that flip, the builders |
| 3 | cfdcb43f | THE TESTS THAT FLIP (the E2Es, server.test, the harbor groups) + the surfaces' refine passes |
| close | (this commit) | the docs, this log, the checks |

## GROUP 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com`: 224 marks, **no FIX** (none on JAYWALK's four cards).
- The cloud on d21102c0: `tests` green; harbor skipped (a ci-tag push). CITY F's harbor red on 14cb411f (the `audio` job: the `vault`
  counts — fixed by BEFORE THE FLIP — + the `dock` group's "THE ROOM IN THE URL") is the city's: nothing of JAYWALK's to fix. The
  `vault` group's 4×-CPU lobby frame times are the city's (named, not this pass's).
- **CHECKLIST 1.1 — THE BOOT RE-MEASURED FIRST**: 306 / 310 modules · 6,629,581 of 6,656,000 B → **room 26,419 B / 4 modules** (CITY F's
  number exactly) — above the 6.5 KB / 1 module stop line: the pass goes on.
- **THE RULES-LIVE FIXTURE**: the owner re-published (the review's `jw` + CITY F's `rv`) → `database.rules.json` copied over
  `tests/fixtures/rules-live.json`, `tests/fixtures/rules-live.ack.json` deleted; `tests/rules-live.test.mjs` 4 / 4.
- THE ADD-ON INBOX: nothing addressed to THE GO-LIVE PASS. The Nov 17 8:45 pm entry "TO JAYWALK — NEXT PASS" (the far lanes after a real
  lost context · a vehicle over the lines' words) is the owner's AFTER-LAUNCH polish pass (Step 0) — left OPEN for it.

## GROUP 1 — THE BOOT + THE SURFACES (checklist steps 2–4 + THE BOARD)
- **Step 2 — THE META** joins the boot: `registry.js` imports `./jaywalk/meta.js` into `META` (`metaOf('jaywalk')` answers before the
  cartridge loads). +1 module, +2,092 B.
- **Step 3 — HOW TO PLAY** moved into `ui/help.js` as `RULES.jaywalk` + `TAB.jaywalk 'JW'`, in the shared help's own shape; its nine
  drawings ride as `RULES.jaywalk.pics` (the shared help's new optional picture list — one small drawing a line, `.help-pics` in
  `css/components.css`: the help opens from the title before the cartridge's `css/jaywalk.css` loads, so the four rules moved with it).
  `js/games/jaywalk/help.js` + the cartridge's hub registration deleted; `ui/help.js#hub` stays for the next game.
  **Checked against the rules once more**: ONE LIFE (the goal line) ✓ · "in a match, the farthest wins" ✓ (THE MOTHERSHIP at 6:00 ends a
  match — the line stays true; it is never in solo; the moment announces itself on screen with its big red countdown, so the help does not
  name it) · the arrival banner is a view, not a rule (nothing to say) · **the desktop keys were missing** → ONE line added:
  "KEYBOARD: the arrow keys or WASD. SPACE hops too." (`controls.js#KEYS` — exactly those) with a keyboard drawing: TEN lines.
- **Step 4 — THE TILE** (`ui/game-art.js#ART.jaywalk`): THE SIGNAL's two paths (the same as `core/marks.js#MARKS.jaywalk`) lit as neon —
  a glow pass, the colour, a white-hot core — the cyan box on a dark fill, the hot-pink walking kid, over a zebra crossing in perspective on
  a night street. An SVG frame is enough (no bake): it reads at 72 pt on the card and at the HOW TO PLAY tab's size.
- **THE BOARD's JAYWALK tab** (`board/view.js#TABS` + `GAME_LIGHT.jaywalk` pink + cyan) — SIX tabs. Equal sixths clipped OVERCLOCK at
  390, so the board's row now starts each tab at its words' width and shares the spare room (`.bd-tabs.is-even .nt-tab { flex: 1 1 auto;
  min-width: 44px }`): all six on one row at 360 / 390 / 430 / 1440. `tests/registration.test.mjs` gained the `boardtab` place.
- The room's game list: `tube-logo.js#LOGO_ACC.jaywalk` (the box's cyan — the icon's glow; it fell back to PRISM's white).

## GROUP 2 — THE FLIP (checklist steps 5–7)
- **Step 5** — `JAYWALK_WAITS = Object.freeze({})`; the test is "JAYWALK is playable, no waits" (the rule still bites on a copy).
- **Step 6** — `config.js` GAMES row: `playable: true`, `preview` removed. What follows by itself: the shelf (four rows, no `· TEST`), the
  room's game list, PLAY NOW, the sign's tap → its card, `api/report.js#reportableGame` (everyone's reports — the owner's branch never
  matches a playable row), THE BOARD, the weekly goal's featured-game pool (prism · jaywalk · overclock · holdem — this week's goal is
  "Win 3 matches" either way: checked, no mid-week change).
- **Step 7 — THE SIGNS**: `harbor-neon.js#JAYWALK_SIGN` + `signRoster`'s `jaywalk` option are gone — `signRoster(games)` = the playable
  games, JAYWALK by its own row. `tests/harbor.test.mjs` 419 / 1834 (`!g.preview`) now include it and pass (its day face exists).

## GROUP 3 — THE TESTS THAT FLIP (step 8 — none deleted, each rewritten to the playable truth)
- unit: `cartridge` (BUILDING `[]`, PLAYABLE four) · `registration` · `jaywalk-cartridge` ("PLAYABLE", its meta at boot) · `jaywalk-solo`
  (the owner's report branch pinned as GENERIC; HOW TO PLAY read from `ui/help.js`) · `holdem-owner` (unchanged — the loop already reads
  every row) · `play-now` (its sign → its card) · `city-b-signs` (the roster = the playable games) · `harbor` WINDOWS · `holdem-board`
  (six tabs) · `preload-graph` + `trivision` unchanged in effect.
- `e2e-jaywalk`: A STRANGER plays it — the shelf's four rows, JAYWALK unmarked → its card → PLAY NOW; the stranger's run is COUNTED
  from the replay (the kept check); no `testAdmins` anywhere (the `--drop` / `--perf` phones too).
- `e2e-jaywalk-match`: a PLAIN host — the room's game list offers JAYWALK with no TEST mark to the host AND a guest (shot:
  `room-games`); the report counted for all three; `--eight` without the owner set-up.
- `wk-jaywalk-mem`: the `testAdmins` lines gone (a plain phone, a plain host).
- `e2e-smoke`: JAYWALK started by a regular host like the three; HIDDEN GAMES = the ten frozen; the room's list = four games.
- `server.test` (/api): a stranger's solo run AND a plain room's match are COUNTED; the owner's-test branch stays pinned by flipping the
  row back to "being built" in-process (holdem-server's pattern) → refused, then counted once playable again.
- the harbor suite: `cartridge` (metas `holdem,jaywalk,overclock,prism`; JAYWALK playable, nothing being built), `room` (PICK A GAME = 4),
  `tapfit` (THE BOARD's top: six tabs on one row), `show`'s comment; `wk-board-taps` (six tabs).

## THE NUMBERS
- THE BOOT: 306 → **307 / 310 modules · 6,636,291 of 6,656,000 B — 19,709 B of room left** (the meta 2,092 + HOW TO PLAY ≈ 3.6 KB with
  its ten drawings + the tile ≈ 1.6 KB − the signs' stand-in). The budget never raised.
- THE PER-GAME BUDGET: jaywalk **2,445 of 2,450 KB** (city 124 + 32 modules) — under its line, 5 KB spare (the city's boot graph grew under
  it); overclock 2,559 · prism 2,690 · holdem 2,358 — all under.
- THE BUILDERS: `build-boot-preload` (306 + app.js) · `build-preload-graph` · `build-file-hashes` · `claude-md-coverage` (0 missing).

## STEP 9 — THE SHARE + THE OG IMAGE
(a) the SITE's link preview (`index.html` description / og:description) + the manifest's description name NO games ("neon multiplayer party
games") — nothing to add. (b) `shareAddress` / the card's foot unchanged. (c) the stranger's run in e2e-jaywalk makes its card (below).

## THE CHECKS (fresh emulators + `serve.mjs --emu`, NEVER THE LIVE SITE)
One at a time, nothing else busy; my own servers, stopped at the end.

| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2,205 / 0** (registration · cartridge · achievements · rules-live · boot-budget · game-budget included) |
| `e2e-jaywalk` (a STRANGER's solo run) | **87 / 87** — the shelf's four rows, no · TEST; the card; PLAY NOW; the stranger's run COUNTED from the server's replay (10 lanes = 10; 158 through the areas); the stranger's run card made at SHARE (one upload, the link's preview = the card) |
| `e2e-jaywalk-match` · `--four` | **87 / 87 · 88 / 88** — a plain host; the room's game list offers JAYWALK with no TEST mark to the host + a guest; the report counted for every player |
| the lab check · `--perf` | **132 / 132** |
| `jaywalk-mix.mjs` | **23 cues, none clips** |
| `wk-jaywalk-mem.mjs` (WebKit: 10 runs + THE LEAVE + a 4-phone match) | **48 / 48** — every solo final 7.6 MB (budget 20); the tab's process 455 → 472 MB over 10 runs (peak 510) |
| smoke (`e2e-smoke.mjs` — THE PAGES LOAD) | **21 / 21, errors none** — JAYWALK started by a regular host; the ten frozen refused; the room's list = four |
| the other three games, FAST (the boot changed under them) | OVERCLOCK `e2e-oc-2` (N=4) **27 / 27** · PRISM **67 / 67** · HOLD'EM **22 / 22** — errors none |
| harbor `cartridge, room, tapfit, neon, trivision, load, gamestart, sololook, gameflows` | **143 / 143, errors none** — the metas `holdem,jaywalk,overclock,prism`; PICK A GAME = 4; THE BOARD's top: six tabs on one row at every size; THE BOOT BUDGET in a real boot: 345 requests (≤ 360) · 2,771 KB (≤ 2,900) · no audio |
| `wk-board-taps` (WebKit, /board) | **20 / 20** (six tabs) |
| rules (`rules.test.mjs`) · `/api` (`server.test.mjs`) | **85 / 0 · 66 / 0** (after the browser E2Es — the known false-red order). One rules case rewritten: FR7 FIXES B's "on THE RULES AS PUBLISHED the per-match prune is refused" stopped being true the moment the fixture became the re-published rules — it now proves the prune LANDS on them (one match deleted, the other kept) |

## STEP 10 — THE ROOM LIST + THE CARD: three refine passes (`Downloads\NEON\jaywalk-golive\`)
- r1 (390): the shelf reads; the card reads; HOW TO PLAY's "W A S D" wrapped between its letters → "WASD"; the tile's flat dashes read as
  a progress bar.
- r2: the tile's crossing in perspective + bolder strokes (the HOW TO PLAY tab is ~52 pt) + the box lifted off the crossing; then the zebra
  dimmed a touch. THE BOARD (board/ → board2/): equal sixths clipped OVERCLOCK at 390 → the tabs size by their words, ≥ 44 px each.
- r3 (`--sizes pass`: 390 / 402 / 430 + 1440, night + day): the shelf, the card, HOW TO PLAY — clean; the room's PICK A GAME
  (`match/room-games.png`) — JAYWALK in its pink theme frame, no TEST.

## THE FRESH-EYES REVIEW (one reviewer, a fresh context, read-only, over `Downloads\NEON\jaywalk-golive\` — its report, verbatim)

> VERDICT
> Yes, the go-live surfaces meet the bar on the phone. On the PLAY shelf, JAYWALK is a clean 4th row at 390 / 402 / 430, night and day. There is no TEST mark and no sideways overflow, and the row matches the other three in size and weight. The small shelf icon (a solid pink walker in a cyan box) reads well. The 120-pt card tile reads as a crossing light at a glance. HOW TO PLAY is bold and readable, has no pills, and shows the whole JAYWALK list on all three phone widths. The six tabs on THE BOARD all fit at 360–430 and OVERCLOCK is no longer clipped. The room's PICK A GAME row is consistent with the others. None of these surfaces fails the bar. The real problems are a desktop crop of HOW TO PLAY, and two broken-looking screens next to the go-live work (both in the match folder, both outside this pass's scope).
>
> REAL PROBLEMS
> 1. jw-help-1440x900.png, jw-help-day-1440x900.png — LOW. On desktop the HOW TO PLAY sheet is capped at about 770 px tall. The 10th line ("THE LIGHTS go out behind you…") is below the fold, and the 9th line (A GREEN RING) is faded out at the bottom edge (y≈795). The sheet's bottom edge also sits on top of the JOIN / HOST dock, which peeks out under it. The page has 900 px of height and uses only 64–835. The list fits whole on every phone, so this is a desktop-only crop, and a player has to scroll to reach the last line.
> 2. match/match-podium-winner.png — MEDIUM (broken, though not a surface this pass touched). In the end-screen bar, "BACK TO THE ROOM" is too wide for its half at 390. Its "←" arrow sits flush on the left edge of the screen (x≈0–25, no gutter). The text runs through the centre divider at x=390, which cuts between "ROO" and "M". The other end-screen shots (game/end-*.png: SHARE | CITY) are fine. This is the label every player sees at the end of a JAYWALK match.
> 3. match/match-podium.png — MEDIUM (please check). A Level-1 player's XP sheet lists "MATCH PLAYED +0" and "NEW GAME TONIGHT +0", with an empty level bar. The bottom 55% of the screen is empty black. In the same match the winner got +101 XP for "MATCH PLAYED · VICTORY · NEW GAME TONIGHT". If that run was refused or uncounted, the sheet should say why instead of showing two zero-paying rows. If it should have paid, it is a crediting bug. Either way, a stranger seeing "+0" on the night JAYWALK launches will read it as broken.
> 4. board-jaywalk.jpg — LOW. The JAYWALK board rows show bare numbers (99,000 / 97,964 / 4,120) with no unit, while the XP tab shows "xp" and the end screen says "LANES". The fixture values (99,000 lanes) also aren't believable, so the shot can't show how real 2–3-digit scores will look. A unit, or realistic fixture data, would settle it.
> 5. board2/page-390x844.png, page-360x780.png, page-1440x900.png, board-jaywalk.jpg — LOW. In THE BOARD's header art, the JAY / WALK sign sits behind the "D" of THE BOARD. At 390 / 375 only "WALK" shows, next to OVER / CLOCK. At 1440 the sign is behind the "D" and the OVER / CLOCK sign is cut off by the header's right edge. On launch day the new game's own sign is the one that's half hidden.
>
> SMALL NOTES
> - HOW TO PLAY at 430: several two-line rows end with one word alone on the last line ("edge.", "by.", "of it."). One-line rows also get the same tall row as two-line rows, so the spacing looks uneven.
> - In the help sheet's game tabs (52 pt), the tile's figure is drawn in thin neon tubes and shrinks to hairlines. The shelf's solid walker reads better at that size and could be used there.
> - In the tile itself the light box floats above the crossing, standing on nothing. It is fine as an emblem, but the "crossing" part is only the grey stripes in the bottom 16%.
> - 1440 shelf/card shots: the city billboard on the left still says "HOLD'EM COMING SOON" although HOLD'EM is playable. Worth checking whether the tri-vision's JAYWALK face says the same after the flip.
> - match/match-out-call.png: the CALL THE WINNER card is see-through. Charlie's ghost name tag "CHARLIE" shows inside the card, right beside the CHARLIE button, and reads like a third choice. game/run-day.png catches the end screen under a full magenta wash, where "LANES", "YOUR TABLE" and the rank numbers are pink on pink. That is probably a transient flash; worth confirming it never sits there.

**What was done with each** (checked against the earlier passes' shots before deciding):
- **#1** — the shared help sheet's desktop height (every game's help scrolls the same way — HOLD'EM's is longer): the city's sheet, not
  this pass's; left (LOW).
- **#2** — REAL, but **pre-existing**: byte-for-byte the same foot in BEFORE THE FLIP's `match3/match-podium-winner.png` — CITY F's
  END-SCREEN STANDARD A (`ui/final.js` + `.final-link` in components.css), every game's ROOM podium at 390, not only JAYWALK's. A flip-only
  pass does not edit the console's frame → **TO THE CITY — NEXT PASS** in the inbox (first item) + OPEN FOR BEN.
- **#3** — **pre-existing**, identical in BEFORE THE FLIP's `match3/match-podium.png`: the shot catches THE XP MOMENT (`progress/moment.js`)
  on its first beat, before the count-up; the e2e's report check says that player's match IS counted. The city's moment → named in the
  same inbox entry (a still at the first beat reads "+0").
- **#4** — THE BOARD shows a record's value with no unit for every game (PRISM's BEST SCORE the same — `unitOf` → '' for records); the
  preview's fixture numbers are the preview's. Left.
- **#5** — THE BOARD's header picture (`assets/board-sky.webp`, CITY E's bake of the city) — the city's; named in the inbox entry.
- Small notes: the tab's thin figure (the tile was already thickened once in r2 — reads at the card's 120 pt and on the shelf's mark;
  left) · "HOLD'EM COMING SOON" on the left billboard + THE TRI-VISION's JAYWALK face → the city's (Step 0: the tri-vision bug is already
  with the city chat) · CALL THE WINNER see-through + the magenta wash (THE XP MOMENT's fade — the city's Nov 17 2:50 pm item (5), still
  open) — pre-existing, not this pass's.

## THE INBOX
- Built: nothing was addressed to THE GO-LIVE PASS.
- Left OPEN (not this pass's): the Nov 17 8:45 pm "TO JAYWALK — NEXT PASS" (→ the owner's AFTER-LAUNCH polish pass, Step 0); every entry
  to the city / the dailies.
- Written: "Nov 17 — TO THE CITY — NEXT PASS — from JAYWALK THE GO-LIVE PASS" (the review's #2, #3, #5 + the billboard) and this pass's
  OPEN FOR BEN.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** — `database.rules.json` did not change in this pass (your re-publish is in the fixture now).
2. **YOUR STEPS AFTER THE DEPLOY** (the checklist's 17): your phone check first (you moved it before OPEN DAY) — a solo run + a 2-phone
   match on the live site from a NON-owner phone; then `/admin` → the radio → JAYWALK's OPEN DAY (the billboard says NOW OPEN from it);
   watch `/admin`'s errors for `killed` rows + refused reports for a day.
3. **"BACK TO THE ROOM" overflows its half at 390** on every game's ROOM podium (CITY F's foot — pre-existing; the arrow on the screen's
   edge, the words through the divider). Sent to the city's next pass; a one-line CSS fix if you want it before launch.
4. **HOW TO PLAY has a tenth line** — "KEYBOARD: the arrow keys or WASD. SPACE hops too." (the checklist asked for the desktop keys; they
   were missing). The Mothership is not named in it (it announces itself with its countdown) — say if you want a line.
5. Not proven on your iPhone (as before): the memory, the mix, the lost context.
