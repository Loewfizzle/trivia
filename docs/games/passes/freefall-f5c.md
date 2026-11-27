# FREEFALL — PASS F5C: F5B's LEFTOVERS + THE MATCH PIECES + HOW TO PLAY + THE MIX + CREDITS (Nov 27 2026)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F5C (approved Nov 27)". FREEFALL stays HIDDEN (`playable` false), THE SWITCH
stays OFF. Shots: `Downloads\NEON\freefall-f5c\` (end\, water\, mark\, match\, howto\).

## THE GROUPS

| group | commit | what |
| --- | --- | --- |
| Step 0 | 6f9f1edc | the decisions in docs/games/plan.md (+ the lab export: no open FIX marks; the inbox: nothing addressed to F5C) |
| 0 — F5B's LEFTOVERS | (this group) | the logo always · YOUR BEST n · AVG n · ☐ FRIENDS ONLY · the name on the test page's card · night under · day above · the day mark · the solo E2E's cause |

## GROUP 0 — F5B's LEFTOVERS
1. **THE LOGO** — the cause: the lettering was asked for only when the end screen mounted, decoded `async`; a slow fetch (or F5B's 2× shots)
   caught its EMPTY box (`end\after1` vs F5B's `end\solo-out-day-390x844.png`: the space there, no picture). Now `endscreen.js#warmLogo` fetches
   + DECODES it during play (the same srcset + sizes → the same file), the end screen's image decodes `sync` with `fetchpriority` high, and the
   look preview's ready flag waits for `decode()` + two painted frames. Present at 375 × 667 · 390 × 844 · 430 × 932, both looks, solo + match
   (180 pt on a short screen — never smaller).
2. **YOUR BEST n · AVG n** — `endscreen.js#bestWords` + `avgWords` (the AVG always shows: a dash when it isn't known / under 5 runs); a NEW BEST
   = "NEW BEST · 141" (celebrated) + the AVG under it. The cartridge's AVG = your profile's STORED average off the room's mirror
   (`profile/public.js#pubOf`, no read), the server's answer puts both right. On a short screen the NEW BEST line is 18 px, the card's gap 2 px —
   0 px over at 375 × 667 with the XP slot in.
3. **☐ FRIENDS ONLY** — the shared block's header is the tick alone (no "THE WORLD"); the match keeps "THIS MATCH".
4. **THE NAME** — the test page's card read `name: ''` (→ A PLAYER). `play.js` now hands the stage the signed-in name (this phone's saved
   profile, slot 1: `me` → the global profile's name, else the room name) — READ only; the page's graph stays free of the console.
5. **NIGHT UNDER** — the cyan lines 0.11 → 0.3 (a brighter cyan), the violet net 0.035 → 0.1, the teal ground a touch lifted; the bubbles
   brighter (`MOTE_NIGHT`) + 1.35× bigger by night (`MOTE_NIGHT_SIZE`, bubbles only). `water\beside-f5b.png`.
6. **DAY ABOVE** — see "THE WATER — THE LAST CODE TRY" below.
7. **THE MARK by day** — the ball tube's `o` (#f0453c): `ui/mark-svg.js#markSvg(game, cls, day)` draws it as an outline under the ring on a
   pale ground (the marks preview's DAY band; the city's day sign can read `t.o` at go-live). Night unchanged. THE BOOT: 83 B → 188 B left
   (the two files' header comments trimmed to pay for it).
8. **THE SOLO E2E's CAUSE** — the cartridge's seed IS the proof's (hash(code + matchId + GO) — a fixed one would be refused by the judge), so
   the certainty comes from the run's own tower: `e2e-freefall.mjs#playTo` turns onto the red only on a floor that HAS red (`redOn` — the
   pure tower of the run's real seed); a red-free floor (the blind 40 + 120, ~1 in 10 layouts) is played through. F5B's failure was the
   'red' hand bouncing on a floor with no red until the darkness took it.

## THE WATER — THE LAST CODE TRY (floor 119, day)
The owner's iPhone: lavender blurs · white dots like snow · a pale ICE-RINK rim · a greyish blue. Found: (a) the LAVENDER = light ADDED onto
deep blue (F5B mixed the painting's pink neon + brick into the blue) — now the lamps' streaks REPLACE the blue with brass in a thin heart; the
lamps are found WARM + BRIGHT on the day painting's two lamp rows (v 0.155 · 0.345, measured at mip 5: the globes 0.25 – 0.37, the brick
0.06 – 0.16), NIGHT ABOVE's dash method; (b) the SNOW = the foam flecks + static sun specks → gone; a few small glints ride the swell's MOVING
crests and blink; (c) the RIM = the far wall's white foam → by day the water sinks into the wall (a soft darker wet edge), foam round the
pillar only; (d) the BLUE = by the SCREEN's height: deepest at the bottom (#00306e-ish) → ocean blue → a brighter blue at the far edge
(never pale); (e) the ball's wide pale-pink column → a small hot-pink pool + a thin streak. `water\before\` · `water\after3\` ·
`water\beside-f5b.png`.
