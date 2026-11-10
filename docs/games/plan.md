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
