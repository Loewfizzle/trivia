# THE PASSWORD — a daily, server-judged Wordle-type (PW1 + PW2, Nov 7 2026 — ships OFF)

The owner's decisions: `docs/games/plan.md` (PW1, PW2 + the end screen's ADD-ON). The contract it plugs into: `docs/cartridge.md` (THE DAILY PLUG-IN, D2).
THE DAILY MODULE (a later pass) opens it once a day, owns the banner, the pause, the RESUME chip, the rankings and the streak hooks; until THE
SWITCH-OVER (the repo private first) `daily.on` is `false`, the server answers it only under `DAILY_TEST=1`, and the game is reachable only through
its preview + its E2E. **Two doors in a row — THE FRONT DOOR, then THE BACK ROOM — each a 5-letter word, 6 guesses each; missing the front door ends
the run.** Score = (2 − doors) × 100 + guesses used (a clean crack 2…12, lower is better), the time breaks a tie.

| file | what |
| --- | --- |
| `js/games/password/meta.js` | THE THIN META (pure, no imports): the constants (5 letters · 2 doors · 6 guesses · the door names), SOLO, MIN_PLAYERS 1, BANNER_NAME, `chatLocked` → false, `PW_EPOCH` (the share line's day 1 — set it at THE SWITCH-OVER) |
| `js/games/password/logic.js` | THE RULES, pure — the server imports it: `judge` (Wordle's duplicate-letter rule), the run, `serverGuess` / `applyGuess`, `runView`, `scoreOf` / `resultOf`, `replay` (the server's check), `keyStates`; PW2: `headline` (WELCOME IN · LOCKED OUT), `doorState` / `doorLine` (the drawn doors), `guessesLine` / `failLine`, `fmtTime` / `fmtClock`, `msToTurn` (to 4 am Eastern), `dayNumber` + `shareLine` |
| `js/games/password/daily.js` | THE DAILY PLUG-IN: `daily = { on: false, create, resumeKey, result, replay, problems }` — a day set carries NO words (`{ v: 1, day }`) |
| `js/games/password/index.js` | THE CARTRIDGE (the contract's every REQUIRED piece; a room match never starts — `playable: false`); PW2: `musicFor` — the station follows the look (DAY = `mood:day`, NIGHT = `mood:evening`) |
| `js/games/password/judge.js` | THE JUDGE on the phone: start / guess / finish through `/api/daily` (js/profile/api.js — no socket), `canType` = the pre-check against the public data/words/valid-5.json |
| `js/games/password/view.js` + `css/password.css` | THE SCREEN (below): the sign, THE DRAWN DOORS, the grid, the kit keyboard, the flips / shake, THE DOOR REVEAL, THE END SCREEN; both looks as tokens; `window.__password` = the test hook |
| `js/games/password/doors.js` | THE DRAWN DOORS (PW2): two 34 × 44 inline-SVG neon doors, the leaf its own HTML layer (it swings in 3D), four states |
| `js/games/password/sfx.js` + `audio/sfx/password/` + `scripts/build-pw-sfx.py` | THE SOUNDS (PW2): 11 files, mono 96 kbps (83 KB), on the console's SFX bus; the import from the dailies chat's Grok set |
| `js/games/password/share.js` | THE SHARE CARD (PW2): a 1080 × 1350 canvas in the look on screen + the one line, through the share sheet; the fallbacks |
| `js/fx/pw-cards.js` + `pw-specs.js` · `assets/vault/pw/` · `scripts/build-pw-cards.mjs` · `art/pw-cards/src/` | THE CARD's motion + its data · the art (1280 × 720 webp) · the build · Grok's master (a copy) |
| `api/_lib/pw.js` | THE SERVER's cartridge (`core/daily.js#registerDaily`, `judged: true`): the list, the spelling check, `judge` (one guess inside a transaction), `resume`, `verify` from the record; PW2: `flags` (crack / safe from the record → the award engine), `SAFE_GUESSES` 6 |
| `api/_lib/pw-day.js` | THE SECRET SCHEDULE: the day's two words from the pepper (an HMAC-keyed shuffle per cycle; two a day; no repeat until the list is used up) |
| `api/_data/pw/answers.json` + `valid-5.json` | THE ANSWER LIST (server-only — never served; ships with api/daily.js through vercel.json `includeFiles`) + the server's copy of the spelling list |
| `scripts/pw-words/` · `scripts/sim-password.mjs` | the list build (`build.mjs`), the blocklists, THE REVIEWER's cuts · THE SAFECRACKER SIMULATION (PW2) |
| `js/games/kit/keyboard.js` + `css/kit.css` "THE KEYS' MARKS" | the kit hook: `setKeyStates`, the drawn delete icon (PW2: centred in its key — OVERCLOCK too), `go` = the label |
| `tests/password.test.mjs` · `tests/pw-day.test.mjs` · `tests/password-list.test.mjs` · `tests/kit-oc1.test.mjs` · `tests/achievements.test.mjs` | the rules · the schedule · the list · the kit hook · the rewards through the daily step |
| `tests/integration/password.test.mjs` | `/api/daily` for THE PASSWORD on the emulators (+ PW2: the rewards on finish, the threshold, never twice) |
| `tests/integration/password-preview.html` · `password-daily.html` · `e2e-password.mjs` | the look preview (a local fake judge, fixed test words) · the E2E's page (the real judge on the emulators) · the E2E |

## The game (what the phone does)
The view holds ONE thing: **the run** — `{ door, doors: [{ guesses, marks, state: open | solved | failed, word }], done, startedAt, finishedAt }`
— and every bit of it comes from the server: `judge.start()` hands back the run so far (the words guessed, their marks, a CLOSED door's word), each
`judge.guess(word)` answers with that guess's marks (+ the door's word only when that guess closed it, + `next` when THE BACK ROOM opens, + `done`),
and `applyGuess` folds the answer into the phone's copy (logic.js keeps the two in step; an out-of-step answer re-syncs from `start`).
Letters typed but not sent live in the view alone: a tear-down (the room starting a game, an app switch — `unmount`) drops them and the next
`mount` resumes from the server's record on the same door / next guess. Nothing is counted, no clock runs on the phone.

**A RUN KEEPS ITS OWN DAY (DFIX1 — FABLE REVIEW #1's MUST FIX 1):** the judge remembers the `day` its `start` returned (`js/daily/run-day.js` — in
memory + per device while the run is in flight) and sends it on EVERY guess / finish; the server accepts today's or YESTERDAY's (with a start there —
`api/daily.js#dayOfCall`), so a run that crosses 4 am Eastern finishes on ITS day: the old words, its score, its streak day, its rewards. A refresh
across the turn asks `start` for that day and gets the old run back; once it is scored the next start opens today's (one try still holds: a start
never opens yesterday afresh, a scored run never reopens). A run that crossed the turn ends with "TODAY'S PASSWORD IS OPEN" where the countdown sits.

**The screen (PW2):** the sign THE PASSWORD (a static text glow) · **THE DRAWN DOORS** (`doors.js` — NO PILLS, the owner's standing rule for the dailies:
two 34 × 44 inline-SVG neon doors joined by a short line, the name in small neon type beside each + one line under it — opened "4 GUESSES",
current "4 OF 6 LEFT", the door that stopped you "LOCKED OUT", a door never reached has no label (the line 11 px — DFIX1, was 9.5; one line at 390 / 402 / 430, both looks); `locked` = a dim outline · `on` = lit pink, a
gentle 2.6 s pulse on opacity · `open` = the leaf swung ajar toward you (its own HTML layer: Safari ignores 3D on SVG children), warm light in the
doorway + spilling out, a green frame · `held` = closed, dim, a red tint; the "glow" is a second wide faint stroke — no filter) · the grid · a
one-line note slot (NOT IN THE LIST · NOT ENOUGH LETTERS · NO SIGNAL) · the keyboard. **The marks never by colour alone:** RIGHT = a solid `--good`
tile with REAL NEON (a lit face, a bright rim + an inner glow, the glow in the room) + a thick white bar along the bottom · CLOSE = an outlined
`--close` tile, dark centre, a solid dot in the top-right CORNER with a dark ring of clear space (the letter nudged off it) · MISS = a SUNKEN dark
face + a dim letter (unmistakable beside a bright unused key); the keys carry the same marks smaller (`kit/keyboard.js#setKeyStates`). The tiles
flip one by one (`FLIP_STEP_MS` 250, the mark lands edge-on), a refused word shakes the row, the solved row glows + bounces — transform / opacity
only. No ✓ / ✕ / ⌫ glyphs anywhere: every icon is drawn. The tile shrinks from 58 pt only when the phone's height can't hold the keys at 54 pt.

**THE DOOR REVEAL** (between the doors — `view.js#reveal`, `REVEAL` = the beats): the won row burns brighter (0.32 s) → the drawn door SWINGS open
(0.95 s) while warm light FLOODS down the screen from the doors (`.pw-flood`, opacity only) → the board clears (translate + fade) → THE BACK ROOM's
empty board slides in, its door goes current (~1.7 s in all). The run is ALREADY advanced before the motion starts (`applyGuess`), so a suspend
mid-reveal resumes on THE BACK ROOM's board with the front door open; a tap skips to the end state (`window.__password.skip()`). THE BACK ROOM's
crack plays the same, shorter (× 0.7), into the end screen. A held door: no swing — the door dims red (a low thud), then the end screen — NO line under the grid (DFIX1: the old "… HELD · THE WORD WAS" line is gone; the
door row says LOCKED OUT, the end screen shows the word).

**THE END SCREEN** (`view.js#end` — the owner's ADD-ON, Nov 7): the board + keyboard leave (0.4 s), one clean screen comes in under the door row:
**WELCOME IN** (big green neon) or **LOCKED OUT** (big red neon, the same size + weight for both fail cases — the door row says which door) ·
WELCOME IN: ONE big number ("5 GUESSES") with the time small under it; LOCKED OUT: one small line ("6 GUESSES · 2:15") · both doors' MINI GRIDS side by
side (22-pt cells, the three marks, no letters) with each door's word under its grid (only doors attempted — never the unplayed door's word, the
server's rule) · **SHARE** (the one pink NEON TUBE, a modest radius — NO PILLS) + **NEXT PASSWORD IN 13:39:21** (to the next 4 am Eastern,
`logic.js#msToTurn` on `core/week.js#easternParts`, ticking on the SERVER's clock — the start's `now`) together under it; the leftover space falls at the FOOT (never top-heavy; on a desktop
the block is centred). No status text: the finish's state lives in the hook (`finished()`); only a failed finish shows a quiet NOT RECORDED · NO
SIGNAL. DFIX1: `end()` → `record()`, like COAST CLEAR's — a lost signal (status 0 / 5xx) is retried 4× backed off (0.8 · 1.6 · 2.4 s), a retry is free (the
server keeps the first finish); nothing on screen while it waits, the quiet NOT RECORDED line only once every try failed.

**THE TWO LOOKS (PW2 — Group 4):** every colour is a `--pw-*` token on `.pw-screen` (NIGHT = neon); **`body[data-look="day"]` RETOKENS it** — "C1 clear
morning sky": a pale blue sky (light blue at the top → near white at the foot), a soft sun top-left, a few soft white clouds (static radial blurs),
frosted-glass tiles + keys (white, translucent, soft blue shadows), dark navy letters, a blue accent (#2f86ff) for the sign's dot, the current door
and ENTER; hits mint / close gold from the shared `--good` / `--close` (the colour-blind swap rides them), misses soft grey; the sign "the password."
in lowercase in a rounded bold sans (the phone's own `ui-rounded` — no new font file) with a blue dot. **The game draws no switch**: the console
sets `body[data-look]` (kit/look.js — AUTO / DAY / NIGHT, LOOK_EVENT) and the screen re-themes LIVE — the themed surfaces transition ~0.3 s, the two
backgrounds are painted layers (`::before` night, `::after` day) crossfading on opacity, so a switch never shows a blank; typed letters, flips, the
reveal and the end screen carry on (the E2E flips mid-guess + on the end screen). **The music follows the look:** `index.js#musicFor` → `mood:day`
(the day deck) / `mood:evening` (the night deck); `app.js#applyLook` re-renders on a look change so the station is re-read + crossfaded (music.js).
No new music files.

**THE SOUNDS (Group 5 — `sfx.js`, the dailies chat's picks, final):** key tap · delete · submit · tile hit / near / miss (one per flipping tile, as its
mark lands) · not-a-word (the shake) · door unlock + door open (the reveal) · win sting (WELCOME IN) · fail (a held door). The MAIN file for each
except 08 door-unlock = the -b (its clunk keeps its level on a phone speaker); 06 tile-miss trimmed −2 dB at import (never boosted). Imported by
`scripts/build-pw-sfx.py` (mono, 96 kbps, 44.1 kHz, no metadata; the unpicked -b files not imported; the credits entries of the 11 kept beside
them + ☰ → CREDITS). Quiet-leaning; the SFX slider + THE ONE MUTE apply (the console's bus); the game works silently.
**DFIX1 — ONE SOUND ENGINE + THE FIRST-TAP CATCH:** both dailies play through `js/daily/sfx.js` (was COAST CLEAR's; `sfx.js` here is the table): the kit
keys fire on pointerdown and iOS unlocks on the later touchend, so a sound asked for before the audio runs is held ≤ 400 ms and played the moment the
context runs (none without a gesture behind it); every buffer decodes at the unlock (ONE module-level unlock hook for both games). The preview + the E2E's
page now install the console's unlock (`installAudio`) — before DFIX1 they were silent by construction (why the preview made no sound on the owner's
iPhone); the E2E proves the sounds start on the context after a trusted tap + the catch (`pwSfxPlayed()`). **Music off + the ring / silent switch on =
no effects on an iPhone** (the audio session is 'ambient' with the music off — engine.js; by design).

**THE SHARE CARD (Group 6 — `share.js`):** SHARE renders a 1080 × 1350 canvas in the look on screen — the sign, the two drawn doors with their
names, the headline + "5 GUESSES · 2:15", both mini grids (marks only — NO letters, NO words), THE PASSWORD #n, neonspeakeasy.com — and sends it
through the iPhone's share sheet (`navigator.share` with the file) with ONE plain line: `THE PASSWORD #<n> · 7 guesses · neonspeakeasy.com`
(a locked-out run: `locked out at the front door`; #n = days since `meta.js#PW_EPOCH` + 1 — set it at the switch-over). No file sharing → the line is
shared (or copied) and the image is saved. No emoji anywhere.

## The server flow (`POST /api/daily` — api/daily.js + api/_lib/pw.js)
- **THE ANSWERS LIVE ONLY ON THE SERVER.** `start { game: 'password' }` → `{ day, startedAt, done?, run }` — the run from the stored record
  (`dly/password/{day}/p/{pid} = { g: { 0: [words], 1: [words] }, e?: finishedAt }` — words only, never a mark, never an answer) and **NO seed** (a
  judged cartridge never hands out a seed: a number a phone holds must say nothing about the words). A refresh = the same try, the same run.
- `guess { game: 'password', word }` → `{ day, door, n, marks, solved, failed, word? (only when that door just closed), next?, done, finishedAt? }`.
  The word's spelling is checked FIRST (valid-5 ∪ the list) — refused with **422 not_a_word and nothing written**; then ONE transaction on the record
  re-plays it, applies the rules (a door in order, 6 a door, nothing after the end — 409 `closed` / `finished`) and appends the word. A door never
  attempted is never revealed (the front door held → THE BACK ROOM's word is in no response, ever).
- `finish { game: 'password' }` → scores from THE SERVER's record (`logic.js#replay` — the phone's `result` is ignored; an unfinished run → 409
  `not_done`), then the existing streak / standing code (`better: 'low'`, one bucket per score 2…206). **THE REWARDS (PW2):** `pw.js#flags` reads the
  same record → `{ crack: 1, safe?: 1 }` (both doors opened · both in `SAFE_GUESSES` = 6 or fewer combined) → `core/progress.js#dailyStep` keys them
  `pa.gf['password-crack']` / `['password-safe']` (a dash, like a match's flags) → the award engine grants **KEYHOLE** (`emb-keyhole`, uncommon) /
  **SAFECRACKER** (`card-safecracker`, rare) once, inside the one transaction; "X% of players have this" through `bumpOwners` like every item. Never
  from a phone's claim (the `result` body is ignored). Nothing is awarded in production while the daily is off: no cartridge is registered → 404
  `no_daily` before any finish.
- The cartridge is registered by `api/_lib/dailies.js#loadDailies` **only under `DAILY_TEST=1`** (the emulator tests, `serve.mjs --emu`): production
  answers 404 `no_daily` until THE SWITCH-OVER. No rules change (`dly/` is the rules' default deny — server-only).
- **THE RUN'S DAY (DFIX1):** every call after `start` carries `day`; today's, or yesterday's when the player has a start there (else 409 `not_started`);
  anything else (made up, two back, tomorrow) → 400 `bad_day`; no day = today (an old phone). `start { day }` resumes yesterday's run only while it has
  no score; otherwise today's. The finish's streak step uses the RUN's day (`progress.js#playDay(…, day)`); the early-bird hour is the start's for a run
  that crossed the turn. A move THE PASSWORD doesn't own (`dig` / `chord` / `pause` / `resume`), a null or non-object body → 400 `bad_action` (never a 500).
- **The cost (the free plans):** ≈ 10–15 `/api/daily` calls a run (start + ≤ 12 guesses + the resumes + finish), each 2–4 database round trips. At 100
  players × both dailies × 30 days ≈ 200 k invocations a month (Vercel Hobby: 1 M) and ≈ 200 MB of database traffic (Spark: 10 GB); `dly/` is never pruned
  and there is no per-player call budget yet — both THE DAILY MODULE's (FABLE REVIEW #1, 14).

## THE REWARDS' art (THE VAULT — docs/vault.md)
- **SAFECRACKER** (rare — the owner's APPROVED Grok art, `card-safecracker.png` → `assets/vault/pw/safecracker.webp`, 1280 × 720, converted only by
  `scripts/build-pw-cards.mjs`): the art = the material (`css/vault.css .vl-s-pw-safecracker`); the motion = `js/fx/pw-cards.js#pwSafe` on the shared
  surface — gold dust pouring out of the vault to the right, the blaze breathing, a glint running round the wheel every ~5.6 s; the hero (the wheel +
  the open door's gold, `js/fx/pw-specs.js`) sits at ≈ 0.62 across the strip — THE HERO-SPOT RULE (`vault/hero.js` reads `PW_SPECS`; `vault/layout.js`
  the full card's). THE LAB: n 188 (the strip) · 189 (the full card) — APPROVE · FIX · CUT like every card; only approved art ships.
- **KEYHOLE** (uncommon): neon tubes like the other emblems (`vault/emblem-art.js` shape `keyhole` — the round eye + the slot in amber, a pink key's
  tip at the eye, a warm light glowing through the hole as its own layer); the lab n 190. The keyhole art in dailies-cards-v2 was a shape reference only.
- **THE SIMULATION** (`node scripts/sim-password.mjs [runs] [seed]`): a bot playing like a decent regular (a usual opener, then a guess consistent with
  every mark from the common-word pool — the answer list; ~8 % of guesses forget one constraint, ~10 % reach for any valid word) over the real list.
  **4,000 runs: 22.4 % crack both doors in ≤ 6** (3.6 guesses a door on average — a bot stays consistent better than a person: from published Wordle
  distributions a human's two doors land ≤ 6 about 8 % of the time). Over the owner's 20 % line; **the threshold stays at 6** as told — the real
  rate shows in `pcount` once the daily is live.

## The schedule (`api/_lib/pw-day.js`)
The list is shuffled once per cycle with an HMAC-SHA256 stream keyed by THE PEPPER + the cycle number (`pw-order:<cycle>` — never the 32-bit
`dailySeed`, never the date alone: the repo is public), and day k of the cycle takes words 2k and 2k + 1 of that order: two words a day, always
different, no word repeats until the list is used up (a cycle = ⌊n / 2⌋ days — **701 days on today's 1,402**, DFIX1), then a fresh order. Day 0 = Nov 1 2026
(`SCHEDULE_EPOCH`); the emulators' pepper is `emulator-pepper` (fb.js), so a local run's words are NOT the live schedule's.
**Before go-live (THE DAILY MODULE — not built yet):** freeze the schedule — any edit to the list after launch reorders the whole current cycle (FABLE
REVIEW #1, 13): put a list version in the HMAC label (`pw-order:<listVersion>:<cycle>`) with a test that fails on an edit without a bump, or store each
cycle's order once server-side. The list is free to change until then.

## The list build (`scripts/pw-words/build.mjs`)
`node scripts/pw-words/build.mjs <count_1w.txt> [--candidates]` — Norvig's unigram counts (MIT, norvig.com/ngrams) rank the words; the words
themselves come from ENABLE2K ∩ the Hunspell en_US BASE WORDS (a lower-case stem — never an expanded inflection, never a name), both committed
gzipped in `scripts/oc-pools/dict/`. Five letters, minus plurals (`KEEP_S` keeps chaos / atlas …), past tenses (-ed, -ied), -ing forms of a verb
(doing, using — thing / bring / swing stay), comparatives of an everyday adjective (`COMPARE_STEMS`), build-words.mjs's house blocklist and THE
KID-SAFE LIST (`blocklist.mjs`). The sources hold only ~2,800 such words; the first 2,400 went to **THE REVIEWER** (a separate agent that hadn't seen
the filtering, over the whole list: cut anything obscure, awkward, rude, adult, alcohol / drugs / violence / death, dark second meanings,
inflections, names, Britishisms — when in doubt, out) → 1,012 cut; the remaining 407 to a second → 346 cut. **1,449 answers** (the target was
~2,000: the sources + a strict kid-safe read don't yield more — widening it means loosening the read). **DFIX1 (Nov 7): 47 ADULT-VOCABULARY words cut**
(FABLE REVIEW #1's list — banal, trite, pithy, terse, fjord, segue, …: `blocklist.mjs#ADULT_VOCAB`, applied by the build WITH the reviewer's cuts — after the
pick, so a rebuild gives the same list; the MEAN + GLOOMY words the review named stay, the owner's call) → **1,402 answers**. The build fails without the cuts files, so
no list ships unreviewed; every answer must be in data/words/valid-5.json (a word a phone can't type is never an answer). The list is alphabetical
(its order says nothing). A re-run is byte-identical for the same inputs.

## Tests + proof
- Pure: `node --test tests/password.test.mjs tests/pw-day.test.mjs tests/password-list.test.mjs tests/kit-oc1.test.mjs tests/cartridge.test.mjs tests/achievements.test.mjs`.
- `/api` on the emulators: `cd tests/integration && node --test password.test.mjs` (DAILY_TEST=1 is set inside) — the answer never early, an unplayed
  door never, a non-word costs nothing, the cap, a second start = the same try, one finish, production refuses it; PW2: a crack in 3 → KEYHOLE +
  SAFECRACKER, a crack in 7 → KEYHOLE only, a held door → neither, never twice. DFIX1: THE 4 AM TURN (start 3:58 → guesses across 4:00 → finish
  4:00:30 records on the start's day + its streak day + KEYHOLE / SAFECRACKER; a refresh across the turn resumes; the review's crack-at-3:58:40 case),
  the abuse checks (made up · two back · tomorrow · no start there → refused; a start never opens yesterday afresh; one try holds), the clean 400s.
- The E2E (the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`): `E2E_BASE=http://localhost:<port> node e2e-password.mjs "<browser>"
  ./shots-password` — start (the drawn doors, no status line, no capsule) → a refused non-word → a miss → a refresh mid-door resumes → a LOOK FLIP
  mid-guess (the letters stay, the tiles re-theme) and back → THE FRONT DOOR cracked + THE DOOR REVEAL → torn down MID-REVEAL + rebuilt on THE BACK
  ROOM's board → letters typed, torn down + rebuilt (the row cleared) → THE BACK ROOM cracked → THE END SCREEN (the board + keys gone; WELCOME IN · 4
  GUESSES · the mini grids · SHARE · the countdown; a look flip on it) + the server's score → one try; a second phone: six misses → LOCKED OUT
  (the door dims, no line under the grid, one mini grid + its word on the end screen, the same headline size), 206, no leak. DFIX1: the door
  sublines ≥ 11 px on one line at 390 / 402 / 430, the sounds START on the context after the first trusted tap, the LOCKED OUT sound, THE FIRST-TAP
  CATCH on the preview (+ nothing without a tap). 40 checks.
- The look: `tests/integration/password-preview.html` (no Firebase; the fake judge's test words CRANE · LIGHT) — `?d1=TRAIN,CRANE&d2=STORM,FIGHT&typed=LI`
  (mid door 2, all three marks), `?d1=TRAIN&refuse=1`, `?end=crack | fail1 | fail2&still=1` (the end screens), `?d1=TRAIN&reveal=1` (THE DOOR REVEAL runs —
  `shots.mjs --cast 4400 --strip 12 --cast-from 1200` films it), `&look=day` + the tiny DAY / NIGHT toggle at the foot (`&toggle=0` hides it),
  `&share=1` (the rendered share image over the screen), `&corner=0`; shots via `shots.mjs --page … --sizes 390x844,402x874,430x932` (`--wk` =
  WebKit). Shots: `Downloads/neon/password/shots/` — `pw2-before` / `pw2-g0` (Group 0, both games, Chromium + WebKit), `pw2-g1` (the doors, the end
  screens, the reveal strips), `pw2-g4` (the day look), `pw2-addon-before` / `pw2-addon-after` (the end screen's ADD-ON), `pw2-share`, `pw2-card`, `pw2-e2e`.

**The local run before the push (PW2, Nov 7):** unit 1316 · rules 66 + /api 38 (+ password 6, the rewards on finish) · smoke GAMES=overclock 5/5 ·
e2e-password 32/32 · the no-sideways guard 312/312 · the reveal filmed at 390 (`--cast`), the end screens at 390 / 402 / 430 in both looks + WebKit.

**The local run before the push (DFIX1, Nov 7):** see docs/games/review-dailies-1.md "DFIX1 — the fix pass".

## Real vs placeholder (PW2)
REAL: the rules, the server judging + the record + the schedule + the list, the kit hook, BOTH looks + the live switch, the drawn doors, the door
reveal, the end screen, the sounds, the share card, the rewards (server-awarded; their art in THE LAB waiting for the owner's marks — only approved
art ships), the E2E. NOT BUILT (THE DAILY MODULE): the way in (no lobby row, no sign — `config.js#DAILIES`, not GAMES), the banner, the pause, the
RESUME chip, the rankings, the streak hooks, the switch-over (+ `PW_EPOCH` set to the first live day).
