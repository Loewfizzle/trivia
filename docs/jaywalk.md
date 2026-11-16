# JAYWALK (id `jaywalk`) — the hop-through-lanes game

**BEING BUILT** (H1, Nov 16 2026): `config.js` GAMES row `playable: false` + `preview: true` — never offered (docs/cartridge.md "A game BEING
BUILT"). The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 12–16 — DECIDED)". This page = the rules, the modes table, the
engine's contract, the replay + the proof, the lab page, what each later pass adds. Read it before a JAYWALK pass.

Tap = hop forward · swipe = sideways · swipe down = back. 9 columns. No coins, no pickups — just distance. Rendered on three.js 0.160 (the
import map); the RULES are a pure engine that never knows about it.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| H1 | Nov 16 2026 | `docs/games/passes/jaywalk-h1.md` | the pure engine, the replay + the server half, the hidden cartridge + the proof node (`jw`), THE JAYWALK LAB's graybox |
| H2 | — | — | the night look (THE BLACKOUT) + the kid + the hop feel + the sound audition; its tile (`ui/game-art.js`) |
| H3 | — | — | solo endless: PLAY NOW, the solo best through `/api/report` (`verifyRun`), its boards, HOW TO PLAY |
| H4 | — | — | multiplayer: the real match screen (GO + the chunks written to the proof node), the ghosts, the host's replayed end, the smoke START |
| H5 | — | — | the day look (the FOG BANK) + the landmarks' looks |
| H6 | — | — | THE BLACKBIRD / UFO / mothership moments, the feat flags (jaywalk-boom / -ufo / -airfield), the mix, the credits |
| the review → the fix pass | — | — | flips `playable` (empties `tests/registration.test.mjs#JAYWALK_WAITS`; the meta joins the boot — a named raise of THE BOOT BUDGET) |
| DAILY A · DAILY B | — | — | its daily (`MODES.daily`) |

Art style (chunky premium voxel vs smooth stylized) is decided before H2 — the engine never cares.

## THE RULES (js/games/jaywalk/ — `tuning.js` holds EVERY number)
- **THE FIXED STEP:** the rules count TICKS, 60 a second (`TICK_HZ`); a hop = `HOP_TICKS` 8 = 133 ms. The rules NEVER read Math.random /
  Date.now / performance.now / a frame clock, and use **integers / fixed point (`FP` 1000 = a cell) with + − × ÷ + Math.floor only — no
  Math.sin / cos / pow / exp / sqrt** (V8 and JavaScriptCore may differ in the last bit; the phone and the server must agree hop for hop).
  `tests/jaywalk-engine.test.mjs` greps the four rules files for all of it. The view may use anything.
- **THE LANES** (`course.js#buildLane(seed, i)` — a PURE function of the seed + the lane's index, built alone, in any order, on the phone or the
  server; ALL randomness = `core/rng.js` seeded per lane, `hashString(seed + ':' + i)`):
  **grass** (+ obstacles — never on the centre column, never beside water) · **road** (cars) · **water** (logs 2–4 cells; the water kills; two
  water lanes side by side always run opposite ways; never more than 3 in a row; a log carrying you off the screen edge = a hit) · **rail** (a
  train: the signal lights 1 s first, then a long fast body) · **THE FLIGHT PATH** (`flight` — a band of 2 lanes sharing ONE pulse: THE
  BLACKBIRD's tell 1.8 s (never under 1.5 s — `MIN_TELL_TICKS`), then a 0.2 s pass) · **THE UFO** (not a lane: a zone of 8 grass / road lanes
  it drifts over on a slow diagonal; its beam circle, radius 1.25 cells, on the ground = the warning; stepping in = abducted).
- **A HAZARD's POSITION = a pure function of (lane, tick)** — `moverLeft` (cars, logs), `pulseAt` + `pulseLeft` (trains, THE BLACKBIRD:
  idle → tell → pass), `ufoX` / `ufoY`. No per-tick simulation is needed to know where anything is.
- **THE KID is the only thing stepped** (`engine.js#step(run, course, d)`): a hop in flight (a straight line; its lane is the one it left for the
  first half, the one it lands on after), ONE buffered hop, riding a log (carried with it), lives, the blink, the wall, `idle | hop | down | out |
  taken`. A hop into an obstacle / past an edge / behind lane 0 is a **bump** (refused). The kid's box against cars / trains is 0.6 of a cell.
- **THE COURSE's DIRECTOR:** the SAME difficulty curve on every course — **HEAT** by lane index (`heatAt`: 0 → 1000 at lane 400 → on to 1600 at
  lane 640): the lane mix (less grass, more water + rail), the cars' speed + gaps, the logs' length + speed, the trains' lap, the chance of a UFO
  / a flight path. **The opening is calm:** lanes 0–3 plain grass, no water before lane 12, no rail before 25, the wall waits 3 s. **THE UFO**
  from lane 100, **THE BLACKBIRD** from 150 — rare, from the seed, **never both in one stretch** (a stretch = the 50 lanes after a landmark —
  `course.js#specials`). **THE FIXED LANDMARKS** every 50 lanes (a plain marked lane, named — `LANDMARKS`): 50 THE DOCKS · 100 THE FISH MARKET ·
  150 THE RAIL YARD · 200 THE BRIDGE · 250 DOWNTOWN · 300 THE CANAL · 350 THE LIGHTHOUSE · 400 THE AIRFIELD → the loop again, harder.
- **THE WALL** (night: THE BLACKOUT · day: a FOG BANK): a steady pace, never more than 5 lanes behind the kid's BEST (no banking distance);
  the kid's centre behind its edge = a hit.
- **HITS NAME THEIR CAUSE:** `car · water · train · edge · blackbird · ufo · wall`. With lives left: 0.75 s down, then a respawn on the nearest
  SAFE lane (plain grass no beam reaches; never closer than 7 lanes ahead of the wall; a tie → the lane behind — a respawn gives no free lane)
  + a 2 s blink (nothing hits). Out of lives = out. **TAKEN** = THE MOTHERSHIP's tick (a win: "TAKEN AT LANE 212").
- **RANKING** = lanes reached (the farthest lane LANDED on), the EARLIER tick wins a tie.
- **THE ONE-UP:** built behind ONE switch, `tuning.js#ONE_UP`, **OFF**. If ever on: multiplayer only (`MODES.match.oneUp`), rare, from the seed
  (lane 60+, on free grass), never above 3 lives; the switch moves nothing else on the course.
- **EVENTS** (for the view + the sounds — `step(…, ev)`): hop · bump · land (`ground | wood | water`) · best · landmark · near (a car within a
  cell) · beam (THE UFO's beside the kid) · boom · oneup · hit · respawn · out · taken. The WORLD's own moments (a train's tell, THE BLACKBIRD's
  tell + pass) are `pulseAt(lane.pulse, tick)`.

### THE MODES (`tuning.js#MODES` — all tunable in one place)
| mode | lives | the wall | THE MOTHERSHIP (`cap`) | the one-up |
| --- | --- | --- | --- | --- |
| `solo` — SOLO ENDLESS | 1 | 0.6 lanes / s, never faster | never | never |
| `match` | 3 (the host's option: 1) | 0.6 → 1.8 lanes / s from 4:00 to 6:00 | tick 21,600 (6:00) | if the switch is ever on |
| `daily` (built later — DAILY A / B; its 1 life is a placeholder) | 1 | 0.6 → 1.8 from 3:00 to 5:00 | tick 18,000 (5:00) | never |

### FAIR BY CONSTRUCTION (`tests/jaywalk-sim.test.mjs` + `jaywalk-deep.test.mjs` — 2,000 seeds per mode)
Every lane has a crossable window: a car gap is never under 2.6 cells + what the car covers in 26 ticks; logs 2–4 cells with ≤ 9 cells of open
water between two, adjacent water lanes opposite ways, no obstacle beside water; a train / THE BLACKBIRD leaves quiet time in every lap; the
centre column of every grass lane is free. THE BLACKBIRD's tell ≥ 1.5 s every time. A UFO's beam always drifts on (both speeds non-zero) and
its zone holds no water / rail. Respawn lanes are safe for the blink. A greedy bot + a random bot play whole runs through the real engine.

## THE REPLAY + THE PROOF
- **THE HOP LOG** = `[{ t: tick, d: 'u' | 'l' | 'r' | 'd' }]` — the ONLY input. A hop logged at tick t is applied IN tick t.
- **`replay.js#replay({ seed, mode, log, oneUp, lives?, until? })`** → `{ lanes, tick, end, over, cause, lives, taken, hits, feats: { boom, ufo,
  airfield }, used }` — PURE, the SAME `step` the phone runs. THE LAB shows it after every run (a red line if it ever differs from the live run).
- **THE LOG's BOUNDS** (`replay.js#logProblem` — the server refuses, the phone's recorder `engine.js#canLog` never makes one): ticks strictly
  rising · inputs ≥ 2 ticks apart, ≤ 20 a second · no hop at / past the cap · ≤ 60,000 hops (a capped mode: cap / 2).
- **THE PACKED LOG** (`packLog` / `unpackLog` / `logFromChunks`): a hop = its direction's CAPITAL + the ticks since the hop before, base 36 —
  `U0R1cU9`. The proof node's chunks joined = the log.
- **THE SERVER HALF** — `api/_lib/jaywalk.js#verifyRun` (NOT a function: the 8 stay 8; never imports fb.js): the bounds + the replay → the
  server's own result; + "a hop logged after the run ended" refused. **Wiring it into `/api/report` + the solo best = H3 / H4.**
- **THE CARD MOMENTS** (detected by the replay; the flags ship in H6): **jaywalk-boom** — STANDING ON a flight-path lane at the tick its tell
  BEGINS, off the band for the whole pass, not hit before it (stepping on during the tell, or staying / blinking through the pass, never counts)
  · **jaywalk-ufo** — the beam came within a cell of the kid (not blinking) and THAT UFO never took them (the mothership never counts) ·
  **jaywalk-airfield** — lane 400 in ONE SOLO run.
- **THE PROOF NODE** — `rooms/{CODE}/jw/{matchId}/{uid}` = `{ go (the server time, written ONCE at GO — present = proven), c/{i} (the packed
  log's chunks: append only, ≤ 400 chars, i 0–999), e { l, t, w? } (the run's end, once — a signal only: never read as a score) }`. The
  player's own uid + their own match, only while it is on (`play`, or the count's last 2 s); a player never deletes it; the host may delete ONE
  match's node. `api/report.js#PROOF_TREES.jaywalk` (a FLAT tree — GO alone proves a player: silent but present still counts),
  `registry.js#PROOF_NODE_LIST` + `NEW_PLAYER_NODES` (`jw`): a rematch / the next start NEVER wipes the just-finished match's node
  (`host.js#pruneProofs` keeps [previous, new]). **Nothing live writes it before H4** (the view writes GO + the chunks then).

## THE MATCH (the cartridge — hidden)
- `meta.js` (pure): `DEFAULT_SETTINGS { lives: 3 }`, OPTIONS (3 / 1 lives), ~6 minutes, `MUSIC 'mood:evening'`, `LOOKS ['day', 'night']`,
  `SOLO: true` (one player = SOLO ENDLESS, 1 life — `cleanSettings(s, 1)`), the chat's lock (shut while you hop).
- `director.js` (pure): `count` (3 s) → `play` at GO (`game.playAt`; tick 0 = GO: `logic.js#tickAt`) → `final` when every participant's node
  says `e`, or THE MOTHERSHIP's moment + 4 s. **Every patch moves the phase (THE 3 S RULE).** The results = `logic.js#scoreRuns` — THE REPLAY of
  each player's own chunks to that tick (a bad log = a kid who never hopped; a claim is never read). `standings`: lanes, the earlier tick.
- `index.js`: `start` → THE GAME FRAME (`id`, `matchId`, `participants`, `phase`) + a new `seed` every match; `livePaths = { runs: jw/{matchId} }`
  — everyone's hop logs ARE the ghosts (H4); `finalRanks`; `createView` = a STUB (`view.js`) until H2 / H4.
- **Registered** (`tests/registration.test.mjs` checks a `preview` row too): the GAMES row, the registry loader, its tube mark (the signs' pink
  — the city's JAY / WALK), `css/base.css [data-theme='jaywalk']`, STANDINGS + `SOLO_OK`, `PROOF_TREES`, the per-game budget (a new line), the
  preload graph. **WAITING — ONE named list, `JAYWALK_WAITS`:** `meta` (registry META at boot → the go-live pass: THE BOOT BUDGET is at 310 /
  310 modules) · `help` + `boards` → H3 · `art` → H2 · `smoke` → H4. A wait that is no longer missing fails the test; a playable game may keep none.
- The server never credits it until its row is playable (`api/report.js#reportableGame`).

## THE LAB — https://neonspeakeasy.com/jaywalk-lab.html (+ `?fps=1`)
The owner tests on his phone on CELLULAR: every JAYWALK pass ships its preview on the LIVE site. `jaywalk-lab.html` at the site ROOT
(deployed — never under tests/), noindex nofollow, its own import map for three.js 0.160, **owner-gated like /lab** (POST /api/admin whoami →
admin, else the door). **No room, no database writes, no Firebase writes of any kind** — ONE server call (whoami), then the pure engine in the tab.
- `lab.js`: the run loop (the frame clock → ticks; the rules never read it; **tick 0 = the first touch**), the lane count (big, top), SOLO ·
  MATCH · DAILY (neon-underline tabs), NEW SEED, on an end ONE tap = HOP AGAIN (a new seed), **the run REPLAYED after each end** (✓ REPLAY =
  LIVE, or a RED line — the owner's determinism check on a real iPhone), the seed (top right), the fps readout only with `?fps=1`.
- `graybox.js` (three.js — graybox only, no art, no sounds): **THE PROVEN CAMERA** (`CAM`: perspective, fov 54, 16 up / 12 back, looking ~4.5
  lanes ahead — the kid ≈ 64 % down the screen, the 9 columns ≈ 9.4 units wide at the kid; a narrower screen widens the fov), the skyline band's
  space at the top (an empty dark band — 24 %) + the bottom blackout gradient (screen-space), ≈ 14 playable lanes on screen. Flat boxes per lane
  kind; the kid a box in his colour; cars / logs / trains boxes; the train's signal lights; the runway lights racing to the crossing + THE
  BLACKBIRD; THE UFO a disc + its beam circle; the wall a darkening band. **30 lanes pooled, everything that repeats INSTANCED (8–11 draw
  calls)**; the view interpolates between ticks.
- `controls.js` (EVERY TAP ACTS): a TAP fires on release (< 12 px) · a SWIPE fires the moment it crosses 18 px · a short flick between the two
  is its swipe · swipe down = back · the play area keeps its own pointer events (`data-tap-own`), never a `click`; no page scroll / zoom /
  selection. Desktop: the arrows / WASD / space.
- **Locally** (the pass's own checks — never the live site): `http://localhost:5173/jaywalk-lab?emu&preview=1` skips the door (a local emulator
  page only — config.js's rule for a game being built). `node tests/integration/jaywalk-lab.mjs "<chromium>" [outDir] [--perf]` (50 checks +
  shots + the frame-rate measure); THE PAGES LOAD covers `/jaywalk-lab` (a stranger gets the door).
- **Measured (H1, 390 × 844 @3, 4× CPU, the bot playing):** 59.9 fps · 16.7 ms a frame (p95 16.8, worst 17.0) · 1.2 ms of work a frame (p95
  1.8) · 8 draw calls, ~1,200 triangles.

## REAL vs PLACEHOLDER after H1
REAL: the rules, the course, the modes, the wall, the replay + its bounds, the server's verify, the moments' detection, the cartridge's frame +
director + ranks, the proof node + its rules, the controls. PLACEHOLDER: the graybox look (boxes), the end screens' words ("TAKEN AT LANE n"),
the match screen (a stub), the daily's lives, every number in `tuning.js` (first-pass feel — the owner plays the lab, the chat re-tunes), no
sounds, no art, no boards, no HOW TO PLAY.
