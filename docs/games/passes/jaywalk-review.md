# JAYWALK — THE GO-LIVE REVIEW (Nov 17 2026)

The owner: JAYWALK is FEATURE-COMPLETE after H6B. This pass proves it READY TO GO LIVE — premium with no weak points, rock-solid,
fair, light — fixes what isn't, and writes the exact go-live checklist (`docs/games/passes/jaywalk-golive-checklist.md`). It does
NOT flip `playable`. Every fix is a VIEW / SOUND / STABILITY fix unless the audit found a real rules or server bug (named below).
The decisions: `docs/games/plan.md` "JAYWALK (the owner, Nov 17 — DECIDED, THE GO-LIVE REVIEW)". What changed in the game:
`docs/jaywalk.md` "THE GO-LIVE REVIEW".

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| STEP 0 | `02641ab0` | the owner's decisions into `docs/games/plan.md` |
| 0 — THE START | (no change) | `node scripts/lab-export.mjs <live>`: 224 marks, **no open FIX**. The cloud result of `a6f885e2`: `tests` green, `harbor` skipped (a ci tag) — nothing red |
| 1 — THE AUDIT | — | ONE fresh read-only auditor (it built nothing): its report VERBATIM below |
| 2 — THE KNOWN FIXES | `421ff9a3` + `ec1ae793` | the Blackbird's day tell · the fog's banding · the first look switch's long frame · the lane count + the chips against the landmarks · Grok's two night touch-ups · the size budget kept |
| 3 — FIX THE AUDIT | see "… and what was done with each finding" | every real finding fixed; the second fresh reviewer's report VERBATIM below |
| 4 — THE CHECKLIST | `ec1ae793` (+ the close) | `docs/games/passes/jaywalk-golive-checklist.md` |
| 5 — THE CHECKS + THE CLOSE | the tagged push | below |

## GROUP 2 — THE KNOWN FIXES (the detail: `docs/jaywalk.md` "THE GO-LIVE REVIEW")
| the item | what was found | what was done | measured / shot |
| --- | --- | --- | --- |
| THE BLACKBIRD's DAY TELL | white-hot lamps + a yellow band on a light-grey runway: low contrast | red / amber signal lamps on dark backings, wig-wagging 3 a second off the rules' tick (steady under reduce motion); the whole lane = amber-on-dark hazard chevrons inside the tell's first sixth; the racing band near-black + yellow-white; a solid edge flare. The tell's length untouched | `jaywalk-review\blackbird\day-1-the-tell.png` · `day-2-the-glint.png` (before: `jaywalk-h6b\blackbird\`) |
| THE FOG BANK's banded streaks | NOT a gradient's steps: (1) every camera-facing puff was CUT by the ground it leans into — a hard horizontal line across each; (2) the bank's body ended in one ruler-straight edge; (3) the ground's mottle met the plain fog in a line | the glow's shape 10 (a puff fades INTO the ground, dithered) · a soft LIP on the body's edge · the mottle fades out before the plain fog | `jaywalk-review\h5c\fog\day-*.png` — contrast-boosted crops show no edge left |
| THE FIRST LOOK SWITCH's ≈ 130 ms frame | NOT the 3D scene: bisected to the sea wall's DAY stone (two sized repeating gradients) painted for the first time — ≈ 120 ms under a 4× CPU throttle | the stone = ONE small SVG tile · the other look's sky map + programs warmed in the start's hidden frame | the first night → day switch: **150 ms → 33 ms** worst (every other frame 16.8); the perf kit fails a switch frame over 70 ms |
| THE DAY BRIDGE behind the match chips | the chips' column = 86 × 111 pt (8 players); the bridge is painted over the picture's left 38 %, the band has ± 17 % of room | in a MATCH the bridge + the lighthouse are pinned as far right as the picture goes (`SKY_MATCH_PIN`): the lighthouse (both looks) + the night bridge stand clear; **the day bridge's left tower cannot** (OPEN FOR BEN) | `jaywalk-review\chips\*.png` |
| THE 3-DIGIT LANE COUNT near three landmarks | measured: at 76 px a 3-digit count is 166 pt wide — FIVE day + FOUR night landmarks stood in it (not three); no offset clears them without cutting the landmark | the count steps down a size (60 px from 100 lanes, 44 px from 1,000 — measured: 888 stands at x 129–261 of 390) + `SKY_MAX`: the band's slide stops where the count would meet the landmark; the rest offsets re-measured | `jaywalk-review\sky\*-top.png` (all 16) |
| THE TWO DARK NIGHT TOWERS | Grok's own touch-ups were in the folder (12:04–12:05 pm; the inbox's 12:10 pm entry) before the code lift was started | re-encoded through the asset builder (2 webps; the other 16 byte-identical; the masked lights unchanged) — **no code lift built** | `jaywalk-review\sky\night-3-rail-yard*.png` · `night-8-airfield*.png` |
| THE SIZE BUDGET (found by the unit suite) | the fixes put JAYWALK 5.6 KB OVER its 2,450 KB line (it stood 1 KB under) | 14,042 B of pass-history comments cut from `night.js` (a subagent; every code line identical — checked line by line) — the line NOT raised | **2,442 of 2,450 KB** |

