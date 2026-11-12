# Profiles, THE BOARD and SPEAKEASY RANKS

Global profiles without signup, server-verified results, leaderboards for every game, XP ranks, and the admin page.
Joining a game is exactly as before (a link, a name, play); everything here is best-effort polish — with the server down or
unconfigured the app behaves as it always did (no tags, no emblems, results wait in a queue).

## The pieces
| where | what |
| --- | --- |
| `api/*.js` | Vercel serverless functions (Node, firebase-admin) — EIGHT: `profile`, `report`, `board`, `admin`, `log`, `sky`, `time`, `daily`. `api/_lib/` is shared code (not routes). |
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
- **HOLD'EM (HE2 — docs/holdem.md "THE DEALER"):** the SERVER is the dealer, so nothing is reported by a phone: at the match's end the dealer
  credits it from its OWN record (`api/_lib/holdem-store.js#reportMatch` — `results/{CODE}_{matchId}` with `src: 'dealer'`, then `applyMatch`).
  The dealer's ops ride the same function: `POST /api/report { holdem: <op>, room, … }` (real statuses + Server-Timing on that branch).
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
- **THE REAL PLAYER COUNT (FR7-A's C1, Nov 12 — docs/harbor/review-7a.md):** a win / a 2nd place pays more with more players, and the
  count used to be the LENGTH of a host-written list (the night record's names on the snapshot path, `game.participants` on the room
  path) — one anonymous user wrote a 5,001-name record and took 30,089 XP (level 1 → 77) in one call. Now, on BOTH paths
  (`api/report.js`): a record naming more than `MAX_REPORT_NAMES` (16 — twice a full room) is refused (409 `unverifiable`) before
  anything is extracted; the count = the match's names that are REAL PLAYERS — a seat in the room (`players/{uid}`, written only by
  that uid) or, for a player who left after the match, an account the server knows (`uids/{uid}`) — never above `MAX_PLAYERS` (8); a
  record with ONE real player is paid as a SOLO run (`asSoloRow`: the solo lane's XP, no win, no records, no award flags — so a solo
  run reported by snapshot is no longer a win), and refused for a game that doesn't play solo. Only seated players are CREDITED, as
  before. HOLD'EM (the dealer's own record), the dailies (a fixed XP a daily) and the solo lane (a fixed XP, 4 a day) never took a
  count from a phone. `server.test.mjs` "FR7-A C1": the forgery on both paths, a real 2- and 8-player match paid by the formula.
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
- **THE FLOOR — WHO GETS LISTED (PD-3 Group 0, the owner Nov 9; was the 3-match floor):** a profile is listed on any public board only from
  its **3rd COUNTED PLAY** — a counted ROOM match (2+ players) OR a counted DAILY finish (THE THROWAWAY GATE's `counts` — `core/streak.js#countsOn`);
  a SOLO run never counts. `pstats/{pid}/cp` = the count, kept by `core/progress.js#matchStep` + `dailyStep` in their own transactions
  (`countedPlays(stats)` — a profile from before it: its counted matches + its counted daily finishes, an estimate until the back-fill);
  `lb.js#hiddenOf` = `progress.js#boardHidden`. `profiles/{pid}/m` = the same count (written by a match AND a daily). Under it no board entry is
  written (`boardPaths(..., hidden)`); the play that crosses it (a match OR a daily) re-syncs every game's boards at once. /admin → THE BOARDS →
  BACK-FILL re-counts every profile EXACTLY from the records (`core/board-fill.js#countedPlaysFromRecords` — results/{key} with 2+ players, not
  skipped + the counted daily runs) and rewrites EVERY board row (its PREVIEW shows `listedNow` → `listedAfter`). Unit: `tests/listing.test.mjs`.
  Your pinned row says "N MORE PLAYS TO JOIN THE BOARD" (the `ranks` call returns `m` + `mm`, the floor); no would-be rank is shown.
  Env `BOARD_MIN_MATCHES` (tests: 1).
- **REPORT:** a ⋯ on every other player's row (a 44-pt strip at the row's right edge) → a sheet: SUSPICIOUS SCORE · BAD NAME OR EMBLEM ·
  CANCEL → `POST /api/board { action: 'report', b, id, why, dev }` (no sign-in) → `flags/{id}: { pid, n, why{}, b{}, first, last }`
  (server only). Limited per device (5 an hour; a random id in `localStorage bd:dev`), per IP (8 an hour, hashed) and 400 a day in all.
  With nicknames the typed name is never on THE BOARD, so a "bad name" report reads as: the name this player shows in rooms / chat
  (where others do see it) or an emblem — the admin sees the real name next to the report and decides.

## Admin (`/admin`)
- **DFIX3 (Nov 8):** `‹ BACK TO THE CITY` at the top of the authorized page (the denied page always had one). **THE DAILIES card** gained **THE STATS**
  (`dailyStats`, admin only, read-only — no audit line): per live daily STARTED · FINISHED today + the last 7 days as columns (the day nodes' keys —
  `dly/{game}/{day}/s` + `/r` — a few small reads, never a scan of the profiles), and **TODAY'S PLAYERS** (everyone with a start today, newest first,
  ≤ 50 of n): name#tag → the player, LV, each daily's score line / PLAYING / —, COUNTS or NEW TODAY (THE THROWAWAY GATE), and **ADD FRIEND** through
  the EXISTING `friendButton` (`js/profile/friends-ui.js` — the ordinary friend request they accept; REQUESTED / FRIENDS by itself; never for yourself —
  the page now sets `state.uid` so the profile modules know this browser's identity). Nothing leaves the admin.

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

## THE SOLO LANE (SHELL 2.0 B1, Nov 5 2026 — review-6.md D3; the owner, Nov 5 6:56 am: "solo counts for the STREAK + a SMALL CAPPED XP — solo never out-earns playing with friends")
- A room of ONE plays a SOLO cartridge end to end. Its meta says `SOLO: true` (OVERCLOCK first; `cartridge.js#minPlayersOf` → 1, and the
  server reads the same flag: `core/match-report.js#SOLO_OK`). `unreportable` accepts n = 1 only for those; PRISM DROP alone is never a match.
- **What it counts**: the STREAK (the day is played) + a SMALL XP. `ranks.js#SOLO_XP` = 15, half of a played match, so always less than
  the least a LOST multiplayer match pays (`XP.played` 30). Only the first `SOLO_DAY_XP` = 4 solo matches of the (Eastern) day pay it, then 0
  (the streak still counts). There is NO win, NO placing, NO PB / new-game / variety / weekly-goal XP, and the achievements see rank 0 + no win.
- **Records**: kept, on the game's SOLO board (`<board>-solo` in core/boards.js — OVERCLOCK's `overclock-std-solo`, with the same bounds
  as the multiplayer one; OC5: `overclock-quick-solo` = a SOLO QUICK run — no multiplayer QUICK board — bounded by THE SCORING TABLE:
  every result ≤ `overclock/logic.js#ptsCeiling(type, ok, parts, last)`, six real skill challenges); never the multiplayer board. The report's
  outcome carries `bests` (the all-time best of each record the match counted for) — OVERCLOCK's solo victory shows YOUR BEST from it.
- **The room**: the host writes the night entry with **0 points** (host.js), so there's no WINNER's BANNER, no night's champion and no
  night bonus. /api/report expects the 0 (a host writing 3 for a solo match is refused: mismatch). There's no rematch vote either (no one
  else to vote). The podium says **SOLO RUN** + the player + the score (`ui/final.js` — a game's own `finalScene` draws its solo body).
- Proof: `tests/shell-b1.test.mjs` (the pure steps: credited once, capped a day, never a placing) + `server.test.mjs` (THE SOLO LANE on the
  emulators) + the harbor's `sololook` group (OVERCLOCK starts with one player).
- **COLOUR-BLIND on the profile**: `ppriv/{pid}/cb` (private, server-written — `/api/profile` action `prefs`), returned in `priv.cb`. A device
  that never chose for itself adopts it.

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

## SHELL 2.0 B2 (Nov 5 2026 — docs/harbor/passes/shell-b2.md)
- **THE GIFT CARDS** — server grants only: `/admin → GIFTS` (`api/_lib/gifts.js`: owner-only, audited, `gifts/{card}` = one profile ever; the card
  equipped + a reveal waiting in `ppriv/{pid}/gift`; `/api/profile giftCheck` · `giftSeen`). The owner's own gift card is granted on 'me' to
  ADMIN_PIDS like the dev cards (audited once), refused on 'style' to anyone else, taken back from anyone else's items. docs/vault.md.
- **YOUR PREVIOUS KEY** on YOU → ACCOUNT (it only lived in City 1.0's key sheet): a glass row under YOUR KEY when this phone has one
  (`me.js#previousKey` — the key held before a restore / a new key): tap = COPY; FORGET (a second tap confirms).
- **MAKE HOST** (the room): the host's row on a player's card (docs/data-model.md — the rule takes a hand-off only to a live online player).
- **THE CREW SWITCH LIVE**: `radioCrewSet` with the room → `rooms/{CODE}/radioCrew/role/{uid}` → that phone loads / drops its radio at once.

## THE CARD PASS (Nov 7 2026 — docs/harbor/passes/card-pass.md)
- **THE GIFT QUEUE** (`api/_lib/gifts.js`): a GIVE adds `ppriv/{pid}/gq/{pushKey}` = `{ id, at }` (it still equips the card — the newest gift is
  the one worn). `/api/profile giftCheck` → `{ gifts: [{ k, id, at }] (unseen, in order), done, gift (the first, for an old phone) }`;
  `giftSeen { k }` stamps `s` on that one; the last one seen clears the line; no `k` = the first unseen (an old phone). The old `ppriv/{pid}/gift`
  slot migrates on the next check (first in line). `me`'s `priv.gift` = the first unseen, `priv.gifts` = how many wait. Server-only — no rule.
- **B1 — AN EMPTY SOLO RUN NEVER COUNTS**: `core/match-report.js#soloEmpty` (nothing answered — no right part — and a total of 0) marks the row
  `empty`; `core/progress.js#matchStep` skips it (`skip: 'empty'`: no solo XP, no streak day, no solo-lane count, nothing written).
- **B3**: the OVERCLOCK solo boards' tabs + column read QUICK · SOLO / STANDARD · SOLO. **B8**: the /api-down solo run proven (queued, sent once).

## FRIENDS A (Nov 7–8 2026 — docs/harbor/passes/friends-a.md)
- **THE FRIENDS LIST** — `pfr/{pid}` (server-written; its owner may read it, another player never): `f` friends (both sides) · `in` / `out`
  requests · `b` blocks · `rp` RECENTLY PLAYED WITH (from VERIFIED matches — `api/_lib/stats.js#applyMatch` → `friends.js#noteRecent`) · `inv`
  waiting invites. Every change = ONE pure step (`js/core/friends.js#friendStep`) → one multi-path update (`api/_lib/friends.js#friendDo`).
  ADD → a REQUEST they ACCEPT (nobody on your list without a yes; their request already there → ADD accepts). DECLINE + REMOVE are QUIET; BLOCK
  ends the friendship, hides them from your suggestions and swallows their next requests (theirs look sent, never land). Caps: 100 friends,
  20 out, 50 in, 200 blocks, requests age out in 30 days; `rl/fr_h_{pid}` 30 an hour + `rl/fr_d_{pid}` 80 a day.
- **`POST /api/profile`** actions: `friends` · `friendAdd { pid } | { b, bid }` (THE BOARD's row id → the pid on the server) · `friendAccept` ·
  `friendDecline` · `friendCancel` · `friendRemove` · `friendBlock` · `friendUnblock { pid }` → `{ ok, rel, pid, state }` · `friendInvite
  { pid, room }` · `inviteCheck` → `{ invites, frIn }` · `inviteDismiss { pid }` · `friendPush { op, sub?, endpoint? }`; `me` carries `fr.in`.
  A card = `{ pid, bid, n, t, a, c, l, cd, g, tb, es, at }` — never a key.
- **WHERE FRIENDS LIVE** (NO DOCK TAB): the profile card's FRIENDS section (requests, the list + ⋯ REMOVE / BLOCK, SENT, RECENTLY PLAYED WITH,
  BLOCKED + unblock, INVITE NOTIFICATIONS, YOUR TABLE's placeholder), the pink badge on YOU (pending requests), ADD FRIEND on a player's card in
  the room, on the podium + THE BOARD's ⋯ (in the app only), the room's INVITE sheet (FRIENDS on top). ONLINE STATUS = NONE — the only presence
  is the green dot on a friend IN THE ROOM WITH YOU (`.rc-tag.is-friend`). /api down → no friends anywhere, nothing breaks.
- **INVITES THAT WAIT**: `friendInvite` — from a player seated in that room, to a friend → `pfr/{friend}/inv/{me}` `{ r, ca, at, until (+30 min) }`
  + a Web Push to the friend's INVITE NOTIFICATIONS phones (`ppriv/{pid}/ps`, ≤ 4; the same VAPID keys as THE LEDGER's push; iPhone: the Home
  Screen app with notifications allowed) opening `/?room=CODE&inv=1` (it knocks by itself — the normal join rules). On the next open the title
  asks `inviteCheck` (ONE /api call — never a socket: CONN) → the card "<NAME> invited you · JOIN ROOM XXXX" (NOT NOW · JOIN), held during a match;
  gone when the room closes, its hush word is reused (`ca`), or after 30 min.
- **SAVE TO PASSWORDS** (account backup (a) — `js/profile/keychain.js`): a real login form beside YOUR KEY (NAME#1234 = `username`, the key =
  `current-password`, a submit handled on the page — PasswordCredential where it exists, the form leaving = Safari's Save Password); RESTORE YOUR
  ACCOUNT + BRING YOUR CARD's key field = `current-password` in a real form → a new phone autofills it. The key goes nowhere new.
- **THE CREW INTERCOM** (`api/_lib/radio.js#intercom` with role crew): the owner's ONE switch on THE LEDGER (`radioCrewIntercom` → `radio/crewIc`,
  default OFF, audited); ON → the room's radio holder gets the hold-to-talk for THEIR room (≤ 15 s, NOW, no headline, 4 a room a night —
  `radio/limits/{room}/{night}/ic`; the clip gone after the hour); OFF → not shown + refused (`crew_ic_off`).
- Proof: `tests/friends.test.mjs`, `tests/integration/friends.test.mjs` (+ rules.test FRIENDS A, progression.test YOUR TABLE), `e2e-friends.mjs`,
  `wk-keychain.mjs`, harbor `crew`.

## PASSKEYS — FACE ID SIGN-IN (FRIENDS B, Nov 8 2026 — docs/harbor/passes/friends-b.md)
A second way to bring your card to a device, beside the restore key (which stays, unchanged — the fallback).
- **The player:** YOU → ACCOUNT → **ADD FACE ID SIGN-IN** (TOUCH ID on a Mac, PASSKEY elsewhere — `profile/passkey.js#pkWord`) → the phone asks
  "Save a passkey for neonspeakeasy.com?" → Face ID → listed ("iPhone · added Nov 8 · REMOVE"). On a new device / after clearing site data:
  **BRING YOUR CARD** or **RESTORE YOUR ACCOUNT** → **SIGN IN WITH FACE ID** → the card comes back exactly as a key restore does. Apple devices share
  the passkey through iCloud Keychain; a Windows / Android device picks "use a phone" in the browser's dialog and scans its QR code with the iPhone
  (Bluetooth nearby), then may ADD its own. The device then holds NO key (ACCOUNT says "not on this device" + offers NEW KEY); the saved key works.
- **The server** (`api/_lib/passkeys.js`, actions on `api/profile.js` — still 8 functions): `pkRegOptions` · `pkRegister` · `pkAuthOptions` · `pkAuth` ·
  `pkRemove`; `me` adds `pk` (label + added + last used — never key material). ONE library, `@simplewebauthn/server` **13.3.3** (pinned; root
  package.json — /api only, never shipped to phones). RP ID **neonspeakeasy.com** (+ `localhost` when `VERCEL_ENV` isn't production) picked from the
  request's Origin; discoverable credentials, **user verification REQUIRED**, attestation none, ES256 + RS256.
  - `pkch/{uid}/{r|a}` — the ONE live challenge a device holds per kind, 5 min, taken ONCE in a transaction (a replay, another device's challenge,
    an expired one → `pk_stale`); the origin + RP ID inside the signed answer checked by the library (a phishing origin → `pk_bad`).
  - `pkc/{pid}/{h}` = `{ id, pk, c, rp, n, at, u?, tr?, bk? }` (h = sha256(credential id) · 32 hex) + `pkx/{h}` = pid (the sign-in's lookup) + the
    opaque user handle `ppriv/{pid}/wh` (never the pid). Up to 10 a profile. The SIGNATURE COUNTER: a lower count → refused (a cloned key).
  - Sign-ins count in the restore key's buckets (`profiles.js#signInLimit`: 10 an hour a device, 40 an IP); both join through `linkDevice`.
  - REMOVE drops `pkc` + `pkx`; the answer carries what the browser's Signal API needs (`signalAllAcceptedCredentials`) to drop it from the phone's
    list too (Chrome does — the virtual authenticator proved it); without it the phone still offers it and the server answers `pk_unknown`.
  - **No rule names these nodes** — the root's `.read/.write: false` keeps every phone out (rules.test "PASSKEYS"). A blank profile deleted on a
    restore takes its passkeys with it.
- **The phone** (`js/profile/passkey.js` — hand-written JSON ↔ ArrayBuffer, no library; `passkey-ui.js` — the ACCOUNT block + the sign-in button,
  css/board.css `pk-`): nothing stored beyond what the browser keeps; a cancel = "Cancelled — nothing changed"; /api down = the button answers with
  the usual readable message; a browser without WebAuthn draws no button (the key still works).
- Proof: `server.test.mjs` PASSKEYS (`kit/soft-authenticator.mjs` — a real P-256 key, real CBOR, real signatures), `rules.test.mjs` PASSKEYS,
  `e2e-profiles.mjs` 6p (Chromium's CDP virtual authenticator: add → clear site data → sign in → the same card → remove), `wk-keychain.mjs` (WebKit
  402×874 @3 draws the buttons — Playwright's Windows WebKit lacks `navigator.credentials`, so an inert stand-in; the real Face ID = the owner's iPhone).

## BOARD 2.0 A — THE NEW BOARDS' SERVER + DATA (Nov 9 2026 — docs/harbor/passes/board-2a.md)
- **THE OVERALL BOARD `xp`** (`core/boards.js#OVERALL_BOARDS` — `kind: 'overall'`, no game): THIS WEEK = the XP earned since Monday 00:00 ET
  (`pstats.xw = { wk, x }` — `core/progress.js#payXp`, the ONE XP payment every step uses), ALL TIME = the total XP. `lb/xp/{period}/{pid}` written
  by the server in the SAME update as `profiles/{pid}/x` (`api/_lib/stats.js`, `api/daily.js` → `lb.js#overallPaths` over the pure
  `core/overall.js`); a replay writes nothing. The listing rules unchanged; YOUR rank via `ranks`.
- **THE DAILIES' BOARDS** `daily` · `daily-password` · `daily-coastclear` (DAILY POINTS — docs/progression.md "DAILY POINTS"): THIS WEEK = the
  week's points, ALL TIME = the average a day × 100 (`allFmt: 'avg'`) from 10 days played; listed from the 3rd DAY PLAYED (`lb.js#hiddenOf` —
  'opt' hides every board, 'matches' only the room boards); `ranks` adds `mine: { avg, days, need }` on a points board.
- **THE ROWS**: a public row = `{ id, n, a, c, r, l, cd, es, tb, g, rank, v }` (`api/board.js#ROW_KEYS`) — + the SLIM CARD's display ids (the worn
  card, the emblem shape, its tube, the name glow); never the pid, the key, the tag's digits, the member Nº.
- **THE PLAYER PAGE's DATA**: `player { pid } | { b, bid } | { id }` → `{ rel, card, band, streak, top, limited? }` (`api/_lib/player.js`): `rel`
  from YOUR list; `top` = the TOP 3 RAREST achievements they hold WITH their names — **THE APPROVED EXCEPTION** to ITEM NAMES ONLY TO OWNERS (the
  owner, Nov 9: only those 3, only on this answer — `tests/vault-names.test.mjs` allows exactly `api/_lib/player.js`); hidden / banned /
  opted-out / blocked-you → `limited` (the name + the emblem). Never stats, the best game, matches, wins. 120 a uid / 10 min; cached 30 s.
- **`/api/daily points`** → YOUR + YOUR TABLE's daily points (`{ week, all, avg, days }` a board — your friends list only).
- **THE BACK-FILL** (`/admin` → THE BOARDS → PREVIEW → BACK-FILL NOW — `boardsBackfill`, admins only, audited, idempotent): THIS WEEK's XP from the
  match records + the week's daily runs; DAILY POINTS from every counted result since the dailies went live. The owner runs it ONCE after the deploy.

## BOARD 2.0 B — THE SCREENS (Nov 9 2026 — docs/harbor/passes/board-2b.md)
- **THE BOARD's screens** (`js/board/view.js` — the app's screen, `/board`, the title's preview): THE TABS XP · DAILIES · OVERCLOCK · PRISM DROP
  (HOLD'EM IN THE CITY: + HOLD'EM — five on one row at 390, PRISM DROP's tab reads PRISM; see "THE HOLD'EM BOARD" below) (`TABS`; opens on XP, THIS WEEK; ALL TIME on every tab; a game without a tab → XP); every row = the player's SLIM CARD through
  `ui/strip-board.js` (the rank left, the score under the card with its unit — `unitOf`, ⋯ REPORT at the line's left, YOU framed + a YOU chip);
  YOUR card pinned at the foot with your exact rank (`ranks`) or "N MORE DAYS TO BE RANKED · YOUR AVERAGE 83.3" (`mine`) — **PD-1 GROUP 0: ONLY while your
  own card is NOT on screen in the list** (one IntersectionObserver on your row, ≥ 60 % in view = on screen — `view.js#watchMine`; NO DOUBLE "YOU");
  **THE TOP BAR = ☰ · ‹ · the music, nothing else** (the gold emblem / LV button that opened YOUR CARD is gone); THE BOARD's title on its own row
  with air under the buttons; the four tabs EQUAL (the selected one changes colour + fill only; the letter-spacing shrinks to fit, never a wrap); the top 10 built + SHOW
  ALL (pages as they scroll in, ≤ 100), ONE fx surface; A FRESH WEEK / NO ONE RANKED YET / THE BOARD IS DARK designed; the background = BLACK VELVET
  + GOLD DECO (the owner's pick — CSS + one SVG sunburst). The title's preview: the top three as slim cards. Proof: `board-preview.html`.
- **THE FRIENDS LIST** (YOU → FRIENDS — `profile/friends-ui.js#cardList`): SLIM CARDS, friends IN YOUR ROOM first (HERE — the only presence), then
  by THIS WEEK's XP (the friends answer's `wx` = `pstats/{pid}/xw` of each FRIEND only — never a request, a block or a suggestion; **PD-1: a friend who
  OPTED OUT of the public boards (`profiles/{pid}/h`) gets `wx: null` — no number under their card, sorted as 0; only they see their own**); the line under
  each card: ⋯ (REMOVE / BLOCK) · HERE · the XP; a tap = THE PLAYER PAGE. Preview: `friends-preview.html`.
- **THE PLAYER PAGE** (`js/profile/player-page.js#openPlayer` + `css/player.css`, prefix `pp-`): tap ANY name (a board row `{ b, bid }`, a friend
  `{ pid }`, a room's name tag, the podium) → a full sheet through THE COVER on THE LAYER STACK, reading ONLY `/api/profile player`: the full card
  (no member line) · LEVEL + the band + its line + the flame (`alive` only) · the 3 RAREST achievements (names + medals + "% OF PLAYERS" — the
  approved exception) · INVITE (a friend not in your room) or the friend button · ⋯ by `rel`. `limited` → the name + the emblem + "This member keeps
  their card private." (never says a block); /api down → the same from what the screen had. Your own name → YOUR CARD. The room's MAKE HOST + CREW
  rows ride under it. Proof: `e2e-profiles` 8b. **PD-1 GROUP 0: its backdrop is OPAQUE** (`css/player.css` — the list behind no longer shows through).

## THE HOLD'EM BOARD (HOLD'EM IN THE CITY, Nov 11 2026 — docs/harbor/passes/holdem-city.md)
- `holdem-tw` (`core/boards.js` — `GAME_BOARDS.holdem`, a career board with `tie: 'ko'`): **TOURNAMENT WINS** (pstats `g/gw.holdem.tw`), **KNOCKOUTS** the
  tie-break (`ko`), then the EARLIER to reach it (`ra` — the moment the standing last moved, `progress.js#matchStep` from a row's `reach`). ONE sort value
  (`boards.js#tieSort`: wins × 1e10 + min(KOs, 999) × 1e7 + the time left — seconds of the week for THIS WEEK, minutes since 2026 for ALL TIME); `tieOf` /
  `fmtValue` 'twko' show "3 WINS · 5 KOs". Written by `lb.js#boardPaths` in the SAME update as the match's stats; a public row = `ROW_KEYS` only.
- The counters ONLY from the dealer's record (`holdem-dealer.js#resultRows` → `match-report.js#holdemCounters`, bounded): a CASH session never counts, a
  match under the dealer's `COUNTS` never reports. Each result keeps `ko` per profile — **THE BACK-FILL** (/admin → THE BOARDS) rebuilds the wins from
  every counted tournament on record and the knockouts from the records that keep them (from this pass on); never lower than the live counters.
- THE BOARD's HOLD'EM tab = this one board (`boards.js#tabBoards` — no RECORDS / CAREER switch) + its one-line explainer (`def.note`, `.bd-note`).

## FR7 FIXES A (Nov 12 2026 — docs/harbor/passes/fr7-fixes-a.md)
- **THE REAL PLAYER COUNT, IN THAT ROOM** (the owner's decision 6): a player who LEFT after the match counts toward the pay only with their OWN node of
  THAT match in THAT room (`api/report.js#PROOF_PATHS` — PRISM's board `prism/{m}/{uid}`, OVERCLOCK's first challenge's board / combo marks): only that
  uid could write it, only in play. An account that merely exists pays nothing (`server.test` "FR7-A C1").
- **THE DAILY CEILING** + **THE RESET EPOCH**: docs/progression.md "FR7 FIXES A".
- **THE NAMES** (FR7-A C6): THE PLAYER PAGE (`api/_lib/player.js`) shows a rude username as its HOUSE NICKNAME unless you are that player or their
  friend; the friends list's REQUESTS (in + out) + the blocked go through `publicName` too (`api/_lib/friends.js`). The friends + the recent players keep
  their names (you saw them in your room).
- **THE INITIATE GUARD** (FR7-A B2): `host.js#startGameNow` refuses a start while the room's game runs and isn't at its podium (`core/room-logic.js#gameRunning`).

## FR7 FIXES B (Nov 12 — docs/harbor/passes/fr7-fixes-b.md)
- **THE PROGRESS RESET** now also clears COUNTED PLAYS (`cp` — the owner: a veteran is listed again after 3 counted plays, like everyone; the back-fill
  counts plays only after THE RESET EPOCH), carries every freeze a player holds into the new streak (`core/streak.js`), and sweeps FOUNDING MEMBER
  only while the founder window is OPEN. The owner's steps: `docs/launch.md`.
- **A SEAT IS NOT A PLAY** (`api/report.js#PROOF_TREES`): every credited uid needs its OWN node of the match in that room (PRISM's board; any OVERCLOCK
  challenge's board / combo marks / sealed picks) — dropped BEFORE THE REAL PLAYER COUNT; the walk back to the room keeps those nodes (+ the seal) for a
  late report (`games/registry.js#PROOF_NODE_LIST`); HOLD'EM = the dealer, untouched.
- `/admin` STATS + the radio's open rooms: the LIVE rooms through the index (`api/_lib/rooms-live.js`), never the whole rooms tree.
