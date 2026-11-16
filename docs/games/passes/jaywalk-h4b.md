# JAYWALK H4B — THE GHOST FIX — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 16 — after his first live match)" (Step 0, `e208ad04`). The reference:
docs/jaywalk.md ("THE MATCH": THE FIRST GO's PROOF + THE GHOSTS — IN STEP WITH THE WORLD · "THE START"). On the mini PC.
**NO RULES CHANGE in this pass** (H4's `jw … k` rule + H1's / H3's must be published for any JAYWALK run to count — unchanged).
No `/api` file, no boot file touched (THE BOOT BUDGET untouched). **JAYWALK IS NOT PLAYABLE** (THE ONE SWITCH stays off).

The links: **https://neonspeakeasy.com** (the owner: HOST a room → GAMES → JAYWALK · TEST → START) ·
**https://neonspeakeasy.com/jaywalk-lab.html** (the lab).

## The owner's report (his first live match)
SPECTATING "looks great" — but the GHOSTS walk through cars and water, and the first seconds of the match felt laggy.
**THE RULE FROM NOW ON: a ghost is ALWAYS drawn consistent with the world on screen — never inside a car, never in the water while alive.**

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing open for
  JAYWALK (read at the start, after the groups' commit, before the final tests).
- The cloud result of `ed13bc1e` (H4's last push): `tests` green (6 m 15 s), `harbor` skipped (a game pass) — nothing to fix.

## Group 1 — THE COURSE IS THE SAME FOR EVERYONE
- **It COULD mismatch (found by the model, fixed):** a plain `set(serverTimestamp())` shows the writer its own ESTIMATE of the
  server's time in its own mirror at once. H4's phones read THE FIRST GO from that mirror: a phone took a course from its own
  estimate, then switched when the server's value (or an EARLIER GO) arrived — on a slow line, after tick 0; a slow HOST wrote its
  estimate's course into the game while the server derives the course from the real nodes.
- **The fix:** (1) a match's GO is **a TRANSACTION never applied locally** (`view.js#askGoMatch`) — a phone's mirror holds only GOs
  the server sent, in the server's order (a later arrival always carries a later time: the first one seen IS the first);
  (2) **THE NODES ARE THE TRUTH** — `logic.js#startOf`: every phone (count + play) and the host's final patch read the course + tick 0
  from the first GO among the proof nodes, exactly as the server's `jaywalkMatch`; the game's own only with no node to read.
- **The proof:** `tests/jaywalk-firstgo.test.mjs` — a model of the start with the REAL `startOf` + `nextStep`: 147 rooms (one phone
  0.3 / 0.6 / 1 / 1.5 / 2 / 3 s slow — both ways, up only, down only; as the host or a guest; its clock right, behind by its delay,
  half of it, or 150 ms ahead; + two slow phones, + the slow phone's GO landing first): every phone, the host's GO patch and the
  server derive the SAME seed + tick 0, each phone takes its course ONCE, nobody plays a tick on another course. **The same model
  with H4's local echo mismatches** (phones switching, ticks played on a course the server never picked, a wrong GO patch) — the
  test has teeth. + the real line: `e2e-jaywalk-match.mjs --lag=900` and `--lag=1800` (`kit/lag.mjs`: every database frame of ONE
  phone held, each way — CHARLIE through the first match, THE HOST through the rematch's start): each phone's seed + tick 0 logged,
  all equal to the server's own `matchStart(nodes)`; the slow phone took the course ≈ 1.1 s before tick 0 instead of 2 s — once.

## Group 2 — GHOSTS IN STEP WITH THE WORLD
- **What caused the walking-through:** a ghost's run was stepped to the clock − `GHOST_DELAY` (75 ticks = 1.25 s) while the cars +
  logs were drawn at the clock. `tests/jaywalk-ghosts.test.mjs` reproduces it: the players' own states 75 ticks late, tested against
  the world now, stand inside vehicles + on open water. (Spectating looked right because the scene drew the WORLD at the watched
  ghost's own old tick.)
- **`js/games/jaywalk/ghosts.js` (PURE):** `conf` (every known hop in its own tick) → `run` (stepped on to THE WORLD's tick with no
  new hop assumed: they stand / ride their log with it) · a late hop → `run` rebuilt + a QUICK-HOP catch-up from where the ghost was
  drawn (`off` / `vis`) · a death only once the player's own `e` is here (`done`) — until then a run that would go out HOLDS STILL
  (`held`), past `HELD_SHOW_MS` 0.9 s not drawn · THE MOTHERSHIP needs no confirmation.
- **`view.js`:** THE WORLD's tick (the kid's own while he runs — a stall is caught up with the cars; the clock's once out / watching);
  `feedGhosts` / `stepGhosts` on ghosts.js; the scene gets `{ t, a, off }`; spectating follows the same drawn run (its catch-up too).
  **`night.js`:** every hazard drawn at `o.t`; a ghost's / the watched kid's catch-up drawn in the air; a held ghost never rides.
- **HOPS AT ONCE:** `CLOCK.flushMatchMs` 500 → **120**. Measured (the E2E, the lazy bot): 12–44 writes a minute a player (a chunk a
  hop); the hard cap is 500 a minute (8.3 a second). THE DROPPED SIGNAL + the proof unchanged.
- **Tests:** `tests/jaywalk-ghosts.test.mjs` — the cause reproduced · on a log = ON the log, at a roadside / on a road never in a
  car (4 bot runs × 3 network delays, every frame against `course.js`'s own tests) · a late hop: the drawn place never jumps, with
  every hop in the ghost = the player tick for tick · no death before the player's `e`, at the player's own tick, never un-happens,
  the final lanes + cause = the player's own · a 20 s dropped signal · a course change. **The E2E** checks every drawn ghost of the
  whole match on all three phones against the world it was drawn in (`view.js#probe`): 2,500–3,400 ghost-frames a phone, 0 in a
  vehicle, 0 on open water; the ghosts' final lanes = the players' own on every phone.
- **A call made here (an established pattern — "still catching up: not drawn"):** a HELD ghost is hidden after 0.9 s. The prompt
  said it "simply holds still"; with a dropped signal that would leave a kid standing in traffic for up to a minute — the very thing
  the owner reported. It reappears with a catch-up hop the moment its hops land.
- **Also fixed (seen in the spectate shot):** the OUT words over the scene never faded — their entry animation's `both` fill held
  them at full. Now `backwards`: they fade after 2.3 s as H4 meant.

## Group 3 — THE SLOW START
- **Measured** (`--start`: BOB's phone, 390 × 844 @3, 4× CPU, a cold scene; `--profile` adds the CPU profile): the count's first
  second has ≈ 0.6 s of long frames (the scene's own start — worst 200–234 ms, all before the "2"; the profile: native GPU work, the
  city is not drawing, the rules cost nothing: `createCourse` 0.02 ms). **The first 3 s after GO: worst frame 16.9 ms BEFORE and
  16.9–17.0 ms AFTER** — on this machine the first hop frames were already smooth; **the owner's lag could not be reproduced here**
  (Playwright's WebKit on Windows runs the scene at ~25 fps in software — no use as a pacing measure; no hitch against its own median).
- **What was built anyway (what a phone does differently):** THE WARM FRAME (`night.js#warm` — every instanced kind drawn once under
  the ground + `renderer.compile` + one render, in the first frame and after the models land: nothing is first built when it first
  comes into view) · the sounds decoded during the count · the phone's tier remembered 14 days (`jw:lab:tier`) · the ghosts no longer
  stand still for the first 1.25 s.
- **Not done:** building the scene before the count (a second WebGL scene alive during the walk inside — the city's memory rules).

## Group 4 — THE CHECKS + THE CLOSE
- The 3-phone emulator match end to end with the slow line (`--lag=900`, `--lag=1800`): the same course everywhere, the ghosts never
  in cars / water, spectating at 58–60 fps (p95 17 ms), the report counted for all three.
- The docs: docs/jaywalk.md (the index · THE FIRST GO's PROOF · THE GHOSTS rewritten · THE START), docs/testing.md, ROADMAP,
  CLAUDE.md (one line), `build-file-hashes`, `build-preload-graph` (ghosts.js joins JAYWALK's graph: 28 modules, 275 KB),
  `claude-md-coverage`.

## The final local run (my own emulators + `scripts/serve.mjs --emu`; NEVER THE LIVE SITE)
- unit **2126 / 2126** (registration + the cartridge + the two new JAYWALK files in it) · rules **83 / 83** · `/api` server **65 / 65**
  + progression **10 / 10** + friends **10 / 10** · smoke **21 / 21** (THE PAGES LOAD 12 / 12, JAYWALK's start) · the harbor
  cartridge group **3 / 3** · wk-press **43 / 43** · jaywalk-lab **115 / 115** with WebKit · e2e-jaywalk **57 / 57** with the perf
  measure (59.9 fps at every tier, 4× CPU) · e2e-jaywalk-match **54 / 54** with `--perf --start` (4 players, 3 ghosts, 4× CPU: 59.9
  fps at every tier) · the match with the slow line: `--lag=900` **49 / 49**, `--lag=1800` **49 / 49**.
- **e2e-daily: RED here — and RED THE SAME WAY ON THE CODE FROM BEFORE THIS PASS** (52 checks green, then FATAL "the harbor cleared").
  Seen with a debug copy: after the test's 1.5 s OVERCLOCK match + its page reload, **THE SAVE-YOUR-KEY POP-UP opens over the
  resumed COAST CLEAR run** (`.sh.kp-sheet` on top of the board — the taps land on the sheet): `profile/keypop.js#KEYPOP_COVERED`
  has no `.dy-run`, and whether the pop-up opens before the reload (the test passes) or after it, over the run (it fails), is a race.
  Reproduced on `e208ad04` served on :5173 with clean emulator data (it passed once on :5174). H4's run + the last cloud run were
  green on it. **Not fixed here** (another area's boot file, its own harbor group) — logged in THE ADD-ON INBOX for the dailies' /
  the city's next pass: a running daily should count as "never over a running game".
- A note for the next pass: two `serve.mjs` on one emulator database, or a database wiped under a running server, make e2e-daily
  fail in other places (the server caches the day) — one fresh server, clean data.

## The files
`js/games/jaywalk/ghosts.js` (NEW, pure) · `view.js` · `night.js` · `logic.js` (`startOf`) · `director.js` (the final patch) ·
`tuning.js` (`flushMatchMs`) · `css/jaywalk.css` (the out card's fade) · `tests/jaywalk-ghosts.test.mjs` + `tests/jaywalk-firstgo.test.mjs`
(NEW) · `tests/jaywalk-solo.test.mjs` + `jaywalk-cartridge.test.mjs` (re-pointed) · `tests/integration/e2e-jaywalk-match.mjs`
(`--lag[=ms]`, `--start`, `--profile`) · `tests/integration/kit/lag.mjs` (NEW) · `kit/harness.mjs` (`beforeLoad`).

## Known limits (for the review)
- A ghost's death is shown when the player's `e` arrives — one network beat after it happened (the vehicle has driven on).
- A host slower than ≈ 3 s each way can still call a match UNPROVEN (`NO_GO_MS`) while GOs exist — unchanged from H4.
- THE START on a real iPhone is unmeasured: the owner's next match tells.
