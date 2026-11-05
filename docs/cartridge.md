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
| `start({ code, matchId, settings, participants, now })` | required | builds the match. **`now` is the moment the MATCH BEGINS** — the room's walk inside (2.6 s, `core/room-show.js#START_MS`) runs before it on every phone: time the first phase from `now`, never from `Date.now()` |
| `prepare(game, { code, host })` | required | every host tick (≈ 250 ms): top-ups, private host duties — idempotent |
| `step(game, { code, now, live, online })` | required | the PURE director: a patch, `{ lobby: true }` or `null` (+ `$room` side writes) |
| `livePaths(game)` | required | the player-written paths the room mirrors into `state.live` (check `liveKey` before trusting it) |
| `createView` | required | `lazyView(() => import('./view.js'), gameSheets('<id>'))` — its code + sheets load only when it's played; the console WARMS it (`createView.warm()`) on every phone during the walk inside |
| `DEFAULT_SETTINGS`, `OPTIONS`, `estimateMinutes(s)` | required | the options sheet under PLAY / GAMES (every OPTIONS key has a default) |
| `finalRanks(game)` | required | GAME NIGHT's 3 / 2 / 1 points (`night/{matchId}`) → THE WINNER's BANNER (3 points = first; a tie = everyone with 3) + THE NIGHT's CHAMPION |
| `MUSIC` or `musicFor(game)` | required (one) | its music (`null` = none — the song is the music) |
| `FINAL_MUSIC` | optional | its podium music (default the victory playlist) |
| `MIN_PLAYERS` / `SOLO` | optional | more players than the app's minimum (DOUBLE AGENT 4) / `SOLO: true` lets ONE player start it (OVERCLOCK's solo) |
| `nightBonus(game)` | optional | game-night points that aren't a placing |
| `sealed(game)` | optional | THE SEAL — the round's secrets (`kit/seal.js`, docs/data-model.md) |
| `chatLocked(game, uid, live)` | optional | true while this player is actively playing → the chat stays shut for them (the console checks "a participant" first). No export = never locked |
| `CHAT_CHIPS` | optional | ≤ 4 short quick replies of its own on the chat's chips row while it's on screen |
| `BANNER_NAME` | optional | its name on THE WINNER's BANNER PLANE (2–14 letters — it shares a 24-letter panel with a name; default its GAMES name) |
| `rematchSettings(settings, lastGame)` | optional | the settings a REMATCH starts with (default: the same) |
| `preload({ settings, host })` | optional | called on EVERY phone at the game start (the walk inside): FETCH its pools / sounds / fonts so the view is ready when the push through the door ends. Fetch, don't build — the city is still drawing |
| `daily` | optional | THE DAILY PLUG-IN — below |

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
- **The corner** (☰ menu: CHAT, HOW TO PLAY, SETTINGS, QUIT TO LOBBY, the host's END GAME — and music on / off), the chat (its own lock +
  chips through the plug), toasts, the match kit's pieces (`docs/match-kit.md`).
- **The end**: the podium (`ui/final.js#createFinal` — the game passes its rows), the results → XP, levels, the streak, cards, THE BOARD
  through `/api` (`core/match-report.js` — the server checks + replays; the game never writes a score), then BACK TO THE ROOM → the walk back
  out → THE WINNER's BANNER PLANE (from `finalRanks`) → THE REMATCH VOTE (the host's REMATCH = `rematch()`: the same game,
  `rematchSettings`, everyone in).

## THE DAILY PLUG-IN (ships OFF)
A game that offers a daily (OVERCLOCK's QUICK solo run, the WORDLE-type, COAST CLEAR) exports
`daily = { on: false, create({ date: 'YYYY-MM-DD', uid, now }) → game, resumeKey(date, uid) → string }`:
**today's date in → today's puzzle** (the same content for everyone that day, a seed from the date; never a party-only part — DUMB LUCK),
**one try**, **resume** (a refresh / an app switch resumes from `resumeKey`, never restarts). `on` stays `false` — THE DAILY MODULE (a later
pass) seeds it, unlocks it, feeds the streak, owns the daily results + percentiles and switches all three dailies on together; a game never
builds its own daily screen, rankings or streak hooks. `checkCartridge` fails a daily that switches itself on.

## A new game — the checklist (on top of CLAUDE.md's "Adding a game")
1. Rules first (pure logic + director + whole-match simulations), then the view on the match kit.
2. index.js exports every REQUIRED piece; `start()` times its first phase from `now`.
3. `chatLocked` (if it has active play), `BANNER_NAME` (if its GAMES name is long), `preload` (if it has pools / sounds), `CHAT_CHIPS`
   (optional), `daily` (OFF) if it has one.
4. Its tube mark in marks.js, its GAMES row (`playable: false` until it's ready — the one switch).
5. `node --test tests/cartridge.test.mjs` (a returning hidden game leaves `EXEMPT` there in the pass that makes it playable) + the harbor's
   `cartridge` group (`checkCartridge` on the real module in a page).
6. Never name it in the console: if the console needs to know something about it, that's a new OPTIONAL export here — documented, checked.

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
  `daily: { on }` (`cartridge.js#META_KEYS`). `games/registry.js` imports ONLY the metas at boot (`META`, `metaOf(id)`).
- `js/games/<id>/index.js` = THE CARTRIDGE: `export * from './meta.js'` plus `start`, `prepare`, `step`, `livePaths`, `finalRanks`, `finalScene`,
  `sealed`, `rematchSettings`, `daily.create`, `feats`, `createView`. It loads ON DEMAND (`registry.js#loadGame(id)`): the host's tap
  awaits it, every phone loads it during the walk inside (`room-city.js`, with the view's warm + the preload), and a refresh mid-match
  waits for it (`app.js` shows the walk inside or the boot screen, then the game; `room.js` watches its live paths once it lands).
- logic.js / index.js take the meta's values FROM meta.js: one source (the test compares them).
- PROOF: the title's static graph `node scripts/boot-bytes.mjs` went from 2,067 KB / 160 modules (297 KB of js/games) to 1,770 KB / 109 modules
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
  unlock, THE CARD REVEAL).
- THE DAILY (D2) = a SOLO ROOM fed a server-picked DAY SET (THE DAILY MODULE picks the day's challenges + item ids SERVER-SIDE once a day: a
  seed + a server secret). It is NEVER computable from the date alone; `daily.on` ships `false`.

**D9 — THE KIT.** The shared match pieces live in `js/games/kit/`, class prefix **`gk-`**:
- RESERVED for OVERCLOCK pass 1 (it builds them): `numpad.js` (the number pad), `keyboard.js` (the letter keyboard, never the system
  keyboard), `tach.js` (the tach timer on serverNow), `slam.js` (the title slam + 3-2-1), `answer.js` (THE ANSWER frame). Keys ≥ 54 pt.
- BUILT here (SHELL 2.0 B1):
  - `kit/ready.js#readyState`, THE READY HELPER ("everyone tapped"): connected players only, a min time, a dropped player never blocks, an
    optional max time; pure, so a director calls it.
  - `kit/night.js`, THE ROOM-NIGHT PATH (below).

**THE ROOM-NIGHT PATH (the game's memory of the night).** The path is `rooms/{CODE}/meta/used/{gameId}/{key}: true`, written by the HOST
through a step's `$room` side writes (`kit/night.js#markUsed(gameId, keys)`) and read with `usedOf(state.meta, gameId)`. It SURVIVES rematches
+ new games and is GONE when the room closes. GAME-SCOPED: a game writes only under its own id (the shared trivia pool is `trivia`). The
rules already allow it (a boolean under `meta/used/$game/$id`), so no rules change was needed. Bigger night data (a score, a list) → ask the
city chat first (a new rule).

**MUSIC BY MOOD.** `MUSIC: 'mood:evening'` (any of `late · morning · day · evening · party`) plays THAT mood's RADIO STATION on the server
clock: every phone in the room gets the same song at the same place (`audio/party-music.js#stationCue`), and the menu song plays until the
decks have loaded. The console already owns the unlock-on-tap + the one mute.

**THE SOLO LANE (D3) + THE LOOK SWITCH.** `SOLO: true` lets ONE player start it (`minPlayersOf` → 1). A room of one plays it end to end and
it counts for the STREAK + a SMALL, CAPPED XP (docs/profiles.md "THE SOLO LANE"). The room's AUTO / DAY / NIGHT look (`games/kit/look.js`
+ `body[data-look]`) is the console's: a game draws nothing of its own, it reads the look. Right / close use the shared `--good` /
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
| number pad · keyboard · tach timer · 3-2-1 · the answer frame | `js/games/kit/` (`gk-`), OVERCLOCK pass 1 | — |
| unlock numbers | the result's FEATS | the SERVER replays + awards |
| its daily | `daily = { on: false, create, resumeKey }` | THE DAILY MODULE feeds it a server-picked day set (later) |
