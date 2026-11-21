# JAYWALK J3 — THE DAILY: TIME BOARDS · THREE TRIES ALL DAY · THE RED SNEAKER — Nov 21, 2026

**RE-PUBLISH: nothing** — no rules change (the day's split board is server-only under `dly/`; no phone reads or writes it).
The detail lives in `docs/jaywalk.md` "J3"; the owner's decisions in `docs/games/plan.md` "JAYWALK J3".

## STEP 0
`docs/games/plan.md` "JAYWALK J3" (4cc86b44). The lab export at the start: 224 marks, no open FIX. The inbox: no open entry for this pass.
`git pull --rebase` at the start: up to date (the HIGH RISE chat's daily had not landed yet).

## GROUP 1 — THREE TRIES ALL DAY (the phone; no rules change)
- `daily-run.js`: the STOP button, its TAP AGAIN TO STOP confirm and its CSS (`css/daily.css .dy-jw-stop`) are gone — a try ends only by a hit or
  THE MOTHERSHIP. The end card: TRY AGAIN (main) · "n TRIES LEFT" · **COME BACK LATER** (secondary — back to THE DAILIES, `onBack(false)`, no
  `markTriesDone`, no stamp). After the 3rd try: ADMITTED + BACK TO THE DAILIES (unchanged). Hiding / leaving / a refresh still END the try.
- The ticket: JAYWALK's DAILIES row gains `allDay: true`; `today-logic.js#ticketState` ignores the per-phone DONE for an `allDay` row — between
  tries it shows LAST TRY · DAILY BEST · TRY AGAIN · n TRIES LEFT all day from the SERVER's tries (`today`'s `tries` — a restart / another phone
  the same); ADMITTED only after the 3rd try. **Named (shared, generic):** `today.js#triesDone` / `markTriesDone` + the `done` option of
  `ticketState` are KEPT for any other `tries` daily (HIGH RISE's daily, if it wants a DONE) — only a row with `allDay` skips them.
- Tests: `tests/jaywalk-j3.test.mjs` (a try, then 7 hours later on the server's pure half → TRY AGAIN offered; the 3rd → ADMITTED; a 4th
  refused; 4 am → a fresh day; no STOP / no markTriesDone in the code) · `daily-b.test.mjs` (the STOP check flipped: never a STOP) ·
  `e2e-jaywalk-daily-run.mjs` (no STOP element in the run · the end card TRY AGAIN · 2 TRIES LEFT · COME BACK LATER, no DONE · COME BACK LATER →
  the ticket still TRY AGAIN · 2 TRIES LEFT, `dy:done` unset).

## GROUP 2 — THE TIME BOARDS (server + screen) + THE SHARE LINE
- **The board**: `dly/jaywalk/{day}/sp/{pid}` = the best tick per 50 from any closed try (the SERVER's replay splits — J1's `sp` on each try),
  raised by one transaction at every close (`api/daily.js#creditQuiet` → `api/_lib/jaywalk-times.js#daySplits`; the cartridge says
  `splits: true`). A day older than J3 is built ONCE from its records (`dayBoard` → `spb`). PURE half: `js/core/jw-times.js`.
- **`every`** (EVERYONE · TODAY): `times: { tabs, b: { lane: { rows, me?, more } } }` — one read of the day's board, DON'T COUNT + THE THROWAWAY
  GATE out (a gated YOU unranked, NOT COUNTED), faces fetched only for the rows that can show, the lanes cut (10 · SHOW ALL 50) + your place
  below; only once you have played. **`today`** (YOUR TABLE): `jt` — you + the friends with a counted result, the view built on the server.
- **The screen** (`js/screens/daily.js`): JAYWALK's TODAY panel (both scopes) gets THE NEON TABS row (one sideways-scrolling row, kept over a
  repaint): MOST LANES (default) · FASTEST TO 50 · TO 100 · … (a tab only for a 50 reached in that scope); a time row = place (medals 1–3,
  equal times share a place) · the slim card · `m:ss.t`. ALL TIME unchanged. The phone imports only `core/jw-time-text.js` (no tuning.js).
- **The share card**: `shareOf` adds `hs` (the highest 50 reached today + its best tick); `daily-share.js` draws ONE small line "TO 150 · 2:03"
  under BEST OF 3 (section + own card; the bars step down for it). Named: it sits under the stat line, not between the big number and the stat
  — THE ONE RULE keeps every section's name / big / stat rows level across the card (there is no room between them at 84 / 32 px).
- Tests: `tests/jaywalk-j3.test.mjs` (best of 3 per split; tabs only for 50s reached; ties share a place; the cut + your place; hidden rows
  never re-rank; a gated YOU unranked; a refused try has no splits; the share line; the VIEW rule — no points / ALL TIME / DAILY BEST file reads
  the board) · `daily-jaywalk.test.mjs` "J3 — THE TIME BOARDS" (/api on the emulators: the board = the records' best splits; `every`'s tabs + your
  time; a same-day account never listed, its own row NOT COUNTED; a player who has not played gets no times; `today`'s jt; the BUILD from the
  records gives the same board; the points unchanged) · `e2e-jaywalk-daily-run.mjs` (the real phone: the board = the replay splits, the share
  line, `every` + `today`, the tab row MOST LANES · FASTEST TO 50 ≥ 44 px, FASTEST TO 50 lists your time).

## GROUP 3 — THE RED SNEAKER
`core/marks.js#MARKS.jaywalk` tube 1 `#ff4fc4` → **`#ff3344`** (hue ≈ 355°: red — pink is ~322°, orange 25°+). Sole / laces + speed lines unchanged.
ONE definition: the PLAY sheet, PICK A GAME, the card art, the share image follow. The ticket's ink untouched (the HIGH RISE chat's).

## THE VISUAL REVIEW (390 × 844 + 375 × 667, night + day — `Downloads\NEON\jaywalk-j3\`)
- The boards: `daily-board-{lanes|to50|to150}-{everyone|friends}-{night|day}-{390x844|375x667}.png` (the preview's `&jwt=1` — sample server
  splits through the REAL `timeView`; BEN + ROOK tie at 50 → both 3RD, the next 5TH). The end cards + the ticket: `daily-endcard-try1-*`,
  `daily-endcard-try3-*` (a real phone on the emulators — `e2e-jaywalk-daily-run.mjs` with `J3_SHOTS=1`), `daily-ticket-between-*` (the preview:
  the emulator's run shows THE TEST DAILY — kept out of the owner's shots). The share: `daily-share-{night|day}` (4 sections) +
  `daily-share-own-*` (2). The mark: `sneaker-marks-390x844.png` (`marks-preview.html?before=1` — red beside the old pink, 24 · 32 · 40 · 64).
- **Refine 1** — the tab row cut its last word at the panel's edge ("TO 15") — read as broken text → the row's ends FADE (a mask; 22 px of end
  padding so the last tab clears the fade when scrolled to the end).
- **Refine 2** — YOUR FRIENDS' time rows wore EVERYONE's deco medals while the same panel's lanes list ranks "1ST / 2ND" in words → the friends
  scope ranks in words on every tab (medals stay EVERYONE's).
- **Refine 3** — the share section's "TO 150 · 2:03" touched "BEST OF 3" on the 4-section card → 10 units lower, the bars stepped down with it.
- THE RED SNEAKER reads RED at every size by night and by day — clearly apart from the pink before-row, nowhere near orange; the white sole /
  laces + the cyan lines unchanged; the card art (bottom) glows red.

## THE FRESH-EYES REVIEW (a reviewer agent on `4cc86b44..HEAD`, read-only — "nothing serious"; the board transaction, no pid in a public row,
the gating, the run's ends, the DONE path for another daily all checked clean). Its findings, and what this pass did:
- MEDIUM — ties were ranked by the raw tick while a row prints tenths (two "0:30.0" rows read 1ST + 2ND) → **fixed**: `timeRows` ranks by the
  tenth shown (`tests/jaywalk-j3.test.mjs`: 1800 + 1805 ticks = one place, 1806 the next).
- LOW — a row past the faces' margin with no public face came out as a blank strip → **fixed**: left out like a hidden profile (places kept).
- LOW — the one-time build merged with a plain update (a try closing during it could lose a faster split) → **fixed**: each player's row
  raised by its own transaction, then `spb`.
- LOW — `jaywalk-times.js` hard-coded `dly/jaywalk/…` behind a generic `splits` flag (a trap for HIGH RISE's daily) → **fixed**: the path
  from the cartridge's id (`dly/{game}/{day}/sp`).
- LOW — two conditional checks in the /api test → the refused-try check is now unconditional (the forged log = the WHOLE log in one chunk
  10 ms after GO), the same-day account is checked by its board id; the tie check stays conditional (two bots rarely tie — the unit test pins ties).
- LOW — a dead `markTriesDone` import in `js/screens/daily.js` → removed.
- LOW — reads per call (faces for each tab's top + a margin; `today` + ≤ 13 small `sp/{pid}` reads once a JAYWALK result is in) → kept: bounded,
  cached; named.
- LOW (older than J3) — the dock's DAILY button + THE SWEEP count JAYWALK done after ONE try while the ticket says TRY AGAIN → kept (one try
  played = the day's result — the owner's own line); OPEN FOR BEN 2.

## THE FINAL RUN (local, the Beelink — my own emulators + `DAILY_TEST=1 serve.mjs --emu`)
- unit `node --test tests/*.test.mjs` **2,505 / 2,505** (+ `jaywalk-j3` 8)
- the real switch (v1 today): `e2e-jaywalk` FAST **102 / 102** · `e2e-jaywalk-match` FAST **103 / 103** · `e2e-daily` **122 / 122** (the first try
  stopped at THE PASSWORD's word: my /api test had wiped the daily secret under a running server — re-run on a restarted server, green; the
  known "E2Es after server tests" trap) · `e2e-jaywalk-daily-run` v1 **67 / 67** with the time boards exercised (+ 68 / 68 night and day with
  `J3_SHOTS=1`; one seed's course stopped the bot short of 50 on every try → **60 / 60** with the time checks honestly skipped — the test now says
  so, and try 2 plays on toward a split) · smoke **24 / 24** · `jaywalk-lab --perf` **132 / 132**
- v2 (`JW_CV=0` against a `JW_CV_SWITCH_MS=0` server): `e2e-jaywalk-daily-run` **60 / 60** (that seed: no 50 reached) · `e2e-jaywalk` **102 / 102** ·
  `e2e-jaywalk-match` **101 / 101** (the moment checks vary with who goes out first)
- rules `rules.test.mjs` **100 / 100** · `/api` `server.test.mjs` **72 / 72** · `daily-jaywalk.test.mjs` **8 / 8** (one earlier run saw the strong
  bot die at 28 lanes under the weak one's 178 on a fresh random daily secret — the THREE TRIES test's own seed luck, older than J3; not chased)
- JAYWALK's room preload graph unchanged (43 modules, 496 KB — `build-preload-graph.mjs`: no diff); no draw call added (the run untouched).
- HIGH RISE's daily: not on main yet when this pass pushed (the HIGH RISE chat's) — the shared pieces changed generically: `ticketState`'s
  `allDay` (off unless a row says it; DONE kept), `daily.js`'s time tabs (only when an answer carries `times` / `jt`), `jaywalk-times.js` keyed
  by the cartridge's id.

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change). J2's `database.rules.nov21-j2.json` is still yours before Nov 27.
2. The dock's DAILY button + THE SWEEP count JAYWALK done after its FIRST try (one try = the day's result) while the ticket keeps TRY AGAIN ·
   n TRIES LEFT all day. Keep that, or should the dock keep nudging until all 3 are used?
3. Calls named (overrule any): the share's best-time line sits under BEST OF 3 (THE ONE RULE — no room between the big number and the stat);
   the boards print `m:ss.t`, the share card `m:ss` (your example "1:14"); the time boards show only once you have played (the scores' rule);
   a same-day account is never on a time board (shown to itself as NOT COUNTED); YOUR FRIENDS ranks in words, EVERYONE with the medals; the
   red is `#ff3344`.
