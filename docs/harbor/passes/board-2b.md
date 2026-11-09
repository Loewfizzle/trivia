# BOARD 2.0 B — the screens: SLIM CARDS EVERYWHERE + THE PLAYER PAGE (Nov 9 2026)

A screens pass after BOARD 2.0 A (the server + the data). **ONLY** what the brief listed: Step 0 + THE MOCK (stopped for the owner's OK), THE BOARD's
screens, DAILY → SCORES' ALL TIME + THE FRIENDS LIST, THE PLAYER PAGE + THE LONG-NAME FIX, + the owner's mid-pass ADD-ON (SHARE TODAY = ONE CARD).
Nothing else from the notes started. **No rules change** (database.rules.json untouched — nothing to re-publish). **Still 8 functions.** Two fields
were added to EXISTING actions (the brief's rule — never a 9th function): the friends answer (`/api/profile friends`) gains each FRIEND's `wx` (their
XP this week — `pstats/{pid}/xw`, the OVERALL board's own counter); `/api/daily today` gains an opt-in `share` (SHARE TODAY's tap only — below).

## Step 0
plan.md — "OWNER'S NOTES — NOV 9 (morning)" appended unchanged (part 82) + the build table line; decisions.md (the current line; BOARD 2.0 A: ALL
TIME = 'span' DECIDED; BOARD 2.0 B: the questions round DECIDED, ← BUILDING). 93d202e0. The add-on → plan.md "OWNER'S NOTES — NOV 9 (B's add-on:
SHARE TODAY)" (35d8ba96).

## THE MOCK + the owner's answer
`tests/integration/board2-preview.html` — the REAL strips (ui/strip-board.js), the REAL full card (vault/full.js#openFullCard), scripted rows (a full
week, an empty week, a 12-letter name, YOU below the top 100, a limited player). Two refine passes looked at (the tabs clipped "OVERCLOC", the ⋯ read
as dashes, the dailies plate wrapped, #1,342 ran into the card, the strips stretched on desktop) → 8 shots. The shots didn't open on his phone
("not on this device") → a private claude.ai page with the shots embedded (`Board 2.0 B Mock`). **The owner**: "Everything looks good … everything
besides the background. I don't like the fact that it's brown and in the bar area it looks super cheap. I want something to look premium." → three
backgrounds drawn on the same board (`&bg=city|velvet|glass`): 1 THE CITY behind it, 2 BLACK VELVET + GOLD DECO, 3 NIGHT GLASS. **The owner**: "I
like number 2 or number 1. You can pick." → **2, BLACK VELVET + GOLD DECO** (the same at every hour — the city's still would put a bright day sky
behind the gold title; drawn in code, nothing to load on /board; a gold sunburst fits a hall of fame). plan.md "OWNER'S NOTES — NOV 9 (B's mock)".

## Group 1 — THE BOARD's screens (09408317)
- **THE TABS** = XP · DAILIES · OVERCLOCK · PRISM DROP (`board/view.js#TABS` — four even pills), opening on XP, THIS WEEK (the period no longer
  restored from the session); THIS WEEK / ALL TIME on every tab; DAILIES' chips ALL DAILIES · THE PASSWORD · COAST CLEAR; a game tab keeps
  RECORDS / CAREER + its chips. A deep link / the preview's game without a tab (a hidden game) → XP (`tabOf`).
- **THE ROWS = SLIM CARDS** through `ui/strip-board.js` (stripKit / stripFor / stripFx — never a second strip system; A's rows carry exactly its
  fields): the rank LEFT (gold / silver / bronze coins for the top 3), the score on the line UNDER the card at its right end with its unit (XP · PTS ·
  AVG — `unitOf`), ⋯ REPORT at that line's left (a drawn three-dot, a 44 pt tap area), YOUR card in a drawn gold frame (`profile.bid`) + a YOU chip.
  A tap on a card = THE PLAYER PAGE (the app; `onPlayer`).
- **YOUR CARD PINNED** at the panel's foot: your exact rank from `ranks` (even #1,342 — a long rank shrinks to fit its column), your value; a
  dailies board's ALL TIME below 10 days: "N MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3" (`ranks` → `mine`); under the 3-match floor "N MORE
  MATCHES TO JOIN THE BOARD"; an empty XP week "0 XP · NOT ON THE BOARD YET".
- **THE PLATE**: XP THIS WEEK · TOTAL XP · POINTS THIS WEEK · AVERAGE A DAY; "RESETS MONDAY · IN 6D 16H" from the answer's `ends`; "RANKED FROM 10
  DAYS PLAYED" on a dailies ALL TIME.
- **EMPTY + DARK, designed**: A FRESH WEEK ("The board starts over every Monday…") with a drawn crown emblem — every Monday is a real state; NO ONE
  RANKED YET on a dailies ALL TIME; THE BOARD IS DARK RIGHT NOW + TRY AGAIN when /api is down.
- **THE BACKGROUND**: black velvet (near-black plum, a warm glow behind the title, a fine gold pinstripe fading down) + a gold Art Deco sunburst
  drawn once in SVG (bigger on desktop); the panel dark glass with a gold hairline. Nothing animates. The brown hall (board/scene.js) is no longer
  drawn in the app (`scene.js` stays: `tests/integration/og-board.html` builds /board's link preview from it — see Known issues).
- **THE TITLE'S PREVIEW** (a sign's game sheet): the top three as slim cards (the medal left, the score under); SEE THE FULL BOARD only for a game
  with a tab.
- **THE SPEED RULES**: only the top 10 cards built (SHOW ALL builds the rest; the pages after it as they scroll in, to 100), ONE fx surface for the
  list (+ one for your pinned card), every strip CALM, only on-screen slots draw (fx/renderer.js), the board is its own screen (the city isn't
  running behind it); a tab / period / chip change rebuilds the list only — the controls are rebuilt only when their own state changes (THE TAP
  WATCH). **Scrolling all 100 cards: 60.1 fps at 1× CPU, 58.9 fps at 4× CPU (2 frames > 25 ms in 5 s)** (shots.mjs `--fps --cpu 4`, 390 × 844).

## Group 2 — DAILY → SCORES' ALL TIME + THE FRIENDS LIST (dc86b60c)
- **SCORES: TODAY'S SCORES · ALL TIME** (a quiet two-way switch under the tabs — no pills). ALL TIME per daily: YOUR TABLE · AVERAGE A DAY (`/api/daily
  points` once a visit → the PURE `today-logic.js#allTimeRows` / `allTimeLine` — ranked from 10 days, best first, ties share a place; YOU below 10
  days: "3 MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3" on two lines; a friend below: "7 OF 10 DAYS · 95.0 AVG") as the same slim-card rows, then
  EVERYONE · ALL TIME (the daily's ALL TIME board's top 3 as slim cards) + SEE THE FULL BOARD › (THE BOARD on DAILIES · ALL TIME on that daily —
  `boardGame / boardBoard / boardPeriod`, cleared by the dock's BOARD). /api down → "The averages are resting"; nobody ranked → a quiet line.
- **YOU → FRIENDS as SLIM CARDS** (`profile/friends-ui.js#cardList`): friends IN YOUR ROOM first (HERE + the green dot — the only presence), then the
  rest by THIS WEEK's XP (the number under each card — the friends answer's new `wx`), the top 5 + "All n friends" (the same cards in its sheet); the
  line under each card: ⋯ (REMOVE / BLOCK) · HERE · "1,240 XP THIS WEEK"; a tap on a card = THE PLAYER PAGE. Requests + SENT + RECENTLY PLAYED WITH
  unchanged. Preview: `tests/integration/friends-preview.html`.
- **THE DOCK: NO CHANGE** (`[ JOIN ] [ DAILY · BOARD · GAMES · YOU ] [ HOST ]`) — harbor `dock` green.

## Group 3 — THE PLAYER PAGE + THE LONG-NAME FIX (737a03bb)
- **`js/profile/player-page.js#openPlayer`** (+ `css/player.css`, prefix `pp-`): reads ONLY `POST /api/profile { action: 'player' }`. A full sheet
  (`.vl-full.pp`) over the paused page through THE COVER (`vault/full.js#coverBehind` — now exported) on THE LAYER STACK: the full card with its live
  effects (`fullCardEl` — no member line, the top line NEON SPEAKEASY; an unapproved card → the Gilded card without its Nº) · LEVEL n + the band +
  its line + the flame (only while `alive`) · RAREST ACHIEVEMENTS (the 3 names + the medals — `progress/trophies.js#medal`, now exported — + "<1% OF
  PLAYERS") · INVITE TO THE ROOM (you in a room, they a friend NOT in it) or the friend button · ⋯ by `rel` (friend → REMOVE · BLOCK; none → ADD
  FRIEND · BLOCK; in → ACCEPT · BLOCK; out → CANCEL REQUEST · BLOCK; blocked → UNBLOCK). NOT the stats, NOT the best game.
- `limited` (hidden / opted out / they blocked you) → the name + the emblem + "This member keeps their card private." (the same words for all —
  a block is never told); no card, no ⋯. /api down → the name + the emblem from what the screen had + "Their card is resting". Loading = a
  card-shaped skeleton with the name + emblem the screen had (no spinner). Your OWN name → YOUR CARD (`screens/profile.js#openCard`).
- **Every tap**: a board row (`{ b, bid }`), a friend (`{ pid }`), a room's name tag (`room-city.js#openPlayerCard` → the page with the room's own
  rows under it: MAKE HOST + the owner's CREW switch), the podium (`friends-ui.js#openTheirCard` → the page for a player with a profile).
- **THE LONG-NAME FIX**: the cause — THE CARD PASS's strip zoom (`.vl-s-* .vl-mat { … / 46% auto }`) had shrunk the FULL cards' art too (a box in
  the middle), while their effects + hero boxes assumed a cover map → the plate's column was the art box's edge. Now each FULL card has its own art
  layout: SAFECRACKER + GHOST RUN set right at 78 %, PERFECT WEEK at 80 %, their edges faded into the card's ground (css/vault.css `.vl-fcm-*`), the
  maps say the same (`full: [100, y, z, 'w']` — a zoom by the card's WIDTH = exactly the CSS; cc/pw/dm-specs.js) so the effects line up with the art
  again; PENTHOUSE's dial a little smaller + flush right (`ph-specs.js#PH_FULL_Z` 0.8). **MAXIMILIANOS on ONE line on all four at 390 / 402 /
  430** (namefit-probe: none listed); `W × 12` two clean 17 px lines like the 21 other full cards. LAB_V: full-card-penthouse 3, safecracker /
  ghost-run / perfect-week 2 + their LAB_CHANGES lines (CHANGED in THE LAB).
- **Proof**: `e2e-profiles` **134 / 134** (+ 8b: the page from a board row — the card, LV, ⋯, the cover, no stats, no pid; CLOSE lifts the cover;
  from a room's name tag — ADD FRIEND; from the friends list — BOB HERE + his week's XP, no INVITE in the same room; a HIDDEN player → limited; a
  BLOCKER → the same private page). The board steps now read XP (cipher has no tab) and the rows' slim cards.

## THE ADD-ON — SHARE TODAY = ONE CARD FROM EACH DAILY's OWN PIECES (fcabacef)
- **The split**: `password/share.js` + `coastclear/share.js` export their PIECES (`paintSign`, `paintDoors`, `paintHead`, `paintLine`, `paintGrids` /
  `paintBeam`, `paintHead`, `paintTime`, `paintLine`, `paintLamps`) + `paintSection` (SHARE TODAY's section: its small wordmark — "the password." /
  "coast clear." by day, the neon sign by night — then two columns: THE PASSWORD the headline, the line + the drawn doors | the coloured grids;
  COAST CLEAR the headline over the beam, the line + the searchlights | THE BIG TIME, a caught run's searchlights there instead). Each own card =
  the same pieces. **Pixel-identical**: `tests/integration/share-same.html` draws every own card with the split pieces AND with the code before the
  split (`tests/integration/_old/`) — **18 / 18 SAME** (3 PASSWORD runs × with / without a day number + 3 COAST CLEAR runs, × night + day).
- **SHARE TODAY** (`js/daily/share-today.js` — the ticket version replaced): ONE header (the date + the streak flame), a section per FINISHED daily in
  the dailies' order (scaled evenly, never past its own size, up to 6), "NOT YET: <name>" once for the rest, ONE foot (NEONSPEAKEASY.COM — CITY
  FIXES' neon tube at night, navy by day). ONE daily finished = that daily's OWN card exactly. A daily with no painter / no share data → its name +
  its result line (`planToday`, PURE — `tests/share-today.test.mjs`).
- **The data**: `today { share: true }` → `share: { [game]: … }` from the SERVER's record of YOUR finished runs (a cart's `share()` — THE PASSWORD:
  `logic.js#shareRunOf` = each door's state + MARKS + the guess count, never a word; COAST CLEAR: `shareInputs` — no board). Asked only on the SHARE
  TODAY tap (the regular `today` carries none). `e2e-daily` **51 / 51** (+ the share data: marks + counts, no 5-letter string; the no-board inputs;
  only when asked; the card draws one section each; + SCORES' ALL TIME opened — the old "ALL TIME is hidden" check replaced).
- **THE BAR at 360 px wide**: the grid colours, both times and the address read (the shots). Before / after, night + day, both + one done, full +
  360: [board-2b/](board-2b/) — `before-*` (the ticket card) / `after-*`.

## Group 4 — the end
- THE BUSY-PC CHECK: CPU 2.9 % average over 24 s before the full harbor suite.
- **The local run** (the mini PC, fresh emulators + `serve.mjs --emu` on :5173, the `DAILY_TEST=1` server on :5176): unit **1438 / 1438** · rules
  **69 / 69** (unchanged) + rules-live 4 / 4 · `/api` server.test **44 / 44** · `e2e-profiles` **134 / 134** · `e2e-daily` **51 / 51** · smoke
  **6 / 6** (both playable games) · harbor `dock, playercard, hostcard, makehost, fullcard, cardfit, stripfit, platefit, youcard, youpage` **66 / 66**
  · `perf` **12 / 12** (THE BASELINE GUARD 0.85–1.10×) · share-same **18 / 18**.
- **THE FULL `e2e-harbor` SUITE** (4 shards, 34 min): **1218 / 1223** — the 5 reds, each run down:
  - **CREW × 2** (the owner taps a player → the CREW switch; THE CREW SWITCH LIVE) — THIS PASS: a room's name tag now opens THE PLAYER PAGE, which
    names the player by their profile username (not the room name the test matched). The page carries `data-pid`; `harbor-e2e/radio.mjs` matches
    it. The CREW row rides under the page (`extra`).
  - **THE LAB 2.0 × 2** (the counts) — THIS PASS: PERFECT WEEK's full card is CHANGED (the long-name fix) → 17 rows, 29 NEED YOU (`vault.mjs` counts).
  - **THE ROOM's OWN COST at 4× CPU** (43.9 → 53.1 ms under the 4-shard load) — A's known issue: ALONE green (31 → 30.6 ms).
  After the fixes: `crew, vault` **78 / 78**, `roomperf` **2 / 2** alone. The full suite was not re-run (34 min); the cloud's 15 harbor jobs confirm.

## Known issues
- `/board`'s link preview (`assets/og-board.jpg`) is still the old brown hall (`tests/integration/og-board.html` paints it from `board/scene.js`) —
  re-shoot it on the velvet in a later pass (it's an image asset — not built here).
- The player page's backdrop is 95 % dark: behind a list (the friends list) the cards ghost faintly through; over the city (its usual place) it reads
  as the city dimmed.
- The friends list shows each friend's XP this week to their friends even when that friend opted out of the public boards (the friends list is the
  owner's private view; the boards' opt-out is about the public lists).
- A hidden player's page can show their card for up to 30 s after they opt out (the server keeps a player's part 30 s a warm instance — A's cache).

## The cloud run
77b9780e (the harbor tag — both workflows): **harbor GREEN on the first run** (all 15 jobs — CREW + THE LAB with the fixes above); **Vercel BUILT**
("Deployment has completed"). **tests RED on the first run** — ONE unit test: CIPHER's (a frozen game's) whole-match simulation "answer not stored in
plain text" — a FLAKE older than this pass: the secret word picked at random can be a word that is also a JSON key or the phase's value (PHASE ·
MATCH · ROUND · INTRO) → the whole-JSON `includes` matched ~60 games in 20,000 (0.3 %). Fixed in the test (the check reads the stored string VALUES,
the phase name excepted: 0 / 20,000), unit 1438 / 1438; the second (and last) cloud run = the tests workflow on the fix (the ci tag, 15eb9fd6): **tests GREEN**, Vercel BUILT.

The servers this pass started (the emulators' Java + node, `serve.mjs --emu` on :5173, the `DAILY_TEST=1` one on :5176, the plain one on :5173
before them) all stopped; the owner's preview server on :5190 left running.
