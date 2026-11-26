# FREEFALL (id `freefall`) — the falling-ball game

**BEING BUILT — NOT REGISTERED, invisible to players.** F1 (Nov 25 2026): THE RULES — the engine, the replay + the judge (its server
half), the bot sims + the tuned numbers, and a graybox on the live site: the unlisted lab **https://neonspeakeasy.com/freefall-lab**
(NEVER counts; deleted at the go-live, as HIGH RISE's was). **F2 (Nov 26 2026): THE NIGHT LOOK + SOLO + THE SOUNDS on the unlisted test
page https://neonspeakeasy.com/freefall-play** (NOTHING COUNTS until go-live) + three rules fixes (the landing after a shatter, MOVING
RED in THE TRENCH, THE HOLD). A glowing ball falls down a neon tower; the player drags left / right
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
| F2 — THE NIGHT LOOK + SOLO + THE SOUNDS | Nov 26 2026 | `docs/games/passes/freefall-f2.md` | the rules fixes (the landing after a shatter = a bounce · MOVING RED in THE TRENCH · THE HOLD), the assets, THE TEST PAGE (/freefall-play) + solo, THE OPENING, THE NIGHT LOOK, THE BLAZE = NEON FIRE, YOUR BEST, the sounds, the end screen |

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
  TERMINAL VELOCITY. **THE LANDING RIGHT AFTER A SHATTER IS NEVER AN OUT (F2 — the owner's rule b):** red there = a BOUNCE (the
  event `bounce { red: true }`: the view's red flash + the cracked slice); the clean count resets as for any bounce; only that ONE
  landing is spared — the next landing on red is out (`tuning.js` `shatterSafe`; `run.saves` counts them).
- **MOVING RED (F2 — THE TRENCH only, solo: floors ≥ 201):** up to TWO red slices a floor walk back and forth along their own track,
  one slice every 45 ticks — "THE TOWER", below. A landing reads the slice AT ITS OWN TICK.
- **THE HOLD (F2 — SOLO only, 3 a run; HIGH RISE's):** hiding the page / locking the phone HOLDS the run — a logged event the judge
  replays; back = a 3 · 2 · 1, then on. A match and the daily never hold — "THE HOLD", below.
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
| THE BLAZE | `blaze` 3 clean floors · `shatterSafe` true (F2: the landing right after a shatter is a bounce, never an out) |
| MOVING RED (F2 — THE TRENCH) | `gen.move` { from 201 · pace 45 ticks a slice (0.75 s) · max 4 slices a track · chance 154 / 256 of a first-lap floor + 51 a lap · two 3 (from the third lap two reds move) } |
| THE HOLD (F2) | `modes.solo.holds` 3 · match + daily 0 |
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
  from floor 160. The landing after a SHATTER (the blaze drops the ball through solid ground) is covered by THE RULES since F2: it is
  never an out.
- **NO ISLAND** (the builder's addition): from every safe slice a gap can be reached by human-paced hops — no stretch of safe slices is
  walled in by red runs too long (> 3 slices) to cross inside one bounce. Nobody is ever left bouncing for the darkness.
- **floor 0:** the slice under the ball at the start (A = 0) is SAFE — a run never starts by falling.
- difficulty ramps by layout only: 2-slice gaps → 1-slice gaps (a 1-slice gap is 0.35 wide where the ball rides, the ball 0.28 — the
  graybox's numbers), fewer gaps, more red, red hugging the gaps; THE TRENCH adds red + hug each lap (it tops out at 8 red, every gap
  hugged, from about its 4th lap).
- **floors 0–200 are F1's, bit for bit** (F2's proof — `tests/freefall-tower.test.mjs`: the digest of 300 towers' twists, gaps + red,
  taken on F1's last commit): a match + the daily never see a change.
- **MOVING RED (F2 — THE TRENCH, floors ≥ 201; `moversInto` · `moverSlice` · `moversAt` · `kindAtTick` · `trackOf`):** a trench floor has
  up to TWO red slices that MOVE — 60 % of the first lap's floors have one, 80 % of the second's, every floor from the third (where two
  move on 55 %). A mover walks back and forth along its own TRACK (2–4 solid slices side by side), one slice every 45 ticks; its slice
  is a PURE FUNCTION of (seed, floor, tick) (`moverSlice(m, tick)` — a mover is ONE integer: its track's first slice | its length << 4
  | its phase << 8; the floor record's `m1` · `m2`, 0 = none). FAIR BY CONSTRUCTION at EVERY stand of every mover (each is checked
  while the floor is built; proved from the outside over 83,200 trench floors — 225,322 stands): a track never holds a slice STRAIGHT
  BELOW A GAP of the floor above (twists counted, angle by angle: a ball through a gap never lands on moving red, at whatever tick it
  falls) · wherever the movers stand the floor has ≥ 3 safe slices, red ≤ 8, THE FALL WINDOW + NO ISLAND hold · a mover only ever
  steps to the slice NEXT to it (the view warns on that slice — red hatching that blinks — for the whole stand) · two tracks never
  share a slice. A track takes AT MOST ONE static red slice (it is un-laid: it is the one that moves now) — the first design let a
  track swallow up to four and made the trench EASIER (the sims said so). The static red OUTSIDE a track is F1's.

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
  bestRun, moves, feats: { reachedHarbor, terminal, reachedBottom } }` (+ `holds` when the run was held — F2).
- **`hold(run, T, ev?)` (F2 — THE HOLD, HIGH RISE's):** a LOGGED event `{ k: 'hold', t: T }`. T is a PLAY tick (the time away + the
  3 · 2 · 1 never were run time): every landing BEFORE T happens, then **the ball's flight STARTS OVER at T** (a bounce's next landing
  = T + 36, a fall's = T + 18) and THE DARKNESS waits exactly as long — the player comes back to a whole flight, never to a landing a
  blink away. A floor already passed never changes; the next move counts at T + 1 at the earliest. → false (refused): no hold left in
  this mode (`modes.<mode>.holds`: solo 3, match + daily 0), the run over, a tick the run was already stepped to, a move already
  counted after T, T at / past THE CAP. What a hold gives back = the ticks of the flight it restarts (≤ 36): three holds can not move
  the darkness by more than 108 ticks. `logOf(run)` puts the holds in their place (a move at a hold's own tick comes before it).
- **THE EVENTS** (`ev`, for the VIEW — each with its tick `t`): `land { floor, slice, kind }` · `bounce { floor, slice }` ·
  `shatter { floor, slice, red }` · `fall { floor, clean }` · `blaze { floor }` · `area { id, floor }` · `dark { floor }` ·
  `out { cause }` · `made` · `cap`. A landing's own events come together, in order: `land` → `bounce` | `out` | (`shatter` →) `fall` →
  `blaze` → `area` → `dark` → `made`. (`fall.floor` / `blaze.floor` / `area.floor` = the floors passed after it.) F2: `bounce.red`
  (true only on the landing right after a shatter that came down on red — saved) · `hold { t }`.

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
| `too many holds` (F2) | more holds than the mode has (solo 3 — a match / the daily: any hold) |
| `hold` (F2) | a hold the engine did not take as written (a tick the run already stood at, …); a hold that is not `{ k: 'hold', t: a whole tick ≥ 0 }` = `entry`; before the event before it — or a move at / before a hold's tick — = `ticks not rising` |

The cheap bounds (`logProblem`) only NAME what the engine's own `turn()` never logs: the judge then replays the log through `turn()`
and refuses any entry the engine did not take exactly as written (its tick, its angle).

**THE PACKED LOG** (`packLog` / `packRun` / `unpackLog` — F4's run node): entry after entry, no separator — `[ '.' + the ticks since the
entry before, base 36 ]` (left out when it is 1: a drag logs tick after tick; the first entry counts from tick −1) + `'+'` | `'-'` + the
units turned (base 36, the SHORTEST way). `".c+2r+1k-3.a-z"` = tick 11: +99 · tick 12: +56 · tick 13: −3 · tick 23: −35. CANONICAL —
`packLog(unpackLog(s)) === s`, nothing else unpacks; a string longer than any log packs to is refused unread; the reader is one
hand-written pass (no regex over an unbounded string). A bot's log: ≈ 3.2 characters an entry, 12–17 entries a second — a great bot's
whole match ≈ 5.7 KB (the most seen: 8.4 KB); the hard ceiling of a 3:00 match is 10,800 entries. **A HOLD (F2)** = `!` + the ticks
since the event before (base 36; `!0` = at the tick of the move before it): `".c+2r!0+1!8!1"` = tick 11: +99 · a hold at tick 11 ·
tick 12: +1 · holds at ticks 20 + 21. Still canonical.

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

**F1's table (2,000 seeds a bot; BOUNCE 36 · FALL 18 · the darkness 4 s / 2.5 s / 6 — BEFORE F2's rules fixes; F2's table: "THE SIMS — F2", below):**

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

### THE SIMS — F2 (the rules fixes; `docs/games/passes/freefall-f2.md` "THE SIMS PROOF")
**THE PROOF, floors 0–199 did not move:** the tower's floors 0–200 are F1's bit for bit (digest `01feecfdacd61711`), and on a row
WITHOUT the shatter rule every bot run of F1 replays TICK FOR TICK (match · daily · solo down to floor 200 — the digests taken on
F1's last commit, 639f7fca, before any rule changed); MOVING RED touches no run above floor 201. The ONLY thing that moves a run on
floors 0–199 is the shatter rule itself. Pinned: `tests/freefall-tower.test.mjs` + `tests/freefall-sim.test.mjs`.

**F2's table (`node scripts/freefall-sim.mjs 2000`):**

| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | saved by the shatter rule (runs · a run) | the longest stay on a floor | TERMINAL | bounces a floor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 62 (40–94) | 0:48 (0:30–1:17) | 0.7 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 51.6 % · 0.74 | 5.1 s | 0.0 % | 0.80 |
| solo | good | 136 (88–160) | 1:41 (1:03–2:05) | 69.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 3.7 % · 0.04 | 2.7 s | 0.4 % | 0.75 |
| solo | great | 245 (168–355) | 3:13 (2:03–4:42) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 99.8 % · 0.0 % · 0.0 % · 0.0 % | 1.3 % · 0.01 | 2.1 s | 1.1 % | 0.80 |
| solo | human | 149 (101–183) | 1:57 (1:14–2:29) | 81.1 % | 3.0 % | 2:44 (2:37–2:55) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 1.9 % · 0.02 | 2.1 s | 0.1 % | 0.81 |
| match | sloppy | 62 (40–94) | 0:48 (0:30–1:17) | 0.7 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 51.6 % · 0.74 | 5.1 s | 0.0 % | 0.80 |
| match | good | 136 (88–160) | 1:41 (1:03–2:05) | 69.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.1 % · 0.0 % | 3.7 % · 0.04 | 2.7 s | 0.4 % | 0.75 |
| match | great | 200 (168–200) | 2:30 (2:03–2:40) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 23.8 % · 0.0 % · 76.2 % · 0.0 % | 0.0 % · 0.00 | 2.1 s | 1.0 % | 0.76 |
| match | human | 149 (101–183) | 1:57 (1:14–2:29) | 81.1 % | 3.0 % | 2:44 (2:37–2:55) | 97.0 % · 0.0 % · 3.0 % · 0.1 % | 1.7 % · 0.02 | 2.1 s | 0.1 % | 0.81 |

THE STALLER: 2,000 of 2,000 at 19.0 s (unchanged). **The shatter rule moved** SLOPPY 47 → 62 floors (it saves 52 % of its runs at
least once) — now OVER the owner's 20–50 band (floors 0–199 were not to be touched: named, not tuned — the pass log's OPEN FOR BEN);
GOOD 134 → 136; GREAT in a match is unchanged to the digit. **THE TRENCH (solo, the GREAT bot):** floor 245 (168–355) — F1 247
(168–418): the deepest tenth 63 floors shallower, the runs still falling at floor 600 down from 1.2 % to 0.15 %. The bots keep off the
slice a mover stands on and — the careful ones — the slice it is stepping to (`bot.js#planFlight`).

## THE TEST PAGE — https://neonspeakeasy.com/freefall-play (F2 — `freefall-play.html` · `js/games/freefall/play.js` + `stage.js` · `css/freefall-play.css`, prefix `ff-`)
The real game's night look + SOLO, on the live site, on a phone: the owner tests on cellular, his brother from a shared link. HIGH
RISE's pattern (`docs/highrise.md` "THE TEST PAGE"): the run loop is `stage.js` — ONE module the page mounts today and F4's cartridge
will mount; `play.js` = the page itself (THE DOOR, its `?…` flags, its best, `createStage(app, { page: true, … })`).
**UNLISTED** (noindex nofollow; no page, no script, no manifest names it), **OPEN** (no gate, no sign-in).
`?seed=` (the same tower every run) · `?mode=match|daily` (their finish + cap, NO hold; the page itself is SOLO) · `?floor=N` (THE LOOK
CHECK: the first drag plays N floors at once through the real engine, the run goes on LIVE from floor N — THE OFFICES 40, THE SPEAKEASY
80, UNDER THE HARBOR 120, THE DEEP 160, THE TRENCH's moving red from 201; REPLAY = LIVE holds; never YOUR BEST) · `?fps=1` (the frame
rate + HITCH n: the frames over 33 ms in the run) · `?tier=0|1|2` (pins a quality tier) · `?dpr=` (a cap on the sharpness).
- **NOTHING COUNTS UNTIL GO-LIVE (the owner, Nov 25):** no XP, no streak, no server best, no boards, no cards, no share card. The run
  is the pure engine in the tab: **ZERO server calls, ZERO database writes**; the page's whole module graph (static + lazy) holds
  nothing from `/api`, the profile, progression, the report, share, the cards, Firebase or the store (`tests/freefall-play.test.mjs`).
  Its only requests: its own static files (its modules, the four walls, JAYWALK's skyline, the flame atlas, the sounds), three.js
  from the import map's CDN, the fonts. Its only storage: `ff:play:best` (YOUR BEST — THIS PHONE).
- **THE DOOR (HIGH RISE's — `play.js`, before the stage mounts):** `fetch` + `sendBeacon` to `/api/…` stop before they leave the
  phone (the shared audio engine counts a leave once, site-wide; the skew wrapper may ask `/api/time`). Proven in the browser check:
  the page hidden with its sound on → 0 requests to `/api/`.
- **THE RUN** (`stage.js`): tick 0 = THE START — the FIRST DRAG (after ≤ 0.6 s for the sounds' decode: "THE SOUNDS"); the finger's
  moves before tick 0 are kept and turn the tower from tick 0. **FAIR INPUT:** a move counts at the tick of its own EVENT TIME
  (pointermove's `timeStamp`, every coalesced sample at its own) — 60 Hz and 120 Hz phones are equal. **THE DRAG IS 1 : 1 at F1's
  scale** (the owner's phone check: MAX SPIN unchanged): the ring under the ball moves as far as the finger — 112 px a radian at 390
  wide, a quarter turn = 176 px (the PLAY camera's number: the opening's camera never changes the drag); MAX SPIN's rest is offered
  again tick by tick (≤ 8 ticks owed). A desk: the mouse drags, ← / → spin. The moves BEFORE the landings (`settle`, then `stepTo`).
  **THE WHOLE PAGE is the drag's ground** (the dark bars beside the phone's column too); **a second finger never steals the drag**
  (a press while one is live is ignored); a press within 350 ms of a restart starts nothing (the tail of a double tap on PLAY AGAIN).
  **REPLAY = LIVE after every run — in the CONSOLE only** (`[freefall] REPLAY = LIVE ✓ …`: the log through a fresh engine, event by
  event, + `judgeRun`); `window.__ffPlay.ends` keeps the last 50.
- **THE OPENING = the live scene, no menu page** (the owner's plan): the rooftop by night (JAYWALK's night skyline behind), the
  camera high over the tower top (`night.js#POSE.open`), the ball resting on floor 0, the sign **FREE / FALL** stacked in neon tubes
  (FREE ultraviolet, FALL lime, slipped a step down-right, a blazing ball dropping past it — DOM text, its glow static, the ball's
  drop a transform), FALL AS DEEP AS YOU CAN, YOUR BEST at the top, at the foot the thumb-sweep hint + DRAG TO SPIN + THE ROOFTOP ·
  FLOOR 0. **The FIRST DRAG starts the run:** the logo + the hint fade (0.45 s), the camera sweeps down to the play camera (0.95 s).
  PLAY AGAIN comes back here (a new seed).
- **THE PLAY CAMERA** = F1's graybox camera (a 46° lens, 33° down; `night.js#CAM` — pinned equal to `graybox.js#CAM`): the ball's
  floor 34 % down the screen, 4 floors in sight below it — on every size (a wider screen is framed as the phone's column).
- **THE HUD** (DOM over the canvas; written only when it changes — ZERO GARBAGE in the frame): YOUR BEST at the top · **THE BIG
  NUMBER** (Orbitron 900, 78 px at 390; its glow BAKED — `bakedtext.js`, HIGH RISE's: the ten digits drawn with their glow once a
  style, a floor copies 1–3 bitmaps; the gold set is warmed behind the opening) · the area's name under it (it swells at an arrival)
  · THE ANNOUNCER (one call at a time, a bigger moment never wiped by a smaller: BLAZE! · SMASH! · CLOSE CALL (the saved landing) ·
  NEW BEST (gold)) · THE LIGHTS ARE GOING OUT (from 2 floors off — white on its own dark plate). The HUD ends above the ball's
  highest point on every phone. **THE SHADE** (`.ff-shade`: two static gradients, one opacity each): a dark fall behind the HUD's
  column while a run is on — its words never sit on a floor flying past — and a dark rise behind the opening's foot. A phone held
  SIDEWAYS (a 234 px column) gets a compact layout (`@media (max-height: 480px)`).
- **THE HOLD on the page (SOLO):** `visibilitychange` hidden → the run is stepped to now and HELD at the next free tick
  (`engine.js#hold`): PAUSED · n PAUSES LEFT. Back on screen: **3 · 2 · 1** (0.8 s each), then on from the hold's own tick — the ball
  at the start of the flight it restarts. Three a run; with none left (or `?mode=match`) the run goes on behind the hidden page —
  back from it only its END sounds. A hide before the first drag / on the end screen holds nothing. Hidden AGAIN during the 3 · 2 · 1:
  the count is dropped and runs whole when the page is back (never skipped); a run that goes LIVE behind a hidden page (the start
  waited for the sounds) is held at once.
- **YOUR BEST** (`best.js`, PURE — this phone's, `ff:play:best`): a GOLD TAPE round the rim of your best floor (`night.js#setBest` —
  in sight when you are within nine floors of it) + the line at the top. The fall that passes it = THE CROSSING, once a run: NEW
  BEST in the announcer, JAYWALK's new-best sound, the number turns gold. A first-ever run has no best: no tape, no line.
- **THE END SCREEN = JAYWALK's STANDARD** (`endscreen.js` — ONE builder for the page's card today and the cartridge's body in F4): the
  header **FREEFALL · SOLO** (FREE ultraviolet #c35bff · FALL lime #b8ff3b · the mode lavender — THE END NEON's shared classes; the
  card writes the colours itself until FREEFALL has its `metas.js` row) → the CAUSE in ultraviolet neon (HIT THE RED · THE LIGHTS
  WENT OUT · TIME'S UP; MADE IT TO THE BOTTOM in gold — **never red: red is danger on the tower and nothing else**) → THE FLOOR
  NUMBER huge + white, an ultraviolet glow → FLOORS → YOUR BEST · n in gold (NEW BEST · WAS n) → one line (n BOUNCES · n BLAZES ·
  BEST RUN n) → the table's slot (YOUR TABLE — F4) → the foot: **PLAY AGAIN** = one solid glowing bar in FREEFALL's accent (lime,
  dark ink, 62 pt, a rounded rectangle), then **SHARE · SOON** (a placeholder until F4) **| CITY** (→ `/`). The card comes 0.7 s after
  every end (the ball's last moment is seen); the HUD leaves at once. No pink flash (the page builds its own card), no pills.
- **THE LOST CONTEXT** (JAYWALK's lesson): `webglcontextlost` → the scene is REBUILT on the same run (the floors' broken + cracked
  slices adopted from the events — no effect played again) the moment the context is restored, or after 1.5 s; no context to be had:
  the line says so, the run goes on, the rebuild tries again (every 1.5 s × 8, and when the page is back in front).
- **Locally:** `http://localhost:5173/freefall-play` · `node tests/integration/freefall-play.mjs "<chromium>" [outDir] [--look] [--perf]`
  (74 checks at 390 × 844 + 375 × 667 · 430 × 932 · 1440 × 900 · 844 × 390; `--look` = the review's shots; `--perf` = the speed test). The page's
  hook for the checks: `window.__ffPlay` (`state()` · `auto` = the checks' own hand: 'gap' | 'play' | 'smash' | 'safe' | 'red' ·
  `hide()` / `show()` · `dive(n)` · `ends` · `events()` · `log()` · `lose()` = a context lost on purpose).

## THE NIGHT LOOK (F2 — `night.js` + `night-fx.js`; three.js 0.160 core only, its READABLE build — the bloom + the particles are ours)
A VIEW: it reads the run + its events; it never writes them; the rules never import it. The owner's mockup
(`Downloads\NEON\freefall\ff-night.png`) + the three prototype renders are the references; the review's shots: `Downloads\NEON\freefall-f2\`.
- **THE SLICES — ONE instanced mesh** (a wedge geometry: its top, its outer wall, its two cut sides; ≤ 144 instances — only the ten
  floors in sight, `BELOW` 9), written every frame into three typed arrays made once (`aI` its angle · its floor's height · how far it
  stands proud · its kind — `aC` its colour + alpha — `aF` a flash · the moving red's WARNING · cracked · a floor just passed flying
  out). The tower's turn is ONE uniform (`uSpin`). The shader: the top at full colour, brighter out at the rim · **THE NEON RIM** — a
  white-hot line along the outer edge + a halo in the slice's colour · a thin dark line along each cut (the slices read apart) ·
  darker walls · **THE DEPTH WALK**: the hue walks on with the depth under the ball (pink → violet → blue → teal) and dims — a gap two
  floors down never shows the same flat colour · the ball's light pooled on its own floor. A floor just passed lets go: its slices
  drift out + up as they fade (0.22 s). **THE DEPTH WALK = the owner's gradient ON ONE SCREEN** (the review): whatever the area's colour, the floors in sight
  walk on — violet two floors down, a saturated blue by four, teal at the foot — and stay saturated as they dim. The slabs are 0.2
  thick (packed discs, not a staircase); the pillar is lit (a soft light down its front, a violet rim), its cap flush with the
  ball's floor — the dark eye of the top ring — going down with the ball's own glide.
- **THE FLOORS' COLOURS by area** (`FLOOR_HEX` — the mockup's): THE ROOFTOP hot pink · THE OFFICES violet · THE SPEAKEASY magenta ·
  UNDER THE HARBOR blue · THE DEEP ultraviolet; THE TRENCH cycles four palettes a lap (`TRENCH_HEX`); two floors either side of a
  seam blend.
- **RED = DANGER, MORE THAN A COLOUR** (hsl 352 — and nothing else red anywhere: the skyline painting's red windows lean to pink in
  the shader): a red slice STANDS PROUD of the floor (`RISE` 0.1), dark hazard CHEVRONS run across it (their edges smoothed by their
  own width on the screen; its walls striped too), its rim is HOT RED — never the safe slices' white line —, it PULSES: readable
  with the colour removed (the greyscale shot). A red that MOVES wears a bright edge; the slice it steps to NEXT blinks red hatching for the whole stand, harder in its last
  0.3 s. The saved landing (rule b): a red flash + the slice CRACKED (dark cracks from its middle).
- **THE BALL**: a white-hot core (the hottest point IS its centre — the rules decide by the centre), a warm edge, a soft halo; 41 pt
  across at 390 wide (36 at 375 — smaller than the graybox's 48: less of it hangs over the neighbour). **THE MARK**: a hot point in
  a thin ring lies on the slice under the ball's centre — through a gap, on the floor below (dimmer): where it comes down reads at a
  glance. It squashes on a landing; a plain fall leaves a faint streak. HIT THE RED: it bursts (sparks); THE LIGHTS WENT OUT: a dead
  grey ball.
- **THE BLAZE = NEON FIRE** (the F2 add-on — the owner, Nov 26): ONE ramp for everything that burns — a WHITE core → YELLOW →
  ORANGE → NEON PINK outer flame (`night-fx.js FIRE_RAMP`); the white-yellow heart is the brightest thing on the screen and reads
  with the colour removed. **GPU flame SPRITES** (Kenney's Particle Pack, CC0 — only the four used: `assets/freefall/fx/blaze.webp`):
  a FIXED pool of 96 flown in their shader — each swells, swirls off its line (a curl of sines by its own seed), turns from flame to
  smoke, cools down the ramp (white only while it is small + new, orange through its middle age, a saturated neon pink for its last
  third); light that COVERS a little of what is behind it (pure added light summed every band to white — the review); shed where the
  ball has just been, so the fall leaves a billowing column that stays under the big number; **the tiers trim only the rate**
  (128 · 84 · 46 a second). + a **ribbon** trail mesh behind the ball in the same ramp · **embers** (gold + neon pink)
  drifting off it — no electric arcs · the ball itself burns on the ramp. **THE SHATTER**: real 3D shards of the slice fly LIT BY THE
  FIRE (gold glints, a pink rim), a burst of flame runs along the floor, the punch is a FIRE SHOCKWAVE ring (white-yellow at its
  inner lip, orange, neon pink outside), a short camera kick. The ball's UNLIT glow is as it was.
- **THE DARKNESS**: the wall above its line goes out (a thin live edge where it stands) + the screen's edges close in from above
  round a clear window where the ball is (`.ff-dark` — ONE opacity, written when the gap changes: (6 − the gap) / 5 — 6 floors off, its
  lead, = nothing). It NEVER
  dims the ball or its floor (the slices + the ball never read it).
- **THE SHAFT — THE AREAS' WALLS** (night only this pass; no area banners — F3): a screen-filling quad whose every pixel's ray meets
  a cylinder round the tower's axis (seen through its near side) and reads the area's painted wall there — seamless, world-anchored
  (it scrolls as the ball goes down). Two walls cross-fade BY DEPTH at the seam between two areas (the next area's wall is seen
  rising from below; the angle's own seam lies on the near side — never seen). THE ROOFTOP has no wall: the open night sky, stars, **JAYWALK's night skyline** on the horizon (it sinks out of
  sight over the first floors), the dark roof. **THE GLOW FROM BELOW**: pink at the shaft's foot, violet above it. Drawn into a
  HALF-RES target, then copied up (a wall is soft by nature); the top of the screen is the HUD's (the wall steps back there).
- **TIERS** (the match kit's `createTiers`, automatic): **2** = the device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM (HIGH RISE's:
  every material's `uBloom` pass on twin materials — a twin is BUILT from its material's pieces + the same uniforms, never cloned) · **1** = DPR ≤ 2, no bloom · **0** = DPR ≤ 1.5, fewer shards + sparks + flames.
  **THE WARM FRAME**: one of everything + one hidden frame behind the opening (23 programs built before the first drag). The
  pictures are decoded off the frame (`createImageBitmap`) and uploaded at once, a whole area ahead. The targets are let go while the
  page is hidden.
- **ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES — `tests/freefall-play.test.mjs`, a static scan of every frame function):** the
  frame's fractions live in ONE typed scratch array, the floors in sight in a ring of records written INTO (`tower-gen.js#floorInto`),
  the effects in pools, the wall's key is four numbers, the HUD's words are built only in the functions a CHANGE calls.
- **MEASURED** (`--perf` — the mini PC, 390 × 844 @3, the bot shattering through THE SPEAKEASY with the fire on): **60.0 fps at every
  tier at 1× and 4× CPU** (p95 ≤ 17.1 ms, no frame over 18.3 ms). A desktop GPU's numbers — the tiers are the phone's margin; the
  owner's iPhone: `?fps=1`.

## THE SOUNDS (F2 — `sounds.js` (the PURE table + the triggers) · `sfx.js` · `audition.js` (the SOUNDS list); the files: `audio/freefall/`)
HIGH RISE's player (`docs/highrise.md` "THE SOUNDS"): the bytes fetched early, decoded once at the unlock, each sound a buffer source →
its gain → a soft limiter → the console's SFX bus; 8 voices by priority from a pool; an effect asks `isUnlocked()`, never the
context's state; the MP3's lead-in skipped. Muted / locked / a missing file = nothing plays, nothing throws — the game works silently.
- **THE TRIGGERS** (`sounds.js#cuesOf` — PURE): **bounce** — every landing on solid ground, SOFT (gain ± 1.5 dB, never bent) ·
  **whoosh + THE NOTE UP ITS SCALE** — every clean fall through a gap: the bounce's one recorded note (C4) pitch-shifted in code, a
  step higher each clean floor in a row (do re mi so la do′ re′ mi′ — holding at the top), back to the first after a bounce ·
  **blaze** — THE BLAZE lights · **shatter** · the crash short + high + quiet = the CRACK of a saved landing · **crash** — out on red
  · **lights-out** — out in the dark · **bottom** — THE FINISH (ready for F3; in the list, not in a solo run) · **area-arrive**
  (JAYWALK's file) on entering an area · **new-best** (JAYWALK's) at the crossing. A batch that came back from a hidden page (a match:
  no hold) sounds only its END.
- **THE SOUND SYNC from the start** (HIGH RISE's): a live run holds the audio context awake (a lease renewed once a second —
  `globalThis.__nsHoldAwake`), let go on the end card, on a hold, on a hide; the START waits ≤ 0.6 s for every decode (0 late sounds in
  a run: the check asserts it). A landing's sound is asked in the frame that steps it (a landing is the engine's, not a touch's).
- **THE MUSIC** = the site's mood stations (the evening deck by night — `sounds.js#MUSIC`, for F4's cartridge: the console plays it).
  The test page plays none (as HIGH RISE's).
- **THE SOUNDS LIST** (the SOUNDS button, top left between runs → THE SHEET): every sound, one PLAY each (the note: a bounce, then up
  its scale). Nothing to choose — the owner picked take A of each.
- The levels are a FIRST MIX (the delivery is loudness-matched to ≈ −16 LUFS; the gains set each sound's place: the bounce soft, the
  two ends the loudest). A sound replaced: bump `sfx.js#FF_SFX_REV`; a picture: `night.js#FF_ART_REV`; then `node scripts/build-file-hashes.mjs`.

## THE ASSETS (F2 — `python -P -E scripts/build-freefall-assets.py [--only=walls,sfx,fx]` COPIES the owner's delivery; Downloads\grok\freefall is only read)
- `assets/freefall/walls/<area>-night.webp` — the four NIGHT walls (Grok Imagine; offices · speakeasy · harbor · deep): 1024 × 1024 (a
  box average of the delivery's 2× upscale), WebP q 80, **157 KB** together; the wrap is measured after the resize — a wall that no
  longer wraps fails the build. The day walls are F3's.
- `assets/freefall/fx/blaze.webp` — THE BLAZE's four sprites (Kenney's Particle Pack, CC0), one grey atlas 1024 × 256: **9 KB**.
- `audio/freefall/` — the owner's seven picks (take A): bounce · whoosh · blaze · shatter · crash · lights-out · bottom — byte copies
  (MP3 already), **168 KB** + `CREDITS.md` (every source CC0 1.0, each layer named).
- REUSED, no copy: JAYWALK's `assets/jaywalk/skyline-night.webp` (THE ROOFTOP) + `audio/jaywalk/area-arrive.mp3` · `new-best.mp3`.
  (HIGH RISE's reflection map is not used: FREEFALL's slices are lit neon, not glass.)

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
freefall-play.html  css/freefall-play.css           THE TEST PAGE (F2 — prefix ff-; the site's tokens + fonts, THE SHELL's sheet)
js/games/freefall/play.js stage.js                  the page (THE DOOR, its flags, its best) · THE STAGE (the run loop, the HUD, the opening, the hold, the end)
js/games/freefall/night.js night-fx.js              THE NIGHT LOOK: the scene · its shaders + the bloom      bakedtext.js   the baked big number
js/games/freefall/best.js endscreen.js              YOUR BEST (pure) · the end card (JAYWALK's standard)
js/games/freefall/sounds.js sfx.js audition.js      the sounds' table + triggers (pure) · the player · the SOUNDS list
assets/freefall/walls/ fx/  audio/freefall/         the four night walls · the flame atlas · the seven sounds      scripts/build-freefall-assets.py
freefall-lab.html  css/freefall-lab.css             THE LAB + its HUD (prefix ff-; self-contained: no tokens, no web font)
js/games/freefall/tuning.js                         THE RULE-SET TABLE + the classic row by name (pure, imports nothing)
js/games/freefall/tower-gen.js                      THE TOWER: buildFloor + the angle maths + the fairness checks it builds by (pure)
js/games/freefall/engine.js logic.js replay.js      THE RULES (pure — the phone AND the server): the step · the words, the seed, the areas, the ranking · the replay, the judge, the packed log
js/games/freefall/bot.js                            the sim bots          scripts/freefall-sim.mjs   the 2,000-seed table
js/games/freefall/lab.js graybox.js                 THE LAB's page · its three.js graybox
api/_lib/freefall.js                                THE JUDGE's server half (pure, NOT wired)
tests/freefall-engine.test.mjs (23) · freefall-tower.test.mjs (11) · freefall-server.test.mjs (8) · freefall-sim.test.mjs (8) · freefall-lab.test.mjs (5 — the static half) · freefall-play.test.mjs (10 — F2, static)
tests/integration/freefall-play.mjs (74 — F2, the browser: the test page; --look · --perf)
tests/integration/freefall-lab.mjs (57 — the browser: real drags at 390 × 844 + 375 × 667 · 430 × 932 · 1440 × 900; scripts/serve.mjs is enough) · kit/page-loads.mjs (/freefall-lab)
```

## COMING
F3: the day look, the area banners + the breakthroughs (the finish at THE BOTTOM) · then the cards, the cartridge + the proof node (F4 —
the judge wired, the run node chunked, THE HOLD's legs on the server's clock, SHARE), the match, the daily. Open questions for the
owner: `docs/games/passes/freefall-f2.md` "OPEN FOR BEN".
