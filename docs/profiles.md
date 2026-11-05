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
  IP). Restoring links the device; the profile that device held before is deleted (tag freed) ONLY when it OWNS NOTHING — FR6 FIXES A (C1,
  `api/_lib/profiles.js#ownsAnything`): a counted match, an item beyond the starter set (a SIGHTING CARD, THE KNOCK, a birthday…), a sighting,
  XP, a daily or a MEMBER Nº keeps it (in practice every numbered profile is kept — the device only unlinks). Its key stays on the device as
  **YOUR PREVIOUS KEY** in ACCOUNT (C2 — `me.js#restoreKey` keeps the previous key + a held new one in `pnotes.oldKeys`, the last 3; COPY ·
  FORGET) — the way back to whatever that profile holds.
  A new key retires the old one.
- The room seat (`players/{uid}`) carries `pid` (rules: only your own, `root.uids[auth.uid]`); the lobby, chat and results read the
  live `profiles/{pid}` (`js/profile/public.js`). A refused write (stale id) retries without it — joining never depends on it.
- **THE KEY ON THE DEVICE IS NEVER OVERWRITTEN** (PERF-A, Grok 1.3): `ensure` returns a key only when it CREATES a profile; if a different
  key is already on the device (a lost guest login, a failed IndexedDB migration, the same name typed again), the device keeps its key and
  its "saved" note, the new key waits in `na:{slot}:pnotes.heldNew`, and the membership card offers **THIS DEVICE ALREADY HAD A KEY —
  RESTORE IT?** (RESTORE IT · No — keep the new profile: the old key then kept in `pnotes.oldKeys`). Never delete a stored key until a
  restore succeeds.
- **BRING YOUR CARD — ONE CARD ON ALL YOUR DEVICES** (THE VAULT 1A, the owner's Nov 2 find: the Home Screen app opened as a STRANGER —
  iOS gives it its own storage; `js/profile/bring.js`, `css/bring.css`): the key LINKS a device to the profile; every linked device works at
  once (the other stays signed in; NEW KEY is never needed for it). A device with NOTHING saved (no key + no profile — the Home Screen app, a
  new phone, another browser, www vs the bare domain) is asked **ALREADY A MEMBER? BRING YOUR CARD**: the Home Screen app (standalone) leads
  with the sheet on its first open, a browser tab gets a pill over the dock (✕ / I'M NEW → never again: `nd:byc`), the setup screen a line,
  the empty membership card a button; paste the key → `restoreKey` → this device joined. **The membership card:** a bold SAVE YOUR KEY
  SOMEWHERE SAFE (email it to yourself, Notes, a password manager — "lose it and your card can't come back") + COPY · SHARE (the system
  share sheet) · I SAVED IT (= `pnotes.saved`: the 3rd / 10th-match reminder stops; the box turns quiet) + **USE THIS CARD ON ANOTHER
  DEVICE** (the key big + COPY + SHARE + three steps, Add to Home Screen included). The reminder sheet gets SHARE too. Previews:
  `?bringcard=1` (the sheet) · `?bringcard=chip` (the pill) — nothing happens unless a key is pasted. Proof: `e2e-profiles.mjs` §6c.
- **THE RESTORE RETRIES** (PERF-A): a network failure / timeout (status 0) is tried up to 3 more times with a backoff and a 15-s wait
  (WAKING THE SERVER — TRYING AGAIN); a server that answered (a bad key, a limit) is final; the invalid sound only for a refused key.
- **THE EMPTY CARD SAYS WHY** (PERF-A): no key + no profile on this ADDRESS → "Nothing saved on this address yet (<host>) — if you have a
  key, enter it below. Your profile wasn't deleted." (storage is per origin: neonspeakeasy.com and www. are two); a cached profile made
  for another login is never painted as the member ("THIS DEVICE'S SIGN-IN CHANGED — RESTORE WITH YOUR KEY" when the key is here).
- **THE SECOND TAB** (PERF-A, `identity.js#watchDuplicateTabs`): the same slot in two tabs → the OLDER stays the player, the newer YIELDS
  with a banner that stays ("ALREADY OPEN IN ANOTHER TAB — USE THAT ONE"; never `?slot=2` — on a phone that is an empty login) and its host
  loop stops (`state.dupTab`); USE THIS TAB swaps them; a yielded tab takes over once the other has not answered for 9 s.

## Results (checked by the server — what that means per game is below)
- At the podium every phone in the match queues one report (`js/profile/queue.js`, localStorage `na:{slot}:rq`): `{ code, matchId,
  snap }`. The queue retries with backoff, at once when the network comes back, and drops reports older than 5 h.
- `POST /api/report` (ID token required) reads the match **from the room** (`rooms/{code}/game`, phase `final`). Only when the room
  has moved on (a rematch started) does it accept the reporter's snapshot, and then only if the snapshot's placings agree with the
  room's game-night record (`night/{matchId}`, host-written). Reports from non-participants are refused.
- **APP FIXES (Nov 1 — Grok 2.2, NO INVENTED MATCHES; docs/app-fixes.md):** the night record is REQUIRED with its `at` (the server's
  clock — the rules) and always age-capped (6 h; one from the future refused); only uids with a SEAT in the room (`players/{uid}`)
  are credited — `night.n` is display only; the room path checks the game's placings against the night record; CIPHER's results must
  agree with the players' own signed boards (`api/report.js#cipherAgrees` — re-graded from the guesses, every round's word in
  `game.sx`); the snapshot path gives PLACINGS ONLY (`placingsOnly`, from the night record — never a client's game blob: no records,
  no scores); a uid with no profile is NOT given one by a report (each phone makes its own when it joins).
- **What "checked" means per game:** CIPHER — re-graded from the guesses (host + server). OVERCLOCK — the per-part credit (timing,
  partial credit) is the phone's: friends-level trust, bounded per challenge. NEON PAR's physics, PRISM DROP, SLIPSTREAM, PULSE's taps:
  the phone's own numbers within plausibility bounds — friends-level trust, NOT server-verified. Placings always come from the room.
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
- Entries hold only the pid; `GET /api/board` joins the emblem / colour / rank from `profiles/` at read time. **BNAME (Oct 28): a
  public row NEVER carries the typed name or the profile id** — see "THE BOARD's PUBLIC NAMES" below. It is public (the `/board` page), cached ~15 s in memory and by
  the CDN (`s-maxage=20`), paged (`start`, `n`, top 100). Your exact rank (even outside the top 100, even when hidden) comes from
  `POST /api/profile {action:'ranks'}`: `1 + count(entries > yours)`.
- **MEMBER NUMBERS** (THE VAULT 2B — `api/_lib/members.js`, `js/core/member.js#memberLabel`): `profiles/{pid}/mn` — a real member number, separate from
  the name tag's 4 digits; server-written only, sequential by when the profile was made, never reused (`members/next` only moves forward), never
  changed; the owner (the first id in ADMIN_PIDS) = Nº 1, reserved. The first call that finds a profile without one runs the one-time BACK-FILL
  (every profile by its `at`, the owner first — claimed by a transaction on `members/claim`, `members/filled` set after); then `ensure` (a new
  profile) + `me` assign the next. Shown as `0001` on the membership card, FOUNDING MEMBER's gold stamp, the full cards' top line + the DEV
  cards' plate. The rules: `members/` + every `mn` server-only (the default deny).
- **THE TWO DEV CARDS** (THE VAULT 2B — js/core/dev-cards.js): `card-dev-switchboard` + `card-dev-source`, granted by 'me' to ADMIN_PIDS only (taken
  back from anyone else), 'style' refuses them to anyone else (403 locked), in no reward table; names only to him (withShow).
- **Opt-out** ("Show me on global leaderboards"): `profiles/{pid}/h` + every board entry removed; stats keep counting (`pstats`), and
  your rank is still computed for you. Opting back in re-inserts from `pstats`. The admin's hide (`ppriv/ban`) wins over opting in.

## XP and ranks
> **PROGRESSION B (Nov 2 2026):** `POST /api/profile` gained `sighting` (CITY SIGHTINGS — server-verified, one count per appearance), `birthday` (month + day, private, once a year — `me` returns it in `priv.bd`), `birthdayRoom` (the room's skywrite, dormant) + `favor` (CALL IN A FAVOR); `me`'s stats carry `sg` / `sgt` (the sightings' counts). The photos of the sightings never leave the phone. docs/progression.md.
> **PROGRESSION A (Nov 2 2026) reworked this:** the ranks are now the BANDS of LEVELS 1–100 (the same XP lines; OWNER at 45,000), the
> streak's +10 %/night XP is gone (streaks pay in milestones), and THE VAULT's finishes + glows are level rewards — **docs/progression.md**
> (levels, the streak, the items, the 30 achievements, the award engine, the daily contract, FOUNDER, the screens). The per-match XP below stands.

`js/core/ranks.js`: NEWCOMER 0 · REGULAR 250 · INSIDER 2,000 · MADE 7,500 · LEGEND 25,000. Per match: 30 played; a win 40 + 6 per
extra player; 2nd 20 + 3 per player over 3 (3+ players); 3rd 10 (4+); 20 per personal best (max 3, improving an existing best); 25 for
the first match of a game today (Eastern), +10 more when it's your 3rd+ different game today. An evening of 8 matches ≈ 400–700 XP:
REGULAR in the first evening, INSIDER after a few, LEGEND after 40+ evenings (months of weekly play). Tested in `tests/profiles.test.mjs`.

## The screens
- **Title:** BOARD in the dock opens THE BOARD; YOU (your emblem) opens the membership card; each game's
  preview sheet shows that game's top 3 (its first record, else WINS) and your rank.
- **THE BOARD** (`js/board/view.js`): the hall (`scene.js`) is painted once per size — mahogany panels, brass rails, Art Deco arched
  windows onto the city (the title's own still when there is one), a back bar of bottles lit from below, brass pendants, the counter,
  haze, a vignette — and drifts on the compositor (80 s); dust motes; each game tab cross-fades the room's light into that game's two
  colours (two tint layers, opacity only). Tabs per game, RECORDS / CAREER, THIS WEEK / ALL TIME, picks (PULSE song × difficulty,
  GRIDLOCK modes…). Rows cascade in (34 ms stagger); the top three are lit gold / silver / bronze (#1 gets a slow light sweep); your
  row glows in your colour in the list and is pinned at the bottom with your exact rank. 25 rows a page, more on scroll.
- **Profile** (PROGRESSION A: THE GILDED CARD + the level, stats, the streak, the achievements + X%, THE VAULT of what you own — docs/progression.md#the-screens-the-owners-mockups-the-original-gilded--black-lacquer-brass-foil-the-fan-crown-one-hot-pink-neon-accent; the old card below is superseded) (`js/screens/profile.js`): the membership card (holographic sheen, avatar, Name#tag, rank, emblem, an XP bar that
  fills with light), the key as a password card (tap to reveal for 20 s, COPY, NEW KEY on a second tap), the opt-out switch, per-game
  cards (wins, win rate after 10, wins this week, ranks this week / all time, highlights, records), profile id + member since.
- **Key reminder:** after the 3rd finished match (and again after the 10th) unless the key was copied or marked saved — a sheet back
  in the lobby (`app.js` → `promptKey()`).
- **Podium** (PROGRESSION A: the plaques + the XP strip stay; THE END-OF-ROUND MOMENT opens after them and replaced the RANK UP below — docs/progression.md) (every game, `ui/final.js` → `callouts.js`): after the crown, up to three plaques — #1 WORLDWIDE / #1 THIS WEEK /
  ENTERED THE TOP 10 / #N WORLDWIDE / #N THIS WEEK / NEW PERSONAL BEST (same moments on several boards merge into one plaque) —
  with a light sweep and a counting rank, then the XP line filling the bar, then the **rank-up** (≈ 3 s, tap to skip): the old emblem
  dissolves into shards, a ring of light, the new emblem forges in with rays behind it, the rank name resolves letter by letter.
- **Sounds** (`js/board/audio.js`, SFX bus): tab, rows, pb (bell triad), top10 (rising flourish), first (short brass fanfare over a
  timpani), forge (swell → anvil strike in inharmonic partials → a bloom). THE BOARD and the card play the time-of-day MOOD MUSIC (CLASSIC setting: menu3.mp3 / menu.mp3).

### REAL USERNAMES (LOBBY 2.0 A, Nov 3 2026 — the owner: "why would I want a scoreboard of random names?" — supersedes BNAME below)
A public row (`/api/board`, its CDN copy, `/board`, the title's preview) = `{ id (the opaque board id), n (the USERNAME), a, c, r, l, rank, v }`
— `api/_lib/lb.js#publicRow`; never the profile id, the key or the tag's digits. A name the filter calls rude (`core/names.js#isOffensive`)
shows as its HOUSE NICKNAME (`publicName` — the old BNAME names, kept for this). A rename shows on every board at once (the rows are joined
with the profile). Safety: the board-name filter, REPORT NAME (anyone), /admin's rename + hide; the sign-up line "This name shows on the public
board — don't use your full real name." (the setup screen + the profile's NAME editor). **THE REPORT PUSH**: a REPORT → the owner's phones (THE
LEDGER's Web Push — `api/board.js#flagRow` → `radio.js#notifyOwner`): "Name reported: <name> — a rude or personal name" / "Score reported …" →
`/admin#reports` (scrolled to Board reports); the reports' own limits + one push a row an hour (`flags/{id}/pushedAt`). The tests prove only the
username + the board id leave the server (server.test.mjs).

### THE BOARD's PUBLIC NAMES (BNAME, Oct 28 2026 — a privacy fix; SUPERSEDED by REAL USERNAMES above)
- **The rule:** no public response (`GET /api/board`, the CDN's cached copy, `/board`, the title's top-3 preview) carries another
  player's TYPED name or profile id. A row is `{ id, n, t, a, c, r, rank, v }`: `id` = the **board id** — `HMAC-SHA256(pepper,
  'board:' + pid)`, 16 hex (`api/_lib/lb.js#boardId`; not reversible without the server's pepper, so a row can't be looked up);
  `n` + `t` = the **HOUSE NICKNAME** that id picks (`js/core/nicknames.js#houseNick`: 16 adjectives × 13 nouns = 208 1920s
  nicknames — "Dapper Fox", "Velvet Ace", "Midnight Jaguar" — every word and pair through the board-name filter, none a first name,
  + a 4-digit number in the tag's slot). The same player wears the same nickname every week, on every phone; a rename doesn't change it.
- **Your own row** stays your real name: `publicProfile()` gives your device its `bid`; THE BOARD (app + `/board` when that browser
  has the profile) swaps your row's nickname for your name + a **YOU** chip, on your device only.
- **The rules** (`database.rules.json`): `profiles/{pid}` is readable **one at a time by signed-in users** (the lobby + podium read a
  room-mate's profile by the pid on their seat), never the whole list and never signed out (it was `.read: true` at the top — a dump of
  every typed name). **Re-publish the rules in the Firebase console.**
- **THE 3-MATCH FLOOR:** a profile is listed on any public board only from its **3rd counted match** (all games together;
  `profiles/{pid}/m`, the server's own count, written with every counted match — older profiles without it are counted from `pstats`
  once). Under it no board entry is written (`boardPaths(..., hidden)`); the match that crosses it re-syncs every game's boards at once.
  Your pinned row says "N MORE MATCHES TO JOIN THE BOARD" (the `ranks` call returns `m` + `mm`, the floor); no would-be rank is shown.
  Env `BOARD_MIN_MATCHES` (tests: 1).
- **REPORT:** a ⋯ on every other player's row (a 44-pt strip at the row's right edge) → a sheet: SUSPICIOUS SCORE · BAD NAME OR EMBLEM ·
  CANCEL → `POST /api/board { action: 'report', b, id, why, dev }` (no sign-in) → `flags/{id}: { pid, n, why{}, b{}, first, last }`
  (server only). Limited per device (5 an hour; a random id in `localStorage bd:dev`), per IP (8 an hour, hashed) and 400 a day in all.
  With nicknames the typed name is never on THE BOARD, so a "bad name" report reads as: the name this player shows in rooms / chat
  (where others do see it) or an emblem — the admin sees the real name next to the report and decides.

## Admin (`/admin`)
- **THE ADMIN CHECK NEVER CACHES A NO** (PERF-A — `screens/harbor/remote.js#checkAdmin`, the ☰ menu's ADMIN row on `?city=2`): only a yes with a
  real pid is kept (6 h, per tab); a whoami with no pid (this login not linked yet) waits for the profile sync and asks once more; every
  profile change (a restore, a first link — `me.js` fires `nd:me`) asks again.
Signs in with the browser's own anonymous identity (same as the game there). `POST /api/admin` checks the caller's profile id against
`ADMIN_PIDS` (comma-separated) and writes `audit/{push}` for every change. Actions: search (name prefix, `Name#1234`, profile id),
view a player (profile, boards with ranks, games), remove a record (all-time / this week / both), reset a career board, rename (no
limit), hide from / return to every board, the audit log, **errors from phones** (below), **BOARD REPORTS** (BNAME: `flags` / `clearFlag`
— newest first, the real name + the house nickname + the reasons + the boards; tap the name to open the player, HIDE them there;
DISMISS). The player view shows "ON THE BOARD AS <nickname>" and "n/3 MATCHES — NOT LISTED YET" under the floor. A non-admin sees their own profile id and the setup steps.

**CITY 2.0's PREVIEW PANEL** (Oct 22 2026; `docs/harbor.md#the-preview-panel`): `cityLive { state, mins? }` writes the public
`city2/live` node every phone on `?city=2` plays (the state validated by `js/core/harbor-remote.js#cleanRemote` — anything dropped
refuses the call; 1–240 min, default 30) and `cityClear` removes it; both audited (`cityLive` with the status line + minutes,
`cityClear`). They are sent from the TEST pill on the title (?city=2, admins only), not from the /admin page. `whoami` also tells the
title whether to show that pill (cached 6 h per tab). **CONN (Oct 28):** `GET /api/admin?live=1` (no sign-in, the only GET) returns
the node's playable fields `{ live: { state, startAt, until, by } | null, at }` with `Cache-Control: public, max-age=0, s-maxage=15` —
every non-admin phone on `?city=2` polls it (~45 s, while visible) instead of holding a database socket; a finished one (`until` past)
reads as null; the label + the audit stay private.

**Stats** (Oct 2026; `js/core/insights.js#summarize`, PURE, `tests/insights.test.mjs`; action `stats`, cached 30 s): at the top of
/admin. LIVE NOW (refreshes every 30 s while the page is visible): players in rooms, rooms open, games in progress, a row per room
(game + phase, online / away, how long it's been open — no codes, no names; title-screen visitors have no connection and aren't
seen). GAMES PLAYED per game today / this week / 30 days / all time (today = the Eastern day, from results/) (gplay counts + results/) with average players; MATCHES PER DAY (30
days); MOST ACTIVE PLAYERS today / this week / all time (matches) / XP, each opening the player view; PLAYERS: played today (+ matches today), played this week (+ came back
from an earlier week), have played (+ on more than one night), profiles, new players per week (8 weeks); BUSIEST TIMES: weekday ×
hour heatmap, last 90 days, Eastern. Everything is read from rooms/, results/, gplay/ and profiles/ — only server-verified
matches count (none before profiles went live). The page scrolls like a normal page (admin.css undoes base.css's game-screen lock: `html.ad-html`; on phones the lower half used to be unreachable). results/ grows with every match: if the panel ever gets slow, keep per-day
aggregates in /api/report instead of reading it whole.

**Errors from phones** (Oct 2026): `js/errlog.js` (the first import of app.js and board/public.js) catches uncaught errors and
unhandled rejections on players' screens and sends them with `sendBeacon` to `POST /api/log` (no sign-in). It skips the usual noise
(audio not allowed, lost connections, ResizeObserver, extensions and other sites' scripts), sends each distinct error once and at
most 8 per page load, and never sends names, ids or room codes — only the message, the file:line in our code, a short stack and the
screen (`title`, `lobby`, `game:golf/play`…). Code that catches a failure that leaves a player stuck calls `reportError(e, label)`
(a game screen that couldn't load, NEON PAR without WebGL). The server (`api/log.js`) groups the same error from every phone into
one `errlog/{sig}` entry with a count, devices, browsers, first / last seen and the build (Vercel's commit); 40 errors an hour per
IP, 3000 a day in all; `errlog/` is server-only (the rules' default deny). The admin page lists them newest first (tap the message
for the stack) with Clear / Clear all; entries quiet for 30 days are pruned.

## THE RADIO's roles (CITY CONTROLS A, Nov 2 2026 — docs/harbor/passes/city-controls-a.md)
- `POST /api/admin { action: 'radio…' }` runs BEFORE the admin-only gate with its own ROLE per action (`api/_lib/radio.js#roleOf`): THE
  OWNER = a profile in ADMIN_PIDS (every jack, every audience, the dial, the queue, the ledger); THE CREW = `radio/crew/{pid}` (CC-B grants
  it: its 11 jacks, the room its phone is in, the per-night limits + a cooldown); anyone else → 403 `not_radio`. The local emulators only:
  `testAdmins/{pid}` = an owner (the E2E). `radioWho` answers the role (the radio's gate loads nothing on a no).
- Every action is written to `audit/` (act `radioFire` · `radioStop` · `radioClearAll` · `radioBoard` / `Edit` / `Cancel` · `radioDial`; `b` =
  the jack + the words + the audience, `role`). THE RECORD: `radio/fired/{id}` (`sight`: the owner's to a real audience — Progression 2.0).
- The public copy (`GET /api/admin?live=1` → `radio`) carries the city's moments, the billboard's messages + the dial — never a profile id.
- **CC-B (Nov 2 2026 — docs/harbor/passes/city-controls-b.md)**: THE CREW granted by the owner only (`radioCrewSet` { uid (a player he tapped
  in a lobby) | tag "MIKE#4821" | pid, on } → `radio/crew/{pid}` { at, by, n, t }; cap 10; no profile = no; `radioCrewPeek` for his player
  card; THE LEDGER's list). ONE RADIO PER LOBBY: the server checks the holder (`core/harbor-radio.js#radioHolder`) on every crew fire;
  `radioAsk` / `radioHand` write `rooms/{CODE}/radioCrew` (server only). THE INTERCOM (the owner only): `radioIntercom` → `radio/ic` +
  `radio/clips` (an hour), `radioUnsend`, `GET /api/admin?clip=<id>` (cached 60 s). PRESETS (`radioPreset`, `radioPresetFire` →
  `radio/presets`). The audit acts add `radioIntercom` · `radioUnsend` · `radioCrewAdd` / `Remove` · `radioAsk` · `radioHandOver` /
  `radioKeep` · `radioPreset` · `radioPresetFire` · `radioPushOn` / `Off` / `Test`.
- **"A ROOM JUST OPENED"** (CC-B): `room.js#createRoom` posts `radioRoomOpened` (any signed-in host — the server checks the room is theirs +
  under 2 min old; once a room an hour; never the owner's own) → a Web Push to every phone the owner turned it on for (`api/_lib/push.js`:
  VAPID + RFC 8291 on node's crypto; `radio/push/{on, subs, sent}`). SETUP: Vercel → Settings → Environment Variables → `VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY` (a pair: `node -e "import('./api/_lib/push.js').then(m => console.log(m.newVapidKeys()))"`), optional `VAPID_SUBJECT`
  (mailto:) → redeploy. On the iPhone: Safari → Share → Add to Home Screen → open it from there → the radio → LEDGER → A ROOM JUST OPENED
  → ON (allow notifications) → SEND A TEST.

## Setup (production)
1. Firebase console → Project settings → Service accounts → **Generate new private key** (a JSON file).
2. Vercel → project → Settings → Environment Variables: `FIREBASE_SERVICE_ACCOUNT` = the whole JSON (or its base64),
   `FIREBASE_DATABASE_URL` = the database URL from `js/firebase-config.js`, optional `KEY_PEPPER` (a long random string; set it once
   and never change it, or every profile key stops working), `ADMIN_PIDS` = your profile id (from /admin or the profile screen).
   **THE PEPPER (FR6 C — documented in FR6 FIXES A, `api/_lib/fb.js:41`):** with no `KEY_PEPPER` set, the pepper is DERIVED from the
   service account's private key — so ROTATING THE SERVICE ACCOUNT without first setting `KEY_PEPPER` to the CURRENT derived value
   invalidates every key hash, board id and daily seed at once (every player's key stops working). Before any rotation: set `KEY_PEPPER`.
3. Redeploy. 4. Re-publish `database.rules.json` in the Firebase console.

## Local + tests
- `npm install` at the repo root (firebase-admin, for `/api` only). `node scripts/serve.mjs --emu` serves `/api/*` against the
  emulators (`MATCH_GAP_MS=0` for back-to-back test matches, `ADMIN_PIDS=…` to try the admin page).
- `node --test tests/profiles.test.mjs` (pure), `tests/integration/server.test.mjs` (the functions on the emulators),
  `rules.test.mjs` (the new nodes), `e2e-profiles.mjs` (the whole flow in browsers). Previews without a server:
  `board-preview.html` (`?mode=public&g=pulse&c=records&p=all&far=1&empty=1&err=1`), `results-preview.html`
  (`?case=first|top10|world|pb|merged|rankup|legend`), `emblems-preview.html`, `og-board.html` (the /board link preview).

## Progression (Oct 2026): steps, the nightly streak, the weekly goal, mastery, THE VAULT
> **Superseded by PROGRESSION A (Nov 2 2026 — docs/progression.md):** the steps → levels 1–100; the nightly streak → THE STREAK (4 am day,
> freezes, WIN IT BACK, milestones — no XP); THE VAULT's 7 finishes + 5 glows → items granted by level (`profiles/{pid}/cd · g`, worn from
> `pstats/it`). The weekly goal + mastery stand as written. New `/api`: `POST /api/daily` (the daily contract), `/api/profile` `pct` · `event` ·
> `style { card, glow, tube, shape }`, the radio's `radioFounder`, /admin's `outage` / `outages` (audited `outageOn` / `outageOff`,
> `founderOpen` / `founderClose`). New server nodes: `pcount/`, `progress/founder`, `dly/`, `streak/outage`, `pstats/{it, ac, pa, dl, fv}`.

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

## THE PROFILE's ORDER (THE VAULT 2C — the owner's approved mock, with the FULL CARD on top)
`js/screens/profile.js` top → bottom: **1 YOUR FULL CARD** — the hero (the worn card's approved full card, your name, Nº, member since, the
FOUNDER badge; a tap = the full card's animated view; the Gilded card until a card is approved) with **CUSTOMIZE YOUR CARD** under it (+ YOUR
COLLECTION's count line — `progress/profile.js#customizeBar`; the strip lives in CUSTOMIZE: pinned, "THE LOBBY SEES THIS", VIEW FULL ›) ·
**2 LEVEL** + the bar (gold, brighter, a slow glint) · **3 THE STREAK** (→ the streak card) · **4 STATS** (+ this week's goal) · **5
ACHIEVEMENTS** (trophies — docs/progression.md) · **6 CITY SIGHTINGS** (the album) + a favor to call in · **7 MASTERY** + YOUR GAMES · **8
ACCOUNT** — Edit profile (the name + the colour) · YOUR KEY (save it · use it on another device · restore) · **BIRTHDAY** (the panel only until
set; then ONE line "Birthday · Mar 4 — change again in Oct" — `progress/extras.js#birthdayRow`) · the opt-out. **No BOARD button** — the dock's
trophy has THE BOARD. **LESS GOLD**: the profile's panels are faint dark glass (`.pg-prof .pg-panel`); gold only for the section headers, your
card's frame, CUSTOMIZE YOUR CARD + the level bar; hot pink = the end of round's "just earned" + the X% line.

## THE PROFILE POLISH (LOBBY 2.0 A — the owner's 2C review; supersedes THE PROFILE's ORDER above where they differ)
- The header: only ‹ BACK + the corner's music mute (`body.pf-on` hides ☰; no MEMBERSHIP title).
- The page: the full card + CUSTOMIZE YOUR CARD (the one gold button) · LEVEL (the hot-pink neon tube; the streak as a slim row → the streak
  card) · THE GOAL TILE (neon cyan: the goal big, a thick tube bar + n / N, the reward chip, CLAIMED ✓) · STATS · the latest 3 trophies (NEW ≤ 48 h)
  + ALL ACHIEVEMENTS · N › (THE TROPHY CASE sheet) · the latest 3 sightings + ALL › · MASTERY (a tile a playable game → its record in a sheet) ·
  ACCOUNT. NOT YET PLAYED removed.
- ACCOUNT: Edit profile › (a sheet: NAME › · COLOUR › — each its own sheet) · the birthday · YOUR KEY once (masked, COPY · SHARE, the saved line)
  · USE THIS CARD ON ANOTHER DEVICE + RESTORE YOUR ACCOUNT (two big glass buttons; RESTORE = a sheet) · the opt-out · NEW KEY small, red-edged,
  a second tap.
- The pop-ups (`js/profile/sheets.js`): a stack — ‹ BACK, a swipe down, the scrim or Esc close the TOP sheet only. One button system: every
  button but CUSTOMIZE is NEON GLASS (`.pf-gb`).
- **THE WEEKLY GOAL** reads only the games a player can start (`core/boards.js#GOAL_GAMES` — the server + the phone): 18 of 52 weeks had asked
  for a hidden game or 5 different games.
- **THE SAVE-YOUR-KEY POP-UP** (`js/profile/keypop.js`, the decision `js/core/keypop.js`): a key not marked saved + ≥ 1 counted match → once
  (their card, "Save your key so you never lose your card", COPY · SHARE · LATER); a returning player on the city after the reveal, a new
  player right after their first counted match; LATER / closed = never again + a pink dot on YOU until saved; never over a game, the moment,
  a sheet or a legendary. Replaces the 3rd / 10th-match reminder. Notes: `pnotes.kp` ('shown' | 'later'), `pnotes.saved`.
- The look preview of the REAL page: `tests/integration/profile-preview.html`.

## LOBBY FIXES (Nov 4 2026 — docs/harbor/passes/lobby-fixes.md)
- **ONE PROFILE, ONE SEAT + ONE ACCOUNT, ONE ROOM** (`js/seat.js`): `seats/{pid}: { code, uid, at }` — written by the profile's own devices (as
  themselves); HOST / JOIN ask first when another device's seat is live ("You're already in room XXXX on another device" · MOVE HERE · CANCEL);
  the old device walks out (a same-room HOST hands the room over); a resume never takes a seat. The rules refuse a pid's player node while the
  seat is another device's. The SERVER: two seats of one profile in a match = credited once (the WORSE placing — `api/report.js#dedupePids`);
  a match overlapping a counted one from ANOTHER room is never credited (`js/core/progress.js#overlaps`, `pstats.ov` = the last 8 windows).
- **YOUR NAME + COLOUR** live in ONE place — THE SPEED PASS (the owner's FINAL, Nov 4 6:25 pm): ONE row **EDIT USERNAME** (the name + its
  colour dot) at the VERY TOP of CUSTOMIZE YOUR CARD (`js/vault/dress.js`) → ONE editor with the name + the colour together
  (`js/profile/edit.js#openYouEditor`; a rename once a day as before). No COLOUR row, no ✎ on the profile's card; ACCOUNT holds the key /
  restore / sign-in only.
- **REMOVE TEST PLAYERS** (/admin's TEST PLAYERS card — `api/admin.js` `testPlayers` / `removeTestPlayers`, `api/_lib/testplayers.js`): the
  profiles made since a cut-off (+ named ones) → tick → a dry run → CONFIRM; removes the profile, its private node, its stats, its key, its tag,
  its device links, its seat, its crew role + every board entry; an admin never; audited. Member numbers never shift and are never re-used: the
  counter rolls back only when every number above the new top is going.
- The ☰ menu's **ADMIN** row (admins only, under THE LAB) opens /admin; the preview panel's row reads CITY PREVIEW.

## THE SPEED PASS (Nov 4 2026 evening — docs/harbor/passes/speed.md)
- **/ADMIN, TIDIED** (the owner: "too long, tons of logs"): EVERY CARD COLLAPSIBLE — a header with its count ("Errors from phones 497 · 476
  new"), a tap opens / closes it, remembered on the device (`localStorage ad:open:<id>`), the long cards (stats, errors, reports, test players,
  progress reset, audit) shut by default; a JUMP BAR of the cards at the top. THE LOGS GROUPED (`js/admin/groups.js`, PURE): one row per KIND —
  an error's message (long numbers folded) / a report's kind — its count, "N new", first / last seen; a tap opens its entries; a FILTER box;
  MARK SEEN (`seenLogs { sigs, ids }` → `errlog/{sig}/seen` = its count, `phonelog/{id}/seen`) + CLEAR per group (`clearErrors { sigs }`,
  `clearReports { ids }`) — admins only, every id checked, audited. THE DAY CHART card is gone (THE RADIO has the day; `/daychart` stays).
- **TEST PLAYERS, ALL OF THEM**: a **CREATED SINCE** date (default: the very first profile — `first` from the server), each row: matches,
  NIGHTS (distinct streak days played), made, last seen, member Nº; the **PRE-TICK** ("looks like a test" — two of: 0 nights · a test-ish name
  (`testplayers.js#testName`) · made in a test burst (3+ within 10 min)), never an admin, `TESTER#2599` or a player of 2+ nights; the reasons
  show as tags; nothing goes without the dry run → CONFIRM (the counter rule unchanged).
- **THE PROGRESS RESET** (the owner's add-on — `api/_lib/reset.js`, the rules in `js/core/reset.js` (PURE); actions `progressReset { confirm,
  typed }`, `progressBackups`, `progressRestore { stamp, confirm, typed }`; admins only, the server's own credentials, audited; REPEATABLE — now
  and at THE SWITCH-OVER): PREVIEW (a dry run: "46 profiles · 12,340 XP · 9 board records · … will be reset; 0 items removed") → type RESET →
  a two-tap CONFIRM. Order: (1) THE BACKUP — `backups/{stamp}` (server only: every pstats + the profiles' progress fields + `lb/` + the
  achievements' counts; the newest 5 kept); (2) FOUNDING MEMBER — `founderSweep()` stamps everyone who qualifies BEFORE the wipe; (3) THE
  RESET — pstats `xp g gw wk b day gd pa ac dl st` cleared (the FREEZES held stay), profiles `x l r s sd m` → level 1, `lb/` + `pcount/n` +
  `pcount/a` removed. KEEPS every item (`it` — the dev + gift 1-of-1s, FOUNDING MEMBER), favors, the counted-match keys (`m` — an old match
  is never counted twice), the member Nº, name + tag, colour, emblem, the equipped card. RE-CLIMBING: a match's outcome carries `nx` — the
  next level whose reward the player does NOT own (`reset.js#nextUnownedLevel`) — the round-end tease names it; a level-up whose reward is
  already owned says "Already yours", never UNLOCKED. RESTORE (type RESTORE) puts a backup's progress back + merges the items (never takes one).
  NEVER run against the live site from a test — the owner presses it himself.
