# THE PASSWORD — a daily, server-judged Wordle-type (PW1, Nov 7 2026 — ships OFF)

The owner's decisions: `docs/games/plan.md` (PW1). The contract it plugs into: `docs/cartridge.md` (THE DAILY PLUG-IN, D2). THE DAILY MODULE
(a later pass) opens it once a day, owns the banner, the pause, the RESUME chip, the real result + the share, the rankings and the streak hooks;
until THE SWITCH-OVER (the repo private first) `daily.on` is `false`, the server answers it only under `DAILY_TEST=1`, and the game is reachable
only through its preview + its E2E. **Two doors in a row — THE DOOR, then THE BACK ROOM — each a 5-letter word, 6 guesses each; missing door 1
ends the run.** Score = (2 − doors opened) × 100 + guesses used (a clean crack 2…12, lower is better), the time breaks a tie.

| file | what |
| --- | --- |
| `js/games/password/meta.js` | THE THIN META (pure, no imports): the constants (5 letters · 2 doors · 6 guesses · the door names), SOLO, MIN_PLAYERS 1, BANNER_NAME, `chatLocked` → false |
| `js/games/password/logic.js` | THE RULES, pure — the server imports it: `judge` (Wordle's duplicate-letter rule), the run, `serverGuess` (the server's step) / `applyGuess` (the phone's), `runView` (the stored words → the run a phone may see), `scoreOf` / `resultOf`, `replay` (the server's check), `statusLine`, `keyStates` |
| `js/games/password/daily.js` | THE DAILY PLUG-IN: `daily = { on: false, create, resumeKey, result, replay, problems }` — a day set carries NO words (`{ v: 1, day }`) |
| `js/games/password/index.js` | THE CARTRIDGE (the contract's every REQUIRED piece; a room match never starts — `playable: false`) |
| `js/games/password/judge.js` | THE JUDGE on the phone: start / guess / finish through `/api/daily` (js/profile/api.js — no socket), `canType` = the pre-check against the public data/words/valid-5.json |
| `js/games/password/view.js` + `css/password.css` | THE SCREEN: the sign, the two door chips, the status line, the 6 × 5 grid (58 pt tiles), the kit keyboard (ENTER, the drawn delete key, the keys' marks), the flips, the shake, the hand-off, the simple result; every colour a `--pw-*` token (NIGHT now, DAY in PW2); `window.__password` = the test hook |
| `api/_lib/pw.js` | THE SERVER's cartridge (`core/daily.js#registerDaily`, `judged: true`): the list, the spelling check, `judge` (one guess inside a transaction), `resume`, `verify` from the record |
| `api/_lib/pw-day.js` | THE SECRET SCHEDULE: the day's two words from the pepper (an HMAC-keyed shuffle per cycle; two a day; no repeat until the list is used up) |
| `api/_data/pw/answers.json` + `valid-5.json` | THE ANSWER LIST (server-only — never served, never imported by a page; ships with api/daily.js through vercel.json `includeFiles`) + the server's copy of the spelling list |
| `scripts/pw-words/` | the list build (`build.mjs`), the blocklists (`blocklist.mjs`), the candidates + THE REVIEWER's cuts (`cuts.json`, `cuts-tail.json`) |
| `js/games/kit/keyboard.js` + `css/kit.css` "THE KEYS' MARKS" | the kit hook built here: `setKeyStates`, the drawn delete icon, `go` = the label |
| `tests/password.test.mjs` · `tests/pw-day.test.mjs` · `tests/password-list.test.mjs` · `tests/kit-oc1.test.mjs` | the rules · the schedule · the list (never served, kid-safe, in valid-5) · the kit hook |
| `tests/integration/password.test.mjs` | `/api/daily` for THE PASSWORD on the emulators |
| `tests/integration/password-preview.html` · `password-daily.html` · `e2e-password.mjs` | the look preview (a local fake judge, fixed test words) · the E2E's page (the real judge on the emulators) · the E2E |

## The game (what the phone does)
The view holds ONE thing: **the run** — `{ door, doors: [{ guesses, marks, state: open | solved | failed, word }], done, startedAt, finishedAt }`
— and every bit of it comes from the server: `judge.start()` hands back the run so far (the words guessed, their marks, a CLOSED door's word), each
`judge.guess(word)` answers with that guess's marks (+ the door's word only when that guess closed it, + `next` when THE BACK ROOM opens, + `done`),
and `applyGuess` folds the answer into the phone's copy (logic.js keeps the two in step; an out-of-step answer re-syncs from `start`).
Letters typed but not sent live in the view alone: a tear-down (the room starting a game, an app switch — `unmount`) drops them and the next
`mount` resumes from the server's record on the same door / next guess. Nothing is counted, no clock runs on the phone.

The screen: the sign THE PASSWORD (a static text glow), the door chips (the one in play lit ice-blue; an opened one green with a drawn check + the
guesses it took; a held one red with a drawn cross), the line "DOOR 2 · THE BACK ROOM · 4 OF 6 LEFT", the grid, a one-line note slot (NOT IN THE
LIST · NOT ENOUGH LETTERS · NO SIGNAL), the keyboard. **The marks never by colour alone:** RIGHT = a solid `--good` tile + a thick white bar along the
bottom · CLOSE = an outlined `--close` tile, dark centre, a solid dot top-right · MISS = flat + dim; the keys carry the same marks smaller
(`kit/keyboard.js#setKeyStates`). The tiles flip one by one (`FLIP_STEP_MS` 250, the mark lands edge-on), a refused word shakes the row, the solved
row glows + bounces — transform / opacity only; 60.3 fps at 4× CPU (shots.mjs `--fps`). THE HAND-OFF between the doors is a placeholder card
(THE DOOR OPENS · THE BACK ROOM, 1.8 s — PW2 draws the real door); THE END is a simple card (DOORS · GUESSES · TIME, the doors' words — a door never
opened says NEVER OPENED; the real result + the share are PW2) and calls `judge.finish()` → RECORDED · SCORE n. No ✓ / ✕ / ⌫ glyphs anywhere: every
icon is drawn (inline SVG in currentColor). The tile shrinks from 58 pt only when the phone's height can't hold the keys at 54 pt
(`--pw-tile: clamp(44px, …, 58px)`).

## The server flow (`POST /api/daily` — api/daily.js + api/_lib/pw.js)
- **THE ANSWERS LIVE ONLY ON THE SERVER.** `start { game: 'password' }` → `{ day, startedAt, done?, run }` — the run from the stored record
  (`dly/password/{day}/p/{pid} = { g: { 0: [words], 1: [words] }, e?: finishedAt }` — words only, never a mark, never an answer) and **NO seed** (a
  judged cartridge never hands out a seed: a number a phone holds must say nothing about the words). A refresh = the same try, the same run.
- `guess { game: 'password', word }` → `{ day, door, n, marks, solved, failed, word? (only when that door just closed), next?, done, finishedAt? }`.
  The word's spelling is checked FIRST (valid-5 ∪ the list) — refused with **422 not_a_word and nothing written**; then ONE transaction on the record
  re-plays it, applies the rules (a door in order, 6 a door, nothing after the end — 409 `closed` / `finished`) and appends the word. A door never
  attempted is never revealed (door 1 held → THE BACK ROOM's word is in no response, ever).
- `finish { game: 'password' }` → scores from THE SERVER's record (`logic.js#replay` — the phone's `result` is ignored; an unfinished run → 409
  `not_done`), then the existing streak / standing code (`better: 'low'`, one bucket per score 2…206).
- The cartridge is registered by `api/_lib/dailies.js#loadDailies` **only under `DAILY_TEST=1`** (the emulator tests, `serve.mjs --emu`): production
  answers 404 `no_daily` until THE SWITCH-OVER. No rules change (`dly/` is the rules' default deny — server-only).

## The schedule (`api/_lib/pw-day.js`)
The list is shuffled once per cycle with an HMAC-SHA256 stream keyed by THE PEPPER + the cycle number (`pw-order:<cycle>` — never the 32-bit
`dailySeed`, never the date alone: the repo is public), and day k of the cycle takes words 2k and 2k + 1 of that order: two words a day, always
different, no word repeats until the list is used up (a cycle = ⌊n / 2⌋ days — ~725 days on today's 1,449), then a fresh order. Day 0 = Nov 1 2026
(`SCHEDULE_EPOCH`); the emulators' pepper is `emulator-pepper` (fb.js), so a local run's words are NOT the live schedule's.

## The list build (`scripts/pw-words/build.mjs`)
`node scripts/pw-words/build.mjs <count_1w.txt> [--candidates]` — Norvig's unigram counts (MIT, norvig.com/ngrams) rank the words; the words
themselves come from ENABLE2K ∩ the Hunspell en_US BASE WORDS (a lower-case stem — never an expanded inflection, never a name), both committed
gzipped in `scripts/oc-pools/dict/`. Five letters, minus plurals (`KEEP_S` keeps chaos / atlas …), past tenses (-ed, -ied), -ing forms of a verb
(doing, using — thing / bring / swing stay), comparatives of an everyday adjective (`COMPARE_STEMS`), build-words.mjs's house blocklist and THE
KID-SAFE LIST (`blocklist.mjs`). The sources hold only ~2,800 such words; the first 2,400 went to **THE REVIEWER** (a separate agent that hadn't seen
the filtering, over the whole list: cut anything obscure, awkward, rude, adult, alcohol / drugs / violence / death, dark second meanings,
inflections, names, Britishisms — when in doubt, out) → 1,012 cut; the remaining 407 to a second → 346 cut. **1,449 answers** (the target was
~2,000: the sources + a strict kid-safe read don't yield more — widening it means loosening the read). The build fails without the cuts files, so
no list ships unreviewed; every answer must be in data/words/valid-5.json (a word a phone can't type is never an answer). The list is alphabetical
(its order says nothing). A re-run is byte-identical for the same inputs.

## Tests + proof
- Pure: `node --test tests/password.test.mjs tests/pw-day.test.mjs tests/password-list.test.mjs tests/kit-oc1.test.mjs tests/cartridge.test.mjs`.
- `/api` on the emulators: `cd tests/integration && node --test password.test.mjs` (DAILY_TEST=1 is set inside) — the answer never early, an unplayed
  door never, a non-word costs nothing, the cap, a second start = the same try, one finish, production refuses it.
- The E2E (the emulators + `DAILY_TEST=1 node scripts/serve.mjs <port> --emu`): `E2E_BASE=http://localhost:<port> node e2e-password.mjs "<browser>"
  ./shots-password` — start → a refused non-word → a miss → a refresh mid-door resumes → THE DOOR cracked + the hand-off → letters typed, the screen
  torn down + rebuilt (the row cleared) → THE BACK ROOM cracked → the result + the server's score → one try; a second phone: THE DOOR HELD, 206, no leak.
- The look: `tests/integration/password-preview.html` (no Firebase; the fake judge's test words CRANE · LIGHT) — `?d1=TRAIN,CRANE&d2=STORM,FIGHT&typed=LI`
  (mid door 2, all three marks), `?d1=TRAIN&refuse=1`, `?end=crack&still=1`, `?end=fail1&still=1`, `?end=fail2&still=1`, `?d1=TRAIN,CRANE&handoff=1`,
  `&look=day` (PW2), `&corner=0`; shots via `shots.mjs --page … --sizes 390x844,402x874,430x932`; the fps: `--js "__password.type('CRANE');__password.enter()" --fps 2400 --cpu 4`.
  Shots: `Downloads/neon/password/shots/r1` (the preview states), `e2e` (the real run), `kb-before` / `kb-after` (OVERCLOCK's keyboard unchanged but the drawn delete key).

**The local run before the push (Nov 7):** unit 1314 · rules 66 · /api 38 + progression 10 + password 5 + sightings 4 · smoke GAMES=overclock 5/5 ·
e2e-password 23/23 · e2e-oc-sideways green · the flip at 60.3 fps on 4× CPU.

## Real vs placeholder (PW1)
REAL: the rules, the server judging + the record + the schedule + the list, the kit hook, the night look, the resume / suspend, the E2E. PLACEHOLDER:
the hand-off card (PW2: the door reveal), the end card (PW2: the real result + the share), the DAY look (PW2 — the tokens are ready), the rewards
(PW2: KEYHOLE · SAFECRACKER). NOT BUILT (THE DAILY MODULE): the way in (no lobby row, no sign — `config.js#DAILIES`, not GAMES: GAMES drives the city's
signs, HOW TO PLAY, THE BOARD's catalog + the match reports), the banner, the pause, the RESUME chip, the rankings, the streak hooks, the switch-over.
