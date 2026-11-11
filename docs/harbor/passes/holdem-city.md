# HOLD'EM IN THE CITY — the billboard NOW OPEN, HOLD'EM's sign + day face, THE BOARD's HOLD'EM tab + HE9's shared fixes (Nov 11, 2026)

A City 2.0 + console pass after LOAD FIX 5. HOLD'EM itself was done (HE1 → HE10, playable since Nov 11); this pass dressed the city + the console
around it — ONLY what the owner listed (plan.md "OWNER'S NOTES — NOV 11 (evening)" + docs/harbor/decisions.md "HOLD'EM IN THE CITY"); nothing else
started. Sources: the mailbox (Downloads\NEON\MAILBOX.md, "2026-11-11 11:30 — FROM HOLD'EM → TO CITY" + "2026-11-11 09:20"), the Fable review
(Downloads\neon\holdem\FABLE-REVIEW.md, Part B — B2, B3, B4). B5 (the host's END GAME / kick reach a HOLD'EM match) is FR7's, as the owner said.

**Database rules: NOT changed.** Still 8 functions. Next: FR7 (the whole app, read-only, on Fable) + FR7 FIXES → THE LAUNCH → SIDEWAYS.

## Step 0 — the owner's notes (part 87)
plan.md "OWNER'S NOTES — NOV 11 (evening)" appended unchanged (THE SWITCH-OVER renamed THE LAUNCH; LOAD FIX 5 shipped; this pass's picks) + its
build table line; decisions.md: the current line, THE LAUNCH row (was SWITCH + SWITCH-OVER), THE ORDER, THE FIVE SIGNS, the nephew's card DONE.

## Group 1 — THE BILLBOARD → NOW OPEN
- The timetable's `billboard.holdem` row (core/harbor-schedule.js) defaults to **NOW OPEN** from its new `open` day key — **2026-11-11**, the day
  HOLD'EM went playable — COMING SOON on the days before it (`core/harbor-holdem.js#barOn`). So the past stays true and THE BILLPOSTER pastes the
  new sheet ONCE, at his ~5 pm slot on Nov 11 (`holdemKeeps('2026-11-11')` = false; every day after: home again) — the paste is the change, never a
  pop-in. A phone that loads after the deploy simply sees NOW OPEN (Nov 11's sheet is already up); the owner sees it on his morning check.
- The owner's /admin → THE BILLBOARD switch still overrides it and can turn it off (the live feed carries no switch today — `base: null` on the
  public GET — so every phone uses the default). Turning the ad OFF keeps the current bar (NOW OPEN) for when it comes back. `&force=billboard-holdem`
  (+ `&holdem=open`) unchanged.
- THE GOLDEN TABLE: unchanged — it plans the day with the ad OFF (an input, like the weather), so there was nothing to re-pin.
- Proof: `tests/holdem.test.mjs` (the default — COMING SOON to Nov 10, NOW OPEN from Nov 11; the billposter on Nov 11 only; the switch still wins;
  the day chart's line says NOW OPEN) · `server.test.mjs` (the /admin default reads ON · NOW OPEN).
- Shots (`holdem-city/g1/`): `night-{390x844,402x874,430x932}-bill.png`, `day-…-bill.png`, `fog-{390x844,430x932}-bill.png`, `night-390x844.png`
  (the whole frame, unzoomed: NOW OPEN reads at a glance — the gold letters, the chip).

## Group 2 — HOLD'EM's SIGN + DAY FACE (in GRIDLOCK's spot)
- `js/config.js`: HOLD'EM `sign: true`, GRIDLOCK `sign: false` — **THE FIVE SIGNS = PRISM DROP · OVERCLOCK · HOLD'EM (playable, lit) + NEON PAR ·
  HIGH STAKES (next on deck)**. GRIDLOCK's game stays frozen + hidden exactly as before; only its sign left. A tap on HOLD'EM's sign opens its
  preview (the blurb, THE BOARD's top three — its own board now — HOW TO PLAY), like PRISM DROP's + OVERCLOCK's (the tap code already read
  `playable`).
- **THE SLOT RULE + THE APOSTROPHE** (found): the roof signs take 6 letters a word, and `fitsSpot` counted HOLD'EM's apostrophe as a 7th — so
  HOLD'EM fitted no skyline sign (GRIDLOCK, 8 letters, never did either: it only ever hung on the roof billboard, which has been HOLD'EM's ad since
  Nov 8). Now a ROW counts LETTERS (the apostrophe tube — a third of a cell, `marks.js#GLYPH_ADVANCE` — rides along); a VERTICAL sign (the tower
  blade, the panorama's) still counts it as a letter (it takes a full step there), so HOLD'EM stays off the PRISM blade (8.9 pt at 390 there —
  under the glance test).
- **THE ROW SIZED BY ITS REAL ADVANCE** (`signs.js#lettersRow`): the letters' height came from `w / n` with the apostrophe as a full cell — HOLD'EM
  read 9.6–9.9 pt on the roof signs at 390 (under the 10 pt glance test). Now the row is sized by the letters' real advance + half a gap either
  side of the apostrophe: **10.1 – 11.6 pt** at 390 – 430 on both roof signs. A name without an apostrophe is laid out exactly as before.
- **Its colours**: the night tube **casino red `#ff5a64`** (its billboard chip's red) — chosen over the gold accent because a gold HOLD'EM next to
  HIGH STAKES' gold read as one sign at a glance (shot before/after); the title's game tile keeps the gold accent. **The day face** = gold letters
  on **casino felt** `[20, 84, 52]` with a cream keyline (the billboard's cream + gold, in the family of the other enamel faces; 4.5:1+).
- **The speakeasy's painted blade** rotates the five sign games weekly (`harbor-speakeasy.js#AD_ORDER`): HOLD'EM took GRIDLOCK's slot in the order,
  so the five's weeks are unchanged — this week's blade stays PRISM DROP (as Monday's painters lettered it); HOLD'EM gets GRIDLOCK's weeks. The
  vertical HOLD'EM reads with its apostrophe (`&ad=holdem`).
- The rotation for the coming nights at 402: HOLD'EM on a roof sign Nov 11, 12, 13, 15, 17, 18, 19 (with NEON PAR or HIGH STAKES beside it); every
  sign game a skyline sign takes hangs at least once every week (52 weeks checked).
- `tests/harbor.test.mjs#CITY_PENDING` DELETED (HE10 asked): the sign / day-face / slot checks walk all thirteen games. Two mechanics checks that
  assumed twelve now read the list's length; "every game every week, a sign or the billboard" — true of the real five — is now asserted for the
  five on the skyline every week + all thirteen within any two weeks (a ninth game in the named pool: the old one-week property doesn't hold for a
  hypothetical all-thirteen list; it never applied to the city since WINDOWS). The show group's billboard check forced GRIDLOCK → HIGH STAKES.
- NO TWO CAMERAS: the harbor `cameras` group 11 of 11 after the change (+ neon 39/39, skyline, billboard, core green).
- Shots (`holdem-city/g2/`): `roofA-night-*`, `roofB-night-*` (390 / 402 / 430, the skyline crop), `roofB-day-*`, `roofA-day-*`,
  `roofB-night-1440x900.png` + `roofA-day-1440x900.png`, `blade-night-402x874-street.png` + `blade-day-…` (the vertical HOLD'EM, `&ad=holdem`).

## Group 3 — THE BOARD's HOLD'EM TAB
- **The board `holdem-tw` = TOURNAMENT WINS** (this week / all time), **KNOCKOUTS the tie-break**, then **the earlier to reach it** — packed into
  ONE sort value (`core/boards.js#tieSort`: wins × 1e10 + min(KOs, 999) × 1e7 + the time left — seconds of the week / minutes since 2026 —
  safe integers), shown **"3 WINS · 5 KOs"**. Board ids with dashes.
- **Only from the dealer's own record**: `holdem-dealer.js#resultRows` adds each player's counters through `match-report.js#holdemCounters`
  (bounded — a win 0/1, KOs 0 … players − 1); **CASH counts for neither** (no winner); a match under HE10's `COUNTS` (3 hands) has no rows at all.
  `progress.js#matchStep` keeps WHEN the standing last moved (`g/gw.holdem.ra`); the row is written by the SERVER in the SAME update as the match's
  stats (`stats.js` → `lb.js#boardPaths`, the tie-break branch). The end-of-round moment watches the board too (ENTERED THE TOP 10).
- **THE BOARD**: **five tabs on one row** at 390 — XP · DAILIES · OVERCLOCK · **PRISM** (PRISM DROP's tab shortened) · HOLD'EM; the HOLD'EM tab
  shows its one board (no RECORDS / CAREER switch — `boards.js#tabBoards`), the plate TOURNAMENT WINS + RESETS MONDAY / ALL TIME, and the
  one-line explainer **TOURNAMENTS ONLY (NOT CASH) · KOs BREAK A TIE** (`.bd-note`). The other tabs unchanged (PRISM's switch kept). The sign's
  preview on the title shows the same board. The player page unchanged.
- **THE BACK-FILL**: /admin → THE BOARDS → BACK-FILL now rebuilds HOLD'EM too (`core/board-fill.js#holdemFromRecords` + `filledHoldem` — the
  owner's tap; never run on the live site from here). From the dealer's records: every counted tournament's WINS rebuild exactly; KNOCKOUTS only
  from the records written from this pass on (each result now keeps `ko` per profile) — the dealer's own record is deleted 8 s after a match,
  so the knockouts of matches before this deploy are gone (their rows show 0 KOs until new ones land). The preview line says how many wins for
  how many players. Idempotent (never lower than the live counters).
- `profiles.test.mjs`'s HOLD'EM skip removed (BOARD_GAMES = every game). HOLD'EM joins the weekly goal's featured games (a playable board
  game) — this week's goal is "Win 3 matches" either way (checked: unchanged), and the profile's MASTERY gets a HOLD'EM tile.
- Proof: `tests/holdem-board.test.mjs` (6 — the catalog, the sort, the bounds, a whole tournament on the dealer, the stats + rows incl. CASH and
  the next week, the back-fill twice) · `holdem-server.test.mjs` on the emulators (a new test: a counted TURBO through the server → the winner's
  row + their KOs + the result's `ko`; the public row = ROW_KEYS only, no pid in the answer; a counted CASH session (11 hands, 6 min) → no row; a
  tie on wins → the 3-KO player above the 1-KO one though later; the back-fill restores a lost row from the records, a second run the same) — 18 of 18.
- Shots (`holdem-city/g3/`): `board-holdem-{390x844,402x874,430x932}.png` (THIS WEEK), `board-holdem-public-all-1440x900.png` (the public
  /board, ALL TIME), `board-prism-390x844.png` (the other tabs keep their switch).

## Group 4 — HE9's SHARED FIXES (every game)
- **B2 — 44 × 44**: ☰ + the music button (+ THE BOARD's ‹) were 42 × 42 — an absolutely placed `::after`'s inset is measured from the PADDING box,
  inside the 1 pt border. Now `calc((var(--cb) - 44px) / 2 - 1px)`; the look unchanged. The daily's ‹ and the profile's BACK are 44 pt boxes
  themselves; HOLD'EM's END SESSION kept HE10's fix. **THE CHECK** — the harbor group **`tapfit`** (the lobby job, ~15 s): every corner button's
  REAL hit area probed with `elementFromPoint` along the lines through its centre (`kit/corner-probe.mjs`) on the city, THE BOARD, PRISM DROP,
  OVERCLOCK, the daily, COAST CLEAR + THE PASSWORD at 390 + 1440 — 14 of 14 at 44 × 44 (the city's own are 46); the old rule reads 42.
- **B3 — THE PODIUM's ACTION ROW STICKY** (`ui/final.js` — every game): BACK TO THE ROOM is the frame's last piece, stuck to the screen's foot
  (always on screen) over a solid backing that runs down through the safe area (`--fin-bg` — the console's dark panel; PRISM's night / its paper
  by day, HOLD'EM's black); while the cards run past the fold a soft fade sits above it + a drawn chevron and **MORE BELOW** on the backing (gone
  once you scroll; measured on a scroll + a resize only — never a frame loop). Short podiums: the button right under the XP box as before. HOLD'EM's
  own SCROLL FOR MORE (HE10's stop-gap) removed. Shots at 390 × 844, the SE (375 × 667) and sideways (844 × 390), 8 players:
  `podium-{prism,overclock,holdem}-*.png` + `podium-prism-day-390x844.png` (the day's ink for the cue — the grey failed 4.5:1 on paper).
- **B4 — EVERYONE TIED = ALL TIED.** THE RULE (the same for every game — `core/night.js#nightPoints`): a FULL tie (2+ players, all ranked 1st)
  is a **draw** — the podium says **ALL TIED / NOBODY TAKES FIRST** (no winner sting, no buzz, no confetti; the console's podium levels its
  steps; the list shows "=" for everyone); **game night gives everyone 2nd-place points (2) — nobody 1st's 3, so nobody a night win and no banner
  plane** (`room-show.js#winnersOf` finds none). OVERCLOCK's body: ALL TIED + PTS EACH (no names on the sign, no fanfare); PRISM's: no WINNING
  BOARD. **The server** credits every one rank 1, no win (as before): the room check now expects the draw's 2 each — and still accepts the old 3
  each from a phone on yesterday's code, so no result is lost while the room updates; the snapshot path reads either entry as rank 1, no win.
  **A PARTIAL tie (two share 1st, others below) is unchanged**: both 1st, CO-WINNERS / DEADLOCK, 3 points + a night win each, the server credits
  both a win (`partialtie-overclock-390x844.png`). HOLD'EM: a tournament can't tie; a CASH session where every net is equal = the ledger (no
  champion — HE10's rule already). Proof: `tests/podium-tie.test.mjs` (3).

## The end
- Docs: this log, docs/harbor.md (the pass row + the billboard / signs notes), docs/holdem.md "HOLD'EM IN THE CITY", docs/profiles.md (THE
  BOARD's tabs + the HOLD'EM board), decisions.md, ROADMAP.md + docs/roadmap-history.md, plan.md's build table, CLAUDE.md, the mailbox (FROM CITY
  → TO HOLD'EM).
- THE LOCAL RUN: see "The run" below. Repo / deploy: + ~1.4 MB of shots in docs (not deployed — `.vercelignore`); no new assets on the site.

## The run (local, the mini PC)
(filled in at the end of the pass)
