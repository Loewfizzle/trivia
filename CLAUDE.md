# NEON SPEAKEASY — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each; DOUBLE AGENT needs 4). Twelve games. Static site on Vercel
(**neonspeakeasy.com**; games.loewfizzle.com and trivia.loewfizzle.com redirect there) + Firebase Realtime Database + Anonymous Auth,
plus six Vercel serverless functions in `/api` (profiles, server-verified results, THE BOARD, admin, errors from phones — `docs/profiles.md`; the live weather — `docs/title.md`).
The app was NEURAL ARCADE, then NEON DISTRICT (both Oct 2026); the games kept their names and the title's city is still "the
district" in code (`js/screens/district/`, the `nd-` class prefix). `ROADMAP.md` lists what shipped and what is next.
**Keep this file, ROADMAP.md (one line per shipped feature; the detail goes in `docs/roadmap-history.md`) and the relevant `docs/*.md` updated as you work.**

This file is the short version. The deep-dives live in `docs/` — read the one you need, when you need it:

| doc | read it when you touch |
| --- | --- |
| `docs/match-kit.md` | **any real-time game** (the shared HUD pieces + the E2E harness) — read this before building or changing a game |
| `docs/data-model.md` | the database: every node, every game's `game` shape, rules |
| `docs/testing.md` | running / writing tests: emulators, smoke test, each game's E2E and its env flags, previews, Lighthouse |
| `docs/audio.md` | music, playlists, SFX, the audio engine; loading, PWA, service worker, link previews |
| `docs/title.md` | the title screen, the district scene, the logo, the menu, LIVING CITY (time of day, seasons, holidays, sky events, the real sun + solar eclipses; `?when=&tz=&at=&force=`), PARTY NIGHTS (Fri / Sat on the beat), RAINBOWS (after real rain), THE STREET (lamps, trees, buses, the stop light; the people, the speakeasy's door + the knock), the dock, the screen at rest, the easter eggs |
| `docs/harbor.md` (+ `docs/harbor/passes/`, one log a pass — its INDEX) | **CITY 2.0 — THE HARBOR** (`?city=2`): the bible — size rules, camera + layout, bakes + memory, lanes, budgets, THE FILE MAP, KNOWN ISSUES, the standing rules' full text |
| `docs/harbor/decisions.md` | the owner's CURRENT City 2.0 decisions (short; `docs/harbor/plan.md` = the dated archive) — **read first in a Harbor pass**; Step 0 updates it |
| `docs/chat.md` | room chat (data, locks per game, system lines, profanity filter) |
| `docs/content.md` | adding questions / puzzles / words to any bank; rebuilding word lists |
| `docs/profiles.md` | profiles, name tags + keys, `/api`, result reporting, THE BOARD, XP ranks + steps, streaks, the weekly goal, mastery, THE VAULT (card finishes, name glows), emblems, `/board`, `/admin`, the Vercel setup |
| `docs/pulse.md` `docs/golf.md` `docs/prism.md` `docs/slip.md` `docs/gridlock.md` `docs/agent.md` `docs/stakes.md` `docs/rum.md` | that game |

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
  Never read layout (getBoundingClientRect / clientWidth) in a frame loop — sizes come from ResizeObservers (`ui/canvas-safe.js#cssWidth`: 9f found the crisp layer reading clientWidth every frame — a whole page layout per frame while the sign restyles). Everything respects `prefers-reduced-motion`.
- Mobile: `100dvh`, safe-area insets, inputs ≥ 16px, touch targets ≥ 44px. No zoom: `body { touch-action: pan-x pan-y }` +
  iOS `gesturestart` block (the viewport meta deliberately has no `user-scalable=no` — Lighthouse penalizes it).
- **Taps on plain page areas** (a canvas, an empty div): listen to pointerdown + pointerup, never `click` — iOS Safari does not
  send `click` to elements it doesn't consider clickable (the title's city taps worked on desktop and silently did nothing on iPhone).
- Contrast: all text ≥ 4.5:1 on its background (`--text-faint` is the dimmest allowed text color).
- The app name is `APP_NAME` in `js/config.js` (plus `<title>`/meta tags in `index.html`).
- **Audio is polish, never a dependency.** Everything must work silently: missing files, locked iOS audio, muted. SFX stay quiet — felt more than heard after 20 minutes.
- **Visual review:** every new screen gets screenshot-reviewed at 390×844 and 412×915 (plus 1440×900 for anything shown on desktop)
  with at least two refine passes, three for a new game. Look at the screenshots; the data passing is not the screen looking right.
- **Phone first, unzoomed (the owner's standing rule, Oct 27):** window scenes + people (and everything else) must READ ON THE PHONE AS-IS,
  UNZOOMED. Before building a detail, check it against its real size on the iPhone (a speakeasy window is ~40 pt wide); a detail that
  can't be seen there (fingers, a figure in the dark behind, small props, crust textures) is NOT built — make it bigger, bolder, a clear
  silhouette + one bright accent, or drop it. Judge every look review at 390 / 402 / 430 without zooming in.
- **Class names:** prefix new CSS classes per feature (`nd-`, `ndl-`, `pd-`, `da-`, `gl-`…). A bare `.nl-hi` once collided with
  Overclock's number line and shoved the logo's highlights sideways.
- **Presentation tech:** Canvas 2D (+ a WebGL fragment shader for a sky/world) unless 3D *is* the game (RUMRUNNER's city diorama is three.js, but it is a backdrop and a map: every button, price and card is DOM over it). Every polish pass on a three.js
  scene costs several times a 2D one, and a tilted 3D board on a phone fights readability and tap targets (GRIDLOCK Part 1 shipped
  on three.js, failed the play-test and was rebuilt flat in Canvas 2D a week later — straight-on, labels inside the frame, one board up).
- **The title has one too:** `tests/integration/title-preview.html` (the real title; `shots.mjs --preview`).
- **City 2.0 (`?city=2`) — its standing rules, one line each** (the full text: docs/harbor.md#city-20-in-claudemd--the-full-text; the
  owner's CURRENT decisions: **docs/harbor/decisions.md** — read it before a Harbor pass; plan.md is the archive):
  - THE WINDOW RULE: every window moment enters by its own motion or the blind cycle (core/harbor-moments.js#ENTERS_BY_MOTION).
  - THE PEOPLE RULE: nobody appears or vanishes in view on the promenade (core/harbor-witness.js#rejoinVisits, people.js#guard).
  - THE SOLIDS: every solid thing on the promenade is ONE registry (core/harbor-solids.js) — every walk goes round it.
  - NO LAMPPOSTS: the implied lamps; the light in ONE pure module (core/harbor-light.js; NEW light default, `&light=old` for A/B).
  - NO TRAFFIC DURING THE LEGENDARIES (core/harbor-legend.js#trafficHold); every vehicle planner reads it.
  - THE BEAT: the lights follow the song's grid; a TRUSTED GRID ALWAYS PUNCHES; the kicks only calibrate the lead (core/harbor-beat.js).
  - 3D only as BAKED sprites (scripts/bake-model.mjs); lettering nothing passes in front of → THE CRISP LAYER (crisp.js).
  - Every force flag has a panel row (core/harbor-remote.js; tests/harbor-remote.test.mjs greps for strays).
  - Every canvas through `safeCtx` / `ctx2d` (ui/canvas-safe.js) — counted by the memory guard; a new canvas needs no registration.
  - THE CITY TIMETABLE (core/harbor-schedule.js) holds every NEW timed thing; THE TIER TABLE (core/harbor-tiers.js) every NEW per-phone number.
  - Debug + preview flags: `&debug=1` (strips at the TOP), `&dpr=3` (look only), `&bench=1` (THE PHONE BENCH), `&force=…` (a legendary
    from a link waits for the reveal + a tap; `&lgnow=1` at once) — docs/harbor.md.
- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view with a scripted state through an import
  map that swaps `js/firebase.js` for `tests/integration/fake-firebase.js` (see gridlock-preview.html). Iterate screens there in
  seconds; run the E2E once the look is right.
- **Profiles are polish too:** joining and playing must work with `/api` down or unconfigured (no tags, no emblems, results queue).
  Clients never write boards, stats, XP or ranks (server-only in the rules); board ids use dashes (`cipher-score`), never dots.
- **THE BOARD shows no typed names (BNAME, Oct 28):** no public response (`/api/board`, its CDN copy, `/board`, the title's preview)
  carries another player's typed name or profile id — a row is an opaque board id + its HOUSE NICKNAME (`js/core/nicknames.js`); your
  own row is swapped to your name on your device (`profile.bid`). `profiles/{pid}` is readable one at a time by signed-in users, never
  as a list. A profile is listed from its 3rd counted match. docs/profiles.md "THE BOARD's PUBLIC NAMES".
- **Anti-cheat never depends on the code being secret** (the owner, Oct 28 — the repo stays PUBLIC until just before the launch): the
  server checks + replays every result itself (`/api`), the secrets live only in Vercel's env (the service-account key, the pepper).
- **A game's podium music:** `FINAL_MUSIC` in its index.js (HIGH STAKES: `victory1` = victory.mp3); default the victory playlist.
- **PRISM DROP:** never use the words "Tetris", "tetromino" or "T-spin" anywhere (pieces/prisms, twists).

## Working efficiently (what cost the most in past sessions)
- **Edits:** use the Edit tool or a script file in the scratchpad. Never put code with backticks, `$` or `\b` inside an inline
  `node -e "…"` / heredoc — the shell mangles it and the repair costs more than the edit.
- **Names:** a view's own `update(state)` shadows Firebase's `update` — import it as `dbUpdate` (RUMRUNNER lost its DONE writes to this; the
  failure was silent because the view's update() just returned).
- **Tests, in order:** `node --test tests/*.test.mjs` (seconds) → the game's `FAST=1` E2E (≈ 2 min) → the full suite once before
  committing. Don't re-run a 20-minute suite to check one fix. Run E2E suites with absolute paths and from `tests/integration`.
  The title suite runs by group while iterating: `ONLY=dock` (or `gate`, `flow`, `neon`, `perf`, comma-separated) ≈ 1 min instead
  of ≈ 4.5; the whole suite once before the commit. Untouched areas need no E2E at all (sky / sun work → e2e-sky; a game → its own).
- **Look reviews:** `node tests/integration/shots.mjs "<browser>" --scenes night,day,halloween --sizes phones --crop dock` (scenes,
  size sets, Grand Rapids by default, crops of the dock / corner buttons / sign; `--cast <ms>` = every painted frame, the true frame
  burst for a flicker). Never write a one-off screenshot script again —
  add a scene or a crop preset to shots.mjs instead. "No look change" = `tests/integration/pixdiff.mjs` (A/B against a worktree on
  :5174, a noise floor); City 2.0's speed gate = `title-perf.mjs --ab` (a relative A/B in one run; absolute budgets are warnings).
- **Design rules that may conflict** (e.g. "visible at sunrise" vs "never over the letters" vs "a round arch" on a skyline with tall
  towers): check feasibility first — a few lines in node against the real numbers — and ask the owner which rule wins BEFORE
  building. Discovering the conflict through rounds of screenshots cost the most time of anything in Oct 2026.
- **Waits in tests:** wait for the actual condition (`waitFor(page, js)`), never a fixed sleep "to be safe"; a fixed pause only
  for something that is itself timed (a measurement window, a colour sampled mid-blend).
- **Line endings:** LF everywhere (`.gitattributes`); a CRLF working copy breaks exact-match edits.
- **A new game = rules first.** Pure `logic.js` + `director.js` with a whole-match simulation test before any pixel; then the view on the
  match kit; then one distinctive screen, reviewed at three sizes.
- Run `git status` before committing: stage the files of this task only (other work may be in the tree).

## File layout (top level; each game's files are listed in its doc)
```
index.html / sw.js / manifest.webmanifest / assets/     shell, service worker (network-first, same-origin static only, never /api), PWA, icons + og.png
board.html admin.html                                    THE BOARD for anyone (/board, og-board.jpg) and the admin page (/admin)
api/ profile.js report.js board.js admin.js log.js sky.js + _lib/   Vercel functions (firebase-admin): profiles, verified results, boards, moderation, errors + reports from phones (9e: SEND REPORT / the hang watch), live weather (+ NOAA's Kp)
package.json                                             only firebase-admin for /api (npm install at the root for local /api)
css/base.css components.css screens.css title.css        tokens + themes, the design system (+ NEON GLASS), setup/lobby, the title
css/kit.css                                              the match kit's default look (announcements, cards, Call the Winner, report)
css/board.css admin.css                                  THE BOARD, the membership card, podium plaques + rank-up; the admin page
css/<game>.css  (cipher signal overclock bluff pulse golf prism gridlock slip agent stakes rum) + css/chat.css
js/config.js  firebase-config.js  firebase.js            APP_NAME, limits, colors, avatars, GAMES registry / the web config / init + db helpers + serverNow() + THE PARKED DATABASE (want / release)
js/identity.js store.js room.js host.js app.js wakelock.js   slots + saved session / state + subscribe / rooms, presence, listeners / host loop + director / router
js/core/  room-logic.js hush.js lobby-song.js party.js rainbow.js trees.js street-life.js people.js rng.js obfuscate.js night.js playlist.js sky.js weather.js insights.js tube-path.js   PURE: room codes + host election, HUSH WORDS, the lobby song, PARTY NIGHTS, RAINBOWS, CITY 1.0's street, seeded RNG, XOR+base64, game-night standings, room playlists, the real sun / moon / seasons / holidays / eclipses (sky.js), Open-Meteo + NOAA's Kp → the weather, the admin STATS, SVG → neon tubes; harbor-*.js: City 2.0 (below)
          week.js ranks.js names.js nicknames.js pkey.js boards.js match-report.js   PURE (server + client): Eastern week keys, XP ranks, board-name filter, THE HOUSE NICKNAMES (BNAME), keys, board catalog, per-game results
js/profile/ api.js me.js queue.js public.js callouts.js  /api client, this device's profile, the results queue, room players' profiles, podium plaques + rank-up
js/board/ scene.js view.js screen.js public.js audio.js  THE BOARD: the bar (Canvas 2D), the board UI, app route, /board entry, its SFX
js/admin/admin.js                                        the /admin page
js/ui/    dom.js components.js final.js logo.js tube-logo.js game-art.js settings-panel.js help.js credits.js toast.js emblems.js debug-tools.js debug-strip.js word-neon.js   h(), the design system, the podium, the sign + City 2.0's SPEAKEASY tubes, game logos + lobby art, gear + settings, HOW TO PLAY, CREDITS (ADD A CREDIT = one entry in credits.js#CREDITS), toasts, emblems, the &debug=1 strips
js/audio/ settings.js engine.js music.js sfx.js ambience.js synced-songs.js mood.js lobby-music.js party-music.js beat.js diag.js tape-stop.js   prefs, the AudioContext + buses, music + playlists, SFX, ambience, songs on the server clock, MOOD MUSIC, the lobby's + City 2.0's PARTY song in sync (core/party-deck.js), the beat, the AUDIO panel, THE TAPE STOP (a decoded slice on a buffer source — the song element's playbackRate is NEVER changed: iOS stalls it). Session 'playback' with the music on, 'ambient' off; a dead graph hands the song to a plain <audio> (THE DIRECT PATH) — docs/audio.md
js/core/mp3-slice.js tape-math.js                        PURE: an MP3's frames → a byte slice in song time; the tape's rate schedule + its exact integral (docs/audio.md#the-tape-stop-in-web-audio)
js/trivia/                                               categories, API sources + filters, bundled bank, host feed (Last Signal / Overclock)
js/screens/ title.js title-dock.js setup.js lobby.js profile.js district/*.js   the front door, name/avatar, the lobby, the membership card; CITY 1.0 — the district (Canvas 2D: sky, signs, live weather, the street; docs/title.md)
js/screens/harbor/ js/core/harbor-*.js + its sounds, bakes, canvas helpers   CITY 2.0 — THE HARBOR (?city=2): every file in docs/harbor.md#the-file-map
js/chat/  logic.js chat.js ui.js                         PURE rules (locks, profanity) / data layer / lobby strip + sheet + in-game button
js/games/registry.js lazy-view.js                        id → module (the contract), ALL_PLAYER_NODES; lazy view + stylesheet loading
js/errlog.js                                             errors from players' phones → /api/log → /admin (first import of app.js + board/public.js)
js/games/kit/                                            THE MATCH KIT: moments (announcer + cards), call, results, tiers, hook   → docs/match-kit.md
js/games/<id>/  logic.js director.js index.js view.js (+ scene/audio/…)   PURE rules / PURE state machine / contract + host duties / the screen
data/     trivia bluff oc words agent pulse prism slip    the banks and song analyses (formats in docs/content.md and each game's doc)
data/hushwords.json  scripts/hushwords/                  HUSH WORDS (room codes): built + checked by scripts/build-hushwords.mjs (docs/content.md)
audio/music/*.mp3  audio/pulse/*.mp3                     music (≤ 4 MB each; bump music.js#REV when replacing a file), PULSE songs; `c2-*.mp3` = the owner's City 2.0 mood songs (112 kbps, −16 LUFS)
audio/sfx/neon-*.wav  audio/weather/*.mp3                 City 2.0's recorded neon (scripts/build-neon-sfx.py; docs/audio.md), the thunder
scripts/  serve.mjs build-*.{mjs,py} add-city2-music.py validate-holes.mjs sim-gridlock.mjs   local server (:5173, `--emu` also runs /api on the emulators), builders (build-synth-sfx.py: city sounds SYNTHESIZED — the hydrant's spray, the periscope's sonar ping — then imported by add-city-sfx.py; add-city2-music.py: the one command that imports the owner's mood folders), the NEON PAR hole bot, GRIDLOCK balance sim
database.rules.json                                      RTDB rules — paste into the Firebase console after every change
tests/*.test.mjs                                         unit + whole-match simulations (node --test, no deps)
tests/integration/  kit/harness.mjs e2e-*.mjs harbor-e2e/ (the Harbor suite: kit + one file per cloud job) title-perf.mjs pixdiff.mjs rules.test.mjs server.test.mjs *-preview.html   the E2E harness, per-game suites, rules tests, /api tests, no-Firebase look previews
tests/fixtures/finals.mjs                                finished matches of every game (profile/board tests)
```

## Data model (the shared core; every node and every game's `game` shape: `docs/data-model.md`)
```
rooms/{CODE}/       ← CODE = the HUSH WORD (a common 4-letter word; docs/content.md); hush/{WORD}: { closedAt } rests it 24 h after closing
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, locked?, settings/{gameId}: {...} }   ← locked: LOCK THE DOOR (no new player nodes)
  players/{uid}:  { name, color, avatar, joinedAt, pid? }    ← written by that player only (pid: their own profile id only)
  presence/{uid}: { online, lastSeen }                       ← onDisconnect sets online:false
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape; totals are always DERIVED from results (never stored) so a replayed step can't double-score
  night/{matchId}:   { g, p: { uid: 3|2|1|0 }, n: { uid: name }, b?: { uid: bonus }, at }  ← host; game-night scoreboard
  <game nodes>/{matchId}/…/{uid}                              ← a player's own data for the current step, phase-gated by the rules
chats/{CODE}/   fleets/{CODE}/   glsonar/{CODE}/   spy/{CODE}/   hsbet/{CODE}/   rrp/{CODE}/   ← top level: rooms/{CODE} is readable by any signed-in user, these are not
city2/live      ← CITY 2.0's PREVIEW PANEL for EVERYONE (server-written via /api/admin; admins listen live, every other phone reads the cached GET /api/admin?live=1; docs/harbor.md)
profiles/{pid} (signed-in, one at a time)  uids/{uid} (own)  pstats/{pid} (owner)  lb/ results/ ppriv/ pkeys/ tags/ rl/ audit/ flags/ (server only)   ← docs/profiles.md
```
Rules of thumb: a player writes only under their own uid; anything secret (fleets, agent cards) lives outside `rooms/`; the host
wipes `ALL_PLAYER_NODES` (registry.js) at match start/end; obfuscate (`core/obfuscate.js`) what must not be readable in plain sight.

## Multiplayer mechanics
- **THE PARKED DATABASE (CONN, Oct 28 — the free plan's 100 SIMULTANEOUS connections):** anonymous sign-in still runs at boot, but the
  Realtime Database socket opens only when wanted: `firebase.js#want(reason)` / `release(reason)` (reference-counted by reason — `'join'`
  while HOST / JOIN / a resume / an invite check runs, `'room'` from `enterRoom` to `exitRoom`, `'admin'` for the preview panel's live
  listener). Once nothing wants it, it goes offline after a 30 s grace; a tab hidden 2 min with no room parks too — NEVER while in a room
  (presence, onDisconnect + host election need the socket: a locked phone in a game behaves exactly as before). `dbRef()` with nothing
  wanting the line wakes it for a grace by itself (`'touch'`), so an unlisted caller never hangs — but a new feature that reads the
  database OUTSIDE a room must `want()` / `release()` its own reason. `state.net` = `parked` · `waking` · `online` · `lost`: only `lost`
  shows the SIGNAL LOST banner (a parked title is never "offline"). `serverNow()` keeps the last offset per device while parked.
  City 2.0's EVERYONE preview reaches non-admins through the edge-cached `GET /api/admin?live=1` (polled ~45 s while visible), never a
  socket. THE BOARD + /admin are /api only. Proof: `tests/integration/e2e-conn.mjs` (the sockets in every state; in the cloud's tests job).
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
- **Privacy pattern** (GRIDLOCK, DOUBLE AGENT, HIGH STAKES — whose host may read the hidden bets only once the phase is `show`; RUMRUNNER — private day logs the host reads only at night, and the server replays the whole city from the books): secrets in a top-level node readable by the owner (+ the host when it must act);
  the owner's client does the private computation and publishes only the public result; the host falls back after a few seconds
  or at once when the owner is offline; a rules test proves another player cannot read it.

## Audio (the short version; everything else in `docs/audio.md`)
- **MOOD MUSIC** (docs/audio.md): menu screens play the time-of-day mood (`audio/mood.js`, songs in `data/mood-music.json`, built by
  `scripts/build-mood-music.py`; the owner adds songs as late3/morn1/day1/eve1/party1… in ~/Downloads → "add the new mood songs");
  a lobby plays one synced song for the room (`audio/lobby-music.js`, `meta/lm`, the host's clock); City 2.0's party nights play the PARTY deck on the server clock — every phone the same song (`audio/party-music.js`, docs/audio.md#the-party-song-in-sync). CLASSIC in settings = the old playlist.
  **CITY 2.0 MUSIC**: its own day + decks (`core/city-mood.js`, `city2` in `data/mood-music.json`); new songs → `scripts/add-city2-music.py` (docs/audio.md#city-20-music). SKY-B: every mood is a RADIO STATION on the server clock — the same song on every phone (`audio/party-music.js#stationOf`; docs/audio.md#the-radio-stations).
- `playMusic(id, fallback)` is driven by `app.js` from state (mood / menu playlist on title/setup/lobby, `module.MUSIC` in a game, `'victory'` on
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
- **NEON GLASS** (end of components.css): the title's language everywhere — the default for every .btn, .panel, .input, .tag, leaderboard row and podium in every game (no chamfers; the game's accent is the light; no blur in games) — frosted glass, soft white edges, the accent
  as light. `body.nd-glass` restyles menus; sheets are glass on every screen. Toasts are glass pills; confirm-by-second-tap changes the
  button itself, never a toast. Review: `node tests/integration/ui-shots.mjs "<browser>" ./shots-ui`.
- **Player emblems** (`avatar(id, color, size)`): 12 shapes built like the neon sign; size with `--s`. Preview: `tests/integration/avatars-preview.html`.
- Game screens fill `.screen` with `overflow: hidden`; in a game the fixed corner holds two buttons top-right: ☰ menu (+10: CHAT with the
  unread count, HOW TO PLAY, SETTINGS, QUIT TO LOBBY, host END GAME — settings-panel.js#openMenu) and music on/off (+54, music only, effects
  stay); both are 36 pt circles (`--cb`) with an invisible 44 pt tap area (`::after`); headers use `padding-right: 44px`; announcements
  stay clear of it. The title + the lobby SPLIT the corners: ☰ top-LEFT, music top-RIGHT (`body.nd-on` / `body.cb-split`, components.css).
  A full-width game (`.screen.<x>-screen { max-width: none }`) must also pin the column to the screen's edge:
  `body.<x>-on [data-theme] .music-btn, [data-theme] .menu-btn, .gm-panel { right: calc(var(--safe-r) + 12px) }` (gridlock, slip,
  stakes, rum do) — otherwise on desktop the buttons stay at the phone column's edge and land on the game's panels. Element helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)`.

## Adding a game (checklist)
1. **Rules:** `js/games/<id>/logic.js` + `director.js` (pure) → `createGame()` and `nextStep(game, ctx)`; a `tests/<id>.test.mjs` with
   whole-match simulations (2 and 8 players, host-migration replay = the same step twice gives the same patch) **before any UI**.
2. **Contract:** `index.js` exporting what `registry.js` lists (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS, OPTIONS,
   estimateMinutes, finalRanks, nightBonus?, MIN_PLAYERS?) and `createView = lazyView(() => import('./view.js'), gameSheets('<id>'))` (its sheet loads with its screen — anything two games share goes in components.css); register it; add player
   nodes to `ALL_PLAYER_NODES`; `GAMES` in `js/config.js`; `css/<id>.css` + `<link>` in `index.html`; lobby art in `ui/game-art.js`;
   rules in `ui/help.js`; a theme in `css/base.css`; a music id or playlist in `audio/music.js`; THE BOARD: its standings + records in
   `js/core/match-report.js` (with plausibility bounds), its boards in `js/core/boards.js`, its colours in `js/board/view.js#GAME_LIGHT`; its neon mark + blade word for the title city's signs in `js/screens/district/marks.js`.
3. **View on the match kit** (`docs/match-kit.md`): announcer, cards, Call the Winner, the report, tiers, the test hook. The view renders
   purely from `state` (`mount/update/unmount`); write only your own node; check `liveKey`.
4. **Rules file:** `database.rules.json` (own data only, phase/round-gated) + cases in `tests/integration/rules.test.mjs`. **Remind the owner
   to re-publish the rules in the Firebase console.**
5. **E2E on the harness:** `tests/integration/e2e-<id>.mjs` with a `FAST=1` path (2 players, 2 min) and the full path (8 players, host killed,
   refresh, offline player, late joiner, Call the Winner, finish, rematch, frame pacing at 4× CPU). Add it to the smoke test's game list.
6. **Screens** at 390×844, 412×915, 1440×900: three refine passes, looked at, before calling it done. Update ROADMAP.md, this file's
   counts, and write `docs/<id>.md`.

## Testing (the short version; every suite and flag: `docs/testing.md`)
- **THE BUILD MACHINE IS THE MINI PC** (the owner, Oct 30: "do more tests, do things locally"): a Beelink SER8, Windows 11, **32 GB**, Java (Temurin 21)
  → the emulators run HERE. Before EVERY final push run LOCALLY: the unit suite, the rules + `/api` tests, the smoke test (`GAMES=…` for a shared
  file) AND the FULL `e2e-harbor` suite (a City 2.0 pass) — the cloud run then CONFIRMS instead of discovers. Measured on it: unit ≈ 75 s, rules ≈ 27 s,
  smoke `GAMES=cipher` ≈ 38 s, one harbor group ≈ 30–60 s, the full harbor suite: docs/harbor/passes/models.md. **Run the full suite with nothing
  else busy** (no model bakes, no shot bursts beside it: under that load every group timed out "the harbor baked" — MODELS). Browser tests run
  OUTSIDE Claude Code's sandbox (its private AppData copy can't launch Chromium): the local, uncommitted rule in `.claude/settings.local.json`
  (`node tests/integration/e2e-*`, `shots.mjs`, `title-perf.mjs`, `pixdiff.mjs` — run them from the repo root with those paths). Chromium:
  `C:\Users\benja\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`. The laptop is retired (a backup).
- **GitHub checks** (unit → rules → /api → smoke, on the emulators) run **only on a pass's FINAL push** (SP6, the owner's CLOUD MINUTES, Oct 27):
  a game / app pass tags that push's commit **`[ci]`**, a City 2.0 pass **`[harbor]`** (which runs both workflows); pull requests + `gh workflow run tests`
  always run; every other push shows a skipped run (0 minutes) — run the unit suite locally before every push. Next to the Vercel deploy, never
  blocking it. Budget: ≈ 30–40 cloud minutes a pass (tests ≈ 10, the harbor's 8 jobs ≈ 28–34; HOTFIX Oct 29: + perf). Look at `gh run list` after pushing; a red ✗ is a broken main to fix first. Errors from real phones: `/admin`.
- **VERCEL DEPLOYS ONLY TAGGED PUSHES** (the owner's DEPLOYMENT STORAGE, Oct 27: Hobby's 10 GB went at ~300 MB a deploy on every push):
  `vercel.json#ignoreCommand` builds only when the push's **LAST commit message** carries **`[harbor]`**, **`[ci]`** or **`[deploy]`**
  (unlike the GitHub checks, which read every commit of the push) — so a pass makes ONE deployment: its FINAL push carries its tag (as above)
  ON THE TOP COMMIT; anything that must go live mid-pass (a hotfix, a docs-only fix the site shows) goes up with **`[deploy]`** (deploys, runs no
  cloud tests). Every other push shows "Canceled by Ignored Build Step" on Vercel — main stays live on the last tagged deploy.
  `.vercelignore` keeps everything no page or `/api` loads out of the deploy (docs, screenshots, tests, scripts, shots*, art) — a deploy ≈ 264 MB,
  ~255 MB of it the music; a new top-level folder the site loads must NOT match it. Never write a tag in square brackets in a message that
  isn't meant to fire it (a message that NAMES the tags fires them all — write "the ci / harbor / deploy tags").
- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`, 8 parallel jobs): the FULL `e2e-harbor` suite runs only on a pass's FINAL push
  (the harbor tag in a commit message + a City 2.0 file touched) or `gh workflow run harbor` (`-f job=street`). **At most TWO cloud runs a pass**;
  never re-run to confirm a flake. A new test group: its `G()` in `tests/integration/harbor-e2e/<job>.mjs` + its name in exactly one job in
  `harbor-jobs.mjs`. Locally (the mini PC): the touched groups (`ONLY=…`) while working, the FULL suite once before the final push. Full text: docs/harbor.md.
- **THE BASELINE GUARD:** `ONLY=perf` fails above 2× `tests/integration/perf-baseline.json` (`PERF_GUARD=only` ≈ 1.5 min; `PERF_BASELINE=write`
  only when a pass changes the cost on purpose — say so). A cache keyed per frame must hold its whole working set.
- `node --test tests/*.test.mjs` — unit + whole-match simulations of all twelve games, no deps, seconds (+ profiles/boards/XP: `profiles.test.mjs`).
- `/api` on the emulators: `node --test server.test.mjs` (in tests/integration); the whole profile flow: `node e2e-profiles.mjs "<browser>" ./shots-profiles`.
- Emulators (Java + Node): `cd tests/integration && npm install && npm run emulators`; rules: `node --test rules.test.mjs`;
  app: `node scripts/serve.mjs` → `http://localhost:5173/?emu` (`&slot=2`… for more players on one computer).
- **CONN — the database sockets:** `node e2e-conn.mjs "<browser path>" ./shots-conn` (≈ 1.5 min; `MEASURE=1` = the table only, `LINE=1` = each
  state's reasons): 0 sockets on a parked title, 1 in a room, 0 after QUIT + the grace — run it after touching room / boot / firebase.js.
- Smoke test first: `node e2e-smoke.mjs "<browser path>" ./shots` (two regular phones, every game started, no stray "null"; `GAMES=cipher` = only those — the one-game check a City 2.0 pass runs after touching a shared file).
- Per game: `node e2e-<id>.mjs "<browser path>" ./shots-<id>` (env `N=8 SHOTS=0 GPU=1 CPU=4 PERF=0/1 FAST=1`); previews without Firebase:
  `tests/integration/<id>-preview.html`.
- RUMRUNNER's economy: `node scripts/sim-rum.mjs` (bot matches on the real rules, per length) before touching `js/games/rum/tuning.js`.
- Lighthouse (mobile): `npx lighthouse "http://localhost:5173/?emu" --form-factor=mobile --chrome-path="<browser>"` (targets 98–99 / 100 / 100 / 100).

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish (after every rules change).
- Profiles / THE BOARD need Vercel environment variables: `FIREBASE_SERVICE_ACCOUNT` (the service-account key JSON),
  `FIREBASE_DATABASE_URL`, `ADMIN_PIDS` (your profile id), optional `KEY_PEPPER` (set once, never change) — `docs/profiles.md`.
- Authentication → Settings → Authorized domains: `neonspeakeasy.com` (keep the old `games.` / `trivia.loewfizzle.com`, which redirect to it).
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).
