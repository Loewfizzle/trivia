# JAYWALK H4 — THE MATCH + THE POLISH — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 16 — DECIDED, after H3 on his phone)" (Step 0, `3e67ace9`). The reference:
docs/jaywalk.md ("THE MATCH" · "THE DROPPED SIGNAL" · "THE SHARE IMAGE" · "THE ICON — THE SIGNAL" · "THE POSTER"). On the mini PC.
**RULES CHANGED — RE-PUBLISH** (`database.rules.json`: the jw proof node's `k` — Call the Winner; H1's + H3's jw rules are STILL not
published either — `tests/fixtures/rules-live.json` has no `jw` at all: until the re-publish EVERY JAYWALK run on the live site plays
UNPROVEN and is never counted). **JAYWALK IS NOT PLAYABLE** (THE ONE SWITCH stays off): its solo run on the owner's phone, its matches
in a room the owner hosts. THE BOOT BUDGET was not raised (two boot files touched, both trimmed: 67 bytes spare).

The links: **https://neonspeakeasy.com/jaywalk-lab.html** (the lab) · **https://neonspeakeasy.com/jaywalk-lab.html?poster=1** (THE
POSTER) · **https://neonspeakeasy.com** (the owner: HOST a room → GAMES → JAYWALK · TEST → START; solo: PLAY → JAYWALK · TEST → PLAY NOW).

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing addressed to H4
  (read at the start, after the groups' commit, before the final tests).
- H3's cloud run on `496119a4`: `tests` green (the harbor job skipped — a ci-tagged push).

## Group 1 — THE LOOK + THE WORDS (three refine passes on the shots, 390 × 844 @3)
- **THE WATER** (`night-fx.js`): calm night water — navy → teal on two slow drifting noise fields, soft uneven ripples (their contour
  lines — the sine stripes + the wobbling streaks are gone), gentle broken reflections + small moving glints of the neon, a thin soft
  foam line. The logs' wake + ripple ring turned down (they read as glowing blobs on the darker water).
- **LOG ENDS** (`models.js`): plain pale wood, three thin rings a shade darker, facing up at the key light (the pink rim light made the
  banded ends read as shells).
- **THE TAXI** (`night.js`): cab yellow (`TAXI_HEX`), its roof light lit, its streaks its own yellow — "FLATTENED BY A TAXI" is true.
- **THE FLATTENED KID**: flat on his back like a paper doll (a pancake half as wide again, a tenth as thick, face up), a squash + one
  bounce, his cap pops up and lands on top of him. **THE WORLD GOES ON after a hit** (the run's tick stops; the cars + logs drive on) —
  the first shots showed why: the vehicle froze ON the kid and hid him.
- **PLAY AGAIN** everywhere (`AGAIN_LABEL` removed — the console's own word; the lab's end; the local end). **The end screen's buttons**
  = the site's non-pill tube (10 px corners — the dailies' established style; `.jw-final .btn`). `causes.js` unchanged (ONE table; the
  lab's end now uses it too — its own CAUSE words are gone).
- The shots: `Downloads\\NEON\\jaywalk-h4\\` — `h4-water-logs.png` · `-b` · `-lane200` · `h4-taxi.png` · `h4-flat-kid.png` · `-b`.

## Group 2 — THE DROPPED SIGNAL
docs/jaywalk.md "THE DROPPED SIGNAL". `replay.js#clockProblem` (a silence + a burst whose lag shrinks and that catches up = a drop,
never held against the run; a lag that grows = slow motion → cut) + `judgeRun` (ONE judge for the host's podium + the server) +
`tuning.js#CLOCK` (`drop` 75 s · `catchUp` 15 s · `jitter` 6 ticks · `flushMatchMs` 500). The view's end screen for a proven run with
no signal: NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK.
- **The results:** unit — 30 s · 60 s · from the start · two drops · over the run's end · a slow-link trickle → the FULL run counts;
  0.8× / 0.5× slow motion, a pause, a 95 s drop, a fake drop that never catches up → cut; the future, double speed, a backwards clock
  → refused. **Emulators, a REAL offline gap** (`e2e-jaywalk.mjs --drop`, `goOffline` / `goOnline`, the bot playing on): **30 s → the
  server saw a silence of 31.5 s then 24 chunks together → 20 lanes = the phone's 20, no cut · 60 s → 61.7 s then 44 chunks → 39 = 39,
  no cut**; both counted.
- Found by the unit agent, fixed: once a late chunk was accepted as a drop, every later late chunk passed for 15 s — a slowed game
  ending inside that grace was never cut. Now a lag that GROWS inside a burst is slow motion.

## Group 3 — THE MATCH (ONE LIFE)
docs/jaywalk.md "THE MATCH". The calls made (NEVER STOP TO ASK — each obvious or an established pattern):
- **ONE LIFE:** `MODES` without lives; the engine without lives / blink / respawn / the one-up / `down`; `course.js` without
  `oneUpLane` / `safeLane` / `freeCol`; the meta without options; the RESPAWN sound (2 files) out of the audition. A SOLO run's rules
  did not change (it always had one life): the replay / fairness / determinism suites re-ran green.
- **THE SEED = THE FIRST GO** — the prompt's "the host's GO server timestamp": every phone writes its own GO; the EARLIEST picks the
  course + tick 0. Chosen over "the host's node" because it survives a host change and a report after a rematch (the server derives
  it from the proof nodes alone — nothing host-written is read), and nobody chooses the millisecond either way.
- **The call lives on the caller's own proof node** (`k`) — no new room node, no registry entry, no boot byte.
- **A dropped player holds the end ≤ 18 + 75 s** (offline) / 18 s (online + silent); the watchers' line says who the room waits for.
- **A match nobody hopped in is never counted** (nothing to replay — and no XP for standing still).
- **The owner's guests are counted** by the owner's own proof node of that match (`reportableGame(id, uid, at)`).
- **PLAY AGAIN in a room = the console's rematch** (the podium's foot stays BACK TO THE ROOM — the console's rule); SHARE MY RUN sits
  in the body (the console's SHARE is the solo foot's).
- **`host.js`** (a boot file — moved lines, +27 bytes): `prevM` is read BEFORE the start's stamp clears `meta/back` — a start from the
  room after BACK TO THE ROOM pruned the just-finished match's proof nodes (a late report found nothing). Found by the match E2E.

## Group 4 — THE SHARE IMAGE + THE ICON + THE POSTER
- docs/jaywalk.md's three sections. THE SIGNAL **fits THE BOOT BUDGET** (the OVERCLOCK mark's comment trimmed) → shipped now on the
  owner's JAYWALK · TEST row + card + the room's list + the JAY / WALK uses of the mark; the tile (`art`) stays on `JAYWALK_WAITS`.
- THE POSTER: three passes — the game's own camera hid his face under the cap → a low hero camera in front of him (`POSTER.hero`).
  `Downloads\\NEON\\jaywalk-h4\\poster\\jaywalk-poster-1696x896.png` + `-848x448.png` (+ `poster-page.png`).
- The shots: `share-card-solo.png` · `share-card-match.png` · `owner-shelf.png` (the PLAY shelf, all four icons) · `owner-card.png`.

## THE ADD-ON (the owner, Nov 16 3:09 pm — in the last group): THE CAUSE LINE MUST NAME THE VEHICLE THAT HIT YOU
The owner was hit by a truck and the end screen said "HIT BY A CAR". **The cause:** the LAB had its own little CAUSE table (`car: 'HIT
BY A CAR'`, whatever the vehicle) — and the game's table kept a generic fallback with the same words. **Fixed at the root:** ONE source
of truth, `causes.js#vehicleAt(course, lane, j)` (from the course's seed) — the drawing (`night.js`) and the words (`hitVehicle` →
`runLine`) read the same function; the game's views, the podium and the lab all build their line through `runLine`; the lab's table
and the generic line are gone (a car hit with no vehicle found names the nearest one on the lane — never "a car"). **The test:**
`tests/jaywalk-causes.test.mjs` — for every vehicle kind (sedan · hatchback · taxi · van · box truck) + the train, a real run hit by
it → the end line names that exact vehicle, through the game's path AND the lab's; the sources are grepped (no second picker, no
"HIT BY A CAR" in any JAYWALK file); the lab check stands a kid in front of each kind in a real page (all five named); the solo E2E
names the vehicle of its own run. (The add-on arrived in the chat, not in the inbox file — nothing to mark there.)

## Group 5 — THE CHECKS
- Unit: `tests/jaywalk-match.test.mjs` (new, 10) + the updated `jaywalk-engine` / `-sim` / `-deep` / `-server` / `-solo` / `-cartridge`
  / `-night` / `-camera`, `registration` (`smoke` off the waits).
- Emulators: `rules.test.mjs` (the jw node's `k`) · `server.test.mjs` "JAYWALK H4 — THE MATCH" (a guest reports first → all three
  credited from the server's replay, the host's forged seed / clock / 99,999 never read, the silent player credited, a report after
  the rematch, a match without the owner / unproven / with no proof refused, a seat with no node dropped) + H1's updated (nobody
  hopped = nothing counted) · **`e2e-jaywalk-match.mjs`** (3 phones: the owner hosts → 3 · 2 · 1 · GO → the same course + clock on all
  three → ghosts + name tags → the live order → BOB out → the cause words → Call the Winner → watching the leader, a tap = the next →
  CHARLIE out → ALICE out ends it → the podium → the server's replay = the host's results → the report counted for all three → the
  share image → a rematch, the old proof kept) · `e2e-jaywalk.mjs` (solo: PLAY AGAIN, the non-pill tubes, the share image; `--drop`).
- **THE MOTHERSHIP's tick is NOT reproduced in a browser:** no bot survives six minutes with one life (0 of ~6,000 seeds; the longest
  21,252 of 21,600 ticks). Covered at the rules: a run stepped to the cap is `taken`, the director ends the match at the cap + 4 s,
  the row says TAKEN AT LANE n. A real six-minute match by people is the first real proof.
- **PERFORMANCE — a 4-player match (3 ghosts), the host's phone, 390 × 844 @3, 4× CPU, every bot playing:**

| tier | fps | frame (ms) | p95 | worst | work a frame (ms) | draw calls |
| --- | --- | --- | --- | --- | --- | --- |
| 2 (@3, bloom) | 59.9 | 16.7 | 16.8 | 16.9 | 6.3 | 28 |
| 1 (@2) | 59.9 | 16.7 | 16.8 | 17.0 | 4.4 | 24 |
| 0 (@1.5) | 59.9 | 16.7 | 16.8 | 17.0 | 4.2 | 23 |

## Group 6 — THE CLOSE (the final local run, my own emulators + `DAILY_TEST=1 serve.mjs --emu`)
- unit **2,112 / 2,112** (registration + cartridge + the new `jaywalk-match` 10 + `jaywalk-causes` 5 inside it) · rules **83 / 83** ·
  `/api` server **65 / 65** + progression **10 / 10** + friends **10 / 10** · smoke **21 / 21** (THE PAGES LOAD 12 / 12; JAYWALK's start)
  · harbor `ONLY=cartridge,neon` **42 / 42** · e2e-daily **95 / 95** (`DAILY_TEST=1`) · wk-press **43 / 43** · jaywalk-lab **115 / 115**
  with `--webkit` (every vehicle names itself) · jaywalk-poster **3 / 3** · **e2e-jaywalk 51 / 51** with `--perf` (59.9 fps at every
  tier, 4× CPU; PLAY AGAIN 60–66 ms) + `--drop` **58 / 58** (run before the add-on: the 30 s + 60 s real offline gaps) ·
  **e2e-jaywalk-match 45 / 45** with `--perf` (the table above; the final run: 59.9 fps at every tier, 21–26 draw calls) · e2e-playnow
  **20 / 21** — the one red is the KNOWN PRE-EXISTING `lost` case ("the shelf never opened" right after BACK TO THE CITY — named in
  H2's, H2B's and H3's logs).
- A wrong red of my own making, fixed: the new server test's fixture let two bots die at the same lane + tick (a shared first place) —
  the fixture now keeps trying courses until the owner's run is clearly the farthest.
- `node scripts/build-file-hashes.mjs` · `build-preload-graph.mjs` · `build-boot-preload.mjs` (309 modules) · `claude-md-coverage.mjs`
  (0 missing; CLAUDE.md 37.8 KB — ONE new line + two reworded). THE BOOT: 6,499.93 of 6,500 KB (67 bytes spare).
- ONE tagged push (the ci tag). My servers stopped (the emulators + `serve.mjs --emu` this pass started); Ben's :5190 was not running
  when the pass began and was left as found.

## REAL vs PLACEHOLDER
docs/jaywalk.md "REAL vs PLACEHOLDER after H4". REAL: the match end to end in the owner's room, one life, the dropped signal, the
share image, the icon, the poster's render, the look fixes. PLACEHOLDER: THE BLACKBIRD + THE UFO + THE MOTHERSHIP's visuals (H6), the
day look (H5), the tile, `CLOCK`'s + `GHOST_DELAY`'s numbers, the mix, the poster's hero camera.

## OPEN FOR BEN
1. **RE-PUBLISH the rules** — until then every JAYWALK run (solo or a match) plays UNPROVEN: no ghosts, no live order, never counted.
2. **THE POSTER** — judge the frame (`?poster=1`); the hero camera is five numbers in `poster.js#POSTER.hero`. The city chat swaps it in.
3. For the review (not decisions): a faked drop can slow the last ≤ 75 s of a run · a bot that plays in real time is a very good
   player · the mothership tick has only been proven at the rules.
