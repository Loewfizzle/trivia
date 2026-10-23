# CITY 2.0 — REVIEW #2 (read-only, Oct 22 2026, after THE DAY PASS)

A fresh-eyes audit of everything built since Part 1 (Parts 2–6a, cleanup pass 1, the preview panel, Neon Passes 2–6, the Day
Pass), at commit `8c2eaa8` + the owner's plan.md. Nothing but this file was written. Method: six parallel read-only audits
(the bench + readout, the iPhone's slow frames, the O's core, code health, Safari / City 1.0 / the admin API, tests + docs), every
headline claim re-checked by hand, and the laptop bench run five times on the same code to measure its own noise. Sizes:
S < 30 min · M = an hour or two · L = half a day or more. Line numbers are from the tree at `8c2eaa8`.

## The verdict

City 2.0 is structurally healthy: the pure / screen split is real and tested (456 unit tests green in 28 s), the hooks the later
parts need exist with the documented signatures, the preview panel's server side is clean, and City 1.0 loads no Harbor code.
The fast passes left debt that is mechanical, not architectural: one real visible bug, a benchmark that has been crying wolf
for five passes, a party night whose cost is in GPU fill (not in the "work" number anyone has been reading), and a layer of
leftovers (three conflicting `&wheelbg` defaults, ~35 copies of the same math helpers, two files past 900 lines). **Fix first:
the O's missing white core** — it is not a paint glitch, it is one CSS rule plus one line of JS (§2), it hits most evening
visits on every phone, and it is a 15-minute fix. Then retire the 8 ms laptop gate (§1) so the next passes spend their perf
time on the phone, where the real cost is.

---

## 1. PERFORMANCE — what is really going on

### 1a. The laptop bench has been measuring the laptop (HIGH · S)

**What the bench measures** (`tests/integration/title-perf.mjs`, and the PERF group in `e2e-harbor.mjs:671–742`):
- "Scene work" = wall-clock time of `draw()` on the main thread (`scene.js:396–399`), **the last 90 drawn frames only**
  (≈ 1.5 s at 60 fps; `costs.length > 90 → shift`). The `--secs 6` is settle time, not sample time (`title-perf.mjs:78–86`).
- Headless Chrome, **no GPU** unless `--gpu` (`title-perf.mjs:63`): the 2D canvas is software-rasterized, so `draw()`'s time
  includes every blended pixel of every full-screen `lighter` pass. On the iPhone the same `draw()` only *records* commands;
  the pixels are the GPU process's. The two "work" numbers are different quantities — "8 ms here ≈ 2 ms there" was a
  coincidence of the day, never a conversion.
- Fixed sleeps, not conditions: `sleep(2500)` after `setTier()` then `sleep(SECS)`; it never waits on `harbor().pending` or
  `neon.pending`, so a bake or sprite burst still running inflates the window (`title-perf.mjs:74–81`; the E2E does wait on
  `pending` but not on `neon.pending`, `e2e-harbor.mjs:681`, `scene.js:1030`).
- 4× CPU throttling compounds with whatever else the machine is doing (it is a forced idle of the renderer relative to wall
  time) — a loaded host at "4×" behaves like 20–30×. That is the 26–90 ms afternoons in the handoffs (`harbor.md:1805–1819`,
  `:1912–1919`).
- `setTier()` pins a tier against stepping **up** but the probe can still step it **down** mid-sample
  (`scene.js:908–913`, `:925`); the row is reported with an arrow (`t1→0`) but still counted.
- **The E2E applies the same 8 ms to all three tiers** (`e2e-harbor.mjs:26`, `:688`); the documented 8 / 6 / 4 budgets are
  asserted nowhere. One sample per tier, one run, nothing to compare against.

**The noise, measured today** (`title-perf.mjs --city 2 --scenes np-night,np-party --size 402x874`, five runs, same code):

| run | machine | night t2 (mean ms) | party t2 | party t1 |
| --- | --- | --- | --- | --- |
| 1 | loaded (six audits running) | 21.7 | 26.0 | stepped → t0 |
| 2 | loaded | 19.0 | 28.4 | stepped → t0 |
| 3 | loaded | 8.65 | 30.1 (stepped → t1) | 12.9 (stepped → t0) |
| 4 | quiet | **7.63** | 30.8 | stepped → t0 |
| 5 | quiet | **7.89** | 33.1 | stepped → t0 |

- The **night** reads 7.6–7.9 ms on a quiet machine — *inside* the budget. The "8.2 vs 8.0" failures since Neon Pass 4 were a
  ±1–14 ms instrument judging a 0.2 ms margin. The project's own records already show identical code reading 8.66 and 6.77 in
  consecutive runs (`harbor.md:1314`) and a baseline that failed too (`:1924`).
- The **party** reads 26–33 ms in *every* run, loaded or not. That is real on this bench — and it is almost all fill: the
  party adds a second additive draw of the whole neon layer on each punch, wider beams, the water's extra columns. Software
  raster pays for those pixels; the iPhone's GPU pays for them too, just not in the "work" number. **So the answer to "is the
  party really too costly or is the bench wrong" is both:** the absolute gate is wrong, and the party's fill is the one real
  cost — which is exactly what the iPhone's 4–7 % slow frames are showing (§1b).
- Tier 1 on a party night stepped down to tier 0 in all five runs: every tier-1 party number in the handoffs since Neon Pass 4
  is a tier-0 number with a different label.

**Why it matters for the owner:** five passes each spent a "one fix + one re-measure" round and a Known-issues bullet on a
number that cannot distinguish a regression from an open browser tab. Meanwhile the phone's real cost (fill) never had a gate.

**Fix (the right budget and bench for this project):**
1. **Gate on a relative A/B in one run, interleaved** (A,B,B,A, ≥ 3 pairs per scene / tier, medians; fail at B/A > 1.10 or
   +0.5 ms). `title-perf.mjs` gets `--base2 <url> --pairs 3` and does it itself (~30 lines) — no more hand-averaged
   afternoons. The bible already says only A vs B in one round means anything (`harbor.md:127–129`); make the tool say it.
2. **Absolute budgets become warnings**, printed per tier (8 / 6 / 4), never asserted on this laptop. If an absolute gate is
   wanted, record a per-machine `perf-baseline.json` with `--record` and compare to that.
3. **Gate on frame pacing, not work mean:** frame-interval p95 and the share > 20 ms are what the user feels, what the tiering
   acts on, and the one number the laptop and the phone agree on in kind. Keep work mean as a diagnostic.
4. **Match the device being modelled:** tier 2 with `--gpu` at 1–2× CPU (the fast-phone case), tier 0 at 4× (the slow phone the
   auto-tier would land on). "4× + no GPU + tier 2" is a device that does not exist; a phone that slow steps down by design.
5. **Wait for conditions** (`!harbor().pending && !neon.pending && !fading && probe == null && tier === requested`), sample
   ≥ 5 s (poll `cost()` / `frames()` every 500 ms and concatenate, or a 600-entry ring behind the test hook), and **invalidate a
   row when the tier changed** instead of printing an arrow.
6. The E2E's PERF check: one line (`e2e-harbor.mjs:688`) → warn on cost, hard-fail only `p50 ≤ 18` and "no tier fell to 0".
7. **The phone is the gate** (plan.md: real phones decide). Give the `&debug=1` readout a *session* figure next to the 1.5 s
   snapshot — cumulative slow frames since the city showed, the session max interval — so "read after 10–15 s" is one number,
   not a flicker between 0 % and 8 % (`scene.js:613–633` shows a rolling 90-rAF window refreshed every 500 ms; `work` is over
   90 *drawn* frames (3 s in battery mode) while `frame` / `slow` are over 90 *rAFs* (1.5 s) — two windows on one line).

### 1b. The iPhone's 4–7 % slow frames — the likely causes, ranked (HIGH · S–M)

**How to read the clue first.** "Work 1.6 / 2.0 ms" is JS only (`scene.js:396–399`). On iOS the canvas rasterizes in the GPU
process from the recorded commands, so a frame can read 1.6 ms of work and still miss vsync when the GPU's raster of that
frame runs past 16.7 ms. `slow` counts rAF intervals > 20 ms (`scene.js:623`): at 60 Hz one missed vsync is a 33 ms interval,
so 4–7 % of 90 ≈ 2.4–4.2 dropped frames a second — **one every 0.25–0.4 s**. That cadence is the fingerprint.

**The Day Pass did not change the night frame path on a clear night.** `git diff 9741fe9 8c2eaa8` on the frame path adds only
`clouds.draw()` (returns at once when cover is 0, `clouds.js:236–237`), `dayfx.draw()` (returns when the sun is below 1°,
`dayfx.js:72–73`) and a `harborSky()` call inside the 2.5 s look refresh; City 1.0's `wfx.sky` is now *skipped* at night unless
a storm (`scene.js:489`). So "0–3 % before, 4–7 % after" is either a cloudy night (then the clouds are real new fill: up to 14
soft sprites + a 3× full-width deck a frame, `clouds.js:250–256`) or run-to-run drift (thermal state, Low Power, which song).
**Prove before chasing:** the same minute with and without `&force=no-clouds`.

Ranked (mechanism · evidence · how to prove on the phone · cheapest fix):

1. **THE PUNCH draws the whole neon layer twice, 2–4 times a second** (`neon.js:543`, `:571`, `:575` draw every sign / outline
   sprite a second time, additive, while `a > 1.01`; pier lamps twice `scene.js:571`, `:722`; wheel bulbs a second wider draw
   `wheel.js:220`; beams widen `skybeams.js:117`, `:129`). The attack is ~50 ms + decay (`harbor-beat.js:19`), so 3–5 frames per
   punch, on the fill-heaviest pass of the frame (5.3 screens a frame already, `harbor.md:1284–1292`). One dropped vsync per
   punch ≈ 3–7 % slow — the observed band and the observed cadence. **Prove:** `&force=no-punch` (`neon.js:509`); mute the music
   (the clock punch is 1/s) and slow % should roughly halve. **Fix:** at tier 2 on a phone punch with `globalAlpha` (as tier 0
   already does, `neon.js:470`) instead of a second `drawImage`, or second-draw only the outline sprite, not every sign.
2. **THE WATER's 10 Hz build reads the main canvas mid-frame** (`water.js:176` every ≥ 95 ms: `blit(sx, main, …)` at `:202` from
   the canvas this frame is drawing into — a GPU flush — then a `copy` flip, the mirror closures (the wheel's whole cache,
   Rosie, the beam, `scene.js:669–672`), **`multiply` twice** (`:224–226`), 5–10 stretched full-width `lighter` blits
   (`:229–241`), the light columns). A build frame is markedly heavier than its neighbours at ~10 Hz. **Prove:** `&force=no-water`;
   `&force=no-wheel` / `no-boats` remove the closures. **Fix:** fewer columns at tier 2 on a party (K = 3–4), one `multiply` pass,
   never build on a punch frame (`skip if PT.punch > 0.3`).
3. **THE SKY BEAMS rebuild a colour sprite on almost every frame of a palette fade** — a CPU pixel loop + a `getImageData`
   readback. `skybeams.js:129` keys the sprite on the colour quantised to 1/8 per channel; `neon.beamCols` returns a
   *continuous* mix of two palette colours during every sweep (`neon.js:918`, the last fifth of every ~26 s scene, every beat in
   the strobe scene). Each new key = `createImageData(64×256)` + 16 k pixels × 3 `Math.pow` (`skybeams.js:35–51`) +
   `putImageData`, then the foot does a **`getImageData` readback** (`:64`) + a second canvas; the cache wipes at 24 entries
   (`:52`). 6 beams × ~27 steps = a build nearly every frame for ~5 s of every 26, 2–6 ms each plus the readback sync — visible in
   `work p95` only during fades (why the mean looks fine). **Prove:** `&force=no-beams`; watch slow % during a colour sweep.
   **Fix:** quantise to 1/32, or pick the nearer palette colour and crossfade two cached sprites by `globalAlpha`; compute the
   foot analytically (row 255 is known) instead of reading pixels; cache 64.
4. **THE ROTATING PALETTE's pair sprites: two `shadowBlur` ≈ 30 device-px strokes per outline, and the first job always runs
   whole.** `neon.js:308–334` queues a `[main, accent]` pair for every outline at each scene change; `tubes.js:54–57` draws them
   with two `shadowBlur` passes over the whole outline into a fresh canvas (a hero ≈ 146 × 552 px); `neon.pump()` is a do-while
   (`neon.js:384–388`) so a hero's sprite is one 10–25 ms frame regardless of `bakeMs`, 12–20 of them back to back per scene.
   **Prove:** `harbor().neon.pal.built` climbing while slow % spikes right after `harbor().show.scene` changes; `no-punch`
   leaves this one alone. **Fix:** check the budget *before* starting a job (skip to next frame), build the next scene's pairs at
   the scene's start, and drop `shadowBlur` for the party pairs at tier 2 (stacked wide strokes at low alpha, the Safari path).
5. **The searchlights' turn** (`searchlights.js:155–172`): per light a polygon clip, two rotated draws of a 64×512 sprite
   scaled to ~80 × 830 pt, a fresh radial gradient per frame — a steady floor for bars 23–32 of every 32 that makes 1–2 tip
   over more often. **Fix:** one rotated draw, reuse the lens gradient.
6. **The light key re-bakes every ~5 min at 23:00** (`lightKey()` includes `round(P.win·60)`, `scene.js:264`; `P.win` slides with
   `late`, `palette.js:7,12`, `sky.js:467–469`): a `rebakeLights()` whose single step is not time-sliced (`lights.js:52–60`), a
   1.2 s crossfade during which the FILL merge is off (4 band draws instead of 1, `scene.js:826–853`), then the merged bitmap
   rebuilt in one frame. Fine as design; it is a periodic 1.5 s dip, not the steady 4–7 %.
7. **DOM / title side:** `trackLogo` every 500 ms does ~10 `getBoundingClientRect` on a DOM `partyFrame` just dirtied (a forced
   layout at 2 Hz, `title.js:890–898`); `premiumLogo`'s flutter sets `opacity` on a `.ndl-core` *inside the blur-filtered logo
   SVG* 22 % of seconds, twice (`title.js:561–566`; the filters are the 100 ms-frame items `title.css:235` warns about). Small,
   but 1–2 Hz and they coincide with the cadence. **Prove:** `?no-vars`; `500 → 5000` at `title.js:897` for one run.

**Checked and fine:** per-frame allocations (~500–900 nursery objects a frame — ordinary; no per-frame `getImageData`,
`measureText`, `font=`, `Path2D`, `filter` or `shadowBlur` outside 3–4 above); the bakes (no resize / `getContext` in a frame
once settled); the stars (one 15–40 ms frame per 20 s); the clouds' key (stable at 23:00); the wheel cache (steady 30 Hz, a spike
only via 1); `beat.js` (preallocated buffers, no rAF of its own); `remote.js` (one listener, a 4 s tick); the readout (≤ 0.3 ms,
inside `work`). **The aurora**: if `harbor().sky.state.aurora` was on that night, `moon.js:177` redraws its curtain every 110 ms
and would alone explain the figure — check.

**The order on the phone, one sitting, same minute, music on:** `&force=no-punch` → `no-water` → `no-beams` → `no-clouds` →
`?no-vars`, reading slow % after 10 s each. Whichever drops it to 0–3 % names the fix; if none alone, it is the floor (5) plus
the spikes (1–2), and the first fix to ship is 1 (the alpha punch at tier 2).

### 1c. Memory (LOW · S)

`memAll()` (`scene.js:1047`) reports 35.7 of 64 MB but counts only the baked sets, the water, the neon sprites and the clouds.
Alive outside it at 402×874 DPR 2: the main canvas 5.6 MB, `skyCv` 3.3, the stars' base 3.3 (sized with `devicePixelRatio`, not
the tier's DPR — `stars.js:85–86`), the vignette, the sun / moon / lamp art ≈ 2, plus transients: the frost pane 5.6 (full
screen), the rainbow's 4–5 bakes ≈ 6, the skywriting layer 3.5. Realistic peak ≈ 60–75 MB. Nowhere near WebKit's hard limits
(the largest single canvas here is ≈ 0.7 Mpx against a 16.7 Mpx cap, 4 Mpx at 1440×900) — but the readout should show the
truth. **Fix:** add the sky, stars, frost, rainbow and smoke canvases to `memAll()`. One real side effect of the stars' DPR:
at tier 1 / 0 `sb.cv.width !== skyCv.width` (`scene.js:462`), so the sky + stars merge silently fails and both are blended as
two full-screen draws a frame — on exactly the phones that just stepped down for being slow. Pass the scene's DPR into
`stars.base()`. **S.**

---

## 2. THE O's MISSING WHITE CORE — root cause found (HIGH · S)

Not a paint glitch, not the tired rotation, not fonts, filters or ids. **Two lines that were never meant to meet:**

1. `css/title.css:437–443` — rules written for the holiday O (`swapO()`, the jack-o'-lantern / clover, `title.js:154–171`,
   whose parts carry inline `style="--g:…;--b:…;--c:…"`):
   `.nd-sign .ndl-3 .ndl-core[style] { stroke: var(--c); }` — **O only** (`.ndl-3`), matches *any* `style` attribute, and
   `--c` is defined only under `.sg-halloween` / `.sg-stpatrick`. `stroke` is inherited, so an undefined `var(--c)` falls back
   to the parent's stroke, `none`. CSS beats the `stroke="#fff1f8"` presentation attribute (`logo.js:58`).
2. `js/screens/title.js:561–566` (`premiumLogo`, City 2.0 only, every 1 s while the sign is steady): with probability 0.22 it
   picks a random lit core, sets `core.style.opacity = '0.8'`, and 70–130 ms later `core.style.opacity = ''`. Clearing a
   property **does not remove the attribute** — it leaves `style=""`, and `[style]` matches an empty attribute.

The moment the flutter lands on the O, its core's stroke becomes `none` for the rest of the visit, with classes and computed
opacity identical to the other letters (confirmed in headless Chrome with the exact rule + markup: after `opacity=''` →
`hasAttribute('style') = true`, computed `stroke = none`, `opacity = 1`; `removeAttribute('style')` restores it). The numbers
match: 0.22 × ¼ = 5.5 % per second → a screenshot 3–5 s after steady reproduces in 15–25 % of loads ("1 in 6–10"); a 60 s
evening visit → 97 % (the owner's "permanently dimmer / fuzzier O": body + glows + hot spots but no crisp core). It never
reproduces by day (`.is-day` outranks it, `title.css:320`), under reduced motion, or before the sign is steady — which is why
"20 loads in a row" missed it.

**Confirm on any phone, at night, DevTools console:** `const c=document.querySelector('.ndl-3 .ndl-core'); c.style.opacity='0.8';
c.style.opacity=''; getComputedStyle(c).stroke` → `"none"`, the core gone; `c.removeAttribute('style')` → back. The same on
`.ndl-1 .ndl-core` → the stroke stays (no rule for the other letters).

**Fix (both halves; each alone closes it):**
- `title.css:438–441`: scope the swap rules to the swapped O and give fallbacks —
  `.nd-sign .ndl-3[data-kind] .ndl-core[style] { stroke: var(--c, #fff1f8); }` (and `var(--b, #ff5fb4)`, `var(--g, #ff2e97)`
  on the body / glows; `swapO` sets `data-kind` on the swapped group).
- `title.js:565–566`: drive the flutter by a class (`.is-flut { opacity: .8 }`, removed in the timeout, guarded by `destroyed`)
  — or at minimum `core.removeAttribute('style')`. A class also keeps everything visible in the markup, which is what made this
  one invisible to the earlier diff.
- A guard in the title E2E's `neon` group: after `is-steady`, every `.nd-logo .ndl-core` has `getComputedStyle(c).stroke !==
  'none'` and no `style` attribute. Update `harbor.md:2042–2044` and `docs/title.md`.

The tired rotation (`harbor-show.js:292–305`) is fine and intended: a class (`is-tired`), the core at 0.6, seeded on 3-hour
wall-clock blocks so every phone agrees. It likely contributed to the owner's impression (one letter tired ~55 % of blocks) but
is not this bug.

---

## 3. CODE HEALTH + LEFTOVERS

Overall: better than fifteen fix-on-fix passes usually leave a codebase — no commented-out code, no silent `try/catch` in the
frame path, `console.*` gated on `DEBUG`, the documented hooks exist. The debt is concentrated and mechanical.

| # | sev | what · where | why it matters | fix | size |
| --- | --- | --- | --- | --- | --- |
| C1 | MED | **`&wheelbg` has three defaults and the owner's pick isn't live.** `scene.js:96` defaults to `'c'`, `blocks.js:86` to `'b'`, `lights.js:86` to `'b'`; a/b/c carry ~20 lines across the three files + a 4-way doc table (`harbor.md:1947–1951`, `:2048`, `:2064`, `:2077`). | Every visitor on `?city=2` sees variant **c**, not the **d** the owner chose; two files disagree if a cam is ever built without `wheelQuiet.bg`. | Hard-code d (keep `floodWash`, drop the lift parameter + the `qThr` table + the a/c trait injection), delete the flag read, fix the four doc spots. The roof accent + floodlights elsewhere are DT work on top of this. | S |
| C2 | LOW | **Dead code:** `STRENGTH` (`harbor-neon.js:73–75`, zero references; `harbor.md:584` still describes it), `boatSpeed` (`harbor-boats.js:131`), `FONT` alias (`harbor-windows.js:65`), `skyPos()` + `fs.skyPos` (`scene.js:315–319`, `:451`; no district module reads it), `LIT_GROUPS` (`scene.js:68`), `moonNow` set twice (`:478`, `:481`), the Part 1 `demo` lantern + `drawEvents(c,'front')` that can never draw (`scene.js:304`, `:602`, `:874–882`, `harbor-events.js:127`), City 1.0 stubs in `fs` (`blades camX signalMode cam`, `scene.js:451` — read only by `furniture.js`, never loaded). | Noise for every reader of the two biggest files. | Delete. | S |
| C3 | LOW | **Dead panel buttons:** UFO + THE MOON CAT (`harbor-remote.js:64–65`) live in `fx.mid`, which the Harbor never calls (`scene.js` calls `back` / `front` only). LIGHTNING (`:75`) silently does nothing without WEATHER = STORM (`weather-fx.js:316`, `scene.js:489`). `&force=tired&letter=` and `sat` are understood but unregistered. | The owner presses a button, nothing happens, and wonders what broke. | Mark the two `hint: 'Part 6b'` or drop until 6b; auto-add `wx=storm` for lightning; add `tired` + `sat` rows. | S |
| C4 | MED | **`clamp01` defined 23×, `smooth` 10×, four incompatible `mix` / `rgb` / `rgba` variants, `hexRgb` 3×, the seeded hash 5 flavours** (`shapes.js:5–7` already exports the right ones; `tones.js:4` imports `mix` then redefines `sm` / `mixc` at `:83–84`; identical sin-fract `hash` in `lighthouse.js:23` and `water.js:37`; `core/rng.js` used by clouds only). | A rounding difference in one copy is a colour seam nobody can find; every new file copies again. | One `js/core/mathx.js` (`clamp01 smooth lerp mix rgb rgba hexRgb`), the hash into `rng.js`. Mechanical, many files — also pays for the district's copies. | M |
| C5 | MED | **Tier knobs scattered:** `TIERS` (`scene.js:62`), `MEM_BUDGET_MB` (`bake.js:9`), `MAX_MOVING/MAX_RACE` (`harbor-show.js:119–121`), `DRONES_BY_TIER`, `SLICES[tier]` (`banner.js:129`), ~30 inline ternaries (`wheel.js:376`, `water.js:99/177/220/229/293/328/361`, `moon.js:177–184`, `smoke.js:168`, `birds.js:194/210/230`, `air.js:360`, `rays.js:43`, `boats.js:253`); DPR capping `Math.min(2, …)` copied 7×; `TOP_TIER = 2` (`scene.js:920`) a second copy of `TIERS.length - 1`. | "What does tier 1 drop?" has no single answer; a Part 9/10 piece will invent an eighth cap. | `js/core/harbor-tiers.js`: one row per tier (dpr, bakeMs, memMb, refresh Hz for wheel / water / moon / smoke, counts) + `BAKE_DPR_MAX`. | M |
| C6 | LOW | **"How dark is it" computed ad hoc:** scene.js alone has 10 `clamp01((P.dark - a) / b)` variants (`:517 .25/.5, :521 .2/.5, :537 .35/.4, :546 .3/.45, :548, :589 .3/.4, :648, :664 .35/.4, :739 .15/.5, :744 .3/.5`); `T.night` read 55× in 16 files. | Most are drift, a few deliberate (the water wakes earlier) — nobody can tell which. | One `nightK` per frame in `draw()`, the two real exceptions named. | S |
| C7 | LOW | **Magic numbers the tests and docs repeat:** the tiering (19.5 / 17.5 / 5 % / 4.5 / 8 / 2.5 s / 20 s / 0.85 / 4 s / cool 150 / mean > 12 — `scene.js:894–917`, repeated in `harbor.md:354–362`, `e2e-harbor.mjs:26`, `:233`, `:688`); the fades (700 / 1200 / 900 / 1500 / 2500 ms, `scene.js:405/498/499/514/599/804/923–1006`); the 64ths (`:463`, `:829`); the per-Hz caches (C5); `REF_TITLE` + `DOCK_H = 76 // measured Oct 20` (`harbor-layout.js:31`, `:113`, also `harbor-neon.js:520`) — the reference phone's title geometry, which drifts silently if `title.css` changes. | Changing one breaks the other. | A `TIERING` object + named fades at the top of `perf.js` / `scene.js`, imported by the E2E; derive `REF_TITLE` from a measured fixture or note the dependency in title.css. | S |
| C8 | LOW | **Glow-dot sprite built 7× from scratch** (`scene.js:276`, `lights.js:176`, `strings.js:28`, `skybeams.js:75`, `lighthouse.js:127`, `neon.js:442`), five of them without `ctx2d()` (S2). `tubes.js:157 sprite()` is already the right abstraction. | Same code, six chances to forget the iOS guard. | `glowDot(col, size, stops)` in `canvas-safe.js` or tubes.js. | S |
| C9 | MED | **Files too big to work in safely:** `scene.js` 1048 (`draw()` is 192 lines in one function, the API object 96), `neon.js` 928, `harbor-neon.js` 657 (`outlines()` is 170 lines), `harbor-layout.js` 564 (`harborLayout()` 157). The seams are already visible in the comment banners. | Every later part touches scene.js and neon.js; a 190-line `draw()` is where a 6b piece will land in the wrong draw-order slot. | scene.js → `perf.js` (tier + probe + readout + `TIERING`), `remote-apply.js`, `party.js` (`PT`, punch, finale), `hero.js` (harbor frame, pier lamps, water), `fill.js` (`pair` / `litLayer` / `skyMix`), `api.js`; neon.js → `neon-layout.js`, `neon-sprites.js`, `neon-party.js`; harbor-neon.js → palette / outlines / spots; harbor-layout.js → camera / skyline / layout / lanes. Tests import by name, so only import paths move. Do it as the first step of whichever part next touches each file, not as its own pass. | L |
| C10 | LOW | **City 1.0's clouds still built in a storm:** `weather-fx.js#sky` runs `wantShapes()` (`:263`) → 5 cumulus + 3 stratus shapes laid out (~2 ms a frame after 4.5 s) and never drawn (`cloud: 0`, `scene.js:489`). | Wasted work exactly when the storm sky is heaviest. | `createWeatherFx({ clouds: false })`, or call `wfx.sky` only for its lightning path. | S |
| C11 | LOW | **Three ways to "make it a party"** with different beats and side effects: `&force=party` (the real `PT`, `scene.js:343`), `neon-party` (the neon moment at a fixed 120 bpm, `:812`, `neon.js:684–686`), `strings-party` (`:586–587`); `&scene=` implies `neon-party` (`harbor-remote.js:220`); the wheel / Rosie follow `PT.on` only (`:541–544`). | Previews that don't match the real party night. | Make `neon-party` an alias of `party` once the show is driven by `PT` alone; `strings-party` only while `STRINGS_ON` is false. | M |
| C12 | LOW | **Internal-only exports** in blocks / searchlights / tubes / lights / air / balloons / drones / wheel / water / harbor-layout / harbor-neon / harbor-events / harbor-sky (`MAT WIN_W faces crown glow occludersAt envelope resample clips colourOf wordFaces beaconPulse airLook BALLOON_SCHEMES DRONES_BY_TIER WHEEL_SCHEMES waterTint TOWERS tiersOf doorRect FILLET floorY pierX sideFace sideFloor spotWorld CORRIDOR_PAD fxAt slotOf REPLAY_SLOTS *_POOL`); `water.wake()` (`water.js:400`) and `neon.reflections()` (`neon.js:912`) are hooks with no caller, mentioned six times in the docs. | A larger surface than the code has. | Drop `export` where nothing imports; keep `wake` / `reflections` only if Part 9 / 11 will use them. | S |
| C13 | LOW | **`Math.random()` where the docs say "every phone the same":** `harbor.md:1079` ("every phone sees the same sky") — but the everyday planes (`air.js:125`, `:146–149`, `:366–370`), satellites (`:126`, `:255–265`, `:391`), geese / swifts / bats / heron (`birds.js:17`, `:130–137`, `:156–157`, `:181`, `:194`, `:210–211`) and the light toggles (`lights.js:276–279`) spawn on `Math.random`. Only the scheduler's events and the remote's one-shots are synchronized. The no-music beat is `createHarborBeat(Math.random())` (`scene.js:121`), so two phones in one room run different party scenes without a song. `remote.js:106` reads the device clock for the panel's holiday dates; `lights.js:228` mixes clock ms and `performance.now()` for a spell's `t0`. | A false promise in the bible; Part 11's "the whole room in step" will trip on the beat seed. | Docs now (S); seed from the scheduler's slot / `partySeed(LK.local)` when a part needs it (M). | S / M |

**What will make Parts 6b–13 harder** (beyond C9):
- **Autumn is baked into the tone table:** `tones.js:11` `canopy: [196,120,52]` in DAY / GOLD / NIGHT with no season input;
  `stage.js:26–27`, `:44` paint trees and planters from it; `birds.js:138` defaults the month to 10. Part 9 needs a `season`
  term in `toneWeights`. **M.**
- **"Lit" means "night", not "dark":** `T.night > 0.05` in blocks.js (15 reads), `f.night > 0.3` in neon.js (`:482`, `:486`,
  `:737`), the `P.dark` thresholds (C6). A black storm sky at 4 pm (Part 9, `clouds.set({ dark })`) will not light the neon
  because `P.dark` is the sky model's, not the painted sky's; the blue-hour power-up (DT) wants one `litK` too. Decide one
  darkness input and route everything through it — **do this in DT, before the power-up is built on the old gates.** **M.**
- **Nothing can draw over the sign:** the lanes end at `c.neon.y - PAD` / start under the tagline (`harbor-layout.js:552–553`),
  `skyfx` hands pieces only those two; the 6b barnstormer and the "messages in front of the logo" rule need a third lane and a
  sign-dim hook (D3). `district/fx.js:227` places the sleigh and the witch at City 1.0 heights (`HZ·0.1–0.3`, `signRect.y - 24`),
  which on the Harbor's lower horizon is inside the tagline band — 6b should move both into `skyfx`'s lanes. **M.**
- **Lightning** (`weather-fx.js:194–195`) picks "the left or right fifth" of `W` assuming City 1.0's sign — on the Harbor the right
  fifth is the wheel / corner buttons. Pass a lane rect. **S.**

---

## 4. SAFARI / iPHONE RISKS

| # | sev | what · where | why | fix | size |
| --- | --- | --- | --- | --- | --- |
| S1 | MED | **A top-level `await` in `js/screens/title.js:37`** (`const createHarbor = /city=2/.test(…) ? (await import('./harbor/scene.js')).createHarbor : null`), statically imported by `app.js:14`. The first TLA in `js/` (none before `6aab0db`). | TLA needs iOS 15 / Safari 15: an older phone fails to **parse title.js and the whole app dies at module load — every game, City 1.0 included, flag or no flag.** It also makes City 1.0's module graph async (app.js waits a tick) for a feature it never uses. In practice almost every iPhone that runs Firebase 11 runs iOS 15+, so the exposure is small — but the floor was raised silently, for everyone, by the one line that was supposed to keep City 1.0 untouched. | `let createHarbor = null; const harborReady = flag ? import('./harbor/scene.js').then(m => { createHarbor = m.createHarbor; }) : Promise.resolve();` and await it inside the title's mount. | S |
| S2 | MED | **`getContext('2d')` unguarded on the bake and frame paths.** `ctx2d()` (`canvas-safe.js:34`) is used in 3 files (tubes, skybeams, clouds); 21 harbor files + `bake.js` + `scene.js` call `getContext` directly. The critical one: `bake.js:51` — `const x = g.next.getContext('2d')` then `x.setTransform(…)` inside a queued step → if iOS returns `null` (out of canvas memory), `pump()` throws inside `draw()` (`scene.js:429`) **every frame** (`raf` is re-armed first at `:382`) and the Harbor freezes on the sky with no fallback. Same pattern: `scene.js:466` (skyMix), `:685` (pier lamps), `:833` (the merge), `water.js:82` `size()`, `lights.js:372`, `wheel.js:105/383`, `moon.js:78/83/180`, `smoke.js:120`, `boats.js:53–70`, the plane / banner / balloon / drone sprite builders. | The "never a thrown frame out of canvas memory" rule (`harbor.md:125`) holds only where `ctx2d` is used. Memory is well inside the limits today (§1c), so this is insurance — but Parts 7–11 add canvases. | Route `bake.js`, `water.js#size`, scene.js's four and the sprite builders through `ctx2d()` (skip the draw on `null`); wrap `draw()` so repeated throws step the tier down / stop the loop and log once. | M |
| S3 | MED | **`roundRect` unguarded in 11 harbor files** (~35 calls: `balloons.js:79`, `banner.js:38`, `boats.js:113/163`, `lighthouse.js:79/81`, `road.js:35`, `shapes.js:38–55`, `signs.js:74–354`, `stage.js:33`, `tubes.js:128`, `wheel.js:151`). Safari 16+ only; the shared `rain.js:31` guards it, the Harbor doesn't. | On iOS 15 a bake step throws → the S2 freeze, on `?city=2` only. | A `rrect()` helper in `canvas-safe.js` with the `rect` fallback — or state iOS 16 as the Harbor's floor in the bible and move on. | S |
| S4 | LOW | One per-frame lerp without `dt`: `scene.js:865` `beamK += (target - beamK) * 0.025…` — the searchlights' warm-up runs at half speed at 30 Hz. Everything else checked advances by `dt` / seconds. | Low Power Mode. | `* Math.min(1, dt / 16.7 * 0.025)`. | S |
| S5 | LOW | `Array.prototype.at` at `neon.js:409` (Safari 15.4). `color-mix()` in `title.css:284` (the party glow, both cities; Safari 16.2 — degrades gracefully). `harbor-remote.css` uses `inset`, `dvh`, `:has()` (owner-only sheet; fine). | Floors to know about. | Note the floor (iOS 16) once in the bible; replace `.at(-1)` with `[len-1]`. | S |

**Checked and fine:** the Low Power probe (`capped`, `scene.js:897–913`) and the time-based battery pacing; **audio** — the
unlock path retries whenever `ctx.state !== 'running'`, which covers Safari's `interrupted` (`engine.js:63–113`); the
AnalyserNode is built once per context, taps the shared music bus (not a new `createMediaElementSource`), runs through a
zero-gain node to the destination (WebKit needs that), is sample-rate independent, handles `outputLatency` undefined
(`beat.js:19`, `:58–77`), and is only built on City 2.0 (`title.js:287`); the recorded neon = 7 WAVs ≈ 1.6 MB of buffers,
decoded once, synth fallback on failure. `ctx.filter` only behind `blurWorks()`; composite modes all WebKit-safe; no
OffscreenCanvas / ImageBitmap / conic gradients / `requestIdleCallback` / `structuredClone`; taps are pointerdown / up; the
panel's targets are 44–48 pt with safe-area padding and `-webkit-overflow-scrolling`. No 0×0 `drawImage` source found live
(every zeroed canvas is nulled or guarded by `blit()`).

---

## 5. CITY 1.0 STAYS SAFE — yes, with one caveat (S1)

- The Harbor is a dynamic import gated on the flag (`title.js:37`); `remote.js` is imported 1.5 s later only `if (createHarbor)`
  (`:294`); `harbor-remote.css` is appended by remote.js for an admin only (not in `index.html`; no harbor `<link>` /
  modulepreload; `sw.js` has no precache list); `city2/live` is subscribed only inside `createRemote` (`remote.js:60`) — **never
  on the default city** (the E2E's "default city never listening" check agrees). The beat listener is passed `createHarbor ? … :
  null` (`title.js:287`); every Harbor-only behaviour in title.js is behind `if (!createHarbor) return` (`tagShade :543`,
  `premiumLogo :555`, `humSync :643`, `neonOnSound :649`, `tiredTick :291`, the punch `:775–786`, the race `:798`, `:832`); the
  tier start keeps City 1.0's exact old formula (`:281`). `fx.js`, `aircraft.js`, `wildlife.js`, `stars.js`, `rain.js`, `logo.js`,
  `ambience.js`: additions only, defaults preserved, City 1.0 paths byte-identical by reading.
- **Two behaviour changes City 1.0 did get:** (1) S1, the TLA; (2) `beatSource()` (`beat.js`) now dequantizes iOS's coarse song
  clock and subtracts output latency, and prefers `song.grid.bpm` — used by `core/party.js#advanceBeat` on City 1.0 too. Meant
  as an improvement; verify the City 1.0 party breath once (`e2e-title ONLY=neon`). (3) `district/sun.js` was refactored (the
  arch fitting; `sunPlace`'s signature) — the one shared change not provable equivalent by reading: `node --test
  tests/sun.test.mjs` + `e2e-sky.mjs` are the proof. **LOW · S** each.
- Loaded but not run on City 1.0 (pure, a few KB): `core/harbor-show.js` + `core/harbor-beat.js` (via `title.js:33`, `beat.js:14`),
  `ui/canvas-safe.js` (via `rain.js:7`, `sun.js:17`). Fine.

---

## 6. THE PREVIEW PANEL'S SERVER SIDE — clean (nothing a normal user can abuse)

- **Auth:** `api/admin.js:191–194` → `requireUser` verifies the Firebase ID token with firebase-admin (`http.js:33–44`) → `uid →
  pid` via `uids/{uid}` (`profiles.js:35–38`; no client `.write`, `rules.json:1073–1077`) → `ADMIN_PIDS` from the environment
  (`fb.js:54`, `admin.js:142–145`). Nothing in the body identifies the caller. All actions share the same 403 — the city actions
  need the same credential as moderation. POST only, body ≤ 2 MB, 5xx bodies say only "server error", no CORS headers (a
  cross-origin POST with `Authorization` fails preflight).
- **Validation** (`harbor-remote.js#cleanRemote :168–211`, run on the server *and* again on every phone that reads the node,
  `remote.js:63`): `force` from the `EVENTS` ids only, ≤ 12; `text` upper-cased, charset `A–Z 0–9 space !?.,'&+-#@:♥★|`, per-event
  max 74 / 40 / 33 / 10, refused over 200 raw; `show` / `colours` / `colour` / `by` / `style` / `tower` / `scheme` / `game` /
  `scene` / `party` / `wx` / `hol` by whitelist; `when` strict `YYYY-MM-DDTHH:MM` 2020–2040 with a real day; `speed` ∈ {1, 20, 60};
  `mins` 1–240 (default 30); any drop → 400. `until` is on the server clock and every client ignores the node once it has passed
  (`remote.js:45`) — a forgotten preview expires itself. **Rendering:** every string reaches the screen as canvas `fillText` /
  pixel-font cells or `textContent` through `h()`; no `innerHTML` in `js/screens/harbor` (grep: 0). **Rules:** `city2/live` `.read:
  auth != null`, `.write: false` (`rules.json:940–945`), tested (`rules.test.mjs:723–732` incl. a `PWNED` text; `server.test.mjs:506–532`).
- A visitor's own URL flags render on their own phone only; forging `sessionStorage['nd:hr-admin']` shows the pill locally and
  every send gets a 403; `&panel=1` needs `?emu` (localhost only).

| # | sev | what | fix | size |
| --- | --- | --- | --- | --- |
| A1 | LOW | No profanity filter on the remote `text` (only a charset) — an admin typo reaches every phone on `?city=2`. `js/chat/logic.js` already has the room filter. | One call in `cleanRemote`. | S |
| A2 | LOW | No rate limit on `/api/admin`: `whoami` and the 403 path cost a token verify + a DB read per call for any signed-in user; `log.js` / `profiles.js` have `rl/` buckets, admin.js none. Abuse value is cost only. | A per-uid bucket like `log.js#take`. | S |
| A3 | info | The admin credential is the owner's profile key (`restore` relinks `uids/{uid}`); `ADMIN_PIDS` has no second factor. Not a bug — the key is the thing to protect; Part 13's PIN is the right place for a second factor. | — | — |

---

## 7. TESTS

Unit: `tests/harbor.test.mjs` 90 tests, 6.5 s; the whole suite 456 tests, 28.5 s, green. CI (`.github/workflows/tests.yml`): unit,
then rules → server → smoke on the emulators (Temurin 21). **CI never opens a `?city=2` page** — the harbor E2E is the only place
the real scene is exercised and it runs nowhere automatically.

| # | sev | what · where | why | fix | size |
| --- | --- | --- | --- | --- | --- |
| T1 | HIGH | **PERF** (`e2e-harbor.mjs:26`, `:688`): §1a. Deterministic fail on this laptop, not flake; no true positive in five passes. The follow-on "Promise was collected" (perf group) comes from un-wrapped `page.evaluate` calls (`:683`, `:695`, `:697`) while the page's context is torn down 20× under 4× throttle + `collectGarbage`. | The owner's time. | §1a item 6; wrap those evaluates in a retry, return plain values not pending imports. | S |
| T2 | MED | **Flaky by construction:** RE-LAYOUT (`:318–347`) reads one pixel on the speakeasy wall one door-width above the door's foot — people walk there (the 8-steady-frames pre-wait, `:334`, treats the symptom); BATTERY (`:720–733`) asserts absolute wall-clock fps 22–40 over a 3 s sleep on a loaded host. | Two red checks every full run that mean nothing. | A 3×3 median patch above head height (or `&force=no-people`); BATTERY as drawn / rAF ratio, not fps. | S |
| T3 | MED | **Untested hooks + looks:** the five colour hooks Parts 10 / 11 lean on (`lighthouse.set`, `boats.set`, `skyBeams.set`, `strings.set`, `clouds.set`) have no unit or E2E assertion — a C9 refactor could break any of them silently; no day-look E2E beyond "the neon is off"; no clouds E2E (placement clear of the dock / word band, the 6 h re-roll, `set()`); `canvas-safe.js` (`blit`'s clipping arithmetic) untested; no pair-merge pixel-equality check (`&force=no-merge` exists for it); no regression for the O (§2 gives a 3-line one). | | One "hooks" block in e2e-harbor that calls each and reads it back from `debug()`; a `blit` unit test; the O guard in e2e-title. | S–M |
| T4 | LOW | **Weak tests:** `windows: the light timeline is City 1.0's` (`harbor.test.mjs:217–227`) asserts nesting + `winHash(x) === winHash(x)` and never compares to `palette.js`'s shares; the registry scan (`:1027–1045`) asserts a literal source string (`:1040`) that a formatting change breaks; the mood-song grid scan (`:1323–1330`) belongs with the audio tests. | | Pin the shares; drop the literal; move the scan. | S |
| T5 | LOW | **Fixed sleeps remain** despite Neon Pass 5's note (`e2e-harbor.mjs:89, 95, 122–123, 151, 370, 386, 391, 455, 475, 665, 701, 713, 716, 728–738`); only `:682` and `:729` are genuine measurement windows. The 14-event panel fan-out (`:275–289`) is 6 s × 14 of it. `docs/testing.md`'s harbor bullet (`:14–22`) never mentions `ONLY=` or `SHARDS`. | | Condition waits; document the groups. | S |
| T6 | LOW | **Java / CI:** don't install Java for parity's sake — the unit suite is the local loop and rules + /api run green in CI. But add **one CI job running `ONLY=core,flags,neon,dock` of e2e-harbor** (~1 min on the emulators; skip perf / panel / party there): it would give a second machine's numbers and exercise the real scene on every push. Locally, `docs/testing.md:21–22` names a cached JRE under `~/.cache/neural-arcade/jre/…` — if it still exists Java needs a PATH prefix, not an install. | | | S |
| T7 | LOW | **The uncommitted playwright dependency — revert.** `playwright` is imported nowhere (every E2E uses `puppeteer-core`); it adds 11.4 MB to node_modules and lock churn, and CI's `npm ci` installs it on every run for nothing. The WebKit zip in `%TEMP%` is 55 MB — a truncated download (a WebKit build is far larger), which is why extraction "failed" three times; and WebKit-on-Windows is not Safari (no Apple media pipeline, a different GPU path) — it would not have reproduced the beat / `<audio>` issues anyway. Real options: the owner's iPhone with `&debug=1` (the stated verdict), Safari's remote inspector from any Mac, or BrowserStack minutes. | | `git checkout tests/integration/package.json tests/integration/package-lock.json`; delete the zip. | S |

---

## 8. DOCS vs REALITY · PLAN vs BUILT

**Docs (LOW · S, one sitting):**
- The architecture list (`harbor.md:131–178`) is missing five real files: `waterfront.js` (NP2), `skybeams.js` + `strings.js`
  (NP4), `clouds.js` + `dayfx.js` (Day Pass). Stale roles: `:149` signs.js "cabinets, icons, HOTEL, JAZZ" (JAZZ gone NP4, icons
  gone NP6, HOTEL's spot is the blade); `:183–184` says the district's `aircraft` / `wildlife` are reused while `:401` and
  `scene.js:130–131` say they are not; the draw order (`:188–194`) omits the clouds (after the sun, `scene.js:488`), `dayfx`
  (`:531`), `skyBeams` (`:538`), `waterfront` (`:546`) and still lists "the far icons".
- Known issues that are fixed but not struck: NP4 "phones show 2–3 sky beams" (NP5: every tower), NP4 "sign letters are
  smaller" (NP5 §0b), NP5 "10 of 12 games have a sign a night" (NP6: 4 named + the billboard). Stubs: row 383 "party windows"
  (done NP3), row 396 (the hooks *and* the party colours are built; only the holiday schemes remain). `:584` describes `STRENGTH`
  (dead, C2). `:1079` "every phone sees the same sky" (C13). `:2042–2044` the O (§2). All other Known-issues bullets from NP4
  onward are still real as written. `LOGO_ANCHORS` *does* exist (`ui/logo.js:213`) — the Part 11 hook is there.

**Plan rules vs built:**

| # | sev | rule | built | fix | size |
| --- | --- | --- | --- | --- | --- |
| D1 | — | Depth rule 1 — everyday sky behind the buttons, the logo and the taller buildings, in front of moon / sun / stars | **Matches, stricter than the rule:** `sky.sky` (planes, satellites, helicopter, balloons, geese) draws before the far band (`scene.js:485` vs `:518`), so behind *all* buildings; swifts / bats over the far rows (`:524`); the buttons and the logo are DOM over the canvas. Lanes stop short of the corner buttons (`harbor-layout.js:540–541`). | — | — |
| D2 | — | Sign always on top · dock never covered | Every lane is clipped against the corners and ends at `c.dock.y` (`harbor-layout.js:540–563`); the unit test asserts no lane overlaps neon / word / tag / corners / dock at 6 sizes (`harbor.test.mjs:255–266`); the grid overlay shows it (`grid.js:20–37`). The clouds' placement rule is prose only — no test. | Add a clouds-vs-dock assertion when the clouds get their E2E (T3). | S |
| D3 | MED | **Depth rule 2 — messages (drones, skywriting, skytyping, the banner) IN FRONT of the logo, which dims** | **Not built, and no hook for it.** The banner and the smoke draw in `sky.sky` → behind the skyline and under the DOM sign; only the drones draw in front of the city (`sky.city`, `:555`) and still under the sign. There is no dim API: `signOn` is a read-only getter (`scene.js:973`); no `dimSign` / sign-opacity hook in title.js or scene.js. The messages hold `sky-high` (`skyfx.js:44–48`), between the safe top and the neon's top — not "under SPEAKEASY through the tagline's band". plan.md:30 lists "the sign fading for sky messages" under 6b §0, so it is planned, not forgotten — but 6b cannot start without the hook. | Add `fs.signDim` (the scene publishes) + `title.js` fading the sign / tagline to it, and a `messages` lane (or a sign-aware path), **before** 6b. | S (hook) · M (lane) |
| D4 | LOW | ≥ 44 pt taps | Door 44×44 (padded, `harbor-layout.js:485`; E2E at one size), wheel r ≈ 56–61 pt, the panel 44–48 pt — ✓. **Under 44:** the lighthouse's beam hit is 26–29 pt wide (`lighthouse.js:218`; the E2E taps its exact centre, `:525–527`), the boats' hit is the sprite ± 4 pt (taxi 45×22, tug 34×23, sailboats 26×36), roof-sign cabinets ≈ 30–40 pt tall (`neon.js:907–909`). These are Part 12's eggs, but the hooks are live now. | Pad to `max(44, …)` like `doorRect`; assert in the harbor group. | S |
| D5 | LOW | "City 1.0's light timeline is kept exactly" | The *shares and ramps* are City 1.0's (`P.win` through the light key, `scene.js:263`, `palette.js:7–27`); the per-window dice are a fresh implementation (`harbor-windows.js:16–42`). "Exactly" overstates; the test (T4) doesn't pin the shares. | Reword; pin the shares. | S |
| D6 | — | Weather only when real · never say "live" | ✓ — no player-visible "live" string (only `aria-live` and the admin-only remote); previews never use the live weather. | — | — |

**Hooks the later parts need — status:** 6b `harbor().sky.*` ✓ (E2E), `createSun({look:'harbor'})` ✓ (unit), `clouds.set` ✓
(untested), the moon API ✓, **sign dim ✗ (D3)**; 7 windows `spell` / `set` ✓ (E2E), `STRINGS_ON` + `strings.set` ✓, **the
speakeasy wall / ghost-sign slot ✗** (a grey box, `speakeasy.js:1–20`, no slot reserved); 8 `boats.set` ✓, the 3D-boat plan fits
(`core/harbor-boats.js` gives x / face / z per ms, pure and decoupled from the sprites; a model takes the same `boatAt`
state), `street()` partial (lamps / HZ only); 9 `water.set({rain})` ✓ (`fog` accepted and ignored, `water.js:169`, `:190`),
`clouds.set({grey,dark,base})` + `KINDS` ✓ (untested), **seasons ✗** (autumn baked, §3); 10 `f.finale` / `startFinale` ✓ (shells),
`PT.drop/big/punchAt` ✓ (unit), `skyBeams.set` ✓ (untested), the wheel's routines ✓, `water.light()` ✓; 11 `moment('scheme')` ✓,
`LOGO_ANCHORS` ✓, `setSkyHoliday` ✓ (unit), `wheel.scheme` / `lighthouse.set` / `boats.set` ✓ (previews exist, untested); 13 the
registry + `cityLive` / `cityClear` + `city2/live` ✓ (unit + server + rules + E2E), PIN / confirm / MY ROOM / schedule ✗ (planned).

---

## A. DO IN THE NEXT PASS (DT — the Day touch-up + cleanup)

Small and safe; roughly a day on top of the DT list itself.

1. **The O's core** — §2: scope the swap rules + fallbacks (`title.css:438–441`), the flutter by class (`title.js:565–566`), the
   3-line guard in e2e-title, the two doc lines. **S.**
2. **Retire the 8 ms gate** — §1a: PERF → warning + `p50 ≤ 18`; `title-perf.mjs` does its own interleaved A/B, waits on
   conditions, invalidates a row whose tier changed, prints per-tier budgets as warnings; the readout gets a session slow count
   and shows its windows. **S–M.** Record the five-run table above in `harbor.md#performance` as the reason.
3. **The phone round, before any fill fix** — §1b: the five flags in one sitting on a party night; then ship the one it names
   (expected: the alpha punch at tier 2, `neon.js:543/571/575`; the beam colour quantised to 1/32 + an analytic foot,
   `skybeams.js:35–64`, `:129`). **S each.**
4. **`&wheelbg` → d** everywhere (C1) + the roof accent / floodlights the owner decided. **S.**
5. **The dead code** (C2, C3's two buttons + the lightning hint, C12's two unused hooks if Parts 9 / 11 don't want them). **S.**
6. **One darkness input (`litK`)** for the blue-hour power-up (§3 "lit means night") — do it before the power-up is built on
   the old `T.night` gates, or DT builds it twice. **M.**
7. **S1 the top-level await** (5 lines), **S3 `rrect()`** or the iOS 16 floor in the bible, **S4** the `beamK` lerp, **S5**
   `.at(-1)`. **S.**
8. **T7 revert playwright**, **T2** the two flaky probes, **T1** the un-wrapped evaluates. **S.**
9. **Docs** — §8's list + `harbor.md:2042–2044` + the architecture list + `docs/testing.md`'s groups. **S.**
10. **`memAll()` tells the truth + the stars' DPR** (§1c). **S.**

## B. LATER — with the part each belongs in

| what | part | size |
| --- | --- | --- |
| D3 the sign-dim hook + a messages lane; move the sleigh / witch / lightning into the Harbor's lanes (§3) | **before 6b** (the hook is S; do it in DT if 6b is next) | S + M |
| C4 `core/mathx.js` (the 35 copies) + the hash into `rng.js`; C8 `glowDot` | the next cleanup pass, or the first part that touches ≥ 5 files (6b) | M |
| C5 `core/harbor-tiers.js` (one table per tier) + C7 `TIERING` / named fades | with the perf work of whichever part first needs a new per-tier knob (6b's drone show already has one) | M |
| C9 split scene.js / neon.js / harbor-neon.js / harbor-layout.js | the first step of the part that next touches each (scene.js: 6b; neon.js: Part 10; harbor-layout.js: Part 7's speakeasy) — never as its own pass | L |
| S2 `ctx2d()` everywhere + a guarded `draw()` | Part 7 (the first part adding canvases) | M |
| 1b-4 the pair sprites without `shadowBlur` at tier 2, the pump honouring its budget per job; 1b-2 the water's build off punch frames; 1b-5 one searchlight draw | Part 10 (the party + finale pass) | S each |
| T3 the hooks E2E block + the clouds / day E2E + a `blit` unit test; T6 a harbor CI job | Part 9 (weather plugs into `clouds.set` — test it then) · CI any time | S–M |
| Seasons in `tones()` (the canopy), the month default in birds.js | Part 9 | M |
| C11 one party switch (`neon-party` → `party`) | Part 10 | M |
| C13 seeded everyday sky + the beat seed from the day | Part 11 (if "the whole room in step" is wanted) | M |
| D4 44 pt pads on the lighthouse, the boats, the roof signs | Part 12 (the eggs) | S |
| A1 profanity filter on remote text, A2 a rate bucket on /api/admin, A3 the PIN | Part 13 CITY CONTROL | S |
| The speakeasy wall / ghost-sign slot; `street()` | Part 7 / 8 | — |

**Needs the owner's decision:** (1) whether the laptop keeps *any* absolute perf gate (recommended: none; relative A/B only,
the phone decides); (2) the Harbor's Safari floor — iOS 16 (keep `roundRect`, say so) or iOS 15 (add the helper); (3) whether
`water.wake()` / `neon.reflections()` stay as hooks or go; (4) the UFO / MOON CAT panel rows — hide until 6b or keep with a hint.
