# LOAD FIX 5 — THE DOUBLED CITY (Nov 11 2026; plan.md "OWNER'S NOTES — NOV 11")

> The owner's iPhone, Safari, the first open of the day (8:30 am Eastern, fog, LOAD FIX 4 live): THE CITY SHOWED TWICE — the HOLD'EM
> billboard, EST. 1924 and the PRISM DROP blade each doubled + offset ([owner-iphone.png](load-fix-5/owner-iphone.png)). A short pass right
> after HOLD'EM's HE10. ONLY this — nothing else was started (HOLD'EM IN THE CITY is its own pass, next). No database rules changed, still
> 8 functions. The bible: [docs/harbor.md#performance](../../harbor.md#performance).

## Step 0
plan.md "OWNER'S NOTES — NOV 11" appended + decisions.md updated (a44ca905). The owner's screenshot copied to
`docs/harbor/passes/load-fix-5/owner-iphone.png` (docs/ is in .vercelignore — never deployed).

## Group 1 — REPRODUCED + FOUND (no fixes)

**What the screenshot says, measured.** The page between Safari's bars is 402 × 659 pt. TWO sets of layers at two cameras:
- the SHARP copies — the billboard's face, the EST. 1924 stone, the blade (+ the two bench plaques) — are THE CRISP LAYER's items, standing
  EXACTLY where a normal 402 × 659 load puts them (the billboard's corner at 13, 308 pt in the baseline; 14, 310 in his picture);
- EVERYTHING ELSE — the whole city canvas: the skyline, the roof signs, the wheel, the building, the trees, its own soft copy of the three
  signs — is that same picture SCALED 1.08× about the top middle of the page (measured from four pairs of points: 0.921–0.929 the other way;
  HIGH STAKES 15 pt lower + 13 % wider than the baseline, NEON PAR cut off at the right edge).
A uniform scale about the top middle is what `css/title.css` does to a canvas whose box is TALLER than it was built for
(`.nd-scene canvas { object-fit: cover; object-position: 50% 100% }`): 712 / 659 = 1.0804. So: **the city was BUILT for a 402 × 659 box and is
SHOWN in a 402 × 712 one, with no resize pin** — the crisp lettering (placed in px at the built camera) stays, the canvas stretches under it.
And it is STABLE: his dock + tagline had faded (the screen at rest — 15 s with no tap), the picture still doubled.

**The tool.** `tests/integration/wk-double.mjs` — NO TWO CAMERAS in Safari's engine (Playwright's WebKit, 402 × 659 @3 — his page — his
morning: Nov 11 8:30, fog). Each path watched on EVERY frame (`kit/load-probe.mjs#CAM_REC` + `camJudge`: the bake / the lit windows at
another camera, the canvas CSS-fitted to a box it was not built for with no pin, more than one scene) AND by PIXELS at its key moments (the
crisp lettering hidden for one screenshot: the copy the city paints under the billboard / the date stone / the blade must sit AT the crisp
item; a best match elsewhere = the second copy, in pt). The city's box is changed by a style — a box change with NO window resize, which is
what a late or changed `100lvh` is; the visibility is faked (Playwright can't background a tab); the clock (the phone's AND `/api/time`) can jump.
(A test hook only, no behaviour change: `crisp.js` names its canvases — `data-item`.)

**REPRODUCED** — [owner-vs-repro.png](load-fix-5/owner-vs-repro.png) (left: his page; right: WebKit): the box grows 659 → 712 **before the
reveal**, no window resize → his picture to the point (two billboards, two date stones, two blades, the benches, NEON PAR cut), on every
frame, for good. The pixel check: the billboard's second copy 12 pt left + 27 pt down (his: ~15 + 25).

**The runs** (the unfixed code, 13cd99a8 = HE10's tip; every path once per matrix, two full matrices + the partial re-runs — 43 path runs):

| path | what | frames | pixels | verdict |
| --- | --- | --- | --- | --- |
| plain | a normal load | 98–102 seen, 0 bad (4 runs) | one copy | ✓ |
| **box-pre @50 / @250 / @600** | the box 659 → 712 that many ms into the boot, before the reveal, no window resize | **99–103 of 99–103 bad** (8 runs) | **the billboard's copy −12, +27 pt** | **✗ THE OWNER'S — stable, never heals** |
| **box-pre-shrink** | 712 → 659 before the reveal | **101–103 of 101–103** (2 runs) | two copies | **✗ stable** |
| **restore** | away to another page + BACK, the box growing as it comes back | **101 of 101** (2 runs) | two copies | **✗ — Playwright's WebKit RELOADS on BACK (pageshow persisted = false): the same boot-time hole** |
| box-post | the box grows 3 s after the reveal | 137–139, 0 bad | one copy | ✓ held 450 ms, one cut |
| box-return | hidden 6 s, the box grows as the page is shown again (a FROZEN tab resumed) | 283, 0 bad | one copy | ✓ held, one cut |
| **box-hidden** | the box grows while hidden, shown 6 s later | **23 of 297** | one copy (H alone moves nothing in the portrait camera) | **✗ the held picture let go on the first frame back** |
| **bfcache** | pagehide (persisted) + hidden → the box grows → visible + pageshow (persisted) | **23 of 296** | one copy | **✗ the same** |
| **resize-hidden** | the whole viewport 659 → 712 while hidden 6 s (the dock moves: the camera really shifts) | **20–21 of 280–284** (2 runs) | **the billboard's copy 47 pt away, 1 s after the return** | **✗ ~2 s doubled after the return** |
| **hours-box** | hidden 6 s, the clock +10 h, the box grows | **19 of 243** | one copy | **✗ the same** |
| hours | hidden 6 s while the phone's + the server's clock jump +10 h (morning → night) | 230–238, 0 bad | one copy | ✓ the light + the sky catch up at ONE camera |
| wx-late | the real clock: yesterday's CLEAR kept, today's FOG lands 2.5 s after the reveal | 188–189, 0 bad (2 runs) | one copy | ✓ a slow blend at ONE camera |
| bars-pre / -after / -late | Safari's bars as a window resize (659 → 712 → 659), the box pinned at the large viewport | 100–170, 0 bad (2 runs each) | one copy | ✓ the city kept |
| resize-post | the whole viewport 659 → 712 after the reveal | 144–147, 0 bad (2 runs) | one copy | ✓ held, one cut |
| tier | a tier step down 3 s after the reveal, back up 3 s later | 177–180, 0 bad (2 runs) | one copy | ✓ the tier alone moves nothing |

(WebKit headless at 3× paints ~12 frames a second here: 100 frames ≈ 8 s. The first matrix read ONE "bad" frame on box-post / box-hidden —
the probe's own: it read the box in a frame callback, the scene pins it in a ResizeObserver — after the callbacks, before the paint. The
probe now reads what was PAINTED. A second false read — the windows' night scenes, which have nothing painted under them — went with the
pixel check reading only the three signs by name.)

**THE CAUSES — two, both in `js/screens/harbor/scene.js`:**

1. **THE BOX BEFORE THE REVEAL (the owner's picture).** The city's box is `100lvh` (`.nd-scene.nd-lvh` — Safari's bars never resize it). The
   city notices a box change two ways: the window's `resize` event, and — THE LOAD FIX — a ResizeObserver on the layer ("WebKit changes the
   box a frame before the event"). The observer **returns at once before the reveal** (`shownAt < 0` — it was written for the resize PIN,
   which only matters once the city shows). So a box that changes during the boot with NO window `resize` — the large viewport (`lvh`)
   settling while the visible one (`innerHeight`) stays at 659 — is seen by nobody: the canvas stays built for the first box, CSS
   cover-fits it into the new one, and **nothing ever compares the two again** (the reveal's gates don't; `maybeRelayout` re-lays from the
   title's rects, never re-measures the canvas). It heals only at the next real resize / rotation / tier step (`build()` re-measures) or a
   reload that boots clean. It also explains "intermittent, first open of the day": it needs Safari to still be settling its large
   viewport while the page boots — a cold Safari launch restoring the tab.
2. **THE HELD PICTURE'S SAFETY ON THE WALL CLOCK (a restored / backgrounded tab).** A camera change that lands while the page is hidden
   (a bfcache'd or backgrounded tab whose viewport changed) starts the hold correctly — but `HOLD_MAX` (4 s, "lets go regardless") counted
   `performance.now()`, and no frame runs while hidden: back after more than 4 s, the FIRST frame lets the held picture go with the new
   camera not baked — the old bake under the new live layers + crisp lettering for the whole re-bake (~2 s here; longer on a phone at 3×).
   LOAD FIX 4 moved the boot's gates to visible time; this one was missed.

**Was it Safari restoring the tab?** The tab's page was not ALIVE from yesterday: a live page (frozen, resumed, or back from the bfcache)
goes through the hold — one camera, or cause 2's ~2 s — and never gives a STABLE double. His picture needs a fresh BOOT with the box moving
under it, which is what a cold Safari launch does to the tab it restores: it RELOADS it while its bars / large viewport settle (the numbers
fit: built for 659 = the page between the bars, shown in 712 = the large viewport). Proven in WebKit for the mechanism (the box before the
reveal → his picture, exactly); that iOS delivers that box change with no `resize` event at launch is the inference — it can't be driven
from Playwright (its WebKit has no Safari bars and reloads on BACK), so the owner's 3-step iPhone check is the confirmation.

**Every place the camera / the box / the bake can change, and its gate** (read through, before the fix):

| change | where | through the hold? |
| --- | --- | --- |
| a window `resize` (rotation, a desktop drag, the bars without lvh) | `onResize` → the pin → `build()` → `layout()` | ✓ `holdStart` in `layout()` |
| the box with no `resize` (WebKit's early box, a late `lvh`), after the reveal | the layer's ResizeObserver → `onResize` | ✓ |
| **the box with no `resize`, BEFORE the reveal** | the ResizeObserver returns (`shownAt < 0`) | **✗ nobody — cause 1** |
| the pixel ratio (another monitor) | `matchMedia` → `onResize` | ✓ |
| the title's rects moved (a late font, the dock) | `maybeRelayout` → `layout()` | ✓ (a bar move within 2 s: the city kept — no camera change) |
| the safe area's bottom | `safeBottom` → `layout()` | ✓ |
| a tier step (down, up, the resolution back) | `scene-perf.js` → `build()` | ✓ (the tier alone moves nothing; a box that changed is caught here) |
| the construction tower's stage | the frame loop → `build()` | ✓ |
| measured before the first bake / the reveal | `layout()` before the reveal | nothing shows yet |
| a new look (the weather, the light, a holiday, the board, the hours gone by) | `rebake()` — the same camera, a crossfade | not a camera change |
| a memory re-bake (iOS dropped a canvas; `starved` → a tier step) | → `build()` | ✓ |
| **a hold older than 4 s on the wall clock** | `holdTick`'s safety | **✗ lets go unbaked after a hidden spell — cause 2** |
| a second scene / canvas set / frame loop | `title.js` mounts ONE `createHarbor`; the loop has one `raf` handle | ✓ (1 scene, 1 main canvas in every frame of every run) |
