# COAST CLEAR — a daily, server-judged Minesweeper-type (CC1 + CC2, Nov 7 2026 — ships OFF)

The owner's decisions: `docs/games/plan.md` (CC1, CC2). The contract it plugs into: `docs/cartridge.md` (THE DAILY PLUG-IN, D2). The pattern it follows:
THE PASSWORD (`docs/password.md`). THE DAILY MODULE (a later pass) opens it once a day, owns the banner, the pause + the RESUME chip, the rankings and
the streak hooks; until THE SWITCH-OVER `daily.on` is `false`, the server answers it only under `DAILY_TEST=1`, and the game is reachable only through
its preview + its E2E. **Slip a small boat across the night harbor past 18 hidden patrol SEARCHLIGHTS on a 9 × 12 board; buoys mark the lights you've
worked out.** Digging a light = SPOTTED (+30 s, play goes on); the 3rd spot ends the run (CAUGHT). Score = server time + 30 s a spot + 15 s a pause
(lower = better); a caught run ranks below every finished run.

| file | what |
| --- | --- |
| `js/games/coastclear/meta.js` | THE THIN META (pure, no imports): 9 × 12 · 18 lights · +30 s a spot · +15 s a pause · 3 spots ends it, SOLO, BANNER_NAME, `chatLocked` → false, `LOOKS: ['day', 'night']` (CC2), `CC_EPOCH` (the share line's day 1 = THE PASSWORD's `PW_EPOCH` — both move at THE SWITCH-OVER) |
| `js/games/coastclear/logic.js` | THE RULES, pure — the server imports it: neighbours + counts, `flood` (BFS from the tap), `applyMove` (dig / chord), `serverAct` (the server's one action on a record: dig · chord · pause · resume), `runView` (the phone's view: opened cells + spotted lights only — CC2: + `reveal` once the run is over), `scoreOf` + `bucketOf` (300 buckets), `replay` (the server's check), the phone's `foldAnswer` (answers in any order) + `clockMs` + `chordTargets`; CC2: `headline`, `finalMs`, `endLine`, `endMap` (the finished harbor), `msToTurn` + `fmtCountdown`, `dayNumber`, `shareLine`, `shareInputs` (no board) |
| `js/games/coastclear/daily.js` | THE DAILY PLUG-IN: `daily = { on: false, create, resumeKey, result, replay, problems }` — a day set carries NO board (`{ v: 1, day }`) |
| `js/games/coastclear/index.js` | THE CARTRIDGE (every REQUIRED piece; a DAILIES row — a room never starts it); CC2: `musicFor` — the station follows the look (DAY `mood:day`, NIGHT `mood:evening`) |
| `js/games/coastclear/judge.js` | THE JUDGE on the phone: start / dig / chord / pause / resume / finish through `/api/daily` (js/profile/api.js — no socket) |
| `js/games/coastclear/view.js` + `css/coastclear.css` | THE SCREEN (below); every colour a `--cc-*` token (BOTH LOOKS — `body[data-look="day"]` retokens); CC2: GETTING SPOTTED (the beams), THE END SCREENS; `window.__coastclear` = the test hook |
| `js/games/coastclear/sfx.js` + `audio/sfx/coastclear/` + `scripts/build-cc-sfx.py` | THE SOUNDS (CC2): 8 files, mono 96 kbps (78 KB), on the console's SFX bus + THE FIRST-TAP CATCH; the import from the dailies chat's Grok set (12–19) |
| `js/games/coastclear/share.js` | THE SHARE CARD (CC2): a 1080 × 1350 canvas with NO BOARD + the one line, through the share sheet; the fallbacks |
| `js/fx/cc-cards.js` + `cc-specs.js` · `assets/vault/cc/` · `scripts/build-cc-cards.mjs` · `art/cc-cards/src/` | GHOST RUN's motion + its data · the art (1280 × 720 webp) · the build · Grok's master (a copy) |
| `scripts/sim-coastclear.mjs` | THE GHOST RUN SIMULATION (CC2): a human-paced solver bot over thousands of real boards → the time |
| `api/_lib/cc.js` | THE SERVER's cartridge (`core/daily.js#registerDaily`, `judged: true`, `moves`, `load` = the day's board, `act`, `verify` from the record); CC2: `flags` (clear / ghost from the record → the award engine — the rule `GHOST_S` 50 + `runFlags` lives in the pure logic.js, re-exported here) |
| `api/_lib/cc-board.js` | THE DAY's BOARD: the seed from THE PEPPER (the `dailySeed('coastclear', day)` form; `…:<day>:<attempt>` for a retry), built once + stored at `dly/coastclear/{day}/b`, kept warm in memory |
| `api/_lib/cc-solve.js` | THE NO-GUESS MAKER + THE SOLVER (pure — the preview imports it through the dev server's `/__dev/api-lib/` door for its fixed test board) |
| `tests/coastclear.test.mjs` · `tests/cc-board.test.mjs` · `tests/coastclear-cc2.test.mjs` | the rules (11) · the maker + solver over 1,200 days (4) · CC2: the end lines, the reveal, the finished harbor, the share (no board), the countdown, THE REWARDS' flags + the daily step + the wiring (8) |
| `tests/integration/coastclear.test.mjs` | `/api/daily` for COAST CLEAR on the emulators (9 — CC2: the reveal, the rewards at the threshold) |
| `tests/integration/coastclear-preview.html` · `coastclear-daily.html` · `e2e-coastclear.mjs` | the look preview (a local fake server, a fixed test board) · the E2E's page (the real judge on the emulators) · the E2E (36) |

## The game (what the phone does)
The view holds ONE thing: **the run view** — `{ w, h, lights, open: [[cell, n]…], lit: [cell…], spots, done, out, startedAt, finishedAt, paused,
pausedAt, pausedMs, pauses }` — and every bit of it comes from the server: `judge.start()` hands back the opening + the run so far, every dig / chord
answers with the cells it opened (a 0's whole calm area in ONE answer) or the light it was spotted by, and `logic.js#foldAnswer` folds it in
(everything only grows, so answers landing out of order are fine). The **buoys** are the phone's alone (no server call, ever): kept in
`localStorage` per day + player so a refresh keeps them; on a CLEAR every cell still shut must be a light, so the phone buoys them all (deduced,
never told).

**THE INSTANT FEEL:** `pointerdown` on a cell presses it (`.is-press` — `scale(0.88)`, in the same event: 0.6 ms on a 150 ms line in the E2E);
`pointerup` (before the 380 ms long-press, without a 12 pt slide) fires the move AT ONCE — a dig is `pending` (`.is-wait`, a soft shimmer on opacity)
and never waits for an earlier answer (pipelined: six taps in flight at once on the 150 ms line). The number POPS in when its answer lands (the dark
still face fades in on `::before`, the digit springs up — both transform / opacity); a flood RIPPLES out ring by ring from the tapped cell (30 ms a
ring — the Chebyshev distance). A tap on a buoyed cell does nothing; a long-press in DIG mode = a buoy; in BUOY mode a tap = a buoy. A tap on an open
number whose buoys (+ its spotted lights) equal it = a CHORD (one call; otherwise a small nudge). A lost answer retries (250 ms → 1.5 s, a repeat is
free on the server); a quiet **RECONNECTING** line only once an answer is ~2 s late; an out-of-step refusal (a finished run, a chord the server
counts differently) re-syncs from `start`. The clock is SERVER time (the offset from the answer with the lowest round trip), the pauses stopped,
+ 30 s a spot + 15 s a pause — a spot flashes `+30` beside it.

**The screen (CC1, NIGHT):** the sign COAST CLEAR (a static text glow, clear of ☰ + the music) · the status row — the TIME in plain neon type, THREE
DRAWN SEARCHLIGHTS (a lamp + its beam; lit gold = spotted; unlit a little brighter since DFIX1 so the count reads at a glance), a DRAWN BUOY + the buoys left — no pills, no boxes · the 9 × 12 water (~38 pt cells at 390,
up to 46; 2 pt gaps): dark glass tiles over ONE shimmer layer sliding on transform, opened water darker + still, the numbers in bright neon (1 cyan · 2
green · 3 pink · 4 yellow · 5 orange · 6 violet · 7 red · 8 white — the digit itself carries the meaning), buoys = drawn orange floats with a lamp, a
spotted cell = a gold searchlight that stays lit (a one-time burst ring) · the DIG / BUOY switch in the thumb zone (two big halves, 12 pt corners — not
a capsule; the active half glows cyan / orange). Status + board sit together, centred between the sign and the switch. `judge.finish()` once (a retry
gets the stored score back); only a failed finish shows a quiet NOT RECORDED · NO SIGNAL.

**GETTING SPOTTED (CC2 — `view.js#spotted`, `SWEEP` = the beats):** the server names the light → a white searchlight BEAM sweeps in from off-screen (from
the far side, so it crosses the harbor) and LANDS on the cell in 0.7 s — WAAPI on its own layer (`.cc-fx`, never a tap taken), transform + opacity
only; three soft layers (a wide faint halo, the cone, a bright core) whose far end fades out past the cell. While it travels the cell shimmers like a
pending dig and the screen does NOT count it yet (`shownSpots` — the lamp + the clock wait); it lands: the gold burst stays, a pool of light, "+30 s"
floats up from the cell and fades, one of the three status lamps lights, the clock jumps 30 s; the spotted sound plays with the sweep. **Play never
stops** — taps during the sweep dig as usual. **CAUGHT** (the 3rd light): THREE beams converge on that cell (left, right, from below — staggered 90 ms),
one red pulse over the screen (`.cc-red`, opacity), the firmer caught sound, then the end (1.5 s). Reduced motion: no beams, the light at once. A
tear-down mid-sweep resumes with the light simply lit. **60 fps measured** (the E2E, the preview page, rAF timing): the sweep 59.8 · the catch 59.3 ·
the lighthouse 60 fps (p95 16.7 ms); at 4× CPU 56 / 56.6 / 54.2.

**THE END SCREENS (CC2 — `view.js#end`, on PW2's pattern):** the board + the switch leave (0.32 s) and one clean screen comes in under the sign. **WIN** =
**COAST CLEAR** big green neon with **the lighthouse beam** sweeping slowly behind it (a long soft cone pivoting behind the headline, 3.2 s once, then a
calm glow breathing — `.cc-lh`) — the small top sign steps aside (the name never shows twice) · ONE big time (`finalMs` — the score's seconds: the
clock, the pauses stopped, + 30 s a spot + 15 s a pause) · a small line (`endLine`: "0 SPOTTED" · "1 SPOTTED · +30 s" · "+ 1 PAUSE · +15 s") + the win
sound. **CAUGHT** = big red neon, NO big time — one small line ("3 SPOTTED · 1:58"), the sign stays, the harbor dimmed. **Both:** THE FINISHED HARBOR
shrunk (`endMap` — 9 × 12 at 15–24 pt: the numbers in their colours, gold where a light found you, buoys, every other light as a pale lamp — the
server REVEALS the lights once the run is over; on a clear the phone buoys every shut cell) animated in row by row after the headline · SHARE (the one
main tube, a modest radius) · "NEXT HARBOR IN 13:06:44" (to the next 4 am Eastern, ticking on the SERVER's clock — DFIX1; a run that crossed the turn reads
"TODAY'S HARBOR IS OPEN"). The leftover space at the FOOT (never top-heavy). A resume /
a re-mount onto a finished run lands on the end screen STILL (`is-still` — no motion replayed).

**THE TWO LOOKS (CC2):** every colour a `--cc-*` token; `body[data-look="day"]` RETOKENS it — THE SUNNY HARBOR, THE PASSWORD's "C1 clear morning sky"
(the pale-blue gradient, the sun glow top-left, a couple of soft clouds at the top): hidden water = frosted sea-blue glass (light blue, a soft white
rim, a gentle shine), opened water = bright translucent white, the numbers bold + saturated (each its own strong colour, an edge for outdoors), buoys
red-and-white striped (a second band — `.cc-bu-band2`), the spot a warm gold, the beams pale gold, the blue accent #2f86ff on the active half of the
switch + the sign's dot ("coast clear." lowercase, the phone's rounded sans). **The game draws no switch** — the console sets `body[data-look]` and the
screen re-themes LIVE: the gradient tokens are REGISTERED (`@property` — a registered colour transitions where a gradient can't) so the cells crossfade
~0.3 s, the two backgrounds are painted layers (`::before` night, `::after` day) crossfading on opacity; nothing resets (the E2E flips mid-dig,
mid-flood, mid-sweep + on the end screen: the dig lands, the flood opens, the beam lands, the clock carries on). **The music follows the look**
(`index.js#musicFor` like THE PASSWORD — the console's crossfade).

**THE SOUNDS (CC2 — `sfx.js`; DFIX1: the engine moved to `js/daily/sfx.js`, shared with THE PASSWORD — this file is the table):** dig (a single cell, when its answer lands) · open-area (a calm area) · buoy place / remove · the DIG / BUOY switch · spotted
(with the sweep) · caught (with the converging beams) · the win (with the lighthouse). The MAIN file each of the Grok set's 12–19 (no -b); trims at import
(`scripts/build-cc-sfx.py`): 16 mode-toggle +4 dB; 18 caught −5 dB + a 120 Hz low cut (measured −26.3 LUFS vs the win's −20 — never louder than winning).
Mono 96 kbps, 78 KB; credits.txt beside them + ☰ → CREDITS. On the console's SFX bus (the slider + THE ONE MUTE); silent when locked / muted / missing.
**THE FIRST-TAP CATCH (iPhone):** iOS sends a tap's pointerup BEFORE the touchend that unlocks the audio, and `resume()` is async after that — a sound asked
for before the audio runs is held ≤ 400 ms and played the moment the context runs (one held at a time; with no tap at all it expires — never a sound
without a gesture); every buffer is decoded at the unlock. The preview + the E2E's page install the console's unlock (`installAudio`) like the real game;
the E2E proves every sound STARTS on the context + the catch.

**THE SHARE CARD (CC2 — `share.js`):** SHARE renders a 1080 × 1350 canvas in the look on screen with **NO BOARD** (everyone gets the same harbor — a picture
would give the searchlights away): the sign, the headline (a soft lighthouse cone behind COAST CLEAR), the big time or the caught line, THREE drawn
searchlights lit per spot, COAST CLEAR #n, neonspeakeasy.com — drawn ONLY from `logic.js#shareInputs` (`SHARE_KEYS`: head · caught · time · line · spots ·
dayNo · site); a test proves the same result on a DIFFERENT harbor gives identical inputs. Through the share sheet with ONE plain line: `COAST CLEAR #<n> ·
2:41 · 0 spotted · neonspeakeasy.com` (caught: `… · caught · 3 spotted · 1:58 · …`; #n from THE PASSWORD's epoch). No file sharing → the line shared (or
copied) + the image saved.

**THE REWARDS (CC2 — server-awarded):** `api/_lib/cc.js#flags` reads the SERVER's record (`replay` — never the phone's claim) → `{ clear: 1, ghost?: 1 }`
→ `core/progress.js#dailyStep` keys them `pa.gf['coastclear-clear']` / `['coastclear-ghost']` → the award engine grants **LIGHTHOUSE** (`emb-lighthouse`,
uncommon — any clear) / **GHOST RUN** (`card-ghost-run`, rare — a clear with ZERO spots at or under `GHOST_S` = 50 s on the score's clock) once, inside the
one transaction; "X% of players have this" through `bumpOwners`. Nothing in production while the daily is off (no cartridge → 404 `no_daily`). **THE
SIMULATION** (`node scripts/sim-coastclear.mjs [runs] [seed]`): a HUMAN-PACED solver bot — the solver's own deductions round by round (its trace now says
which rule found each round), a person's think time per rule (a lone number ≈ 1.4 s, a pair ≈ 4.2 s, the light count ≈ 7.5 s, log-normal), ≈ 0.6 s a tap,
chords, ~60 % of found lights buoyed, hesitation (12 % of rounds +2–8 s, 3 % a long stare), a per-run pace ± 25 % — never a perfect instant player. **8,000
real no-guess boards: median 1:20, p10 0:52 → GHOST_S = 50 s = 8.6 % of clean runs** (55 s would be 12.7 %). The art: docs/vault.md "COAST CLEAR's REWARDS".

**Resume / suspend:** an unmount (the room starting a game, an app switch) drops nothing the server doesn't have (only the in-flight answers — the
re-mount's `start` brings them back); the re-mount resumes from the server's record. A run PAUSED by THE DAILY MODULE resumes itself when the screen
comes back (`judge.resume()` on mount); any move resumes it too.

## The board maker (`api/_lib/cc-board.js` + `cc-solve.js`)
**DM1 ADD-ON:** the board comes from THE DAILY SECRET (`api/_lib/daily-secret.js` — `cc.js#ccBoard`), never the pepper; THE RESEED gives every day from the next 4 am a fresh harbor. THE ROOM WINS (DM1): a `pause` only while the player's room really started a game (`judge.pause(room)`; docs/progression.md).
ONE ATTEMPT: a start cell in the middle band (x 2…6, y 4…7) with its 3 × 3 kept clear (so it is a 0), the 18 lights scattered over the rest by a
seeded shuffle, the opening = the start's flood — kept only at **10–20 cells**. Then **THE SOLVER** plays it from that opening with pure logic:
(1) single cells — a number whose lights are all known → the rest safe; a number needing every unknown neighbour → all lights; (2) PAIRS — two
constraints sharing cells: the bounds on the shared part decide each side's own cells (this covers the subset rule, 1-2-1, 1-1…); (3) THE LIGHT COUNT
— the lights left vs the cells left, and the count paired with each number (the rest of the board as one more constraint). A round that finds nothing
= a guess would be needed → the board is thrown away and the next attempt's seed tried (`daily:coastclear:<day>:<a>`; attempt 0 is exactly
`dailySeed('coastclear', day)`). The solver opens only a cell it has PROVEN safe and throws if it ever calls a cell wrong (a self-check).
**The numbers (1,200 days in `tests/cc-board.test.mjs`):** 15.5 attempts a board on average (max 131 — almost all of them a rejected opening size; ~1
in 2 good openings needs a guess), **under 1 ms a board** (0.87 ms). Built once a day (the first `start` / move of the day — a transaction keeps one
copy) and stored as `{ v, w, h, l: 'cell,…', s: start, a: attempts }` (~95 bytes); a warm function keeps the last 3 days in memory.

## The server flow (`POST /api/daily` — api/daily.js + api/_lib/cc.js)
- **THE BOARD STAYS ON THE SERVER.** `start { game: 'coastclear' }` → `{ day, startedAt, done?, run, now }` — the run from the stored record (the
  opening even before the first move) and **NO seed**. A refresh = the same try, the same run.
- **THE REVEAL (CC2):** the answer that ENDS a run (and any start after it) carries `reveal` — every light's cell — for the end screen's harbor; no
  answer before the end ever does (the E2E's NO LEAK + /api tests check it). One try a day, so the board goes only to a player whose run is over
  (like THE PASSWORD's word once its door closes).
- **The moves** (CC1 added a generic path for a judged cartridge's `moves` — `dig` · `chord` · `pause` · `resume`, no new function): the day's board +
  the start read in parallel, then ONE transaction on the record (`dly/coastclear/{day}/p/{pid} = { st, mv: ['d45', 'c30:21,22' …], p?: { n, ms, at? },
  e?, o? }` — the moves, never a cell's content). A repeat (a dig on an open cell — its own number back; a spotted light; a chord with nothing left) =
  `already: true` and **nothing written** (one exception: a REFUSED move by a player with no record yet writes `{ st }` — the transaction's first-null write;
  harmless, FABLE REVIEW #1, 12). A transaction's first call may see null (nothing cached in the function): it never aborts on that — it writes
  the move's record so the server checks it against the stored one and retries with the real value. Every answer carries the server's `now`.
  - `dig { cell }` → `{ cells: [[cell, n]…], lit: [cell…], spots, done, out?, finishedAt?, resumed? }` · a bad cell 422 `bad_cell` · after the end 409 `finished`
  - `chord { cell, buoys }` → the same shape: the phone's buoys (only those around the number count) + the spotted lights must equal it (else 422
    `chord_count`, no cost); every other unopened neighbour is dug — the light a WRONG buoy left unmarked = SPOTTED
  - `pause` / `resume` → `{ paused, pauses, pausedMs }` — the clock stopped from `at` to the resume, +15 s a pause; a second pause = free; a move resumes.
    **THE PAUSE CAPS (DFIX1, the owner):** at most 3 accepted pauses a run AND at most 20 minutes stopped in all (`logic.js#MAX_PAUSES` / `PAUSE_CAP_MS`);
    past either a pause → 409 `pause_limit` with the clock running (nothing written); an open pause stops counting at the 20-minute total — the next call
    closes it AT THE CAP (a pause call writes that close + is refused; a dig / resume closes it as usual), the time past the cap ran on the clock; the
    phone's clock (`clockMs`) caps the same; the replay refuses a record past either cap. (THE DAILY MODULE will also check the room really started a game.)
  - **THE RUN'S DAY (DFIX1 — MUST FIX 1):** every move / finish carries the `day` its start returned (`js/daily/run-day.js` in the judge); the server takes
    today's or yesterday's with a start there (409 `not_started` otherwise; made up / two back / tomorrow → 400 `bad_day`) and loads THAT day's board, so a
    run (or a pause) that straddles 4 am Eastern finishes on its own harbor + its own streak day. A refresh across the turn resumes it (`start { day }`);
    once scored, the next start opens today's. A move COAST CLEAR doesn't own (`guess`) → 400 `bad_action` (was a 500).
- `finish` → scores from THE SERVER's record (`logic.js#replay` — the phone's `result` is ignored; unfinished → 409 `not_done`), then the existing
  streak / standing code (`better: 'low'`, 300 buckets: 0…239 = 5-second steps to 20 min · 240 = longer · 241…299 = caught, by the safe cells left).
  CC2: `flags` from the same record → LIGHTHOUSE · GHOST RUN (above).
- Registered by `api/_lib/dailies.js#loadDailies` **only under `DAILY_TEST=1`**: production answers 404 `no_daily`. No rules change (`dly/` is the
  rules' default deny — server-only).

## THE ONE-TIME HINT (DFIX3, Nov 8 — the owner: the practice harbor glitched on his first play → CUT; `js/games/coastclear/index.js#HINT`)
A player's FIRST COAST CLEAR shows ONE calm line right under the board — **EACH NUMBER = SEARCHLIGHTS TOUCHING THAT SQUARE** (`.cc-hint`, one line at
390 — `clamp(10px, 2.7vw, 12px)`, both looks through the game's tokens). It stays until the first dig that reveals a NUMBER, then fades (opacity only;
reduced motion = at once) and the run host marks it seen on the server (`/api/daily lesson` → `pstats/{pid}/ls/coastclear` — the same flag the lesson
used): never again on any device; never on a resume, a held run or a run already started. The plumbing is PLUG-AND-PLAY like the lesson was: a daily's
row keeps `lesson: true`, its cartridge exports a `HINT` string, THE DAILY SCREEN's run host (`js/screens/daily.js#openRun`) hands it in as
`state.hint` + `state.onHint` and the view draws it (`view.js` — the hook's `state().hint`). THE PRACTICE HARBOR (lesson.js, its CSS, its preview view,
its E2E steps) is gone. Preview: `coastclear-preview.html?hint=1&look=day` (body `data-hint-seen` once it went). Proof: `e2e-daily.mjs` (the hint
once: shown under the board, gone on the first number, seen on the profile, none on the resume; a new player gets it).

## The preview (no Firebase — `tests/integration/coastclear-preview.html`)
The real view against a LOCAL FAKE SERVER (`logic.js#serverAct` on a local record) on a FIXED no-guess test board (the real maker on a fixed seed —
never the real day; the first seed with a big second calm area). CC2: `&look=day|night` + a tiny DAY / NIGHT toggle at the foot (`&toggle=0`), `&end=clear|caught`
(played to ONE move before the end, then that move made once ready → the REAL end: the lighthouse / the three beams; `&still=1` = the end already
reached), `&sweep=1` (a light dug mid-run → THE SWEEP; `&sweep=3` = the catch), `&share=1` (the share image over the screen), the console's audio
unlock (tap once: the sounds play). `&state=opening | mid | spotted1 | spotted2 | caught | clear` (played forward by the
SOLVER's own deductions — no cell made up; the buoys on the lights it found) · `&flood=1` (the biggest calm area dug once ready — film it: `shots.mjs
--cast 1100 --strip 8 --js "__coastclear.tap(__preview.play.bigZero().cell)"`) · `&lat=40` (the fake's answer time; 190 = a slow line) · `&drop=1` (answers
lost for 3 s → RECONNECTING) · `&mode=buoy` · `&paused=1` · `&t=95` · `&seed=` · `&corner=0`. Shots: `Downloads/NEON/coastclear/shots/` — CC2: `cc2-g1` (the sweep, the catch, the win filmed), `cc2-g3` (the day look), `cc2-share`, `cc2-card` (GHOST
RUN + LIGHTHOUSE), `cc2-final` (390 / 402 / 430 both looks: opening, mid, the sweep strip, win, caught; desktop), `cc2-e2e`; CC1: `cc1-g4a` (every
state at 390 / 402 / 430, desktop, the flood strip), `cc1-e2e` (the E2E's).

## The numbers (CC1, measured on the Beelink)
- **The flood at 60 fps:** a 16–20-cell ripple at 390 × 844: 60.7 fps (p95 16.7 ms, 0 long frames); with the CPU slowed 4×: 57.8 fps (1 frame > 25 ms).
- **The dig round trip** (the phone → serve.mjs → the emulators): p50 13 ms · p95 15 ms (45 answers). **On a 150 ms line** (CDP latency): p50 170 ms ·
  p95 178 ms — the tap's press still in the same event (0.6 ms), six taps in flight at once, all six answered in 182 ms. On the live site expect the
  phone ↔ Vercel leg plus ~3 database round trips per move (the start read in parallel with the board, then the transaction's null guess + the real
  one): roughly 100–250 ms — the press never waits for it.
- **A run's cost:** ~50 `/api/daily` calls (the E2E's clean run: 50 — 42 digs + chords, the start ×4 with the refreshes, a pause, a finish; the solver
  needs ~40 digs on average). The record ends at ~330 bytes; each move reads the record once (+ the start key, ~20 bytes) and writes it once; the board
  is read once per cold function a day.
- **At 100 players a day** (30 days): ~150,000 function calls a month (Vercel Hobby: 1,000,000 invocations — ~15 %; Active CPU at ~10–20 ms a call ≈ 25–50
  min of Hobby's 4 h); the database download ≈ 50 calls × ~0.6 KB + the finish's streak transaction ≈ 40–50 KB a run → ~150 MB a month (Firebase Spark:
  10 GB — ~1.5 %); storage ≈ 0.4 KB a player a day → ~1.2 MB a month (Spark: 1 GB; `dly/` is never pruned yet — THE DAILY MODULE's job). The
  connections are the functions' own (a warm instance holds one; Spark: 100). (The plan limits as of this writing — check the dashboards.)

## The dig path + its timings (DFIX3, Nov 8 — the owner's first live play: "the DIG LAGS")
**Measured before the pass (the live site, from the Beelink in Michigan, plain GETs only — no play on the live site):** the functions ran in **iad1**
(Washington DC — `X-Vercel-Id: cle1::iad1::…`; the edge is cle1 = Cleveland), the database in us-central1 (Iowa). A warm `/api/time` on a kept-alive
connection: 80–90 ms to the first byte; a `POST /api/daily` that only verified a token (a 401): 180–230 ms. A dig then waited on the database SIX times
in a row — the budget's `rl/` transaction (2 round trips), `uids/{uid}` (1), the start key (1), the record's transaction with its "first null" attempt
(2) — ≈ 6 × 25–30 ms from iad1, under the phone ↔ edge ↔ function legs: the ~300–400 ms Ben felt.
**After (api/daily.js — every correctness guarantee kept: one try, server-judged, a repeat / a reorder free, the replay score, the throwaway gate, THE
ROOM WINS):**
1. **The region** — `vercel.json` `"regions": ["cle1"]` (Cleveland: the closest Vercel region to both Ben and Iowa; Hobby allows ONE region — Vercel's
   changelog "Hobby customers can now select their preferred region"; Vercel has no us-central region). The edge → function hop disappears, each
   database round trip drops ~10 ms. **Check the first deploy's build log: if Vercel refuses the key on Hobby, remove it and set the region in
   Project → Settings → Functions instead.**
2. **Two waits, not six** — THE BUDGET is a per-instance window counter decided at once (the shared `rl/dc_{uid}` count written BEHIND it, never
   waited for; a refusal from it lifts the local count so a flood across instances still stops within a round trip); uid → pid memoised a minute;
   the record is HELD in the SDK's cache by a listener for the call (`recRef.on('value')` … `off()` in `finally`), so the transaction's first attempt
   runs on the real value — ONE round trip, not the "first null" two (`tests/integration/coastclear.test.mjs` proves `tx;desc="1"` on every move);
   the reads (the record · the start · the board memo) go out in parallel. A dig = [reads] → [one transaction attempt].
3. **COALESCED MOVES** — the FIRST tap's call fires at once; taps made while an answer is in flight QUEUE on the phone and go out TOGETHER in the next
   call (`moves { list: [{ a, cell, buoys? }…] }`, ≤ `MAX_BATCH` 12, one transaction, one answer each — a refused move is its own `{ refused }`
   slot; `judge.moves` in judge.js; the view's `enqueue` / `pump` / `fire`). Six fast taps on a 150 ms line = 2 calls (was 6) — also the
   BEFORE-PUBLIC invocation fix. A judge without `moves` (the preview's old fake) pipelines singles.
4. **Warm start** — `stats.js` + `founder.js` (the boards, friends, push modules) load lazily on the first `finish`; a dig's own modules ≈ 35 ms cold,
   firebase-admin itself ≈ 230 ms (unavoidable: the token check) — no keep-warm.
**Server-Timing on every answer** (`timing()` — `auth · pre · load · tx;desc=<attempts> · total · region`, no secrets) + a dev log on the phone:
`&debug=1` prints every tap → number time with the server's phases (`__coastclear.taps()`; the E2E reads them).
**Measured after (the emulators, the Beelink):** the dig round trip p50 14 ms · p95 20–34 ms; the server's phases p50 auth 1–3 · pre 0–1 · load 1–2 ·
tx 1–2 · total 3–7 ms — tx attempts 1. **From Michigan on a warm function the model is now** phone ↔ cle1 edge (~35–45 ms) + the token check +
2 × ~20 ms to Iowa ≈ 90–120 ms to the number (the goal: < ~150 ms) — Ben judges it on tomorrow's harbor.

## Tests + proof
- Pure: `node --test tests/coastclear.test.mjs tests/cc-board.test.mjs tests/cartridge.test.mjs`.
- `/api` on the emulators: `cd tests/integration && node --test coastclear.test.mjs` (DAILY_TEST=1 inside; run it ALONE — it and password.test.mjs wipe
  the same nodes) — start (the opening, no seed, the board stored once), digs (one cell, a whole flood, a repeat writes nothing), the chord right /
  wrong / short, three spots → caught + nothing after, a clean clear with a pause (the clock stopped, +15), one finish, every answer honest, production
  refuses it. DFIX1: THE 4 AM TURN (start 3:58, a pause at 3:59 → resume at 4:00:20, digs after 4:00 on the OLD board, the finish on the start's day + its
  streak day + LIGHTHOUSE; a refresh across the turn resumes the paused run), THE PAUSE CAPS (the 4th pause refused with the clock running; an open pause
  past 20 minutes closed at the cap; a dig 45 minutes into a pause counts 25 of them), the clean 400s (a stray guess, a bad day).
- The E2E (the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu` — restart the server after changing logic.js: it keeps the modules it
  loaded): `E2E_BASE=http://localhost:<port> node e2e-coastclear.mjs "<browser>" ./shots-coastclear` (≈ 35 s, 36 checks — CC2: the sweep, look flips
  mid-dig / mid-flood / mid-sweep / on the end, the win screen + the harbor + the share inputs / image, resume onto the end, CAUGHT, the sounds start
  + the first-tap catch, 60 fps on the preview).

## Real vs placeholder (CC2)
REAL: everything of CC1 + GETTING SPOTTED (the sweep, the catch), THE END SCREENS (the lighthouse, CAUGHT, the finished harbor, the countdown), BOTH LOOKS
+ the live switch, the sounds (+ the first-tap catch), the share card (no board), THE REWARDS (server-awarded; GHOST RUN's approved art + LIGHTHOUSE's
neon in THE LAB waiting for the owner's marks — only approved art ships). NOT CHECKED HERE: a real iPhone's audio (no WebKit on this machine — the
catch is proven in Chromium with the iOS order simulated); the share sheet itself (headless has none — the image + the line are proven). NOT BUILT
(THE DAILY MODULE): the way in, the banner, the pause call + the RESUME chip, the rankings, the streak hooks, the switch-over.

## Real vs placeholder (CC1)
REAL: the rules, the no-guess maker + solver, the server keeping the board + answering every move, the record + the replay + the score, the pause /
resume, the screen + the night look, the instant feel (press, pipelining, the ripple, retries), resume after a refresh / a tear-down, the preview, the
E2E. PLACEHOLDER: the end (time + spots only). NOT BUILT (CC2): the lighthouse win + the caught screen + the share, the DAY harbor + the live swap
(`LOOKS` is night-only now), the sounds, LIGHTHOUSE + GHOST RUN. NOT BUILT (THE DAILY MODULE): the way in, the banner, the pause call + the RESUME chip,
the rankings, the streak hooks, the switch-over.

## FR7 FIXES A (Nov 12 2026 — docs/harbor/passes/fr7-fixes-a.md)
- **THE ROOM'S PAUSE DOESN'T COUNT** (the owner's decision 4): a pause the server verified as THE ROOM WINS is a ROOM pause (`p.r` in the record) —
  outside the player caps (`MAX_PAUSES` 3, `PAUSE_CAP_MS` 20 min), under its own bound (`ROOM_MAX_PAUSES` 12, `ROOM_PAUSE_CAP_MS` 3 h); the phone's
  clock reads the record's cap (`runView#pauseCap`). `api/daily.js` passes its own room check to the cartridge's `act` — never the phone's claim.
- **DY5**: the room's pause is retried (1, 2, 4 … 30 s) while that room starts / plays (`js/daily/retry.js#retryWhile`), never sent once.
- **DY6**: a REPEAT dig (its first answer lost) answers the cell's WHOLE flood; a light dug again answers `lit: [i]`.

## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### The doc table row

| `docs/coastclear.md` | **COAST CLEAR** (CC1 — a DAILY-ONLY, SERVER-JUDGED Minesweeper-type, ships OFF: the no-guess maker + solver `api/_lib/cc-board.js` + `cc-solve.js`; the board only on the server, `/api/daily` dig / chord / pause / resume; the instant feel) |

### COAST CLEAR (CC1 + CC2)

- **COAST CLEAR (CC1 + CC2 — docs/coastclear.md):** CC2: BOTH LOOKS (the sunny harbor — its gradient tokens registered with `@property` so the look crossfades live), GETTING SPOTTED (WAAPI beams on `.cc-fx`, the screen counts a spot when its beam LANDS — `shownSpots`), THE END SCREENS (the lighthouse / CAUGHT, the finished harbor — the server's `reveal` only once a run is over), the share card draws ONLY `logic.js#shareInputs` (NO BOARD — a test proves it), THE FIRST-TAP CATCH in `sfx.js` (iOS: a sound held ≤ 400 ms until the tap's unlock runs), LIGHTHOUSE + GHOST RUN from the server's record (`cc.js#flags`, `GHOST_S` 50 by `scripts/sim-coastclear.mjs`). CC1: the second DAILY-ONLY cartridge (`config.js#DAILIES`); THE SERVER KEEPS THE BOARD (`dly/coastclear/{day}/b`, built
  once a day from the pepper, NO-GUESS — `api/_lib/cc-solve.js` proves every board; never served) and answers every move — a judged cartridge's `moves` go
  through `api/daily.js`'s generic path (ONE transaction each, never aborting on a transaction's first null; a repeat writes nothing); a phone gets only
  the cells it opened; buoys are the phone's alone; the clock = server time (+30 s a spot, +15 s a pause — THE DAILY MODULE calls pause); NO PILLS,
  drawn searchlights + buoy, every colour a `--cc-*` token; `LOOKS: ['day', 'night']` since CC2.
