# JAYWALK JT1 — SEASONS: ROOM FIRST · AUTUMN · SANTA HAT · FOOTPRINTS · NEW YEAR'S (Nov 22 2026)

The owner's prompt (Nov 22); his decisions: `docs/games/plan.md` "JAYWALK JT1"; the design in full: `docs/jaywalk.md` "JT1 — SEASONS".
A VIEW only — no rules change, nothing the server replays touched (THE GAMEPLAY LOCK, `tests/jaywalk-jt1.test.mjs`). The inbox: no open
entry for JAYWALK at the start, after each group, before the final run. THE CARD LAB: `lab-export` read — no open FIX mark.

## GROUP 1 — ROOM FIRST
- J4's winter code left the start bundle for THE SEASONAL PACK: `seasonal.js` (the scene's season — J4's swaps, tree lights, snowfall, the
  lights list + JT1's layers), `seasonal-fx.js` (J4's snow / plowed roads / WET NEON STREETS GLSL VERBATIM + JT1's), `season.js`, the winter
  loader (from models.js); `fireworks.js` behind them. The start bundle keeps `season-gate.js` (Oct 20 → Mar 1) + the hooks + the ground's stubs.
- **THE LINE: the game alone 529.3 → 515.0 KB; the city + JAYWALK 2,599 → 2,584 KB** (`tests/game-budget.test.mjs`, 44 modules — season.js
  out, season-gate.js in). 14.3 KB freed = all of J4's season-only code; the target (≥ 25 KB) is NOT reached — J4's "≈ 27 KB" was its whole diff,
  the rest is the irreducible hooks + J4's general fixes. Going further = trimming other modules' notes (OPEN FOR BEN).
- THE PACK: code ≈ 57 KB + J4's models 53 KB ≈ 110 KB of 150 (the unit test). Fetched only on a season day / the lab's forced date.
- IDENTICAL WINTER: `jaywalk-lab.mjs --jt1=ab` (Dec 24 heavy snow, 390, reduced motion, `&hat=0`, the code before on a worktree :5174):
  day **0.000 %** of the pixels differ, night **0.833 % = the noise floor** (before vs before). Shots: `Downloads\NEON\jaywalk-jt1\ab\`.
- Found + fixed on the way: the pack's quiet-frame gate never opened in the lab (it restarts + warps in one step) → a run's START is itself the
  quiet moment (`apply` brings the pieces in).

## GROUP 2 — AUTUMN · GROUP 3 — THE HATS · GROUP 4 — FOOTPRINTS · GROUP 5 — NEW YEAR'S
As built: `docs/jaywalk.md` "JT1 — SEASONS". The calls made (overrule any):
1. THE FALLEN LEAVES are painted in the ground's own shader — ZERO draws (the prompt allowed one instanced draw); the drifting leaves = THE FALL's
   leaf mode (J4's snow mesh, its one draw).
2. THE FOOTPRINTS ride the blob shadows' kind (`K.shadow.raw`) — ZERO new draws (the prompt asked for one decal draw).
3. THE HATS are merged into the kid's own geometry, skinned by his head bone — ZERO new draws, every pose, yours + the rivals'.
4. THE LEAF PILES: on the opening's grass, DOWNTOWN's sidewalks, the canal + the dunes (the areas' "grass"); ≤ 1 per 3 lanes; a rival landing in
   one bursts it too (no sound — your own kid's crunch only).
5. THE FIREWORKS: their own 2D canvas inside the skyline's picture layer; none with reduce motion; after local midnight on the game day Dec 31
   (until the 4 am turn) the regular bursts go on; Jan 1: by night only.
6. The approved mockups (jw-autumn.png · jw-santa-hat.png · jw-footprints.png) were not on this machine — built to the written decisions.

## MEASURED (the Beelink — `jaywalk-lab.mjs --jt1perf`: DOWNTOWN's runway, 8 kids, NIGHT, tier 2, the worst frame over a lap + 4× CPU)
| scene | 390 calls · fps | 430 calls · fps |
| --- | --- | --- |
| Nov 25 (autumn) | **64** · 59.9 | **64** · 60 |
| Dec 10 (Santa + prints + light snow) | 63 · 60 | 63 · 60 |
| Dec 24 heavy snow | 63 · 60 | 63 · 59.8 |
| Dec 31 23:59 (the finale) | 63 · 60 | 63 · 58.5 (one 250 ms frame once) |

## THE SHOTS — `Downloads\NEON\jaywalk-jt1\`
`ab\` (Dec 24 before / after) · `autumn\` (Nov 25 night + day, 390 + 430, a pile → its burst → scattered) · `santa\` (close-ups, full frames,
8 kids) · `prints\` · `fireworks\` (Dec 31 23:59 night + day) · `party\` (Jan 1).

## THE FINAL RUN
(see the commit message of the tagged push)

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change).
2. ROOM FIRST freed 14.3 KB, not ≥ 25 (all of the winter code moved; the rest is the hooks). More room = moving other modules' long notes into
   docs (THE BOOT HEADERS' pattern) — your call. The game's line itself has room (515 / 610 KB since THE FIX PASS).
3. Nov 25's busy runway sits exactly ON the 64-call limit (the pile kind + the drifting leaves); one more autumn layer needs a call dropped.
4. The calls above (zero-draw leaves / prints / hats, the pile areas, the fireworks' after-midnight + reduce-motion rules).
