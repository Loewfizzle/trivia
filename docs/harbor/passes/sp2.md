# SP2 — SPEAKEASY POLISH (Oct 24 2026; the blade, the windows, the wall-washers, crisp shopfront lights, the café lights, the awning; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## SP2 — SPEAKEASY POLISH (Oct 24 2026; the blade, the windows, the wall-washers, crisp shopfront lights, the café lights, the awning; behind `?city=2`)
The owner reviewed 7b on her iPhone: the life works, four things on the speakeasy's FACE weren't right. This pass fixes those four + the
add-ons sent during it (the café-light canopy, the awning at night, a tint per room, louder sky sounds, the placeholder people hidden). The
moments' logic + schedule are unchanged. (plan.md has no sections by this pass's names — the prompt was the brief.)

### 1. THE BLADE — a classic 1920s theatre blade (`speakeasy.js#BLADE`, `bladeLetters`, `paintLetters`, `paintBlade`, `MARQUEE`)
- A DARK ENAMEL board (deep navy-black) for EVERY game, a thin gilt frame, the game's colour only as a thin PINSTRIPE inside it.
- The name in BIG BOLD letters filling the board's width (`bladeLetters`, PURE + tested for every game): one column a word (two-word names
  side by side, each read top-down — a single column of 11 letters would be 7 pt tall), the cap height up to 0.86 of a slot and never taller
  than 1.5 × its column; every letter stretched by ONE factor taken from an H (an I stays a stroke, a W never leaves its column). At 402:
  OVERCLOCK / RUMRUNNER ~9.6 pt, SLIPSTREAM 8.6, the two-word names ~13 pt.
- BY DAY cream letters with a gold keyline + a drop shade; AT NIGHT the letters LIGHT THEMSELVES — a warm-white letter with a white-hot
  core + a TIGHT baked glow (`BLADE_GLOW` 1.6 pt, the canvas's own shadow, one canvas per game + size: no per-frame cost).
- THE MARQUEE now only on the stepped CREST + the FOOT (13 bulbs, symmetric; none down the long sides — the letters get the room); the slow
  party chase on those. The board's level logic (PF's `bladeLevel`, `BLADE_LIGHT`, 7b's `MARQUEE_LIGHT`) is gone — a dark board never glares.
- WIDER + TALLER where it can be: the brackets 0.32 → 0.22 units + the side frame thin (the face ~30 % wider: the wheel's left leg is still
  ~1.5 pt from its right edge, tested), the top up to the parapet (v1 10.3 → 11.0: ~25 × 112 pt at 402).
- `&ad=<game id>` previews any game's blade (the rotation is weekly).

### 2. THE WINDOWS — big clean panes, less inside, the TV upper-RIGHT (`windows.js#SASH_RAIL`, `glassOf`, `paintRoom`, `speakeasy.js#paintWindow`)
- A slim frame + a 1920s ONE-OVER-ONE sash with the meeting rail HIGH (`SASH_RAIL` 0.74 of the glass: a short upper sash) — never a bar
  through the scene; no muntins. The deep reveal + the sill kept.
- LESS INSIDE: each room a warm wall + ONE light + one or two strong shapes — THE BAR the back-bar's glow, two shelves of bottles, the
  pendant (a crisp core + a tight halo), the counter; THE JAZZ ROOM the amber shade lit from behind (one soft pool); THE APARTMENT a warm
  wall, the fringed lamp + its light, the armchair's back, narrow curtains tied back at the edges; THE BACK ROOM one green-shaded lamp over
  the table + two heads; THE EDGE windows the curtains drawn + the bright gap (two soft folds). By day the curtains 0.32 → 0.2 units wide.
- THE ROOM MAP (the owner: the TV belongs upper-right):
  | | col 0 (edge, half cut) | col 1 | col 2 |
  | --- | --- | --- | --- |
  | floor 3 | `edge3` curtains | **`back`** the card table | **`apartment`** the lamp → THE TV, the cat, the wake, the window box |
  | floor 2 | `edge2` curtains + the plant | `bar` (the clear window) | `jazz` (the shade) |
  `TANGO_PATH` follows: edge3 → back → apartment → jazz → bar → edge2. Every moment re-checked in its window (frame bursts).
- The light LANDING outside each lit window (`landing`: the sill's lit top, the left reveal's face, a short fall) replaces the soft blob
  that sat round every window (tier ≥ 1); the TV's blue lands the same way (`spills`).
- **EACH ROOM ITS OWN BULB** (the owner's add-on; `ROOM_TINT`, a multiply in the lit canvas): one incandescent family — the bar + the jazz
  room the deepest amber edging to red, the back room a low amber, the apartment a soft peach / lampshade gold, the edge windows a little
  dimmer + each a touch off its neighbour; the barbershop the cleanest warm-white (its own lamp); the TV the ONLY cool light. LATE
  (`lateOf`: from 11:30 pm, full by 1:30) dimmer + warmer (`LATE_TINT`); the dawn wake's lamp a little paler.

### 3. THE WALL-WASHERS — accents, not panels (`speakeasy.js#WASH`, `washCone`, `paintWashers`, `paintWasherLamps`)
- A VISIBLE fixture under each capital (an iron arm + a bowl hood, its lit rim + a white-hot lamp just showing).
- The light a per-pixel SOFT V (`washCone`, PURE + tested): a hot spot just under the hood fanning down + widening, gone within `drop` 1.75
  units (~36 % of the pier); no outline anywhere — the cone's sides + its foot fade per pixel; dimmer (`a` 0.8 → 0.6). The pier's own
  bricks re-laid lit (the texture shows through). The old scallop's rounded top read as arched windows — gone.

### 4. CRISP SHOPFRONT LIGHTS (`speakeasy.js#paintLit`'s shop, `paintGround`'s sconce, `SHOP_GLOW`, the basement)
- THE BARBERSHOP LAMP: the 2.9-unit glow over the whole glass → a bright globe + a tight halo (`SHOP_GLOW.lamp` 0.34 → 0.2), its light
  LANDING — an upright pool on the back wall + the mirrors under it, the chair's seat, back + headrest edges, an oval on the floor, a glint
  in the mirror; the dark shop round it stays dark.
- THE SCONCE: a tighter halo (0.42 → 0.24) + a smaller pool on the brick (landR 1.3 → 0.95, steeper), its light catching the granite
  surround's top edge, the door's upper planks (fading down) + the steps' fronts.
- THE BASEMENT: its soft blob → its light on the sill under it. THE POLE unchanged (e2e: its glass 207 vs the sconce 83, the lamp 115).

### 4b. THE CAFÉ-LIGHT CANOPY + THE AWNING AT NIGHT
- **THE CANOPY** (`strings.js`, rewritten; `CANOPY`, `BULB`, `frontProfile`): 3 swags between 4 TALL SLIM POSTS standing on the roof deck
  SET BACK 1.2 units behind the parapet (two along the front — clear of the billboard's legs — one at the back by the side wall, the left
  run coming in from off screen); 8 BIG Edison bulbs in view at every phone (r 1.25 → 2.3 pt: a warm glass globe, a white-hot filament
  loop, a glint, a TIGHT halo ×2.6), ≥ 8 pt apart; the wire thin (it catches the light at night, so the bulbs read HUNG). The drawing is
  CLIPPED to the sky above the building's front silhouette (the parapet, the finials, the Deco crest) — a bulb mostly behind the crest
  isn't hung there (the middle of the front swag goes behind the crest: real depth). Party nights: warm party colours (amber, pink,
  gold, orange, a little violet) slowly cycling (a step every 2.6 s, crossfaded) + a soft punch on the beat. By day clear glass globes
  with a dark filament. Their light lands faintly on the parapet's coping + face. The 7a/7b parapet posts are gone. Owner's rule: if it
  still looks cheap on her phone, it goes (two refine passes here: it reads as café lights at 402).
- **THE AWNING AT NIGHT** (`AWNING_LAMP`, baked by the lamps' ramp): a small lamp under it at the wall over the window (hidden by the
  canvas from this camera — only its light shows): the canvas lit from beneath, warm near the lamp + fading to the front edge, the
  cream stripes glowing more than the red (thin canvas), a warm rim on the scallops, a soft short glow on the shopfront + the pavement.

### 5. The add-ons outside the speakeasy
- **THE SKY SOUNDS LOUDER** (docs/audio.md#the-sky-sounds): the jets, the helicopter + the burner +6 dB, the airliners, the banner plane,
  the geese + the drone hum +3.5 dB; peaks capped by the player; still low-passed + distant.
- **THE PLACEHOLDER PEOPLE HIDDEN** (like the cart + the bus) until 8b walks the real ones: `scene.js` draws them only with
  `&force=placeholders` (a SPEAKEASY row in the preview panel — FP3a deleted them, the flag + the row with them); the layout keeps them (their boxes, the knock's door unchanged). The window
  silhouettes stay.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Night `2026-10-22T22:30` · 3:30 am `T03:30` · noon `T12:00` · the shop opens `T09:15` · a party night `2026-10-24T21:45`; any game's blade:
`&ad=overclock` (agent, stakes, golf, slip, rum…); each moment on a loop: `&force=window&moment=<id>` (wake at `T07:20`, shop-open at
`T09:20`, bartender at `T16:20`, the rest at night); the placeholder people: `&force=placeholders`.

### Tests (SP2)
Unit 571: `harbor.test.mjs` — THE CAFÉ-LIGHT CANOPY (posts set back, 8–12 bulbs in view, ≥ 8 pt apart, the silhouette), THE MARQUEE (crest +
foot only, ≥ 3.2 pt apart, the chase), THE BLADE READS (every game: a column a word, ≥ 8.5 pt letters at 402, inside the bulbs), THE
WALL-WASHERS (the soft V: a hot spot, fading fast, gone within ~⅓, no outline), THE ROOMS (the TV upper-right, the rail high, the tints
warm + distinct, late); `harbor-sounds.test.mjs` the new sky levels; PF's blade-level test removed. e2e-harbor locally: `speakeasy`,
`windows`, `party` 49 / 49, `panel`, `sounds` 40 / 40 (the café lights' counts, the marquee's 13 bulbs, the washer's hot spot between the
back room + the apartment). The whole suite: the cloud job. No new per-frame work (the blade's letters, the washers, the awning are baked;
the canopy has fewer bulbs than 7b's string lights) — no speed round.

### Known issues (SP2)
- The front swag's middle bulb hangs behind the Deco crest (skipped): the canopy shows a gap over the crest — depth, not a missing bulb.
- The canopy's bulbs sit just under the billboard's foot and its wire crosses the billboard's dunnage frame near the posts (the band
  between the board and the parapet is ~18 pt at 402).
- The room tints are subtle by design (a multiply of ≤ 90 levels of red-blue difference) — side by side they read as different bulbs.
- At night the barbershop stays a CLOSED shop under one lamp (the plan's story) — the cleanest warm-white, but a small light.
- 10-letter one-word names (SLIPSTREAM) get ~8.6 pt letters at 402 — the board can't grow (the wheel's leg on the right, the stop light
  below, the parapet above).
- WebKit can't run here: the blade's glow is the canvas's `shadowBlur` (Safari supports it — not `ctx.filter`), baked once.
- **THE CLOUD JOB (2 runs, the owner's cap):** run 1 — 295 / 296, the wall-washer probe read one pixel of the narrow new cone (76 red locally,
  63 in the cloud) → the check now samples the hot spot's brightest + warmest of five points against the same pier a floor down (fixed,
  passes locally). Run 2 — 295 / 296, the washer check passing; the one failure THE POLE on a party night (every sweep washed toward white
  mid-punch: 210,210,197 · 209,137,209 …) — the barber pole's code wasn't touched by this pass, it passed on run 1, and it's the known
  "a loaded run catches a sweep mid-punch" flake the check already retries for. Not re-run (the owner: never spend a cloud run to confirm a
  flake); if it repeats, the check should sample between beats (`party().beatU` < 0.5) rather than on a timer.
- **THE QUICK `tests` WORKFLOW's smoke test** timed out on `golf: back to lobby` on the two docs / CI commits after SP2 (the SP2 commit's own
  run passed; the code under test identical; NEON PAR's flow, untouched by this pass) — the known GitHub-machine flake 793141d raised to 60 s.
  It now repeats: worth a real look in the next pass that touches the games or the smoke test (what the lobby waits on after NEON PAR).
  → **Looked at (PART 8P, section 0 n):** the failed runs' screenshots show BOTH phones still on NEON PAR's hole 1 after the 60-s wait —
  the lobby write never landed, not a slow wait. Most likely cause: NEON PAR is three.js on software WebGL on the 2-core runner, a tab's
  2-s host beat goes ≥ 10 s stale, the other phone claims host (as designed), and `backToLobby()` on the old host returns silently
  (`isHost()` false). The smoke test now sends startGame / backToLobby to whichever tab is the host NOW, retries back-to-lobby up to 3×
  30 s from the current host, and logs `NOTE … is the host now` / each tab's uid + hostId + phase when it has to retry (so the next
  failure, if any, says which it was). Unconfirmed on GitHub until the next runs.
