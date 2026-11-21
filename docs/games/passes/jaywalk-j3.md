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
