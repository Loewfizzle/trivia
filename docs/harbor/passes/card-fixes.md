# CARD FIXES — THE GIFT CARDS READY TO GIVE TONIGHT (Nov 5 2026, evening)

Step 0 = plan.md "OWNER'S NOTES — NOV 5 (evening, his SHELL 2.0 B2 test)" (part 71). A short pass so the owner can GIFT his nephews' cards
tonight: the gift-card items only. **No rules change** (database.rules.json untouched — nothing to re-publish).
NOT this pass — held for **FRIENDS' Group 0** (not started here): the radio's fired moments once only, the screen-change glitchFlash → a fade,
the boot pill (#net), the daytime-lit dock, og.png compressed, the cloud-only reds (A6, the holiday job), the two "needs a display" vault checks'
real cause.

## Group 1 — THE OWNER's LAB FIX NOTES (read live, read-only: `node scripts/lab-export.mjs https://www.neonspeakeasy.com` → docs/vault-lab-marks.md, 22:21 UTC)
Every gift card's mark: 15 APPROVE, 5 FIX (below), THE ANARCHIST's full card unmarked (its fixes are Step 0's notes). Each fixed item is bumped in
`js/vault/catalog.js#LAB_V` with its line in `api/_lib/lab-text.js#LAB_CHANGES` → it shows **CHANGED** in THE LAB (an APPROVE still ships the
newer art).

| item | the owner's note (verbatim) | what was done |
| --- | --- | --- |
| PLAYER ONE (strip) | "Show more of his face" | the strip shows his WHOLE face, forehead → chin: the art zoomed out to 75 % of the cover size, sitting right (`strip: [100, 38.5, 0.75]` — the CSS `75% auto` over the art's own navy, which runs on under the plate). v2 |
| HALL OF FAME (strip) | "Show more of his face" | the same, 90 % (`[100, 40, 0.9]`): the chin + the eyes in, the face whole. v2 |
| SUNSET STRIP · FULL CARD | "Fix the glint on its sunglasses. Right now it goes across the whole face, needs to be glasses only, make the glint more noticeable. Maybe add a twinkle. This card is a special card, It needs to feel that way." | a new engine layer `glint` (js/fx/gift.js): a bright band + a thin second streak crossing the two LENSES ONLY (clipped to their ellipses — the GL painter's stencil), full white, every 3.6 s; as it leaves, a STAR TWINKLES on each lens rim in turn. The strip gets the calmer cut of the same. v2 (+ the strip v2) |
| YOUNG BUCK · FULL CARD | "Everything looks great but don't cut off the bottom of his face" | the plate covered the lower-left of his face (the chat's art was placed against a smaller plate): the picture slid RIGHT 130 px (scripts/build-gift-art.mjs — the opened left edge is the picture's own collage mirrored, no seam), every layer moved with it (the copier bar, the letters' jitter region, the bolt's flicker, the torn edge's sweep); his face now starts right of the plate at every phone width (harbor `cardfit`). v2 (+ the strip v2) |
| ICE COLD · FULL CARD | "Move him over to the right side of the frame More, so he is visible" | the picture slid RIGHT 150 px (the left mirrored dark), the aurora / the breath / the glint moved with him — his face ~66–86 % across, the plate clear of him. v2 (+ the strip v2) |

**THE ANARCHIST v2** (Step 0, 4:45 pm — no lab note): his approved picture `Downloads\NEON\gifts\anarchist\the-anarchist-v2.png` (copied to
art/gifts/src/; the build converts it): him ~70–95 % across, a touch smaller, the cap inside the strip band (the strip crop 38 % shows art y
217–446: the cap at 258), the full rifle clear of the card's name, fading into the dark at the belt; every effect re-placed — the circle-A's
glow at its new centre (995, 310), the drips on its new drip lines, the star flare on the aviators, the ember box, the beams from the top light,
the twinkle ring (r 255), the smoke. `hero` = his face, `heroFull` = him waist-up + the rifle. v2 (strip + full card).

**LIAM's 3 against the REAL plate** (re-checked at 402): GOLDEN BOOT — the face clear; its `heroFull` (face + chest) now keeps the plate off his
arm (the plate placement below); YOUNG BUCK + ICE COLD — fixed above (their faces had sat under the real plate).

## Group 2 — THE CARD LAYOUT RULE: "show the most of the card"
- **NO FOUNDER PILL on any GIFT card** (vault/full.js — the founder status still shows on his own non-gift cards + YOU). On every other card the
  pill sits a clear gap UNDER the top line (vault/layout.js — it crowded the gold line).
- **THE PLATE HUGS ITS TEXT** (it already shrink-fits — never a fixed box; on a GIFT full card a little tighter: a smaller emblem, less air, the
  level line's letters closer — css/vault.css). **THE STEP on the full card too** + **THE REVERSE STEP** (strip + full): when the SECOND row is the
  longer (the dev line, LV n · HOST, a short name) the NAME row steps in — the upside-down L, the same thin edge line + a rounded corner; a long
  name keeps the normal step (vault/strip.js#layStep — one function for both plates; the plate says which: data-step n / r).
- **EACH CARD's HERO BOX**: a gift card's `heroFull` (else `hero`) in js/fx/gift-specs.js; any other full card may declare one in
  `vault/layout.js#FULL_HERO` (none yet — the sightings + FOUNDING MEMBER keep their own layouts). **THE PLATE PLACEMENT** (vault/layout.js,
  ONE ResizeObserver on the card + its plate): the plate's max-width ends before the hero (the name fits smaller first — ui/fit.js); then it
  keeps its own place (mid-left) unless that touches the hero (its real stepped shape) or a top / foot piece → the nearest clear spot between
  them (lower / upper-left). A GIFT strip's plate ends before its face too (vault/strip.js#heroRoom).
- **NOTHING OVERLAPS**: the top line shortens to **"№ 0001"** before its letters squeeze past 0.22 em (then tighter, then smaller — vault/full.js
  #fitTop), and re-fits when the badge itself grows (its font landing — the likely cause of the reveal's "Nº 00…" under the 1 OF 1).
- **THE EXCEPTION**: THE SWITCHBOARD's ON AIR under the gem stays exactly where it is (written into vault/hero.js + docs/vault.md).
- **Proof — harbor `cardfit`** (lobbyfix2): every full card (61: the 11 gifts, the dev cards, the rest) at 390 / 402 / 430, as a founder AND not,
  BEN + WWWWWWWWWWWW + LOEWFIZZLE: no two of { the top line's words, the badge, the FOUNDER pill, the plate, MEMBER SINCE, the card's name }
  overlapping, the plate's cover of the hero = 0 on all 11 heroed cards, no FOUNDER pill on a gift; the strips (BEN · LV 100 · HOST): the step
  follows the longer row (61 reverse steps). `platefit` reads the step's own corner now (the reverse step's short row is the name).

## Group 3 — THE SMALL CARD ITEMS
- The dev line **"DEV · № 0001"** (was THE DEV · on the strip, THE DEVELOPER · on the full card) — the dev cards v4 / v6 with their CHANGED line.
- THE REVEAL's header **SOLID**: "ONE OF ONE" white + "IT'S YOURS" gold, a soft static glow (no gradient, no filter — it moves in); "A GIFT FROM
  THE HOUSE" unchanged.
- PLAYER ONE's **PRESS START**: a 19-pt smudge → a 118-px JetBrains Mono bake drawn 540 art px wide (~110 pt across on a 402 card), bright cyan on
  a dark edge, blinking like an arcade screen (1.1 s), between MEMBER SINCE + the card's name.

## THE ADD-ON (the owner, 5:52 pm) — YOUNG BUCK IS REPLACED BY "BRUH"
- **The rename**: BRUH everywhere a name shows — the server's catalog (`api/_lib/catalog.js`), THE LAB's names + lines (`api/_lib/lab-text.js`), the
  card's printed name, /admin → GIFTS (it reads the server's catalog). **The internal id stays `card-gift-youngbuck`** — THE LAB's marks
  (`vault/lab/{id}`), the gift lock (`gifts/{card}`), the item rows + the LAB numbers are keyed by it; renaming it would orphan his marks. Only
  the art key changed (`bruh`); YOUNG BUCK's old picture (assets/vault/gift/youngbuck.webp) is out of the deploy.
- **The art**: copies of `liam-bruh-final.png` (the full card) + `liam-bruh-strip.png` (1280 × 256, eyebrows → chin with the tape) in art/gifts/src/,
  converted by the builder (bruh.webp 198 KB, bruh-strip.webp 63 KB). **A card may now have its OWN strip picture**: the spec's `stripArt`
  { art, h, crop, hero, layers } — the engine maps its layers in that picture's px, `vault/hero.js` checks its hero there; every other card
  unchanged (their strip = the full picture's band).
- **Its printed name**: bigger + heavier than the other cards' — Orbitron 900 at ~4.2 % of the card's width (≈ 15.5 pt on a 370-pt card), gold,
  a thin dark edge (paint-order stroke) — the owner's mock-bruh-final2.png; MEMBER SINCE untouched. No FOUNDER pill (a gift). The hero = his face
  (`heroFull` [790, 110, 440, 690]) — the plate never on it (`cardfit`).
- **The effects** (the full show; the strip the calmer cut on its own picture): the red neon halo BUZZING (two flickering breaths — the outline + the
  crown), the rays turning slowly (clipped to the red wall: `rays` + box), sparkles at nine spots off his face, camera flashes popping one at a
  time across the top, the tape's corner LIFTING + settling (`region` mode `lift` — a piece of the art hinged at its edge), a white CHALK SCRIBBLE
  drawing itself ONCE as the card appears (`scribble` — the slot's own clock), the drips crawling down the wall. 60 fps: its full show **59.7 fps,
  1/180 slow** at 3×, 4× CPU on the GPU path (harbor `vault` — now one of the four full shows checked). Reduced motion = the still frame.
- THE LAB: `card-gift-youngbuck` v3 + `full-card-gift-youngbuck` v3 — CHANGED "YOUNG BUCK → BRUH".

## THE ADD-ON (the owner, 6:04 pm — the ENFORCER before / after) — THE RANK LEAVES THE PLATE
- **Every full card's plate = the NAME + "LV n"** — a clean rounded box (padding even both sides); it steps only when the second row is the longer
  (THE REVERSE STEP: the step's edge as far past its text as the plate's left padding, the split midway between the rows, the corners the plate's
  own radius — no overhang).
- **THE RANK** = its own line in the top line's gold + spaced caps in the bottom-left block, a clear gap ABOVE "MEMBER SINCE / OCT 2026"; the dev
  cards read **DEV · <RANK>** there, and their № went back on the top line ("NEON SPEAKEASY · № 0001 · FOUNDER" — it shortens to "№ 0001 · FOUNDER").
  A gift card's plate sits at 43 % (was 47) so it clears the new line. (A sighting + FOUNDING MEMBER keep their own feet — no rank line there.)
- KEPT as the owner likes them: the 1 OF 1 badge + gem; THE LINEBACKER's HIT HARD peeking from under the plate.
- **The printed name** shows on every full card (`cardfit` checks it; the in-progress shots had none only because the look page carried no names —
  plate-preview.html registers THE LAB's text now, as the lab + the owner's own cards do).

## Shots (docs/harbor/passes/card-fixes/)
before-1 / after-1 (PLAYER ONE, HALL OF FAME, SUNSET STRIP — 402) · before-2 / after-2 (GOLDEN BOOT, YOUNG BUCK, ICE COLD, THE ANARCHIST — 402) ·
before-3-founder / after-3-founder (THE ENFORCER, THE LINEBACKER, UNDER THE LIGHTS, GOLDEN HOUR as a FOUNDER — the pill gone) · after-long-390 (the
longest name: the top line's "№ 0001", the hugging plate) · after-press-start · after-reveal (the solid header over THE ANARCHIST v2) ·
after-bruh-402 / -390 · after-rank-addon (THE ENFORCER, BRUH, THE ANARCHIST, THE LINEBACKER live) · **every-full-card-before-1…4 / -after-1…4**
(all 61 full cards at 402, BEN · LV 23 as a founder — the pre-pass code from a side worktree vs this pass; no motion in these, the materials only).
(The first set of after-1 / -2 / -3 shots predates the 6:04 pm ADD-ON — the plate still says the rank there.)

## Tests (local, the mini PC — quiet: CPU 9 %)
unit 1177/1177 · rules 65/65 · /api 38/38 (THE GIFT TOOL: owner-only, one profile ever, THE ANARCHIST his alone) · smoke 6/6 · the profile E2E
81/81 (after both ADD-ONs) · harbor `platefit` + `cardfit` 27/27 · harbor `vault` 48/50 · `vault,fullcard,youcard,shell,roomfix,gameflows,platefit,cardfit`
103/107 before the last fix (3 = the FOUNDER-slot check's own regex, fixed: it lost its backslash in a template string). THE 2 RED (not this
pass): the 2D path's "a FULL LOBBY of 8 LEGENDARY strips" + "8 LEGENDARIES wearing every emblem + glow" at 4× CPU — the SAME two red on the
PRE-PASS code (this repo's vault group against a side worktree at 87deca5: 17 / 240 + 88 / 240 slow frames there; 28 + 31 here) = B2's
flagged "needs a display" pair → FRIENDS' Group 0 (find the real cause). The GPU path's 8-legendaries lobby: 57.8 / 56.3 / 52.9 fps over
three runs here (57.4 on the old code; the bar 54) — noisy at the line, watch it in FRIENDS. The gift cards on the GPU path: lobbies of 8
60.0 fps · 0 slow; the full shows 59.7–60.0 (BRUH 60.0, 0 / 180). Not run: the WebKit room (wk-room.mjs) — no room / city file changed.
