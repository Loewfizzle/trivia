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
| `docs/harbor.md` | **CITY 2.0 — THE HARBOR** (the title's new city, behind `?city=2`, 12 parts): the bible (the owner's decisions, size rules, hero pieces), the camera + layout numbers, baking + the memory budget, lanes + events, `&grid=1`, the performance budgets, what each part builds |
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
  Never read layout (getBoundingClientRect / clientWidth) in a frame loop — sizes come from ResizeObservers. Everything respects `prefers-reduced-motion`.
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
- **`&debug=1` (City 2.0):** the frame-time READOUT (+ the weather's source, age + mapped state) and the AUDIO panel are DOM strips at
  the TOP under the TEST pill + the corner buttons (`ui/debug-strip.js`) — WIN2: every strip starts FOLDED on every load (never
  remembered open), the readout's title cycles open → EVERY OTHER STRIP HIDDEN → folded, the open LOAD log capped + scrolling — never
  over the pill, the promenade or the dock; THE PREVIEW PANEL → TOOLS switches them without the link.
- **Look previews without Firebase:** `tests/integration/<id>-preview.html` mounts the REAL view with a scripted state through an import
  map that swaps `js/firebase.js` for `tests/integration/fake-firebase.js` (see gridlock-preview.html). Iterate screens there in
  seconds; run the E2E once the look is right.
- **Profiles are polish too:** joining and playing must work with `/api` down or unconfigured (no tags, no emblems, results queue).
  Clients never write boards, stats, XP or ranks (server-only in the rules); board ids use dashes (`cipher-score`), never dots.
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
api/ profile.js report.js board.js admin.js log.js sky.js + _lib/   Vercel functions (firebase-admin): profiles, verified results, boards, moderation, errors from phones, live weather (+ NOAA's Kp)
package.json                                             only firebase-admin for /api (npm install at the root for local /api)
css/base.css components.css screens.css title.css        tokens + themes, the design system (+ NEON GLASS), setup/lobby, the title
css/kit.css                                              the match kit's default look (announcements, cards, Call the Winner, report)
css/board.css admin.css                                  THE BOARD, the membership card, podium plaques + rank-up; the admin page
css/<game>.css  (cipher signal overclock bluff pulse golf prism gridlock slip agent stakes rum) + css/chat.css
js/config.js  firebase-config.js  firebase.js            APP_NAME, limits, colors, avatars, GAMES registry / the web config / init + db helpers + serverNow()
js/identity.js store.js room.js host.js app.js wakelock.js   slots + saved session / state + subscribe / rooms, presence, listeners / host loop + director / router
js/core/  room-logic.js hush.js lobby-song.js party.js rainbow.js trees.js street-life.js people.js rng.js obfuscate.js night.js playlist.js sky.js weather.js insights.js harbor-layout.js harbor-events.js harbor-windows.js harbor-neon.js harbor-boats.js harbor-sky.js harbor-show.js harbor-remote.js harbor-dark.js harbor-signdim.js harbor-clouds.js harbor-speakeasy.js harbor-moments.js tube-path.js   PURE: room codes + host election, HUSH WORDS, the lobby song handoff, PARTY NIGHTS (the window, the beat clock), RAINBOWS (after real rain: when, which bow, where), THE STREET (trees through the year; the street's layout, buses, signal, cars, plows; the people, the door, hails), seeded RNG, XOR+base64, game-night standings, room playlists + callBonus; sky.js the real sun, moon, seasons, holidays, planets, eclipses; weather.js Open-Meteo → the city weather; insights.js the admin STATS; harbor-layout.js / harbor-events.js / harbor-windows.js / harbor-neon.js / harbor-boats.js CITY 2.0's camera + layout, its event scheduler, its addressable windows + the light timeline + the words, its neon (the palette roles, the outlines, the sign spots + the roof signs + tonight's pick), its boats' routes on the clock, its sky (the aurora's nights, the moon's look, what may fly, sky messages, the birds, the holiday sky table, the drone show's shapes), its PARTY SHOW's director + the everyday neon motion (harbor-show.js), THE PREVIEW PANEL's registry + validation (harbor-remote.js, shared with /api/admin), ONE darkness input every light reads + the blue-hour power-up (harbor-dark.js), the sign-dim hook for sky messages (harbor-signdim.js), THE CLOUDS' kinds from the real weather + their perspective layout + their light (harbor-clouds.js, DT2), THE SPEAKEASY's plan — the rooms behind its windows, the weekly ghost ad, the corner turn (harbor-speakeasy.js, 7a), its LIFE — the window moments' catalogue, the day's schedule seeded by the date, the rooms' states by the hour, the TV's irregular flicker (harbor-moments.js, 7b; WIN2: the edge windows' seeded moods edgeMoods + the eyes' calendar eyesNights) (docs/harbor.md); weather.js also parses NOAA's Kp (the aurora's storm night); tube-path.js SVG paths → tube polylines + their uneven light
          week.js ranks.js names.js pkey.js boards.js match-report.js   PURE (server + client): Eastern week keys, XP ranks, board-name filter, keys, board catalog, per-game results
js/profile/ api.js me.js queue.js public.js callouts.js  /api client, this device's profile, the results queue, room players' profiles, podium plaques + rank-up
js/board/ scene.js view.js screen.js public.js audio.js  THE BOARD: the bar (Canvas 2D), the board UI, app route, /board entry, its SFX
js/admin/admin.js                                        the /admin page
js/ui/    dom.js components.js final.js logo.js tube-logo.js game-art.js settings-panel.js help.js credits.js toast.js emblems.js debug-tools.js debug-strip.js word-neon.js   h(), design-system components, the podium, the sign (+ its premium layers + anchors) + City 2.0's SPEAKEASY in white neon tubes (word-neon.js), each game's tube logo, lobby art, gear + settings, HOW TO PLAY, THE CREDITS sheet (☰ → CREDITS: ADD A CREDIT = one entry in credits.js#CREDITS), toasts, rank emblems, the readout + AUDIO panel switches + their folds (remembered per device), THE DEBUG STRIPS (both as DOM strips at the top, FP3a)
js/audio/ settings.js engine.js music.js sfx.js ambience.js synced-songs.js mood.js lobby-music.js beat.js diag.js tape-stop.js   prefs, AudioContext + buses (+ the audio event log), music + playlists, synth SFX, title ambience (+ thunder, fireworks), songs on the server clock, MOOD MUSIC, the beat the city breathes to, THE AUDIO PANEL (&debug=1: why the music is silent), THE TAPE STOP IN WEB AUDIO (the TR-3B's drain: a decoded slice of the song on a buffer source, its rate ramped — the song element's playbackRate is NEVER changed, iOS stalls it; docs/audio.md#the-tape-stop-in-web-audio). The audio session is 'playback' with the music on, 'ambient' off; a dead graph (a 'running' context whose clock never moves — iOS after the background) hands the song to a plain <audio> element, THE DIRECT PATH (docs/audio.md#m4)
js/core/mp3-slice.js tape-math.js                        PURE: a song's MP3 frames walked to place a byte slice in song time (to one frame); the tape's rate schedule + its exact song-position integral (tests/mp3-slice.test.mjs on the real files, tests/tape-stop.test.mjs on a fake AudioContext; the browser proof: tests/integration/tape-preview.html + the e2e-harbor `tape` group)
js/trivia/                                               categories, API sources + filters, bundled bank, host feed (Last Signal / Overclock)
js/screens/ title.js title-dock.js setup.js lobby.js profile.js district/{scene,backdrop,fx,party-fx,fireworks,rainbow,furniture,people,palette,signs,marks,sign-logic,stars,weather-fx,rain,frost,wildlife,street,aircraft,live-weather,sun,neon-ramp}.js   the front door, name/avatar, the lobby, the membership card, the city (Canvas 2D: sky, effects, signs, LIVE WEATHER, birds, the street) + its still behind menus
js/screens/harbor/{scene,bake,tones,shapes,blocks,skyline,lights,rays,searchlights,neon,signs,tubes,sky,quay,water,waterfront,pier,wheel,lighthouse,boats,boat3d,boat-models,road,speakeasy,speakeasy-geo,speakeasy-blade,speakeasy-bake,stage,foreground,grid}.js   CITY 2.0 — THE HARBOR (?city=2 only; docs/harbor.md; boat3d + boat-models: 8b2's boats as real 3D models — HOW TO ADD A BOAT in docs/harbor.md#part-8b2)
js/screens/harbor/{skyfx,air,banner,smoke,birds,balloons,drones,moon}.js   THE HARBOR's everyday sky (Part 6a): the manager + the API (harbor().sky), airliners + satellites + the helicopter, the banner plane, skywriting + skytyping, the birds, balloons, the drone show, the moon + the golden haze + the aurora
js/screens/harbor/{legends,jets,meteors,aurora}.js js/core/harbor-legend.js js/core/harbor-director.js js/core/harbor-flight.js   PART 6b — THE SPECIAL SKY: the UFO abduction + the TR-3B's power drain + the jet chase (legends.js, LAZY; WHEN + HOW pure in harbor-legend.js: the seeded nights, the timelines, the drain, NO TRAFFIC DURING THE LEGENDARIES — `trafficHold`, the hold every vehicle planner reads), ONE F-22 Raptor-style stealth fighter + Mach diamonds + heat haze + the air show / missing man / surprise flyby (jets.js; preview: tests/integration/jets-preview.html), the Harbor's shooting stars (meteors.js, fx.js's s.meteorArt), City 1.0's aurora re-fit (aurora.js), THE DIRECTOR (the spectacle budget per tier + priorities, pure), the geese's V + the bats' flight (harbor-flight.js, pure) (docs/harbor.md#part-6b)
js/screens/harbor/windows.js                             PART 7b — THE SPEAKEASY'S LIFE drawn: the figure kit + the cat, each moment's painter (PAINT[id]), the TV glow, the night lamp, the barbershop's day, the mirror door, the taps (docs/harbor.md#part-7b); SP4: LIT PEOPLE in lit rooms (figure(): P.lit + P.marks + litPal — real colours modelled by the room's lamp; core/harbor-moments.js#WINDOW_LOOKS says which scene is lit / a shadow / a silhouette); WIN2: ACT BIG (walkIn — people arrive + leave through the room's depth, never a cut), THE TV ROOM B (the couch facing the window, faces lit from below: lit.below), THE EDGE WINDOWS' MOOD LIGHTS (edgeMood — light + shadow only), THE EYES IN THE HAZE (PAINT.eyes) (docs/harbor.md#win2); WIN3: THE BOSS'S TV ROOM with NO PERSON (tvRoom / tvDark — the unseen set's glow from below the sill, the flicker + the shadow from core/harbor-moments.js#tvLight / tvShadow, the raid's cut, the quiet nights' beds), THE CASH COUNT's close-up with natural hands (PAINT.cash), THE PARTY IN THE WINDOWS (partyRoom — one room at a time, dark silhouettes on the beat; core#windowParty; the pools on the cobbles drawn by scene.js) (docs/harbor.md#win3)
js/screens/harbor/remote.js css/harbor-remote.css         THE PREVIEW PANEL (?city=2): everyone follows city2/live; the owner's TEST pill + sheet (JUST ME / EVERYONE ON CITY 2); WIN: PLAY ALL (a sequencer per catalogue + its chip), a SPEAKEASY section, the weather in groups, the off-switches in TOOLS
js/core/harbor-rooms.js harbor-spots.js                  WIN — 2.5D ROOMS (PURE: each room a box in perspective about its vanishing point, a plane at depth t = one uniform scale; windows.js#deepAt / paintBox / lampFall) · THE DRESSING SPOTS (PURE: named places at the bench / lamps / hydrant / railing / corner every holiday fills with big set pieces + THE RULES; Halloween's big jack-o'-lanterns: core/harbor-holidayprops.js#BIG_PIECES) (docs/harbor.md#win)
js/screens/harbor/{people,folk,bus,hushsign,doors,wands}.js js/core/harbor-people.js js/core/harbor-routines.js js/core/harbor-hush.js js/core/harbor-lamps.js   8P — THE PEOPLE: the planner (PURE: the walkable map, WHO'S OUT WHEN as data, visits planned per seeded block — every phone the same, joined mid-way; the crossing on WALK, the bus's timetable, the lobby line, the roof), the live manager (three depth passes + their sounds), the figures (1920s silhouettes, a stride-locked walk, poses, lit by the scene; preview: tests/integration/folk-preview.html), the 1920s bus; THE HUSH WORD SIGN (plan + neon; WIN: on the corner pier's door plate, the letters stacked — core/harbor-hush.js#wallPlan); THE LAMPS' LIFE (docs/harbor.md#part-8p) FP3b: the 2.5-D rig (facing from the heading, the walk + run cycles), REAL DOORS (doors.js: the swing, the doorway, the spill), THE ROUTINES (harbor-routines.js: the dance circle, the vendor spot's schedule) + the wands (wands.js)
js/core/harbor-loadlog.js tests/integration/load-log.mjs   POLISH 5 — THE LOAD LOG (PURE: every change to the picture from the first frame to 15 s after the reveal, its cause, which ones the eye sees; scene.js writes it, &debug=1 shows it as the folded `load` strip, harbor().loadLog) + the repro (a Safari-like load: bars, throttle, cold / warm; docs/harbor.md#polish-5). The load gate also waits for the fonts, the weather (kept per device: district/live-weather.js), the clouds + the extras; the title's rects measured through the screen's entrance transform (title.js#restRect)
js/core/harbor-roofmodes.js                              SP3 — THE ROOF SIGNS' HOURLY MODES (PURE: spell / race / breath per sign per hour, one big move at a time, the restart flicker; neon.js draws them)
js/core/harbor-raid.js harbor-cabs.js js/screens/harbor/raid.js   PART 8b2 — THE RAID (PURE: the schedule after the bootleggers' deliveries + a rare party night, the convoy simulated once, the officer, the front car + its spotlight, the lights' return) + its light (the red + blue wash, the shades, the flashlight, the spotlight's beam + hard circle, drawBeacon) · THE CABS (PURE: the night's calls at the truck stop, drop + pick-up riders, the TAXI lamp lit when free) (docs/harbor.md#part-8b2)
js/core/harbor-holiday.js harbor-holidayfolk.js harbor-holidayprops.js harbor-ghost.js js/screens/harbor/{signdress,dress-halloween,dress-dotd,holidayprops,ghostship,witch}.js   PART 11a-1 — THE HOLIDAYS: THE CALENDAR (PURE: date-driven build-ups, the night, the come-down, the pieces, THE HOLIDAY LIGHT RULES — every holiday piece reads it; ADD A HOLIDAY: docs/harbor.md#part-11a-1), THE SIGN DECORATION SYSTEM (a full-dpr canvas in the logo's wrap) + Halloween's FUTURISTIC web + bio-mechanical spider (SP4: a geometric web of light filaments + a shimmer; a chrome spider whose legs never leave their sectors — tests/spider.test.mjs) + Day of the Dead's sign, the ground's pumpkins / marigolds / papel picado / monarchs, the ghost ship + the witch (+ the bats in birds.js), the holiday people (trick-or-treaters, zombies, the procession — PURE); the window figures' kit + the holiday window scenes are windows.js + core/harbor-moments.js
js/core/harbor-parade.js harbor-xmas.js js/screens/harbor/{giant,harvest,dress-thanksgiving,parade,chimneys,xlights,treestand}.js   PART 11a-2 — THANKSGIVING + THE PARADE: THE PARADE SYSTEM (PURE + reusable: the route, the units in order, spacing, the pace, the clock — joined mid-way, the traffic hold, the crowd's cheers, the balloons in the real wind; HOW TO ADD A PARADE: docs/harbor.md#part-11a-2) + its balloons / float (parade.js), Halloween's GIANT BITCOIN PUMPKIN (giant.js: ray-marched, baked in slices), the HARVEST DISPLAY + the November spot pieces (harvest.js), the sign's HARVEST WREATH, CHIMNEY SMOKE (reusable for winter), BLACK FRIDAY + THE FIRST OF CHRISTMAS (harbor-xmas.js PURE: the rush, the crew's strings, the tree stand, the strings' evenings; xlights.js the C9 strings on the speakeasy, treestand.js the tree vendor); the homecoming party night = core/party.js#partyDow
js/core/harbor-workers.js harbor-crew.js harbor-witness.js js/screens/harbor/{gear,workers}.js   PART 8b1 — THE WORKERS' SCHEDULE (the timetable PURE: fixed regulars, windowed shows, never two at once, cause + effect; the crew's itineraries + trucks + traces PURE) + their gear + props + the billboard's sheets + the blade's repaint; THE WITNESSES (a legendary night reshapes the promenade, PURE) (docs/harbor.md#part-8b1)
js/core/harbor-wildlife.js js/screens/harbor/{wildlife,fauna}.js   PART 8b1 — THE WILDLIFE (the plan PURE; the live manager; the art) (docs/harbor.md#group-2)
js/core/harbor-weather.js js/screens/harbor/{rainfx,lightning,waterfog,wetground,glasswx}.js   PART 9a — THE WEATHER: ONE city state from the live / forced answer + its soft transitions (PURE); the Harbor's rain (lit by the tubes + lamps), the capped lightning, the fog on the water, the wet promenade (puddles drying, the lamps' wet streaks, the drips, the wet glass), the weather on the NEON tubes + the dock's / corner buttons' glass (beads, drips, glaze, icicles, frost — small overlay canvases at z 72) (docs/harbor.md#part-9a)
js/screens/harbor/{clouds,dayfx}.js                      THE CLOUDS (DT2: per-pixel shaded volumes baked once + re-lit in time slices; Part 9 plugs in: KINDS + set(); preview: tests/integration/clouds-preview.html) · the day's motion (flags in the real wind, sun glints on glass)
js/screens/harbor/{trees,props,props-light,props-garden,props-test,roadlight,street,motorcar,sounds,centre}.js js/core/harbor-centre.js js/core/harbor-promenade.js js/core/harbor-trees.js js/core/harbor-light.js   PART 8a — THE PROMENADE: the plan (bands, sizes, the layout, the season, the implied road's passes, the zones), the trees' plan (pure) + their art in four seasons + the falling leaves, the bench / cart / planters / the brick INLAY + the mailbox, PF's centrepiece EVENT RIG (harbor-centre.js pure + centre.js: `harbor().centrepiece.set()` for the holidays), the implied road's light, FP2's street under the dock + the 1928 sedan crossing it at rest, the city sounds' wiring; FP3a: THE LIGHT on the promenade in ONE pure module (harbor-light.js: the pools, a face's lamp, the trees', the road's, the sun's shadow), props.js split (the light model + frame / the dormant urn + mailbox / the lazily loaded test obelisk) (docs/harbor.md#part-8a, #fp2, PF, FP3a)
js/screens/harbor/{vehicles,fogbeam}.js js/core/harbor-traffic.js   POLISH 4: THE VEHICLE KIT (seven 1920s–30s models, both roads, 8b's police car + trucks are new MODELS), the back road's pure traffic, the beams in fog as one volumetric body (previews: tests/integration/{vehicles,jets}-preview.html); THE BLACKOUT is core/harbor-legend.js#blackAt + scene.js's dark city (docs/harbor.md#polish-4)
js/core/city-sounds.js city-sounds-files.js js/audio/city-sound.js scripts/add-city-sfx.py audio/city/   THE CITY SOUNDS: the 63 slots (pure), the generated takes, the player, the import command, the recordings + CREDITS (docs/audio.md#the-city-sounds)
js/screens/harbor/{skybeams,strings}.js                   NEON PASS 4: the party's SKY BEAMS (reusable: holidays, the tribute), the CAFÉ-LIGHT CANOPY on the speakeasy's roof (SP2: big Edison bulbs on swags between set-back posts; reusable schemes for Parts 8 + 11)
js/core/harbor-dance.js                                  SP5 — THE DANCE CLOCK (PURE: every dancer's beat — the song's grid with every change of phase / tempo BLENDED, the energy winding down at a song's end, idle in the gap, the pick-up; the window party + the promenade's circle read it; tests/harbor-dance.test.mjs)
js/core/harbor-beat.js  js/ui/canvas-safe.js              THE BEAT (PURE: the song's grid from the song's clock minus ONE lead, every beat punching, the kicks only calibrating the lead — docs/audio.md#the-beat-sync-pass; audio/beat.js hears them) · Safari-safe canvas helpers (blurWorks, blit, ctx2d, safeCtx — every Harbor context; the Harbor's floor is iOS 16, the rest of the app parses on older iOS: no top-level await, tests/safari-floor.test.mjs)
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
tests/integration/  kit/harness.mjs e2e-*.mjs title-perf.mjs pixdiff.mjs rules.test.mjs server.test.mjs *-preview.html   the E2E harness, per-game suites, rules tests, /api tests, no-Firebase look previews
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
city2/live      ← CITY 2.0's PREVIEW PANEL for EVERYONE (server-written via /api/admin, read by signed-in users; docs/harbor.md)
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
- **Privacy pattern** (GRIDLOCK, DOUBLE AGENT, HIGH STAKES — whose host may read the hidden bets only once the phase is `show`; RUMRUNNER — private day logs the host reads only at night, and the server replays the whole city from the books): secrets in a top-level node readable by the owner (+ the host when it must act);
  the owner's client does the private computation and publishes only the public result; the host falls back after a few seconds
  or at once when the owner is offline; a rules test proves another player cannot read it.

## Audio (the short version; everything else in `docs/audio.md`)
- **MOOD MUSIC** (docs/audio.md): menu screens play the time-of-day mood (`audio/mood.js`, songs in `data/mood-music.json`, built by
  `scripts/build-mood-music.py`; the owner adds songs as late3/morn1/day1/eve1/party1… in ~/Downloads → "add the new mood songs");
  a lobby plays one synced song for the room (`audio/lobby-music.js`, `meta/lm`, the host's clock). CLASSIC in settings = the old playlist.
  **CITY 2.0 MUSIC** (`?city=2`): its own day (`core/city-mood.js`: dawn / 11 am / golden hour / 11 pm / the party show) and its own decks (`city2` in
  `data/mood-music.json`: the owner's ~50 songs, some in two moods); the MUSIC MOOD setting (AUTO / MORNING / DAY / EVENING / LATE NIGHT / PARTY) works in
  both cities. New songs: drop them in ~/Downloads/{morning,day,evening,late,party}/ and run `scripts/add-city2-music.py` (docs/audio.md#city-20-music).
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
- **GitHub checks** (unit → rules → /api → smoke, on the emulators) run **only on a pass's FINAL push** (SP6, the owner's CLOUD MINUTES, Oct 27):
  a game / app pass tags that push's commit **`[ci]`**, a City 2.0 pass **`[harbor]`** (which runs both workflows); pull requests + `gh workflow run tests`
  always run; every other push shows a skipped run (0 minutes) — run the unit suite on the laptop before every push. Next to the Vercel deploy, never
  blocking it. Budget: ≈ 30–40 cloud minutes a pass (tests ≈ 10, the harbor's 7 jobs ≈ 25–30). Look at `gh run list` after pushing; a red ✗ is a broken main to fix first. Errors from real phones: `/admin`.
- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`): the FULL `e2e-harbor` suite runs on GitHub **only on a pass's FINAL push** —
  put **`[harbor]`** in a commit message of that push (and it must touch a City 2.0 file: the `paths:` list) — or by hand: `gh workflow run harbor`
  (`-f job=street` = one job). Mid-pass pushes show skipped runs and cost nothing (both workflows: a newer full run cancels an older one).
  It runs as **4 parallel jobs** (`audio` `show` `city` `street`, ≈ 4 min each); a red job → **"Re-run failed jobs"** re-runs that job only.
  **A new test group goes in exactly one job in `tests/integration/harbor-jobs.mjs`** (e2e-harbor.mjs refuses to run and the unit test fails
  until it does). Timing checks (`okT`) and known-flaky pixel probes (`okF`) are WARNINGS on CI, listed in each job's summary page.
  City 2.0 passes never run the whole suite on the laptop (it runs out of memory): the unit suite + the touched groups (`ONLY=…`) locally,
  then the final `[harbor]` push and read `gh run list --workflow harbor`.
  **CI minutes (the owner, Oct 24): at most TWO cloud runs per pass.** Never re-run the cloud suite to confirm a flake: a failed check in
  code the pass didn't touch that is a known flake goes in the pass's "Known issues" and the pass finishes.
- `node --test tests/*.test.mjs` — unit + whole-match simulations of all twelve games, no deps, seconds (+ profiles/boards/XP: `profiles.test.mjs`).
- `/api` on the emulators: `node --test server.test.mjs` (in tests/integration); the whole profile flow: `node e2e-profiles.mjs "<browser>" ./shots-profiles`.
- Emulators (Java + Node): `cd tests/integration && npm install && npm run emulators`; rules: `node --test rules.test.mjs`;
  app: `node scripts/serve.mjs` → `http://localhost:5173/?emu` (`&slot=2`… for more players on one computer).
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
