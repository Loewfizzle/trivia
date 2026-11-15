# THE REVIEW — Nov 15 2026 (report only)

Scope: `git diff 998d2c91 HEAD` (DFIX5 + CITY A–E, 56 commits, 257 files, +8,552 / −1,558) at `385e0d6b`.
Nothing in the repo was changed except this file (uncommitted). No commit, push or deploy. The live site was never touched.
Confirm runs used my own emulators + `serve.mjs --emu`, both stopped at the end (Ben's `:5190` left running).

**Labels.** CONFIRMED = reproduced, or the code path is unambiguous (the "how" is stated). PLAUSIBLE = reasoned from the code, the trigger not reproduced.
**Scope.** S ≤ 2 h · M = half a day to a day · L = more than a day.

**The short version**

| # | Finding | Sev. | Label |
| --- | --- | --- | --- |
| A1 | `/admin` does not load at all on this build — a function declared twice | HIGH | CONFIRMED |
| A2 | Share card: "one a player a day" is not held under parallel uploads — one account can fill the database | HIGH | CONFIRMED |
| A3 | The cloud has had a red job on five tagged pushes in a row, so A1's red was not seen; two unit files can never pass there | MED | CONFIRMED |
| A4 | Share card: every finisher uploads on every page load, and each upload kills the link already sent | MED | CONFIRMED |
| A5 | Share card: any bytes behind a PNG header are accepted and served from the site; a deleted card stays cached up to 7 days | MED | CONFIRMED |
| A6 | Nightly backup: a node with few big children (`dly`) cannot be split — the backup will fail every night once it grows | MED | CONFIRMED |
| A7 | Audio: a blur that coincides with an audio interruption leaves the sound off until the next hide / show | MED | CONFIRMED (code path) |
| A8 | Tap watch: a touch that only stops a scrolling list opens the row under the finger | MED | PLAUSIBLE |
| A9 | Dailies: a refused move can be answered from a stale cached record with no database check | LOW–MED | PLAUSIBLE |
| A10–A17 | Eight low findings (SCORES' stale mark, the live lane, two tap-watch edges, the add-me link, muted audio, the PC backup task, the share page's host) | LOW | mixed |

---

## FIRST — CITY E's cloud runs on `385e0d6b`

Both runs are **red**.

**`tests` (run 43761771100) — red, both jobs.**

| Job | Result | The failing check | In code CITY E touched? |
| --- | --- | --- | --- |
| unit + whole-match simulations | red — 1,984 of 1,986 | `tests/backup.test.mjs` and `tests/killed-page.test.mjs`: `Cannot find package 'firebase-admin' imported from api/_lib/fb.js` | `backup.test.mjs` yes (CITY E, `5d811af7`). `killed-page.test.mjs` is CITY D's (`2cc60c82`) and was red on CITY D's run too. |
| rules + /api + smoke | red | Rules 82 / 82, `/api` 62 / 62 and every other emulator suite pass. Then `e2e-conn.mjs`: `ADMIN pageerror: Identifier 'backups' has already been declared` | **Yes** — CITY E group 5 (`5d811af7`). This is finding A1: a real bug, not a flake. |

**`harbor` (run 43761771126) — red, 13 of 15 jobs green.**

| Job | Result | The failing check | In code CITY E touched? |
| --- | --- | --- | --- |
| `lobby` | red, 77 / 78 | NO TWO CAMERAS — "HOURS hidden — the clock +10 h": an item's copy 47 pt away 0.25 s after the return | No. CITY E changed nothing under `js/screens/harbor/` or `js/core/`. The same check was red on CITY B's and CITY D's runs and green on CITY C's — intermittent. |
| `windows` | red, 88 / 91 | THE UPPER PANES EQUAL (day) · THE MARQUEE (brightest bulb 93) · THE GHOST'S EYES + MOUTH | No. Red on CITY C's, D's and E's runs. I ran `ONLY=windows` locally today: **59 / 59 green** (243 s). The cloud log shows the scene drawn at 1.5× ("18×34 at 1.5×"; local: "24×45 at 2×"), so the slow runner stepped a tier down. The first red run is CITY C's, which added THE ONE-STALL RULE — the likely cause, not verified. |

The pattern matters more than any one red: the last five tagged pushes — the closes of CITY A (`b52c8dca`), B (`0fe25507`), C (`0973fed6`), D (`b724fc8d`) and E — each had at least one red job (see A3).

---

## PART A — findings

### A1 — `/admin` does not load: `backups` is declared twice · HIGH · CONFIRMED

- **Where:** `js/admin/admin.js:367` (the progress-reset backups list, Nov 4) and `js/admin/admin.js:584` (CITY E's nightly BACKUPS row). Both are `async function backups()` at the top level of one ES module.
- **Failure:** a module may not declare the same name twice, so the whole file fails to parse. `admin.html:22` loads only this file, so `/admin` shows nothing on the deployed build: GIFTS, THE DAILIES (GO LIVE AT THE NEXT 4 AM, RESEED), SHARE CARDS delete, the errors, the BACKUPS row, the progress reset — all unreachable. The STATS sheet in the ☰ menu is not affected (`js/admin/stats-view.js`).
- **How confirmed:** `node --check js/admin/admin.js` → `SyntaxError: Identifier 'backups' has already been declared`. The cloud's `e2e-conn.mjs` reports the same page error. I syntax-checked all 808 shipped `js/`, `api/` and `sw.js` files: this is the only one that fails.
- **Why it got through:** CITY E's final local list (unit, `/api`, share-card, backup, smoke, e2e-daily, wk-press, wk-board-taps, harbor vault / tapfit / shell) never opens `/admin`. Only `e2e-conn.mjs` does (`:215`), and that ran only in the cloud.
- **Smallest fix:** rename the CITY E function to `nightlyBackups` — its definition at `:584` and its call at `:180` (the call at `:187` is the old one).
- **The test:** add `/admin`, `/board`, `/lab` and `/daychart` to `e2e-smoke.mjs` as "loads with no page error". Plus a seconds-long unit test: no shipped module declares a top-level name twice.
- **Scope:** S (15 min + the tests 1 h). **Risk:** none.

### A2 — Share card: parallel uploads from one player all stay · HIGH · CONFIRMED

- **Where:** `api/_lib/share-card.js:82-92`. The earlier card is read (`shrp/{pid}/{day}`), then a new code is written and the old one deleted in a plain multi-path update — no transaction.
- **Failure:** N uploads sent at once all read the same "old" pointer, so each writes its own card and only that one old card is deleted.
- **How confirmed (emulators):** 12 `shareCard` calls at once from one player → 12 accepted, **12 cards live**. Three more waves → **45 cards live** for one player, one day.
- **Impact:** a card may be 400 KB (410 KB stored). THE CALL BUDGET allows 400 calls per 10 minutes per phone (`api/daily.js` `CALLS`), so one account that finished one daily can add roughly 160 MB per 10 minutes. The free Spark plan stores 1 GB: about an hour to fill it. Over a Spark limit Firebase restricts or switches off the database (its documented behaviour — not tested here), which would stop rooms, results and progress for everyone. The orphans are swept only after 7 days (`sweepShares`).
- **Smallest fix:** claim the slot in a transaction on `shrp/{pid}/{day}` (set the new code, get back the previous one), then delete the previous card. Add a small per-player daily cap on uploads (for example 10) with `take()`.
- **The test:** in `tests/integration/share-card.test.mjs`: 12 uploads at once → exactly 1 child of `shr/` for that player.
- **Scope:** S (1–2 h). **Risk:** low.

### A3 — The cloud is red by default, and two unit files can never pass there · MED · CONFIRMED

- **What:** the unit job runs `node --test tests/*.test.mjs` with no install (`.github/workflows/tests.yml:36-41`). `tests/killed-page.test.mjs:7` imports `api/log.js` and `tests/backup.test.mjs:8` imports `api/_lib/backup.js`; both reach `api/_lib/fb.js`, which imports `firebase-admin`. They pass on the mini PC (it has `node_modules`) and fail in the cloud, every run, since CITY D.
- **Why it matters:** with the unit job, `windows` and often `lobby` red on every run, a red run stopped meaning anything. A1 was reported by the cloud and still shipped.
- **Smallest fix:** (1) add `npm ci` to the unit job, or move those two tests' server-reaching halves into `tests/integration/`. (2) One line in CLAUDE.md's Testing section: a `tests/*.test.mjs` unit test never imports a file that reaches `api/_lib/fb.js`. (3) Decide the two harbor reds: let the `windows` checks accept the 1.5× tier (or pin the tier in that group), and fix or quarantine the `lobby` camera check.
- **The test:** a unit test that walks each unit file's static imports and fails if one reaches `fb.js`.
- **Scope:** S for (1) + (2); M for the harbor reds. **Risk:** none.

### A4 — Share card: every finisher uploads on every page load, and each upload kills the link already sent · MED · CONFIRMED (by reading; the replace is pinned by the pass's own test)

- **Where:** `js/screens/daily.js:211` warms the card whenever the DAILY screen shows the SHARE button; `:520-528` keeps the handle only in memory, keyed by day, look, streak and scores. `js/daily/share.js:229` uploads inside that build. The server always mints a new code and deletes the old card (`share-card.js:85-91`).
- **Failure 1 — dead links:** a player shares the link at 9 am. At noon they reopen the app (a new page load, or the look turning from day to night) and open DAILY. A new card is uploaded, the 9 am code is deleted, and that link now redirects to the home page with the site's generic preview (once the page's 1-hour edge copy expires). Previews already fetched by a chat app are unaffected; anything fetched later is.
- **Failure 2 — cost:** the upload is made for every player who finishes a daily and sees the screen, not only for those who share — 80–250 KB of the phone's data per page load, and a 105–330 KB database write each time.
- **Capacity:** at about 220 KB stored per card and 7 days kept, roughly 650 daily finishers fill the Spark plan's 1 GB with share cards alone. For scale, CITY E measured all the durable data of 4,000 players at 1.7 MB gzipped.
- **Smallest fix, in order of value:**
  1. The server keeps the SAME code when the uploaded bytes are identical (store a sha256 beside the card; equal → return the existing code, write nothing).
  2. The phone remembers `{ share key → link }` for the day in `localStorage` and skips the upload.
  3. Cut the size: a JPEG at 540 × 675 is about 40–70 KB (estimate, not measured), and keep 2–3 days instead of 7.
- **The test:** share-card test — the same PNG twice → the same code, one write. Daily preview — a reload does not call `shareCard` again.
- **Scope:** S for 1 + 2; M with the format change. **Risk:** the format change touches `checkPng` and needs the link previews re-checked in a real chat app.

### A5 — Share card: the "picture" is not checked, and a deleted card stays cached · MED · CONFIRMED

- **Where:** `api/_lib/share-card.js:29-35` checks the 8 signature bytes, the `IHDR` tag and the two size fields — 24 bytes. `api/daily.js:578` serves it with `max-age=86400, s-maxage=604800, immutable`; the page at `:586` with `s-maxage=3600`.
- **How confirmed (emulators):** a 33-byte PNG header followed by HTML text and 300 KB of random bytes was accepted and served back as `image/png`, 307,281 bytes, with the 7-day header.
- **What an attacker can put on a neonspeakeasy.com link:** any 540 × 675 image (or any 400 KB of data), shown as the preview of a link titled "NAME · THE DAILIES · Nov 15". It needs one finished daily; a same-day throwaway account works too, because only `dly/{g}/{day}/r/{pid}` is read and the NOT COUNTED mark is never looked at. The name is safe (escaped, and a rude one becomes its house nickname).
- **Deleting does not unpublish:** `/admin → SHARE CARDS → DELETE` removes the database copy, but the edge keeps serving the picture for up to 7 days and browsers for a day. An expired card can likewise be served up to 7 days past its 7. (And today `/admin` does not load — A1.)
- **Fix:**
  1. Picture cache: `s-maxage` of an hour or a day, not a week (link previews are fetched within minutes of a share).
  2. `docs/backup.md` / `docs/launch.md`: "after deleting a card, purge the CDN cache in Vercel" (or push a tagged deploy — one copy per deploy).
  3. Accept only accounts whose results count (skip `x/`), so a throwaway cannot upload.
  4. Optional: parse the PNG's chunks to the `IEND` (rejects non-images; it cannot judge what the picture shows).
- **The test:** share-card test — a header-only "PNG" is refused; a NOT COUNTED finisher is refused; the picture's `s-maxage` ≤ 86,400.
- **Scope:** S. **Trade-off:** a shorter edge cache means more function calls + database reads for a popular link (about 330 KB a miss).

### A6 — Nightly backup: the split cannot split `dly` · MED · CONFIRMED

- **Where:** `api/_lib/backup.js:57-67`. A part over 4.2 MB is split by a hash of its FIRST-LEVEL keys only.
- **Failure:** `dly` has one child per daily (three). `backups` has one per reset, `lb` one per board. When one child alone passes Vercel's 4.5 MB answer limit, its slice can never fit: the function answers an error, `fetch.sh` / `fetch.ps1` exit 1, and the backup fails every night from then on. `docs/backup.md:51-52` says "`dly` splits by itself" — it does not.
- **How confirmed (emulators):** `dly` seeded with three 40 KB children, `BACKUP_PART_MAX=20000` → split into 13 slices; 10 are empty and **3 are over the limit** (40,252 / 40,254 / 40,252 bytes), with no further split possible.
- **When:** `dly` was already the biggest part in CITY E's own measurement (1.12 MB of 1.70 MB for 30 seeded days), and it grows with every day played, not only with players.
- **Also:** every slice request re-reads and re-compresses the WHOLE node (`:59`), so a node split k ways is downloaded k + 1 times per copy, twice a night. Spark allows 10 GB of downloads a month.
- **It fails loudly, not silently:** no artifact, and /admin's BACKUPS row turns red after 36 h — once `/admin` loads again.
- **Fix:** let the index list deeper parts for the deep nodes (`dly/<game>`, then `dly/<game>/<month>`; `backups/<stamp>`; `lb/<board>`), and read a slice by key range (`orderByKey().startAt().endAt()`) instead of filtering the whole node. Correct the doc line.
- **The test:** `tests/integration/backup.test.mjs` — a node with 3 big children at a small `BACKUP_PART_MAX` → every answered part is under the limit and the restore is identical.
- **Scope:** M (3–5 h). **Risk:** low — the restore script already merges parts by name.

### A7 — Audio: a blur plus an interrupted context leaves the master at 0 · MED · CONFIRMED on the code path (the real-iPhone trigger is PLAUSIBLE)

- **Where:** `js/audio/engine.js:417-430` (`onBlur` / `blurBack`, CITY D group 2).
- **Failure:** on a touch phone a window `blur` with the page still visible sets the master to 0 at once. If the system takes the audio in that same moment (state `interrupted` — Siri, a call, an alarm, the microphone prompt), `blurBack()` 400 ms later sees a context that is not running and takes the `else resumeBeds()` branch. `pendingFadeIn` is never set, so when the context runs again nothing ramps the master back. Later taps see `running` and do nothing. Sound is off until the next hide / show or a mute toggle. OVERCLOCK's loop is not restarted either.
- **How confirmed:** a node script driving the real `engine.js` with a fake AudioContext — "ctx running again + focus: state running · master 0", and the same after another tap. `C:\Users\benja\AppData\Local\Temp\claude\768e0aae837f99ba\22072b64-df33-4d62-8a62-5459829a387c\scratchpad\phone\audio-blur.mjs`
- **Smallest fix:** in `blurBack()`, when the context exists, is not hushed and is not running: set `pendingFadeIn = true`, ask for a resume, and do not call `resumeBeds()` there.
- **The test:** a unit test with the fake context: blur → `interrupted` → 450 ms → `running` ⇒ master 1 and the bed resumed. `tests/integration/audio-leave.mjs` covers only a blur with the context still running.
- **Scope:** S (1 h). **Risk:** low.

### A8 — Tap watch: stopping a scrolling list acts on the row · MED · PLAUSIBLE (needs one check on an iPhone)

- **Where:** `js/ui/tapwatch.js:100-103` (`pressActs`) and `:253-265` (the act at the lift).
- **Failure:** fling THE BOARD's list, the friends list or the guests list, then touch it to stop the scroll. The touch is short, travels under 10 px and is not cancelled, so the press + lift path clicks the row and that player's page opens. Safari deliberately sends no click for such a touch. Before CITY A the rescue did the same 350 ms later, which may explain some LOST TAP reports.
- **Not verified:** whether iOS delivers pointerdown / pointerup for that touch.
- **Smallest fix:** one passive capture `scroll` listener stamping the time; a press that begins within about 120 ms of a scroll never acts and is never rescued.
- **The test:** Chromium touch emulation — a fling on `.bd-rows`, a tap mid-fling ⇒ no player page, `stats.pressed` unchanged.
- **Scope:** S (1–2 h).

### A9 — Dailies, THE HELD RUN: a refusal can come from a stale record · LOW–MED · PLAUSIBLE

- **Where:** `api/daily.js:113-123` (the listener kept between calls, DFIX5) and `:292` (`return rec !== cur ? rec : undefined`).
- **Failure:** a warm function now answers from the record its kept listener cached. When the move changes the record, the database checks it and retries on the real one — safe. When the move is refused or changes nothing, the transaction returns `undefined` and ends locally, with no database check. If that cached record is stale (the function was frozen while another instance handled a move), the phone gets a wrong refusal. Example: pause on instance X, resume on Y, a dig on X → "The run is paused" while the clock runs.
- **Not verified:** how often a thawed Vercel function serves a call before its socket has caught up. Before DFIX5 each call read fresh.
- **Smallest fix:** when the outcome is a refusal or a no-op and the record came from a held listener, read the record once from the server (`ref.get()`) and judge again. Moves that change something stay at one round trip.
- **The test:** `coastclear.test.mjs` — take the Admin SDK offline, change the record through the emulator's REST door, send a move that the stale copy would refuse ⇒ not refused.
- **Scope:** S–M (2–3 h).

### Low findings

| # | What + where | Label | Smallest fix + test |
| --- | --- | --- | --- |
| A10 | **SCORES → ALL TIME:** when the fetch fails, the kept list stays and its UPDATING mark is removed, with no retry that visit — this morning's numbers read as current. `js/screens/daily.js:372`, `:407` | CONFIRMED (reading) | Keep the mark (or "COULDN'T UPDATE") on a failure. Preview with a rejecting `/api` ⇒ `.dy-upd` still there. |
| A11 | **THE LIVE LANE:** `pump()` can start a strip whose record was already forgotten (a list destroyed within 1–3 frames) — one canvas outside the ≤ 3 count until the renderer's sweep. `js/ui/live-lane.js:45-50` | CONFIRMED (reading) | `if (r && recs.get(r.el) === r && …) start(r)`. Unit: add 3, destroy before the first frame ⇒ `laneStats.made === 0`. |
| A12 | **Tap watch:** after a press-act with no click from iOS, `took` lives 800 ms; a second tap in that window on a control that needs its real click has it swallowed — inside a game the tap is lost. `js/ui/tapwatch.js:260`, `:274` | CONFIRMED (reading) | `took = null` at the top of `onDown`. Unit in `tapwatch.test.mjs`. |
| A13 | **Tap watch:** a share / copy control re-rendered between down and up never acts (the twin lookup only finds `[data-press]`, and the rescue refuses gesture controls). `js/ui/tapwatch.js:257` | CONFIRMED (reading) | Look the twin up with the gesture + implicit selectors too. `wk-press` case. |
| A14 | **The add-me link** is removed from storage before its fetch; a failed fetch loses "ADD NAME?" for good. `js/screens/title.js:993` | CONFIRMED (reading) | Remove the key only after an answer. |
| A15 | **Muted at load (Chrome / Android):** the first tap creates a context that then starts itself — NOTHING RUNS is not held until the next tap. `js/audio/engine.js:136-139` | PLAUSIBLE | In `onstatechange`: running while hushed → hush. `audio-leave.mjs` case. |
| A16 | **The PC's backup task** is registered `LogonType Interactive` (`scripts/backup/install.ps1:26`): after a reboot with nobody signed in, no second copy until Ben signs in. | CONFIRMED (reading) | Document it, or register it to run whether signed in or not. |
| A17 | **Share links' host:** the preview page builds its URLs from `x-forwarded-host` (`api/daily.js:566`). The value is escaped, so nothing breaks out. | CONFIRMED (reading), no exploit found | Use the canonical origin. |

### One device check

CITY D moved share / copy / passkeys to act inside the touch's `pointerup` (`js/ui/tapwatch.js:51-55`) and swallows the click that follows. It was proven only in Playwright's WebKit. If real iOS Safari does not count that `pointerup` as a user activation, every share and copy on a phone silently fails. Check once on the iPhone: SAVE YOUR KEY → SHARE and COPY, and SHARE TODAY. A cheap hedge: skip the early act when `navigator.userActivation.isActive` is false at the lift.

### Looked at, found sound

- **Backup token:** constant-time compare on hashes; no env token → 404; 256-bit token made by a crypto RNG; the token file is readable by Ben's user only (`install.ps1:19`); never printed; the workflow reads it from a repo secret; answers are `no-store`.
- **What is in / out of the export:** I scanned every literal database path in `api/` more widely than the pass's own test, plus every top-level node in `database.rules.json`: none is unclassified. `dsecret` and `dsched` are left out. The restore script refuses anything but the emulators and checks every checksum first.
- **Share code:** 9 random bytes (72 bits), never derived from a pid. The page escapes the name; no pid on the page. The day is the 4 am streak day, today or yesterday only.
- **Friends:** `flink/` codes are 7 characters of a 31-letter alphabet, made by the server, one per profile, refused for a same-day profile; `friendLinkGet` returns a face with no pid or board id; the request push is held to one a day per sender and receiver (`take` arguments checked against `limit.js`).
- **STATS:** `statsSheet` and `dailyWho` sit behind the admin gate; rows point at faces by index, no pid; `progress/` is not in the rules, so `progress/statsSnap` and `progress/backup` are server-only.
- **EVERYONE ON SCORES:** public faces by board id only; scores and spots only once you have finished that daily; hidden profiles left out; the day is the streak day.
- **Phone side:** no double act and no lost act in the tap watch's main paths (keyboard and screen-reader clicks pass once; forms keep their real click); the live lane's cap is page-wide and its observers are released; `dropKey` and the `nd:drop` cache; the SCORES cache key (streak day from server time, dropped on a pid change); `errlog.js#markScreen` does not report a normal reload.

---

## PART B — the maintenance questions

### B1 — THE FROZEN GAMES

**What they cost today (measured):**

| Thing | Frozen ten | Share |
| --- | --- | --- |
| `js/games/<id>/` | 84 files, 1,057 KB, 20,258 lines | 39 % of `js/games`, 9.4 % of `js/` |
| CSS / data / docs | 234 KB / 200 KB / 47 KB | 17 % of `css/` |
| Songs | 66.6 MB (already out of deploys) | — |
| Unit tests | 17 files, 170 tests, 5–7 s of a 42 s run | 8.5 % of tests, 12–16 % of the time |
| E2E + previews | 8 E2E files, 2 probes, 6 previews, 205 KB — **nothing runs them and they can no longer pass** (`startGame` refuses, `js/host.js:246`) | dead |
| Rules | 882 lines, 52 KB | 56 % of `database.rules.json` |
| Rules tests | 22 of 82 | 27 % |
| Boot graph (every phone) | about 50 KB: ten art tiles (`js/ui/game-art.js`), ten rule sheets (`js/ui/help.js`), ten marks, music and sfx rows, themes | 2.4 % of boot |
| Server | `api/report.js` parses 121 KB of frozen logic on every cold start (through `js/core/match-report.js`) | — |

**The shared call sites that exist only for them** (the real long-term weight):

- `js/room.js:72` `ROOM_SIDE_NODES` — 6 of 8 are frozen-only, and `:109` and `:178` remove them **one after another** on every room open: six wasted round trips for every player who opens a room. The one measurable per-player cost.
- `js/games/registry.js:84` — 20 of 24 `ALL_PLAYER_NODES` are frozen-only; every match start writes 20 null paths for them (`js/host.js:359`).
- `js/core/match-report.js` (about 150 of 392 lines), `js/core/boards.js:16-34`, `js/chat/logic.js:28-71`, the signs' tables, `js/core/harbor-remote.js:41`.
- Four separate exemption lists that drift: `tests/shell.test.mjs:11`, `tests/lazy-import.test.mjs:22`, `tests/audio-hush.test.mjs:62` (names only 7 of the 10), `tests/cartridge.test.mjs:27`. Every new whole-tree rule either makes the frozen files comply or adds a fifth list.
- CIPHER is the standard fixture of the `/api` suite (`tests/integration/server.test.mjs:117`, `:319-351`) and of `e2e-profiles.mjs:65` — a frozen game is load-bearing for live-feature tests.
- Two files in frozen folders are used by playable code and cannot go with them: `js/games/cipher/words.js` (OVERCLOCK) and `js/games/pulse/clock.js` (the boot graph + PRISM's audio).

**How hidden they really are.** `playable` is the one switch for OFFERING a game, not for LOADING one. `loadGame` has no playable check (`js/games/registry.js:42-50`) and the rules let a host write any `game`. A host who flips the flag in devtools can run a frozen game for their room; every guest phone then downloads and mounts its view. It pays nothing — the server refuses every non-playable id (`api/report.js:76-80`, `:147-149`). Low harm, but the frozen UI is reachable production code, not inert.

**Earned progress.** No achievement, item or card is tied to a frozen game. What names them is plain numbers: `pstats/{pid}/g/{gid}`, `lb/<board>` rows, `results/*.g`, `gplay/`. Readers already tolerate unknown ids. Rule for any removal: never reuse a frozen board id or stat key.

**The options:**

| Option | Cost | Risk | A revive of one game |
| --- | --- | --- | --- |
| (a) Keep as is | 0 h now; the costs above go on, and the views keep rotting unseen (they were built for the retired lobby) | The devtools path stays; dead E2Es read as coverage | M–L, 1–3 days: the logic and rules are ready; the view must be ported to the room-in-the-city console, the shell and the tap rules; a new E2E; a server proof path |
| (b) A "keep compatible" contract | S–M, 4–7 h, one pass, **no rules change** | Low | The same as (a), plus taking the id off one list |
| (c) Archive to a tag + remove | L, 2–3 days in two passes (code first; rules at least one deploy later) | A wide diff across boot files, the report path and the `/api` suite. A phone on an older build clears all 24 player nodes in one atomic write at a start — with a node's rule gone that start is refused, so the rules must trail the code or stay | L, 3–5 days: everything in (a) plus about 15 re-wiring sites that will have drifted |

**Option (b) in steps:**

1. One list — `FROZEN_IDS` derived in `js/config.js` — imported by the four tests and by `lobby2.mjs`; a short "THE FROZEN CONTRACT" paragraph in `docs/cartridge.md`: the pure `logic.js` + `director.js` stay importable and their sims green; views, CSS, E2E, previews and help are not maintained and never loaded.
2. `loadGame` returns null for a frozen id (an emulator-only switch for tests). This makes "never loaded" true.
3. Delete or park the 8 dead E2Es, 2 probes and 6 previews.
4. Quick win: `js/room.js:109` / `:178` → one multi-path remove.
5. Quick win: move the frozen art, help and marks into a lazy file (about 42 KB out of boot).
6. Re-base `server.test.mjs` and `e2e-profiles.mjs` from CIPHER to a playable game (about a day — worth doing under any option).

**Proof nothing changed:** the unit suite, `e2e-smoke.mjs` (its "10 hidden" check), the three games' FAST E2Es, `boot-budget` (downward), harbor `cartridge` + `room`.

**Recommendation: (b) now. (c) only per game, once the owner decides a game is never coming back.** The real costs are small and fixable in half a day without deleting anything. (c) mostly buys tidiness, at 2–3 days and a rules-order hazard, right before a launch, and makes a revive clearly harder while NEON PAR and HIGH STAKES are still described as next on deck. **The owner decides.**

### B2 — THE CARTRIDGE / MATCH-KIT SURFACE

**Where the contract is broader or looser than it needs to be:**

- **Nothing checks a cartridge at run time.** `checkCartridge` has no caller in `js/` (`js/games/cartridge.js:74`); it runs only in tests. A missing `livePaths` throws on every host tick; a missing `finalRanks` silently writes no night entry; a `start()` result without `matchId` is written as it is (`js/host.js:267-273`).
- **The console reads hooks the contract never declares:** `soloPause` / `soloResume` (`js/host.js:150`), `shareRun` (`js/ui/final.js:109`), `cleanSettings`, `endGame` / `endGameLine` (`js/ui/settings-panel.js:285`), `NO_INTERCOM`. And it reads fields of `game` itself — `phase === 'final'`, `phaseStartAt`, `unseal`, `participants`, and PRISM's `pz` by name (`js/host.js:168`).
- **A hidden rate limit:** a step that leaves `phase` and `phaseStartAt` alone lands at most once per 3 s (`js/host.js:175-177`). The docs say only "an in-flight guard". JAYWALK must know this.
- **Adding a game = about 20 hand-edited places, 3 generated files and 4 pinned test literals.** The pairs with NO cross-check today are the ones that fail silently:
  - `SOLO: true` in a meta without its `SOLO_OK` row (`js/core/match-report.js:343`): PLAY NOW works, then the server refuses the run.
  - `PROOF_NODE_LIST` (`registry.js:82`) against `api/report.js`'s proof tables: a missing row falls back silently, or a late report is refused.
  - A `livePaths` node missing from `ALL_PLAYER_NODES`: never wiped.
  - The smoke list, the help sheet (shows the first game's rules instead), the art, the theme.
- **The boot cap is nearly full:** `js/games` at boot is 34.97 of 36 KB (`tests/cartridge.test.mjs:124`); `cartridge.js` is 12 KB of it, mostly comments and the checker. JAYWALK's meta will not fit without a raise.
- **Game ids outside game folders** that the existing guard does not watch: `js/ui/settings-panel.js:124-163`, `js/ui/help.js:386`, `js/screens/title-taps.js:111` (`'jaywalk'` already), `js/core/match-report.js:37`, `:343-364`, `js/core/achievements.js:71`.
- **Clean:** no kit module imports a game; `host.js` has no branch by game id.

**Tightenings (do T5 → T1 → T2 → T3 before JAYWALK):**

| # | What + why | Scope | Files | Proof nothing changed | Risk / trade-off |
| --- | --- | --- | --- | --- | --- |
| T1 | **One registration cross-check test.** For every playable id, assert its row exists in each of the ~20 places, including the unchecked pairs above. No app code. These are exactly the mistakes JAYWALK would hit mid-launch. | S–M, 3–4 h | a new `tests/*.test.mjs` | Green on today's three games | Some tables are not exported, so it parses source like the existing tests |
| T2 | **Write down what the console already reads:** the undeclared hooks into `OPTIONAL`, the `game` frame and the 3 s rule into `docs/cartridge.md`; fix the stale copy of the contract at `registry.js:1-12`. | S, 1–2 h | `js/games/cartridge.js`, docs | `tests/cartridge.test.mjs`, harbor `cartridge` | `cartridge.js` is in the boot graph — do T5 first |
| T3 | **Fail at the start, not mid-match:** `startGameNow` checks the frame (`id`, `matchId`, `participants`, `phase`) and takes the existing COULD NOT START path; on localhost only, `loadGame` runs the checker and logs its list. | S, 1–2 h | `js/host.js`, `js/games/registry.js` | `e2e-smoke.mjs`, each game's FAST E2E, `e2e-playnow` | A false positive blocks a start — keep it to those four fields |
| T4 | **Grow the ctx, drop the store imports.** PRISM and OVERCLOCK import the store because the director's ctx is thin (`prism/index.js:7`, `overclock/index.js:10`). Add `players`, `presence`, `used` to the ctx; then a grep-test "no playable cartridge imports store.js". | S–M, 2–3 h | `js/host.js`, `js/screens/room-city.js`, the two `index.js` | The games' sims, `e2e-prism` FAST, `e2e-oc-new` FAST, smoke | OVERCLOCK's preload timing on a guest |
| T5 | **Split `cartridge.js`:** the five console readers stay in a tiny boot file; the tables and the checker leave boot. About 10 KB of boot back, so JAYWALK's meta fits without a named raise. | S, 1–2 h | `js/games/cartridge.js` + 3 importers | The boot-bytes check, `boot-budget`, `boot-preload`, `file-hashes` | One test regex edit |
| T6 | **Trim PRISM's graph:** `prism/view.js:15` imports the kit barrel and so wires six modules it never uses (about 25 KB a match). Import `kit/call.js` and `kit/moments.js` directly. | S, 0.5 h | `js/games/prism/view.js` + regenerate the graph | `preload-graph.test`, `game-budget.test`, `prism-skin-snap.mjs` identical, `e2e-prism` FAST | None found |
| T7 | **Widen the "console never names a game" guard** to settings-panel, help, title-taps and intercom, with today's ids allowed — so `jaywalk` in one of them is a visible decision. | S, 0.5–1 h | `tests/cartridge.test.mjs` | The test itself | `state.live.table` stays a listed exception |

Owner's call, not counted: OVERCLOCK still re-exports its switched-off daily (`js/games/overclock/index.js:165`), 13 KB in every match's graph; the docs say the plug-in stays.

### B3 — THE PLAYER FLOWS

I found no two timers doing the same job, and no guard that is plainly redundant. The three dead-start paths and the five idle-room paths each cover a different entry. The complexity is mostly the same question answered inline in many places.

| # | What + why | The phone problem it guards | Scope | Files | Proof | Risk / trade-off |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | **One admission verdict for JOIN and RESUME.** Both decide "may this player enter" inline, with slightly different shapes (`js/room.js:199-205` against `:245-248`). Extract a pure `entryVerdict` into `core/room-logic.js` with a unit test. | Refresh / rejoin, idle close, late joiner, the locked door, a kick — all kept | S, 2 h | `js/room.js`, `js/core/room-logic.js` | `e2e-smoke`, `e2e-conn`, `e2e-idle`, harbor `lobbyfix` / `leaveroom` | `tests/lobby-fixes.test.mjs:36-38` pins call order by regex |
| F2 | **Two HOST entry paths with different guards.** The dock races `createRoom` against a wait limit with single-flight (`js/screens/title-dock.js:385`); `js/screens/setup.js:126` calls it bare, so a first-time host at the connection cap could sit on ALLOCATING… (read from code, not reproduced). The 20 s wait for Firebase is copied four times. One `hostRoom()` + one `uplinkReady()`. | Lost signal, the 100-connection cap, a double tap | S, 1–2 h | `title-dock.js`, `setup.js`, `host.js` | `e2e-smoke`, `e2e-conn`, `e2e-playnow`, harbor `dock` | Setup gains the wait line — a small behaviour change to name |
| F3 | **"A match is on this screen" is written inline at least 12 times**, though `roomGameOn` exists (`js/app.js:213`); the looser "room is playing" has a different null guard at each site. Step 1: use the helper inside `app.js`. Step 2: a new pure core file for the lazy chunks. | QUIT TO THE ROOM, refresh routing | S, 1 h for step 1 | `js/app.js`, later chat / keypop / daily / settings-panel | `e2e-smoke`; harbor `gamestart`, `citypause`, `sololook` | `tests/shell-b2.test.mjs:73` pins `app.js:96` verbatim |
| F4 | **The room mirror is declared in three places.** `radioCrew` (`js/room.js:318`) is not in `EMPTY_ROOM` (`:34`), so room A's stamp survives into room B until B's listener fires (the radio's ask can flash — inferred, not reproduced). Add it, plus a unit test that every `listen()` key is reset. | Leave then join another room; one account, one room | S, 0.5–1 h | `js/room.js` | Harbor `crew` / `radio`, smoke | Removes a stale carry-over |
| F5 | **Presence: keep every line, pin the boundary.** `isOnline(state.presence, uid)` works only through the branch commented "the old shape" (`js/core/room-logic.js:69`) — it is the LIVE path for host election. A "remove legacy v1" cleanup would break it. Correct the comment and add the equivalence test. | Two connections, refresh, lock screen | S, 0.5 h | `room-logic.js`, `tests/room-logic.test.mjs` | `e2e-presence` | None |
| F6 | **Dead code** (no caller found by `git grep`): `state.busy` (`js/store.js:14`), `soloPauseNow` / `soloResumeNow` (`js/host.js:157-158`), `KIT_PREFIX` (`cartridge.js:68`), `getDb` (`js/firebase.js:186`, with its stub), the `?city=2` pass-through (`js/identity.js:78`). | None — dead | S, 0.5 h | those files | The unit suite, `errors-group.test.mjs` | Remove `getDb` and its stub together |
| F7 | **Pure tests that are missing.** `host.js`, `room.js` and `seat.js` cannot load in node, so these have no unit test: the step → one atomic update → night entry (`host.js:189-220`, the most useful for JAYWALK's sim), the leave plan (`room.js:473-492`), the stale-seat rule (`seat.js:27-30`, `:51-59`), the presence heal. Each needs a small extract to a pure function. | Host change, two tabs, lost signal, one account one room | S each, 1–2 h | a pure core file each | `e2e-conn`, `e2e-presence`, `e2e-gone`, `wk-twotabs` stay the black-box checks | Low |

Noted only: `kickPlayer` (`js/room.js:510`) has no host check in code, unlike `makeHost` and the door lock; the rules enforce it.

---

## PART C — CLAUDE.md

Size: 36,596 of 40,960 bytes (4,364 to spare). Around 170 named files, functions, tests and scripts were checked and exist. The corrections below save about 3,900 bytes if all are taken.

**Out of date or wrong (each verified against the repo):**

| Line | Now says | Should say / where it goes |
| --- | --- | --- |
| L5 | "`sign: true` = THE FIVE SIGNS in the city" | Delete — nothing reads `.sign` on a GAMES row any more (the signs come from `harbor-neon.js#signRoster`). The flag and its comment in `js/config.js:65-67` are stale too. |
| L33 | "`docs/password.md` · `docs/coastclear.md` — the two dailies" | Three dailies; add THE DROP → `docs/prism.md` "THE DROP". |
| L23 | `docs/title.md` row lists LIVING CITY, THE STREET | Those City 1.0 modules no longer exist; name the dock, THE SHELL, THE NEON TABS, the tap rules. |
| L77, L128, L164, L170, L198 | Five `#anchors` (`#the-one-day-line`, `#the-drop`, `#the-skins`, `#the-file-map`, `#city-20-in-claudemd--the-full-text`) | None resolves — each heading has a long tail. Use the quoted-heading form, as L255 does. |
| L83 | "NO TRAFFIC DURING THE LEGENDARIES" | "+ THE FIREWORKS" (CITY A). |
| L105 | "THE TRI-VISION … HOLD'EM ↔ JAYWALK" | Three faces since CITY B: + THE DROP from its go-live. |
| L120 | EVERY TAP ACTS lists `.btn-block` and `.btn` in `[data-press-all]` | Also `.icon-btn`, `.menu-btn`, `.music-btn` — name `PRESS_IMPLICIT` instead of the list. |
| L135 | "ONE named exception: the WORN card's name" | Two: + the top-3 rarest achievements on THE PLAYER PAGE (`api/_lib/player.js:6-11`). |
| L188-190 | "the full suite once before committing" (harbor) | Contradicts L272 THE LOCAL TESTING RULE — the full harbor suite is the cloud's. |
| L200 | service worker "network-first" | One copy per deploy + THE CARRY; `/audio` kept by version. |
| L217 | `meta: { hostId, status, … }` | Add `hostBy?` (MAKE HOST). |
| L225-226 | The top-level node list, "(server only)" | Wrong for `city2/live`, `seats`, `profiles`, `uids`, `pstats`; missing every node since (`flink`, `dly`, `progress`, `shr*`, `logstats`…). Replace with a pointer to `api/_lib/backup.js` (the tested list) + `docs/data-model.md`. |
| L286-287 | Vercel env vars | Missing `BACKUP_TOKEN`, the three `VAPID_*`, `DAILY_SECRET`. |
| L61 / L63 / L66 | Three different size lists (390 + 412 · 390 / 402 / 430 · `--sizes pass`) | One: `--sizes pass`. |
| L24 | "`docs/harbor/passes/` — its INDEX" | There is no INDEX file; the index is in `docs/harbor.md` "THE PASS LOGS". |
| L144 | `NAME_MAX` under `js/vault/layout.js` | It lives in `js/config.js:10`. |

**Missing (two rules this review proposes, then the standing rules the last passes set that the file does not carry):**

- Proposed: a unit test never reaches `api/_lib/fb.js` (see A3) — its absence is costing a red cloud. Today the rule is only at `docs/testing.md:849-850`.
- Proposed: a change to a page's script (`/admin`, `/board`, `/lab`, `/daychart`) is loaded once in a browser before the push (see A1).
- NO ROOM WRITES AFTER YOU'RE GONE (`e2e-gone.mjs`, CITY A).
- THE BOOT TRIM: no pass-history comment blocks in boot-graph files (CITY B).
- THE SKYLINE, NO GAME TWICE (CITY D).
- A SILENT RECONNECT STAYS SILENT: SIGNAL LOST only after 1.5 s; a solo room leaves without a message (CITY D).
- SCORES SHOWS INSTANTLY (`ns:dy:scores`, CITY D).
- The daily E2Es need `DAILY_TEST=1 serve.mjs --emu`, restarted after the `/api` suites (DFIX5).

**Duplicated inside the file:** THE TAP WATCH (L118) and EVERY TAP ACTS (L120) are one module — merge. NO PILLS at L156 and L254. The unit / FAST / full order at L188 and again at L279-281. "A new game = rules first" at L195 and L260. The 44 pt tap target three times (L54, L122, L256). The tagged-push rule twice (L275-276, L277-278). "Re-publish the rules" three times (L178, L264, L285). `LAB_V` + `LAB_CHANGES` at L148 and L150.

**Better moved to its doc (the one-line pointer stays):**

| Lines | Bytes now → after | Owner doc |
| --- | --- | --- |
| L170 PRISM's SKINS | 583 → 212 | `docs/prism.md` "THE SKINS" |
| L158-161 THE SHARE CARDS | 583 → 223 | `docs/progression.md` |
| L245 audio leave / mute | 456 → 252 | `docs/audio.md` |
| L118 + L120 tap rules | 663 → 470 | `docs/title.md` |
| L41-45 No build step | 536 → 296 | — (tighten in place) |
| L283-289 Firebase setup notes | 727 → 136 | `docs/profiles.md` "Setup (production)" — **not in any doc today; copy it there first** |
| L259-265 Adding a game | 887 → 168 | `docs/match-kit.md` (already has it) |
| L198-212 File layout | 1,733 → about 1,000 | `docs/data-model.md` |

**The doc table lacks:** `docs/app-fixes.md`, `docs/title-history.md`, `docs/roadmap-history.md` (named only in the header), `docs/games/passes/` (nine game-pass logs, no index), and any doc for the three frozen trivia games (cipher, signal, bluff).

---

## THE SPLIT

### FIX NOW (before JAYWALK)

| Item | Scope |
| --- | --- |
| **A1** — `/admin` loads again + the page-load checks in the smoke test | S |
| **A2** — the share card's slot claimed in a transaction + a per-player daily cap | S |
| **A3** — the cloud back to green: `npm ci` in the unit job (or move the two tests), the CLAUDE.md line, the `windows` tier and the `lobby` camera check decided | S + M |
| **A4** steps 1–2 — the same card keeps its code; the phone does not re-upload | S |
| **A7** — the stuck-silent master after a blur | S |
| **The device check** — share / copy inside the lift on the real iPhone | 10 min |
| **B2: T5 → T1 → T2 → T3** — room in the boot cap, the registration cross-check, the contract written down, a loud failed start | about a day in all |
| **B3: F4, F5, F6** — `radioCrew` reset, the presence test, the dead code | S each |
| **B1 quick wins** — the six serial removes on every room open; the one `FROZEN_IDS` list | S |

### BEFORE LAUNCH

| Item | Scope |
| --- | --- |
| **A5** — a shorter picture cache, the purge step in the docs, counted accounts only | S |
| **A4** step 3 — a smaller card format and fewer days kept (the Spark 1 GB maths) | M |
| **A6** — the backup's deeper parts + key-range slices; correct `docs/backup.md` | M |
| **A8** — the scroll-stop tap (after one iPhone check) | S |
| **A9** — the held run's refusal re-read | S–M |
| **A10–A16** — the low findings | S each |
| **B1 option (b)**, the rest: `loadGame` refuses a frozen id, the dead E2Es parked, the `/api` suite off the CIPHER fixture — **if the owner picks (b)** | M + a day for the fixture |
| **B2: T4, T6, T7** · **B3: F1, F2, F3, F7** | S–M each |
| **Part C** — the wrong lines and the moves, with the next pass's docs | S–M |

### LEAVE ALONE

- **B1 option (c)** — archiving the frozen ten to a tag: 2–3 days, a rules-order hazard and a harder revive, for tidiness. Per game, only once the owner says it is never coming back.
- **The 882 frozen rule lines** — removing them risks refusing an older phone's match start; they cost nothing at run time.
- **The dead-start paths and the idle-room paths** (`host.js:56`, `:97-103`, `:266`; `room.js:199`, `:245`, `:291`, `:543`; `room-city.js:430-433`) — each guards a different entry.
- **The written `online` flag and the "old shape" presence branch** — the rules and host election read them.
- **The three accent tables** (`ACCENT`, `LOGO_ACC`, `GAME_LIGHT`) — merging them changes PRISM's colours.
- **OVERCLOCK's re-exported daily** — the owner's call; the docs say the plug-in stays.
- **`flink/` codes never expiring, and the share page's host header** (A17) — no exploit found; revisit only with a "reset my link" request.
