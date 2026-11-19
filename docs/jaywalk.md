# JAYWALK (id `jaywalk`) — the hop-through-lanes game

**PLAYABLE FOR EVERYONE since THE GO-LIVE PASS (Nov 17 2026 — `docs/games/passes/jaywalk-golive.md`)**: `config.js` GAMES row `playable: true` (built H1 → H6B,
Nov 16–17; reviewed, BEFORE THE FLIP, then flipped — docs/cartridge.md "A game BEING BUILT" is the road it took). The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 12–16 — DECIDED)" + "H2's DECISIONS" + "JAYWALK (the
owner, Nov 16 — DECIDED, after H2 on his phone)" + "… after H2B on his phone)" + "… after H3 on his phone)" (H4: ONE LIFE EVERYWHERE) + "JAYWALK (the owner, Nov 16 — DECIDED, H5A)" (the new kid, THE AREAS, the sounds). This page = the rules, the modes table, the engine's contract, the replay + the proof,
THE NIGHT LOOK + THE CAMERA + its assets + the sounds, the lab page, what each later pass adds. Read it before a JAYWALK pass.

Tap = hop forward · swipe = sideways · swipe down = back. 9 columns. No coins, no pickups — just distance. Rendered on three.js 0.160 (the
import map); the RULES are a pure engine that never knows about it.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| H1 | Nov 16 2026 | `docs/games/passes/jaywalk-h1.md` | the pure engine, the replay + the server half, the hidden cartridge + the proof node (`jw`), THE JAYWALK LAB's graybox |
| H2 | Nov 16 2026 | `docs/games/passes/jaywalk-h2.md` | THE NIGHT LOOK (smooth stylized 3D: Kenney's models + the code-built kid / trees / logs, THE BLACKOUT), THE WIDER VIEW (11 seen, 9 played), the kid + the hop's feel + the hits, the sounds in play + THE SOUND AUDITION |
| H2B | Nov 16 2026 | `docs/games/passes/jaywalk-h2b.md` | THE CAMERA (ZOOM 7 · 8 · 9, the sideways follow, the slight turn — `camera.js`, shared with the graybox) + the look fixes (the water, THE LOGS that look like logs, the kid's glow ring + rim, THE BOX TRUCK, THE BARRICADE, no crates, the lamps: two per end, short + soft) |
| H3 | Nov 16 2026 | `docs/games/passes/jaywalk-h3.md` | THE SOLO GAME: the real view, THE COURSE PICKED AFTER GO, the timestamped proof + THE SPEED CHECK both ways, the solo best from the server's replay (`jaywalk-solo`), THE END SCREEN's cause words, HOP AGAIN (THE INSTANT AGAIN), YOUR TABLE, HOW TO PLAY (out of the boot) + the look fixes (the logs' own lengths — a small rules change —, the brighter water, two tail-light streaks; ZOOM 8 + STRAIGHT) |
| H4 | Nov 16 2026 | `docs/games/passes/jaywalk-h4.md` | THE MATCH (ONE LIFE EVERYWHERE — the lives option, respawn + blink, THE ONE-UP removed): the course + tick 0 from THE FIRST GO, THE GHOSTS, THE LIVE ORDER, out = SPECTATE + Call the Winner, the host's replayed end + the podium, the server's replay of every player (`jaywalkMatch`), the owner's guests counted; THE DROPPED SIGNAL; THE SHARE IMAGE; THE ICON (THE SIGNAL); THE POSTER (`?poster=1`); the look (calm water, plain log ends, the yellow taxi, the flat kid), PLAY AGAIN, the smoke START |
| H4B | Nov 16 2026 | `docs/games/passes/jaywalk-h4b.md` | THE GHOST FIX (the owner's first live match): THE GHOSTS IN STEP WITH THE WORLD (`ghosts.js` — the engine's state at the world's tick, a late hop catches up, a death only once confirmed; hops go up at once), THE FIRST GO's PROOF (the GO = a transaction never applied locally; `startOf` — the nodes are the truth), THE START (the warm frame, the sounds decoded ahead, the tier remembered) |
| H5A | Nov 16 2026 | `docs/games/passes/jaywalk-h5a.md` | THE NEW KID (Kenney's skate boy — his cap + shirt in the player's colour, his poses), THE 8 AREAS (a RULES change: each area leans the lane mix; its night look; THE ARRIVAL GATEWAY), THE SOUNDS all in play (`cues.js`), THE LIGHT TRAILS gone, THE POSTER re-shot |
| H5B | Nov 16 2026 | `docs/games/passes/jaywalk-h5b.md` | THE DAY LOOK (every screen: the sun, the day ground, light vs paint, THE FOG BANK, the painted gates, the day skyline; the GAME LOOK setting back — per phone) · THE LANDMARKS SEEN (each area's landmark in the skyline band + its hero pieces beside its gate) · the fixes (the horn at half, the car-pass gone, the train sounds fade; the header; the refused chat write) · the add-ons: BLUE ON THE GROUND = WATER (arcade water by night too, the pink friend TAPE), the rail signals flash only before the train, THE GHOSTS STOP BLOCKING YOU |
| H5C | Nov 16 2026 | `docs/games/passes/jaywalk-h5c.md` | NO WEAK POINTS (a VIEW pass): THE PAINTED SKYLINES (8 painted day pictures, cross-faded at the gates — `skyline.js`) · THE FAR EDGE (the sea wall; the far lanes fully in the haze before it) · THE FOG BANK rebuilt (rolling layers, a soft ragged edge) · the day's shadows + ground textures · the drums · THE GATE'S NAME ON ITS ARCH · YOUR BEST = a gold tape, the lines' words always readable · the tail lights' finish · THE TRAIN SOUNDS set B + the train horn + THE AREA ARRIVAL · THE FRESH-EYES REVIEW (every pass from now on) |
| H6A | Nov 17 2026 | `docs/games/passes/jaywalk-h6a.md` | THE BIG MOMENTS (`flyers.js`, fetched ON DEMAND): THE BLACKBIRD (the real SR-71 — the glint, the afterburners, the shockwave), THE UFO (the real saucer, its green ring, THE ABDUCTION), THE MOTHERSHIP = A FINISH LINE (the 10 s warning, the baked ship, the white-gold beam, the gold end screen — never "TAKEN") · THE FOUR CARDS (the feat flags from the server's replay → SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY — solo or match · BEAM ME UP, new) · YOUR BEST ANYWHERE (a counted match run raises the same best) |
| H6B | Nov 17 2026 | `docs/games/passes/jaywalk-h6b.md` | THE FINAL POLISH (a VIEW + SOUND pass): THE PAINTED NIGHT SKYLINES (8, cross-faded at the gates — `skymarks.js` retired) + THE LOOK SWITCH's cross-fade · THE GATE SIGN only on the approach · the compact match chips · the lab's `?lane=N` · THE MOMENTS' FINISH (the solid UFO, the bigger Blackbird's blazing burners, the kids into the Mothership's port, the traffic stopping under it) · DOWNTOWN's storefronts (Kenney, on demand) · the tail light bar · THE MIX (measured) + NEW BEST's B take · THE CREDITS · two fresh-eyes reviews |
| THE GO-LIVE REVIEW | Nov 17 2026 | `docs/games/passes/jaywalk-review.md` | the audit (a fresh auditor + a second reviewer — both reports verbatim) + its fixes · THE BLACKBIRD's DAY TELL · the fog's banding · the first look switch's long frame · the lane count clear of every landmark + a match's chips · Grok's two night touch-ups · THE MEMORY ON WEBKIT (`wk-jaywalk-mem.mjs`) · the go-live checklist (`jaywalk-golive-checklist.md`) — it does NOT flip `playable` |
| THE GO-LIVE PASS | Nov 17 2026 | `docs/games/passes/jaywalk-golive.md` (the plan: `jaywalk-golive-checklist.md`) | ✓ DONE — flipped `playable` (empties `tests/registration.test.mjs#JAYWALK_WAITS`; the meta + its tile join the boot — after the city's CHROMEBOOK pass trims THE BOOT BUDGET: the owner, Nov 16) |
| THE POLISH PASS | Nov 18 2026 | `docs/games/passes/jaywalk-polish.md` | ✓ DONE — YOUR TABLE's grid + the slim cards' one-line names · the share card's dark band · HOW TO PLAY's Mothership line · the late k write · the far lanes after a lost context ("THE POLISH PASS", below) |
| DAILY A | Nov 18 2026 | `docs/games/passes/daily-a.md` | ✓ THE DAILY's SERVER HALF (3 tries, the proof node, the 4 conditions, the points curve) + its test page — ships OFF ("THE DAILY", below) |
| DAILY B | Nov 18 2026 | `docs/games/passes/daily-b.md` | ✓ THE DAILY's PHONE HALF: its ticket (orange, the walk signal), the run on the REAL view, STOP, TRY AGAIN · DONE, TRY ENDED · N TRIES LEFT, its SHARE TODAY section, its cards + YOUR BEST — ships OFF ("THE DAILY — THE PHONE HALF", below) |

Art style: **SMOOTH STYLIZED 3D** (the owner, Nov 16 — rounded, glossy, toy-like; the target `Downloads\grok\jaywalk\concept\jaywalk-night-smooth.png`;
this page's layout wins over the render's). The engine never cares. JAYWALK's flying hazards (THE BLACKBIRD, THE UFO, THE MOTHERSHIP) are REAL since H6A — "THE BIG MOMENTS", below.

## THE RULES (js/games/jaywalk/ — `tuning.js` holds EVERY number)
- **THE FIXED STEP:** the rules count TICKS, 60 a second (`TICK_HZ`); a hop = `HOP_TICKS` 8 = 133 ms. The rules NEVER read Math.random /
  Date.now / performance.now / a frame clock, and use **integers / fixed point (`FP` 1000 = a cell) with + − × ÷ + Math.floor only — no
  Math.sin / cos / pow / exp / sqrt** (V8 and JavaScriptCore may differ in the last bit; the phone and the server must agree hop for hop).
  `tests/jaywalk-engine.test.mjs` greps the four rules files for all of it. The view may use anything.
- **THE LANES** (`course.js#buildLane(seed, i)` — a PURE function of the seed + the lane's index, built alone, in any order, on the phone or the
  server; ALL randomness = `core/rng.js` seeded per lane, `hashString(seed + ':' + i)`):
  **grass** (+ obstacles — never on the centre column, never beside water) · **road** (cars) · **water** (H3: every log its OWN length, 1–4
  cells, from the seed — long ones more common early, short ones later: `WATER.lenW` — + UNEVEN gaps: short 0.9–1.5 cells or long 1.4 + by
  heat; a 1-cell log only on a slow lane, `WATER.oneV`, with no water lane beside it; the water kills; two
  water lanes side by side always run opposite ways; never more than 3 in a row (H5A: a long run goes on after its break — every 4th lane of it is ground; the same for the rails, `RAIL_RUN_MAX` 3); a log carrying you off the screen edge = a hit) · **rail** (a
  train: the signal lights 1 s first, then a long fast body) · **THE FLIGHT PATH** (`flight` — a band of 2 lanes sharing ONE pulse: THE
  BLACKBIRD's tell 1.8 s (never under 1.5 s — `MIN_TELL_TICKS`), then a 0.2 s pass) · **THE UFO** (not a lane: a zone of 8 grass / road lanes
  it drifts over on a slow diagonal; its beam circle, radius 1.25 cells, on the ground = the warning; stepping in = abducted).
- **A HAZARD's POSITION = a pure function of (lane, tick)** — `moverLeft` (cars, logs), `pulseAt` + `pulseLeft` (trains, THE BLACKBIRD:
  idle → tell → pass), `ufoX` / `ufoY`. No per-tick simulation is needed to know where anything is.
- **THE KID is the only thing stepped** (`engine.js#step(run, course, d)`): a hop in flight (a straight line; its lane is the one it left for the
  first half, the one it lands on after), ONE buffered hop, riding a log (carried with it), the wall, `idle | hop | out | taken`. A hop into
  an obstacle / past an edge / behind lane 0 is a **bump** (refused). The kid's box against cars / trains is 0.6 of a cell.
- **THE COURSE's DIRECTOR:** the SAME difficulty curve on every course — **HEAT** by lane index (`heatAt`: 0 → 1000 at lane 400 → on to 1600 at
  lane 640): the lane mix (less grass, more water + rail), the cars' speed + gaps, the logs' length + speed, the trains' lap, the chance of a UFO
  / a flight path. **The opening is calm:** lanes 0–3 plain grass, no water before lane 12, no rail before 25, the wall waits 3 s. **THE UFO**
  from lane 100, **THE BLACKBIRD** from 150 — rare, from the seed, **never both in one stretch** (a stretch = the 50 lanes after a landmark —
  `course.js#specials`). **THE FIXED LANDMARKS** every 50 lanes (a plain marked lane, named — `LANDMARKS`): 50 THE DOCKS · 100 THE FISH MARKET ·
  150 THE RAIL YARD · 200 THE BRIDGE · 250 DOWNTOWN · 300 THE CANAL · 350 THE LIGHTHOUSE · 400 THE AIRFIELD → the loop again, harder.
  **H5A: each landmark's lane is THE GATEWAY into its AREA — the 50 lanes that follow lean their mix: THE AREAS, below.**
- **THE WALL** (night: THE BLACKOUT · day: a FOG BANK): a steady pace, never more than 5 lanes behind the kid's BEST (no banking distance);
  the kid's centre behind its edge = a hit.
- **ONE LIFE EVERYWHERE (H4 — the owner, Nov 16):** one hit = OUT, in every mode (solo, match, daily). **No lives option, no respawn, no
  blink, no one-up, no lives HUD** — all removed from the rules, the views, the tests (`tests/jaywalk-engine.test.mjs` greps the rules
  files for them). **HITS NAME THEIR CAUSE:** `car · water · train · edge · blackbird · ufo · wall`. **`taken`** (the internal key — never a word a player reads) = THE MOTHERSHIP's tick:
  **A FINISH LINE, not a death (H6A)** — "MADE IT TO THE MOTHERSHIP"; in a match it lifts whoever is still in at 6:00: rare, a reward.
- **RANKING** = lanes reached (the farthest lane LANDED on), the EARLIER tick wins a tie.
- **EVENTS** (for the view + the sounds — `step(…, ev)`): hop · bump · land (`ground | wood | water`) · best · landmark · near (a car within a
  cell) · beam (THE UFO's beside the kid) · boom · out · taken. The WORLD's own moments (a train's tell, THE BLACKBIRD's
  tell + pass) are `pulseAt(lane.pulse, tick)`.

### THE AREAS (H5A — the owner, Nov 16; `tuning.js#AREAS` + `course.js#area` — a RULES change: every course changed)
**A new area every 50 lanes, in the fixed order** — the stretch that BEGINS at a landmark's lane IS that place: 50–99 THE DOCKS ·
100–149 THE FISH MARKET · 150–199 THE RAIL YARD · 200–249 THE BRIDGE · 250–299 DOWNTOWN · 300–349 THE CANAL · 350–399 THE
LIGHTHOUSE · 400–449 THE AIRFIELD · 450 on: the loop again, harder (THE DOCKS · LAP 2 …). Lanes 0–49 = the plain opening (no
area, no lean — the calm start every course has). `course.js#area(lane)` → `{ name, index (−1 = the opening · 0 … 7), loop }`;
`gateName(lane)` = the name as its gateway shows it (the loop's laps named).
- **EACH AREA LEANS THE LANE MIX** — `AREAS[i].mix` [grass, road, water, rail], a PERCENTAGE on the heat's own weights (`MIX`);
  **the difficulty curve keeps climbing underneath**: the speeds, the gaps, the logs' lengths, the trains' laps stay the heat's alone.

  | area | mix % (grass · road · water · rail) | what it is |
  | --- | --- | --- |
  | THE DOCKS | 120 · 70 · 170 · 60 | water + the piers |
  | THE FISH MARKET | 135 · 90 · 130 · 50 | the market's ground + water |
  | THE RAIL YARD | 90 · 60 · 40 · 420 | more trains (≈ 25 % rails the first lap, ≈ 50 % the second — never more than 3 in a row) |
  | THE BRIDGE | 35 · 130 · 190 · 30 | water with roads (≈ 83 % of its lanes) |
  | DOWNTOWN | 80 · 190 · 25 · 60 | roads (≈ 70 %) + **HEAVIER TRAFFIC**: one more car a lap, 65 % of the spare room (`cars`, `gap`) — the crossable gap itself (`ROAD.gapMin` + `gapVTicks`) is never touched |
  | THE CANAL | 80 · 60 · 230 · 40 | more water (the most) |
  | THE LIGHTHOUSE | 150 · 60 · 170 · 40 | water + the rocks |
  | THE AIRFIELD | 110 · 120 · 30 · 50 | **its flight paths FOR SURE** (`flight`): two bands, 16–18 lanes apart, each its own pulse; never a UFO in the stretch |

  THE UFO / THE BLACKBIRD's rules are otherwise unchanged (the UFO from lane 100, the Blackbird from 150, rare, never both in one stretch).
- **FAIR + DETERMINISTIC** (`tests/jaywalk-sim.test.mjs` — H5A's five tests): the table; each lean seen in both laps; 192,000 lanes of
  all 8 areas + the loop on 2,000 seeds — every one has its crossable window, never more than 3 water / 3 rail lanes in a row; the
  greedy bot DROPPED AT EVERY AREA's GATEWAY in every mode (2,000 seeds a mode): the wall caught it ≤ 1.5 % of the drops (a stuck
  bot, never a wall of lanes); a lane is the same whatever the order it is built in; runs through 3 + areas = their own replay; the
  server's judge (`api/_lib/jaywalk.js`) reads the same `course.js`. **EVERY COURSE CHANGED** with this pass: a solo best already on
  the board stands; a run in flight over the deploy would not replay (JAYWALK is still the owner's alone — ONE DEPLOY AT A TIME).
- **THE ARRIVAL GATEWAY** (the area's first lane — the rules' calm, plain marked lane): a NEON ARCH — two posts in the edge
  columns, a see-through tube of light arching between them (nothing in the play columns is covered) — + **the area's NAME written
  big on the lane** in the area's own neon (7.3 cells wide: all of it on screen at ZOOM 8; the letters ≈ half a lane tall).
  Crossing it: **the landmark sound + the name flashing ONCE under the lane count** (`view.js`, `.jw-mark.is-flash` — transform +
  opacity only). The loop's second lap is named as such: **THE DOCKS · LAP 2**. A line's words (YOUR BEST …) lie a lane lower when
  their line sits on a gateway lane.
- **THE LOOK PER AREA (night — H5A; the day: H5B)** — `js/games/jaywalk/areas.js` (a VIEW: it reads `course.js#area`, never the other
  way) + `night-fx.js#areaGround`:

  | area | its ground ("grass" lanes) | obstacles on play cells (only where the rules have one) | the edge columns of its ground lanes + its signature pieces |
  | --- | --- | --- | --- |
  | THE DOCKS | wooden pier planks | bollards + rope, wooden crates, drums | crates, stacked freight containers, bollards · **THE DOCK CRANE** (built in code — it STRADDLES two lanes on thin legs, its boom reaching out) · moored fishing boats (Kenney, CC0) |
  | THE FISH MARKET | wet cobbles | ice crates (ice + two fish), crates, drums | market stalls under striped awnings, ice crates · **THE NEON FISH** over a stall (a light-only sign) · boats |
  | THE RAIL YARD | gravel | drums, crates, barricades | freight containers (one, or two stacked) · a signal gantry over each rail lane's edge columns (green — red in the tell) |
  | THE BRIDGE | the steel deck's plates | barricades, cones, drums | railings on both edges · **THE BRIDGE's TOWERS** in pairs (they straddle their lane) + their lit cables · a lamp every 2nd ground lane |
  | DOWNTOWN | sidewalk slabs | hydrants, planters, dumpsters, cones | **storefronts** with lit windows + their neon sign + the light it throws · more street lamps |
  | THE CANAL | stone blocks, moss in the joints | bollards, planters, trees | canal houses (warm windows), trees · arched stone footbridges over water lanes (the logs drift under) · boats |
  | THE LIGHTHOUSE | sand + scrub + pebbles | rocks, trees | rocks · **THE LIGHTHOUSE** (MaverickFX, CC0) on its rocks, its lamp lit, **its beam SWEEPING across the lanes** (light on the ground only; still with reduce motion) · boats |
  | THE AIRFIELD | the apron's slabs + a taxi line | cones, barricades, drums | **THE CONTROL TOWER** + the hangars (built in code), the flight paths' runway lights |

  + each area's lamps (their light + how often), its gateway's neon, **the skyline band's tint** (`.jw-sky-tint` — a wash of the
  area's colour, opacity only).
  **WHAT STANDS WHERE (the rule — `tests/jaywalk-areas.test.mjs`):** an obstacle is drawn ONLY where the rules have one (and every
  one of them is drawn — all solid, knee-high or taller); everything else stands in the two dim edge columns of GROUND lanes; the
  crane + the bridge's towers stand on the lane LINES (what runs on those lanes runs between their legs); nothing covers a play
  column; a road / water / rail lane's edge column stays open — what comes down it is seen coming, as before. A signature piece is
  never on a flight path or a gateway — **but the area's own HERO pieces stand beside its gate, in the gate lane's two edge columns (H5B: THE LANDMARKS SEEN)**. (H5A's first try put the big pieces on raised decks 1.5 columns past the edge: at ZOOM 8 a
  phone never shows that far — they were simply off-screen; the rule now is "in the edge column, or not built".)

### THE MODES (`tuning.js#MODES` — all tunable in one place)
| mode | the wall | THE MOTHERSHIP (`cap`) |
| --- | --- | --- |
| `solo` — SOLO ENDLESS | 0.6 lanes / s, never faster | never |
| `match` | 0.6 → 1.8 lanes / s from 4:00 to 6:00 | tick 21,600 (6:00) — it LIFTS whoever is still in: the finish line (H6A) |
| `daily` (built later — DAILY A / B) | 0.6 → 1.8 from 3:00 to 5:00 | tick 18,000 (5:00) |

ONE LIFE in all three.

### FAIR BY CONSTRUCTION (`tests/jaywalk-sim.test.mjs` + `jaywalk-deep.test.mjs` — 2,000 seeds per mode)
Every lane has a crossable window: a car gap is never under 2.6 cells + what the car covers in 26 ticks; logs 1–4 cells (H3 — each its own
length; every log's landing window ≥ 26 ticks; a 1-cell log never beside another water lane: a hop log-to-log always has ≥ 2 cells to land
on) with 0.9–4.6 cells of open water between two, adjacent water lanes opposite ways, no obstacle beside water; a train / THE BLACKBIRD leaves quiet time in every lap; the
centre column of every grass lane is free. THE BLACKBIRD's tell ≥ 1.5 s every time. A UFO's beam always drifts on (both speeds non-zero) and
its zone holds no water / rail. A greedy bot + a random bot play whole runs through the real engine.

## THE REPLAY + THE PROOF
- **THE HOP LOG** = `[{ t: tick, d: 'u' | 'l' | 'r' | 'd' }]` — the ONLY input. A hop logged at tick t is applied IN tick t.
- **`replay.js#replay({ seed, mode, log, until? })`** → `{ lanes, tick, end, over, y, x (where the kid went out — H3), cause,
  taken, hits, feats: { boom, ufo, airfield, mothership }, used }` — PURE, the SAME `step` the phone runs. THE LAB shows it after every run (a red line if it ever differs from the live run).
- **THE LOG's BOUNDS** (`replay.js#logProblem` — the server refuses, the phone's recorder `engine.js#canLog` never makes one): ticks strictly
  rising · inputs ≥ 2 ticks apart, ≤ 20 a second · no hop at / past the cap · ≤ 60,000 hops (a capped mode: cap / 2).
- **THE PACKED LOG** (`packLog` / `unpackLog` / `logFromChunks`): a hop = its direction's CAPITAL + the ticks since the hop before, base 36 —
  `U0R1cU9`. The proof node's chunks joined = the log.
- **THE JUDGE** (H4 — `replay.js#judgeRun({ seed, mode, log, go, times, from, until })`): the bounds + THE SPEED CHECK + THE DROPPED
  SIGNAL + the replay — **the ONE function the host's podium (`logic.js#scoreNode`) and the server's count run**, so they agree to the lane.
- **THE SERVER HALF** — `api/_lib/jaywalk.js` (NOT a function: the 8 stay 8; never imports fb.js): `verifyRun` (the judge + a bad seed /
  mode + "a run that never ended") · `verifyNode` / `jaywalkSolo` (H3 — a SOLO run from its proof node) · **`jaywalkMatch` (H4 — a MATCH:
  every named player's node, the course + tick 0 from THE FIRST GO)**. **WIRED: /api/report counts a JAYWALK run ONLY from these.**
- **THE CARD MOMENTS** (detected by the replay; the flags ship in H6): **jaywalk-boom** — STANDING ON a flight-path lane at the tick its tell
  BEGINS, off the band for the whole pass, not hit before it (stepping on during the tell, or staying / blinking through the pass, never counts)
  · **jaywalk-ufo** — the beam came within a cell of the kid (not blinking) and THAT UFO never took them (the mothership never counts) ·
  **jaywalk-airfield** — lane 400 in ONE run, **SOLO OR MATCH (H6A — no longer solo-only)** · **jaywalk-mothership (H6A)** — still in when THE
  MOTHERSHIP arrives (`taken`: a capped run — a match / the daily; a solo run has no mothership). **THE FLAGS SHIP (H6A): "THE CARDS", below.**
- **THE PROOF NODE** — `rooms/{CODE}/jw/{matchId}/{uid}` = `{ go (the server time, written ONCE at GO — present = proven; a solo
  course's seed comes from it, a match's from THE FIRST one), c/{i} = { s, at } (H3 — the packed log's chunks, each with the SERVER's
  timestamp — the moment it ARRIVED: written once, ≤ 400 chars, i 0–9999), e { l, t, w? } (the run's end, once — a signal only: never read
  as a score), k { w, at } (H4 — Call the Winner: only once the caller's own `e` is there, a player still in, once, the server's time) }`. The
  player's own uid + their own match, only while it is on (`play`, or the count's last 2 s); a player never deletes it; the host may delete ONE
  match's node. `api/report.js#PROOF_TREES.jaywalk` (a FLAT tree — GO alone proves a player: silent but present still counts),
  `registry.js#PROOF_NODE_LIST` + `NEW_PLAYER_NODES` (`jw`): a rematch / the next start NEVER wipes the just-finished match's node
  (`host.js#pruneProofs` keeps [previous, new] — H4: `prevM` is read BEFORE the start's stamp clears `meta/back`, a start from the room
  after BACK TO THE ROOM used to prune the just-finished match; PLAY AGAIN keeps the last 4). A SOLO run (H3) and a MATCH (H4) write it.

## THE MATCH (H4 — ONE LIFE; the cartridge — hidden: THE OWNER'S LIVE TEST)
One run each on the SAME course, one life; the others are see-through ghosts; farthest wins, ties → the earlier tick. **Real matches run
through THE OWNER'S LIVE TEST** (HE8's gate): the owner HOSTS (his room's GAMES list shows **JAYWALK · TEST**), his guests play normally —
they can't start it, and **they are counted** (`api/report.js#reportableGame(id, uid, at)`: a match THE OWNER PLAYED IN — his own proof
node of that match — counts for everyone in it, whoever reports first).
- `meta.js` (pure): **no options** (`DEFAULT_SETTINGS {}`, `OPTIONS []` — the lives option is gone), ~3 minutes, `MUSIC 'mood:evening'`,
  `LOOKS ['day', 'night']` (H5B — it was `['night']` until then), `OWN_VICTORY_SOUND`, `ACCENT`, `SOLO: true`, the chat's lock (shut while you hop — open once your run has
  ended: a spectator chats). No `AGAIN_LABEL` any more: **PLAY AGAIN** is the console's own word.
- **GO — THE COURSE IS PICKED AFTER GO, for a match too** (`logic.js#firstGo` / `matchStart`): `count` (3 · 2 · 1); in its last 2 s (the
  rules' window) EVERY phone writes its own proof node's `go` (the SERVER's time, once). **THE FIRST GO** — the earliest of them — picks
  the course (`seedOf(code, matchId, that time)`) and sets tick 0 (that time + `GO_LEAD_MS` 2 s) for everyone. The server stamps on
  arrival and a later arrival always carries a later time, so the first GO is FINAL the moment it lands — the same on every phone and
  on the server, whoever the host is, however the host changes (the prompt's "the host's GO": in practice the host's phone is as likely
  as any; nobody chooses the millisecond, nobody can shop for a course) — **among the values the server sent: THE FIRST GO's PROOF, below**. The director's step `count → play` writes `seed` + `playAt` +
  `g0` into the game (THE 3 S RULE: it moves the phase); the phones already derived the same from the nodes and stand ready at tick 0.
  **No GO at all** `NO_GO_MS` (3 s) after the count (no signal anywhere, the rules not published) → **UNPROVEN**: the match plays on a
  stand-in course, nothing of it can be written, it ends after `UNPROVEN_MS` (90 s) and is never counted (THE RULES-LAG's fallback).
- **THE FIRST GO's PROOF (H4B — the same course for everyone, with a slow phone in the room):** the first GO is final the moment it
  lands **only among values the SERVER sent**. A plain `set(serverTimestamp())` shows the writer its own ESTIMATE of the server's time
  in its own mirror at once — H4's phones could take a course from it (and switch when the real value, or an earlier GO, arrived), and
  a slow host could write its estimate's course into the game while the server derives another. So: **(1) a match's GO is a
  TRANSACTION, never applied locally** (`view.js#askGoMatch` — `runTransaction(…, { applyLocally: false })`): a phone's mirror holds
  only confirmed GOs, in the server's own order; **(2) THE NODES ARE THE TRUTH** (`logic.js#startOf`): every phone — in the count AND
  in `play` — and the host's final patch read the course + tick 0 from the first GO among the proof nodes, exactly what the server's
  count derives (`jaywalkMatch`); the game's own `seed` / `playAt` only when there is no node to read (an UNPROVEN match). A very slow
  phone learns the course late and starts late on the RIGHT course — never early on a wrong one. **Proven:**
  `tests/jaywalk-firstgo.test.mjs` (a model of the start — the real `startOf` + `nextStep` — with one phone's line 0.3–3 s slow each
  way / one way, as the host or a guest, its clock right, behind or ahead, the GOs landing in either order: 147 rooms — every phone,
  the host's GO patch and the server agree, each phone takes its course once; **the same model with H4's local echo mismatches**) +
  the real line (`e2e-jaywalk-match.mjs --lag=900` / `1800`: `kit/lag.mjs` holds every database frame of ONE phone — CHARLIE through
  the first match, THE HOST through the rematch's start; each phone's seed + tick 0 are logged and must equal the server's own).
- **THE GHOSTS — IN STEP WITH THE WORLD (H4B — `ghosts.js` (PURE) + `view.js` + `night.js`).** THE RULE (the owner, Nov 16 — after his
  first live match): **a ghost is ALWAYS drawn consistent with the world on screen — never inside a car, never in the water while
  alive.** (H4 stepped a ghost `GHOST_DELAY` 75 ticks BEHIND a world drawn NOW: a friend safe on a log 1.25 s ago was drawn in the
  water today — `tests/jaywalk-ghosts.test.mjs` reproduces it. Spectating looked right only because the scene then drew the WORLD at
  the watched ghost's old tick.) `livePaths = { runs: jw/{matchId} }` — everyone's proof nodes ARE the ghosts:
  - **THE WORLD's TICK** (`view.js` frame): while this phone's kid runs, HIS tick; once he is out / for a watcher, the clock's. The
    scene draws every car, log, train + light at it (`night.draw(…, { t })`) whatever run the camera follows.
  - **`conf` — the confirmed run:** every hop this phone has of them, each applied in its own tick, through the same engine (never
    past the world's tick). **`run` — the drawn run:** `conf` stepped on to the world's tick **with no new hop assumed** — they stand
    / ride their log with it, exactly as the rules would. A drawn ghost IS the engine's state at the tick the cars are drawn at.
  - **A LATE HOP** (it always is, by the network's delay): `run` is rebuilt from `conf`; from where the ghost WAS drawn to where the
    rules put it now is closed in **A QUICK HOP** through the air (`CATCH_MS` 110 ms + 40 a cell, ≤ 320 ms — never a teleport, never
    a slide along the ground; the watched ghost's too — `o.off`).
  - **A DEATH ONLY ONCE CONFIRMED:** a ghost goes out only when that player's own log is complete — their node's `e` is here (it
    arrives right behind their last chunk). Until then a drawn run that WOULD go out next tick **holds still in place** (`held`) — a
    death never un-happens. Held longer than `HELD_SHOW_MS` (0.9 s — a dropped signal, not the network's beat) it is **not drawn**
    until its hops / its end arrive (the "still catching up: not drawn" pattern — never a kid standing in what would have hit him).
    THE MOTHERSHIP takes a ghost at its fixed tick with nothing to confirm.
  - **HOPS GO UP AT ONCE:** a match's chunks are sent within `CLOCK.flushMatchMs` **120 ms** (was 500) — one small write a hop for a
    human (≤ 8 a second at the very most; measured with the lazy bot: 12–44 writes a minute a player). THE DROPPED SIGNAL's rules +
    the proof are unchanged (a chunk is still `{ s, at }`, the judge reads the same arrivals).
  - **exact, deterministic** — with every hop in, a ghost's state = that player's, tick for tick; its final lanes ARE theirs.
  Drawn as the same kid, **SEE-THROUGH, in their colour**, a thin ring of it at their feet, **their NAME over them** (DOM tags moved by
  transform; two that would overlap stack). Two draw calls for all of them (instanced). Never colliding — nothing in the rules knows
  them. THE LIVE ORDER reads the same runs (no new hop assumed = the confirmed lanes).
- **THE LIVE ORDER** (`.jw-order` — the top-left corner, under ☰): everyone's name + lanes, best first, yours outlined. **OUT = a CROSS
  in the colour dot's place + the name struck through** (a shape — never colour alone). **No lives HUD anywhere.**
- **OUT = SPECTATE:** the hit is seen (`END_HOLD_MS`), the cause in neon words over the scene (OUT · FLATTENED BY A TAXI · 12 LANES — it
  fades), then **CALL THE WINNER** (the match kit's `showCall` — when two or more are still in; the call = your own node's `k`), and the
  camera **follows THE LEADER's ghost** (the farthest still in — smooth: the scene simply draws that run; a tap anywhere = the next
  player still in; if they go out, back to the leader). The watcher's line at the foot: WATCHING NAME · TAP FOR THE NEXT · YOUR CALL ·
  NAME — or what the room waits for (WAITING FOR NAME · NO SIGNAL). The big number shows the watched player's lanes. A late joiner (not
  a participant) watches from the start.
- **THE END** (`director.js`, the host — pure; every patch moves the phase): the match ends when **every player's run has ended** — their
  node's `e` — or THE MOTHERSHIP's moment + 4 s. A player gone silent (`endedFor`): ONLINE → `IDLE_OUT_MS` 18 s after their proof last
  moved (an idle kid is out by then); OFFLINE → + `DROP_WAIT_MS` 75 s (THE DROPPED SIGNAL: their hops may still be queued) — then the
  match ends without waiting longer. The results = `scoreRuns` → `scoreNode` → THE JUDGE for each node (a refused log = a kid who never
  hopped, `bad`; a slowed one = `cut`); `calls` = `scoreCalls` (a call counts when the caller was out — never taken —, named a player
  still in at that moment, within `CALL_WINDOW_MS`; right = that player finished first → `callBonus(players still in)` game-night
  points — `nightBonus`). `standings`: lanes, the earlier tick; the same lanes at the same tick share the place.
- **THE SERVER'S REPORT** (`api/report.js` — `jwMatch`): **every named player's run replayed from their own proof node**
  (`jaywalkMatch`) — nothing the host wrote is read (not `game.seed`, `playAt`, `results`), so the host's placings need no second opinion.
  A silent-but-present player (a GO, no hops) has a run — the blackout's — and is credited; a seat with no node is not (A SEAT IS NOT A
  PLAY). **A report landing after a REMATCH still credits everyone** (the room moved on → the proof nodes + the night record: `src:
  'proof'`). Never counted: a match the owner did not play (while being built) · an UNPROVEN match · no GO · **a match nobody ever
  hopped in** (nothing to replay — and no XP for standing still).
- **THE PODIUM** (`victory.js#finalScene` + `finalRows`): the console's frame — **WINNER · NAME WENT THE FARTHEST** (+ its burst; the
  winner's sting played by the body) — then the body: HOW YOU WENT OUT + "12 LANES · YOU FINISHED 2ND" + YOUR CALL WAS RIGHT · +0.4
  POINTS + **SHARE MY RUN**, then the console's results list: **everyone in order as slim cards, their lanes + their own cause line**
  (`note`). The foot: BACK TO THE ROOM — **PLAY AGAIN in a room = the console's rematch** (the room's REMATCH vote / the host's start).
  **The end screen's buttons are the site's non-pill tube** (10 px corners, as the dailies' — `.jw-final .btn`).
- `index.js`: `start` → THE GAME FRAME; `step(game, { now, live, code, online })`; `livePaths`; `finalRanks`; `nightBonus`; `createView`;
  `preload`; `finalScene`; `shareRun`; `soloAgain`; HOW TO PLAY through the help's hub.
- **Registered** (`tests/registration.test.mjs` checks a `preview` row too): the GAMES row, the registry loader, its tube mark (THE SIGNAL),
  `css/base.css [data-theme='jaywalk']`, STANDINGS + `SOLO_OK`, `PROOF_TREES`, the per-game budget, the preload graph, **its smoke START
  (H4 — `e2e-smoke.mjs`: a local page that asks)**. **WAITING — ONE named list, `JAYWALK_WAITS`:** `meta` · `help` · `art` → the go-live pass.
- The server never credits it until its row is playable — except a match / a run THE OWNER played (`reportableGame`).

## THE START (H4B — the first seconds of a match)
Measured (`e2e-jaywalk-match.mjs --start [--profile]`: BOB's phone at 390 × 844 @3 under a 4× CPU throttle, a cold scene — every frame
from the count to 3 s after GO, `window.__jwGame.timeline()`): the scene's own start (the WebGL context, the models, the programs — the
profile: native GPU work, not the city, not the rules) is ≈ 0.6 s of long frames in the count's FIRST second (worst 200–234 ms, all
before the "2"); **after GO the worst frame was 16.9 ms before and after this pass on this machine** — the lag the owner felt on his
iPhone could not be reproduced here. What a phone does differently, and what H4B does about it:
- **THE WARM FRAME** (`night.js#warm`): a phone builds a program's real pipeline + uploads a mesh's buffers at its FIRST DRAW WITH
  SOMETHING IN IT, and every instanced kind starts with 0 instances — so a train, a truck, THE UFO's disc, a ghost were first built
  when they first came into view, mid-run. Now every kind gets ONE instance far under the ground, the UFO's discs + the lines' words
  stand there too, the programs are compiled (`renderer.compile`) and ONE frame is rendered (the bloom's pass included) at the top of
  the first frame — and again in the frame after Kenney's models land. Never seen (the real picture is drawn right over it).
- **THE SOUNDS ARE DECODED AHEAD** (`view.js` build → `sfx.js#decode`): during the count / the wait for GO — never on the first hop.
- **THE TIER IS REMEMBERED** (`jw:lab:tier`, 14 days — the city's `na:tier` rule): a phone that had to step down a quality tier starts
  there next time (the kit steps back up by itself after 8 good seconds) — never the first seconds of EVERY match at a tier it can't hold.
- **THE GHOSTS START WITH YOU:** H4's ghosts stood still for the first 1.25 s after GO (their delay) and then followed — part of
  what read as lag. Now they hop as their hops land.
- The course itself is cheap (`createCourse` 0.02 ms, a lane ≤ 0.3 ms) — nothing to prepare there.
- **Left for a real phone:** the count's own first second (the scene's start) — moving it before the count means a second WebGL
  scene alive during the walk inside (the city's memory rules: not done).

## THE DROPPED SIGNAL (H4 — the owner, Nov 16: a phone in a moving van)
The database's client QUEUES writes while a phone is offline and the server stamps them when they ARRIVE — so a lost connection looks
exactly like slow motion to a per-chunk lag check (H3's: a chunk whose first hop was > 8 s late was CUT). H4 tells them apart by HOW the
chunks arrive (`replay.js#clockProblem` + `tuning.js#CLOCK`):
- **A DROP = a SILENCE, then a BURST that catches up.** A late chunk is explained when no hop in it is older than the last arrival before
  the silence (− `behind` 8 s), the silence is ≤ `drop` **75 s** (~60 s offline + the reconnect); the rest of the burst may be late too,
  each chunk LESS late than the one before (`jitter` 6 ticks), and the log must be back on the clock within `catchUp` 15 s — or simply
  end inside it (the kid went out while offline). **Never held against the run: the FULL honest run counts.**
- **SLOW MOTION = the ticks drifting behind while the chunks keep arriving** — no silence explains it → the run is CUT at its first
  late hop (as H3). A "drop" whose lag GROWS, or that never catches up, was slow motion all along → cut at the burst's FIRST hop.
- **A log AHEAD of the clock** (a sped-up game, a log made in advance) → the whole run REFUSED (unchanged). A chunk clock that runs
  backwards → refused.
- **In a match** the host waits `DROP_WAIT_MS` for an offline player's end before the match ends without it; chunks that land after
  `final` are refused by the rules (the run is scored at its last proven hop). **A solo run** stays `play` until its own `e` lands — the
  end screen says NO SIGNAL — YOUR RUN COUNTS WHEN IT IS BACK and the podium takes its place by itself.
- **Proven:** `tests/jaywalk-match.test.mjs` (30 s · 60 s · from the start · two drops · over the run's end · a slow-link trickle → all
  count in full; 0.8× and 0.5× slow motion, a paused game, a 95 s drop, a fake drop that never catches up → cut; the future, double
  speed, a backwards clock → refused) + **a REAL offline gap on the emulators** (`e2e-jaywalk.mjs --drop`: the phone's database line cut
  with `goOffline` for 30 s and 60 s mid-run, the bot playing on → the server saw a silence of 31.5 s / 61.7 s then 24 / 44 chunks
  landing together → its own replay = the phone's lanes, no cut).
- **Known limits (for the review):** inside ONE silence the server cannot know how fast the phone played — a cheat that fakes a drop
  can slow the LAST ≤ 75 s of a run (it must end inside the fake drop, or catch up at real speed) · a bot that plays in real time is a
  very good player to the server (H3's).

## THE SHARE IMAGE (H4 + H4B's add-on — `share.js` + `shot.js`; on the share kit + the dailies' link machinery)
**The player's real run — every share is a different picture.** At `shot.js#shotMs` after the hit — per cause, while the kid is still SEEN (THE TOUCH-UP PASS, below; was one 460 ms) — the view asks the scene for that frame
(`night.js#snap` — copied off the WebGL canvas in the same frame; kept on the phone until the next run, with where the kid stood:
`shot.js`). 1080 × 1350, drawn ON THE PHONE from the result's PUBLIC fields. Solo (the podium's SHARE) + a match (SHARE MY RUN in the
body). No frame on this phone (a refresh on the podium) → the same card on the night's dark.
- **THE CARD (H4B's add-on, the owner Nov 16 4:33 pm — THE FRAME IS THE HERO):** the frame is the kit's middle at its own size
  (`JW_CARD.box` 984 × 792 — was 800 × 690: `kit/share-run.js#drawRunCard`'s `o.box`), zoomed on the kid + what got him
  (`shotCrop` — `SHOT_ZOOM` 1.12; since THE TOUCH-UP PASS his point at the picture's middle for EVERY cause — `SHOT_UP` 0, THE
  BLACKOUT's own far-above framing dropped: he is in the picture now) and BRIGHTER (the picture screened over itself — `SHOT_LIFT`; no canvas filter). **The cause line is on the card
  ONCE** — the big neon words at the frame's head (the result line under the name is gone: `jwRunCard` has no `result`). The lanes in
  the game's big neon numerals, THE SIGNAL, the name and NEONSPEAKEASY.COM stay. Reads as a small iMessage preview (the 540 × 675
  picture is what a link shows).
- **THE SHARE = THE PICTURE ONLY (H4B's add-on):** the share sends **ONLY THE LINK** — `navigator.share({ url })`, the site's rule
  from FIXES R1 (`js/daily/share.js#sendReady`): no "My JAYWALK run — …" text, no site line. In iMessage + chat apps the link shows as
  the big picture card (its `og:image` = this card) and a tap on it opens neonspeakeasy.com.
  - **THE CARD IS BUILT BEFORE THE TAP** (`victory.js#finalScene` → `share.js#warmShare` → `prepShare`): the end screen draws the
    card; `LINGER_MS` 1.5 s later (the end screen is being read — a quick PLAY AGAIN uploads nothing; a tap on SHARE ends the wait at
    once) the half-size PNG goes up; the tap shares the ready link. A picture over 300 KB is re-encoded on 6, then 5 bits a channel
    (`fitPng` — the server's cap is 400 KB; a game frame is a heavier PNG than a scorecard).
  - **THE SERVER** (`api/_lib/share-card.js#saveShareCard` — `POST /api/daily { action: 'shareCard', games: ['jaywalk'], run: { room,
    m }, png }`): a RUN's card is accepted ONLY from a player the server's own COUNTED result of that match names
    (`results/{ROOM}_{m}` — `st: 'done'`, the game, `o[pid]`), on that result's own day (today / yesterday). The report lands a moment
    after the podium: the phone tries `LINK_TRIES` 4 times, 1.2 s apart, on `no_run`. **The share kit's rules hold:** ONE run card a
    player a day, replaced in place under the same code (a link already sent keeps working, its picture the latest run); the same
    picture again uploads nothing (the phone remembers `{ pid, h, url }` — `ns:shr:jw`; the server compares the hash); a cap of
    `RUN_UPLOADS_A_DAY` 12. **Its own slot** (`shrp/{pid}:jaywalk/{day}` — the card: `k: 'run'`, `s`): a run never replaces the day's
    DAILIES scorecard. The page (`sharePage`, `k: 'run'`): "NAME · JAYWALK · Nov 16", the big-picture card, opens `/`.
  - **No link** (an UNPROVEN / uncounted run, no signal, the cap, a desktop) → the picture itself goes out — still with no text.
  - While JAYWALK is being built only the owner's runs + his guests' are counted — so only they get a link (everyone else: no JAYWALK).
- **Proven:** `tests/jaywalk-share.test.mjs` (the card's fields, the frame's box + crop, the colour fit, the sender's source) ·
  `tests/integration/share-card.test.mjs` "A RUN's CARD" (refused without a counted result naming the player; its own slot; replaced
  in place; the page; the owner's delete + the sweep) · the solo + the match E2E (the share sheet stubbed: the tap shares `{ url }`
  alone; the link's page → its `og:image` = a 540 × 675 PNG ≤ 300 KB; the page opens `/`).

## THE LINES — YOUR BEST LINE + THE NEXT FRIEND'S LINE (H4 add-on, the owner Nov 16 — `lines.js` (PURE) · `night.js#setLines` / `flashLine` · `view.js`)
- **YOUR BEST LINE** — *H5C: its FORM is now a GOLD TAPE between two posts (buoys on water), its words always readable: "NO WEAK POINTS — THE LINES", below; the rest here stands* — (a solo run — and, in a match, your own SOLO best): a glowing **GOLD** line across the WHOLE lane at your best
  lane (its far edge — one lane more crosses it), **"YOUR BEST · 143" written big on the ground** beside it (the letters over half a
  lane tall — ≈ 27 pt at the kid's row at ZOOM 8 on a 390 pt phone; a soft dark strip under them: they read on grass, asphalt, water,
  the rails). **Bold, never a road marking:** a soft halo, a wide glowing band, a white-hot core, gold glints running along it (the
  road's own markings are thin dashed pink / pale lilac — H5B: never cyan). **On ANY lane kind:** painted on grass / road / the rails / the flight path; **on
  water a floating row of glowing BUOYS on their rope** (they bob; clear of the logs). Seen a dozen lanes ahead (the view's own reach).
  **CROSSING IT** (landing on the first lane past your best): a short light burst along the line (it flares + sparks; the flare alone
  with reduce motion), **the new-best sound**, **the lane counter flashes and stays GOLD** — from then on the run is a new record.
  **No line on a first-ever run** (no best yet).
- **THE NEXT FRIEND'S LINE** (SOLO runs only — a match already has the real players as ghosts): ONE **NEON PINK TAPE** between two posts, a little above the ground (H5B's add-on — it was a pale cyan band lying on the lane: it read as a strip of water; "BLUE ON THE GROUND = WATER, NOTHING ELSE" below) (never gold —
  gold = YOUR BEST) at the LOWEST friend best you have not passed, with **"LIAM · 212"** on the ground (at the right, yours at the left).
  Crossing it: a small burst + a quiet chime (`area-arrive` at 0.4 — it replaced `landmark` in H5C), then the next friend above appears. **Never more than ONE friend line
  on screen; a friend behind you never shows; no friend bests = no friend lines.** (Level with a friend — standing on their lane — the
  line is still right ahead of you: one lane more beats them.)
- **THE DATA = the SERVER-counted solo bests** (the board `jaywalk-solo`) — never a local guess: `/api/profile { action: 'table' }`,
  YOUR TABLE's own read (you + the friends YOUR list names — never a pid), **asked ONCE at a run's start** (`view.js#loadTable` from
  `reset`) and kept 90 s on the phone (`TABLE_KEEP_MS` — PLAY AGAIN restarts in a second: no call a run when they come that fast);
  **nothing is asked during a run.** Until the answer lands — and with `/api` down — YOUR BEST LINE uses the best the server last TOLD
  this phone (the end screen's `jw:lab:best`, set only from the server's own outcomes), and there are no friend lines. Your lines draw
  on YOUR run only — never over a player you are watching.
- The lab draws none (it never calls a server). Tests: `tests/jaywalk-lines.test.mjs` (the table → the data; no best = no line; one
  friend line, the lowest ahead, never one behind; the crossings; a match = YOUR BEST alone; the looks; the sources — one call a run,
  none in the frame loop) + `e2e-jaywalk.mjs` (a first-ever run: no gold line, a seeded friend's line seen coming + crossed with its
  chime; the next run: the gold line at the server's best, crossed → the burst, the sound once, the counter gold).

## THE BIG NUMERALS (H5A's add-on — the owner, Nov 16 7:03 pm; `js/games/jaywalk/numerals.js`)
On the owner's iMessage share card **"172" read like "N2"** — the 1's top flag ran into the 7's top bar, the digits sat too tight.
ONE helper now draws JAYWALK's big neon numerals EVERYWHERE — the share card's lanes + the lines' words on the ground ("YOUR BEST ·
172") on a canvas (`drawNum` / `numWidth`), the in-game lane counter (the game + the lab) + the end screen's number in the DOM
(`setNum` + `prepNums`):
- **MORE ROOM between two digits** — `NUM_GAP` 0.09 em on a canvas, 0.09 em of margin a digit pair in the DOM (each digit its own
  box, `.jw-dg`); words beside a number keep the font's own spacing.
- **A "1" THAT CAN'T MERGE: a 1 on a BASE FOOT.** The fonts' own 1 (Chakra Petch in the DOM, Orbitron on the card) is a bare stem
  with a flag, so the foot is DRAWN: the 1 is rasterised once a font (`footOf` — its stem read off the pixels at 200 px), and a bar
  0.8 stem-widths past it each side is laid on the baseline — a rectangle on a canvas, `.jw-d1::after` in the DOM placed by the
  measured numbers (`--jw-1l · w · r · h · b`, em; its outline follows the counter's — pink, gold on a record). A font whose 1
  already stands on a foot gets none; a measure taken before the web font landed is never kept.
- The number stays ONE line (`white-space: nowrap`) and reads as its number to a screen reader (`aria-label`; the digit boxes are
  hidden from it). **A trap this fixed on the way:** `.jw-fin-n span` (the small LANES label) matched the new digit spans — the end
  screen's number would have shrunk to the label's 15 px; the label's rule is now its own child's only (`.jw-fin-n > span`).
- Checked at 390 × 844 for **17 · 71 · 111 · 117 · 172 · 711**: the share card at its own size (1080 × 1350) and as the small link
  preview, the counter, the end screen, the record's gold — `tests/integration/jaywalk-lab.mjs --nums` →
  `Downloads/NEON/jaywalk-h5a/nums/`; `tests/jaywalk-numerals.test.mjs` (the room + the foot on a stub canvas, every place wired).

## THE ICON — THE SIGNAL (H4 — `core/marks.js#MARKS.jaywalk`)
The owner's pick (`Downloads\grok\jaywalk\icon\icon-2-signal.png`): **a pedestrian crossing-light box, upright, CYAN** (`#35e3ff`),
**its walking figure lit HOT PINK** (`#ff3fa4` — lit when it shouldn't be: the jaywalking joke). Built in the game's own tube system —
two tubes at the same 7 / 100 width + glow as PRISM DROP / OVERCLOCK / HOLD'EM; upright + cyan keeps it apart from HOLD'EM's tilted gold
card. It IS the mark everywhere a mark shows: the owner's PLAY shelf row, his JAYWALK · TEST card (in the tile's place), the room's game
list, the JAY / WALK sign, the share image. `marks.js` is a boot file: trimmed to fit (THE BOOT BUDGET not raised). The TILE (`art`)
still waits for the go-live pass.

## THE POSTER (H4 — `poster.js`; the lab's `?poster=1`)
For THE TRI-VISION board's JAYWALK COMING SOON face — **rendered from the game itself** (H5A: RE-SHOT with the new kid, in THE
DOCKS): the real night scene, a staged moment (`findStage` — pure: the same picture every time; lanes 53–95, a clear foreground):
Kenney's kid MID-JUMP toward the camera, big in frame (his face, his cap + shirt in the player's colour), off a road with a car
just past him (both tail lights + its red glow — no light trails), a log on the water behind, the pier's planks + bollards +
crates + a moored fishing boat, the fish market's neon arch + its neon fish up the course (THE DOCK CRANE when a course has one
in the frame), the skyline over them; **the LEFT PART dark + calm** for the board's words. A low hero camera (`POSTER.hero` → `camera.js`'s `hero` option — THE CAMERA stays ONE module; the game never
passes it). 848 × 448 (the board's size) at 2× (1696 × 896) + 1×; the page shows it + SAVE links. ZERO server calls (the lab's rule).
`node tests/integration/jaywalk-poster.mjs "<chromium>" <outDir>` saves both PNGs. **The city's billboard is NOT changed** — the city
chat swaps the art in.

## THE NIGHT LOOK (H2 — `night.js` + `night-fx.js` + `models.js`; the same `draw(run, course, a, dt)` as the graybox)
A VIEW: it reads the run + the course, never writes them; the rules never import it (`tests/jaywalk-night.test.mjs`). three.js 0.160 core
only (no add-on: the GLB reader + the bloom are ours).
- **THE GROUND** — ONE instanced plane a lane, drawn in a shader (`night-fx.js#createGround`): grass (soft patches, darker at a road / water
  edge) · asphalt + curbs + dashed neon-tinted lines between two road lanes · **THE WATER** (**H5B's add-on REPLACED the H4 look described here — VIDEO-GAME WATER by night too: "BLUE ON THE GROUND = WATER, NOTHING ELSE", below**) (H4 — the owner: CALM, real-looking night water, no electric zigzags — a deep night
  blue, navy in the troughs → teal on the swell; soft UNEVEN ripples = the contour lines of two slow drifting noise fields (never a sine
  stripe); gentle broken reflections of the skyline's neon + a few small moving glints of it; a THIN soft foam line + a slightly paler
  shallow at the banks; no texture file. Still unmistakably water beside the grass + the road: the only blue ground, the only one that
  moves) · rails + sleepers (the rails catch the red signals in the tell) · THE FLIGHT PATH (slate tarmac; the tell = a bright
  chevron band RACING to the crossing + the runway lights) · a landmark's lane (dark paving, a pink trim). Per lane: the BLACKOUT's darkness
  (a cold flicker as its lights die), the tell; per pixel: the edge columns dimmer, the fog.
- **CARS** — Kenney's sedan / hatchback / **THE TAXI (H4: cab YELLOW, never a neon tint, its ROOF LIGHT lit — the cause line "… BY A
  TAXI" is true; its streaks its own yellow)** (a 1-cell car, picked from the seed) + the van (2 cells) + **THE BOX TRUCK** (3 cells — H2B,
  built in code, `models.js#buildTruck`: a rounded cab in the truck's colour with dark glass, a long white box with its stripe, a dark
  chassis, six wheels, a bumper; four amber marker lights along the foot of its side + lit tail lights — the scene's light quads; its drawn
  length = its rules length); a NEON BODY TINT per car from the seed (pink · cyan · violet · coral · blue) — only the model's PAINT takes it (`paintMaterial`
  — the windows, wheels, bumpers keep Kenney's colours). Each car: a blob shadow +
  **NO LIGHT TRAIL (H5A — the owner, Nov 16: from above the streaks read as jet exhaust; afterburners are THE BLACKBIRD's alone, H6)** — on every
  vehicle (the cars, the taxi, the van, the box truck, the train) only: both tail lights lit on the body, the soft red glow on the road
  behind, the soft headlight glow in front —
  **THE TAIL LIGHTS (H5B's add-on — the owner, Nov 16 9:45 pm; it REPLACES the two tail glows described next): ONE soft merged red pool a vehicle, PINNED UNDER its rear — it starts at the bumper (it runs on under the body: never a gap), fades backward, short + soft-edged, half the old strength, inside its own lane; its visible SOURCE = two bright red lamps ON THE BODY (a white-hot core each — they catch the bloom). The train's tail the same. By day: no glow, the lamps just red on the body. The headlights are as they were.**
  **ITS LAMPS (H2B add-on): BOTH headlights and BOTH tail lights cast** — `night.js#LAMPS` holds each vehicle's lamps ([half their
  spacing, their height]: the 4 Kenney cars, the truck, the train's front); each headlight = a lamp quad + a SHORT SOFT beam on the road
  (`HEAD_REACH` 1.35 cells — the glow shader's shape 6: a quick falloff, soft edges, low intensity), each tail light = a lamp quad + a
  small red glow (`TAIL_REACH` 0.75). A glow on the road, never a long spotlight. Decals — NO real light anywhere.
- **LOGS** (H3 — the owner, Nov 16: all the SAME THICKNESS, each its OWN LENGTH, nothing that could read as a pickup) —
  `models.js#buildLog(len)`, ONE geometry a length (1 · 2 · 3 · 4 cells: nothing is stretched): a ROUND trunk of ONE radius (`LOG.r` 0.36 — a
  true circle across), **HALF-SUNK** (its centre a hair under the waterline — `LOG_FEET`), **lit on its shoulder, dark down both limbs**
  (it reads as round), **bark grain along the length** (each strip round the trunk one tone from end to end), **the cut ends PLAIN PALE WOOD (H4 — the banded ends read as a shell):
  three thin rings a shade darker, the bark's thin edge**, round discs on a slanted saw cut, facing up at the key light (never the pink
  rim light's sheen). **The moss, the branch stub and "the dot" are REMOVED** — the dot was the
  stub's pale sawn face (two small concentric circles on the log's shoulder): from the camera it read as a pickup; JAYWALK has none.
  **THE WATERLINE**: a thin amber ring hugging the log (the glow shader's shape 7, a stadium ring) + a small pale ripple ring swelling off
  it; **at night the amber is ONLY that thin underglow + a soft light on the water round it** — the wood stays visible. They bob + rock
  gently (and dip + roll when the kid lands on one); a soft pale wake trails each. Water = danger, a log = safe, in one look.
- **TRAINS** — Kenney's front + 5 carriages + a front turned round; lit windows, BOTH headlights casting a soft beam ahead + BOTH tail lights a red glow behind (the lamps, as the cars'), (no streak behind it — H5A), FOUR RED SIGNALS along the
  lane that flash **through the TELL alone — dark once the train's nose is in the lane (H5B's add-on: "THE RAIL SIGNALS FLASH ONLY BEFORE THE TRAIN", below)** (the tell is the visual), a red warning glow on the side it comes from. The body is drawn ~10
  ticks before + after its pass (it is SEEN coming through the edge column — the rules' pass is unchanged).
- **MOVERS NEVER POP** — a road / water lane is one lap long: the view draws a mover's NEXT lap too (always outside the 9 played columns),
  so a car / a log leaves through the edge column and the next one is seen coming.
- **TREES** built in code (stacked soft blobs on a short trunk, 3 sizes from the seed); **PROPS** (H2B — the owner: no junk-looking props;
  nothing may look like a placeholder) = Kenney's planter / dumpster / cone + **THE BARRICADE** built in code (`models.js#buildBarricade`:
  two orange / white striped boards on dark legs + an amber lamp — Kenney's jersey barrier read as a pale cube from above) as obstacles
  (the docks' clutter round a landmark) + the STREET LAMP on an edge column every 4th grass lane (a warm pool on the ground + its bulb);
  tufts — **all of this is THE OPENING's (lanes 0–49); an AREA's lanes are dressed by `areas.js` (THE AREAS, above)**. **Kenney's crate-box is OUT** (THE DOCKS' crates are built in code — `models.js#SCENE_MODELS`). What stands where is view-only, from the seed + the lane (`decorOf`) — the same on every phone.
- **THE SKYLINE BAND** (`.jw-skyline`, DOM over the canvas): the top 24 %, the picture covers the band's height and slides ≈ 10 % with the
  kid's column (transform); ~~its foot fades into the lanes' fog~~ **H5C: solid down to THE SEA WALL — "THE FAR EDGE", below**. NIGHT LIFE: 8 aviation lights blink, 5 neon blocks flicker (opacity only;
  none with reduce motion). Only the current look's picture loads (H5B: the day's `skyline-day.webp` by day — THE DAY LOOK, below). **THE LANDMARKS IN THE SKYLINE** (H5B) stand on it.
- **THE BLACKOUT** (the wall): per-lane darkness in the ground shader + on everything standing on the lane (its lights go out), a cold
  blue edge where it bites, a black curtain a lane behind it; the screen's foot always fades to black (`.jw-blackout`).
- **THE SMOOTH FINISH**: low-roughness standard materials on the cars / the kid / the train + a tiny GENERATED neon environment
  (`neonEnv` — a 64 × 32 picture, PMREM'd once), a pink rim light from behind, blob shadows, the ground's edge darkening. Kenney's normals
  are never recomputed.
- **THE CAMERA** — `camera.js` (H2B — the section below): ZOOM 8 columns across, the sideways follow, the slight turn (H3: STRAIGHT by default). The dimmer edge
  column each side of the 9 played stays the cue for the play area's edge (the ground, everything standing or moving there at ~0.5). The
  rules stay 9 columns. THE WIDER VIEW (H2's WIDTH 9 · 11) is retired.
- **PERFORMANCE — H5A (the mini PC, 390 × 844 @3, the bot playing; the lab check's `--perf`):** the opening: 59.9 fps at every tier at
  1× and 4× CPU (26 calls, ≈ 94 k triangles at tier 2). **THE HEAVIEST AREAS at 4× CPU, tier 2 (the bloom) and tier 1: DOWNTOWN
  59.9 fps (≤ 32 calls, 172–183 k triangles) · THE LIGHTHOUSE 59.9 (≤ 31, 165–189 k) · THE RAIL YARD 59.9 (≤ 32, 176–179 k)** — p95
  16.8 ms, no frame over 33.4 ms. **8 KIDS** (the kid + 7 ghosts — the skinned, instanced kid: one draw call for him, one for all
  the ghosts) in DOWNTOWN at 4× CPU: **59.8 fps at tier 2, 59.9 at tier 1** (35 / 29 calls). The real views: the solo run 59.9 fps
  at every tier (8.7 ms of work a frame at tier 2 under the 4× throttle), a 4-kid match 59.9 at every tier. An area in view costs
  ≈ + 6 draw calls and ≈ + 80 k triangles over the opening (the pieces are code-built boxes + cylinders; a kind with nothing in
  view costs no call). **Left for a real phone:** these are a desktop GPU's numbers — the tiers lower the sharpness + the bloom,
  not the triangle count; if the owner's phone drops frames in an area, the first cut is the pieces' own detail (the containers'
  ribs, the crates' bands).
- **PERFORMANCE** (H2B, ZOOM 8 TURNED): ≈ 19–28 draw calls (one a kind — everything that repeats is instanced), ~125–140 k triangles
  (Kenney's wheels are most of it; the logs ≈ 20 k); a window of ≤ 36 lanes re-laid every frame (a closer zoom lays fewer). **59.9 fps at
  every tier at 1× and 4× CPU** on the mini PC (390 × 844 @3 — the pass log's table); THE AUTOMATIC STEP is proven both ways
  (`tests/jaywalk-camera.test.mjs` on synthetic phones + the browser check under a heavy throttle). A `?fps=1` readout inside a
  screenshot is not a measure (one shot = a ≈ 250 ms frame in its 120-frame window). TIERS (the match kit's `createTiers`, automatic): **2** = the
  device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM (the lights alone, layer 1 → a half-res target → blurred at a quarter → added back) ·
  **1** = DPR ≤ 2, no bloom · **0** = DPR ≤ 1.5, no tufts, no water reflections. No post-processing below the top tier.

### THE KID + THE HOP's FEEL (H5A — the new kid; all derived from the run's state between frames: a replay draws the same kid)
- **THE KID = Kenney's "Mini Skate" skate boy** (CC0 — `assets/jaywalk/models/kid.glb`, `models.js#loadKid`; the owner, Nov 16): a
  T-shirt + a FORWARD cap built into his head. **THE CAP + THE SHIRT take the player's colour** (the whole cap — its white front
  panel a lighter shade: from above the cap is what you see); his face, arms, shorts + white sneakers stay Kenney's. The code-built
  kid is gone everywhere (the game, the ghosts, the lab, the share frame, the poster). He faces the camera until the first hop (his
  face), then the way he last hopped (Kenney's models face +z — `KID_YAW`).
- **ONE SKINNED GEOMETRY, INSTANCED:** the rig is rigid (every vertex on ONE of 7 bones), so the build writes THE POSES — the skin
  matrices of the clips the game uses (idle 16 frames · jump 12 · fall 8 + a hand-made SPLAY) — into the GLB; the scene keeps them
  in a float texture (a row a frame) and each instance blends two rows in the vertex shader (`night-fx.js#paintMaterial` `skin` —
  `aKid` = lit, row A, row B, how far to B). **One draw call for the kid, one for every ghost in the match** — no per-kid bone
  update, no animation mixer. **≈ 38.5 pt tall at ZOOM 8 on a 390 pt phone** (`KID_S` 1.62 — measured, `kidHeightPx()`; H2B's: 39–40).
  The file never came (three tries) → his glow ring + shadow alone are drawn, nothing throws.
- **HE ALWAYS STANDS OUT** (H2B): a soft pool of HIS COLOUR on the ground under him (H5A: softer — his own colours read through it) +
  a ring round his feet (it breathes — never with reduce motion; on a log it rides the log) + a RIM LIGHT of his own.
- **THE HOP** (inside the engine's `HOP_TICKS`): **Kenney's JUMP clip timed to the hop** (blended in on the push, out on the landing —
  his legs kick, his arms lift) + our squash at the push / stretch on the arc / squash on landing (150 ms), the turn the way he
  hops, a lean into it, the blob shadow shrinking + fading as he rises; **his idle between hops** (Kenney's — still with reduce
  motion); a dust ring on grass; a ripple + the log's wobble on a log.
- **THE WORLD GOES ON after a hit** (H4): the run's own tick stops at the hit; the cars + logs drive on (the car rolls OFF the kid).
- **THE HITS, one per cause**: car (any vehicle) = **THE FLATTENED KID (H4's rule — a funny cartoon flat kid, never a smear; H5A —
  his cap ON TOP): squashed STRAIGHT DOWN under his cap, a seventh as tall, half as wide again, in THE SPLAY — from above his cap
  sits on a flat kid, his arms out left + right, his two sneakers kicked out below it; a quick squash + one small bounce** · water =
  a splash + the sink (flailing — Kenney's fall) · train (+ the Blackbird's placeholder) = knocked away, spinning · edge = carried
  off on the log, then the splash · the blackout = swallowed by the dark · the UFO (placeholder) = beamed up · THE MOTHERSHIP (a
  PLACEHOLDER until H6) = a green beam takes the kid up. **THE CAMERA** (camera.js): a smooth follow that leads a hop to where it
  lands — up the lanes AND sideways — a short shake on a hit (never with reduce motion).
- The lane count: big neon numerals (`.jw-lanes` — the numbers' font: Orbitron's heavy 0 reads as a block), a small pop a lane.

## THE DAY LOOK (H5B — `night.js#setLook` + `night-fx.js` `uDay` + `skymarks.js`; the owner, Nov 16: every JAYWALK screen has DAY + NIGHT)
Night = neon · day = a sunny harbor. **The same rules in both — the look is a VIEW** (no rule file, no replay, no server file knows it:
`tests/jaywalk-day.test.mjs`). ONE scene, switched at once: `createNight(host, { look })` + `setLook('day' | 'night')`.
- **THE SWITCH:** `meta.LOOKS = ['day', 'night']` (H3's night-only lock is lifted) — the console's **GAME LOOK** setting (☰ → Settings: AUTO ·
  DAY · NIGHT, AUTO = the real sun) paints `body[data-look]`; `view.js` reads it **LIVE, every frame** (`lookNow()`): a change mid-run
  re-themes the screen at once. **PER PHONE, in a match too** (the site's rule — docs/match-kit.md THE GAME LOOK: no lock, no switch of
  the game's own): a phone on DAY and a phone on NIGHT play the same match. *(H5B's prompt asked for the HOST's look, locked for the
  match: that is SHELL 2.0 B1's switch, replaced by B2's per-phone setting; a lock needs the console's boot files — THE BOOT BUDGET is
  full. Left OPEN FOR BEN.)* The lab: **LOOK: DAY · NIGHT** (its own tabs, `jw:lab:look`, `?look=day|night`). **The music follows the
  look** (`index.js#musicFor`: `mood:day` by day, `mood:evening` by night — the existing stations; `meta.MUSIC` stays the fallback).
- **THE LIGHT:** a warm SUN high on the front-left + a clear sky's fill (the pink rim light is the night's), its own generated sky in the
  gloss (`night-fx.js#dayEnv`), **sun shadows** = the blob shadows thrown a little to one side + up the lanes (`K.shadow.put`'s day wrap;
  `raw` = straight under the thing), a haze where the night's fog is dark (`DAY_FOG_HEX`). **No bloom by day.**
- **THE GROUND:** the ONE ground shader, every colour `DN(night, day)` — rich green grass · clean grey asphalt, white curbs, **yellow +
  white lane paint** · THE WATER (below) · warm ballast, wooden sleepers, steel rails · the painted runway (white piano keys at both
  edges) · each area's own daytime ground (the docks' sunlit planks, the market's pale cobbles, the yard's gravel — its grain soft, no
  static —, the bridge's red steel, downtown's light slabs, the canal's warm stone + green joints, the lighthouse's sand + scrub, the
  airfield's apron with its yellow taxi line); the edge columns a step dimmer (0.6 / 0.8 — the night's 0.3 / 0.52).
- **LIGHT vs PAINT:** a light that only GLOWS is OFF by day (`LF` / `LB` in `night.js#draw`: the headlights' beams, the tail glows, the
  lamps' pools, the logs' amber, the kid's glow pool, the train's lit windows); a light that must READ stays as **PAINT** — the two glow
  kinds switch from additive to alpha blending in their own colour (`GLOW_F` `uDay`): **the rail signals** (a bigger red lens + a red
  wash under it + **the lane itself flashes red** in the ground shader), **the runway lights** (dim lenses until the tell — then they
  RACE white-hot in an amber ring over the lane's own **racing yellow-white chevrons**: THE BLACKBIRD's tell is unmistakable in
  sunlight), the lines, the splashes; the cars keep a pale lens in front + a small red on the body behind.
- **THE KID:** his cap + shirt colour as by night; his ring = **a soft shadow-ring** on the ground with a ring of his colour painted
  inside it; a ghost's ring the same paint; ghosts still see-through in their colours.
- **THE FOG BANK = THE BLACKOUT by day** (*H5C rebuilt its look — rolling layers, a soft ragged edge: "THE FOG BANK", below*) — the same wall, the same timing, the same rules (`run.wall`): the lane whitens under it (the
  ground shader's `dk`, soft wisps at its edge), what stands on it whites out (`fogK` 2.4 — the night darkens), a soft white edge where
  it takes a lane, **puffs rolling along its face**, the bank's body behind (the blackout's curtain, pale), the screen's foot fades to
  fog (`.jw-blackout`). Its words: **LOST IN THE FOG** (`causes.js#DAY_LINES` — the same cause `wall`; `runLine(course, r, look)`; by
  night THE LIGHTS WENT OUT). The `lights-die` sound is the same cue.
- **THE GATE by day** (*H5C: the name stands on the arch — "THE GATE'S NAME ON ITS ARCH", below*): a PAINTED arch — white posts banded in the area's colour, the arch in stripes of it (boxes, never neon) — and the
  area's name in white paint with a dark edge on a band of the area's colour laid across the lane (`areas.js#LOOKS[].paint`).
- **THE SKYLINE** (*H5C: a PAINTED picture per area, cross-faded at its gate — "THE PAINTED SKYLINES", below; this one is the opening's*): `assets/jaywalk/skyline-day.webp` (122 KB — the day picture's middle band: the sky + its clouds, the city, the
  harbour's water at its foot); **only the look on screen is fetched**; no night life on it. THE LANDMARKS IN THE SKYLINE stand on it sunlit.
- **THE WORDS over a bright scene** (`.jw-stage[data-look='day']` — css/jaywalk.css): the lane count white with a dark magenta edge,
  the area's name, the count, the hint, the watcher's line, the out card each keep a dark edge; the order + the name tags already sit
  on dark; the end screen keeps its dark panel. The share card's frame is the run's own look (it is the frame the run ended on).
- **Measured (the mini PC, 390 × 844 @3, 4× CPU, the bot playing — `jaywalk-lab.mjs --perf`):** by DAY, tier 2 / tier 1 —
  DOWNTOWN 59.9 / 59.9 fps · THE LIGHTHOUSE 59.9 / 59.9 · THE RAIL YARD 59.9 / 59.9 (p95 16.8 ms; ≤ 29 draw calls at tier 2 — the night's ≤ 33: no bloom pass). The day look draws the same kinds (the fog's puffs + the painted arch are instances of
  kinds already there; no bloom pass).

## THE LANDMARKS SEEN (H5B — the owner: at ZOOM 8 the edge-column hero pieces are usually off the screen)
- **THE LANDMARKS IN THE SKYLINE** (`js/games/jaywalk/skymarks.js` + `.jw-sky-mark`): while the kid is in an area, ITS landmark stands
  in the skyline band — THE DOCKS' two cranes + the quay's stacked boxes · THE FISH MARKET's hall under its striped awning + THE FISH
  on its pole · THE RAIL YARD's signal gantry (one signal at red) + its water tower + a freight train · THE BRIDGE's two towers, the
  main cable (a string of lights by night), the deck · DOWNTOWN's towers (lit windows / glass) · THE CANAL's three-arch stone bridge +
  its gabled houses · THE LIGHTHOUSE on its rocks, **its lamp glowing, its beam SWEEPING** (a DOM cone — transform only; still with
  reduce motion) + a sail · THE AIRFIELD's control tower (its cab lit), a hangar, the windsock. ONE small 2D canvas (through
  `ui/canvas-safe.js`), **drawn once when the area or the look changes** (set where the band's tint is set — never per frame); it
  rises in (transform + opacity). By NIGHT a silhouette edged in the area's own neon, its lamps lit; by DAY the same shapes sunlit. The
  tall pieces stand at the band's two sides (the lane count has the middle); the low ones run under it. The opening has none.
- **THE HERO PIECES AT THE GATE** (`areas.js#sigOf` — `LOOKS[].hero`): the area's hero piece(s) stand in **the gate lane's own two edge
  columns** (the one exception to "never on a gateway": a marked ground lane the rules keep calm + clear) — THE DOCKS: the crane + a
  boat · THE FISH MARKET: the stall under THE FISH + a boat · THE RAIL YARD: freight containers stacked three high, both sides · THE
  BRIDGE: its pair of towers · DOWNTOWN: two tower blocks · THE CANAL: a tall canal house + a boat · THE LIGHTHOUSE: **the lighthouse**
  (its beam) + a boat · THE AIRFIELD: the control tower + a hangar — each as far in as its feet let it (nothing covers a play column).
  **What the camera shows (measured, ZOOM 8 — `jaywalk-lab.mjs --h5b`):** with the kid in the MIDDLE column both pieces are on the
  screen ahead of him from 12 to about 8 lanes away (the top of the play, in the haze); beside the gate itself a piece is on the
  screen when he is within two columns of its side (the sideways follow shows one column past the play's edge). The band's landmark is
  the one that is ALWAYS seen.

## BLUE ON THE GROUND = WATER, NOTHING ELSE (H5B's add-on — the owner, Nov 16 9:10 pm, after a 4-player match with family)
Players hesitated to hop onto things that looked like water. **The standing rule: nothing on the GROUND is blue / cyan / teal but the
water — by night and by day** (`tests/jaywalk-day.test.mjs`).
- **THE WATER = VIDEO-GAME WATER, by night too** (readability beats realism — H4's navy read as a dark glass strip): a clear saturated
  blue, the brightest + bluest ground in view — night `#1a6fe0 → #3fb0ff` on the swells, day `#2f9cff → #6cc8ff` (the same shader, the
  look picks the palette); white-ish **ripple caps + specks DRIFTING WITH THE CURRENT** (the lane's own flow, cells a second, handed to
  the ground as the lane's `fx`: the surface moves the way — and as fast as — its logs go); a **BOLD bright foam line** at both banks; **a
  soft darker shadow under each log**; the neon's reflections kept, small (night, tiers 1–2). Never a zigzag, never a sine stripe.
- **THE FRIEND LINE is NEON PINK** (`lines.js#LINE_HEX.friend` `0xff4fd8` — it was pale cyan: a glowing band across a whole lane read
  as a strip of water) **and a line you CROSS, never a surface**: a short glowing post at each edge of the play (on its boundary lines),
  the band **a TAPE between them a little above the ground**, its thin shadow under it. Its words, burst, glints + drops follow the
  colour. YOUR BEST stays the gold band on the ground.
- **What else was blue on the ground, and is not now:** THE DOCKS' gateway (cyan → warm white; by day a wood-brown band) · THE
  AIRFIELD's (blue → lime; an olive band) · **the runway lights + the flight path's tell** (blue → warm white lights, an AMBER racing
  band, by night too; the tarmac a neutral slate) · the road's second lane line (cyan → pale lilac) · the blackout's edge (cold blue →
  cold violet) · the train's windows' light on the ground, the boats' / the tower's / the hangars' light pools (→ warm) · the fish
  market's cobbles + the apron (blue-grey → neutral grey). Fine as they are: the kid's own ring (under him), a ghost's, the cars' bodies.

## THE RAIL SIGNALS FLASH ONLY BEFORE THE TRAIN (H5B's add-on — the owner, Nov 16 9:15 pm; his nephew: "is another one coming?")
**Flashing red = a train is COMING — don't step. It means nothing else.** The signals, the lane's own red flash + the side warning
glow run through the TELL alone (`pulseAt(…).st === 'tell'`); the moment the train's nose enters the lane they go DARK (an unlit dim
lamp) and stay dark through the pass + after it. **Dark = safe.** A next train's tell soon after flashes again — a real warning. THE
RAIL YARD's gantry lamp: red in the tell · dark while the train is here · green when clear. The crossing bell already rang through the
tell alone and now fades out over 0.5 s as the train arrives; the train-pass sound carries the pass. View + sound only: `pulseAt` +
the rules are untouched (REPLAY = LIVE). The graybox the same.

## THE GHOSTS STOP BLOCKING YOU (H5B's add-on — the owner, Nov 16 9:20 pm: the start pile-up of a match; "your fix to the ghost problem is perfect" — the ghosts stay)
Every kid starts on one square: the names stacked on yours, the first road hidden, players squished in the first seconds. VIEW ONLY
(`night.js` · `view.js` · `ghosts.js#tagGroups` — no rule knows it; day + night the same).
- **NEAR YOU = FAINT:** a ghost within ≈ 1.5 cells of the kid on screen (fully faint at 1.5, itself again from 2) fades to a faint
  see-through outline (≈ 15 % — an instance's own alpha, packed with its light: `aKid.x` = lit + 8 × the fade's 16 steps,
  `night-fx.js#paintMaterial` `fade`) and its ring dims; it eases both ways (≈ 150 ms — never a pop). **YOUR OWN KID ALWAYS DRAWS ON
  TOP OF EVERY GHOST:** he marks his pixels in the stencil, a ghost never draws on them.
- **THE NAMES AT THE START** (`.jw-roster`): through the 3 · 2 · 1 the players' names show ONCE, lined up (you first — the tags' own
  look, no pill); no ghost carries a tag on the start square; gone at GO. From GO a ghost's tag shows only once it is away from you.
- **STACKED TAGS MERGE** (`ghosts.js#tagGroups` — PURE, the same on every phone): ghosts on the same / touching squares (a chain
  counts) share ONE tag — the leader's name (the farthest along) + "+N": "MIKIE +2" — never a pile. A tag's words change only when
  they differ.
- Checks: `tests/jaywalk-day.test.mjs` + `e2e-jaywalk-match.mjs` (the names lined up at the count; 60 samples on three phones; a ghost
  away carries its own name; a real merged tag) + the lab's `--h5b=addons` shots (`ghostsAt` — ghosts staged at offsets from the kid).

## NO WEAK POINTS (H5C — the owner, playing H5B: "I don't want any weak points"; every change a VIEW — the rules, the course, `pulseAt` + the proof untouched)
THE QUALITY BAR: extremely premium; nothing flat, cheap, clip-art or placeholder-looking; everything readable on an iPhone held upright
at real size (390 × 844), by DAY and by NIGHT; 60 fps measured. Where an older section above describes what H5C replaced, THIS section wins.

### THE PAINTED SKYLINES (`js/games/jaywalk/skyline.js` — PURE; `night.js#skyFollow` / `skyShow`; `tests/jaywalk-skyline.test.mjs`)
- **BY DAY the band shows a PAINTED picture per area** (Grok — `assets/jaywalk/skyline-day-<id>.webp`, ids = `areas.js#LOOKS`: docks ·
  fish · yard · bridge · downtown · canal · lighthouse · airfield; 107–134 KB each): the SAME picture as `skyline-day.webp` with that
  area's landmark painted in (the same 1280 × 432 crop; horizon + sea identical: a cross-fade moves nothing but the landmark). The
  opening (lanes 0–49) keeps `skyline-day.webp`; the loop (lane 450 +) repeats the 8. **The drawn day landmarks are RETIRED**
  (`skymarks.js` draws nothing by day and is not even loaded by day: it left the cartridge's eager graph — `lazyImport` when a night
  band first needs it). **BY NIGHT nothing changed:** the one night picture + the neon-outline landmarks.
- **THE CROSS-FADE:** the band has TWO picture layers (`.jw-sky-pic`): UNDER is always solid, OVER's opacity alone moves (`SKY_FADE_MS`
  2 s, ease-in-out; at once with reduce motion / on the first picture / on a look change). A picture is only ever set on the layer
  that is hidden — the band is never see-through, a visible layer never swaps.
- **ONLY THE CURRENT + THE NEXT are ever held** (`skyPlan(lane, look)` → `{ now, next, bias }`; `skyHeld`): the next area's picture is
  fetched quietly once the kid is within `SKY_AHEAD` (14) lanes of its gate (an `Image`, decoded off the frame); everything else is
  dropped. Never all 8, nothing at the boot, nothing in the cartridge's preload. A run to lane 455 fetches 9 pictures, one by one.
- **WHERE THE BAND RESTS (`SKY_BIAS`):** a phone shows the middle ≈ 65 % of the picture and the landmarks are painted in its left / right
  third (the middle top is the lane count's) — so the band rests off-centre while the kid is in the area (docks + 12 % · fish + 6 · yard
  + 13 · bridge − 13 · downtown + 2 · canal + 7 · lighthouse − 13.5 · airfield + 11; eased in with the cross-fade), the slide with the
  kid's column rides on top, and the sum is kept inside the picture's own room on that screen (`skyRoom(w, h)` — a wide stage has
  none: the picture stays centred). *Named call: the prompt said "the same crop / slide as skyline-day.webp" — the crop IS the same;
  without the rest offset five of the eight landmarks were half or wholly off a phone's screen.*

### THE FAR EDGE (the owner: "a real far edge" — `night.js#depth` + `.jw-seawall` / `.jw-farhaze`, css/jaywalk.css)
- **The band is SOLID down to its foot** (H2's fade-out mask is gone) and **the course ends at a SEA WALL** against the skyline's sea:
  stone blocks under a cap — by day the cap sunlit, by night dark stone with five dim warm lamps; its joints slide a touch more than
  the picture (it is nearer). Nothing half-see-through ever floats over the backdrop.
- **THE FOG IS FULL EXACTLY AT THE WALL's FOOT:** `footAt` = the depth from the lens of the ground point `FOOT_AT` (25 %) down the
  screen, measured off the camera itself (any zoom, any screen shape); the fog's far = that, its near `HAZE_LANES` (4.4) rig-lanes
  nearer — the last ≈ 4 lanes fade, the play ahead stays clear (H5B: the fog ran to 35 k — a third fogged at the band's foot, cars
  ghosting over the picture's sea). `reveal` (H3's start) still pulls both in. `.jw-farhaze` (a short gradient of the same colour
  under the wall) seals the join.
- **THE FOG FOLLOWS THE GROUND** (`night-fx.js#fogUp` / `FOG_UP` — the review: trucks + trees hung as pale ghosts over a lane that
  had already faded): three's fog reads a fragment's own depth, and from this camera a thing's top is nearer than the ground it
  stands on — every lit material adds its height back (`uFogUp` = −the camera's forward y, set every frame), so a thing fades
  exactly as its lane does. The glow kinds the same.
- **ONE DAY HAZE:** `DAY_FOG_HEX` `#c6e6f7` — a pale mist, the day picture's own air just over its horizon (`#b8e8fb`): the sea above
  the wall is blue, the ground under it is not (the review: with a sea-blue haze the wall hovered) = the far haze = the stage's
  background (the test holds the three together). The day wall: two courses of staggered blocks + its shadow on the ground. Night: `FOG_HEX` as before (the night picture's water foot).
- **THE UFO's disc** flies above the haze (three's fog never takes it): it fades by where its beam stands on the ground (`hazeAt`) —
  never a pale disc on the backdrop. Still a PLACEHOLDER (H6).

### THE FOG BANK + THE BLACKOUT's EDGE (the owner: "never a flat slab")
- **BY DAY:** the bank's edge is measured PER PIXEL off the wall itself (`uWall` in the ground shader — no longer lane by lane): soft +
  ragged (two drifting noise fields), **the lane still seen THROUGH its first metre**, solid two lanes in, **a cool shadow on the
  ground in front of it**. On it, `FOG_LAYERS`: six layers of billows (three mottle the body — solid, two-toned: never a flat fill
  behind the front (the review) — three roll on its face — each its own
  speed + way; each puff its own size + height: a ragged top; lit on top, cool underneath), thin WISPS drifting ahead. The body (the
  curtain) starts under the back billows — its own edge is never seen. The lowest tier lays one layer less. The same wall, the same
  timing, the same rules (`run.wall`).
- **BY NIGHT:** the lights still die lane by lane (the flicker), but **the dark's EDGE is per pixel off the wall too** (the review: "a
  ruler-straight cut to black") — ragged, soft, the cold violet glow riding its lip in the ground shader; soft dark tongues drift
  ahead of it; the black curtain starts where the ground is already fully dark (its straight front is never seen).

### THE DAY GROUND + THE SHADOWS
- **THINGS SIT ON THE GROUND:** by day every shadow is TWO (`K.shadow.put`'s day wrap): a tight CONTACT shadow straight under the thing
  + THE SUN's shadow, the same shape carried along `SUN` by the thing's height (a shadow's `sy` — a flat quad has none of its own — is
  how tall the thing is: a tree's reaches further than a car's), a touch bigger + softer; cool (`#081229`-ish), never plain black.
  The cheap way (shape quads) — no shadow map. A warmer sun key (now from the left: the shadows fall to the RIGHT, where the camera
  sees them) + a cooler sky fill.
- **THE GRASS** (night + day): soft natural variation — larger light / dark patches running on across the lanes, faint MOWN STRIPES a
  column wide (they also show the columns), a blade grain, small tufts' flecks. **Never a checkerboard.** · **the asphalt** a fine
  grain + a faint wear · **THE RAIL YARD's gravel + the ballast** finer + calmer by day · **THE LIGHTHOUSE's sand** smooth (dunes, wind
  ripples, a fine grain) with small SCRUB tufts + a pebble here and there · **THE FISH MARKET's cobbles** warm SANDSTONE by day, warm
  dark stone by night (no cold sheen: never water) · **THE DOCKS' planks** differ a little, never a patchwork.
- **THE DRUMS:** 75 % of their size; red · orange · yellow from the seed (`night.js#DRUM_HEX` on a white-built drum), hoops, a dark lid
  + its bung, a little wear (a rust bloom, a scuff). **BLUE ON THE GROUND = WATER holds for props too.**
- *DOWNTOWN's edge shops: H6B — Kenney's storefronts ("THE FINAL POLISH").*

### THE GATE'S NAME ON ITS ARCH
The name lay on the gate's lane — under the kid the moment he stood there. Now **a sign stands up on the gate's crossbar** (`GATE` planes:
5.9 × 1.01 cells at 3.42 up, facing the camera; its board has an ARCHED top; the crossbar is a real BEAM that spans the screen under
it — the review: the first sign floated): **by night** neon letters + a neon tube round the arch on a SOLID dark board
(alpha-blended) + a tube along the beam; **by day** a painted board in the area's colour, a white trim, white letters with a dark
edge, on a striped beam whose shadow lies across the lane. Read as he comes up to the gate (from
≈ 8 lanes) AND while he stands in its lane — it is three lanes up the screen from him (the lab check measures the sign's foot against
his cap on every gate, both looks); **it fades as he hops on through** (it never hangs over the lanes he plays next). The old arc of
light / painted arch stripes and the name on the lane are gone.

### THE LINES — ONE FORM
**YOUR BEST = a GOLD TAPE between two glowing posts** — the friend's PINK tape's form (the gold band lying on the lane is gone); **on
water the posts are BUOYS** (red + white, they bob, a ripple round each) for both. **A line's WORDS ARE ALWAYS READABLE:** drawn above
the logs, the cars + the water (no depth test, drawn last) — and never over your own kid (the stencil: the ghosts' rule); **CENTRED
on the screen** (their plane rides the camera's own column, 7 cells wide — the review: "OUR BEST · 10", cut by the edge) with **a dark
edge + halo all round in both looks** (alpha-blended: gold on glowing water no longer washes out). By day the tape has a dark edge
under it. The posts stand on the play's edge lines (they may cover no cell): off a centred screen at ZOOM 8. Its burst,
its sound, the counter are unchanged.

### THE TAIL LIGHTS — the finish
The pool **starts AT the lamps** (it begins 0.2 under the bumper: no gap behind any vehicle, either way it drives), **a short OVAL
stretching backward** (the glow shader's shape −1: hot + warm at the lamps, fading out behind; `TAIL_LEN` 1.2) + a small warmer core
right at the lamps; the lamps a hair bigger (0.34). The train's the same. By day: no glow.

### THE SOUNDS (set B)
`train-bell.wav` = the North American crossing bell (Brylon Terry, SoundBible — **CC BY 3.0**; a seamless 127,540-sample loop; ONE
take: the old A + B are gone; `JW_SFX_REV` 2) · **`train-horn`** — NEW: ONE blast a train, the moment its WARNING STARTS (`cues.js`:
a near rail lane's tell begins — a tell he walks into half-way through is not a start), from its side, ≤ 1 at once, fades 0.5 s
(AMBIOSIS, Freesound 316689 — **CC BY 4.0**) · **`area-arrive`** = "achievement-sparkle" (SkySpeira, CC0) replaces the landmark ping
(its file + row gone); the friend line's quiet chime is the same sound at 0.4 / rate 1.3. The exact credit lines are in
`audio/jaywalk/CREDITS.md` (the CC BY ones are REQUIRED — H6's credits screen). *Heard by nobody in this pass: `area-arrive` and
`new-best` (take A) are the same source recording — if they sound the same to the owner, the new-best's B take is the quick fix.*

### THE FRESH-EYES REVIEW (every pass from now on — before its final run)
The full shot set at 390 × 844 @3, DAY + NIGHT (`jaywalk-lab.mjs --h5c` + the 4-phone match + the solo game's own shots), then ONE
reviewer with a fresh context (read-only; it built nothing) is given THE QUALITY BAR, what the pass set out to fix and the shots, and
lists every weak point, ranked, with the file name. Its report is kept verbatim in the pass log; every real one is fixed or listed
under OPEN FOR BEN with why it waits.

## THE BIG MOMENTS (H6A — the owner, Nov 16–17: the game's three showpieces; `js/games/jaywalk/flyers.js` — a VIEW + its sounds; the rules, the course, `pulseAt` · `ufoX / ufoY` · `MODES.cap` + the proof untouched)
**ONE module, fetched ON DEMAND** (`night.js#flyGet` → `lazyImport(import('./flyers.js'))` — out of the cartridge's eager graph: THE PER-GAME
BUDGET had 4 KB spare; the placeholders it replaces — the dart, the discs, the green lift — left `night.js` + `models.js`): the module when
a flight path / a UFO's zone first comes into the scene's window (≥ 15 lanes before the kid reaches it) or a CAPPED run starts; each
MODEL when its own moment nears (`need()`), its programs + buffers made in the scene's warm frame (`rewarm` — never in the moment); each
SOUND's bytes with it. Until the module has landed the scene draws the fair minimum (the jet's shadow; the UFO's ring — the rules'
warning). `night.js` calls it a frame: `begin` → `jet` (once a band) · `ufo` (once a UFO) → `abduct` / `lifted` + `lift` (the kids) →
`ship` → `end`; what the kid's own moment lays is queued (`pend`) until the scene has reset its instanced kinds for the frame.
**ITS NUMBERS = `FLY`** (the tests read them). Night + day are ONE code path (the look only picks colours; by day the lights are paint).

**THE FRESH-EYES FIX ROUND (the same pass — where a line below differs, THIS is how it shipped; the pass log has the reviewer's report +
each item):** THE GLINT sits at the camera's own edge on the band's row (`edgeX`), a 7-cell star + a blue heart in an orange rim, on a
dark halo by day, growing from 45 % · THE PASS: the runway's own lights no longer blaze through it and the band's flash is short + capped
(8 ticks — the jet stays a dark silhouette), the burners are flame CONES with a white-hot dart, ONE thick shock ring (a dark trailing
edge by day), the contrails a soft widening trail (34 ticks), the jet's shadow by day a hard dark shape on the band · THE HIT is SEEN
(`blast`: a flash, a thick ring bursting from the kid, a streak along his throw, sparks) · THE UFO's ring is a thick yellow-green
(`GREEN` — never the mint of a kid's own ring; opaque paint with a white inner edge by day), it dims while its saucer is away and
comes back with it; the saucer's rim lights are bigger, by day it is full metal with a sun star · THE ABDUCTION's beam is SEE-THROUGH
in its heart (its light is in its edge, its foot, its ring), the saucer CLIMBS as it locks on (a long beam), a shock ring as the beam
lands, the kid lit in a thick halo of his colour with a trail · THE MOTHERSHIP's WARNING: a hard-edged shadow that comes in from the
far side and crosses the road lane after lane, the skyline dark from its first seconds, the timer on a dark band · THE ARRIVAL: the
ship baked ONCE A LOOK (panel seams + spokes, six rings of lights, a lit rim, a bigger lens; a sunlit rim by day), the lane count
kept over it, the beam = a cone + its pool + ring with **everything OUTSIDE it dark** (`.jw-ship-shade` — no whitening wash), every
kid BRIGHT in a thick halo of their own colour + a trail, drawn to the beam's middle · the scene is held 4.2 s on the lift
(`holdMs`); the gold finish says its lanes once, under a jewelled crown · NO HITCH: a model's program is compiled off the frame
(`compileAsync`), the ship's sprite is painted once, unseen, right after its bake.

### THE BLACKBIRD (every number a pure function of `u`, the ticks into the flight path's lap — a held / replayed tick draws the same frame)
- **THE TELL stays** (the runway lights racing + the lane's chevrons — H2 / H5B) **+ a radio crackle** as it starts. **THE GLINT — its LAST
  0.5 s** (`FLY.glint` 30 ticks, INSIDE the tell: the ≥ 1.5 s warning is the rules', never shortened — `tests/jaywalk-h6a.test.mjs`): at
  the screen edge it comes from (the camera's own edge, on the band's row) a four-point star that grows + a blue afterburner flare, its
  white-hot core; by day on a dark halo (it reads in sunlight).
- **THE PASS:** the real SR-71 (`blackbird.glb`, 3.7 cells long — the rules' body is 3 —, 1.15 high, rolled a little toward the lens so
  its planform reads; drawn 16 ticks before + after its pass: it crosses the 9 columns in 0.15 s) · **two blue-white AFTERBURNERS** (a
  tapered flame from each nozzle, white-hot inside, three shock diamonds, the nozzle's ring) · **the vapor ring** it punches through ·
  **THE SHOCKWAVE RING** on the ground (born 6 ticks in — as it crosses the middle —, two rings spreading for 40 ticks) · **a white flash
  on the band** (10 ticks) · **two contrails** fading along the band (46 ticks) · **a tiny shake** (`FLY.shake` 0.075 cells ≈ 3.7 px at
  ZOOM 8 on a 390 pt phone, 12 ticks = 200 ms; none with reduce motion). NIGHT: a dark silhouette over the lit runway, its burners +
  rings blazing (they are on the bloom's layer). DAY: a black jet, its shadow sweeping the lanes, **heat shimmer** behind the burners.
- **THE SOUNDS** (this phone's own living kid, the band within 10 lanes): `radio-static_1` + `jet-scream` at the tell's start (the
  scream started so its peak lands on the pass), `sonic-boom` on the pass.
- **A HIT = THE SHOCKWAVE BLASTS HIM** (`night.js`): thrown up + along + toward the lens, tumbling on two axes, a white ring where he
  stood ("BUZZED BY THE BLACKBIRD"); a ghost the same (smaller); the scene is held ≈ 1.1 s before the end screen (`holdMs`).

### THE UFO
- **THE SAUCER** (`ufo.glb`, 3 cells across) drifts on the rules' path, **HIGH** (`FLY.ufoY` 4.7) — it spins, bobs, its ten rim lights
  chase — and goes **SEE-THROUGH while it would cover the kid on the screen** (it never hides him); chrome in the sun by day, cool steel
  by night; it fades into the far haze by where its ring stands (never a pale disc on the backdrop — H5C's rule).
- **ITS BEAM CIRCLE ON THE GROUND = a bright GREEN ring (never blue — blue on the ground = water), pulsing, ALWAYS where the rules
  have it** (+ a second ring closing in on its middle, a soft green pool); by day green paint on a dark ring. A faint beam joins the
  saucer to it (thin by night; a pale-green column + drifting motes by day). **A soft hum rises as it nears** (`ufo-hum`, a loop whose
  level follows the distance — a BED: it stops at once when the page is left).
- **THE ABDUCTION** (`FLY.abductMs` 2000 — the rules' hit tick unchanged; `abductAt(e)` is its own clock): the kid **freezes mid-step**
  (0–380 ms) → **the circle flares** (150 ms) → **a bright beam slams down** (160–270 ms) while the saucer LOCKS ON over him → he
  **floats up spinning + shrinking** into it, a halo of his colour round him (380–1530 ms) → **its lights pulse** (1250–1700) → **it
  zips off** (1650–1910) → **the beam snaps out** (1850–1980) → **ABDUCTED**. `ufo-beam-on` + `ufo-lift` as it locks on, `ufo-depart` +
  `ufo-beam-off` as it goes (no hit thud — `sfx.js`). The rules' ring stays where the rules have it (dimmed) through it; the saucer
  comes back over it afterwards. A ghost taken = the same, smaller (`lift`). The end screen waits ≈ 2.25 s (`holdMs`).

### THE MOTHERSHIP = A FINISH LINE, NOT A DEATH (a capped run: a MATCH at 6:00 · the daily at 5:00, built later · solo: never)
- **THE WARNING (the cap − 10 s, `FLY.warn`):** a red, pulsing **"THE MOTHERSHIP · 0:10"** under the lane count (`.jw-ship-t` — it
  counts down; still with reduce motion) · **a giant soft shadow slides down the road** toward him · **the skyline darkens**
  (`.jw-ship-dim`) · **the deep hum + a rumble build** (the UFO's hum at half speed + two seconds of brown noise under an 85 Hz
  low-pass, made once — both BEDS) · in its last 3 s the ship's lit rim peeks over the top of the screen.
- **THE ARRIVAL (the cap):** the colossal ship comes down over the top third in 0.7 s — **the model BAKED ONCE into a sprite**
  (`bakeShip`: `mothership.glb` rendered through the scene's own renderer into a render target → a 1408 × 768 2D canvas, at the run's
  START — the count — never at the warning; the skyline band is DOM over the 3D canvas, so the ship must stand over it: `.jw-ship`,
  172 % of the screen's width) — its underside's three rings of warm lights + its white-gold lens are drawn on the bake (projected
  through the bake's own camera), a half-size canvas of the brightest shimmers over it (opacity only). **ONE huge white-gold beam**
  over the whole road (a cone from the ship, its pool + ring on the lanes, motes rising, a short white-gold wash — `.jw-ship-wash`).
  **Every kid still in lifts** — yours opaque, the ghosts as ghosts — **each in a halo of their own colour**, rising into the ship
  (`lifted`: 2.6 s). `ufo-beam-on` + `ufo-lift`, pitched down.
- **THE FINISH:** over the scene a gold card — THE FINISH LINE · **YOU MADE IT TO THE MOTHERSHIP** · n LANES (`.jw-outcard.is-ship`,
  once the arrival has been seen); the end screen (the console's podium, 3.4 s after the cap at the earliest — the host's step ends
  the match 4 s after it) = **gold "YOU MADE IT TO THE MOTHERSHIP" + the lanes big + a crown and its gold burst** (`.jw-fin.is-ship` —
  transform + opacity) + the place + NEW BEST; **the farthest still wins the match**; the list reads **MADE IT TO THE MOTHERSHIP**
  beside a lifted player; players out earlier keep their own cause line. **Never "TAKEN" in anything a player reads**
  (`causes.js#SHIP_LINE`; the internal cause key stays `taken`).
- **THE MODEL, JUDGED LIT AT PHONE SIZE:** Poly by Google's saucer holds up as the ship (a dark steel disc, its rings + lens lit from
  below) — the fallback (the UFO scaled huge) was not needed.

### THE CARDS (H6A — the four achievements, game `jaywalk`; `api/_lib/catalog.js` + docs/progression.md)
| achievement → card | the flag | how |
| --- | --- | --- |
| SONIC BOOM → `card-sonicboom` (rare) | `jaywalk-boom` | standing ON a flight-path lane the tick its tell begins, off the band for the whole pass, never hit by it |
| CLOSE ENCOUNTER → `card-closeencounter` (rare) | `jaywalk-ufo` | a UFO's beam swept the cell beside you and THAT UFO never took you |
| RIGHT OF WAY → `card-rightofway` (legendary) | `jaywalk-airfield` | lane 400 in ONE counted run — **solo OR match** |
| BEAM ME UP → `card-beammeup` (epic — NEW) | `jaywalk-mothership` | still in when THE MOTHERSHIP arrives — a counted match / daily; never solo (it has none) |
- **THE FLAGS COME FROM THE SERVER's OWN REPLAY ALONE:** `engine.js#resultOf().feats` → THE JUDGE → the result row's `f`
  (`logic.js#featsOf` — "boom ufo airfield mothership"; the host's row and the server's are the same row) →
  `core/match-report.js#jaywalkExtra` reads `f` **only from a match the server built itself (`sv`)** — never a room's own results, never
  an UNPROVEN match (no GO = no match at all), never a refused log; `mothership` is dropped from a solo row. → the award engine
  (idempotent: each once). Revealed by the console's CARD REVEAL on the podium (three achievements a match at most — a run that earns
  all four shows the fourth's card among its UNLOCKED rows; **a card's tile shows its PALETTE until the owner APPROVES its art in THE
  LAB** — the site's rule).
- **THE ART:** `card-beammeup` = Grok's `mothership.png` (the beam breathes, gold motes rise past the kid, a bead chases round the
  belly's lights — `js/fx/jw-cards.js#beamMeUp`, `jw-specs.js#liftAt`); **RIGHT OF WAY's picture REDONE** (Grok, Nov 16 — the game's
  real kid: the forward cap, the pink T-shirt; its hop, its runway lights + its crop re-measured; v2 in the lab; the hoodie picture
  kept as `art/jaywalk-cards/src/right-of-way-old.png`). H6B re-copies both if Grok re-delivers (`scripts/build-jaywalk-cards.mjs`).

### YOUR BEST = YOUR FARTHEST COUNTED RUN ANYWHERE (H6A — the owner: his 212-lane match counted for XP but not for his best)
- A counted **MATCH** run's lanes raise the SAME best a solo run raises — the board keeps its id (**`jaywalk-solo`**: no data moved;
  everything a player reads calls it YOUR BEST): `jaywalkExtra` puts the lanes on the match row's `rec`. The solo end screen, THE
  LINES (the gold tape — in a match too) and YOUR TABLE all read that board, as before. **NEW BEST shows on a MATCH end screen too**
  (`victory.js#matchScene` — the server's own answer for that match; + the console's PERSONAL BEST row + its XP). The daily keeps its
  own day board. Unproven runs never count.
- **THE CATCH-UP — NOT POSSIBLE, AND NOT BUILT:** the server never kept a counted match's per-player lanes — `results/{CODE}_{matchId}`
  holds each player's XP outcome only (`o/{pid}`: rank, win, xp, pbs …), `pstats/{pid}/m/{key}` a timestamp, and the lanes themselves
  lived in the room's proof nodes (`rooms/{CODE}/jw/…`), which leave with the room when it closes. So a match played before H6A (the
  owner's 212) cannot be credited from data — no number is invented (OPEN FOR BEN, the pass log). From H6A on nothing needs healing:
  the report itself raises the best.

## THE FINAL POLISH (H6B — the owner, Nov 17: the last pass before the go-live review; every change a VIEW or a SOUND — the rules, the course, the proof, the feats untouched: REPLAY = LIVE)
Where an older section above describes what H6B replaced (the drawn night landmarks, the sign on the gate's crossbar, the see-through
saucer, the two tail lamps, new-best's two takes), THIS section wins. The decisions: `docs/games/plan.md` "JAYWALK … DECIDED, H6B".

### THE PAINTED NIGHT SKYLINES + THE LOOK SWITCH (`skyline.js` · `night.js#skyShow` / `skyLife` · `tests/jaywalk-skyline.test.mjs`)
- **BY NIGHT the band shows a PAINTED picture per area too** (Grok — `assets/jaywalk/skyline-night-<id>.webp`, 65–79 KB each: skyline-night
  with that area's landmark painted in, lit; pixel-identical outside the landmark). **The same machinery as the day set:** the opening
  (lanes 0–49) keeps `skyline-night.webp`, only the current + the next are ever held, the next is fetched 14 lanes before its gate, a
  2 s cross-fade at the gate, the loop repeats. **The drawn night landmarks are RETIRED** — `skymarks.js`, its canvas, its css and the
  band's colour wash (`.jw-sky-tint`) are gone.
- **THE NIGHT CROP IS 84 ROWS HIGHER** (rows 204–636 of the 720: `scripts/build-jaywalk-assets.py#NIGHT_TOP`; H2's crop — the lower
  60 % — cut the lighthouse's lamp, downtown's spires and the control tower off). The band is now: the stars, the lane count in the
  sky, the city low, a strip of water, the sea wall. *Named call: the prompt said "the same treatment as the day set"; the day crop's
  rows would have beheaded five landmarks.* The poster keeps the rows it had (`poster.js`).
- **NIGHT'S OWN REST OFFSET** (`SKY_BIAS_NIGHT`, % of the picture's width, measured off the night pictures: docks + 8 · fish + 15 ·
  yard + 14 · bridge − 14 · downtown + 3.5 · canal + 12 · lighthouse − 17 · airfield + 9): every landmark's tall part is on a 390 pt
  screen (the test holds Grok's own columns against the phone's window) and beside the lane count — the docks' two cranes are wider
  than the room either side of a 3-digit count (the left crane's boom stands behind its last digit in the loop's laps).
- **NOTHING BLINKS OR FLICKERS ON A LANDMARK** (`SKY_OFF`): the 8 red aviation lights + the 5 flickering windows are one layer
  (`.jw-sky-life`); the ones a landmark stands on / in front of are `hidden` while its picture is on the band — measured by the
  builder (a light whose 19 × 19 px surround the landmark changed; a window any of whose pixels it changed): docks lights 1 · 3 · 4 · 5,
  yard 1 · 3 · 4 · 6, downtown 1–4, canal 1–6, airfield 1; the right-side landmarks windows 2 · 4, the bridge 0 · 1 · 3, the lighthouse
  0 · 3. Through a gate's cross-fade BOTH pictures' are off.
- **THE DAY BAND's REST, re-tuned** (`SKY_BIAS` — the first review: the cranes, the fish hall, the rail yard + downtown's towers
  were cut by the screen's right edge): docks + 16 · fish + 11 · yard + 17 · downtown + 5 · lighthouse − 16.5 (the rest as H5C left them).
- **THE LOOK SWITCH** (AUTO at sunrise / sunset, or the owner's toggle): the day + night pictures have different horizons, so **the
  whole band CROSS-FADES over 1.5 s** (`SKY_LOOK_MS`: the picture — the same two layers; the sea wall's stone — the day's stone lies
  over the night's, its opacity alone moves; the wall's lamps + the night's life fade with it; the rest offset eases). Never a jump;
  the sea wall stays at the band's foot in both. A cross-fade still running is waited out (a visible layer's picture never changes);
  at once with reduce motion. (The 3D scene itself still switches at once — H5B. *The FIRST look switch of a session was ONE
  ≈ 130 ms frame — FOUND + fixed by the go-live review: the sea wall's day stone, painted for the first time ("THE FIRST LOOK
  SWITCH", below): 33 ms now.*)

### THE GATE SIGN — ONLY ON THE APPROACH (`night.js` `GATE_GONE` 3 · `GATE_FADE` 1.5 · `GATE_SEEN` 10; css `.jw-gate`)
The sign stood on the gate's crossbar and hung over the lanes he was about to play. Now **the area's arched name board hangs under
the sea wall** — its own canvas over the scene (the same painted board: neon tubes on a solid dark board by night, a painted board by
day), crisp over the far haze, where only the fogged far lanes are — **up from 10 lanes out, whole to 4.5, fading, FULLY GONE 3 lanes
from the gate** (and at it, and through it); the gate's own posts come out of the haze under it. **THE GATE HAS NO CROSSBAR
any more** (the first review: the raised bar hid the traffic in the lane behind it — a red van behind a red stripe): two posts in
the edge columns + a line ON THE GROUND between them (a bold striped painted line by day, a neon line by night) — nothing stands over a lane. *Why not on the gate
itself: 8–10 lanes out the gate is behind the skyline band and in the full haze — a sign there cannot be read; nearer, it covered the
lanes ahead.* The plane in the scene (its mesh, its texture) is gone. The area's name still flashes once in the HUD as he crosses.

### THE MATCH CHIPS — COMPACT (css `.jw-order`)
The live order (top left, under ☰): **a 6 px colour dot + the name short (≈ 6 letters seen — the whole name stays in the row) + the
lanes, 13 px a row** (8 players = 111 px tall, ≤ 86 px wide — a 7-letter name whole; they were 21 px rows in boxes, 46 vw wide) **on a soft veil** that thins
out to the right — no box, no corners: the bridge + the lighthouse painted on the band's left read through and past it. You = a bar
of your colour down the row's edge; the one you watch = a white bar; OUT = a cross + the name struck through (never colour alone).
BY DAY the veil is faint (the first review: it sat dark on the painted bridge / lighthouse) and the letters carry the day's own ink;
the day lighthouse rests a touch further right (`SKY_BIAS.lighthouse` − 16.5) — its tower stands clear of the chips. (The day BRIDGE
spans the band's whole left half: it stands behind the column, through the faint veil — OPEN FOR BEN in the pass log.)

### THE LAB LINK — `jaywalk-lab.html?lane=N` (+ the look / zoom prefs)
**A LOOK CHECK from lane N** (the owner opens any area on his phone): the kid stands on the grass lane nearest N (the one before it
first — `?lane=395` = 5 lanes before THE AIRFIELD's gate), the blackout held behind him, the page says LOOK CHECK · LANE n. **WARPED
from its first frame: it never counts, is never replayed (its end says WARPED — never REPLAY = LIVE), nothing is sent** (the lab makes
zero server calls). ONE COUNTDOWN: the lab's small line is the mode's quiet clock (MATCH · 5:42) and is gone for the warning — the
big red THE MOTHERSHIP · 0:10 is the only one.

### THE MOMENTS' FINISH (`flyers.js` — still on demand; where "THE BIG MOMENTS" above differs, this wins)
- **THE UFO = A SOLID SAUCER** — no transparency anywhere (it no longer goes see-through over the kid): **chrome catching the sun by
  day, dark metal under bright rim lights by night**, a glowing hatch under its belly; **SMALLER + a little HIGHER** (2.3 cells across
  at 5.0 — was 3.0 at 4.7; any higher and the skyline band hides it: it stands over the lanes ≈ 5 ahead of its ring, never on a car /
  a log / a train he must read now); far off it takes the haze's own colour (solid to the last — H5C's rule), and **while its ring is
  far up the screen it hovers LOWER** (its top never above 31 % of the screen, never under 2.6 high — the first review: its top half
  sat in the haze under the wall, a dull smudge); by day its rim lights sit ON its upper rim, bigger + saturated (green / warm white),
  a hard highlight band runs along its near rim (chrome, not a pot lid) and its beam is a dense saturated green (pale green vanished
  over tan paving; no edge lines). Its ground ring fades with the far haze. **ITS BEAM IS STRONG**
  (a glowing green column by night; bright pale green between two darker edge lines by day; motes in both) **and LIGHTS what drives
  through it** (a green wash laid over the cars in the ring). **THE ABDUCTION: the kid goes up INTO it** — its near rim lifts, the
  hatch opens wide, he rises into the hull (solid: it closes over him — never left under its rim), the hatch shuts, it zips off SMALL
  + far and comes back down over its ring. **On the abducted player's OWN phone the world dims round the beam** for the ≈ 2 s
  (`.jw-ufo-shade`: its clear heart set once on the beam, then opacity only).
- **THE BLACKBIRD ≈ 1.3× bigger** (4.8 cells — the rules' body stays 3) **with BLAZING AFTERBURNERS = SOLID FLAME CONES**: one
  opaque, unlit, tapered cone a nozzle (white-hot at the nozzle → blue → orange → a pink tip; 3.3 cells, flickering in length; on
  the bloom's layer: it glows by night) — the same fire in both looks, in front of everything on the ground; behind it a faint
  long pink tail + a soft warm glow, ONE hot core a nozzle, heat shimmer by day. *(Two tries before it: additive ribbons — the
  first review: hard wedges + "beads on a string"; softened — the second review: a white smear lost in the ring by night,
  see-through stripes by day. A glow cannot be opaque: fire over a lit runway has to be geometry.)* The vapor ring round the jet
  is GONE (it crossed the fuselage: the airframe looked see-through); the ground's shock ring stays (half strength by night); by
  night the airframe carries a cool light of its own; its day shadow is soft + cool.
- **THE MOTHERSHIP:** once it arrives **the traffic under it SLOWS TO A STOP** (the scene's own tick eases out past the cap —
  `night.js`: a view; the run is over) · **every kid flies INTO its port** (the ship is a sprite over the canvas: from its rim on each
  kid is a small light of their colour (a dark ring behind it) that flies STRAIGHT from where he went behind the rim to the lens
  and goes out there — the lifted ghosts rise as you do — drawn on ONE small BITMAP canvas inside the ship's own
  sprite: measured, eight elements of their own — and then a default canvas, which the browser moves to the GPU at its first real
  draws — cost one 150 ms frame as the first kid reached the rim) · ONE countdown (its dark band a touch more solid).
- **DOWNTOWN's EDGE SHOPS = Kenney's storefronts** (`shops.js` — fetched ON DEMAND when a shop first comes into the window; City Kit
  (Commercial) 2.1, CC0: building-a · c · d · h → `shop-a … d.glb`, 28–38 KB each, re-packed by `build-jaywalk-assets.py --only=shops`
  — one mesh, the colormap in vertex colours, the window glass marked): fronts toward the camera, 1.6 wide × 0.9 deep (inside their
  lane; **turned half round in the builder: the kit's fronts — the door, the awning, the shop window — face −z, on the lane they
  face the camera**), **a FAT saturated awning block over every shop front** (the one bright accent that says "shop" at phone size),
  walls in a pastel of the sign's colour by day, **lit windows + a fat neon sign + its colour on the pavement by night**, glass + a painted board by day; the code-built box
  until they land. The delivery: `Downloads\grok\jaywalk\models\city\`.
- **THE TAIL LIGHTS (the owner's add-on, Nov 17 6:32 am — "more uniform instead of one light"):** from this camera only the near
  corner lamp showed. Now **ONE thin red LIGHT BAR across the full width of every vehicle's rear** (`night.js#tailBar`: the car, the
  van, the box truck, the train's tail — evenly lit end to end; a hot core + a soft halo by night: it catches the bloom) **+ ONE oval
  glow on the road CENTRED behind it, as wide as the vehicle**, starting at the bar. The same either way it drives. By day the bar
  is just red on the body, no glow. (By day a truck is lit a touch under — its white box blew out to a flat slab: its side now
  reads under its top.)

### THE MIX (measured — `tests/integration/jaywalk-mix.mjs "<chromium>" [--md]`; `sounds.js` gains · `flyers.js#MIX` · `flyers.js#DUCK`)
Every JAYWALK cue + the city's flyer sounds, MEASURED in Chromium's own audio engine (an OfflineAudioContext: each file decoded as the
game decodes it, through its gain → THE SOFT LIMITER (the JAYWALK set) → the trim; ITU-R BS.1770 integrated LUFS + the loudest 0.4 s
+ the sample peak at the SFX bus's door; "out" = at the default Effects slider, − 6.2 dB; the music at its default sits at ≈ − 34
LUFS out). **What it found:** the train's bell + horn + the arrival chime (H5C's files, never levelled) came in **10–17 dB hotter**
than everything else — brought down to the rest; the hop + the landing a touch softer (heard hundreds of times a run); the boom a
little under. **No cue clips** (every peak under − 0.3 dBFS; the hottest is the splash at − 3).

| cue | file's own (LUFS · peak dBFS) | gain | into the SFX bus (LUFS · loudest 0.4 s · peak dBFS) | out at the default slider (LUFS) |
| --- | --- | --- | --- | --- |
| hop | -13.5 · -3.3 | 1.25 | -30 · -30 · -14.7 | -36.2 |
| land-wood | -16.8 · -2.6 | 1.4 | -29.3 · -29.3 · -13.2 | -35.5 |
| hit | -18.2 · -2 | 2.1 | -26 · -26 · -10 | -32.2 |
| splash | -24.1 · -2.1 | 2.2 | -22.3 · -22.3 · -3 | -28.5 |
| horn | -23.4 · -13.8 | 0.5 | -27.1 · -25.1 · -18.9 | -33.3 |
| train-bell | -14.3 · -1 | 0.29 | -21 · -20.9 · -10.7 | -27.2 |
| train-horn | -7.3 · -1.3 | 0.23 | -19 · -16.6 · -13 | -25.2 |
| train-pass | -23.4 · -8.5 | 1.2 | -17.9 · -16.2 · -5.9 | -24.1 |
| lights-die | -25.8 · -2.7 | 1.6 | -22.4 · -20.5 · -8.7 | -28.6 |
| area-arrive | -11.2 · -1.2 | 0.36 | -19 · -16.4 · -9 | -25.2 |
| new-best | -23.2 · -4.4 | 1.45 | -17 · -14.4 · -6.7 | -23.2 |
| city · radio-static_1 | -20.3 · -1.9 | 0.34 | -26.7 · -22.3 · -11.3 | -32.9 |
| city · jet-scream | -20.2 · -3.5 | 0.62 | -21.3 · -16.6 · -7.7 | -27.5 |
| city · sonic-boom | -22.1 · -1.5 | 0.8 | -21.1 · -14.6 · -3.4 | -27.3 |
| city · ufo-hum | -24.5 · -9.1 | 0.3 | -33.4 · -31.6 · -23.6 | -39.6 |
| city · ufo-beam-on | -20.3 · -5.1 | 0.6 | -21 · -19.1 · -13 | -27.2 |
| city · ufo-lift | -20.4 · -5.8 | 0.5 | -21.3 · -18.7 · -11.8 | -27.5 |
| city · ufo-depart | -20.3 · -5.1 | 0.6 | -21.2 · -18.7 · -9.6 | -27.4 |
| city · ufo-beam-off | -20.2 · -7 | 0.46 | -25.6 · -20.9 · -13.7 | -31.8 |
| city · ufo-hum@ship (rate 0.5) | -24.5 · -9.1 | 0.75 | -27 · -25.6 · -17.1 | -33.2 |
| city · ufo-beam-on@ship (rate 0.62) | -20.3 · -5.1 | 0.72 | -20.8 · -16.6 · -11.5 | -27.0 |
| city · ufo-lift@ship (rate 0.75) | -20.4 · -5.8 | 0.6 | -21.2 · -17 · -10.2 | -27.4 |

- **NEW BEST = its B take** ("Fantasy Achievement Unlock Magical Stinger" — TommasoMotteran, Freesound 859080, **CC BY 4.0**): ONE
  take, shipped as `new-best.mp3` (`JW_SFX_REV` 3); the sparkle is THE AREA ARRIVAL's alone (they were the same recording).
- **THE MUSIC DUCKS UNDER THE BIG MOMENTS** (`DUCK` — the share of its level it keeps; `view.js#applyDuck`: ONE duck, the deeper of
  this and the train's 0.72): THE BLACKBIRD's pass 0.45 (from the tell's last second — the scream's peak — to the boom's tail) · THE
  ABDUCTION 0.4 · THE MOTHERSHIP 0.62 through its warning → 0.3 as it arrives, back up 3–4.5 s after. The station follows the look
  (the day deck by day, the evening deck by night — H5B). THE MOTHERSHIP's rumble (generated) peaks at 0.5.
- *Still true: nobody has HEARD the mix on a phone's speaker — the numbers are the engine's; the owner's ear is the last check.*

### THE CREDITS (`js/ui/credits.js` — ☰ → Credits, the site's one Credits sheet: the group **JAYWALK**, 12 lines)
Every line of `audio/jaywalk/CREDITS.md` + `assets/jaywalk/models/CREDITS.md` + the city's sounds its moments play + the art: the five
**CC BY** sound lines exactly as required (new best · the lights die · the crossing bell · the train horn · the train passing's
second take), the CC0 sounds as a courtesy, the Sonniss sounds of the three moments, **the Blackbird (Kiiba, CC BY 4.0) + the two
saucers (Poly by Google, CC BY 3.0)** with their changes, Kenney's + MaverickFX's models, **"Skyline art created with Grok"**, **"Card
art created with Grok"**. A long source address now wraps (`.cr-by` / `.cr-lic` — a required credit was cut off at the sheet's edge).

### THE CARDS — nothing to re-approve
Grok's re-delivered `right-of-way.png` + `mothership.png` (Nov 17 1:58 am) are **byte-identical** to the copies H6A built from (the
same SHA-256); the builder re-run changes no file, no lab version was bumped, and the owner approved both on Nov 17.

### THE END SCREEN's MEMORY (the inbox's 8:50 am add-on — /admin: "PAGE KILLED (likely memory) · game:jaywalk/final · iPhone")
iOS ends a tab that runs out of memory. JAYWALK's end screen was the one moment that held the live 3D scene at the phone's full pixel
ratio + its bloom targets + the run's whole-frame PICTURE at once — and kept drawing 60 frames a second behind a screen that covers it.
**What the page HOLDS is now a measured number with a budget** (`tests/integration/kit/jaywalk-mem.mjs#JW_FINAL_BUDGET_MB` = **20 MB of
pixels**; both end-to-end checks fail past it; `tests/jaywalk-h6b.test.mjs` pins the pieces).

- **THE SCENE RESTS behind the end screen** (`night.js#rest(on)` — the podium AND the local end call `rest(true)`; a new run
  (`view.js#reset`) calls `rest(false)`): two last frames are drawn as a SMALL STILL (pixel ratio 1 — it sits under the end screen's
  veil), then NOTHING is drawn; the bloom's three render targets are disposed (made again by `setTier` on waking — the top tier only);
  only the skyline picture ON SCREEN stays held (never two); the big moments' module lets THE MOTHERSHIP's sprite go (`flyers.js#rest`
  — 6.5 MB of canvases baked at a match's start; kept only while she is up behind the gold finish, baked again at the next count).
  A re-fit or a look switch while resting re-draws the still (two frames) and rests again.
- **THE RUN's PICTURE is ONE canvas of the rows the card uses** (`night.js#grab(width, rows)` → `snap(fn, 1080, 1080)`): 1080 × 1080
  round the kid (the card's frame uses ≈ 780 of the 2,337 rows a phone's frame has at that width) — 4.5 MB, was 9.6. `cv.top` /
  `cv.full` say where the cut began, `view.js#takeShot` re-maps the kid's place into it; the share card is pixel-for-pixel the card
  it was. ONE picture at a time: the next run's replaces it (`shot.js#keepShot` frees the old one). It is KEPT while the end screen
  is up — a second SHARE tap + the no-link fallback draw the card from it (not released after the upload: named in the pass log).
- **What was measured** (`memAt(page)` — counted IN THE PAGE, the same sum in any engine): the 3D canvas's drawing buffer (colour +
  depth) + the bloom's targets + every 2D canvas alive in the document + the kept picture.

| the final screen (390 × 844) | before | after |
| --- | --- | --- |
| a SOLO run's, @3 — runs 1 → 5 in a row | 40 · 40 · 40 · 40 · 40 MB (the 3D buffer 22.6 + bloom 7.1 + the picture 9.6 + the gate sign 0.7) | **7.6 · 7.6 · 7.6 · 7.6 · 7.6 MB** (the still 2.5 + the picture 4.5 + the gate sign 0.7) |
| a 4-phone MATCH's, each phone (the check's phones are @2) | 29.7 – 32 MB (the buffer 10 + bloom 3.1 + the picture 9.6 + the Mothership's sprite 6.5 + the city's backdrop 2.2) | **7.6 – 10 MB** |
| the same at @3 (the buffer + bloom from the solo row) | ≈ 46 – 48 MB | **7.6 – 10 MB** (a resting scene is the same at any pixel ratio) |
| mid-run, for scale (@3) | 30.4 MB | 30.4 MB (the game itself is unchanged) |

**What the number is NOT:** a phone's real memory. No browser reports it; there is no WebKit-on-iOS figure from this machine, and
Chromium's whole-browser working set on Windows (1.7 GB with the city + two phones) did not move visibly either way. Decoded images
(the skyline picture, the card art) and the GPU's textures (the models, the atlas) are not in the sum — the scene's own textures stay
loaded while it rests (PLAY AGAIN must be instant: THE INSTANT AGAIN). **The proof is the owner's /admin: a `killed` row on
`game:jaywalk/final` after this build is the go-live review's to chase** (the next step then: free the kept picture after the upload,
drop the scene's textures while it rests).

## THE GO-LIVE REVIEW (Nov 17 2026 — `docs/games/passes/jaywalk-review.md`; the owner: JAYWALK is FEATURE-COMPLETE after H6B — this pass proves it ready, fixes what isn't, and writes `docs/games/passes/jaywalk-golive-checklist.md`; it does NOT flip `playable`)
Where a section above describes what the review changed (the Blackbird's day tell, the fog's puffs, the count's size, the band's rest
offsets, the first look switch's long frame), THIS section wins. The decisions: `docs/games/plan.md` "JAYWALK … DECIDED, THE GO-LIVE REVIEW".

### THE BLACKBIRD's DAY TELL (`night.js` the runway's lamps · `night-fx.js` the runway's ground · `flyers.js` the edge flare — a VIEW; `tests/jaywalk-day.test.mjs`)
The owner: by day the tell "MUST be clearly readable (fairness)". It was white-hot lamps + a yellow band on a light-grey runway.
- **THE LAMPS:** from the tell's FIRST tick to the pass's end every runway lamp is a **signal lamp on a DARK backing** — red / amber,
  **wig-wagging** off the rules' own tick (`st.left / 10`: 10 ticks a side = 3 a second, never faster; steady under reduce motion);
  the racing head = white-hot amber, bigger, on a bigger backing. Before the tell: the dim lenses in the tarmac, as H5B.
- **THE LANE:** inside the tell's first sixth the WHOLE lane turns to **amber-on-dark hazard chevrons** that march slowly to the
  crossing (`chd`, by `fx`); the racing band is the same chevrons at full contrast (near-black + yellow-white, > 12 : 1). Amber, never
  the rail lane's red; never blue.
- **THE EDGE FLARE** (the tell's last 0.5 s — `FLY.glint` 30, unchanged): a solid dark disc, a solid orange flare, a yellow-hot heart,
  fat white arms — paint that reads in full sun (it was a pale star on a pale lane).
- **The tell's LENGTH is untouched** (the rules' `p.tell`; `tests/jaywalk-sim.test.mjs` "the Blackbird's tell"). The night look is unchanged.

### THE FOG BANK's BANDING — found (`night-fx.js` GLOW shape 10 + the ground · `night.js` the lip)
The "banded streaks" were three hard edges, none of them a gradient's steps:
1. **Every puff was CUT by the ground.** A puff is a camera-facing quad; it leans into the ground plane and the depth test cut it
   along a straight horizontal line, where its glow was still 5–15 % bright. → the glow kinds carry the corner's height over the
   ground (`vY`) and a puff is **shape 10**: the soft round glow FADING OUT into the ground over its last metre, + a ± 0.6 % dither
   (a wide near-white gradient in 8 bits).
2. **The bank's body (the curtain) ended in ONE ruler-straight edge** across the screen, under the billows. → **a LIP** stands on
   that edge: the body's own colour fading up to nothing over 1.8 cells (a 1 × 32 ramp texture — no canvas), by day only.
3. **The ground's mottle met the plain fog in a line** (d = 3.4: 0.93–1.03 × against 0.98 ×). → the mottle fades out before it.
The blackout by night is unchanged. The same wall, timing, rules.

### THE FIRST LOOK SWITCH — 150 ms → 33 ms (found: not the 3D scene)
H6B: "ONE ≈ 130 ms frame, GPU-side". Bisected in the lab under a 4× CPU throttle (hiding one piece at a time): **the sea wall's DAY
stone** — a hard-stop line + two sized `repeating-linear-gradient`s — cost ≈ 120 ms to paint the first time it showed. It is ONE
31 px SVG tile repeated along the wall now (the same two staggered courses + their line). + **THE OTHER LOOK's PREWARM**
(`night.js#warm` → `lookGL`): in the start's hidden warm frame the look the phone is NOT in is set, compiled + drawn once and put
back — the day's sky map (a 64 × 32 picture's PMREM: ≈ 0.2 MB) is built then instead of at the switch (one frame: 50 → 33 ms).
Measured after: the first night → day switch **33 ms** worst (was 150), every other frame 16.8. The perf kit
(`jaywalk-lab.mjs --h6b=perf`) now FAILS a look switch with any frame over 70 ms. No memory spike: nothing is kept but that sky map.

### THE LANE COUNT NEVER TOUCHES A LANDMARK · A MATCH's CHIPS (`skyline.js#SKY_MAX` / `SKY_MATCH_PIN` · css `.jw-lanes[data-dg]` · `tests/jaywalk-skyline.test.mjs`)
Measured off the 16 pictures (the columns each landmark fills in the count's rows / the chips' rows) on a 390 pt phone — the tightest:
- **A 3-digit count was simply too wide** (76 px: 166 pt across — the docks' cranes, the rail yard, downtown's towers, the lighthouse's
  lamp, the control tower all stood in it; no offset clears them without cutting the landmark in half). → **the count steps down a
  size: 60 px from 100 lanes, 44 px from 1,000** (measured: the widest 3 digits, 888, stand at x 129–261 of 390; 8888 at 44 px the same) (`numerals.js#setNum` names the digit count: `data-dg`) — about as wide as two
  digits were.
- **`SKY_MAX`** (per look + area): the highest shift at which the landmark still stands clear of that count. The rest offsets
  (`SKY_BIAS` / `SKY_BIAS_NIGHT`, re-measured) sit under it, and **the slide stops there** (the kid at the right edge: the band no
  longer carries the towers under the count). `skyPlan` returns it as `max`; `skyShift(bias, slide, room, max)`.
- **IN A MATCH** (`run.mode === 'match'` — the chips' column is up: 86 pt wide, down to 164 pt with 8 players) the two landmarks
  painted on the LEFT are **pinned** as far right as the picture goes (`SKY_PIN` −17.25) and do not slide back: the lighthouse (both
  looks) + the night bridge stand clear of the chips. **THE DAY BRIDGE cannot** — it is painted over the picture's left 38 % and the
  band has ± 17 % of room: its right tower + span stand clear, its left tower is behind the column (OPEN FOR BEN: a day bridge
  painted in the right third like six of the eight, or accept).
- Change the count's sizes and `SKY_MAX` together (the unit test pins both).

### THE TWO NIGHT TOWERS = GROK's OWN TOUCH-UPS (the inbox, Nov 17 12:10 pm)
The rail yard's water tower (floodlit, rim-lit, a ring of lamps; the gantry's lamps glowing) + the airfield's control tower (its cab
lit, rim lights, the beacon white-hot) were relit by Grok in place before the review's code lift was built — re-encoded through
`scripts/build-jaywalk-assets.py --only=skyline` (the other 16 pictures byte-identical; the masked lights the same as `SKY_OFF`).

### THE RECORDER AND THE JUDGE ARE ONE BOUND (the audit's BLOCKER + its HIGH — `engine.js#inputProblem` · `tests/jaywalk-recorder.test.mjs`)
The phone's recorder (`canLog`) knew only the 2-tick gap; the judge (`replay.js#logProblem`) also refuses 21 inputs in one second and
anything at or past a mode's cap. So an honest phone could write a log the judge refused WHOLE — the run scored as a kid who never
hopped: **a tap in the Mothership's own tick** (logged at `t = cap`, where the engine lifts the kid and plays nothing: about 8 % of
finishers — the best player in the room at 0 lanes, no BEAM ME UP, no best) and **a one-second multi-finger mash** (> 20 taps a second).
- **ONE function** now answers both: `inputProblem(log, i, t, d, mode)` → null or the judge's own word. `canLog(log, tick, d, mode)`
  = it is null for the next entry; `logProblem` loops it. The views pass `run.mode` (the game AND the lab).
- **An input the recorder does not log is not played** (it waits in the queue of two, or is dropped when that is full) — so the run on
  the phone IS the run the judge replays: at most 20 inputs in any second, nothing at or past the cap.
- **The judge is exactly as strict as it was** (not made tolerant: with one function the two can not differ).
- The tests: the bound BOTH ways across every mode's cap · 60 mash runs at 16–60 taps a second (accepted; the judge's run = the
  phone's) · a REAL 2,043-lane run to the Mothership (`tests/fixtures/jaywalk-ship-run.mjs` — the audit's breadth search found it)
  played through the phone's own loop with a thumb coming down in her tick → judged TAKEN at the phone's lanes.

### THE LOST CONTEXT (the audit — `view.js#watchGL`; `e2e-jaywalk.mjs` step 7c)
iOS can take the WebGL context away (an app switch under memory pressure). The run is on the server's clock: a blank playfield is a
kid run down unseen. On `webglcontextlost` /admin is told once (`errlog.js#reportError`); the scene is **REBUILT** — destroyed and
created again in the same look, tier, zoom, colour + reveal, resting again if it was — the moment the context is restored, or after
1.5 s without it. The solo E2E loses the context on purpose mid-run (`WEBGL_lose_context`): a new scene within 1.5 s, it draws, the
run never stopped. Proven in Chromium; WebKit on Windows offers no way to lose a context on purpose.

### THE END SCREEN, AFTER THE AUDIT (`flyers.js#rest` · `view.js`)
- **The Mothership's hum + rumble + the music's duck no longer stay on through the podium:** behind an end screen nothing is drawn, so
  nothing turned them down — they FADE as the scene rests (2.4 s when she is up, 0.6 s otherwise) and the duck lets go.
- **A WATCHER sees her arrive:** when someone was still standing at 6:00, a player already out waits the lift out (4.2 s past the cap —
  `SHIP_SEEN`) before the podium covers it, as the lifted kid's own phone does.
- **The tier is sampled only while the scene is drawn** (8 easy seconds behind an end screen stepped it up for the next run).
- **Leaving the game** (not PLAY AGAIN) lets go of the decoded sounds (`sfx.js#release` + the moments' buffers: ≈ 15 MB) and the run's
  picture. The rumble's noise is normalised (−7 dBFS peak at the bus at most).

### THE LIVE MATCH's PROOF TREE (the audit — `database.rules.json` `jw` + `jw/{match}`; `rules.test.mjs`) — A RULES CHANGE
The host could delete `jw` / `jw/{match}` at any time: on a modified client, mid-match, then a new GO → a new course, the honest
phones' nodes without a GO scored "no go", the host the winner of a counted match (solo: the course re-rolled after seeing it). The
delete is now refused while that match is LIVE (count / play) after the write. An older match's prune, the end, a new start, another
game's start still clear it — `host.js#pruneProofs` + `kit/again.js` already make those in writes of their own. Nothing honest ever
deleted a live tree: no client change, no fallback needed on the old rules.

### NEVER A CAR IN YOUR KID's COLOUR (`night.js#carTint` — a VIEW) · HOW TO PLAY
A cyan kid vanished against two cyan vans. A car's tint walks the palette past any colour near the viewer's kid's (each phone its
own: the rules know no colour). HOW TO PLAY (`help.js`) is true by day ("the lights go out behind you (fog by day)"), names the
runway + the UFO's green ring + the logs' edge, and says a match is won by the farthest — nine lines, nine drawings.

### AFTER THE SECOND REVIEW (`skyline.js#SKY_OPEN_DAY` · `night.js` the pool's `put`)
- **THE OPENING BY DAY rests 6.5 % right of centre** and never slides back past 5.5 % (`skyPlan` → `min`; `skyShift(…, max, min)`):
  the plain day picture's small lighthouse (at 43 %) stood right under a 1- / 2-digit count. By night the plain picture has none.
- **What THE FOG BANK takes fades INTO the fog's colour** (by day a pool's `k` over 1 is the fog: the thing's colour is blended to the
  fog's, never scaled up — trees + vans were bright pastel cut-outs, brighter than the fog).
- The night downtown's slide stops at 5.5 % · a day signal lamp stands ON the tarmac (not sunk to its middle).
- Two of the reviewer's top items were TEST-SHOT artefacts (the console's XP moment fading in over the end screen; a shot in the
  first instant of a look switch): `e2e-jaywalk.mjs` waits both out before its pictures.

### THE SIZE BUDGET — kept, never raised (`tests/integration/game-budget.json`: jaywalk 2,450 KB)
The fixes added 5.6 KB to JAYWALK's eager graph (it stood 1 KB under its line). **14 KB of pass-history comments were cut from
`night.js`** — full-line comments only, every code line identical (checked line by line against the commit before); the history is in
this doc + the pass logs. After Group 2: 2,442 KB; after the audit's fixes: **2,447 of 2,450 KB** (the game alone 389 KB, 32 modules). A JAYWALK pass that adds code trims
comments the same way before it thinks of the line.

## BEFORE THE FLIP (Nov 17 2026 — `docs/games/passes/jaywalk-preflip.md`; the owner's decisions: `docs/games/plan.md` "JAYWALK … BEFORE THE FLIP") — the last game changes owed before THE GO-LIVE PASS (which flips `playable` and changes nothing else)

### THE AREA ARRIVAL (`arrival.js` — the game + the lab · `night.js` the gate sign · css `.jw-arrive` / `.jw-gate`)
- **THE ARRIVAL BANNER**: the instant this phone's own kid crosses an area's gate lane — the area's name BIG at the top + a small
  `LANE 50` (a lap: `LAP 2 · LANE 450`), under the lane count, its foot ≤ 28 % of the screen (above the far haze: never over a lane),
  2.5 s (`ARRIVE_MS`) with the area-arrival sound. NIGHT = a neon sign (a dark board, the area's colour as its tube + glow, a flicker
  on); DAY = a painted sign (the area's paint darkened ×0.72 — white letters ≥ 4.5 : 1 on every area — a white trim, a drop-in swing);
  reduced motion = a plain fade. transform + opacity only. ONE element, built once. Never over the Mothership's warning (a match, its
  last 10 s — `SHIP_WARN`), the OUT card or the end: they win, and it goes at once if one starts (`view.js#arriveNow`). The old small
  name flash under the count is retired. A ghost's crossing never shows.
- **THE APPROACH SIGN** (GATE_SEEN 10 → GATE_GONE 3 lanes out, unchanged): in the real game on the emulators it WAS up whole by day
  (9.5 → 4.5 lanes at every gate — `e2e-jaywalk` samples it), so the phone's own failure modes are closed: the board is marked drawn
  only once it WAS drawn (an iPhone over its canvas memory refuses the 2D context — the old code then kept a blank sign for good), a
  wiped canvas (`onCanvasLost`) or a blank board found as the sign comes up (its board's pixel) is drawn again, it is re-drawn once
  Orbitron has loaded; by day the paint is darkened + a heavier keyline (the docks' brown board read as the brown planks); 82 % wide;
  a small pop-in scale with its fade. The lab check: `jaywalk-lab.mjs --preflip` (3 areas, day + night, 8 + 5 lanes out + the crossing).

### THE CAMERA + THE TAKES ARE PINNED (the owner, Nov 17)
The game draws **ZOOM 8 · STRAIGHT** (`camera.js#ZOOM` / `ANGLE`) and plays **the owner's takes** for everyone — every A / B sound its
take A (NEW BEST's B recording, the train's set B and the arrival's "Success" are single files) — whatever the lab saved on the phone.
Only the lab page + THE SOUND AUDITION switch this phone's own picks on (`sfx.js#useLabPicks`). The `jw:lab:*` keys the game still
reads are its OWN memory: the tier it settled at, the hint seen, the best the server last told it.

### THE RUN CARD UPLOADS ONLY ON SHARE (the owner, Nov 17 — the review's storage finding)
The end screen only DRAWS the card (its PNG + the half-size link picture kept on the phone); **nothing goes up until the player taps
SHARE** — then once (`js/daily/share.js#prepShare`'s `onTap` — the daily's later share reuses it), the link shared alone; a second SHARE
shares the same link, nothing uploaded; kept 7 days as before. iOS refuses the share sheet once the tap's user activation is spent on the
upload's await: `send()` then answers `'ready'` (`navigator.userActivation.isActive`, else 1 s) and the console's SHARE
(`ui/final.js`) reads **PREPARING… → SHARE** (lit, one pulse) — one more tap shares inside its own gesture. A live tap shares at once.

### THE TEARDOWN — a lost context is never our own (`view.js#watchGL` · `night.js#destroy`)
PROVEN in WebKit (`wk-jaywalk-mem.mjs` THE LEAVE): `night.destroy()` ends with `forceContextLoss()`, which fires the canvas's own
`webglcontextlost` — every leave was reported to /admin as "the WebGL context was lost" (screen = title — the owner's two reports), and
the two listeners each PLAY AGAIN mount added to the kept canvas held every old view alive (3 views after 3 runs; 8 views + 6 lost GL
contexts held after 5 leaves — the review's ≈ 3–4 MB a run creep). Now the listeners come OFF (`offGL`) before any `destroy()`
(unmount, the rebuild, the parked scene's 2.5 s timeout), the handler ignores a view that has gone / a scene not its own, and the 3D
canvas is zeroed. After: 0 reports, no rebuild, JAYWALK's live GL contexts + canvases 0, 1–3 views alive after a full GC (WebKit's GC
scans the stack conservatively: the last few may linger a while — the bug held every one: 10 after 10 runs, 8 after 5 leaves);
a REAL loss mid-run still rebuilds + reports once. The WebKit process's own number swings ± 350 MB between leaves with no trend (printed,
never asserted).
**DAILY FIX (the inbox, Nov 18 12:30 pm — "4–7 views alive after 10 runs, limit 3"): WEBKIT's LAZY GC, PROVEN — not a holder.** After 10
PLAY AGAINs a probe counted the views over time: `[0,1,3,5,7,8,9]` through three churns (t+2 → t+9 s), then `[8,9]` at t+12 s and flat to
t+90 s — runs finished minutes earlier freed in the same beat, so no timer / listener of theirs held them; Chromium (a forced
`HeapProfiler.collectGarbage`) keeps only the CURRENT view after 6 runs. The check now counts after a SETTLED GC (`settledViews`), the
limit stays 3; `--daily` proves a daily's 3 tries the same way.

### NO WHITE FLASH AT A TIER STEP (the inbox, Nov 17 6:58 pm — `night.js#fit` / `fitNow`)
A quality-tier step (`tiers.tick` runs AFTER the frame's draw — automatic whenever a phone's frames slip or have room) or a
ResizeObserver call resized — CLEARED — the 3D canvas after the frame was drawn: that frame showed the stage's own background, the
day's pale sky-blue across the whole playfield (night: near-black, unseen). A resize now only ASKS; the next `draw()` resizes first,
then renders. PROVEN: `jaywalk-lab.mjs --preflip=flash` (a 2-min DAY bot run through all 8 areas, ≈ 6,800 frames streamed, 32 tier
steps fired after their frame's draw) — 17 whole-frame flashes on the old code, 0 now.

### ONE BODY OF WATER (`night-fx.js` — the ground shader's water)
Neighbouring water lanes read as ONE river: the surface's colour + ripple fields run on the world's z (the lane + its z, as the grass)
with ONE slow drift — never a lane's own seed or current; the foam + the shallows only where the water meets something that is not
water; each lane's specks still ride its own current (the logs keep theirs). Shots: 2 + 3 water lanes, day + night (`--preflip=water`).

### THE SOUNDS, BEFORE THE FLIP (Grok's sfx5 — all CC0; the owner's picks, Nov 17 7:20 + 7:21 pm)
- **THE STOPWATCH** (`stopwatch-tick.wav` — "Chronograph #2", Joseph SARDIN; a seamless 2 s WAV loop) REPLACES the lights dying (row,
  file + credit gone): `cues.js#tickOf` — silent until the dark is within **3.5 lanes** (it waits at 5; measured ≈ 8 % of a moving
  bot's run — at 4.5 it was 24 %, every run), then fading in (×0.18) + speeding up (0.85 → 1.75×) to its loudest at 1 lane; it glides
  (`set()` — setTargetAtTime), fades out with the run.
- **THE TRUCK HORN** (`truck-horn.mp3` — "Truck Horn", Pierre SIBANARCO): no horn added — the horn's own moments (its rules + ≤ 1 per
  3 s) ALTERNATE car · truck, at the car horn's measured loudness (−27.1 LUFS at the SFX bus).
- **THE AREA ARRIVAL** = "Success" (Sjonas88) — the sparkle is retired; level-matched (its loudest = the sparkle's, −16.7 LUFS);
  `JW_SFX_REV` 4. The table: 12 sounds. Credits: `audio/jaywalk/CREDITS.md` + ☰ → Credits.

### THE SIZE BUDGET, AGAIN (never raised)
The pass's code took JAYWALK to 2,459 KB of its 2,450 KB line: full-line comments were stripped from `night.js` (−10.4 KB) and
`night-fx.js` (−7.5 KB — most sat inside the GLSL the GPU compiles); code lines identical; their history is this doc + the pass logs.
JAYWALK = 392 KB past the boot (395 at the start of the pass).

## THE POLISH PASS (Nov 18 2026 — `docs/games/passes/jaywalk-polish.md`; the owner's decisions: `docs/games/plan.md` "JAYWALK … THE POLISH PASS") — the first pass after launch; no rules change, REPLAY = LIVE untouched

### YOUR TABLE = ONE CENTRED GRID (`victory.js#yourTable` · css `.jw-table*`; `e2e-jaywalk.mjs` "YOUR TABLE at <w>")
- RANK | CARD | SCORE: the block = the end screen's own column (the PLAY AGAIN bar's edges — `.jw-fin`'s 12 px given back; ≤ 440 at a desk,
  centred); the rank + score columns are ONE width (`--jw-side`, from the widest score's digits — `--jw-d`, set by `yourTable`) so every card
  is the same box, DEAD CENTRE; the scores right-aligned in their column; the label **YOUR TABLE centred on the screen** over the cards (the
  owner's correction, Nov 18 6:55 am — like the lane count, LANES, NEW BEST above it).
- **The names inside the cards** (the owner: "left on mine, right on friends'"): JAYWALK's own `.jw-table-list b` reached INTO the cards'
  `b.vl-name` (right-aligned, the numerals' font) — now `li > b` only + the card's own left alignment (`.jw-table-card`).
- Proven: the E2E seeds three friends (12 · 10 · 8-letter names; a 3 / 2 / 2-digit best — pids fresh each run) once the run's lines are read
  and measures at 360 / 390 / 430 / 1440: equal margins, the bar's edges, one card box, the ranks' + scores' columns, every score fits, every
  name on ONE line + whole (a phone fits once at its own width: the check re-fits after each resize). `JW_UNTIL=table` stops the E2E there.
- **A NAME NEVER WRAPS MID-WORD ON A SLIM CARD** (every slim card — docs/vault.md "THE SLIM-CARD LONG-NAME STANDARD"): the plate may run to
  the gem; the name ONE line — shrunk to 12 px, then an ellipsis as the last resort (`ui/fit.js` `o.one`). MAXIMILIANOS fits whole at 360 (14 px).

### THE CAUSE LINE's DARK BAND (`share.js#drawRunMiddle` · `BAND`; the lab's `--polish=share`)
A dark translucent tab (`rgba(7,6,11,0.72)`) hung from the frame's top-left behind the cause words — the frame's own corner at its top, an
18 px corner at its foot (never a pill); both looks. The lab draws a REAL end (a car · the water · the blackout / the fog) by night + by day
from the game's own frame grab into the game's own card: 1080 × 1350, 540 × 675 + the link-preview size; the band's luminance 0.110–0.147.

### HOW TO PLAY — THE MOTHERSHIP (`ui/help.js#RULES.jaywalk`)
An 11th line + its drawing: "A MATCH ends at 6:00: the MOTHERSHIP lifts everyone." (52 letters — the kid's-line cap; the goal line already says
a match's farthest wins; never in solo). The boot: +331 B (16,586 B of room left). `shots.mjs` scene `jw-help-end` = the help at its last line.

### THE LATE k WRITE (`kit/call.js` `canPick` · `expect`; `view.js#afterOut`; `e2e-jaywalk-match.mjs` 7a)
/admin: "RULES REFUSED update rooms/*/jw/*/*/k {w, at}" on the final screen. The call's refusal was expected for 6 s from the CARD — a tap
later than that which lost the race with the final was reported. Now a tap never writes once `ended()` or on a pick already out (its live
node has an `e` — the button greys, `.mk-call-pick.is-out`), and a race still lost in flight is expected for 90 s from the TAP. (A call can't
ride with your own `e`: it is a tap seconds later.) The kit's options are opt-in — the other games unchanged.

### THE FAR LANES AFTER A REAL LOST CONTEXT (`view.js` `revealed`)
A SOLO run turned the reveal on without setting the flag the rebuild reads — a rebuilt scene came back at reveal 0 (the start's few lanes lit,
the rest dark). `e2e-jaywalk.mjs` 7c measures the far half's brightness fresh vs rebuilt (0.229 → 0.218).

### THE LINES' WORDS WIN (already — locked: `tests/jaywalk-lines.test.mjs` "THE WORDS WIN")
The words: no depth test, render order 5 over every instanced kind, masked only by the kid's stencil; only THE BLACKOUT's curtain + the fog's
lip draw after them. The old frames' "cover" was the reveal's dark edge (above) + a vehicle seen through the letters' gaps. The lab's
`--polish=lines`: a truck + a car across the words, both looks.

## THE TOUCH-UP PASS (Nov 18 2026 — `docs/games/passes/jaywalk-touchup.md`; the owner's calls on THE POLISH PASS's OPEN FOR BEN: `docs/games/plan.md` "JAYWALK … THE TOUCH-UP PASS") — views only; no rules change, REPLAY = LIVE untouched

### THE SHARE PICTURE SHOWS THE KID (`shot.js#SHOT_AT` · `shotMs` · `carClearMs`; `view.js#onOver`; `tests/jaywalk-shot.test.mjs`)
- The run's frame is taken PER CAUSE at the moment night.js still draws him clearly — chosen frame by frame from the lab's contact sheets
  (`jaywalk-lab.mjs --touchup=probe` → `probe/<look>-<cause>.png`, the grab armed IN the page on the frame the run ends): **water 140 ms**
  (mid-splash, head + arms up — the sink ends at 380) · **the edge 400** (carried 260, then the same) · **the blackout / the fog 40** (the wall
  at him) · **the train 200** (flung clear of the locomotive, his face seen — by 260 he leaves the frame) · **the Blackbird 60** (the jet, its afterburners + him in ONE
  frame — at 460 he was a tumbling clump, the jet gone) · **the UFO 1000** (high in the beam, under the saucer's rim) · **the Mothership 1500**
  (rising in its beam). (The train / Blackbird / UFO moments were re-picked after the fresh-eyes review: 130 · 460 · 720 read poorly.)
- **A VEHICLE:** 460 ms as before when it has passed him by then (he lies flat behind it) — `carClearMs` reads the rules' own movers (its rear
  650 FP past his centre); else (a van, a box truck, a slow lane — it covers him for up to a second) **THE IMPACT, 70 ms**: the pancake at its
  nose, his head + feet out from under it. No end waits longer: the end screen's timing is unchanged (`hold()`).
- **The card frames every cause alike** (`share.js` `SHOT_UP` 0): his point at the picture's middle — under the cause line, over the big lanes;
  a tumbling kid (a train, the Blackbird) spins round that point. `jaywalk-lab.mjs --touchup=kid`: 8 causes (a far lane's box truck included)
  × 2 looks, the kid inside every picture; the cards at 1080 × 1350 + 540 × 675 + the link-preview sheets.

### THE PINK WORDS READ OVER A TAXI (`night.js#writeLabel` · css `.jw-tag` / `.jw-mark`)
The lines' words (the friend's pink, YOUR BEST's gold) carry a THICK dark edge — two rings (10 + 5 px of the label's canvas) + a soft shadow —
in both looks; the ghosts' name tags + the pink mark under the count gain a dark text edge. The lab's `--touchup=words`: a yellow taxi under
LIAM · 7 + two tags, both looks (the kit draws the tags as view.js does — the lab has none of its own).

### YOUR ROW GLOWS (`victory.js#yourTable(el, me)` · css `.jw-table-list li.is-me::before`; `e2e-jaywalk.mjs` "YOUR ROW GLOWS")
A light ring (1.5 px) + a soft glow in YOUR colour (the room's `players[uid].color`) round your whole row, on a layer of its own (`::before`,
inset −3 / −6 px — no padding, the grid never moves; a 9 px corner, never a pill; static). The E2E re-seeds the friends' bests and re-asks the
table (`yourTable` is exported for it): your row 4th / 1st / 3rd, each by night + by day.

### THE DAY END SCREEN's TITLE ON A SOFT DARK FADE (css `.jw-stage[data-look='day'] .jw-final`)
By day the veil's top is darker (0.84 → 0.76 at 16 % → the night's own 0.9 by a third of the screen): JAYWALK · SOLO + the cause words read on
the bright sky; the night unchanged. (The night's near-black far grass: LEFT AS IS — the owner.)

## THE DAILY (DAILY A — Nov 18 2026; the owner's decisions: docs/games/plan.md "DAILY A / B"; ships OFF — its screens are DAILY B's)
THE SERVER HALF + an owner-facing TEST PAGE. The row: `config.js#DAILIES` `{ id: 'jaywalk', …, measure: 'lanes', ticket: 'jaywalk', on: false,
tries: 3 }` (DAILY B dropped `ownMusic`: see THE PHONE HALF) (the daily shares the game's id — `app.js` + `daily/share.js#measureOf` read a DAILIES row FIRST); the ticket's ink
`TICKET_INK.jaywalk` = night `#ffa53a` · day `#e0661c` (used by DAILY B).
- **THE DAY**: the course = `dailySeed('jaywalk', day)` (THE DAILY SECRET — `api/_lib/jaywalk-daily.js#jwDay`, `d<seed>`; the same for everyone;
  practice / solo / a match never use it), `MODES.daily` (the wall 0.6 → 1.8 lanes / s from 3:00, THE MOTHERSHIP at 5:00). **THE SCORE** =
  lanes, then the EARLIER tick — `core/daily-best.js#jwScore` = lanes × 100000 + (99999 − tick), `better: 'high'`; 5-lane buckets (121).
- **THREE TRIES, THE BEST COUNTS** (a `tries` cartridge — api/daily.js branches on `cart.tries`): **START** = a NEW try every time (never a
  resume, never a pause): an open try is CLOSED first (condition 1), a 4th → `409 no_tries` (+ the day's score + the tries in the error's
  extra). **The FIRST closed try counts the day** (api/daily.js#finishRun: the claim of `r/{pid}`, the histogram, the top, THE THROWAWAY GATE,
  the streak, the XP ONCE, THE SWEEP, PERFECT WEEK); **a BETTER later try RAISES it** (#raiseRun: the claim's own transaction raises `r/`, the
  histogram moves the bucket, the top re-sorts, the points rise by the difference — `daily-best.js#pointsRaise` — the points boards are
  re-written, a closed day re-ranks: PENTHOUSE reads the best). EVERYONE's scores unlock after the FIRST closed try (`r/` exists). Unused tries
  expire at 4 am (START is always today's).
- **THE RUN PATH**: START answers `{ run: { seed, try, go, z, path, left, tries } }` — `go` = the server's time + `LEAD_MS` 3 s (the count-in),
  `z` = go + 5:00 + `GRACE_MS` 90 s (THE DROPPED SIGNAL's burst) — and the SERVER writes the proof node `{ go, z }`; the phone plays ON THE
  SERVER's CLOCK (tick = (server time − go) × 60 / 1000) and appends its hops every second as chunks `c/{k} = { s: packed hops, at: the
  DATABASE's server timestamp }`; **FINISH** closes the try: the server reads the node and REPLAYS it (`api/_lib/jaywalk.js#verifyRun`, mode
  `'daily'`, tick 0 = the RECORD's go — never the node's; THE SPEED CHECK both ways + THE DROPPED SIGNAL; a log ahead of the clock → the try
  = 0 lanes `bad`; a slowed log CUT; chunks stamped past z never read). Nothing a phone claims about lanes is read. **As it stands**: a try
  ended mid-run is replayed to its end — the kid idles until the wall takes him, so his lanes = what he REACHED (a hop in the air lands).
- **THE RECORD** `dly/jaywalk/{day}/p/{pid}` = `{ st, n, e (the last close), t: { i: { u (the uid), go, z, e, l, k, s, w, cut?, bad?, why } } }`
  (`why`: fin · start · room · quiet · close) — THE DROP's bookkeeping shape (begin / record / close). **THE PROOF NODE**
  `dly/jaywalk/{day}/w/{uid}/{try}` — the only phone-writable spot under `dly/`.
- **THE 4 CONDITIONS** — (1) an unfinished try is scored on the next START (always), on `today` once it can't be in play (its `e`, past z, or
  no chunk for `QUIET_MS` 20 s — a phone that's playing uploads every second; an offline phone can't call `today`), and at THE DAY'S CLOSE
  (`daily-close.js#sweepRuns` — a `tries` cartridge's pids are swept even with a score; two days on = forced) · (2) **THE ROOM WINS**: the
  `roomWins { game, room }` action — the player in that room with 2+ players (`daily-room.js#roomJoined`, no game needed) → the open try ends
  as it stands (`why: 'room'`); the room's `players/{uid}/dy` flag stays the phone's (DAILY B's banner: "TRY ENDED · N TRIES LEFT", no RESUME);
  `pause` is refused for JAYWALK (no `moves`) · (3) **THE RULES** (`database.rules.json` `dly/jaywalk/$day/w/$uid/$try`): own uid only; `$try`
  0 … 2; chunks append-only, `{ s (the packed-hop pattern, ≤ 400), at === now }` and nothing else, only between go and z and before `e`; `e`
  once, `=== now`, inside the window; a phone never writes `go` / `z` / a new try and never reads — `rules.test.mjs` "DAILY A" · (4) **THE
  PRUNE**: `JAYWALK_DAILY.prune` deletes the day's proof nodes past `PROOF_DAYS` 7 (once — `pr`); the tries' results + the scores stay.
- **THE POINTS** (`core/daily-points.js#POINTS.jaywalk` — a CAPPED lanes curve): FLOOR 10 + 90 × (lanes / 300)^0.6, **300+ lanes = 100**:
  0 → 10 · 50 → 40 · 100 → 56 · 150 → 69 · 200 → 80 · 250 → 90. The cap from MODES.daily's tuning: the greedy bot over 120 daily courses —
  p10 37 · median 207 · p90 282 lanes; the wall alone is at ~242 lanes by 5:00 (reaching THE MOTHERSHIP ≈ 89+). The tick never counts here.
  ALL TIME = the shared average rule; THE SWEEP + PERFECT WEEK need all four once the row is live (`tests/daily.test.mjs` "DAILY A"); XP
  unchanged.
- **DAILY BEST** — docs/progression.md "DAILY BEST" (JAYWALK = the most lanes, the earlier tick on a tie; beating your own first try the
  same day is NO new best).
- **THE TEST PAGE** `tests/integration/jaywalk-daily.html` (owner-facing, plain): START → the run on the graybox (three.js; no WebGL = the
  count only) → FINISH / TRY AGAIN, the server's lanes per try, TODAY'S BEST, DAILY BEST; `?emu` = the real /api + the proof node on the
  emulators (the row opened by THE SCHEDULED GO-LIVE or `DAILY_TEST_OFF=jaywalk`); without it = THE LOCAL JUDGE — the same pure server code in
  the page (`/__dev/api-lib/jaywalk-tries.js`), a fixed test course (the owner's phone link on a plain `serve.mjs`); `&auto=1` = the bot;
  hiding the page ends the try.
- **Proven**: `tests/jaywalk-daily.test.mjs` (the pure tries + THE JUDGE on a proof node: ahead / slowed / dropped / a hole) ·
  `tests/daily-best.test.mjs` · `tests/integration/daily-jaywalk.test.mjs` (/api, its OWN file — `DAILY_TEST_OFF=jaywalk`: 3 tries + a 4th
  refused, the raise, condition 1 on START / `today` / THE DAY'S CLOSE, THE ROOM WINS, forged chunks, DAILY BEST + THE BACKFILL, THE PRUNE) ·
  `rules.test.mjs` "DAILY A" · `e2e-jaywalk-daily.mjs` (a real phone, 3 tries on the emulators, the server = the phone's own replay).
- **THE PHONE HALF** — DAILY B (below).

## THE DAILY — THE PHONE HALF (DAILY B — Nov 18 2026; docs/games/passes/daily-b.md; the owner's decisions: docs/games/plan.md "DAILY B")
Still ships OFF (`on: false` — THE SCHEDULED GO-LIVE opens it at a 4 am turn: /admin → GO LIVE AT THE NEXT 4 AM, `progress/dlive/jaywalk`).
- **THE TICKET** (the shared ticket — js/daily/today-logic.js#ticketState, docs/progression.md "DAILY B — THE TICKETS"): the walk signal (core/marks.js —
  its rounded box + the figure, `ticket-art.js#TICKET_ART.jaywalk`) in the owner's orange (night `#ffa53a` · day `#e0661c`). BEFORE the first try: the
  hook or "DAILY BEST · 168 LANES", PLAY · BETWEEN TRIES: the LAST try big ("143 LANES"), "DAILY BEST · …", TRY AGAIN with "2 TRIES LEFT" under it ·
  ADMITTED (the stamp) only once no try is left or the player tapped DONE (`today.js#markTriesDone` — per phone, per day): the BEST try + the place
  ("2ND OF 5 PLAYERS") or the gold NEW DAILY BEST. Everyone's scores (SCORES) unlock after the first finished try (the server's `r/` rule).
- **THE RUN** = `js/games/jaywalk/daily-run.js` — a DAILY RUN module (`js/screens/daily.js#DAILY_RUNS`: a `tries` row loads it, NEVER the room
  cartridge — so nothing of the daily is in JAYWALK's preload graph / its budget). It mounts the REAL view (view.js — both looks, the sounds, the
  lines, THE MOTHERSHIP at 5:00) through ONE adapter, `state.jwDaily` (view.js's only daily code: `D.start()` → the day's seed + the SERVER's go
  → `adopt(go, null, true, seed)` in `MODES.daily`; the chunks go to `D.path` = the proof node; the end → `D.end(over, line)`; `D.stop` for STOP;
  the 3 · 2 · 1 = the 3 s lead before go). `e` is written by daily-run.js and AWAITED before FINISH (one connection, in order: the chunks before
  it have landed). The end card shows the SERVER's lanes (`finish`'s `try.l`) — never the phone's count — then TRY AGAIN · n TRIES LEFT · DONE, or
  (no try left) ADMITTED + BACK TO THE DAILIES.
- **THE ENDS** (no pause, no RESUME anywhere): STOP (a second tap — `confirmTap`'s TAP AGAIN TO STOP: a mis-tap never costs a try) · hiding the
  app / a refresh / leaving = `endTry('away')`: `e` + FINISH sent with keepalive (the server also closes a quiet try itself — condition 1) · THE
  ROOM WINS: `roomWins` (the screens' `pause`) → the banner "TRY ENDED · 2 TRIES LEFT" ("TRY ENDED" when none), nothing held, the dy flag as DAILY A set it.
- **THE MUSIC**: the row has NO `ownMusic` — JAYWALK's own music IS the look's mood station (`index.js#musicFor` — 'mood:day' / 'mood:evening'),
  exactly what the console plays for a daily run without the flag; the view plays no songs of its own (`ownMusic` would have meant silence).
- **CARDS + YOUR BEST** (the owner, Nov 18): every try the SERVER closes (FINISH, the next START, THE ROOM WINS, `today`, THE DAY'S CLOSE) credits
  its REPLAYED result like a counted match — `jaywalk-tries.js#scoreTry` keeps the try's feats (`f`), `api/_lib/jaywalk-credit.js#creditTry` (PURE)
  raises the `jaywalk-solo` record (YOUR BEST) + sets the cards' flags (`pa.gf['jaywalk-boom' | 'ufo' | 'airfield' | 'mothership']` — THE MOTHERSHIP
  counts: the daily is capped) in ONE pstats transaction, then the board rows (`api/daily.js#creditTry`) — a COUNTED result only.
- **SHARE TODAY** (`js/games/jaywalk/daily-share.js`, lazy — `share-today.js#SECTIONS`): JAYWALK (white) · the best ("143 LANES") · "BEST OF 3"
  (+ " · NEW DAILY BEST") · three TRY BARS (~640 wide, centred; each = its lanes against the best; the best amber, the others dim; an unplayed try
  a dashed outline) — from the server's spoiler-free inputs (`jaywalk-tries.js#shareOf`: `{ t, b, nb, day }` — never the course). Its own card
  when it is the day's only finished daily. The text: "JAYWALK · BEST OF 3 · 143 LANES".
- **PRACTICE NEVER USES THE DAY's SEED**: a solo / match course = `seedOf` ('g…'); the day's = 'd…' and only via START → the adapter.
- **Proven**: `tests/daily-b.test.mjs` · `tests/integration/e2e-jaywalk-daily-run.mjs` (GO LIVE → 4 tickets + 4 segments → 3 tries: STOP, a refresh,
  THE ROOM WINS → ADMITTED only then → YOUR BEST → the 4-section card; + the 4-ticket FIT at 375 × 667 / 390 × 844 / 430 × 932, both looks).
- **THE TEST PAGE** (`tests/integration/jaywalk-daily.html`) is KEPT as an owner tool: THE LOCAL JUDGE runs on a plain server (no emulators, no
  sign-in) — the only way to try the daily's judge on a phone before the row goes live.

## THE CAMERA (H2B — `js/games/jaywalk/camera.js`: ONE pure module, the night look AND the graybox use it)
The owner played H2 on his iPhone: "the game feels good", but it had to be ZOOMED IN — a closer camera that FOLLOWS the kid sideways, turned
a little so the lanes run on a gentle diagonal (the genre's framing; nothing else of anyone's). PURE MATH: no three.js, no DOM, no clock of
its own (the view hands it `dt`); it places anything with `position.set` + `lookAt`. The rules never import it; **swipes stay
screen-relative** (up = the next lane, left / right = sideways, down = back — exactly as before).
- **ZOOM** = the columns seen ACROSS THE SCREEN at the kid's row: **7 · 8 · 9, default 8** (`ZOOMS`, `ZOOM`). THE PROVEN RIG (H1: 16 up /
  12 back — the kid seen from ≈ 53° above) is kept and scaled about the kid by zoom / 9.42. **The lens is fitted to the screen's WIDTH**
  (`lensFor(aspect)`): the same columns on EVERY screen shape — a shorter screen (Safari with its bars) sees fewer lanes, never smaller
  columns (H2 held the vertical fov: its "11" was ≈ 14 across in Safari). 390 × 844: fov 54.4.
  **The kid's height at 390 × 844 (measured — `kidHeightPx()`): ≈ 46 pt at ZOOM 7 · ≈ 39–40 pt at ZOOM 8 · ≈ 36 pt at ZOOM 9** (H2: 27 pt).
- **THE SIDEWAYS FOLLOW**: the camera's x eases to the kid's x (`EASE_MS.x` 140 ms; a hop is led to where it lands; a log ride is followed
  — its lag is a steady v × 0.14 s, no jitter), **clamped so the view never shows more than `PAST_EDGE` (1) column past the play area's
  edge** (`followLimit(zoom)` = 2 · 1.5 · 1 columns at ZOOM 7 · 8 · 9): cars + logs are still seen coming, the kid stays on screen at
  both edges (≈ 19 % / 81 % across at ZOOM 8). Up the lanes: `EASE_MS.y` 105 ms; a far jump (a respawn) snaps.
- **THE TURN**: **`TURN_DEG` = 12** — the ONE tuned number: the camera sits 12° round the kid (to his right), so "up the course" runs up +
  a little right, the lanes fall ≈ 10° to the right on the screen and the cars' sides show. **ANGLE: STRAIGHT · TURNED, default STRAIGHT**
  (H3 — the owner's pick so far: ZOOM 8 + STRAIGHT; he is still testing with his nephew — both switches stay on the lab, a later pass flips
  `camera.js#ANGLE` in one line; a choice stored on a phone still wins there). The
  turn is about the kid: he stands in the same place either way. The horizon stays level (a yaw, never a roll): the skyline band still
  reads as a horizon — its picture sits a step over in the turned view and slides against the follow.
- **THE FRAMING**: the kid's feet **62 % down** the screen on every screen shape (`CAM.kidAt` — the aim is solved per shape); **3–4 lanes
  clear behind him** above the foot's fade (83 %), ≈ 6 to the screen's very foot → THE BLACKOUT is seen climbing before it bites (the
  owner's brother: you see it coming). ≈ 12 lanes ahead at ZOOM 8. The lane count sits over the skyline; nothing covers the play.
- A ZOOM / ANGLE change eases (`EASE_MS.set` 170 ms); the far plane + the fog follow the rig's scale; a closer zoom lays fewer lanes.
- Tests: `tests/jaywalk-camera.test.mjs` (the numbers, every screen shape, the follow's clamp + ease, the turn, PURE) +
  `tests/integration/jaywalk-lab.mjs` (each zoom + both angles in a real page, the kid's height, both play edges, a log ride, the lanes behind).

## THE SOLO GAME (H3 — the real cartridge view: `view.js`; solo endless, one life)
**On the owner's phone only** until go-live (THE OWNER'S LIVE TEST — `config.js#isOwnerTest`, the server's own OWNER yes from the radio gate):
the dock's **PLAY → JAYWALK · TEST → PLAY NOW**, or a tap on the **JAYWALK sign** on the skyline → its card → PLAY NOW (`title-taps.js`: the
shelf's list + the sign's tap — nobody else's shelf, sign or card changes; `tests/holdem-owner.test.mjs`). HOLD'EM's precedent still works
too (HOST a room → PICK A GAME → JAYWALK · TEST — a room of one). The server counts a game being built for the owner alone
(`api/report.js#reportableGame(id, uid)` — the reporter's profile in `ADMIN_PIDS`; a stranger's report: `not_reportable`).
- **The screen** = the lab's night scene (`createNight`), the kid, `controls.js`, `sfx.js`, inside the console's game frame: THE CITY PAUSE,
  the corner menu (☰ top-left) + music (top-right) over it, the station's music (`MUSIC 'mood:evening'`), `LOOKS ['day', 'night']` since H5B (it was ONE look until
  H5 — the console paints NIGHT and Settings shows it LOCKED). The lab's ZOOM / ANGLE choice on that phone is the game's too
  (`lab-prefs.js`). A room of 2+ = THE MATCH (the same view — above). **FIRST-RUN HINT** "TAP TO HOP · SWIPE TO STEP": once per phone,
  gone on the first hop (`jw:lab:hint`).
- **No count for a solo run** (`director.js#createGame`: `play` from the start — PLAY NOW's walk inside is the wait).
- **THE COURSE IS PICKED AFTER GO** (the owner, Nov 16): the moment the run is on screen the phone writes its proof node's `go` (the
  SERVER's time — the rules: `=== now`, once), **reads it back from the server** (`get` — never its own estimate), and the course's seed =
  **`logic.js#seedOf(code, matchId, go)`** = two FNV hashes of (room code, match id, that millisecond). Nobody — the player included — knows
  the course before the run is on the clock: no one can shop for an easy one. The host's `game.seed` is never a solo course. Until the seed
  lands the screen shows **THE START**: the kid on plain calm ground (what lanes 0–3 are on EVERY course), everything past ≈ 4 lanes still
  in the dark (`night.js#setReveal(0)` — the fog pulled close), then the lights come up over 130 ms — never a blank frame.
- **THE RUN IS PLAYED ON THE SERVER'S CLOCK:** tick 0 = GO; every frame the engine is stepped to `floor((serverNow − go) × 60 / 1000)`
  (a stall or a hidden page is CAUGHT UP, ≤ 900 ticks a frame — the rules never skip a tick). **A run never pauses** (no `soloPause`: a
  pause would be a slow-motion hole) — a kid nobody is moving is caught by the blackout in ≈ 16 s.
- **THE PROOF:** the hop log goes up in chunks, one a second while there are new hops (`CLOCK.flushMs`), each
  **`c/{i} = { s: the packed hops, at: the SERVER's time }`** (the rules: `at === now`, written ONCE, i 0–9999, ≤ 400 chars); at the end
  the last chunk, then `e` (a signal: the host's step ends the match on it — never read as a score).
- **AN UNPROVEN RUN** (GO refused or unanswered for 4 s — no signal, or the rules not yet re-published): the game still PLAYS, on a seed of
  its own, is never counted, and its end shows on the view's own screen (the same body + "NOT COUNTED — NO LINE TO THE BOARD", PLAY AGAIN ·
  BACK TO THE CITY) — the console's podium needs the proof's `e`. A refusal is reported once to /admin (`rules`).

### THE ANTI-CHEAT (H3 — the server's own result)
- **A solo run is counted ONLY from the server's replay of the proof node** — `api/_lib/jaywalk.js#verifyNode` (GO → the seed; the chunks →
  the log + its clock) → `jaywalkSolo` → a match marked `sv`; `api/report.js` uses it on BOTH paths (the room still on that match, or the
  room already moved on — HOP AGAIN: the proof node + the night record are enough, `src: 'proof'`). The room's `game.results` (the host —
  the player — wrote them) and a phone's claim are never read; only an `sv` match earns the record (`core/match-report.js#jaywalkExtra`).
- **THE SPEED CHECK, BOTH WAYS** (`replay.js#clockProblem` + `tuning.js#CLOCK` — THE DROP's slow-motion check): a chunk written at the
  server's time `at` may not hold a hop **AHEAD** of the real clock (its last hop's tick > the clock's tick + 2 s: a sped-up game, a log
  made in advance → the whole run REFUSED: 0 lanes, named in `rejected`, EMPTY — no XP, no streak day), nor one far **BEHIND** it (its
  first hop > 8 s behind: a slowed or paused game → the run is **CUT** there — it counts up to its last on-time hop, `cut`, never past
  it: a dropped signal never costs an honest player the whole run). A chunk's time never runs backwards, never before GO. Honest play
  passes with a 3 s upload lag (the tests).
- The log's bounds (ticks rising, ≤ 20 inputs a second, no hop after the end) are H1's. A phone can't choose a chunk's time (the rules), GO
  is written once, a chunk is never rewritten. **Known limit** (for the review): a bot that plays in real time is indistinguishable from a
  very good player.
- **THE QUICK SOLO RUNS** (`core/match-report.js#QUICK_SOLO` → `api/_lib/stats.js#gapFor`): THE 45 s GAP ("one match per player per 45 s")
  does NOT hold a JAYWALK solo run back — runs last seconds and restart at once; a solo run is never a win, and its XP stays capped at the
  day's first 4 solo runs (THE SOLO LANE). JAYWALK's room matches, and every other game, keep the gap.
- **THE BEST:** board **`jaywalk-solo`** — FARTHEST RUN, lanes, max (`core/boards.js`; THE BOARD shows no JAYWALK tab until go-live).

### PLAY AGAIN after a solo run — THE INSTANT AGAIN (`js/games/kit/again.js`; docs/cartridge.md; H3's "HOP AGAIN" — the owner, H4: PLAY AGAIN everywhere)
One tap → the next run with NO walk inside: the cartridge's PURE **`soloAgain(game, { matchId, now })`** (`director.js#nextRun`) gives the
next run's game and ONE room update swaps it in — **every run its own match** (its own id, proof node, night record, report). The match
id changes, so the app remounts the view; **the night scene stays warm** over it (its WebGL context + models are parked for ≤ 2.5 s and
taken back — only on an instant again; any other unmount frees it at once). The last 4 runs' proof nodes stay in the room (a queued report
still finds them). **Measured (the emulators, Chromium): 65–68 ms from the tap to a course ready to hop** — on a real network add GO's
round trip (the write + the read back). The chosen path: a new match per run through this instant start — not "several runs inside one
match" (that would need its own night records + report path) and not the console's PLAY AGAIN (THE SOLO START: ~2 s).

### THE END SCREEN (`victory.js` — `finalScene`, inside the console's podium frame)
- **HOW YOU WENT OUT, in big neon words** — one line per cause + vehicle (`causes.js#CAUSE_LINES`): FLATTENED BY A SEDAN · CLIPPED BY A
  HATCHBACK · FLATTENED BY A TAXI · RUN DOWN BY A VAN · FLATTENED BY A BOX TRUCK · SWEPT AWAY (the water) · CARRIED OFF BY A LOG (the
  edge) · HIT BY THE 6:15 (the train) · THE LIGHTS WENT OUT (the blackout) · BUZZED BY THE BLACKBIRD · **ABDUCTED** (THE UFO — H6A; it was
  BEAMED UP) · **MADE IT TO THE MOTHERSHIP** (H6A — a finish line: on your own screen "YOU MADE IT TO THE MOTHERSHIP", gold; it was TAKEN AT LANE n — **nothing a player reads says TAKEN**).
- **THE CAUSE LINE NAMES THE VEHICLE THAT HIT YOU (H4 add-on — the owner was hit by a truck and read "HIT BY A CAR"; it was the LAB's
  own table):** **ONE SOURCE OF TRUTH for which vehicle a car is — `causes.js#vehicleAt(course, lane, j)`**, from the course's seed
  (a 1-cell mover = a sedan / a hatchback / a taxi, 2 cells = the van, 3 = THE BOX TRUCK). **THE DRAWING reads it** (`night.js`: the
  model drawn IS the kind) **and THE WORDS read it** (`hitVehicle` — the mover on the kid at the tick he went out, the engine's own box;
  were none found, the nearest on the lane — → `runLine(course, the run's end)`): the game's views (`view.js#lineOf`), the podium
  (`victory.js#endOf` from the result row's `y · px · e`) **and THE LAB** (`lab.js`: `runLine(course, live)` — its own CAUSE table is
  gone) all come through `runLine`. **There is NO generic "HIT BY A CAR" line anywhere** (`CAUSE_LINES` has none; a car hit is always
  one of the five vehicles; the train is THE 6:15). `tests/jaywalk-causes.test.mjs`: for EVERY vehicle kind a real run hit by it →
  the line names that exact vehicle through the game's path AND the lab's; the lab check does it in a real page (all five).
- the lanes (big), then **YOUR BEST · n** (what the server last told this phone) or **NEW BEST** (a moment + the `new-best` sound) — only
  from the SERVER's own answer for that match (`profile/queue.js`'s outcome); `/api` down = just the lanes.
- **THE HEADER (H5B — the owner):** the frame's top line reads **JAYWALK · SOLO** / **JAYWALK · MATCH** as a real header (the display face, 900, ≈ 20 px at 390 — `.jw-final .final > .sheet-kicker`; one line between the corner buttons; no pill). THE END-SCREEN BUTTONS become one shared standard for every game ("the hero bar") — the CITY chat builds it in the console's frame; JAYWALK builds none of its own.
- the foot (the console's): **PLAY AGAIN** (the main tube, first) · **SHARE** (THE SHARE IMAGE — below) · **BACK TO THE CITY** — the
  non-pill tubes. No winner
  sting over it (`OWN_VICTORY_SOUND`), no confetti, the HUD off; `ACCENT` = the signs' pink. No pills, no dev text, no emoji.
- **YOUR TABLE** (under the best, once the server has answered): you + your friends' JAYWALK bests as slim cards (`ui/strip-board.js`,
  THE LIVE LANE), best first, ≤ 4 rows (you always among them), only when a friend has a best — `/api/profile { action: 'table', b }`
  (`api/_lib/friends.js#boardTable`: the friends YOUR OWN list names, ≤ 12, the board ids — never a pid).

### HOW TO PLAY (`ui/help.js#RULES.jaywalk` — moved in at THE GO-LIVE PASS; H3 built it in the cartridge, out of the full boot)
`RULES.jaywalk` (one line + HOW TO MOVE · WATCH OUT — TEN short lines a kid can read: the review's nine + the go-live's KEYBOARD line
(the arrow keys or WASD, SPACE hops — `controls.js#KEYS`), one small drawing each through the shared help's `pics` list + `.help-pics` in
`css/components.css` — the help opens before the cartridge loads) + `TAB.jaywalk 'JW'`. `js/games/jaywalk/help.js` + the cartridge's hub
registration are deleted; `ui/help.js#hub` stays for the next game being built.

### WHAT WAITED FOR GO-LIVE — ALL DONE (THE GO-LIVE PASS, Nov 17: `tests/registration.test.mjs#JAYWALK_WAITS` is EMPTY)
`meta` (registry META at boot) · `help` (ui/help.js RULES + TAB) · `art` (ui/game-art.js `ART.jaywalk` — THE SIGNAL's two paths lit on a night
crossing, an SVG — it reads at 72 pt) all landed in the boot within THE BOOT BUDGET (CITY F's trim freed the room; the budget never raised —
307 / 310 modules, 19.7 KB of room after). + THE BOARD's sixth tab (`board/view.js#TABS` — the registration cross-check now names a missing
tab). The signs' stand-in row (`harbor-neon.js#JAYWALK_SIGN`) is gone: `signRoster` = the playable games.

## THE ASSETS (H2 — `scripts/build-jaywalk-assets.py` COPIES the owner's delivery; the originals in Downloads are only read)
- `assets/jaywalk/models/` — **Kenney's 12 models (CC0)**: car-sedan · car-hatchback · car-taxi · car-van · train-front · train-carriage ·
  bush-planter · street-lamp · traffic-cone · traffic-barrier · trash-dumpster · crate-box + `LICENSE.txt` (the four kits': Car Kit 3.1,
  Train Kit 1.1, City Kit Suburban 2.0, City Kit Roads 2.2). **RE-PACKED**: every node flattened into ONE mesh, the kit's colormap BAKED INTO
  VERTEX COLOURS (the colormap is a palette — every face sits on one swatch; the four kits' colormaps DIFFER, so one shared texture was never
  possible: none ships), tangents + UVs dropped, int16 positions + int8 normals (`KHR_mesh_quantization` — still plain glTF 2.0), a car's
  body PAINT marked in `COLOR_0`'s alpha (0 = paint). **1,174 KB → 276 KB.** Kenney's two trees are NOT used. Credit: "3D models: Kenney —
  kenney.nl (CC0)" (the game's credits: H6). **The scene fetches 10 of the 12** (H2B — `models.js#SCENE_MODELS`: the crate + the jersey
  barrier stay in the folder for H5's DOCKS, unfetched).
- `assets/jaywalk/skyline-night.webp` — the band (the lower 60 % of `backdrop\skyline-night.png`, 1280 × 432, q95): **66 KB**.
- `audio/jaywalk/` — every pick + every `-b` backup (15 MP3s — H4: the two RESPAWN takes left with respawn) + the two train bells as **16-bit mono WAV** (the delivery's exact sample
  counts: the whole file is the loop — MP3 / AAC padding would click) + `CREDITS.md` (every file's source; three are CC BY 4.0 — credit
  required when they ship in play): **594 KB**. The unpicked takes leave once the owner has chosen.
- **H5A — three more models (all CC0, COPIED by the same script: `--only=kid,landmarks`; the originals only read):** `kid.glb` —
  Kenney's Mini Skate 2.0 "character-skate-boy": 325 KB → **33 KB** (825 vertices, 722 triangles; ONE mesh, the colormap in vertex
  colours, the PAINT = the shirt (the delivery's material "top") + the whole cap (the head's faces on the colormap's right-hand
  column), each vertex's bone in the normal's 4th byte (`_BONE`), THE POSES in the file's own buffer (`extras.poses`: 41 frames ×
  7 bones × 3 rows of 4 floats); the other 33 clips, the texture, the UVs, the weights do not ship) · `lighthouse.glb` — MaverickFX
  "Light House" (poly.pizza/m/KRebJXIRb8): 279 KB → 103 KB (its texture is a palette: vertex colours) · `fishing-boat.glb` —
  Kenney's Watercraft Kit 2.1: 25 KB → 8 KB. + `LICENSE-kid.txt` · `LICENSE-lighthouse.txt` · `LICENSE-kenney-watercraft.txt` ·
  **`CREDITS.md`** (the credit lines for the game's CREDITS — H6: "3D models: Kenney — kenney.nl (CC0)" · "Light House: MaverickFX —
  https://poly.pizza/m/KRebJXIRb8 (CC0 1.0)"). The 12 older models are byte-for-byte unchanged. `MODEL_REV` 2. The flyers
  (`models\flyers\`): H6A — below.
- **H6A — THE FLYERS (`--only=flyers`; CC BY — their credit is REQUIRED: `CREDITS.md` + `LICENSE-flyers.txt` + `ui/credits.js` "JAYWALK — 3D models"):** `blackbird.glb` — Kiiba's "Sr-71" (Sketchfab, CC BY 4.0; Grok's delivery recoloured it near-black): 271 KB → **119 KB** (4,993 triangles; its ten parts as ONE mesh, each its material's own near-black in vertex colours — lifted a little off pure black so the scene's lights can shape it; its normal map does not ship; nose at +z, 1 long) · `ufo.glb` — Poly by Google's "Flying saucer" (poly.pizza/m/b0N_HeT_Ttb, CC BY 3.0): 67 KB → **61 KB** (its palette texture → vertex colours; the file has NO normals — computed, smooth under a 42° crease; its three landing legs left out: it flies; 1 across) · `mothership.glb` — Poly by Google's "Flying saucer" (poly.pizza/m/6hu2h8v78mO, CC BY 3.0): 366 KB → **108 KB** (the same treatment). **Fetched ON DEMAND by `flyers.js` alone** — never by `models.js#SCENE_MODELS` / `warmModels`, never at a run's start (the mothership: at a CAPPED run's start). `MODEL_REV` unchanged (no existing file was replaced).
- A model / a sound replaced: bump `models.js#MODEL_REV` / `sfx.js#JW_SFX_REV`. After any change: `node scripts/build-file-hashes.mjs`.

## THE SOUNDS + THE AUDITION (H2 — `sounds.js` (the PURE table) + `sfx.js` + `audition.js`)
- Through the SHARED engine (`audio/engine.js`): the bytes fetched at preload (no AudioContext — nothing sounds before a tap), decoded once at
  the unlock, each sound a buffer source → its gain → a soft limiter (−8 dB, 8 : 1) + a trim → the console's SFX bus (the Effects slider,
  the toggle, THE ONE MUTE, THE CUT). **8 VOICES by PRIORITY** (`sounds.js#admit`): a full house drops a new hop; a hit / a splash takes
  the oldest hop's voice. Muted = every hazard keeps its visual tell.
- **THE KID's OWN (H2 — the engine's events, `sfx.js#onEvent`):** `hop` (pitch ± 6 %, gain ± 2 dB a hop) · `land-wood` (a landing on
  a log) · `hit` · `splash` (the water / the edge).
- **THE WORLD's (H5A — the owner picked ALL A; `cues.js` (PURE — no audio, no clock: the view hands it the run after each tick +
  that tick's events) → `sfx.js#onCue`):**
  · **train-bell** — ONE seamless loop (the 16-bit WAV) exactly while a rail lane NEAR the kid (2 behind … 6 ahead) is in its tell
    (its signals flash); **it FADES OUT over 0.5 s** as the train arrives (H5B — `sounds.js#FADE_S`) · **train-pass** — once a pass, the
    tick it begins, panned to the side it comes from; **it never stops dead (H5B)**: its own end ramps out over its last 0.5 s, and a
    stop / a voice a louder sound takes / the unmount ramp the same way (`sfx.js` `v.end` — the gain's ramp, then the source).
    **H5C: the bell is set B's (one take) + THE TRAIN HORN, one blast when a warning starts — "NO WEAK POINTS — THE SOUNDS".**
  · ~~car-pass~~ — **GONE (H5B — the owner, playing H5A: "it's terrible")**: no cue, no row, no fetch, no file (the two takes left `audio/jaywalk/`; the builder never copies them again)
  · **horn** — a car closing on a kid STANDING in its lane (its nose within 2.6 cells), **≤ 1 every 3 s**, from its side — **at HALF its level (H5B: gain 1.0 → 0.5)**
  · **lights-die** — THE BLACKOUT takes a lane within 3 of him, ≥ 1.5 s apart (the wall 5 lanes back, the one he is outrunning, is silent)
  · **area-arrive** (H5C — it replaced `landmark`) — an area's gateway (`view.js`, with the name's flash) · **new-best** — YOUR BEST LINE crossed (H4)
  · `respawn` is unused (ONE LIFE). No traffic ambience bed.
- **THE PRIORITY** (`sounds.js` — `pri`): your own hit / splash (4) > the train · the lights dying · a gateway · a new best (3) > a
  the horn (2) > a hop · a landing (1); a sound's own cap (`max`: 1 horn, 1 bell); 8 voices; the soft
  limiter. **The music ducks a little under the train** (`TRAIN_DUCK`: to 0.72 with the bell, back to the level it had 1.7 s after
  the pass / when the bell ends — `audio/music.js#duckMusic`, in the game; the lab has no music). **Only this phone's own LIVING
  kid makes cues** — in a match a ghost makes no sound; a run's end / a new run / the unmount stop the bell + bring the music back.
  **Muted = nothing plays, every hazard keeps its visual tell** (the scene never asks the sounds). The game fetches the take it
  plays (the owner's pick); the `-b` backups still ship for the audition (they leave with H6's mix). The levels are a first mix (H6).
  Tests: `tests/jaywalk-cues.test.mjs` (the limits on real runs: the rail yard, downtown, the blackout).
- **THE SOUND AUDITION** (the lab's SOUNDS button → THE SHEET): every sound, its pick + its backup side by side (PLAY A · PLAY B), the train
  bell as a seamless loop (tap again / STOP THE BELL), USE A · B per sound (remembered on the phone — `jw:lab:snd:<id>`; the game plays the
  choice), **COPY MY PICKS** → one line ("JAYWALK SOUNDS: hop A · land-wood B · …") for the owner to paste into chat (a refused clipboard
  shows the line to hold). The run holds still under the sheet. Every button on its own press + lift.

## THE LAB — https://neonspeakeasy.com/jaywalk-lab.html (+ `?fps=1` · `?gray=1` · `?poster=1` — THE POSTER · `?lane=N` — a look check from lane N, H6B)
The owner tests on his phone on CELLULAR: every JAYWALK pass ships its preview on the LIVE site. `jaywalk-lab.html` at the site ROOT
(deployed — never under tests/), noindex nofollow, its own import map for three.js 0.160.
**OPEN SINCE H2B (the owner, Nov 16 — his brother tests it on his own phone from a shared link): NO owner gate, no sign-in, ZERO server
calls** — the page never loads Firebase and never calls `/api`; it fetches only its own files, three.js (its CDN) and the fonts, then runs
the pure engine in the tab. **UNLISTED: nothing links to it** (no page, no script, no manifest — `tests/jaywalk-lab.test.mjs`); **no room,
no database writes of any kind**. Everything on it stays (SOLO · MATCH · DAILY, ZOOM, ANGLE, SOUNDS, NEW SEED, `?fps=1`). Two honest
footnotes: the shared audio engine reports a cut only from the owner's phone inside the app or on a `&debug=1` link — the lab drops that
flag from its own address; and THE SKEW WRAPPER (every dynamic import's rule) asks the deploy's id ONCE if a module ever fails to link. A
browser with no WebGL gets the stage + one line saying so. (H1 + H2 had the owner's door: POST /api/admin whoami.)
- **H6A:** the lab shows THE BIG MOMENTS as the game does (the end's words wait for the abduction / the lift — `view.holdMs`); its hooks `setT(t)` · `freeze(on)` · `ufoAt(lane)` · `flight(from)`; the checks' `--h6a[=blackbird|ufo|ship|perf]` (`kit/jaywalk-h6a.mjs`: each moment driven by day + night → `h6a/<group>/`; `perf` = the three moments + the on-demand load under a 4× CPU throttle).
- **H5C:** the checks' `--h5c[=basics|sky|fog|ground|gates|lines|tail]` (the review's shots, day + night → `h5c/<group>/`; the skyline's picker on the page — only the current + the next picture held, the cross-fade; the gate sign's foot above his cap on every gate).
- **H5B:** **LOOK: DAY · NIGHT** (neon-underline tabs, the row above ZOOM; remembered — `jw:lab:look`; `?look=day|night`); the checks' `--h5b[=day|gates|addons]` (the day shots + every gate + the add-ons' shots) and `--perf` by night AND by day.
- **H5A:** the lab draws the new kid + THE AREAS and plays the world's cues (`cues.js`); its checks' `--h5[=kid|areas]` shoots the kid's states (a `hold(k)` hook holds him mid-hop) + every area and gateway.
- `lab.js`: the run loop (the frame clock → ticks; the rules never read it; **tick 0 = the first touch**), the lane count (big, top), SOLO ·
  MATCH · DAILY (neon-underline tabs), NEW SEED, on an end ONE tap = PLAY AGAIN (a new seed; the end's words are the game's own cause lines), **the run REPLAYED after each end** (✓ REPLAY =
  LIVE, or a RED line — the owner's determinism check on a real iPhone), the seed (top right), the fps readout only with `?fps=1`.
  **H2:** THE NIGHT LOOK by default (`?gray=1` = H1's graybox, for comparison — only the look asked for is fetched; it follows the same
  camera) · **H2B: ZOOM 7 · 8 · 9 + ANGLE STRAIGHT · TURNED** (neon-underline tabs, the row above the modes; remembered — `jw:lab:zoom` /
  `jw:lab:angle`; `?zoom=7|8|9` + `?angle=straight|turned` for a link; the WIDTH switch is retired) · **SOUNDS** (the audition — the top
  left corner, off the play) · the automatic tiers (`?tier=0|1|2` pins one — the
  pass's measure) · the shared audio engine installed after the door (its own leave report is the only other thing the page may ever send —
  the owner's phone in the app, never from the lab: above). The lab's memory = `lab-prefs.js` alone (`jw:lab:*`).
- `graybox.js` (three.js — graybox only, no art, no sounds): **THE CAMERA = camera.js** (H2B — the same zoom, follow + turn as the night
  look; H1's proven rig), the skyline band's
  space at the top (an empty dark band — 24 %) + the bottom blackout gradient (screen-space), ≈ 14 playable lanes on screen. Flat boxes per lane
  kind; the kid a box in his colour; cars / logs / trains boxes; the train's signal lights; the runway lights racing to the crossing + THE
  BLACKBIRD; THE UFO a disc + its beam circle; the wall a darkening band. **30 lanes pooled, everything that repeats INSTANCED (8–11 draw
  calls)**; the view interpolates between ticks.
- `controls.js` (EVERY TAP ACTS): a TAP fires on release (< 12 px) · a SWIPE fires the moment it crosses 18 px · a short flick between the two
  is its swipe · swipe down = back · the play area keeps its own pointer events (`data-tap-own`), never a `click`; no page scroll / zoom /
  selection. Desktop: the arrows / WASD / space.
- **Locally** (the pass's own checks — never the live site): `http://localhost:5173/jaywalk-lab` (no door to skip any more; the checks'
  `?emu&preview=1` is harmless). `node tests/integration/jaywalk-lab.mjs "<chromium>" [outDir] [--perf] [--webkit]
  [--look] [--h3]` (`--h3` = H3's three shots only: the water + the logs, a car from behind, the truck);
  **the SOLO GAME's own check** (the emulators): `node tests/integration/e2e-jaywalk.mjs "<chromium>" [outDir] [--perf]`;
  the lab's (the night look, each ZOOM + both ANGLES, the kid's height, the follow at both edges + a log ride, the lanes behind him, every
  tap, REPLAY = LIVE, the audition, the graybox behind `?gray=1` on the same camera, the sizes; `--perf` = every tier at 1× + 4× CPU at
  ZOOM 8 TURNED + a screenshot's own hitch + THE AUTOMATIC TIER STEP under a heavy throttle; `--webkit` = Playwright's WebKit as an
  iPhone; `--look` = the shots only); THE PAGES LOAD covers
  `/jaywalk-lab` (a stranger gets the lab's stage — no door, no page error).
- **Measured (H1, 390 × 844 @3, 4× CPU, the bot playing):** 59.9 fps · 16.7 ms a frame (p95 16.8, worst 17.0) · 1.2 ms of work a frame (p95
  1.8) · 8 draw calls, ~1,200 triangles.

## REAL vs PLACEHOLDER after H6B
*(H6B made REAL: the painted night skylines, the look switch's cross-fade, the gate sign's approach, the chips, the solid UFO + the kid into its hatch, the Blackbird's burners, the kids into the Mothership's port, DOWNTOWN's storefronts, the tail light bar, THE MIX (measured), NEW BEST's B take, THE CREDITS. **No placeholder is left in the game.** What still waits: the owner's EAR on the mix (measured, never heard on a phone), the `-b` backups of the hop / the landing / the train pass in the audition (the owner picked all A), every number in `tuning.js` + `CLOCK` (first-pass feel — tune from real phones), the daily (DAILY A / B), the go-live flip (the review → the fix pass).)*
*(H6A made REAL: THE BLACKBIRD, THE UFO + THE ABDUCTION, THE MOTHERSHIP + its finish, their cause words, the four cards' flags + BEAM ME UP's card, YOUR BEST ANYWHERE. Still PLACEHOLDER / first-pass: the three moments' SOUND LEVELS (nobody has heard them — the mix is H6B's), DOWNTOWN's code-built edge shops, the daily. The lists below are H5C's + H5B's, still true otherwise.)*
*(H5C made REAL: the painted day skylines, the far edge, the fog bank's look, the day shadows + ground, the gate signs, the gold tape, the train sounds set B + the horn + the area arrival. Still PLACEHOLDER: the three flyers + their cause lines (H6), DOWNTOWN's code-built edge shops, the mix. The list below is H5B's, still true otherwise.)*
REAL: the rules (ONE LIFE), the course, the modes, the wall, the replay + its bounds, THE JUDGE, the server's verify + THE SPEED CHECK +
THE DROPPED SIGNAL, the moments' detection, the cartridge's frame + director + ranks, the proof node + its rules, the controls; the night
look (the ground + THE WATER, the cars + THE TAXI + THE BOX TRUCK, the logs, the trains, the trees + props, the skyline, THE BLACKOUT),
THE CAMERA, **THE KID (Kenney's skate boy — H5A)** + the hop + the hits (THE FLATTENED KID), **THE 8 AREAS (their mixes + their night look + the gateways — H5A)**, **EVERY SOUND IN PLAY (H5A)**, **THE DAY LOOK + THE FOG BANK + THE LANDMARKS IN THE SKYLINE + the gates' hero pieces (H5B)**, the
audition; **THE SOLO GAME** and **THE MATCH** (GO from the first GO, the ghosts, the live order, out = Call the Winner + watching, the
end, the podium, the server's replay of everyone, the guests counted) — on the owner's phone / in the owner's room only; THE SHARE
IMAGE; THE SIGNAL; THE POSTER's render. PLACEHOLDER: THE BLACKBIRD (a dark dart) + THE UFO (a disc + its beam ring) + THE MOTHERSHIP
(a green beam + "TAKEN AT LANE n") + their cause lines — H6; the daily; every number in `tuning.js` (first-pass feel) + `CLOCK` (2 s
ahead / 8 s behind / 75 s drop / 15 s catch-up — tune from real phones); the ghosts' `CATCH_MS` / `HELD_SHOW_MS`; the sounds' levels (the mix: H6 — with it the `-b` takes leave); Grok's new train bell + train horn (not delivered when H5B ran); the day look's palette + the landmarks' drawings (first-pass — the owner judges them on his phone); each area's lean (`AREAS` — first-pass feel); no tile; the train's name ("THE 6:15");
the poster's hero camera (`POSTER.hero` — the owner judges the frame).

## THE RULES FROM CLAUDE.md (moved Nov 18)
DAILY A made room in CLAUDE.md (its 40 KB cap) for DAILY BEST's line: these two lines moved here VERBATIM; CLAUDE.md keeps a short pointer each.

- JAYWALK's SOLO RUN (H3): THE COURSE IS PICKED AFTER GO (`logic.js#seedOf` — hash(code + matchId + the server's GO time)); played on the SERVER's clock, never paused; the proof = server-stamped chunks; counted ONLY from the server's replay (`api/_lib/jaywalk.js#verifyNode` — a log AHEAD of the clock refused, one BEHIND cut); PLAY AGAIN = THE INSTANT AGAIN (`kit/again.js`); THE LINES (YOUR BEST gold · the next friend's — `lines.js`) from the server's table, asked ONCE a run → docs/jaywalk.md "THE SOLO GAME" + "THE LINES".
- JAYWALK's MATCH (H4): ONE LIFE EVERYWHERE (no lives / respawn / blink / one-up); the course + tick 0 from THE FIRST GO (`logic.js#matchStart`); the ghosts = the others' hop logs through the same engine; counted ONLY from the server's replay of every proof node (`jaywalkMatch`) — ONE judge (`replay.js#judgeRun`); THE DROPPED SIGNAL (a silence + a catch-up burst never costs a run, a growing lag is slow motion); THE CAUSE LINE NAMES THE VEHICLE (ONE source: `causes.js#vehicleAt` → `runLine`, no generic line) → docs/jaywalk.md "THE MATCH".

CITY H2 (Nov 18) made room in CLAUDE.md for THE YOU ROW + THE GAMES LIST ORDER + NEVER A DEAD SCREEN: these two moved here VERBATIM; CLAUDE.md keeps one pointer for both.

- JAYWALK's FAR EDGE + THE FRESH-EYES REVIEW (H5C): the day band = a PAINTED skyline per area (`skyline.js`), solid down to THE SEA WALL (nothing half-see-through over the backdrop); a line's words draw above everything but your own kid; EVERY JAYWALK pass ends with a fresh-context reviewer over the full day + night shot set, its report verbatim in the pass log → docs/jaywalk.md "NO WEAK POINTS".
- JAYWALK's FINISH (H6B): the band's pictures are PAINTED in BOTH looks (no light blinks on a landmark: `SKY_OFF`); THE GATE SIGN only on the approach (gone 3 lanes out); a cue's level only in `sounds.js` / `flyers.js#MIX`, measured (`jaywalk-mix.mjs`) → docs/jaywalk.md "THE FINAL POLISH".

## THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I, THE CLAUDE.md TRIM: the text CLAUDE.md held, verbatim)
CITY I brought CLAUDE.md from 40.9 KB to under 32 KB: these standing-rule lines moved here word for word; CLAUDE.md keeps ONE short line pointing at this heading.

- JAYWALK: the rules PURE + CROSS-ENGINE SAFE (integers + Math.floor — no sin / cos / pow / sqrt, never Math.random / Date.now / a
  frame clock); a lane = f(seed, index), a hazard = f(lane, tick); a result = THE REPLAY of the hop log; every pass ships its preview at
  /jaywalk-lab (OPEN since H2B: no gate, ZERO server calls, no writes, noindex + unlisted) — never a 192.168 / tests/ link in a summary → docs/jaywalk.md.
- JAYWALK's SOLO RUN (H3): THE COURSE IS PICKED AFTER GO (`logic.js#seedOf`); the SERVER's clock, never paused; counted ONLY from the server's replay of the server-stamped chunks (`api/_lib/jaywalk.js#verifyNode`); PLAY AGAIN = THE INSTANT AGAIN; THE LINES → docs/jaywalk.md "THE RULES FROM CLAUDE.md (moved Nov 18)".
- JAYWALK's MATCH (H4): ONE LIFE EVERYWHERE; the course + tick 0 from THE FIRST GO; ONE judge (`replay.js#judgeRun`); THE DROPPED SIGNAL; THE CAUSE LINE NAMES THE VEHICLE (`causes.js#vehicleAt`) → docs/jaywalk.md "THE RULES FROM CLAUDE.md (moved Nov 18)".
- JAYWALK's GHOSTS (H4B): a ghost = the engine's state AT THE WORLD's TICK (`ghosts.js`: no hop assumed, a late hop catches up, a death once their `e` confirms it); a match's GO = a transaction never applied locally, THE NODES ARE THE TRUTH (`logic.js#startOf`) → docs/jaywalk.md "THE GHOSTS".
- JAYWALK's LOOK (H2) is a VIEW (`night.js` — draws from (run, course), never writes; instanced, no point light, no bloom below the top
  tier); THE CAMERA = ONE pure module every view shares (`camera.js` — ZOOM columns, the follow, the turn; swipes screen-relative); its files
  only through `scripts/build-jaywalk-assets.py` → docs/jaywalk.md "THE CAMERA".
- JAYWALK's LOOKS (H5B): DAY + NIGHT are ONE scene (`night.js#setLook` — a VIEW: no rule / replay / server file knows the look; the phone's GAME LOOK read live; THE FOG BANK = the blackout by day); BLUE ON THE GROUND = WATER, NOTHING ELSE (the friend line = a pink tape between posts); the rail signals flash ONLY in the tell → docs/jaywalk.md "THE DAY LOOK" + "BLUE ON THE GROUND".
- JAYWALK's FAR EDGE + THE FRESH-EYES REVIEW (H5C) · FINISH (H6B) → docs/jaywalk.md "THE RULES FROM CLAUDE.md (moved Nov 18)" (moved for CITY H2).
- JAYWALK's AREAS (H5A): the lean = RULES (`tuning.js#AREAS`; the sims green in all 8); the look = a VIEW (`areas.js`): an obstacle drawn ONLY where the rules have one — nothing covers a play column; sounds only through PURE `cues.js` → docs/jaywalk.md.
- JAYWALK's BIG MOMENTS (H6A): THE BLACKBIRD · THE UFO · THE MOTHERSHIP = ONE view module ON DEMAND (`flyers.js`; a moment = f(the rules' tick)); THE MOTHERSHIP is A FINISH LINE (never "TAKEN"); the cards' flags + YOUR BEST only from the server's replay → docs/jaywalk.md "THE BIG MOMENTS".
- JAYWALK's END SCREEN RESTS THE SCENE (H6B): behind an end screen the 3D scene is a small still (`night.js#rest`); the run's picture = ONE cropped canvas; THE FINAL SCREEN's BUDGET (`kit/jaywalk-mem.mjs#JW_FINAL_BUDGET_MB` — raising it = a named decision) → docs/jaywalk.md "THE END SCREEN's MEMORY".
- JAYWALK BEFORE THE FLIP: the game never reads the lab's prefs; a teardown never reports a lost context (listeners off first); a resize only ASKS, draw() resizes → docs/jaywalk.md.
- JAYWALK's RECORDER + JUDGE = ONE BOUND (`engine.js#inputProblem`); the count's sizes + `skyline.js#SKY_MAX` change together → docs/jaywalk.md "THE GO-LIVE REVIEW".
