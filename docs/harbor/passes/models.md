# THE MODELS PASS (City 2.0, Oct 30 2026) — the first pass on the MINI PC

Scope: plan.md "OWNER'S NOTES — OCT 30 (evening)" (part 36) — the docs + the bench for the new build machine, THE LINKS RULE; THE MOTHMAN (two
baked models); THE SR-71 MODEL behind the Blackbird's art switch + the cone / boom fixes; THE TR-3B's pink glow; THE HELICOPTER MODEL + the
patrol fixes; THE SHADOWBOXER's window reworked + his 20 sounds; the stations' two-device lag. (In progress — each group adds its section.)

## Group 0 — the new machine, the bench, the links
- **THE MINI PC** (CLAUDE.md → Testing, docs/testing.md#testing, docs/harbor.md): the laptop-era limits out ("never the whole suite locally —
  out of memory", "no Java here"); before every final push the unit suite, rules + `/api`, the smoke test AND the FULL harbor suite run locally.
  The sandbox rule (`.claude/settings.local.json`, uncommitted) was already there: `node tests/integration/e2e-*`, `shots.mjs`, `title-perf.mjs`,
  `pixdiff.mjs`… run outside Claude Code's sandbox.
- **THE BENCH RUNS SILENT** (`&bench=1` → audio/settings.js#PAGE_SILENT: this page muted + its music off, never saved; the AUDIO strip — whose red
  NEEDS TAP / LOCKED the owner read as "tap for sound" — stays down on a bench page). **THE LOAD FREEZE** per scene (bench.js#watchLoad /
  loadLine): the page's first frame, the longest stall between frames until the bakes are done (+ when), the stalls ≥ 0.25 s, when it was steady
  (20 frames in a row under 50 ms), the longest main-thread task where the browser reports it (Chrome; Safari has no long-task API), the bake time.
- **THE LINKS RULE**: (1) THE ~90 s TR-3B LINK — the live link, tapped, started 4.0 s after the tap in Chrome; the likely cause on the owner's
  phone: an EVERYONE preview state REPLACED the link's own `&force` (a 5-s toast said so). Now a page whose own link FORCES something
  (`&force=…`) keeps it — EVERYONE's state yields on that page (an info toast says so); a link with only `&when` / `&wx` still takes EVERYONE's
  state, as before; JUST ME, chosen in that tab, still wins (screens/harbor/remote.js#apply). (2) The link's lead after the tap 4 → 2.5 s and its sounds' decode wait 4 → 2.5 s at most: a legendary from a
  link starts ≤ 5 s after the tap (scene.js#LINK_LEAD; the e2e `freeze` group reads `link.lead`).

## Group 1 — THE MOTHMAN
- **THE BAKE** (scripts/bake/mothman.mjs — the harness serves a recipe's `MODELS` at `/m/<key>.glb`; both GLBs MESHOPT-compressed → the
  page's `GLTFLoader.setMeshoptDecoder`): the PERCH (mothman-folded-small.glb) at the city camera's view (9° below, facing us), the GLIDE
  (mothman-spread-small.glb) in two views × three banks — `away` (yaw 150°, 24° below, leaning 22° into flight: the rear three-quarter) and
  `toward` (yaw 35°, 22° below: the arrival). The models' KHR_materials_specular (2.0) read pale + shiny in a lit room → specular 0.25, env
  0.35; NIGHT LIGHT per model: the perch the needle's pink from straight below (11) + a cool moon edge (7); the glide away from the needle
  (pink 2.6 — the first glide render was lit full pink from below, a pink bat). Output assets/city/mothman/: perch 10 KB (173×306), glide 51 KB
  (2 rows × 3, 328×318), mothman.json (anchors: feet, top, mid, the EYES projected from model space found on the close-up renders).
- **HIS NIGHTS** (core/harbor-mothman.js, the timetable's `legend.mothman` now LIVE): p 0.075 a night → **1.9 a month** (2026–28), never a
  legendary night, never Halloween, never two nights running; in 2:00–2:30, out 5:00–5:30; EYES IN THE HAZE never shares his night
  (harbor-moments.js#eyesNights calls mothmanNight — the old `ctx.mothman` hook gone; a conflicts row). Next real ones: the night of Nov 1 →
  2:07 am Nov 2, Nov 24, Dec 30.
- **THE SWAP** (stutterAt): the needle's light dips, flicks, goes FULLY DARK for ~0.5 s — the model changes there — stammers back. The needle's
  outline item dimmed through a new `neon.moment('itemK', { needle: k })` (tier 0's one-image composite skipped while it runs).
- **THE VIEW** (screens/harbor/mothman.js, its own overlay at the device dpr, zIndex 2 — above the tagline; perched it redraws only when a blink,
  the look, the needle or the veil changes): 84 pt at 402 (the timetable's `size` — the plan's ~70 pt of HIM above the tip, his hem draping
  round the spire: 70 pt read small), the talons on the tip; THE EYES two red glows spread 1.4× apart (at 84 pt the sockets are 2.7 pt apart —
  one red blob unspread), each its own blink clock + a double blink now + then, a slow look round; THE GLIDE in / out in the band UNDER the
  tagline (the first path climbed across the lit NEON letters — a dark cut-out over the sign), shrinking with the distance, fading out; the
  arrival eases into a hover just above the tip; a slight 2D bank. Weather in front (rain, snow, fog, a storm) fades him; reduced motion: no glide.
- **THE PREVIEWS** (panel rows, IN THE SKY): `&force=mothman` (perched within ~1 s of the reveal), `mothman-arrive`, `mothman-leave` (each waits
  for the reveal + 1.5 s), `no-mothman` (TOOLS). Unit `tests/harbor-mothman.test.mjs`; e2e `ONLY=mothman` (the `perf` job — the lightest; 9 checks, ~30 s).
- **CREDITS**: both models (Tencent HY 3D, AI-generated), the SR-71 (CC BY), the helicopter (CC0, made with AI tools) in ☰ → CREDITS.

## Decisions
- The Mothman 84 pt (not 70) — 38 % of the tucked model is the hem below his talons.
- EVERYONE's preview yields to a page whose own link carries `&force` (not to a clock-only link — the panel's own EVERYONE test opens night links).

## Known issues
- (filled at the end)
