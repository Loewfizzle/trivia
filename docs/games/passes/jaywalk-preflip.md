# JAYWALK — BEFORE THE FLIP (Nov 17 2026 · the Beelink · Opus 5.5)

The last game changes owed before THE GO-LIVE PASS (which flips `playable` and changes nothing else). This pass does NOT flip
`playable` and does not touch the boot. The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 17 — DECIDED, BEFORE THE
FLIP)". The bible: `docs/jaywalk.md` "BEFORE THE FLIP". The checklist: `docs/games/passes/jaywalk-golive-checklist.md`.

## THE COMMITS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 99b1b248 | the owner's decisions into plan.md |
| 0 | b2e853b2 | the lab export (no open FIX marks) · the cloud's harbor red that was JAYWALK's: the `vault` group counted 3 JAYWALK cards (H6A added BEAM ME UP + RIGHT OF WAY v2) |
| 2 | be4bffdd | THE LOST CONTEXT — a false report + a real orphan, proven + fixed in WebKit |
| 3 | 4e47f0bd | THE CAMERA + THE TAKES PINNED |
| 1 | 5bf733f4 | THE AREA ARRIVAL — the banner + the approach sign hardened |
| 4 | 18f5555f | THE RUN CARD UPLOADS ONLY ON SHARE |
| add-on | 90bc9807 | the inbox's 6:58 pm (1) ONE BODY OF WATER + (2) THE WHITE FLASHES (found, proven, fixed) |
| add-on | bd15e36e | the inbox's sound items from Grok's sfx5: THE STOPWATCH, THE TRUCK HORN, the new AREA ARRIVAL · THE PER-GAME BUDGET kept |
| add-on | 80df1ee1 | the inbox's 7:21 pm correction: the truck horn alternates with the car horn |

## GROUP 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com`: 224 marks, **no open FIX** (nothing to build).
- The cloud on 14cb411f: `tests` green; `harbor` red in its `audio` job — (a) the `vault` group's card counts were JAYWALK's (61 → 62
  strips, 60 → 61 full cards, 23 → 24 CHANGED rows, 38 → 39 NEED YOU: BEAM ME UP + RIGHT OF WAY's v2 picture) — fixed in the test;
  (b) "THE ROOM IN THE URL: a refresh in the lobby rejoins the room" (the `dock` group) — the city's, not JAYWALK's: left for CITY G.

## GROUP 1 — THE AREA ARRIVAL (the inbox's Nov 17 5:35 pm entry)
- **Why the owner saw no sign by day**: in the REAL game on the emulators (e2e-jaywalk now samples it on a day run through three gates)
  the sign WAS up whole, 9.5 → 4.5 lanes out, at every gate. So the cause is on the phone. Two ways it stays blank there, both closed:
  `writeGate` marked the board drawn BEFORE it got a 2D context (an iPhone over its canvas-memory cap refuses one → a blank sign for
  good), and a 2D canvas iOS wipes was never redrawn. Now: marked drawn only once drawn, redrawn on `onCanvasLost` or when its board's
  pixel reads blank as the sign comes up, redrawn once Orbitron loads. Plus a stronger day board (the paint ×0.72, a heavier keyline —
  the docks' brown board on brown planks), 82 % wide, a small pop-in. NOT proven on the owner's iPhone (the honest part: the cause there
  is the likeliest one, not a seen one).
- **THE ARRIVAL BANNER** (`js/games/jaywalk/arrival.js`, the game + the lab). Shots: `Downloads\NEON\jaywalk-preflip\arrival\`
  (`jaywalk-lab.mjs --preflip` — 26 / 26: 3 areas × day + night × 8 + 5 lanes out + the crossing).

## GROUP 2 — THE LOST CONTEXT + THE CREEP (the inbox's Nov 17 5:55 pm entry)
The verdict: **both**. Before (WebKit, `wk-jaywalk-mem.mjs --leave-only`): 1 "the WebGL context was lost" report on leaving; 3 views
alive after 3 PLAY AGAIN runs; 8 views + 6 lost GL contexts held after 5 leaves. After: 0 reports, no rebuild, ≤ 2 views in a run of
PLAY AGAINs and 1–3 after 5 leaves (a full GC; WebKit's conservative stack scan keeps the last few — the line is 3), JAYWALK's GL contexts + canvases 0, a real loss mid-run rebuilt + reported once.
The creep = the listeners on PLAY AGAIN's kept canvas holding each old view: the tab's process over 10 runs in a row is now FLAT (474 →
466 MB; the review measured 553 → 583). Across leaves the web process swings ± 350 MB with no trend (printed, never asserted).

## GROUP 3 — PIN THE CAMERA + THE SOUNDS
ZOOM 8 · STRAIGHT + the owner's takes for everyone; only the lab (+ its audition) plays a phone's own picks (`sfx.js#useLabPicks`).
`tests/jaywalk-preflip.test.mjs` + e2e-jaywalk with the lab's ZOOM 7 · TURNED + every B take saved on the phone.

## GROUP 4 — THE RUN CARD ONLY ON SHARE
`js/daily/share.js#prepShare` `onTap` (the daily's later share reuses it). THE CHOICE (named): no shared kit pattern existed for a share
after an upload's await, so the console's SHARE does the two-step itself — a spent tap (`navigator.userActivation.isActive` false, else
> 1 s) → `'ready'` → the link reads SHARE again, lit with one pulse; the next tap shares inside its own gesture. A live tap shares at
once. Never a pill. e2e-jaywalk: 4.5 s on the end screen → 0 uploads; SHARE (a spent tap) → 1 upload, the link after one more tap; a
second SHARE → the same link, no upload. e2e-jaywalk-match: four podiums, one SHARE → 1 run card.

## THE INBOX's ADD-ONS (Nov 17 6:58, 7:00, 7:20, 7:21 pm — built as the last groups, before the review)
- ONE BODY OF WATER — shots `Downloads\NEON\jaywalk-preflip\water\`.
- THE WHITE FLASHES BY DAY — FOUND: a tier step resized (cleared) the 3D canvas after the frame's draw → one frame of the stage's pale
  day sky. Proven with `jaywalk-lab.mjs --preflip=flash` (17 flashes old → 0 new over 32 steps); the frame:
  `Downloads\NEON\jaywalk-preflip\flash\before-the-fix\`.
- THE STOPWATCH (3.5 lanes — my call, measured: 8 % of a moving run vs 24 % at 4.5), THE TRUCK HORN (alternating, the car horn's
  loudness), THE AREA ARRIVAL = "Success". The levels: `jaywalk-mix.mjs` (23 cues, none clips).

## THE SIZE BUDGET
2,459 KB of 2,450 after the pass's code → full-line comments stripped from `night.js` + `night-fx.js` (−17.9 KB). Never raised.

## GROUP 5 — THE FRESH-EYES REVIEW
ONE reviewer subagent, a fresh context, read-only, given THE QUALITY BAR, STEP 0's decisions and `Downloads\NEON\jaywalk-preflip\`
(arrival/ 18 · water/ 4 · game/ — the real game at @3 · flash/before-the-fix/ for context). Its report, verbatim:

> VERDICT
> Most of this pass meets the bar. The arrival work is the strongest part. The approach sign and the arrival banner both read at once at 390 wide, by day and by night. The night neon frames (white, amber, pink) are clean. The day painted boards (brown wood, maroon) match the painted skyline and have solid text contrast (white with a dark outline on brown or maroon). Neither sign is a pill. The banner sits in the skyline band and never touches a lane. Water lanes side by side read as one river in all four water shots, with foam only at the outer banks. Nothing looks placeholder. The real problems are small and mostly around the edges: how the in-world line text sits under traffic, the contrast of the share card's headline, one rebuilt-context frame that looks empty, and an alignment mismatch on the end screen. Nothing I saw blocks the flip.
>
> REAL PROBLEMS
>
> 1. lost-context-rebuilt.png: MEDIUM-HIGH (could be a mid-fade frame). The top third of the playfield, from the sea wall down to about y=760 of 2000, is a flat empty dark-purple void: no lanes, no scenery. The "LIAM · 7" line and a truck below it are dimmed as if seen through fog. Compare line-friend-coming.png at the same lane 2, where that area shows water, logs and a road. If this is the settled rebuilt state, the far lanes did not come back, and the player loses look-ahead.
>
> 2. line-best-coming.png, line-best-crossed.png, line-friend-coming.png, run-start.png: MEDIUM. The words on the friend and best lines lie flat on a road lane, and passing vehicles cover parts of them. In line-best-coming the pink truck cab hides the "·" in "YOUR BEST · 10" and a cab overlaps the "Y". In line-best-crossed a red van sits across "T · 10". In run-start a purple car crosses "LIAM · 7". That conflicts with the standing rule that a line's words draw above everything except your own kid, and it costs readability at a glance.
>
> 3. share-card-solo.png and share-link-solo-540.png: MEDIUM. The headline "RUN DOWN BY A VAN" is pale pink-white over the light-blue river, the logs and pale grass. That is well under 4.5:1, and only the glow separates it. At the 540 link-preview size, the headline (the most important line) is the weakest text on the card. It needs a dark scrim or band behind it. "10 LANES" over mid-green grass is marginal for the same reason.
>
> 4. end-before-share.png, end-day.png, end-new-best.png, run-day.png: MEDIUM. On the YOUR TABLE slim cards, HOPPER's name is left-aligned next to the shield, but LIAM's name is right-aligned inside its plate. The dark inner plates also differ: HOPPER's has a stepped notch, LIAM's is a plain rectangle. Two rows of the same list look inconsistent. If this comes from a deliberate card-layout rule, ignore it; otherwise it reads as a bug.
>
> 5. Approach sign, all 12 `a-*` shots, plus water/night-3 and day-3 (THE FISH MARKET): LOW-MEDIUM. The board sits over the farthest visible lane and hides the vehicles in it; car roofs peek out under the board in docks-8, downtown-8 and downtown-5. It is about 9 to 10 lanes ahead, never the next lane, so it is not a safety issue. It does remove one lane of planning view for about 6 hops.
>
> 6. Arrival banner in the lab shots, arrival/*-c-the-crossing.png: LOW. "ENDLESS" sits only a few pixels above the banner's top edge and over busy skyline. In night-1-docks-c, the crane's light strip runs straight through "ESS". By day, the thin white "ENDLESS" over painted buildings is marginal everywhere. The real game (areas-rail-yard-run.png) has no ENDLESS label and the banner sits higher, so this may only affect the lab.
>
> 7. Every 3-digit lab shot starting with "1" (night and day, 142, 145, 150): LOW. A tiny stray pink dot sits just below and left of the leading "1" of the counter, around x=330, y=163 on the 924-wide view. It looks like an artifact.
>
> 8. areas-rail-yard-run.png: LOW. A faint olive or green ring sits on the ground just below the kid's cyan ring, around x=460, y=1290. It looks like a leftover marker. The black rail-signal heads at about x=300 and x=620 also stand in play columns beside the barrels and could be mistaken for obstacles. They may be straddling the lane line by design; worth a check.
>
> 9. water/day-2-water-lanes.png and arrival/day-5-downtown-a-8-lanes-out.png: LOW, unconfirmed. At the downscaled view I see possibly a faint lighter streak where the two water lanes meet (around y=1020 and y=1110 on the 924-wide view). There is no foam line or colour step. Worth checking once at full resolution; otherwise ONE BODY OF WATER passes.
>
> 10. Tall trucks and vans in the road lane just below a water lane cover the water's bottom bank because of the perspective: night-5-downtown-c, day-5-downtown-c and day-1-docks-a-8. LOW. This is not new and is part of the 3D look, but it briefly blurs where the water ends.
>
> 11. owner-shelf.png versus owner-card.png: LOW, owner-only. The shelf row "JAYWALK · TEST" says only "2–8", while the other rows say "solo · 2–8 · ≈ N min" and the JAYWALK card says "SOLO · 2–8 PLAYERS · ABOUT 3 MIN". The "TEST SLOT" chip is a capsule, but it is a dev-only label. The PLAY NOW and PLAY WITH FRIENDS capsule buttons are the existing shell's button style, not new.
>
> PILLS: none new in this pass's elements. Both signs are rectangles: the approach sign has an arched top, the banner has softly rounded corners.
> CONTRAST: clean on every HUD and end-screen element I checked. The failures are the share card's headline (item 3) and, in the lab only, "ENDLESS" by day (item 6).
> COVERS A LANE: the arrival banner, never. The approach sign covers only the far lane (item 5).
>
> TASTE SUGGESTIONS (not defects)
> - In the share card's picture the kid is almost completely hidden under the pink van; only an arm shows. Cropping a moment earlier, or framing the kid in front, would put the hero in the shot.
> - The slashed zero in the share card's "10" and the in-world "YOUR BEST · 10" differs from the plain "10" on the end screen. Pick one.
> - In the in-world line font, the "7" in "LIAM · 7" reads like a hook glyph at phone size.
> - In arrival/*-3-rail-yard-c-the-crossing.png, the frame right after crossing into THE RAIL YARD shows no rails at all. The real game's shot at lane 156 does show them. A track in the first lane or two after the gate would make the name land.
> - game/run-day.png is actually an end-screen frame, so I could not judge an in-run day HUD from it. areas-rail-yard-run.png covers that and looks good.
>
> Shots reviewed: all 18 in C:\Users\benja\Downloads\NEON\jaywalk-preflip\arrival\, all 4 in C:\Users\benja\Downloads\NEON\jaywalk-preflip\water\, and in C:\Users\benja\Downloads\NEON\jaywalk-preflip\game\: run-start, run-hops, run-day, areas-rail-yard-run, line-friend-coming, line-best-coming, line-best-crossed, lost-context-rebuilt, end-before-share, end-day, end-new-best, share-card-solo, share-link-solo-540, owner-card and owner-shelf. Not opened: end-share-ready (its SHARE colour is already fixed), line-friend-crossed, and the flash context shots.

### What was done with each finding
- **The shot it was told about** — end-share-ready: the "ready" SHARE looked identical to a normal one → FIXED before the review
  (57be89c3: lit in the game's accent + its icon).
- **1 · 2 — PRE-EXISTING** (CITY F's own `Downloads\NEON\city-f\e2e\jaywalk\lost-context-rebuilt.png` shows the same empty far band and
  the same truck over "LIAM · 7"); this pass changed neither. **OPEN for the go-live / the next JAYWALK pass**: (1) after a REAL lost
  context the rebuilt scene's far lanes stay dark in the e2e's frame (a real loss is rare; look-ahead matters); (2) the line labels
  (renderOrder 5, depthTest off) still lose to vehicles in places — the H5C rule "a line's words draw above everything but your own kid".
- **3 — PRE-EXISTING (H4B's card, the owner's design)** → OPEN FOR BEN: a dark band behind the cause line on the run card?
- **4 — the console's slim cards** (`ui/strip-board.js` / THE CARD LAYOUT RULE — a card's name follows its own hero spot): not
  JAYWALK's; named for the city chat if it is not the rule.
- **5 — BY DESIGN** (the owner, H6B: the sign hangs over the far haze, gone 3 lanes out); this pass widened it 74 → 82 % for the day's
  readability — the far lane it covers is the same one.
- **6 — FIXED** (the lab only: its banner 8 px lower, clear of the lab's ENDLESS line).
- **7 · 8 · 10 · 11 — PRE-EXISTING, LOW** (the numerals' 1-foot, the kid's own pool ring + the rail signals in the edge columns by
  design, the 3D perspective, the owner-only TEST row) — left.
- **9 — CHECKED at full resolution**: no seam (the light marks are the specks + the logs' rims). ONE BODY OF WATER passes.
- Taste: left for the owner.

## GROUP 6 — THE CHECKS (my own emulators + `scripts/serve.mjs --emu`, NEVER THE LIVE SITE; one at a time, nothing else busy)
| check | result |
| --- | --- |
| unit (`node --test tests/*.test.mjs`) | **2,205 / 0** |
| rules (`rules.test.mjs`) · `/api` (`server.test.mjs`) | **85 / 0 · 66 / 0** (run after the browser E2Es — the known false-red order) |
| smoke (`e2e-smoke.mjs` — THE PAGES LOAD) | **errors none** |
| e2e-jaywalk (@3 — the review's game shots) | **90 / 90** — the arrival banner at every crossing, the day sign sampled, the pinned camera + takes, the run card only on SHARE |
| e2e-jaywalk-match · `--four` | **87 / 87 · 88 / 88** — four podiums, one SHARE → one run card |
| the lab check · `--perf` | **108 / 108** · 60 fps at every tier, 1× + 4× CPU (tier 2 @3 4×: 59.9, p95 16.8 ms); THE AUTOMATIC STEP 2 → 1 → 2 → 1 → 0 at 12× |
| `--preflip` · `--preflip=water` · `--preflip=flash` | **26 / 26 · 1 / 1 · 2 / 2** (0 flashes in 32 tier steps) |
| `jaywalk-mix.mjs` | **23 cues, none clips** |
| `wk-jaywalk-mem.mjs` (WebKit: 10 runs + THE LEAVE + a 4-phone match) | **49 / 49** — solo final 7.6 MB, match 10 MB (budget 20); the tab's process 488 → 494 MB over 10 runs |
| harbor `cartridge` + `trivision` | green · `vault`: the card counts green (Group 0's fix); **2 reds: the 4×-CPU frame time of the city's 8-legendary lobby page** (p95 33.3 ms) — reproduced alone on this machine, a page this pass does not touch; green in the cloud's run of 14cb411f |
| registration · cartridge · achievements | in the unit suite — green |
| `wk-press` / `e2e-daily` | not run (the dailies' known red is in the inbox since the go-live review; nothing here touches the dailies' screens) |

## OPEN FOR BEN
1. **NOT proven on your iPhone**: the day sign (the likeliest phone-side cause is closed — a refused / wiped 2D canvas; in the game on the
   emulators it was always up), the white flashes (proven by firing tier steps the way a slipping phone does — your phone's own steps
   are the test), the memory (WebKit flat; no desktop gives a phone's number). Play by DAY through two gates and a few minutes.
2. **YOUR EAR**: nobody here listened — THE STOPWATCH (it starts when the dark is within 3.5 lanes — my call: 8 % of a moving run; 4.5
   would be 24 %), the truck horn alternating with the car horn, "Success" at the crossing.
3. **THE SHARE CARD's headline** (the reviewer's #3, H4B's design): pale cause words over the bright river at link-preview size — a dark
   band behind the line?
4. For the NEXT JAYWALK pass / the go-live (pre-existing, the reviewer's #1 + #2): after a REAL lost context the rebuilt scene's far lanes
   stay dark in the e2e's frame; the lines' words still lose to a vehicle in places (the H5C rule).
5. For the city chat: the reviewer's #4 (YOUR TABLE's two slim cards align their names differently — the card layout rule, or a bug?);
   CITY G: the cloud's `dock` red "THE ROOM IN THE URL" on 14cb411f; the `vault` 4×-CPU lobby frame time on the Beelink.
6. **RE-PUBLISH**: nothing new from this pass — `database.rules.json` is unchanged; the go-live review's re-publish is still owed.

## CAN THE GO-LIVE PASS START? (the checklist's section 0)
Ticked now: the city's 1–5 (CITY F), PIN THE CAMERA, THE RUN CARD's STORAGE, the 8-phone measure + the queued proof (CITY F), THE LOST
CONTEXT + THE CREEP (this pass). Still open — all the owner's: re-publish `database.rules.json` (the review's rule), play this build by
day + night (the ear, the sign, /admin with no `killed` row on game:jaywalk/final), answer the review's + this pass's OPEN FOR BEN.
THE BOARD's JAYWALK tab is a step of the go-live pass itself. Once those are done, yes.
