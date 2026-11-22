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
| `js/core/achievements.js` | PURE — THE ACHIEVEMENTS (45 — the 32 + each game's own) (checks + their item), the counters (`noteMatch`, `noteEvent`), THE AWARD ENGINE (`awardAll` + FOUNDER) |
| `js/core/daily.js` | PURE — THE DAILY CONTRACT: a cartridge's shape, `registerDaily`, the standing (percentile + bands), YOUR TABLE's TODAY |
| `js/core/progress.js` | PURE — the steps the server runs inside ONE transaction: `matchStep` (a counted match), `dailyStep`, `eventStep`, `carryOver` |
| `api/_lib/stats.js` | a verified match → `matchStep` per player (+ the facts only the server knows: the host, the room, the hour, the holiday, the friends) |
| `api/daily.js` · `api/_lib/dailies.js` | `POST /api/daily` start / finish / today; the cartridges + the secret seed (+ THE FAKE DAILY behind `DAILY_TEST=1`) |
| `api/_lib/events.js` | `POST /api/profile {action:'event'}`: the knock, THE WATCHER's hour, the real weather |
| `api/_lib/owners.js` · `api/_lib/founder.js` | "X% OF PLAYERS HAVE THIS" (`pcount/`) · THE FOUNDER WINDOW (`progress/founder`, the sweep) |
| `js/progress/*.js` · `css/progress.css` | the screens (loaded on first use): `moment.js` (THE END-OF-ROUND MOMENT + the level-up), `streak-card.js`, `card.js` (THE GILDED CARD), `profile.js` (the sections under it), `flame.js` (the dock's flame), `look.js` (the fan, the medal, the flame icon, X%), `preview.js` (`?preview=`) |
| `js/audio/progress-sfx.js` · `audio/sfx/pg-*.mp3` | the 9 sounds — docs/audio.md#the-progression-sounds |
| `js/daily/contract.js` · `js/profile/events.js` | the phone's side of the daily contract (fetch only — no socket) · the events (fire-and-forget) |

## RESULTS COMPACTED (CITY G, Nov 18 2026 — the Nov 17 2:50 pm inbox entry, item 4)
results/{CODE}_{matchId} grew forever (solo PLAY AGAIN its fastest writer; a solo record ≈ 620 B, each room player ≈ 500 B — the whole podium
payload per player). WHO READS IT: report.js + holdem-store.js (a duplicate report / a resend — the 6 h cap, a queued report, a 'retry' record's
`xs` = THE LOST RUN) · share-card.js (a RUN's card: today / yesterday) · /admin's STATS history (insights.js#summarize — g, at, n, the players' ids)
· THE BOARD's back-fill (board-fill.js — o.skip / o.n, this week's o.xp.gain, HOLD'EM's o.win / r.ko / r.mode / r.src) · the activity counter's
one-time fill. THE RULE (`js/core/results-compact.js`): a 'done' record older than **14 days** is COMPACTED to exactly what those readers use
(marked `c: 1`), never deleted, never a 'retry' / 'busy' one — by THE DAY'S CLOSE (`api/_lib/results-sweep.js` from api/daily.js 'today', ≤ 300
records a day, never waited on). 78 % smaller (a solo record 619 → 158 B); every reader answers the same (`tests/city-g.test.mjs`). The nightly
backup keeps the full records of the days before.

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
1 GILDED (everyone) · 3 MIDNIGHT · **4 HEARTBREAKER** · 5 BRASS DECO · **6 emblem SWEETHEART** (THE VAULT 2A) · 7 tube TWO-TONE · **10 EMERALD & BRASS** · 13 emblem DIAMOND · 15 glow ICE · 18 NEON GLASS ·
(CITY B, Nov 15 — the owner: **GLITTER BOMB moved from LV 8 to LV 50, beside GLOW GOLD**; an owner keeps it, nothing re-granted — `tests/city-b-glitter.test.mjs`.)
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

## THE ACHIEVEMENTS (45 since JAYWALK H6A; 41 since PD-5B — shown only once earned + X%)
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
| DAILIES *(dormant — the first daily)* | DAILY BREAD (7 different days) · THE SWEEP (every daily on today's list in one day — was THE TRIPLE, id `the-triple` kept, DM1) · EARLY BIRD (before 8 am) · PENTHOUSE SUITE (top 1 %, ≥ 50 finishers) | CANDLELIGHT · THREE STARS · SUNRISE · PENTHOUSE (epic) |
| SPECIALS | HODL — a 21-night streak · MANY HAPPY RETURNS — your birthday *(dormant — B)* · SEASON'S GREETINGS — 3 holidays (`core/sky.js#holidayOf`) | emblem ₿ · CONFETTI · glow TINSEL |
| GAMES | FOUR ON THE FLOOR (PRISM DROP: a 4-line clear) · DEAD ON (OVERCLOCK: a Closest Call exact) · OVERCLOCKED (10 OVERCLOCK wins) · REDLINE (OVERCLOCK: alone on top of every challenge of a QUICK match, 2+ players — `overclock-sweep`) · PHOTO FINISH (OVERCLOCK: the win by exactly one point, 2+ players — `overclock-photo`) · HORSESHOE (OVERCLOCK OC5: backed the winning horse in DUMB LUCK, 2+ players — `overclock-horseshoe`, the server replays the race) | PRISM · BULLSEYE · CIRCUIT · card REDLINE (legendary) · card PHOTO FINISH (rare) · emblem HORSESHOE (uncommon — its art PENDING in THE LAB: the glyph until then) · **LIGHTHOUSE** (COAST CLEAR CC2: any clear — `coastclear-clear`, emblem, uncommon) · **GHOST RUN** (COAST CLEAR CC2: a clear with zero spots in 50 s or less — `coastclear-ghost`, card, rare; *dormant until THE SWITCH-OVER*) · **KEYHOLE** (THE PASSWORD PW2: both doors opened — `password-crack`, from the SERVER's record on finish, `api/_lib/pw.js#flags` → `dailyStep({ flags })`) · **SAFECRACKER** (THE PASSWORD: both doors in ≤ 6 guesses combined — `password-safe`) | … · emblem KEYHOLE (uncommon) · card SAFECRACKER (rare — Grok's vault door, js/fx/pw-cards.js) — both dormant until THE SWITCH-OVER (no cartridge in production) |

**PRISM DROP's three (PD-5B):** FIRST KO (`first-ko` — a KO in a BATTLE, credited in the room's own `game.out`) → card FIRST KO (common) · PERFECT
CLEAR (`perfect-clear` — a perfect clear, any mode; a SOLO run counts: the solo lane hands its row's flags to the award engine) → card PERFECT CLEAR
(rare) · COMEBACK (`comeback` — won a BATTLE after the stack reached the danger zone, PD-2's `dz`) → card COMEBACK (epic). Flags `prism-firstko` ·
`prism-pc` · `prism-comeback`; COMEBACK KID's generic `comeback` flag is OVERCLOCK's only (`achievements.js#noteMatch` skips PRISM).

**JAYWALK's four (H6A — docs/jaywalk.md "THE CARDS"):** SONIC BOOM (`sonic-boom` — `jaywalk-boom`) → card SONIC BOOM (rare) · CLOSE ENCOUNTER
(`close-encounter` — `jaywalk-ufo`) → card CLOSE ENCOUNTER (rare) · RIGHT OF WAY (`right-of-way` — `jaywalk-airfield`: lane 400 in one counted run,
solo or match) → card RIGHT OF WAY (legendary) · BEAM ME UP (`beam-me-up` — `jaywalk-mothership`: still in when THE MOTHERSHIP arrives, a counted
match / daily) → card BEAM ME UP (epic). The flags ride each result row (`f`) from the SERVER's own replay of the proof nodes — never a room's own
results; a counted MATCH run also raises the JAYWALK best (the board `jaywalk-solo` — YOUR BEST ANYWHERE).

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
  The server lists its cartridges in `api/_lib/dailies.js` (`SERVER_CARTS`: THE PASSWORD + COAST CLEAR — open while THE GO-LIVE SWITCH is on, or under `DAILY_TEST=1`, which adds THE FAKE DAILY — guess 0–999, 1000 − the miss; DM1 below).
- **THE DAY** = the streak's day. **THE SEED** = HMAC(THE DAILY SECRET, `daily:<id>:<day>`) — secret, the same for everyone, never early (DM1 ADD-ON: the dailies' own key, never the pepper).
- **ONE OFFICIAL TRY:** `start` records `dly/{game}/{day}/s/{pid}` (a refresh = the same try, its clock running); `finish` → the cartridge's
  `verify` replays the result against the seed → the first score is kept (`r/{pid}`, a transaction) → the histogram `h/{bucket}` + `n`.
- **THE STANDING:** the percentile ("better than X %" of the other finishers) + the band by place from the top — **PENTHOUSE** top 1 % ·
  **VIP ROOM** 10 % · **LOUNGE** 25 % · **BAR** 50 % · **FLOOR** — shown only from **50 finishers** (`BAND_MIN`).
- **THE STREAK + THE COUNTERS:** `dailyStep` (idempotent by `daily_<game>_<day>`) keeps the streak like a match + the DAILY XP + DAILY BREAD / THE SWEEP /
  EARLY BIRD / PENTHOUSE's counters (`pstats/dl`) — the counters + rewards only for a COUNTED result (DM1's THROWAWAY GATE).
- **YOUR TABLE's TODAY** (`today { pids }` — BOARD 2.0 draws it): your scores + each friend's: a tick until YOU have finished that daily, then their score.
  FRIENDS A: the server reads YOUR FRIENDS LIST (`pfr/{pid}/f`) — a stranger named by id is never read; ≤ 12 a read: a picked `pids` list kept to
  friends (its order), else the friends you played with most recently, then the newest friendships (`core/friends.js#tablePids`); the answer adds
  `table` (the pids covered). The profile card shows a YOUR TABLE placeholder until THE DAILY MODULE draws it.
- **No socket:** a solo daily is `/api` only (`js/daily/contract.js` — fetch + the ID token; THE PARKED DATABASE never wakes).
- Cost (Spark / Hobby): a finish = ~6 small writes + 3 reads; `today` ≤ 12 friends × the dailies' reads. One more function (`api/daily.js` — 8 of Hobby's 12).

## THE DAILY MODULE — DM1: THE ENGINE (Nov 8 2026; the owner's decisions: docs/games/plan.md DM1 + its ADD-ON)
The server half of THE DAILY MODULE: everything a daily needs to go live except the screens (DM2 draws the picker, TODAY, the banner, the RESUME
chip, the host's "N players are mid-daily", the "counts from tomorrow" line, PENTHOUSE's card — design "A · THE DIAL").

| file | what |
| --- | --- |
| `js/config.js#DAILIES` | THE LIST — the ONE registry the server + the phone share: `{ id, name, theme, tag, blurb, order, ticket (its ticket art key), lesson (a first-time lesson — DM2's practice harbor), on }` |
| `js/core/daily.js` | PURE: `dailyRows()` (the list, in order + the test rows) · `todaysDailies()` (the LIVE ones — the registered cartridges in the list's order) · `sweptDay` · `dailyXp` (`DAILY_XP` = 15 a daily, capped at one per daily on the list) |
| `js/core/progress.js#dailyStep` | the streak + the DAILY XP (+ the level rewards it crosses) · counted only: DAILY BREAD / EARLY BIRD / PENTHOUSE's counters, the flags, THE SWEEP (`dl.sw` days swept; `dl.pw` = PERFECT WEEK's swept days this Eastern week — DM2 adds its card), the award engine |
| `api/_lib/dailies.js` | `SERVER_CARTS` (a row's server cartridge) · THE GO-LIVE SWITCH (`progress/dailies`, cached 30 s) · `openDailies` / `syncDailies` (registers exactly the live set) · `registerTestDaily` (DAILY_TEST only) · THE 4 AM PICKER (`pickDay`) · `dailySeed` |
| `api/_lib/daily-secret.js` | THE DAILY SECRET (`dsecret/k/{fromDay}`) + THE RESEED (`reseedDailies`) |
| `api/_lib/pw.js` · `pw-day.js` | THE PASSWORD's day: `pwDay` (the stored pair) ← THE FROZEN SCHEDULE (`dsched/password`: freeze · extend · reconcile · `reorderAfter`) |
| `api/_lib/daily-room.js` | THE ROOM WINS (`roomStarted`) + `midDaily` |
| `api/daily.js` | the call budget, the picker on the day's first start, THE THROWAWAY GATE at finish, the XP on the public profile, `today`'s `dailies` + `gated`, `room` |
| `js/daily/` | THE SHARED KIT (the phone): `clock.js` (the 4 am countdown, the run's own day) · `judge.js` (`createDailyJudge`) · `end.js` (`recordFinish`, `tickTurn`, `endActions`, `fitTitle`, `shareOrLine`, `lookMusic`) · `share.js` (the card's frame, foot + sender) · `sfx.js` · `run-day.js` · `contract.js` |
| `scripts/dailies-reseed.mjs` | THE RESEED command (`npm run dailies:reseed`) — the emulators + tests only since DM2's ADD-ON (live: /admin → THE DAILIES → RESEED) |

- **PLUG-AND-PLAY:** no fixed count anywhere — THE SWEEP, the XP cap, THE 4 AM PICKER and `today` (its `dailies` rows for DM2's picker / TODAY rows /
  SCORES tabs) all read `todaysDailies()`. **Adding a daily** = its cartridge (docs/cartridge.md D2 — the client half + its server half in
  `SERVER_CARTS`) + ONE row in `DAILIES`. Proof: a fake 3rd + 4th daily join everything with no other change (`tests/daily.test.mjs`,
  `tests/integration/daily-module.test.mjs`). THE SWEEP = every one of today's dailies finished (`the-triple` — renamed, the id + emblem kept).
- **THE 4 AM PICKER:** the day's first `start` fixes the day for EVERY live daily (`pickDay` → each cartridge's `load(day)`): THE PASSWORD's pair
  (`dly/password/{day}/b`), COAST CLEAR's board (`dly/coastclear/{day}/b`) — each from THE DAILY SECRET, stored once (a transaction: two first calls
  at once keep one day), idempotent, a memo per warm function. Lazy (no cron): the 4 am turn takes effect with the day's first call.
- **THE FROZEN SCHEDULE** (`dsched/password` — server-only, NEVER a file): THE PASSWORD's order fixed once (cycle 0 = the old formula's order, so the
  switch moved nothing); a new cycle appended when the days reach its end; a LIST EDIT reconciles it — everything up to today's pair kept, a removed
  word skipped (the later days slide up), a new word joins the end of the cycle: nothing already scheduled moves (`tests/pw-day.test.mjs`).
- **THE THROWAWAY GATE:** a result COUNTS only if the profile existed before that day's 4 am Eastern start (`ppriv/{pid}/at` — server-written at
  creation; `core/streak.js#dayStartAt`, DST-safe; no time = an old profile = counts). A non-counting result: one try, kept, the player's own score,
  the streak + the DAILY XP as usual — but NOT in the histogram / the band (`dly/{game}/{day}/x/{pid}` marks it), YOUR TABLE (a friend's is left
  out), THE BOARD, or ANY reward (SAFECRACKER, KEYHOLE, GHOST RUN, LIGHTHOUSE, THE SWEEP, PERFECT WEEK, PENTHOUSE, FOUNDER). The finish answers
  `counted: false` + `countsFrom` (tomorrow's 4 am — DM2's quiet "counts from tomorrow").
- **THE CAPS:** new profiles = **20 a day per IP** (`profiles.js#NEW_PROFILES` — a party of 8 new guests on one Wi-Fi fits twice; a loopback address
  never counts; refused = 429 `too_many_profiles`, the phone still plays without a profile) · daily calls = **400 per 10 minutes a player**
  (`api/daily.js#CALLS` — a COAST CLEAR run is ~50–110 calls, a PASSWORD run ≤ 15; 429 `slow_down`; taken beside the first read — no added wait).
- **THE ROOM WINS:** a `pause` (COAST CLEAR) is accepted only while the player's room has REALLY started a game — `rooms/{CODE}/meta` status
  `playing`, or THE GAME START's `go` stamp ≤ 2 min old — with the player in it (`players/{uid}`, or a player node carrying their pid) **and 2+
  players in the room (DFIX2 — `daily-room.js#MIN_PARTY`: a room of one isn't a party; it can't stop the clock)**; the room =
  the call's `room` (`judge.pause(room)`), else the profile's seat. Otherwise 409 `no_room_game` and the clock runs. The caps (3 pauses, 20 min) stay.
  THE PASSWORD has nothing to pause. **`room { room }` → `{ mid: [uid…] }`**: which players of YOUR room have a run in flight — uids only (the tests';
  the host's line reads THE MID-DAILY FLAG since DFIX2 — below).
- **THE GO-LIVE SWITCH** (`progress/dailies` = `{ on, at, by }`, server-only): /admin `dailyState` · `dailySwitch { on }` (owner only — ADMIN_PIDS —
  audited `dailiesOn` / `dailiesOff`) · `dailyFresh` (typed FRESH; refused while ON: wipes `dly/` + `dsched/`). OFF (the default) → production
  answers every daily 404 `no_daily`; ON → the list's switched-on rows answer (never the fake). It can be flipped **at any time** (the ADD-ON);
  `DAILY_TEST=1` opens them on the emulators whatever it says. Until DM2 there is no way IN on the phone, so ON changes nothing a player sees yet.
- **THE DAILY SECRET** (`dsecret = { v, k: { '<fromDay>': hex } }`, server-only): every day's content comes from it (THE PASSWORD's schedule,
  COAST CLEAR's boards, the plain seed) — NEVER the pepper (the restore keys, the board ids, the flags, the logs), so rotating it can't break any of
  those. The base key = the `DAILY_SECRET` env when set (set it before the first live day or never), else a random one made + stored at first use.
- **THE RESEED** — `node scripts/dailies-reseed.mjs` (or `npm run dailies:reseed`; `--dry-run` = the plan, nothing written; `--force` = rotate again):
  run with the live database's env (`FIREBASE_SERVICE_ACCOUNT` + `FIREBASE_DATABASE_URL` — the same two Vercel has; `FIREBASE_DATABASE_EMULATOR_HOST`
  for the emulators). A NEW key from the NEXT 4 am Eastern day on; THE PASSWORD's schedule after today's pair reordered by it (the same words);
  any stored future day dropped. Today's run, every past day + every result stay exactly as they were; a second run says "already reseeded"
  and changes nothing. Proof: `daily-module.test.mjs` (past + today unchanged, tomorrow differs, the pepper + a key's hash unchanged).
- **NOTHING SECRET IN THE REPO:** the schedule, a stored day and the secret live only in the database; `tests/daily-secrets.test.mjs` reads every
  tracked file and fails on one (the answer list stays alphabetical — an order in the file would be a schedule).

### THE SWITCH-OVER (the changed plan — Ben, Nov 8: ON while the repo is public; private + fresh later)
1. **Now (the repo public, Ben + a few friends):** /admin → `dailySwitch { on: true }` (or off again) — any time. Check one real day: a start, a
   finish, `today`. (DM2 brings the way in on the phone; set `PW_EPOCH` / `CC_EPOCH` in the two meta.js files to the first live day for the share #.)
2. **When Ben tells people:** make the repo PRIVATE → **/admin → THE DAILIES → RESEED · PREVIEW**, then **RESEED NOW** (a second tap — DM2 ADD-ON: it runs on the
   SERVER, so no service-account key ever goes on a PC; was `node scripts/dailies-reseed.mjs`) (a fresh daily secret from
   the next 4 am — every day anyone could have worked out from the public code is gone; today + the past untouched) → check the next day. (The
   OVERCLOCK reserve only matters if Overclock's daily ever comes back — DROPPED, Nov 8.)
3. Never needed for a reseed: a new pepper (the keys + board ids depend on it), a database rules change, a deploy.

## THE DAILY MODULE — DM2: THE SCREENS (Nov 8 2026; the owner's decisions: docs/games/plan.md DM2 + its ADD-ON)
Every daily still OFF — the owner's switch (/admin → THE DAILIES) turns them on; until then the phone shows none of this (no DAILY button).

| file | what |
| --- | --- |
| `js/screens/title-dock.js` | THE FLANK's **DAILY** button (left-most; `setDaily`), the **RESUME YOUR DAILY** chip above the dock, the ☰ menu's THE DAILIES row (`setMenuExtra`) |
| `js/screens/daily.js` + `css/daily.css` | THE DAILY SCREEN + a daily's RUN — OVERLAYS over the city driven by `state.daily` (`app.js#paintDaily` → `syncDaily`); THE ROOM WINS' banner |
| `js/daily/today.js` | ONE `today` answer shared (~20 s; re-read after a finish) + THE HELD RUN (`daily:held` — the RESUME chip) |
| `js/daily/today-logic.js` | PURE: `dockState` · `rowState` · `sweepState` · `tableFor` (YOUR TABLE's places, ties shared) · `everyoneLine` · `midLine` · `shareTodayLine` |
| `js/daily/share-today.js` | SHARE TODAY — one card for all of today's dailies (each game's `scoreLine` + THE SWEEP; 1–6 rows) + one plain line |
| `js/screens/room-dock.js` + `room-city.js` | the host's **N PLAYERS ARE MID-DAILY** above PLAY (DFIX2: from each phone's own flag `players/{uid}/dy` in the mirrored room — `js/daily/room-flag.js`; was a 20 s poll) |
| `js/games/<daily>/meta.js#scoreLine` | a daily's spoiler-free line for a score (THE PASSWORD: `7 GUESSES` / `LOCKED OUT`; COAST CLEAR: `2:41` / `CAUGHT`) |
| `js/games/coastclear/lesson.js` | THE PRACTICE HARBOR (a daily's first-time LESSON — its row's `lesson` + `createLesson` from its cartridge) |
| `js/fx/ph-dial.js` + `ph-specs.js` · `js/fx/dm-cards.js` + `dm-specs.js` | PENTHOUSE's card THE DIAL (drawn in code) · PERFECT WEEK's motion (docs/vault.md) |
| `api/daily.js` | `today` answered with NO profile (the list only) + `better` · `hook` · `started` · `stand` (≥ 50) · `lessons` · `countsFrom`; `lesson { game }` |
| `api/admin.js` + `js/admin/admin.js` | /admin → **THE DAILIES**: THE GO-LIVE SWITCH (a second tap) + **RESEED** (`dailyReseed` — PREVIEW = the dry run, RESEED NOW on a second tap, audited) |

- **THE DOCK BUTTON:** `[ JOIN ] [ DAILY · BOARD · GAMES · YOU ] [ HOST ]` (4 icons — the most this dock holds; each cell 6 px narrower so it keeps a gutter at
  390). WAITING (any of today's live dailies unplayed) = lit day + night, a soft pink pool breathing behind it (opacity + scale) + the count left; ALL DONE = the
  dock's own style + a small drawn check (`--good`); no live daily (the switch off, /api down) = hidden — the pill exactly as before. It answers the sign's LAST N
  (letter 3, with the corner buttons): BOARD · GAMES · YOU keep N · E · O. BOARD 2.0 later moves THE BOARD inside DAILY → SCORES → ALL TIME (FRIENDS takes its slot).
- **THE DAILY SCREEN (TODAY):** the sign THE DAILIES · TODAY / SCORES (plain type + a drawn underline) · THE SWEEP meter (one segment per live daily — 1–6) · one
  TICKET per daily (a notched ticket, a perforated stub with its drawn art, the name + a one-line hook): WAITING → PLAY · IN PROGRESS → RESUME · DONE → the result
  (`scoreLine`) + YOUR TABLE's place ("2ND OF 5 AT YOUR TABLE"), else the everyone line, else DONE FOR TODAY + a drawn check · SHARE TODAY (once one is done) ·
  "NEW DAILIES IN 13:39:21" (the 4 am Eastern turn). A same-day profile's result reads **YOUR SCORE COUNTS FROM TOMORROW** (quiet, small — never ranked).
  THE SWEEP moment: the last daily finished → back on TODAY the meter's last segment fills + a short neon flourish (once; never replayed by a fresh `today`).
- **SCORES:** TODAY only (ALL TIME hidden until BOARD 2.0 — Step 0): per daily YOUR TABLE (you + ≤ 12 friends the server picks — never a non-friend; a friend's
  score only once you've played — PLAYED before; WAITING for one who hasn't; places share ties) + **TOP 12% OF EVERYONE** once the day has 50 counting finishers.
- **A RUN:** the cartridge's own view mounted solo in the overlay (`daily.create`'s shell; its API judge wrapped — the start = IN PROGRESS, the finish = the score
  in at once + THE SWEEP + the counts-from-tomorrow line); ‹ BACK → TODAY. The overlays wear THE GAME LOOK (night neon / day = the dailies' clear morning sky —
  live from Settings; app.js#paintLook) and a run's music follows the look. The city under them is HELD (frames paused) — never reloaded.
- **THE ROOM WINS on screen:** the host starts a game while a phone is mid-daily → the game start's closeAll (at the `go` stamp) → **GAME STARTING · YOUR DAILY
  IS SAVED** (its own strip over the walk inside, `.dy-banner`) → the run HELD on this device (+ COAST CLEAR's `pause(room)` — the server checks the room) → the
  player is dealt in like everyone → back in the room **RESUME YOUR DAILY** above the dock → the run exactly where it was (THE PASSWORD: the same door, unsent
  letters gone; COAST CLEAR: resumed, +15 s a pause, the 3 / 20-min caps). The host sees **N PLAYERS ARE MID-DAILY** above PLAY (uids only — never a run).
  The room's way in to a daily: the ☰ menu's THE DAILIES row (outside a match).
- **THE REWARDS (the server's, counted results only):** THE SWEEP + **+10 XP** (`SWEEP_XP`, once a day — `dailyStep`); **PERFECT WEEK** = THE SWEEP on 7 daily-days
  IN A ROW (`dl.sr = { d, n }`, the best `dl.sb` — any 7 consecutive, never a weekday; the card `card-perfect-week`); **PENTHOUSE** = rank ≤ max(1, ⌊n × 1 %⌋) AND
  n ≥ 50 (`core/daily.js#penthouseCut` — dormant below 50; the rank = 1 + the finishers strictly better, ties at the cutoff all win) → PENTHOUSE SUITE +
  `card-penthouse` — **decided at THE DAY'S CLOSE since DFIX2** (below), never at finish time.
- **THE PRACTICE HARBOR** (docs/coastclear.md): the first COAST CLEAR open; seen once per player (`pstats/{pid}/ls/{game}` — every device).
- **Previews:** `tests/integration/daily-preview.html?state=waiting|one|mixed|swept|progress|gated|fake3 &tab=scores (&big=1 — DFIX2: 12 friends) &sweep=1 &look=day · ?view=lesson&step=0..3 ·
  ?view=banner`; the dock + the chip on the real title: `title-preview.html?daily=waiting|done|off&of=2&left=1&held=1` (the host's line needs the real /api — `e2e-daily.mjs` shoots it).
- **Tests:** `tests/daily-screens.test.mjs` (PURE) · `tests/daily.test.mjs` (the bonus, PERFECT WEEK, PENTHOUSE's edges) · `daily-module.test.mjs` (today's fields,
  `lesson`, the admin RESEED) · `e2e-daily.mjs` (36 checks — the dock, TODAY → PLAY → DONE + the table rank, THE PRACTICE HARBOR once, THE ROOM WINS' loop, THE SWEEP).

## THE SCREENS (the owner's mockups, THE ORIGINAL GILDED — black lacquer, brass foil, the fan crown, one hot-pink neon accent)
- **THE MOMENT — CITY F (Nov 17):** the sheet BUILDS WITH ITS ROWS (every XP line + the level from the first frame; a row not arrived yet takes no
  space — the sheet hangs from the top and grows down); the veil is a neutral dark, up AT ONCE (no purple fade washing the end screen); THE LEVEL UP
  + an EPIC / LEGENDARY item's OWN BEAT are opaque takeovers above CONTINUE, each held until a tap (its first second ignored); EVERY achievement a
  match earns shows its card (never cut at three — JAYWALK's match can earn four); CONTINUE = the non-pill tube, the level bar squared.
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
The items, the 33 achievements (OC5: + HORSESHOE) and WHAT each level / streak milestone gives moved to the server (`api/_lib/catalog.js`; the shared `core/` modules keep the engine + registries the server fills at import; `REWARD_LEVELS` keeps WHEN). A phone gets display rows only for what it owns or just earned (`withShow` on every /api answer — a level reward's row carries its `lv`, the end of round sorts by it). New level rewards: SMOKE ROOM 12 · FROSTBITE 16 · PRISM 22 · INFERNO 42 (existing players get them on their next match — the carry-over). docs/vault.md "NAMES ONLY TO OWNERS".

## ACHIEVEMENTS AS TROPHIES (THE VAULT 2C — `js/progress/trophies.js`; the owner's approved mock profile-rearranged.png)
Each achievement the player HOLDS, as a trophy: a round neon **MEDAL** (the reward's own emblem when it has art, else the achievement's group as a
neon sign-up shape), its ring in the TIER colour (the reward's tier — the one palette); the name; the line; **"X% of players have this"** (pink —
the SERVER's counts: `/api/profile 'pct'`, computed + cached, never a client list of profiles); **UNLOCKED · <reward chip>** — a real preview (an
emblem at its size, a glow lit on the word GLOW, a card's swatch, a tube style on a neon star — never the player's name crammed in); **a tap on
the chip wears it** (WEARING once worn — the server checks it); the date earned. Only what the player holds — locked achievements are NOT shown
(the standing rule: collections show only what you own; names reach a phone only for what it owns — `tests/vault-names.test.mjs`).

## THE DAILY MODULE — DFIX2: THE DAILIES FIX PASS (Nov 8 2026 — FABLE REVIEW #2's fixes + SLIM CARDS ON SCORES; the owner's answers: docs/games/plan.md DFIX2)
The review: docs/games/review-dailies-2.md (each finding carries its DFIX2 line). The dailies still ship OFF; the owner re-publishes the rules, then flips the switch.

| file | what |
| --- | --- |
| `js/core/progress.js#dailyStep` | **EACH DAY KEEPS ITS OWN COUNTERS** (finding 1 — the MUST FIX): `dl.days = { [day]: { g, x, sw? } }`, the two newest days kept (`dl.day` = a mirror of the newest); PERFECT WEEK's run bridges a sweep landing out of order (`sweepRun`: yesterday's late run after today's — `dl.sp` holds the run that ended the day before while the gap may still close) |
| `js/core/progress.js#penthouseStep` · `core/daily.js#penthouseWinners` · `api/_lib/daily-close.js` | **PENTHOUSE AT THE DAY'S CLOSE** (finding 2 → decision 2): the first `start` / `today` after 4 am Eastern closes every unclosed day it finds (yesterday back to `LOOK_BACK` 7 — a week of silence closes on the next call), each ONCE (`dly/{game}/{day}/c = { at, st: 'busy' \| 'done', n, w }` claimed by a transaction; a `busy` older than 10 min is retaken); the winners = rank ≤ max(1, ⌊n / 100⌋) of the day's FINAL counting finishers (n ≥ 50; a non-counting `x` left out; ties at the cutoff all win) each get `penthouseStep` in ONE pstats transaction (idempotent by `m/ph_<game>_<day>` — two racing closers grant once) + `bumpOwners`; the player meets the card on their next visit (the `me` call's card-earned moment). A memo per warm function: nothing after the day's first call. Never on a move. |
| `api/_lib/dailies.js#pickDay` | **THE RESEED CLEARS THE DAY CACHE** (finding 3 → decision 5): a day this instance has not seen reads THE DAILY SECRET afresh (`clearSecretCache()` — one extra read a day), so a reseed on the admin function in the last minute before 4 am can't hand the new day the old key from a warm instance's 60 s cache |
| `js/daily/today.js` | **THE 4 AM TURN** (finding 4): `today` carries its `day`; an answer from another day is stale whatever its age (`today-logic.js#dayTurned` — `loadToday` re-reads it, the dock's visibilitychange included); ONE timer to the next day start (`armTurn` → `turnNow`), the DAILY screen's countdown reaching zero turns it over too — the tickets back to PLAY, no reload; a run in flight keeps its own day (run-day.js) |
| `js/daily/today-logic.js#chipState` + `title-dock.js` | **THE RESUME CHIP's rule** (finding 5): shown only while its run is still resumable — its daily live, no score of yours in, its day today's or yesterday's with the server saying a run is still in flight there (`started` + `startedDay`); otherwise the hold is dropped and the chip clears itself |
| `js/daily/room-flag.js` + `room-city.js` · `database.rules.json` | **THE MID-DAILY FLAG** (finding 6 → decision 4): a phone with a run OPEN or HELD while in a room writes `rooms/{CODE}/players/{uid}/dy = true` (its own node — the rule: a boolean, the player's own, nothing else — **RE-PUBLISHED by the owner**); the host's line counts the flags in the mirrored room — ZERO /api calls (the 20 s poll is gone; `room` stays for the tests). Cleared on finish, a close unheld, a dropped hold (resumed · the day turned · the chip's rule) or leaving the room |
| `api/daily.js` `today` | **RESUME for yesterday's run** (finding 7): yesterday's unfinished run (DFIX1's yesterday-key rule) reads `started` + `startedDay: { game: yday }` — the ticket says RESUME, the dock counts it in flight, the chip's rule knows its day |
| `api/_lib/daily-room.js#MIN_PARTY` | **THE ROOM WINS needs 2+ players** (finding 8 → decision 3): a room of one that started a game can't pause a daily (409 `no_room_game`, the clock runs; the hold on the phone stays — the banner + RESUME as always) |
| `api/daily.js` `start` | the day's first start while the database hiccups → **503 `busy`** (the phone retries), never a 500 (OPTIONAL) |
| `css/daily.css` | the room banner "GAME STARTING · YOUR DAILY IS SAVED" on ONE line at 390 (12 px / 0.1 em; was two lines) (OPTIONAL) |
| `js/screens/daily.js#paintScores` · `js/ui/strip-board.js` (`stripKit` · `stripFor` · `stripFx`) · `css/daily.css` ".dy-cards" | **SLIM CARDS ON SCORES** (Ben: "they look so good, we need to start using them" — SLIM CARDS EVERYWHERE A PLAYER LIST SHOWS): each FINISHER's row = their equipped slim card through the results lists' OWN code (the kit loaded once a page; never a second strip system) — ONE effect surface per daily's panel (fx/renderer.js), every strip CALM, an unapproved card → its plain colours, no card → the Gilded plain strip, the full name always whole (`fitName`); the RANK (1ST, 2ND … ties shared) LEFT of the card, the SCORE (`scoreLine`) on the line UNDER the card at its right end in the number font (never over the card; a gated result adds NOT COUNTED), YOU = your card + a lit frame drawn along it (never a pill, never a tinted row; both looks); the ones STILL TO PLAY get no card — ONE line "STILL TO PLAY · YOU · LOU · MAXIMILIANOS" (whole names, wraps cleanly); a long table = the top 5 finishers + you (your real place) + a SHOW ALL n row that opens the rest in place (`today-logic.js#tableCut`, `cardRows`, `stillToPlay`); a friend who PLAYED before you did = their card reading PLAYED; TOP 12% OF EVERYONE stays at the panel's foot. The friends card's YOUR TABLE and TODAY's "2ND OF 5 AT YOUR TABLE" stay text. A friend's card data = `api/_lib/friends.js#cardOf` (+ `x`, `mn`). The surfaces go on every repaint + when the screen closes (30 opens: 0 left — e2e-daily). |

- **Measured (the preview, 2 panels × 6 strips at 390 × 844, 4 s of rAF):** 60 fps at 1× and 2× CPU, the 4× figure in the pass's summary.
- **Previews:** `daily-preview.html?state=swept&tab=scores` (5 finishers + 2 waiting — a legendary, a rare, an uncommon with a 12-letter name, one UNAPPROVED → plain, one with no card → Gilded) · `&big=1` (12 friends: the top 5 + you at 9TH + SHOW ALL 11) · `&look=day` · `?state=one&tab=scores` (you still to play one daily). The page approves exactly its own set through `&labmarks=<ids>` (`js/vault/approved.js` — a local server or a private LAN address only, never the live site).
- **Tests:** `tests/daily.test.mjs` (the review's three-daily timeline + the out-of-order bridge; `penthouseWinners` — the probe's 60 finishers, ties, 49; `penthouseStep` idempotent) · `tests/achievements.test.mjs` · `tests/daily-screens.test.mjs` (`dayTurned`, `chipState`, `tableCut`, `cardRows`, `stillToPlay`) · `daily-module.test.mjs` (the timeline over /api + RESUME for yesterday's run, THE DAY'S CLOSE — the early best, the racing closers, 49, the stale `busy`, a week of silence; the warm-instance reseed; a room of one; the 503) · `rules.test.mjs` (the `dy` flag) · `e2e-daily.mjs` (45 checks: SCORES' slim cards before + after you play, the rank / score / frame geometry, 30 opens → 0 surfaces, the 4 am turn on an open screen, the host's line from the flag, the flag's life, a room of one can't pause).
- **BEFORE PUBLIC (not now — plan.md DFIX2):** the repo private + RESEED; no reveal for a non-counting run; batched digs before ~350 players a day; `dly/` cleanup before ~500 a day.

## THE DAILY MODULE — DFIX3: THE DAILIES' FIRST-PLAY FIXES (Nov 8 2026 — the dailies LIVE; Ben's iPhone notes + two /admin fixes + his ADD-ONs; docs/games/plan.md DFIX3)
| file | what |
| --- | --- |
| `api/daily.js` · `js/games/coastclear/view.js` · `judge.js` · `vercel.json` | **THE DIG LAG** (docs/coastclear.md "The dig path + its timings"): the region pinned to cle1, two database waits a dig (the in-memory budget, the pid memo, the record held in the cache → one transaction attempt), COALESCED MOVES (`moves`), lazy finish imports, `Server-Timing` on every answer + the `&debug=1` tap log |
| `js/games/coastclear/index.js#HINT` · `view.js` · `js/screens/daily.js#openRun` | **THE ONE-TIME HINT** (docs/coastclear.md): the practice harbor CUT (lesson.js gone); one line under the board on a player's first COAST CLEAR, gone on the first number, seen once per player (`pstats/{pid}/ls`, the `lesson` action) |
| `api/admin.js` `dailyStats` · `js/admin/admin.js#dailyStats` · `css/admin.css` | **/ADMIN → THE DAILIES' STATS**: per live daily STARTED · FINISHED today + the last 7 days as columns (the tall bar = started, the bright = finished); **TODAY'S PLAYERS** (everyone with a start today, newest first, ≤ 50 of n): name#tag, LV, each daily's score line / PLAYING / —, COUNTS or NEW TODAY (the gate), ADD FRIEND = the EXISTING `friendButton` (REQUESTED / FRIENDS by itself, hidden for you); cheap reads (the day nodes' keys + ≤ 50 profiles, never a scan); **‹ BACK TO THE CITY** at the top of the authorized page |
| `css/daily.css` `.dy-scroll` / `.dy-body` / `.dy-today` | **TODAY CENTRED**: the box (the meter → the tickets → SHARE TODAY → the countdown) sits mid-way between the tabs and the bottom safe area by AUTO MARGINS (taller than the space → it starts at the top and scrolls — never a flex centre that clips); SCORES flows from the top |
| `js/daily/ticket-art.js` · `js/screens/daily.js#ticketRow` · `css/daily.css` "THE TICKET ROWS" · `assets/daily/paper-grain.webp` | **THE PREMIUM TICKET**: PAPER (ambientCG Paper001, CC0 — a 256 px crop mirror-tiled, ~49 KB; DAY cream cardstock, NIGHT the same grain tinted to the look's purple-black — `--dy-grain` soft-light / overlay), a tear-off STUB (the art + the serial **Nº MMDD** from the day key) cut off by a row of PUNCHED HOLES, the side notches kept, a lift shadow (a `::before` behind the ticket — no filter: the foil moves inside), DONE = the **ADMITTED** rubber stamp (drawn SVG: a rounded double border + the word, a displacement-filter ink edge, tilted −8°, the daily's ink; readable without colour) replacing the check circle, with a STAMP-DOWN the moment a daily is finished on this phone (scale-in + settle + an ink spread — transform / opacity; `stampNext`; reduced motion = none); NIGHT: a faint neon edge + a FOIL sheen drifting every ~7.5 s (one layer, transform only; paused while scrolling — SCROLL-PAUSE kept on purpose —, under a full card and with reduced motion). No pills, no emoji. 60 fps at 1× and 4× CPU, dpr 2, both looks (`tests/integration/daily-probe.mjs`). Credit: ☰ → CREDITS + `assets/daily/CREDITS.md` |
| `js/daily/share-today.js` | **THE SHARE IMAGE FROM THE TICKET** (1080 × 1350, the look on screen): the date ("SUN NOV 8"), THE DAILIES sign, THE SWEEP meter, each daily as a BIG ticket (the paper, the notches, the punched stub + art + serial, the name, the spoiler-free result line, the ADMITTED stamp / NOT YET with no stamp), the player's STREAK FLAME (`progress/flame-art.js`) + "N-DAY STREAK" (no row at 0), NEON SPEAKEASY + the site; composed to fill for 1–6 dailies; NO SPOILERS; the plain line unchanged. `drawToday` is async now (the grain + the art + the flame are images) |
| `css/daily.css` `.dy-cards` · `js/screens/daily.js#paintScores` | **Ben's ADD-ON (the live SCORES shot):** YOUR FRAME drawn on the strip's own box (its exact size + radius — no offset, no double edge); the empty-table hint ONCE at the foot of SCORES in the house small-caps (`FOOT_HINT`), never inside a panel; a table of ONE = the card alone, no rank (`.is-solo`; the ranks from the second finisher) |
| `css/daily.css` `body[data-daily] .music-btn` | **the DAILY screen's music button**: at the SCREEN's corner (the menus' "beside the gear" offset put it half over the sign at 430 — there is no gear here); by DAY light glass + the day text colour (the title's smoked glass read as a brown disc over the morning sky); night's colours unchanged |
| `js/audio/engine.js` · `js/audio/music.js` | **THE FADE ON LEAVING** (Ben's ADD-ON, site-wide — docs/audio.md "THE FADE ON LEAVING") |

- **Previews:** `daily-preview.html?state=swept|one&look=night|day` (THE PREMIUM TICKET; `&stamp=1` = the stamp-down on the first paint; `&corner=1` = the real
  corner music button as the title dresses it; `&solo=1` = a table of one) · `?view=share&state=swept|one&look=night|day&streak=12` (the share image at real
  size) · `coastclear-preview.html?hint=1&look=day` (the hint). The probe `tests/integration/daily-probe.mjs` saves the share CANVAS itself + measures TODAY's
  frames at 1× / 4× CPU; `admin-probe.mjs` shoots /admin → THE DAILIES as the owner on the emulators (its own server on 5179).
- **Tests:** `tests/daily-screens.test.mjs` (+ the serial, the date line, the drawn stamp) · `daily-module.test.mjs` (the budget, the flows unchanged) ·
  `coastclear.test.mjs` (+ COALESCED MOVES: order, one write, a refused slot, a repeat free, the bounds; THE DIG PATH: one transaction attempt + Server-Timing)
  · `e2e-coastclear.mjs` (+ the 150 ms line: 5 taps queued behind the one in flight, six taps in 2 calls; the dev timing + Server-Timing; THE FADE ON LEAVING's
  order) · `e2e-daily.mjs` (+ THE ONE-TIME HINT once; the frame on the strip).

## THIS WEEK'S GOAL — DONE = ONE LINE (CITY FIXES, Nov 8 — docs/harbor/passes/city-fixes.md)
- Once the SERVER has paid the week's goal (`pstats.gd` = the Eastern week key — `core/ranks.js#goalPaid`) YOUR CARD drops the goal box for ONE
  quiet line under the four stats: a drawn check · GOAL DONE · +200 XP — until next Monday's goal. Never DONE before it is paid.
- SOLO matches (THE SOLO LANE — small capped XP) never pay the goal, so they no longer FILL it: the week's solo plays are counted apart
  (`pstats.gs`, reset with the week) and come off the goal's count (`goalProgress(goal, gw, gs)` — the server step, the tile, /api/profile).
  A week's older solo plays (no `gs`): "Paid with your next room match". Paid exactly once (`tests/goal-paid.test.mjs`). Preview:
  `progress-preview.html?view=profile&goal=done|wait|half`.

## DAILY POINTS (BOARD 2.0 A, Nov 9 — docs/harbor/passes/board-2a.md; the owner's decision: "each day's result → points (the server, from its own record)")
- **THE TABLE** = `js/core/daily-points.js` (pure, a row per daily — a new daily = its row + its cartridge): the SERVER's stored score → 0–100.
  THE PASSWORD: both doors 100 − 4 × (G − 2) (100 … 60) · the first door in g, then locked out 55 − 6 × (g − 1) (55 … 25) · locked out at the first
  door 10. COAST CLEAR: cleared 100 at ≤ 0:45 → 83 at the sim's median 1:19 → 50 at 4:00 → 40 past 15:00 (a log scale from
  `scripts/sim-coastclear.mjs`) · caught 10 + up to 20 by the share of the harbor opened. A better result never fewer points; a lost day ≥ 10; not
  playing 0; a COUNTED result only.
- **Written by `dailyStep({ points })`** in THE DAILY's own transaction (`api/daily.js` → `dailyPoints(game, kept)`), on THE RUN's OWN DAY,
  idempotent: `pstats/{pid}/dp = { d (16 days), w (2 weeks), a (ALL TIME: t, n, f, l + per game) }`. The finish answers `outcome.points`.
- **THE BOARDS** `daily` (summed a day) + `daily-<game>`: THIS WEEK = the sum; ALL TIME = the average a day (`ALL_TIME_RULE` 'span' — a skipped
  day between your first + last daily-day counts 0, so skipping never helps; 'played' = the plain per-day-played average — the owner's pick),
  ranked from `MIN_DAYS` 10; YOUR average below it via `ranks`' `mine`.
- **Proof**: `tests/board-points.test.mjs` (every row, the order, skipping, 10 days, the 4 am crossing, the gate, a repeat, the back-fill, THE
  SIMULATION — `scripts/sim-board.mjs`: 40 bots × 2 weeks = the hand-computed order) + `daily-module.test.mjs` over /api.

## BOARD 2.0 B — SCORES' ALL TIME + SHARE TODAY AS ONE CARD (Nov 9 — docs/harbor/passes/board-2b.md)
- **SCORES: TODAY'S SCORES · ALL TIME** (`js/screens/daily.js#paintAllTime`): per daily, YOUR TABLE · AVERAGE A DAY from `/api/daily points` (once a
  visit — `today-logic.js#allTimeRows` / `allTimeLine`, PURE: ranked from MIN_DAYS 10, ties share a place; YOU below: "3 MORE DAYS TO BE RANKED ·
  YOUR AVERAGE 83.3"; a friend below: "7 OF 10 DAYS · 95.0 AVG") as slim cards, then EVERYONE · ALL TIME (the daily's board's top 3) + SEE THE FULL
  BOARD › (THE BOARD → DAILIES · ALL TIME on that daily). Proof: `tests/daily-alltime.test.mjs`, `e2e-daily`.
- **SHARE TODAY = ONE CARD FROM EACH DAILY's OWN PIECES** (the owner's add-on — `js/daily/share-today.js`): ONE header (the date + the flame), a
  section per FINISHED daily drawn by its own `share.js#paintSection` (the same exported pieces its own card calls — pixel-identical:
  `tests/integration/share-same.html`), "NOT YET: <name>" once, ONE foot (NEONSPEAKEASY.COM); one daily = its own card. A NEW daily: export its
  pieces + a `paintSection` (+ `SECTION_H`) + a row in `share-today.js#SECTIONS` + its server cart's `share()` (spoiler-free) — without them it gets
  its name + its result line. The data: `today { share: true }` (the SHARE TODAY tap only) → each finished run's spoiler-free inputs from the
  SERVER's record (THE PASSWORD: `logic.js#shareRunOf` — marks + counts, never a word; COAST CLEAR: `shareInputs` — no board).
- **THE SHARE CARDS — NO PILLS (SKINS 2A) + THE ONE RULE (SKINS 2B) — Nov 14, the owner's rules; docs/games/passes/skins-2a.md + skins-2b.md:**
  **THE FOOT** of EVERY share card = ONE painter, `js/daily/share.js#shareAddress`: ONE straight thin neon line + NEONSPEAKEASY.COM in plain
  neon lettering (navy by day) — no frame, no rounded shape (SHARE TODAY's tube capsule is gone); each daily's own card (`shareFoot` = a small
  dim "Nº n" + it — the name is on a card ONCE, never again in the foot) and SHARE YOUR RUN's card (`games/kit/share-run.js`) draw the same.
  **FIXES R3 (Nov 16 — the owner, Nov 15): "ONE big SCORE = the daily's MAIN MEASURE"** — each DAILIES row declares `measure` ('guesses' |
  'time'; `share.js#measureOf`, 'time' when none — a future daily declares its own): **THE PASSWORD's big line = its GUESSES** ("8 GUESSES",
  `password/share.js#bigOf` through `paintBig`, which now takes a `fitW` and shrinks a long word line to the column) and its **TIME is the one
  grey stat line**; COAST CLEAR + THE DROP keep their time big. The share-card preview + the tappable link's picture follow (the phone builds the
  card — THE CARD IS BUILT BEFORE THE TAP). `tests/share-rhythm.test.mjs` (the measure test) · share-same 60 / 60 (`_old/pw-share.js` re-taken ON
  PURPOSE) · shots `Downloads/NEON/fixes-r3/share-today-{night,day}-390x844.png`.
  **THE ONE RULE (SKINS 2B, Nov 14 — the owner, from a mockup + his 11:16 am add-on; it replaces SKINS 2A's "the name or the win word" —
  docs/games/passes/skins-2b.md)** (`share.js#RHYTHM`): every SHARE TODAY section = (1) **THE NAME** — the daily's own name, the SAME small
  size for all, and **IT CARRIES THE RESULT**: a clean GREEN neon when the run was made, RED when it failed (a modest glow — never a blazing
  headline), WHITE for a daily with no win / lose (THE DROP); no win word (no WELCOME IN), no name-swap, no CAUGHT / LOCKED OUT word anywhere
  · (2) **ONE big TIME**, white, the same size for all (84 px — 2:54 · 2:12 · 2:38.9; a caught / locked-out run's time too) · (3) **ONE grey
  stat line** (5 GUESSES · 1 SPOTTED · +30 s · 101 LINES) · (4) **ONE art strip** (145 tall) — the SAME sizes + even gaps in every section,
  centred in one column (`RHYTHM.COL`); `SECTION_H = RHYTHM.H`; SHARE TODAY scales every section by ONE factor (≤ 1.45×). **The three text
  pieces are the KIT's painters — `paintName(c, look, name, cx, y, px, fitW, result)` (`MADE` | `FAILED` | none; `INK` = the colours, the
  day's green / red / navy in the day palette; the night's green = the page's `--good`) · `paintBig` · `paintStat`** — a daily never draws
  its own sign or headline. A daily's OWN card keeps the same order + the same painters (`share.js#OWN`). The strips: THE PASSWORD = THE TILES
  ONLY, bigger (≤ `TILE_MAX` 46 a cell — no doors; its own card keeps the doors + their names); COAST CLEAR = the three lamps, as tall as
  the strip (a caught run: its time is read off the end of its line — `coastclear/share.js#partsOf`, PURE; the server's inputs are
  unchanged); THE DROP = a crop of the board's top 8 rows, the junk SOLID. A NEW daily's `paintSection` reads `RHYTHM` for every size and
  calls the three painters (`tests/share-rhythm.test.mjs` checks it). `share-same.html` (run it: `node tests/integration/share-same.mjs
  "<browser>"`): the expected copies (`tests/integration/_old/pw-share.js` + `cc-share.js`) were RE-TAKEN ON PURPOSE with this pass's cards
  + the name check (all made / one failed / both failed, both looks) — 35 rows.
  **THE PASSWORD's ADD-ON (Ben, Nov 14 11:25 am):** on its OWN card each room = ONE centred column — its small door + its label stacked
  and centred over ITS OWN grid, the two columns TOP-ALIGNED, the pair centred, an even gap (`password/share.js#paintRooms` + `ROOMS`; a
  room never played = its door + label alone; a held room's door + label stay red). In SHARE TODAY its tiles never shrink under a FLOOR
  (`TILE_FLOOR` — 22 px ON THE CARD at any section scale): a tall grid makes ITS strip grow (`stripOf` / `sectionH`, PURE) —
  **readability beats equal strip heights**. So SHARE TODAY fits ONE scale to the SUM of the sections' natural heights (a daily may
  export `sectionH(input)`; default `RHYTHM.H`), shares the spare room evenly and records where each section sits (`cv.sections` — the
  look checks read it). share-same = **39 rows** (+ the floor, the grown section, short grids unchanged, the card still ends above the foot).
  **BALANCED (PD-4's Group 0 — the owner, Nov 9, his real share in a text thread):** the sections share ALL the height between the header and the
  foot, each handed its whole box (`paintSection(c, { W, H })` centres its block in it; under `SECTION_H` it is scaled); the header + each wordmark
  ~1.4×; THE PASSWORD centred — the result + the line on top, the two grids side by side (cell ≤ 56), each headed by its small drawn door
  (`paintDoor` — no door names on the combined card; BESIDE the grid for a run over 3 rows); COAST CLEAR's result + big time a centred pair, the
  searchlights ~2× under them. THE BAR: at a 360-px downscale the grid colours, the time, the streak line + the address read
  (`daily-probe.mjs SHARE_ONLY=1` saves both sizes; docs/harbor/passes/pd-4.md).

## FR7 FIXES A (Nov 12 2026 — docs/harbor/passes/fr7-fixes-a.md; the owner's decisions: plan.md "OWNER'S NOTES — NOV 12")
- **THE DAILY CEILING** (decision 2 — the win farms, FR7-A C2 + FR7-B HE3): `core/progress.js#matchStep` — past `DAILY_CEILING` (20) counted ROOM
  matches in an Eastern day (all games together; `pstats.day.n`) a match is still counted once (`m`, the 45 s gap's clock) but pays 0 XP and moves no
  board (no win, no record, no counter, no counted play) — the end-of-round moment's ONE line `CEILING_LINE` ("TODAY'S LIMIT · XP AGAIN AFTER 4 AM");
  the outcome carries `cap: true`. A solo run (its own cap, 4 a day) and the dailies (DAILY XP) are separate. A real game night never meets it.
- **THE RESET EPOCH** (FR7-A E1): THE PROGRESS RESET stamps `progress/resetAt` (server-only — the root deny) in its own update; the backup keeps the
  epoch before it and a RESTORE puts that back. THE BACK-FILL rebuilds THE BOARDS only from what came after it (`core/board-fill.js#sinceReset` — a
  match record with `at` ≥ the epoch, a daily run STARTED ≥ it); its preview says "only since THE RESET of …". COUNTED PLAYS (who is listed) still read
  every record — E4 (veterans listed again at once) stays the owner's decision. The back-fill may now be pressed before OR after the reset.
- **DY4 — LEARN IT ON A THROWAWAY, PLAY IT FOR REAL: ACCEPTED** (decision 3): every same-for-everyone daily word game has it; THE THROWAWAY GATE already
  keeps a same-day profile from ranking, scoring or earning (the reveal it sees is the price). No code.
- **COAST CLEAR — THE ROOM'S PAUSE DOESN'T COUNT** (decision 4): a pause THE ROOM WINS forces (checked by the server) is a room pause (`p.r`) — outside
  `MAX_PAUSES` / `PAUSE_CAP_MS`, under its own safety bound (12 a run, 3 h stopped in all): "YOUR DAILY IS SAVED" is true through a long HOLD'EM match.

## FR7 FIXES B (Nov 12 — docs/harbor/passes/fr7-fixes-b.md)
- **The reset:** `cp` (counted plays) is a reset field now (`core/reset.js#RESET_STATS` — the dry run's line names them); the freezes held survive into
  the first play after it (`core/streak.js`); the founder sweep runs only while the window is open.
- **SIGHTINGS NEED THE CITY OPEN:** a SKY claim counts only inside the server's city-open stamp `ppriv/{pid}/co` (`core/sightings.js#cityOpenAt` /
  `#openStep` — written by `radioHello`, the visible city's own ~2-minute call, + a hello on coming back on screen); `QUEUE_MS` 12 h → 15 min. A speed
  bump, not a seal (a script keeping the hello going still can). The radio's claims keep their own record.
- **THE QUEUE + THE STAMP AGREE (the urgent add-on):** `CITY_GAP_MS` = `QUEUE_MS` = 15 min (a hello after an outage extends the same opening); a claim the
  stamp hasn't reached answers `no_stamp` — the phone keeps it (`profile/sightings.js`, 15 min) and retries on `online` + after the city's next hello.

## THE ONE DAY LINE (FR7 FIXES C, Nov 13 — Grok's PROGRESSION + CALENDAR review, Nov 12, honest players; docs/harbor/passes/fr7-fixes-c.md)

ONE line for everything a play is credited on: **the 4:00 AM America/New_York streak day of the play's OWN time.**

- **THE 4 AM LINE IS WALL CLOCK (M3):** `core/week.js#turnAt(dk)` = the instant 4:00 am Eastern reads on that date (08:00 UTC in summer
  time, 09:00 in winter; on a DST day the one whose clock really reads 4:00 — it always exists, the clocks change at 2 am); `turnDay(ms)` /
  `core/streak.js#streakDay` = the day of an instant against it; `dayStartAt = turnAt`. The old `dayKey(ms − 4 h)` turned at 5:00 am EDT the
  day the clocks spring forward (Sun Mar 14 2027: 4–5 am still Saturday) and at 3:00 am EST the day they fall back (Nov 1 2026 · Nov 7 2027).
  The dailies' countdown (`js/daily/clock.js#msToTurn(instant)`) + THE 4 AM TURN (`today.js#armTurn`) = the next day's start − now.
  Tests: `tests/one-day-line.test.mjs` (every half hour midnight → 6:30 am on Nov 1 2026, Mar 14 2027, Nov 7 2027 + two plain days; the table
  re-run in child processes with `TZ=UTC`, `TZ=America/Los_Angeles` and TZ unset).
- **A MATCH IS CREDITED BY ITS MATCH TIME (M1):** `api/report.js` passes `at = min(night.at, now)` (night.at is the rules' `=== now` — the
  server's stamp when the host wrote `final`); the dealer passes `min(rec.m.endAt, now)`. `api/_lib/stats.js#applyMatch(key, ex, pids, now,
  room, at)` → `core/progress.js#matchStep({ …, now, at })`: the streak day, the week, THE DAILY CEILING, NEW GAME TONIGHT + VARIETY, the solo
  cap, the tie-break time, the achievements' facts (hour, party, holiday) and every board path are the MATCH's; `now` stays the report's clock
  for the 45 s gap + the keys' order. **A match that finished before `progress/resetAt` is refused** on BOTH paths, before anything is counted:
  `results/{key}` sealed `{ st: 'done', pre: 1 }` (never retried), the phone told `status: 'before_reset'` (no outcome — quiet); the dealer's
  table gets `rep: 'skipped'`. **The phone's queue** (`js/profile/queue.js`) no longer drops a report by its own clock (it did at 5 h — under
  the server's 6 h: a phone offline 10 pm → 9 am lost its match); an item goes only on the server's answer (`too_old`, `before_reset`, counted).
- **TWO DAY BOXES (M1 + M2):** `pstats.day` = the newest streak day's counters `{ k, g, so?, n? }`, `pstats.pd` = the day before's (a late report
  for yesterday is capped + counted on ITS day — never resets today's; `pd` is in `reset.js#RESET_STATS`).
- **THE CEILING + THE BONUSES ON THE STREAK DAY (M2):** THE DAILY CEILING, NEW GAME TONIGHT (+25), VARIETY (+10) + the solo cap turn at 4 am, not
  midnight; **a capped match still marks the streak** (`ceilingStep` calls `playDay` — 0 XP, no board, no counted play, the streak's own
  milestones as on any play).
- **A REPORT THE GAP SKIPPED WAITS (M4):** an outcome skipped `too_soon` (or a transaction that didn't commit — `stats.js#RETRY_SKIPS`) means the
  result is NOT done: `results/{key}` = `{ st: 'retry', o }` (the outcomes so far — a claim keeps them; `stats.js#mergeOutcomes` keeps a credited
  player's first outcome over its 'counted' skip), the phone gets `{ ok: false, code: 'too_soon', retry: true, retryAfter }` (425) and the queue
  resends after it (+ a little jitter; at most `RETRY_MAX` 8 — bounded, never a loop). The dealer: the same record, `rep` left unset → the next poke.
- **THE WEEK TURNS WITH THE DAY (S1):** `core/week.js#weekKey` = the Monday of the 4 am day — a week runs **Monday 4:00 am → Monday 4:00 am
  Eastern** (it was Monday 00:00 while the streak + the dailies stayed on Sunday until 4 am); `weekEndsAt` = the next Monday 4 am. So the weekly
  goal, `gw` / `gs`, `xw`, the weekly records + the weekly board paths are the match's week; a match of the week BEFORE the stats' week (a late
  report across the line) never resets this week's counters, never replaces this week's record, and its XP goes to **`xw.p`** (the week before,
  `{ wk, x }` — `payXp`; `core/overall.js` writes its board row too). A daily's XP is paid on its RUN's week (`payXp(…, dayStartAt(day))`), like
  its points (`daily-points.js#weekOfDay`).
- **PENTHOUSE RE-RANKS A CLOSED DAY (S2):** a COUNTING finish on a day already closed (a run started before 4 am, finished after the close ran)
  calls `api/_lib/daily-close.js#recloseDay` — the day's counting finishers ranked once more; `penthouseStep` is idempotent, the marker's `w` the
  UNION: it can only ADD a PENTHOUSE (the late 50th finisher opening the day), never take one away.
- **WIN IT BACK PAYS ONLY ABOVE THE LOST RUN (S3):** `streak.js#finish` — on a restore the milestones are those between the LOST run (`ev.restored.lost`)
  and the new length; a 100+ night run broken + won back no longer pays its milestones (+ a second FAVOR) again.
- **A DAILY STARTED BEFORE THE RESET (S4):** `api/daily.js` finish — a start before `progress/resetAt` is not paid (no stats step, out of the
  day's histogram + PENTHOUSE as a non-counting result; the answer says `pre: true`); THE BACK-FILL sets `cp` = max(live, rebuilt)
  (`api/_lib/board-fill.js`), as `filledWeek` / `filledHoldem` already did — so the back-fill is safe any time after the reset.
- **THE RESET's FREEZES SHOW (S5):** `streakView` reads `st.f` with no `st.d` (THE PROGRESS RESET keeps `st = { f }`), capped at the hold limit.

## THE DAILY MODULE — THE DROP A (Nov 13 2026 — the THIRD daily, PRISM DROP's; docs/prism.md "THE DROP"; ships OFF)
- **ONE ROW + ITS CARTRIDGE, as DM1 promised:** `config.js#DAILIES` → `drop` (theme prism, ticket drop, order 3, **`on: false`**), `SERVER_CARTS.drop`
  (`api/_lib/drop.js`), `js/games/drop/`, a `daily-points.js` row. Nothing else counts it: THE SWEEP, the XP cap, the picker + `today` follow by
  themselves once its row is on (GO LIVE only at a 4 am turn — then THE SWEEP + PERFECT WEEK need all three; the daily XP = 3 × 15 + 10).
  /board's DAILIES chips skip a row that ships OFF. `DAILY_TEST_OFF=<ids>` (the emulators + DAILY_TEST only) opens an OFF row for the tests.
- **THE GENERIC PATH GREW (api/daily.js — every daily, the old two unchanged):** a cartridge may have `begin({ record, startedAt, now, data })` (the
  start on its record inside ONE transaction — THE DROP's resume costs a pause there), `stash({ body, base, pid })` (an upload's own data written
  beside the record, in parallel with the move's reads — THE DROP's log chunk), an ASYNC `resume` / `verify` (they get `pid`, `base`, `T`), and
  `abandoned` / `abandon` (a run that can never come back). The single-move body now carries `at` · `add` · `k` · `fin`; the moves list adds
  `checkpoint` + `ppause`. **`finish` = `finishRun()`** (the case's body moved unchanged) — shared with **`settleRun()`**: an abandoned (or ended,
  never finished) run scored at its last checkpoint by the player's next `today` and by **THE DAY'S CLOSE's sweep** (`daily-close.js#sweepRuns` —
  yesterday's that can't come back; the day before's, whose run window is over, all; a memo per warm function).
- **THE PRUNE (the add-on — the cost check):** a cartridge's optional `prune({ day, back, now })` — `sweepRuns` calls it for the days 2 … 9 back
  (a memo per warm function; THE DROP's own `pr` marker makes each step once): only what the boards + the anti-cheat need is kept.
- **THE PROGRESS RESET** clears THE DROP like the others (its points in `dp`, its board in `lb/`, a run started before the reset never paid — S4);
  `daily-drop.test.mjs` proves it.

## THE DAILY MODULE — THE DROP B (Nov 13 2026 — THE SCHEDULED GO-LIVE, TODAY with three, SHARE TODAY for three; docs/games/passes/drop-b.md)
- **THE SCHEDULED GO-LIVE** (Ben, Nov 13 — he won't stay up for 4 am): **/admin → THE DAILIES → the row's GO LIVE AT THE NEXT 4 AM** (owner only, a
  confirm tap — TAP AGAIN TO CONFIRM; audited `dailyGoLive`) → `progress/dlive/{id}` = `{ from: <the next streak day>, at, by }` (server-only — the
  rules' default deny; `api/admin.js` `dailySchedule { game, cancel? }` → `api/_lib/dailies.js#scheduleDaily`). The daily opens **by itself at that
  day's 4 am turn**, never mid-day: `core/daily.js#rowOpenOn(row, sched, day)` compares DAY KEYS (an ON row always; an OFF row from its `from`); the
  switch + the schedule are cached 30 s, the day comes from each call's clock, so the turn is exact. **CANCEL** only before its day (409
  `already_live` after — never mid-day; audited `dailyGoLiveCancel`). The row reads **LIVE** / **LIVE FROM <date> 4 AM** (+ CANCEL) / **OFF** (+ the
  button); `dailiesState` lists `rows` with `state` + `from` and `next`. Plug-and-play for any `on: false` row — no code edit, no deploy. Only
  while THE GO-LIVE SWITCH is ON (it gates everything). `DAILY_TEST=1` lets the tests schedule a test-registered row.
- **THE SET OF A DAY** (`api/_lib/dailies.js#liveFor(day)`): THE SWEEP, the daily XP cap + PERFECT WEEK's run of a finish read the set of the
  RUN's day — a run that crossed 4 am into the go-live day keeps its own day's two; the day before is swept with the dailies it had, and a sweep
  already earned is never turned incomplete (`D.sw` stays). From the go-live day: three to sweep, the daily XP 3 × 15 + 10.
- **/board**: a DAILIES board's answer carries `live` — today's set (`api/board.js#liveDailyIds`, the schedule memoised a minute) — so a scheduled
  daily gets its chip without a deploy (`board/view.js` re-draws the chips when it changes).
- **TODAY with THREE tickets** (`screens/daily.js`): the meter + the rows count `t.dailies` (the server's live list); a DROP ticket's states — PLAY ·
  RESUME (in progress / yesterday's) · DONE (the time + the lines via `meta.scoreLine`, the table line, ADMITTED) — centred, nothing clipped at 390 /
  402 / 430 in Safari with its toolbars; a two-line hook balanced (`text-wrap: balance`). The inks: ONE per-id table `ticket-art.js#TICKET_INK`.
- **SHARE TODAY for THREE** (built for 1–6): THE DROP's section from its own share pieces (`games/drop/share.js#paintSection` — its board with
  every junk row SOLID + the time pair) and the server's spoiler-free `share` (async now — the run replayed once on the tap). One daily done = its
  OWN card, exactly (share-same.html: each of the three, both looks).
- Tests: `daily-module.test.mjs` (+ THE SCHEDULED GO-LIVE), `tests/daily-golive.test.mjs` (the pure rule), `admin-probe.mjs` `GOLIVE=1` (the real
  page: OFF → scheduled → cancelled).
- **SHARE TODAY — ONE NAME, ONE COLUMN** (Ben's add-on): a section whose result word IS the daily's own name shows it ONCE, coloured, in the title's
  slot (COAST CLEAR's clear); every section's content group is centred on the card's centre line inside the column the rules mark (150 px each
  side). The previews draw a REAL DROP run (`tests/integration/drop-sample.js` — the bot to its top-out, the log replayed like the server's finish).

## THE DAILY MODULE — PFIX-3: THE REFUSED FINISH + THE SHARE CARDS (Nov 14 2026 — FABLE REVIEW 2's fixes; docs/games/passes/pfix-3.md)
**A REFUSED FINISH (a cartridge's `rescue` — THE DROP's):** `api/daily.js#finishRun` — when a judged daily's `verify` refuses and the
cartridge has a `rescue`, the run is scored at the last point its own record can prove (THE DROP: docs/prism.md "PFIX-3"), the record
marked (`rf`), the refusal reported (`api/log.js#logServer` → /admin's errors, `p: 'server'`, no id), and the finish answers `rf: true`;
`today` then carries `rf: { <game>: true }` and the start of a done run `run.rf`. The phone: `today-logic.js#UNCHECKED` on the ticket. It
counts like any finish (the streak, the XP, the points of the score it could prove). A daily with no `rescue` keeps the 422.
`core/progress.js#dayCounters` never deletes the run's OWN day (a run settled two days late lost its stats step).

**THE SHARE CARDS (js/daily/share.js — the kit):**
- **THE CARD IS BUILT BEFORE THE TAP** — `prepShare(make)` → `{ warm(), ready(), send() }`: `make()` (the imports, an /api call, the
  drawing) runs when the screen OPENS; the PNG + its file are kept, the canvas freed; the tap calls `navigator.share` AT ONCE with the
  ready file. ONE send at a time. Warmed by: the DAILY screen as TODAY shows SHARE TODAY (`share-today.js#prepToday` — one build per day +
  look + streak + scores), each daily's end screen (`js/daily/end.js#endShare`), THE DROP's end card (`drop/share.js#prepDrop`).
- **NO FILE SHARING / REFUSED → THE CARD IS SHOWN** (`showCard`): a sheet with the picture + PRESS AND HOLD TO SAVE (+ a SHARE tube where
  the phone can share a file). No message over it, never a silent download.
- **LETTER-SPACING BY HAND** — `spacedText` / `spacedWidth`: every tracked line of every share card goes through them (a canvas without
  `letterSpacing` — Safari before 18.4 — draws letter by letter, as wide and as centred). No share file sets `letterSpacing` itself.
- **THE DROP's OWN CARD IS ON THE ONE RULE** (the kit's frame · the name WHITE · the big time · the stat line · the final board · the
  date over the foot). **THE PASSWORD's grids are BOTTOM-aligned in SHARE TODAY** (its own card: top-aligned columns under their labels)
  and its own card by DAY draws day doors (`door(…, look)`). **COAST CLEAR's lamps** are centred on their INK and capped by the column.
  The first section sits under the header like the mockup (`share-today.js#HEAD`). By day the streak flame has no night glow.
- **THE ART STRIP's HEIGHT IS EACH DAILY's OWN (Ben, Nov 14 eve — "make sure the PRISM DROP box is tall enough … shrink the three signal
  things a little"):** a daily's share.js may export `STRIP_H` + `sectionH()`; `share-today.js` lays the card out by each section's own
  height. THE DROP `STRIP_H` 228 (the same 8 rows, bigger cells — with all three the box is 265 × 210 px on the card; it was 177 × 138),
  COAST CLEAR 112 (the lamps ≈ 90 px tall; they were ≈ 127), THE PASSWORD the rhythm's 145 (grown for a tall grid). The name, the big
  time and the stat line keep ONE size in every section (with all three ≈ 5 % smaller than before: 36 / 76 px).
- **Proof:** `tests/share-rhythm.test.mjs` · `tests/integration/share-same.html` (59 rows; the copies in `_old/` re-taken on purpose) ·
  `e2e-daily` (the file ready before any tap, the share 0.3 ms after it, a double tap = one share, the sheet).

## THE TAPPABLE SHARE CARD (CITY E, Nov 15 2026 — docs/harbor/passes/city-e.md)
SHARE TODAY sends a **LINK** (+ the same line) whose link-preview picture IS the day's card — tapping the preview opens the site's DAILY screen.
- **A GAME's RUN CARD (JAYWALK H4B's add-on, Nov 16 — docs/jaywalk.md "THE SHARE IMAGE"):** the same function + the same rules for a
  game's SHARE MY RUN — `shareCard` with `run: { room, m }`: accepted only from a player the server's own counted result of that match
  names (`results/{ROOM}_{m}`), ONE run card a player a game a day in ITS OWN slot (`shrp/{pid}:{game}/{day}` — the day's scorecard
  keeps its own), the card stored with `k: 'run'` + `s`; its page names the game and opens the site's home. `RUN_GAMES` = JAYWALK.
- **THE PHONE** (`js/daily/share.js#prepShare` — THE CARD IS BUILT BEFORE THE TAP unchanged): `make()` may return `upload(png)` → the half-size PNG
  (`halfPng` — exactly **540 × 675**: the full 1080 × 1350 card is 365 KB – 1 MB, over the cap; the half 79 – 246 KB) is sent while the screen opens
  (`js/daily/share-today.js` → `contract.js#dailyShareCard`); `sendReady` then shares `{ url }` (FIXES R1 — the link only; one `navigator.share`, inside the tap); no
  link (the upload failed / refused) → the image + line as before. `shareAddress` + THE ONE RULE untouched.
- **THE SERVER** (`api/_lib/share-card.js`, from `api/daily.js` — no new function, no rewrite, THE WRONG DOOR holds): `POST { action: 'shareCard',
  day, games, png }` — a JUDGED finish (`dly/{g}/{day}/r/{pid}`) of EVERY named daily that day, a real PNG (magic + IHDR) at exactly 540 × 675,
  ≤ 400 KB → a server-made 12-char code; ONE card a player a day (FIXES R1: under ONE code for the day — a re-share replaces its picture). Stored server-only: `shr/{code}` = { p, d, g, n, at, img }
  · `shrx/{day}/{code}` = pid (the sweep's index) · `shrp/{pid}/{day}` = code. `GET ?s=<code>` = the preview page (og:title `<NAME> · <DAILY> ·
  <day>` — the public name, ONE daily's name or THE DAILIES, "Nov 15"; og:image `?si=`; summary_large_image; → `/?daily=1`); `GET ?si=<code>` = the PNG,
  `s-maxage` 1 h (FIXES R1 — was 7 days + immutable); an unknown / expired code → `/` (the picture → `/assets/og.jpg`). THE DAY'S CLOSE sweeps cards past 7 days
  (`sweepShares`, once a day per warm function — no idle poll). /admin → THE DAILIES → SHARE CARDS (list + delete one).
- **`/?daily=1`** (`js/app.js`): the DAILY screen opens once the city is up (never in a room); the flag dropped from the address at once.
- **Cost ≈ 3 requests a share** (the upload, the page, the picture — repeated preview fetches are edge hits). Tests: `tests/integration/share-card.test.mjs`
  + `wk-press.mjs` (SHARE TODAY = ONE share() with the link inside the touch's lift).
- **FIXES R1 (Nov 15 — THE REVIEW A2 / A4 / A5 + the owner):**
  - **THE LINK ONLY** — `sendReady` shares `{ url }` (no text: the owner — the preview carries the card); the image fallback keeps its line.
  - **ONE CARD A PLAYER A DAY, PROVEN** — THE SLOT `shrp/{pid}/{day}` is claimed in a TRANSACTION: the first upload mints the day's code, every
    other (12 at once, later waves) gets the SAME code; ≤ `SHARE_UPLOADS_A_DAY` (6) uploads a player a day (`rl/shrup:{pid}:{day}` → 429 `share_limit`).
  - **THE SAME DAY KEEPS ITS CODE** — a changed card replaces the picture under the same code (a link already sent keeps working); the same bytes
    (`shr/{code}/h` = sha256) write nothing (`{ same: true }`). The page's og:image = `?si=<code>&v=<h>` (a changed picture = a new picture URL).
  - **THE PHONE UPLOADS ONLY A CHANGED CARD** — `share.js#blobHash` + localStorage `ns:shr` = ONE entry `{ pid, day, h, url }`: a reload / a reopened
    screen shares the remembered link, nothing goes up (`wk-share-standalone.mjs` A: 1 upload over two reloads).
  - **A WHOLE PNG** — `checkPng` walks every chunk to IEND (IHDR first at 13 bytes, each CRC, an IDAT, NOTHING after IEND): a header-only "PNG" or a
    real card with a payload behind it is refused (`not_png`). Only a COUNTED finisher uploads (no `dly/{g}/{day}/x/{pid}` — THE THROWAWAY GATE → 403
    `not_counted`; the phone then shares the image, as before).
  - **THE PICTURE's EDGE CACHE = 1 HOUR** (`max-age=3600, s-maxage=3600`, no `immutable`; the page's stays 1 h). **Deleting a card (/admin → THE
    DAILIES → SHARE CARDS) stops it showing within the hour.** To stop it AT ONCE: Vercel → the project → Settings → Caches → **Purge CDN Cache**
    (or push a tagged deploy — THE EDGE CACHE keeps one copy per deploy). Chat apps that already fetched the preview keep their own copy.
  - **THE SHARE HOLD** (the owner's home-screen app reloaded after SHARE TODAY → sending it to himself): a queued catch-up reload (ONE DEPLOY AT A
    TIME) never runs at a return within 60 s of a share's start / end (`ui/lazy-import.js#reloadAtReturn` `sharedAgo`; `share.js#shareHold`
    stamps the hub `globalThis.__nsShareAt`) — `wk-share-standalone.mjs` C: on the old rule the return from the share RELOADED the page.

## EVERYONE ON SCORES (DFIX5, Nov 14 2026 — the owner: "show everyone playing the dailies, friends or not"; docs/games/passes/dfix5.md)
- **SCORES opens on EVERYONE.** Each daily's panel ("EVERYONE · TODAY") lists the day's top COUNTING finishers as slim cards (ui/strip-board.js — the
  one strip system): the rank LEFT, the card, the result under it at its right end (COAST CLEAR's spots as drawn searchlights), YOU = the lit frame,
  a FRIEND = **"LV 3 · FRIEND" in gold foil** on the card's plate (`vault/strip.js` `friend` — the plate may run to the gem for it); the top 10,
  then — you below them — one more row with your place (a dashed rule above it); **SHOW ALL n** (up to 50); "NO ONE HAS FINISHED YET"; the scores
  only once YOU have finished that daily ("Play it to see their scores" — YOUR TABLE's rule); the TOP x% OF EVERYONE line at the foot (n ≥ 50).
- **THE FRIENDS BOX** — the scope row = the TODAY'S SCORES / ALL TIME switch (unchanged) on the left + a drawn square ☐ FRIENDS on the right (the
  ink's outline, a white tick on blue when checked, the house small caps, a 44 pt tap; it wraps under the switch if the row can't hold both).
  **Unchecked on every visit** (never remembered). Checked → every list narrows to YOUR TABLE ("YOUR FRIENDS · TODAY" — DFIX2's view, no FRIEND
  word, STILL TO PLAY; ALL TIME "YOUR FRIENDS · AVERAGE A DAY"); no friends → the foot hint (ADD FRIENDS BY THEIR NAME TAG).
- **ALL TIME, unchecked** = the daily's ALL TIME board: its top 10 (friends marked by their BOARD ids — `/api/daily points` returns `ids: { me, f }`,
  HMACs that name nobody — never a pid) + YOU (your place below the 10, or "3 MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3") + SEE THE FULL BOARD ›.
  The ten-days rule + the average a day unchanged.
- **TODAY's ticket line = the everyone place: "4TH OF 12 TODAY"** (`core/every.js#everyPlaceLine`; `today.place` — exact inside the kept top, the
  histogram's "strictly better + 1" past it); a same-day profile keeps YOUR SCORE COUNTS FROM TOMORROW.
- **THE SERVER — a cheap per-day aggregate, never a scan per request:** `dly/{game}/{day}/t` = the day's top 50 counting finishers (`{ v, rows: [{ k,
  s, at?, e? }] }`), ONE transaction per COUNTING finish (`api/_lib/every.js#addTop` from `finishRun`; a failure never fails the finish). THE ORDER
  (`core/every.js#cmpRows`): the daily's stored number by its `better`; a TIE → the EARLIER finish (THE PASSWORD — no timer added); THE DROP by
  its packed number automatically; a row from before the pass (no `at`) after the timed ones. A day with finishers but no node is built ONCE from
  `r/` − `x/` (`ensureTop`). THE THROWAWAY GATE: a same-day profile / a pre-reset run is never in it and never counts in "OF n".
- **`/api/daily every { all? }`** (the SCORES screen — once a visit, again when one of YOUR results changes; `all` = the dailies whose SHOW ALL is
  open): per live daily `{ n, played, rows: [public face + rank + v? + e? + me? + f?], me?, more }` — a public face = the board row's own keys
  (`lb.js#publicFaces` — the board id + the username, rude names → the house nickname; a HIDDEN profile left out, the places never re-ranked);
  never a pid. `today` gains `place` + `extra` (your spots) + a friend's `e` once you've played. Works for 1–6 dailies.
- **BEFORE PUBLIC:** the everyone lists are a cheater target (a throwaway can see the day's results) — harden or limit them before the site goes public.

## DAILY BEST (DAILY A, Nov 18 2026 — docs/games/passes/daily-a.md; the owner: "DAILY BEST for all four dailies, kept on the server, backfilled")
A player's best result EVER per daily — `pstats/{pid}/db/{game}` = `{ s, day, at, p? (the best from an EARLIER day it beat), bf? (backfilled) }`
— written ONLY by the server, inside THE DAILY's own stats transaction (api/daily.js#finishRun — the same one that pays the streak + the XP;
a JAYWALK better try: #raiseRun's), read by its owner with the rest of pstats. ONE pure table (`js/core/daily-best.js#BEST_RULES` — a new
daily = its row; `tests/daily-best.test.mjs` checks every DAILIES row has one):
- THE PASSWORD = fewest guesses — a LOCKOUT never counts (a score ≥ 100) · COAST CLEAR = the fastest CLEAR — CAUGHT never counts (≥ 10000) ·
  THE DROP = the longest time (the lines break a tie) · JAYWALK = the most lanes, the earlier tick on a tie.
- A non-counting result (THE THROWAWAY GATE) still sets the player's OWN best (it is theirs — not a reward); a run before THE PROGRESS RESET
  never does (no stats step runs for it).
- **The phone gets** `{ best: { s, day }, newBest, first }` — on every finish (for its daily) and in `today.best[game]` for every live daily.
  `newBest` = today's result beat a best from an EARLIER day (beating your own first JAYWALK try the same day is not new); `first` = the first
  best ever was set today. DAILY B draws "DAILY BEST · …" + the gold NEW DAILY BEST. `today` already carried the place + the day's players
  (`place: { game: { p, n } }` — "2ND OF 5 PLAYERS").
- **THE BACKFILL** (`/admin` → THE DAILIES → DAILY BEST · PREVIEW, then a second tap; `api/_lib/daily-best-fill.js`, audited
  `dailyBestBackfill`): every kept day's scores (`dly/{game}/{day}/r` — kept for good) from `d20261101` (the first daily day) or THE PROGRESS
  RESET's day, whichever is later (THE ONE DAY LINE) → each player's best merged by the rule in ONE transaction (a better stored best stays —
  SAFE TWICE; a removed profile is skipped). The preview names, per daily, the days with NOTHING kept (no plays, or `dailyFresh` wiped them).
- Proven: `tests/daily-best.test.mjs` · `tests/integration/daily-jaywalk.test.mjs` "DAILY BEST".

## DAILY B — THE TICKETS + THE SWEEP METER (Nov 18 2026 — docs/games/passes/daily-b.md; the owner's decisions: docs/games/plan.md "DAILY A / B" + "DAILY B")
ONE pure rule per ticket — `js/daily/today-logic.js#ticketState(today, row, { lineOf, done })` — drawn by the SHARED ticket (js/screens/daily.js
#ticketRow — every daily, no special path):
- **BEFORE** (PLAY / RESUME): "DAILY BEST · <value>" in the ticket's OWN ink (`.dy-best`) once the player has a best from an EARLIER day — the
  value in the daily's measure (`bestLine`: "4 GUESSES" · "1:12" · THE DROP's time alone "3:41" · "168 LANES"); no best yet → the hook.
- **DONE** (the ADMITTED stamp): the result + the PLACE ("2ND OF 5 PLAYERS" — `placeLine`, from `today.place`) — or, when today's result beat
  an EARLIER day's best (`newBest`), the gold NEW DAILY BEST in its place (`.dy-gold` — foil TEXT, never a pill). The very first best (`first`)
  is never gold. COUNTS FROM TOMORROW · THIS RUN COULDN'T BE CHECKED win over both.
- **A `tries` daily** (JAYWALK): BETWEEN TRIES = the LAST try big + "DAILY BEST · …" + TRY AGAIN with "n TRIES LEFT" under it; ADMITTED only
  once no try is left or the player tapped DONE (per phone, per day — `today.js#markTriesDone`); a try still open is never ADMITTED. (J3 — a row with `allDay` — JAYWALK: THREE TRIES ALL DAY — has no DONE: between tries all day from the server's tries, ADMITTED only after the last one; docs/jaywalk.md "J3".) THE ROOM
  WINS: "TRY ENDED · N TRIES LEFT" (`tryEndedLine`), nothing held. → docs/jaywalk.md "THE DAILY — THE PHONE HALF".
- **THE SWEEP METER**: one segment per LIVE daily (the owner: 3 until JAYWALK goes live, then 4), each lit in ITS ticket's ink (`--sk` from
  `TICKET_INK`, both looks); the meter IS the count — the "1 OF 3" words are gone (THE SWEEP · SWEPT stays its name).
- **4 TICKETS FIT** at 375 × 667 · 390 × 844 · 430 × 932, both looks, with the header + THE SWEEP: at 375 pt (≤ 380) the shared ticket tightens (a
  60 px stub, a slimmer PLAY) and from 4 rows (`.dy-rows.is-many`) the rows sit closer; a DAILY BEST line wraps only BEFORE its value. Proven:
  e2e-jaywalk-daily-run.mjs's FIT checks (every ticket state, the 4th ticket's bottom inside the screen, nothing clipped).
- **SHARE TODAY** lays out 1–6 sections evenly (unchanged) — JAYWALK's is `js/games/jaywalk/daily-share.js`; the plain line names a tries daily
  "JAYWALK · BEST OF 3 · 143 lanes" (`shareTodayLine`).
- Proven: `tests/daily-b.test.mjs` · `tests/integration/e2e-jaywalk-daily-run.mjs` · the preview page `daily-preview.html` (`&jw=` · `&best=1`
  · `&gold=<id>` · `&first=<id>`).


## DAILY FIX — THE TICKET + SHARE POLISH (Nov 18 2026 — docs/games/passes/daily-fix.md; the owner's decisions: docs/games/plan.md "DAILY FIX")
- **LAST TRY ·** — JAYWALK between tries: the big line is `today-logic.js#ticketState`'s "LAST TRY · 143 LANES" (`LAST_TRY`) — ONE line
  (`.dy-result.is-last`: the label 10 px quiet, the lanes 15 px; "LAST TRY · 888 LANES" fits at 375 with 7 px to spare — the FIT checks
  in `e2e-jaywalk-daily-run.mjs` include it: `daily-preview.html?…&jw=between&jwlast=888&jwbest=888`). DAILY BEST under it, TRY AGAIN +
  "N TRIES LEFT" on the right; ADMITTED keeps the BEST try as its result.
- **SAVE YOUR KEY waits off THE DAILIES screen** — `keypop.js#KEYPOP_COVERED` names `.dy-overlay:not(.screen-out)` (the screen AND a run);
  asked while it's up → it waits (the 2.5 s re-ask) and shows once the player has left it — still ONCE (e2e-daily's SAVE YOUR KEY case).
- **PLAY IN ITS TICKET's INK** — every ticket's PLAY / RESUME / TRY AGAIN is a tube of `--tk` (the ticket's `TICKET_INK`, night ink at night,
  day ink by day — css/daily.css "PLAY IN ITS TICKET's INK"): white letters on the dark tube at night; by day the letters = the ink 55 %
  toward #0b1630 (≥ 4.5:1 on the light tube for every ink — `tests/daily-fix.test.mjs`). No pink MAIN on TODAY any more (the reviewer's #10).
- **THE SERIAL** reads: 10 px, night rgba(232,228,250,.84) · day #3a4f75 (≥ 4.5:1 on its paper). **THE PASSWORD's DAY STAMP**: its own
  deeper ink `TICKET_INK.password.stampDay` (#1450c0 — `stampInkOf`, the `--tksd` var) at full ink + a heavier outer edge; night unchanged.
- **THE SHARE CARD AT 360** — THE 360 FLOOR (`share.js#SMALL_MIN` = 30 card px ≈ 10 px at a 360-px downscale): `paintName` + `paintStat`
  never draw below it whatever a section's scale (`floorPx` — a 4-section card's ×0.63 lifted the stat lines from ≈ 6.7 px to 10 px at 360);
  a 1- or 2-section card / a daily's own card keeps its sizes exactly. The section rules: 4 px in a firmer ink (night 34 %, day 40 %) —
  visible at 360. The reviewer's "vertical hairlines at x≈280 / 800" were the preview page's desktop column frame drawn over the card
  (`#stage::before / ::after`) — never in the PNG; the preview hides it now.
- **A ticket result wraps only between its parts** (`daily.js#resultEl` — "2:38.9 ·" / "101 LINES", never "101" / "LINES").

## HIGH RISE DAILY B — THE RECOLOUR · THE BIG FIVE · THE SCHEDULED GO-LIVE IN CODE (Nov 21 2026 — docs/games/passes/highrise-daily-b.md; the owner's decisions: docs/games/plan.md "HIGH RISE DAILY B"; HIGH RISE's own screens: docs/highrise.md "THE DAILY — THE SCREENS + GO LIVE")
- **THE RECOLOUR** (`ticket-art.js#TICKET_INK` — the ONE ink table: the ticket's edge + holes + art + stamp, its PLAY tube, its SWEEP segment,
  its SCORES panel, its BIG FIVE name): THE PASSWORD pink / blue (unchanged) · COAST CLEAR alien green `#9cff7a` / `#2e9a2a` (was cyan — its
  game's touch pulse follows: css/coastclear.css `--cc-touch`) · THE DROP purple `#a77bff` at night too / `#6a3fd0` (was PRISM's white; its
  pale stamp ink went with it) · JAYWALK RED `#ff4058` / `#d01f35` (was the orange — its share card's best bar + its daily end card follow) ·
  HIGH RISE electric blue `#4fd6ff` / teal `#007f9e`. WHITE stays free for a future daily (a unit test: no night ink near white; every pair
  far apart in both looks). THE NIGHT PAIR (THE PASSWORD's pink beside JAYWALK's red at real size): told apart — `#ff4058` kept.
- **THE MARK ART** (`ticket-art.js#markArt`): JAYWALK + HIGH RISE tickets draw the GAME's OWN MARK (`core/marks.js`) in its OWN colours
  (`--mc` / `--md`, css/daily.css `.mk`; a near-white tube navy by day — `markDay`; the mark's own tube width `--msw`); the other three keep
  their ink art.
- **THE BIG FIVE** (`share-today.js` — a NEW rule): 5 OR MORE dailies FINISHED → SHARE TODAY is TEXT ONLY — each section = the NAME in its
  TICKET's ink (a glow at night: `share.js#paintName`'s `ink`) · the big result · ONE stat line (each cartridge's share module exports
  `fiveLine(input) → { big, stat }`: "5 GUESSES" / "2:54" · "2:18" / "1 SPOTTED" · "2:38.9" / "101 LINES" · "143 LANES" / "BEST OF 3" · "84 FLOORS"
  / "ONE SHOT · 32 PERFECTS"; a failed run's fail word big — LOCKED OUT · CAUGHT; a daily with none → its result line); no art strips, no rules
  between sections. `FIVE` = the 196-unit box (name 70 at y 24 · big 126 at y 106 · stat 46 at y 178), 16 between, `fiveLayout` scales to fit
  (×0.91 at 5 under the streak header — never up); the header + the foot unchanged; THE 360 FLOOR holds (a unit test, 5 + 6). 4 or fewer =
  EXACTLY the card before it (share-same.html against `_old/share-today-dailyb.js`).
- **THE SCHEDULED GO-LIVE IN CODE** (`core/daily.js#schedOf`): a DAILIES row may carry `liveFrom: 'dYYYYMMDD'` — opened at that day's 4 am
  turn exactly like THE DROP B's `progress/dlive` schedule (which wins where both exist); set by the pass that ships the daily to the first
  4 am after its deploy — no /admin step (HIGH RISE: d20261122). /admin lists it as scheduled "set by the deploy", with no CANCEL.
- **5 TICKETS FIT** (`tests/integration/kit/daily-fit.mjs`, in e2e-daily + e2e-jaywalk-daily-run): 390 × 844 + 430 × 932 — the header, THE
  SWEEP (5), all five tickets, SHARE TODAY + the countdown with NO scroll, both looks, every ticket state; 375 × 667 may scroll (nothing clipped).
## THE RULES FROM CLAUDE.md (moved Nov 13)

THE CLAUDE.md DIET (FR7 FIXES C, Nov 13): CLAUDE.md keeps ONE line per rule with a pointer here; the full text it held for this area
is below, VERBATIM (as of `48e3e157`). New detail goes in the sections above, not back into CLAUDE.md.

### The doc table row

| `docs/progression.md` | PROGRESSION (A + B, Nov 2): levels 1–100, the streak + freezes + WIN IT BACK, the items + THE LEVEL REWARDS, the 41 achievements + the award engine, the daily contract (`/api/daily`), FOUNDER, the end-of-round moment, the Gilded card + profile, THE BIG FLAME, `?preview=`; CITY SIGHTINGS (the tap → the reaction → the real polaroid → the pair, server-verified; a NEW legendary plugs in there), THE ALBUM, BIRTHDAYS, CALL IN A FAVOR |

### PROGRESSION

- **PROGRESSION (docs/progression.md):** XP, levels, the streak, items, achievements, X% counts + FOUNDER are written by the SERVER only (one
  transaction per match / daily / event through the PURE steps in `core/progress.js`); collections show ONLY what a player owns (no ???, no totals).
  Clients never write boards, stats, XP or ranks (server-only in the rules); board ids use dashes (`cipher-score`), never dots.

### FR7 FIXES A (the whole bullet — HOST-GRADED OVERCLOCK, THE DAILY CEILING, THE RESET EPOCH, END GAME THROUGH THE DEALER, the add-ons)

- **FR7 FIXES A (Nov 12 — docs/harbor/passes/fr7-fixes-a.md):** **HOST-GRADED OVERCLOCK** — the phones seal their picks (`seal/…/a`), the host
  re-grades them after the unseal (`overclock/grade.js`; the phone's `ok` only lowers it; THE HUMAN FLOOR → no speed bonus + `fl`, no REDLINE); **THE
  DAILY CEILING** — past 20 counted room matches an Eastern day a match pays 0 XP + moves no board (`core/progress.js#matchStep`, `CEILING_LINE`);
  **THE RESET EPOCH** — THE PROGRESS RESET stamps `progress/resetAt`, the back-fill rebuilds only after it (`core/board-fill.js#sinceReset`); **END
  GAME THROUGH THE DEALER** — HOLD'EM's ☰ END GAME = the dealer's `endGame` (places by chips from 3 hands, else NO RESULT — `match.js#endTournament`).
  Add-ons: **`api()` under ONE time limit** (token + fetch + body — a lock waiting on it always lets go; HOLD'EM's move lock + its 10 s release);
  **THE LOST LOOK** — a canvas iOS discarded in the background (a lost context / the bake's blank sentinel) → the dark held → the one re-fit path (docs/harbor.md#performance).

### THE DAILIES — DFIX1 + THE DAILY MODULE (DM1, DM2, DFIX2, DFIX3)

- **THE DAILIES — DFIX1 (FABLE REVIEW #1's fix pass — docs/games/review-dailies-1.md):** A RUN KEEPS ITS OWN DAY — every daily call after `start` carries the
  `day` it returned (`js/daily/run-day.js`; the server takes today's or yesterday's with a start there — `api/daily.js#dayOfCall`), so a run crossing 4 am
  Eastern finishes on its day; COAST CLEAR's PAUSE CAPS (3 a run, 20 min in all — `logic.js#MAX_PAUSES` / `PAUSE_CAP_MS`); ONE daily sound engine with THE
  FIRST-TAP CATCH (`js/daily/sfx.js` — a game's sfx.js is its table); a move a daily doesn't own → 400, never a 500. Left for THE DAILY MODULE: the throwaway
  gate (a daily counts only for a profile older than that day's 4 am), the IP limit on new profiles, the shared `js/daily/` kit, the schedule freeze.
- **THE DAILY MODULE — DM1: THE ENGINE (docs/progression.md "THE DAILY MODULE"):** PLUG-AND-PLAY — `config.js#DAILIES` is the ONE list (no fixed count
  anywhere: THE SWEEP = every daily on `core/daily.js#todaysDailies`, the DAILY XP 15 a daily capped by the list, `today`'s rows); a new daily = its cartridge
  (+ its server half in `api/_lib/dailies.js#SERVER_CARTS`) + ONE row. THE 4 AM PICKER stores each day once; THE PASSWORD's FROZEN SCHEDULE + every stored day +
  THE DAILY SECRET live ONLY in the database (`dsched/`, `dly/…/b`, `dsecret/` — never a committed file: `tests/daily-secrets.test.mjs`); every day comes from
  THE DAILY SECRET, NEVER the pepper. THE THROWAWAY GATE (a result counts only for a profile made before that day's 4 am Eastern — `counted`), 20 new profiles
  a day per IP, 400 daily calls / 10 min. THE ROOM WINS (a pause only for a room that really started a game). The phone side on the kit (`js/daily/` — never a
  copy in a game). THE GO-LIVE SWITCH = /admin → THE DAILIES (owner-only, ANY time — OFF). **THE RESEED: /admin → THE DAILIES → RESEED** (DM2 ADD-ON — SERVER-SIDE:
  no service-account key on the owner's PC; PREVIEW = the dry run, RESEED NOW on a second tap; `api/admin.js` `dailyReseed`, audited) — a fresh daily secret from
  the NEXT 4 am: today + the past untouched (run it when the repo goes private). `scripts/dailies-reseed.mjs` = the emulators + tests only.
- **THE DAILY MODULE — DM2: THE SCREENS (docs/progression.md "DM2"):** THE FLANK's DAILY (left-most — `[ JOIN ] [ DAILY · BOARD · GAMES · YOU ] [ HOST ]`, 4 icons =
  the max; hidden while no daily is live; WAITING + the count / ALL DONE + a check; answers the sign's last N); THE DAILY SCREEN + a daily's RUN are OVERLAYS over
  the city driven by `state.daily` (`js/screens/daily.js` + `css/daily.css`, prefix `dy-`; app.js#paintDaily — the city held through the counted `ui/city-hold.js`):
  TODAY (THE SWEEP meter, ticket rows, SHARE TODAY, the 4 am countdown) · SCORES (YOUR TABLE + the everyone line from 50; ALL TIME hidden until BOARD 2.0); ONE
  `today` answer shared (`js/daily/today.js`; the rules PURE in `today-logic.js`); a daily's thin meta gives `scoreLine(score)` (spoiler-free). THE ROOM WINS on
  screen: the game start's closeAll = the banner (`.dy-banner`, never a toast) + the run HELD (+ COAST CLEAR paused) → RESUME YOUR DAILY above the dock; the host's
  "N PLAYERS ARE MID-DAILY" above PLAY. A daily's first-time LESSON = its row's `lesson` + `createLesson` (COAST CLEAR's PRACTICE HARBOR — `coastclear/lesson.js`;
  seen once per player: `pstats/{pid}/ls`). The rewards: the +10 SWEEP bonus, PERFECT WEEK = 7 sweeps IN A ROW (`dl.sr`), PENTHOUSE = rank ≤ max(1, ⌊n/100⌋) from
  50 counting finishers (`core/daily.js#isPenthouse`) — its card THE DIAL is DRAWN IN CODE (`fx/ph-dial.js` + pure `ph-specs.js`). Proof: `e2e-daily.mjs`.
- **THE DAILY MODULE — DFIX2 (FABLE REVIEW #2's fix pass — docs/progression.md "DFIX2", docs/games/review-dailies-2.md):** EACH DAY KEEPS ITS OWN COUNTERS
  (`dl.days` — a run that crossed 4 am never wipes the other day's sweep); PENTHOUSE is decided at THE DAY'S CLOSE (`api/_lib/daily-close.js` — the first
  `start` / `today` after 4 am closes yesterday ONCE against its final counting finishers; `progress.js#penthouseStep`, never at finish time); `pickDay` reads
  THE DAILY SECRET afresh for a new day (a reseed before 4 am can't leak the old key); THE 4 AM TURN (`today.js#armTurn` — the dock + the screen re-read, no
  reload); THE RESUME CHIP only while its run is resumable (`chipState`); THE MID-DAILY FLAG `rooms/{CODE}/players/{uid}/dy` (own node, boolean — the host's
  line reads it, NO poll; a rules change); THE ROOM WINS needs 2+ players (`MIN_PARTY`); a cold day's start → 503 `busy`. **SLIM CARDS EVERYWHERE A PLAYER
  LIST SHOWS** (the owner, Nov 8): SCORES → YOUR TABLE = the finishers' slim cards through `ui/strip-board.js`'s `stripKit` / `stripFor` / `stripFx` (never a
  second strip system; one surface a panel; the rank left, the score under at the right end, YOU a drawn frame, STILL TO PLAY one line, top 5 + you + SHOW ALL n).
- **THE DAILY MODULE — DFIX3 (THE DAILIES' FIRST-PLAY FIXES, Nov 8 — the dailies LIVE; docs/progression.md "DFIX3", docs/coastclear.md "The dig path"):**
  THE DIG PATH = TWO database waits (the budget in memory, the pid memoised, the record HELD in the SDK's cache for the call → ONE transaction attempt —
  `tx;desc="1"` in `Server-Timing` on every /api/daily answer) + COALESCED MOVES (`moves { list }` — the taps a phone queued while an answer was in
  flight go out together; `view.js#enqueue`), the functions pinned to **cle1** (`vercel.json` regions — check the deploy); THE ONE-TIME HINT replaces
  the practice harbor (a row's `lesson: true` + the cartridge's `HINT` string → `state.hint`; seen = `pstats/{pid}/ls`); THE PREMIUM TICKET (paper =
  `assets/daily/paper-grain.webp` CC0, the punched stub, the serial Nº MMDD, the drawn ADMITTED stamp + its stamp-down — `js/daily/ticket-art.js`
  shared with SHARE TODAY's image, which is rebuilt from the same ticket + the streak flame; `drawToday` is async); TODAY CENTRED by auto margins;
  /admin → THE DAILIES' STATS + TODAY'S PLAYERS (ADD FRIEND = the existing `friendButton`) + BACK TO THE CITY; SCORES: YOUR FRAME on the strip's own box,
  the foot hint once, a table of one = the card alone; THE FADE ON LEAVING in the SHARED audio engine (ONE MASTER gain — a ramp on the audio clock, THEN
  the suspend; back = resume + a ramp up; docs/audio.md) — never suspend a context hard again.

## CITY D (Nov 15) — SCORES SHOWS INSTANTLY — passes/city-d.md
- The daily screen keeps the LAST scores it saw today (`ns:dy:scores` — this player's: EVERYONE today, the ALL TIME boards, YOUR TABLE's averages +
  the day's own list) and paints them AT ONCE, marked UPDATING (`.dy-upd` — never blank, never a spinner); each fresh answer (asked once a visit)
  replaces them in place once any finger is up (`repaint` = afterTap; `rev` in the paint's signature).
- The server: THE DAY'S CLOSE (`daily-close.js#closeDays` — every (daily, day) its own claim), the sweep + the prune run SIDE BY SIDE; `today` reads a
  daily's result + start + NOT COUNTED in one trip, a finished run's pieces side by side, the friends list beside them; `every` asks its pid + the
  faces module while the switch is read. Timing tools: `scores-timing.mjs` (RTT_MS) + `scores-open.mjs` (docs/testing.md).
- STATS → THE DAILIES (the owner's sheet): WHO played each daily — TODAY · THIS WEEK — from `dly/{g}/{day}/s · r · x` (`api/admin.js#dailyWho`, inside
  the 5-min snapshot `progress/statsSnap` v 2; faces by index, no pid).

### FIXES R2 — A SCORES ROW OPENS THE PLAYER (the owner's add-on, Nov 15 7:36 pm)
Every slim card on SCORES (TODAY: YOUR FRIENDS + EVERYONE · TODAY; ALL TIME: YOUR FRIENDS + EVERYONE) is a press + lift control (`data-press`,
`role=button`, a keyboard reaches it) that opens THAT player's page through THE BOARD's own opener (`profile/player-page.js#openPlayer` — never a
second page): a friend by pid · an ALL TIME row by `{ b: 'daily-<g>', bid }` · an EVERYONE · TODAY row by `{ id, dg: <g> }` — the server finds that
board id in the daily's top for today (`api/_lib/player.js#pidOfDaily` — a finisher need not be on any board yet); YOUR row = your card. The
list stays stills (THE LIVE LANE). A touch that only STOPS the scrolling list never opens a row (THE REVIEW A8 — docs/title.md). Proof:
wk-press 'a SCORES row → THAT PLAYER'S PAGE' + 'A8', server.test 'BOARD 2.0 A' (+ the dg path).

### FIXES R2 — TAP A TICKET (the owner, Nov 15 — TODAY only, no history)
A FINISHED ticket on THE DAILIES → TODAY (made or failed) is a press + lift control → its END SCREEN in a sheet (`js/daily/end-sheet.js`, THE
SHEET): THE PASSWORD the doors' marks grids + words (`games/password/end-card.js#pwEndResult`), COAST CLEAR the final harbor with every light +
this phone's buoys (`games/coastclear/end-card.js#ccEndResult`) — each the live end screen's OWN builder (the views use them too: no second
copy), the tokens through `.pw-tok` / `.cc-tok` — and THE DROP its final board + time / lines (its share card's own picture, `renderShare`, kept
as a still `<img>`, the canvas freed). Stills: no entrance animation, no live effects. An unfinished ticket isn't tappable. THE SERVER hands it
out — `api/daily.js` action **`ended { game }`** (the dailies' existing function): only YOUR run (the caller's pid), only once FINISHED (409
`not_finished` before — never a start: no s/ write, no begin), today only; THE DROP answers `cart.endView` (the share's replay, junk SOLID —
never its log or seed). Proof: password.test + coastclear.test + daily-drop.test 'FIXES R2 — TAP A TICKET', `tests/integration/daily-tickets.mjs`
(5 checks + the three shots at 390).

## THE RULES FROM CLAUDE.md (moved Nov 15 — FIXES R2 Part C: the text CLAUDE.md held, verbatim)
- THE SHARE CARDS: ONE FOOT (`js/daily/share.js#shareAddress` — a straight line + the address, no frame) + THE ONE RULE (`share.js#RHYTHM` — every
  SHARE TODAY section: the NAME in its result's colour (green made · red failed · white) · ONE big TIME · ONE grey stat line · the art strip,
  through the kit's `paintName` / `paintBig` / `paintStat` — never a win word; `tests/share-rhythm.test.mjs`); tracked lettering only through
  `spacedText`; THE CARD IS BUILT BEFORE THE TAP (`prepShare` — never a share drawn at the tap, never a download) → docs/progression.md.

## THE GAMES LIST ORDER (CITY H2, Nov 18 — the owner)
The PLAY sheet (outside a room — screens/title-taps.js) + GAMES / PICK A GAME (in a room — screens/room-city.js) order the playable games by
the number of DIFFERENT PLAYERS who played each in the last 14 days (ties: the matches; a full tie: the config's order) — `js/core/game-order.js`
(PURE: `popularity` · `popularOrder` · `isNew` · `shelfOrder`). A game in its first 14 days after its go-live (`config.js` GAMES[].`live` —
JAYWALK 2026-11-17, HOLD'EM 2026-11-08) sits ON TOP (the newest first) with a NEW foil text line over its name (`.gm-new` — a static holo sweep
in the letters; no pill, no badge, no gold). THE SERVER works the order out ONCE a streak day — the first read after the 4 am turn
(`api/_lib/activity.js#gameOrder` → `progress/gameOrder { day, order, at }`, from the counted matches in `results/` — JAYWALK's solo runs are
reported there too) — and serves ONLY the ORDER (never the counts) inside the cached GET `/api/admin?live=1` the city already reads
(`{ …, order }` — THE CITY'S IDLE POLLS: no new poll); the phone keeps it (`localStorage nd:gorder`, harbor/remote.js); the same for everyone;
the config's order is the fallback when it can't be read. The module loads lazily on the sheet's tap (never the boot graph).
`tests/game-order.test.mjs`.

## THE STREAK FLAME — THE PINK TUBE (CITY H2, Nov 18 — the owner's pick A — Downloads/NEON/city-h2/refs/streak-flame-options.png)
`js/progress/flame-art.js` is TWO tube strokes only: the OUTER flame in the house pink (#ff6fc8) + ONE INNER TONGUE warm white-hot (#fff0b0). NIGHT
= neon tubes (a glow stack + the coloured tube + a white core line); DAY (`flameSvg(…, { glow: false })` — SHARE TODAY's day card) = the same
two strokes, no glow, no fill, deeper colours (`FLAME_DAY` — #d4147f + #c99410). NOT PLAYED YET (`waiting`) = the same shape dimmed + a SLOW
FLICKER (opacity only — css/progress.css `pg-wait`); FROZEN stays blue; OUT a dark outline; the lit tongue breathes; reduced motion = still.
PROGRESSION B's three nested tubes (the licks, the amber middle, the fill, the halo) are gone. ONE file: SHARE TODAY (still reads at the 360-px
downscale, night + day), the profile, THE PLAYER PAGE, the streak card + its week, the end-of-match moment (`look.js#flameIcon`).

## THE RULES FROM CLAUDE.md (moved Nov 18 — CITY I, THE CLAUDE.md TRIM: the text CLAUDE.md held, verbatim)
CITY I brought CLAUDE.md from 40.9 KB to under 32 KB: these standing-rule lines moved here word for word; CLAUDE.md keeps ONE short line pointing at this heading.

- A daily = its cartridge + ONE row in `config.js#DAILIES` (+ its server half in `api/_lib/dailies.js#SERVER_CARTS`) — PLUG-AND-PLAY, no fixed count.
- DAILY BEST (DAILY A): ONE pure table, each daily's own rule (`core/daily-best.js` → `pstats/{pid}/db`, server-written in the finish's stats transaction); a `tries` row (JAYWALK: 3, the best counts) = `api/_lib/jaywalk-daily.js` + pure `jaywalk-tries.js` → docs/jaywalk.md "THE DAILY".
- A `held` daily (HIGH RISE DAILY A, Nov 21 — HIGH RISE, ships OFF): ONE SHOT in LEGS, a hidden / refreshed / killed page RESUMES (3 holds + THE ROOM WINS' free ones) = `api/_lib/highrise-daily.js` + pure `js/games/highrise/held.js`; `api/daily.js` start / finish / settleRun read `cart.held` (start = `startHeld` · finish = `endRun` first · settle = `settleHeld`); the bookkeeping is `finishRun`'s, never forked → docs/highrise.md "THE DAILY".
- THE SERVER JUDGES every guess / move; answers + boards + THE DAILY SECRET live ONLY in the database (`tests/daily-secrets.test.mjs`) — never the pepper.
- THE TICKET = ONE pure rule (`today-logic.js#ticketState`; never ADMITTED while tries remain), its PLAY in its `TICKET_INK`; a daily's run (`daily.js#DAILY_RUNS`) out of its game's preload graph; THE 360 FLOOR (`share.js#SMALL_MIN`).
- A RUN KEEPS ITS OWN DAY (`js/daily/run-day.js`); THE THROWAWAY GATE; the phone side on the kit (`js/daily/` — never a copy in a game).
- THE GO-LIVE SWITCH + THE RESEED = /admin → THE DAILIES (owner-only); NO PILLS on the dailies; every colour a `--pw-*` / `--cc-*` token.
- THE SCHEDULED GO-LIVE: an OFF daily opens ONLY at a 4 am turn the owner schedules (/admin → GO LIVE AT THE NEXT 4 AM — `progress/dlive`; `core/daily.js#rowOpenOn`), never mid-day; a finish sweeps its OWN day's set (`dailies.js#liveFor`) → docs/progression.md.
- THE SHARE CARDS: ONE FOOT (`share.js#shareAddress`) + THE ONE RULE (`share.js#RHYTHM`, `tests/share-rhythm.test.mjs`); THE CARD IS BUILT BEFORE THE TAP (`prepShare`) → docs/progression.md.
- THE TAPPABLE SHARE CARD (CITY E): SHARE TODAY shares a LINK whose preview IS the day's card (540 × 675, uploaded at prepare — `api/_lib/share-card.js` from api/daily.js; one a player a day, 7 days); JAYWALK's the same (a counted RUN's card, its own slot, uploaded only at SHARE) → docs/progression.md, docs/jaywalk.md.
- EVERYONE ON SCORES: the day's top = ONE node a daily a day (`dly/{g}/{day}/t` — one transaction per COUNTING finish, `api/_lib/every.js` + pure `core/every.js`), never a scan; public faces only (board ids, never a pid) → docs/progression.md.

## DON'T COUNT ON THE DAILIES (CITY I, Nov 18 — the full rule: docs/profiles.md "CITY I — SECOND ACCOUNTS + DON'T COUNT")
A DON'T COUNT account (`nocount/{pid}`, the owner's tap in /admin) is left out AT READ of: EVERYONE ON SCORES (its row out, every place below moves up,
the N one smaller per flagged finisher — `api/daily.js` 'every'), the ticket's place line + its N ('today' — `js/core/every.js#dropFlagged` ·
`#countWithout`; below the kept top the histogram's "better" less the flagged rows above), THE PENTHOUSE (its count + its winners —
`api/_lib/daily-close.js`). Its own result, DAILY BEST, points and its own ticket line ("1ST OF 3" as it was) never change; UNDO restores every view
at once (the day's `t`, `n`, `h` were never touched).

## CITY PART 1 — OVERCLOCK's ONE BOARD + THE BACK-FILL's SEED
OVERCLOCK has ONE record board — `overclock-quick` (BEST QUICK RUN, solo or in a room; DUMB LUCK's points left out) — docs/overclock.md. A
board definition may say `both` (a SOLO run and a ROOM match share it — `match-report.js#soloBoard` keeps the id). A RETIRED board
(`core/boards.js#RETIRED_BOARDS`) has no definition: the writer + every screen skip it, its rows stay. /admin → THE BOARDS → BACK-FILL now also
seeds BEST QUICK RUN from the old QUICK · SOLO best (`core/board-fill.js#seedOcQuick`; the preview counts the players — `ocSeed`).
