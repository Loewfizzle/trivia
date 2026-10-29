# THE DAY PASS (Oct 22 2026) — the city by daylight, from the skyline down to the water (behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## THE DAY PASS (Oct 22 2026) — the city by daylight, from the skyline down to the water (behind `?city=2`)
The owner's iPhone review (Oct 21): by night the city is getting there, but BY DAY — high noon especially — "it looks pretty rough",
and the signs in the back were hard to read. The bar: the daytime city as premium as the night (a sunlit 1920s Art Deco harbor
like a crafted travel poster), checked side by side with the night at 402×874. The night, dusk and the party look as before
(pixel-diffed: only the two night touch-ups below + the new clouds change a night frame). Out of scope (later parts): the
promenade and its life (Part 8), the speakeasy's building (Part 7), snow + seasons (Part 9).

### 0. Two night touch-ups (+ the owner's add-ons)
- **BEHIND THE WHEEL, FOUR VERSIONS TO PICK FROM** (C1.5: **the owner picked d** — it is the only one now, live for everyone; a / b / c
  and the `&wheelbg` flag are gone. As built then: **a** more warm windows lit (~1 in 6: every window may light there, not only the ones its building's
  dice allow; `lights.js`), **b** the buildings a step lighter + bluer (`blocks.js#wheelBackdrop`: the tones mixed 55 % toward a
  dusky blue, +0.2 of the lift; windows as Neon Pass 6), **c** a little of each (~1 in 9 windows, half the lift), **d** (the owner's
  add-on) ARCHITECTURAL FLOODLIGHTING — a warm uplight washing up each building's stone from its foot (`blocks.js#floodWash`: one
  smooth gradient scaled to the building's whole height — its feet stand behind the near band, so the light reads on the part we
  see and the top ~15 % sinks into the night), drawn UNDER the panes so the windows stay dark shut rectangles, no lit windows, no
  rim light, no points. The wheel stays the brightest thing in every version; still no neon or signs behind it.
- **THE DARK CORNER** (bottom right, right of the lighthouse: the near band's `near24`, dark since its icon went in Neon Pass 6):
  `core/harbor-neon.js#lhEdgeBlocks` frees the near blocks that reach into the lighthouse's calm zone but stand mostly clear of the
  tower (their middle outside ±30 pt) — a warm roofline + ONE ledge band on a floor line (`bandNeon` kind `roofledge`, the right
  district's warm pairings; nothing boxy behind the tower) and most of their windows lit (`cam.lhLit` → `lights.js`: lit share ≥ 0.86).
  Its BAR storefront at the water's edge was already there. Tested on the four phones (the freed block stands clear of the tower).

### 1. Signs by day — painted, vintage 1920s (`signs.js`)
- **THE PAINTED FACES** (`DAY_PAINT`, `dayPaint()`): real neon is nearly invisible in sunlight, so every board reads UNLIT — enamel /
  hand-painted, each game its own scheme from its colours (SIGNAL cream on deep red, STAKES gold on black, AGENT white on navy, BLUFF
  red on cream, CIPHER cream on bottle green, PULSE gold on plum, PRISM white on peacock blue, NEON PAR cream on teal, RUMRUNNER gold on
  oxblood, OVERCLOCK black on orange, GRIDLOCK cream on royal blue, SLIPSTREAM navy on amber), a touch sun-faded toward warm paper.
  The letters ARE the tube alphabet's own strokes, painted thick right under the tubes (`paintStrokes`: a drop shadow down + away
  from the sun, a gold-leaf / dark keyline, the solid letter, the sun along its top edge) — the same word by day and by night, so a
  sign never changes at dusk; a painted pinstripe + a fine keyline inside the board's edge. The glass rides on top as a faint pale
  line (`drawGlass({ onPaint })`), its electrode caps + clips faded by day. Baked with the housing (per look key), weighted by the
  day's share: the night's dark cabinet is unchanged. Tested: every game's letters ≥ 4.5 : 1 on their board.
- **THE GAME BLADE** by day: its inner panel the game's paint, the bulbs' frame a darker band of it.
- **THE BILLBOARD** by day is a **painted poster** (`buildBillboard#poster`): the board in the game's enamel, a Deco sunburst behind
  its mark painted big (keyline + shadow), a rule line, the NAME across the whole board under it — a bold image + a big word, no
  small text (a game's board never shows its tag line any more, night included — the RUMRUNNER board's small text is gone).
- **THE NIGHTLY PICK BY DAY**: the boundary moved from noon to **5 am** (`nightKey`): the day shows TONIGHT's pick, so a sign never
  swaps game at dusk; and within a visit the pick never changes while anything of a sign shows (`neon.night(k, painted)`: never by
  day; a re-layout keeps the first key) — a new pick comes with the next visit.
- **GHOST SIGNS** (optional in the brief): not built — the mid buildings' brick walls are 3–6 pt wide at phone size; a faded ad there
  reads as a smudge, never as lettering. Part 7's big one on the speakeasy's wall is the place for it.

### 2. The skyline by daylight (`tones.js`, `blocks.js`)
- **THE SUN'S SIDE IS CONTINUOUS BY DAY** (`sunLook`): it was −1 / 0 / +1 — at noon 0 ("straight behind": no lit side at all, the flat
  look the owner saw). Now, with the sun up, −1..1 in fifths (a noon sun a gentle ±0.4 from the side it's on; a low one ±1 as
  before); with the sun down the old values exactly (the night + dusk unchanged). The height in ~8° steps by day. Tested: ≤ 24 look
  changes over a day's sun (a new key every ~30–60 min; each bake is chunked over frames + crossfaded in 1.2 s — never a jump).
- **LIGHT + SHADOW**: the day's materials richer (the day channel only — golden hour, dusk and night keep theirs): the stone a touch
  more saturated and, near, warmed by the sun; the sunlit side bright + warm; the SHADE cool and blue (the sky lights it); the front
  turns from a warm sunny edge to a cool shaded one (stronger), a crisp bright arris down the corner toward the sun; cornices + setback
  ledges catch a bright line on top with a cool shadow band under; the cast shadows cooler + a touch stronger.
- **DEPTH**: the day haze bluer (`DAY.haze`), the far buildings dissolve into it a little more by day — pale + blue far, warm + crisp
  near. The blocks behind the wheel by day only +50 deeper (the night's +150 washed them to a pale grey).
- **WINDOWS BY DAY** (`blocks.js#dayPanes`): the glass mirrors the sky down the whole facade (lighter high, darker low), each pane's
  top catching a little more; ~15 % blinds half down (cream, the odd green), ~4 % windows open (the dark room), the odd sun glint on
  the sunny half. **GLASS TOWERS**: the sky deeper at the top + clouds drifting in the glass (soft reflections).
- **THE DAY SKY** (`tones.js#harborSky`, painted by `sky.js`): the shared palette's day sky (City 1.0's, untouched) is a soft
  grey-blue; the Harbor paints a deep azure overhead fading to a pale, luminous horizon, blended in by the day's share (dawn, golden
  hour and the night keep the palette's), greyed by the real cloud cover. The glass + the water mirror the same stops.
- **THE SUN BY DAY** (`district/sun.js`, `createSun({ look: 'harbor' })` — City 1.0 calls `createSun()` and is byte-for-byte as before):
  `sunColorHarbor` — white-hot overhead, golden → orange → red low; a little more squashed at the horizon (the look only, never the
  arch's fit); by day a faint wide halo (~18 r), a big soft bloom (~6.5 r), a hot inner glare, and a disc with no visible edge (a white
  core burning out to a soft coloured rim) — a low sun keeps the crisp coloured disc (crossfaded 10° → 24°).

### 1b. THE CLOUDS (the owner's add-on) — `screens/harbor/clouds.js`, one system for every hour
**(Superseded by DT2 — the clouds were rebuilt: real kinds, perspective, per-pixel volumes; see `## DT2` below. Kept for the history.)**
City 2.0 used City 1.0's cloud art; the Harbor now has its own (`district/weather-fx.js` still runs only the lightning on the Harbor —
called with no cloud on a storm). Driven by the REAL cover (`LK.cloud`: the live weather or the seeded day) + the REAL wind (speed +
direction), drifting slowly (reduced motion: still). A fair day 1–3 cumulus (+ on ~60 % of days high wispy CIRRUS); cloudy up to ~8
bigger ones + low STRATUS banks; overcast a seamless DECK across the top of the sky (its soft underside, its texture) with a few low
fragments under it. Cumulus: a broad flat base growing one big dome (sometimes a second), lobes round its top; lit for the hour from
the real sun's side (`cloudLight`): by day sunlit white tops + soft blue-grey shaded bellies + fine lobe rims; a low sun lights them
from the side + below (gold lobes toward it, a dusky mauve shade, a gold → pink → red underlight brightest on the sun's side); after
sunset pink + red bellies under darkening tops; at night barely there, faintly lit from below by the city's violet glow (the party's
blue-violet on a party night). Placed in the sky band only (the safe top → the skyline, so a low one peeks from behind the towers),
behind the NEON sign (the page draws over the canvas), never over the dock, and never behind the white SPEAKEASY word / the tagline
(a cloud that would span their band moves above it or down behind the skyline). A wide screen: the same sizes, more of them. The
moon glows through a cloud in front of it; `coverAt()` feeds `sun.through`. **PART 9 PLUGS IN**: `KINDS` (the shape builders —
cumulus, stratus; add nimbus, fog banks …) and `harbor().clouds.set({ grey, dark, base })` (greys / darkens / lowers the whole sky for
rain, storms, snow; re-lit at once). Cost: the shapes bake once per light key, 2 a frame (`BAKE` 1.6 px per pt: soft but not blurry);
a frame is one drawImage a cloud. Memory: 0.1–0.8 MB on a phone (overcast with the deck 2.7 MB), desktop ~5.8 MB.

### 3. The water by day (`water.js`)
A deeper blue-green harbor (`TINT.day`), the far grazing water taking the real sky's blue near the horizon; the crests carry the
real sky's colour (`bakeTex`, keyed on it by day only); a stronger mirror by day (`fres` + the depth fall-off lifted by `T.day` — the
wheel, Rosie, the lighthouse and the sunlit city read in the water; golden hour + night unchanged) with the wavelets a touch quieter;
**THE DAY GLITTER PATH** — a high sun (≥ 12°) lays a narrow white trail of sparkle on the water under it toward us (`glitter()` with
day colours; `stats.paths` says `daypath`); the existing low-sun gold path, the moon's and the glints unchanged.

### 4. The day's motion (`screens/harbor/dayfx.js`)
**FLAGS** on a few roofs (the hero blocks + the tallest near roofs clear of the wheel, the signs and the lighthouse: 2 on a phone, 4
on desktop), vintage pennant colours, stirring in the REAL wind — limp in a calm, out straight in a gale, flying downwind, a ripple
running along the cloth with its folds shaded. **SUN GLINTS** on glass: a pane on a tower's sunny side now and then flashes (a soft
star, ~a second; ≤ 18 panes with nothing nearer in front, re-placed when the sun changes side; tier 1+). Both by daylight only (gone
below a 1° sun — dusk and the night never see them); `&force=no-dayfx` turns them off. The water's glints, the clouds, the gulls
are the rest of the day's life.

### 5. THE TIRED TUBE, now the only imperfection (the owner's bug: "the O is permanently dimmer / fuzzier")
- **What was the O's own** (`ui/logo.js#premiumBits`): its two electrodes sit 10 units apart at its foot, so their two shade spots
  overlapped into one dark patch across the whole bottom of the letter. Electrodes that close now share ONE spot of the usual size.
- **The rotation** (`core/harbor-show.js#tiredLetters`) is now the logo's ONLY imperfection — about every **3 hours** (the owner's
  call, after a 20–40 min try): none ~30 %, one ~55 %, two ~15 %, any letter, never a letter the block before had, every phone the
  same. `title.js` checks again 1.2 s after mount (the first check could come before the scene's clock: nothing showed for 30 s).
  **Preview: `&force=tired&letter=N|E|O|N2`** (a comma list too: `N,N2`) holds that letter tired.
- **The O without its white core — FOUND + FIXED (C1.5, review-2.md §2):** not a paint glitch — the holiday O's CSS rule
  (`.ndl-3 .ndl-core[style] { stroke: var(--c) }`) matched the empty `style=""` the flutter left on the plain O (it cleared
  `style.opacity` instead of removing the attribute), so the O lost its core for the rest of the visit once the flutter landed on
  it. Now the rule needs the swapped O (`[data-kind]`) and has fallbacks, and the flutter is a class (`is-flut`).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, afternoon `T16:00`, golden hour `T18:20`, a cloudy day `T13:00&wx=clouds`, overcast
`T13:00&wx=overcast`, a night `T22:00`; the tired letter `…T22:00&force=tired&letter=O` (N, E, O, N2). Shots: `shots.mjs --scenes
d-morn,d-noon,d-aft,d-golden,d-clouds,d-overcast,d-night,d-party --crop skyl3,skym,skyr3` (the thirds of the skyline: new crops).

### Performance (A-B-B-A against c8ef52d, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame, means of two runs)
| scene | tier 2 | tier 1 | tier 0 |
| --- | --- | --- | --- |
| `np-day` | 5.84 → **6.11** | 4.68 → **5.26** | 3.47 → **3.75** |
| `np-clouds` (new: a cloudy day) | 5.78 → **6.36** | 4.72 → **5.04** | 3.56 → **3.96** |
| `np-golden` | 7.83 → **7.67** | 6.28 → **6.96** | 4.47 → **4.45** |
| `np-night` | 8.24 → **8.18** | 6.72 → **6.88** | 4.17 → **4.18** |
Frames 16.7 ms everywhere. The day's new costs are small (the clouds' drawImages, the day path, the flags + glints); the night is
the same. Memory: 35.7 of 64 MB at 402×874 tier 2 (the clouds ≤ 2.7 MB of it).

### Known issues (THE DAY PASS)
- **WebKit still not run here** (not installed: Playwright's WebKit install fails on this machine). **The owner's iPhone check:** the
  painted signs readable at a glance (SIGNAL / BLUFF / AGENT / STAKES / the billboard), the clouds' edges soft but not blurry, the sun
  at noon a white glare without a visible edge, the flags moving. (The O + the wheel's backdrop: done in C1.5.)
- Ghost signs not built (§1). The flags are small at phone size (~6 × 4 pt: texture, not objects).
- The cloud layout re-rolls every 6 hours of the local clock (a fresh sky a few times a day); a visit across the boundary sees the
  clouds re-placed once (they fade in).
- ~~The E2E's `PERF` check still fails on this bench~~ — C1.5: the work is a warning now (the gate is the relative A/B).

### Handoff → Part 6b (the special-occasion sky)
The day is done for now. For 6b: the sky's art lives in `harbor/` (`clouds.js` for any cloud the special sky needs — a storm front, a
skywriter's smoke against them, `harbor().clouds.set`), `createSun({ look: 'harbor' })` for the eclipse's sun; the day's motion in
`dayfx.js`. Part 7: the speakeasy's wall is the place for the big GHOST SIGN; Part 8: the promenade's day look; Part 9: storm / rain /
fog / snow skies plug into `clouds.js` (`KINDS`, `set({ grey, dark, base })`); Part 10: holiday flags can join `dayfx.js`'s flags
(their colours are a table). (The owner picked `&wheelbg` d — C1.5 made it the only one.)
