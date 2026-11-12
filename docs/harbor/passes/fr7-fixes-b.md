# FR7 FIXES B — "the launch + the plumbing" (Nov 12 2026)

A fix pass after FR7 FIXES A + HE11, from FR7-A (`docs/harbor/review-7a.md` — D, E, the NICE lines, THE LAUNCH CHECKLIST), FR7-B
(`docs/games/review-7b.md` — its "FR7 FIXES B" plan) and `docs/harbor/passes/fr7-fixes-a.md` ("NOT DONE"), + the owner's three ADD-ONS (Grok's
second opinions, given mid-pass). ONLY what was listed — nothing else was started. The owner's decisions: plan.md "OWNER'S NOTES — NOV 12
(afternoon)" (+ decisions.md). **The repo stays PUBLIC** — this pass changed nothing about its visibility, rewrote no history, ran no RESEED, no
PROGRESS RESET, didn't close FOUNDING MEMBER. **No database rules change.** Still 8 functions. The tests of this pass: `tests/fr7-fixes-b.test.mjs`
(+ the files named per finding — each failed before its fix unless said).

## Step 0
plan.md "OWNER'S NOTES — NOV 12 (afternoon)" appended unchanged + its BUILD TABLE line; decisions.md (FR7 FIXES B ← NOW, THE LAUNCH split from THE
PRIVATE FLIP, the owner's five decisions) — `57b58901`.

## Group 1 — THE LAUNCH's code (`d4f5669b`)

| finding | state | the fix | the test |
| --- | --- | --- | --- |
| E2 the freezes lost at the first play after the reset | FIXED | `core/streak.js` — a streak with no run yet carries `st0.f`, capped at the hold limit (2) | unit "E2" (`streakPlay({ f: 2 })` keeps 2; 9 → 2) |
| E3 the reset's founder sweep ignored a closed window | FIXED | `api/_lib/reset.js` — the sweep only while `founderOpen` (read fresh, never the 30 s cache) | `server.test` "FR7 FIXES B — E3 + E4" |
| E4 counted plays (the owner: RESET) | FIXED | `cp` in `RESET_STATS`; the dry run's line names the counted plays; the back-fill counts plays only after THE RESET EPOCH | unit "E4" + `server.test` (cp → null, `m` 0) |
| /board's link preview | FIXED | `assets/og-board.jpg` re-shot from the REAL velvet board (`scripts/seed-og-board.mjs` — eight made-up names on the emulators, approved card art → `tests/integration/og-board-shot.mjs`; 72 KB, 1200×630), `?v=2`; both pages' og:url / og:image on **www.neonspeakeasy.com — the PRIMARY host** (the bare domain answers 308 → www, measured) | unit "the link previews" |
| THE CHECKLIST | DONE | `docs/launch.md` — THE LAUNCH (the owner's taps) + THE PRIVATE FLIP (the exact commands), the growth rule, the minutes | — |

Seen while looking (NOT changed — not on the list): the home preview `assets/og.jpg` still shows GRIDLOCK's sign (HOLD'EM took its spot Nov 11); both
pages' description text still says "twelve party games".

## Group 2 — THE EDGE REQUESTS (D2 — `ffd32851`)

`vercel.json`: `/js` `/css` `/assets` → `public, max-age=300, stale-while-revalidate=86400` (the HTML, `sw.js`, `/api`, `/audio`, `/data` untouched).
**THE WORKER: ONE COPY PER DEPLOY** (`sw.js`) — on every page load it asks `/api/time` for the build id (the same `v` THE SKEW WRAPPER reads): the SAME
build as the copies it holds → every static file from its own copy (no request leaves the phone); a NEW build → a fresh cache named for it, every file
from the network + kept, the old build's cache dropped; NO build id (localhost, a slow / dead `/api/time`) → exactly as before. **A deliberate
difference from the prompt's "the worker on the default cache mode":** with the 24 h stale-while-revalidate header a default-mode fetch can hand
back an OLDER deploy's file from the HTTP cache, which the worker would then keep as the new build's copy. So the worker's network fetches stay
`no-cache` (a copy is only ever taken from the network, in its own build), and the saving comes from the per-build copies. That cuts more than the
default mode would, and a deploy shows at once instead of up to 5 min later. A copy is handed to the page as `no-cache`: WebKit's in-page memory cache
then asks the worker again (free) instead of trusting the 5-minute header. Without that, `wk-edge.mjs` caught the page pairing new HTML with an older
`config.js`. THE SKEW WRAPPER, THE BOOT WATCHDOG and the boot preload are unchanged.

**MEASURED** (`tests/integration/wk-edge.mjs` — WebKit 402×874 @3, through THE LINE with production's headers + a build id; each visit a NEW TAB;
WebKit's RELOAD reuses its memory cache for nearly every module with either worker, so a reload is not a visit):

| visit | before (the old worker + the old headers) | after |
| --- | --- | --- |
| cold (a fresh phone) | 375 requests · 7.5 MB · reveal 4.05 s | 379 · 7.5 MB · 3.9 s (the same — nothing cached yet) |
| WARM (the same build) | **356 requests · 7.2 MB** · reveal 3.96 s | **15 requests (4 static + 11 /api) · 260 KB** · reveal 2.6 s |
| the first visit after a DEPLOY | 356 · 7.2 MB | 357 · 7.2 MB (the refill) — the new code on screen at once, no mixed graph |
| warm after the deploy | 356 | 15 |

The month vs Vercel's 1 M edge requests (FR7-A's yardstick — 20 friends daily + 4 Fridays — was ~615 k ≈ 61 %): a warm visit now costs ~15 instead of
~350, the refill ~357 once per device per deploy → **~12 % (a deploy a week) to ~35 % (a deploy every day)**. The live site's read-only warm count
after the final deploy: the summary at the end.
Proof, no regression: `ONLY=load` 34 / 34, `wk-load` 4 loads / 0 problems, `wk-double` 22 paths / 0 with two cameras, `boot-time` cold reveal 1.32 s
(unchanged) / warm 1.05 s, `sw-cache` 3 / 3 (the no-build-id path), CONN 21 / 21.

## Group 3 — THE DEPLOY + THE REPO SIZE (D3, D4 — `3d74d966`)

- **D3 THE FROZEN SONGS OUT OF DEPLOYS:** `.vercelignore` drops the ten frozen games' own songs (29 files — cipher-breach, last-signal, neural-bluff,
  golf-*, spy1–3, high1–3, run1–4, slip1–8, audio/pulse). The live set (City 2.0's five station decks — every mood has its own deck, so the old City 1.0
  decks that name the frozen songs are never reached —, the menu playlist, the victory list, OVERCLOCK's track, PRISM DROP's ten, the podium sounds)
  all ship: `tests/frozen-songs.test.mjs` fails if one doesn't (proved: dropping `c2-party1` → 2 reds). **The deploy: 299.1 → 232.5 MiB** (1,612 →
  1,583 files — `node scripts/deploy-size.mjs`).
- **D4 THE GROWTH STOPPED:** pass screenshots stay ON THE PC — `.gitignore` covers every picture under `docs/harbor/passes/`, `docs/games/`,
  `screenshots/` (chosen over "JPEG at 1×": a pass shoots many and they are looked at on the PC; a picture a doc must carry = a JPEG ≤ 150 KB added on
  purpose); `tests/repo-growth.test.mjs` fails on a new big one (the line: the 180 + 29 already committed). `git gc` on the local clone: 450 MiB pack +
  152 MiB loose → **549 MiB**. **GitHub: 573,690 KB (~560 MiB).** No history rewrite (THE PRIVATE FLIP — its commands in `docs/launch.md`; ~560 →
  ~300 MB estimated).
- Vercel → Settings → Deployment Retention: the owner sets it (not visible from here) — `docs/launch.md` says what.

## Group 4 — THE PRIVATE-REPO WORKFLOW (D1 — `9f8a3519`; ready, NOT switched on)

Both workflows read `github.event.repository.private`: PUBLIC = exactly as before; PRIVATE = a final push runs only `tests` (unit → rules → /api →
smoke; CONN + presence skipped), `harbor` skips itself on a push (`gh workflow run harbor` still works); `permissions: contents: read` on both.
`tests/workflows.test.mjs` evaluates both branches (red before). The real run: this pass's final push (public → both workflows, as today).
The minutes: a `tests` run ≈ 11 billed → 2,000 a month ≈ 180 runs ≈ 6 final pushes a day (Nov 8–12 ran 6–11 a day — over at that pace).

## Group 5 — THE TWO OWNER NOTES

1. **THE TWO-TAB HANG** (`3a38cb31` + ADD-ON 3 `b735a6da`). **Not reproduced as such — reproduced in kind.** Desktop WebKit's two tabs never hung by
   themselves (5 refreshes beside a background tab, a worker update landing with both open — every load the city in ~2.5 s). The suspect: Safari's
   storage process stopping, which only comes back once every tab of the site is closed (the owner's "closing both fixed it"). SIMULATED in the tab
   with IndexedDB + Cache Storage that never answer: the OLD code's sign-in waited forever (Firebase opens IndexedDB for Auth's migration store and for
   the app's heartbeat before every sign-in request), and the NEW worker's own waits on Cache Storage would have held every file. **Fixed:**
   - the probe opens what the SDK opens next (`firebaseLocalStorageDb` + `firebase-heartbeat-database`, no version — a missing one is never created —
     in parallel, 1.5 s); any one silent → IndexedDB hidden from the SDK for this page + the sign-in on localStorage alone;
   - every Cache Storage wait in the worker is bounded (0.8 s → the network), including its ACTIVATION — every fetch of a controlled page waits for
     it, so a stuck clean-up there means STEPPING INSIDE forever;
   - THE WATCHDOG ALWAYS ENDS IN A WAY OUT (ADD-ON 3);
   - the BOOT HANG report says **"other tabs open: n"** (a BroadcastChannel ping in index.html — never a socket).
   Proof: `tests/integration/wk-twotabs.mjs` 7 / 7 (5 / 7 on the old code: the stuck store's sign-in + the tab count; 6 / 7 on the first probe: ONLY
   Auth's database silent), the load group's WAY OUT check.
2. **UMBRELLAS IN THE RAIN** (`b91aba35`): `folk.js#rainGear` — none under 0.12; drizzle 0.22 ≈ 1 in 3 umbrellas; ≥ 0.3 ≈ 3 in 4 with the SAME
   draws as before (a real-rain look is unchanged); newspapers + collars up fill in (the collar on its own seeded stream — no later draw shifts). A
   walker's gear = the rain when THEIR VISIT started (`folk.js#entryRain` — the look key no longer flips everyone at 0.3: THE PEOPLE RULE). Unit
   tests: the shares (3,000 walkers), real-rain looks unchanged, a look never changes mid-visit. Shots `&force=drizzle|rain|storm`, day + night, 390 /
   402 / 430 + 1440 (`shots-review/umb-*` — on the PC).

## Group 6 — A's LEFTOVERS + THE TESTS + THE STALE DOCS

- **C5's two whole-tree reads** FIXED (`9410872f`): /admin STATS + the radio's open rooms read the LIVE rooms through the index
  (`api/_lib/rooms-live.js` — activeAt in the last hour, ≤ 120); `server.test` "C5" + a unit guard (no `/api` file reads the whole tree).
- **PD2 SCORE RUSH's margin** FIXED: a fresh `node scripts/sim-prism-rush.mjs 24 4` (24 runs a song). The best runs RISE with more seeds (prism4
  248,202, prism3 285,228), so the margin could only come **3 → 2.8**: every song's best stays ≥ 2.5× under the bound with ~5 % to spare (2.65× on
  prism4). A 12-run sim had suggested 2.4; PFIX-B's own pinned seeds refused that. Unit "PD2" (red before).
- **C4 — NOT DONE (said once):** the emulator never evaluates `query.endAt` as a comparable value, so a "stale rooms only" list rule can't be proved;
  an unproved rule could break the idle sweep on the live database. The owner's options: the idle sweep on the server (then the client query can be
  closed), or accept it in writing (the door has a LOCK).
- **The tests** (`cfe092c8`): the smoke's filter — a game that isn't playable stops RED (exit 2), never "5 / 5 with nothing started"; the four /api
  suites in the cloud (both dailies, FRIENDS, `holdem-server`); `crew`'s push picked by its room code (another shard's room no longer counts); the FAST
  `short` by the 3-hand rule; the vault's WebKit page `?emu` (it signed in on the PRODUCTION project) + `guardUrl` on every WebKit launcher + THE LINE's
  upstream (`tests/live-guard.test.mjs`); a no-WebGL PRISM mount (`tests/integration/prism-nowebgl.mjs` 3 / 3); `perfRun` pinned to the night look.
  Already done by FR7 FIXES A (no new work): the reload-then-chip line (DY1 — `e2e-daily`), OVERCLOCK's STANDARD bound (unit OC1).
- **The stale docs** (`f216a071`): og.jpg everywhere, 41 achievements, 8 functions, 13 games / 3 playable, the deploy size, the smoke filter, the
  suite's ~33 min / ~1,262 checks + the cloud budget, HOLD'EM playable, QUIT TO THE ROOM, `progress/flame-art.js`.

## Group 7 — THE NICE LINES (`1a20a671`)

FIXED: HOST at the 101st connection (raced against 20 s — "The city's full tonight — try again in a minute."; ONE attempt at a time, a late success
still walks in); the results queue's 425 backs off 2 s → 60 s; a `radioWho` NO remembered for the tab, per profile (a restore asks again).
**NOT DONE (dropped for time, as the prompt allows):** the SOLO SURVIVAL time (tried: stamping an AWAY / gone out at its silence also changes the OUT
ORDER — the last one out wins — and flipped two whole-match tests; it needs its own field for the podium's time); OVERCLOCK's combo marks after a
refresh; the TODAY ticket's cut name at 390.

## ADD-ON 1 — A SEAT IS NOT A PLAY (the owner, Grok's second opinion — `2741373a`)

EVERY credited uid (seated or not) needs its OWN node of THIS match in THIS room (`api/report.js#PROOF_TREES`): PRISM DROP's board; OVERCLOCK's
board of ANY challenge, its combo marks or its sealed picks. A uid without one is dropped from the rows BEFORE the real-player count (one real player
left = the solo rule). HOLD'EM untouched (the dealer). A report can land after BACK TO THE ROOM (the snapshot path), so the walk back now KEEPS the
proof nodes + the seal (`games/registry.js#PROOF_NODE_LIST`); the next start wipes them as before. `server.test` "A SEAT IS NOT A PLAY":
- a seated guest who wrote nothing → nothing, and the host gets a solo run (never a 2-player win);
- a real 2-player match → both credited, 95 XP as before;
- challenge 0 skipped (later combo marks / sealed picks only) → credited.
Red before. The fixtures of `server.test` + `progression.test` now leave each player's node as a real match does.

## ADD-ON 2 — SIGHTINGS NEED THE CITY OPEN (`f6fbdebc`)

A SKY claim counts only inside the server's own city-open stamp `ppriv/{pid}/co` (`{ a, b, p }` — written by `radioHello`, the call a visible city
already makes every ~2 min, + one hello on coming back on screen; a 30 s lead, a 150 s trail); the radio's claims keep their own record; `QUEUE_MS`
12 h → 15 min. **A SPEED BUMP, NOT A SEAL:** a script that keeps the city's hello going still can claim; it only stops a claim made with no city open.
Tests: `sightings.test` "NEED THE CITY OPEN" (no stamp → `closed`, an old opening → `closed`, 20 min late → `stale`, a real tap → granted) + the pure
stamp rules; the older sighting tests now open the city first. No rules change (`ppriv` is server-only by the root deny).

## ADD-ON 3 — Grok's second opinion on THE TWO-TAB HANG (`b735a6da`)

1. The probe opens what Firebase opens next (Group 5); hidden or not, a page whose IndexedDB didn't answer never keeps `indexedDBLocalPersistence` (a
   defineProperty that fails is logged). `wk-twotabs` 3b: ONLY `firebaseLocalStorageDb` silent → the city, signed in, HOST made a room (red on the
   first probe).
2. THE WATCHDOG ALWAYS ENDS IN A WAY OUT — once a reload is armed by ANY path, a boot screen still up 6 s on screen later → TAP TO TRY AGAIN, whatever
   `acted` says. The `load` group: `__boot.reload` armed with the reload stubbed (`window.__bootReloadStub` — the tests' seam; `location.reload` can't
   be replaced) → TAP TO TRY AGAIN in 5.9 s. (Before: `__boot.reload` set `acted = 2` and nothing acted again — read, not re-run.)
3. **NOT NOW — the plan:** a service-worker rescue for a FROZEN page thread (Grok's finding 1) — built only if /admin shows a "THE MAIN THREAD STOPPED
   ANSWERING" report during a boot; the hang watch already reports that case.

## The end

**Local, on the mini PC (my own emulators + `serve.mjs --emu`, `DAILY_TEST=1` for the dailies; Ben's :5190 left alone), after every group + add-on:**
the unit suite 1,707 / 1,707 · rules 81 / 81 · `/api`: `server.test` 48 / 48, `sightings` 6 / 6, `progression` 10 / 10, `password` 10 / 10,
`coastclear` 14 / 14, `friends` 8 / 8, `daily-module` 18 / 18, `lab` 2 / 2, `vault-2b` 3 / 3, `vault-2c` 3 / 3, `holdem-server` (alone) 21 / 21 ·
`e2e-profiles` 142 / 142 (first, on fresh emulators) · smoke 8 / 8 · CONN 21 / 21 · `e2e-daily` 53 / 53 · `e2e-prism FAST=1` 63 / 63 · `e2e-oc-2`
(N = 4 — OVERCLOCK has no FAST path) 27 / 27 · `e2e-holdem FAST=1` 22 / 22 · `wk-load` 4 loads / 0 problems · `wk-freeze` 60 loads / 0 freezes ·
`wk-edge` 6 / 6 · `wk-twotabs` 7 / 7 · `prism-nowebgl` 3 / 3 · `sw-cache` 3 / 3 · THE BASELINE GUARD 1.13× / 1.08× / 1.00× (≤ 2×) · `ONLY=load` 34 / 34 ·
**the FULL `e2e-harbor` 1,263 / 1,264 (~33 min, 4 shards)** — the one red the SIGHTINGS photo-at-the-tap check under the shard load (FR7-A's F line);
`ONLY=sightings` alone 11 / 11, twice.
**`wk-double`: 21 / 22 once — `resize-hidden`.** Measured: its 0.25 s pixel check fails ~1 in 5 on the pass's STARTING code too (2 / 10 at `8777f625`
in a worktree on :5174, the same server); with this pass's return-moment hello it went to ~3 in 5, so that hello now waits 1.5 s after the return
(`13decb84`) → 2 / 6, the old rate. A pre-existing flake of that check, not a second camera (every frame: one camera).

**THE LIVE COUNT (after the final deploy — build `8a37a88d72b1`, Vercel BUILT; ONE read-only run, `LIVE=1` + `&test=1` — no profile, no room:
`boot-time.mjs --live --warm --prime 2`, Chromium 402×874 @3):** a warm visit → 338 requests before the reveal, 320 answered by the worker FROM ITS
COPY, **3 of the worker's own reached the network** (FR7-A measured 328 on the live site), + the page itself, 4 `/api` calls and Google's fonts +
Firebase (not Vercel's) — **≈ 8 edge requests a warm visit**, 1 KB on the wire, the reveal 1.35 s (FR7-A: 1.84 s).

**Known issues:** the `resize-hidden` pixel flake (above); the SIGHTINGS photo check under the 4-shard load (FR7-A's F); `assets/og.jpg` still shows
GRIDLOCK's sign; the link previews' text says "twelve party games"; C4 (the room list) open; three NICE lines (Group 7).

**Servers:** my emulators (fresh twice), `serve.mjs --emu` on :5173 and the base / plain servers on :5174 / :5175 (the bisect) — all STOPPED at the end;
Ben's :5190 left running.
