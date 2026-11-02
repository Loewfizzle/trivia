# DESKTOP — Nov 2 2026

The owner's WINDOWS review fixes + the test fixes + THE ONE-TIME DESKTOP PASS (plan.md "OWNER'S NOTES — NOV 1 (late) + NOV 2": the
desktop questions 1–8, "go with your recs"). One session, the groups in order, each committed + pushed; the final push carries the harbor tag.

## What changed

### Group 1 — the owner's WINDOWS review
- **THE JUGGLER** (juggler.js): the doorway behind him GONE (his body vanished against it) — a plain lit wall behind his whole stage; he walks
  in from the SIDE (off the pane's left edge, a turn to us); his room a deep ABSINTHE GREEN (a green-glass lamp shade; the timetable glow
  [64, 206, 160] — clear of the boxer's amber, the boss's TV blue, the Charleston's pink + never on at once with the bookie's green); the
  balls NEON EVERY NIGHT (magenta · yellow · orange, glowing — the red + cream couldn't be seen); party nights add the pulse + the room lit
  in their colours.
- **THE CHARLESTON** (charleston.js): she fills ~86 % of the pane (was 72), the kicks to hip height + out wide, the arms swing wide, the
  limbs thicker, a DARK PLUM CONTOUR round her whole shape (one flat pass under her) so the teal separates from the pink; the pink kept.
- **THE BOOKIE** (bookie.js, core/harbor-bookie.js): ONE PENDANT LAMP over the desk (a green-glass shade on its cord) lighting the back wall
  behind him — he is a black shape on a lit wall now (the boxer's craft), a soft shadow under him, a bigger figure; the hook in the light;
  THE HAT THROW: snatched, wound up over his head, FLUNG in a high spinning arc across the lit wall, a bounce on landing (BAD timings
  stretched: the flight 1.3 s); his chain pulled to light the lamp. `&force=bookie-slam` starts the bad call with the force (the throw ~5 s
  later — ~7 s into a fresh load on the live site).
- **THE CRATE GUY — REWORKED** (crate.js): a STOCKY dock worker (scene-kit.js#man `build` 1.45 + `minW` 0.7: broad shoulders, heavy arms, a
  thick neck, the cap) and ONE CONTINUOUS MOTION — every job starts where + how the last one ended (`endsOf` along the plan; small jobs —
  wipe, count, swig, a look round — happen where he stands; lean + listen walk out + back; the pry + the bottle walk to the pile first,
  the job's clock squeezed ≤ 1.4× into what's left), a 0.7-s pose blend at every seam, turns eased in proportion to how far he turns, a
  walk that slows to a stop before a lift, THE WEIGHT (the knees soft + the back leaning under a crate, a dip to gather before a high
  lift, a bend to set one low). `tests/harbor-crate-motion.test.mjs` runs the REAL painter over a 2-hour shift at 30 fps: the worst joint
  step 0.024 of the pane (a walking foot), no facing flip on screen, no teleport — the old crate guy teleported 176 times (up to 0.4 of the
  window in one frame).
- **THE KIT** (scene-kit.js, every scene's figure): the limbs + the head foreshorten through a turn down to 2 % (a hand held forward slides
  to his middle as he faces us — never jumps across); the walk's stopped stance = stand()'s (a slowing walk never snaps the feet); the cap's
  brim slides round through a turn.
- **`&force=boss-shade`** (THE BOSS · 3 AM SHADE, the panel's TV ROOM): his 3 am bedtime on its own clock from the force — 1.5 s of the TV, the
  switch-off, his pull of the shade, the nightlight — within ~10 s of a fresh load (windows.js#bossSec → window-paint.js). Verified the
  real 3:00:03 moment runs (it lasts 6 s — the owner's 2:52 link was for the bar's first light). **`&force=shades`** (THE SHADES COMING DOWN,
  THE SCENES): the edge windows' shades pulled to the sill one after another from ~3 s.
- **shots.mjs**: `--sheet [cols]` (a burst as ONE labelled contact sheet) + `--crop win-<id>` (one speakeasy window).

### Group 2 — the test fixes at their causes
- **THE PARTY-SYNC FLAKE** (3 cloud runs: 104 / 65 ms vs the bound): the no-socket clock (firebase.js#syncTimeNoSocket) timed /api/time with
  Date.now() around `await fetch` — on a busy page (the bakes, a slow phone, the 2-core runner) the reply is PROCESSED late, the round trip
  looks lopsided and the offset is biased by ~−rtt/2, always the same way. Reproduced locally with `PS_CPU=6` (a diagnostic: kit.mjs
  open({ cpu })): −149 ± 150 ms, the timelines 153–168 ms apart. NOW each sample is timed by the browser's NETWORK clock (a
  PerformanceObserver on its Resource Timing entry — it sees entries even once the page's 250-entry buffer is full; requestStart →
  responseStart mapped onto Date.now()'s clock), up to 5 samples on idle turns, the shortest round trip kept, a refine round after the
  bakes → at 6× CPU the timelines 1 ms apart, the clock error 0 ms. The check prints each page's clock sample. (A first try — more samples +
  idle turns — made it worse: more pages sampled, each with the same bias.)
- **THE CALM LOAD**: (1) the premise — "calm" is a moment with nothing special on: a plain Thursday afternoon (9:30 pm is the evening's
  busiest stretch since WINDOWS); (2) the instrument — on this machine the test browser's software compositing pinned the frames at 50 ms
  under 2× CPU while the city's own work was 21 ms (a presentation cost a phone's GPU never pays): the check runs on the REAL compositor
  (kit.mjs#launchReal; the owner's TV is at 60 Hz since Nov 1) → tier 2, no step; if the display can't give ~60 fps it says so (a skip with
  the reason), never a failure.
- **THE LOAD HITCH** (WebKit 402×874 @3, a fresh load, `wkload2.mjs` in `C:\Users\benja\wk`): no stall anywhere — the worst single gap 232 ms
  on the reveal frame itself; the first ~1.5 s after the reveal ~30–50 % slower than steady (the reveal's crossfade) on the finale + a busy
  weeknight; the skull balloon by day clean. Nothing to spread (FR6 re-benches).

### Group 3 — THE DESKTOP CAMERA (core/harbor-layout.js#DESK)
The feasibility check (CLAUDE.md: rules that may collide — the bigger sign lowers the tagline, a closer camera makes the skyline taller,
the squeeze flattens the crowns): measured on the real layout, 1440×900:

| camera | squeeze s | word faces | person |
| --- | --- | --- | --- |
| before (the phone's scale + a 3.6× panorama) | 0.65 | full | ~20 pt |
| 1.65× closer, eye 7.5, near edge z 50 | 0.45 | −7 rows (two-line words → one) | ~38 pt |
| **1.4× closer, eye 8, near edge z 50 (shipped)** | **0.66** | **exactly the phone's** (a quay block trimmed ≤ 12 %) | ~33 pt |

- A wide screen is RE-FRAMED: F × 1.4 (easing to ×1 under ~220 pt of room — a phone sideways), the eye at 8 (13.5), the near edge at z 50
  (36.5) — the water + the skyline the picture, the promenade a shallow band running past the dock's top to the screen's foot.
- COMPOSED up to 2.2 : 1: wider, the composition frame starts at cam.cx0, the speakeasy at its left edge, a soft fade to dark beyond
  (css/title.css .nd-scene::after — 0 wide at ≤ 2.2 : 1). Everything that enters spawns past the REAL screen edge (it comes in through the
  fade). The sign ~1.25× bigger (594 pt at 1440×900; the wide media query).
- Wide-only fixes the lower eye needed: the billboard on a taller frame clear of the roof's guests + the string pole (the eye looks UP at
  the roof); the EMPIRE kept 3 pt over wordV (perspective had tied them); the wheel by the phone's own rule (the old fixed −30·k put it over
  the vertical word tower's face); the word faces exactly WORD_FACES; the billboard wins over a panorama sign (at 2560 both were dropped).
- Tests re-measured for the new camera (harbor.test.mjs: the 1440 rects, desktop people 28–44 pt, the promenade measured to the foot, the
  desktop's signs = the phone's + the billboard; holidayprops: the real centred dock — "beside the dock" counts).

### Group 4 — THE DESKTOP UI
- A MOUSE (components.css under `(hover: hover) and (pointer: fine)` — a touch screen never sees it): a pointer + a lift + a static glow on
  the dock, the corners, the menus, the sheets' buttons; over the city scene.hover() (no side effects — no spin, no sound) → the pointer + a
  glow ring on a game sign / the door (title.js#onHover, once a frame).
- Esc closes the topmost sheet (app.js — it was already there; now proven) + the ☰ menu.
- THE RESIZE: while the window changes the last frame is HELD at its built size + the whole layer (the canvas, the crisp lettering, the
  panes) scaled uniformly to cover, anchored bottom-centre (scene.js#pinResize — measured on the layer's untransformed size); the debounced
  re-fit draws sharp in the frame it lets go. A move to another pixel ratio re-fits (a per-frame devicePixelRatio read + the media query —
  emulated changes fire neither event).
- THE PIXEL BUDGET (harbor-tiers.js `sceneMp` 1.6 / 2.0 / 2.6 MP + budgetDpr — the scene + the fireworks canvases): measured with the GPU
  (title-perf --gpu), a 1920×1080 window on a DPR 2 screen held 60 fps at 2.6 MP (×1.12: p95 16.8 ms, 1 % slow) vs 20–24 % slow at 4.2 MP and
  8.3 MP uncapped; the crisp lettering stays at the full ratio; a phone never reaches it (402×874 at its 2× = 1.4 MP); an iPad (3.9 MP at 2)
  draws at ×1.64.
- The games (PRISM DROP, OVERCLOCK), the lobby + /board at 1440×900: nothing broken (the phone column centred; their own desktop look is
  their rework passes').

### Group 5 — sideways + iPad + the standing rule
- An iPad upright = the phone layout; an iPad or a phone sideways = the desktop framing, rotated live (the resize path). A phone sideways:
  the sign smaller + higher, the dock scaled 0.8 (the landscape-short query) — the city gets its strip.
- THE STANDING RULE (CLAUDE.md Ground rules + docs/harbor.md): phone first; desktop comes free; every pass checks 1440×900 (shots.mjs
  `--sizes pass`), sideways + iPad only in a desktop pass + FR6 (`--sizes desk-pass`; + `wide`, `ipad`, `sideways`).
- e2e-harbor **`desktop`** (the `models` cloud job): the wide camera, the sign, the dock, the signs, the hover, Esc, THE RESIZE (held +
  re-fit, a DPR-2 move under the budget, never a reload, the worst gap), 2.2 : 1 + the fade, the phone untouched, the iPad both ways, a
  phone sideways.

## The numbers
- **Phones unchanged**: pixdiff 390 / 402 / 430 (night, noon, golden) vs 97c6c16 (the commit before Group 3) = 1.58–2.31 % beyond the noise —
  the SAME as a control run with identical code on both sides (402 night: 2.18 % control vs 2.19 %): the sign faces + two window rooms follow
  the server clock and the main checkout's /api serves the emulator's leftover EVERYONE preview, which the worktree can't. Every change is
  behind `cam.wide` or a desktop / landscape-short media query; the e2e's phone check: F 600, eye 13.5, no fade, no ring, the sign 330 pt.
- **title-perf** (tier 2, 1× CPU): software canvas — 402×874 @3 vs 1440×900 @1: the party 12.5 / 11.7 ms of work, the finale 13.1 / 13.2, fog
  6.9 / 7.3, the blizzard 9.8 / 9.1 (fewer slow frames on the desktop); with the GPU: 402 @3 and 1920×1080 @1 both 60 fps (0 % slow),
  1920 @2 60 fps at the 2.6-MP budget (1 % slow).
- **Memory** (2560×1080): the bakes 86 MB (the phone 46) of the 160-MB budget, the guard stepped nothing; ~720–760 tracked canvases (the
  phone 541); at DPR 2 the tracked total 199 MB.
- **THE BASELINE GUARD**: a plain night 1.08×, the forced bus 0.87×, the dog walk 0.81× (≤ 2×).

## Decisions
- **The desktop camera 1.4× / eye 8 / z 50, not the closer 1.65×** — the feasibility check: 1.65× flattened the skyline (squeeze 0.45 vs the
  phone's 0.65) and cost the word towers 7 rows; 1.4× keeps both with the sign 1.25× bigger. No stop-and-ask needed: one setting keeps all
  three rules.
- **The pixel budget 2.6 MP at tier 2** (measured, above) — sharp enough with the crisp lettering at full ratio; an iPad draws at ×1.64.
- **The calm-load check on the real compositor** — software compositing (the TV-at-29-Hz fix) stays for every other check.
- **A phone sideways keeps the desktop camera with the zoom eased off** (its strip is ~150 pt) + a smaller sign + a compact dock.

## Known issues
- THE PARTY-SYNC fix is proven locally at 6× CPU; the cloud confirms on this pass's run.
- `match-sim.test.mjs` ("answer not stored in plain text") missed once in ~6 unit runs — a random-content check in a hidden game's simulation,
  untouched here.
- The resize's one re-bake at a new size costs ~0.43 s on this machine's software rendering (once, after the drag stops).
- The rest: harbor.md KNOWN ISSUES.

## Hand-off → SCHED
The window scenes + the desktop framing are done; SCHED moves the older timed systems onto THE CITY TIMETABLE (+ the rest of the scene.js
split, folded in) — its questions round + Grok's rebuttal first. THE SPEAKEASY BILLBOARD as a message board: remind the owner at SCHED.
