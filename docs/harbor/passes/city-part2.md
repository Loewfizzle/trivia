# CITY PART 2 — LOOKS + FEATURES (Nov 21, 2026)

**RE-PUBLISH THE RULES** — `rooms/{CODE}/gv` is new (GAME VOTES): `Downloads\NEON\database.rules.nov21-part2.json` → Firebase console →
Realtime Database → Rules → Publish, any time AFTER the deploy is live. It also carries THE CONSOLE FIX's change (if not published yet).
Nothing breaks before you publish: on the old rules a guest's vote is quietly refused (the quiet `late-vote`) and their tap reads HOW TO PLAY,
as before. A phone still on the old code works on the new rules.

The pass in one line: the boot has room again (moved comments, no code change), every game's end screen speaks in its own coloured neon,
guests can vote for the next game, STATS shows a players line, the owner's lists show the name tag, the speakeasy blade never repeats a lit
sign, and nine slim cards show their effect layer from the first frame.

## OPEN FOR BEN
1. **RE-PUBLISH** the rules (above). Then a phone check: open a room with your brother, he taps GAMES → a game (YOUR VOTE), your GAMES tab
   shows a count, your list shows his dot + 1 and MOST WANTED on top — one tap starts it.
2. **A NEW CALL (the review's #7):** the end-screen header is now `<GAME> · SOLO / · MATCH` for every game (your format). PRISM DROP's
   BATTLE / SCORE RUSH / SURVIVAL, OVERCLOCK's "6 CHALLENGES" and HOLD'EM's CASH / TOURNAMENT left the header (the bodies still say most of
   it: THE LEDGER, the winning board's KOs / points). Keep it — or put the mode back as `PRISM DROP · SCORE RUSH`?
3. **Phone checks** after the deploy: an end screen of each game (PRISM DROP by day = blue paint on the paper; JAYWALK pink + gold NEW BEST;
   HIGH RISE unchanged); ☰ STATS → the pink players line, a tap on a day; WHO'S ON → the tags; THE BOARD / SCORES → no tags anywhere; the
   city on a Monday morning (the speakeasy blade never the same game as the hotel blade or a roof).
4. **Calls you can overrule** (THE CALLS MADE below).

## GROUP 0 — the start
- THE LAB: 224 marks, no open FIX.
- CITY PART 1's cloud run: **harbor RED** (tests green). `show`: three tri-vision checks still expected the old JAYWALK / THE DROP rotation, and
  the `tri()` hook judged the clock on 2 faces (it is 3 since HIGH RISE). Fixed: the checks follow the page's own dates and HIGH RISE in
  place of THE DROP; the hook counts the real faces. `street`: THE DANCERS' ARMS — 1 jump in 266 frames = the known cloud timing flake (the
  people code untouched; 29 / 29 here). (ae6620cd)

## GROUP 1 — THE BOOT's BYTE ROOM (73f87e0d)
Ten boot modules' long header comments moved VERBATIM to `docs/harbor/boot-headers.md` (balloons, harbor-show, water, wheel, sounds, birds,
harbor-promenade, tape-stop, fireworks, vehicles); each keeps its first line + a pointer. No code change (the review checked: only `//` lines;
every moved line is in the doc). No budget raised.
| the boot | before | after Group 1 | after the whole pass |
| --- | --- | --- | --- |
| module bytes | 6,654,667 / 6,656,000 (**1,333 B room**) | 6,628,290 (**27,710 B room**) | ~6,632,000 (**~24 KB room**) |
| modules | 304 / 310 | 304 / 310 | 304 / 310 |
| js/games at boot | 25 KB (boot-bytes) | 25 KB | 28.2 KB of 30 (the NEON rows in metas.js) |
Every later group stayed inside the room it left (the votes in room.js / host.js, the blade rule, the NEON rows: ~3.7 KB together).

## GROUP 2 — THE END NEON (b0fa9f1b; the review's fixes 25a2e797)
ONE builder `js/ui/fin-neon.js`, ONE colour row per game (`js/games/metas.js` NEON); docs/match-kit.md "THE END NEON".
- **The header** `<GAME> · SOLO / · MATCH` (createFinal's `mode`): HIGH pink + RISE cyan, JAYWALK pink, OVERCLOCK orange, PRISM DROP ice blue,
  HOLD'EM casino red — the mode softer; shrunk to fit at 375 (the first 375 shot ran PRISM DROP · MATCH under ♫ — refine pass 2).
- **The result line**: JAYWALK's cause in its pink (THE MOTHERSHIP gold), YOUR BEST + NEW BEST gold (was dim / green); the frame's WINNER +
  DEADLOCK gold (were white on PRISM, lime elsewhere), its winner line gold, SOLO RUN the accent; HIGH RISE's card + its in-match OUT card
  through the builder. **HIGH RISE with no look change:** A/B on `tests/integration/endneon-preview.html` against the old tree — the header +
  the cause within 8 / 255 at 3× (the first A/B caught the MOTHERSHIP turning pink: the row's colours sit inline, so gold goes through `--c`).
- **By day** PRISM DROP's paper takes paint inks (#1d5aa6 / #4a5670 / gold #7a4f00) — every ink ≥ 4.5 : 1 (`tests/city-part2-endneon.test.mjs`).
- Before / after (`tests/integration/shots-cp2/`, copies in `Downloads\NEON\city-part2\`): `end-screens-before-after-top.png` (PRISM night ·
  day · solo, OVERCLOCK match · solo, HOLD'EM), `end-screens-375.png`, `end-jaywalk-after-night-day.png` (before: e2e-jaywalk's touch-up shots —
  white-pink header, white cause, green NEW BEST), `end-highrise-ab-old-vs-new.png`. Two refine passes: (1) 390 by game + by look; (2) 375
  (the header fit). The HOLD'EM preview's podium waits for the dealer's end since THE CONSOLE FIX — the preview now sets `ended`.
- `end-flash` 24 / 24.

## GROUP 3 — GAME VOTES IN A ROOM (e0c33db7; the review's fixes 25a2e797) — RULES CHANGED
`rooms/{CODE}/gv/{uid}` = `{ g, at }` (docs/data-model.md). A guest's tap in GAMES = a vote (another game moves it, the same takes it back,
YOUR VOTE, `?` = HOW TO PLAY); the host's list puts the voted games on top with the voters' colour dots + the count (a tap = who) and
MOST WANTED · <GAME> (n) = one tap starts it (game-options.js#quickStart, the saved settings); the dock's GAMES tab counts the new votes (a small
square count, no pill). The start clears them in its own write after the status write; a leaver's vote goes with them. THE RULES-LAG: on the
old rules a vote is refused (the quiet `late-vote`), votes go quiet for the page, a tap reads HOW TO PLAY — and the start is never touched.
- Tests: `core/room-votes.js` pure + `tests/city-part2-votes.test.mjs`; rules **99 / 99** (+ GAME VOTES); **`e2e-votes.mjs` 15 / 15** (two
  guests vote by real taps, the host's count 2 → cleared once seen, the dots + "2" + MOST WANTED, the dots = who, a vote MOVES live on the host's
  open sheet, a tie = the earliest, a take-back, MOST WANTED starts PRISM DROP on three phones, every vote cleared, 0 refused writes; 375: the
  line + the dots inside, the dots' tap area ≥ 44).
- Shots: `votes-guest-host-390.png`, `votes-host-375.png`. Refine passes: (1) MOST WANTED broke mid-name → two lines (MOST WANTED over the name);
  (2) 375.

## GROUP 4 — THE OWNER's TOOLS (62408d0f, f85ba81f)
- **STATS → MATCHES PER DAY's PLAYERS LINE** (docs/profiles.md): a pink line + dots over the cyan bars on ONE scale, the legend, a tap =
  "NOV 19 · 34 MATCHES · 6 PLAYERS" (the picked bar white-cyan while the line is up — pink is the line's); room matches + verified solo runs +
  daily finishes, DON'T COUNT + removed test accounts out; `core/insights.js#playersPerDay` (unit test), the daily finishers on their own 5-min
  cache, statsSnap v 3. Back-fill: the 30 days come from results/ (kept) + dly/…/r of the OPEN dailies (a daily switched off since, or a day
  pruned, adds only its matches). Shot: `stats-players-line-390.png` (+ 375).
- **THE OWNER'S NAME TAG**: `ui/owner-tag.js`; WHO'S ON + a room's players, STATS' most active, SECOND ACCOUNTS; the server adds `t` only for
  THE OWNER's ask (server.test). Shot: `whos-on-tags-390-375.png` (two BOI accounts: #4821 · #2207).

## GROUP 5 — THE CITY + THE CARDS
- **(1) THE LED BILLBOARD EXCEPTION** in docs/harbor.md (the tri-vision is an LED screen — no day variant, ever). (febe8a15)
- **(2) NEVER A GAME TWICE AS A SIGN** (febe8a15): `core/harbor-neon.js#litSigns` + `#bladeGame`; `ghostAdGame` takes an avoid LIST; the scene's
  three blade picks read `neon.litSigns()`. The evening already never clashed (CITY D); the clash was a Monday MORNING (the painters still show
  last week's blade) and past midnight — e.g. Nov 30 2026 at 390: HOLDEM on the hotel blade + HOLD'EM on the speakeasy blade → PRISM DROP.
  `tests/city-part2-blade.test.mjs`: every night of a year, 390 / 402 / 430 + the desk, the evening + a Monday-morning blade. Shot:
  `blade-before-after-day-night-390.png`.
- **THE SLIM-CARD LAYER** (d11fedf6) — docs/vault.md: the nine CSS-art cards show their effect's layer in every list from the first frame
  (stills kind `l`, the GENERATED `::before`); strip-match before → after at 402: aurora 45 → 15.3 · frostbite 33.4 → 7.7 · marquee 33.4 → 12.5 ·
  sg-btc 32.8 → 24.3 · neonglass 25.7 → under 9 · century 20.8 → under 9 · dev-switchboard 13.2 → 9.8 · smoke 19.2 → 20.4 · glitter 10.5 → 12.8
  (the last two = their own motion). A hero-anchored layer measured worse (sg-btc 26.6) — stretch kept. LAB_V bumped for the nine + their lines.
  The four baked-still cards (inferno, noir, neoncamo, marquee-gold): not quick — left named in docs/vault.md. Shot: `slim-layer-before-after-live.png`.

## THE CALLS MADE (obvious / established — overrule any)
- A vote stores `{ g, at }` (not the bare id the entry wrote) — the server's time is what makes "a tie = the earliest vote" work.
- MOST WANTED's one tap starts with the room's SAVED settings for that game (the options sheet skipped).
- The dock count = the votes cast since the host last opened GAMES; votes clear at a start only (votes are cast in the lobby).
- A refused vote reuses the quiet kind `late-vote` (/admin's line now reads "late votes (rematch + game)").
- The end header's mode = SOLO / MATCH for every game (OPEN FOR BEN 2). HOLD'EM's line ink = its sign's red (its ACCENT is gold — gold is the
  win's). JAYWALK's name = one word in its sign's pink (its poster's).
- DEADLOCK (a shared win) = gold; ALL TIED (nobody first) = the accent.
- The players line: "test players left out" = accounts with no profile (the TEST PLAYERS tool removes them); a daily's streak day = its
  calendar day.
- The name tag also on STATS' most active (owner-only) — the entry's three lists + the one more owner-only list with cards.
- The speakeasy blade skips EVERY lit named sign (roofs + the hotel blade + a desk's extra blades), not only the roofs — or it could land on the
  hotel blade's game.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — read the code + the shots; 25a2e797 fixed what it found)
1. MEDIUM — a failed chunk left GAMES dead for the room (`gamesOpen` stuck). **FIXED** (try / finally).
2. MEDIUM — HIGH RISE's in-match OUT card lost its pink (it never called the builder). **FIXED** (`finLine`).
3. MEDIUM-LOW — a vote could slip in between the clear and the status write; a failed start wiped the votes. **FIXED** (the clear after the
   status write; a vote refused while a start is on its way).
4. LOW — `votesOff` latched on any refusal. **FIXED** (only in a settled lobby; the tap then reads HOW TO PLAY).
5. LOW — a guest-opened sheet went dead after MAKE HOST. **FIXED** (the host's tap = HOW TO PLAY).
6. LOW — a leaver's vote stayed behind. **FIXED** (the leave removes it first).
7. LOW — the header lost the mode words → **OPEN FOR BEN 2**.
8. LOW — SOLO RUN wore a lime glow over its accent; DEADLOCK's comment vs its gold. **FIXED** (the neon wins; the comment says gold).
9. LOW — the docs the code points to were missing. **WRITTEN** (match-kit, data-model, profiles, vault, ROADMAP).
10. LOW — `litSigns` remembered one night (the board asks two). **FIXED** (a few nights).
- What held (its list): the boot trim only moved `//` lines, every one in the doc; the gv rules (own uid, seated, unkicked, lobby only, the
  shape, only the host clears); the host's clear behind `hostWriteOk`, never in the start's write; repaints after the finger; contrast; no
  animated shadows; the tag only for `role === 'owner'`; the generated `::before` clashes with nothing.

## THE FINAL RUN
(filled in below)
