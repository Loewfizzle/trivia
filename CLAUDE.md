# NEON SPEAKEASY — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each). Fifteen games, **FIVE PLAYABLE**: PRISM DROP, OVERCLOCK, HOLD'EM, JAYWALK, HIGH RISE
(`js/config.js` GAMES[].playable is the one switch — the other ten are FROZEN (`config.js#FROZEN_IDS`, never loaded — docs/cartridge.md "THE FROZEN
CONTRACT"), code + data + rules kept; JAYWALK live since Nov 17: docs/jaywalk.md; HIGH RISE since Nov 20, on the city's signs since CITY PART 1: docs/highrise.md). Three DAILY-ONLY games (THE PASSWORD, COAST CLEAR + THE DROP — PRISM DROP's, its row OFF) live in `config.js#DAILIES`, never GAMES.
**CITY 2.0 — THE HARBOR — IS THE ONLY CITY** (City 1.0 deleted Nov 5; its code at the tag `city-1.0-final`). Static site on Vercel
(**neonspeakeasy.com**) + Firebase Realtime Database + Anonymous Auth + eight Vercel functions in `/api` (profiles, server-checked results +
HOLD'EM's dealer, THE BOARD, admin, errors, the dailies, the weather, the clock). In code the city is still "the district" (`nd-` prefix,
`window.__district`). The full intro: docs/roadmap-history.md (moved). `ROADMAP.md` = what shipped + what is next.

**THIS FILE IS THE SHORT GUIDE (THE CLAUDE.md DIET, Nov 13):** ≤ 40 KB (`tests/claude-md-size.test.mjs`); CITY I's TRIM (Nov 18) took it to ~32 KB — keep it near there (a game's / an area's long lines live in its doc). A pass adds AT MOST ONE line here per
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
| `docs/title.md` | the title (title.js, title-neon, title-taps, title-dock), the dock, THE SHELL (the design system), THE NEON TABS, the tap rules |
| `docs/harbor.md` (+ `docs/harbor/passes/` — indexed in its "THE PASS LOGS") | **CITY 2.0 — THE HARBOR**: the bible — size rules, camera, bakes, budgets, THE FILE MAP, KNOWN ISSUES |
| `docs/harbor/decisions.md` | the owner's CURRENT City 2.0 decisions — **read first in a Harbor pass**; Step 0 updates it (`plan.md` = the dated archive) |
| `docs/progression.md` | PROGRESSION (levels, the streak, items, achievements, THE ONE DAY LINE), the daily contract + THE DAILY MODULE, SIGHTINGS |
| `docs/vault.md` | THE VAULT: the cards' art, THE CARD LAB (`docs/vault-lab-marks.md` = the owner's marks, read FIRST), `js/fx/`, emblems, gems |
| `docs/backup.md` | **THE NIGHTLY BACKUP** — the export, the two copies, the restore, a leaked token |
| `docs/launch.md` | **THE LAUNCH** (THE RESET MORNING, FOUNDING MEMBER) + **THE PRIVATE FLIP** — the owner's steps; the edge cache |
| `docs/profiles.md` | profiles, keys, FRIENDS, passkeys, `/api`, result reporting, THE BOARD, `/board`, `/admin`, the Vercel setup |
| `docs/chat.md` · `docs/content.md` | room chat · adding questions / puzzles / words to any bank |
| `docs/overclock.md` · `docs/prism.md` · `docs/holdem.md` | the three playable games (read before a pass on one) |
| `docs/jaywalk.md` | **JAYWALK**: the engine, the replay + the proof node, THE SOLO GAME + its anti-cheat, THE LAB (/jaywalk-lab), THE DAILY |
| `docs/highrise.md` | **HIGH RISE** (LIVE since THE GO-LIVE, Nov 20 — the rules, the two looks, the cartridge + THE MATCH, THE SWITCH ON, THE SIGN HOLD (lifted, CITY PART 1), THE POSTER share card; every pass indexed there) |
| `docs/password.md` · `docs/coastclear.md` · `docs/prism.md` "THE DROP" | the three dailies (`docs/games/plan.md` = the owner's game decisions) |
| `docs/pulse.md` `docs/golf.md` `docs/slip.md` `docs/gridlock.md` `docs/agent.md` `docs/stakes.md` `docs/rum.md` | that frozen game |

## Ground rules
- **THE ADD-ON INBOX:** every pass reads `C:\Users\benja\Downloads\NEON\ADDONS.md` at its START, after each group's commit and before its
  final tests; it builds only OPEN entries addressed to its pass (or its game's earlier / next pass) as its next group and marks each
  '✓ done <time> (<commit>)'; an entry that arrives after the final tests started stays OPEN, is named in the summary, and the game's next
  pass builds it. Never edit or delete others' entries. Rules at the top of that file.
- **NEVER STOP TO ASK (the owner is on his phone):** obvious + established-pattern calls → do + name them; a genuinely new owner call → skip it,
  list it under OPEN FOR BEN + the inbox; finish, push, notify.
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
- **Visual review:** every new screen gets screenshot-reviewed at `--sizes pass` (the phones + 1440×900) with at least two refine passes,
  three for a new game. Look at the screenshots; the data passing is not the screen looking right.
- **PHONE FIRST, UNZOOMED (the owner):** everything must READ ON THE PHONE AS-IS at 390 / 402 / 430 — a detail that can't be seen there is
  NOT built (bigger, bolder, a clear silhouette + one bright accent, or drop it) → docs/harbor.md (moved).
- **DESKTOP COMES FREE:** built + judged for the PHONE only; desktop / iPad / sideways get it through THE DESKTOP CAMERA
  (`core/harbor-layout.js#DESK`) — never a desktop-only piece; every pass checks 1440×900 (`--sizes pass`) → docs/harbor.md (moved).
- **Class names:** prefix new CSS classes per feature (`nd-`, `pd-`, `gl-`…).
- **Presentation tech:** Canvas 2D (+ a WebGL shader for a sky/world) unless 3D *is* the game; a three.js backdrop keeps every button DOM
  over it (GRIDLOCK's 3D board failed its play-test) → docs/match-kit.md (moved).
- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view through an import map that swaps
  `js/firebase.js` for `tests/integration/fake-firebase.js`; the title's = `tests/integration/title-preview.html` (`shots.mjs --preview`).
- **Profiles are polish too:** joining + playing work with `/api` down (no tags, results queue) → docs/profiles.md (moved).
- **Design rules that may conflict:** check feasibility with the real numbers + ask the owner which rule wins BEFORE building.

## Standing rules by area — one line each (the full text: the doc named)

**City 2.0** (the bible `docs/harbor.md`; the full standing-rule text: docs/harbor.md (moved) "CITY 2.0 IN CLAUDE.md")
- THE WINDOW RULE: every window moment enters by its own motion or the blind cycle (`core/harbor-moments.js#ENTERS_BY_MOTION`).
- THE WINDOW STANDARD: the shadowboxer + the boss's TV room are the bar — one real light, its shadows, smooth eased motion.
- THE PEOPLE RULE: nobody appears or vanishes in view on the promenade (`core/harbor-witness.js#rejoinVisits`, people.js#guard).
- THE SOLIDS: every solid thing on the promenade is ONE registry (`core/harbor-solids.js`) — every walk goes round it.
- NO LAMPPOSTS: the implied lamps; the light in ONE pure module (`core/harbor-light.js`; `&light=old` for A/B).
- NO TRAFFIC DURING THE LEGENDARIES + THE FIREWORKS (`core/harbor-legend.js#trafficHold`); every vehicle planner reads it.
- THE WIND IS ONE STATE (`core/harbor-wind.js` → scene.js#WF once a frame): anything that moves in the wind reads it.
- THE BEAT: the lights follow the song's grid; a TRUSTED GRID ALWAYS PUNCHES; the kicks only calibrate the lead (`core/harbor-beat.js`).
- 3D only as BAKED sprites (`scripts/bake-model.mjs`); lettering nothing passes in front of → THE CRISP LAYER (crisp.js).
- The city's module rules — every force flag a panel row + every canvas through `safeCtx` · THE CITY TIMETABLE (every timed thing; THE GOLDEN TABLE) · THE WINDOW SCENES ARE TIMETABLE ROWS · THE RADIO (the server checks the ROLE) · THE LOAD + THE BOOT BUDGET + THE BOOT PRELOAD · THE BOOT WATCHDOG · THE REJOIN LIMIT · EVERY dynamic import through THE SKEW WRAPPER (`lazyImport`) · THE BOX GATE + NO TWO CAMERAS · THE LONG NIGHT's RULE · AWAY, LIGHT · THE ONE-STALL RULE · THE CITY'S IDLE POLLS · the debug flags · the SIGN FORCE · THE TRI-VISION · THE SIGNS → docs/harbor.md "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)".

**The console + the room** (→ docs/harbor.md (moved), docs/cartridge.md, docs/title.md)
- THE ROOM IN THE CITY: the old lobby screen is RETIRED — the room lives in the city from the join to the podium (`screens/room-city.js`,
  `core/harbor-room.js`, `core/room-show.js`); ONE SHEET STACK (`ui/layers.js` — every pop-up opens on top).
- LEAVE ON THE DOCK (CITY H1): the room dock's left ring + ☰'s top row; EVERY way out = ONE sheet (`ui/leave-sheet.js`, never TAP AGAIN); INVITE tops GUESTS → docs/title.md.
- NEVER A DEAD SCREEN (CITY H2): a route with nothing to render → the city at once + COUNTED (`app.js#dead`, quiet kind 'dead').
- THE GAMES LIST ORDER (CITY H2): most DIFFERENT players in 14 days first, a game's first 14 days on top + NEW (`core/game-order.js`); worked once a streak day, the ORDER only in the cached ?live=1 → docs/progression.md.
- MAKE HOST (`room.js#makeHost` — to an ONLINE player); ONE ACCOUNT, ONE ROOM (`seats/{pid}` — `js/seat.js`); NAME + COLOUR edited only at the top of CUSTOMIZE YOUR CARD.
- REMATCH IN PLACE (CITY G): the end screen's REMATCH = the 'r' start (`host.js#rematch({ inPlace })`) — no city / room / walk on any phone; a podium vote only while its end screen is up → docs/cartridge.md.
- THE FROZEN CONTRACT: `config.js#FROZEN_IDS` — never loaded, logic + sims kept, views not maintained (docs/cartridge.md); a start's frame checked (host.js).
- THE ONE META MODULE (CITY PART 1): every playable game's boot meta = ONE ROW in `js/games/metas.js`; its `meta.js` re-exports the row — a new game = a row, never a boot module → docs/cartridge.md.
- THE CONTRACT: a game = `meta.js` (PURE, no imports) + its cartridge `index.js` loaded ON DEMAND (`games/registry.js#loadGame` — never a static
  game import); `preload` ≤ 1.5 MB; the kit in `js/games/kit/` (prefix `gk-`) → docs/cartridge.md (moved).
- A cartridge's module graph is preloaded (`js/games/preload.js` + the GENERATED `preload-graph.js` — `node scripts/build-preload-graph.mjs` after a game's imports change) — only the room's PICKED game (`room-city.js#pickedGame`; THE PER-GAME BUDGET `tests/integration/game-budget.json` — THE PROOF PASS's NAMED RAISE: JAYWALK + HIGH RISE 2,450 / 2,500 → **2,600 KB** each (now 2,471 / 2,513: the line was full, the shared proof modules took ~21 KB; ~90–130 KB of room so the next game's listing at boot fits); the others ~90 KB under theirs; THE BOOT (CITY PART 1): 304 of 310 modules, `js/games` at boot 25.0 of 30 KB, the bytes ~1.6 KB under the line).
- A game's podium music = `FINAL_MUSIC` in its index.js; THE GAME LOOK = `body[data-look]` (`kit/look.js`) — games read it LIVE, no switch of their own.
- HOW TO PLAY = a LAZY chunk through ONE opener (`ui/help-open.js` — the frame at the tap, TAP TO RETRY); never a static import of help.js (`tests/help-lazy.test.mjs`).
- THE STALE-MODULE RULE (FR7 FIXES C2): a LAZY chunk never imports a boot-graph module for a NEW export — it reads a hub that module registers (NOW PLAYING → `globalThis.__nsNowPlaying`); a face that fails to load says TAP TO RETRY + reports it → docs/audio.md.
- A SCREEN ON TOP OF THE CITY OWNS THE TOUCH: the city answers a touch only through `title-taps.js#covered` (`ui/layers.js#cityCovered` — a layer open · the city held · a touch begun off the city: `touchInCity` = the root, its ancestors, the scene's wrap); never a per-screen class list → docs/title.md.
- THE NEON TABS (CITY E): every tab row on THE BOARD + STATS / /admin's stats through ONE builder (`ui/neon-tabs.js` — neon-underline, built once, set in place) → docs/title.md.
- THE TAP WATCH (`ui/tapwatch.js`): EVERY TAP ACTS on its press + lift (`data-press` + `PRESS_IMPLICIT`); a Safari-gesture control = `data-gesture`, acted in the lift; never re-render under a finger; a fling-stop never acts; `:hover` only in `@media (hover: hover)` → docs/title.md.
- COLOUR-BLIND: right / close = `--good` / `--close` only, NEVER by colour alone (a shape / mark too); `body[data-cb]` → docs/title.md (moved).
- EVERYONE TIED = a DRAW for every game (`core/night.js#nightPoints`); every corner button's tap area 44 × 44 (harbor `tapfit`).
- THE END NEON (CITY PART 2): every end screen's header (`<GAME> · SOLO / MATCH`, the name in its sign's colours) + result line (the accent; a win GOLD) through ONE builder (`ui/fin-neon.js`; ONE row per game: `metas.js` NEON) → docs/match-kit.md.
- GAME VOTES (CITY PART 2): a guest's vote = `rooms/{CODE}/gv/{uid}` { g, at } (lobby only, suggestions — the host picks; MOST WANTED = one tap); the start clears them in its OWN write → docs/data-model.md.

**Profiles, progression, THE BOARD** (→ docs/progression.md, docs/profiles.md — both (moved))
- PROGRESSION: XP, levels, the streak, items, achievements, FOUNDER are written by the SERVER only (one transaction through the PURE steps in
  `core/progress.js`); collections show ONLY what a player owns; board ids use dashes (`cipher-score`), never dots.
- THE ONE DAY LINE (FR7 FIXES C): every match / daily is credited by its MATCH TIME on the 4 am America/New_York streak day — the streak, the
  week, the ceiling, NEW GAME TONIGHT, the boards; nothing before `progress/resetAt` is paid → docs/progression.md "THE ONE DAY LINE".
- EVERY XP PAYMENT through `core/progress.js#payXp` + its board row in the SAME update; DAILY POINTS = ONE table (`core/daily-points.js`).
- THE DAILY CEILING (20 counted room matches a streak day); THE RESET EPOCH (`progress/resetAt`); HOST-GRADED OVERCLOCK → docs/progression.md (moved).
- THE BOARD shows REAL USERNAMES (a rude one → its HOUSE NICKNAME, `api/_lib/lb.js#publicName`) — never a pid / key / tag digits; listed from
  the 3rd COUNTED PLAY (`core/progress.js#countedPlays` — a room match, a counted daily finish, or a SOLO run THE SERVER VERIFIED: the row's `sv`, `core/proof.js#VERIFIED_SOLO` = JAYWALK + HIGH RISE; a host-graded / refused solo run never); a public row = `api/board.js#ROW_KEYS`.
- THE REAL PLAYER COUNT: anything the server PAYS BY A COUNT takes it from what it can verify (`api/report.js`); A SEAT IS NOT A PLAY (`PROOF_TREES`).
- Anti-cheat never depends on the code being secret: the server checks + replays every result; secrets only in Vercel's env.
- THE PROOF TREE (THE PROOF PASS, Nov 20 — `jw` + `hr`, ONE shared copy: `core/proof.js` + `games/kit/proof-writer.js` + `proof-io.js`): a rule never trusts what the HOST writes (`game/*`) to guard a proof tree — THE STAMP `t0` (the tree's first write, the server's time) · a GO only within 5 s of it · the leaves (c / e / k / rs) on the player's OWN `go` + 3 h · THE LIVE LOCK by the stamp's age, 10 min (`core/room-logic.js#proofUnlocked` — the clients ask only for what the rules allow); the server counts a node only WITH its GO and a match player only with a MOVE in its own replay (a GO alone is not a play); the phone sends ONE burst at a time, re-sends a refused chunk, never drops a move on the mirror alone → docs/match-kit.md "THE PROOF TREE + THE PROOF WRITER" · docs/highrise.md "THE LIVE LOCK".
- A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST (THE CONSOLE FIX, Nov 20): no podium / route / kick over a phone's own live proven run (`screen.holdsRun` · app.js THE RUN HOLD · room.js#runHoldDone); the server holds a proof match's report while a run is live (`core/proof.js#liveGoers` = the host's own endedFor + the cap); THE TREE CAP (`rooms/{CODE}/pt`, 1,000) → docs/match-kit.md.
- ITEM NAMES ONLY TO OWNERS (two named exceptions on THE PLAYER PAGE) · THE ADD-ME LINK (a server-made `flink/` code) + STATS (ONE builder, ONE snapshot) → docs/profiles.md "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)".
- SECOND ACCOUNTS + DON'T COUNT (CITY I, owner-only): hashed addresses only (`seen/`, LIVE, 14 d); DON'T COUNT = `nocount/{pid}` applied AT READ (boards, SCORES, the place line + N, THE PENTHOUSE), its own views unchanged, UNDO instant → docs/profiles.md.
- THE OWNER'S NAME TAG (CITY PART 2): the tag only in OWNER-ONLY lists (`ui/owner-tag.js`), from the server only for THE OWNER's ask — never a public screen → docs/profiles.md.
- FRIENDS: `pfr/{pid}` server-written, its owner reads it (`core/friends.js#friendStep`); PASSKEYS (`api/_lib/passkeys.js`, the RESTORE KEY stays the fallback) → docs/profiles.md (moved).
- SLIM CARDS EVERYWHERE A PLAYER LIST SHOWS — only through `ui/strip-board.js` (never a second strip system); every place 1 / 2 / 3 = THE DECO MEDALS (`ui/medal.js`).
- THE YOU ROW (CITY H2): YOUR card in EVERY slim-card list = ONE breathing pink glow (`ui/strip-board.js#markMine`); no list keeps its own "me" box / edge / tint → docs/vault.md.
- THE LIVE LANE (lists = baked STILLS, ≤ 3 live strips) · THE STRIP MATCH (a slim card's material frames its picture as its effect does) → docs/vault.md "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)".

**THE VAULT** (→ docs/vault.md (moved))
- EMBLEMS + GLOWS MOVE ON THE COMPOSITOR (`js/vault/emblem-art.js` — never a CSS animation on an SVG element); THE PROMINENCE RULE is the budget.
- A FULL CARD ON TOP HOLDS EVERYTHING BEHIND IT — every full card through `vault/full.js#openFullCard`.
- THE CARD LAYOUT RULE (`js/vault/layout.js`) + THE CARD TEXT STANDARD; THE SLIM-CARD LONG-NAME STANDARD (`config.js#NAME_MAX` 12); THE HERO-SPOT RULE (`js/vault/hero.js`).
- NO BLACK TILES: a card drawn in code = a baked still (`js/vault/stills.js` + `node scripts/build-card-stills.mjs`).
- THE SLIM-CARD LAYER (CITY PART 2): a CSS-art card whose effect ADDS a layer = stills kind `l` (the layer baked transparent over its picture until the effect paints) → docs/vault.md.
- THE GIFT CARDS: 1-of-1, given ONLY by the owner's `/admin → GIFTS`; the DEV cards the owner's only (`js/core/dev-cards.js`); a MEMBER Nº is server-only.
- A pass that edits a lab item's art bumps `js/vault/catalog.js#LAB_V` + writes its line in `api/_lib/lab-text.js#LAB_CHANGES`.
- An unknown path gets THE WRONG DOOR (`404.html` — keep vercel.json free of rewrites).
- THE DAY PAINT (CITY PART 1): a sign's day face is PAINT — never a saturated / white-hot ink on a dark board (`tests/city-part1-signs.test.mjs`); THE PAGE'S CLOCK: the city's network gates let go by the page's time on screen → docs/harbor.md.
- NEVER A GAME TWICE AS A SIGN (CITY PART 2): the speakeasy blade skips tonight's lit named signs (`harbor-neon.js#bladeGame`); THE LED BILLBOARD EXCEPTION: the tri-vision's posters never get a day variant → docs/harbor.md.
- THE BOOT HEADERS (CITY PART 2): a boot module keeps a SHORT header — its long history lives in `docs/harbor/boot-headers.md` (THE BOOT's BYTE ROOM).
- THE LAB FEEDS EVERY PASS: every pass runs scripts/lab-export.mjs <live> at its START and builds the open FIX marks (bump LAB_V + its LAB_CHANGES line) — rebuilt items show under CHANGED for the owner's re-mark → docs/vault.md.

**The dailies** (→ docs/progression.md, docs/password.md, docs/coastclear.md; the full rule lines: docs/progression.md "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)")
- A daily = its cartridge + ONE row in `config.js#DAILIES` (PLUG-AND-PLAY); THE SERVER JUDGES every guess (answers + THE DAILY SECRET only in the database); DAILY BEST · THE TICKET · A RUN KEEPS ITS OWN DAY · THE GO-LIVE SWITCH + THE SCHEDULED GO-LIVE · THE SHARE CARDS · EVERYONE ON SCORES → docs/progression.md.
- THE BIG FIVE (HIGH RISE DAILY B): 5+ dailies finished → SHARE TODAY is TEXT ONLY (each name in its ticket's ink — `ticket-art.js#TICKET_INK`, ONE ink table); a row's `liveFrom` = THE SCHEDULED GO-LIVE IN CODE → docs/progression.md.

**The games** (read the game's doc before a pass on it; each game's full rule lines: its doc, "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)")
- OVERCLOCK: its timings are the owner's, NO SIDEWAYS SCROLL, right / wrong never ✓ / ✕, the pools are BUILT; ONE BOARD (CITY PART 1): BEST QUICK RUN, solo or room, DUMB LUCK's points left out → docs/overclock.md.
- PRISM DROP: never "Tetris" / "tetromino" / "T-spin", THE ANTI-CHEAT RULES, ONE definition per SKIN; THE DROP (the daily) → docs/prism.md.
- HOLD'EM: the engine PURE + DETERMINISTIC, THE SERVER IS THE DEALER, PLAY CHIPS ONLY, the portrait untouched → docs/holdem.md.
- JAYWALK: the rules PURE + CROSS-ENGINE SAFE, a result = THE REPLAY, the preview at /jaywalk-lab; THE SOLO RUN · THE MATCH · THE GHOSTS · THE LOOK(S) · THE AREAS · THE BIG MOMENTS · THE END SCREEN · BEFORE THE FLIP · THE RECORDER = ONE BOUND · J1: SPLITS (the bests the SERVER's replay keeps) · THE MATCH MOMENTS (an OUT = that player's OWN end, never the host's) · J2: COURSE RULES v2 — a course = (seed, VERSION), ONE source `versions.js`, the version in the proof (`cv`) CHECKED against its GO, v1 FROZEN (`tests/fixtures/jaywalk-v1/`) · J2 FIX: v2 FROZEN too (`tests/fixtures/jaywalk-v2/` — a change = a v3) + THE END CHECK (a v2 run's own `e` must match the replay, else 'old build') · J3: THREE TRIES ALL DAY (no STOP; the row's `allDay`) + THE TIME BOARDS (`dly/jaywalk/{day}/sp` — the server's splits, a VIEW: never the points) · J4: WINTER = a VIEW by the run's own day (`season.js`; THE SEASONAL PACK outside the line; WET ships OFF) → docs/jaywalk.md.
- HIGH RISE (PLAYABLE since Nov 20): the rules PURE + INTEGERS ONLY, a result = THE REPLAY of the tap log from THE PROOF NODE (`hr` — `proof.js#judgeNode`) · /highrise-play: zero server calls (THE DOOR) · THE SWITCH: `api/_lib/highrise.js#HIGHRISE_COUNTS` ON (false = the KILL SWITCH: judged, WOULD COUNT, nothing written) · THE SIGN HOLD lifted (CITY PART 1): the roof HIGH / RISE, the speakeasy blade, the tri-vision's OPEN NOW face (`core/harbor-neon.js#SIGN_HOLD` = [], the next game's switch) · THE STAGE (`stage.js`) is the page's AND the cartridge's — it never counts anything itself · THE LAG RULES (nothing decoded / compiled / thrown away in a frame; ZERO GARBAGE IN PLAY: a live frame makes NO objects — the guard `tests/integration/highrise-alloc.mjs`; three.js = its READABLE build on every page) · THE TWO LOOKS = ONE set of programs (`uDay`) · THE FLYERS lazy, in the sky band only · THE RULE-SET TABLE (S4B): every rule number in `rules.js#RULE_SETS` — the engine + the judge read the run's own row, a run records its rule set, an unknown one is refused · THE MATCH (S4B): THE FIRST GO's seed, a rival = their LANDED taps only, never a rival pixel in the play zone (`highrise-rivals.mjs`) · THE DAILY (DAILY A — ships OFF): ONE SHOT, THE HELD RUN in LEGS — a hold = a LOGGED event the judge replays (`engine.js#hold`), the server's leg closed first (THE UNDO GUARD) · THE BAKED HUD (S5): text over the 3D view that changes in play = bitmaps baked ONCE a style from its own CSS (`bakedtext.js`), never a re-rasterised blur · SPECTATE = A PLAYBACK (REVIEW FIX A): a watched tower is drawn `stage.js#WATCH_DELAY_MS` late, each tap at its own tick — never past a tap · YOUR BEST = the server's record of COUNTED runs only · THE SHARE CARD = THE POSTER (REVIEW FIX B): pre-rendered hero shots (`assets/highrise/share/`, `?poster=hero`), NEVER the run's live frame → docs/highrise.md.
- THE HOLD (HIGH RISE S4A): a LIVE run renews a LEASE on the audio context from its frame loop (`engine.js#holdAwake` via `globalThis.__nsHoldAwake`), let go on the end card; nothing naps since HEAR THE HARBOR → docs/audio.md.

**Deploy, launch + safety** (→ docs/testing.md (moved), docs/launch.md (moved))
- NEVER THE LIVE SITE: tests + repros on the emulators (`kit/live-guard.mjs`; `LIVE=1` on purpose only).
- THE QUIET COUNTS (CITY A): expected noise is COUNTED, never a row — `errlog.js#countQuiet` → `/api/log` → `logstats/{kind}` (old · gone · ext), one line in /admin's errors. A page iOS killed reports itself at the next load (`errlog.js#markScreen` → kind `killed`).
- THE RULES-LAG: every write through `firebase.js#write`; a rules change fails `tests/rules-live.test.mjs` until its ack names it, and the pass
  summary's FIRST line says RE-PUBLISH + how; a feature on a new rule keeps a fallback that works on the old one.
- THE EDGE CACHE is live (one copy per deploy); THE FROZEN SONGS OUT OF DEPLOYS (`.vercelignore`); pass screenshots stay out of git (`tests/repo-growth.test.mjs`).
- ONE DEPLOY AT A TIME: a phone never runs two deploys' code — `sw.js` pins every page to its build (lazy chunks too; gone → ONE reload, only at a RETURN — never mid-tap, mid-match or with a pop-up open — logged to /admin) → docs/harbor.md "ONE DEPLOY AT A TIME".
- THE NIGHTLY BACKUP (CITY E): every top-level node is DURABLE, LIVE or SECRET (`api/_lib/backup.js` — `tests/backup.test.mjs`); never a backup file / the token in this repo → docs/backup.md.
- THE CARRY (CITY A): `node scripts/build-file-hashes.mjs` after ANY change under js/ css/ assets/ data/ (`tests/file-hashes.test.mjs`) — a deploy downloads only the changed files; /audio kept by version → docs/harbor.md.

## Working efficiently (what cost the most in past sessions)
- **Edits:** use the Edit tool or a script file in the scratchpad. Never put code with backticks, `$` or `\b` inside an inline
  `node -e "…"` / heredoc — the shell mangles it.
- **Names:** a view's own `update(state)` shadows Firebase's `update` — import it as `dbUpdate`.
- **Tests, in order:** `node --test tests/*.test.mjs` (seconds) → the game's `FAST=1` E2E (≈ 2 min) → the full suite once before
  committing. Don't re-run a 20-minute suite to check one fix. Run E2E suites with absolute paths and from `tests/integration`.
  The city runs in the HARBOR suite by group: `ONLY=core,dock,neon` (the WHOLE harbor suite = the cloud's, on the tagged push — THE LOCAL TESTING RULE).
- **Look reviews:** `node tests/integration/shots.mjs "<browser>" --scenes night,day,halloween --sizes phones --crop dock` (`--cast <ms>` = every
  painted frame). Never write a one-off screenshot script — add a scene or crop preset to shots.mjs. "No look change" = `tests/integration/pixdiff.mjs`
  (A/B against a worktree on :5174); City 2.0's speed gate = `title-perf.mjs --ab`.
- **Waits in tests:** wait for the actual condition (`waitFor(page, js)`), never a fixed sleep "to be safe".
- **Line endings:** LF everywhere (`.gitattributes`).
- Run `git status` before committing: stage the files of this task only (other work may be in the tree).

## File layout (top level — the full map: docs/data-model.md (moved); the city's: docs/harbor.md "THE FILE MAP"; each game's: its doc)
```
index.html sw.js manifest.webmanifest assets/   shell, service worker (ONE DEPLOY AT A TIME + THE CARRY), PWA, icons
board.html admin.html lab.html daychart.html jaywalk-lab.html 404.html   /board, /admin, /lab, /daychart, /jaywalk-lab, THE WRONG DOOR
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
  meta:      { hostId, hostBy?, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, locked?, settings/{gameId}: {...}, go?, back? }
  rv/{uid}:  matchId                                         ← THE REMATCH VOTE
  players/{uid}:  { name, color, avatar, joinedAt, pid?, ln?, dy? }    ← written by that player only
  presence/{uid}: { online, lastSeen, v: 2, c: { connId } } ← ONE CHILD PER CONNECTION: online = any c child left
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape; totals are always DERIVED from results (never stored) so a replayed step can't double-score
  night/{matchId}:   { g, p: { uid: 3|2|1|0 }, n: { uid: name }, b?: { uid: bonus }, at }  ← host; game-night scoreboard
  <game nodes>/{matchId}/…/{uid}                              ← a player's own data for the current step, phase-gated by the rules
chats/ seal/ hole/ … {CODE}   ← top level, NOT readable like rooms/ (seal = THE SEAL; hole = HOLD'EM's cards; hrec/ server only)
every top-level node + who writes it: `api/_lib/backup.js` (the tested list — DURABLE / LIVE / SECRET) + docs/data-model.md
```
Rules of thumb: a player writes only under their own uid; anything secret lives outside `rooms/`; the host wipes `ALL_PLAYER_NODES`
(registry.js) at match start/end; obfuscate (`core/obfuscate.js`) what must not be readable in plain sight.

## Multiplayer mechanics (the full text: docs/data-model.md (moved))
- **THE PARKED DATABASE:** the socket opens only when wanted — `firebase.js#want(reason)` / `release(reason)`; a feature that reads the database
  OUTSIDE a room must `want()` / `release()` its own reason; never parked while in a room. `state.net`: only `lost` shows SIGNAL LOST.
- **Identity + rejoin:** an anonymous Firebase user per *slot* (phones are slot 1); `localStorage na:{slot}:session` → `resumeSession()`.
- **Presence — ONE CHILD PER CONNECTION** (`presence/{uid}/c/{connId}`; every reader through `normalizePresence`). Offline players stay as "SIGNAL LOST".
- THE WAKE HOLD + THE ONE HOST-WRITE GATE (CITY PART 1): every host write through `host.js#hostWriteOk`; after a stall a fresh read of `meta/hostId` first; a refusal then = the quiet `not-host` → docs/harbor.md.
- **Host migration** (`core/room-logic.js#shouldClaimHost`): in a game the `meta.hostBeat` (every 2 s, stale ≥ 10 s) ALONE decides; claims staggered by join order.
- **Director:** `host.js` ticks every 250 ms → `module.prepare()` + `module.step(game, ctx)`; a step may carry `$room` side writes; `final` writes `night/{matchId}`.
- **Live player data:** `livePaths(game)` → `state.live`; directors + views check `state.liveKey` before trusting `live`.
- **THE SEAL** (`games/kit/seal.js`): a round's secrets in `seal/{CODE}/…` until `game/unseal`; the privacy pattern for hidden data — docs/data-model.md.
- Idle rooms close after an hour without a game (`ROOM_IDLE_MS`); `rematch()` deals late joiners in; `MIN_PLAYERS` + an option's `when(onlineCount)`.

## Audio (the short version; everything else in `docs/audio.md`)
- MOOD MUSIC (`audio/mood.js`); City 2.0's stations play on the server clock — every phone the same song (`audio/party-music.js#stationOf`).
- `playMusic(id, fallback)` driven by `app.js` from state; `sfx(name)` for the shared effects; a game's own palette in its `createSfx()`.
- THE IDLE CUTOFF · LEAVING + MUTED: THE CUT IN ONE ORDER · MUTED = NOTHING RUNS · THE THREE-WAY BUTTON + THE SESSION BY STATE (`audio/sound-state.js`) → docs/audio.md "THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I …)".
- MUSIC OFF = HEAR THE HARBOR (GARDEN PARTY, retires PODCAST MODE): ONE row of THE SOUND TABLE (`sound-state.js` — session · music · beds · one-offs · effects) applied whole on every change (`engine.js#applySound`); both sound rows 'playback' + C2's leave; ALL OFF = nothing runs → docs/audio.md.
- AN EFFECT ASKS `isUnlocked()`, NEVER THE CONTEXT's STATE (CITY PART 1 — the sweep; `tests/podcast-sweep.test.mjs` allows `running` only in the music / clock files) → docs/audio.md.
- New songs: `scripts/add-city2-music.py` (City 2.0) — bump `music.js#REV` when replacing a file; never change a song element's playbackRate.

## Design system (the full text: docs/title.md (moved) + "THE SHELL")
- Tokens in `css/base.css :root` (`--bg-0..3`, `--text/-dim/-faint`, the neons, per-game `--accent*`); fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono`, `--font-num` (use for all numbers). `body[data-theme=<id>]` re-maps the accents in a game.
- **THE SHELL — ONE builder each, a screen never keeps its own copy (`tests/shell.test.mjs`):** THE NEON TUBE = every button (`tubeButton()`,
  ONE pink MAIN a screen — EXCEPT an end screen's BAR: its game's ACCENT, END-SCREEN STANDARD A, `ui/final.js`) · THE SHEET = every pop-up (`ui/sheet.js#openSheet`, the ONE Esc in `ui/layers.js`) · THE ROW (`row()` + `ICONS`) ·
  THE MESSAGE (`toast()`). Gold is a vault / card accent only — never a button.
- **NO PILLS, EVER (the owner, Nov 14):** no rounded-capsule shape anywhere NEW — labels, chips, badges, frames, footers; the ones that still
  exist are listed, not fixed (docs/games/passes/skins-2a.md "THE OTHER PILLS") → docs/title.md "THE SHELL".
- **THE CORNER BUTTONS ARE SPLIT ON EVERY SCREEN:** ☰ TOP-LEFT, music TOP-RIGHT, 36 pt with a 44 pt tap area; every header makes room with
  `var(--cb-room)`; a full-width game pins BOTH to the screen's edges. Helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)`.

## Adding a game (the full checklist: docs/match-kit.md (moved); `tests/registration.test.mjs` names every place it must be registered)
Rules first (pure `logic.js` + `director.js` + whole-match sims) → the contract (`js/games/contract.js`, docs/cartridge.md) → the view on the match kit →
the rules file + its cases → the E2E → three sizes, three refine passes.

## Testing (the short version; every suite + flag: `docs/testing.md` (moved))
- **YOUR OWN SERVERS:** every pass starts its OWN fresh emulators + `scripts/serve.mjs --emu` (a leftover stopped first) and STOPS every server
  it started as its LAST step (the summary says so).
- **THE BUILD MACHINE IS THE MINI PC** (Beelink SER8, 32 GB, Java): before EVERY final push run LOCALLY the unit suite, the rules + `/api` tests
  (when touched), the smoke test, the game's own E2E AND the harbor GROUPS the pass touches, with nothing else busy.
- **THE LOCAL TESTING RULE (Ben, Nov 14 — while the repo is PUBLIC):** the FULL `e2e-harbor` suite runs in the CLOUD on the tagged push, NOT
  locally; if the repo ever goes private this flips (the cloud then never runs harbor on a push) → docs/testing.md. Browser tests run OUTSIDE the sandbox; every browser
  script imports puppeteer from `tests/integration/kit/puppeteer.mjs`. Chromium: `C:\Users\benja\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`.
- **GitHub checks + the harbor cloud run only on a pass's FINAL push** — the top commit tagged `[ci]` (a game / app pass) or `[harbor]` (a city
  pass); at most TWO cloud runs a pass, never re-run to confirm a flake. A new harbor group: its `G()` + its name in exactly one job in `harbor-jobs.mjs`.
- **VERCEL DEPLOYS ONLY TAGGED PUSHES:** the LAST commit message of the push carries `[harbor]`, `[ci]` or `[deploy]` (a mid-pass hotfix) — ONE
  deployment a pass. Never write a tag in square brackets in a message not meant to fire it (write "the ci / harbor / deploy tags").
- Unit: `node --test tests/*.test.mjs`. Rules: `node --test rules.test.mjs`; `/api`: `node --test server.test.mjs` (both in tests/integration,
  on the emulators: `npm run emulators`). Smoke: `node e2e-smoke.mjs "<browser>" ./shots` (`GAMES=…`). Sockets: `e2e-conn.mjs`. Per game:
  `e2e-<id>.mjs` (`FAST=1`). `ONLY=perf` = THE BASELINE GUARD. App: `node scripts/serve.mjs` → `http://localhost:5173/?emu`.
- THE UNIT JOB INSTALLS NOTHING (FIXES R1): a `tests/*.test.mjs` unit test never imports a file that reaches `api/_lib/fb.js` (or any package) — a server file's pure half gets its own module (`tests/unit-imports.test.mjs`).
- THE PAGES LOAD (FIXES R1 — /admin shipped dead): every shipped file parses (`tests/parse-all.test.mjs`) + the smoke test loads /, /admin, /board, /lab, /daychart in Chromium + WebKit (`kit/page-loads.mjs`).

## Firebase setup notes
- Production setup (the console, the rules publish, the Vercel env vars — `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_DATABASE_URL`, `ADMIN_PIDS`, `KEY_PEPPER`,
  `DAILY_SECRET`, `BACKUP_TOKEN`, the three `VAPID_*` — the authorized domains, the web config): docs/profiles.md "Setup (production)".
