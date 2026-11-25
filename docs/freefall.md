# FREEFALL (id `freefall`) — the falling-ball game

**BEING BUILT — NOT REGISTERED, invisible to players.** F1 (Nov 25 2026): THE RULES — the engine, the replay + the judge (its server
half), the bot sims + the tuned numbers, and a graybox on the live site: the unlisted lab **https://neonspeakeasy.com/freefall-lab**
(NEVER counts; deleted at the go-live, as HIGH RISE's was). A glowing ball falls down a neon tower; the player drags left / right
anywhere to spin the tower so the ball drops through the gaps. Score = floors passed. JAYWALK is the quality benchmark; **HIGH RISE is the
code template** (`docs/highrise.md`): a pure engine, a result = THE REPLAY of the player's own input log, the rule-set table, a preview on
the live site. The owner's decisions: `docs/games/plan.md` "FREEFALL — F1 (approved Nov 25)". Read this page before a FREEFALL pass.

**Nothing is registered**: no GAMES entry, no `config.js` / meta / boot / cartridge change, no `/api` wiring (the 8 functions stay 8), no
database rules. The DAILY mode exists in the engine + the judge and NOTHING turns it on (no DAILIES row, no ticket, no server path) —
daily-ready only; its seed will come from the daily module's server-sealed day set, never from the date.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| F1 — THE ENGINE | Nov 25 2026 | `docs/games/passes/freefall-f1.md` | the engine, the tower (fair by construction), the replay + the judge (server half), the bot sims + the tuned numbers, THE LAB (/freefall-lab) |

## THE RULES (the owner's)
- **THE ONE RULE:** the same seed + the same INPUT LOG → the exact same run on any phone and on the server (**REPLAY = LIVE**). Integers
  only; no float, no `Date` / `Math.random` / `performance` in the rules.
- **THE TOWER:** floors are rings of 12 slices round a central pillar — **SAFE · GAP · RED**. `buildFloor(seed, i)` is a pure function of
  (seed, floor index): any floor, in any order, on the phone or the server. Each floor has a seeded **twist** (its rotation offset).
- **THE ANGLE:** the tower angle A is an integer 0 … 4095 (one turn). The ball sits at a fixed angle (`BALL` 0 — the front). The slice
  under the ball = `floor(((BALL − A − twist(floor)) mod 4096) × 12 / 4096)` — the slices are 341 or 342 units wide, every unit in
  exactly one (no edge belongs to two).
- **THE CONTROL:** the tower follows the finger 1 : 1 (the view). The rules get A per tick; **A changes only at logged ticks** (held
  between). **MAX SPIN** = 171 units a tick (≈ 2.5 turns a second): the phone's engine clamps (what did not fit is offered again at the
  next tick — the tower catches up), the judge refuses more (`spin`). **FAIR INPUT:** a move counts at the tick of its EVENT TIME (the
  pointer's `timeStamp` → `logic.js#tickOf`, the nearest tick) — 60 Hz and 120 Hz phones are equal.
- **THE BALL (event-driven, like HIGH RISE):** a run is a sequence of LANDING TICKS. On a landing the slice under the ball AT THAT TICK
  decides: **SAFE** → a bounce (`BOUNCE` ticks, then the next landing on the SAME floor) · **GAP** → a fall to the next floor (`FALL`
  ticks to its landing) · **RED** → OUT (`red`). The bounce and the fall NEVER change with depth — difficulty comes from the layout only.
- **THE BLAZE:** 3 floors fallen in a row without a bounce (the CLEAN count) light it. It stays lit until the ball lands on a solid
  slice: that slice SHATTERS (SAFE or RED alike), the floor counts as passed, the ball keeps falling, the blaze is spent and the clean
  count restarts at 0 (3 more clean floors relight it). A separate **NO-BOUNCE RUN** (gaps + shatters, reset only by a bounce) feeds
  TERMINAL VELOCITY.
- **THE LIGHTS GO OUT:** a darkness falls down the shaft — it starts `LEAD` (6) floors above the ball, rests a grace (4 s), then comes
  one floor every 2.5 s. It is never more than LEAD floors above the deepest floor the ball has reached (when the ball reaches floor f
  it moves down to at least f − LEAD, and its pace starts again from there). It only ever moves down. When it reaches the ball's floor
  → OUT (`dark`). A ball that stops moving has LEAD × the pace = 15 s; a run nobody touches ends at 19.0 s.
- **THE AREAS** (by floor, for the views): 0 THE ROOFTOP · 40 THE OFFICES · 80 THE SPEAKEASY · 120 UNDER THE HARBOR · 160 THE DEEP ·
  200 THE BOTTOM · past it (solo) THE TRENCH — the deep's palettes cycled, harder each lap of 40 floors.
- **THE MODES:** SOLO = endless (a 30:00 safety cap) · MATCH + DAILY = THE FINISH at THE BOTTOM (the 200th floor passed = `made`) or the
  3:00 cap (`cap`), whichever first.
- **THE RANKING:** the floors, then the EARLIER tick that floor was reached (`logic.js#rankCompare` / `standings`).
- **THE FEATS** (from the replay only): `reachedHarbor` (floor 120 — SPLASHDOWN) · `terminal` (15 floors in a row without a bounce —
  TERMINAL VELOCITY) · `reachedBottom` (floor 200 — ROCK BOTTOM).

## THE NUMBERS (`js/games/freefall/tuning.js` — THE RULE-SET TABLE's `classic` row; set by the sims: "THE SIMS")
| what | value |
| --- | --- |
| the tick | 1/60 s (`TICK_HZ` 60) |
| one turn · the slices · the ball | `TURN` 4096 units · `SLICES` 12 · `BALL` 0 (the front) |
| MAX SPIN | `maxSpin` 171 units a tick (2.5 turns a second) |
| the first landing | `first` 18 — the ball drops in onto floor 0 (the slice under it there is SAFE) |
| A BOUNCE · A FALL | `bounce` **36** ticks (0.6 s) · `fall` **18** ticks (0.3 s) — at every depth |
| THE BLAZE | `blaze` 3 clean floors |
| THE DARKNESS | `dark` { grace 240 (4 s) · pace 150 (a floor every 2.5 s) · lead 6 } |
| THE HUMAN PACE (the fairness proofs) | `human` { react 12 (200 ms) · spin 68 (1 turn a second) } → **reach 408** units in a fall ((18 − 12) × 68) · **hop 3** slices in a bounce |
| the layout's curves (256ths, by floor) | `gaps` 2 a floor at the top → 1 by floor 200 · `wide` (a gap is 2 slices) 100 % to floor 40 → 0 by 200 · `red` 1.5 at floor 10 → 6.5 at 200 · `hug` (a slice beside a gap is red) 22 % at 40 → 94 % at 200 |
| the layout's bounds | `redFrom` 10 · `hugFrom` 40 · `belowUntil` 120 · `windowRamp` 40 · `redMax` 8 · `safeMin` 3 · `gapSlicesMax` 6 · THE TRENCH `lap` { from 200, every 40, red + 0.5, hug + 3 % } |
| the modes | solo { finish null, capTicks 108000 } · match { 200, 10800 } · daily { 200, 10800 } |
| the feats | `HARBOR_FLOOR` 120 · `BOTTOM_FLOOR` 200 · `TERMINAL_RUN` 15 |
| the log's bounds | `MAX_LOG` 108000 (one entry a tick at most) · `SEED_MAX` 64 · `ENTRY_CHARS_MAX` 9 |

## THE TOWER — FAIR BY CONSTRUCTION (`tower-gen.js`)
A floor = `{ twist, gap, red }` (two 12-bit masks; `buildFloor` adds `slices`, the 12 kinds). The gaps + the twist are a function of
(seed, floor) alone; the red is laid ONE SLICE AT A TIME in the seed's order, **and only where every rule below still holds** — a slice
that would break one is simply not laid. `tests/freefall-tower.test.mjs` proves each rule again FROM THE OUTSIDE (its own maths, slice
by slice over 2,000 seeds × 240 floors + 250 seeds down to floor 520, and angle by angle for a subset):
- every floor has ≥ 1 gap and ≥ 3 safe slices; red is never more than 8 of 12; gaps are 1 or 2 slices wide and never touch.
- floors 0–9 have NO red; red sits beside a gap only from floor 40.
- **the early areas** (floors < 120 — THE ROOFTOP, THE OFFICES, THE SPEAKEASY): every slice straight below a gap (the two twists
  counted) is never red — a ball that falls through any point of a gap without a touch lands on SAFE or a GAP.
- **THE FALL WINDOW** (every floor): from ANY point of ANY gap, a human-paced spin (a 200 ms reaction, then ≤ 1 turn a second — 408
  units before the landing) reaches a SAFE or GAP point of the floor below. (A red run's TRAP — its points further than the reach
  from both its ends — never lies under a gap.) **It RAMPS in** (`tower-gen.js#reachAt` — the reviewer's find: no cliff at floor 120):
  the escape a floor may ask for is 0 above floor 120, then grows over 40 floors (102 units at floor 130, 204 at 140) to the full 408
  from floor 160. NOT covered by any rule: the landing after a SHATTER (the blaze drops the ball through solid ground) — the owner's call.
- **NO ISLAND** (the builder's addition): from every safe slice a gap can be reached by human-paced hops — no stretch of safe slices is
  walled in by red runs too long (> 3 slices) to cross inside one bounce. Nobody is ever left bouncing for the darkness.
- **floor 0:** the slice under the ball at the start (A = 0) is SAFE — a run never starts by falling.
- difficulty ramps by layout only: 2-slice gaps → 1-slice gaps (a 1-slice gap is 0.35 wide where the ball rides, the ball 0.28 — the
  graybox's numbers), fewer gaps, more red, red hugging the gaps; THE TRENCH adds red + hug each lap (it tops out at 8 red, every gap
  hugged, from about its 4th lap).
- **MOVING RED: NOT BUILT** (optional in the plan) — the static layout already ends a quarter of the GREAT bot's runs before the bottom.

## THE ENGINE
`js/games/freefall/` — HIGH RISE's split: `tuning.js` (THE RULE-SET TABLE + the classic row by name) · `tower-gen.js` (the floors) ·
`engine.js` (the pure step) · `logic.js` (the end's words, the seed, `tickOf`, THE AREAS, THE RANKING, the feats) · `replay.js` (the
replay, THE JUDGE, the packed log) · `bot.js` (the sim players). PURE: no DOM, no three.js; integers + `Math.floor` / `Math.imul` only;
the one import outside the folder is `core/rng.js#hashString` (an integer hash).

**EVENT-DRIVEN.** Between two landings only the darkness moves, at ticks the engine knows — `stepTo` jumps from one to the next (a
judge's replay costs one step a landing, not one a tick: a 108,000-entry log is judged in milliseconds).
- `createRun({ seed, mode, rules? })` → the run: tick 0 = GO, the tower at angle 0, the ball dropping in onto floor 0 (its first landing
  at tick 18), the darkness 6 floors above. It RECORDS its rule set and keeps its own INPUT LOG (`run.lt` the ticks · `run.la` the
  angles — `logOf(run)` → `[{ t, a }]`).
- `stepTo(run, tick, ev?)` — every landing and every step of the darkness up to that tick, in order. **At the same tick: THE CAP first**
  (it ends the run where it stands, before anything else that tick), **then the landing, then the darkness** (a ball that falls through
  a gap that tick has left the floor the darkness takes). A tick that is not a whole number moves nothing. **Every move with a tick ≤ T
  must be in before `stepTo(T)`** — a view calls `turn` first, then `stepTo`.
- `turn(run, tick, d, ev?)` → the units really turned (0 = nothing). THE CONTROL: all the turning that counts at ONE tick is clamped to
  ± MAX SPIN (the caller keeps the rest and offers it again); two moves at one tick are ONE entry (their sum); a tick that ends where it
  began leaves no entry (the log = the CHANGES only). `setAngle(run, tick, a, ev?)` = the same by the angle to reach (the shortest way).
- **FAIR INPUT in the engine:** `tick` is the move's EVENT tick and may be EARLIER than the tick the run was already stepped to —
  between two landings the angle decides nothing, so the move counts at its tick exactly. Only a move at / before a landing ALREADY
  DECIDED counts at the first tick after it (and never before a move already logged); `run.mt` = where it counted. The log the engine
  writes is always one the judge accepts (`tests/freefall-engine.test.mjs` "FAIR INPUT" — a 400-session fuzz: live == replay, event for event).
- the state (read-only for a view): `floor` (THE FLOORS PASSED = the floor the ball is on / falling to) · `at` (the tick that floor was
  reached — THE RANKING's tick) · `a` (the tower's angle) · `fl` ('drop' | 'bounce' | 'fall') + `pl` / `nl` (the flight's start + ITS
  LANDING's tick — a view eases the ball between them itself) · `clean` · `blaze` · `nb` / `maxNb` (the no-bounce run + its best) · `dk` /
  `dn` (the darkness's floor + the tick of its next step; `darkGap(run)`) · `sf` (the floor the last shatter dropped the ball to) ·
  `st` ('live' | 'out' | 'made' | 'cap') · `cause` · `end`. `floorNow(run)` / `sliceNow(run)` = the floor + the slice under the ball.
- `resultOf(run)` → `{ rules, floor, tick, end, over, cause ('red' | 'dark' | 'made' | 'cap' | ''), made, bounces, shatters, blazes,
  bestRun, moves, feats: { reachedHarbor, terminal, reachedBottom } }`.
- **THE EVENTS** (`ev`, for the VIEW — each with its tick `t`): `land { floor, slice, kind }` · `bounce { floor, slice }` ·
  `shatter { floor, slice, red }` · `fall { floor, clean }` · `blaze { floor }` · `area { id, floor }` · `dark { floor }` ·
  `out { cause }` · `made` · `cap`. A landing's own events come together, in order: `land` → `bounce` | `out` | (`shatter` →) `fall` →
  `blaze` → `area` → `dark` → `made`. (`fall.floor` / `blaze.floor` / `area.floor` = the floors passed after it.)

**THE TIMELINE:** the first landing at tick 18; a bounce → the next landing 36 ticks later on the same floor; a gap (or a shatter) → the
next landing 18 ticks later on the next floor. THE FINISH (match + daily) is the tick the 200th floor is passed — the run ends there
(`made`); the ball's last drop onto THE BOTTOM is the view's moment, not a landing of the rules.

**The builder's calls (F1 — the owner may overrule):** the end's words (`logic.js#END_WORDS`: HIT THE RED · THE LIGHTS WENT OUT · MADE
IT TO THE BOTTOM · TIME'S UP) · "the early areas" = floors < 120 · NO ISLAND · floor 0 is safe under the ball · the darkness starts
LEAD floors above (so a staller's 19.0 s = the 4 s grace + 6 floors × 2.5 s) and its pace starts again at a catch-up (a ball that
stops always has the full 15 s; with the pace's clock left alone it would be 12.5–15 s) · at one tick the landing comes before the
darkness, and THE CAP beats the finish · the first landing at tick 18 (the plan names no number) · the engine owns the log · the DAILY
mode = the match's numbers.

## THE JUDGE
`replay.js#judgeRun({ seed, mode, log, rules?, until? })` — ONE function for the phone's check and the server: `{ ok: true, rules, floor,
tick, end, cause, made, bounces, shatters, blazes, bestRun, moves, feats }` | `{ ok: false, why }` (`bestRun` = the best no-bounce run).
`until` (a whole tick ≥ 0) = the run AS IT STANDS at that tick — a match still going; the answer then carries `over`. The floors are the judge's own replay —
there is no field for a claimed one. **`mode` is REQUIRED.** Nothing throws: every hostile input gets its `{ ok: false, why }`.
`log` = `[{ t, a }]`: the tower's angle at the ticks it changed, the ticks rising.

| refused (`why`) | what |
| --- | --- |
| `rules` | a rule set THE TABLE does not hold (never judged as classic) |
| `mode` | missing, or not 'solo' / 'match' / 'daily' (only the MODES' own names: never 'constructor') |
| `seed` | not 1 … 64 printable ASCII characters, no space |
| `log` | not a list (a packed string that is not a canonical log, or longer than the mode's log packs to — `judgePacked`) |
| `too many entries` | more entries than the mode has ticks — named by the length alone, before an entry is read |
| `entry` | an entry that is not `{ t: a whole tick ≥ 0, a: a whole angle 0 … 4095 }` (a −0 is neither: one log, one JSON text) |
| `ticks not rising` | a tick ≤ the one before it |
| `past the cap` | a tick at / after the mode's cap |
| `no change` | an entry that turns nothing (the log holds the CHANGES only) |
| `spin` | a turn of more than MAX SPIN (171 units) in one tick |
| `past the end` | a move after the run was over (an out, the finish, the lights) — found by the replay itself |
| `until` | an `until` that is not a whole tick ≥ 0 |

The cheap bounds (`logProblem`) only NAME what the engine's own `turn()` never logs: the judge then replays the log through `turn()`
and refuses any entry the engine did not take exactly as written (its tick, its angle).

**THE PACKED LOG** (`packLog` / `packRun` / `unpackLog` — F4's run node): entry after entry, no separator — `[ '.' + the ticks since the
entry before, base 36 ]` (left out when it is 1: a drag logs tick after tick; the first entry counts from tick −1) + `'+'` | `'-'` + the
units turned (base 36, the SHORTEST way). `".c+2r+1k-3.a-z"` = tick 11: +99 · tick 12: +56 · tick 13: −3 · tick 23: −35. CANONICAL —
`packLog(unpackLog(s)) === s`, nothing else unpacks; a string longer than any log packs to is refused unread; the reader is one
hand-written pass (no regex over an unbounded string). A bot's log: ≈ 3.2 characters an entry, 12–17 entries a second — a great bot's
whole match ≈ 5.7 KB (the most seen: 8.4 KB); the hard ceiling of a 3:00 match is 10,800 entries.

**THE SERVER HALF:** `api/_lib/freefall.js` — PURE, NOT a function (the 8 stay 8), NOT WIRED, imports the SAME `js/games/freefall`
modules: `judgeRun` · `judgePacked({ seed, mode, log, rules? })` (the rule set + the mode + the seed are named before a character of
the log is read) · `serverRow(v)` (the row a report will read: `{ f, t, w, e, ft? }`). `tests/freefall-server.test.mjs`: honest bot
logs accepted, every refusal by name, the judge == the live engine for 500 bot runs across all modes, 3,000 changed logs.

**FOR F4 (the wiring — nothing calls the judge yet):** an EMPTY log is an honest run (`ok`, floor 0, THE LIGHTS WENT OUT at tick 1140)
— a report must not count it as a play · the judge knows nothing of the SERVER's clock: a perfect log can be computed offline, so the
run node needs JAYWALK's / HIGH RISE's server-timestamped chunks + THE SPEED CHECK (copy HIGH RISE's `proof.js` + the kit's
proof-writer) · the log is far bigger than HIGH RISE's 200 taps (≈ 4–8 KB a run, 30–40 KB at the ceiling): the chunking must plan for
it · a match scored as it stands goes through `judgeRun`'s `until` (`replay()` itself is NOT the hostile-safe door: it takes a log
the bounds already passed) · a run is on the wall clock: hiding the app lets the darkness end it (the owner's call for the solo game +
the daily). **What the judge alone allows (the reviewer's list):** a PERFECT RUN FROM NOTHING — a script that reads the tower (pure of
the seed) and turns at MAX SPIN stands on floor 200 at tick 3600 (1:00), on every seed, in milliseconds; slow motion (ticks are not
tied to wall time); a seed / mode / rule set of the caller's choosing, retried until perfect; any PREFIX of a log is a valid log,
played out with the tower held still. So F4 needs: the server's own seed + mode + rules, single use · both clock bounds per proof chunk
(the end tick × 16.67 ms against the server's time since `t0`) · and it may want plausibility flags from the replay (0 bounces over
200 floors, a move inside 200 ms of every pass).

## THE SIMS
`bot.js`: a bot plays FLIGHT BY FLIGHT, as a person does — on a bounce it picks the gap it can get to (the shortest turn that crosses no
wall of red), waits a moment, then spins at its own top speed with a Gaussian AIMING ERROR (wider for a longer turn); a far gap with red
beside it is taken in two hops; when it can not arrive before the landing a CAREFUL bot stops on the best solid ground on the way. In a
fall it mostly lets the ball land — it only DARES an air-steer to a close gap it saw coming, and gets off red straight below. With THE
BLAZE lit it thinks of the landing after the shatter. They play through the real `turn()` + `stepTo()` (what they log, the judge accepts).

| bot | reaction | top spin | aim σ (+ per unit turned) | careful | looks ahead | dares a gap within |
| --- | --- | --- | --- | --- | --- | --- |
| SLOPPY | 22 ticks (370 ms) | 40 u / tick (0.6 turn / s) | 150 u (+ 10 %) | 50 % | 20 % | — |
| GOOD | 14 (230 ms) | 60 (0.9) | 70 (+ 5 %) | 95 % | 70 % | 350 u |
| GREAT | 9 (150 ms) | 80 (1.2) | 35 (+ 3 %) | 100 % | 95 % | 450 u |
| HUMAN-PACED | 12 (200 ms) | 68 (1 turn / s) | 55 (+ 5 %) | 98 % | never | — |

`node scripts/freefall-sim.mjs [seeds]` — 2,000 seeds a bot, solo + match (≈ 20 s). THE TARGETS (the owner's): SLOPPY ≈ 20–50 floors ·
GOOD 120+ · GREAT on floor 200 in ≈ 2:30, most runs · a normal player never meets the darkness · a staller is caught within ~15–25 s.

**The final table (F1 — 2,000 seeds a bot; BOUNCE 36 · FALL 18 · the darkness 4 s / 2.5 s / 6):**

| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | out right after a shatter | the longest stay on a floor | TERMINAL | bounces a floor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 47 (20–77) | 0:36 (0:14–1:01) | 0.1 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 53.3 % | 5.1 s | 0.0 % | 0.77 |
| solo | good | 134 (83–160) | 1:40 (0:59–2:04) | 67.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 6.8 % | 2.7 s | 0.4 % | 0.75 |
| solo | great | 247 (168–418) | 3:17 (2:03–5:47) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 98.8 % · 0.0 % · 0.0 % · 0.0 % | 3.5 % | 2.1 s | 1.0 % | 0.84 |
| solo | human | 149 (99–182) | 1:56 (1:12–2:28) | 80.3 % | 2.8 % | 2:44 (2:37–2:55) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 5.3 % | 2.1 s | 0.1 % | 0.81 |
| match | sloppy | 47 (20–77) | 0:36 (0:14–1:01) | 0.1 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 53.3 % | 5.1 s | 0.0 % | 0.77 |
| match | good | 134 (83–160) | 1:40 (0:59–2:04) | 67.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.1 % · 0.0 % | 6.8 % | 2.7 s | 0.4 % | 0.75 |
| match | great | 200 (168–200) | 2:30 (2:03–2:40) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 23.8 % · 0.0 % · 76.2 % · 0.0 % | 1.3 % | 2.1 s | 1.0 % | 0.76 |
| match | human | 149 (99–182) | 1:56 (1:12–2:28) | 80.3 % | 2.8 % | 2:44 (2:37–2:55) | 97.2 % · 0.0 % · 2.8 % · 0.1 % | 5.1 % | 2.1 s | 0.1 % | 0.81 |

(solo great: 24 of its 2,000 runs were still falling at floor 600, where the sim stops them.) THE STALLER (no input): the darkness takes
2,000 of 2,000 runs at 19.0 s. No bot run ends in the dark; the longest any bot stays on one floor is 5.1 s of the 15 s the darkness
needs. TERMINAL VELOCITY is a DARING player's feat: the careful bots almost never get it, the GREAT bot that dares gaps within 900
units earns it in half its runs (and reaches floor 200 in ≈ 2:05). **The sims' find for the owner:** 53 % of the SLOPPY runs end on
the landing RIGHT AFTER A SHATTER (THE BLAZE's own drop — outside every fairness rule: the pass log's OPEN FOR BEN). What changed from the first numbers, and why:
`docs/games/passes/freefall-f1.md` "THE TUNING". `tests/freefall-sim.test.mjs` = the FAST version (200 seeds) asserting the bands — a
future tuning slip goes red there.

## THE LAB — https://neonspeakeasy.com/freefall-lab (`freefall-lab.html` · `js/games/freefall/lab.js` + `graybox.js` · `css/freefall-lab.css`, prefix `ff-`)
Unlisted (noindex, linked from nowhere), OPEN (no gate) — **it NEVER counts**: the run is the pure engine in the tab; no request but the
page's own static files + three.js 0.160 from its CDN (HIGH RISE's import map), nothing stored. (On a phone the site's service worker
already controls, `sw.js` itself asks `/api/time` at a navigation — ONE DEPLOY AT A TIME; not the page's code, nothing of the run in it.)
**Deleted at the go-live** (as HIGH RISE's lab was).
- **THE GRAYBOX** (no art, no sounds): the pillar, ring floors of 12 slices (the gaps open, RED clearly red, two greys so the slices
  read apart), the ball at the front with its shadow on the slice under it (orange while THE BLAZE is lit). A floor the ball has passed
  is gone; a slice the blaze broke is gone. **RED is never red by colour alone**: a red slice stands PROUD of the floor (a taller block —
  its brightness is the greys': F2's look must keep a shape or a mark). THE CAMERA (`graybox.js#CAM`: a 46° lens, 33° down) looks down the shaft from in front of
  the ball: the ball's floor 34 % down the screen, 4 floors in sight below it — on every size (a wider screen is framed as the phone's
  column). At 390 × 844 the ball is 48 pt across (a slice is 59 pt wide where it rides — the ball's CENTRE decides, so a ball one unit
  inside a gap still hangs 40 % over its neighbour: F2's look). THE DARKNESS, plain: the screen's EDGES close in as it comes nearer —
  never over the ball or its floor — and the HUD's line turns red from 2 floors off.
- **THE DRAG:** anywhere on the screen; 1 : 1 — the ring under the ball moves exactly as far as the finger (`pxPerRad`: 112 px a
  radian at 390 wide — a quarter turn = 176 px, a full-width drag = 0.55 of a turn); each move at its own event time (the coalesced
  samples too), in the angle the next frame draws. **MAX SPIN at this scale = a finger at 1,763 px a second** (1,417 at 375 wide,
  1,944 at 430): a harder flick is held back, then caught up tick by tick (a 150 px flick: 2 frames; the page owes at most 8 ticks —
  0.13 s — the rest of a wilder flick is dropped). The end card says how many ticks it held ("max spin held n ticks").
  A desk: the mouse drags, ← / → spin.
- **THE HUD** (plain text): FLOOR · `CLEAN n · BLAZE ON / — · DARK n` · the area's name + the mode's clock. It ends above the ball's
  highest point on every phone. After a run: the end's words, FLOOR + the area, the bounces / blazes / the best no-bounce run, RESTART,
  and **REPLAY = LIVE ✓** — the recorded log replayed through a FRESH engine event by event, and judged by `judgeRun` (a red line + the
  first differing tick if it ever differs).
- `?seed=` (the same tower every restart) · `?mode=solo|match` · `?fps=1` · RESTART (the top-right corner, always; + the end card's).
  The mode switch + the seed are off the screen while a run is live (a thumb at the foot is a drag). Hiding the tab = no pause: the
  darkness ends the run.

## THE RULE-SET TABLE (`tuning.js` — HIGH RISE's `rules.js` pattern)
Every rule number lives in ONE row per rule set — `RULE_SETS` (made by `makeRuleSet`, frozen, its derived `reach` + `hop` worked out).
Today's only row: **`classic`**. A later tuning = a NEW row; every run ever recorded still replays on the row it was played on.
- the names in `tuning.js` (`BOUNCE`, `FALL`, `DARK`, `GEN` …) only READ the classic row for the views, the sims + the tests.
- **The engine, the tower + the judge read the run's own row** (`run.R`): `createRun({ seed, mode, rules })` takes a row's id — or a
  row a sim made itself (`makeRuleSet`: a what-if run; `isRuleRow`). `resultOf(run).rules` names it.
- **The judge refuses a set it does not know** (`why: 'rules'`) — and only ever takes an ID THE TABLE holds, never a row object.

## THE FILE MAP + THE TESTS
```
freefall-lab.html  css/freefall-lab.css             THE LAB + its HUD (prefix ff-; self-contained: no tokens, no web font)
js/games/freefall/tuning.js                         THE RULE-SET TABLE + the classic row by name (pure, imports nothing)
js/games/freefall/tower-gen.js                      THE TOWER: buildFloor + the angle maths + the fairness checks it builds by (pure)
js/games/freefall/engine.js logic.js replay.js      THE RULES (pure — the phone AND the server): the step · the words, the seed, the areas, the ranking · the replay, the judge, the packed log
js/games/freefall/bot.js                            the sim bots          scripts/freefall-sim.mjs   the 2,000-seed table
js/games/freefall/lab.js graybox.js                 THE LAB's page · its three.js graybox
api/_lib/freefall.js                                THE JUDGE's server half (pure, NOT wired)
tests/freefall-engine.test.mjs (19) · freefall-tower.test.mjs (8) · freefall-server.test.mjs (7) · freefall-sim.test.mjs (6) · freefall-lab.test.mjs (5 — the static half)
tests/integration/freefall-lab.mjs (57 — the browser: real drags at 390 × 844 + 375 × 667 · 430 × 932 · 1440 × 900; scripts/serve.mjs is enough) · kit/page-loads.mjs (/freefall-lab)
```

## COMING
F2: the look (the neon tower, the areas) + SOLO on a test page · then the cards, the cartridge + the proof node (F4), the match, the
daily. Open questions for the owner: `docs/games/passes/freefall-f1.md` "OPEN FOR BEN".
