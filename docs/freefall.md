# FREEFALL (id `freefall`) — the falling-ball game

**BEING BUILT — HIDDEN (F4B, Nov 26 2026): registered as a `preview` row — the owner's live test only, never playable; NOTHING COUNTS (THE
SWITCH is OFF).** **F4B: THE MATCH (2 … 8 — the ghosts, THE DEPTH RAIL, Call the Winner, WATCH THE LEADER, THE FINISH) + THE END SCREEN
(THE LOGO header, the universal footer) + THE SHARE CARD + two fixes (THE PAUSE GAP · THE SKYLIGHT's FRAME BAR)** — "THE MATCH" … "THE
TWO FIXES", below; no rules-file change. F4A: the F3B fixes + THE HIDDEN CARTRIDGE (solo) + THE PROOF (`rooms/{CODE}/ff`) + THE JUDGE on the server + THE SWITCH
(OFF) + THE BOARD (+ AVG) + THE CARDS — "THE CARTRIDGE" … "THE F3B FIXES", below. **RULES CHANGED in F4A — re-publish
`database.rules.json`** (until then a cartridge run plays UNPROVEN). F4B = THE MATCH + THE END SCREEN (the logo header) + SHARE. F1 (Nov 25 2026): THE RULES — the engine, the replay + the judge (its server
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

**Registered HIDDEN since F4A** (a `preview` GAMES row, its meta row, its cartridge, the report's proof path behind THE SWITCH, the `ff`
rules — the 8 functions stay 8). The test page /freefall-play is unchanged: it still counts nothing and calls no server. The DAILY mode exists in the engine + the judge and NOTHING turns it on (no DAILIES row, no ticket, no server path) —
daily-ready only; its seed will come from the daily module's server-sealed day set, never from the date.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| F1 — THE ENGINE | Nov 25 2026 | `docs/games/passes/freefall-f1.md` | the engine, the tower (fair by construction), the replay + the judge (server half), the bot sims + the tuned numbers, THE LAB (/freefall-lab) |
| F2 — THE NIGHT LOOK + SOLO + THE SOUNDS | Nov 26 2026 | `docs/games/passes/freefall-f2.md` | the rules fixes (the landing after a shatter = a bounce · MOVING RED in THE TRENCH · THE HOLD), the assets, THE TEST PAGE (/freefall-play) + solo, THE OPENING, THE NIGHT LOOK, THE BLAZE = NEON FIRE, YOUR BEST, the sounds, the end screen |
| F3 — THE DAY LOOK + THE AREA COLOURS + THE NEW OPENING | Nov 26 2026 | `docs/games/passes/freefall-f3.md` | F2's open calls (THE HOLD = EXACT RESUME · the ball's rim + dot · the fire twice as long · the accent = title-05's pink + teal), THE AREA PALETTES (depth-relative), the day walls + the title, THE OPENING (title-05) + THE GLINT, THE DAY LOOK, THE ARRIVAL BANNERS |
| F3B — THE ROOF BELOW + THE COLOUR FIXES + THE BREAKTHROUGHS | Nov 26 2026 | `docs/games/passes/freefall-f3b.md` | THE DARKNESS EASES WITH DEPTH (the rules) · THE ROOF BELOW · the colour fixes + THE COLOUR RULE · the banner under the number · PAUSED's cover · THE STUTTERS · the assets · THE SKYLIGHT (40) · THE SPLASHDOWN (120) · THE BOTTOM (200: solo cracks open · match + daily: the finish's moment + its hook) |
| F4B — THE MATCH + THE END SCREEN (THE LOGO) + THE SHARE CARD (+ two fixes) | Nov 26 2026 | `docs/games/passes/freefall-f4b.md` | THE PAUSE GAP · THE SKYLIGHT's FRAME BAR · THE MATCH (the first GO's seed + tick 0, each player's own `ff` node, the ghosts, THE DEPTH RAIL + the edge markers, Call the Winner, WATCH THE LEADER, THE FINISH at THE BOTTOM / the 3:00 cap, the podium, REMATCH; the server's `freefallMatch`) · THE END SCREEN (the logo header, YOUR BEST · AVG, YOUR TABLE, the universal footer) · THE SHARE CARD + SHARE |
| F5A — THE LOOK POLISH | Nov 27 2026 | `docs/games/passes/freefall-f5a.md` | THE WATER SURFACE rebuilt to the owner's two targets (worked out in its shader — the normal map gone) · THE FINISH (sand, rocks + their shadows, soft dust) + THE DAY CELEBRATION (bubbles, sun rays, the same soft fireworks) · THE ROOF GRAIN · THE SHARE CARD's STAGED hero frame · THE MARK = B · THROUGH THE FLOOR + the tile · THE BILLBOARD = A · THE LOGO + its readability proof — LOOK ONLY |
| F5B — THE FIXES + THE WATER SWAP + THE SHARED END SCREENS | Nov 27 2026 | `docs/games/passes/freefall-f5b.md` | SHARE = THE PICTURE ONLY (card.js + send.js — the test page + the cartridge) · the banners proven = 120's · THE MARK through the floor · the gold card readable · FLOORS 40 + 120 NO RED (`gen.blind`) · no "0 BLAZES", ONE bottom wording · the crown · the water hitches · the inbox's smudge / lamps / stump · THE WATER SWAP (night under = the day's water in night inks · day above = ocean blue + NIGHT's streaks) · THE END-SCREEN BOARD (ui/end-board.js — shared, opt-in) + FREEFALL's FINAL SHAPE |
| F5C — F5B's LEFTOVERS + THE MATCH PIECES + HOW TO PLAY + THE MIX + CREDITS | Nov 27 2026 | `docs/games/passes/freefall-f5c.md` | the logo always paints · YOUR BEST n · AVG n · ☐ FRIENDS ONLY (shared) · the name on the card · night under + day above (the last code try) · the day mark's outline · THE TIE-BREAK · the edge markers at the rival's side · RIVAL OUT · LAST ONE STANDING · HOW TO PLAY · THE MIX + the duck · the credits |
| F4A — THE F3B FIXES + THE HIDDEN CARTRIDGE + COUNTING (OFF) + THE BOARD + THE CARDS | Nov 26 2026 | `docs/games/passes/freefall-f4a.md` | the haze after a breakthrough · the gold band · the darkness's look · THE HIDDEN CARTRIDGE (owner-only, solo) · THE PROOF (`ff`) · THE JUDGE on the server · THE SWITCH (OFF) · THE BOARD + AVG · THE CARDS (SPLASHDOWN · TERMINAL VELOCITY · ROCK BOTTOM) |
| THE REVIEW (report only) | Nov 27 2026 | `docs/games/passes/freefall-review.md` | MUST 3 · SHOULD 16 · NICE 15 — the fix list for THE FIX PASS |
| THE FIX PASS A — THE LOOK + THE FEEL | Nov 27 2026 | `docs/games/passes/freefall-fixa.md` | MAKE ROOM (MODULE NOTES) · THE LOOK LOCK · THE DAY HUD · THE WATER (Grok's ripple map) · the callouts up · THE RAIL's NAMES (no edge markers) · THE MARK = D · `?fps=1`'s END-OF-RUN SUMMARY · THE SPIKE RULE · the title's dark hold · THE TAPPER · the deep lifted by night |
| THE FIX PASS C — SPEED ROUND 2 + SCORING + THE TEST PAGE + THE LAST ITEMS | Nov 27 2026 | `docs/games/passes/freefall-fixc.md` | THE VEIL (the darkness + the shade in the canvas) · `?hud=0` · `?empty=1` · THE HOLD · THE COPYCAT · the end-burst · a hold's longest · floor 201 blind · THE RULE-SET LEAF (`rs`) · THE BOT MATCH + `?spectate=1` · ☰ HOW TO PLAY on the page · the finish card's bursts · S10 + S11 (the shared end board) · N1 N2 N4 N10 N12 N15 |
| THE FIX PASS B — SPEED BY EXPERIMENT + THE MATCH + STABILITY | Nov 27 2026 | `docs/games/passes/freefall-fixb.md` | THE SPIKE RULE steps down only if it HELPS · `?fps=2` THE BREAKDOWN · THE A/B SWITCHES (`?bloom=0 · ?fx=0 · ?wall=0 · ?ghosts=0 · ?smooth=0`) · SMOOTH MOTION (the tower at the real time) · a lost context keeps the rivals · a yielded tab never writes proof · S1 the re-score · S6 leavers · S7 lost phones · S8 not in the run · S9 the podium's fallback · S15 the clock after a lock · the finish card zoomed in · LAST ONE STANDING's two lines |

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
  landing. A match and the daily never hold — "THE HOLD = EXACT RESUME", below. (FIX C — DECIDED, Ben Nov 26: the pause IS allowed in the daily, 3 a run — switched on by the DAILY pass; `MODES.daily.holds` = 0 until then)
- **THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE (F3 — the owner, Nov 26: the numbers were 6 · 4 s · 2.5 s, a stopped ball had 15 s and
  nobody ever SAW the darkness):** a darkness falls down the shaft — it starts `LEAD` (**3**) floors above the ball, rests a grace
  (**3 s**), then comes one floor every **2 s**. It is never more than LEAD floors above the deepest floor the ball has reached (when the ball reaches floor f
  it moves down to at least f − LEAD, and its pace starts again from there). It only ever moves down. When it reaches the ball's floor
  → OUT (`dark`). A ball that stops moving has LEAD × the pace = **6 s**; a run nobody touches ends at **9.0 s**. It is always in
  sight ("THE DARKNESS — SEEN + HEARD", below). **IT EASES WITH DEPTH (F3B — the owner, Nov 26: he tested F3's darkness and loves it;
  the stall budget follows the layout's difficulty):** floors 0–101 EXACTLY as above (FIX C N15: through floor 101 — the first eased floor is 102; a floor every 2 s: 6 s stopped — whole ticks: the first floor whose pace moves is 102, 121 ticks), a straight
  line over floors 100–160, **a floor every 160 ticks from floor 160 on — 8 s stopped** (THE DEEP + THE TRENCH); the pace is the one
  AT THE BALL's FLOOR when a step is set (`tuning.js#darkPaceAt` — pure, integers; the judge replays it; no new rule-set row).
- **THE AREAS** (by floor, for the views): 0 THE ROOFTOP · 40 THE OFFICES · 80 THE SPEAKEASY · 120 UNDER THE HARBOR · 160 THE DEEP ·
  200 THE BOTTOM · past it (solo) THE TRENCH — the deep's palettes cycled, harder each lap of 40 floors.
- **THE MODES:** SOLO = endless (a 30:00 safety cap) · MATCH + DAILY = THE FINISH at THE BOTTOM (the 200th floor passed = `made`) or the
  3:00 cap (`cap`), whichever first.
- **THE RANKING:** the floors, then the EARLIER tick that floor was reached, then MORE BLAZES, then a draw (`logic.js#rankCompare` / `standings` — THE TIE-BREAK, F5C; FIX C N15).
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
| THE HOLD (F2) | `modes.solo.holds` 3 · match 0 · daily 0 for now (the DAILY pass: 3 — DECIDED Nov 26) · a hold's longest 10 min (FIX C — `proof.js#HOLD_MAX_MS`) |
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

**THE SERVER HALF:** `api/_lib/freefall.js` — PURE, NOT a function (the 8 stay 8), **WIRED into `/api/report` since F4A — "THE JUDGE ON THE
SERVER + THE SWITCH", below**, imports the SAME `js/games/freefall`
modules: `judgeRun` · `judgePacked({ seed, mode, log, rules? })` (the rule set + the mode + the seed are named before a character of
the log is read) · `serverRow(v)` (the row a report will read: `{ f, t, w, e, ft? }`). `tests/freefall-server.test.mjs`: honest bot
logs accepted, every refusal by name, the judge == the live engine for 500 bot runs across all modes, 3,000 changed logs.

**FOR F4 (written in F1 — F4A built it: "THE PROOF", below):** an EMPTY log is an honest run (`ok`, floor 0, THE LIGHTS WENT OUT at tick 540 — FIX C N15: the doc said 1140)
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
RISE's pattern (`docs/highrise.md` "THE TEST PAGE"): the run loop is `stage.js` — ONE module the page mounts and (F4A) the cartridge
mounts too (its hooks: "THE CARTRIDGE"); `play.js` = the page itself (THE DOOR, its `?…` flags, its best, `createStage(app, { page: true, … })`).
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
- **THE SPLASHDOWN (floor 120 — the speakeasy → under the harbor):** the last speakeasy floors stand over **a real WATER PLANE** across the shaft — **its SURFACE is F5A's ("THE WATER", below:
  worked out in its shader — the speakeasy's lights as long broken streaks by night, turquoise + thin lines + foam by day; F3B's
  normal-mapped mirror of the wall + the tower's rings is gone).** **The ball plunges in:** a crown of drops (lit from above by night), spray + a ring of mist (sprites), **a ring wave** running
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
  **by night a FIREWORK-STYLE burst (by day THE DAY CELEBRATION — F5A, below: bubbles + sun rays)** of gold + cyan glowing stars (three, 0.3 s apart, ROUND THE BALL — each a ball of stars about
  1 across with a glint at its heart) + `fireworks.mp3` softly, 0.9 s after `bottom.mp3` (reduced motion: neither); the run is
  handed on at the `made` event, the end card waits 2.6 s (THE FINISH's HOOK, above). Sound: `bottom.mp3` at the hit — in solo too now.
- **THE SPRITES = a FIXED pool of 176 GPU particles** (`BURSTS`; Kenney's Particle Pack: soft clouds · a soft dot · a ring · specks · a
  glint · a burst — `fx/burst.webp`), flown in their shader; **the tiers shed a SHARE of each burst** (0.45 · 0.7 · 1 — never none:
  the look's shape stays; reduced motion: a few). The sparks ride the scene's own streak pool (192). A cloud COVERS (dust is darker
  than the water behind it); light is added — and by day covers (`uCover`), as the fire does.
- **ZERO GARBAGE** (the static scan covers `roofPlane`, `breaks.js#update` + every moment's emitter): typed arrays written into.
  **THE WARM FRAME** draws every piece once in the picture AND the bloom pass (no program is built at floor 30). A ghost passing a
  breakthrough (F4: the match's rivals) = a small echo only — not built here (there are no ghosts yet).

## F5A — THE LOOK POLISH (Nov 27 — the water · the finish · the day celebration · the roof grain · the share card's picture · THE MARK · THE BILLBOARD; `docs/games/passes/freefall-f5a.md`)
LOOK ONLY: no rule, no proof, no score changed. FREEFALL stays HIDDEN; the counting SWITCH stays OFF.

### THE WATER (the surface above THE SPLASHDOWN — `break-fx.js WATER_F`; the owner's targets `Downloads\NEON\freefall\ff-water-target-night.png` · `-day.png`, floor 119)
The owner: night "needs a lot of work", day "a little off"; under the water = good (untouched). F3B's surface — Water 001's normal map in
two layers, mirroring the wall + the tower's rings — read as crinkled foil / an oil slick, and the gold floors mirrored in dark water were
a BROWN blob. **The surface is now worked out in its shader; the normal map is gone** (the asset, its build job + its credit removed).
- **THE SWELL** (`swell()`): four long, slow waves on a warped ground → their slopes; flatter with distance. Large, smooth, slow.
- **NIGHT:** deep TEAL-NAVY lifting toward the far edge (the swell's own soft light + a slow mottle). **THE STREAKS:** where the mirrored
  ray (off the surface at rest) meets the shaft's wall, the wall's painting is read soft down the whole COLUMN over that point (two rows,
  ONE softness on every phone — mip 5: the bias takes the screen's own step back out); a lamp + a neon strip are each a soft bell, the
  bell's 4th power is its heart = a thin streak; **two clean inks** — a warm column = a lamp's pale amber, a cool one = neon leaning to
  violet. Whole at the wall's foot, broken into dashes by the swell, fading with the distance from the wall — long BROKEN VERTICAL
  STREAKS. **The tower's floors are NEVER mirrored**; the ball alone: a soft pink streak. Small pink / cyan glints (short dashes that
  come + go), glowing cyan PLANKTON specks (round on the screen), LINEAR light capped at 0.62: never a white blotch.
- **DAY:** bright TURQUOISE to the near edge, paler toward the far edge (a soft lift — no clipped rim); few, moving ripple LINES (the
  zero lines of a slow field as soft strokes two or three pixels wide, broken into arcs that come + go — thinner + fewer than the
  target's contour map; the review: hairline closed loops read as scratches on glass); sun sparkles near the far edge; a soft FOAM line
  at the wall + round the pillar; the ball's soft PINK glow + a pale pink streak of light.
- The surface is OPAQUE (at 0.97 the floors below showed through as ghost rings). The plunge (the ring wave, THE WATERLINE, the
  meniscus) is F3B's; the day crown's spray is a touch aqua + born clear of the surface.
- If a phone needs it cheaper: the streaks' two texture reads are the only pictures it touches (the wall's own, mip 5).

### THE FINISH + THE DAY CELEBRATION (THE BOTTOM, floor 200 — `break-fx.js SAND · ROCK_F · RSHADOW_F · RAYS_F`, `breaks.js`)
- **THE SAND READS AS SAND:** its own warm colour kept (it was washed to one grey-teal by day, one flat violet by night), SOFT LIGHT across
  it (low dunes — a slow swell of light + shade), a fine grain + round grains of light near the ball and the tower's foot, the caustics by
  day; **the bed thins out toward the shaft's far wall** (`farFade` — what is behind it shows through: it ended in a ruler-straight line;
  the rocks stand inside it). The shockwave's ring is no clipped white band — and **a FINISH's
  ring is GOLD** (the bed is whole: `uHole` 0 — the gold band's own colour, the share card's gold ring).
- **THE ROCKS READ AS ROCKS:** a finer ball (`IcosahedronGeometry(1, 3)`) pushed about by a SLOW noise of its direction — broad shoulders +
  hollows (it was a coarse ball with every corner knocked its own way: a spiky lump) —, its normals the pushed surface's own; mottled
  stone, sand lying on its top, darker where it sits in the bed, a soft edge light; **each on its own soft SHADOW** (the rocks' instances
  on a flat card, thrown a little away from the light).
- **THE DUST IS SOFT:** many thin veils in the sand's own lit colour — a sprite with a cover UNDER 0 is a SOFT CLOUD: it keeps its own
  thin cover in both looks, and a veil's light = its colour × its cover, so piled up they come to the dust's colour, never to white.
  **A puff's depth is its NEAR side's** (`BURST_V`: a card at its middle's depth was cut off along a straight line wherever the ground
  under it ran in front — the dust clouds' flat edges, the fireworks' half-discs). **The ball's halo fades out softly over the sand**
  (`LIGHT_F uOnBed` — a finish only: the sand sliced it flat). The fireworks' stars are small hot points (they were flat cream discs).
- **THE DAY CELEBRATION** (a finish by day — the night keeps its fireworks): three shimmering bursts of BUBBLES (bright rings thrown
  out round a point, then rising, glints of sun among them — `breaks.js#bubbles`, the same three places + beat as the fireworks) + **SUN
  RAYS from above** (`RAYS_F`: one upright card behind the ball turned to the camera in its vertex shader — many thin moving shafts on a
  faint veil, pure added light, in with the first burst, gone 3.4 s later) + **the same soft `fireworks.mp3`** (the cue plays in BOTH
  looks now — `stage.js`; reduced motion: neither). GPU sprites: the pool stays 176, the tiers shed a share.

### THE ROOF GRAIN (floors 36 – 39 — `night-fx.js SKY_F` · `break-fx.js DECK_F`; `assets/freefall/roof/grain.webp`)
The roof painting was made at 1024 + enlarged: ≈ 4 screen pixels a texel over the landing — soft by day. A fine concrete-grain DETAIL
tile (256², 30 KB, **MADE IN CODE** by `scripts/build-freefall-assets.py --only=grain`: band-limited noise built in the frequency domain —
it tiles exactly —, a fine grain + a mottle + a few pits, mean 0.5; no source, no credit) is laid over the roof as it comes close
(`uGrain` — the deck's own measure: the plane's scale 0.3 → 0.8; nothing on the title screen or the first floors): two readings of it (a
fine one + a coarser one turned, half each — no tile shows; the fine one alone did not survive a phone's scale) as light + shade about the painting's own colour; its mipmaps let it go with distance.
ONE reading for the roof below + the deck round the skylight (no edge where the deck ends). Both looks (by night at under half strength).

### THE SHARE CARD's HERO FRAME TELLS THE STORY (`shot.js` · `night.js#shot` · `stage.js#takeShot` + `runBefore`)
The owner's real SHARE read as noise (the frame was the one drawn AFTER the crash: no ball, a white hit-flash slice, random spark
streaks). **The frame is now STAGED:** a beat after the end the stage plays the run again from its own log to `SHOT_BEFORE` ticks (9 =
150 ms) before its last tick, the tower at the angle the run ENDED on, and the scene draws that moment ONCE MORE for the card alone —
the camera a step back (`SHOT_ZOOM` 1.32: 2 – 3 floors of context), the BALL alive + in the air, just above the RED slice it is about to
land on, that slice glowing red-hot under THE MARK's own light (`SHOT_GLOW` — a white flash would whiten the slice), no hit flash, no
punch light, no sparks — copies it off the canvas, puts every eased number back and draws the screen's own frame again **in the same
animation frame: the staged picture is never shown.** Once a run, after its end — never in play. **THE LIGHTS WENT OUT** = the ball still
lit, the card's dark edge closing down from the top to just above it (a soft violet line of light along its foot — `share.js DARK`) +
the sides (the review: to within half a ball of the ball — a lit room said nothing at 360 px). **YOU HIT THE BOTTOM** = the impact itself
(`SHOT_AT.made` 355 ms: the ball on the seabed, its GOLD ring tight round it), the dust + the last floor's red shards left out of that
one picture (red is the death colour — never the subject of the WIN card), the bloom kept LOW (`SHOT_BLOOM.made` 0.3) and the night gold frame no longer lifted (it was a white blob).
Match cards the same. The run can't be played again (a log that does not end where the run did) → the run's own last frame, staged alike.

### THE MARK = B · THROUGH THE FLOOR (`js/core/marks.js` · the tile `js/ui/game-art.js`)
The owner's pick: the white-hot ball ablaze — a pink outer flame, an orange inner flame with a thin yellow-white core — dropping through
the gap in a violet floor; the owner's sketch drawn ~15 % bigger in its box (the floor keeps the box's width, its gap the ball's), `w` 6,
ONE tube with a width of its own (the thin core flame: `w` on the tube — `ui/mark-svg.js`). It replaces the stand-in in the game list;
FREEFALL has its TILE (the mark lit in the night shaft). **THE BOOT BUDGET WAS NOT RAISED** (a JAYWALK test pins it at 6500 KB; the boot
stood 836 B under its line — the mark + the tile were slimmed to fit). THE CITY's sign for FREEFALL = the city chat's, at go-live (a
city sign reads a mark's tubes at ONE width: the thin core flame needs the tube's own `w` there too).

### THE BILLBOARD = A · THE LOGO (`billboard.js` · `scripts/build-freefall-billboard.mjs` → `assets/city/freefall/billboard.webp`; NOT installed in the city)
HIGH RISE's B1 formula, 848 : 448: title-05's lettering big on the LEFT over the NIGHT rooftop city (FREEFALL's own panorama — the bridge
+ the skyline), THE BURNING TOWER on the right fading into the city (a STAGED frame of the finished game: the seed `poster1`, the bot
dropping through the gaps until THE BLAZE is lit on the rooftop — cut out as a soft oval round the tower's own column: it melts into the
city, never a pasted screenshot on a bounded roof), a dark FOOT BAND (a quarter of the height)
with a pink neon line along its top + OPEN NOW in big white heavy letters (Bowlby One's path data — HIGH RISE's own
`billboard-glyphs.js`, handed to the painter by the builder: no font load, nothing fetched). The painter is pure canvas, imports nothing,
is in no game's graph. **Build:** `node scripts/build-freefall-billboard.mjs "<chromium>"` (serve.mjs — `E2E_BASE`). **THE READABILITY
PROOF** (`tests/integration/freefall-billboard.mjs` — in the city at 390 × 844, local only: the roof board's JAYWALK OPEN NOW face
forced, its picture's request answered with FREEFALL's in the test): the lettering 15.5 pt vs JAYWALK's word 9.0 pt · OPEN NOW 6.1 pt vs
NOW OPEN 3.7 pt. **The CITY chat installs it at go-live.**

### THE DAY OFFICES FOG (the add-on, Nov 26 — `night.js AREA_DAY · FOG_START`; the slices' + the pillar's haze)
The owner's iPhone + F3B's shots: by DAY in THE OFFICES the floors washed into pale blue from about the 3rd floor under the ball (~40 % down
the screen) — the day speakeasy + harbor fade from 60 – 70 %, the night offices are fine. Every area's haze ran from the ball's own floor
(7 floors deep); a DARK haze only shows 4 – 5 floors down, but the offices' was the floors' own pale periwinkle on a pale blue wall — it
showed at once. **The day offices' haze is a DEEPER blue and STARTS further down** (`FOG_START` 0.36 of its 7 floors — THE OFFICES alone;
every other area 0: unchanged): its floors keep their colour + contrast as far down the screen as the other areas'. The check:
`?look=day&floor=48` beside `&floor=90` + `&floor=130` at 390 × 844 @3 (`lookog-beside-48-90-130.png` — the fade begins at the same
height in all three; the runner's scene `dayfog`).

### THE PAUSE IN DAILIES (the owner, Nov 26 — a DECISION, nothing built here)
A pause is ALLOWED in the daily in FREEFALL, JAYWALK + HIGH RISE, with the full safeguards (exact resume, the dark cover, no input while
held or in the 3 · 2 · 1, the 2 s server stamp, 3 a run); never in multiplayer. It REPLACES "a daily try never HOLDS" (the daily itself
is built later — the dailies chat).

## F5B — THE FIXES + THE WATER SWAP + THE SHARED END SCREENS (Nov 27 — `docs/games/passes/freefall-f5b.md`; the owner's decisions: `docs/games/plan.md` "FREEFALL — F5B")
FREEFALL stays HIDDEN; THE SWITCH stays OFF. No rules-file change.

### SHARE = THE PICTURE ONLY (`card.js` · `send.js` · `share.js` · `final.js#shareNow` · `stage.js#warmPic`)
The owner's iPhone: SHARE gave Messages a TEXT line ("I fell 10 floors in FREEFALL") + a link card, NO picture. **The cause:** the TEST
PAGE's SHARE handed the sheet `{ title, text, url }` (it never had a picture), and the cartridge's uploaded the card AT THE TAP (a network
wait — iOS drops the tap's permission). **Now, on both:** the run's card (`card.js` — the drawing, split out of `share.js`; the test page
loads it LAZILY at its end card, with `send.js`) is DRAWN + ENCODED when the end screen appears (`prepPicture(…).warm()` — the PNG file kept,
the canvas freed), and the tap calls `navigator.share(payloadOf(file))` **in its own turn** — the payload is EXACTLY `{ files: [png] }`:
no text, no title, no url, ever; nothing uploaded (`api/_lib/share-card.js` still knows `freefall` — unused). Files can't be shared (a
desktop) or the sheet refused → THE PICTURE IS SHOWN to save (press and hold) — never a text fallback. The cartridge's footer calls the
module the end screen already loaded DIRECTLY (`final.js#shareNow` — no import promise between the tap and the sheet). Proven:
`tests/freefall-share.test.mjs` (the real `send.js` against a stub sheet: one `image/png`, keys `files`, called synchronously) + the browser
half (`freefall-share.mjs` — the cartridge's + the test page's SHARE, 1080 × 1350, 0 calls to /api).

### THE BLIND FLOORS (`tuning.js` classic `gen.blind: [40, 120]` · `tower-gen.js#redOf`)
The floors the skylight (40) + the water (120) hide until their breakthrough carry NO red — the first landing under them is made blind. A
layout rule of the row (nothing counted yet — no new row); the judge, the replay + the sims read the same function. Proven on 2,400 towers;
every other floor 0 … 320 is the plain row's bit for bit; F1's digests hold on the row without the rule.

### THE SMALL FIXES
- **ONE wording for the floor-200 ending: YOU HIT THE BOTTOM** (`logic.js#END_WORDS.made` — the end screen, the share card, the podium, the
  band). **"0 BLAZES" never shows** (the test page's stats line + the share card: the area takes its line).
- **THE MARK:** the violet floor at the ball's middle (`M4 75 H29 M71 75 H96` — the caps clear of the ball), the whole mark re-centred (+9),
  the tile re-centred; the boot's 83 bytes kept.
- **THE GOLD CARD** (YOU HIT THE BOTTOM — a hazy white blur at 360 px): the staged picture's ring is a thin crisp gold line tight round the
  ball (`breaks.js#crisp` — the picture alone, `uCrisp`), the ball's halo at `SHOT_HALO` 0.35, `SHOT_BLOOM.made` 0.12.
- **NO STUMP** (`night.js#STUMP` 0): the core's stump stood behind the ball, its foot hidden — it read as a block floating over the ball.
- **THE CROWN** (`breaks.js#CROWN`): six puffs spread round the ring in the water's own aqua / cyan — no near-white flash.
- **THE SMUDGE:** the match HUD's EMPTY names row kept its dark radial ground (a fuzzy spot near the top in every area, over the bands too)
  → `.ff-count-names:empty { display: none }`.
- **THE DEEP's DAY LAMPS** (`day-fx.js#wallDay`): a lamp sat up to 0.25 from its grid cell's edge and was drawn in its own cell only —
  sliced at the border (the "tan slab with a hard slanted edge" at the finish) → each pixel sums the 4 nearest cells' lamps.
- **THE BANNERS:** every area's band already shares UNDER THE HARBOR's box, class + 1.6 s — `freefall-play.mjs` proves it (40 · 80 · 120
  · 160 · the trench + its laps).
- **THE WATER HITCHES** (`freefall-play.mjs --water`): the splashdown has no frame over 33 ms (worst 16.9 – 17.8 ms, both looks, 1× + 4×
  CPU). Standing on the water, the darkness's first step was a 67 ms frame (`dom`): `.ff-dark` + its veil rest at 0.001 (kept painted).

### THE WATER SWAP (the owner, Nov 27)
- NIGHT ABOVE kept · DAY UNDER kept.
- **NIGHT UNDER = DAY UNDER's look in night colours:** UNDER THE HARBOR is "under the water" by night too (`AREA_NIGHT`'s `1` + its motes):
  the wall shader's night half takes the day's recipe — the water's gradient down the screen in a dark teal, the caustics' swirling light
  lines in cyan over a slower violet net, faint shafts from the surface; the painting a ghost under it; the slices' faint caustic shimmer in
  cyan; the rising BUBBLES glow cyan (`MOTE_NIGHT`); the plankton kept.
- **DAY ABOVE = a deeper OCEAN BLUE, reflections done NIGHT's way** (`break-fx.js WATER_F`): the day painting's brick as soft broken warm
  columns + its lamps' pale amber hearts (the same column read, mip 5), sun glints that blink, small white foam crests on the swell's tops
  (no whitecaps), quieter ripple lines, the ball's pink glow smaller, the foam edge round the pillar + the wall kept; capped at 0.86.

### THE END SCREENS — THE FINAL SHAPE (`js/ui/end-board.js` — shared, opt-in · `final.js` · `css/freefall-play.css`)
- **THE END-SCREEN BOARD** = the console's ONE shared leaderboard block (docs/cartridge.md "THE END-SCREEN BOARD"): a cartridge's
  `END_BOARD = { b, word, avg }` opts in — FREEFALL's `{ b: 'freefall-solo', word: 'FLOORS', avg: true }` is the only one.
- **SOLO:** the logo · SOLO · the cause · the number + FLOORS · YOUR BEST n · AVG n (a NEW BEST: the AVG on its own line) · THE WORLD's TOP 3
  (a FRIENDS tick → YOUR TABLE; no friends yet → "NO FRIENDS YET") · "YOU · 12TH · 88 FLOORS" when not in the top 3 · PLAY AGAIN · HOME | SHARE.
- **MATCH:** the logo · MATCH · the cause · the number + FLOORS · YOUR BEST · AVG · THIS MATCH's TOP 3 (no per-player cause line) · "YOU · 5TH
  · 49 FLOORS" from 4th down · REMATCH · ROOM | SHARE. The WINNER line goes (the top 3 say who); a call's result stays (small).
- **Gone:** the WOULD COUNT line (the server's answer stays on the body's `data-would` for the checks), the stats line + YOUR TABLE in the
  cartridge (the board's FRIENDS tick is YOUR TABLE now), the personal-best plaques (the XP line stays). **Nothing scrolls** at 375 × 667 ·
  390 × 844 · 430 × 932: on a short screen the logo (180 pt), the cause + the number come down a size.

## F5C — F5B's LEFTOVERS + THE MATCH PIECES + HOW TO PLAY + THE MIX + CREDITS (Nov 27 — `docs/games/passes/freefall-f5c.md`; the owner's decisions: `docs/games/plan.md` "FREEFALL — F5C")
FREEFALL stays HIDDEN; THE SWITCH stays OFF. No rules-file change.
- **THE LOGO ALWAYS PAINTS** (`endscreen.js#warmLogo`): the lettering is fetched + decoded during play (the same srcset + sizes); the end
  screen's image decodes `sync`. Before: asked for at the end screen, decoded async — its empty box was caught. 180 pt on a short screen.
- **YOUR BEST n · AVG n** (`endscreen.js#bestWords` · `avgWords` — the AVG always shows, a dash when unknown / under 5 runs) · a NEW BEST
  = "NEW BEST · n" + the AVG under it. The cartridge's AVG = the profile's stored average off the room's mirror (`profile/public.js#pubOf`).
- **THE BLOCK's HEADER** (shared — `ui/end-board.js`): the tick "☐ FRIENDS ONLY" alone (unticked = everyone); a match keeps THIS MATCH.
- **THE NAME** on the test page's card: the signed-in one (`play.js` reads this phone's saved profile, slot 1 — read only).
- **THE WATER, the last code try** (`break-fx.js WATER_F` day half · `night-fx.js` night under · `night.js#MOTE_NIGHT_SIZE`): day above =
  a saturated ocean blue by the SCREEN's height (deepest at the bottom), the wall LAMPS' streaks in BRASS (found warm + bright on the day
  painting's two lamp rows; the heart REPLACES the blue — light added onto blue was the lavender), a few glints riding the swell's moving
  crests, no foam flecks, the far wall's foam → a soft darker wet edge, foam round the pillar only, the ball's pool small + hot pink. Night
  under = the cyan lines ×2.7, the violet net ×3, the ground a touch lifted, the bubbles brighter + 1.35× (bubbles only).
- **THE MARK by day** (`core/marks.js` the ball's `o` · `ui/mark-svg.js#markSvg(game, cls, day)`): an orange-red outline under the ring on a
  pale ground; the night mark unchanged; the boot 83 B → 188 B left (header comments trimmed). A city DAY sign can read `t.o` at go-live.
- **THE TIE-BREAK** (`logic.js#rankCompare` — the ONE ranking): floors → the earlier tick that floor was reached → more blazes (`bl`) → a draw.
- **THE EDGE MARKERS** (`matchhud.js` four edge groups · `ghosts.js#edgeMarks` `side` · `stage.js` sin φ with a ±0.2 flip): one line each,
  17 px, the rival's own colour, at the left / right edge they really are; below → the lower band, above → the upper band.
- **RIVAL OUT** (`ghosts.js#outWords` · `matchhud.js#callout` · `stage.js`): a rival OUT → JAYWALK's out-drop + "MIA IS OUT" in their
  colour, 1.5 s, low in the middle, 2 lines at most (a third waits); none in a run's first 2 s (a rejoin's catch-up).
- **LAST ONE STANDING** (`ghosts.js#lastStanding` · `lastWords` · `matchhud.js#last`): 3+ players, every rival over, me still falling → once
  a match, JAYWALK's card + last-standing.mp3: "+23 FLOORS AHEAD · KEEP FALLING" · "12 FLOORS TO THE LEAD · KEEP FALLING".
- **HOW TO PLAY** = `ui/help.js#RULES.freefall` (the lazy opener; one drawing a line).
- **THE MIX** (`sounds.js` gains + `DUCK` / `DUCK_MS` · `stage.js#duckFor` · `view.js` drv.duck): measured against JAYWALK's; the music ducks
  to 0.5 under the outs, the breakthroughs, the bottom + LAST ONE STANDING. **THE CREDITS**: `ui/credits.js` group FREEFALL (`game` —
  shown where FREEFALL is playable).

## THE FIX PASS B — SPEED BY EXPERIMENT + THE MATCH + STABILITY (Nov 27 — `docs/games/passes/freefall-fixb.md`, the whole text there)
- **THE SPIKE RULE ONLY STEPS DOWN IF IT HELPS** (`stage.js#SPIKE` — `{ n 4, span 20 s, trial 10 s, settle 0.5 s, helped 0.5, floor 1 }`):
  a step down is a TRIAL — the next 10 s of play must halve the hitch rate, else the tier goes back up and the rule rests for the page.
  Never below tier 1 on spikes alone.
- **`?fps=2` — THE BREAKDOWN**: each hitch split into `ours` (update · build · submit) · `busy` (the main thread held by other work — a 4 ms
  ping) · `gpu` (the wait with the thread free), over the last two gaps; long tasks counted (Chromium). The live line + the END-OF-RUN
  SUMMARY. **THE A/B SWITCHES** (the test page only — `play.js#AB` → `stage.js` → `night.js` `o.ab`): `?bloom=0 · ?fx=0 · ?wall=0 ·
  ?ghosts=0 · ?smooth=0` with `?dpr= · ?tier=`; named at the head of every `?fps=` line.
- **SMOOTH MOTION** (VIEW ONLY — `stage.js#spinAhead`): the tower drawn at the real time — the turn the next tick will make × the fraction
  of the tick gone; at the tick the drawn angle IS the landing's. The engine + the proof never see it.
- **THE MATCH + STABILITY**: a lost context re-sends the ghosts (`rebuild`) · a yielded duplicate tab (`state.dupTab`) only WATCHES and
  writes nothing, then takes over as a refresh (`view.js#dup`) · the callouts' timers survive a reset (`matchhud.js` `gen`) · **S1**
  `game.ends` + `director.js#rescore` (a silent phone's late end re-scores `results` + the night record; the late phone's own podium =
  `scoredNow`) · **S6** a LEAVE writes `e` (`w: 'left'`), no on-time GO = ended 3 s after the window (`match.js#noRunFor`) · **S7**
  `row.gone` (lost > `ghosts.js#LOST_GONE_MS` 2 s) out of the count + LAST ONE STANDING, the leader the deepest one HEARD · **S8** not in
  the room's solo run → "PLAYING — WAIT FOR THE REMATCH" (`stage.js#block`), BACK → `setState({ quit })` for a non-host · **S9** the
  podium's plain list when the shared block has no rows (`view.js#plainList`) · **S15** `show()` anchors a match's tick 0 again from the
  server's time (`o.matchT0`).
- **THE FINISH CARD ZOOMED IN** (`shot.js` `SHOT_ZOOM.made` · `stagingOf().party`): the ball + its gold ring big, the celebration kept in
  the staged frame · **LAST ONE STANDING** in two lines, the dot ending the first.

## THE FIX PASS A — THE LOOK + THE FEEL (Nov 27 — `docs/games/passes/freefall-fixa.md`)
- **THE LOOK LOCK** (the review's M1; the owner: the HOST's look for the whole match, the same on every phone): a run keeps the look it
  STARTED in — a change asked for mid-run (the console's Game look, AUTO's sun, the test page's `setLook`) waits for the end card
  (`stage.js#lookHeld` · `lookWant`). A MATCH: the host stamps `game.look` at the start (`index.js#start` → `director.js#createGame` —
  its Game look, AUTO = the sun at its place; never for a solo run); every phone's stage takes it (`view.js#lookLock` → `o.lookLock`, it
  always wins); a refresh / late joiner / host change reads the stamp. No rules change (`game/` has no child whitelist).
- **THE DAY HUD** (M2): by day the HUD has its own ground — a soft navy fall behind its column (`.ff-shade::before`, a radial in the foot's
  navy) — and night's inks on it: a WHITE number (GOLD on NEW BEST) in the navy outline (`--ff-out`), the top line white in a dark edge on
  every area. Measured (`freefall-play.mjs --contrast`: the frame frozen, the digits' own pixels against what is behind them, the worst
  10 %): the number 7.3–16.2 : 1, the top line 8.1–17.1 : 1, NEW BEST's gold 4.5–10.0 : 1.
- **THE WATER** (the owner's targets: Grok's mock B by day, its night recolour): ONE ripple path for both looks — Grok's ripple map
  (`assets/freefall/fx/water-normal.webp`, 512², its gentle slopes stretched × `RIP_K` = 10 at the bake — 8 bits gave terraces), two
  layers scrolled slowly → the swell; THE RINGS where the tower meets the water; THE LAMP COLUMN (the far wall's lamp, straight down the
  middle, cut into flecks by the waves; a faint amber is gated out — it read brown over the blue); the side lamps' columns narrowed to
  their hearts. DAY: the ocean blue deepening toward the bottom, the swells' faces lit sky-blue, white glints on the crests. NIGHT: dark
  teal, a few pink / violet / cyan glints, the plankton. No thin ripple lines. The water's first draw is in THE WARM FRAME (its mesh is
  never frustum-culled: the opening's draw call compiles it) — the review's "150–217 ms water frame" was the run ending on 119 (its end
  card), measured.
- **THE CALLOUTS UP:** "MIA IS OUT" + LAST ONE STANDING in the bands' zone under the number (`--ff-band-top`) — never over the floors
  below the ball; one waits while an arrival band is up (`createMatchHud({ busy })`). **S14:** a rival who HIT THE BOTTOM can't be
  caught — "MIA HIT THE BOTTOM · KEEP FALLING FOR 2ND" (`ghosts.js#madeAhead`; the lead measured to the rivals who did NOT finish); said
  once a match, a refresh too (the cartridge keeps the match's seed: `view.js` drv `said`).
- **GHOSTS:** the tags never overlap (asked again until clear of every placed tag); a wider dark rim by day.
- **THE MARK = D** (`js/core/marks.js`): the ring floor's BACK edge first (`#7d3fb8`, 4.5), the flames + core + ball as before, the FRONT
  edge with the wide gap over them (`#c35bff`); the card art's glow on a full region (a thin path's own box clipped it flat).
- **SPEED:** `?fps=1` shows THE END-OF-RUN SUMMARY on the end screen (`RUN · worst n ms · HITCH n · <cause> n× (worst ms @floor) ×3 ·
  tier path`); THE SPIKE RULE (`stage.js#SPIKE`: 4 hitches inside 20 s → one tier down, 2 a run at most, the tier left HELD — the kit's
  `ask(t, stay)`, an opt-in nobody else passes — never flaps; a pinned tier untouched); SHARE's card drawn on an idle moment
  `send.js#WARM_MS` after the end screen (≤ `WARM_MAX_MS`), encoded a frame later.
- **POLISH:** the title waits DARK for the rooftop's pictures (`is-dim`, ≤ `DIM_MAX_MS` 1.6 s) and fades in; the sky + roof fallbacks are
  the panoramas' own measured colours (never a grey slab) · **S12 THE TAPPER**: a tapped start keeps the hint + DRAG TO SPIN up
  (`is-teach`) until the tower turns or floor 1; `TEACH_MS` untouched on floor 0 brings it back · **S13**: THE DEEP + THE TRENCH lifted by
  night (`0x4a40c0` / `0x3a34a8` …) · **N3**: the finish's share frame at 600 ms (the ring at its widest), pulled back × 1.14, bloom 0.08 ·
  **N13**: the day's gold YOU HIT THE BOTTOM a deeper gold in a dark edge · the mid-run NEW BEST moment only from floor `NEW_BEST_FROM`
  (10) · the test page's SHARE busy until it settles.

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
  (F5A: `fx/water-normal.webp` is no longer shipped — the water is worked out in its shader; **`roof/grain.webp`** = THE ROOF GRAIN, made
  in code: 256², 30 KB) · **`fx/sand.webp` + `sand-normal.webp`**
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

## THE MATCH (F4B — 2 … 8 players; HIDDEN: a room THE OWNER hosts; `match.js` · `director.js` · `view.js` · `stage.js` · `matchhud.js`; HIGH RISE's match is the pattern, JAYWALK's start number for number)
ONE ball each down the SAME tower. **Only the host starts** (the console's gate: the owner's phone while the game is being built), **2 minimum**,
a late joiner WATCHES until the REMATCH deals them in. **ONE life, NO holds** (`modes.match.holds` 0 — a hidden page runs on: the judge
refuses a hold in a match by name). **THE FINISH: THE BOTTOM** (floor 200 — `made`, F3B's finish moment + hook) **or the 3:00 cap**, whichever
first. **Deepest wins, then the earlier tick** (`logic.js#rankCompare`). One round, then REMATCH (in place — the console's).
- **THE START (JAYWALK's exact start):** `count` (3 · 2 · 1 — `COUNT_MS` 3 s) → every phone writes its own GO 1.8 s before the count's end
  (a TRANSACTION, never applied locally — `kit/proof-io.js#writeMatchGo`: the stamp first, the GO behind it) → **THE FIRST GO** to land
  (`core/proof.js#firstGo` — the SERVER's time, final the moment it lands) **picks the seed** (`logic.js#seedOf(code, matchId, g0)`) **and
  sets tick 0 = that time + 2 s** (`match.js#GO_LEAD_MS`) **for everyone** — `match.js#matchStart`: the phones, the host's director and the
  server derive the same start from the same nodes (**THE NODES ARE THE TRUTH** — `startOf`: the game's own seed only when there is no node
  to read). The tower SPINS UP as the real seed lands (the solo run's 0.42 s whip). No GO anywhere 3 s after the count (no signal, the
  rules not published) → the match plays **UNPROVEN** on a stand-in seed, never counted, and ends after 90 s; a FIRST GO the server stamped
  before the host gave up takes the mark back (`goBeforeGiveUp`). A GO later than `GO_WINDOW_MS` (5 s) after the first is no run (`late go`).
- **EACH PLAYER's PROOF in their own `ff` node** (F4A's — the packed input log's FINAL events, a chunk every 250 ms while there are new
  ones, each stamped by the server on arrival, `e` behind the last one): nothing new in the rules file (F4A's `ff` block already took a
  match's GO in the count's last 2 s, the stamp, the leaf writes gated on the player's own `go`, `k`).
- **THE END** (`director.js#nextStep`): every player's run has ended — their node says `e`; a silent phone is waited for: online
  `IDLE_OUT_MS` 18 s (the darkness has ended a ball nobody steers within 9 s), offline + `DROP_WAIT_MS` 75 s (THE DROPPED SIGNAL) — or the
  3:00 cap + its grace (`match.js#END_GRACE_MS` = 9 s — FIX C N15: the doc said 4 s). **The results are THE JUDGE's replay of each player's own node** (`proof.js#judgeMatch`: THE FIRST GO's seed +
  clock — tick 0 = `playAt` for everyone — the speed check both ways, THE DROPPED SIGNAL; `director.js#scoreMatchNode`), never a number a
  phone claims. A row: `{ f, t, w, e, b, bl, br, ft?, cut?, bad? }`.
- **THE SERVER** (`api/_lib/freefall.js#freefallMatch` in `/api/report`'s proof path — the 8 functions stay 8): every named player — and
  everyone the TREE proves started on time, named by the host or not — replayed from their own node; `played` = passed a floor in the
  server's replay; no report while a run is still LIVE (`match.js#liveOf` → 425 `still_live`: THE CONSOLE FIX — a live proven run is never
  taken away by the host). Behind THE SWITCH: `would_count` for every player, nothing written.
- **THE SCREEN** (`view.js#pumpMatch`, ten times a second + at every state change): 3 · 2 · 1 · GO + the names lined up → the run →
  **OUT = the cause's words over the scene for a moment** (HIT THE RED · THE LIGHTS WENT OUT; THE BOTTOM: YOU HIT THE BOTTOM in gold; the
  cap: TIME'S UP) → **Call the Winner** (the match kit's — your own node's `k`, while two or more are still falling; a right call earns
  game-night points: `match.js#scoreCalls` → `nightBonus`) → **WATCH THE LEADER** (a tap = the next player; the WATCHING line names them +
  their floor) → the podium with the host's step. **THE RUN HOLD** (`holdsRun` — the kit's): this phone's own proven run is played to its
  own end whatever the host's state says; the podium waits for a rival's run still live (`createLiveWait(liveOf)`) and is then scored from
  the nodes as they stand. A phone whose own GO missed the start WATCHES, told plainly (YOU MISSED THE START — NOT COUNTED). A refresh
  mid-match takes its own run back up from the node (its moves so far replayed — `stage.js#adopt({ log })`) if the darkness has not
  ended it. The last half minute shows a small clock (0:27).
- **THE TEST PAGE's BOT ROOM** (`?mode=match&rivals=N` — `matchsim.js`, lazy; `&watch=1` = OUT watches the leader; `&simshift=ticks` moves
  the bots' clock for a look check): N bots on the run's own seed, turned into the chunks their phones would send (the writer's own rule:
  FINAL events, every 250 ms, 200 ms on the line) and fed to the ghosts exactly as a room's proof nodes are. Nothing counts, nothing is
  asked of any server.

- **THE NETWORK (measured — an 8-player match against the free Spark plan; the pass log has the table):** a busy player writes ≈ 2.2
  times a second (≈ 21 KB a minute up); every phone mirrors the whole `ff/{matchId}` tree — ≈ 25 KB a minute of its own traffic + ≈ 18 KB
  a minute a rival: **a full-length 8-player match ≈ 3.6 MB of download in all (453 KB a phone)**, a 3-player one ≈ 0.63 MB, a 2-player
  one ≈ 0.25 MB → Spark's 10 GB a month ≈ 2,900 full 8-player matches (≈ 16,000 of three). Nothing was trimmed.
- **THE OUT's ORDER:** the cause's words (2.3 s; THE BOTTOM 3.6 s) → Call the Winner (it opens once the card has left) → WATCH (it waits
  for the card AND the call). The WATCHING line is two short lines (who + their floor · your call / TAP FOR THE NEXT); a rival with no
  news is WAITED FOR by name (WAITING FOR ALICE · NO SIGNAL).

## THE GHOSTS (F4B — `ghosts.js` (PURE) · `ghost-fx.js` (their layer) · `stage.js#ghostsFrame`; JAYWALK's ghosts are the pattern)
A rival = their own input log through the SAME engine (their proof node's chunks, each read ONCE as it lands).
- **STEPPED conf → run:** THE CONFIRMED RUN = their LANDED moves, stepped to the tick of the last one — nothing assumed. THE DRAWN RUN =
  from it on to THE WORLD's TICK with **their tower's angle HELD** (no new move assumed), the ball bouncing / falling by the rules. A
  landing that would take them OUT — or over THE FINISH — **is not taken until their own end (`e`) says so**: a ghost never dies on this
  screen and stands up again. **A late chunk = a quick catch-up ARC** (110 ms + 60 ms a floor, ≤ 320 ms), never a teleport. No news of a
  held ghost for 0.9 s, or of anyone for 10 s: not drawn until there is (the rail's dot goes hollow).
- **WHERE:** on their REAL floor over the SAME slice — the world angle **(the ball's angle − their tower's) + MY tower's**
  (`ghostPhi`): they turn with MY tower. They never collide with anything.
- **THE LOOK** (`ghost-fx.js` — its own small scene drawn over the finished picture on the SAME depth buffer, after the bloom): **see-
  through balls in the player's colour** (ONE instanced sphere: a bright ring, a breath of fill, a DARK outer edge — thicker by day: it
  reads on pearl / gold / lavender floors and on the water) · **X-RAY**: the same instances drawn again where the tower HIDES them (the
  depth test turned round) as a soft outline + a faint fill on top · **THE NAME TAGS**: one instanced quad over everything, each a row of
  an atlas BAKED ONCE at the screen's own sharpness (full 3×; the name in the player's colour on a dark rim — at the count, never in a
  run), set to whole device pixels, pushed away from MY ball, stacked when two would overlap · **within ≈ a floor of my ball a ghost is an
  OUTLINE with no tag** (my own ball wrote the depth: it is always on top) · above me a ghost rides in the HUD's own lanes: fainter, no
  tag · a rival at a BREAKTHROUGH = a small echo only (eight sparks in their colour).
- **WATCH THE LEADER = an EXACT playback, 1.5 s behind the world** (`createWatch` / `stepWatch`, `WATCH_DELAY` 90 ticks: a move is final
  only at the landing after it + the next flush + the line — by then it is here): the watched player's own run on a run of its own, with
  its own events — the scene shows THEIR tower (the broken + cracked slices, the breakthroughs), the big number THEIR floor; it never
  ends before their own end is here; a move that lands after its tick was played rebuilds the playback (rare).
- **ZERO GARBAGE IN PLAY:** `stepGhost` copies a run's state field by field, the stage writes eight numbers a ghost into ONE typed array
  the scene reads, the layer's `place()` writes typed arrays made once (the static scan covers all of them).

## THE DEPTH RAIL + THE RAIL's NAMES (F4B — `matchhud.js`; HIGH RISE's altimeter turned upside down; THE FIX PASS A: the edge markers → the names)
**THE DEPTH RAIL:** a thin glowing rail at the right edge (pink → violet → blue), **everyone's dot by depth** — floor 0 at its head, **THE
BOTTOM marked at its foot** (a gold bar) — mine larger (white in a pink ring), **out = a crossed dot**, the finish gold, no signal hollow.
A dot is made once a player and moved by ONE transform when its floor changes. **THE EDGE MARKERS:** a rival five or more floors below me
= "MIA ↓12" at the foot of the screen; two or more floors above (the picture ends sooner there) = "MIA ↑3" beside the rail's head — the
nearest first, three at most each way (`ghosts.js#edgeMarks` — kept records; a marker's words are built only when they changed). The top
line reads YOUR BEST 88 · 4 PLAYING. Written only at a change — never in a frame that changed nothing; plain text + dots, no pills.
**THE FIX PASS A (Nov 27 — the owner's decision): THE EDGE MARKERS ARE GONE from the main view.** Each RIVAL's NAME sits beside its dot on
the rail instead — in its colour, at most `NAME_MAX` (7) letters (`railName` — '…' past it), 12 px bold in a dark edge; names closer than
`NAME_GAP` (14 px) are NUDGED APART (`spreadNames`, PURE — never over each other, inside the rail); an out rival = the crossed dot + a
dimmed name; a finisher's name gold. Moved by ONE transform when its place changed (the dots' own transition). `ghosts.js#edgeMarks` stays
(pure, tested) but nothing draws it. The top line never reads "0 PLAYING" (everyone down: the best alone).

## THE END SCREEN (F4B — the owner's approved mock; `endscreen.js` — ONE builder for the test page's card and the cartridge's body · `final.js` · `view.js#showFinal`)
- **THE HEADER = THE LOGO:** title-05's lettering (the opening's own WebP, its alpha) centred at the top, **~58 % of the card's width**
  (226 pt at 390 — never under 210: the script must read; `clamp(210px, 58 %, 250px)`), **the mode under it in small teal caps** (SOLO ·
  MATCH; DAILY later). In the cartridge it sits in the console frame's own header slot (`view.js` puts `endLogo` there). FREEFALL is ONE
  word everywhere — the old FREE / FALL word header is gone.
- then **the cause** (teal neon — MADE IT TO THE BOTTOM gold; never red), **the big number + FLOORS**, **"YOUR BEST · n · AVG n"** (the
  server's `o.av` once counting is ON — JAYWALK's JT2: a dash under 5 runs; **a NEW BEST puts the AVG on its own quiet line**; while the
  switch is OFF: this phone's own best, no AVG), **the run's stats line** (n BOUNCES · n BLAZES · BEST RUN n), **YOUR TABLE** (slim cards
  through `ui/strip-board.js` — JAYWALK's + HIGH RISE's: you + your friends' bests, the floors at the right, their AVG under them; empty
  while counting is OFF), the small would-line (WOULD COUNT · …) just over the bar.
- **A MATCH's body:** how YOUR run ended · "57 FLOORS · YOU FINISHED 2ND" · your call's result — the frame's own WINNER line leads ("MIA
  FELL THE DEEPEST"), the console lists every place under it as slim cards with their floors + how their run ended.
- **THE FOOTER = THE SITE's UNIVERSAL END-SCREEN FOOTER**, exactly as the other games use it: the PLAY AGAIN bar (a match: REMATCH), then
  the quiet links with the same drawn icons — solo **SHARE | HOME**, a match **ROOM | SHARE** (`ui/final.js`; the test page carries a copy
  of its look: `.ff-links` — its SHARE hands the phone's own share sheet a line + the page's link: no card, no server). The dimmed game
  scene stays behind it; no pink flash; a phone held sideways + a desktop scale it with the stage's column.

## THE SHARE CARD (F4B — the owner's approved mock; `share.js` (lazy — the cartridge's alone) · `shot.js` (pure) · `night.js#snap`; the kit's `share-run.js#drawRunCard`; HIGH RISE S5's pattern)
**1080 × 1350.** THE LOGO (title-05's lettering, 580 px wide) at the top + the mode line in teal — **SOLO** · **MATCH · 2ND OF 4** (the
place from the judge's standings) — through the kit's new opt-in `o.head(c, card)` (a cartridge's own head in the place of the NEON
SPEAKEASY sign + the game's line; the other games pass none). **THE HERO FRAME = the REAL end frame** in HIGH RISE S5's box (984 × 792
at 48, 348; one teal neon edge), **the cause in a dark tab top-left** (HIT THE RED · THE LIGHTS WENT OUT · TIME'S UP · **YOU HIT THE
BOTTOM** — the finish is GOLD: the edge, the tab's words, the number); **inside the frame's foot the big glowing FLOORS number**
(white-hot, a cyan glow; Chakra Petch numerals) with FLOORS under it, **the deepest AREA reached beside it** (lavender — a long name wraps
to two lines) **+ the BLAZES count in fire orange**, a darker fade behind them; **the player's name under the frame; NEONSPEAKEASY.COM
at the foot** — big (52 px), bold, white in a pink neon glow, plain text (no pill). Everything reads at 360 px wide (nothing under 46 px
of the card's 1080).
- **THE FRAME** (`shot.js` + `night.js#snap(bw, bh, rect)` — the frame JUST drawn copied off the canvas in that frame: no
  preserveDrawingBuffer): **F5A: the frame is STAGED — the moment a beat BEFORE the end, drawn once more for the card alone ("THE SHARE CARD's HERO FRAME TELLS
  THE STORY", above).** It is taken a beat after THIS phone's OWN run ends — `SHOT_AT` red 200 ms · dark 240 · cap
  60 · made 410 (the seabed's impact) — never of a WATCHED player's run, never a watcher's; kept on this phone under the run's key
  (`o.shotKey()` — the cartridge: its match id; else the run's seed) until the next run. THE LIGHTS WENT OUT: the game's darkness is a DOM
  layer over the canvas — the card lays the same dark round the ball itself.
- **SHARE** (`index.js#shareRun` — the console's universal footer shows SHARE for a cartridge with it: solo + match): the card is DRAWN
  while the end screen is read (`final.js` → `warmShare`), **the link uploaded only at the first SHARE tap**, fitted under the server's
  cap (`fitPng`). **Behind the switch:** the server takes a run's card only with its own COUNTED result (`api/_lib/share-card.js
  RUN_GAMES` + `freefall`) — none while `FREEFALL_COUNTS` is off; the phone asks nothing once the server has said WOULD COUNT
  (`globalThis.__ffWould`, or the report's own answer) → **the picture alone goes out**, no link, no text.
- The test page's graph gains `shot.js` alone (pure state); its own SHARE is the phone's share sheet with a line + the page's link.
- Shots: `Downloads\NEON\freefall-f4b\share\` (every cause + a match place + THE BOTTOM's gold + 0 floors + THE TRENCH, night + day, at
  1080 × 1350 and 360 px wide; the raw frames; the beats' contact sheets `SHOT_AT` was picked from). `node
  tests/integration/freefall-share.mjs "<chromium>" [outDir] [--cap] [--only=…] [--looks=…] [--beats=<run>:<ms>,…]`.

## THE TWO FIXES (F4B's Group 0)
- **THE PAUSE GAP** (the owner: "a pause is granted only after the moves before it are sent + stamped; nothing arrives late" — F4A's
  reviewer: the 8 s of play before each hold could arrive at any time, the run's clock stood at the hold): **a hold FREEZES the clock only
  when it was GRANTED — its OWN chunk (the hold + every move before it) ARRIVED within 2 s of the hold's tick** (`proof.js CLOCK.grant`).
  A hold whose chunk came later was no pause: the clock ran on, the chunks before it are held to that running clock, and the run is
  **CUT before the hold's chunk** (`cut.why: 'pause'`; an open dropped-signal burst before it does not count either). More holds than the
  mode has (a match: any) is refused by name BEFORE the clock. The phone: a held run's log leaves AT ONCE, even behind a chunk in the air
  (the kit's `proof-writer` `flush('now')` — a phone being locked may not live to see the chunk in the air answered); back on screen it
  asks the server's copy whether the pause was granted (1.5 s — its own margin: `GRANT_PHONE_MS`); if not: no stamp, ONE count, and the
  run goes on saying NOT COUNTED PAST THE PAUSE.
- **THE SKYLIGHT's FRAME BAR** (the owner's iPhone, night, floor 40: the frame's near bar stayed across the screen at the ball's height,
  its far bar + sides as a dark bar at the top — in front of the tiles): **the outer frame + its neon tubes let go WITH the pane** — they
  drop away, the short's cascade inside them — **and are gone 0.25 s after the break** (`break-fx.js FRAME_GONE_S`, the deck's own
  0.25 s); the glazing bars' pieces fall with the shards (0.8 s). Once the pane breaks nothing of the skylight / the roof is between the
  camera and the floors (checked at three sizes, both looks: `freefall-play.mjs --f4b`).

## THE CARTRIDGE (F4A — HIDDEN: the owner's live test only, solo; `js/games/freefall/` `meta.js` · `index.js` · `director.js` · `view.js` · `final.js` · `lines.js`; HIGH RISE's S4A is the pattern)
**HIDDEN.** `config.js` GAMES row `freefall` = `playable: false` + `preview: true` (THE OWNER'S LIVE TEST — HE8): on the owner's phone
(the server's OWNER yes) **PLAY → FREEFALL · TEST → PLAY NOW**; nobody else is offered it, a start from another phone is refused, the
city's signs / HOW TO PLAY / THE BOARD's public tabs do not know it. **NEVER flip `playable` before its go-live pass.** What it does not
have yet is ONE named list (`tests/registration.test.mjs#FREEFALL_WAITS`: HOW TO PLAY, its tile, its public board tab → the go-live pass;
its smoke start) — it fails when it goes stale. (F4B: `RUN_CARD_WAITS` + `MATCH_WAITS` are EMPTY now — the run card and the match are built.)
- **Registered:** its ROW in THE ONE META MODULE (`js/games/metas.js` — SOLO, both looks, no options, no controller mark) + the one-line
  `meta.js`; the loader (`registry.js`); a stand-in mark (`core/marks.js` — the go-live's icon brief replaces it); the theme
  (`css/base.css [data-theme='freefall']`: teal + pink); `livePaths` = `{ runs: 'ff/{matchId}' }`; the proof node `ff` in
  `PROOF_NODE_LIST` + `NEW_PLAYER_NODES` + `LOCKED_PROOF_NODES`; `core/proof.js#VERIFIED_SOLO`; the report's lists (below). THE PER-GAME
  BUDGET: `freefall` 41 modules / 520 KB (measured 35 / 447 — three.js comes from the CDN). **THE BOOT BUDGET was not raised** — the boot
  stood at 6,499 of 6,500 KB; FREEFALL's rows took 1.3 KB, five long comment blocks of `js/config.js` moved verbatim to
  `docs/harbor/boot-headers.md` (306 modules · 6,499.2 KB).
- **THE GAME = THE SAME STAGE** (`stage.js` — the module /freefall-play mounts) in the console's frame (`.ff-stage.ff-game`: it fills the
  window, as HIGH RISE's). The stage still writes NOTHING itself; the view hands it its hooks:
  `o.go()` → `{ seed, t0, note }` (the GO) · `o.resume(i)` (a hold's way back, stamped) · `o.onFrame` (the proof's chunks) · `o.onOver` /
  `o.onEnd` (→ `{ own, note }`: a proven run ends on the console's podium, an unproven one on the stage's own card) · `o.onHide` ·
  `o.onLeave`. The look = the console's GAME LOOK (`body[data-look]`, read live). YOUR BEST = the server's last answer (`ff:best`) once
  counting is ON — this phone's own (`ff:play:best`) while the switch is OFF; a cartridge run never writes it.
- **THE START:** THE OPENING as on the test page; **the first DRAG is the start** — it writes GO (below). The opening stands on a
  stand-in tower (the seed is picked AFTER the GO): the GO's own floors take their place as **the tower SPINS UP** — one whole turn,
  eased, 0.42 s (`stage.js#WHIP_MS`; a view's turn: it ends where it began; reduced motion: none). Tick 0 = GO + 600 ms: the ball always
  drops in from the same height; a move before tick 0 is kept and turns the tower from tick 0.
- **THE END:** the player's node gets `e` (behind the last chunk) → the host's step (`director.js#nextStep`) writes `final` with THE
  JUDGE's own row (`scoreNode` — the host's replay of the node, never a number the phone claims) → the console's podium frame
  (`ui/final.js` — its kicker FREEFALL · SOLO: ONE word in two colours, `ui/fin-neon.js`'s joined word) with FREEFALL's body (`final.js` — the test page's card, ONE builder: the cause, the floor, FLOORS, YOUR BEST, the one
  line, then the server's line). **PLAY AGAIN = the console's INSTANT AGAIN** (`soloAgain` — the next run is a match of its own): back on
  THE OPENING, the scene kept warm (the stage is parked + moved into the next view: `moveTo` — the same canvas, no new WebGL context).
  **THE LOGO HEADER, SHARE, YOUR TABLE and the "YOUR BEST · n · AVG n" line are F4B's end screen** (the data is wired: the server's answer
  carries `bests` + `av`; `lines.js#bestAvgLine`).
- **An UNPROVEN run** (GO refused / unanswered / answered more than 2.5 s late: no signal, the rules not re-published) still PLAYS — on a
  seed of its own, never counted — SAYS SO for as long as it is on (the quiet line at the foot: NOT COUNTED — NO LINE TO THE BOARD / NO
  CONNECTION) and ends on the stage's own card (PLAY AGAIN · BACK — no SHARE). **PLAY AGAIN there starts a NEW match** (the fresh-eyes
  review: the spent match never ended — every PLAY AGAIN stayed uncounted): the host — the same phone, a room of one — marks the run
  ended (`game.x/{uid}`), `director.js#nextStep` closes the match (the judge's row of a node that is not there: floor 0, never counted),
  THE INSTANT AGAIN starts the next one with its own GO; no line → the stage starts over in the same match and says so. A refresh mid-run: the run's clock ran on — its end is written from
  the node as it stands (`view.js#strand`).
- **A room of two or more can not start it** (`index.js#start` → null: the console's COULD NOT START) — THE MATCH is F4B.

## THE PROOF (F4A — `proof.js`, PURE: the phone, the host's director and the SERVER run it; JAYWALK's `jw` + HIGH RISE's `hr` are the pattern — docs/match-kit.md "THE PROOF TREE")
```
rooms/{CODE}/ff/{matchId}/
  t0                 THE STAMP — the tree's first write (the SERVER's time, with the room's tree counter `pt`): a GO only within 5 s of it
  {uid}/go           the SERVER's time, once — the SEED is picked from it (logic.js#seedOf(code, matchId, go)); tick 0 = go + 600 ms
  {uid}/c/{i}        { s: a chunk of THE PACKED INPUT LOG, at: the SERVER's time it ARRIVED } — append only, i 0 … 9999, ≤ 400 characters
  {uid}/h/{0 … 2}    a HOLD's way back: the SERVER's time the 3 · 2 · 1 began — the run goes on 2.4 s after it (re-written at every count)
  {uid}/e            { f, t, w } — the run's end, once: a SIGNAL for the host's step, never read as a score
  {uid}/k            Call the Winner (F4B's match — the rule ships now)
```
- **THE INPUT LOG = the changed ticks only, packed** — `replay.js#packLog`'s own text (a move: `[.gap]±units`; a hold: `!gap`). A chunk
  is that text cut BETWEEN two events (`packRange`): the chunks, joined, ARE the packed log (`logFromChunks` refuses anything else —
  a hole, a chunk that does not begin an event, a text that is not canonical).
- **ONLY FINAL EVENTS GO UP** (`finalCount`): the engine may still merge a later move into its LAST entry (two moves at one tick are one
  entry; a tick that ends where it began leaves none) — never into an entry at or before a landing ALREADY DECIDED, a hold, or the end.
  A landing comes every 0.6 s at most, so nothing waits long; the writer (the kit's `proof-writer`) sends every **250 ms** while there
  are new final events (the owner: chunked ~200–250 ms), one burst at a time, a refused chunk sent again, `e` behind the last one.
  PROVED: 400 phone-like sessions (moves that arrive with EARLIER event ticks, two at one tick, holds) — the chunks are exactly
  `packRun` (`tests/freefall-proof.test.mjs`).
- **THE SPEED CHECK, BOTH WAYS + THE DROPPED SIGNAL** (`clockProblem` — JAYWALK's numbers): a chunk's last event at most 2 s AHEAD of its
  own arrival (a log made in advance, a sped-up game → the run is REFUSED) · its first event at most 8 s of play BEHIND it, with no
  silence to explain it (slow motion → the run is CUT at its last on-time event: the tower then stands still and the rules end it) · a
  silence ≤ 75 s then the queued chunks landing together, back on the clock within 15 s = honest. More chunks than its own clock allows
  (7 a second) = refused before a character is unpacked (`core/proof.js#overChunkCeiling`).
- **THE HOLD's CLOCK (solo only — a match / the daily never holds: the judge refuses one there (FIX C — DECIDED, Ben Nov 26: the pause IS allowed in the daily, 3 a run — switched on by the DAILY pass; `MODES.daily.holds` = 0 until then)).** A hold is a logged event (`!`); it
  goes up as the page hides. The run is played on THE RUN's CLOCK: a hold freezes it — the time away is no lateness (the tail a locked
  phone could not send lands when it is back) — and it goes on at the hold's tick at `h/{i}` + 2.4 s (the server's stamp of the way
  back; the phone's 3 · 2 · 1 is counted from that stamp — its number never jumps back up). A stamp before its own hold = refused
  (`hold clock`); **events past a hold whose way back was never stamped — or that lie AHEAD of a stamp that landed LATE (the phone had
  gone on without it: the fresh-eyes review's HIGH — that run was refused whole) — = the run is CUT at that hold** (counted through
  it). The phone runs the count again up to three times for a stamp, then goes on, SAYS it is not counted past the pause, and sends
  nothing past that hold (`view.js` `capN`). AHEAD in the run's FIRST segment stays a refusal (a log made in advance).
- **THE JUDGE OF A NODE** (`judgeNode` / `judgeSolo` — the host's podium with `mirror`, the server strict): the chunks → the log + its
  clock → the checks above → `replay.js#judgeRun` (the SAME engine the phone ran). The floor is the judge's own.
- **THE RULES** (`database.rules.json` `rooms/$code/ff` — HIGH RISE's `hr` block mirrored): the player's own uid + own match only; THE
  STAMP always required (a new node has no switch-over window); GO once, the server's time; a chunk / a hold stamp only AFTER GO and
  NOTHING after the end; a chunk's text only the packed log's alphabet; a hold stamp = the server's NOW, 0 … 2; the host only prunes a
  finished match's tree. **Until the owner re-publishes the rules a cartridge run plays UNPROVEN** (nothing breaks).

## THE JUDGE ON THE SERVER + THE SWITCH (F4A — `api/_lib/freefall.js` wired into `/api/report`; the 8 functions stay 8)
- `verifyRun({ code, matchId, node })` = `proof.js#judgeSolo`, strict. `freefallSolo` builds THE SERVER'S OWN RESULT from the reporter's
  proof node (`sv: 1` — only such a match earns a record / a feat flag: `core/match-report.js#freefallExtra`); the room's own results are
  never read. `freefallMatch` is a STUB until F4B; the daily stays off. `api/report.js`: `PROOF_GAMES.freefall` · `trust-lists.js`
  (`PROOF_NODES` · `PROOF_TREES` · `FLAT_PROOF` · `GO_TREES`). A game being built: only THE OWNER's report is judged at all
  (`reportableGame` — everyone else: `not_reportable`).
- **THE FEATS from the server's replay alone:** `reachedHarbor` (floor 120) → `harbor` · `terminal` (15 floors in a row without a
  bounce, the blaze's shatters included) → `terminal` · `reachedBottom` (floor 200) → `bottom` (the row's `ft` → `out.f` →
  `pstats.pa.gf['freefall-…']`).
- **THE SWITCH — OFF** (`api/_lib/freefall.js#FREEFALL_COUNTS = false`; HIGH RISE's S4A switch is the pattern — `report.js#SWITCHED`:
  ONE path for HIGH RISE's kill switch + FREEFALL's): the run is JUDGED and the answer is `status: 'would_count'` + what the counted
  path WOULD have done (the SAME pure step on a copy — `stats.js#wouldApply`, reads only): the floor, XP, the streak, a best, the cards
  by their feat. **NOTHING of a player's progress is written** — no `results/`, no pstats, no profile, no board row, no card, no streak day (the route's
  own bookkeeping still runs on every report, as for every game: `seen/` — the account's hashed address — and its call budget `rl/`; the `/api` test
  compares the WHOLE database outside the rooms before / after). The owner's phone shows the line under the end card: **WOULD COUNT ·
  FLOOR 12 · +15 XP · NEW BEST** (`lines.js#wouldLine`; `WOULD NOT COUNT · REFUSED (…)` for a refused node). THE GO-LIVE PASS sets the
  ONE line to true. On the LOCAL EMULATORS a test flips it (`testFreefallCounts` — never honoured in production).

## THE BOARD + THE AVERAGE (F4A — the owner: "like JAYWALK, in all the same spots")
`core/boards.js`: `freefall: { records: [rec('freefall-solo', 'DEEPEST RUN', 'int', { short: 'FLOORS', avg: { days: 14, min: 5 } })] }` —
the value = the floors of a run the SERVER replayed (a counted MATCH run will raise the same best: F4B). **THE AVERAGE** = JT2's
(`core/board-avg.js`, generic): the counted SOLO runs of the last 14 PLAYED days, shown from 5 runs (a dash under 5), the ranking stays
BEST — in every spot JAYWALK's shows: THE BOARD's rows + YOUR row (BEST, then AVG n), the game card's board preview strip, the server's
answer (`o.av` — F4B's end card: "YOUR BEST · n · AVG n", `lines.js#bestAvgLine`). THE BOARD's FREEFALL tab is wired + HIDDEN
(`board/view.js#HIDDEN_TABS`: on the owner's phone only; the go-live moves it into `TABS`). Nothing is written to the board while the
switch is OFF.

## THE CARDS (F4A — hidden catalog; HIGH RISE S4A's pipeline: `scripts/build-freefall-cards.mjs` · `js/fx/ff-specs.js`)
| card | tier | unlocked by (the SERVER's replay only) | art |
| --- | --- | --- | --- |
| **SPLASHDOWN** `card-splashdown` | rare | reach UNDER THE HARBOR — floor 120 — in one counted run (`harbor`) | `splashdown.png` |
| **TERMINAL VELOCITY** `card-terminalvelocity` | epic | 15 floors in a row without a bounce, blazes included (`terminal`) | `terminal-velocity-v1.png` — the ORANGE fire (never `terminal-velocity.png`) |
| **ROCK BOTTOM** `card-rockbottom` | legendary | reach THE BOTTOM — floor 200 — solo or match (`bottom`) | `rock-bottom.png` |

- **THE ART:** `node scripts/build-freefall-cards.mjs "<browser>" [previewDir]` reads Grok's masters (1920 × 1080) from
  `<NS_ART_SRC>\freefall\cards\` — or the owner's delivery `Downloads\grok\freefall\cards\` — and bakes `assets/vault/ff/<art>.webp`
  (1280 × 720, 50–76 KB). **RAW ART OFF GIT: no master is in the repo**; the -b files are unused. `js/fx/ff-specs.js` = the crops + the
  hero boxes in ONE place (= the CSS `.vl-s-ff-*` / `.vl-fcm-ff-*`): the slim card's face to the RIGHT (the hero 0.78–0.79 across, clear
  of the tier gem), the left its dark ground for a 12-letter name; the full card's art set right at 80 %.
- **WIRED:** `api/_lib/catalog.js` (the three items + the achievements `splashdown` · `terminal-velocity` · `rock-bottom` on the feat
  flags — never a number), `js/vault/strip.js` (the materials — the picture alone: no layer of their own yet), `vault/hero.js` +
  `vault/layout.js`, THE LAB 231–236 + its text (`api/_lib/lab-text.js`). **HIDDEN until go-live:** nothing is awarded while the switch
  is OFF, and a collection shows only what its player owns.

## THE F3B FIXES (F4A's Group 0 — the owner's phone + the review of F3B's shots; `docs/games/passes/freefall-f4a.md`)
- **THE HAZE AFTER A BREAKTHROUGH** — measured first (`freefall-play.mjs --haze`: the ball goes through and stays on the first floor
  under it; the colour of the three floors below, read off the picture 0.3 · 0.5 · 1 s after the hit against 3.5 s after it). Found:
  the floors under THE SKYLIGHT 22–68 % darker 0.3 s after the hit, 17–32 % at 0.5 s (both looks) — **the roof's deck lies IN FRONT of
  them from the play camera and faded out over 0.8 s** → gone in 0.25 s. THE SPLASHDOWN's two causes, with the ball falling on: by day
  the haze the tower fades into was the BALL's area's, eased over a second (the speakeasy's warm haze on the harbor's pearl floors:
  brighter, less colourful) → **THE HAZE FOLLOWS THE FLOOR, never the clock**: the border in sight splits the tower — the floors above
  it fade into their area's haze, the floors below into theirs (`uFog` / `uFogB` / `uFogSeam`, strength + caustics too) — whole from the
  frame the ball goes through; and the water plane swept off the floors in 0.6 s → 0.35 s. The covering debris is short (glass dust
  0.3–0.4 s, foam + spray 0.3–0.5 s; the shards are thrown clear of the tower's column). After: every floor within 3.3 % of its settled
  colour from 0.3 s on — both looks, all three breakthroughs (a flying shard / bar crossing one point is the moment's own debris: the
  check takes the middle reading of the three floors).
- **THE SOLO "YOU HIT THE BOTTOM" BAND** was the gold band — seen in its 0.26 s fade with THE TRENCH's band a floor behind it. It now
  SNAPS in (0.09 s), stays whole to 2.05 s of its 2.2 s (`banner.js#BANNER_GOLD_MS` / `BANNER_GOLD_KEYS`) — solo + a finish alike;
  THE TRENCH's band crosses after it.
- **THE DARKNESS, look only** (timing, steps + rumble untouched): by day the step's edge is a DARKER rim of the cloud / the dark / the
  murk — no pale stripe through the big number; **THE LIGHTS ARE GOING OUT lies in the band's lane** under the number and ends 5–27 px
  above the ball's highest point (375 × 667 · 390 × 844 · 430 × 932) — a ball that lets the darkness this close has stopped: no band,
  no call is up; **the day BLAZE!** = pale letters on a dark, warm backing (it was orange on the orange flame).

## THE END-BOARD SWITCH-ON (Nov 27 — docs/games/passes/endboard.md)
The shared block went on for JAYWALK, HIGH RISE, PRISM DROP + OVERCLOCK; FREEFALL is untouched — pixel-identical to F5C on 13 A/B shots
(`Downloads\NEON\endboard\freefall-unchanged\`). The block now wears each game's accent: FREEFALL keeps F5C's pink (its FREE pink —
`css/freefall-play.css` `.ff-final .final.has-eb .eb`).

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
js/games/freefall/meta.js index.js director.js      THE CARTRIDGE (F4A — hidden): its meta row's re-export · the contract · the pure host step
js/games/freefall/view.js final.js lines.js         … its screen (the stage + what a run WRITES) · the podium's body · the board's lines (pure)
js/games/freefall/billboard.js                      THE BILLBOARD's painter (F5A — pure canvas; in no game's graph)      scripts/build-freefall-billboard.mjs → assets/city/freefall/billboard.webp
tests/integration/freefall-billboard.mjs            … its READABILITY PROOF in the city (local) · tests/freefall-billboard.test.mjs (static)
assets/freefall/roof/grain.webp                     THE ROOF GRAIN's detail tile (F5A — made in code: scripts/build-freefall-assets.py --only=grain)
js/games/freefall/proof.js                          THE PROOF (F4A — pure: the phone, the host, the server): the chunks, the clock, the holds' clock, the judge of a node
js/games/freefall/match.js                          THE MATCH's RULES (F4B — pure): the start (THE FIRST GO), the end, the live runs, Call the Winner
js/games/freefall/ghosts.js ghost-fx.js             THE GHOSTS (F4B): stepped conf → run, the catch-up, WATCH's playback, the rail's + the markers' maths (pure) · their layer (the balls, the x-ray, the baked tags)
js/games/freefall/matchhud.js matchsim.js           THE MATCH's HUD (the count, THE DEPTH RAIL + the rivals' names on it — FIX A retired the edge markers, the OUT card, WATCHING) · the test page's BOT ROOM (lazy — never in the cartridge)
js/games/freefall/share.js shot.js                  THE SHARE CARD (lazy — the cartridge's) · the end frame's record (pure)
js/fx/ff-specs.js  assets/vault/ff/                 THE CARDS' crops + hero boxes · their art      scripts/build-freefall-cards.mjs
js/games/freefall/sounds.js sfx.js audition.js      the sounds' table + triggers (pure) · the player · the SOUNDS list
assets/freefall/walls/ sky/ roof/ title/ fx/  audio/freefall/  the eight walls (night + day) · the rooftop's two panoramas · the roof below + its city (F3B) · the title (F3) · the flame atlas + the breakthroughs' textures (F3B) · the ten sounds      scripts/build-freefall-assets.py
freefall-lab.html  css/freefall-lab.css             THE LAB + its HUD (prefix ff-; self-contained: no tokens, no web font)
js/games/freefall/tuning.js                         THE RULE-SET TABLE + the classic row by name (pure, imports nothing)
js/games/freefall/tower-gen.js                      THE TOWER: buildFloor + the angle maths + the fairness checks it builds by (pure)
js/games/freefall/engine.js logic.js replay.js      THE RULES (pure — the phone AND the server): the step · the words, the seed, the areas, the ranking · the replay, the judge, the packed log
js/games/freefall/bot.js                            the sim bots          scripts/freefall-sim.mjs   the 2,000-seed table
js/games/freefall/lab.js graybox.js                 THE LAB's page · its three.js graybox
api/_lib/freefall.js                                THE JUDGE's server half (pure; F4A: wired into /api/report — verifyRun · freefallSolo · THE SWITCH)
tests/freefall-engine.test.mjs (25) · freefall-tower.test.mjs (11) · freefall-server.test.mjs (8) · freefall-sim.test.mjs (9) · freefall-lab.test.mjs (5 — the static half) · freefall-play.test.mjs (16 — F2 + F3 + F3B, static)
tests/freefall-proof.test.mjs (6 — F4A: the chunks, the judge of a node, the holds, both clock bounds, hostile nodes) · freefall-cartridge.test.mjs (8 — F4A: the registration, the director, the server's result, THE SWITCH, the cards, the board + AVG)
tests/integration/e2e-freefall.mjs (53 — F4A, the emulators: the hidden cartridge end to end) · rules.test.mjs "FREEFALL F4A" (the ff node) · server.test.mjs "FREEFALL F4A" (the report, the switch OFF / ON)
tests/integration/freefall-play.mjs (152 — the browser: the test page, both looks; --f3b · --f4a (Group 0's 18) · --haze (measure only) · --look · --perf · --stutters)
tests/freefall-match.test.mjs (9 — F4B: the steps, the judge of a match == the live runs on 8-player sims, hostile match logs, Call the Winner, THE GHOSTS, WATCH's exact playback) · freefall-share.test.mjs (7 — F4B: the card)
tests/integration/e2e-freefall-match.mjs (F4B, the emulators: a real 3- + 8-player match end to end) · freefall-share.mjs (the card from REAL end frames) · rules.test.mjs + server.test.mjs "FREEFALL F4B"
tests/integration/freefall-play.mjs --f4b (the frame bar · the bot room: ghosts, rail, markers, WATCH) · --perf8 (60 fps with 8 ghosts, every tier, 1× + 4× CPU, both looks) · --look --scenes=match,end,framebar
tests/integration/freefall-lab.mjs (57 — the browser: real drags at 390 × 844 + 375 × 667 · 430 × 932 · 1440 × 900; scripts/serve.mjs is enough) · kit/page-loads.mjs (/freefall-lab)
```

## COMING
**F5C (Opus) — the tie-break, the edge markers, the rival OUT sound + callout, LAST ONE STANDING, HOW TO PLAY, the mix + the credits**
(the owner, Nov 27 — TIES for first = who reached their final floor first, then more blazes, then a draw; F5B built the fixes, THE WATER
SWAP + the end screens' FINAL SHAPE). Then the review (Opus, + Grok's review cross-checked), the fix pass, the go-live (`playable:
true` · `FREEFALL_COUNTS = true` · the public board tab · HOW TO PLAY · the site's Credits group — every source is CC0:
`assets/freefall/CREDITS.md` · `audio/freefall/CREDITS.md`; **the CITY chat installs the sign + THE BILLBOARD**). THE DAILY (later, the
dailies chat): three tries all day, the best counts; **THE PAUSE IS ALLOWED in a daily** (the owner, Nov 26 — "THE PAUSE IN DAILIES",
above). Open questions for the owner: `docs/games/passes/freefall-f5a.md` "OPEN FOR BEN".

## MODULE NOTES (moved FREEFALL FIX A, Nov 27)

The long comments of FREEFALL's cartridge modules, moved here VERBATIM so the cartridge carries code, not history (THE FIX PASS PART A, Group 0 — the review's M3: FREEFALL's budget line had 1.4 KB left). Each moved block keeps its FIRST line in the code, marked `(→ §n, docs/freefall.md MODULE NOTES)`; §n counts per module. A pass that changes the code next to a block updates it here (and keeps the code's own comment short).

### js/games/freefall/bakedtext.js

**§1** (above ``)

```js
// FREEFALL — THE BAKED NUMBER (F2 — docs/freefall.md "THE BAKED HUD"; HIGH RISE's bakedtext.js, its S5 EFFECTS REBUILD): a glowing number
// repainted at every floor makes the browser re-rasterise its text-shadow's blur — the owner's iPhone A/B in HIGH RISE named it the
// first cost over the game. SAME LOOK, no blur in play: each digit is drawn WITH ITS GLOW ONCE (from the number's own computed style —
// its font, colour, every text-shadow: the CSS stays the one source of the look, the gold included) into a small bitmap; a floor then
// only COPIES the 1 – 3 digits' bitmaps into ONE canvas over the number (drawImage — no blur, no text layout). The digit boxes
// underneath keep the layout + the reading (aria-label) with transparent, shadowless text. A style change (gold, a resize) picks another
// baked set; the plain + the gold one are WARMED behind the opening (stage.js) — nothing is baked in a live frame.
// DOM + canvas only — no rules, nothing counts.
```

### js/games/freefall/banner.js

**§1** (above `import { h } from '../../ui/dom.js';`)

```js
// FREEFALL — THE ARRIVAL BANNERS (F3 — docs/freefall.md "THE ARRIVAL BANNERS"): on reaching an area a band crosses the screen — "THE
// SPEAKEASY" big, "FLOOR 80" under it — for 1.6 s. F3B (the owner): the band lies UNDER THE BIG NUMBER (it never covers a floor below the
// ball), and THE BOTTOM's is GOLD ("YOU HIT THE BOTTOM"). NIGHT = a dark band between two thin pink rules, white words in a pink glow;
// DAY = a frosted pale band, navy words (the stylesheet: .ff-banner — the CSS is the one source of the look).
// BAKED TEXT (bakedtext.js's way — HIGH RISE's lesson): a band's two lines are drawn WITH THEIR GLOW ONCE into a canvas of its own.
// F3B — THE STUTTERS: EVERY band of a run is its OWN NODE, built + baked BEHIND THE OPENING (the stage prepares the areas' six + the
// trench's first lap at a restart; they are KEPT — the next run builds nothing) and kept PAINTED (a node at rest is all but clear, never
// hidden: its layer is already on the GPU). AN ARRIVAL TOUCHES NO DOM: it runs one Web Animations one-shot (opacity + transform) on the
// band's own node — no text written, no class turned, no canvas swapped, nothing laid out. Only a later trench lap's band (281 · …) is
// built in a run, between two arrivals. The words stay in each node for the bake's measure (transparent under the canvas); a reader
// hears the arrival from the list's own live line, written a moment AFTER the band is up. DOM + canvas only — no rules, nothing counts.
```

### js/games/freefall/best.js

**§1** (above ``)

```js
// FREEFALL — YOUR BEST (F2 — docs/freefall.md "YOUR BEST"; HIGH RISE's best.js pattern): PURE (no DOM, no storage — the page hands the
// numbers in). YOUR BEST = a GOLD TAPE round the tower at your best floor (night.js#setBest — in sight when you are within nine floors
// of it) + the line at the top of the screen. The landing that takes the ball PAST it (the floors passed = best + 1) is the crossing:
// NEW BEST, once a run. A first-ever run has no best: no tape, no line. (F2: the best is THIS PHONE's — nothing counts yet.)
```

### js/games/freefall/break-fx.js

**§1** (above ``)

```js
// FREEFALL — THE BREAKTHROUGHS' SHADERS (F3B — docs/freefall.md "THE BREAKTHROUGHS"; breaks.js builds the pieces, night.js owns the ONE
// scene). GLSL text only: no three.js, nothing runs here. A VIEW's: the rules never read any of it. Everything is written in LINEAR light
// and ends in three's own colour-space chunk; every material carries `uBloom` (1 = the bloom pass: only what GIVES light is drawn) and
// reads `uDay` (ONE scene, both looks). A picture's rows: `uFlip…` = 1 when its top row is at t = 0 (an ImageBitmap) — the scene's rule.
```

**§2** (above `export const BURST_V = /* glsl */'`)

```js
// ---- THE SPRITES (a FIXED pool of quads, flown HERE — the tiers trim how many are shed, never the pool): dust + foam + mist (soft
// clouds), plankton + sediment + a firework's stars (a soft dot), bubbles (a ring), sand + spray (specks), a glint, the impact's burst —
// Kenney's Particle Pack (assets/freefall/fx/burst.webp: 4 × 2 cells). A sprite = its start (aO), its throw (aV), aT (its birth, its
// life, its size at birth → at its end), aK (its cell, its gravity, its drag, a seed), aM (how far it swirls, its spin), aC (its
// colour + how much it COVERS: 1 = a cloud that hides what is behind it, 0 = pure added light).
```

**§3** (above `export const FRACT_V = /* glsl */'`)

```js
// ---- A PANE THAT BREAKS (the skylight's glass · the seabed that cracks open): ONE instanced mesh of TRIANGLES — the pieces it will break
// into, laid out once round the point of impact (breaks.js#fractureGeo). At rest they ARE the pane (one draw call, intact); the CRACKS are
// drawn along the very lines it will break on (a piece's own edges — its barycentric coordinates), racing out from the impact; then each
// piece flies: its throw, its tumble, gravity — nothing is stepped on the CPU. aP0 · aP1 · aP2 = a piece's corners in the pane's plane,
// aV its throw, aR its tumble (axis + spin), aD (the delay before it lets go — the crack front reaches it —, a seed).
```

**§4** (above `export const WATER_V = 'varying vec3 vW; varying vec4 vClip; void main`)

```js
// ---- THE WATER (THE SPLASHDOWN — floor 120): a real plane across the shaft. F5A — THE WATER SURFACE REBUILT to the owner's two targets
// (Downloads\NEON\freefall\ff-water-target-night.png · -day.png; docs/freefall.md "THE WATER"): everything is worked out HERE, in the
// shader — Water 001's normal map is no longer read (two layers of it read as crinkled foil / an oil slick on the phone).
//   · THE SWELL: four long, slow waves on a warped ground (their slopes) — large, smooth, slow; flatter with distance
//   · NIGHT: deep TEAL-NAVY, a soft lift toward the far edge; the speakeasy's own lights as long BROKEN VERTICAL STREAKS — a streak's
//     colour is the COLUMN of the wall painting above it (the mirrored ray's angle on the shaft's cylinder, read soft down the whole
//     column: amber under a lamp, pink / violet under a neon strip), broken into dashes by the swell, fading with distance from the wall;
//     small pink / cyan glints; a few glowing cyan PLANKTON specks. NEVER the tower's floors mirrored (gold floors in dark water were
//     the BROWN blob) — the ball alone: a soft pink-white streak of light.
//   · DAY (F5C): a saturated OCEAN BLUE deepest at the bottom of the screen, AMBER streaks under the wall lamps (NIGHT's way), a few glints
//     riding the swell's crests, the far edge sinking softly into the wall, foam round the pillar only, the ball's soft pink glow.
// The plunge: a RING WAVE runs out from the impact; then THE WATERLINE sweeps up the screen (uLine, a wavy line in screen space — the
// camera dips under) and below it the plane is gone: the world under the surface shows (unchanged).
```

### js/games/freefall/breaks.js

**§1** (above `import * as THREE from 'three';`)

```js
// FREEFALL — THE BREAKTHROUGHS (F3B — docs/freefall.md "THE BREAKTHROUGHS"): THE SKYLIGHT (floor 40, the rooftop → the offices) · THE
// SPLASHDOWN (floor 120, the speakeasy → under the harbor) · THE BOTTOM (floor 200 — the seabed; SOLO: it cracks open into THE TRENCH ·
// MATCH + DAILY: their finish). A VIEW ONLY: the rules never change, the clock never stops, no slow motion — the pieces read the run's
// EVENTS (the `area` event's tick is the tick the ball leaves the floor above) and the run's own clock, and play at full speed.
// The pieces are REAL 3D, in the ONE scene night.js owns (their shaders: break-fx.js), each drawn only while its floor is near:
//   · a pane that breaks (the skylight's glass · the seabed) = ONE instanced mesh of the triangles it breaks into (fractureGeo) — intact
//     at rest, the cracks along its own break lines, then the pieces fly in the shader
//   · the skylight's frame + neon tubes (instanced boxes), the roof's deck round it · the water (a normal-mapped plane) · the seabed + rocks
//   · THE SPRITES: a FIXED pool of GPU particles (dust, foam, bubbles, plankton, sediment, a firework's stars) — the tiers trim how many
//     are shed, never the look's shape; the sparks ride night.js's own streak pool
// ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES): update() + the emitters write into typed arrays made once; no object is made in a frame.
```

### js/games/freefall/day-fx.js

**§1** (above ``)

```js
// FREEFALL — THE DAY LOOK's SHADER PIECES (F3 — docs/freefall.md "THE DAY LOOK"; night.js builds the ONE scene both looks share, night-fx.js
// holds the materials — each reads `uDay` and takes the piece below for its day half). GLSL text only: no three.js, nothing runs here.
// The owner's targets: Downloads\NEON\freefall\ff-day.png (UNDER THE HARBOR by day) + freefall-mocks-day.jpg. Everything is written in
// LINEAR light (a hex colour is its linear value here).
```

### js/games/freefall/director.js

**§1** (above `import { cleanSettings } from './meta.js';`)

```js
// FREEFALL — THE DIRECTOR (F4A — docs/freefall.md "THE CARTRIDGE"; HIGH RISE's S4A director is the pattern): the PURE host step. THE GAME
// FRAME: id, matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (the proof nodes).
// F4B — THE MATCH (2 … 8 players, ONE ball each down the SAME tower — HIGH RISE's director is the pattern): count (3 · 2 · 1) → play → final.
//   · GO: every phone writes its proof node's `go` in the count's last 2 s; THE FIRST GO (core/proof.js#firstGo — final the moment it
//     lands) picks the seed + sets tick 0 (that time + match.js#GO_LEAD_MS) for everyone. The step count → play writes them into the game.
//     No GO anywhere (no signal, the rules not published) → the match plays UNPROVEN: a seed of its own, never counted.
//   · THE END: every player's run has ended — their node says `e`; a player gone silent (a dead phone) is waited for: online →
//     IDLE_OUT_MS (the darkness has ended that run by then), offline → + DROP_WAIT_MS (THE DROPPED SIGNAL) — or the 3:00 cap + a grace.
//     The results are THE JUDGE's replay of each player's log (proof.js#judgeMatch), never their claim.
// F4A — THE SOLO RUN: no count — `play` from the start; the run's
// own clock starts at the PLAYER's GO (their proof node's server timestamp — the seed is picked from it: logic.js#seedOf, never game.seed).
// THE END: the player's node says `e` (written once, right behind the last chunk — a SIGNAL: the result is THE JUDGE's replay of the
// node, proof.js#judgeSolo — never a number the phone claims).
```

### js/games/freefall/endscreen.js

**§1** (above `import { h } from '../../ui/dom.js';`)

```js
// FREEFALL — THE END SCREEN's BODY = JAYWALK'S STANDARD (F2; F4B — THE LOGO HEADER: docs/freefall.md "THE END SCREEN"; HIGH RISE's
// endscreen.js is the pattern). ONE builder for the test page's own card and the cartridge's body inside the console's podium frame — top
// to bottom (the owner's approved mock, Nov 26):
//   THE HEADER = THE LOGO — title-05's lettering (the opening's own WebP, its alpha) centred, ~58 % of the card's width (≈ 226 pt at 390 —
//     never under 210: the script must read) + the mode under it in small teal caps (SOLO · MATCH; DAILY later). In the cartridge the logo
//     sits in the console frame's own header slot (view.js puts `endLogo` there); the test page's card wears it itself.
//   the CAUSE — big neon words, up to two lines, in FREEFALL's TEAL (the colour IS the letter); YOU HIT THE BOTTOM = GOLD.
//     NEVER RED: red is danger on the tower and nothing else, anywhere.
//   THE FLOOR NUMBER, huge — the one WHITE hero, a hot-pink glow — and FLOORS under it
//   YOUR BEST 88 · AVG 62 in gold (F5C: a NEW BEST = NEW BEST · 141, celebrated — the AVG then on its own quiet line) + ONE small line:
//     12 BOUNCES · 3 BLAZES · BEST RUN 9
// THE TABLE's slot follows (YOUR TABLE — final.js); THE FOOT is the caller's (the console's universal footer · the page's own copy of it:
// PLAY AGAIN · SHARE | HOME). No stats strip, no pills. A VIEW's helper: DOM only — no rules, no storage, no fetch.
```

### js/games/freefall/engine.js

**§1** (above `import { TURN, GAP, RED, MODE_IDS, MAX_LOG, HARBOR_FLOOR, BOTTOM_FLOOR`)

```js
// FREEFALL — THE ENGINE (F1 — docs/freefall.md "THE ENGINE"): THE ONE RULE — the same seed + the same INPUT LOG = the exact same run on
// any phone and on the server (REPLAY = LIVE). FIXED-STEP TICKS (tuning.js#TICK_HZ = 60 a second); THE ONLY INPUT is THE INPUT LOG: the
// tower's angle A at the ticks it changed — [{ t, a }], the ticks rising, A held between. The run is EVENT-DRIVEN (HIGH RISE's way): it is
// a sequence of LANDING TICKS — on a landing the slice under the ball AT THAT TICK decides (SAFE → a bounce · GAP → a fall · RED → out);
// between two landings only THE DARKNESS moves, at ticks the engine knows exactly — stepTo jumps from one to the next (a judge's replay
// costs one step a landing, not one a tick). The phone's live run and the server's judge run THIS code.
// PURE: no DOM, no three.js, never Math.random / Date / performance / a frame clock; integers + Math.floor / Math.imul only (no float).
```

### js/games/freefall/final.js

**§1** (above `import { h } from '../../ui/dom.js';`)

```js
// FREEFALL — THE END SCREEN's BODY in the cartridge (F4A · F4B — docs/freefall.md "THE END SCREEN"; HIGH RISE's final.js is the pattern):
// the BODY inside the console's podium frame (ui/final.js owns the frame: its header slot — THE LOGO, put there by view.js —, the XP box,
// THE UNIVERSAL FOOTER: PLAY AGAIN · SHARE | HOME · a match: REMATCH · ROOM | SHARE). ONE builder with the test page's card (endscreen.js):
// F5B — THE FINAL SHAPE (the owner, Nov 27 — docs/freefall.md "THE END SCREENS"): SOLO = the logo · SOLO (the frame's header — view.js) ·
// the CAUSE · THE FLOOR NUMBER + FLOORS · "YOUR BEST · n · AVG n" (a NEW BEST: the AVG on its own line) · THE END-SCREEN BOARD (the
// console's shared block — ui/end-board.js, FREEFALL's END_BOARD: the world's top 3 / YOUR TABLE) · the universal foot. A MATCH = the logo
// · MATCH · the cause · the number + FLOORS · YOUR BEST · AVG · the match's TOP 3 (the same block) + "YOU · 5TH · 49 FLOORS" from 4th down ·
// REMATCH · ROOM | SHARE. No WOULD COUNT line (it took room; the server's answer is kept on the body's `data-would` for the checks), no
// stats line, no per-player cause line. Everything from THE JUDGE's own row (director.js), then the SERVER's answer for this match
// (profile/queue.js's outcome — counting ON: NEW BEST / YOUR BEST + AVG). /api down = just the floor.
// THE SHARE CARD is DRAWN + ENCODED while the end screen is read (share.js — the picture alone at the tap). No pills, no emoji, no dev text.
```

### js/games/freefall/ghost-fx.js

**§1** (above `import * as THREE from 'three';`)

```js
// FREEFALL — THE GHOSTS' LAYER (F4B — docs/freefall.md "THE GHOSTS"): what a rival LOOKS like on my tower. Its own small scene, drawn
// AFTER the picture (and its bloom) over the SAME depth buffer:
//   · THE BALLS — ONE instanced sphere, see-through, in the player's colour: a bright rim, a faint fill, and a DARK outer edge (it reads on
//     pearl / gold / lavender day floors and on the water as on the night's neon)
//   · X-RAY — the SAME instances drawn again where the tower HIDES them (the depth test turned round): a soft outline + a faint fill on
//     top — a ghost behind a floor or the pillar is never lost
//   · THE NAME TAGS — ONE instanced quad over everything, each a row of an atlas BAKED ONCE at the screen's own sharpness (full 3×): the
//     name in the player's colour on a dark rim; set to whole device pixels (crisp), pushed away from MY ball, stacked when two would overlap
//   · near MY ball (≈ a floor) a ghost fades to an OUTLINE with no tag — my own ball is always on top (it wrote the depth)
// ZERO GARBAGE IN PLAY: `place()` writes typed arrays made once; the atlas is baked at the count (never in a run, unless a name changes).
```

### js/games/freefall/ghosts.js

**§1** (above `import { createRun, stepTo, setAngle, isOver } from './engine.js';`)

```js
// FREEFALL — THE GHOSTS (F4B — docs/freefall.md "THE GHOSTS"; JAYWALK's ghosts.js is the pattern: STEPPED conf → run). PURE (no DOM, no
// three.js, no clock of its own). In a match everyone falls down the SAME tower, so a rival = their own input log through the SAME engine:
// their proof node's chunks (rooms/{CODE}/ff/{matchId}/{uid}/c — each chunk read ONCE as it lands).
//   · THE CONFIRMED RUN (`conf`): their LANDED moves, in order, stepped to the tick of the last one — nothing assumed.
//   · THE DRAWN RUN (`run`): from the confirmed run on to THE WORLD's TICK with their tower's ANGLE HELD (no new move assumed), the ball
//     bouncing / falling by the rules. A step that would take them OUT — or over THE FINISH — is NOT taken until their own end (`e`)
//     says so: a ghost never dies on this screen and stands up again when a late chunk lands.
//   · A LATE CHUNK = A QUICK CATCH-UP ARC, never a teleport: when confirmed news moves where they are drawn, the old place is eased into
//     the new one (CATCH_MS + a little per floor, ≤ CATCH_MAX_MS).
//   · WHERE THEY ARE DRAWN: on their REAL floor, over the SAME slice — at the world angle (the ball's angle − their tower's) + MY tower's:
//     `ghostPhi`. They turn with MY tower. They never collide with anything.
// And what a player SEES of them beside the ball itself: THE DEPTH RAIL (everyone's dot by depth), THE EDGE MARKERS (a ghost more than
// MARK_FLOORS below / MARK_UP above: "MIA ↓12" / "↑3"), WATCH THE LEADER (after an out — a delayed, exact playback: `createWatch`).
// ZERO GARBAGE IN PLAY: stepGhost + the rows fill kept records; a run's state is copied field by field (never a new object a frame).
```

### js/games/freefall/index.js

**§1** (above `import { createGame, nextStep, nextRun } from './director.js';`)

```js
// FREEFALL — THE CARTRIDGE (F4A — docs/freefall.md "THE CARTRIDGE"; the contract: js/games/contract.js, docs/cartridge.md; HIGH RISE's
// S4A cartridge is the pattern). BEING BUILT — HIDDEN: config.js GAMES `playable: false` + `preview` = THE OWNER'S LIVE TEST only (his
// phone's PLAY shelf / his room's list: FREEFALL · TEST); nobody else is offered it, a start from another phone is refused. NOTHING COUNTS:
// THE SWITCH (api/_lib/freefall.js#FREEFALL_COUNTS) is OFF — the server judges the run and answers what it WOULD award.
// F4A = THE SOLO RUN: the stage (stage.js — the SAME module /freefall-play mounts) in the console's frame, the proof written as you play
// (view.js → rooms/{CODE}/ff/{matchId}/{uid}), the end screen's body (final.js), PLAY AGAIN = the console's INSTANT AGAIN.
// F4B = THE MATCH (2 … 8 players — a room THE OWNER hosts while the game is hidden; docs/freefall.md "THE MATCH"; HIGH RISE's is the
// pattern): the SAME tower for everyone (THE FIRST GO), each player's own proof node, the rivals' GHOSTS + THE DEPTH RAIL, out = Call the
// Winner + WATCH THE LEADER, THE FINISH at THE BOTTOM (floor 200), the 3:00 cap, the podium, REMATCH; the server replays every player's run.
```

### js/games/freefall/match.js

**§1** (above `import { CALL_MS, callBonus } from '../../core/playlist.js';`)

```js
// FREEFALL — THE MATCH's RULES (F4B — docs/freefall.md "THE MATCH"; HIGH RISE's match.js is the pattern, JAYWALK's start number for number):
// ONE ball each down the SAME tower (THE FIRST GO's seed, the server's time), 2 … 8 players; ONE life, NO holds (a hidden page runs on);
// THE FINISH = THE BOTTOM (floor 200: MADE IT) or the 3:00 cap, whichever first; the deepest wins, then the earlier tick. The results are
// REPLAYED from each player's own input log (the proof node rooms/{CODE}/ff/{matchId}/{uid}) — never a number a phone claims.
// PURE (no DOM, no clock) — the phones, the host's director AND the server agree. Its own module: logic.js stays what THE LAB loads.
```

### js/games/freefall/matchhud.js

**§1** (above `import { h } from '../../ui/dom.js';`)

```js
// FREEFALL — THE MATCH's HUD (F4B — docs/freefall.md "THE DEPTH RAIL" · "THE MATCH"): the DOM over the scene in a match — 3 · 2 · 1 + the
// names · THE DEPTH RAIL (a thin glowing rail at the right edge: everyone's dot by depth, mine larger, out = a crossed dot, THE BOTTOM
// marked at its foot — HIGH RISE's altimeter turned upside down) · THE EDGE MARKERS (F5C — the owner: a rival five floors below / two above:
// "MIA ↓12" ONE line each, bigger, in the player's own colour, at the screen's EDGE on the side of the tower they really are — left or
// right; below → the lower band, above → the upper band; never stacked small text at the bottom centre) · the last half minute's clock · the OUT card · the WATCHING line. WRITTEN ONLY WHEN SOMETHING CHANGES (a dot
// moves by ONE transform; a marker's words are set only when they differ) — never in a frame that changed nothing; no pills.
```

### js/games/freefall/night-fx.js

**§1** (above `import * as THREE from 'three';`)

```js
// FREEFALL — THE SCENE's SHADERS + THE BLOOM (F2: THE NIGHT LOOK · F3: every material reads `uDay` and takes its day half from day-fx.js —
// docs/freefall.md "THE NIGHT LOOK" + "THE DAY LOOK"; night.js builds the ONE scene both looks share). HIGH RISE's way
// (js/games/highrise/night-fx.js): three.js core only — no add-on, no post-processing library; everything is written in LINEAR light and
// ends in three's own colour-space chunk. Every material carries `uBloom` (1 = the bloom pass: only what GIVES light is drawn).
```

**§2** (above `export const WALL_V = /* glsl */'`)

```js
// ---- THE SHAFT (the backdrop — drawn into a HALF-RES target, then copied up: a wall is soft by nature). A screen-filling quad: each
// pixel's ray meets THE WALL — a cylinder round the tower's axis, seen from outside through its near side (the far inside face) — and
// reads the area's painted wall there (seamless: it wraps round the shaft and repeats down it). Two walls cross-fade BY DEPTH at the seam
// between two areas (the next area's wall is seen coming up from below). THE ROOFTOP has no wall: the open night sky + JAYWALK's
// skyline painting on the horizon. THE GLOW rises from the shaft's bottom (pink → violet); THE DARKNESS: above its line the wall is out.
```

**§3** (above `export const SKY_V = 'varying vec2 vS; void main() { vS = position.xy;`)

```js
// ---- THE ROOFTOP's SKY = FREEFALL's OWN PANORAMA, AT FULL RESOLUTION (the add-on, Nov 26 — the owner: JAYWALK's skyline stretched round the
// compass in the half-res pass was blurry, blocky windows). A screen-filling quad over the half-res wall, drawn ONLY while the rooftop is
// on screen (the opening + floors 0–39): each pixel's ray reads the 3072 × 1024 panorama (a 360° picture; mipmaps + anisotropy; it
// repeats on u — u = 0 and u = 1 match) — shown across uSpanAz of the compass so a texel is never stretched past ~1.3 screen pixels on a
// phone at 3×; the city's horizon near eye level from the top floor, the buildings in the lower part — ONE horizon height for both looks;
// it rises a little as the ball goes down (uRise: the ball sinks between the buildings). Under its foot: by night the dark roof + the
// glow, by day the open air + soft clouds. Where the next area's wall begins (the seam, a world height) it fades out: the wall is under
// it. THE DARKNESS reads here as on the walls (above its line: the lights out · by day THE STORM CLOUD). A red pixel leans to pink.
```

**§4** (above `export const SLICE_V = /* glsl */'`)

```js
// ---- THE SLICES: ONE instanced mesh for every solid slice in sight. A slice = a wedge of the ring (aE = its own coordinates: across the
// wedge −1 … 1 · from the pillar 0 … 1 out to the rim · the face: 0 top, 1 the outer wall, 2 a cut side · down the wall 0 … 1).
// Per slice: aI = (its angle on the floor, its floor's height, how far it stands PROUD — red only —, its kind: 0 safe · 1 red · 2 red
// that MOVES) · aC = (its colour, its alpha) · aF = (a white flash, a red WARNING — the moving red steps here next —, cracked, it flies
// outward: a floor just passed).
```

**§5** (above `export const LIGHT_V = /* glsl */'`)

```js
// ---- THE LIGHTS (one instanced quad, added light): aP = (its place, its half size) · aQ = (its kind, its strength, stretch up — a
// trail's length —, a seed) · aC its colour. Kinds: 0 a round glow (the ball's halo) · 1 THE TRAIL (a flame rising from the ball: wide
// at its foot, a point at its tip, flickering) · 2 THE MARK on the floor (flat: where the ball's centre comes down — a hot point in a
// thin ring) · 3 a PUNCH (flat: a ring of light running out from a shatter; aQ.z = its age 0 … 1)
```

**§6** (above `export const FLAME_V = /* glsl */'`)

```js
// THE FLAMES: billowing flame SPRITES (Kenney's Particle Pack — assets/freefall/fx/blaze.webp: two flames, the hot speckle, the smoke),
// flown HERE (a flame = its start, its drift, (its birth, its life, its size, its seed)): it swells as it ages, swirls off its line
// (a curl of sines by its own seed), turns from flame to smoke, cools down the ramp. Light that covers a little (the bands stay). A FIXED pool: the tiers trim how
// many are lit at once, never the pool.
```

### js/games/freefall/night.js

**§1** (above `import * as THREE from 'three';`)

```js
// FREEFALL — THE SCENE: THE NIGHT LOOK (F2) + THE DAY LOOK (F3 — ONE scene, a LOOK: `setLook('day' | 'night')`, read LIVE; every material
// carries `uDay` — night-fx.js + day-fx.js; docs/freefall.md "THE NIGHT LOOK" · "THE DAY LOOK"): the tower on three.js 0.160 (the page's import map, its
// READABLE build — HIGH RISE's LAG RULES 7) with our own shaders (night-fx.js): the slices in ONE instanced mesh (only the floors in
// sight), the pillar, the ball + its lights, THE BLAZE's trail, a shatter's shards + sparks, YOUR BEST's gold tape, THE SHAFT behind it
// all (the area's painted wall, drawn at half resolution), the half-res bloom (tier 2).
// A VIEW: it reads the run + its EVENTS (engine.js) and eases the ball between two landings itself — it never writes them; the rules
// never import it. ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES): a frame makes no objects — the instances are written into typed arrays
// made once, the floors in sight live in a ring of records written INTO (tower-gen.js#floorInto), every uniform is a kept object.
```

**§2** (above `const fa = areaIndex(run.floor), fn = fa + 1 < AREAS.length && AREAS[f`)

```js
// THE LOOK's own (F3 — by day): the haze the tower fades into (the ball's area's — it eases across a border), THE CAUSTICS on the slices
// UNDER THE HARBOR (tier 0: on the wall only), THE MOTES (bubbles · drifting particles · dust — the area's kind fades out, the next in)
// F4A — THE HAZE FOLLOWS THE FLOOR, never the clock (the owner's phone: by day the floors 1–3 floors past the splashdown were ~20 %
// less colourful + brighter — the old area's haze, eased over a second, still lay on the new area's floors): the border in sight
// splits the tower — the floors above it fade into THEIR area's haze, the floors below it into theirs (as the palettes: a floor wears
// its own area's). Full colour + contrast from the frame the ball goes through.
```

### js/games/freefall/proof.js

**§1** (above `import { judgeRun, unpackLog, isHold, packMove } from './replay.js';`)

```js
// FREEFALL — THE PROOF (F4A — docs/freefall.md "THE PROOF"; HIGH RISE's `hr` node is the pattern: js/games/highrise/proof.js). PURE — the
// phone, the host's director and the SERVER run this file. A run is counted ONLY from its PROOF NODE:
//   rooms/{CODE}/ff/{matchId}/{uid} = { go (the SERVER's time, written ONCE at GO — the seed is picked from it: logic.js#seedOf; tick 0 =
//     go + START_LEAD_MS), c/{i} = { s: that chunk of THE PACKED INPUT LOG (replay.js#packLog's own text, cut between two events), at: the
//     SERVER's time it ARRIVED } (append only, i 0 … 9999, ≤ 400 chars), h/{0 … 2} (a HOLD's way back — the SERVER's time the 3 · 2 · 1
//     began: the run goes on RESUME_LEAD_MS after it, at the hold's own tick), e { f, t, w } (the run's end, once — a SIGNAL for the
//     host's step: never read as a score), k (Call the Winner — F4B's match) }
// THE INPUT LOG = the ticks the tower's angle CHANGED at (never a tick it stood still) + THE HOLDS (solo only), packed.
// WHAT GOES UP WHEN (the writer): an entry is FINAL — the engine can never change or drop it again — once a landing at or after its tick
//   is decided (engine.js#turn: a later move counts after it), once the run is held at or after it, or once the run is over. Only final
//   events are sent: a landing comes every 0.6 s at most, so nothing waits long.
// THE JUDGE (judgeNode) = the chunks → the log + its clock → THE SPEED CHECK both ways + THE DROPPED SIGNAL + THE HOLDS' own clock →
//   replay.js#judgeRun (the SAME engine the phone ran). A phone's claimed floor is never read — there is no field the judge takes one from.
```

**§2** (above `if (base[k.s1] + (k.t1 - T[k.s1]) * MS > k.at + CLOCK.ahead * MS) retu`)

```js
// (AHEAD of its own segment's clock. In the run's FIRST segment: a log made in advance — refused. PAST A HOLD (the fresh-eyes review's
//  HIGH): the way back's stamp is not the moment the run went on — the phone got no answer, went on by its own clock, and the write
//  landed when the line was back: the events past that hold have no clock they can be held to → the run is CUT at that hold, as with
//  no stamp at all. Nothing is gained by it: the part before the hold was checked on its own segment's clock.)
```

### js/games/freefall/replay.js

**§1** (above `/** ONE move as the packed log writes it — after the event at tick 'pt`)

```js
// ---- THE PACKED LOG (F4's run node): event after event, no separator between them —
//   A MOVE:  [ '.' + the ticks since the event before (base 36) ]  — left out when it is 1 (a drag logs tick after tick); the first event counts from tick −1
//            '+' | '-'                                             — the way the tower turned
//            the units it turned (base 36, 1 … 2048)               — the SHORTEST way from the angle before
//   A HOLD (F2):  '!' + the ticks since the event before (base 36; "0" = at the tick of the move before it)
// ".c+2r+1k-3.a-z" = tick 11: +99 · tick 12: +56 · tick 13: −3 · tick 23: −35. "…-z!4+5" = … a hold at tick 27, then tick 28: +5.
// CANONICAL: packLog(unpackLog(s)) === s, nothing else unpacks.
```

### js/games/freefall/shot.js

**§1** (above ``)

```js
// FREEFALL — THE RUN's FRAME (F4B — docs/freefall.md "THE SHARE CARD"; HIGH RISE S5's shot.js is the pattern): the picture of the moment a
// run ended (the red's burst round the ball · the darkness on the ball · the seabed's impact, gold · the bell), kept on THIS phone until
// the next run. The stage takes it (stage.js — a beat after the end, per cause; F5A: the picture is STAGED — the moment a beat BEFORE the
// end, drawn once more for the card alone: night.js#shot, the numbers below), the share card draws it (share.js). Pure state + numbers:
// no DOM, no fetch, nothing that counts.
```

### js/games/freefall/sounds.js

**§1** (above `/** a sound: 'file' in audio/<dir>/, played at 'rate', 'gain' into the`)

```js
// FREEFALL — THE SOUNDS' TABLE (F2 — docs/freefall.md "THE SOUNDS"; the files: audio/freefall/ + CREDITS.md — its own all CC0; two are JAYWALK's — NEW BEST is CC BY 4.0, TommasoMotteran: FIX C N4).
// PURE, no imports (the unit tests read it; sfx.js plays it): every sound, its words in the SOUNDS list, its file + folder, its gain into
// the limiter, its PRIORITY. THE PICKS ARE THE OWNER's (take A of each).
// THE TRIGGERS (cuesOf — the engine's events → the sounds):
//   bounce       every landing on solid ground — SOFT, the note as recorded, never the same twice (± 1.5 dB)
//   whoosh + THE NOTE UP ITS SCALE   every CLEAN fall through a gap: the bounce's one note pitch-shifted in code, a step higher each
//                clean floor in a row (do re mi so la do′ re′ mi′ — holding at the top), back to the first note after a bounce
//   blaze        THE BLAZE lights · shatter  a slice shatters · crack (the crash, short + high + quiet)  the landing right after a
//   shatter came down on red (saved) · crash  out on red · lights-out  out in the dark · bottom  THE FINISH (ready for F3)
//   area-arrive  the ball enters an area · new-best  the fall that passes YOUR BEST   (the stage's: it knows the best)
//   F3B — THE BREAKTHROUGHS: skylight (floor 40: the glass breaks) · splashdown (floor 120: the plunge) · bottom (floor 200: the ball hits
//   the seabed — SOLO too now) take the place of the arrival's sound on those three floors, each timed to the moment the ball gets there;
//   fireworks = a finish, softly, right after bottom (the stage's — F5A: in both looks, by day behind the bubbles + the sun rays)
```

### js/games/freefall/stage.js

**§1** (above `import { h } from '../../ui/dom.js';`)

```js
// FREEFALL — THE STAGE (F2 — docs/freefall.md "THE TEST PAGE"; HIGH RISE's stage.js is the pattern): the run loop on the pure engine, the
// scene (night.js — F3: BOTH LOOKS, the shared DAY / NIGHT read live), the HUD, THE OPENING, THE HOLD, YOUR BEST, the sounds' cues, the end card — ONE module: the test page mounts
// it (play.js) and — F4A — the cartridge mounts the same one (view.js). It COUNTS NOTHING itself: no /api, no profile, no report, no
// database — the page hands it a best to read + write (this phone's); the cartridge hands it its hooks (`o.go` the GO → the seed + tick 0 ·
// `o.resume` a hold's way back, stamped · `o.onFrame` / `o.onOver` / `o.onEnd` / `o.onHide` — what a run WRITES is the view's: view.js).
//   · THE RUN: tick 0 = the START (the first drag — after ≤ 0.6 s for the sounds' decode: THE SOUND SYNC); the RULES never read the
//     clock — the stage turns it into ticks. FAIR INPUT: a move counts at the tick of its own EVENT TIME (pointermove's timeStamp, each
//     coalesced sample at its own) — 60 Hz and 120 Hz phones are equal. THE DRAG is 1 : 1 (the ring under the ball moves as far as the
//     finger — F1's scale, the owner's phone check); MAX SPIN's rest is offered again tick by tick (≤ 8 ticks owed).
//   · THE HOLD (SOLO — engine.js#hold): the page hidden / the phone locked = the run is HELD (a logged event the judge replays); back =
//     a 3 · 2 · 1, then on — EXACTLY where it was (F3 — THE HOLD = EXACT RESUME: the ball at the same point of its flight, the tower at
//     the same angle; nothing the finger does while PAUSED or in the count counts). A mode with no hold left (a match: none) runs on behind the hidden page.
//   · ZERO GARBAGE IN PLAY (HIGH RISE's LAG RULES): a live frame makes no objects of its own — the HUD writes only what changed, the
//     big number is BAKED (bakedtext.js), the cues are constants; what is left is what a LANDING makes (the engine's events, a sound's source).
```

**§2** (above `const art = (name, w) => new URL('../../../assets/freefall/title/${nam`)

```js
// THE OPENING's TITLE (F3 — title-05, the owner's pick): Grok's lettering + its tagline, two pictures over the LIVE tower (the F2 tube
// sign + its dropping ball are gone). THE GLINT (.ff-glint): a band of light swept across the lettering, MASKED TO THE LETTERING's
// OWN ALPHA (the mask = the very file the <img> picked — no second download), a 4-point star on the last letter as it leaves — CSS
// only (transform + opacity), running only while the opening waits
```

**§3** (above `const linkIco = id => { const i = h('i.ff-link-i', { 'aria-hidden': 't`)

```js
// (the cartridge's own card — an UNPROVEN run's, a run with no signal — has the console's way out: `o.onLeave`)
// F4B — THE FOOT = THE SITE's UNIVERSAL END-SCREEN FOOTER (END-SCREEN STANDARD A — ui/final.js's, copied here: this page loads no
// console): the PLAY AGAIN bar, then the quiet links SHARE | HOME with the SAME drawn icons. The page's SHARE hands the phone's own share
// sheet THE PICTURE ALONE (F5B — card.js + send.js, the cartridge's own: no line, no link, no server — NOTHING COUNTS here)
```

### js/games/freefall/tower-gen.js

**§1** (above `import { hashString } from '../../core/rng.js';`)

```js
// FREEFALL — THE TOWER (F1 — docs/freefall.md "THE TOWER" · "FAIR BY CONSTRUCTION"): a floor = a ring of 12 slices round the pillar —
// SAFE · GAP · RED — and its TWIST (its rotation offset). buildFloor(seed, i) is a PURE FUNCTION of (seed, floor index): any floor, in any
// order, on the phone or the server, is the same floor. Difficulty lives HERE and nowhere else (the bounce + the fall never change).
// FAIR BY CONSTRUCTION — every rule below is checked while a floor is BUILT (a red slice that would break one is simply not laid), and
// proved again from the outside by tests/freefall-tower.test.mjs over 2,000+ seeds:
//   · ≥ 1 gap · ≥ 3 safe slices · red ≤ 8 of 12 · floors 0–9 have NO red · F5B: floors 40 + 120 (gen.blind — under the skylight + the water) have NO red · red sits beside a gap only from floor 40
//   · in the early areas (floors < 120 — `belowUntil`) every slice straight below a gap (twists counted) is never red
//   · THE FALL WINDOW: from any point of any gap, a human-paced spin (the reaction, then ≤ 1 turn a second) reaches a SAFE or GAP point of
//     the floor below before the landing — and below the early areas the escape a floor asks for RAMPS in over 40 floors (reachAt)
//   · NO ISLAND: from every safe slice a gap can be reached by human-paced hops (no stretch of safe slices walled in by red runs too long
//     to cross inside one bounce) — nobody is ever left bouncing for the darkness
//   · floor 0: the slice under the ball at the start (A = 0) is SAFE — a run never starts by falling
// PURE: no DOM, never Math.random / Date; integers + Math.floor / Math.imul only (the one import outside the folder: the integer hash).
```

**§2** (above ``)

```js
// ---- MOVING RED (F2 — THE TRENCH only: floors ≥ gen.move.from — solo; a match / a daily ends ON floor 200 and never lands there).
// A trench floor has up to TWO red slices that MOVE (one from the first lap, by the lap's chance; two from lap `gen.move.two`): each walks
// back and forth along its own TRACK (2 … gen.move.max solid slices side by side), one slice every `pace` ticks — its slice is a PURE
// FUNCTION of (seed, floor, tick). FAIR BY CONSTRUCTION, at EVERY tick (every stand of every mover is checked while the floor is built):
//   · a track never holds a slice STRAIGHT BELOW A GAP of the floor above (twists counted) — a ball that comes through a gap never
//     meets the moving red on its landing, at whatever tick it falls (every fall window)
//   · wherever the movers stand, the floor still has ≥ safeMin safe slices, NO ISLAND holds and THE FALL WINDOW holds
//   · a mover only ever steps to the slice NEXT to it (it is seen coming for `pace` ticks); two tracks never share a slice
// At most ONE static red slice lies inside a track — it is UN-LAID (it is the one that moves now: the red count stays what it was);
// a track of safe slices only ADDS one red to the floor. A mover = ONE integer: its track's first slice | its length << 4 | its phase << 8.
```

### js/games/freefall/tuning.js

**§1** (above ``)

```js
// FREEFALL — THE TUNING + THE RULE-SET TABLE (F1 — docs/freefall.md "THE NUMBERS" · "THE RULE-SET TABLE"): EVERY NUMBER OF THE RULES lives
// HERE, in ONE table — HIGH RISE's rules.js pattern (docs/highrise.md "THE RULE-SET TABLE"). A RULE SET = one row; today's only one is
// "classic" (set by the bot sims — docs/games/passes/freefall-f1.md "THE TUNING"). A run is played on ONE rule set and RECORDS it
// (engine.js: `run.rules`, the judge's answer); THE JUDGE replays a log on the set it names and REFUSES one it does not know — so a future
// tuning is a NEW row, and every run ever recorded still replays to the tick on the row it was played on.
// PURE, no imports, no DOM. THE RULES' MATH IS CROSS-ENGINE SAFE: integers and + − × % + Math.floor / Math.imul only — never a float,
// never Math.sin / cos / pow / sqrt, never Date / Math.random / performance (the phone's run and the server's replay must agree landing
// for landing). The view may use anything.
```

**§2** (above `dark: { grace: 3 * TICK_HZ, pace: 120, lead: 3, paceDeep: 160, easeFro`)

```js
// (F3 — THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE, the owner Nov 26: it was 4 s · 150 · 6 — a stopped ball had 15 s and nobody ever SAW
//  the darkness; now a stopped ball has 6 s and it is always in sight. F3B — THE DARKNESS EASES WITH DEPTH, the owner Nov 26: floors
//  0–100 EXACTLY as F3 built them (a floor every 120 ticks: 6 s stopped), a straight line over floors 100–160, a floor every 160 ticks
//  from floor 160 on (8 s stopped — THE DEEP + THE TRENCH: the stall budget follows the layout's difficulty). Nothing was ever recorded:
//  no new row.)
```

### js/games/freefall/view.js

**§1** (above `import { h } from '../../ui/dom.js';`)

```js
// FREEFALL — THE GAME's SCREEN (F4A — docs/freefall.md "THE CARTRIDGE" · "THE PROOF"; HIGH RISE's view.js is the pattern): THE STAGE
// (stage.js — the SAME run loop, scene, HUD + sounds /freefall-play mounts) in the console's frame, and everything a run WRITES — which
// the stage never does itself:
//   · GO: the proof node's first value (the SERVER's time), read back → the seed (logic.js#seedOf) + tick 0 (= GO + proof.js#START_LEAD_MS):
//     the run is on the server's clock. The first DRAG is the start (the opening stands on a stand-in tower: the real floors take their
//     place as the tower spins up — stage.js#WHIP_MS)
//   · THE PROOF: the input log's FINAL events in chunks, every 250 ms while there are new ones — c/{i} = { s, at: the SERVER's time }; at
//     the end the last chunk, then `e` (a signal: the host's step ends the match on it — never read as a score)
//   · THE HOLD (solo — the page hidden / the phone locked): the hold is a logged event (it goes up as the page hides); the way back is
//     STAMPED — h/{i} = the SERVER's time the 3 · 2 · 1 began, the run goes on RESUME_LEAD_MS after it. No stamp (no line) → the count is
//     run again (stage.js#RESUME_TRIES), then the run goes on and SAYS it is not counted past the pause (the judge counts it up to that hold)
//   · THE END = the console's podium frame (ui/final.js) with this game's body (final.js); PLAY AGAIN = the console's INSTANT AGAIN (the
//     scene kept warm), back on THE OPENING
//   · an UNPROVEN run (GO refused / unanswered / answered too late: no signal, the rules not yet re-published) still PLAYS — on a seed of its
//     own, never counted — SAYS SO for as long as it is on, and ends on the stage's own card (NOT COUNTED — NO LINE TO THE BOARD)
//   · a refresh mid-run: the run can not be taken back up (its clock ran on) — its end is written from the node as it stands
// F4A = THE SOLO RUN.
// F4B — THE MATCH (docs/freefall.md "THE MATCH"; HIGH RISE's view.js is the pattern): 3 · 2 · 1 · GO — every phone writes its own GO (a
// TRANSACTION, never applied locally); THE FIRST GO among the proof nodes picks the seed + tick 0 for everyone (match.js#startOf: THE
// NODES ARE THE TRUTH); the same chunks as a solo run; the RIVALS = everyone's proof nodes through the same engine (ghosts.js — the stage
// steps + draws them: the ghosts, THE DEPTH RAIL, the edge markers); OUT = the cause's words for a moment → Call the Winner (the match
// kit's — your own node's `k`) → WATCH THE LEADER (a tap = the next player); THE FINISH = THE BOTTOM (floor 200) or the 3:00 cap; the
// podium comes with the host's step. One life, NO holds: a hidden page runs on. A late joiner (not a participant) WATCHES from the start.
```

**§2** (above `granted(i, holdSrv).then(ok => { if (ok === false) { clearTimeout(t); `)

```js
// F4B — THE PAUSE GAP: WAS THIS PAUSE GRANTED? The hold's own chunk (the hold + every move before it) must have ARRIVED — the SERVER's
// stamp on it — within GRANT_PHONE_MS of the hold (the judge's bound is CLOCK.grant: the phone keeps a margin). The server's copy of
// the chunks is read (it answers behind the writes still queued). Not there / too late → −1: no pause was granted — no stamp is
// written, the count is not run again, the run goes on and SAYS it is not counted past the pause
```

**§3** (above `const need = holdN, from = performance.now();`)

```js
// THE FRESH-EYES REVIEW (HIGH): this phone's mirror answers a read from its LOCAL view — a chunk still in the air is there with the
// phone's own guess of its time (a hold chunk queued behind a dead line read as "stamped 1 ms after the hold"). The chunk is asked
// about only once its WRITE IS ACKNOWLEDGED (the writer's `acked` covers the hold's event): then its `at` is the server's own. Not
// acknowledged in this count's time = no answer — the count runs again (stage.js#RESUME_TRIES), then the run goes on, NOT COUNTED PAST THE PAUSE.
```

**§4** (above `const RH = globalThis.__nsRunHold;`)

```js
// THE PODIUM for everyone (the host's step) — once this player's own end has been SEEN (the stage's end hold, the finish's moment); a
// watcher, a refresh on it: at once. Never held for ever — a ball still falling when the match is over (its chunks did not arrive)
// gets the podium after FINAL_HOLD_MS. THE CONSOLE FIX: never over a live proven run of this phone's own; never for a match the room
// has left (the router holds this screen); and it waits for a rival's run still LIVE — the host's `final` came early — the cap ends that wait
```


## THE FIX PASS C (Nov 27 — `docs/games/passes/freefall-fixc.md`)
- **THE VEIL** (`veil.js` — the compositing fix): THE DARKNESS (the edge creeping down + the sides closing in) and THE SHADE (the dark fall
  behind the HUD while a run is on) are the 3D picture's LAST PASS — one full-screen triangle (after the bloom + the ghosts; never in a
  staged share frame) — not three full-screen HTML layers composited over the canvas at 3× every frame. The shapes, colours and eases
  are the old stylesheet's number for number (the shots: Downloads\NEON\freefall-fixc\speed\veil — 18 frames within ~1 level); the
  stage still writes `data-dark` (the checks read it). The colours: `veil.js#veilInk` (night · day · the day rooftop · the day sea).
  The hint's sweep animates ONLY while the foot shows (it ran the whole run under an invisible foot).
- **THE TEST PAGE's SPEED SWITCHES (+ FIX C):** `?hud=0` — every HTML layer over the canvas hidden while a run is on (+ no veil; the end
  card + the fps summary come back) · `?empty=1` — THE CONTROL (`empty.js`): the same canvas size + pixel ratio, a plain spinning mesh,
  the same loop + the same hitch meter, no game, no HTML layer — 30 s, then the line (a tap = again). The run summary now names its seconds.
- **THE SCORING (server-side unless named; REPLAY = LIVE untouched):**
  - **S3 THE HOLD** (`core/match-report.js#ffTooPerfect` · `FF_HOLD`): a judged row with a no-bounce run ≥ 40, or < 0.3 bounces a floor
    over 100+ floors, is HELD — the XP is paid, the board row + THE AVERAGE + the cards are not written, a match win is not credited to the wins
    board and the run is no verified play (`sv`) toward THE BOARD's listing; `rejected` names it 'held' (with f · b · br) for /admin. The sims: every bot, 200 seeds each, solo + match — best no-bounce run ≤ 18, ≥ 0.53 bounces a floor; a script
    reading the tower: 401 floors / 1 bounce at MAX SPIN, a no-bounce run of 76–126 at a human's spin, 0.12 bounces a floor at a slow one.
  - **S2 THE COPYCAT** (`api/_lib/freefall.js#copyScore` · `COPY`): the server's replay of every on-time node gives its LANDINGS
    [floor, tick, the tower's angle] (the engine's land event carries `a` since FIX C). Two players are a copy when 30 landings IN A ROW
    are alike (the angle within 24 units), or 90 % of the shorter run's landings (60+) are the same floor at the same tick → the node that came LATER is refused 'copy' (it still PLAYED — `prefixFloor`). LATER = per shared landing
    (`laterOf`): the arrival of each node's first chunk reaching that landing's tick, the MEDIAN difference — a copy can never send a move
    before its source's chunk with it arrived (the fresh-eyes review: an average over chunks could be gamed by recutting them). Honest sims (60 rooms × 8 bots, 1,680 pairs): at
    most 17 in a row, 73 %. The review's probes: the copy 400 ms behind and the copy + ONE scripted landing — refused in 12 of 12.
  - **S4 A MATCH's END-BURST** (`proof.js#END_BURST_MS` 20 s): a run that ENDS inside a dropped-signal burst takes it only when its silence
    was ≤ 20 s — else it is CUT at the first move PLAYED during the silence (a move past the silence's start + 8 s of play); the honest tail
    a phone sends when it wakes (moves played before the lock) is kept. A solo keeps the old rule.
  - **S5 A HOLD's LONGEST** (`proof.js#HOLD_MAX_MS` 10 min): a way back stamped more than 10 min after the hold's own wall time = no way
    back: the run is CUT at that hold (no rules change). The phone says so 30 s early (its hold time is not the judge's run clock): "NOT COUNTED PAST THE PAUSE — OVER 10 MINUTES".
  - **N6 FLOOR 201 IS BLIND** (`tuning.js` classic: `blind: [40, 120, 201]`, the moving red from 202): it is landed on during THE BOTTOM's
    impact (ring, dust, the camera's kick) — never red under the ball there. Nothing was recorded on the old numbers: no new rule-set row.
  - **N7 THE RULE-SET LEAF** (HIGH RISE's S4B): `ff/{matchId}/{uid}/rs` — the run's rule set, its player's, ONCE, within 10 s of its GO,
    before its first chunk + its end (a RULES CHANGE — re-published with FIX C). The judge reads a node with no `rs` as "classic"; a set
    the table does not hold is refused ('rules'); a match is played on THE FIRST GO's player's set (`match.js#matchRules` — the director
    writes `game.rs`) and a node naming another is refused.
  - **N8 A TRUNCATED LOG** can earn up to +5 floors (mean +1.8 in 15 of 40 runs — a modified client only: the judge plays any prefix out
    with the tower held still). Covered by THE HOLD; no fix of its own.
- **THE TEST PAGE's BOT MATCH** (`botmatch.js` — lazy, the page only): `?mode=match&rivals=N` (N ≤ 7) = the real 3 · 2 · 1 + the names
  (from the stage's warm frame), the bots from GO, my out → WATCH THE LEADER (a tap = the next), everyone down → THE RESULTS (my place +
  their floors) + REMATCH · `&spectate=1` = no ball of my own, the stage as a WATCHER (the same watch code a real player gets after an out:
  the ghosts, the tags, THE DEPTH RAIL + its names, the outs, the darkness, the blaze, the breakthroughs of the run watched). Driven
  through the SAME stage hands the cartridge's match view uses (count · adopt · setGhosts · feedGhost · watch · the watch line · the OUT
  card). `&room=1` = the old bot room (the drag starts it — the look + speed rigs use it). Nothing counts.
- **THE TEST PAGE's ☰** (top-left, on the opening, the pause + the end card) → HOW TO PLAY through the one opener, FREEFALL's tab alone
  (`openHelp('freefall', { only: true })`). SHARE acts on a real click (iOS's share sheet). HOW TO PLAY: + "A MATCH never pauses."
- **THE FINISH's SHARE CARD** (`card.js#BURSTS`): three big neon bursts — gold + cyan by night, gold + teal by day — clear of the words and
  inside the frame, a crisp GOLD RING round the ball (a narrow radial band — the card's no-capsule rule), and by day a dark vignette
  closing in round the ball (the card is never milky). Fixed shapes. Only THE BOTTOM's gold card.
- **THE PODIUM** (the contract's `shareOk(game, me)` — FREEFALL's: no SHARE on an unproven match or a refused row: a late / no GO, a
  copy, a bad log) · **CALL THE WINNER** picks only players still falling with an on-time GO and news, never past the judge's window
  (− 4 s) · **A REFRESH** keeps the call line ("YOUR CALL · MIA" from the mirrored call), shows the OUT card once, and remembers that the
  podium waited on a live run (this tab's session).
- **THE SHARED END BOARD** (`ui/end-board.js`, every game with it on): S10 — the server's answer carrying a NEW BEST (`pbs`) PATCHES the
  kept world list (YOUR row at the new value, ranked again — a refetch would be stale behind the 12 s + 10 s + edge caches) and YOUR TABLE
  is read again; every block on screen redraws · S11 — FRIENDS ONLY unticks itself when the table has nobody but you: remembered '0' only
  when you have NO friends at all (`api/_lib/friends.js#boardTable` now answers `friends`, the count it looked at) — friends with no run on
  THIS board = off for this screen only ("NO FRIENDS ON THIS BOARD YET"); the line only on the tap that caused it.
- **THE ROOM:** the long comments of the cartridge's files moved to THE CODE NOTES (below) — FREEFALL's line 602 → 567 KB of 610 with
  everything this pass added.

## THE CODE NOTES (moved from the code — FIX C, Nov 27)
THE ROOM (FIX C Group 0.1): the long comments of FREEFALL's cartridge files moved here VERBATIM (no behaviour change) — the game's line in
`tests/integration/game-budget.json` counts raw bytes. In the code a moved whole-line block left ONE line `// <its first words> … <file>#<n>`;
a moved trailing comment left `// <file>#<n>`. The note below has the same `<file>#<n>`. (Numbers are per file, in file order, as of FIX C.)

#### stage.js
- **stage.js#1** — FREEFALL — THE STAGE (F2 — docs/freefall.md "THE TEST PAGE"; HIGH RISE's stage.js is the pattern): the run loop on the pure engine, the (→ §1, docs/freefall.md MODULE NOTES)
- **stage.js#2** — the wall behind the top of the screen is the area's of this many floors up (night.js#walls keeps a seam in sight that long)
- **stage.js#3** — … and this long after a FINISH (F3B — THE BOTTOM: the last drop onto the seabed, the shockwave, the gold band, by night the firework)
- **stage.js#4** — the START waits at most this long for the sounds' decode (THE SOUND SYNC — a first-ever touch is also the audio's unlock)
- **stage.js#5** — the most turn the stage keeps owing when a flick out-runs MAX SPIN: 8 ticks of catching up (the rest of a wilder flick is dropped)
- **stage.js#6** — THE LOOK before the sun rule has answered (it is a lazy module): the phone's own clock — day from 7 to 19 (HIGH RISE's guess)
- **stage.js#7** — … a hold's way back whose stamp did not come: the 3 · 2 · 1 is run again this often before the run goes on with no stamp (the judge then counts it up to that hold)
- **stage.js#8** (`let app = app0, acIn = new AbortController();`) — (the element the stage is mounted in — the cartridge moves a parked stage to its next view's: `moveTo`)
- **stage.js#9** — THE LOOK (F3 — the match kit's shared DAY / NIGHT, games/kit/look.js): the console's GAME LOOK read LIVE (`o.lookNow` — F4's cartridge: the host's AUTO · DAY · NIGHT; no switch of its own) · the test page: `?look=day|night` for a check (`o.look`), else AUTO — the phone's clock at once, then THE SITE's OWN SUN RULE (sunUpNow: the city's sun at this phone's place), asked again every minute. Same rules in both looks.
- **stage.js#10** — THE SOUND SYNC (HIGH RISE S4A): a LIVE run holds the audio context awake — a lease renewed once a second from the frame (audio/engine.js#holdAwake through its hub: THE STALE-MODULE RULE), let go on the end card, on a hold, on a hide
- **stage.js#11** — ---- the page: the play area (the canvas — a drag ANYWHERE spins the tower), the HUD over it, THE OPENING, the hold, the end
- **stage.js#12** (`const hud = h('div.ff-hud', num, call, warn);`) — (F3: F2's small area name under the number is gone — THE ARRIVAL BANNERS name an area as the ball reaches it)
- **stage.js#13** — THE ARRIVAL BANNERS (banner.js): a band across the foot of the screen on reaching an area — its text BAKED ahead of the arrival
- **stage.js#14** — F4B — THE MATCH's HUD (matchhud.js): 3 · 2 · 1 + the names, THE DEPTH RAIL, the edge markers, the OUT card, the WATCHING line
- **stage.js#15** — THE OPENING's TITLE (F3 — title-05, the owner's pick): Grok's lettering + its tagline, two pictures over the LIVE tower (the F2 tube (→ §2, docs/freefall.md MODULE NOTES)
- **stage.js#16** (`warmLogo();`) — (F5C — THE LOGO ALWAYS SHOWS: fetched + decoded during play, painted in the end screen's first frame — the cartridge's podium too)
- **stage.js#17** — (the cartridge's own card — an UNPROVEN run's, a run with no signal — has the console's way out: `o.onLeave`) (→ §3, docs/freefall.md MODULE NOTES)
- **stage.js#18** — THE SOUNDS (sfx.js — the SHARED audio engine's SFX bus; unlocked by the first touch, never before) + THE SOUNDS LIST (the page's sheet)
- **stage.js#19** — FIX A — THE TITLE's GREY FLASH (the owner's iPhone): the opening holds DARK until the rooftop's pictures are in (≤ DIM_MAX_MS), then fades in
- **stage.js#20** — THE LOST CONTEXT (JAYWALK's lesson — iOS takes a WebGL context away under memory pressure; the run is on the clock): the scene is REBUILT — destroyed + created again on the same run — the moment the context is restored, or after 1.5 s without it. No context to be had yet: the line says so, the run goes on, the rebuild tries again (every 1.5 s × 8, and when the page is back in front).
- **stage.js#21** — (FIX B — Grok's G1: the new scene gets the match's rivals again — they vanished after a lost context; a WATCH adopts the watched run next frame)
- **stage.js#22** — THE LOOK, live: the scene flips at once (night.js#setLook); the page's words follow the picture in the next frame (`data-look` — the baked number is baked again in its day ink) THE LOOK LOCK (FIX A — the review's M1): a run keeps the look it STARTED in — a change asked for mid-run (the console's setting, AUTO's sun, the test page's setLook) waits for the run's end; `o.lookLock` = a MATCH's look, stamped by the host (game.look) — always wins
- **stage.js#23** — THE ANNOUNCER: one call at a time, a bigger moment never wiped by a smaller (a Web Animations one-shot: opacity + transform, no reflow)
- **stage.js#24** — (F3B: THE BAND lies in the announcer's lane now — a call that comes while a band is up waits for it to leave, the biggest one wins)
- **stage.js#25** — ---- THE ARRIVALS: the band of the NEXT arrival is made ready between two arrivals (a timer — never the frame a ball lands in); an arrival while a band is still up (THE TRENCH's, one floor after THE BOTTOM's) crosses after it
- **stage.js#26** — F3B — THE STUTTERS: EVERY band a run can meet soon is baked AHEAD — the areas' six behind the opening (kept: the next run bakes nothing), a trench lap's between two arrivals
- **stage.js#27** (`for (let k = 0; k < 7; k++) { f = nextArrival(f); `) — (… the next six areas + the trench's first lap: from the roof, 40 · 80 · 120 · 160 · 200 · 201 · 241)
- **stage.js#28** — (THE BOTTOM's gold band comes with the IMPACT — a whole fall after the arrival's event; the run may be over by then: a finish. The fresh-eyes review: the wait is THE FRAME's — bedDue, looked at before a frame's own events and never while the run is held; a wall timer could cross behind THE TRENCH's band when the ball fell straight on through floor 200)
- **stage.js#29** — (the fresh-eyes review: a call that is UP when the band comes would lie under it — it is taken down, and said again after the band if its moment is not long gone)
- **stage.js#30** (`let whipAt = -1e9, countN = 0, countTries = 0, sta`) — (F4A — the cartridge: the spin-up · a hold's way back + its stamp · the run's end told once)
- **stage.js#31** — F3B — THE FINISH's hook: what a finished run hands on (F4's cartridge wires the match here) · the last one, for the checks
- **stage.js#32** — F4B — THE MATCH (docs/freefall.md "THE MATCH" · "THE GHOSTS"): the rivals' ghosts (ghosts.js steps them — records made once, the scene reads `gData`), THE DEPTH RAIL's rows, the markers, WATCH's playback, the test page's bot room (`o.rivals`) (F5C — THE MATCH MOMENTS: none in the first MOMENTS_QUIET_MS of a run — a rejoin's catch-up replays old outs; LAST ONE STANDING once)
- **stage.js#33** — F5C — THE MUSIC DUCKS under the big moments (sounds.js#DUCK_MS — JAYWALK's way): the page's `o.duck(on)` (the cartridge: the console's music — view.js; the test page has none). ONE window: a later moment only stretches it; released at a restart + at the end of the stage
- **stage.js#34** — (FIX A — S14: LAST ONE STANDING is said ONCE a match — a refresh does not say it again: the cartridge keeps the match's seed, `o.said`)
- **stage.js#35** — (THE BAKED HUD's warm-up: the plain + the gold digits are baked behind the opening — a NEW BEST bakes nothing in its frame)
- **stage.js#36** — `n` floors played at once through the REAL engine (a gap every time — the test page's `?floor=N` + the checks): the run goes on live from there
- **stage.js#37** — the tower turn (angle units, signed: + = a drag to the right) that brings the middle of the nearest slice of `kind` — as the floor stands at the next landing — under the ball (0 = none)
- **stage.js#38** (`if (document.visibilityState === 'hidden') hide();`) — (it went live behind a hidden page — the start waited for the sounds: held at once, never lost to the dark unseen)
- **stage.js#39** — THE START: the first drag. Tick 0 waits a moment (≤ START_WAIT_MS) until EVERY sound is decoded — no sound of a run ever takes the late path (THE SOUND SYNC; a first-ever touch is also the audio's unlock). The logo + the hint fade and the camera sweeps down meanwhile; the finger's first moves are kept (`pre`) and turn the tower from tick 0.
- **stage.js#40** — F4A — THE CARTRIDGE: GO (the proof node's first write — view.js) → the seed + tick 0 on the SERVER's clock; the sounds' decode is waited for meanwhile. The answer: { seed, t0 (this page's clock at tick 0 — it may still lie ahead), note? (an UNPROVEN run's words) }
- **stage.js#41** — (F3B — 'play' never turns ACROSS red: if the gap is further than the tower can turn before the next landing, it stops on the last  ground short of it that is not red, and goes on from there the bounce after — the checks' runs reach the floor they are sent to)
- **stage.js#42** — offer the turn still owed, tick by tick up to tick T (MAX SPIN: at most 171 units count at one tick — the tower catches up)
- **stage.js#43** — FIX A — S12 THE TAPPER: a run started by a TAP (no drag) keeps the thumb-sweep hint + DRAG TO SPIN up until the tower is turned (or floor 1 is passed); a ball left bouncing TEACH_MS on floor 0 untouched brings it back. No rules change — a class on the stage (`is-teach`).
- **stage.js#44** — FAIR INPUT: a move counts at the tick of its own EVENT TIME (pointermove's timeStamp → the nearest tick) — never "the next frame"
- **stage.js#45** (`if (T < 0) { owed += units; if (owed > OWED_MAX) o`) — (F4A — the cartridge: tick 0 still lies ahead — the move turns the tower from tick 0, as a move before the first drag's start does)
- **stage.js#46** (`if (t0 == null && !(match && !o.rivals)) { if (per`) — (the tail of a double tap on PLAY AGAIN is not a start · F4B: a MATCH starts on its count — never on a drag)
- **stage.js#47** — 1 : 1 — the ring under the ball moves exactly as far as the finger: px → radians (the view's px per radian) → angle units
- **stage.js#48** (`if (shown || held) return;`) — (THE REVIEW: no input counts while PAUSED or in the 3 · 2 · 1 — the arrow keys neither)
- **stage.js#49** — the match's rivals: [{ uid, name, hex }] — a ghost each (kept across calls: a name / a colour that changed bakes the tags again)
- **stage.js#50** — WATCH (after an out · a watcher — JAYWALK's: the leader first, a tap = the next): the camera + the tower follow that player — their own run, played back exactly, WATCH_DELAY behind ('' = back to this phone's own)
- **stage.js#51** — the match's run lands (THE FIRST GO's seed + tick 0 — it may still lie ahead): `log` = a rejoin's own moves so far · `spectate` = a watcher (no run of its own)
- **stage.js#52** (`startN++;`) — (a new run: a start still in the air belongs to the one before — and THE SHARE CARD's frame is this run's own)
- **stage.js#53** (`if (!spect && A.log && A.log.length) {`) — (a rejoin mid-run: this player's own moves so far, then on from now — unseen + unheard)
- **stage.js#54** — the test page's BOT ROOM (matchsim.js — lazy: never in the cartridge): N bots on this run's seed, fed to the ghosts as a room's proof nodes would be
- **stage.js#55** — the rail + the markers + the top line — built where something CHANGED (a floor passed, an out), never in a frame that changed nothing
- **stage.js#56** — F5C — LAST ONE STANDING (3+ players, every rival over, me still falling): once a match — JAYWALK's card + its sound
- **stage.js#57** — ONE FRAME of the match: every ghost to the world's tick (ghosts.js) → the scene's records. ZERO GARBAGE: numbers into `gData`.
- **stage.js#58** — (F5C — THE EDGE MARKERS sit on the SIDE the rival really is round the tower: x = RB · sin φ — a flip only past ±0.2, so a rival in  front never flickers between the two edges; the DOM is touched only at a flip)
- **stage.js#59** — (ABOVE me a ghost rides in the HUD's own lanes — the number, the band: fainter there, and no tag: its edge marker names it) (the screen review: at the top edge it read as a smudge beside the corner button — it thins out to nothing by the marker's own range)
- **stage.js#60** (`if (simNear) { gData[o8 + 1] = myY - ((i % 5) - 2)`) — (the SPEED TEST's own tool: every ghost in the picture at once, tags and all — never in a match)
- **stage.js#61** — F5C — RIVAL OUT: a rival's run ended OUT (red / the dark — never a finish, never time's up): the drop + "MIA IS OUT" in their colour
- **stage.js#62** — ---- THE HOLD: the page hidden / the phone locked holds a SOLO run (engine.js#hold — a logged event); back = 3 · 2 · 1, then on
- **stage.js#63** (`if (held) { countAt = 0; countShown = 0; holdN.tex`) — (hidden again during the 3 · 2 · 1: the count starts over when the page is back — never skipped)
- **stage.js#64** (`view.rest(false); last = 0; tiers.reset(); hudGap `) — (… the darkness's line + its rumble are set again from the run — the hide silenced them)
- **stage.js#65** — FIX B — S15 THE CLOCK AFTER A LOCK: a MATCH's tick 0 is the SERVER's — the page's own clock may have slept with the phone (iOS): tick 0 is anchored again from the server's time (`o.matchT0` — view.js), so the ball is where the match's clock says, never where it hung
- **stage.js#66** — F4A — a hold's way back went on WITHOUT its stamp (the line): the run says so (the view's words — the judge counts it up to that hold)
- **stage.js#67** (`if (at < 0) { countTries = RESUME_TRIES; return; }`) — (F4B — THE PAUSE GAP: this pause was NOT GRANTED — its chunk arrived too late: no stamp will come, the count is not run again; the run goes on and says so)
- **stage.js#68** — F3B — THE BREAKTHROUGHS (the scene plays them — night.js; the sounds: sounds.js#cuesOf): THE SPLASHDOWN muffles the mix for a moment · a FINISH by night: the firework's sound, softly, right after the seabed's
- **stage.js#69** (`if (e.e === 'made' && snd && !reduceM) snd.playCue`) — (reduced motion: no celebration is drawn — none is heard. F5A: by DAY too — the burst of bubbles + the sun rays have the same soft fireworks)
- **stage.js#70** — THE CROSSING (once a run): NEW BEST — the number turns gold for the rest of the run (FIX A: the MOMENT — gold, the call, its sound — only from floor NEW_BEST_FROM: a tiny best no longer flashes over the number at  floor 2; the best is kept + the end card says NEW BEST as always)
- **stage.js#71** — (F5C — the card always shows the player's name: the page hands in the signed-in one — `o.name`; '' = truly none: A PLAYER)
- **stage.js#72** — THE DETERMINISM CHECK (the console only): the recorded input log replayed through a FRESH engine — the SAME code the server's judge runs
- **stage.js#73** — F3B — THE FINISH's HOOK (match + daily: THE BOTTOM is their finish — MADE IT): the moment has played; the run is handed on ONCE, with the judge's own verdict on its log (F4's cartridge wires the match / the daily here — the test page only keeps it for the checks) (the fresh-eyes review: the run was handed on AT THE `made` EVENT — handOn; the card only adds the page's own two checks to it)
- **stage.js#74** — F4A — THE CARTRIDGE: a PROVEN run ends on the console's podium (view.js — `own: false`: this card stays away); an UNPROVEN one on this card, with its reason (`note`)
- **stage.js#75** — F4B — THE SHARE CARD's frame (shot.js — HIGH RISE S5's pattern): a beat after YOUR run's end (per cause — shotMs) the frame JUST DRAWN is copied off the canvas (night.js#snap — the picture round the ball, the card's hero box) and kept on this phone under the driver's key (`o.shotKey()` — the cartridge: its match id; else the run's seed) until the next run. Once a run; nothing is made in play.
- **stage.js#76** — F5A — THE HERO FRAME TELLS THE STORY: the moment a beat BEFORE the end, drawn once more for the card alone (shot.js) — then the screen's own frame again, in this same animation frame: the staged picture is never shown
- **stage.js#77** (`if (frameN % 15 === 0) {`) — (the console's GAME LOOK, read LIVE — four times a second; applied when no run is on: THE LOOK LOCK)
- **stage.js#78** (`} else { const c = Math.ceil(left / COUNT_MS); if `) — (F4A — the review: a slow stamp moves the count's end later — the number waits, it never jumps back up)
- **stage.js#79** — (what the tower shows AHEAD of the run: the finger's moves before the start · before tick 0 · THE SPIN-UP — one whole turn, eased out)
- **stage.js#80** — F4B — THE MATCH: the world's tick runs on past my own end → the ghosts to it; WATCH = that player's own run, played back exactly
- **stage.js#81** (`if (again && watchDelay < WATCH_DELAY_MAX) watchDe`) — (THE FRESH-EYES REVIEW: a line slower than the delay rebuilt the playback at every chunk — the delay follows the rival's own lateness, half a second a time)
- **stage.js#82** (`if (over && R0 === run && !spect && shotRun !== st`) — (F4B — THE SHARE CARD's frame: this very frame, a beat after the end — this phone's OWN run on screen, never a watched one)
- **stage.js#83** — FIX B — SMOOTH MOTION THROUGH A MISSED FRAME (VIEW ONLY): the ball + the camera are drawn from the run's own clock (`tau`, a fraction into the tick) already; the TOWER's angle is the engine's at the last whole tick — it stepped once a tick (at a 120 Hz frame every other frame, and at 60 Hz whenever the frame's stamp jittered over a tick's edge). The view now draws it at the real time: the turn the next tick WILL make (the finger's owed turn + a held key, within MAX SPIN — exactly what settle() applies at that tick, before its landing) times the fraction of the tick gone. Nothing in the engine or the proof sees it. `?smooth=0` on the test page = the old way (A/B).
- **stage.js#84** — THE HITCH LOG (F3B — THE STUTTERS; HIGH RISE's): a frame over 33 ms in a run is counted AND NAMED — what one-off work landed just before it: a picture's upload (`pic`), a sound's decode (`snd`), a band's bake (`band`), a tier step (`tier`), the HUD's own writes (`dom`); else `frame`. The last 24, in records made once.
- **stage.js#85** — (FIX A — the run's own tally, a cause each: how many · the worst · its floor — `?fps=1`'s END-OF-RUN SUMMARY reads it)
- **stage.js#86** — FIX A — THE SPIKE RULE (the owner's iPhone: HITCH 16–19 a run, single 34 ms frames — the average never moved the tiers): SPIKE.n hitches inside SPIKE.span ms step the tier down ONE (a run at most SPIKE.max steps); the tier left is held — the rule never steps back up to it in the same page (kit/tiers.js#ask's `stay`), so it never flaps. A pinned tier (`?tier=`) is never touched. FIX B — THE SPIKE RULE ONLY STEPS DOWN IF IT HELPS (the owner's iPhone: 2 → 1 → 0 and the stutter stayed): a step down opens a TRIAL — the hitches of the next SPIKE.trial ms of PLAY (the step's own stall skipped: SPIKE.settle) against the rate before it (the last SPIKE.span ms of play); not halved → the tier goes back up and the rule rests for the PAGE (the same phone, the same cause). Never below SPIKE.floor on spikes alone. The clocks are PLAY time (a run live, past its first second, not held) — a run's end pauses a trial.
- **stage.js#87** — FIX B — `?fps=2`: THE BREAKDOWN of every hitch — OUR work in the frame before the gap (the update · the scene build · the render submit), the main thread BUSY with something else in the gap (a 4 ms ping that could not run: the collector, Safari's own work), and the rest = WAITING with the thread free (the GPU / the compositor / the display). Each hitch is put in the biggest of the three: `ours` · `busy` · `gpu`. Plus the browser's long tasks (PerformanceObserver — Chromium only; Safari says n/a). Records made once; nothing in a frame.
- **stage.js#88** — (over the LAST TWO gaps: Chromium stamps a frame that waited behind a blocked thread with its old begin time — the long `dt` lands one frame later)
- **stage.js#89** — FIX B — THE A/B SWITCHES (the test page only: `o.ab` — `?dpr= · ?bloom=0 · ?fx=0 · ?wall=0 · ?ghosts=0 · ?tier= · ?smooth=0`), named at the head of every `?fps=` line so a screenshot says which were on
- **stage.js#90** (`if (ink !== hudInk) { hudInk = ink; stage.dataset.`) — (`data-area` = the area whose WALL is behind the top of the screen — THE REVIEW: it changes INK_LAG floors after a border, as the wall does: the day's inks + THE DARKNESS's look read it)
- **stage.js#91** — the cartridge's PLAY AGAIN: a stage kept warm (its scene, its programs, its sounds) is taken by the next view — into its element, the drag's ground with it
- **stage.js#92** — F4B — THE SHARE CARD's frame of THIS stage's run (shot.js — null until it ended + a beat; share.js reads it by the same key)
- **stage.js#93** — FIX B — S8: no run here (a phone not in the room's solo run): the line says so, a drag starts nothing ('' = the run may start again)

#### night-fx.js
- **night-fx.js#1** — FREEFALL — THE SCENE's SHADERS + THE BLOOM (F2: THE NIGHT LOOK · F3: every material reads `uDay` and takes its day half from day-fx.js — (→ §1, docs/freefall.md MODULE NOTES)
- **night-fx.js#2** — ---- THE BLAZE = NEON FIRE (the F2 add-on — the owner, Nov 26): a WHITE core → YELLOW → ORANGE → NEON PINK outer flame (synthwave fire). ONE ramp for everything that burns (the flame sprites, the ribbon, the ball, the shockwave): `heat` 1 = white-hot … 0 = out. The white-yellow heart is the brightest thing on the screen (it reads with the colour removed); pink is only the outer edge.
- **night-fx.js#3** — ---- THE SHAFT (the backdrop — drawn into a HALF-RES target, then copied up: a wall is soft by nature). A screen-filling quad: each (→ §2, docs/freefall.md MODULE NOTES)
- **night-fx.js#4** — ---- THE ROOFTOP's SKY = FREEFALL's OWN PANORAMA, AT FULL RESOLUTION (the add-on, Nov 26 — the owner: JAYWALK's skyline stretched round the (→ §3, docs/freefall.md MODULE NOTES)
- **night-fx.js#5** — ---- THE SLICES: ONE instanced mesh for every solid slice in sight. A slice = a wedge of the ring (aE = its own coordinates: across the (→ §4, docs/freefall.md MODULE NOTES)
- **night-fx.js#6** — ---- THE BALL: a white-hot core (its CENTRE decides — the hottest point IS the centre), a warm edge; THE BLAZE turns it to fire
- **night-fx.js#7** — ---- THE LIGHTS (one instanced quad, added light): aP = (its place, its half size) · aQ = (its kind, its strength, stretch up — a (→ §5, docs/freefall.md MODULE NOTES)
- **night-fx.js#8** — THE FLAMES: billowing flame SPRITES (Kenney's Particle Pack — assets/freefall/fx/blaze.webp: two flames, the hot speckle, the smoke), (→ §6, docs/freefall.md MODULE NOTES)
- **night-fx.js#9** — THE RIBBON: the fire's tail behind the ball — a strip that waves like a flame (it bends more towards its tip), in the same ramp: white along its heart at the ball, yellow, orange, neon pink at its edges + its tip
- **night-fx.js#10** — ---- THE SHARDS: a shattered slice's pieces — real 3D chips thrown out + down, tumbling, flown HERE (a shard = its start, its throw, its tumble axis, (its birth, its life, its size, its spin), its colour: nothing is stepped on the CPU)
- **night-fx.js#11** — ---- THE SPARKS (HIGH RISE's): a spark = its start (aO), its throw (aV), (its birth s, its life s, its width) in aT, its colour — a streak from where it was 35 ms ago to where it is, under gravity. Added light.
- **night-fx.js#12** — ---- YOUR BEST's GOLD TAPE (HIGH RISE's idea, round a ring): ONE thin line of gold light round the rim of your best floor + a soft glow off it — never a fill. The line covers what is behind it (its gold stays gold on a pink floor); held down in the bloom pass.
- **night-fx.js#13** — ---- THE HALF-RES BLOOM (HIGH RISE's — tier 2 only): the scene's LIGHTS again (every material's uBloom pass) → a half-res target → blurred at a quarter → added back over the picture

#### night.js
- **night.js#1** — FREEFALL — THE SCENE: THE NIGHT LOOK (F2) + THE DAY LOOK (F3 — ONE scene, a LOOK: `setLook('day' | 'night')`, read LIVE; every material (→ §1, docs/freefall.md MODULE NOTES)
- **night.js#2** — THE CAMERA (the graybox's): in front of the ball, `pitch`° down, a `fov`° lens; `ballY` = where the ball's floor sits on the screen
- **night.js#3** — THE POSES: `play` (the graybox's camera) · `open` (THE OPENING: high over the tower top, further back — the skyline in sight)
- **night.js#4** — (F3B — the fresh-eyes review: THE FINISH's own camera — the ball lower on the screen, the bed + what bursts over it in the picture's middle)
- **night.js#5** — a FINISH: the tower's core ends as a broken stump in the sand beside the ball — this tall (never a ball on an empty beach) F5B — THE BOTTOM's share picture: the ball's round halo at this share of its own (the gold card's white pool round the ball)
- **night.js#6** (`export const STUMP = 0;`) — (F5B — the fresh-eyes review: the stump stood BEHIND the ball, its foot hidden by it — it read as a block FLOATING over the ball in the hero moment + on the gold card: the core now ends in the sand)
- **night.js#7** — THE BLAZE's flame sprites: a FIXED pool — the tiers trim how many are lit a second (FLAME_RATE: tier 0 · 1 · 2), never the pool
- **night.js#8** — (F5B — THE WATER SWAP: UNDER THE HARBOR by night is UNDER THE WATER too — the day's water in night inks: its `1` + its rising bubbles)
- **night.js#9** (`[0.5, 0.62, 0.86, 0.2, 0.37, 0.72, 0.03, 0.04, 0.0`) — THE OFFICES: sunlit glass, daylight blue (the wall held down: white floors read on it) — F5A's add-on: its haze a DEEPER blue (it was the floors' own pale periwinkle: 0.5, 0.68, 0.92)
- **night.js#10** — an area's haze strength by day (how far the tower's lower floors fade into it): THE ROOFTOP has almost none — F3B: NO fog wash over the roof below
- **night.js#11** — THE MOTES by kind: [the shader's kind (1 a bubble · 2 a soft dot), its speed in floors a second (+ = rising), its size, its strength, its colour]
- **night.js#12** — a slice = a wedge of the ring: its top, its outer wall, its two cut sides (the foot + the pillar's side are never seen)
- **night.js#13** — (the palettes in linear light, flat: an area's 15 numbers — a · b · rim · day · dayRim; the trench's laps after the areas')
- **night.js#14** — (F3 — THE LOOK) 1 = day · by day a light COVERS what is behind it (added light is lost on a bright ground) · the haze the tower fades into · the caustics on the slices
- **night.js#15** — (F4A — THE HAZE FOLLOWS THE FLOOR: the area BELOW the border in sight has its own haze, strength + caustics — uFogSeam = that border's height)
- **night.js#16** — (a twin is BUILT from the material's own pieces + the SAME uniforms object — never cloned: a clone copies every uniform, the wall's target too)
- **night.js#17** — (F3B — THE BREAKTHROUGHS) the room's lights come on under a broken skylight · the light shafts under the harbor's surface
- **night.js#18** — THE ROOFTOP's SKY (the add-on, Nov 26): FREEFALL's own panorama on a FULL-RESOLUTION quad over the half-res wall — drawn only while the rooftop is on screen (the opening + floors 0–39); it shares the wall's camera + seam + darkness uniforms (the same objects)
- **night.js#19** — THE ROOF BELOW (F3B): the painting + the city's tile, its plane (set every frame — draw()), how much of it is there, the skylight open
- **night.js#20** (`tGrain: { value: null }, uHaveG: { value: 0 }, uGr`) — (F5A — THE ROOF GRAIN: its detail tile · how much of it is in — 0 far below, 1 over the landing)
- **night.js#21** — (NOT `transparent`: three.js draws every transparent mesh after the opaque ones — the sky would lie over the pillar + the ball. It is  an opaque-pass mesh, second in the scene's order, that blends itself over the wall by its own alpha)
- **night.js#22** — the pictures: decoded off the frame (createImageBitmap) and uploaded AT ONCE (HIGH RISE's LAG RULES 1) — never at their first draw
- **night.js#23** — (`repeat`: true = it tiles both ways · 2 = THE PANORAMA, round the compass only · 3 = THE CITY's tile, MIRRORED both ways · 4 = ONE picture, never repeated)
- **night.js#24** — (`repeat` 2 = THE PANORAMA: it repeats on u only, its mipmaps + the GPU's anisotropy keep its windows windows at every tier)
- **night.js#25** — (F3B: every picture of the look is in memory at once now — once it is ON THE GPU its decoded bitmap is let go: half the memory.  A lost context builds the whole scene again from the network's cache — night.js never uploads a texture twice)
- **night.js#26** — (a wall's name + its address by look, made ONCE — a frame builds no string: [night, day][the area]; the night's keys are the walls' own names)
- **night.js#27** — THE ROOFTOP: FREEFALL's own panoramas — the night's, the day's (the look's own is the only one asked for; JAYWALK's skyline is no longer used)
- **night.js#28** — THE BREAKTHROUGHS' textures (F3B): the sprites, the seabed's sand (F5A: the water is worked out in its shader — Water 001's normal map is gone)
- **night.js#29** — THE STUTTERS (F3B — the owner's iPhone: HITCH 9 a run): a picture's first upload mid-run was a long frame — EVERY picture of the look on screen is asked for behind the opening (the four walls, the panorama, the roof below + its city; the breakthroughs' textures above): nothing is decoded or uploaded while a run is on (a look that turns mid-run asks for its own set at once)
- **night.js#30** — ---- THE SHARDS + THE SPARKS + THE LIGHTS (pools — a shatter writes into the next free records, the shaders fly them)
- **night.js#31** — THE MOTES (F3 — by day: UNDER THE HARBOR's rising bubbles, THE DEEP's drifting particles, the dust in a sunlit room): a FIXED pool of quads flown in their shader (a mote's place is a pure function of the time) — the tiers trim how many are drawn
- **night.js#32** — THE ROOF's PLANE in the world (set every frame — roofPlane()): the roof below's painting, the skylight's deck, frame + glass all lie on it
- **night.js#33** — THE BREAKTHROUGHS (F3B — breaks.js): the skylight (its deck, frame + glass), the water, the seabed + its rocks, the sprites — each drawn only while its floor is near; they read the scene through these few hands (the spark pool, the camera's kick, a flash on the floors)
- **night.js#34** — (the draw order, fixed once: the shaft · the pillar · the slices · the breakthroughs' planes · the tape · the shards · the motes · the fire's ribbon + flames · the ball — its white heart on top of its own fire · the lights · the sparks · the sprites)
- **night.js#35** — ---- the floors in sight: a ring of records written INTO (never a new object in play) + what happened to each (broken · cracked · its flashes)
- **night.js#36** — THE AREA PALETTE, DEPTH-RELATIVE: this floor's own colour — a → b down its area; its last three floors lean to the next area's
- **night.js#37** — FIX B — THE TEST PAGE's A/B SWITCHES (`o.ab` — play.js; the cartridge passes none: everything on) · the frame's own clocks for `?fps=2`
- **night.js#38** — a FINISH's floor (match + daily: THE BOTTOM — no floor is drawn from there down: the seabed is the floor) · −1 = endless
- **night.js#39** — (F5A — THE SHARE CARD's STAGED frame, shot() below: the camera's step back · the glow's share · no punch light, no sparks)
- **night.js#40** — a scene built again mid-run (a lost context): what the events so far did to the floors still in sight — no effect is played again
- **night.js#41** — the camera looks at a point below the ball's floor so that floor sits `ballY` down the screen (the graybox's maths)
- **night.js#42** — the screen pixels ONE RADIAN of tower turn moves the ring under the ball IN THE PLAY POSE (the drag's 1 : 1 — never the opening's)
- **night.js#43** — the ball's height over its floor's top (world units) at `tau` ticks — the VIEW's own arc between the landings the engine gave
- **night.js#44** (`if (run.st === 'made') return SHAPE.H * (1 - u) * `) — (F3B — THE BOTTOM: the finish's last drop onto the seabed is the VIEW's own — `tau` runs on past the run's end)
- **night.js#45** — the walls the shaft shows now: the camera's area (A) + the next one (B), the seam between them at a world height — in the LOOK's own pictures + numbers
- **night.js#46** — F4B — THE GHOSTS (ghost-fx.js): the match's rivals on MY tower — their own small scene over the picture's depth; the stage hands the records (ghosts.js steps them), this only places + draws them
- **night.js#47** — a rival passed a BREAKTHROUGH (the skylight · the splashdown · THE BOTTOM): a small echo only — a few sparks in their colour where their ball is
- **night.js#48** — one frame: the run, `tau` = the clock in ticks (a fraction into the next one), `dt` ms since the last frame, `extra` = angle units the tower shows ahead of the run (the finger's moves before tick 0)
- **night.js#49** — (F3B — a FINISH: the run is over at the tick the 200th floor is passed, the ball's last drop onto THE BOTTOM is the view's — its clock runs on)
- **night.js#50** — (a FINISH: over the last floor's fall the core stays behind as a STUMP in the sand — it stops going down with the ball a little short of the bed)
- **night.js#51** (`pillar.position.y = -(want > S[CAMY] ? want : S[CA`) — (its cap flush with the ball's floor — the dark eye in the middle of the top ring; it goes down with the BALL's own glide: never a stub over the floor it lands on)
- **night.js#52** — (a finish: no floor from THE BOTTOM down — the seabed is the floor · THE ROOF is shut until the skylight breaks: nothing under it shows)
- **night.js#53** (`LC[0] = 1; LC[1] = day ? 0.09 + 0.13 * bz : 0.42 -`) — (lit: the fire's own neon-pink outer glow; unlit: as it was — by day the pink ball's own #ff50aa)
- **night.js#54** — THE BLAZE = NEON FIRE: the ribbon behind the ball, flames shed where it has just been (it falls away from them: a billowing column), embers drifting off it — a fixed budget, the tier trims the rate
- **night.js#55** — THE LOOK's own (F3 — by day): the haze the tower fades into (the ball's area's — it eases across a border), THE CAUSTICS on the slices (→ §2, docs/freefall.md MODULE NOTES)
- **night.js#56** — THE BREAKTHROUGHS' word back: the skylight open (the room below shows under the seam), the roof below gone, the room's lights, the shafts
- **night.js#57** (`if (staged) { sparks.visible = false; if (state ==`) — (… and THE BOTTOM's picture without the last floor's red shards: red is the death colour — never the subject of the WIN card)
- **night.js#58** (`if (bloom && tier === 2) bloom.render(scene, cam, `) — (by day only the ball + the fire give light — and less of it: the scene is bright already)
- **night.js#59** — F4B — THE GHOSTS: over the finished picture, on its own depth (seen · x-ray where the tower hides them · the name tags on top)
- **night.js#60** — THE WARM FRAME: one of everything, drawn once before the first drag — every program built, every buffer uploaded (HIGH RISE's LAG RULES 3)
- **night.js#61** (`breaks.force(true);`) — (F3B: the breakthroughs' pieces drawn once too — in the picture AND the bloom pass: no program is built at floor 30)
- **night.js#62** — THE LOOK, live (F3): 'day' | 'night' — at once (the other look's pictures come in off the frame; until one lands its wall shows the area's tint)
- **night.js#63** (`preload();`) — (the look's own pictures — asked for at once: a look that turns mid-run has them a moment later)
- **night.js#64** — YOUR BEST's tape: gold — but on GOLD floors (THE SPEAKEASY's brass) WHITE with a dark edge, in both looks (F3B — the owner)
- **night.js#65** (`if (!o.alive) { if (!o.party) breaks.quiet(true); `) — (FIX B — `party`: the finish's celebration stays in the zoomed-in picture)   // (THE BOTTOM: the ball on the seabed in its gold ring — the dust would lie over it; F5B: the ring crisp, the ball's halo small)
- **night.js#66** — (the slice under the ball wears no leftover flash in the picture: it reads RED — its glow is THE MARK's, red-hot, in draw())
- **night.js#67** — where things are on the screen — the page's own check: the ball (its centre + its size in px), its floor's line, the floors in sight under it
- **night.js#68** — the screen y (0 … 1) of the TOP of the ball at the top of a bounce on its floor, in the PLAY pose — the HUD must end above it
- **night.js#69** — FIX A — THE TITLE's FIRST LOOK: the look's panorama + the roof below + its city are in (the opening holds dark until then)

#### view.js
- **view.js#1** — FREEFALL — THE GAME's SCREEN (F4A — docs/freefall.md "THE CARTRIDGE" · "THE PROOF"; HIGH RISE's view.js is the pattern): THE STAGE (→ §1, docs/freefall.md MODULE NOTES)
- **view.js#2** — the podium is waited this long after a proven run's end before the stage's own card says NO SIGNAL (never a frozen screen)
- **view.js#3** — PLAY AGAIN on the stage's own card: the orphan match's end is waited this long before the stage starts over in it
- **view.js#4** — F4B — a MATCH: a match is over (the host's step) while this phone's own ball still falls: the podium waits for its end at most this long
- **view.js#5** — … the cause's words stay this long over the scene before Call the Winner / the watcher's view (THE FINISH: its moment is seen first)
- **view.js#6** — FIX B — S8: the line on a phone that is not in the room's solo run · S9: the podium's plain list comes this long after it, if the block has no rows
- **view.js#7** — THE SCENE STAYS WARM over PLAY AGAIN (the console's INSTANT AGAIN remounts the view): the stage is parked a moment, the next mount takes it back (its WebGL context, its programs, its pictures, its decoded sounds) — anything else frees it at once. The stage is ONE object whose driver (`drv`) hands every call to the view that holds it now (`cur`).
- **view.js#8** (`said: { seen: s => ls.get('ff:last') === s, keep: `) — (FIX A — S14: LAST ONE STANDING once a match, a refresh too)   // (THE LOOK LOCK: a match's look = the host's stamp, game.look)
- **view.js#9** — YOUR BEST: the SERVER's — the best it last told this phone (a counted run's answer) — once counting is ON; while THE SWITCH is OFF this phone's own (the test page's). A run on this stage never writes it.
- **view.js#10** — F5C — THE MUSIC DUCKS under the big moments (sounds.js#DUCK — JAYWALK's view.js#applyDuck): the level found is put back after
- **view.js#11** (`let final = null, finalWrap = null, goTimer = 0, f`) — (capN: the log's events through a hold whose way back got no stamp — nothing past them is sent)
- **view.js#12** (`let holdSrv = 0, holdN = 0;`) — (holdN: the log's events through that hold — its chunk is ACKNOWLEDGED once the writer's `acked` reaches it)   // (F4B — THE PAUSE GAP: the SERVER's time this phone's last hold was made at — its chunk must be stamped within GRANT_PHONE_MS of it)
- **view.js#13** — FIX B — Grok's G2: A YIELDED DUPLICATE TAB (the same slot open twice on a desk: `state.dupTab` — app.js) NEVER WRITES PROOF: no strand, no GO, no chunk, no end; a running match is adopted as a SPECTATOR (`dupSeen`). The tab takes over (dupTab → false) → the normal sync, as a refresh does (a match re-adopted: a rejoin of this player's own moves; a solo run stranded from its node)
- **view.js#14** (`let outSrv = 0, finalRes = '', plainT = 0;`) — (FIX B — S1: the server's time my run ended · the results the podium shows · S9: the fallback's check)
- **view.js#15** — THE CONSOLE FIX — THE RUN HOLD (kit/run-hold.js; docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): this phone's own PROVEN run is played to its own end whatever the host's state says — no podium over it, the router keeps this screen through a moved-on room; then its end is written and the phone follows. The podium waits for the rivals' live runs the same way.
- **view.js#16** — the podium after a wait: scored from the nodes as they stand now (the host's own step — director.js#finalPatch), never an early `final`'s numbers
- **view.js#17** — a chunk / the end still in flight when the match left `play` is an EXPECTED refusal — counted, never a row (JAYWALK's THE LATE PROOF CHUNK)
- **view.js#18** — THE PROOF (kit/proof-writer.js — JAYWALK's + HIGH RISE's): the log's FINAL events go up as chunks, every 250 ms while there are new ones, each stamped by the SERVER when it arrives; ONE burst at a time, a refused chunk sent again, never dropped on the mirror alone; then `e` behind the last chunk's acknowledgement
- **view.js#19** — GO: the proof node's first write — the SERVER's time, read back → the seed + tick 0. → what the stage adopts: { seed, t0, note }
- **view.js#20** — (A LATE ANSWER NEVER TOUCHES A RUN THAT WENT ON: each call checks ITS OWN state — done / gone / another match — BEFORE it writes anything of the view's)
- **view.js#21** (`if (dup()) { go = 0; proven = false; whyNot = 'dup`) — (FIX B: a yielded tab — its run plays, never proven; the GO stays unspent for the tab that plays)
- **view.js#22** — THE SOLO GO (highrise/go.js): THE STAMP + the GO, tried again when refused, the server's copy of the node read again while an answer is owed — all inside GO_WAIT_MS. THE STAMP first: the tree's first write (kit/proof-io.js#stampT0 — t0 + the room's tree counter)
- **view.js#23** — (F4B — THE FRESH-EYES REVIEW: the GO is a TRANSACTION, NEVER APPLIED LOCALLY — as a match's. A plain set shows in this phone's  own mirror at once with the phone's GUESS of the server's time: a look at the node while the write was still in the air took  that guess for the GO — the phone then played one tower, the judge replayed another)
- **view.js#24** — (a GO already carrying chunks = a run of before a refresh: never started again · an answer that took too long: the darkness has  most of its grace already — the run plays UNPROVEN; the GO stays without an end: nothing of it is ever counted)
- **view.js#25** — F4B — THE PAUSE GAP: WAS THIS PAUSE GRANTED? The hold's own chunk (the hold + every move before it) must have ARRIVED — the SERVER's (→ §2, docs/freefall.md MODULE NOTES)
- **view.js#26** — → true (the i-th hold's chunk was stamped in time) | false (it was not — or it is not there); rejects = no answer (the line)
- **view.js#27** — THE FRESH-EYES REVIEW (HIGH): this phone's mirror answers a read from its LOCAL view — a chunk still in the air is there with the (→ §3, docs/freefall.md MODULE NOTES)
- **view.js#28** (`if (capN < 0) capN = finalCount(S.run());`) — (the run is still held here: every event through the hold is final, none past it exists)
- **view.js#29** — the run is over: the last chunk, then `e` — the host's step ends the match on it (a signal: never read as a score)
- **view.js#30** (`if (!outSrv && isMatch) outSrv = serverNow();`) — (FIX B — S1: the moment MY end was written — the host's podium after it is a late one only if it came before)
- **view.js#31** — "YOUR OWN PHONE MISSED THE GO": has a ball NOBODY STEERED already ended on the match's clock? (the darkness — the engine's own answer)
- **view.js#32** — "YOUR OWN PHONE MISSED THE GO" (HIGH RISE's): it reaches the match's real clock with NO moves of its own, and on that clock the darkness has already ended a ball nobody steered — it WATCHES (a late joiner's view), told plainly; its end is signalled (the room does not wait 18 s for it); the server counts no player who passed no floor
- **view.js#33** (`feedRivals(g, runs || {});`) — (the ghosts are set BEFORE the stage adopts: it starts every one of them on the match's seed)
- **view.js#34** — OUT in a match: the cause's words over the scene for a moment, then Call the Winner (two or more still falling), then WATCH THE LEADER
- **view.js#35** — (JAYWALK's THE LATE k WRITE: never a pick for a player whose own end is already here; a refusal after the match moved on is expected)
- **view.js#36** — WHOM THE WATCHER FOLLOWS: the one picked by a tap while they fall · else THE LEADER (the one you follow STAYS while they fall)
- **view.js#37** — (a rival with NO NEWS — a dead phone, a dropped signal: `lost` — is never OUT on this screen, so it stayed "live" for ever: the line  said WATCHING <the dead phone> for the whole wait and WAITING FOR … · NO SIGNAL below could never show. The words count the ones seen falling.)
- **view.js#38** — (TWO SHORT LINES — the match's end-to-end run: one long line wrapped to three at 390: who + their floor, then the hint / your call)
- **view.js#39** (`const sub = [callLine, up.length && F && hint ? (c`) — (a 12-letter name beside YOUR CALL: the hint in its short form — the line stays ONE line at 375)
- **view.js#40** — the seed + tick 0 (match.js#startOf: THE NODES ARE THE TRUTH) — in the count and in `play` alike; the game's own only with no node to read (UNPROVEN)
- **view.js#41** — (never adopted from the game alone while the proof mirror is still on its way — a refresh mid-run would take the match with NO moves  of its own. A proven match in `play` always has a node to read: wait for it.)
- **view.js#42** — (THE PROOF PASS: a GO of this phone's own that landed LATER than the window after THE FIRST GO is no run — the server drops it  (core/proof.js#onTime): nothing is written for it, the out card says NOT COUNTED.)
- **view.js#43** — (THE CONSOLE FIX: once proven, the host's game can not take it back — participants / `unproven` rewritten mid-run stopped the chunks)
- **view.js#44** — (… a phone that MISSED THE START and has a GO of its own: its end is signalled once — the room never waits 18 s for it)
- **view.js#45** — (a run that ENDED while the match was marked unproven — the host's hiccup — never wrote its `e`: once proven again, the end goes up now)
- **view.js#46** — THE PODIUM for everyone (the host's step) — once this player's own end has been SEEN (the stage's end hold, the finish's moment); a (→ §4, docs/freefall.md MODULE NOTES)
- **view.js#47** — FIX B — S1: THE HOST RE-SCORED (a silent phone's end landed after the podium — director.js#rescore): every phone's podium follows
- **view.js#48** — the stage's end moment in a match: OUT (or the finish / the bell) — the watcher's view follows; the podium comes with the host's step
- **view.js#49** — the end card's moment: a PROVEN run ends on the console's podium (it comes with the host's step); an UNPROVEN one on the stage's own card
- **view.js#50** — (the end has not reached the room — no signal: never a frozen screen; the run is in the node / the queue and counts when it lands)
- **view.js#51** — (FIX B — S8: BACK on a phone that is not the host — a friend back after the start, a solo player whose host role moved on: the  console's own way out of the match (ui/final.js's), never a silent no-op with the button left busy)
- **view.js#52** — (a MATCH's rows: everyone in order with their floors + how their run ended — the console lists them as slim cards)
- **view.js#53** — F4B — THE END SCREEN's HEADER = THE LOGO (the owner's approved mock): title-05's lettering + the mode in small teal caps, in the console frame's own header slot (the frame's kicker words stay for a reader: the logo is the heading)
- **view.js#54** — FIX B — S9 THE PODIUM's FALLBACK: in a match the shared block (ui/end-board.js — lazy) is the ONLY place that names the winner; if it did not load, or its kits failed (no rows), a plain three-line list in the body says who fell the deepest
- **view.js#55** — (FIX B — G2: the yielded tab TAKES OVER: as a refresh — a match adopted as a watcher is adopted again (a rejoin of the moves in the node)) (the fresh-eyes review — MUST: EVERY edge, both ways: a tab that yields mid-run is adopted again as a WATCHER — its local run, which  can no longer be written, is dropped — and a tab that takes over is adopted again from the node, whatever it was before)
- **view.js#56** — (… a SOLO run that was proven when its tab yielded: the writer reads `proven` — it sends nothing while yielded, and goes on after)
- **view.js#57** (`if (matchLeft()) lateProof('seen');`) — (from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
- **view.js#58** — FIX B — S8: a phone NOT in the room's solo run (back after its start): no GO, no run — the line says so; the podium comes as for everyone
- **view.js#59** — (F4B — THE PAUSE GAP: a HELD run's log — the hold with it — leaves AT ONCE, even behind a chunk in the air: its arrival is what grants the pause)
- **view.js#60** — FIX B — S6 (a): a deliberate LEAVE (the room left) mid-run with a live proven run: its END goes up now (the writer sends it behind the last chunk, even closed) — the others never wait 18 + 75 s for a phone that left. The judge scores the log as it stands.

#### break-fx.js
- **break-fx.js#1** — FREEFALL — THE BREAKTHROUGHS' SHADERS (F3B — docs/freefall.md "THE BREAKTHROUGHS"; breaks.js builds the pieces, night.js owns the ONE (→ §1, docs/freefall.md MODULE NOTES)
- **break-fx.js#2** — ---- THE SPRITES (a FIXED pool of quads, flown HERE — the tiers trim how many are shed, never the pool): dust + foam + mist (soft (→ §2, docs/freefall.md MODULE NOTES)
- **break-fx.js#3** — ---- A PANE THAT BREAKS (the skylight's glass · the seabed that cracks open): ONE instanced mesh of TRIANGLES — the pieces it will break (→ §3, docs/freefall.md MODULE NOTES)
- **break-fx.js#4** — ---- THE SKYLIGHT's FRAME (instanced boxes: aP its place, aS its size, aQ = its kind — 0 the outer frame · 1 a glazing bar · 2 a NEON TUBE —, its number round the frame, a seed): by night the tubes outline the frame; the hit SHORTS them — they flicker out one after the other round it (uBreakT); the glazing bars fall away with the glass. By day the tubes are unlit. F4B — the skylight's outer frame + its tubes are gone this long after the break (the deck's own 0.25 s — DECK_F)
- **break-fx.js#5** — ---- THE ROOF's DECK round the skylight (the painting itself on the roof's own plane — the same picture the roof below shows, with a fine grain of its own for when it is close; it fades out all round into it): a hole where the skylight's own glass is; by night the neon tubes' light lies on it (until they short).
- **break-fx.js#6** — ---- THE WATER (THE SPLASHDOWN — floor 120): a real plane across the shaft. F5A — THE WATER SURFACE REBUILT to the owner's two targets (→ §4, docs/freefall.md MODULE NOTES)
- **break-fx.js#7** — FIX A — the ripple map's slopes were stretched × RIP_K when it was baked (scripts/build-freefall-assets.py#RIP_K)
- **break-fx.js#8** — ---- THE SEABED (THE BOTTOM — floor 200): real sand (Ground 055 S: colour + normal), lit from above; the tower's own glow + the ball's light lie on it; by day the water's caustics. THE IMPACT: a shockwave ring of sand + light runs out from under the ball (uImpT). SAND = the look, shared by the plane (SEABED_F — outside the square that cracks) and the pieces (CHUNK_F — the square that cracks open).
- **break-fx.js#9** — … a rock's SHADOW on the sand (a soft dark pool under it, thrown a little away from the light — the same instances as the rocks)
- **break-fx.js#10** — ---- THE DAY FINISH's SUN RAYS (F5A — THE DAY CELEBRATION): shafts of sunlight falling through the water from high above onto the spot where the ball came down — a fan of soft moving rays on one upright card behind the ball (turned to the camera in its vertex shader), pure added light; it comes with the burst of bubbles (uT0) and is gone 3.4 s later.

#### breaks.js
- **breaks.js#1** — FREEFALL — THE BREAKTHROUGHS (F3B — docs/freefall.md "THE BREAKTHROUGHS"): THE SKYLIGHT (floor 40, the rooftop → the offices) · THE (→ §1, docs/freefall.md MODULE NOTES)
- **breaks.js#2** — the skylight: its glass's half size (the ring is 1 wide: it passes inside the frame) · how far above floor 40 the pane lies · its frame's bar
- **breaks.js#3** — the water: how far above floor 120 the surface lies · THE WATERLINE's sweep up the screen (s after the plunge, for how long)
- **breaks.js#4** — the seabed: how far under floor 200's top it lies in SOLO (under that floor's own slab — a finish has no floor 200: the bed IS the floor) · the square that cracks open
- **breaks.js#5** (`export const SEABED = Object.freeze({ down: 0.26, `) — (mouth — SOLO: the half-width of THE TRENCH's MOUTH, the cleft the tower goes on down: the rings' 1.0 + a margin)
- **breaks.js#6** — a break is only PLAYED when its moment is fresh: an event this many ticks old (a batch that came back from a hidden page) just happens
- **breaks.js#7** — the pieces a square pane breaks into: triangles laid out round the point of impact (ix, iz) — `sectors` round it, `rings` out to the pane's own edge (its four corners are among the rays: the pane is covered exactly)
- **breaks.js#8** — one sprite into the pool: its start, its throw, its life, its size (birth → end), its cell, its gravity, its drag, how far it swirls, its spin, its colour, how much it covers
- **breaks.js#9** — ---- THE SKYLIGHT: the deck round it (the roof's own painting, at the skylight's true size), its frame + neon tubes, its glass
- **breaks.js#10** — (the frame: four outer bars · the glazing bars — 5 each way, the painting's 6 × 6 panes · eight neon tubes, two a side)
- **breaks.js#11** — (THE ROOF's PLANE — night.js's own matrix, set every frame: the skylight rides the roof seen far below, and IS the true roof at the hit)
- **breaks.js#12** — (F5A — THE WATER SURFACE: worked out in its shader — the wall's own painting is all it reads; its ripple LINES need the derivatives)
- **breaks.js#13** — (… + FRONT_ROCKS more in front of the ball, a FINISH's only — the last ones of the list: the bed there is whole, and never an empty beach)
- **breaks.js#14** (`{`) — F5A — A BOULDER WORN BY THE WATER (it was the ball of a coarse icosahedron with every corner knocked its own way: a spiky low-poly
- **breaks.js#15** — lump): a finer ball pushed about by a SLOW noise of its direction — broad shoulders + hollows, no spikes —, flatter than it is wide; its normal is the pushed surface's own (two near directions, their cross): smooth light, the same at a shared corner
- **breaks.js#16** — (… and never in THE TRENCH's MOUTH — the cleft that runs from the tower toward the viewer: a rock there would hang in the air in SOLO)
- **breaks.js#17** — ---- the state (numbers only): each breakthrough's stage · the tick its moment is due · the scene time it happened at
- **breaks.js#18** (`bedHole.value = fin === BREAK_FLOORS.bottom ? 0 : `) — (SOLO: the tower goes on down THE TRENCH's MOUTH — the floor under the ball is always in sight)
- **breaks.js#19** — an event of the run (engine.js) at the run's clock `tau`: an `area` event's tick is the tick the ball leaves the floor above
- **breaks.js#20** — THE SHORT (night): the neon tubes throw a shower of sparks — white-blue + orange — from all round the frame; by day a few white glints of glass
- **breaks.js#21** (`for (let k = 0; k < (X.reduce ? 6 : share(22)); k+`) — (F5A — the review: fewer, finer, under white — the crown was a clipped white core with hard bars)
- **breaks.js#22** (`for (let k = 0; k < share(6); k++) { const a = k /`) — (F5B — THE CROWN CAPPED: six puffs spread round the ring, never piled on one point, in the water's own aqua / cyan at most CROWN's light — it flashed near-white for a frame; F5A: by day a touch of the water's own aqua, born smaller + clear of the surface — the crown was one clipped white lump cut flat by the water)
- **breaks.js#23** (`for (let k = 0; k < share(7); k++) { const a = k /`) — (F5B: the ring of foam in the water's own colour — its seven large puffs piled up into the white cloud)
- **breaks.js#24** — the dust cloud: sand lifted off the bed, rolling out + up, slowed by the water (a FINISH: all round the ball · SOLO: off the shelves)
- **breaks.js#25** — (F5A — SOFT: many thin veils of lifted sand in the sand's own lit colour — never a few heavy dark blobs) (a veil's light is its colour × its cover: piled up, the veils come to the dust's own colour — never to white)
- **breaks.js#26** — a FINISH: the celebration comes right after — by night the firework, by day THE DAY CELEBRATION (F5A: bubbles + sun rays)
- **breaks.js#27** — one firework-style burst: glowing stars thrown out all round a point, slowed by the water, + a glint at its heart
- **breaks.js#28** — (F4B — THE FRAME BAR: once the pane breaks nothing of the skylight / the roof stays between the camera and the floors — the deck +  the outer frame + its tubes are gone in 0.25 s (their shaders), the glazing bars fall with the shards: not drawn at all 1.6 s on)
- **breaks.js#29** (`const spNear = spSt < 2 && camY > 104 && camY < 12`) — (asked AFTER the sweep's own step: the plane is gone in the very frame the camera is under)
- **breaks.js#30** — THE WAKE under the surface: by night glowing cyan PLANKTON swirls where the ball has just been; by day a trail of small bubbles
- **breaks.js#31** — (the fresh-eyes review: ROUND THE BALL — over the sand, between the ball and the band; never up at the number or off the sides)
- **breaks.js#32** — THE WARM FRAME's share: every piece drawn once (their programs — the picture's + the bloom pass's — are built behind the opening)
- **breaks.js#33** — (F5A — THE SHARE CARD's staged frame of THE BOTTOM: the sprites — the dust over the ball — are left out of that one picture)
- **breaks.js#34** — F5B — THE BOTTOM's SHARE PICTURE (night.js#shot): the gold ring CRISP + tight round the ball, the flash under it held down (the gold card read as a hazy white blur at 360 px) — never in play

#### ghosts.js
- **ghosts.js#1** — FREEFALL — THE GHOSTS (F4B — docs/freefall.md "THE GHOSTS"; JAYWALK's ghosts.js is the pattern: STEPPED conf → run). PURE (no DOM, no (→ §1, docs/freefall.md MODULE NOTES)
- **ghosts.js#2** — a HELD ghost (it would go out / finish, unconfirmed) is drawn where it stood this long (ms) — the network's beat; past it: not drawn until news of it
- **ghosts.js#3** — a ghost this many ticks past its last LANDED move with no end here = NO SIGNAL (a ball nobody steers is out in 9 s: their phone is away)
- **ghosts.js#4** — the ball's own arc between two landings, in world units (pinned equal to night.js#SHAPE by tests/freefall-match.test.mjs — this file imports no view)
- **ghosts.js#5** — a ghost this many floors or more away from me gets an EDGE MARKER (it is off the picture) · at most this many markers each way
- **ghosts.js#6** — … ABOVE me the picture ends sooner (the ball's floor lies a third down the screen: two floors up are under the HUD)
- **ghosts.js#7** — … on a slower line the delay grows with the rival's own lateness (the stage: + half a second at each rebuild), up to this (5 s)
- **ghosts.js#8** — a run's whole state into another run of the SAME seed + mode (their logs are never copied: the drawn run is only ever stepped)
- **ghosts.js#9** — the ball's height over its floor's top at `tau` ticks, in world units — the VIEW's arc (night.js#ballLift's own shape)
- **ghosts.js#10** (`n: 0, pt: -1, pa: 0, moves: 0,`) — the chunks read · the log's own carry (the tick + the angle of the move before) · the moves landed
- **ghosts.js#11** (`done: false, bad: false, fresh: false, seen: false`) — their own end is here · a chunk the engine refused (the judge will refuse that log) · confirmed news since the last frame
- **ghosts.js#12** (`off: false, oa: 0, oy: 0, ot0: 0, oms: 1,`) — the catch-up: the angle (units) + the height (world units) still to close, from when, for how long
- **ghosts.js#13** (`a: 0, y: 0, floor: 0, lost: false, lostAt: 0, over`) — WHAT IS DRAWN: their tower's angle · the ball's height (world y) · its floor · not drawn (no news) · ended (how)
- **ghosts.js#14** — the match's seed moved (THE FIRST GO landed late on this phone): the ghost starts again on it — their chunks are read again
- **ghosts.js#15** — (the confirmed run may END at their last landed move's own tick — the log itself says so — a beat before their `e` is here: the  drawn run then stands where it stood until the end is signalled: OUT ONLY ONCE CONFIRMED BY THEIR OWN END)
- **ghosts.js#16** — THE DRAWN RUN: on to the world's tick with no new move assumed. A landing that would END it is not taken until their own end says so
- **ghosts.js#17** (`if (G.lost && !wasLost) G.lostAt = now;`) — (FIX B — S7: since when — a row LOST longer than LOST_GONE_MS is `gone`: out of the count + LAST ONE STANDING)
- **ghosts.js#18** — WHERE A GHOST IS DRAWN ROUND MY TOWER: the world angle (units, 0 = the front where MY ball is) = (the ball's angle − their tower's) + MY tower's
- **ghosts.js#19** — ---- F5C — THE MATCH MOMENTS (the owner, Nov 27 — JAYWALK's are the pattern: docs/jaywalk.md "THE MATCH MOMENTS") RIVAL OUT: the callout's words — "MIA IS OUT" (never for my own out: I have the crash)
- **ghosts.js#20** — LAST ONE STANDING's line (lead = my floors − the deepest rival's): "+23 FLOORS AHEAD · KEEP FALLING" · "12 FLOORS TO THE LEAD · KEEP FALLING"
- **ghosts.js#21** — FIX A — S14: the rivals who HIT THE BOTTOM (floor 200 — the lead can not be taken from them) → { name: the first of them, n: how many } · null = none
- **ghosts.js#22** — FIX B — S7: a rival with no news this long (a dead phone, a dropped signal) is `gone` — not "PLAYING", never in the way of LAST ONE STANDING, never WATCHED on
- **ghosts.js#23** — whom to follow: `stay` while they are still falling — else THE LEADER among the ones still falling — else the deepest of all ('' = nobody)
- **ghosts.js#24** (`if (r.uid === stay && !r.over && !r.gone) return s`) — (FIX B — S7: the one followed stays while they fall — not once their phone has been silent > LOST_GONE_MS)
- **ghosts.js#25** — a TAP = the next player: the ones still falling, deepest first, round and round (nobody still falling: everyone, deepest first)
- **ghosts.js#26** — (their end here: the whole run. Else the ball goes on by the rules with the tower held — and a landing that would END the run WAITS for  their own `e`, the fatal landing at their last landed move's own tick too: THE FRESH-EYES REVIEW — the playback showed that out a  beat before the end was signalled)
- **ghosts.js#27** — would the next landing / the darkness's next step END this run? (asked on a scratch copy — the watched run itself is never taken there unconfirmed)

#### day-fx.js
- **day-fx.js#1** — FREEFALL — THE DAY LOOK's SHADER PIECES (F3 — docs/freefall.md "THE DAY LOOK"; night.js builds the ONE scene both looks share, night-fx.js (→ §1, docs/freefall.md MODULE NOTES)
- **day-fx.js#2** — THE CAUSTICS (the shader's own — ff-caustics.png is not used): the bright net where ripples of light cross, moving
- **day-fx.js#3** — the wall shader's DAY half (inside its main: `d` the ray, `on` it met the wall, `hit` where, `uv` the wall's own coordinates, `k` 0 = wall A … 1 = wall B below the seam)

#### engine.js
- **engine.js#1** — FREEFALL — THE ENGINE (F1 — docs/freefall.md "THE ENGINE"): THE ONE RULE — the same seed + the same INPUT LOG = the exact same run on (→ §1, docs/freefall.md MODULE NOTES)
- **engine.js#2** (`floor: 0, at: 0,`) — THE FLOORS PASSED (= the floor the ball is on / falling to) · the tick that floor was reached (THE RANKING)
- **engine.js#3** (`clean: 0, blaze: false,`) — floors fallen in a row without a bounce since the last bounce / shatter · THE BLAZE is lit
- **engine.js#4** (`nb: 0, maxNb: 0,`) — THE NO-BOUNCE RUN (gaps + shatters, reset only by a bounce) · its best (TERMINAL VELOCITY)
- **engine.js#5** (`sh: false, saves: 0,`) — (F2) the NEXT landing is the one right after a shatter (never an out) · how often that rule saved the run
- **engine.js#6** — THE DARKNESS is never more than `lead` floors above the deepest floor the ball has reached (and its pace starts again from there — F3B: THE PACE EASES WITH DEPTH, by the floor the ball is on: tuning.js#darkPaceAt)
- **engine.js#7** (`if (!same && n >= MAX_LOG) return 0;`) — (the log is full — one entry a tick at most, so only a rule set with no cap could get here)
- **engine.js#8** — … the same, by the angle to reach: the tower turns the SHORTEST way from where it stands towards `a` (0 … 4095), clamped to MAX SPIN → the units it turned
- **engine.js#9** (`if (T <= run.t) return false;`) — (a tick the run was already stepped to: what happened there stands — the page holds at the NEXT tick)
- **engine.js#10** (`stepTo(run, T, ev);`) — (what is due at T happens: a hold takes nothing away — the landing, the darkness's step)
- **engine.js#11** — THE INPUT LOG as the judge reads it: [{ t, a }] — the ticks A changed at, rising — and (F2) its HOLDS { k: 'hold', t } in their place (a move at a hold's own tick comes before it)
- **engine.js#12** — the slice under the ball on the floor it is on / falling to, at the angle the tower stands at (for the VIEW + the bots)

#### replay.js
- **replay.js#1** — FREEFALL — THE REPLAY + THE JUDGE (F1 — docs/freefall.md "THE JUDGE"): PURE — the SAME code the phone runs (engine.js). The phone shows the replay after every run (REPLAY = LIVE: the owner's determinism check on a real iPhone); the server's judge (api/_lib/freefall.js) = judgeRun. + THE INPUT LOG's packed form.
- **replay.js#2** — a seed = 1 … 64 printable ASCII characters, no space (seedOf makes [0-9a-z]) — nothing a transport could normalise into another seed
- **replay.js#3** — F2 — a HOLD in a log (engine.js#hold): { k: 'hold', t: the PLAY tick the run was held at }. A log = moves { t, a } + holds, in order (a move at a hold's own tick comes before it)
- **replay.js#4** — (THE REVIEW, F3: exactly its two OWN keys — { k: 'hold', t, a: 'x' } or a `k` inherited from a prototype was judged as a hold: two JSON texts for one log)
- **replay.js#5** — (a HOLD — F3: EXACT RESUME — everything up to + at its tick happens, then nothing moves: engine.js#hold; refused = not a log the engine wrote)
- **replay.js#6** — (the engine's own turn(): it must count AT the entry's tick and land ON the entry's angle — anything else is not a log the engine wrote)
- **replay.js#7** — (`until` — A RUN SCORED AS IT STANDS at a tick, a match still going: a whole tick ≥ 0 or nothing; the answer then says `over`)
- **replay.js#8** (`if (!live && !r.over) return { ok: false, why: 'ne`) — (can not happen: the darkness or the cap ends every run — kept as the judge's own floor)
- **replay.js#9** — ---- THE PACKED LOG (F4's run node): event after event, no separator between them — (→ §1, docs/freefall.md MODULE NOTES) ONE move as the packed log writes it — after the event at tick `pt` (the angle before: `pa`); F4A: the proof's chunks are cut from the same text (proof.js)
- **replay.js#10** — → the log [{ t, a } | { k: 'hold', t }], or null (a bad string — or one longer than `maxLen` characters: refused before it is read); '' = an empty log
- **replay.js#11** (`let i = 0, t = -1, a = 0, moved = false;`) — (`moved` = the event before was a MOVE: only then may a hold stand at its very tick — "!0")

#### sounds.js
- **sounds.js#1** — FREEFALL — THE SOUNDS' TABLE (F2 — docs/freefall.md "THE SOUNDS"; the files: audio/freefall/ + CREDITS.md — all CC0; two are JAYWALK's). (→ §1, docs/freefall.md MODULE NOTES) a sound: `file` in audio/<dir>/, played at `rate`, `gain` into the limiter, its priority; `play` = it sounds in a run today
- **sounds.js#2** — F3B — THE BREAKTHROUGHS (CC0). skylight + splashdown come in ≈ 7 dB quieter than the rest (−23.4 / −23.7 LUFS against ≈ −16 — the delivery's own measure): LOUDNESS-MATCHED HERE, by their gain (× 2.34 = + 7.4 dB · × 2.43 = + 7.7 dB over a shatter's 0.85 — the build machine has no MP3 encoder; the limiter holds their peaks). fireworks: soft, on purpose.
- **sounds.js#3** — F5C — THE MATCH MOMENTS: JAYWALK's own two files (referenced, never copied — audio/jaywalk/); a match only. Gains = THE MIX's: the out-drop LOUDER than JAYWALK's 0.28 (−27 dB as played would be lost under the bounces + the whooshes: here ≈ −18 dB)
- **sounds.js#4** — F5C — THE MIX (docs/games/passes/freefall-f5c.md "THE MIX"): every file DECODED + measured (its loudest 300 ms, RMS) with its gain against JAYWALK's table on the SAME limiter + trim — the shared files (AREA ARRIVAL · NEW BEST) at JAYWALK's own gains; the outs, the breakthroughs + the bottom ≈ −12 … −16 dB as played (JAYWALK's HIT −11, its arrival −13); the bounce STAYS SOFT (−18), the whoosh −28. THE MUSIC DUCKS under the big moments (JAYWALK's flyers.js#DUCK): to this share of its level, in / out over these seconds
- **sounds.js#5** — THE MUSIC (F4's cartridge — the console plays it; the test page has none, as HIGH RISE's): the site's mood stations, the evening deck by night
- **sounds.js#6** — the note's pitch (a playback rate) for `n` clean floors in a row (1 = the first fall after a bounce; 0 = a bounce: the note itself)
- **sounds.js#7** — F3B — the breakthroughs' moments after their `area` event (s): the glass + the water 8 ticks on · the seabed a whole fall (18 ticks) on
- **sounds.js#8** — F3B — THE BREAKTHROUGHS, each at the moment the ball gets there (the `area` event is the tick it leaves the floor above: the glass / the water 8 ticks on, the seabed a whole fall on)
- **sounds.js#9** — the note's eight cues (one a step of the scale), a little quieter than a bounce (it rings on every floor of a dive)
- **sounds.js#10** (`if (e.e === 'made') { if (!bed) out.push(CUE.botto`) — (a finish: the seabed's hit was cued by the arrival just before it — a late batch has only this)

#### tuning.js
- **tuning.js#1** — FREEFALL — THE TUNING + THE RULE-SET TABLE (F1 — docs/freefall.md "THE NUMBERS" · "THE RULE-SET TABLE"): EVERY NUMBER OF THE RULES lives (→ §1, docs/freefall.md MODULE NOTES)
- **tuning.js#2** — THE FIXED STEP: the rules count TICKS, never milliseconds — 60 a second. (The view turns its clock into ticks; the rules never read one.)
- **tuning.js#3** — ---- THE TOWER's SHAPE (the same for every rule set: the input log's angles are written in these units) ONE TURN of the tower = 4096 angle units: the tower angle A is an integer 0 … 4095
- **tuning.js#4** — a curve by floor: knots [floor, value], straight lines between them (integers), held before the first + after the last
- **tuning.js#5** — (derived — never tuned by hand) THE FALL WINDOW's reach: the angle a HUMAN-PACED spin covers between a gap and the landing below it (after the reaction)
- **tuning.js#6** — THE HOP: the longest run of red slices a human-paced spin crosses inside ONE bounce (after the reaction), a slice of slack kept
- **tuning.js#7** — (F3 — THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE, the owner Nov 26: it was 4 s · 150 · 6 — a stopped ball had 15 s and nobody ever SAW (→ §2, docs/freefall.md MODULE NOTES)
- **tuning.js#8** — (F5B — THE BLIND FLOORS, the owner: the floors the skylight (40) + the water (120) hide until their breakthrough carry NO red — the  first landing under them is made blind. A layout rule of the row: nothing counted yet (THE SWITCH is off) — no new rule-set row)
- **tuning.js#9** — ---- THE CLASSIC ROW BY NAME (for the views, the sims + the tests — never a second copy; THE ENGINE + THE JUDGE read `run.R`)
- **tuning.js#10** — THE MODES: `finish` = the floor that ends the run as MADE IT (null = endless) · `capTicks` = the tick the run ends where it stands
- **tuning.js#11** — ---- THE AREAS (by floor — pure, for the views; logic.js#areaOf reads them): THE TRENCH = everything past THE BOTTOM (solo only — the other modes end ON floor 200), the deep's palettes cycled, one LAP every `GEN.lap.every` floors
- **tuning.js#12** — a run's whole log at most: ONE entry a tick (the ticks rise) — so never more entries than the longest mode has ticks
- **tuning.js#13** — the longest a packed entry is: '.' + a gap (≤ 4 base-36 digits: 108000 = "2bc0") + a sign + a turn (≤ 3 digits: 2048 = "1kw")

#### ghost-fx.js
- **ghost-fx.js#1** — FREEFALL — THE GHOSTS' LAYER (F4B — docs/freefall.md "THE GHOSTS"): what a rival LOOKS like on my tower. Its own small scene, drawn (→ §1, docs/freefall.md MODULE NOTES)
- **ghost-fx.js#2** — a ghost's record in the stage's array: [phi (radians round MY tower, 0 = the front), y (the ball's foot, world), r, g, b, alpha (0 = not drawn), near (0 … 1: 1 = an outline, no tag), tag (its atlas row, −1 = none)]
- **ghost-fx.js#3** — THE ATLAS: a row a ghost — the name in the player's colour (lifted toward white: it must read) on a dark rim, at the screen's own sharpness
- **ghost-fx.js#4** (`g.fillStyle = 'rgba(255, 255, 255, 0.2)'; g.fillTe`) — (lifted a little toward white: a dark colour still reads — the player's colour stays the colour)
- **ghost-fx.js#5** (`tex.dispose();`) — (the atlas changed SIZE with the names / the sharpness: the texture's storage is made again — an upload into the old one overflows it)
- **ghost-fx.js#6** — the stage's records → the instances; the tags: over each ghost, away from MY ball, stacked when two would overlap — whole device pixels
- **ghost-fx.js#7** (`if (row < 0 || near > 0.5 || a < 0.5) continue;`) — (the screen review: a tag never FADES with its ball — it is whole, or it is gone and the edge marker names the rival)
- **ghost-fx.js#8** — stacked when two would overlap (the ghosts start on the same slice) — FIX A: asked again until it clears EVERY tag placed (one pass could push it onto a third), a full tag's height apart: never two tags over each other
- **ghost-fx.js#9** — THE WARM FRAME's share: the three programs built behind the opening (one ghost drawn once, off the picture's way)

#### director.js
- **director.js#1** — FREEFALL — THE DIRECTOR (F4A — docs/freefall.md "THE CARTRIDGE"; HIGH RISE's S4A director is the pattern): the PURE host step. THE GAME (→ §1, docs/freefall.md MODULE NOTES)
- **director.js#2** — FIX B — S1: the nodes whose END had landed when the podium was written (`game.ends` — a re-score is owed when another one lands)
- **director.js#3** (`seed: solo ? String(seed) : '',`) — (a MATCH's seed is picked AFTER GO — the step count → play; a SOLO run's from its own GO — never this)
- **director.js#4** — F4B — a MATCH's node: judged on THE FIRST GO's seed + clock (tick 0 = game.playAt — exactly as the server's freefallMatch does)
- **director.js#5** — (THE PROOF PASS — the server's guard, on the host's podium too: a GO later than the window after THE FIRST GO is no run)
- **director.js#6** — (THE NODES ARE THE TRUTH: a match is scored on THE FIRST GO's seed + clock, as the server's own count is; if the game ever said  otherwise the patch puts it right)
- **director.js#7** — (a FIRST GO the server stamped before this host gave up = a hiccup of the host's, not a match without proof: the unproven mark is  taken back and the match falls on the GO's seed + tick 0 — the phones' own startOf already does)
- **director.js#8** — (THE FRESH-EYES REVIEW — AN UNPROVEN RUN's MATCH ENDS TOO: a SOLO run with no GO never writes `e` — its match stayed `play` for ever and  PLAY AGAIN on its card could only start over in the spent match, uncounted. The host — the same phone, a room of one — marks it  ended (`game.x/{uid}`, view.js#again): the match closes with the judge's row of a node that is not there — floor 0, never counted)

#### tower-gen.js
- **tower-gen.js#1** — FREEFALL — THE TOWER (F1 — docs/freefall.md "THE TOWER" · "FAIR BY CONSTRUCTION"): a floor = a ring of 12 slices round the pillar — (→ §1, docs/freefall.md MODULE NOTES)
- **tower-gen.js#2** — the first angle unit of slice `s` (0 … SLICES; SLICES → TURN): the slices are 341 or 342 units wide, every unit in exactly one
- **tower-gen.js#3** — THE SLICE UNDER THE BALL on a floor with `twist`, the tower at angle `a`: floor(((BALL − A − twist) mod 4096) × 12 / 4096)
- **tower-gen.js#4** — a floor's GAPS (a 12-bit mask) — a function of (seed, floor) alone: how many, each 2 slices wide or 1, never touching each other
- **tower-gen.js#5** — walk the ring from the first slice after a red one: the stretches of not-red slices, and the red run that follows each
- **tower-gen.js#6** — a floor's RED slices (a 12-bit mask): laid one at a time, in the seed's order — and only where every fairness rule still holds
- **tower-gen.js#7** — ---- MOVING RED (F2 — THE TRENCH only: floors ≥ gen.move.from — solo; a match / a daily ends ON floor 200 and never lands there). (→ §2, docs/freefall.md MODULE NOTES)
- **tower-gen.js#8** — the slices of a floor (`twist`) that lie straight below a gap of the floor above (`gapUp` / `twistUp`) — any shared point counts → a 12-bit mask
- **tower-gen.js#9** — one more mover for the floor in `out` (its `red` loses the track's own static red) → the mover, or 0 = no room; `other` = the mover the floor already has (0 = none)
- **tower-gen.js#10** — a floor's MOVING RED, written INTO `out` (`m1` · `m2` — 0 = none) — and `out.red` without the tracks' own static red
- **tower-gen.js#11** — floor `i` of the tower with seed hash `h`, written INTO `out` { i, twist, gap, red, m1, m2 } (the engine keeps ONE record a run) → out

#### shot.js
- **shot.js#1** — FREEFALL — THE RUN's FRAME (F4B — docs/freefall.md "THE SHARE CARD"; HIGH RISE S5's shot.js is the pattern): the picture of the moment a (→ §1, docs/freefall.md MODULE NOTES)
- **shot.js#2** — (F4B — the screen review: at 90 ms the slice was still WHITE-HOT — under a HIT THE RED tab the frame read as a white wedge. At 200 ms  the slice is RED again, a pale flash still on it, the sparks spread in the air: it reads as the hit.) (F5A: THE BOTTOM 390 → 410 — the GOLD ring stands round the ball, inside the picture)
- **shot.js#3** (`export const SHOT_AT = Object.freeze({ red: 200, d`) — (FIX A — N3: 600 — the gold ring at its widest, the camera pulled back: the game's top result its best card)
- **shot.js#4** (`export const SHOT_ZOOM = Object.freeze({ red: 1.32`) — (FIX B: THE BOTTOM zoomed IN — the ball + its gold ring BIG, the celebration round them: the fresh-eyes reviewer was right, FIX A's "pulled back" was wrong)   // (the camera's distance × this: FIX A — N3, the finish pulled back a little)
- **shot.js#5** (`export const SHOT_GLOW = 1.15;`) — (THE MARK's own light under the ball, wide + red-hot — a white flash would whiten the slice: it must read RED)
- **shot.js#6** (`export const stagingOf = cause => { const k = own(`) — (FIX B — `party`: THE BOTTOM's celebration — the dust, the fireworks, the ring's light — stays in the picture)

#### final.js
- **final.js#1** — FREEFALL — THE END SCREEN's BODY in the cartridge (F4A · F4B — docs/freefall.md "THE END SCREEN"; HIGH RISE's final.js is the pattern): (→ §1, docs/freefall.md MODULE NOTES)
- **final.js#2** — (F5B — SHARE = THE PICTURE ONLY: the card is drawn + encoded at the end screen; the TAP must reach the share sheet in its own turn — so  the share module, once the end screen has loaded it, is called DIRECTLY: no import's promise between the tap and navigator.share)
- **final.js#3** — (a MATCH: the console's own list of every place is replaced by the shared block's TOP 3 — ui/end-board.js, mounted by the frame)
- **final.js#4** — YOUR BEST as this phone knows it (the server's last answer once counting is ON — else its own); the server's answer puts it right. F5C — "YOUR BEST n · AVG n": the AVG = your profile's STORED average (the room's mirror — profile/public.js, no read; a dash under 5 runs)
- **final.js#5** — (the winner's moment: the console's own sting is off for this game — a match plays it here, once the crown lands; a draw: none)

#### matchhud.js
- **matchhud.js#1** — FREEFALL — THE MATCH's HUD (F4B — docs/freefall.md "THE DEPTH RAIL" · "THE MATCH"): the DOM over the scene in a match — 3 · 2 · 1 + the (→ §1, docs/freefall.md MODULE NOTES)
- **matchhud.js#2** — FIX A — THE RAIL's NAMES: a name's line height (px — names closer than this are nudged apart) · the longest name shown (trimmed: '…')
- **matchhud.js#3** — FIX A — the rivals' names beside their dots: [{ y }] (sorted by y IN PLACE) → each its own `ny`, never closer than `gap`, inside 0 … h (PURE)
- **matchhud.js#4** (`let outWait = 0, gen = 0;`) — (FIX B — Grok's G3: `gen` = the reset count — a callout's timer from before a reset() never touches the new count)
- **matchhud.js#5** — THE DEPTH RAIL: rows [{ uid, hex, floor, over, end ('out' | 'made' | 'cap' | ''), lost, me }] — a dot is made once a player, moved by one transform when its floor changed
- **matchhud.js#6** — (FIX B: TWO lines, the dot ENDS the first — "CHARLIE HIT THE BOTTOM ·" / "KEEP FALLING FOR 2ND" — never leading the second)
- **matchhud.js#7** — OUT / THE BOTTOM / TIME'S UP — the cause's words over the scene for a moment: { kicker, words, floors, made, ms }

#### palettes.js
- **palettes.js#1** — FREEFALL — THE AREA PALETTES (F3 — docs/freefall.md "THE AREA PALETTES"): PURE — the colours only (the scene: night.js; a unit test reads them here: tests/freefall-play.test.mjs).
- **palettes.js#2** (`Object.freeze({ a: 0x9a3cff, b: 0x3a63ff, rim: 0xd`) — THE OFFICES: electric violet → blue · by day a light, whitish periwinkle, bright blue rims
- **palettes.js#3** (`Object.freeze({ a: 0x4a40c0, b: 0x3a34a8, rim: 0xb`) — THE DEEP (FIX A — S13: lifted, a safe slice reads against the wall + a gap): indigo, glowing ultraviolet rims · by day soft indigo / lilac, brighter rims
- **palettes.js#4** — the areas whose floors are GOLD (tuning.js#AREAS' index): YOUR BEST's gold tape turns WHITE with a dark edge there (both looks)

#### index.js
- **index.js#1** — FREEFALL — THE CARTRIDGE (F4A — docs/freefall.md "THE CARTRIDGE"; the contract: js/games/contract.js, docs/cartridge.md; HIGH RISE's (→ §1, docs/freefall.md MODULE NOTES)
- **index.js#2** — (THE THIN META: DEFAULT_SETTINGS, OPTIONS, estimateMinutes, MUSIC, LOOKS, SOLO, the banner, the chat's lock, cleanSettings — meta.js)
- **index.js#3** — THE MUSIC FOLLOWS THE LOOK (JAYWALK's rule — the existing mood stations): the day deck by day, the evening deck by night
- **index.js#4** — (the stage's own sheet — css/freefall-play.css, the test page's: ONE look for both; three.js through the import map — Safari < 16.4 gets a clear card)
- **index.js#5** — THE PROOF NODE (rooms/{CODE}/ff/{matchId}/{uid} — proof.js): written by the player AT GO + their input log in chunks as they play
- **index.js#6** — THE LOOK LOCK (FIX A): a match plays in the HOST's look on every phone — its Game look setting, AUTO = the sun at the host's place
- **index.js#7** — PLAY AGAIN after a solo run — the console's INSTANT AGAIN (games/kit/again.js): the next run as a match of its own, no walk inside
- **index.js#8** (`export { shareNow as shareRun } from './final.js';`) — (F5B — the picture alone, the share sheet in the tap's own turn: final.js holds the loaded module)
- **index.js#9** — F5B — THE END-SCREEN BOARD (ui/end-board.js — the podium's shared block, opt-in): solo = the board's top 3 (THE WORLD · FRIENDS), a match = its own top 3

#### bakedtext.js
- **bakedtext.js#1** — FREEFALL — THE BAKED NUMBER (F2 — docs/freefall.md "THE BAKED HUD"; HIGH RISE's bakedtext.js, its S5 EFFECTS REBUILD): a glowing number (→ §1, docs/freefall.md MODULE NOTES)
- **bakedtext.js#2** — "rgb(255, 0, 0) 0px 0px 14px, rgba(…) 0px 3px 0px" → [{ color, x, y, blur }] (the computed style's own order: the FIRST on top)
- **bakedtext.js#3** — the number's overlay: `node` = .ff-num (its digit boxes stay for the layout + the reading) → { set(n), dirty(), warm(), info(), destroy() }
- **bakedtext.js#4** — the shadows under the digit, the LAST of the list at the bottom (CSS paints the first on top) — each alone: the digit itself drawn far off the canvas, only its shadow offset back onto it
- **bakedtext.js#5** — the number's style changed (gold · a resize): the ten digits are baked again (or their kept set picked), then drawn
- **bakedtext.js#6** — bake the set of the number's CURRENT style now (the warm-up: the stage dresses itself, asks, and dresses back)

#### banner.js
- **banner.js#1** — FREEFALL — THE ARRIVAL BANNERS (F3 — docs/freefall.md "THE ARRIVAL BANNERS"): on reaching an area a band crosses the screen — "THE (→ §1, docs/freefall.md MODULE NOTES)
- **banner.js#2** — createBanner() → { el, prepare(name, sub, cls?), ready(name, sub), show(name, sub, onDone, cls?) → shown?, dirty(), showing(), clear(), info(), destroy() }
- **banner.js#3** — one line, drawn letter by letter at its own spacing (a canvas has no letter-spacing everywhere), its shadows under it — the LAST of the list at the bottom
- **banner.js#4** — a band's two lines into its own canvas, from their OWN computed styles (the look's inks + glows) — never called in a frame a ball lands in
- **banner.js#5** — a band made ready AHEAD of its arrival (the stage: every area's at a restart — behind the opening; a later lap's between two arrivals). Kept: asked again, nothing is done. Never while a band is up.
- **banner.js#6** — the band crosses: ONE one-shot (opacity + transform) on its own node — nothing else is touched → false = a band is still up (the caller keeps this one for after it)

#### endscreen.js
- **endscreen.js#1** — FREEFALL — THE END SCREEN's BODY = JAYWALK'S STANDARD (F2; F4B — THE LOGO HEADER: docs/freefall.md "THE END SCREEN"; HIGH RISE's (→ §1, docs/freefall.md MODULE NOTES)
- **endscreen.js#2** — FREEFALL's ACCENT = title-05's colours (F3 — the owner, Nov 26: docs/games/plan.md "FREEFALL — F3"; replaces F2's ultraviolet + lime): HOT PINK + ELECTRIC TEAL
- **endscreen.js#3** — the lettering's cache key (= night.js#FF_ART_REV — pinned equal by tests/freefall-play.test.mjs: this file imports no scene)
- **endscreen.js#4** — THE LOGO HEADER: the lettering (a 390-wide phone at 3× takes the 780 — it is drawn ≈ 226 pt wide) + the mode in small teal caps — one node, a heading
- **endscreen.js#5** — "12 BOUNCES · 3 BLAZES · BEST RUN 9" (1 BOUNCE · 1 BLAZE) — F5B: "0 BLAZES" never shows (no blaze lit = the part is left out)

#### match.js
- **match.js#1** — FREEFALL — THE MATCH's RULES (F4B — docs/freefall.md "THE MATCH"; HIGH RISE's match.js is the pattern, JAYWALK's start number for number): (→ §1, docs/freefall.md MODULE NOTES)
- **match.js#2** — no GO at all this long after the count's end (no signal anywhere, the rules not published) → the match plays UNPROVEN, never counted
- **match.js#3** — Call the Winner: a call counts when it was made within this of the caller's own end (the out is seen first, then the kit's window)
- **match.js#4** — PURE: the phones, the host's director and the server derive the same start from the same proof nodes. null = no GO yet.
- **match.js#5** — a match's clock: a server time → its tick (tick 0 = game.playAt) · the moment the 3:00 cap falls (ms, a server time)
- **match.js#6** — when a player's proof last moved (ms, a server time): their newest chunk's arrival, else their GO, else the match's tick 0
- **match.js#7** — (core/proof.js: a player with NO RUN (no GO on time) is never "still in" (they ended before anyone: −1); a FULL DRAW pays nobody)

#### proof.js
- **proof.js#1** — FREEFALL — THE PROOF (F4A — docs/freefall.md "THE PROOF"; HIGH RISE's `hr` node is the pattern: js/games/highrise/proof.js). PURE — the (→ §1, docs/freefall.md MODULE NOTES)
- **proof.js#2** — the most chunks a second this game's writer can send (one burst at a time, every FLUSH_MS at the soonest — the kit's stop-and-wait)
- **proof.js#3** — ---- the writer's half: the run's own log (engine.js: run.lt · run.la the moves, run.ht the holds), read in its merged order
- **proof.js#4** — a node's resume stamps → [h0, h1, …] as far as they go without a gap (a number each — the SERVER's time; anything else ends the list)
- **proof.js#5** — (the server's time each hold's OWN chunk arrived at — the chunks are in the log's order: the s-th hold is in the first chunk whose holds reach it)
- **proof.js#6** — (THE PAUSE GAP: the hold's chunk arrived too late — no pause was granted, the clock ran on: it never froze at this hold. A hold  whose chunk is not there yet froze nothing either — nothing lies past it.)
- **proof.js#7** (`if (holds > frozen) return { why: 'pause', tick: h`) — (… or before the silence that is still open: late moves are no part of a pause that was never granted)
- **proof.js#8** — (AHEAD of its own segment's clock. In the run's FIRST segment: a log made in advance — refused. PAST A HOLD (the fresh-eyes review's (→ §2, docs/freefall.md MODULE NOTES)
- **proof.js#9** — (F4B: more holds than the mode has — a match / the daily: ANY hold — is refused by name BEFORE the clock: a cut never turns it into a shorter honest run)
- **proof.js#10** — a SOLO run's node: the seed = logic.js#seedOf(code, matchId, its own GO) — picked AFTER GO, nobody can shop for a tower

#### logic.js
- **logic.js#1** — FREEFALL — THE RUN's WORDS, SEEDS, AREAS + SCORING (F1 — docs/freefall.md): PURE (no DOM, no clock). The solo run node, the match and the daily arrive in F2–F5; what every one of them will share lives here: the end's words, the seed a run is played on, the tick of a touch, THE AREAS, THE RANKING, the feats.
- **logic.js#2** (`made: 'YOU HIT THE BOTTOM',`) — (F5B — ONE wording for the floor-200 ending everywhere: the end screen, the share card, the band)
- **logic.js#3** — a tick ↔ a clock: tick 0 = `t0` (ms) — the ONE mapping (FAIR INPUT: a move's event.timeStamp → the nearest tick; 60 Hz and 120 Hz phones are equal)
- **logic.js#4** — THE ARRIVALS (F3 — the banners): the floor the NEXT area begins at after `floor` — the areas' own starts (40 · 80 · 120 · 160 · 200 · 201), then THE TRENCH's laps (241 · 281 · …)
- **logic.js#5** — rows { uid, floor, tick, blazes } → [{ uid, rank, floor, tick, blazes }] — the same floor at the same tick with as many blazes shares the place
