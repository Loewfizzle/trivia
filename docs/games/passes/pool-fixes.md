# THE POOL FIXES + THE SLIDER + OVERCLOCK'S NEW ICON (Nov 13 2026)

The owner's notes (Nov 13 1 pm — PLAY NOW live on his iPhone) + the 1:21 pm WHO'S ON add-on: `docs/harbor/plan.md` "OWNER'S NOTES — NOV 13 1 pm";
the current decisions: `docs/harbor/decisions.md`. The fact-check reviews (read-only, never edited): `Downloads\NEON\pool-fixes\`
(`review-part1-trivia-truefalse.md`, `review-part1b-closest.md`, `review-part2-six-banks.md`).

## Group 0 — the small things

- **0a OVERCLOCK'S ICON IN THE OVERDRIVE LOOK** (`ecc4ae42`): the neon mark (`js/core/marks.js` — the shelf, the city's signs + drones) and the game
  card's art (`js/ui/game-art.js`) in `css/overclock.css`'s palette: the dial's sweep `--oc-cool` blue, its redline + the bolt `--oc-hot` orange,
  the needle `--oc-white-hot`, the dark `--oc-carbon`. Same silhouette; the one-tube arc split where the redline starts (80° — the first pass split at
  60° and the orange half read as a sliver on the shelf). The accent everywhere it shows: `title.js#ACC` (the shelf row + the card), `tube-logo.js#LOGO_ACC`,
  the city's `signs.js#SIGN_ACC` (`#ffb627` → `#ff6a1a` — orange, clear of HOLD'EM's casino red `#ff5a64`; the OVERCLOCK billboard's day + night faces
  were already teal-blue + orange), THE BOARD's OVERCLOCK tab light (orange + blue). No baked still uses the mark (no cache key to bump). Shots:
  `shots.mjs` pn-shelf / pn-shelf-day / pn-overclock / pn-overclock-day at 390 / 402 / 430 / 1440 (git-ignored), two refine passes. **A CITY change**
  (the marks + SIGN_ACC draw in the city) → the pass ships on the harbor tag with the FULL e2e-harbor suite.
- **0b CARD NAMES YOU CAN SEE**: `/api/profile` → player (`api/_lib/player.js`) carries `card.cn` = the EQUIPPED card's display name only
  (`api/_lib/catalog.js#wornCardName` — a CARD id or null; an emblem / tube / glow / unknown id → null); `vault/full.js` shows `nameOf(card) ||
  who.cardName`, so someone else's card is never blank (DimeTime's BUZZED LIGHTYEAR). The spot line needed nothing (local text). ITEM NAMES ONLY TO
  OWNERS keeps everything else: `tests/vault-names.test.mjs` allows exactly this one field; `server.test.mjs` proves two owned-but-not-worn cards and the
  worn tube + glow never leave the server.
- **0c THE CHAT FALSE ALARM**: no chat write after a player left the room / lost host (`chat/logic.js#canChat`, checked before send, typing, system
  lines, clear, prune); a refusal that still gets through on a room this phone has LEFT is logged quietly ("no longer in the room" — `core/rules-lag.js
  #quietRoomRefusal`, `room.js#leftRoom` registered with `firebase.js#setRoomGone`), never to /admin's errors. A real rules-lag in a room the phone is
  still in still raises the alarm (`tests/errors-group.test.mjs`).
- **0d THE DOCK'S FIRST TAP ON iOS**: `ui/tapwatch.js#pressTap` — the press shows on pointerdown, the action runs on a pointerup that lands on the button
  (≤ 700 ms, ≤ 10 px) ONE frame later; click kept for keyboard / screen readers (ignored 800 ms after a pointer took the tap). Every title-dock + room-dock
  button. Proof: `tests/integration/wk-docktap.mjs` (WebKit 402×874 @3, touch, the tap watch's rescue OFF) — a cold load, ONE tap on each dock button,
  each opens (JOIN · BOARD · PLAY · YOU · HOST, then the room's INVITE · PLAY · YOU · GUESTS · GAMES · CHAT); 27 / 27.
- **0e PLAY NOW's cloud reds** (`582ffb18`): `tests` ✅; `harbor` ❌ ×1 — NO TWO CAMERAS at `hours-dusk@16:40` ("the end: 86×48 item: its copy
  27,-48 pt away"). The 86×48 item = the crisp ROOF POSTER. **The cause:** its two crisp copies share z 1 (the day face + its lamp-lit copy over it)
  and `crisp.js` stacked same-z canvases by HISTORY (a new canvas or a crossfade went to the top of the host): a return landing at dusk made the lit
  copy first (in the dark) and the day face after → the DAY face over the LIT one. **The fix:** same-z items stack in the order the city shows them
  each frame (a restack only when that order changes; a crossfade's new canvas right over its old one). **Evidence** (`cr-double --diag-all`): the
  roof poster's own-place mismatch ~26 in 5 / 5 old runs at 2× CPU (plain 8.4–8.6) → 10.5–10.9 (HOLD'EM) / 6.9–7.0 (JAYWALK); the cloud's exact red
  line was NOT reproduced locally (it fires when another offset happens to match 25 % better — pixel chance at ~26). After: Chromium cr-double 6 / 6
  (2×) + 1× green, WebKit wk-double 6 / 6, harbor `cameras` 13 / 13, `cameras` + `windows` 72 / 72, `roofcrisp` + `billboard` + `trivision` 15 / 15.
  The check unchanged. **Found, not fixed:** a 4× CPU red on the frames check (the hold's HOLD_MAX lets go before a re-bake started while hidden
  lands) — docs/harbor.md KNOWN ISSUES (a timing call for the owner). PLAY NOW 0f's `wx-late` red is not explained by this (no lit copy at 10:16).

## Group 1 — THE POOL FIXES

### How (never a hand edit of a built bank)
- The OVERCLOCK banks are BUILT (`node scripts/oc-pools/build.mjs --offline` — byte-identical before any change, then rebuilt). Every fix is at a SOURCE:
  the written rows (`scripts/oc-pools/written/*.json`), the MISSING LINK hand files (`hand/legacy-missinglink.json`, `hand/missinglink-written-*.json`,
  the new `-11`), SPELLCHECK's picks (`hand/spellcheck-picked.json`, `hand/legacy-spellcheck.json`), SORT IT's written sets, and — for what the builder
  can't fix at its source — **`hand/pool-fixes.mjs`** (THE POOL FIXES' data: `FACT_FIX`, `NP_YEAR`, `SHARED_TITLES` / `SHARED_BOOKS` /
  `SHARED_PAINTINGS`, `REVIEW_DROP` + `REVIEW_DROP_TEXT` with a reason each, `SORT_CARD_DROP`, `CC_VALUE_FIX`, `CC_LABEL_FIX`, `STAT_DROP`,
  `ML_ACCEPT_ADD`, `REAL_WORDS`).
- A wrong Wikidata value is fixed ONCE in `parts/20-wd-hl.mjs` (before `ctx.wd` is shared), so HIGHER OR LOWER, TIMELINE, CLOSEST CALL, T/F and
  TRIVIA's comparisons all read the fixed fact (Titicaca, Loch Ness, Arches, Wind Cave, Louisville were flagged in two reviews — one fix each).
- **THE 8 BUILDER RULES are checks** (`scripts/oc-pools/pool-rules.mjs` + `kidsafe.mjs`, run by `build.mjs` on every row; re-run on every shipped +
  reserved item by `tests/overclock-pool-rules.test.mjs`): 1 real compounds (`falseCompound` — a prefix / suffix reading at another cut is suspect
  unless read by hand; `FALSE_COMPOUNDS`), 2 US-only (`notAmerican` — `BRITISH_ONLY` + a one-word join in en_US or a hand-read `ENABLE_US_OK`),
  3 irregular plurals + every other answer that fits (`irregularPlurals` — real words only; `otherAnswers` — side-aware, phrases only where the puzzle's
  clue is a phrase), 4 THE KID-SAFE FILTER (`kidsafe.mjs#unsafeIn` — whole words / phrases, every text of every bank incl. MISSING LINK's JOINS and
  THE PASSWORD's answers), 5 "came out" = the release (`FACT_FIX`), 6 a park's year = its NP designation (`NP_YEAR`, the ONLY source: a park not in it
  ships no year), 7 a shared title carries its year (`sharedTitleNoYear` — the title slot of each template only; the T/F + trivia templates write
  "the 2009 film Sherlock Holmes"; a decade question about one is out), 8 an area / height names its measure (`measureMissing` / `compareMeasureMissing`).

### Each bank — before → after (all = party + reserve; the party's in brackets)

| bank | before | after | floor (the content test) |
| --- | --- | --- | --- |
| TRUE OR FALSE | 1,998 (1,581) | 1,993 (1,572) | 1,950 |
| HIGHER OR LOWER | 43 stats · 1,124 (919) | 43 · 1,123 (918) | 40 · 1,000 |
| TIMELINE | 18 themes · 496 (387) | 18 · 494 (386) | 18 · 450 |
| SORT IT | 176 sets (144) | 176 (144) — 5 cards out | 150 |
| TRIVIA | 3,759 (3,010) | 3,727 (2,975) | 3,600 |
| CLOSEST CALL | 889 (722) | 887 (720) | 880 |
| MISSING LINK | 977 (810) | 971 (805) | 950 |
| SPELLCHECK | 1,557 (1,263) | 1,556 (1,262) | ~1,500 |
| THE PASSWORD's answers | 1,402 | 1,398 (a 699-day cycle) | — |

### THE REVIEW's flags — every one (FIXED / DROPPED / NOT A BUG)
(Note: four of part 1's written ids point at a NEIGHBOURING row — `w2szu9j` is the squid-ink question, `w6epcuz` the hammerhead, `w1c2rpe1` the iris,
`w1e73ilb` the seesaw; the flags were matched by their TEXT: the octopus, the stingray, the 32 teeth, the hail.)

**TRIVIA (data-built)**
- `t-city-country-Q7525-Q212` Sevastopol — DROPPED (disputed since 2014).
- `t-mountain-country-Q43512-Q843` K2 — DROPPED (on the China–Pakistan border; a one-country question can't hold it).
- `t-author-Q26193-Q924927` the Protocols — DROPPED + THE KID-SAFE FILTER ("protocols of the elders of zion", "elders of zion").
- `t-author-Q651532-Q321691` The Three Little Pigs — DROPPED (a folktale has no author).
- `t-author-Q557867-Q59896` Fifty Shades — DROPPED + THE KID-SAFE FILTER.
- `t-team-Q32096` the Super Bowl — DROPPED (a game, not a team).
- `t-team-Q206312` the Arizona Coyotes — DROPPED (inactive since 2024).
- `t-compare-mountain-height-…` Logan vs Mauna Kea — FIXED (RULE 8: "…the highest above sea level?" — the whole template).
- `t-compare-lake-area-…` Huron vs Tanganyika — FIXED (RULE 8: "…largest by surface area?"; the country / state / park comparisons say "by total area",
  islands "by area", skyscrapers "to its architectural top").
- `t-decade-Q49740` Minecraft — DROPPED (2009 public, 2011 official — two answers to "first come out").
- `t-decade-Q36092` Lilo & Stitch · `Q182218` The Avengers · `Q199839` The Jungle Book · `Q19090` Robin Hood · `Q20502242` Wonder Woman — DROPPED
  (RULE 7: a shared title must carry its year, and in a decade question the year IS the answer). The rule also took The Lion King, Frozen, Dumbo,
  Lady and the Tramp, Beauty and the Beast, Mulan, Hercules, Alice in Wonderland (decade questions about a remade film).
- `t-decade-Q6911` the Diary (1947 / 1952) — NOT A BUG ("first published" = the 1947 Dutch edition; the 1950s is a fair wrong answer).
- `t-decade-Q127149` Lolita — DROPPED + THE KID-SAFE FILTER.
- `t-decade-Q4845793` Inferno — DROPPED (RULE 7, `SHARED_BOOKS`: Dante's + Dan Brown's).
- `t-decade-Q639619` Super Mario Bros. 3 — DROPPED (RULE 5: Japan 1988, the U.S. 1990 — the release a player knows is the later one).
- `t-decade-Q953491` Battleship — FIXED (RULE 5: the Milton Bradley board game 1967 → the 1960s; also in H/L + TIMELINE's board games).
- `t-character-Q213480-Q15228` Legolas — DROPPED (the Hobbit films have him).
- `t-athlete-Q142794` Neymar · `t-athlete-Q68060` Buffon — FIXED (the template never offers Football beside Soccer, or Soccer beside Football — the
  other code swapped for a sport not on the card, no new random draw).
- `t-president-Q11613` Truman · `Q34597` Garfield · `Q8612` Andrew Johnson · `Q11881` Tyler — FIXED (the template: a president IN OFFICE that year is never a
  wrong answer — FDR 1945, Arthur 1881, Lincoln 1865, Harrison 1841).

**TRIVIA (written)** — the row fixed at its source (`written/tv-*.json`) unless DROPPED (`REVIEW_DROP_TEXT`)
- baby fox — FIXED (wrong: a calf · a foal · a joey). · tarsier — FIXED ("…the biggest eyes for the size of its body?").
- firefly — FIXED (the beetle → the ant). · moose — FIXED (the elk → the white-tailed deer). · octopus — FIXED (the squid → the crab).
- stingray — FIXED (the eagle ray → the skate). · the Labrador — DROPPED (the French Bulldog since 2022).
- 32 teeth — FIXED ("…a full adult set, wisdom teeth included?"). · saliva — FIXED (fat → fiber).
- kiwi — FIXED ("…most kiwi fruit sold in stores?", "Yellow only" → purple). · wasabi — FIXED (horseradish only → turmeric).
- rice — FIXED ("…the main staple food for the most people…"). · checkers — FIXED ("…an American checkers board?").
- Lake Michigan — FIXED ("…the largest lake entirely within the United States?"). · Nightingale — FIXED (Mary Seacole → Dorothea Dix).
- Missouri River — DROPPED (measurement-dependent). · Mauna Loa — FIXED ("…the largest active volcano…").
- the Gobi — DROPPED (the Arabian Desert is larger — the answer itself was wrong). · the Grand Canyon — FIXED ("Which famous Arizona canyon did the
  Colorado River carve?"). · the main gas we breathe out — FIXED ("…breathe out much more of than we breathe in?").
- hail — FIXED ("What are the balls of ice that fall from thunderstorms called?"). · fault line — DROPPED (the answer is a plate boundary).
- the 1980 Olympics — FIXED (Squaw Valley → Innsbruck; + THE KID-SAFE FILTER). · sport of kings — FIXED (polo → tennis).
- the marathon — FIXED ("Which modern Olympic event…"). · bicycle kick — FIXED (football → volleyball).
- Texas the republic — FIXED (California → Ohio). · ketchup — FIXED (Malay → French). · Sydney — DROPPED (measure-dependent, ABS 2025).

**TRUE OR FALSE**
- `d-capital-Q983-…` Equatorial Guinea — DROPPED (the capital move runs to 2027). · `d-decade-Q271189` Hercules · `Q199839` The Jungle Book ·
  `Q220365` NFS: Most Wanted — DROPPED (RULE 7, before the template cap — the cap refills).
- `d-director-Q200396-…` Sherlock Holmes · `Q27188178-…` Aladdin · `Q174385-…` Alice in Wonderland — FIXED (RULE 7: "The 2009 film Sherlock Holmes
  was directed by Guy Ritchie." — the director / author / painter templates).
- `d-painter-Q1638622-Q5681` Adoration of the Magi — DROPPED (Mantegna painted one too; `SHARED_PAINTINGS` for the rule).
- `d-painter-Q326503-Q296` Courbet — DROPPED + THE KID-SAFE FILTER. · `d-painter-Q512755-Q41264` "hijo gey" — DROPPED + THE KID-SAFE FILTER (the
  same garbled label also left TIMELINE's paintings).
- eggplant — FIXED ("Most eggplants sold in U.S. stores…"). · tortillas — FIXED ("Mexican tortillas…"). · Denali — DROPPED (Mount McKinley again, 2025).
- dinosaurs — FIXED ("non-bird dinosaurs"). · food chain — FIXED ("…usually starts with a producer, like a plant."). · hockey — FIXED ("Ice hockey…").
- chess — FIXED ("In chess, a player who is checkmated loses the game."). · tempo — FIXED ("The speed of a piece of music…").

**CLOSEST CALL**
- Titicaca 489 → 281 m · Loch Ness 272 → 229.8 m — FIXED (`FACT_FIX`, shared with H/L). · Encanto 109 → 102 min · The Sword in the Stone 75 → 79 min — FIXED (`CC_VALUE_FIX`).
- Arches 354.2 → 310.31 km² · Acadia 157.01 → 198.61 · Wind Cave 114 → 137.48 — FIXED (NPS gross acreage, Dec 31 2025).
- Louisville 246,161 → 633,045 — FIXED (the metro-government balance; shared with TIMELINE's U.S. cities).
- the seven countries + the 17 states (land vs total) — FIXED (RULE 8: "What is the total area of …, including water, in square miles?" — every
  country + state question); France → "France, with its overseas regions", Norway → "Norway, with Svalbard + Jan Mayen", Ireland → "the Republic of
  Ireland" (`CC_LABEL_FIX`).
- Redwood 314.63 → 562.88 · Petrified Forest 599.89 → 895.93 — FIXED (the pool's measure is the NPS GROSS area; "the total area of …").
- the Millennium Bridge — FIXED ("London's Millennium Bridge"). · Willis Tower — FIXED (RULE 8: "…to its architectural top"); Eiffel Tower — FIXED
  ("…to its tip" — every tower; every skyscraper to its architectural top: the stored values were checked — Burj 828, Willis 442.1, Petronas 452).
- Lawrence of Arabia — DROPPED (three cuts). · Ben-Hur — DROPPED (212 vs 222 with the overture — 4.7 %, a real choice).

**MISSING LINK** (part 2, both slices)
- MEN (`m-man`) · FLIES (`m-fly`) · KNIVES (`m-knife`) — FIXED (RULE 3, automatic). · SOFT (`m-hard`) · WRITING (`m-writer`) · WARD (`m-town`) ·
  BALL (`m-brow`) · HIGH (`m-low`) — FIXED (`ML_ACCEPT_ADD` where the dictionaries can't confirm a join; the side-aware one-answer rule found more —
  86 puzzles gained a real alternate, e.g. HALVES, CHILDREN, SISTER for BROTHER).
- COAST GUARD (`m-guard`) · PEN NAME (`m-name`) · RED TAPE (`m-tape`) — FIXED (moved to `missinglink-written-11.json`: the legacy form picked
  COASTGUARD, PENNAME, TAPERED). RULE 2 then also caught `m-coast` (COASTGUARD) — DROPPED.
- FIREBACK → FEEDBACK (`m-back`) · WATER GATE → GATEWAY (`m-gate`) · POWER POINT → VIEWPOINT (`m-point`) · COTTON WOOL → COTTON SWAB (`m-cotton`) ·
  LEGEND → BOOKEND (`m-end`) · GREENWOOD → DRIFTWOOD (`m-wood`) · FREEHOLD → FOOTHOLD (`m-hold`) · TOPSAIL → SET SAIL (`m-sail`) · BROADCLOTH →
  CHEESECLOTH (`m-cloth`) · RESTORE + RESTART → ARMREST + HEADREST (`m-rest`) · RADIO CLOCK → CLOCK RADIO (`m-radio`) · BEETROOT → SQUARE ROOT (`m-root`)
  · OVERJOY → JOY BUZZER (`m-joy`) · HOOKUP → COAT HOOK (`m-hook`, + THE KID-SAFE FILTER) · CROWFOOT → EAT CROW (`m-crow`) · WHIPSAW → WHIPLASH
  (`m-whip`) · PLUGHOLE → SPARK PLUG (`m-plug`; FIREPLUG kept — M-W's American word) · BAREBACK → BARE BONES (`m-bare`, + the filter) · RIPSAW → RIP
  CURRENT (`m-rip`) · SHARECROP → MARKET SHARE (`m-share`) · NEWSREADER → MIND READER (`m-reader`; LIPREADER kept — en_US) · PUPPY FAT → HUSH PUPPY
  (`m-puppy`) · PICKLE BALL → DILL PICKLE (`m-pickle`) — all FIXED.
- AIR CASTLE (`m-castle` — BOUNCY CASTLE is British too) · COTTON WOOL (`m-wool`) · BACKSTAIRS (`m-stairs` — 8+ answers) · MINICAB + CABSTAND (`m-cab`)
  — DROPPED (no clean American replacement).
- Found by RULE 1 beyond the review: REINFORCE + REINVEST (`m-rein`) — DROPPED; HAMMOCK (`m-ham`: HAM + MOCK) → HAM RADIO + HAM SANDWICH — FIXED;
  FIRELIGHTER (`m-lighter`, British) → LIGHTER FLUID — FIXED; SHOP WINDOW (`m-window`) → WINDOWSILL; BIGFOOT (`m-foot`, a name) → FOOTNOTE — FIXED.

**SORT IT** — the Mackenzie River (`d-river-2000mi`) · Indonesia (`d-in-asia-oceania`) · "Commonwealth realm of Guyana" (two continent sets) ·
Palomino (`w-dog-breed-horse-breed`, a coat colour) — DROPPED (`SORT_CARD_DROP`; Palomino at its source).

**HIGHER OR LOWER + TIMELINE** — all FIXED via `FACT_FIX` / `NP_YEAR` / `STAT_DROP` unless noted:
Titicaca 281 · Loch Ness 229.8 · Lake Nicaragua 26 m · Arches 310.31 · Wind Cave 137.48 · Gateway Arch 0.7803 · Big Bend 3,242.19 · American Samoa
33.41 km² (the acreage report's gross, like the rest of the pool) · Tesla Cybertruck 2023 · Model X 2015 · Roadster 2008 · TurboGrafx-16 1989 ·
Woolworth Building 1913 · Millau Viaduct 2004 · Akashi Kaikyō 1998 · Rialto 1591 · the Colosseum AD 80 · the National Zoo 1891 · Badlands 1978 ·
Georgia Aquarium — DROPPED (not a zoo) · Lamborghini 1963 · Louisville 633,045 · Somalia 19,000,000 · Capitol Reef 1971 · Chiricahua — DROPPED
(Wikidata's 1924 is the MONUMENT; the review reports the national-park redesignation on Oct 20 2026 — not verifiable here, and past the pool's 2025
cut-off either way: RULE 6's table holds no year for it) · Acadia 1919 · Dell 1984 · Green Day 1987 · BTS 2010 (the theme asks
"formed") · Great Basin 1986 (found by RULE 6 — Wikidata had 1987).
- the Netherlands' high point 870 m — NOT A BUG: Mount Scenery on Saba is in the Netherlands PROPER (a special municipality since 2010), not only the
  Kingdom — 870 m is the country's highest point.

**SPELLCHECK** — `slutty` — DROPPED (THE KID-SAFE FILTER). `pollan` · `assart` · `unbanded` · `untile` · `translater` · `resistent` · `sinal` — FIXED
(each replaced by a non-word at its source; `REAL_WORDS` — a wrong option that is one of them drops the row, so none comes back).

### THE PASSWORD's answers (`api/_data/pw/answers.json`)
- befit · cupid · kudos · owlet — DROPPED, each verified (a formal verb, a name, an -S word that reads as a plural, one of the two rarest words), through
  the builder: `scripts/pw-words/blocklist.mjs#POOL_FIXES_CUTS` (applied with the reviewer's cuts; `kudos` out of `KEEP_S`) + THE KID-SAFE FILTER in
  the build. No `count_1w.txt` on the machine → `node scripts/pw-words/build.mjs --recut` (new): the build's own final step on the built list — the same
  output a full rebuild gives when only cuts are added (DFIX1's precedent). 1,402 → 1,398.
- **THE PICK VERDICT — NOT PREDICTABLE.** The file is alphabetical, but the day's pair comes from THE FROZEN SCHEDULE (`api/_lib/pw-day.js`): an
  HMAC-SHA256-keyed Fisher–Yates order per cycle, keyed by THE DAILY SECRET (server-only) — the list's order feeds nothing a phone can see.
  `tests/pool-fixes-password.test.mjs` proves it on the real list (60 days: no fixed step, the next day never the alphabetical neighbour; another
  pepper, another schedule). No reshuffle was needed. **One guard added:** a list edit now keeps TOMORROW's pair too (`pw-day.js#KEEP_AHEAD` = 1 —
  `reconcileSchedule` keeps through `idx + 1`): a cut word already on tomorrow still plays tomorrow; the day after slides (the test). THE DAILY
  SECRETS rule holds (`tests/daily-secrets.test.mjs`).

## Group 2 — THE HOLD'EM SLIDER (`96c00956`)
See `docs/holdem.md` "THE BET SLIDER": − / + with pointer capture, the repeat stopping on pointerup / pointercancel / lostpointercapture / window blur /
visibilitychange; THE ONE POINTER; THE CONFIRM LOCK (`bet-steps.js#confirmLock`, pure + numbered). Proof: unit 14 / 14, `e2e-holdem` FAST 22 / 22, WebKit
`wk-holdem-slider.mjs` 26 / 26 (hold + blur and hold + hidden stop at once; CONFIRM twice = ONE act; a second finger changes nothing).

## Group 3 — WHO'S ON: ONE CARD WIDTH (the owner's 1:21 pm add-on — `59bdf458`, refined in `e308c6ca`)
- The card column was what the place text left over → a short "THE CITY · now" stretched one card and squeezed its place into a sliver. Now the
  **PLACE + TIME column is the fixed one** (`--wo-meta-w` 92 px on a phone, 168 on /admin's desktop) and every slim card takes the SAME rest of the row
  (`ui/strip-board.js` as ever); a place part (`whos-on.js#whereParts`, inline-blocks) breaks only between parts, or at its own spaces when it alone is
  too wide ("THE / PASSWORD" — never a sliver).
- **Why not a fixed narrow CARD** (the first refine pass): a slim card keeps 124 px for its hero (THE HERO-SPOT RULE — `vault/hero.js`), so a 208-px
  card left the name 12 px ("BEN" → B / E / N). The names need ~232 px of card at a phone width.
- Shots: `shots.mjs` `wo-sheet` (the city + a room) + `wo-sheet-4` (+ a daily, a solo run, a 12-letter name) at 390 / 402 / 430 / 1440.

## ADD-ON 2 — THE ROOM NOTE, ONE LINE (the owner, Nov 13 1:38 pm — `0c886b8e`)
- "PRISM DROP IS ON · TAP TO WATCH" — a slim pill sized to its words, 14 pt above the dock (52 pt when a mid-daily / rematch label sits over PLAY),
  its own `.rc-note` (the title's shared `.nd-note` hidden in a room — it could outlive the room before); a **×** (44 × 44 pt) hides it until the NEXT
  match (per match id, `localStorage nd:note-x` = `CODE:matchId`, survives a refresh); the body opens the watch, and the FIRST watch of a match says
  once in a toast "Watching PRISM DROP · You're dealt into the next one". The idle note (ROOM CLOSES IN n MIN · TAP TO KEEP IT OPEN / · A GAME
  KEEPS IT OPEN) — the same pill, no ×. Pure: `js/core/room-note.js`; taps through `dock.pressTap`, repaints through `afterTap`.
- Proof: unit `room-note` 4 / 4; the harbor group `roomnote` 10 / 10 (in the `lobbyfix` job) + afterparty, gameflows, tapfit, corners, roomfix — 73 / 73;
  shots `rn-watch` / `-day`, `rn-idle` / `-day`, `rn-idle-mid` at 390 / 402 / 430 (+ 1440), two refine passes.

## ADD-ON 3 — THE BOARD's LOST TAP + WHO'S ON in /admin + STATIC CARDS + GAMES PLAYED (the owner, Nov 13 1:41–2:10 pm)
1. **THE BOARD's LOST TAP** (`83f19405`): the cause — ANOTHER tab's switch landing during the press (the previous tab's late / rescue click):
   `pickTab` rebuilt every tab button, so the HOLD'EM button under the finger was a new node at the lift and Safari sent no click (the owner's list of
   re-rendered elements = that one call chain's order). Now the tabs, the period switch, RECORDS / CAREER and the picks are built ONCE (selected state
   in place); the plate's text set only when changed; every rows swap through `tapwatch.js#afterTap`. Proof: `tests/integration/wk-board-taps.mjs`
   (WebKit 402×874 @3, touch, the rescue OFF, /api/board 300 ms late; per tab: finger down → another tab's switch + a period flip + both answers land →
   finger up): 9 / 21 on the old code (the watch's report = the owner's list) → 22 / 22 — 0 lost taps, the SAME nodes at the end as at the load.
2. **WHO'S ON in /admin STATS** (`e308c6ca`): the section had the PLAYER block's class (`.ad-who` — a flex ROW): the heading floated beside a list
   squeezed into the right half. Now `.ad-whoson` — the heading on its line, full-width rows, the footnote under them (on a phone the list takes 8 px of
   the card's padding back — the card's name room). Shots: `admin-probe.mjs` `STATS=1` (the WHO'S ON answer stubbed in the browser) at 390 / 402 / 430
   (+ 1440): cards 238 / 250 / 278 px, one width a list.
3. **STATIC CARDS** in both lists: no effect surface — each strip its BAKED STILL / its CSS art (`vault/stills.js` — NO BLACK TILES); `.is-still` stops
   every CSS animation in the list (0 animations measured).
4. **GAMES PLAYED**: the playable games + any game with plays in the period (the frozen ten at 0 gone).

## The close — the local runs (the mini PC, fresh emulators + `serve.mjs --emu`, nothing else busy)
| suite | result |
| --- | --- |
| unit `node --test tests/*.test.mjs` | 1813 / 1813 |
| rules · /api `server.test` · the dealer | 82 / 82 (no rules change) · 55 / 55 · 21 / 21 |
| e2e-profiles (first, on the fresh emulators) | 147 / 147 |
| smoke | 8 / 8 |
| e2e-holdem FAST · wk-holdem-slider | 21 / 21 · 26 / 26 |
| e2e-oc-new · e2e-oc-2 (N=4) | 75 / 75 (after the HUMAN FLOOR pacing fix — `67a8008b`; the same 2 reds on cfb7eb0b) · 27 / 27 |
| e2e-daily · e2e-password (a DAILY_TEST server on :5179) | 53 / 53 · 40 / 40 |
| e2e-oc-2 + the others above + the FULL e2e-harbor (4 shards + the tails, ~35 min) | **1313 / 1315** — each red checked: SIGHTINGS "the capture never hitches" (worst frame 116.7 ms vs the 100-ms bar, the frames' median 33.4 ms under the 4-shard load) and THE DANCERS' ARMS NEVER JUMP (1 jump in 310 frames) — both groups re-run alone ×2: 18 / 18 and 18 / 18 (median 16.7 ms, worst 66.7–83.3 ms; 0 jumps). Neither group's code was touched by this pass; both read the load, not a change here — left as found (no tolerance widened), noted for the cloud run. |

**Rules: NOT CHANGED** (`database.rules.json` untouched since cfb7eb0b; rules 82 / 82) — no re-publish. **All the pass's servers stopped at the end** (the
emulators, `serve.mjs --emu` :5173, the DAILY_TEST :5179, the BEFORE worktree's :5174; the owner's :5190 preview left running).
