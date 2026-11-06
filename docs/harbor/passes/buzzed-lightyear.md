# BUZZED LIGHTYEAR — A 1-OF-1 GIFT CARD + THE CARD TEXT STANDARD (Nov 6 2026, afternoon)

Step 0 = plan.md "OWNER'S NOTES — NOV 6 (morning)" (part 73, b9e76aa). A short card pass right after OVERCLOCK part 4; the owner shows the card
TONIGHT. **No rules change** (database.rules.json untouched — nothing to re-publish).
**NOT this pass** (left for their own passes, not started here): THE DISPATCHER (Sunday Nov 8), THE TIER GEM's one shape, THE LOAD, the radio's
order, the victory sounds — the rest of FRIENDS' list. (One FRIENDS item got fixed on the way because this card needed it: the gift strip
mapping bug behind "BRUH's strip effects slightly mis-positioned" — below.)

## Group 1 — BUZZED LIGHTYEAR (`card-gift-buzzed`; the notes' BAD DECISION, renamed 10:26 am)
A 1-OF-1 GIFT (`js/core/gift-cards.js` GIFT_CARDS + GIFTABLE — the owner GIVES it in /admin → GIFTS; not an owner gift), legendary in every
rule; the rainbow DEV GEM + the 1 OF 1 badge on the full card, the rainbow gem on the strip; NO FOUNDER pill; the gift reveal "A gift from the
house" like the others. Line (server-side, `api/_lib/catalog.js`): "Seeing stars since noon." The name is a pun ONLY — no character, costume,
colours or catchphrase from any film anywhere on the card. Client code never names it (THE VAULT 1B — the comments say "the seeing-stars card").

### The art — the flat picture TAKEN APART (`scripts/build-buzzed-art.py`, numpy + scipy, dev only)
The approved picture (B · SEEING STARS — `Downloads\NEON\gifts\bad-decision\bad-b-stars.png`, copied to art/gifts/src/; the originals untouched)
is ONE flat image, so for the spiral to turn BEHIND him the builder splits it:
- **the SPIRAL, fitted** — an Archimedean spiral in a slightly squashed + tilted frame (3 arms; centre, pitch, bend, squash, tilt, phase, the
  pink share) fitted to the art's own pink / yellow pixels away from him: 89 % of the spiral's pixels agree (the rest = the anti-aliased seams
  + the dark vignette corner). The engine REDRAWS it from the formula (a 1536-px bake, filled paths — never a photo) and turns it.
- **HIM, cut out** (`buzzed-man.webp`, RGBA): everything off the two inks, closed + filled (his pink skin is the spiral's pink — enclosed, it
  fills), then the photo's own straight right / top / bottom edges row by row, smoothed; the stars, the ring + the HIC! lifted off him and
  the pixels under them filled from his own nearest pixels (`art/gifts/buzzed-mask.png` to look at).
- **the LIGHT** (`buzzed-shade.webp`, black + alpha, half size): the vignette + his drop shadow, sampled off the spiral's own pixels (the dots +
  the seams left out, the two inks' gains evened — else the old spiral's stripes print into the light) and smoothed.
- **the HIC!** (`buzzed-hic.webp`), **the halftone lattice** (31.5 art px, diagonal), every box → `art/gifts/buzzed-fit.json` → the numbers in
  `js/fx/gift-specs.js`. `KEEPFIT=1` re-cuts without re-fitting (the fit takes ~2 min).
- **THE STRIP picture is COMPOSED** (the owner, 12:40 pm, mid-pass: "Slim card has to show more of his face, eyebrows to chin" — the approved
  strip ran eyes → mouth): the full picture's band from art y 240 (a little air above the eyebrows) to 655 (the chin) scaled × 0.617 into
  1280 × 256, his face at 72 % across; the spiral redrawn from the SAME fit across the wider band (it runs on past the picture's edges), the
  light carried on past them (held at the art's own dim on the far left), the dots on the same lattice, him scaled in. The strip's motion uses
  the same numbers mapped the same way, so the still and the moving strip match. (`bad-b-strip.png` is no longer used.)

### What moves (js/fx/gift.js — five new layer kinds, all on the shared surface: drawImage + paths, transform + opacity)
- `spiral` — the spiral turning slowly behind him (0.16 rad/s full, 0.12 the strip; the bands flow INWARD — hypnotic);
- `dots` — the halftone laid back over it, a soft diagonal wave thinning the dots as it passes (the shimmer, every 5.5 s);
- `cutout` — the light (vignette + drop shadow), then HIM (he never moves);
- `orbit` — five lemon stars with a black comic outline orbiting his cap on the white neon ring every 7 s: the FAR half drawn before him
  (smaller, dimmer — behind his head), the NEAR half after (in front), each twinkling + tilting, a sparkle popping off each in turn. (The ring
  sits a little lower than the art's — cy 74, was ~51 — so the orbit reads round the 1 OF 1 badge instead of under it.)
- `pop` — the HIC! hiccup every 3.6 s: a quick swell (0.12 s), a squash back past 1, a wobble that dies out, a sparkle; a faint breath between;
- `twinkle` (existing) — sparkles round the spiral.
These layers FADE IN over the still art (0.7 s, the slot's own clock) — the first frame + the reduced-motion frame are the approved picture
itself (`still` skips them). The strip: the spiral turning + the dots + a sparkle or two (calm).

### THE GIFT STRIP MAPPING FIX (the FRIENDS item "BRUH's strip effects slightly mis-positioned")
`gift.js#artMap` scaled a card's OWN strip picture (1280 × 256) by the full picture's height (800) — every layer on BRUH's strip sat far above
its spot (found because this card's cut-out vanished off its strip). One line (`dh = ah * k`); BRUH's strip now v4 in THE LAB (CHANGED).

### THE OWNER'S MUSTS (11:56 am)
1. **The name READABLE** — BUZZED LIGHTYEAR bottom-right at 13 px+ (Chakra Petch 800) on the soft dark wash with a dark edge (Group 2); one
   line at 390 / 402 / 430, clear of the hero (`cardfit`). Shots: buzzed-390.png, buzzed-wk-402.png.
2. **The same layout / format as every card** — the standard plate (NAME + LV n), the rank + MEMBER SINCE bottom-left, the Nº line top-left,
   the printed name bottom-right; nothing custom about the frame.
3. **1 OF 1 + the diamond** — the badge + the animated rainbow DEV GEM on the full card, the rainbow gem on the strip (every shot).
4. **Premium legendary effects** — the laser border + the gem's glints (the gift tier's own) PLUS the flair above (buzzed-motion-402.png: four
   frames over 6 s — the bands moving, the stars round the ring, the HIC!).

### THE LAB
`card-gift-buzzed` (n 186) + `full-card-gift-buzzed` (n 187) in GIFTS → NEEDS YOU (APPROVE / FIX / CUT); `api/_lib/lab-text.js` describes the
motion; PREVIEW ON MY CARD works (buzzed-lab-1440.png). The lab's gift lobby test `gifts2` now shows gifts 4–11 (all twelve across the two).

## Group 2 — THE CARD TEXT STANDARD (every full card — css/vault.css "THE CARD TEXT STANDARD")
The owner (8:42 am): the top-left line + the bottom-right printed name "really hard to see and read" on busy art. ONE rule for EVERY full card:
- **a minimum size**: the top line max(10.5 px, 2.9cqi) at weight 800 (fitTop never goes under 10 px now — was 8; the "№ n" short form fits
  first); the printed name max(13 px, 3.6cqi) weight 800 (was 11 px / 3cqi at 0.22em) — ~13 pt on a 390 phone; MEMBER SINCE 10 px, the rank
  10 px; the date 12 px as before. (11 px for the top line pushed every 1-of-1 card's line to its short "№ 0001" form at 402 — eased to 10.5.)
- **a soft dark glass wash** behind the top line, the bottom-left block + the printed name: a rounded wash with a feathered edge (box-shadow
  spread on a ::before — never a hard box, no backdrop filter over the moving art, nothing the layout measures); the light materials (brushed,
  chrome, brass, platinum, the shiba's scrapbook page) keep their dark ink on a LIGHT glass wash.
- **a dark edge on the letters** (a 1-px dark rim + a soft shadow; a light rim on the light materials).
- **more gap** between the rank line + MEMBER SINCE (1.1 → 1.6 em — THE SOURCE's LAB note).
- BRUH's big gold name keeps its own size (its approved exception) + gets the wash; ON AIR unchanged.
- **Proof**: harbor `cardfit` — all 64 full cards at 390 / 402 / 430, four names, founder + not: nothing overlapping, the plate off every
  hero, the name one line where it was; the before → after sheets of every full card at 402: text-standard-1…4.jpg (the BEFORE column predates
  BUZZED LIGHTYEAR's art — its card is blank there). The busiest called out: BUZZED LIGHTYEAR, THE SOURCE (code behind the text), GOLD FOIL /
  INFERNO / the gold gifts (gold on gold), PLAYER ONE, THE ENFORCER.

## Shots (docs/harbor/passes/buzzed-lightyear/)
buzzed-390.png (full + strip at 390 @3) · buzzed-wk-402.png (WebKit, 402 × 874 @3) · buzzed-motion-402.png (four frames, 6 s) ·
buzzed-lab-1440.png (THE LAB at 1440) · text-standard-1…4.jpg (every full card, before → after, 402).

## Tests (local, the mini PC — the emulators + my own server on :5181: the :5173 server from 1:45 am ran OLD /api code and could not be
stopped from this session)
unit 1242/1242 · rules 66/66 (unchanged) · /api 38/38 (THE GIFT TOOL: eleven giftable, one profile ever) · smoke 6/6 · the profile E2E 91/91 ·
harbor `platefit` + `cardfit` 27/27 · `vault` 51/51 (the seeing-stars card's full show 59.7 fps at 3×, 4× CPU, the GPU path; both gift lobbies
of 8 at 60.0) · `roomfix,fullcard,youcard,shell` 26/26. No City 2.0 file changed → the full harbor suite not needed; the ci tag.

## Known issues
- The fitted spiral matches the art's ~89 %: in the first 0.7 s (the fade from the still picture to the moving one) a band edge or two shifts
  a few px. Then it is the turning spiral.
- The ring of stars sits ~23 art px lower than the art's own (so the orbit reads round the badge) — the same small shift during the fade.
- The 1 OF 1 badge covers the top of the ring (the standard layout — the stars pass behind it).
