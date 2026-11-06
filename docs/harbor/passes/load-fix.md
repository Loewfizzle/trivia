# THE LOAD FIX — the city comes in ONCE, clean (Nov 6 2026, afternoon; plan.md "OWNER'S NOTES — NOV 6 (afternoon)")

> The owner's iPhone, Safari, random loads (1:02–1:04 pm): THE DOUBLED LETTERING, the city POPPING IN IN CHUNKS, THE TOGGLE at the top
> centre flashing, A WHOLE DIFFERENT SCREEN flashing up and fading. A short pass right after BUZZED LIGHTYEAR, before OVERCLOCK pass 5.
> ONLY these four — nothing else from FRIENDS' list was started (its items stay on the list: THE TIER GEM's one shape, the radio's order, the
> victory sounds, the YOUR CARD row, the console's game accent). The bible: [docs/harbor.md#performance](../../harbor.md#performance).

## Group 1 — REPRODUCED (no fixes)

**The tools.** `tests/integration/wk-load.mjs` — THE BOOT IN WEBKIT (Playwright's WebKit, Safari's engine, 402×874 @3 as an iPhone; cold /
`--warm`; `--scene day|grey|night`; `--bars pre|fade|after|late`: Safari's bar = the window's height 874 → 800 → 874 before the reveal, as it
fades in, 1 s after, 2.8 s after; `--safari` keeps the city's `100lvh` box at the LARGE viewport while the window shrinks — what Safari does:
the bars move the dock + the sign, never the canvas; `--fonts-delay`, `--sky-delay`, `--live`; `--shots DIR` a screenshot burst ≈ 10 fps;
`--log` the LOAD LOG's rows). Both it and the harbor `load` group read ONE probe: `tests/integration/kit/load-probe.mjs` — a frame record every
frame from the first paint to 6.5 s after the reveal (installed before the page mounts) + `judge()`: the four problems, each as frames. The
scene gained a cheap read for it — `window.__district.loadProbe()` (`shown`, `W`/`H`, `cams`: the camera now, the camera of the bake on
screen, the one fading out under it, whether the lit windows are at this camera).

**What each one turned out to be** (WebKit, the grey day; the same in Chromium):

1. **THE DOUBLED LETTERING** — `before-1-doubled-*.png`. With `--safari --bars late` (the bar shrinks 2.8 s after the reveal, back 2.6 s
   later): the dock + the tagline move with the bar. The scene's `maybeRelayout` forgives a DOCK move within 2 s of a resize ("the dock moved
   with the bars: the city kept" — it only updates `cam.dock`), but the TAGLINE's foot moved too (256 → 249) and that part was never written
   down as kept — the next check after the 2 s window (7.45 s) saw it as a new move and RE-LAID THE CAMERA (dock 778 → 704). From that frame
   the live layers (the wheel, the boats, the neon's lit tubes) and THE CRISP LAYER (every roof sign's lettering, the blade, the date stone)
   drew at the NEW camera at once, while the baked city stayed on the OLD one (`bake.js`: a re-plan keeps drawing the old canvases in the
   band they were baked for until the new bake swaps in — then a 1.2 s crossfade between the two cameras). Every sign twice, the copy a
   little LOWER (the new camera sits the city lower with the dock at 704), the wheel twice, OVERCL… cut, GRI / OCK split — for the whole
   re-bake + its crossfade (≈ 1–2 s in WebKit headless; on a phone at 3× the bake is sliced over many frames: "it stayed a while, then fixed
   itself"). The probe: 7–13 frames in WebKit, 60 in Chromium. The same path opens for ANY camera change after the reveal (a late font, a
   rotation, a resize with the bars); with no bar move it never happened (`--bars none|pre|fade|after`: 0 frames).
2. **THE CHUNKS** — `before-2-the-load-sheet.png`. The boot screen (`#boot`) leaves as soon as the stylesheets, the fonts (≤ 0.7 s) and the
   Harbor's MODULE are in (`app.js#dismissBoot`) — ~0.9–1.1 s — but the city reveals only when its first full frame is ready (~2.6 s). Between
   the two: the lit NEON sign, the tagline, the dock and the corner buttons over the black of the held canvas; then the city fades in under
   them (the sign + the dock at 100 % over a city at 47 % → 77 %…).
3. **THE #net PILL** — `before-3-net-pill-106ms.png` (the owner's "toggle": an empty glass pill + its pink dot). `components.css` gives
   `.net` `opacity: 0` with `transition: opacity .3s, transform .35s`. The four core sheets load `media="print"` → `all`; the moment
   components.css applies, the pill's opacity changes 1 → 0 — a TRANSITION, so it fades out over 0.3 s from fully visible; the inline
   `html:not(.css-ready)` rule hides it only until the LAST of the four sheets lands, which is in that same window. Seen at 61–99 % in
   WebKit (one frame at ~160 ms), 15 frames at 100 → 65 % in Chromium.
4. **THE STRAY SCREEN** — the same window as 2, seen whole: THE DARK TITLE (`before-4-dark-title-1251ms.png`) — the sign + the dock + the
   corners over pitch black for ~1.5 s, a third look between the boot screen (the purple sky + the unlit sign + STEPPING INSIDE) and the city.
   It "flashes up and fades" into the city. Not the route-change glitch (`glitchFlash` is skipped from the 'boot' route), not another route,
   not the bare shell's grid (0 frames each). And a near-miss for the fix: the boot screen's unlit sign sits ~30 pt LOWER than the title's —
   a cross-fade from one to the other would ghost the sign (the owner's "a ghost under SPEAKEASY").

**The failing checks** (the harbor `load` group, the `city` job — `loadFixChecks` in `harbor-e2e/city.mjs`; the REAL boot, 402×874 @3, the
bar before the reveal + 2.8 s after it, Safari's 100lvh): `THE LOAD FIX — 1 THE DOUBLED LETTERING` (one camera on screen in every frame),
`— 2 THE CHUNKS` (nothing of the title ahead of the city: ONE fade), `— 3 THE #net PILL` (never seen without a lost signal), `— 4 THE STRAY
SCREEN` (the boot screen → the city, nothing between). Before the fix: 15/19 — all four red.
