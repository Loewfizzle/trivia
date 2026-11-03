# THE VAULT 2A — THE 3 HELD CARDS + THE EMBLEM / GLOW / TUBE-STYLE SYSTEM + THE SAMPLES — Nov 3 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 3 (midday)" (part 57): VAULT 1C done + its decisions, the owner's 1C marks (4 FIX notes, done in a quick
deploy-tag session), THE PROGRAM's colours approved, I'M NEW HERE to go, the 3 held cards' scenes ("your picks"), NO PRISM DROP daily. The
lab's marks export (refreshed first): every 1C card approved except LIGHTS OUT's FULL card — FIX: "Make the red light pulsing". One session,
the groups in order, no helper agents. The deep doc: `docs/vault.md` ("THE VAULT 2A").

## What changed
**Group 0 — THE 3 HELD CARDS + small fixes** (strip + full card each, in THE CARD LAB first — n 92–97):
- **FOUNDING MEMBER** (`card-founder`, LEGENDARY — `js/fx/opening.js`) — OPENING NIGHT: the night over the harbor's skyline; on the
  speakeasy's roof (its stepped parapet, the limestone coping, the **EST. 1924 DATE STONE** carved + lit pink from above) the big sign on its
  steel frame — the title's OWN NEON tubes (`ui/logo.js#LOGO_LETTERS`, the same pink) over SPEAKEASY in the city's tube alphabet, in cream.
  THE SWITCH-ON: dark glass, then letter by letter each tube stutters on (N·E·O·N slowly, S-P-E-A-K-E-A-S-Y quicker); once it all burns two
  searchlights rise behind it, sweeping (a 12-s loop; the still = all lit). The member's **REAL №** in gold — a gold chip in the strip's
  corner, a struck-gold stamp on the full card (FOUNDING MEMBER · № n · SINCE …) — DOM, crisp at 3×. + THE BORDER LASER (gold).
- **THE HOUSE** (`card-house`, LEGENDARY, level 100 — `js/fx/house.js`) — THE SPEAKEASY IN FULL BLAZE: a baked Art Deco front at night (oxblood
  brick washed warm from below, a stepped parapet + limestone coping, two floors of lit windows — a pink + a teal shade among the amber —,
  the ground floor's gold shop windows + the red door with its brass), EVERY SIGN LIT: the BLADE (SPEAKEASY in the tube alphabet) with its
  marquee bulbs chasing, the title's NEON over the ground floor, a **gold neon CROWN over the door**, breathing; behind the roof the FINALE —
  gold willow shells bursting in turn (the city's finale colour), their trails raining down behind the building, each burst washing the
  front gold. + THE BORDER LASER.
- **PLATINUM** (`card-platinum`, now **EPIC** — the owner's pick; level 95) — THE METAL CARD: brushed platinum (Metal009 tinted cold —
  `assets/vault/platinum.webp`), a **diamond-cut bevel** (two cut facets in CSS: the outer catches the light top-left, the inner bottom-right)
  and a cold white light sliding across (`sheen` with `gain`) that RUNS THE BEVEL where it crosses + glints off the cut corner
  (`js/fx/bevel.js`; `combo('platinum')`). Clean, not busy.
- `js/fx/sign-kit.js` — the app's own neon baked for a card: tube letters flattened (`core/tube-path.js`) + baked once per size into a GLASS and
  a LIT sprite (the logo's layer stack); `ignite()` (the switch-on stutter), `hum()`.
- **LIGHTS OUT's full card** (the owner's FIX): the RED centre now beats near-dark → full (`sg-tr3b.js`, full card only; the approved strip as
  it was).
- **I'M NEW HERE removed** from the bring-your-card sheet with its welcome line (the ✕ closes it, as before).
- `shots.mjs --wk` — a `--page` shot in WebKit (Playwright 1.56, iPhone: isMobile + touch, @3).

**Group 1 — THE EMBLEM SYSTEM** (`js/vault/emblem-art.js`, `js/vault/glows.js`, `js/vault/picker.js#stylePicker`, the lab's tabs):
- **AN EMBLEM = A SHAPE + A FINISH.** Every emblem is a box of small SVG layers (no canvas — crisp at the phone's 3×; nothing on the effect
  surface). NEON = the sign's own tube stack (glass → two soft glows → body → white-hot core → a hairline highlight; glows as wide soft strokes,
  never a blur filter). **Today's 12 sign-up shapes** are commons on it (the frame + the icon as two tubes in the player's colour + the dark
  glass). The rarer finishes: PRISM · CHROME · GOLD · ICE CRYSTAL · MOLTEN · GLITCH · GALAXY. Effects TOUCH or SURROUND the shape.
- **TUBE STYLES** (separate unlocks, worn on ANY neon emblem): TWO-TONE (two colours in one tube — your colour into its partner), BREATHING,
  A CHASING LIGHT (new item, level 26); GOLD TUBE · OLD SIGN · SLOW BURN · ON THE BEAT wear as a plain tube until 2B (said on their rows).
- **NAME GLOWS** (the NAME only — never the level line): EMBER (common, still), GOLD LEAF (the old GOLD — gold leaf + a glint popping on the
  letters), ELECTRIC (the old SPARK — cold light, small arcs on the top edge + off the name's end); the others keep today's look until 2B.
  `ui/fit.js` measures the text without a glow's pieces (LOEWFIZZLE stays whole on one line).
- **THE PICKER**: emblems · tube styles · name glows as ROWS like the cards — each on the player's OWN strip (their worn card) wearing that
  option, WEARING ✓, tap to wear (the first row = none); ONE effect surface for the whole VAULT section; the old tiles gone.
- **THE LAB**: an **EMBLEMS** tab (each at full size + 28 pt + on a still COMMON card + a LEGENDARY; the 12 sign-up shapes as one block;
  the tube styles on three neon emblems; 1A's test pair last) + a **GLOWS** tab (a short + a LOEWFIZZLE-length name, strip + full card);
  A FULL LOBBY's **WEAR THE SAMPLES** (EMBLEMS · GLOWS — `&wear=emb,glow`, or one id on all 8: `&wear=emb-sg-ufo`); the strips tab = cards only.
- The server catalog: **SWEETHEART** (`emb-sweetheart`, common, level 6) · **THE HOUSE** crown (`emb-house`, legendary, level 100 with the
  card) · **A CHASING LIGHT** (`tube-chase`, uncommon, level 26); the set's names (RAINMAKER, SNOWED IN, FOUR ON THE FLOOR, THE FLAME); the
  finishes' tiers (FOUR ON THE FLOOR rare, SNOWED IN + RAINMAKER epic); ICE + AFTERGLOW → common (COMMON = still).

**Group 2 — THE SAMPLES** (three refine passes each at 402 + WebKit 402 × 874 @3, motion judged in bursts):
1 THE KEY (neon: amber + a pink diamond) · 2 SWEETHEART (neon pink — full lobes, a long point, a reflection arc — + a small purple heart) ·
3 THE OWL (neon, Art Deco — a horned owl's silhouette in violet, a barn owl's heart-shaped face in gold with almond eyes + a beak; the first
two tries read as a fox, then a bug) · 4 FOUR ON THE FLOOR (prism: the rainbow sweeping inside, the beam in + four lines out) · 5 THE HOUSE
crown (gold: struck gold, gems, a shine + a peak glint) · 6 SNOWED IN (ice crystal: frost growing at the tips in pairs) · 7 THE FLAME
(molten: a crust, glowing cracks, the core breathing, a lava drip, embers) · 8 RAINMAKER (glitch: red / cyan ghosts, the jump + two slices
tearing) · 9 LIGHTS OUT (chrome: the city's REAL TR-3B from below — `legends.js#tr3bCorners` un-flattened — black chrome, WHITE corner lights
in turn, the RED heart) · 10 I WANT TO BELIEVE (galaxy: the city's saucer with a nebula drifting through it, stars, ports, the beam) ·
3 glows (EMBER · GOLD LEAF · ELECTRIC) · 2 tube styles (BREATHING · A CHASING LIGHT) + TWO-TONE's look.

## THE SPEED FIX (Group 2 — measured, then fixed)
A FULL LOBBY of 8 legendaries wearing every sample's emblem + glow, 4× CPU, the real compositor, 3×: **33.5 fps** (59.7 without them). The
cost: CSS animations on SVG *children* repaint the whole SVG every frame, and Chromium never moves an `<svg>` element on the compositor
either; GOLD LEAF's drop-shadow re-rendered under its moving glint. The fix: (1) every emblem a stack of layers, EACH MOVING PART ITS OWN
HTML-wrapped layer (`<i class="ve-l">` holding its `<svg>`) animated on transform + opacity — the compositor moves it, nothing repaints;
a part moving INSIDE the shape (a sweep, a shine, the nebula) slides under a MASK of the shape (`i.ve-m`); (2) no filter under a glint;
(3) **THE PROMINENCE RULE as the budget** — LEAD plays every layer, EVEN its signature motion only (the secondary layers `.ve-2` rest),
QUIET holds the still, lit frame, and **a LEGENDARY card always leads** (its emblem + the name glow hold still). Measured (bench +
the harbor `vault` group): 8 legendaries + every sample 58.7–59 fps · THE 8 SAMPLES 60 (the lab's guests now wear their own sign-up shapes —
1A's test emblems had cost it 54) · THE 8 SIGHTINGS 60 · THE NEW 21 60 · 8 still cards + every emblem leading 60 (0.9 ms).

## Decisions
- **THE 3 HELD CARDS as the owner picked them** (OPENING NIGHT · THE SPEAKEASY IN FULL BLAZE · THE METAL CARD); PLATINUM is EPIC.
- **The member № is DOM, not paint** (a gold chip on the strip, a stamp on the full card) — crisp at 3×; the lab dresses it with № 3112.
- **Emblems are SVG layers, not canvas** — crisp at any ratio, no surface slots; motion on HTML-wrapped layers only (the speed fix above).
- **A LEGENDARY card leads** (the prominence rule refined by the measurement): its emblem + name glow hold their still, lit frames.
- **The new marks' places:** SWEETHEART at level 6 (early, for the friend's daughters), A CHASING LIGHT at 26, THE HOUSE's crown at 100.
- **Glows: GOLD LEAF = the old GOLD, ELECTRIC = the old SPARK** (ids kept; the names server-side); ICE + AFTERGLOW are commons (still).
- **The lab's lobby guests wear their own sign-up shapes** (real players always do); 1A's test pair stays on its strips for the marks.
- `components.js#avatar` (every game screen, the chips, the lobby today) is unchanged — the strips + the full cards use the new renderer;
  LOBBY 2.0 brings the strips (and with them the new emblems) into the room.

## Known issues
- **Every new piece waits for the owner's marks**: the 3 held cards (6 lab rows) + 17 samples (EMBLEMS + GLOWS tabs); LIGHTS OUT's full card
  re-marked after its FIX. Only APPROVED art ships.
- THE CROWN (`emb-crown`, level 55) and THE HOUSE's crown are both crowns — 2B gives THE CROWN its own shape.
- Owned emblems / tube styles without art yet wear as the player's own shape / a plain tube (said on their rows) until 2B.
- The marks export is still public (→ the switch-over).

## Hand-off to VAULT 2B (the rest, from his marks)
Read `docs/vault-lab-marks.md` first (n 92–114). Build the rest of the set to whatever he approves: every emblem = its row in
`js/vault/emblem-art.js#EMBLEM_ART` (+ its shape in `SH`) + `api/_lib/catalog.js` + `lab-text.js` + `js/vault/catalog.js#LAB`; a NEW finish =
its `FIN` builder (still parts in the base layer, each moving part `C.layer('cls')`, a part moving inside the shape under `C.mask(d)`;
mark secondary motion `ve-2`) + its keyframes (transform + opacity only, × `--sp`). Still to build: the other ~38 emblems (LAST CALL,
KNOCK KNOCK, THE TRIPLE, EARLY BIRD, HODL, DEAD ON, THE CREW, FREQUENT FLYER — the wings redone, SKY KING — the real Blackbird outline,
BUTTERFLY, every sighting's matched emblem …), the other glows (FROST, FIRE, PRISM, GLITCH, STARLIGHT, CANDLELIGHT, TINSEL, ICE, AFTERGLOW,
NEON, CHAMPAGNE), the other tube styles (GOLD TUBE, OLD SIGN, SLOW BURN, ON THE BEAT — the party's beat), the seasonal emblems.

## Tests (this pass)
unit (+ `tests/vault-2a.test.mjs` — the 3 held cards, LIGHTS OUT's pulse, every sample a real item at its tier + earned + its art in its
finish, the new levels + REWARD_LEVELS, the names + tiers, the prominence budget, the motion rule (2A keyframes = transform + opacity only;
every layer an HTML `<i>`), the picker rows + the lab tabs; `rarity.test` — I'M NEW HERE gone; the names-only-to-owners test also checks
the 3 cards' names in the art's code) · the harbor `vault` group (31: the lab's 48 cards with the held 3 first, 47 full cards, the EMBLEMS
tab — 16 items, all 8 finishes, 28 pt, 0 animations on an SVG element —, the GLOWS tab — LOEWFIZZLE whole, the level never lit —, the
held cards' gold №, the picker's style rows + wearing, A FULL LOBBY of 8 legendaries + every sample at 4× CPU, reduced motion = every layer
still) · `vault-bench.mjs WEAR=…`.

## THE FULL LOCAL RUN (the mini PC, Nov 3)
unit 1093/1093 · rules 58/58 (the rules FILE unchanged — no re-publish) · /api: server 29/29, progression 10/10, sightings 4/4, lab 2/2 ·
smoke 6/6 · the profile E2E 75/75 (THE BOARD's row check on the re-run, as in 1A–1C) · THE FULL HARBOR SUITE 877/881 at 4 shards (~17 min):
RADIO's greyed-jack note + LOAD WEATHER's holiday-night jump = the known clock / existing failures (1C); THE RESIZE green alone (417 ms);
SIGHTINGS' parked print — a REAL regression this pass caught (31 % frame vs 21–22 % on the pre-2A code, A/B'd on a worktree): the tap's
grow-back loaded the reveal's bigger module graph + vault.css mid-gesture → `progress/sighting.js#prewarm` now loads them at the tap on the
craft: 20–22 %, the `sightings` group 10/10 twice. The `vault` group 31/31.

## THE CLOUD (the two-run cap)
Run 1 (the harbor tag): tests GREEN; harbor 9/10 — the `audio` job's DIAGNOSTICS + SCROLL-PAUSE "resumed" check counted 6 frames in 500 ms
(it asked > 10): this pass put all 8 legendaries on screen for it (the lab's header grew) and the cloud's software GL draws them slower. The
check now asks what it claims — the effects RESUME (≥ 3 frames ticking); the speed has its own checks. Run 2 (`gh workflow run harbor -f
job=audio`): 177/177 GREEN. Live on www.neonspeakeasy.com from the harbor-tagged push.
