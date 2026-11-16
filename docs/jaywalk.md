# JAYWALK (id `jaywalk`) — the hop-through-lanes game

**BEING BUILT** (H1 + H2 + H2B, Nov 16 2026): `config.js` GAMES row `playable: false` + `preview: true` — never offered (docs/cartridge.md "A game
BEING BUILT"). The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 12–16 — DECIDED)" + "H2's DECISIONS" + "JAYWALK (the
owner, Nov 16 — DECIDED, after H2 on his phone)". This page = the rules, the modes table, the engine's contract, the replay + the proof,
THE NIGHT LOOK + THE CAMERA + its assets + the sounds, the lab page, what each later pass adds. Read it before a JAYWALK pass.

Tap = hop forward · swipe = sideways · swipe down = back. 9 columns. No coins, no pickups — just distance. Rendered on three.js 0.160 (the
import map); the RULES are a pure engine that never knows about it.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| H1 | Nov 16 2026 | `docs/games/passes/jaywalk-h1.md` | the pure engine, the replay + the server half, the hidden cartridge + the proof node (`jw`), THE JAYWALK LAB's graybox |
| H2 | Nov 16 2026 | `docs/games/passes/jaywalk-h2.md` | THE NIGHT LOOK (smooth stylized 3D: Kenney's models + the code-built kid / trees / logs, THE BLACKOUT), THE WIDER VIEW (11 seen, 9 played), the kid + the hop's feel + the hits, the sounds in play + THE SOUND AUDITION |
| H2B | Nov 16 2026 | `docs/games/passes/jaywalk-h2b.md` | THE CAMERA (ZOOM 7 · 8 · 9, the sideways follow, the slight turn — `camera.js`, shared with the graybox) + the look fixes (the water, THE LOGS that look like logs, the kid's glow ring + rim, THE BOX TRUCK, THE BARRICADE, no crates, the lamps: two per end, short + soft) |
| H3 | — | — | solo endless: PLAY NOW, the solo best through `/api/report` (`verifyRun`), its boards, HOW TO PLAY |
| H4 | — | — | multiplayer: the real match screen (GO + the chunks written to the proof node), the ghosts, the host's replayed end, the smoke START |
| H5 | — | — | the day look (the FOG BANK) + the landmarks' looks |
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
  310 modules) · `help` + `boards` → H3 · `art` (its tile — a boot file) → the go-live pass · `smoke` → H4. A wait that is no longer missing fails the test; a playable game may keep none.
- The server never credits it until its row is playable (`api/report.js#reportableGame`).

## THE NIGHT LOOK (H2 — `night.js` + `night-fx.js` + `models.js`; the same `draw(run, course, a, dt)` as the graybox)
A VIEW: it reads the run + the course, never writes them; the rules never import it (`tests/jaywalk-night.test.mjs`). three.js 0.160 core
only (no add-on: the GLB reader + the bloom are ours).
- **THE GROUND** — ONE instanced plane a lane, drawn in a shader (`night-fx.js#createGround`): grass (soft patches, darker at a road / water
  edge) · asphalt + curbs + dashed neon-tinted lines between two road lanes · **THE WATER** (H2B — it must read as water at a glance: a
  deep TEAL / blue surface, never black; slow ripples + their bright crests; the skyline's neon in long wobbling streaks; **a bright
  wavering SHORELINE** + a pale shallow wherever it meets anything that is not water; the surface drifts on generated noise — no texture
  file; little sparkles twinkle on it) · rails + sleepers (the rails catch the red signals in the tell) · THE FLIGHT PATH (slate tarmac; the tell = a bright
  chevron band RACING to the crossing + the runway lights) · a landmark's lane (dark paving, a pink trim). Per lane: the BLACKOUT's darkness
  (a cold flicker as its lights die), the tell; per pixel: the edge columns dimmer, the fog.
- **CARS** — Kenney's sedan / hatchback / taxi (a 1-cell car, picked from the seed) + the van (2 cells) + **THE BOX TRUCK** (3 cells — H2B,
  built in code, `models.js#buildTruck`: a rounded cab in the truck's colour with dark glass, a long white box with its stripe, a dark
  chassis, six wheels, a bumper; four amber marker lights along the foot of its side + lit tail lights — the scene's light quads; its drawn
  length = its rules length); a NEON BODY TINT per car from the seed (pink · cyan · violet · coral · blue) — only the model's PAINT takes it (`paintMaterial`
  — the windows, wheels, bumpers keep Kenney's colours). Each car: an additive tapered LIGHT TRAIL in its tint + a blob shadow +
  **ITS LAMPS (H2B add-on): BOTH headlights and BOTH tail lights cast** — `night.js#LAMPS` holds each vehicle's lamps ([half their
  spacing, their height]: the 4 Kenney cars, the truck, the train's front); each headlight = a lamp quad + a SHORT SOFT beam on the road
  (`HEAD_REACH` 1.35 cells — the glow shader's shape 6: a quick falloff, soft edges, low intensity), each tail light = a lamp quad + a
  small red glow (`TAIL_REACH` 0.75). A glow on the road, never a long spotlight. Decals — NO real light anywhere.
- **LOGS** — built in code, and they must read as LOGS (H2B, the owner: they were "glowing orange pills") — `models.js#buildLog(len)`,
  ONE geometry a length (2 · 3 · 4 cells: nothing is stretched): a round trunk with a slight irregular wobble along it · brown BARK with
  darker furrows running along it (a strip of the trunk is one vertex colour → crisp grooves) · **LIGHT CUT ENDS with tree rings**, sawn
  on a slant (the top a little shorter) so the pale ringed faces are SEEN from the camera above · a stub of a cut branch on the 3- and
  4-cell logs · a little MOSS on some (`buildMoss`, its own instanced piece, from the seed) · rough wood (roughness 0.82 — never glossy).
  **At night the amber is ONLY a thin underglow at the waterline + a soft light on the water round it — the wood stays visible** (no
  glowing end caps). They bob + rock gently (and dip + roll when the kid lands on one); a soft pale wake + a ripple ring trail each.
  Water = danger, a log = safe, in one look.
- **TRAINS** — Kenney's front + 5 carriages + a front turned round; lit windows, BOTH headlights casting a soft beam ahead + BOTH tail lights a red glow behind (the lamps, as the cars'), FOUR RED SIGNALS along the
  lane that flash from the tell to the tail (the tell is the visual), a red warning glow on the side it comes from. The body is drawn ~10
  ticks before + after its pass (it is SEEN coming through the edge column — the rules' pass is unchanged).
- **MOVERS NEVER POP** — a road / water lane is one lap long: the view draws a mover's NEXT lap too (always outside the 9 played columns),
  so a car / a log leaves through the edge column and the next one is seen coming.
- **TREES** built in code (stacked soft blobs on a short trunk, 3 sizes from the seed); **PROPS** (H2B — the owner: no junk-looking props;
  nothing may look like a placeholder) = Kenney's planter / dumpster / cone + **THE BARRICADE** built in code (`models.js#buildBarricade`:
  two orange / white striped boards on dark legs + an amber lamp — Kenney's jersey barrier read as a pale cube from above) as obstacles
  (the docks' clutter round a landmark) + the STREET LAMP on an edge column every 4th grass lane (a warm pool on the ground + its bulb);
  tufts. **The crates are OUT** (crate-box only on THE DOCKS later, if at all — `models.js#SCENE_MODELS`). What stands where is view-only, from the seed + the lane (`decorOf`) — the same on every phone.
- **THE SKYLINE BAND** (`.jw-skyline`, DOM over the canvas): the top 24 %, the picture covers the band's height and slides ≈ 10 % with the
  kid's column (transform); its foot fades into the lanes' fog. NIGHT LIFE: 8 aviation lights blink, 5 neon blocks flicker (opacity only;
  none with reduce motion). Only the current look's picture loads (the day's: H5).
- **THE BLACKOUT** (the wall): per-lane darkness in the ground shader + on everything standing on the lane (its lights go out), a cold
  blue edge where it bites, a black curtain a lane behind it; the screen's foot always fades to black (`.jw-blackout`).
- **THE SMOOTH FINISH**: low-roughness standard materials on the cars / the kid / the train + a tiny GENERATED neon environment
  (`neonEnv` — a 64 × 32 picture, PMREM'd once), a pink rim light from behind, blob shadows, the ground's edge darkening. Kenney's normals
  are never recomputed.
- **THE CAMERA** — `camera.js` (H2B — the section below): ZOOM 8 columns across, the sideways follow, the slight turn. The dimmer edge
  column each side of the 9 played stays the cue for the play area's edge (the ground, everything standing or moving there at ~0.5). The
  rules stay 9 columns. THE WIDER VIEW (H2's WIDTH 9 · 11) is retired.
- **PERFORMANCE** (H2B, ZOOM 8 TURNED): ≈ 19–28 draw calls (one a kind — everything that repeats is instanced), ~125–140 k triangles
  (Kenney's wheels are most of it; the logs ≈ 20 k); a window of ≤ 36 lanes re-laid every frame (a closer zoom lays fewer). **59.9 fps at
  every tier at 1× and 4× CPU** on the mini PC (390 × 844 @3 — the pass log's table); THE AUTOMATIC STEP is proven both ways
  (`tests/jaywalk-camera.test.mjs` on synthetic phones + the browser check under a heavy throttle). A `?fps=1` readout inside a
  screenshot is not a measure (one shot = a ≈ 250 ms frame in its 120-frame window). TIERS (the match kit's `createTiers`, automatic): **2** = the
  device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM (the lights alone, layer 1 → a half-res target → blurred at a quarter → added back) ·
  **1** = DPR ≤ 2, no bloom · **0** = DPR ≤ 1.5, no tufts, no water reflections. No post-processing below the top tier.

### THE KID + THE HOP's FEEL (H2 — all derived from the run's state between frames: a replay draws the same kid)
- **THE JAYWALKER** (`models.js#buildKid`, code-built): the head ≈ 45 % of him, a hoodie + a BACKWARDS cap in the player's colour (a white
  brim to his back — it reads as a cap from the camera), brown hair under it, navy legs, big white sneakers, two big eyes. He faces the
  camera until the first hop (the eyes), then the way he last hopped.
- **HE ALWAYS STANDS OUT** (H2B): a soft pool of HIS COLOUR on the ground under him + a ring round his feet (it breathes — never with
  reduce motion; on a log it rides the log) + a RIM LIGHT of his own (his colour pulled half-way to white, on every edge that turns away
  from the camera — `paintMaterial(…, { rim: true })`). A cyan kid beside cyan cars at lane 200+ is still found at once.
- **THE HOP** (inside the engine's `HOP_TICKS`): a squash at the push, a stretch on the arc, a squash on landing (150 ms), a small turn the
  way he hops, the blob shadow shrinking + fading as he rises; an idle bob; a dust ring on grass; a ripple + the log's wobble on a log.
- **THE HITS, one per cause**: car = flattened + the cap spins off · water = a splash + the sink · train (+ the Blackbird's placeholder) =
  knocked away, spinning · edge = carried off on the log, then the splash · the blackout = swallowed by the dark · the UFO (placeholder) =
  beamed up. THE RESPAWN BLINK. **THE CAMERA** (camera.js): a smooth follow that leads a hop to where it lands — up the lanes AND sideways —
  a short shake on a hit (never with reduce motion).
- The lane count: big neon numerals (`.jw-lanes` — the numbers' font: Orbitron's heavy 0 reads as a block), a small pop a lane.

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
  a little right, the lanes fall ≈ 10° to the right on the screen and the cars' sides show. **ANGLE: STRAIGHT · TURNED, default TURNED.** The
  turn is about the kid: he stands in the same place either way. The horizon stays level (a yaw, never a roll): the skyline band still
  reads as a horizon — its picture sits a step over in the turned view and slides against the follow.
- **THE FRAMING**: the kid's feet **62 % down** the screen on every screen shape (`CAM.kidAt` — the aim is solved per shape); **3–4 lanes
  clear behind him** above the foot's fade (83 %), ≈ 6 to the screen's very foot → THE BLACKOUT is seen climbing before it bites (the
  owner's brother: you see it coming). ≈ 12 lanes ahead at ZOOM 8. The lane count sits over the skyline; nothing covers the play.
- A ZOOM / ANGLE change eases (`EASE_MS.set` 170 ms); the far plane + the fog follow the rig's scale; a closer zoom lays fewer lanes.
- Tests: `tests/jaywalk-camera.test.mjs` (the numbers, every screen shape, the follow's clamp + ease, the turn, PURE) +
  `tests/integration/jaywalk-lab.mjs` (each zoom + both angles in a real page, the kid's height, both play edges, a log ride, the lanes behind).

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
- `audio/jaywalk/` — every pick + every `-b` backup (17 MP3s) + the two train bells as **16-bit mono WAV** (the delivery's exact sample
  counts: the whole file is the loop — MP3 / AAC padding would click) + `CREDITS.md` (every file's source; three are CC BY 4.0 — credit
  required when they ship in play): **594 KB**. The unpicked takes leave once the owner has chosen.
- A model / a sound replaced: bump `models.js#MODEL_REV` / `sfx.js#JW_SFX_REV`. After any change: `node scripts/build-file-hashes.mjs`.

## THE SOUNDS + THE AUDITION (H2 — `sounds.js` (the PURE table) + `sfx.js` + `audition.js`)
- Through the SHARED engine (`audio/engine.js`): the bytes fetched at preload (no AudioContext — nothing sounds before a tap), decoded once at
  the unlock, each sound a buffer source → its gain → a soft limiter (−8 dB, 8 : 1) + a trim → the console's SFX bus (the Effects slider,
  the toggle, THE ONE MUTE, THE CUT). **8 VOICES by PRIORITY** (`sounds.js#admit`): a full house drops a new hop; a hit / a splash takes
  the oldest hop's voice. Muted = every hazard keeps its visual tell.
- **IN PLAY (H2):** `hop` (pitch ± 6 %, gain ± 2 dB a hop) · `land-wood` (a landing on a log) · `hit` · `splash` (the water / the edge) —
  from the engine's events (`sfx.js#onEvent`). The rest (car-pass, horn, train-bell, train-pass, lights-die, landmark, new-best, respawn)
  are in the audition only until their passes wire them; **the mix is H6's** (the gains here are a first level).
- **THE SOUND AUDITION** (the lab's SOUNDS button → THE SHEET): every sound, its pick + its backup side by side (PLAY A · PLAY B), the train
  bell as a seamless loop (tap again / STOP THE BELL), USE A · B per sound (remembered on the phone — `jw:lab:snd:<id>`; the game plays the
  choice), **COPY MY PICKS** → one line ("JAYWALK SOUNDS: hop A · land-wood B · …") for the owner to paste into chat (a refused clipboard
  shows the line to hold). The run holds still under the sheet. Every button on its own press + lift.

## THE LAB — https://neonspeakeasy.com/jaywalk-lab.html (+ `?fps=1` · `?gray=1`)
The owner tests on his phone on CELLULAR: every JAYWALK pass ships its preview on the LIVE site. `jaywalk-lab.html` at the site ROOT
(deployed — never under tests/), noindex nofollow, its own import map for three.js 0.160.
**OPEN SINCE H2B (the owner, Nov 16 — his brother tests it on his own phone from a shared link): NO owner gate, no sign-in, ZERO server
calls** — the page never loads Firebase and never calls `/api`; it fetches only its own files, three.js (its CDN) and the fonts, then runs
the pure engine in the tab. **UNLISTED: nothing links to it** (no page, no script, no manifest — `tests/jaywalk-lab.test.mjs`); **no room,
no database writes of any kind**. Everything on it stays (SOLO · MATCH · DAILY, ZOOM, ANGLE, SOUNDS, NEW SEED, `?fps=1`). Two honest
footnotes: the shared audio engine reports a cut only from the owner's phone inside the app or on a `&debug=1` link — the lab drops that
flag from its own address; and THE SKEW WRAPPER (every dynamic import's rule) asks the deploy's id ONCE if a module ever fails to link. A
browser with no WebGL gets the stage + one line saying so. (H1 + H2 had the owner's door: POST /api/admin whoami.)
- `lab.js`: the run loop (the frame clock → ticks; the rules never read it; **tick 0 = the first touch**), the lane count (big, top), SOLO ·
  MATCH · DAILY (neon-underline tabs), NEW SEED, on an end ONE tap = HOP AGAIN (a new seed), **the run REPLAYED after each end** (✓ REPLAY =
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
  [--look]` (the night look, each ZOOM + both ANGLES, the kid's height, the follow at both edges + a log ride, the lanes behind him, every
  tap, REPLAY = LIVE, the audition, the graybox behind `?gray=1` on the same camera, the sizes; `--perf` = every tier at 1× + 4× CPU at
  ZOOM 8 TURNED + a screenshot's own hitch + THE AUTOMATIC TIER STEP under a heavy throttle; `--webkit` = Playwright's WebKit as an
  iPhone; `--look` = the shots only); THE PAGES LOAD covers
  `/jaywalk-lab` (a stranger gets the lab's stage — no door, no page error).
- **Measured (H1, 390 × 844 @3, 4× CPU, the bot playing):** 59.9 fps · 16.7 ms a frame (p95 16.8, worst 17.0) · 1.2 ms of work a frame (p95
  1.8) · 8 draw calls, ~1,200 triangles.

## REAL vs PLACEHOLDER after H2B
REAL: the rules, the course, the modes, the wall, the replay + its bounds, the server's verify, the moments' detection, the cartridge's frame +
director + ranks, the proof node + its rules, the controls; **the night look** (the ground + THE WATER, the cars + THE BOX TRUCK, the logs,
the trains, the trees + props, the skyline, THE BLACKOUT), **THE CAMERA** (zoom, follow, turn), **the kid + the hop + the hits**, **hop / land-wood / hit / splash in play**, the
audition. PLACEHOLDER: THE BLACKBIRD (a dark dart) + THE UFO (a disc + its beam ring) — decided before H6; the end screens' words; the
match screen (a stub — the night look reaches a real match in H4); the daily's lives; every number in `tuning.js` (first-pass feel); the
sounds' levels (the mix: H6) + the eight sounds not yet in play; the day look (H5); no tile, no boards, no HOW TO PLAY.
