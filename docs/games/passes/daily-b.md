# DAILY B — the tickets (DAILY BEST + place) · JAYWALK's daily, phone half · SHARE TODAY's JAYWALK section · the sweep meter · 4 tickets fit (Nov 18 2026)

The owner's decisions: `docs/games/plan.md` "DAILY A / B — approved Nov 18" + "DAILY B — approved Nov 18" (Step 0). JAYWALK's row still ships
OFF. The inbox: no OPEN entry addressed to this pass (start, after each group, before the final tests). The lab export: 224 marks, no open FIX.

## GROUP 1 — THE TICKETS (all dailies — docs/progression.md "DAILY B — THE TICKETS + THE SWEEP METER")
- ONE pure rule: `js/daily/today-logic.js#ticketState` (+ `bestLine`, `placeLine`, `tryEndedLine`), drawn by the SHARED ticket.
- BEFORE: "DAILY BEST · 4 GUESSES / 1:12 / 3:41 / 168 LANES" in the ticket's own ink once there is a best from an EARLIER day; else the hook.
- DONE: the result + "2ND OF 5 PLAYERS"; a NEW DAILY BEST = the gold foil text in its place; the first best never gold.
- THE SWEEP: one segment per live daily, each in its ticket's ink; the count words are gone (the meter is the count).
- 4 TICKETS FIT at 375 × 667 / 390 × 844 / 430 × 932, both looks — the tighter ticket only at ≤ 380 pt (named below); proven by the FIT checks.

## GROUP 2 — JAYWALK's TICKET
- `TICKET_ART.jaywalk` = the walk signal (its rounded box + the figure) in the owner's orange; BEFORE / BETWEEN TRIES (the last try big, DAILY
  BEST, TRY AGAIN + "2 TRIES LEFT") / ADMITTED (no try left or DONE); SCORES unlock after the first finished try (the server's rule).

## GROUP 3 — JAYWALK's DAILY, PHONE HALF (docs/jaywalk.md "THE DAILY — THE PHONE HALF")
- `js/games/jaywalk/daily-run.js` (lazy, `screens/daily.js#DAILY_RUNS` — outside JAYWALK's preload graph) runs the REAL view through ONE adapter
  (`state.jwDaily` in view.js): the day's seed + the server's go from START, the chunks on the proof node, `e` awaited before FINISH, the
  SERVER's lanes on the end card. STOP (a second tap), hidden / leaving / a refresh = the try ends (FINISH with keepalive), THE ROOM WINS =
  "TRY ENDED · N TRIES LEFT", nothing held.
- Cards + YOUR BEST: every try the server closes credits its REPLAYED feats + lanes (`api/_lib/jaywalk-credit.js`, `api/daily.js#creditTry`).
- The share line: "JAYWALK · BEST OF 3 · 143 LANES".

## GROUP 4 — SHARE TODAY's JAYWALK section
- `js/games/jaywalk/daily-share.js` (lazy, SECTIONS): JAYWALK (white) · the best · BEST OF 3 (· NEW DAILY BEST) · 3 try bars; the server's
  spoiler-free inputs (`jaywalk-tries.js#shareOf`). 4 sections evenly scaled — checked at full size + a 360-px downscale, both looks.

## GROUP 5 — /admin + GO LIVE
- GO LIVE AT THE NEXT 4 AM (`progress/dlive` — liveFrom) opens JAYWALK exactly like THE DROP: proven in the browser (e2e-jaywalk-daily-run.mjs
  — 4 tickets, 4 segments; the card's 4 sections). The row ships `on: false`.
- `tests/integration/jaywalk-daily.html` KEPT as an owner tool (THE LOCAL JUDGE on a plain server — the only phone link to the daily's judge
  before the row goes live).

## OBVIOUS CALLS, NAMED
1. **The row drops `ownMusic`.** JAYWALK's own music IS the look's mood station (`index.js#musicFor`), which is what the console plays for a daily
   run without the flag; its view plays no songs, so `ownMusic` would have meant a silent run.
2. **DONE is per phone** (`today.js#markTriesDone`, per day): on another phone the ticket still offers the unused tries (they are real).
3. **STOP asks for a second tap** (`confirmTap` — TAP AGAIN TO STOP): a mis-tap never costs one of three tries.
4. **The tighter ticket only at ≤ 380 pt**: at 390 it moved e2e-daily's tap sweep onto a run (a plain-area tap reached RESUME); 390 keeps its
   tested layout and 4 tickets fit there as they are.
5. **The end card is the game's dark veil in BOTH looks** (its tubes stay the night's; the ‹ turns white over it by day — the reviewer's find).

## THE SIZES
- JAYWALK's PER-GAME BUDGET: 2,508,718 of 2,508,800 B (was 2,508,721 — view.js's adapter paid for by shortening its own comments). The boot
  untouched. Nothing raised.

## THE FRESH-EYES REVIEW (a fresh-context reviewer over the full shot set — its report verbatim)
> DAILY B fresh-eyes review (all 23 PNGs opened)
>
> FINDINGS
> 1. e2e\jr-02-run.png + e2e-night\jr-02-run.png: the bottom ~200 px (about 25% of the screen) is empty: flat pale blue by day, black by night. At 21 lanes in there should be ground behind the kid. The end cards (jr-03-end1, both looks) show the same seam: the veil stops at about y=640 and flat grey fills the rest. It looks like the 3D canvas is shorter than the viewport. Check it against the normal solo run. If the solo run fills the screen, this is a BLOCKER; otherwise SHOULD FIX.
> 2. t1-*\page-390x844, page-430x932, e2e\jr-01, jr-06, e2e-night\jr-06: a blank band of 90–140 px sits between the tabs and THE SWEEP. It looks like something failed to load, and it pushes SHARE TODAY and the countdown down. At 375×667 the band is gone. SHOULD FIX.
> 3. t1-*\page-375x667 + 390x844, t3-5499cb: JAYWALK's "DAILY BEST · 231 / LANES" breaks so "LANES" sits alone on a second line. The same happens in t2 with "2:38.9 · 101 / LINES". At 430 the line fits. Keep the number and its unit together. SHOULD FIX.
> 4. e2e\jr-04-today-between-390x844.png: the SAVE YOUR KEY sheet covers the screen, so the real-app between-tries state can't be reviewed. It also means that sheet interrupts a player right after their first daily try. Recapture the shot, and decide whether the sheet should wait. SHOULD FIX (the capture).
> 5. Between-tries ticket (all t1): "143 LANES" shows big with no label, and the smaller DAILY BEST of 231 sits under it. A player could read 143 as their result. A "LAST TRY" label or similar would fix it. NIT.
> 6. THE SWEEP lights JAYWALK's segment after one try with 2 tries left (t1, t3-5499cb, jr-06). If the meter means "done", that is ambiguous. Confirm it's intended. NIT.
> 7. "N° 1108" ticket serial (every ticket shot, both looks): about 9 px of grey on cream or dark purple. It likely fails 4.5:1 and is hard to read at 375. NIT (decorative, but it is text).
> 8. Day ADMITTED stamp on THE PASSWORD (t1-day): pale blue with worn texture on cream, the faintest stamp of the set. It is the main "done" signal. NIT.
> 9. t2-5f3125: COAST CLEAR's "2:12" is followed by a tiny searchlight glyph that reads as a stray mark at phone size. THE DROP shows "DONE FOR TODAY" where the others show a place line. NIT.
> 10. Night ticket screens (t1-night, t3-5499cb, e2e-night\jr-06): every PLAY is a pink MAIN tube, up to 5 on one screen, against the ONE-pink-MAIN rule. Probably pre-existing. NIT.
> 11. e2e\jr-03-end1.png (day) has no back chevron; the night end card does. NIT.
> 12. share-night + share-day 1080×1350: faint vertical hairlines at x≈280 and x≈800 run top to bottom and look like leftover guides. Section header colours mix green (PASSWORD, COAST CLEAR) with white (DROP, JAYWALK), which doesn't match the ticket inks. NIT.
> 13. share-small-*\page-360x450: the sub-lines ("2:54", "1 SPOTTED · +30 s", "101 LINES", "BEST OF 3 · NEW DAILY BEST") are about 6 px and unreadable at preview size. The three JAYWALK bars carry no numbers, so they only make sense next to the headline. NIT.
>
> CLEARLY GOOD — the tickets read at once in both looks and at all three widths; the ADMITTED stamps + the gold NEW DAILY BEST; TRY AGAIN + "2 TRIES LEFT"; the end card's hierarchy in both looks; STOP legible over both skies; the TRY ENDED banner; the 1080 share card; no emoji, no pills, no developer text (but the test-only TEST SLOT tag + TEST DAILY ticket).

**What became of each point:** 1 — not a canvas fault: that band is JAYWALK's WALL (THE FOG BANK by day, the blackout by night) chasing the kid
from behind — the same in a solo run and a match (the game's design, H5B); the end card's veil covers the scene above it. · 2 — pre-existing
(DFIX3's TODAY CENTRED: the block sits mid-way by auto margins). · 3 — FIXED before the review's late shots (t1-* predate it): a DAILY BEST
line wraps only before its value ("DAILY BEST ·" / "231 LANES"); THE DROP's "2:38.9 · 101 LINES" result is pre-existing. · 4 — pre-existing
(SAVE YOUR KEY after a counted play over THE DAILY SCREEN — `keypop.js#KEYPOP_COVERED` covers the RUN, not the screen) → OPEN FOR BEN. · 5 —
the owner's own spec ("the last try big") → OPEN FOR BEN. · 6 — the owner's decision (the FIRST finished try counts the day — THE SWEEP).
· 7, 8, 9, 10, 12, 13 — pre-existing (DFIX3 / DFIX5 / SKINS 2B), listed for the owner. · 11 — FIXED (the ‹ is white over the end card by day).

## THE FINAL RUN (the Beelink; fresh emulators + `DAILY_TEST=1 node scripts/serve.mjs 5173 --emu`, nothing else busy)
- unit 2,234 / 2,234 (+ `tests/daily-b.test.mjs` 9) · rules 86 / 86 · /api: daily-jaywalk 7 (+ YOUR BEST, the cards' flags, the share inputs —
  on FRESH emulators: a re-run on the same emulators reuses its players' tries) · daily-drop 15 · daily-module 22 · coastclear 17 · password 11
  · progression 10 · server 66 (then fresh emulators for the browsers)
- e2e-daily 121 / 121 (first) · wk-press 47 / 47 · e2e-jaywalk-daily (DAILY A's) ALL GREEN · e2e-coastclear (FAST) 42 / 42 · smoke 21 / 21 ·
  e2e-jaywalk-daily-run 51 / 51 (24 FIT checks + the day; `LOOK=night` too)
- Not run: the harbor groups (no city file touched).
- Shots: `Downloads\NEON\daily-b\` (t*, share-*, e2e, e2e-night).

## OPEN FOR BEN
1. **No rules change** — nothing to re-publish (DAILY A's `dly/jaywalk/$day/w/$uid/$try` still needs its re-publish if not done).
2. JAYWALK's row ships OFF: /admin → THE DAILIES → GO LIVE AT THE NEXT 4 AM when you want it (proven on the emulators).
3. The between-tries ticket shows the LAST try big with no label ("143 LANES" over "DAILY BEST · 231 LANES") as specified — a "LAST TRY ·" prefix?
4. SAVE YOUR KEY can open over THE DAILY SCREEN right after a counted daily (pre-existing — keypop covers the run, not the screen): hold it there too?
5. JAYWALK's daily music = the console's mood station by look (the row's `ownMusic` dropped — see the calls above). A song set of its own instead?
6. DONE is per phone (the tries stay real on another phone).
7. The reviewer's pre-existing list: the ticket serial's contrast, THE PASSWORD's pale day stamp, several pink MAIN PLAYs on one screen, the
   share card's faint column guides + its 6-px sub-lines at 360 px, THE DROP's ticket saying DONE FOR TODAY (no place line on that run).
