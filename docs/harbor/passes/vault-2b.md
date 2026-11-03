# THE VAULT 2B — DRESS YOUR CARD · THE TWO DEV CARDS · MEMBER Nº 0001 · THE REST OF THE EMBLEMS, GLOWS + TUBE STYLES — Nov 3 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 3 (afternoon)" (part 58): THE DEVELOPER CARDS (build both), MEMBER Nº 0001, the sighting reveal check
(the names on one line, the polaroid framing the ghost ship, &sgdemo snapping too early), VAULT 2A done + its decisions, the lab's tab row
over the lobby header, THE PICKER IS CONFUSING → DRESS YOUR CARD (approved). The lab's marks export (refreshed first): every 2A sample +
the 3 held cards' strips APPROVED; two FIX notes — FOUNDING MEMBER's full card ("much higher quality — the close building looks cheap") and
THE HOUSE's full card ("much higher quality, more flair, more special"). One session, the groups in order, no helper agents. The deep doc:
`docs/vault.md` ("THE VAULT 2B").

## What changed
**Group 0 — the owner's fixes + DRESS YOUR CARD + MEMBER NUMBERS**
- **DRESS YOUR CARD** (`js/vault/dress.js`, the owner's approved mock): the profile shows ONE panel — your strip as it is now (live), the
  worn pieces' names, a big DRESS YOUR CARD button — + YOUR COLLECTION (cards · emblems · glows · tubes you own; never a total of what
  exists). The long VAULT lists left the profile. THE DRESS SCREEN: your strip pinned at the top, live ("THE LOBBY SEES THIS" · VIEW FULL ›),
  the worn names, 4 tabs CARD · EMBLEM · GLOW · TUBE, compact tiles 3 across edged in the tier colour (the one palette), the worn one ticked
  ✓, the DEV cards first; a TAP wears it AT ONCE (the strip changes, the server is told, a refusal puts it back); a LONG-PRESS (or VIEW FULL ›)
  → the full card. The pinned strip is its own surface (it leads); the tiles another inside the scrolling list (only on-screen ones draw).
- **MEMBER NUMBERS** (`api/_lib/members.js`, `js/core/member.js`): a real member number, separate from the name tag's 4 digits (his card
  showed "№ 3112" = his tag) — `profiles/{pid}/mn`, server-written, sequential by when the profile was made, never reused, never changed;
  the owner (the first id in ADMIN_PIDS) = Nº 1 (reserved); the first call back-fills every existing profile by its `at` (claimed by a
  transaction), then each new profile takes `members/next`. Shown as `0001` on the membership card, FOUNDING MEMBER's gold stamp, the full
  cards' top line + the DEV cards' plate. The lab dresses its cards with Nº 0001.
- **THE SIGHTING REVEAL**: the polaroid ALREADY centred on the tapped legendary (`composeCity` crops round its box, clamped to the screen) —
  the ghost ship was missing because **&sgdemo snapped ~2 s in, while it faded in at the edge**. The demo now waits until the legendary is
  FULLY LIT (its tap box carries `a` — the ghost ship's alpha) and at least 70 % on screen (the ship enters the phone's right edge at ~½ pt a
  second: its whole hull can take minutes), held 0.9 s. The pair's tiles are the card's height (the art centred) — the two names on ONE line;
  the emblem tile shows the REAL emblem once approved (or on the owner's own &sgdemo).
- **THE CROWN** (`emb-crown`, level 55): its OWN shape — an imperial crown (violet arches to a gold orb + cross, a gold band, three gems
  twinkling) — no second three-spike crown beside THE HOUSE's.
- **THE LAB**: the sticky tab bar is solid (its soft edge hangs below it); the lobby's header keeps room under the two rows.
- **THE TWO FIX CARDS, rebuilt on THE CITY's OWN SPEAKEASY** (`js/fx/speak-front.js`): the city paints every wall of its speakeasy flat in
  its own units before projecting it — so the cards draw THE SAME BUILDING face-on through one wall map (the brick by kiln run, the chevron
  belt, the dentil cornice, the Deco crest, the EST. 1924 date stone, the wall-washers' cones, the barbershop + its awning, THE REAL ROOMS lit
  — the bar, the jazz room's honey shade, the card game under its green lamp, the TV apartment), baked once per size, lazy. **FOUNDING
  MEMBER** (full card): the sign on its steel frame standing on the real speakeasy's crest; each letter catching with a burst of sparks; the
  searchlights rising from behind the roof; gold confetti once it all burns. **THE HOUSE** (full card): the real speakeasy in full blaze on
  its lit pavement — the rooms' light pulsing in the bar's colours, the barbershop lit up, the blade + its chasing bulbs, NEON over the
  awning, the gold crown over the side door, gold willows behind the roof washing the front + glinting off the gilt, gold sparkles drifting.
  The approved STRIPS untouched.

**Group 1 — THE TWO DEVELOPER CARDS** (ONE OF ONE · DEV — `js/core/dev-cards.js`, `js/fx/dev-switch.js`, `js/fx/dev-source.js`)
- Granted by the SERVER to the owner's profile (ADMIN_PIDS) on /api/profile 'me' (a profile not in ADMIN_PIDS loses one if it ever held it);
  'style' refuses them to anyone else; in no reward table; names on the server only. Legendary in every rule (the prominence rule, the laser);
  a tier above in look: the "ONE OF ONE · DEV" tag (gold into magenta; "ONE OF ONE" on the strip), THE DEVELOPER · № 0001 on the plate
  (THE DEV on the strip). They lead the lab. Their art always shows on his own card (approved.js) — he IS the lab.
- **THE SWITCHBOARD**: the brushed brass desk under a warm lamp — its beam slanting in, dust motes drifting in it; the jack field (brass rings,
  deep holes, each with its lamp); five glowing patch cables SNAKE IN from below + between jacks, each landing in its brass plug with a SPARK
  + its jack's lamp lighting in the cable's colour; once plugged, a bead of light runs down each cable on the BEAT (the party song's grid when
  one plays — audio/beat.js —, a steady 112 bpm else); ON AIR buzzing on in red neon with a stutter + a buzz now + then; the VU meter's
  needle + ten level lamps dancing (full card); a glint sliding over the brass; the laser gold into red. A 10-s loop (they plug in, hold,
  slip out).
- **THE SOURCE**: a CRT — the city's REAL code (fetched from the site: the timetable, the effect renderer, the progress engine, the beat)
  streaming in columns at three depths (far small, dim + soft · near big, bright + sharp), lines running GOLD; the cursor TYPES
  `city.build({ by: 'LOEWFIZZLE' })` (LOEWFIZZLE in gold) → ENTER (every column runs gold at once) → NEON (the title's own tubes) ignites
  letter by letter, sparks off each → THE SURGE (a flash + a spray of sparks); glitch passes (ghosts + torn bands), the rolling refresh band,
  scanlines; the sign collapsing to a line at the loop's end; the laser green into magenta. A 12-s loop.
- `laser.js` takes `rgb2` (the head's colour into the tail's).

**Group 2 — THE REST OF THE EMBLEM SET** (24 new — every emblem item in the catalog has art now; `js/vault/emblem-art.js`)
- NEON with their own accents: LAST CALL (martini + olive) · DIAMOND (gem + facets) · THE CREW (two glasses, a CLINK) · EARLY BIRD (the
  sun's rays pulsing out) · DEAD ON (a hit rippling out) · CRESCENT (+ a twinkling star) · **BUTTERFLY** (new — level 9: purple wings, pink
  accents, opening + closing — one GROUP layer, scaleX) · KNOCK KNOCK (the door's peephole sliding open: light, two eyes, a blink) · THE TRIPLE
  (light hopping star to star) · THE CROWN.
- METAL: WINGS (silver aviator's wings, taller feathers for 28 pt, a gold roundel + star) · SUNBURST (the Chrysler fan in gold, rays catching
  the light in turn) · THE ACE (obsidian spade, light running round its gold edge, a red glow breathing) · SKY KING (the Blackbird's plan-form
  in black chrome, two afterburners flickering) · AFTERBURNER (the F-22's plan-form in grey chrome, twin flames + shock diamonds).
- COIN: HODL (struck gold, the ₿ embossed, a flip on its edge now + then). SPECTRAL: THE FLYING DUTCHMAN (the ghost ship in pale green glass,
  lanterns flickering, mist drifting, breathing). AURORA: SKY DANCER (a night badge, curtains drifting over a mountain line). COMET: MAKE A
  WISH (the head blazing, fragments peeling off). BALLOON: HOT AIR, COLD BLOOD (bone white, eyes glowing orange, the burner puffing) · FIX THE
  MONEY (orange gores, the ₿, a gold pulse once a block). These replace the anchor placeholder in the sighting reveal.
- **THE SEASONAL EMBLEMS** (epic; a counted match during the holiday's own days → its emblem, once, kept forever — `core/progress.js#SEASONAL`,
  registered by the server catalog; the 30 achievements untouched): THE LANTERN (Halloween — a jack-o'-lantern, its face lit by a flickering
  candle, a bat crossing) · HARVEST (Thanksgiving — a maple leaf turning amber → crimson, a leaf drifting down) · DECK THE HALLS (Christmas — a
  tree, a glinting star, its bulbs chasing) · AULD LANG SYNE (New Year's — a coupe, bubbles rising, a firework over it).
- The lab: `&sheet=1` on the EMBLEMS tab = a contact sheet (each at 72 + 28 pt, tube styles too).

**Group 3 — THE REST OF THE NAME GLOWS + TUBE STYLES**
- **14 glows** (every glow item a look): COMMON still — EMBER, AFTERGLOW, ICE · moving — NEON (the tube buzzing hotter now + then),
  CANDLELIGHT (a candle's flicker), FROST (new, level 23 — crystals creeping onto the top edge), GOLD LEAF, ELECTRIC, FIRE (new, level 38 —
  burning letters, flame tongues licking off them), STARLIGHT (stars twinkling round the name), TINSEL (silver into gold, specks of tinsel),
  CHAMPAGNE (bubbles rising off the letters), PRISM (the spectrum through them, a breathing shine, rainbow glints), GLITCH (new, epic, level
  63 — a red + a cyan copy tearing off + snapping back). A moving copy of the name = `data-t` → `::before / ::after` (opacity / transform only;
  off on a two-line name, a legendary card, reduced motion). The lab: `&sheet=1` on the GLOWS tab.
- **8 tube styles**: TWO-TONE, BREATHING, A CHASING LIGHT + GOLD TUBE (gold glass, one slow run), OLD SIGN (the old sign's flicker), SLOW BURN
  (ember-red smoulder, sparks rising), **BURNT OUT** (new, rare, level 53 — one tube half dead), ON THE BEAT (a steady glow — on a PARTY NIGHT
  the glows + the core pulse on the song's own grid: `js/vault/beat-sync.js` sets each pulse layer's animation clock — getAnimations — only
  when it drifts past 25 ms).

**Group 4 — tests + docs** (below).

## Decisions
- **DRESS YOUR CARD as approved**; the profile's VAULT lists are gone (the picker's row builders stay for the lab + previews).
- **The dev cards stay `legendary`** underneath, a tier above in LOOK only (their tag, laser, №) — a sixth tier would have broken the one
  palette + its tests; **their art shows on his own card without a lab APPROVE** (he is the only holder and the lab); their marks still count.
- **Member numbers live on the profile (`mn`)**, back-filled lazily the first time any profile asks (no migration script); a deleted
  profile's number is never handed out again (the counter only moves forward).
- **The two FIX cards draw the city's real speakeasy** (the city's own painters, never a second building) — the same rule as the sighting
  cards' models.
- **The seasonal emblems are a grant step, not achievements** (the 30 stay 30); BUTTERFLY at level 9, FROST 23, FIRE 38, BURNT OUT 53,
  GLITCH 63 (the client's WHEN list matches).
- **The demo's "fully visible"** = fully lit + ≥ 70 % on screen (the strict "whole box" never came for the ghost ship on a phone).
- A long-press's LIFT no longer clicks what opened under the finger (the full card's backdrop closed it at once — a real-phone bug the
  finger test found).

## Measured (the mini PC, 4× CPU, the real compositor, 3×)
8 SOURCE strips + the 2A wear 60 fps (3.4 ms busy) · 8 SWITCHBOARD strips 60 (4.0) · 8 still cards wearing the busiest 2B emblems — every one
LEADING — + every moving glow 60 (1.3–1.9 ms) · 8 legendaries + the same 60 (3.8) · THE 8 SAMPLES ~56 with the 2A wear AND the 2B wear alike
(4.3 vs 4.4 ms — the sample cards' own effects at 4× on this run; 2B adds nothing measurable).

## Known issues + held back
- **Everything new waits for the owner's marks**: the 2 DEV cards (strip + full — first in the lab), the 2 rebuilt full cards (n 95 + 96 —
  their FIX marks stand until he re-marks), THE CROWN (115), the 24 emblems (120–143), 5 tube styles + 11 glows (144–159). Only approved art
  ships (the dev cards excepted on his own card).
- Nothing held back below the bar.
- `components.js#avatar` (every game screen, today's lobby) is still the old icon — LOBBY 2.0 brings the strips (and the emblems) into the room.
- ON THE BEAT: its code path is tested (the clock set through each layer's own animation); its pulse on a real party night is for the owner's eye.
- The lab's marks export is still public (→ the switch-over).

## Hand-off — BOARD 2.0 + LOBBY 2.0
The strips (stripEl), the full cards, the emblems (emblemEl), the glows (applyGlow) and the tube styles are complete + plug in anywhere; the
board's rows and the lobby's guest list take `stripEl({ card, name, lv, emblem, avatar, color, tube, glow, no })` on ONE surface
(mountStrips) — the prominence rule + the speed budget come with them. `memberLabel(profile.mn)` is the member's №.

## Tests (this pass)
unit (+ `tests/vault-2b.test.mjs`: DRESS YOUR CARD's structure, member numbers, the dev cards owner-only + in no reward table, every 2B item
real + earned + its art + its lab text, every catalog emblem / glow / tube with art, the seasonal grant, THE MOTION RULE for 2B's keyframes,
the reveal's labels + the demo's wait) · `/api` on the emulators (+ `tests/integration/vault-2b.test.mjs`: the back-fill by join order with
the owner Nº 1, the next number, never reused, never changed; the dev cards to the owner only — a stranger + a crew member refused, a planted
one taken back, names only to him; the seasonal emblems through matchStep) · rules (+ a member number, the counter + a dev card written by
nobody) · the harbor `vault` group (50 lab cards with the DEV cards first, 49 full cards, the EMBLEMS tab's 46 items in all 15 finishes, the
GLOWS tab's 14, DRESS YOUR CARD's panel + screen, DRESS YOUR CARD BY FINGER — real taps wear an emblem / a glow / a card, VIEW FULL, a
long-press) · the `sightings` group (+ the ghost ship's demo: fully lit, inside the photo, the names on one line, the real emblem).

## THE FULL LOCAL RUN (the mini PC, Nov 3)
unit 1100/1100 · rules 59/59 (the rules FILE unchanged — no re-publish: `mn` + `members/` are server-only by the default deny) · /api: server
29/29, progression 10/10, sightings 4/4, lab 2/2, vault-2b 3/3 · smoke 6/6 · the profile E2E 75/75 (THE BOARD's row check on the re-run, as in
1A–2A; its vault steps now wear a card through DRESS YOUR CARD) · THE FULL HARBOR SUITE 930/932 at 4 shards (~22 min): THE RESIZE (green alone —
400 ms) + LOAD WEATHER's holiday-night jump = the known ones from 2A's log; the `vault` group 31/31, `sightings` 11/11 (+ the ghost ship).

## THE CLOUD (the two-run cap)
Run 1 (the harbor tag): tests GREEN; harbor 9/10 — the `models` job's THE SHOW check ("0 bursts lighting the city"): it waited for a burst
lighting the city, then sampled AGAIN, and on the cloud's software renderer the brief light was gone by then — a race in the test (no
fireworks code changed this pass). The check now counts the burst its wait saw. Run 2 (`gh workflow run harbor -f job=models`): 102/102 GREEN.
Live on www.neonspeakeasy.com from the harbor-tagged push.
