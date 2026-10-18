# NEON SPEAKEASY — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each; DOUBLE AGENT needs 4). Ten games. Static site on Vercel
(**neonspeakeasy.com**; games.loewfizzle.com and trivia.loewfizzle.com redirect there) + Firebase Realtime Database + Anonymous Auth,
plus four Vercel serverless functions in `/api` (profiles, server-verified results, THE BOARD — `docs/profiles.md`).
The app was NEURAL ARCADE, then NEON DISTRICT (both Oct 2026); the games kept their names and the title's city is still "the
district" in code (`js/screens/district/`, the `nd-` class prefix). `ROADMAP.md` lists what shipped and what is next.
**Keep this file, ROADMAP.md and the relevant `docs/*.md` updated as you work.**

This file is the short version. The deep-dives live in `docs/` — read the one you need, when you need it:

| doc | read it when you touch |
| --- | --- |
| `docs/match-kit.md` | **any real-time game** (the shared HUD pieces + the E2E harness) — read this before building or changing a game |
| `docs/data-model.md` | the database: every node, every game's `game` shape, rules |
| `docs/testing.md` | running / writing tests: emulators, smoke test, each game's E2E and its env flags, previews, Lighthouse |
| `docs/audio.md` | music, playlists, SFX, the audio engine; loading, PWA, service worker, link previews |
| `docs/title.md` | the title screen, the district scene, the logo, the menu |
| `docs/chat.md` | room chat (data, locks per game, system lines, profanity filter) |
| `docs/content.md` | adding questions / puzzles / words to any bank; rebuilding word lists |
| `docs/profiles.md` | profiles, name tags + keys, `/api`, result reporting, THE BOARD, XP ranks, emblems, `/board`, `/admin`, the Vercel setup |
| `docs/pulse.md` `docs/golf.md` `docs/prism.md` `docs/slip.md` `docs/gridlock.md` `docs/agent.md` | that game |

## Ground rules
- **No build step.** Plain HTML/CSS/ES modules. No npm deps in the shipped site (the root `package.json` only gives the `/api`
  functions firebase-admin; Vercel installs it, the browser never sees it). Firebase comes
  from `https://www.gstatic.com/firebasejs/11.10.0/…` — loaded with a *dynamic* import inside `initFirebase()`;
  `js/firebase.js` exports thin wrappers (`ref`, `get`, `set`…) that are only valid after `firebaseReady` resolves.
  Never add a static import of the SDK (it would block the first paint on ~450 KB).
- **Stability first.** Phones lock, switch apps and drop signal. Every screen must render purely
  from the mirrored DB state (`store.state`) so refresh/rejoin/host-change "just work".
- **The host is the authority, but holds no private state.** Game flow lives in a pure
  `nextStep(game, ctx)` director; any client that becomes host continues from the DB.
- **Timers use server time** (`serverNow()` = `Date.now() + .info/serverTimeOffset`). Never `Date.now()` for game timing.
- **60fps:** animate only `transform` and `opacity`. Static glows are fine; never animate box-shadow/filters on many elements.
  Never read layout (getBoundingClientRect / clientWidth) in a frame loop — sizes come from ResizeObservers. Everything respects `prefers-reduced-motion`.
- Mobile: `100dvh`, safe-area insets, inputs ≥ 16px, touch targets ≥ 44px. No zoom: `body { touch-action: pan-x pan-y }` +
  iOS `gesturestart` block (the viewport meta deliberately has no `user-scalable=no` — Lighthouse penalizes it).
- Contrast: all text ≥ 4.5:1 on its background (`--text-faint` is the dimmest allowed text color).
- The app name is `APP_NAME` in `js/config.js` (plus `<title>`/meta tags in `index.html`).
- **Audio is polish, never a dependency.** Everything must work silently: missing files, locked iOS audio, muted. SFX stay quiet — felt more than heard after 20 minutes.
- **Visual review:** every new screen gets screenshot-reviewed at 390×844 and 412×915 (plus 1440×900 for anything shown on desktop)
  with at least two refine passes, three for a new game. Look at the screenshots; the data passing is not the screen looking right.
- **Class names:** prefix new CSS classes per feature (`nd-`, `ndl-`, `pd-`, `da-`, `gl-`…). A bare `.nl-hi` once collided with
  Overclock's number line and shoved the logo's highlights sideways.
- **Presentation tech:** Canvas 2D (+ a WebGL fragment shader for a sky/world) unless 3D *is* the game. Every polish pass on a three.js
  scene costs several times a 2D one, and a tilted 3D board on a phone fights readability and tap targets (GRIDLOCK Part 1 shipped
  on three.js, failed the play-test and was rebuilt flat in Canvas 2D a week later — straight-on, labels inside the frame, one board up).
- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view with a scripted state through an import
  map that swaps `js/firebase.js` for `tests/integration/fake-firebase.js` (see gridlock-preview.html). Iterate screens there in
  seconds; run the E2E once the look is right.
- **Profiles are polish too:** joining and playing must work with `/api` down or unconfigured (no tags, no emblems, results queue).
  Clients never write boards, stats, XP or ranks (server-only in the rules); board ids use dashes (`cipher-score`), never dots.
- **PRISM DROP:** never use the words "Tetris", "tetromino" or "T-spin" anywhere (pieces/prisms, twists).

## Working efficiently (what cost the most in past sessions)
- **Edits:** use the Edit tool or a script file in the scratchpad. Never put code with backticks, `$` or `\b` inside an inline
  `node -e "…"` / heredoc — the shell mangles it and the repair costs more than the edit.
- **Tests, in order:** `node --test tests/*.test.mjs` (seconds) → the game's `FAST=1` E2E (≈ 2 min) → the full suite once before
  committing. Don't re-run a 20-minute suite to check one fix. Run E2E suites with absolute paths and from `tests/integration`.
- **A new game = rules first.** Pure `logic.js` + `director.js` with a whole-match simulation test before any pixel; then the view on the
  match kit; then one distinctive screen, reviewed at three sizes.
- Run `git status` before committing: stage the files of this task only (other work may be in the tree).

## File layout (top level; each game's files are listed in its doc)
```
index.html / sw.js / manifest.webmanifest / assets/     shell, service worker (network-first, same-origin static only, never /api), PWA, icons + og.png
board.html admin.html                                    THE BOARD for anyone (/board, og-board.jpg) and the admin page (/admin)
api/ profile.js report.js board.js admin.js + _lib/     Vercel functions (firebase-admin): profiles, verified results, boards, moderation
package.json                                             only firebase-admin for /api (npm install at the root for local /api)
css/base.css components.css screens.css title.css        tokens + themes, the design system (+ NEON GLASS), setup/lobby, the title
css/kit.css                                              the match kit's default look (announcements, cards, Call the Winner, report)
css/board.css admin.css                                  THE BOARD, the membership card, podium plaques + rank-up; the admin page
css/<game>.css  (cipher signal overclock bluff pulse golf prism gridlock slip agent) + css/chat.css
js/config.js  firebase-config.js  firebase.js            APP_NAME, limits, colors, avatars, GAMES registry / the web config / init + db helpers + serverNow()
js/identity.js store.js room.js host.js app.js wakelock.js   slots + saved session / state + subscribe / rooms, presence, listeners / host loop + director / router
js/core/  room-logic.js rng.js obfuscate.js night.js playlist.js   PURE: room codes + host election, seeded RNG, XOR+base64, game-night standings, room playlists + callBonus
          week.js ranks.js names.js pkey.js boards.js match-report.js   PURE (server + client): Eastern week keys, XP ranks, board-name filter, keys, board catalog, per-game results
js/profile/ api.js me.js queue.js public.js callouts.js  /api client, this device's profile, the results queue, room players' profiles, podium plaques + rank-up
js/board/ scene.js view.js screen.js public.js audio.js  THE BOARD: the bar (Canvas 2D), the board UI, app route, /board entry, its SFX
js/admin/admin.js                                        the /admin page
js/ui/    dom.js components.js final.js logo.js game-art.js settings-panel.js help.js toast.js emblems.js   h(), design-system components, the podium, the sign, lobby art, gear + settings, HOW TO PLAY, toasts, rank emblems
js/audio/ settings.js engine.js music.js sfx.js ambience.js synced-songs.js   prefs, AudioContext + buses, music + playlists, synth SFX, title ambience, songs on the server clock
js/trivia/                                               categories, API sources + filters, bundled bank, host feed (Last Signal / Overclock)
js/screens/ title.js setup.js lobby.js profile.js district/{scene,backdrop}.js   the front door, name/avatar, the lobby, the membership card, the city (Canvas 2D) + its still behind menus
js/chat/  logic.js chat.js ui.js                         PURE rules (locks, profanity) / data layer / lobby strip + sheet + in-game button
js/games/registry.js lazy-view.js                        id → module (the contract), ALL_PLAYER_NODES; lazy view loading
js/games/kit/                                            THE MATCH KIT: moments (announcer + cards), call, results, tiers, hook   → docs/match-kit.md
js/games/<id>/  logic.js director.js index.js view.js (+ scene/audio/…)   PURE rules / PURE state machine / contract + host duties / the screen
data/     trivia bluff oc words agent pulse prism slip    the banks and song analyses (formats in docs/content.md and each game's doc)
audio/music/*.mp3  audio/pulse/*.mp3                     music (≤ 4 MB each; bump music.js#REV when replacing a file), PULSE songs
scripts/  serve.mjs build-*.{mjs,py} validate-holes.mjs sim-gridlock.mjs   local server (:5173, `--emu` also runs /api on the emulators), builders, the NEON PAR hole bot, GRIDLOCK balance sim
database.rules.json                                      RTDB rules — paste into the Firebase console after every change
tests/*.test.mjs                                         unit + whole-match simulations (node --test, no deps)
tests/integration/  kit/harness.mjs e2e-*.mjs rules.test.mjs server.test.mjs *-preview.html   the E2E harness, per-game suites, rules tests, /api tests, no-Firebase look previews
tests/fixtures/finals.mjs                                finished matches of every game (profile/board tests)
```

## Data model (the shared core; every node and every game's `game` shape: `docs/data-model.md`)
```
rooms/{CODE}/
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, settings/{gameId}: {...} }
  players/{uid}:  { name, color, avatar, joinedAt, pid? }    ← written by that player only (pid: their own profile id only)
  presence/{uid}: { online, lastSeen }                       ← onDisconnect sets online:false
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape; totals are always DERIVED from results (never stored) so a replayed step can't double-score
  night/{matchId}:   { g, p: { uid: 3|2|1|0 }, n: { uid: name }, b?: { uid: bonus }, at }  ← host; game-night scoreboard
  <game nodes>/{matchId}/…/{uid}                              ← a player's own data for the current step, phase-gated by the rules
chats/{CODE}/   fleets/{CODE}/   glsonar/{CODE}/   spy/{CODE}/   ← top level: rooms/{CODE} is readable by any signed-in user, these are not
profiles/{pid} (public)  uids/{uid} (own)  pstats/{pid} (owner)  lb/ results/ ppriv/ pkeys/ tags/ rl/ audit/ (server only)   ← docs/profiles.md
```
Rules of thumb: a player writes only under their own uid; anything secret (fleets, agent cards) lives outside `rooms/`; the host
wipes `ALL_PLAYER_NODES` (registry.js) at match start/end; obfuscate (`core/obfuscate.js`) what must not be readable in plain sight.

## Multiplayer mechanics
- **Identity:** anonymous Firebase user per *slot*. Each slot is a separately-named Firebase app, so its
  auth persists independently. Phones are slot 1.
- **Rejoin:** `localStorage na:{slot}:session` holds the room code. On boot `resumeSession()` re-enters the
  room (re-adding the player node if it vanished). Boards/score come back from the DB.
- **Presence:** written on every `.info/connected` = true, with `onDisconnect().set({online:false,lastSeen})`.
  Offline players remain in the room as "SIGNAL LOST". The director doesn't wait for offline players.
- **Host migration (`core/room-logic.js#shouldClaimHost`):** host considered gone if its player node is gone,
  or presence offline for ≥ 10 s, or — during a game — `meta.hostBeat` (every 2 s) is ≥ 10 s stale (locked
  phones can keep sockets open while JS is frozen). Online players in join order claim with a stagger
  (+4 s per rank) via a transaction on `meta/hostId`; the rules only allow the claim under those conditions.
- **Director:** `host.js` ticks every 250 ms; if host, calls `module.prepare()` (asset/trivia top-ups, private host duties) and
  `module.step(game, {code, now, live, online})`, writing the returned patch. A per-transition in-flight guard prevents duplicate writes.
  A step may carry `$room: { 'meta/used/…': true }` side writes (stripped and written in the same atomic room update). When a step
  enters `final`, `host.js` writes `night/{matchId}` from `module.finalRanks(game)` (+ `module.nightBonus(game)` → `b`).
- **Per-game minimum:** a module may export `MIN_PLAYERS` (DOUBLE AGENT: 4). An option with `when(onlineCount)` only shows/applies when true.
- **Idle rooms close after an hour without a game** (`ROOM_IDLE_MS`); `meta/activeAt` is stamped when a game starts / returns to the
  lobby and every 10 min while one runs. The lobby warns for the last 10 min (host: KEEP OPEN). Rules let anyone delete a room idle > 1 h.
- **Rematch / late joiners:** `rematch()` (host.js) restarts the same game with `meta.settings[gameId]` and every
  connected player — late joiners (who spectate the running game) are dealt in automatically.
- **Live player data:** each module's `livePaths(game)` names the player-written paths for the current step.
  `room.js` mirrors them into `state.live` and sets `state.liveKey` only once all have loaded.
  Directors and views must check `liveKey` before trusting `live` (a refresh must never look like "no progress").
- **Privacy pattern** (GRIDLOCK, DOUBLE AGENT): secrets in a top-level node readable by the owner (+ the host when it must act);
  the owner's client does the private computation and publishes only the public result; the host falls back after a few seconds
  or at once when the owner is offline; a rules test proves another player cannot read it.

## Audio (the short version; everything else in `docs/audio.md`)
- `playMusic(id, fallback)` is driven by `app.js` from state (menu playlist on title/setup/lobby, `module.MUSIC` in a game, `'victory'` on
  the podium). Same track = no-op. `PLAYLISTS` (menu, victory, spy, gridlock…) play several tracks with crossfades; `setPlaylist(id, ids)`
  for a seeded per-room order; `duckMusic(level, s)` and `filterMusic(hz, s)` for moments. Songs on the server clock: `audio/synced-songs.js`.
- `sfx(name)` for the shared synth effects; games with their own palette ship a `createSfx()` in `audio.js` (soft, quiet, felt not heard).
- Audio must be unlocked by a gesture (iOS); the engine retries resumes on every tap and after app switches.

## Design system
- Tokens in `css/base.css :root`: backgrounds `--bg-0..3`, `--text/-dim/-faint`, neon `--cyan --magenta --yellow --green --red --orange --violet`,
  per-game `--accent --accent-2 --accent-ink --accent-soft --accent-glow`, fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono` (JetBrains Mono), `--font-num` (Chakra Petch — use for all numbers; Orbitron's 0 looks like a block).
- Game identity: `body[data-theme=<id>]` (set automatically while a game runs) re-maps the accent tokens; the lobby card takes them too.
- Components (CSS + `js/ui/components.js`): `.btn .btn-primary|.btn-ghost|.btn-text|.btn-danger .btn-xl|.btn-sm .btn-block`,
  `.panel`, `.chip` (+ `avatar()`), `.tag-host/.tag-you/.tag-lost`, `createTimer({ticks})`, `leaderboard()`, `countUp()`,
  `segmented()`, `chips()` (multi-select), `.modal > .sheet`, `toast(msg, 'ok'|'warn'|'err'|'info')`, `burst()`,
  `glitchFlash()`, `accessGranted()`, `createFinal()` (ui/final.js), `.game-head` (game header that leaves room for the gear).
- **NEON GLASS** (end of components.css): the title's language everywhere a menu appears — frosted glass, soft white edges, the accent
  as light. `body.nd-glass` restyles menus; sheets are glass on every screen. Toasts are glass pills; confirm-by-second-tap changes the
  button itself, never a toast. Review: `node tests/integration/ui-shots.mjs "<browser>" ./shots-ui`.
- **Player emblems** (`avatar(id, color, size)`): 12 shapes built like the neon sign; size with `--s`. Preview: `tests/integration/avatars-preview.html`.
- Game screens fill `.screen` with `overflow: hidden`; the fixed corner column sits top-right: gear (+10), chat (+58), music on/off (+106)
  (headers use `padding-right: 52px`); announcements stay clear of it. Element helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)`.

## Adding a game (checklist)
1. **Rules:** `js/games/<id>/logic.js` + `director.js` (pure) → `createGame()` and `nextStep(game, ctx)`; a `tests/<id>.test.mjs` with
   whole-match simulations (2 and 8 players, host-migration replay = the same step twice gives the same patch) **before any UI**.
2. **Contract:** `index.js` exporting what `registry.js` lists (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS, OPTIONS,
   estimateMinutes, finalRanks, nightBonus?, MIN_PLAYERS?) and `createView = lazyView(() => import('./view.js'))`; register it; add player
   nodes to `ALL_PLAYER_NODES`; `GAMES` in `js/config.js`; `css/<id>.css` + `<link>` in `index.html`; lobby art in `ui/game-art.js`;
   rules in `ui/help.js`; a theme in `css/base.css`; a music id or playlist in `audio/music.js`; THE BOARD: its standings + records in
   `js/core/match-report.js` (with plausibility bounds), its boards in `js/core/boards.js`, its colours in `js/board/view.js#GAME_LIGHT`.
3. **View on the match kit** (`docs/match-kit.md`): announcer, cards, Call the Winner, the report, tiers, the test hook. The view renders
   purely from `state` (`mount/update/unmount`); write only your own node; check `liveKey`.
4. **Rules file:** `database.rules.json` (own data only, phase/round-gated) + cases in `tests/integration/rules.test.mjs`. **Remind the owner
   to re-publish the rules in the Firebase console.**
5. **E2E on the harness:** `tests/integration/e2e-<id>.mjs` with a `FAST=1` path (2 players, 2 min) and the full path (8 players, host killed,
   refresh, offline player, late joiner, Call the Winner, finish, rematch, frame pacing at 4× CPU). Add it to the smoke test's game list.
6. **Screens** at 390×844, 412×915, 1440×900: three refine passes, looked at, before calling it done. Update ROADMAP.md, this file's
   counts, and write `docs/<id>.md`.

## Testing (the short version; every suite and flag: `docs/testing.md`)
- `node --test tests/*.test.mjs` — unit + whole-match simulations of all ten games, no deps, seconds (+ profiles/boards/XP: `profiles.test.mjs`).
- `/api` on the emulators: `node --test server.test.mjs` (in tests/integration); the whole profile flow: `node e2e-profiles.mjs "<browser>" ./shots-profiles`.
- Emulators (Java + Node): `cd tests/integration && npm install && npm run emulators`; rules: `node --test rules.test.mjs`;
  app: `node scripts/serve.mjs` → `http://localhost:5173/?emu` (`&slot=2`… for more players on one computer).
- Smoke test first: `node e2e-smoke.mjs "<browser path>" ./shots` (two regular phones, every game started, no stray "null").
- Per game: `node e2e-<id>.mjs "<browser path>" ./shots-<id>` (env `N=8 SHOTS=0 GPU=1 CPU=4 PERF=0/1 FAST=1`); previews without Firebase:
  `tests/integration/<id>-preview.html`.
- Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"` (targets 98–99 / 100 / 100 / 100).

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish (after every rules change).
- Profiles / THE BOARD need Vercel environment variables: `FIREBASE_SERVICE_ACCOUNT` (the service-account key JSON),
  `FIREBASE_DATABASE_URL`, `ADMIN_PIDS` (your profile id), optional `KEY_PEPPER` (set once, never change) — `docs/profiles.md`.
- Authentication → Settings → Authorized domains: `neonspeakeasy.com` (keep the old `games.` / `trivia.loewfizzle.com`, which redirect to it).
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).
