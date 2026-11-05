# SHELL 2.0 B2 — GREEN MEANS GREEN, THE OWNER's B1 FIXES, THE GIFT TOOL + THE GIFT CARDS, MAKE HOST, THE SMALL FEATURES, THE DESKTOP GROUP (Nov 5 2026)

Step 0 = plan.md "OWNER'S NOTES — NOV 5 (noon, his SHELL 2.0 B1 test)" (part 70). The last SHELL 2.0 pass. **RULES CHANGED**: `rooms/{CODE}/meta/hostId`
(a hand-off only to a live, online, unkicked player) + `meta/hostBy` → the owner RE-PUBLISHES database.rules.json (tests/fixtures/rules-live.ack.json).
Three mid-pass ADD-ONS from the owner (12:51, 12:58 pm + the update): four more gift cards, THE ANARCHIST as the owner's own card, THE DISPLAY CHECK.

## Group 0 — GREEN MEANS GREEN + THE OWNER's FIXES
| item | before → after | proof |
| --- | --- | --- |
| **THE HERO-SPOT AUDIT** | every strip shot at 402 (+ a 10-letter name at 390): CAMO's reticle sat ON the tier gem, CENTURY's sun disc BEHIND the plate, the TR-3B's wing under the gem, the prism / EMERALD's crown / the UFO / the marquee's arrowhead under a long name's plate, THE SOURCE's NEON into the dev gem + the DEV plate, THE SWITCHBOARD's jacks under the DEV line + its FULL card's ON AIR under the plate's right end → each moved middle-right (CHANGED lines, LAB_V bumped: camo 2, century 4, tr3b 2, prism 2, emerald 2, ufo 2, marquee 2, dev-source 3, dev-switchboard 3, both dev full cards 5) | `js/vault/hero.js` (28 focal cards' boxes; `heroMisses()` pure) + harbor `platefit`: the live stepped plate (LOEWFIZZLE) + the gem at 390 / 402 / 430 — 3/3 |
| **THE 1 OF 1** | B1's solid white (the chat's mistake) → the RAINBOW GRADIENT on the letters again: bright stops only (pink → gold → mint → cyan → lilac — no dark violet end), a touch bigger (10–14.5 px), a dark drop-shadow edge (a text-shadow paints over a clipped gradient), the backing 88 % dark + a soft glow, 10 px clear after FOUNDER | harbor `roomfix`: each of the 4 letters' own colour (the gradient at its centre) over the backing laid on WHITE = 8.9 · 11.9 · 12.2 · 9.7 : 1 (≥ 6), 12.9 pt from the gem, 17.8–25 pt after FOUNDER (6 in the 72 % viewer) |
| **THE GAME LOOK** | B1's sun / moon tube above PLAY (a room of one, locked per match) → GONE; ☰ → Settings → **GAME LOOK: AUTO · DAY · NIGHT** in the room + in a game, per device, ANY match (multiplayer: your screen only), NO LOCK | harbor `sololook` 4/4: no dock button; DAY remembered after a reload; OVERCLOCK alone DAY → NIGHT mid-game re-themes in 52 ms; two phones: the host NIGHT, the guest DAY |
| **THE AIRLINER** | medium.plane weight 2 → 1; THE PROGRAM tags the medium moments **MEDIUM** (the common grey) — not UNCOMMON | rarity + golden tests; THE GOLDEN TABLE rewritten ON PURPOSE (only `helicopter.patrol`'s 39 months moved — the medium heli feeds it). The mix barely moves (planes 85.5 → 84.5 % in November): by day the airliner is the only live medium kind (the dog walk is off, the heli dark-only with a 20-min cool) — a real mix needs more live medium moments |
| **CREW's flaky switch** | THE CAUSES (three, reproduced): (1) a tap opens the NEAREST figure — the owner had just reloaded and his own figure, walking in, was nearer the tag's corner → HIS card, no CREW row; (2) the peek + the set had FIXED windows (10 / 8 s) whose timeouts were swallowed → a click on a still-disabled switch / a read before the server answered; (3) the room push's HOURLY budget (`rl/push_all_<hour>`, 10 an hour) outlived runs on the emulator → 'limit', no push | the step waits for the three settled, taps the CENTRE of C's own hit box (re-taps if another card opened), waits for the switch's own state + the server; the push step resets its hour's budget; **10 runs in a row: 17/17 each** (+ 18/18 with the crew switch live) |
| **the preview panel's cloud timeout** | the panel opens SYNCHRONOUSLY on the row's click → the TAP missed on the slow runner (the menu still laying out) | `kit.mjs#tapUntil` — tap, wait for the condition, re-measure + re-tap until it's up (20 s cap) |
| **the profile E2E's second tab** | SPEED PASS B changed the rule ("the tab ON SCREEN plays") but the step still expected the NEWER tab to yield → `.dup-tab` never came, a FATAL, and A, B1 + THE SPEED PASS B reported "63/63" = the checks BEFORE it | the step follows the rule (the hidden tab yields; bringing it on screen swaps them; closing the other frees it) → **81/81** (18 checks that never ran before) |

## Group 1 — THE GIFT TOOL + THE GIFT CARDS (+ the ADD-ON's four)
- **THE GIFT TIER** (`js/core/gift-cards.js`): 1-of-1 like the dev cards (`isOneOfOne`: the rainbow gem, the 1 OF 1 badge, CUSTOMIZE's order, art
  shown to its one owner without an APPROVE); never earnable; cards only.
- **THE 11** (names on the server): the nephew's PLAYER ONE · HALL OF FAME · THE ENFORCER · THE LINEBACKER · UNDER THE LIGHTS; Cambria's SUNSET
  STRIP · GOLDEN HOUR; Liam's GOLDEN BOOT · YOUNG BUCK · ICE COLD (the ADD-ON); THE ANARCHIST (the owner's own — below).
- **THE ART** (`scripts/build-gift-art.mjs` → `assets/vault/gift/*.webp`, 780 KB for the 12 files): the seven composed in a headless page from
  `art/gifts/src/` (copies; the originals in Downloads untouched) after the approved mocks — the subject right, the left dark for the plate; the
  flat Grok backgrounds keyed by a flood fill from the edges + despilled (no magenta fringe); the giant 25, the rays, the halftone, the sun's
  stripes, the stickers baked in; the four ADD-ON pictures converted only. Their crops checked at 402 (full + strip): HALL OF FAME's bust lowered
  (its hair under the gem), SUNSET STRIP's palms both left (one crossed the shiba's face), GOLDEN BOOT's strip crop raised; the full card's plate
  at 47 % on a gift card (the face clear — as in the mocks), GOLDEN HOUR's lettering dark on its light page.
- **THE MOTION**: ONE engine `js/fx/gift.js` + each card's layers as DATA in `js/fx/gift-specs.js` (art pixels, mapped exactly like the CSS crop — the
  strip's `background-position` % = the spec's, checked). 25 layer kinds (motes, breathing / buzzing / flickering lights, sweeps + a star flare,
  rays, scanlines, a synthwave grid, baked words, flash pops, a REGION of the art moved — the ball SPINS, the ransom letters JITTER frame by frame —
  a moving sprite (the polaroid), a heart, palms, haze, drips, beams, smoke, aurora, frost, breath, streaks, the neon edge, the copier's bar). The full
  card the whole show; a strip the calmer cut; reduced motion = still. The ADD-ON's effects as asked (no muzzle flash on THE ANARCHIST).
- **60 fps** (the GPU path, 4× CPU, 3×): a lobby of 8 gift strips (1–8) **63.3 fps, 0/180 slow**; (4–11) **63.5 fps, 0/180 slow**; the three busiest
  FULL shows alone (THE ANARCHIST, GOLDEN BOOT, ICE COLD) — the harbor `vault` group (see the full run below).
- **THE GIFT TOOL** (`/admin → GIFTS`, `api/_lib/gifts.js`): the 10 giftable cards (who has each), a live strip preview, a NAME TAG, **GIVE** (the
  second tap confirms) → owner-only (the admin gate), `gifts/{card}` taken in a TRANSACTION first (ONE PROFILE EVER — 409 `taken`), the card into
  their items + EQUIPPED + a reveal waiting (`ppriv/{pid}/gift`), audited `giftGive`. **THE REVEAL** (`js/profile/gift-reveal.js`): 6 s after the
  title is up, one light `giftCheck` → "A GIFT FROM THE HOUSE · ONE OF ONE · IT'S YOURS" over the full card flipping in → `giftSeen` (once).
- **THE ANARCHIST** (the owner's update): OWNER_GIFTS — granted by the server to ADMIN_PIDS on `/api/profile 'me'` (audited `giftOwner`, the first
  time), wearable by him, NEVER listed in GIFTS (a give is refused 403 `not_giftable`), refused on 'style' to anyone else + taken back from anyone
  else's items on their next 'me'. Nothing was written on the live site: the grant happens the first time HIS phone opens after the deploy.
- **THE LAB → GIFTS**: the 11, strip + FULL CARD ›, **PREVIEW ON MY CARD ›** (the reveal on his own card — nothing granted); the LOBBY TEST's GIFTS mix.
- Proof: server.test.mjs "THE GIFT TOOL" (owner-only, one profile ever, equipped, the reveal once, THE ANARCHIST his alone); rules.test.mjs (gifts/
  read + written by nobody); tests/shell-b2.test.mjs; vault-names (no gift name in the shipped code where cards are drawn); credits.js ("Art
  generated with Grok Imagine (xAI), from a family photo").

## Group 2 — MAKE HOST + THE CREW SWITCH LIVE
- **MAKE HOST** (`room.js#makeHost`, `room-city.js#makeHostRow`): the host taps a player → **Make host** at the foot of their card (above the owner's
  CREW row) → TAP AGAIN TO HAND OVER → `meta/hostId` + `meta/hostBy` (+ a fresh beat). In the room only, to an ONLINE player only (an offline one: the
  row says so, disabled). Both phones say it once (`host.js#watchHand` — the old host stays: `hostBy`): "AVA is the host now" / "YOU'RE THE HOST NOW";
  the PLAY ring + GAMES follow `isHost()`. **THE RULE** (`meta/hostId .validate`): unchanged, a self-claim, the creation — or a LIVE, ONLINE, UNKICKED
  player of the room. The leave's hand-off survives a refused (offline) heir: the phone still leaves.
- **THE CREW SWITCH LIVE**: the card's switch sends the room → the server stamps `rooms/{CODE}/radioCrew/role/{uid}` → that phone (`app.js#paintCrew`)
  `fresh()`es its radio gate (ask again, no cached yes) or `drop()`s the radio (its button + an open panel); the radio tells the gate when it goes.
- Proof: harbor `makehost` 3/3 (two phones); `crew` 18/18 — C's open radio GONE 26 ms after OFF, back 296 ms after ON, no reload; rules.test.mjs
  "MAKE HOST" (an offline / kicked / outside heir refused, a non-host refused, the crew stamp the server's) — 65/65.

## Group 3 — THE SMALL FEATURES
- **THE MUSIC's IDLE CUTOFF** (`js/audio/idle.js`): 5 h with no tap / key / scroll / wheel → the music fades (`setPageQuiet(true, 'idle')` — the quiet
  now takes a REASON) + "Music paused — tap to bring it back" (up until the tap); never during a match in a room. A faked-clock unit test.
- **YOUR PREVIOUS KEY** on YOU → ACCOUNT: a glass row under YOUR KEY (only when this phone has one): COPY; FORGET (a second tap).
- **THE LINK-PREVIEW IMAGE**: `assets/og.png` = the Harbor at night under NEON (a Friday in June — the party's searchlights, no holiday), 1200 × 630,
  `shots.mjs --sizes og`; index.html's og / twitter tags `?v=3` + a new alt text. (og-board.jpg unchanged.)
- **THE CITY-1.0-ONLY SONGS** — dropped:

| file | size | why it's City 1.0's alone |
| --- | --- | --- |
| audio/music/late1.mp3 | 3.46 MB | named only in data/mood-music.json's City 1.0 `moods.late` + `songs` — City 2.0's `city2.moods` cover all five moods (the old decks are a fallback that never plays); not in music.js's FILES / PLAYLISTS, no game's MUSIC, no station, no party deck |
| audio/music/late2.mp3 | 2.03 MB | the same |

  Every other song is a City 2.0 deck song or a game's (the ten frozen games keep theirs — they come back). **The deploy: 295.5 MB → 291.3 MB**
  (audio/music 245.1 → 239.6 MB; the gift art + the bigger og.png add ~1.3 MB).

## Group 4 — THE DESKTOP GROUP (partly → FR7, as the brief allows)
- **THE CIRRUS FLICKER** re-checked at 1440 × 900 with a true frame burst: `shots.mjs --cast 6000` (360 painted frames) → `tests/integration/
  cast-flicker.mjs` (the sky in a 12 × 4 grid, frame to frame): max jump 0.54 / 255, median 0.02, **0 flickers** — B1's phase accumulator holds.
- **→ FR7**: THE CHOPPY LOAD (one clean reveal on the desktop), THE FAR-RIGHT SKYLINE (looked textured at 1920 × 880 here — needs the owner's exact
  screen / pixel ratio to reproduce), THE RESIZE STALL (measured before → after). Not the camera (parked).

## THE ADD-ON — THE DISPLAY CHECK (no dummy HDMI plug)
`kit/puppeteer.mjs#displayAttached()` (Windows' present monitors; `DISPLAY_ATTACHED=1|0` overrides) — the two REAL-COMPOSITOR vault lobbies run as
before with a display; with none their rule half is checked and the speed half is **skipped (no display)** with the reason "no display attached (a
no-screen boot)" (`harbor-e2e/kit.mjs#skipNoDisplay`), counted apart in the suite's last line. Unit test: `displayVerdict` + the skip's wiring.

## Decisions (made in this pass — the owner may overrule)
- THE HERO-SPOT RULE's testable form: the hero's CENTRE ≥ 0.60 across (right of a 10-letter name's plate on every phone), the box clear of the level
  row + the gem (a long name may still cover a wing).
- THE GAME LOOK applies to EVERY match on screen (it only changes your own screen); AUTO re-reads the sun each minute.
- The gift cards' art shows to their owner without an APPROVE (like the dev cards); the full card's plate sits at 47 % on a gift card.
- MAKE HOST's "room only" is the client's rule; the database rule allows a live online heir any time (the leave's hand-off mid-match needs it).
- The idle message stays up until the tap. og.png = a party Friday in June. City 1.0's mood decks stay in the data (never played).
- Group 4's load, far-right skyline + resize stall → FR7.

## Tests + the full local run (the mini PC — every number is checks that RAN)
- Unit **1177/1177** · rules **65/65** (+ the MAKE HOST rule) · /api **38/38** (+ THE GIFT TOOL) · the profile E2E **81/81** (was a FATAL after 63) ·
  conn **21/21** · presence **12/12** · smoke **6/6** · WebKit room **6/6** · PRISM FAST **18/18** · CREW **10 runs in a row 17/17** (then 18/18 with
  the crew switch live) · `makehost` 3/3 · `sololook` 4/4 · `platefit` 12/12 · `roomfix` 11/11.
- **THE FULL HARBOR SUITE, 4 shards, run 1: 1182/1187** — 1180 ran + passed, **2 skipped (no display)** (the TV off: the display check working),
  **5 red**: THE ROOM's OWN COST at 4× (the known red since THE SPEED PASS → FR7); two GPU-path vault lobbies (46 fps with three shards beside
  them — **59–63 fps alone**, 0–9/180 slow) and `newstart`'s quick start (2.1 s / its clock +4.25 s under load — **3.3 s / +3.1 s alone**). THE CAUSE
  of the vault pair: the GPU shared with the other shards → **`vault` joins the SERIAL tail** (measured with nothing beside it, like `partyroom`).
- **Run 2 (vault serial): 1181/1185** — 4 red: the room's own cost (FR7); `stations`' EVENING STATION (both phones 144 s off at a song change
  under load — **green alone: 1 ms apart, 50 ms from the server**); and THE TV WAS ON by then (the display check: "1 display present"), so the two
  REAL-COMPOSITOR vault lobbies RAN (as designed): 8 LEGENDARIES 26/240 slow (2A passed in that run; both red alone: 32/240). **A/B on this display**
  (the pre-pass code on :5175, alternating): A 26 · 32 · 48 slow / 240, B 43 · 50 · 40 — red on the old code too; this machine's real compositor with
  the TV attached is noisy (B1 measured 3/240 on another day). The iPhone bench is the truth for these two.
- The gift cards on the GPU path (4× CPU, 3×): two lobbies of 8 strips **62.8 / 62.9 fps** (2 / 1 slow of 180); the full shows alone — THE
  ANARCHIST **62.7**, GOLDEN BOOT **63.0**, ICE COLD **62.9** fps.

## The cloud run (091a466 — the harbor tag; ONE harbor run, the second kept)
- `harbor` **13 / 15 jobs**: `holiday` — THE SPIDER's dangle, its tap-drop to the SPEAKEASY word + the climb home (3 checks); `speed` — A6, a
  re-layout at 1440 × 900 @1 → @2 re-planned the visits once (3 vs 2). Both cloud-only: green in BOTH full local runs, and this pass touched neither
  (the title's Halloween spider; the walking map). Not re-run to confirm (the two-run cap) — watch them in the next pass's run.
- `tests` red: my display-check unit test imported kit/puppeteer.mjs, and the cloud's unit job has no puppeteer-core → the check moved to its own
  dependency-free `kit/display.mjs` (re-exported by the kit), pushed with the ci tag (the tests workflow only).
- Vercel built the tagged push: the live site serves `js/core/gift-cards.js`, index.html carries `og.png?v=3`, the new og.png answers 200 (1.03 MB).

## Known issues
- The airliner still dominates the MEDIUM moments by day (it's the only live daytime kind) — more live medium moments would mix it.
- og-board.jpg (THE BOARD's link preview) still shows the older look.
- FR7: the desktop's choppy load, the far-right skyline (not reproduced here), the resize stall.
- The real-compositor vault lobbies: skipped on a display-less boot (by design); with the TV on they run and are red on the pre-pass code too
  (the A/B above) — the iPhone bench decides.
- The full suite's room-cost red at 4× CPU (FR7, unchanged); `stations` + `newstart` can miss under the 4-shard load (green alone).
- The cloud's `holiday` (THE SPIDER's dangle / tap / climb) + `speed` (A6's re-plan at @1 → @2) reds — cloud-only, untouched by this pass.
- Not on a real phone yet: the gift cards' full show at 60 fps on the iPhone (`&bench=1` in THE LAB), MAKE HOST + the crew switch on two phones.
