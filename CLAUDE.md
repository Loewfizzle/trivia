# NEURAL ARCADE — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each). Static site on Vercel
(trivia.loewfizzle.com) + Firebase Realtime Database + Anonymous Auth. All three build stages are complete
(see `ROADMAP.md` for what shipped and the future-ideas list). **Keep this file and ROADMAP.md updated as you work.**

## Ground rules
- **No build step.** Plain HTML/CSS/ES modules. No npm deps in the shipped site. Firebase comes
  from `https://www.gstatic.com/firebasejs/11.10.0/…` — loaded with a *dynamic* import inside `initFirebase()`;
  `js/firebase.js` exports thin wrappers (`ref`, `get`, `set`…) that are only valid after `firebaseReady` resolves.
  Never add a static import of the SDK (it would block the first paint on ~450 KB).
- **Stability first.** Phones lock, switch apps and drop signal. Every screen must render purely
  from the mirrored DB state (`store.state`) so refresh/rejoin/host-change "just work".
- **The host is the authority, but holds no private state.** Game flow lives in a pure
  `nextStep(game, ctx)` director; any client that becomes host continues from the DB.
- **Timers use server time** (`serverNow()` = `Date.now() + .info/serverTimeOffset`). Never `Date.now()` for game timing.
- **60fps:** animate only `transform` and `opacity`. Static glows are fine; never animate box-shadow/filters on many elements. Everything respects `prefers-reduced-motion`.
- Mobile: `100dvh`, safe-area insets, inputs ≥ 16px, touch targets ≥ 44px. No zoom: `body { touch-action: pan-x pan-y }` +
  iOS `gesturestart` block (the viewport meta deliberately has no `user-scalable=no` — Lighthouse penalizes it).
- Contrast: all text ≥ 4.5:1 on its background (`--text-faint` is the dimmest allowed text color).
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
css/bluff.css            NEURAL BLUFF (dossiers, stamps, redaction bars, reveal exhibits)
manifest.webmanifest     PWA manifest (standalone, portrait, icons)
sw.js                    network-first service worker for same-origin static files only (never Firebase/CDNs/audio)
assets/                  icon set (icon-192/512, maskable, apple-touch, favicon), og.png 1200×630 link preview
firebase.json            emulator config for local testing (repo root so it can reference database.rules.json)
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
js/ui/help.js            HOW TO PLAY sheet: rules for all four games (tabs). Opened from title, lobby cards (?), options sheet, gear menu
js/ui/toast.js           toasts
js/audio/settings.js     device-wide prefs { music: .35, sfx: .7, muted, haptics } in localStorage (try/catch)
js/audio/engine.js       AudioContext, music/sfx buses -> limiter, unlock on first gesture, suspend when hidden
js/audio/music.js        playMusic(id, fallback), prefetch(id), musicDebug(); voice pool, crossfades, loop crossfade
js/audio/sfx.js          sfx(name, opts): synthesized effects (see SOUNDS for names)
js/core/rng.js           PURE seeded RNG (mulberry32), hashString, shuffle, pick
js/core/obfuscate.js     PURE unicode-safe XOR+base64 for data that must not be readable in plain sight
js/core/night.js         PURE game-night standings from rooms/{code}/night
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
js/games/overclock/challenges.js                   seeded generators for the 10 challenge types + INFO (names/rules)
js/games/overclock/{logic,director,view,index}.js  OVERCLOCK (logic.js: order, scoring, standings)
js/games/bluff/{logic,director,bank,view,index}.js  NEURAL BLUFF (logic.js: tooClose, buildOptions, scoreRound, revealScript)
data/trivia/fallback.json    333 hand-written medium/hard questions: [category, difficulty, q, correct, w1, w2, w3]
data/bluff/questions.json    356 strange-but-true questions: [category, "text with ____", answer, [variants], [3 house lies]]
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
  lies/{matchId}/{round}/{uid}:   { t ≤ 40 chars, at }          ← BLUFF, own, during 'write' (editable)
  votes/{matchId}/{round}/{uid}:  { k: optionKey, like?, at }   ← BLUFF, own, during 'vote' (changeable)
  night/{matchId}:   { g: gameId, p: { uid: 3|2|1|0 }, n: { uid: name }, at }  ← host; game-night scoreboard
  meta/used/bluff/{questionId}: true                            ← host; Bluff questions already used in this room
  meta/used/trivia/{qHash}: true                                ← host; trivia questions any match in this room has banked
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
Score = round(100·ok/parts) + (perfect ? up to 60 speed bonus); ×2 on the final challenge. `ok` may be fractional
(Quick Count: off by one = 0.5; Signal Lock: per-round reaction credit 0.1–1, scored as round(160·ok/parts) with no
separate speed bonus). Order: Trivia Lightning keeps 1 slot in 6, the other 9 types share the rest evenly (`orderBase`).
Types: unscramble, memory, oddone, math, pattern, trivia, stroop (Color Clash), reflex (Signal Lock), count (Quick Count),
truefalse (True or False — `TF_FACTS` pairs must stay unambiguous; math statements are verified by a unit test).
Signal Lock times taps from the pointerdown event against the frame the flash painted (performance.now clock, local only).

BLUFF `game`: `{ id:'bluff', matchId, settings{mode}, rounds, participants, round, rk, phase: intro|write|vote|reveal|standings|final,
phaseStartAt, phaseEndsAt, qx (enc {id,q,a,v,cat}), hx (enc house lies), used{id}, options[{k,t}] (vote phase, no authorship),
ox (enc full options with authors/truth), reveal{steps,unpicked} (plain, from the reveal on), results{round:{uid:{pts,truth,fooled,likes,picked}}} }`.
Option keys are `optionKey(text)` = hash of the normalized text, so identical lies merge and a client can recognize its
own lie without authorship being public. The reveal is time-driven: `revealStepAt(script, serverNow - phaseStartAt)`.
Scoring: truth 1000, each victim of your lie 500 (every merged author), each like 100; final round ×3.
Voting ends early once everyone has voted, but only `VOTE_SETTLE_MS` (4 s) after the latest vote: a ♥ is a second tap, and
closing instantly used to drop the last voter's like.
**No formatting tells:** every option (truth, lies, house lies) is shown through `logic.js#displayText` — ALL CAPS, no
leading a/an/the, no trailing punctuation or quotes, number words as digits — so nobody can spot the truth by its casing
or grammar (a reported exploit). Never render raw option/answer text; `tests/bluff.test.mjs` checks the whole bank.

**Trivia bank:** questions are appended to `game/bank/{i}` (obfuscated with key `code:matchId:q{i}`). Signal question
`q` = `bank[q]`; Overclock lightning challenge `ci` uses `bank[tq[ci]]..+2`. The host keeps it topped up (Open Trivia DB
batches of 20, ≥ 5.2 s apart, session token in `game.trivia.token`); if the API is slow the director waits ~2.5 s, then
appends from the fallback bank synchronously.
**No repeats across a night:** every question a match banks is also recorded in `meta/used/trivia/{qHash}` (the opening bank
via the start `$room`, top-ups in the same room update, director fallbacks via the step's `$room`), and every source skips
those hashes — so rematches and Last Signal ↔ Overclock never deal the same question twice in one room. The opening batch
starts at a random category/difficulty. Only if the bundled bank is exhausted does a match allow room repeats (never stall).
Check with `tests/integration/trivia-rematch.mjs` (six back-to-back matches against the live APIs).

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
- **Room-level side writes:** a director step may carry `$room: { 'meta/used/bluff/ID': true }`; `host.js` strips it and
  writes it in the same atomic room update. When a step enters `final`, `host.js` also writes `night/{matchId}` from
  `module.finalRanks(game)` (idempotent per match).
- **Rematch / late joiners:** `rematch()` (host.js) restarts the same game with `meta.settings[gameId]` and every
  connected player — late joiners (who spectate the running game) are dealt in automatically.
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
  them play later. Loops crossfade 1.8 s into a fresh copy before the end. iOS often refuses
  resumes after an app switch or pauses the track around the system keyboard: `engine.js` retries on every
  tap/keystroke/focus/pageshow and fires `onResume`; `music.js#watchLoop` restarts a current track the OS paused
  (regression test: `tests/integration/audio-resume.mjs`). A missing file marks the track missing and
  falls back or stays silent, with no errors.
- SFX: `sfx(name, opts)`, names in `SOUNDS` (tap, key, select, lock, join, playerJoined, flip{state,i}, correct, present,
  absent, solve, invalid, tick{last}, roundEnd, shimmer, strike, hit, shieldBreak, eliminate, challenge, ocCorrect, ocWrong,
  node{i}, victory). Buttons get a soft `tap` automatically; add `data-sfx="none"` to opt out.
- `window.__arcade.musicDebug()` exposes music state (the E2E asserts crossfades with it).
- To replace music: drop an MP3 with the same name into `audio/music/` (≈128 kbps, < 4 MB).

## Loading, PWA, previews (Lighthouse mobile: 99 performance / 100 accessibility / 100 best practices / 100 SEO)
- `index.html` inlines the boot screen styles, so it paints right after the HTML. **All stylesheets are non-blocking**
  (`media=print` + onload swap); the three core sheets call `__cssDone()` and the page keeps everything except `#boot`
  hidden until `html.css-ready` — no flash of unstyled content. Per-game sheets load the same way, without gating.
- `app.js#dismissBoot` fades the boot screen once core CSS is in and fonts are loaded (≤1.5 s wait). Players **without** a
  saved session get the title screen immediately (Firebase keeps loading in the background; `setup.js` awaits
  `firebaseReady` on submit). Players resuming a room wait on the boot screen until they're reconnected.
- Music never downloads before the first tap (it can't play anyway) — see `audio/music.js#playMusic`.
- Keep hidden-but-rendered text out of the initial DOM (e.g. the connection banner starts empty) or Lighthouse picks
  it as the LCP element.
- Service worker registers only on https non-localhost. It is network-first with cache fallback, skips cross-origin,
  `/audio/` and range requests. Bump `CACHE` in `sw.js` only if you need to purge old offline copies.
- Link previews use absolute URLs to `https://trivia.loewfizzle.com/assets/og.png` — update if the domain changes.
- Re-render icons/preview after design changes: `cd tests/integration && node render-assets.mjs "<browser path>"`.

## Design system
- Tokens in `css/base.css :root`: backgrounds `--bg-0..3`, `--text/-dim/-faint`, neon `--cyan --magenta --yellow --green --red --orange --violet`,
  per-game `--accent --accent-2 --accent-ink --accent-soft --accent-glow`, fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono` (JetBrains Mono), `--font-num` (Chakra Petch — use for all numbers; Orbitron's 0 looks like a block).
- Neural Bluff reuses tokens but adds `--bone --stamp --stamp-text --verify` and `.stamp`, `.redact`, `.dossier`, `.exhibit`.
- Game identity: `body[data-theme=cipher|signal|bluff|overclock]` (set automatically while a game runs) re-maps the accent tokens.
- Components (CSS + `js/ui/components.js`): `.btn .btn-primary|.btn-ghost|.btn-text|.btn-danger .btn-xl|.btn-sm .btn-block`,
  `.panel`, `.chip` (+ `avatar()`), `.tag-host/.tag-you/.tag-lost`, `createTimer({ticks})`, `leaderboard()`, `countUp()`,
  `segmented()`, `chips()` (multi-select), `.modal > .sheet`, `toast(msg, 'ok'|'warn'|'err'|'info')`, `burst()`,
  `glitchFlash()`, `accessGranted()`, `createFinal()` (ui/final.js), `.game-head` (game header that leaves room for the gear).
- Game screens fill `.screen` with `overflow: hidden`; the fixed gear sits top-right (headers use `padding-right: 52px`).
- Element helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)` — custom properties are supported.

## Adding a game (checklist)
1. `js/games/<id>/logic.js` + `director.js` (pure, testable) → `createGame()` and `nextStep()`.
2. `js/games/<id>/view.js` with `createView() → { mount(el, state), update(state), unmount() }`; use `createFinal()` for the podium.
3. `js/games/<id>/index.js` exporting the contract in `registry.js` (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS,
   OPTIONS, estimateMinutes, createView, finalRanks); register it; add new player nodes to `ALL_PLAYER_NODES`.
4. Add it to `GAMES` (`js/config.js`) with `playable: true`, add `css/<id>.css` + `<link>` in `index.html`, a music id in `audio/music.js`.
5. Extend `database.rules.json` for new player-writable paths (own data only, phase/round-gated) + rules tests.
6. Tests: pure logic + a match simulation (see `tests/signal.test.mjs`) and an E2E like `tests/integration/e2e-stage2.mjs`.

## Testing
- **Unit + simulation (no deps):** `node --test tests/*.test.mjs` (74 tests: rules of all four games, host-migration replays,
  seeded generation, trivia parsing, both question banks)
- **Several players on one computer:** open the site in multiple tabs: `/?slot=2`, `/?slot=3`, … (slot 1 = no param).
  Each slot is a separate anonymous user + saved session; the slot sticks to the tab across refreshes.
  Opening the *same* slot in two tabs shows a warning (they'd be the same player). Separate browser profiles / incognito also work.
- **Local emulators (rules + E2E):** needs Java 11+ and Node.
  ```
  cd tests/integration && npm install
  npm run emulators        # = firebase emulators:start --only database,auth --project demo-arcade --config ../../firebase.json
  ```
  (`firebase.json` lives at the repo root — firebase-tools refuses rules files outside its project directory.)
  - Rules tests: `node --test rules.test.mjs`
  - App against emulators: `node scripts/serve.mjs` then open `http://localhost:5173/?emu` (add `&slot=2` …). `?emu` only works on localhost.
  - E2E (3 headless tabs play a full match incl. host loss + refresh + kick): `node e2e.mjs "<path to chrome/edge>" ./shots`
  - Same E2E against production (real Firebase): `E2E_BASE=https://trivia.loewfizzle.com node e2e.mjs "<browser path>" ./shots`
  - Stage 2 E2E: `node e2e-stage2.mjs "<browser path>" ./shots [signal|overclock|all]`. Covers Last Signal (targeting,
    eliminations, host killed mid-battle, audio unlock / background pause / crossfades / victory track) and Overclock (every
    challenge UI, identical challenges on all clients, refresh mid-challenge), and writes every new screen at 390×844 and 412×915.
  - Stage 3 E2E: `node e2e-8p.mjs "<browser path>" ./shots` — 8 players in 8 separate browser contexts play a full game of
    all four games, plus a late joiner, a rematch, the night scoreboard, an expired invite, the reconnect banner,
    every Neural Bluff screen at 390×844 and 412×915, and frame-pacing / long-task sampling (`shots/perf.json`).
  - The E2E harness uses `puppeteer-core` with a locally installed Chrome/Edge (no browser download).
  - Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"`
    (`scripts/serve.mjs` gzips like Vercel so the numbers are representative).

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish.
- Authentication → Settings → Authorized domains: add `trivia.loewfizzle.com`.
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).

## Music
Six tracks supplied by the owner, re-encoded with ffmpeg (`-vn -map_metadata -1 -ar 44100 -ac 2 -b:a 128k`; overclock at
120k to stay under 4 MB). The originals stay out of the repo.

## Adding content
- **Neural Bluff questions:** append rows to `data/bluff/questions.json`:
  `["category", "Something strange is called ____.", "Real Answer", ["real answer", "other accepted spellings"], ["lie 1", "lie 2", "lie 3"]]`.
  Rules: the fact must be true and surprising; the answer ≤ 4 words; variants cover common spellings; house lies must be
  believable and must not be "too close" (run `node --test tests/bluff.test.mjs` — it rejects any house lie the
  closeness check would treat as the truth). Never put "an" right before the blank (it hints that the answer starts
  with a vowel); put the article in the answer instead — it is stripped for display. Categories: brands, inventions, history, science, animals, food, geography,
  laws, words, pop, sports, misc (labels in `bluff/view.js#CAT`).
- **Fallback trivia (Last Signal / Overclock):** append `[category, "medium"|"hard", question, correct, wrong1, wrong2, wrong3]`
  to `data/trivia/fallback.json`; categories must match `js/trivia/categories.js`. `tests/trivia.test.mjs` validates it.
- **Cipher Breach / Unscramble words:** edit the blocklist or sizes in `scripts/build-words.mjs` and rebuild (below).

## Word lists
Built by `scripts/build-words.mjs` from ENABLE (public domain), the SCOWL-derived Hunspell en_US
dictionary (filters to real, non-proper-noun base words) and Peter Norvig's word-frequency counts (MIT).
Answers: the ~1,300–1,400 most frequent qualifying words per length, minus plurals/past tenses and a
blocklist. Valid guesses: ENABLE ∩ Norvig's 333k list. Rebuild after editing the blocklist.
