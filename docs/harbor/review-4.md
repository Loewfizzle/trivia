# CITY 2.0 — REVIEW #4 (read-only, Oct 28 2026: everything since review #3)

Fresh eyes on the city after nineteen passes in four days (9a → PROM), at commit `5604e02` (plan.md's owner notes committed as
Step 0). Nothing but this file and plan.md was written. Method: four parallel read-only investigations (the cloud's flakes from
105 job logs of 15 runs; the code's health + the docs vs the code; the owner's PROM notes traced to their drawing calls; the
legends / jets / moments / crisp systems against SKY's list), every headline claim re-read in the code by hand; the phone path
measured in Chromium at 390×844 DPR 3 with every live canvas tracked by its creation site (a `WeakRef` list under
`document.createElement` + `getContext`) across eight states at tiers 2 and 0; the foreground's live cost A/B'd A B B A in one run;
a 20-minute soak at tier 0 (a Saturday 21:48 → the party) sampled every minute; the camera + the promenade's numbers dumped at
390 / 402 / 430; the shopfront + stage shot at the three widths. Sizes: S < 30 min · M = 1–2 h · L = half a day or more.

## The verdict, in plain words

**Healthy.** The city runs an hour without growing where it matters: canvas memory is flat (37.3 → 38.2 MB over 20 minutes at
tier 0, peaking 39.0 — the party's beam sprites, capped at 40), the JS heap breathes between 45 and 66 MB with no trend, no
timers or audio nodes pile up, and the frame cost at a party peak is lower at minute 16 than at minute 1 (the only thing that ticks
is Firebase Auth's IndexedDB poll, 75 requests a minute, churn not a leak — B2). The cloud's three
"recurring" city-job killers were real bugs and two are already fixed (LOAD WEATHER in 9f, the word that never cleared in CONN);
the suite has been green when nothing was wrong in the last two tagged runs that had nothing wrong. The PURE / screen split
held through nineteen passes; every system still has a factory + a `debug()`; the lighting seam review #3 asked for is built
(`core/harbor-light.js`, `speak.power()`, the sounds out of the painters). The owner's PROM complaints all have a clean cause
and a contained fix — none needs a rewrite.

**Risky.** (1) **The memory readout under-reports by ~32–43 MB**: `harbor().mem` says 42.6 MB on a plain night, the live canvases add up to
75 MB — the sky pair + the stars (10.5), the sign's Halloween dressing at full dpr 3 (8.8, the same at tier 0), the main canvas
(5.3), the tubes, the frost pane (5.3, whole-screen) and the beams live outside it, so the tier budget guards a third of the
picture. Not dangerous today (iOS's canvas ceiling is a quarter of RAM — ≥ 1 GB), but the number the tiering trusts is wrong.
(2) **The legends are a chain, not a registry**: `'ufo' || 'tr3b'` is spelled out in ~50 places across seven files — SKY's
Blackbird would be the third copy of every branch unless the table comes first. (3) **`windows.js` (2227 lines) and `scene.js`
(2996) are the two files every pass lands in**; the moments system only knows short scenes (an hour's plan refuses a moment that
crosses the hour, `MAX_AT_ONCE` counts a two-hour one against everything) — the shadowboxer needs one generic "long scene" branch.
(4) **The foreground is more than half the frame** (B1: 35–65 % of a calm night, 45–65 % of the party peak) — every live `'lighter'`
pool, the people, the facade's lit layer; it is where the next frame-time win is, and where 3× would cost the most.
(5) **The compass-left move conflicts with three rules** (C3): at f 0.515 a centrepiece on it hides the water bench entirely,
squeezes the side door's landing from 5.5 to 1.3 units while the giant stands, and cuts the cab stand's waiters' route — the owner
must pick which rule wins before C4 builds it.

**Fix first (in this order):** the people's return after the UFO (the owner saw it; M), the barbershop +
the lit blind + the awning (the shopfront is the one place the night looks fake; M + M + S), the wet streaks (S), the cab-stand
sitter (M), the doorman (M), the crosswalk's light + the cars through it (M); the cloud's five test-side fixes in one sweep (S each);
the readout's honest total (S); the legends table + the moments' long-scene branch as SKY's Group 0 (M + M).

**Can the foreground be 3×?** Memory says yes, the frame says not as a band on the phone. The city's canvases total 70–83 MB in
every state at 390×844 (tier 2 = the city at 2×; tier 0 draws the whole city at 1×, so "tier-0 phones at 3×" would be 9× their
pixels), against WebKit's iOS canvas budget of RAM ÷ 4 (≥ 1 GB on a 4 GB iPhone; the 224–384 MB figures in the 2018–19 bug reports
are from older builds) — a 3× foreground band adds ~9 MB of bake per set (+18 MB during a crossfade) and a ~3.4 MB overlay: nothing.
But the live foreground (the facade's lit layer + the doors + the awning + the people) is **35–65 % of a calm night's frame and 45–65 % of the party
peak's** on the A/B (a calm night at tier 2: 39–51 ms with it, 25–26 without, on the throttled laptop; tier 0: 24–32 vs 11; the party
at tier 2: 68–95 vs 37–40) and its cost is fill-bound, so 3× means ×2.25 of that: a calm night ≈ +40–60 % of its frame, and the party
peak — where the tier already steps on the owner's phone — goes further over. It fits only on calm nights, and a 3× ↔ 2× step on a figure's edges and the brick's joints IS visible (9c's crisp
layer exists because 2× reads soft on lettering) — hidden only behind a bake crossfade. The recommendation: do not build a 3×
band; (a) give the owner a `&dpr=3` debug flag (S: raise `TIERS[2].dpr` from 2 to 3 under the flag) so he judges 3× on his iPhone
unzoomed on a calm night + a party with the readout open — the only measurement that counts; (b) extend the crisp layer instead
(the owner's own idea): the upper windows (SKY), the shopfront's glass + gilt + the awning's valance, the date stone — small, still,
nothing moving in front; the people stay at 2× (the eye forgives 2× on motion, it is the stills that read soft).

---

## A. HEALTH since review #3

### A1. Code health (what got done, what came back, what is new)

Review #3's eighteen items: **done** H1 (one power hook `speakeasy.js:496–508`, driven from `scene.js:1927–1928`), H2 (`core/harbor-light.js`
is the one lamp model; props.js no longer imports stage.js), H3 (sounds out of the painters: `people.js:443 tick()`, `roadlight.js:59`,
the windows' cues in `city-sounds.js:419`), H4, H5, H6, H16, and the `speakeasy.js` / `props.js` splits. **Partly** H10 (the marquee
still baked unlit `speakeasy-bake.js:13` + lit live `speakeasy.js:200–216`), H13 (8 stale comments remain), H14 (`?season=` still read
`scene.js:809` beside the `season-*` rows), H15 (10 real `void x`), H18 (moot — the ivy is gone — but `scene.js:1231` still maps a
forced season to a `month` in the facade's bake key that nothing reads: a pointless re-bake). **Dropped** H7 (the course loop twice),
H8 (grew: 12 private glow caches), H9 (grew: ~30 night thresholds), H11, H12, H17 (~45 bare `roundRect`s, 1 guarded). **`windows.js`
was never split** (2227 lines).

| # | sev | what · where | why it matters | fix | size |
| --- | --- | --- | --- | --- | --- |
| H1 | HIGH | **The lamppost painters are dead but shipped + called every frame.** `PHONE.tall: []`, `globes: []` (`core/harbor-promenade.js:89, 92`) → no lamp is ever `'tall' \| 'globe'`; `stage.js:184 lampLook`, `:190–252 drawLamp`, `:278–303 drawLampLight` (still called `scene.js:2026` each frame), `:165–180 lampShadows`; `harbor-light.js LIGHT/REACH.tall+globe :40–46, TALL_K :47, FACE.tall/globe :124`; `PIECE.tall/.globe`, `PROM.globes :28` | review-3's lighting seam re-grown as a ghost: two lamp systems in the code, one on screen; ATM's wet / fog light would have to decide which to feed | delete the post painters + constants (git keeps the art); `L.lamps` = implied only; check `roadLampAt` (it now reads the implied row at z 21.5 < `ROAD_LAMP.zMax` 40 — is that the light meant for a crossing car?) | S |
| H2 | HIGH | **12 radial-glow sprite caches** (H8 ×2): speakeasy.js:224, windows.js:662, strings.js:52, centre.js:56, roadlight.js:24, motorcar.js:14, vehicles.js:568, holidayprops.js:164, raid.js:55, boats.js:45, air.js:132, chimneys.js:22; 170 `createRadialGradient` calls in 60 files | twelve falloff curves = twelve halos; Part 10's fireworks + 11b's lights add more | `ui/glow-sprite.js#glowSprite(col, stops, size)`, one cache keyed by its args | S |
| H3 | HIGH | **Night thresholds re-derived in ~30 sites** (H9 ×2): windows.js:797/1338/1558/1567/1579/1973/1983 (`k > 0.3`), :1893–1917 (0.4); strings.js:131/134; bus.js:36; motorcar.js:35; people.js:298; props.js:101/333/469/503/611; harvest.js:59/224; folk.js:554/896 — while `harbor-dark.js#windowsNight / isNight` is read by scene.js only | the facade flips to night in steps; ATM's overcast darkness won't reach the painters | the frame env carries `night` / `dusk` + `dk` from harbor-dark; the painters stop comparing | M |
| H4 | HIGH | **47 force flags read in Harbor code with no panel row** (`scene.js:1637 const off = clock.force`): demo, sat + 45 `no-*`; 20 of them appear nowhere in docs/harbor.md either (no-birds, no-climate, no-fog, no-glasswx, no-leaves, no-legends, no-lightning, no-promenade, no-rain, no-rainbow, no-rays, no-road-light, no-snow, no-snowcaps, no-snowfall, no-snowman, no-speakeasy, no-sway, no-tower, no-wet); `cleanRemote` refuses them from the panel | the A/B switches are undiscoverable + unvalidated | one `AB_FLAGS` list in harbor-remote.js (a hidden TOOLS group) + a unit test that greps every `.has('…')` literal in js/ against the registry | S |
| H5 | MED | **259 exports with no importer, 288 imported only by tests.** Truly dead: `harbor-beat.js halfTime`, `harbor-centre.js TONES`, `harbor-hush.js hushGlass, hushPlan`, `harbor-moments.js tvColour`, `harbor-parade.js unitHead`, `harbor-remote.js EVENT_GROUPS`, `harbor-speakeasy.js GROUND`, `harbor-windows.js FONT`, `harbor-workers.js workAt, BUNDLES`, `balloons.js BTC_ORANGE`, `fogbeam.js fogBeamFree`, `props-garden.js mailboxBox`, `speakeasy-geo.js DOOR_FLOOD`; whole dead groups in `signs.js` (SIGN_NAMES, POSTER_PAINT, tubeWidthFor, frameGeom, LAMP_C, drawGooseneck, lampLightMap, lampGlows, MARKS), `windows.js` (15), `harbor-neon.js` (11), `blocks.js` (11), `harbor-light.js` (HIDDEN, hiddenLamps, TALL_K, LAMP_SHADOW, TREE_LAMP, ROAD_LAMP) | every export is a promise the next reader checks | un-export (one script pass); delete the dead ones | S |
| H6 | MED | `mix` copied in 19 files, `clamp01` in 76, `smooth` in 26, `rgb` in 15 — `shapes.js:5–7` exports three of them | 136 copies of four one-liners | import from shapes.js (mechanical) | S |
| H7 | MED | **Seeded RNG re-implemented**: mulberry32 copies in balloons.js:25, drones.js:24, glasswx.js:25, moon.js:27, wands.js:32 (+ district ×6, core/party.js:149, core/street-life.js:12); sin-hashes in harbor-roofmodes.js:24, harbor-show.js:134, snow.js:77, giant.js:170, lighthouse.js:26 = water.js:37; FNV in climate.js:16 = sky.js:21 = party.js:150 = ranks.js:88 — while `core/rng.js#rngFrom / hashString` is imported by 53 harbor files | two generators for "the same seed" on two phones is exactly the bug class PROM's cab test hunted | `rngFrom` / `hashString` everywhere; one `hash2(i, j)` in rng.js | S |
| H8 | MED | **"Is a party night" derived four ways**: `PT.on > 0.3` (scene.js:417, :1171, :1488, :1939), `> 0.5` (:1644, :1803, :2014, :2198, :1860), `> 0` (:1427, :1764, :2206, :2211), `> 0.05` (:1173); `harbor-legend.js:42` and `harbor-moments.js:94` each re-derive `pd === 5 \|\| 6` | Part 10 adds a fifth cut | `PT.party` (one boolean, one cut) + `core/party.js#isPartyEvening()` | S |
| H9 | MED | **The vehicle kinds mirrored**: `core/harbor-traffic.js:26–27 LEN / SEQ` "mirrors vehicles.js#vehicleFor" (`vehicles.js:43–80, :99–100`); the test checks each cycle, not that they match | a new back-road model = two tables | `core/harbor-vehicles.js` (lengths + SEQ, pure) read by both | S |
| H10 | MED | `harbor-people.js` import cycles: harbor-cabs / -crew / -raid / -witness / -spots / -wildlife import from it while it imports them back (works only because the uses are inside functions) | a top-level use throws at load | the split below makes the base a leaf | M |
| H11 | MED | The course loop twice (`stage.js:74–102` vs `street.js:143–175`): 9b's snow + 9a's wet were already written twice | | `street.js#paveCourses(spec, paint)` | M |
| H12 | LOW | Stale pass comments: `speakeasy.js:13, :110, :551` ("for 7b"), `clouds.js:18, :317` + `water.js:27, :197` ("Part 9 adds…" — ATM's now), `harbor-remote.js:251` ("snow comes with Part 9" — shown IN THE PANEL), `harbor-routines.js:5, :97`, `harbor-layout.js:451`, `harbor-remote.js:27` (`&panel` — a dead flag) | the next reader builds on wrong premises | rewrite 11 comments | S |
| H13 | LOW | `void x` ×10 real: balloons.js:134 (×2), dress-thanksgiving.js:120, harvest.js:176, legends.js:104, speakeasy-bake.js:539, speakeasy.js:454, street.js:293, wetground.js:210, harbor-holidayprops.js:216, harbor-spots.js:41 | | delete the variables | S |
| H14 | LOW | Dormant promenade pieces still planned: `planters` from `PHONE.planters`, `mailbox`, `PIECE.planter` (`harbor-promenade.js:254`); props-garden.js (365 lines) statically imported `stage.js:15`; CLAUDE.md:144 lists "planters … + the mailbox" as live | the spot system reasons about pieces not on screen | decide: ship or drop; props-garden lazy like props-test | S |
| H15 | LOW | `windows.js:1047–1060, :1949–1950` repaint the bar + bartender every frame by day (H12) | | a sprite keyed by (state, lit, T) | S |
| H16 | LOW | ~45 bare `roundRect` (street / road / lighthouse / signs ×12 / glasswx / gear / banner / balloons / tubes / wheel / workers / vehicles ×15); `tests/safari-floor.test.mjs:28–68` pins TLA / ctx2d / safeCtx only | fine on iOS 16+; the floor test doesn't say so | one `shapes.js#rrect` or one assertion naming the floor | S |
| H17 | MED | **The sign's dressing canvas ignores the tier**: `signdress.js:141 dpr = Math.min(3, devicePixelRatio)` → 3 × 2.94 MB (1130×650) on every October night, the same at tier 0 where it is the single biggest consumer (8.8 of 36 MB) | the tier budget is meaningless for the one canvas that is never in it | `dpr` from the scene's `dprTier` (3 / 2 / 1.5); free `silk` + `glow` when no piece is up | S |
| H18 | MED | **The frost pane is a whole-screen 2× canvas** (`district/frost.js:10, :23` — 780×1688, 5.3 MB) kept through every snowy night, outside the readout | the second-biggest unlisted canvas | size it to the glass it frosts (the city band above the dock); drop it to 0×0 when `fz === 0` | S |
| H19 | MED | **`harbor().mem` (`scene.js:2995 memAll`) counts the bakes, the water, the wheel + boats and the merged bands only**: measured 42.6 MB reported vs 75.1 MB live on a plain night, 42.6 vs 83.2 at a party, 38.7 vs 70.6 in snow (B1's table). Outside: the sky pair (`scene.js:142–143`, 2 × 3.5), the stars (`district/stars.js:86`, 3.5), the dressing (8.8), the main canvas (5.3), the tubes (3.2 → 6.9 at a party), the beams (4.8–5.3 at a party), the frost (5.3), glasswx (4.9 in snow), the speakeasy's sprites (1.2), the moon (1.1) | the tiering's memory judgement reads a third of the picture | a tracked total: register every Harbor canvas through `canvas-safe.js#safeCtx` (every Harbor context already passes through it — add a `WeakRef` list + `canvasMb()`), the readout shows both | S |

**The splits, by responsibility (do each as the first step of the item that touches the file):**
- `scene.js` (2996; one closure; `draw()` 1601–2093 = 493 lines; the `harbor()` API 2813–2993 = 47 keys): `scene-legend.js` (278–400 the legendaries' wiring + the dark city bake, 404–451 the raid, 1130–1156), `scene-weather.js` (497–561, 813–853, 923–947, 950–1035), `scene-holiday.js` (164–240, 569–605, 1350–1441), `scene-perf.js` (1480–1600, 2094–2176, 2524–2692), `scene-hero.js` (1044–1130, 2177–2365, 2458–2523); `scene.js` keeps state, layout, the bake pipeline, `frame()`, `draw()`, the panel, resize / reveal / API (≈ 1300). SKY touches 278–400 + draw 1638–1651, 1716, 1992; ATM 1703–1712, 1827, 1859, weatherTick; Part 10 partyTick 1380, skybeams 1792, strings 2027, startFinale; 11b xmasPrelude 574, xlights 1941, chimneys 1788.
- `windows.js` (2227; `createWindowLife` 655–2226): `window-figure.js` (244–653), `window-rooms.js` (42–243: glassOf, boxOf, deepAt, paintBox, lampFall, walkIn, paintRoom, paintBar, paintLampRoom), `window-holiday.js` (1619–1881 + 2016–2133 — 11b's home), `window-paint.js` (PAINT 1882–2213 + bossShade 919–1029 + barState… 1030–1155 + tvRoom 1242 + partyRoom 1325 + the shop 1411–1538), `windows.js` (655–876 + 1539–1618 ≈ 330). SKY adds the shadowboxer as one painter + one moment; C4 rebuilds the shop + bossShade here — split FIRST.
- `folk.js` (1346): `folk-look.js` (22–143 + 1169–1224), `folk-rig.js` (144–515), `folk-holiday.js` (904–1030, 1045–1168, 1225–1346), `folk.js` (516–903). C4's seated rig + the doorman's look land in folk-rig / folk-look.
- `harbor-people.js` (1346, PURE, the cycles): `harbor-folk-base.js` LEAF (34–75, 136–262, 356–401, 497–537), `harbor-visit.js` (263–277, 314–355, 402–496, 538–595), `harbor-mix.js` (76–135, 596–702), `harbor-people.js` (278–313, 703–1229), `harbor-roof.js` (1230–1346); re-exports keep the ten tests' imports.
- `neon.js` (1118): `neon-layout.js` (59–230), `neon-sprites.js` (231–484), `neon-show.js` (780–1038 — Part 10's), `neon.js` (485–779 + the API). `legends.js` (983): `legend-sprites.js` (32–375), `legend-ufo.js` (376–454 + 717–906), `legend-tr3b.js` (611–716), `legends.js` (455–610 + 907–983); a Mothman / a Blackbird = `legend-<id>.js` on the same pattern.

**The seams.** A new **legendary** is a CHAIN: `'ufo'` / `'tr3b'` as ~50 literals (legends.js 24, scene.js 9, sounds.js 4, harbor-legend.js 4, harbor-witness.js 2, harbor-remote.js 2, harbor-people.js 1); the implosion is not on the machinery at all (special-cased in scene.js:255, :272, :311). Build the table first (D). A new **window routine**: the painter dispatch IS a registry (`windows.js:842 PAINT[e.id]`, the panel rows generated), but the scheduler knows SHORT scenes only (`hourPlan :233` refuses a draw whose `t + len` crosses the hour, `tests/harbor-moments.test.mjs:19` demands `len ≤ 60` unless eyes / holiday, `MAX_AT_ONCE = 2` counts a long one, a plan entry carries `el` / `p` and no phase); every long scene today is a special case (the sax idle `windows.js:832`, the TV / bar / shop by `roomState :354`, the party `windowParty :589`, the fixed calendars `fixedPlan :184–193`). The precedent is Thanksgiving's `table` / `football` (`len: 900`, `holidayPlays :204–213` chops a span into chunks flagged `first` / `last`). A new **vehicle** is a registry with one mirror (H9). A new **holiday** is a chain (`holidayAt :44–80` three hand-written blocks; `'halloween'` in 31 files) — before 11b, make `HOLIDAY_TABLE`'s rows self-describing so `holidayAt` is one phase walker.

### A2. The cloud's recurring flakes (15 logged `harbor` runs since Oct 27; the `tests` workflow green in all 15)

Per job: city **3 green / 12 red**, holiday 12/3, street 13/2, windows 13/2, wild / audio / show 14/1. Only two runs were fully green
(9f, 9g). 13 of the city job's 15 reds come from three checks — two of them real bugs now fixed. The raw logs + a per-job digest
are in the session's scratchpad (not committed).

| # | check (job · group) | runs | verdict | evidence | fix | size |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | **LOAD WEATHER — answered after 6 s** (city · load) | 8 fails of 15; **0 of 4 since 9f** | real bug, FIXED (04eb891) | `e2e-harbor.mjs:1204` on the real clock; the logs: `seen after the reveal: lit crossfade · share, bias, night` — a late weather answer re-keyed the lit layer; `scene.js:1293` now rides the slow blend | close the Known-issues entries that repeat it (SP3 → BNAME) | — |
| F2 | **[panel] timeout: the word gone** (city · panel) | 5 fails; 0 of 5 since 25197fe | real bug, FIXED | `lights.js:316–318` dropped a cleared word only inside the draw the lights skip by day; the runner's daytime made it "intermittent" | — | — |
| F3 | **[perf] timeout: re-bake** (city · perf) | 2 fails (SP6's runs); 0 of 12 since | unexplained, dormant | `e2e-harbor.mjs:1248`; both logs: the lit baker `pending: true` with an **empty key** after `setTier(2)` | if it returns: why `litBaker.key` stays `''` after a tier step | M (if) |
| F4 | 9d's panel timeouts, THE DELAY, RECENT (city · panel); THE DOORS NEVER SNAP; FREEZING RAIN's frost | 2 runs / 1 / 1 | test bugs, FIXED (d21547a) | | — | — |
| F5 | PROM's CAB STAND `[object Object]` + the crisp list (c61f39b) | 1 | fixed, **unproven** (no run since) | | the next pass's run proves them | — |
| F6 | **THE PLANTED FOOT NEVER SKATES: 0.29 (couple)** (street · motion) | 1 of 1 since PROM | **real regression, OPEN, deterministic** | `e2e-harbor.mjs:3125` traces 2026-10-26 15:10 — inside Halloween's build-up: the giant's closed floor (r 5.45) reaches z 37.2, in front of the walkable floor (zMin 38.75); walkers detour on tight chords. Red on every street job until Nov 1 and again next October | see C3 (the compass + the route behind it); until then the motion page takes `&force=no-holiday-props` (the promenade A/B pages already do, `:2440`) | S gate / M fix |
| F7 | **THE DANCERS' ARMS NEVER JUMP** (street · motion) | 1 of 15 | test bug | `:3135` hard; a "jump" (`:2753`) = `dt < 0.06 && Δ > 1 rad` between DRAWN frames — at the runner's 50–100 ms pacing `dt < 0.06` is itself an accident, and the trace starts the instant `dance.k > 0.9` while dancers are still arriving | wait until every dancer has been in `wands` ≥ 1 s; count a jump only after a normal-length frame; or `okT` like its p99 sibling (`:3136`) | S |
| F8 | **HALF-TIME: beats 2 + 4 calm (0.36)** (show · party) | 1 of 15 (+ SP5's) | test bug ("by a hair") | `:414 beats[1] < beats[0] * 0.35` vs `harbor-beat.js:34 BEAT_WEIGHT = [1, 0.45, 0.72, 0.45]` — beats 2 + 4 are 0.45 BY DESIGN; the check passes only by sampling mid-decay | `0.55` (the design + a margin), or sample at `beatU 0.4–0.8` | S |
| F9 | THE SURGE ON THE BEAT 0.112–0.118 off (show · neon, `okT`) | 4 warns | a systematic ~55 ms late fire on the 2-core runner | `title.js:1037–1041` | leave `okT`; 0.15 on CI | S |
| F10 | **THE SPIDER'S TAP: crawl → skitter** (holiday) | 1 of 15 (+ SP6 locally) | test race, OPEN | `:2949` demands `mode === 'crawl'` after a 7 s wait; the NERVES (`dress-halloween.js:327, :514`) turn crawl into skitter on any poke — `title.js:297` (a tired tube every 25 s), `:911`, `:1271`; the log shows everything else passed | accept `['crawl','skitter']` + SP6's wait-for-`still` before the first tap (the BOTH TAPPABLE twin got it, green 11 runs) | S |
| F11 | THE WHEEL… its sprites 0 MB (audio · harbor) | 1 of 15 | test bug (no wait) | `:798` reads `h.wheel.mb` right after 'the neon built'; `wheel.js:176` sets it at the end of a lazy bake | `waitFor(wheel.mb > 0)` | S |
| F12 | **THE UPPER PANES EQUAL ON SCREEN (day)** (windows, `okT`) | **12 warns of 12** — never passes on CI | a wait bug + a quantised tolerance; the warning is dead | `:1991`: scan-line runs in device px (0.5 pt steps) against 2 % of ~26 pt (= 1 device px); the viewport change is followed by `sleep(1800)` not a wait for the re-bake | `waitFor(!pending && !fading)`; tolerance `max(2 %, 1 px)`; by day compare the room rects as the night branch does — then hard again | S–M |
| F13 | LOAD WEATHER — a JUST ME jump into a holiday night (`okT`) | 12 warns of 15; 1 of 4 since 9f | a small real race, mostly fixed | `:1215`; a `neon` re-bake 1.2 s after the reveal on the slow runner | print `keyDiff` in the message; find what in `bakeKey` (`scene.js:1039`) is decided after the reveal on a holiday jump | M |
| F14 | A CALM LOAD STEPS NOTHING (city · perf) | 9 warns | not a check on CI | `:1231 (machine ? okT : ok)` with `machine = judge.p75 > 28` — the runner's p75 is 50–67 ms every time | skip on CI, or assert only the speed-free parts (`grace ≥ 15000`) | S |
| F15 | BATTERY: visible again at 60 fps / a calm night draws N fps (`okT`) | 9 / 3 warns | not a check on CI | `:1322` wants > 20 frames in 0.6 s; the 2-core runner draws 8–20 | skip on CI (the hidden-draws-nothing halves stay) | S |
| F16 | THE TOAST'S BIGGEST ARM STEP (`okT`) | 2 warns | working as designed | the judder count stays hard, never fired | — | — |
| F17 | NO SMOKE round the pole (`okF`), the barber pole, the word towers by day, the freeze group | **0 fails, 0 warns in 15 runs** | — | | NO SMOKE back to `ok` (6b asked for exactly this) | S |
| F18 | A WITCH AT HER CAULDRON fired nothing (holiday · panelrows) | 0 in the cloud (laptop-only, 9g + PROM) | laptop load | | none for CI | — |

The suite today: 509 hard `ok(` · 26 `okT` · 5 `okF` · 1 conditional. **What "green when nothing is wrong" needs:** F6 gated (then fixed
with C3), F7 + F10 + F11's races closed, F8's margin made the product's rule, F12 repaired and made hard again, F14 + F15 skipped on CI;
the Known-issues sections from SP3 to BNAME that repeat F1 / F2 closed. With those, all four runs since 9f would have been green.

### A3. CONN + BNAME

- **The socket opens only where it should.** Every `want()` / `release()` pair: `room.js:19` (`joining` wraps HOST / JOIN / a resume /
  an invite check), `room.js:173 / :258` (`enterRoom` → `exitRoom`), `remote.js:183 / :875` (the admin's live `city2/live` listener).
  Nothing else in js/ calls them; everything else reaches the database through `dbRef()`'s self-releasing `'touch'` (`firebase.js:168–170`)
  or `/api`. The e2e-conn table stands. **The intercom (Part 13) hooks in cleanly at two places and needs no new socket:** (1) in a room —
  the listener set `room.js#enterRoom` attaches (beside `chats/{CODE}`): an `intercom/{CODE}` node (top level, readable by that room's
  players only, like `chats/`), server-written by `/api/admin`, with the clip's URL + its start on the server clock; the room's phones
  already hold the socket. (2) On the title — `remote.js#onLiveNode` / the cached `GET /api/admin?live=1` poll (`:150–156`): add the clip's
  id + `at` to `city2/live`'s answer. The lobby + game screens read it from `state` as they read everything (the hold-until-lobby rule
  is a `view === 'lobby'` gate in app.js, the PULSE exception a module flag). The one new piece is the clip's storage (Vercel Blob) and
  the PA effect in `audio/`.
- **THE BOARD carries no names.** `api/board.js` returns opaque board ids + house nicknames only (`:5`, `isBoardId :15`); the report
  store keeps `pid` server-side (`:62–63`, never in a response); `profiles` is not world-readable (BNAME). Nothing since BNAME re-opened it.

### A4. Docs vs code

| the doc says | where | the code | fix |
| --- | --- | --- | --- |
| "never over **the pill**, the promenade or the dock" | CLAUDE.md:60 | the TEST pill left in 9d (☰ → ADMIN) | "never over the promenade or the dock" |
| THE CITY SOUNDS: "the 63 slots" | CLAUDE.md:146; docs/audio.md:352 | `SLOTS` = 134, 116 filled | "134 slots (116 filled)" or drop the number |
| `&panel=1` shows the panel without an admin | harbor.md:117, :1606; harbor-remote.js:27 | nothing reads `panel` | delete the three mentions |
| E2E groups: 16 names | harbor.md:121–124 | `harbor-jobs.mjs` names 33 | point at harbor-jobs.mjs |
| "Stubs — to come in Part N": people + traffic placeholders (8b), snow (9), storm / rain / snow / fog skies (9), rain rings (9), the witch + the sleigh the district's | harbor.md:409–441 | 8b, 9a, 9b shipped; the cloud kinds + the rings are ATM's | strike the shipped rows; relabel the two open ones ATM |
| `&force=season-*` AND `&season=` | harbor.md:435, 3197, 3525…; harbor-remote.js:28 | both live (`scene.js:809–810`) | drop `?season=` |
| `&frost=pane\|buttons\|both` | harbor.md:8315 (9c) | removed in 9d (:8488) | "(gone in 9d)" at :8315 |
| "lamp posts" as live pieces | harbor.md pass sections (history — fine); **code comments** harbor-holidayprops.js:9, :114, harbor-holiday.js:166, :230 ("garlands on the lamp posts", "bundles round the two tall lamp posts") | PROM: none; the spots re-pinned to the trees (`harbor-holidayprops.js:164`) | the four comments; CLAUDE.md:132 / :144 are right |
| "the bench / cart / planters / the brick INLAY + the mailbox" | CLAUDE.md:144 | planters + mailbox dormant (H14) | say what is on screen |
| `&wheelbg= &lineproto= &idle= &looks= &cover= &layers= &kinds= &band= &light= &scale=` | harbor.md:2152, 6058–6127, 6471, 2491, 2671, 5172 | read by no js/ file (preview pages' / gone) | mark "(a preview page's)" or drop |
| CLAUDE.md's File layout paths; "Twelve games"; "six Vercel functions" | CLAUDE.md:3–5, 103–160 | every path exists; 12; 6 + `_lib/` | — |

**docs/harbor.md** is 9178 lines / 1.03 MB / 172 k words, 77 `##` + 527 `###`, no table of contents: the bible (lines 1–455, 54 KB) and
69 pass logs (979 KB). Navigable only by `grep -n "^## "`. Recommend: harbor.md = the bible + the architecture + a dated INDEX (one row a
pass: name · date · file · what it built); each pass's log to `docs/harbor/passes/<id>.md` (as roadmap-history.md already holds the detail).

**CLAUDE.md** is 312 lines / 7,585 words / 55 KB with 24 lines over 400 characters (the longest 2,287: line 113) — the File layout block
is 25.4 KB, 19.6 KB of it Harbor lines; lines 57–62 + 125–149 are 16.2 KB = 29 % of the file. A Harbor pass reads 16 KB of its own
history before the first rule. Trims (each → one row ≤ 160 chars + a `docs/harbor.md#…` pointer; the detail already lives there):
57–60 (`&debug=1`) → one line (also fixes the pill); 61–62 (a legendary from a link) → #9g; 113 (`js/core/` — keep the non-Harbor half,
the `harbor-*.js` descriptions → "PURE City 2.0 logic, one module per system — docs/harbor.md#the-architecture"); 125 (6b), 126 (the bake
tool), 127 (the tower), 130 (windows.js's 7b + SP4 + WIN2 + WIN3 + 9c history), 133 (8P), 134 (9b), 138 + 139 (11a-1 / 11a-2), 144 (8a +
FP2 + PF + FP3a + PROM), 129, 132, 135, 137, 142, 149 → one line each; strip the pass tags ("FP3a:", "WIN2:", "9c:", "PROM —") from the
layout block — what changed when belongs to ROADMAP / roadmap-history. ≈ 14 KB off, no rule lost.

---

## B. MEASURED on the phone path (Chromium, 390×844, DPR 3, 4× CPU, no GPU; the numbers are relative within this run — the laptop is not the phone)

### B1. Memory

Every live canvas, by its creation site (tier 2 = the city at 2×, the owner's iPhone; tier 0 = the city at 1×; `TIERS` `scene.js:126`):

| state | `harbor().mem` (the readout) | every live canvas | canvases | the biggest outside the readout |
| --- | --- | --- | --- | --- |
| a plain night (Oct 21 22:00) | 42.6 MB of 64 | **75.1 MB** | 272 | the sky pair 7.0 + the stars 3.5 · the dressing 8.8 · the main canvas 5.3 · the tubes 3.2 · the speakeasy 1.2 · the moon 1.1 · the crisp 0.6 |
| a party peak (Sat Oct 17 23:00) | 42.6 | **83.2** | 613 | + the tubes' party pairs 6.9 · the beams 4.8 (244 canvases: 40 sprites + their feet) |
| a snowy night (Jan 14) | 38.7 | 70.6 | 239 | the frost pane 5.3 · glasswx 4.9 · snow.js 2.0 |
| a party in snow (Sat Jan 16) | 39.2 | **80.2** | 592 | the tubes 6.9 · the beams 5.3 · the frost 5.3 · glasswx 4.9 |
| Halloween night with the giant | 42.0 | 83.0 | 604 | the dressing 8.8 · the tubes 6.9 · the beams 5.0 · the giant 1.6 |
| mid-UFO | 42.6 | 76.4 | 292 | legends.js 1.4 (the sheets) |
| mid-TR-3B | 38.6 | 76.0 | 275 | |
| a rainy party | 39.2 | 80.9 | 572 | glasswx 3.5 |
| **tier 0** (the same eight) | 10.5–13.9 of 24 | **31.6–40.1** | 230–392 | the dressing 8.8 (unchanged — H17) · the frost 5.3 · the stars 3.5 · the beams 3.2 |

The readout counts the bakes (both sets), the water, the wheel + boats and the merged bands (`scene.js:2995`); 32–43 MB live outside it
(H19). **The ceiling.** WebKit refuses a new 2D context when the active pixel memory would pass `maxActivePixelMemory()` — on iOS a quarter
of RAM in the current source (`HTMLCanvasElement.cpp`; the 224 / 256 / 288 / 384 MB figures in the 2018–19 bug reports are older builds),
and no canvas may exceed 4096 × 4096 px on iOS (the main canvas at 780×1688 is 1.3 MP). Sources: [the WebKit source](https://webkit.googlesource.com/WebKit/+/master/Source/WebCore/html/HTMLCanvasElement.cpp),
[bug 190280](https://bugs.webkit.org/show_bug.cgi?id=190280), [bug 195325](https://bugs.webkit.org/show_bug.cgi?id=195325), [Apple's WebCore snapshot](https://opensource.apple.com/source/WebCore/WebCore-7610.4.3.0.3/html/HTMLCanvasElement.cpp.auto.html).
So ≥ 1 GB on a 4 GB iPhone, 1.5–2 GB on the Pros; the practical limit is the web content process's whole memory (iOS kills a tab around
1–1.5 GB). Today's worst state is ~8 % of the canvas budget: **memory is not the constraint; the readout's honesty is.**

**THE FOREGROUND AT 3× — the numbers.** The band = the `stage` + `front` bakes (4.04 + 3.07 MB at 2×, `bake.js:12`; the speakeasy's own
sprites 1.2; the still pieces 0.1 + the crisp items 0.6 already at 3×) plus the LIVE painters (the facade's lit layer + the doors + the
awning + the windows' life, the people, the cab stand, the wet ground). Memory at 3×: ×2.25 on 7.1 MB = +9 MB a set (+18 MB while a
crossfade holds two sets) + one overlay canvas for the band (the main canvas cannot mix resolutions: at 402 the band from the roof's crest
to the dock ≈ 1206 × ~700 px at 3× ≈ 3.4 MB) → a plain night 75 → ~90 MB, a party ~100 MB: fits everywhere. The frame (A B B A, one run):

| | with the foreground (A, A2) | without (`no-speakeasy,no-people`: B, B2) | the foreground's share |
| --- | --- | --- | --- |
| a plain night, tier 2 — draw p50 | 38.7 · 50.8 ms | 26.0 · 24.8 ms | **35–50 %** |
| a plain night, tier 0 — draw p50 | 24.0 · 32.3 ms | 10.9 · 11.1 ms | **55–65 %** |
| the party peak, tier 2 — draw p50 | 94.5 · 67.7 ms | 39.6 · 37.3 ms | **45–58 %** |
| the party peak, tier 0 — draw p50 | 33.1 · 32.3 ms | 13.1 · 11.3 ms | **60–65 %** |

That share is fill-bound (strokes, `'lighter'` pools, `drawImage` of lit sprites), so at 3× it is ×2.25: **a calm night's frame grows
~40–60 %; a party peak — already the tier's stepping point on the owner's phone (docs/harbor.md#performance: the iPhone lands at tier 2
and steps on a party) — goes further over.** Which combinations fit: a plain night at tier 2 probably (the phone has ~3× this laptop's
headroom at 4×); a party, a party in snow, Halloween with the giant: no at tier 2, and at tier 0 the city is at 1× anyway. The 3× ↔ 2×
step on the figures' edges, the brick joints and the door's lettering is visible (the whole reason for 9c's crisp layer) — hidden only
behind a bake crossfade (1.2 s), never a hard cut mid-scene. **Recommendation:** (1) a `&dpr=3` debug flag (S, `TIERS[2].dpr 2 → 3` under
it) so the owner judges the whole city at 3× on his iPhone with the readout open — a calm night and a party; (2) if he loves it: not a
band but the crisp layer extended to the STILL foreground (the upper windows — SKY, the shopfront's glass + gilt + the awning's valance,
the date stone, the door's plate; `crisp.show()` already takes any box + draw) — ~2–4 MB, repainted only on a key change, the people at
2×. The band design only if (1) shows a calm night holding 60 fps at 3× on his phone with 30 % to spare.

**THE UPPER WINDOWS ON THE CRISP LAYER — everything that crosses the six upper panes** (`core/harbor-speakeasy.js:40–47 ROOMS`: floor 2 =
edge2 / bar / jazz, floor 3 = edge3 / back / apartment — the boss's; columns `SPEAK_WIN`), with where it draws today (scene.js unless
noted) and what the overlay needs. `crisp.show(c, { id, box, key, draw, alpha, z })` (`crisp.js:37`) makes a DOM canvas over the city at
the box, repainted on a key change, crossfaded; the benches' overlays (`:883–889`, `still.js`) re-draw whoever stands in front via
`people.redrawOver` (`people.js:570`) — a key-driven whole-sprite repaint; the blade / stone / roofboard simply switch OFF while a worker
is at them (`:869–871 busy`). **The documented catch is real** (docs/harbor.md:9157): rain `rain.drops` (`:2044`), snow `snowfall.draw`
(`:2050`), `fx.front` (`:2051`), the lightning flash `zap.city` (`:2052`), the vignette (`:2068`) and the frost pane (`:2085`) all draw INTO
the main canvas, UNDER every crisp DOM canvas.

| crosser | file:line | with the panes on the overlay |
| --- | --- | --- |
| the windows' own life (moments, the party rooms, blinds, the TV, the hush sign) | `:1935 speak.draw` → `windows.js:796–848` | INTO (the pane's painter at full dpr; key = the frame while a moment plays — 6 × ~30×30 pt × 9 px: cheap) |
| the blackout / the raid's power | `:1925–1931 speak.power()` | INTO (part of the pane's level) — nothing to move |
| the raid's red + blue wash + the flashlight over the glass | `:1960–1963 raidFx.facade(…, { windows })` | INTO (pass the raid frame) or the panes OFF during a raid (the `busy` rule) |
| the wet glass (beads, streaks) | `:1955 wetGround.glass(c, { wins })` | INTO (it already takes the window list) |
| the first-Christmas C9 strings on the facade | `:1943–1946 paintXLights` | the bulbs' halos overlap the pane edges → INTO, or shrink the box to the glass (`glassOf`) |
| the roof canopy strings, the chimney smoke | `:2033`, `:1940` | clear (above the panes; the smoke rarely lies on the top row — accept) |
| pigeons | `:2037 wild.draw('high' / 'top')` — the perches are the blade, the parapet, the stone, the posts (`wildlife.js:12`), NOT the sills | clear; a sill perch later = `redrawOver` |
| the workers at the facade (the washers Tue / Fri 10:33–11:57 `core/harbor-workers.js:45`, the painters, the billposter, the Christmas crew's ladder) | `:1986 people.draw('near')` | the panes OFF while `people.crew().works` matches (the existing `busy` regex already has `wash`) |
| falling rain, falling snow + the awning's slab | `:2044`, `:2048–2050` | hidden behind the overlay today (as the benches) → INTO (a per-box pass of the drops / flakes) or accept: the wet-glass beads INTO the overlay cover most of a downpour's read |
| the sill snow caps | baked in the facade (`speakeasy-bake.js` + `capFor('stage')` as the blade's at `:873`) | INTO (the pane's draw re-runs the bake's window step + its cap, as `blade-board` does) |
| the lightning flash | `flash` into `speak.draw` (`:1936`) + the whole-screen `zap.city` (`:2052`) | the inside part INTO; the whole-screen flash → the overlay's opacity for that frame |
| the frost pane | `:2085 frost.pane` | hidden behind today (the blade escapes the frost already) → the frost's box INTO, or the overlay off while `fz > 0` |
| the vignette | `:2068 drawForeground` | the edge panes escape the darkening → multiply the overlay's alpha by the vignette at the box |
| the party windows' pools, the fog, the searchlights, the implosion's dust, the drain columns, the leaves, the holiday 'top' props | `:1949`, `:1771 / :1826 / :1858`, `:1831`, `:1783`, `:1766 / :1823`, `:2021`, `:2038` | clear (the ground / behind the speakeasy / the skyline rows); the leaves + garlands: accept unless a garland crosses a sill |
| the spider + web, the glass-weather overlays | `title.js:1093–1097` (the SIGN), `:2062 glassWx` (z 72) | n/a / already above |

Rule for SKY: the panes' overlay at `z: 0` under the blade's (1–3), keyed per frame while a moment plays, fed the three things that touch
the glass (the pane painter, the wet glass, the raid / lightning flash); off while a worker is on the facade, at `&force=no-crisp`, on
DPR ≤ 2. Accept rain / snow / leaves passing behind (as the benches do) unless the owner objects on the phone.

### B2. The long watch (20 min at tier 0, a Saturday 21:48 → the party at 22:00, sampled each minute)

| min | heap MB | canvases MB (n) | the readout | IDB requests (cum.) | intervals / timeouts | DOM nodes | draw p50 / p95 ms | rAF p50 / p95 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (21:48, the evening) | 48.5 | 37.3 (336) | 13.8 | 62 | 11 / 7 | 720 | 45.9 / 101 (the first minute: the bakes) | 43.5 / 250 |
| 1 | 54.4 | 37.5 (337) | 13.8 | 137 | 11 / 11 | 720 | 25.6 / 37.8 | 38.7 / 61.7 |
| 2 | 52.3 | 37.8 (349) | 13.8 | 212 | 11 / 6 | 720 | 25.8 / 34.2 | 35.6 / 63 |
| 4 | 58.6 | 38.1 (366) | 13.8 | 362 | 11 / 6 | 720 | 27.2 / 65.2 | 47.4 / 89.4 |
| 6 | 59.8 | 37.9 (367) | 13.8 | 517 | 11 / 6 | 720 | 25.0 / 29.5 | 31.2 / 45.2 |
| 8 | 66.2 | 38.4 (385) | 13.9 | 667 | 11 / 6 | 720 | 31.9 / 45.8 | 40.1 / 56.4 |
| 10 | 49.6 | 38.8 (403) | 14.0 | 817 | 11 / 6 | 720 | 27.3 / 32.3 | 33.9 / 45.4 |
| 12 | 55.0 | 38.4 (375) | 13.9 | 967 | 11 / 6 | 720 | 25.9 / 31.9 | 29.3 / 37.1 |
| 14 | 46.6 | 38.2 (385) | 13.9 | 1118 | 11 / 6 | 720 | 22.5 / 27.5 | 28.8 / 36.1 |
| 16 | 45.1 | 38.5 (406) | 13.9 | 1268 | 11 / 6 | 720 | 21.5 / 25.6 | 28.3 / 35.3 |
| 20 (22:08, the party) | 56.4 | 38.2 (358) | 13.9 | 1568 | 11 / 6 | 720 | 19.3 / 27.8 | 25.1 / 33.2 |

**No leak.** The canvases rise 1.5 MB over the run (the beams' 40-sprite cache filling + the party's tube pairs — both capped; the
beams' `feet` is a `WeakMap`), the heap is a GC saw-tooth between 45 and 66 MB with no slope, the DOM holds at 720 nodes, the intervals
at 11, the timeouts at 6, the audio graph at 3 nodes (the city's sounds are not Web Audio nodes per play), and the frame cost at minute
20 (19.3 ms) is lower than at minute 1 (25.6). Extrapolated to 60 min: nothing moves. **The one thing that ticks:** `addEventListener` is called ~150
times a minute with no matching remove — all of them `success` / `error` handlers on IndexedDB requests (no `js/` frame in their
stacks; no app code touches IndexedDB): that is **Firebase Auth's IndexedDB persistence polling every 800 ms** (`firebase.js:63`
`initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })`) — 75 storage transactions a minute on every
page, a parked title included, for the life of the tab. The request objects are collected (the heap says so), so it is churn, not a
leak; on a phone it is a storage-process wake every 0.8 s. LOW: `browserLocalPersistence` alone would end it — but each slot is its own
named app with its own persisted anonymous user (CLAUDE.md: Identity), so check the slot rule + a rejoin on the emulators before
switching (S, the owner's call).

### B3. Frame cost at the worst moments (draw p50 / p95 ms, tier 2 / tier 0, this laptop at 4× CPU — relative only)

| state | tier 2 | tier 0 | where the time goes (from the A/B + the layer list) |
| --- | --- | --- | --- |
| a plain night | 54 / 83 | 45 / 108 | the foreground's live layer ≈ half (B1); the rest the composite of 20 bands + the water's mirror |
| the party peak (clear) | **113 / 205** | 31 / 54 | the beams (244 sprites alive, `'lighter'`), the tube pairs, the punch, the dance circle, the party windows — at tier 0 the beams drop to 81 sprites and the people to 4 dancers |
| a party in snow | 55 / 73 | 34 / 71 | lower than the clear party in this run (no Halloween dressing in January; the dress's spider shimmer is a per-frame cost in October) |
| a snowy night | 38 / 50 | 22 / 31 | the cheapest night: the snowfall is one `drawImage` a flake, the frost static |
| Halloween with the giant | 63 / 87 | 30 / 36 | the giant's 12 sprites + the web's shimmer + the jack-o'-lanterns' flicker |
| mid-UFO over the promenade | 37 / 45 | 26 / 30 | the sheets are one `drawImage`; the flee is the planner's cost once |
| the TR-3B drain + the chase | 37 / 74 | 26 / 37 | the p95 is the drain columns (`drainCity` lays the dark bake in W/12 columns each frame while it crosses) + the tape |
| a rainy party | 71 / 85 | 36 / 42 | the rain's drops + the wet ground's live streaks on top of the party |

**The cheapest wins:** (1) the party's beams — 244 live sprite canvases (40 colours × sprite + foot + the 32² flare) drawn additively:
quantise the colour key to 16 steps so the sweep reuses sprites (the cache then holds ~16); (2) the TR-3B's `drainCity` columns — bake the
dark city once per crossing position bucket (it is keyed per frame today); (3) the Halloween dressing's `shimmer.step` at dpr 3 on every
party frame (H17: the dress at the tier's dpr halves it at tier ≤ 1); (4) the foreground's `'lighter'` pools on the cobbles (the awning,
the door spill, the party pools — each a full-band radial per frame): one pooled "ground light" sprite composited once (the same seam as H2).

---

## C. THE OWNER'S PROM NOTES — the cause + the shape of each fix (for C4)

### C1. The windows' washout (the barbershop at night; the lit blind upper right; every window checked)

**The barbershop = four layers, none a room.** (1) The bake is flat 2D (`speakeasy-bake.js:282–313`: a flat back wall, flat mirror panels,
the chair as rectangles, the lamp a dot) and at night the whole pane gets a flat veil (`:321 R(…, M.inside, 0.55)`); no `paintBox` /
`deepAt` / `lampFall` — the room primitives are used by the upstairs painters only (`windows.js:117–135, :225–246`). (2) **The pale blob** =
`speakeasy.js#paintLit:148–169`: an upright radial oval on the back wall (`createRadialGradient(lx, ly − 0.25, 0 … 1.35)`, stops 0.55 / 0.28 /
0.08 of warm white), a floor pool, four 0.9-alpha chair-edge bars, a halo (`:162`), then in `draw()` `:524` an ADDITIVE `soft()` over the glass
(`'lighter'`, `:521`). (3) **The flat orange haze** = PROM's awning light, `speakeasy.js#awningUnder:420–466`: step 3 (`:440–457`) lays a
vertical gradient mask with **`globalCompositeOperation = 'color-dodge'` at 0.62** over the WHOLE shopfront band — the glass, the veil, the
blob and the gilt included; a dodge lifts a dark warm pane to a uniform orange with no shape. (4) The gilt (`giltOver :183–199`) is drawn over
everything with `lamps: T.night` — the "gold after 1 am" known issue. Screenshot: `night-402x874-shop.png` in the session's shots (the
owner's iPhone shot matches).

**Every window, by its night painter:**

| window | painter | a real room? | the flat-glow pattern? |
| --- | --- | --- | --- |
| **shop** (ground) | the bake `:282–321` + `paintLit:148–169` + `soft :524` + the awning dodge `:456` | **no** | **yes** — veil + blob + additive halo + dodge band |
| **edge2 / edge3** (`edgeMood`, `windows.js:1160–1199`) | `paintBox` of a dark box, then TWO additive `glow()` blobs (`:1181–1182`) + the shade as a flat 3-stop gradient (`:1190`) | a box, but the light is two blobs | yes ("light + shadow only" by design — but a blob, not a lamp) |
| **bar**, **jazz** | `paintBar :199–221`, `:126–134` (box + `lampFall` + deep furniture) | yes | no |
| **back** (the boss) | `bossShade :916–958` — the sliver under the hem a flat fill `:928` | | yes (below) |
| **apartment** (upper RIGHT — the owner's "blind with the lamp behind it") | `apartmentState :884–890`: `'lamp'` (dusk → lights-out) → `bossShade(E, { glow: 'lamp' })` `:890` | the pane a flat fill `:928` | **yes**: the cloth ONE colour as a 3-stop vertical gradient `:932–933`, then THREE additive `glow()` blobs `:940–942`, a 7 % weave `:944`, two sag lines. No falloff from a lamp, no lamp silhouette, no sash shadow, no pull cord (the ring pull is day-only `:958`) |
| the night lamp (`:1399–1409`, seconds a day) | a radial over the pane | no | minor |

**The shape (1a the shop L · 1b the blinds M · 1c the awning S):**
- **1a** — in the bake's shop block (`:282`) compute `B = boxOf(glassOf({ u: [w0, w1], v: [wv0, wv1] }), vp)` with the `wallVP` speakeasy.js
  passes to `paintLit` (`:146`); `paintBox` (the floor's tiles as two tones, the left wall, the back wall); the MIRROR WALL at depth 1 via
  `deepAt` = the hidden door (keep `windows.js#mirrorDoor`'s coordinates in the same deep frame); the shelf at t 0.95; THE CHAIR as one bold
  silhouette at t 0.55 facing the glass (base, red seat, high back + headrest — ~5 shapes); the lamp WITH A SHADE at `{ u: lx, v: wv1 − 0.48,
  t: 0.6 }`. Export the chair's depth so `barberDay` (`windows.js:1446–1461`) draws the barber + customer in the same frame (they draw flat
  today). Night: drop the veil `:321`; `paintLit`'s shop block → `lampFall(x, G, B, lamp, [255,238,210], k, { reach: 1.1, corner: 0.7 })` (the
  pool on the floor + the hot spot on the mirror wall + dark corners — the upstairs primitive) + the chair's rim on its top edges + the globe
  dot; delete the oval `:155–156`, the halo `:162`, the additive `soft` `:524` (keep `glowAt.lamp` for `wetReflect`). Dim + closed: `k` 0.45,
  the lamp `[255,232,200]`. The glass: the day branch's two sheens (`:315–317`) at 0.04 at night, the sky tint off; the gilt dark gilt with a
  faint glint, `lamps` from `f.awning` (0 after 1 / 2 am) — closes the known issue. If the gilt still doesn't read after the rebuild → the
  valance, only if ≥ 8 pt at 402; else drop it (the owner's order).
- **1b** — `windows.js#bossShade :936–947` → ONE `litBlind(c, G, { lamp: { u, v }, col, a, cover, hem })`: the cloth's light a radial from the
  lamp (`createRadialGradient(lu, lv, 0, lu, lv, G.cw × 1.3)`, 4 stops 1.0 / 0.62 / 0.3 / 0.12 of `a`) SOURCE-OVER on the cloth colour, never
  additive; THE LAMP's SILHOUETTE behind the cloth (a trapezoid shade 0.3 × 0.12 at the hot spot, `rgba(60,36,20, 0.35 a)` + a 0.02 stem);
  5–6 fold lines alternating light 0.08 / dark 0.1 (today's weave is 12 equal dark lines = a texture); the sash's shadow as the muntin bar(s)
  on the cloth (`rgba(0,0,0,0.35)`, 0.04 wide); a pull cord 0.014 wide from the hem's ring to the sill; the hem bar + ring in the night branch
  too. Then `edgeMood` (`:1181–1182`) uses the same painter for `'down'` / `'half'` so the left column matches.
- **1c** — `awningUnder`: `AWN.cream 0.52 → 0.78`, `red 0.26 → 0.42`, the stripe gradient's wall end `k × 0.3 → k × 0.15` (the bulbs under
  the front edge aim up: bright at the front, dim at the wall), the valance rim 0.6 → 0.8; the dodge mask (`:443–452`) split in two: the
  band from the strip down to the WINDOW HEAD only (the transom, the frame, the gilt's arch) at full, and the pavement pool (`:459`) a touch
  brighter (`P.k 0.75 → 0.9`); the GLASS gets NO dodge (`destination-out` the pane rect `G.s.shop.win` from the mask) — the haze goes and the
  room reads; the brick beside the window keeps a 0.35 band. The hours + the photocell + `doorLight` unchanged.
- Test: no speakeasy preview page exists — add `--crop shop` (the shopfront + the awning) to `shots.mjs` at 390 / 402 / 430 for `night`,
  `late` (after 1 am), `day`; e2e `speakeasy` + `windows` (the lit-canvas probe `speak.glows()` keeps its keys), `doors` (the awning clip).

### C2. THE PEOPLE RULE — where people snap today

- The plan is a pure function of time (`people.js:96 now = folkAt(t, …)`), and a phone joining mid-way sees walkers MID-ROUTE by design
  (`core/harbor-people.js:33`). That is right on the app's first frame and WRONG every time the SET of visits changes between two frames,
  because a visit absent last frame is placed at `visitAt(t)` — mid-route, mid-pose, mid-sit.
- **The UFO's return (the owner's bug).** `folkAt:986–998`: during the witness window (`harbor-witness.js:29 witnessWindow` = `t0 … t0 + len +
  empty`; UFO `empty 240`, TR-3B 60, the raid 12 — `WITNESS :19–26`) every visit whose `t0` falls inside is suppressed (`:998 … (!inWin ||
  v.t0 < LG.t0 + 1 || !suppressed(LG, v) …)`); the instant the window ends `!inWin` is true and **every suppressed visit comes back at once at
  `visitAt(t)`** — people who "arrived" minutes ago appear mid-promenade. The same at the raid's end and the TR-3B's. `reactVisit` returns
  `null` for anyone in a doorway / on the road / fading / up a ladder (`:58`): they stroll calmly through the abduction.
- **The implosion** has no witness kind at all — nobody clears out; the tower falls on a strolling crowd.
- **A holiday / link / panel change**: the block visits are cached per block (`:961–962`) but `forced`, `routine`, `hol` are rebuilt from
  `ctx` (`:1074`) → a changed ctx swaps visit sets → new members at `visitAt(t)`: a snap. The dock fading: no snap (the near pass is simply
  covered; the cab stand's `override :538` hides a taken fare).
- **The traffic** does not snap: `trafficHold` (`harbor-legend.js:257`, read at `harbor-people.js:829, 862`, `roadlight.js:70`) holds STARTS only.
- There is **no entry-point rule anywhere** — the planner's entries exist (`M.exits :177–182` the screen's edges ±1.4 u beyond `hwAt(z)` + the
  far sidewalk, the doors `doorLeg`, the bus door, the crossing `from: 'cross' :429–437`, a cab's kerb `harbor-cabs.js:126`) and every planned
  visit starts at one, but nothing checks a visit's first VISIBLE frame on this phone.

**The shape (M):** (1) pure `rejoinVisits(visits, tSwitch, M, r)` in `harbor-witness.js` next to `suppressed`: at a window's end each
suppressed visit still "alive" is REPLANNED — `planVisit({ ...v.spec }, tEnd + stagger, M, { r })`, `stagger` uniform in [8, 120] s seeded from
`v.id` (groups replan as one) — so it walks in from its own `from`; for that `blockVisits` keeps each visit's `spec` on the visit. (2) The
same at every ctx switch: `people.js` stamps `ctx.switchT` whenever `hol | forced | legend | raid` differs from the last frame; any visit
active at `switchT` that was not in the previous set goes through `rejoinVisits` (the app's first frame: `switchT = −∞`, joined mid-way as
today). (3) Two more entries for the staggered return: `from: 'behind'` (the corner behind the speakeasy, `x = s.x1 + 0.6, z = doorZ + 0.1`)
and `from: 'cab'` (`cabPlan 'drop'`) — six entries: the two edges, behind the speakeasy, the crosswalk on WALK, the bus door, a cab. (4) Optional:
`WITNESS.implosion` (`notice [−30, −10]` before the drop — everyone drifts to the railing / off; `empty 120`).
**The test:** unit (`tests/harbor-people.test.mjs`) "every walker enters at an entry": `folkAt` at 0.25 s steps across a UFO night, the raid
and a `hol` switch; for every id whose first appearance is at `t > start`, its first state satisfies `|x| ≥ hwAt(z) + 1.0` OR `s.door` OR `s.bus`
OR `z ≥ FOLK.farZ − 0.1` OR a cab's kerb, and no two new ids within 2 s. E2E `legends` (the `lgs1` page at `&speed=4` after `&force=ufo&lgnow=1`:
record `people.debug().members` per frame 6 min; the same rule on screen, plus "nobody walks in before `t0 + 30 + 8` s") + `people` (the raid's end).

### C3. THE COMPASS LEFT + THE CART IN THE MIDDLE — checked against the real layout

The camera at the three widths (`harbor().cam`, Halloween night): F 582.1 / 600 / 641.8, CAMH 13.5, VPY 528.7 / 552.1 / 594.6, the dock's top
748 / 778 / 836. A promenade `f` IS the screen fraction (`xOfF`: x = f × W at any depth); a world unit at depth z is F / z pt. Today the
compass (`harbor-promenade.js:93`) is at f 0.6675, z 42.6, ring 3.05; the water bench f 0.515, z 47.8; the cab stand f 0.875, z 38.0; the cart
f 0.47, z 38.4, hand −1; the crosswalk f 0.613–0.722 at z 54–64; the signals f 0.6 / 0.735; the walkable floor z 38.75–52.25
(`harbor-people.js:43`); the dance circle's closed floor = ring × 1.15 + 0.4 = 3.9 u, the giant's RING.clear 4.85 + 0.6 = 5.45 u (`:204`);
the side door u 9.05–10.55 → world x −7.75 … −6.25 at z 44 (`harbor-layout.js:405–412`).

| | 390 | 402 | 430 |
| --- | --- | --- | --- |
| the compass today (f 0.6675) — centre x / its ring ± | 260 ± 42 | 268 ± 43 | 287 ± 46 |
| the compass proposed (f 0.515) — centre x / ring ± | 201 ± 42 | 207 ± 43 | 221 ± 46 |
| the water bench (f 0.515, z 47.8) — x / seat y | 201 / 692 | 207 / 714 | 221 / 768 |
| the compass's top edge y (z 45.65) vs the bench's seat | 707 vs 692 | 730 vs 714 | 784 vs 768 |
| the giant on the compass (8.2 u across → ± 4.1 u) at f 0.515 | 145–257 | 149–265 | 160–283 |
| the giant's top (≈ 8 u tall) y | 604 | 629 | 678 |
| the crosswalk's x span (z 54–64 → y) | 239–282 (654–674) | 246–290 (679–702) | 264–310 (730–758) |
| the speakeasy's corner x (z 44) → the blade's tip ≈ +22 pt | 121 → ~143 | 125 → ~147 | 134 → ~156 |
| the side door's step spot (`door.x + 1.15`, z 42.75) — world x | −6.6 | −6.6 | −6.6 |
| the giant's closed floor at f 0.515 — world x / z | −5.0 … 5.9 / 37.15 … 48.05 | same | same |
| the cab bench (f 0.875, w 3.3 u) — x span | 318–370 | 326–378 | 349–403 |
| the cart proposed (f 0.69, z 38.4) — body x / top y | 250–286 / 680 | 258–296 / 708 | 278–318 / 762 |

**What the numbers say:**
1. **The compass at f 0.515 is in line with the water bench — directly in FRONT of it** (2.15 u of floor between the ring's back edge and
   the bench): the bare compass is fine (15 pt between its top and the seat), but **any centrepiece taller than ~1.2 u hides the water
   bench and its sitters completely** (the giant 8 u, a Christmas tree ~5, the snowman ~2.5) — the bench the owner just asked to be judged.
2. **The side door's landing shrinks from 5.5 u to 1.3 u while the giant stands** (today the closed floor starts at x −0.67; at 0.515 it
   starts at −5.0, the door's step spot is at −6.6). The cab stand's waiters' route (the door → x 9.5 at z 38) runs straight through the
   closed circle (z 37.15–48.05), and the way round in front is below the walkable floor (zMin 38.75) — **the exact "no route" that
   produced PROM's foot slide, made worse**. With a small piece (the dance circle's 3.9 u) the landing is 2.7 u: marginal.
3. **The crosswalk is still blocked by the giant at 0.515** (its body 149–265 at 402 covers the crossing's 246–265 at the band's height); a
   piece 8 u wide clears the crossing only with its centre ≤ f 0.47 — in the door's landing. The small pieces clear it at 0.515 (the
   snowman ± 18 pt → 189–225).
4. **The giant brushes the RUM RUNNER blade** at 0.515 (its left edge 145 / 149 / 160 vs the blade's tip ~143 / 147 / 156 — 2–4 pt of overlap
   at the blade's height 634–675 at 402).
5. **The cart at f 0.68–0.70, z 38.4**: its top is **~6 pt below the crossing's near edge** at every width (not ~30 — the owner's estimate was
   off: 680 vs 674 at 390, 708 vs 702 at 402, 762 vs 758 at 430) — it clears, barely. The real conflict is its **customers' spot** (`cart.x +
   hand × 4.3 u`, `harbor-people.js:170`): hand +1 lands ON the cab bench (x 9.2 vs the bench 7.9–11.2), hand −1 lands at x 0.6, z 38.85 —
   **on the compass's front rim** (the ring's front edge at z 39.55, 4 pt away on screen) and inside the dance circle's reach. The gap
   between the ring's right edge (250 at 402) and the cab bench (326) is 76 pt; the cart's body is 38 — the customers need ~60 more.
6. **Wheeling in from the right** crosses the cab bench (same depth) → from BELOW THE DOCK (the implied road z 22–35.6; the cart's foot at z
   37.65 is 8 pt above the dock's top at 402; a 44-pt rise at x 277): fine. `L.cart.stopX` becomes `medallion.x + EVENT_CLEAR` (= 4.43 u; the
   cart at 4.89 is already clear by 0.46 u — it never moves during an event since PROM's `route x0 = x1`).

**Rule conflict — the owner decides before C4 builds (CLAUDE.md: check feasibility first):** "a centrepiece never blocks the crosswalk" vs
"the water bench + its sitters visible", "the door's landing + the cab stand's route open", "the giant clear of the blade". They cannot all
hold with the giant's size at f 0.515. Options, with my pick: **(A, recommended) the compass stays at 0.6675 and the GIANT's closed floor
shrinks to its drawn size + a route opens BEHIND the compass** (the known issue's own fix: `harbor-people.js:204` r 5.45 → 4.2, the strip
past the water bench under the blade open as a detour) — closes the foot slide (F6) for good, keeps every rule but "never blocks the
crosswalk" on Halloween night only (the giant stands two weeks a year; the Christmas tree + the snowman at 0.6675 ± 25–35 pt cover the
crossing's LEFT third only — the owner can judge whether that is "blocking"); **(B) f 0.58** (a compromise: the door's landing 3.1 u, the
giant still over the crossing's right half, the water bench hidden by any piece); **(C) f 0.515 as asked** — only if the water bench moves
(e.g. to f 0.42, in front of the crabapple where it stood) AND the giant's closed floor shrinks AND the cab stand's waiters take the
route behind the compass. The cart: **f 0.69, z 38.4, hand −1 with the customers' spot shortened to +2.6 u** (just left of its end, x 2.3 →
237 pt at 402, in front of the ring's right edge on open floor), entering from below the dock. Render before committing: day + night + the
giant + the snowman at 390 / 402 / 430 (the owner's order).
**The foot slide:** fix now with (A) — it is deterministic and red on every street job until Nov 1; waiting for the giant to come down only
defers it to next October.

### C4. The sitters, the doorman, the wet ground, the crosswalk

- **THE CAB-STAND SITTER reads as standing + see-through — the seated rig collapses when he faces us.** `folk.js#jointsOf :283 hipY = 0.27`,
  `:322 knee = { a: 0.235, b: ±0.06, y: 0.28 }`: `a` is the FORWARD axis along the heading, and the cab stand's waiter sits with `face: 0`
  (`harbor-cabs.js:92`) = facing the camera, so the thigh's 0.235 "forward" projects to ~1–2 pt of vertical drop — hips (y 0.27) and knees
  (y 0.28) land on one screen line; what is left is the shin (0.57 u straight down, `legW 0.078` → ~3.4 px at z 37.8) with the two legs
  almost one pair. The torso sits straight on it → a short standing figure on sticks. **See-through is NOT a draw-order bug** (verified:
  the seat z 37.8 < the bench item 38.1, the near pass sorts far → near `people.js:222`, the crisp overlay redraws him `scene.js:886–888` /
  `people.js:571`, alpha 1): the bench's full-dpr slats, grain and lit edges (`props.js:56–80`) show BETWEEN two 3-px shins and beside a
  narrow torso whose hips sit exactly on the seat line — nothing of him covers the seat's front edge. The shadow is skipped for 'sit'
  (`folk.js:545`). **Fix (M):** a second seated rig when `|cz| > 0.5` (facing us / away): knees FORWARD AND OUT (`knee { a: 0.26, b: ±0.11, y:
  0.29 }`, feet `{ a: 0.30, b: ±0.12 }`), the THIGH as a filled quad from the hips' width to the knee (`legW × 1.6 × H`), the shin at `legW ×
  1.25`, a LAP fill across both hips to both knees (the coat's hem) drawn after the torso's far side, shoes at the knees' `b`; the knees
  then land 3–4 pt below the seat's front edge and cover it; a slight slump (`shA += 0.04`), hands on the knees (`arm(0, 0.6, 1.1)`, `arm(1,
  0.5, 1.1)`). The water bench's sitters (facing away, the back drawn over them by design — `still.js` z `b.z − 0.25`): the same lap mass
  helps, and the owner's check stands (a solid backrest / head + shoulders + hat clearly above the back line). The crisp key already
  includes `st.pose` (`people.js:270`). Test: `folk-preview.html?only=sit` (front / back / side at 44 pt beside a bench); unit — for 'sit'
  facing us the knees' screen y ≥ 3 pt below the hips', the feet's `b` spread ≥ 0.2.
- **THE DOORMAN.** Today: `core/harbor-crew.js#PLAN.doorman:670–676` — out of the side door to `P.doorman`, then pose `'wall'` at
  `doormanWall(L)` (`:25`, against the brick right of the door) for the shift; the rig `folk.js:286–291` (one boot up), arms crossed `:365`,
  the head follows guests live in `people.js#doormanWatch:545–567`; look `folk.js:106` long coat `[52,58,96]`, hat **`'fedora'`**. The door's
  swing is owned by the GUEST's door leg (`harbor-people.js#doorLeg:371–382`, `DOOR.open 0.8 / close 1.3`) → `doorOpenK :400` → a MAX over
  every member's leg in `folkAt:1073–1080`, which ALSO reads a pose leg's **`swing: { door, tOpen, tClose }`** (`:1079`, trick-or-treat's).
  Poses that exist: `'tipHat' :464`, `'hold' :462`, `'post' :466`; a `'cap'` hat exists. **Fix (M):** pure `doormanLegs(guestDoorLegs, post,
  hinge, t0, t1, r)`: at rest a NEW pose `'attend'` at the post (0.3 u off the brick, facing us, hands clasped at the belt — `arm(0, 0.35, 1.45)`,
  `arm(1, 0.35, 1.45)`, a weight shift now + then); for each guest door leg on the side door (`sideDoorLegs(visits)` = the `:1073–1080` walk,
  exported): walk to the HINGE side (`x = sideDoor.x − 0.55, z = doorZ − 0.5`) arriving at `tOpen − 1.0`; `'holdDoor'` from `tOpen − 0.9` to
  `tClose + 0.5` with `swing: { door: 'side', tOpen: tOpen − 0.9, tClose: tClose + 0.4 }` (the MAX aggregation makes his wider window the
  door's motion — nothing double-swings); `'tipHat'` 1.1 s from `tOpen + 0.2` (the far arm on the handle, the near one lifts); back to the
  post; two guests < 6 s apart = one hold. Look: `hat: 'cap'` (peaked, a short visor), the coat long, `L.buttons` = a vertical row of 4
  brass dots down the front (the kit draws `L.sash` already `:1140` — add buttons after the coat). `doormanWatch`: keep the head follow, drop
  the push-off. Test: unit — the doorman's swing window contains the guest's `[tOpen, tClose]`, he is at the hinge at `tOpen`, never inside
  the door rect; e2e `doors` ("never snaps" reads `now.doors` — the max is monotone through the hold) + `people`; `folk-preview.html`
  `doorman` case.
- **THE WET GROUND — the two dotted streaks are the IMPLIED lamps.** `street.js:308–322` (the street under the dock's own wet bake): "a long
  broken streak straight down from each lamp's foot" — `for (const l of L.lamps) { if (l.z > 40) continue; … }`; since PROM the only lamps
  with `z ≤ 40` are the two implied ones (z 21.5, x ±4.5, never drawn), projected from below the screen's foot so the two x's fan out —
  "going their own ways". The back reflections the owner liked are `wetground.js#bake:66–80` fed by `scene.js#wetReflect :317` (the blade,
  the sconce, the shop lamp, the awning, the signals), which already excludes the implied lamps. **Fix (S):** `street.js:312` skip `l.implied`;
  in their place a broad SHEEN — a vertical gradient over the street band, 0 → 0.16 × wet, brightest at the bottom edge (the implied lamps'
  POOLS mirrored, which the street already carries via `lightAt`), the puddle pools `:300–306` 0.62 → 0.78 × wet. Soften the back ones:
  `wetground.js:68` 0.55 → 0.42 and 0.28 → 0.2 at the foot; break them by the cobbles (the dash loop `:74` halved, the gap randomised) and
  while it rains a slow lateral wobble per dash re-seeded on `Math.floor(t / 0.4)` (the bake key gains `Math.floor(t × 2.5)` only while `rain
  > 0.03`). Test: e2e `weather` — with `&force=wet-street` no column under the dock brighter than its neighbours by > 12 % at the implied
  lamps' x, the bottom row brighter than 40 pt up; `shots.mjs --scenes wet-night --crop dock`.
- **THE CROSSWALK's spotlights.** `road.js:27–41` bakes `crossPools` (`:68–72`: the centre pool rx 7.2 rz 5.0 k 1.15 + two edge pools) as
  **9 concentric filled discs**, each a flat alpha step of `(1 − d²)²`, `'lighter'`, under a hard clip `rect(0, yRail, W, yCurb − yRail)`
  (`:34`) — nine rings on a 14-u ellipse band at phone size, the outer radius ending exactly at d = 1: the stage-light edge. The signals'
  tints are a second hard ellipse each. **Fix (M):** ONE radial gradient per pool (6 stops sampling `(1 − d²)²`, the last at d 1.25 → 0), the
  clip feathered 6 pt at the curb / rail (a `destination-in` vertical gradient on a pool canvas), wider: centre rx 7.2 → 9.5, rz 5.0 → 6.2,
  the edges rx 10 → 13, `k` unchanged (the stripes stay the brightest). The signal tints the same, rz 1.6× along the road.
- **THE CARS pass through it unlit.** They DO read it — `people.js#drawCar:310 lampK = min(1, backLight(car.x, CROSS.z))` → `vehicles.js:629`
  crossfades to the `'lamp'` look — but (a) the `'lamp'` body (`lookOf:117–118`) is the night body × ~1.5 with the SAME top-down shading, no
  roof / hood highlight; (b) it is sampled at ONE point (the centre) on a `(1 − d²)²` curve → a 4.4-u car at the pool's edge gets 0.13 — nothing
  until centred, then the whole body pops; (c) **no signal tint** (`drawCar` never reads `signalAt()`). **Fix (M):** sample `backLight` at the
  nose, centre and tail (`car.x ± len × 0.4`) → `lampK: [kTail, kMid, kNose]`; in `vehicles.js#draw` the `'lamp'` body through a horizontal
  gradient mask of the three (three clipped strips) so a car BRIGHTENS ACROSS the crossing from the nose back; the lamp look `shade −0.36 →
  −0.22`, a hood / roof highlight `hiA 0.42 → 0.6`, the spokes lit; the signal's tint `LENS[i]` from `signalAt(clock.now())` mixed 0.25 into
  `hi` + `sun` for cars within the centre pool. Test: a pure `crossLightOf` sampling test (monotone, no step > 0.08 per 0.2 u); e2e
  `promenade` (the stripes' brightness) + `people` (a car's body luminance at the crossing's centre vs 8 u away ≥ 1.6×); `vehicles-preview.html`
  gets a `lamp` row; `shots.mjs --crop crossing` (a new preset).

---

## D. IS SKY READY? (read only)

1. **The legends are a chain** (A1's seam): `harbor-legend.js:43–54 dice()` two branches, `:71–77 legendAt` (`len = kind === 'ufo' ? … :
   …`), `:256 HOLD` (a real table), `:27 CHASE = { t0: 29.2, dur: 2.72, uOff: 1.45 }`; `legends.js` warm `:517–522`, tick `:528 / :539 / :547 /
   :554 / :557`, power `:581` (a third kind falls into the UFO branch), the fixed `sky:` `:928` / `near:` `:930` slots, remote `:922`, start `:932`
   (refuses other kinds), prewarm `:935`, darkWanted `:979`; `scene.js:254, :310, :336, :1641` (four `['ufo','tr3b']` loops), `:1144`;
   `sounds.js:42–48 LEGEND_SET / KEY / HOLD` (tables) + `:328 legendSounds` (an if-chain); `city-sounds.js:183–201`; `harbor-witness.js:20–21`
   (a table) but the reaction `:67–98` if / else; `harbor-remote.js:196–197` one row (a registry); the director needs nothing (one `{ id:
   'legend' }`, `scene.js:1644`); `tests/harbor-legend.test.mjs:18–35` counts `kind === 'ufo' ? ufo++ : tr++` (a third kind miscounted). **The
   Blackbird as a third `kind` = ~15 edits of literals.** Build first: `LEGENDS = { [id]: { p, hours, len, at(s, dir), hold, weather, dark,
   sounds, witness, slot } }` in harbor-legend.js with dice / legendAt / trafficHold / legendSoon, LEGEND_SET, WITNESS and legends.js's tick /
   power / sky / near reading it; then the Blackbird (and the Mothman, and the implosion) = one entry + one `legend-<id>.js` + one sound
   set + one panel row. **"When the jets are ⅓ across" is a progress value, not a time**: `tr3bAt(s).chase = { on, u }` (`:147, :178`),
   `chaseX(u)` (`:187`) maps u → the lead's x = lerp(−0.25, 1.25, u): the lead's nose is at screen-x 0.33 at **u ≈ 0.39**; the Blackbird keys
   off `st.chase.u`, `run.dir` for the direction, `chaseJets(u)` (`legends.js:704–710`) for the jets' y = `lerp(bandY0, crown, 0.48)` — "above the
   sign" = above `bandY0` (`:916`); the NEON sign is DOM over the canvas, so anything in the sky pass passes UNDER the letters (fine: the
   strip above the sign is sky). **jets.js has ONE aircraft**: `createJets()` (`:296–329`) caches one sprite shape (`jetSprite` = the F-22
   outline `:40–66`), `draw(c, j)` has no `type`; `drawBurner` (`:234–268`) is parameterised by (len, k, night, t) only — 5 Mach diamonds at
   `sp = L × 0.155`. The Blackbird needs a `type` key + `drawBurner({ diamonds, spacing, colours })`. The vapour cone exists as a flat tinted
   blob (`j.vapour :318`) — a 0.4 s flash is one alpha curve; a shock ring does not exist. **Reusable for "the boom shakes the city":** the
   roof signs' restart flicker (`core/harbor-roofmodes.js:50–51 restartLevel` + `neon.js:421 burnoutFlicker`), the sign-dim hook (`scene.js:1649
   signDim.set('tr3b', { logo, tag, ms: 60 })` — one call for a 60 ms dip; never the logo per the owner → `tag` only), the glass glints
   (`dayfx.js:40–55 placeGlints` + `star :101`, day only; at night the party shimmer `neon.js:904–917`), the pigeons (`wildlife.js:128–150 flush
   / scareAt`, `startle :586` — all-or-nothing today; give it a count), the late double boom via `citySound(slot, { sync })` (`audio/city-sound.js`,
   two plays 0.15–0.3 s apart on the run's clock — `tr3b-crackle :380` is the repeated-one-shot pattern). **No screen shake exists** (a
   one-frame `translate(±1 pt)` in `scene.js`'s frame would be new; reduced-motion skips it). **No sonic-boom / radio-static take exists in
   `audio/city`** — the owner's `~/Downloads/city-sfx/sonic-boom.wav` must be imported (`scripts/add-city-sfx.py` CUTS + two `SLOTS`) BEFORE the
   pass so the prefetch rule (PROM's "loaded ahead") can hold.
2. **THE TR-3B's "shadow" — three things make a paper cut-out, none deliberate** (no shadow, halo or multiply anywhere in its draw):
   (a) **the baked "thickness" IS a drop shadow** — `legends.js:244–248 tr3bSprite`: the hull path filled dark twice, translated straight DOWN
   by `len × 0.034` and `len × 0.017` (`x.translate(0, len * 0.034); path(); fill`), then the belly — two y-shifted copies of one silhouette is
   the textbook 2D drop shadow (a real side wall foreshortens per edge: wide on the near edge, zero on the far one); (b) **nothing turns or
   tilts**: `drawTr3b :623 c.rotate(−0.02)` is a constant, `st.dip` only translates y, one fixed-view bake for the whole 30 s crossing
   (`tr3bSprite(len, dpr)` keyed by size `:507–512`), every live element (the glows `:638, :687–699`, the edge lamps `:678–684`, the circuitry
   `:643–676`, the red orb `:697`) a flat `'lighter'` sprite at the card's 2D coordinates — hull + lights never share a parallax; (c) **a dark
   band travels under it on the buildings** — `scene.js:343–365 drainCity` lays the dark-city bake in W/12 columns right under the craft
   (`legends.drainCols :596–609`, dead within r0 0.13 … r1 0.42 of its x) — by design, a moving dark zone directly below = a shadow in the eye's
   grammar. **Layering:** drawn in the sky pass INTO the main canvas (`scene.js:1717 legends.sky`), capped at **2× on an iPhone 3** (`legendLayout`
   passes `dpr: min(2, dpr)` `:288`; `tr3bSprite` clamps `min(2.5, max(1.5, dpr))`) — soft by 1.5× like the blade before 9c; the chase jets
   likewise (`jets.setDpr :918`). **ONE SOLID BODY:** bake the triangle as a model through the bake tool (a turntable of yaw AND a small pitch
   range at the camera's real view: it crosses just above the crowns, so ~3–6° below), draw it on a full-dpr overlay over the sky band (the
   crowns re-drawn in front from the skyline bake exactly as `people.redrawOver` does for the benches), the live lights INTO the model's
   frame from per-frame anchors (`ufo.json`'s `ports` per frame, `ufo-model.js:70`, is exactly this), a slow yaw of ±8° over the crossing so
   hull + lights + orb turn together; drop the two y-shifted fills (the side walls come from the model); keep the rim of city light
   (`:629–635`) as a per-edge stroke on the projected corners. If it stays 2D: per-edge extruded quads (near wide, far zero) + a tiny yaw (skew x
   by `sin(t) × 0.03`) applied to BOTH the sprite and the light positions.
3. **The bake tool is generic; the recipes are not shared code.** `scripts/bake-model.mjs` (62 lines) serves the glb + the recipe's page and
   calls `recipe.run({ page, out, look, ROOT, THREE, MODEL, info, save, dataUrlToBuf })`; the three recipes (`ufo.mjs` 239 — a 24-frame turntable,
   two rows `hi` elev 6 / `lo` elev 19, a BODY + a LIGHTS + an AZIM layer → `ufo.json` with per-frame `ports`; `crane.mjs` 204 — DAY + NIGHT
   atlases, per-frame anchors; `promenade.mjs` 71 — the city's lens) each copy `atlasOf / crop / shoot`; the loaders (`ufo-model.js`,
   `crane-model.js`) each re-implement the lazy load + bitmap warm-up + the `'off' | 'loading' | 'ready' | 'failed' | 'classic'` state
   (`legends.js:469–474, :487, :734`). **Before three new models: `scripts/bake/_lib.mjs` (crop / atlas / json) + `js/screens/harbor/model-
   sprites.js` (the loader + the state) — half a day, or three more copies.** The F-22: the nose → +x, the wingspan = 1 u, YAW ±8° × PITCH ±6° (a
   5×5 grid, both directions by `scale(dir, 1)`), DAY + GOLDEN + NIGHT (jets.js's `jetLook :28` has three weights), anchors for the nozzle +
   the nav / beacon / strip points. **The Mothman:** a STILL pose = ONE frame (bake 3 slight yaws so the eye picks the needle's angle; DAY +
   NIGHT like the crane — he stands there every night), RIM LIGHT from the needle's beacon as a bake light (`crane.mjs:100–104`'s pattern, red)
   + the violet city glow behind, the RED EYES as a LIVE layer (two `glow()` sprites at json anchors `eyes` — cheaper than an emissive bake
   and they can blink), the rim as its own `rim` atlas whose alpha follows the beacon's pulse; the wings spread = the model's pose (if the glb
   is rigged, pose it in the recipe before `updateMatrixWorld`).
4. **The hour-watcher's count — nothing exists.** No dwell counter anywhere (`title.js:79 IDLE_FIRST_MS` is the dock's rest); the visibility
   handling is `title.js:552 / :1139 onVisTitle` + `scene.js:2690–2691, :2773–2774 onVis / onShow / onFocus` (the frame loop stops when hidden,
   `hiddenAt`, restarts on visible / pageshow / focus / tap). **Recommend:** pure `js/core/watch-clock.js` (`watched(prev, now, visible)` → the
   running ms + the "reset only after > 5 min away" rule, unit-tested) + a per-device record via title.js's `store()` (`:71`, `nd:` keys,
   private-mode safe: `nd:watched = { ms, at }`); CONN-safe (no socket, no `/api`); ticked from `scene.js`'s loop only while `shownAt ≥ 0 &&
   visible` (the loop already stops hidden, so short breaks pause it for free; on `onVis` compare `now − at` > 5 min → reset). At 60 min:
   `legends.start('blackbird', now)` through the director (`may('legend','legendary')`), once per device (`nd:watched-reward`), at night, no
   legendary running; shown in the readout (`part('page', …)` `scene.js:1539`). Ship it AHEAD of SKY with a `&watched=59m` debug flag.
5. **The moments system vs an hour-long routine.** A moment's `len` is free (`harbor-moments.js:35–75`: 6.5 s … 900 s) and `PAINT[id](E, el,
   len, inst)` (`windows.js:1882+`, called `:842`) does its own timing — but the scheduler fights a long scene: `hourPlan :220–272` counts
   fixed entries toward `MAX_AT_ONCE = 2` (`:250–252`) so a two-hour boxer leaves ONE other moment for the whole building (party-night density
   collapses), `free() :226` blocks the window, `starOnly :317–321` treats routines as "own", `:233` refuses a draw crossing the hour, the test
   `:19` demands `len ≤ 60`. **A `base` routine type is needed** (the owner's WINDOW RULE II): a `base: true` entry that (1) doesn't count toward
   `MAX_AT_ONCE`, (2) still blocks its own window in `free()`, (3) is "own" for `starOnly`, (4) sits in `ENTERS_BY_MOTION :288`
   (`tests/harbor-windows-rule.test.mjs` classifies every moment); the 3-min rounds + 1-min breaks are INTERNAL phases of one painter from `el`
   (`floor(el / 240)`, `el % 240 < 180` = a round) — or, cheaper, Thanksgiving's chunker generalised (`holidayPlays :204–213` → `spellPlays()`
   with `rounds: 180, rest: 60`, writing `inst.round`, `inst.phase`, `first`, `last`) so every phone agrees on the seeded `el`. The nights: a
   seeded gate like `legendNights :113` / `quietNight :546`; `hours: [21, 23]`, `light: 'night'`. **The window: `back`** (floor 3, col 1) — no steady
   figure (the jazz room always draws the sax when lit `:835`, the bar `barState`, the apartment is the boss's `BOSS_ROOM :32`), only `wake` 7 am /
   `cash` 22.5–2.5 (overlaps 22:30–23:00: give the boxer priority on his nights) / `cat`, `fan`, `peek` + the holiday scenes; its look today
   `paintLampRoom :225` — "one bare bulb" is a room variant for his nights (`WINDOW_LOOKS :330` gets `boxer: 'silhouette'`; `tests/sp4.test.mjs`
   checks the table). **The backlit silhouette kit exists:** `partyRoom :1325–1374` — `paintBox` in a wash, a `'lighter'` glow, then `figure(c,
   { col: SIL 'rgb(6,5,12)', face, lean, tilt, arms, hat… })` at `E.deep()` with `setRim(null)` ("the dancers are DARK silhouettes — no lamp rim:
   backlit"); the boxer = the same `figure()` in profile (`face: ±1`, `arms` guard / jab from `solveArm :103`) against a `paintBox` lit by one bulb
   (a hot spot on the back wall + `lampFall :78`); `walkIn :95` handles the arrive / leave through the room's depth on breaks.
6. **The upper windows on the crisp layer:** B1's table; last inside SKY (it changes what the 58 `windows` checks read — through the canvas
   today; with the overlay they must read the DOM canvases).

**SKY needs (before it starts):** (1) the legends REGISTRY (half a day, `harbor-legend.test.mjs` green); (2) the bake tool's shared library +
loader; (3) the sonic-boom + radio-static takes imported as slots (the owner's file is in; a static take needs a brief or a synth —
`scripts/build-synth-sfx.py` can make radio static); (4) a `type` on `createJets` / `drawBurner`; (5) the `base` routine type in
harbor-moments.js, pure, tests first — it can ship ahead with no look change; (6) the watch clock ahead (4). **Split off (not SKY):** the
crisp-overlay "crossers" plumbing (rain / snow / frost / vignette / raid INTO an overlay box — it serves the benches + the blade today);
the TR-3B's `drainCity` per-frame cost (B3).
**The order inside SKY:** 1 the registry + the jets' `type` (pure, pixdiff) → 2 the bake lib + the F-22 recipe → the chase + air show + flyby
on one full-dpr jet overlay (the first visible win, 390 / 402 / 430) → 3 the TR-3B rebaked as a model on the same overlay, hull + lights + orb
from anchors, the y-shifted fills gone → 4 the Blackbird: one `*At(s)` timeline (the tell at −3 s, the entry, the cone 0.4 s, the ring 0.8 s,
the boom ×2 at +0.8–1 s, the exit), one painter on the jet overlay, one sound set, one panel row, `HOLD.blackbird`; three callers of
`legends.start('blackbird', at)` (the seeded solo roll in `dice()`, the chase hook at `st.chase.u ≥ 0.39`, the watcher's reward); the city's
twitch = `signDim.set('boom', { tag, ms: 60 })` + `wild.startle(n)` + a one-frame translate → 5 the Mothman (independent; in parallel) → 6 the
shadowboxer (the `base` type + `PAINT.boxer` in the back room on the party-room kit + his seeded nights; e2e `windows`; the panel row + a
skip-to-round control) → 7 the upper panes on the crisp layer with B1's crossers table.

---

## E. THE TODO LIST FOR C4 (one ordered list; the owner's PROM notes from Step 0 merged in, nothing dropped)

**Over 3 h as one pass → THREE: C4a the shopfront + the ground (the owner's look fixes everyone sees first), C4b the people (the sitters,
the doorman, the people rule, the cart + the compass decision), C4c the code / test / docs fixes.** Restructure first in each: C4a splits
`windows.js` (the five files above) before touching `bossShade` and the shop; C4b nothing (the figure kit + the planner take the changes
as plug-ins); C4c nothing. **Do NOT touch in C4:** the legends (SKY's registry), the clouds / fog / wind (ATM), the party show, the water, the
sky lanes, the blade (approved), the hush sign, the holiday calendar (11b discusses Christmas first — the owner's order), Day of the Dead
(skipped this year — no work, the owner's order), the windows' moments catalogue (SKY's routine type).

| # | what | from | size | test |
| --- | --- | --- | --- | --- |
| **C4a — the shopfront + the ground (≈ 3 h)** | | | | |
| 1 | **THE WET STREAKS → A SHEEN**: `street.js:312` skips the implied lamps; the broad sheen brightest at the bottom edge, the puddles bright; the back reflections 0.55 → 0.42, broken by the cobbles + the rain's ripples (C4) | the owner 7:39 + FR4 | S | e2e `weather` (the new column probe); `shots --scenes wet-night --crop dock` |
| 2 | **THE AWNING** lit from below, brighter: the stripes' gradient from the front edge, the valance rim, the dodge split into the window-head band + the pavement pool, NO dodge on the glass; its hours + the blackout kept (C1 1c) | the owner 7:36 | S | `shots --crop shop` night / late / day; e2e `speakeasy`, `doors` |
| 3 | **THE LIT BLIND** (the upper right + the boss's): `litBlind()` — a radial from the lamp source-over on the cloth, the lamp's silhouette, 5–6 fold lines, the sash's shadow, the pull cord, the hem + ring at night; `edgeMood` on the same painter (C1 1b) — after the `windows.js` split | the owner 7:42 | M | e2e `windows`; `--crop facade --zoom 2` at 390 / 430 |
| 4 | **THE BARBERSHOP AS A 2.5D ROOM**: the bake on `paintBox` + `deepAt` (the mirror wall = the hidden door, the chair one bold silhouette, the shaded lamp), `lampFall` at night at k 0.45 (dim + closed), the veil + the oval + the halo + the additive `soft` gone, the glass with a faint reflection, the gilt dark gilt from `f.awning` (closes the gold-after-1 am known issue); `barberDay` in the deep frame (C1 1a) — the owner judges HARBOR BARBERS after it: keep / the valance (≥ 8 pt) / drop | the owner 7:36 + 7:39 | L | `shots --crop shop` at 390 / 402 / 430 night / late / day, three refine passes; e2e `speakeasy` + `windows` + `doors` |
| 5 | **THE CROSSWALK's LIGHT**: one radial per pool, feathered at the curb / rail, wider; the signal tints the same (C4) | the owner 7:19 | S–M | e2e `promenade`; `shots --crop crossing` (new preset) |
| 6 | **THE CARS LIT THROUGH IT**: three-point sampling → a gradient mask, the lamp look stronger (hood / roof highlight, spokes), the signal's tint on the near flank (C4) | the owner 7:19 | M | the `crossLightOf` unit test; e2e `people` (the luminance probe); `vehicles-preview.html` `lamp` row |
| **C4b — the people (≈ 3 h)** | | | | |
| 7 | **THE CAB-STAND SITTER**: the front-facing seated rig (knees forward + out, the thigh a filled mass, the lap, shoes at the knees, hands on the knees), thicker + solid, over the seat's front edge, a little lighter than the bench; the water bench's sitters get the lap too (C4) | the owner 7:24 + 7:43 | M | `folk-preview.html?only=sit`; the joints unit test; e2e `people` |
| 8 | **`&force=waterbench` + its panel row**: a sitter within ~10 s, a couple stops beside it; then the owner's see-through check there (a solid backrest / head + shoulders + hat above the back line if it fails) | the owner 7:47 + 7:42 | S | e2e `promenade` (the forced sitter arrives ≤ 10 s) |
| 9 | **THE DOORMAN OPENS THE DOOR**: `doormanLegs` on the guests' door legs (the hinge side, `'holdDoor'` + `swing`, `'tipHat'`, back to the post), `'attend'` at rest facing us, hands clasped, a weight shift; the peaked cap + the long coat + the brass-button stripe (C4) | the owner 7:29 | M | the unit case (his swing contains the guest's, at the hinge at `tOpen`); e2e `doors` + `people`; `folk-preview.html` `doorman` |
| 10 | **THE PEOPLE RULE**: `rejoinVisits` at every witness window's end + every ctx switch, staggered 8–120 s through the six entries (the edges, behind the speakeasy, the crosswalk, the bus, a cab); the implosion's clear-out optional; THE TEST "every walker enters at an entry" (unit + e2e `legends` + `people`) (C2) | the owner 7:49 | M | as listed |
| 11 | **THE COMPASS + THE CART** — after the owner's answer to C3's conflict: (A) the compass stays, the giant's closed floor shrinks + a route opens behind the compass (closes the foot slide F6), or (B / C) per his pick; the cart to f 0.69, z 38.4, hand −1, the customers' spot +2.6 u, in from below the dock, `stopX = medallion.x + EVENT_CLEAR`; RENDER before committing: day + night + the giant + the snowman at 390 / 402 / 430 | the owner 7:19 / 7:24 / 7:29 + FR4 | M | `tests/harbor-people.test.mjs` (the routes), e2e `motion` (the foot slide ≤ 0.25 again), `promenade`; `shots --scenes night,day,halloween,snow --crop stage` |
| **C4c — the code / tests / docs (≈ 2.5 h)** | | | | |
| 12 | **FIREBASE AUTH's IDB POLLING** (B2): try `browserLocalPersistence` alone; prove the slots + a rejoin on the emulators (`e2e-smoke`, `e2e-conn`) — or leave it, documented | FR4 | S | `e2e-conn` (the sockets unchanged) + the smoke test; a `core` probe: IDB requests in 60 s on a parked title < 10 |
| 13 | **THE CLOUD'S FIVE**: F6 gated on the motion page (`no-holiday-props`) until 11 lands; F7's trace waits for `wands` ≥ 1 s + normal-length frames; F8's margin 0.55; F10 accepts `['crawl','skitter']` + the wait-for-still; F11 waits for `wheel.mb`; F12 repaired (waitFor + 1 px tolerance + the room rects by day) and HARD; F14 + F15 skipped on CI; F17 NO SMOKE back to `ok`; the Known-issues entries SP3 → BNAME that repeat F1 / F2 closed | FR4 | S each (≈ 1 h) | the next `[harbor]` push (the pass's one run) |
| 14 | **THE READOUT's HONEST TOTAL** (H19): every Harbor canvas registered through `safeCtx`, `canvasMb()` beside `mem.mb` in the readout + `harbor().mem.tracked`; **the dressing at the tier's dpr** (H17); **the frost pane sized to the glass + freed at 0** (H18) | FR4 | S + S + S | e2e `core` (tracked ≥ mem.mb; the dress's canvas ≤ 2× at tier 1); `pixdiff` night / snow / halloween |
| 15 | **THE DEAD LAMPPOSTS OUT** (H1) + the 11 stale comments (H12) + the 10 `void x` (H13) + `?season=` dropped (H14 of review 3) + `month` out of the facade's key (H16) + the dead exports deleted / un-exported (H5) | FR4 | S (≈ 1 h together) | the unit suite; `pixdiff --scenes night,day,golden` (no look change) |
| 16 | **THE A/B FLAGS LISTED** (H4): `AB_FLAGS` in harbor-remote.js (a hidden TOOLS group) + the grep test | FR4 | S | `tests/harbor-remote.test.mjs` |
| 17 | **`&dpr=3`** — the debug flag for the owner's 3× judgement (B1); the readout prints the dpr | FR4 | S | the owner's iPhone, a calm night + a party, unzoomed |
| 18 | **DOCS**: A4's table (the pill line, the 63 → 134 slots, `&panel=1` gone, the E2E groups → harbor-jobs.mjs, the stubs table, `&frost=`, the four lamppost comments, CLAUDE.md:144's pieces, the dead preview params); **CLAUDE.md's trims** (≈ 14 KB: the 20 lines listed in A4); harbor.md: the dated INDEX + the pass logs to `docs/harbor/passes/` (the owner's call — it is a big file move, do it when nothing else is in flight); the PROM known issues updated (the gilt, the foot slide, the bench overlays' rain) | FR4 | S–M | — |

**Not for C4 but on the list:** the glow-sprite cache (H2), the night thresholds into the frame env (H3), the RNG unification (H7), the party
boolean (H8), the vehicle table (H9), the course loop (H11), the people-module cycles (H10), the bar's day sprite (H15), the `roundRect`
guard (H16), the `scene.js` split — each as the first step of the pass that touches its file (ATM: H3 + the scene-weather split; Part 10:
H8 + neon-show; 11b: the holiday table + window-holiday; SKY: the legends split).

**Testing per step:** the unit suite after every item; the named `ONLY=` groups locally (`speakeasy,windows,doors` for C4a; `people,doors,
legends,motion,promenade` for C4b; `core,weather,perf` for C4c); `pixdiff` for every "no look change" item; ONE `[harbor]` push per pass
(the two-run cap). Screens at 390 / 402 / 430 unzoomed for 2, 3, 4, 5, 7, 9, 11 — three refine passes for the shop.

**The city's rules, checked against this list:** the night is the bar (the shop gets DIMMER and truer, the awning becomes the storefront's
light — nothing here adds haze; the sheen replaces streaks that were wrong); iPhone vertical first, unzoomed (every fix carries its three
widths); crisp light, no haze (the dodge comes off the glass, the blobs become a lamp + a pool, the pools become one gradient); nothing
pops in or out (THE PEOPLE RULE joins THE WINDOW RULE; the doorman's door is the real swing; a 3× ↔ 2× step only ever behind a crossfade).

## Needs the owner's decision
1. **The compass** (C3): (A) stay at 0.6675 + the giant's floor shrunk + a route behind (recommended), (B) f 0.58, or (C) 0.515 with the water
   bench moved — which rule wins: the crosswalk clear, or the water bench + the door's landing + the cab route?
2. **The 3× foreground**: judge `&dpr=3` on the iPhone first (B1); then the crisp-layer extension (recommended) or the band.
3. **harbor.md's split** into `docs/harbor/passes/` (A4) — now in C4c, or after 11b.
4. **The implosion's clear-out** (C2 item 4) — in C4b or left for later.
