# THE CARTRIDGE PLUG — how a game plugs into the console

*(LOBBY 2.0 B, Nov 4 2026 — the owner: "the lobby is the console, the games are the cartridges".)* The console = the room in the city, the
dock, the guest list, the game start + the walk back out, THE WINNER's BANNER PLANE, THE REMATCH VOTE, the chat, the podium, the profile +
progression + THE BOARD (through `/api`). A game plugs in through ONE written contract — `js/games/cartridge.js` (REQUIRED / OPTIONAL /
DAILY + `checkCartridge`) — and the console reads a game ONLY through it, never by its id (`tests/cartridge.test.mjs` greps the console).
How a real-time game is BUILT (rules first, the director, the view on the match kit, its E2E): `docs/match-kit.md` + CLAUDE.md's "Adding a
game" checklist. This page is what it must EXPORT and what it GETS.

## What a game exports (`js/games/<id>/index.js`)
| export | | what the console does with it |
| --- | --- | --- |
| `start({ code, matchId, settings, participants, now, used })` | required | builds the match. **`now` is the moment the MATCH BEGINS** — the room's walk inside (2.6 s, `core/room-show.js#START_MS`) runs before it on every phone: time the first phase from `now`, never from `Date.now()`. **`used`** (OC1) = THE ROOM-NIGHT PATH as it is at the start (`rooms/{CODE}/meta/used` — `{ gameId: { key: true } }`): deal around `usedOf({ used }, yourId)`, never reach into the store for it (`cartridge.js#START_ARGS`, host.js passes every one — tests/cartridge + overclock-oc1) |
| `prepare(game, { code, host })` | required | every host tick (≈ 250 ms): top-ups, private host duties — idempotent |
| `step(game, { code, now, live, online })` | required | the PURE director: a patch, `{ lobby: true }` or `null` (+ `$room` side writes) |
| `livePaths(game)` | required | the player-written paths the room mirrors into `state.live` (check `liveKey` before trusting it) |
| `createView` | required | `lazyView(() => import('./view.js'), gameSheets('<id>'))` — its code + sheets load only when it's played; the console WARMS it (`createView.warm()`) on every phone during the walk inside |
| `DEFAULT_SETTINGS`, `OPTIONS`, `estimateMinutes(s)` | required | the options sheet under PLAY / GAMES (every OPTIONS key has a default; an option OR one of its choices may carry `when(players)` — shown only with that many connected players; a hidden saved choice falls back to the first shown — PD-2: PRISM DROP's BATTLE needs 2). `estimateMinutes` may return a WORD instead of minutes (HE3: HOLD'EM's CASH → "OPEN" — the sheet shows it as it is). `when` reads only the player count: an option that matters for one MODE only says so in its `hint` (HOLD'EM's SPEED: TOURNAMENT ONLY) |
| `finalRanks(game)` | required | GAME NIGHT's 3 / 2 / 1 points (`night/{matchId}`) → THE WINNER's BANNER (3 points = first; a tie = everyone with 3) + THE NIGHT's CHAMPION |
| `MUSIC` or `musicFor(game)` | required (one) | its music (`null` = none — the song is the music) |
| `FINAL_MUSIC` | optional | its podium music (default the victory playlist) — it starts when the podium FRAME is on screen (`ui/final.js` sets `state.podium` → `app.js#musicFor`), never during a last round's answer screen inside `final` (FRIENDS B — B2) |
| `OWN_VICTORY_SOUND` | optional (meta) | FRIENDS B (B2) — `true` = its body plays its OWN winner sound, so the console's podium sting (`pgSfx('victory')`) is skipped — never two winner sounds. OVERCLOCK sets it (its fanfare) |
| `ACCENT` | optional (meta) | FRIENDS B — the END SCREEN's colour: a `#rrggbb` that re-lights the console frame's main tube (BACK TO THE ROOM — `.final.has-accent`, `--fin`); missing = THE NEON TUBE's pink. OVERCLOCK `#ff6a1a` (OVERDRIVE orange). `checkCartridge` refuses a bad colour |
| `MIN_PLAYERS` / `SOLO` | optional | more players than the app's minimum (DOUBLE AGENT 4) / `SOLO: true` lets ONE player start it (OVERCLOCK's solo) |
| `nightBonus(game)` | optional | game-night points that aren't a placing |
| `sealed(game)` | optional | THE SEAL — the round's secrets (`kit/seal.js`, docs/data-model.md) |
| `chatLocked(game, uid, live)` | optional | true while this player is actively playing → the chat stays shut for them (the console checks "a participant" first). No export = never locked |
| `CHAT_CHIPS` | optional | ≤ 4 short quick replies of its own on the chat's chips row while it's on screen |
| `BANNER_NAME` | optional | its name on THE WINNER's BANNER PLANE (2–14 letters — it shares a 24-letter panel with a name; default its GAMES name) |
| `rematchSettings(settings, lastGame)` | optional | the settings a REMATCH starts with (default: the same) |
| `preload({ settings, host })` | optional | called on EVERY phone at the game start (the walk inside): FETCH its pools / sounds / fonts so the view is ready when the push through the door ends. Fetch, don't build — the city is still drawing |
| `daily` | optional | THE DAILY PLUG-IN — below |
| `LOOKS` | optional (meta) | OC1 — the looks it has: `['day', 'night']` (the default: it follows THE GAME LOOK setting) or ONE (`['night']` — OVERCLOCK's OVERDRIVE): the console then paints that look whatever the phone's setting says (`app.js#paintLook`) and ☰ → Settings → GAME LOOK shows `NIGHT · LOCKED` + "OVERCLOCK plays at night" while it's on screen (never hidden). `cartridge.js#looksOf / lookLockOf`. A DAY skin later = both looks, and the setting comes back by itself |

Also, outside index.js: its row in `config.js` GAMES (`name`, `theme`, `playable` — THE ONE SWITCH), its **tube mark** in
`js/core/marks.js` (the game start's sign — `ui/tube-logo.js#gameLogoSvg` — + the city's game signs), its theme in
`css/base.css`, its rules in `ui/help.js` (HOW TO PLAY from GAMES), its standings + records in `core/match-report.js`, its boards in
`core/boards.js`, its colours in `board/view.js#GAME_LIGHT`.

## What the console gives a game
- **The room**: the players + presence + the host (`state.players / presence / meta`), host migration, rejoin, late joiners (they spectate
  and are dealt into the next match), the kick + LOCK THE DOOR — the game never handles any of it.
- **THE GAME START**: the sign powers down → its tube logo lights under TONIGHT → the two lines file in → the push through the door; its
  view mounts when that ends. **THE CITY PAUSE**: while it's on screen the city is GONE (it draws nothing, its sounds stop, its canvases —
  ~66 MB at 3× — are freed); the city comes back caught up after. A game never needs to know about the city: an iPhone never holds both.
- **The corner** (☰ menu: CHAT, HOW TO PLAY, SETTINGS, QUIT TO THE ROOM, the host's END GAME — and music on / off), the chat (its own lock +
  chips through the plug), toasts, the match kit's pieces (`docs/match-kit.md`).
- **The end**: the podium (`ui/final.js#createFinal` — the game passes its rows), the results → XP, levels, the streak, cards, THE BOARD
  through `/api` (`core/match-report.js` — the server checks + replays; the game never writes a score), then BACK TO THE ROOM → the walk back
  out → THE WINNER's BANNER PLANE (from `finalRanks`) → THE REMATCH VOTE (the host's REMATCH = `rematch()`: the same game,
  `rematchSettings`, everyone in).

## THE DAILY PLUG-IN (ships OFF)
**DM2 — what THE DAILY SCREEN reads from a daily (docs/progression.md "DM2"):** its thin meta's `scoreLine(score)` (TODAY's DONE row, YOUR TABLE,
SHARE TODAY — spoiler-free), its cartridge's `createApiJudge()` (the run host wraps it to hear the start + the finish) + `daily.create`, and — for a
first-time lesson (its row's `lesson: true`) — `createLesson({ onDone }) → { mount, unmount }` (COAST CLEAR's PRACTICE HARBOR).

A game that offers a daily (OVERCLOCK's QUICK solo run, the WORDLE-type, COAST CLEAR) exports
`daily = { on: false, create({ date: 'YYYY-MM-DD', uid, now, daySet, code? }) → game, resumeKey(date, uid) → string }`:
**THE DAY SET in → today's run** (the same content for everyone that day — `daySet` = THE SERVER-PICKED, SEALED day set the daily module
makes from a SERVER SECRET once a day, NEVER computable from the date: the repo is public; `date` only names the day — it never seeds anything;
never a party-only part — DUMB LUCK). Two kinds (FRIENDS B fixed this line to match the code): a **client-built** daily (OVERCLOCK —
`overclock/daily.js`, `code` its room tag) builds the whole puzzle from `daySet`; a **SERVER-JUDGED** daily (THE PASSWORD, COAST CLEAR —
`password/daily.js`, `coastclear/daily.js`) returns an EMPTY run shell — its puzzle never leaves the server (`api/_lib/pw.js`, `cc-board.js`),
**one try**, **resume** (a refresh / an app switch resumes from `resumeKey`, never restarts). **A RUN KEEPS ITS OWN DAY (DFIX1):** a judged daily's
every call after `start` names the day that start returned (`js/daily/run-day.js`; `api/daily.js#dayOfCall` takes today's or yesterday's with a start
there) — "one try" = a run may be finished until 4 am the day after it began, never started twice. **THE DAILY MODULE's ENGINE (DM1, Nov 8 —
docs/progression.md "THE DAILY MODULE")** built: the shared `js/daily/` kit (`clock.js` · `judge.js#createDailyJudge` · `end.js` · `share.js` + `sfx.js` ·
`run-day.js` — a judged daily's view uses these, never its own copy: `tests/daily-kit.test.mjs`), THE THROWAWAY GATE, THE FROZEN SCHEDULE, THE 4 AM
PICKER, the call budget, THE ROOM WINS, THE GO-LIVE SWITCH, THE DAILY SECRET (every day's content from it — never the pepper). OVERCLOCK's daily is
DROPPED (Ben, Nov 8 — its plug-in stays in the code, off and unwired).

**THE DAILY REGISTRY + ADDING A DAILY (DM1 — PLUG-AND-PLAY, no fixed count anywhere).** `config.js#DAILIES` is the ONE list the server + the phone
share (`core/daily.js#dailyRows` / `todaysDailies`): a row = `{ id, name, theme, tag, blurb, playable: false, daily: true, order, ticket (its ticket
art key), lesson (a first-time lesson — DM2), on }`. **A new daily** = (1) its cartridge as below (meta.js + index.js + `daily` OFF, its tube mark,
theme, registry loader — `tests/cartridge.test.mjs` `DAILY_ONLY`); (2) its SERVER half (`api/_lib/<id>.js`: `{ id, name, better, buckets, bucket,
verify, judged?, load(day) (its day built from THE DAILY SECRET + stored once — THE 4 AM PICKER), resume, judge | act + moves, flags }`) in
`api/_lib/dailies.js#SERVER_CARTS`; (3) ONE row in `DAILIES`. THE SWEEP, the daily XP cap, the picker, `today` and DM2's screens follow by themselves.
A judged daily's phone side = `createDailyJudge(id, { moves })` + the kit's end parts. OC5 (OVERCLOCK, `js/games/overclock/daily.js`)
added the `daySet` slot (+ `code`, the solo room's code its trivia bank is encoded with) and two more pieces the module calls:
`result(game, uid) → { score, time, rank }` (ONE comparable number: the points, then the faster run) and `replay(daySet, record, uid)` (the
server re-scores a finished run's record → the same result, or null). OVERCLOCK's day set: `{ v: 1, day, seed, order: [six skill challenges,
one per brain category], deal?, trivia?: [three own-bank questions] }` (`daily.problems(daySet)` says what's wrong with one). `on` stays `false` — THE DAILY MODULE (a later
pass) seeds it, unlocks it, feeds the streak, owns the daily results + percentiles and switches all three dailies on together; a game never
builds its own daily screen, rankings or streak hooks. `checkCartridge` fails a daily that switches itself on.

**THE PASSWORD (PW1, Nov 7 — docs/password.md): THE FIRST REAL DAILY, SERVER-JUDGED.** Its day set carries NO words (`{ v: 1, day }`): the
answers live only in api/_data/pw/ and reach a phone as MARKS through a new `/api/daily` action — `guess { game, word }` — a door's word only once
that door closes; `start` hands a judged cartridge (`api/_lib/pw.js`: `judged: true`) the run so far instead of a seed, and `finish` scores from THE
SERVER's record, never the phone's claim. Its plug-in: `daily = { on: false, create, resumeKey, result, replay, problems }` — `create()` builds an
empty run shell the view fills from the server. The server registers it only under `DAILY_TEST=1` until THE SWITCH-OVER (the repo private first).
**A DAILY-ONLY cartridge is NOT a GAMES row:** `config.js#DAILIES` (`gameRow(id)` reads either list) — GAMES is the lobby's list (the city's signs,
HOW TO PLAY, THE BOARD's catalog, the match reports), and a daily is none of that; it is still a full cartridge (tests/cartridge.test.mjs
`DAILY_ONLY`, the harbor `cartridge` group) with its tube mark, its theme and a loader in the registry — no meta at boot (the console never offers it).
The kit grew a hook for it: `kit/keyboard.js#setKeyStates` (per-key hit / near / miss marks on the shared tokens), `go` as the label (ENTER), the
delete key a DRAWN icon for every game. **PW2** added the first `flags` on a judged daily (`pw.js#flags` — the server's record → `dailyStep({ flags })` →
`pa.gf['password-<flag>']` → the award engine: KEYHOLE · SAFECRACKER) and the first cartridge whose `musicFor` follows THE GAME LOOK (`app.js#applyLook`
re-renders on a look change, so a game's station is re-read + crossfaded).

**COAST CLEAR (CC1, Nov 7 — docs/coastclear.md): THE SECOND JUDGED DAILY, its board only on the server.** A judged cartridge may now list `moves`
(`['dig', 'chord', 'pause', 'resume']`) + `act` + `load`: `api/daily.js` answers each move through ONE generic path — the day's data (`load(day)` — its
board) + the start read in parallel, then ONE transaction on the record (`act` → `{ record | null, resp }` or a refusal; a repeat writes nothing; a
transaction's first null never aborts it) — and every judged answer (start + moves) carries the server's `now` (the phone's clock). Its day set carries no
board (`{ v: 1, day }`); `daily = { on: false, create, resumeKey, result, replay, problems }`; a DAILIES row. **CC2:** `LOOKS: ['day', 'night']` + `musicFor`
(the music follows the look); the answer that ENDS a judged run may carry what the run hid (`reveal` — every light, for the end screen); `flags` from the
record (`cc.js#flags` → `coastclear-clear` / `-ghost` → LIGHTHOUSE · GHOST RUN — the same path as THE PASSWORD's).

**OVERCLOCK's DAILY RESERVE (OC6 + OC7 — for THE DAILY MODULE).** ~20% of every built pool is SERVER-ONLY, so a daily's answers can't be
looked up in the site's files:
- **Where:** `api/_data/oc-reserve/` — EIGHT files, the SAME shapes as the party files in `data/oc/` (docs/content.md "THE POOL BUILD"):
  OC6's `truefalse.json` `{ items }` · `higherlower.json` `{ stats }` · `timeline.json` `{ themes }` · `sortit.json` `{ sets }`; OC7's
  `trivia.json` `{ items }` · `closest.json` `{ questions }` · `missinglink.json` `{ puzzles }` · `spellcheck.json` `{ words }`. Built by
  `scripts/oc-pools/build.mjs` (a stable hash of each item's id decides its side). Never served (Vercel serves `api/` as functions only;
  `scripts/serve.mjs` the same — a 404), never imported by a page, never dealt in a party (`tests/overclock-reserve.test.mjs`). A function that
  reads it: `readFileSync` + `vercel.json#functions.<fn>.includeFiles: "api/_data/oc-reserve/*.json"` (or a static `import … with { type: 'json' }`,
  which the bundler traces).
- **Ids:** every item has a STABLE id (a Wikidata Q-id, `h-…`, `w…`, `d-…`, `m-<answer>`, `s-<word>`; a set's / a theme's / a stat's own id). A day
  set's `deal` points at items BY ID (the reserve's or the party's): truefalse `[4 fact ids]` · higherlower `["statId|itemId|itemId" × 10]` ·
  timeline `[themeId, itemId × 4]` · sortit `[setId]` · trivia `[3 question ids]` · closest `[1 id]` · missinglink `[2 ids]` · spellcheck
  `[5 ids]` (`daily.problems` accepts ints + ids; OC7's trivia MUST be three distinct ids — Overclock no longer uses the live trivia service, so a
  day set carries no question text). Pick the day's items from THE RESERVE.
- **The answers stay on the server:** the module's server merges party + reserve into the pools (`{ truefalse, higherlower, timeline, sortit,
  trivia, closest, missinglink, spellcheck }`) and calls `dayContent(daySet, pools)` (`js/games/overclock/daily.js`, PURE) → `{ show, key }` per
  pooled challenge: `show` = what a phone may get (the statements / names / labels / cards; trivia's question + its four shuffled answers;
  closest's question + its US unit; missing link's three clues; spellcheck's four spellings — no truth, no hidden value, no side, no order, no
  answer index), `key` = the answers it keeps to judge each item as it CLOSES (`publicOf` / `answersOf` per type: trivia the right index ·
  closest `{ answer, unit }` in US units · missing link `{ answer, alt, joins }` · spellcheck `{ ans, word, hard }`). The phone renders from
  `show`; the module answers each tap. (Overclock's challenge screens judge locally today — taking their verdict from the module's answer per
  item is the module's pass, with this split ready for it.)
- **The repo is public until the launch:** the reserve sits in the repo (GitHub shows it) — the SITE never serves it. Before the dailies go on,
  either the repo goes private (the owner's plan) or the module keeps the reserve in its own storage.

## A new game — the checklist (on top of CLAUDE.md's "Adding a game")
1. Rules first (pure logic + director + whole-match simulations), then the view on the match kit.
2. index.js exports every REQUIRED piece; `start()` times its first phase from `now`.
3. `chatLocked` (if it has active play), `BANNER_NAME` (if its GAMES name is long), `preload` (if it has pools / sounds), `CHAT_CHIPS`
   (optional), `daily` (OFF) if it has one.
4. Its tube mark in marks.js, its GAMES row (`playable: false` until it's ready — the one switch).
5. `node --test tests/cartridge.test.mjs` (a returning hidden game leaves `EXEMPT` there in the pass that makes it playable) + the harbor's
   `cartridge` group (`checkCartridge` on the real module in a page).
6. Never name it in the console: if the console needs to know something about it, that's a new OPTIONAL export here — documented, checked.

## A game BEING BUILT (HE3 — HOLD'EM)
A cartridge between its first screen and its go-live: a `config.js` GAMES row with `playable: false` + `preview: true` and NO `sign` — never offered
(the lobby's picker, the signs, HOW TO PLAY's tabs, THE BOARD all skip it), and `host.js#startGame` refuses it everywhere EXCEPT a LOCAL emulator page
that asks (`localhost` / `127.0.0.1` + `?emu` + `&preview=1`, or the E2E's `window.__nsPreview` — `config.js#isPlayable`) — and (HE8 — THE OWNER'S
LIVE TEST) the owner's own phone (`config.js#setOwnerPhone`, from the radio gate's server-checked `owner` yes; the server's start checks again): the smoke
test still proves it can't start on a plain one. (HOLD'EM went playable in HE10 — the first game through this whole road.) It meets the WHOLE contract like a playable game (`tests/cartridge.test.mjs#BUILDING`, the harbor `cartridge` group);
the tests that walk every GAMES row for the city / THE BOARD / the reports skip it until the pass that makes it playable gives it those.
A server-dealt game (HOLD'EM): `start` asks the server and returns only the console's frame (`id`, `matchId`, `settings`, `participants`, `phase`); its
`step` moves to `final` only once the server's own result is in, so the podium's usual report finds `results/{CODE}_{matchId}` already counted. HE10: such
a game is listed in `api/report.js#DEALER_GAMES` — the shared report path never credits it (only the dealer's record does).

## The exempt list
The ten HIDDEN games (WINDOWS, Nov 1 — cipher, signal, bluff, pulse, golf, agent, slip, gridlock, stakes, rum) are EXEMPT
(`tests/cartridge.test.mjs#EXEMPT`): frozen as they are. They already meet the REQUIRED contract (the harbor group counts 0 gaps each);
their chat locks still live in `chat/logic.js`'s switch — each moves into its cartridge when the game comes back.

## THE GAME's SIGN AT THE START (LOBBY FIXES, Nov 4)
The console lights the GAME's OWN sign over the speakeasy door at every start — built from what a game already has: its `GAMES` entry in
`js/config.js` (the name + the mark — `ui/game-art.js` / `ui/tube-logo.js#markFor`) drawn by `tube-logo.js#gameLogoSvg(g, { tint: NEON_PINK })`.
Nothing new to export. `start({ now })` still = the moment the match begins: the tap + 5 s (the FULL start) or + 3 s (a same-game REMATCH —
the console calls `startGame(id, settings, { quick: true })`); a game never times itself from the tap.

## THE CONTRACT (SHELL 2.0 B1, Nov 5 — agreed with the Overclock chat: review-6.md D1 D2 D3 D8 D9 D12)
The rules every cartridge keeps. The Overclock chat reads this page before each OVERCLOCK pass; THE PASSWORD and COAST CLEAR plug in the same way.

**D1 — THE THIN META + LAZY LOGIC.** A cartridge is TWO files the console sees:
- `js/games/<id>/meta.js`: what the console reads BEFORE a match. It's PURE and tiny, with NO imports (the test fails on one): `DEFAULT_SETTINGS`,
  `OPTIONS`, `estimateMinutes`, `MUSIC` / `FINAL_MUSIC`, `MIN_PLAYERS` / `SOLO`, `BANNER_NAME`, `CHAT_CHIPS`, `chatLocked`, `NO_INTERCOM`,
  `LOOKS` (OC1) (`cartridge.js#META_KEYS`; a daily's `daily: { on }` is NOT in META_KEYS — dailies live in `config.js#DAILIES`). `games/registry.js` imports ONLY the metas at boot (`META`, `metaOf(id)`).
- `js/games/<id>/index.js` = THE CARTRIDGE: `export * from './meta.js'` plus `start`, `prepare`, `step`, `livePaths`, `finalRanks`, `finalScene`,
  `sealed`, `rematchSettings`, `daily.create`, `feats`, `createView`. It loads ON DEMAND (`registry.js#loadGame(id)`): the host's tap
  awaits it, every phone loads it during the walk inside (`room-city.js`, with the view's warm + the preload), and a refresh mid-match
  waits for it (`app.js` shows the walk inside or the boot screen, then the game; `room.js` watches its live paths once it lands).
- logic.js / index.js take the meta's values FROM meta.js: one source (the test compares them).
- PROOF: the title's static graph `node scripts/boot-bytes.mjs` went from 2,067 KB / 160 modules (297 KB of js/games) to 1,770 KB / 109 modules (Nov 11, FR7-A: 1,906 KB / 117 modules — re-measure with the same script)
  (25 KB: the two metas + the console's own game files). `tests/cartridge.test.mjs` fails on any game's logic in the boot graph.
  (`core/match-report.js` was never in the PHONE's boot graph: only `/api/report` + the stats import it, server-side.)

**THE PRELOAD BUDGET.** `preload({ settings, host })` runs on EVERY phone during the start's ~5 s (the lit sign + the walk inside; 3 s for a
same-game rematch). Keep it to ≤ ~1.5 MB (`cartridge.js#PRELOAD_BUDGET`): its sounds, its fonts, its FIRST content pool. The rest loads lazily.
The start never waits past its 5 s for a preload: the game shows when its own pieces are ready (its view says so itself, never the console).

**D12 — THE RULES.**
- Only `start` may be ASYNC. `step` is PURE + DETERMINISTIC (seeded RNG `core/rng.js` + the `now` it's given = serverNow). NEVER `Math.random()` /
  `Date.now()` in a step (host migration replays the same step: the same patch).
- `prepare` runs on the HOST only (every tick, idempotent); `preload` runs on EVERY phone (the budget above).
- A view never imports the city. The console PAUSES the city during a match (THE CITY PAUSE — the canvases freed); a game never knows about it.
- `finalRanks` of a 1-player match returns ONE row (the solo lane — D3).
- A result may carry per-player FEATS the SERVER replays for unlocks (`maxStreak`, `longShotWin`, `soloScore` …; `core/match-report.js`
  reads them with bounds). A client never writes an unlock.
- `finalScene(el, game, state)` = the game's podium BODY (D8: the console owns the FRAME: BACK TO THE ROOM, the XP box, already-yours / next
  unlock, THE CARD REVEAL). BUILT by OVERCLOCK (OC2 — `js/games/overclock/victory.js`: the neon-tube winner, the 2-1-3 podium on the slim
  cards via `leaderboard()`, the award chips, SOLO's score); a game whose body says WINNER hides the frame's own `.winner` line in its css.
  PRISM DROP's (PD-1 — `js/games/prism/victory.js`): THE WINNING BOARD (the winner's last published board, frozen) + one line, then the top 3 as
  slim cards; a name opens THE PLAYER PAGE (`profile/player-page.js#openPlayer`); `ACCENT '#8fd8ff'`; the console's sting.
- THE DAILY (D2) = a SOLO ROOM fed a server-picked DAY SET (THE DAILY MODULE picks the day's challenges + item ids SERVER-SIDE once a day: a
  seed + a server secret) — passed to `daily.create({ …, daySet })` (OC5). It is NEVER computable from the date alone; `daily.on` ships `false`.

**D9 — THE KIT.** The shared match pieces live in `js/games/kit/`, class prefix **`gk-`**:
- BUILT by OVERCLOCK pass 1 (OC1, Nov 5) — a NEUTRAL BASE a game skins through `--gk-*` custom properties (css/kit.css "THE KIT PIECES";
  OVERCLOCK's OVERDRIVE skin in css/overclock.css), its pure parts tested (tests/kit-oc1.test.mjs), the look at
  `tests/integration/kit-preview.html` (neutral) + `overclock-preview.html` (skinned):
  - `numpad.js` — THE NUMBER PAD: 3×4 glass keys ≥ 54 pt (1–9, ⌫, 0 + an optional `.` or `−`), a big confirm key (its label is the game's:
    LOCK IT IN / ENTER), the answer field with a cursor. NO input element anywhere — the system keyboard never opens. `numpadReduce` is pure.
  - `keyboard.js` — THE LETTER KEYBOARD: QWERTY 10 · 9 · 7 + ⌫, then GO; keys 54 pt tall, each key's hit area its whole cell (ten across a
    phone is ~36 pt wide — no dead gaps between keys).
  - `tach.js` — THE TACH TIMER: slanted segments that fill toward the red line on the clock the game passes (`now: serverNow` — required);
    the last 3 s white-hot (an opacity layer) + `tach.edge` (the screen's edges tint); `onTick('tick' | 'urgent' | 'up')` for its sounds.
  - `slam.js` — THE TITLE SLAM + 3-2-1: the name slams in on a slanted card with a motion-blur swipe, the rules under it, then 3 · 2 · 1 · GO —
    timed INSIDE the phase it's given (a late mount = settled, the right number). OC3: an optional `demo` (an element, or `{ el, destroy }`) — the
    game's own short looping rules DEMO under the rules (OVERCLOCK's PATTERN LOCK + MISSING LINK — `overclock/demos.js`); the card's time unchanged.
  - `answer.js` — THE ANSWER frame: the question bold white, the right answer a white-hot tile + a laser underline, YOUR PICK struck through
    in red when wrong; ✓ / ≈ / ✕ shapes on `--good` / `--close` (never colour alone); a slot for a challenge's own content.
- BUILT here (SHELL 2.0 B1):
  - `kit/ready.js#readyState`, THE READY HELPER ("everyone tapped"): connected players only, a min time, a dropped player never blocks, an
    optional max time; pure, so a director calls it.
  - `kit/night.js`, THE ROOM-NIGHT PATH (below).

**THE ROOM-NIGHT PATH (the game's memory of the night).** The path is `rooms/{CODE}/meta/used/{gameId}/{key}: true`, written by the HOST
through a step's `$room` side writes (`kit/night.js#markUsed(gameId, keys)`) and read with `usedOf(meta, gameId)` — at the start through
`start({ used })` (OC1: OVERCLOCK deals its whole match there, so every phone builds the same challenges from the stored deal, and each
challenge marks its keys as it opens — `js/games/overclock/deal.js`). It SURVIVES rematches
+ new games and is GONE when the room closes. GAME-SCOPED: a game writes only under its own id (the shared trivia pool is `trivia`). The
rules already allow it (a boolean under `meta/used/$game/$id`), so no rules change was needed. Bigger night data (a score, a list) → ask the
city chat first (a new rule).

**MUSIC BY MOOD.** `MUSIC: 'mood:evening'` (any of `late · morning · day · evening · party`) plays THAT mood's RADIO STATION on the server
clock: every phone in the room gets the same song at the same place (`audio/party-music.js#stationCue`), and the menu song plays until the
decks have loaded. The console already owns the unlock-on-tap + the one mute.

**THE SOLO LANE (D3) + THE GAME LOOK.** `SOLO: true` lets ONE player start it (`minPlayersOf` → 1). A room of one plays it end to end and
it counts for the STREAK + a SMALL, CAPPED XP (docs/profiles.md "THE SOLO LANE"). THE GAME LOOK (SHELL 2.0 B2 — ☰ → Settings → AUTO / DAY /
NIGHT, per device, any match, no lock: `games/kit/look.js` + `body[data-look]`) is the console's: a game draws NO switch of its own, it
reads the look LIVE (a change mid-game re-themes the screen at once). Right / close use the shared `--good` /
`--close` tokens (COLOUR-BLIND swaps them), never colour alone (docs/match-kit.md).

### What plugs where
| the game has… | it goes in | the console does |
| --- | --- | --- |
| options, defaults, minutes, music, banner name, chat chips, the chat lock, solo / min players | `meta.js` | reads it at boot (the GAMES sheet, the options sheet, the chat, the banner) |
| the rules, the director, the live paths, the ranks, the podium body, the seal, the rematch, the daily's create, feats | `index.js` (+ logic / director) | loads it on demand (`loadGame`) |
| its screen + stylesheet | `view.js` + `css/<id>.css` via `createView = lazyView(…)` | warms it during the walk inside, mounts it after |
| sounds / fonts / the first pool | `preload()` (≤ 1.5 MB) | calls it on every phone at the start, never waits past 5 s |
| what this room has seen tonight | `$room: markUsed(id, keys)` in a step | writes it with the step (host), clears it with the room |
| "everyone tapped" | `kit/ready.js#readyState` in the director | — |
| number pad · keyboard · tach timer · 3-2-1 · the answer frame | `js/games/kit/` (`gk-`, built in OC1) + a skin of `--gk-*` | — |
| unlock numbers | the result's FEATS | the SERVER replays + awards |
| its daily | `daily = { on: false, create, resumeKey }` | THE DAILY MODULE feeds it a server-picked day set (later) |

## THE PODIUM FRAME's rules for a body (FRIENDS B, Nov 8)
- **The list from 4th (B4):** the frame's results list starts at 4th — the body (a `finalScene` or the console's own podium) already shows 1st–3rd. A
  body that shows NO podium says so with `el.dataset.podium = 'none'` (OVERCLOCK's NOBODY SCORED) → the whole list; a body that shows EVERY place
  itself says `el.dataset.podium = 'all'` (HE4 — HOLD'EM's places + THE LEDGER as slim cards) → no list at all.
- **The score is in the line under each slim card** (`ui/strip-board.js`): the game's `note` on the left ("3 KO · 2 SENT · 1 BADGES"), the score at
  the right end in the number font — never over the card.
- **The music** waits for the frame; **the sound** — `OWN_VICTORY_SOUND`; **the colour** — `ACCENT` (the table above).

## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### The doc table row

| `docs/cartridge.md` | **THE CARTRIDGE PLUG** (LOBBY 2.0 B) + **THE CONTRACT** (SHELL 2.0 B1 — the thin meta + the lazy cartridge, the preload budget, the kit, READY, the night path, mood music, the solo lane, "what plugs where"): what a game EXPORTS + what the console GIVES it (`js/games/cartridge.js` — checked by `tests/cartridge.test.mjs`): `start({ now })` = the match begins after the walk inside, its own chat lock, banner name, preload, the DAILY plug-in (ships OFF) — the console never names a game |

### THE CONTRACT (SHELL 2.0 B1)

- **THE CONTRACT (SHELL 2.0 B1 — docs/cartridge.md):** a game = `meta.js` (PURE, no imports — the console reads it at boot: options, minutes,
  music, banner, chat lock, SOLO) + its cartridge `index.js`, loaded ON DEMAND (`games/registry.js#loadGame` — never a static game import:
  `tests/cartridge.test.mjs` checks the boot graph, `node scripts/boot-bytes.mjs`); only `start` is async, `step` pure + seeded; `prepare` host-only,
  `preload` every phone ≤ 1.5 MB; the kit in `js/games/kit/` (prefix `gk-`, READY = `kit/ready.js`); the night's memory = `meta/used/{gameId}`
  (`kit/night.js`); `MUSIC: 'mood:<mood>'` = that station in sync; `SOLO: true` → THE SOLO LANE (the streak + a small capped XP, never a win);
  THE GAME LOOK = `body[data-look]` (`kit/look.js` — ☰ → Settings, per device, any match, NO lock: games read it LIVE, draw no switch of their own).

### A game's podium music

- **A game's podium music:** `FINAL_MUSIC` in its index.js (HIGH STAKES: `victory1` = victory.mp3); default the victory playlist.
