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
| `386618cf` | the close — THE FRESH-EYES REVIEW's fixes + the docs |
| `d52ebc2b` | ADD-ON (the owner) — THE HERO SHOTS = A CLEAN BREAK (no sparks) |
| the close (top) | the pass log, the final run (the ci tag) |

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
- `scripts/build-highrise-heroes.mjs` → `assets/highrise/share/<id>.webp` (1080 × 1350, 44–79 KB, quality 0.8 — the browser's own encoder)
  + the PNGs. Floors: ROOFTOPS 19 · SKYLINE 36 · CLOUDS 76 · STARS 140 · DEEP SPACE 175 · THE MOTHERSHIP 200.

## ADD-ON (the owner, Nov 20, typed into the pass) — THE HERO SHOTS = A CLEAN BREAK
- "At the screen share size, that white sparks looks bad": NO sparks in any of the six hero shots — the cut piece falls away as a clean
  break (its neon edges + clean cut faces, no streaks, no debris). `poster.js` HERO_CAM `sparks: false` → `night.js` (`NOSPARK` — the hero
  mode only: a cut's burst is never queued). Live play keeps its sparks. The six shots rebuilt.

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

## THE CLOSE — THE FRESH-EYES REVIEW (a separate read-only agent that wrote none of it) — its finds, fixed (`386618cf`)
1. **An iPhone before Safari 18.4** (no canvas `letterSpacing`): the card's two `letterSpacing = '0px'` resets CREATED a plain property,
   so `daily/share.js#tracks` stopped spacing by hand — unspaced letters, HIGH / RISE's glows off their letters. Reset only where the
   canvas has it.
2. **fitPng changed JAYWALK**: the first version sent the smallest re-encode even for a picture already under the cap (banding on JAYWALK
   previews of 300–390 KB). Now a picture under LINK_HARD goes up AS IT IS (as before); only one OVER it goes as its first re-encode under
   it (6 bits before 5).
3. **SHARE could stay 'busy' all match** if the hero shot's fetch stalled (no timeout; prepShare caches its build): `loadHero` gives up
   after 3 s — the card draws on the night's dark.
4. **A still asked for could outlive a restart** (tab hidden → the next welcome's first frame grabbed it): `restart()` lets the request go
   (`night.js#snap(null)`); a late still's canvas is freed.
5. **A day end with no still** (the look turned to day after the end, a lost context) got the lighter tint over the live, sharp scene: the
   lighter tint is keyed on `.has-still` — no still = the old day veil.
6. Checked, no change: the card reads `game.results` — present whenever the end screen (which reads the same rows) warms the share.
   Nits fixed: the small layers' canvases freed + null-checked.

## THE FINAL RUN (this pass's own emulators + its own `serve.mjs --emu`, nothing else running; logs: `Downloads\NEON\highrise-fix-b\logs\`)
- Unit **2382 / 2382** · the rules **89 / 89** · `/api` **68 / 68** (run last, after the browser E2Es) · the smoke test **26 / 26**.
- THE SHARE CARD (`highrise-share.mjs`) **88 / 88** — the six shots load (1080 × 1350, ≤ 120 KB), every card full-bleed, the colours, THE
  READABILITY at 300 px, the links ≤ LINK_HARD.
- THE END SCREEN (`highrise-play.mjs --end`, `END_SIZES=390x844,375x667`) **152 / 152** — the day still (a quarter, no filter), every stat
  line ≥ 4.5 : 1 on its own ground (day worst 5.6), night unchanged.
- The test page `highrise-play.mjs` **237 / 237** (REPLAY = LIVE ✓ on every run, a lost context survived) · `--webkit` **6 / 6** · `--fly`
  **18 / 18** (was 8 / 12).
- `e2e-highrise` **88 / 88** (incl. the counting-ON run; the WOULD COUNT line fits, the longest wraps on 2 lines, no NEW BEST with none
  shown; SHARE → the picture alone, 0 /api calls; the card's picture = the band's hero shot) · `e2e-highrise-match` (3 phones + a late
  joiner) **55 / 55**.
- Zero garbage: solo **5.8 KB/s** night (≤ 12; the guard 12 / 12) · a match with 7 bots **10.3 KB/s** (≤ 12; FIX A read 8.9 — this
  pass changed nothing a live match runs: run-to-run spread).
- THE 8-PLAYER PIXEL TEST **10 / 10** · THE TOP HUD + the ties + WATCH (`highrise-place.mjs`) **150 / 150** · SPECTATE IN SYNC
  (`highrise-spectate.mjs`) **32 / 32**.
- Not run: the harbor suite (nothing in the city changed — the cloud runs it on the tagged push).
- Every server this pass started (the emulators: npm · firebase · java; `serve.mjs --emu`) stopped at the end, by exact PID.

## THE CALLS MADE (obvious / established — overrule any)
- The hero floors + beats (above) and THE HERO CAMERA's 24° / 2.1 ×; the seed `poster2` (B1's tower) for all six.
- DEEP SPACE's shot at 175 (under the hull) — the aurora + the planet's rim, no ship.
- THE MOTHERSHIP's card says `FLOORS · DEEP SPACE` (floor 200's band).
- Two-line causes a size down (88 %).
- The kit's fitPng fallback (the smallest re-encode under LINK_HARD) — shared with JAYWALK.
- The day end's tint darker over the words than the mockup (the 4.5 : 1 rule); the still frozen (not the live scene).
- The WOULD COUNT line wraps (rather than shortening its words).

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change). Nothing counts yet.
2. **PHONE CHECKS**
   - THE DAY END SCREEN: play a run in the DAY look to its end — https://neonspeakeasy.com/highrise-play?look=day (or the look switch on the
     start screen → DAY) — the end card over the soft day scene.
   - SHARE: https://neonspeakeasy.com → PLAY → HIGH RISE · TEST → play solo → tap SHARE on the end screen (counting OFF: the PICTURE itself
     goes out — THE POSTER for the band you reached). Also check the WOULD COUNT line fits and never says NEW BEST under your best.
   - THE SIX HERO SHOTS: `Downloads\NEON\highrise-fix-b\hero\` (rooftops · skyline · clouds · stars · space · mothership .png) · the cards
     at 1080 / 540 / 300: `Downloads\NEON\highrise-fix-b\share\` · the end screens: `Downloads\NEON\highrise-fix-b\end\`.
3. **CALLS YOU CAN OVERRULE**: the hero floors + beats (each shot's next slab hovering clear, never a bridge) and THE HERO CAMERA (24°,
   2.1 ×) · A CLEAN BREAK (your add-on — no sparks in any shot) · DEEP SPACE's shot at 175 (no ship; the hull hangs from 178) · THE
   MOTHERSHIP's card says `FLOORS · DEEP SPACE` · two-line causes a size down · the day end's tint DARKER over the words than the mockup (the
   4.5 : 1 rule) and the scene a frozen still · the WOULD COUNT line wraps rather than shortening · the kit's fitPng: a card over the server's
   cap goes up re-encoded (JAYWALK's cards under the cap unchanged).
4. **NOT DONE**: SHOULD 7 — the F-22 (389 KB) + the UFO hum (259 KB) + the jet formation (180 KB) are fetched before the first tap even on a
   run that never reaches them. Any fix changes S4B's PRE-WARM (built for the 65 ms hitch at floor 80) — it wants your iPhone A/B (a lazy
   F-22 after START vs today's). Next: THE CITY pass (the signage, lit at go-live) → GO-LIVE → THE PROOF PASS.
