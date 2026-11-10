# PD-5B — PRISM DROP: THE THREE CARDS + THE FINAL POLISH (Nov 9 2026, night)

The second half of PD-5 (docs/games/plan.md "PD-5 SPLIT + PD-5A" + "PD-5B"): PRISM DROP's three cards — FIRST KO (common) · PERFECT CLEAR (rare) ·
COMEBACK (epic) — awarded by the server from the room's own record + drawn in code, then the polish: the night clear burst, the silent day-match
preview, the holiday hook. **No rules change** (database.rules.json untouched — the flags ride the existing results the director writes; the awards
are the server's). **Still 8 functions.** Never the live site: the emulators + local previews only. Never the three words.

## Step 0
e7a89986 — docs/games/plan.md "PD-5B — THE THREE CARDS + THE FINAL POLISH", appended unchanged.

## Group 1 — THE AWARDS (rules first)
- **The flags** — `core/match-report.js#prismExtra`, from the room's OWN copy of the match (PD-2's results + the eliminations in `game.out`), each
  checked against it:
  - `firstko` — a BATTLE (2+ players), `ko ≥ 1` AND an elimination credited to this player in `game.out` (`by: uid`), never more KOs than opponents
    (a hacked `ko` count with no elimination behind it = no flag; SCORE RUSH + SURVIVAL never — SURVIVAL credits no KOs).
  - `pc` — `pc ≥ 1`, any mode, never more perfect clears than lines cleared. **A solo run counts:** the solo lane already hands every row's flags
    to the award engine (`progress.js#matchStep` → `noteMatch({ flags: row.f })` → `awardAll`, solo or not — nothing new built), so a perfect clear
    in a solo SCORE RUSH / SURVIVAL earns PERFECT CLEAR (tested).
  - `comeback` — WON a BATTLE (2+ players, the standings' win AND `game.winner` = this player) with `dz: 1` (PD-2: the stack reached the top 5 rows).
- **COMEBACK ≠ COMEBACK KID (found here):** `achievements.js#noteMatch` raised the generic `gf.comeback` (COMEBACK KID: "last at the halfway point,
  then the win" — OVERCLOCK's flag) for ANY game's `comeback`. PRISM's danger-zone win is its own card, so the generic line now skips PRISM
  (`x.gid !== 'prism'`); the counters keep it as `prism-comeback` (a dash).
- **The achievements + cards** (server-only names + lines — `api/_lib/catalog.js`): `first-ko` → `card-first-ko` (common) · `perfect-clear` →
  `card-perfect-clear` (rare) · `comeback` → `card-comeback` (epic); `GAME_ACHIEVEMENTS.prism` = four-on-the-floor + the three. 41 achievements.
- **Tests:** `tests/prism-cards.test.mjs` (each flag from a fixture match — tests/fixtures/finals.mjs; the negatives: a solo "win", a SCORE RUSH KO,
  dz without the win, a fake KO count, more PCs than lines, another winner in the record; one unlock however often the match is reported; never
  COMEBACK KID; the keys database-safe; the colour families = neon.js); `achievements.test.mjs` (41, the game's list); `vault-names.test.mjs` green.

## Group 2 — THE CARD ART (drawn in code)
- **ONE file + its data:** `js/fx/pd-cards.js` (the motion, on the SHARED surface through THE GL PAINTER — never a canvas per card) + `js/fx/pd-specs.js`
  (PURE: each card's scene in units of 1000 × 630, its strip band, its hero boxes — read by `vault/hero.js` + `vault/layout.js`). PENTHOUSE · THE
  DIAL's pattern: every static part baked ONCE per slot size at the phone's ratio (one sprite — crisp at 3×), the moving parts baked sprites +
  stamps (transform + opacity; the KO lettering baked — no text in the GL frame). The night's neon (PD-3): a dark core, a hot tube in each piece's
  colour family, a white core line — `PD_COL` = neon.js `NEON_BASE` (tested).
- **FIRST KO** (common, a 7.5-s loop, mostly at rest): ONE big cyan block (the long piece's colour) as a lit jewel (a glowing core, facets, an inner
  tube, a sheen + a glint) breathing over the board's faint grid, two hairline cracks at rest; it trembles, white-hot CRACKS race from the impact to
  its edges, it BURSTS — each shard a real piece of the block (baked from the block itself), flying + spinning out, sparks ahead, a white flash + a
  ring — and "KO" pops in RED NEON tube letters, holds, fades; the block re-forms. The full card: a bigger block + KO, the opponent's dim stack below
  in its light. Reduced motion = the cracked block with KO lit over it.
- **PERFECT CLEAR** (rare + its GLOWING EDGES, white-violet): the EMPTY well, spotless — ice-white tube walls + floor, a clean glass grid; a beam of
  white light into a glass PRISM over the mouth splits into the seven piece colours; the rainbow FAN sweeps slowly across the well, landing on the
  floor as a pool of colour, lighting each wall in the colour that reaches it; glints twinkle on the clean glass. The strip shows the prism's foot,
  the fan + the whole well (wider than tall — it reads at 64 pt).
- **COMEBACK** (epic — two effects together): a stack up AGAINST the red DANGER LINE (pulsing like an alarm); ONE white-hot long piece drops through
  the top row's hole into the last gap → light RACES along the four rows → they CLEAR in a burst of sparks → the TOP ROW FALLS four rows, away from the
  line (round 3: it was a fade — now the real collapse), the line cools + LIGHT RISES out of the well (a column + motes) → it climbs back.
- **THE RULES:** THE HERO-SPOT RULE + THE SLIM-CARD LONG-NAME STANDARD — the heroes centred 0.80 · 0.785 · 0.78 across, clear of the gem (`heroMisses()`
  empty; `'W'.repeat(12)` + MAXIMILIANOS looked at 390 / 402 / 430); THE CARD LAYOUT RULE — each full card's `heroFull` in `layout.js#heroBox` (the
  plate keeps off it), every full card's art clear of its printed name at the foot (round 1 had the wells under it); THE CARD TEXT STANDARD — the
  standard full card (no own text treatment); the gems from `vault/gems.js`, the tiers from `core/rarity.js`.
- **THE ONE EXCEPTION — a common that moves:** THE TIERS say COMMONS STAY STILL; the owner's PD-5B spec gives FIRST KO its own loop. Built as asked
  (mostly at rest — the burst every 7.5 s), named in `tests/vault.test.mjs` (`COMMON_MOVES`). **For Ben:** if it should be still like the other
  commons, FIX it in THE LAB — the still frame (the cracked block + KO) is one line away.
- **THE MATERIAL = the still frame** (found in the reveal review — the after-match tile showed a near-black square: a drawn-in-code card has no
  picture): `scripts/build-pd-cards.mjs` bakes each card's reduced-motion FULL frame into `assets/vault/pd/<card>.webp` (3–7 KB) = the full card's
  material (`.vl-fcm-pd-*`) — the tile now shows the real art in miniature; the effect paints over it everywhere it runs. Re-run after an art edit.
- **THE LAB:** n 211–213 (the strips) · 214–216 (the full cards), each with its motion line (server-side `lab-text.js`). **NEW items stay v1 with NO
  change line** — THE LAB 2.0 shows them NEW in NEEDS YOU (`vault-2c.test.mjs`: a change line needs a version bump; a bump is for an item ALREADY
  marked). Unapproved = not shipped (the plain palette everywhere — `approved.js`).
- **Three refine rounds** (+ a fourth on the full cards), against REDLINE + PHOTO FINISH side by side (`card-review.html` — new: `&name=`): round 1 —
  the full cards' art under the printed name, FIRST KO's block a hollow outline, PERFECT CLEAR's strip a cut-off glass; round 2 — the block a jewel,
  the scenes moved up, PERFECT CLEAR's strip shows the prism + fan + well, a second hotter fan pass (the colours never muddy), COMEBACK clear of the
  gem; round 3 — COMEBACK's top row falls (the real collapse), FIRST KO's KO off the gem's corner, PERFECT CLEAR's walls bolder on the strip, fewer
  sparks; round 4 — FIRST KO's full card bigger + its light on the stack, COMEBACK's motes under the top line. Shots: `pd-5b/`.

## Group 3 — THE FINAL POLISH
- **THE BURST BEFORE THE COLLAPSE** (PD-3's note — the night clear burst lit where the cleared rows WERE, over the rows that had already dropped in):
  the engine removes rows at once (no clear delay), the light's race + burst run 150–490 ms after. Now the NEON board draws the stack AS IT WAS just
  before the clear until the burst — `neonfx.js#preClear` (PURE: the post-clear cells + the event's rows → the cells before it) held by
  `board.js#holdClear` for `holdMs` = the race + 70 ms (≤ 300 ms; 0 with reduced effects) — then it collapses. The game never waits: the engine, the
  next piece + every timing untouched; only the settled stack's picture is held (the landing preview hidden while held). The preview's `&fx=clear*`
  loops now show it (the n full rows under the stack, held, burst, the stack drops back); `&collapse=now` = the old look; `prism-shots.mjs` pd3 has
  `clear2/4-race-before` + `-burst-before`. Shot: `pd-5b/clear-burst-before-after.jpg` (left = before: the light on rows WITH GAPS — the ones that
  dropped in; right = after: the light on the complete rows themselves). Tests: `tests/prism-pd5b.test.mjs` (a real engine clear rebuilt exactly).
- **THE SILENT DAY-MATCH PREVIEW:** only `&beat=1` installed the audio + its TAP FOR SOUND; every other state started the song locked. Now EVERY state
  that plays the song (all but `&state=final` — the podium's music is the console's) gets the same button + the engine's tap listeners; a test
  browser (`navigator.webdriver`) gets none unless `&sound=1` (the shots stay clean); `&mute=1` = none. Checked in the browser pane:
  `?look=day&set=day&n=5&stack=8&bot=1` → the button → one tap → Roof Tops (`prismd1`) playing, gain 1.
- **THE DAY SET'S LOUDNESS through the game's chain:** PRISM's chain has NO per-song or per-set gain (each song's voice gain 1 → the danger low-pass →
  the lift → out), so the files decide: measured with ffmpeg's ebur128 — prismd1–5 **−14.4 LUFS each** (peaks −1.2 … −3.2 dBFS): equally loud. **For
  Ben (no change — the night set stays as it is):** the five NIGHT songs measure −7.6 / −8.7 / −8.9 / −12.5 / −15.0 LUFS — most of them 5–7 dB
  louder than the day set; a room switching sets between matches will hear the day set quieter.
- **THE HOLIDAY HOOK** (`js/games/prism/holiday.js` — PURE): ONE interface — a variant NAME (the city's calendar, `core/sky.js#holidayOf`) → that
  look's overrides: night `{ palette: { edge, frame, well, sparks, flash } }` (never the pieces' colours — the families hold) · day `{ paper, world }`;
  `withHoliday(look, base, name)` returns `base` itself when there's no variant (nothing rebuilt); the view picks the day's variant ONCE at mount
  (`holidayNow` — full holiday days; never a flip mid-match) and routes its palette, paper + doodle through it. `VARIANTS` is EMPTY: nothing visible
  changes. A unit test with a dummy Halloween variant. A new holiday = one row (+ its doodle's drawing in page.js).
- **The preload graph** regenerated (prism: 43 modules, 397 KB).

## Group 4 — LOOK REVIEW
Every shot at 390 / 402 / 430 (+ 1440 × 900 once), moving (bursts of 16 at 450 ms): `pd-5b/strips-burst-402.jpg` (the three strips through a loop),
`cards-longname-430.jpg` ('W' × 12), `cards-maximilianos-390.jpg` (beside PHOTO FINISH), `cards-1440.jpg`, `round1-402.jpg` (where it started),
`moment-reveal-390.jpg` (the end-of-round moment: FIRST KO + 2 MORE, the card's tile), `podium-390.jpg` (the console's podium — unchanged).

## Tests (local, the mini PC)
- unit 1494 / 1494 · rules 69 / 69 (no rules change) · /api 44 / 44 · smoke 6 / 6 (both playable games, the ten hidden refused)
- PRISM: FAST 54 / 54 · the FULL e2e-prism 81 / 81 (8 phones, the host killed, refresh, offline, late joiner, the podium, rematch)
- e2e-profiles 139 / 139 — new: the PRISM block (one BATTLE: ALICE wins from the danger zone with a KO + a perfect clear → FIRST KO + PERFECT CLEAR +
  COMEBACK revealed on HER podium with their card tiles + granted to her; BOB's perfect clear → his PERFECT CLEAR only; never COMEBACK KID). (A first
  run read 138 / 139 — the known false red on the board-row player page after server.test on the same emulators; fresh emulators: 139 / 139.)
- harbor: platefit + cardfit + stripfit (the plate covers its widest line + THE HERO-SPOT RULE at 390 / 402 / 430 — 45 heroes; THE SLIM-CARD LONG-NAME
  STANDARD with 'W' × 12 + MAXIMILIANOS — 77 strips) green; vault 58 / 58 (its pinned counts updated: THE LAB 58 cards, 57 full cards; a first parallel
  run's 8-sightings speed check read 54 fps under the other groups' load — alone: green).
- Not a City 2.0 pass: the full harbor suite not run (the ci tag); no boot change (THE BOOT PRELOAD still 300 modules; the boot budget test green).
- Not measured on their own: the three cards' frame cost (they ride the GL painter's one batch like PENTHOUSE · THE DIAL — a static bake + ≤ ~60 stamps).
