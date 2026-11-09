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
| DAILIES *(dormant — the first daily)* | DAILY BREAD (7 different days) · THE SWEEP (every daily on today's list in one day — was THE TRIPLE, id `the-triple` kept, DM1) · EARLY BIRD (before 8 am) · PENTHOUSE SUITE (top 1 %, ≥ 50 finishers) | CANDLELIGHT · THREE STARS · SUNRISE · PENTHOUSE (epic) |
| SPECIALS | HODL — a 21-night streak · MANY HAPPY RETURNS — your birthday *(dormant — B)* · SEASON'S GREETINGS — 3 holidays (`core/sky.js#holidayOf`) | emblem ₿ · CONFETTI · glow TINSEL |
| GAMES | FOUR ON THE FLOOR (PRISM DROP: a 4-line clear) · DEAD ON (OVERCLOCK: a Closest Call exact) · OVERCLOCKED (10 OVERCLOCK wins) · REDLINE (OVERCLOCK: alone on top of every challenge of a QUICK match, 2+ players — `overclock-sweep`) · PHOTO FINISH (OVERCLOCK: the win by exactly one point, 2+ players — `overclock-photo`) · HORSESHOE (OVERCLOCK OC5: backed the winning horse in DUMB LUCK, 2+ players — `overclock-horseshoe`, the server replays the race) | PRISM · BULLSEYE · CIRCUIT · card REDLINE (legendary) · card PHOTO FINISH (rare) · emblem HORSESHOE (uncommon — its art PENDING in THE LAB: the glyph until then) · **LIGHTHOUSE** (COAST CLEAR CC2: any clear — `coastclear-clear`, emblem, uncommon) · **GHOST RUN** (COAST CLEAR CC2: a clear with zero spots in 50 s or less — `coastclear-ghost`, card, rare; *dormant until THE SWITCH-OVER*) · **KEYHOLE** (THE PASSWORD PW2: both doors opened — `password-crack`, from the SERVER's record on finish, `api/_lib/pw.js#flags` → `dailyStep({ flags })`) · **SAFECRACKER** (THE PASSWORD: both doors in ≤ 6 guesses combined — `password-safe`) | … · emblem KEYHOLE (uncommon) · card SAFECRACKER (rare — Grok's vault door, js/fx/pw-cards.js) — both dormant until THE SWITCH-OVER (no cartridge in production) |

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
