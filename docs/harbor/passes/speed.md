# THE SPEED PASS (Nov 4, evening) — the owner's room + /admin notes, green means green, THE PROGRESS RESET

Step 0 = plan.md "OWNER'S NOTES — NOV 4 (evening, his LOBBY FIXES test)" (+ decisions.md). **The owner split the pass mid-run:** Groups 0, 1,
2 + his PROGRESS RESET add-on here; **Group 3 (THE PHONE's SPEED — review-6.md A2 A6 A3 H5 E2 E3) is its own next pass, THE SPEED PASS B**
(nothing of it started). **No rules change** (`backups/` is server-only by the rules' default deny).

## What changed (by finding / the owner's note)

### Group 0 — the owner's LOBBY FIXES test
- **THE CARD OPENS ON YOURS** (5:55 pm): the YOU page painted the Gilded card from the cached profile, then the equipped full card arrived.
  `screens/profile.js#paintHero` paints THIS device's saved card at once — the equipped full card, or a neutral BLANK card shape while it loads
  (a member whose card isn't known yet: the blank too) — never another card; the server's answer never re-mounts the same card. GUESTS / a
  player tap / the round-end card already decide before they paint (checked). Proof: `speed` job `youcard` (fails on the old code:
  "pg-card → pg-card → vl-fc").
- **TWO CONTRADICTORY TOASTS** (3:45 pm): reproduced — a host claim in flight when the phone left the room committed after it, so "YOU ARE NOW
  THE HOST" landed on top of "DISCONNECTED". `host.js#claimHost` stands down for a room the phone is no longer in (before, inside the
  transaction, before the toast); **toasts come one at a time** (`ui/toast.js` — a newer replaces the older, which fades out in place).
  Proof: `staleroom` (the claim + exit, then the one-at-a-time rule — both failed before).
- **THE ROOM's FIGURES LEFT ON THE TITLE** (3:45 pm): the figures DO walk off (a leave and a disconnect, in the lobby and right after a match
  — `staleroom` measured ~9 s) — but with their coloured RINGS on, which is what reads as "still the room" passing the barbershop. Out of the
  room they now walk off as plain passers-by: the rings fade in 0.6 s (`people.js#RRING`; THE PEOPLE RULE keeps the walk).
- **THE BANNER PLANE FLIES HIGHER** (6:17 pm): the lane is clamped above THE OPEN SKY's FLOOR — the highest crown / spire / roof sign anywhere
  across the screen (`skyfx.js#bannerLane` + `skyFloorOf` from the frame's `skyline` + `skyTops`) — whatever lane the sign's text boxes gave
  (the owner's phone shot = a lane that fell to the crowns). On a wide screen it rises over SPEAKEASY and the sign dims while it crosses.
  Phones were already clear on a plain night (71–101 pt above the tallest tip at 390 / 402 / 430); 1440 was 29 pt INTO the crowns → 17 pt
  above. Proof: `bannersky` (the banner's box vs the skyline's tops, every sample across the crossing, after a real match, 4 sizes).
- **CUSTOMIZE — EDIT USERNAME** (6:25 pm FINAL): ONE row at the very top (the name + its colour dot) → ONE editor with the name + the colour
  (`profile/edit.js#openYouEditor`); the COLOUR row gone; the ✎ beside the name on the card REMOVED (6:28 pm). Proof: the profile E2E, the
  `youcard` / `lobbyfix2 youpage` checks, `tests/lobby-2a.test.mjs`.
- **THE GUEST's RING** (6:28 pm): WAITING / FOR HOST (two lines inside the ring's tube — 44 pt in its 47 pt inner circle — at 390 / 402 / 430;
  never the name). Proof: `guestring`.

### Group 1 — /admin, tidied + TEST PLAYERS, ALL OF THEM
- Every card COLLAPSIBLE with its count in the header (remembered per device; the long cards shut by default) + a JUMP BAR.
- THE LOGS GROUPED one row per kind (`js/admin/groups.js` — PURE, `tests/admin-groups.test.mjs`), a filter box, MARK SEEN + CLEAR per group
  (`seenLogs`, `clearErrors { sigs }`, `clearReports { ids }` — admins only, ids checked, audited).
- THE DAY CHART card off /admin (THE RADIO has the day; `/daychart` stays). There is no LEGENDARIES card on /admin (the radio's own) — nothing to
  remove.
- TEST PLAYERS: CREATED SINCE (default the very first profile), nights + last seen + made + member Nº per row, the PRE-TICK (two of: 0 nights ·
  a test-ish name · a test burst; never an admin, TESTER#2599 or a 2-night player; the reasons shown as tags). The same dry run → CONFIRM +
  the counter rule. Proof: server.test's TEST PLAYERS + grouped-logs case. Looked at 402 (no sideways scroll) + 1440.

### Group 2 — GREEN MEANS GREEN (review-6.md G + the plan's Group 3)
- **G1** the spider's tap: `holiday.mjs#hubStill` (the HUB still — `far < 1`, calm, no trip — a roam pause is also `still`), the tap where that
  same evaluation found it. **G3** the sightings capture's `ms < 12` dropped (the frame gaps stay). **G4** the board-row seed was ALREADY in
  (LOBBY 2.0 A — FR6 missed it); the vault's FULL LOBBY speed checks (+ the room's two) `skipCI` on the GPU-less runner with their RULE half
  hard (`vault.mjs#gpuCheck`); the tape's watchdog accepts either valid recovery (`tape-stop.js` counts `sliceEnds`).
- **LOBBY FIXES' font flake — a CITY BUG**: a fitted name whose face loaded after `document.fonts.ready` kept the fallback face's fit →
  overflowed. `ui/fit.js#onFontsLoaded` re-fits every fitted element on `loadingdone` (+ `full.js#fitTop`). Proof: the vault group's
  "A FONT THAT ARRIVES LATE".
- **room2's file-in**: a condition (the host seen walking / through the door before the fade — 1.6 s on the mini PC), never one sample.
- **G8**: the tail runs `panel` + `oldrules` side by side (two child processes), then `perf`. SHARDS=6 measured (below).
- **A7**: a preview link keeps `&lgnow` (+ `&labmarks` — localhost only) in a room (`identity.js#setUrlRoom`) → the `partyroom` group: a
  Saturday 22:15 party + the UFO + 8 in the lines + the guest list's 8 legendary strips.
- The untagged `oneseat` fix (58fe37d) runs in this pass's cloud run.

### THE ADD-ON — THE PROGRESS RESET (the owner, mid-pass)
/admin's PROGRESS RESET card (`api/_lib/reset.js`; the rules PURE in `js/core/reset.js`): PREVIEW → type RESET → a two-tap CONFIRM. A backup
first (`backups/{stamp}`, server only, newest 5, each RESTORE-able by typing RESTORE — a restore never takes an item), FOUNDING MEMBER stamped
on everyone who qualifies BEFORE the wipe, then XP / level / rank / streaks (the freezes held stay) / weekly goals / achievements / mastery +
per-match counters / records + THE BOARD go. Every item stays (the 1-of-1s, FOUNDING MEMBER), favors, the member Nº, name + tag, the
equipped card, the counted-match keys. Re-climbing: the match outcome's `nx` = the next level whose reward the player DOESN'T own (the
round-end tease), a level-up whose reward is owned says "Already yours". Repeatable (a second run only clears new progress). Proof:
`tests/progress-reset.test.mjs` + server.test's PROGRESS RESET case (admin-only, the preview writes nothing, the backup, founder first, items
kept, a re-climb, a second run, a restore). **Never run on the live site by a test — the owner presses it.**

## The numbers
- THE PARTY ROOM (A1's missing row, the mini PC, 402×874 @3, the real compositor): **60 fps at 1×** (0 of 240 frames slow); **~34 fps at 2×
  CPU** (98 of 137 slow); the city's frame work median ~17 ms, p95 ~23 ms. The start of THE SPEED PASS B.
- roomperf's ROOM's OWN COST at 4× (A/B on :5174 at the pre-pass commit 15d380b vs now): 33.6 / 33.7 ms alone → 42 / 38.6 with the guest
  list (old) vs 35.0 / 31.3 → 41 / 38.6 (now) — the same; the guest list's 8 strips add ~5–8 ms of the city's frame (GPU contention) → B.
- THE FULL LOCAL RUN: see below.

## The full local run (the mini PC — the busy-PC check quiet each time, 3.3–3.8 %)
- unit **1167/1167** · rules **64/64** · /api server.test **36/36** · progression 10/10 · sightings 4/4 · lab 2/2 · vault-2b 3/3 · vault-2c 3/3 ·
  the profile E2E **81/81** (two test fixes: the trophy chip + CUSTOMIZE by element click; the public board reads the CURRENT username) ·
  conn **20/20** · presence **12/12** · smoke **6/6** · WebKit `wk-room.mjs` **5/5**.
- THE FULL HARBOR SUITE, **SHARDS=6 measured (FR6 G8)**: 1112/1119 in 24 min, peak 20 GB — the six-shard load sagged every timing check
  (the party room 38 fps, crew + push, two sightings timings, `light`'s CDP timeout) — every one GREEN ALONE (room, crew, light, partyroom
  47/47; sightings + sgfast 12/12) — + one real test update (the guest dock's WAITING / FOR HOST). → **SHARDS STAYS 4.**
- **SHARDS=4**: 1115/1122 in 28 min, peak 17 GB. The reds: THE SPIDER'S TAP ×3 — a test bug of this pass (the hub-still wait outlasts the
  title's 10-s rest, which swallows the first touch) → `holiday.mjs#spiderTap` wakes the title right before the tap: holiday GREEN alone;
  THE VAULT's FULL LOBBY speed checks ×3 at 4× CPU (green alone; A/B on :5174 — the same code swings 7 → 41 slow frames between runs, the
  pre-pass commit the same) = this machine's noise tonight, skipped on the runner; roomperf's 4× OWN COST (the known red — the pre-pass commit
  fails it the same). The machine is slower tonight than in earlier passes (the 4× room baseline 33–45 ms; the suite 28 min vs ~20).

## Decisions (mine, inside the owner's notes)
- The figures out of the room: they still WALK off (THE PEOPLE RULE) — only the rings go at once.
- The banner may cross the SPEAKEASY word only where it must (a wide screen); the sign dims while it does.
- The pre-tick needs TWO reasons; a player of 2+ nights is never pre-ticked (his brother has nights).
- THE PROGRESS RESET keeps the streak's FREEZES HELD (a reward), resets the run; keeps the counted-match keys (no double counting); keeps
  `pcount/i` (everyone keeps items), clears `pcount/n` + `pcount/a`.

## Known issues + held back
- **THE SPEED PASS B** (split off by the owner): A2 A6 A3 H5 E2 E3 — untouched here.
- roomperf's 4× OWN COST check (+5–8 ms with the guest list) — red on the mini PC at the pre-pass commit too (A/B); skipped on the runner;
  B's first item.
- THE VAULT's FULL LOBBY at 4× CPU on the mini PC (the real compositor): 7–41 slow frames of 240 between runs of the SAME code (both commits) —
  a measurement that can't decide at its bar on this machine tonight; B looks at it with the phone's own numbers (the owner's `&bench=1`).
- `partyroom` measured in Chromium only (WebKit's `wk-room.mjs` covers the room's shows, 5/5 — not the party room's speed).
- The ONE ACCOUNT, ONE ROOM real-device test: the owner's, Sunday Nov 8.
