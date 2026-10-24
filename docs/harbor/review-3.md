# CITY 2.0 — REVIEW #3 (read-only, Oct 24 2026: THE FOREGROUND + the owner's five issues)

Fresh eyes on the speakeasy, the promenade, the people, the street, their lighting + sounds, after seven passes in two days
(7a, 7b, FP, FP2, PF, SP2, 8P), at commit `762231d` (plan.md + refs committed as Step 0). Nothing but this file was written.
Method: five parallel read-only investigations (the jumpy load, the weather path, the first-tap surge, the foreground's code
health, the people system's shape) with every headline claim re-read in the code by hand; screenshots at 390 / 402 / 430 by
day, dusk, night and a party night (`shots.mjs --preview --city 2 --safe`, crops `stage shop facade pole`, the pole at an
iPhone's dpr 3 zoomed 4×, a 6-frame walking burst, the hush sign, `&debug=1`); the barber pole's colours read pixel by pixel in
three columns on a party night; the people's cost A/B'd in one run (`title-perf.mjs --vs … no-people`); the unit suite
(590 / 590, 27 s); the cloud runs' history (`gh run list`). Sizes: S < 30 min · M = 1–2 h · L = half a day or more.

## The verdict, in plain words

**Healthy:** the foreground is the best-crafted part of the city at night — the facade, the blade, the lit windows with their
rooms, the café lights, the lamps and the brick street all read at 390 and hold up zoomed. The people system is the right
shape: a PURE planner on the clock (every phone the same, a page joins mid-way), a parametric figure (joints → strokes, no
sprites), the cost tiny by night. All twelve of the owner's 8P notes fit it: ten are plug-ins or contained extensions; only
the dance circle and the workers' schedule need ONE new layer (a scheduled "routines" layer beside the random blocks) — not a
rewrite. The 4-job cloud split and the `[harbor]` tag work exactly as designed (a skipped run on untagged pushes, 4¼ min
instead of 10–13 when tagged).

**Risky:** (1) the LOAD on an iPhone — the canvas and the dock follow Safari's dynamic viewport, and every bar change re-lays
the camera, stretches the stale bakes, re-bakes and crossfades: that is the "shrinks, enlarges, snaps" the owner sees; it is
design, not a glitch, and needs a load gate (M). (2) The DAY look of the people: flat black silhouettes by day, a mirrored side
profile sliding on diagonals — exactly the owner's notes, and the code is ready for the fixes. (3) The weather: the code mapped
Open-Meteo faithfully — the source itself said dense fog at 10:00 (the airport METAR agrees: ¼ mile fog at 10:19) and a 100 %
LOW deck at 11:00 (the model was 1–2 h late lifting it) — but this afternoon's forecast (high cover 96–100 %, low 0–4 %)
WILL render as a gloomy sunless city, because nine consumers read TOTAL cover; the layers are already fetched and ignored by
all but the clouds. (4) Two debt items hide in the most-touched files: `speakeasy.js` (1267 lines) and `props.js` (1117) have
become the place every pass lands, and the `&debug=1` readout is drawn ON the canvas over the promenade's middle with no fold.

**Fix first (in this order):** the barber-pole check (a test bug, 10 min), the surge (one state machine instead of a 6-s
watch + a once-per-visit flag, M), the overlays (DOM, foldable, off the promenade, S), the weather's layers + readout line
(M), then the load gate (M) — then the people pass the owner asked for (§C, FP3's list).

---

## B. THE OWNER'S FIVE ISSUES — causes, evidence, fixes

### B1. THE JUMPY LOAD (iPhone Safari) — HIGH · M

**Causes, ranked** (every one real in the code; the first three make the picture):
1. **The canvas and the dock follow the DYNAMIC viewport, and every change re-lays the whole camera.** `.nd-scene { position:
   fixed; inset: 0 }` (`css/title.css:8`) and `#stage { height: 100dvh }` (`css/base.css:188`) both track Safari's bar
   transitions (the bottom bar collapses when loading settles, ~1–3 s; often again on the first tap). Each fires `resize` →
   `onResize` (`js/screens/harbor/scene.js:1260`, a 180 ms debounce) → `build()` (`:191–197`) → `layout()` (`:198–266`). The
   camera's `front = dock.y − 4` and `VPY` come from H (`js/core/harbor-layout.js:45, 48, 60`) and the skyline is SQUEEZED into
   `VPY − limitY` (`:82–98`) — so a 40–80 px bar change does not translate the city, it changes the towers' heights. That is
   the **shrink / enlarge**.
2. **The stale layers are STRETCHED into the new bands while the re-bake runs, then a 1.2 s crossfade snaps to the new.**
   `bake.js:32–40` (`show` takes the new band when the pixel size changed) + `scene.js:667–674` (`drawImage(g.cur, 0,
   g.show.y0, W, g.show.h)`), then `fadeFrom` 1200 ms (`:663, :672`). A re-bake is ~0.5–1 s at `bakeMs` 4 ms a frame (`:588`).
   One viewport change = stretch → snap; several = "several times".
3. **Every viewport change costs TWO layouts.** `layout()` reads `S.clear` / `S.textRects` (`scene.js:179–189`) — the title's
   rects from the LAST report, up to 500 ms old (`title.js:1014–1021`), and none before `finish()` (`:496–502`; the FULL intro
   ends at 3.4 s, `title.js:71`). So `build()` lays out with the new H but a stale dock; when `trackLogo` reports the moved
   dock, `maybeRelayout` (`scene.js:1268–1272`, `> 1 px`) lays out AGAIN 60 ms later → a second bake + crossfade.
4. **A resize `build()` clears the canvas outside the frame and without `fastUntil`.** `canvas.width =` (`scene.js:195`)
   blanks it; `onResize` doesn't wake the loop (unlike `stepTier`, `:1220`, whose comment admits "build() clears the canvas …
   a black frame"). In a calm city (every other frame, `:534–536`) the cleared canvas shows for a frame = a flash.
5. **Fonts landing after mount move the tagline → a re-layout.** The boot waits ≤ 700 ms for fonts (`app.js:210`),
   `display=swap` (`index.html:61`): a late Orbitron / Chakra swap changes `.nd-word` / `.nd-tag` → `textRects()`
   (`title.js:1005–1010`) → `moved` (`scene.js:1271`) → `layout()` → bake + crossfade. First / uncached visits only.
6. **The tier — mostly cleared.** The perf director honours DT1's claim (nothing steps before 90 frames + `TIER_GRACE` 8 s
   after `shownAt`, `scene.js:1189–1190`; `title.js:303` starts at tier 2). Two paths bypass it at any time: `starvedCount()`
   (a refused context → `stepTier(tier − 1)`, `scene.js:547`, `canvas-safe.js:62–70`) and 3 failed frames (`:555`). A step =
   `build()` (`:1221`) = a new DPR backing (2 → 1.5 → 1 at an iPhone's DPR 3) = a visible resample + the cleared frame + the
   stale layers again. Check on the owner's phone: `&debug=1`'s `t2→1→2` history.

**Cleared:** the safe-area probes (`title.js:355–359`), the dock estimate vs the real `.nd-actions` (`harbor-layout.js:45` vs
`title.css:517`), the preview pill (appended to body, `remote.js:112`, not in the flow), `visualViewport` (only the join
panel, `title.js:1289–1295`), no CSS transform on the canvas, the first bake's gate (`shownAt` + `fadeIn` 700 ms, `:662, :671`).
City 1.0 has none of this: `set()` only stores rects (`district/scene.js:844`), its dock top derives from H alone (`:135`), its
`build()` is synchronous with no progressive bake, no stale-stretch, no crossfade — one clean redraw per resize.

**The fix — PERFECT THE FIRST TIME (M, ~2 h + S test):**
1. **Size once, from a stable viewport.** `onResize` (`scene.js:1260`) coalesces: during a LOAD WINDOW (until `shownAt +
   2500 ms`) ignore height-only changes under 25 % of H, and queue ONE `build()` 400 ms after the LAST resize; accept at once
   a width change or an H change ≥ 25 % (a rotation). Set `fastUntil = now + 1500` and run the build from the next
   `frame()` (a `wantBuild` flag) so the clear and the redraw share a frame.
2. **Re-measure instead of re-reporting.** `set({ measure })` from title.js: on a resize the scene calls `S.measure()` (→
   `{ clear, textRects }`) before `layout()`, so one change = one layout. Keep `maybeRelayout`'s 60 ms path for the title's
   own moves, raised to `> 2 px`.
3. **The reveal gate.** A `revealAt`: the layers draw only when `baker.bakes ≥ 1 && litBaker.bakes ≥ 1 && !baker.pending`, no
   resize in the last 400 ms, and `document.fonts.status === 'loaded'` (or 1200 ms passed). Start the existing `fadeIn`
   (`:662`) from `revealAt` (900 ms), and have title.js hold `.nd-scene` at `opacity: 0` (its CSS already transitions,
   `title.css:8`) until the scene's `onReveal` fires, in step with the sign's `signOn()` (`title.js:440`): dark → the NEON
   sign → the city.
4. **No stretch after the reveal.** `bake.js:40`: keep `show` = the OLD band when the pixel size changed (the stale layer
   drawn in place, dimmed by `xf`) — simpler than a dark dip and nothing jumps.
5. **The tier frozen during load.** Defer the `starvedCount` / failed-frame steps while `now < revealAt + TIER_GRACE` (record
   `wantStep`, apply with the first `perf()` pass); log the reason in `tierHist`.
6. Docs: `docs/harbor.md#performance` (the load gate). Nothing in CLAUDE.md changes.

**Test (S):** a new `G('load')` in the `city` job (`harbor-jobs.mjs:26`; the unit test enforces one job): `open({ init })`
installs a pre-mount rAF sampler of the canvas's `{width,height}`, `.nd-scene`'s computed opacity, `harbor().shown / bakes /
fading` and one stage pixel; 300 ms after `goto` `setViewport(390, 780)`, at 900 ms back to 390×844. Assert ≤ 2 distinct
backing sizes (the last 780×1688), `shown` only after the last resize + 400 ms, `bakes === 1 && !fading` at the reveal and
for 3 s, no stage pixel moving > 60 levels (no stretch), `tiering().hist.length === 1`; then a rotation (874×402) re-lays
within 8 s (the existing check `:409`). Timing parts under `okT`.

### B2. WRONG WEATHER — fog at 10:19, a grey deck at 11:19 — MED (the mapping) · M

**What the source said (fetched read-only today, Open-Meteo `best_match` for the area the app queries — `areaOf` rounds
42.96,−85.67 to 43.0,−85.5, `js/core/weather.js:92–98`, a point ~14 km ENE of downtown):** 09:00 / 10:00 WMO **45**, cloud 100,
**low 100**, mid 0, high 0, **visibility 100 m**; 11:00 WMO 3, cloud 100, **low 100**, high 4, vis 12.2 km; 12:00 WMO 2, cloud 59,
low 56, high 59; **14:00–17:00 (the forecast) WMO 3, cloud 96–100, low 0–4, high 96–100.** The airport (KGRR, 15 km SE):
10:19 local `1/4SM FG OVC002` (¼-mile fog); 10:46 `3SM BR SCT002 BKN200` (the owner's thin veil over blue); 11:53 `10SM
BKN250`. Other models at 09–10: ECMWF low 0 / high 35–64 (no fog), ICON fog, GEM WMO 2.

**Bug 1 (the fog) — the pipeline was faithful.** `api/sky.js:31–34` fetches `current` (weather_code, cloud_cover + low / mid /
high, visibility, is_day; a 15-min slot) → `normalize()` on the SERVER (`:54`; `js/core/weather.js:54–72`): `fromWmo(45)` = fog
0.8, `fog = max(0.8, clamp01((1500 − 100) / 1200)) = 1.0` → `kind: 'fog'` (`:61`). The Harbor then draws full banks
(`district/weather-fx.js:339–359`, alpha 0.42–0.8), the foghorn (`harbor/sounds.js:155`), wide lamp halos. Fog was REAL at the
airport that minute and in the model's cell; the owner's street was 14 km away in a patchy morning. The fix is to make fog
CONSERVATIVE and GRADED (a dense bank only for real low visibility, a mist / haze state for the rest) and to show its
provenance — not a code repair.

**Bug 2 (the grey deck) — half real, half a mapping that is about to bite.** At 11:00 the model still said low 100 % (it lifted
the post-fog stratus 1–2 h late; ECMWF had it right); `cloudMix` → deck 1 (`js/core/harbor-clouds.js:43`), `tones.js:106` ovc 1 →
sunDir 0 (flat grey facades), `:124` the sky greyed 0.85. Worst-case staleness adds up to 30 min (the server cache 15 min,
`api/sky.js:15, 47–51` + the client poll 15 min, `district/live-weather.js:8, 38–43`). **The real bug:** the forecast for
14:00–17:00 is high 96–100 / low 0–4 — `cloudMix` correctly gives deck 0 / veil 1, but EVERY other consumer reads TOTAL cover
`LK.cloud`: `tones.js:106` (ovc 1 → a flat grey city, no sun side), `tones.js:124` (a grey sky), `rays.js:15` (no rays > 0.7),
`air.js:32` (overcast > 0.78), `water.js:308`, `moon.js:146`, `scene.js:427, 712, 727`, `skyline.js:48`. A bright
cirrostratus veil renders as a gloomy sunless city.

**Other facts:** the server DROPS the raw code / visibility / slot time (`api/sky.js:54` → only `{ kind, fog, cloud, layers, at }`),
so the client cannot re-map or display them — any mapping change is a server change (`js/core/weather.js` is imported by
`/api`; Vercel deploys on push; `wx/{area}` holds the old shape ≤ 15 min). A failed fetch keeps a stale state up to 75 min
(`weather.js:88–89`, `live-weather.js:14–31`). Overrides: `&wx=` → `forced` (`core/sky.js:528`; `scene.js:1049` disables live
weather while set); the panel's JUST ME in sessionStorage `nd:hr-me` (`remote.js:36–37`), EVERYONE in `city2/live`; a leftover
shows in the TEST pill (`harbor-remote.js:346`) — not the cause here. **The readout has NO weather line** (`scene.js:829–848`);
`debug().flags.wx` (`:1401`) shows only a forced kind.

**The mapping to build** (PURE in `weather.js#normalize` + a new `LK.opaque / veil`; the veil's LOOK is 6b's):

| inputs | state |
| --- | --- |
| WMO 45 / 48 AND vis < 300 m | `fog` dense (banks, the horn), fog = 1 |
| (45 / 48 or vis < 1 km) and vis 300–1000 m | `mist`: far-skyline haze + wider halos only, fog 0.3–0.6, no banks |
| vis < 1 km without 45 / 48 (today `weather.test.mjs:30–32` asserts 'fog' — change it) | `mist` ≤ 0.4 |
| opaque = max(low, 0.9·mid) ≥ 0.75 | `overcast`: the deck, ovc, the grey sky (as now, from `opaque`, not total) |
| opaque 0.4–0.75 | `clouds`: strato / alto patches, the sky greyed by `opaque` |
| high ≥ 0.5, opaque < 0.4 | `veil`: the sky whitened ~0.25 toward white (not SKY_GREY), the sun softened (rays × 0.5, sunDir kept), ovc 0 |
| no layers in the answer | today's fallback from total cover |

Add to the server's answer `src: 'open-meteo/best_match'`, `code`, `vis`, `t` (the slot) beside `at`; treat > 45 min as stale
(fade to the seeded weather), not 75; age = now − slot. Bigger wins (the owner's call): `models=best_match,ecmwf_ifs025,
icon_seamless,gem_seamless` in ONE request and the median low / high / vis (would have given low ≈ 0.6 → no deck at 11:00) —
M; a nearest-METAR observation overriding the model's vis + layers — L; a finer area (0.1°) — S but a privacy decision
(`api/sky.js:2–4`, `docs/title.md:77`).

**The readout line (two 10 px lines):** `wx open-meteo · 43.0,−85.5 · slot 11:15 · 9 min old · WMO 3 · cc 100 (lo 100 mid 0 hi
4) · vis 12.2 km` and `→ overcast · opaque 1.00 veil 0.04 fog 0 · live` (or `→ FORCED fog (panel JUST ME)` / `seeded (no
answer, 52 min)`).

**Tests:** `tests/weather.test.mjs`: a table test on `normalize` with today's real samples (10:00 → fog dense; 11:00 →
overcast; 14:00 → veil, ovc 0, NOT overcast; 12:00 → clouds + cirrus; `{ code 2, vis 400 }` → mist). `tests/harbor.test.mjs`:
`cloudMix` + `lookTones` with `{ cloud: 1, cloudLayers: { 0, 0, 1 } }` → ovc 0, the sky within Δ of the clear day. Look review:
add `mist`, `stratus` (lo 1, hi 0), `highovercast` (WMO 3, lo 0, hi 1) to `forcedWeather` (`weather.js:76–85`) + the panel's
WEATHER list (`harbor-remote.js:192–194`); shoot `&when=…T14:00` at 390 / 412 / 1440.

### B3. THE FIRST TAP SOMETIMES DOESN'T SURGE THE SIGN — HIGH · M

**How it works today.** `onSurgeTap` (`js/screens/title.js:354` — window, capture, pointerdown + keydown; nothing can eat it)
arms a WATCH (`:902–916`): if `musicClock() ≥ 0` at the tap → `surgeSpent = true`, nothing (`:904`); else poll every 90 ms for
two consecutive readings with the song's clock moving (`:911`), **and give up after 6 s** (`:913`) without spending. The answer
(`signSurge()` `:918–941` → `firstTapAnswer`, `district/neon-ramp.js:125–131`) skips on `!tl.done` (the intro), a race running
/ `is-catch` / `nd-glow-in`, does the `catch` in the warm-up, else `surge` / `first`. The visual (`raceLogo('surge')`
`:841–885`): needs the DOM class `is-day` (`:844`) + the four `.nd-race-l` SVGs; a white-hot head + a 14-dot tail along the
tubes ≈ 1.08 s, ≈ 2.0 s in all, every letter to opacity 1.0, the bloom 0.5 — opacity + transform only.

**The mechanisms (confirmed):**
- **M1 — the 6-s watch vs a cold song start (the "sometimes"; the owner's exact sequence).** `startTrack` (`js/audio/music.js:
  264–278`) sets `el.src` to a streamed 3–4 MB mp3 and plays; `currentTime` moves only once iOS has buffered. On cellular,
  with the Harbor's bakes + `neonPreload` (`title.js:681`) + the city-sound bed loading in the same seconds, the first frame
  can take > 6 s → the watch dies, the music then starts, no surge, `surgeSpent` still false. Later the music button OFF →
  ON (`settings-panel.js:159–166` → `musicNeedsRescue`, `music.js:587–606`): the file is cached, the clock moves within
  ~100 ms, the button's own pointerdown re-armed the watch → **surge**. (Had he tapped the city again first, `:904` would have
  spent the visit silently.)
- **M2 — the once-per-visit flag is spent BEFORE the answer ran.** `surgeSpent = true` at `:911`, THEN `signSurge`; a
  `skip:intro` / `skip:busy` / `skip:race` answer still burns the visit. Deterministic: (a) a device's FIRST visit (no
  `nd:entered`, `:62, :364`): the gate's tap is the music tap → the FULL intro (3.4 s) → the clock moves at ~1 s → `skip:intro`
  → gone for the visit; (b) a tap in the intro's first 250 ms; (c) `&force=first-tap`.
- **M3 — fog / darkness: cleared.** `neonNow()` uses only the sun's moments + `alwaysNight` (`:713–715`); the Harbor's
  `darkness` (`harbor/scene.js:171`) never reaches the sign's classes; the gate is the DOM `is-day`. Fog only made it FEEL like
  dusk.
- **M4 — "not ready": real but secondary** (`!els.sign` → `skip:off` `:920`; `blaze.length !== 4` → `skip:race` `:936`) — both
  spend the visit via M2.

**The shape (M, ≈ 1.5 h + an S test):** (1) drop `surgeSpent` (`:66, :903–904, :911, :949`); replace the tap-armed watch by a
continuous START DETECTOR in the title's existing tick: `musicClock()` < 0 for ≥ 1 s then moving across two readings →
`signSurge('music')` — this covers the first tap, the button's ON, a rescue, with no event wiring. (2) ONE entry
`signSurge(reason)` + `surgeAt`: `if (now − surgeAt < 10000) return 'skip:cool'`, stamped only when it really ran. (3) Gate on
the sign's REAL lit state: `lit = is-steady && !is-day` into `firstTapAnswer` (replace `st.caught`, `neon-ramp.js:130`; keep
the warm-up `catch`): lit → `'first'` (the lit race, 985 ms, bloom 0.55 — already "a quick punch"); not lit → `'surge'`.
(4) PENDING instead of skipping: on `skip:intro` / `skip:busy` / missing SVGs set `surgePending`, fire from `finish()` (one rAF
after `is-day` applies) and from a race's `end` (`:863`). (5) Is it big enough? At 2 s with no hold it is a flash; hold the
peak + bloom ~300 ms longer by day (`RACE.surge`, `:840`) — S, the owner judges.

**Test (S) — group `neon` (job `show`):** open `when=2026-10-23T13:00&intro=1` (the real FULL intro), tap at 300 ms after
`window.__district` exists → `waitFor('.nd-sign.is-day.nd-surge', 12000)` and `surge().last.did === 'surge'`; the music
button off, wait `musicClock() < 0`, on → `count === 2`; a third off / on inside 10 s → `skip:cool`; a second case tapping at
100 ms into the intro expects the pending surge after `finish()`. Update `docs/harbor.md:2846–2851`, the `surge()` hook
(`:1498`, drop `spent`, add `cool`), `e2e-harbor.mjs:988–992`.

### B4. THE DEBUG OVERLAYS COVER THE CITY — MED · S

- **The AUDIO panel** (`js/audio/diag.js`): its fold head is a real `<button>` (`:44`), so iOS DOES send `click` (the FREV row's
  "plain div" is not the case — the rule still says pointerup, but this one works). The real problems: it sits at `top:
  safe + 58 px, left 8, right 64` (`:17`) — OVER THE NEON SIGN and the tagline, 13 rows × 13 px ≈ 180 px tall; its folded
  header is one long string (`AUDIO ▾ sounding · ctx running · el playing · 10:19:23.4`, `:88`) that WRAPS to two lines at 10 px
  on a 318 px box; the fold is remembered in sessionStorage (`:28, :49` — a new tab forgets).
- **The readout** (`harbor/scene.js:829–848`) is drawn ON THE CANVAS every frame, bottom-left, `y = cam.dock.y − 8 − h`,
  full width minus 16 pt gutters, 8–9 lines ≈ 120 px — exactly the promenade's middle, over the people and the bench; no
  fold at all (taps pass through: nothing listens). It also runs `measureText` per line per frame inside the very `work` number
  it reports (`:846`). **Observed in the preview at 390 (plain puppeteer, no `--safe`):** the box and its text start ~36 px LEFT
  of the screen's edge (`t2 · d` of the first line is off-screen; the box's left edge invisible) although `x0 = 16` at `:843`
  and the context's transform reads identity × 2 between frames — an unbalanced translate somewhere in the frame path
  before `drawReadout`, or a crop artefact; moving the readout to the DOM (below) removes the question. Screenshot:
  `tests/integration/shots-frev2/night-390x844.png` (not committed).
- **The fix (S, one small module `js/ui/debug-strip.js` or inside debug-tools.js):** BOTH overlays become DOM strips with the
  same fold logic — a `pointerup` on the title (with a 6 px move guard), folded = ONE short line each (`AUDIO ▸ sounding DIRECT
  · ctx running` / `t2 · 60 fps · 1 % slow · beat grid`), expanded at 9 px, anchored at the TOP under the corner buttons and
  the safe area, max-height 38 % of the screen (the sky + the far skyline — never below `cam.limitY`, never the promenade,
  never the dock), the fold remembered per DEVICE through debug-tools' saved prefs (localStorage), the readout's text set
  twice a second (`textContent`, no canvas text in the frame). The weather line (B2) goes in the readout strip. Keep `&debug=1`
  + the panel's TOOLS switches as they are.

### B5. THE BARBER POLE's party-colour check fails on every run — a TEST BUG · S (10 min)

**The pole is right; the probe reads the glass's white core.** The check reads ONE column at the exact centre of the glass
(`e2e-harbor.mjs:1565–1570`: `pr.x + pr.w * 0.5`) and asks for a magenta with `g < 130` and a blue with `r < 150`. The lit
pole adds an LED-bright core DOWN THE MIDDLE (`speakeasy.js:1141–1144`: a `lighter` gradient of (236,244,255) peaking at 0.45
of the width, alpha `0.5 · lit · (1 + 0.4 · punch)`), which adds ≈ (118, 122, 128) to every stripe there. Computed from
`poleColours` (`:912–922`, the default party palette): magenta 255,63,176 → **255,185,255** at the centre; blue 62,184,255 →
**180,255,255**. Read live tonight on a party night at 402 × 874 (`beatU` 0.60, `punch` 0.16): the centre column =
`210,210,208 · 209,135,210 · 131,208,209` — the failing readings to the level; the column at 0.25 of the width = `209,93,190`
(magenta ✓) and `91,194,209` (blue ✓); at 0.75 = `182,48,133` and `47,137,184` (✓ both). The zoomed frame at an iPhone's dpr
(`shots-frev2/party-402x874-pole-z4.png`) shows crisp magenta + cyan-blue twists on gold with the white core — the look is
what FP2 ordered. The NIGHT probe was already moved off the core for the same reason in `71d77d4`; the PARTY one wasn't.

**Fix:** read two columns at 0.25 and 0.75 of the glass (either passing), keep the between-beats wait; promote it back from
`okF` to `ok`. **Why it passed before (FP2, SP2's run 1) and fails now:** the magenta's `g` at the centre sits 5 levels over
the threshold (135 vs 130) — a probe on the core's slope, where any brightening of the shopfront since (SP2's crisper lights,
the awning lamps' baked light under the glass) tips it. Not a flake and not a colour regression.

---

## A. THE FOREGROUND — fresh eyes

### A1. Code health (leftovers, duplicates, seams)

Better than seven fix-on-fix passes usually leave a foreground: the PURE / screen split held (every system has a factory + a
`debug()`), 8P's draw order is sound (`scene.js:754–799`: FAR people before the stage layers so the facade covers them, NEAR +
ROOF after `speak.draw` + `centre.draw` and before the front row, the strings over everything), the people know the lamps only
through `stage.js#lightField / lightSources / sunShadow` (`people.js:18`), the district's old `people.js` is not reused, no
sound plays inside any bake step, all 72 sound files referenced exist. **The one seam that did not hold is LIGHTING** — four
lamp models, six glow caches, a dozen private night thresholds and a bake + live pair for every facade lamp — and that is
exactly what 8b (the raid darkens everything), Part 9 (wet reflections, snow on every lit surface) and 6b (a sky director
dimming the street) will all touch.

| # | sev | what · where | why it matters | fix | size |
| --- | --- | --- | --- | --- | --- |
| H1 | HIGH | **No single "power" hook on the facade.** `speakeasy.js:1113, 1189, 1194` read `f.pole` / `f.sconce` but `scene.js:772` never passes them; the blade + marquee follow `f.lamp = litK(DK, 'bill')` (`:1229`) with no override; the basement (`:1203`), the awning bulbs and the hush sign have no "off"; the lamps' life has no API (`scene.js:319–337`) | 8b's raid becomes six calls across five modules, two with no hook — a rewrite of each painter's inputs instead of a plug-in | `speak.power(k)` = one multiplier applied in `draw()` to k / lamp / sconce / pole / basement; `harbor().raid(o)` orchestrating `speak.power`, `strings.set`, `roadLight.wash`, `people.budget`, a new `lampLife.force(levels)` — build the hook in FP3 (S), the raid itself in 8b | S + M |
| H2 | HIGH | **Four lamp-light models for the same lamps:** `stage.js:38–45` (REACH 13.5 / 9.5, the pools + the people), `props.js:32–48` (LAMP_REACH 14 / 12, its own falloff), `trees.js:50–56, 85` (k 0.58 / 1.15, fall 3), `roadlight.js:40` (reach 7, z < 40 only) | a bench, the stone under it, the tree beside it and a walker are lit by four different lamps; Part 9's wet reflections and 8b's cabs would add a fifth | `core/harbor-light.js` (PURE, tested): `lightSources(L)`, `lightField`, `lampLight(L, x, y, z) → { col, dir, k }`; props / trees / roadlight take it through `pieceCtx`. Also breaks the `stage.js:14` ↔ `props.js:21` import cycle (`sunShadow`) and `motorcar.js:14` / `centre.js:27` importing stage.js for pure helpers | M–L |
| H3 | HIGH | **Sounds fired inside painters:** `people.js:109–110` (`sounds()` / `busSounds()` at the end of `draw`, also `:90` on empty), `windows.js:354` (`sound(e)` inside `draw`), `roadlight.js:70` (`f.play` inside `draw`) | a skipped draw silences or desyncs: `pplOn` needs a baked stage (`scene.js:757`), `no-people`, fade 0, a tier; the bus cues depend on the FAR pass running | `people.tick(snd)` called by the scene after `frame()`; the two windows' plays (door-heavy, cat-meow) → `MOMENT_CUES` (`sounds.js#life` already handles cues); roadlight's play into a tick | S |
| H4 | MED | **The placeholder people still ship:** `harbor-layout.js:452–495` builds `L.people` (44 lines) + `screenBoxes` 'alive' boxes `:520–521` (no consumer); `stage.js:298 drawPeople` + the `person` import `:12`; `scene.js:788` `force=placeholders`; the remote row `harbor-remote.js:144` | dead weight in every layout; a second "people" system beside 8P's | delete all four, drop the remote row | S |
| H5 | MED | **Parked traffic dead but called every frame:** `road.js:259 PARKED_TRAFFIC = false`, `drawTraffic` early-returns, called `scene.js:754`; `L.bus` / `L.cars` built `harbor-layout.js:443–449, 482`; `tests/harbor.test.mjs:2684–2688` pins the dead path; `L.bus.h` still sizes the road band (`:582`) | two bus models (8P's is `bus.js`) | remove `drawTraffic` / `PARKED_TRAFFIC` / `L.cars`; one `BUS_H` for the band; update the test | S |
| H6 | MED | **props.js carries ~480 dormant lines:** the planters `:471–767` (`planters: []`, `harbor-promenade.js:80`), the mailbox `:874–976` (`mailbox: null`, `:83`), the test obelisk `:978–1055` (`&force=centrepiece-test` only) | 43 % of the file is art nothing draws | `props-garden.js` (dormant) + `props-test.js` lazily imported by centre.js — or delete (git keeps the art) | S–M |
| H7 | MED | **The stone-course loop duplicated:** `stage.js:118–147` vs `street.js:146–172` (the same rows / stones / grout / visibility cull, both ending in `paintSett` / `paintFlat`) | Part 9's wet / snow pass written twice | `street.js#paveCourses(spec, paintStone)` used by both | M |
| H8 | MED | **Six radial-glow sprite caches:** `speakeasy.js:1045 softGlow(128)`, `windows.js:277 spot(64)`, `strings.js:48 halo(32)`, `centre.js:51 glow(48)`, `roadlight.js:21 sprite(128)`, `motorcar.js:168 glowSprite(64)` (+ `props.js:100 soft`) | six falloff curves = six slightly different "crisp" halos (review-2's C8 again, now in the foreground) | `ui/glow-sprite.js`: `glowSprite(col, stops, size)` with one cache | S |
| H9 | MED | **Night thresholds re-derived per painter:** `windows.js:358, 656, 665, 678, 784` (k > 0.3), `:722` (0.4); `speakeasy.js:263, 332, 684, 735` (night > 0.5); `props.js:192, 273, 517, 626, 716, 861, 953`; `strings.js:120, 124`; `bus.js:43–44`; `motorcar.js:191` — while `harbor-dark.js:78, 80` already define `windowsNight` (0.2) / `isNight` (0.5) | all derive from the one DK but each picks its own cut → the facade flips to "night" in three steps | the frame env carries `night` / `dusk` from harbor-dark; the painters stop comparing | S–M |
| H10 | MED | **Bake + live doubles on the facade lamps:** the awning bulbs' glass baked `speakeasy.js:848` and redrawn live `:1190–1196`; the sconce's lantern glass baked `:416` + a live pane `:1186`; the marquee bulbs baked unlit `:693–697` + a lit sprite `:1029` | not visible bugs (lit over unlit) but two painters per lamp to keep aligned — how the doubled gilt happened | one `facadeLamps(G)` list (the sconce, 3 awning bulbs, the marquee) feeding both the bake (fixtures) and the live layer (light) | S |
| H11 | MED | **The roof silhouette computed twice:** `strings.js:33 frontProfile` + `:76–77`; `people.js:117` repeats the projection + the side-wall point | two clips that can drift (the guests vs the canopy) | `speakGeo(L).roofClip` | S |
| H12 | LOW | The bar repainted every frame by day: `windows.js:412 barAfternoon` → `paintBar` + `bartender` each frame while open and day > 0.01 (16:00 → dusk); the apartment's TV / lamp `:390–391` | the only foreground painter without a sprite key | a sprite keyed by (state, shade, lit, T) like `paintLit` | S |
| H13 | LOW | Stale pass comments: `scene.js:64, 794` "strings OFF until 7b" (`STRINGS_ON = true`, `strings.js:17`); `stage.js:9, 284`, `road.js:3`, `harbor-promenade.js:65, 84` "cart hidden until 8b" / "the people are placeholders (8b walks them)" (`CART_SHOWN = true`); `scene.js:10`'s header has no FAR / NEAR / ROOF passes | the next reader builds on wrong premises | rewrite 8 comments | S |
| H14 | LOW | Force flags undocumented / duplicated: scene-only `no-lamp-light`, `no-speakeasy`, `no-strings`, `no-leaves`, `no-road-light`, `no-road`, `no-party` (not in `harbor-remote.js`); `?season=` (`scene.js:309`) duplicates `force=season-*`; remote rows for the dead `placeholders` and the always-on `strings-party` | two ways to do one thing | one list in harbor-remote (the A/B flags as a hidden group); drop `?season=` | S |
| H15 | LOW | Over-exports + leftovers: no importer for `harbor-people.js` planVisit / visitAt / blockVisits / busRiders / roofVisits / walkStart / periodAt, `speakeasy.js` AWNING_LAMP / VAL / awningBulbs / paintGilt / BLADE_GLOW / BLADE_SPLIT / POLE_RISE, `harbor-moments.js` nextMoment / BAR_LAST / TV_STEP; `void x` × 11 (`speakeasy.js:257, 1172`, `windows.js:392, 675, 747`, `stage.js:320`, `street.js:293`, `road.js:35`, `people.js:170`, `folk.js:271`); `speakeasy.js:941–943` `adCv / adKey` never painted (7a's ad lamps), `mirror` set `:1253` never read, `lastK` never read; `stage.js:355 freeLampLight` a no-op still called `scene.js:1417` | noise the next pass must decode | un-export, delete | S |
| H16 | LOW | Sounds: 83 slots / 42 filled; `tv-murmur` empty but kept every frame (`sounds.js:148`); `police-car-1920s` / `siren-1920s` (the raid) empty + uncalled | fine by design (silent slots) | fill or mark `tv-murmur`; nothing else | S |
| H17 | LOW | `roundRect` unguarded (`street.js:41, 53, 61, 75, 243`, `motorcar.js:40…`, `road.js:122, 212`, `bus.js:32–34, 43`); the pole computes per pixel into safeCtx's stand-in ImageData when starved (`speakeasy.js:1076, 1101`) | OK on the iOS 16 floor; pin it so nobody "fixes" it | add to `tests/safari-floor.test.mjs`; `if (starvedCount()) return null` | S |
| H18 | LOW | Two season axes: the ivy + the window box by MONTH (`speakeasy.js:303, 537`), everything else by season string (props / trees / street / folk, `CART_KIND`); `scene.js:365` maps a forced season → a month so previews agree | Part 9 / 11 must set both | `ivyColours(season, phase)` via `pieceCtx` | S |

**The splits, by responsibility (do each as the first step of the item that touches the file):** `speakeasy.js` (1267) →
`speakeasy-geo.js` (speakGeo, mats, wallMap, consts `:26–143`) · `speakeasy-bake.js` (structure, deco, the date stone, windows,
ground, gilt, washers, light, ivy `:144–584` + the steps `:714–860`) · `speakeasy-blade.js` (`:585–713, 996–1044`) ·
`speakeasy-pole.js` (`:891–939, 1071–1147`) · `speakeasy.js` = `createSpeakeasy` (~250) · BASEMENT / basementLight →
`core/harbor-speakeasy.js` (pure). `props.js` (1117) → `props-light.js` (lightFor / lit / pbox / frame `:27–125`) · `bench.js` ·
`cart.js` · `inlay.js` · `props-garden.js` (dormant) · `props-test.js`. `windows.js` (830) → `windows-paint.js` (`:32–268`) ·
`windows-moments.js` (the PAINT table `:716–830` + the states `:386–534`) · `windows.js` = createWindowLife.

### A2. THE PEOPLE SYSTEM vs the owner's notes — it carries them; one new layer

`node --test tests/harbor-people.test.mjs`: 12 / 12 in 6.9 s. The hooks are real: the roof clip (`people.js:115–122`, a small
polygon), `budget(k)` (`:162`, exposed `scene.js:1378`, UNCALLED yet), `frame({ rain })` (`scene.js:339` → umbrellas, fewer),
`lookOf` (`folk.js:35`). Two unused imports: `void roofMap` (`people.js:170`), `void sm` (`folk.js:271`). `FOLK.cap` is ONE
constant (12, `harbor-people.js:25`) — "cap by tier" is not built; `env.tier` only gates the rim pass (`folk.js:152`).

| # | the owner's note | verdict | what changes (file:line) | size |
| --- | --- | --- | --- | --- |
| 1 | facing by direction, turns through a 3/4 | **extend** | heading is quantised 4-way in `visitAt` (`harbor-people.js:324`: `dir` ∈ {−1, 1, 0 away, 2 toward}, "side" if \|dx\| > 0.35·\|dz\| → a 70° diagonal is a MIRRORED PROFILE sliding in depth = "sideways and forward"). `folk.js` is parametric (joints → strokes, no sprites) and has a crude front / back (`jointsOf:68`, torso `:187`, hair `:219`, nose `:218`) but no 3/4 and a snap. Add `hd` (radians, beside `dir` so the member offsets `:420–428` + pose `face` stay) smoothed at the polyline's corners by a ~0.5-unit look-ahead; `jointsOf(hd)`: forward offsets × cos(hd) on x, × sin(hd) as depth (the far limb narrower + darker, draw order by sign) | M |
| 2 | depth-correct stride + scale, feet never skate | **plug-in (mostly right already)** | the camera is a pure perspective (`harbor-layout.js:73`, the squeeze is skyline-only `:84`); speed in world u/s (`FOLK.speed:26`), the stride phase from `dist` in world units (`visitAt:324`, `jointsOf:69–70`), scale `H = 2.1·h·F/z` (`folk.js:125`). Two REAL skates: a non-side walk moves no foot in x (`folk.js:84`, bob only) and the door / bus FADE legs glide (`visitAt:333`) — both die with (1) + (6). Extend the stride test to a diagonal | S |
| 3 | a real walk cycle (contact / down / passing / up, knees) | **extend** | legs are 2 segments with an IK knee (`folk.js:76–91`), the stance linear, the swing a 0.045 sine lift, arms already counter-swing (`:93–96`), hips / shoulders fixed. Replace the feet / knee maths in `jointsOf` with a keyed table in `p` (the stance foot still linear = the lock) + a hip bob at 2× + a shoulder counter-rotation × sin(hd). One function | S–M |
| 4 | colour by day, a rim at night | **plug-in** | the parts are already separate + coloured: `SKIN / HAIR / COATS` (`folk.js:21–28`), the head's skin `:216–217`, hands `:177`, hair `:219–220`, hat `:229`; `lit()` (`:133–138`) darkens 0.78·dark toward NIGHT. Missing: a hat-brim shadow (one clipped arc), a lit / shade split on the whole figure (today one rect on the torso `:210`), and the night rim is the WHOLE figure offset (`:152–155`) → head + shoulders only (cheaper, what was asked) | S |
| 5 | ~25 % slower, varied per kind | **plug-in (numbers)** | speed per GAIT (`FOLK.speed`), every `KINDS` entry names one (`:220–240`) ± 8 % a person (`planVisit:250`): walk 1.5 → 1.15, stroll 1.05 → 0.8, brisk 1.9 → 1.5, jog 3.1. Watch `crossV` (`:176`) and `walkStart`'s window — slower crossings fit fewer WALK phases | S |
| 6 | REAL doors (swing, step, close; the amber spill + the jazz burst at night) | **extend + one shared controller** | today a `{ k: 'fade' }` leg (`planVisit:268, 286, 296`; `roofVisits:510`; `busRiders:391`) → alpha (`visitAt:333`, `drawFolk:140`) — the "pop". Both doors are BAKED (`speakeasy.js#paintGround:331–397`, the steps `:850`); the only live door is the shop's mirror (`mirror(k)` `:1253`). Needed: a `door` leg (open / step / close, no alpha) + a pure `doorOpenAt(visits, id, t)`; `speakeasy.js` gains `door(id, k)` painting the swung leaf, the dark reveal and an amber `soft()` spill at night (as the sconce `:1186–1191`); `people.js` clips the entering figure to the reveal (the near pass already draws AFTER the facade, `scene.js:772 → 780`) and fires the transitions like `busSounds`' phase machine (`:141–156`) → the slots `door-heavy`, `bar-open`, `club-murmur-*` exist (`city-sounds.js:32–36`). The BUS door: close 3–5 s after the last rider (`BUS.dwell:180` tied to `riders`) | M |
| 7 | the glow-wand dance circle on the inlay | **extend (needs 8's layer) + plug-in poses** | the inlay is an obstacle only while a PIECE stands (`folkMap:115` ← `centre.active()`; `centreActive` is piece-only, `harbor-centre.js:105`) — so `centrepiece.set({ rig })` without a piece lights the floor and leaves it walkable: the rig fits. A CIRCLE forming at the peak is a coordinated set piece; the block planner starts visits at random (`blockVisits:371`) → it rides on the scheduled layer of (8), reserving occupancy via `others` (`:363`). `peopleEnv` passes only `party: bool` (`scene.js:344`) → add `{ punch, beatU, beats, pal }`. Poses `dance2 / clap / bob` in `jointsOf`; wands = additive strokes + `warmDot`-style sprites (never shadowBlur); trails = a per-visitor ring of 3–4 past tips in `people.js` (a draw cache only), off at tier 0 | M–L |
| 8 | THE WORKERS' SCHEDULE (8b) | **restructure of the planner's TOP (the blocks stay)** | a visit must fit its 480 s block (`blockVisits:373` rejects `t1 > block − 1`; start `t0 + 2 + r·0.75B` `:371`) → no 3-hour newsboy, no 6:00 sharp; props don't exist (members are lead / partner / guest / dog, `membersOf:342`); `busesOf` is bus-specific. Add `core/harbor-routines.js`: ROUTINES as data `{ id, days, at \| window, stages }` planned once per (date, id), hours long, merged in `folkAt` (`:414`) and fed into A / B's `others`; join-mid-way is free (`visitAt` is time-indexed). New outputs `props: [{ kind, x, z, t0, t1 }]` drawn LIVE in the near pass (the bench / cart in `props.js` are baked) and `vehicles` generalising the bus (`motorcar.js`'s sedan as the pattern). Cause-and-effect: the lamps' life + the blade's dead letter are seeded by date already — a routine's condition reads yesterday's outcome (pure). The barber's awning roll-out needs a live awning (baked today) | L |
| 9 | the lobby line + the doorman | **plug-in** | `people.line(n)` (`people.js:160`), `setLine` (`scene.js:1378`); `lineMembers` fakes guests with seeds 4000 + i (`:62–68`) → `line(players)` + `lookOf(name, seed, { accent })` tints a scarf / dress / band. The doorman = a routine post at `sideDoor` (the placeholder exists, `harbor-layout.js:457`); the line entering on game start uses (6) | S |
| 10 | performance shape | **ok; the cap by tier missing** | ~20–26 path ops a figure (×~1.7 with the rim at tier ≥ 1); no sprite cache, every frame vector. Dancers +6 × (body + 2 wand strokes + 4 trail strokes) ≈ +200 ops; (4)'s rim-to-head change pays for part. Add `FOLK.cap` by tier (through `budget(k)`), the roof guests off at tier 0, the trails off at tier 0 | S |

**The recommended shape (no rewrite):** (1) a figure = `{ x, z, hd, dir, dist, pose, phase }`; `folk.js` a 2.5-D parametric rig
— one skeleton, the facing from `hd` (side / 3/4 / front / back one formula, turns continuous), a keyed 8-pose cycle, the stride
still locked to `dist`. (2) The planner keeps the A / B blocks for the crowd and gains a THIRD, SCHEDULED layer
(`core/harbor-routines.js`): fixed / windowed, multi-stage, hours long, with props + vehicles; the set pieces (the dance circle,
the doorman, the workers) live there; the blocks plan around its occupancy. (3) A door controller: a pure `doorOpenAt()` read by
`speakeasy.js` (the leaf + the spill) and `people.js` (the clip, the order, the sounds). (4) The party drives the people through
`peopleEnv` (the beat + the palette) and the rig through `centrepiece.set({ rig })` without a piece.

### A3. Look risks at phone size (390 / 402 / 430; day, dusk, night, party)

Screenshots in `tests/integration/shots-frev*/` (not committed): `night-402x874-stage.png`, `day-390x844-facade.png`,
`party-430x932-facade.png`, `catch-390x844-shop.png`, `day-390x844-shop-z3.png`, `hush-390x844-facade-z2.png`, the walk burst.

| # | sev | what I saw | where | fix |
| --- | --- | --- | --- | --- |
| L1 | HIGH | **By day the people are flat black cut-outs** (every figure in `day-402x874-stage.png`), and a figure on a diagonal is a side profile gliding — the owner's notes 1 + 3; at night the silhouettes + the rim read well | `folk.js:133–138` (the lit() darkening), `harbor-people.js:324` | A2 rows 1, 3, 4 |
| L2 | HIGH | **The ivy is a solid crimson column** that reads as a flame up the pier by day (`day-390x844-facade.png`, zoomed `day-390x844-shop-z3.png`); at night it is invisible (fine) | `speakeasy.js#paintIvy`, `IVY` | the owner's note 6: sparse stems with brick between, leaf clusters, crimson / scarlet / green / amber, farther up |
| L3 | MED | **The date stone is a flat white card with "1924"** (every facade shot); **the trim** (cornice, sills, lintels, the parapet band) is flat cream with no shadow under the cornice — the one place the facade reads "drawn", not "built" | `paintDateStone`, `DATE`; the trim in `paintFront` | notes 7 + 8 (carved tablet "EST. 1924", a moulded border; limestone with crisp shadows under ledges + dentils + a little soot) |
| L4 | MED | **The TV window by day is a flat slate-blue panel** (`day-390x844-facade.png`, upper right): no sash reflection, no room — the only window that doesn't read as glass by day | `windows.js#tvRoom` / `glassOf` | by day draw it as the other panes (the sky's reflection + the dim room), the TV only from 10 pm |
| L5 | MED | **People POP at the doors and the bus**: the fade legs (alpha in / out over the step) — the only transition in the foreground that isn't physical | `visitAt:333`, `planVisit:268, 286, 296`, `busRiders:391` | A2 row 6 (real doors) |
| L6 | LOW | **The hush sign reads** at 11 pt (JA / ZZ, 2 × 2) by day and at night behind the jazz room's silhouettes — as decided; a 5-letter word at 8.7–9.6 pt will be a squint — Lobby 2.0 should prefer 4-letter words or the owner accepts the size | `hushsign.js`, `core/harbor-hush.js` | — |
| L7 | LOW | **The pole at an iPhone's dpr 3** (`party-402x874-pole-z4.png`): the twists are crisp but the tight halo + the brick's light make a soft rectangle round the glass — by design (FP2's "no smoke"), just note it is the softest thing on the shopfront | `speakeasy.js#poleHaloCv` | none |
| L8 | LOW | **The dusk (18:56, `catch-402x874-stage.png`)** is the weakest light: the whole stage is a flat warm-pink wash (the sunset's tint over the cobbles + the facade) while the lamps are already on; the night a minute later is far richer | `tones.js` (the golden / dusk blend), `stage.js` | 6b's sky pass: let the facade keep its own warm light at dusk; the blue hour from `harbor-dark.js` earlier on the stage |
| L9 | LOW | At 390 the bench + the crabapple sit tight against the blade's foot and the far-left lamp's globe is cut by the screen's edge (`night-390x844-stage.png`) — deliberate per PF, but the globe is the brightest cut object | `core/harbor-promenade.js#PHONE` | nudge the far-left lamp in by ~6 pt at 390 or let the edge cut its post, not its globe |

**Not seen (checked):** nothing doubled (the gilt is drawn once; the awning lamps, the sconce, the pole, the blade's bulbs
each once); the glass is clean (no haze); the readout aside, nothing fights the facade for attention at night; the blade's
stacked names ≥ 10 pt; the cobbles flat; the crosswalk lit.

### A4. Performance — what the foreground costs

`title-perf.mjs --city 2 --vs "<scene> + force=no-people" --cpu 4 --size 402x874 --pairs 2` (the laptop, no GPU, A = with the
people, B = without; the party windows ran on a LOADED laptop — 100 % slow in A — so only the direction of that row counts):

| scene · tier | scene draw A → B (ms at 4× CPU) | work A → B | verdict |
| --- | --- | --- | --- |
| np-night · t2 | 19.7 → 14.4 | 10.1 → 7.3 | the people ≈ 5 ms at 4× ≈ **1.3 ms on a phone** at tier 2 |
| np-night · t0 | 17.3 → 10.7 | 9.8 → 4.9 | ≈ 6.6 at 4× — tier 0 pays MORE than tier 2 (no cap by tier, the rim off is the only saving) |
| np-party · t0 | 47.0 → 23.4 (loaded) | 47.6 → 29.7 | the people are about HALF of the party's tier-0 draw on this laptop; magnitude unreliable, the direction not |

The owner's iPhone on a party night (8P note 5): tier 2, 60 fps, 2 % slow — the phone is fine at tier 2. The exposure is
tier 0 / 1 (an older phone, Low Power) on a party night, where the people cost more than the night's whole budget. **The
cheapest wins, in order:** (1) `FOLK.cap` by tier (12 / 9 / 6) + the roof guests off at tier 0 (S); (2) the rim pass head +
shoulders only (A2 row 4 — also the look fix) (S); (3) a per-figure sprite cache for POSES (sit, wait, chat, watch — a figure
standing still is re-stroked every frame; cache by look × pose × lit-key, invalidate on the lit key) (M); (4) the walkers stay
vector (the stride lock needs it). **Where the wand dancers fit:** +6 dancers ≈ +200 path ops + the trails; at tier 2 inside the
party's budget on the phone; at tier 0 the trails off and the circle 4 instead of 6; the cap by tier is the lever. The party's
real cost stays the neon's second additive draw per punch (review-2 §1b-1), not the people.

### A5. Tests, the flaky checks, the cloud split

- **The suite:** unit 590 / 590 green in 27 s. The harbor E2E has 4 `okF` (known-flaky pixel probes → warnings on CI:
  `:608, :790, :1571, :1607`) and 11 `okT` (timing → warnings). The two `[harbor]` runs since the split: run 1 (ab46b44) 4 m 14 s
  wall, 3 jobs green, `street` red on the pole's NIGHT probe (fixed in 71d77d4: the probe off the core + a relative red); run 2
  (by hand, `street` only) red on "NO SMOKE round the pole" (a far probe inside the shop window where the mirror door's amber
  came on between readings — moved onto brick; not re-run per the two-run cap). The PARTY probe (`:1571`, `okF`) is B5: a test bug.
- **Flaky by construction, still:** the `speakeasy` group's light probes now run `&force=no-people` (right); the mirror-door
  probe moved above the sign (right). Remaining: "NO SMOKE round the pole" reads 6 points 15–28 pt from the pole across two
  moments with the shop's mirror door + the basement's flicker both live in that area — gate those two during the probe
  (`speakeasy.mirror(0)` + the basement's flicker off through a flag) rather than moving probes again (S).
- **Gaps:** no E2E of the surge's real trigger (B3's test), no load test (B1's test), no weather-mapping test beyond
  `weather.test.mjs` (B2's table), the people's `budget(k)` and `setLine` are called by nothing but the E2E's preview; a
  "frame-burst" check that no figure's alpha changes while on the open floor (the door fade) would pin L5.
- **The cloud split works as intended:** untagged pushes show `skipped` in 1 s; the tagged push ran 4 jobs; "Re-run failed
  jobs" re-runs one. Two notes: (a) the quick `tests` workflow (unit → rules → /api → smoke, ~5–7 min) runs on DOCS-ONLY pushes
  too (`docs: 8P's second cloud run…` cost 6 m 57 s) — a `paths-ignore: ['docs/**', '*.md']` on tests.yml saves ~7 min per
  docs commit (S); (b) `harbor-jobs.mjs`'s `SECONDS.people` is a laptop guess (70) — refine from the first green cloud run.

---

## C. THE TODO LIST FOR FP3 (one ordered list; the owner's 8P REVIEW NOTES merged in)

**Restructure first? One thing, small: the lighting seam (A1 H2 + H3), done as the first step of the people's colour work.**
Nothing needs a rewrite before building, but the people's day colour + night rim (item 6) is where the figures meet the
lamps — so move `sunShadow / lightField / lightSources / pieceCtx` into `core/harbor-light.js` with ONE `lampLight()`, point
props / trees / roadlight at it (breaking the stage ↔ props cycle), and take the sounds out of the three painters into ticks,
BEFORE touching the figures (≈ half a day together). The facade's `power(k)` hook (H1) is an afternoon's S in FP3; the raid
that uses it is 8b's. The deletions (H4, H5, H6, H15) are an hour. The file splits (A1's list) happen as the first step of
the item that touches each file — `speakeasy.js` with item 10, `windows.js` with the next moments pass — never as their own
pass; and the people's heading (A2 row 1) before any walk-cycle work.

**Do NOT touch in FP3:** the clouds' art and the veil's look (6b), the raid / cabs / wildlife / the workers' routines (8b — but
build the routines LAYER's skeleton only if the dance circle needs it, see 9), the party show's neon, the water, the sky lanes,
the blade (approved), the hush sign's size (decided), the bus's stop position (decided), `tuning` of the party's timing.

| # | what | from | size | test |
| --- | --- | --- | --- | --- |
| 1 | **THE POLE CHECK**: two columns at 0.25 / 0.75, back to `ok` (B5) | FREV | S (10 min) | `ONLY=speakeasy` locally |
| 2 | **THE SURGE**: the start detector, one `signSurge(reason)` + the 10 s cooldown, the gate on `is-steady && !is-day`, pending on intro / busy, the day peak held ~300 ms longer (B3) | FREV + the owner's decision | M | the new `neon` checks; the owner's phone by day + the music button |
| 3 | **THE OVERLAYS**: both DOM strips, foldable to one line by pointerup, remembered per device, at the top under the buttons, never over the promenade, 9 px; the readout off the canvas (B4) | FREV | S | `ONLY=core` (a fold / unfold check), a 390 screenshot |
| 4 | **THE WEATHER**: `normalize` by LAYERS (`opaque` / `veil` / graded `fog` + `mist`), the raw fields in the answer, 45-min staleness, the nine `LK.cloud` consumers on `opaque`, the readout's two lines, `&wx=mist\|stratus\|highovercast` (B2). The VEIL's look itself waits for 6b — in FP3 the veil just means "not overcast": a clear sky slightly whitened, the sun kept | FREV | M (server + client; deploy on push) | `weather.test.mjs` table, `harbor.test.mjs` tones, `ONLY=sky` |
| 5 | **THE LOAD GATE**: coalesced resizes in the load window, measure-not-report, the reveal gate + the fade from dark with the sign, no stretch after the reveal, the tier frozen during load (B1) | FREV | M | the new `load` group (job `city`); the owner's iPhone on cellular |
| 5b | **THE CLEANUP before the people** (A1): `core/harbor-light.js` + one `lampLight()` for props / trees / roadlight (H2), the sounds out of the painters into ticks (H3), `speak.power(k)` (H1, the hook only), the deletions (H4 placeholders, H5 parked traffic, H6 dormant props to their own files, H15 leftovers), the 8 stale comments (H13) | FREV | M (half a day) | the unit suite (the pinned dead-path tests in `harbor.test.mjs:2643–2688, 3010` edited to match), `pixdiff.mjs --scenes night,noon,party` = no look change, `ONLY=speakeasy,promenade,sounds` |
| 6 | **THE PEOPLE — pace + colour + rim + the bus door** (A2 rows 4, 5, 10; notes 3, 4, 12's door): the speeds, day clothing + skin + hair + a brim shadow + a lit / shade side, the rim on head + shoulders, `FOLK.cap` by tier + the roof off at tier 0, the bus door closing 3–5 s after the last rider | the owner (3, 4, 12) | S–M | `harbor-people.test.mjs` (speeds, the cap), `folk-preview.html` at day / night / gold, `ONLY=people` |
| 7 | **THE PEOPLE — heading + facing + the walk cycle** (A2 rows 1, 2, 3; notes 1, 2): `hd` smoothed at corners, the 2.5-D rig (front / back / 3/4 / side from one formula), the keyed 8-pose cycle with knees, hips, shoulders; the diagonal stride test | the owner (1, 2) | M | the stride test on a diagonal; a frame burst at 402 (`--every 120 --count 8 --crop stage`) read frame by frame |
| 8 | **REAL DOORS** (A2 row 6; note 13): the `door` leg, `doorOpenAt()`, `speakeasy.door(id, k)` (the leaf, the reveal, the amber spill), the clip in the near pass, the sounds on the transitions; the fade legs gone everywhere but the bus's far side | the owner (13) | M | a burst at the side door at night; "no alpha on the open floor" check |
| 9 | **THE GLOW-WAND DANCE CIRCLE** (A2 row 7; note 5): the routines layer's SKELETON (one scheduled set piece with occupancy), `peopleEnv` with the beat + palette, the rig on without a piece, 4–6 dancers + wands + short trails + the watchers; tier 0 no trails, 4 dancers | the owner (5) | M–L | `ONLY=people,party`; the owner's iPhone readout on a party night (tier, slow %) |
| 10 | **THE FACADE**: the ivy sparse + higher (note 6), the carved date stone (7), the stone trim with shadows + soot (8), the TV window as glass by day (L4) — doing the `speakeasy.js` split first | the owner (6, 7, 8) + FREV | M | `--crop facade --zoom 2` at 390 / 430 by day + night, three refine passes |
| 11 | **THE JETS** +3 dB, a deeper duck (note 10); the bus's period detail + cream-over-maroon livery (12) | the owner (10, 12) | S + M | `ONLY=sounds`; `--scenes day-bus` burst |
| 12 | **TESTS + CI**: `paths-ignore` for docs on tests.yml; the NO SMOKE probe gated instead of moved; `SECONDS.people` from the cloud | FREV | S | the next `[harbor]` push |
| 13 | **DOCS**: harbor.md's 8P Known issues (the pole struck), the load gate under performance, the readout's new place, the weather line in docs/title.md's LIVE WEATHER, CLAUDE.md's `&debug=1` line | FREV | S | — |

**Order and why:** 1–3 are the owner's daily annoyances and each is small; 4 is a server change (push early so the afternoon's
veil stops rendering grey); 5 is the biggest single-visit impression and independent of the people; 6–9 are the people in
the order each step ships visibly (numbers → the rig → doors → the circle); 10 last because it wants the file split and
three screenshot passes.

**Split into its own pass instead:** the WORKERS' SCHEDULE proper (A2 row 8 — the routines layer with props + vehicles + the
live awning: L, it is 8b); the multi-model / METAR weather upgrade (the owner's call, M–L); a sprite cache for still poses
(A4 item 3, only if the phone's tier-0 readout asks for it); the `speakeasy.js` / `props.js` split beyond what 10 needs.

**Estimate for FP3 as listed:** 1–5 ≈ 5–6 h; 5b ≈ 4 h; 6–9 ≈ 6–8 h; 10–13 ≈ 3–4 h → **two sessions of Opus 5.5 high (≈ 18–22 h
of work)**, or FP3a (1–5 + 5b + 6, the fixes everyone sees + the cleanup) and FP3b (7–11, the people and the facade). Testing per step: the unit
suite + the named `ONLY=` groups locally; ONE `[harbor]` push at the end of each half (the two-run cap).

**The city's rules, checked against this list:** the night look stays the bar (nothing here dims the night; the overlays leave
it); iPhone vertical first (every fix measured at 390 / 402 / 430); crisp light, no haze (the doors' spill is a `soft()` pool like
the sconce, not a glow); nothing pops in or out (the reveal gate, real doors, the stale bakes held in place).

## Needs the owner's decision
1. The weather's AREA: keep 0.5° (privacy, today's 14 km) or 0.1°; and whether to spend the multi-model median (M).
2. The surge's length by day: hold the peak ~300 ms longer (the recommendation) or keep the 2 s flash.
3. Where the folded overlays sit: top under the corner buttons (the recommendation) or the bottom above the dock in one line.
4. FP3 as one long pass or FP3a / FP3b.
