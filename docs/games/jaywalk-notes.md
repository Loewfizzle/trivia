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

## VARIETY B2 — THE TRAILING NOTES + THE DOC BLOCKS (moved out of the start bundle, Nov 22 2026)

Every trailing `//` note (≥ 30 characters) and every multi-line `/** … */` block of JAYWALK's own preloaded modules moved here VERBATIM (a block keeps its first line + " …" in the code). Token-identical code (acorn's token streams compared, every file). Listed per module in file order: a trailing note under the code it ended (its first 100 characters), a block "before" the code line that follows it.

### js/games/jaywalk/areas.js

- before `export const LOOKS = Object.freeze([`:

```js
/**
 * THE LOOK of each area (index = course.js#area(lane).index): `accent` (its gateway's neon + its signs), `paint` (H5B — its gateway BY DAY), `hero` (H5B — the pieces beside its gate), `sky` (the skyline band's
 * tint), `lamp` (its street lamps' light) + `lampEvery` (a lamp every n-th ground lane), `obs` (what an obstacle on a PLAY cell is —
 * every one stands knee-high or taller and reads as solid), `edge` + `edgeP` (the dressing in the edge columns of a ground lane and how
 * often), `tufts` (grass tufts on its ground), `sig` — its SIGNATURE PIECES ([what, the lane of the stretch it stands nearest to]):
 * the dock crane, the neon fish, the bridge's towers, THE LIGHTHOUSE, the control tower, the hangars, the moored boats.
 */
```
- `{ g: cyl(0.15, 0.2, 0.5), color: 0x57504c, at: [0, 0.25, 0], shade: by([0.7, 0.9]) },` — // (warm iron — the review: the bollards read indigo-blue by night)
- `{ g: roundBox(0.72, 0.16, 0.52, 0.07, 2), color: 0xf4f6f4, at: [0, 0.46, 0] },` — // (the ice: white — never pale blue: blue on the ground = water)
- `const CONTAINER_HEX = [0xd8472f, 0xb5522f, 0x3ea86a, 0xe8a02a, 0x8a5fd0, 0xd8d8e0];` — // (H5C: no blue box — blue on the ground = water, the props too)
- before `export function dressLane(d, T, i, L, h) {`:

```js
/**
 * what stands on a ground lane of an area (view only — from the seed + the lane: the same picture on every phone). `h(a, b)` = the
 * scene's own hash (0 … 1) for this lane. Fills d = { obs: [{ c, k, s, ry, dx, dz, r (a second random), edge? }], lamp, lampHex }.
 * An obstacle on a PLAY cell is one of the area's solid pieces; everything else here stands in the two dim edge columns.
 */
```
- before `export function sigOf(course, s, pick) {`:

```js
/**
 * THE SIGNATURE PIECES of one stretch (view only): [{ y0, side (−1 left | 1 right), what, n }] — each on the lane nearest its place
 * that can hold it: THE CRANE + the bridge's towers STRADDLE their lanes (their thin legs stand on the lane lines — the cars, the
 * logs, the trains run between them), so any lane but a flight path / a gateway; the rest stand on a GROUND lane's edge column (a
 * moored boat: a ground lane beside water when there is one). Sides alternate from the seed; the towers come in pairs.
 */
```
- before `/** a BIG edge piece (it takes the whole edge column of its ground lane): q = dressLane's entry, x0 `:

```js
/** the scene's context for the two draw functions: { K (its kinds), A (the areas' kinds), KM + BOX (Kenney's + the landmarks'), X, Z,
 *  lt (how lit the lane is: the blackout), on (its lights are on), T (the area's look), h (a hash 0 … 1), course } */
```
- `if (shop && c.SH && c.SH(q, x, z, dim, lt, on, c.day, sg)) return;` — // (H6B — shops.js, on demand: Kenney's storefronts; this box until they land)
- `if (c.day) {` — // (BY DAY: dark glass, a shop's sign a PAINTED board — no light thrown)
- before `export function drawSig(P, c) {`:

```js
/** ONE signature piece (its lane is being laid). → { beam: [x, y, z] } where THE LIGHTHOUSE's lamp is (the scene sweeps its beam
 *  over the lanes) · { sign: [x, y, z] } where THE NEON FISH hangs */
```
- `const hot = k => (c.day ? lt * Math.min(1.12, (c.ek || 0.5) * 1.4 * k) : dim * k);` — // (by day the sun lights a pale piece: never blown out)
- before `export function drawFishSign(c, w, hgt, day = false) {`:

```js
/** THE NEON FISH (the fish market's sign) on a canvas: a fish in neon tubes + its eye — drawn once a look (H5B — by DAY a painted
 *  board: an orange fish, a white edge) */
```

### js/games/jaywalk/arrival.js

- `import { area } from './course.js';` — // (the area table — PURE; the colours come in from the caller: areas.js#LOOKS needs three.js)
- before `export function createArrival(parent, LOOKS) {`:

```js
/** the banner on `parent` (the game's / the lab's stage), the areas' colours = areas.js#LOOKS ({ accent, paint } an area) →
 *  { show(lane, look) → shown?, hide(), on(), text(), destroy() } */
```
- `el.classList.remove('is-on'); void el.offsetWidth; el.classList.add('is-on');` — // (the entrance again from its start — once a crossing, never in a frame)

### js/games/jaywalk/camera.js

- `export const ANGLE = 'straight';` — // (H3 — the owner's pick so far, Nov 16: ZOOM 8 + STRAIGHT; the lab keeps both switches — a later pass flips it in this one line)
- before `export function lensFor(aspect) {`:

```js
/** the lens for a screen shape (aspect = width / height): the vertical fov (degrees) that puts exactly ZOOM columns across at the kid's row,
 *  + how far ahead of him (in rig units) the camera aims so his feet sit KID_AT down the screen. PURE. */
```

### js/games/jaywalk/causes.js

- `import { VARIETY_IDS, VARIETY_LINES, varietyAt, varietyKnown } from './variety.js';` — // (VARIETY B1 — THE AREA TRAFFIC: which model draws a slot — cosmetic)
- before `export function plainAt(course, lane, j) {`:

```js
/**
 * THE ONE SOURCE OF TRUTH: which vehicle the j-th mover of ROAD lane `lane` of this course IS — a 1-cell car = a sedan / a hatchback /
 * a taxi (from the course's seed + the lane + its place in the lane), 2 cells = the van, 3 = THE BOX TRUCK. '' = not a car.
 * The night look draws by it; the end screen's line names it.
 */
```
- before `export function vehicleAt(course, lane, j) {`:

```js
/** VARIETY B1 — THE AREA TRAFFIC: the slot's AREA model (variety.js — the course's seed, its own draw) once that model has come in on this page
 *  (a slow network: the plain vehicle is drawn, and named) — else the plain one (plainAt). The same answer the night look draws by. */
```
- before `export function hitVehicle(course, { y, x, end }) {`:

```js
/** the vehicle that hit a kid who went out by a car: { y: the lane, x: their centre (FP), end: the tick } on this course → its kind.
 *  The one on them at that tick — the engine's own box; were none found (never, for a real car hit) the NEAREST on the lane: a car hit
 *  always names a vehicle that is on the screen ('' only when the lane is no road at all) */
```
- before `export const CAUSE_LINES = Object.freeze({`:

```js
/** THE WORDS — one line per cause + vehicle (≤ 2 short lines at phone size; no emoji, no dev text). NO generic car line: a car hit is
 *  always one of the five vehicles */
```
- `if (taken || cause === 'taken') return SHIP_LINE;` — // (H6A — a finish line, not a death: never "TAKEN" in anything a player reads)
- before `export function runLine(course, { cause = '', y = 0, x = 0, end = -1, lanes = 0, taken = false } = {`:

```js
/** the line of a finished run on its course (the game's views + the lab + the podium all come through here): { cause, y, x, end, lanes, taken }
 *  + `look` (H5B — the look on this screen: 'day' | 'night') */
```

### js/games/jaywalk/course.js

- before `export function area(lane) {`:

```js
/** THE AREA a lane is in (H5A — tuning.js#AREAS): { name, index (−1 = the opening, lanes 0–49 · 0 … 7), loop (0 = the first time
 *  round, 1 = the loop's second lap …) } — lanes 50–99 THE DOCKS … 400–449 THE AIRFIELD, 450–499 THE DOCKS again */
```
- before `const OPENINGS = new Map();`:

```js
/**
 * J2 — EVEN STARTS (v2 only — tuning.js#EVEN): the OPENING's kinds (lanes 0 … STRETCH − 1) for a seed, decided IN ORDER — each lane's raw
 * kind (its own first draw, as in v1), then the spread tightened: a ground lane past the run / the window's cap becomes a hazard (its own
 * second rng — the lane's own draws stay its own), a hazard past its run becomes ground; never more than 3 water — or 3 rail — in a row;
 * no water before FIRST.water, no rail before FIRST.rail. PURE: a function of the seed alone (memoised, a few seeds at a time) — the
 * same whatever lane is asked first, on the phone or the server.
 */
```
- `const hazard = i => {` — // (a forced hazard: road · water · rail by the heat's own weights — never a 4th water / rail in a row)
- before `const SPECIALS2 = new Map();   // (J2 — v2's stretches, a few at a time: every lane asks for its str`:

```js
/** A STRETCH's SPECIALS (the 50 lanes after a landmark): THE UFO (from lane 100) or THE BLACKBIRD's flight path (from lane 150) — rare, from
 *  the seed, NEVER both in one stretch. → { s, ufo: zone | null, bb: band | null } */
```
- `const SPECIALS2 = new Map();` — // (J2 — v2's stretches, a few at a time: every lane asks for its stretch's, and a runway's layout is checked as it is made)
- before `function specials2(seed, s) {`:

```js
/**
 * J2 — A STRETCH's SPECIALS, COURSE RULES v2 (tuning.js#RUNWAY): THE UFO as in v1 (its zone drawn from the same stream — from lane 100,
 * capped lower) or THE BLACKBIRD's RUNWAYS — from lane RUNWAY.first, more often from 250, THE AIRFIELD full of them; never both in one
 * stretch. → { s, ufo, bb: null, bb2: null, rw: [{ id, y0, n, lanes: [the pulse of each lane] }] }
 */
```
- `const a = ri(rand, 8, 30); ri(rand, 10, 38);` — // (the UFO's zone + drift: v1's own draws, in v1's order)
- `for (let j = n - 1; j > 0; j--) { const q = ri(R, 0, j), t = slots[j]; slots[j] = slots[q]; slots[q]` — // (the order the jets come in: shuffled)
- before `export function runwaySlack(lanes) {`:

```js
/**
 * J2 — FAIR BY CONSTRUCTION: how many start ticks of a lap a CAREFUL kid on the safe lane before a runway can leave from and get across —
 * waiting (on a lane while it is quiet) + hopping up (a hop = HOP_TICKS: the lane it left for the first half, the next one after —
 * engine.js). A lane counts as deadly through its pass + its trail at EVERY column (the jet crosses the lane in `pass` ticks: the
 * strictest column for each tick). PURE, integers: a backward pass over three laps of (lane, tick).
 */
```
- before `export function runwayWait(lanes) {`:

```js
/**
 * J2 FIX — FAIR BY CONSTRUCTION, the wait: the LONGEST a careful kid (the same model as runwaySlack — every column, waiting + hopping) can be
 * kept from the safe lane before a runway to the safe lane after it, beyond the hops themselves, over every start tick of a lap (ticks).
 * PURE, integers: a backward pass of the earliest arrival over four laps. (A start no way across in that horizon = a huge number.)
 */
```
- before `export function typeAt(seed, i, sp = null, cv = 1) {`:

```js
/** a lane's FINAL kind: 'grass' | 'road' | 'water' | 'rail' | 'flight' — the raw kind after the course's rules (the calm opening, the
 *  landmark lanes, the flight path's bands, no water / rail under a UFO, never more than 3 water — or 3 rail — lanes in a row). Reads raw kinds only: no recursion. */
```
- `while (n < i && rawType(seed, i - 1 - n) === t) n++;` — // (the raw run behind this lane — it ends at the calm opening at the latest)
- before `export function buildLane(seed, i, cv = 1) {`:

```js
/**
 * ONE LANE — pure by (seed, lane index): { i, type, heat, mark (its landmark's name | null — the GATEWAY into that area), ufo (THE UFO whose beam can reach it | null),
 *   grass:  obs [9 × 0 | 1]
 *   road / water:  dir, v, period, pad, items [{ off, len }]   (cars · logs)
 *   rail / flight: pulse { period, phase, tell, pass, len, v, dir (+ band, n: the flight path's lanes share ONE pulse) } }
 */
```
- `const rand = laneRand(seed, i); rand();` — // (the first draw was the raw kind)
- `const wet = !calm && (typeAt(seed, i - 1, null, cv) === 'water' || typeAt(seed, i + 1, null, cv) ===` — // (a log's rider may step off anywhere)
- `const dir = i % 2 ? 1 : -1;` — // (two water lanes side by side always run OPPOSITE ways: a rider always meets the next lane's logs)
- `} else lane.pulse = bandAt(sp, i).pulse;` — // (THE FLIGHT PATH: every lane of the band shares the band's one pulse)
- `if (p.trail && u < p.pass + p.trail) return { st: 'trail', k, s: u - p.pass, left: p.period - u };` — // (J2 — v2's RUNWAYS: THE AFTERBURNER TRAIL burns on — still deadly)
- `const key = String(seed), lanes = new Map(), keep = o.keep || 700, cv = o.cv === 2 ? 2 : 1;` — // (J2: the COURSE VERSION — 1 unless asked)

### js/games/jaywalk/cues.js

- `bellBehind: 2, bellAhead: 6,` — // (a rail lane this near the kid — on his screen — rings the bell)
- `hornReach: 2600,` — // (… when a car's nose is within 2.6 cells of him and closing — past the near miss's 1 cell)
- before `export const TICK = Object.freeze({ far: 3.5, near: 1, levelFar: 0.18, rateFar: 0.85, rateNear: 1.75`:

```js
/** THE STOPWATCH (BEFORE THE FLIP): the dark's gap behind the kid (lanes) → silent at `far` and beyond (the wall waits 5 lanes back;
 *  3.5 = just outside the old lights-dying's 3 — measured: ≈ 8 % of a moving bot's run, heard in half the runs; at 4.5 it was 24 %, every
 *  run), then fading in from `levelFar` + speeding up to its loudest + fastest at `near` */
```
- before `export function carClosing(lane, tick, x) {`:

```js
/** the car on a ROAD lane nearest ahead of the kid's box that is driving AT him: → { gap (FP from its nose to his box), side (−1 it
 *  comes from the left | 1 from the right), j (its place in the lane — causes.js#vehicleAt names it) } or null */
```
- before `export function cuesAt(S, run, course) {`:

```js
/**
 * ONE TICK: the run after its step (alive), the course → the cues to play now: [{ cue, pan? }] (the engine's events are no longer read:
 * the near miss made the car-pass, gone with H5B).
 * S = createCues(). Deterministic: the same run + course give the same cues.
 */
```

### js/games/jaywalk/daylook.js

- before `export const BANDS = Object.freeze({ sunrise: 6, golden: 10, sunset: 2 });`:

```js
/** THE BANDS (the sun's elevation, °): the DAY look — whatever AUTO calls day — split into
 *  sunrise = a morning under +6° · noon = above (morning ≥ +6°, evening ≥ +10°) · golden = an evening +10° … +2° · sunset = an evening under +2°
 *  (into the blue hour) → night where the city says night (sky.js: about −10.5° in the morning, −9° in the evening) */
```
- before `export function lightsOf(tod, el) {`:

```js
/** THE LIGHTS by time (the owner, Nov 22): { cars, beams, neon, lamps } 0 … 1 — what glows in a DAY look (night = all 1, as always)
 *  sunrise: the cars' head + tail lamps at HALF (small, crisp — no beams, no glow pools) + the neon switching OFF through the morning (the
 *  city's own neon ramp) · noon + golden: none · sunset: the city's lamps ramp (around sunset) brings the lights ON, its neon ramp the neon */
```
- before `export function overcastDay(day) {`:

```js
/** OVERCAST (the owner): an occasional weather day picked by DATE — the same for everyone, about 1 day in 7, day looks only. `day` = the
 *  run's own 4 am Eastern day key ('d20261124' — the season's: a match = its first GO's day) */
```
- before `export function resolveTod(choice, sun, day, force = {}) {`:

```js
/** the look one phone shows: { tod, look ('day' | 'night'), el, morning, overcast, lights } — `choice` = the GAME LOOK (auto · day · night),
 *  `sun` = { el, morning } (sky.js — the phone's own place + clock, or the HOST's stamp in a match), `day` = the run's day key (overcast) */
```
- before `export const GRADE = Object.freeze({`:

```js
/** THE GRADE of each DAY look (+ OVERCAST over any of them) — night.js#lookGL + the ground shader + the band's css (`data-tod` / `data-wx`):
 *  key [hex, intensity, the sun's height for the shadows °] · hemi [sky, ground, intensity] · fog = the far haze · warm = the ground's sunlit
 *  tint · cool = its shadows' tint · sun = how strong the sun's shadows (0 = none) · len = how long (× noon) · cloud = the drifting cloud
 *  shadows · dew = the sunrise's sparkle on the grass · shine = the cars' paint in the sun (envMapIntensity; roughness by `gloss`) */
```
- before `export async function sunAt(ms) {`:

```js
/** the sun at the phone's place now (core/sky.js — THE CITY's model: its place from the phone's zone, its day / night = kit/look.js#sunUpNow's
 *  rule) → { el, morning, night } · null if the module can't load. The HOST's stamp at a match's start is the same object, packed (`stampOf`) */
```
- before `export const stampOf = s => (s ? { e: Math.round(s.el * 10) / 10, m: s.morning ? 1 : 0, n: s.night ?`:

```js
/** THE HOST's clock in a match (the owner): the sun at the match's start, packed into the start (`game.lk` — the host's own write, no new rule)
 *  → { e, m, n } · back → the sun object */
```

### js/games/jaywalk/director.js

- `seed: solo ? String(seed) : '',` — // (a MATCH's course is picked AFTER GO — the step count → play; a SOLO run's from its own GO — never this)
- before `export const endedFor = (game, node, now, online) => !!(node && node.e) || now >= lastSeen(game, nod`:

```js
/** H4: has this player's run ended, as far as the room can tell? their own `e` — or a silence long enough that the kid is out AND (offline)
 *  a dropped signal has had its time to come back */
```
- before `export function liveOf({ code, matchId, tree, now, online = null }) {`:

```js
/**
 * THE CONSOLE FIX — THE LIVE RUNS of a match (core/proof.js#liveGoers on this game's clock: THE FIRST GO's tick 0, THE MOTHERSHIP's cap
 * + END_GRACE_MS, IDLE_OUT_MS, DROP_WAIT_MS): the on-time runs not ended yet, read from the proof nodes ALONE (never the host's game) —
 * THE SERVER holds a report while any is (api/report.js), the podium waits for them (view.js). → { uids, until }
 */
```
- before `export const nextRun = (game, { matchId, now }) => (game && game.phase === 'final' && game.mode === `:

```js
/** H3 — PLAY AGAIN after a SOLO run (PURE — the console's INSTANT AGAIN: games/kit/again.js): the NEXT solo run of a finished one — a new
 *  match of its own (its own id, its own proof node, its own report), the same player, `play` at once. null = not a finished solo run. */
```

### js/games/jaywalk/engine.js

- `t: 0, st: 'idle',` — // 'idle' | 'hop' | 'out' | 'taken'
- `x: MID_COL * FP + FP / 2, y: 0,` — // the kid: centre x (FP), lane
- `fx: 0, fy: 0, tx: 0, ty: 0, k: 0,` — // a hop in flight: from → to, k of HOP_TICKS
- `best: 0, bestT: 0,` — // the farthest lane LANDED on + its tick (the ranking: lanes, then the earlier tick)
- `sp: [],` — // J1 — SPLIT TIMES: sp[i] = the tick lane (i + 1) × SPLIT_EVERY was FIRST landed on
- `bbBand: -1, bbK: 0, boom: 0,` — // THE BLACKBIRD's moment: standing on its lane when the tell began → hopped clear
- `near: {}, took: {}, beam: -1,` — // THE UFO's: the ones whose beam swept beside the kid · the ones that took them
- `carKey: -1,` — // (the near-miss event's latch)
- `else { const col = colOf(tx); if (to.type === 'grass' && to.obs[col]) ok = false; else tx = col * FP` — // (off a log: snapped to its column)
- `} else if (ok && (tx < 0 || tx > WIDTH)) ok = false;` — // (on the water the kid keeps their place along the log — never past the edge)
- `if (run.y % SPLIT_EVERY === 0) run.sp.push(T);` — // (J1: `best` climbs one lane at a time — every multiple is landed on exactly once)
- before `export function step(run, course, d, ev) {`:

```js
/**
 * ONE TICK. `d` = this tick's hop ('' = none); `ev` (optional) collects the EVENTS for the view + the sounds:
 *   hop { d } · bump { d } · land { on: 'ground' | 'wood' | 'water' } · best { lane } · landmark { lane, name } · near { lane } (a car within a
 *   cell) · beam { id } (THE UFO's beam beside the kid) · boom (THE BLACKBIRD passed the lane they hopped clear of) · out { cause, lane } ·
 *   taken { lane }
 * (the WORLD's own moments — a train's tell, THE BLACKBIRD's tell + pass — are pure functions of (lane, tick): course.js#pulseAt.)
 */
```
- `run.x += lane.dir * lane.v;` — // (riding: carried with the log)
- `else if (d2 <= (u.r + FP) * (u.r + FP)) {` — // (the beam swept the cell beside them)
- `else if (k === run.bbK && cy >= p.band && cy < p.band + p.n) run.bbBand = -1;` — // (still on it as it passed: no moment)
- `splits: run.sp.slice(),` — // (J1 — SPLIT TIMES: [tick to 50, tick to 100, …] — only the ones reached)
- `y: run.y, x: run.x,` — // (where the kid is / went out — the end screen names what hit them: causes.js)
- `ufo: ids.some(id => !run.took[id]),` — // jaywalk-ufo: its beam swept beside them and THAT UFO never took them
- `airfield: run.best >= LOOP_LANES,` — // jaywalk-airfield: lane 400 in ONE run — solo OR match (H6A)
- `mothership: run.st === 'taken',` — // jaywalk-mothership (H6A): still in when THE MOTHERSHIP arrives (solo has none)
- before `export function inputProblem(log, i, t, d, mode = 'solo') {`:

```js
/**
 * THE HOP LOG's BOUNDS — ONE FUNCTION for the phone's recorder AND the judge (replay.js#logProblem): may entry `i` of `log` (tick `t`,
 * way `d`) stand? → null, or why not. (The go-live review: the recorder knew only the 2-tick gap — a tap in the Mothership's own tick,
 * or 21 taps in a second, wrote a log the judge refused WHOLE. An input the recorder does not log is not played either.)
 */
```

### js/games/jaywalk/ghosts.js

- `const copyRun = (to, r) => { Object.assign(to, r); to.near = { ...r.near }; to.took = { ...r.took };` — // (J1: the splits too — never one array for two runs)
- `if (at < cf.t) { G.ci++; continue; }` — // (never: the log's ticks rise)
- `const sure = G.done && G.ci >= lg.length;` — // (their whole log is here AND applied: what the rules say next is what happened)
- `Object.assign(G.keep, r); G.keep.sp = r.sp.slice();` — // (J1 — the review: its own splits)
- before `export function tagGroups(items) {`:

```js
/**
 * H5B's add-on — STACKED TAGS MERGE (the owner: never a pile of name tags): ghosts standing on the same / touching squares share ONE
 * tag — the leader's name + "+N" ("MIKIE +2"). PURE: items = [{ id, x (cells), y (lane), best, name }] (the ghosts whose tag may show)
 * → [{ lead (its id), text, ids }] — a group = everything joined by touching squares (a chain counts); its leader = the farthest
 * along (best, then the lane it stands on, then the id — the same on every phone).
 */
```

### js/games/jaywalk/index.js

- before `export const musicFor = () => [typeof document !== 'undefined' && document.body && document.body.dat`:

```js
/** H5B — THE MUSIC FOLLOWS THE LOOK (the existing mood stations): the day deck by day, the evening deck by night — `meta.MUSIC` stays
 *  the podium's + the fallback */
```
- `export const createView = lazyView(() => lazyImport(import('./view.js'), './view.js'), gameSheets('j` — // (THE FIX PASS — P1: three.js through the import map — Safari < 16.4 gets a clear card, never a blank match)
- `lazyImport(import('./variety.js'), './variety.js').then(M => M.warmVariety && M.warmVariety()).catch` — // (VARIETY B1 — the opening's area traffic)
- `lazyImport(import('./props.js'), './props.js').then(M => M.warmProps && M.warmProps()).catch(() => {` — // (VARIETY B2 — the opening's trees + edge pieces: the module + its files)

### js/games/jaywalk/lines.js

- `export const LINE_HEX = Object.freeze({ best: 0xffc53a, friend: 0xff4fd8 });` — // (H5B's add-on — the owner: the friend line is NEON PINK, never blue / cyan — a pale cyan band across a lane read as a strip of water)
- before `export const FADE_FAR = 4, FADE_NEAR = 1;`:

```js
/** JT2 — THE FRIEND LINE FADES as the kid comes: `ahead` = its lane − the kid's (a float while he hops) → 1 at ≥ FADE_FAR lanes ahead,
 *  0 at ≤ FADE_NEAR (smooth between) — it never sits over the lane he is about to cross; the crossing's burst draws on its own */
```
- before `export function parseTable(rows) {`:

```js
/**
 * the table's rows ([{ n, v, me? }] — api/_lib/friends.js#boardTable: you + your friends who have a best) →
 * { best: your own server-counted best (0 = none yet), friends: [{ n, v }] — the nearest first (lowest lanes first) }
 */
```
- before `export function nextFriend(friends, reached) {`:

```js
/** THE NEXT FRIEND: the lowest friend best the player has not passed yet — its line lies at the far edge of that lane, so a player
 *  standing ON the friend's lane (level with them) still has it right ahead; one lane more crosses it (null = none ahead — no line) */
```
- before `export function linesFor({ best = 0, friends = [], reached = 0, solo = true } = {}) {`:

```js
/**
 * what the scene draws right now → { best: { lane, text } | null, friend: { lane, text } | null }
 * `best` = your server-counted best (0 = none) · `friends` = parseTable's · `reached` = the farthest lane landed on this run ·
 * `solo` = a solo run (a match draws YOUR BEST alone)
 */
```

### js/games/jaywalk/logic.js

- `export const END_GRACE_MS = 4000;` — // (after THE MOTHERSHIP's tick: the last chunks land)
- before `export const DROP_WAIT_MS = CLOCK.drop;`:

```js
/** THE DROPPED SIGNAL in a match: a player whose proven log says OUT but whose own end never arrived is waited for this long (their
 *  phone may be offline with hops still queued) before the match ends without it */
```
- before `export const seedOf = (code, matchId, go) => 'g${hashString('${code}:${matchId}:${go}').toString(36)`:

```js
/**
 * THE COURSE IS PICKED AFTER GO (H3 — the owner, Nov 16): the seed = hash(room code + matchId + a SERVER time the rules enforce — a proof
 * node's `go`: === now, written once). Nobody knows the course before the run is on the clock: no one can shop for an easy one. PURE —
 * the phone and the server derive the same seed. SOLO: the player's own GO. A MATCH (H4): THE FIRST GO (below).
 */
```
- before `export { firstGo };   // (THE PROOF PASS: ONE copy — core/proof.js, HIGH RISE's too)`:

```js
/**
 * H4 — THE FIRST GO: the EARLIEST `go` among a match's proof nodes (0 = none yet). Every phone writes its own GO in the count's last 2 s;
 * the server stamps each on arrival, and a later arrival always carries a later time — so the first GO is FINAL the moment it lands, the
 * same on every phone and on the server, whoever the host is (in practice the host's phone is as likely as any — nobody chooses the
 * millisecond). The match's course = seedOf(code, matchId, that time); its tick 0 = that time + GO_LEAD_MS.
 */
```
- `export { firstGo };` — // (THE PROOF PASS: ONE copy — core/proof.js, HIGH RISE's too)
- before `export function startOf(game, runs, code) {`:

```js
/**
 * H4B — THE NODES ARE THE TRUTH: the course + tick 0 a phone PLAYS (and the host scores) = THE FIRST GO among the proof nodes it has
 * from the SERVER — exactly what the server's own count derives — whatever the game says; the game's own (the director's GO patch — or
 * an UNPROVEN match's stand-in) only when there is no node to read (the mirror not there yet, no GO anywhere). `runs` must hold
 * CONFIRMED values only: a phone writes its GO as a transaction that is never applied locally (view.js#askGoMatch), so its own estimate
 * of the server's time can never pick a course. null = not known yet (the count holds).
 */
```
- before `export const goBeforeGiveUp = (game, S) => !!(S && game && game.phaseStartAt && S.g0 <= game.phaseSt`:

```js
/** THE PROOF PASS — A HOST HICCUP AT GO (HIGH RISE's REVIEW FIX A, SHOULD 1 — js/games/highrise/match.js#goBeforeGiveUp, ported): the
 *  host's line stalled round GO, its mirror showed no GO for NO_GO_MS and it marked the match UNPROVEN — AFTER everyone had started; every
 *  phone restarted on a stand-in course and nothing counted. THE NODES ARE THE TRUTH here too: a FIRST GO the server stamped BEFORE the
 *  host gave up (the unproven step's own time) was there all along — the match is proven: its course + tick 0 are the GO's (the director
 *  takes the mark back: director.js#nextStep). A GO stamped after it never moves a match already running on its stand-in. */
```
- before `export const matchVersion = S => versionAt(S && S.g0 > 0 ? S.g0 : S ? S.playAt - GO_LEAD_MS : 0);`:

```js
/** J2 — COURSE RULES v2 (versions.js): the version a MATCH is played on = the one in force at THE FIRST GO (`g0`; a stand-in course with no
 *  GO: its tick 0 − the lead) — the phones, the host's podium and the server read this */
```
- before `export const nodeVersion = (node, E) => runVersion(node && node.cv != null ? node.cv : null, E, goOf`:

```js
/** the version ONE run replays on, from its proof node: its own `cv` checked against the version in force at its GO (a solo run: its own
 *  GO · a match: THE FIRST GO) — 1 | 2, or 0 = refused (versions.js#runVersion) */
```
- before `export function scoreNode({ seed, mode, node, t0, from = null, until = null, out = null, cv = 1 }) {`:

```js
/**
 * ONE proof node ({ go, c: { i: { s, at } }, e?, k? }) → its result row — THE JUDGE's (replay.js#judgeRun: the bounds, THE SPEED CHECK +
 * THE DROPPED SIGNAL, the replay). { l: lanes, t: the tick they got there, w: the cause, e: the tick it ended (−1 = not yet), y · px:
 * where the kid went out (the end screen names what hit them), x: taken (1), cut (1 — a slowed log: counted to its last on-time hop),
 * bad (why — a refused log: the run of a kid who never hopped) }. `t0` = tick 0 (a server time), `from` = the earliest a chunk may arrive,
 * `until` = score it as it stands at that tick. The host's podium and the server's count both come through here.
 */
```
- `if (out) out.hops = bad ? 0 : j.hops;` — // (THE PROOF PASS: the hops THE JUDGE counted — "a GO alone is not a player", api/_lib/jaywalk.js#jwPlayed)
- before `export function scoreRun(game, node, now = null, code = '') {`:

```js
/**
 * ONE player's result from their own node, to the server time `now` (a run still going is scored as it stands). No node / a refused log
 * → the run of a kid who never hopped (the wall takes them); a solo run with no GO, a match with no course yet → nothing.
 */
```
- before `export function scoreCalls(game, runs, results) {`:

```js
/**
 * H4 — CALL THE WINNER (the match kit's piece; the call = the caller's own proof node's `k: { w, at }` — the rules: only once they are
 * out, a player still in, once, the server's time). At the end: a call counts when the caller was OUT (never taken), named a player who
 * was still in at that moment, and made it within CALL_WINDOW_MS of their own end; right = that player won (alone or tied for first).
 * → { uid: { w, ok, bonus } } — the bonus = core/playlist.js#callBonus(the players still in when they went out), game-night points.
 */
```

### js/games/jaywalk/models.js

- `export const MODEL_REV = 2;` — // (bump when a model file is replaced)
- before `export const LANDMARK_MODELS = Object.freeze(['lighthouse', 'fishing-boat']);`:

```js
/** what the night look draws today (H2B — the owner: no junk-looking props): the crate is out (THE DOCKS' crates are built in code — H5A)
 *  and so is the jersey barrier (from above it read as a pale cube — the barrier is now THE BARRICADE, built in code);
 *  H5A — THE AREAS' two models: the lighthouse (MaverickFX, CC0) + the fishing boat (Kenney's Watercraft Kit, CC0) */
```
- before `export function parseGlb(buf) {`:

```js
/** one of OUR re-packed GLBs (one node, one mesh, one primitive: POSITION · NORMAL · COLOR_0 · indices) → a BufferGeometry in the node's scale.
 *  B2: read through typed-array VIEWS (aligned — our writer's layout) — a model parses in ~1 ms where the DataView reads took 8–17 ms at 6× CPU */
```
- `const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = COMP[a.componentType], n = WID` — // (an unaligned file: the slow path)
- before `export const KID = Object.freeze({ h: 0.78 });`:

```js
/**
 * THE KID (H5A — the owner, Nov 16): Kenney's "Mini Skate" skate boy (CC0) — assets/jaywalk/models/kid.glb, re-packed by
 * scripts/build-jaywalk-assets.py: ONE mesh, the colormap in vertex colours, the PAINT = his T-shirt + THE CAP (they take the player's
 * colour; the face, the arms, the jeans + the white sneakers stay Kenney's), each vertex's ONE bone (`bone`) and THE POSES (the skin
 * matrices of idle · jump · fall + the SPLAY, a row a frame). He faces −z (up the course), 0.78 tall, his cap built into his head.
 * → the geometry (+ `userData.poses` = { tex (a float texture: 3 texels a bone across, a row a frame), clips: { name: [first row,
 * frames] } }), or null (the file never came: the scene draws his glow ring + shadow alone, never throws). Tried three times.
 */
```
- before `export const LOG = Object.freeze({ r: 0.36, top: 0.36 });`:

```js
/**
 * A LOG (H3 — the owner, Nov 16: all the SAME THICKNESS, each its OWN LENGTH; nothing on a log that could read as a pickup), `len` cells
 * long along x (1 · 2 · 3 · 4 — one geometry a length: nothing is stretched), built in code in the smooth toy style:
 *   · a ROUND trunk of ONE radius (LOG.r — a true circle across: it must read as thick + round), HALF-SUNK: the scene floats its centre
 *     at the waterline, so only the round back shows — LIT ON TOP, DARK DOWN THE SIDES (the shade by the angle round it)
 *   · BARK GRAIN ALONG THE LENGTH: each strip round the trunk is one tone from end to end (a ridge or a dark furrow) → crisp lines
 *   · PALE RINGED ENDS as round discs — sawn on a slant (the top a little shorter), so the cut faces are SEEN from the camera above
 * NO moss, NO branch stub, NO dot (H2B's stub ended in a pale sawn face — two small concentric circles on the log's shoulder: from the
 * camera it read as a dot, a pickup; JAYWALK has none). Its top sits LOG.top above its centre.
 */
```
- `const BARK = 0x9a6238, GRAIN = [1, 1, 0.7, 1, 0.94, 1, 0.66, 1, 1, 0.92, 0.7, 1, 1, 0.68, 1, 0.94, 1` — // (a strip round the trunk: a ridge, or a dark furrow — the same from end to end)
- `const lit = a => 0.3 + 0.86 * Math.pow(Math.max(0, Math.cos(a - 1.3)), 2.2);` — // (brightest on the shoulder the camera + the key light see, falling away to BOTH limbs: it reads as ROUND)
- `const RINGS = [[0, 0.1, 0xdcc394], [0.1, 0.34, 0xe9d3a6], [0.34, 0.39, 0xdcc394], [0.39, 0.62, 0xe9d` — // (H4 — the owner: PLAIN PALE WOOD, the rings only a shade darker + thin — the banded ends read as a shell)
- `const end = (q, a, hex) => put(side * (L / 2 - SL * q * R * Math.sin(a)), q * R * Math.sin(a), q * R` — // (H4: the cut faces look UP at the key light — plain pale wood on both ends, never the pink rim light's sheen)
- before `export const TRUCK = Object.freeze({ len: 2.9, box: [-1.36, 0.5], top: 1.12 });`:

```js
/**
 * THE BOX TRUCK (the 3-cell vehicle — H2B, the owner: "a real box truck"), built in code in the smooth style: a rounded CAB in the truck's
 * colour (paint) with dark glass, a long rounded white cargo BOX with a stripe in the truck's colour, a dark chassis, six wheels, a bumper.
 * 2.9 long along z (its nose at +z, like Kenney's cars), 0.8 wide, ≈ 1.12 tall. Its lights (head, tail, the amber markers along the box's
 * side) are the scene's light quads. TRUCK.box = where the box's side runs (z), for the markers.
 */
```
- before `export function buildBarricade() {`:

```js
/** THE BARRICADE (H2B): a road barricade that reads at phone size — two striped boards (orange / white) on two dark A-frame legs, a lamp
 *  on one end (its amber glow is the scene's light quad). 0.9 wide along x, ≈ 0.66 tall; the boards face the camera (z). */
```

### js/games/jaywalk/moments-view.js

- before `export function createMomentsView(root, o) {`:

```js
/**
 * root = the game's stage · o = { sound(id), nameOf(uid), colorOf(uid) → css colour } → { pump(s), frame(now, ghostAt), reset(), info() }
 * pump({ ids, me, ends, mine, lanes, quiet }) — the match's state, ~10× a second (quiet = this phone's own OUT card is up: no banner over it)
 * frame(now, ghostAt, kidAt) — every frame: the red X's follow their fallen ghost (ghostAt(uid) → [x, y, cellPx] on the stage | null); kidAt()
 *   → the kid on screen [x, y, cellPx] | null (a gravestone in the lane in front of it fades)
 */
```
- `const xs = [], pendingX = new Map();` — // (uid → the moment its out was seen: its ghost's fall is drawn once the ghost is over — ≤ 3 s)
- `if (!merge) { bannerAt = now; count.banners++; o.sound('out-drop'); }` — // (the out sound ONCE a banner)
- `if (!p) { X.el.style.visibility = 'hidden'; continue; }` — // (visibility — the X's own animation owns its opacity)

### js/games/jaywalk/moments.js

- `export const OUT_MERGE_MS = 1000;` — // (outs closer than this share ONE banner — "MIA + LIAM OUT")
- `export const BANNER_MS = 1500;` — // (the OUT banner: in · hold · out)
- `export const X_MS = 1500;` — // (the red X where a ghost fell: bright this long, then it SETTLES into its gravestone — never removed before the match ends)
- `export const H2H_STRIP_MS = 3000;` — // (HEAD TO HEAD: the big text holds to here, then shrinks into the duel strip)
- `export const H2H_MS = 5000;` — // (… gone by here: the strip stays for the rest of the duel)
- before `export const GRAVE_NEAR = 0.5, GRAVE_AHEAD = 1.5;`:

```js
/** THE GRAVESTONES — LIGHT near the kid (PURE; JT2's add-on — the owner, Nov 22: "they read as faded"): a mark at p = [x, y, cell] (stage px)
 *  dims (to ~50 %, never lower — css .is-ahead) ONLY while it sits on THE LANE THE KID IS ABOUT TO HOP INTO — the band GRAVE_NEAR lanes in front
 *  of his middle to GRAVE_AHEAD (forward = up the screen), the whole width; on his own lane, behind him (passed) or further up: full. kid = [x, y, cell] | null */
```
- `const endOf = e => (e && typeof e === 'object' ? { out: e.w !== 'taken' && e.w !== 'quiet', l: Math.` — // ('quiet' — view.js: a run the host's own rule calls over with no `e`: it leaves the count, no moment)
- before `export function stepMoments(M, { ids, me, ends = {}, mine = null, lanes = {} }) {`:

```js
/**
 * ONE STEP (PURE): `ids` = the match's players · `me` = this phone (a watcher: not among ids) · `ends` = { uid: their node's `e` | null } ·
 * `mine` = this phone's own end ({ w, l } from its engine — null while it runs) · `lanes` = { uid: lanes now } (the lead's words) →
 * { events: [{ k: 'out', uid, l, left } | { k: 'h2h', a, b } | { k: 'last', lead }], alive: [uids still in], duel: [a, b] | null }
 */
```
- `if (!M.base) {` — // (the first look — a fresh match, or a refresh / rejoin mid-match: what has happened is the baseline, nothing replayed)
- `if (!e.out) continue;` — // (THE MOTHERSHIP's finish is no out)

### js/games/jaywalk/night-fx.js

- `export const DAY_FOG_HEX = 0xc6e6f7;` — // (H5C — THE FAR EDGE: the day picture's own haze where its sea meets the sky (#87cef4 → #b8e8fb): the far lanes fade into the same air)
- `const WHITE1 = (() => { const t = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, ` — // (no sun pass: depth 1 everywhere)
- `uWet: { value: 0 },` — // (J4 — the season + THE LIGHTS: one shared list, the snow reads it too)
- `uShTex: { value: WHITE1 }, uShM: { value: new THREE.Matrix4() }, uShK: { value: 0 }, uShTx: { value:` — // (J4 — the season + THE LIGHTS: one shared list, the snow reads it too)
- `lay(k, i, t, dn, up, seed, dark, fx, ar = 0) { lane[k] = i; kind[k * 4] = t; kind[k * 4 + 1] = dn; k` — // (ar — H5A: the lane's AREA, 0 = the opening · 1 … 8)
- before `/** VARIETY B2 — WHITE VEHICLES BY DAY: 0 at night (the night's cars untouched — every use below is `:

```js
/** THE PAINT PATCH on a lit material: vertices marked `paint` take the tint (an instance's colour, or uTint) by their own brightness; the
 *  rest keep their vertex colours; `lit` (0 … 1 — the blackout, the dim edge columns) scales both. */
```
- `const ROLL_V = 'float jwMn = min(vColor.r, min(vColor.g, vColor.b)); vColor *= 1.0 - 0.2 * uRoll * s` — // (a near-white body → a soft off-white by day)
- before `const ROLL_F = 'if (uRoll > 0.0) { float jwPk = max(outgoingLight.r, max(outgoingLight.g, outgoingLi`:

```js
/** the day's HIGHLIGHT ROLL-OFF: past the knee a lit colour is eased toward 1 (its hue kept — every channel by one factor), never clipped flat:
 *  a white bus keeps its panels + windows; the darker parts (glass, trim, lines) are below the knee — untouched */
```
- before `export function dayEnv(renderer) {`:

```js
/** H5B — THE DAY LOOK's environment (the gloss on the cars + the kid by day): a clear blue sky, a bright horizon, the sun high on
 *  one side, warm ground light from below */
```
- `const v = y / (H - 1), up = Math.max(0, 1 - v * 2), dn = Math.max(0, v * 2 - 1);` — // (v 0 = straight up · 0.5 = the horizon · 1 = down)
- before `export const OCC_LAYER = 2;`:

```js
/** J1 — THE NIGHT GLOW FIX: the SOLID scene's layer (night.js#kind marks every opaque kind but the tufts: vehicles, trains, trees, posts,
 *  barricades, logs, the areas' props, shops, the kid). The bloom draws it first as FLAT BLACK depth (OCC_MAT), then the lights (layer 1)
 *  depth-tested against it — a light behind a box truck / a car / a train / a tree makes no glow on top of it. */
```
- before `export const OCC_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false, side: THREE.Double`:

```js
/** ONE shared override material (warmed with the rest — night.js#warm renders the bloom once: no new program mid-run). Black, no fog (a fogged
 *  far occluder would tint the bloom target), both faces (a mirrored instance never leaves a hole), pushed back a hair (a lamp ON a body's
 *  face stays lit — the main picture shows it) */
```

### js/games/jaywalk/night.js

- `import { VARIETY, createVariety, setWinterTraffic } from './variety.js';` — // (VARIETY B1 — THE AREA TRAFFIC: which model draws a slot, loaded per area ahead of it)
- `import { GRADE, gradeOf, lightsOf } from './daylook.js';` — // (VARIETY A — THE TIMES OF DAY: the grade + the lights by time — PURE)   // (THE ONE SOURCE OF TRUTH for which vehicle a car IS — the end screen's cause line reads the same function)
- `const BACK = 9, AHEAD = 27, POOL = BACK + AHEAD;` — // (the most lanes alive: 36 — a closer zoom lays fewer ahead)
- `const NEON = [0xff3fb4, 0x22e0ff, 0xa05bff, 0xff5a7a, 0x4d7dff, 0xf1eee8, 0xff8a3d, 0x2fd6a0, 0xc9a7` — // (a car's body tint: pink · cyan · violet · coral · blue — VARIETY B1 + pearl · tangerine · jade · lilac · garnet · steel)
- `const TAXI_HEX = 0xf6b100;` — // (H4 — THE TAXI: cab yellow, never a neon tint · VARIETY B1: a deeper taxi yellow — never read as a small yellow car)
- `const HEAD_REACH = 1.35, TAIL_LEN = 1.2;` — // (TAIL_LEN — H5C: the tail pool, from under the bumper to where it has faded out)
- `const LOG_FEET = 0.33;` — // (H3 — where the kid's feet stand on a log: its round back, the log HALF-SUNK — its centre a hair under the waterline)
- `const KID_S = 1.62;` — // (THE KID's size on the lane — H5A, Kenney's skate boy, 0.78 tall: ≈ 1.26 of a lane tall — he must read at real phone size; the rules' box stays 0.6 of a cell)
- `const KID_YAW = Math.PI;` — // (Kenney's kid faces +z, as his cars do; the scene's "up the course" is −z)
- before `const FOG_LAYERS = Object.freeze([`:

```js
/** THE FOG BANK's layers (back → front): [lanes behind the bank's edge, height, a puff's width + height, alpha, drift (cells / s),
 *  its sunlit top, its cool underside, the spacing] */
```
- before `const NO_SEASON = Object.freeze({ day: '', winter: 0, christmas: 0, snowfall: 'none', wet: 0, autumn`:

```js
/** J4 — WINTER · JT1 — SEASONS (docs/jaywalk.md "JT1 — SEASONS"): a VIEW — every seasonal layer is THE SEASONAL PACK's (seasonal.js, fetched
 *  only on a season day — season-gate.js — or the lab's forced date; never the start bundle). The scene calls it at fixed points of a frame. */
```
- `const fogV = new THREE.Vector2(26, 35);` — // (the shaders' copy of the fog's near / far)
- `const rig = createCamera({ zoom: o.zoom, angle: o.angle, hero: o.hero });` — // (hero: THE POSTER's low camera — camera.js; the game never passes it)
- `const heroCam = !!o.hero;` — // THE CAMERA (camera.js): the zoom, the sideways follow, the turn
- `if (solid) m.layers.enable(OCC_LAYER);` — // (J1 — THE NIGHT GLOW FIX: a solid thing hides the lights behind it from the bloom — night-fx.js#createBloom)
- `if (cast) m.layers.enable(SUN_LAYER);` — // (VARIETY A — it casts THE SUN's SHADOW on tier 2: the depth pass draws only this layer)
- `let SP = null;` — // (THE SEASONAL PACK, once it is in — prepSeason)
- `flat: kind(flatGeo, glowMaterial(fogV), 720, { aux: ['aFx', 2], raw: true, order: 2, bloom: true }),` — // pools · trails · beams · rings · edge lines
- `bill: kind(billGeo, glowMaterial(fogV, { bill: true }), 900, { aux: ['aFx', 2], raw: true, order: 3,` — // lamps · light quads · sparks
- `tufts: kind(GEO.tuft, lambert(), 220, { solid: false, cast: false }),` — // (J1: a grass tuft never hides a light pool)
- `let TD = null, GR = null, TL = lightsOf('night', -20), sunReal = false, fogDark = 0, sunF = -1;` — // (sunF — VARIETY B1: THE SUN's SHADOWS' strength 0 … 1, FADED over 1 s on any tier change — never a snap)
- `const a = a1 == null ? 1 : a1, L = VA && GR ? GR.len : 1, sunK = (1 - ease(sunF < 0 ? 0 : sunF)) * (` — // (B1: the cheap blob fades in as the depth pass's shadow fades out — and back)
- `const off = Math.min(SUN.len * L * (sy === 1 ? 0.55 : sy), (0.4 * Math.min(sx, sz) + 0.14) * L);` — // (never further than the shadow is wide: it stays joined to the thing)
- `const KM = {}, BOX = {}, carMats = [];` — // (carMats — VARIETY A: the cars' paint shines in the sun by day)
- `needWarm = true;` — // (H4B — the new kinds' programs + buffers are made in the NEXT frame, not when a car first drives in)
- `KM['v-${id}'] = kind(g, vMat, 24, { aux: ['aLit', 1] }); g.dispose();` — // (kind() keeps its own clone)
- `K.taxiSign.mesh.layers.enable(1);` — // (at night it blooms: a lit sign)
- before `function setSeason(day, o = {}) {`:

```js
  /** the season for the run starting now: its DAY · { wet (WET NEON STREETS — the lab's; WET_LIVE in the game), snow (the lab's forced fall),
   *  clock (the lab's local minutes), now (the phone's clock: the New Year's finale) } → what it applied (the normal look if the pack is not in) */
```
- `SZ = SP ? SP.apply(want ? day : '', o) : { ...NO_SEASON, day: day || '' };` — // (a scene kept over PLAY AGAIN on another day: the pack takes its season back off)
- `{ const wt = SZ.winter > 0; if (wt !== winterT) { winterT = wt; setWinterTraffic(wt); vwKey = -1; } ` — // (B2 — THE WINTER TRUCKS: a winter run's van slots — variety.js)
- `const FR = {}, seaLand = { on: false, L: null, x: 0, y: 0 };` — // (JT1 — the numbers a frame hands THE SEASONAL PACK · this frame's landing — no garbage)
- `const labelGeo = new THREE.PlaneGeometry(7.0, 0.875).rotateX(-Math.PI / 2);` — // (BIG: the letters ≈ half a lane tall; 7 cells — H5C: the words are CENTRED on the screen (they ride the camera's column): never cut by its edge)
- `const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest:` — // (the dark halo: they read on bright water · JT2: the FRIEND's words lie UNDER the traffic — YOUR BEST's still read over a van)
- `const gateShow = v => {` — // (BEFORE THE FLIP: marked drawn only once drawn; a refused / wiped / blank board drawn again; a small pop-in)
- `if (day) {` — // (BY DAY: a PAINTED sign — the area's colour, a white trim, the name in white paint with a dark edge. BEFORE THE FLIP: the
- `} else {` — // (BY NIGHT: a neon sign — a smoked see-through panel, a tube round the arch in the area's colour, its white-hot core)
- `board(8); c.fillStyle = 'rgba(9, 6, 24, 0.9)'; c.fill();` — // (a SOLID dark board, as the day's is solid: the letters are never cluttered by what is behind)
- `if (day) {` — // (BY DAY: the line's colour as paint)
- `} else {` — // (BY NIGHT: neon — the colour, its glow, a white-hot core)
- `const LINES = { best: null, friend: null }, crossed = [];` — // (crossed: a line's burst — { k, lane, t0 })
- `const skyUnder = document.createElement('div'), skyOver = document.createElement('div');` — // (UNDER is always solid; only OVER's opacity ever moves)
- `const skyS = { now: '', over: false, want: '', fades: 0, until: 0, ms: 0 };` — // (over: the picture on screen sits on the OVER layer · until: its cross-fade's end)
- `if (wait > 0) { setTimeout(go, wait + 30); return; }` — // (a visible layer's picture never changes: wait the running fade out)
- `for (const f of [...skyHold.keys()]) if (!keep.includes(f) && f !== skyS.now) skyHold.delete(f);` — // (ONLY the current + the next are held — + the one still on screen through a look's cross-fade)
- `skyBiasT = plan.bias; skyMax = plan.max; skyMin = plan.min;` — // (the go-live review: the count stays clear of the landmark · a match's left landmarks stay clear of the chips)
- `const g = day && VA ? GR || GRADE.noon : null, U = ground.uniforms;` — // (VARIETY A — the time of day's grade: daylook.js#GRADE)
- `hemi.color.setHex(g ? g.hemi[0] : day ? 0xd6e9ff : 0x8fa0ff); hemi.groundColor.setHex(g ? g.hemi[1] ` — // (H5C: a soft SKY fill — cooler from above, warm bounce from the ground)
- `key.position.set(-5, g ? Math.max(2.5, 12 * Math.sin(g.key[2] * Math.PI / 180) / 0.79) : 12, 9);` — // (a low sun lights the things from lower down: sunrise, golden, sunset)
- `DAY_ROLL.value = day ? 1 : 0;` — // (B2 — WHITE VEHICLES BY DAY: the off-white + the highlight roll-off — night-fx.js#paintMaterial `roll`)
- `for (const m of carMats) { m.roughness = g ? g.gloss : 0.28; m.envMapIntensity = g ? g.shine : 1.1; ` — // (VARIETY A — the paint shines in the sun by day; the night's cars untouched)
- `K.shadow.mesh.material.uniforms.uDay.value = day ? 1 : 0;` — // (H5C — a day shadow is COOL: the sky fills it)
- `{ const st = host.closest ? host.closest('.jw-stage') : null; if (st) { if (k > 0.5) st.dataset.fog ` — // (the screen's foot fades into the same dark fog — css/jaywalk.css)
- `let bloom = null, tier = 2, w = 0, h = 0, dpr = devDpr, kAt = 0, reveal = 1, revealT = 1;` — // (reveal — H3: 0 = only the start's few lanes out of the dark · 1 = the whole view)
- `const FOOT_AT = 0.25, HAZE_LANES = 4.4, HAZE_DAY = 2.2;` — // (VARIETY B1 — MORE CLEAR VIEW UP TOP: the DAY looks' haze starts later — still fully hazed at the sea wall's foot, a soft edge; night unchanged)
- `let fitAsk = 0;` — // (BEFORE THE FLIP — a resize only ASKS; draw() resizes FIRST, then renders: a resize after the frame was drawn showed the stage's pale day sky for a frame — the owner's "white flashes". 0 · 1 = a size check · 2 = forced)
- `cam.fov = rig.fit(w / h);` — // (ZOOM columns across on every screen shape — camera.js#lensFor)
- `fitNow(true); fitAsk = 0;` — // (the new canvas: sized at once — nothing drawn on it yet)
- `let vwKey = -1;` — // (VARIETY B1 — the areas near the camera: asked again only when they change)
- `const docks = !!L.mark || (i > 40 && (i % 50 <= 3 || i % 50 >= 47));` — // (by a landmark: the docks' clutter)
- `if (PR) PR.dress(d, i, L, area(i).index, (a, b) => hsh(vseed ^ (i * (733 + b * 59)), a));` — // (B2 — which tree model a tree cell draws + the edge decoration: props.js#dress)
- before `function warm() {`:

```js
  /** THE START: a phone builds a program + uploads a mesh at its FIRST DRAW WITH SOMETHING IN IT — so each kind gets ONE instance
   *  far under the ground + ONE hidden frame is rendered (the bloom too), then all is put back: at the top of the first frame + of
   *  the one after Kenney's models land. */
```
- `const seaBack = SP ? SP.warmIn() : null;` — // (J4 — the falling snow's program too: THE SEASONAL PACK's)
- `for (const m of [...(FL ? FL.meshes() : []), ...Object.values(LBL).map(L => L.m), fish]) { put.push(` — // (J2: the jets are ONE instanced mesh — warmed with one in it)
- before `/**`:

```js
  /** one frame: the run after its last tick, `a` (0 … 1) into the next one, `dt` ms since the last frame. `o.ghosts` (a match):
   *  [{ run, hex, out? }] — each gets `tag` = [x, y] on the screen (CSS px) or null. `o.t` = THE WORLD's TICK: all is drawn at it.
   *  `o.a` = the ghosts' fraction; `g.vis` / `o.off` = a late hop's CATCH-UP ({ x, y, u: 0 … 1, d }); `g.held` = unconfirmed. */
```
- before `const EMBER = 14, burnHash = (i, k) => { const x = (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453)`:

```js
  /**
   * J2 — THE AFTERBURNER TRAIL (a v2 runway lane — course.js#laneHit: everything behind its jet burns through the pass, then the WHOLE lane
   * for `p.trail` ticks): BLUE-PINK PLASMA in both looks (the owner, Nov 21: amber fire sank into the amber runway lights) — a glowing
   * streak on the road (a white-violet core in a hot PINK glow · by day a dark scorched band under pink paint: BLUE ON THE GROUND = WATER,
   * so the blue stays OFF the ground) + a row of standing plasma tongues (an electric-blue body, a white-hot heart, a pink tip), cooling as
   * it ages but bright to the last deadly tick; then out fast (EMBER ticks of dim violet embers — never read as live). Instanced kinds only
   * (no draw call of its own). `u` = ticks into the lap.
   */
```
- `const EMBER = 14, burnHash = (i, k) => { const x = (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453)` — // (0 … 1: the tongues stay inside their own lane)
- `K.flat.put(cx, 0.045, z, w, 1, 1.0, 0, 0xff2aa8, 1, 4, 0.62 * heat * fl * lt);` — // the glow round it (inside its own lane: never read as the next one burning)
- `K.flat.put(cx, 0.05, z, w, 1, 0.3, 0, live ? 0xa86cff : 0x5a1a6e, 1, 4, 0.6 * heat * lt);` — // the hot core (violet, never white: additive light over the pink would blow out)
- `K.bill.put(x, fh * 0.66, zz - 0.01, fw * 0.75, fh * 1.05, 1, 0, 0xff2ab8, 1, 9, 0.5 * A);` — // its pink tip (the tongue's top, licking up past the blue)
- `K.bill.put(x, fh * 0.45, zz, fw, fh, 1, 0, 0x1e50ff, 1, 9, A);` — // the plasma tongue (narrow at its top)
- `K.bill.put(x, fh * 0.28, zz + 0.02, fw * 0.36, fh * 0.5, 1, 0, 0x7cc8ff, 1, 9, 0.55 * A);` — // its hot heart (cyan — additive: white would wash the blue out)
- before `function runwayLamps(p, st, tellF, head, z, lt) {`:

```js
  /**
   * J2 FIX — THE RUNWAY LAMPS, CRISP (the owner, Nov 21: the big glowing lamp balls looked cheap): every lamp a SMALL FIXTURE — a dark housing
   * set in the tarmac (by day: night's additive light has no dark) + a sharp bright PIP (shape 11 — a hard edge at 3×, no halo). Off the
   * tell: a dim lens. In the tell + the pass: a RUNNING SEQUENCE across the lane toward the crossing (every 3rd lamp lit, stepping every 7
   * ticks off the rules' own clock — steady, all lit, with reduce motion), the amber row + the red row, the racing head brightest. The
   * chevron arrows (the ground's shader) are untouched. By day always; by night on the lab's `&rwnight=new` only (a soft glow under a lit
   * pip there — the dark road needs it). Instanced kinds only.
   */
```
- `if (day) K.flat.put(x, 0.046, z + e, 0.32, 1, 0.2, 0, 0x30343c, 1, 12, 0.85 * far);` — // the housing (a small crisp box set in the tarmac)
- `if (!day) K.flat.put(x, 0.04, z + e, 0.9, 1, 0.7, 0, hex, 1, 0, 0.42 * far);` — // (night compare: a small glow on the road)
- before `function heatTrail(p, u, z, x0, x1, cx, w, A, age, live, heat) {`:

```js
  /**
   * J2 FIX — THE TRAIL BY DAY = HEAT, NOT NEON (the owner, Nov 21): a SCORCHED dark streak on the asphalt + a thin WHITE-HOT centre line
   * (a warm edge round it) + see-through, soft-edged BLUE-WHITE flame tongues standing up (shape 13: no solid cones, they flicker, their
   * tips fade to nothing — BLUE ONLY STANDS UP: blue on the ground = water) + a faint HEAT SHIMMER (a translucent wavy band over it) +
   * SMOKE WISPS rising as the 0.7 s ends. By night (the lab's `&rwnight=new` only): the same, tuned for additive light — the violet core on
   * the road, electric-blue tongues with a CYAN heart (white would wash the blue out). Instanced kinds only (no draw call of its own).
   */
```
- `if (day) { K.flat.put(cx, 0.049, z, w, 1, 1.9, 0, 0x2a2420, 1, 4, 0.82 * sc); K.flat.put(cx, 0.0495,` — // the SCORCHED streak + its charred core (soot, never blue)
- `K.flat.put(cx, 0.053, z, w, 1, day ? 0.5 : 0.36, 0, day ? 0xff6a10 : 0xa86cff, 1, 4, (day ? 0.8 : 0.` — // the line's hot edge (violet by night)
- `K.bill.put(x, hh * 0.32, zz + 0.02, fw * 0.48, hh * 0.62, 1, 0, day ? 0xffffff : 0x7cd8ff, 1, 13, (d` — // its hot heart (cyan by night)
- before `/** B2 — THE WINTER TRUCKS' SPRAY (one shared particle — the glow billboards: no draw of their own, `:

```js
  /** VARIETY B1 — a variety vehicle in its slot: EXACTLY the slot's length (the rule's — never shorter or longer than what hits you), its own
   *  width + height; the plain cars' lights; an emergency vehicle's light bar FLASHES red / blue at night (bloom), unlit by day */
```
- before `function spray(kind, nose, rear, dir, z, dim, ph) {`:

```js
  /** B2 — THE WINTER TRUCKS' SPRAY (one shared particle — the glow billboards: no draw of their own, no state, no garbage): the plow's snow
   *  kicked off its blade toward the curb; the salt fanned out behind the spinner. Small, see-through, short-lived — never hiding a car */
```
- `if (V.spray && !reduce) spray(V.spray, nose, nose - L.dir * bodyL, L.dir, z, dim, hsh(vseed ^ (i * 9` — // (B2 — THE WINTER TRUCKS' spray)
- `if (V.light === 'beacon') {` — // B2 — THE WINTER TRUCKS' AMBER BEACON: a rotating flash (~1.4 a second) + its glow + its colour on the road — at night only (steady with reduce motion)
- `if (V.light && (!day || TL.cars > 0.6)) {` — // THE LIGHT BAR: red on one side, blue on the other — alternating ~2.6 times a second (steady with reduce motion)
- `if (on1 && !reduce) LF(bxl, 0.045, z + dz * 3, 1.6, 1, 1.3, 0, hex, 1, 0, 0.16 * a1);` — // (its colour on the road round it)
- `let vLF = NOP, vLB = NOP;` — // (this frame's light puts — draw() sets them)
- `const n = 7, sq = bodyL * 0.7 / n, x0 = bx - sq * (n - 1) / 2;` — // (a band that reads from above at 390: it stands a little proud of the body's shoulder)
- `if (fitAsk) { const f = fitAsk === 2; fitAsk = 0; fitNow(f); }` — // (a resize asked since the last frame: done HERE, before this frame renders)
- `const fT0 = performance.now();` — // (B2 — THE TAPS: the loaders step only in a light frame — their pump at the end)
- `const LF = !day ? K.flat.put : TL.beams > 0.01 ? lfDay : NOP, LB = !day ? K.bill.put : TL.cars > 0.0` — // (VARIETY A — by day what glows follows the time: daylook.js#lightsOf)
- `if (SP) fogCheck();` — // (THE FOG CHECK: the winter models land after the start — the fog follows the snow that shows)
- `if (SP && (run.t === 0 || run.st === 'out' || run.st === 'taken')) SP.quiet();` — // (J4 — the pack's kinds + shaders brought in at a quiet frame, never mid-run)
- `if (SP) { seaLand.L = at; seaLand.x = lx; seaLand.y = ly; seaLand.on = true; }` — // (JT1 — the prints, the puff, a leaf pile: told to the pack below, with the frame's numbers)
- `if (run.st === 'hop') { sy = 1 + 0.2 * Math.sin(Math.PI * f) - 0.17 * Math.exp(-f * 13); tilt = 0.3 ` — // (he leans INTO the hop — Kenney's kid faces +z: the lean's sign follows)
- `flat = { thin: 1 - 0.86 * sq + bounce, wide: 1 + 0.5 * sq - bounce * 0.6 };` — // (a PANCAKE: half as wide again, a seventh as thick)
- `fx.yaw += (0 - fx.yaw) * sq; ry = fx.yaw; s3 = [flat.wide, flat.thin, flat.wide];` — // (his head up the screen: the sneakers kick out toward the camera)
- `} else if (H.cause === 'water' || H.cause === 'edge') {` — // (the edge: carried off on the log a moment more, then the splash) + the sink
- `} else if (H.cause === 'train' || H.cause === 'blackbird') {` — // knocked away, spinning — THE BLACKBIRD's SHOCKWAVE blasts him higher, tumbling, toward the lens
- `} else {` — // THE UFO's ABDUCTION (H6A — flyers.js): frozen mid-step, then up the beam, spinning + shrinking
- `} else if (run.st === 'taken') {` — // THE MOTHERSHIP (H6A — a finish line): he rises into it, glowing in his colour
- `const SE = SP && SZ.any ? SP : null;` — // (THE SEASONAL PACK this frame — none: nothing seasonal is drawn)
- `lWant = !!SE && !day && ((wetOn && tier === 2) || SZ.snowfall !== 'none');` — // (J4 — THE LIGHTS this frame)
- `if (FL) { const q = FL.shake(); shx += Math.sin(clock * 0.11) * q; shy += Math.cos(clock * 0.13) * q` — // (THE BLACKBIRD's pass: ≤ 4 px, ≤ 200 ms)
- `posed = true; fwd.set(0, 0, -1).applyQuaternion(cam.quaternion); FOG_UP.value = -fwd.y; depth();` — // (the fog follows the lens: full at the sea wall's foot)
- `{ const c0 = Math.floor(camY), a0 = areaIndex(c0 - 12), a1 = areaIndex(c0 + 20), a2 = areaIndex(c0 +` — // (VARIETY B1 — the areas near: their models in ahead, the passed ones freed)
- `if (q.edge && (q.c < 0 ? sgL : sgR)) continue;` — // (a signature piece stands on this side of the lane)
- `if (q.deco === 2) { if (PR) PR.deco(q, x, zz, dim, lt); continue; }` — // (B2 — an edge piece: props.js)
- `if (!SE || !SE.tree(x, zz, s, q, i, dim, on, lt, q.tk || '')) { if (!q.tk || !PR || !PR.tree(q.tk, x` — // (B2 — the area's tree model: props.js; not in yet = today's round tree)   // (J4 — winter swaps it: a snow pine · a lit Christmas tree — seasonal.js)
- `if (!SE || !SE.planter(x, zz, q, i, dim)) { const s = PROP_S[q.k]; KM[q.k].put(x, 0, zz, s, s, s, Ma` — // (J4 — some planters → SNOWMEN: seasonal.js)
- `if (D.lamp && !(D.lamp < 0 ? sgL : sgR)) {` — // a street lamp on the edge column: its head over the grass, a warm pool under it
- `if (!car) fxv = L.dir * L.v * 0.06;` — // (H5B's add-on — THE WATER FLOWS the way its logs go: the lane's current in cells a second, for the ground's ripple caps + specks)
- `if (V && !vq) what = plainAt(course, i, j);` — // (VARIETY B1: its area's model freed / not in — the plain vehicle)
- `const taxi = what === 'taxi', nk = Math.floor(hsh(vseed ^ (i * 104729), j * 31 + 7) * NEON.length), ` — // (never a car in YOUR kid's colour — a VIEW: the rules know no colour)
- `const truck = what === 'truck', tz = (len - 0.1) / TRUCK.len;` — // (3 cells = THE BOX TRUCK, built in code — models.js#buildTruck)
- `if (truck) K.trucks.put(cx, 0, z, 0.94, 0.9, tz, ry, tint, 1, day ? dim * 0.8 : dim);` — // (by day a touch under: its white box blew out to a flat slab — now its side reads under its top)
- `if (taxi) { K.bill.put(bx, 0.5, z, 0.3, 0.2, 1, 0, 0xfff3b0, 1, 5, a1); LB(bx, 0.5, z, 0.62, 0.42, 1` — // its ROOF LIGHT: a small lit box + its warm halo
- `if (lWant) { glow(X(nose), z, 0xfff0c8, 1.1 * a1); glow(X(rearX), z, 0xff2a22, 0.85 * a1); }` — // (J4 — its headlights + its tail on the wet road)
- `for (const e of [-hw, hw]) {` — // BOTH headlights + BOTH tail lamps, each at its own place on the model
- `LF(X(nose + L.dir * HEAD_REACH / 2), 0.04, z + e, HEAD_REACH, 1, 0.8, back, 0xfff0c8, 1, 6, 0.5 * a1` — // a short soft beam on the road ahead
- `K.shadow.put(cx, 0.047, z + 0.06, len * 1.06 + 0.25, 0.35, 1.25, 0, 0, 1, 0, 0.5 * Math.min(1, lt));` — // (H5B's add-on: a soft darker shadow under each log — it sits ON bright water)
- `for (const c of [-0.3, 3, 6, 9.3]) {` — // the signals: red, flashing from the tell to the train's tail
- `K.posts.put(x, 0.3, z - 0.44, 0.1, 0.6, 0.1, 0, 0x2a2a34, lt); K.posts.put(x, 0.66, z - 0.46, 0.3, 0` — // (a post + its signal head's housing: a lamp, never a lollipop)
- `if (st.st === 'tell' && on) {` — // a warning glow on the side it comes from
- `for (const e of [-tw, tw]) {` — // the train's front: BOTH headlights cast a soft beam (a little longer than a car's); BOTH tail lights a red glow
- `tailBar(X(rear - p.dir * 0.03), ty + 0.04, z, 0.86, lt); glow(X(nose), z, 0xfff2d0, 1.2 * lt); glow(` — // (H6B — the cars' rule: a light bar across its tail …)
- `LF(X(rear - p.dir * (TAIL_LEN * 0.65 - 0.2)), 0.05, z, TAIL_LEN * 1.3, 1, 1.0, p.dir > 0 ? Math.PI :` — // … and ONE oval red pool starting at it, centred, as wide as the train
- `LF(X(left + len / 2), 0.045, z + 0.55, len, 1, 0.9, 0, 0xffe2b8, 1, 4, 0.3 * lt);` — // (its windows' light on the ground: warm — never blue)
- `if (p.trail) burnLane(p, u, z, lt);` — // (J2 — v2's runways: THE AFTERBURNER TRAIL — drawn here, never waiting for the flyers' module)
- `if (L.ufo && nu < 2 && L.ufo.id !== ufoSeen) {` — // THE UFO (H6A — flyers.js; once a UFO). Until the module has landed: its ring — the rules' warning — alone
- `if (SE && L.type === 'grass') SE.grass(i, L, z, lt, AR);` — // (JT1 — a LEAF PILE on it, if it has one)
- `if (TL.neon > 0.02) for (const x of [xl, xr]) { const nk = TL.neon * li; K.bill.put(x, 3.1, zf + 0.0` — // (VARIETY A — the gates' neon by time: OFF through the morning, ON at sunset)
- `K.bill.put(gx, 1.72, z - 0.47, 0.26, 0.26, 1, 0, fxv ? 0xff2a2a : railGone ? 0x24302a : 0x40ff80, 1,` — // (red in the tell · dark while the train is here · green: clear)
- `LF(px, feet + 0.04, pz + 0.04, 2.3, 1, 1.9, 0, kidHex, 1, 0, 0.3 * lit);` — // (H5A: softer — the new kid's own colours (his face, his arms, his sneakers) must read through it)
- `if (SE && g.hopW && !ghop && !g.outAt) SE.land(GL, gx, gy, g.dir, false, area(r.y).index);` — // (JT1 — a rival LANDED: its prints on the snow, a pile it lands in bursts)
- `if (fr) {` — // (the tape lies at the ground's edge of the lane: a car on its lane hides it, one on the next lane stands clear of it — never drawn over traffic)
- `K.flat.put(0, 0.062, z, 9.06, 1, 0.05, 0, 0xffd6f0, 1, 4, (0.32 * fd + fl * 1.1) * ll);` — // (a pale pink core — no white-hot line to bloom at night)
- `if (day) K.flat.put(0, 0.358, z, 9.1, 1, 0.8, 0, 0x5a3a00, 1, 4, 0.6 * Math.min(1, ll));` — // (by day: a dark edge under the tape — it must read on a sunlit lane)
- `const wz = Z(Ln.lane + (both ? 1.42 : 0.42) - (L.mark ? 1 : 0));` — // (H5A — a gateway lane carries its area's name: the line's words lie a lane lower)
- `lab.m.position.set(rig.x(), 0.07, wz);` — // (centred on the screen: the words ride the camera's own column — never cut by an edge)
- `else { const s = (clock - q.t0) / 1000, sz = q.sz || 0.16, yy = q.y + q.vy * s - (q.g || 6.5) * s * ` — // (JT1: a snow puff · a leaf — their own size, alpha, fall + shape)
- `if (tier === 0 && li === 1) continue;` — // (the lowest tier: one body layer less)
- `K.bill.put(x + 0.25 * sw * sz * 0.2, y - sh * sz * 0.2, z, sw * sz * 1.08, sh * sz, 1, 0, fogC.under` — // (shape 10: a puff fades INTO the ground — never cut by it · VARIETY A: THE FOG CHECK's colours)
- `K.flat.put(0, 0.07, Z(wallE + 0.5), 30, 1, 2.6, 0, 0x5a3a9a, 1, 4, 0.1);` — // (a cold VIOLET breath ahead of it — never blue: blue on the ground = water; the ragged glowing lip itself is the ground shader's)
- `curtain.position.set(0, 1.2, Z(wallE - (day ? 3.1 : 2.3) - 20)); curtain.scale.set(60, 2.6, 40);` — // (by night it starts where the ground is already fully dark: its straight front is never seen)
- `if (bloom && !day) bloom.render(scene, cam);` — // (the bloom is the night's: by day the lights are paint)
- `const WHITE_TEX = ground.uniforms.uShTex.value;` — // (no depth map: the ground's 1 × 1 white)
- `const el = Math.round(Math.max(14, Math.min(68, GR.key[2]))) * Math.PI / 180, ce = Math.cos(el), cx ` — // (B1: the sun's angle in whole degrees)
- `{` — // (VARIETY B1 — TEXEL-SNAPPED: the eye moves on the map's own texel grid, so a still thing's shadow never swims as the camera follows)
- `if (on) { if (bloom) { bloom.dispose(); bloom = null; } sunFree(); for (const f of [...skyHold.keys(` — // (VARIETY A: the sun's depth map freed behind a final screen — made again by the next sunny frame)
- `el.width = 0; el.height = 0;` — // (BEFORE THE FLIP: the canvas freed at once — CLAUDE.md "THE LONG NIGHT's RULE")

### js/games/jaywalk/numerals.js

- `const FOOT = new Map();` — // 'weight family' → { l, w, r, h, b } in em (w = 0: this font's 1 already stands on a foot — or it can't be measured)
- before `export function footOf(family, weight = 700, fresh = false) {`:

```js
/** THE FOOT of this font's "1" (em): l = its left edge from the glyph's origin · w = its width · r = how far it reaches past the
 *  glyph's advance · h = its height · b = where the baseline sits above the foot of a line-height-1 box · adv = the 1's advance.
 *  Measured once a font (a 1 drawn at 200 px, its stem read off the pixels); `fresh` measures again (the web font just landed). */
```
- `const t = mid[1] - mid[0], has = base[1] - base[0] > t * 1.6;` — // (a base already wider than the stem: the font's own foot)
- `el.dataset.num = t; el.dataset.dg = String(t.length); el.setAttribute('aria-label', t);` — // (data-dg: the lane count steps down a size at 3 + 4 digits — css .jw-lanes[data-dg])
- before `export function drawNum(c, text, x, y, size, family, weight = 900) {`:

```js
/** canvas — draw `text` from x (its left edge; the baseline at y) glyph by glyph: the room between digits, a foot under every 1.
 *  Uses the context's own fill + shadow (call it once a pass). The context's font must be `${weight} ${size}px ${family}`. → its width */
```

### js/games/jaywalk/replay.js

- before `export function replay({ seed, mode = 'solo', log = [], until = null, cv = 1 } = {}) {`:

```js
/**
 * → { lanes, tick, end, over, y, x, cause, taken, hits, feats: { boom, ufo, airfield }, used }
 *   lanes = the farthest lane landed on · tick = when (the tie-break: the earlier tick wins) · end = the tick the run ended (−1 = `until` came first) ·
 *   cause = the hit ('car' | 'water' | 'train' | 'edge' | 'blackbird' | 'ufo' | 'wall') or 'taken' (THE MOTHERSHIP) · used = the log entries played.
 * A hop logged at tick t is applied IN tick t (a hop logged after the run ended is never played: `used` < log.length).
 * `until` (optional) stops at that tick (a run still going — the ghosts, a match scored as it stands).
 */
```
- `const run = createRun({ seed, mode }), course = createCourse(seed, { cv });` — // (J2 — `cv` = the COURSE VERSION: versions.js)
- `const why = inputProblem(log, i, h && h.t, h && h.d, mode);` — // (engine.js — the recorder's own function: the two can not differ)
- before `const chunkStr = v => (typeof v === 'string' ? v : v && typeof v === 'object' && typeof v.s === 'str`:

```js
/** a chunk as the proof node holds it: H3 = { s: the packed hops, at: the SERVER's time it was written (the rules: === now) }; a bare
 *  string (H1's shape — the pure tests) still reads */
```
- before `export function chunkTimes(c) {`:

```js
/** THE CHUNKS' OWN CLOCK (H3) → [{ at (the server's time), n (its hops), t0, t1 (its first + last hop's tick) }], or null (a hole, a bad
 *  chunk, a chunk without its timestamp) */
```
- before `export function clockProblem(go, times, { from = null } = {}) {`:

```js
/**
 * THE SPEED CHECK, BOTH WAYS (H3 — PURE) + THE DROPPED SIGNAL (H4). Tick 0 = `go` (a server time). A chunk's `at` = the server's time it
 * ARRIVED. It may not hold a hop AHEAD of the real clock (tick > the clock's tick + CLOCK.ahead: a sped-up game, a log made in advance) —
 * the run is refused. A hop far BEHIND it (its chunk's first hop > CLOCK.behind late) is one of two things:
 *   · A DROPPED SIGNAL: the phone was offline — its queued chunks arrive TOGETHER after a SILENCE. The lag is explained when no hop is
 *     older than the last arrival before the silence (− CLOCK.behind), the silence is ≤ CLOCK.drop, and the burst is back on the clock
 *     within CLOCK.catchUp of its first chunk (a later chunk on time), each chunk of it LESS late than the one before — or the run
 *     simply ended inside it. Never held against the run.
 *   · SLOW MOTION: the ticks drift behind while the chunks keep arriving — no silence explains it → BEHIND: the run counts up to the
 *     first late hop. A "drop" that never catches up was slow motion all along → cut at the burst's first hop.
 * → null (honest) | { why: 'go' | 'chunks' | 'clock' | 'ahead' | 'behind', tick (behind: the run counts up to it), hops (the hops before it) }
 * `from` (a MATCH): the earliest a chunk may arrive — the first GO (tick 0 is 2 s after it); default = `go`.
 */
```
- `let last = from == null ? go : from, hops = 0, drop = null;` — // (drop: a burst whose lag the silence before it explains — until it catches up)
- `if (!(k.at >= last)) return { why: 'clock' };` — // (a chunk's time never runs backwards, never before GO)
- `if (k.t0 >= now - CLOCK.behind) drop = null;` — // (on the clock — a drop before it is settled)
- before `export function judgeRun({ seed, mode = 'solo', log, go = null, times = null, from = null, until = n`:

```js
/**
 * THE JUDGE (H4 — PURE): ONE run from its hop log + its chunks' clock — the host's podium (logic.js#scoreNode) and the server's count
 * (api/_lib/jaywalk.js) run THIS, so they agree to the lane. → { ok: true, result (the replay's), over, cut? } | { ok: false, why }
 * Refused: a log that breaks the bounds · AHEAD of the clock · a broken clock · a hop logged after the run had ended · a course version
 * that is no version (J2 — `cv` is the version the run replays on: the caller's versions.js#runVersion). A log BEHIND the
 * clock is CUT (`cut: { why, tick }`): the run counts up to its last on-time hop. `until` = score it as it stands at that tick.
 * J2 FIX — THE END CHECK (v2 only): `end` = the phone's own end ({ l, t } — the proof's `e`, never a count): a v2 run that ENDED in the
 * replay must have ended where the phone saw it end — else the phone played other v2 numbers (the pre-fix J2 build): 'old build', never
 * counted. It can only refuse (a phone's claim never adds a lane); a cut run, a run still going or no `e` = not checked.
 */
```
- `if (cv !== 1 && cv !== 2) return { ok: false, why: 'version' };` — // (J2 — versions.js#runVersion's 0: a version not in force at its GO, or none past THE GRACE)

### js/games/jaywalk/sfx.js

- `export const JW_SFX_REV = 4;` — // (bump when a sound file is replaced — 2: H5C's train bell · 3: H6B's NEW BEST = take B · 4: BEFORE THE FLIP's area arrival)
- `export const TRIM = 0.8;` — // (takes the compressor's own make-up gain back out: a lone sound plays at its level)
- before `let labPicks = false;`:

```js
/** THE TAKES ARE PINNED (BEFORE THE FLIP — the owner, Nov 17): the GAME plays the owner's picks for everyone — every A / B sound its
 *  take A (NEW BEST = its B recording is that sound's only file since H6B; the train = set B; the area arrival = the sparkle). Only the
 *  LAB page (lab.js → useLabPicks) plays + remembers this phone's own A / B choice from THE SOUND AUDITION. */
```
- `const bytes = new Map();` — // 'id:a' → Promise<ArrayBuffer | null>
- `const bufs = new Map();` — // 'id:a' → AudioBuffer (for bufCtx)
- `const live = new Set();` — // the voices sounding: { src, pri, at }
- `const log = [];` — // the test hook: what started
- `const asked = [];` — // the test hook: what was asked for (locked / headless included)
- `const total = { asked: 0, started: 0, by: {} };` — // (… and how many EVER — the two lists keep their last 200: H5A's cues fill them fast)
- before `export function fetchSounds(ids = SOUNDS.filter(s => s.play && !s.match && !s.season).map(s => s.id)`:

```js
/** fetch the bytes now (no AudioContext needed). `ids`: which sounds (default: every sound in play); `both` = a sound's pick AND its
 *  backup (the audition's — the game fetches the take it plays: the owner's pick, A unless this phone chose B) */
```
- `export function fetchSounds(ids = SOUNDS.filter(s => s.play && !s.match && !s.season).map(s => s.id)` — // (J1: the match's own sounds only when asked — view.js, a match · JT1: the season's on their days)
- before `export function play(id, o = {}) {`:

```js
/**
 * play one sound NOW: name, { ab ('a' | 'b' — default: the owner's pick), rate, vol, loop } → a handle { stop() } (null = nothing started:
 * locked, muted, undecoded, outranked). A tap that comes BEFORE the unlock (the first hop) plays as soon as it lands, if still fresh.
 */
```
- `if (!o.late) { const go = () => decode().then(() => { if (performance.now() - t0 < (s.loop ? 1500 : ` — // (locked / muted: ONE sound waits for the unlock — every call used to leave a listener there for good)
- `if (s.max && voices.filter(q => q.id === id).length >= s.max) return null;` — // (H5A — a sound's own cap: ≤ 2 car passes, one horn, one bell)
- before `const set = (vol, rate) => { try { const t = ctx.currentTime; g.gain.setTargetAtTime(s.gain * vol, t`:

```js
    /** stop it — `fade` s (default: the sound's own — the train sounds' 0.5 s): a ramp first, never a dead cut · set(vol, rate): a loop
     *  glides to a new level + speed (THE STOPWATCH — never a jump) */
```
- `let tick = null, tickWant = null;` — // (tickWant: the { level, rate } wanted now — null = silent)
- `const cued = [];` — // the test hook: every cue asked
- `if (q.cue === 'train-horn') return play('train-horn', { pan: q.pan });` — // (H5C — one blast a train, when its warning starts)
- `if (q.cue === 'truck-horn') return play('truck-horn', { pan: q.pan });` — // (BEFORE THE FLIP — a box truck's own air horn, now and then)
- `if (e.e === 'out') return e.cause === 'water' || e.cause === 'edge' ? play('splash') : e.cause === '` — // (THE UFO: the beam's own sounds — flyers.js)
- `export const totals = () => ({ ...total, by: { ...total.by } });` — // (by: how often each sound was ever asked for)

### js/games/jaywalk/skyline.js

- before `export const SKY_BIAS = Object.freeze({ docks: 14.5, fish: 11, yard: 17, bridge: -17, downtown: 4.25`:

```js
/**
 * WHERE THE LANDMARK STANDS: a phone shows the middle ≈ 65 % of the picture — the band RESTS this many % of the picture's width off
 * its centre while the kid is in the area (+ = its RIGHT side comes in): the landmark on the screen, clear of the lane count; the
 * slide with the kid's column rides on top. NIGHT HAS ITS OWN (H6B — measured off the night pictures).
 */
```
- `export const SKY_BIAS = Object.freeze({ docks: 14.5, fish: 11, yard: 17, bridge: -17, downtown: 4.25` — // (H6B's review: the cranes, the fish hall, the rail yard + downtown's towers were cut by the screen's right edge; the lighthouse stood under the match's chips)
- before `export const SKY_MAX = Object.freeze({`:

```js
/**
 * THE LANE COUNT NEVER TOUCHES A LANDMARK (the go-live review — measured off the pictures on a 390 pt phone, the tightest: the columns
 * each landmark fills in the count's rows against a 3- / 4-digit count's width — x 128 … 262 of 390, css `.jw-lanes[data-dg]`): the HIGHEST shift at which
 * the area's landmark still stands clear of the count. The rest offsets above sit under it; the SLIDE never carries the band past it
 * (the kid at the right edge: the band simply stops). An area not named has no limit but the room.
 */
```
- before `export const SKY_OPEN_DAY = Object.freeze({ bias: 6.5, min: 5.5 });`:

```js
/**
 * THE OPENING BY DAY (the second review): the plain day picture has a small lighthouse at 43 % — right under a 1- / 2-digit count
 * when the band rests centred. The opening rests a little to the right (the lighthouse left of the count) and never slides back
 * past `min`. By night the plain picture has no lighthouse: centred, as before.
 */
```
- before `export const SKY_PIN = -17.25, SKY_MATCH_PIN = Object.freeze(['bridge', 'lighthouse']);`:

```js
/**
 * IN A MATCH the players' chips stand on the band's LEFT edge (css `.jw-order`: 86 pt wide, down to 164 pt with 8 players). The two
 * landmarks painted on the LEFT rest as far RIGHT as the picture goes and do not slide back under them: the lighthouse (both looks)
 * and the night bridge then stand clear of the chips; THE DAY BRIDGE cannot — it is painted over the picture's left 38 %, the band has
 * ± 17 % of room: its right tower + span stand clear, its left tower is behind the column (docs/jaywalk.md "THE GO-LIVE REVIEW").
 */
```
- before `export const SKY_LIGHTS = Object.freeze([[31.7, 51.4, 0], [62.6, 64.8, 1.7], [64.2, 65, 1.7], [66.4,`:

```js
/** THE NIGHT's LIFE, in % of the picture: [x, y, delay s] the red aviation lights · [x, y, w, h, delay s] the windows that flicker —
 *  and, per area, the ones its painted landmark stands on (measured by scripts/build-jaywalk-assets.py): OFF there. */
```
- before `export function skyPlan(lane, look, match = false) {`:

```js
/**
 * what the band needs with the kid at `lane` in `look` → { now: the picture on the band, next: the one to fetch ahead (null = none),
 * bias: where the band rests (% of the picture's width), max / min: the highest / lowest shift the slide may reach (99 / −99 = the room alone) }. `match`:
 * the chips are up — the left landmarks are pinned (SKY_MATCH_PIN).
 */
```

### js/games/jaywalk/sounds.js

- before `export const SOUNDS = Object.freeze([`:

```js
/** every JAYWALK sound: id, its words in the audition, a B backup?, a loop (the whole WAV), its gain into the limiter, its priority,
 *  `max` (how many of it may sound at once), `fade` (s — H5B: it NEVER stops dead: its own end, a stop and a dropped voice all ramp
 *  out through its gain). H5A — ALL IN PLAY (the owner picked ALL A): THE PRIORITY = your own hit / splash (4) > the train · the
 *  lights dying · a gateway · a new best (3) > a horn (2) > a hop · a landing (1).
 *  H5B (the owner, playing H5A): THE HORN AT HALF its level (1.0 → 0.5) · the CAR-PASS near-miss whoosh is GONE ("it's terrible" — its
 *  row, its cue, its fetch, its two files) · the train sounds FADE OUT (`FADE_S`)
 *  H5C (the owner): THE TRAIN SOUNDS = set B — a North American crossing bell (ONE take: the old bells, A + B, are gone) + THE TRAIN
 *  HORN (one blast a train, when its warning starts) · THE AREA ARRIVAL ("area-arrive") replaces the landmark ping (its row + file gone)
 *  H6B (the owner): NEW BEST = its B take, ONE take (the sparkle is THE AREA ARRIVAL's alone) · THE MIX — every gain set against the
 *  others, MEASURED (tests/integration/jaywalk-mix.mjs — docs/jaywalk.md "THE MIX"): the train's bell + horn + the arrival chime came
 *  in 10–17 dB hotter than the rest; the hop + the landing a touch softer (heard hundreds of times a run)
 *  BEFORE THE FLIP (the owner, Nov 17 — the delivery's sfx5, all CC0): THE STOPWATCH (a seamless WAV loop — cues.js#tickOf: silent until
 *  the dark is within 3.5 lanes (it waits at 5), a calm tick-tock fading in + speeding up as it closes; it REPLACES the lights dying — row + file gone) ·
 *  THE TRUCK HORN (the owner, 7:21 pm: the SAME horn moments alternate car · truck — no horn added; at the car horn's measured loudness) ·
 *  THE AREA ARRIVAL replaced ("Success" — a warm synth chord; the sparkle is gone). Their levels measured against the rest (jaywalk-mix). */
```
- `export const HOP_VARY = Object.freeze({ rate: 0.06, db: 2 });` — // (a hop: pitch ± 6 %, gain ± 2 dB — never the same twice)

### js/games/jaywalk/splits-card.js

- before `export function splitsCard(ticks) {`:

```js
/**
 * → { el (null when no split was reached — nothing is shown), server(sp) } — `ticks` = this run's splits (the phone's own engine first).
 * server({ r, b, n }): the server's answer for THIS run — its splits win, its bests replace the remembered ones, its faster ones glow.
 */
```
- `if (n) { x.box.classList.add('is-new'); x.best.replaceChildren('NEW BEST', h('b', splitGain(n.tick, ` — // (the gain on its own line: every box keeps one width)
- `const r = cleanSplits(sp.r), b = sp.b != null ? cleanSplits(sp.b) : known();` — // (no bests in the answer — a run not counted: the remembered ones stay)
- `if (Array.isArray(sp.r) && !r.length) { el.hidden = true; return; }` — // (the server's run reached no split — a cut run: its numbers win)

### js/games/jaywalk/tuning.js

- `export const MID_COL = 4;` — // (the centre column: never an obstacle on it — a straight way through every grass lane)
- `export const KID_HALF = 300;` — // (the kid's half width against cars / trains / the Blackbird — 0.3 of a cell: a fair, slightly small box)
- `export const LOG_GRACE = 150;` — // (how far past a log's end the kid's centre may sit and still be on it)
- `export const CALM_LANES = 4;` — // (lanes 0–3: plain grass — the opening is always calm)
- `export const STRETCH = 50;` — // (a stretch = the 50 lanes from one landmark to the next)
- before `export const SPLIT_EVERY = 50;`:

```js
/** J1 — SPLIT TIMES: the tick each multiple of this many lanes is FIRST reached (engine.js#land → the run's `sp`; the end card's boxes; the
 *  server's best splits — core/splits.js). 60 ticks = 1 s. */
```
- before `export const EVEN = Object.freeze({ grassRun: 2, grassPer10: 5, hazardRun: 3 });`:

```js
/** J2 — EVEN STARTS (COURSE RULES v2 only — versions.js; v1 never reads this): the opening (lanes CALM_LANES … STRETCH − 1) never runs
 *  free. The kinds keep the heat's own mix, but its SPREAD is tightened, lane by lane in order (course.js#openingKinds): never more than
 *  `grassRun` ground lanes in a row · never more than `grassPer10` in any 10 lanes running · never more than `hazardRun` hazard lanes in a
 *  row (the other side of the same coin: the overall difficulty stays the curve's — measured, docs/jaywalk.md "EVEN STARTS"). */
```
- `export const WATER_RUN_MAX = 3;` — // (never more than 3 water lanes in a row)
- `export const RAIL_RUN_MAX = 3;` — // (… nor more than 3 rail lanes — H5A: THE RAIL YARD leans hard on them)
- before `export const AREAS = Object.freeze([`:

```js
/** THE AREAS (H5A — the owner, Nov 16): a new area every 50 lanes — the stretch that BEGINS at a landmark's lane IS that place (lanes
 *  50–99 THE DOCKS · 100–149 THE FISH MARKET · … · 400–449 THE AIRFIELD · 450 on: the loop again, harder); lanes 0–49 are the plain
 *  opening. Each area LEANS the lane mix — `mix` [grass, road, water, rail], a PERCENTAGE on the heat's own weights (MIX): the difficulty
 *  curve keeps climbing underneath — the speeds, the gaps, the logs' lengths, the trains' laps stay the heat's alone. `cars` + `gap` =
 *  HEAVIER TRAFFIC (more cars a lap, less spare room between them — never under the crossable gap, ROAD.gapMin + gapVTicks);
 *  `flight` = the stretch has its flight paths FOR SURE, two of them (no UFO there: never both in one stretch). */
```
- `Object.freeze({ name: 'THE FISH MARKET', mix: Object.freeze([135, 90, 130, 50]) }),` — // the market's ground + water
- `cars: [2, 4],` — // (cars in one lap of the lane, before the gaps are sized)
- `gapMin: 2600, gapVTicks: 26,` — // (a gap is never under 2.6 cells + what a car covers in 26 ticks — the crossable window)
- `gapExtra: [5200, 2400],` — // (+ a random 0 … this much, by heat)
- before `export const WATER = Object.freeze({`:

```js
/** WATER (H3 — the owner, Nov 16): every log its OWN LENGTH, 1–4 cells, from the seed — long logs more common early, short ones later (the
 *  difficulty curve) — and UNEVEN GAPS. A 1-cell log is the hard one: never on a lane beside another water lane, never on a fast lane. */
```
- `lenW: [[4, 14, 36, 46], [30, 40, 22, 8]],` — // (the weights of a 1 · 2 · 3 · 4-cell log at heat 0 → 1000; past 1000 they keep going, never under 1)
- `oneV: 44,` — // (a 1-cell log only on a lane this slow or slower — its landing window stays ≥ ~0.5 s)
- `gapShort: [900, 1500], shortOf: 380,` — // (UNEVEN GAPS: this many gaps of 1000 are SHORT — 0.9–1.5 cells …)
- `gapMin: 1400, gapExtra: [1400, 2600],` — // (… the rest LONG: 1.4 cells + a random 0 … this much, by heat)
- `export const MIN_TELL_TICKS = 90;` — // (1.5 s — the Blackbird's tell is never shorter: tests/jaywalk-sim.test.mjs)
- before `export const RUNWAY = Object.freeze({`:

```js
/**
 * J2 — THE BLACKBIRD's RUNWAYS (COURSE RULES v2 only — versions.js; v1 keeps FLIGHT): a runway = a band of 3 or 4 flight lanes, EACH with
 * its OWN jet on ONE shared lap, staggered (the lanes' passes spread round the lap in a shuffled order — never all at once: a kid weaves
 * and times across). Every lane: its tell (≥ MIN_TELL_TICKS) → the pass (the body, `FLIGHT.len` at `FLIGHT.v`) → THE AFTERBURNER TRAIL
 * (`trail` ticks: the whole lane still burns — touching it = 'blackbird') → quiet. A runway always has a SAFE ground lane right before
 * and right after it (a place to wait — course.js#typeAt), never another runway back to back. FAIR BY CONSTRUCTION: every layout is
 * checked as it is made (course.js#runwaySlack — a careful kid, waiting + hopping, gets across from at least `slack` start ticks of
 * every lap); one that is not falls back to the tight cluster (`gap[0]`), which always leaves a calm gap the whole band is quiet in.
 *   period   a lane's lap [at heat 0, at heat 1000] = [[min, max], [min, max]] ticks (4–6 s early → 3–4.5 s deeper; never under periodMin)
 *   four     ‰ of runways with 4 lanes (else 3), by heat
 *   chance   ‰ a stretch gets runways: s2 = THE FISH MARKET (from lane `first`) · mid = 150–249 · deep = 250 on (+ `two` ‰ of those a 2nd)
 *   ufo      the most ‰ a stretch gives THE UFO first (never both in one stretch) · THE AIRFIELD: `airfield` runways, never a UFO
 *   v        J2 FIX — THE BLACKBIRD YOU CAN SEE (the owner, Nov 21): a runway jet's speed (FP a tick) [lanes 120–249, from 250, THE AIRFIELD]
 *            — it crosses the 8-column view in ≈ 0.67 · 0.53 · 0.39 s (J2 flew 1000: 0.13 s, felt, never seen). `len` = its body.
 *   tell     the per-lane warning — 72 ticks = 1.2 s (J2: 1.6 s): the slower, SEEN jet keeps the threat about the same. v2's own floor
 *            (`tellMin`); v1 keeps MIN_TELL_TICKS (1.5 s) — frozen.
 */
```
- `gap: Object.freeze([18, 0]), slack: 24, wait: 216,` — // (J2 FIX — `wait`: a layout that can keep a careful kid waiting more than 3.6 s is not used either — course.js#runwayWait)
- `start: -8 * FP,` — // (it begins 8 lanes behind the start)
- `delay: 180,` — // (and waits 3 s — the calm opening)
- `behind: 5,` — // (never more than 5 lanes behind the kid's BEST: no banking distance — it waits just under the screen's foot)
- before `export const MODES = Object.freeze({`:

```js
/** THE MODES — the wall's pace (FP a tick) + its speed-up, THE MOTHERSHIP's tick (cap: 0 = never). All tunable here.
 *  ONE LIFE EVERYWHERE (H4 — the owner, Nov 16): one hit = out, in every mode. No lives option, no respawn, no blink, no one-up.
 *  SOLO ENDLESS = no speed-up, no end · MATCH = faster from ~4 min, THE MOTHERSHIP at ~6 min takes whoever is left (rare — a reward) ·
 *  DAILY (built later — DAILY A / B) = faster from ~3 min, THE MOTHERSHIP at ~5 min. */
```
- `export const MIN_INPUT_GAP = 2;` — // (two inputs are never closer than 2 ticks — 33 ms)
- `export const MAX_INPUTS_PER_SEC = 20;` — // (… and never more than 20 in any one second)
- `export const MAX_LOG = 60000;` — // (a solo run's whole log; a capped mode's = its cap / MIN_INPUT_GAP at most)
- `ahead: 2 * TICK_HZ,` — // (a chunk's LAST hop: at most 2 s ahead of the chunk's own timestamp — the phone's clock estimate + a frame)
- `behind: 8 * TICK_HZ,` — // (… its FIRST hop: at most 8 s behind it — the upload every second + a slow network)
- `drop: 75 * 1000,` — // (ms — THE DROPPED SIGNAL: a silence this long before a burst explains its lag: ~60 s offline + the reconnect)
- `catchUp: 15 * 1000,` — // (ms — … and the burst must be back on the clock within this of its first chunk, or it was never a drop)
- `jitter: 6,` — // (ticks — inside a burst a chunk may be this much later than the one before it, never more: a lag that grows is slow motion)
- `flushMs: 1000,` — // (the phone uploads its new hops every second — a solo run)
- `flushMatchMs: 120,` — // (… AT ONCE in a MATCH — H4B: a hop goes up within this; the others' ghosts are your hop log. ≤ 8 small writes a second at the very most)
- `chunkMax: 400,` — // (a chunk's packed string — the rules' bound)

### js/games/jaywalk/variety.js

- before `export const VARIETY = Object.freeze({`:

```js
/** every variety vehicle: its slot (cells), its drawn width + height (cells), its emergency light bar ('' = none; `bar` = along the body from the
 *  nose 0 … 1, its height as a share of the model's) · dayK = by day a touch under (a white body blew out to a flat slab — the box truck's rule) */
```
- before `const DOWNTOWN = { 1: [['police', 0.07], ['suv', 0.08], ['sports', 0.07]], 2: [['citybus', 0.2], ['d`:

```js
/** THE AREA SETS — by the area's index (tuning.js#LANDMARKS: 0 THE DOCKS · 1 THE FISH MARKET · 2 THE RAIL YARD · 3 THE BRIDGE · 4 DOWNTOWN ·
 *  5 THE CANAL · 6 THE LIGHTHOUSE · 7 THE AIRFIELD; −1 = the opening, DOWNTOWN's set) → per slot [id, share of that slot's vehicles]. A 1-cell
 *  slot keeps ≥ 3 / 4 plain cars everywhere (the sedans · hatchbacks · taxis), every slot ≥ 1/2 plain — plain the clear majority on screen. */
```
- before `let WINTER = false;`:

```js
/** VARIETY B2 — THE WINTER TRUCKS: on a winter run (the run's own day — night.js#setSeason, Dec 1 → Mar 1) the van slot's top tenth of
 *  draws (always a PLAIN van in every set: no set reaches 0.9) is a snowplow (0.90 …) or a salt truck (0.95 …); every phone on the run's day */
```
- before `const KNOWN = new Set();`:

```js
/** THE NAMES ARE THE DRAWN ONES: the ids whose model has come in on this page (kept for the page's life — a rival's end line in an area this
 *  phone already passed still names what was drawn there) */
```
- `export const VARIETY_REV = 2;` — // (B2: the files slimmed — the wheels, the undersides, the hidden insides)
- before `export const warmVariety = () => Promise.all(areaIds(-1).map(id => fetch(new URL('${id}.glb?v=${VARI`:

```js
/** the OPENING's files into the HTTP cache (the cartridge's preload, during the walk inside — its 1.5 MB line: THE DOCKS' come in from the
 *  scene itself while the menu / the count shows) — fetched, never parsed */
```
- before `export const PUMP = Object.freeze({ budget: 7, starve: 24 });`:

```js
/** VARIETY B2 — THE TAPS: a frame that has already worked this long (ms) — or whose kid has just left the ground — takes no loading step;
 *  after STARVE frames skipped in a row, one step is taken anyway (a phone that is always busy still gets its models) */
```
- before `export function createVariety({ parseGlb, add, drop, now = () => performance.now(), ids = areaWants,`:

```js
/**
 * THE PER-AREA LOADER: want(list of area indices) → the files of those areas fetched (the ones no longer wanted FREED — drop(id)); pump(busy)
 * at the END of a frame takes at most ONE STEP (B2: a model's parse, OR its kind made — never both in one frame), and none when the frame was
 * busy (PUMP); a file that fails is asked again 5 s later (never a stall: the slot draws its plain vehicle meanwhile). The steps' cost is kept
 * (info: `worst` ms). `ids` (an area → its model ids) · `url` · `known` let B2's trees + edge pieces share this loader. → { want, pump, info, destroy }
 */
```
- `const held = new Map(), queue = [];` — // id → 'loading' | 'in' · the fetched buffers waiting for a frame
- `const drops = [];` — // (B2: the models no longer wanted — freed ONE a step too: an area passed never frees six kinds in one frame)
- `for (let k = drops.length - 1; k >= 0; k--) if (wanted.has(drops[k])) { held.set(drops[k], 'in'); dr` — // (wanted again before it was freed: kept)

### js/games/jaywalk/versions.js

- before `export const CV_REV = 2;`:

```js
/** J2 FIX — the REVISION of v2's numbers this code plays: 2 = THE BLACKBIRD YOU CAN SEE (the jets slower, the tell 1.2 s — tuning.js#RUNWAY,
 *  changed BEFORE v2 went live; v2 is FROZEN from here — tests/fixtures/jaywalk-v2/). A phone still on the pre-fix J2 build plays the old
 *  numbers under the same `cv` 2: the daily's START refuses it on a v2 day (no `cvr` — it is told to refresh) and a solo / match run of its is
 *  refused by THE END CHECK (replay.js#judgeRun: its own end `e` never matches the server's replay) — never a wrong count. */
```
- `switchAt = typeof ms === 'number' && !Number.isNaN(ms) ? ms : CV_SWITCH_MS;` — // (Infinity = v1 for ever: the unit tests of the match logic)
- before `export function runVersion(cv, E, go) {`:

```js
/**
 * THE CHECK (PURE — the host's podium + the server's count): the version a run REPLAYS on, from what its proof carries.
 *   `cv` = the run's own field (undefined / null = none) · `E` = the version in force at its GO (versionAt) · `go` = its GO (a server time)
 * → 1 | 2, or 0 = REFUSED ('version' — a version that is not the one in force at its GO; or none at all once THE GRACE is over)
 */
```
- before `export function tryVersion(day, cvs, now, cvr = null) {`:

```js
/** the daily's START: the version a NEW try is opened on → 1 | 2, or 0 = refused. ONE COURSE A DAY ("a day's daily uses the version in force
 *  at its 4 am" — the fresh-eyes review's M4: no grace here): a v2 day refuses a phone that does not know v2 (it is told to refresh); a v1 day
 *  is v1 for everyone. `cvs` = the newest version the phone says it knows (none = an old-code phone) · `cvr` = its v2 numbers' revision (J2 FIX:
 *  none = the pre-fix J2 build — refused on a v2 day). (`now` kept for the callers' shape) */
```

### js/games/jaywalk/victory.js

- `finLine(h('div.jw-fin-cause', { 'data-text': line }, line), 'jaywalk', gold),` — // (CITY PART 2 — THE END NEON: JAYWALK's pink; THE MOTHERSHIP gold)
- before `export const TABLE_ROWS = 4;`:

```js
/**
 * YOUR TABLE (H3): your friends' JAYWALK bests under your own — you + the friends YOUR list names (the server's read: /api/profile `table`,
 * never a pid in the page), best first, as SLIM CARDS (ui/strip-board.js — stills + THE LIVE LANE), the lanes at the right. Shown only when
 * a friend has a best (a table of one is nothing); at most TABLE_ROWS rows — you are always among them.
 */
```
- `return h('li', { class: r.me ? 'is-me' : null }, h('span.jw-table-n', String(r.place)), h('div.jw-ta` — // (JT2: + THE BOARD's AVERAGE under the best)   // (CITY H2 — THE YOU ROW: the shared glow, never this table's own box)
- `list.style.setProperty('--jw-d', String(Math.max(...rows.map(r => num(r.v).length)))); if (rows.some` — // (the widest score's digits → the rank + score columns' ONE width — css .jw-table-list)
- before `export function endOf(game, uid, code, courses = null) {`:

```js
/** what this player's run was, from the match's result row (logic.js#scoreRun): the line + the lanes. The course: a SOLO run's from its
 *  own GO, a MATCH's the game's (`courses` — one course built once for a whole podium) */
```
- `const seed = solo ? seedOf(code, game.matchId, r.go) : game.seed, cv = r.cv === 2 ? 2 : 1, key = '${` — // (J2: the row's course version)
- `const look = typeof document !== 'undefined' && document.body && document.body.dataset.look === 'day` — // (H5B: by day the wall is THE FOG BANK)
- `el.dataset.mode = 'match'; el.dataset.podium = 'none';` — // (the console lists EVERY place under this body — slim cards, the lanes, the cause lines)
- `const p = ((state && state.players) || {})[uid], table = () => { if (!tabled && el.isConnected) { ta` — // (your row glows in YOUR colour)

### js/games/jaywalk/view.js

- `const SHIP_SEEN = 252;` — // (ticks: the 4.2 s the Mothership's lift is seen — flyers.js#holdMs)
- `const SHIP_WARN = 600;` — // (ticks: the Mothership's 10-s warning before the cap — flyers.js#FLY.warn: THE ARRIVAL BANNER never shows over it)
- `let table = null;` — // { uid, at, p: Promise<{ best, friends } | null> }
- `if (choice === 'auto' && !sun) choice = document.body.dataset.look === 'day' ? 'day' : 'night';` — // (the sun not read yet: the console's own day / night)
- `let code = '', uid = '', matchId = '', mode = 'wait', D = null;` — // 'wait' (the course is on its way) · 'run' · 'over' (out / taken / watching)
- `let todAt = -1e9, todKey = '';` — // (VARIETY A — THE TIME OF DAY's last check + what the scene shows)
- `const ghosts = new Map();` — // uid → ghosts.js#createGhost (conf · run · log · done · held · vis · behind) + { uid, n (chunks read), lastT, hex, name, tagEl, dir, outAt }
- `let look = 'night';` — // (H5B — the look this screen is drawn in now)
- `let rosterEl = null, rosterKey = '';` — // (H5B's add-on — THE NAMES AT THE START: who is playing, lined up through the 3 · 2 · 1)
- `let cues = createCues(), ducked = null, duckT = 0, trainOn = false, momK = 1;` — // (H5A — THE WORLD's SOUNDS: cues.js; the music's level before the train ducked it)
- `let lines = { best: 0, friends: [] }, record = false, lineKey = '', tableN = 0;` — // (THE LINES: your best + your friends' — the server's; record: this run is past your best)
- `let mom = null, momAt = 0, stageW = 390, stageH = 844, offSize = null;` — // (J1 — THE MATCH MOMENTS: moments-view.js; the stage's size from a ResizeObserver — never read in a frame)
- `let mergedSeen = '';` — // (TEST — JT2: the last merged name tag ("ALICE +1") this screen put up: the E2E reads the moment, never polls for it)
- before `const scoredNow = g => { try { return { ...g, ...finalPatch(g, runsNow() || {}, srvNow(), code) }; }`:

```js
  /** the podium after a wait: scored from the nodes as they stand now (the host's own step — director.js#finalPatch), never an early
   *  `final`'s numbers */
```
- `const syncs = TEST ? [] : null;` — // (the pass's measure — tests/integration/sound-sync.mjs: when each hop's / landing's sound was asked)
- `lanesEl = h('div.jw-lanes'); setNum(lanesEl, 0); prepNums(lanesEl); markEl = h('div.jw-mark', '');` — // (THE BIG NUMERALS — numerals.js: room between the digits, a 1 with a foot)
- `arriveEl = createArrival(root, AREA_LOOKS);` — // (BEFORE THE FLIP — THE ARRIVAL BANNER: arrival.js)
- `look = lookNow(); night.setLook(look); root.dataset.look = look;` — // (H5B — THE DAY LOOK: the scene + this screen's own words follow the phone's GAME LOOK)
- `try { night.prepSeason(dayOfRun(serverNow())); night.onSeasonSound(seasonSound); } catch { /* polish` — // (J4 — THE SEASONAL PACK fetched while the menu / the count shows: in season only, never blocking GO)
- `try { SFX.fetchSounds(); if (isMatch) SFX.fetchSounds(SFX.MATCH_SOUNDS); seasonSounds(dayOfRun(serve` — // (J1: + THE MATCH MOMENTS' three, a match only · JT1: the season's own, on a season day only)
- `if (offGL) offGL();` — // (the dead scene's destroy() is not a second loss)
- `let seasonRun = null;` — // (the season this run APPLIED — its normal look if its pack was not in by its start)
- before `function reSeason() {`:

```js
  /** a rebuilt scene (THE LOST CONTEXT) takes back EXACTLY the season its run applied — winter only if the run had it (never turned on mid-run);
   *  the pack fetched again for the next run either way */
```
- `if (node && node.go > 0) { rejoin(node); return; }` — // (a refresh / a rejoin mid-run: the run so far is in the node)
- `if (typeof v === 'number' && v > 0) { clearTimeout(goTimer); writeCv(v, versionAt(v)).then(cv => { i` — // (the GO is ON the server: never unproven for the cv's round trip)
- before `function writeCv(goAt, E) {`:

```js
  /** J2 — COURSE RULES v2: a solo run's version = the one in force at its own GO (versions.js), written beside it (`cv`) — the rules take it
   *  once, after the GO; the server checks it against the GO. REFUSED (rules not re-published yet): the run plays the version the server
   *  will replay a run with no `cv` on (v1 until THE GRACE ends) — the phone and the server always agree */
```
- before `function rejoin(n) {`:

```js
  /** a SOLO rejoin: a node with its GO but no cv and NO hop yet (a refresh between the GO and the cv) writes it now; one with hops keeps
   *  the version they were played on (no cv = v1, the run with no cv — never moved under them) */
```
- before `function askGoMatch() {`:

```js
  /** GO (a MATCH): this phone's own `go` — its proof of being there; the FIRST one to land is the match's (logic.js#firstGo). A refusal
   *  (this phone's clock a touch early, a rejoin) is looked at and tried again a few times — never a stuck start: the count runs on */
```
- `log = old || []; W.reset({ sent: log.length, next: chunks ? Object.keys(chunks).length : 0, verify: ` — // (CITY I: a rejoin's first write reads the chunks fresh)
- `if (firstHop) { queue.push(firstHop); firstHop = ''; }` — // (JT2: the hop that started the run is its first)
- `revealed = true; if (night) night.setReveal(1);` — // (the flag too: a lost context's rebuild reads it — THE POLISH PASS)
- before `function adoptMatch(S, runs, cv) {`:

```js
  /** a MATCH's course lands (THE FIRST GO → the seed + tick 0; in `play` the game's own): the kid stands on it, the engine waits for
   *  tick 0. A rejoin: this player's own log so far is replayed to now. A watcher (not a participant) has no run of their own. */
```
- `else if (isOver(run)) { mode = 'over'; overAt = -1e9; callDone = true; }` — // (a rejoin after their own end: straight to watching)
- `if (bot && !queue.length) { const b = bot(run, course); if (b) queue.push(b); }` — // (the TEST bots: asked once a TICK — a stalled phone catching up makes the same moves; JT2, the match flake)
- `setTimeout(() => { if (lanesEl) lanesEl.classList.remove('is-flash'); }, 720);` — // (the flash, then the counter's own small pop a lane again)
- `if (own && !record && isRecord(lines.best, run.best)) { record = true; lanesEl.classList.add('is-rec` — // (a rejoin, an answer that came late: no burst)
- `const countQuietLate = () => lazyImport(import('../../errlog.js'), '../../errlog.js').then(m => { if` — // (THE STALE-MODULE RULE: an existing export, lazily)
- `const matchLeft = () => !D && !!matchId && (!st.game || st.game.matchId !== matchId || (st.game.phas` — // (past 'play' — the count's last 2 s still take a chunk)
- `if (W) W.close();` — // (the run before: what it logged leaves now; its late answers touch nothing)
- `keepOwnSplits(matchId, run.sp);` — // (J1 — YOUR SPLITS: the end card's boxes from this phone's own engine, at once)
- `awakeAt = 0; awake(false);` — // (THE SOUND SYNC: the hold ends with the run — the hit's own sound plays out, then the context naps again)
- `if (waitTap) { if (countKey) { countKey = ''; countEl.textContent = ''; rosterEl.classList.remove('i` — // (JT2: TAP TO START says it all — no GET READY under it)
- `const ship = run.st === 'taken';` — // (H6A — THE MOTHERSHIP = A FINISH LINE: its gold card, once the arrival has been seen)
- `if (night && root && (todDirty || now - todAt > 1000)) {` — // (VARIETY A — THE TIME OF DAY: once a second, at once on a setting change)
- `if (waitTap && D) { if (now - veilAt < 500) return; veilAt = now; }` — // (JT2 — the daily's veil: the blurred course is a near-still, never a blur re-run every frame)
- `else if (sndOn && now - awakeAt > 1000) { awakeAt = now; awake(true); }` — // (THE SOUND SYNC: the lease, renewed while the run is live)
- `const held = performance.now() - overAt > hold();` — // (the hit is seen first — the kid stays his own colour through it)
- `if (mom && runs && course !== START && c && c.t >= 0 && !root.classList.contains('is-over')) {` — // (never behind the podium: no moment's sound over it)
- `if (!final && !localEnd) { tiers.sample(now, performance.now() - t0); if (!pinned) tiers.tick(now); ` — // (only while the scene is DRAWN: behind an end screen it rests — 8 easy seconds there stepped the tier up for the next run)
- `if (shownBest > 0) { popN ^= 1; lanesEl.classList.remove('is-pop', 'is-pop2'); lanesEl.classList.add` — // (two names, one animation: it restarts with no layout read in the frame)
- `if (arriveEl && arriveEl.on() && !arriveNow()) arriveEl.hide();` — // (the Mothership's warning / the run's end takes the top: the banner goes at once — never stacked)
- `{ const RH = globalThis.__nsRunHold; if (RH && (RH.on || RH.wait) && !holdsRun()) pingRouter(); }` — // (THE CONSOLE FIX: the run is over + written — follow the room)
- `if (!g || g.phase !== 'final' || final || runLive()) return;` — // (THE CONSOLE FIX: a live proven run of this phone's own is played out first)
- `{ const RH = globalThis.__nsRunHold; if (RH && RH.on) return; }` — // (… the room moved on: no podium for a match it left — the phone follows it)
- `else if (!final && !localEnd && performance.now() - overAt > 6000) showLocalEnd(true);` — // (the end has not reached the room — no signal: never a frozen screen)
- `root.classList.add('is-over'); root.append(finalWrap); night.rest(true);` — // (H6B: the scene rests behind the end screen)
- before `function showLocalEnd(waiting) {`:

```js
  /** a SOLO run's own end: UNPROVEN (no proof → the match can't reach the console's podium) — or proven but the signal is gone (`waiting`:
   *  the run is in the phone's queue and counts when it lands; the podium takes this screen's place by itself) */
```
- `{ const SC = splitsCard(run.sp); if (SC.el) body.append(SC.el); }` — // (J1 — YOUR SPLITS: every run's end card — the phone's own engine; no server answer here)
- `if (waitTap && n && n.go > 0) { waitTap = false; hideStart(); }` — // (a refresh / a rejoin mid-run: back on its run at once — never a second start)
- `else if (!(performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000)) showStart();` — // (JT2: PLAY AGAIN / TRY AGAIN — that tap was the start)
- `bot(on, o) { if (!on) { bot = null; return; } lazyImport(import('./bot.js'), './bot.js').then(B => {` — // (JT2: `steady` — THE STEADY BOT, the E2E's players who must stay in)
- `update(state) { st = state; if (matchLeft()) lateProof('seen');` — // (CITY I: from the moment this phone sees the match end, a chunk / e still in flight is an expected refusal)
- `if (offGL) offGL();` — // (BEFORE THE FLIP: off BEFORE any destroy() — a deliberate teardown is never a lost context)
- `awake(false);` — // (THE SOUND SYNC: a hold never outlives the view)
- `if (mode === 'run' && run && !isOver(run)) flush(true);` — // (a QUIT mid-run: what was hopped is in the proof)
- `if (W) W.close();` — // (… what is logged leaves now, in order; nothing is tried again once the view is gone)
- `if (performance.now() - (globalThis.__nsAgainAt || -1e9) < 3000) park(play, night); else { night.des` — // (leaving: the run's picture + ≈ 15 MB of decoded sounds are let go)
