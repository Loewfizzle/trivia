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
- **Cinematic** (`view.js#buildTimeline`): from `ev`, per target: that board comes up, one beam per shot (330 ms apart, 0.75 s
  flight, from the shooter's mini-board), impact (flash + shockwave + sparks + a scar burnt into the cell, or a ripple), then
  each sink (the hull burns white, shatters into shards, the wreck stays), then the power-down (flicker, tear, dark), then a
  summary line. Items run against `phaseStartAt` on the server clock; a phone joining > 1.8 s late applies marks silently.
  Music ducks + low-passes for the volley (`duckMusic`, `filterMusic`). Marks and wrecks of the current volley stay hidden
  (`pending` / `pendingSunk`) until their beat.
- **Scene** (`scene.js`, Canvas 2D — rebuilt flat in Oct 2026 after the three.js ring failed the phone play-test): ONE board at
  a time, straight on, fitted to the CSS-positioned `.gl-stage` box (the view hands the rect over on resize; never read in the
  frame loop). The coordinates are printed inside the board's frame, centred on their column/row, so a cell is exactly where
  the labels say (`cellXY(uid, r, c)` ⇄ `pick(x, y)`; the E2E asserts they agree). Every other fleet is a mini-board canvas
  the HUD mounts in a `.gl-mini` button (`miniCanvas(uid)`). **Layout** (css/gridlock.css): phones = header → mini strip → the
  board edge to edge (4 px margins, the label band 6 % of the board) → action bar; desktop (≥ 1000×600) = a left column (header,
  announcements, action, tray) · the board on the whole height · the fleets in a right column; landscape phones = action left,
  board, fleets right. The stage box is measured with offsets, never bounding rects (the screen slides in with a transform).
  Layers: the base (panel, rim light, grid, labels) and the marks (scar / ring sprites) are offscreen canvases rebuilt
  only when they change; a frame = 2 drawImage + hulls + effects. Hulls are light-forms (dark glass, colour rim, white spine);
  wrecks are dark hulls with ember cracks under the scars. Tiers 2/1/0 (DPR 2/1.5/1, shards, sparks, trail, the sweep) step
  down at p75 > 19.5 ms; reduced motion: no shake, no glitch, no sweep, fewer shards. Look preview without Firebase:
  `tests/integration/gridlock-preview.html` mounts the REAL view (import map → `fake-firebase.js`) and scripts a match:
  `?at=place|aim|reticle|locked|show|sunk|elim|spec|end&n=2..8&still=1`.
- **Music:** `PLAYLISTS.gridlock` = spy1-3 + last-signal; the view calls `setPlaylist('gridlock', musicOrder(code))` (seeded by the
  room code so every phone shares the order; the position continues across matches on a phone). Victory on the podium.
- **SFX** (`audio.js`): synthesized in layers like a sound designer would mix a sample — a sub body that drops in pitch, a
  swept noise burst, FM "metal" partials, a comb ring — through a short room or a long plate reverb and a soft compressor on
  the game's own bus, with a little random detune/pan per hit. Measure them without speakers: `tests/integration/sfx-probe.html`
  (`?game=gridlock`; renders each effect in an OfflineAudioContext via `fake-engine.js` and prints peak / RMS / length).
- **After you fire** the board you aimed at stays up until the impact lands (no flip home and back); while someone else aims,
  your own board is up.
- **Chat lock:** while placing (until READY), on your Classic turn, while aiming (until locked in).
- **Part 2 hooks:** `shotsPerVolley(game, uid)` (Salvo: raise it; `fire[uid]` is already a list and `glres.r[shooter]` an array),
  `resolveVolley` takes lists, `ev` is an open event list the cinematic plays (new kinds: add a case in `buildTimeline`), and
  abilities would be one more player node + an `ev` kind; rules per node.
- Test hooks: `window.__gridlock` (fleet, place, setReady, autoPlace, rotate, aim, fire, bot({delay, seed, force}), forceNext,
  locks, announcements, sfxLog, timeline, camera ({focus, box, settled}), cellXY, geometry, pick, focus, tier/fps/work/stats).

