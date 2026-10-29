# PART 11a-1 — HALLOWEEN + DAY OF THE DEAD (+ the shared holiday system + the window figures) (Oct 26 2026; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 11a-1 — HALLOWEEN + DAY OF THE DEAD (+ the shared holiday system + the window figures) (Oct 26 2026; behind `?city=2`)
The plan's "Parts 11a / 11b / 11c — holidays" + the owner's QUALITY BAR (plan.md "OWNER'S NOTES — OCT 26 (after SP3)": top tier, no
clip-art — realistic + premium, or a deliberate stylised design just as premium). Built as the main session + four parallel forks (the
sign's dressing, the sky + water, the people, the ground), each owning its files; the scene's hooks were marked spots in scene.js.

### 1. THE WINDOW FIGURES (`windows.js#figure` / `figures` / `setRim`) — Group 1
- **The kit redrawn at the real window size**: real shoulders (the deltoids' round caps, the trapezius sloping to a tapered neck), an egg
  head whose nose + chin grow into profile, a CONTINUOUS head turn (`face` −1 … 1 — no more snapping side to side; the peek, the wake,
  the jazz-room peek pass the look straight through), tapered arms (the upper arm fuller) with round joints + a mitten hand, legs that taper
  to a shoe pointing the way the figure faces, the flapper's fringe + a floor-length gown.
- **Hair + hats**: the 1920s bob (a sleek cap to the jaw, flicking at the cheek), bun, short (a man's, by default with no hat), long; the
  pinched fedora with its dent, the top hat's concave sides, the cloche bell + its feather, the flat cap — and the COSTUMES every holiday
  rides on: `witch` (a wide brim + a cone bent at the tip), `horns`, `ears`, `crown` (a ring of flowers — Day of the Dead), `sombrero`,
  `cape` (+ `'collar'`), `sheet` (a whole draped ghost with eye holes), `bones` (a skeleton's ribs + arm bones), `wraps` (a mummy's).
- **THE RIM** (the owner: "a warm rim from each room's lamp"): every silhouette against a lit room carries a thin edge of that room's
  light all round + a stronger one on the lamp's side (`RIM_COL` / `RIM_SIDE`: the bar amber, the jazz room honey, the apartment rose…) —
  drawn as the same figure inflated by the rim's width and nudged toward the lamp, the dark figure over it. A group that overlaps (the
  toast, the tango, the costume party) uses `figures()`: every rim first, then every body, so one figure's rim never lands on another.
  Shadows on the jazz room's shade carry no rim (they're shadows).
- **Reduced motion, fixed**: the title passes `motion: 0`, but the windows only ever checked `=== false` — the moments kept playing under
  reduced motion since 7b. Now 0 counts (`windows.js#frame`, `#draw`, the TV).

### 2. THE SHARED HOLIDAY SYSTEM — Group 2
- **THE CALENDAR** (`core/harbor-holiday.js`, PURE + `tests/harbor-holiday.test.mjs` over three whole years): `holidayAt(lc)` → `{ id,
  phase ('build' | 'day' | 'night' | 'down'), stage 0..1 (the build-up's progress), down 0..1, days, eve, key }` — DATE-DRIVEN: opening the
  city on Oct 27 shows the build-up as far along as Oct 27 should look. `halloweenPieces(H)` / `dotdPieces(H)` → what shows now;
  `lightRules(H)` → the holiday's light; `titleHoliday(H)` → the title's sign (City 1.0's `{ id, full, k }` shape). The scene keeps `HS`
  (the state), `HP` (the pieces), `HR` (the rules) fresh with the look, feeds the people (`peopleFrame().holiday / hpieces / forceHoliday /
  forceAt`), the wildlife, the windows (`life.hol`: the DAY's stage — noon's — so a window plan never shifts mid-hour), the sky (`fs.holiday`)
  and `harbor().holiday`. City 2.0 owns Halloween: the district's witch / bats / rooftop pumpkin never run on the Harbor (`LK.holiday`
  nulled for it; the fx's force set stripped of `witch` / `bats`). Oct 31 is never a UFO / TR-3B night (`harbor-legend.js#legendNight`).
- **ADD A HOLIDAY** (11a-2 THANKSGIVING next): a row in `HOLIDAY_TABLE` + its branch in `holidayAt` (build / day / night / come-down) + a
  `<id>Pieces(H)` + its rows in `lightRules` (the wheel / beam / Rosie / strings / sign / windows) + `titleHoliday` + its pieces' painters
  (the sign's in `signdress.js#want`, the ground's in `holidayprops.js`, the windows' as `MOMENTS` with `holiday` + `minStage` + `eve`) +
  `HOLIDAY_BANNERS` lines + panel rows (`harbor-remote.js`: `cat: 'holidays'`) + a `HOLIDAYS` jump.
- **THE SIGN DECORATION SYSTEM** (`signdress.js` — Fork A): one full-dpr canvas INSIDE `.nd-logo-wrap` (title.js passes it: `scene.set({
  dressHost })`), so it inherits the sign's boot, fades + dims; sized by a ResizeObserver; logo units mapped from the SVG's viewBox. Pieces
  `{ id, kind (wrap | perch | tube | sparkle | visitor), draw, animated }`; the tubes' light at any point computed per cell on first use
  (`lightField`, shared by every colour set); static pieces BAKED in ≤ 3–5 ms slices into two caches (the pieces + "lit by the neon",
  laid at the sign's live level — the boot, the TR-3B blackout cost one draw); moving pieces redraw ≤ 30 fps (15 at tier 0) clipped to their
  boxes; a tap on the spider → `{ kind: 'spider' }` (it bolts down its line). `harbor().dress` = its debug. City 1.0's DOM web + spider stay
  City 1.0's (title.js: `!hol.c2`).
- **THE HOLIDAY LIGHT RULES** (`lightRules`, applied in scene.js; THE DIRECTOR's order — holidays > party): the wheel's scheme
  (`WHEEL_SCHEMES.halloween` from the last week's evenings, `dotd`: marigold, Mexican pink, violet, turquoise), the lighthouse beam's colour
  (Halloween night's eerie green), Rosie's bulbs, the roof's café strings (`strings.js` `dotd`), the sign's tubes (`.sg-dotd` marigold N/O +
  pink E/N), the skyline's WINDOWS (`lights.js`: baked with the light key — Halloween night ~1 in 5 lit windows eerie green-white + ~1 in 12
  jack-o'-lantern orange; Day of the Dead's evenings ~1 in 6 candle-gold), THE SPOOKY LIGHT (the lamps GUTTER — `spookyFlicker`: each its
  own 7–13 s cycle, half of them a stutter; a deeper vignette).
- **Holiday window scenes** on Group 1's kit (`MOMENTS` with `holiday`, `minStage`, `eve` weight; `hourPlan` gates them on `ctx.hol`):
  GHOST (a pale green-white sheet rising + drifting, its eyes, the room's light shivering — the apartment / the back room), MUMMY (its shadow
  lurching across the jazz shade, the loose wraps swinging — the sax player steps away), WITCHSIL (a witch at her cauldron, its green glow
  from below, bubbles, a cackle pose), COSTUME (a witch, a devil, a cat + a sheet ghost raising glasses at the bar), OFRENDA (someone lighting
  the altar's candles one by one). Room DRESSINGS (not moments): a jack-o'-lantern on the edge windows' sills (Halloween's last week); THE
  OFRENDAS (Day of the Dead: the edge windows + the back room — a marigold ARCH, a magenta + violet tiered altar, a framed photo, a sugar
  skull, the bread, nine candles, papel picado across the glass; its candlelight the room's warm flicker).
- **The banner plane's holiday lines** (`harbor-sky.js#HOLIDAY_BANNERS` — two of three daily banners through a holiday): HAPPY HALLOWEEN ·
  TRICK OR TREAT / OCTOBER 31 · COSTUME PARTY / AT THE SPEAKEASY · FRESH PUMPKINS / AT THE PIER · BEWARE THE / GHOST SHIP; FELIZ DIA DE
  MUERTOS · REMEMBER THEM / WITH LOVE · CANDLELIGHT PROCESSION / NOV 2 AT DUSK · MARIGOLDS / AT THE MARKET.
- **THE CENTREPIECE**: not used this pass (the inlay belongs to Saturday's dance circle on Halloween night) — the hook stands for
  Thanksgiving / Christmas (`harbor().centrepiece.set`).
- **THE PREVIEW PANEL**: a new HOLIDAYS section (the third: SKY · LEGENDARY · HOLIDAYS · …) — the date jumps (HALLOWEEN · OCT 10 / 20 / 27,
  HALLOWEEN, DAY OF THE DEAD · NOV 1 / NOV 2) + every moment: THE WEB ON THE SIGN (`sign-web`), WITCH, HALLOWEEN BATS, TRICK-OR-TREATERS,
  ZOMBIES, THE BLACK CAT, THE SIGN · DAY OF THE DEAD (`sign-dotd`), CANDLELIGHT PROCESSION, MONARCH BUTTERFLIES; THE GHOST SHIP with the
  legendaries. Off-switches: `no-ghost-ship`, `no-witch`, `no-holiday-props`.

### 3. HALLOWEEN (Oct 1 → 31 by date; down overnight to 4 am Nov 1) — Group 3
- **THE WEB + THE SPIDER** (`dress-halloween.js` — Fork A; hero): a main orb web (30 radials, ~200 spiral threads, the hub in the gap
  between N + E) SPUN in order as the stage grows — the bridge, the frame, the radials, the hub, the spiral from the outside in, ~2.5 % torn —
  + a corner web in the last N's upper triangle from stage ~0.72 + loose strands; DEW DROPS catching the tubes' own colour (pink; orange /
  purple on Halloween night), dark beads when the sign is dark, clear water by day. THE SPIDER: REALISTIC (not the alien fallback) — a
  garden orb-weaver: the tan abdomen with its shoulder humps, the scalloped folium + the white cross by day, a glossy rim-lit silhouette at
  night, banded jointed legs with spines (five refine passes; the leg layout + bend fixed a first "crab" look). Its life on the clock:
  head-down in the hub 7–16 s (a leg adjusting), a stop-start run out along a radial, a pause, back; now and then down its dragline, a sway,
  back up; the feet planted, stepping in alternating fours. A tap: it bolts down its line.
- **THE JACK-O'-LANTERNS** (`holidayprops.js` + `core/harbor-holidayprops.js` — Fork D): nine pumpkins on + round the side door's steps
  (classic, tall, squat, white, warty, a gourd cluster; ×1.3 to read), ARRIVING by date (`PUMPKIN_DAYS`: Oct 3 → 28), CARVED from ~the 18th
  (eight faces), lit inside after dark (a flickering candle, the glow on the steps); all carved + lit on the night; gone Nov 1.
- **THE BLACK CAT** (wildlife — Fork D): the wildlife's cat on the step on Halloween evenings (`HP.cat`), green-gold eyes after dark; TAP →
  it HISSES (arched back, puffed tail, ears flat — `fauna.js` 'hiss') + darts off the left edge, back a minute later (`cat-hiss`).
- **THE WITCH** (`witch.js` — Fork B): a crafted silhouette — the wind-bent hat, a rippling cloak, a flared sleeve, the twig broom; a cool
  moonlit rim + the pink neon from below; orange + green sparks drifting behind; across the real moon's disc when it's up (`witchAt` /
  `witchPath`), behind the sign + the tagline; her cackle as she crosses the moon.
- **THE BATS** (`birds.js` — Fork B): at dusk a colony POURS out of the sunburst tower's crown, spiralling up into a column then spreading;
  a few jink round the roofs all night; every bat (summer's too) now has a membrane wing with its rim light.
- **THE NIGHT'S PEOPLE** (`core/harbor-holidayfolk.js` PURE + tested; `harbor-people.js`, `people.js`, `folk.js` — Fork C):
  TRICK-OR-TREATERS from dusk → ~9:15 pm — a group of 2–4 kids every 42–88 s + a grown-up (now and then a witch hat / a torch), costumes
  ghost, witch, skeleton, pumpkin, vampire, hero, cat, pirate (never two alike in a group), mostly to the side door (it swings open on the
  bar's light, buckets raised, it closes), the buckets glowing at night; ZOMBIES 8 pm → 2 am — groups of 2–4, a stiff-legged lurching
  SHAMBLE, arms out, heads lolling, 60 % in at the side door; whoever walks close startles, throws up their hands + laughs (a smooth
  function of the distance); the speakeasy's own guests in costume (~3 in 4).
- **THE LEGENDARY GHOST SHIP** (`ghostship.js` + `core/harbor-ghost.js` — Fork B; hero, three refine passes): a translucent green
  three-master — tattered sails with holes, a snapped topgallant, shrouds + ratlines, glowing gun ports + stern windows, flickering
  lanterns, a torn pennant, rising motes, mist rolling off the hull, its green pool + reflection in the water, the city seen through it —
  drifting across the open water between the lighthouse and the wheel (z 140: in front of the breakwater + Rosie's berth, behind the wheel +
  the taxi), fading in out of nothing and away. Halloween night's two crossings (`ghostShipTimes`: ~20:45–21:45 and ~23:00–00:30, seeded
  per year, 150 s each); THE DIRECTOR counts it as the night's legendary. Sounds: `ghost-ship-creak` as it materialises, `ghost-bell` twice.
- **The light**: the wheel orange / purple (the last week's evenings), the beam green + Rosie + the roof strings on the night, the eerie
  windows, the guttering lamps, the deeper shadows; the sign orange / purple + the neon jack-o'-lantern O on the 31st (the swapped O: day +
  night). Fog only when real. THE HAUNTED WIND under the night (`haunted-wind`, low, under the music).

### 4. DAY OF THE DEAD (Nov 1–2; dressed 4 → 7 am Nov 1; down through Nov 3) — Group 4
- **The sign** (`dress-dotd.js` — Fork A): a marigold-pompom garland on a leafy rope swagged along the letters' tops with seven hanging
  strands of different lengths, papel picado between the letters (cut patterns) fluttering in the real wind, fifteen pillar candles in
  groups at the foot (wax drips, flickering flames, their light pooled on the tubes' feet); the tubes warmed to marigold + pink; up left to
  right with its 0..1, down the same way.
- **The promenade** (`holidayprops.js` — Fork D): marigolds in pots by the door, round the tree grates + at every lamp's foot; garlands
  wound up the four lamp posts (winding / unwinding); a MARIGOLD PETAL PATH from the open promenade to the speakeasy's door with eight votives
  lit after dark; PAPEL PICADO on three strings across the promenade (sugar skull, flowers, heart, dove cut-outs) fluttering in the real
  wind, glowing in the lamps' light at night; rare MONARCHS by day (~one every 13 min). Each piece its own 0..1, up + down.
- **The windows**: the ofrendas (above) + the lighting moment; ~1 in 6 skyline windows candle-gold.
- **NOV 2 AT DUSK — THE CANDLELIGHT PROCESSION** (Fork C): from 10 min after sunset for 70 min, a continuous slow line in the near lane of
  the waterside road (planned in 60-s chunks: a phone opening mid-way sees it passing) — candles (a warm halo, the face + hands lit, a small
  pool on the ground), CATRINAS with flower crowns, marigold bunches, photos held up, children in crowns, a MARIACHI TRIO every ~3.5 min,
  an ofrenda carried on poles every ~4.7 min; the street closed while it passes (no cars, buses, cabs, crossings); tier 0 draws every other
  walker, tier 1 two in three.

### Decisions made (the owner was asleep — each the most reasonable reading; easy to reverse)
- **Four parallel forks** + the main session (the deadline); Groups 2–4 went in as ONE checkpoint commit (their pieces share modules —
  `signdress.js`, `holidayprops.js`, the people's planner — so a Halloween-only commit wasn't clean).
- **The spider is REALISTIC** (the owner's first choice) — it read as a true orb-weaver after five passes; the alien fallback not needed.
- **The neon jack-o'-lantern O stays** on the 31st (day + night): a tube bent like the letters (a deliberate stylised design, not
  clip-art). The skyline's neon keeps its colours on Halloween (the plan lists only the wheel, the beam + the windows).
- **Halloween comes down at 4 am Nov 1**; Day of the Dead's crews dress the city 4 → 7 am; its pieces come down 7 am → 7 pm Nov 3.
- **The window scenes stay out of the cut edge windows** (the owner's rule since 7b — the catalogue test enforces it): the ghost plays in
  the apartment / the back room, drifting through the room (behind the glass) rather than behind a curtain; the edge windows carry the
  sill pumpkins + ofrendas (dressings, not stories).
- **The ghost ship sails twice** on Halloween night (one early for the evening, one late), the night's only legendary.
- **No centrepiece** on the inlay this pass (Saturday's dance circle owns it on Halloween night).
- **The cat's hiss is synthesized** (no hiss in the owner's folder): `build-synth-sfx.py#hiss`.
- **A new CI job, `holiday`** (every other job was within ~30 s of its cap).

### Tests
Unit: `harbor-holiday.test.mjs` (7: three whole years, the build-up by date, the pieces, the come-down, the ghost ship's times, the light
rules, the sign), `signdress.test.mjs` (4), `ghostship.test.mjs` (5), `harbor-holidayfolk.test.mjs` (7), `harbor-holidayprops.test.mjs` (5),
`harbor-moments` (the holiday gate), `city-sounds` (the five new takes), `harbor-remote` (the HOLIDAYS section). E2E: a new `holiday` group
(its own cloud job): Oct 10 (the web part-woven, its spider, a few pumpkins) · Oct 27 (far along, the wheel orange / purple, the sign still
pink) · Halloween night (the web whole, the sign + the pumpkin O, the green beam, the spooky light, trick-or-treaters) · the ghost ship +
a ghost in the window (forced) · Nov 1 (Day of the Dead; the web + the pumpkins gone) · Nov 2 at dusk (the procession) · Nov 3 evening (all
down) · reduced motion (no witch, no bats, no window moments; the dressing still up). Locally: holiday 10/10; windows, people, wildlife,
sounds, sky 64/65 → 65/65 after a test that used `witch-cackle` as its empty slot moved to `sleigh-bells`.

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against 9d6dcd2 — the commit before the pass — 390×844, 2× CPU, the laptop without a GPU, 3 + 3 windows of 5 s)
| scene | tier 2 A → B work mean ms | tier 0 A → B work mean ms | verdict |
| --- | --- | --- | --- |
| a normal night (np-night) | 7.37 → 6.74 | 4.95 → 4.60 | **same** both (noise ±3.7 / ±1.9) |
| Halloween night at its peak (hw-peak: 21:45, a Saturday party + the zombies + the ghost ship forced) | — (INVALID: the laptop's tier moved on both sides) | 6.86 → 8.27 | **+1.41 ms at tier 0** (noise ±0.75); frame pacing unchanged (p95 16.8, 0 % slow) |
Attribution (`--vs`, tier 0): the ghost ship + the witch −0.36 (noise) · the people off −1.94 → the cost is the costumed crowd on a
Saturday party night (the zombies, the costumed guests' extra shapes) — already inside the tier's crowd cap (6 heads). Not trimmed: frames
stay on time and the plan's rule is never to quietly lower the look — the owner's iPhone (&debug=1) decides. Per piece in the page: the
sign's dressing ~0 at rest (bookkeeping), the spider ~1 ms a redraw only while it moves; the ghost ship ~0.2 ms; the ground props
0.3–0.7 ms (p90).

### Known issues (11a-1)
- **WebKit can't run here**: the sign's dressing at 3× (its canvas), the ghost ship's translucency, the spider's motion on the owner's
  iPhone are unverified.
- **The costumed crowd** on Halloween Saturday: +1.4 ms of work at tier 0 on the laptop (above).
- The spider can look tangled for a frame or two mid-turn. Day of the Dead's sign flags are small (~9 × 11 pt; two per gap).
- The ghost ship drifts slowly (~120 pt over its 150 s) and materialises partly off the right edge, behind the lighthouse at first.
- The bats' neon rim is off in the blue hour (tied to the darkness); they read as silhouettes against the bright sky.
- Reduced motion: no witch + no bats; the ship still crosses on the clock (no bob, no mist).
- On Halloween Saturday the promenade holds the dance circle, the line, the trick-or-treaters + zombies at once — the zombies read, but in
  a crowd; a costumed guest with the zombie look shambles at walking speed.
- The procession's candle halos are subtle at full size (tuned large); the ofrenda's poles sit at the bearers' near shoulders.
- The papel picado's back strings draw over anyone standing between z 51.6 and 53.6 (behind the tall lamps) — rare + small.
- The outside black cat + the window cat can be out at once on Halloween (the outside one is a stray).
- **The cloud runs** (the two-run rule): run 1 (40290380364) — four jobs red: the door's knock swallowed by the black cat's tap target
  (fixed: the door wins), a party night in the last week lost its party wheel (fixed: Halloween's own night only), the ghost ship's check
  read its first fade-in frame + the roof modes' check raced a sign joining (both checks wait now), and SP3's LOAD WEATHER. Run 2
  (40292408474): audio, show, wild, holiday green; `city` 103/104 — SP3's known LOAD WEATHER check again (the runner's UTC dawn re-bakes the
  windows: clock-dependent, SP3's Known issues; not this pass); `street` 67/68 — "BY DAY: the barbershop open, the bar closed ({})": the
  rooms' states read before the life's first frame on the slow runner (passed in run 1 and locally 17/17); the check now waits for
  them. Not re-run (two runs max).

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **The build-up**: `&when=2026-10-10T19:00` · `&when=2026-10-20T19:00` · `&when=2026-10-27T19:00` (dusk) · the same at `T21:30` (night) ·
  by day `&when=2026-10-20T13:00` (the web + the spider in daylight, the pumpkins on the steps).
- **Halloween night**: `&when=2026-10-31T21:00` (trick-or-treaters to ~9:15, the web whole, the green beam, the witch / bats now and then)
  · the zombies `&when=2026-10-31T22:30` · the ghost ship `&when=2026-10-31T21:00&force=ghost-ship` (or its own time: `T21:40` / `T23:53`).
- **The black cat**: `&when=2026-10-31T19:30&force=black-cat` — tap it on the speakeasy's step. **The spider**: tap it (it drops).
- **Day of the Dead**: `&when=2026-11-01T10:00` (morning) · `&when=2026-11-01T20:30` (the ofrendas + the candle-gold windows) · the
  procession `&when=2026-11-02T18:00` · monarchs `&when=2026-11-01T12:00&force=monarchs`.
- **The window figures**: a close moment `&when=2026-10-22T21:30&force=window&moment=toast` (`peek`) · a room moment `&moment=dance` ·
  the holiday scenes `&when=2026-10-31T21:30&force=window&moment=ghost` (`mummy`, `witchsil`, `costume`; `ofrenda` on `2026-11-01T20:30`).
- **Any day**: `&force=sign-web` (the finished web + the spider) · `&force=sign-dotd` · `&force=witch` · `&force=bats` ·
  `&force=trick-or-treat` · `&force=zombies` · `&force=procession`.

### Handoff → 11a-2 THANKSGIVING (+ the parade system)
- The calendar: a `thanksgiving` row (the fourth Thursday; its build-up through November; the Wednesday's homecoming party night; Black
  Friday's first Christmas crew) + `thanksgivingPieces` + its light rules (an amber skyline; the sign's amber tubes are `.sg-thanksgiving`).
- The sign's harvest wreath: a new `want()` branch in `signdress.js` (a perched / wrapped piece on LOGO_ANCHORS — the bake + light field are
  ready). The ground's hay bales / cornstalks / gourds: `holidayprops.js` (its sprite cache + passes). The cozy windows (candlelit family
  tables, a TV with a football game): `MOMENTS` with `holiday: 'thanksgiving'` on the figure kit (it has the props + the rim).
- THE PARADE SYSTEM: reuse the procession's planner (`core/harbor-holidayfolk.js#procWindow` / chunks / the street closed — `procHold`) for
  the marching band + the balloon handlers; the balloons themselves are new art (the 6a balloons' envelope rendering + the real wind).
- The centrepiece: Thanksgiving is the first holiday free to use the inlay (a harvest display), Christmas the tree.
