# NIGHT-A — THE NIGHT LIGHT (Oct 29 2026; plan.md "OWNER'S NOTES — OCT 29 (the afternoon)"; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

The owner's Oct 29 afternoon notes: the error log from his iPhone, THE NIGHT LIGHTING REWORK (behind a switch), the buttons at night, the
harvest model re-baked in the city's light, the TAXI STAND plate (optional) — + two add-ons he sent mid-pass (the trees' night shadow, the
boss's window by day). Not here: the street party + its crowd + the dance breaks (NIGHT-B, next), the fireworks (Part 10), SKY.

### Group 0 — THE ERROR LOG + THE TOOLS
- **"RangeError: invalid time zone: America/Detroit"** (district/sun.js ← title.js#neonNow, his iPhone Safari): the name looked right, so
  the string carried something invisible. `core/sky.js#cleanZone` — every `&tz=` (skyClock) + the panel's zone (remote.js) is cleaned
  before Intl sees it: invisible + control characters out (zero-width space, BOM, word joiner…), compatibility forms folded (a no-break
  space, a full-width slash), whitespace inside → `_`, wrapping quotes / brackets / trailing punctuation off, a leftover %-escape decoded,
  a case slip fixed; still rejected → the device's zone. Told ONCE: the LOAD LOG + /admin (`bad tz`) with the raw string's code points
  spelled out (`"America/Detroit​"`), so the next report names the real culprit. sun.js keeps a last guard (never throws out of the
  title's mount). Unit test: 14 bad spellings → America/Detroit, 5 junk → the device's zone.
- **THE PANEL's PARTY MODE — "beat grid", no pulse with the music**: a MUSIC MOOD saved on the device (EVENING…) won over the forced show
  in `audio/mood.js#moodNow`, so PARTY ON kept the calm song while the lights ran a party. Now the forced show beats the saved setting
  (a mood the panel / a link names still wins over everything; City 1.0 unchanged). e2e music 5b: EVENING saved → PARTY ON switches to a
  party-deck song (c2-evening12 → c2-party8), the pulse on its grid, the punch moving.
- **THE PARTY STALL** ("harbor stall ≥ 1.5 s — the loop restarted (watchdog) (t2 · party · party)", build 2808ff8 = C4d): not reproduced
  on 48df906 — the panel's PARTY ON driven live at 402×660, tier 2: Chromium at 4× CPU (36 s, no frame gap over 250 ms, the party on +
  punching, a party song) and WebKit (no gap over 257 ms). The likeliest cause was C4d's plan-cache thrash (the hotfix). /admin's stall
  reports carry the deployed build (api/log.js `v`), so a repeat is attributable. A scratch probe (`tests/integration/_probe-party.mjs`,
  git-excluded) remains for the next one.
- **A STORED PANEL STATE NEVER SILENTLY BEATS A LINK**: (1) CLEAR ALL in EVERYONE mode cleared only EVERYONE's state — a JUST ME state
  kept in the tab stayed on (and JUST ME wins on its phone): now it goes too; (2) a JUST ME state kept across a reload gives way to the
  link's OWN flags for the keys the link names (until the panel sets a new state); (3) `&prop` + `&light` are PREVIEW keys now (CLEAR ALL
  takes them off — `&prop=model` stayed after it); a link's `&prop` beats the HOLIDAYS row; (4) the readout's `panel:` row says what forces
  this phone + whose (`JUST ME (kept in this tab) · force harvest-model`).
- **THE DEBUG STRIPS ON iPHONE**: every OPEN strip's body scrolls by touch inside itself (`overflow-y: auto`, `touch-action: pan-y`,
  `overscroll-behavior: contain`, a cap each; the column's cap ~⅔ of the screen); the readout's key rows first (build · tier · fps in its
  head, then `harvest:` + `panel:`).

### Group 1 — THE NIGHT LIGHTING REWORK (`&light=new|old` + TOOLS → THE NIGHT LIGHT · NEW / OLD; default OLD, untouched)
One switch in `core/harbor-light.js` (`setLightMode` / `lightMode`), read by every painter; the scene sets it every frame from the link,
then the panel's rows, then `LIGHT_DEFAULT`, and the bake key carries it (a flip re-bakes the ground). NEW (`NIGHT_LIGHT`):
- **the BASE**: a cool city glow, even everywhere (× the lamps' ramp — the blackout takes it down too); the cobbles + walkers never a dark lot.
- **ONE WASH**: the implied lamps as a DIRECTION — warm, by DEPTH only: full at the screen's foot (z ≈ 24 on every phone), ~0.6 at the curb,
  ~0.4 at the compass, ~0.2 at the railing (`washAt`); the same at every x — the street under the dock shows no patches (the old light's six
  cones: σ 1.2 + 0.09 dz, 9 u apart). The stage bakes it as one full-width gradient in the joints (no ellipses).
- **ONLY TWO PLACES STAND OUT**: the shopfront (its spill trimmed to 0.8 — the wash adds under it) + the cab stand's lamp (its pool, its
  shadows); the blade's hidden lamp (POL4) + the hydrant corner's (C4c) fold into the wash; the cart keeps its own glow.
- **PEOPLE**: the cloth keeps more of its colour where the wash is strong (`keep` 0.42, `lift` 2.6 × folk.js's 0.1) — every side we see
  faces the wash; the side rim only near a source you can see; shadows SOFT (a gradient fading along their length, no blob at the tip),
  LONG (3.4 × height), faint (0.36), all leaning up-left from ONE direction (a far light behind the viewer, a little right: straight up
  they hid behind the body); beside the cab stand its lamp throws them (LEFT, as C4b). Faces: lit from the front (`lampOn`); crowns: one
  broad light in front (`treeLamps`); the road's cars: even (`roadLampAt`).
- **THE TREES' NIGHT SHADOW** (the owner's add-on: "reads as a BARE tree — trunk + limb lines to the crosswalk"): the wash's direction
  only, thrown ~⅓ of the height (`NIGHT_LIGHT.treeShadow`), half strength, no stretch — the crown's dapple lands on the cobbles beside +
  just behind the trunk; limb lines only when bare (winter). The old light as it was.
- **THE DUSK + THE OUTAGES + THE BLACKOUT** (stage.js#dimPools): the wash taken down by the lamps' MEAN darkness as they catch (a gentle
  step, never a patch), full-width by depth; the blackout takes the wash, the base + the local pools.
- **PARTY NIGHTS**: the wash takes a faint tint of the party palette (scene.js#partyWash: 6 %, `lighter`, a new colour every 8 bars eased over
  the last one — never on the beat; tier 0 none); the window party's colour on the cobbles (WIN3) TINTS them instead of adding light.
- **WET NIGHTS**: C4a's sheen glazes the street as before (already a full-width gradient).
- **THE BRIGHTNESS LADDER** (e2e `light`, the city job — the composited screen at 402×660 at 3×, plain + party September nights, no people;
  brightness = the max channel, so a saturated party pane counts): sign 255 / skyline 255 > windows 191 > shopfront 160 (party 165) >
  wash 111 (118) > base 81 (84). It first failed on the party night (the window party's pools ADDED on the brighter wash: 194 > 183).
- shots.mjs: the `na-*` review scenes (`na-night na-party na-wet na-halloween na-thanks na-snow na-dusk`, compare with `--qs light=old|new`).

### Group 2 — THE BUTTONS AT NIGHT
- **JOIN = HOST** (measured, luma, 402×660 at 3×): the ring band JOIN 169 / HOST 107 before (the pink body tube) → 170 / 154; the words
  255 / 252. At night HOST's tube is the NEON sign's language — a wider white-hot core in a lighter pink body, its glow tubes lifted toward
  white (still pink), the letters a near-white core in the pink glow; its colours stay the sign's (a holiday's four too). By day unchanged.
- **THE CORNER BUTTONS** (☰ + music): a white neon tube round each disc at night (ring luma 87–90 = ~½ of JOIN's band, ~⅔ of its light:
  opacity 0.67 of a thinner tube), on with the icons' catch, off by day; red-pink with the music off.
- e2e `light`: THE BUTTONS AT NIGHT (HOST within 12 % of JOIN, the corners 0.4–0.8 of it).

### Group 3 — THE HARVEST MODEL IN THE CITY's LIGHT + THE TAXI STAND PLATE + THE BOSS's WINDOW
- **RE-BAKED** (scripts/bake/harvest.mjs): NIGHT = a cool sky ambient + the wash as a warm key from the front, low + EACH of the code's 25
  Edison bulbs a real point light at its 3D place on the two ledges (MODEL_SWAGS back-projected) + the compass floods' warm-white rim from
  low at its sides; + a GOLDEN-HOUR sprite (a low warm sun from the front-left, a warm sky) — harvest.js blends day → gold (by the tones'
  gold) → night. The code's bulbs stay on top. `assets/city/harvest/gold.{webp,png}` new (9 + 61 KB). The DEFAULT stays the drawn one.
- **CREDITS**: the AI-generated label is live (☰ → CREDITS → 3D MODELS: "Harvest display (AI-generated)") — the owner shipped Hunyuan3D.
- **THE TAXI STAND PLATE — NOT BUILT (left implied)**: at 402 the cab stand sits at depth 38 → 15.8 pt a world unit; 8-pt capitals are
  ~0.5 u tall, so "TAXI / STAND" needs a ~2.3 × 1.5 u plate — wider than a person is tall (1.7 u): a billboard, not a small enamel plate.
  A real-size plate (~0.6 × 0.3 u) gives ~2.5-pt letters. Per the owner's rule (kept only if it reads unzoomed): left implied.
- **THE BOSS's WINDOW BY DAY** (the owner's add-on): the strip under his blind was an opaque near-black — "an OPEN HOLE". By day it is now a
  dim room seen THROUGH the same glass as the neighbours' lower panes (the bake's sky tint + sheen show through); at night as before (the
  lamp / TV glow under the hem). The violet tell + the tap-peek unchanged; e2e windows.

### Group 4 — the end
- **Today vs new**: `&light=old` vs `&light=new` reviewed at 390 / 402×660 / 430 (plain, party, wet, Halloween, a Thanksgiving build-up,
  snow, dusk — the `na-*` scenes) over four refine passes on the light (the base first too strong — a hazy grey; the wash warmer; people
  kept their colours; the shadows longer + leaning so they show past the body) + one on the trees' shadow.
- **Speed** (title-perf `--ab` vs 48df906, 4× CPU, 402×660, tier 1; scenes `np-night np-party w-rain` = the old light, `na-night na-party
  na-rain` = the new): all six **same** (work −1.1 … +3.6 ms against a ±3.6 … ±9.8 ms noise). THE BASELINE GUARD: plain night 0.93×,
  the forced bus 0.99×, the forced dog walk 0.88× (≤ 2×). The perf-baseline file is unchanged.
- **The old light is unchanged** (pixdiff vs 48df906 at rest: night / party / noon / Halloween beyond the noise 0.0001–0.12 %): only the
  boss's day strip (the owner's add-on — both lights) + walkers who moved between the two shots.
- **Checks**: unit 871; e2e music 111/111 (+ 5b), light 5/5 (the switch ×2, THE LADDER ×2, THE BUTTONS), blackout + people + promenade
  43/43 (+ the new light on the Oct 29 blackout), windows 58/58, the guard 3/3.

### Decisions
- The default stays OLD (`LIGHT_DEFAULT`) until the owner's OK — flip it in core/harbor-light.js (one line; the `light-old` row stays for A/B).
- One direction for the shadows (a far light behind the viewer, a little right) rather than a "true" fan from six lamps: the owner asked
  for a direction, not lamp positions; straight up they hid behind the bodies.
- The ladder measures BRIGHTNESS as the max channel (a lit colour), not luma — a magenta party pane is a bright light with ~75 luma.
- The window party's colour on the cobbles TINTS (source-over) in the new light instead of adding — added on the brighter wash it made
  the ground brighter than the windows themselves.
- The TAXI STAND plate: not built (the feasibility numbers above).

### Known issues
- The cloud's first run (40967705853): the city job's DEBUG STRIPS check still held the old 232-pt cap (this pass raised it to 260 + made it
  a touch scroller on purpose) — the check updated; and C4d's NO IndexedDB POLLING read 5 transactions in 15 s on the runner (< 3 wanted;
  the polling was ~18) — 0 on the laptop, this pass touched neither Firebase nor auth: a runner flake to watch, not a regression.
- The party stall from the owner's iPhone (build 2808ff8) not reproduced on 48df906 — watch /admin's stalls (they carry the build).
- The bad-tz string itself is still unknown: the next report will spell its code points (`bad tz` on /admin).
- The harvest model's WebP vs PNG on the owner's phone: still waiting on the readout's `harvest:` row from his phone (HOTFIX Oct 29).
- The corner rings' luma is ~½ of JOIN's band (the ⅔ is their opacity; a thinner tube): the owner judges it on the phone.
- The trees' night shadow under the new light is deliberately faint — if he wants the crown's dapple stronger: `NIGHT_LIGHT.treeShadow.a`.

### Handoff → NIGHT-B (THE STREET PARTY)
The crowd will be lit by this light (`env.front`, the soft shadows, `keep`): many more figures → watch the people's cost (the soft shadow
is one gradient a figure — at tier 0 consider the old contact shadow). The party's tint (scene.js#partyWash) can follow the dance breaks.
The street party's clusters stand on an even wash — no pools to place them under.
