# NIGHT-A2 — THE WEEKEND FIXES (Oct 29 2026; plan.md "OWNER'S NOTES — OCT 29 (the evening)"; behind `?city=2`)

> A pass log of the Harbor. The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

The owner's review of NIGHT-A (Oct 29, 7–7:20 pm, his iPhone 16 Pro, Safari 402×660) before THIS WEEKEND — Fri Oct 30 a party night,
Sat Oct 31 Halloween AND a party night. Not here: the street party, the quiet building, the helicopter (NIGHT-B); the legends + the boxer
(SKY); PERF's full work.

### Group 0 — THE LOOK FIXES
- **THE NEW NIGHT LIGHT IS THE DEFAULT** (`core/harbor-light.js#LIGHT_DEFAULT = 'new'`): OLD stays a TOOLS row (`light-old`) + `&light=old`
  for comparing. The old light's own checks pin it: the unit file `tests/harbor-light.test.mjs` (FP3a's pools, C4c's hydrant corner)
  sets OLD at its top; the NIGHT-A test flips to NEW + back; a new test says NEW is the default and the OLD row stays.
  title-perf's `np-*` / `w-rain` scenes now run the default (NEW) light.
- **THE MIRROR DOOR IS SILENT** (`core/city-sounds.js#MOMENT_CUES.mirror = []`): it swings INSIDE the barbershop, behind its glass — its
  creak (`door-heavy`), the bar heard through it (`bar-open`) and the thud as it shuts (`door-heavy-close`) are gone; the motion stays.
  The slots stay filled (`bar-open` still plays when the speakeasy's SIDE door opens onto the street at night).
  **The other inside-a-window sounds** (listed, NOT changed — each has a reason the street could hear it or none was given): the toast's
  glasses clink (`toast`, a lit window — faint, through the glass), the blind rolling up (`wake`), the cat's meow + its landing on the
  sill (`cat` — on the sill, against the glass), the barbershop's bell (the shop's street door) + the scissors' snips (`shop-open` + the
  barber's day: inside the shop). The snips are the one the owner may want gone too.
- **THE TREES' NIGHT SHADOW** (the new light; `screens/harbor/trees.js#treeShadow`, `NIGHT_LIGHT.treeShadow` `{ throw 0.34, a 2, cap 0.55,
  blur 0.12 }`): darker — the benches' strength — and SOFT: the trunk + the crown's dapple each one blurred fill through
  `props-light.js#soft` (shadowBlur, baked once with the ground: no frame cost); still short (⅓ of the height), the crown beside + just
  behind the trunk, limb lines only when bare. Measured at 402×660 (2×), the shadow's pixels against the same cobbles in NIGHT-A's
  build: the maple's 1157 px **23 % darker** on average (77 → 59 luma; its core ~28 luma deeper), the crabapple's **18 %** (73 → 60; core
  ~42) — a visible step, never a cut-out (NIGHT-A's was ~5–8 %: "so faint you can't even see it").
- **THE BOSS's BLIND FULLY DOWN BY DAY** (`screens/harbor/window-paint.js#BOSS_COVER`): cover 1 × the daylight (0.9 at night — the lamp's
  glow under the hem), so by day no gap, no strip at the sill; the tap-peek still lifts it a hair (0.07); the spade tell + his night
  states unchanged. e2e `windows`: THE BOSS's BLIND FULLY DOWN BY DAY (the pane's foot is the linen, not the dark strip).
- **THE HARVEST DISPLAY**: the DRAWN one was already the default (`&prop=model` / the TOOLS row for the model) — unchanged.
  **A SOLID OBSTACLE** — the cause of the clipping: several planners build their OWN straight legs that never ask the router (the
  chestnut cart's roll, the dog walker's beat, the party line's guests, a stargazer's stroll, couples, the dance's watchers) — a long
  seeded run put people in the band just behind the display's front row of pumpkins (in front of its sort depth, so drawn OVER it: "walking
  through"). The guard is ONE place for everyone: `core/harbor-holidayprops.js#standingFootprints(L, HP)` (the pieces' GROUND footprints,
  padded by a person's half-width + a step: SOLID_PAD 0.45) → `core/harbor-people.js#aroundSolids` on every visit as it reaches the
  frame (folkAt): a stop inside a footprint moves to its nearest edge; a walk segment crossing one is routed round its corners (route() on
  the footprints alone); the leg keeps its t0 / t1 (a little quicker on the detour: ≤ 1.35× on a straight crossing). Cached per visit.
  The partner / dog offsets stay out of them too. **Covered:** the harvest display (`HARVEST_FOOT` — a unit test keeps it ≥ the drawn
  display's bottom tier + foot pieces), the giant jack-o'-lantern, Halloween's big pumpkin on its bale (the hydrant's stands on the front
  strip, nearer than the walkers' floor), Thanksgiving's spot pieces (the bench's bale + mums, the hydrant's, the corn-stalk bundles round
  the two trunks). **Not covered:** the pumpkins on the speakeasy's steps (they flank the door — the guests pass between them), the
  snowman + the Christmas-tree stand (their builders + sellers work AT them; 11b's pieces register in standingFootprints when built).
  **The test** (`tests/harbor-people.test.mjs`): a Thanksgiving evening, a Thanksgiving party night + a Halloween party night, 30 min each:
  nobody's drawn position inside any base; a detoured crossing ≤ 1.35× its pace; a way left ↔ right exists. The scratch probe over 2 h ×
  4 nights: without the guard people inside the display, the bench's bale + the stalks (stargazers, couples, the dog walker, the cart, the
  watchers — 786 samples of one watcher at the bale); with it **none**.
