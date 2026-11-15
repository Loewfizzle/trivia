# CITY B — THE CITY'S LOOKS (Nov 14–15 2026, the mini PC)

The owner's order (`docs/harbor/decisions.md` — CITY A's Step 0): … CITY A ✅ → **CITY B** (the city's looks) → CITY C (cards + social) → THE
MAINTENANCE REVIEW → JAYWALK → THE GIRL CARDS → THE TOWER MOVE → the reset. **No rules change.** 8 functions. THE ADD-ON INBOX: no entry for CITY B
(read at the start, after every group, before the final tests) — one arrived (Nov 15 1:16 am) and is Group 8. **THE OWNER'S ANSWERS (Nov 15)**
to the first summary are built below: THE BOOT TRIM, NO DARK SIGN (OVER / CLOCK + JAY / WALK always stacked, JAYWALK on the signs now), THE
PARTY's GLOW WANDS.

## Group 1 — THE SIGNS NAME THE PLAYABLE GAMES (+ JAYWALK) — NO NAMED SIGN EVER DARK
- **ONE roster** (`core/harbor-neon.js#signRoster`): the city's signs + the speakeasy blade's ghost ad name the `GAMES[].playable` games + JAYWALK
  (on the signs NOW, as if released — the owner, Nov 15; its billboard says COMING SOON; a tap on its sign = COMING SOON) — never a frozen game,
  never a daily. The playable list alone still rules menus, rooms + the shelf. A row turning playable joins every sign with no code change.
- **OVER / CLOCK + JAY / WALK — ALWAYS two stacked lines on every neon sign** (the owner's call, Nov 15 — never one line, even where one would
  fit): `SIGN_SPLIT` (the roof signs on two lines; the hotel blade one column with a short break — `signs.js#BLADE_GAP`; the speakeasy blade two
  columns — `speakeasy-blade.js#bladeWords` takes a listed split whatever its length). A vertical blade takes a split name only if its letters
  stand at the glance size (≤ cap + 1: JAY / WALK yes, OVER / CLOCK only on the roofs).
- **NO NAMED SIGN IS EVER DARK:** the hotel blade + both roof signs carry three of the four names every night; a name already up elsewhere only
  if nothing else fits; a panorama blade too short for the shortest name (5 letters) never hangs; the phone's own spots fill before a panorama's.
- **THE HOTEL BLADE** (`n-blade`: `rot: 'hotel'`, `split: 2`) has its OWN seeded rotation (shuffled per week, rotated per night — every phone
  the same) — PRISM · HOLDEM (a vertical blade drops the apostrophe) · JAY / WALK — never the speakeasy blade's game that week (`hotelAvoid`).
  Letters: PRISM / HOLDEM ≥ 10.4 pt, JAY / WALK 9.0 (390) · 9.3 (402) · 10.1 (430) pt.
- THE CITY TIMETABLE: `signs.shuffle` (calendar). Proof: `tests/city-b-signs.test.mjs` — a year of nights at 390 / 402 / 430 + 1440: no named
  sign dark, no frozen name, OVER / CLOCK + JAY / WALK stacked wherever they hang, every stacked word ≥ 9 pt and every one-word name ≥ 10 pt,
  the hotel blade ≠ the speakeasy blade every night + every week; the harbor suite's sign checks run WITHOUT a flag.

## Group 2 — THE SPEAKEASY BLADE's BOLD WEEKLY LOOK
- `core/harbor-speakeasy.js#bladeStyle(week)` — a seeded walk (every phone the same; the kind, the font and the panel never repeat two weeks
  running): **KIND** enamel (a saturated painted board, FLOODLIT at night — the week's colour reads after dark) · neon (the board near-black in
  the week's tint, the letters glowing in their colour, one clean letter — 9e) · bulb (the letters made of bulbs along the tube alphabet's
  strokes; by day glass globes in sockets); **PANEL** one of 10 saturated colours (red, cobalt, emerald, plum, mustard, teal, orange, rose, ink,
  cream); **LETTER** cream / gold / black / the game's neon, picked so it holds ≥ 4.5 : 1 on the board day AND night (`bladeLetterCol` — a
  fallback when the neon fails); **BULBS** warm · gold · red · blue · green · pink (≥ 3 : 1 on the board, never its own hue — `SAME_HUE`; a
  BULB letter ≥ 4.5 : 1); the font set (block / condensed / slab) kept. The game's sub-pt pinstripe is gone (no fine detail).
- `&blade=<kind>-<font>-<panel>-<bulb>` (any part; positional first — `red` is a panel AND a bulb) + the panel row THE BLADE'S WEEKLY LOOK
  (`&force=blade-look&bk&bf&bp&bb`). The 8-week sheets: `Downloads\NEON\city-b\blade-8-weeks-night.png` / `-day.png`.
- Proof: `tests/blade-style.test.mjs` (260 weeks: every kind + font, ≥ 8 panels, ≥ 5 bulb colours, no repeat, the contrast for every game neon).

## Group 3 — THE DROP ON THE TRI-VISION (the third face)
- **THE POSTER** (`screens/harbor/drop-art.js`, code-drawn, lazy after the reveal — never the boot): a white beam from the TOP edge into a bold
  prism, the light leaving DOWNWARD as three VERTICAL spectral tubes (red · green · blue), three shards falling with short trails; THE / DROP
  big · NEW DAILY · PRISM DROP small (Orbitron 900 + Chakra Petch — `warmDrop` waits for the fonts). NIGHT = self-lit neon on near-black (never
  multiplied by the lamps' pools — `content.selfLit`; the poster painter now gets a night flag); DAY = the ticket's violet (#6a3fd0) printed
  crisp. Never the left-beam → fan layout. Stills: `Downloads\NEON\city-b\drop-face-night.png` / `-day.png`.
- **WHEN:** only once THE DROP is live — its go-live day rides the SAME cached GET ?live=1 (`api/_lib/radio.js#radioPublic.drop` ←
  `progress/dlive/drop.from` while `progress/dailies.on`; NO new poll); 14 days from that day (`billboard.drop.days`), then it retires by itself.
  THE OWNER's switch: /admin → THE BILLBOARD → THE DROP row: ON (that window) · OFF · KEEP ON (never retires) → `city2/billboard.drop`.
- **THE TURN:** `triFaces` = the live faces in order HOLD'EM → JAYWALK → THE DROP (two or more turn; one alone = no turning); each painter loads
  only when its face is up; the face on show keeps its NAME when the list grows (never a swap without a turn). `&force=billboard-drop` + its row.
- Proof: `tests/city-b-drop.test.mjs` (the window, OFF / KEEP ON, the order, the clock unchanged by N, the force, the no-new-poll source) +
  `/api` (`server.test.mjs` "CITY B: THE DROP on the billboard") + `tri-flash.mjs --force billboard-drop --turns 6`: **6 / 6** (390 / 402 / 430 ×
  night + day, five turns each through the three faces — the new face whole in ~1 s, never an old-face frame).

## Group 4 — THE GLOW STICKS
- **THE PARTY's DANCERS** (the owner's answer, Nov 15 — the glow sticks he meant): the dance breaks' + the street party's dancers already hold
  neon WANDS (`screens/harbor/wands.js#drawWands`) — they read far too dim on the phone (a ~1-pt line, a 22 % halo, down to 62 % between beats).
  Now: a thicker tube (≥ 1.8 pt), a near-white core, a TWO-LAYER coloured bloom (≥ 10 pt + ≥ 5 pt wide), barely a dip between beats (86 %);
  the trails brighter. Swinging with the dancer's hand as before (no new motion). Before / after at 402 on a party night
  (`&force=party,dance&dance=wands`, 22:30): `Downloads\NEON\city-b\glowsticks-party.png`.
- The trick-or-treaters' glow sticks kept brighter too (a coloured halo + a white-hot core at night — `folk.js#glowTint`):
  `Downloads\NEON\city-b\glowsticks-before-after.png`.

## Group 5 — THE DECO MEDALS
ONE component, `js/ui/medal.js#rankMedal` (the approved mockup's toothed disc + three stepped octagons + the numeral + the gloss; unique gradient
ids per medal), ~32 pt: THE BOARD (every tab — HOLD'EM's too), the game card's top three (loaded lazily with the strips), the dailies' SCORES
(today + all time). The innermost face reaches the dark stop only at its foot so the numeral holds ≥ 4.5 : 1 everywhere under it. The old
circles (`.bd-medal`, `.nd-pv-medal.is-*`) are gone. Shots (WebKit, 402): `Downloads\NEON\city-b\medals-board.png` / `medals-dailies.png`.
Proof: `tests/medal.test.mjs`. Not changed: a game's own results table (`kit/results.js` — ordinals in a stats table) and the room's night table.

## Group 6 — GLITTER BOMB TO LEVEL 50
`card-glitter` moved from LV 8 to **LV 50, beside GLOW GOLD** (the table already takes two at a level — 70 and 100 do). `grant()` only adds what
is missing: an owner keeps it, nothing is re-granted; THE VAGUE TEASE (`levels.js#REWARD_LEVELS`) drops 8. Proof: `tests/city-b-glitter.test.mjs`.

## Group 7 — THE NEW og.jpg — CANDIDATES ONLY
`Downloads\NEON\city-b\og-candidate-1.jpg` (the full frame, Friday June 5 2026 22:30 — a party night) + `og-candidate-2.jpg` (Friday June 26,
a 1.25× tighter frame: NEON SPEAKEASY bigger at thumbnail size). Both: the roof board on JAYWALK · NOW OPEN, the speakeasy blade OVERCLOCK,
HOLD'EM + PRISM on the roof signs, JAY / WALK on the hotel blade. `assets/og.jpg` NOT replaced — Ben picks; the next pass swaps it in.

## Group 8 — THE ADD-ON (Nov 15 1:16 am — a LOST TAP on the profile's BACK, a CITY A follow-up)
- `.icon-btn`, `.menu-btn`, `.music-btn` join THE TAP WATCH's press + lift rule (`ui/tapwatch.js#PRESS_IMPLICIT`) — the profile's BACK, the
  setup screen's back, the panel's ×, the ☰ and the music note (off in a game, as before).
- The profile's FRIENDS box (`friends-ui.js` paint), the YOU tab's badge (`title.js#frBadge`) + the card slot (`profile.js#paintHero`) wait for
  the lift (`afterTap`) — never re-built under a finger.
- Proof: `wk-press.mjs` (WebKit) **30 / 30** — BACK pressed, a friends update lands mid-press (`friends.js#setBadge`), the lift → it acts ONCE,
  0 re-renders under the finger, 0 rescues; `tests/tapwatch.test.mjs`.

## Tests (local, the mini PC — my own emulators + `DAILY_TEST=1 scripts/serve.mjs --emu`, nothing else running)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | **1967 / 1967** (THE BOOT BUDGET green again — 6,457 KB of 6,500) |
| harbor groups `core,dock,load,neon,speakeasy,trivision,billboard,workers,panel,panelrows,people,desktop,holiday,roofcrisp,corners,tapfit,youpage,sheetstack,shell,progress,skyline,party,streetparty` | **365 / 365** after the owner's answers — the sign checks WITHOUT a flag: three named signs lit, the desktop five (NO full local harbor — the cloud runs it). (The first run, before the answers: 392 / 398 → the "two roof signs" reds.) |
| smoke | **8 / 8** |
| `/api` `server.test.mjs` | **59 / 59** (+ THE DROP's switch + feed) |
| e2e-daily | **94 / 94** — SCORES reads the medal's label; the tap-through sweep's helper now keeps 8 px from a button sideways too (a now-lit roof sign behind SEE THE FULL BOARD's very edge: the touch was the button's, which rightly acted) |
| e2e-taps | Chromium **30 / 30** · WebKit **28 / 28** |
| wk-press (WebKit) | **30 / 30**, 0 rescues |
| tri-flash `--force billboard-drop --turns 6` | **6 / 6** |
| pixdiff (the trim) | no change — see THE BOOT TRIM |
| rules | not touched (no rules change) |

## THE BOOT TRIM (the owner's answer, Nov 15 — the limit stays 6,500 KB)
- The boot was 6,520.6 KB after this pass's looks. **329 pass-history comment blocks** (whole-line `// (PASS NAME: …)` parentheticals — the
  history lives in the pass logs) came out of the four files that held the most: `scene.js` (35.8 KB), `core/harbor-people.js` (12.3),
  `folk.js` (7.8), `clouds.js` (6.3) — **62.1 KB** → the boot **6,457.3 KB** (42.7 KB under). Every other comment, the city timetable's
  owner-decision notes and every other file untouched. THE DROP's poster + the game card's medals load lazily (never the boot).
- **Proof:** `scripts/comment-only-diff.mjs HEAD` — each trimmed file vs its committed version with whole-line comments removed: **byte-identical**
  (4 / 4 SAME); the unit suite **1967 / 1967**; pixdiff (A = a worktree at the pre-trim commit on :5174, `--pin`): night 5 px · noon 21 px ·
  golden 0 px past the noise; party's crowd band swings 1.03 % → 0.41 % → 0.08 % over three runs and the baseline against ITSELF gives 0.14 %
  — the dancing crowd's motion, not a change (the code is identical).
