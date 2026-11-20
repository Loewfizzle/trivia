# HIGH RISE — S4A FIX 2: THE ON-PHONE TRACE + THE LANDING FRAME + FLYERS ON REAL TIME + GROW-BACK FINAL (Nov 19 2026 — on the Beelink)

The owner's decisions: `docs/games/plan.md` "HIGH RISE — S4A FIX 2". The game's page: `docs/highrise.md` ("THE TRACE", "THE LAG
RULES" 8, "THE FLYERS", "THE SOUNDS"). No rules change, no `/api` change — nothing to re-publish. Nothing counts (the switch stays OFF).

| group | what | commit |
| --- | --- | --- |
| Step 0 | the decisions into plan.md; the Lab's marks re-exported (no open FIX mark) | 92a16e52 |
| 1 · 2 · 3 · 4 | THE ON-PHONE TRACE · THE LANDING FRAME · FLYERS ON REAL TIME · GROW-BACK FINAL | 0f574c6b |
| close | the fresh-eyes review, the docs, the final run | (the tagged push) |

THE ADD-ON INBOX: no entry for this pass at its start. Two arrived during it (6:22 pm + 6:35 pm — THE END SCREEN = JAYWALK's STANDARD,
its colours as real neon), addressed "its LAST group ONLY if it fits the ~1.5 h box, else S4B builds it as Group 0": the pass was past
its box when they were read (after Groups 1–4's commit) — **both stay OPEN for S4B's Group 0** (named in the summary).

## 1 · `?trace=1` — THE ON-PHONE BREAKDOWN (`js/games/highrise/trace.js`)
The owner's iPhone counts HITCH 95–114 a long run, the biggest named cause `tap` (a stall right after a touch); the Beelink can not make
an iPhone stall. So the phone measures itself:
- **every frame timed in PHASES** with `performance.now` — `tap` (the touch handler: the engine step) · `engine` (the frame's step) ·
  `fx` (the tower's feed + the view's events) · `audio` · `view` (the camera, the plates, the boxes) · `flyers` · `render` · `bloom` ·
  `hud` · `other` — into typed arrays made once (`acc`, the worst five's gaps / floors / events / phases): a frame builds nothing.
- **the record a gap is charged to** = everything the page's own code did since the frame before began (that frame's phases + any touch
  handled after it). What the code did not take of the gap, past one usual frame, is **browser** — a collection, the browser's own
  style / layout / paint, the GPU, the compositor — never guessed at.
- **THE END CARD** (the test page): under the stats strip, 12 px mono on a dark plate (400–533 px at 390 × 844; the PLAY AGAIN bar at
  748): `TRACE · 5 WORST FRAMES OF n`, then each — total ms · `F` the floor · what happened (land · perfect · cut · seam · flyer · grow ·
  out · plate · compile · decode · later = the landing's deferred work ran) · its top two phases — and `> 33 MS: n — browser 4 · render 2
  …` (a frame over 33 ms AND 1.5 × the phone's usual frame — Low Power Mode's 30 Hz is no stall). `window.__hiPlay.trace()` = the same as
  data + every landing frame's own work (`land` mean · p95 · max) + every touch's.
- **Off** (no `?trace=1`): `TR = null` and every call site is one `if (TR)` (pinned: `tests/highrise-s4a-fix2.test.mjs`).
- **The cartridge:** its end is the console's podium (`final.js`), not the stage's card — not trivial, so not there (a named call: the
  test page is the owner's measure).

## 2 · THE LANDING FRAME
**Measured first** (`tests/integration/highrise-landing.mjs` — Chromium at 4× CPU, 390 × 844 @3, 40 s, `?trace=1`, a bot touching each
slab on its perfect moment, every 9th early: a cut — its piece + its sparks; from floor 30, the flyby then the UFO in the window):

| Chromium 4× CPU, 40 s | BEFORE (0f574c6b's trace on the old frame) | AFTER |
| --- | --- | --- |
| a LANDING frame's own work, mean | **2.30 ms** | **1.66 ms** |
| … p95 · max | 3.9 · 7.6 | 2.4 · 3.5 |
| its phases (mean ms) | fx 0.45 · hud 0.24 · render 0.76 · bloom 0.36 · view 0.19 · flyers 0.19 | fx 0.18 · hud 0.01 · render 0.68 · bloom 0.41 · view 0.19 · flyers 0.06 |
| a plain frame's own work, mean | 1.68 ms | 1.68 ms |
| the touch (its engine step + its sounds) | 0.45 ms (p95 0.8) | 0.41 ms (p95 0.7) |
| Chromium's own style recalcs over the run | 589 (18 a landing) | 625 (20 a landing — the same writes, spread over three frames) |

The landing frame is now LIGHTER than an ordinary one. The JavaScript of a landing was never large on a desktop core even at 4×: on the
iPhone the `tap` stalls are most likely the BROWSER's own work after a landing's DOM writes (the big glowing number's repaint, the
announcer's restyle, the tags' transitions) all landing in the same frame as the touch — that is why they are now SPREAD over three
frames, and why the trace names `browser` apart: the owner's screenshot will say which it is.

**What moved off the landing frame** (docs/highrise.md "THE LAG RULES" 8): on it now ONLY the slab snapped into place (+ the overhang
piece beside it — one box record; a named call: drawing the slab cut without its lost half for a frame would flicker) and its flash; its
sound already started IN THE TOUCH (S4A's SOUND SYNC). The HUD's moments (the announcer, a band's arrival, YOUR BEST / a friend crossed,
a flyer's start, their extra sounds) → the NEXT frame, read off the run's kept events (`stage.js LATER_MOMENTS`); the big number + the
band's name → two frames after (`LATER_NUM`; a flyer's model fetch / THE MOTHERSHIP's hull build too); the right-edge tags → three
(`LATER_TAGS`); a perfect's ring, grow-back's ring and a cut's spark burst → jobs for the next frame (`night.js` — a queue of 8 slots, its
numbers in one typed array). **PREWARM:** the falling pieces' TURNED boxes (their matrix path) in THE WARM FRAME, every announcer length's
animation made ahead + the band's swell kept (a first PERFECT / STREAK / NEW BEST builds nothing); every program was already built there
(the perfect / streak / tape variants are uniforms of the same programs). **Only the changed ranges go to the GPU** — the boxes drawn
this frame, the sparks written since the last, the lights lit (three's own kept `_updateRange`: its `addUpdateRange()` makes a new record
at each call — garbage in a frame). **A static scene:** no mesh composes its matrix a frame (`matrixAutoUpdate` off; a tape's matrix is
set when it is laid, a flyer's when it moves), the scene is walked ONCE a frame (`draw` → `scene.updateMatrixWorld()`), not again by each
of the bloom's passes. `frustumCulled` was already off everywhere. The root class `is-gold` (NEW BEST) stays on the stage — once a run,
not once a landing.

**Left, named:** the first frame a flyby's jet flies runs its flight code cold (`flyers` 7 ms at 4× CPU, ≈ 2 ms on a real core, once a
run, never a landing frame).

## 3 · FLYERS ON REAL TIME — THE UFO's JUMP
**The cause:** a flyer keeps to a band of sky — the HUD's foot … THE DROP ZONE's upper edge — and that lower edge was the zone AS THE
CAMERA SAW IT NOW (`zoneFrom(false)`). A landing moves the top slab up a floor AT ONCE while the camera eases after it (140 ms): the
zone leapt a floor's height up the screen and eased back — and the flyer, placed in that band, with it. Every landing. (The camera's
own kick never moved a flyer: they are placed in the camera's own frame.)

**The fix** (`night.js`): the band's lower edge = the zone as it will stand once the camera RESTS on the top slab (`zoneFrom(true)` —
constant but for the top slab's size), eased over 0.6 s through a cut; a flyer's clock = the frame's own timestamp (`IO[2]` — real time:
a slow frame is a longer step along the same curve, never a skip or a catch-up).

**THE TEST** (`tests/integration/highrise-flypath.mjs` — Chromium + Playwright's WebKit as an iPhone, 390 × 844 @3): a bot touches every
slab on its beat while each flyer crosses (THE BLACKBIRD · the F-22 pair · THE UFO · THE MOTHERSHIP's solo pass); `flyers.js#path`
records every drawn frame's flyer place ON THE SCREEN (its path point through the very camera that frame draws with) + the frame's time;
each sample is set against its neighbours interpolated BY TIME. FAILS over 1.5 px. **The old rule put back (proof): the UFO 4.93 px,
the F-22s 5.43 px — FAIL. Now:** Chromium ≤ 0.003 px (the pass 0.028), WebKit ≤ 0.031 px (the pass 0.219 — WebKit here is software GL
at ~21 fps: every frame "slow", the path still smooth); 2–7 landings in each flight.

## 4 · GROW-BACK FINAL
Take 1 — "Heal Restore" by Qvantor (Freesound 878621, CC0) — renamed `audio/highrise/grow-back.mp3` (`HI_SFX_REV` 3: a phone fetches it
fresh). Takes 2–5 deleted with their CREDITS lines (take 4's CC BY 4.0 line + LICENSE.txt's exception too); `sounds.js` lost its takes
switch; THE SOUNDS sheet is a plain PLAY list again (no 1–5 chooser, no COPY MY PICK); `sfx.js` clears S4A FIX's old pick key once.

## THE FRESH-EYES REVIEW (a subagent that did not build it — the trace panel's shot + the flyer test + the code)
The panel: readable at 390 × 844 (12 px mono, a dark plate, ~215 px clear of the PLAY AGAIN bar); the gap rule sound; nothing made when
off. **Three finds, all fixed:** (1) the job queue's overflow path wrote a spark burst's numbers into the LAST slot while that slot's own
job was still waiting → a spare slot past the queue (`jArg` = (JQ + 1) × JN); (2) the trace never closed the frame where the run ENDS
(it was counted by the state as it CLOSED — over) → a record is counted by the run's state as it OPENED (`trLive`): the miss's frame is
in; (3) the flyer test dropped only perfect slabs — never a CUT, the case the band's 0.6 s ease is for → every 4th touch 30 ms late
(1–4 cuts in each flight; still ≤ 0.044 px). Also found in the final run (mine): Group 4's edit left a dead `take` argument on the
sounds' LATE path — a ReferenceError caught silently (a sound asked before its decode would never have played late; each throw an Error
object: the game's own garbage 7.1–7.8 → **4.6–4.7 KB a second** once fixed). Noted, not changed: the flyer test records the PATH point
through the drawing camera (what the bug moved), not the mesh's own matrix.

## THE FINAL RUN (the Beelink, nothing else busy)
- unit: **2,343 / 2,343** (`node --test tests/*.test.mjs` — the new `highrise-s4a-fix2.test.mjs` 5 included)
- `highrise-play.mjs` **236 / 236** · `--webkit` **6 / 6** · `highrise-lab.mjs` **45 / 45**
- `highrise-alloc.mjs` (THE GUARD) **8 / 8** — the game's own code 4.7 (night) · 4.6 (day) KB of objects a second, three.js 32.1 · 10.8
- `highrise-landing.mjs` **7 / 7** (the measure above + the trace panel) · `highrise-flypath.mjs` **26 / 26** (Chromium + WebKit)
- `sound-sync.mjs` **42 / 42** · `e2e-highrise.mjs --fast` (the emulators: the hidden cartridge end to end) **50 / 50**
- `e2e-smoke.mjs` **25 / 25** (THE PAGES LOAD: /, /admin, /board, /lab, /daychart — Chromium + WebKit)
- REPLAY = LIVE ✓ in every run of the browser checks; the judge (`proof.js` / `api/_lib/highrise.js`) untouched.
- Shots: `Downloads/NEON/highrise-s4a-fix2/after/trace-end-390x844.png` (the panel) · `…/before/` (the same, before Group 2).
- Every server this pass started (the plain server, then the emulators + `serve.mjs --emu`) is stopped at its end.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change, no `/api` change). Nothing counts.
2. **YOUR PHONE CHECK — THE TRACE:** https://neonspeakeasy.com/highrise-play?trace=1&fps=1 — a long run (or
   https://neonspeakeasy.com/highrise-play?floor=80&trace=1 — the UFO in the window), then screenshot THE END CARD's panel: the 5 worst
   frames with what happened + their top two phases, and the counts over 33 ms by phase. If `browser` tops it, the stalls are Safari's
   own work (paint / a collection), not the game's code — the next pass then trims what the browser paints (the glows on the big number,
   the announcer); if a phase tops it, that phase is the target.
3. **YOUR PHONE CHECK — THE UFO:** `?floor=80` — the UFO should glide straight through every landing now (the jump's cause is fixed).
4. **Named calls, yours to overrule:** the overhang piece is still drawn ON the landing frame (the slab's own other half; without it the
   slab would show cut with nothing falling for a frame) · the HUD number lands 2 frames (≈ 33 ms) after the slab, the tags 3 · the
   trace panel is on the TEST PAGE only (the cartridge's end is the console's podium) · the grow-back file is now `grow-back.mp3`.
5. **THE ADD-ON INBOX, still OPEN → S4B Group 0:** THE END SCREEN = JAYWALK's STANDARD (6:22 pm) + its colours as real neon (6:35 pm) —
   both marked "only if it fits the ~1.5 h box"; this pass was past its box when they were read.
