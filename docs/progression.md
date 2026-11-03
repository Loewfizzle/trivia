# PROGRESSION — levels, the streak, the unlocks, the achievements, the daily contract (PROGRESSION A, Nov 2 2026)

The engine behind every "you got better" moment. **The server is the only writer** (XP, levels, the streak, items, achievements, the
counts — `database.rules.json`'s default deny; `tests/integration/rules.test.mjs` proves a client can't write any of it); the screens
only read. **Profiles are polish:** with `/api` down a match plays exactly as before — the moment just doesn't open. The decisions +
the owner's words: `docs/harbor/plan.md` (PROGRESSION 2.0, THE LEVEL PACE, THE ACHIEVEMENTS — DRAFT, STREAK MILESTONES REMAPPED, VAGUE
TEASE, NO "???", FOUNDER, THE LOOK, PROGRESSION A's LAST TWO QUESTIONS) + `docs/harbor/decisions.md` §15. The pass: `docs/harbor/passes/progression-a.md`.

| file | what |
| --- | --- |
| `js/core/levels.js` | PURE — the curve (`XP_AT`, `levelOf`, `levelInfo`), the BANDS, THE LEVEL REWARDS table, the vague tease (`nextRewardLevel`) |
| `js/core/streak.js` | PURE — the 4 am day, `streakPlay` (freezes, the break, WIN IT BACK, the outage, the milestones), `streakView` (what the screens show) |
| `js/core/items.js` | PURE — every collectible (cards · emblem shapes · tube styles · name glows · flame · favor): id, name, tier, placeholder palette |
| `js/core/achievements.js` | PURE — THE 30 ACHIEVEMENTS (checks + their item), the counters (`noteMatch`, `noteEvent`), THE AWARD ENGINE (`awardAll` + FOUNDER) |
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

### THE LEVEL REWARDS (31 — item ids; THE VAULT replaces the ART, never the ids)
1 GILDED (everyone) · 3 MIDNIGHT · 5 BRASS DECO · 7 tube TWO-TONE · **10 EMERALD & BRASS** · 13 emblem DIAMOND · 15 glow ICE · 18 NEON GLASS ·
20 SILVER CHROME · **25 MIDNIGHT & CHAMPAGNE** · 28 glow NEON · 30 tube BREATHING · 32 VELVET ROOM · 35 AURORA · 37 emblem CRESCENT ·
**40 ONYX & ROSE GOLD** · 44 GOLD FOIL · 47 tube GOLD · 50 glow GOLD · 55 emblem THE CROWN · 58 VELVET NOIR · **60 SAPPHIRE & SILVER** (the 4th
Gilded-family slot — a name + palette for THE VAULT to design) · 65 tube OLD SIGN · 70 PRISM LEGEND + glow PRISM · 75 emblem SUNBURST ·
80 tube ON THE BEAT · 85 glow CHAMPAGNE · 90 emblem THE ACE · 95 PLATINUM · **100 THE HOUSE**. Today's VAULT is folded in: the 7 old card finishes
+ 5 old glows are level rewards at the levels their old rank steps were worth (EMBER = FIRST ROUND's).
**THE CARRY-OVER:** a profile from before levels gets every reward its XP had earned (+ the achievements its stats already prove, +
FOUNDER while open) the first time it's touched — its next match, or the `me` call (the card screen).
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

## THE 30 ACHIEVEMENTS (shown only once earned + X%)
| group | achievement — how | unlocks |
| --- | --- | --- |
| PLAYING | FIRST ROUND — your first match | glow EMBER |
| | HOUSE WARMING — your first room hosted (a counted match as its host) | emblem THE KEY |
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
| GAMES | FOUR ON THE FLOOR (PRISM DROP: a 4-line clear) · DEAD ON (OVERCLOCK: a Closest Call exact) · OVERCLOCKED (10 OVERCLOCK wins) | PRISM · BULLSEYE · CIRCUIT |

**THE GAME CONTRACT:** a game's rework adds its 2–3 achievements to `ACHIEVEMENTS` (`game: '<id>'`) + sets the flags in its match report
(`core/match-report.js` → a row's `f: { flag: 1 }`, read from the room's own copy) — the counters key them `<game>.<flag>`.
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
  `?preview=streak` · `?preview=flame&streak=N` (`&state=lit|waiting|frozen`); the look page `tests/integration/progress-preview.html?view=…` (`&cards=1` every look).
- Toasts: an event that earned something (the knock, the watcher) — "ACHIEVEMENT · KNOCK KNOCK" + the bell.

## Tests
`tests/levels.test.mjs` (the curve, the rewards, the carry-over, THE YEAR SIM) · `tests/streak.test.mjs` · `tests/achievements.test.mjs` (all 30 +
the engine + FOUNDER) · `tests/daily.test.mjs` · `tests/integration/progression.test.mjs` (/api on the emulators: the daily contract with the
fake daily, the outage, a real report's awards, wearing, X%, the events, the FOUNDER switch + its sweep) · `rules.test.mjs` (nobody writes
any of it) · `e2e-profiles.mjs` (a real match → the moment, the skip, the profile, the streak card, /api down) · the harbor `progress` group
(the dock flame at 3×, the preview links, reduced motion) + `radio` (THE FOUNDER switch).
