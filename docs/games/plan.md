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
- Nov 8 — DFIX3 ADD-ON (Ben, from the LIVE SCORES screenshot): YOUR FRAME on SCORES hugs the slim card exactly (drawn on the strip's own box, both looks); the empty-table hint ONCE at the foot of SCORES in the house small-caps ("ADD FRIENDS BY THEIR NAME TAG — THEIR SCORES LAND HERE"), never inside a panel; a table of ONE = the card alone, no rank (ranks from the second finisher); the DAILY screen's music button by day = light glass + the day text colour, at the screen's corner, clear of the title at 390 + 430 (night unchanged).
- Nov 8 — DFIX3 ADD-ON (Ben + the city chat): THE FADE ON LEAVING — site-wide, in the SHARED audio engine (js/audio/engine.js): every sound path ends on ONE MASTER gain; on hidden / pagehide / freeze the master ramps to 0 ON THE AUDIO CLOCK (scheduled synchronously — iOS may freeze the page's JS right after pagehide), the suspend follows ~110 ms later; back on screen (visible / pageshow / resume) the context resumes and everything ramps up from 0 (~150 ms) — never a jump to full. THE DIRECT PATH's plain <audio> (iOS ignores its volume) is paused at the start of the fade, the graph's voices after it. The clock watch, the unlock, the retries + the rebuilds unchanged. (The short high hum on leaving Safari = the old instant suspend mid-buffer.)

## PRISM DROP — THE REWORK PLAN (the owner's decisions, Nov 1–9 2026)
- WHAT STAYS: the pure engine (rotation + kicks, 7-bag, the 1/120 s tick, lock delay, hold, twists, back-to-back, combos, perfect clears), the battle netcode (identical pieces, own board per phone, attacks + delays, the 3 s save / restore), the musical SFX on the song's beat + key, the tests. The look, the layout and the clarity are reworked.
- PASSES (~3–4 h each): PD-1 layout + controls · PD-2 battle (auto-target, rising ghost rows, callouts, the tip, KO → Call the Winner → spectating, SURVIVAL, the 3 cards) · PD-3 the night look · PD-4 the day look · PD-5 finish (the beat fix, the day songs, holiday touches, polish). Then PRISM DROP's own FABLE REVIEW (the game: rules, edge cases, the phone look, both looks) + its fixes; FR7 later checks the console hookups. NO PRISM DROP DAILY.
- LAYOUT "MAX BOARD": the board fills almost the whole upright iPhone, blocks ~33 pt (was ~25). HOLD + NEXT float as slim, slightly see-through panels inside the board's empty top corners (pieces passing under them stay readable). The other players = a SLIM RAIL beside the board: colour + stack height + a KO mark + a highlight when you hit them. No side columns; the stats leave the screen.
- THE CORNER BUTTONS: the site-wide rule (OC8) — ☰ TOP-LEFT, music TOP-RIGHT, the shared buttons; PRISM draws nothing of its own up there. Its top line (mode + players left, the world's name) sits BETWEEN them (var(--cb-room) both sides) and shrinks to fit. The board starts below that row, with the real safe areas.
- CONTROLS: the gestures stay exactly as they are (the owner: "the controls are really good"). SLAM = a premium glossy RED PUSH BUTTON, "SLAM" in white, a chrome bezel, a real press-down (light + sound), at the foot of the rail, never over the board; an in-game CONTROL, not a shell button (visually distinct from a shell DANGER button); the red push button in BOTH looks. The LEFT slam setting MIRRORS the rail + SLAM to the left of the board. THE BUTTONS SCHEME stays (Settings → GESTURES / BUTTONS): in BUTTONS mode only, the board shrinks to fit the button bar under it; GESTURES (the default) gets the full MAX BOARD.
- SIMPLIFIED BATTLE (PD-2): the one rule = "Clear lines to attack your friends." Incoming junk = RISING GHOST ROWS (ghostly rows creep up from the bottom, glowing + shaking as a warning, then go solid; clear in time and they SHATTER) — no red bar. TARGET automatic (whoever is hitting you, else a random opponent; no button). Badges / KO bonuses stay behind the scenes, no panels. Short callouts: "+4 → DANA", "BLOCKED!", "TWIST +2", "KO" (shared --good / --close tokens where they mean right / close). A one-time first-match tip, one line: "Clear lines to attack your friends."
- MODES: BATTLE (main) · SCORE RUSH (as is) · SURVIVAL (new, optional host mode: no attacks, junk rises for everyone at the same pace, last one standing wins).
- KO + SPECTATING: KO card → Call the Winner (10 s, big tap targets, a countdown ring) → SPECTATE: the two leaders' boards big (the one in danger outlined, "DUEL SOON" in the header), one line for the rest. Chat opens for knocked-out players.
- THE CARDS (THREE, no more): FIRST KO (common: knock out a player in BATTLE) · PERFECT CLEAR (rare: empty your whole board, any mode) · COMEBACK (top tier: win a BATTLE after your stack reached the danger zone). Hero art middle → middle-right on the slim strip, through THE CARD LAB.
- THE CONSOLE HOOKUPS: the podium = the console's (slim cards, results list from 4th, XP box, card reveal, BACK TO THE ROOM); PRISM draws ONLY finalScene(el, game, state); ACCENT = PRISM's colour; the console's winner sting (no OWN_VICTORY_SOUND). Any player name PRISM shows opens THE PLAYER PAGE (profile/player-page.js#openPlayer) — never during live play. THE BOARD's PRISM DROP tab (SCORE RUSH best, KNOCKOUTS, wins, win rate) keeps being fed through match-report.js / boards.js; XP only through core/progress.js#payXp. Mid-game standings stay light rows.
- THE LOOKS (the owner's bar: top tier, crisp, extremely impressive). The switch ALREADY EXISTS: THE GAME LOOK (body[data-look], kit/look.js — AUTO · DAY · NIGHT in ☰ → Settings, per device, read LIVE; PRISM draws no switch). Same rules in both. No auto-flipping between looks mid-match.
  - NIGHT (PD-3): neon tubes — solid dark cores, crisp hot edges in each piece's colour; the 5 WebGL worlds stay (one per song × 3 variants) but CALMER / dimmer behind the board; the neon palette shifts per world. A real BLOOM pass (GPU), a falling piece casts coloured light on the well + nearby blocks, a landing PULSE, a SLAM light trail + impact sparks, line clears = light races along the rows then shards + sparks (bigger clears = bigger shows; 4 lines = a full-board flash; combos build intensity). Effects ~0.5 s, never cover the stack or hide incoming junk; "Reduced effects" tones them down.
  - DAY (PD-4): a COLORING BOOK — crayon, extremely high quality, truly drawn-looking. Waxy crayon fill with strokes + paper grain showing through, a bold slightly wobbly outline in a darker shade; several pre-drawn variants per colour; readability first. The PAPER rotates per match (notepad, graph paper, construction paper, a coloring page). Each song's world appears as a FAINT crayon doodle behind the board (sunset = striped half sun over a road, city = a skyline in the rain, crystal = crystals, nebula + aurora to match). Landing = a little "boing"; line clears = scribbled out into crayon crumbs; junk = grey pencil-sketch ghost rows. Callouts in Permanent Marker (Google Fonts, SIL OFL 1.1 — free for this use; self-host the woff2 in assets/fonts/prism/ + its OFL.txt + a CREDITS line) with a crayon texture. Paper = CC0 (https://opengameart.org/content/cc0-pbr-paper-textures; compressed small). Crayon drawn in code.
  - LOOK SYSTEM: a look = block drawings + effects + sounds behind one interface (no engine changes), so future looks can become Progression unlockables later (not built now).
- RESOLUTION + SPEED: "3× where it shows" — the board, the pieces' edges, text + SLAM at the iPhone's FULL 3×; glow / bloom / the world at reduced resolution; the quality tiers step the board to 2× if a phone can't hold 60 fps. A MEASURED 60 fps on a mid-range phone is a requirement. Reviews at 390 / 402 / 430 (+ 1440×900 once).
- LOADING: thin meta + lazy logic, ≤ 1.5 MB preload; the match never waits for a whole song file; the kit's 3-2-1 + timer where they match. The console pauses the city during a match.
- MUSIC: NIGHT = the existing 5 synth songs, unchanged. DAY (PD-5) = five lo-fi songs; the HOST's look at match start picks the room's set (stored in the game; every phone hears the same song, each still draws its own look): Roof Tops → sunset, Summer Felt Longer Then → city, The Last Long Day → crystal, Feeling Human Again → aurora (all HoliznaCC0, CC0 1.0, originals in Downloads\grok\PrismDay — never edit them) + the owner's City song c2-day8 → nebula (from his original day/day8.mp3 if still in Downloads, else audio/music/c2-day8.mp3 with NO second lossy re-encode). Measured by Claude (chat): 80.00 / 80.00 / 83.0 / 79.00 / 110 BPM. Through scripts/build-prism.py as their own ids with look: 'day' + a hand-set doodle world; loudness-matched (~−14 LUFS, −1 dB true peak) in the encode only; the build stops + reports if its tempos disagree; battle crossfades start at a song's last strong beat; an optional per-song cue-in instead of editing a file.
- FIXES FOUND IN THE REVIEW: THE BEAT (PD-5) — the visuals run on the server clock, the song on the audio clock, iPhones don't report speaker delay → bring in the city's measured-lead approach (core/harbor-beat.js / speakerDelay). view.js (~1,100 lines) is split as part of the polish.

## PD-1 — LAYOUT + CONTROLS (Nov 9 2026)
- This pass: Group 0 (THE BOARD's top — docs/harbor/plan.md), the MAX BOARD + the corner row + HOLD / NEXT in the corners + the slim rail + the red SLAM button (LEFT mirrors rail + SLAM), the BUTTONS scheme's smaller board, the board at full 3×, the console's podium (finalScene + the player page on names), the preload, splitting view.js where it's touched (+ the regenerated preload graph). PRISM's pieces + worlds keep TODAY's look (PD-3 / PD-4 replace it); battle rules unchanged until PD-2.

## PD-2 — BATTLE MADE SIMPLE + SURVIVAL + SOLO (Nov 9 2026)
- SOLO: SCORE RUSH + SURVIVAL can be started by ONE player through the console's solo lane (meta SOLO: true → the streak + a small capped XP, never a win). BATTLE stays 2+ (hidden from the mode list in a room of one).
- SURVIVAL: no attacks; junk rows rise for everyone from the start, the same rows at the same moments on every phone (seeded): one row every 10 s, speeding up smoothly to one every 4 s (a typical game ~2–4 min). Last one standing wins; solo = survive as long as you can (score = time survived, then lines).
- SURVIVAL on THE BOARD: NO new board — its wins count toward PRISM DROP's wins + win rate.
- COMEBACK's danger zone (for the PD-5 card): your stack in the TOP 5 ROWS at any point of a BATTLE you go on to win — record that flag in the match from this pass.
- THE CARDS (FIRST KO, PERFECT CLEAR, COMEBACK) MOVED to PD-5 to keep PD-2 inside ~4 h. Record the facts they need from this pass (KOs, perfect clears, the danger-zone flag) in the match results.
- The rising ghost rows SHOW the existing pending-junk queue + its delay (the engine's attack math, cancelling + delays don't change).

## PD-3 — THE NIGHT LOOK (Nov 9 2026)
- PIECE COLOURS: each piece keeps its COLOUR FAMILY in every world (the long piece always cyan-ish, the square always yellow-ish… from today's JEWEL hues) so players recognise pieces by colour. Each WORLD shifts only the SHADE + the glow (warmer at SYNTH SUNSET, icier in CRYSTAL CAVE…), plus the well's edge, the sparks and the board frame. Never a full colour swap between songs.
- THE WORLD BEHIND THE BOARD: dimmed ~50 % behind the board only, under a soft dark glass; the world stays vivid at the top and in the edges around the board.
- SOUNDS: the effects reuse PRISM's existing synth SFX (in the song's key, on its beat) — no new sound files.
- Today's glass look stays as the DAY placeholder until PD-4 (body[data-look] = day → the glass look; night → NEON).

## PD-4 — THE DAY LOOK (Nov 9 2026)
- CRAYON COLOURS: the SAME colour families as night (the long piece cyan-ish, the square yellow-ish… from the JEWEL hues), in crayon shades, so a piece learned at night is recognised by day. The same hue-family test as PD-3.
- THE PAPER is picked per MATCH from the match's seed — the SAME page for everyone in the room — and changes match to match: notepad · graph paper · construction paper · a coloring page.
- The glass look (today's) is RETIRED as the day look: day = CRAYON, night = NEON. The light layer stays OFF by day.

## PD-5 SPLIT + PD-5A — THE SOUND (Nov 9 2026)
- PD-5 is SPLIT: PD-5A = the sound (the beat fix, quick-start songs, the day songs); PD-5B = the three cards + the polish. Then PRISM DROP's Fable review + its fixes.
- HOLIDAY TOUCHES are CUT from the rework: PD-5B builds only the HOOK (a look can take a holiday variant later in minutes); no holiday art now.
- COMEBACK's tier = EPIC (FIRST KO common · PERFECT CLEAR rare).
- THE NIGHT SONGS + their behaviour stay exactly as they are; the day set is added beside them.

## PD-5B — THE THREE CARDS + THE FINAL POLISH (Nov 9 2026)
- THE CARD ART (drawn in code, the OVERCLOCK cards' bar; the hero middle-right): FIRST KO (common) = a glowing block cracking apart into shards with a "KO" flash · PERFECT CLEAR (rare) = an empty, spotless well with a rainbow light sweeping through (the prism splitting light) · COMEBACK (epic) = a stack touching the red danger line at the top, one bright piece clearing it, light rising. Only Ben's APPROVED art ships (THE LAB).
- Ben's phone review of PD-1…PD-5A: all good; the day songs approved by ear; Feeling Human Again keeps its 35.7 s cue-in.
- The silent preview Ben found was the DAY-MATCH preview (prism-preview.html?look=day&set=day&n=5&stack=8&bot=1) — no tap-for-sound unlock there; The Last Long Day itself is fine. Every preview state that plays music gets the same "tap for sound" button as &beat=1.

## FABLE REVIEW — PRISM DROP (Nov 9 2026 — read-only)
- Nov 9: Ben APPROVED all three PRISM DROP cards in THE LAB (FIRST KO, PERFECT CLEAR, COMEBACK); FIRST KO keeps its burst (a moving common, accepted).
- Nov 9: DECIDED for the fix pass: the NIGHT songs are turned down at PLAYBACK to match the day set (~−14.4 LUFS) — a per-song gain value, the files untouched, the night behaviour otherwise unchanged.
- Nov 9: FABLE REVIEW (read-only) of PRISM DROP after PD-5B; its findings + the night-gain fix become the fix pass. The report: docs/games/review-prism-1.md.

## PFIX-A — THE PLAY-BREAKING FIXES (Nov 10 2026 — FABLE REVIEW's answers, Ben: "take the recommendations")
- A. LOCKS: once the 15 lock resets are spent, the piece locks AT ONCE the next time it touches down (no stall of any kind).
- B. DOUBLE KO: when the last boards go out in one tick, the winner = the board that went out LAST (its server stamp `at`); an exact tie → more rows sent, then join order. Never "no survivors" in a match of 2+.
- C. ANTI-CHEAT (PFIX-B): the cheap bounds of findings 6 + 7 + 9 (a rules change → RE-PUBLISH); no server replay now; PERFECT CLEAR in SOLO stays.
- D. AUTO-TARGET forgets an attacker after ~20 s (the KO credit's window) → the random pick.
- E. AWAY: a phone whose board is silent ≥ 30 s during play is OUT (the same 30 s as a lost signal), credited to nobody, the KO card says why (AWAY).
- The NIGHT songs are turned down at PLAYBACK to the day set's level (~−14.4 LUFS) — a per-song gain value, the files untouched.
- The fix work is split: PFIX-A (this) = MUST FIX 1–5 + D + the night gain + optional 18; PFIX-B = MUST FIX 6–7 (rules) + SHOULD FIX 8–10 + the worthwhile optionals.

## PFIX-B — ANTI-CHEAT RULES + THE SHOULD-FIXES + THE POLISH (Nov 10 2026)
- ANTI-CHEAT = question C's CHEAP BOUNDS (they narrow forgery, they don't replay the board): `sv` closed + bounded, a board frozen once out + outside `play`, attacks stamped by the server + one per piece + never at a player already out, KO credit only with a real recent attack, the award flags only from plausible numbers. PERFECT CLEAR in SOLO stays. A full server replay = a later pass, only if PRISM's scores ever matter to strangers.
- A RULES CHANGE → Ben re-publishes database.rules.json after this pass.
- OPTIONAL 21 (any signed-in user can read a room's boards) stays as designed — nothing secret there.

## HOLD'EM — THE PLAN (Nov 10 2026)
- HOLD'EM = Texas Hold'em, 2–8 players, one phone each, PLAY CHIPS ONLY (chips reset every match; no bankroll; nothing buyable becomes chips). No solo / no bots in v1.
- THE SERVER IS THE DEALER (HE2): it shuffles with a NEW server secret (never KEY_PEPPER), sends each phone only its own 2 cards, reveals the board, checks every action, settles pots. The host holds no cards.
- MODES: TOURNAMENT with a speed setting TURBO (DEFAULT) · STANDARD · DEEP, and CASH (an open session).
  - TOURNAMENT stacks: 1,500 (TURBO + STANDARD), 3,000 (DEEP). No antes.
  - BLIND LADDER: 10/20 · 15/30 · 25/50 · 50/100 · 75/150 · 100/200 · 150/300 · 200/400 · 300/600 · 500/1,000 · 700/1,400 · 1,000/2,000 · 1,500/3,000 · 2,000/4,000 · 3,000/6,000 · 5,000/10,000 (then ×2 per level).
  - LEVEL TIME: TURBO 2 min · STANDARD 6 min · DEEP 12 min. Target lengths at 6–8 players: TURBO ~15–20 min, STANDARD ~45–60 min, DEEP 2 h+.
  - SHOT CLOCK 20 s a turn + a 30 s TIME BANK per player per match (used only after the 20 s runs out).
  - CASH: 1,000 chips, blinds fixed 5/10, REBUY for 1,000 once you hit zero (between hands), late joiners sit in at the next hand, no timer; the host ends it → THE LEDGER: each player's net = final stack − everything bought in (rebuys included), plus hands played + the biggest pot. Chips only — no dollar signs, no rates, no "owes".
  - Tournament: no late joiners. Busted = KO card → spectate (chat open). No Call the Winner.
- SHOWDOWN: everyone still in shows automatically; when everyone folds, the winner may SHOW (optional).
- Beginner help: a plain hand label under your cards ("TWO PAIR · KINGS") + a rankings sheet. NO win-odds %.
- Bet controls (HE3): FOLD / CHECK·CALL / RAISE + one-tap presets with real amounts — before the flop MIN · 3× · ALL IN, after the flop ½ POT · POT · ALL IN; RAISE opens a slider. Pre-action toggles CHECK/FOLD and CALL ANY. Plain words, never "BB".
- Looks (later passes): 3 skins any player picks any time (NEON CASINO · COZY CABIN · CYBERPUNK APARTMENT), NO day/night; portrait = a tall stadium table filling the screen with uniform seats on the rail, + a sideways view. Approved art, chips + sounds wait in Downloads\grok\holdem\ for HE5.
- Passes: HE1 engine + sims → HE2 the server dealer → HE3–HE4 the table screen → HE5–HE6 skins → HE7 sideways → HE8 E2E + polish → HE9 Fable review → HE10 fixes. It goes live only by flipping its own playable switch when Ben says so.

## HE1 — THE ENGINE + THE SIMULATIONS (Nov 10 2026)
- TURBO's level time is TUNED 2 min → 90 s by the length study (scripts/holdem-sim.mjs, robots paced 3–8 s a decision): at 2 min the 6 / 8-player median was 22.2 / 24.6 min, at 90 s 18.5 / 19.7 (target 15–20). The ladder unchanged. STANDARD (45.5 / 53.7 min at 6 / 8) + DEEP (75.7 / 99.4 min — short of "2 h+") reported as they are, not tuned.
- The rule choices made in HE1 (docs/holdem.md "The rule choices"): the simple moving button; the odd chip to the first winner left of the button; simultaneous busts → the bigger starting stack places higher, equal starts share; AWAY = auto check / fold at once, still dealt in + posting, until 'back'; presets rounded to 5s, never below the legal minimum; a short all-in below the big blind → the next raise to at least two big blinds; CASH's END SESSION mid-hand waits for the hand (or voids it); a CASH rebuy also while a hand runs that the player isn't in.
- OPEN for Ben (before HE2): CASH has no clock, so a player who walks away stalls the table — a host "fold for them" / sit-out, or a long idle clock?

## HE2 — THE SERVER DEALER (Nov 10 2026)
- DEEP level time = 15 min (Ben; was 12). TURBO stays 90 s (HE1's tuning), STANDARD 6 min.
- CASH keeps the SAME 20 s shot clock + 30 s time bank as the tournament ("no timer" in CASH means no session END time, never no shot clock). In CASH the bank refills +5 s per hand dealt in, up to 30 s.
- AWAY in CASH = SAT OUT: after 2 timeouts in a row the player is skipped (not dealt in, posts no blinds) until they tap back in. In a TOURNAMENT, AWAY stays as HE1 built it (auto check/fold, still posts blinds).
- The host can NOT fold, sit out or act for another player — the clock handles walk-aways. The host's only extra powers: start the match, END SESSION (CASH).
- THE DEALER DESIGN: the server shuffles with crypto randomness; the deck + the full hand record live in a SERVER-ONLY node (rules: no client reads or writes); each player's 2 cards go to a PRIVATE node readable only by that player's signed-in uid; the public table is written ONLY by the server; every action goes through /api (an existing function — still 8). No new env var.
- THE POKE: everything time-based (a turn's deadline, the next street during an all-in run-out, the pause before the next hand, the next blind level) happens when a phone POKES the server and the server's OWN clock says the moment has passed. Never a client clock, never a client claim.
- PRE-ACTIONS (CHECK/FOLD, CALL ANY) are stored on the SERVER per seat, so they fire even when that phone is locked.
- END SESSION mid-hand waits for the hand to finish; "cancel the hand + refund" is a fallback only (not a normal button).

## HE3 — THE TABLE SCREEN A (Nov 10 2026)
- HE3's look = the REAL green felt (Downloads\grok\holdem\felt-green.jpg, a compressed copy), the NEON CASINO colours (black + gold plates and buttons, gold accent) and the REAL four-colour card faces drawn in code — not grey placeholders. Premium lighting, chips, rails, backdrops + the other skins = HE5–HE6.
- CHAT stays open the whole match; CHAT_CHIPS = NICE HAND · NO WAY · WELL PLAYED · UNLUCKY.
- LOOKS = ['night'] (the GAME LOOK setting shows locked while HOLD'EM runs) — HOLD'EM's 3 skins replace day/night.
- The dealer writes ONLY CHANGED fields (multi-path updates) — the ~5 KB whole-table write was the Firebase download cost; target a few hundred bytes for a typical action.
- The dealer keeps the room ACTIVE (rooms/{CODE}/meta/activeAt) on every write, so a 2 h DEEP match is never closed by the 1 h idle rule.

## HE4 — THE TABLE SCREEN B (Nov 10 2026)
- Ben's preview review: (1) the BOARD's position follows the player count — HEADS-UP: centred in the felt between the opponent and your buttons, cards ~64 pt; 3–4 players: raised toward the middle; 5–8: as in HE3. (2) the SIDE SEATS spread EVENLY from the top seat down to just above the pot line (≈ 20–25 % more space between them) — never onto the board or the buttons (portrait's limit; the sideways view, HE7, gets a fully even oval). (3) the NEON SPEAKEASY felt print a little more visible (still printed-in, never fighting the cards).
- Player lists use SLIM CARDS (the ledger + the end screen's places) — Ben's standing rule.
- A busted opponent's seat fades out; the table re-spreads at the START of the next hand (never mid-hand).
- CASH gets a LEAVE TABLE button (between hands only, a confirm; your stack counts at leave).
- The end screen's award chips: BIGGEST POT · MOST KOs (tournament) — computed from the server's record, shown only, no new cards/achievements.
- Carried from the city chat (as written): THE MUSIC WARM-UP, SMALLER (the last group) — this pass's final push carries the [harbor] tag.

## HE5 — SOUNDS + CHIPS + THE CASINO SKIN (Nov 10 2026)
- Ben's review of HE4: SPECTATING is a straight, level label (no tilt, no slanted dashed box); the betting area gets real breathing room (≥ ~12 pt between the preset row and the round buttons, the buttons spaced wider, YOUR bet chip on the felt ABOVE the action area — never on a button); the LEDGER's net = GREEN when up, RED when down, white at 0 (the shared --good / --bad colour tokens so the COLOUR-BLIND setting still works; the + / − signs stay).
- LEAVE TABLE (CASH) is ALWAYS available: between hands it leaves at once (confirm); during a hand you're in it becomes "LEAVE AFTER THIS HAND" (a server-side flag — the dealer applies it when the hand ends; tap again to cancel).
- THE AMBIENT BEDS ARE CANCELLED (Ben): no beds anywhere; remove any unused bed stubs.
- THE SOUNDS (Ben approved by ear on the audition page): the NEW real-recording set from Downloads\grok\holdem\sfx2\ (the MAIN picks — deal-b / chip-bet-b / all-in-b stay unused on Ben's PC): shuffle, deal, flip, fold, check, chip-bet, chip-raise, chip-stack, all-in, pot-win. KEPT from the first set (Downloads\grok\holdem\sfx\): your-turn, timer-tick, showdown, hand-win, knockout, blinds-up, champion.
- THE BALANCE Ben approved: the new set played at +7 dB (gain ~2.2) vs the kept stings at 1.0, through a soft limiter (DynamicsCompressor) on the SFX bus; the DEALS at about HALF that (~−6 dB from the new set's level) with a little rate (±4 %) + volume variety so 16 in a row never sound robotic. Everything else at its normal level.
- MUSIC = the LATE station (MUSIC: 'mood:late', already set in HE3) — no new music files.
- ONE winner sound: HOLD'EM plays champion on the tournament's end (OWN_VICTORY_SOUND: true → the console's sting is skipped).
- THE CHIPS = Grok's clay-chip art (6 colours, top + side), with three must-do fixes: a soft contact shadow + a thin rim / top-edge highlight on every chip (the GREEN chip must never vanish on green felt); lighting + a subtle sheen in code so they read as real clay; each chip's edge spots at a random offset + 0.5–1 pt jitter so a stack never looks like a barcode.
- NEON CASINO = the first skin built to the full premium bar; the SKIN SYSTEM is built so COZY CABIN + CYBERPUNK APARTMENT (HE6) plug in as data + art, no new code paths.

## HE6 — REAL CARDS + CABIN + APARTMENT + THE PICKER (Nov 10 2026)
- REAL-LOOKING CARDS (Ben): the faces read as "digital" (one big index + one big suit) — they must look like REAL playing cards while staying readable. Art SOURCED: Byron Knoll's "Vector Playing Cards" (PUBLIC DOMAIN — verify the licence from the official source; credit anyway), recoloured to the FOUR-COLOUR deck (spades black, hearts red, diamonds blue, clubs green; the classic two-colour toggle keeps the classic colours), court figures included.
  - YOUR TWO CARDS (big): FULL real faces — classic pip layouts (2–10), the real court art (J/Q/K), the index in BOTH corners (top-left + the rotated bottom-right) in a classic serif, card-stock paper (faint grain, warm off-white), thin border, rounded corners, a hair of edge thickness + a soft shadow.
  - BOARD CARDS: the same real-card styling, readable at board size — the big classic-serif index in two corners + a centre suit (pips only where they still read), paper, border, edge + shadow.
  - OPPONENTS' SHOWN CARDS (small): index + suit in the same style.
- THE SKIN PICKER: ☰ → Settings → a "TABLE" row with three small live thumbnails (NEON CASINO · COZY CABIN · CYBERPUNK APARTMENT); tap = the table changes LIVE (even mid-hand), saved per phone; default NEON CASINO; only the chosen skin's assets load.
- COZY CABIN + CYBERPUNK APARTMENT = data + art in HE5's skin system (no new code paths), each to NEON CASINO's bar.

## HE7 — SIDEWAYS + DESKTOP (Nov 11 2026)
- SIDEWAYS = Ben's exception for HOLD'EM: when the screen is wider than tall, the table becomes a WIDE STADIUM (rounded ends left/right) filling the screen; the 7 opponent seats FULLY EVENLY SPACED around the oval (no portrait compromise), YOU at the bottom centre; the board in the middle, the pot above it; your 2 cards bottom-centre over the rail with your plate; the action area (presets above FOLD / RAISE / CALL, the slider, the pre-actions, LEAVE) on the RIGHT, low, under the right thumb — never over the board, your cards or a seat.
- HEADS-UP sideways: the opponent top-centre, the board big in the middle.
- ROTATE ANY TIME: switching orientation mid-hand re-lays out instantly — no reload, no lost state, no replayed motion or sound; a motion in flight finishes in the new layout or snaps to its end.
- DESKTOP / any wide window uses the SIDEWAYS layout scaled to the window (centred, a sensible max size), the skin's SQUARE backdrop filling the rest — no more phone column. A tall narrow window still gets portrait.
- The skins' SQUARE backdrops (backdrop-casino.png / backdrop-cabin.png / backdrop-apartment.png from Downloads\grok\holdem\, compressed) are the sideways/desktop backdrops; only the chosen skin's loads.

## HE8 — TIMER + OWNER'S LIVE TEST + TOUGHNESS (Nov 11 2026)
- YOUR TURN TIMER (portrait): a gold bar across the TOP edge of your plate, draining over your 20 s; red-orange once it dips into your time bank; a soft plate pulse in the last 5 s (with the existing tick sound). Sideways keeps HE7's bar.
- THE OWNER'S LIVE TEST: while HOLD'EM is playable: false, a room HOSTED BY THE OWNER (the site's existing admin/owner identity — server-verified, never a client flag) can start HOLD'EM on the live site; it shows in that host's game list with a small "TEST" tag; guests in that room play normally. For everyone else nothing changes: it appears nowhere, and the dealer's start REFUSES any non-owner host while the game isn't playable. Flipping playable: true later simply opens it to all.
- REAL-WORLD TOUGHNESS: instant button feedback (pressed state at once, then the server's answer); a clean recovery after a lost signal mid-turn; sound resumes after an app switch; the SCREEN STAYS AWAKE (Wake Lock) while you're seated in a live match — released when you spectate, leave, the match ends, or the page hides.
- LONG NIGHTS: memory stays flat over a long match; nothing animates or redraws while the table is idle (battery).

## HE10 — THE FIX PASS + SWITCH ON (Nov 11 2026)
- Ben accepted the Fable review's recommendations. His decisions:
  - A1: the free pre-action is a TRUE CHECK — it checks if nothing is owed and CANCELS ITSELF if anyone bets (it never calls); CALL ANY stays its own toggle, labelled CALL ANY. HOW TO PLAY + the docs say so.
  - A7: a match COUNTS (XP / streak / wins) only after real play — CASH: ≥ 10 hands dealt AND ≥ 5 minutes; TOURNAMENT: ≥ 3 hands dealt. Below that the match ends normally but credits nothing (say so on the end screen in one quiet line).
  - A18: CASH — LEAVE then SIT BACK DOWN in the same session sits you down with the chips you LEFT WITH (no fresh 1,000 while you have banked chips); the ledger stays Σ net = 0.
  - A40: a CASH session's end plays CHAMPION for the session's biggest winner (net > 0); everyone else hears the end quietly. Still ONE winner sound.
  - A46: keep the standard poker words (rebuy, bought in, net, the ledger, time bank, high-roller, bet, bluff); change only "a new buy-in" → "a fresh 1,000 chips".
- A2 / B1: a HOLD'EM result exists ONLY from the dealer's own record (src: 'dealer'); the shared snapshot / room paths never credit a dealer game or a non-playable game.
- A17: delete END SESSION's unused "void the hand" path (the hand ends by itself on timeouts).
- When everything is fixed + green: HOLD'EM goes ON for everyone (config.js playable: true), the TEST tag disappears.

## PD-6 — THE SPARE-WIDTH COLUMN + THE SOLO PODIUM + TWO SOLO BUTTONS + THE SLAM's WEIGHT (Nov 13 2026)
- THE SPARE-WIDTH COLUMN: in Safari WITH its toolbars the board is HEIGHT-bound (10 × 20 square cells — it can't get wider without getting taller), so the spare width was split as empty strips both sides. Now the board sits at the outer margin and ALL the spare width (up to a cap) goes to the rail + SLAM column: SLAM ~56 pt, centred in the column at its foot; the rail tiles as wide as the column. When there's no spare (width-bound: fullscreen / a home-screen app / a narrow phone) it falls back to PD-1's 34 pt rail + today's SLAM. LEFT mirrors it.
- THE SOLO PODIUM FITS: the solo title is a HEADING, not a hero; YOUR LAST BOARD + the one slim card + its score line sit above the foot with NO "MORE BELOW" at 390 / 402 / 430 in Safari WITH its toolbars (the real visible height). OVERCLOCK's solo podium + a room-of-one podium too. The multiplayer podium is untouched.
- TWO SOLO BUTTONS (built GENERAL): a cartridge's meta.js may list `solo: [{ mode, label, sub }]` — the FIRST = the ONE pink MAIN tube, the rest plain neon tubes; the game card draws one tube per entry, each starting the solo room with that mode in its settings; a game with no list keeps the single PLAY NOW. PRISM DROP: SCORE RUSH · ONE SONG (main) + SURVIVAL · UNTIL YOU TOP OUT. THE DROP (the planned daily) is NEVER a button here — it stays a daily.
- THE SLAM's WEIGHT: a slightly heavier, deeper thud (still in the song's key, still quiet — felt more than heard) + a tiny BOARD KICK on impact (a 2–3 pt dip + spring back, ~0.1 s, transform only; OFF with Reduced effects + prefers-reduced-motion). iPhone Safari can't vibrate, so sound + motion carry the weight.
- NO "TIME!" moment at a SCORE RUSH song's end (Ben). THE ORDER (Ben): PD-6 → THE DROP A → THE DROP B → JAYWALK.
- ADD-ON (Ben, Nov 13 4:30 pm) — THE SOLO PODIUM SAYS WHAT IT PAID: a solo SCORE RUSH paid 0 XP and the podium didn't say why. Solo runs pay SOLO_XP (15) for the first SOLO_DAY_XP (4) a streak day (core/ranks.js#soloXp), then 0 — but the solo podium showed NO XP line.
  - ONE small line under the score on EVERY solo podium (PRISM DROP + OVERCLOCK, PLAY NOW + a room of one): "+15 XP · SOLO RUN · 3 OF 4 TODAY" while it pays; "TODAY'S SOLO XP DONE · MORE AT 4 AM" once it doesn't.
  - From the OUTCOME THE SERVER RETURNED — never computed on the phone. If /api's solo outcome doesn't carry today's solo count yet, add it to the response (no rules change, no new call); while the outcome hasn't arrived (offline / queued), show nothing rather than a guess.
  - It must fit with Group 2's podium fix: no MORE BELOW at 390 / 402 / 430 in Safari WITH its toolbars. No pill — plain text, the podium's small type.
  - e2e-playnow checks the line on a paying run AND on the 5th solo run of a day.

## THE DROP — PRISM DROP's DAILY (the owner's decisions, Nov 13 2026 — reverses Nov 3's "no PRISM daily": solo + SURVIVAL + a deterministic engine make it fair)
- A third daily, named THE DROP (the daily section only — never on a billboard), its OWN admission ticket (`ticket: 'drop'`) in its own colour (PRISM's accent, clearly distinct from THE PASSWORD + COAST CLEAR's).
- SURVIVAL only (a SCORE RUSH day maybe later). Everyone gets the SAME piece order + the SAME rising rows that day (the day's seed from THE DAILY SECRET — never the date, never the pepper). ONE counted run a day; score = TIME SURVIVED, lines break a tie. Practice any time with PLAY NOW (other seeds).
- A GUARANTEED END: THE DROP's rows follow SURVIVAL's 10 s → 4 s, then KEEP speeding up after ~4 min so even the best run ends by ~8 min (bounds the replay + the log).
- PAUSES: 3 PLAYER pauses a run (COAST CLEAR-style caps — 3 a run, 20 min in all), the BOARD HIDDEN while paused, the pause time server-timed. A REFRESH / resume COSTS one of the 3 (no checkpoint save-scumming). A ROOM start (THE ROOM WINS) pauses it too but does NOT use up the 3.
- CHECKPOINTS during the run: a refresh / a dead phone resumes from the LATEST checkpoint (never an older one); an abandoned run ends at its last checkpoint; DFIX1 holds (a run started before 4 am finishes on its own day).
- ANTI-CHEAT: the phone's INPUT LOG is REPLAYED by the server through the SAME pure engine with the day's seed + rows → the real time + lines, or REFUSED. THE SLOW-MOTION CHECK: wall-clock start → finish ≥ engine time − the server-timed pauses (+ a small tolerance). A human floor on input timings; the log's size capped; the replay measured + well under api/daily.js's 10 s. (It stops forged results; it can't stop a script that plays at human speed — accepted for friends.)
- ONE STORED SCORE: `better: 'high'`, = time in tenths × 1000 + lines — so YOUR TABLE, PENTHOUSE, the TOP x% band + DAILY POINTS all rank the same way.
- DAILY POINTS: a CAPPED curve in core/daily-points.js (a better time never fewer points; a played day ≥ POINTS_FLOOR).
- SHARE (pass B): the final-board picture KEPT, the junk rows drawn SOLID (hides the day's holes). Throwaways learn the piece order + the holes — accepted until public; on the BEFORE-PUBLIC list.
- GO LIVE: only at a 4 am turn, never mid-day (THE SWEEP + PERFECT WEEK then need all three; daily XP = 3 × 15 + 10). /admin's PROGRESS RESET clears THE DROP's records like the others.
- TWO PASSES: A (this) = the engine run + the server's replay + checkpoints + pauses + the score + points, the row OFF; B = the ticket, TODAY with three tickets, SHARE TODAY for three, the share picture, both looks, the one-time hint.
- PD-6 REVIEW (Ben, Nov 13 7:11 pm) → this pass's Group 0: SLAM as big as the column allows (column − ~6, ≈ 62 pt at 390 in Safari), centred across the column, kept at its FOOT for the thumb; a short MUSIC DUCK on every slam (~0.15 s) so the thud is heard without getting louder; a solo run must never be lost by a fast BACK TO THE CITY.
- ADD-ON (the city chat's cost check, Nov 13) — KEEP IT CHEAP AS IT GROWS (THE DROP A's last group; it overrides the pass text where they differ):
  - CHECKPOINTS: no more often than ~every 30 s of play + on a pause / the page hiding (visibilitychange → hidden, pagehide) / the phone locking — batched, never one request per move or per few seconds (replaces Group 2's "every few seconds"). A refresh resumes from the latest checkpoint as decided (one pause used). The summary states the per-run request count (target ≲ 30 for an 8-minute run).
  - THE MOVE RECORDINGS: once a day's board is final, prune them — keep only what the boards + the anti-cheat need (e.g. the top runs' logs for 7 days, everyone else's score row only); a scheduled server prune or the next day's first call does it, never a scan of every profile. The summary states a run's stored size.
  - THE RE-PLAY CHECK runs ONCE per finished run (and once when an abandoned run is closed at its last checkpoint) — NEVER per checkpoint (replaces Group 2's "validated by replaying up to it"); a checkpoint is only size- / order- / time-bounded on arrival.

## THE DROP — PASS B (Nov 13 2026)
- FIX (pass A broke a decision): HIDING THE PAGE (a call, a lock, an app switch) = an AUTOMATIC PLAYER PAUSE — server-timed, one of the 3, the board hidden on return (resume = one tap); with NO pauses left, the run keeps its clock (and may end — the slow-motion bound applies). Pass A's hide-without-pause is replaced. A REFRESH still resumes at the latest checkpoint and costs a pause; a ROOM start still pauses for free.
- THE DROP plays PRISM DROP's own songs — the DAY or NIGHT set by the phone's look (the daily is solo: the phone's own look decides), on the same heard-beat clock as a match.
- THE TICKET: THE DROP's own admission ticket (`ticket: 'drop'`) in PRISM's accent colour, clearly distinct from THE PASSWORD + COAST CLEAR's; its ADMITTED stamp + ink in the per-id tables.
- TODAY with THREE tickets (centred); SHARE TODAY composed for three (built for 1–6), still spoiler-free.
- THE DROP's share picture = SHARE YOUR RUN's board image with the junk rows drawn SOLID (hides the day's holes) + THE DROP · the time · the lines.
- THE SCHEDULED GO-LIVE (Ben, Nov 13 — he won't stay up for 4 am): /admin → THE DAILIES → THE DROP → "GO LIVE AT THE NEXT 4 AM" — any time; the server stores the start day (`liveFrom`), THE DROP turns on by itself at that 4 am turn (never mid-day), cancellable before then; no code edit / deploy needed. From then THE SWEEP + PERFECT WEEK need all three; daily XP 3 × 15 + 10.
- THE ORDER (Ben): THE DROP B → SKINS 1 → SKINS 2 → Ben taps GO LIVE → ONE FABLE REVIEW (THE DROP + the skins) → fixes → JAYWALK.
- ADD-ON (Ben, Nov 13 9:56 pm, his iPhone HOME-SCREEN APP): SLAM is still ~40 pt in the home-screen app — the spare-width column only applies when the board is HEIGHT-bound (Safari with toolbars), so a width-bound layout falls back to PD-1's 34 pt column even though ~60 pt of strip sits right of the board. Fix in js/games/prism/layout.js (PURE, unit-tested): in EVERY layout (Safari, home-screen app, any width), SLAM's diameter = the whole strip from the board's edge to the screen's safe edge minus ~8 pt (its chrome rim clear of both), centred across that strip, at the column's foot; never shrink the board for it; the rail tiles keep their width; LEFT mirrors it. Expected ≈ 52 pt at 390 in the home-screen app, Safari's 62 / 54 / 55 unchanged or bigger. Unit tests for both viewports at 390 / 402 / 430; shots in the home-screen-app viewport (390 × 844 with safe areas). THE DROP B's LAST group, before the final test run + push.
- ADD-ON (Ben, Nov 13 10:17 pm — THE GAME CARD's buttons look like "one is selected"): on the game card (js/screens/title-taps.js + core/room-logic.js#cardActions — PD-6's general meta `solo` list), one pink tube + two white ones reads as a pre-selected option to confirm. Keep the three full-width stacked buttons EXACTLY as they are (same size, labels + sub lines) but make them EQUAL: all three the same plain white neon tube (THE SHELL's secondary) — no pink on this card (if THE SHELL's test requires a main on every screen, say so and keep them equal anyway; never three pinks, never a new gradient style). Applies to any game with a solo list; a game without one keeps its single PLAY NOW. ALSO: the card's two PILLS ("SOLO · 2–8 PLAYERS" + "≈ 5 MIN") become ONE plain quiet text line ("SOLO · 2–8 PLAYERS · ABOUT 5 MIN") — no pills (Ben hates them). Shots at 390 / 402 / 430 in Safari with toolbars; e2e-playnow still passes. THE DROP B's LAST groups (with the SLAM add-on), before the final test run + push.
- ADD-ON (Ben, Nov 13 9:59 pm, his iPhone home-screen app) — A SOLO RUN COUNTS TIME WHILE THE APP IS HIDDEN: Ben started a SOLO SURVIVAL, left the app for ~2 min, came back → "SURVIVED 2:04 · 0 LINES" — the hidden time counted as survived; nothing rose while hidden (not THE DROP — Group 0 pauses THE DROP on hide). FIX: a SOLO run (PLAY NOW or a room of one, SCORE RUSH + SURVIVAL, both looks) PAUSES while the page is hidden (visibilitychange / pagehide): the engine, the rising rows, the song and the run clock all stop; on return the kit's 3-2-1, then play resumes exactly where it was. SURVIVAL's time = time actually PLAYED (engine time), never wall time — the result, the podium + the report all use it. The multiplayer AWAY rule (30 s → out) is unchanged. The server's solo check agrees (the reported time ≤ the played engine time it can verify; a hidden-time run never pays more than a played one). ALSO: the solo podium's YOUR LAST BOARD showed NO board in the night look after that run — show the final board in both looks (an empty board still draws its empty well), or explain why it can't. Pins: a SOLO SURVIVAL hidden 60 s → the time doesn't move while hidden, resumes after the 3-2-1, the result = played time; a SCORE RUSH hidden mid-song → the song + the clock resume together.
- ADD-ON (Ben, Nov 13 10:19 pm — SHARE TODAY looks broken; the faint vertical lines are preview-only): (1) DOUBLED NAME — COAST CLEAR's section shows the white title "COAST CLEAR" then the green result word "COAST CLEAR". Rule for every section: when the result word equals the daily's own name, show it ONCE, as the coloured result word in the title's slot (the stat line under it as usual); a lost run (the red word) unchanged; COAST CLEAR's words not renamed. (2) ALIGNMENT — every section's content group centred on the card's centre line, inside the same column / margins as THE PASSWORD + THE DROP; COAST CLEAR's beam never pokes out past the column's left edge (scale or clip it, the 2:12 stays big), its 3 lamps centred under it. COAST CLEAR's own standalone card unchanged unless it has the same doubled name. share-same still proves each daily's card pixel-identical inside SHARE TODAY (fixed in the shared draw code). Shots: SHARE TODAY with 1, 2, 3 dailies, night + day.
- ADD-ON (Ben, Nov 13 10:23 pm — the day DROP card preview looked broken): the share-card previews (THE DROP's own card + SHARE TODAY, day + night) draw a REAL finished run — an actual seeded DROP run replayed until it TOPS OUT (the board stacked to the top, the junk rows at the BOTTOM where they rise from, the time / lines that run's) — never hand-made sample data. The summary confirms the real card can never show junk above the player's pieces or a mostly empty board for a real run (and says how else a run can end + what its board looks like).
- QUESTION (Ben): can PLAY NOW / solo SURVIVAL practice ever use THE DROP's day seed? (answer in the summary — if it can, the fix goes first in the next pass)
- THE FABLE REVIEW's CHECKLIST (THE DROP + the skins — add to it as passes find things): solo runs pause while hidden (SCORE RUSH + SURVIVAL, PLAY NOW + a room of one, both looks — the time = time played); PRISM battle's refresh replay may land an attack twice when auto-target moves (prismq/{match}/{target}/{key} — THE DROP B's A/B).

## PRISM DROP — SKINS (the owner's decisions, Nov 14 2026)

### SKINS 1 — THE SKIN SYSTEM + WATERCOLOR + PAPER CUT-OUT + ROTATION + THE SKINS SETTING (Nov 14 2026)
- SKINS 1 (Ben, Nov 14): a skin = ONE definition in js/games/prism/skins.js (like holdem/skins.js): { id, name, look: 'day'|'night', unlock: null | { level }, blocks (sprites), ghost, clear fx, incoming rows, background/page, lettering, panel tokens (ink/sub/panel/line), sounds }. No skin-specific code paths in view.js; crayon + neon move behind it PIXEL-IDENTICAL.
- POOLS: DAY = crayon · watercolor · paper (this pass); NIGHT = neon (arcade pixel + galaxy in SKINS 2). A phone's pool = the skins it owns (unlock null = everyone); a pin narrows it to one.
- ROTATION: the look (AUTO / DAY / NIGHT) picks day vs night first. The HOST deals a skin counter k per match from the room's night memory (meta/used/prism, like pickPaper: key sk<n>), stored on the game (game.sk). Every phone draws pool[k % its pool size] — the same pool = the same skin; every skin before a repeat, never the same twice in a row (for one pool size); fixed for the match (a mid-match look change uses the same k on the other pool). Solo runs + THE DROP use the PLAYER's own counter (this phone's settings, +1 a run). Crayon's papers still rotate inside crayon only. Holidays only override crayon / neon.
- SETTINGS: ☰ → Settings → PRISM DROP → SKINS: a DAY row + a NIGHT row, each ROTATE (default) or one owned skin, as small live tiles (a 3-block sample in that skin, readable at real size — HOLD'EM's picker pattern). A look with only ONE owned skin hides its row. This phone only (settings.prismSkinDay / prismSkinNight).
- SKINS DON'T TOUCH: rules, controls, the engine, music, SLAM (stays the red push button), each piece's colour family, the share cards / tickets / SHARE TODAY (they stay crayon by day, neon by night). Opponents' mini boards draw in MY skin. The podium's YOUR LAST BOARD draws in the match's skin.
- WATERCOLOR (day): warm cold-press paper with real tooth + 2–3 faint pastel washes, the song's world as a very faint loose wash behind the well; blocks = 3–4 translucent layers on a wobbly soft-cornered square (never round blobs), a darker pigment rim, a soft white highlight top-left, 6 variants a colour; ghost = a faint pencil outline; incoming rows = a grey wash with a darker pigment edge; the clear = the row's paint goes thin + RUNS (1–2 drips a cell, ~0.4 s; Reduced effects = a quick fade); callouts in the day marker font filled like paint; warm paper cards, ink #2e3340-ish; sounds = a soft wet plip (lock), a brush swish + a tiny drip (clear), the slam thud stays.
- PAPER CUT-OUT (day): a kraft-board table with a big white sheet under the board (its baked soft shadow, rotated a hair), the world as 2–3 layered paper silhouettes at the edges; blocks = matte coloured paper squares (lifted toward white), slightly uneven cut edges, a tiny rotation jitter (±1.5°), fibre speckle, a thin white top edge, a soft drop shadow BAKED INTO THE SPRITE, 6 variants a colour; ghost = a dashed cut line; incoming rows = grey card stock; the frame = a dashed cut line; the clear = the strip PEELS (lifts from the left, curls at the right end, a growing shadow, flies off up-left in ~0.45 s, a faint clean gap for a beat; Reduced effects = a quick lift + fade); callouts on a white paper LABEL (sharp corners — never a pill), tilted ~3°, its own shadow; paper cards, ink #3a2a18-ish; sounds = a papery tap (lock), a short rip + a soft whoosh (clear).
- TIME BOX: if it runs long, CUT FIRST the two skins' world silhouettes (ship the plain backgrounds, note it in the log) — never the blocks, the clears or the rotation.
- QUALITY: 60 fps measured on the mid-range profile in both new skins (a 4-line clear included); the low tier drops the world silhouettes + the extra drip / peel particles first; only the shown skin's textures load; a ?skin=<id> forcer on the PRISM preview page.
- LOCAL TESTING RULE (Ben, Nov 14 — the repo stays PUBLIC, the cloud's full harbor is free): each pass runs locally only unit + the game's e2e + the harbor GROUPS it touches; the FULL harbor suite runs in the cloud on the tagged push, not locally. (If the repo ever goes private, this flips — the cloud then never runs harbor on a push.)
- THE ORDER (Ben): SKINS 1 → SKINS 2 (arcade pixel + galaxy, night) → Ben taps GO LIVE → ONE FABLE REVIEW (THE DROP + the skins) → fixes → JAYWALK.

### SKINS 2A — THE SHARE CARDS (NO PILLS, ONE RHYTHM) + WATERCOLOR REWORK + CRAYON TEXTURE + GROK's SOUNDS (Nov 14 2026)
- NO PILLS, EVER (Ben, Nov 14 — his standing rule, overrides any earlier "keep the foot"): no rounded-capsule shapes anywhere — labels, chips, badges, frames, footers. The share cards' NEONSPEAKEASY.COM capsule → plain neon lettering + one straight line.
- SHARE CARDS — ONE RHYTHM: every section = (1) the name, or the win word when it equals the name (name-once stays) · (2) ONE big result, the same size in every section · (3) ONE stat line, the same size · (4) ONE art strip of the same height. Equal spacing, centred inside one column. THE DROP's junk rows draw SOLID; COAST CLEAR's beam wedge is removed (the lamps stay).
- WATERCOLOR REWORK (Ben via the city chat, Nov 14): it read too close to crayon at 390. Watercolor = NO dark outline; transparent washes (lighter middle, the paper through); pigment POOLING darker at the edge; occasional bloom / cauliflower edges; a touch of bleed where colours touch; uneven, blotchy wash; the drips KEPT; the ghost + HOLD / NEXT in the same wash.
- CRAYON (Ben, Nov 14 7:58 am): a LIGHT texture tweak only — more hatching strokes, waxy grain, paper tooth in the gaps, a slightly heavier pressed edge; the same colours, papers, outlines, clears; its own commit (revertable) with BEFORE / AFTER shots.
- THE TEST: crayon, watercolor and paper side by side at 390 / 402 / 430, day board, unzoomed — "could you tell which is which at a glance?"
- SOUNDS: sourced sounds (Grok, CC0 / CC BY) replace the code-made ones where they exist; code-made stays the fallback.
- LOCAL TESTING RULE stands (repo public: no full local harbor; the cloud runs it).
- ADD-ON TO SKINS 2A — GROUP 4 (Ben, Nov 14 ~9 am — Grok's sounds are in: Downloads\grok\PrismSkins\ = 8 picks + 6 "-b" backups + CREDITS.md + SHA256SUMS.txt, WAV 44.1 k mono, trimmed, ~−22 LUFS): use the PICKS (watercolor-lock / -clear, paper-lock / -clear now; pixel-* + galaxy-* stay for SKINS 2B); the -b backups only if a pick fails. LICENCES: the sourced ones are CC0; the rest are GROK-GENERATED — fine to use (Ben checked Grok's terms), credited as "generated (Grok)". (1) The LOCK sounds get a small random pitch variation (±3 %) each play. (2) Balance by EAR in-game — paper-clear may be quieter than the other clears: a small gain in code so each skin's clear sits level with the others (and under the song). Copies only — never move or edit the originals. CREDITS lines from Grok's CREDITS.md.

### SKINS 2B — THE SHARE CARD's ONE RULE + ARCADE PIXEL + GALAXY + THE NIGHT ROTATION + GROK's NIGHT SOUNDS (Nov 14 2026)
- SHARE TODAY — ONE RULE (Ben, Nov 14 11:07 am, approved from a mockup): every section = (1) the daily's NAME, the same size + the same white neon for all (no win word, no WELCOME IN, no name-swap; the win shows in the art; a lost run = a small red word in the stat line, e.g. CAUGHT) · (2) ONE big TIME, the same size for all (2:54 / 2:12 / 2:38.9), a bit smaller than THE DROP's was · (3) ONE stat line (5 GUESSES / 1 SPOTTED · +30 s / 101 LINES) · (4) the art strip, a little taller: THE PASSWORD's tiles WITHOUT THE DOORS (bigger tiles), COAST CLEAR's 3 lamps, THE DROP's board crop 8 rows (was 6). The NEONSPEAKEASY.COM foot stays as big as now (the straight line, no pill).
- NIGHT POOL = neon · ARCADE PIXEL · GALAXY (rotation as SKINS 1: pool[k % n]); the settings' NIGHT row appears (ROTATE · NEON · ARCADE PIXEL · GALAXY tiles).
- ARCADE PIXEL lettering = "Press Start 2P" (free, SIL OFL — licence file + CREDITS line).
- GALAXY must read instantly (colour first) and must NOT read as neon (neon = glowing outline tubes with dark centres; galaxy = FILLED glowing clouds).
- THE TEST: neon / pixel / galaxy side by side at 390 / 402 / 430, a night board, unzoomed — "which is which at a glance?"
- No pills in anything new.
- ALSO (the pass text): THE PASSWORD's tiles bigger in the strip (it read small); the watercolor DAY SKIN settings tile shows the bleed (its three washes touching + bleeding, like the board).
- ARCADE PIXEL (night): blocks = an 8 × 8 chunky pixel grid (crisp, image-smoothing OFF, snapped to device pixels) — the piece's colour, a bright top + left edge, a dark bottom + right edge, 2–3 white glint pixels top-left, a rare darker pixel inside; 4 variants a colour; NO bloom on the blocks. Background: a deep blue-black radial, sparse pixel stars (a few twinkling), faint scanlines; the frame a crisp cyan pixel border. Ghost = a dotted pixel outline; incoming rows = grey pixel blocks with a red pixel edge (the same rules). The clear = a white flash bar across the row, then a burst of square pixels in the pieces' colours + a big "LINE!" (or the clear's name) in Press Start 2P; Reduced effects = the flash only. Panels dark with a pixel border; ink ≥ 4.5:1.
- GALAXY (night): blocks COLOUR FIRST — filled mostly with the piece's own colour as a bright nebula swirl (2–3 soft cloud layers + a touch of a neighbouring hue), a STRONG glowing rim in the colour, a softer bright core, 3–5 tiny star points (decoration only); 6 variants a colour; the light layer adds a gentle bloom on the rims. Background: deep space, a faint nebula + a slow-drifting star field, DIMMED under the well; the frame a thin cool-white glow line. Ghost = a faint starlight outline; incoming rows = dark asteroid rock with a faint red rim. The clear = the row bursts into stardust + a brief soft supernova flash; Reduced effects = a quick fade. Lettering: the night font with a soft starlight glow.
- GROK's NIGHT SOUNDS: Downloads\grok\PrismSkins\ pixel-lock / pixel-clear / galaxy-lock / galaxy-clear (COPIES; the -b backups only if a pick fails). Sourced = CC0; galaxy-* are GROK-GENERATED (Ben checked Grok's terms) — credited "generated (Grok)". ≤ 30 KB each, loaded only when the skin shows; the LOCK sounds ±3 % random pitch; balanced on the game's sound bus, under the song.
- QUALITY: 60 fps on the mid-range profile in both new skins (a 4-line clear included); the low tier drops the star field drift / the stardust count / the scanlines FIRST, the board's sharpness LAST; only the shown skin's assets load.
- LOCAL TESTING RULE stands (no full local harbor). Known noise, not chased: PRISM full's REFRESH one-attack check, the city timing checks (cameras, radio, rebuild, stations, the toast, LOAD WEATHER, SIGHTINGS).
- ADD-ON TO SKINS 2B — GROUP 0 (Ben, Nov 14 11:16 am — the names can't be white no matter what): in SHARE TODAY (+ each daily's own card where shared), the NAME line carries the result — THE PASSWORD / COAST CLEAR in a clean GREEN neon when made, RED when failed (a modest glow — the name stays its small size; never WELCOME IN's blazing green). The big time stays white, the stat line stays grey. THE DROP's name stays WHITE (no win / lose). A failed run: the red name says it — NO extra red word in the stat line (drop the CAUGHT word). Shots: SHARE TODAY with all made, one failed, both failed — night + day (day: the same green / red in the day palette, readable). (It replaces the first bullet's "the same white neon for all" + "a small red word in the stat line".)
- ADD-ON TO SKINS 2B (Ben, Nov 14 11:25 am — THE PASSWORD's cards look off): (1) THE PASSWORD's OWN share card (night + day): each room = ONE centred column — the small door icon + its label (THE FRONT DOOR / THE BACK ROOM) stacked and CENTRED over ITS OWN grid; both columns top-aligned, the pair centred on the card, an even gap between them. Labels never hang off to one side or overlap the other column. The failed room's door + label stay red as now. (2) TALL GRIDS (e.g. the Back Room failed after 6 guesses while the Front Door took 2): on its own card the two columns stay top-aligned (the short one doesn't float mid-height). In SHARE TODAY, the PASSWORD strip keeps tiles READABLE — tiles shrink only to a floor (≈ 22 px on the 1080 card), and when a grid needs more height than the strip the strip grows for that card (readability beats equal strip heights); never a squashed sliver. Shots: THE PASSWORD's own card + SHARE TODAY with — both rooms in 2–3 guesses, the Back Room failed after 6, the Front Door failed — night + day, at real size. Re-run share-same.
- ADD-ON (Ben, Nov 14 — LIVE BUG): on the DAILY screen → SCORES, tapping ZACK's slim card opened the PRISM DROP game card — the tap went THROUGH the DAILY screen to the city behind it (a billboard). Fix as its own group, before the final test run + push: while the DAILY screen (any tab, any overlay of it) is open, NO pointer / touch / click ever reaches the city — the overlay captures every event over its whole area (incl. the slim cards, their effect surface / canvas, the gaps between rows, the panel padding), and the city's tap / billboard handlers ignore taps while a screen sits on top (check the shared "a screen is open" state, not just the target element). Find the exact leak and fix it at the shared layer, so every screen over the city (DAILY, SCORES, results, profile sheets) is covered — not just this one. A tap on a slim card on SCORES does nothing for now (no navigation), unless it already opens that player's profile — then keep that. Test: e2e-daily taps every SCORES card (incl. the edges + the gaps between them) over a city billboard and asserts no city / game card opens; repeat for the results list.

## FABLE REVIEW 2 — PRISM DROP: THE DROP + THE SKINS + THE SHARE CARDS (Nov 14 2026 — read-only)
- FABLE REVIEW 2 started (Nov 14) — read-only; Ben taps GO LIVE AT THE NEXT 4 AM after this review (after the fix pass if the review finds a must-fix in THE DROP itself).
- THE RESULT (docs/games/review-prism-2.md): **THE DROP — SAFE TO GO LIVE: NO, not yet** — the scoring + the cheat checks hold, but an honest run can be lost three ways around PAUSE and the page hiding (M1 a PAUSE tapped while a checkpoint uploads · M2 a hide in the same moment, or a shorter log chunk overwriting a longer one · M3 the hide's pause call lost). The fix pass's GROUP A (~1.5 h) first, then GO LIVE. Also found, outside THE DROP: SKINS 2B's tap-guard made the city's edges dead on desktop / iPad / a sideways phone (C1 — the city chat, live now).

## PFIX-3 — PRISM DROP: FABLE REVIEW 2's FIXES (Nov 14 2026)
- PFIX-3 (Ben, Nov 14 3 pm): fixes FABLE REVIEW 2 — Group A makes THE DROP safe; Ben taps GO LIVE AT THE NEXT 4 AM after this pass.
- Ben's calls: THE DROP's OWN share card joins the one rule (S9); THE PASSWORD's grids BOTTOM-aligned in SHARE TODAY like the approved mockup (N6; its own card keeps top-aligned columns under the labels); the pitched skin sounds KEYED to the song (S13); the share card BUILT BEFORE THE TAP (S11).
- C1 (the city's dead edges, from SKINS 2B) is fixed HERE, not by the city chat; C2 + C3 stay the city chat's.
- ADD-ON (the games chat, Nov 14 4:14 pm — built in PFIX-3): the YOUR CARD sheet (the share fallback) shows NO message over the card; a test / fake daily can NEVER reach a real card or the live site (the test switch is honoured only off Vercel).
- Ben (Nov 14 eve, mid-pass): in SHARE TODAY with all three, THE DROP's board box must be DECENT SIZED — the three COAST CLEAR lamps may shrink a little to give it the room. Built: the art strip's height is each daily's own (THE DROP 228 · COAST CLEAR 112 · THE PASSWORD the rhythm's 145).

## DFIX5 — COAST CLEAR's DIG FEEL + EVERYONE ON SCORES + THE TAP-THROUGH + THE SPOT ICONS (Nov 14 2026)
- Nov 14 — COAST CLEAR's dig lag (Ben: "noticeable lag on every tap"): an owner-only dig-time readout, a leaner server answer, an instant SONAR PING on touch with the number surfacing when it lands. Press-and-hold for buoys KEPT (Ben); digging on touch-down only if it still lags after this.
- Nov 14 — SCORES = EVERYONE by default (Ben: "show everyone playing the dailies, friends or not"): each daily's panel shows everyone's counting results (today's top 10 + YOU + SHOW ALL; ALL TIME the same); friends get a gold FRIEND mark on their card (hidden when the FRIENDS box is checked); a ☐ FRIENDS checkbox narrows every list to YOUR TABLE (unchecked on every visit). The ticket line = the everyone place ("4TH OF 12 TODAY"). Same-day throwaway profiles never appear. The TODAY'S SCORES / ALL TIME switch stays as it is. ALL TIME keeps its 10-days-played ranking + the 'span' average.
- Nov 14 — No tap on a screen over the city ever reaches the city (Ben's live bug: tapping a SCORES card opened PRISM DROP's billboard card).
- Nov 14 — COAST CLEAR's result = the time + one small drawn SEARCHLIGHT icon per spot (0–2); CAUGHT unchanged.
- BEFORE PUBLIC: the everyone lists are a cheater target (throwaways can learn the day) — harden or limit them before going public.
- Nov 14 (Ben, after DFIX5) — SHARE TODAY's COAST CLEAR section stays as it is: its three lamps (one lit per spot) already show the spots — no lamps beside the big time.

## JAYWALK (the owner, Nov 12–16 — DECIDED)
- JAYWALK (id jaywalk): a hop-through-lanes game on three.js 0.160 (the import map). Tap = hop forward, swipe = sideways, swipe down = back. 9 columns. Lanes: grass (+ obstacles) · road (cars) · water (long logs, 2–4 cells — the water kills; logs shorter + faster with distance; a log carrying you off the screen edge = a hit) · rail (trains, the signal lights first) · THE FLIGHT PATH (rare, from ~lane 150: THE BLACKBIRD — the tell = the radio crackle + runway lights racing to the crossing, ≥ 1.5 s to hop clear, then a split-second pass) · THE UFO (rare, from ~lane 100, never in the Blackbird's stretch: a slow diagonal drift, its beam circle on the ground = the warning; stepping in = abducted). No coins / pickups — just distance. THE ONE-UP (an extra life) is built behind ONE switch, default OFF: if ever on, multiplayer only, rare, from the seed, never above 3 lives.
- COURSES: random everywhere (a new seed every solo run + every match; the same course for everyone in a match); the same difficulty curve on every course; the opening is always calm. FIXED LANDMARKS every 50 lanes in this order — 50 THE DOCKS · 100 THE FISH MARKET · 150 THE RAIL YARD · 200 THE BRIDGE · 250 DOWNTOWN · 300 THE CANAL · 350 THE LIGHTHOUSE · 400 THE AIRFIELD → then the loop again, harder (their looks come in H5; the lanes inside stay random).
- THE WALL behind you (night: THE BLACKOUT, day: a FOG BANK) at a steady pace; its speed-up + THE END are a per-mode rules setting: SOLO ENDLESS = 1 life, no speed-up, no end · MATCH = 3 lives (host option 1), speeds up from ~4 min, THE MOTHERSHIP at ~6 min · DAILY (built later — DAILY A/B) = speeds up from ~3 min, THE MOTHERSHIP at ~5 min. THE MOTHERSHIP takes everyone still standing at its fixed tick (it plays as a win: "TAKEN AT LANE 212"); never in solo endless. Ranking = lanes reached, the earlier tick wins a tie.
- MULTIPLAYER (H4): one run each on the same seed; the others are see-through ghosts; no player collisions; a hit = respawn on the nearest safe lane where you died + ~2 s blink; out of lives = out (spectate). Farthest wins.
- THE CARD MOMENTS (the replay detects them; the flags ship in H6): jaywalk-boom = a Blackbird crossing on a flight-path lane the player was STANDING ON when its tell began, and the player hopped clear and was not hit · jaywalk-ufo = the UFO beam swept the player's cell (or the cell beside it) and that UFO never abducted them (the mothership never counts) · jaywalk-airfield = reach lane 400 in ONE SOLO run.
- LIVE PREVIEWS: the owner tests on his phone on CELLULAR — every JAYWALK pass ships its preview on the LIVE site at https://neonspeakeasy.com/jaywalk-lab.html (owner-gated, no room, no database writes, noindex); real matches from H4 through THE OWNER'S LIVE TEST. Never a 192.168 / tests/ link in a JAYWALK summary.
- PASSES: H1 engine + graybox · H2 night look + the kid + the hop feel + the sound audition · H3 solo endless · H4 multiplayer · H5 day look + landmarks · H6 the Blackbird / UFO / mothership moments + feat flags + the mix + credits · the review · the fix pass (flips playable) · DAILY A · DAILY B. Art style (chunky premium voxel vs smooth stylized) is decided before H2 — the engine never cares.
- H2's DECISIONS (the owner, Nov 16):
  - ART STYLE = SMOOTH STYLIZED 3D (rounded, glossy, toy-like — the target: Downloads\grok\jaywalk\concept\jaywalk-night-smooth.png; the layout spec in docs/jaywalk.md wins over the render's layout). The game underneath is unchanged; only the view.
  - MODELS = Kenney (CC0 — credit "3D models: Kenney — kenney.nl (CC0)"): 4 cars (sedan, hatchback, taxi, van), the commuter train (front + carriage), props (bush planter, street lamp, cone, jersey barrier, dumpster, box). Kenney's two trees are NOT used — the round puffy trees are built in code to match the concept. The kid, the logs, the ground, the water, the rails + the runway are built in code. Car lights are painted on the Kenney texture → we add our own emissive light quads + ground light pools.
  - THE WIDER VIEW: 11 columns visible = the 9 playable + 1 dimmer edge column each side (cars / logs / trains are seen coming before they enter play; the "carried off the edge" rule becomes visible). View only — the rules stay 9 columns. One camera setting, with a WIDTH 9 · 11 switch on the lab page for the owner to judge by feel; default 11.
  - ANTI-CHEAT (planned): H3 — the server notes a solo run's start + a speed check before a best counts; H4 — every hop-log chunk carries a rules-enforced server timestamp + the replay refuses a log that runs ahead of the real clock (THE DROP's slow-motion check both ways).
  - THE BOOT: JAYWALK's meta stays OUT of the boot (as H1) until the city's CHROMEBOOK pass trims the budget; JAYWALK's go-live waits for that pass's log.
  - The city's UFO + Blackbird are 2D sprites, not 3D models — JAYWALK's flying hazards are decided before H6.

## JAYWALK (the owner, Nov 16 — DECIDED, after H2 on his phone)
- The owner played H2 on his iPhone: "the game feels good", but it needs to be ZOOMED IN. The reference is Crossy Road's camera (a genre convention — the framing only; never its chicken, its blocky daytime look or its name): a much closer camera, a view that FOLLOWS the player sideways, and a slight TURN so the lanes run on a gentle diagonal.
- THE CAMERA: ~8 columns visible across the screen by default (ZOOM 7 · 8 · 9 on the lab to judge; the WIDTH 9 · 11 switch is retired). The 9 playable columns stay; the camera slides sideways with the kid (smooth, clamped at the play edges so cars + logs still show up before they reach him). THE SLIGHT TURN (yaw) with an ANGLE: STRAIGHT · TURNED switch on the lab; default TURNED.
- THE BLACKOUT stays (the owner's brother prefers it to an eagle: you see it coming) — the camera always keeps ~3–4 lanes visible BEHIND the kid so the darkness is seen climbing before it bites.
- Look fixes from the owner's review of H2: the water must read as water; the kid must always stand out; a real box truck; no junk-looking props.
- THE LOGS + THE WATER (the owner, Nov 16 10:56): the logs must look like LOGS (a wobbling trunk, bark with grooves, light cut ends with tree rings, a branch stub on longer ones, moss on some; at night the amber is only a thin underglow + a soft light on the water) and the water like WATER (teal-blue, ripples, a foamy shoreline, stretched neon reflections, sparkles) — all built in code, no sourced model / texture.
- CAR LIGHTS (the owner, Nov 16 10:55): BOTH headlights cast a beam + BOTH tail lights a red glow, at the lamps' real places on each model (the 4 Kenney cars, the box truck, the train's front); shorter + softer — a glow on the road (gone within ~1–1.5 cells ahead, ~0.5–1 behind), never a long spotlight; instanced, no real lights.
- THE JAYWALK LAB IS OPEN (the owner, Nov 16 11:22): his brother tests it on his own phone from a shared link → the owner gate is removed from jaywalk-lab.html (no whoami — ZERO server calls); it stays noindex nofollow, unlisted (linked from nowhere), no room, no database writes; everything on it stays. (This replaces "owner-gated" in the LIVE PREVIEWS line above.)

## JAYWALK (the owner, Nov 16 — DECIDED, after H2B on his phone)
- THE CAMERA defaults: ZOOM 8 + STRAIGHT (the owner's pick so far; he is still testing with his nephew — the lab keeps ZOOM 7 · 8 · 9 + ANGLE so a later pass flips it in one line).
- LOGS: all the SAME THICKNESS, each its OWN LENGTH (1–4 cells, from the seed), UNEVEN GAPS; long logs more common early, short ones later (the difficulty curve). No moss, no branch stubs, no dots — nothing on a log that could read as a pickup (JAYWALK has none).
- WATER: a clearly brighter, saturated night blue that stands out from the dark grass + roads at a glance — water you would never step into.
- TAIL LIGHTS: both tail lights glow; the neon light trail comes from BOTH tail lights as two thin, short, fast-fading streaks (cars, the truck, the train) — never one long lopsided beam.
- THE END SCREEN names how you went out, in big neon words (e.g. FLATTENED BY A TAXI · SWEPT AWAY · HIT BY THE 6:15 · THE LIGHTS WENT OUT — one line per cause + vehicle).
- THE COURSE IS PICKED AFTER GO: seed = hash(room code + matchId + the server's GO timestamp) — no one can shop for an easy course. Every hop-log chunk carries a rules-enforced server timestamp; the replay refuses a log that runs AHEAD of the real clock or far behind it (THE DROP's slow-motion check both ways). (Moved here from H4 — solo bests need it.)
- OPTIONAL, not now: a ghost of your own best run.
- The lab (https://neonspeakeasy.com/jaywalk-lab.html) stays OPEN for the owner's family to test — it never reports a score.

## JAYWALK (the owner, Nov 16 — DECIDED, after H3 on his phone)
- ONE LIFE EVERYWHERE (solo, match, daily): one hit = out. DROPPED: the lives host option, respawn + blink, THE ONE-UP switch, the lives HUD. A match ends when the last player is out, or THE MOTHERSHIP at ~6 min takes whoever is left (rare — a reward). Out = SPECTATE (the camera follows the leader's ghost, everyone's live lane count, Call the Winner). Farthest wins; ties → the earlier tick.
- The owner's H3 review: PLAY AGAIN replaces "HOP AGAIN" everywhere (the game + the lab). End-screen buttons in the site's own non-pill style (the owner hates pills). The TAXI stays yellow with its roof light (the cause line "… BY A TAXI" must be true); the other cars keep their neon tints. THE WATER = calm, real-looking night water (no electric zigzags). LOG ENDS = plain pale wood with subtle rings (no shell-like look). THE FLATTENED KID = a funny cartoon flat kid (squashed flat, his cap on top) — never a smear.
- THE ICON = THE SIGNAL (the owner's pick from Grok's three): a pedestrian crossing-light box, upright, CYAN outline, with the walking figure lit HOT PINK inside (lit when it shouldn't be — the jaywalking joke). Reference: Downloads\grok\jaywalk\icon\icon-2-signal.png (+ the set: reference-icons.png). Built in the game's own tube icon system so its tube thickness + glow match PRISM DROP / OVERCLOCK / HOLD'EM. Upright + cyan keeps it apart from HOLD'EM's tilted gold card.
- THE SHARE IMAGE = the player's real run: the game frame frozen at the moment they went out + the lanes in big neon numerals + the cause line + the icon + the site name. Every share is different.
- THE POSTER (for THE TRI-VISION billboard's JAYWALK COMING SOON face — the city chat swaps it in): rendered from the game itself, never Grok.
- THE DROPPED SIGNAL (a phone in a moving van): a lost connection of up to ~60 s must NEVER cost an honest run; slow-motion play must still be caught.

## JAYWALK (the owner, Nov 16 — after his first live match)
- The owner played a live match: SPECTATING "looks great"; but the GHOSTS walk through cars and water, and the first seconds of the match felt laggy.
- Cause (docs/jaywalk.md): ghosts are drawn GHOST_DELAY (75 ticks = 1.25 s) behind the clock while the world is drawn NOW — a friend safe on a log 1.25 s ago is drawn in the water today.
- THE RULE FROM NOW ON: a ghost is ALWAYS drawn consistent with the world on screen — never inside a car, never in the water while alive.

## JAYWALK (the owner, Nov 16 — DECIDED, H5A)
- THE CAR LIGHT TRAILS go (they read as jet exhaust from above — afterburners are THE BLACKBIRD's alone, H6). Keep: two lit tail lights on the body, the soft red glow on the road behind, the soft headlight glow in front.
- THE SHARE = THE PICTURE ONLY: SHARE sends only the link (navigator.share({ url })); its preview picture = the run's card; tapping it opens the site. No text. The card shows the cause ONCE; the game frame bigger + brighter.
- THE KID = Kenney's "Mini Skate" skate boy (CC0, 722 triangles, rigged, 36 animations incl. idle / walk / jump / sprint) — Downloads\grok\jaywalk\models\kid\ (kid.glb, its shirt split to the material "top"). A T-shirt + a FORWARD cap built into the head (accepted). The CAP + the SHIRT are tinted in the player's colour (from above you mostly see the cap). Replaces the code-built kid everywhere.
- THE AREAS — a new area every 50 lanes, fixed order: 50 THE DOCKS · 100 THE FISH MARKET · 150 THE RAIL YARD · 200 THE BRIDGE · 250 DOWNTOWN · 300 THE CANAL · 350 THE LIGHTHOUSE · 400 THE AIRFIELD → then the loop again, harder. A WHOLE STRETCH looks like the place; each LEANS its lane mix (the rail yard = more trains, the canal = more water, downtown = heavier traffic, the airfield = more flight paths …) with the difficulty curve still climbing underneath; an ARRIVAL GATEWAY (a neon arch / sign with the area's name + the landmark sound). H5A = the night look; H5B = the day look for everything.
- THE SOUNDS (the owner picked ALL A): train-bell (loops while the rail signals flash) + train-pass, car-pass (real near misses only, ≤ 2 at once, panned), horn (≤ 1 per 3 s), lights-die (THE BLACKOUT taking a lane near you), landmark (entering an area). "respawn" is unused (one life). No traffic ambience bed.
- MODELS IN THIS PASS: the kid (Kenney CC0), lighthouse.glb (MaverickFX, CC0) + fishing-boat.glb (Kenney CC0) from Downloads\grok\jaywalk\models\landmarks\. A dock crane + an airfield control tower / hangar are built in code. (The flyers in models\flyers\ wait for H6.)

## JAYWALK (the owner, Nov 16 — DECIDED, H5B)
- SOUNDS (the owner, playing H5A): the HORN at HALF its level (still ≤ 1 per 3 s) · the CAR-PASS near-miss "whoosh" REMOVED completely ("it's terrible") · the train sounds FADE OUT (never a hard cut) · a better TRAIN BELL + a TRAIN HORN blast come from Grok (Downloads\grok\jaywalk\sfx2\).
- THE HEADER: "JAYWALK · SOLO" / "JAYWALK · MATCH" bigger + bolder (a real header, not a faint label).
- THE END-SCREEN BUTTONS become ONE SHARED STANDARD for every game (the owner's pick "A — the hero bar": a big solid PLAY AGAIN / REMATCH bar in the game's accent + quiet SHARE · CITY links) — built by the CITY CHAT in the console's frame AFTER JAYWALK finishes; JAYWALK does not build its own.
- THE BILLBOARD: the owner picked a real-game OPEN NOW poster (Downloads\NEON\jaywalk-billboard-open-now.png) — the city chat installs it; JAYWALK's poster mode stays as a tool, no new poster this pass.
- THE LANDMARKS must be SEEN: at ZOOM 8 the edge-column hero pieces are usually off-screen → each area's landmark silhouette lives in the SKYLINE BAND while you're in it + one guaranteed landmark moment beside its arrival gate.
- THE DAY LOOK: every JAYWALK screen has DAY + NIGHT (the site's rule); night = neon; day = a sunny harbor. THE BLACKOUT by night = A FOG BANK by day. Same rules in both.
- THE ADD-ONS (THE ADD-ON INBOX, Nov 16 9:10 pm + 9:15 pm — the owner, after a 4-player match with family):
  BLUE ON THE GROUND = WATER, NOTHING ELSE (players hesitated to hop onto things that looked like water): the friend line NEON PINK and a line you CROSS (a tape between two posts, a little above the ground); THE WATER = video-game water by night too (a clear saturated blue, ripple caps + specks drifting with the current, a bold foam line at both banks, a soft shadow under each log) — readability beats realism; nothing else on the ground blue / cyan / teal.
  THE RAIL SIGNALS FLASH ONLY BEFORE THE TRAIN: flashing red = a train is COMING; dark once its nose is in the lane, through the pass + after it; the bell the same. View + sound only.
- NOT DECIDED (OPEN FOR BEN — H5B): a MATCH on the HOST's look, locked. The site's GAME LOOK has been per phone with no lock since SHELL 2.0 B2; H5B built JAYWALK on that rule (each phone its own look, a match too).
- THE ADD-ON (THE ADD-ON INBOX, Nov 16 9:20 pm — the owner: "your fix to the ghost problem is perfect"): THE GHOSTS STOP BLOCKING YOU — keep the ghosts; near you = faint (≈ 15 %, no tag), your own kid always on top; the names lined up once through the 3 · 2 · 1; stacked tags merge (the leader + "+N"). View only.
- THE ADD-ON (THE ADD-ON INBOX, Nov 16 9:45 pm — the owner: "make sure it's done"): THE TAIL LIGHTS (night) — the red glow has a visible SOURCE (two bright red lamps on the body) and is ONE soft merged pool pinned under the rear, inside its lane; never two streaks set behind the car, never a gap. The headlights stay as they are. Day: no glow.

## JAYWALK (the owner, Nov 16 — DECIDED, H5C)
- THE QUALITY BAR (the owner, playing H5B: "I don't want any weak points"): extremely premium, top tier; nothing flat, cheap, clip-art or placeholder-looking; everything readable on an iPhone held upright at real size (390 × 844), by DAY and by NIGHT; 60 fps measured. Every change a VIEW.
- THE MATCH LOOK: each phone plays a match in its OWN GAME LOOK (the site's per-phone setting; same course, clock, rules). Accepted by the owner. A site-wide host lock = a possible city-chat item later; JAYWALK builds none.
- THE DAY LANDMARKS = 8 PAINTED DAY SKYLINES (Grok — the same picture as skyline-day with that area's landmark painted in; horizon row 444 / 720 in all; the middle top clear), CROSS-FADED at each area's gate. The drawn day landmarks (skymarks.js by day) are RETIRED; the NIGHT neon-outline landmarks stay as they are.
- A REAL FAR EDGE: the course ends at a SEA WALL against the skyline's sea; nothing half-see-through ever floats over the backdrop.
- THE FOG BANK = rolling, layered, moving fog (never a flat slab).
- BLUE ON THE GROUND = WATER (H5B's rule) holds for props too where they read as ground-level colour (the drums → warm colours).
- THE LINES: YOUR BEST = a GOLD TAPE between two posts (the same form as the friend's PINK tape); a line's words are ALWAYS readable (never hidden under a log / car).
- THE GATE'S NAME stands ON THE GATE'S ARCH, above the kid — never covered by him.
- THE TRAIN SOUNDS = set B (Downloads\grok\jaywalk\sfx3\: the North American crossing bell — Brylon Terry, SoundBible, CC BY 3.0 · the commuter horn — AMBIOSIS, Freesound 316689, CC BY 4.0). THE AREA ARRIVAL = "achievement-sparkle" by SkySpeira (Freesound, CC0; Downloads\grok\jaywalk\sfx4\).
- EVERY PASS from now on ends with A FRESH-EYES REVIEW (a reviewer with a fresh context looks at the full shot set against THE QUALITY BAR; its report kept verbatim in the pass log) before its final run.

## JAYWALK (the owner, Nov 16–17 — DECIDED, H6A)
- THE BLACKBIRD: the tell stays (the runway lights racing + the chevrons + a radio crackle); in its LAST 0.5 s a glint + an afterburner flare at the screen edge it comes from; the pass = the real SR-71 model low across the band with blue-white afterburners, a shockwave ring, a white flash on the band, a tiny screen shake; jet scream + sonic boom. A hit = the SHOCKWAVE blasts the kid tumbling away ("BUZZED BY THE BLACKBIRD").
- THE UFO ABDUCTION (the owner: "it's got to look more impressive"): freeze mid-step → the circle flares → a bright beam slams down → the kid floats up spinning + shrinking into the saucer → its lights pulse → it zips off → the beam snaps out (~2 s) → ABDUCTED. By day a chrome saucer in the sun, its beam still clearly visible.
- THE MOTHERSHIP = A FINISH LINE, NOT A DEATH: solo stays endless (no mothership, ever). In a match (6:00) and the daily (5:00, built later): a 10-s WARNING (the timer red + pulsing, a giant shadow sliding over the road, a deep hum building), then the colossal ship fills the top of the screen and ONE huge white-gold beam lifts EVERY kid still in, each glowing in their colour. The end screen = gold "YOU MADE IT TO THE MOTHERSHIP" + the lanes + a crown moment; the farthest still wins the match. Never "TAKEN" in anything a player reads (the internal cause key may stay 'taken').
- FOUR CARDS (achievements, game 'jaywalk'): SONIC BOOM (jaywalk-boom) · CLOSE ENCOUNTER (jaywalk-ufo) · RIGHT OF WAY (jaywalk-airfield — lane 400 in ONE counted run, SOLO OR MATCH — no longer solo-only) · BEAM ME UP (jaywalk-mothership — NEW: still in when THE MOTHERSHIP arrives, in a counted match / daily). Art: Downloads\grok\jaywalk\cards\ (sonic-boom.png, close-encounter.png, right-of-way.png, mothership.png — Grok may re-deliver the last two; H6B re-copies them).
- YOUR BEST = your FARTHEST COUNTED RUN ANYWHERE, solo or match (the owner: his 212-lane match counted for XP but not for his best). The daily keeps its own day board. Unproven runs never count. A one-time catch-up credits past counted match runs.
- THE SOUNDS for these moments = the city's existing, already-credited set (audio/city: jet-scream, sonic-boom, radio-static_*, ufo-hum*, ufo-beam-on / -idle / -off, ufo-lift, ufo-depart); THE MOTHERSHIP = the UFO hum pitched down + a low rumble.
- NEXT: H6B (Opus) — the painted night skylines (Grok), the gate sign only on the approach, compact match chips, NEW BEST = its B take, Downtown's shops, the sound mix, the credits screen.

## JAYWALK (the owner, Nov 17 — DECIDED, H6B)
- THE NIGHT LANDMARKS = 8 PAINTED NIGHT SKYLINES (Grok — skyline-night with each area's landmark painted in, lit; pixel-identical outside the landmark), cross-faded at the gates like the day set. The drawn night landmarks (skymarks.js) are RETIRED.
- THE GATE SIGN shows ONLY ON THE APPROACH — fully gone by the time the kid is 3 lanes from the gate; it never covers a lane he's about to cross.
- THE UFO = a SOLID chrome saucer (never see-through), smaller + higher so it never hides a hazard, bright rim lights, a strong beam; the kid goes INTO its hatch. Traffic never drives through a beam unnoticed.
- THE BLACKBIRD a little bigger with BLAZING afterburners. ONE Mothership countdown on screen (the big red one).
- NEW BEST = its B take ("Fantasy Achievement Unlock Magical Stinger" — TommasoMotteran, Freesound 859080, CC BY 4.0); the sparkle stays THE AREA ARRIVAL only.
- The owner's 212 is NOT restored (the server never kept match lanes) — the owner lets it go; no admin tool.
- BEAM ME UP = EPIC (accepted).
- The lab gets ?lane=N (a look check: start at lane N, WARPED, never counts).

## JAYWALK (the owner, Nov 17 — DECIDED, THE GO-LIVE REVIEW)
- JAYWALK is FEATURE-COMPLETE after H6B. The owner's calls on H6B's OPEN list: the look switch KEEPS its 1.5 s cross-fade · Downtown's edge shops partly off screen = fine (edge scenery) · the opening stretch has no landmark = fine (home) · the Blackbird's DAY tell = MUST be clearly readable (fairness) · the bridge behind the match chips, the first look switch's hitch, the fog's banding, the 3-digit count near the landmarks = fix.
- THE TWO DARK NIGHT TOWERS (Grok unavailable): the go-live review LIFTS them in our own copies (the rail yard's water tower + gantry, the airfield's control tower) — Grok's touch-ups may replace them later.

## JAYWALK (the owner, Nov 17 — DECIDED, BEFORE THE FLIP)
- THE AREA ARRIVAL: the approach sign readable in BOTH looks; + THE ARRIVAL BANNER at the crossing (the area's name big at the top of the screen + "LANE 50", ~2.5 s, timed with the arrival sound, never over the lanes).
- THE CAMERA + THE SOUNDS ARE PINNED for everyone at go-live: ZOOM 8 · STRAIGHT (the owner, Nov 17); the takes as picked (all A, except NEW BEST = B; the train = set B; the area arrival = the sparkle). The lab keeps its switches for itself; the game never reads the lab's settings.
- THE RUN CARD UPLOADS ONLY ON SHARE (the owner, Nov 17 — the review's storage finding): nothing is uploaded unless the player taps SHARE; kept 7 days as now.
- THE "WEBGL CONTEXT LOST" reports in the CITY were JAYWALK's own teardown (most likely) — fixed + proven here.

## JAYWALK (the owner, Nov 17 — DECIDED, THE GO-LIVE PASS)
- JAYWALK GOES LIVE: playable for everyone (config.js GAMES row), its meta + HOW TO PLAY + tile in the boot, its tab on THE BOARD.
- The database rules are RE-PUBLISHED by the owner (the review's + CITY F's) — the rules-live fixture follows.
- The owner's phone check moves to RIGHT AFTER this deploy, before his OPEN DAY switch (the site has no traffic yet; he has told no one).
- AFTER LAUNCH (not this pass): a small JAYWALK polish pass — a dark band behind the share card's cause line (the owner: yes), the far lanes dark after a real lost context, a car covering the lines' words in places. THE TRI-VISION never shows JAYWALK's face (a CITY bug, sent to the city chat) — not this pass's.

## JAYWALK (the owner, Nov 18 — DECIDED, THE POLISH PASS)
- YOUR TABLE = one centred grid (RANK | CARD | SCORE), equal side margins, every card the same size + left edge (the owner: "has to be centered or aligned better").
- THE SHARE CARD's cause line sits on a dark band (readable over the bright river at link-preview size) — the owner: yes.
- HOW TO PLAY gains ONE line: the Mothership ends a MATCH at 6:00 (everyone still in is lifted; farthest wins) — never in solo.
- THE DAILY (built later by the dailies chat): its personal best is labelled "DAILY BEST · 168 LANES" / "NEW DAILY BEST" (the games chat's suggestion; not the solo / match YOUR BEST).

## JAYWALK (the owner, Nov 18 — DECIDED, THE TOUCH-UP PASS)
- The owner's calls on THE POLISH PASS's OPEN FOR BEN: slim-card names = ONE line, shrink to fit, an ellipsis only as a last resort (accepted).
- THE SHARE PICTURE ALWAYS SHOWS THE KID: the frame is taken per cause at the moment the kid is still clearly SEEN (a vehicle / the Blackbird as now when he shows · WATER mid-splash, head + arms above · THE BLACKOUT / THE FOG as the wall reaches him · THE UFO mid-lift · THE MOTHERSHIP rising in the beam) — both looks.
- Words in the game's PINK over the play get a dark outline (the friend line's words, the ghosts' tags, any pink HUD word over the scene); the gold YOUR BEST words too where they need it.
- The player's OWN ROW in YOUR TABLE glows (a soft light in his own colour around his row + the pink rank) — never a pill, never shifting the grid.
- THE DAY END SCREEN's title sits on a soft dark fade at the top (readable on the bright day sky).
- The near-black far grass by night = LEFT AS IS.

## DAILY A / B — approved Nov 18
- COAST CLEAR: config CC_DIG_ON: 'down' | 'up' (default 'down'). 'down' = DIG mode digs on touch-down; buoys from the BUOY switch only (no press-and-hold). 'up' = exactly today's behaviour (dig on lift, press-and-hold = buoy). Both: the tile reacts the instant a finger touches it (presses in + a pulse), then shows a digging state until the server answers. The ping + surfacing stay.
- COAST CLEAR: the board sizes to the space actually left (header, owner readout line, DIG / BUOY); no row ever cut off at 375 / 390 / 402 / 430 wide, both looks.
- DAILY BEST for all four dailies, kept on the server, backfilled from past days: PASSWORD = fewest guesses (a lockout doesn't count) · COAST CLEAR = fastest clear (caught doesn't count) · THE DROP = longest time · JAYWALK = most lanes. Server in A, ticket in B.
- JAYWALK daily: dailySeed('jaywalk', day); MODES.daily (ends at THE MOTHERSHIP, ~5:00); score = lanes, then the earlier tick ('high'). 3 tries, best counts. Counts at the FIRST finished try (streak, XP once, THE SWEEP, PERFECT WEEK, THE THROWAWAY GATE). Best try = score / lists / PENTHOUSE / points. Everyone's scores unlock after the first try. Unused tries expire at 4 am. Practice never uses the day's seed.
- JAYWALK run path: hops go to a Firebase proof node as server-timestamped chunks (THE DROPPED SIGNAL rules); START + FINISH; the server replays the hops. No pauses, no resume: a refresh, hiding the app or THE ROOM WINS ends the try. Reuses THE DROP's bookkeeping only.
- The 4 conditions: (1) the server scores an unfinished try on the next start / today call or at the day's close; (2) THE ROOM WINS ends a try (banner text is B's: "TRY ENDED · N TRIES LEFT", no RESUME), the dy flag still set; (3) proof-node rules: append-only, server timestamps, nothing after FINISH or after the day ends, no 4th try, with rules tests; (4) prune proof nodes after ~7 days.
- JAYWALK points: a capped lanes curve in core/daily-points.js. ALL TIME = the shared average rule. THE SWEEP + PERFECT WEEK need all four live dailies. XP unchanged.
- JAYWALK ticket colour orange: night #ffa53a, day #e0661c (TICKET_INK; used in B).

## DAILY B — approved Nov 18
- JAYWALK's daily tries count for JAYWALK's four cards (as THE CARDS already says: "a counted match / daily") and raise YOUR BEST — server-judged results only.
- COAST CLEAR's dig timing stays a code switch only (`CC_DIG_ON`), never a player setting.
- JAYWALK's points cap stays at 300 lanes; Ben looks again after a week of real tries.
- THE SWEEP meter has one segment per LIVE daily (3 until JAYWALK goes live, then 4).

## DAILY FIX — approved Nov 18
- JAYWALK between tries: the big line reads "LAST TRY · 143 LANES" (today's score is the best try, not the last).
- SAVE YOUR KEY never pops over THE DAILIES screen; it waits until the player leaves it.
- JAYWALK's daily keeps the mood station (no own song set).
- Every PLAY button takes its own ticket's colour (TICKET_INK), both looks.
- The ticket number, THE PASSWORD's day stamp and the share card's thin lines get enough contrast to read on the phone.

## HIGH RISE — S1 (approved Nov 18)
- HIGH RISE (game id `highrise`, was STACK): a 3D neon glass-slab tower-stacking mini game. One tap drops each slab; the overhang slices off; a PERFECT snaps into place. Signs read HIGH / RISE stacked. JAYWALK is its benchmark + engine formula. Built on the beelink.
- THE ONE RULE: a pure engine — same seed + same tap log → the exact same run on any phone and the server (REPLAY = LIVE). Integers / fixed point only; no floats in the rules, no Date / Math.random / performance in the rules.
- Square slabs; the first slab ≈ 60% of the screen width. The slide alternates direction every floor (x then z); the seed picks only which end each slab starts from (fully off the tower).
- PERFECT = within 5% of the STARTING width (a fixed window; never shrinks). GROW-BACK: after 6 perfects in a row, each further perfect adds back 4% of the starting width on the cut axis, never past the start size.
- The FUSE: an untapped slab drops by itself at the end of its 2nd sweep. A short LANDING BEAT after each drop ignores taps.
- OUT: a complete miss → MISSED THE STACK · a slab under 5% of the start width → SLIPPED OFF · the fuse's drop misses / thins out → TOO SLOW (the fuse drop is otherwise a normal drop) · floor 200 in a match / daily → MADE IT TO THE MOTHERSHIP (a finish).
- MODES: MATCH = finish at floor 200 + a 6:00 cap · DAILY = floor 200 + a 5:00 cap · SOLO = endless. RANKING: height, then the earlier tick.
- THE SPEED CURVE is set by the bot sims to hit the targets (sloppy 30–60 s · good 2–3 min · near-perfect floor 200 ≈ 3:30).
- FAIR TAPS: a tap counts at the finger's touch (pointerdown event.timeStamp → its tick), not the next frame.
- THE LAB (highrise-lab.html) NEVER COUNTS: zero server calls, zero database writes, nothing from /api, the report, progression or the profile — a test proves it.
- The rest of the plan (looks, heights, flyers, match tapes, daily) lives in docs/highrise.md and arrives in S2–S5.

## HIGH RISE — S2 (approved Nov 18 — the owner's plan as pasted into Claude Code at 10:35 pm; the S2 prompt itself never reached the pass: it was built from this plan)
- S2 = THE NIGHT LOOK + SOLO on an UNLISTED page: **neonspeakeasy.com/highrise-play** — anyone with the link plays SOLO (the owner's brother tests it). Linked from nowhere.
- **NOTHING COUNTS UNTIL GO-LIVE**: no XP, no streak, no bests on the server, no YOUR TABLE, no cards, no share card — scores start clean at launch (the tuning may still change). YOUR BEST on the test page = THIS PHONE only.
- COUNTING (the judge wired into /api, the solo run node + the match proof node = ONE rules change, one re-publish) moved to S4. THE LAB (/highrise-lab) stays the graybox + never counts.
- SOLO PAST 200 KEEPS TIGHTENING (solo only): from floor 200 the sweep shortens every 10 floors so even a near-perfect player falls (target ≈ floors 300–400, 6–7 min). Match / daily unchanged (they stop at 200).
- RANKING: floor first; at the SAME floor (above all: the Mothership finishers) → MOST PERFECTS → then the earlier tick. Match + daily alike. The podium shows "182 PERFECTS".
- HIDING THE APP = NO PAUSE (JAYWALK's rule): the clock runs on, the fuse ends the run as TOO SLOW. The daily follows JAYWALK's daily rule.
- THE LOOK (night): slabs = smoked glass + neon edges, chrome; glass = reflections + a fresnel rim + lit edges — NOT three.js transmission. The overhang slices off and tumbles with sparks; a PERFECT snaps + pulses a ring of light; grow-back. Instanced slabs, pooled falling pieces, GPU sparks; JAYWALK's tiers, warm frame, lost-context rebuild; a measured 60 fps. The HDRI pre-shrunk to a small reflection map (the night one: its upper, sky half only); only the active look's loads.
- THE CAMERA: diagonal (~45° turn, ~30–35° down, a narrow lens), climbing with the top slab. HUD: the big floor number + the band's name at the top; the announcer lane under it; (the altimeter = the match, S4).
- THE HEIGHT AREAS (painted plates cross-faded as you climb; each band its own slab colour set): 0–25 the harbour rooftops · 25–60 the skyline · 60–110 the clouds · 110–170 the stars · 200 THE MOTHERSHIP · solo beyond: deep space. Only the current look's set loads; only the current band + the next in memory; plates drift slower than the tower; bands cross-fade over ~8 floors (~12 at the 2→3 seam).
- THE LINES: YOUR BEST = a GOLD tape (a thin outline band, no fill) on the tower at your best floor; while it is ABOVE you it is a right-edge tag "BEST 57 ▲12" (never over the drop zone); crossing it → the gold band appears at that floor with a flash + NEW BEST. (THE NEXT FRIEND = the same in PINK, from S4's counting on.)
- THE SOUNDS: a SOUND AUDITION like JAYWALK's (pick vs backup / in-code variants, COPY MY PICKS). THE PERFECT CHIME climbs a bright major-pentatonic scale, one step a perfect in a row, holding at the top after 8. Triggers: drop (every landing, a slight pitch vary) · perfect · slice · falling-piece ~0.1 s after · grow-back · streak (every 10) · out · pass (match) · band-arrival.
- THE ASSETS (Grok — Downloads\grok\highrise, approved Nov 18): plates\ night-1…5 (+ the day set for S3) · hdri\ night.hdr (Shanghai Bund) + day.hdr, Poly Haven CC0 · sfx\ 1-drop … 9-band-arrival (CC0; 3-slice-v2 + its -b) · cards\ (S3 / S4) · mockups\ highrise-night.png / highrise-day.png (the approved look).
- THE FLYERS (the Blackbird OR an F-22 pair · the UFO · THE MOTHERSHIP) + the DAY look + deep space + the 2 cards' art = S3. THE MATCH + counting = S4. THE DAILY = S5.
- The model: FABLE; if its credits run out mid-pass, finish on Opus 5.5 high.

## HIGH RISE — S2 FIX (approved Nov 19)
- Ben's phone check of S2: the glass, the sliding slab, cuts + sparks + the perfect ring and the backdrops all approved; 60 fps at tier 2 on his iPhone — but RANDOM LAG spikes he can feel.
- YOUR BEST tape = a THIN glowing gold OUTLINE round the tower (not a solid band — it read as a slab).
- The end screen gets the STANDARD FOOTER: one big solid glowing PLAY AGAIN bar in HIGH RISE's accent (no pill shape); tap-anywhere-after-0.6 s stays.
- The sounds ship compressed (not WAV).

## HIGH RISE — S3 (approved Nov 19)
- Ben's S2 FIX check pending on the phone (HITCH line). Ben's SOUND PICKS (final): ALL A — drop A (as recorded) · perfect A (the chime starts an octave down) · slice A (the glassy snap) · falling-piece · grow-back · streak · out · band-arrival · pass all A. The B takes leave the game.
- NO DAILY for HIGH RISE (Ben, Nov 18): the seed barely changes play. The engine's daily mode stays unused. (Parked idea for later only: a one-shot "TODAY'S TWIST" daily.)
- THE LOOK SWITCH: day / night follows the real sun (AUTO, the site's own sun rule as JAYWALK's); the test page's start screen has AUTO / DAY / NIGHT (remembered on this phone, try/catch); a switch cross-fades in 1.5 s; only the active look's plates + reflection map are kept, the other prewarmed on switch (no hitch).
- THE DAY LOOK: frosted glass + polished chrome rims, soft colour showing through (pastel per band), sunlit from one side, the day reflection map; the SLIDING slab gets a stronger colour + an edge glow so it never washes out.
- THE FLYERS (spectacle only, never hazards, never over the play zone): the seed's flyerFor picks THE BLACKBIRD or AN F-22 PAIR at floors 35–45 · THE UFO (AMBER rim lights + VIOLET underglow, no beam, no ground ring — never like JAYWALK's) around floor 85 · THE MOTHERSHIP seen from ~180, colossal at 200.
- FLOOR 200: SOLO flies past the Mothership into DEEP SPACE (a moment, then on); MATCH = THE FINISH (white-gold light pours onto the top slab → MADE IT TO THE MOTHERSHIP, gold) — previewable on the test page with ?mode=match (nothing counts).
- THE 2 CARDS' ART is prepared in S3; the cards are added + awarded in S4 (server-judged runs only, hidden until go-live).

## HIGH RISE — S4A (approved Nov 19)
- Ben's S3 check: day + night looks, flyers, the Mothership and the gold-light finish all APPROVED. (His HITCH run comes later.)
- SOUND SYNC (Ben, Nov 19 — "sometimes the sound isn't in sync with the blocks"; he plays with MUSIC OFF, phone speaker): cause = PODCAST MODE naps the context 150 ms after each sound and an effect must wake it (a variable iOS delay). FIX: a game holds the context AWAKE while a run is LIVE (naps again on the start / end screens; the 'ambient' session unchanged so podcasts keep playing); every sound decoded before the first tap (no late path in play). Applied to HIGH RISE + JAYWALK.
- S4 SPLIT: S4A = sound sync + the hidden cartridge (owner-only, solo) + counting built OFF · S4B = THE MATCH.
- COUNTING stays OFF until go-live behind ONE server switch; while OFF the server judges every cartridge run + shows "WOULD COUNT" on the end card, awards nothing.
- XP + THE STREAK: a counted HIGH RISE solo run / match gives XP + keeps the streak, by JAYWALK's rules.
- THE CARDS: ABOVE THE CLOUDS (floor 60, one run, any mode) · TOP OF THE WORLD (floor 200) — in the catalog, HIDDEN until go-live, awarded only from a server-judged run once counting is ON.
- THE NEXT FRIEND = a PINK thin tape (the gold tape's style), the lowest friend best above you from YOUR TABLE; above you = a right-edge tag "LIAM 57 ▲12"; one friend at a time; solo only.
- A MATCH: each phone in its own day / night look (JAYWALK's accepted rule).

## HIGH RISE — S4A FIX (approved Nov 19)
- Ben's iPhone (?fps=1, Safari): 60 fps average but HITCH 88 (day, floor 83) and HITCH 52 (night, floor 53), the last cause "gc 41 ms" both times — about one 2–3-frame stall per floor = the "random lag". The S2 FIX cut garbage 6× on the PC; Safari is far more sensitive. TARGET: ZERO allocations in a live run's steady state (the only reliable way to HITCH 0 on iOS).
- THE UFO: its amber rim lights on the FAR side showed THROUGH the hull (dimmed to 40%, drawn as glows on top). Far-side lights must be fully hidden, fading in / out as they round the rim; both looks.
- THE PINK FRIEND TAPE: a WHITE core inside the pink glow (it read only by its glow over the rooftops' pink slabs).
- THE ICON = "A · THE TOWER" (Ben's pick, Downloads\NEON\highrise-icon-options.png): a cyan isometric stack + the pink slab dropping on top.
- S4B decided: only THE OWNER can start a match (in a room he hosts); others join and play; fewest players 2; anyone who joins mid-match WATCHES until the REMATCH.

## HIGH RISE — S4A FIX, THE ADD-ONS (the owner, Nov 19 — through THE ADD-ON INBOX, built in the same pass)
- THE WELCOME (START) SCREEN = "A · THE SIGN" (his pick, Downloads\NEON\highrise-welcome-A.png): no box / panel — the sign big in the sky, the real tower standing low with a first slab sliding in, YOUR BEST as the real gold tape + its tag, TAP TO START big at the foot.
- THE END SCREEN = "A · THE HERO NUMBER" (his pick, Downloads\NEON\highrise-end-A.png): the cause small → the floor number huge → FLOOR · THE BAND → the stats strip (PERFECTS · BEST STREAK · YOUR BEST) → the tower still lit under it (your best above you = a dashed gold outline) → the PLAY AGAIN bar.
- A PINK FLASH WHEN A RUN ENDS (his iPhone, "at the final screen"): find it, kill it at its source, a test that fails on a pink large-area frame.
- THE GROW-BACK SOUND IS TOO HARSH ("more pleasant on the ears — a healing / soothing sound"): five candidates as takes 1–5 on the SOUNDS sheet, heard in context, his pick remembered on the phone; default take 1; the next pass keeps the pick and removes the other four.

## HIGH RISE — S4A FIX 2 (approved Nov 19)
- Ben's iPhone after S4A FIX: HITCH 114 (day, floor 99: gc 40 · TAP 46 · unknown 28) / HITCH 95 (night, floor 90: plate 1 · gc 27 · TAP 30 · unknown 37). He does NOT feel lag in play — but THE UFO visibly JUMPS on every slab landing (the landing frame runs long; the flyer skips). The biggest named cause is now "tap" = the landing frame.
- The beelink can't reproduce iOS stalls → measure ON THE PHONE: a ?trace=1 breakdown.
- UFO lamps hidden: approved. The pink flash: gone (Ben checked). Welcome A + end A: in.
- GROW-BACK = #1 "Heal Restore" by Qvantor (Freesound 878621, CC0) — FINAL (Ben's pick); takes 2–5 + their credits removed.
- Multiplayer stays S4B (the cartridge is solo-only until then).

## HIGH RISE — S4B (approved Nov 19–20)
- THE END SCREEN = JAYWALK'S STANDARD (replaces design A; mockup Downloads\NEON\highrise-end-jaywalk-style-v2.png): header "HIGH RISE · SOLO" (HIGH hot pink, RISE cyan, "· SOLO" lavender; "· MATCH" in a match) → the cause in saturated hot-pink neon (MADE IT TO THE MOTHERSHIP = gold) → the floor HUGE, white with a cyan glow, "FLOORS" under it → "YOUR BEST · N" gold + one line "N PERFECTS · BEST STREAK N" → YOUR TABLE slim cards right under the personal numbers → the shared universal footer (PLAY AGAIN · SHARE | CITY). No 3-column stats strip, no dashed tower line. Never all white: the colours are real neon.
- THE SHARE IMAGE moves from S4B to THE REVIEW.
- THE LAG (Ben's iPhone trace after FIX 2): our code ≈ 1 ms in every slow frame; ~1.5% of frames ≈ 40 ms, ALL "browser" (Safari paint ≈ 24 ms), spread over the run, never on landings; one 65 ms first-time set-up at floor 80 (seam+flyer+later). Plan: pre-warm everything before the first tap + a `?lean=1` A/B switch; rebuild the over-the-game effects only if lean clearly wins on Ben's phone.
- `?floor=N` shortcut floors never count as perfects / streak (test-page bug).
- The UFO glide through landings: confirmed smooth on Ben's iPhone.
- THE MATCH (decided): only THE OWNER starts it (a room he hosts), 2–8 players, a mid-match joiner WATCHES until the REMATCH; the same seed for everyone (THE FIRST GO, server time), each player's own `hr` proof node, the server replays every run; RIVALS = HEIGHT TAPES + THE ALTIMETER — the tapes never block the play (a rival above = a right-edge tag "ALEX ▲3", the 3 nearest, merged when they would overlap, dim while a slab slides); OUT = WATCH (the leader first, tap = the next, tap the altimeter = that player); the announcer calls passes + streaks; Call the Winner; floor 200 = the Mothership (most perfects breaks ties, then the earlier tick), the 6:00 cap = TIME'S UP; each phone its own day / night look; XP + the streak by JAYWALK's rules behind HIGHRISE_COUNTS (off).
- THE RULE-SET TABLE: every rule number in ONE table, today's only entry "classic"; a run records its rule set, the judge rejects an unknown one; nothing changes in play.
- THE RULES GAP shared with JAYWALK (a host on a modified client can delete his own live proof tree) is closed for `hr` + `jw`.

## HIGH RISE — S5: BEN'S NOTES (approved Nov 20)
- THE ROADMAP from here (Ben, Nov 20): S5 (Ben's notes) → THE REVIEW = REVIEW ONLY (a fresh read-only audit, changes NO code, a ranked findings report for Ben to pick from) → REVIEW FIX (Ben's picks) → GO-LIVE.
- THE ALTIMETER GOES (Ben: "a bunch of moving text… movement in the corner of your eye… only distracting"). THE PLACE NUMBER replaces it: ONE big still number in a corner ("3RD / 8"), readable at a glance; it changes only when your place changes (a short pulse up / down); never moving text. Rivals stay ON THE TOWER (the tapes + the right-edge tags — Ben LIKES the neon tape left where a rival fell). The full ranked list appears ONLY in WATCH (when you're out): big rows, tap a name = jump to that player.
- DROP TIMEOUT = 18 s (Ben — match JAYWALK; S4B had 12 s).
- THE LAG A/B on Ben's iPhone (day look both): normal 76 slow frames of 5,268 (1.44%), HITCH 75, Safari ≈ 24–28 ms per slow frame · LEAN 43 of 6,187 (0.70%), HITCH 42, Safari ≈ 16–18 ms. Pre-warm works ("SET-UP AFTER START: none"). → LEAN CLEARLY WINS: half of Safari's slow frames are our over-the-game effects. Rebuild them to stop repainting, same look.
- THE SHARE IMAGE = Ben's approved mockup (Downloads\NEON\highrise-share-image.png) — moved back from THE REVIEW into S5.
- THE BILLBOARD = B1 (Downloads\NEON\highrise-billboard-B-v2.png, the TOP one); ONE billboard only; "OPEN NOW" (not NOW OPEN). Built as art in S5; the CITY chat installs it at go-live.

## HIGH RISE — THE REVIEW (approved Nov 20 — REVIEW ONLY: no code changes; the report: docs/games/passes/highrise-review.md)
- THE LAG IS CLOSED (Ben's iPhone after S5: normal 0.96% slow frames vs lean 1.02% — our effects cost nothing now; the rest is Safari's own).
- THE SHARE CARD IS REDESIGNED (Ben, Nov 20 — he hated S5's live-frame card: a short pale day stack at floor 14 with the missed slab frozen like a bridge). NEW = "B · THE POSTER" (mockup Downloads\NEON\highrise-share-B.png):
  - 1080 × 1350, full-bleed, NO inner frame box, ALWAYS the night look.
  - Top: "HIGH" pink + "RISE" cyan neon, with "SOLO · NEONSPEAKEASY" (or MATCH) small under it.
  - The floor HUGE (white-hot, cyan glow) in the sky, with "FLOORS · BAND" under it.
  - A tall glowing neon tower rising from the bottom, its top under the number. NO flyers.
  - Bottom: the cause in big pink neon, then "N PERFECTS · NAME", then the kit's foot.
  - The picture = PRE-RENDERED hero shots from the real game (the billboard's poster-mode pipeline), one per band: rooftops · skyline · clouds · stars · deep space, plus a GOLD Mothership finish. Never the live frame.
- BEN'S DECIDED CHANGES for REVIEW FIX:
  - (1) THE TOP HUD is bunched up: "8TH / 8" runs into "THE ROOFTOPS"; the floor, band, clock and PERFECT ×5 read as one cluster. → The floor big + centred, with the band + clock centred narrow under it. THE PLACE NUMBER alone in the TOP-RIGHT corner ("8TH" big, "/ 8" small under it). The callouts under everything, with room.
  - (2) SPECTATE is out of sync. Ben, watching GUS: "it goes past, and then it snaps back on top and drops". → WATCH plays the watched player back on a short delay, from their landed taps' own ticks, so their slab slides and drops exactly where they tapped; no snapping.
  - (3) THE SHARE CARD → B · THE POSTER + the 6 hero shots.
  - (4) Claude's rec, Ben to confirm: THE PLACE NUMBER's ties use the final ranking's rule (floor → most perfects).
- Live JAYWALK solo WORKS on Ben's phone (Nov 20) → the failing e2e-jaywalk PLAY NOW check is a test problem, likely the 4 am day line → the JAYWALK chat's inbox, not HIGH RISE's.

## HIGH RISE — REVIEW FIX A: THE MATCH (approved Nov 20 — the report: docs/games/passes/highrise-review.md)
- BEN'S CALLS on the review (Nov 20, all of Claude's recs):
  1. PLACE TIES = floor → most perfects (the final ranking's rule), in THE PLACE NUMBER AND the WATCH list.
  2. A COUNTED MATCH RAISES YOUR BEST (like JAYWALK; the server already does). Runs that never counted never set it.
  3. THE PROOF PASS (the review's MUST 2 — the host-trust holes, JAYWALK + HIGH RISE together, ends in a re-publish) runs AFTER go-live, BEFORE strangers are invited. Not in REVIEW FIX A; `jw` + `hr` rules untouched for it here.
  4. A silent phone stays out after 18 s (JAYWALK's value).
  5. GO-LIVE (a later pass — recorded only, nothing built now): HIGH RISE counts toward the weekly "5 different games" goal · it gets its own BOARD tab like JAYWALK · THE DAILY CEILING stays 20 for every game · /highrise-lab is deleted at go-live (like JAYWALK's) · the two cards' lab marks removed.
- The `hr` rules ARE published (Ben re-published S4B's file — Downloads\NEON\database.rules.nov20-s4b.json — on Nov 20; it equals database.rules.json). The repo's record updated: database.rules.json → tests/fixtures/rules-live.json, the ack deleted (THE RULES-LAG; the review's MUST 1 closed).
- The share card redesign (B · THE POSTER) is REVIEW FIX B, not this pass.
- GO-LIVE ORDER (the review's MUST 4): the CITY pass (HIGH RISE's billboard + roof sign + blade, lit only by the go-live switch) lands BEFORE the go-live flip; JAYWALK's boot budget needs ~0.3 KB more room at the flip (trim comments, or a named raise).
- THIS PASS (REVIEW FIX A): G1 THE TOP HUD (the floor centred, band + clock narrow under it, THE PLACE NUMBER alone top-right, the callouts under all of it, every gap ≥ 16 px at 390 × 844) + WATCH's list off the slab's way in · G2 SPECTATE IN SYNC (the watched player played back on a short delay from their landed taps' own ticks — no slide past, no snap back) · G3 the match fixes (the place ties, a GO alone is not a player, a host hiccup at GO, GHOST names, YOUR BEST = counted runs, the match E2E's daytime red).

## HIGH RISE — REVIEW FIX B: THE SHARE CARD · THE DAY END SCREEN · THE WOULD COUNT LINE (approved Nov 20)
- THE SHARE CARD IS REDESIGNED (Ben, Nov 20 — he hated S5's live-frame card: a short pale day stack at floor 14, the missed slab frozen like a bridge; a live frame only looks good when the moment is good, and most runs end low). NEW = "B · THE POSTER" (Ben picked it from 3 prototypes; mockup Downloads\NEON\highrise-share-B.png; NO JETS / no flyers). Always the NIGHT look. The picture = pre-rendered hero shots from the real game, one per band (ROOFTOPS · SKYLINE · CLOUDS · STARS · DEEP SPACE) + a gold Mothership finish. Never the live frame.
- THE DAY END SCREEN (Ben: "that's perfect" — mockup Downloads\NEON\highrise-day-end-screen.png, the RIGHT side): a day run's end screen keeps its dark style (neon only glows on dark; every game's end screen is dark), but the day sky + the player's real tower show through a dark tint instead of a solid black backdrop. Night unchanged.
- THE WOULD COUNT LINE fits on the phone (it ran off the right edge at 390 × 844) and never says NEW BEST unless it is one (it showed NEW BEST at 113 with a best of 119).
- THIS PASS: G1 the six hero shots (the poster pipeline) · G2 the share card = B · THE POSTER · G3 the day end screen + the WOULD COUNT line · G4 with room: SHOULD 7 (the F-22's 1.1 MB before the first tap) + the flyer shot script.

## HIGH RISE — THE GO-LIVE (approved Nov 20 — + the day end screen fix + the share card's type)
- THE DAY END SCREEN (Ben on his iPhone after FIX B: grey murk, no blue sky, the tower a blurred grey blob — NOT the approved mockup `Downloads\NEON\highrise-day-end-screen.png`, the RIGHT side) → fixed in this pass, Group 1: a NAVY-BLUE tint (never grey / black — the sky stays blue), dark ONLY behind the text block at the top (4.5 : 1 kept there), the middle + lower area much lighter (the sky + the tower show), far less blur (a soft touch), the camera pulled back so the WHOLE top of the player's tower is in frame with its neon edges — never a giant close-up block. Day runs only; night unchanged; the layout, colours, glow + buttons unchanged.
- THE SHARE CARD'S TYPE (Ben, from the real card in Messages: "FLOORS · THE ROOFTOPS" in small wide-spaced cyan blurs + confuses; mockup `Downloads\NEON\highrise-share-floors-fix.png`, the RIGHT side — its tower is an old mockup) → "10 FLOORS" together (FLOORS bold cyan, tight, on the number's line), the BAND on its own line under it in PINK neon, bigger + bolder, tight. The gold Mothership card: the same layout in gold. Group 2. The hero shots stay as they are: A CLEAN BREAK, NO sparks (never regenerated).
- THE ORDER from here (Ben + the CITY chat, Nov 20): GO-LIVE (this pass — HIGH RISE playable + counting, HELD BACK from the city's signs: THE SIGN HOLD) → THE PROOF PASS (JAYWALK + HIGH RISE host-trust holes; before strangers are invited; ends in a re-publish) → THE CITY PASS (the CITY chat: the B1 billboard, the roof tube sign HIGH / RISE, the blades, the rotation HIGH RISE → JAYWALK → HOLD'EM with THE DROP removed — and it LIFTS THE SIGN HOLD).
- GO-LIVE decisions (Ben, Nov 20): TOP of the game list with the NEW tag · counts toward the weekly "5 different games" goal · its own BOARD tab · THE DAILY CEILING stays 20 for every game · /highrise-lab deleted · the two cards' lab marks removed.
- THIS PASS: Step 0 (this) · G1 THE DAY END SCREEN · G2 THE SHARE CARD'S TYPE · G3 THE GO-LIVE FLIP (HIGHRISE_COUNTS on, playable for everyone at the top with NEW, its icon THE TOWER, its BOARD tab, the weekly goal, the lab deleted, THE SIGN HOLD, the boot budget) · the close (a fresh-eyes review, the full local run, ONE ci-tagged push, the live site read-only).

## THE PROOF PASS — JAYWALK + HIGH RISE (approved Nov 20 — the host-trust holes · JAYWALK's GO fixes · CI green · the boot budget · a verified solo run is a counted play)
- HIGH RISE WENT LIVE (Nov 20, the GO-LIVE pass): counting on, top of the shelf with NEW, its BOARD tab, THE SIGN HOLD in force (the CITY pass lifts it). Ben's phone check: all good. The two cards (ABOVE THE CLOUDS, TOP OF THE WORLD) stay shipped as they are (Ben, Nov 20).
- THIS PASS (Ben, Nov 20): THE PROOF PASS for BOTH games together, before strangers are invited, + the CITY chat's request "a verified solo run is a counted play" (THE BOARD). Ends in ONE rules re-publish. Then THE CITY PASS (CITY chat).
- THE GROUPS: G1 THE HOST-TRUST HOLES (the review's MUST 2 a / b / c, `jw` + `hr`, one shared design: step 1 the phones re-send + the server's two guards, step 2 the `t0` stamp + the rules; the proof-write code shared by both games; ~25 rules tests — the review's SHOULD 9) · G2 JAYWALK'S GO FIXES (REVIEW FIX A's host-hiccup fix + "a GO alone is not a player" for JAYWALK; HIGH RISE's "own phone missed GO" case) · G3 CLEANUP (GitHub's `tests` job green again; JAYWALK's boot budget a named raise) · G4 A VERIFIED SOLO RUN IS A COUNTED PLAY (the inbox's Nov 20 2:17 pm entry, exactly as written; last, time-boxed).
- THE RULES RE-PUBLISH is Ben's, by hand: the file saved as Downloads\NEON\database.rules.nov20-proof.json; THE ORDER worked out + tested on the emulator (old rules + new code, new rules + old code, both games) so no live player ever breaks.

## THE CONSOLE FIX — "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST" (approved Nov 20 — JAYWALK + HIGH RISE + the other games' host audit)
- THE PROOF PASS shipped Nov 20 (c6534127). Ben re-published `Downloads\NEON\database.rules.nov20-proof.json` + ran THE BOARDS' BACK-FILL. His phone checks: JAYWALK + HIGH RISE solo both count ("TODAY'S SOLO XP DONE" — capped, counted); THE BOARD lists the solo-only friend; YOUR TABLE live.
- THIS PASS (Ben, Nov 20 — "let's do it now"): THE CONSOLE FIX for the hole the proof pass's review found — a modified host can END A MATCH FOR EVERYONE BUT HIMSELF (writes `game/phase: 'final'` or moves the room on → every honest phone leaves its live run → he plays on, reports, wins). Plus an audit of the other games' matches against a modified host.
- THE GROUPS: G1 THE RULE (a phone with a LIVE proven run plays it to its own end, writes its end, THEN follows the room; the server holds a report — 425 — while any on-time node is still live, the cap ends the wait; the podium waits the same way) · G2 the other games' host audit (fix only what is cheap + fits G1's rule; the rest ranked in the pass log + the inbox) · G3 a cap on how many match trees a host opens in his room (rules + a test).
- THE RULES RE-PUBLISH (only if needed) is Ben's, by hand: `Downloads\NEON\database.rules.nov20-console.json`, the order worked out so no live player ever breaks (the code first, the rules whenever after).

## JAYWALK J1 — SPLITS · THE MATCH MOMENTS · THE NIGHT GLOW FIX (+ the city's END-SCREEN HEADER fix) (approved Nov 21 — the owner, Nov 19–21, from friends' feedback)
- Built on THE PROOF WRITER (`js/games/kit/proof-writer.js` + `proof-io.js`) and THE CONSOLE FIX (`view.js#holdsRun` / `runLive`) — never around them.
- J1 · SPLIT TIMES every 50 lanes (50, 100, 150, 200 …) on every run's end card (solo, match, daily) — a box ONLY for a split actually reached; NEW BEST marks per split; the personal best splits kept by the SERVER from its own replay (never a phone's claim). Daily tries record their splits too (for J3's time boards — J3 builds the boards; lanes stay the daily's score).
- THE MATCH MOMENTS: a bigger order list (~22 pt rows; out = red X + crossed-out name); "MIA IS OUT · 87 LANES · 3 LEFT" banner (the player's colour, ~1.5 s, a soft sting, close outs merge "MIA + LIAM OUT"); a small SEMI-TRANSPARENT RED X where an out player's ghost fell (if on screen), their name small above it, fades ~1.5 s; HEAD TO HEAD + the SIREN only when a 3+ player match narrows TO two (never at the start): the big text, a red screen-EDGE pulse speeding up with the siren, one flash at its peak, then a small LIVE DUEL STRIP at the top for the rest of the duel ("BEN 142 · JUSTIN 138"); a 2-player match: no siren ever, the duel strip from the start; LAST ONE STANDING + the lead ("+23 LANES AHEAD · KEEP GOING") when everyone else is out. Every "out" keys off that player's OWN end of run (their node's `e` / the console fix's signal) — never the host's word. Nothing covers the lanes; Reduced motion = a steady glow, no pulse.
- THE NIGHT GLOW FIX: the bloom pass draws the solid scene as depth-only occluders first, so a light behind a truck / car / train / tree makes no glow on top of it.
- THE END-SCREEN HEADER (the city's ask, the owner's call Nov 21): a game WITH modes shows its MODE in place of SOLO / MATCH ("PRISM DROP · SCORE RUSH" / "· BATTLE" / "· SURVIVAL", "HOLD'EM · CASH" / "· TOURNAMENT"); games without modes (JAYWALK, HIGH RISE, OVERCLOCK — QUICK only; its "6 CHALLENGES" stays out) keep "· SOLO" / "· MATCH".
- THE GROUPS: G1 THE NIGHT GLOW FIX (`night-fx.js#createBloom`) · G2 SPLIT TIMES (the engine → the server's replay + best splits → the end card) · G3 THE MATCH MOMENTS (+ three original sounds, CC0 1.0 Ben) · G4 THE END-SCREEN HEADER (`ui/fin-neon.js`) · G5 TESTS; THE FRESH-EYES REVIEW before the final run; ONE tagged final push. JAYWALK's per-game budget is never raised. No rules change expected.

## JAYWALK J2 — EVEN STARTS · THE BLACKBIRD BECOMES A REAL THREAT · COURSE RULES v2 (approved Nov 21 — the owner, Nov 19–21)
- Built on THE PROOF WRITER (`js/games/kit/proof-writer.js` + `proof-io.js`), THE CONSOLE FIX and J1 — never around them.
- EVEN STARTS: no course opens on a free run to 50 (friends got "a wide open straight path") — v2 tightens the spread of the opening (the calm first lanes stay), the same overall difficulty curve.
- THE BLACKBIRD BECOMES A REAL THREAT (today a kid crosses its 2-lane path in ~0.27 s and the jet goes off every 7–10 s: a blind cross is hit ~5 % of the time and most players never see it): wider RUNWAYS (3–4 flight lanes, each its own staggered jet), a faster rhythm, a deadly glowing AFTERBURNER TRAIL lingering ~0.7 s after each pass, more often (from lane 120, more from 250, THE AIRFIELD full of them); every lane keeps ≥ 1.5 s of tell (MIN_TELL_TICKS) and every runway is proven passable.
- THE SOUND RULE: the radio crackle only when a runway is within ~3 lanes ahead, once per runway visit, ~8 s cooldown, rotating 3 takes; later tells = the runway lights + a soft runway tick; every jet pass keeps its full scream + boom but fades with distance (off-screen = silent); the burning trail plays a real fire flicker. The warning stays VISUAL (fair with sound off).
- COURSE RULES v2: a course is a pure function of (seed, course version). v2 switches on at the 4 am Eastern daily turn after this ships (2026-11-22 09:00 UTC; if this pass pushes after that moment, the next 4 am) — never mid-day. A run's version travels in its proof; a run without it (old-code phones, accepted until 2026-11-27 09:00 UTC) or started before the switch replays as v1. A day's daily uses the version in force at its 4 am.
- J1 leftovers (the owner took every recommendation): the lab's "zero server calls" line is CORRECTED (the shared audio engine may send one anonymous count on leave — don't block it); J1's calls stand (no NEW BEST on a first split, no OUT banner on your own phone, the siren for watchers too, LAST ONE STANDING on the survivor's phone only, the duel strip's leader triangle).
- THE GROUPS: G1 COURSE RULES v2 (the plumbing first — v1 byte-for-byte) · G2 EVEN STARTS (v2) · G3 THE BLACKBIRD v2 (runways, rhythm, the trail, frequency, the look) · G4 THE SOUNDS (the rule + three new files) · G5 THE HARD LIMITS (≤ 64 draw calls, 60 fps at 4× CPU, the 2,600 KB line never raised) · G6 TESTS; THE FRESH-EYES REVIEW before the final run; ONE tagged push.

## JAYWALK J2 FIX — THE BLACKBIRD YOU CAN SEE + A PREMIUM DAY RUNWAY (approved Nov 21 — the owner)
- (Nov 21) J2 FIX. THE BLACKBIRD must be SEEN, not just felt: slower across the screen (~0.6–0.7 s to cross the 390 view at the first runways, faster deeper in, the Airfield fastest) + a short white vapour trail behind it; the per-lane warning shortened 1.6 s → ~1.2 s so the threat stays about the same. These are v2 numbers, changed BEFORE v2 goes live (2026-11-22 09:00 UTC); after this pass v2 is FROZEN like v1.
- (Nov 21) DAY RUNWAY looked cheap (owner): the big glowing amber/red lamp balls + the solid flame cones. Day lamps = small crisp fixtures with a sharp bright pip, blinking in sequence during the warning, no big glow halo by day. Day trail = HEAT, not neon: a scorched dark streak, a thin white-hot centre line, see-through soft-edged blue-white flame tongues standing up (blue only stands up — never on the ground: blue on the ground = water), a faint heat shimmer, smoke wisps as it dies. The chevron arrows stay as they are.
- (Nov 21) NIGHT runway stays exactly as shipped by default (owner: "looks amazing"). The same new lamps + flames are built for night behind a LAB-ONLY switch (&rwnight=new) to compare; a later one-line add-on flips it if the owner prefers it.

## JAYWALK J3 — THE DAILY: TIME BOARDS · THREE TRIES ALL DAY · THE RED SNEAKER (approved Nov 21 — the owner)
- (Nov 21) J3 — JAYWALK DAILY TIME BOARDS: tabs MOST LANES (first, the default) then FASTEST TO 50 · TO 100 · TO 150 … — a tab for EVERY 50 that anyone reached that day ("as high as the guy goes"; no tab for a split nobody reached); the tab row scrolls sideways; TODAY only, for YOUR TABLE and EVERYONE (ALL TIME stays the lanes average); times = the SERVER's replay splits; each player's best per split from ANY of their 3 tries; equal times share a place; the time boards never affect daily points / ALL TIME / the lanes result. Solo stays personal-best splits only.
- (Nov 21) J3 — the share card adds ONE small best-time line under the big lanes number ("TO 100 · 1:14" — the player's highest split reached today, best time).
- (Nov 21) J3 — THREE TRIES ALL DAY (owner): the server already allows 3 tries any time until 4 am, best counts. The phone fixes: REMOVE the STOP button (a try ends only by a hit or THE MOTHERSHIP at 5:00); DONE → "COME BACK LATER" (goes back, NEVER marks the day done — no markTriesDone); the ticket keeps "TRY AGAIN · n TRIES LEFT" + the best so far all day; ADMITTED only after the 3rd try or at 4 am. Leaving / hiding the app mid-try still ends that try (no peeking at the course). One try played = that try is the day's result.
- (Nov 21) J3 — THE SNEAKER mark's upper back to RED (the owner's original pick; CITY H2 set it to the house pink '#ff4fc4'): core/marks.js jaywalk tube 1 → a neon red (~'#ff3344', tuned so it glows red, not orange or pink, at 24 / 40 / 64 px, night + day). Sole/laces white + cyan speed lines unchanged. One definition → PLAY sheet, signs, card art, share image follow. The daily ticket's own colour is the HIGH RISE chat's.
- THE GROUPS: G1 THREE TRIES ALL DAY (the phone: no STOP, COME BACK LATER, the ticket from the server's tries) · G2 THE TIME BOARDS (the server's day split board + the tabs on SCORES · TODAY + the share line) · G3 THE RED SNEAKER. No rules change expected; JAYWALK's room budget untouched (the daily run module stays outside the preload graph). SHARED-FILE GUARD: the HIGH RISE chat owns the ticket inks (`js/daily/ticket-art.js` INK rows) — J3 never touches them.
