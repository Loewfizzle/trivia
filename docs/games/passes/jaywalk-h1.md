# JAYWALK H1 — THE ENGINE + THE GRAYBOX — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 12–16 — DECIDED)" (Step 0, `238c669b`). The reference: docs/jaywalk.md (the game's own
doc — the rules, the modes table, the engine's contract, the replay + the proof, the lab). On the mini PC.
**RULES CHANGED** — `rooms/{CODE}/jw/{matchId}/{uid}` (JAYWALK's proof node, NEW) → RE-PUBLISH `database.rules.json` (Firebase console →
Realtime Database → Rules → paste the whole file → Publish). Nothing live writes it before H4, so nothing breaks while the old rules run; the
FR7 FIXES B change (the host deletes ONE match's `prism` / `oc` / `ocm` node) is still waiting in the same file — one publish covers both.
`/api`: `api/_lib/jaywalk.js` NEW (not a function — the 8 stay 8), `api/report.js` (the proof tree). JAYWALK IS NOT PLAYABLE: THE ONE SWITCH stays off.

The live preview: **https://neonspeakeasy.com/jaywalk-lab.html** (+ `?fps=1`) — owner-gated, no room, no database writes.

## Group 0 — THE START
`node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing addressed to JAYWALK
(read at the start, after every group, before the final tests).

## Group 1 — THE PURE ENGINE (`b125c36a`) — js/games/jaywalk/
`tuning.js` · `course.js` · `engine.js` (+ `bot.js`). What was decided while building (all in docs/jaywalk.md):
- **60 ticks a second, a hop = 8 ticks (133 ms)**; fixed point 1000 = a cell; integers + Math.floor only.
- **A lane = f(seed, index)** — the raw kind is the FIRST draw of the lane's own rng, so a lane's rules may read its neighbours' raw kinds with
  no recursion (never more than 3 water lanes in a row; no obstacle beside water). **A stretch's specials** (`specials(seed, stretch)`): THE UFO
  or THE BLACKBIRD's band — one pick, so never both.
- **Movers** (cars, logs) = items laid round ONE lap of the lane (`period`), an item's left edge = `mod(off + dir·v·tick, period) − pad`.
  **Pulses** (trains, THE BLACKBIRD) = `idle → tell → pass` on a lap in ticks; the body crosses the lane in `pass` ticks. THE FLIGHT PATH = a
  band of **2 lanes sharing one pulse**. THE UFO = a triangle-wave drift in x and y over a zone of 8 lanes (no water / rail under its reach).
- **The wall is part of the run** (it follows the kid's best: never more than 5 lanes behind) — so it is stepped with the kid, per player.
- **The hop's collision lane**: the lane it left for the first half, the lane it lands on after; water is only judged on landing + while standing.
- Found by the bots: a floor on a negative slope made the logs 2 cells from lane 30 (→ the lengths ride an FP scale, floored); the bot needed a
  detour out of obstacle pockets (the centre column is always free — a pocket is never a trap, a kid hops back out).

## Group 2 — THE REPLAY + THE SERVER HALF (`b125c36a`)
`replay.js` (replay · the log's bounds · the packed log · `logFromChunks`), `api/_lib/jaywalk.js#verifyRun`.
Tests (unit, Node): `jaywalk-engine` 8 · `jaywalk-sim` 6 (2,000 seeds × 3 modes — every lane crossable, the opening calm, the difficulty
rising, the Blackbird's tell ≥ 1.5 s, the UFO + the Blackbird never in one stretch) · `jaywalk-deep` 7 (deep runs, the caps, THE ONE-UP, the
hand-built logs for boom / ufo / airfield + the near-misses that must not) · `jaywalk-server` 4 (forged logs refused). ~8 s together.
The bots' numbers (solo, 300 seeds, ≤ 2 minutes of play): a median of 182 lanes, the best 438; deaths — cars 76 %, water 16 %, the wall 3 %.

## Group 3 — THE CARTRIDGE + THE PROOF NODE (`9142ea6c`)
`meta.js` · `logic.js` · `director.js` · `index.js` · `view.js` (a stub) · `css/jaywalk.css`; the GAMES row (`playable: false`, `preview: true`).
- **The results are THE REPLAY** of each player's own chunks (`logic.js#scoreRuns`) — the `e` a phone writes is only "my run ended".
- **Registered**: the registry loader, the tube mark, the theme, STANDINGS + SOLO_OK, PROOF_TREES (a flat tree) + PROOF_NODE_LIST +
  NEW_PLAYER_NODES, the per-game budget (a NEW line: 160 modules / 2450 KB — HOLD'EM's; H1 is 134 / ~2100), the preload graph.
- **`tests/registration.test.mjs` on `preview` rows + `JAYWALK_WAITS`**: meta → the go-live pass · help + boards → H3 · art → H2 · smoke → H4.
- **TWO BUDGET CALLS (named):** (1) **no meta at boot** — THE BOOT BUDGET is at 310 / 310 modules; HE3's pattern (HOLD'EM had none while it
  was being built), the go-live pass adds it with a named raise. (2) **the boot BYTES** were 375 bytes under their 6,500 KB — the registration
  alone is ~500: the GAMES row + the mark are written short and the stand-in JAYWALK row in `title-taps.js` (dead now — the sign finds its own
  GAMES row) is gone → 6,499.99 KB. **The next pass that adds a byte to a boot file needs a named raise** (or a trim).
- **The rules**: `jw/{matchId}/{uid}` — `go` (once, `=== now`), `c/{i}` (`/^([UDLR][0-9a-z]+)*$/`, ≤ 400 chars, append only, i 0–999), `e`
  (once); the writes are granted on the LEAVES (so a player can never delete one), the host deletes ONE match's node. The ack names both pending changes.
- Older tests updated for "a game is being built again": `cartridge` (BUILDING), `holdem-owner`, `profiles` (+ its fixture), `shell-b1`, `backup`
  (`jw` is a path inside a room), `fr7-fixes-b`, `play-now`, `preload-graph`, the smoke test's hidden-games count (10 → 11).

## Group 4 — THE JAYWALK LAB (`4fbd4b89`)
`jaywalk-lab.html` (root) · `lab.js` · `graybox.js` · `controls.js`. Three refine passes on the shots (Downloads/NEON/jaywalk-h1/):
1. the fps readout collided with the lane count (→ the foot, above the bar); the end screen's words got a scrim; the wall sat 7 lanes back,
   never seen (→ 5: it waits just under the screen's foot); the camera's look-ahead 4 → 4.5 (the kid 62 % → 64 % down the screen at rest).
2. the runway lights were specks (→ 3× bigger, white-hot when lit, the flight path's ground its own slate blue); the UFO's beam circle brighter.
3. the lanes behind the start drew black (a negative index into the colour pair) → plain grass no kid can hop onto: the wall is seen coming from
   the first second; **the run waits for the first touch** (tick 0 = the first hop — an untouched page never runs the wall at the kid).
- **Measured** (390 × 844 @3, the bot playing, `jaywalk-lab.mjs --perf`): 1× CPU 59.9 fps · 4× CPU **59.9 fps, 16.7 ms a frame (p95 16.8,
  worst 17.0), 0 frames over 33 ms, 1.2 ms of work a frame (p95 1.8, worst 2.7 — the bot's look-ahead included)**, 8 draw calls, ~1,200
  triangles. (Headless Chromium on the mini PC's Radeon — the owner's iPhone is the real test: `?fps=1`.)
- `tests/integration/jaywalk-lab.mjs`: 50 checks (a stranger gets the door + three.js never fetched; every tap acts; the camera; a bot's whole
  run → REPLAY = LIVE; one tap = HOP AGAIN; the modes; the sizes 390 / 402 / 430 / 1440 × 900). THE PAGES LOAD: `/jaywalk-lab` (Chromium + WebKit).

## Group 5 — THE CLOSE
docs/jaywalk.md (new) · CLAUDE.md (the docs table row, ONE standing-rule line, the intro, the file layout) · docs/cartridge.md "JAYWALK H1" ·
docs/testing.md "JAYWALK H1" · docs/data-model.md (the `jw` node) · ROADMAP. Builders: file hashes, the preload graph (the boot preload: unchanged).

## THE FINAL LOCAL RUN (my own emulators + `scripts/serve.mjs --emu`, the mini PC — NEVER THE LIVE SITE)
unit **2076 / 2076** · rules **83 / 83** · `/api` server **63 / 63** + progression **10 / 10** · smoke **20 / 20** (THE PAGES LOAD 12 / 12: the six
pages × Chromium + WebKit, `/jaywalk-lab` among them) · e2e-daily **95 / 95** · wk-press **43 / 43** · harbor `ONLY=cartridge,neon` **42 / 42** ·
jaywalk-lab **50 / 50** (+ three plain runs 45 / 45).
- **Two older checks counted the games** and were red until updated: the smoke test's HIDDEN GAMES (10 → 11: JAYWALK, being built, can't start on
  a plain page) and the harbor `cartridge` group (6 → 7 cartridges meet the contract in a real page — "jaywalk: ok").
- **A wrong red of my own making:** e2e-daily + wk-press need the server started with `DAILY_TEST=1` and e2e-daily BEFORE wk-press (it seeds the
  dailies) — on a plain `serve.mjs --emu` the DAILY screen never opens (5 / 5 then FATAL · 32 / 35). Now in docs/testing.md "JAYWALK H1".
- A race in my own lab check (it read the hop LOG 12 ms after a swipe, before the next tick had logged it) → it reads the hop ASKED for.
- **Not run:** e2e-playnow (long, not on this pass's list — its only touched line is the sign's COMING SOON, covered by e2e-daily's sign check
  + `tests/play-now.test.mjs`); e2e-profiles; the full harbor suite (the cloud's, on a harbor tag — this is a game pass).

## REAL vs PLACEHOLDER
REAL: the rules + the course + the modes + the wall, the replay + its bounds, the server's verify, the moments' detection, the cartridge's
frame / step / ranks, the proof node + its rules + its tests, the controls. PLACEHOLDER: the graybox (boxes, no art, no sounds), the end
screens' words, the match screen (a stub — no match can be played yet), the daily's lives, every tuning number (a first-pass feel).

## KNOWN / FOR THE NEXT PASSES
- **H4 — the chunks are not time-stamped**: a bot could upload a perfect log (the engine is public). The match needs a per-chunk server time
  (a hop's tick ≤ the time since GO) — a rules + verify change, decided in H4.
- H4: the host's end today waits for every `e` or the mothership — an offline player needs their own end (the host can replay their log).
- The feel numbers (`tuning.js`) are untested by a human hand: the hop's 133 ms, the cars' speeds, the wall's pace — the owner plays the lab.
- The end screen "TAKEN AT LANE n" was only seen through the unit tests (a 6-minute run in the lab shows it).
