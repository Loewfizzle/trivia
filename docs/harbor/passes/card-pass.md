# THE CARD PASS — seven 1-of-1 gift cards, THE GIFT QUEUE, the Overclock review's city items (Nov 7 2026, night)

Step 0 = plan.md "OWNER'S NOTES — NOV 7" (part 75, c1dfae6) + decisions.md. **No rules change** (database.rules.json untouched — THE GIFT QUEUE
lives in `ppriv/`, which has no client rule: server-only). Commits: Group 1 fef5c90 · Group 2 0d07ceb · Group 3 fb2619e · the end (the ci tag).
**NOT this pass** (FRIENDS' list — not started): B2 the double victory sound, B4 the podium list's repeats, B5 the NIGHT · LOCKED row, B6 game
toasts under the corner, THE FLYBY under the clouds, the slow-3G match screen, YOUR TABLE, the cloud reds; the one-account-one-room test (Sunday).
**Servers:** my own fresh `serve.mjs 5177 --emu` (+ a pre-pass worktree on :5178 for the before shots) — both stopped at the end. The stale
servers from earlier passes (serve.mjs on :5173 / :5190 / :5191 + the emulators from 1 pm) could not be stopped from this session (the
sandbox refused); the emulators were reused (the tests load the current rules), never the stale serve.mjs.

## Group 1 — THE GIFT QUEUE + B1 + B3 + B8
- **THE GIFT QUEUE** (`api/_lib/gifts.js`): every gift waits in a LINE — `ppriv/{pid}/gq/{pushKey}` = `{ id, at, s? }` (push keys sort in the
  order given). `giftCheck` → `{ gifts: [{ k, id, at }] (the unseen, in order), done (seen in this line), gift (the first — an old phone) }`;
  `giftSeen { k }` stamps that one (`s`); the LAST one seen clears the line; `giftSeen` with no `k` (an old phone) = the first unseen. The old
  single slot (`ppriv/{pid}/gift`) MIGRATES on the next check — into the line FIRST (key `-0old` sorts before every push key). The newest gift is
  the one equipped (as before: each GIVE equips). /admin → GIFTS gives exactly as before (one profile ever).
  **The reveal** (`js/profile/gift-reveal.js#playLine`): ONE CARD AT A TIME — "GIFT 2 OF 5" + "FROM THE HOUSE" over the flipping card, the button
  NEXT GIFT › (the last: IT'S YOURS); each marked seen as it closes, so a refresh mid-line resumes at the next unseen, numbered in the same line
  ("GIFT 3 OF 5"). Never over a match (a match starting mid-line stops it — the rest waits for the next open); still ~6 s after the page opens.
  Proof: server.test "THE GIFT QUEUE" (5 + an old slot in order, a double tap marks nothing new, the refresh resumes, the old phone's call, the
  line cleared) · the profile E2E §11 (five reveals in the browser, a reload after two → GIFT 3 OF 5, the last → IT'S YOURS, the line gone) ·
  reveal-queue-wk-402.jpg (WebKit).
- **B1 — AN EMPTY SOLO RUN NEVER COUNTS** (`core/match-report.js#soloEmpty` → the row's `empty`; `core/progress.js#matchStep` → `skip: 'empty'`):
  a room of one that answered nothing (no right part) and scored nothing pays no solo XP, no streak day, no solo-lane count (nothing written). ≥ 1
  answered part or a total > 0 counts as before; a multiplayer 0 is never "empty". Unit tests both ways + the profile E2E (XP / matches / solo count
  unchanged, the podium as ever).
- **B3** — THE BOARD's two "SOLO BEST" tabs + column → **QUICK · SOLO** / **STANDARD · SOLO** (`core/boards.js`: `short` = the label).
- **B8 — THE /api-DOWN SOLO PATH** — proven, no fix needed: the profile E2E plays BOB's solo run with /api unreachable → the podium shows, no
  error, the result waits in the queue (1); /api back → sent + counted ONCE.

## Group 2 — THE SEVEN 1-OF-1 GIFT CARDS
All seven: `core/gift-cards.js` (GIFTABLE — 18 now), legendary, the rainbow DEV GEM + 1 OF 1 on the full card, the rainbow gem on the strip, no
FOUNDER pill, the reveal, the laser border, THE CARD TEXT STANDARD; each its own HERO box (vault/layout.js keeps the plate off it); each its OWN
strip picture with the hero far right (Group 3's standard); names + lines server-side (`api/_lib/catalog.js` — shipped code never names one);
THE LAB 194–200 (strips) + 201–207 (full cards) → NEEDS YOU. The art: `scripts/build-card-pass-art.py` (copies the originals into
`art/gifts/src/`, never edits them) → `assets/vault/gift/` (19 WebPs, ~1.2 MB). Credits (☰ → CREDITS): "Card art generated with Grok Imagine"
(the wasteland pair), "Background art generated with Grok Imagine" (the Old Bridge card).
**FX plates** (Grok's light on pure black) come out as LIGHT WITH ALPHA (`lit()` — alpha = the brightest channel): the effect canvas is
transparent, so black drawn 'lighter' there turned opaque black (found in the first motion burst — SOLE SURVIVOR's whole card went dark,
STARI MOST got a dark box). New layers in `js/fx/gift.js` (one engine, the shared surface, transform + opacity, reduced motion = the still art):
`plate` (breathe / flicker / burst / rise), `blinds`, `siren`, `grain`, `terminal`, `rush`, `shimmer`, `trace`, `flicker`, region `ripple` /
`jiggle` (scaled to cover its own spot — no ghost) / `flutter` / `creak` (clipped to the sign's diamond).

| card | what moves (full card) | strip |
| --- | --- | --- |
| THE DISPATCHER | the blinds' shadows drift across his face; a car's headlights sweep through the slats (~9 s); a squad car's red + blue double-flash at his cheeks; faint smoke; film grain; THE DISPATCHER printed in RED NEON (the approved mock), flickering now + then (opacity) | composed from the full picture (× 0.58, his face 0.66 → 0.87); the blinds + the siren |
| OUT OF ORDER | the pink spray halo breathes; the torn pink edge + the green paper's top edge flutter (ripples); the stencil's drips + the lime splatter run; the chrome pin glints; sparkles; a copier's light bar + a two-frame flicker; grain. No gavel. | the owner's strip, 45 px left; halo, sparkles, the pin |
| NOT GUILTY (a LIGHT card) | the ransom letters jiggle one by one; the red marker draws round his circle (a fresh-ink line over the art's own circle, then it fades); the tape strips flutter; the stars wobble. Dark ink on a light wash. The poster SLID 80 px DOWN (the real 1 OF 1 badge + the top line's long form sat on the letters — the mock's badge was tiny) | the owner's strip, 40 px left; the marker |
| WASTELANDER | the game TYPES on the CRT: > SURVIVOR FILE · > RADS ...... 0 · > CAPS .. 1,024 · > STATUS LEGEND · > _ (dark phosphor green, a block cursor; ~8.5 px at 390 — the screen is 82 pt wide); the glow flickers; sparks crackle at the screen's corners; dust. The picture slid 40 px down (its bezel was under the badge) | composed (× 0.78, the screen 0.68 → 0.85); the same typing |
| SOLE SURVIVOR | embers rise across the card (the plate scrolling); the haze breathes on the sun; heat shimmer; the radiation sign creaks a hair (0.4°, clipped to its diamond) | composed (× 0.74, the sign 0.69 → 0.88; its left mirrored, its right carried on) |
| ZA DOMOVINU | the chequered flag ripples (30 slices + a light band rolling); the stars twinkle in turn; speed lines rush out from behind him; sparkles on the gold; the sticker's white edge faded where his photo is cut | THE FLAG STRIP (shared), 100 px left — the stars twinkle |
| STARI MOST | the sun's flare breathes behind his head; sparks spray off the race car (the plate + streaks + rising sparks); the river shimmers; his shirt's soft box blended into the river (the river's own rows, a ragged feathered edge) | THE FLAG STRIP |

Nothing of any game's trademarks on the wasteland pair (as Grok delivered: no logos, no characters). Shots: full-390-a/b/c.jpg (the real layout,
W × 12), strips-maximilianos-390.jpg, motion-a/b/c-402.jpg (three frames each, ~1.8 s apart), reveal-queue-wk-402.jpg, lab-wastelander-1440.jpg.
**A Safari bug found + fixed on the way** (every gift card, not only the new ones): `strip.js#layStep` wrote EVERY plate's max-width from the
STRIP rule ('' on a full card) — wiping the full card's hero cap from `layout.js#layFull`; the two fought through the ResizeObserver and WebKit
ended UNCAPPED: a 12-letter name ran across the face in the gift reveal (BUZZED LIGHTYEAR too). Now a full card's plate keeps its own cap, and
`ui/fit.js#refit` re-fits the name when the cap changes. (The lab-preview's `fx=1` full cards never run the layout — use the plain preview.)

## Group 3 — THE HORSESHOE + THE SLIM-CARD LONG-NAME STANDARD
- **THE HORSESHOE** (B7 — `vault/emblem-art.js` shape `shoe`, neon finish): a lucky GOLD horseshoe in neon tubes, opening up, a round ~300° shoe
  with a narrow gap at the top (the first try, a straight-sided U, read as the letter U at 28 pt), six pale-gold nail holes, a warm glow
  breathing + a glint twinkling on its heel. THE LAB 208 (NEEDS YOU). horseshoe-390.jpg (full size, 28 pt, two strips). The Grok texture wasn't
  needed (the neon build reads better at 24 pt). No emblem waits on a glyph now (tests/vault-2b PENDING_ART empty).
- **THE SLIM-CARD LONG-NAME STANDARD** (the owner, Nov 7 + the 9:15 pm ADD-ON: the longest name = `NAME_MAX` = 12): on every slim card the
  hero sits far right (gift strips: centre 0.75–0.85 — `tests/card-pass.test.mjs`), and **every strip that declares a hero now caps its plate
  there** (`strip.js#heroRoom` — was gift strips only): a 12-letter name shrinks / goes to two balanced lines, never over the subject, never cut.
  **Harbor `stripfit`** (lobbyfix2): every strip (73) at 390 with `'W'.repeat(NAME_MAX)` + MAXIMILIANOS at LV 100 — the name + the level line
  inside the plate, the plate's real stepped shape off every hero box; it reads NAME_MAX, so it follows the limit.
  **Strips moved** (before → after, the hero's centre across; strips-before-after-390.jpg — left BEFORE, right AFTER, MAXIMILIANOS):
  THE ENFORCER / THE LINEBACKER / UNDER THE LIGHTS 0.66 → 0.77 (zoomed out to 70 %, set right) · SUNSET STRIP 0.73 → 0.76 (87 %) · GOLDEN HOUR
  0.71 → 0.76 (82 %) · GOLDEN BOOT 0.63 → 0.76 (66 % — he is smaller) · BUZZED LIGHTYEAR 0.73 → 0.76 (90 %) · SAFECRACKER 0.62 → 0.80 (46 % — the
  wheel; `pw-specs.js#pwMap` takes a zoom now) · GHOST RUN 0.66 → 0.77 (65 % — the cabin; `cc-specs.js#ccMap` too). All CHANGED in THE LAB (a
  version bump + the dated line). Hero boxes made honest: SAFECRACKER's strip + full card = the door + wheel (the gold blaze beside it), GHOST
  RUN's = the boat (its spray may trail under the plate), the fireball's strip = its streak's right part (it flies in from behind the plate).
  **Capped, art unchanged** (their subject is drawn by the card's effect — moving each is a pass of its own): PRISM, MARQUEE, the sightings
  (UFO, TR-3B, F-22, the ghost ship, the skull, the ₿ balloons, the fireball), EMERALD, CAMO, ETERNAL, CENTURY, FOUNDING MEMBER, the two dev
  cards — a 12-letter name now shrinks to fit left of their subject (before, it ran over the prism / the NEON sign).
- **cardfit was already red before this pass** for SAFECRACKER + GHOST RUN's full cards (the plate over their hero — measured on a worktree of
  c1dfae6); green now with the honest hero boxes.

## Tests (local, the mini PC — the emulators + my own :5177)
unit 1351/1351 · rules 66/66 (unchanged) · /api 39/39 (+ THE GIFT QUEUE; GIFTS lists 18) · smoke 6/6 · the profile E2E 109/109 (+ B1, B8, the
queue's five) · harbor `vault,fullcard,youcard,progress,playercard,roomfix,shell,platefit,cardfit,stripfit` 124/124 (`vault` now 58: its five
stale counts brought up to date — the dailies' cards + emblems had never been added; + the seven new full shows at 3×, 4× CPU on the GPU path: 59.0–59.7
fps, ≤ 2/180 slow — NOT GUILTY's nine letters the heaviest). No City 2.0 file changed → not the full harbor suite; the ci tag.

## Known issues
- NOT GUILTY: the marker's "draw" is a fresh-ink trace over the art's own circle (the circle crosses his photo, so it can't be lifted off cleanly).
- NOT GUILTY's top row of letters sits just under the top line's long form ("NEON SPEAKEASY · № …") at 402 — close, not touching.
- WASTELANDER's typed lines are ~8.5 px at 390 (the screen is ~82 pt wide on the card) — readable, small; the strip's are smaller.
- On BUZZED LIGHTYEAR's full card a 12-letter name sits 3 px into the plate's right padding at its minimum size (inside the plate, off the face).
- The effect-drawn strips listed above keep their subject where it is (capped plate, smaller long names) — moving them = a follow-up pass.
- The stale servers from earlier passes are still running (see the top).
