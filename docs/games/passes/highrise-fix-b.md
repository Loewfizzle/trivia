# HIGH RISE — REVIEW FIX B: THE SHARE CARD · THE DAY END SCREEN · THE WOULD COUNT LINE (Nov 20 2026)

**No rules change** (`database.rules.json` untouched — nothing to re-publish). HIGH RISE stays HIDDEN (the owner's phone only) and
NOTHING COUNTS (`HIGHRISE_COUNTS` off). The owner's calls: `docs/games/plan.md` "HIGH RISE — REVIEW FIX B". The mockups (approved):
`Downloads\NEON\highrise-share-B.png` (THE SHARE CARD) · `Downloads\NEON\highrise-day-end-screen.png` (the RIGHT side = THE DAY END
SCREEN). The bible: `docs/highrise.md` "THE SHARE CARD = B · THE POSTER" + "THE END SCREEN" (REVIEW FIX B).

| commit | what |
| --- | --- |
| `0f3f7bf6` | Step 0 — the owner's decisions into plan.md |
| `cdd66704` | Group 1 — THE SIX HERO SHOTS (the poster pipeline, the hero camera, no flyers) |
| `3137afec` | Group 2 — THE SHARE CARD = B · THE POSTER (the live frame GONE; PNG-friendly; fitPng's fallback) |
| `d03ad087` | Group 3 — THE DAY END SCREEN + THE WOULD COUNT LINE |
| `51530d48` | Group 4 (part) — the `--fly` shot script |
| the close | THE FRESH-EYES REVIEW's fixes, the docs, the pass log, the final run (the ci tag) |

THE ADD-ON INBOX: read at the start, after every group's commit and before the final run — nothing was addressed to this pass. The
open entries are to THE NEXT CITY PASS and to JAYWALK — left untouched.

## GROUP 1 — THE SIX HERO SHOTS (`Downloads\NEON\highrise-fix-b\hero\`)
- **THE POSTER PIPELINE, extended** (B1's — `poster.js#runHero`, the test page's `?poster=hero&shot=<id>`): the REAL night scene staged
  the same every time — the seed `poster2` climbed clean to the shot's floor, ONE cut dropped (its falling piece + sparks), frozen a beat
  later, the canvas copied (`night.js#snap`), cropped to the card's 4 : 5 with the lit top at 52 % of its height.
- **THE HERO CAMERA** (`night.js` `o.cam` — the hero mode only; play never passes it): 24° down (play: 33°) from 2.1 × play's distance —
  a TALL tower rising from the card's foot, the sky above it calm for the number. The stage is 900 × 1500 css at dpr 2 (an 1800 × 3000
  frame: the crop is never upscaled), bloom on (tier 2).
- **NO FLYERS** (`stage.js` `o.noFly`: every flyer moment counts as flown). DEEP SPACE at floor 175 — THE MOTHERSHIP's hull hangs in the
  sky from 178 until a run passes it (at 214 it filled the top). THE MOTHERSHIP's shot = the match's FINISH at 200 (the gold pour, the hull
  over it — the one flyer the brief asks for).
- **THE BEAT, per shot**: S5's 140 ms froze the next slab LEVEL with the top — a bridge, the very thing the owner hated. Each shot's own
  beat (rooftops 220 · skyline 330 · clouds 450 · stars 230 · space 330 ms) — the next slab clear of the top, hovering, the cut piece falling
  with its sparks (`&beat=<ms>` = the build's tuning sweep).
- `scripts/build-highrise-heroes.mjs` → `assets/highrise/share/<id>.webp` (1080 × 1350, 46–80 KB, quality 0.8 — the browser's own encoder)
  + the PNGs. Floors: ROOFTOPS 19 · SKYLINE 36 · CLOUDS 76 · STARS 140 · DEEP SPACE 175 · THE MOTHERSHIP 200.

## GROUP 2 — THE SHARE CARD = B · THE POSTER (`Downloads\NEON\highrise-fix-b\share\` — every card at 1080 · 540 · 300)
- `share.js` rebuilt to the mockup: 1080 × 1350 FULL-BLEED, NO inner frame, ALWAYS night — the band's hero shot (the band REACHED; THE
  MOTHERSHIP's for a finished tower) · HIGH (pink) + RISE (cyan) neon + `SOLO · NEONSPEAKEASY` · the floor HUGE (the game's numerals,
  white-hot, cyan glow) + `FLOORS · THE BAND` · over the dark foot fade: the cause in big pink neon (two lines a size down when long),
  `31 PERFECTS · BEN`, the kit's neon line + NEONSPEAKEASY.COM. THE FINISH = ALL GOLD type on the gold shot.
- **THE LIVE FRAME GONE**: `shot.js` deleted; the stage's capture a beat after the end, the cartridge's `shotKey`, the inner hero frame +
  the dark cause tab removed. The card's numbers = the host's result rows (the same as the end screen).
- **PNG-FRIENDLY** (found building it): the CLOUDS card's link picture did not fit the server's cap — 582 KB, and still over LINK_HARD on
  5 bits as fitPng returned it. Chrome DITHERS canvas gradients + shadows (noise in every pixel): the washes are now 1 × 64 strips
  stretched, the glows two small layers (1/6 + 1/2) stretched — the same light. And `kit/share-run.js#fitPng` now keeps the SMALLEST
  re-encode when it is under LINK_HARD (the clouds card: 312 KB on 5 bits — before, no link at all; JAYWALK's cards gain the same fallback,
  nothing else of theirs changes).
- THE READABILITY at 300 px wide (a message thread's thumbnail), measured: the number 54 px caps · HIGH RISE 18 · the cause 15, each ≥ 8 : 1
  on its ground. The links: 244–312 KB.
- The share machinery is unchanged: the link alone at the first SHARE tap, none while THE SWITCH says WOULD COUNT (the picture alone).

## GROUP 3 — THE DAY END SCREEN + THE WOULD COUNT LINE (`Downloads\NEON\highrise-fix-b\end\` — page/ + cartridge/)
- **THE DAY END SCREEN**: the end keeps its layout, colours, glow + buttons; by day the scene shows through — ONE STILL (`stage.js#endStill`:
  650 ms after the end card, the end pose eased; `night.js#snap` → shrunk to a quarter + a two-pass box blur → stretched in `.hi-endbg`).
  First built as a CSS `filter: blur()` on the live canvas — the game's sheet bans filters (THE LAG RULES — `highrise-s4b.test.mjs`), and
  the scene keeps drawing under the end card: a still is frozen, costs nothing a frame, and needs no filter. Shrunk alone the slabs read
  DOTTED (their lit lines broke into a grid of points) — the tiny blur on the small picture fixed it.
- The tint: 0.88 over the words (to 46 %), 0.58 where the tower stands (60–74 %), 0.84 → 0.9 at the foot; the console foot's backing 0.5 by
  day. THE CONTRAST RULE wins over the mockup's lighter top: every stat line measured ≥ 4.5 : 1 on its own ground (the words hidden, the
  brightest 5 % of its box) — day worst 5.6, both sizes. Night = JAYWALK's veil, unchanged.
- **THE WOULD COUNT LINE**: wraps (balanced, inside the 16 px gutters — the longest line the server can send is 2 lines at 390); NEW BEST
  only when the floor beats the YOUR BEST this screen shows (`wouldLine(w, best)`) — counting OFF the server keeps no record, so its own
  `best` was every run.

## GROUP 4 — WITH ROOM
- **The flyers' look-shot script** (`highrise-play.mjs --fly`, the review's 8 / 12): it asked for the F-22 while the Blackbird was in the
  sky, and for the UFO after climbing PAST its floor 85 (the game had flown it — one flyer at a time, rightly). It waits for a clear sky and
  climbs to 84: 18 / 18.
- **SHOULD 7 (the F-22's 1.1 MB before the first tap): NOT built** — it changes S4B's PRE-WARM guarantee (every flyer model uploaded behind
  the welcome — the fix for the 65 ms hitch at floor 80) and needs the owner's iPhone A/B to judge. OPEN FOR BEN.

## THE CLOSE — THE FRESH-EYES REVIEW
(filled at the close)

## THE FINAL RUN
(filled at the close)

## THE CALLS MADE (obvious / established — overrule any)
- The hero floors + beats (above) and THE HERO CAMERA's 24° / 2.1 ×; the seed `poster2` (B1's tower) for all six.
- DEEP SPACE's shot at 175 (under the hull) — the aurora + the planet's rim, no ship.
- THE MOTHERSHIP's card says `FLOORS · DEEP SPACE` (floor 200's band).
- Two-line causes a size down (88 %).
- The kit's fitPng fallback (the smallest re-encode under LINK_HARD) — shared with JAYWALK.
- The day end's tint darker over the words than the mockup (the 4.5 : 1 rule); the still frozen (not the live scene).
- The WOULD COUNT line wraps (rather than shortening its words).

## OPEN FOR BEN
(filled at the close)
