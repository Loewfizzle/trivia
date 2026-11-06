# PROGRESSION — levels, the streak, the unlocks, the achievements, the daily contract, CITY SIGHTINGS, birthdays, favors (PROGRESSION A + B, Nov 2 2026)

The engine behind every "you got better" moment. **The server is the only writer** (XP, levels, the streak, items, achievements, the
counts — `database.rules.json`'s default deny; `tests/integration/rules.test.mjs` proves a client can't write any of it); the screens
only read. **Profiles are polish:** with `/api` down a match plays exactly as before — the moment just doesn't open. The decisions +
the owner's words: `docs/harbor/plan.md` (PROGRESSION 2.0, THE LEVEL PACE, THE ACHIEVEMENTS — DRAFT, STREAK MILESTONES REMAPPED, VAGUE
TEASE, NO "???", FOUNDER, THE LOOK, PROGRESSION A's LAST TWO QUESTIONS, OWNER'S NOTES — NOV 2 (night), OWNER's REVIEW OF PROGRESSION A) + `docs/harbor/decisions.md` §15.
The passes: `docs/harbor/passes/progression-a.md` · `docs/harbor/passes/progression-b.md` (CITY SIGHTINGS, BIRTHDAYS, CALL IN A FAVOR + the owner's A review).

| file | what |
| --- | --- |
| `js/core/levels.js` | PURE — the curve (`XP_AT`, `levelOf`, `levelInfo`), the BANDS, THE LEVEL REWARDS table, the vague tease (`nextRewardLevel`) |
| `js/core/streak.js` | PURE — the 4 am day, `streakPlay` (freezes, the break, WIN IT BACK, the outage, the milestones), `streakView` (what the screens show) |
| `js/core/items.js` | PURE — every collectible (cards · emblem shapes · tube styles · name glows · flame · favor): id, name, tier, placeholder palette |
| `js/core/achievements.js` | PURE — THE 32 ACHIEVEMENTS (checks + their item), the counters (`noteMatch`, `noteEvent`), THE AWARD ENGINE (`awardAll` + FOUNDER) |
| `js/core/daily.js` | PURE — THE DAILY CONTRACT: a cartridge's shape, `registerDaily`, the standing (percentile + bands), YOUR TABLE's TODAY |
| `js/core/progress.js` | PURE — the steps the server runs inside ONE transaction: `matchStep` (a counted match), `dailyStep`, `eventStep`, `carryOver` |
| `api/_lib/stats.js` | a verified match → `matchStep` per player (+ the facts only the server knows: the host, the room, the hour, the holiday, the friends) |
| `api/daily.js` · `api/_lib/dailies.js` | `POST /api/daily` start / finish / today; the cartridges + the secret seed (+ THE FAKE DAILY behind `DAILY_TEST=1`) |
| `api/_lib/events.js` | `POST /api/profile {action:'event'}`: the knock, THE WATCHER's hour, the real weather |
| `api/_lib/owners.js` · `api/_lib/founder.js` | "X% OF PLAYERS HAVE THIS" (`pcount/`) · THE FOUNDER WINDOW (`progress/founder`, the sweep) |
| `js/progress/*.js` · `css/progress.css` | the screens (loaded on first use): `moment.js` (THE END-OF-ROUND MOMENT + the level-up), `streak-card.js`, `card.js` (THE GILDED CARD), `profile.js` (the sections under it), `flame.js` (the dock's flame), `look.js` (the fan, the medal, the flame icon, X%), `preview.js` (`?preview=`) |
| `js/audio/progress-sfx.js` · `audio/sfx/pg-*.mp3` | the 9 sounds — docs/audio.md#the-progression-sounds |
| `js/daily/contract.js` · `js/profile/events.js` | the phone's side of the daily contract (fetch only — no socket) · the events (fire-and-forget) |

## Levels 1–100
XP is earned exactly as before (`core/ranks.js#matchXp`: played, the placing, personal bests, a new game tonight, the weekly goal) — **minus
the old streak bonus** (+10 % a night is gone: "streaks pay in milestones", no XP bonus). The level is a reading of the XP:

| band | levels | starts at | each level costs | the pace (THE YEAR SIM) |
| --- | --- | --- | --- | --- |
| NEWCOMER | 1–4 | 0 | 40 → 85 | night one |
| REGULAR | 5–19 | 250 (the old REGULAR) | 85 → 149 | the first couple of weeks |
| INSIDER | 20–39 | 2,000 (the old INSIDER) | 150 → 400 | ~day 14 |
| MADE | 40–69 | 7,500 (the old MADE) | 505 → 662 | ~day 60 |
| LEGEND | 70–99 | 25,000 (the old LEGEND) | 662 → 672 | ~day 208 (~7 months) |
| OWNER | 100 | **45,000** | — | ~day 380 (~a year) |

Each band starts at its own price (`BANDS[].c0`) and ramps straight up to the cost that makes its levels add up to its XP (integers; the
rounding on the band's last levels — never a dip): no level ever costs less than the one before. **45,000 is the lowest OWNER the old
thresholds allow with that rule** (LEGEND's 30 levels can't be cheaper than MADE's last). **THE YEAR SIM** (`tests/levels.test.mjs`) runs the
server's own `matchStep` on real match XP: REGULAR PLAY = 3 matches a night EVERY OTHER NIGHT (≈ 120 XP a day), 4-player rooms, the two
playable games, a PB now and then → the table's right column. The rank EMBLEMS stay (`profiles/{pid}/r` = the band's old rank; OWNER wears
LEGEND's until THE VAULT); `profiles/{pid}/l` = the level. Everything that showed a rank shows **BAND · LEVEL n** (the card, the podium's XP
strip, the lobby chip "LV n", THE BOARD's #1 crown + your button, /admin).

### THE LEVEL REWARDS (40 — item ids; THE VAULT replaces the ART, never the ids)
1 GILDED (everyone) · 3 MIDNIGHT · **4 HEARTBREAKER** · 5 BRASS DECO · **6 emblem SWEETHEART** (THE VAULT 2A) · 7 tube TWO-TONE · **8 GLITTER BOMB** (THE VAULT 1A — the pink pair, early) · **10 EMERALD & BRASS** · 13 emblem DIAMOND · 15 glow ICE · 18 NEON GLASS ·
20 SILVER CHROME · **25 MIDNIGHT & CHAMPAGNE** · **26 tube A CHASING LIGHT** (2A) · 28 glow NEON · 30 tube BREATHING · 32 VELVET ROOM · 35 AURORA · 37 emblem CRESCENT ·
**40 ONYX & ROSE GOLD** · 44 GOLD FOIL · 47 tube GOLD · 50 glow GOLD LEAF · 55 emblem THE CROWN · 58 VELVET NOIR · **60 SAPPHIRE & SILVER** (the 4th
Gilded-family slot — a name + palette for THE VAULT to design) · 65 tube OLD SIGN · 70 PRISM LEGEND + glow PRISM · 75 emblem SUNBURST ·
80 tube ON THE BEAT · 85 glow CHAMPAGNE · 90 emblem THE ACE · 95 PLATINUM (EPIC since 2A) · **100 THE HOUSE + its crown emblem** (2A).
**THE VAULT 2B** added: **9 emblem BUTTERFLY** · **23 glow FROST** · **38 glow FIRE** · **53 tube BURNT OUT** · **63 glow GLITCH** (the client's WHEN list — REWARD_LEVELS — matches); **THE SEASONAL EMBLEMS** (epic): a counted match during the holiday's own days (core/sky.js#holidayOf — full) grants its emblem once, kept forever — halloween → `emb-hw` THE LANTERN · thanksgiving → `emb-tg` HARVEST · christmas → `emb-xmas` DECK THE HALLS · nye → `emb-nye` AULD LANG SYNE (core/progress.js#SEASONAL, registered by api/_lib/catalog.js#SEASONAL_ITEMS — a grant step, not an achievement: the 30 stay 30). **THE TWO DEV CARDS** (`card-dev-switchboard`, `card-dev-source`) are in NO table: /api/profile 'me' grants them to ADMIN_PIDS only (js/core/dev-cards.js).
**THE VAULT 2A** renamed the emblem set after the owner's sketches (RAINMAKER · SNOWED IN · FOUR ON THE FLOOR · THE FLAME), the glows GOLD → GOLD LEAF + SPARK → ELECTRIC, set the finishes' tiers (FOUR ON THE FLOOR rare, SNOWED IN + RAINMAKER epic) + ICE / AFTERGLOW common — ids unchanged (docs/vault.md "THE VAULT 2A"). Today's VAULT is folded in: the 7 old card finishes
+ 5 old glows are level rewards at the levels their old rank steps were worth (EMBER = FIRST ROUND's).
**THE CARRY-OVER:** a profile from before levels gets every reward its XP had earned (+ the achievements its stats already prove, +
FOUNDER while open) the first time it's touched — its next match, or the `me` call (the card screen).
**THE ART (THE VAULT 1A, Nov 3 — docs/vault.md):** the first REAL arts are the 8 sample cards as SLIM STRIPS (BRUSHED GOLD — now a
common · SMOKE ROOM · FROSTBITE · INFERNO · PRISM · THE MARQUEE · GLITTER BOMB · I WANT TO BELIEVE) on THE EFFECT LIBRARY (`js/fx/`), in
THE CARD LAB for the owner's marks; new ids `card-smoke`, `card-frostbite`, `card-inferno`, `card-prism` (where they unlock: 1B),
`card-glitter`, `card-heartbreaker`. Only APPROVED art ships (`js/vault/approved.js`); until then every item keeps its placeholder look.
**THE VAGUE TEASE:** the moment says "SOMETHING NEW AT LEVEL 25" — WHEN, never WHAT.

## THE STREAK (`pstats/{pid}/st`)
- **THE DAY** turns at **4 am Eastern** (`streakDay`): a 1:30 am match counts for the evening it started. A **counted match** keeps it (a daily too).
- **FREEZES:** the first on streak day 3, then one every 7 more (10, 17 …); hold 2; **used automatically** on a missed day (ice blue on the dots).
- **THE BREAK:** more missed days than freezes → the run starts over at 1 (the best is kept).
- **WIN IT BACK:** back within 3 days of the break → 3 plays within 3 days of coming back restore the run (the lost run + the nights played since;
  the broken days marked "won back") — **once a month**.
- **THE OUTAGE BUTTON** (`/admin` → Streak outage; admins only, audited — `streak/outage/{day}`): a day the site was down breaks nobody's
  streak (no freeze used, no day added). Today + the 6 days before, a second tap confirms.
- **MILESTONES** (cosmetic, NO XP): 3 FULL NEON · 7 glow AFTERGLOW · 14 tube SLOW BURN · 30 card THE 30-NIGHT FLAME · 50 emblem THE TORCH ·
  100 card CENTURY + a **FAVOR** token (`pstats/fv` — PROGRESSION B spends it) · 200 card WILDFIRE · 365 card ETERNAL FLAME (placeholder names).
- `streakView` → lit (played tonight) · waiting (not yet tonight) · frozen (a freeze covers a missed night) · out (+ WIN IT BACK when it applies),
  the week Monday → Sunday as 7 dots, freezes held, best, the next milestone (the streak card's vague "SOMETHING AT 30 NIGHTS").
- `profiles/{pid}/s` + `sd` (the count + its last day) — the dock's flame, the card's flame, a lobby row.

## THE UNLOCK SYSTEM + THE AWARD ENGINE
One engine (`core/achievements.js#awardAll`) inside the transaction that counts a match / a daily / an event: every achievement the stats now
satisfy that the player doesn't hold → `pstats/ac/{id}` + its item → `pstats/it/{id}`; levels + streak milestones grant their items the same way;
**idempotent** (a held thing is never granted again; a replayed report is skipped by its key) and **recorded** (what a match granted is in
`results/{key}/o/{pid}` — `items`, `ach`, `lv`, `st`, `sev`; admin actions in `audit/`). **"X% OF PLAYERS HAVE THIS"**: `pcount/n` (players
with a counted match / daily) + `pcount/i/{item}` + `pcount/a/{ach}` (`ServerValue.increment` after the award — a count is display only);
`POST /api/profile {action:'pct'}` answers ONLY for the ids the caller owns (one node read, cached a minute per instance). **Wearing**:
`{action:'style', card?, glow?, tube?, shape?}` — only what you own (the server checks `pstats/it`; GILDED is everyone's) →
`profiles/{pid}/cd · g · tb · es`. **COLLECTIONS SHOW ONLY WHAT YOU OWN** — no ???, no silhouettes, no locked slots, no totals, no list of what's left.

## THE 32 ACHIEVEMENTS (shown only once earned + X%)
| group | achievement — how | unlocks |
| --- | --- | --- |
| PLAYING | FIRST ROUND — your first match | glow EMBER |
| | HOUSE WARMING — your first room hosted (a counted match as its host, 2+ players — a SOLO run never counts as hosting: OVERCLOCK CARDS' add-on) | emblem THE KEY |
| | FULL HOUSE — an 8-player match | card ZEBRA |
| | THE REGULAR — 10 different nights | card CAMO |
| | TOP SHELF · MADE MAN · KINGPIN — 10 · 50 · 250 wins | BRUSHED GOLD · MARBLE & GOLD · THE MARQUEE GOLD BULBS (epic) |
| | THE HOST — 25 ROOMS of 4+ hosted (rooms, not matches) | THE MARQUEE (epic) |
| | COMEBACK KID — last at the halfway point, then the win (a game's `comeback` flag — OVERCLOCK today) | glow SPARK |
| | LAST CALL — last place 10 times | emblem COCKTAIL GLASS |
| | PARTY ANIMAL — 5 matches on one party night (Fri / Sat 8 pm – 2 am Eastern) | card NEON CAMO |
| | NIGHT OWL — a match 2–4 am (Eastern) | emblem THE OWL |
| | THE CREW — the same friend on 10 nights | emblem TWO GLASSES |
| THE CITY | RAINMAKER · SNOWED IN — a counted match in the REAL thunderstorm / snow where your phone is (the server's own `/api/sky` answer by IP) | LIGHTNING · SNOWFLAKE |
| | KNOCK KNOCK — the speakeasy's door knocked | emblem THE PEEPHOLE |
| | PATIENCE PAYS — THE WATCHER's hour (≥ 55 min on the SERVER's clock from the city first seen) | card CARBON |
| SIGHTINGS *(dormant — PROGRESSION B's tap)* | STARGAZER (3 different) · FREQUENT FLYER (25) · THE WITNESS (every legend in `LEGENDARIES`) | STARLIGHT · WINGS · THE WITNESS (legendary) |
| DAILIES *(dormant — the first daily)* | DAILY BREAD (7 different days) · THE TRIPLE (all 3 in a day) · EARLY BIRD (before 8 am) · PENTHOUSE SUITE (top 1 %, ≥ 50 finishers) | CANDLELIGHT · THREE STARS · SUNRISE · PENTHOUSE (epic) |
| SPECIALS | HODL — a 21-night streak · MANY HAPPY RETURNS — your birthday *(dormant — B)* · SEASON'S GREETINGS — 3 holidays (`core/sky.js#holidayOf`) | emblem ₿ · CONFETTI · glow TINSEL |
| GAMES | FOUR ON THE FLOOR (PRISM DROP: a 4-line clear) · DEAD ON (OVERCLOCK: a Closest Call exact) · OVERCLOCKED (10 OVERCLOCK wins) · REDLINE (OVERCLOCK: alone on top of every challenge of a QUICK match, 2+ players — `overclock-sweep`) · PHOTO FINISH (OVERCLOCK: the win by exactly one point, 2+ players — `overclock-photo`) | PRISM · BULLSEYE · CIRCUIT · card REDLINE (legendary) · card PHOTO FINISH (rare) |

**THE GAME CONTRACT:** a game's rework adds its 2–3 achievements to `ACHIEVEMENTS` (`game: '<id>'`) + sets the flags in its match report
(`core/match-report.js` → a row's `f: { flag: 1 }`, read from the room's own copy) — the counters key them `<game>-<flag>` (a DASH — a dot in a database key fails the whole transaction: OVERCLOCK CARDS found every flagged match uncounted).
**The dormant ones are built + tested with a fake trigger** (`tests/achievements.test.mjs`: `eventStep({k:'sighting', id})`, `{k:'birthday'}`,
`dailyStep`); PROGRESSION B wires the sighting tap + the birthday (server-verified), the dailies' passes wire the dailies.

## THE FOUNDER WINDOW
`progress/founder` (absent = **OPEN**, the default): while open, any player with a counted match (or daily) gets **FOUNDING MEMBER**
(`card-founder`, `profiles/{pid}/fd`) — by the engine on their next match, the carry-over on the `me` call. **THE LEDGER** (the radio → LEDGER →
FOUNDER WINDOW): one brass switch, the owner only (`radioFounder` — the radio's role check: a crew member / a stranger → 403), a tap arms it,
the second flips it; audited (`founderOpen` / `founderClose`). **CLOSING SWEEPS FIRST** (`founderSweep`: every `pstats` with a match or a daily
and no card gets it now) — so "everyone who played before the launch" is exact. The owner closes it on launch day.

## THE DAILY CONTRACT (`POST /api/daily`)
- **A CARTRIDGE** (`core/daily.js#registerDaily`): `{ id, name, better: 'high'|'low', buckets, bucket(score), verify(seed, result, {startedAt, now}) → score | null }`.
  The server lists its cartridges in `api/_lib/dailies.js` (none real yet; `DAILY_TEST=1` adds THE FAKE DAILY — guess 0–999, 1000 − the miss).
- **THE DAY** = the streak's day. **THE SEED** = HMAC(the pepper, `daily:<id>:<day>`) — secret, the same for everyone, never early.
- **ONE OFFICIAL TRY:** `start` records `dly/{game}/{day}/s/{pid}` (a refresh = the same try, its clock running); `finish` → the cartridge's
  `verify` replays the result against the seed → the first score is kept (`r/{pid}`, a transaction) → the histogram `h/{bucket}` + `n`.
- **THE STANDING:** the percentile ("better than X %" of the other finishers) + the band by place from the top — **PENTHOUSE** top 1 % ·
  **VIP ROOM** 10 % · **LOUNGE** 25 % · **BAR** 50 % · **FLOOR** — shown only from **50 finishers** (`BAND_MIN`).
- **THE STREAK + THE COUNTERS:** `dailyStep` (idempotent by `daily_<game>_<day>`) keeps the streak like a match + DAILY BREAD / THE TRIPLE /
  EARLY BIRD / PENTHOUSE's counters (`pstats/dl`).
- **YOUR TABLE's TODAY** (`today { pids }` — BOARD 2.0 draws it): your scores + each friend's: a tick until YOU have finished that daily, then their score.
- **No socket:** a solo daily is `/api` only (`js/daily/contract.js` — fetch + the ID token; THE PARKED DATABASE never wakes).
- Cost (Spark / Hobby): a finish = ~6 small writes + 3 reads; `today` ≤ 12 friends × the dailies' reads. One more function (`api/daily.js` — 8 of Hobby's 12).

## THE SCREENS (the owner's mockups, THE ORIGINAL GILDED — black lacquer, brass foil, the fan crown, one hot-pink neon accent)
- **THE END-OF-ROUND MOMENT** (`progress/moment.js`) — right after the podium (the crown + the board's plaques), once THIS phone's outcome is
  back: the placement → the XP lines one by one (xp-tick) → the total (xp-total) → the level bar (had = gold, earned = hot pink) → a LEVEL-UP
  (a takeover: the coin flips to the new number + a burst, "NEW BAND · …" / "Still …", its unlocks with tier + X%; medal-flip + level-up) → the
  streak flame lights + today's dot (flame-on) → SOMETHING NEW AT LEVEL N → unlocks + an achievement slide in (achievement). ~4–5 s; **a tap
  anywhere = the end at once**; **CONTINUE** → back to the podium (REMATCH / LOBBY as today); the podium leaving closes it; reduced motion =
  the end, still; `/api` down = never opens. CONTINUE is sticky (always reachable on a short phone). Replaced the old RANK UP overlay.
- **THE STREAK CARD** (`streak-card.js`) — tap a flame (the card's, the profile's row): the count, THIS WEEK's dots (ice blue = a freeze), why,
  WIN IT BACK (when it applies), freezes held, best ever, SOMETHING AT N NIGHTS.
- **THE GILDED MEMBERSHIP CARD + PROFILE** (`card.js`, `profile.js`; the screen `js/screens/profile.js`): the card (NEON SPEAKEASY · № tag ·
  the emblem in its neon · the NAME in the card's foil (or the glow you wear) · BAND · LEVEL · MEMBER SINCE · FOUNDING MEMBER · the flame),
  a finger tilts it; under it the level bar, MATCHES · WINS · BEST STREAK · BESTS, the streak row, the ACHIEVEMENTS you hold + X%, THE VAULT
  (YOUR CARDS · NAME GLOWS · TUBE STYLES · EMBLEMS — only what you own; tap to wear), then this week's goal, mastery, the key, the opt-out, YOUR GAMES.
  The other card looks = the same card in their palette (`items.js#look`) — placeholder-grade until THE VAULT.
- **THE DOCK's FLAME** (`flame.js`) — on the title's YOU: a neon tube flame painted at the FULL dpr (3× → 54 × 66 px for 18 × 22 pt — a soft
  glow stack, the tube, a white-hot core; the glow layer flickers by opacity) + the count; lit / waiting / frozen; no streak = no badge; taps pass through.
- **THE PREVIEWS** (nothing written or sent): the live site `?preview=moment` (`&up=0` no level-up) · `?preview=card` (the card + profile) ·
  `?preview=streak`; the look page `tests/integration/progress-preview.html?view=…` (`&cards=1` every look).
- Toasts: an event that earned something (the knock, the watcher) — "ACHIEVEMENT · KNOCK KNOCK" + the bell.

## CITY SIGHTINGS (PROGRESSION B, Nov 2 — TAP TO UNLOCK, server-verified, NO HINT EVER)
A legendary is SPOTTED only when the player TAPS it while it's on their screen and the SERVER believes it. Nothing ever hints (no pulse, no
"TAP IT", no list of what's out there — a secret found by tapping + word of mouth); the tap area is generous and moves with the craft.

| file | what |
| --- | --- |
| `js/core/sightings.js` | PURE — THE SIGHTINGS (one row each: id, the MATCHED PAIR's names + item ids, the radio jacks that can put it up) + **verifySighting** (`skyWindows` from the seeded timetable · `radioWindows` from the radio's record) |
| `js/core/harbor-fireball.js` · `js/core/harbor-balloon-kinds.js` | the fireball SEEDED (row `sky.fireball` — it was `Math.random` per phone, which no server could check; the same ~3 a year) · a balloon flight's line-up + length from its seed (the server replays it) |
| `api/_lib/sightings.js` | `POST /api/profile { action: 'sighting', id, t, tz }` → the place + zone by IP, the showcase dial, NOAA's Kp, `radio/fired`, the rooms, THE WATCHER's start → verify → ONE count per appearance (`ppriv/{pid}/sgk`) → `eventStep({ k: 'sighting' })` |
| `js/screens/harbor/sight-react.js` | the live TAP BOXES (each legendary's draw stamps where it is) + THE REACTIONS' clock (`fire` / `k` / `u`) |
| `js/screens/harbor/snapshot.js` | THE POLAROID's photo: the city's ACTUAL frame composed from its own canvases (+ the crisp lettering + the overlays) at the phone's full dpr, right after the city draws (`scene.snapshot`) |
| `js/progress/sighting.js` · `css/sightings.css` | THE MOMENT: the flashbulb → the print in the corner → THE POLAROID → SPOTTED → THE REVEAL (held until a tap) · AGAIN = the corner print + "SPOTTED · 4th time" |
| `js/profile/sightings.js` · `js/profile/album.js` · `js/progress/album-view.js` | the claim + its offline queue · THE ALBUM on this device (IndexedDB, the JPEG's bytes) · CITY SIGHTINGS on the profile |

**What counts** (`SIGHTINGS` = `core/achievements.js#LEGENDARIES`): the UFO · the TR-3B · THE BLACKBIRD (its passes, the TR-3B's chase, THE
WATCHER's reward) · the F-22s (the surprise flyby + the TR-3B's chase) · the GHOST SHIP (Halloween) · the AURORA (its seeded nights + a real
Kp ≥ 7 storm, after dark at the place) · the FIREBALL · the SKULL balloon + the ₿ balloons (a flight whose seeded line-up has one — the
festival always).
**The verdict** (`verifySighting`): the claim's time ≤ the server's + 15 s and ≤ 12 h old (an offline tap queues); the phone's zone within an
hour of the IP's; then THE TIMETABLE (the window it was up, ± a few seconds) — or THE RADIO: a moment the OWNER fired for EVERYONE / a room
the player is in counts ONCE A DAY per player (`ppriv/{pid}/sgr/radio:<day>`); JUST ME (his own preview) + a CREW member's moments + every
`&force=` / `&lgnow=` / the preview panel NEVER (a force plays only on the phone that asked — the timetable says nothing was there; the
phone doesn't even send a claim from a preview page). One count per APPEARANCE (`ppriv/{pid}/sgk/<key>`, kept 3 days): ten taps on one UFO =
one sighting.
**The award** (`core/achievements.js#awardAll`): a legendary's FIRST counted sighting → its MATCHED PAIR (`card-sg-<id>` LEGENDARY card +
`emb-sg-<id>` emblem; THE VAULT 1 draws them) + the counters `pa.sg[id]`, `pa.sgt` → STARGAZER (3 different) · FREQUENT FLYER (25) · THE
WITNESS (all). X% via `pcount/i`.
**The pair's CARD ART** (THE VAULT 1C): every sighting's LEGENDARY card is built — the city's own model in its own scene (`js/fx/sg-*.js`,
docs/vault.md "THE SIGHTING CARDS"); the reveal's pair + the album's no-photo tile show its SCENE once its full card is approved in THE CARD LAB
(`js/vault/full.js#upgradeScene`) — the placeholder until then; the reveal's timing unchanged.
**A NEW LEGENDARY plugs in by:** its id in `LEGENDARIES` + its row in `SIGHTINGS` (names + jacks) + a `case` in `skyWindows` (where the
timetable puts it) + its pair in `core/items.js` + a `SR.box(id, …)` in its draw (its tap box) + its reaction (read `SR.k(id)`; motion in
the screen's plane + its own lights) + a line in the harbor `sightings` group.

### THE TAP + THE REACTIONS (the SAME baked sprites — no new models, angles or art)
UFO — wobbles on its axis + its beam flickers · TR-3B — its corner lights race round the triangle · BLACKBIRD — pitches its nose up + lights
its afterburners · F-22s — break apart (each its own way, then fall back in) · GHOST SHIP — its lanterns flare (the stern's most) · SKULL
balloon — its burner ROARS (a big flame lighting the skull from below) · ₿ balloon — its burner flares + it bobs up + a gold pulse on its ₿ ·
AURORA — brightens + a ripple runs out along it from the finger · FIREBALL — flares in a burst of sparks. Every tap, even after it's spotted,
only on the tapper's phone; reduced motion = the light half, held. The title asks the legendaries FIRST (a balloon / the Blackbird can cross
the sign) — except the aurora, which is BEHIND the sign: a tap on the letters stays the letters'.

### THE FLASHBULB, THE REAL POLAROID, SPOTTED + THE REVEAL
~0.45 s into the reaction the city's ACTUAL frame is captured (`scene.snapshot` — every city canvas incl. the crisp lettering + the
legendaries' overlays, cropped square round it at the phone's full dpr: 966 px at 402 @3; ~1 ms on the main thread — the JPEG encodes async
after) the instant before a press-camera FLASH (A's `flash`); THE PARKED PRINT (THE VAULT 1A — the owner's review: "not smooth"): ONE
element the whole way — it shrinks + glides into its corner (a tilt, a soft settle), developing, TAPPABLE there (opens the moment at once);
a BIG legendary (the UFO, the TR-3B, the ghost ship) keeps it there until the craft has CLEARED or LEFT THE SCREEN (a hidden tab waits; a
looping forced one lets go at 75 s) — then it GROWS BACK from that spot (FLIP, a spring); then THE POLAROID big (A's `polaroid`) with its date + time
hand-lettered (Caveat), SPOTTED stamped, and THE REVEAL of the pair + X% (A's `card-reveal`) — HELD until a tap (taps in its first second
ignored). AGAIN: the corner print + "SPOTTED · 4th time". A preview: the print + "A PREVIEW · IT DOESN'T COUNT", never SPOTTED, never kept.
`/api` down: the moment plays the same, the claim waits in the queue (≤ 12 h), a later "SPOTTED · <name>" toast when it unlocks.
**The NEON sign + the tagline are not in the photo** — they're the title's SVG / text over the city (like the dock), not city layers; the crop
keeps below them where the legendary allows.

### THE ALBUM (the profile's CITY SIGHTINGS)
**The photos stay ON THE DEVICE** (IndexedDB `ns-album` — the JPEG's bytes, not a Blob: WebKit's private storage refuses Blobs), the first +
the latest two per legendary (≤ 27, ~0.3 MB each); **the record on the server** (the pair's grant time = "first spotted"). Another device
shows the LEGENDARY card + the date. Only what's owned — no ???, no totals. A server copy of the photos would need Firebase Storage (a new
service + its rules) — not added.

### The owner's previews (never counted, never kept in the real album)
`&sgdemo=<id>` with its legendary forced — the first-time sequence on its own ~2 s after it's in view (its prints go to a separate preview
album `ns-album-preview`, which `?preview=card` shows) · `&sgagain=N` — the Nth-time corner print.

## BIRTHDAYS (PROGRESSION B)
`core/birthday.js` (PURE) + `api/_lib/birthday.js`: MONTH + DAY on the profile (never the year), optional, private (`ppriv/{pid}/bd` — never
in a public response), changeable ONCE A YEAR (a clear counts as a change). On the day (the phone's zone, within an hour of the IP's): the
player's own city SKYWRITES "HAPPY BDAY <NAME>" (their own name through the name filter — a refused one → FRIEND) the first time it opens
that day (`remote.js#localMoments` — skytyped by day, the drone show after dark; never on a preview page) + MANY HAPPY RETURNS
(`event 'birthday'`, server-checked); entering a room that day → the server writes the room's copy (`rooms/{CODE}/radio`, once a day a room —
DORMANT until LOBBY 2.0 makes the lobby the live city).

## CALL IN A FAVOR (PROGRESSION B)
A FAVOR token (`pstats/fv` — the 100-night streak's reward) → the profile's A FAVOR sheet: pick ONE of the crew's 11 jacks → **PREVIEW ·
JUST ME** plays it on the player's own city now (nothing spent) · **FOR YOUR ROOM** spends it through the radio's own path (role `favor`:
the room they're in, the crew's limits + cooldown, the words' filter, never a sighting); the token is reserved in a transaction + handed back
if the radio refuses (`api/_lib/favors.js`). The room button sleeps until LOBBY 2.0 (`js/progress/extras.js#FAVOR_ROOMS_LIVE`).

## THE OWNER's PROGRESSION A REVIEW (built as B's add-on)
The end-of-round moment fits ONE screen (no pinned CONTINUE; extras fold into "+N MORE") · THE LEVEL-UP + every full-screen reveal HOLD until
a tap (taps in the first second ignored; TAP TO CONTINUE after one) · IVORY NAMES (gold only for the section headers + borders; "22% of
players have this" in sentence case — since THE VAULT 1A: NO SMALL ITALIC (the descriptions + every small line in the UI font, upright,
≥ 14 pt, ivory ~78 %), PINK ONLY BIG (FOUNDING MEMBER a neon-outlined pill; X% 13 pt bold, a light pink)) · THE STREAK CARD = THE BIG FLAME (`js/progress/flame-art.js` — three nested neon tubes; the same
flame small on the end-of-round line, the profile, the card + the dock badge) · the preview profile's ✕ in its own bar · THE PROGRAM in
three sections (ON NOW · COMING UP · EARLIER TONIGHT collapsed) · THE INTERCOM's WHEN (NOW · IN 10 MIN · AT A TIME ≤ a day; the clip kept
until it plays + its hour; CANCEL until it plays).

## Tests
`tests/levels.test.mjs` (the curve, the rewards, the carry-over, THE YEAR SIM) · `tests/streak.test.mjs` · `tests/achievements.test.mjs` (all 30 +
the engine + FOUNDER) · `tests/daily.test.mjs` · `tests/integration/progression.test.mjs` (/api on the emulators: the daily contract with the
fake daily, the outage, a real report's awards, wearing, X%, the events, the FOUNDER switch + its sweep) · `rules.test.mjs` (nobody writes
any of it) · `e2e-profiles.mjs` (a real match → the moment, the skip, the profile, the streak card, /api down) · the harbor `progress` group
(the dock flame at 3×, the preview links, reduced motion) + `radio` (THE FOUNDER switch).
**PROGRESSION B:** `tests/sightings.test.mjs` (the verifier: every legendary on its real timetable, forged / future / stale / far-zone
claims, a `&force=` time, the radio's owner once a day vs JUST ME + the crew, the pairs + STARGAZER / FREQUENT FLYER / THE WITNESS) ·
`tests/birthday.test.mjs` (once a year, Feb 29, the day in the zone, the name filter, the favor role) · `tests/radio-intercom.test.mjs` (THE WHEN) ·
`tests/integration/sightings.test.mjs` (/api on the emulators: a real claim + one count per appearance + the pair + X%, forged ones, the
radio once a day, birthdays private + once a year + the day + the room's copy, a favor spent only when accepted) · `rules.test.mjs`
(nobody writes any of it) · `e2e-profiles.mjs` (the held level-up, the big-flame card) · the harbor `sightings` group (a tap on each
legendary → its reaction, a forced one never claims; THE SEQUENCE + the capture's frame cost; reduced motion) + `radio` (THE WHEN).

## THE VAULT 1B (Nov 3) — NAMES ONLY TO OWNERS + the new rewards
The items, the 32 achievements and WHAT each level / streak milestone gives moved to the server (`api/_lib/catalog.js`; the shared `core/` modules keep the engine + registries the server fills at import; `REWARD_LEVELS` keeps WHEN). A phone gets display rows only for what it owns or just earned (`withShow` on every /api answer — a level reward's row carries its `lv`, the end of round sorts by it). New level rewards: SMOKE ROOM 12 · FROSTBITE 16 · PRISM 22 · INFERNO 42 (existing players get them on their next match — the carry-over). docs/vault.md "NAMES ONLY TO OWNERS".

## ACHIEVEMENTS AS TROPHIES (THE VAULT 2C — `js/progress/trophies.js`; the owner's approved mock profile-rearranged.png)
Each achievement the player HOLDS, as a trophy: a round neon **MEDAL** (the reward's own emblem when it has art, else the achievement's group as a
neon sign-up shape), its ring in the TIER colour (the reward's tier — the one palette); the name; the line; **"X% of players have this"** (pink —
the SERVER's counts: `/api/profile 'pct'`, computed + cached, never a client list of profiles); **UNLOCKED · <reward chip>** — a real preview (an
emblem at its size, a glow lit on the word GLOW, a card's swatch, a tube style on a neon star — never the player's name crammed in); **a tap on
the chip wears it** (WEARING once worn — the server checks it); the date earned. Only what the player holds — locked achievements are NOT shown
(the standing rule: collections show only what you own; names reach a phone only for what it owns — `tests/vault-names.test.mjs`).
