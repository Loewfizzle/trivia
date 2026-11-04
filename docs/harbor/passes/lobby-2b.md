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

## Tests (so far)
unit `tests/lobby-2b.test.mjs` · harbor job `room2`: `roomfix` (10), `gamestart` (7), `citypause` (3).
