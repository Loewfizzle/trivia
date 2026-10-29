# FP — FOREGROUND POLISH (Oct 23 2026; the promenade re-layout, the billboard, the stop lights, the barber pole, the sounds; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## FP — FOREGROUND POLISH (Oct 23 2026; the promenade re-layout, the billboard, the stop lights, the barber pole, the sounds; behind `?city=2`)
The owner's iPhone review of 8a: the trees, the cart and the cobbles gorgeous, the haze gone — but the promenade CRAMPED (almost everything
in the middle of a thin strip, no open floor). This pass re-lays it and fixes the speakeasy corner; every piece's art kept. Four helpers ran
next to the lead (the beat, the sounds + the panel, the stop lights, the billboard + the pole); the audio detail is in docs/audio.md#fp.

### 0. The beat after returning → docs/audio.md#fp--the-beat-from-the-songs-position
The beat already followed the element; the readout's `bar` was a count since the page opened (≈ the context's age — why it matched `ctx t`).
Now a pure SONG CLOCK on the element's currentTime (re-anchored on every play / pause / seek / stall / visibility / rebuild, and when it drifts
> 30 ms), the song's own bar + beat on the readout with `drift ±N ms`, and the HEARD OFFSET (are the kicks through Web Audio off the grid?).

### 1. THE PROMENADE RE-LAYOUT (`core/harbor-promenade.js#PHONE`, `stage.js`, `props.js`)
FURNITURE ON THE EDGES, AN OPEN FLOOR IN THE MIDDLE, THE FRONT EDGE CLEAR. At phone size the strip is only ~70 pt deep (402: the road's kerb
y 682 → the dock 758), so depth stacks on screen — the rules that decided it: no curb tree in front of the two stop lights, the lantern or the
crossing's landing (f ~0.58–0.76); the framing maple's crown covers the right quarter (whatever stands behind it is hidden).
| band | z | what (x pt at 402) |
| --- | --- | --- |
| THE BACK ROW (the curb) | 50.4–53.1 | maple 150 (beside + behind the blade) · tall double lamp 183 · maple 204 with THE BENCH under it (z 50.4, in the lamp's cool light) · [the crossing's landing 246–290, open] · tall double lamp 312 |
| THE OPEN FLOOR | 38.4–50 | clear cobbles from the shopfront to the right edge; THE MEDALLION at its centre (197, z 43.4 — roughly under the wheel); THE CART on its open right side (268, z 41.8, in front of the crossing); THE URN against the speakeasy's corner (152, z 45.6 — beside the side wall, never in front of the door or the shop window) |
| THE FRONT EDGE | 36.6–38.2 | only two short warm globes, one at each corner (129 by the speakeasy's corner, 387 by the right edge) + ONE big framing maple at the far right (357, crown ±43, clear of the cart) |
- **Changed from the sketch (the screen's numbers):** the sketch's curb PLANTER is gone — it would stand hidden behind the framing maple; the
  ONE crafted planter is the corner urn ("fewer planters, better ones"). The crabapple is no longer on the phone (the approved row is
  maples) — it stays in the code for the panorama's front row, so spring has no pink blossom on a phone today (easy to bring back: the
  curb maple by the blade could be the crabapple).
- **THE URN** (`props.js#drawPlanter`, the 8a box replaced): a 1920s Deco garden urn in the speakeasy's cream terracotta on a square two-step
  plinth (a recessed panel with a carved fan, moss at the foot) — a turned foot, stem + knop, a GADROONED bowl (14 lobes, each crest + groove
  lit by its own normal), a fillet, a carved CHEVRON frieze, a rolled lip; every band a lathe surface (lit side → core shadow → bounce),
  speckle, rain streaks, chips. Planted like a gardener fills an urn: a THRILLER (autumn purple fountain grass + plumes, summer a dracaena
  spike, spring tall white tulips, winter red-twig dogwood), FILLERS (the season's flowers as clusters with leaves — the mums without the kale
  rosettes, which read as "eyes"), SPILLERS (ivy trailing over the lip and hugging the bowl; summer + white bacopa; winter cedar sprigs); no
  bare soil (the inside of the lip is shadowed leaves). Its cast shadow follows the urn's shape.
- **THE BLADE IN FRONT OF THE TREE** (`speakeasy.js#bladeStep`, `scene.js#rebake`): the furniture beside the side wall was baked after the
  WHOLE speakeasy, so a curb tree behind the blade covered it. The blade is now its own bake step, after that furniture.
- **THE PEOPLE** (placeholders, `harbor-layout.js`): on the open floor — the couple window-shopping at the barbershop, the doorman left of the
  side door (the corner globe at its right), the dog walker crossing the floor, the hail at the crossing's landing.
- **THE NIGHT LIGHT PLAN** (`stage.js#LIGHT/REACH/lightSources`, baked into the setts as in 8a): cool pools under the two tall curb lamps
  (reach 6.2 → 10.5: the back row, the road's edge, the bench), warm pools from the two corner globes (5.6 → 7.6) across the front of the
  floor, the speakeasy's warm spill (3.6 → 4.2), the CART's string-light glow on the cobbles (new: warm, 6), the medallion where they
  overlap; dim violet-grey (never black) between, no haze. **THE BENCH READS AT NIGHT:** its lamp stands behind it, so its faces got no light —
  `props.js#lit` adds a BOUNCE off the lit cobbles (every face near a pool gets a soft fill of the lamp's colour).

### 2. THE SPEAKEASY CORNER (`core/harbor-layout.js#BILLBOARD`, `signs.js#buildBillboard`, `speakeasy.js`)
- **THE BILLBOARD on a SHORT, CLEAN frame:** the open frame under the board 0.95 → 0.5 units (~⅛ of the board's 3.7); at 402 the board
  24 → 99 pt across, 504 → 544 down, the frame ~5 pt, the board's foot 3.4 pt above the string lights' posts. A dark backing under the board
  (the brick city no longer shows through), five posts + a Warren truss of diagonals + a mid tie on the dunnage beam (base plates, short posts
  to the deck), a soft shadow on the roof (mostly hidden by the parapet), the catwalk + ladder + the four lamps unchanged. Inside the left
  edge at 390 / 402 / 430 (x 23.6 / 24.3 / 26.0), clear of the wheel + the word towers (tested). The stair bulkhead + the chimney moved out
  from under it (u 8.1–9.9 / 10.5: a small stair house at the right corner of the roof).
- **THE BARBER POLE AT NIGHT, smooth + bright:** the stepping came from hard-edged stripe shapes re-drawn at a new spot each frame (a 2.3 pt
  pole moving ~1.6 pt a second crawls pixel by pixel, worse at 30 Hz). The stripes are now real helices painted ONCE into a strip texture
  (3 px a pt), slid under the glass by a fractional amount each frame (`poleTurn`, `POLE_DAY` / `POLE_NIGHT`: the same phase at 60 + 30 Hz,
  tested). At night a warm WHITE glass (`POLE_LIT`) with a brighter core + a two-layer soft halo — the hero light of the shopfront; the lit
  shading's grey middle stop removed. The DOOR SCONCE (core 1 → 0.55, wash 0.35 → 0.16) and THE SHOP'S LAMP (glow 0.5 → 0.26, bulb 0.8 → 0.65)
  toned down, both a soft round falloff (`softGlow`, no hard edge). The raid still snaps the pole dark (`pole({ on: false })`).
- **BUSY CHECK (402, night):** the lower billboard calmed the corner a lot; on party nights a light blade (e.g. OVERCLOCK) was still the
  biggest warm slab, so **the blade's lit board is dimmer at night** (× 0.78, `BLADE_LIT`; its lamps' wash 0.22 → 0.16; the bulbs unchanged) —
  the 8a suggestion, easy to reverse.

### 3. THE STOP LIGHTS + THE CROSSING (`road.js#signalSteps`, `drawSignalLamps`, `drawLanternBody`, `drawLantern`; `core/harbor-promenade.js`)
- **The heads face ALONG the road:** a 1920s two-way head seen side-on on a cast-iron post (brass collars, a domed cap + finial, a hinge line
  + rivets), three hooded lamps each side pointing along the road; the lit lens under its hood with a white-hot centre, its glow spilling
  along the road (small by day, long after dark). ~5.3 × 20 pt a housing, ~15 pt across with the hoods.
- **THE WALK / WAIT LANTERN** on the far side, facing us (`LANTERN`, `L.crosswalk.lantern`: at the railing, the middle of the crosswalk's far
  end — the gap between the tall lamp and the curb maple): a period box (a post, a pitched cap + finial), WAIT over WALK, ~22 × 27 pt, letters
  6.7 pt; baked into the road layer (a passing bus hides it), the lit pane live (WAIT red-orange, WALK pale green-white). `roadTop()` reaches
  its cap (the road band ~45 pt taller).
- **ONE CYCLE on the city's clock** (`signalAt(ms)`, PURE — every phone the same; both heads show the same: one road; 8b's traffic + people use it):

  | phase | s | road | lantern |
  | --- | --- | --- | --- |
  | go | 24 | green | WAIT |
  | amber | 3 | amber | WAIT |
  | clear | 1.5 | red | WAIT |
  | walk | 11 | red | WALK |
  | blink | 5 | red | WAIT blinking (1 Hz, 55 % on) |
  | hold | 1.5 | red | WAIT |

  `harbor().crossing`: the state, the lantern's box + panes, the heads.

### 4. THE SOUNDS → docs/audio.md#fp--the-sounds
The water ~10 dB quieter with a 1.6 kHz low-pass, the whole bed ducked under the music and waiting for the song to start, the hums lead,
the gulls in varied runs, the cars a touch lower.

### 5. Small fixes
- **PULSE STRENGTH default 175 %** (`core/harbor-beat.js#PULSE_DEFAULT = 1.75`, the owner's slider value); the slider stays.
- **THE DEBUG TOOLS IN THE PANEL** (`js/ui/debug-tools.js`; THE PREVIEW PANEL → TOOLS → "ON THIS PHONE — REMEMBERED, NO LINK NEEDED"):
  READOUT (the green box) + AUDIO PANEL, each on / off live, remembered on this device (`localStorage na:dbgtools`), never sent to
  EVERYONE; `&debug=1` still shows both (a switch flipped during the visit wins for that visit). `diag.js#unmountAudioDiag`; `app.js` mounts /
  unmounts the AUDIO panel live.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Noon `2026-10-22T12:30`, golden hour `T18:20`, night `T22:00`, party `2026-10-24T23:00`; the sound check: the night link + `&force=road-pass`.

### Tests (FP)
`harbor.test.mjs` (131): THE RE-LAYOUT on three phones (the back row clear of the stop lights, the lantern + the crossing's landing; the floor
holds only the medallion, the cart + the corner urn; the urn against the side wall, clear of the door; two corner globes + one framing maple
clear of the cart; the bench by a tall lamp); the trees with the panorama's crabapple; the props (the urn in every season + look); the
billboard's short frame (> 0.05, ≤ ⅙ of the board, its foot 1.5–6 pt over the string lights at 390 / 402 / 430); the pole's turn (60 vs
30 Hz, sub-pixel, the wrap); the crossing's cycle + the lantern on the phones; THE SONG CLOCK + THE HEARD OFFSET; the pulse at 175 %;
`city-sounds.test.mjs` (the bed's levels + duck / hold, the gulls' pattern, the debug switches). e2e-harbor: `promenade` (THE POOLS now beside
the left globe, read once the frame is steady — right after the bake settles the city is still fading in: 9 → 106 over ~4 frames; the
crossing + the lantern's lit pane), `speakeasy` (the pole's glass brighter than the sconce + the shop lamp, its turn, the raid), `music` §11
(the element paused / the context suspended / a seek — the beat on the song's grid; `drift` on the readout), `sounds` (the water's low-pass,
the duck), `panel` (175 %, the tools). The whole suite: 260 / 261 (below); the unit suite 525; the smoke check (GAMES=cipher — `app.js` is
shared): 3 / 3.

### Performance (A/B in one run, `title-perf.mjs --ab` against e2190f7, 390×844, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | 5.59 → 4.31 · 6.16 → 3.46 · 2.52 → 4.18 | 16.8 · 0 % both | same ×3 |
| `np-night` (4×) | 9.1 → 5.2 · 3.93 → 4.31 · 2.61 → 2.77 | 16.8 · 0.7 → 0.4 % | same ×3 |
| `np-party` (2×) | 9.41 → 9.77 · 5.05 → 5.51 · 3.5 → 3.93 | 33.2 (t2) / 16.8 · 5.3 → 4.6 % | same ×3 |

Everything new on the promenade is baked (the urn, the pools, the lantern's body); per frame: the signal lamps' glow, the lantern's lit pane,
the pole's strip blit.

### Known issues (FP)
- e2e-harbor's `water` NO SEAMS (tier 2) sits on its limit in the parallel run (the meeting rows 99.1 % vs the rest 100.7 %, the limit
  1.5 points; the commit before: 99.4 vs 100.3) — it passes run alone; the new light in that band (the lantern, the signals' glow) is the
  likely nudge. Not a seam (no strip boundary moved).
- The heard-offset SKEW path is proven only in the pure test (no browser here can offset Web Audio from the element); WebKit's currentTime
  after returning is unverified — the owner's next readout (`drift`, `clock el`, `heard`) tells.
- No crabapple (no spring blossom) on the phone; no curb planter (it would be hidden).
- The cart's umbrella covers the crossing's near end; the tall lamp at 183 stands under the wheel's deck.
- The bulkhead + chimney moved on the roof (no test pins them); 7b's rooftop life plans round the new spot.
- The lit signal lens is a ~3 × 5.6 pt sliver: it reads mostly by its glow; at night the lantern's iron body is a silhouette (the lit word
  carries it).
- A half-resolution full-screen layer late in the frame dims the pole ~19 % — the e2e compares the lights against each other.
- Only the BED ducks under the music (the sky loops + the one-shots don't); the levels are LUFS arithmetic, not listened to; the "waits for
  the music" hold is unit-tested only (headless Chrome's music sounds at once).
- ~~The bench reads as a dim silhouette at night~~ (8a) — fixed (the bounce light + the tall lamp beside it).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
8b: the CYCLE is ready (`signalAt` — stop on red, cross on WALK, the lantern already in step); `L.zones.plaza` is the new open floor; the
medallion is the centrepiece spot (an 11-unit piece there stays under the wheel's hub); the cart is static — its route crosses the floor.
(FP2 below moved the medallion + the cart and wrote the cart's rule.)
