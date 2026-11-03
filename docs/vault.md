# THE VAULT — the cards, THE CARD LAB + THE EFFECT LIBRARY (THE VAULT 1A, Nov 2–3 2026)

What a player COLLECTS (cards · emblems · name glows) and how each one LOOKS + MOVES. The items themselves (ids, names, tiers, who gets
them) are PROGRESSION's (`docs/progression.md`, `js/core/items.js`); this doc is their ART: the slim strips, the effect library, the lab
where the owner approves them. The owner's decisions: `docs/harbor/decisions.md` §15 (THE VAULT + THE VAULT — THE SPLIT, SLIM FIRST + THE
EFFECT LIBRARY); the passes: `docs/harbor/passes/vault-1a.md` (THE STYLE TEST — this one). **The owner's marks: `docs/vault-lab-marks.md`
— the next VAULT pass reads it FIRST** (`node scripts/lab-export.mjs` refreshes it from the live site).

| file | what |
| --- | --- |
| `js/vault/catalog.js` | PURE — THE LAB's catalog (every item the lab shows, in order, + what it does), `cleanMark` (the server's check), the sample guests |
| `js/vault/strip.js` | THE SLIM STRIP — `stripEl(row)` (the plate: emblem + NAME + LV; the material; the tier tag; the frame) + `mountStrips(host, rows, { calm })` (a list on ONE effect surface) + `LOOKS` (each card's material + effect) |
| `js/vault/emblems.js` | THE TWO TEST EMBLEMS (the bolt in NEON + PRISM — inline SVG, CSS motion) + THE PROMINENCE RULE (`prominence(cardTier, emblemTier)`) |
| `js/vault/lab-views.js` · `js/vault/lab.js` · `lab.html` | THE CARD LAB's views (shared with the no-Firebase preview) · the `/lab` page (admins only) |
| `js/vault/approved.js` | ONLY APPROVED ART SHIPS — `isApproved(id)` / `approvedIds()` from the lab's public export |
| `api/_lib/lab.js` (+ `api/admin.js`) | the marks: `labMarks` / `labMark` (admins only, audited, a history) + `GET /api/admin?lab=export` |
| `js/fx/renderer.js` | THE EFFECT LIBRARY's ONE SHARED RENDERER (surfaces + slots, one clock, one rAF, its own tier guard) |
| `js/fx/kit.js` | the shared kit: a seeded RNG, eases, PRE-BAKED SPRITES (glow, sparkle, heart, smoke puff, flame tongue) |
| `js/fx/index.js` + `smoke · frost · flames · prism · marquee · glitter · laser · ufo .js` | the effects (the registry) |
| `css/vault.css` | the strips (`vl-`), the emblems, the lab; the surface (`fx-`) |
| `assets/vault/*.webp` · `scripts/build-vault-textures.mjs` | the card textures (1050 × 660 WebP — tinted copies of Grok's CC0 picks; credits in ☰ → CREDITS) |
| `tests/integration/vault-preview.html` | THE LAB without Firebase (`?view=strips|lobby &mix=samples|legend|<card id> &bare=1 &still=1 &tier=0|1|2`) |

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
the marks, 8 legendaries at 4× CPU = 60 fps, only on-screen slots draw + a hidden page stops, reduced motion = still frames).
