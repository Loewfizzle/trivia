# FREEFALL (id `freefall`) — the falling-ball game

**BEING BUILT — NOT REGISTERED, invisible to players.** F1 (Nov 25 2026): THE RULES — the engine, the replay + the judge (its server
half), the bot sims + the tuned numbers, and a graybox on the live site: the unlisted lab **https://neonspeakeasy.com/freefall-lab**
(NEVER counts; deleted at the go-live, as HIGH RISE's was). **F2 (Nov 26 2026): THE NIGHT LOOK + SOLO + THE SOUNDS on the unlisted test
page https://neonspeakeasy.com/freefall-play** (NOTHING COUNTS until go-live) + three rules fixes (the landing after a shatter, MOVING
RED in THE TRENCH, THE HOLD). **F3 (Nov 26 2026): THE DAY LOOK (all five areas + THE TRENCH), THE AREA PALETTES, THE NEW OPENING
(title-05) + THE GLINT, THE ARRIVAL BANNERS, THE HOLD = EXACT RESUME**. **F3B (Nov 26 2026): THE ROOF BELOW (the title screen + floors
0–39), THE COLOUR FIXES + THE COLOUR RULE, THE DARKNESS EASES WITH DEPTH, THE BANNER under the number, PAUSED's blurred cover, THE
STUTTERS, and THE BREAKTHROUGHS (the skylight 40 · the splashdown 120 · THE BOTTOM 200 + the finish's hook)** — still the test page,
still nothing counts. A glowing ball falls down a neon tower; the player drags left / right
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
| F3 — THE DAY LOOK + THE AREA COLOURS + THE NEW OPENING | Nov 26 2026 | `docs/games/passes/freefall-f3.md` | F2's open calls (THE HOLD = EXACT RESUME · the ball's rim + dot · the fire twice as long · the accent = title-05's pink + teal), THE AREA PALETTES (depth-relative), the day walls + the title, THE OPENING (title-05) + THE GLINT, THE DAY LOOK, THE ARRIVAL BANNERS |
| F3B — THE ROOF BELOW + THE COLOUR FIXES + THE BREAKTHROUGHS | Nov 26 2026 | `docs/games/passes/freefall-f3b.md` | THE DARKNESS EASES WITH DEPTH (the rules) · THE ROOF BELOW · the colour fixes + THE COLOUR RULE · the banner under the number · PAUSED's cover · THE STUTTERS · the assets · THE SKYLIGHT (40) · THE SPLASHDOWN (120) · THE BOTTOM (200: solo cracks open · match + daily: the finish's moment + its hook) |

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
- **THE HOLD (F2 — SOLO only, 3 a run; HIGH RISE's) = EXACT RESUME (F3 — the owner):** hiding the page / locking the phone HOLDS the run — a
  logged event the judge replays: the WHOLE state is frozen at the hold's tick and resumed unchanged (the ball's flight + its height, the
  tower's angle, the darkness); nothing the finger does while PAUSED or in the 3 · 2 · 1 counts. A hold never cancels or restarts a
  landing. A match and the daily never hold — "THE HOLD = EXACT RESUME", below.
- **THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE (F3 — the owner, Nov 26: the numbers were 6 · 4 s · 2.5 s, a stopped ball had 15 s and
  nobody ever SAW the darkness):** a darkness falls down the shaft — it starts `LEAD` (**3**) floors above the ball, rests a grace
  (**3 s**), then comes one floor every **2 s**. It is never more than LEAD floors above the deepest floor the ball has reached (when the ball reaches floor f
  it moves down to at least f − LEAD, and its pace starts again from there). It only ever moves down. When it reaches the ball's floor
  → OUT (`dark`). A ball that stops moving has LEAD × the pace = **6 s**; a run nobody touches ends at **9.0 s**. It is always in
  sight ("THE DARKNESS — SEEN + HEARD", below). **IT EASES WITH DEPTH (F3B — the owner, Nov 26: he tested F3's darkness and loves it;
  the stall budget follows the layout's difficulty):** floors 0–100 EXACTLY as above (a floor every 2 s: 6 s stopped — whole ticks: the first floor whose pace moves is 102, 121 ticks), a straight
  line over floors 100–160, **a floor every 160 ticks from floor 160 on — 8 s stopped** (THE DEEP + THE TRENCH); the pace is the one
  AT THE BALL's FLOOR when a step is set (`tuning.js#darkPaceAt` — pure, integers; the judge replays it; no new rule-set row).
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
| THE DARKNESS (F3 — JAYWALK-style pressure · F3B — it eases with depth) | `dark` { grace **180** (3 s) · pace **120** (a floor every 2 s) · lead **3** · paceDeep **160** · easeFrom **100** · easeTo **160** } — `darkPaceAt(R, floor)`: 120 to floor 100 · 130 at 115 · 140 at 130 · 150 at 145 · 160 from 160 (a stopped ball: 6 s · 6.5 · 7 · 7.5 · 8 s) |
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
- **`hold(run, T, ev?)` — THE HOLD = EXACT RESUME (F3 — the owner, Nov 26; F2's hold restarted the ball's flight):** a LOGGED event
  `{ k: 'hold', t: T }`. T is a PLAY tick (the time away + the 3 · 2 · 1 never were run time): **everything up to AND AT T happens** (a
  landing due at T lands — on the angle the tower stood at; the darkness's step too), **then the whole state is frozen and resumed
  unchanged**: the flight (`fl` · `pl` · `nl` — its phase + its height), the tower's angle, the darkness (`dk` · `dn`). The ONLY thing a
  hold changes: the next move counts at T + 1 at the earliest (no input counts while the run is held). **A log with its holds taken out
  replays to the SAME run, event for event** — a hold never cancels or restarts a landing, and gives a staller nothing (out at tick
  1140 with three holds or none). → false (refused, nothing logged): no hold left in this mode (`modes.<mode>.holds`: solo 3, match +
  daily 0), the run over — or ended by what was due at T —, a tick the run was already stepped to, a move already counted after T, T at
  / past THE CAP. `logOf(run)` puts the holds in their place (a move at a hold's own tick comes before it). **PROVED**
  (`tests/freefall-engine.test.mjs`): a hold one, two or ten ticks before a red landing STILL ends on red at the same tick; a hold at
  the red landing's own tick is refused; 300 fuzz sessions live == replay == judge and == the same log without its holds. No new
  rule-set row: nothing was ever recorded.
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

### THE SIMS — F3B (THE DARKNESS EASES WITH DEPTH; `docs/games/passes/freefall-f3b.md`)
`node scripts/freefall-sim.mjs 2000` prints **F2's table to the digit** again (the pinned run digests of `tests/freefall-sim.test.mjs`
unmoved: every bot run tick-identical — the darkness never touched one) + a table BY DEPTH: **no bot run is out in the dark from
floor 100 down** (GOOD, GREAT, the human, SLOPPY: 0 of 2,000 each), and no stay on a floor ever uses its whole stall budget — GREAT +
the human ≤ 35 %, GOOD ≤ 45 %, **SLOPPY ≤ 85 %** (its 5.1 s of the 6 on a shallow floor; past floor 100 — 143 of its 2,000 runs get
there, none past 160 — its longest stay is 3.9 s of 6–7). The longest stays from floor 160 down: GOOD + GREAT + the human 2.1 s of
the 8. **A ball that stops is always caught:** lead × the pace at its floor after it got there — 6 s down to floor 100, 8 s from
160 (the unit tests: floors 60 … 262, live == the judge). THE STALLER from the start: 2,000 of 2,000 at 9.0 s, unchanged.

### THE SIMS — F3 (THE HOLD = EXACT RESUME + THE DARKNESS's new numbers; `docs/games/passes/freefall-f3.md`)
`node scripts/freefall-sim.mjs 2000` prints **F2's table to the digit** (below) — twice: after the hold's change (the bots never hold)
and after the darkness's (3 s · 2 s a floor · lead 3): **no bot run is caught by the dark** — GREAT 0.0 %, GOOD 0.0 %, the human
0.0 %, SLOPPY 0.0 % (its longest stay on one floor 5.1 s of the 6 a stopped ball has; the others ≤ 2.7 s) — and every bot run is
tick-identical (the pinned digests of `tests/freefall-sim.test.mjs` unmoved). THE STALLER: 2,000 of 2,000 at **9.0 s** (it was
19.0 s). A player who takes three bounces a floor (126 ticks) is slower than the darkness (120) and is caught in the end; two a
floor (90) stays ahead for ever.

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
`?seed=` (the same tower every run) · `?look=day|night` (F3: that look for this visit — without it AUTO: the phone's clock, then the
site's sun rule) · `?mode=match|daily` (their finish + cap, NO hold; the page itself is SOLO) · `?floor=N` (THE LOOK
CHECK: the first drag plays N floors at once through the real engine, the run goes on LIVE from floor N — THE OFFICES 40, THE SPEAKEASY
80, UNDER THE HARBOR 120, THE DEEP 160, THE TRENCH's moving red from 201; **F3B: `?floor=38` · `118` · `198` start just above a
BREAKTHROUGH** — add `&mode=match` to 198 for THE FINISH; REPLAY = LIVE holds; never YOUR BEST) · `?fps=1` (the frame
rate + HITCH n: the frames over 33 ms in the run — **F3B: + what landed before the last one**: `(last: pic · snd · band · tier · dom · frame  n ms @floor)`) · `?tier=0|1|2` (pins a quality tier) · `?dpr=` (a cap on the sharpness).
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
- **THE OPENING = the live scene, no menu page** (F3: **title-05**, the owner's pick — "THE OPENING + THE GLINT", below): the rooftop (by
  FREEFALL's own panorama behind — the night's or the day's), the camera high over the tower top (`night.js#POSE.open`), the ball
  resting on floor 0, Grok's lettering + its tagline over it, YOUR BEST at the top, at the foot the thumb-sweep hint + DRAG TO SPIN.
  **The FIRST DRAG starts the run:** the title + the hint fade (0.45 s), the camera sweeps down to the play camera (0.95 s). PLAY AGAIN
  comes back here (a new seed).
- **THE PLAY CAMERA** = F1's graybox camera (a 46° lens, 33° down; `night.js#CAM` — pinned equal to `graybox.js#CAM`): the ball's
  floor 34 % down the screen, 4 floors in sight below it — on every size (a wider screen is framed as the phone's column).
- **THE HUD** (DOM over the canvas; written only when it changes — ZERO GARBAGE in the frame): YOUR BEST at the top · **THE BIG
  NUMBER** (Orbitron 900, 78 px at 390; its glow BAKED — `bakedtext.js`, HIGH RISE's: the ten digits drawn with their glow once a
  style, a floor copies 1–3 bitmaps; the gold set is warmed behind the opening) · (F3: F2's small area name under it is GONE — THE
  ARRIVAL BANNERS name an area) · THE ANNOUNCER (one call at a time, a bigger moment never wiped by a smaller: BLAZE! · SMASH! · CLOSE CALL (the saved landing) ·
  NEW BEST (gold)) · THE LIGHTS ARE GOING OUT (from 2 floors off — white on its own dark plate). The HUD ends above the ball's
  highest point on every phone. **THE SHADE** (`.ff-shade`: two static gradients, one opacity each): a dark fall behind the HUD's
  column while a run is on — its words never sit on a floor flying past — and a dark rise behind the opening's foot. A phone held
  SIDEWAYS (a 234 px column) gets a compact layout (`@media (max-height: 480px)`).
- **THE HOLD on the page (SOLO):** `visibilitychange` hidden → the run is stepped to now and HELD at the next free tick
  (`engine.js#hold`): PAUSED · n PAUSES LEFT — **F3B (the owner): under a DARK, BLURRED COVER** (`.ff-hold`: the page's ONE backdrop
  blur, 18 px on 80 % dark, up only while the run is held — the tower can not be read while the clock stands; a browser without the
  blur gets a 95 % dark cover). Back on screen: **3 · 2 · 1** (0.8 s each), then on from the hold's own tick — **EXACTLY
  where it was (F3)**: the ball at the same point of its flight, the tower at the same angle; a drag while PAUSED or in the count turns
  nothing (the first move after GO counts). Three a run; with none left (or `?mode=match`) the run goes on behind the hidden page —
  back from it only its END sounds. A hide before the first drag / on the end screen holds nothing. Hidden AGAIN during the 3 · 2 · 1:
  the count is dropped and runs whole when the page is back (never skipped); a run that goes LIVE behind a hidden page (the start
  waited for the sounds) is held at once.
- **YOUR BEST** (`best.js`, PURE — this phone's, `ff:play:best`): a GOLD TAPE round the rim of your best floor (`night.js#setBest` —
  in sight when you are within nine floors of it) + the line at the top. The fall that passes it = THE CROSSING, once a run: NEW
  BEST in the announcer, JAYWALK's new-best sound, the number turns gold. A first-ever run has no best: no tape, no line.
- **THE FINISH's HOOK (F3B — match + daily: THE BOTTOM is their finish; the page only prepares it — `?mode=match`):** the run ends
  (`made`) at the tick the 200th floor is passed; the VIEW plays the ball's last drop onto the seabed + the moment ("THE BREAKTHROUGHS",
  below). **The run is handed on ONCE, AT THE `made` EVENT** (`stage.js#handOn` — the frame the run ends in, or the `hide()` that
  steps into it: a phone locked during the celebration still hands its run on; the fresh-eyes review):
  `createStage(app, { onFinish(finished, log) })` — `finished` = `{ seed, mode, floor, tick, look, same, judged }` + the input log
  (the server's judge replays it). Only the END CARD waits — `END_HOLD_MADE_MS` (2.6 s; every other end 0.7 s) — and adds the
  page's own two checks to the record (`same` = REPLAY = LIVE, `judged` = the judge's verdict on the log: both `null` until the
  card). **F4's cartridge wires the match / the daily there**; the test page keeps it for the checks (`__ffPlay.state().finished`).
- **THE END SCREEN = JAYWALK's STANDARD** (`endscreen.js` — ONE builder for the page's card today and the cartridge's body in F4): the
  header **FREEFALL · SOLO** (F3 — THE ACCENT = title-05's colours: FREE hot pink #ff4fa8 · FALL electric teal #27e0e6 · the mode a pale
  ice — THE END NEON's shared classes; the card writes the colours itself until FREEFALL has its `metas.js` row) → the CAUSE in teal
  neon (HIT THE RED · THE LIGHTS
  WENT OUT · TIME'S UP; MADE IT TO THE BOTTOM in gold — **never red: red is danger on the tower and nothing else**) → THE FLOOR
  NUMBER huge + white, a hot-pink glow → FLOORS → YOUR BEST · n in gold (NEW BEST · WAS n) → one line (n BOUNCES · n BLAZES ·
  BEST RUN n) → the table's slot (YOUR TABLE — F4) → the foot: **PLAY AGAIN** = one solid glowing bar in FREEFALL's accent (teal,
  dark ink, 62 pt, a rounded rectangle), then **SHARE · SOON** (a placeholder until F4) **| CITY** (→ `/`). The card comes 0.7 s after
  every end (the ball's last moment is seen); the HUD leaves at once. No pink flash (the page builds its own card), no pills.
- **THE LOST CONTEXT** (JAYWALK's lesson): `webglcontextlost` → the scene is REBUILT on the same run (the floors' broken + cracked
  slices adopted from the events — no effect played again) the moment the context is restored, or after 1.5 s; no context to be had:
  the line says so, the run goes on, the rebuild tries again (every 1.5 s × 8, and when the page is back in front).
- **Locally:** `http://localhost:5173/freefall-play` · `node tests/integration/freefall-play.mjs "<chromium>" [outDir] [--look] [--perf]`
  (**134 checks** at 390 × 844 + 375 × 667 · 430 × 932 · 1440 × 900 · 844 × 390 — they pin `look=night`: AUTO would follow the machine's
  clock; `--f3b` = F3B's 26 alone; `--look [--looks=night,day] [--scenes=opening,blaze,areas,banner,best,dark,hold,sizes,roof,breaks,colours,paused]`
  = the review's shots, both looks (`f3b-<look>-<nn>-<name>.png`); `--perf [--one=day-84-1-4]` = the speed test, both looks, + each
  breakthrough playing; `--stutters` = a whole run at 4× CPU, the long frames named, by area). The page's
  hook for the checks: `window.__ffPlay` (`state()` · `auto` = the checks' own hand: 'gap' | 'play' | 'smash' | 'safe' | 'red' ·
  `hide()` / `show()` · `dive(n)` · `ends` · `events()` · `log()` · `lose()` = a context lost on purpose · `setLook(l)` · `state().look` /
  `.banner` / `.info.motes` · F3B: `state().info.breaks` (each breakthrough's stage) / `.info.roof` / `.info.landed` · `.hitchLog` ·
  `.finished` · `.muffles`).

## THE NIGHT LOOK (F2 — `night.js` + `night-fx.js`; three.js 0.160 core only, its READABLE build — the bloom + the particles are ours)
A VIEW: it reads the run + its events; it never writes them; the rules never import it. The owner's mockup
(`Downloads\NEON\freefall\ff-night.png`) + the three prototype renders are the references; the review's shots: `Downloads\NEON\freefall-f2\`.
- **THE SLICES — ONE instanced mesh** (a wedge geometry: its top, its outer wall, its two cut sides; ≤ 144 instances — only the ten
  floors in sight, `BELOW` 9), written every frame into three typed arrays made once (`aI` its angle · its floor's height · how far it
  stands proud · its kind — `aC` its colour + alpha — `aF` a flash · the moving red's WARNING · cracked · a floor just passed flying
  out). The tower's turn is ONE uniform (`uSpin`). The shader: the top at full colour, brighter out at the rim · **THE NEON RIM** — a
  white-hot line along the outer edge + a halo in the slice's colour · a thin dark line along each cut (the slices read apart) ·
  darker walls · **F3: THE AREA PALETTES ARE DEPTH-RELATIVE** ("THE AREA PALETTES", below — F2's gradient on one screen is gone): a
  slice wears its OWN floor's colour + its area's rim colour; under the ball the tower only DIMS · the ball's light pooled on its own
  floor. A floor just passed lets go: its slices drift out + up as they fade (0.22 s). The slabs are 0.2 thick (packed discs, not a
  staircase); the pillar is lit (a soft light down its front, a violet rim), its cap flush with the ball's floor — the dark eye of the
  top ring — going down with the ball's own glide.
- **RED = DANGER, MORE THAN A COLOUR** (hsl 352 — and nothing else red anywhere: the skyline painting's red windows lean to pink in
  the shader): a red slice STANDS PROUD of the floor (`RISE` 0.1), dark hazard CHEVRONS run across it (their edges smoothed by their
  own width on the screen; its walls striped too), its rim is HOT RED — never the safe slices' white line —, it PULSES: readable
  with the colour removed (the greyscale shot). A red that MOVES wears a bright edge; the slice it steps to NEXT blinks red hatching for the whole stand, harder in its last
  0.3 s. The saved landing (rule b): a red flash + the slice CRACKED (dark cracks from its middle).
- **THE BALL**: a white-hot core (the hottest point IS its centre — the rules decide by the centre), **F3: a pink-white rim + a small white
  centre dot in a thin pink ring** (read through its own bloom), a soft halo; 41 pt
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
  inner lip, orange, neon pink outside), a short camera kick. **F3 (the owner): the flame column twice as long + a little wider** (a flame
  lives ≤ 0.82 s — `FLAME_LIFE`; the ribbon 2×): it reaches up behind the big number, which stays readable on top of it (the HUD's
  shade by night, its dark outline by day).
- **THE DARKNESS — SEEN + HEARD (F3: always in sight — it is never more than 3 floors above):** the wall above its line goes out (a
  thin live edge where it stands) + **a dark EDGE creeps down from the TOP of the screen IN STEP with it** (`.ff-dark`; the stage's
  `data-dark` = the floors it is above the ball, written at a step — one transform + one opacity): **3** = a faint edge at the very top
  (a calm run sees no more) · **2** = it has come down over the top of the screen · **1** = it is on the floor above: the edge down to
  above the ball's bounce + the screen's sides closing in round a clear window where the ball is; a soft line of light along the
  edge's foot (violet by night) makes each step read on a dark screen. It NEVER dims the ball or its floor (the slices + the ball
  never read it); the HUD lies on top of it. The warning (THE LIGHTS ARE GOING OUT) from the last floor. **THE RUMBLE** (`sfx.js#rumble`):
  the lights-out sound an octave down through a low-pass, looped softly — its own voice, a bed of the audio engine (leaving stops it
  at once) — swells from 2 floors off; the full lights-out sound only when the darkness catches the ball.
- **THE NIGHT WALLS v2 + THE GLOW EASED (F3 — the add-on, Nov 26):** THE OFFICES, UNDER THE HARBOR + THE DEEP wear walls relit from the
  approved day walls (the same file names); THE DEEP's repeats TWICE round the shaft (the others four times — its vents made a lattice);
  the pink / violet glow from below is EASED (`PANO.glow` 0.4 — it was 0.85 and washed every area into the same purple — and it starts
  deeper): each wall its own place, the floors + red the brightest things.
- **THE ROOFTOP = FREEFALL's OWN PANORAMA, AT FULL RESOLUTION (F3 — the add-on, Nov 26; JAYWALK's skyline is no longer used):**
  `assets/freefall/sky/rooftop-night.webp` · `rooftop-day.webp` (3072 × 1024, a 360° picture) drawn by a layer of its OWN in the main
  scene (`night-fx.js SKY_F` — never the half-res wall pass; mipmaps + anisotropy; it repeats on u; drawn only while the rooftop is on
  screen: the opening + floors 0–39; an opaque-pass mesh — three.js draws transparent meshes after the pillar + the ball), shown
  across 69° of the compass (`PANO.az`): a texel is 1.18 screen pixels on a 390-wide phone at 3× (1.30 at 430) — **the windows read as
  windows**; the city's horizon in the upper quarter of the opening, the buildings below it — ONE horizon height for both looks; it
  rises a little as the ball goes down; **under its foot: THE ROOF BELOW (F3B — its own section, below)**; a red light of the
  painting leans to pink (the guard). `?pano=0.5` turns it half a picture round (its join in the middle: the check shot).
- **THE SHAFT — THE AREAS' WALLS** (by night; by day: "THE DAY LOOK", below): a screen-filling quad whose every pixel's ray meets
  a cylinder round the tower's axis (seen through its near side) and reads the area's painted wall there — seamless, world-anchored
  (it scrolls as the ball goes down). Two walls cross-fade BY DEPTH at the seam between two areas (the next area's wall is seen
  rising from below; the angle's own seam lies on the near side — never seen). THE ROOFTOP has no wall: its panorama (above). **THE GLOW FROM BELOW**: pink at the shaft's foot, violet above it. Drawn into a
  HALF-RES target, then copied up (a wall is soft by nature); the top of the screen is the HUD's (the wall steps back there).
- **TIERS** (the match kit's `createTiers`, automatic): **2** = the device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM (HIGH RISE's:
  every material's `uBloom` pass on twin materials — a twin is BUILT from its material's pieces + the same uniforms, never cloned) · **1** = DPR ≤ 2, no bloom · **0** = DPR ≤ 1.5, fewer shards + sparks + flames.
  **THE WARM FRAME**: one of everything + one hidden frame behind the opening (F3B: 42 programs — the breakthroughs' pieces too, the
  picture's + the bloom pass's — built before the first drag). The pictures are decoded off the frame (`createImageBitmap`) and
  uploaded at once — **F3B: ALL of the look's, behind the opening ("THE STUTTERS", below)**. The targets are let go while the page is
  hidden.
- **ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES — `tests/freefall-play.test.mjs`, a static scan of every frame function):** the
  frame's fractions live in ONE typed scratch array, the floors in sight in a ring of records written INTO (`tower-gen.js#floorInto`),
  the effects in pools, the wall's key is four numbers, the HUD's words are built only in the functions a CHANGE calls.
- **MEASURED** (`--perf` — the mini PC, 390 × 844 @3, the bot shattering with the fire on — F3: BOTH LOOKS, by night THE SPEAKEASY, by day
  THE SPEAKEASY + UNDER THE HARBOR with the caustics + the bubbles): **60 fps at every tier at 1× and 4× CPU in both looks** (the
  pass log's table). A desktop GPU's numbers — the tiers are the phone's margin; the
  owner's iPhone: `?fps=1`.

## THE AREA PALETTES — DEPTH-RELATIVE (F3 — `palettes.js`, PURE; the owner, Nov 26: replaces F2's gradient on one screen)
A floor wears the colour of ITS OWN floor — its area's — never of its place on the screen. A palette = `{ a → b, rim, day, dayRim }`: the top
colour walks from a to b down the area's 40 floors, `rim` is its neon rim (+ the halo behind it), `day` the colour of its frosted glass
by day, `dayRim` its rim by day.
| area | by night | rim | **by day (the add-on, Nov 26: CLEARLY COLOURED — 35–55 % saturation on the faces)** | day rim |
| --- | --- | --- | --- | --- |
| THE ROOFTOP | hot pink → magenta | pink-white | soft pink-lavender (cool — never peach) | bright orchid |
| THE OFFICES | electric violet → blue | pale violet | **F3B: a lighter, whiter periwinkle** (`#b4c2f8` — it sat close to the blue glass wall) | brighter blue |
| THE SPEAKEASY | **F3B: BRASS GOLD — warm neon gold** (`#eb9a1c` → `#c97f16`; F3's rose + plum sat close to red) | brighter gold | **F3B: champagne gold `#f0d590`** (the owner's hex) | **brass `#e0a83a`** (the owner's hex) |
| UNDER THE HARBOR | teal → aqua | pale mint | **F3B: PEARL — ice-white glass, a faint aqua tint** (`#d0f5ef`, 15 % saturation: contrast by LIGHTNESS against the teal water; its seams the rim's cyan) | **bright cyan** |
| THE DEEP (+ THE BOTTOM) | dark indigo | glowing ultraviolet | soft indigo / lilac | bright violet |
| THE TRENCH | THE DEEP's, cycled a lap (40 floors): the dark body stays, the rim turns — ultraviolet · electric blue · magenta · mint | | lilac · soft blue · orchid · mint | |
**THE BORDERS:** the last three floors of an area lean to the next one's colour (¼ · ½ · ¾) — and the floors below the border ARE the
next area's: its colour shows under the ball as it comes to it (`night.js#colourOf`).
**THE COLOUR RULE (F3B — tightened; a unit test, `tests/freefall-play.test.mjs`): RED IS THE ONLY RED.** By NIGHT no palette colour lies
within 25° of hue 352 (unchanged). **BY DAY every colour — faces + rims, the trench's laps too — is ≥ 60° of hue from red, and red is
the darkest + the most saturated thing on a day floor** (every day face is lighter than red and far less saturated; no day rim is
darker). **THE ONE NAMED EXCEPTION: THE SPEAKEASY's gold** — the owner's own hexes are 51° (`#f0d590`) + 48° (`#e0a83a`) from red: brass
can not be 60° away and stay brass; it is held ≥ 45° (OPEN FOR BEN names it). The rooftop's day lavender + two rims moved a few degrees
to pass (`#dc8cea` · `#dc6ef4` · the trench's `#d65cee`). A red slice still stands proud, wears its chevrons + its own hot red rim, and
reads with the colour removed on every palette (the review's shots: each area's floor beside a red slice, both looks + greyscale —
`f3b-<look>-50-colour-<area>.png` · `-51-…-greyscale.png`). **ON GOLD FLOORS YOUR BEST's gold tape turns WHITE WITH A DARK EDGE** (both
looks — `palettes.js#GOLD_AREAS`, `night.js#tapeLook`, `TAPE_F uDark`). By day the harbor's caustic ripples stay ON THE WATER: the
slices keep a faint shimmer (0.12 — it was 0.5).

## THE DAY LOOK (F3 — `day-fx.js` + `night.js` / `night-fx.js`: ONE scene, a LOOK)
The owner's targets: `Downloads\NEON\freefall\ff-day.png` (UNDER THE HARBOR by day) + `freefall-mocks-day.jpg`. **ONE scene, both
looks:** every material carries `uDay` and takes its day half from `day-fx.js`; `night.js#setLook('day' | 'night')` turns it AT ONCE —
never a second scene, never a rebuild; the look's own pictures are named once and asked for only when that look is on.
- **THE LOOK SWITCH = the match kit's shared DAY / NIGHT** (`games/kit/look.js`; no switch of its own on the screen): F4's cartridge
  hands the console's GAME LOOK (`o.lookNow` — the host's AUTO · DAY · NIGHT; the stage reads it four times a second, a change turns
  the screen mid-run) · the test page: `?look=day|night` for a check, else **AUTO** — the phone's clock at once (day from 7 to 19),
  then the site's own sun rule (`sunUpNow`: `core/sky.js`, worked out on the phone — nothing asked of a server), again every minute.
  The stage's `data-look` + `data-area` follow the picture (the page's inks). **The same rules in both looks.**
- **THE FLOORS = FROSTED GLASS, CLEARLY COLOURED** (the owner's add-on, Nov 26 — never near-white ice everywhere): a slice's face IS its
  area's pastel (the palette's `day`), white only in the frost toward the rim, the highlights + the cyan-white seams; its rim a
  brighter version of the colour (`dayRim`); the lower floors fade into the area's haze and thin — five clearly different towers. **RED = the same red, the same chevrons + pulse**
  (dark stripes on white ice: very clear with the colour removed). The pillar = **brushed steel** (procedural: a bright band down its
  front, fine upright brushing, a dark teal cap — HIGH RISE's reflection map was not needed). The ball = **PINK (#ff50aa)** with the
  white rim + the centre dot, a soft shadow on its floor; THE MARK is a pink ring on the ice.
- **THE HUD by day:** the big number **PINK #ff3fa8 in a soft dark outline** (baked again in its day ink), YOUR BEST + the page's small
  words in NAVY with a pale halo on a light ground (THE ROOFTOP, UNDER THE HARBOR) and WHITE in a navy outline where the day's wall
  is dark (THE OFFICES' window grid, THE SPEAKEASY, THE DEEP, THE TRENCH — or once the darkness has closed in); no dark fall behind
  the HUD by day. The hold's scrim + the end card stay dark in both looks.
- **THE AREAS by day:** THE ROOFTOP = FREEFALL's own day panorama (above: a bright sky, clouds, the city, the bridge, the lighthouse), under it
  the open air the tower stands in — a pale haze, soft clouds drifting · THE OFFICES = sunlit glass + blinds, held down to a daylight blue, dust in the light · THE SPEAKEASY = brick,
  brass + amber lamps in a warm dusty haze · **UNDER THE HARBOR = ff-day.png**: the water's gradient #7fe3ea → #2bb5c9 → #0b6b8f →
  #063a5c down the screen, **SUN RAYS from the surface** (they stand in the WORLD — the wall's own angle + height — and drift; they die
  with the depth under the surface), **ANIMATED CAUSTICS in the shader** (on the wall + on the slices; `ff-caustics.png` is not used),
  rising **BUBBLES** · THE DEEP (+ THE TRENCH) = deep blue, a sunken wreck's warm lamps on the wall (breathing), drifting particles.
- **THE MOTES** (bubbles · drifting particles · dust): a FIXED pool of 48 quads flown in their shader — a mote's place is a pure
  function of the time, it stands in the world (wrapped round the camera), none in the sector in front of the ball; **the tiers draw
  48 · 32 · 18**; an area's kind fades out, the next in. Tier 0 keeps the caustics on the wall only.
- **THE DARKNESS by day** — the same line, the same timing, another look: **THE STORM CLOUD** over the rooftop (slate, rolling),
  indoors the lights go out, **THE MURK** under the water; the wall + the screen's edges only — never the ball or its floor.
- **BY DAY LIGHT COVERS** (`uCover` — the fire, the ribbon, the halo, the sparks, the shockwave: added light is lost on a bright
  ground). **THE BLAZE is the same fire** (the one ramp), thicker + a shade cooler by day so its orange + neon pink stand against the
  sky and the pale water round the white-yellow heart; the bloom is held at 0.4 (only the ball + the fire give light).
- THE TIERS, THE WARM FRAME, ZERO GARBAGE, THE LOST CONTEXT (rebuilt in the look on screen) are the night look's own — one scene.

## THE ROOF BELOW (F3B — `night.js#roofPlane` · the sky layer `night-fx.js SKY_F` · `breaks.js`; the owner: "the title screen and the first 40 floors are what most people see — they can't be the weak spot")
The building's own roof seen from high above, straight below the tower — Grok's top-down paintings (`assets/freefall/roof/below-night.webp`
· `below-day.webp`: the skylight + the pillar in the middle, the helipad, the AC units, the neon parapet; no red). Under the panorama's
foot — where F3 had a flat colour + the glow from below / the pale open air — there is now the roof, and the city round it.
- **ONE PLANE ALL THE WAY DOWN** (`roofPlane()`, once a frame — its matrix `roofM` + the sky layer's plane uniforms):
  **FAR** (the title screen … floor `ROOF.to` 34): the plane's centre lies on the camera's ray through the tower's top ring — the skylight
  sits straight under the tower ON THE SCREEN — and it leans toward the viewer (`ROOF.tilt` 40°: a flat roof seen from high above).
  **IT RISES TOWARD YOU FLOOR BY FLOOR:** its scale = how much of the painting the screen's width shows — `s0` **0.92** on the title screen
  + floor 0 → `s1` **0.4** by floor 34, by the same share each floor (you SEE yourself falling: first the city blocks in the margins, then
  the neon parapet sweeps out through them, then the deck's own things). Then **it has risen as far as the painting stays sharp** (made at
  1024, shipped at 1536: ≈ 2½ screen pixels a source texel on a 390-wide phone at 3× — **up to floor 34**. Over the LANDING, floors
  36 – 39, the true roof is ≈ 4 pixels a texel: the softest thing in the game by day (night hides it) — the deck's own SMOOTH grain
  + seams carry the close-up; a painting made at 2048 would end it: OPEN FOR BEN in the pass log).
  **LANDING** (floors 34 → `ROOF.land` 38.6): the plane settles into THE TRUE ROOF — level, at the skylight's own height (0.4 over floor
  40), the painting at the skylight's real size (`ROOF_WIDE` 10.15 world units) — and from there on it IS the world's roof, coming up in
  true perspective for the last floor.
- **THE CITY BETWEEN:** past the painting's own edge the city goes on — `roof/city-<look>.webp`, a tile cut from the SAME painting's four
  borders (repeated mirrored: no seam) — running off faster past the roof's far edge (`ROOF.curl`) up to the panorama's foot, where the
  two meet. **NO FOG WASH anywhere on the title screen or floors 0–39:** only a light distance haze far out (from 0.7 painting widths
  past the roof's middle); the night's glow from below + the day's open-air wash + its clouds are covered; the tower's own fade into haze
  is 0.2 of the other areas' on the rooftop (`FOG_K`).
- **THE 3D SKYLIGHT RIDES ON IT — SHARP AT EVERY DISTANCE:** the skylight's deck, frame + glass (real geometry — "THE BREAKTHROUGHS") are
  drawn through the same plane's matrix from the title screen on: a small glowing skylight far below at first, the very pane the ball
  breaks at the end. The deck (the painting again, at the same place + scale) brings ITS OWN DETAIL in as it comes close (the roofing's
  fine grain, a mottle, the seams between its sheets — procedural, sharp at any distance) and, by night, the neon tubes' light.
- **THE ROOF IS SHUT until the skylight breaks:** no floor from 40 down is drawn and the pillar ends where it goes into the roof; the
  offices' wall is not seen under the seam (`uOpen`). When it breaks the roof below fades (0.2 s) and the room shows.
- The numbers: `night.js#ROOF` (+ `ROOF_WIDE` · `ROOF_Y` · `FOG_K`). The skylight's place in the painting (`cx` 0.505 · `cy` 0.472 ·
  its frame's half size 0.130) is MEASURED by the build script in both paintings (`ROOF_SKY` — a unit test holds the two alike).

## THE BREAKTHROUGHS (F3B — `breaks.js` + `break-fx.js`; the owner's three: the skylight · the splashdown · THE BOTTOM — the chandelier at floor 80 is SKIPPED)
**A VIEW ONLY: the rules never change, the clock never stops, there is no slow motion.** Each phone plays its own as it reaches the floor.
The engine's `area` event carries the tick the ball LEAVES the floor above; a breakthrough's moment is due a fixed number of ticks later
on the run's own clock (the glass + the water 8 ticks on — `HIT_TICKS` —, the seabed a whole fall on) and is played ONCE when the clock
gets there. An event older than 1.5 s (a batch back from a hidden page), a `?floor=` start past it, a scene built again: it just
happened — nothing is played. The pieces are REAL 3D in the ONE scene, each drawn only while its floor is near; both looks.
- **A PANE THAT BREAKS = ONE instanced mesh of TRIANGLES** (`breaks.js#fractureGeo`): the 60 pieces it breaks into are laid out ONCE round
  the ball's own point of impact (the ball never turns: the point is always the same) — 12 rays, 3 rings, the pane's four corners among
  the rays (it is covered exactly). At rest they ARE the pane (one draw call). **THE CRACKS ARE DRAWN IN CODE along the very lines it
  breaks on** (a piece's own edges — its barycentric coordinates), racing out from the impact at 11 world units a second; then each piece
  lets go as the front reaches it and flies in the shader (its throw, its tumble, gravity — nothing is stepped on the CPU).
- **THE SKYLIGHT (floor 40 — the rooftop → the offices):** the roof's OWN skylight, on the roof's plane ("THE ROOF BELOW"): by night the
  lit room glowing warm through 6 × 6 frosted panes, by day blue glass mirroring the sky; a frame + glazing bars (instanced boxes).
  **The ball hits it:** a white burst at the impact, the cracks race out, the pane FRACTURES into real glass shards — the panorama
  mirrored in them (read soft), bright fresnel edges, a glint as they turn to the light — tumbling down with you; the glazing bars come
  down in pieces; a white flash on the floors' rims, a camera kick; **the office lights come on below, floor by floor**, each with a
  flicker (the wall shader: `uLitT`). **NIGHT: the frame is outlined in eight NEON TUBES** (cyan · magenta · violet) whose light lies on
  the deck; **the hit SHORTS them** — a shower of sparks (white-blue + orange) from all round the frame, the tubes flickering out one
  after the other round it; the shards catch the pink / violet neon. Sound: `skylight.mp3` at the hit.
- **THE SPLASHDOWN (floor 120 — the speakeasy → under the harbor):** the last speakeasy floors stand over **a real, NORMAL-MAPPED WATER
  PLANE** across the shaft (Water 001, two layers scrolling against each other) that MIRRORS what is over it: the area's own wall (the
  mirrored ray meets the shaft's cylinder — the speakeasy's lamps), the tower's lit rings + the ball (rippling streaks: by night the
  neon). **The ball plunges in:** a crown of drops (lit from above by night), spray + a ring of mist (sprites), **a ring wave** running
  out from the impact (in the water's own shader), a burst of bubbles; **THE WATERLINE** — a wavy line in screen space with a bright
  meniscus — sweeps up the screen in 0.5 s (the camera dips under): below it the plane is gone and the world under the surface shows;
  **the mix goes muffled** for 1.5 s (`sfx.js#muffle`: a low-pass after the limiter); **then the light shafts fade in** (by day the sun
  rays; by night soft teal + pink shafts of the speakeasy's neon falling through the surface). **NIGHT:** under the surface glowing
  **CYAN PLANKTON** swirl in the ball's wake for 3 s (no sparks); by day a trail of small bubbles. Sound: `splashdown.mp3` at the plunge.
- **THE BOTTOM (floor 200):** **a real seabed** (Ground 055 S: the sand's colour + normal map, lit from above; the tower's rim glow in
  a pool round its foot, the ball's own light; by day the water's caustics; nine boulders) rises into view from floor 195. **The
  impact:** a SHOCKWAVE RING of lifted sand + light runs out from under the ball, a dust cloud rolls out (sand-coloured, it covers;
  every cloud fades out ROUND — a sprite never shows its square), a camera kick, **the GOLD band "YOU HIT THE BOTTOM"** (the
  arrival's band, gold, with the impact — the wait is the FRAME's, `bedDue`: a ball that falls straight on through floor 200 still
  gets THE BOTTOM's band first, THE TRENCH's after it). **NIGHT:** glowing sediment drifts up out of the ring of light.
  **SOLO — THE TRENCH's MOUTH (the fresh-eyes review; a fairness rule of the VIEW):** the tower goes on down, so **the floor under
  the ball must be in sight before, on and after floor 200** — a whole bed hid floor 201 (the reviewer's probe: half of those blind
  landings ended on red, against 0 – 3 % with sight). The bed is therefore OPEN round the tower's foot and along **the cleft that
  runs from it toward the viewer** — everything the camera sees the lower floors through (`SEABED.mouth` 1.14 a side; the shaders'
  `mouth()`: a ragged edge, the sand darkening into it, the trench's light glowing up along its lip) — the seabed reads as a shelf
  of sand with a trench the tower stands in. The dust of the impact + the crack rises off the SHELVES beside + behind it (`shelf()`),
  never over the floors below; no rock lies in the mouth. The ball lands on floor 200 as on any floor (the rules'); when it leaves
  it **the seabed CRACKS OPEN** (the same pane-that-breaks: 60 pieces of sand-topped rock, each keeping its own bite of the mouth,
  the trench's light glowing up through the cracks) and the run falls on into THE TRENCH — endless, as before.
  **MATCH + DAILY: THE BOTTOM is their finish (MADE IT):** no floor 200 is drawn — the bed IS the floor and it is WHOLE (no mouth;
  five more rocks in front of the ball) —, the tower's core ends as a STUMP in the sand beside the ball (`STUMP` 0.36), the camera
  eases to THE FINISH's own pose (`POSE.finish`: the ball lower on the screen, the bed + what bursts over it in the picture's
  middle), the ball's last drop onto the bed is the view's own (the run is over: `night.js` carries its clock on), the same impact;
  **by night a FIREWORK-STYLE burst** of gold + cyan glowing stars (three, 0.3 s apart, ROUND THE BALL — each a ball of stars about
  1 across with a glint at its heart) + `fireworks.mp3` softly, 0.9 s after `bottom.mp3` (reduced motion: neither); the run is
  handed on at the `made` event, the end card waits 2.6 s (THE FINISH's HOOK, above). Sound: `bottom.mp3` at the hit — in solo too now.
- **THE SPRITES = a FIXED pool of 176 GPU particles** (`BURSTS`; Kenney's Particle Pack: soft clouds · a soft dot · a ring · specks · a
  glint · a burst — `fx/burst.webp`), flown in their shader; **the tiers shed a SHARE of each burst** (0.45 · 0.7 · 1 — never none:
  the look's shape stays; reduced motion: a few). The sparks ride the scene's own streak pool (192). A cloud COVERS (dust is darker
  than the water behind it); light is added — and by day covers (`uCover`), as the fire does.
- **ZERO GARBAGE** (the static scan covers `roofPlane`, `breaks.js#update` + every moment's emitter): typed arrays written into.
  **THE WARM FRAME** draws every piece once in the picture AND the bloom pass (no program is built at floor 30). A ghost passing a
  breakthrough (F4: the match's rivals) = a small echo only — not built here (there are no ghosts yet).

## THE STUTTERS (F3B — the owner's iPhone, day speakeasy, `?fps=1`: 59 fps · worst 34 ms · HITCH 9 at tier 2)
Every long frame of a run is now NAMED (`stage.js` THE HITCH LOG: what one-off work landed just before it — `pic` a picture's upload ·
`snd` a sound's decode · `band` a band's bake · `tier` a tier step · `dom` the HUD's own writes · `frame` none of those; the last 24
in `__ffPlay.state().hitchLog`, the last one on the `?fps=1` line). What a whole run found on the mini PC at 4× CPU, and the fix for each:
- **a picture's first upload mid-run** (F3 asked for a wall "an area ahead" — its decode landed + was uploaded while the ball fell) →
  **EVERY picture of the look on screen is asked for BEHIND THE OPENING** (`night.js#preload`: the four walls, the panorama, the roof
  below + its city; the breakthroughs' four textures at creation — 12 in all): nothing is decoded or uploaded while a run is on
  (checked: `info.landed` stands still from the first drag to floor 48, in both looks; a look that turns mid-run asks for its own set).
- **a band's first paint at its arrival** (a 33 ms frame at EVERY arrival at 4× CPU — 150 ms at floor 40) → **every band is its OWN kept
  node**, built + baked behind the opening (the areas' six + the trench's first lap; kept across runs) and kept PAINTED (at rest all but
  clear — `BANNER_REST` 0.001 — never hidden: its layer stays on the GPU); **an arrival touches no DOM**: one opacity + transform
  one-shot on the band's own node (no text, no class, no canvas swapped). A reader is told 0.35 s later.
- **the breakthroughs' programs** → built in THE WARM FRAME (the picture's + the bloom pass's). **The darkness's side layer** keeps its
  own compositor layer (`will-change: opacity` — its first fade made one mid-run).
- **MEASURED** (`--stutters`: the roof to floor 212, tier 2, 390 × 844 @3, 4× CPU, both looks — the pass log's table): **a 17.0 ms worst
  frame in every area**, the three breakthroughs + the arrivals in it; HITCH = the one 250 ms frame ≈ 2 minutes into the test browser's
  life (this machine's known headless stall — it moves with the clock, not the floor). The owner's iPhone is the proof: `?fps=1`.

## THE OPENING (title-05) + THE GLINT (F3 — `stage.js`, `css/freefall-play.css`; the owner's pick)
Grok's lettering (`assets/freefall/title/lettering-*.webp`) + its tagline (`tagline-*.webp`) as two pictures over the LIVE tower (an
`<img srcset>`: a 390-wide phone at 3× takes the 1170, the rest the 780): the lettering centred, **85 % of the width** (332 pt at 390),
in the top third; the tagline just under it; YOUR BEST at the top; the thumb-sweep hint + DRAG TO SPIN at the foot. F2's tube sign
FREE / FALL + its dropping ball are REMOVED (and the foot's THE ROOFTOP · FLOOR 0 line). By day the tagline wears a deeper dark shadow.
A sideways phone / a wide screen scale it with the stage's column.
**THE GLINT:** a soft diagonal band of light sweeps the lettering LEFT → RIGHT in 0.8 s (eased), **masked to the lettering's own
alpha** (a CSS mask = the very file the picture picked — no second download); a tiny 4-point star twinkles on the last letter as the
band leaves. It plays as the title comes in, then every 7 s while the opening waits; it stops with the first drag (`is-open` leaves);
reduced motion = ONE sweep. NIGHT = a pink-white neon glare, DAY = a clean white sun glint. Transform + opacity only — no canvas work.

## THE ARRIVAL BANNERS (F3 — `banner.js`; the arrivals are pure: `logic.js#nextArrival` · `isArrival` · `arrivalWords`)
On reaching an area (40 · 80 · 120 · 160 · 200 — THE TRENCH at 201 — then its laps at 241 · 281 …) a band crosses the screen: the
area's name big, **FLOOR n** under it (a later lap: LAP 2 · FLOOR 241), **1.6 s** in + out — one Web Animations one-shot,
opacity + transform (reduced motion: it only fades). **F3B (the owner): it lies UNDER THE BIG NUMBER** — in the announcer's lane, between
the number's foot and the ball's highest point (129 … 172 of 844; the apex 176 — on every size: a sideways phone gets ONE line): **it
never covers a floor below the ball**. A call (BLAZE! · SMASH! · NEW BEST) that comes while a band is up waits for it to leave (the
biggest one wins). **THE BOTTOM's band is GOLD — "YOU HIT THE BOTTOM" · FLOOR 200** — and comes with the impact (a whole fall after the
arrival's event); THE TRENCH's follows it. F3's place was the foot of the screen (680 … 764). NIGHT = a dark band
between two thin pink rules, white words in a pink glow, FLOOR in teal; DAY = a frosted pale band, navy words (no backdrop blur).
**BAKED TEXT:** a band's two lines are drawn with their glow ONCE into a canvas of its own from their own computed styles (the stylesheet
stays the one source of the look) — **F3B: EVERY band of the run BEHIND THE OPENING, each its own kept node ("THE STUTTERS")**; an arrival
bakes + builds nothing; a look change bakes the kept bands again; a long name is fitted to a narrow band. Only a later trench lap's
band (281 · …) is built in a run, between two arrivals. THE BOTTOM (200) + THE TRENCH (201) arrive one floor apart: the second band crosses after the first. JAYWALK's area-arrive
sound as before (a lap's band is silent — the engine names an area once). F2's small area name under the number is gone.

## THE HOLD = EXACT RESUME (F3 — the owner's answer to F2's OPEN FOR BEN 4)
F2's hold restarted the ball's flight — so a hold at the right tick was a free dodge of a landing (swipe the app away one tick before
red). F3: the engine freezes the whole state at the hold's tick and resumes it unchanged (`engine.js#hold`, above); the page shows the
ball frozen at its own height under PAUSED, counts 3 · 2 · 1 and goes on from that very tick; nothing the finger does while PAUSED or
in the count turns the tower. Still 3 a solo run; a match never holds. A hold can never cancel or restart a landing — proved by the
engine's tests (a held log == the same log without its holds).

## THE SOUNDS (F2 — `sounds.js` (the PURE table + the triggers) · `sfx.js` · `audition.js` (the SOUNDS list); the files: `audio/freefall/`)
HIGH RISE's player (`docs/highrise.md` "THE SOUNDS"): the bytes fetched early, decoded once at the unlock, each sound a buffer source →
its gain → a soft limiter → the console's SFX bus; 8 voices by priority from a pool; an effect asks `isUnlocked()`, never the
context's state; the MP3's lead-in skipped. Muted / locked / a missing file = nothing plays, nothing throws — the game works silently.
- **THE TRIGGERS** (`sounds.js#cuesOf` — PURE): **bounce** — every landing on solid ground, SOFT (gain ± 1.5 dB, never bent) ·
  **whoosh + THE NOTE UP ITS SCALE** — every clean fall through a gap: the bounce's one recorded note (C4) pitch-shifted in code, a
  step higher each clean floor in a row (do re mi so la do′ re′ mi′ — holding at the top), back to the first after a bounce ·
  **blaze** — THE BLAZE lights · **shatter** · the crash short + high + quiet = the CRACK of a saved landing · **crash** — out on red
  · **lights-out** — out in the dark · **area-arrive** (JAYWALK's file) on entering an area · **new-best** (JAYWALK's) at the crossing.
  **F3B — THE BREAKTHROUGHS' own sounds take the arrival's place on their three floors, each timed to the hit:** **skylight** (floor
  40, 0.133 s after the arrival's event) · **splashdown** (floor 120, 0.133 s) · **bottom** (floor 200, 0.3 s — the ball hits the
  seabed: SOLO too now; a finish cues it once) · **fireworks** — a finish BY NIGHT, softly, 0.9 s after bottom (the stage's: it knows
  the look). **THE MUFFLE** (`sfx.js#muffle`): a low-pass after the limiter, wide open — the splashdown shuts it to 420 Hz in 0.07 s
  and opens it again over 1.5 s. skylight + splashdown come in ≈ 7 dB quiet (−23.4 / −23.7 LUFS against ≈ −16): LOUDNESS-MATCHED BY
  THEIR GAIN in the table (× 2.35 / × 2.41 a shatter's — the build machine has no MP3 encoder; the limiter holds their peaks). A batch that came back from a hidden page (a match:
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

## THE ASSETS (F2 + F3 + F3B — `python -P -E scripts/build-freefall-assets.py [--only=walls,sfx,fx,title,sky,roof,break]` COPIES the owner's delivery; Downloads\grok\freefall is only read)
- `assets/freefall/walls/<area>-night.webp` — the four NIGHT walls (Grok Imagine; offices · speakeasy · harbor · deep): 1024 × 1024 (a
  box average of the delivery's 2× upscale), WebP q 80, **157 KB** together; the wrap is measured after the resize — a wall that no
  longer wraps fails the build. **F3: `walls/<area>-day.webp`** — the four APPROVED day walls (ff-harbor-day = v3; never a -v1 / -v2), the
  same size + wrap check: **296 KB** together. `ff-caustics.png` is not used (the caustics are the shader's).
- **F3 (the add-ons): `assets/freefall/sky/rooftop-night.webp` · `rooftop-day.webp`** — THE ROOFTOP's 360° panoramas (Grok-made, approved: no
  credit needed), kept 3072 × 1024, WebP q 80: **510 KB** (only the look's own is downloaded); the join measured; the day file's
  vertical smears under the clouds softened in the script — a sky-only blur across, in that patch only. **THE NIGHT WALLS v2**:
  `walls/offices-night.webp` · `harbor-night.webp` · `deep-night.webp` are the relit v2 files now (the same names + pipeline; the four
  night walls 277 KB).
- **F3: `assets/freefall/title/lettering-1170.webp` · `lettering-780.webp` · `tagline-1170.webp` · `tagline-780.webp`** — THE OPENING's
  title (title-05 — Grok-made lettering: no credit needed), WebP WITH ALPHA at two widths: **271 KB**. Resized PREMULTIPLIED; the edges
  are measured on hot pink + on a pale sky against the full-size picture laid on the same ground (edge error < 1 of 255: no fringe —
  a fringe fails the build).
- `assets/freefall/fx/blaze.webp` — THE BLAZE's four sprites (Kenney's Particle Pack, CC0), one grey atlas 1024 × 256: **9 KB**.
- `audio/freefall/` — the owner's seven picks (take A): bounce · whoosh · blaze · shatter · crash · lights-out · bottom — byte copies
  (MP3 already), **168 KB** + `CREDITS.md` (every source CC0 1.0, each layer named).
- **F3B: `assets/freefall/roof/below-night.webp` · `below-day.webp`** — THE ROOF BELOW (Grok-made: no credit needed; 2048² made at 1024,
  kept 1536², q 82: 211 + 289 KB) + **`roof/city-night.webp` · `city-day.webp`** — the city round it: each painting's own four borders
  stacked into one 768² tile, the joins cross-faded (49 + 57 KB). The skylight's place is measured in both (`ROOF_SKY`); no red pixel.
  **`fx/water-normal.webp`** (3DTextures.me Water 001, CC0 — the 1 K JPG; 512², 24 KB) · **`fx/sand.webp` + `sand-normal.webp`**
  (ambientCG Ground 055 S, CC0; 1024², 13 + 157 KB — the roughness map is not used) · **`fx/burst.webp`** (Kenney's Particle Pack, CC0:
  ONLY the seven sprites used, one grey atlas 1024 × 512, 19 KB) · **`audio/freefall/skylight.mp3` · `splashdown.mp3` · `fireworks.mp3`**
  (Freesound 453499 by kyles · 585744 by Nox_Sound · 179987 by JelleGeus — all CC0; byte copies, 131 KB). NOT shipped: the -backup
  takes, `glass-cracks.png` (the cracks are drawn in code), the chandelier. `--only=roof,break,sfx` builds them. **≈ 950 KB in all.**
- REUSED, no copy: JAYWALK's `audio/jaywalk/area-arrive.mp3` · `new-best.mp3`. (JAYWALK's skyline is no longer used: the rooftop has its own panoramas.)
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
js/games/freefall/night.js night-fx.js day-fx.js    THE SCENE (both looks): the scene · its shaders + the bloom · the day pieces (F3)      bakedtext.js   the baked big number
js/games/freefall/palettes.js banner.js             THE AREA PALETTES (pure — F3) · THE ARRIVAL BANNERS (F3)
js/games/freefall/breaks.js break-fx.js             THE BREAKTHROUGHS (F3B): the skylight, the water, the seabed, the sprites + their timelines · their shaders
js/games/freefall/best.js endscreen.js              YOUR BEST (pure) · the end card (JAYWALK's standard)
js/games/freefall/sounds.js sfx.js audition.js      the sounds' table + triggers (pure) · the player · the SOUNDS list
assets/freefall/walls/ sky/ roof/ title/ fx/  audio/freefall/  the eight walls (night + day) · the rooftop's two panoramas · the roof below + its city (F3B) · the title (F3) · the flame atlas + the breakthroughs' textures (F3B) · the ten sounds      scripts/build-freefall-assets.py
freefall-lab.html  css/freefall-lab.css             THE LAB + its HUD (prefix ff-; self-contained: no tokens, no web font)
js/games/freefall/tuning.js                         THE RULE-SET TABLE + the classic row by name (pure, imports nothing)
js/games/freefall/tower-gen.js                      THE TOWER: buildFloor + the angle maths + the fairness checks it builds by (pure)
js/games/freefall/engine.js logic.js replay.js      THE RULES (pure — the phone AND the server): the step · the words, the seed, the areas, the ranking · the replay, the judge, the packed log
js/games/freefall/bot.js                            the sim bots          scripts/freefall-sim.mjs   the 2,000-seed table
js/games/freefall/lab.js graybox.js                 THE LAB's page · its three.js graybox
api/_lib/freefall.js                                THE JUDGE's server half (pure, NOT wired)
tests/freefall-engine.test.mjs (25) · freefall-tower.test.mjs (11) · freefall-server.test.mjs (8) · freefall-sim.test.mjs (9) · freefall-lab.test.mjs (5 — the static half) · freefall-play.test.mjs (16 — F2 + F3 + F3B, static)
tests/integration/freefall-play.mjs (134 — the browser: the test page, both looks; --f3b · --look · --perf · --stutters)
tests/integration/freefall-lab.mjs (57 — the browser: real drags at 390 × 844 + 375 × 667 · 430 × 932 · 1440 × 900; scripts/serve.mjs is enough) · kit/page-loads.mjs (/freefall-lab)
```

## COMING
F4: the cards, the cartridge + the proof node (the judge wired, the run node chunked, THE HOLD's legs on the server's clock, SHARE; the
stage takes the console's GAME LOOK there; **THE FINISH's hook — `onFinish` — is where the match + the daily are wired**; a rival's
ghost passing a breakthrough = a small echo), the match, the daily; the site's Credits sheet gets its FREEFALL group at go-live (every
source is CC0 — `assets/freefall/CREDITS.md` · `audio/freefall/CREDITS.md`) · F5: THE MARK (docs/games/plan.md "FREEFALL — F3"). Open
questions for the owner: `docs/games/passes/freefall-f3b.md` "OPEN FOR BEN".
