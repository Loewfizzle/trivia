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

## File layout
```
index.html               shell: background layers, #stage, connection badge
css/base.css             tokens (:root), game themes ([data-theme]), reset, background, screen transitions
css/components.css       design system: buttons, inputs, panels, chips/avatars, timer, toasts, seg control, sheet, leaderboard, fx
css/screens.css          title, setup, lobby
css/cipher.css           CIPHER BREACH
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
js/ui/components.js      avatar, playerChip, createTimer, countUp, leaderboard, burst, glitchFlash, accessGranted, segmented
js/ui/toast.js           toasts
js/screens/{title,setup,lobby}.js
js/games/registry.js     id → game module
js/games/cipher/logic.js     PURE rules: evaluateGuess (duplicates!), keyStates, scoring, results, standings, secret obfuscation
js/games/cipher/director.js  PURE state machine: createGame(), nextStep()
js/games/cipher/words.js     word-list loading (lazy, per length), validation, pickWord
js/games/cipher/view.js      player UI: board, keyboard, opponents, intro/reveal/standings/final overlays
js/games/cipher/index.js     module contract (start, prepare, nextStep, OPTIONS, estimateMinutes, createView)
data/words/answers-N.json    answer pools (N = 5,6,7) — fixed-width words concatenated in one JSON string
data/words/valid-N.json      valid-guess dictionaries
scripts/build-words.mjs      regenerates data/words from open sources (see header for URLs/licenses)
scripts/serve.mjs            zero-dep local static server (port 5173)
database.rules.json          RTDB security rules (paste into Firebase console)
tests/*.test.mjs             unit + whole-match simulation tests (node --test, no deps)
tests/integration/           security-rules tests + 3-browser end-to-end test (need emulator + deps)
```

## Data model (RTDB)
```
rooms/{CODE}/
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, settings/{gameId}: {...} }
  players/{uid}:  { name, color, avatar, joinedAt }          ← written by that player only
  presence/{uid}: { online, lastSeen }                       ← onDisconnect sets online:false
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape (CIPHER below)
  boards/{matchId}/{round}/{uid}: { g:[enc guesses], p:['01202',…], solved, done, solvedAt, at }  ← own board, only during 'play'
```
CIPHER `game`: `{ id:'cipher', matchId, rounds, lengths[], roundMs, maxGuesses, participants{uid:true},
round, rk (round as string, for rules), phase: intro|play|reveal|standings|final, phaseStartAt, phaseEndsAt,
roundStartAt, secret (XOR+base64), used{len_idx:true}, reveal (plain word, only after the round), results{round:{uid:{pts,solved,n,t,speed,eff}}} }`.
Totals are always **derived** from `results` (never stored), so replaying a transition can't double-score.

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
- **Director:** `host.js` ticks every 250 ms; if host, calls `module.nextStep(game, {now, boards, online, pickWord})`
  and writes the returned patch. A per-transition in-flight guard prevents duplicate writes.

## Design system
- Tokens in `css/base.css :root`: backgrounds `--bg-0..3`, `--text/-dim/-faint`, neon `--cyan --magenta --yellow --green --red --orange --violet`,
  per-game `--accent --accent-2 --accent-ink --accent-soft --accent-glow`, fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono` (JetBrains Mono), `--font-num` (Chakra Petch — use for all numbers; Orbitron's 0 looks like a block).
- Game identity: `body[data-theme=cipher|signal|bluff|overclock]` (set automatically while a game runs) re-maps the accent tokens.
- Components (CSS + `js/ui/components.js`): `.btn .btn-primary|.btn-ghost|.btn-text .btn-xl|.btn-sm .btn-block`,
  `.panel`, `.chip` (+ `avatar()`), `.tag-host/.tag-you/.tag-lost`, `createTimer()`, `leaderboard()`, `countUp()`,
  `segmented()`, `.modal > .sheet`, `toast(msg, 'ok'|'warn'|'err'|'info')`, `burst()`, `glitchFlash()`, `accessGranted()`.
- Element helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)` — custom properties are supported.

## Adding a game (Stage 2/3 checklist)
1. `js/games/<id>/logic.js` + `director.js` (pure, testable) → `createGame()` and `nextStep()`.
2. `js/games/<id>/view.js` with `createView() → { mount(el, state), update(state), unmount() }`.
3. `js/games/<id>/index.js` exporting the contract (see `registry.js`), register in `registry.js`.
4. Set `playable: true` in `GAMES` (`js/config.js`), add `css/<id>.css` + `<link>` in `index.html`.
5. Extend `database.rules.json` for any new player-writable paths (players must only write their own data).
6. Tests: pure logic + a match simulation like `tests/match-sim.test.mjs`; extend the E2E.

## Testing
- **Unit + simulation (no deps):** `node --test tests/*.test.mjs`
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

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish.
- Authentication → Settings → Authorized domains: add `trivia.loewfizzle.com`.
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).

## Word lists
Built by `scripts/build-words.mjs` from ENABLE (public domain), the SCOWL-derived Hunspell en_US
dictionary (filters to real, non-proper-noun base words) and Peter Norvig's word-frequency counts (MIT).
Answers: the ~1,300–1,400 most frequent qualifying words per length, minus plurals/past tenses and a
blocklist. Valid guesses: ENABLE ∩ Norvig's 333k list. Rebuild after editing the blocklist.
