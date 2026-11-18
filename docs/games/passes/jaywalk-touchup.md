# JAYWALK — THE TOUCH-UP PASS (Nov 18 2026 — on the Beelink; the owner's calls on THE POLISH PASS's OPEN FOR BEN)

The owner's decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 18 — DECIDED, THE TOUCH-UP PASS)". The detail: `docs/jaywalk.md`
"THE TOUCH-UP PASS". JAYWALK is LIVE: views only; REPLAY = LIVE untouched; **no rules change** (nothing to re-publish).

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 55009e95 | the owner's calls in `docs/games/plan.md` |
| 0 — THE START | — | `lab-export.mjs https://www.neonspeakeasy.com`: 224 marks, **no FIX on any card**. The cloud of c3632cc1: `tests` green, `harbor` skipped (a ci-tagged push) — nothing red of JAYWALK's. The inbox: no entry for this pass |
| 1 — THE SHARE PICTURE SHOWS THE KID | d2381314 | the frame per cause (`shot.js#shotMs`), every cause framed alike on the card |
| 2 — THREE READABILITY FIXES | 72834e6d | the words' thick dark edge · your row glows · the day title's dark fade |
| 3 — THE FRESH-EYES REVIEW | (this pass's close) | the train / Blackbird / UFO moments re-picked from the review |

## HOW THE MOMENTS WERE CHOSEN
`jaywalk-lab.mjs --touchup=probe` drives each end in the lab (a car, a train, the water, the blackout / the fog, the Blackbird, the UFO, the
Mothership) by night + by day and grabs the game's own frame (night.js#snap) at a row of moments after the hit — the grab armed IN the page
on the frame the run ends (a 100 ms poll had made the early frames late). The sheets: `Downloads\NEON\jaywalk-touchup\probe\`. Then
`--touchup=kid` renders each cause's real card at `shotMs` (+ a far lane's box truck): `kid\` (1080 × 1350 · 540 × 675 · the preview sheets).

| cause | before | now | why |
| --- | --- | --- | --- |
| water | 460 (he had sunk at 380) | 140 | mid-splash, head + arms up |
| the edge | 460 | 400 | carried 260, then the same |
| the blackout / the fog | 460 (swallowed by 420) | 40 | the wall at him |
| the train | 460 (off the frame by 260) | 200 | flung clear, his face seen |
| the Blackbird | 460 | 60 | the jet + its afterburners + him in one frame |
| the UFO | 745 | 1000 | high in the beam, under the saucer's rim |
| the Mothership | 1564 | 1500 | rising in its beam |
| a vehicle | 460 | 460 if it has passed him by then, else 70 (the impact) | a van / truck covers him for up to a second |

## THE CHECKS (fresh emulators + `serve.mjs --emu`; NEVER THE LIVE SITE)
One after another, nothing else busy: smoke (THE PAGES LOAD) 21/21 · e2e-jaywalk 98/98 (+ YOUR ROW GLOWS 4th / 1st / 3rd × night + day, the
day title's fade) · e2e-jaywalk-match 88/88 (3 phones — its FIRST run went 79/88, failures not captured; the re-run on the same emulators
green) + 89/89 (`--four`) · the lab check 103/103 + `--perf` 127/127 · the lab's `--touchup` (kid 16/16 + words 4/4) · rules 85/85 · /api
66/66 · share-card 2/2 · unit 2,209/2,209 (THE BOOT BUDGET · THE PER-GAME BUDGET · CLAUDE.md size · the docs' links · file hashes).
**wk-jaywalk-mem 47/48** — THE LEAVE "10 runs in a row (PLAY AGAIN)": 4, then 7 JAYWALK views alive after a full GC (≤ 3). NOT this
pass's: the SAME check on c3632cc1 (THE POLISH PASS's own close, 48/48 then) from a worktree on :5174, the same emulators, today: 7 too.
The leave case alone (`--leave-only`): 1 alive, 28/28. → OPEN FOR BEN / the next JAYWALK pass.
THE BOOT: no boot file changed (budget green, untouched) · JAYWALK's size: 2,449 of its 2,450 KB (budget untouched — view.js's comments
condensed to make room for shot.js). Rules unchanged — nothing to re-publish.

## THE FRESH-EYES REVIEW (a reviewer with a fresh context, read-only; the shots: `Downloads\NEON\jaywalk-touchup\`) — its report, verbatim
> FRESH-EYES REVIEW: THE JAYWALK TOUCH-UP SHOTS
>
> GOALS
> 1. The share picture always shows the kid: PARTLY met. The kid is in every one of the 16 cards, which is a real step up. He reads clearly as a kid only in car, car-far, wall/fog and ship (night + day). In train, blackbird and ufo he is there but does not read as a kid (see weak points 1–3). In water he is pushed to the left edge. Files: kid\*-540x675.png, preview-night/day-390x844.png, game\share-card-solo.png (the real E2E card is good: flattened at the van's nose, centred).
> 2. Pink and gold words outlined: MET for the outline. LIAM and YOUR BEST now carry a solid dark edge and read over the yellow taxi and the day grass (words\day-/night-pink-over-a-taxi.png against words-before\). But see weak point 4: the friend's number is now hidden.
> 3. Your own row glows: MET. There is a thin cyan ring with a soft glow, rounded corners (not a pill), and the grid does not move in 1st, 3rd or 4th place, night or day (game\touchup-table-*-390.png, table-360.png, table-1440.png).
> 4. Day title on a dark fade: MET. JAYWALK · SOLO and RUN DOWN BY A VAN read cleanly over the bright harbour sky (game\touchup-end-day-390.png, run-day.png). Night is unchanged (touchup-end-night-390.png).
>
> WEAK POINTS, MOST SERIOUS FIRST
> 1. Blackbird cards: the kid is an unreadable jumble, and the cause cannot be seen. In kid\night-/day-blackbird-*.png the kid at 460 ms is a large, tumbling clump of cyan, tan and pink blocks. It sits at the lower left, nearly touching the top of "231". The jet itself is gone. probe\night-blackbird.png shows that 20–50 ms has the jet, its afterburner and the kid in one frame. That is a far better story, though the white shockwave partly covers him. Try about 50 ms, or a later frame where his face shows.
> 2. UFO cards: no UFO, and a washed-out kid. In kid\night-ufo-1080x1350.png he is an overexposed white-cyan blob inside the ring. By day (day-ufo-540x675.png) he is faint and see-through. The saucer is cropped out above the picture, so the card shows only a green ring. A half-transparent grey box (the white truck, faded) sits behind the ring and over the "126", and it looks like a glitch. probe\day-ufo.png and night-ufo.png show that 20–120 ms (a solid kid, saucer above) or about 1000 ms (kid in the beam under the saucer) both tell the story. Either change the moment or frame higher so the saucer is in the shot.
> 3. Train cards: the kid is merged into the carriage. In kid\night-/day-train-1080x1350.png at 130 ms his sprite is drawn over a carriage roof as a tan and cyan tangle that is hard to read. It hangs low and right, against the "0" of 120. A stray grey and white slab sits under the train, behind "120 LANES", and reads as debris or a glitch. In probe\day-train.png, 20–50 ms shows the locomotive nose hitting him. 260 ms shows him flung clear with his face visible. Both read better than 130.
> 4. The friend's number is hidden in the game. In words\night-/day-pink-over-a-taxi.png the MAXIMILIANOS ghost tag sits right on top of "· 7", so the line reads only "LIAM ·". The before shots had the same clash on YOUR BEST's "143". Your own kid also covers the E, so the gold line reads "YOUR B_ST". The tags and line words need to avoid each other (nudge the tag, or keep the number clear).
> 5. Water: the kid is not centred. In kid\day-water-1080x1350.png and night-water he is at about 15% from the left edge, with empty grass filling the middle. Vertical centring works, but horizontal does not here. A sideways shift (or framing on his point) would fix it. His head is a plain cyan block from above, so he reads as an "ice cube with arms" more than a swimmer.
> 6. Wall by night and fog by day: muddy foot. In kid\night-wall-1080x1350.png the lower half is a flat black slab, with a faint rectangular edge at about y 820 that looks like a banding or rendering seam. In day-wall-540x675.png the white fog fades into grey-black under the number, so the fog looks dirty rather than white. The kid himself reads well in both.
> 7. Car impact: the meshes overlap. In kid\day-car-1080x1350.png and night-car the van's nose goes inside the flattened kid. It reads, but it looks like clipping. probe\night-car.png shows 1300 ms, the kid flat behind the van once it has passed, which is cleaner.
> 8. Table at desktop width (1440×900, game\table-1440.png): the glow ring (about 495–945) is narrower than the PERSONAL BEST row and PLAY AGAIN (457–983), so the column edges don't line up. A 1 px vertical seam runs down the right side of the column at about x 980, from the top to around y 760.
> 9. Small spacing: at 360 and 390 the ring sits only about 3–4 CSS px from the row above (table-360.png, touchup-table-4-day-390.png). By 1st place it nearly touches the YOUR TABLE label (touchup-table-1-night-390.png). That is fine, but tight.
> 10. Small consistency point: the Mothership card's kicker reads "JAYWALK" while every other card reads "JAYWALK · SOLO" (kid\*-ship-*.png). If that is on purpose (a finish, not a death), ignore it.
>
> NO ISSUES FOUND
> - Car and box-truck cards in both looks: the kid is flattened at the nose and clearly cyan. The pink truck cab reads.
> - Ship cards: the best of the set, with his face, arms and glow. He is centred and clear of both text blocks.
> - Wall/fog: the kid is centred with the wall reaching him at 40 ms. The probe confirms he is gone by about 460 ms, so 40 is right.
> - Water at 140 ms is the last clear frame (probe\day-water.png). That was the right call.
> - The cause words, the walk icon and the big lane number never cover the kid on any card. They hold up at the 540 link size and in the preview sheets.
> - The words' dark edge is clearly thicker than before. The ghost name tags sit on dark plaques and read in both looks.
> - The own-row ring is the player's cyan, and the rank number in that row is pink. The ring is static, never a pill, and the same height in 1st, 3rd and 4th, night and day. The cards, scores and ranks don't move.
> - The day end-screen header: the fade is soft, with no hard band, and the corner buttons stay clear.

### What became of each point
1. The Blackbird at 460 → **FIXED**: 60 ms — the jet's afterburners + him in one frame (by day it reads at once; by night the shockwave's
   white is bright round him).
2. The UFO at 720 (washed out, no saucer) → **FIXED**: 1000 ms — high in the beam, the saucer's rim at the picture's top. Framing higher
   to get the whole saucer would put him behind the big lanes — not done.
3. The train at 130 (merged into a carriage) → **FIXED**: 200 ms — flung clear, his face seen (240 tried: a late frame put him past the
   picture's edge).
4. A ghost tag over the friend's number → a LAB STAGING: the kit put the tag there (the lab has no tags of its own); in a match a tag rides
   its ghost's head and passes by. Your own kid covering a letter is the rule (only your kid covers the words). No change.
5. Water: him at the left edge → he WAS at the left of the screen (the frame is the whole screen's width; the crop never goes past its
   edge) — no change. His look from above = the kid model's (pre-existing).
6. The blackout's flat black foot / the fog's grey foot under the number → the card's foot (THE POLISH PASS: deeper, for the big lanes over
   the fog) — **OPEN FOR BEN** (a lighter foot by day brings back the review's "31 LANES on white fog").
7. The car's impact (the van's nose in the pancake) → kept: the owner's "as now if he shows"; the frame after the vehicle has passed would
   need the end screen to wait up to ~0.5 s longer — **OPEN FOR BEN**.
8. At 1440 the ring narrower than PERSONAL BEST / PLAY AGAIN → by design (YOUR TABLE ≤ 440, centred — THE POLISH PASS); the 1 px seam at
   x 980 is the console's frame (pre-existing) — not this pass's file.
9. The ring 3–4 px from the row above → kept (the grid never moves; the gap is the table's 6 px).
10. The Mothership card's kicker "JAYWALK" → its run was a MATCH (the lab's), so no "· SOLO" — by design.

## OPEN FOR BEN
1. RE-PUBLISH: **nothing** — database.rules.json unchanged.
2. The car's share frame is THE IMPACT (70 ms) whenever the vehicle is still over him at 460 — the frame after it has passed (him flat behind
   it) would hold the end screen up to ~0.5 s longer. Yours to pick.
3. The share card's foot by night (the blackout: a flat black slab) + by day (the fog greys under the number) — lighter = the old "31 LANES on
   white fog"; keep, or a different foot for the wall?
4. CLAUDE.md is full (3 bytes of room): THE SHARE PICTURE's standing rule lives in docs/jaywalk.md "THE TOUCH-UP PASS" only.
5. wk-jaywalk-mem's "10 runs in a row" leave count reads 4–7 views alive on this machine today — the polish pass's own code too (above);
   the next JAYWALK pass looks at what keeps a PLAY AGAIN view alive (the leave case alone is clean).
6. JAYWALK's size budget has ~1 KB left (2,449 of 2,450 KB): the next pass trims comments again or names a raise.
