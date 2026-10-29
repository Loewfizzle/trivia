# Part 1.5 — foundation fixes (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Part 1.5 — foundation fixes (Oct 21 2026)
Plumbing only, no new visuals (the `&grid=1` lane rects aside); every Part 1 number and size kept. Review findings 2, 3, 6, 7, 8
fixed; 1, 4, 5 are Part 2's (below).
- [x] #2 the scheduler is state (`createScheduler`), replayed once from the local midnight a day back, advanced slot by slot.
- [x] #3 a re-layout keeps the stale layers drawn until the new bake swaps in; rebakes wait for the crossfade.
- [x] #6 lane rects in the layout (`L.lanes`, `laneRects`), tested; `fs.density` thins the planes, birds, swifts and cars.
- [x] #7 landmark tiers projected in the world (`skyBlock` takes `y0`).
- [x] #8 `city=2` stays in the URL through `setUrlRoom` (refresh, rejoin, back to the title).
- Tests: `tests/harbor.test.mjs` 27 (+ the scheduler's pop-in, span, anchor and density tests, the lanes at six sizes);
  `e2e-harbor.mjs` 20 checks (+ the lanes against the real sign, `setTier(1)` never blanks the stage, the URL keeps the flag).
- (Done in Part 2, below.) Part 2 started with findings **1** (choose the sun gaps against the whole silhouette: bands + landmarks +
  heroes + the panorama's mirrored landmarks, and test that), **4** (clip the blocks at a corridor, don't drop them; pad 2 pt) and
  **5** (a per-building window grid `win: { cols, rows, u0, v0, pitch }` and a lit pass outside the look-key bake; drop `h` from
  the glitter seed). Then `far.js / mid.js / blocks.js / landmarks.js / quay.js`; keep the squeeze and the camera; measure with
  `title-perf.mjs --city 2` before and after. Events that need a moment's sky (night, season) add it to the scene's `ctxAt` as a
  function of ms only (the replay asks about the past).
