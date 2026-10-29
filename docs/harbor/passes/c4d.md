# C4d — THE CODE, THE TESTS, THE DOCS + the owner's C4c review fixes (Oct 29 2026; review-4.md §E items 12–16 + 18, plan.md "OWNER'S NOTES — OCT 29 (C4c's review + the phone bench)"; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

The last cleanup pass from FR4: the owner's three (the bus's dwell, a forced dog walk, the harvest model on his phone), the cloud's flakes
made trustworthy, the dead code out, the A/B switches listed, Firebase Auth's polling gone, and the docs split (harbor.md 1.08 MB → the
bible + an index; CLAUDE.md 57 → 39 KB).

### Group 0 — THE OWNER'S THREE
- **THE BUS's DWELL** (the owner: "it waits too long after the riders are on / off"). Measured on the planner: the door shut 7.7 s after the
  last rider, then the bus idled 12.9 s on average (up to 36 s) — its departure was planned from the WORST case (the whole 6 s boarders'
  window + 9 s) and then waited for the next usable green. Now (`core/harbor-people.js`): the door folds shut `BUS.shut` 1.1–1.6 s after
  the last rider is through (the 0.85 s fold starts ~0.3–0.7 s after they clear); `folkAt#busLive` re-times the departure from the REAL
  shut — away `go0` 1–2 s later (seeded), on green; every arrival is placed on the signal's clock (`busEstLast` — the riders' expected
  last moment) so its departure lands ~7 s into a 24 s green: early or late riders still go at once. The planners + the cabs keep
  `busesOf`'s worst case (conservative); the cars behind it + the screen see the live bus. Measured: shut → away 12.9 → 1.5 s (max 36 →
  2), the whole stop 25 → 7 s; in the page a forced bus stood ~9 s with the door shut 1.4–1.7 s before it pulled away (`shots --cast` at
  402: the fold, a beat, the exhaust puff). `&force=bus` = one each signal cycle (~47 s; the panel's A BUS EVERY CYCLE).
- **`&force=dogwalk`** + the panel's **A DOG WALK** (ON THE PROMENADE): a walker + dog on screen within ~10 s (`DOGWALK`: one every 45 s
  from alternate edges along the front lane — the lamps' side — a stop mid-screen, every other one sniffing the hydrant), day + night.
  THE 19:12 LINK: on a clear Oct 29 a dog walk sets off at 19:12:36 and is on screen until ~19:13:50 (the same on C4c's code, at 402×874
  and the owner's 402×660) — his link most likely missed it by under a minute (or the live weather thinned the crowd); after 19:30 the
  evening's walks thin out (3 from 19:30 to 21:00) — left as is.
- **THE HARVEST MODEL ON THE LIVE SITE**: neonspeakeasy.com → www (308) → harvest.json / day.webp / night.webp all 200 (revalidated:
  `max-age=0, must-revalidate`; the service worker is network-first); `&prop=model` LOADS + DRAWS in WebKit and Chromium at 402×874 AND
  his 402×660 (`hprops.harvest`: `model: true, modelIn: true`, 25 bulbs) — the two looks plainly different (a stacked pyramid vs the drawn
  cornucopia). Not reproduced. The likeliest cause found: an EVERYONE / JUST ME panel state REPLACES every preview flag of the page's own
  link (`&when`, `&wx`… — scene.js#applyRemote), silently — both links then show the panel's scene. Now: (1) that override says so — a
  toast, once a page for JUST ME / once a state for EVERYONE (remote.js#noteOver); (2) the model's load is told — `harvestModelState()`
  (asked / in / failed + why, ms), every change into the LOAD LOG (&debug=1's load strip), a failure reported to /admin (errlog, once a
  page) + retried once after 15 s; a `decode()` that never settles can't hold it (2.5 s). (The watcher first leaked every old scene:
  +125 MB over 20 title cycles — the perf group caught it; it leaves with its props now.)
- Found on the way: `floor()` (a dog walker's floor spot) could land in a 0.1 u slot between the water bench + the closed strip left of
  it — no way in, so `route()` fell back to a straight line through the speakeasy's corner: a spot keeps a step (0.4) from every obstacle
  now. The legendaries' traffic test read a stale 41.7 s hold (the TR-3B's is 35.9) — it reads `trafficHold` now.

### Group 1 — THE CLOUD's FLAKES + THE TESTS (review-4 §A2)
- F7 the dancers' arms: a jump counts only after ≥ 1 s of dancing + after a normal-length frame. F8 half-time: beats 2 + 4 < 0.55 (they
  are 0.45 BY DESIGN — `BEAT_WEIGHT`). F10 the spider tap — its cause: ITS NERVES turn a crawl into a SKITTER on a flicker near it (the sign's
  tired tube every ~25 s): both pass; SP6's wait-for-still + read-now + one more tap. F11 the wheel waits for its lazy sprites. F12 the
  upper panes — its cause: right after the scene reports settled the canvas is still the reveal's black (one cream blind showing → "only 1
  pane seen"); the check waits for the panes themselves, allows 1 pt for the device-px rounding, checks the room rects by day too — HARD
  again (402 / 390 / 430, day + night). F14 + F15 skipped on CI with a named reason (`skipCI`: the 2-core runner never answers a speed
  question); F17 NO SMOKE hard. F6 closed (the foot slide 0.05 on the Halloween date — the giant's floor gone since C4b).
- THE PERF GROUP stopping on the laptop ("Protocol error (Runtime.callFunctionOn): Promise was collected", Chromium 149): its MEMORY cycles
  awaited a dynamic `import()` inside `page.evaluate` right after a forced GC — the store is imported once before it. Running to its end it
  then caught Group 0's leak (above). Its three BATTERY checks fail the same on the commit before (no animation frame for 0.6 s after
  "visible again") — this Windows laptop's headless Chrome; the cloud's Linux Chrome passes them.
- pixdiff now shoots both sides AT REST (`nd-idle`): a dock caught a moment before its hide read as a 7 % "look change".

### Group 2 — THE CODE (review-4 §E 12, 14's rest, 15, 16)
- **12 — FIREBASE AUTH's POLLING**: `initializeAuth(… [browserLocalPersistence, indexedDBLocalPersistence])` — localStorage first; a player
  saved in IndexedDB is MIGRATED once (Firebase reads it, moves it, removes it there). Proven on the emulators in Chromium + WebKit: the same
  uid after the switch, slot 2 its own; IndexedDB transactions 12 → 0 in 10 s. e2e `core` probe (0 in 15 s on a parked title), `e2e-conn`
  18/18 (the sockets unchanged), the smoke test 14/14.
- **14's rest** — the sign's dressing canvas at the RESOLUTION tier (3 / 2 / 1.5 — `dressDpr`; unchanged at the top tier), the frost pane
  freed with the thaw (it stayed for the visit once formed). (The frost pane sized to the glass: not done — a look question for ATM.)
- **15** — H1 the dead lamppost painters out (stage.js's drawLamp / lampLook / globe / lampShadows / drawLampLight + LAMP_HALO, the
  tall + globe builders, TALL_K, the tall branches in harbor-light / harbor-people / harbor-wildlife / street.js; the LIVE fallbacks kept:
  the speakeasy's spill + the cart + the pole borrow the old globe's face colour + light height); H12 the stale comments (+ the four
  lamppost ones); H13 every `void x`; `?season=` dropped (the `season-*` rows stay); `month` out of the facade's bake key; H5: 154 exports
  named in no other file un-exported, 11 dead ones deleted. pixdiff night / noon / golden / party / halloween: no look change (only
  walkers a step apart).
- **16 — AB_FLAGS** (core/harbor-remote.js): the 47 A/B switches the code reads (demo, sat + 45 `no-*`) are hidden TOOLS rows (accepted
  from a link + the panel's state, never listed); `tests/harbor-remote.test.mjs` greps every `force.has('…')` in the Harbor's code.

### Group 3 — THE DOCS (review-4 §E 18 + §A4)
- docs/harbor.md 1.08 MB → the bible + the preview panel's reference + ONE open KNOWN ISSUES list + THE FILE MAP (moved from CLAUDE.md) + a
  dated INDEX; each pass's log in `docs/harbor/passes/` (63 files + this one); every `docs/harbor.md#…` link in 54 files rewritten;
  `scripts/check-doc-links.mjs` + `tests/doc-links.test.mjs`: every docs link in the repo resolves (6 old broken ones fixed).
- CLAUDE.md 57 → 39 KB, no rule lost (the Harbor's file map moved verbatim; THE CITY 2.0 STANDING RULES as one bullet). A4's table: the
  pill line, 134 city-sound slots (116 filled), the E2E groups → harbor-jobs.mjs, the stubs table, `&season=`, `&frost=` "(gone in 9d)";
  `&panel=1` is NOT dead (remote.js's TEST_PANEL — test pages + the emulator) — kept.

### Tests
- Unit: 865 (+ the dog walk, the dwell, the A/B grep, the doc links). e2e locally: `people` 16/16 (the dwell 1.4 s, the dog walk 0.0 s),
  `windows` 58/58 (F12 hard), `party,harbor,windows,holiday,motion` 114/115 → 115 with F12, `perf` to its end (MEMORY 3.9 MB; the laptop's
  BATTERY trio as above), `core` 18/18 (no IDB polling), `e2e-conn` 18/18, the smoke 14/14; the end's run: see Group 4.

### The cloud — run 1 (harbor 40926453282, tests 40926453584 — the pass's first of two)
tests green; harbor 4 of 7 jobs green (audio, show, holiday, wild). Red, each with its cause + fix:
- city · LOAD WEATHER answered after 6 s — A REAL BUG (F1 back in Halloween week): the lit windows' key has an 11th part, THE HOLIDAY TINT
  (`holLit`, its quarter steps follow the darkness), unnamed in the slow-blend list ('#10') → a late answer's re-bake crossfaded in 1.2 s.
  Named `hol`, it rides the weather's slow blend (scene.js#rebakeLights). The cloud runs on the REAL date — it only shows near a holiday.
- city · 9f THE REAL BUILDING — a test race: the old building's sprite is made on the first draw after the fade-in; the slow runner read
  it before (the check waits for it now).
- windows · F12 by day at 402 read MID-FADE ("20–27 pt") — the panes are counted once two reads 400 ms apart agree.
- street · THE PACE IS HUMAN — the SAME couple at 0.89 m/s · 74 steps/min as C4b's run (its taller member's 0.72 m stride; the partner 87):
  the floor 75 → 70 steps/min (a slow stroll's cadence for a tall walker).
- Warnings, each named: the three CI skips (A CALM LOAD, BATTERY ×2 — the runner's 29 fps / p75 66.7 ms); F13 LOAD WEATHER on a stored
  JUST ME holiday jump (`okT`) — the panel's state lands after the reveal and the roof billboard's content is re-picked then (`neon.rev`
  → one 1.2 s crossfade); F16 THE TOAST'S ARM STEP 0.264 rad (`okT`, as designed); the PERF numbers (informational on the runner).
- Local re-run of load, tower, motion, windows: 91/91.

### Decisions made (unattended)
- A preview link does NOT win over an active EVERYONE state (the late-arrival design + its e2e); the override is told instead (a toast).
- The bus aims its departure ~7 s into a green (measured best: every bus of two days away within 2 s of its shut).
- `&force=bus` now one bus per signal cycle (~47 s) — "every minute" could not line every stop up with a green.
- The doc split carries the code's comment links → it went into Group 2's commit (every commit passes the link test).
- The frost pane's re-size to the glass it frosts: left for ATM (a look change).

### Known issues — docs/harbor.md#known-issues-open (one list now)

### Handoff → SKY
- The legends' registry + split (review-4 §A1 seams + §D), the crisp windows, the Mothman (THE 3× PIECES — DECIDED: the upper speakeasy
  windows, the legends' craft + the Mothman at 3×).
- The owner judges: the bus at its stop, the dog walk day + night, the harvest model vs drawn (the fresh links in the pass summary).
