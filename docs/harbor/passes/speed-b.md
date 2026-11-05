# THE SPEED PASS B (Nov 4–5, night) — THE PHONE's SPEED + THE OWNER's FOUR

Step 0 = plan.md "OWNER'S NOTES — NOV 4 (night, his SPEED PASS test)" (+ decisions.md). The speed pass's split-off Group 3 (review-6.md A2 A6
A3 H5 E2 E3) + the owner's four notes from his SPEED PASS test + the two red speed checks THE SPEED PASS handed on.

## Group 0 — THE OWNER's FOUR

### THE LEAVER DOUBLES (10:21 pm, his laptop)
- **The cause** (reproduced at 1440×900 and 402): two bugs. (1) A LEAVE's own database write fires this phone's `players` listener BEFORE
  `leaveRoom()` finishes — `room.js` read it as a disconnect ("YOU WERE DISCONNECTED FROM THE ROOM") and exited that way. (2) Out of the room
  (`scene.room(null)`), EVERY room figure on the leaver's screen got the leave plan — the wave + the walk-off — so the host's figure waved
  goodbye beside his own: "two TESTERs wave at once + both walk off" (the tags gone, the rings fading, they read as two of him).
- **The fix**: `room.js` — `leavingCode`: a leave in flight never reads its own write as a disconnect; `exitRoom(…, { how })` records HOW
  (`exitHow()`: leave · lost · kick · closed). `people.js#room(null, { me, wave })` — only THIS phone's own figure leaves the promenade (it
  waves only on a LEAVE; a drop / a kick / a closed room just walks off); every OTHER room figure carries on INSIDE through the side door the
  doorman holds (`planIn`, one after another ~0.45 s apart) — the room goes on without you; nobody vanishes in view (THE PEOPLE RULE).
- **Proof**: `speed` job `leaver` — every figure the NEAR pass draws (`__district.drawnNow()`, new) counted frame by frame through the
  walk-off on the leaver's screen + the host's, 1440×900 + 402, a leave + a drop: ONE figure of the leaver at most (failed before: 2 waving
  at once on the leaver's own screen + the "DISCONNECTED" toast).

### THE HOST LEAVES ON PURPOSE
- `leaveRoom()` already handed `meta/hostId` to the next player in join order (online first) — but nobody was TOLD. `host.js#watchHand`:
  a host change + the old host's node gone within 6 s (the two writes land apart) → ONE toast on every phone in the room: the heir "YOU’RE
  THE HOST NOW", everyone else "AVA IS THE HOST NOW". A claim over a DROPPED host (its node stays) keeps its own line on the claimer only
  ("HOST SIGNAL LOST — YOU ARE NOW THE HOST"; `myClaim` keeps watchHand quiet). The dock's PLAY ring follows `isHost()`.
- **Proof**: `hostleave` — three slots: the heir in ~250 ms, one toast each, PLAY on the heir / WAITING on the other; a dropped host → one
  claim toast.

### THE FULL CARD PREVIEW LAGS (8:05 pm, CUSTOMIZE → VIEW FULL on SKY KING)
- **MEASURED FIRST** (`fullcard`: 4× CPU, the real compositor, 402×874 @3, SKY KING's full card, wearing THE SOURCE): over CUSTOMIZE
  **33.3 ms median, p95 50.1, 206 of 240 frames slow (~30 fps)** — the SAME card with CUSTOMIZE taken away **16.7 / 16.8 / 0 slow (60 fps)**;
  behind it 13 fx slots drawn every frame + 17 CSS animations running. No backdrop-filter anywhere (the backdrop was already a flat 86 %).
- **The fix — THE COVER**: `fx/renderer.js#fxCover(keep)` holds every fx surface outside the full card (not drawn, not cleared — its canvas
  keeps the frame it showed; its clock stopped and resumed from the same frame on close); `body.vl-covered` pauses every CSS animation
  outside `.vl-full` (css/vault.css); the city's frames held (`scene.js` listens for `vl-cover`); the backdrop 92 % near-black. One place:
  `vault/full.js#openFullCard` — CUSTOMIZE, GUESTS, a player tap, the profile all open through it. Covers count (a card over a card).
- **After**: over CUSTOMIZE **16.7 ms median, p95 16.8, 0 of 240 slow** — the same as alone; 0 slots + 0 animations behind; on CLOSE 13
  slots + 17 animations move again.

### MULTIPLE TABS (8:56 pm)
- Checked: PERF-A's handshake (`identity.js#watchDuplicateTabs`) already kept ONE host loop per player — but the OLDER tab always won, even
  hidden behind the one in use, and the yielded tab's music still played.
- **Now**: the tab ON SCREEN wins (`vis` in the handshake; two on screen or two hidden → the older, as before); a yielded tab brought on
  screen takes over at once (`visibilitychange`), or when the player's tab reports it's hidden; a yielded tab is QUIET — its music off for
  that page only, never saved (`audio/settings.js#setPageQuiet`).
- **Proof**: `twotabs` — two pages of one slot in one browser: in the room + mid-match, exactly one tab writes (`host.js#hostStats`: the
  beats + steps), the one on screen; flipped, the other takes over and the first goes quiet; the quiet tab's music off; the device's own
  music setting never written as off.

## Group 1 — THE PHONE's SPEED
(below)

## Group 2 — THE RED SPEED CHECKS
(below)

## The numbers
(below)

## Decisions
- Out of the room, the OTHERS walk INSIDE (the room carries on in the speakeasy — "YOUR FRIENDS ARE ALREADY INSIDE"), never a second walk-off.
- The leaver's own figure waves only on a LEAVE; a drop / kick / closed room walks off without a wave.
- A deliberate LEAVE shows no toast on the leaver's phone (it never did — only the false "DISCONNECTED" did).
- The tab you look at is the player (the owner's "only the VISIBLE tab acts").

## Known issues + held back
(below)
