# JAYWALK CARDS + THE TRI-VISION + THE CITY's LONG NIGHT + THE ERRORS GROUP + THE LOBBY GETS IT LIVE (Nov 12–13 2026)

A city pass on the beelink, six groups + the close (the owner's notes: plan.md "OWNER'S NOTES — NOV 12 (night, after THE CDN HOTFIX)"; the CURRENT
decisions in decisions.md). Each group its own commit; ONE deployment (the harbor tag on the final push's top commit). The pass screenshots stay
on the PC (docs/harbor/passes/jaywalk-cards/ — out of git since FR7 FIXES B).

## Step 0
plan.md — the owner's notes appended unchanged + the build table line; decisions.md — the order, the table row, four CURRENT bullets (VERCEL PRO +
WEB ANALYTICS · THE TRI-VISION · THE LOBBY GETS IT LIVE — supersedes the 50-s EVERYONE lead · JAYWALK's CARDS). 10ed7cfe.

## Group 1 — THE JAYWALK CARDS (8444d8d7)
Built step for step like REDLINE + PHOTO FINISH (passes/overclock-cards.md Group 1) — the art + the layers + the item rows; **the unlocks DORMANT**.
- **The files**: copies only (never the originals, never the `-b` backups, never the preview sheets) in `art/jaywalk-cards/src/` — the three masters
  (1280 × 720) + the five USE FX plates + both notes. `scripts/build-jaywalk-cards.mjs` → `assets/vault/jw/` (8 WebPs, ~265 KB): the masters converted;
  the plates as LIGHT WITH ALPHA (alpha = the brightest channel, the colour divided out — drawn `'lighter'`), cropped to their light (`jw-specs.js#PLATES`)
  + halved. **Measured, not assumed**: every plate's 16-px border = 0 (Grok's feather), no light outside its crop box.
- **The owner's marks, baked**: RIGHT OF WAY's cap-strap lettering ("WIKI & WE" in a tight zoom — x 929–967, y 191–200) → each strap row its own plain
  pink (197 px repainted; before / after `jaywalk-cards/strap-ba.png` in the scratch); CLOSE ENCOUNTER's trails faded where they enter the left third's
  lower corner (x 300 → 520 ramps back to full, from y 520 down — the left third's lower light 1,171 → 515 k); fx-hop's first third cleared
  (it started at 11.6 % — under the plate).
- **Measured on the real pixels**: SONIC BOOM's vapor cone (700, 360 — 54.7 %), its nozzles white-hot at x 1041 / 914 (the plumes ~9° / 7.6° down);
  CLOSE ENCOUNTER's belly glow (895, 318) → the beam's pool on the road (875, 568 — the plate leans 4.6°), the far car (790, 528) the trails' vanishing
  point; RIGHT OF WAY's trailing hip (850, 398 — 66 %), the runway lights' two rows (found as blobs: 728,354 · 699,368 · 663,385 · 614,408 … and
  1054,350 · 1084,365 · 1123,385 · 1171,408 · 1245,447). The plates: the afterburner's nozzle (255, 358.5), the ring's centre (638, 344) r 217, the beam's
  tip (639, 42) + pool (639, 655), the trails' convergence (1170, 392), the hop's puff (750, 310).
- **THE MOTION** (`js/fx/jw-cards.js`, the numbers + the timing PURE in `js/fx/jw-specs.js`, ONE shared renderer): SONIC BOOM — one afterburner plate
  fitted to each plume (a 26 Hz stepped flicker + the diamonds breathing along the axis), every 4 s THE RING bursts out of the cone (0.6 → 1.15, bright →
  gone over 0.9 s, `ringAt`) with a short white flash, the city's lights dipping for a beat (a thin dark wash); CLOSE ENCOUNTER — the beam's slow pulse
  (2.6 s) + its ±2° sway, the pool + the belly brightening with it; the SHEEN along the trails = the trails plate in 30 slices, each lit by a moving band
  toward the vanishing point, faded in across art x 380 → 540 (never over the plate's corner; 16 slices first — the steps showed: refine 2);
  RIGHT OF WAY (legendary — he leads) — the arc DRAWS ON toward him (0.8 s, `hopAt`) with a bright head on the quadratic through Grok's three points, the
  puff blooms at his hip, everything fades before the next hop (5 s); the runway lights CHASE toward the camera (two blue dots a row, growing as they
  near); THE BORDER LASER in hot pink. Reduced motion = a still frame (the ring mid-burst · the beam at rest · the arc full + the puff).
- **The gem**: SONIC BOOM's lower plume runs under the strip's gem → a dark backing (as REDLINE's); CLOSE ENCOUNTER + RIGHT OF WAY read as they are.
- **Wired like every card**: `api/_lib/catalog.js` C rows (server-only names + lines; colours from the art), `js/vault/catalog.js` n **217 → 222**
  (strips then full cards — v1, NEW in THE LAB; **no LAB_V bump + no LAB_CHANGES line**: a bump would show them CHANGED instead of NEW — PD-5B's
  precedent, pinned by `tests/jaywalk-cards.test.mjs`), `strip.js#LOOKS`, `fx/index.js`, `css/vault.css` (`vl-s-jw-*` / `vl-fcm-jw-*` — the strip zoomed
  out + set right, the hero ≈ 0.78 across; the full card's art at 80 % by its width, edges faded), `vault/hero.js` + `vault/layout.js`, `lab-text.js`, the
  credit (ONE row: "JAYWALK — card art + billboard art"). **No stills** (`stills.js` is for cards DRAWN IN CODE — these have their picture as the material;
  `card-stills.test.mjs` covers them by that rule). **The pass-6 marker**: `api/_lib/catalog.js`, beside the OVERCLOCK achievements, the comment
  "JAYWALK pass 6 — the three feat flags from the server's replay → these cards". `vault-2b.test.mjs`'s "earned somewhere" keeps a DORMANT list (the
  three) that pass 6 empties.
- **The look review**: 390 (+ 12 W's, one line) · 402 / 430 (MAXIMILIANOS on the full cards, one line) · the lab's lobby test (8 of one: RIGHT OF WAY 60 fps
  · 1.2 ms js; SONIC BOOM 0.2 ms; CLOSE ENCOUNTER STILL) · 1440 × 900 · WebKit 402 × 874 @3 · bursts: the ring burst, the hop drawing on, the sheen.
- **Tests**: `tests/jaywalk-cards.test.mjs` (6) + the harbor `vault` group's counts +3 (61 strips, 60 full cards) — `vault` 58 / 58.

## Group 2 — THE TRI-VISION (HOLD'EM NOW OPEN ↔ JAYWALK COMING SOON)
- **THE CLOCK** (`core/harbor-trivision.js`, PURE): turns come in CHAPTERS of every[0] + every[1] = 105 s — two turns a chapter, at 0 and at
  45 + 15 × h(chapter) (an integer hash — `Math.imul`, never `Math.sin`, whose last bits differ by engine), so EVERY gap is 45–60 s (two days: 4,938
  turns, gaps 45.00–60.00) and a phone finds the face at any moment without walking from the epoch. The faces alternate turn by turn. `&force=trivision`
  = a turn every 8 s. THE GOLDEN TABLE: a NEW system `billboard.trivision` (the first two hours of each day) — the compare before `--write` showed
  ONLY that system differing (48 months), the fixture +50 lines, nothing else moved.
- **THE TIMETABLE**: `billboard.jaywalk` { on, since 2026-11-12, open null } + `billboard.trivision` { every [45, 60], turn 1.2, slats 12, force 8 }
  (both `kind: 'base'` — not the hint queue). THE DAY CHART: one row a day ("… — 1646 turns (every 45–60 s; no billposter)").
- **THE JAYWALK POSTER** (`screens/harbor/jaywalk-art.js`): Grok's billboard.png (copy in `art/jaywalk-billboard/src/`) → `assets/city/jaywalk/billboard.webp`
  (640 × 320, 24 KB — `scripts/build-jaywalk-billboard.mjs`, the cap's dark patch painted out: 897 px, each column between the cap's pink + the strap);
  COVER into the board (never stretched — the 2 : 1 art set 92 % right so the kid stays whole + the words get the room); the words = GENERATED path data
  (`jaywalk-glyphs.js` — JAYWALK in Bungee, the bar in Poppins Bold, OFL): JAYWALK hot pink with a white-hot core band + a dark edge + a pink glow,
  COMING SOON white with a dark edge at 60 % of JAYWALK's height, both on the art's black left up to the kid's body (measured at 57.9 % across at the
  words' height — the zone ends at 56.5 %). On a 160-pt board: JAYWALK 10.7 pt, COMING SOON 6.4 pt — read unzoomed. **Bug found in the review**: a
  comment dropped mid-line had commented out the glow's `restore()` (the save stack unbalanced → COMING SOON + the next paint vanished) — fixed.
- **LAZY**: the poster's module + its art load only AFTER the reveal (`lazyImport` from the scene when the tri-vision is wanted; signs.js gets the
  painter by `setJaywalkPainter`) — never the boot graph. THE BOOT PRELOAD 304 → 305 modules (the small PURE clock — the billposter's rule needs it in
  the workers' planner), under the budget's 310: **no budget raise**.
- **THE TURN** (scene.js): every frame `triFrame` reads the clock; at a turn the board's content swaps AT ONCE (its re-bake hidden under the slats — no
  cross-fade: `tri.swap`) and the slats ripple left → right over 1.2 s on THE CRISP LAYER (`roofboard-tri`, z 4 — over every poster copy; the city's
  canvas when there is no crisp layer): each slat a three-faced prism turning 120° (`slatU` + `slatLook` — the old face going round to the left, the new
  from the right, each shaded by its angle, a lit edge, a dark seam only while they turn); the faces = the billposter's own pre-render
  (`neon.boardArt` → `workers.js#sheetArt`), made ONCE per look at a turn's start; the overlay holds the last face until the new bake has landed. A quiet
  click (the radio desk's `radio-tick` on the city's SFX bus, gain 0.18 + 0.12 at 62 %). Reduced motion = a cut. A message (the owner's, LOOK UP,
  FIREWORKS, PARTY, the postcard) holds the whole board as before — the faces move on under it, the clock's face is back after it.
- **THE WINDOW RULE**: until JAYWALK's art has decoded the board stays on HOLD'EM; the first frame the tri-vision is up starts no turn — a turn starts
  only at the clock's own turn moment, from the face on show (a return from the background mid-cycle waits for the next turn). THE BILLPOSTER stays home
  while it turns (`triKeeps` beside `holdemKeeps` in `harbor-workers.js`).
- **THE OWNER's SWITCH**: `/admin → THE BILLBOARD` gets a JAYWALK row — ON / OFF · SHOW NOW OPEN / COMING SOON · an OPEN DAY (from that day NOW OPEN, the
  days before stay COMING SOON) → `api/admin.js` `billboardJaywalk` → `city2/billboard.jaywalk` (an UPDATE — HOLD'EM's switch beside it kept; HOLD'EM's
  own `billboardSet` now updates too) → `radio.js#radioPublic.base.jaywalk` → the cached feed → `setJaywalk`. JAYWALK off = HOLD'EM alone, no turning.
  No database-rule change (`city2/` is server-written).
- **Force flags** (each a panel row — `harbor-remote.test.mjs` green): `&force=billboard-jaywalk` (+ `&jaywalk=open`), `&force=trivision`.
- **The look review**: the board at 390 · 402 · 430 by day + night, a burst through the turn (402, every 100 ms), mid-turn frames close up, 1440 × 900.
- **Tests**: `tests/trivision.test.mjs` (9) · `server.test.mjs` "THE TRI-VISION: JAYWALK's switch" · the harbor group **`trivision`** (the `show` job): at the
  reveal HOLD'EM; the first JAYWALK face arrives BY A TURN (holdem-open → jaywalk); the slats on the crisp layer at 3×; the board holds the new face
  after; TWO PAGES, ONE FACE at the same server moment; reduced motion = a cut — 6 / 6 · `billboard` + `load` green (45 / 45 with trivision).

## Group 3 — THE LOBBY GETS IT LIVE (the intercom + the sky moments, 10 s)
- **The leads** (THE CITY TIMETABLE): `radio.lead.city` 45 → **10 s**, `radio.intercom.lead.everyone` 50 → **10 s** (the knob comments say the new rule:
  a room = live + 10 s, the city = the 5-min check-in). The desk's countdown is the moment's own `at` — it reads ON AIR IN 10 with no code change.
- **The server** (`api/_lib/radio.js#fire`): an EVERYONE / city moment is ALSO written into every OPEN room's `rooms/{CODE}/radio/{id}` (the LOBBY ONLY
  moments' public shape — `publicMoment`; the open rooms = `openRooms` — the live rooms' index, idle > 1 h left out), the codes kept on the queue's
  record (`m.rooms`) → STOP + CLEAR ALL + the planner's moves update the copies — only rooms still open (`liveCopies`: a write to a closed room's path
  would make a stray node there — unsend's rule). EVERYONE's intercom was already copied into every open lobby (CC-B) — now 10 s ahead.
- **The phone**: no new socket, no new poll — the room's socket (`want('room')`) already mirrors `rooms/{CODE}/radio` → `state.roomRadio` → the
  remote's feed, merged by id with the poll's copy → ONE moment, played ONCE (`scene-radio.js`). THE CLIP AHEAD (`audio/intercom.js#clipOf`): a room phone
  fetches the clip the moment the row lands (the log's first line "clip fetched ahead"); the player decodes those bytes (a slice — `decodeAudioData`
  detaches). A phone only on the city: its 5-min check-in (mid-way, or missed).
- **No database-rule change** (`rooms/{CODE}/radio` is server-written).
- **A NOTE ON THE LOCAL SERVER**: `scripts/serve.mjs` caches the `/api` modules from its start — the first harbor run still showed the 45 / 50 s
  leads; restarting serve.mjs (mine) fixed it (as OVERCLOCK CARDS' log warned).
- **Tests**: `server.test.mjs` (the city's 10 s; a banner to EVERYONE → copies in a lobby, a room mid-match + RDIO, none in a room idle 2 h, STOP →
  every copy stopped, a room closed since never gets a stray node; EVERYONE's intercom at T + 10 s) · `radio-intercom.test.mjs` (lead 10) · harbor
  `crew` + `radio`: **THE LOBBY GETS IT LIVE** — both lobby phones have EVERYONE's moment 141 / 149 ms after FIRE (its start 10.1 s ahead), the poll's
  copy + the room's = 1 moment, STOP reached the room; **the intercom in a lobby** — two room phones 0 ms apart, 0 ms from its time, the clip fetched
  ahead; FRIENDS C's own sync check (EVERYONE stamped 10 s) — `radio, crew, radiorest, panel` **117 / 117**.

## Group 4 — THE CITY's LONG NIGHT (memory — Grok's review, every item checked in the code)
- **The misses** (each verified): `scene.js#destroy()` never called the GPU fireworks' destroy (`fireworks.js#free` — the context lost) nor the
  2D fallback's, nor `people` / `galeSea` / `raidFx`'s (each had one). **The sweep** of every `create…()` in scene.js + its cuts found more modules
  holding canvases with NO destroy at all: the 2D fireworks' sprites, the chimneys' puffs, the lit windows' sprites (the spell + the dark faces +
  the sets), the tower's sprites + bulb strings + ghost, the crossing's light — each got one; and modules whose destroy left canvases: the people's
  cars (`kit.destroy()`), the stars' glows, the speakeasy's door-light + awning masks, the holiday fireworks' GPU context (fx.js), the balloons'
  flame dot, the crisp layer's dropped items (zeroed as they go). The scene's own: THE TRI-VISION's faces, the board's cross-fade copy, the
  billposter's sheets + the blade's repaint. **ONE rule now**: every module the scene creates is destroyed in `scene.js#destroy()`, and a module's
  teardown frees its canvases AT ONCE (`ui/canvas-safe.js#freeCanvases` — WebKit keeps a dropped canvas's pixels until its next GC).
- **The backdrop**: ONE still canvas reused on every title exit (it was a fresh one each time, the old never zeroed), through `ctx2d` (counted).
- **The title's teardown**: the city STOPS at once (`scene.halt()` — the frame loop + every timer; the last frame stays under the 420-ms fade),
  `destroy()` after the fade — not one city frame after the unmount (the harbor `longnight` group counts the scene's own rAF callbacks: 0 0 0 0 0 0 0 0).
- **How it was found**: a canvas-maker census (each canvas tagged with the file:line that made it; the live ones — pixels, not in the page — grouped
  after N trips): in WebKit after 5 menu trips the crisp layer (+31), the people's cars (+20), the speakeasy (+15), the stars (+10)… piled up until a
  GC; after the fixes 237 → 223 with nothing left growing but the title's own two.
- **Before → after** — `node tests/integration/wk-longnight.mjs --trips 30 --menus 10` (WebKit, 402 × 874 @3, the emulators):

  | | before | after |
  | --- | --- | --- |
  | 30 trips city → game → room — the night's PEAK of live canvases | 457 (trip 15) | 266 |
  | — the MB at the peak / the median, trips 2–6 → the last five | 79.4 / 66.6 → 63.6 (a GC sawtooth) | 62.2 / 61.7 → 61.9 |
  | 10 trips title → YOUR CARD → title — the peak / the median first → last | 382 / 287 → 338 | 268 / 237 → 247 |
  | the live GPU contexts | 0 → 0 | 0 → 0 |

  (The GPU fireworks only exist during a show, so a plain night's GPU count is 0 either way — their context is now lost at the teardown.)
- **Tests**: `tests/longnight.test.mjs` (freeCanvases; every module destroyed; halt before the delayed destroy; ONE backdrop still) · the harbor group
  **`longnight`** (the `perf` job, before the serial `perf`): 8 city-pause trips + 6 menu trips — the peak ≤ 1.25 × the first trips', the MB flat,
  the GPU flat, 0 city frames after the unmount — 3 / 3 · `citypause, cameras, tower, perf` 38 / 38 (THE BASELINE GUARD 0.79–1.23×).

## Group 5 — THE ERRORS GROUP (from the owner's /admin, Nov 12)
1. **THE BLACK HELICOPTER** (`ReferenceError: Can't find variable: black` ×6): FRIENDS C had written the black helicopter's own lights (the port /
   starboard nav lights, the double strobe, the beacon) + their reflections on the harbor into `air.js#drawHeli`'s DRAWN-chopper path — where
   `black`, `th`, `lerpP`, `lamp` are drawModel's. The black one always flies as its model (it returns before that path), so its lights never showed,
   and the PLAIN patrol threw every frame it flew without its model (the model's files not yet in / failed). Moved into `drawModel` (its variables,
   `black = !!heli.black`); drawHeli keeps the drawn chopper's plain lights. Proof: the harbor `heli` group — the plain patrol forced with its
   model's files BLOCKED flies with no error; `&force=blackhelo` flown through its pass with no error — 29 / 29; `tests/errors-group.test.mjs`
   checks drawHeli names none of drawModel's variables.
2. **STALE-HOST WRITES** (RULES REFUSED on `meta/hostBeat`, `meta/lm`, a chat system line — a false re-publish alarm): a phone that LOST the host
   keeps writing for a beat (sent before the new hostId reached it). Both ends: `firebase.js` — a refused room / chat write waits `HOST_SETTLE_MS`
   (2.5 s — the new hostId lands a beat after the refusal) and, if this phone has just lost the host (`host.js#lostHostRecently` — host within the
   last 15 s, not now; wired by `setHostGone`), is a quiet console line "no longer the host" (`hostRefusals()`), never the alarm; the host's writes
   check again right before writing (the beat, the director's patch, the lobby song from the LIVE store). Proof: the harbor `makehost` group — the
   old host's writes RACING the hand-off are refused + put down as "no longer the host", no RULES REFUSED report; `oldrules` (a real rules-lag on a
   host that IS the host) still reports — it now waits for the settle.
3. **BOTS OUT OF /admin** (HeadlessChrome, Vercel's screenshot robot, Lighthouse — the "Linux" stalls + BOOT HANGs): ONE PURE check
   (`js/core/bot-ua.js`): the phone (`errlog.js`) sends nothing from a robot browser (`navigator.webdriver` or a bot UA) unless it's a local /
   emulator page; the server (`api/log.js`) drops a bot's error or report when DEPLOYED (`VERCEL_ENV` — an old cached page can't send one; a local
   server keeps the test browsers' reports). Real UA strings in the unit test: Safari iOS, Chrome iOS + Android, Samsung, a CUBOT model, Facebook's
   in-app browser, Edge, Firefox, desktop Safari — never dropped.
4. **THE LOST TAPs** (rescued by THE TAP WATCH): **`dy-scope-b`** (TODAY'S SCORES' tab) — 34 pt tall → a 44-pt tap area (an invisible `::after`, the
   corner buttons' way) + the cause: an ANSWER landing (today, the friends, a board's rows) repainted the whole body, rebuilding the tab under the
   finger → every answer's repaint now waits for the tap (`afterTap`); a tap's own repaint stays at once. **`vl-full-x`** (a full card's CLOSE) — the
   card's opening work (the fx surface's first frames, the art's decode, the fit) keeps the main thread busy a moment: the click came late / was
   counted lost → CLOSE acts on its OWN pointer-up (a primary press lifting on it — `tapHandled()`, the CUSTOMIZE tiles' way), the click stays for the
   keyboard, `close()` runs once. Proof: `ENGINE=webkit e2e-taps.mjs` (`DAILY_TEST=1` server) — a full card's CLOSE tapped as it opens 6 / 6, the SCORES
   tab 6 / 6 (its tap area 44 pt), the watch counted 0 LOST TAP — 24 / 24.

## Group 6 — VERCEL WEB ANALYTICS (the script tag — no build step)
- **The loader** (`js/ui/analytics.js`): Vercel's PLAIN script (`window.va` queue + `<script defer src="/_vercel/insights/script.js">`, never the npm
  package), injected AFTER the page is up — the title after THE CITY's reveal (`title.js#reveal`, 2 s later, once a page), THE BOARD after its first
  paint (`board/public.js`), the 404 on load (a plain-script copy of the gate — THE WRONG DOOR has no modules). Only those three pages (never admin /
  lab / daychart / a preview). The gate (PURE `analyticsAllowed`): skipped on localhost (+ `*.localhost`, `*.test`), the emulators (`?emu`), `&test=1`,
  every `tests/` page and robots (`navigator.webdriver`, a bot UA — `core/bot-ua.js`). One page view a load (a single-page app; no custom events).
- **Never the boot**: the module is a dynamic import (`lazyImport`) — not in THE BOOT PRELOAD (`index.html` unchanged by it), `boot-budget.json`
  unchanged. **The service worker** passes `/_vercel/*` straight through like `/api` (never kept).
- **The CDN budget**: ~2 requests a visit (the script + its beacon) — noted beside THE CDN HOTFIX's numbers in docs/harbor.md.
- **Proof**: `tests/analytics.test.mjs` (the gate; the three pages; nothing in a page's head; not in the boot preload; the worker); a real check on this
  machine with a non-local host name mapped to 127.0.0.1 (robots' flags masked): THE BOARD + the 404 each request `/_vercel/insights/script.js` once
  (`window.va` set); `&test=1` + localhost request nothing. The title's loader is the same call, after the reveal (its page talks to Firebase — not
  driven on a non-local host).
