# PART 7b — THE SPEAKEASY'S LIFE (Oct 24 2026; the windows, the TV glow, the mirror door, the facade light, the marquee, the string lights; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 7b — THE SPEAKEASY'S LIFE (Oct 24 2026; the windows, the TV glow, the mirror door, the facade light, the marquee, the string lights; behind `?city=2`)
The owner moved this part up: the speakeasy is the closest, biggest, most readable thing on screen, so it must be the most alive. Before
it its windows were still paintings and at 3 am the whole building went black. Built overnight, unattended (the decisions are listed
below — each easy to reverse). Out of scope, hooks left: THE RAID + its police cars (with the vehicles, 8b), people on the promenade + the
rooftop guests (8b), weather on the glass (9), holiday window scenes (11), the password sign (Lobby 2.0).

### 1. THE MOMENTS CATALOGUE (`core/harbor-moments.js` PURE + `tests/harbor-moments.test.mjs`; drawn by `screens/harbor/windows.js`)
- **One entry a moment** (`MOMENTS`): `{ id, label, rarity, windows, hours, light, days?, months?, wx?, party (× its weight on a party
  night), len, cooldown, kind }` — the windows are `ROOMS` ids (core/harbor-speakeasy.js) + `shop` (the barbershop's big window); `'all'`
  holds every upper window in turn (`TANGO_PATH`). ROUTINES (`at` + a seeded few minutes, `routineAt`) also move their room to its next
  state; LEGENDARY moments have their own calendar (`legendNights`: one night a season, `plays` times through the evening).
- **THE SCHEDULE** (`hourPlan(key, hour, ctx)`, `dayPlan`): built ONE HOUR AT A TIME (seeded by the local date + the hour: ~1 ms, the
  scene builds only this hour + the last), the same for every phone at the same place; a phone opened mid-way joins the moment already
  running (`momentsAt` → its `el` + `p`). Something starts every ~10–20 s at night (party nights ~7–14 s; the longest gap ≤ ~40 s, at
  the top of an hour), never two in one window, never more than `MAX_AT_ONCE` (2) together. `RARITY` is a CHANCE A SLOT (common 1 ·
  uncommon 0.34 · rare 0.008): when the eligible ones sum under 1 — by day — the rest of the slot stays empty, so rare stays rare. A
  Thursday in October: 1 752 moments (toast 725, dance 509, cat 310, mirror 101, sax 86, peek 17 + the four routines); a Saturday
  (party) 2 520. `ctx.dark` = [dusk, dawn] from the real sun (`light: 'night'` moments only between them).
- **THE ROOMS' STATES BY THE HOUR** (`roomState`): the apartment `nightlamp` (3 am → the wake) → `lamp` → `tv` (lights-out → 3 am); the
  bar `closed` → `open` (from the bartender's routine: by day the half-drawn shade, at night the full bar) → `last` (3 → 4 am); the shop
  `closed` → `open` (the opening's end → 6 pm). **NEVER FULLY DARK** (tested minute by minute): the TV until 3, then the night lamp
  upstairs + the bar's last light low with someone sweeping until 4; at dawn the upstairs wakes. (`roomLight` — 7a's timeline — still
  drives the other rooms.)
- **ADDING A MOMENT** = one entry in `MOMENTS` + one painter `PAINT[id](E, el, len, inst)` in `windows.js` (E: the window's glass
  `G`, its light `kl`, the night `k`, the frame's `t`, `motion`, the tones `T`, `after` for drawing outside the glass). Its preview row
  appears by itself in THE PREVIEW PANEL → WINDOWS (`window-<id>`, grouped by rarity) and `&force=window&moment=<id>` plays it on a loop
  (from 1.2 s in, every `len + 2.5` s, nothing else drawn). A sound: `sound(e, env)` in windows.js calls its slot.
- **THE STARTER TEN** (the owner reviews these before any more are made) + the mirror door:
  | moment | rarity | window | when | what reads |
  | --- | --- | --- | --- | --- |
  | `wake` THE UPSTAIRS WAKES | routine ~7:00–7:08 | apartment | daily | the blind rolls up, a figure walks in, a big STRETCH (arms up in a V), the lower sash up + the watering can, drops falling onto the geraniums |
  | `shop-open` THE BARBERSHOP OPENS | routine ~9:00–9:03 | shop | daily | the lamp on, the barber in (white jacket), out to the door → CLOSED flips to OPEN, the first customer into the chair, the cape, the first snips |
  | `bartender` THE BARTENDER ARRIVES | routine ~16:00–16:06 | bar | daily | the shade drawn down a third, the lights on one by one (the pendant, the three shelves), a glass polished + held up to the light |
  | `lights-out` LIGHTS OUT · THE TV | routine ~22:00–22:12 | apartment | daily | the lamp clicks off, a beat of dark, the TV flickers on, a head settles onto the couch (the cat beside it) |
  | `dance` A COUPLE DANCING | common | jazz | 7:30 pm → 2 am, dark | two big shadows crossing the amber shade (their legs dark under its hem), a twirl under his raised arm |
  | `toast` A TOAST AT THE BAR | common | bar | 7 pm → 2:30 am, dark | three patrons, glasses raised high against the gold back-bar, the clink over the middle (a sparkle), a drink |
  | `sax` THE SAX SOLO | uncommon | jazz | 8 pm → 2 am, dark | the sax player's shadow (swaying gently all night) leans back hard, the bell up |
  | `cat` THE CAT ON THE SILL | uncommon | apartment / either edge window's visible half | any hour | a LARGE sitting silhouette leaps up, settles, the tail flicking, hops down |
  | `peek` A PEEK AT THE STREET | rare (~1 an hour) | apartment / jazz | 7:30 am → 2 am | a head leaning out from behind the curtain, left then right (the jazz room: ducking under the shade's hem) |
  | `tango` THE TANGO | legendary | every window in turn | 4 nights a year × 3 plays, 8:30–11:45 pm | a top hat + tails and a flapper dress (cloche + feather, fringe): a stride, a turn, THE DIP, a kick — one window after another |
  | `mirror` THE MIRROR DOOR | uncommon (× 3 on party nights) | shop | 8:45 pm → 2:30 am, dark | the mirror right of the chair swings in: amber light, the bar's bottle shelves glowing, two silhouettes with a glass, the light spilling across the dark shop, then shut |
  The next real tango (Grand Rapids): **Tue Nov 17 2026 at ~9:03, 9:57 + 10:54 pm**; 2027: Feb 7, May 19, Aug 28, Nov 12.
- **THE AMBIENT LIFE** between the moments (always on, drawn live): the bartender behind the counter (a lighter silhouette: he's further
  back) polishing, now and then THE SHAKE; the regular in the hat at the bar; the sax player swaying on the shade; THE BARBERSHOP'S DAY (a
  customer every ~8 min — in, the cape, the haircut, out — the barber reading the paper in his own chair between them); the shop dim with
  CLOSED on the door before 9 + after 6 by day (the bake says OPEN by day).

### 2. THE LIVE WINDOWS (`screens/harbor/windows.js`)
- **How it's drawn:** the rooms' STILL looks (`paintRoom`: the back-bar's bottles, the shade, the lamp room, the card table, the drawn
  curtains — 7a's art, the bartender / patron / sax player taken out) stay in the speakeasy's cached lit canvas; only what moves is drawn
  each frame, in the front wall's own units (v up), clipped to each window's glass, the sash re-laid over it. A window the life draws WHOLE
  (the TV, the night lamp, a routine, the bar's last light) is 0 in the lit canvas that frame (`life.frame(f).full`).
- **THE FIGURE KIT** (`figure(c, P)`): a person from the waist up (+ legs for the shop + the dancers): a body, a head (profile nose when
  turned), two two-segment arms with round joints, hats (fedora · top · cloche + feather), hair (bob · bun), a flapper's fringed skirt
  (flaring in a spin), tails, props (glass · shaker · broom · watering can · scissors · paper · cloth); ONE fill at night (a silhouette
  against the lit room; on the jazz shade a soft shadow, the legs below its hem dark), a lit palette by day (the daylight on them against a
  dark room). `cat()`: a sitting silhouette (ears, the tail round the paws, its tip flicking) or mid-leap. Sizes on a 402 phone: people
  ~14–18 pt from the waist up, the cat ~14 pt sitting.
- **THE TV GLOW** (an owner favourite): `tvLight(t, seed)` — SCENES of 0.4–3.5 s (cuts on a 0.35 s grid, about two in five), each its own
  level + tint (cool blue ↔ a whiter blue, ~1 in 8 a warm scene), a slow drift + a fine flicker, now and then a bright cut: never a steady
  beat. The whole window takes the TV's colour (it reads BLUE at a glance), its light on the walls + the ceiling, the curtains' inner edges,
  the couch's back; a head on the couch ~60 % of the time (the cat beside it now and then); a blue spill on the brick (tier ≥ 1).
- **THE LATE TVs across the skyline** (`lights.js#lateTv`, `core/harbor-moments.js#lateTvK`): up to 7 lone windows on the near + mid bands
  (the landmark towers' windows are ~1.5 pt — too small) flickering blue on the same irregular clock, ~10 pm → ~3 am (eased over 20 min),
  never behind the roof billboard or inside the wheel's disc — as City 1.0's bedtime turns the city's windows off they stand out more.
  (`harbor().windows.lateTvs / lateK / lateTvRects`.)
- **TAPS** (`speak.hit(x, y)` before the door; the viewer's own, not synced): an EDGE window → its curtain twitches (a head in the gap);
  the apartment / the jazz room → a head peeks out; the bar → the regular turns + raises his glass; the back room → its lamp swings; THE
  CAT → it leaps off (+ the `cat-meow` slot). `scene.hit` → `{ kind: 'speakeasy', id, tap }` / `{ kind: 'speakeasy-cat' }`.
- **SOUNDS** (each calls its slot — all empty today, so silent; Ben is collecting them): `club-murmur-calm` / `-party` while the bar is
  open at night, `tv-murmur` during the TV hours (both through `sounds.js#speakeasy` — beds ducked with the city's bed under the music,
  panned left), `door-heavy` when the mirror door opens, `cat-meow` when the cat jumps up. docs/audio.md#7b.
- **Reduced motion:** no moving moments (the rooms keep their states: the TV's light steady, the night lamp, the barber still).

### 3. THE FACADE AT NIGHT (the owner: "something's missing")
- **THE WALL-WASHERS** (`speakeasy.js#WASH`, `paintWashers`, `paintWasherLamps`): a small black iron hood under each capital of the three
  visible brick PIERS (the edge pier is off screen), aimed DOWN — from dusk, all night, by the lamps' ramp. BAKED into the night facade (no
  per-frame cost): the pier's own bricks re-laid in their LIT colour (the same tile seed, so the courses line up) through a SCALLOP mask —
  dark right under the lamp, the bright curved edge, then a long falloff to the belt course — so the light shows the brick's texture and
  never touches a window (tested). Crisp light on the surface, no haze; a hot sliver under each hood. (At phone size the lit piers read as
  warm arches framing the windows — the depth the facade lacked.)
- **THE MARQUEE** (`MARQUEE`, `marqueeBulbs`, `marqueeScreen`, `marqueeLevel`, `MARQUEE_LIGHT`): the blade's frame widened to carry a border
  of **48 round bulbs** (~2 pt globes, ≥ 4.6 pt apart at 402) round its stepped outline; the gooseneck lamps are gone (`drawGooseneck`
  stays for the billboard). At night each bulb a crisp warm-white globe + a small tight halo (none at tier 0), all in ONE sprite repainted
  only when the light or the chase steps (a steady night: one drawImage); STEADY on a normal night, a SLOW CHASE on party nights (every
  third bulb leads, one bulb a beat, crossfading over the beat's first third). The board under them DIMMER (`MARQUEE.board` 0.66 × PF's
  level; its light map an even fill + a warm edge just inside the bulbs). By day the bulbs read as unlit glass globes on the frame.
- **THE STRING LIGHTS, ON AGAIN** (`strings.js#STRINGS_ON` true, `BULB`): real ROUND BULBS hanging from short sockets on the gently sagging
  wire between the parapet's iron posts (their posts baked again); by day pale glass globes with a highlight; at night a crisp lit globe
  with a hotter heart + a small tight halo (no blurry dot), all in one sprite repainted only when the chase steps or the punch moves a notch;
  their light LANDS on the parapet (the coping's lit edge + a warm fall down its face). Warm white every night; on party nights Neon Pass 4's
  warm, colourful, changing chase. They stay under the billboard's foot (the FP test).

### Decisions made overnight (the owner was asleep — each the most reasonable reading; easy to reverse)
1. plan.md has no "THE SPEAKEASY AT NIGHT FEELS EMPTY" section — the prompt's own text (never fully dark: the TV to ~3, a night lamp /
   the bar's last light + someone sweeping, the upstairs wakes at dawn) was the brief.
2. Routines are catalogue entries that also MOVE THEIR ROOM ON (the blind up, OPEN, the bar's afternoon, the TV) — the new state stays all
   day; their minute is seeded per day (7:00–7:08, 9:00–9:03, 16:00–16:06, 22:00–22:12).
3. The schedule builds in HOUR BLOCKS (a whole day took ~15 ms on the laptop — a load hitch on a phone); a random moment starts + ends inside
   its hour (a gap of up to ~25 s at the top of some hours).
4. RARITY is a chance a slot, with an empty remainder when few may play: by day the cat (~every 5 min) + the rare peek (~1 an hour) — the
   starter set is night-heavy, so the day's "something happening" is carried by the shop's barber + customers, the bar's afternoon and the cat.
5. The mirror door is an 11th entry (`starter: false`), not one of the ten. It happens every ~3–5 min at night, × 3 on party nights.
6. The legendary tango: 4 nights a year (one a season), 3 plays each between 8:30 and 11:45 pm.
7. The cat sits in the apartment or in either EDGE window's visible half (the owner's "cat's ledge") — no story moment in a cut window.
8. The taps: edge → a curtain twitch; apartment / jazz → a head peeks; the bar → the regular salutes; the back room → the lamp swings; the cat → it leaps off.
9. The bar's "half-drawn" shade is drawn a THIRD of the way down (half hid the lit shelves + the bartender behind the counter).
10. The bartender is a lighter silhouette than the patrons (he stands further back) — the toast's raised glasses read against him.
11. The 8b placeholder couple window-shopping at the barbershop slid 1.6 units left (by the shop's door): they covered the barber + the chair.
12. The wall-washers sit on the three visible piers at 0.8 strength (the first pass at 0.92 read strong for "subtle").
13. The late TVs come from the near + mid skyline bands (the landmark towers' windows are too small to read).
14. The speakeasy's sound beds go through sounds.js (ducked with the city's bed under the music) rather than their own loops.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
7:15 am `2026-10-22T07:15` · the shop opens `T09:15` · noon `T12:00` · the bartender `T16:15` · 8 pm `T20:00` · the TV + the mirror door
`T22:30` · 1 am `T01:00` · never fully dark `T03:30` · a party night `2026-10-24T21:45`. Each moment on a loop: `&force=window&moment=<id>`
(wake · shop-open · bartender · lights-out · dance · toast · sax · cat · peek · tango · mirror) — or THE PREVIEW PANEL → WINDOWS (night
ones ☾ jump to tonight). Routines are best at their own hour (the wake at 7, the shop at 9, the bartender at 4 pm, lights-out at night).

### Tests (7b)
Unit 570 (`harbor-moments.test.mjs` NEW, 9: the catalogue + the starter ten's range, the schedule — the cadence, one window each, ≤ 2 at once,
seeded, party nights busier, night moments only in the dark, an hour on its own, the routines + the rooms' states, NEVER FULLY DARK minute
by minute, the legendary calendar, joining mid-way, the TV's irregular flicker + the late TVs' hours, the panel's rows; `harbor.test.mjs`:
the string lights ON, THE MARQUEE (48 bulbs inside the board, ≥ 3.2 pt apart, steady / the party chase, the board dimmer), THE WALL-WASHERS
(piers only, the scallop's falloff), the registry reads the `window-<id>` rows). e2e-harbor: NEW `windows` group (16): the rooms' states at
9:30 pm, the schedule running, the wall-washers' warm pier, the marquee's lit bulbs, the string lights, a tap's answer, the forced dance
moving on the shade, only the forced moment playing, the cat's dark silhouette + a tap sends it off, the TV blue + flickering at 11:30 pm,
the late TVs, never fully dark at 3:30 am, the mirror door's amber, the shop open at noon; `party`: the string lights ON; locally
`windows`, `speakeasy`, `party`, `sounds` 64 / 64 · `speakeasy`, `party`, `promenade` 48 / 48 · `panel` 25 / 25. The whole suite: the cloud job.

### Performance (A/B in one run, `title-perf.mjs --ab` against 793141d, 402×874, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-night` (4×) | 8.66 → 5.88 · 4.24 → 4.81 · 2.85 → 3.41 | 16.8–17.2 · 0 / 0.3 % | same ×3 |
| `np-party` (2×) | 10.25 → 10.98 · 6.2 → 7.23 · 4.8 → 5.31 | 16.8–17.2 · t2 0.7 / 3.1 % (noise ± 9.9) · t1 + t0 0 % | same · same · **SLOWER (work) +0.51 ms** |
The first round said tier 0 on a party night +0.56 ms (the string lights are back ON — a party chase on ~30 bulbs — + the live windows +
the marquee's chase); the one fix: the string lights' + the marquee's lit bulbs as ONE SPRITE each, repainted only when the chase steps or
the punch moves a notch. Re-measured: +0.51 ms of work at tier 0 (noise ±0.37), the frames unchanged (0 % slow, p95 17.1 ms) — the
owner's iPhone readout (&debug=1) decides, per the plan's rule (one fix + one re-measure, then report).

### Known issues (7b)
- **Party night, tier 0: +0.5 ms of work** on the laptop at 2× CPU (above); the frame pacing is unchanged. If her iPhone's readout shows slow
  frames on a party night at tier 0, the easy steps: the string lights' party chase at a lower rate, or the ambient figures (the bartender's
  polish, the sax player's sway) still at tier 0.
- The day is quieter than the night (the starter set is night-heavy): the cat, the rare peek, the routines + the shop's barber carry it.
- The late TVs are small (2–3 pt windows) — blue glints that change, not rooms; the speakeasy's own TV upstairs is the hero.
- The mirror door's panel is ~13 pt wide at 402 — the amber light spilling through the dark shop carries it at a glance.
- A routine forced at another hour shows its own look (the wake at night draws its lamp room); the preview's 2.5 s gap shows the room's state.
- The CLOSED card before 9 is tiny (~8 × 3 pt) — the shop's dim interior is what reads.
- The figures are drawn per frame (a few dozen path ops a window); the bar's afternoon re-paints its shelves every frame from 4 pm to dusk
  (cheap, but a cache is the step if a phone ever shows it).
- WebKit can't run here (as every pass): the figures are plain paths + fills, the bulbs sprites + `lighter` — the Safari floor's helpers.

### Hooks for what comes next
- **THE RAID (8b, with the police cars):** `harbor().speakeasy.pole({ on: false })` (7a) + the life's states: a `raid` moment / state that
  snaps every window dark + the shades shut (a full-window painter per window, `full` = all) and lets them flicker back one by one; never
  during a big holiday moment (the catalogue's `hours` / a `never` list). The marquee + the string lights: `strings.set({ colours })`, the
  marquee's level from `f.lamp` (0 = dark).
- **8b (people + the rooftop):** the doorman / the line at the side door (`L.door`), the rooftop's party guests + the bar cart stand in
  front of the billboard on the roof deck (7a's note: taller than the parapet); a moment can name `'roof'` once a painter draws there.
- **Part 9 (weather on the glass):** the plan's `ctx.wx` + a moment's `wx: [...]` gate (e.g. a fan + a raised sash on hot days); the
  painters get the window's glass `G` — rain runs, frost from the corners, steamed edges go over the room in `draw` (after the moments,
  before the sash).
- **Part 11 (holiday window scenes):** an entry with `months` (+ a holiday gate to add: `holidays: [...]` read from `core/sky.js#holidayOf`)
  and its painter; a holiday's own `party` weight on its night.
- **Lobby 2.0 (the password sign):** a window's still look can carry a card ("TONIGHT'S PASSWORD", 14–16 pt) — the apartment or an edge
  window's visible half via `roomDraw(id, fn)` (7a's hook, still called after the life).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The speakeasy is alive day + night. The owner reviews the starter ten on her iPhone (each via its `&force=window&moment=` link) before any
more moments are made; adding one = one catalogue entry + one painter (~15–30 min). 8b: the raid on the hooks above, the rooftop guests.
