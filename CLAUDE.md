# NEON DISTRICT — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each; DOUBLE AGENT needs 4). Static site on Vercel
(games.loewfizzle.com) + Firebase Realtime Database + Anonymous Auth. The app is NEON DISTRICT (it was NEURAL ARCADE until Oct 2026; the games kept their names). All nine build stages are complete
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
- **Visual review:** every new screen gets screenshot-reviewed at 390×844 and 412×915 (see Testing → E2E) with at least two refine passes
  (the title screen also at 1440×900).
- **Class names:** prefix new CSS classes per feature (`nd-`, `ndl-`, `pd-`, `da-`…). A bare `.nl-hi` once collided with
  Overclock's number line and shoved the logo's highlights sideways.

## File layout
```
index.html               shell: background layers, #stage, connection badge
css/base.css             tokens (:root), game themes ([data-theme]), reset, background, screen transitions
css/components.css       design system: buttons, inputs, panels, chips/avatars, timer, toasts, seg control, sheet, leaderboard, fx
css/screens.css          setup, lobby
css/title.css            NEON DISTRICT title: the sign, the gate, the showcase, the menu, the opening sequence (a core sheet: gates css-ready)
css/cipher.css           CIPHER BREACH
css/signal.css           LAST SIGNAL (decay layers, hit fx, FLATLINE)
css/overclock.css        OVERCLOCK (challenge UIs, rules cards)
css/bluff.css            NEURAL BLUFF (dossiers, stamps, redaction bars, reveal exhibits)
css/pulse.css            PULSE (HUD, song/Echo cards, countdown, results table, calibration overlay)
css/chat.css             room chat (lobby strip, chat sheet, in-game chat button)
css/golf.css             NEON PAR (HUD, zone/par cards, scorecard table, ACE cinematic, sabotage sheet, fog, ball picker)
css/prism.css            PRISM DROP (HUD, glass board frame, mini-boards, buttons layout, count/title cards, Call the Winner, results)
css/slip.css             SLIPSTREAM (progress bar, announcements, hints, biome titles, countdown, LAST RIDERS, spectate, Call the Winner, results, ride picker)
css/agent.css            DOUBLE AGENT (surveillance chrome, grain, RGB split, classified file states, dossier tiles, unmasking, case file)
manifest.webmanifest     PWA manifest (standalone, portrait, icons)
sw.js                    network-first service worker for same-origin static files only (never Firebase/CDNs/audio)
assets/                  icon set (icon-192/512, maskable, apple-touch, favicon), og.png 1200×630 link preview
firebase.json            emulator config for local testing (repo root so it can reference database.rules.json)
audio/music/*.mp3        music (menu, menu2-4, cipher-breach, last-signal, overclock, neural-bluff, victory, victory2-4, golf-rooftops/-cyber/-arcade, spy1-3, prism1-5 = PRISM DROP songs), 112–128 kbps, < 4 MB each
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
js/ui/logo.js            the NEON DISTRICT logotype (neon-tube "NEON" as SVG markup, + the tube-N monogram) and TAGLINE
js/ui/game-art.js        lobby card artwork: one SVG scene per game (ids prefixed per game); GAMES order = lobby order
js/ui/settings-panel.js  gear button (fixed, every screen) + one-tap music button beside it on menu screens (hidden in games,
                         where the HUD owns that corner) + settings sheet (music on/off, volumes, mute all, haptics, room + leave)
js/ui/help.js            HOW TO PLAY sheet: rules for every game; tabs show each game's lobby art (game-art.js#gameArtSvg). Opened from title, lobby cards (?), options sheet, gear menu
js/ui/toast.js           toasts
js/audio/settings.js     device-wide prefs { music: .35, sfx: .7, muted, musicOff, haptics } in localStorage (try/catch);
                         musicOff silences the music bus only (PULSE songs too), effects stay
js/audio/engine.js       AudioContext, music/sfx buses -> limiter, unlock on first gesture, suspend when hidden
js/audio/music.js        playMusic(id, fallback), prefetch(id), musicDebug(); voice pool, crossfades, loop crossfade;
                         PLAYLISTS (an id that plays several tracks in order, e.g. 'spy'), duckMusic(level, seconds)
js/audio/sfx.js          sfx(name, opts): synthesized effects (see SOUNDS for names; `chat` = the soft message blip)
js/core/rng.js           PURE seeded RNG (mulberry32), hashString, shuffle, pick
js/core/playlist.js      PURE room playlist (playlistAt: seeded per-cycle shuffles, no repeats), songStarts/songAt/songsUsed, callBonus (PRISM DROP + SLIPSTREAM)
js/audio/synced-songs.js songs on the server clock: decode once, schedule with ctxAtServer, crossfade, re-place after suspends (PRISM DROP + SLIPSTREAM)
js/core/obfuscate.js     PURE unicode-safe XOR+base64 for data that must not be readable in plain sight
js/core/night.js         PURE game-night standings from rooms/{code}/night
js/trivia/categories.js  host categories <-> Open Trivia DB ids <-> The Trivia API slugs
js/trivia/sources.js     fetch + normalize (OTDB, The Trivia API), entity decoding, filters (fetch injectable)
js/trivia/bank.js        bundled fallback bank loader + picker
js/trivia/bankdata.js    PURE bank encoding: appendPatch, decodeQuestion, fallbackPatch
js/trivia/feed.js        host-only: initialBank() at start, topUp() keeps questions queued (rate-limit aware)
js/screens/title.js      the front door: opening sequence, HOST, inline JOIN code boxes, REJOIN, welcome back, game showcase + previews
js/screens/district/scene.js  the title's city: Canvas 2D night skyline (4 parallax layers, power-on wave, billboards, reflections, rain)
js/audio/ambience.js     title ambience: neon hum + crackles, the city power-on swell, a low rain bed (SFX bus)
js/screens/{setup,lobby}.js  setup = name / colour / avatar (host, join, or edit = profile only)
js/chat/logic.js         PURE chat rules: chatLocked(game, uid, live) per game, maskProfanity, cleanText, typing line, unread
js/chat/chat.js          chat data layer (own store, lazy): listeners, send/outbox/retry, typing, unread, host system lines + prune + clear
js/chat/ui.js            chat UI: lobby strip, chat sheet (visualViewport keyboard, swipe), in-game chat button with lock + badge
js/games/registry.js     id → game module
js/games/lazy-view.js    lazyView(): a game's view module loads only when its match is on screen
js/games/cipher/logic.js     PURE rules: evaluateGuess (duplicates!), keyStates, scoring, results, standings, secret obfuscation
js/games/cipher/director.js  PURE state machine: createGame(), nextStep()
js/games/cipher/words.js     word-list loading (lazy, per length), validation, pickWord
js/games/cipher/view.js      player UI: board, keyboard, opponents, intro/reveal/standings/final overlays
js/games/cipher/index.js     module contract (see registry.js)
js/games/signal/{logic,director,view,index}.js     LAST SIGNAL (logic.js: damage, targets, resolution, rankings, decay)
js/games/overclock/challenges.js                   seeded generators for the 20 challenge types + INFO (names/rules) + CATEGORY (words/numbers/memory/visual/knowledge/reflex)
js/games/overclock/banks.js                        lazy loader for data/oc/*.json (only when the match order needs it)
js/games/overclock/{logic,director,index}.js       OVERCLOCK (logic.js: order, scoring, standings)
js/games/overclock/view.js                         shell: header, progress strip, rules cards, standings, podium; the progress API
                                                   (part/progress/step/finish) handed to each challenge screen as `api`
js/games/overclock/ui/<type>.js                    one challenge screen per file: `export default (spec, api) => ({ el, destroy })`;
                                                   api.chal (state), api.part/progress/step/finish, api.key = keyboard handler, api.game()
js/games/overclock/reveals.js                      reveal panels above the leaderboard (`buildReveal`, `hasReveal`)
js/games/overclock/shared.js                       formatters + fastButton (reacts on pointerdown) shared by the above
js/games/bluff/{logic,director,bank,view,index}.js  NEURAL BLUFF (logic.js: tooClose, buildOptions, scoreRound, revealScript)
js/games/pulse/logic.js      PURE: judging windows, tap/expire/resume, combo multiplier, Echo patterns + scoring, standings
js/games/pulse/director.js   PURE state machine: load -> song -> echo -> standings … final
js/games/pulse/clock.js      the timing engine (audio output clock), calibration storage, song playback, tones
js/games/pulse/songs.js      manifest / beat map / audio loading (decode once, keep only the current song)
js/games/pulse/calibrate.js  "tap along with the beat" overlay (first run + Settings -> Recalibrate)
js/games/pulse/render.js     canvas renderer: night city + 3D highway, pre-rendered sprites, auto quality tiers
js/games/pulse/{view,index}.js  HUD, input (multi-touch), song/Echo controllers, overlays; module contract
js/games/golf/physics.js     PURE 2D ball physics (120 Hz fixed step, swept collision, slopes/boosts/bumpers/portals/gaps/movers/cup)
js/games/golf/holes/*.js     one file per hole (data only) + index.js (order, ZONES, MODES); shape.js helpers
js/games/golf/logic.js       PURE: scores, standings, scorecard names, sabotage eligibility/expiry, match stats
js/games/golf/director.js    PURE state machine: play (countdown, wrap) -> card … final
js/games/golf/scene.js       three.js renderer: course meshes from hole data, balls/ghosts/trails, camera, fx, quality tiers
js/games/golf/zones.js       the three worlds (sky, lights, rooftop city + rain, cyberspace grid + data, arcade cabinet)
js/games/golf/ball.js        ball customization (localStorage) + picker sheet, power-up icons; no three.js (lobby-safe)
js/games/golf/{view,index}.js  aiming, own-ball simulation + publishing, ghost replay, HUD, cards, ACE, sabotage; contract
js/games/agent/logic.js      PURE: settings, clue rules (clueProblem), guessRight, deal (seeded), turnOrder, tallyVotes, scoreRound, standings
js/games/agent/director.js   PURE state machine: intro -> briefing -> clues -> debate -> vote -> unmask -> [last] -> scores … final
js/games/agent/index.js      contract + host secrets (spy/{code}/key seed, writes each player's card), MIN_PLAYERS 4, OPTIONS
js/games/agent/view.js       file card (press & hold), clue board, my-turn input, debate chat / TALK IT OUT, vote, unmasking, case file
js/games/prism/engine.js     PURE falling-block engine: 10×40 board, 7 shapes + standard rotation/wall kicks, seeded 7-bag
                             (pieceAt), hold, ghost, lock delay 500 ms / 15 resets, gravity curve, twists (3-corner rule),
                             scoring, attack table, countering, badges, junk, save/restore; fixed 1/120 s steps (update(ms))
js/games/prism/logic.js      PURE match rules: room playlist (playlistAt), song schedule + crossfades, battle speed/sudden death,
                             targeting, comeback delay, KO badges, Call the Winner bonus, standings
js/games/prism/director.js   PURE state machine: count -> play -> end -> final (KOs, badges, duel, results, calls, night bonus)
js/games/prism/{index,songs}.js  contract (start deals the songs + GO beat) / song JSON + beat clock
js/games/prism/audio.js      song player on the server clock (danger low-pass, duel lift, crossfades) + musical SFX synth (key/scale, 16th grid)
js/games/prism/worlds.js     WebGL world shaders (aurora, city, nebula, crystal, sunset × 3 variants) + shared post (beat, bloom, waves, danger)
js/games/prism/{board,fx,input,bot,view}.js  glass block sprites + board/minis, shards, gestures/buttons/keys, test bot, the view
data/prism/prismN.json       PRISM DROP song analysis: beats, energy, tonic + mode, lastBeat, mood, world (generated; manifest.json)
js/games/slip/course.js      PURE seeded course: spline terrain (DX 0.25 m), crests tuned to launch speeds, biomes, hazards sized by probe rides
js/games/slip/physics.js     PURE rider: 120 Hz steps, dive/launch/flight/flips/landing, hazards, gravity-flip mirroring, crash -> rewind -> respawn
js/games/slip/bot.js         PURE rollout bot (tests prove courses survivable; the E2E rides with it)
js/games/slip/{logic,director,index}.js  match rules (placement, same-moment crashes, time limit) / state machine / contract
js/games/slip/{sky,scene,ride,audio,view}.js  WebGL biome skies / Canvas 2D world + riders + trails + fx / ride looks + picker /
                             adaptive music chain + synth SFX / the view (input, local sim, ghosts, camera, HUD, spectate, calls, results)
data/slip/slipN.json         SLIPSTREAM song analysis: BPM, beats, per-beat energy, duration (generated; manifest.json)
data/agent/words.json        DOUBLE AGENT bank: { categories: [[CATEGORY, [words…]], …] } (41 × 15–18, unique, family-friendly)
data/trivia/fallback.json    333 hand-written medium/hard questions: [category, difficulty, q, correct, w1, w2, w3]
data/oc/lexicon.json         320 LEXICON sets: [9 letters, max length, "longest words", "every valid 3+ word"] (generated)
data/oc/timeline.json        190 TIMELINE sets: [title, ask, "low → high", [[item, shown value] ×4 in correct order]] (generated)
data/oc/closest.json         175 CLOSEST CALL questions: [category, question naming the unit, answer, unit] (hand-written)
data/oc/missinglink.json     283 MISSING LINK puzzles: [word, word, word, ANSWER, "OTHER|ACCEPTED" or ""] (hand-written)
data/oc/spellcheck.json      434 SPELLCHECK words: [correct (US), most common misspelling, wrong, wrong] (hand-written, dictionary-checked)
data/oc/make24.json          MAKE 24 tile sets { easy: [[tiles, solution]…] (209), hard: […] (47) } (generated, every set solvable)
data/oc/sortit.json          48 SORT IT pairs: [left label, right label, [left items], [right items]] (hand-written; 6 are computed sets)
data/oc/higherlower.json     18 HIGHER OR LOWER stats, 597 items: [stat, question, unit, 'max'|'min', [[item, value, "shown"?]…]]
data/bluff/questions.json    356 strange-but-true questions: [category, "text with ____", answer, [variants], [3 house lies]]
data/pulse/manifest.json     PULSE songs: id, title, artist, bpm, duration, note counts, trim info (generated)
data/pulse/pulseN.json       beat map: beats[], energy[] (per beat), downbeat, notes{easy,normal,hard}: [[time, lane], …] (generated)
audio/pulse/pulseN.mp3       PULSE songs: trimmed, mono 44.1 kHz 96 kbps (generated from ~/Downloads/pulseN.mp3)
data/words/answers-N.json    answer pools (N = 5,6,7) — fixed-width words concatenated in one JSON string
data/words/valid-N.json      valid-guess dictionaries
scripts/build-words.mjs      regenerates data/words from open sources (see header for URLs/licenses)
scripts/build-lexicon.mjs    regenerates data/oc/lexicon.json from ENABLE + Norvig counts (same sources as build-words)
scripts/build-make24.mjs     every 1–9 tile set solved exactly → data/oc/make24.json (easy: many whole-number routes; hard: needs ÷ or ≤ 2 routes)
scripts/build-timeline.mjs   verified fact pools → data/oc/timeline.json (fairness gaps: years ≥ 5 apart, quantities ≥ 1.3×)
scripts/serve.mjs            zero-dep local static server (port 5173)
scripts/build-boot-logo.mjs  re-inlines the unlit sign into index.html's boot screen from js/ui/logo.js (run after logo changes)
scripts/build-prism.py       PRISM DROP song pipeline: encode + beat grid + key + energy + world (see "PRISM DROP")
scripts/build-slip.py        SLIPSTREAM song pipeline: encode + BPM + beat grid + energy (see "SLIPSTREAM")
scripts/build-beatmaps.py    PULSE song pipeline: trim/encode + beat grid + notes + manifest (see "PULSE" below)
scripts/check-beatgrid.py    ground truth for the beat grid: synthetic drums at known times through the same pipeline
scripts/validate-holes.mjs   NEON PAR bot: proves every hole is finishable at/under par, measures ace odds (see NEON PAR)
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
  oc/{matchId}/{ci}/{uid}:        { p, ok, n, done, at, doneAt, w?, o?, g?, rw? } ← OVERCLOCK, own, during 'play', locked once done
                                  (w Lexicon best word, o Timeline order '2031', g Closest Call guess, rw Rewire turns for resume)
  lies/{matchId}/{round}/{uid}:   { t ≤ 40 chars, at }          ← BLUFF, own, during 'write' (editable)
  votes/{matchId}/{round}/{uid}:  { k: optionKey, like?, at }   ← BLUFF, own, during 'vote' (changeable)
  night/{matchId}:   { g: gameId, p: { uid: 3|2|1|0 }, n: { uid: name }, at }  ← host; game-night scoreboard
  meta/used/bluff/{questionId}: true                            ← host; Bluff questions already used in this room
  meta/used/trivia/{qHash}: true                                ← host; trivia questions any match in this room has banked
  pulse/{matchId}/{uid}: { k: songIndex, ready, s, c, mc, p, g, o, m, n, e, er, at }  ← PULSE, own, current song only
chats/{CODE}/                          ← top level (rooms/{CODE} is readable by any signed-in user; chat isn't)
  m/{key}:      { u, n, t ≤ 300, at } player line (own uid, server time) | { s, x ≤ 80, at } system line (host only)
  rate/{uid}:   server time of that player's last message (rules: ≥ 800 ms apart; written in the same update)
  typing/{uid}: server time while typing (onDisconnect remove; readers ignore entries > 6.5 s old)
  (read/write: members only — player node exists and not kicked. Host: system lines, prune, clear.)
rooms/{CODE}/meta/settings/chat: { filter: bool }                 ← host; "Filter language" (default off)
  golf/{matchId}/{uid}:  { h, s, x, y, st, f?, sh?, b?, pu, pk, ls, le, ri?, rt?, sab?, ball, at }  ← NEON PAR, own, current hole, 'play' only
  agclue/{matchId}/{rk}/{pass}/{uid}: { t ≤ 20 letters/hyphen, at }  ← DOUBLE AGENT, own, only on your turn (game/cur), once
  agready/{matchId}/{rk}/{uid}: { b?, d? }      ← briefing READY (b) / debate READY TO VOTE (d)
  agpin/{matchId}/{rk}/{uid}:   suspect uid      ← debate + vote, movable, not yourself
  agvote/{matchId}/{rk}/{uid}:  { s, lock?, at }  ← vote phase, changeable until locked
  agguess/{matchId}/{rk}/{uid}: { t, at }         ← last chance, only a caught agent, once
  meta/used/agent/{wordKey}: true                 ← host; DOUBLE AGENT words already dealt in this room
  meta/prism: { seed, n }                         ← host; PRISM DROP room playlist (seeded shuffle, next position)
  prism/{matchId}/{uid}: { st: play|out, at, b (board string), h, p ("t,r,x,y"), sc, ln, lv, mc, se, pd, best, tg, by?, ev?, sv }
                                                  ← PRISM DROP, own, count/play/end; out is final (by = who KO'd you)
  prismq/{matchId}/{target}/{push}: { f, n ≤ 30, g 0-9, at }   ← PRISM DROP junk attack, from yourself, battle only, once
  prismcall/{matchId}/{uid}: { w, at }            ← Call the Winner: only when out, ≤ 12 s after, a live player, once
  meta/slip: { seed, n }                          ← host; SLIPSTREAM room playlist
  slip/{matchId}/{uid}: { st: ride|rewind|out, t, x, y, a, g ±1, v, n (on ground), l (lives), i (shimmer), c (combo), rd (ride code
                          b|c + r|s|w), d, bc, fl, ln, cl, bi, rg, at (out only) }  ← SLIPSTREAM, own, ~10 Hz, count/play/end; out is final
  slipcall/{matchId}/{uid}: { w, at }             ← SLIPSTREAM Call the Winner (same rules as prismcall)
spy/{CODE}/                            ← top level, DOUBLE AGENT secrets (never inside rooms/{CODE})
  key/{matchId}: { seed }      read/write: the CURRENT host only (rules check rooms/{CODE}/meta/hostId)
  card/{uid}:    { m, rk, cat, word|null, agent }   read: that player only; write: host only
  (deleted by the host, or by anyone once the room is gone; room.js removes it with the room)
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
separate speed bonus). **Order (`logic.js#buildOrder`, seeded): no type repeats** — up to 20 challenges are all different
(Quick = 6, Standard = 12 of the 20 — `MODES` in logic.js, picked from a list in the options sheet); Marathon (24) has every type once plus 4 repeats, never back to back, repeats ≥ 8 apart.
**Category spread:** every type has a `CATEGORY` (words, numbers, memory, visual, knowledge, reflex); the order never puts two
of the same category next to each other unless impossible (`categoryClashes(order)` is 0 for every generated match — tested
over thousands of seeds). Short matches draw types on the fly so they can avoid clashes too.
Newer types: **lexicon** (6 parts; ok = 6 − (max − best length), only the longest word counts, speed bonus only at max),
**timeline** (4 parts, one per item in the right place), **closest** (1 part, credit = smooth curve: ≤ 5 % off = 1, ≥ 60 % = 0;
no speed bonus — the closest player(s) get +60 instead, decided in `computeResults` from `ok`), **rewire** (2 parts; ok = solved +
0.6·reach for the unsolved one; `genRewire` builds a solved path then scrambles, always solvable). Bank-backed types pick
`bankIndex(seed, type, occ)` from a shuffled per-match deck so a repeat in Marathon never deals the same entry. Standings
last 10 s for lexicon/timeline/closest (`standingsMs`) to fit the reveal panel. Unscramble also gets a reveal (the word,
the scrambled letters, how many cracked it) within the normal 6 s.
Update 2 types (all reveal for 10 s): **missinglink** (2 parts, 50 each; typed answer via an invisible input over letter boxes,
`linkAccepts`: case/spaces ignored, plurals + listed variants accepted; the exact answer locks in as typed; SKIP on puzzle 1;
`.oc.kb-open` + `--kb` from visualViewport keep it above the iOS keyboard), **spellcheck** (5 parts, one tap each),
**make24** (2 parts: an easy then a hard set from data/oc/make24.json; tiles merge with exact fractions `[n,d]` via `applyOp`,
UNDO/RESET, SKIP on puzzle 1; the reveal shows the stored solution), **compass** (5 rounds of 3→7 turns, generated; instructions
at 760→550 ms each so 25 turns fit in 30 s — `COMPASS_SCRIPT_MS` ≈ 22.5 s is the scripted time, and the speed bonus only counts
time past it; the reveal animates every round's turns on mini compasses), **sortit** (12 cards, 5–7 per side, card window
2.6 s → 1.2 s; swipe (pointer events, velocity or 70 px) or tap a screen half or ←/→; ok = right − ½·wrong ≥ 0, scored
round(100·min(1, ok/10)), speed bonus only for 12/12 — `ok` reaches `parts` only then), **higherlower** (10 pairs, ok = streak,
a miss ends the run with p = streak + 1; pairs only within one stat, ≥ 1.2× apart or ≥ 10 years; first 3 pairs ≥ 2× / 40 years,
from pair 7 on the closer ones). No new DB fields: everything fits `p/ok/n ≤ 12`.
Types: unscramble, memory, oddone, math, pattern, trivia, stroop (Color Clash), reflex (Signal Lock), count (Quick Count),
lexicon, timeline, closest (Closest Call), rewire, missinglink, spellcheck, make24, compass, sortit, higherlower, truefalse (True or False — `TF_FACTS` pairs must stay unambiguous; math statements are verified by a unit test).
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

**Trivia sources (medium difficulty only):** The Trivia API first (categories mixed in each batch, best curated), then
Open Trivia DB (never its sports category — club nicknames and stats even at medium), then the bundled bank (medium
rows first). Every API question passes `sources.js#tooSpecific`: no all-years / all-big-number answer sets, no dated
results ("who won the 2016…"), no sports seasons / scores / drafts / stat records. Tests hold real examples of both.
**Trivia bank:** questions are appended to `game/bank/{i}` (obfuscated with key `code:matchId:q{i}`). Signal question
`q` = `bank[q]`; Overclock lightning challenge `ci` uses `bank[tq[ci]]..+2`. The host keeps it topped up (Open Trivia DB
batches of 20, ≥ 5.2 s apart, session token in `game.trivia.token`); if the API is slow the director waits ~2.5 s, then
appends from the fallback bank synchronously.
**No repeats across a night:** every question a match banks is also recorded in `meta/used/trivia/{qHash}` (the opening bank
via the start `$room`, top-ups in the same room update, director fallbacks via the step's `$room`), and every source skips
those hashes — so rematches and Last Signal ↔ Overclock never deal the same question twice in one room. The opening batch
starts at a random category/difficulty. Only if the bundled bank is exhausted does a match allow room repeats (never stall).
Check with `tests/integration/trivia-rematch.mjs` (six back-to-back matches against the live APIs).

PULSE `game`: `{ id:'pulse', matchId, settings{song,count,diff,echo}, seed, participants, songs[{id,title,artist,bpm,duration}],
si, sk, phase: load|song|echo|standings|final, songStartAt, echoStartAt, phaseStartAt, phaseEndsAt, results{si:{uid:{s,c,mc,p,g,o,m,n,e}}} }`.
Players publish their own stats (`pulse/…`, every 500 ms + on song end / Echo rounds); the host snapshots them into
`results/{si}` at the end of the song (and `results/{si}/{uid}/e` after Echo). Totals = Σ (s + e).

NEON PAR `game`: `{ id:'golf', matchId, settings{mode,power,sabotage}, holes[holeNumbers], participants, hi, hk,
phase: play|card|final, phaseStartAt, playStartAt, phaseEndsAt, cdEndsAt, wrapAt, results{hi:{uid:{s}}} }`.
Player node `golf/{matchId}/{uid}`: `h` hole index, `s` strokes, `x,y` rest spot, `st` aim|roll|done, `f` final score (locked
by the rules; = s, or 7), `sh` the current/last shot `{x,y,a,p,t,pu}` (t = hole clock seconds), `b` the latest ~10 Hz ball
sample `{x,y,z,vx,vy,t}`, `pu` held power-up, `pk` bitmask of pickups taken this hole, `ls/le` last shot start/end (server ms),
`ri/rt` riding a moving platform, `sab {h,to,k,at}` the sabotage this player sent this hole (once), `ball {c,f,t}` their look.
Totals are derived from `results` (lowest strokes wins).

PRISM DROP `game`: `{ id:'prism', matchId, settings{mode: battle|rush}, participants, seed, songs[ids], sd[ms], pl0 (playlist
position), phase: count|play|end|final, songStartAt, playStartAt (= a downbeat of song 0), endAt (rush: the song's last beat),
n0, out{uid:{at,place,rem,by,gone}}, ko{uid}, bd{uid badges}, duelAt, winner, results{uid:{sc,ln,lv,mc,se,best,ko,bd}}, calls{uid:{w,ok,bonus}} }`.

SLIPSTREAM `game`: `{ id:'slip', matchId, settings{lives}, participants, seed (the course), songs[ids], sd[ms], pl0, phase:
count|play|end|final, songStartAt, playStartAt (GO), phaseEndsAt (play: GO + 9 min), n0, out{uid:{at,place,rem,d,gone?,time?}},
lastAt (LAST RIDERS), winner, timeUp, results{uid:{d,bc,fl,ln,cl,bi,rg}}, calls{uid:{w,ok,bonus}} }`.

DOUBLE AGENT `game`: `{ id:'agent', matchId, settings{rounds,mode,agents,clueSec,debateSec,passes}, participants, seat[] (this
round's players), names{uid}, round, v (re-deals), rk = "round-v", phase: intro|briefing|clues|debate|vote|unmask|last|scores|final,
phaseStartAt, phaseEndsAt, order[], turn, cur, pass, turnEndsAt, board{pass:{uid:clue|''}}, debateEnd, tally, accused[],
agents, caught, ballots, word, cat, stolen, guesses, burned{wordKey}, voided, lastCat, history{round:{word,cat}},
results{round:{uid:{pts,agent,escaped?,stole?,caught?,spotted?}}} }`. The secret word and the agents are never in it until
they're revealed (agents at the vote's end, word/cat at the scores): they're **derived** from the host-only seed
(`logic.js#deal(seed, round, v, seat…)`), so a new host recomputes the same deal; each player's card is written to
`spy/{code}/card/{uid}`. Totals derive from `results`.

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
- **Per-game minimum:** a module may export `MIN_PLAYERS` (DOUBLE AGENT: 4); host.js and the lobby use `max(MIN_PLAYERS, mod.MIN_PLAYERS)`.
  An option with `when(onlineCount)` (DOUBLE AGENT's 2 agents: 7+) only shows/applies when true; otherwise its default is used.
- **Game-night bonus:** a module may export `nightBonus(game)` → `{ uid: points }`; host.js stores it as `night/{m}/b`, and
  `core/night.js` adds it to the total (not a win). PRISM DROP's Call the Winner uses it.
- **Room-level side writes:** a director step may carry `$room: { 'meta/used/bluff/ID': true }`; `host.js` strips it and
  writes it in the same atomic room update. When a step enters `final`, `host.js` also writes `night/{matchId}` from
  `module.finalRanks(game)` (idempotent per match).
- **Idle rooms close after an hour without a game** (`ROOM_IDLE_MS`, `room-logic.js#idleLeft/roomIdle`). `meta/activeAt` is
  stamped when a game starts / returns to the lobby and every 10 min while one runs (host beat) — never just for sitting in
  the lobby. The lobby shows ROOM CLOSES IN n MIN for the last 10 min (host: KEEP OPEN re-stamps it). Past the hour the
  host's tick deletes the room (everyone: ROOM CLOSED — NO GAME FOR AN HOUR); non-hosts leave on their own 90 s later.
  A phone coming back later (`resumeSession` → `'idle'`) deletes the stale room, drops the session + `?room=` and shows the
  title with a message; joining an idle room by code fails like a missing one. Rules: anyone may delete a room whose
  `activeAt` is > 1 h old (`cleanupStaleRooms` uses the same cutoff). E2E: `tests/integration/e2e-idle.mjs`.
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
- To replace music: drop an MP3 with the same name into `audio/music/` (≈128 kbps, < 4 MB). Browsers cache `/audio/` for a week
  (vercel.json), so **bump that file's number in `music.js#REV`** (it adds `?v=N`) or phones keep playing the old copy.
- **Menu music** is a playlist of four tracks (`menu1..4` = files menu, menu2, menu3, menu4), shuffled fresh on every page load
  (`PLAYLISTS.menu`); it keeps its place during a game and carries on in the lobby.
- **Victory music** (every podium) is a playlist of four short fanfares (`victory1..4` = victory, victory2-4), shuffled per page
  load; `FRESH_EACH_TIME` makes each new podium start on the next one. A fallback may be a playlist (NEON PAR → menu).
- **Playlists:** `PLAYLISTS = { spy: ['spy1','spy2','spy3'], menu: shuffled }` — `playMusic('spy')` plays them in order with crossfades and
  keeps going across rounds (same id = no-op). `duckMusic(level, seconds)` lowers the music bus for a moment (DOUBLE AGENT's
  unmasking); a track change resets it.

## Loading, PWA, previews (Lighthouse mobile: 98–99 performance / 100 accessibility / 100 best practices / 100 SEO)
- `index.html` inlines the boot screen styles, so it paints right after the HTML. **All stylesheets are non-blocking**
  (`media=print` + onload swap); the three core sheets call `__cssDone()` and the page keeps everything except `#boot`
  hidden until `html.css-ready` — no flash of unstyled content. Per-game sheets load the same way, without gating.
- `app.js#dismissBoot` fades the boot screen once core CSS is in and fonts are loaded (≤0.7 s wait for new visitors, so TAP
  TO ENTER is up within ~1 s; 1.5 s when resuming a room). Players **without** a
  saved session get the title screen first and the Firebase SDK starts loading right after it paints (`setup.js` awaits
  `firebaseReady` on submit). Players resuming a room wait on the boot screen until they're reconnected.
- The boot screen is the district before the lights come on: the unlit NEON sign (inline SVG, glass tubes only, generated by
  `scripts/build-boot-logo.mjs`) + "DISTRICT" in a system font — the page's LCP element, painted with the first frame.
  It sits exactly where the title's sign sits, so the hand-off doesn't jump. title.css is the fourth core sheet.
- Game views are lazy (`games/lazy-view.js`): each `index.js` exports `createView = lazyView(() => import('./view.js'))`,
  so only directors/logic load at startup. PULSE's song list loads when the page is idle.
- Music never downloads before the first tap (it can't play anyway) — see `audio/music.js#playMusic`.
- Keep hidden-but-rendered text out of the initial DOM (e.g. the connection banner starts empty) or Lighthouse picks
  it as the LCP element.
- Service worker registers only on https non-localhost. It is network-first with cache fallback, skips cross-origin,
  `/audio/` and range requests. Bump `CACHE` in `sw.js` only if you need to purge old offline copies.
- Link previews use absolute URLs to `https://games.loewfizzle.com/assets/og.png` — update if the domain changes.
- Re-render icons/preview after design changes: `cd tests/integration && node render-assets.mjs "<browser path>"` (needs
  scripts/serve.mjs; renders `tests/integration/brand.html`: the real city + logo). `assets/icon.svg` is the tube N on night blue.

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
- **Player emblems** (`components.js#avatar(id, color, size)`): each of the 12 avatars has its own silhouette that matches its
  icon (shield, almond, diamond, hexagon, ghost arch, pentagon, octagon, circle, rounded square, down-point, notched ticket,
  capsule) so players differ by shape as well as colour. Built like the neon sign: dark glass lit from inside, a tube rim
  (glow, colour, white core), a sheen, the icon as a tube; below 34 px the inner ring is dropped. Static SVG, no filters.
  Size them with `--s` (or the size argument), never by sizing the inner svg. Preview: `tests/integration/avatars-preview.html`.

## Adding a game (checklist)
1. `js/games/<id>/logic.js` + `director.js` (pure, testable) → `createGame()` and `nextStep()`.
2. `js/games/<id>/view.js` with `createView() → { mount(el, state), update(state), unmount() }`; use `createFinal()` for the podium.
   Export it lazily from `index.js`: `export const createView = lazyView(() => import('./view.js'));`
3. `js/games/<id>/index.js` exporting the contract in `registry.js` (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS,
   OPTIONS, estimateMinutes, createView, finalRanks); register it; add new player nodes to `ALL_PLAYER_NODES`.
4. Add it to `GAMES` (`js/config.js`) with `playable: true`, add `css/<id>.css` + `<link>` in `index.html`, a music id in `audio/music.js`.
5. Extend `database.rules.json` for new player-writable paths (own data only, phase/round-gated) + rules tests.
6. Tests: pure logic + a match simulation (see `tests/signal.test.mjs`) and an E2E like `tests/integration/e2e-stage2.mjs`.

## Testing
- **Unit + simulation (no deps):** `node --test tests/*.test.mjs` (200 tests: rules of all nine games (SLIPSTREAM: slip + slip-course, incl. bot rides proving courses survivable) (DOUBLE AGENT: tests/agent.test.mjs; PRISM DROP: prism-engine + prism) incl. Overclock's 20 types (the six update-2 types + banks + order spread in tests/overclock-2.test.mjs) (Lexicon sets, Rewire solvability, no-repeat order) incl. NEON PAR physics + director, chat locks + profanity filter (banks checked too), host-migration replays,
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
  - **Smoke test first (~2 min):** `node e2e-smoke.mjs "<browser path>" ./shots` — two REGULAR phone tabs (no `?slot=`; every
    other suite uses test slots, which once hid a lobby bug that printed "null" only on a real phone): create/join, lobby, HOW TO
    PLAY, all six games started and watched, back to the lobby. Fails on visible "null"/"undefined"/"NaN"/"[object Object]",
    page errors or console errors. Native `append()`/`replaceChildren()` print a `null` argument as text — `h()` skips it.
  - E2E (3 headless tabs play a full match incl. host loss + refresh + kick): `node e2e.mjs "<path to chrome/edge>" ./shots`
  - Same E2E against production (real Firebase): `E2E_BASE=https://games.loewfizzle.com node e2e.mjs "<browser path>" ./shots`
  - Stage 2 E2E: `node e2e-stage2.mjs "<browser path>" ./shots [signal|overclock|all]` (env `OC_FIRST=memory,stroop,…` puts
    those Overclock types first — its bots play all 20). Covers Last Signal (targeting,
    eliminations, host killed mid-battle, audio unlock / background pause / crossfades / victory track) and Overclock (every
    challenge UI, identical challenges on all clients, refresh mid-challenge), and writes every new screen at 390×844 and 412×915.
  - PULSE E2E: `node e2e-pulse.mjs "<browser path>" ./shots` (env `N=8 COUNT=2 SONG=pulse3 DIFF=hard ECHO=on`) — calibration
    (bot taps 40 ms late → ~+55 ms), synced start, bots with different timing (judgment checks), chords, refresh mid-song,
    backgrounding, quality-tier fallback under 12× CPU, 4× CPU frame pacing (`PROFILE=1` prints a CPU profile), Echo, podium.
  - NEON PAR E2E: `node e2e-golf.mjs "<browser path>" ./shots` (env `N=8 MODE=full|quick6|quick3 HOLES=n SHOTS=0`) —
    lobby ball picker, intro cards, a real slingshot drag + cancel, bots that aim with the physics engine, ACE on every
    phone, ghost smoothness (60 Hz probe), refresh mid-roll (exact replay), host killed mid-hole + rejoin, power-ups,
    sabotage, the 30 s countdown, scorecards, final, rematch, renderer memory per hole, 4× CPU frame pacing.
    Validation bot: `node scripts/validate-holes.mjs` (all holes, ~3 min) / `QUICK=1` (coarse).
    `GPU=1` uses the real GPU (frame pacing; default is software WebGL). Scene-only preview (no Firebase):
    `tests/integration/golf-preview.html?hole=6&tier=2&ghosts=7&at=tee&fly=1`; render profile of every hole at 4x CPU and
    phone pixel density: `node golf-profile.mjs "<browser path>" [tier]` (measured: 60 fps on all nine at the high tier).
  - Chat E2E: `node e2e-chat.mjs "<browser path>" ./shots` (env `N=8`, `GPU=0` for software WebGL) — 8 players: real-UI
    sends, grouping, typing indicators, unread + sound, profanity toggle, throttle hint, rules-rejected send → retry,
    offline send, fake-keyboard layout, kick (access lost), late joiner + refresh history, system lines, lock/unlock in
    all six games (badge counts, no sound/toast), golf frame pacing while the room chats, host clear (40 checks).
  - Overclock update 2: `node e2e-oc-2.mjs "<browser path>" ./shots` (N=8) — Missing Link typed (wrong guess shakes, plural, keyboard
    layout), Spellcheck, Make 24 (merges, UNDO, refresh between puzzles), Compass, Sort It with real touch swipes + side taps (host
    killed mid-challenge), Higher or Lower; identical puzzles everywhere, every player's points vs the scoring rule, all screens at both sizes.
  - PRISM DROP E2E: `node e2e-prism.mjs "<browser path>" ./shots-prism` (env N=8, RUSH=0, CPU=4; `PERF_ONLY=1 GPU=1 N=2`
    = frame pacing only) — 8 players: same song/world/7-bag on every phone, real CDP touch gestures (drag 3 cells, taps,
    soft drop, flick, swipe up, sideways swipes never hard-drop), bots battle, junk attacks, targeting, notes in key + clears
    on the 16th grid, refresh mid-battle, song change mid-match (world + crossfade), host killed, 30 s offline = out, Call
    the Winner, KO credit + badges, FINAL DUEL + music lift, game-night bonus, Score Rush (next playlist song, reboot,
    finale on the last beat, results), refresh after a KO, no stray "null" (41 checks). Scene preview without Firebase:
    `tests/integration/prism-preview.html?world=city&v=2&tier=1&bot=1&fx=1&danger=0.5`; worlds + per-tier timings:
    `node prism-shots.mjs "<browser>" ./shots-prism [cpu]` (measured with GPU=1 at 4× CPU: 16.7 ms median at all tiers).
  - SLIPSTREAM E2E: `node e2e-slip.mjs "<browser path>" ./shots-slip` (env N=8, SHOTS=0, GPU=1; frame pacing on its own:
    `PERF_ONLY=1 GPU=1 N=2` at CPU=4 — measured 16.7 ms median / 17 ms p95 at every tier, 4–5 ms of work a frame) — lobby card/options/ride picker, the same course on every phone, real touch (hold keeps you down, a tap
    in the air flips), bots ride, ghosts + their looks, equal look-ahead portrait/landscape + rotating mid-ride, every biome's
    audio treatment, refresh mid-ride, crash -> rewind -> respawn, eliminations + announcements, Call the Winner, ghost
    smoothness while spectating, host killed, LAST RIDERS, winner, results, rematch (playlist moves on, new course).
    Look review without Firebase: `slip-preview.html?biome=storm&ghosts=5&tier=2` (+ `flip=1`, `ride=cycle`, `trail=wall`) and
    `node slip-shots.mjs "<browser>" ./shots-slip [seed] [only=dunes,flip] [sizes=0,2]` (every biome at every size; PERF=1 prints tier timings).
    Perf lesson: never read layout (getBoundingClientRect / clientWidth) in the frame loop — the HUD changes every frame, so it
    forces a full layout (that alone cost ~10 ms a frame at 4× CPU); sizes come from ResizeObservers. Screens at 390×844, 412×915, 844×390, 915×412, 1440×900.
  - DOUBLE AGENT E2E: `node e2e-agent.mjs "<browser path>" ./shots-agent` — 8 players: REMOTE match (card privacy per
    player, deal, reveal styles, refresh mid-clues, keyboard layout, blocked clue, timeout + offline skips, pins, debate
    chat, host killed mid-debate, tie = escape, agent leaves → void + re-deal, last-chance steal, final, game night) and a
    SAME ROOM match with 2 agents (agent vs innocent card measured identical: size, colour, luma, animation, sound, haptic).
  - Overclock new challenges: `node e2e-oc-new.mjs "<browser path>" ./shots` (N=8) — Lexicon/Timeline/Closest Call/Rewire played
    through the UI, identical puzzles on every phone, scoring vs the host's results, host killed mid-Timeline, refresh
    mid-Rewire, every new screen + reveal at 390×844 and 412×915.
  - Stage 3 E2E: `node e2e-8p.mjs "<browser path>" ./shots` — 8 players in 8 separate browser contexts play a full game of
    all four games, plus a late joiner, a rematch, the night scoreboard, an expired invite, the reconnect banner,
    every Neural Bluff screen at 390×844 and 412×915, and frame-pacing / long-task sampling (`shots/perf.json`).
  - The E2E harness uses `puppeteer-core` with a locally installed Chrome/Edge (no browser download).
  - Title screen E2E: `node e2e-title.mjs "<browser path>" ./shots-title` (env `GPU=1` for real frame pacing, `SHOTS=0 VIDEO=0`) —
    first visit (gate → full power-on, audio unlocked by the tap, timing measured in the page), returning visit (short),
    same-session (instant), skip, reduced effects, HOST with a saved profile, JOIN by typing / paste / ?room= (with and
    without a profile), invalid code, I/O note, REJOIN, EDIT, showcase previews + HOW TO PLAY, tiers at 4× CPU, memory
    across title↔setup cycles, hidden-tab pause; screenshots at 390×844 / 412×915 / 1440×900 and MP4s of the first and
    returning intro (CDP screencast + ffmpeg from the PULSE venv). `title-shots.mjs` = quick sequence stills + the bare boot screen.
    The E2E suites open `?emu` pages, where the title skips its intro (add `&intro=1` to see it).
  - Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"`
    (`scripts/serve.mjs` gzips like Vercel so the numbers are representative).

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish.
- Authentication → Settings → Authorized domains: `games.loewfizzle.com` (plus the old `trivia.loewfizzle.com`, which now redirects to it).
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).

## Music
NEON PAR's three zone tracks (`golf-rooftops`, `golf-cyber`, `golf-arcade`), DOUBLE AGENT's `spy1-3` and PRISM DROP's `prism1-5` are the owner's, re-encoded at 112 kbps stereo.
Six tracks supplied by the owner, re-encoded with ffmpeg (`-vn -map_metadata -1 -ar 44100 -ac 2 -b:a 128k`; overclock at
120k to stay under 4 MB). The originals stay out of the repo.

## PULSE (rhythm game)
**Timing engine (`clock.js`) — never use Date/setTimeout for game timing.** `heard(perfMs)` maps a performance-clock
time to the AudioContext time *being heard* (`getOutputTimestamp`, median-smoothed; falls back to currentTime −
outputLatency). Song position heard = `heard(perf) − origin`, where `origin` = ctx time of song position 0 =
`ctxAtServer(songStartAt)`. Judged/drawn time subtracts the device calibration. Taps use the pointer event's own
`timeStamp`. Scheduled sound (song start, countdown ticks, Echo tones) is **never** calibration-shifted — only what the
player perceives (visuals, taps) is.
- Sync: the host ends `load` when every online participant reports `ready` (song decoded + sound unlocked + calibrated
  or skipped) or after 30 s, then sets `songStartAt = now + 5 s` (server time). Each phone schedules its own AudioBuffer
  so position 0 is heard at that server instant (`playSong`). Late / refreshed / back-from-background phones start
  mid-song at the right offset; `resume()` restores published stats and counts unaccounted earlier notes as misses.
- Judging (`logic.js`): PERFECT ±45 ms, GREAT ±90, GOOD ±135, else MISS (`expire`). A tap with no note of that lane
  within 250 ms is a stray (−10, combo kept); a near-miss just outside GOOD is forgiven. Points 100/70/40 × multiplier
  (×1 +1 per 10 combo, max ×4). Chords = two notes at one time; each lane is judged independently (multi-touch).
- Calibration (`calibrate.js`): 100 BPM clicks, 4 count-in + 10 taps, median of (tap heard − click heard); MAD > 70 ms
  = retry. Stored in `localStorage['na:pulse:calib']` with the output latency at the time; a different latency or a
  `devicechange` event suggests recalibrating. The highway pauses while the overlay is up.
- Renderer (`render.js`): sky + 2–4 parallax skyline layers (procedural, seeded), haze, horizon glow, wet road with
  baked reflections, edge glow, lane flashes, streetlights, notes (+ reflections), pads, particles, rain, bokeh —
  all pre-rendered once per resize/tier; a frame is drawImage + a few polygons. Tiers (high/mid/low: DPR 2/1.5/1, rain,
  bokeh, particles, reflections, layers) step down when the p75 frame time > 19.5 ms. Music-reactive via the beat map's
  `energy` (city brightness, haze colour) and the beat phase (windows, holo signs, edge lights). Preview without a game:
  `tests/integration/pulse-preview.html?t=34&tier=2&combo=60&fx=1&song=pulse2&diff=hard`.
- Measured: the renderer alone holds 60 fps at every tier on a 4× CPU-throttled desktop; the full game too (p95 16.8 ms).
- Hit sounds: `settings.pulseHits` (off by default). Song volume = music bus (Music slider). Menu music fades out for
  the whole match (`MUSIC = null`); the podium plays the victory track.

**Beat maps (`scripts/build-beatmaps.py`).** The map is computed from the *encoded* file decoded back (so note times
match exactly what browsers play — verified 0 ms offset in Chromium). Grid: librosa's tracker seeds a search over tempo
(±4 %, 0.005 BPM) and phase that maximises onset energy over the whole song; a per-quarter drift check falls back to
the tracked beats for genuinely variable tempo; `ONSET_BIAS` (11 ms) corrects the onset curve's lag — measured with
`scripts/check-beatgrid.py` (synthetic drums at known times: |error| < 1 ms at 98–165 BPM). Notes sit only on quarter /
eighth slots, picked per bar by drum strength (HPSS percussive part, low/mid/high band flux) with density scaled by the
section energy; lanes follow the dominant band (kick left, snare centre, hats right) with a balancing nudge, no 4-in-a-
row on one lane, no same-lane repeats faster than an eighth (a beat on Easy); chords (Hard) on strong high-energy beats.
Trims songs > 3:15 to their most energetic ~2:50 (fade in/out), skips intros > 12 s before the beat, 2 s note lead-in.

**Adding PULSE songs** (the owner drops `pulse6.mp3`, `pulse7.mp3`, … into ~/Downloads and asks to "add the new PULSE songs"):
1. One-time setup (if `~/.cache/neural-arcade/pyenv` is gone): `py -m venv ~/.cache/neural-arcade/pyenv` then
   `~/.cache/neural-arcade/pyenv/Scripts/python -m pip install librosa imageio-ffmpeg mutagen soundfile`.
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-beatmaps.py` — builds only new/changed songs (any
   `pulse<N>` / `pulse-<N>` mp3/m4a/wav/ogg/flac in ~/Downloads; `--src DIR`, `--only 6,7`, `--force`). It prints BPM,
   length, trim, steadiness (per-quarter drift should be within a few ms) and how many notes sit on a clear hit.
3. `node --test tests/pulse.test.mjs` (every map: on the grid, playable lanes, Easy < Normal < Hard).
4. Look at the song in `pulse-preview.html?song=pulse6` and play it once (an E2E: `SONG=pulse6 N=2 node e2e-pulse.mjs …`).
5. Commit `audio/pulse/`, `data/pulse/` and push. Titles/artists come from ID3 tags, else "Track 06"; to rename, edit
   `title`/`artist` in `data/pulse/manifest.json` **and** `data/pulse/pulse6.json` (a rebuild overwrites them).

## Room chat (Stage 6)
- **Data:** `chats/{code}` (see Data model) — kept *outside* `rooms/{code}` because the room's `.read` is open to every
  signed-in user and rules cascade. Members = player node exists and not kicked, so a kick (or leaving) cuts access at
  once. A fresh room clears `chats/{code}`; the last player out / stale cleanup removes it.
- **Own store, lazy code:** `js/chat/*` loads the first time the player is in a room (`app.js`, `lobby.js`, `host.js` use
  dynamic imports — none of it is in the first paint). Chat state is NOT in the app store, so messages never re-render a
  game; the list updates incrementally (one element per message, keyed). E2E measured NEON PAR frame work unchanged.
- **Query:** `orderByChild('at')` + `limitToLast(100)` (`.indexOn: at`). The host prunes older lines (`hostTick`, ≤ every 20 s).
- **Sending:** `send()` = one update writing `m/{pushKey}` + `rate/{uid}` (server time). Client gap 0.9 s → "Slow down"
  hint; the rules' 0.8 s gap rejects anything faster → the line shows NOT SENT · TAP TO RETRY (outbox, same text, new
  key). Offline: Firebase queues the write; the line shows SENDING… until the server confirms.
- **Locks** (`logic.js#chatLocked`, unit-tested): chat opens in the lobby and every break; it is locked only during your
  own active play — Cipher guessing (until solved/out), Last Signal answering (eliminated = always open), Overclock
  challenge (until done), Bluff write/vote, PULSE song/Echo, Neon Par until you hole out, PRISM DROP while your board is live (knocked out = open), DOUBLE AGENT
  briefing + clues (in SAME ROOM mode also debate → last chance: the debate happens out loud). Spectators can always chat.
  While locked: the button shows a small lock, the badge keeps counting, no sound/toast/vibration, and an open sheet
  closes when the next round starts. `body.chat-fab-on .timer` leaves room for the button under the gear.
- **System lines** (host, quiet style): joined, left, signal lost (after 6 s offline), reconnected, removed by the host,
  new host (written by the new host), "<GAME> started" (`s-start-{matchId}`), winner (`s-win-{matchId}`, ties summarized).
- **Profanity:** (also keeps crude API trivia out — `sources.js#tooSpecific` uses `hasProfanity`) `meta/settings/chat/filter` (host, gear → FILTER LANGUAGE, default off) masks at render time on every
  phone (past lines too). Whole words with common endings only (`maskProfanity`; tests keep Scunthorpe/assassin/class).
- **UI:** lobby strip (latest 2 lines + typing + a message field → opens the sheet focused, so the keyboard comes up);
  sheet with grouped lines (same sender < 3 min), own lines right/accent, relative times, "New messages" pill when
  scrolled up, typing line, 300-char counter from 260, swipe down / × / backdrop to close (closing blurs → keyboard
  hides). Keyboard: `visualViewport` → `--kb` / `--vh` on the sheet (test hook `window.__fakeVV` + `__chatLayout()`).
  Text is always `textContent` (never HTML); links are plain text. Unread per device: `localStorage na:chat:read:{code}`.
- **Sound:** `sfx('chat')` + a 6 ms vibration for others' lines, only when the sheet is closed, not locked, tab visible.

## NEON PAR (mini golf)
**Everyone plays the same hole at once; nothing waits on the network.** Each phone simulates its own ball with
`physics.js` (pure, deterministic, fixed 1/120 s steps) on the **hole clock** = `(serverNow − game.playStartAt) / 1000`,
so moving obstacles (functions of that clock) are identical everywhere. A putt writes the shot (`sh`: rounded start,
angle, power, hole time, power-up) and the stroke count, then ~10 ball samples/s while it rolls.
- **Ghosts** (`view.js#ghostReplay`): other balls are replayed locally from their `sh` with the same physics — smooth at
  this phone's frame rate however choppy the owner's phone or network — and corrected by the owner's samples (a small
  error is blended out, > 2.5 units adopts their state). Without `sh` they fall back to Hermite interpolation of the
  samples. Ghosts never collide with your ball; they're translucent with a name tag.
- **Refresh / rejoin mid-roll:** the node's `sh` is re-simulated from its start time up to now, so the ball ends exactly
  where it would have (E2E-checked to 1e-3). Resting balls restore `x,y` (+ `ri/rt` if riding a platform), strokes, held
  power-up, pickups taken and the sabotage sent.
- **Rules:** max 6 strokes, else 7. Out of bounds (no floor under the ball) = +1 and back to where you putted from (or the
  last solid rest spot if that was a blinking tile / platform). A ball resting on a tile that vanishes respawns free.
  Director: once > half the participants are in, the rest get 30 s (`cdEndsAt`); offline players never block; when
  everyone's in, `wrapAt` gives 2.4 s (6 s if someone aced) before the scorecard. Unfinished = 7. A hole hard-caps at 4 min.
- **Power-ups** (`hole.powerups`, cyber + arcade holes; the host can turn them off): roll over one to take it (one held at
  a time, per player), tap the HUD slot to arm it for the next shot. GHOST = walls are skipped (gaps/edges still count),
  STICKY = the first wall contact stops the ball dead, MAGNET = the cup pulls within 5 units and captures faster balls.
- **Sabotage** (`logic.js#sabotageEarned`): birdie-or-better or the best score on the previous hole earns one use on the
  next hole. Pick a target + FOG / WOBBLE (aim drifts ±3°) / SHAKE (camera). Active until the target's next shot (started
  after it arrived) ends, max 8 s (`sabotageActive`). FOG is a vignette around the target's ball with a CUP pin above it:
  nothing ever hides the cup or makes a shot impossible.
- **Camera / input:** follow cam (frames ball + cup when resting); slingshot = touch within ~74 px of the ball and drag
  back (dotted aim line on the ground, power ring; back inside 24 px cancels); one-finger pan / pinch / wheel zoom on empty
  space, snapping back when you aim. Intro per hole (local, skippable, once per hole per session): zone title card (new
  zone) → 2.6 s flyover with the par card. ACE = slow-motion replay of the real shot on every phone (~4 s, SKIP).
- **Renderer** (`scene.js`/`zones.js`): floors are height-following grids (slopes/ramps tilt for real), walls are two
  instanced meshes (body + neon cap), glow = emissive + additive sprites (no post-processing), blob shadows, a small PMREM
  env map for chrome/glass/wet. Everything per hole is tracked and disposed on hole change. Tiers high/mid/low (DPR 2/1.5/1,
  particles, rain, ghost trails) step down when the p75 frame time > 19.5 ms. Zone looks: ROOFTOPS (wet concrete with neon
  puddles, props, rain, beacons, city + traffic far below), CYBERSPACE (Tron grid void, data particles, monoliths),
  NEON ARCADE (chrome cabinet, backglass, chasing bulbs). Music: one track per zone (`musicFor(game)`), crossfaded.
  three.js comes from jsDelivr (pinned `three@0.160.0`, import map in `index.html`) and loads only with the golf view.
- **Ball looks** (`ball.js`): colour × finish (neon/chrome/glass) × trail (ribbon/sparks/pixels) in `localStorage['na:golfball']`,
  set from the lobby card's ball button or the in-game ball button; published in the node so ghosts look right.

**Hole format** (`js/games/golf/holes/NN-name.js`, plain data; units ≈ ball diameters, `R = 0.5`; x across, y away from the tee):
```js
export default {
  id: 'dogleg', name: 'DOGLEG', zone: 'rooftops' | 'cyber' | 'arcade', par: 3, tip: 'One line for the par card.',
  tee: [x, y], cup: [x, y],                       // cup radius CUP_R = 1.05
  floors: [{ poly: [[x,y]…], h: 0, surface: 'turf'|'wet'|'grid'|'glass'|'chrome' }],   // no floor = out of bounds
  walls: [{ pts: [[x,y]…], closed?: true, kind?: 'rail'|'rubber'|'laser'|'lip' }],    // 'lip' = low curb, cleared by a jump
  slopes: [slope(x0, y0, x1, y1, [dx, dy] downhill unit vector, g accel, h0, h1)],     // h0/h1 = visual heights
  boosts: [{ poly, dir: [dx, dy], power }],       bumpers: [{ c: [x, y], r, kick }],
  portals: [{ in: [x, y], out: [x, y], r, exitAngle? }],
  gaps: [{ poly, minSpeed }],                     // flies over if faster than minSpeed, else falls (out of bounds)
  movers: [ { type: 'laser'|'spinner', pivot, length, arms, speed, inner? },        // rotating bars (rad/s)
            { type: 'gate', a, b, move: [dx, dy], period },                          // sliding wall
            { type: 'tile', poly, h, period, on: 0.6, phase },                       // blinking floor
            { type: 'platform', poly, h, move: [dx, dy], period } ],                 // moving floor (balls ride it)
  powerups: [{ at: [x, y], kind: 'ghost'|'sticky'|'magnet' }],
};
```
**Adding a hole:** copy a similar file, edit it, add it to `HOLES` in `holes/index.js` (and to `MODES` if Quick 6/3 should
use it), then run `node scripts/validate-holes.mjs <n>`. It must print OK (best ≤ par); aim for an "aimed" ace chance well
under ~40 % and "random" < 2 %. Then `node --test tests/golf.test.mjs`, and play it once (`?emu`, two slots).

## The title screen (NEON DISTRICT)
NEON DISTRICT is a night city where every game is a venue; the title is your first look at it.
- **Sequence** (`title.js`): FIRST VISIT on a device (`localStorage nd:entered`): the dark district + rain + TAP TO ENTER (the tap
  unlocks audio — iPhone needs it — and starts menu.mp3 through the normal music system) → POWER-ON: windows light up in a
  wave from the street up (ease-out, ≈1.6 s), billboards boot, the haze takes the colour, a low swell (`ambience.js#cityPowerOn`)
  → the SIGN: each tube letter flickers on with crackles + a mains hum, then holds → the menu eases in (staggered). ≈3.4 s.
  Every later visit plays the same full boot without the gate; stepping back from the name / profile screen gets a quick
  ≈1.2 s re-light (`sessionStorage nd:back`, set by setup.js). The boot screen never takes taps (`#boot { pointer-events: none }`).
  A tap anywhere skips. REDUCED EFFECTS (settings, now global: `settings.reducedFx`, also PRISM DROP) or prefers-reduced-motion:
  a 0.7 s fade, no drift / rain motion / vehicles / showcase drift. Every ~20–40 s one letter gives a tiny flicker.
- **Scene** (`district/scene.js`, Canvas 2D like PULSE): sky + 4 skyline layers far→near (each pre-rendered DARK + LIT, the
  lit one with a baked bloom), haze at each layer's feet, beacons, two searchlights, flying-vehicle light trails, holographic
  billboards cycling the games' own art (one per side per near layer), the wet street with the whole city reflected and
  rippling, light streaks under the billboards and the sign, puddle ripples, two rain layers, a vignette. Once fully on, each
  layer + its haze and the street + its reflection are BAKED into one image each (~35 drawImage calls a frame); every
  gradient is a cached sprite. Parallax: a slow drift + device tilt (deviceorientation, never asks for permission — iOS just
  doesn't send it) + the mouse on desktop. Tiers 2/1/0 (DPR 2/1.5/1, rain layers, shimmer, vehicles, ripples) step down when
  the p75 frame > 19.5 ms; rendering stops while the tab is hidden; `destroy()` zeroes every canvas when the title leaves
  (the scene element lives on <body>, behind #stage). Measured: 60 fps at every tier at 4× CPU (GPU); 6 title↔setup
  cycles leave one scene and no heap growth.
- **Logo** (`ui/logo.js`): "NEON" as four bent glass tubes (glass, wide + near glow, body, white-hot core, a hairline highlight,
  electrode caps, mounting clips), "DISTRICT" in Orbitron with wide tracking, the tagline `TAGLINE`. The same markup is used lit
  in the lobby header (small), unlit in the boot screen, and by `brand.html` for the icons (the tube N) and the link preview.
- **Menu:** HOST GAME (the one glowing element: glass with a slow light sheen; with a saved profile it opens a room in one tap,
  otherwise the name/avatar screen first), JOIN (one real input under four boxes: native keyboard, auto-caps, paste of a code
  or a whole invite link, auto-join on the 4th letter, a note when I/O are typed, inline errors for no room / full / removed),
  `?room=` pre-fills it (› glows), REJOIN [CODE] when a saved room couldn't be reached on boot (`state.rejoin`), "Welcome back,
  NAME" + EDIT (setup in `edit` mode: profile only, back to the title), a drifting showcase of the games (tap → a preview sheet
  with art, blurb, player count from MIN_PLAYERS, length from `estimateMinutes(DEFAULT_SETTINGS)`, HOW TO PLAY). No version on the title (it lives in the settings sheet footer).
- Wide screens: the skyline sits lower and wider, the sign larger, the showcase shows every game; the menu stays a 400 px column.

## PRISM DROP (falling-block battle)
**Never use the words "Tetris", "tetromino" or "T-spin" anywhere** (UI, text, assets, code comments shown to players). Pieces are
"pieces"/"prisms", spins are "twists". Own identity: luminous glass jewels, white light with spectral edges.
- **Every phone runs its own board** (`engine.js`, pure, fixed 1/120 s steps — frame rate never changes play). Same pieces for
  everyone: `pieceAt(game.seed, n)` = 7-bags shuffled from the match seed. What leaves the phone: a ~5 Hz snapshot (`prism/…`: board
  string "0–8" per cell from the bottom row, active piece, stats, target), a full save every 3 s (`sv`: board, queue position n,
  hold, combo/b2b, pending junk, last attack key) — a refresh restores from it — and attacks (`prismq/{target}`, pushed at once
  with server time; the target's phone applies them: `receive()` with delay = 1 s, or 2.5 s when its stack is ≥ 16 rows tall,
  minus how long the attack was in flight). Junk lands on the next lock without a clear; a clear cancels pending junk first.
- **Battle:** attack table 1→0, 2→1, 3→2, 4→4; twist single/double/triple 2/4/6; mini twist (double) 1; back-to-back +1;
  combo bonus `COMBO_ATTACK`; perfect clear 10 (+b2b) + combo; × (1 + badge bonus) with the fraction carried (`frac`).
  Speed: level = 1 + minutes played (cap 12). Sudden death: after 5 min, one junk row every 10 s (gap from the seed). A top-out
  writes `st:'out'` + `by` (the sender of the last junk received = KO credit); the director orders knockouts by time, moves badges
  (`applyKo`: killer gets victim's + 1), counts KOs, sets `duelAt` when 2 of ≥ 3 remain, ends when ≤ 1. Offline > 30 s = out.
  Targeting (`chooseTarget`): RANDOM (re-picks every ~8 s), ATTACKERS (who hit you in the last 15 s / targets you), DANGER
  (tallest stack). Call the Winner: 10 s after you're out (rules: 12 s); bonus = `callBonus(rem)` = 0.4 × (players left − 1).
- **Score Rush:** no attacks; the match = one song (`endAt` = the song's analysed last strong beat); levels every 10 lines; a
  top-out clears the board (score kept); the finale (chord + the board shattering) is scheduled on that beat.
- **Songs:** `meta/prism` holds the room's playlist seed + position. `playlistAt(seed, k, ids)` = per-cycle seeded shuffles, a cycle
  never starts with the song the last one ended on, so nothing repeats until all have played. A match takes the next song(s)
  (battle deals 5 in a row; if it outlasts a song the next crossfades in over 4 s and the world transforms); the final step
  advances `meta/prism/n` by the songs used. Like PULSE, each song is decoded once into an AudioBuffer and scheduled on the audio clock
  (`pulse/clock.js#ctxAtServer`) — never streamed through an <audio> element and "corrected" (that version warbled and
  stuttered on phones). Only the playing song + the next (≤ 45 s before its turn) stay decoded; after a suspension the song
  is restarted once at the right spot. It plays through a low-pass (DANGER: stack ≥ 13 rows sinks it toward 600 Hz) and a lift gain (DUEL).
  Menu music is off during the match (`MUSIC = null`); the podium plays victory.
- **Musical SFX** (`audio.js#createSynth`): every note comes from the current song's scale (`tonic` + `mode`); line-clear phrases,
  twists, KO, level-up are quantized to the song's next 16th note (beat clock from the analysis); combos climb the scale; the
  countdown ticks are scheduled on the beats before GO. Synth: soft plucks, FM bells, a detuned pad, one convolver reverb.
  `window.__prism.synthLog()` records every note (the E2E checks key + grid).
- **Visuals:** the board is Canvas 2D with pre-rendered glass sprites (`board.js`); the world is one WebGL fragment shader per
  world at 0.33–0.6 of screen resolution (`worlds.js`; uniforms: beat, energy, bloom, hue, combo, wave, danger, duel, glitch) and
  shards are a capped canvas particle layer (`fx.js`) between them. Quality tiers 2/1/0 (world scale, fbm octaves, DPR 2/1.5/1,
  particle cap 200/110/50, glow) step down when the p75 frame > 19.5 ms. "Reduced effects" (settings) + prefers-reduced-motion
  turn off shards, hue drift, beat pulses and camera pulses.
- **Checking a real phone:** add `?pdperf` to the address (it survives joining a room): a corner readout of fps, frame
  CPU time, quality tier, world resolution, audio state/latency and the songs playing.
- **Controls** (`input.js#makeGesture`, pure + unit-tested with 2000 random swipes): drag = follow the finger by distance (no
  overshoot), tap = rotate by screen half, slow drag down = soft drop row by row, flick (≥ ~1.15 px/ms over 70 ms, steep, ≥ 0.9
  cell) = hard drop, swipe up = hold. Settings: GESTURES/BUTTONS, swipe sensitivity, button size, reduced effects (`audio/settings.js`
  `prismScheme/prismSens/prismBtn/prismReduced`). Keys: ← → ↓ space ↑/X Z C/shift.

**Adding PRISM DROP songs** (the owner drops `prism6.mp3`, `prism7.mp3`, … into ~/Downloads and asks to "add the new PRISM DROP songs"):
1. PULSE's Python venv (see PULSE step 1).
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-prism.py` — encodes new/changed songs to `audio/music/prismN.mp3`
   (112 kbps stereo, full length), analyses beat grid / key / energy / last beat, picks a world from the song's mood (tempo,
   energy, brightness, major/minor; unused worlds first) and rewrites `data/prism/manifest.json`. A file named just `prism.mp3`
   gets the lowest free number. `--only 6,7`, `--force`, `--reworld` (re-pick all worlds).
3. Worlds: five exist (aurora, city, nebula, crystal, sunset) × 3 variants. Once every world is taken, a new song reuses the
   best-fitting one. For a song that deserves its own world, add a shader body to `worlds.js#BODY` + an entry with 3 variants
   in `WORLDS` + its mood target in `build-prism.py#WORLDS`, then `--reworld`. Override by editing `"world"` in the song's JSON (kept on rebuilds).
4. `node --test tests/prism.test.mjs`; look at it in `prism-preview.html?world=…`; play a Score Rush (`?emu`, two slots).
5. Commit `audio/music/prism*.mp3` + `data/prism/` and push.

## SLIPSTREAM (survival ride)
Everyone rides the same seeded course at once; calm, then faster and harder; the last rider still riding wins (2–8, lives 1/2/3).
- **Course** (`course.js#createCourse(seed)`, ~200 ms): control points -> cosine-interpolated heights every 0.25 m. Each hill's crest
  curvature κ = g / vL² is tuned to a launch speed vL near the base speed for that moment, so diving down the slope before it is
  what gets you airborne. Nominal time along the course (`nominalSpeed` = 1.5 × `baseSpeed`, 12 -> 26 m/s at 6:00, faster after)
  decides difficulty and biomes. Hazards unlock in order (rings 20 s, gaps 45, low ceilings 75, laser gates 100, crumbling 130,
  gravity flips 160 then every 52–70 s) and are sized by **probe rides** (`probe()`, the same launch rule + ballistics): gap
  length from a launch at 1.02–1.12 × vL, laser openings from probe heights at 1.2–2.6 × vL (blinking low beams from 3:20),
  ceilings 4.6–5.8 m over the hills. Biomes every ~45 s: DUSK DUNES, then CRYSTAL CANYON / FLOATING CITY / LIGHTNING STORM
  shuffled twice (never the same twice in a row), OPEN SPACE from 5:15; 3 sky variants each, all from the seed.
- **Rider** (`physics.js`, pure, 1/120 s): on the ground speed follows the slope (× 2.1 when holding downhill, × 1.35 uphill); a
  release where s²κ > g·cosθ launches; in the air gravity is lighter (`AIR_FLOAT` 0.62 — floaty flights, shared with
  `probe()` so hazards are sized for it) and × 2.3 while held > 0.18 s; a tap (< 0.2 s press, counted on release)
  queues a full flip (0.48 s). Landings keep momentum: at least `LAND_KEEP` (60 %) of the flight speed even meeting an upslope at a steep angle
  (a strict projection lost ~75 % and made the ride feel slow). Landing within 40° of the slope = clean (flips -> boost 2.2 + 1.6/flip + 0.55·combo; consecutive
  flipped landings build the combo; a plain jump always lands clean thanks to the attitude assist), else a crash. Gravity-flip
  zones run the rider in a mirrored frame against a ceiling track. Crash with lives left: 0.9 s rewind, respawn a little behind
  on plain ground, 2 s invulnerable (shimmer). Out of lives = `st:'out'` with server time + distance.
- **Bot** (`bot.js`): rollouts of hold/release plans with the real physics; `tests/slip-course.test.mjs` rides whole courses on
  several seeds to sudden death and checks every hazard section from a minimum-speed respawn.
- **Match** (`director.js`): count (5.2 s, songs start under it) -> play -> out detection from rider nodes (or offline > 30 s);
  riders out within 600 ms of each other are ranked by distance; LAST RIDERS (`lastAt`) at two of ≥ 3; end at ≤ 1 alive or
  9:00 (the farthest wins) -> final with results + Call the Winner (`callBonus`, as PRISM DROP) + `meta/slip/n` advanced.
- **View** (`view.js`): the rider is simulated locally on the match clock (`serverNow() − playStartAt`), publishing ~10 Hz; ghosts
  are drawn 0.14 s behind, interpolated between samples (ground-following when both samples are on the ground). Camera: the
  rider sits 28 % from the left and the screen shows exactly `look` metres ahead — `look` = 24 + 0.62 × speed, widened to fit the
  vertical span with a fixed reference aspect — so portrait (zoomed out) and landscape see the same distance ahead.
  Refresh / rejoin / > 1.2 s in the background = back near the last position with the same lives (a respawn, no life lost).
- **Look** (`sky.js`: a WebGL1 shader per biome at 0.22–0.42 of screen pixels; `scene.js`: Canvas 2D): 3 parallax silhouette
  layers per biome, layered ground, the track as a glowing line, hazards (gap lips, laser beams, zap lines, cracks, flip arch +
  ceiling, rings), ghosts with name tags, trails, shards, flashes, speed lines, lightning, seeded events (light-birds, meteors,
  airship). Tiers 2/1/0 (DPR 2/1.5/1, glow passes, layers, particles, speed lines, sky resolution) step down at p75 > 19.5 ms.
- **Rides** (`ride.js`, `localStorage na:slipride`): HOVERBOARD or LIGHT-CYCLE × RIBBON / SPARKS / LIGHT WALL trail — drawing only,
  identical physics + hitbox. Picker: the countdown's YOUR RIDE button or ⚙ -> SLIPSTREAM.
- **Audio** (`audio.js`): songs via `synced-songs.js` through low-pass -> high-shelf -> dry/reverb/echo -> swell; `TREAT` per biome
  (blended with the biome mix); airtime swell, near-crash dip (140 ms), crash muffle (0.9 s at 520 Hz), LAST RIDERS opens it up.
  Synth SFX: wind with speed, laser hum near gates, launch, flip, a landing chime up a pentatonic scale with the combo, crash,
  rewind, respawn, ring, gate, gravity flip, countdown.
- Test hooks: `window.__slip` (rider, course, bot, crash, teleport, camera, audio, announcements, tier, fps, ghostProbe…).

**Adding SLIPSTREAM songs** (the owner drops `slip9.mp3`, `slip10.mp3`, … into ~/Downloads and asks to "add the new SLIPSTREAM songs"):
1. PULSE's Python venv (see PULSE step 1).
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-slip.py` — encodes new/changed songs to `audio/music/slipN.mp3`
   (112 kbps stereo, full length), analyses BPM / beat grid / energy, rewrites `data/slip/manifest.json` (`--only 9,10`, `--force`).
3. `node --test tests/slip.test.mjs` (songs data + the no-repeat playlist), then ride once (`?emu`, two slots).
4. Commit `audio/music/slip*.mp3` + `data/slip/` and push. New songs join the room playlist automatically.

## DOUBLE AGENT (social deduction)
- **Privacy:** `rooms/{code}` is readable by every signed-in user, so nothing secret goes there. `index.js#start` writes a
  random seed to `spy/{code}/key/{matchId}` (host-only rules); `prepare()` (host) loads the seed + bank and writes every
  seated player's card (idempotent per `rk`). The view subscribes to its own card only. A rules test proves another
  player can't read your card or the seed.
- **Turns:** `turnOrder` shuffles from the seed, then swaps the first non-agent to the front (the agent never opens). The
  host validates each clue with `clueProblem` (the client shows the same message first); a blocked, offline or timed-out
  turn writes '' = NO SIGNAL. GRACE_MS (700 ms) lets a last-moment clue land.
- **Void:** an agent whose player node is gone mid-round → `v+1`, the word is burned, a new deal (`rk` changes, so all
  per-round player nodes start fresh). Fewer than 3 present → final.
- **Votes:** most votes are accused; a tie for the last spot = nobody (the agent escapes). With 2 agents the top 2 are
  unmasked. Scoring in `logic.js#scoreRound` (PTS).
- **Same-room fairness:** the agent and normal cards share size, timing, animation (`da-jitter`), sound (`daReveal`) and
  haptic (30 ms); only the text differs. Never give one an effect the other lacks — the E2E measures it.
- **Adding words:** append to a category (or add `[CATEGORY, [words]]`) in `data/agent/words.json`: concrete, well-known,
  family-friendly, one clear meaning, similar to the others in the category, unique across the whole bank, letters and spaces only.
  Run `node --test tests/agent.test.mjs`.

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
- **Overclock CLOSEST CALL:** append `[category, "Question that names the unit?", answer, "unit"]` to `data/oc/closest.json`.
  Only stable, well-documented numbers (no populations/records that drift); the unit must be in the question.
  `tests/overclock-new.test.mjs` checks the shape and count.
- **Overclock TIMELINE:** add items to a pool (or a new pool) in `scripts/build-timeline.mjs` — `[label, sortValue, "shown value"]`
  — then `node scripts/build-timeline.mjs`. Avoid disputed dates/measurements; the fairness gaps reject near-ties.
- **Overclock MISSING LINK:** append `["WORD", "WORD", "WORD", "ANSWER", ""]` to `data/oc/missinglink.json` (put other accepted
  spellings in the last field as `"GREY|GRAY"`; plurals are automatic). The answer must join all three clues (before or after) and
  NO other word may fit all three — try "fire / stone / paper": WALL works, but so does WORK, so it was changed. Answers are unique.
- **Overclock SPELLCHECK:** append `["correct", "common misspelling", "wrong", "wrong"]` (lowercase, American spelling) to
  `data/oc/spellcheck.json`. Skip words with two accepted spellings, and make sure no "wrong" option is a real word or variant
  (e.g. *calender*, *florescent* and *publically* are in dictionaries). Check new rows against ENABLE + Hunspell en_US/en_GB.
- **Overclock MAKE 24:** `node scripts/build-make24.mjs` (tweak the easy/hard rules at its top).
- **Overclock SORT IT:** add a pair `["LEFT", "RIGHT", [left items], [right items]]` (≥ 25 items, ≥ 7 per side) or items to a pair in
  `data/oc/sortit.json`. Only items nobody argues about (no tomato-is-a-fruit; watch ownership changes like Fox → Disney). The
  number/word pairs (PRIME, MULTIPLE OF 7, roman MORE THAN 50, MORE THAN ½, PALINDROME, LETTERS IN A–Z ORDER) are recomputed by the test.
- **Overclock HIGHER OR LOWER:** add `[item, value]` (or `[item, value, "shown"]` for things like "c. 2560 BC") to a stat in
  `data/oc/higherlower.json`, or a new stat `[STAT, "QUESTION?", unit ('year' for years), 'max'|'min', items]`. Rounded, stable
  values only (no fast-changing records); the 1.2× / 10-year pairing rule absorbs small source differences.
- **Overclock LEXICON:** `node scripts/build-lexicon.mjs <dir with enable1.txt + count_1w.txt>` (download URLs in its header).
- **Cipher Breach / Unscramble words:** edit the blocklist or sizes in `scripts/build-words.mjs` and rebuild (below).

## Word lists
Built by `scripts/build-words.mjs` from ENABLE (public domain), the SCOWL-derived Hunspell en_US
dictionary (filters to real, non-proper-noun base words) and Peter Norvig's word-frequency counts (MIT).
Answers: the ~1,300–1,400 most frequent qualifying words per length, minus plurals/past tenses and a
blocklist. Valid guesses: ENABLE ∩ Norvig's 333k list. Rebuild after editing the blocklist.
