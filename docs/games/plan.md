# THE GAMES — the owner's decisions, one pass at a time (the dated archive; the newest at the end)

## PW1 — THE PASSWORD: THE GAME (Nov 7 2026 — daily, ships OFF)
- THE PASSWORD (id `password`): a DAILY-ONLY solo Wordle-type. Two doors in a row — THE DOOR, then THE BACK ROOM — each a 5-letter word, 6
  guesses each (normal Wordle difficulty; trap words like _ATCH are allowed). ~4 min. No practice, archive or multiplayer mode.
- Score: doors opened first, then total guesses (lower = better). Missing door 1 ends the run. ONE comparable number: score = (2 − doorsOpened)
  × 100 + guessesUsed (a clean crack = 2…12; lower is better), tie-break = total time.
- THE SERVER JUDGES EVERY GUESS: the answers live ONLY on the server and are never sent to the phone until their door closes (solved or failed —
  then that door's word may be shown). A door never attempted is never revealed. A guess that isn't a real word is refused before it counts
  (the phone pre-checks against the public data/words/valid-5.json; the server checks again).
- Answers: a NEW SERVER-ONLY list (api/_data/pw/), never served, never imported by a page — NOT data/words/answers-5.json. Common, everyday
  5-letter words; no plurals, no past tenses, nothing obscure; kid-safe (no rude, adult, alcohol, drug, violent or gloomy words).
- The day's two words come from a SECRET SCHEDULE: the server's pepper (api/_lib/dailies.js dailySeed) orders the list; two words a day; no word
  repeats until the list is used up. Never computable from the date (the repo is public).
- Daily rules: one try a day (the 4 am Eastern streak day), resume after a refresh / app switch, never a restart. If the room starts a game
  mid-run, NOTHING is lost or counted (no clock, no open question): letters typed but not sent are cleared, and the run resumes on the same
  door / next guess. (THE DAILY MODULE owns the banner, the pause and the RESUME chip — later.)
- Board: a 6 × 5 grid of 58 pt tiles, the kit LETTER KEYBOARD below (keys ≥ 54 pt), the submit key reads ENTER, the delete key is a DRAWN icon
  (no "⌫" glyph — no emoji or text symbols as icons anywhere in the game).
- Marks (colour-blind house rule — never by colour alone): RIGHT = a solid --good tile + a thick bright bar along the bottom; CLOSE = an
  outlined --close tile (dark centre) + a small solid dot top-right; MISS = flat and dim. The keys show the same marks, smaller. Standard Wordle
  duplicate-letter rules.
- Looks: NIGHT = neon (this pass). DAY = "C1 clear morning sky" (PW2). The game draws no look switch: it reads the Settings look (kit look.js /
  LOOK_EVENT) and must re-theme live (PW2 builds the live swap; this pass keeps every colour in tokens so the day look drops in).
- Rewards (PW2): KEYHOLE emblem (any full crack), SAFECRACKER card (a low score — threshold set by simulation).
- The daily stays `on: false` until THE SWITCH-OVER (repo private first).

## PW2 — THE PASSWORD: THE POLISH (Nov 7 2026 — daily, still ships OFF)
- RENAMED: the first door is THE FRONT DOOR (was "THE DOOR") — THE FRONT DOOR → THE BACK ROOM, everywhere (UI, docs, tests, e2e, share line).
- NO PILLS (Ben, standing for the dailies): no rounded pill / capsule chips anywhere — door progress, stats, labels are drawn objects or plain
  neon type. Buttons use a modest corner radius, never a capsule.
- DOOR PROGRESS = two small DRAWN NEON DOORS (~34 × 44 pt) joined by a short line, text beside each: the door's name in small neon type + one
  line under it (opened → "4 GUESSES", current → "4 OF 6 LEFT", held → "HELD"). Locked = a dim outline; current = lit pink, gently pulsing;
  opened = swung ajar, warm light spilling out, green frame. One line at 390 wide. The old "DOOR 2 · THE BACK ROOM · 4 OF 6 LEFT" line is gone.
- THE END SCREEN: when the run ends the board + keyboard leave; one clean screen: the sign · the two doors · "YOU'RE IN" big neon (or "THE FRONT
  DOOR HELD" / "THE BACK ROOM HELD", sized to fit) · ONE big number ("7 GUESSES") with the time small under it — no stat boxes, no score line,
  no repeated numbers · both doors' MINI GRIDS side by side (marks incl. bar / dot, no letters) with each door's word under its grid · SHARE ·
  "NEXT PASSWORD IN 13:39:21" (to the next 4 am Eastern).
- SAFECRACKER card = cracking both doors in 6 guesses or fewer combined (≈ the best ~10% of runs; the simulation checks it). KEYHOLE emblem = any
  full crack. Awarded by the SERVER on finish, never the phone.
- SOUNDS: the dailies chat's picks (Downloads\grok\dailies-sfx\CLAUDE-SFX-REVIEW.md) are final.
- THE END SCREEN, Ben's iPhone review (the ADD-ON, Nov 7 — built as PW2's last group): the crack headline is WELCOME IN (big green neon); BOTH fail cases read
  LOCKED OUT (big red neon, the same size + weight — the door row says which door stopped you) — on the end screen, the share image, the docs, tests + e2e.
  No big number on a fail: one small line under LOCKED OUT ("6 GUESSES · 2:15"); the big number stays for WELCOME IN only. The door that stopped you
  reads LOCKED OUT in red (no "HELD" anywhere); a door never reached is just dim with NO label. No dev / status text on the end screen (a finish still
  saving shows nothing). NOT TOP-HEAVY: the result block (headline → number / line → mini grids → words) sits just under the door row, SHARE + the
  countdown together below it, the leftover space at the FOOT (390 / 402 / 430, both looks).

## CC1 — COAST CLEAR: THE GAME (Nov 7 2026 — daily, ships OFF)
- COAST CLEAR (id `coastclear`): a DAILY-ONLY solo Minesweeper-type. Slip a small boat across the night harbor past hidden patrol SEARCHLIGHTS;
  flags are BUOYS. Kid-safe (no rum-running). ~2–4 min. No practice, archive or multiplayer mode.
- Board: 9 × 12 (9 wide), ~18 searchlights, ~38 pt cells (fallback 8 × 11 at 42 pt if taps prove cramped). NO-GUESS boards only — a solver proves
  every board can be finished by pure logic, never a 50/50. Everyone gets the same board AND the same pre-opened safe area that day.
- THE SERVER KEEPS THE BOARD AND ANSWERS EVERY DIG: an unopened cell's content never reaches the phone. The phone shows the tap at once (the
  tile presses down) and the number pops in when the answer lands; taps never wait for each other (pipelined). Buoys are placed on the phone only
  (no server call). The clock runs on SERVER time.
- Moves: DIG (tap) reveals a cell — a 0 opens its whole calm area in one answer. FLAG via a big DIG / FLAG switch in the thumb zone, or long-press
  a cell. Tap a revealed number whose buoys are all placed to CHORD (open its other neighbours) — one call.
- SPOTTED: digging a searchlight = +30 s, keep going, the light stays shown; the 3rd spot ends the run. A win = every safe cell opened.
- Score = server time + 30 s per spot + 15 s per pause (lower = better); a caught run (3 spots) ranks below every finished run.
- If the room starts a game mid-run: the clock PAUSES on the server + a flat +15 s per pause (THE DAILY MODULE owns the banner / chip; this game
  records the pause and resumes cleanly).
- NO PILLS: the status (time, spots, buoys) is plain neon type + drawn objects, never capsule chips or stat boxes. NO EMOJI. No dev text on screen.
- Looks: NIGHT = neon harbor (this pass). DAY = a sunny harbor matching THE PASSWORD's "C1 clear morning sky" (CC2). Every colour in tokens; the
  game reads the Settings look and must re-theme live (CC2 builds the live swap).
- Rewards (CC2): LIGHTHOUSE emblem (any clear), GHOST RUN card (zero spots under a time set by simulation).
- The daily stays `on: false` until THE SWITCH-OVER.
