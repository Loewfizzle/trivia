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

## GROUP 1 — THE MATCH PIECES
1. **THE TIE-BREAK** (`logic.js#rankCompare` + `standings` — the ONE ranking the podium (`index.js#finalRanks`), the server's report
   (`core/match-report.js` → `api/_lib/freefall.js`'s rows), the calls (`match.js#scoreCalls`) + the night all read): floors → the earlier tick
   that final floor was reached → MORE BLAZES (the rows' `bl`, the judge's own count — host + server alike) → a DRAW (a shared place). Nothing
   new is written: every row already carried `bl`. **The sims** (2,000 rooms of bots each — a scratch script over `matchsim.js#botRun`):

   | players | pairs on the same floor | settled by the tick | by the blazes | a draw | first place shared on floors → by the tick / blazes / draw |
   | --- | --- | --- | --- | --- | --- |
   | 2 | 29 of 2,000 (1.5 %) | 29 | 0 | 0 | 29 → 29 / 0 / 0 |
   | 4 | 214 of 12,000 (1.8 %) | 212 | 2 | 0 | 58 → 58 / 0 / 0 |
   | 8 | 2,400 of 56,000 (4.3 %) | 2,293 | 80 | 27 | 1,184 → 1,125 / 48 / 11 |

   (8 bots: most of the floor ties are the runs that reach THE BOTTOM — 200 each, the tick splits them.)
2. **THE EDGE MARKERS** — each "MIA ↓12" is ONE line, 17 px, in the player's OWN colour (a dark outline), at the screen's EDGE on the side of
   the tower the rival really is (the stage reads the ghost's x = RB · sin φ; a flip only past ±0.2 so a rival in front never flickers; the
   DOM is touched only at a flip): below → the lower band, above → the upper band, left edge or right (beside the rail). `match\markers1\`.
3. **RIVAL OUT** — a rival's run ends OUT (red / the dark — never a finish, never time's up, never mine) → JAYWALK's `out-drop.mp3`
   (referenced: `sounds.js` dir `jaywalk`) + "MIA IS OUT" in their colour for 1.5 s, low in the middle (clear of the number, the banners, the
   ball), two lines at most (a third waits). None in the first 2 s of a run (a rejoin's catch-up replays old outs). `match\moments2\`.
4. **LAST ONE STANDING** — 3+ players, every rival over, me still falling → once a match: JAYWALK's card (its type + gold glow, a soft dark
   ground under it over the busy floors) + `last-standing.mp3` (referenced): "+23 FLOORS AHEAD · KEEP FALLING" · "12 FLOORS TO THE LEAD ·
   KEEP FALLING" · level: "LEVEL WITH THE LEAD · KEEP FALLING" (`ghosts.js#lastStanding` + `lastWords`, PURE).
