# Cleanup pass 1 (after Parts 1–4) (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Cleanup pass 1 (after Parts 1–4) (Oct 21 2026)
A fix-and-tighten pass, no new features: clean measurements, battery + heat care, the owner's Part 4 review (the signs' balance,
the NEON logo's catch + the buzz), a code review of Parts 1–4, the docs. The default-city title suite ran in full.

### The clean numbers (A-B-B-A against 9d3fd7e, the commit before Part 4)
Measured on a quiet machine (4 % CPU, on power), one after the other: previous, this pass, this pass, previous — `title-perf.mjs --city 2`
(390×844, DPR 3 capped to the tier, 4× CPU, mean ms of scene work, each number the mean of its two runs; frames 16.7 ms everywhere;
the worst case re-measured A-B-B-A once more after the spelled word became a sprite):

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| day (`np-day`) | 3.1 → 4.4 | 3.0 → 3.5 | 2.9 → 2.4 |
| night (`np-night`) | 4.8 → 5.7 | 4.6 → 4.7 | 3.5 → 3.1 |
| golden hour (`np-golden`) | 4.9 → 6.7 | 4.5 → 4.7 | 3.4 → 3.7 |
| party (`np-party`) | 6.0 → 6.7 | 5.1 → 5.3 | 3.2 → 3.6 |
| the worst case (`neon`: the party moment + searchlights + a word) | 6.0 → 6.9 | 5.8 → 5.5 | 4.1 → **3.9** |

Every scene is within 8 / 6 / 4 at every tier. The "previous" column is the commit BEFORE Part 4 (no live water): the tier-2 rise is
Part 4's water (+0.9–1.8 here; Part 4 measured +1.1 on one page), tier 1 and 0 are level or lower. Tier 0's worst case, 0.5 ms over
in Part 4's run, is under budget now: the spelled word's letters were drawn window by window every frame (`lights.js#drawSpell`,
~0.3 ms at tier 0) and are one sprite redrawn only when their state changes. The E2E's party peak at 4× CPU: t2 6.8 · t1 6.3 · t0
4.2 (its own page, a Saturday peak with the planes). Memory unchanged: 25.4 MB of 64 at 390×844 tier 2 (+ the neon 2.3). Note the
drift between sessions: the same previous commit measured 4.7 / 5.6 / 5.9 (night / party / worst, tier 2) in Part 4's run and 4.8 /
6.0 / 6.0 here — only same-run comparisons count. Frames drawn per minute (the calm rate below): a calm night 1800 where it was 3600.

### Battery + heat
- **Hidden = stopped.** The scene's rAF stops on `visibilitychange` (it did since Part 1) and nothing else of the Harbor ticks: it has no
  intervals; the look, the scheduler, the water, the bakes all live inside the frame. Cleanup pass 1 added the TITLE's loops to that:
  `trackLogo` (the sign's rects every 500 ms), `watchSky` (every 1 s) idle while the page is hidden and re-arm at once on
  `visibilitychange` (`title.js#onVisTitle`, also `neonTick`). The live weather's poll was already gated on visible. On resume the
  clock just reads the real time: the scheduler decides the missed slots, the neon plan is replayed from the plan, dt is clamped.
- **THE CALM FRAME RATE** (`scene.js#frame` / `fastNow`): when nothing fast is on screen the city draws every other rAF (30 fps; every
  third under reduced motion, 20). Anything fast brings 60 back at once, checked every rAF from the last draw's flags: a plane, the
  train, a satellite (`aircraft.busy()`), birds on the wing (`wildlife.busy()`), the party, fireworks, rain / snow / a storm, a
  lightning flash, the neon booting or going dark (`neon.busy(t)`: an item's sputter within 2.5 s; a moment: party / flash / chase;
  sprites still building), the searchlights, a bake or a crossfade in progress, the power-on wave, a tap (`hit()` → 1.5 s), a knock,
  any scheduled event but `spell`, the first second after the city shows, `&speed`, and `wake(ms)` (the hook for later parts: a
  boat casting off, a bird landing on the sign — call it when you start something fast). The rare neon flicker is a dip, not motion.
  The rAF keeps running (it is what notices the change) and `perf()` keeps watching ITS intervals, so the auto-tiering is unchanged.
  The water keeps its own rates on the clock now (the mirror re-read 10 a second, composed 30 / 20 a second at tier 2 / 1) — at
  30 fps it composes every drawn frame, so the ripples look the same. `harbor().rate` = `{ drawn, fast, running }` ('' = calm).
- Measured (the E2E, a calm night at 4× CPU): **30 frames drawn a second** where every rAF drew before (60); the party peak, a
  plane, the boot: 60. The look is unchanged (the shots before / after are the same frames). The E2E checks the calm rate, that a
  hidden page draws nothing and that it resumes at 60 for a moment.
- **`hold(ms)`:** the title's own heavy moment — the catch animates the sign's filtered SVG every frame for 1.5 s — must not make the
  city step a tier (a re-layout + rebake at the most-watched second of the evening): `applyNeon` calls `scene.hold(3000)` at the
  catch; `perf()` ignores that window (and the sort it did every frame now runs every 30).

### The NEON logo's catch + THE BUZZ (the owner's review)
- **The catch, frame by frame:** a scratch screencast of both cities at 6× CPU showed no dark frame in either city; what it showed
  was the cost: City 2.0's sign took a 50–70 ms long task EVERY frame for the 2 s of the catch's glow animation (City 1.0: four
  in all) — and both cities stepped a tier down right at the catch. The premium logo's hot spots + dim electrodes each carried a
  `feGaussianBlur` filter (~24 filter surfaces per repaint). They are now soft dots from two `radialGradient`s (`logo.js#premiumBits`,
  no filter; the same look) — the recast shows **zero long tasks** and the tier held. Every TIME is untouched (the plan, the stagger,
  the morning fade); only the paint got cheap, so the catch flows like City 1.0's (the glow's 0.9 s rise + the 0.25 s bloom are
  the same CSS). Also found: by day the premium glints rendered as dark specks (`title.css` filled every `circle` under `.is-day` —
  now only the electrode caps, `.ndl > circle:not(.ndl-glint)`).
- **THE BUZZ** (`audio/ambience.js#neonBuzz`, City 2.0 only, `title.js#applyNeon`): on every flicker of the dusk warm-up and the
  morning fade — a tube striking: a crisp tick (a bright click + a tiny zap chirping down) then the buzz while the gas holds (120 Hz
  and its harmonics through a bandpass, the electrode's rattle, its level unsteady) for as long as the plan holds this flash; a tube
  dropping out: a softer tick; two letters at once a touch louder. The catch keeps its hum + crackles (`neonPowerOn`). On the SFX
  bus like every title sound: it follows the Effects slider and Mute, never on the first paint, never under Reduced effects, and
  nothing relies on it. Quiet by design (peaks ~0.03): under the music.

### The signs' balance (the owner's review)
Measured on the reference phone: the sign band (y 488–545, below the word faces, above the quay) has ≈ 240 pt of wall once the
wheel (124–238), the sunburst + HOTEL (235–265), the lighthouse (330–353) and the word faces are out — and the 15 items need
≈ 262 pt (the billboard 66, 8 icons × 20, JAZZ 26, the STAKES-sized named sign, HOTEL). Roof signs on the right would cover the
word faces, the left roofs hold RUMRUNNER + the flag icon already, the construction tower (wordV) and the needle are off limits. So
the right side is now an even two-column rhythm instead of a stacked pair + a tight triangle: under wordA a column of two (12 pt
apart), the PAR hero carries its named sign + a column of two (`i-par`, `i-par2`), the small wall right of the lighthouse a diagonal
pair; every gap ≥ 8 pt, every icon still ≥ 19 pt at every phone (tested), nothing on a word face, the needle or wordV. **What it
cannot do is make the right as calm as the centre** — that needs one of: icons behind the wheel's spokes again (the checker allows
it; Part 4 cleared it), fewer icons (two more named roof signs along the near band instead), or a second billboard on the right
(two icons' worth of wall). The owner's call — asked in the hand-back.

### The code review of Parts 1–4 (fixed now)
- Leaks: a pending billboard's night sprite was never freed on a re-layout mid-build (`neon.js#freeItem`); the stars' sky canvas (~3
  MB) had no destroy (`stars.js`, called from the Harbor's `destroy`); the extras' 1.2 s timer is cleared on destroy.
- Work every frame: the searchlights' three roof spots were recomputed per frame (now per layout, a WeakMap); the frame sort of the
  tiering now runs every 30 frames; the scheduler's one-time replay (~1000 slots of dice + sun positions) no longer runs in the
  first frame — it waits for the first bake to land.
- Dead code removed: `signs.js` housing sprite + day sprite, `shapes.js#crown`, `blocks.js#bandSteps` (+ its clamp01 re-export),
  `tones.js#hazed`, `bake.js` `groups()` / `doneAt`, `neon.js#_reset`, `water.js#setTier`, `scene.js` litKey; `water.band` is now
  on `harbor().water` as this file said.
- Tests: the TAGLINE check waits for the real text rects and allows 1 pt (its real bug — a re-layout forgetting the faded tagline — is
  still caught: `cam.tagGone` + the lane's ≥ 8 pt move); + 3 battery checks. Docs: the claims above corrected (the sun's rays, tube-path's
  sharers, backdrop.js, the first bake's slice, the memory budget's scope, `light()` / `reflect()` sampled at the mirror's build rate).

### Known issues (cleanup pass 1)
- ~~**The signs' right side stays denser than the centre**~~ — Part 5: two named ROOF SIGNS on the word towers took i-c2 + i-par2
  off the wall (the owner's rule).
- **The catch's dark half-second on the owner's iPhone was not reproduced** in Chrome (frame by frame at 1× and 6× CPU, both
  cities: no blank frame). What was found and fixed is the one thing that differed from City 1.0 at that moment — a 3× costlier
  repaint per frame — plus the tier step at the catch (now held). If it still shows on the phone, the next suspect is WebKit
  promoting the glow paths to layers as their opacity transitions begin (`will-change: opacity` on `.ndl-glow1/2` of the premium
  logo during `.is-catch`), then the SVG's size (the whole sign repaints as one surface).
- `water.reflect()` / `water.light()` are read when the mirror is built (10 a second), not every frame — fine for still and slow
  things; Part 5's wakes / Part 10's bursts need the source rate raised or their own pass (now documented at the hooks).
- The E2E's PERF check asserts the absolute budget at 4× CPU; on a loaded machine it fails for the machine's sake — re-run before
  believing it (the clean numbers are this table's).
- Carried: a plane's contrail grows the frame cost (Part 6 caps it); 7 spots sideways; the far outlines cut by the far envelope; the
  moon's path follows the drawn moon (Part 6); ~~the pier is not reflected and the wheel's / lighthouse's reflections are grey-box~~
  (Part 5: the wheel + boats + beam reflect themselves, the lighthouse from its crafted bake, the pilings' streaks baked).

### Handoff → Part 5 (harbor hero pieces)
Everything in Part 4's handoff above still holds, plus: a moving piece must keep the city at 60 fps while it moves — Rosie, the taxi,
the tug and the wheel turning are continuous, so either return true from a `busy()` the scene asks (add it to `fastNow`) or call
`scene.wake(ms)` when a motion starts; the wheel turning all night means the calm rate only applies by day / when the wheel is
still — decide with the owner whether the wheel idles at 30 fps (slow, smooth enough) or forces 60. `water.reflect()` /
`water.light()` are read when the mirror is built (10 a second): a moving boat's reflection steps at that rate under the ripples
(fine for a slow boat; a fast wake needs the source rate raised). The sign walls are full; new hero pieces must not add signs.
