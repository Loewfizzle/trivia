# THE VAULT 1C — THE 8 SIGHTING CARDS + THE HELD-BACK CARDS (+ the tier palette, the welcome) — Nov 3 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 3 (late morning)" (part 56): VAULT 1B done + live (cloud green first run), the owner's 1B review
(speed fixed on his iPhone — 8 legendaries 61 fps; the name, the sheet, THE FULL PROGRAM ✅; the no-tap UFO fixed ✅ on his re-test),
everything in the lab APPROVED (the 8 new strips + all the full cards, corner words included), the VAULT 2 decisions, LOBBY 2.0's sounds
delivered. One session, the groups in order, no helper agents. The deep doc: `docs/vault.md`.

## What changed
**Group 0 — two small fixes.** THE ONE TIER PALETTE: `js/core/rarity.js` (+ its CSS twin in `css/base.css`: `--tier-<id>` light on dark,
`--tier-<id>-ink` words on paper) — COMMON grey · UNCOMMON green · RARE blue · EPIC purple · LEGENDARY gold. THE PROGRAM: every row a tier
badge + its name tinted (`programTier`: the legendaries + the ghost ship LEGENDARY; the fireworks, the raid, a holiday's big moment EPIC; a
window scene under half the nights RARE; the other scenes, the showcase's medium tier, the party's phases UNCOMMON; the everyday city
COMMON; his own moments by their jack's lane). The cards' tier tags + the picker read the tokens. **I'M NEW HERE** closes the sheet with a
welcome toast — "WELCOME IN — PICK A NAME WHEN YOU JOIN YOUR FIRST ROOM" (a toast, not the setup screen: the name is picked on HOST / JOIN).

**Group 1 — THE 8 SIGHTING CARDS** (each the city's OWN model / painter in a scene of its own, LEGENDARY + THE BORDER LASER, slim + full;
`js/fx/sg-*.js`, the shared `js/fx/sg-kit.js` + `js/fx/sg-jets.js`):
- **LIGHTS OUT** (`sg-tr3b`) — the city's TR-3B (`legends.js#tr3bSprite`, its corners + circuitry, now exported) under a moonlit overcast:
  WHITE corner lights + the RED heart pulsing, energy racing the circuitry, its warm under-rim from the city fading as the city dies — the
  windows go out in a wave from under it (each column flickering as it fails), the quay lamps sputter out, a hold in the dark, the power
  stutters back (a 10-s loop).
- **SKY KING** (`sg-blackbird`) — the city's SR-71 RE-BAKED for the card at a hero angle (`scripts/bake/sr71-card.mjs` → `assets/vault/sg/
  sr71-hero.webp`, 837 px, golden light; the bake reports its nacelles' exits) over a racing sea of cloud at dusk: twin afterburners +
  shock diamonds, sunset contrails, the sun's wash on its skin, a glint riding the spine.
- **AFTERBURNER** (`sg-f22`) — the city's F-22 re-baked (`f22-card.mjs` → `f22-hero.webp`, 639 px, from below + banked), three in a TIGHT
  VIC high over a white deck in a hard blue day: afterburners, VAPOUR CONES blooming + snapping off in turn, the sun on the canopies.
- **THE FLYING DUTCHMAN** (`sg-ghost`) — the city's ghost ship (`ghostship.js#ghostArt`, lifted out of its bake — the city calls it too)
  against a big moon: green lanterns, its glow breathing, its rippling reflection, fog banks + mist off the hull, bats across the moon.
- **SKY DANCER** (`sg-aurora`) — the city's aurora looks (`AURORA_LOOKS`) as a curtain + fine rays over the harbor, a brightening wave, its
  reflection on the water.
- **MAKE A WISH** (`sg-fireball`) — the green fireball streaking in, flaring (the sky + the water lit), breaking into four burning pieces +
  sparks, its persistent train cooling green → blue; the Milky Way.
- **HOT AIR, COLD BLOOD** (`sg-balloons#skull`) — the city's skull balloon (`balloonArt`) over the rooftops on a cold overcast night; the
  burner ROARS in bursts, lighting the skull from below, embers rising.
- **FIX THE MONEY, FIX THE WORLD** (`sg-balloons#btc`) — both city ₿ balloons at the sunset festival (the orange near, the black farther,
  the others small far off); burners now + then; every few seconds a NEW BLOCK — a gold pulse + a ring.
Three refine passes each at 402 (+ WebKit 402 × 874 @3), side by side with I WANT TO BELIEVE + `card-i-want-to-believe.png`. **The reveal,
the album + the picker**: `js/vault/full.js#upgradeScene` swaps the reveal's pair placeholder + the album's no-photo tile for the card's REAL
SCENE (the full card without its words) once its full card is approved; the picker already followed approval. Long sighting titles balance
on two lines.

**Group 2 — THE HELD-BACK CARDS: 21 of 24 built** (strip + full each, wide variety — no effect + material pair repeated):
UNCOMMON ZEBRA (real hide + a pink shine) · CAMO (ERDL + a night-vision scan + a reticle) — RARE (+ glowing edges) VELVET ROOM (oxblood
velvet, gold piping, a drifting stage spotlight + dust) · AURORA (the aurora under glass) · ONYX & ROSE GOLD (onyx, a rose-gold lattice, a
shine) · GOLD FOIL (hammered foil + a sunburst's rays catching the light) · THE 30-NIGHT FLAME (an ember bed, low flames, sparks) · MARBLE &
GOLD (real gold veins + glints) · NEON CAMO (the camo's own patches traced in neon from an edge map of its texture, a wave of power) · CARBON
(the weave + a cold shine) · CONFETTI (paper + curls tumbling in 3D) · CIRCUIT (traces + vias, signals racing, an overclocked burst) — EPIC
(two effects, `fx combo()`) VELVET NOIR (a crimson tube + smoke) · SAPPHIRE & SILVER (a silver shine + leaf glints) · PRISM LEGEND (a holo
band + glints) · CENTURY (flames + golden embers) · THE MARQUEE · GOLD BULBS (a double row of gold bulbs + two searchlights) · PENTHOUSE (the
city far below: lights twinkling + traffic streaming) — LEGENDARY (a scene + the laser) WILDFIRE (a burning ridge, pines, lit smoke,
embers) · ETERNAL FLAME (a violet-into-gold flame in a bronze brazier, spiralling sparks) · THE WITNESS (a gold star chart: every legend
as a constellation, lighting in turn). New effects: `scan` `spot` `rays` `embers` `twinkle` `confetti` `circuit` `holo` `bulbs` `penthouse`
`veil` `neoncamo` `witness` `blaze` (+ `combo`). Textures (pure CC0 / public domain only — no ShareTextures file, not the unlisted woodland
camo): zebra · camo (+ dark) · velvet oxblood + black · carbon · marble-gold (Marble001) · onyx + sapphire (Marble016) · foil-gold (Ice002's
crinkle) — `scripts/build-vault-textures.mjs` (+ a `keep` mode for the camo's own colours, `ONLY=` for a re-run), credits in ☰ → CREDITS.
**Every word legible**: the busiest + lightest full cards (zebra, marble, foil, neon camo, camo) get a dark band top + bottom under the
corner words.

**THE LAB**: the 8 sighting cards FIRST (n 34–41 + their full cards 42–49), then the held-back 21 (50–70 + 71–91); A FULL LOBBY gains THE
8 SIGHTINGS + THE NEW 21 (the mixes chosen by lab number now — the list's order changes as new sets go first); a tab tapped deep down the
~12,000-px list brings the new view's top into sight. `node scripts/lab-export.mjs` prints the names again (they moved server-side in 1B).
**THE LOOK REVIEWS**: `tests/integration/card-review.html?cards=…` (each card's strip + full card, nothing else on the page; `&strips=0` ·
`&full=0` · `&still=1` · `&labmarks=all`) — a long page needs a tall `--sizes` (only on-screen slots draw).

## Decisions
- **The sighting cards draw the city's own art** — the models the city bakes (SR-71, F-22) re-baked at a card angle from the SAME recipes'
  pages (`scripts/bake/card-shots.mjs`), the TR-3B / the ghost ship / the aurora / the balloons from the city's own painters (exported,
  lazy-loaded — `sg-kit.js#city`), never a second version.
- **The palette's green is darker on paper** (UNCOMMON ink `#136034`: ≥ 4.5 : 1 on the Program's lighter paper); **the medium tier is
  UNCOMMON** (the airliners + the extra patrols — several a night); **the ghost ship is LEGENDARY** on THE PROGRAM (a sighting).
- **A light / busy material gets dark bands** under the corner words on its full card (the owner's rule, every word legible) — the approved
  cards are untouched.
- **Three held back** — PLATINUM (level 95), THE HOUSE (level 100), FOUNDING MEMBER: each wants its own scene + the owner's direction
  before it's built (fewer, better); owners see a plain strip in its palette until then.

## Measured (the mini PC, 4× CPU, 3×, the GPU path)
A FULL LOBBY of THE 8 SIGHTING CARDS 58.4 fps (1/180 slow, p95 16.8 ms — the same as 8 UFO cards; the laser is most of it); THE NEW 21
(8 of them) 60 / 0; 8 WILDFIRE 60 / 0; 8 NEON CAMO 60 / 0; the 8 samples + 8 legendaries unchanged (60 / 0). The diagnostics row works
as before. **The iPhone is the verdict** — the lab's readout: A FULL LOBBY → THE 8 SIGHTINGS + THE NEW 21.

## Known issues
- **Every new card waits for the owner's marks** (37 new strips + 37 full cards in the lab) — only APPROVED art ships.
- **Held back:** PLATINUM, THE HOUSE, FOUNDING MEMBER (above).
- **The marks export is still public** (ids + marks + notes) → THE SWITCH-OVER's list.
- **A clock-dependent radio test** (the harbor `radio` group's greyed-jack note): its page opens at `when=2026-11-03T21:00` while the server's
  radioState reads the real clock — on Nov 3 itself the desk + the server disagree; it fails the same on 1B's code. → the next pass: a date
  the test computes, or the server's clock pinned for it.
- The SR-71 + F-22 hero bakes need the source models (`art/models/…/*.glb`, git-ignored); the F-22's was copied in from `Downloads\grok\models`.

## Hand-off to VAULT 2A (emblem + glow samples)
The picker's rows + THE ONE TIER PALETTE are the pattern for emblems + glows; every sighting card pairs with its emblem (VAULT 2's matched
set — LIGHTS OUT's real TR-3B silhouette with white corners + a red centre, SKY KING's real Blackbird outline); `sg-kit.js#city` lazy-loads
any city painter an emblem finish wants; `fx combo()` stacks two effects on one slot (an emblem's finish + its tube style).

## Tests (this pass)
unit (+ `tests/rarity.test.mjs` — the palette twins, every pair ≥ 4.5 : 1, the hues, THE PROGRAM's mapping, the welcome · `tests/vault-1c.test.mjs`
— every new card an item at its tier, earned somewhere, its LOOK + effect + material, its strip + full card in the lab with the server's
names, the sighting cards first, the three still held back plain, the hero bakes + the city's exported painters) · the names-only-to-owners
leak test (card names scrubbed from the effect code's comments) · the harbor `vault` group (25: the lab's 47 items with the sighting cards
first, the 44 full cards, THE SIGHTING'S SCENE for all 9, SPEED at 4× for THE 8 SIGHTINGS + THE NEW 21, THE PROGRAM's tier colours on every
row, the finger + WebKit scrolls of the longer lab).

## THE FULL LOCAL RUN (the mini PC, Nov 3)
unit 1087/1087 · rules 58/58 (the rules FILE unchanged — no re-publish) · /api: server 29/29, progression 10/10, sightings 4/4, lab 2/2 ·
smoke 6/6 · the profile E2E 75/75 (the board-order check on the re-run, as in 1A + 1B) · THE FULL HARBOR SUITE 921/925 at 4 shards
(~21.5 min): THE RESIZE + THE BILLS MOVE green alone (radio + desktop 57/58 — the radio note below — windows 59/59: load timing), LOAD WEATHER's holiday-night
jump the existing failure (1A + 1B), RADIO's greyed-jack note fails the same on 1B's code (its page opens at 9 pm TODAY while the server reads
the real morning clock — a clock-dependent test, logged for the next pass, not this pass's); the vault group 25/25.

## THE CLOUD (the two-run cap)
Run 1 (the harbor tag): harbor 10/10 GREEN; tests RED — the names-only-to-owners test found AFTERBURNER + LIGHTS OUT in js/fx/sg-*.js
comments: its folder check matched '/' only, so on the mini PC (backslash paths) it never looked in js/fx, vault or progress. Fixed (both
separators — a planted name now fails it locally) + the comments use the ids. Run 2 (the ci tag): tests GREEN. Live on www.neonspeakeasy.com.

## THE OWNER'S MARKS (Nov 3, 11:29–11:34 am) + the follow-up
Every new card marked: the 8 sighting strips APPROVED except THE FLYING DUTCHMAN (FIX: "make the boat move"); their full cards APPROVED except
LIGHTS OUT (FIX: "TR3b body needs to be more black"), SKY KING (FIX: "Blackbird needs to be more black") + THE FLYING DUTCHMAN (FIX: "the moon is
blended into the ship", "ship needs movement"); the held-back 21's FULL cards all APPROVED — their SLIM strips (#50–70) still unmarked (a strip
ships only once approved). Fixed: the TR-3B's hull under a black wash over its own triangle (its lights wash the metal less); the Blackbird
under a near-black copy of its own bake (the sunset only a rim); THE FLYING DUTCHMAN's moon moved clear of the ship's whole crossing (left
on the full card, far right on the strip) + the ship SAILS — it materialises, crosses on a bigger swell (bob, roll) with a glowing wake + a bow
wave, dissolves + comes again (a 26-s crossing). Checked at 402 + WebKit 402 × 874 @3 + a 3-frame burst. **&sgdemo** plays the sighting on
its own (~2 s after the craft is in view) — the owner's preview, by design; without it nothing fires until a tap. Live with the deploy tag
(the two cloud runs already used).
