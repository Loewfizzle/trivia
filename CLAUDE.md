# NEON SPEAKEASY — developer guide

Mobile-first multiplayer party games (2–8 players, one phone each; DOUBLE AGENT needs 4). Twelve games — **ONLY TWO PLAYABLE** since WINDOWS
(Nov 1 — the owner): PRISM DROP + OVERCLOCK (`js/config.js` GAMES[].playable is the one switch: the other ten are hidden everywhere a player
could start them, their code + data + rules FROZEN, not deleted; `sign: true` = THE FIVE SIGNS in the city — the two + NEON PAR, HIGH STAKES,
GRIDLOCK "next on deck"). **CITY 2.0 — THE HARBOR — IS THE ONLY CITY** (CITY 1.0 OUT, Nov 5: City 1.0 deleted; an old `?city=1` / `?city=2` link lands on the Harbor;
its code at the git tag `city-1.0-final`, a video + shots in `Downloads\NEON\museum`). Static site on Vercel
(**neonspeakeasy.com**; games.loewfizzle.com and trivia.loewfizzle.com redirect there) + Firebase Realtime Database + Anonymous Auth,
plus eight Vercel serverless functions in `/api` (profiles, server-checked results, THE BOARD, admin, errors from phones — `docs/profiles.md`; the daily contract — `docs/progression.md`; the live weather — `docs/title.md`; the server's clock for a parked title — `docs/audio.md`).
The app was NEURAL ARCADE, then NEON DISTRICT (both Oct 2026); the games kept their names and the title's city is still "the
district" in code (the `nd-` class prefix, the `window.__district` test hook). `ROADMAP.md` lists what shipped and what is next.
**Keep this file, ROADMAP.md (one line per shipped feature; the detail goes in `docs/roadmap-history.md`) and the relevant `docs/*.md` updated as you work.**

This file is the short version. The deep-dives live in `docs/` — read the one you need, when you need it:

| doc | read it when you touch |
| --- | --- |
| `docs/match-kit.md` | **any real-time game** (the shared HUD pieces + the E2E harness) — read this before building or changing a game |
| `docs/cartridge.md` | **THE CARTRIDGE PLUG** (LOBBY 2.0 B) + **THE CONTRACT** (SHELL 2.0 B1 — the thin meta + the lazy cartridge, the preload budget, the kit, READY, the night path, mood music, the solo lane, "what plugs where"): what a game EXPORTS + what the console GIVES it (`js/games/cartridge.js` — checked by `tests/cartridge.test.mjs`): `start({ now })` = the match begins after the walk inside, its own chat lock, banner name, preload, the DAILY plug-in (ships OFF) — the console never names a game |
| `docs/data-model.md` | the database: every node, every game's `game` shape, rules |
| `docs/testing.md` | running / writing tests: emulators, smoke test, each game's E2E and its env flags, previews, Lighthouse |
| `docs/audio.md` | music, playlists, SFX, the audio engine; loading, PWA, service worker, link previews |
| `docs/title.md` | the title screen (its four files — title.js, title-neon, title-taps, title-dock), the logo, the menu, LIVING CITY (time of day, seasons, holidays, sky events, the real sun + solar eclipses; `?when=&tz=&at=&force=`), PARTY NIGHTS (Fri / Sat on the beat), RAINBOWS (after real rain), THE STREET (lamps, trees, buses, the stop light; the people, the speakeasy's door + the knock), the dock, the screen at rest, the easter eggs |
| `docs/harbor.md` (+ `docs/harbor/passes/`, one log a pass — its INDEX) | **CITY 2.0 — THE HARBOR** (`?city=2`): the bible — size rules, camera + layout, bakes + memory, lanes, budgets, THE FILE MAP, KNOWN ISSUES, the standing rules' full text |
| `docs/harbor/decisions.md` | the owner's CURRENT City 2.0 decisions (short; `docs/harbor/plan.md` = the dated archive) — **read first in a Harbor pass**; Step 0 updates it |
| `docs/progression.md` | PROGRESSION (A + B, Nov 2): levels 1–100, the streak + freezes + WIN IT BACK, the items + THE LEVEL REWARDS, the 33 achievements + the award engine, the daily contract (`/api/daily`), FOUNDER, the end-of-round moment, the Gilded card + profile, THE BIG FLAME, `?preview=`; CITY SIGHTINGS (the tap → the reaction → the real polaroid → the pair, server-verified; a NEW legendary plugs in there), THE ALBUM, BIRTHDAYS, CALL IN A FAVOR |
| `docs/vault.md` | THE VAULT (1A–2A, Nov 3; 1C: THE ONE TIER PALETTE `core/rarity.js`, the 8 SIGHTING CARDS from the city's own models `js/fx/sg-*.js`, the held-back cards; 2A: the 3 held cards + THE EMBLEM SYSTEM — `js/vault/emblem-art.js` (a shape + a finish as composited SVG layers), tube styles, name glows `js/vault/glows.js`, the picker's style rows, the lab's EMBLEMS + GLOWS tabs, THE PROMINENCE RULE as the budget): the CARDS' ART — THE CARD LAB (`/lab`: the owner's APPROVE · FIX · CUT; `docs/vault-lab-marks.md` = his marks, read FIRST in a VAULT pass), THE EFFECT LIBRARY (`js/fx/` — ONE shared renderer, never a canvas per card; how a new effect / card / emblem plugs in), the slim strips (SLIM FIRST), the tiers, THE PROMINENCE RULE, THE BAR |
| `docs/chat.md` | room chat (data, locks per game, system lines, profanity filter) |
| `docs/content.md` | adding questions / puzzles / words to any bank; rebuilding word lists |
| `docs/profiles.md` | profiles, name tags + keys, FRIENDS (the list, invites that wait, SAVE TO PASSWORDS, the crew intercom), `/api`, result reporting, THE BOARD, XP ranks + steps, streaks, the weekly goal, mastery, THE VAULT (card finishes, name glows), emblems, `/board`, `/admin`, the Vercel setup |
| `docs/overclock.md` | **OVERCLOCK** — the OVERDRIVE rebuild's plan (7 passes, the owner's decisions) + each pass's decisions + log; read it before an Overclock pass |
| `docs/coastclear.md` | **COAST CLEAR** (CC1 — a DAILY-ONLY, SERVER-JUDGED Minesweeper-type, ships OFF: the no-guess maker + solver `api/_lib/cc-board.js` + `cc-solve.js`; the board only on the server, `/api/daily` dig / chord / pause / resume; the instant feel) |
| `docs/password.md` | **THE PASSWORD** (PW1 — a DAILY-ONLY, SERVER-JUDGED Wordle-type, ships OFF: `config.js#DAILIES`, never GAMES; `/api/daily` `guess`; the list build + THE REVIEWER; the kit keyboard's `setKeyStates`) · the owner's game decisions: `docs/games/plan.md` |
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
- **Desktop comes free (the owner, Nov 1–2 — DESKTOP):** every feature, holiday + event is built + judged for the PHONE only; a desktop, an iPad
  sideways or a phone sideways get it through the shared city + THE DESKTOP CAMERA (core/harbor-layout.js#DESK) — never a desktop-only piece
  or a second version. EVERY pass checks ONE desktop size (1440×900: shots.mjs `--sizes pass`) beside the three phone widths + fixes what
  breaks there; sideways + iPad only in a desktop pass + FR6 (`--sizes desk-pass`). docs/harbor.md#the-camera--the-layout-part-1-numbers.
- **Class names:** prefix new CSS classes per feature (`nd-`, `ndl-`, `pd-`, `da-`, `gl-`…). A bare `.nl-hi` once collided with
  Overclock's number line and shoved the logo's highlights sideways.
- **Presentation tech:** Canvas 2D (+ a WebGL fragment shader for a sky/world) unless 3D *is* the game (RUMRUNNER's city diorama is three.js, but it is a backdrop and a map: every button, price and card is DOM over it). Every polish pass on a three.js
  scene costs several times a 2D one, and a tilted 3D board on a phone fights readability and tap targets (GRIDLOCK Part 1 shipped
  on three.js, failed the play-test and was rebuilt flat in Canvas 2D a week later — straight-on, labels inside the frame, one board up).
- **The title has one too:** `tests/integration/title-preview.html` (the real title; `shots.mjs --preview`).
- **City 2.0 (THE city) — its standing rules, one line each** (the full text: docs/harbor.md#city-20-in-claudemd--the-full-text; the
  owner's CURRENT decisions: **docs/harbor/decisions.md** — read it before a Harbor pass; plan.md is the archive):
  - THE WINDOW RULE: every window moment enters by its own motion or the blind cycle (core/harbor-moments.js#ENTERS_BY_MOTION).
  - THE WINDOW STANDARD (the owner, Oct 31): the shadowboxer + the boss's TV room are the bar for every window scene — one real light in the room, its shadows, smooth eased motion, that quality.
  - THE PEOPLE RULE: nobody appears or vanishes in view on the promenade (core/harbor-witness.js#rejoinVisits, people.js#guard).
  - THE SOLIDS: every solid thing on the promenade is ONE registry (core/harbor-solids.js) — every walk goes round it.
  - NO LAMPPOSTS: the implied lamps; the light in ONE pure module (core/harbor-light.js; NEW light default, `&light=old` for A/B).
  - NO TRAFFIC DURING THE LEGENDARIES (core/harbor-legend.js#trafficHold); every vehicle planner reads it.
  - THE WIND IS ONE STATE (core/harbor-wind.js → scene.js#WF once a frame): anything that moves in the wind reads it (gusts roll from upwind).
  - THE BEAT: the lights follow the song's grid; a TRUSTED GRID ALWAYS PUNCHES; the kicks only calibrate the lead (core/harbor-beat.js).
  - 3D only as BAKED sprites (scripts/bake-model.mjs); lettering nothing passes in front of → THE CRISP LAYER (crisp.js).
  - Every force flag has a panel row (core/harbor-remote.js; tests/harbor-remote.test.mjs greps for strays).
  - Every canvas through `safeCtx` / `ctx2d` (ui/canvas-safe.js) — counted by the memory guard; a new canvas needs no registration.
  - THE CITY TIMETABLE (core/harbor-schedule.js) holds EVERY timed thing (SCHED moved the older systems in; tests/harbor-sched-strays.test.mjs
    fails on a stray time in a planner; THE GOLDEN TABLE — tests/fixtures/sched-golden.mjs — proves a move changed nothing). THE SHOWCASE DIAL
    (core/harbor-showcase.js — `showcase`, HIGH now) shapes the legendaries + the medium tier; the billboard's hints = the `billboard.*` queue;
    THE DAY CHART (/daychart + /admin) shows any day from the planners; THE TIER TABLE (core/harbor-tiers.js) every NEW per-phone number.
  - THE WINDOW SCENES ARE TIMETABLE ROWS (WINDOWS, Nov 1): scene.<id> (window, hours, nights, rarity, glow; `rotate: true` = seeded slots — the
    bookie) read by core/harbor-scenes.js; a NEW scene = its row + core/harbor-<id>.js + its painter in windows.js#SCENE_PAINT; after hours the
    scene rooms + the edge windows keep their SHADES DOWN glowing in their colour, lights out one at a time 2–4 am (windows.shades); the old
    scenes RETIRED behind windows.old / &force=old-windows (core/harbor-moments.js#RETIRED).
  - THE RADIO (CITY CONTROLS A — docs/harbor/passes/city-controls-a.md): the owner's controls; a row with a `jack` in the timetable = a jack
    on the desk; the SERVER checks the ROLE per action (core/harbor-radio.js#ROLES: owner · crew) + writes + audits every moment; a fired
    moment plays ONCE (scene-radio.js), never the preview panel's loop; only a server yes loads the radio (radio-gate.js). CC-B: THE INTERCOM
    (the owner's voice: audio/intercom.js — the clip an hour via /api, held in a game) + THE CREW (granted by the owner; ONE RADIO PER LOBBY —
    core/harbor-radio.js#radioHolder; their sky moments dormant until LOBBY 2.0) + PRESETS + the room push (api/_lib/push.js, VAPID env vars).
  - THE LOAD (THE LOAD FIX, Nov 6 — docs/harbor.md#performance): the boot screen holds until THE CITY's reveal (ONE fade; its unlit sign =
    the title's spot — keep index.html #boot + title.css .nd-sign in step); ONE CAMERA ON SCREEN (scene.js#holdStart: a re-layout after the
    reveal holds the picture, then cuts — never the old bake under the new signs, never a dissolve); proof: wk-load.mjs + the `load` group.
  - Debug + preview flags: `&debug=1` (strips at the TOP), `&dpr=3` (look only), `&bench=1` (THE PHONE BENCH), `&force=…` (a legendary
    from a link waits for the reveal + a tap; `&lgnow=1` at once) — docs/harbor.md.
- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view with a scripted state through an import
  map that swaps `js/firebase.js` for `tests/integration/fake-firebase.js` (see gridlock-preview.html). Iterate screens there in
  seconds; run the E2E once the look is right.
- **Profiles are polish too:** joining and playing must work with `/api` down or unconfigured (no tags, no emblems, results queue). ONE CARD ON ALL YOUR DEVICES (THE VAULT 1A): a device with nothing saved is asked ALREADY A MEMBER? BRING YOUR CARD (docs/profiles.md).
- **EMBLEMS + GLOWS MOVE ON THE COMPOSITOR (THE VAULT 2A):** an emblem's every moving part is its own HTML-wrapped layer (`js/vault/emblem-art.js` — never a CSS animation on an SVG element: it repaints every frame), transform + opacity only; THE PROMINENCE RULE is the budget (a legendary card leads: its emblem + name glow hold still).
- **THE VAULT 2B:** DRESS YOUR CARD is the profile's wardrobe (`js/vault/dress.js`); a MEMBER Nº is `profiles/{pid}/mn` (server-only — the owner Nº 0001; never the tag's digits); the two DEV cards are the owner's only (`js/core/dev-cards.js` — granted + checked by the server); a card that shows THE SPEAKEASY draws the city's own front (`js/fx/speak-front.js`).
- **A FULL CARD ON TOP HOLDS EVERYTHING BEHIND IT (THE SPEED PASS B):** every full card opens through `vault/full.js#openFullCard` — the fx surfaces behind held (`fx/renderer.js#fxCover`), every CSS animation outside it paused (`body.vl-covered`), the city's frames held; a new pop-up that shows a full card goes through it (docs/vault.md "THE COVER").
- **THE GIFT CARDS (SHELL 2.0 B2 — docs/vault.md "THE GIFT TIER"):** 1-of-1 cards (`core/gift-cards.js`; `dev-cards.js#isOneOfOne` = dev or gift: the
  rainbow gem + 1 OF 1), given ONLY by the owner's `/admin → GIFTS` (`api/_lib/gifts.js`: `gifts/{card}` = ONE PROFILE EVER, equipped, a reveal —
  `profile/gift-reveal.js`); the owner's own one (OWNER_GIFTS) granted on 'me' like the dev cards, never giftable. THE GIFT QUEUE (THE CARD PASS): gifts wait in a LINE (`ppriv/{pid}/gq` — server-only), the reveal plays one card at a time ("GIFT n OF m"). Their art = the material
  (`assets/vault/gift/` — `scripts/build-gift-art.mjs`), their motion = ONE engine (`fx/gift.js` + the layers as data in `fx/gift-specs.js`).
- **THE CARD LAYOUT RULE (CARD FIXES — docs/vault.md):** a full card's pieces never overlap + its plate keeps off the card's HERO (`js/vault/layout.js` — one
  ResizeObserver; a gift's `heroFull` in gift-specs.js, any other card's in `FULL_HERO`); the plate hugs its text, THE REVERSE STEP when the second row is
  the longer (`strip.js#stepPlate`, both plates); NO FOUNDER pill on a gift card; a full card's plate = NAME + LV n (THE RANK = a gold line above MEMBER SINCE; DEV · <RANK>); the strip's dev line DEV · №. **THE CARD TEXT STANDARD** (Nov 6 — docs/vault.md): every full card's top line, bottom-left block + printed name = a minimum size + a soft glass wash (a ::before) + a dark edge — never a card's own text treatment unless the owner approves one (BRUH).
- **THE SLIM-CARD LONG-NAME STANDARD (THE CARD PASS, Nov 7 — docs/vault.md):** the longest name = `NAME_MAX` (12); a NEW strip's hero centred 0.75–0.85 across
  (move a strip right by zooming its crop out: `strip: [100, py, z]`); every strip with a hero caps its plate there (`strip.js#heroRoom`); harbor `stripfit` checks
  every strip with `'W'.repeat(NAME_MAX)` + MAXIMILIANOS at 390. FX plates (light on black) ship as LIGHT WITH ALPHA — the effect canvas is transparent.
- **THE HERO-SPOT RULE (SHELL 2.0 B2):** a strip's main feature middle → middle-right (its centre ≥ 0.60 across), clear of the plate + the gem —
  a NEW focal card = its row in `js/vault/hero.js` (checked live at 390 / 402 / 430: harbor `platefit`).
- **THE VAULT 2C:** the strip's tier mark is THE TIER GEM (`js/vault/gems.js` — no words; the dev cards' DEV GEM); a pass that edits a lab item's art bumps `js/vault/catalog.js#LAB_V` + writes its line in `api/_lib/lab-text.js#LAB_CHANGES` (it shows CHANGED in THE LAB 2.0); the 12 sign-up shapes are commons everyone owns (`core/items.js#SIGN_EMBLEMS`) — the shape changes only in CUSTOMIZE; an unknown path gets THE WRONG DOOR (`404.html` — keep vercel.json free of rewrites).
- **ITEM NAMES ONLY TO OWNERS (THE VAULT 1B):** the catalog (names, lines, achievements, what each level / milestone gives, the lab's names) lives in `api/_lib/catalog.js` + `lab-text.js` (never served); a phone gets display rows only for what it owns (`withShow` → the /api wrapper registers them). A new item = its row there. `tests/vault-names.test.mjs` fails on a leak.
- **PROGRESSION (docs/progression.md):** XP, levels, the streak, items, achievements, X% counts + FOUNDER are written by the SERVER only (one
  transaction per match / daily / event through the PURE steps in `core/progress.js`); collections show ONLY what a player owns (no ???, no totals).
  Clients never write boards, stats, XP or ranks (server-only in the rules); board ids use dashes (`cipher-score`), never dots.
- **THE BOARD shows REAL USERNAMES (LOBBY 2.0 A, Nov 3 — reverses BNAME's house nicknames):** a public row (`/api/board`, its CDN copy,
  `/board`, the title's preview) = an opaque board id + the player's USERNAME — never a profile id, the key or the tag's digits; a name the
  filter calls rude shows as its HOUSE NICKNAME (`api/_lib/lb.js#publicName`, `js/core/nicknames.js`); REPORT + /admin's rename / hide stay;
  a report pushes the owner (`api/board.js` → `radio.js#notifyOwner`). `profiles/{pid}` is readable one at a time by signed-in users, never
  as a list. A profile is listed from its 3rd counted match. docs/profiles.md "REAL USERNAMES".
- **THE ROOM IN THE CITY (LOBBY 2.0 A + B):** in City 2.0 THE OLD LOBBY SCREEN IS RETIRED — the room lives in the city from the join to the podium
  and back (the old lobby screen + lobby.js went with City 1.0 — CITY 1.0 OUT). LOBBY 2.0 B: THE GAME START (meta/go — LOBBY FIXES: the game's own pink sign lights, the walk inside, a fade — 5 s FULL / 3 s for a same-game REMATCH, the kind in the match id,
  `core/room-show.js`), THE CITY PAUSE (a match on screen = the city destroyed + rebuilt after), the walk back out + THE WINNER's BANNER PLANE (meta/back
  — `screens/room-banner.js`), THE REMATCH VOTE (rooms/{CODE}/rv/{uid}), ONE SHEET STACK (`ui/layers.js` — every pop-up opens on top); docs/harbor/passes/lobby-2b.md.
  A City 2.0 room's waiting part IS the live city — app.js routes it to the title (never reloaded);
  `screens/room-city.js` (+ room-dock / room-guests / game-options) puts the players in TWO LINES OF 4 at the door (`core/harbor-room.js` +
  `room-lines.js` — derived from rooms/{CODE}; each keeps their line: `players/{uid}/ln`); docs/harbor/passes/lobby-2a.md (+ B's hand-off).
- **MAKE HOST + THE CREW SWITCH LIVE (SHELL 2.0 B2):** the host hands the room on from a player's card (`room.js#makeHost` — in the room, to an
  ONLINE player; the rule validates `meta/hostId` → a live, online, unkicked player; `meta/hostBy` → both phones say it); the owner's CREW switch on a
  card stamps `rooms/{CODE}/radioCrew/role/{uid}` → that phone's radio loads / goes at once (`radio-gate.js#fresh` / `drop`).
- **ONE ACCOUNT, ONE ROOM (LOBBY FIXES):** a profile holds ONE seat in ONE live room (`seats/{pid}` — `js/seat.js`: MOVE HERE · CANCEL on the second device); the SERVER credits a profile once per match (the worse seat) and never for two overlapping matches (`core/progress.js#overlaps`). Your NAME + COLOUR are edited at the top of CUSTOMIZE YOUR CARD only (`js/profile/edit.js`).
- **NEVER THE LIVE SITE (FR6 FIXES A):** tests + repros run on the emulators — `kit/live-guard.mjs` refuses a non-local page unless `LIVE=1` on purpose (then `&test=1`: no profile, no member Nº, a silent room push); docs/testing.md "THE LIVE-SITE GUARD".
- **THE RULES-LAG (FR6 FIXES A):** every database write goes through `firebase.js#write` (a refusal is reported to /admin, ids masked — never silent); a pass that changes `database.rules.json` fails `tests/rules-live.test.mjs` until its ack names the change, and its summary's FIRST line says RE-PUBLISH + how (docs/testing.md "THE RULES-LAG"); a feature on a new rule keeps a fallback that works on the old one.
- **Anti-cheat never depends on the code being secret** (the owner, Oct 28 — the repo stays PUBLIC until just before the launch): the
  server checks + replays every result itself (`/api`), the secrets live only in Vercel's env (the service-account key, the pepper).
- **A game's podium music:** `FINAL_MUSIC` in its index.js (HIGH STAKES: `victory1` = victory.mp3); default the victory playlist.
- **OVERCLOCK (OC1 — docs/overclock.md):** QUICK default; THE ROOM's NIGHT MEMORY = the host deals the whole match at `start({ used })` (`overclock/deal.js`), each challenge marks its keys as it opens; the after-challenge skip (`ocnext`, ≥ 3 s, everyone connected); the combo (`ocm` → `game/combo`); NIGHT only (`LOOKS`); its timings are the owner's — pinned by `tests/overclock-oc1.test.mjs`; mid-game standings = LIGHT rows, never the slim cards. OC2: THE ROUND WIN is ONE rule (`logic.js#roundWin` —
  the highest + not shared; the server's REDLINE calls it; stored as `game/rw`); the after-challenge screen + the final run in BEATS inside the
  owner's times (`resultBeats` / `finalBeats`, from the phase start); the victory BODY = `victory.js#finalScene`; the combo cues stay in the
  header band (never over the play area, never a tap taken); MAKE 24 cut (18 types). OC3: NO SIDEWAYS SCROLL, EVER — every Overclock panel
  `overflow-x: hidden`, anything that moves past the edges in a clip of its own (guard: `tests/integration/e2e-oc-sideways.mjs`, 390 / 402 /
  430); the typing challenges on the kit's pads — NO input element, never the system keyboard (a computer's keyboard still types into them);
  Pattern Lock's first sequence in a match is easy (its own seeded stream); the hard ones' demos ride the rules card (`kit/slam.js` `demo`). OC3B: Spellcheck, Higher or Lower, Timeline, Sort It rebuilt (no rule or timing change — HIGHER OR LOWER is asked as "is the hidden one higher or lower", the same winner; the screens' step times pinned by `tests/overclock-oc3b.test.mjs`); Missing Link's joins are a neutral lit tube (never an arrow); never name a state `.is-hidden` (components.css hides it). OC4: THE REAL-GLASS CRACK (`crack.js` — a real CC-BY 3.0 photo, credited in ☰ → CREDITS +
  `assets/overclock/CREDITS.md`; every wrong answer, at the tap point) + Rewire, Memory, Color Clash, Odd One Out (FOUR FAMILIES — `odd.js`, dealt
  around the night memory), Quick Count, Signal Lock, Compass rebuilt; QUICK COUNT's EXACT FLASH (the clock starts once the shapes have painted —
  `count.js#afterPaint`, pinned by `tests/overclock-oc4.test.mjs`); on the new buttons right = green, wrong = red + cracked, NO ✓ / ✕ (the owner);
  Rewire's prefix is `oc-wire-` (`oc-rw-` = the round winner). COLOR CLASH (the owner's add-ons, Nov 7): the answers are COLOR WORDS in four different text colours (a derangement — none its own), always TAP THE TEXT COLOR (`challenges.js#clashAnswer`; no "tap the word" rule), never "ink" on screen. OC5: DUMB LUCK = the 19th challenge (`luck.js` PURE — honest odds, equal-EV
  payouts 20 × (n + 1), the draw AFTER the lock stored once in `game/dl/{ci}`, the race a pure script; at most once, never last, never solo or
  the daily — `buildOrder(…, { luck })`); a pick rides the board's existing fields (no rules change); its screen `ui/dumbluck.js` (prefix
  `oc-dl-`; the horses = `horse-frames.js`, GENERATED by `scripts/build-dl-horses.py` from Muybridge's frames); THE HORSESHOE = the server flag
  `overclock-horseshoe`; THE QUICK SOLO BOARD `overclock-quick-solo` (bounded by `logic.js#ptsCeiling`); the daily plug-in `daily.js` (OFF —
  the server-picked `daySet` in, one comparable score out). OC6: TRUE OR FALSE · HIGHER OR LOWER · TIMELINE · SORT IT are BUILT pools — never
  edit `data/oc/{truefalse,higherlower,timeline,sortit}.json` by hand: `node scripts/oc-pools/build.mjs` (Wikidata CC0 with a committed cache +
  the fame filter in every query; written statements each confirmed by their Wikipedia article or DROPPED; docs/content.md "THE POOL BUILD");
  values METRIC in the data, US units on screen (`units.js`); STABLE IDS (deals + the night memory key on them, never an index); TIMELINE = theme
  pools (four dealt, 10+ years apart); THE DAILY RESERVE (~20% of each, SERVER-ONLY in `api/_data/oc-reserve/` — never served, never dealt in a
  party; `daily.js#dayContent` = what a phone sees + the server's answers; docs/cartridge.md D2); `tests/overclock-content.test.mjs` checks it all.
  OC7: TRIVIA LIGHTNING · CLOSEST CALL · MISSING LINK · SPELLCHECK are BUILT pools too (never edit `data/oc/{trivia,closest,missinglink,spellcheck}.json`
  by hand) — OVERCLOCK's OWN TRIVIA BANK (no live trivia service, no question bank in the room; `js/trivia/` + `data/trivia/fallback.json` stay
  UNCHANGED for LAST SIGNAL · HIGH STAKES · BLUFF — hash-pinned by `tests/overclock-oc7.test.mjs`); every deal + the night memory by id (`tv-` `cc-`
  `ml-` `sp-`); MISSING LINK records each clue's SIDE (the answer screen + the demo show the WHOLE word, the link lit) and every join is a real word
  (Hunspell en_US / ENABLE) or a Wiktionary phrase; SPELLCHECK is American (the right word in Hunspell en_US — SCOWL; no wrong one a word in
  en_US / en_GB / ENABLE; `hard` = the common slip, the answer's underlines).
- **PRISM DROP:** never use the words "Tetris", "tetromino" or "T-spin" anywhere (pieces/prisms, twists).
- **FRIENDS A (docs/harbor/passes/friends-a.md, docs/profiles.md "FRIENDS A"):** the friends list = `pfr/{pid}` (server-written via `/api/profile`
  actions, its OWNER reads it — never another player); every change through the PURE `core/friends.js#friendStep` (REQUEST → ACCEPT; quiet decline +
  remove; BLOCK swallows their requests); ONLINE STATUS = NONE (only the green dot on a friend IN THE ROOM WITH YOU); NO DOCK TAB (the profile card,
  the badge on YOU, ADD FRIEND on name tags, the INVITE sheet); INVITES THAT WAIT (a push + the card — `profile/invites.js`, one /api call, never a
  socket); YOUR TABLE = `today` reads the friends list (≤ 12); THE CREW INTERCOM behind the owner's switch (`radio/crewIc`, default OFF); SAVE TO
  PASSWORDS (`profile/keychain.js` — a real credential form; the key goes nowhere new).
- **THE PASSWORD (PW1 — docs/password.md):** a DAILY-ONLY cartridge lives in `config.js#DAILIES` (never GAMES — GAMES is the lobby's list: the city's signs, HOW TO PLAY,
  THE BOARD, the reports); THE SERVER JUDGES EVERY GUESS (`api/_lib/pw.js` + `pw-day.js`: the answers in `api/_data/pw/` — never served, a door's word only
  once it closes; the schedule from the pepper, never the date); the list is BUILT + REVIEWED (`scripts/pw-words/`, never edited by hand); no ✓ / ✕ / ⌫
  glyphs as icons in the game (drawn SVG); every colour a `--pw-*` token. THE PASSWORD answers `/api/daily` only under `DAILY_TEST=1` until THE SWITCH-OVER.
  PW2 (Nov 7): THE FRONT DOOR → THE BACK ROOM (never "THE DOOR"); NO PILLS on the dailies (drawn objects or plain type; a button's radius modest); THE DRAWN DOORS
  (`password/doors.js`), THE DOOR REVEAL, THE END SCREEN (WELCOME IN · LOCKED OUT — the owner's ADD-ON; the block under the doors, the space at the foot), BOTH LOOKS as
  tokens (`body[data-look="day"]` retokens; the music follows the look — `index.js#musicFor`, app.js re-renders on a look change), the sounds (`sfx.js`), THE SHARE CARD
  (`share.js`, marks only), THE REWARDS awarded by the SERVER from its record (`pw.js#flags` → `dailyStep({ flags })` → KEYHOLE · the ≤ 6 card; `scripts/sim-password.mjs`).
- **COAST CLEAR (CC1 + CC2 — docs/coastclear.md):** CC2: BOTH LOOKS (the sunny harbor — its gradient tokens registered with `@property` so the look crossfades live), GETTING SPOTTED (WAAPI beams on `.cc-fx`, the screen counts a spot when its beam LANDS — `shownSpots`), THE END SCREENS (the lighthouse / CAUGHT, the finished harbor — the server's `reveal` only once a run is over), the share card draws ONLY `logic.js#shareInputs` (NO BOARD — a test proves it), THE FIRST-TAP CATCH in `sfx.js` (iOS: a sound held ≤ 400 ms until the tap's unlock runs), LIGHTHOUSE + GHOST RUN from the server's record (`cc.js#flags`, `GHOST_S` 50 by `scripts/sim-coastclear.mjs`). CC1: the second DAILY-ONLY cartridge (`config.js#DAILIES`); THE SERVER KEEPS THE BOARD (`dly/coastclear/{day}/b`, built
  once a day from the pepper, NO-GUESS — `api/_lib/cc-solve.js` proves every board; never served) and answers every move — a judged cartridge's `moves` go
  through `api/daily.js`'s generic path (ONE transaction each, never aborting on a transaction's first null; a repeat writes nothing); a phone gets only
  the cells it opened; buoys are the phone's alone; the clock = server time (+30 s a spot, +15 s a pause — THE DAILY MODULE calls pause); NO PILLS,
  drawn searchlights + buoy, every colour a `--cc-*` token; `LOOKS: ['day', 'night']` since CC2.
- **THE DAILIES — DFIX1 (FABLE REVIEW #1's fix pass — docs/games/review-dailies-1.md):** A RUN KEEPS ITS OWN DAY — every daily call after `start` carries the
  `day` it returned (`js/daily/run-day.js`; the server takes today's or yesterday's with a start there — `api/daily.js#dayOfCall`), so a run crossing 4 am
  Eastern finishes on its day; COAST CLEAR's PAUSE CAPS (3 a run, 20 min in all — `logic.js#MAX_PAUSES` / `PAUSE_CAP_MS`); ONE daily sound engine with THE
  FIRST-TAP CATCH (`js/daily/sfx.js` — a game's sfx.js is its table); a move a daily doesn't own → 400, never a 500. Left for THE DAILY MODULE: the throwaway
  gate (a daily counts only for a profile older than that day's 4 am), the IP limit on new profiles, the shared `js/daily/` kit, the schedule freeze.
- **THE CONTRACT (SHELL 2.0 B1 — docs/cartridge.md):** a game = `meta.js` (PURE, no imports — the console reads it at boot: options, minutes,
  music, banner, chat lock, SOLO) + its cartridge `index.js`, loaded ON DEMAND (`games/registry.js#loadGame` — never a static game import:
  `tests/cartridge.test.mjs` checks the boot graph, `node scripts/boot-bytes.mjs`); only `start` is async, `step` pure + seeded; `prepare` host-only,
  `preload` every phone ≤ 1.5 MB; the kit in `js/games/kit/` (prefix `gk-`, READY = `kit/ready.js`); the night's memory = `meta/used/{gameId}`
  (`kit/night.js`); `MUSIC: 'mood:<mood>'` = that station in sync; `SOLO: true` → THE SOLO LANE (the streak + a small capped XP, never a win);
  THE GAME LOOK = `body[data-look]` (`kit/look.js` — ☰ → Settings, per device, any match, NO lock: games read it LIVE, draw no switch of their own).
- **COLOUR-BLIND (SHELL 2.0 B1):** right / close = the shared tokens `--good` / `--close` (css/base.css) — never a game's own greens / golds;
  SETTINGS → "Colour-blind colours" sets `body[data-cb]` (blue / orange; per device + the profile — `ui/colorblind.js`). Right / close are
  NEVER shown by colour alone — a shape / a mark too. The city is not affected.

## Working efficiently (what cost the most in past sessions)
- **Edits:** use the Edit tool or a script file in the scratchpad. Never put code with backticks, `$` or `\b` inside an inline
  `node -e "…"` / heredoc — the shell mangles it and the repair costs more than the edit.
- **Names:** a view's own `update(state)` shadows Firebase's `update` — import it as `dbUpdate` (RUMRUNNER lost its DONE writes to this; the
  failure was silent because the view's update() just returned).
- **Tests, in order:** `node --test tests/*.test.mjs` (seconds) → the game's `FAST=1` E2E (≈ 2 min) → the full suite once before
  committing. Don't re-run a 20-minute suite to check one fix. Run E2E suites with absolute paths and from `tests/integration`.
  The title + the city run in the HARBOR suite by group while iterating: `ONLY=core,dock,neon` (comma-separated; ~30–130 s a group);
  the whole suite once before the commit. Untouched areas need no E2E at all (a game → its own). (CITY 1.0 OUT retired e2e-title / e2e-sky.)
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
api/ profile.js report.js board.js admin.js log.js sky.js time.js daily.js + _lib/   Vercel functions (firebase-admin): profiles, checked results, boards, moderation, errors + reports from phones (9e: SEND REPORT / the hang watch), live weather (+ NOAA's Kp), the server's clock (time.js: no imports, no-store)
package.json                                             only firebase-admin for /api (npm install at the root for local /api)
css/base.css components.css screens.css title.css        tokens + themes, the design system (+ NEON GLASS), setup/lobby, the title
css/kit.css                                              the match kit's default look (announcements, cards, Call the Winner, report)
css/board.css admin.css                                  THE BOARD, the membership card, podium plaques + rank-up; the admin page
css/<game>.css  (cipher signal overclock bluff pulse golf prism gridlock slip agent stakes rum) + css/chat.css
js/config.js  firebase-config.js  firebase.js            APP_NAME, limits, colors, avatars, GAMES registry / the web config / init + db helpers + serverNow() + THE PARKED DATABASE (want / release)
js/identity.js store.js room.js host.js app.js wakelock.js   slots + saved session / state + subscribe / rooms, presence, listeners / host loop + director / router
js/core/  room-logic.js hush.js lobby-song.js party.js rainbow.js marks.js palette.js neon-ramp.js rng.js obfuscate.js night.js playlist.js sky.js weather.js insights.js tube-path.js   PURE: room codes + host election, HUSH WORDS, the lobby song, PARTY NIGHTS, RAINBOWS, the games' neon marks + the tube alphabet, the palette + the light timeline, THE NEON COMES ALIVE's plan, seeded RNG, XOR+base64, game-night standings, room playlists, the real sun / moon / seasons / holidays / eclipses (sky.js), Open-Meteo + NOAA's Kp → the weather, the admin STATS, SVG → neon tubes; harbor-*.js: City 2.0 (below)
          week.js ranks.js names.js nicknames.js pkey.js boards.js match-report.js   PURE (server + client): Eastern week keys, XP ranks, board-name filter, THE HOUSE NICKNAMES (BNAME), keys, board catalog, per-game results
js/profile/ api.js me.js queue.js public.js callouts.js events.js sheets.js keypop.js  /api client, this device's profile, the results queue, room players' profiles, podium plaques (→ the end-of-round moment), the achievements' events
js/fx/ renderer.js gl.js kit.js index.js + one file per effect (gift.js + gift-specs.js: the gift cards' one engine + their layers)   THE EFFECT LIBRARY (THE VAULT 1A — docs/vault.md): ONE shared renderer (surfaces + slots) drawing through THE GL PAINTER (gl.js — WebGL2, a 2D look-alike: iOS rasterises a 2D canvas on the CPU call by call; 1B) with the 2D canvas as the fallback, the baked sprites, the effects
js/vault/ catalog.js strip.js emblems.js lab.js lab-views.js approved.js hero.js + css/vault.css + lab.html (/lab)   THE VAULT: the slim strips, the test emblems, THE CARD LAB (admins only, + its GIFTS), only-approved-ships, THE HERO-SPOT RULE
js/progress/ moment.js streak-card.js card.js profile.js flame.js look.js preview.js + css/progress.css   PROGRESSION's screens (docs/progression.md; lazy): the end-of-round moment + level-up, the streak card, THE GILDED CARD + the profile's sections, the dock's flame, ?preview=
js/core/ levels.js streak.js items.js achievements.js daily.js progress.js   PURE (server + client): PROGRESSION — the curve, the streak, the items, the 33 achievements + the award engine, the daily contract, the server's steps · js/daily/contract.js (a daily's /api calls)
js/board/ scene.js view.js screen.js public.js audio.js  THE BOARD: the bar (Canvas 2D), the board UI, app route, /board entry, its SFX
js/admin/admin.js                                        the /admin page
js/ui/    dom.js components.js final.js logo.js tube-logo.js game-art.js settings-panel.js help.js credits.js toast.js emblems.js debug-tools.js debug-strip.js word-neon.js   h(), the design system, the podium, the sign + City 2.0's SPEAKEASY tubes, game logos + lobby art, gear + settings, HOW TO PLAY, CREDITS (ADD A CREDIT = one entry in credits.js#CREDITS), toasts, emblems, the &debug=1 strips
js/audio/ settings.js engine.js music.js sfx.js ambience.js synced-songs.js mood.js lobby-music.js party-music.js beat.js diag.js tape-stop.js   prefs, the AudioContext + buses, music + playlists, SFX, ambience, songs on the server clock, MOOD MUSIC, the lobby's + City 2.0's PARTY song in sync (core/party-deck.js), the beat, the AUDIO panel, THE TAPE STOP (a decoded slice on a buffer source — the song element's playbackRate is NEVER changed: iOS stalls it). Session 'playback' with the music on, 'ambient' off; a dead graph hands the song to a plain <audio> (THE DIRECT PATH) — docs/audio.md
js/core/mp3-slice.js tape-math.js                        PURE: an MP3's frames → a byte slice in song time; the tape's rate schedule + its exact integral (docs/audio.md#the-tape-stop-in-web-audio)
js/trivia/                                               categories, API sources + filters, bundled bank, host feed (Last Signal / High Stakes / Bluff — never Overclock since OC7)
js/screens/ title.js title-neon.js title-taps.js title-dock.js setup.js profile.js backdrop.js   the front door in four files (the mount + the sequence · THE NEON COMES ALIVE + the race + the music's answer · the living city's taps · THE FLANK + its work — docs/title.md), name/avatar, the membership card, the menus' still of the city
js/screens/ room-city.js room-dock.js room-guests.js game-options.js room-banner.js   LOBBY 2.0 A + B — THE ROOM IN THE CITY (the roster → the city, the tags, the room dock, the guest list, the game's options, the game start, the banner + the champion; core/harbor-room.js + room-lines.js + room-show.js PURE)
js/games/cartridge.js  js/ui/layers.js                   THE CARTRIDGE PLUG (the contract + checkCartridge — docs/cartridge.md) · ONE SHEET STACK (every pop-up takes the next layer)
js/screens/harbor/ js/core/harbor-*.js + its sounds, bakes, canvas helpers   CITY 2.0 — THE HARBOR (?city=2): every file in docs/harbor.md#the-file-map (scene.js + its cuts: scene-fireworks / legend / holiday / weather / party / perf / panel)
js/daychart/  daychart.html                         THE DAY CHART (SCHED): the city's day + year from the planners — /daychart + a card in /admin (admins only)
js/chat/  logic.js chat.js ui.js                         PURE rules (locks, profanity) / data layer / the chat sheet + in-game button
js/games/registry.js lazy-view.js                        id → module (the contract), ALL_PLAYER_NODES; lazy view + stylesheet loading
js/errlog.js                                             errors from players' phones → /api/log → /admin (first import of app.js + board/public.js)
js/games/kit/                                            THE MATCH KIT: moments (announcer + cards), call, results, tiers, hook   → docs/match-kit.md
js/games/<id>/  logic.js director.js index.js view.js (+ scene/audio/…)   PURE rules / PURE state machine / contract + host duties / the screen
data/     trivia bluff oc words agent pulse prism slip    the banks and song analyses (formats in docs/content.md and each game's doc)
data/hushwords.json  scripts/hushwords/                  HUSH WORDS (room codes): built + checked by scripts/build-hushwords.mjs (docs/content.md)
audio/music/*.mp3  audio/pulse/*.mp3                     music (≤ 4 MB each; bump music.js#REV when replacing a file), PULSE songs; `c2-*.mp3` = the owner's City 2.0 mood songs (112 kbps, −16 LUFS)
audio/sfx/neon-*.wav  audio/weather/*.mp3                 City 2.0's recorded neon (scripts/build-neon-sfx.py; docs/audio.md), the thunder
scripts/  serve.mjs build-*.{mjs,py} add-city2-music.py validate-holes.mjs sim-gridlock.mjs split-closure.mjs   local server (:5173, `--emu` also runs /api on the emulators), THE CLOSURE SPLITTER (a run of a big closure → its own file, names rewired through live accessors — CITY 1.0 OUT; dev only), builders (build-synth-sfx.py: city sounds SYNTHESIZED — the hydrant's spray, the periscope's sonar ping — then imported by add-city-sfx.py; add-city2-music.py: the one command that imports the owner's mood folders), the NEON PAR hole bot, GRIDLOCK balance sim
database.rules.json                                      RTDB rules — paste into the Firebase console after every change
tests/*.test.mjs                                         unit + whole-match simulations (node --test, no deps)
tests/integration/  kit/harness.mjs e2e-*.mjs harbor-e2e/ (the Harbor suite: kit + one file per cloud job) title-perf.mjs pixdiff.mjs rules.test.mjs server.test.mjs *-preview.html   the E2E harness, per-game suites, rules tests, /api tests, no-Firebase look previews
tests/fixtures/finals.mjs                                finished matches of every game (profile/board tests)
```

## Data model (the shared core; every node and every game's `game` shape: `docs/data-model.md`)
```
rooms/{CODE}/       ← CODE = the HUSH WORD (a common 4-letter word; docs/content.md); hush/{WORD}: { closedAt } rests it 24 h after closing
  meta:      { hostId, status: 'lobby'|'playing', createdAt, activeAt, hostBeat, locked?, settings/{gameId}: {...}, go?, back? }   ← locked: LOCK THE DOOR; go / back: LOBBY 2.0 B's start + end stamps
  rv/{uid}:  matchId                                         ← THE REMATCH VOTE: your own vote, while meta/back.rm
  players/{uid}:  { name, color, avatar, joinedAt, pid? }    ← written by that player only (pid: their own profile id only, while seats/{pid} is theirs)
  presence/{uid}: { online, lastSeen, v: 2, c: { connId } } ← ONE CHILD PER CONNECTION (APP FIXES): online = any c child left
  kicked/{uid}:   true                                       ← host only
  game:      host-only; per-game shape; totals are always DERIVED from results (never stored) so a replayed step can't double-score
  night/{matchId}:   { g, p: { uid: 3|2|1|0 }, n: { uid: name }, b?: { uid: bonus }, at }  ← host; game-night scoreboard
  <game nodes>/{matchId}/…/{uid}                              ← a player's own data for the current step, phase-gated by the rules
chats/{CODE}/   fleets/{CODE}/   glsonar/{CODE}/   spy/{CODE}/   hsbet/{CODE}/   rrp/{CODE}/   seal/{CODE}/   ← top level: rooms/{CODE} is readable by any signed-in user, these are not (seal = THE SEAL: a round's secrets)
city2/live      ← CITY 2.0's PREVIEW PANEL for EVERYONE (server-written via /api/admin; admins listen live, every other phone reads the cached GET /api/admin?live=1; docs/harbor.md)
seats/{pid} (the profile's own devices — ONE ACCOUNT, ONE ROOM)  profiles/{pid} (signed-in, one at a time)  uids/{uid} (own)  pstats/{pid} (owner)  lb/ results/ ppriv/ pkeys/ tags/ rl/ audit/ flags/ (server only)   ← docs/profiles.md
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
- **Presence — ONE CHILD PER CONNECTION** (APP FIXES, Nov 1 — Grok 5.1: a refresh's OLD socket's late onDisconnect marked the player
  offline for the rest of the match): each `.info/connected` = true adds `presence/{uid}/c/{connId}` with `onDisconnect().remove()` (registered
  before the child exists), then `{ online: true, lastSeen, v: 2 }`, then an `onDisconnect().update({online:false,lastSeen})` (registered after
  the node exists — the server checks it against the node as it is). Online = any `c` child (`core/room-logic.js#presenceOnline`); every
  reader goes through `normalizePresence` (store.state.presence keeps `{ online, lastSeen }`). The room code is captured before the first
  await; while connected the client HEALS its own child (≤ every 5 s, a timed retry); leaving drops it. Proof: `e2e-presence.mjs` (the
  cloud's tests job). Offline players remain in the room as "SIGNAL LOST". The director doesn't wait for offline players.
- **Host migration (`core/room-logic.js#shouldClaimHost`):** host considered gone if its player node is gone,
  or (in the lobby) its presence has no connection for ≥ 10 s, or — during a game — `meta.hostBeat` (every 2 s) is ≥ 10 s stale: while a
  game runs the BEAT ALONE decides (a fresh beat blocks a claim whatever presence says; a stale one deposes a frozen phone whose socket
  looks online). Online players in join order claim with a stagger (+4 s per rank) via a transaction on `meta/hostId`; the rules check
  the same (10 s, the beat during a game, the claimer a live online player — not the stagger); `joinedAt` is set once at server time.
  A KICK stops every game write + presence (the rules want a live `players/{uid}` + no `kicked/{uid}`).
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
  or at once when the owner is offline; a rules test proves another player cannot read it. GRIDLOCK's results + sonar answers are
  written by the HOST only (it reads the fleets — a target could have answered "miss"). **THE SEAL** (APP FIXES — `games/kit/seal.js`,
  docs/data-model.md): a round's player-written SECRETS (BLUFF lies + votes, LAST SIGNAL answers, OVERCLOCK answers) live in
  `seal/{CODE}/{node}/{m}/{key}/{uid}` (owner-only), the room keeps `{ done, at }`; when the round closes the director writes
  `game/unseal/{node} = key` (PENCILS DOWN: no more writes, the host alone may read) — a module opts in with `export const sealed`;
  `sealGate` turns its director's "leave the phase" into "unseal first".

## Audio (the short version; everything else in `docs/audio.md`)
- **MOOD MUSIC** (docs/audio.md): menu screens play the time-of-day mood (`audio/mood.js`, songs in `data/mood-music.json`, built by
  `scripts/build-mood-music.py`; the owner adds songs as late3/morn1/day1/eve1/party1… in ~/Downloads → "add the new mood songs");
  a lobby plays one synced song for the room (`audio/lobby-music.js`, `meta/lm`, the host's clock); City 2.0's party nights play the PARTY deck on the server clock — every phone the same song (`audio/party-music.js`, docs/audio.md#the-party-song-in-sync). CLASSIC in settings = the old playlist.
  **CITY 2.0 MUSIC**: its own day + decks (`core/city-mood.js`, `city2` in `data/mood-music.json`); new songs → `scripts/add-city2-music.py` (docs/audio.md#city-20-music). SKY-B: every mood is a RADIO STATION on the server clock — the same song on every phone (`audio/party-music.js#stationOf`; docs/audio.md#the-radio-stations).
- `playMusic(id, fallback)` is driven by `app.js` from state (mood / menu playlist on title/setup/lobby, `module.MUSIC` in a game, `'victory'` on
  the podium). Same track = no-op. `PLAYLISTS` (menu, victory, spy, gridlock…) play several tracks with crossfades; `setPlaylist(id, ids)`
  for a seeded per-room order; `duckMusic(level, s)` and `filterMusic(hz, s)` for moments. Songs on the server clock: `audio/synced-songs.js`.
- **THE IDLE CUTOFF (SHELL 2.0 B2):** 5 h with no tap / key / scroll → the music fades + "Music paused — tap to bring it back" (`audio/idle.js`;
  `setPageQuiet(on, reason)` — each reason holds the quiet on its own); never during a match in a room.
- `sfx(name)` for the shared synth effects; games with their own palette ship a `createSfx()` in `audio.js` (soft, quiet, felt not heard).
- Audio must be unlocked by a gesture (iOS); the engine retries resumes on every tap and after app switches.

## Design system
- Tokens in `css/base.css :root`: backgrounds `--bg-0..3`, `--text/-dim/-faint`, neon `--cyan --magenta --yellow --green --red --orange --violet`,
  per-game `--accent --accent-2 --accent-ink --accent-soft --accent-glow`, fonts `--font-display` (Orbitron),
  `--font-ui` (Chakra Petch), `--font-mono` (JetBrains Mono), `--font-num` (Chakra Petch — use for all numbers; Orbitron's 0 looks like a block).
- Game identity: `body[data-theme=<id>]` (set automatically while a game runs) re-maps the accent tokens; the lobby card takes them too.
- **THE SHELL (SHELL 2.0 A — ONE LOOK EVERYWHERE; components.css "THE SHELL"; docs/title.md#the-shell--one-look-everywhere-shell-20-a-nov-5--docsharborpassesshell-amd-the-mocks-docsharborrefsshell): four parts,
  ONE builder each — a screen never keeps its own copy (tests/shell.test.mjs fails on one):**
  - **THE NEON TUBE** = every action button (`tubeButton()` / `.btn.btn-primary|-ghost|-danger .btn-sm .btn-block`): a lit tube, ONE pink MAIN a
    screen, SECONDARY cool white, DANGER red, the second tap to confirm turns the button itself red (`confirm:` / `confirmTap()`), static glow.
  - **THE SHEET** = every pop-up (`ui/sheet.js#openSheet`): solid, a handle, the small spaced title, ‹ when nested + ×; on THE LAYER STACK — the
    ONE Esc (`ui/layers.js`) closes the top; a pop-up never listens for Escape (`takeLayer(el, { close, min })` for a full-screen tool).
  - **THE ROW** = lists + menus (`row()` + `ICONS`): 56 pt glass, a neon line icon, label, value, ›, the pink switch for a toggle.
  - **THE MESSAGE** = `toast(text, kind, ms | { ms, sub })`: one at a time, above the dock (in a game under the corner), a neon tube by colour,
    sentence case. Gold is a vault / card accent only (the gems, the frames) — never a button.
- Other components (`js/ui/components.js`): `.panel`, `.chip` (+ `avatar()`), `.tag-host/.tag-you/.tag-lost`, `createTimer({ticks})`,
  `leaderboard()` (its rows become the players' SLIM CARDS — ui/strip-board.js), `countUp()`, `segmented()`, `chips()`, `burst()`,
  `glitchFlash()`, `createFinal()` (ui/final.js — THE PODIUM's FRAME: the console's; a game's body via `finalScene(el, game, state)`), `.game-head`.
- **NEON GLASS** (components.css): the panels, inputs, tags, leaderboard rows + podium keep the glass language; the buttons, sheets, rows +
  messages are THE SHELL's. (The frozen games' own `.modal` sheets keep the old base until each comes back.)
- **Player emblems** (`avatar(id, color, size)`): 12 shapes built like the neon sign; size with `--s`. Preview: `tests/integration/avatars-preview.html`.
- Game screens fill `.screen` with `overflow: hidden`. **THE CORNER BUTTONS ARE SPLIT ON EVERY SCREEN** (OC8 — the owner's ADD-ON, Nov 7: "every
  screen = the main page"): ☰ menu TOP-LEFT (THE SHEET of rows: CHAT — hidden while the game locks chat — YOUR CARD, HOW TO PLAY, SETTINGS, SOUND
  EFFECTS, QUIT TO THE ROOM, host END GAME — settings-panel.js#openMenu), music on/off TOP-RIGHT (music only, effects stay), level — never stacked;
  ONE shared rule in components.css ("SPLIT ON EVERY SCREEN"); both are 36 pt circles (`--cb`) with an invisible 44 pt tap area (`::after`) +
  safe-area insets. Every header makes room on BOTH sides: `var(--cb-room)` (the button + its 12 pt inset + 8 pt of air) — the left for ☰ (a title /
  a back button never under it: `.bar`, `.game-head`, OVERCLOCK's header, PRISM DROP's top line, THE BOARD's back + emblem, the podium's kicker),
  the right for the music; announcements stay clear of both. A long title SHRINKS to fit (OVERCLOCK: view.js#fitName — never wraps, never clips).
  The profile keeps its own rule (no ☰ — BACK takes the top-left corner). On a desktop the games' buttons sit at the phone column's corners; the
  title + the room (`body.nd-on`), setup (`nd-glass`) + THE BOARD (`bd-on`) pin them to the SCREEN's corners. (☰ → Settings holds THE GAME LOOK:
  AUTO · DAY · NIGHT — SHELL 2.0 B2.) A full-width game (`.screen.<x>-screen { max-width: none }`) must pin BOTH corners to the screen's edges
  (`.menu-btn { left: calc(var(--safe-l) + 12px) }` + `.music-btn { right: calc(var(--safe-r) + 12px) }`) — the frozen gridlock / slip / stakes / rum
  files still pin the old stacked pair (fix each when it comes back) — otherwise on desktop the buttons stay at the phone column's edge and land on
  the game's panels. Element helper: `h('div.class', { style: {'--c': hex}, onclick }, ...children)`.

## Adding a game (checklist)
1. **Rules:** `js/games/<id>/logic.js` + `director.js` (pure) → `createGame()` and `nextStep(game, ctx)`; a `tests/<id>.test.mjs` with
   whole-match simulations (2 and 8 players, host-migration replay = the same step twice gives the same patch) **before any UI**.
2. **Contract:** `index.js` exporting what `registry.js` lists (start, prepare, step, livePaths, MUSIC, DEFAULT_SETTINGS, OPTIONS,
   estimateMinutes, finalRanks, nightBonus?, MIN_PLAYERS?) and `createView = lazyView(() => import('./view.js'), gameSheets('<id>'))` (its sheet loads with its screen — anything two games share goes in components.css); register it; add player
   nodes to `ALL_PLAYER_NODES`; `GAMES` in `js/config.js`; `css/<id>.css` + `<link>` in `index.html`; lobby art in `ui/game-art.js`;
   rules in `ui/help.js`; a theme in `css/base.css`; a music id or playlist in `audio/music.js`; THE BOARD: its standings + records in
   `js/core/match-report.js` (with plausibility bounds), its boards in `js/core/boards.js`, its colours in `js/board/view.js#GAME_LIGHT`; its neon mark + blade word for the title city's signs in `js/core/marks.js`.
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
  file) AND the FULL `e2e-harbor` suite (a City 2.0 pass) — the cloud run then CONFIRMS instead of discovers. Measured on it: unit ≈ 30 s (PERF-A's split), rules ≈ 27 s,
  smoke `GAMES=cipher` ≈ 30 s, one harbor group ≈ 30–130 s, THE FULL HARBOR SUITE ≈ 20 min at 4 shards (the default since PERF-A; PERF-B: the windows group 3 pages at a time — the shards end at ~690–890 s; ~800 checks; the machine's peak ~13 GB of 32 — models.md). **Run the full suite with nothing
  else busy** (no model bakes, no shot bursts beside it: under that load every group timed out "the harbor baked" — MODELS). Browser tests run
  OUTSIDE Claude Code's sandbox (its private AppData copy can't launch Chromium); THE GPU PIN (SHELL 2.0 B1): booted with no display, the kit pins the Radeon by its LUID — speed checks all red together → `node tests/integration/gpu-check.mjs "<browser>"` first (docs/testing.md); EVERY browser script imports puppeteer from
  `tests/integration/kit/puppeteer.mjs` (muted; on Windows software compositing — the TV runs at 29 Hz and headless Chromium followed it to ~30 fps): the local, uncommitted rule in `.claude/settings.local.json`
  (`node tests/integration/e2e-*`, `shots.mjs`, `title-perf.mjs`, `pixdiff.mjs` — run them from the repo root with those paths). Chromium:
  `C:\Users\benja\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`. The laptop is retired (a backup).
- **GitHub checks** (unit → rules → /api → smoke, on the emulators) run **only on a pass's FINAL push** (SP6, the owner's CLOUD MINUTES, Oct 27):
  a game / app pass tags that push's commit **`[ci]`**, a City 2.0 pass **`[harbor]`** (which runs both workflows); pull requests + `gh workflow run tests`
  always run; every other push shows a skipped run (0 minutes) — run the unit suite locally before every push. Next to the Vercel deploy, never
  blocking it. Budget: ≈ 95–105 billed cloud minutes a pass (THE SPEED PASS — FR6 G8's real count: tests ≈ 8–10, the harbor's 15 jobs ≈ 85–95). Look at `gh run list` after pushing; a red ✗ is a broken main to fix first. Errors from real phones: `/admin`.
- **VERCEL DEPLOYS ONLY TAGGED PUSHES** (the owner's DEPLOYMENT STORAGE, Oct 27: Hobby's 10 GB went at ~300 MB a deploy on every push):
  `vercel.json#ignoreCommand` builds only when the push's **LAST commit message** carries **`[harbor]`**, **`[ci]`** or **`[deploy]`**
  (unlike the GitHub checks, which read every commit of the push) — so a pass makes ONE deployment: its FINAL push carries its tag (as above)
  ON THE TOP COMMIT; anything that must go live mid-pass (a hotfix, a docs-only fix the site shows) goes up with **`[deploy]`** (deploys, runs no
  cloud tests). Every other push shows "Canceled by Ignored Build Step" on Vercel — main stays live on the last tagged deploy.
  `.vercelignore` keeps everything no page or `/api` loads out of the deploy (docs, screenshots, tests, scripts, shots*, art) — a deploy ≈ 264 MB,
  ~255 MB of it the music; a new top-level folder the site loads must NOT match it. Never write a tag in square brackets in a message that
  isn't meant to fire it (a message that NAMES the tags fires them all — write "the ci / harbor / deploy tags").
- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`, 15 parallel jobs — THE SPEED PASS added `speed`): the FULL `e2e-harbor` suite runs only on a pass's FINAL push
  (the harbor tag in a commit message — whatever the push touched, docs-only included: no path filter since FR6 FIXES A, `tests/workflows.test.mjs`) or `gh workflow run harbor` (`-f job=street`). **At most TWO cloud runs a pass**;
  never re-run to confirm a flake. A new test group: its `G()` in `tests/integration/harbor-e2e/<job>.mjs` + its name in exactly one job in
  `harbor-jobs.mjs`. Locally (the mini PC): the touched groups (`ONLY=…`) while working, the FULL suite once before the final push. Full text: docs/harbor.md.
- **THE DISPLAY CHECK (SHELL 2.0 B2 — no dummy HDMI plug):** a REAL-COMPOSITOR speed check asks `kit/puppeteer.mjs#displayAttached()` — no display
  → SKIPPED with "no display attached (a no-screen boot)", counted apart in the suite's last line (never a fail, never a silent pass); docs/testing.md.
- **THE BASELINE GUARD:** `ONLY=perf` fails above 2× `tests/integration/perf-baseline.json` (`PERF_GUARD=only` ≈ 1.5 min; `PERF_BASELINE=write`
  only when a pass changes the cost on purpose — say so). A cache keyed per frame must hold its whole working set.
- `node --test tests/*.test.mjs` — unit + whole-match simulations of all twelve games (the ten hidden ones' quick tests kept), no deps, seconds (+ profiles/boards/XP: `profiles.test.mjs`).
- `/api` on the emulators: `node --test server.test.mjs` (in tests/integration); the whole profile flow: `node e2e-profiles.mjs "<browser>" ./shots-profiles`.
- Emulators (Java + Node): `cd tests/integration && npm install && npm run emulators`; rules: `node --test rules.test.mjs`;
  app: `node scripts/serve.mjs` → `http://localhost:5173/?emu` (`&slot=2`… for more players on one computer).
- **CONN — the database sockets:** `node e2e-conn.mjs "<browser path>" ./shots-conn` (≈ 1.5 min; `MEASURE=1` = the table only, `LINE=1` = each
  state's reasons): 0 sockets on a parked title, 1 in a room, 0 after QUIT + the grace — run it after touching room / boot / firebase.js.
- Smoke test first: `node e2e-smoke.mjs "<browser path>" ./shots` (two regular phones, the TWO PLAYABLE games started + a check that none of the ten hidden ones can start, no stray "null" — ≈ 30 s; `GAMES=cipher` = only those — the one-game check a City 2.0 pass runs after touching a shared file).
- Per game (WINDOWS: only PRISM DROP + OVERCLOCK run now — the ten hidden games' long E2Es stop until each comes back): `node e2e-<id>.mjs "<browser path>" ./shots-<id>` (env `N=8 SHOTS=0 GPU=1 CPU=4 PERF=0/1 FAST=1`); previews without Firebase:
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
