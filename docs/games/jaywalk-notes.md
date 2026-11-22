# JAYWALK — THE NOTES (moved out of the start bundle, JT2 — Nov 22 2026)

The long comment blocks of the modules JAYWALK preloads (js/games/preload-graph.js `jaywalk`), moved here VERBATIM so the start bundle
carries code, not history (the boot's pattern — docs/harbor/boot-headers.md; docs/games/passes/jaywalk-jt2.md "GROUP 0"). In the code each
block keeps its FIRST line, ending in " …" (the rest is here, under the module, "before" the code line that follows it). A pass that changes
one of these modules writes its long notes HERE (or in docs/jaywalk.md) and keeps the code's comments to one line.

## js/audio/progress-sfx.js

### the header

```js
// THE PROGRESSION SOUNDS (PROGRESSION A) → THE PODIUM SOUNDS (FRIENDS B, Nov 8): Grok's NEW set (Downloads\grok\podium-sfx — warm jazzy-neon,
// no hiss; already cut + levelled by him, copied as-is → audio/sfx/pg-*.mp3; the old builder's set retired). One palette:
// pgSfx('xp-tick' | 'xp-total' | 'level-up' | 'medal-flip' | 'flame-on' | 'flash' | 'polaroid' | 'card-reveal' | 'achievement' | 'victory', { gain, rate }).
// 'victory' = the podium frame's winner sting (ui/final.js — was the synth arpeggio the owner heard as a hiss; a cartridge with
// OWN_VICTORY_SOUND skips it).
// Quiet + felt (CLAUDE.md): through the engine's SFX bus (the SFX slider + mute apply), decoded once on first use. Audio is POLISH: before
// the unlock, muted, missing files or a dead graph — nothing plays, nothing throws. `flash` + `polaroid` are PROGRESSION B's (the sightings'
// flashbulb) — shipped now so B just plays them.
```

## js/core/fin-ink.js

### the header

```js
// CITY F — END-SCREEN STANDARD A: the end screen's BAR is solid in the GAME's accent (ui/final.js) — its words dark where they read
// ≥ 4.5 : 1 on that accent (WCAG's contrast), white where the accent is too dark. PURE (tests/endscreen.test.mjs walks every game's ACCENT).
```

## js/core/proof.js

### the header

```js
// THE PROOF TREE — what JAYWALK's `jw` + HIGH RISE's `hr` SHARE (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF TREE"). PURE (no
// DOM, no clock, no imports): the phones, the host's director and the SERVER read it. A match's tree:
//   rooms/{CODE}/{jw|hr}/{matchId} = { t0 (THE STAMP — the server's time, the tree's FIRST write, once), {uid}: { go, c/{i}, e?, k?, rs? } }
// THE HOST-TRUST HOLES (docs/games/passes/highrise-review.md MUST 2) are closed by three things that read NOTHING the host writes:
//   · THE STAMP `t0` — one fixed key a tree: whoever GOes first stamps it (database.rules.json: the server's time, once, only while the
//     tree is empty). A GO is taken only within GO_WINDOW_MS of it — nobody GOes alone early and adds the rivals later (hole c), and a
//     tree may be deleted only once its stamp is 10 min old (hole b — core/room-logic.js#proofUnlocked).
//   · the leaves (c/{i} · e · k · rs) hang on the player's OWN `go` + a time bound — never on game/phase (hole a).
//   · THE SERVER's two guards (api/_lib/jaywalk.js · highrise.js): a node counts only with a GO (`goOf`), and a GO later than
//     GO_WINDOW_MS after THE FIRST GO is no run (`onTime`) — they hold on the rules as published before this pass too.
```

### before `/** when a player's proof last moved (ms, a server time): their newest chunk's arrival, el`

```js
// THE CONSOLE FIX (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): a MODIFIED host wrote `final` (or moved
// the room on) mid-match — every honest phone left its live run, he played on, reported and won. Now a run that is STILL LIVE is waited
// for: by the phones (the podium, the router) and by THE SERVER (no report counts while one is). "Live" reads NOTHING the host writes —
// only the player's own node (its GO, its chunks' server stamps, its `e`), the player's own presence and the match's clock (THE FIRST GO).
```

### before `export const CHUNK_SLACK = 10;`

```js
// THE FIX PASS — S3 (a), THE CHUNK CEILING (THE FABLE REVIEW: a node took 10,000 chunks in any order — 2,000 went up in ONE 0.3 s write,
// ~4.3 MB a player a match, re-judged by the host's director every 250 ms and read whole by every report). A node may hold at most
// `seconds of its own clock × perSec + CHUNK_SLACK` chunks — the seconds from its GO to its NEWEST chunk's server stamp (the rules stamp
// each `at` with the server's now: a burst can not buy itself time) — counted BEFORE anything is unpacked; past it the node is a REFUSED
// log (the judge's `bad`). `perSec` = the game's own writer bound (a match sends each move within its flush interval, stop-and-wait —
// JAYWALK 120 ms, HIGH RISE 150 ms: the review's "× 2" would refuse an honest fast match), so an honest phone can never reach it.
```

## js/core/splits.js

### the header

```js
// J1 — SPLIT TIMES (JAYWALK — docs/jaywalk.md "SPLIT TIMES"): the tick each multiple of SPLIT_EVERY (50) lanes was FIRST reached, from the
// engine (js/games/jaywalk/engine.js — `run.sp`, the replay's `splits`): ONE source for the phone's end card and the server's replay.
// PURE (no DOM, no clock) — the phone (the end card), core/progress.js#matchStep + api/_lib/jaywalk-credit.js (the server's BEST splits:
// pstats.jsp = [best tick to 50, to 100, …] — kept by the SERVER from ITS OWN replay, a counted result only; never a phone's claim).
```

## js/games/jaywalk/areas.js

### the header

```js
// JAYWALK — THE AREAS' LOOK (H5A — docs/jaywalk.md "THE AREAS"): a WHOLE STRETCH looks like the place. A VIEW: it reads the course
// (course.js#area — the rules' own table), never writes it; nothing here is a rule. Per area: its GROUND (night-fx.js draws it by the
// area's number), what an OBSTACLE on a play cell is drawn as (the rules' own obstacles — they must LOOK like obstacles), the EDGE
// DRESSING in the dim edge columns of its ground lanes (crates, containers, market stalls, storefronts with their neon, canal houses,
// the bridge's railings), its lamps, the skyline band's tint, and its SIGNATURE PIECES: THE DOCK CRANE + the bridge's towers STRADDLE
// their lanes on thin legs that stand on the lane lines (the cars, the logs, the trains run between them); THE LIGHTHOUSE (+ its
// sweeping beam — light only), THE CONTROL TOWER, the hangars, the neon fish's stall, the moored boats stand on a GROUND lane's edge
// column. Nothing of an area ever stands on a play cell the rules call free, nothing covers a play column, and a road / water / rail
// lane's edge column stays open: what comes down it is seen coming, as before.
// Everything is built in code in the smooth toy style (models.js#build) except the lighthouse (MaverickFX, CC0) + the fishing boat
// (Kenney, CC0). H5A = the night look. H5B = THE DAY LOOK (the same pieces sunlit — their lamps off, a shop's neon a painted board;
// `c.day` + `c.ek`, the edge columns' dim, come from the scene) + THE LANDMARK MOMENT AT THE GATE (`sigOf`: the area's hero piece(s)
// stand in the gate lane's own edge columns — the owner: the landmarks must be SEEN).
```

### before `G.drum = build([`

```js
// an oil DRUM (H5C — the owner: NEVER BLUE (blue on the ground = water) + smaller): built WHITE — an instance's colour paints it red /
// orange / yellow (night.js#DRUM_HEX) — two rolled hoops a shade darker, a dark lid with its bung, a little WEAR: a rust bloom low
// on its side, a scuffed pale patch, a dent's shadow
```

### before `G.house = build([`

```js
// a HOUSE (white: an instance's colour paints it): a storefront / a canal house — 1.8 wide, 2 tall, a flat roof with its parapet,
// an awning on the face toward the play (+x)
```

### before `{ const hero = T.hero || [], hs = pick(s, 5) < 0.5 ? -1 : 1; hero.forEach((w0, n) => { con`

```js
// H5B — THE LANDMARK MOMENT AT THE GATE: the area's hero piece(s) in the GATE LANE's own two edge columns (a ground lane: nothing
// else is dressed there) — seen beside the arch as the kid comes up to it. THE CRANE + the towers straddle, as everywhere.
```

### before `const zc = Z(P.y0 + 1), x = x0 + s * 0.19;`

```js
// THE DOCK CRANE straddles two lanes: its four thin legs on the lane lines (whatever runs there runs between them), its boom
// reaching OUT over the harbour — nothing of it hangs over a play column
```

### before `const B = BOX.lighthouse, sc = B ? 3.9 / B.h : 0.3, x = x0 + s * (P.hero ? 0.1 : 0.66);`

```js
// THE LIGHTHOUSE on its rocks, on a ground lane's edge column — its lamp lit; the scene sweeps its beam across the lanes
// (H5B — the gate's hero stands as near the play as its edge column lets it: the lighthouse IS the moment)
```

## js/games/jaywalk/arrival.js

### the header

```js
// JAYWALK — THE ARRIVAL BANNER (BEFORE THE FLIP — the owner, Nov 17: "when I cross it, it plays the noise, but nothing tells me where I am";
// docs/jaywalk.md "THE AREA ARRIVAL"). The instant the kid crosses an area's gate lane: the area's name BIG at the top of the screen —
// under the lane count, over the skyline band (its foot never past the far haze: never over a lane) — + a small LANE 50 line (a lap:
// LAP 2 · LANE 450), ≈ 2.5 s, timed with the area-arrival sound. NIGHT = a neon sign (a dark board, a tube in the area's colour, a
// quick flicker on) · DAY = a painted sign (the area's paint, a white trim, a drop-in swing) · reduced motion = a plain fade. ONE
// element, built once; a show = its words + colours set + its CSS animation restarted (transform + opacity only). A VIEW: it reads the
// course's area table, never the rules' state. The game (view.js — this phone's own kid only, never over the Mothership's warning or
// the OUT card) and the lab (lab.js) both show it.
```

## js/games/jaywalk/camera.js

### the header

```js
// JAYWALK — THE CAMERA (H2B — docs/jaywalk.md "THE CAMERA"): ONE camera for both views (the night look + the graybox behind ?gray=1), so
// they always agree. PURE MATH — no three.js, no DOM, no clock of its own (the view hands it `dt`): it only needs a camera object with
// `position.set(x, y, z)` + `lookAt(x, y, z)`.
//   · ZOOM = the columns seen ACROSS THE SCREEN at the kid's row: 7 · 8 · 9 (default 8) — on EVERY screen shape (the lens is fitted to the
//     screen's WIDTH: a shorter screen sees fewer lanes, never smaller columns). THE PROVEN RIG (H1: 16 up / 12 back — the kid seen from
//     ≈ 53° above) is kept and scaled about the kid by zoom / 9.42.
//   · THE SIDEWAYS FOLLOW: the camera's x eases to the kid's x (a hop is led to where it lands; a log ride is followed smoothly), CLAMPED
//     so the view never shows more than PAST_EDGE (1) column past the play area's edge — cars + logs are still seen coming.
//   · THE TURN: a slight yaw, TURN_DEG, about the kid — the lanes run on a gentle diagonal and the cars' sides show. ANGLE: STRAIGHT · TURNED
//     (default STRAIGHT since H3). Swipes stay screen-relative (the rules never know).
//   · THE FRAMING: the kid's feet sit KID_AT (62 %) down the screen on every screen shape → 3–4 lanes are seen behind him (THE BLACKOUT is
//     seen climbing before it bites).
// The rules never import this (tests/jaywalk-camera.test.mjs).
```

### before `const hero = o.hero || null;`

```js
// (hero — THE POSTER's frame alone, H4: a low camera in front of the kid — { at: [dx, y, dz], look: [dx, y, dz], fov } from where he
//  stands; the game never passes it)
```

## js/games/jaywalk/causes.js

### the header

```js
// JAYWALK — HOW YOU WENT OUT (H3 — docs/jaywalk.md "THE END SCREEN"): the end screen names it in big neon words — one line per cause +
// vehicle (FLATTENED BY A TAXI · SWEPT AWAY · HIT BY THE 6:15 · THE LIGHTS WENT OUT). PURE (no DOM, no three.js).
// H4 ADD-ON (the owner, Nov 16 — hit by a truck, the screen said "HIT BY A CAR"): **ONE SOURCE OF TRUTH for which vehicle a car IS** —
// `vehicleAt(course, lane, j)`, from the course's seed. THE DRAWING (night.js) and THE WORDS (hitVehicle → causeLine) both read it, in
// the game AND the lab, so the line always names the model on the screen. There is NO generic line: a kid a car got is always named
// by its vehicle (sedan · hatchback · taxi · van · box truck); the train is THE 6:15. What hit the kid is read back from the run's own
// end (the lane, the tick, the place — the engine's result), never stored anywhere.
```

## js/games/jaywalk/controls.js

### the header

```js
// JAYWALK — THE CONTROLS (H1 — docs/jaywalk.md "THE CONTROLS"): tap = hop forward · swipe = sideways · swipe down = back. EVERY TAP ACTS:
// the play area keeps its OWN pointer events (`data-tap-own` — THE TAP WATCH never touches it; never a `click`: iOS Safari sends none to a
// plain page area). A TAP fires on RELEASE (under ~12 px of movement); a SWIPE fires THE MOMENT it crosses its threshold (never on release);
// a short flick between the two is read as its swipe — no touch is ever dropped. No page scroll / zoom / text selection on the play area.
// (The engine keeps ONE buffered hop while a hop is in flight — engine.js.) Desktop: the arrows / WASD / space.
```

## js/games/jaywalk/course.js

### the header

```js
// JAYWALK — THE COURSE (H1 — docs/jaywalk.md): every lane is a PURE function of (seed, lane index) — built alone, in any order, on the phone
// or the server — and every hazard's position a PURE function of (lane, tick): cars, logs, trains, THE BLACKBIRD, THE UFO. No per-tick
// simulation is needed to know where anything is. PURE: no DOM, no clock, no Math.random; integers + Math.floor only (tuning.js says why).
// J2 — COURSE RULES v2 (versions.js): a course is a pure function of (seed, COURSE VERSION) — `cv` 1 (the default everywhere: the rules
// exactly as they shipped up to J1 — tests/jaywalk-v1-frozen.test.mjs holds them to the frozen copy byte for byte) or 2 (EVEN STARTS +
// THE BLACKBIRD's RUNWAYS). Every v2 change sits behind `cv >= 2`; the v1 path is never touched.
```

### before `const even = Math.floor(P / n), D0 = ri(R, RUNWAY.gap[0], RUNWAY.gap[1] || even);`

```js
// THE STAGGER: the ticks between one lane's jet and the next — from the tight cluster to the lap shared evenly (by the seed); a layout
// that leaves a careful kid too few start ticks a lap to get across (runwaySlack) is not used: the tight cluster instead (always fair)
```

### before `const v = RUNWAY.v[airfield ? 2 : y0 < 250 ? 0 : 1], tell = Math.max(RUNWAY.tellMin, RUNWA`

```js
// (J2 FIX — THE BLACKBIRD YOU CAN SEE: the jet's speed by where the runway is — the first runways slowest, from 250 a step faster, THE
//  AIRFIELD fastest; the tell 1.2 s, v2's own floor)
```

### before `const fits = L => runwaySlack(L) >= RUNWAY.slack && runwayWait(L) <= RUNWAY.wait;`

```js
// (J2 FIX — the slower jets burn a lane longer: a layout must ALSO never keep a careful kid waiting past `wait` (runwayWait); the tight
//  cluster is tried next, and if even that fails, the cluster in LANE ORDER — the bottom lane's jet first: he follows the wave across)
```

### before `const max = t === 'water' ? WATER_RUN_MAX : RAIL_RUN_MAX;`

```js
// (never more than 3 water — or 3 rail — lanes in a row: in a long raw run every 4th lane is ground. H5A: a run goes ON after its
//  break — THE CANAL / THE RAIL YARD read as water / rails with footings, not one block and then a field)
```

### before `const W = [0, 1, 2, 3].map(k => Math.max(1, byHeat(WATER.lenW[0][k], WATER.lenW[1][k], hea`

```js
// H3 — every log its OWN length (1–4 cells: long ones early, short ones later — the weights by heat) + UNEVEN gaps (short · long). A
// 1-cell log is the hard one: only on a slow lane (WATER.oneV) with no water lane beside it (a hop log-to-log always has ≥ 2 cells to land on)
```

### before `if (u >= p.pass) return p.trail && u < p.pass + p.trail ? 'blackbird' : '';`

```js
// (J2 — a v2 RUNWAY lane's jet lays THE AFTERBURNER TRAIL: everything behind it burns through the pass, then the WHOLE lane for
//  `trail` ticks after it — the cause stays 'blackbird'. A v1 pulse has no `trail`: the body alone, as it always was)
```

## js/games/jaywalk/cues.js

### the header

```js
// JAYWALK — THE SOUND CUES (H5A — docs/jaywalk.md "THE SOUNDS"): WHEN the world's sounds play — PURE (no audio, no DOM, no clock: the
// view hands it the run after each tick + that tick's events; sfx.js#onCue plays what it returns). The kid's own sounds (hop · land ·
// hit · splash) stay the engine's events (sfx.js#onEvent). Every cue is about THIS phone's own kid — in a match a ghost makes no sound.
//   · bell-on / bell-off — THE TRAIN BELL loops while a rail lane's signals flash NEAR the kid (its tell) and stops as the train passes
//   · train-pass        — the moment a near train's pass begins (panned to the side it comes from)
//   · train-horn        — H5C: ONE blast a train, the moment its WARNING STARTS (a near rail lane's tell begins), from its side
//   (H5B — the owner: the CAR-PASS near-miss whoosh is GONE — no cue, no sound)
//   · horn              — a car closing on the kid standing in its lane, ≤ 1 every 3 s
//   · truck-horn        — BEFORE THE FLIP (the owner, Nov 17 7:21 pm): the SAME horn moments ALTERNATE car horn · truck horn (no horn added)
//   · tick / tick-off   — BEFORE THE FLIP (the owner — it REPLACES "lights-die"): THE STOPWATCH — one loop, silent while the dark waits at its
//                         5 lanes behind, fading in + speeding up as THE BLACKOUT / THE FOG BANK closes on him (tickOf: { level, rate })
// The world's own moments are read straight off the course (pulseAt, moverLeft — pure functions of the tick): nothing here is a rule.
```

## js/games/jaywalk/director.js

### the header

```js
// JAYWALK — THE DIRECTOR (H1 + H4 — docs/jaywalk.md "THE MATCH"): the PURE host step. count (3 · 2 · 1) → play → final. THE GAME FRAME:
// id, matchId, participants, phase (+ phaseStartAt). THE 3 S RULE: every patch here moves `phase` — a step never needs to land twice.
// The host holds no private state: any phone that becomes host continues from the database (everyone's proof nodes).
// H4 — THE MATCH (ONE LIFE):
//   · GO: every phone writes its proof node's `go` in the count's last 2 s; THE FIRST GO (logic.js#firstGo — final the moment it lands)
//     picks the course (seedOf) + sets tick 0 (that time + GO_LEAD_MS) for everyone. The step count → play writes them into the game.
//     No GO anywhere (no signal, the rules not published) → the match plays UNPROVEN: a course of its own, never counted.
//   · THE END: every player's run has ended — their node says `e`; a player gone silent (a dead phone) is waited for: online → IDLE_OUT_MS
//     (an idle kid is out by then), offline → + DROP_WAIT_MS (THE DROPPED SIGNAL: their hops may still be queued) — or THE MOTHERSHIP's
//     moment + a grace. The results are THE JUDGE's replay of each player's log (logic.js#scoreRuns), never their claim.
// H3 — THE SOLO RUN: no count (PLAY NOW's walk inside is the wait) — `play` from the start; the run's own clock starts at the PLAYER's GO
// (their proof node's server timestamp — the course is picked from it: logic.js#seedOf), never at game.playAt.
```

### before `const S = game0.mode !== 'solo' ? startOf(game0, runs, code) : null, moved = !!S && (S.see`

```js
// (H4B — THE NODES ARE THE TRUTH: a match is scored on THE FIRST GO's course + clock, as the server's own count is; if the game ever
// said otherwise the patch puts it right — never seen in the tests: the GO patch is derived from the same nodes)
```

### before `const S = matchStart(code, game.matchId, runs);`

```js
// (THE PROOF PASS — A HOST HICCUP AT GO (HIGH RISE's REVIEW FIX A, SHOULD 1, ported): a FIRST GO the server stamped before this host
//  gave up = a hiccup of the host's, not a match without proof: the unproven mark is taken back and the match runs on the GO's
//  course + tick 0 — the phones' own startOf already does. A GO stamped after the give-up never moves a match on its stand-in.)
```

## js/games/jaywalk/engine.js

### the header

```js
// JAYWALK — THE ENGINE (H1 — docs/jaywalk.md): FIXED-STEP TICKS (tuning.js#TICK_HZ = 60 a second). The KID's state is the only thing
// stepped — a hop in flight, riding a log, the wall behind them, alive / out / taken (H4 — ONE LIFE EVERYWHERE: one hit = out; no lives, no
// respawn, no blink, no one-up); every hazard is a pure function of
// (lane, tick) (course.js). THE ONLY INPUT is THE HOP LOG: [{ t: tick, d: 'u' | 'l' | 'r' | 'd' }]. The phone's live run and the server's
// replay run THIS code. PURE: no DOM, no three.js, never Math.random / Date.now / performance.now / a frame clock; integers + Math.floor only.
```

## js/games/jaywalk/ghosts.js

### the header

```js
// JAYWALK — THE GHOSTS (H4B — docs/jaywalk.md "THE GHOSTS"): the other players' kids, IN STEP WITH THE WORLD ON SCREEN. PURE (no DOM,
// no clock of its own: the view hands it the world's tick + the frame's time).
// THE RULE (the owner, Nov 16 — after his first live match): a ghost is ALWAYS drawn consistent with the world on screen — never inside
// a car, never in the water while alive. H4 drew a ghost 75 ticks BEHIND a world drawn NOW (a friend safe on a log 1.25 s ago was drawn
// in the water today). Now:
//   · `conf` — THE CONFIRMED RUN: every hop this phone has of them, each applied in its own tick, through the same engine.
//   · `run`  — THE DRAWN RUN: `conf` stepped on to THE WORLD's TICK with no new hop assumed — they stand / ride their log with it, exactly
//     as the rules would. A ghost's state IS the engine's state at the tick the cars + logs are drawn at.
//   · A LATE HOP (it always is, by the network's delay): `run` is rebuilt from `conf`; where the ghost was drawn → where the rules put it
//     now is `off`, closed in A QUICK HOP (never a teleport, never a slide along the ground).
//   · A DEATH ONLY ONCE CONFIRMED: a ghost goes out only when that player's own log is complete (`done` — their node's `e` is here). Until
//     then a drawn run that WOULD go out next tick HOLDS STILL in place (`held`) — a death never un-happens. Held longer than
//     HELD_SHOW_MS (a dropped signal, not the network's beat) it is not drawn until its hops / its end arrive.
// THE MOTHERSHIP takes a ghost at its fixed tick with nothing to confirm (it is the world's, not a hop's).
```

## js/games/jaywalk/index.js

### the header

```js
// JAYWALK — THE CARTRIDGE (H1 — docs/jaywalk.md; the contract: js/games/contract.js, docs/cartridge.md). PLAYABLE since THE GO-LIVE
// PASS (Nov 17): config.js GAMES `playable: true` — offered everywhere; its thin meta at boot (registry.js#META), HOW TO PLAY in ui/help.js.
// H4 = THE MATCH (ONE LIFE): the course from THE FIRST GO, the ghosts (everyone's hop logs through the same engine), the live order, out =
// SPECTATE + Call the Winner, the podium (the winner, the order, each player's cause line); the server replays every player's log.
// H3 = THE SOLO GAME: the real view (view.js — the night look, the proof written as you hop), the end screen (victory.js), PLAY AGAIN.
// H1 = the rules + the frame: start → THE GAME FRAME (id, matchId, participants, phase), a pure step (THE 3 S RULE: every patch moves the
// phase), the live path (everyone's proof node — the hop logs ARE the ghosts), the ranks from THE REPLAY. Its screen: a stub until H2 / H4
// (the graybox lives on /jaywalk-lab).
```

### before `export const livePaths = g => ({ runs: 'jw/${g.matchId}' });`

```js
// THE PROOF NODE (rooms/{CODE}/jw/{matchId}/{uid}): written by the player AT GO (present = proven) + their hop log in chunks as they hop —
// mirrored for everyone: the same seed + a player's log = their run, tick for tick (the see-through ghosts — H4)
```

## js/games/jaywalk/lab-prefs.js

### the header

```js
// JAYWALK — THE LAB's small memory (H2): what the owner picked on THIS phone — the camera's ZOOM (7 · 8 · 9) + ANGLE (H2B), a sound's A / B. localStorage only
// (`jw:lab:*`) — never a server call, never a profile key. A private window simply forgets.
```

## js/games/jaywalk/lines.js

### the header

```js
// JAYWALK — YOUR BEST LINE + THE NEXT FRIEND'S LINE (H4 add-on — the owner, Nov 16; docs/jaywalk.md "THE LINES"). PURE (no DOM, no clock,
// no three.js): what the lines ARE — the view draws them (night.js#setLines) and plays their moments (view.js).
//   · YOUR BEST LINE (a solo run — and, in a match, the player's own solo best): a GOLD line across the whole lane at the player's best
//     lane, "YOUR BEST · 143" on the ground beside it. CROSSING it (landing on a lane past it) = from then on the run is a new record.
//     No best yet (a first-ever run) = no line.
//   · THE NEXT FRIEND'S LINE (solo runs only — a match already has the real players as ghosts): ONE white / cyan line at the LOWEST
//     friend best that is still ahead of the player, "LIAM · 212" beside it. Crossing it → the next friend above appears. Never two friend
//     lines at once; a friend at or behind the player never shows; no friend bests = no friend lines.
// Both come from the SERVER-counted solo bests (the board jaywalk-solo): /api/profile { action: 'table' } — YOUR TABLE's own read (you +
// the friends YOUR list names) — fetched ONCE at a run's start; nothing is asked during a run. Never a local guess.
```

## js/games/jaywalk/logic.js

### the header

```js
// JAYWALK — THE MATCH's RULES (H1 + H4 — docs/jaywalk.md "THE MATCH"): one run each on the SAME course, ONE LIFE; the results are REPLAYED
// from each player's own hop log (the proof node rooms/{CODE}/jw/{matchId}/{uid}) — never a number a phone claims. PURE (no DOM, no clock).
// (THE THIN META: the console's values live in meta.js — one source)
```

### before `const late = !solo && game.g0 > 0 && node && !onTime(node, game.g0) ? (goOf(node) ? 'late `

```js
// (THE PROOF PASS — the server's guard, on the host's podium too: in a proven match a node with NO GO, or a GO later than the window
//  after THE FIRST GO, is no run — the kid who never hopped, `bad` says why; api/_lib/jaywalk.js#jaywalkMatch drops it the same way)
```

## js/games/jaywalk/meta.js

### the header

```js
// JAYWALK — its thin meta = its ROW in js/games/metas.js (THE ONE META MODULE, CITY PART 1 — docs/cartridge.md): the cartridge, core + the
// server import it here; the boot reads the row (registry.js). Its notes: docs/cartridge.md "THE ONE META MODULE".
```

## js/games/jaywalk/models.js

### the header

```js
// JAYWALK — THE MODELS (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the 12 Kenney models (CC0 — assets/jaywalk/models/, re-packed by
// scripts/build-jaywalk-assets.py: ONE mesh each, the colormap baked into vertex colours, a car's body paint in COLOR_0's alpha) through a
// tiny GLB reader of our own (no loader add-on: the page's import map carries three's core only), THE KID (H5A — Kenney's skate boy, his
// bones + poses read by the same reader), + everything BUILT IN CODE in the smooth toy style: the round puffy trees, THE LOGS (bark, cut ends, rings), the tufts, THE BOX TRUCK. Every geometry here carries `color` (linear RGB) +
// `paint` (1 = the part that takes the player's / the car's colour). Kenney's normals are never recomputed.
```

## js/games/jaywalk/moments-view.js

### the header

```js
// JAYWALK J1 — THE MATCH MOMENTS, the screen (docs/jaywalk.md "THE MATCH MOMENTS"; the rules: moments.js — PURE). All of it sits at the TOP
// of the screen, under the lane numeral, pointer-events none — nothing covers the lanes ahead, nothing stays longer than its moment but the
// small duel strip. Transform + opacity only; Reduced motion = a steady glow, no pulse, no flash.
//   · THE OUT BANNER: "<NAME> IS OUT" (the name in the player's colour) + "87 LANES · 3 LEFT", ~1.5 s; outs within 1 s merge; the out sound
//     once a banner
//   · THE RED X → THE GRAVESTONE (the owner's add-on, Nov 21): where the out player's ghost fell — the see-through red X + their name for
//     X_MS (as before), then it SETTLES: a smaller, fainter X + the name, pinned to that spot until the match ends (it scrolls with the world —
//     the fallen ghost's own place, re-projected each frame; off the screen = hidden). Faded while it sits in the lane in front of the kid
//     on screen (graveAhead). DOM overlay only (no draw call); a transform written only when the spot moves; solo has none (match only)
//   · HEAD TO HEAD: the big words + "BEN 142 vs JUSTIN 138" → the screen's EDGES pulse red, faster with the siren → one flash at its peak →
//     the words shrink into THE DUEL STRIP (both players' lanes, live, the leader marked by a shape — never colour alone)
//   · LAST ONE STANDING: "+23 LANES AHEAD · KEEP GOING" + its sound — the run goes on
```

## js/games/jaywalk/moments.js

### the header

```js
// JAYWALK J1 — THE MATCH MOMENTS, the PURE half (docs/jaywalk.md "THE MATCH MOMENTS"; the screen: moments-view.js). Every "out" keys off
// that player's OWN end of run — their proof node's `e` (this phone's own: its own engine's end) — NEVER the host's word: an honest END GAME,
// a host's early `final` or a moved-on room never shows a fake OUT (THE CONSOLE FIX's rule). THE MOTHERSHIP's `taken` is a finish, not an out.
//   · OUT — another player's own end: a banner (merged when outs land within OUT_MERGE_MS), a red X where their ghost fell, the out sound
//     (THE GRAVESTONES, the owner's add-on Nov 21: the X STAYS — bright for X_MS, then a smaller, fainter X + the name pinned where they fell
//     for the rest of the match, scrolling with the world; faded while it sits in the lane in front of this phone's kid — graveAhead)
//   · HEAD TO HEAD — a match of 3+ players narrows TO two (an out leaves exactly two in) — ONCE; never at the start; never in a 2-player match
//   · THE DUEL STRIP — while exactly two are in: a 2-player match from the start; a 3+ match after its HEAD TO HEAD (at once after a rejoin)
//   · LAST ONE STANDING — everyone else is out and THIS phone's run goes on (the 2-player case too) — ONCE, for the survivor
// A refresh / rejoin takes the state as it stands as its BASELINE (no moment replayed); the strip is drawn from the state itself.
```

## js/games/jaywalk/night-fx.js

### the header

```js
// JAYWALK — THE NIGHT LOOK's SHADERS + small pieces (H2 — docs/jaywalk.md "THE NIGHT LOOK"): the lanes' ground (ONE instanced plane a lane,
// drawn in the shader: grass · asphalt + curbs + dashed lines · THE WATER (H5B's add-on: VIDEO-GAME WATER by night too — a clear saturated blue, ripple caps + specks drifting with the lane's current, a bold foam line; BLUE ON THE GROUND = WATER, NOTHING ELSE) · rails + sleepers · the flight path · a landmark's
// paving — the edge columns dimmer, the BLACKOUT's per-lane darkness, the fog), the additive lights (flat on the ground + facing the
// camera — pools, trails, beams, rings, lamps: NO real point light anywhere), the blob shadows, the paint patch (a car's body / the kid's
// hoodie takes its colour; everything else keeps Kenney's), a tiny generated neon environment (the gloss) and THE HALF-RES BLOOM (top tier
// only). Colours in these shaders are DISPLAY values (no colour-space pass): they match the scene's fog colour as the screen shows it.
```

## js/games/jaywalk/night.js

### the header

```js
// JAYWALK — THE SCENE (H2 … H6B; three.js 0.160): the pure engine drawn in the smooth stylized 3D style — NIGHT + DAY are ONE scene
// (setLook). The same interface as the graybox: draw(run, course, a, dt). A VIEW: it draws from (run, course) and writes nothing; no
// rule, replay or server file imports it. What each part is + why → docs/jaywalk.md "THE NIGHT LOOK" · "THE DAY LOOK" · "THE AREAS" ·
// "NO WEAK POINTS" · "THE BIG MOMENTS" (flyers.js — on demand) · "THE CAMERA" · "THE LINES" · "THE GHOSTS" · "THE FINAL POLISH".
// Everything that repeats is INSTANCED; a window of lanes round the kid is alive; bloom at tier 2 only (setTier).
```

### before `const RWN = o.rwNight === true;`

```js
// (J2 FIX — THE NIGHT COMPARE: the new crisp runway lamps + the heat trail by NIGHT too, on the LAB's `&rwnight=new` only — the game never
//  passes it: by night the runway stays exactly as J2 shipped it; by day the new ones always)
```

### before `const upRange = (a, cnt) => { const u = a._updateRange; if (u && cnt > 0) { u.offset = 0; `

```js
// (J4 — the fresh-eyes review: ONLY the instances in use go to the GPU — three's own kept range record, HIGH RISE's S4A pattern; a three
//  without it sends the whole buffer, as before. The glow billboards' cap grew 600 → 900 for the tree lights: never a bigger upload for it)
```

### before `const seaMats = [];`

```js
// (fogUp — H5C: a thing fades into the far haze as the ground under it does · J4 / JT1: THE SEASONAL PACK patches these — the snow on the
//  tops; `leaf` = the round trees: autumn turns them)
```

### before `let SZ = NO_SEASON, wetOn = false, spAsk = null, onSound = null;`

```js
// ---- J4 + JT1 — THE SEASON (setSeason — the view's, from the run's own DAY): THE SEASONAL PACK (seasonal.js — its code; the winter models
//  + the fireworks fetched by it) loads on prepSeason (the menu / the count), ONLY on a season day (season-gate.js — Oct 20 → Mar 1) or when
//  the lab forces one. A run whose pack is not in by its start keeps the normal look (no swap mid-run).
```

### before `if (SE) { v3.copy(kidPos).project(cam); FR.kidX = v3.x; FR.kidY = v3.y; FR.camX = rig.x();`

```js
// J4 + JT1 — THE SEASON's frame (seasonal.js): the tree lights LAST (whatever room the glow billboards have left after every gameplay
// light), the footprints, THE FALL (ONE draw — the snow or the leaves), the fireworks; the wet streets (night, the top tier, their switch)
```

## js/games/jaywalk/numerals.js

### the header

```js
// JAYWALK — THE BIG NUMERALS (H5A's add-on — the owner, Nov 16: on his iMessage share card "172" read like "N2" — the 1's top flag
// ran into the 7's top bar, the digits sat too tight). ONE helper for every place JAYWALK draws its big neon numerals — the in-game
// lane counter + the end screen (DOM), the share card + the lines' words on the ground (canvas): MORE ROOM between two digits, and
// A "1" THAT CAN'T MERGE — a 1 with a BASE FOOT. The fonts' own 1 (Chakra Petch, Orbitron) is a bare stem with a flag, so the foot
// is drawn: the 1 is rasterised once a font, its stem found, and the foot laid across its base — the same picture in the DOM
// (a pseudo-element placed by the measured numbers) and on a canvas (a rectangle). A VIEW's helper: no rules, no storage, no fetch.
```

## js/games/jaywalk/replay.js

### the header

```js
// JAYWALK — THE REPLAY (H1 — docs/jaywalk.md): replay({ seed, mode, log }) → the run's result, PURE — the SAME code the phone runs
// (engine.js#step, tick by tick). The phone shows it after every run (the owner's determinism check on a real iPhone); the server's verify
// (api/_lib/jaywalk.js) = these bounds + this replay. + THE HOP LOG's packed form (the proof node's chunks) + THE SPEED CHECK + THE JUDGE
// (H4 — judgeRun: the ONE function the host's podium and the server's count both run).
```

### before `else if (drop) { const lag = now - k.t0; if (k.at > drop.until || lag > drop.lag + CLOCK.j`

```js
// (inside a burst the queued chunks arrive together: each one's lag is SMALLER than the one before — a lag that GROWS, or a burst
//  still late past its time, was slow motion all along: the run counts up to the burst's first hop)
```

## js/games/jaywalk/season-gate.js

### the header

```js
// JAYWALK — THE SEASON GATE (JT1 — ROOM FIRST, docs/jaywalk.md "JT1 — SEASONS"): PURE + TINY — the only seasonal code in the START bundle.
// Whether a day ('d20261224') may need THE SEASONAL PACK at all: Oct 20 → Mar 1 (autumn → the melt). Everything else — the season clock
// (season.js), the looks, the models — is the pack's, fetched only on such a day (or when the lab forces one). A VIEW's input only: the
// rules, the course, the replay + the server never read it (THE GAMEPLAY LOCK — tests/jaywalk-jt1.test.mjs: it agrees with season.js#packDay
// on every day of the year).
```

## js/games/jaywalk/sfx.js

### the header

```js
// JAYWALK — THE SOUNDS (H2 — docs/jaywalk.md "THE SOUNDS"; the files: audio/jaywalk/ + CREDITS.md). The site's sound-engine pattern
// (docs/audio.md; HOLD'EM's sfx.js): the bytes fetched at preload (no AudioContext — nothing sounds before a tap), decoded ONCE when the
// SHARED engine unlocks, each sound an AudioBufferSourceNode → its gain → A SOFT LIMITER → the console's SFX bus (the Effects slider, the
// toggle, THE ONE MUTE and THE CUT apply there). ≈ 8 VOICES, by PRIORITY: your own hit / splash over a hop / a landing.
// Audio is POLISH: locked, muted, a missing file — nothing plays, nothing throws; every hazard keeps its visual tell.
//   IN PLAY: hop (pitch ± 6 %, gain ± 2 dB a hop) · land-wood (a landing on a log) · hit · splash (H2 — the engine's events: onEvent) +
//   H5A — THE WORLD's (cues.js → onCue): the train bell (a seamless loop while the signals flash) + the train passing, a car passing (a
//   whoosh — GONE with H5B, the owner), the horn (≤ 1 per 3 s, at half its level — H5B), the lights dying, a gateway (area-arrive — H5C), new-best,
//   H5C — the TRAIN HORN (one blast a train, when its warning starts). The mix is H6's.
//   EVERY sound has its pick (A) and, where one was delivered, a `-b` backup (B): the GAME plays A (the owner's pinned takes — BEFORE THE FLIP); the LAB plays this phone's audition pick (useLabPicks).
```

### before `if (!isUnlocked() || !ctx || !bufs.get(key) || bufCtx !== ctx) {`

```js
// (isUnlocked() = running OR NAPPING — CITY I's PODCAST MODE suspends the context between effects and a source's own start wakes it
//  (engine.js#wakeFor): asking for `running` here made JAYWALK silent with the site's MUSIC OFF — HIGH RISE S2's review found it,
//  the same fix as js/games/highrise/sfx.js; tests/jaywalk-podcast.test.mjs + tests/integration/jaywalk-podcast.mjs)
```

### before `let bell = null, bellWant = false;`

```js
// H5A — THE WORLD's CUES (cues.js#cuesAt → here): the bell is ONE seamless loop held while the signals flash — started on `bell-on`
// (a start that lands late, the first sound after an unlock, is still wanted or let go), FADED OUT on `bell-off` (H5B: 0.5 s — `FADE_S`)
```

## js/games/jaywalk/shot.js

### the header

```js
// JAYWALK — THE RUN's FRAME (docs/jaywalk.md "THE SHARE IMAGE" + "THE TOUCH-UP PASS"): the picture of the moment a player went out, kept
// on this phone until the next run — the view takes it (night.js#snap), the share card draws it (share.js). Pure state, no DOM.
```

## js/games/jaywalk/skyline.js

### the header

```js
// JAYWALK — THE PAINTED SKYLINES (H5C · H6B — docs/jaywalk.md "THE PAINTED SKYLINES"). PURE: WHICH picture the band shows at a lane
// (8 a look, DAY + NIGHT: the look's plain picture with that area's landmark painted in — the same crop; the opening keeps the plain
// one, the loop repeats the 8), which one to fetch ahead (only the current + the next are ever held), where the band rests, which of
// the night's small lights a landmark covers (OFF there). The view (night.js) loads + cross-fades them. No rule / server file reads it.
```

## js/games/jaywalk/sounds.js

### the header

```js
// JAYWALK — THE SOUNDS' TABLE (H2 — docs/jaywalk.md "THE SOUNDS"). PURE, no imports (the unit tests read it; sfx.js plays it): every sound,
// its words in THE AUDITION, whether a `-b` backup was delivered, the loop, its gain into the limiter, its PRIORITY — and the voice rule.
```

### before `{ id: 'out-drop', label: 'OUT (A MATCH)', b: false, gain: 0.28, pri: 3, play: true, match:`

```js
// J1 — THE MATCH MOMENTS (the owner's picks — original sounds, CC0 1.0 Ben; scripts/build-jaywalk-sounds.mjs): `match` = fetched only for a
// MATCH (a solo run never downloads them). THE SIREN sits UNDER the train's bell + horns (a train warning cuts through it — pri 2, the
// horn's: a full house drops it first) · the out sound soft on repeat · levels MEASURED (tests/integration/jaywalk-mix.mjs — THE MIX)
```

### before `{ id: 'leaf-crunch', label: 'LEAF PILE (AUTUMN)', b: false, gain: 0.9, pri: 1, play: true,`

```js
// JT1 — THE SEASONS (the owner, Nov 22 — CC0, the delivery's sfx11 + sfx12; scripts/build-jaywalk-sounds.mjs --jt1): `season` = fetched
// ONLY on its days (seasonSoundsOf — never on an ordinary day). A LEAF PILE's crunch (your own kid hopping into one) · THE FIREWORKS —
// distant + soft, the lowest priority (pri 1: any game sound outranks them), one at a time, UNDER the warnings (levels: THE MIX)
```

## js/games/jaywalk/splits-card.js

### the header

```js
// JAYWALK J1 — YOUR SPLITS on every run's end card (solo · match · the daily — docs/jaywalk.md "SPLIT TIMES"): one box per split REACHED
// (to 50, 100, 150 … — core/splits.js), in order: the time big, "TO 50" under it, the best under that; a NEW BEST = the green glow + NEW BEST +
// the gain ("−0:04"). The boxes show AT ONCE from the phone's own engine (view.js#onOver keeps this run's `sp` here); the NEW BEST marks come
// ONLY from the SERVER's answer for this run (its own replay — `{ r, b, n }`: profile/queue.js's outcome `sp` / the daily's `credit.sp`) and
// its numbers win (a run the server cut shows the server's splits). Many splits = a row that scrolls sideways, never shrinking a box. No pills.
```

## js/games/jaywalk/tuning.js

### the header

```js
// JAYWALK — THE TUNING (H1 — docs/jaywalk.md): every number of the rules in ONE place. PURE, no imports, no DOM.
// THE RULES' MATH IS CROSS-ENGINE SAFE: integers / fixed point and + − × ÷ + Math.floor only — never Math.sin / cos / pow / exp / sqrt
// (V8 and JavaScriptCore may differ in the last bit; the phone's run and the server's replay must agree hop for hop). The view may use anything.
```

### before `export const CLOCK = Object.freeze({`

```js
// ---- THE CLOCK (H3 — the anti-cheat: a run is played ON the server's clock; tick 0 = GO, a server timestamp the rules enforce. Every
// hop-log chunk carries its own server timestamp — the moment it ARRIVED. The server refuses a log that runs AHEAD of the real clock, and
// stops counting one that falls BEHIND it — a slowed game — at the last hop that was on time.
// H4 — THE DROPPED SIGNAL (the owner, Nov 16 — a phone in a moving van): the database queues writes while a phone is offline and stamps
// them when they ARRIVE, so a lost connection looks like slow motion. They are told apart by HOW the chunks arrive (replay.js#clockProblem):
//   · a DROP = a SILENCE, then a BURST of chunks landing together that catches up to the real clock → never held against the run (≤ `drop`)
//   · SLOW MOTION = the ticks drifting behind the clock while the chunks keep arriving → cut, as before)
```

## js/games/jaywalk/versions.js

### the header

```js
// JAYWALK — COURSE RULES VERSIONS (J2 — docs/jaywalk.md "COURSE RULES v2"): a course is a PURE function of (seed, course version). ONE
// source for which version a run is played + replayed on — the phone, the host's podium, the server's count + the daily all read THIS.
// PURE: no imports, no DOM, no clock of its own (every moment is handed in — a server time).
//   · v1 = the rules as they shipped up to J1 (tests/fixtures/jaywalk-v1/ is the frozen copy; tests/jaywalk-v1-frozen.test.mjs).
//   · v2 = EVEN STARTS + THE BLACKBIRD's RUNWAYS (course.js — every v2 change sits behind `cv >= 2`).
// THE SWITCH: v2 from the 4 am Eastern daily turn after J2 shipped — never mid-day. A run's version = the one in force at its GO (a
// SERVER time — a solo run's own GO, a match's FIRST GO); the daily's = the one in force at its day's 4 am. The version travels in the
// proof (`cv` beside `go` — rooms/{CODE}/jw/{matchId}/{uid}/cv; the daily's try record, server-written) and is CHECKED against the GO:
// a phone never picks its own. A run WITHOUT one (an old-code phone) replays as v1 until THE GRACE ends.
```

### before `let switchAt = CV_SWITCH_MS, switchDay = CV_SWITCH_DAY;`

```js
// (TESTS ONLY — the emulator's E2E plays v2 before the real switch: the page's `?emu&jwcv=<ms>` · the local /api's JW_CV_SWITCH_MS, both
//  honoured OFF Vercel only — api/_lib/jaywalk.js#cvFromEnv · view.js. The deployed site never moves the switch.)
```

### before `if (typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname`

```js
// (the emulator page's own: `?emu&jwcv=0` = v2 from the start — read ONCE at load, on a LOCAL host only; the phone, its host's podium and
//  the local /api — JW_CV_SWITCH_MS — then agree. Never on the live site: the hostname is checked)
```

## js/games/jaywalk/victory.js

### the header

```js
// JAYWALK — THE END SCREEN (H3 — docs/jaywalk.md "THE END SCREEN"): the BODY inside the console's podium frame (ui/final.js owns the frame:
// the XP box, THE FOOT — END-SCREEN STANDARD A since CITY F: PLAY AGAIN / REMATCH + SHARE · CITY / BACK TO THE ROOM). H4 — A MATCH: the
// frame's own WINNER line, this body = HOW YOU WENT OUT + your lanes, and the console's results list under it = everyone in order as slim cards, each with their lanes + their own cause line
// (finalRows' `note`). It names HOW YOU WENT OUT in big neon words (one line per cause + vehicle —
// causes.js), the lanes, then YOUR BEST — or NEW BEST (a moment + the new-best sound), only from the SERVER's own answer (the server
// replays the run: profile/queue.js's outcome — /api down = just the lanes). No pills, no emoji, no dev text.
```

### before `const first = standings(game).filter(r => r.rank === 1);`

```js
// (SHARE MY RUN moved to the console's foot — CITY F, END-SCREEN STANDARD A: ui/final.js's SHARE link calls index.js#shareRun for a match too)
// (the winner's moment: the console's own sting is off for this game's solo end — a match plays it here, once the crown lands)
```

## js/games/jaywalk/view.js

### the header

```js
// JAYWALK — THE GAME's SCREEN (H3 solo · H4 match · DAILY B: THE DAILY — `state.jwDaily`, js/games/jaywalk/daily-run.js): the scene (night.js), the kid, the controls + the sounds in the console's frame;
// the RUN = this phone's pure engine on the SERVER's clock, ONE LIFE → docs/jaywalk.md "THE SOLO GAME" · "THE MATCH" · "THE GHOSTS".
```

### before `let table = null;   // { uid, at, p: Promise<{ best, friends } | null> }`

```js
// THE LINES' DATA (lines.js): the SERVER-counted bests (yours + friends'), asked ONCE at a run's start, kept a short while;
// /api down = the best last told still draws YOUR BEST, no friend lines
```

### before `const pingRouter = createRouterPing(), liveWait = createLiveWait(liveOf);`

```js
// THE CONSOLE FIX — THE RUN HOLD (kit/run-hold.js; docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): this phone's
// own PROVEN match run is played to its own end whatever the host's state says — no podium over it, the router keeps this screen through
// a moved-on room; then its end is written and the phone follows. The podium waits for the rivals' live runs the same way.
```

### before `let awakeAt = 0;`

```js
// HIGH RISE S4A — THE SOUND SYNC (the owner plays with MUSIC OFF): PODCAST MODE naps the audio context between two effects — every hop's
// sound then had to wake it first (on iOS at the finger's LIFT: the sound late by a variable beat). A LIVE run HOLDS IT AWAKE: a lease
// renewed once a second from the frame (audio/engine.js#holdAwake, through its hub — THE STALE-MODULE RULE), let go when the run ends
```

### before `try { SFX.fetchSounds(); if (isMatch) SFX.fetchSounds(SFX.MATCH_SOUNDS); seasonSounds(dayO`

```js
// the sounds: the SHARED SFX bus; silent if anything fails — audio is polish
// (H4B — DECODED AHEAD: never a decode on the first tap)
```

### before `function watchGL() {`

```js
// THE LOST CONTEXT: iOS can take the WebGL context away — the run goes on (the server's clock), so the scene is REBUILT the moment
// it is back (or after 1.5 s); /admin hears once. A DELIBERATE teardown is never heard: the listeners come OFF (offGL) before
// any destroy() (its forceContextLoss fires 'webglcontextlost') → docs/jaywalk.md "THE TEARDOWN"
```

### before `let seasonRun = null;   // (the season this run APPLIED — its normal look if its pack was `

```js
// ---- J4 — THE SEASON (season.js — a VIEW: the run's own day → the winter look; the rules never see it): a solo run + the daily = their GO's
//  day, a MATCH = THE FIRST GO's playAt (every phone in the room the same winter). A pack not in by the start = that run's normal look.
```

### before `writeMatchGo(treePath(), uid, 'jaywalk', runs).then(ok => { if (gone || m !== matchId) ret`

```js
// (a TRANSACTION, never applied locally — THE NODES ARE THE TRUTH. THE PROOF PASS: the stamp + the GO are the kit's —
//  kit/proof-io.js#writeMatchGo, HIGH RISE's too)
```

### before `const target = Math.max(tickNow().t, log[log.length - 1].t + 1);`

```js
// (J2 FIX — the fresh-eyes review: never stop short of a hop already on the server — a clock estimate that moved back would leave it
//  unplayed here while the server replays it: THE END CHECK would refuse the honest run. At most CLOCK.ahead ahead of the clock)
```

### before `const countQuietLate = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then`

```js
// CITY I — A LATE PROOF CHUNK = A QUIET COUNT, NEVER A RULES REFUSED ROW (the inbox's 8:05 pm entry — the late k write's family, docs/jaywalk.md
// "THE LATE PROOF CHUNK"): the rules take c/{i} only in 'play' (+ the count's last 2 s) and once per index. (1) once this phone KNOWS the match
// left 'play' / moved on, no chunk (nor `e`) is written — the unsent hops are dropped + counted ('late-proof'); (2) from the moment it sees the
// end, a refusal of one already in flight is EXPECTED (firebase.js#expectRefusal — a quiet count; one refused while still in 'play' stays the
// alarm); (3) the first write after a REJOIN reads the node's chunks fresh and never re-sends an index that is there. The proof still verifies:
// once the phase is over every later chunk is refused too — no hole; the server's judge counts the run to its last LANDED hop.
```

### before `let W = null;`

```js
// THE PROOF PASS — THE PROOF WRITER (kit/proof-writer.js, HIGH RISE's too — the review's MUST 2 a): ONE burst at a time (the next chunk
// leaves once the one before is acknowledged), a REFUSED chunk is read back + sent again, the hops are NEVER dropped on the mirror alone
// (a mirror that says "the match moved on" only makes a refusal expected — (1) above now takes LATE_TRIES refusals), `e` behind the last
// chunk. A run's writer is its own (a late answer never touches the next run's). THE DAILY (its own node + rules): the old way (`pipe`).
```

### before `function pumpMoments(g, runs) {`

```js
// ---- J1 — THE MATCH MOMENTS (moments.js + moments-view.js): every OUT from that player's OWN end — their node's `e`, this phone's own
// engine — never the host's state (an honest END GAME never shows a fake OUT)
// (THE FRESH-EYES REVIEW: only a player with an on-time GO is in the moments — a seat that never GOes is never a duellist; a run the
//  host's own rule calls over without its `e` (a phone that quit / died mid-run: director.js#liveOf — idle-out, never the host's word) is
//  a QUIET end: no banner, no sound, it just leaves the count)
```

### before `const alive = mode === 'run' && !isOver(run), wt = alive ? run.t : Math.max(0, c.t), wa = `

```js
// THE WORLD's TICK this frame (H4B): while this phone's kid runs, HIS (a stall is caught up over a few frames — the cars with him);
// once he is out / for a watcher, the clock's. The ghosts are stepped to it and the scene draws every car + log at it.
```

### before `const placed = [], counting = !!rosterEl && rosterEl.classList.contains('is-on');`

```js
// the ghosts' name tags: each over its kid; two that would sit on each other (everyone on the start cell) stack upward
// (H5B's add-on — THE GHOSTS STOP BLOCKING YOU: no tag through the count (the names are lined up — the roster); a ghost NEAR YOU
//  is faint and has no tag (night.js: `tag` = null); ghosts on the same / touching squares share ONE tag — the leader's name + "+N")
```

### before `if (!g || g.phase !== 'final' || final || runLive()) return;   // (THE CONSOLE FIX: a live`

```js
// (the match is over — the host's step: the podium for everyone)
// (someone still standing at 6:00: the podium waits THE MOTHERSHIP's lift out)
```

### before `const S = startOf(g, runs, code);`

```js
// the course + tick 0 (H4B — logic.js#startOf: THE NODES ARE THE TRUTH): THE FIRST GO among the proof nodes the SERVER sent — in the
// count and in `play` alike, exactly what the server's own count derives; the game's own only with no node to read (an UNPROVEN match)
```

### before `const myN = runs && mine(g) ? runs[uid] : null, E = S ? matchVersion(S) : 1;`

```js
// (J2 — COURSE RULES v2: the match's version = the one in force at THE FIRST GO; this phone writes it beside its own GO once the first
//  GO is known (`cv` — the rules take it once; the host + the server check it). Its own node's word wins (a refusal: no `cv` → v1 in
//  THE GRACE — the version the server replays this node on)
```

### before `const late = !!myN && goOf(myN) > 0 && S && !onTime(myN, S.g0);`

```js
// (the course is taken ONCE its version is SETTLED — a watcher / an unproven match: the version in force; a player: its node's cv, or its
//  own write's answer; until then the count runs on (by tick 0 the version in force is taken — a slow answer may still move it))
```

### before `if (S && V && (course.seed !== S.seed || go !== S.playAt || course.cv !== V) && (runs || g`

```js
// (THE PROOF PASS — the inbox, Nov 20 ~12:49 am (2), HIGH RISE S4B's own fix: never adopted from the game ALONE while the proof mirror
//  is still on its way — a refresh mid-match took the match with NO hops of its own replayed. A proven match in `play` always has a
//  node to read: wait for it.)
```

### before `const myNode = runs ? runs[uid] : null;`

```js
// (THE PROOF PASS: a GO of this phone's own that landed LATER than the window after THE FIRST GO is no run — the server drops it
//  (core/proof.js#onTime): nothing is written for it. On the re-published rules such a GO is refused.)
```

### before `proven = !lateGo && ((haveGo && !g.unproven && mine(g)) || everProven);`

```js
// (THE CONSOLE FIX: once proven, the host's game can not take it back — a participants list without this phone, or `unproven` written
//  mid-run, stopped its chunks + its end: the run was cut. The tree says who played: this phone's on-time GO)
```

### before `if (proven && mode === 'over' && !wroteE && run && isOver(run)) sendEnd();`

```js
// (THE PROOF PASS — A HOST HICCUP AT GO, the take-back (HIGH RISE's REVIEW FIX A): a run that ENDED while the match was marked
//  unproven never wrote its `e` — once proven again the end goes up now: Call the Winner opens, the match does not wait 18 s)
```

## js/games/kit/call.js

### the header

```js
// Match kit — Call the Winner: an eliminated player gets CALL_MS to pick who wins (one locked pick, a right call earns
// game-night points through `nightBonus`). Refresh-safe: an existing call (st.live.calls) or a closed window just sets
// the state line.
//
//   showCall({ overlay, prefix: 'gl', game, st, me, player, candidates, path, line, intro, ended, onState, sfx })
//     candidates: uids still in (not me) — needs ≥ 2;  path: `rooms/${code}/glcall/${matchId}/${me}`
//     line(uid) → the small text under a name;  intro(n) → the sentence;  ended() → true once the match is over
//     onState(msg) → 'YOUR CALL · NAME' | 'NO CALL' (the HUD shows it);  sfx() on a pick
//     canPick(uid) → false = no write for that pick (greyed); expect: a label → its refusal expected 90 s from the tap (JAYWALK's polish)
//     ring: true → a COUNTDOWN RING beside the title (PD-2 — PRISM DROP): RING_TICKS ticks round a circle go out one by one + the seconds left
//       in its middle (opacity only — never a repaint), in place of the bar
```

## js/games/kit/proof-io.js

### the header

```js
// THE PROOF WRITER's WRITES + GO (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF WRITER"): the database half JAYWALK's + HIGH
// RISE's screens share — proof-writer.js (PURE) decides WHAT goes up and when; this file sends it. Every write through firebase.js
// (THE RULES-LAG: a refusal is seen).
```

### before `const begun = !!mirror && typeof mirror === 'object' && Object.keys(mirror).length > 0;`

```js
// (THE CONSOLE FIX — THE FRESH-EYES REVIEW: the stamp costs a read + an update before the GO; a phone whose mirror already shows the tree
//  stamped or begun (another phone was first — the stamp would be refused anyway) writes its GO at once: the 5 s window is THE FIRST
//  phone's stamp, and a slow phone behind it must not spend three round trips first)
```

### before `const stamp = begun ? Promise.resolve() : stampT0(tree, label);`

```js
// (THE CONSOLE FIX: the GO behind the stamp's answer — the stamp needs the tree empty)
// (two phones that both see the tree empty both stamp: the loser's stamp + counter is REFUSED by the rules — expected + silent, its GO
//  still lands in the winner's window. A turn order was tried and cost every other phone's GO a round trip: not worth it)
```

## js/games/kit/proof-writer.js

### the header

```js
// THE PROOF WRITER (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF WRITER"): what a run WRITES to its proof node — the log in
// chunks (c/{i}), then the end (e). ONE copy for JAYWALK + HIGH RISE (each had its own, 24 % the same code). PURE: no imports — the view
// hands it the writes (`io`: proof-io.js), the unit test a fake (tests/proof-writer.test.mjs).
//
// WHY (the review's MUST 2 a — THE LEAF WRITES): the old writers sent every chunk at once and forgot it. A host on a modified phone
// flipped the game's phase for a moment: a rival's chunk was REFUSED, the next index landed, the log had a hole and THE JUDGE refused the
// whole run. And an honest phone DROPPED its own unsent moves the moment its mirror said the match had left `play` — the mirror is the
// host's. Now:
//   · ONE BURST AT A TIME: the next chunk leaves only once the one before it is ACKNOWLEDGED — a later chunk never lands before an
//     earlier one (the judge reads the chunks' clock).
//   · A REFUSED CHUNK IS SENT AGAIN: the node's chunks are read back from the SERVER (never the mirror), the writer goes on from what is
//     really there — after 0.4 · 0.8 · 1.6 · 3 s … for as long as a chunk that lands can still count (GIVE_UP_MS).
//   · NEVER DROPPED ON THE MIRROR ALONE: a mirror that says "the match moved on" only makes a refusal EXPECTED (a quiet count); the
//     moves are dropped after LATE_TRIES refusals in that state — the match really is over.
//   · A DEAD LINE (no answer for STALL_MS): the new moves queue up behind the unanswered chunk once a second — they land TOGETHER when
//     the line is back, as they always did (THE DROPPED SIGNAL: the judge wants a burst, each chunk less late than the one before).
//   · THE END goes up only behind the last chunk's acknowledgement (HIGH RISE's rules take no chunk once `e` is there).
// `pipe` (JAYWALK's DAILY — its own node, its own rules: unreadable, nothing after its end): the old way — every chunk at once, none again.
```

## js/games/kit/run-hold.js

### the header

```js
// THE CONSOLE FIX — THE RUN HOLD, the cartridge half (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST").
// JAYWALK's + HIGH RISE's screens share it. A MODIFIED host wrote `final` (or moved the room on) while honest runs were LIVE — every phone
// left its run for the podium / the room, he played on and won. Now:
//   · A LIVE RUN IS PLAYED OUT: a phone whose own PROVEN run is live never shows the podium, and tells the router it holds the run
//     (`holdsRun` — app.js's RUN HOLD keeps the screen through a moved-on room, room.js holds a kick); the run's end is written, THEN the
//     phone follows the room (`pingRouter`).
//   · THE PODIUM WAITS FOR THE LIVE RUNS (`createLiveWait`): a phone that is out (watching) sees `final` while a rival's run is still live
//     (the game's liveOf — core/proof.js#liveGoers, the honest host's own "has it ended?" rule on the players' own nodes): it keeps
//     watching; the podium comes once none is (the cap ends every wait) — scored then from the nodes as they stand (the game's own
//     finalPatch), never the early `final`'s numbers.
// An honest match never waits here: the host writes `final` only once no run is live.
// Lazy (the cartridges'): app.js's hub is read through globalThis (THE STALE-MODULE RULE).
```

## js/games/kit/tiers.js

### the header

```js
// Match kit — quality tiers (2 high / 1 mid / 0 low) from measured frame pacing.
// Steps down when the p75 frame time > 19.5 ms; steps back up after 8 s of p75 < 17.2 ms with < 6 ms of work a frame
// (never back to a tier that failed). The same rule every renderer in the app uses.
//
//   const tiers = createTiers({ apply: t => { scene.setTier(t); sky.setTier(t); } });
//   frame: const w0 = performance.now(); …draw…; tiers.sample(now, performance.now() - w0); tiers.tick(now);
//   tiers.get() / tiers.set(t) (tests) / tiers.fps() / tiers.work()
```

## js/ui/fin-neon.js

### the header

```js
// THE END NEON (CITY PART 2 — the owner, Nov 19 6:55 pm item 2; docs/match-kit.md "THE END NEON"): ONE builder for the coloured neon on EVERY
// game's end screen — HIGH RISE's look (S4B), now every game's:
//   the HEADER "<GAME> · SOLO / · MATCH" — the game's NAME in its own sign's colours, the mode softer (finHeader — the console's frame kicker
//     through createFinal's `mode`, or a page's own card);
//   the RESULT line — saturated neon in the game's accent, the colour IS the letter (a hair-thin bright core + its glow); a win / finish line
//     GOLD (finLine — a body's cause line; the console frame's own WINNER title through `.final.has-neon`).
// The colours = the game's ONE row (js/games/metas.js NEON) — never a per-screen copy; `day` = paint inks for an end that stands on a light
// ground (PRISM DROP's paper), read LIVE from body[data-look] (THE GAME LOOK). The words carry the meaning, never the colour alone (COLOUR-BLIND).
// DOM only: no store, no fetch (HIGH RISE's /highrise-play page builds its card with it too).
```

## js/ui/final.js

### the header

```js
// THE PODIUM's FRAME (SHELL 2.0 A — review-6.md D8, agreed with the Overclock chat): the CONSOLE owns the end-of-match screen's frame — the
// kicker + the WINNER line, the XP box (profile/callouts.js) with the end-of-round moment's order after it ("already yours" / the next unlock,
// THE CARD REVEAL), and THE FOOT — END-SCREEN STANDARD A since CITY F (the bar in the game's accent + the quiet links; below). HOLD'EM IN THE CITY —
// B3 (HE9's Fable review: with 8 slim cards it was cut at 390 × 844, below the fold on the SE / sideways): THE ACTION ROW IS STICKY at the
// screen's foot — ALWAYS ON SCREEN, every game — the frame's last piece (under the XP box when nothing follows it), over a solid backing
// (--fin-bg: a game whose podium isn't the console's dark panel sets its own), with a soft fade + a small MORE BELOW cue while the cards run
// past the fold (measured on a scroll + a resize only; the cue goes once scrolled). NEW GAME lives in the room's dock; REMATCH is the foot's bar.
// A game draws its own BODY inside the frame by exporting finalScene(el, game, state) from its module (OVERCLOCK's "OVERCLOCKED", the
// tube-sign name, the 2-1-3 podium, award chips, SOLO's NEW PERSONAL BEST); without it, the console's default podium rise (3rd, 2nd, 1st).
// The full leaderboard follows the XP box; the button stays at the foot.
```

### before `const g = game || state.game;`

```js
// (THE CONSOLE FIX: `game` = the match as the game scored it on this phone — a podium that waited for a live run reads the nodes, never an
//  early `final`'s numbers; default the room's)
```

### before `const PN = globalThis.__nsPlayNow;`

```js
// CITY F — END-SCREEN STANDARD A (the owner's pick, Nov 17 — Downloads\NEON\endscreen-standard-A.jpg): ONE foot for EVERY game's end screen,
// built HERE (no game keeps its own copy): ONE big SOLID bar in the GAME's ACCENT (the cartridge's ACCENT; the console's pink without one —
// THE SHELL's one named exception to THE NEON TUBE: the screen's MAIN button in the game's colour) + under it QUIET icon links, no boxes.
//   SOLO (PLAY NOW's solo room / a room of one): the bar = PLAY AGAIN (the replay icon) · the links = SHARE (when the cartridge shares) ·
//   CITY (BACK TO THE CITY — a solo room) or BACK TO THE ROOM (a room of one).
//   A MATCH: the bar = REMATCH — the host's tap = host.js#rematch (the same game + settings, everyone in); a guest's tap = THEIR VOTE
//   (rv/{uid} = this match — the room's ring counts it after the walk back; again = take it back) → the bar says WAITING FOR THE HOST +
//   the votes, never dead · the links = BACK TO THE ROOM (the host's brings the room back; a guest walks back alone) · SHARE.
// Dark text on the accent when it reads ≥ 4.5 : 1, white otherwise (finInk). Every control: data-press (the podium is a game's screen —
// the implicit press is off there) / SHARE data-gesture (Safari's own share sheet), a 44 pt tap area.
```

### before `const instant = (soloRoom || oneRoom) && mod && typeof mod.soloAgain === 'function' ? lazy`

```js
// (PLAY NOW — PLAY AGAIN = the same game + options, THE SOLO START (JAYWALK H3 — THE INSTANT AGAIN: a cartridge with `soloAgain` starts its
//  next run with NO walk inside — games/kit/again.js, loaded with the podium); BACK TO THE CITY = the solo room closed like a QUIT. Read
//  through host.js's hub (__nsPlayNow) — this lazy chunk imports no new export)
```

### before `const live = () => !gone && state.code && state.game && state.game.matchId === m && state.`

```js
// (CITY G — A LATE VOTE NEVER GOES IN (/admin RULES REFUSED rooms/*{rv/*}, Nov 17 10:27 pm): CITY F queued a refused vote on the phone and
//  wrote it once the room was back — after the end screen was gone. Now a refused vote is DROPPED (the bar shows it is not in); nothing
//  is ever written off the podium. The vote is written only while THIS match's end screen is up)
```

### before `const shareT = h('span', 'SHARE');`

```js
// (JAYWALK BEFORE THE FLIP — a game whose card uploads at the tap: a slow first tap reads PREPARING…; 'ready' = the link is made but the
//  tap's user activation was spent on the upload (iOS) — the link reads SHARE again, lit, and the NEXT tap shares at once)
```

### before `const top3 = !body || body.dataset.podium !== 'none';`

```js
// (FRIENDS B — B4: a body that already shows the top three (OVERCLOCK's 2-1-3 podium, the console's own) → the results list starts at 4th;
//  a solo run / a room of ≤ 3 has no list then; a body that shows NO podium says so — el.dataset.podium = 'none' (OVERCLOCK's NOBODY
//  SCORED) → the whole list)
//  (HE4: a body that shows EVERY place itself — HOLD'EM's places / ledger as slim cards — says el.dataset.podium = 'all' → no list here)
```

### before `const neonKick = mode != null && g && neonOf(g.id) ? finHeader(g.id, mode) : null;`

```js
// (CITY PART 2 — THE END NEON: a game with a NEON row + a `mode` ('SOLO' / 'MATCH') → the header "<GAME> · <MODE>" in its sign's colours —
//  ui/fin-neon.js, the ONE builder; without either the kicker as given)
```

### before `const measure = () => {`

```js
// (B3: is there more below the fold? — on a scroll + whenever the frame or a piece of it changes size: the XP box lands late, the rows
//  stagger in; never in a frame loop)
```

### before `if (g && g.matchId && state.podium !== g.matchId) queueMicrotask(() => { if (!gone && stat`

```js
// (FRIENDS B — B2: THE VICTORY MUSIC waits for the BODY: app.js#musicFor plays the podium music once this frame is on screen — never during
//  the last round's answer screen. Local state, keyed by the match — a refresh on the podium remounts the frame and sets it again)
```

### before `if (allTied) return;   // (B4: a draw — no winner sting, no buzz, no confetti)`

```js
// (FRIENDS B — the winner sting = THE PODIUM SOUNDS' xylophone flourish (was the synth arpeggio); a cartridge with OWN_VICTORY_SOUND
//  plays its own — OVERCLOCK's fanfare — so the console stays quiet: never two winner sounds — B2)
```

## js/ui/fit.js

### the header

```js
// THE NAME NEVER CUTS OFF (THE VAULT 1B — the owner's membership card showed "LOEWFIZZ…" for LOEWFIZZLE): a player's name is shown WHOLE,
// always — never an ellipsis. fitName(el, { min }) sizes the text to its box: the CSS size first; too wide → shrunk to fit (never below
// a readable minimum); still too wide at the minimum → TWO BALANCED LINES (the name split in the middle — WWWWWW / WWWWWW, never eleven
// + one), sized so the longer half fits. Measured when the fonts are in + again only when the box itself changes width (a
// ResizeObserver — never a layout read in a frame loop). NAME_MAX is 12: the widest twelve (WWWWWWWWWWWW) is checked at 390 on the
// card, the strips + the podium (the profile E2E). The name must be the element's FIRST child (a text node); a badge after it stays.
// Works on any element whose parent gives it its width (a flex child needs min-width: 0).
```

### before `const live = new Set();`

```js
// THE SPEED PASS — A FONT THAT ARRIVES LATE (LOBBY FIXES' cloud red: 2 of 42 glowing names overflowing in the lab's GLOWS — "a font-timing
// flake"): `document.fonts.ready` only waits for the fonts ALREADY loading; a name whose face starts loading after it resolved was fitted on
// the fallback face, and nothing fitted it again when the real one landed (the box's width doesn't change → no ResizeObserver). Every fitted
// element re-fits once more when ANY font finishes loading (one listener; a disconnected element drops out)
// PFIX-A (FABLE REVIEW PRISM finding 3 — THE RETAINER): the list holds each fit WEAKLY. It held the closures themselves (each one holds its
// element) until a font next finished loading — after the first minute none ever does — so every podium's names pinned their whole screen
// (PRISM's board canvases, ~12 MB a match). A fit lives exactly as long as its element (the `fits` WeakMap: element → fit); the list never
// keeps one alive. Nothing else changes: a connected element still re-fits on a late font.
```

### before `/** fit one element's text; o.min = the smallest one-line font size (px), o.two = the larg`

```js
// JAYWALK THE POLISH PASS (the owner, Nov 18 6:55 am — "a name must never wrap mid-word on a slim card"): o.one = ONE LINE ONLY (the slim
// cards — vault/strip.js): the CSS size, then shrunk to fit down to o.min, then — only if it still can't fit at the minimum — an ELLIPSIS
// (`fit-cut`). Never the two-line split. (The full card, the podium, the dress keep the rule above: whole, two lines.)
```
