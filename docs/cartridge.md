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
