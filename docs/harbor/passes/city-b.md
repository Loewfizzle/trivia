# CITY B — THE CITY'S LOOKS (Nov 14–15 2026, the mini PC)

The owner's order (`docs/harbor/decisions.md` — CITY A's Step 0): … CITY A ✅ → **CITY B** (the city's looks) → CITY C (cards + social) → THE
MAINTENANCE REVIEW → JAYWALK → THE GIRL CARDS → THE TOWER MOVE → the reset. **No rules change.** 8 functions. THE ADD-ON INBOX: no entry for CITY B
(read at the start, after every group, before the final tests).

## Group 1 — THE SIGNS ADVERTISE PLAYABLE GAMES ONLY
- **ONE roster** (`core/harbor-neon.js#signRoster`): the city's signs + the speakeasy blade's ghost ad name only `GAMES[].playable` (never a
  frozen game, never a daily). A row turning playable joins every sign with no code change. JAYWALK has no GAMES row yet: `&force=sign-jaywalk`
  (+ its panel row JAYWALK ON THE SIGNS) adds `JAYWALK_SIGN` "as if released"; a tap on its sign = COMING SOON.
- **THE HOTEL BLADE** (`n-blade`: `rot: 'hotel'`, `split: 2`) has its OWN seeded rotation (shuffled per week, rotated per night — every phone
  the same) of the names that fit it — PRISM · HOLDEM (a vertical blade drops the apostrophe — `signText`) · JAY / WALK (`SIGN_SPLIT` — two
  stacked words with a short break, `signs.js#BLADE_GAP`) — never the speakeasy blade's game that week (`hotelAvoid`: the week's, and on a
  Monday morning last week's when it can). Letters: PRISM / HOLDEM ≥ 10.4 pt, JAY / WALK 9.0 (390) · 9.3 (402) · 10.1 (430) pt.
- With three playable games the second roof sign is dark most nights (OVERCLOCK's nine letters fit no skyline sign — it is on the speakeasy
  blade + the room); with JAYWALK released every named sign is lit.
- Found in Group 7: on a wide screen the panorama's extra blades were filled before the roofs (fewest words first) and left a roof dark — the
  phone's own spots now come first (`assignSigns`), so desktop shows the phone's signs.
- THE CITY TIMETABLE: `signs.shuffle` (calendar). Proof: `tests/city-b-signs.test.mjs` (a year of nights, 4 sizes, both rosters: no frozen name;
  the blade's words fit + read; the blade ≠ the speakeasy blade every night + every week) + the harbor suite's sign tests moved to `signText`.

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

## Group 4 — THE GLOW STICKS (the trick-or-treaters' — the only glow sticks in the city)
At night: a soft halo in its colour (one 64-px sprite per colour), the coloured tube, a white-hot core — on the far hand (its swing is the walk's
own); by day a plain plastic stick. Before / after: `Downloads\NEON\city-b\glowsticks-before-after.png` (402, `&force=halloween-kids,trick-or-treat`).

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
| unit `node --test tests/*.test.mjs` | **1966 / 1967** — the one red: THE BOOT BUDGET (6,519.5 KB of 6,500 — below) |
| harbor groups `core,dock,load,neon,speakeasy,trivision,billboard,workers,panel,panelrows,people,desktop,holiday,roofcrisp,corners,tapfit,youpage,sheetstack,shell,vault,progress,skyline` | 392 / 398 → the 6 reds (all "two roof signs lit" — now one with three playable games) updated (`&force=sign-jaywalk` where a check tests the sign mechanics; the playable roster where it tests the real city) + re-run `neon,roofcrisp,desktop,core` **72 / 72** (NO full local harbor — the cloud runs it) |
| smoke | **8 / 8** |
| `/api` `server.test.mjs` | **59 / 59** (+ THE DROP's switch + feed) |
| e2e-daily | **92 / 92** (SCORES reads the medal's label; the iPad's tap-beside-the-column case runs with JAYWALK released — its sign is the second roof) |
| e2e-taps | Chromium **30 / 30** · WebKit **28 / 28** |
| wk-press (WebKit) | **30 / 30**, 0 rescues |
| tri-flash `--force billboard-drop --turns 6` | **6 / 6** |
| rules | not touched (no rules change) |

## THE BOOT BUDGET — OPEN (Ben's decision)
The boot was 6,495.6 KB of its 6,500; this pass adds ~24 KB to modules drawn before the reveal (the blade's three kinds, the hotel rotation,
THE DROP's state, the glow sticks, the panel rows) → **6,519.5 KB**. THE DROP's poster + the medals were made lazy. Raising the budget is the
owner's named decision — not taken here (see the summary).
