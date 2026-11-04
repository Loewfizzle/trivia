# LOBBY FIXES — THE OWNER's REAL-PHONE TEST OF THE ROOM — Nov 4 2026

Step 0 = plan.md "OWNER'S NOTES — NOV 4 (afternoon, his tests)" (part 64) + decisions.md. The owner's approved mock: `Downloads\NEON\lobby\change-game.png`
(v2 — after a match ONE small pill above the REMATCH ring, the GAMES tab → NEW GAME in cyan). The lab's marks (refreshed first, `docs/vault-lab-marks.md`):
all 159 APPROVED, no FIX, no CUT. THREE ADD-ONS arrived during the pass (the owner, desktop 1440 × 900) — built as the last work group, before the end.
One session, the groups in order, no helper agents; each group committed + pushed (no tag). Nothing opened, created or written on the live site
(the lab's export is a read).

**THE DATABASE RULES CHANGED** — `seats/{pid}` (new) + `rooms/{CODE}/players/{uid}/pid` (needs the seat): the owner re-publishes them
(`tests/fixtures/rules-live.ack.json`). On the old rules everything still works: the seat's reads + writes are caught (no check, no seat),
and the server's overlap guard stands on its own.

## What changed

**Group 0 — the ☰ ADMIN row, REMOVE TEST PLAYERS, ONE ACCOUNT · ONE ROOM** (1970d35)
- **THE ADMIN ROW**: the ☰ menu shows **ADMIN** (→ /admin) for admins, right under THE LAB — the same server yes (whoami). The old ADMIN row
  (the city's preview panel) reads **CITY PREVIEW** now, so the two never share a name.
- **REMOVE TEST PLAYERS** (`api/_lib/testplayers.js` · /admin's **TEST PLAYERS** card): lists every profile made since Nov 4 10:30 am EST
  (+ `TESTER#2599`, his old laptop card — Nº 2) with its name + tag, member Nº, XP, counted matches, when made; the five 2B test players
  (WKA, WKB, RULESCHECK, CHECKA, CHECKB) pre-ticked, TESTER not, an admin never tickable → PREVIEW (a dry run: who goes + what the member
  counter does) → CONFIRM (a second tap). Removes only the ticked: the profile, its private node, its stats (items + achievements), its key, its
  tag, the device links still pointing at it, its seat, its crew role, every board entry (every week). **Member numbers never shift + are never
  re-used**: `members/next` rolls back only when every number from the new top up to it belonged to a removed profile (an older gap stays a gap).
  The server's own key; audited. *Found on the way:* `profiles.js#releaseTag`'s transaction returned `undefined` for "not mine" — the FIRST
  call runs on the empty cache (`null`), so it aborted and **no tag was ever freed** (renames, the C1 restore). Now it returns `cur` (the server
  answers with the real value, the transaction runs again).
- **ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM** (`js/seat.js`, `seats/{pid}: { code, uid, at }`): HOST / JOIN look at the profile's seat
  first — held by ANOTHER device whose player node is still in its room → **"You're already in room XXXX on another device"** (the same room:
  "…in this room…") · **MOVE HERE** · **CANCEL**. MOVE HERE takes the seat; the other device sees its seat go and walks out of its room (the
  same leave as LEAVE ROOM — the wave + the walk-off on every phone); if that device was the HOST of the same room it hands the room to the new
  device (never "the last one out turns off the lights" — the new player node may not have reached it yet). A resume never takes a seat another
  device holds (the title says where the card is). The rules refuse a player node carrying the pid while the seat is someone else's. **The
  server, whatever a client does**: one profile in two seats of a match is credited ONCE — its WORSE placing (`report.js#dedupePids`); a match
  overlapping one already counted in ANOTHER room is never credited (`progress.js#overlaps`, the last 8 windows in `pstats.ov`, one transaction
  with the match). Several devices on one card otherwise unchanged (the key everywhere, the stats add up).

**Group 1 — the room's bugs** (032eb67)
- **THE PLAYER CARD** (the owner couldn't see ANY card — every tap in the line + in GUESTS opened the RADIO panel): the radio's capture-phase
  chip hooks + `ns:owner-card` are gone. A tap ALWAYS opens THAT player's card (the full card, or the Gilded sheet), on top; on the owner's
  phone (the radio loaded on the server's yes — `body.rd-owner`) a small **CREW** switch row sits at its foot (`screens/crew-row.js` — the
  server checks the role per action). The stale "(once lobbies are in the city)" copy is gone (the desk + THE LEDGER).
- **AN INTENTIONAL LEAVE**: a leave removes the player node + the presence in ONE update, but every phone hears the two paths as two events —
  presence first → the lost-signal lie-down, then the wave. A presence drop now waits **1.5 s** (`room-city.js#LOST_GRACE_MS`) before the
  lie-down: a leave's node goes inside it → straight to the wave + the walk-off; a real lost signal lies down a moment later.
- **THE BANNER PLANE FADED**: it was drawn in the sky layer BEFORE the clouds — a cloud bank turned the plane + its words into a ghost
  mid-flight (worse on a desktop's wider sky). It is drawn after the clouds, the storm deck + the lightning now (`skyfx.js#bannerOver`).
  Measured on an overcast night: the old order read **0.00** of its nylon at 1440 (fully hidden), the new ≥ 0.35 on every sample.
- **AFTER HOST — HOW TO SHARE**: a short glass card "**YOUR ROOM IS OPEN — THE HUSH WORD IS MINT**" + a big **SHARE INVITE** (the share
  sheet; a desktop copies the link) + "or tap INVITE anytime"; closes itself after 8 s or on a tap; the **INVITE ring breathes** (opacity +
  scale) until the host invites someone or a guest arrives. Every host, every time.
- **THE DESKTOP HOST's FLASH**: between HOST and the room's meta arriving the router said 'boot' — the title (and its whole city) unmounted, the
  boot screen faded in, then everything came back. In City 2.0 the title stays while the meta loads (`app.js#routeKey`).

**Group 2 — THE NEW GAME START + AFTER THE MATCH** (dadde43)
- **THE START, REDONE** (no camera push — choppy on the phone): the speakeasy's NEON sign powers down → **THE GAME's OWN SIGN ignites in the
  NEON pink** (`tube-logo.js#gameLogoSvg({ tint: NEON_PINK })` — the NEON logo's tubes, every tube catching on its own beat with a real strike
  flicker, then steady) under TONIGHT, and **holds** (≥ 3 s readable) → the TWO LINES walk in through the side door under it → a clean fade.
  **~5 s** for a room's first game + after a game change (the FULL start); **~3 s** for a same-game REMATCH (the QUICK start: the sign lit at
  once, the walk-in + the fade). The kind rides in the match id (`'q…'` = quick — `room-show.js#startKind`): the stamp's fields are fixed by
  the published rules, its `m` isn't, and the old-rules fallback (`game.go`) carries the same id. The game's clock = the tap + the start's length.
  Everything is an animation at a negative delay = the start's age (a refresh / a late joiner / a new host lands on the same frame), opacity
  only, no layout read. Reduced motion: the lit sign by a plain fade + the fade. 2B's safety kept (the stamp in the match, the dead-start toast,
  the slow-start veil, every sheet closed).
- **AFTER THE MATCH** (change-game.png v2): REMATCH sits INSIDE the ring (0.74 em — inside the tube's inner circle); ONE pill right above the
  ring = only the lit voters' dots + "want a rematch" (no empty dots, no count, nothing until someone votes); the host's GAMES tab reads
  **NEW GAME** in cyan and **breathes** until tapped (once per match back in the room) or a game starts → the game list (a pick clears the
  votes, the ring back to PLAY). Guests: their REMATCH vote ring + the same pill.
- *Found on the way:* entering a room rewrote the address bar WITHOUT a preview link's `when / tz / at / wx / force` (masked until HOST stopped
  remounting the title: the city rebuilt after a match came back on another clock) — kept now (`identity.js#setUrlRoom`); a `&when=` preview's
  clock now runs from the PAGE's load (`sky.js#PAGE_T0`), so a city rebuilt in the same page carries on instead of starting the link's time again.

**Group 3 — THE PROFILE + THE CARDS** (0deada6)
- **THE PLATE COVERS ITS WIDEST LINE**: the full card's plate takes its second line's real width (the level / "THE DEVELOPER · № 0001") + the
  emblem + its paddings as a floor (`full.js#coverWidest` — one ResizeObserver, never a frame read). Every full card + every strip checked with
  the widest name + the dev line + LV 100 · HOST at 390 / 402 / 430 (`tests/integration/plate-preview.html`): only the two dev full cards were
  past (by 4 pt) — both v4 + CHANGED in THE LAB.
- **THE YOU PAGE ON A DESKTOP**: with a mouse / trackpad the whole width scrolls (the wheel anywhere — the column was the only scroller), a slim
  visible scrollbar, click-drag scrolls (`profile.js#dragScroll`); a phone unchanged.
- **THE ROUND-END CARD**: "**NEXT UNLOCK AT LEVEL n**" (what it is never shows — an item's name reaches only its owner, THE VAULT 1B's rule);
  its bar = the profile's PINK NEON TUBE (what you had a dimmer tube, this match's gain the bright one) — no gold bar left.

**THE ADD-ONS** (the owner, desktop — 0391dc9, the last work group)
- **YOUR NAME + COLOUR, ONE PLACE** (ADD-ON 3 — supersedes Group 3's ACCOUNT rows): two plain rows at the TOP of CUSTOMIZE YOUR CARD —
  "NAME   LOEWFIZZLE ✎", "COLOUR   ● MAGENTA ✎" (on screen on a desktop without scrolling) — each opening its editor on top (`profile/edit.js`,
  ‹ = one step); the small ✎ beside the name on the profile's card opens the same name editor; nothing in ACCOUNT (the key / restore / sign-in
  only). In a room a rename / a colour changes your name + ring in the line at once.
- **THE MUSIC BUTTON ON A DESKTOP** (mid-screen by the moon): a game's theme on the body (the walk-in, a theme left after a match) made
  `body[data-theme]:not([data-theme='']) … .music-btn` outrank the corner rule and pin it to the PHONE COLUMN's edge. The split-corner screens
  (the title, the room, the lobby) pin it to the SCREEN's top-right, level with ☰, whatever the theme — checked at 1440 × 900, 1180 × 820,
  844 × 390, 390 / 402 / 430.
- **ARRIVALS FROM THE NEAREST EDGE**: one rule for every camera — a joiner walks in from the screen edge NEAREST the side door
  (`core/harbor-room.js#arriveSide` on the folk map's own off-screen exits — THE PEOPLE RULE), never across the whole promenade. The phone's
  nearest edge is the LEFT too (the door at 106 of 402 pt), so the right line's guests now come in from the left as well (a short walk past the
  door).
- **THE RADIO BUTTON RESTS WITH THE REST**: the same 1.8 s fade as ☰ + the music (opacity only), back on the same wake tap, untappable while
  faded (the wake tap only wakes). In a room nothing rests (the dock is the room's controls — decided in 2A), so the radio stays up there too.

## Decisions
- **ONE SEAT** is a client check + a rules check + the SERVER's guard: a modified client could still sit in two rooms, but never gains anything
  (one credit per match per profile, never two overlapping matches). A seat whose room or player node is gone is stale — taken over without asking.
- **The two-seats-in-one-match credit is the WORSE placing** — a second device never farms a better one.
- **REMOVE TEST PLAYERS leaves the "X% have this" counts** (`pcount/`) as they are — display only; not every item was counted, so a decrement
  could go below the truth.
- **The start's kind rides in the match id** (`q…`), not a new stamp field: the published rules fix the stamp's fields (the rules-lag standard).
- **The full start's beats**: the sign at 0.56 s, the walk-in from 1.5 s, the fade at 4.3 s → 5.0 s; the quick: the walk-in at 0.25 s, the fade
  at 2.35 s → 3.0 s. The game's sign is the NEON PINK (the owner: "pink"), the mark too — every tube one colour.
- **The round-end tease shows WHEN, never WHAT** — "if the player may know": item names only reach their owners.
- **The lost-signal grace is 1.5 s** — a leave's two events land within ms; a real dropped phone lies down a moment later than before.
- **Fog** still veils the banner plane (the city's far fog is in front of everything far — a crisp banner through a whiteout would look pasted on).

## Measured (the mini PC)
- THE FULL START: the game's sign lit (12 / 12 tubes) by 2.4 s, held to 4.1 s; the host walking at 2.3 s; in the game on both phones 5.3 s after
  the tap; the game's clock at the tap + 5.07 s. THE QUICK START: lit at 0.5 s, in the game at 3.25 s, the clock at the tap + 3.07 s.
- ARRIVALS: at the line in 6.2 s (402) / 4.7 s (1440).

## Known issues + held back
- **THE RULES CHANGED** (`seats/`, the pid's seat check) — the owner re-publishes (Firebase console → Realtime Database → Rules → paste
  `database.rules.json` → Publish). Until then ONE SEAT is the server's guard alone.
- The round-end card never previews WHAT unlocks next (item names are owners-only) — the line says when.
- The radio button in a room never rests (nothing in a room rests — the dock is the room's controls).
- THE SIGHTINGS capture line (compose ≤ 12 ms) is still flaky under load — 13.4 / 14.4 / 12.0 then 11.6 alone: THE SPEED PASS drops it (FR6's flag).
- Held back to THE SPEED PASS (next): FR6's Group 3 green-means-green + 4a the phone's speed + room2's "host walking 0.9 s" check + the 12 ms
  capture line. To SHELL 2.0: the desktop group (the tilted / cut-off speakeasy, the flat far-right skyline, the choppy desktop load, the
  flickering cirrus, the empty promenade, the bench, the resize stall), the seams, the in-game slim cards, a sighting open at a game start.

## Tests
unit `tests/lobby-fixes.test.mjs` (5) + 2B's `lobby-2b.test.mjs` (the new timing) + `lobby-2a.test.mjs` (CUSTOMIZE's rows) · rules + 1 (the
seats) · /api + 2 (REMOVE TEST PLAYERS; ONE ACCOUNT, ONE ROOM — the worse seat, the overlap) · the profile E2E (the round-end tube bar, the
tease, the card's ✎, CUSTOMIZE's rows → the server) · harbor jobs **`lobbyfix`** (`oneseat` — 3 slots on one profile, `playercard` — the owner +
a normal player, the line + GUESTS, `leavewave`, `bannerfull` — an overcast night at 402 + 1440, `hostcard` — 1440 + 402, `newstart`) +
**`lobbyfix2`** (`platefit`, `youpage`, `corners`, `arrivals`, `radiorest`) · 2B's `gamestart` / `afterparty` / `crew` updated to the new start
+ the v2 dock + the card's CREW row · `room2-look.mjs` (the start's beats + the quick start at 390 / 402 / 430 / 1440). Checked RED without
their fix: leavewave (1 of 179 frames lying down; the grace at 0), bannerfull (0.00 / 0.07 nylon), platefit (6 of 9), oneseat + playercard
(the old code has no seat / opens the radio).

## THE FULL LOCAL RUN (the mini PC — THE BUSY-PC CHECK first: quiet, 3.7 % average)
- unit 1161/1161 (+ rules-live: the ack names the re-publish) · rules 64/64 · /api 34/34 + lab 2 · progression 10 · sightings 4 · vault-2b 3 ·
  vault-2c 3 · the profile E2E 81/81 · conn 20/20 · presence 12/12 · smoke 6/6 · WebKit (`wk-room.mjs`) 5/5.
- THE FULL HARBOR SUITE (4 shards, 28 min): **1100/1103**. The three: 2B's `sheetstack` still walked the old Edit-profile sheet (the test
  updated to CUSTOMIZE's NAME row → green); the `panel` group's EVERYONE banner timing — caught a regression of THIS pass (a `&when=` clock built
  from the panel's state started at the page's load; now only the page's own address clock does — `sky.js#skyClock`'s `page`) → green with
  `citypause` (43/43); the `sightings` 12 ms capture line (flaky — green on a re-run alone). Every new group green in the full run: oneseat,
  playercard, leavewave, bannerfull, hostcard, newstart, platefit, youpage, corners, arrivals, radiorest.

## THE CLOUD RUNS (the two-run cap)
- **Run 1** (ff9566a): harbor **13 / 14 jobs green** — `lobbyfix2`'s `youpage` red: the cloud's headless Linux Chromium reports NO fine pointer, so
  the YOU page's desktop rule (`hover: hover and pointer: fine`) never applied there (a real desktop matches it; the mini PC's Windows headless did
  too). The rule now also keys on width (`min-width: 900px` — any wide screen; the phones, incl. a phone sideways at 844, unchanged). `tests` red:
  `tests/lobby-fixes.test.mjs` imported `api/report.js`, which pulls `firebase-admin` (not installed in the unit job) — `dedupePids` moved to the
  PURE `js/core/progress.js`.
- **Run 2**: see the summary.
