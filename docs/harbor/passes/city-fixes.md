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
