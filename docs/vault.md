# THE VAULT — the cards, THE CARD LAB + THE EFFECT LIBRARY (THE VAULT 1A + 1B, Nov 2–3 2026)

What a player COLLECTS (cards · emblems · name glows) and how each one LOOKS + MOVES. The items themselves (ids, names, tiers, who gets
them) are PROGRESSION's (`docs/progression.md`, `js/core/items.js`); this doc is their ART: the slim strips, the effect library, the lab
where the owner approves them. The owner's decisions: `docs/harbor/decisions.md` §15 (THE VAULT + THE VAULT — THE SPLIT, SLIM FIRST + THE
EFFECT LIBRARY); the passes: `docs/harbor/passes/vault-1a.md` (THE STYLE TEST — this one). **The owner's marks: `docs/vault-lab-marks.md`
— the next VAULT pass reads it FIRST** (`node scripts/lab-export.mjs https://www.neonspeakeasy.com` refreshes it from the live site — FR6 FIXES A: no argument = the local server).

| file | what |
| --- | --- |
| `js/vault/catalog.js` | PURE — THE LAB's catalog (every item the lab shows, in order, + what it does), `cleanMark` (the server's check), the sample guests |
| `js/vault/strip.js` | THE SLIM STRIP — `stripEl(row)` (the plate: emblem + NAME + LV; the material; the tier tag; the frame) + `mountStrips(host, rows, { calm })` (a list on ONE effect surface) + `LOOKS` (each card's material + effect) |
| `js/vault/emblems.js` | THE TWO TEST EMBLEMS (the bolt in NEON + PRISM — inline SVG, CSS motion) + THE PROMINENCE RULE (`prominence(cardTier, emblemTier)`) |
| `js/vault/lab-views.js` · `js/vault/lab.js` · `lab.html` | THE CARD LAB's views (shared with the no-Firebase preview) · the `/lab` page (admins only) |
| `js/vault/approved.js` | ONLY APPROVED ART SHIPS — `isApproved(id)` / `approvedIds()` from the lab's public export |
| `api/_lib/lab.js` (+ `api/admin.js`) | the marks: `labMarks` / `labMark` (admins only, audited, a history) + `GET /api/admin?lab=export` |
| `js/fx/renderer.js` | THE EFFECT LIBRARY's ONE SHARED RENDERER (surfaces + slots, one clock, one rAF, its own tier guard) |
| `js/fx/gl.js` | THE GL PAINTER (1B): a 2D-context look-alike over WebGL2 — every surface draws through it (the 2D canvas the fallback) |
| `js/fx/hearts.js` · `sheen.js` · `tube.js` | 1B's effects: hearts drifting up · the foil's shine pass + a glint · a neon tube inside the edge |
| `js/vault/picker.js` · `js/vault/full.js` | THE VAULT PICKER (the profile's real strips) · THE FULL CARD (+ its sheet, the profile's own card) |
| `js/ui/fit.js` · `js/ui/vv.js` | THE NAME NEVER CUTS OFF (fitName) · every bottom sheet above Safari's toolbar (--vv-ob) |
| `api/_lib/catalog.js` · `api/_lib/lab-text.js` | NAMES ONLY TO OWNERS: the server-only catalog (+ withShow) · the lab's names + descriptions |
| `tests/integration/vault-bench.mjs` | THE VAULT BENCH (A FULL LOBBY at a CPU slowdown, each cost off in turn) |
| `js/fx/kit.js` | the shared kit: a seeded RNG, eases, PRE-BAKED SPRITES (glow, sparkle, heart, smoke puff, flame tongue) |
| `js/fx/index.js` + `smoke · frost · flames · prism · marquee · glitter · laser · ufo .js` | the effects (the registry) |
| `css/vault.css` | the strips (`vl-`), the emblems, the lab; the surface (`fx-`) |
| `assets/vault/*.webp` · `scripts/build-vault-textures.mjs` | the card textures (1050 × 660 WebP — tinted copies of Grok's CC0 picks; credits in ☰ → CREDITS) |
| `tests/integration/vault-preview.html` | THE LAB without Firebase (`?view=strips|emblems|glows|lobby|full &mix=samples|legend|<card id> &wear=emb,glow|<emblem id> &bare=1 &still=1 &tier=0|1|2 &only=<ids>`) |
| `js/vault/emblem-art.js` | THE VAULT 2A — THE EMBLEM SYSTEM: the shapes (`SH`), `EMBLEM_ART` (id → shape + finish), the finishes' builders (`FIN`), the neon tube stack + the 12 sign-up shapes, `TUBE_STYLES`, `emblemEl()` |
| `js/vault/glows.js` · `js/vault/sheet.js` | NAME GLOWS (`GLOW_ART`, `applyGlow`) · css/vault.css on demand (no effect library) |
| `js/fx/sign-kit.js` · `opening.js` · `house.js` · `bevel.js` | 2A: the app's neon baked for a card (tube letters, the switch-on) · `card-founder`'s scene · `card-house`'s scene · `card-platinum`'s bevel light |

## THE BAR (the owner, said twice: "make sure they are HIGH QUALITY")
Every card at the class of I WANT TO BELIEVE (`docs/harbor/plan.md` "THE SIGHTING CARDS' BAR": the real baked model, real light, depth,
motion) — never a flat gradient with a sticker on it. **Fewer, better:** a card that can't reach it isn't shipped. Every new card gets
THREE refine passes, judged MOVING on the phone (shots.mjs `--page … --crop XxYxWxH --every ms --count n` bursts + WebKit 402 × 874 @3),
side by side with the owner's sketch. Every card + emblem at 3×.

## THE TIERS (decided — COMMONS STAY STILL)
**COMMON** still (a real material — the emblem may lead) · **UNCOMMON** one clear effect · **RARE** an effect + GLOWING EDGES · **EPIC**
two effects together, bold · **LEGENDARY** a living scene + THE BORDER LASER. The same bar on every tier; the tier sets HOW MUCH moves.
The tag colours: common gold · uncommon mint · rare sky · epic violet · legendary a gold pill.

## SLIM FIRST (the owner, Nov 2 10:14 + 10:20 pm)
The SLIM STRIP is the card people SEE (the lobby's guest list, menus, THE BOARD's rows, the end of round) — the primary canvas, its flare
top quality; the full card is the bonus (a great strip gets TAPPED and opens it). **The strip:** ~360 × 64 pt, radius 12; a glass PLATE
(left) with the player's EMBLEM (36 pt), NAME (20 pt, ivory, ≥ 15 : 1 on the plate over any art) + `LV n` (· HOST); the TIER TAG
bottom-right; the card's art + motion everywhere else, calmer under the plate. **THE VAULT 1A built the 8 samples as strips; 1B builds the
full cards + the rest to the same bar, from the owner's marks.**

## THE PROMINENCE RULE
The higher tier on a strip LEADS: a still COMMON card + a showy emblem → the emblem gets the full motion + the spotlight (BRUSHED GOLD +
the PRISM bolt); a busy legendary card → the emblem plays QUIETER (I WANT TO BELIEVE + the NEON bolt). `emblems.js#prominence(card,
emblem)` → `lead` (the emblem ≥ a tier above) · `even` · `quiet` (the card ≥ two tiers above); the emblem's CSS reads `is-lead / is-even /
is-quiet`.

## EMBLEMS = A SHAPE + A FINISH (VAULT 2 builds them; 1A tests two)
NEON tube (the house style, the commons) · PRISM · CHROME · GOLD · ICE CRYSTAL · MOLTEN · GLITCH · GALAXY … (emblem-finishes.png), by
tier, + the shared effects; the shape always reads at 28 pt. LIGHTS OUT (TR-3B) from the REAL model's silhouette + its lights (WHITE
corners, a RED centre). The two test emblems are inline SVG with CSS motion (transform + opacity: no canvas): NEON = four strokes (the
glow, the tube, the white core) + an ignition flicker; PRISM = a rainbow sliding through the shape's clip, a white edge, a sheen, a glint.

## THE EFFECT LIBRARY (`js/fx/` — SHARED, not card-only)
**ONE SHARED RENDERER — never a canvas per card.** A SURFACE is one canvas behind a host's children (a list of strips, the lab, later the
lobby's guest list, an emblem row, the end of round); each card is a SLOT in it. One clock + one `requestAnimationFrame` for every surface
on the page. **Only what's on screen draws**: a surface off screen (IntersectionObserver) or a hidden page draws nothing, a slot scrolled
away isn't drawn. **Reduced motion** (the OS setting, the app's REDUCED EFFECTS): each slot's still frame (`effect.stillT`), drawn once.
**Sizes** from ResizeObservers — never a layout read in the frame loop. **Memory**: the canvas through `ctx2d` (the memory guard counts it);
a surface ≤ ~2.6 MP (THE PIXEL BUDGET — the lab's tall list; a lobby of 8 at 3× never meets it). **Speed**: its own frame-time guard steps
its tier (slow frames down, a long calm up); THE TIER TABLE (`core/harbor-tiers.js`): `fxDpr` (the canvas's pixel ratio cap: 1 / 1.5 / 2 —
the plate, the name + the frame stay DOM at the phone's full ratio) and `fxParticles` (45 / 70 / 100 % of each effect's particles).
**Layering without more canvases**: the host is a stacking context; a strip must NOT be one (no transform / opacity / filter on the strip
itself — LOBBY 2.0's entrance animates a WRAPPER, never the strip) so the material (z 0) < the canvas (z 1) < the plate, tag + frame (z 2+).

```js
import { createSurface } from '/js/fx/renderer.js';
import { FX } from '/js/fx/index.js';
const S = createSurface(host);                         // host: a positioned element (.fx-host)
S.add(el, FX.flames, { seed: 3, calm: 1, radius: 12 }); // el: any element inside the host — its rect is the slot
S.remove(el); S.destroy();
```
**An effect** = `{ id, tier, bleed, stillT, draw(c, slot, t, Q) }` — `c` already at the slot's top-left in CSS px; `slot.w / h`, `slot.opts`
(seed, calm, radius, tint); `Q = { q (the tier's particle share), still, dpr, calm, tier }`. **Stateless by time**: a frame is a pure
function of `t` + the seed (the same frame on every phone, a still frame for free). Particles STAMP pre-baked sprites (`kit.js`) — never a
gradient per particle per frame. Draw with `'lighter'` for light, `source-over` for matter; clip to the slot (`rrect`) unless a glow should
bleed past the edge.
**A NEW EFFECT**: a file in `js/fx/` + its line in `js/fx/index.js` + (if it costs) its particles scaled by `Q.q`. Where the city already has
the effect (the aurora, lightning, skywrite smoke, fireworks), the card version STARTS from the city's own (one look); in the city an
effect obeys THE WIND, THE LIGHT, the timetable + the tier budgets.

### The effects so far (1A)
| effect | what moves | built for |
| --- | --- | --- |
| `smoke` | stretched banks drifting in two depths, lit amber by a lamp, curling off the edge + two continuous ribbons | SMOKE ROOM |
| `frost` | rime breathing in from the rim, crystals (baked dendrites) revealed as they grow, a jagged crack running + a glint riding it | FROSTBITE |
| `flames` | a wall of flame tongues (two layers, mirrored + leaning), the ember bed, sparks, a breathing heat edge | INFERNO |
| `prism` | a white beam into a glass prism, a rainbow fan sweeping out, a glint on the glass, a holo sheen across | PRISM |
| `marquee` | brass-socketed bulbs chasing round the frame (+ a ring flash), a neon tube (an arrow) flickering on + off | THE MARQUEE |
| `glitter` | bursts with a shockwave: foil flakes flashing, hearts tumbling, sparkles popping; the card's own glitter twinkling | GLITTER BOMB |
| `laser` | THE BORDER LASER — a white-hot comet with a coloured tail racing the rounded edge (`drawLaser` for any legendary) | every legendary |
| `ufo` | the city's baked UFO (`screens/harbor/ufo-model.js`) turning + bobbing, its ports chasing, the beam pulsing, motes rising, the night + skyline baked per size | I WANT TO BELIEVE |

## THE 8 SAMPLE STRIPS (THE VAULT 1A — the owner approved the set, Nov 2 10:23 pm)
| # | card (id) | tier | the strip |
| --- | --- | --- | --- |
| 1 | BRUSHED GOLD (`card-brushed`) | common | STILL — real brushed gold (Metal009 tinted + high-passed), a bar-rail sheen, a crisp bevel; its PRISM emblem leads |
| 2 | SMOKE ROOM (`card-smoke`) | uncommon | `smoke` over a dark lounge, a warm lamp top-left |
| 3 | FROSTBITE (`card-frostbite`) | uncommon | `frost` over real ice (Ice004, tinted cold + darkened) |
| 4 | INFERNO (`card-inferno`) | rare | `flames` over black-red heat |
| 5 | PRISM (`card-prism`) | rare | `prism` over black glass |
| 6 | THE MARQUEE (`card-marquee`) | epic | `marquee` over a red velvet curtain |
| 7 | GLITTER BOMB (`card-glitter`) | epic | `glitter` over real pink glitter (Silver_Glitter_6, tinted) |
| 8 | I WANT TO BELIEVE (`card-sg-ufo`) | legendary | `ufo` + `laser`, a gold + green neon frame; its NEON emblem plays quieter |
New ids this pass: SMOKE ROOM · FROSTBITE · INFERNO · PRISM · GLITTER BOMB · HEARTBREAKER (the pink pair: HEARTBREAKER level 4, GLITTER
BOMB level 8 — early, easy to get; no PINK CHAMPAGNE). Where SMOKE ROOM · FROSTBITE · INFERNO · PRISM unlock: 1B. BRUSHED GOLD → common.

## THE CARD LAB (`/lab` — admins only; reused by 1B, VAULT 2 + every future collectible)
Open it: the radio → LEDGER → THE CARD LAB, or /admin → The Card Lab ›, or `neonspeakeasy.com/lab` — in the browser where the owner's
profile lives (the server checks `whoami` + every mark: `ADMIN_PIDS` only; THE CREW + strangers get the door). **THE STRIPS**: every item at
real phone size (a 390-wide column), MOVING as in the game, the strip FIRST; its NAME + TIER + id + what it does; under it **APPROVE** ·
**FIX** (+ a note → SAVE NOTE) · **CUT** (tap the lit one again to clear). **A FULL LOBBY**: 8 strips at once in the lobby's calmer cut —
THE 8 SAMPLES, 8 LEGENDARIES, or 8 of one — with a live readout (frames a second, the effects' tier, their draw cost, the canvas size).
**STILL** = reduced motion; **TIER 0 / 1 / 2** pins the effects' tier (AUTO = the guard). FULL CARDS = 1B.
**A NORMAL SCROLLING PAGE** (HOTFIX Nov 3 — the owner's iPhone: a swipe didn't scroll): `css/base.css` locks the app to one screen
(html/body height 100% + body overflow hidden); the lab undoes it on its own `html.vl-lab-html` / `body.vl-lab-on` (vault.css, like
admin.css). Any new stand-alone page that loads base.css needs the same unlock — and a FINGER test (a scrollIntoView moves a locked page).
**The marks** live in `vault/lab/{id}` = `{ m: approve|fix|cut|null, note, at, by }` (server-written only; the rules' default deny), each
change audited (`audit/` act `labMark`) + kept in `vault/labLog`. **THE EXPORT** `GET /api/admin?lab=export` (edge-cached a minute) = ids +
marks + notes + when — no names, no profile ids — read by `js/vault/approved.js` (only APPROVED art ships to players) and by
`scripts/lab-export.mjs` → `docs/vault-lab-marks.md` (the next pass reads it first). **Until a card is APPROVED it stays lab-only**: nothing
outside the lab draws a strip yet (LOBBY 2.0 puts them in the guest list, through `approvedIds()`).

## A NEW CARD / EMBLEM plugs in by
its item in `core/items.js` (id, name, tier — the award engine grants it) → its row in `js/vault/catalog.js` (the lab shows it) → its look
in `js/vault/strip.js#LOOKS` (a material in `css/vault.css .vl-s-<mat>` + an effect from `js/fx/`, or a new effect) → three refine passes
in the lab's preview → the owner marks it in THE CARD LAB → APPROVED ships. Every new legendary / holiday / game / daily brings its own
(the standing rule — plan.md "NEW CONTENT = NEW COLLECTIBLES").

## Measured (THE VAULT 1A, the mini PC)
A FULL LOBBY of 8 LEGENDARY strips at 4× CPU on the real compositor: median 16.7 ms, 0 of 240 slow frames, the effect tier held at 2 (the
draw ~7–9 ms in the slowed time); the 8 samples 58–60 fps. Software compositing (the default test browser) at 4×: ~40 fps (the canvas
rasterised on the CPU — a phone's GPU never pays it). Headless WebKit on Windows runs EVERY page at ~10 fps (the lab with no canvas 92 ms a
frame, the city's title 110 ms; 8 legendaries 77–88 ms — no worse than its baseline): it judges looks, not speed. **The iPhone decides**:
the lab's readout on the owner's phone.

## Tests
`tests/vault.test.mjs` (the catalog, the marks, THE PROMINENCE RULE, the pink pair, the tier rows, the looks + the registry) ·
`tests/integration/lab.test.mjs` (/api on the emulators: the owner marks — stored, audited, the history; the crew + a stranger refused;
the export has no names) · `rules.test.mjs` (nobody reads / writes the marks) · the harbor `vault` group (the lab's 10 items on ONE canvas,
the marks, 8 legendaries at 4× CPU = 60 fps, only on-screen slots draw + a hidden page stops, reduced motion = still frames; BY FINGER — real touch swipes at 402 × 874 scroll the lab +
A FULL LOBBY → 8 LEGENDARIES top → bottom, a tap marks + clears, the membership card's key section + the bring sheet scroll; the same lab
in WebKit at iPhone size — Playwright 1.56 in `~/wk` or `WK_PLAYWRIGHT`, skipped with a warning elsewhere; its mobile WebKit taps but
can't drag, so it scrolls by PageDown, blocked by the same lock).

## THE VAULT 1B (Nov 3) — passes/vault-1b.md
### SPEED (the owner's iPhone is the verdict)
On iOS Safari a **2D canvas is rasterised by CoreGraphics on the CPU** (in Safari's GPU process), call by call: the page's timer reads ~0
while the calls still hold the frame. So every surface draws through **THE GL PAINTER** (`js/fx/gl.js` — a 2D-context look-alike over
WebGL2: triangles in one batch, sprites in one atlas, gradient LUTs, AA fringes, an SDF rounded clip, the stencil for other clips). The 2D
canvas is the fallback (no WebGL2 · a lost context · `&fx=2d` · GPU DRAW off). **Rules for an effect on the GPU path**: few calls still
matter (the tessellation runs on the CPU) — bake what never changes into a sprite (`kit.sprite`), keep strokes to the curves you need,
set `c.fxTol` coarse while building a clip of many circles; `c.isGL` tells you which path you're on. The top tier draws at the phone's
full 3× (`fxDprGl`). **Scroll-pause** (default on): a scroll / a moving touch holds the effects + pauses their clock. **The guard's
probation**: a tier step down that doesn't help is undone + held 30 s. **THE DIAGNOSTICS ROW** (the lab, owner-only): CSS GLOWS · EMBLEMS ·
CANVAS FX · THE LASER · UFO SPRITES · SCROLL-PAUSE · GPU DRAW (remembered: `vl:diag`; `&diag=nofx,nolaser,nosprites,nopause,noglow,noemb,nogpu`)
+ the readout. **THE VAULT BENCH**: `node tests/integration/vault-bench.mjs "<chrome>"` (env CPU, MIX, SW, SCROLL, RUNS — bare: all 8 on
screen). Measured at 4× CPU, 3×, the full tier: 8 legendaries 60 fps, each card alone ~60, THE 8 SAMPLES 55.7 (the 2D path 31 / 23).

### THE FULL CARD (`js/vault/full.js`)
`fullCardEl({ card, who, spotted })` + `mountFull(surface, el, card)` · `openFullCard(id, who)` (a sheet) · `mountFullCard(host, id, who)`
(the profile's own card). The ID-1 shape (1.586 : 1, sized in cqi); the strip's material (`.vl-s-*` — a material can add `.vl-fcm-*` rules
for the big card); the effect with `opts.full` (every effect lays itself out for it — `kit.unit(s)` = the strip-sized unit); a foil sheen
(rare +); NEON SPEAKEASY (+ №) + the tier; FOUNDING MEMBER; the plate (emblem + name + BAND · LV); MEMBER SINCE + the card's name. A SIGHTING
card: the whole scene, its title in neon, when it was spotted, the corner brackets, THE BORDER LASER. Its own lab mark (`full-<card>`).

### THE VAULT PICKER (`js/vault/picker.js`) + THE NAME (`js/ui/fit.js`)
The profile's cards: the REAL slim strips (the player's emblem + name + LV), the card's name + tier over each, WEARING ✓, tap to wear, VIEW
→ the full card; unapproved art → a plain strip in the card's palette. `fitName(el, { min, two })`: a name is ALWAYS whole — shrunk to fit,
then two balanced lines; never an ellipsis (the card, the strips, the full card, the podium).

### NAMES ONLY TO OWNERS
The catalog is the SERVER's: `api/_lib/catalog.js` (every item's name / line / look, the 30 achievements + their checks, WHAT each level +
streak milestone gives — registered into the shared registries at import) + `api/_lib/lab-text.js` (the lab's names + descriptions — handed
to the lab with the marks, admins only). The site's code keeps the logic, the ids (the art's keys), the ORIGINAL GILDED, and WHEN a level
gives something (`REWARD_LEVELS`). Every /api answer goes through `withShow` → `show: { items, ach }` for exactly the ids it holds; the
client's /api wrapper registers them (+ keeps this device's own: `ns:show`). The look previews (local only) import the catalog off the
local server. **A NEW item**: its row in `api/_lib/catalog.js` (+ `lab-text.js` + `js/vault/catalog.js#LAB` for the lab) + its LOOK.
`tests/vault-names.test.mjs` proves the shipped code carries no catalog.

### THE LAUNCH SET (the cards with art — every one through THE CARD LAB; only APPROVED art ships)
| id | name | tier | effect | material | earned | lab |
| --- | --- | --- | --- | --- | --- | --- |
| card-brushed | BRUSHED GOLD | common | — (its emblem leads) | brushed gold (Metal009) | TOP SHELF (ten wins) | strip ✅ · full new |
| card-smoke | SMOKE ROOM | uncommon | smoke | a lamp-lit lounge | level 12 | strip ✅ · full new |
| card-frostbite | FROSTBITE | uncommon | frost | real ice (Ice004) | level 16 | strip ✅ · full new |
| card-inferno | INFERNO | rare | flames | black-red heat | level 42 | strip ✅ · full new |
| card-prism | PRISM | rare | prism | black glass | level 22 | strip ✅ · full new |
| card-marquee | THE MARQUEE | epic | marquee | red velvet | THE HOST | strip ✅ · full new |
| card-glitter | GLITTER BOMB | epic | glitter | pink glitter (Silver_Glitter_6) | level 8 | strip ✅ · full new |
| card-sg-ufo | I WANT TO BELIEVE | legendary | ufo + laser | the night over the harbor | a UFO sighting | strip ✅ · full new |
| card-gilded | GILDED | common | — | black lacquer, the brass fan, a double frame | everyone | strip new (full = the Gilded card) |
| card-midnight | MIDNIGHT | common | — | a scattered star field, a nebula | level 3 | new |
| card-heartbreaker | HEARTBREAKER | uncommon | hearts | pink into violet | level 4 | new |
| card-brass | BRASS DECO | common | — | engraved brass, a deco lattice | level 5 | new |
| card-emerald | EMERALD & BRASS | uncommon | sheen | green-black lacquer, a stepped crown | level 10 | new |
| card-neonglass | NEON GLASS | uncommon | tube | smoked glass | level 18 | new |
| card-chrome | SILVER CHROME | uncommon | sheen | polished chrome, a prism rim | level 20 | new |
| card-champagne | MIDNIGHT & CHAMPAGNE | uncommon | sheen | navy lacquer, Chrysler arches | level 25 | new |
The rest of the catalog (25 cards + 8 sighting cards) keeps a plain strip until built (passes/vault-1b.md "Known issues").

## THE VAULT 1C (Nov 3) — passes/vault-1c.md
### THE ONE TIER PALETTE (`js/core/rarity.js` + css/base.css `--tier-*`)
COMMON grey · UNCOMMON green · RARE blue · EPIC purple · LEGENDARY gold — the cards' tier tags, the picker, THE PROGRAM (every row its badge +
its name tinted: `programTier`), later emblems + glows. `--tier-<id>` = the light on a dark ground, `--tier-<id>-ink` = words on paper.

### THE SIGHTING CARDS (`js/fx/sg-*.js`)
Each the city's OWN art in a scene of its own: `sg-kit.js#city(name, load)` lazy-loads a city painter (legends.js's TR-3B, ghostship.js's
`ghostArt`, aurora.js's `AURORA_LOOKS`, balloons.js's `balloonArt`) — the backdrop stands alone until it's in; `backdrop()` / `skylineLayer()`
bake the sky + the harbor's skyline (its windows a separate layer — LIGHTS OUT turns them off column by column); `stage(s)` = the subject's
box (a strip: right of the plate; a full card: centred high, above the title). The jets are the city's models RE-BAKED at a hero angle:
`node scripts/bake-model.mjs "<chromium>" sr71-card` / `f22-card` (`scripts/bake/card-shots.mjs` — the city recipes' own pages; a shot's `pts`
report where a nozzle lands) → `assets/vault/sg/` (+ `sg-jets.js`: afterburners + shock diamonds, contrails, a tileable cloud deck).
**THE SCENE** (`js/vault/full.js#upgradeScene`): the reveal's pair + the album's no-photo tile show the full card's art without its words once
`full-<card>` is APPROVED. **A NEW LEGENDARY'S CARD**: its `sg-<id>.js` (from the city's painter), its LOOK (`mat: 'sg-<id>'` + a `--sg` light in
vault.css), its two lab rows + names (api/_lib/lab-text.js).

### THE HELD-BACK CARDS + the new effects
`scan` (CAMO) · `spot` (VELVET ROOM) · `rays` (GOLD FOIL) · `embers` (THE 30-NIGHT FLAME, CENTURY's 2nd) · `twinkle` (MARBLE & GOLD, SAPPHIRE's +
PRISM LEGEND's 2nd) · `confetti` · `circuit` · `holo` (PRISM LEGEND) · `bulbs` (THE MARQUEE · GOLD BULBS — bulbs + searchlights) · `penthouse`
(lights + traffic) · `veil` (AURORA — the city's strands under glass) · `neoncamo` (an edge map of the material's own texture, mapped as
the CSS covers it) · `witness` (the star chart) · `blaze` (WILDFIRE, ETERNAL FLAME). **`combo(id, tier, [fx, opts]…)`** (js/fx/index.js) = an
epic's two effects on ONE slot. A light / busy material's FULL card gets dark bands under its corner words (every word legible).

### THE LAUNCH SET — 1C's cards (all NEW in the lab: strip + full card each, waiting for the owner's marks)
| id | name | tier | effect | material | earned |
| --- | --- | --- | --- | --- | --- |
| card-sg-tr3b | LIGHTS OUT | legendary | sgTr3b | the city going dark | a TR-3B sighting |
| card-sg-blackbird | SKY KING | legendary | sgBlackbird | dusk over the cloud sea | a Blackbird sighting |
| card-sg-f22 | AFTERBURNER | legendary | sgF22 | a hard blue day over the deck | an F-22 sighting |
| card-sg-ghostship | THE FLYING DUTCHMAN | legendary | sgGhost | Halloween night, the moon | a ghost-ship sighting |
| card-sg-aurora | SKY DANCER | legendary | sgAurora | the harbor under the aurora | an aurora sighting |
| card-sg-fireball | MAKE A WISH | legendary | sgFireball | the night + the Milky Way | a fireball sighting |
| card-sg-skull | HOT AIR, COLD BLOOD | legendary | sgSkull | a cold night over the roofs | a skull-balloon sighting |
| card-sg-btc | FIX THE MONEY, FIX THE WORLD | legendary | sgBtc | the festival at sunset | a ₿ balloon sighting |
| card-zebra | ZEBRA | uncommon | sheen (pink) | zebra hide | FULL HOUSE |
| card-camo | CAMO | uncommon | scan | ERDL camo | THE REGULAR |
| card-velvet | VELVET ROOM | rare | spot | oxblood velvet | level 32 |
| card-aurora | AURORA | rare | veil | glass | level 35 |
| card-rosegold | ONYX & ROSE GOLD | rare | sheen (rose) | onyx + lattice | level 40 |
| card-gold | GOLD FOIL | rare | rays | hammered foil | level 44 |
| card-flame30 | THE 30-NIGHT FLAME | rare | embers | charcoal | a 30-night streak |
| card-marble | MARBLE & GOLD | rare | twinkle | marble + gold veins | MADE MAN |
| card-neoncamo | NEON CAMO | rare | neoncamo | night camo | PARTY ANIMAL |
| card-carbon | CARBON | rare | sheen (cyan) | carbon weave | PATIENCE PAYS |
| card-confetti | CONFETTI | rare | confetti | party violet | MANY HAPPY RETURNS |
| card-circuit | CIRCUIT | rare | circuit | PCB green | OVERCLOCKED |
| card-noir | VELVET NOIR | epic | tube + smoke | black velvet | level 58 |
| card-sapphire | SAPPHIRE & SILVER | epic | sheen + twinkle | sapphire | level 60 |
| card-legend | PRISM LEGEND | epic | holo + twinkle | black holo | level 70 |
| card-century | CENTURY | epic | flames + embers | burnished bronze | a 100-night streak |
| card-marquee-gold | THE MARQUEE · GOLD BULBS | epic | bulbs | black velvet | KINGPIN |
| card-penthouse | PENTHOUSE | epic | penthouse | the night view | PENTHOUSE SUITE |
| card-wildfire | WILDFIRE | legendary | wildfire | the burning ridge | a 200-night streak |
| card-eternal | ETERNAL FLAME | legendary | eternal | violet night | a year's streak |
| card-witness | THE WITNESS | legendary | witness | the star chart | THE WITNESS (every legend) |
**Held back** (a plain strip for owners until built): PLATINUM (level 95), THE HOUSE (level 100), FOUNDING MEMBER — passes/vault-1c.md.

## THE VAULT 2A (Nov 3) — passes/vault-2a.md
### THE 3 HELD CARDS
FOUNDING MEMBER (`card-founder`, legendary — `js/fx/opening.js`): OPENING NIGHT — the title's own NEON tubes + SPEAKEASY (the city's tube
alphabet) on the speakeasy's roof frame, lighting letter by letter (`sign-kit.js#ignite`), searchlights once it all burns, the EST. 1924 date
stone in the parapet; the member's REAL № in gold (DOM: `.vl-no` on the strip, `.vl-fc-stamp` on the full card — it carries MEMBER SINCE).
THE HOUSE (`card-house`, legendary, level 100 — `js/fx/house.js`): the speakeasy's front in full blaze (a baked Deco facade, the blade + its
chasing bulbs, NEON, a gold neon crown over the door) + gold willows raining behind the roof. PLATINUM (`card-platinum`, EPIC): brushed
platinum (`assets/vault/platinum.webp`), a CSS diamond-cut bevel, a cold sheen (`sheen` opts.gain) + the light running the bevel (`bevel.js`).

### THE EMBLEM SYSTEM — a shape + a finish (`js/vault/emblem-art.js`)
**An emblem is a box of small SVG LAYERS** (`span.ve`): the still parts in the base layer; **each moving part its own layer, an HTML `<i
class="ve-l">` holding its `<svg>`, animated on transform + opacity** (the compositor moves it — Chromium never composites an animated SVG
element, and motion on SVG children repaints the whole SVG every frame: that cost 8 legendaries + the samples 26 fps); a part moving INSIDE
the shape slides under a mask of it (`i.ve-m`). No canvas, no filters; crisp at 3×; reduced motion = the still frame.
**THE 28-PT RULE:** every shape reads at 28 pt on a lobby strip — one or two tubes / one bold silhouette + one bright accent; effects TOUCH or
SURROUND the shape (frost at the tips, embers beside it, its own lights, a glint), never fill over it.
**The finishes:** NEON (the house style — the sign's tube stack: glass → two soft glows → body → white-hot core → a hairline highlight; the
commons; TODAY'S 12 SIGN-UP SHAPES are commons on it, in the player's colour) · PRISM (a rainbow sweeping inside) · GOLD (struck gold, a shine
+ a glint) · CHROME (black chrome, a light gliding; the TR-3B's own lights) · ICE CRYSTAL (frost growing at the tips) · MOLTEN (crust, glowing
cracks, a drip, embers) · GLITCH (ghosts, the jump, slices tearing) · GALAXY (a nebula drifting inside, stars, ports).
**TUBE STYLES** (separate unlocks, worn on ANY neon emblem — `TUBE_STYLES`): TWO-TONE (a gradient: the colour into its partner) · BREATHING
(the glow layer + the body layer breathe) · A CHASING LIGHT (six runs of white-hot light flashing in turn round every tube). A special finish
keeps its own light (a tube style shows on neon only).
**NAME GLOWS** (`js/vault/glows.js` — the NAME only, never the level line; always readable): a class on the name + (moving ones) a few
aria-hidden pieces along the text (`--w` ≈ its width from its letters, so they follow fitName's size + its two lines; fitName measures
without them). EMBER (common, still) · GOLD LEAF (gold leaf + a glint) · ELECTRIC (arcs on the top edge + off the end). No filter under a
moving piece.
**THE PROMINENCE RULE = the budget** (`emblems.js#prominence` → `.is-lead / .is-even / .is-quiet`; durations × `--sp`): LEAD (the emblem
out-ranks the card) plays EVERY layer; EVEN plays its signature motion only (the secondary layers `.ve-2` rest on their still frame);
QUIET holds the still, lit frame; **a LEGENDARY card always leads** — its emblem + the name glow (`.vg-still`) hold still.

### THE SET (2A's samples — n 98–114 in THE CARD LAB, waiting for the owner's marks)
| # | id | name | finish | tier | earned |
| --- | --- | --- | --- | --- | --- |
| 98 | emb-key | THE KEY | neon | common | HOUSE WARMING |
| 99 | emb-sweetheart | SWEETHEART | neon | common | level 6 |
| 100 | emb-owl | THE OWL | neon | uncommon | NIGHT OWL |
| 101 | emb-prism | FOUR ON THE FLOOR | prism | rare | FOUR ON THE FLOOR (PRISM DROP) |
| 102 | emb-house | THE HOUSE (the crown) | gold | legendary | level 100 |
| 103 | emb-snowflake | SNOWED IN | ice crystal | epic | SNOWED IN |
| 104 | emb-torch | THE FLAME | molten | epic | a 50-night streak |
| 105 | emb-lightning | RAINMAKER | glitch | epic | RAINMAKER |
| 106 | emb-sg-tr3b | LIGHTS OUT | chrome | legendary | a TR-3B sighting |
| 107 | emb-sg-ufo | I WANT TO BELIEVE | galaxy | legendary | a UFO sighting |
| 108 | (the 12 sign-up shapes) | — | neon | common | everyone (the one you pick) |
| 109–111 | tube-twotone · tube-breath · tube-chase | TWO-TONE · BREATHING · A CHASING LIGHT | tube styles | common · uncommon · uncommon | levels 7 · 30 · 26 |
| 112–114 | glow-ember · glow-gold · glow-spark | EMBER · GOLD LEAF · ELECTRIC | name glows | common · rare · rare | FIRST ROUND · level 50 · COMEBACK KID |

### THE PICKER (`js/vault/picker.js#stylePicker`) + THE LAB
Emblems, tube styles + name glows are ROWS like the cards: each the player's OWN strip (their worn card) wearing that option, WEARING ✓, tap to
wear (the first row = none); ONE effect surface for the whole VAULT section (`progress/profile.js`). The lab: EMBLEMS + GLOWS tabs (marks as
for the cards), A FULL LOBBY's WEAR THE SAMPLES (`&wear=emb,glow`; one id on all 8: `&wear=<id>`); `vault-bench.mjs WEAR=…`.

### A NEW EMBLEM / FINISH / GLOW plugs in by
its item row (`api/_lib/catalog.js` + `lab-text.js`) → `js/vault/catalog.js#LAB` (kind emblem / tube / glow, its finish) → its art: an emblem
`EMBLEM_ART[id] = { shape, finish }` (+ its shape in `SH`); a NEW finish a `FIN` builder (the base layer still, each moving part
`C.layer('cls')`, a part moving inside the shape `C.mask(d).layer()`, secondary motion `ve-2`) + its keyframes (transform + opacity only,
× `--sp`); a glow `GLOW_ART[id]` + its `.vg-<look>` CSS → three refine passes at 28 pt on a strip first → the owner's marks.

### Measured (the mini PC, 4× CPU, the real compositor, 3×)
8 legendaries + every sample's emblem + glow 58.7–59 fps (before the layer fix: 33.5) · THE 8 SAMPLES (guests in their sign-up shapes) 60 ·
THE 8 SIGHTINGS 60 · THE NEW 21 60 · 8 still cards with every emblem LEADING 60 (0.9 ms main thread).

## THE VAULT 2B (Nov 3) — passes/vault-2b.md
| file | what |
| --- | --- |
| `js/vault/dress.js` | DRESS YOUR CARD — `dressPanel(data, o)` (the profile's ONE panel + YOUR COLLECTION) · `openDress(data, o)` (the pinned live strip, 4 tabs CARD · EMBLEM · GLOW · TUBE, tier-edged tiles, a tap wears it at once — `o.wear(slot, id)` → a refusal puts it back —, a long-press / VIEW FULL › → the full card) |
| `js/core/member.js` · `api/_lib/members.js` | MEMBER NUMBERS — `memberLabel(mn)` ('0001') · the server's back-fill + `memberNo(pid)` (the owner Nº 1, then join order, never reused) |
| `js/core/dev-cards.js` · `js/fx/dev-switch.js` · `js/fx/dev-source.js` | THE TWO DEV CARDS (ONE OF ONE · DEV — the owner's only) · THE SWITCHBOARD · THE SOURCE |
| `js/fx/speak-front.js` | THE CITY's REAL SPEAKEASY face-on for a card (the city's own wall painters + its real rooms; lazy, baked per size) — FOUNDING MEMBER's + THE HOUSE's full cards |
| `js/vault/beat-sync.js` | ON THE BEAT's clock (a party night + a song: each pulse layer's animation set onto the grid) |

### DRESS YOUR CARD — renamed CUSTOMIZE in THE VAULT 2C (the owner's approved mock — Downloads\NEON\vault\dress-your-card.png)
The profile: your strip as it is now (live), the worn pieces' names, a big **DRESS YOUR CARD** button; **YOUR COLLECTION** = what you own (cards ·
emblems (+ your own shape) · glows · tubes) — never a total of what exists. The dress screen: the strip PINNED (its own surface — it leads),
"THE LOBBY SEES THIS" · **VIEW FULL ›**, the worn names, 4 tabs; tiles 3 across, each edged in its tier colour (`--tier-*`), the worn one ticked,
the DEV cards first then the rarest; the EMBLEM / GLOW / TUBE tabs start with YOUR SHAPE / NO GLOW / PLAIN TUBE; the TUBE tab says so when a
special finish is worn (tube styles light neon). Taps = pointerdown + pointerup (iOS); a hold (450 ms, or the browser's own long-press) → the
full card; the hold's lift never clicks what it opened. The profile preview: `progress-preview.html?view=profile&dress=1&tab=emblem&dev=1`.

### THE TWO DEV CARDS
| n | id | name | tier | effect | earned | lab |
| --- | --- | --- | --- | --- | --- | --- |
| — | card-dev-switchboard | THE SWITCHBOARD | ONE OF ONE · DEV | devSwitch | the owner's (ADMIN_PIDS) — never earnable | 116 strip · 118 full: new |
| — | card-dev-source | THE SOURCE | ONE OF ONE · DEV | devSource | the owner's (ADMIN_PIDS) — never earnable | 117 strip · 119 full: new |
Legendary in every rule (the prominence rule, the laser — `rgb2`: gold → red · green → magenta), a tier above in LOOK: the tag ONE OF ONE · DEV
(ONE OF ONE on the strip), THE DEVELOPER · № 0001 on the plate (THE DEV on the strip). Their art shows on HIS card without an APPROVE (he is the
lab — approved.js); they lead the lab.

### THE REST OF THE SET (all NEW in the lab, n 115–159 — waiting for the owner's marks; only APPROVED art ships)
| id | name | finish / kind | tier | earned |
| --- | --- | --- | --- | --- |
| emb-crown | THE CROWN | neon (+ gems) | rare | level 55 |
| emb-cocktail | LAST CALL | neon | common | LAST CALL |
| emb-diamond | DIAMOND | neon | common | level 13 |
| emb-glasses | THE CREW | neon (+ a clink) | uncommon | THE CREW |
| emb-sunrise | EARLY BIRD | neon (+ rays) | uncommon | EARLY BIRD |
| emb-bullseye | DEAD ON | neon (+ a hit) | uncommon | DEAD ON |
| emb-crescent | CRESCENT | neon (+ a star) | uncommon | level 37 |
| emb-butterfly | BUTTERFLY | neon (wings flap) | uncommon | level 9 |
| emb-peephole | KNOCK KNOCK | neon (+ the peephole) | rare | KNOCK KNOCK |
| emb-stars | THE TRIPLE | neon (+ the light hops) | rare | THE TRIPLE |
| emb-wings | WINGS | metal · silver | epic | FREQUENT FLYER |
| emb-bitcoin | HODL | coin | epic | HODL |
| emb-sunburst | SUNBURST | metal · gold | epic | level 75 |
| emb-ace | THE ACE | metal · obsidian | legendary | level 90 |
| emb-sg-blackbird | SKY KING | metal · black (+ afterburners) | legendary | a Blackbird sighting |
| emb-sg-f22 | AFTERBURNER | metal · grey (+ flames) | legendary | an F-22 sighting |
| emb-sg-ghostship | THE FLYING DUTCHMAN | spectral | legendary | a ghost-ship sighting |
| emb-sg-aurora | SKY DANCER | aurora | legendary | an aurora sighting |
| emb-sg-fireball | MAKE A WISH | comet | legendary | a fireball sighting |
| emb-sg-skull | HOT AIR, COLD BLOOD | balloon · bone | legendary | a skull-balloon sighting |
| emb-sg-btc | FIX THE MONEY, FIX THE WORLD | balloon · ₿ | legendary | a ₿ balloon sighting |
| emb-hw | THE LANTERN | neon (+ the candle, a bat) | epic | Halloween (a counted match on its days) |
| emb-tg | HARVEST | autumn | epic | Thanksgiving |
| emb-xmas | DECK THE HALLS | neon (+ bulbs chasing) | epic | Christmas |
| emb-nye | AULD LANG SYNE | neon (+ bubbles, a burst) | epic | New Year's |
| tube-gold | GOLD TUBE | tube style | rare | level 47 |
| tube-flicker | OLD SIGN | tube style | rare | level 65 |
| tube-ember | SLOW BURN | tube style | uncommon | a 14-night streak |
| tube-burnt | BURNT OUT | tube style | rare | level 53 |
| tube-beat | ON THE BEAT | tube style (party grid) | epic | level 80 |
| glow-afterglow | AFTERGLOW | glow · still | common | a 7-night streak |
| glow-ice | ICE | glow · still | common | level 15 |
| glow-neon | NEON | glow | uncommon | level 28 |
| glow-candle | CANDLELIGHT | glow | uncommon | DAILY BREAD |
| glow-frost | FROST | glow | uncommon | level 23 |
| glow-fire | FIRE | glow | rare | level 38 |
| glow-starlight | STARLIGHT | glow | rare | STARGAZER |
| glow-tinsel | TINSEL | glow | rare | SEASON'S GREETINGS |
| glow-champagne | CHAMPAGNE | glow | rare | level 85 |
| glow-prism | PRISM | glow | epic | level 70 |
| glow-glitch | GLITCH | glow | epic | level 63 |

**The new finishes** (`FIN` in emblem-art.js, each receiving its art row): METAL (a palette — silver · gold · black · grey · obsidian —, a struck
face, a dark edge + a bright bevel, engraved lines, a shine gliding, a glint; its shape's own accents: afterburners, rays, feather tips, the
ace's running light) · COIN · SPECTRAL · AURORA · COMET · BALLOON · AUTUMN. **A neon shape may carry its own accents** (`SH[x] = { tubes, fx(C),
group }` — `group` = layers moved as ONE HTML layer: the butterfly's wings). **Name glows**: a moving copy of the name = `data-t` → `::before /
::after` (opacity / transform only; off on a two-line name, a legendary card, reduced motion). **Tube styles**: GOLD TUBE · OLD SIGN · SLOW BURN ·
BURNT OUT · ON THE BEAT join TWO-TONE · BREATHING · A CHASING LIGHT.

### Measured (the mini PC, 4× CPU, the real compositor, 3×)
8 THE SOURCE strips 60 fps (3.4 ms busy) · 8 THE SWITCHBOARD 60 (4.0) · 8 still cards wearing the busiest 2B mix (every emblem leading, every
moving glow) 60 · 8 legendaries + the same 60 · THE 8 SAMPLES ~56 with the 2A wear and the 2B wear alike (2B adds nothing measurable).

## THE VAULT 2C (Nov 3) — THE POLISH — passes/vault-2c.md
| file | what |
| --- | --- |
| `js/vault/gems.js` | THE TIER GEM (`gemEl(tier, { dev })`) — the strip's tier mark (no words); THE DEV GEM |
| `js/fx/fire.js` | REAL FIRE — a baked noise flipbook (`fireSheet`) stamped as whole tiles (`drawFire`) — INFERNO + CENTURY |
| `js/progress/trophies.js` | ACHIEVEMENTS AS TROPHIES (the profile) |
| `404.html` | THE WRONG DOOR (docs/title.md) |

### THE LAB 2.0 (`js/vault/lab-views.js` — the owner: "getting cluttered")
Reached from the ☰ menu (**THE LAB** — admins only: the same server `whoami` yes as the ADMIN row, `screens/harbor/remote.js`; nobody else
gets the row) or `/lab`. A sticky **top bar**: `‹ THE CITY` (→ `/`) · **THE LAB** (a tap = back to the top) · **"N NEED YOU"** (ALL CAUGHT UP at 0).
**4 sections** (CARDS · EMBLEMS · GLOWS + TUBES · LOBBY TEST, each with its count under the filter) + **5 filters** (NEEDS YOU — the default:
never marked + CHANGED · CHANGED · FIX · APPROVED · ALL, each with its count; empty → "All caught up." + where the rest is). **ONE ROW PER ITEM**:
its tier gem, its number + name, NEW / its state, the id; the slim strip — **FULL CARD ›** flips it to the full card IN PLACE (the face keeps
its own marks: `full-<card>`; the toggle says when the other face needs him); the **CHANGED** box; what it does; APPROVE · FIX · CUT. A row
stays put after a mark until the filter changes (nothing jumps away under the finger). **LOBBY TEST** = A FULL LOBBY + a SETTINGS ·
DIAGNOSTICS sheet (STILL, the tiers, the diagnostics row, the WEAR mixes) + the fps readout (only there).
**VERSIONS + CHANGED**: `js/vault/catalog.js#LAB_V` holds each item's version (1 unless bumped); `api/_lib/lab-text.js#LAB_CHANGES` the dated
"what changed" line per version (server-side with the names — the lab gets them with the marks: `labMarks → { marks, text, changes }`). A
mark stores the version it was made at (the server stamps `v` — `cleanMark`); `labStatus(id, mark)` = new · changed · approve · fix · cut. **A
pass that edits an item's art or words bumps its LAB_V + writes its line** — it drops back into NEEDS YOU beside his old mark. (An APPROVE still
ships the newer art: CHANGED asks for a re-look, it never pulls approved art.) **NEW** = a lab number above the highest this device has seen
(`localStorage vl:seen`; a first visit marks nothing new). The export (`scripts/lab-export.mjs`) adds each item's version + CHANGED.
Preview: `vault-preview.html?marks=old` (every item approved at v1 + INFERNO's FIX — what he meets after this pass) · `&marks=done` (all caught
up) · `&filter=` · `&face=full` · `&fd=1` (every sample member a FOUNDER).

### THE TIER GEM + THE DEV GEM (`js/vault/gems.js`, css `.vl-gem*`; the owner's approved mock tier-gem.png)
The strip's tier pill → a small gem in the bottom-right corner, no words (the full card + CUSTOMIZE still spell the tier): COMMON a smooth grey
stone · UNCOMMON a small green emerald cut · RARE a blue faceted brilliant · EPIC purple + a sparkle popping · LEGENDARY a bigger gold brilliant
+ a glint crossing + a tiny star. **THE DEV GEM** (the dev cards' strips — "very bright, vivid, pulsing, dancing"): 27 pt, three prismatic
facet sets cross-fading (the facets cycle the spectrum), a rainbow light sweeping across inside the gem (a CSS mask of it), a slow bright pulse,
four sparkles popping in turn, a soft rainbow halo turning — it plays even on a legendary-led strip (THE PROMINENCE RULE's one exception). Built
like the emblems: small SVG layers, each moving part its own HTML layer, transform + opacity only; reduced motion = the still frame (the dev gem
bright, its sparkles lit). FOUNDING MEMBER's № → gold letters in the top corner (no pill).

### "1 OF 1" (was "1 OF 1 · DEV") + FOUNDER + THE BADGE SLOT
**LOBBY 2.0 B (the owner, Nov 4 7:12 am): the pill reads just "1 OF 1"** — "· DEV" cut off FOUNDER on THE SWITCHBOARD; and THE TOP LINE NEVER CLIPS
(`vault/full.js#fitTop`: NEON SPEAKEASY · FOUNDER / · № n + the pill side by side — the letter-spacing tightens first, then the size; checked on all 50
full cards at 390 / 402 / 430 + a 72 % viewer). Both dev full cards v3.
The dev cards' tag (`core/dev-cards.js#ONE_OF_ONE`) reads **1 OF 1 · DEV** (the owner's ADD-ON, 7:16 pm — it replaced "#1 OF #1"), BOLD (the
display face at 900), on the FULL CARD + in CUSTOMIZE only — the strip has the dev gem. **FOUNDER** is the badge's word everywhere (the full
card's pill, the Gilded card's pill); the CARD keeps its name FOUNDING MEMBER. **`js/vault/full.js#BADGE`** — each card's SLOT (`pill` under the
top line · `top` IN the top line: "NEON SPEAKEASY · FOUNDER" — the dev cards, their № dropped there (it's under the name) · `stamp` — FOUNDING
MEMBER's own gold stamp) + its MOVING PARTS as fractions of the card (the VU meter + lamps, ON AIR, the jacks; the typed line + the sign; the
sign + the boxer's window; the building; the UFO). Ambient motion that fills a card (confetti, sparkles, flames, a firework's trails) is the
card's ground, not a part. The harbor `vault` group proves no badge box overlaps a part at 390 / 402 / 430.

### NO CARD-GAME ROOM + THE SHADOWBOXER (`js/fx/speak-front.js#drawBoxer`)
The speakeasy bake never paints the retired card game (`o.live` — the back room, default `['back']`); FOUNDING MEMBER's + THE HOUSE's full cards
draw **THE SHADOWBOXER** live in that pane — the city's own painter (`screens/harbor/boxer.js#boxerRoom` + `core/harbor-boxer.js#boxerPreview`,
his first round looped over 160 s), through the card's painter in the front's wall units, clipped to the glass. Reduced motion: a still pose.

### REAL FIRE (`js/fx/fire.js` — the owner's FIX on INFERNO; CENTURY shares it)
The 1A teardrops → a baked FLIPBOOK of a real fire field: 12 frames of a 192 × 144 band (domain-warped value noise, periodic across + looped in
time, through a blackbody ramp), baked once per page (~a few tens of ms) into one atlas sprite; a frame draws only whole tiles of it (never
sliced: a tile stretched to different heights side by side tears the field) — three layers crossing (tall + slow behind, quicker in front), a
dark wash under the name plate, the ember bed, the sparks, the breathing edge.

### CUSTOMIZE + ONE EMBLEM SYSTEM (`js/vault/dress.js`, `core/items.js#SIGN_EMBLEMS`)
DRESS YOUR CARD is **CUSTOMIZE** (the profile's **CUSTOMIZE YOUR CARD**; the screen's title CUSTOMIZE). The 12 sign-up shapes are COMMON emblems
`emb-sign-<shape>` ("NEON BOLT" … — public: every member owns them, so their names ship with the site) — STARTER (owned from the first second;
the rows back-fill into `pstats/{pid}/it` on 'me' once stats exist — a sign-up writes no stats: a first match must still look like one); they sit in CUSTOMIZE's EMBLEM tab with the earned ones (no "YOUR SHAPE" tile). Wearing one = the profile's shape
(`profiles/{pid}/a`, + the device's own identity) and takes a worn earned emblem off (`es`). Sign-up still picks a starter; afterwards the
emblem / card / glow / tube change ONLY in CUSTOMIZE; EDIT PROFILE = the name + the colour (`screens/setup.js#pickShape`). GLOW tiles: the name
pinned to its tile (Safari sized the grid item to its text, so the fit never saw the overflow) — shrinks, then two lines.

### THE PROFILE (docs/profiles.md "THE PROFILE's ORDER") + ACHIEVEMENTS AS TROPHIES (docs/progression.md)

## LOBBY 2.0 A (Nov 3) — CENTURY's sunburst, THE STEPPED PLATE, FOUNDER's glint, EQUIP — passes/lobby-2a.md
- **CENTURY** (epic, v3 — `js/fx/deco.js`, `fx/index.js#century`): NO FLAMES (the owner: too close to INFERNO) — burnished BRONZE foil + an ART
  DECO SUNBURST pressed into it from behind the name plate (broad + slender rays, stepped arcs, a sun disc — baked once, one drawImage a frame),
  a slow LIGHT SWEEP across the metal, golden embers (embers, no bed). **THE MOTIF RULE**: no two cards share a main motif on the strip — the
  flames are INFERNO's alone (tests/lobby-2a.test.mjs); GOLD FOIL's gold rays (lit in turn at the strip's right foot) are the nearest cousin.
- **THE STEPPED PLATE** (`strip.js#stepPlate`): the name row full length, the level row past "LV n" by 12 pt then a rounded inner step; the
  card's own glass clipped (`clip-path: path()`) + an SVG edge line in the plate's own inset colour; ONE ResizeObserver for every plate (never a
  frame loop); a step < 30 pt → the plate as it was; `.vl-lv` is `align-self: flex-start` (measured by its text).
- **FOUNDER**: 900 weight, a touch bigger, a glint every ~5 s (`.vl-fc-fd::after`, `.pg-card-fd::after` — transform + opacity).
- **EQUIP, NOT WEAR**: TAP TO EQUIP · EQUIPPED ✓ · "tap a reward to equip it" (labels, ARIA, the lab's EQUIP THE SAMPLES, the CSS badge).
- The guest list (`screens/room-guests.js`) is the strips' new home in the room: the calm cut, approved art only, THE JOIN ENTRANCE (a new strip at
  its full animation for 3.2 s, then calm).

## THE PLATE COVERS ITS WIDEST LINE (LOBBY FIXES, Nov 4)
The full card's plate takes its second line's real width (the level, or THE DEVELOPER · № 0001) + the emblem + its paddings as a floor —
`full.js#coverWidest` (one ResizeObserver; a min-width beats the plate's 70 % cap). The strips' stepped plate already reached past its lower row.
Checked by `tests/integration/plate-preview.html` (every full card + strip, no Firebase) in the harbor's `platefit` group (390 / 402 / 430). Both
dev full cards v4 (CHANGED in THE LAB).

## THE COVER — A FULL CARD HOLDS EVERYTHING BEHIND IT (THE SPEED PASS B, Nov 4 — the owner's 8:05 pm lag)
`vault/full.js#openFullCard` (CUSTOMIZE's VIEW FULL, GUESTS, a player tap, the profile — every full card on top) covers what's behind it:
`fx/renderer.js#fxCover(keep)` HOLDS every fx surface outside the card (not drawn, not cleared — the frame it showed; its clock stopped and
resumed from that frame on CLOSE; covers count), `body.vl-covered` pauses every CSS animation outside `.vl-full` (css/vault.css), the city's
frames are held (`vl-cover` → scene.js), the backdrop 92 % near-black, never a backdrop-filter. Measured (4× CPU, 402 @3, SKY KING over
CUSTOMIZE): 33.3 ms a frame (206 of 240 slow) → 16.7 ms (0 slow) — the same as the card alone. `fxBehind()` = slots drawn behind (tests).
A NEW pop-up that shows a full card goes through `openFullCard` (or calls `fxCover` itself).

## A FONT THAT ARRIVES LATE (THE SPEED PASS, Nov 4)
`ui/fit.js#fitName` + `full.js#fitTop` fitted on `document.fonts.ready` + a box resize only — a name whose face started loading AFTER `ready`
resolved kept the fallback face's fit and overflowed once the real face landed (LOBBY FIXES' cloud red: 2 of 42 glowing names). Every fitted
element now re-fits once more on the FontFaceSet's `loadingdone` (`fit.js#onFontsLoaded` — one listener; an element shown then removed drops
out). Proof: the vault group's "A FONT THAT ARRIVES LATE" (a fitted name whose face grows wider + `loadingdone` → it fits again).

## THE GEMS ON THE FULL CARD (SHELL 2.0 A, Nov 5 — docs/harbor/passes/shell-a.md; refs/shell/tier-gem-cards.png + oneofone-corner.png)
The full card's tier pill is gone: `full.js#tierBadge` puts the SAME tier gem the strips wear (`gems.js#gemEl`, 28 pt + its glow) in the card's
TOP-RIGHT corner, on the top line beside NEON SPEAKEASY (`fitTop` measures it). The tier's NAME shows only where cards are picked (CUSTOMIZE's
grid, THE LAB) + in the card's screen-reader label. **THE 1-OF-1 BADGE** (the dev cards; the gift cards when they come): the animated rainbow
DEV GEM (32 pt) with "1 OF 1" to its LEFT in the gem's own light (`.vl-fc-1of1` — a spectrum on the letters + a dark edge under them, so it reads
on gold), inset so its halo clears the rounded corner; the strips keep the rainbow gem alone (calm). A new card needs nothing: its tier picks
its gem. **The results rows** wear the strips too (`ui/strip-board.js` — one shared surface a list, calm) — THE PROMINENCE RULE + the cover's
budget apply as in the guest list.
