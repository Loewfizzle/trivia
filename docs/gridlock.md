# GRIDLOCK (fleet battle)

Deep-dive for GRIDLOCK: volleys, private resolution, points, fleets, the cinematic, the scene, Part 2 hooks.

## GRIDLOCK (fleet battle)
A fleet battle on a holographic war table: hide your ships, call your shots, the last fleet standing wins. Two modes share one
director: CLASSIC (turns, one shot) and BATTLE ROYALE (everyone aims at once, all shots resolve together). Part 2 will add
SALVO (several shots per volley) and ARCADE (abilities).
- **A VOLLEY** is one set of shots resolved together. Classic: `turn` (cur fires, turnSec; offline cur skipped after 3 s; a slow
  cur gets a seeded random shot). Royale: `aim` (everyone alive locks `glshot/{m}/{rk}/{uid}` = { t, x }; x = the cell through
  `core/obfuscate` with `shotKey(code, m, rk, uid)`, so the HUD can warn WHO locked on without WHERE). Ends when every alive online
  player has locked or at the timer; nobody who didn't lock fires.
- **Resolution is private.** `resolve`: `game.fire` names each shot; the TARGET's own client runs `logic.js#resolveVolley(fleet,
  board, shots)` against its fleet and writes `glres/{m}/{rk}/{target}` — hits/misses/"already hit" per shooter, and only the
  geometry of ships SUNK this volley. The host (which may read every fleet) does the same after 4 s, or at once for an offline
  owner (`index.js#prepare`). The director folds results into the public `boards` (`applyResolution`), credits hits/sinks/
  eliminations, moves to `show`. 15 s cap: a missing resolution counts as misses.
- **Points** (`POINTS`): hit 10, sink 30, elimination 50; on the bounty holder hits and sinks ×1.5. The bounty = the alive
  player strictly ahead on points. Eliminations in one volley place weaker-first (fewer points). Safety cap: Royale 25 rounds /
  Classic size²·players volleys → most cells afloat wins, points break ties (`capped`).
- **Fleets:** `fleets/{code}/{m}/{uid}` (see Data model). READY writes the fleet + `glready`; placement ends early when all are
  ready. A phone that never placed gets a seeded layout from the host at the first non-place tick (`loadFleets`). The owner's
  client loads its fleet on mount → a refresh restores ships / placement. Fleets are wiped at match start and with the room.
- **Cinematic** (`view.js#buildTimeline`): from `ev`, per target: camera to the board, one beam per shot (350 ms apart, 0.75 s
  flight), impact (hit flash + shockwave + fractured mark, or a ripple), then each sink (wreck glows, shatters into shards that
  fall through the table), then the power-down, then a summary line. Items run against `phaseStartAt` on the server clock; a
  phone joining > 1.8 s late applies marks silently. Music ducks + low-passes for the volley (`duckMusic`, `filterMusic`).
  Marks of the current volley stay hidden (`pending`) until their impact.
- **Scene** (`scene.js`): boards on a ring (yours at the front), each one draw call of board shader + instanced hit/miss marks +
  ship meshes (own board) + a label texture; camera focuses a board (fit by the screen's aspect; portrait looks a little past
  the board so it sits lower) or the overview; `pick(x, y)` raycasts to a cell. Tiers 2/1/0 (DPR 2/1.5/1, ambient points,
  trail length, shard count, sweep) step down at p75 > 19.5 ms. Reduced effects: no shake, no points.
- **Music:** `PLAYLISTS.gridlock` = spy1-3 + last-signal; the view calls `setPlaylist('gridlock', musicOrder(code))` (seeded by the
  room code so every phone shares the order; the position continues across matches on a phone). Victory on the podium.
- **Chat lock:** while placing (until READY), on your Classic turn, while aiming (until locked in).
- **Part 2 hooks:** `shotsPerVolley(game, uid)` (Salvo: raise it; `fire[uid]` is already a list and `glres.r[shooter]` an array),
  `resolveVolley` takes lists, `ev` is an open event list the cinematic plays (new kinds: add a case in `buildTimeline`), and
  abilities would be one more player node + an `ev` kind; rules per node.
- Test hooks: `window.__gridlock` (fleet, place, setReady, autoPlace, rotate, aim, fire, bot({delay, seed, force}), forceNext,
  locks, announcements, sfxLog, timeline, camera, pick, tier/fps/work/stats).

