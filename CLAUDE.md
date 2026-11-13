# NEON SPEAKEASY — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each). Thirteen games, **THREE PLAYABLE**: PRISM DROP, OVERCLOCK, HOLD'EM
(`js/config.js` GAMES[].playable is the one switch — the other ten are hidden everywhere, their code + data + rules FROZEN, not deleted;
`sign: true` = THE FIVE SIGNS in the city). Two DAILY-ONLY games (THE PASSWORD, COAST CLEAR) live in `config.js#DAILIES`, never GAMES.
**CITY 2.0 — THE HARBOR — IS THE ONLY CITY** (City 1.0 deleted Nov 5; its code at the tag `city-1.0-final`). Static site on Vercel
(**neonspeakeasy.com**) + Firebase Realtime Database + Anonymous Auth + eight Vercel functions in `/api` (profiles, server-checked results +
HOLD'EM's dealer, THE BOARD, admin, errors, the dailies, the weather, the clock). In code the city is still "the district" (`nd-` prefix,
`window.__district`). The full intro: docs/roadmap-history.md (moved). `ROADMAP.md` = what shipped + what is next.

**THIS FILE IS THE SHORT GUIDE (THE CLAUDE.md DIET, Nov 13):** ≤ 40 KB (`tests/claude-md-size.test.mjs`). A pass adds AT MOST ONE line here per
new standing rule; its detail goes in the doc that owns the area. "(moved)" after a doc = its section **THE RULES FROM CLAUDE.md (moved Nov 13)** —
the full text this file used to hold, verbatim (`scripts/claude-md-coverage.mjs` proves nothing was lost). **Keep this file, ROADMAP.md (one line
per shipped feature; the detail in `docs/roadmap-history.md`) and the relevant `docs/*.md` updated as you work.**

| doc | read it when you touch |
| --- | --- |
| `docs/match-kit.md` | **any real-time game** (the shared HUD + the E2E harness) — before building or changing a game; the add-a-game checklist |
| `docs/cartridge.md` | THE CARTRIDGE PLUG + THE CONTRACT: what a game exports + what the console gives it (`js/games/cartridge.js`) |
| `docs/data-model.md` | the database (every node, every game's `game` shape, rules), the multiplayer mechanics in full, the full file layout |
| `docs/testing.md` | running / writing tests: emulators, smoke, each E2E + its flags, previews, Lighthouse, THE RULES-LAG, the live-site guard |
| `docs/audio.md` | music, playlists, SFX, the audio engine; loading, PWA, service worker, link previews |
| `docs/title.md` | the title (title.js, title-neon, title-taps, title-dock), LIVING CITY, THE STREET, the dock, THE SHELL (the design system) |
| `docs/harbor.md` (+ `docs/harbor/passes/` — its INDEX) | **CITY 2.0 — THE HARBOR**: the bible — size rules, camera, bakes, budgets, THE FILE MAP, KNOWN ISSUES |
| `docs/harbor/decisions.md` | the owner's CURRENT City 2.0 decisions — **read first in a Harbor pass**; Step 0 updates it (`plan.md` = the dated archive) |
| `docs/progression.md` | PROGRESSION (levels, the streak, items, achievements, THE ONE DAY LINE), the daily contract + THE DAILY MODULE, SIGHTINGS |
| `docs/vault.md` | THE VAULT: the cards' art, THE CARD LAB (`docs/vault-lab-marks.md` = the owner's marks, read FIRST), `js/fx/`, emblems, gems |
| `docs/launch.md` | **THE LAUNCH** (THE RESET MORNING, FOUNDING MEMBER) + **THE PRIVATE FLIP** — the owner's steps; the edge cache |
| `docs/profiles.md` | profiles, keys, FRIENDS, passkeys, `/api`, result reporting, THE BOARD, `/board`, `/admin`, the Vercel setup |
| `docs/chat.md` · `docs/content.md` | room chat · adding questions / puzzles / words to any bank |
| `docs/overclock.md` · `docs/prism.md` · `docs/holdem.md` | the three playable games (read before a pass on one) |
| `docs/password.md` · `docs/coastclear.md` | the two dailies (`docs/games/plan.md` = the owner's game decisions) |
| `docs/pulse.md` `docs/golf.md` `docs/slip.md` `docs/gridlock.md` `docs/agent.md` `docs/stakes.md` `docs/rum.md` | that frozen game |

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
  Never read layout (getBoundingClientRect / clientWidth) in a frame loop — sizes come from ResizeObservers (`ui/canvas-safe.js#cssWidth`).
  Everything respects `prefers-reduced-motion`.
- Mobile: `100dvh`, safe-area insets, inputs ≥ 16px, touch targets ≥ 44px. No zoom: `body { touch-action: pan-x pan-y }` +
  iOS `gesturestart` block (the viewport meta deliberately has no `user-scalable=no` — Lighthouse penalizes it).
- **Taps on plain page areas** (a canvas, an empty div): listen to pointerdown + pointerup, never `click` — iOS Safari does not
  send `click` to elements it doesn't consider clickable.
- Contrast: all text ≥ 4.5:1 on its background (`--text-faint` is the dimmest allowed text color).
- The app name is `APP_NAME` in `js/config.js` (plus `<title>`/meta tags in `index.html`).
- **Audio is polish, never a dependency.** Everything must work silently: missing files, locked iOS audio, muted. SFX stay quiet.
- **Visual review:** every new screen gets screenshot-reviewed at 390×844 and 412×915 (plus 1440×900 for anything shown on desktop)
  with at least two refine passes, three for a new game. Look at the screenshots; the data passing is not the screen looking right.
- **PHONE FIRST, UNZOOMED (the owner):** everything must READ ON THE PHONE AS-IS at 390 / 402 / 430 — a detail that can't be seen there is
  NOT built (bigger, bolder, a clear silhouette + one bright accent, or drop it) → docs/harbor.md (moved).
- **DESKTOP COMES FREE:** built + judged for the PHONE only; desktop / iPad / sideways get it through THE DESKTOP CAMERA
  (`core/harbor-layout.js#DESK`) — never a desktop-only piece; every pass checks 1440×900 (`--sizes pass`) → docs/harbor.md (moved).
- **Class names:** prefix new CSS classes per feature (`nd-`, `pd-`, `gl-`…) — a bare `.nl-hi` once collided across features.
- **Presentation tech:** Canvas 2D (+ a WebGL shader for a sky/world) unless 3D *is* the game; a three.js backdrop keeps every button DOM
  over it (GRIDLOCK's 3D board failed its play-test) → docs/match-kit.md (moved).
- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view through an import map that swaps
  `js/firebase.js` for `tests/integration/fake-firebase.js`; the title's = `tests/integration/title-preview.html` (`shots.mjs --preview`).
- **Profiles are polish too:** joining + playing work with `/api` down (no tags, results queue) → docs/profiles.md (moved).
- **Design rules that may conflict:** check feasibility with the real numbers + ask the owner which rule wins BEFORE building.

## Standing rules by area — one line each (the full text: the doc named)

**City 2.0** (the bible `docs/harbor.md`; the full standing-rule text: docs/harbor.md (moved) + #city-20-in-claudemd--the-full-text)
- THE WINDOW RULE: every window moment enters by its own motion or the blind cycle (`core/harbor-moments.js#ENTERS_BY_MOTION`).
- THE WINDOW STANDARD: the shadowboxer + the boss's TV room are the bar — one real light, its shadows, smooth eased motion.
- THE PEOPLE RULE: nobody appears or vanishes in view on the promenade (`core/harbor-witness.js#rejoinVisits`, people.js#guard).
- THE SOLIDS: every solid thing on the promenade is ONE registry (`core/harbor-solids.js`) — every walk goes round it.
- NO LAMPPOSTS: the implied lamps; the light in ONE pure module (`core/harbor-light.js`; `&light=old` for A/B).
- NO TRAFFIC DURING THE LEGENDARIES (`core/harbor-legend.js#trafficHold`); every vehicle planner reads it.
- THE WIND IS ONE STATE (`core/harbor-wind.js` → scene.js#WF once a frame): anything that moves in the wind reads it.
- THE BEAT: the lights follow the song's grid; a TRUSTED GRID ALWAYS PUNCHES; the kicks only calibrate the lead (`core/harbor-beat.js`).
- 3D only as BAKED sprites (`scripts/bake-model.mjs`); lettering nothing passes in front of → THE CRISP LAYER (crisp.js).
- Every force flag has a panel row (`core/harbor-remote.js`; `tests/harbor-remote.test.mjs`). Every canvas through `safeCtx` / `ctx2d` (ui/canvas-safe.js).
- THE CITY TIMETABLE (`core/harbor-schedule.js`) holds EVERY timed thing (`tests/harbor-sched-strays.test.mjs`; THE GOLDEN TABLE
  `tests/fixtures/sched-golden.mjs` proves a move changed nothing); THE SHOWCASE DIAL, THE DAY CHART (/daychart), THE TIER TABLE (`core/harbor-tiers.js`) for every NEW per-phone number.
- THE WINDOW SCENES ARE TIMETABLE ROWS: a NEW scene = its `scene.<id>` row + `core/harbor-<id>.js` + its painter in windows.js#SCENE_PAINT.
- THE RADIO: a timetable row with a `jack` = a jack on the desk; the SERVER checks the ROLE per action (`core/harbor-radio.js#ROLES`); a fired
  moment plays ONCE; only a server yes loads the radio (radio-gate.js); ONE RADIO PER LOBBY.
- THE LOAD: the boot screen holds until THE CITY's reveal (ONE fade — keep index.html #boot + title.css .nd-sign in step); ONE CAMERA ON SCREEN;
  THE BOOT BUDGET (`tests/integration/boot-budget.json` — raising it = a named decision); THE BOOT PRELOAD = `node scripts/build-boot-preload.mjs`
  after a module's imports change; no audio before a tap → docs/harbor.md#performance.
- THE BOOT WATCHDOG (inline in index.html, `window.__boot` — ONE reload, never a loop); THE REJOIN LIMIT (≤ 8 s on screen); EVERY dynamic import
  through THE SKEW WRAPPER (`lazyImport(import('./x.js'), 'x')` — `tests/lazy-import.test.mjs`); boot gates in VISIBLE time (ui/onscreen.js); no regex lookbehind.
- THE BOX GATE: every camera / box change through ONE gate (scene.js#boxCheck) — never a second canvas resize; NO TWO CAMERAS (`wk-double.mjs`;
  a new path = its row in `tests/integration/kit/two-cameras.mjs`).
- THE LONG NIGHT's RULE: every module the scene creates is destroyed in scene.js#destroy(), its canvases freed at once (`ui/canvas-safe.js#freeCanvases`).
- THE CITY'S IDLE POLLS: every call = an edge request — only from a tab on screen AND focused, ≥ 5 min; a new idle poll = a named decision (`tests/cdn-hotfix.test.mjs`) → docs/launch.md (moved).
- Debug + preview flags: `&debug=1`, `&dpr=3`, `&bench=1` (THE PHONE BENCH), `&force=…` (a legendary waits for the reveal + a tap; `&lgnow=1` at once).
- A holiday SIGN FORCE (`&force=sign-*`) shows the FULL look any day, in season too; THANKSGIVING = the maple leaves BEHIND the letters + THE GOLD WEEK (`leafbank.js`) → docs/harbor.md.
- THE TRI-VISION: the roof board turns HOLD'EM ↔ JAYWALK by ONE pure clock (`core/harbor-trivision.js`) → docs/harbor.md (moved).

**The console + the room** (→ docs/harbor.md (moved), docs/cartridge.md, docs/title.md)
- THE ROOM IN THE CITY: the old lobby screen is RETIRED — the room lives in the city from the join to the podium (`screens/room-city.js`,
  `core/harbor-room.js`, `core/room-show.js`); ONE SHEET STACK (`ui/layers.js` — every pop-up opens on top).
- MAKE HOST (`room.js#makeHost` — to an ONLINE player); ONE ACCOUNT, ONE ROOM (`seats/{pid}` — `js/seat.js`); NAME + COLOUR edited only at the top of CUSTOMIZE YOUR CARD.
- THE CONTRACT: a game = `meta.js` (PURE, no imports) + its cartridge `index.js` loaded ON DEMAND (`games/registry.js#loadGame` — never a static
  game import); `preload` ≤ 1.5 MB; the kit in `js/games/kit/` (prefix `gk-`) → docs/cartridge.md (moved).
- A cartridge's module graph is preloaded (`js/games/preload.js` + the GENERATED `preload-graph.js` — `node scripts/build-preload-graph.mjs` after a game's imports change).
- A game's podium music = `FINAL_MUSIC` in its index.js; THE GAME LOOK = `body[data-look]` (`kit/look.js`) — games read it LIVE, no switch of their own.
- THE STALE-MODULE RULE (FR7 FIXES C2): a LAZY chunk never imports a boot-graph module for a NEW export — it reads a hub that module registers (NOW PLAYING → `globalThis.__nsNowPlaying`); a face that fails to load says TAP TO RETRY + reports it → docs/audio.md.
- THE TAP WATCH (`js/ui/tapwatch.js`, always on): never re-render a control under a finger; every `:hover` behind `@media (hover: hover)` → docs/title.md (moved).
- COLOUR-BLIND: right / close = `--good` / `--close` only, NEVER by colour alone (a shape / mark too); `body[data-cb]` → docs/title.md (moved).
- EVERYONE TIED = a DRAW for every game (`core/night.js#nightPoints`); every corner button's tap area 44 × 44 (harbor `tapfit`).

**Profiles, progression, THE BOARD** (→ docs/progression.md, docs/profiles.md — both (moved))
- PROGRESSION: XP, levels, the streak, items, achievements, FOUNDER are written by the SERVER only (one transaction through the PURE steps in
  `core/progress.js`); collections show ONLY what a player owns; board ids use dashes (`cipher-score`), never dots.
- THE ONE DAY LINE (FR7 FIXES C): every match / daily is credited by its MATCH TIME on the 4 am America/New_York streak day — the streak, the
  week, the ceiling, NEW GAME TONIGHT, the boards; nothing before `progress/resetAt` is paid → docs/progression.md#the-one-day-line.
- EVERY XP PAYMENT through `core/progress.js#payXp` + its board row in the SAME update; DAILY POINTS = ONE table (`core/daily-points.js`).
- THE DAILY CEILING (20 counted room matches a streak day); THE RESET EPOCH (`progress/resetAt`); HOST-GRADED OVERCLOCK → docs/progression.md (moved).
- THE BOARD shows REAL USERNAMES (a rude one → its HOUSE NICKNAME, `api/_lib/lb.js#publicName`) — never a pid / key / tag digits; listed from
  the 3rd COUNTED PLAY (`core/progress.js#countedPlays`); a public row = `api/board.js#ROW_KEYS`.
- THE REAL PLAYER COUNT: anything the server PAYS BY A COUNT takes it from what it can verify (`api/report.js`); A SEAT IS NOT A PLAY (`PROOF_TREES`).
- Anti-cheat never depends on the code being secret: the server checks + replays every result; secrets only in Vercel's env.
- ITEM NAMES ONLY TO OWNERS (`api/_lib/catalog.js` + `lab-text.js`, never served; `tests/vault-names.test.mjs`) — ONE named exception: the WORN card's name on THE PLAYER PAGE (`card.cn`).
- FRIENDS: `pfr/{pid}` server-written, its owner reads it (`core/friends.js#friendStep`); PASSKEYS (`api/_lib/passkeys.js`, the RESTORE KEY stays the fallback) → docs/profiles.md (moved).
- SLIM CARDS EVERYWHERE A PLAYER LIST SHOWS — only through `ui/strip-board.js` (never a second strip system).

**THE VAULT** (→ docs/vault.md (moved))
- EMBLEMS + GLOWS MOVE ON THE COMPOSITOR (`js/vault/emblem-art.js` — never a CSS animation on an SVG element); THE PROMINENCE RULE is the budget.
- A FULL CARD ON TOP HOLDS EVERYTHING BEHIND IT — every full card through `vault/full.js#openFullCard`.
- THE CARD LAYOUT RULE (`js/vault/layout.js`) + THE CARD TEXT STANDARD; THE SLIM-CARD LONG-NAME STANDARD (`NAME_MAX` 12); THE HERO-SPOT RULE (`js/vault/hero.js`).
- NO BLACK TILES: a card drawn in code = a baked still (`js/vault/stills.js` + `node scripts/build-card-stills.mjs`).
- THE GIFT CARDS: 1-of-1, given ONLY by the owner's `/admin → GIFTS`; the DEV cards the owner's only (`js/core/dev-cards.js`); a MEMBER Nº is server-only.
- A pass that edits a lab item's art bumps `js/vault/catalog.js#LAB_V` + writes its line in `api/_lib/lab-text.js#LAB_CHANGES`.
- An unknown path gets THE WRONG DOOR (`404.html` — keep vercel.json free of rewrites).

**The dailies** (→ docs/progression.md (moved), docs/password.md, docs/coastclear.md)
- A daily = its cartridge + ONE row in `config.js#DAILIES` (+ its server half in `api/_lib/dailies.js#SERVER_CARTS`) — PLUG-AND-PLAY, no fixed count.
- THE SERVER JUDGES every guess / move; answers + boards + THE DAILY SECRET live ONLY in the database (`tests/daily-secrets.test.mjs`) — never the pepper.
- A RUN KEEPS ITS OWN DAY (`js/daily/run-day.js`); THE THROWAWAY GATE; the phone side on the kit (`js/daily/` — never a copy in a game).
- THE GO-LIVE SWITCH + THE RESEED = /admin → THE DAILIES (owner-only); NO PILLS on the dailies; every colour a `--pw-*` / `--cc-*` token.

**The games** (read the game's doc before a pass on it)
- OVERCLOCK: its timings are the owner's (pinned by tests); NO SIDEWAYS SCROLL, EVER; right = green, wrong = red + cracked, NO ✓ / ✕; the
  pools are BUILT (never edit `data/oc/*.json` by hand — `node scripts/oc-pools/build.mjs`) → docs/overclock.md (moved).
- PRISM DROP: never the words "Tetris", "tetromino" or "T-spin"; THE ANTI-CHEAT RULES A PASS MUST KEEP (the board node's write window) → docs/prism.md (moved).
- HOLD'EM: the engine PURE + DETERMINISTIC; THE SERVER IS THE DEALER (the deck only in `hrec/{CODE}`); PLAY CHIPS ONLY — no money words;
  ANIMATIONS COME FROM THE STATE; THE PORTRAIT IS UNTOUCHED by sideways CSS → docs/holdem.md (moved).

**Deploy, launch + safety** (→ docs/testing.md (moved), docs/launch.md (moved))
- NEVER THE LIVE SITE: tests + repros on the emulators (`kit/live-guard.mjs`; `LIVE=1` on purpose only).
- THE RULES-LAG: every write through `firebase.js#write`; a rules change fails `tests/rules-live.test.mjs` until its ack names it, and the pass
  summary's FIRST line says RE-PUBLISH + how; a feature on a new rule keeps a fallback that works on the old one.
- THE EDGE CACHE is live (one copy per deploy); THE FROZEN SONGS OUT OF DEPLOYS (`.vercelignore`); pass screenshots stay out of git (`tests/repo-growth.test.mjs`).
- ONE DEPLOY AT A TIME: a phone never runs two deploys' code — `sw.js` pins every page to its build (lazy chunks too; gone → ONE reload, never mid-match) → docs/harbor.md#one-deploy-at-a-time.

## Working efficiently (what cost the most in past sessions)
- **Edits:** use the Edit tool or a script file in the scratchpad. Never put code with backticks, `$` or `\b` inside an inline
  `node -e "…"` / heredoc — the shell mangles it and the repair costs more than the edit.
- **Names:** a view's own `update(state)` shadows Firebase's `update` — import it as `dbUpdate` (RUMRUNNER lost its DONE writes to this).
- **Tests, in order:** `node --test tests/*.test.mjs` (seconds) → the game's `FAST=1` E2E (≈ 2 min) → the full suite once before
  committing. Don't re-run a 20-minute suite to check one fix. Run E2E suites with absolute paths and from `tests/integration`.
  The city runs in the HARBOR suite by group while iterating: `ONLY=core,dock,neon`; the whole suite once before the commit.
- **Look reviews:** `node tests/integration/shots.mjs "<browser>" --scenes night,day,halloween --sizes phones --crop dock` (`--cast <ms>` = every
  painted frame). Never write a one-off screenshot script — add a scene or crop preset to shots.mjs. "No look change" = `tests/integration/pixdiff.mjs`
  (A/B against a worktree on :5174); City 2.0's speed gate = `title-perf.mjs --ab`.
- **Waits in tests:** wait for the actual condition (`waitFor(page, js)`), never a fixed sleep "to be safe".
- **Line endings:** LF everywhere (`.gitattributes`). **A new game = rules first** (pure `logic.js` + `director.js` + a whole-match simulation before any pixel).
- Run `git status` before committing: stage the files of this task only (other work may be in the tree).

## File layout (top level — the full map: docs/data-model.md (moved); the city's: docs/harbor.md#the-file-map; each game's: its doc)
```
index.html sw.js manifest.webmanifest assets/   shell, service worker (network-first, same-origin static, never /api), PWA, icons, og.jpg
board.html admin.html lab.html daychart.html 404.html   /board, /admin, /lab, /daychart, THE WRONG DOOR
api/ (8 functions) + api/_lib/ + api/_data/      profile report board admin log sky time daily — firebase-admin, server-only data
css/  base components screens title kit board admin vault progress daily chat + <game>.css   tokens, THE SHELL, screens, games
js/config.js firebase-config.js firebase.js      APP_NAME, GAMES + DAILIES / the web config / init + db helpers + serverNow() + want/release
js/identity.js store.js room.js host.js app.js seat.js wakelock.js errlog.js   slots / state / rooms + presence / the host loop / the router
js/core/          PURE (server + client): room logic, progress, streak, week, levels, items, achievements, boards, match-report, harbor-*.js
js/screens/       title (+ -neon -taps -dock), room-city / -dock / -guests / game-options / room-banner, daily, harbor/ (THE city)
js/ui/ js/audio/ js/profile/ js/progress/ js/vault/ js/fx/ js/board/ js/admin/ js/chat/ js/daily/ js/daychart/ js/trivia/
js/games/registry.js cartridge.js preload.js kit/ <id>/   the contract, THE MATCH KIT, each game (logic.js director.js meta.js index.js view.js)
data/ audio/ scripts/ database.rules.json        banks + analyses, music + sfx, builders + serve.mjs (:5173, `--emu`), the RTDB rules
tests/*.test.mjs  tests/integration/  tests/fixtures/   unit + sims (node --test), E2E + harbor suite + rules + /api tests + previews
```

## Data model (the shared core; every node and every game's `game` shape: `docs/data-model.md`)
```
rooms/{CODE}/       ← CODE = the HUSH WORD (a common 4-letter word; docs/content.md); hush/{WORD}: { closedAt } rests it 24 h after closing
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, locked?, settings/{gameId}: {...}, go?, back? }
  rv/{uid}:  matchId                                         ← THE REMATCH VOTE
  players/{uid}:  { name, color, avatar, joinedAt, pid?, ln?, dy? }    ← written by that player only
  presence/{uid}: { online, lastSeen, v: 2, c: { connId } } ← ONE CHILD PER CONNECTION: online = any c child left
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape; totals are always DERIVED from results (never stored) so a replayed step can't double-score
  night/{matchId}:   { g, p: { uid: 3|2|1|0 }, n: { uid: name }, b?: { uid: bonus }, at }  ← host; game-night scoreboard
  <game nodes>/{matchId}/…/{uid}                              ← a player's own data for the current step, phase-gated by the rules
chats/ fleets/ glsonar/ spy/ hsbet/ rrp/ seal/ hole/ {CODE}   ← top level, NOT readable like rooms/ (seal = THE SEAL; hole = HOLD'EM's cards; hrec/ server only)
city2/live  seats/{pid}  profiles/{pid}  uids/{uid}  pstats/{pid}  lb/ results/ ppriv/ pkeys/ tags/ rl/ audit/ flags/ (server only)  ← docs/profiles.md
```
Rules of thumb: a player writes only under their own uid; anything secret lives outside `rooms/`; the host wipes `ALL_PLAYER_NODES`
(registry.js) at match start/end; obfuscate (`core/obfuscate.js`) what must not be readable in plain sight.

## Multiplayer mechanics (the full text: docs/data-model.md (moved))
- **THE PARKED DATABASE:** the socket opens only when wanted — `firebase.js#want(reason)` / `release(reason)`; a feature that reads the database
  OUTSIDE a room must `want()` / `release()` its own reason; never parked while in a room. `state.net`: only `lost` shows SIGNAL LOST.
- **Identity + rejoin:** an anonymous Firebase user per *slot* (phones are slot 1); `localStorage na:{slot}:session` → `resumeSession()`.
- **Presence — ONE CHILD PER CONNECTION** (`presence/{uid}/c/{connId}`; every reader through `normalizePresence`). Offline players stay as "SIGNAL LOST".
- **Host migration** (`core/room-logic.js#shouldClaimHost`): in a game the `meta.hostBeat` (every 2 s, stale ≥ 10 s) ALONE decides; claims staggered by join order.
- **Director:** `host.js` ticks every 250 ms → `module.prepare()` + `module.step(game, ctx)`; a step may carry `$room` side writes; `final` writes `night/{matchId}`.
- **Live player data:** `livePaths(game)` → `state.live`; directors + views check `state.liveKey` before trusting `live`.
- **THE SEAL** (`games/kit/seal.js`): a round's secrets in `seal/{CODE}/…` until `game/unseal`; the privacy pattern for hidden data — docs/data-model.md.
- Idle rooms close after an hour without a game (`ROOM_IDLE_MS`); `rematch()` deals late joiners in; `MIN_PLAYERS` + an option's `when(onlineCount)`.

## Audio (the short version; everything else in `docs/audio.md`)
- MOOD MUSIC (`audio/mood.js`); City 2.0's stations play on the server clock — every phone the same song (`audio/party-music.js#stationOf`).
- `playMusic(id, fallback)` driven by `app.js` from state; `sfx(name)` for the shared effects; a game's own palette in its `createSfx()`.
- THE IDLE CUTOFF (`audio/idle.js`) — never during a match. Audio is unlocked by a gesture (iOS); the engine retries on every tap.
- New songs: `scripts/add-city2-music.py` (City 2.0) — bump `music.js#REV` when replacing a file; never change a song element's playbackRate.

## Design system (the full text: docs/title.md (moved) + "THE SHELL")
- Tokens in `css/base.css :root` (`--bg-0..3`, `--text/-dim/-faint`, the neons, per-game `--accent*`); fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono`, `--font-num` (use for all numbers). `body[data-theme=<id>]` re-maps the accents in a game.
- **THE SHELL — ONE builder each, a screen never keeps its own copy (`tests/shell.test.mjs`):** THE NEON TUBE = every button (`tubeButton()`,
  ONE pink MAIN a screen) · THE SHEET = every pop-up (`ui/sheet.js#openSheet`, the ONE Esc in `ui/layers.js`) · THE ROW (`row()` + `ICONS`) ·
  THE MESSAGE (`toast()`). Gold is a vault / card accent only — never a button.
- **THE CORNER BUTTONS ARE SPLIT ON EVERY SCREEN:** ☰ TOP-LEFT, music TOP-RIGHT, 36 pt with a 44 pt tap area; every header makes room with
  `var(--cb-room)`; a full-width game pins BOTH to the screen's edges. Helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)`.

## Adding a game (the full checklist: docs/match-kit.md (moved))
1. **Rules:** pure `logic.js` + `director.js` + `tests/<id>.test.mjs` whole-match sims (2 + 8 players, a replayed step = the same patch) BEFORE any UI.
2. **Contract:** `meta.js` + `index.js` (docs/cartridge.md), registered; `ALL_PLAYER_NODES`; `GAMES` in config.js; its css, art, help, theme, music,
   THE BOARD's standings (`core/match-report.js` with plausibility bounds) + boards (`core/boards.js`), its neon mark (`core/marks.js`).
3. **View on the match kit** (`docs/match-kit.md`) — renders purely from `state`, writes only its own node, checks `liveKey`.
4. **Rules file** + cases in `tests/integration/rules.test.mjs` — remind the owner to re-publish.
5. **E2E** `tests/integration/e2e-<id>.mjs` (`FAST=1` + the full path); add it to the smoke test. 6. **Screens** at three sizes, three refine passes; docs.

## Testing (the short version; every suite + flag: `docs/testing.md` (moved))
- **YOUR OWN SERVERS:** every pass starts its OWN fresh emulators + `scripts/serve.mjs --emu` (a leftover stopped first) and STOPS every server
  it started as its LAST step (the summary says so).
- **THE BUILD MACHINE IS THE MINI PC** (Beelink SER8, 32 GB, Java): before EVERY final push run LOCALLY the unit suite, the rules + `/api` tests,
  the smoke test AND the FULL `e2e-harbor` suite (a City 2.0 pass) with nothing else busy. Browser tests run OUTSIDE the sandbox; every browser
  script imports puppeteer from `tests/integration/kit/puppeteer.mjs`. Chromium: `C:\Users\benja\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`.
- **GitHub checks + the harbor cloud run only on a pass's FINAL push** — the top commit tagged `[ci]` (a game / app pass) or `[harbor]` (a city
  pass); at most TWO cloud runs a pass, never re-run to confirm a flake. A new harbor group: its `G()` + its name in exactly one job in `harbor-jobs.mjs`.
- **VERCEL DEPLOYS ONLY TAGGED PUSHES:** the LAST commit message of the push carries `[harbor]`, `[ci]` or `[deploy]` (a mid-pass hotfix) — ONE
  deployment a pass. Never write a tag in square brackets in a message not meant to fire it (write "the ci / harbor / deploy tags").
- Unit: `node --test tests/*.test.mjs`. Rules: `node --test rules.test.mjs`; `/api`: `node --test server.test.mjs` (both in tests/integration,
  on the emulators: `npm run emulators`). Smoke: `node e2e-smoke.mjs "<browser>" ./shots` (`GAMES=…`). Sockets: `e2e-conn.mjs`. Per game:
  `e2e-<id>.mjs` (`FAST=1`). `ONLY=perf` = THE BASELINE GUARD. App: `node scripts/serve.mjs` → `http://localhost:5173/?emu`.

## Firebase setup notes
- Console → Build → Realtime Database (create), Authentication → Sign-in method → **Anonymous: enable**.
- Paste `database.rules.json` into Realtime Database → Rules → Publish (after every rules change).
- Profiles / THE BOARD need Vercel environment variables: `FIREBASE_SERVICE_ACCOUNT` (the service-account key JSON),
  `FIREBASE_DATABASE_URL`, `ADMIN_PIDS` (your profile id), optional `KEY_PEPPER` (set once, never change) — `docs/profiles.md`.
- Authentication → Settings → Authorized domains: `neonspeakeasy.com` (keep the old `games.` / `trivia.loewfizzle.com`, which redirect to it).
- Web config goes in `js/firebase-config.js` (public by design; the rules are the security).
