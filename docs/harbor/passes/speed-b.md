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

## Group 1 — THE PHONE's SPEED (review-6.md A + E + H5)

### A2 — THE REBUILD AFTER A MATCH (`speed` job `rebuild`: BACK TO THE ROOM → the city shown, 4× CPU, 402 @3, the long tasks to the reveal)
- **(1) the people's first plan, one block a task**: `core/harbor-people.js#folkWarmSteps(t)` names the blocks the first frame reads
  (`A(kb)`, `A(kb+1)`, `A(ka)`, `Bv(kb)`); `folkAt(t, { warm: [kind, k] })` plans ONE into the cache and stops. `people.js#staged` warms
  them one per task (setTimeout 0) while the city bakes, nobody drawn until they're in, and the scene's reveal waits for `people.ready()`
  (the city is shown WITH its people — no pop-in). FIRST plan only: a later re-layout never blanks the promenade (`lived`).
- **(2) ONE update**: `host.js#backToLobby` writes `meta/back` + `meta/status: lobby` + the wipe in one update (one round trip, every phone
  sees the stamp with the status); a refusal (rules without meta/back) is reported and falls back to the old two writes (`backWrites`).
- **Numbers (4 runs each, the mini PC)**: shown **6.25–6.45 s → 6.05–6.30 s**; long-task time to the reveal **5.3–5.9 s → 4.97–5.24 s**; the 4
  blocks warmed in 4 tasks. The BIGGEST task stays **~900–1000 ms** (the build itself — the title's mount + `scene.js#layout` + the first
  bakes' `drawImage`), not the people → (3) held back (Known issues). On the phone (÷4): ≈ 50 ms sooner, ≈ 0.1 s less blocked time.

### A6 — THE RESIZE (`resizekeep`)
- Measured: the walking map (`folkMap`) uses the camera's half-width at each depth for the edges people walk in from — ANY size change (width
  OR height: the camera's focal length follows the height) changes it, so re-planning on a resize is CORRECT (old visits would enter
  mid-screen). Built: the plan is KEPT whenever the map comes out the same (`people.js#mapSig` — e.g. the window moved to a screen of another
  pixel ratio: kept, the same walkers); a size change re-plans. The −130 ms the review hoped for needs world-fixed entry points → held back.

### A3 — THE BORDER LASER (THE VAULT BENCH, 8 legendaries, 4× CPU, 402 @3)
- `parseColour` was ALREADY cached by string (FR6's 172 ms was the strings re-built per segment). Now: the tail's stroke colours made ONCE per
  (colour, second colour, segments) — `laser.js#tailStyles`; the edge's lengths once a draw (`alongL`); a gradient's stop signature ONCE per
  distinct stop list for the page (`gl.js#sigs` — gradients are new objects every frame); **18 segments at tier ≤ 1** (30 at tier 2).
- **GPU path** (SW=0): busy **4.11–4.19 → 3.87–3.99 ms** a frame at tier 2 (slow frames 4–6 → 2–3 of ~240); at tier 1 **3.59–3.67 → 2.65–2.71
  ms (−26 %)**. Software canvas (the iPhone stand-in): busy unchanged (3.8–4.1 ms — the strokes' pixels are the cost), JS 12.5–14.6 → 10–10.7.
  Proof: `tests/speed-b.test.mjs` (the same strings frame to frame; 60 strokes at tier 2, 36 at tier 1 — 60 before).

### H5 — NO GLASS DURING THE START (`startglass`)
- `css/title.css`: `body.rc-going *` → `backdrop-filter: none` for the whole start (the dock's glass bar was live over the moving city).
  **1 → 0** glass layers mid-start. The start's frames at 4× CPU (the real compositor, 402 @3) **unchanged — median ~66.7 ms** before and after:
  on this machine the glass wasn't the cost (native paint is — `(program)` + road.js's sign words + the people); recorded, not gated.

### E2 — THE MUSIC (`musiccache`, `tests/integration/bytes-probe.mjs`)
- **(a)** `synced-songs.js#wanted`: the PREVIOUS song only if this phone already has it (an arrival in the 4-s crossfade never fetches a whole
  song for its last seconds of fade). **(b) THE MUSIC CACHE**: one fetch + decode per song URL on the page, shared by every player (refs); a
  released song stays decoded (`KEEP_N` 1, `KEEP_MS` 4 min) so the city's rebuild after a match picks the station song up again.
  Proof: mid-crossfade 1 → 0 previous-song fetches; a song stopped + wanted by a NEW player: 2 fetches + 2 decodes → 1 + 1 (both fail on the old code).
- **The bytes probe** (a fresh visit, 25 s, one tap, the same city time): **10.2 MB before and after (4.4 MB music)** — at an ordinary moment
  nothing changes; the saving is one whole song (~2–4 MB) for an arrival inside a crossfade and one song per return from a match. The review's
  17.6 MB was not reproduced at this moment (its count included a previous + next song); (d) re-encoding stays the owner's call (not done).

### E3 — `/api/time` (e2e-conn THE CLOCK)
- 3 samples (was 5); the refine round only when the boot's best was ≥ 80 ms (was 45 — it nearly always fired); "back on screen" re-syncs
  only when the last sync is > 10 min old. Measured (answers 60 ms late, a phone network): **10 → 3** requests in a title's first ~20 s;
  **5 → 0** on a return to the screen within 10 min.

## Group 2 — THE RED SPEED CHECKS (stopped at its measurements — the owner's rule: the pass was at its time)
- **THE VAULT's FULL LOBBY of 8 legendaries at 4× CPU**: GREEN in this pass's runs — 3 / 240 slow (the rule ≤ 6 %), the GPU path's four mixes
  57–60 fps (A3 took ~0.2 ms a frame off at tier 2, ~1 ms at tier 1). No change to the check.
- **`roomperf`'s OWN COST at 4× CPU** (the room of 8): still RED on the mini PC — 36.7 ms alone → 39.7 walking in (< 9 ✓) → 40.0 standing
  (+3.3 vs the bar's < 3) → 43.3 with the guest list open (+6.6 vs < 4). The same as at the pre-pass commit (speed.md's A/B). What it is: the 8
  standing figures' draw (~3.3 ms at 4× = ~0.8 ms on a phone) and, with the guest list open, the strips' GPU work contending with the city's
  canvas (the "city's frame work" timer then counts the wait). Not widened; not fixed — handed on (Known issues).
- **THE PARTY ROOM at 2× CPU**: **~34–35 → 36.9 fps** (91 of 149 frames slow; 60 fps at 1×, 0 of 240 slow); the city's frame work median
  15.2 ms, p95 18.5. Its TOP THREE costs (PROF=1, 4 s at 2×): (1) the city's baked layers composited every frame — native `drawImage`, ~850 ms
  of 4 s; (2) the guest list's 8 legendary strips on the GPU painter — `gl.js#pv` / `vtx` / `strokePoly` / `bufferData` ≈ 300 ms (the
  laser's share now smaller); (3) the road's sign words redrawn each frame — `road.js#word` 82 ms. None taken in this pass.

## The numbers
(below)

## Decisions
- Out of the room, the OTHERS walk INSIDE (the room carries on in the speakeasy — "YOUR FRIENDS ARE ALREADY INSIDE"), never a second walk-off.
- The leaver's own figure waves only on a LEAVE; a drop / kick / closed room walks off without a wave.
- A deliberate LEAVE shows no toast on the leaver's phone (it never did — only the false "DISCONNECTED" did).
- The tab you look at is the player (the owner's "only the VISIBLE tab acts").

## Known issues + held back
(below)
