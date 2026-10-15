# NEURAL ARCADE — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each). Static site on Vercel
(trivia.loewfizzle.com) + Firebase Realtime Database + Anonymous Auth. See `ROADMAP.md` for
the plan and current stage. **Keep this file and ROADMAP.md updated as you work.**

## Ground rules
- **No build step.** Plain HTML/CSS/ES modules. No npm deps in the shipped site. Firebase comes
  from `https://www.gstatic.com/firebasejs/11.10.0/…` (only imported in `js/firebase.js`).
- **Stability first.** Phones lock, switch apps and drop signal. Every screen must render purely
  from the mirrored DB state (`store.state`) so refresh/rejoin/host-change "just work".
- **The host is the authority, but holds no private state.** Game flow lives in a pure
  `nextStep(game, ctx)` director; any client that becomes host continues from the DB.
- **Timers use server time** (`serverNow()` = `Date.now() + .info/serverTimeOffset`). Never `Date.now()` for game timing.
- **60fps:** animate only `transform` and `opacity`. Static glows are fine; never animate box-shadow/filters on many elements. Everything respects `prefers-reduced-motion`.
- Mobile: `100dvh`, safe-area insets, inputs ≥ 16px, touch targets ≥ 44px, no zoom (`touch-action: manipulation` + `gesturestart` block).
- The app name is `APP_NAME` in `js/config.js` (plus `<title>`/meta tags in `index.html`).
- **Audio is polish, never a dependency.** Everything must work silently: missing files, locked iOS audio, muted. SFX stay quiet — felt more than heard after 20 minutes.
- **Visual review:** every new screen gets screenshot-reviewed at 390×844 and 412×915 (see Testing → E2E) with at least two refine passes.

## File layout
```
index.html               shell: background layers, #stage, connection badge
css/base.css             tokens (:root), game themes ([data-theme]), reset, background, screen transitions
css/components.css       design system: buttons, inputs, panels, chips/avatars, timer, toasts, seg control, sheet, leaderboard, fx
css/screens.css          title, setup, lobby
css/cipher.css           CIPHER BREACH
css/signal.css           LAST SIGNAL (decay layers, hit fx, FLATLINE)
css/overclock.css        OVERCLOCK (challenge UIs, rules cards)
audio/music/*.mp3        music (menu, cipher-breach, last-signal, overclock, neural-bluff, victory), 128 kbps, ~0.3–3.5 MB each
js/config.js             APP_NAME, limits, timeouts, colors, avatars (SVG paths), GAMES registry metadata
js/firebase-config.js    the user's Firebase web config (the ONLY place it lives)
js/firebase.js           init (per identity slot), emulator mode, re-exported db helpers, serverNow()
js/identity.js           identity slots (?slot=N), saved profile/session (localStorage), URL handling, duplicate-tab warning
js/store.js              single state object + subscribe/setState (microtask-batched render)
js/room.js               create/join/resume/leave/kick, live listeners, presence (onDisconnect), stale-room cleanup
js/host.js               host loop: heartbeat, host-migration claims, running the active game's director, start game / back to lobby
js/wakelock.js           Screen Wake Lock during games
js/app.js                boot + router (state → screen key → screen module), glitch transitions
js/core/room-logic.js    PURE: room codes, host election, color picking, name sanitizing (unit-tested)
js/ui/dom.js             h() element helper, misc DOM utils
js/ui/components.js      avatar, playerChip, createTimer(ticks), countUp, leaderboard(note), burst, glitchFlash, accessGranted, segmented, chips
js/ui/final.js           shared podium + WINNER reveal + BACK TO LOBBY (host-aware), used by every game
js/ui/settings-panel.js  gear button (fixed, every screen) + settings sheet (music/sfx/mute/haptics, room + leave)
js/ui/toast.js           toasts
js/audio/settings.js     device-wide prefs { music: .35, sfx: .7, muted, haptics } in localStorage (try/catch)
js/audio/engine.js       AudioContext, music/sfx buses -> limiter, unlock on first gesture, suspend when hidden
js/audio/music.js        playMusic(id, fallback), prefetch(id), musicDebug(); voice pool, crossfades, loop crossfade
js/audio/sfx.js          sfx(name, opts): synthesized effects (see SOUNDS for names)
js/core/rng.js           PURE seeded RNG (mulberry32), hashString, shuffle, pick
js/core/obfuscate.js     PURE unicode-safe XOR+base64 for data that must not be readable in plain sight
js/trivia/categories.js  host categories <-> Open Trivia DB ids <-> The Trivia API slugs
js/trivia/sources.js     fetch + normalize (OTDB, The Trivia API), entity decoding, filters (fetch injectable)
js/trivia/bank.js        bundled fallback bank loader + picker
js/trivia/bankdata.js    PURE bank encoding: appendPatch, decodeQuestion, fallbackPatch
js/trivia/feed.js        host-only: initialBank() at start, topUp() keeps questions queued (rate-limit aware)
js/screens/{title,setup,lobby}.js
js/games/registry.js     id → game module
js/games/cipher/logic.js     PURE rules: evaluateGuess (duplicates!), keyStates, scoring, results, standings, secret obfuscation
js/games/cipher/director.js  PURE state machine: createGame(), nextStep()
js/games/cipher/words.js     word-list loading (lazy, per length), validation, pickWord
js/games/cipher/view.js      player UI: board, keyboard, opponents, intro/reveal/standings/final overlays
js/games/cipher/index.js     module contract (see registry.js)
js/games/signal/{logic,director,view,index}.js     LAST SIGNAL (logic.js: damage, targets, resolution, rankings, decay)
js/games/overclock/challenges.js                   seeded generators for the 6 challenge types + INFO (names/rules)
js/games/overclock/{logic,director,view,index}.js  OVERCLOCK (logic.js: order, scoring, standings)
data/trivia/fallback.json    333 hand-written medium/hard questions: [category, difficulty, q, correct, w1, w2, w3]
data/words/answers-N.json    answer pools (N = 5,6,7) — fixed-width words concatenated in one JSON string
data/words/valid-N.json      valid-guess dictionaries
scripts/build-words.mjs      regenerates data/words from open sources (see header for URLs/licenses)
scripts/serve.mjs            zero-dep local static server (port 5173)
database.rules.json          RTDB security rules (paste into Firebase console)
tests/*.test.mjs             unit + whole-match simulation tests (node --test, no deps)
tests/integration/           security-rules tests + browser end-to-end tests (need emulator + deps)
```

## Data model (RTDB)
```
rooms/{CODE}/
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, settings/{gameId}: {...} }
  players/{uid}:  { name, color, avatar, joinedAt }          ← written by that player only
  presence/{uid}: { online, lastSeen }                       ← onDisconnect sets online:false
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape (CIPHER below)
  boards/{matchId}/{round}/{uid}: { g:[enc guesses], p:['01202',…], solved, done, solvedAt, at }  ← CIPHER, own, only during 'play'
  answers/{matchId}/{q}/{uid}:    { c: 0-3, at: server time }   ← SIGNAL, own, once, during 'question', alive only
  targets/{matchId}/{uid}:        uid of another participant    ← SIGNAL, own
  oc/{matchId}/{ci}/{uid}:        { p, ok, n, done, at, doneAt } ← OVERCLOCK, own, during 'play', locked once done
```
All player-writable nodes are listed in `ALL_PLAYER_NODES` (registry.js) and wiped by the host on match start/end.
CIPHER `game`: `{ id:'cipher', matchId, rounds, lengths[], roundMs, maxGuesses, participants{uid:true},
round, rk (round as string, for rules), phase: intro|play|reveal|standings|final, phaseStartAt, phaseEndsAt,
roundStartAt, secret (XOR+base64), used{len_idx:true}, reveal (plain word, only after the round), results{round:{uid:{pts,solved,n,t,speed,eff}}} }`.
Totals are always **derived** from `results` (never stored), so replaying a transition can't double-score.

SIGNAL `game`: `{ id:'signal', matchId, settings{hp,cats}, participants, hp{uid}, sh{uid}, out{uid:q}, q, qk, qStartAt,
phase: intro|question|reveal|final, phaseStartAt, phaseEndsAt, log{q:{c, ev:[hit|shield|burn|out]}}, bank{i:enc}, trivia{n,token,lastFetchAt,turn,fails,cats,seen} }`.
Resolution writes **absolute** hp/sh computed from the pre-question state, so a replayed transition is harmless.
Damage: strike = round((30 − 20·elapsed/15 s) × mult), burn = round(10 × mult), mult = 1 + 0.25·floor(q/5). Cap 35 questions.

OVERCLOCK `game`: `{ id:'overclock', matchId, settings{mode}, seed, total, order[], participants, ci, ck, brief,
phase: ready|play|standings|final, phaseStartAt, phaseEndsAt, playStartAt, seen{type}, tq{ci:bankIndex}, tUsed, results{ci:{uid:{pts,ok,parts}}}, bank, trivia }`.
Every client regenerates challenge `ci` with `generate(order[ci], {seed, ci, level})`; no challenge content is stored.
Score = round(100·ok/parts) + (perfect ? up to 60 speed bonus); ×2 on the final challenge.

**Trivia bank:** questions are appended to `game/bank/{i}` (obfuscated with key `code:matchId:q{i}`). Signal question
`q` = `bank[q]`; Overclock lightning challenge `ci` uses `bank[tq[ci]]..+2`. The host keeps it topped up (Open Trivia DB
batches of 20, ≥ 5.2 s apart, session token in `game.trivia.token`); if the API is slow the director waits ~2.5 s, then
appends from the fallback bank synchronously.

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
- **Director:** `host.js` ticks every 250 ms; if host, calls `module.prepare()` (asset/trivia top-ups) and
  `module.step(game, {code, now, live, online})`, writing the returned patch. A per-transition in-flight guard prevents duplicate writes.
- **Live player data:** each module's `livePaths(game)` names the player-written paths for the current step (e.g. this
  question's answers). `room.js` mirrors them into `state.live` and sets `state.liveKey` only once all have loaded.
  Directors and views must check `liveKey` before trusting `live` (a refresh must never look like "no progress").

## Audio
- `installAudio()` (engine) + `installSettingsPanel()` run at boot. The AudioContext is created/resumed on the first
  pointer/key event (iOS requires a gesture). `navigator.audioSession.type = 'ambient'` (iOS 17+).
- Music: `app.js` render calls `playMusic(track, fallback)` for the current state (menu for title/setup/lobby,
  `module.MUSIC` in a game, `'victory'` on the final phase with the game track as fallback). Same track = no-op (never
  restarts). Tracks load lazily (`prefetch` when the host opens a game's options or a match starts). Three `<audio>`
  voices -> MediaElementSource -> per-voice gain -> music bus; they are activated inside the unlock gesture so iOS lets
  them play later. Loops crossfade 1.8 s into a fresh copy before the end. A missing file marks the track missing and
  falls back or stays silent, with no errors.
- SFX: `sfx(name, opts)`, names in `SOUNDS` (tap, key, select, lock, join, playerJoined, flip{state,i}, correct, present,
  absent, solve, invalid, tick{last}, roundEnd, shimmer, strike, hit, shieldBreak, eliminate, challenge, ocCorrect, ocWrong,
  node{i}, victory). Buttons get a soft `tap` automatically; add `data-sfx="none"` to opt out.
- `window.__arcade.musicDebug()` exposes music state (the E2E asserts crossfades with it).
- To replace music: drop an MP3 with the same name into `audio/music/` (≈128 kbps, < 4 MB).

## Design system
- Tokens in `css/base.css :root`: backgrounds `--bg-0..3`, `--text/-dim/-faint`, neon `--cyan --magenta --yellow --green --red --orange --violet`,
  per-game `--accent --accent-2 --accent-ink --accent-soft --accent-glow`, fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono` (JetBrains Mono), `--font-num` (Chakra Petch — use for all numbers; Orbitron's 0 looks like a block).
- Game identity: `body[data-theme=cipher|signal|bluff|overclock]` (set automatically while a game runs) re-maps the accent tokens.
- Components (CSS + `js/ui/components.js`): `.btn .btn-primary|.btn-ghost|.btn-text|.btn-danger .btn-xl|.btn-sm .btn-block`,
  `.panel`, `.chip` (+ `avatar()`), `.tag-host/.tag-you/.tag-lost`, `createTimer({ticks})`, `leaderboard()`, `countUp()`,
  `segmented()`, `chips()` (multi-select), `.modal > .sheet`, `toast(msg, 'ok'|'warn'|'err'|'info')`, `burst()`,
  `glitchFlash()`, `accessGranted()`, `createFinal()` (ui/final.js), `.game-head` (game header that leaves room for the gear).
- Game screens fill `.screen` with `overflow: hidden`; the fixed gear sits top-right (headers use `padding-right: 52px`).
- Element helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)` — custom properties are supported.

## Adding a game (Stage 3 checklist: NEURAL BLUFF)
1. `js/games/<id>/logic.js` + `director.js` (pure, testable) → `createGame()` and `nextStep()`.
2. `js/games/<id>/view.js` with `createView() → { mount(el, state), update(state), unmount() }`; use `createFinal()` for the podium.
3. `js/games/<id>/index.js` exporting the contract in `registry.js` (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS,
   OPTIONS, estimateMinutes, createView); register it; add new player nodes to `ALL_PLAYER_NODES`.
4. Set `playable: true` in `GAMES` (`js/config.js`), add `css/<id>.css` + `<link>` in `index.html`. Music id `bluff` already exists.
5. Extend `database.rules.json` for new player-writable paths (own data only, phase/round-gated) + rules tests.
6. Tests: pure logic + a match simulation (see `tests/signal.test.mjs`) and an E2E like `tests/integration/e2e-stage2.mjs`.

## Testing
- **Unit + simulation (no deps):** `node --test tests/*.test.mjs` (57 tests: rules of all three games, host-migration replays, seeded generation, trivia parsing, fallback bank)
- **Several players on one computer:** open the site in multiple tabs: `/?slot=2`, `/?slot=3`, … (slot 1 = no param).
  Each slot is a separate anonymous user + saved session; the slot sticks to the tab across refreshes.
  Opening the *same* slot in two tabs shows a warning (they'd be the same player). Separate browser profiles / incognito also work.
- **Local emulators (rules + E2E):** needs Java 11+ and Node.
  ```
  cd tests/integration && npm install
  npx firebase emulators:start --only database,auth --project demo-arcade   # uses ../../database.rules.json via firebase.json below
  ```
  (`tests/integration/firebase.json` configures the ports and points at the repo rules:)
  `{"database":{"rules":"../../database.rules.json"},"emulators":{"database":{"port":9000},"auth":{"port":9099},"ui":{"enabled":false},"singleProjectMode":true}}`
  - Rules tests: `node --test rules.test.mjs`
  - App against emulators: `node scripts/serve.mjs` then open `http://localhost:5173/?emu` (add `&slot=2` …). `?emu` only works on localhost.
  - E2E (3 headless tabs play a full match incl. host loss + refresh + kick): `node e2e.mjs "<path to chrome/edge>" ./shots`
  - Same E2E against production (real Firebase): `E2E_BASE=https://trivia.loewfizzle.com node e2e.mjs "<browser path>" ./shots`
  - Stage 2 E2E: `node e2e-stage2.mjs "<browser path>" ./shots [signal|overclock|all]`. Covers Last Signal (targeting,
    eliminations, host killed mid-battle, audio unlock / background pause / crossfades / victory track) and Overclock (every
    challenge UI, identical challenges on all clients, refresh mid-challenge), and writes every new screen at 390×844 and 412×915.
  - The E2E harness uses `puppeteer-core` with a locally installed Chrome/Edge (no browser download).

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish.
- Authentication → Settings → Authorized domains: add `trivia.loewfizzle.com`.
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).

## Music
Six tracks supplied by the owner, re-encoded with ffmpeg (`-vn -map_metadata -1 -ar 44100 -ac 2 -b:a 128k`; overclock at
120k to stay under 4 MB). The originals stay out of the repo.

## Word lists
Built by `scripts/build-words.mjs` from ENABLE (public domain), the SCOWL-derived Hunspell en_US
dictionary (filters to real, non-proper-noun base words) and Peter Norvig's word-frequency counts (MIT).
Answers: the ~1,300–1,400 most frequent qualifying words per length, minus plurals/past tenses and a
blocklist. Valid guesses: ENABLE ∩ Norvig's 333k list. Rebuild after editing the blocklist.
