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

## CC2 — COAST CLEAR: THE POLISH (Nov 7 2026 — daily, still ships OFF)
- COAST CLEAR's switch reads DIG / BUOY (kept).
- END SCREENS: the board + the DIG / BUOY switch leave. WIN = "COAST CLEAR" big green neon with the lighthouse beam sweeping behind it (the small
  top sign steps aside — the name never shows twice) · one big time ("2:41") · a small line ("0 SPOTTED" or "1 SPOTTED · +30 s"). CAUGHT (3rd
  spot) = "CAUGHT" big red neon · NO big time — one small line ("3 SPOTTED · 1:58"). Both: the finished harbor shrunk down (numbers, buoys, every
  searchlight revealed) · SHARE · "NEXT HARBOR IN 13:06:44" (to the next 4 am Eastern). No pills, never top-heavy.
- SHARE shows NO BOARD (everyone gets the same harbor — a picture would give the searchlights away): the headline, the time (or the caught line),
  three small drawn searchlight icons (lit per spot), neonspeakeasy.com + one plain line "COAST CLEAR #<n> · 2:41 · 0 spotted · neonspeakeasy.com"
  (#n from the same epoch as THE PASSWORD).
- GHOST RUN card = a clear with ZERO spots under a time set by simulation so ≈ the best ~10% of clean runs earn it. LIGHTHOUSE emblem = any clear.
  Both awarded by the SERVER from its record.
- COAST CLEAR: a CAUGHT run reveals every searchlight on its end screen (KEPT, Ben Nov 7 — a winner knows them all anyway; one try a day).
- FABLE REVIEW #1 (THE PASSWORD + COAST CLEAR) run read-only; its report: docs/games/review-dailies-1.md.

## DFIX1 — THE DAILIES: FABLE REVIEW #1's FIX PASS (Nov 7 2026 — both still ship OFF)
- A run keeps ITS OWN DAY: every daily call carries the `day` its `start` returned; the server accepts it for today or yesterday when the
  player has a start on that day — a run that crosses 4 am Eastern finishes on its own day.
- COAST CLEAR pauses are capped: at most 3 pauses a run AND at most 20 minutes paused in total; past either cap a pause is refused and the
  clock keeps running (+15 s per accepted pause, as before). (THE DAILY MODULE will also check the player's room really started a game.)
- THE PASSWORD's word list: the ADULT-VOCABULARY group from the review is cut (banal, trite, pithy, terse, fjord, segue, …). The MEAN words
  (taunt, snide, sneer, spite, catty, dorky, inane, vapid, …) and the GLOOMY words (gaunt, eerie, dingy, …) STAY (Ben's call).
- THROWAWAY PROFILES (for THE DAILY MODULE — NOT this pass): a daily only COUNTS (standing, THE BOARD, rewards, ranking) if the profile
  existed before that day's 4 am Eastern start; same-day new profiles can still play but don't rank / award; plus a per-IP limit on new
  profiles. (Chosen over the review's "3 counted matches" floor, which would block solo players.)

## DM1 — THE DAILY MODULE: THE ENGINE (Nov 8 2026 — every daily still ships OFF)
- OVERCLOCK 6 is DROPPED as a daily (Ben, Nov 8). Its built daily plug-in stays in the code, off and unused; THE DAILY MODULE does not wire
  it. The dailies are THE PASSWORD + COAST CLEAR, with a slot for a THIRD daily (TBD, built later).
- PLUG-AND-PLAY DAILIES: no fixed count anywhere. config.js#DAILIES drives the picker, the TODAY rows, the SCORES tabs, the dock badge, the
  sweep, SHARE TODAY (fits 1–6 rows), PERFECT WEEK and the daily XP cap. Adding a daily = its cartridge (D2) + one line in the list.
- THE SWEEP = finishing ALL of today's dailies (however many). The dormant achievement "THE TRIPLE" (catalog id the-triple, emblem emb-stars) is
  RENAMED "THE SWEEP" and counts today's dailies from the list (keep its id + emblem so nothing breaks).
- THE THROWAWAY GATE: a daily only COUNTS — standing, the everyone band, YOUR TABLE rank, THE BOARD, rewards — if the player's profile EXISTED
  BEFORE that day's 4 am Eastern start. A same-day new profile can still play (and keeps its streak / XP as usual) but its result doesn't rank
  or award. Plus a per-IP limit on new profiles and a per-player limit on daily calls.
- THE PASSWORD's word schedule is FROZEN (the order fixed once, so later list edits never reshuffle days already scheduled).
- THE ROOM WINS (server side): a daily pause is accepted only when the player's room really started a game.
- PENTHOUSE card = top 1% of a daily (DM2 builds the card — design "A · THE DIAL", drawn in code).
- The go-live switch exists but stays OFF until THE SWITCH-OVER (repo private first, then fresh reserves / schedules, then on).

## DM1 ADD-ON — THE DAILY SWITCH, CHANGED PLAN (Nov 8 2026 — Ben, via the city chat)
- THE GO-LIVE SWITCH can be flipped ON for everyone at ANY time — not tied to THE SWITCH-OVER (supersedes "stays OFF until THE SWITCH-OVER" above).
  Ben turns the dailies on for real while the repo is still PUBLIC (him + a few friends for months — the public code is an accepted risk); only
  later, when he tells people: the repo PRIVATE + a FRESH reserve. Owner-only, server-side: off → production refuses every daily, on → they answer.
- NOTHING SECRET IN THE REPO while public: THE PASSWORD's frozen schedule (and anything that would reveal a future day) lives ONLY in server-only
  database paths — never a committed file (a test checks every tracked file).
- A DEDICATED DAILY SECRET: the days (THE PASSWORD's word order, COAST CLEAR's boards) come from their OWN server secret, never the shared pepper —
  rotating it can never break tags, keys or anything else.
- ONE EASY RESEED COMMAND (`node scripts/dailies-reseed.mjs`): rotates the daily secret + rebuilds THE PASSWORD's schedule + COAST CLEAR's future
  boards from it, from the NEXT 4 am day — today's run and every past result untouched; safe twice; prints what it changed; a dry-run flag.

## DM2 — THE DAILY MODULE: THE SCREENS (Nov 8 2026 — the dailies still ship OFF; the owner's switch turns them on)
- PERFECT WEEK = THE SWEEP on 7 days IN A ROW (any 7 consecutive daily-days, not tied to a weekday). Card art = card-perfect-week-backup.png.
- THE SWEEP bonus = +10 XP on the day every daily is finished (on top of DAILY_XP 15 each), once a day.
- PENTHOUSE = top 1% of a daily's COUNTING finishers that day: rank ≤ max(1, floor(n × 1%)) AND n ≥ 50 (BAND_MIN) — dormant until a day
  has 50 counting finishers. Card = design "A · THE DIAL", drawn in code.
- SCORES → ALL TIME is HIDDEN until BOARD 2.0 fills it (no empty tab, no "coming soon"); THE BOARD stays on the title dock until then.
- Same-day new profiles see one quiet line on their result: "YOUR SCORE COUNTS FROM TOMORROW".
- COAST CLEAR's PRACTICE HARBOR: a fixed 5 × 5 board shown the first time a player opens COAST CLEAR — three guided steps (tap a cell · what a
  number means · place a buoy), then "YOU'RE READY"; skippable; never scored; never the day's board. Any daily can declare a lesson like it.
- The title dock gains DAILY: [ JOIN ring ] [ pill: DAILY · BOARD · GAMES · YOU ] [ HOST ring ] (4 icons — the max at today's sizes).
  BOARD 2.0 later moves THE BOARD inside DAILY → SCORES → ALL TIME and FRIENDS takes its slot (the city chat's decided final dock).

## DM2 ADD-ON — THE RESEED SERVER-SIDE (Nov 8 2026 — the city chat)
- No Vercel setting is needed: DAILY_SECRET is optional (else a random key is made + stored in the database). Ben does nothing.
- THE RESEED runs SERVER-SIDE (the owner's rule: service-account keys NEVER go on his PC): /admin → THE DAILIES → RESEED · PREVIEW (the dry run)
  → RESEED NOW (a second tap) — the same reseedDailies(), audited like the switch. scripts/dailies-reseed.mjs stays for the emulators + tests only.

## FABLE REVIEW #2 — THE DAILY MODULE (Nov 8 2026 — read-only; the dailies still ship OFF)
- Nov 8: All six daily cards APPROVED in THE LAB by Ben: SAFECRACKER, KEYHOLE, GHOST RUN, LIGHTHOUSE, PERFECT WEEK, PENTHOUSE (THE DIAL).
- Nov 8: FABLE REVIEW #2 (read-only) reviews THE DAILY MODULE; its findings + Ben's iPhone notes on DM2 become the fix pass DFIX2. The dailies
  stay OFF until DFIX2 lands; then Ben flips the switch. The report: docs/games/review-dailies-2.md.

## DFIX2 — THE DAILIES FIX PASS (Nov 8 2026 — FABLE REVIEW #2's fixes + SLIM CARDS ON SCORES; the dailies still OFF until Ben flips the switch)
- Nov 8 — FABLE REVIEW #2's five questions, Ben: "go with all of his recommendations":
  1. Throwaways can still LEARN today's answers: ACCEPTED while the site is Ben + friends; when public → no reveal for a non-counting (same-day) run.
  2. PENTHOUSE is decided at the DAY'S CLOSE, against the day's final counting finishers — closed lazily by the first /api call after 4 am Eastern (no cron).
  3. THE ROOM WINS needs 2+ real players dealt into the started game (a room of one can't pause a daily).
  4. The host's "1 PLAYER IS MID-DAILY" line reads a flag on the player's room node (no polling, zero invocations) — a rules change; Ben re-publishes the rules.
  5. RESEED: the day cache is keyed by the day and cleared on reseed (the one-line clear in pickDay).
- Nov 8 — SLIM CARDS EVERYWHERE A PLAYER LIST SHOWS (Ben: "they look so good, we need to start using them"). The dailies' SCORES → YOUR TABLE uses them from DFIX2 on.
- BEFORE PUBLIC (not now): repo private + RESEED; no reveal for a non-counting run; batch COAST CLEAR's digs before ~350 players a day (Hobby's 1M invocations); dly/ cleanup before ~500 players a day.

## DFIX3 — THE DAILIES' FIRST-PLAY FIXES (Nov 8 2026 — the dailies LIVE; Ben's iPhone notes + two /admin fixes)
- Nov 8 — THE DAILIES WENT LIVE (Ben: rules re-published, switch ON). First real plays: THE PASSWORD fine; COAST CLEAR good but the DIG LAGS; the practice harbor glitched → CUT.
- Nov 8 — COAST CLEAR's lesson → a ONE-TIME HINT: one line under the board on a player's FIRST COAST CLEAR only ("EACH NUMBER = SEARCHLIGHTS TOUCHING THAT SQUARE"), once per player across devices.
- Nov 8 — THE PREMIUM TICKET: the DAILY screen's tickets become real admission tickets — paper grain (ambientCG Paper001, CC0), a punched stub, a serial "Nº MMDD", an ADMITTED stamp instead of the check circle, a lift shadow; night: neon edge + foil sheen. SHARE TODAY's image is rebuilt from the same ticket (date + streak flame), no spoilers.
- Nov 8 — /admin → THE DAILIES gets a stats block (started / finished per daily, today + 7 days) + TODAY'S PLAYERS with ADD FRIEND (the normal friend request); the admin page gets "‹ BACK TO THE CITY".
- Nov 8 — Card motion pausing while scrolling = SCROLL-PAUSE (VAULT 1B), kept on purpose.
