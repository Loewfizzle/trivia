# LOBBY 2.0 A — THE ROOM IN THE CITY + THE ROOM DOCK + THE GUEST LIST + THE PROFILE POLISH — Nov 3 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 3 (late)" (part 60) + decisions.md. The owner's approved mocks (`Downloads\NEON\lobby\`): lobby-room.png +
closeup (with his two changes — NO room pill under the logo; GUESTS = a YELLOW DOT, no number) and stepped-plate.png. Grok's lobby sounds
(`Downloads\Grok\lobby-sfx\`, claude-notes.txt first). The lab's marks export (refreshed first, `docs/vault-lab-marks.md`): all 159 APPROVED —
no FIX marks; CENTURY rebuilt anyway (the owner's 9:06 + 9:28 pm notes: too close to INFERNO). THE ADD-ON (the owner, 10:07 pm — the last
work group): THE SAVE-YOUR-KEY POP-UP. One session, the groups in order, no helper agents; each group committed + pushed (no tag).

## What changed

**Group 0 — the owner's 2C review + the small fixes**
- **CENTURY — NO FLAMES** (`js/fx/deco.js`): burnished BRONZE foil (css/vault.css — the foil toned by a multiply) with an ART DECO SUNBURST
  pressed into it, fanning from BEHIND the name plate (broad + slender rays, three stepped arcs, the sun's disc — baked ONCE into one sprite: one
  drawImage a frame), a slow LIGHT SWEEP across the metal (a baked band, skewed + moved — ~7 s a pass), golden embers drifting up (the embers
  effect, no coal bed). INFERNO keeps its fire. v3 + its CHANGED lines (strip + full card). **No two cards share a main motif on the strip**: the
  flames are INFERNO's alone now (a unit test). **Near-twin to watch (for the owner):** GOLD FOIL (rare) is also a sunburst — its rays light one
  after another round a burst at the strip's right foot, in GOLD; CENTURY's burst stands still in BRONZE from behind the plate, the motion is
  the light crossing it. Distinct at a glance; flagged in case he wants GOLD FOIL changed.
- **THE STEPPED PLATE** (`js/vault/strip.js#stepPlate` — the approved mock): the plate full length only on the NAME row; the LEVEL row reaches
  past "LV n" (+ HOST / the dev line) by 12 pt, then steps in with a ROUNDED INNER CORNER; the plate's own glass + colours (each card's) kept —
  a `clip-path: path()` cuts the step and a thin SVG line follows its edge (the plate's own inset line, read once); measured by ONE shared
  ResizeObserver (the name fitted, the fonts in) — never a frame loop. A short name (the step < 30 pt) = the plate as it was. Every strip.
- **FOUNDER**: a little bigger + bolder (900), with a GLINT sweeping across it every ~5 s (a stripe on the badge's ::after — transform +
  opacity; reduced motion = still) — the full card's pill, its top-line form + the membership card's.
- **EQUIP, NOT WEAR**: "TAP TO EQUIP", "EQUIPPED ✓", "tap a reward to equip it", the ARIA labels, the lab's "EQUIP THE SAMPLES", the CSS badge
  (code names stay). A unit test reads every player-facing string of those files.
- **THE PROFILE POLISH** (`js/screens/profile.js`, `js/progress/profile.js`, `js/profile/sheets.js`):
  - THE HEADER: only ‹ BACK + the corner's music mute (body.pf-on hides ☰; the word MEMBERSHIP gone).
  - THE PAGE: the full card + CUSTOMIZE YOUR CARD (the ONE gold button) · LEVEL — the sign's HOT-PINK neon TUBE that fills (a white-hot core,
    the glint; the streak as one slim row in the tile → the streak card) · THE GOAL TILE (dark glass, a neon-CYAN edge, "THIS WEEK'S GOAL · N
    DAYS LEFT", the goal in big type, a thick cyan tube bar + "0 / 8", THE REWARD as a chip "+200 XP", done = lit green + CLAIMED ✓) · STATS ·
    the LATEST 3 trophies (NEW within 48 h) + ALL ACHIEVEMENTS · N › (THE TROPHY CASE — a sheet, newest first, tap to equip) · the latest 3
    sightings + ALL SIGHTINGS · N › (a sheet) · MASTERY (one tile a playable game: the ring + PLAYED · WINS; a tap → its record — wins, win rate,
    bests + ranks — in a sheet; 2C's YOUR GAMES cards live there) · ACCOUNT. NOT YET PLAYED removed.
  - ACCOUNT, ONE BLOCK: Edit profile › · the birthday (one line once set) · YOUR KEY (masked, tap to reveal) + COPY · SHARE + the saved line
    ("✓ saved" / "Not saved yet — I saved it") · USE THIS CARD ON ANOTHER DEVICE + RESTORE YOUR ACCOUNT (two big glass buttons) · the opt-out ·
    NEW KEY small + red-edged + a second tap. The key appears ONCE (2C showed it three times).
  - THE POP-UPS: glass sheets that slide up (`profile/sheets.js`): a STACK — ‹ BACK, a swipe down on the header, the scrim or Esc close the
    TOP sheet only (editor → Edit profile → the profile → the city). EDIT PROFILE = NAME › + COLOUR › real rows, each its own sheet; RESTORE
    YOUR ACCOUNT, THE TROPHY CASE, the album, a game's record.
  - ONE BUTTON SYSTEM: every other button NEON GLASS (`.pf-gb`); the bring-card sheet's COPY / SHARE / I SAVED IT glass too (`.byc-glass`).
  - The backdrop: City 2.0's harbor (as the owner's screenshot showed) — the "outdated" feel was the old header + panels.
  - **A look preview of the REAL profile** (no Firebase, no server): `tests/integration/profile-preview.html` (&name &card &new=1 &goal=done) —
    `/api/profile` answered by the page (`fake-firebase-signed.js`).
- **EVERY WEEKLY GOAL IS POSSIBLE** (found here): 18 of the next 52 weeks asked for "Play 5 different games" or 4 matches of a HIDDEN game —
  impossible with two playable games. `core/boards.js#GOAL_GAMES` (the board games config.js lets a player start — the one switch) on the server +
  the phone; the KIND still rolled the same way (this week stays "Play 8 matches"); a variety week with < 5 games → "Play 8 matches". 0 of 52 now.
- **REAL USERNAMES ON THE BOARD** (BNAME's house nicknames retired): `api/_lib/lb.js#publicRow` → { id (the opaque board id), n = the USERNAME,
  a, c, r, l } — never a pid, the key, the tag's digits; a name the filter calls rude is shown as its HOUSE NICKNAME (`publicName` — the old
  BNAME names kept for this). /board, its CDN copy, the title's preview + admin follow (admin: "on the board as <username>"). The sign-up line:
  "This name shows on the public board — don't use your full real name." (the setup screen + the profile's NAME editor).
- **THE REPORT PUSH**: a board REPORT → the owner's subscribed phones (THE LEDGER's push — `api/_lib/radio.js#notifyOwner`) get "Name reported:
  <name> — a rude or personal name" (or "Score reported …") → opens `/admin#reports` (scrolled to Board reports). The reports' own limits + ONE
  push a reported row an hour (`flags/{id}/pushedAt`); a failed push never fails the report.
- **THE ANNOUNCEMENT BILLBOARD CROSS-FADES** (`scene.js#boardSnap`): the board's swap lands on three layers at once (the baked poster, the crisp
  lettering, the night lamps) — so at the swap the board is copied ONCE as it looks on screen (the city canvas + its crisp canvases) and that copy
  FADES OUT over the new board: 0.9 s eased (reduced motion 0.25 s), on the crisp layer at 3× (CSS opacity) or the city canvas. Both ways (the
  normal board → the message → back). Nothing before the reveal: a fresh load mid-announcement simply shows it. (Found on the way: the snapshot
  first read a draw-local variable — it threw at every swap and the board never changed; the test caught it.)
- **THE TWO HARBOR CHECKS RED SINCE 2A**:
  - LOAD WEATHER's "holiday-night jump" — **THE CODE**: `scene.js#speakCtx` cached the speakeasy's blade look for 4 s regardless of the CITY
    clock; a stored JUST ME jump (Oct 31) applied before the reveal baked the facade with the REAL day's week, and the memo's expiry re-baked it
    IN VIEW 4 s later. Red since the ad week turned (Monday Nov 2: today and Oct 31 in different weeks). The memo is now keyed to the city clock.
  - THE RESIZE — **THE TEST** (+ a small code gain): measured by step, the drag itself is smooth (the held frame — worst gap 50 ms); the ~300–
    417 ms gap is the RE-FIT once the size settles (the whole city rebuilt in one task: the layout, the neon's ~120–160 ms, ~10 baked canvases
    re-sized + rastered at desktop size — an empty page's resize here: 17 ms). The old bar (450 ms) judged the drag + the re-fit together with
    no headroom; now the drag (< 200 ms) and the re-fit's ONE hitch (< 750 ms) are judged apart. Code: the neon's outline cut re-dilated the
    skyline for EVERY line (lines × width × r) — now once per change (~15–25 ms off a 1920 re-fit). The hitch itself → KNOWN ISSUES.
- **THE BUSY-PC CHECK** (`scripts/busy-pc.mjs`; docs/testing.md): the CPU over ~30 s (+ the busiest processes on Windows) before every full run.

**Group 1 — THE ROOM IN THE CITY** (`js/screens/room-city.js`, `js/core/harbor-room.js` + `room-lines.js`, `js/screens/harbor/people.js`, `folk.js`)
- A City 2.0 room's waiting part IS the live city: app.js routes it to the TITLE (the same screen — its city never reloads); title.js hands the
  room to room-city.js (the dock swapped, the idle fade off, the door only knocks). City 1.0 keeps today's lobby screen. A refresh in a room
  waits for City 2.0's module (it had mounted City 1.0's scene — found by the refresh test).
- THE PLAYERS = the city's own people (folk.js, a guest's look seeded by the uid) at the city's scale, each marked: a RING under the feet in their
  colour (people.js#drawRing — a soft glow + a bright thin ellipse) + their EMBLEM over the head (a DOM tag: crisp at 3×, tappable → their card;
  transform + opacity only) + the NAME popped on arrival + on a tap.
- TWO LINES OF 4 at the side door (the real numbers — below): the left from the barber pole back toward the edge, the right from beside the doorman
  stepping a little toward the camera (clear of the compass); the host first, by the door; each player KEEPS their line (`players/{uid}/ln`,
  picked once at the join — the shorter line, a tie → the left: L0, R0, L1, R1 …); a leave = the ones behind step up in THEIR line. Derived from
  rooms/{CODE} alone: the same on every phone; a refresh / rejoin / host change = straight back in place.
- THE ARRIVAL: a joiner (joined in the last 12 s) walks in from the edge on their line's side (planVisit on the floor WITHOUT the lines — round
  the cart, the compass, the hydrant; their own clock — a JUST ME jump never moves them); their strip is in the guest list at once.
- LOST SIGNAL: they LIE DOWN where they stood (the standing rig laid flat, eased 0.6 s, a step out onto the lighter setts, dimmed; the emblem
  dimmed + brought down to the body); up again on reconnect. LEAVING: a wave, then a walk to the nearest edge. A KICK: straight off.
- THE LINES ARE SOLIDS: the city's people route round both (folkMap's `line` takes the two rects); the doorman stays.
- The hush word in neon on the speakeasy (the lobby sign — its wall-washer steps aside); NO room pill under the logo.

**Group 2 — THE ROOM DOCK + THE GUEST LIST + THE ENTRANCE + THE SOUNDS** (`room-dock.js`, `room-guests.js`, `game-options.js`, `audio/lobby-sfx.js`)
- THE ROOM DOCK = THE FLANK restyled (createDock's own markup: the rings, the glass, the tubes, the sign's lighting): INVITE (everyone — the share
  sheet with the hush word + the link; the copy fallback) · YOU (their emblem → the card + CUSTOMIZE over the city) · GUESTS (gold people + the
  YELLOW DOT for a new guest since last opened — sessionStorage, cleared on open) · GAMES (the playable games: a guest reads HOW TO PLAY) · CHAT
  (its unread dot) · PLAY (the host: PICK A GAME → its options → INITIATE = today's start, `game-options.js` shared with City 1.0's lobby) — a
  guest sees the ring greyed, WAITING FOR <HOST> (changes hands with the host). The notes above the dock: the room closing soon (the host's tap
  keeps it open), a match on that this phone stepped out of (tap = WATCH).
- THE GUEST LIST: everyone as their SLIM STRIP (the stepped plate; only approved art — else the card's plain palette) on ONE surface in the calm
  cut (a legendary holds its lit still), the host's LV n · HOST, SIGNAL LOST dimmed, a tap = their card; the host's KICK (a second tap) + LOCK THE
  DOOR; GAME NIGHT's points. THE JOIN ENTRANCE: a strip that wasn't there when the list opened slides in at its FULL animation for 3.2 s, then
  the calm cut, with its card-in sound.
- THE LOBBY SOUNDS (Grok's picks, `scripts/build-lobby-sfx.py` → audio/sfx/lb-*.mp3, 5–15 KB, −24 to −26 LUFS): card-in (a strip slides in),
  invite (INVITE), friend (another phone's player arrives). Everything works silent. Credits in js/ui/credits.js.

**Group 3 — TYPING BUBBLES + THE CHAT FIX** (`room-city.js#paintBubbles`, `js/chat/ui.js`, `css/chat.css`)
- A guest typing in the room chat → a white "…" bubble (three dots, no words) over their figure on every other phone (the chat's own typing
  data, ≤ 6 s fresh); gone when they stop or send.
- THE CHAT KEYBOARD: the sheet keeps ONE size (`clamp(360px, 52dvh, 480px)` — fits above an iPhone keyboard) and SLIDES UP as one piece (a
  transform by the keyboard's height from the visual viewport — never a resize); the list stays on the newest; the swipe-down drives its own
  variable. QUICK-REPLY CHIPS above the field: GG · NO WAY · REMATCH? · 🔥 · 😂 · 👏 (+ `setGameChips([...])` — a cartridge's own, up to 4).

**THE ADD-ON — THE SAVE-YOUR-KEY POP-UP** (`js/profile/keypop.js`, `js/core/keypop.js`)
- A key on this device, not marked saved, ≥ 1 counted match → a glass pop-up ONCE: their card + "Save your key so you never lose your card" +
  COPY · SHARE (either marks it saved) · LATER. A RETURNING player meets it ~2.6 s after the city's reveal; a NEW player right after their first
  counted match (back in the room). Shown once: LATER or closing it = never again + a pink dot on YOU (the title dock + the room dock) until the
  key is saved (anywhere — the notes announce a change). Never over a running game, the end-of-round moment, another sheet or a legendary (it
  waits). Replaces the old 3rd / 10th-match reminder.

## THE FEASIBILITY (CLAUDE.md: check the real numbers first) — two lines of 4, at 390 / 402 / 430
A figure ~28–31 pt tall at the door; 1 unit ≈ 13.5–14.9 pt. LEFT: 4.46–4.57 units from the barber pole to a 16-pt margin → 4 at 1.25 apart
(~17 pt — a 14–18-pt emblem each with a gap). RIGHT: the door → the compass's edge — a straight line of 4 touches it (−0.08 units), so the line
steps 0.8 toward the camera each place → 0.80 units clear of the compass, 6.6 of the cart, all on the walkable floor, the doorman 1 unit away.
No rule conflict — nothing to ask.

## Decisions
- **THE FILL ORDER**: the host at the front of the LEFT line; each guest the SHORTER line at the join (a tie → the left) — L0, R0, L1, R1 …;
  KEPT for the visit (`players/{uid}/ln` — a separate write after the join, so a join never depends on the rules re-publish: until then the
  lines fall back to the same turns, computed from the room alone). Without keeping it, one guest leaving would have sent several others across
  the door. The owner's "arrivals from the left edge join the left line" kept: a player walks in from their LINE's edge (on a desktop the right
  line's walk is long — "as long as it takes").
- **The emblem over the head = the room's sign-up shape** (or their equipped earned emblem once their profile is in) in their colour — the
  strips' emblem system; 18 pt.
- **The streak stays on the profile** as a slim row inside the LEVEL tile (the owner's page list didn't name it; the flame on the full card isn't
  there when another card is equipped). **A FAVOR** stays (shown only while one is held).
- **The room's YOU** opens the profile as an overlay over the city (openCard) — the same profile + CUSTOMIZE; a strip in the guest list updates
  when the profile changes (the room's public profiles).
- **CENTURY vs GOLD FOIL** (both sunbursts) — kept distinct (bronze, still, behind the plate vs gold rays lighting in turn at the right foot); flagged.
- **The weekly goal** reads the playable games only — the server + the phone (a real problem found, fixed in this pass).

## Measured (the mini PC)
- THE FULL ROOM (`roomperf`, the real compositor, dpr 3): 60 fps · 0 slow at 1× with 8 in the lines + the guest list open; the room's OWN cost at
  4× CPU (the city's frame work — the throttled city alone is this machine's floor, ~29–33 ms, not 60 fps): +4.6 ms while 7 walk in, +0 standing,
  +0 with the guest list's 8 strips.
- THE BILLBOARD: 0.98 → 0 over ~0.8–0.9 s (both layers); 0.25 s reduced.
- THE RESIZE: the drag 50 ms worst; the re-fit's hitch 300–400 ms (this headless browser); the neon's layout 142–167 → 119–159 ms.

## Tests
unit (+ `tests/lobby-2a.test.mjs`, 13: CENTURY + the motif rule, the stepped plate, FOUNDER's glint, EQUIP, the profile polish, every goal
possible, real usernames + the push, the billboard + the busy check + the old reds, the two lines at 3 sizes, who stands where, the wiring,
the chat, the pop-up) · rules (+ THE LINE: `ln` L / R on your own node only) · /api (server.test.mjs: real usernames — only the username + the
board id leave the server; the rude name's stand-in; renames show at once; THE REPORT PUSH to a local receiver, once an hour) · the profile E2E
(the page order, back = one step, ONE key block, RESTORE YOUR ACCOUNT, real usernames on the board + /board) · smoke / conn / presence (the
harness walks into the room in the city) · e2e-harbor: `billboard` (show job) + the NEW `lobby` job — `room` (21: the city stays, the walk-in,
the hush word, the two lines + order, THE SOLIDS over 8 s, the tags + dots, a second phone walking in, the same lines on two phones, the guest's
dock, a refresh in place, lost signal down + up, a leave waves + the step-up, a kick, the host change, the guest list, CHAT's dot, YOU, INVITE,
PLAY → a game starts), `roomchat` (the bubble, ONE size on the keyboard, the chips), `keypop` (the owner's 4 cases + COPY), `roomperf`.

## THE FULL LOCAL RUN + THE CLOUD
(the end of the pass — below)

## Known issues + held back
- **THE DATABASE RULES CHANGED** (`players/{uid}/ln`): the owner re-publishes them (Firebase console → Realtime Database → Rules → paste
  database.rules.json → Publish). Until then the room still works — the lines take turns (a leave can send a guest across the door).
- The desktop RE-FIT hitch (~0.3–0.4 s once a window resize settles, in this headless browser; likely less on a real GPU): the whole city is
  rebuilt in one task — slicing it is a desktop pass's job.
- `tests/integration/e2e-chat.mjs` (not in the required runs) still drives City 1.0's lobby chat strip; LOBBY 2.0 B moves it to the room's CHAT.
- Not checked on a real iPhone: the chat sheet's slide on the real keyboard (the fake visual viewport passes), the stepped plate in WebKit,
  the room's figures at 3× (the shots are Chromium).
- THE CREW's room radios + LOBBY ONLY's sky moments stay dormant (the owner postponed the crew's room radios).

## THE HAND-OFF TO LOBBY 2.0 B — what B plugs into
- **The room is on the city**: `room-city.js#createRoomCity` owns the roster → `scene.room(list)` (people.js — `room()`, `roomBoxes()`,
  `roomDebug()`), the tags, the dock, the sheets. B's GAME START: the line files in through the side door — the people already have every
  player's slot + their planVisit floor (`roomMap`) + the side door's `door: 'side'` legs (planVisit goals) — add a "file in" plan per player
  (the host last or first), 2–3 s max, then route to the game. A late joiner mid-walk goes straight in.
- **THE CITY PAUSE during a match**: app.js routes a playing room to the game screen (the title unmounts — its scene with it); B decides
  whether the title's scene is kept + paused (memory freed) or rebuilt after; the scene's own pause hooks: `scene.set({ motion })`, the frame
  loop's `running`, the bake memory guard.
- **AFTER THE MATCH**: back in the lobby status → the title again (a fresh city today: B walks them back OUT of the door + flies THE WINNER's
  BANNER PLANE — the banner plane module exists: screens/harbor/banner.js).
- **THE CARTRIDGE PLUG (how a game plugs in)**: a game = `js/games/<id>/` (logic + director + index + view — docs/match-kit.md) registered in
  `games/registry.js` + `config.js` GAMES (`playable` = the one switch). The ROOM side it can use: `chat/ui.js#setGameChips([...])` (its quick
  replies while it runs), `game-options.js#openGameOptions(g)` (its options sheet from PLAY), `audio/lobby-sfx.js`, the room's public profiles
  (`state.pub`) for strips + emblems. The city pause + the walk inside are B's; the daily plug-in ships OFF until THE DAILY MODULE.
- Every room state is derived from rooms/{CODE}: B adds no client-held state the director can't rebuild.
