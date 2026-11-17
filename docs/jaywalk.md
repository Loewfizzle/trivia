# JAYWALK (id `jaywalk`) — the hop-through-lanes game

**BEING BUILT** (H1 + H2 + H2B + H3 + H4 + H4B + H5A, Nov 16 2026): `config.js` GAMES row `playable: false` + `preview: true` — never offered (docs/cartridge.md "A game
BEING BUILT"). The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 12–16 — DECIDED)" + "H2's DECISIONS" + "JAYWALK (the
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
| H6 | — | — | THE BLACKBIRD / UFO / mothership moments, the feat flags (jaywalk-boom / -ufo / -airfield), the mix, the credits |
| the review → the fix pass | — | — | flips `playable` (empties `tests/registration.test.mjs#JAYWALK_WAITS`; the meta + its tile join the boot — after the city's CHROMEBOOK pass trims THE BOOT BUDGET: the owner, Nov 16) |
| DAILY A · DAILY B | — | — | its daily (`MODES.daily`) |

Art style: **SMOOTH STYLIZED 3D** (the owner, Nov 16 — rounded, glossy, toy-like; the target `Downloads\grok\jaywalk\concept\jaywalk-night-smooth.png`;
this page's layout wins over the render's). The engine never cares. JAYWALK's flying hazards (THE BLACKBIRD, THE UFO) are decided before H6 —
H2 draws PLACEHOLDERS for them.

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
  files for them). **HITS NAME THEIR CAUSE:** `car · water · train · edge · blackbird · ufo · wall`. **TAKEN** = THE MOTHERSHIP's tick
  (a win: "TAKEN AT LANE 212" — in a match it takes whoever is still in at ~6 min: rare, a reward).
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
| `match` | 0.6 → 1.8 lanes / s from 4:00 to 6:00 | tick 21,600 (6:00) — it takes whoever is still in |
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
  taken, hits, feats: { boom, ufo, airfield }, used }` — PURE, the SAME `step` the phone runs. THE LAB shows it after every run (a red line if it ever differs from the live run).
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
  **jaywalk-airfield** — lane 400 in ONE SOLO run.
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
  `LOOKS ['night']` (until H5), `OWN_VICTORY_SOUND`, `ACCENT`, `SOLO: true`, the chat's lock (shut while you hop — open once your run has
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
**The player's real run — every share is a different picture.** `SHOT_MS` 460 ms after the hit the view asks the scene for that frame
(`night.js#snap` — copied off the WebGL canvas in the same frame; kept on the phone until the next run, with where the kid stood:
`shot.js`). 1080 × 1350, drawn ON THE PHONE from the result's PUBLIC fields. Solo (the podium's SHARE) + a match (SHARE MY RUN in the
body). No frame on this phone (a refresh on the podium) → the same card on the night's dark.
- **THE CARD (H4B's add-on, the owner Nov 16 4:33 pm — THE FRAME IS THE HERO):** the frame is the kit's middle at its own size
  (`JW_CARD.box` 984 × 792 — was 800 × 690: `kit/share-run.js#drawRunCard`'s `o.box`), zoomed on the kid + what got him
  (`shotCrop` — `SHOT_ZOOM` 1.12, centred a little above him; THE BLACKOUT's frame far above him: the lit lanes fill it, the dark is
  only its foot) and BRIGHTER (the picture screened over itself — `SHOT_LIFT`; no canvas filter). **The cause line is on the card
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
- **YOUR BEST LINE** (a solo run — and, in a match, your own SOLO best): a glowing **GOLD** line across the WHOLE lane at your best
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
  Crossing it: a small burst + a quiet chime (`landmark` at 0.4), then the next friend above appears. **Never more than ONE friend line
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
  kid's column (transform); its foot fades into the lanes' fog. NIGHT LIFE: 8 aviation lights blink, 5 neon blocks flicker (opacity only;
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
- **THE FOG BANK = THE BLACKOUT by day** — the same wall, the same timing, the same rules (`run.wall`): the lane whitens under it (the
  ground shader's `dk`, soft wisps at its edge), what stands on it whites out (`fogK` 2.4 — the night darkens), a soft white edge where
  it takes a lane, **puffs rolling along its face**, the bank's body behind (the blackout's curtain, pale), the screen's foot fades to
  fog (`.jw-blackout`). Its words: **LOST IN THE FOG** (`causes.js#DAY_LINES` — the same cause `wall`; `runLine(course, r, look)`; by
  night THE LIGHTS WENT OUT). The `lights-die` sound is the same cue.
- **THE GATE by day:** a PAINTED arch — white posts banded in the area's colour, the arch in stripes of it (boxes, never neon) — and the
  area's name in white paint with a dark edge on a band of the area's colour laid across the lane (`areas.js#LOOKS[].paint`).
- **THE SKYLINE:** `assets/jaywalk/skyline-day.webp` (122 KB — the day picture's middle band: the sky + its clouds, the city, the
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
  the corner menu (☰ top-left) + music (top-right) over it, the station's music (`MUSIC 'mood:evening'`), `LOOKS ['night']` (ONE look until
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
  edge) · HIT BY THE 6:15 (the train) · THE LIGHTS WENT OUT (the blackout) · BUZZED BY THE BLACKBIRD · BEAMED UP (placeholders until H6)
  · TAKEN AT LANE n.
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

### HOW TO PLAY (`js/games/jaywalk/help.js` — built OUT of the boot)
`RULES` (one line + HOW TO MOVE · WATCH OUT — seven short lines a kid can read, one small drawing each) + `TAB 'JW'`, in the shared help's
own shape, **ready to move into `ui/help.js`** at go-live. Until then the cartridge registers its body with the help's hub
(`globalThis.__nsHelp.jaywalk` — `ui/help.js#hub`): ☰ → HOW TO PLAY in a run, and the card's HOW TO PLAY, show it.

### WHAT WAITS FOR GO-LIVE (`tests/registration.test.mjs#JAYWALK_WAITS` — THE BOOT BUDGET is full, never raised)
`meta` (registry META at boot) · `help` (ui/help.js RULES + TAB — the content is in `help.js`) · `art` (ui/game-art.js — its tile; the
owner's card shows its neon mark — H4: THE SIGNAL). `smoke` is DONE (H4). `boards` is DONE (H3: `core/boards.js` — a boot file, trimmed to fit: the boot is
6,499.94 of 6,500 KB). Every boot file this pass touched (`boards.js`, `help.js`, `title-taps.js`) was trimmed so the boot did not grow.

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
  (`models\flyers\`) wait for H6.
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
    *Grok's better bell + a train HORN blast (`Downloads\grok\jaywalk\sfx2\`) were not delivered when H5B ran: OPEN for the next pass.*
  · ~~car-pass~~ — **GONE (H5B — the owner, playing H5A: "it's terrible")**: no cue, no row, no fetch, no file (the two takes left `audio/jaywalk/`; the builder never copies them again)
  · **horn** — a car closing on a kid STANDING in its lane (its nose within 2.6 cells), **≤ 1 every 3 s**, from its side — **at HALF its level (H5B: gain 1.0 → 0.5)**
  · **lights-die** — THE BLACKOUT takes a lane within 3 of him, ≥ 1.5 s apart (the wall 5 lanes back, the one he is outrunning, is silent)
  · **landmark** — an area's gateway (`view.js`, with the name's flash) · **new-best** — YOUR BEST LINE crossed (H4)
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

## THE LAB — https://neonspeakeasy.com/jaywalk-lab.html (+ `?fps=1` · `?gray=1` · `?poster=1` — THE POSTER)
The owner tests on his phone on CELLULAR: every JAYWALK pass ships its preview on the LIVE site. `jaywalk-lab.html` at the site ROOT
(deployed — never under tests/), noindex nofollow, its own import map for three.js 0.160.
**OPEN SINCE H2B (the owner, Nov 16 — his brother tests it on his own phone from a shared link): NO owner gate, no sign-in, ZERO server
calls** — the page never loads Firebase and never calls `/api`; it fetches only its own files, three.js (its CDN) and the fonts, then runs
the pure engine in the tab. **UNLISTED: nothing links to it** (no page, no script, no manifest — `tests/jaywalk-lab.test.mjs`); **no room,
no database writes of any kind**. Everything on it stays (SOLO · MATCH · DAILY, ZOOM, ANGLE, SOUNDS, NEW SEED, `?fps=1`). Two honest
footnotes: the shared audio engine reports a cut only from the owner's phone inside the app or on a `&debug=1` link — the lab drops that
flag from its own address; and THE SKEW WRAPPER (every dynamic import's rule) asks the deploy's id ONCE if a module ever fails to link. A
browser with no WebGL gets the stage + one line saying so. (H1 + H2 had the owner's door: POST /api/admin whoami.)
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

## REAL vs PLACEHOLDER after H5B
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
