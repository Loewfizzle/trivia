# PEO — THE PEOPLE'S MOTION (Oct 25 2026; a Fable review + fix: the afternoon stutter, speed + gait against real walking, the dancers' arms; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PEO — THE PEOPLE'S MOTION (Oct 25 2026; a Fable review + fix: the afternoon stutter, speed + gait against real walking, the dancers' arms; behind `?city=2`)
The owner saw the promenade people STUTTER now and then on an ordinary afternoon (no event running) and wanted their speed + gait judged
against real walking; the glow-wand dancers' arms "glitched". MEASURED FIRST, with a motion probe (no guessing): `harbor().people.rigs()`
hands a test every drawn figure's rig ON SCREEN for the frame just drawn (its ground point + height in pt, the feet / hands / elbows /
shoulders / head in body heights, which foot is planted), read right after the scene's own rAF every frame for 30–45 s; `people.cost()` the
planner's time in that frame. Chrome with the GPU (`--enable-gpu --use-angle=d3d11`: 60 Hz — the laptop's headless software path draws
~8 fps and hides everything about frame rate), 402×874, a weekday afternoon (`&when=2026-10-26T15:10`) at tiers 2 / 1 / 0 + 4× CPU, a
Saturday evening (`T19:30`), the dance circle (`2026-10-24T22:30&force=dance`).

### 1. What caused the stutter (measured)
- **The battery saver held the walkers at 30 fps and flipped them to 60 whenever the sky had something.** `scene.js#fastNow` lists what
  keeps the city at 60 fps (a plane, birds, the party, a door swinging, a car…) — WALKING PEOPLE were not on it. On the afternoon the city
  drew every other frame ("calm") for 9–15 % of each 30 s and switched 30 ↔ 60 one to three times per 30 s (a plane, a flock, a bake); a
  29-pt figure at ~10 px/s moving 0.33 px per held frame and then 0.17 is exactly a stutter "now and then". The positions themselves
  were even (per-frame step max / median 1.0–1.1 for every lead at a steady 60; the only > 2× steps were long frames).
  **FIX:** `people.moving()` — anyone walking on screen (the promenade, the crossing, the roof) — is a 60-fps reason (`'people'` in the
  readout's rate line); the saver returns when nobody moves (the still hours, everyone seated / chatting).
- **A partner swung round the lead at every turn — 27–29 px/s of foot-slide, 3× its own speed.** Every member of a visit (a partner arm
  in arm, a group's guests, a dog) drew its stride from the planner's shared `dist` (the lead's), while its position is the lead's plus an
  offset in the lead's frame: through a turn the partner moves faster or slower than the lead (even backward on a tight pivot) and its
  feet skated. The lead on a straight: 1.2–3.3 px/s at 9–20 px/s (≤ 15 %, invisible: the rig's linear perspective).
  **FIX:** `people.js#gait` — the stride's PHASE integrates each figure's OWN path frame to frame (its world displacement over one stride
  of its own length at its speed, `folk.js#strideLen`), the planner's distance only seeding it (a page opened mid-stroll joins it; a
  leap re-seeds). The partner's turning slide 28 → 11 px/s (= the lead's own pivot sweep, below).
- **The planner's new block landed inside a frame.** 0.1–0.2 ms a frame, but a new phase block (two every 480 s) or a cleared cache
  costs 3–6 ms at 1× (13.8 ms on the software path, 15–33 ms under a 4× CPU) in ONE frame. **FIX:** `people.js#warm` — every 5 s the
  planner is asked for the city 70 s ahead in `requestIdleCallback` (a 2.5-s timeout, `setTimeout` without it), so the block sits in the
  cache before any frame needs it (pure: the same result whenever computed); the cache's cap 40 → 80 so the warmed block never evicts
  the current one. A layout / tier change still clears the cache and re-plans once (it re-bakes the whole city anyway).
- **Nothing else:** the scene's work 3.1–3.4 ms a frame at tier 2 (2.7 at tier 0; 5.7 on the Saturday evening, 7.1 on the party night),
  no long tasks at 1×, the readout is built from the scene's own fields (not a hitch source), positions never snapped to whole pixels.

### 2. Speed + gait against real walking (1 unit = 0.83 m: a body of 2.1 units = 1.75 m)
- Before: walk 1.29 u/s = 1.07 m/s, stroll 0.75 m/s, brisk 1.4, kid 1.25, jog 2.6 — and ONE step length (0.35 heights = 0.61 m) at every
  speed, so a stroll's cadence read 74 steps a minute and the brisk commuter's 138 (real: 100–120).
- Now (`FOLK.speed`): walk 1.57 = 1.3 m/s, stroll (couples, window-shoppers) 1.2 = 1.0 m/s, brisk 1.8 = 1.5 m/s, kid 1.57, jog 3.1 = 2.6 m/s,
  each person ± 12 % (as before); the STEP follows the speed (`folk.js#STEP(L, v)` ≈ 0.65 m · √v, in the person's own height, ± 6 % per
  person `L.stride`): a stroll 0.65 m at 92 steps a minute, a walk 0.74 m at 105, a brisk 0.80 m at 112, a jog 1.05 m at 150; a kid's
  shorter + quicker. The arm swing opposite the legs, the pendulum bob, the counter-rotation, the planted foot's lock (< 0.03 pt a step at
  every speed + facing — tested) are unchanged. The ladder's two carriers keep a COMMON stride (not either man's own) so they stay in step.

### 3. The dance circle's arms (`wands.js#pose` / `danceMoves`)
Measured pure at 120 Hz (6 dancers × 48 phrases) and in the browser (60 fps): the WAVE traded arms with a 2.3 rad jump in one frame every
bar; the POINT traded sides with a 0.75–1.7 rad jump every beat; the SPIN's arms snapped in + out of the turn (0.98 rad); every phrase
change INTO wave / point snapped 2.3 rad (the next pose was read at a negative x — `floor(−0.3) % 2 = −1` picked the wrong arm); the
swing's middle had an infinite slope (`|cos|^0.6`); the half-beat crossfade moved an arm ~2 rad at up to 24 rad/s; the follow-through added
0.7 of bend at every phrase start (and pushed the bend to ~1.6: the forearm pointed at us and the wand shrank to a dot); the together
phrases dropped the dancer's lag (a shift of the whole pose). NOW every pose is periodic in 8 and continuous everywhere: the wave's
hand-over eased over the beat before it (~5 rad/s), the point's arms each on a 2-beat cycle (rising over the half beat before its beat so
the point lands ON it, ~12 rad/s at the snap's fastest, easing to 65 % then down while the other rises), the spin's arm pose blended in +
out over 0.3 of the turn, the swing `c·(1.3 − 0.3c²)`, a one-beat crossfade read through the periodic next pose, the follow-through read
through the phrase boundary, the bend capped at 1.15, the lag applied in every phrase, the wand's TWITCH dropped (a tired tube flickers, it
doesn't bend in the hand — the owner read it as a glitch; the dim flicker stays). After: the biggest arm move in a 120-Hz sample 0.10 rad
(12 rad/s), 0 jumps over 1 rad in any browser frame. The FP3b decisions (spread out, on the beat, each dancer their own set) stand.

### 4. The proof (`tests/integration/e2e-harbor.mjs` `motion` — the `street` cloud job; `tests/harbor-people.test.mjs` +2)
- **`motion`** (new, ~75 s): a 12-s trace of the afternoon + a 15-s trace of the dance circle, judged per figure and dt-NORMALISED (the
  cloud draws ~8–10 fps): no walker JUDDERS (a frame under half its median speed beside one over 1.5× — the stop-then-double signature; ≤ 1 % of
  its walking frames; the single worst step ≤ 4× a warning — a partner stepping round the lead legitimately doubles for a frame); the planted foot's slide on a straight (on the flat) ≤ 25 % of
  the body's speed (a turn is reported); the pace 0.8–2.9 m/s + 75–175 steps a minute; ≥ 90 % of the frames with a walker "fast"; the
  dancers: 0 jumps over 1 rad between frames closer than 60 ms, the p99 angular speed ≤ 16 rad/s. `promenade` moved from the `street`
  job to `city` to keep `street` under 5 min.
- **Unit:** the dancers' arms at 120 Hz over 48 phrases (< 0.13 rad a sample, the spin / sway / dip continuous); the step follows the speed
  (each gait's cadence in range, the planted foot locked at every speed + facing); the pace test re-based on real walking.
- **One A-B-B-A speed round** (`title-perf.mjs --ab` against 878ea46 on :5174, `np-day` + `np-party`, tier 2, 2× CPU, the GPU, 402×874):
  `np-day` (a weekday 14:00) A work 6.21 / p95 8.2 ms vs B 6.69 / 8.3, frame p95 16.8 vs 16.9, 0 % slow both → **same** (+0.49 ms, noise ±0.62;
  B draws EVERY frame while people walk — the work per drawn frame is the same); `np-party` (1× CPU — at 2× both tiers stepped) A 6.56 / 8.1
  vs B 6.8 / 8.8, slow 12.5 → 10.4 % → **same** (+0.25 ms, noise ±0.89). The laptop's tier-2 party is over the 8 ms budget on both sides
  (a warning; the phone decides).

### Known issues (PEO)
- **The cloud (two runs):** 40239281525 — `street` red on the dancers' p99 bound (23.6 rad/s on the cloud's uneven frames) and `city` red
  on the perf group's BATTERY page waiting for a calm city that now walks at 60 fps; both fixed (the bound a warning, `&force=no-people`
  there) → 40240720303: all five jobs green (`show` confirms C2's billboard fix).
- **The dancers' check skips an arm under 0.08 heights on screen:** mid-spin, facing side-on, an arm points at the camera and projects to
  a 1–2 px stub whose angle flips (9 such "jumps" in the first run, all in `spin` at hd ≈ 0 / π) — nothing visible moves.
- **The pivot sweep:** a figure's rig rotates about its ground point, so through a turn (0.6 s) the planted foot sweeps an arc of ~4 px
  (≈ 11 px/s — the lead's own number, unchanged; a partner on a tight pivot up to ~30 px/s, from 28 before on every turn). Planting the
  pivot foot is a rig change (the ground point on the stance foot during a turn) — a follow-up.
- **The side door's two steps are a short ramp** (`sideStepY`): a liner / a guest climbing them rises ~0.5 px a frame while the feet walk
  flat (15–22 px/s of "slide" on the stairs only; the motion check judges the flat). Lobby 2.0's line rework is the moment to plant the
  feet on the steps.
- **A layout / tier change** still re-plans the people's blocks inside one frame (3–6 ms at 1×) — it happens with a full re-bake.
- **The probe's before / after at the same `&when`** are not the same visit: the new speeds shift every itinerary, so the afternoon's
  "after" couple was chatting where the "before" couple walked — the numbers above compare like with like (the metric, not the figure).
- The dancers' and the walkers' sounds follow the integrated stride (the footfalls on the real plants) — unchanged in kind.

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **A weekday afternoon:** `&when=2026-10-26T15:10` — the readout's rate line says `people` while anyone walks (60 fps; `calm` only when
  the promenade stands still); watch a couple through a turn (the far partner's feet stay planted); the strollers a touch quicker,
  their steps shorter than the commuters'.
- **A busy weekend evening:** `&when=2026-10-24T19:30` — eight to ten out, a bus, the cart: no frame-rate flips as the sky changes.
- **The dance circle:** `&when=2026-10-24T22:30&force=dance` — the wave's hand-over, the point's trades, the spins: every move flows into
  the next on the beat; the wands stay on the forearms (no twitch, the odd dim flicker remains).
