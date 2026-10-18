# NEON PAR (mini golf)

Deep-dive for NEON PAR: physics, ghosts, rules, power-ups, sabotage, renderer, hole format, adding a hole.

## NEON PAR (mini golf)
**Everyone plays the same hole at once; nothing waits on the network.** Each phone simulates its own ball with
`physics.js` (pure, deterministic, fixed 1/120 s steps) on the **hole clock** = `(serverNow − game.playStartAt) / 1000`,
so moving obstacles (functions of that clock) are identical everywhere. A putt writes the shot (`sh`: rounded start,
angle, power, hole time, power-up) and the stroke count, then ~10 ball samples/s while it rolls.
- **Ghosts** (`view.js#ghostReplay`): other balls are replayed locally from their `sh` with the same physics — smooth at
  this phone's frame rate however choppy the owner's phone or network — and corrected by the owner's samples (a small
  error is blended out, > 2.5 units adopts their state). Without `sh` they fall back to Hermite interpolation of the
  samples. Ghosts never collide with your ball; they're translucent with a name tag.
- **Refresh / rejoin mid-roll:** the node's `sh` is re-simulated from its start time up to now, so the ball ends exactly
  where it would have (E2E-checked to 1e-3). Resting balls restore `x,y` (+ `ri/rt` if riding a platform), strokes, held
  power-up, pickups taken and the sabotage sent.
- **Rules:** max 6 strokes, else 7. Out of bounds (no floor under the ball) = +1 and back to where you putted from (or the
  last solid rest spot if that was a blinking tile / platform). A ball resting on a tile that vanishes respawns free.
  Director: once > half the participants are in, the rest get 30 s (`cdEndsAt`); offline players never block; when
  everyone's in, `wrapAt` gives 2.4 s (6 s if someone aced) before the scorecard. Unfinished = 7. A hole hard-caps at 4 min.
- **Power-ups** (`hole.powerups`, cyber + arcade holes; the host can turn them off): roll over one to take it (one held at
  a time, per player), tap the HUD slot to arm it for the next shot. GHOST = walls are skipped (gaps/edges still count),
  STICKY = the first wall contact stops the ball dead, MAGNET = the cup pulls within 5 units and captures faster balls.
- **Sabotage** (`logic.js#sabotageEarned`): birdie-or-better or the best score on the previous hole earns one use on the
  next hole. Pick a target + FOG / WOBBLE (aim drifts ±3°) / SHAKE (camera). Active until the target's next shot (started
  after it arrived) ends, max 8 s (`sabotageActive`). FOG is a vignette around the target's ball with a CUP pin above it:
  nothing ever hides the cup or makes a shot impossible.
- **Camera / input:** follow cam (frames ball + cup when resting); slingshot = touch within ~74 px of the ball and drag
  back (dotted aim line on the ground, power ring; back inside 24 px cancels); one-finger pan / pinch / wheel zoom on empty
  space, snapping back when you aim. Intro per hole (local, skippable, once per hole per session): zone title card (new
  zone) → 2.6 s flyover with the par card. ACE = slow-motion replay of the real shot on every phone (~4 s, SKIP).
- **Renderer** (`scene.js`/`zones.js`): floors are height-following grids (slopes/ramps tilt for real), walls are two
  instanced meshes (body + neon cap), glow = emissive + additive sprites (no post-processing), blob shadows, a small PMREM
  env map for chrome/glass/wet. Everything per hole is tracked and disposed on hole change. Tiers high/mid/low (DPR 2/1.5/1,
  particles, rain, ghost trails) step down when the p75 frame time > 19.5 ms. Zone looks: ROOFTOPS (wet concrete with neon
  puddles, props, rain, beacons, city + traffic far below), CYBERSPACE (Tron grid void, data particles, monoliths),
  NEON ARCADE (chrome cabinet, backglass, chasing bulbs). Music: one track per zone (`musicFor(game)`), crossfaded.
  three.js comes from jsDelivr (pinned `three@0.160.0`, import map in `index.html`) and loads only with the golf view.
- **Ball looks** (`ball.js`): colour × finish (neon/chrome/glass) × trail (ribbon/sparks/pixels) in `localStorage['na:golfball']`,
  set from the lobby card's ball button or the in-game ball button; published in the node so ghosts look right.

**Hole format** (`js/games/golf/holes/NN-name.js`, plain data; units ≈ ball diameters, `R = 0.5`; x across, y away from the tee):
```js
export default {
  id: 'dogleg', name: 'DOGLEG', zone: 'rooftops' | 'cyber' | 'arcade', par: 3, tip: 'One line for the par card.',
  tee: [x, y], cup: [x, y],                       // cup radius CUP_R = 1.05
  floors: [{ poly: [[x,y]…], h: 0, surface: 'turf'|'wet'|'grid'|'glass'|'chrome' }],   // no floor = out of bounds
  walls: [{ pts: [[x,y]…], closed?: true, kind?: 'rail'|'rubber'|'laser'|'lip' }],    // 'lip' = low curb, cleared by a jump
  slopes: [slope(x0, y0, x1, y1, [dx, dy] downhill unit vector, g accel, h0, h1)],     // h0/h1 = visual heights
  boosts: [{ poly, dir: [dx, dy], power }],       bumpers: [{ c: [x, y], r, kick }],
  portals: [{ in: [x, y], out: [x, y], r, exitAngle? }],
  gaps: [{ poly, minSpeed }],                     // flies over if faster than minSpeed, else falls (out of bounds)
  movers: [ { type: 'laser'|'spinner', pivot, length, arms, speed, inner? },        // rotating bars (rad/s)
            { type: 'gate', a, b, move: [dx, dy], period },                          // sliding wall
            { type: 'tile', poly, h, period, on: 0.6, phase },                       // blinking floor
            { type: 'platform', poly, h, move: [dx, dy], period } ],                 // moving floor (balls ride it)
  powerups: [{ at: [x, y], kind: 'ghost'|'sticky'|'magnet' }],
};
```
**Adding a hole:** copy a similar file, edit it, add it to `HOLES` in `holes/index.js` (and to `MODES` if Quick 6/3 should
use it), then run `node scripts/validate-holes.mjs <n>`. It must print OK (best ≤ par); aim for an "aimed" ace chance well
under ~40 % and "random" < 2 %. Then `node --test tests/golf.test.mjs`, and play it once (`?emu`, two slots).

