# BOARD 2.0 A — the new boards' SERVER + DATA (Nov 9 2026, small hours)

A server + data pass after THE BTC CARD, before BOARD 2.0 B (the screens). **ONLY** what the brief listed: Group 0 (THE BTC CARD's known issues +
the WORD TOWERS flake), THE OVERALL BOARD = XP THIS WEEK, DAILY POINTS + THE DAILIES' BOARDS, the rows' slim-card data + THE PLAYER PAGE's data.
**NO NEW SCREENS** — B draws them (the only UI: /admin's BACK-FILL card + a plain PLAYER PAGE DATA look). Nothing else from the notes started.
**No rules change** (database.rules.json untouched — `lb/` + `pstats/` stay server-only; nothing to re-publish). **Still 8 functions** (new actions
on `/api/profile`, `/api/daily`, `/api/admin`). A City 2.0 file changed (scene.js, lights.js — THE FAST REVEAL) → the final push carries the harbor tag.

## Step 0
plan.md — "OWNER'S NOTES — NOV 9 (small hours)" appended unchanged (part 81) + the build table line; decisions.md (the current line, BOARD 2.0
A + B rows, "BOARD 2.0 — DECIDED" replacing Nov 8's draft). d38b3e5d.

## Group 0 — THE CARRY-OVERS (d3e0bab8)
1. **A 12-letter name on ONE line** — the full card's plate name shrinks to its column down to **13 px** (THE CARD TEXT STANDARD's name floor)
   before it splits (was 15 — `vault/full.js`, every full card). MAXIMILIANOS: ONE line on THE BTC CARD at 390 / 402 / 430 (14.4 px at 390).
   `tests/integration/namefit-probe.mjs` (every full card × `'W'.repeat(12)` + MAXIMILIANOS × 390 / 402 / 430) lists what still wraps:
   - MAXIMILIANOS → two lines on **4 cards** at every width: PENTHOUSE (THE DIAL), SAFECRACKER, GHOST RUN, PERFECT WEEK — their hero boxes leave
     a 60–70 px column (13.5–17 px two-line). Left as they are (each card's hero box is its own art's call).
   - `W × 12` (the widest twelve, never a real name) → two clean 17 px lines on 21 cards (the gift cards, THE HOUSE, REDLINE, PHOTO FINISH, BTC);
     9–11 px on SAFECRACKER / GHOST RUN / PERFECT WEEK.
2. **The sighting title + spot line back** on THE BTC CARD: the printed card name in the sighting's glow (`--sg-ink` + its light) with
   "spotted over the harbor" (+ the time when spotted) under it, at the foot (`.vl-fc-sgt`, `.vl-fcm-sg-btc .vl-fc-foot { bottom: 5.8% }`) —
   measured clear of the balloon's hero box at 390 / 402 / 430 (the basket's foot 171 px, the block's top 172 at 390).
3. **The warm column during the rise-in** — baked INTO `btc-clean.webp` (the master's burner halo, left in the sky by the push-pull fill — no
   glow plate, no flare: the burn is 0 during the rise). The build now subtracts its SMOOTH excess (`scripts/build-btc-card.mjs` "THE HALO OUT":
   a wide blur of the clean sky against a straight baseline drawn across the column from its two sides, row by row; only blur − baseline where
   positive, feathered; two passes, 14 + 6 px) — only `btc-clean.webp` changed (the other 10 layers byte-identical). Before → after:
   [board-2a/halo-before-after.png](board-2a/halo-before-after.png) (the sky at 2×), the `--cast` rise-in at 300 / 850 / 1400 ms:
   [rise-before-402.png](board-2a/rise-before-402.png) → [rise-after-402.png](board-2a/rise-after-402.png).
   LAB_V `full-card-sg-btc` → **3** + its CHANGED line ("the name on one line, the sighting line back, the rise-in fixed").
4. **THE WORD TOWERS flake = a REAL BUG: THE FAST REVEAL.** Reproduced ALONE at real night (`ONLY=panel` ~ 1 in 2), with a diagnostic on the red:
   `spellBy null, nightK 0, fadeIn 0, shownAt 889, fadeT0 −11`. A reveal UNDER THE BOOT SCREEN in the page's first 900 ms set `fadeT0 = now −
   900` → NEGATIVE, and the frame read `fadeT0 < 0` as "not revealed": the city's fade-in stayed 0 FOR GOOD — every baked layer drawn at opacity
   0 (only what ignores the fade showed) and the word towers never lit (nightK = 0). The panel's reload is a fast cached reload — the full run's
   tail + real night made it likelier. **Fix**: revealed = `shownAt ≥ 0` (scene.js); harbor `panel` gained **THE FAST REVEAL** check (after the
   reload the fade-in reaches 1); `lights.debug().lastDrop` + `windows.spellBy` / `fadeIn` say why next time. `ONLY=panel` **3 / 3 green**
   (41 / 41 each) + the full suite below. (A phone reloading fast could have shown a black city — now impossible.)

## Group 1 — THE OVERALL BOARD = XP THIS WEEK (faf2f0e9)
- **`xp`** — an OVERALL board (`core/boards.js#OVERALL_BOARDS`, `kind: 'overall'`, no game): THIS WEEK = the XP earned since Monday 00:00 ET;
  ALL TIME = the total XP (the level order).
- **THE ONE XP PAYMENT** — `core/progress.js#payXp(next, from, gain, now)`: `next.xp` + **`pstats.xw = { wk, x }`** (a new week starts at 0).
  Every XP path goes through it: `matchStep` (room matches · THE SOLO LANE at its capped 15 · the weekly goal's +200, inside the match's XP) and
  `dailyStep` (the daily XP + THE SWEEP). Events, sightings, achievements + PENTHOUSE pay NO XP (checked: `eventStep` / `penthouseStep` never
  touch it). Inside the step's own transaction — a replay (its key) pays nothing.
- **The board write**: `lb/xp/{all | wk}/{pid}` by the SERVER in the SAME update as `profiles/{pid}/x` — `api/_lib/stats.js` (a match) +
  `api/daily.js` (a daily), through `lb.js#overallPaths` over the PURE `core/overall.js#overallValues`; ONE write per payment, none on a replay.
  (RTDB transactions are one node: the counter lives in `pstats` inside the transaction; the board row is its derived copy, written next.)
  **The grep** (`tests/board-xp.test.mjs`): only `payXp` sets `.xp` in `js/core`, and the only `/api` files writing a profile's XP
  (`_lib/stats.js`, `daily.js`) both call `overallPaths` (THE PROGRESS RESET wipes every board with the XP — `lb: null`; `xw` + `dp` added to
  `RESET_STATS`).
- **The listing rules unchanged**: from the 3rd counted match, the opt-out + the admin's hide win (`syncBoards` carries the overall boards);
  YOUR exact rank via `ranks` (hidden too); `GET /api/board?b=xp` like every board. `/admin`'s RESET THIS BOARD refuses an overall board (400 —
  hide the player instead).
- **THE BACK-FILL** (it CAN be rebuilt — so this week is back-filled, not "from the deploy"): `results/{key}` (every counted match: `at` + each
  player's XP gain — never pruned) + the week's daily runs re-paid through THE DAILY XP's rule (`core/board-fill.js#rebuildWeekXp`); each
  player's counter = the LARGER of the live one and the rebuilt one (a payment during the run is never lost); ALL TIME = each profile's
  `pstats.xp` (exact already). Idempotent; admins only; audited (`boardsBackfill`).

## Group 2 — DAILY POINTS + THE DAILIES' BOARDS (d3a7e6b3)
**THE POINTS TABLE** (`js/core/daily-points.js` — ONE pure module, a row per daily; a new daily = its row + its cartridge, nothing else):

| daily | best | the worst win | lost | not played |
| --- | --- | --- | --- | --- |
| THE PASSWORD | both doors in 2 guesses = **100** | both doors in 12 = **60** | the first door in g, then locked out = **55 … 25** (55 − 6 × (g − 1)); locked out at the first door = **10** | 0 |
| COAST CLEAR | cleared ≤ 0:45 = **100** | cleared past 15:00 = **40** | caught = **10 … 30** (10 + 20 × the share of the 90 safe cells opened) | 0 |

- THE PASSWORD both doors: 100 − 4 × (G − 2) — 2 → 100 · 4 → 92 · 6 → 84 · 8 → 76 · 10 → 68 · 12 → 60. **Changed from the proposal**: "a door
  opened in g = 50 − 6 × (g − 1)" made BOTH doors in 12 (40) worth LESS than ONE door in 1 + a locked door (55) — a worse result over a better
  one (the game ranks both doors first). The one-door row is the proposal's exactly; both doors now slide 4 a guess (the worst two-door run 60 >
  the best one-door 55).
- COAST CLEAR cleared, a LOG scale from `scripts/sim-coastclear.mjs` (3000 human-paced zero-spot clears: best 0:25 · p10 0:53 · median 1:19 ·
  p90 1:58): 0:45 → 100 · 0:53 → 95 · 1:04 → 89 · **1:19 → 83** · 1:38 → 77 · 1:58 → 71 · 2:30 → 64 · 4:00 → 50 · 6:40 → 46 · 15:00+ → 40.
  Spots (+30 s) + pauses (+15 s) are already in the score's clock. One fixed scale (every board is 9 × 12 + 18 lights, no-guess): not a
  per-day par.
- The rules: a better result NEVER scores fewer points (whole points — two close results can tie); a played-and-lost day ≥ 10 > 0; not playing = 0;
  only a COUNTED result (THE THROWAWAY GATE); from the SERVER's stored score only (`dly/{game}/{day}/r/{pid}` — judged from its own record).
- **Written at the finish inside THE DAILY's own transaction** (`dailyStep({ points })` — `api/daily.js` passes `dailyPoints(game, kept)`), on THE
  RUN's OWN DAY (DFIX1 — a run that crossed 4 am counts on its day + its week); idempotent (a day + game already scored is a no-op; the day's key
  skips a repeat). `pstats/{pid}/dp = { d: { [day]: { g, t } } (16 days), w: { [wk]: { t, g } } (2 weeks), a: { t, n, f, l, g: { game: { t, n, f, l } } } }`.
- **THE BOARDS** (`core/boards.js`): `daily` (all the dailies summed a day) + `daily-password` + `daily-coastclear` (a board per row) —
  THIS WEEK = the week's points summed (`lb/daily…/{wk}` — the week of the run's DAY); ALL TIME = **the average a day × 100** (`allFmt: 'avg'` →
  "83.3"), ranked from **10 days played** (`MIN_DAYS`); below 10 unranked, YOUR average + days still returned by `ranks` (`mine: { avg, days,
  need }`). Listed from the 3rd DAY PLAYED (a dailies-only player has no room matches — `lb.js#hiddenOf`); the opt-out + the hide as always.
- **"Skipping never helps" vs "the average per day played"** — the two decided rules conflict (skipping a bad day RAISES a plain per-day-played
  average). Built: `ALL_TIME_RULE = 'span'` — the points ÷ the days from your FIRST daily-day to your LAST: a day you skipped in between counts 0
  (skipping a hard day and coming back never helps; stopping isn't skipping — a day becomes a 0 only once you come back). `'played'` (the plain
  per-day-played average) is the one-constant switch — **the owner's call** (the summary asks).
- **THE MODULE OWNS THE RESULTS**: the boards come from its records (`r`, `x`) — no second copy of a result; TODAY / percentiles / PENTHOUSE
  untouched.
- **THE BACK-FILL**: every counted result since the dailies' epoch (`DAILY_FROM` = d20261101 — live since Nov 8) re-scored through the same table
  (`pointsFromRecords`), merged with any day + game the live counter has (a finish during the run) — the same step, the same numbers twice.
- **THE SIMULATION** (`scripts/sim-board.mjs` — run by `tests/board-points.test.mjs`): 40 bots with mixed habits (daily · most days · weekends ·
  one daily only · dabblers; a skill each) × 14 days through the SERVER's pure steps → every board's order (both periods) = a HAND-COMPUTED one
  (plain sums + averages from the bots' own diaries): `daily` 38 ranked this week / 28 all time · `daily-password` 32 / 21 ·
  `daily-coastclear` 31 / 19 — **MATCHES** on all three.

## Group 3 — THE ROWS' DATA + THE PLAYER PAGE's DATA (205f6ea9)
1. **THE ROWS** — every public row (`/api/board`, its CDN copy, `/board`, the title's preview): `{ id, n, a, c, r, l, cd, es, tb, g, rank, v }`
   (`api/board.js#ROW_KEYS`) — the SLIM CARD's display ids (`cd` the worn card · `es` the emblem shape · `tb` its tube · `g` the name glow — what
   `ui/strip-board.js#stripFor` draws) + the level + the rank emblem. Ids that draw, never an item's NAME; never the pid, the key, the tag's
   digits or the member Nº (server.test walks every key of every row). The opaque `id` stays the way to open a player.
2. **THE PLAYER PAGE** — `POST /api/profile { action: 'player', pid } | { b, bid } | { id }` (`api/_lib/player.js`, pure `js/core/player.js`):
   `{ rel, card: { n, a, c, l, r, cd, g, tb, es, at (member since), fd }, band (the rank line), streak: { n, alive }, top: [{ id, name, group,
   item, tier, pct }] }`.
   - `rel` from YOUR list (`pfr/{you}`): `friend` · `out` (request sent) · `in` (received) · `blocked` (you blocked them) · `none` · `self`.
   - `top` = the TOP 3 RAREST achievements they HOLD (the lowest X% of players from `pcount/`; a tie → the newest) WITH each name — **THE APPROVED
     EXCEPTION**: only these 3, only on this answer (`tests/vault-names.test.mjs`: the only `/api` files that read the catalog's names are
     `catalog.js` + `player.js`; server.test: the 3 names reach no other answer). `item` + `tier` + `group` draw the medal (trophies.js's way).
   - A hidden / banned / opted-out player, or one who BLOCKED you → `{ limited: true, card: { n, a, c, es } }` (what a room already shows; their
     block is never told — `rel: 'none'`). Signed-in only; 120 looks a uid / 10 min; each player's part cached 30 s a warm instance.
   - NOT returned: stats, the best game, matches, wins, the pid, the key, the tag's digits, the member Nº, the XP.
3. **YOUR TABLE's ALL TIME** — `POST /api/daily { action: 'points', pids? }` → `{ mine, friends: { pid: … }, table }`: per board (`daily`,
   `daily-<game>`) `{ week, all, avg, days }` for you + your friends (YOUR list only — the `today` rule).
4. **/admin**: THE BOARDS card (PREVIEW → BACK-FILL NOW) + a player's **PLAYER PAGE DATA** (the `player` answer as JSON — you as the viewer); the
   player view labels the overall boards OVERALL, shows the average's format, and offers no reset on them.

## THE BACK-FILL — how the OWNER runs it (once, after the deploy)
`/admin` → **THE BOARDS** → **PREVIEW** (nothing written: "Week w20261109: N players earned X XP this week · M profiles · D daily-days read · P
with daily points") → **BACK-FILL NOW** (a second tap) → "Done … R board rows written". Running it again changes nothing.

## B's HAND-OFF — what each screen reads
- **THE BOARD's OVERALL tab** (XP): `GET /api/board?b=xp&p=week|all` → rows `{ id, n, a, c, r, l, cd, es, tb, g, rank, v }` — draw each row's
  slim card with `stripFor(K, row)` (`cd/es/tb/g/l/n/a/c` are exactly its fields; no `mn` → no member line); YOUR row = `profile.bid`; YOUR rank:
  `POST /api/profile { action: 'ranks', boards: ['xp'] }`. The week ends `ends` (Monday 00:00 ET).
- **THE DAILIES tab + DAILY → SCORES → ALL TIME**: `b=daily | daily-password | daily-coastclear`; THIS WEEK `v` = points; ALL TIME `v` = the
  average × 100 → `fmtValue({ ...def, fmt: def.allFmt }, v)` ("83.3"); YOUR `ranks` answer's `mine: { avg, days, need: 10 }` → "7 MORE DAYS TO
  BE RANKED · YOUR AVERAGE 83.3". YOUR TABLE's ALL TIME: `/api/daily { action: 'points' }`.
- **THE PLAYER PAGE**: `POST /api/profile { action: 'player', pid }` (friends, room name tags — the room's `players/{uid}/pid`, the podium) or
  `{ b, bid }` (a board row): the full card from `card` (`fullCardEl({ card: card.cd, who: { name: card.n, lv: card.l, avatar: card.a, color:
  card.c, shape: card.es, tube: card.tb, glow: card.g, at: card.at, fd: card.fd } })` — no `no`: the top line reads NEON SPEAKEASY), `band` + LV,
  the flame from `streak` (`alive` false → no flame), the 3 medals from `top` (`name`, `pct` % OF PLAYERS), INVITE (in a room — `friendInvite`),
  ⋯ → REMOVE / BLOCK by `rel` (`friendRemove` / `friendBlock` / `friendAccept`…). `limited` → the name + the emblem only, no card, no ⋯ ADD.
- THE SPEED RULES (already agreed): calm mode on long lists, only on-screen cards animate, ONE shared surface, the city PAUSED behind a full
  sheet, only the top ~10 built (the rest on SHOW ALL).

## Group 4 — the end
- Docs: this log; docs/profiles.md (Boards: the overall + the daily boards, the rows, THE PLAYER PAGE + the exception); docs/progression.md
  (DAILY POINTS); docs/data-model.md (`pstats.xw`, `pstats.dp`, `lb/xp…`, `lb/daily…`); decisions.md; ROADMAP.md + history; plan.md's build
  table; harbor.md's pass index; CLAUDE.md (one line).
- THE BUSY-PC CHECK: CPU 2.7 % average over 24 s before the full harbor suite (nothing else busy).
- **The local run** (the mini PC, fresh emulators + `serve.mjs --emu`, restarted after the `/api` changes): unit **1429 / 1429** · rules **69 / 69**
  (unchanged) + rules-live 4 / 4 · `/api` server.test **44 / 44** · daily-module **18 / 18** · `e2e-profiles` **120 / 120** · `e2e-daily`
  **46 / 46** (its own `DAILY_TEST=1` server on :5176) · smoke **6 / 6** (both playable games) · harbor `platefit, cardfit, stripfit, fullcard`
  **32 / 32** · `panel` 3 × **41 / 41**.
- **THE FULL `e2e-harbor` SUITE** (4 shards, 34 min): **1218 / 1223** — WORD TOWERS green; the 5 reds, each run down:
  - **LOAD WEATHER × 3 + LOAD — THE FULL POWER-ON** ("bake crossfade · facade" right after the reveal) — red on the pass's STARTING commit too
    (9cd32478 in a worktree on :5177 — the same 4) — **today is MONDAY**: the Monday painters keep LAST week's blade until theirs is done
    (scene.js#bladeMs reads the workers' traces); the reveal waits for the traces, but the facade's key had been memoised (4 s) BEFORE they came
    → the city revealed with this week's blade, then re-baked LAST week's in view. Every earlier run was on another day. **Fixed: THE MONDAY
    BLADE** — the memo forgotten once as the traces arrive, so the reveal's bake-key check sees the right blade (scene.js). `load` 19 / 19;
    `load,panel` **2 × 60 / 60**.
  - **THE ROOM's OWN COST at 4× CPU** (42.3 → 45.3 ms standing: +3.0 against its 3 ms budget) — only under the 4-shard load; ALONE green on
    this tree (34.3 → 35.4) and on the starting commit (34.7 → 36.8); skipped in the cloud (no GPU path on the runner). Unchanged by this pass.
  The full suite was not re-run after THE MONDAY BLADE (34 min); the touched groups were (above) and the cloud's 15 harbor jobs confirm.

## Known issues
- THE ROOM's OWN COST at 4× CPU can tip over its +3 ms budget in the FULL 4-shard local run (+3.0 here); green alone (+1.1).
- MAXIMILIANOS goes to two lines on PENTHOUSE, SAFECRACKER, GHOST RUN + PERFECT WEEK's full cards (their hero boxes leave a 60–70 px column);
  `W × 12` two lines on 21 full cards (9–11 px on the three narrowest). Each a card's own layout call — not changed here.
- ALL TIME's average = the 'span' rule (a skipped day between your first + last daily-day counts 0) — pending the owner's pick of 'span' vs
  'played' (one constant: `core/daily-points.js#ALL_TIME_RULE`).
- A stored ALL TIME average updates when the player next finishes a daily (no daily job rewrites it) — the span rule's 0s land on the next play.
- The sighting line on THE BTC CARD sits close under the basket at 390 (1 px clear of the hero box by measure).
