# SKINS 2A — PRISM DROP: THE SHARE CARDS (NO PILLS, ONE RHYTHM) + WATERCOLOR REWORK + CRAYON TEXTURE + GROK's SOUNDS — Nov 14 2026

The plan: docs/games/plan.md "PRISM DROP — SKINS → SKINS 2A" (Step 0, `caef1d99`). On the mini PC. **No database rules change**, no `/api`
change. The reference: docs/prism.md "THE SKINS" + docs/progression.md "SHARE TODAY".

## THE OTHER PILLS — found, NOT fixed here (the owner's list; a read-only search of css/, js/, the root html — Nov 14)
A pill = a shape wider than tall with fully rounded ends. The share kit's are gone (Group 0). Everything else that still draws one:

**LIVE (players see it today)**
- `css/components.css:1098` `.btn` (+ `.btn-sm` :1117, `.btn-xl` :1118) — **THE NEON TUBE: nearly every standard button in the app** (sheets,
  setup, results, profile) — `border-radius: 999px` on a 54 / 44 / 58-px-tall box. (Only the dailies' PLAY / SHARE buttons override it to 10 px:
  daily.css:135 / 171, password.css:233, coastclear.css:288.)
- `css/title.css:598` `.nd-pill` (+ `.rdk-pill` in a room) — the dock's centre glass bar (BOARD · GAMES · YOU / YOU · GUESTS · GAMES · CHAT);
  the rain / frost on it follow the same shape (`js/screens/harbor/glasswx.js:475, 651, 661`).
- `css/title.css:853` `.nd-rejoin-btn` — REJOIN above the dock · `:1047` `.rc-note` (+ `.rc-note-t / -x`) — the room's one-line note ·
  `:1082` `.rc-name` — the name label over a person in the room city · `:1153` `.rdk-votes` — "3 of 7 want a rematch".
- `css/components.css:874 / 883` `.net` — the SIGNAL LOST banner · `:867` `.dup-tab` — the second-tab banner · `:1003` `.mh-hint` — "SOUND IS
  OFF — SETTINGS" · `:940` `.lb-delta` — the "+N" beside points on the results' rows.
- `css/chat.css:63` `.chat-chip` — the quick-message chips · `:99 / 156` `.chat-pill` — NEW MESSAGES ↓.
- `css/bring.css:37` `.byc-chip` — "bring your card" over the dock · `:51` `.setup-byc-go` — the same on the setup screen.
- `css/board.css:70` `.bd-tab` — THE BOARD's five tabs · `:85` `.bd-seg` + `:87` `.bd-seg-b` — its segmented control · `:100` `.bd-chip` — its
  filter chips · `:181` `.bd-retry`.
- `css/progress.css:353` `.pg-card-fd` — the FOUNDER badge on the membership card · `:484` `.pf-gt-chip` — the "+N XP" goal chip · `:540`
  `.rg-off` — SIGNAL LOST in the guest list · `:462` `.pg-bar.pg-bar-tube` — the level bar (14 px, round ends) · `:478` `.pf-gt-bar` — the
  goal bar (16 px).
- `css/vault.css:164` `.vl-pick-on` — EQUIPPED ✓ in the vault picker · `:258` (+ 989) `.vl-fc-fd` — the FOUNDER badge on the full card (the
  default badge slot is literally named 'pill' — vault/full.js:57 / 157).
- Count badges (a circle at one digit, a capsule from two): `css/chat.css:4 / 42` `.cf-badge` · `css/friends.css:45` `.fr-badge` ·
  `css/title.css:674` `.nd-dy-n`.

**ADMIN / TOOLS (the owner's pages)**
- `css/admin.css:74 / 75` `.ad-tabs` / `.ad-tab` · `:83` `.ad-bar` · `:141` `.ad-jump-b` (+ `.btn` everywhere) · `css/daychart.css:12`
  `.dc-tab` / `.dc-day` · `:21` `.dc-chip` · `css/vault.css:183` `.vl-saved`, `:944` `.vl-need`, `:956` `.vl-filter` (the card lab).
- `css/harbor-remote.css` — 7 (`.hr-cd` :31, `.hr-cd-n` :40, `.hr-pa` :56, `.hr-pa-n` :66, `.hr-cat-n` :208, `.hr-foldn` :231, `.hr-chip` :276).
- `css/radio.css` — the tube rule for 16 button selectors (:449, :587), `.rd-fire` :176, `.rd-play` :274, `.rd-lever` :277 / 518, `.rd-cover i`
  :526, `.rd-qx` :544, `.rd-fsw-state` :574, `.rd-tune` :65 (a capsule's top half).
- `js/screens/harbor/bench.js:173` — the phone bench's buttons · `css/components.css:929` `.tag` — "TEST SLOT n" (title.js:469).

**FROZEN (the ten hidden games)** — gridlock.css 3 (:78, :249, :408) · slip.css 6 (:99, :190, :230, :236, :248, :317) · rum.css 5 (:27, :44,
:48, :172, :240) · stakes.css 3 (:115, :231, :253) · `css/kit.css:30` `.mk-ann-in` (nothing renders the default today) ·
`js/games/bluff/view.js:237` (`.tag`) · `js/ui/game-art.js:50` (PULSE's cover: six road dashes).

**DEAD CSS (pill-shaped, nothing renders it)** — board.css:268 `.pf-member`, :344 `.pf-chip`, :277 `.pf-xp-bar / -fill` · components.css:840
`.chip-btn` · progress.css:232 `.pg-vitem.is-on::after` · title.css:1148 `.rdk-pips`.

**MAYBE (the owner judges)** — the switch TRACKS (components.css:1204 `.switch` 54 × 32, board.css:307 `.pf-switch-ui`, components.css:1064
`.cr-sw` 92 × 44 with text inside) · HOLD'EM's table sideways (a wide stadium — view.js:395; a poker table) · thin fully-round bars
(progress.css:324 `.pg-sk-bar` 8 px, holdem.css:469 `.he-sl-rail` 10 px) · holdem.css:265 `.he-bet > span` (the bet plate, ~82 % round) ·
vault.css:1172 the soft washes behind the full card's text lines · THE ADMITTED stamp's border (`js/daily/ticket-art.js#stampSvg` — a rounded
RECT, rx 9 on 120 × 44: not a capsule) · city scenery (biplane wings, a rolled cloth, the lighthouse's windows — objects, not UI).

## Group 0 — THE SHARE CARDS: NO PILLS, ONE RHYTHM (`1bd0cd32`)
- **(a) THE FOOT:** ONE painter for every share card — `js/daily/share.js#shareAddress`: ONE straight thin neon line across the card's column +
  NEONSPEAKEASY.COM in plain neon lettering under it (the same 52-px size + glow; navy by day). SHARE TODAY's rounded tube frame is gone. Each
  daily's own card (`shareFoot` = a small dim "Nº n" + the foot — it used to print the daily's name a second time) and SHARE YOUR RUN's card
  (`games/kit/share-run.js` — THE DROP's, PRISM DROP's, OVERCLOCK's solo cards: its small pink site line) draw the same foot.
  **Other pills in the share kit:** one — a hit tile's white mark on THE PASSWORD's grids was a tiny capsule (a 0.64 × 0.1-cell bar with fully
  round ends) → a straight bar. (The tiles themselves are rounded SQUARES; the boards' frames rounded RECTS — not capsules.)
- **(b) THE DROP's board:** junk rows = SOLID FILLED grey blocks with a slightly darker edge (`board.js#SOLID_JUNK` — night `#5b6174` /
  `#434859`, day `#9a9da6` / `#7c808b` — through `drawMini`'s `solid`; the share code picks the pair by its look, so board.js still never tests
  one), on its own card + in SHARE TODAY, both looks: the board reads packed to the top. (By night the junk used to be outline tubes.)
- **(c) COAST CLEAR:** the beam wedge REMOVED (SHARE TODAY + its own card); the 3 lamps stay, centred.
- **(d) ONE RHYTHM** (`share.js#RHYTHM` — a 312-px box: the name 40 px · the big result 92 px · the stat line 32 px · the art strip 128 px tall,
  the gaps even to within 6 px by the fonts' real metrics — the unit test computes them): every section the same; SHARE TODAY scales every
  section by ONE factor (≤ 1.45×). A WORD result (WELCOME IN · LOCKED OUT · CAUGHT) prints at 0.9× so it stands as tall as a TIME. The strips:
  THE PASSWORD = each door beside its tiles (≤ 36 px a cell; a LOCKED OUT door's six rows fill the strip at 18 px); COAST CLEAR = the lamps;
  **THE DROP = A CROP OF THE BOARD's TOP 6 ROWS** (the choice between "laid flat" and "a crop": a board on its side reads as broken gravity; the
  crop keeps the player's own stack upright at 21-px cells — a whole board in the strip was 6-px cells), in a straight frame open at the foot.
  A daily's OWN card keeps the same order (`OWN`): THE PASSWORD's doors + names moved under the stat line; COAST CLEAR = name · time · line ·
  three big lamps.
- **share-same — the expected copies updated ON PURPOSE:** `tests/integration/_old/pw-share.js` + `_old/cc-share.js` are re-taken (a frozen copy
  of each daily's share.js as of this pass); the page no longer marks COAST CLEAR's clear cards "changed on purpose" (every row is SAME again)
  and gained 4 rows: no frame round the address + ONE straight line above it, night + day → **29 / 29 SAME**. `_old/share-today.js` (the
  Nov 9 ticket version, a before / after tool) is untouched.
- **Look review** (the canvases themselves, 1080 × 1350 + the 360-px thread size — `daily-probe.mjs CARDS=…`; two refine rounds): (1) the name sat
  on top of the big result (the fonts' middles sit above their nominal y) + a WORD result towered over a TIME → the rhythm re-spaced by the
  real metrics, `WORD_K`; (2) THE DROP's strip was a 7-row crop with a muddy fading row → 6 rows, a clean cut, the frame open at the foot;
  SHARE YOUR RUN's name + result lifted 8 – 16 px for the foot's line.
- **Told:** the dailies chat (Downloads\NEON\MAILBOX.md — the foot, one rhythm, the beam, the changed `shareFoot`).

## Group 1 — WATERCOLOR REWORK (`574b2060`) · Group 3 — THE GLANCE TEST + THE TILES (`6b38b91c`)
What it is now: docs/prism.md "THE SKINS" → WATERCOLOR. The rounds (390 × 844 @3×, read at 1× — `prism-glance.html`):
- **Build 1** (the brief as written): no outline, washes, a wide pooled band, a centred lighter middle, flower-like blooms on a round squircle.
  It read as PILLOWS — the wide smooth band + the centred lift shaded each tile like a cushion, and the blooms looked stamped.
- **Build 2:** a brushed near-SQUARE that fills its cell (neighbours' washes meet), the wash made blotchy by wet-in-wet patches (a close hue
  run in), a NARROWER pooled band with heavier stretches, the middle lifted off-centre in two or three places, irregular cauliflower blooms
  that mostly reach the tile's edge, the bleed a little stronger.
- **Glance round 1:** beside the crayon + the paper it read a touch FADED and the falling piece was pale → the wash 0.70 → 0.78, the band's
  narrow passes firmer.
- **Glance round 2:** at 1× the cells of one colour ran together → the wash settles toward each tile's LOWER edge (a soft deeper foot — a row
  reads as a row at speed); still no line.
- **THE ANSWER to "could you tell which is which at a glance?"** — yes, at 390 / 402 / 430: crayon = saturated hatching inside dark pressed
  outlines on ruled paper; watercolor = pale translucent washes, no outline, pooled edges, blooms + bleeds on cold-press; paper = flat matte
  squares with a white top edge + a shadow on a white sheet over kraft. (Judged by me from the shots — Ben's eye is the real test.)
- **THE DAY SKIN TILES** draw each skin's own sprites: the WATERCOLOR tile shows the new wash, the CRAYON tile the new hatching — nothing to
  redraw by hand; checked in the real sheet at 390 / 402 / 430.
- **Proof nothing else moved:** `prism-skin-snap` A/B against the commit before the pass — 152 / 152 IDENTICAL after groups 0 + 1.

## Group 2 — CRAYON: THE TEXTURE TWEAK (`fdc9a7ad` — ITS OWN COMMIT: `git revert fdc9a7ad` undoes exactly this)
The blocks only: more visible hatching (strokes a little apart, a thinner base, more pressure variation, a few thin darker pressed strokes), a
fine waxy grain over the tooth, the outline 0.085 / 0.05 → 0.096 / 0.058 of the cell. Snap: 114 IDENTICAL + 38 DIFFERENT ON PURPOSE — exactly
the crayon frames that draw a block (+ the share cards' crayon mini: a day share card's board carries the tweak). BEFORE / AFTER at 390:
`tests/integration/shots-skins2a/crayon-before-after-390.png` (+ `-390-3x-stack.png`, `-sheet.png`).

## Group 4 — GROK's SOUNDS (`2e63928b`; the unit pin fixed in `224b62ff`) + THE ADD-ON (`7827a433`)
The folder was NOT there when the pass began and appeared mid-pass (Nov 14 09:00); Ben's add-on came while the local tests were running — the
run was stopped, the add-on built, every suite run once after it.

| file | what | source | size | length |
|---|---|---|---|---|
| `watercolor-lock.mp3` | a water drop | "water-drop-01.wav", Jan Schupke (Vehicle) — CC0 | 1,254 B | 0.10 s |
| `watercolor-clear.mp3` | a brush swish + a drip | the swish generated (Grok) + a drip from the same pack — CC0 | 6,583 B | 0.55 s |
| `paper-lock.mp3` | a paper rustle + a soft thup | "Paper Sound - 1.wav", Luckius — CC0 + a thup, generated (Grok) | 1,881 B | 0.16 s |
| `paper-clear.mp3` | a paper rip + a lift whoosh | "Paper Ripped - 1.wav", Luckius — CC0 + a whoosh, generated (Grok) | 7,210 B | 0.60 s |

- **Copies only:** the originals were read through ffmpeg (SHA-256 checked before, all 16 still matching after). The `-b` backups are used
  only if a pick fails — none did. Not imported: `pixel-*` / `galaxy-*` (SKINS 2B).
- **Licences:** the sourced parts CC0 1.0; the other layers "generated (Grok)" (Ben checked Grok's terms). Nothing skipped.
- **(1) The lock's pitch:** ± 3 % at random each play (the file's own source node); a clear keeps its pitch.
- **(2) Balanced in the game — BY MEASUREMENT, NOT BY EAR.** I cannot hear, so I built the nearest honest stand-in:
  `prism-sfx-level.mjs` captures the game's SFX bus while each skin's lock + clear play in the real view and weighs it the way loudness
  meters do (K-weighted, the loudest 400 ms). Ben's hunch was right — as first wired paper's clear sat 1.6 / 3.2 / 2.5 dB under the other
  skins' clears (1 / 2 / 4 lines), watercolor's 0 / 1.4 / 2.3 dB under, watercolor's lock 2 dB under. After the balance: locks −50.3
  (watercolor) · −49.9 (paper) beside −50.2 (crayon / neon); clears × 1 −43.8 · −43.9 beside −44.2; × 2 −41.3 · −41.7 beside −40.9; × 4
  −35.2 · −36.1 beside −34.7; the song −34.3. The numbers to move if his ear disagrees: `audio.js#SAMPLE_GAIN`, `NOTE_GAIN`, `RUN_LIFT`.
- **A mistake caught on the way:** the first version of the sounds' unit pin imported `audio.js`, which Node cannot load — its level checks
  were silently skipped (and one commit went in with that test red for an unrelated reason). The pin now reads the constants from the source
  and always runs.
- `prism-sfx-probe.mjs`: 30 / 30 (only a skin's own files, the files played, the pitch inside 0.97 – 1.03 over 12 plays, the blocked fallback).

## Group 5 — THE TIER STEP (`2226cd4d`)
By day AUTO: 3 → 1 (the silhouettes + the extra particles go; the board 3×) → 0 (the board 2×); up 0 → 1 → 3. The cheap step arms no cap
probe. Measured (the real view, 10× CPU, heavy): watercolor 3 → 1 at 3.6 s → 0 at 7.0 s; crayon 4.7 s → 8.5 s.

## What is real vs placeholder
- **REAL:** the share cards (the foot, the rhythm, the solid junk, the crop, no beam); the watercolor's blocks, ghost, minis, bleed; the
  crayon's tweak; the four sounds wired with their fallbacks; the tier step.
- **FOR BEN TO JUDGE (not judged by me):** the share cards on his phone + in a real text thread · watercolor vs crayon vs paper at a glance
  on the phone, at speed · the crayon before / after (revert `fdc9a7ad` if he prefers the old one) · **the four sounds — nobody has heard them
  in the game**: their levels are balanced by a loudness measurement on the game's own bus, not by an ear.
- **SIMPLE / worth a second look:** the watercolor tile in the settings sheet is three separate washes (no bleed between them — the bleed
  is the board's); THE DROP's strip shows only the top 6 rows (in a typical topped-out run that is the player's own stack — the junk is on
  the own card); THE PASSWORD's six-row grid is 18-px cells in SHARE TODAY (5 px at thread size — colour only).
- **NOT DONE (by the plan):** the other pills (listed above); the night skins' sounds (SKINS 2B); a bleed on the minis / the falling piece.

## Tests
Local, per THE LOCAL TESTING RULE (unit + the game's E2E + the harbor GROUPS the pass touches; the FULL harbor runs in the cloud on the tagged
push). Fresh emulators + `serve.mjs --emu` on :5173 (+ :5195 with THE DROP's OFF row opened for e2e-drop; :5174 = a worktree of the commit
before the pass, for the A/B). No rules change, no `/api` change — those suites were not re-run. The first run was STOPPED when Ben's add-on
arrived (it touched files the suites load); every suite below ran once on the FINAL code, one after another, nothing else running.

| suite | result |
|---|---|
| unit (`node --test tests/*.test.mjs`) | **1880 / 1880** (+ 13: `share-rhythm` 5, `prism-skins-2a` 5, `prism-tier-step` 3) |
| share-same.html | **29 / 29 SAME** (the expected copies re-taken ON PURPOSE; + 4 foot rows) |
| THE PIXEL-IDENTICAL PROOF (`prism-skin-snap.mjs` A/B, `PAGE=1`) | 152 / 152 after groups 0 + 1 · on the final code **114 IDENTICAL + 38 DIFFERENT ON PURPOSE** (37 crayon frames that draw a block + the share cards' crayon mini — the crayon's tweak); every neon frame + the 16 whole screens identical |
| e2e-prism FAST | **66 / 66** |
| e2e-prism full (8 phones) | **90 / 90** (the known REFRESH one-attack check was green this run) |
| e2e-playnow | WebKit **36 / 36** · Chromium **36 / 36** |
| e2e-drop | **34 / 34** |
| e2e-daily | **53 / 53** (SHARE TODAY drawn from the server's real `today { share }`) |
| smoke | **8 / 8** |
| harbor groups `shell, sololook, cartridge, tapfit, corners` | **46 / 46** |
| prism-sfx-probe (a real page, the audio unlocked) | **30 / 30** |
| prism-sfx-level | the table above (docs/audio.md) |

No red in any run. Servers: the emulators, :5173, :5174 and :5195 were this pass's own and are STOPPED at the end; :5190 (Ben's preview server)
is left running.

## New + changed files
`js/daily/share.js` (the foot, RHYTHM, OWN) · `share-today.js` · `games/password/share.js` · `games/coastclear/share.js` · `games/drop/share.js` ·
`games/kit/share-run.js` · `games/prism/share.js` + `board.js` (SOLID_JUNK, the `seams` call) · `water-art.js` (rebuilt) · `skins.js` (the bleed,
the sounds' files) · `crayon-art.js` (the tweak) · `audio.js` (the files, the levels, the pitch) · `tiers.js` + `view.js` (the tier step) ·
`audio/sfx/prism/` (4 mp3, 16.9 KB in all, + CREDITS.md) · `scripts/build-prism-skin-sfx.py`. Tests: `tests/share-rhythm.test.mjs`,
`prism-skins-2a.test.mjs`, `prism-tier-step.test.mjs`; tools `prism-glance.html`, `prism-sfx-probe.mjs`, `prism-sfx-level.mjs`,
`daily-probe.mjs CARDS=`, `prism-shots.mjs SETS=glance,skinsheet`. PRISM's preload graph: 52 modules / 534 KB → 52 modules / 553 KB (the
budget: 1.5 MB).

## The cloud (the ONE push — `05de3bca`, the harbor tag; not re-run)
- **tests: GREEN** (unit + the whole-match simulations; rules + /api + smoke).
- **harbor: 13 of 15 jobs green; 2 red, one check each — both in the CITY, which this push does not touch** (its 15 changed files are the
  share kit + PRISM DROP's own; nothing under `js/screens/`):
  - `lobby` 77 / 78 — **NO TWO CAMERAS at the boot reveal** (one frame of 345 showed the city built for 402 × 659 CSS-fitted in a 402 × 712 box)
    — the known city timing check (the "cameras" one; it failed the same way on THE DROP B's late push).
  - `legend` 78 / 79 — **SIGHTINGS: a FAST legendary's photo** — the fireball was 83 % (not 100 %) inside the photo taken 19 ms after the tap
    (the blackbird + the f22 fine). A timing check on a fast craft; NOT on the known-noise list — worth a look by the city chat.
