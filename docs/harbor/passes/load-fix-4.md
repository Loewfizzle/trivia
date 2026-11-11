# LOAD FIX 4 — GROK'S BOOT AUDIT: the rejoin freeze, the deploy skew, the hidden boot + the small fixes (Nov 10 2026 evening; plan.md "OWNER'S NOTES — NOV 10 (evening)")

> A short City 2.0 pass between HOLD'EM's HE4 and HE5. THE SOURCE: Grok's read-only boot audit of commit 81a39efc — copied here unchanged as
> [load-fix-4/grok-audit.md](load-fix-4/grok-audit.md) (13 findings). The city chat had checked them; this pass re-checked every line number against
> the code at its start (a301d211 — HE4 + LOAD FIX 3 in) and answers every finding below. ONLY the listed groups were done — nothing else started.
> **No database rules change. Still 8 functions** (the deploy id rides the existing `api/time.js`). **No look change** (pixdiff below).

## Every finding answered

| # | Grok's finding | the line today (a301d211) | answer |
| --- | --- | --- | --- |
| 1 | a returning player whose room reconnect stalls never gets past the boot screen | app.js:439 (was 437), room.js:66, firebase.js:85–106 | **FIXED** — Group 1, THE REJOIN LIMIT |
| 2 | Firebase (~118 KB gz) + the profile call start before the reveal | app.js:358 + 423 | **PARKED** for FR7 (the owner, Nov 10): measure on the iPhone first, no change without numbers. Not touched. |
| 3 | the pre-tap music warm-up downloads ~9 MB / holds ~140 MB PCM | synced-songs.js:132 (was 72), party-music.js | **ALREADY DONE** in HE4 (THE MUSIC WARM-UP, SMALLER — one ~14 s slice, ≤ 1 MB a visit with no tap: load-fix-3.md's FOLLOW-UP) |
| 4 | "music off" / "muted" don't stop the warm-up | party-music.js:146 (was 145), app.js:196 (was 194) | **ALREADY DONE** in HE4 (part 2 — 0 KB with the music off or muted) |
| 5 | iOS 16.0–16.3 can't load the city (a regex lookbehind in the city's graph) | chat/logic.js:101 | **FIXED** — Group 4 |
| 6 | locking the phone / switching apps mid-load expires every reveal gate | scene.js:2903, title.js:417, app.js:374 | **FIXED** — Group 3, THE HIDDEN BOOT |
| 7 | a mismatch inside the city's graph skips the watchdog's re-fetch | title.js:59–61, index.html:128 | **FIXED** — Group 2 |
| 8 | no recovery from a deploy for modules loaded after the boot | app.js:456, title.js:374, lazy-view.js:50 (+ every other lazy import) | **FIXED** — Group 2, THE SKEW WRAPPER |
| 9 | every shared link costs a 308 + a second TLS handshake (bare domain → www) | index.html:20 | **PARKED** — the owner's Vercel → Domains setting (which host is primary), a settings click, not code |
| 10 | the hang watch rebuilds the full report every second | index.html:159 | **FIXED** — Group 4 |
| 11 | the service worker rewrites ~300 files to Cache Storage every load | sw.js:28 | **FIXED** — Group 4 |
| 12 | a core stylesheet that fails twice still counts as loaded | index.html:194 | **FIXED** — Group 4 |
| 13 | the load log can go blind after the reveal on a slow load | harbor-loadlog.js:52 | **FIXED** — Group 4 |

None was NOT REAL: the city chat's reading held for every one.

## Step 0
The owner's notes appended to plan.md ("OWNER'S NOTES — NOV 10 (evening)") + the build table; decisions.md updated (a301d211).

## Group 1 — THE REJOIN FREEZE (#1)

**The repro** (the harbor `load` group's new check, the OLD code — a worktree of a301d211 on :5174): a phone HOSTs a room on the emulators,
then the database line goes DEAD (the socket to :9000 refused, the long-poll + sign-in hosts dropped; the page's own files still load — a
captive Wi-Fi / a dead mobile line) and the phone refreshes: **REJOINING YOUR ROOM held → THE WATCHDOG's one reload → TAP TO TRY AGAIN —
2 / 2.** Firebase's `get()` just queues for the socket (no time limit), so `resumeSession()` never returned and the REJOIN button made for
this case (`resumed === 'error'`) was never reached. The line back after 20 s: the second page's resume finally landed (8.7 / 6.2 s later).

**The fix** (`js/app.js#boot`, `js/room.js`, `js/screens/title-dock.js`, NEW `js/ui/onscreen.js`):
- The boot's UPLINK — the gstatic SDK import, the auth restore, the room resume's reads + writes — is ONE promise raced against
  **8 s ON SCREEN** (`UPLINK_WAIT_MS`; `ui/onscreen.js#onScreenWait` — paused while hidden, like the watchdog). Past it: `ready` → the title +
  the city come up with **REJOIN on the dock** (`rejoin: saved.code`), the seat KEPT, the socket still trying (`want('join')` held by the
  resume). The uplink runs on; its result goes through the SAME handler early or late: a late `'ok'` walks into the room as a normal rejoin
  (REJOIN goes away), a late failure leaves REJOIN up.
- **ONE attempt** (`room.js#resumeSession`): while it is out, `pendingResume(code)` hands it to the dock — a REJOIN tap (or a JOIN of the same
  word) JOINS it, never a second join (≤ 20 s, then the dock is free again and the attempt runs on); only an attempt that ENDED as `'error'`
  lets the tap knock afresh. A HOST or a JOIN of another word **cancels** it (`cancelResume` — checked after every wait: a cancelled resume
  writes nothing more and never enters the room → `'cancelled'`) — never two rooms, never a stale room screen.
- **Every other boot wait with no limit** (the list asked for): the gstatic SDK's three imports, `auth.authStateReady()`,
  `signInAnonymously()` (a first visit), the resume's `get()` × 3 + `seatConflict`'s get + `takeSeat` / `writePlayer`'s sets (a set resolves
  only on the server's ack) → all inside the uplink: bounded together. The INVITE check (`roomExists`, a get) → raced the same (past it the
  invite stays; JOIN says it later). `dismissBoot`'s waits were already bounded (the core sheets → the watchdog; the fonts ≤ 0.7 / 1.5 s; the
  city's module ≤ 30 s — now ON SCREEN, Group 3). The profile's `ensure` stays off the boot path (`withProfile()` is never awaited). For a
  phone with no saved room the title was already up; now `ready` (the host loop, the radio's gate, the service worker's registration) no
  longer waits on a dead SDK either.

**The proof** — the `load` group's **THE REJOIN LIMIT** (Chromium 402×874, the emulators), both ways, after the fix: the city + REJOIN at
**9.1 s** (no watchdog reload, no TAP TO TRY AGAIN); the line back after 20 s → **in the room 0.5 s later by itself** / **1.8 s later with
REJOIN tapped while the first try was out** (the same attempt; REJOIN gone, 1 player) — **4 / 4** (before: 2 / 4 — the two "the city +
REJOIN" checks failed as above). CONN green (0 sockets parked, 1 in a room, 0 after QUIT), `e2e-presence` 12 / 12.

## Group 2 — THE DEPLOY SKEW (#7 + #8)

**#7 — the city's graph** (`js/screens/title.js#tryHarbor`): a LINK / parse error (a `SyntaxError` — cached in the module map, so each retry
failed the same and only cost 4.5 s) is SKEW at once: no retries → `window.__boot.reload(why, { skew: true })` = the watchdog's skew path
(index.html: the boot's ~300 module files asked for afresh with `cache: 'reload'` ≤ 4 s, then the ONE reload; `__boot.refresh` exposed). A
network failure (a `TypeError`) keeps the 3 tries.

**#8 — THE SKEW WRAPPER** (NEW `js/ui/lazy-import.js`): every dynamic import after the boot is written `lazyImport(import('./x.js'), 'x')` —
**306 in 77 files** (a one-off codemod on a real parser, acorn: comments + strings untouched) + the cartridges at their one load
(`registry.js#loadGame`); the ten FROZEN games' files untouched (they can't start). The import resolves / rejects exactly as before; on a
`SyntaxError` / `TypeError` it asks **the deploy's id** — `GET /api/time` (no-store; NOW `{ t, v }`, `v` = `VERCEL_GIT_COMMIT_SHA`, 12 chars;
none locally; still no imports) — against **the page's own** (the FIRST `/api/time` answer this page got: `firebase.js#syncTimeNoSocket` →
`noteDeploy`). Changed → **ONE reload for that deploy** (sessionStorage `ns:skew-re` = the deploy reloaded for — never a loop; no session
storage = no reload; a LATER deploy in the same tab gets its own one), the boot's files asked for afresh first. The same deploy (or no answer)
= nothing more: the caller's own warn / report, as before. **Never in a match being played here**: `app.js#holdSkewReload` holds the reload
while a match is on screen with its cartridge loaded, until the room or the podium; the rejoin brings the phone back. *(The session's call,
flagged for the owner: a match whose OWN cartridge failed to load is no match on that phone — it would stay blank to the end — so that one
reloads at once and the rejoin walks it back INTO the match.)* `tests/lazy-import.test.mjs` fails on a stray dynamic import (the allow-list:
the gstatic SDK — another host; the city's module — #7's own path; the registry's loader table — wrapped at `loadGame`).

**The proof** — NEW `tests/integration/wk-skew.mjs` (WebKit 402×874 @3, THE LINE in front of TWO local servers on the same tree answering
deploy A / deploy B; deploy B = A's files + a NEW export in `js/ui/dom.js` + the file under test importing it; the line switches A → B on the
FIRST request for that file — new in `kit/line-proxy.mjs`: `rules` + `switchOn`):

| case | before (a301d211) | after |
| --- | --- | --- |
| (a) THE CITY's GRAPH mid-load (a city module's first answer needs an export nobody has) | the reload alone reused WebKit's cached copy → **THE CITY COULDN'T LOAD** | **revealed at 7.8 s after ONE reload** |
| (b) the radio's gate (2.5 s after the boot) | **no reload — the radio silently gone** | **ONE reload** (for deploy B), the gate loads after it |
| (b) HOST → the room's screen (`room-city.js`) | **no reload — a room with no room screen** | **ONE reload**, back in the room by the rejoin, its screen up |
| (b) the game's cartridge in the lobby (PRISM DROP, `loadGame`) | **no reload — the cartridge never loads** | **ONE reload**, back in the room, the cartridge loads |
| (c) the same deploy (A → A, the same link error) | no reload | **no reload** (the caller's own warning) |

**1 / 5 → 5 / 5.** The js/games boot-bytes cap (`tests/cartridge.test.mjs`) **30 → 31 KB** — the wrapper's one call in the registry (+ its
import, ~80 bytes measured without comments: 30.04 KB) — named here as THE BOOT BUDGET rule asks.

## Group 3 — THE HIDDEN BOOT (#6)

The boot's gates count **VISIBLE time only**, all on ONE clock (`ui/onscreen.js` — the watchdog's own count stays inline in index.html: a
classic script can't import): the scene's **REVEAL_MAX, WX_WAIT, FONT_WAIT** + the rects' wait (`scene.js` — `up()`; the LOAD LOG keeps the
wall clock), the title's **7.5 s safety reveal** (`onScreenWait(7500)` — `reveal()` is a no-op once revealed / gone), app.js's **9 s hold** +
its **30 s wait for the city's module**. (THE REJOIN LIMIT's 8 s is on it too.) iOS held a plain `setTimeout` while hidden and fired it at the
return; the scene's loop stops while hidden, so nothing baked while the wall clock ran.

**The proof** — NEW `tests/integration/wk-hidden.mjs` (WebKit 402×874 @3 through THE LINE, 40 ms / 40 Mbps; the page HIDDEN the moment the
city's scene started — `document.visibilityState` faked + a `visibilitychange`, which the scene, the watchdog and the clock all read):

| | before | after |
| --- | --- | --- |
| hidden 5 s mid-bake | revealed 0.72 s after the return, **'late'**, then **a lit crossfade** after the reveal (the pop-in) | revealed **1.14 s** after the return, **'ready'**, **no change after** |
| hidden 30 s mid-bake | **the boot screen LIFTED + the city SHOWN while hidden** ('late') | revealed **1.46 s** after the return, **'ready'**, no change after |
| a plain load (night) | 5.09 s | 5.16 s (noise — WebKit, night, the 40 ms line) |

## Group 4 — THE SMALL FIXES

- **#5 — no lookbehind** (`js/chat/logic.js`): the profanity filter's left edge is CAPTURED (`(^|[^\p{L}\p{N}_'’-])`) and handed back unchanged
  — **the same masks + hits as the old lookbehind regex on a 2,000+ case corpus** of edges (`tests/safari-floor.test.mjs`). The Safari floor
  test now also fails on what Safari 16.0 can't PARSE and a grep catches: a regex **lookbehind** (16.4), a class **static block** (16.4),
  **import attributes / assertions** (17.2), the regex **`v` flag** (17). The lookbehind was the only one in js/.
- **#12 — a core sheet that fails TWICE** never counts as in (index.html `__cssFail`'s retry): the boot screen holds → the watchdog's reload,
  as for a sheet that never answers. THE BOOT SAFETY NET's new case (`css/title.css` + its `?again=` aborted): **revealed at 20.1 s after the
  one reload, the first tap answered** (before: the boot screen lifted onto an unstyled title, dead to taps — LOAD FIX 3's own finding).
- **#10 — the hang watch's cost** (index.html): the beat is CHEAP every second; the full snapshot (the city's report / the boot's walk over the
  resource entries) only every **5 s** or at once after a stall (a gap > 1.5 s) — a hang report ≤ ~5 s stale (the worker keeps the last one).
  Measured (Chromium, the revealed night city, 30 s, the snapshot function + the worker's postMessage wrapped): **26 → 5 snapshots;
  ~26 → 9–13 ms of main thread a minute** on this PC (more on a phone); **77 → 15 KB** cloned to the worker.
- **#11 — the service worker** (`sw.js`): a copy is written only when it CHANGED (the stored copy's ETag / Last-Modified — the validators the
  browser's revalidation keeps); a PAGE is kept ONCE under its path (every invite link `/?room=…` and preview query was one more copy); a static
  file with a query other than `?v=` (a real version) is never kept (`?again=`); the cache capped at 700 (the oldest trimmed) + the old pile
  purged at `activate`. Still network-first, same-origin static only, never `/api` / `/audio`. NEW `tests/integration/sw-cache.mjs` (WebKit
  through THE LINE): **the fill 284 copies, then two warm loads 0 copies written, 69 unchanged copies left alone** (the old worker rewrote every
  file it revalidated; WebKit served the rest of a warm load from its memory cache); the cache **341 → 331 copies, no per-query page copy** (before: `/?emu&slot=…` kept as its own copy); **offline: the city from
  the cache in 4.6 s** (before: 4.6 s).
- **#13 — the load log** (`core/harbor-loadlog.js`): 60 rows before + 60 after the reveal (was ONE cap of 90), the reveal row always in
  (`tests/harbor-loadlog.test.mjs` — 200 rows in the dark can't drop a post-reveal re-lay).

## Group 5 — the end

**The reveal** (Chromium, no throttle, `boot-time.mjs --runs 3 --net none`, interleaved on one run, before = a301d211 on :5174): **1.30 /
1.34 s → 1.32 / 1.33 s** (medians; LOAD FIX 3 said 1.33 s) — no slower. The boot: 337–340 → 339–340 requests, 2,687 → 2,695 KB (+ `onscreen.js`
+ `lazy-import.js`) — inside THE BOOT BUDGET (≤ 360 / 2,900). THE BOOT PRELOAD regenerated (302 modules) + the cartridges' preload graph.

**No look change** (`pixdiff.mjs --pin`, before = :5174): 402×874 night 1 px · noon 37 px · golden 0 px; 390×844 night 15 px; 430×932 night 6 px;
1440×900 night 5 px — the promenade's walkers (the usual residue).

**Docs:** this log + the audit; docs/harbor.md (#performance — THE REJOIN LIMIT, THE SKEW WRAPPER, the boot's gates in visible time; KNOWN
ISSUES; the file map); decisions.md; ROADMAP.md + roadmap-history; plan.md's build table; CLAUDE.md (one line under THE LOAD); docs/testing.md.

**THE BUSY-PC CHECK:** before the full suite only the emulators + my `serve.mjs --emu` (:5173); 18.8 GB free. My other servers (the BEFORE tree
:5174 + its worktree, wk-skew's :5176 / :5177, the DAILY_TEST server :5178) were stopped / removed first. (Ben's :5190 preview server WAS up — the start's port check missed it; it was stopped by mistake in the very last cleanup with the
emulators' leftover node, and restarted at once: a plain `node scripts/serve.mjs 5190`, left running.)

**The cloud run** (08da24a2, the harbor tag): **tests ✅ + harbor ✅ — green first try.** Vercel BUILT 08da24a2 (the live `/api/time` answers
`v: 08da24a22f9a`). **The servers:** every server this pass started is stopped (the emulators' Java + node, serve.mjs :5173, the BEFORE tree :5174
+ its worktree, wk-skew's :5176 / :5177, the DAILY_TEST server :5178, the lines); Ben's :5190 running.

**The runs (locally, the mini PC):** the unit suite **1602 / 1602** · rules **76 / 76** (unchanged — nothing to re-publish) · `/api` **44 / 44** ·
`e2e-profiles` **62 / 62** · smoke **6 / 6** (one red in the batch — "overclock on the guest" timed out when it ran straight after `server.test`
on the same emulators; **6 / 6 alone**, 33 s, as before the batch) · CONN green · `e2e-presence` **12 / 12** · `e2e-prism FAST=1` **63 / 63** ·
`e2e-holdem FAST=1` **14 / 14** · `e2e-daily` **51 / 51** (its DAILY_TEST server) · THE BASELINE GUARD **3 / 3** · the FULL `e2e-harbor` at 4
shards **1235 / 1237** — the two reds (`sightings`' worst frame 116.8 ms, `roomperf` at 4× — the shards' load, the same two as LOAD FIX 3's run)
**green alone: 13 / 13**. WebKit: `wk-skew` 5 / 5, `wk-hidden` 4 / 4, `sw-cache` 3 / 3.

**Known issues** (also docs/harbor.md KNOWN ISSUES):
- A dead line on a refresh in a room costs **~9 s** before the city + REJOIN (8 s on screen + the bake); the room comes back by itself once the
  socket does.
- The deploy id is the page's FIRST `/api/time` answer (~1.5 s after the load): a deploy that lands inside those 1.5 s makes the page think it
  IS the new deploy — a later lazy link error then reports instead of reloading (rare; the same as before this pass).
- A match's VIEW that fails to link while its cartridge loaded (both from the walk inside) waits for the room / the podium like any other
  failure in a match — not seen; the cartridge + its view preload together.
- #2 (Firebase before the reveal) and #9 (the bare-domain 308) are parked as decided.
