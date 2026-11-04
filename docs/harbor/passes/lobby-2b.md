# LOBBY 2.0 B — THE GAME START + THE CITY PAUSE + AFTER THE MATCH + THE CARTRIDGE PLUG — Nov 4 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 4 (morning)" (part 61) + decisions.md. The owner's approved mocks (`Downloads\NEON\lobby\`):
rematch-vote.png + closeup (THE REMATCH VOTE), lobby-room.png (the room as built). The lab's marks export (refreshed first,
`docs/vault-lab-marks.md`): all 159 APPROVED — no FIX, no CUT. THE ADD-ON (the owner, Nov 4 8:14–8:18 am — the last work group): LEAVE ROOM
up front, THE CREW's Blackbird that didn't fly, ONE SHEET STACK. One session, the groups in order, no helper agents; each group committed +
pushed (no tag).

## What changed

**Group 0 — the owner's room test + his 2A review**
- **THE TAP AREA** (`room-city.js` — "you almost have to hit the emblem"): the WHOLE PERSON opens their card — an invisible hit box over the
  figure + its ring + the emblem over the head, padded to at least 44 × 44 pt (measured: 44 × 70–74 at 402), placed with the tag (its size
  written only when it changes; never a layout read). Overlapping neighbours: the tap is resolved over every box — the figure whose centre
  is NEAREST the finger wins (`nearestAt`), not whichever box is on top. A hidden tag (no figure drawn) takes no taps.
- **THE LAYER STACK** (`js/ui/layers.js` — the brother's bug: on an existing account in the room, YOU → CUSTOMIZE YOUR CARD "did nothing";
  ‹ BACK then revealed it): CUSTOMIZE (z 70) had opened BEHIND the room's profile overlay (z 85) — on the title the profile is a screen, so
  it worked there. Now every pop-up that opens over another — the profile's glass sheets, CUSTOMIZE, the full card — takes the NEXT layer
  from one counter (from 400 up): the newest is always on top, from any screen; Esc closes the TOP one only (each pop-up's own Esc handler
  asks `isTopLayer`); the toasts + the SIGNAL LOST banner sit above every layer (8500 / 8510 — under the end-of-round moment's 9000).
- **RESTORE YOUR ACCOUNT stands out**: a bright neon-CYAN edge + glow, the title in cyan (#6ff6ff — 4.5:1+ on its glass), a small key icon;
  not gold (CUSTOMIZE stays the screen's one gold primary); USE THIS CARD ON ANOTHER DEVICE stays glass.
- **"1 OF 1"** (`core/dev-cards.js#ONE_OF_ONE`): the dev pill reads just 1 OF 1 (full card + CUSTOMIZE). **THE TOP LINE NEVER CLIPS**
  (`vault/full.js#fitTop`): NEON SPEAKEASY · FOUNDER (or · № n) + the pill side by side, whole — the letter-spacing tightens FIRST
  (0.34 → 0.08em), only then the size (never under 8 px); measured on the words' REAL extent (a Range — the span's own box is narrower than
  its bold FOUNDER), by a ResizeObserver. Checked on all 50 full cards at 390 / 402 / 430 + a 72 % viewer (all 50 tighten there, none
  clip). LAB_V: both dev full cards v3 + their CHANGED lines.
- **THE SAVE-YOUR-KEY POP-UP**: already built at the end of LOBBY 2.0 A (`js/profile/keypop.js` — the owner's note said the add-on wasn't
  sent; the prompt was sent and built as 2A's last group): checked again here — the reveal trigger, the after-match trigger, the YOU dot on
  both docks; its harbor group `keypop` (the owner's 4 cases + COPY) stays green.

**Group 1 — THE GAME START + THE CITY PAUSE** (`core/room-show.js` PURE · `room-city.js#startFx` · `people.js#planIn` · `host.js` · `app.js`)
- **THE STAMP FIRST**: the host's INITIATE / REMATCH writes `meta/go = { at: the server's now, m, g }` BEFORE it prepares the match (a
  question bank, a song) — the walk inside starts on every phone at the tap; the game's own clock is set to the stamp + START_MS (a
  cartridge's `start({ now })` = the moment its match begins); the match lands with `status: 'playing'`; a failed start takes the stamp down.
- **THE SHOW (2.6 s, every phone at once)**: the speakeasy's NEON sign POWERS DOWN (a flicker out — the DOM tubes by CSS, the city's own
  parts of the sign by THE SIGN-DIM HOOK the TR-3B uses: `scene.dimSign('room-start')`) with the sign's recorded dropout → the GAME's tube
  logo (`ui/tube-logo.js#gameLogoSvg`) POWERS UP on it under TONIGHT with its catch → the TWO LINES file in through the side door (the host
  first, the lines alternating, 0.16 s apart, a hurried walk; the doorman HOLDS the door — `doorLeg({ held })`: no wait for its swing) → at
  1.95 s the view PUSHES THROUGH THE DOOR (the screen + the city's own layer scale ×2.6 about the door's point + a dark veil) → app.js routes
  to the game; the veil fades off over it. Whoever is still walking up "goes straight in" with the cut. Every part is an animation at a
  NEGATIVE delay = the show's age, the walks are planned from the same age: a refresh, a late joiner or a NEW HOST mid-start lands on the
  same frame; past the 2.6 s → straight into the game. The dock + the tags step aside at once; any sheet open closes. Reduced motion: the
  sign swaps by a plain fade, nobody walks, the city cross-fades to the game. No glitch flash between the room and a game (City 2.0).
- **THE CITY PAUSE**: a match on screen = the title unmounted → the scene DESTROYED: it draws nothing, its sounds stop with it (the scene's
  `snd`, the rain, the hum), its canvases + caches are freed (the memory guard's count); after the match it is rebuilt from the server clock
  + THE CITY TIMETABLE — caught up (what happened during the match was simply missed, as with a locked phone). MEASURED (an iPhone's 3×,
  402 × 874, the room with 2 players → an OVERCLOCK match): the city's canvases **66.4 MB (191) → 0.3 MB (13)**; the JS heap 37.3 → 38.4 MB
  (the game's own code + bank in, the city's small JS out); back in the room 66.6 MB (192) — the same city again.
- **THE OLD LOBBY SCREEN** — City 2.0 never shows it (from the join to the podium and back the room lives in the city; City 1.0's
  `?city=1` keeps it until THE SWITCH-OVER deletes City 1.0). Every control it had has a home: the hush word + SHARE / COPY LINK → INVITE;
  the player list + KICK + LOCK THE DOOR + GAME NIGHT's points → GUESTS; the game picker + its settings + HOW TO PLAY → GAMES / PLAY
  (`game-options.js`); KEEP OPEN + the idle warning + WATCH (a match this phone stepped out of) → the notes over the dock; THE CREW switch → the
  owner's tap on a player; chat → CHAT; LEAVE ROOM → the ☰ menu (the add-on brings it to the top + GUESTS).

**Group 2 — AFTER THE MATCH: WALKING BACK OUT + THE WINNER's BANNER PLANE + THE REMATCH VOTE** (`room-banner.js` · `room-dock.js` ·
`room-city.js` · `people.js#planOut` · `core/room-show.js`)
- **THE STAMP**: the host's BACK TO THE ROOM (the podium's button — it read BACK TO LOBBY; City 1.0 keeps the old word) writes
  `meta/back = { at, m, g, rm }` FIRST (the room still 'playing' — nothing shows yet, so every phone has it when the room comes back), then the
  room goes to the lobby. Its own write: on rules not yet re-published the room still comes back — it only misses the show.
- **WALKING BACK OUT**: the city rebuilds (THE CITY PAUSE) and its FIRST sight of the roster carries each player's turn: out through the side
  door (it swings open on them inside, as for anyone), then to THEIR OWN PLACE in their line (the same places they left — the lines are derived
  from the room); the host first, one every 0.6 s; before their turn they are still inside. From the stamp's age — a slow phone or a refresh
  lands on the same step; past it, everyone standing.
- **THE WINNER's BANNER PLANE**: the city's own Stearman tows the room's line ~2 s after everyone is back (`bannerAt` = the stamp + the
  walk-out's length for the room's size + 2 s — the same moment on every phone; measured 7 ms apart on two phones), one pass under
  SPEAKEASY (the banner's own lane — never over the NEON letters). THE WORDS (`bannerLines`): short, each panel ≤ 24 letters and never a cut
  name (a form that would cut one falls back to the name on its own panel); TEN forms taken IN TURN by the night's game count — "BEN TAKES
  OVERCLOCK!", "CHEERS TO BEN | OVERCLOCK CHAMPION", "BEN WINS OVERCLOCK!", "OVERCLOCK GOES TO | BEN!", "ALL HAIL BEN | OVERCLOCK ROYALTY",
  "DRINKS ON BEN! | OVERCLOCK WINNER", "BEN OWNS OVERCLOCK", "OVERCLOCK CHAMP: | BEN!", "HATS OFF TO BEN | OVERCLOCK WINNER", "BEN RUNS
  OVERCLOCK" — ten games a night never repeat; TIES: "BEN + SAM | SPLIT THE POT!", "TIE GAME — | BEN + SAM!", "DEAD HEAT AT PRISM DROP |
  BEN + SAM", "BEN + SAM | SHARE PRISM DROP!" (3+: "BEN + 2 MORE"). The winners from night/{matchId} (3 points = first; the room's names —
  they passed the name filter at the join). A refresh mid-flight = the plane where it is now; a phone back after it passed = nothing.
  **THE SKY RULES**: `scene.roomBanner` refuses while a LEGENDARY is up or its TRAFFIC HOLD is on (core/harbor-legend.js#trafficHold) or
  another banner is in the sky — the room's plane WAITS (every 2 s, up to a minute), then flies from then, or skips. Reduced motion: the words
  as a STILL CARD in the sky (~6 s).
- **THE NIGHT's CHAMPION** (decided Oct 28 — the night scoreboard supports it, so BUILT): this device keeps the room's standing while in it
  (`nd:night`: the room, its games, its leaders); a player LEAVING after 2+ games (QUIT / LEAVE, a kick, the room closing) → their own city
  flies "LAST CALL — | BEN WINS THE NIGHT" (two: "BEN + SAM WIN THE NIGHT"); a player who just closed the app → the next open within ~12 h
  flies "LAST NIGHT'S CHAMPION: | BEN"; once a night a device. The "short trail of fireworks or skywriting" was NOT added: the city has no
  small salvo (its shows are minutes long) and a skywrite through the same sky crowds the banner's lane — the banner alone (a decision below).
- **THE REMATCH VOTE** (the approved mock): once the banner flies (everyone back), the host's pink ring reads **REMATCH** (one tap =
  `host.js#rematch` — the same game, the same settings, everyone in the room incl. late joiners; everyone files in like the first start); a
  GUEST's ring in that slot reads **REMATCH · VOTE** → **REMATCH ✓ VOTED** (their own pink ring, never greyed; tap again = taken back); each
  vote lights a BOLD DOT in the guest's colour on the ring's left / top arc (165° → 285°; a faint empty ring for a guest who hasn't) + a
  "**2 of 5** want a rematch" pill above the ring — the same dots + pill on every phone. (TIDIED — the owner, Nov 4 9:25 am, below: the dots in ONE row right above the ring, the pill above them, no 👍 over the people.) The host
  picking ANOTHER game (GAMES → a game) puts the ring back to PLAY + clears every vote; a start clears them too. NOTHING auto-starts. The word
  REMATCH fits the ring in the real font (55 of 76 pt at 402). A vote = `rooms/{CODE}/rv/{uid}` = the match just played — each player's
  OWN node, only while that match's ring is up (the rules); the host clears them all.

**Group 3 — THE CARTRIDGE PLUG** (`js/games/cartridge.js` · `docs/cartridge.md` — linked from CLAUDE.md's table)
- THE CONTRACT as data + a checker: REQUIRED (start · prepare · step · livePaths · createView · DEFAULT_SETTINGS · OPTIONS · estimateMinutes ·
  finalRanks + MUSIC or musicFor), OPTIONAL (FINAL_MUSIC · MIN_PLAYERS · **SOLO** · nightBonus · sealed · **chatLocked** · **CHAT_CHIPS** ·
  **BANNER_NAME** · **rematchSettings** · **preload** · **daily**), the DAILY plug-in's shape (`{ on: false, create({ date, uid, now }),
  resumeKey(date, uid) }` — today's date in → today's puzzle, one try, resume; `checkCartridge` fails one that switches itself on).
- THE CONSOLE READS A GAME ONLY THROUGH IT (no hard-wiring): `start({ now })` = the moment the match begins (after the walk inside); the
  chat ASKS THE GAME for its lock (`chatLocked` — OVERCLOCK + PRISM DROP carry theirs now; `chat/logic.js`'s switch keeps only the ten hidden
  games, each moving into its cartridge when it returns); the banner's name; the chips while it's on screen (app.js); a rematch's settings;
  the minimum (MIN_PLAYERS above the app's, `SOLO` = 1 — OVERCLOCK's solo plugs in here); ITS LOADING — on every phone during the 2.6 s walk
  inside the console WARMS its view (`lazyView(…).warm()`) + its sheets and calls its `preload()` (pools, sounds): fetched, never built,
  while the city still draws. For OVERCLOCK (`Downloads\NEON\overclock\` read first): the city pause is automatic; its per-challenge pools +
  sounds go in `preload`; SOLO; its daily plug-in ships OFF; DUMB LUCK never in a daily (the doc says so).
- THE CHECKS: `tests/cartridge.test.mjs` — every registered game PLAYABLE (checked) XOR EXEMPT (the ten hidden, frozen); the playable ones'
  exports from their source; THE CONSOLE NEVER NAMES A GAME (14 files grepped); the checker itself; the wiring. The harbor's `cartridge`
  group runs `checkCartridge` on the REAL modules in a page: both playable pass, the ten hidden have 0 gaps too (only their chat locks
  wait in the old switch).

**THE ADD-ON (the owner, Nov 4 8:14–8:18 am — the last work group)**
- **LEAVE ROOM UP FRONT** (it was ☰ → SETTINGS → LEAVE ROOM): the FIRST row of the ☰ menu while in a room (red-edged; one tap = "SURE? TAP
  AGAIN", the second leaves; not during a match — QUIT TO THE ROOM there) + the foot of GUESTS (the same second tap). Leaving = the player node
  goes → every other phone plays the wave + the walk off; this phone's city flies THE NIGHT's CHAMPION after 2+ games. (QUIT TO LOBBY reads
  QUIT TO THE ROOM in City 2.0.)
- **THE CREW's BLACKBIRD DIDN'T FLY — THE CAUSE**: the room audience was never wired to the city. The server wrote the crew's (and a favor's,
  and the owner's LOBBY ONLY) sky moments to `rooms/{CODE}/radio` all along, but the room's phones only ever played the INTERCOM from there —
  the sky moments were parked in CITY CONTROLS B "until LOBBY 2.0 makes the lobby the live city" and 2A didn't switch them on (the crew's
  desk even said so: "sky moments play once lobbies are in the city"). Not the limits, not a queue, not the reveal-tap gate. THE FIX:
  `room.js` hands the room's sky moments to the store (`roomRadio`) → title.js → the remote's feed (`roomMoments`) → scene-radio, which plays
  each ONCE at its place on the server clock (a legendary still never over a show — the lanes). Only phones IN the room listen there:
  never outside it. The desk's "dormant" notes are gone ("every phone in your lobby sees it").
- **ONE SHEET STACK** (in GUESTS a card opened BEHIND the sheet — the same bug as CUSTOMIZE): fixed ONCE for the whole app — `ui/layers.js
  #watchLayers` (installed at boot) gives EVERY pop-up that lands on <body> — the profile's sheets, CUSTOMIZE, the full card AND the older
  `.modal` sheets (HOW TO PLAY, a game's options, settings, credits) — the next layer as it appears and takes it back as it goes; the app's
  Esc closes a `.modal` only when it's the top layer. ‹ / swipe-down closes one step (the profile's sheet stack, unchanged). Found on the way:
  a GUEST tapping a game in GAMES opened HOW TO PLAY behind the games sheet — now on top.

- **THE REMATCH VOTE, TIDIED** (the owner, Nov 4 9:25 am — the second add-on): the 👍 bubbles over the voters are GONE (they bunched and
  covered the signs — the vote shows only at the ring); the dots — which scattered round the ring onto the dock's pill (over CHAT) and off
  the edge — are ONE neat ROW right ABOVE the ring on a dark glass rail (11-pt dots, right-aligned 8 pt in from the ring's edge: 7 dots ≈
  121 pt — on screen at 390 / 402 / 430, never over the pill), the "3 of 7 want a rematch" pill just above the row, clear of the promenade's
  people. Screenshots of 1 · 4 · 7 voters at all three widths: `tests/integration/room2-votes.mjs` (shots-votes/).

## Tests (so far)
unit `tests/lobby-2b.test.mjs` (11) · rules (+ 2: the stamps, THE REMATCH VOTE) · harbor job `room2`: `roomfix` (10), `gamestart` (7), `citypause` (3), `afterparty` (16).
