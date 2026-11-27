# FREEFALL — PASS F5C: F5B's LEFTOVERS + THE MATCH PIECES + HOW TO PLAY + THE MIX + CREDITS (Nov 27 2026)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F5C (approved Nov 27)". FREEFALL stays HIDDEN (`playable` false), THE SWITCH
stays OFF. Shots: `Downloads\NEON\freefall-f5c\` (end\, water\, mark\, match\, howto\).

## THE GROUPS

| group | commit | what |
| --- | --- | --- |
| Step 0 | 6f9f1edc | the decisions in docs/games/plan.md (+ the lab export: no open FIX marks; the inbox: nothing addressed to F5C) |
| 0 — F5B's LEFTOVERS | 8a7ae3a4 | the logo always · YOUR BEST n · AVG n · ☐ FRIENDS ONLY · the name on the test page's card · night under · day above · the day mark · the solo E2E's cause |
| 1 — THE MATCH PIECES | 9fc654fe | THE TIE-BREAK + its sims · the edge markers · RIVAL OUT · LAST ONE STANDING |
| 2 + 3 — HOW TO PLAY · THE MIX + CREDITS | 98bc6c92 | RULES.freefall · the gains against JAYWALK's + the music's duck · the credits group |
| the review's fixes | 846b75ba | see THE FRESH-EYES REVIEW |
| the close | (the tagged commit) | a SHARED 3rd place in the block (the 8-phone E2E) · the final run · this log |

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

## GROUP 2 — HOW TO PLAY
`ui/help.js#RULES.freefall` (+ its drawings, JAYWALK's shape: one line, short lines ≤ 52, one drawing each) — through the site's ONE lazy
opener (`ui/help-open.js`; ☰ → How to play in a game asks for the game on screen). HOW TO FALL: DRAG TO SPIN · a GAP = a fall · RED =
OUT · 3 FLOORS CLEAN = THE BLAZE · it smashes the next floor, even red · the arrow keys. HOW IT ENDS: DON'T STALL — THE LIGHTS GO OUT · a
MATCH: the same tower, the deepest wins · THE BOTTOM (floor 200) or 3:00 · SOLO never ends, leaving the app PAUSES it · 3 PAUSES a run (a
match never pauses). Its tab shows where FREEFALL is open (a hidden game's tab only there); `registration.test.mjs`'s FREEFALL_WAITS lost
`help`. Shots: `howto\a1\` (`shots.mjs --preview --scenes ff-help,ff-help-day,ff-help-end` — night + day, 375 × 667 + 390 × 844).

## GROUP 3 — THE MIX + CREDITS
**THE MIX** — every FREEFALL + JAYWALK file DECODED in Chromium (WebAudio — the Beelink has no ffmpeg), its loudest 300 ms (RMS, dBFS) +
its gain = how loud it plays (both games: the same limiter + trim → the console's SFX bus):

| sound | before (gain → as played) | after | JAYWALK's reference |
| --- | --- | --- | --- |
| bounce | 0.5 → −18.3 | kept (stays SOFT) | hop −11.2 (a 40 ms tick) |
| whoosh | 0.34 → −30.0 | 0.42 → −28.2 | — |
| blaze · shatter | −13.6 · −16.3 | kept | — |
| crash · lights-out | −12.4 · −14.3 | kept | hit −10.8 |
| bottom | 0.9 → −15.7 | 1.1 → −14.0 | — |
| area-arrive · new-best (JAYWALK's files) | 1.0 → −15.3 · 1.15 → −18.7 | 1.25 → −13.3 · 1.45 → −16.7 | = JAYWALK's own |
| skylight · splashdown | −13.7 · −12.5 | kept | — |
| fireworks | −24.8 | kept (soft, on purpose) | — |
| out-drop (new) | — | 0.8 → −17.9 | 0.28 → −27.1 (lost under FREEFALL's bounces) |
| last-standing (new) | — | 1.1 → −16.3 | 0.6 → −21.5 |

**THE DUCK** (JAYWALK's flyers.js#DUCK way): the console's music to 0.5 of its level (in 0.25 s, out 0.9 s) under the big moments —
`sounds.js#DUCK_MS`: crash 1.3 s · lights-out 1.8 s · skylight 1.8 s · splashdown 2.3 s · bottom 2.4 s · last-standing 1.8 s (one window;
a later moment only stretches it; always released at a restart + when the stage goes). The cartridge's driver applies it (`view.js` —
`audio/music.js#duckMusic`, the level found put back); the test page has no music. `tests/freefall-mix.test.mjs`.
**CREDITS** — `js/ui/credits.js` group FREEFALL: the ten sounds' Freesound / Kenney authors, JAYWALK's shared four (→ the JAYWALK group),
the Particle Pack (Kenney, eleven sprites), Ground 055 S (ambientCG), the art made for NEON SPEAKEASY with Grok. **Not credited (unused):**
3DTextures Water 001 (its normal map left the game in F5A), the billboard (not installed), the roof's grain (made in code). The group
shows only where FREEFALL is playable (`isPlayable` — the owner's phone now, everyone at the go-live): the public sheet never names a hidden game.

## THE FRESH-EYES REVIEW (a separate reviewer, cold, at phone size — Groups 0–2)
| # | item | verdict | what was done |
| --- | --- | --- | --- |
| 1 | the end screens | FAIL — MORE BELOW at 375 × 667 in the NEW BEST cases; NEW BEST ≠ the run; two AVGs disagree | the MORE BELOW shots were `after1` — taken BEFORE the short-screen fix (0 px over after it): re-shot `end\after2\` — nothing scrolls in any case at 375 · 390 · 430. The numbers were the LOOK PREVIEW's fixture (a made-up NEW BEST 141 on a 140 run): the fixture now answers this run's floors + the board row's own AVG. (In the app both AVGs come from the server's stored average; the preview's match rows have no profile mirror → "AVG —" there.) |
| 2 | day water (119) | PARTIAL — a big step up (amber streaks, few glints, no rim, saturated blue); still "code water": even same-length dashes, hairlines, a lavender blob under the floor, the bottom not deep enough | each lamp's streak its own length / strength / rhythm (a dice of its column) · the ripple hairlines gone by day · the bottom deeper (`water\after4\`). The soft pink-violet glow under the floor is the BALL's own bloom (every area), not the water. **Verdict: better, not premium** → the Grok brief (OPEN FOR BEN 2) |
| 3 | night under (121 / 125) | PASS (nit: the net a bit dense behind the tower) | kept |
| 4 | the mark by day | PASS | — (the reviewer: PRISM's + HOLD'EM's marks also wash out on the pale band — not FREEFALL's) |
| 5 | the edge markers | PARTIAL — orange over red floors weak; three stacked on one side | a full 2 px dark stroke · at most 2 lines a side (the nearest) (`match\after2\`) |
| 6 | the match moments | PARTIAL — the card PASS; "MIA IS OUT" small + on top of the markers | the callout 21 – 26 px with the 2 px stroke, lifted to 60 % of the screen (`match\after2\`) |
| 7 | HOW TO PLAY | PARTIAL — 11 rows, scrolls at 375 + 390 | 9 rows (the KEYBOARD row cut, the pause rows one), a one-line goal: whole at 390 × 844; at 375 × 667 the sheet scrolls about a line (the shared sheet does — as JAYWALK's) (`howto\a2\`) |

## THE FINAL RUN (local, the Beelink)
- Unit: 2,833 / 2,833 (`node --test tests/*.test.mjs`). THE BOOT: 188 B left (6500 KB, never raised — 83 B before this pass).
- FREEFALL: the test page 172 / 172 · `--water` 8 / 8 · the share cards 255 / 255 · solo 64 / 64 · match 109 / 109 (the first run 108 / 109 →
  a real find: a player SHARING the 3rd place but 4th in the list got a "YOU · 3RD" line — `ui/end-board.js#pickRows` now puts them in their
  place's last slot, a unit case + the E2E's check say so).
- The other games (shared end-screen code + the help + the credits changed): JAYWALK 122 / 122 · HIGH RISE 114 / 114 · PRISM DROP 67 / 67 ·
  OVERCLOCK 69 / 69 (`e2e-oc-new`, N=4) · HOLD'EM 24 / 24 · smoke 28 / 28 (THE PAGES LOAD).
- `/api` 76 / 78 — the SAME two JAYWALK reds F5B logged as pre-existing (`H6A` match report · THE PROOF PASS verified solo). Rules 101 / 106
  on fresh emulators: five JAYWALK / HIGH RISE proof-node cases answer PERMISSION_DENIED — **not this pass**: `rules.test.mjs` reads only
  itself + `database.rules.json`, both byte-identical to F5B's commit (106 / 106 this morning) → time-bound, like the two `/api` ones
  (OPEN FOR BEN 7). Every server this pass started was stopped at its end.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules-file change; FREEFALL hidden, THE SWITCH off).
2. **THE DAY WATER (floor 119) — the last code try is in, and it is better but NOT premium.** Fixed: the lavender (it was warm light
   ADDED onto blue — the lamp streaks now replace the blue with brass), the snow (gone — a few glints ride the moving crests), the ice-rink
   rim (the water sinks into the wall), the grey blue (ocean blue, deepest at the bottom). The fresh-eyes reviewer still read "code water"
   (soft streak columns, a pattern). Per your Step 0 rule the next step is a texture, not more code — **THE GROK BRIEF:**
   > *FREEFALL — one CC0 stylised water texture for a closed shaft's water surface seen from just above (the camera looks down at ~35°).*
   > **Deliver:** ONE seamless, tileable **water NORMAL map** (2048 × 2048 PNG, OpenGL / +Y green) of gentle, ROUNDED swell — stylised
   > game water (think a premium mobile game's pool / harbour, not photoreal ocean, not choppy): broad soft ripples 6–12 across the tile,
   > no foam, no whitecaps, no tiny noise (it must read at phone size, 390 pt wide), AND its matching **height map** (16-bit greyscale) —
   > the height lets the game place glints on the crests. **Licence: CC0 1.0** (public domain) — a source page that states CC0, its URL +
   > the author in `notes.txt` (ambientCG / Poly Haven / 3DTextures / Kenney are fine; no CC BY, no "free for personal use").
   > **Backup:** one more of the same, a little busier (12–20 ripples across). Put both in `Downloads\grok\freefall\water2\` with `notes.txt`.
   > (The game draws the colour itself — ocean blue + the speakeasy's brass lamp streaks — so NO colour map is needed.)
3. **THE SOLO E2E's "fixed seed":** the cartridge's seed IS the proof's (hash(code + match + the server's GO)) — a fixed one would be
   refused by the judge. The cause is made certain instead: the test turns onto the red only on a floor the run's own tower says HAS red
   (F5B's failure: a red-free floor — the bot bounced there until the darkness took it). The match E2E's own scripted red is unchanged.
4. **THE CREDITS** show FREEFALL's group only where FREEFALL is playable (your phone now, everyone at the go-live) — the public sheet never
   names a hidden game. Say if you want it public now.
5. **Named calls, yours to overrule:** LAST ONE STANDING also fires when a rival FINISHED at the bottom and you're still falling (you're then
   behind: "N FLOORS TO THE LEAD") · RIVAL OUT never for a finish / time's up · the edge markers flip sides only past ±0.2 (no flicker),
   2 lines a side · the music ducks to 0.5 under the outs, the breakthroughs, the bottom + LAST ONE STANDING (not under THE BLAZE or a NEW
   BEST) · HOW TO PLAY drops the KEYBOARD line (the arrows still spin) · the test page's AVG is always "—" (it counts nothing) · the mark's
   day outline (#f0453c) shows only on a pale ground (the marks preview; the city's day sign can use it at go-live) · the whoosh +2 dB, the
   bottom +1.5 dB, the shared arrival + NEW BEST at JAYWALK's own gains.
6. **Not FREEFALL's (seen in passing):** PRISM DROP's + HOLD'EM's marks also wash out on a pale ground (the reviewer).
7. **Rules 101 / 106 + `/api` 76 / 78 on the emulators — not FREEFALL's, time-bound:** the rules test + the rules file are byte-identical to
   F5B's commit (106 / 106 this morning); the five failing are JAYWALK / HIGH RISE proof-node cases (PERMISSION_DENIED on a write — the
   rules' server-time windows), the two `/api` ones F5B already sent to the JAYWALK chat. The next JAYWALK / HIGH RISE pass should look.
