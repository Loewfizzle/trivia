# JAYWALK J4 — WINTER: SNOW · CHRISTMAS · WET NEON STREETS (Nov 21 2026)

The owner's decisions: `docs/games/plan.md` "JAYWALK J4". What it is + every number: `docs/jaywalk.md` "J4 — WINTER". A VIEW only — **no rules
change**, REPLAY = LIVE untouched, the v1 / v2 frozen copies unchanged.

## THE INBOX
Read at the start, after each group, before the final run: no OPEN entry addressed to J4 / JAYWALK's next pass.

## WHAT WAS BUILT
- **Step 0** — the owner's decisions appended to `docs/games/plan.md` (ba5aebef).
- **THE SEASON CLOCK** — `js/games/jaywalk/season.js` (PURE) + `tests/jaywalk-season.test.mjs` (the owner's six days, the leap year, the
  monotone build + melt, the snowfall share 50 % ± 10 over four seasons, Dec 24 + 25 always, the 4 am day line, the lab's switches).
  The call: snow days = exactly 2 in every block of 4 (which 2 hashed from the block) — an i.i.d. 50 % coin measured 61 % one season.
- **THE SEASONAL PACK** — `scripts/build-jaywalk-assets.py --only=winter` → `assets/jaywalk/winter/` (snow-pine 9,352 B · xmas-tree 33,220 B ·
  snowman 11,852 B = **54,424 B / 53.1 KB**, the cap 150 KB; Grok's seven files were 158 KB self-contained). The accessor learnt the quantized
  sources' normalized ints (only the winter step asks — the older steps' outputs byte-identical).
- **THE TREE PICK — Kenney's DECORATED tree** (+ the code lights + two presents baked at its foot, one mesh). A/B at 390 by night + day: the plain
  tree + code lights read bare by day (the lights are small crisp points there); the decorated one keeps garlands, baubles + its star in sunlight
  and blooms with the code lights by night.
- **THE LOOK** — the snowy ground (`snowOn`), the plowed roads + slush, the snow on the tops (`snowPatch`), the swaps (pine · Christmas tree ·
  snowman), THE TREE LIGHTS on the glow billboards, THE FALLING SNOW (one draw), WET NEON STREETS (`wetRoad`, ships OFF).
- **THE GAME** — `view.js`: the run's own day (solo / the daily = the GO's, a match = `playAt`), the pack fetched at the mount, a lost context
  takes its season back; a test-only `&jwday=` (localhost + `?emu`, kept through `identity.js` like `jwcv`).
- **THE LAB** — `&date=` · `&snow=` · `&wet=` (+ the seed line names the season).
- **THE CHECKS** — `tests/jaywalk-winter.test.mjs` (THE GAMEPLAY LOCK: the import graph + the replay on three seasons' days, solo / daily / match,
  v1 + v2; the swaps in place; the pack's cap + never in the preload graph; WET off; the run's day) · `jaywalk-lab.mjs --j4[=peek|strip|snow|wet|props]`
  + `--j4perf` · `e2e-jaywalk` / `e2e-jaywalk-match` with `JW_DAY` (a winter check each). Three older tests followed the new source lines (the
  credits' model count 3 → 4, the snow-capable lambert, the ground's uniforms).

## THE FRESH-EYES REVIEW (a fresh agent on the diff — no GLSL problems found; the gameplay lock, WET_LIVE, the run's day all held)
- HIGH — the snow on the tops ignored the per-instance darkening (bright tops inside the blackout / on the dim edge columns) → FIXED: the snow ×
  the instance colour's brightness (`jwSnowK`); the posts (dark colours) take no snow.
- HIGH — on Dec 24–25 the tree lights (23 billboards a tree) could fill the glow billboards and drop the lanes AHEAD's gameplay lights (the train's
  blink, headlights) → FIXED: the trees are noted in the loop, their lights put LAST in whatever room is left; `--j4perf` asserts the billboards
  never fill over a whole runway lap.
- MEDIUM — the pack's kinds were added visible (count 0) — three builds their programs / buffers at the next frame, possibly mid-run → FIXED: built
  hidden, shown + warmed at the quiet frame.
- MEDIUM — a lost context's rebuild could turn winter ON mid-run (a run that started in the normal look) → FIXED: the run keeps the season it
  APPLIED (`seasonRun = night.setSeason(…)`); the rebuild re-applies exactly that.
- MEDIUM — the clear zone ahead of the kid was a small ellipse at 12 % → FIXED: a band over the next lanes across the WHOLE width, 6 %.
- LOW — the billboards' cap 600 → 900 uploaded the whole buffer year-round → FIXED: only the instances in use go up (three's kept range record,
  HIGH RISE's S4A pattern — every kind gains it). `SNOW` (module-level) is now written every frame (another scene's teardown can't zero it). The
  rebuild fetches the pack for the next run. The E2E winter checks read the APPLIED season. NOT measured (named): a big moment's frame in winter.

## DROPPED TO STAY UNDER 64
**The candy cane** (the first in the owner's drop order): DOWNTOWN's Christmas Eve night runway, 8 kids, heavy snow, wet on — **65** calls with the
cane swap (cones + canes both in view, each + its bloom occluder), **63** without. Removed from the pack, the code, the credits.

## MEASURED (the Beelink, tier 2 pinned, 8 kids, the runway's worst frame over a lap; then 10 s at 4× CPU — `jaywalk-lab.mjs --j4perf`)
| where | look | 390 calls / fps | 430 calls / fps |
| --- | --- | --- | --- |
| DOWNTOWN (runway 290 × 3) | night | 59–63 / 59.9–60 | 63 / 60.0 |
| DOWNTOWN | day | 35 / 60.0 | 35 / 60.0 |
| THE AIRFIELD (runway 405 × 4) | night | 49 / 59.8 | 49 / 60.0 |
| THE AIRFIELD | day | 28 / 60.0 | 28 / 58.4 (one 250 ms stall — the Beelink's headless-Chromium quirk) |
All on Dec 24 (winter 1, Christmas 1), HEAVY snow, WET NEON STREETS on. The pack is outside JAYWALK's line: the city + JAYWALK = **2,583 KB** of
2,600 (the new view code ≈ 27 KB — the line is close again).

## SHOTS — `Downloads\NEON\jaywalk-j4\`
`season-strip-night.png` · `season-strip-day.png` (+ `-430`) — Nov 30 · Dec 1 · Dec 12 · Dec 24 · Jan 15 · Feb 25 · `snow-heavy-vs-none.png` (the
same frozen frame: none · light · heavy, night + day) · `wet-streets.png` (night: off · on, normal + winter) · `props-closeup.png` (ZOOM 7: the pine +
the snowman, the Christmas tree + its lights, night + day, 390 + 430) · `peek-*.png` (Christmas Eve heavy snow; the wall catching up over the snow).

## THE FINAL RUN (local, the Beelink — my own emulators + `DAILY_TEST=1 serve.mjs --emu`)
- unit `node --test tests/*.test.mjs` **2,515 / 2,515** (+ `jaywalk-season` 5 · `jaywalk-winter` 5; the v1 / v2 frozen copies unchanged)
- v2 (`JW_CV=0` against a `JW_CV_SWITCH_MS=0` server): `e2e-jaywalk` FAST **102 / 102** · with `JW_DAY=2026-12-24` **103 / 103** (the pack in,
  winter 1) · `e2e-jaywalk-match` FAST **103 / 103** · with `JW_DAY=2026-12-24` **104 / 104** (one winter for the room) · `e2e-jaywalk-daily-run`
  (`JW_DAY`) **67 / 67**
- v1: `e2e-jaywalk-daily-run` **67 / 67** · after the review's fixes: `e2e-jaywalk` `JW_DAY=2026-12-24` **103 / 103** · `e2e-jaywalk-match`
  `JW_DAY=2027-01-15` 103 / 104 once (STACKED TAGS MERGE "none seen" — the ghost-tag timing check), then **102 / 102** with it + **103 / 103** without
  (a flake — green on both re-runs, not the season)
- smoke **24 / 24** · rules `rules.test.mjs` **100 / 100** · `/api` `server.test.mjs` **72 / 72** · `jaywalk-lab --perf` **132 / 132** (the first run
  130 / 132: the 8-KIDS rows sampled while I was editing the files under it — on the final code `--kidsperf` 60 fps at both tiers, the same 63 calls
  + triangles as the pre-pass code on a worktree: the non-winter path costs nothing) · `--j4perf` **24 / 24** · `--j4` looks all green
- THE BUDGETS: the city + JAYWALK **2,585 KB** of 2,600 · the boot unchanged but `identity.js`'s one kept param (`jwday`, test-only) · the card lab:
  `lab-export` read — no open FIX mark. No rules change.

## OPEN FOR BEN
1. RE-PUBLISH: nothing (no rules change). J2's `database.rules.nov21-j2.json` is still yours before Nov 27.
2. WET NEON STREETS: built, measured, OFF in the game — look at the lab links; a one-line add-on (`season.js#WET_LIVE = true`) turns it on.
3. Calls named (overrule any): the DECORATED tree (+ code lights) over the plain one · the candy cane dropped (the draw-call order) · no snow on car
   roofs (from above a white roof hides the car's colour) · snow days = 2 in every 4 · Dec 24 heavy / Dec 25 light · the melt week light snow only ·
   a run whose pack isn't in by GO plays the normal look (a slow phone's first winter run) · winter appears on the share card (it is the run's frame).
4. JAYWALK's line is close again: 2,585 of 2,600 KB (the winter code ≈ 27 KB of view code; the models are outside it).
5. Not measured: a big moment's frame (the Blackbird / the Mothership) in winter at 8 kids; WebKit's paint (software GL on the Beelink).
