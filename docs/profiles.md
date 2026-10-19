# Profiles, THE BOARD and SPEAKEASY RANKS

Global profiles without signup, server-verified results, leaderboards for every game, XP ranks, and the admin page.
Joining a game is exactly as before (a link, a name, play); everything here is best-effort polish — with the server down or
unconfigured the app behaves as it always did (no tags, no emblems, results wait in a queue).

## The pieces
| where | what |
| --- | --- |
| `api/*.js` | Vercel serverless functions (Node, firebase-admin): `profile`, `report`, `board`, `admin`. `api/_lib/` is shared code (not routes). |
| `js/core/` | PURE, shared by server, app and tests: `week.js` (Eastern week/day keys), `ranks.js` (RANKS, XP), `names.js` (board-name filter, tags), `pkey.js` (restore keys), `boards.js` (the board catalog, sort values, formatting), `match-report.js` (what a finished match means per game + plausibility). |
| `js/profile/` | the client: `api.js` (fetch + ID token), `me.js` (this device's profile, sync, restore, key), `queue.js` (results queue), `public.js` (live public profiles of the room's players), `callouts.js` (podium plaques + rank-up). |
| `js/board/` | THE BOARD: `scene.js` (the bar, Canvas 2D), `view.js` (the shared board UI), `screen.js` (app route), `public.js` (`/board`), `audio.js` (its SFX). |
| `js/screens/profile.js` | the membership card screen + `promptKey()` (the reminder sheet). |
| `js/ui/emblems.js` | the five rank emblems (an SVG sprite) + `rankBadge()` (emblem + #tag after a name). |
| `board.html` `admin.html` `js/admin/` `css/board.css` `css/admin.css` | the public page, the admin page and their styles (board.css also styles the profile, plaques and rank-up). |

## Identity
- A **profile** (`pid`, 12 chars) is made by the server on the first `ensure` call from a device (name, avatar, colour from the
  local profile). Existing players get one the same way on their next visit; new players right after the name screen.
- `uids/{uid} → pid` links a device (Firebase anonymous uid) to a profile; several devices can link to one profile.
- **Name tags:** `Name#4821`, 4 random digits unique per name key (`tags/{nameKey}/{tag}`). A rename keeps the digits when they're
  free under the new name, else draws new ones. Renames: once per 24 h (`ppriv/nameAt`); capitals-only changes are free; leaving an
  offensive name is always allowed; the admin rename has no limit.
- **Restore key** `NEON-XXXX-XXXX-XXXX`: 12 symbols from a 32-letter alphabet without O/0/I/1 (60 bits). The server stores only an
  HMAC (`pkeys/{hmac}` → pid, pepper = `KEY_PEPPER` or derived from the service-account key); the plain key lives in the player's
  localStorage (`na:{slot}:pkey`) and is shown once more whenever they ask. Restores are rate-limited (10/h per device, 40/h per
  IP). Restoring links the device; a profile that device made on its own and never finished a match with is deleted (tag freed).
  A new key retires the old one.
- The room seat (`players/{uid}`) carries `pid` (rules: only your own, `root.uids[auth.uid]`); the lobby, chat and results read the
  live `profiles/{pid}` (`js/profile/public.js`). A refused write (stale id) retries without it — joining never depends on it.

## Results (server-verified)
- At the podium every phone in the match queues one report (`js/profile/queue.js`, localStorage `na:{slot}:rq`): `{ code, matchId,
  snap }`. The queue retries with backoff, at once when the network comes back, and drops reports older than 5 h.
- `POST /api/report` (ID token required) reads the match **from the room** (`rooms/{code}/game`, phase `final`). Only when the room
  has moved on (a rematch started) does it accept the reporter's snapshot, and then only if the snapshot's placings agree with the
  room's game-night record (`night/{matchId}`, host-written). Reports from non-participants are refused.
- `js/core/match-report.js#extractMatch` turns the match into per-player rows: placing, win (a first place not shared by the whole
  table), career counters, record values — each record checked for plausibility (PULSE ≤ the chart's perfect score from
  `data/pulse/manifest.json` counts; SLIPSTREAM ≤ top speed × ride time; Score Rush ≤ a generous ceiling from lines and song
  length; OVERCLOCK per-challenge ≤ 560; CIPHER per-round maximum and solves ≥ 1.5 s; NEON PAR strokes 1–7). An impossible
  record is dropped (`rejected`), the match still counts.
- **Exactly once:** `results/{code}_{matchId}` is claimed by a transaction (a stuck claim expires after 30 s); each player's update is
  one transaction on `pstats/{pid}` that also records `m/{key}` — retries, the other phones and a crash halfway never double count.
  A player can't be credited two matches within `MATCH_GAP_MS` (default 45 s; a real match takes minutes) — a forged room can't farm.
- The answer (`outcome`: XP gained + parts, rank from/to, personal bests, ranks before/after on the boards that changed) is stored
  in `results/{key}/o/{pid}`, so every phone gets its own, even the ones whose report arrived second.

## Boards
- Ids are database keys, so **dashes**: records `slip-dist`, `pulse-{song}-{diff}`, `prism-rush`, `overclock-std`, `cipher-score`,
  `cipher-fast5` (lower is better), `golf-par9` (lower); career `{game}-wins`, `{game}-wr` (win rate, 10+ games), `gridlock-sunk`,
  `gridlock-w-{classic|salvo|royale|arcade}`, `agent-esc`, `agent-spot`, `signal-el`, `bluff-fool`, `prism-ko` (`js/core/boards.js`).
- `lb/{board}/{period}/{pid}` = a **sort value** (higher is better; `toSort`/`fromSort` negate lower-is-better boards). `period` is
  `all` or the Monday of the week in Eastern time (`w20261012`) — a new week writes to a new key at Monday 00:00 ET; no reset job.
- Entries hold only the pid; `GET /api/board` joins names/tags/emblems from `profiles/` at read time (offensive names → "Player"),
  so a rename shows on every board, every week, every past record. It is public (the `/board` page), cached ~15 s in memory and by
  the CDN (`s-maxage=20`), paged (`start`, `n`, top 100). Your exact rank (even outside the top 100, even when hidden) comes from
  `POST /api/profile {action:'ranks'}`: `1 + count(entries > yours)`.
- **Opt-out** ("Show me on global leaderboards"): `profiles/{pid}/h` + every board entry removed; stats keep counting (`pstats`), and
  your rank is still computed for you. Opting back in re-inserts from `pstats`. The admin's hide (`ppriv/ban`) wins over opting in.

## XP and ranks
`js/core/ranks.js`: NEWCOMER 0 · REGULAR 250 · INSIDER 2,000 · MADE 7,500 · LEGEND 25,000. Per match: 30 played; a win 40 + 6 per
extra player; 2nd 20 + 3 per player over 3 (3+ players); 3rd 10 (4+); 20 per personal best (max 3, improving an existing best); 25 for
the first match of a game today (Eastern), +10 more when it's your 3rd+ different game today. An evening of 8 matches ≈ 400–700 XP:
REGULAR in the first evening, INSIDER after a few, LEGEND after 40+ evenings (months of weekly play). Tested in `tests/profiles.test.mjs`.

## The screens
- **Title:** THE BOARD is the third door under HOST and JOIN; "Welcome back, NAME" + emblem opens the membership card; each game's
  preview sheet shows that game's top 3 (its first record, else WINS) and your rank.
- **THE BOARD** (`js/board/view.js`): the hall (`scene.js`) is painted once per size — mahogany panels, brass rails, Art Deco arched
  windows onto the city (the title's own still when there is one), a back bar of bottles lit from below, brass pendants, the counter,
  haze, a vignette — and drifts on the compositor (80 s); dust motes; each game tab cross-fades the room's light into that game's two
  colours (two tint layers, opacity only). Tabs per game, RECORDS / CAREER, THIS WEEK / ALL TIME, picks (PULSE song × difficulty,
  GRIDLOCK modes…). Rows cascade in (34 ms stagger); the top three are lit gold / silver / bronze (#1 gets a slow light sweep); your
  row glows in your colour in the list and is pinned at the bottom with your exact rank. 25 rows a page, more on scroll.
- **Profile** (`js/screens/profile.js`): the membership card (holographic sheen, avatar, Name#tag, rank, emblem, an XP bar that
  fills with light), the key as a password card (tap to reveal for 20 s, COPY, NEW KEY on a second tap), the opt-out switch, per-game
  cards (wins, win rate after 10, wins this week, ranks this week / all time, highlights, records), profile id + member since.
- **Key reminder:** after the 3rd finished match (and again after the 10th) unless the key was copied or marked saved — a sheet back
  in the lobby (`app.js` → `promptKey()`).
- **Podium** (every game, `ui/final.js` → `callouts.js`): after the crown, up to three plaques — #1 WORLDWIDE / #1 THIS WEEK /
  ENTERED THE TOP 10 / #N WORLDWIDE / #N THIS WEEK / NEW PERSONAL BEST (same moments on several boards merge into one plaque) —
  with a light sweep and a counting rank, then the XP line filling the bar, then the **rank-up** (≈ 3 s, tap to skip): the old emblem
  dissolves into shards, a ring of light, the new emblem forges in with rays behind it, the rank name resolves letter by letter.
- **Sounds** (`js/board/audio.js`, SFX bus): tab, rows, pb (bell triad), top10 (rising flourish), first (short brass fanfare over a
  timpani), forge (swell → anvil strike in inharmonic partials → a bloom). THE BOARD and the card play the time-of-day MOOD MUSIC (CLASSIC setting: menu3.mp3 / menu.mp3).

## Admin (`/admin`)
Signs in with the browser's own anonymous identity (same as the game there). `POST /api/admin` checks the caller's profile id against
`ADMIN_PIDS` (comma-separated) and writes `audit/{push}` for every change. Actions: search (name prefix, `Name#1234`, profile id),
view a player (profile, boards with ranks, games), remove a record (all-time / this week / both), reset a career board, rename (no
limit), hide from / return to every board, the audit log, **errors from phones** (below). A non-admin sees their own profile id and the setup steps.

**Errors from phones** (Oct 2026): `js/errlog.js` (the first import of app.js and board/public.js) catches uncaught errors and
unhandled rejections on players' screens and sends them with `sendBeacon` to `POST /api/log` (no sign-in). It skips the usual noise
(audio not allowed, lost connections, ResizeObserver, extensions and other sites' scripts), sends each distinct error once and at
most 8 per page load, and never sends names, ids or room codes — only the message, the file:line in our code, a short stack and the
screen (`title`, `lobby`, `game:golf/play`…). Code that catches a failure that leaves a player stuck calls `reportError(e, label)`
(a game screen that couldn't load, NEON PAR without WebGL). The server (`api/log.js`) groups the same error from every phone into
one `errlog/{sig}` entry with a count, devices, browsers, first / last seen and the build (Vercel's commit); 40 errors an hour per
IP, 3000 a day in all; `errlog/` is server-only (the rules' default deny). The admin page lists them newest first (tap the message
for the stack) with Clear / Clear all; entries quiet for 30 days are pruned.

## Setup (production)
1. Firebase console → Project settings → Service accounts → **Generate new private key** (a JSON file).
2. Vercel → project → Settings → Environment Variables: `FIREBASE_SERVICE_ACCOUNT` = the whole JSON (or its base64),
   `FIREBASE_DATABASE_URL` = the database URL from `js/firebase-config.js`, optional `KEY_PEPPER` (a long random string; set it once
   and never change it, or every profile key stops working), `ADMIN_PIDS` = your profile id (from /admin or the profile screen).
3. Redeploy. 4. Re-publish `database.rules.json` in the Firebase console.

## Local + tests
- `npm install` at the repo root (firebase-admin, for `/api` only). `node scripts/serve.mjs --emu` serves `/api/*` against the
  emulators (`MATCH_GAP_MS=0` for back-to-back test matches, `ADMIN_PIDS=…` to try the admin page).
- `node --test tests/profiles.test.mjs` (pure), `tests/integration/server.test.mjs` (the functions on the emulators),
  `rules.test.mjs` (the new nodes), `e2e-profiles.mjs` (the whole flow in browsers). Previews without a server:
  `board-preview.html` (`?mode=public&g=pulse&c=records&p=all&far=1&empty=1&err=1`), `results-preview.html`
  (`?case=first|top10|world|pb|merged|rankup|legend`), `emblems-preview.html`, `og-board.html` (the /board link preview).

## Progression (Oct 2026): steps, the nightly streak, the weekly goal, mastery, THE VAULT
All pure in `js/core/ranks.js` (shared by the server and the screens); the server awards XP in `api/_lib/stats.js#step`, in the
same once-per-match transaction.
- **Steps:** each rank below LEGEND splits into I / II / III (`step(xp)`, `stepIndex`) — a step every evening or two. `profiles.r`
  (the emblem) is unchanged; screens show the step name (`INSIDER II`) and the bar to the next step.
- **Nightly streak:** `pstats.st = { n, d }` (Eastern days); from the second night in a row every match earns +10 % per extra night,
  up to +40 % (`streakPart`); `profiles.s` = n (the lobby / title flame).
- **Weekly goal:** `weeklyGoal(weekKey, BOARD_GAMES)` — the same for everyone, rotating (play 8 / win 3 / 5 different games / 4 of a
  featured game), measured from `pstats.gw`; +200 XP once, `pstats.gd` = the week paid.
- **Mastery:** a level per game from its career counters (`mastery(g)`: a match is a point, a win two more), shown on the card.
- **THE VAULT:** `FINISHES` (7 card finishes) and `GLOWS` (name glows) unlock by step; `worn(xp, f, g)` = what a player wears
  (their choice if unlocked, else the newest finish, no glow). `/api/profile { action: 'style', f?, g? }` checks the XP and writes
  `profiles/{pid}/f|g`; the glow shows on the card and on the name in every lobby. The podium shows each unlock as the thing itself
  (`callouts.js#unlocked`).
- **Where it shows:** the title's YOUR CARD button (next to THE BOARD), your lobby row (step, bar, streak, CARD), the ☰ menu
  (YOUR CARD on every screen), the podium's XP strip (step, next, streak, YOUR CARD) and UNLOCKED plaques, the card screen
  (streak, goal, THE VAULT, mastery). In a room the card opens as an overlay (`profile.js#openCard`).
- **The card** (`profile.js#memberCard`, `css/card.css`): finish layers (material, moving light, generated guilloche rosette, deco
  frame, sheen), a tilt that follows the finger (transforms only). Preview: `tests/integration/card-preview.html?all=1`,
  `?xp=8200&vault=1&glow=ice`.

- Callsigns keep their case (the setup field no longer forces caps, `.input-name`); the card's name shrinks to fit a long name.
