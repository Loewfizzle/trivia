# CITY FIXES + HOLD'EM (Nov 8 2026, evening)

A City 2.0 pass after DFIX3 (the dailies chat), before THE BTC CARD + BOARD 2.0. **ONLY what the brief listed** — Step 0, THE TAP WATCH + the lost
taps, THE HOLD'EM BILLBOARD, the weekly goal + SHARE TODAY's address, the city's carry-overs. Nothing else was started. Step 0 = plan.md
"OWNER'S NOTES — NOV 8 (afternoon)" + decisions.md (commit dec849a2).

## Group 1 — THE TAP WATCH + THE LOST TAPS

The owner (iPhone, Nov 8): "randomly a button does nothing on the first tap, works on the second" — the intercom's SEND, HOST / JOIN, a card
in SETTINGS, ADD FRIEND, "like it didn't have enough speed to register".

### What was causing it (found by reading the shared layer + proven in the E2E)

1. **THE SCREEN AT REST swallowed a VISIBLE tap — the main cause on the title.** After 5–10 s without a touch the title adds `.is-idle`: the dock,
   ☰ / ♪ and the radio button FADE out over 1.8 s. The class took their taps (`pointer-events: none`) and armed the "the waking tap only wakes"
   swallow **from the fade's first frame** — for ~1.5 s the buttons are plainly on screen, and a tap on HOST / JOIN / YOU / DAILY / ☰ did nothing
   but wake the dock; the second tap worked. It also went to rest **under open pop-ups that weren't `.sh` / `.modal`** — the radio desk
   (`.rd-modal`), CUSTOMIZE (`.vl-dress`), a full card — so after a pause to read (the intercom's review card), the next tap inside it (SEND) was
   swallowed by the window-level wake handler. **Fix** (`title-taps.js#goIdle`, `css/title.css`): TWO phases — `.is-idle` = the fade, STILL
   TAPPABLE (a tap wakes it AND goes through); `.is-rest` (+ `body.nd-rest`) after the 1.8 s fade = untappable, the waking tap only wakes (as the
   owner decided in 9e). Never at rest while ANY pop-up is open (THE LAYER STACK's count — `ui/layers.js#layersOpen` — + the radio / CUSTOMIZE /
   the full card / the profile overlay by class); the swallow never inside a layer (`[data-layer]`).
2. **Suspect 1 — a re-render REPLACING the control between the touch + the lift** (iOS drops that click: WebKit re-hit-tests the tap at the lift
   and a new node is "a different node"). Real ones found: the radio desk rebuilt its patch card (SEND) on the intercom's headline suggestion
   900 ms after the release + on its 500 ms live paint; the guest list rebuilt LOCK THE DOOR on EVERY room update (presence ticks included);
   ADD FRIEND was rebuilt when the friends list finished loading (right after the card opened) + on every friends event, unchanged; CUSTOMIZE's
   grid repainted when the approved list / the server's answer landed (its tiles act on pointerup — a tile replaced before the lift never saw
   its own down). **Fix**: `afterTap(fn)` (ui/tapwatch.js) — a periodic repaint waits while a finger is on a control until its click has landed
   (≤ 450 ms after the lift); the radio's render / live paint / paper, the guest list's update, the dock's DAILY slot, CUSTOMIZE's late repaints;
   LOCK THE DOOR + ADD FRIEND rebuilt only when they CHANGE; CUSTOMIZE's tiles + the room's name tags say they took the press (`tapHandled()`), and
   a tile also answers a click no lift of its own answered.
3. **Suspect 2 — `:hover`** (iOS spends a first tap on a hover that changes the page): three stray rules (admin's search hit, THE BOARD's ⋯,
   the old kick ✕) moved behind `@media (hover: hover)`; `tests/tapwatch.test.mjs` greps every shipped stylesheet for a stray.
4. **Suspect 3 — see-through layers**: a CLOSING sheet stayed a full-screen fixed box for its 280 ms fade (its scrim caught a tap on the dock
   right after ×). Now every pop-up on its way out takes no taps (components.css's leaving list: the sheet, a fading screen, the sighting
   pop-up, the invite card, the host card, the streak card, the muted hint, the guest rows, CUSTOMIZE + the radio before they're in, the
   dailies' banner always). The message bar, the fx canvases, the city's tag layer were already `pointer-events: none`.
5. **Suspect 4 — a target moving under the finger**: the dock's DAILY slot appearing (when today's answer lands — it shifts BOARD · GAMES · YOU)
   now waits for a tap in progress. A ☰ row tapped while the sheet still slides in can be dropped by the browser (Chromium did, 1 in 6 in the
   first run) — THE RESCUE gives it its click.
6. **Suspect 5 — the main thread busy**: the E2E taps through a 160 ms long task, store bursts + a tier change's full re-bake at random
   moments: every tap still landed (the click waits, it isn't lost). THE TAP WATCH records the touch's input delay + the long tasks (Chromium)
   + the city's last frame + a bake pending when a tap IS lost, so a real phone's report says if this one matters on the iPhone.

### THE TAP WATCH (js/ui/tapwatch.js — always on, listeners only)

A pointerdown + pointerup on a control (a button, a link, a row, anything wearing `cursor: pointer`) with NO click on it within 350 ms = a
LOST TAP → `/api/log { p: 'report', r: { kind: 'lost' } }` → /admin → "Reports from phones" → **LOST TAP** (its own group). The report: the
screen (+ the top sheet's title / CUSTOMIZE / the radio / a full card), the element (tag + classes + a short label — letters only, never a name
or a code), REPLACED / DETACHED between the down + the up, what was on top at the lift point, whether it MOVED (> 6 px), the input delay, the
long tasks, what re-rendered while the finger was down (the parents whose children changed — a MutationObserver only while a finger is down),
what the page was doing (the city's last frame + a bake pending — `setTapContext` from scene.js; a sheet animating; a message showing), whether
it was rescued. ≤ 1 report a minute + ≤ 20 a day per device (localStorage); the server: its OWN buckets (20 an hour per IP, 400 a day) + the
newest 40 kept PER KIND (prune.js + /admin's list), so lost taps never push a hang report out. Off while a game runs (`body[data-theme]` —
a game's pads act on their own pointer events) and on `[data-tap-own]` (the intercom's hold-to-talk).

**THE RESCUE**: a CLEAN tap (a finger — never a mouse —, ≤ 700 ms, ≤ 10 px, lifted on the same control or its identical replacement, no
pointercancel, no `touchend` preventDefault) that got no click by 350 ms gets it — on the control, or on its replacement at the lift point; a
real click arriving late after a rescue is swallowed (never twice). It turns an iOS-dropped tap into a ~350 ms-late tap while the reports
keep naming the cause.

### Proof

- `tests/integration/e2e-taps.mjs` (new; Chromium + `ENGINE=webkit` — Playwright's WebKit 402×874 @3, touch): real touch taps on JOIN, GAMES, ☰,
  ☰ → SETTINGS (while the menu slides in), a SETTINGS switch, YOU, BOARD, JOIN while the dock FADES, HOST, the room dock's GUESTS / GAMES /
  CHAT, LOCK THE DOOR (the room updating), ADD FRIEND — 20× each (YOU / BOARD 6×, HOST 8×, LOCK 10×: each rebuilds the city or a room), each
  with a random disturbance at a random moment (a message, a burst of store re-renders, a 160 ms busy main thread, a tier change's re-bake).
  **Chromium 22/22, WebKit 20/20 — every first tap landed, 0 lost.** (WebKit: 3 of the 20 slide-in taps hit a spot the moving sheet had
  left — the watch confirms the finger pressed the sheet, not the row: an aim miss of the test, not a dropped tap.) The at-rest tap only wakes;
  never at rest under a pop-up. THE RESCUE: a control replaced under the finger with no click from the browser — rescue off = 0 hits + a LOST
  TAP naming "REPLACED / DETACHED" + "re-rendered: div"; rescue on = exactly 1 hit on the replacement. THE REPORT ROUND TRIP: the lost tap in
  `phonelog` (kind `lost`) on the emulators, no room code, no player name.
- `tests/tapwatch.test.mjs` (unit): the rate limit, the clean-tap rule, the hover grep, the leaving list, the repainters wired, the server's kind.
- harbor `core,dock,radiorest,shell,corners,room,radio,youpage,playercard` 125/125 (radiorest now checks: tappable while fading, untappable at rest).

**The owner's 9:25 am freeze** (the 'U' button, Nov 8): /admin's errors + hang reports from his phone can't be read from this PC (no service-account
key, /admin is his sign-in) — open /admin → Reports from phones → HANG (Nov 8 ~9:15–9:30 am) to see if the hang watch caught it.

## Group 2 — THE HOLD'EM BILLBOARD

**The look** (design B · THE CHIP v2, `Downloads\NEON\holdem\holdem-billboard-b2.png`): painted IN CODE (`js/screens/harbor/holdem-art.js`) — a
navy sunburst from the chip, a cream frame + a thin gold keyline, the red chip with 8 cream inserts + a cream centre + a black spade, HOLD'EM in a
cream slab serif with a gold edge + a dark drop shadow + a lighter top, the pasted sheets' seams + a warm wash + grime at the foot. The lettering
is PATH DATA (`holdem-glyphs.js`, GENERATED by `scripts/build-holdem-art.mjs` from Alfa Slab One + Poppins Bold — Google Fonts, OFL 1.1, in ☰ →
CREDITS): no font load, crisp at any size, painted at once (never a re-bake after the reveal). **THE OWNER's ADD-ONS, mid-pass:** "COMING SOON
in gold + bigger so you can read it from the phone" → then "white would be even better — just not as big as HOLD'EM": COMING SOON (and NOW OPEN)
are WHITE with a dark navy edge, ~1.5× the mock's height (~60 % of HOLD'EM's), straight on the navy between two thin gold rules — the cream bar
went to give it the room, the chip a touch smaller. At 402 the board is ~74 × 40 pt: HOLD'EM + COMING SOON read unzoomed (Chromium + WebKit @3).

**The light**: the board's own five gooseneck lamps light it at night exactly like every poster (the same `poster()` → the night sprite × the lamp
map, a dead lamp still dark — THE LIGHT unchanged); by day the sun's wash. At night its lettering goes on THE CRISP LAYER like the messages.

**The rotation** (`core/harbor-holdem.js`, PURE + one state): HOLD'EM replaces the day's GAME on every board day key from `since` — every message
still runs first (the owner's radio messages, LOOK UP, FIREWORKS, PARTY, the Sunday postcard — `hintAt` unchanged, then HOLD'EM is back). THE
BILLPOSTER pastes it ONCE (his ~5 pm slot, the first day: the day's game → HOLD'EM in strips) and then STAYS HOME while the board keeps it
(`harbor-workers.js#workDay`: his draw still taken — every other worker still comes; two windowed shows may slide a few minutes into his gap).
THE GOLDEN TABLE proves the planners with the switch OFF (an input, like the weather).

**The owner's switch**: /admin → **THE BILLBOARD** — HOLD'EM AD: ON / OFF (a second tap confirms) + SHOW NOW OPEN / SHOW COMING SOON. Server-written
(`api/admin.js` `billboardState` / `billboardSet` → `city2/billboard`, audited), served in the cached `GET /api/admin?live=1` (`radioPublic.base`)
→ every phone within about a minute (`remote.js` → `setHoldem`). Never set = the timetable row's default (`billboard.holdem`: ON · COMING SOON
since 2026-11-08) — so it is up the moment this deploys. Turning it on starts it from TODAY (Eastern). No end date. **Preview**:
`&force=billboard-holdem` (+ `&holdem=open`) — its panel row in THE CITY'S NEON; with `&force=work-billposter` the paste to watch. THE DAY CHART
shows the base poster line (+ "no billposter today").

**A bug found by the WebKit shot**: the city's day keys aren't zero-padded (`2026-11-8`); a text compare against `2026-11-08` said "before" on
single-digit days — compared as day numbers now (a unit test).

Shots (`docs/harbor/passes/city-fixes/`): `holdem-night-402.png` · `holdem-day-402.png` · `holdem-open-402.png` (NOW OPEN) ·
`holdem-fireworks-402.png` (FIREWORKS / TONIGHT 9:30 takes the board) · `holdem-paste-402.png` (the billposter pasting it over OVERCLOCK) ·
`holdem-city-night-402.png` (the whole frame) · `holdem-webkit-402.png` (WebKit @3) · `holdem-night-390/430/1440.png`.
Proof: `tests/holdem.test.mjs` (the state, the billposter once, the force, the day chart), server.test's switch → the public feed (41/41),
harbor `billboard,workers,panelrows,load,core` 90/90.

## Group 3 — THIS WEEK'S GOAL + SHARE TODAY's ADDRESS

**THIS WEEK'S GOAL, DONE = one line.** Once the SERVER has paid the week's goal (`stats.gd` = the Eastern week key — `core/ranks.js#goalPaid`), YOUR
CARD's profile drops the big goal box and shows ONE quiet line under the four stats: a drawn check · GOAL DONE · +200 XP — until next Monday's goal
(`progress/profile.js`, `css/progress.css` `.pf-goal-done`). Never DONE before it's paid.

**The owner's case (8 / 8, "THE REWARD +200 XP", LV 5 at 70 / 85) — why it wasn't paid:** the server pays the goal only on a ROOM match
(`progress.js#matchStep`: `!solo`) — THE SOLO LANE (a room of one) is small capped XP by the owner's rule — but solo matches still advanced the
goal's COUNTER (`gw`, shared with the weekly boards). So solo plays filled the bar to 8 / 8 while the server, correctly, paid nothing; it would pay
on his next room match. **Fix:** the week's solo plays are counted apart (`pstats.gs`, reset with the week) and come off the goal's count
(`goalProgress(goal, gw, gs)` — the server's step + the tile + `/api/profile` all read it): the bar counts ROOM matches only, so it never says done
before it can pay. His current week's old solo plays (no `gs` yet): the box says "Paid with your next room match — solo games don't pay the goal".
**Verified** (`tests/goal-paid.test.mjs`): +200 exactly ONCE on the completing match; the same match reported again → `counted`, no second +200;
7 room + 1 solo = 7 / 8 (not done); the 8th ROOM match pays; next week the box is back. (His live data can't be read from here — no
service-account key; the logic is proven on the same pure step the server runs.)

**SHARE TODAY — the address is the foot's headline** (`js/daily/share-today.js`): NEONSPEAKEASY.COM ~52 px bold (the result lines are ≤ 44 px),
wide tracking fitted to the card (never crowded); NIGHT a small neon sign — the sign's pink in a soft glow, a white-hot core, a thin pink tube
round it (THE DAILIES sign's treatment); DAY strong dark navy. The "NEON SPEAKEASY" line above it is gone. Everything else unchanged (date,
tickets, stamps, the streak flame; no spoilers; both looks; the tickets still fill the room above the foot for 1–6 dailies).
Shots: `share-before-{night,day}.png` → `share-after-{night,day}.png` + each at the 360-px downscale (`…-360.png` — the address legible in a text
thread), `share-after-one-nostreak.png`; the goal: `goal-done-390.png` (the one line), `goal-wait-390.png` (done by the count, waiting to be paid).

## Group 4 — THE CITY's CARRY-OVERS

1. **THE GUEST LIST PAUSES THE CITY** (the owner, Nov 8): the guest list takes the shared, counted city hold (`ui/city-hold.js` — the full
   card's + the dailies'): the city keeps its last frame while the list is up and runs on from the same clock on close (the scene re-bases its
   frame clock — no jump). `roomperf` with a display: **60 fps alone → 60 fps** with 8 in the lines + the list open; THE ROOM's OWN COST at 4×
   CPU 37 ms alone → 38.7 walking in → 38.7 standing → **36.4 with the list's 8 strips** (was +7.2 ms over the budget of 4).
2. **THE BLACK HELICOPTER's TURNS** (the owner's iPhone: "jumps / skips a little as it turns + adjusts"): the cause was the cross-fade itself —
   the two nearest views were blended with the OLD one drawn whole under the new one, which then vanished at each 30° boundary (a pop every
   view), stepped in sixths. Now: **24 baked headings** (15° — `scripts/bake/blackhelo.mjs`; 124 KB, ~5.2 MB decoded, still loaded only while
   it flies + dropped after), an **EXACT cross-fade** (`air.js#drawModel`: both views ADDED at weights summing to 1 — a true linear mix, the
   patrol gets it too), the blend in twelfths, and an **EASED HEADING** (`air.js#turn`: an angular velocity eased toward a capped target —
   it speeds up into a turn + settles out of it; the same ~1.4 s half turn). Proof (harbor `heli`, new block): every frame of its pass on the
   model — the biggest heading step **2° a frame** (≤ 4°), **59.9 fps p50, 0.2 % of frames over 20 ms** with a display (the bench frame check
   FRIENDS C skipped). Frame sheets of a turn (20 frames, 90 ms apart, cropped on it): `blackheli-turn-before.png` → `blackheli-turn-after.png`.
   WebKit: not run for this item (the harbor's helicopter checks are Chromium; the look is the same code path).
3. **THE BOARD's REPEATED SWAPS with the radio open**: probed (the board's rebuild counter — `boardXf().rev`): with nothing playing, 0 rebuilds
   in 30 s; with SEVERAL of the owner's messages live (what the radio group fires) each ran its own 25-s-every-60-s cycle — one spell ending a
   second before the next began swapped the board to the poster and straight back (two re-bakes + two fades for nothing). **Fix**
   (`harbor-billboard.js#ownerAt`): a gap ≤ 5 s between two message spells is bridged — the board goes from one message straight to the next
   (a unit test; the probe: 0 rebuilds over ~130 s with 4 overlapping messages). Also: `neon.boardGame` now names the HOLD'EM poster, so the
   500 ms check never re-applies it (that would have been a swap loop).
4. **LOAD WEATHER — red in the cloud only** — reproduced LOCALLY today (a Sunday): the check pins 10 am Eastern, the Sunday postcard's window
   opens at 10:00 — any scheduled spell (FIREWORKS 20 s every 3 min, LOOK UP, the postcard) can start or end inside THE LOAD LOG's 15 s by
   chance, a re-bake the eye sees. **Fix** (`scene.js#boardSync`): the board SETTLES before the reveal (synced every frame, tryReveal too) and
   KEEPS that content through the load's window — a scheduled spell waits ≤ 15 s on a fresh load; a change of the board's INPUTS (a panel /
   link force, the owner's messages, the intercom's headline, the HOLD'EM switch) still lands at once. The HOLD'EM switch is remembered on the
   device (`nd:holdem`), so a load uses the owner's last switch before the feed lands. Harbor `load` 19/19 (all five LOAD WEATHER cases).
