# CITY 2.0 — REVIEW #7, PART A (FR7-A, read-only, Nov 11 2026: THE CITY + THE CONSOLE — "ready for strangers?")

**Must-fix 1 FIXED in `678395fe`** (Nov 12 — C1, THE REAL PLAYER COUNT: the forged report now answers `unverifiable`; B2's "a solo run reported by snapshot is a WIN" went with it — docs/profiles.md).

**FR7 FIXES A (Nov 12 — docs/harbor/passes/fr7-fixes-a.md): FIXED — E1 (THE RESET EPOCH) in `6d6c9a81`; C2 (→ THE DAILY CEILING), C3, C5's caps (C4 NOT DONE — unprovable on the emulator, see the log) (the shapes a rule can bound), B1 (END GAME through the dealer), B2's INITIATE guard + the HOLD'EM poke, C6 in this pass's later commits. Left for FR7 FIXES B / THE LAUNCH: D1–D4, E2–E4, the tests + docs lines, C5's two whole-tree /api reads.**

**FR7 FIXES B (Nov 12 — docs/harbor/passes/fr7-fixes-b.md): FIXED — E2 (the freezes carried), E3 (the founder sweep only while open), E4 (`cp` reset — the owner), the og image (+ www), D2 (THE EDGE CACHE: a warm visit 356 → 15 requests), D3 (the frozen songs out of deploys: 299 → 232.5 MiB), D4 (the growth stopped; the rewrite = THE PRIVATE FLIP), D1 (the private-repo workflow — ready, switched by the visibility; NO runner — the owner), C5's two whole-tree reads, the F tests (smoke filter, the four /api suites in the cloud, `crew`, the FAST `short`, the vault's ?emu + the WebKit guard), the stale docs, the NICE lines HOST at the 101st / the 425 back-off / radioWho's NO. THE LAUNCH CHECKLIST → docs/launch.md. Still open: C4 (unprovable on the emulator).**

Fresh eyes on the city + the console at commit `99c61ace` (Step 0's two docs committed on their own: plan.md "OWNER'S NOTES — NOV 11 (night)"
+ decisions.md). Nothing but this file and Step 0 was written — no code, no tests, no config, no data. THE LIVE SITE was only READ: one warm
load of the title with the test flag on (`LIVE=1`, `&test=1` — no profile, no member Nº, no room) and plain GETs of public static files; no
room, no player, no `/api` write. Everything else ran on the mini PC: my own emulators + `serve.mjs --emu`, Chromium 1248 and Playwright's
WebKit. Method: eight read-only investigations in parallel (the 8 `/api` functions · the rules row by row · THE LAUNCH + secrets · the free
plans · code health + docs + tests · FR6's follow-through · the console's flows · the static leak sweep) while the writer ran the timed work
(the boot, Grok's #2, the leak cycles, the city's soak) — then **every MUST-FIX and SHOULD-FIX below was re-read in the code by the writer**,
and every "it breaks" is marked **REPRODUCED** (how) or **READ** (not reproduced). FR7-B (the three games + the two dailies) is a separate
review; where a finding belongs to a game it says so. Sizes: **S** < 30 min · **M** 1–2 h · **L** half a day or more. The owner's rule
applied throughout: NO TRAFFIC YET — real defects only.

## In plain words (for the phone)

**What's solid.** The city and the console hold. The boot is where LOAD FIX 2–5 left it (the reveal 1.5 s on this machine, 2.4 s in
WebKit at the iPhone's size, 8.7 s on a 4×-slow phone — no regression) and inside its budget (338 of 360 requests, 2.7 of 2.9 MB before the
reveal). **Thirty room → match → room cycles of each playable game leak nothing that grows**: DOM nodes, listeners and canvases are flat;
the heap warms up ~12 MB over the first dozen matches (caches) and then levels off (≤ 0.15 MB a match). Ten minutes of the city in
each of five scenes (a night, a day, a party night, a legendary, fog) holds 60 frames a second with its memory level
(a 25-minute night: the heap's slow rise fades to under 0.1 MB a minute, canvases and DOM nodes stay in a band). The database sockets are exactly as designed (0 on a parked title, 1 in a room, 0 after QUIT). Nobody can read another player's private data, the dealer's
deck, a daily's answer, or grant themselves a card, a gift, a member Nº or a crew role — every one of those paths was walked and is
refused. HOLD'EM's results come only from the dealer. The live site serves none of the server-only files (the answers, the catalog, the
rules: all 404). No secret was ever committed. Every FR6 finding that mattered is still fixed (none regressed).

**What's risky.** Five things, all outside the city's picture. (1) **One forged report pays unlimited XP** — a script with one anonymous
sign-in went from LEVEL 1 to LEVEL 77 in ONE call on the emulators (level 100 in two), with every level reward on the way and a seat at the
top of THE XP BOARD. A one-line cap fixes it. (2) **THE LAUNCH RESET has a trap**: /admin's BACK-FILL button (the HOLD'EM one is still
waiting for your tap) rebuilds the boards from every stored result with no "since the reset" line — pressed after the reset it puts the old
wins, daily points and this week's XP back. (3) **Going private breaks the cloud tests' budget**: a harbor run bills 125 minutes and a tests
run 11; at this week's pace that is ~580 minutes a DAY against a private repo's 2,000 a MONTH — the self-hosted runner has to exist (and
the workflows be rewritten for Windows + one machine) BEFORE the flip. (4) **Edge requests**: FR6's fix never landed — measured on the live
site (read-only), a REPEAT visit still sends 328 requests through the service worker (every file re-checked). ~20 friends visiting daily + four
Fridays ≈ 60 % of Vercel's free million a month; strangers on top of that is the first free-plan line you would cross. (5) **What a stranger with a script can do that friends never
would** (each reproduced): list every live room with its players' names and walk into an unlocked one; make rooms nobody else can delete
and sit on all 798 hush words; fill the free database. Two are small rules changes (one re-publish), one is your decision.

**What could break for a real player.** Small, real, each an S fix: **a host who left the table (QUIT TO THE ROOM) can start a new game
over the match everyone else is still playing** — they are pulled out, the match has no result (reproduced with the real taps); **a solo
run can count as a WIN** on the career boards when the player taps BACK TO THE ROOM before the report lands (reproduced); **the freezes a
player holds vanish at their first play after the reset** (the reset says they are kept — the streak's "new run" branch drops them;
reproduced); a rude username is hidden on THE BOARD but shown in full when you tap that row, and in a friend request. HOLD'EM (your B5):
**END GAME in a HOLD'EM match drops it for everyone with nothing** — no result, no XP, no streak day, no board win, no ledger — and leaves
the dealer's record behind; a kick is kinder than it sounds (the kicked player still gets their place + XP at the end).

**The verdict.** Solid: the city, the boot, memory, privacy, the dealer, the grants. Risky: the report path's player count, the reset's
order of operations, the cloud minutes once private, the edge requests. **3 MUST-FIX** (two S, one M–L that is workflow work, not site
code), **about 30 SHOULD-FIX** (most S; six are the owner's decisions, a third are tests + docs), the rest polish. Nothing here needs a redesign.

## THE MUST-FIXES

| # | finding | what happens | proof | size |
| --- | --- | --- | --- | --- |
| **C1** | **A FORGED REPORT PAYS UNBOUNDED XP** — `/api/report`'s snapshot path takes the PLAYER COUNT from the host-written night record and never caps it: `js/core/night.js:49` `const n = uids.length`; `api/report.js:115` drops the rows without a seat but keeps `ex.n`; `api/_lib/stats.js:48` passes `ex.n` to the step; `js/core/ranks.js:47` pays `XP.win + XP.winPerExtra * Math.max(0, n - 2)`. The rules let any signed-in user be the host of a room it makes and write `night/{m}` there (`hasChildren(['g','p','at'])`, nothing else). The room path has the same shape (`match-report.js:247` / `:283` — `n` from the host-written `game.participants`) | ONE anonymous user: makes a profile, a room, writes `night/m01 = { g: 'prism', at, p: { me: 3, f0…f4999: 0 } }` (48 KB), POSTs `{ code, matchId, snap: { matchId } }` → **`counted`, +30,089 XP, level 1 → 77, a win, every level reward to 77**; a second call 45 s later passes level 100 (45,000 XP). Three calls and the profile is listed: #1 on THE XP BOARD, week + all time | **REPRODUCED** (the emulators + the local `/api`, a plain anonymous client; the same path with an honest 2-name record pays 95 XP) | **S** — in `processReport`: refuse (409) a night record or a participants map with more than `MAX_PLAYERS` (8) names BEFORE extracting, and pay on the number of rows that still have a seat (never above 8); + the case in `server.test.mjs` |
| **E1** | **THE BACK-FILL UNDOES THE LAUNCH RESET** — `api/_lib/board-fill.js:51` reads ALL of `results/` + every daily day (the reset keeps both, by design: a counted match can never be counted again); `:68` sets `xw: filledWeek(…)` = `Math.max(live, rebuilt)` (`js/core/board-fill.js:66`) and `cp`; `filledHoldem` is `Math.max` too (`:97`); the daily points are rebuilt from every record. No reset epoch anywhere | THE HOLD'EM back-fill is still waiting for the owner's tap ("the back-fill = the owner's tap"). Pressed AFTER the reset: every pre-reset tournament win + KO, every daily point (all time + this week) and this week's XP are back on the boards for LEVEL 1 players | READ (both files, line by line) | **S** — `progressReset` stamps `progress/resetAt`; the back-fill skips results + daily days before it (and says so in its preview). Until then: THE LAUNCH CHECKLIST's order — back-fill BEFORE the reset, never after |
| **D1** | **THE CLOUD TESTS vs A PRIVATE REPO** — both workflows run on GitHub's Linux machines (`tests.yml:27`, `:39`; `harbor.yml:37` — `ubuntu-latest`). The last tagged pass: harbor run 43127177107 = 15 jobs, 6,981 s, **125 billed minutes**; tests run 43129118486 = **11** | A public repo's minutes are free; a private repo on the Free plan gets 2,000 a month. Nov 8–11: 15 harbor + 40 tests runs = ~580 billed minutes a day → the month's allowance in ~3.5 days (14 harbor passes a month, no more). After that the checks simply stop running | MEASURED (`gh run view --json jobs`, both runs; the pace from `gh run list`) | **M–L**, before the flip — see THE LAUNCH CHECKLIST: the runner on the beelink as its own Windows user; both workflows off `sudo sysctl` / `/usr/bin/google-chrome` / the inline bash in `emulators:exec` (`tests.yml:64–82`, `harbor.yml:68`); the 15-job matrix → ONE job at `SHARDS=4` (all 15 bind 9000 / 9099 / 5173 — one machine can't run them side by side); `permissions: contents: read`; prove one green run while still public. CLAUDE.md's "≈ 95–105 billed minutes a pass" is stale (136) |

## A. SPEED + MEMORY

**How it was measured.** Chromium 1248 headless (`boot-time.mjs`, 402×874 @3, cold = a fresh profile, `--cpu 4 --net wifi` for the slow
phone), Playwright's WebKit at 402×874 @3, the leak cycles + the soak with my own scratch drivers (never committed) on the emulators.

### A1. The boot (no regression; inside the budget)

| | now | LOAD FIX's figure |
| --- | --- | --- |
| Chromium, cold, no throttle — the reveal (night) | **1.49 s** (10 loads, 1.44–1.53) | 1.32 s (the grey scene) |
| Chromium, cold, 4× CPU + Wi-Fi — the reveal | **8.68 s** median (8.37 / 8.68 / 8.80) | 8.48 s |
| … the first working tap (BOARD on screen after a tap at the reveal) | **2.80 s** | 2.22 s |
| WebKit 402×874 @3, cold — the reveal | **2.40 s** median (7 loads, 2.35–2.58) | — |
| the LIVE site, warm (read-only, this line) — the reveal | **1.84 s** | 2.89 s (Nov 9, before the boot preload) |
| requests / bytes before the reveal (cold) | **338 / 2,695 KB** (budget 360 / 2,900) | 328–342 / ~2,640 |
| a whole cold visit (to BOARD on screen) | **473 requests** | FR6: 457 |
| THE BOOT PRELOAD (static) | 304 modules / 6,318 KB (budget **310** / 6,500 — six modules of headroom) | 298 / 6,191 |

The first tap at 4× is 0.6 s slower than LOAD FIX 2's (2.22 → 2.80 s): the ten long tasks in the 2.5 s after the reveal (130–350 ms each
at 4×) — not on a normal phone (no long task after the reveal at 1×). Worth one look in FR7 FIXES only if a slow phone matters (NICE, M).

### A2. Grok's #2 — Firebase + the profile call before the reveal: MEASURED, not worth moving

The order Grok read is right (the SDK's first request leaves ~1.15 s into the boot, while the city still bakes). The cost, measured by
HOLDING the three gstatic modules + the auth + `/api/profile` until the reveal (request interception — "Firebase after the reveal" without
touching the code), A/B interleaved:

| | as it is | Firebase held until the reveal | gain |
| --- | --- | --- | --- |
| WebKit 402×874 @3, cold (7 loads each) | 2,398 ms median · 2,412 mean | 2,354 · 2,343 | **−45…−70 ms (2–3 %)** — inside the loads' own spread (2,345–2,580) |
| Chromium, 4× CPU + Wi-Fi, cold (8 each) | 8,655 ms mean | 8,370 | **−285 ms (3.3 %)** |
| Chromium, no throttle, cold (10 each) | 1,486 ms mean | 1,532 | none (+46 ms — the interception's own cost) |

Firebase is 3 requests / 115 KB of the boot's 338 / 2,695 KB (4 %). **Verdict: leave it.** Moving it buys ≤ 0.3 s on a 4×-slow phone and
nothing measurable on an iPhone, and it would put the sign-in behind the first HOST / JOIN tap instead. (Not measured: gstatic's real
network on a phone line — a localhost page can't show it; the byte share bounds it.) Grok's #9 (the bare domain's 308 → www) is still
there — every shared link and both link-preview images pay one extra hop; the owner's Vercel → Domains setting.

### A3. THE LEAK RE-CHECK — 30 room → match → room cycles of EACH playable game: nothing grows

Two phones (390×844 @2) in one room; each cycle = INITIATE → the walk in → the match on both phones → back to the room (PRISM DROP played
to its podium every cycle; OVERCLOCK + HOLD'EM ended by the host mid-match — END GAME's path) → the city rebuilt. Read in the room after
three forced collections, on the HOST's phone (the guest's numbers are the same within noise):

| in the room after cycle | 0 | 1 | 5 | 10 | 15 | 20 | 25 | 30 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **PRISM DROP** — JS heap, MB | 34.0 | 39.4 | 43.8 | 46.9 | 47.1 | 48.0 | 48.6 | 49.5 |
| … DOM nodes · listeners | 2,830 · 209 | 3,352 · 231 | 3,278 · 219 | 3,301 · 219 | 3,293 · 218 | 3,293 · 220 | 3,384 · 219 | 3,307 · 218 |
| … canvases alive · their MB | 225 · 61.6 | 525 · 66.4 | 544 · 66.7 | 567 · 67.0 | 559 · 66.9 | 559 · 66.8 | 566 · 66.9 | 573 · 67.0 |
| **OVERCLOCK** — JS heap, MB | 34.7 | 37.9 | 43.4 | 47.1 | 48.6 | 48.3 | 48.7 | 49.5 |
| … DOM nodes · listeners | 2,820 · 208 | 3,116 · 245 | 3,056 · 215 | 3,004 · 221 | 3,032 · 232 | 3,030 · 219 | 3,040 · 213 | 3,065 · 219 |
| … canvases alive · their MB | 215 · 61.5 | 215 · 61.5 | 207 · 61.5 | 207 · 61.5 | 213 · 61.6 | 219 · 61.6 | 213 · 61.5 | 213 · 61.6 |
| **HOLD'EM** — JS heap, MB | 34.2 | 37.3 | 40.5 | 43.4 | 44.6 | 44.4 | 44.7 | 46.4 |
| … DOM nodes · listeners | 2,778 · 209 | 2,965 · 237 | 2,989 · 241 | 2,996 · 246 | 2,974 · 252 | 2,989 · 236 | 3,000 · 244 | 3,117 · 249 |
| … canvases alive · their MB | 215 · 61.5 | 227 · 61.6 | 222 · 61.6 | 226 · 61.7 | 228 · 61.6 | 233 · 61.8 | 238 · 65.2 | 232 · 61.7 |

Each cycle MAKES ~260–310 canvases (the city rebuilt) and every one is collected. **The verdict: no leak.** The
heap's first dozen cycles are caches filling (+10–13 MB, once a page); from cycle 15 on it rises ≤ 0.15 MB a cycle — a game night's 20
matches ≈ 3 MB. The fit.js class of leak (a podium pinning a whole match) would show as + ~330 DOM nodes and + 17 listeners a match: both
flat. One step to know: **PRISM DROP keeps its sprite caches for the page's life** — +330 canvases / +5.3 MB (at 2×) after the first
match, flat after (the static sweep found why: `board.js:296 clearSprites` + `crayon-art.js:490 clearCrayon` have NO caller, `fx.js:5`
`shardCache` no clear; they use raw `getContext`, so the city's memory guard doesn't count them; a new cell size — a rotation, a window
drag — adds a whole set). FR7-B's to weigh (SHOULD-FIX S: clear them in `unmount()`).

**The static sweep** (every module-level Set / Map / WeakRef / observer / interval in what a phone loads) found no per-cycle holder on the
plain path, and these on side paths:
- **SHOULD-FIX · S · READ — the friends list leaks an interval + a detached list on every profile open** (`js/profile/friends-ui.js:172`):
  `setInterval(() => { if (!list.isConnected && list.dataset.seen) { clearInterval(iv); surface.destroy(); } else if (list.isConnected)
  list.dataset.seen = '1'; }, 2000)` — `seen` is only set by a tick while connected; the section repaints (the cached list → the emit →
  the fetch) within 2 s and each repaint detaches the previous list before its first tick, so its interval never ends and pins the list,
  its strips and its surface. Only for a player with ≥ 1 friend; every YOUR CARD open. Fix: mark `seen` in `dress()`, or destroy the old
  lists' surfaces in `paint`.
- NICE · S each — the album's tile surfaces are dropped only by the renderer's frame-counted sweep (`progress/album-view.js:66`); YOUR
  TABLE's `onToday` subscription is never dropped while no daily is live (`friends-ui.js:300–319`); `onUnlock` has no unsubscribe
  (`audio/engine.js:262` — `scene-legend.js:38` registers on every build of a forced-legendary link); bounded-at-one retainers
  (`tapwatch.js:110/159/195` the last pressed control, `settings-panel.js:211 menuExtras`, `chat/ui.js:189 window.__chatLayout`,
  `overclock/view.js:120 window.__oc` never deleted on the emulators); byte-growers with no eviction (`profile/api.js:45` the board cache,
  `queue.js:18`, `chat.js:164 announcedWins`).

### A4. THE CITY OVER 10 AND 25 MINUTES — memory + frame pacing

Five scenes at once, one browser each (402×874 @3, the GPU path, the real app on the emulators, a tap to wake the audio), read every
minute after two forced collections. The five shared ONE GPU, so the pacing column is a floor, not a phone's number:

| scene | JS heap, MB — min 1 → 5 → 10 | canvases' MB — 1 → 10 (alive) | DOM nodes · listeners — 1 → 10 | frames (median · p95 · share over 20 ms) |
| --- | --- | --- | --- | --- |
| night (clear, 9:30 pm) | 34.0 → 35.2 → 36.1 | 77.2 → 73.3 (300 → 357) | 1,751 → 1,808 · 138 → 135 | 16.7 · 17–33 ms · 2–11 % |
| day (clear, 1 pm) | 32.1 → 33.5 → 33.2 | 64.0 → 64.6 (180 → 223) | 1,624 → 1,669 · 135 → 136 | 16.7 · 16.9 · 0.2–0.8 % |
| a party night (Friday 11 pm) | 36.3 → 38.3 → 39.7 | 74.5 → 55.1 (642 → 534) — the tier stepped itself down in minute 2 | 2,032 → 1,987 · 139 → 142 | minute 1: 33.4 (30 fps) · then 16.7 · 17–33 · 4–15 % |
| a legendary (the UFO at once, then the night) | 33.5 → 35.4 → 36.7 | 74.7 → 74.2 (313 → 355) | 1,765 → 1,808 · 136 → 143 | 16.7 · 17–33 · 2–13 % |
| fog (the owner's morning, 8:30 am) | 31.7 → 32.3 → 33.3 | 63.3 → 64.9 (201 → 259) | 1,645 → 1,703 · 135 → 133 | 16.7 · 16.9 · 0.2–0.8 % |

No page error in any of the five. Canvas memory is level (the small cached sprites creep up by 5–9 a minute and are trimmed — the night
fell 369 → 327 in minute 6 — their pixels stay within ±2 MB). The heap rises 0.1–0.35 MB a minute over the first ten, so a second, longer
run followed — the night and the party night alone, 25 minutes each:

| 25 minutes | JS heap, MB — min 1 → 12 → 25 | canvases' MB (alive) | DOM nodes | frames |
| --- | --- | --- | --- | --- |
| night | 33.4 → 36.3 → 37.2 (the last 13 min: +0.07 MB a minute) | 73.1–77.4 (302–382, cycling) | 1,753–1,835, cycling | 60 fps: p95 16.8 ms, 0.1 % over 20 ms, every minute |
| a party night, the TOP tier kept | 38.1 → 38.5 → 40.7 (38.6–41.5 from minute 13: ~+0.15 MB a minute) | 85.4–86.1 (604–682) | 2,055–2,133 | 60 fps: p95 16.8 ms, 0.1–1.9 % |

**The verdict: fine for a session.** Canvases, DOM nodes and listeners live in a band; the heap's rise slows from ~0.25 to ~0.1 MB a
minute and at that rate an hour on the title adds 4–10 MB to a ~35–40 MB heap. It was not followed past 25 minutes — a one-hour run
would settle whether it is truly flat (NICE, S to run). And with only two scenes sharing the GPU the party night held 60
frames a second at the TOP tier: the five-way run's slow frames and its tier step were the five sharing one GPU, not the city.

**The frame's cost** (`title-perf.mjs --city 2`, 402×874 @3, the GPU path — main-thread ms a frame; the absolute budgets are warnings by
design, "the laptop is not the phone"):

| scene | tier 2 at 2× CPU — work (p95) | frames | at 4× CPU: tier 1 · tier 0 |
| --- | --- | --- | --- |
| a plain night | 9.5 ms (11.9) | p95 16.9 ms, 0 % slow | 29.4 · 21.5 ms |
| a plain day | 9.7 (11.2) | 16.8, 0 % | — |
| fog by day | 9.9 (11.6) | 16.8, 0 % | — |
| a legendary (the UFO) | 11.5 (14.1) | 16.8, 0.3 % | — |
| **a party night** | **20.2 (24.8)** | 33.5, 66 % slow — until the tier steps down (the soak: by minute 2) | 58.1 · 32.3 ms |

THE BASELINE GUARD: 3 / 3 — a plain night 1.18×, the forced bus 1.23×, the dog walk 0.98× the Oct 29 baseline (the line is 2×). FR6's
night floor was 10.8 ms on this machine at 2×: no regression. The party night is the one scene whose top tier doesn't fit a 16.7 ms frame once the CPU is
2× slower (20 ms; at 1× it holds 60 fps — the 25-minute run above); a slower phone steps down a tier, as designed. FR6 carried "the party
room's top 3 costs" — NICE, L, unchanged since, not a launch item.

## B. THE CONSOLE's FLOWS

**Exercised on the emulators (2–3 slots):** HOST → JOIN by the link → the two lines; THE GAME START + the walk in; a refresh in a
room and mid-round (`e2e-presence` 12 / 12 — a host refresh: no phone even tries to claim); the sockets in every state (`e2e-conn` clean);
the Harbor suite's room groups — `room, roomfix, gamestart, citypause, afterparty` (the walk out, THE WINNER's BANNER, THE REMATCH VOTE),
`makehost, oneseat` (ONE ACCOUNT ONE ROOM: MOVE HERE · CANCEL), `leaver, hostleave, leaveroom, twotabs, stuckjoin, sheetstack` — **97 / 97**;
the profiles end to end (`e2e-profiles` **142 / 142**: a new player's profile, the seat's pid, a counted match, the key reminder, a fresh
browser restored by THE KEY, a passkey added + SIGN IN WITH … from BRING YOUR CARD, a new key retiring the old, the opt-out, a phone
offline at the podium counted exactly once); FRIENDS + invites + the push on `/api` (`friends.test` **8 / 8**, alone); the dailies' screens
with THE ROOM WINS (`e2e-daily` **51 / 51**: the host's "1 PLAYER IS MID-DAILY", the run held + PAUSED on the server at the game start,
RESUME YOUR DAILY, a room of one can't pause); the smoke (8 / 8 — the three playable games started by a regular host, none of the ten
hidden ones startable). Not driven here: a phone truly locked mid-match and a host's tab truly killed in WebKit (FR6 couldn't either — the
presence suite's host refresh + the rules' beat check stand in), the real Safari keychain, a real push on iOS.

### B1. HE9's B5 — what a HOLD'EM player loses to the host's console powers

- **END GAME** (☰ → End game for everyone: `settings-panel.js:263` → `host.js:270 backToLobby`) writes `game: null`; nothing tells the
  dealer. The views unmount, so the pokes stop (`holdem/view.js:137`); the record freezes unfinished; `settleReport` runs only for an ended
  match (`holdem-store.js:213`) and a phone's own report is refused (`api/report.js#reportableGame`). **Tournament and CASH alike, everyone
  loses everything**: no result, no XP, no streak day, no counted play, no tournament win / KO for the board, no game-night points, no
  banner — and a CASH table never shows its ledger (built only at `close()`, `match.js:234–238`). Chips never outlive a match anyway.
  Left behind: `hrec/{CODE}` (the deck + every card), `hole/{CODE}/{uid}`, the frozen `rooms/{CODE}/holdem` — none is in
  `ALL_PLAYER_NODES` / `ROOM_SIDE_NODES`; the next HOLD'EM start in that room replaces them; if the room closes first they stay until that
  hush word hosts HOLD'EM again (**observed**: after my runs `hrec` + `hole` still held a room that no longer existed). Readable by nobody
  (default deny) — litter, not a leak. Double credit is impossible (the `results/{key}` claim).
- **KICK** (only from the room: the host must QUIT TO THE ROOM first). A TOURNAMENT seat goes AWAY at the dealer's next op and blinds off —
  but it is STILL placed and credited at the end (place, XP, KOs so far: `reportMatch` has no "still in the room" filter —
  `holdem-store.js:299–304`); the kicked player loses the stack and the podium. CASH: the dealer's `leave` folds the hand and banks the
  stack; the net is credited at the session's end.
- **END SESSION** (CASH, host only — and a guest who became host after the old host's 10 s of silence may use it): a normal end — the
  ledger, the podium, credited if ≥ 10 hands + ≥ 5 min, else `short` and nobody is credited.
- **The host leaving**: LEAVE ROOM hands the room on, the seat goes AWAY and is still placed + credited. The last player leaving closes
  the room: nothing credited. **Idle-close** can only hit a HOLD'EM match if every phone sleeps for an hour (the dealer stamps
  `meta/activeAt` once a minute).
- **SHOULD-FIX (the owner's call) · S** — END GAME on a dealer's game should either end it THROUGH the dealer (a tournament past 3 hands
  placed by stack, a CASH ledger paid) or say NO RESULT in its confirm; and `backToLobby` / `closeRoom` should ask the dealer to drop
  `hrec` + `hole`.

### B2. Findings

- **SHOULD-FIX · S · REPRODUCED — a host who QUIT TO THE ROOM can INITIATE a new game over the running match.** `host.js:204`
  (`startGameNow`) checks only `if (!mod || !isHost()) return false` — never `meta.status`; the dock's PLAY (`room-city.js:60–65`) opens the
  games sheet for the host whenever no rematch vote is on. Run with the real taps: a PRISM BATTLE on two phones → the host: Quit to the
  room → PLAY → OVERCLOCK → INITIATE → the guest's match was replaced by OVERCLOCK mid-play; `night/` has NO record of the PRISM match (no
  result, no XP for anyone). The likely real case: a host knocked out early (PRISM's KO, a HOLD'EM bust) who goes back to the room and
  taps PLAY. (HOLD'EM over HOLD'EM alone is refused by the dealer — 409 `running` → COULD NOT START.) Fix: `startGameNow` refuses while
  `status === 'playing'` and the game isn't `final` ("A GAME IS ON — END IT FIRST"), or the host's PLAY becomes WATCH there.
- **SHOULD-FIX · S–M · READ — a host who QUIT TO THE ROOM (or whose HOLD'EM view is gone) stops poking the dealer.** The only poke is in
  the mounted view (`holdem/view.js:136–153`); `holdem/index.js:41 prepare()` is empty; guests poke only 2 s + 0–1 s after `due`
  (`logic.js:103–109`), and the quit host keeps beating so nobody takes over: every timed step (the next deal, a shot clock's fold) lands
  2–3 s late for the rest of the match. Fix: poke from the cartridge's `prepare()` on the host's tick. (HOLD'EM's own — FR7-B may fold
  it in.)
- **SHOULD-FIX · S · REPRODUCED — a SOLO run reported through the snapshot path is a WIN.** `js/core/night.js:46–55 placingsOnly` with
  `p: { me: 0 }` gives `rank 1, win: true`; the room path gives a solo run `{ p: 1 }` only. Run: `night/zz1234 = { g: 'prism', p: { me: 0 },
  at }` + the snapshot report → `counted`, `win: true`, `pstats.g.prism = { p: 1, w: 1 }` — on PRISM → CAREER → WINS. The honest trigger:
  a solo player taps BACK TO THE ROOM before the report is processed (a cold `/api`, no signal at the podium) — the queue then reports by
  snapshot. Fix: `placingsOnly` — one name = no win (and mark it solo so THE SOLO LANE's cap applies).
- **SHOULD-FIX (confirm the intent) · S · READ — solo runs add a PLAYED game with no win**, so they pull WIN RATE down
  (a solo row carries `c: { p: 1 }` → `progress.js:89` adds it unconditionally → `boards.js:137 winRate = w / p`, shown from 10 games). If WIN RATE means room matches,
  a solo run shouldn't add `p`.
- NICE · S each, READ — a CASH late joiner who SITs is credited but never sees the XP box (`app.js:296`, `final.js:40` gate on
  `game.participants`); the MID-DAILY flag isn't rewritten after a leave + rejoin (`daily/room-flag.js:19–21`); an invite's JOIN leaves
  the current room BEFORE knowing the new one is joinable (`profile/invites.js:55–58` — locked / full → in neither; a lone host has
  closed their own room); MOVE HERE mid-match forfeits the match seat without saying so (`seat.js:72–74`); a kicked phone may read
  "YOU WERE DISCONNECTED" (the `players` listener is registered before `kicked` — `room.js:263–271` vs `295–298`; unverified); a HOLD'EM
  CASH session ended before ANY hand was dealt can't reach the podium (`holdem/logic.js:31` no ranks → `p: {}` dropped → the rules'
  `night/$match` wants `p` → the final step refused and retried every 250 ms — narrow: the other player gone before the first deal;
  `host.js:169` should skip the night entry when there are no ranks); the 8-player cap isn't in the rules (`room.js:171` reads then
  writes — two joins racing at 7 make 9, and HOLD'EM's dealer then answers 409 `too_many`: `startGame` should take the first 8).

## C. SECURITY + DATA

**The answers first.** A script with one (or many) signed-in anonymous users **cannot**: read another player's stats, friends, seat, key,
passkeys, gift queue, sealed answers, hole cards, the dealer's record, a daily's board or answers, the schedule, the daily secret, the
boards' raw rows, the radio's nodes; write into a room it isn't the host of (meta, game, night, another player's node or presence, a kick,
a vote, the crew switch, the HOLD'EM table); claim a live host's room; forge another profile onto its seat; delete a live room; grant
itself any item, card, emblem, glow, achievement, sighting, FOUNDER, a gift, a member Nº, a crew or owner role; act for another HOLD'EM
seat; reach an admin action; push a notification to a stranger. Each was walked to its rule or its server check. It **can**: mint XP
without limit (C1, MUST), farm a capped amount of XP + wins by forging room matches (C2), make rooms nobody else can delete and hold every
hush word (C3), list every live room (C4), fill the database (C5).

- **C1 — MUST-FIX** (above).
- **C2 · SHOULD-FIX (the owner's decision) · S–M · READ — after C1 a forged room match is still the one farm without a daily ceiling, and
  XP is now a public board.** A host's script can write a "final" record for itself + one ghost name every 45 s (`api/_lib/stats.js:18
  MIN_MATCH_GAP_MS` is the only brake; the ghost needs no profile and, on the snapshot path, no seat — my honest 2-name control was
  credited as a win: 95 XP): a full 8-name win each time → LEGEND in a few hours, + a career win on `prism-wins` / `overclock-wins` each.
  A host can also re-credit one real match under new match ids (`night/{new}` + `snap`). FR6 accepted this residual when XP wasn't a
  board. `holdem-tw` can't be forged (dealer only) but two anonymous seats can trade ~1 tournament a minute (≥ 3 hands). Fix: a
  per-profile daily ceiling on XP-paying room matches in `matchStep` (as the solo lane has), and a win only when ≥ 2 rows WITH A SEAT AND
  A PROFILE remain.
- **C3 · SHOULD-FIX · S · REPRODUCED — a room nobody else can delete; one script can sit on all 798 hush words.** `database.rules.json:27–29`
  `activeAt: newData.isNumber()` has no upper bound and `:16` doesn't require it; `:12` lets a non-host delete only when `meta/activeAt <
  now − 1 h`. Run: `meta = { hostId: me, status: 'lobby', createdAt: 0, activeAt: 4102444800000 }` → another user's delete REFUSED; the
  stale sweep's query never sees it; the same with NO `activeAt` at all. 798 such writes hold every word: a real host's `createRoom`
  burns its 25 tries, then gets a random non-word code (rooms still work — the hush words don't). Fix (A RULES CHANGE → a re-publish):
  `activeAt` → `newData.isNumber() && newData.val() <= now`, and add `'activeAt'` to `:16`'s `hasChildren` (every client write of it is
  already `serverTimestamp()`).
- **C4 · SHOULD-FIX (the owner's decision before strangers) · M · REPRODUCED — any signed-in user can list the live rooms** (FR6's C6, still
  open, no decision recorded). `database.rules.json:6` accepts any `endAt` (and `startAt` is free): `orderByChild('meta/activeAt'),
  endAt(far future), limitToFirst(25)` returned a stranger's room with its players' names; paged, it is every room — names, profile ids,
  the game — and an unlocked room can simply be joined. Friends testing don't meet this; strangers with a script do. Either accept it in
  writing (the door has a LOCK) or restrict the list to stale rooms (`endAt <= now − 1 h` — all the sweep needs).
- **C5 · SHOULD-FIX (a launch decision) · M · READ — a host's nodes have no size or shape limit, and two `/api` calls read the whole rooms
  tree.** `game` (`:178–180`, no validate), `meta/settings` (`:39–41`), `meta/lm`, `meta/used`, `night/$match` (no `$other`), and a
  player's own `presence/$uid/c/$conn` children are unbounded: one script can fill the free 1 GB (then every write on the site is
  refused) or burn the 10 GB / month of downloads. And `api/admin.js:170` (STATS) + `api/_lib/radio.js:197` (`openRooms`) do
  `val('rooms')` — one fat room slows or breaks /admin's stats and the radio's room list. The real closer is App Check on the database
  (a decision); the cheap part now: those two reads fetch `meta` + `players` per room only, and the rules cap what they can
  (`meta/settings`, `night`'s names ≤ 8 — which also backs C1).
- **C6 · SHOULD-FIX · S · READ — the rude-name filter is bypassed on the two surfaces strangers reach.** `api/_lib/player.js:75` `card: {
  n: p.n, …` — THE BOARD shows a rude username as its HOUSE NICKNAME (`lb.js#publicName`), but tapping that row returns the raw name (the
  filtered `name` on `:70` is used only in the `limited` branch); `api/_lib/friends.js:25 cardOf` returns the raw `n` on an incoming
  REQUEST — a throwaway named anything can `friendAdd { b, bid }` any board row and that player sees the name (30 / h). Fix:
  `publicName(boardId(pid), p.n)` for a viewer who isn't that player or their friend, in both.
- NICE · S each, READ — `friendAdd { b, bid }` hands back the target's profile id + tag digits + member Nº (`friends.js:86`, `:25`) —
  against "a public row never carries them" (nothing privileged follows from a pid); `city2/live` still stores the owner's profile id
  (`api/admin.js:266 by: me`; the node is readable by any signed-in user — FR6's C5 fixed only the cached GET); a 503 from `/api/daily`
  carries an internal error string (`daily.js:148` `cause` → `http.js:57`); `/api/sky` honours `?lat=&lon=` where Vercel sends no geo
  header (`sky.js:23` — the weather achievements' place; cosmetic); the chat lock is client-only (`chat.js:86`; `:1159` has no phase
  check — a script can chat during a locked round); the rules allow a 16-character name (`:116`) against the client's 12; by-design
  refusals reach /admin as "RULES REFUSED … re-publish" (a podium's `s-win` line re-set after a host change — `chat.js:153/206`,
  OVERCLOCK's buzzer, a lost host claim): exempt those shapes in `firebase.js#refused` so a real rules lag stands out.

**The rules as published.** The repo's `database.rules.json` has not changed since `607e1533` (Nov 10, HE2's rows; PFIX-B's the same day).
Nothing in the repo proves what is live: `tests/fixtures/rules-live.json` is still Nov 4's (38 paths behind — `meta/hostId`, `hostBy`,
`players/{uid}/dy`, PFIX-B's `prism` + `prismq`, `ocm`, `ocnext`, `holdem`, `pfr`, `hole`); the unit test is green only through
`rules-live.ack.json`, whose own line says the fixture "still predates" them. HOLD'EM working on real phones (it can't without `hole`)
and the mailbox's line ("Ben re-published the database rules at ~16:10 (they include HE2's HOLD'EM rules + PFIX-B's)") say Nov 10's file is live. **SHOULD-FIX · S**: after confirming in the console, copy the file
over the fixture and delete the ack (so the next rules change is caught again), and move `ocm` / `ocnext` out of `NEW_PLAYER_NODES`. And
**delete or replace the three copies in `Downloads\NEON`** (`database.rules.LATEST.json` is Nov 5's, `…nov8.json`, `database.rules.json`
— all OLDER than the repo): pasting "LATEST" would drop `hole` (no phone could read its cards), `holdem`, `dy`, `pfr` and PFIX-B.

**Secrets.** None found: the whole history (1,203 commits) searched for key blocks, `private_key`, tokens, the pepper, VAPID, the daily
secret, `ADMIN_PIDS` values, `.env` files — nothing but emulator fixtures. No real profile id, tag or email in the docs; the weather's
default is the city centre. **Nothing must be rotated.** What going private can NOT take back (0 forks, 0 stars — but clones are
unknowable): all the code + the rules (by design); `api/_data/pw/answers.json` (THE PASSWORD's 1,402 answers — THE RESEED changes their
ORDER only); `api/_data/oc-reserve/*` (OVERCLOCK's daily reserve + the split's salt, `scripts/oc-pools/lib.mjs:29`); `api/_lib/catalog.js`
+ `lab-text.js` (every "names only to owners" name and how each is earned); the gift cards' source art. **One trap: do NOT rotate the
service-account key unless `KEY_PEPPER` is set in Vercel** — `api/_lib/fb.js:41` derives the pepper from the key when the variable is
missing, and a new key would then break every restore key and every board id.

## D. THE FREE PLANS

(M = measured by a command or in a browser · E = estimated; the yardstick: ~20 friends on a Friday + a normal week. The limits as
read on Nov 11: Vercel's Hobby + limits pages, Firebase's Realtime Database limits + pricing pages, GitHub's Actions billing docs.)

| resource | the limit | a visit | a game night (20 phones, 3 h) | a month (4 Fridays + 20 people daily) | of the limit |
| --- | --- | --- | --- | --- | --- |
| **GitHub Actions, once PRIVATE** | 2,000 min / month | — | — | ~17,000 at this week's pace (M: 125 + 11 a pass) | **~870 %** → D1 |
| **Vercel edge requests** | 1,000,000 / month | **473** cold (M) · **~350** warm — 328 through the service worker (M, live) | ~50,000 (E) | ~615,000 (E) | **~61 %** |
| Vercel data transfer | 100 GB / month | 8–11 MB fresh (E) | 2.5–3.3 GB (E) | ~15 GB (E) | ~15 % |
| Vercel function invocations | 1,000,000 / month | ~12 at boot, ~75 for both dailies (E) | 7–12,000 (E — HOLD'EM ≈ 18 calls a hand) | ~90,000 (E) | ~9 % |
| Vercel deploy size × deploys | the owner's 10 GB of deployment storage | — | — | **299 MiB a deploy** (M: 1,607 files, audio 274 MiB) × ~10 tagged pushes a day (M) | check retention |
| Vercel functions | 12 a deployment | — | — | 8 (M) | 67 % |
| Firebase simultaneous connections | 100 | 0 parked · 1 in a room (M, `e2e-conn`) | 20 phones + /admin + ~6–12 warm function instances (E) | the same peak | ~30–35 % |
| Firebase download | 10 GB / month | ~0 | 0.15–0.25 GB (E) | ~1 GB (E) | ~10 % |
| Firebase stored | 1 GB | — | — | not visible from here (the console) | — |
| GitHub repo size | 1 GB recommended | — | — | **570 MB** (M, GitHub) · +~20 MB a day lately | 57 % — the line in ~3 weeks |

**THE TIGHTEST NUMBER: the Actions minutes after the flip (D1, MUST).** The second: **edge requests.**

- **D2 · SHOULD-FIX · M — FR6's E1 never landed: every repeat visit re-requests every file.** `sw.js:51` `fetch(req, { cache: 'no-cache'
  })`; `vercel.json` has header rules only for the manifest, `sw.js`, `/audio`, `/data`, `/admin` — `/js`, `/css`, `/assets` answer
  `max-age=0, must-revalidate`. **MEASURED on the live site** (read-only, warm): 333 requests before the reveal, **328 of them the
  service worker's own network fetches**. A 304 is still a counted request. Fix (FR6's own): a `/js` + `/css` + `/assets` header
  (`max-age=300, stale-while-revalidate=86400`), the worker on the default cache mode, busted by the build id `/api/time` already returns
  → a repeat visit ~30–60 requests, the month ~25 %. The trade: ≤ 5 min of an older file after a deploy (THE SKEW WRAPPER already
  handles a mixed graph).
- **D3 · SHOULD-FIX · S — ~10 deployments a day at 299 MiB each** against the storage line the owner already hit once: confirm Vercel →
  Settings → Deployment Retention prunes old ones (it isn't visible from here). CLAUDE.md's "≈ 264 MB" is stale. An option that takes
  22 % off every deploy: the ten frozen games' songs (67 MB) into `.vercelignore` — only after checking none is in a live playlist.
- **D4 · SHOULD-FIX · S/M — the repo grows ~20 MB a day** (pack 450 MiB + 146 MiB loose, no gc; since FR6: `docs/harbor` pass
  screenshots 118 MB, art 39 MB, the day songs 13 MB): 1 GB in about three weeks. Fix: `git gc`; pass screenshots as JPEG at 1× or kept
  out of git; a history rewrite fits naturally at the private flip (0 forks). FR6's E5 (a music bucket) is still undecided.
- NICE · S each, READ — each warm function instance holds its own database connection (`api/_lib/fb.js:46`, no `goOffline`): the real
  ceiling is ~88–94 phones, not 100 (Firebase console → Usage → peak connections after a Friday settles it); at the 101st connection HOST
  would spin with no message (`title-dock.js:373–374` times out only `firebaseReady`; `room.js:88`'s transaction waits) — race it against
  20 s with a "full tonight" line; the results queue retries a 425 every 2 s for up to 5 h (`profile/queue.js:79` — back off to 60 s);
  `radioWho` is asked on every boot by every non-crew phone (`radio-gate.js:24–25` caches only a yes).
- Fine: FR6's E2 (the previous song skipped, decoded buffers kept), E3 (3 `/api/time` samples), E4 (`/shots*/` ignored) landed; `live=1`
  is edge-cached 15 s, the board 20 / 120 s; audio is cached 7 days and never through the worker; the room is mirrored per child, never
  at its root; HOLD'EM added ~1.2 MB and no music.

## E. THE LAUNCH

**THE LEVEL 1 RESET has a safe server path already: /admin → PROGRESS RESET** (`api/admin.js:404` → `api/_lib/reset.js:40 progressReset`;
the rules PURE in `js/core/reset.js`): a dry-run preview, type RESET, a backup to `backups/{stamp}` (restorable), then the reset — built
Nov 4 as a tool he can run again. It RESETS `pstats`: `xp, xw, dp, g, gw, wk, b, day, gd, pa, ac, dl, st` (XP, this week, daily points, mastery + counters,
records, the weekly goal, achievements + their progress, the dailies' counters, the streak + win-back) and `profiles`: `x, l, r, s, sd,
m`; removes all of `lb/`, `pcount/n`, `pcount/a`. It KEEPS every item (`it` — cards, emblems, glows, finishes, the dev + gift 1-of-1s,
FOUNDING MEMBER), favors, the counted-match keys (`m{}` — an old match can never count again), MEMBER Nºs, names + tags + the equipped
look, friends, passkeys + keys, the gift queue, `results/`, `dly/`. Checked FINE: a re-climb never re-grants a level reward; no
achievement reads kept state; equip checks ownership, never level (a LEVEL 1 player keeps wearing a level-40 reward — the owner's rule).
It predates PD-3, the dailies going live and THE HOLD'EM BOARD — hence:

- **E1 — MUST-FIX** (above): the back-fill has no reset epoch.
- **E2 · SHOULD-FIX · S · REPRODUCED — the freezes a player holds are lost at their first play after the reset.** The reset keeps
  `st = { f }` ("a freeze is a reward" — `js/core/reset.js:22–23`, asserted by its test); `js/core/streak.js:66–70` treats a streak with
  no `d` as brand new: `{ n: 1, …, f: 0 }`. Run: `streakPlay({ f: 2 }, day)` → `f: 0`. Fix: carry `st0.f` (capped at the hold limit) in
  that branch.
- **E3 · SHOULD-FIX · S · READ — the reset's founder sweep ignores a closed window.** `api/_lib/reset.js:53` calls `founderSweep(now)`
  unconditionally (`founder.js:21` has no `founderOpen` check): close FOUNDING MEMBER, let strangers play, run any later reset → every
  one of them gets the card. Fix: sweep only while the window is open. (And while it IS open any first counted match grants it — close
  it BEFORE announcing.)
- **E4 · the owner's decision · S — counted plays survive the reset.** `RESET_STATS` has no `cp` although the profile's `m` goes to 0 "for
  the boards' 3-match floor": a veteran is listed again at their first play. Either add `cp` or say veterans stay listed; a test either
  way.
- NICE — item X% reads too high after a reset (`pcount/n` cleared, `pcount/i` kept — FOUNDER shows ~100 % until `n` regrows); a mid-day
  reset wipes today's sweep for a half-done day: press it just after 4 am Eastern with no room live.
- **/board's link preview** — `assets/og-board.jpg` is still Oct 18's OLD board (the bar, HALL OF FAME, three "???" rows): re-shoot it
  from the velvet board and bump `?v=1` in `board.html:16` + `:23`. Both pages' `og:image` point at the bare domain (a 308 to www).
- **Going private** — beyond D1: the site, `/api`, `sw.js` and the scripts load NOTHING from the repo (no raw.githubusercontent, no
  jsDelivr, no Pages; the credits link to third parties only) — nothing on the site breaks. THE RESEED is server-side and needs no key
  on the PC. Vercel Hobby deploys a private repo of a personal account, but its Git integration checks that every deploy's COMMIT AUTHOR has
  access to the project ("Hobby does not support collaboration for private repositories" — a wall of community threads about blocked
  deploys). The author on every commit here is the owner's own identity, so it should pass; **one thing to prove at once**: 1,183 of
  1,203 commits also carry a Co-Authored-By trailer, and whether a co-author trips that check is not confirmed either way (searched
  Nov 12) — push one deploy-tagged commit right after the flip and watch it build before anything else. A private Free repo
  also loses secret scanning + push protection (`.gitignore` becomes the only guard). GitHub's announced per-minute fee for self-hosted
  runners on private repos ($0.002, March 2026) was postponed and had not taken effect by mid-2026 — check the billing page.

## F. CODE HEALTH + TESTS

- **SHOULD-FIX · S · REPRODUCED — the one-game smoke check CLAUDE.md prescribes starts no game and passes.** `e2e-smoke.mjs:24–29`:
  `ALL_GAMES` = overclock / prism / holdem, filtered by `GAMES=`; CLAUDE.md (`:598`, `:630`) says `GAMES=cipher`. Run: "checks 5/5
  passed", exit 0, nothing started. A City pass that touches a shared file "proves" a game still starts with zero games started. Fix:
  exit non-zero on an empty filter; the docs say `GAMES=overclock`.
- **SHOULD-FIX · M · READ — the cloud never runs four `/api` suites of what is live.** `tests.yml:72–79` runs rules, server,
  progression, sightings, lab, vault-2b, vault-2c, daily-module — not `holdem-server.test.mjs` (the dealer + THE LEAK SCAN of a playable
  game), `password.test.mjs`, `coastclear.test.mjs` (both dailies live) or `friends.test.mjs`. One `emulators:exec` step each.
- **SHOULD-FIX · S · READ — the `crew` group's room-push red across shards.** The push switch + subscriptions are global nodes on the ONE
  emulator database the four shards share (`radio/push/on`, `radio/push/subs`); between this test's `sub` and `unsub` any room another
  shard opens through the real `createRoom` → `roomPushLater` is pushed to its receiver too, and the check is positional
  (`harbor-e2e/radio.mjs:567` `got[1]`, `:569` `got.length === 2`). Local-only (cloud jobs are separate machines). Fix: pick the push by
  its room code, or `crew` into `SERIAL`.
- **SHOULD-FIX · S each · READ** — `e2e-holdem` FAST expects `rep === 'done'` (`:381`) but HE10 made a tournament count only from 3 hands
  (`holdem-dealer.js:33`): a 1–2-hand shove-out is `short` → red ("the bots' luck" in the logs); `e2e-profiles` goes falsely red after
  `server.test` (`:461` takes the first other board row, `:467` expects BOB — pick the row by name); `roomperf` + the sightings' capture
  hitch are hard timing checks inside the parallel shards (red under the 4-shard load in four pass logs, green alone) → `SERIAL`; nothing
  local catches a unit test that reaches `firebase-admin` (the cloud's unit job has none — it cost HOLD'EM IN THE CITY a second cloud
  run): a unit test that walks `tests/*.test.mjs`' imports. Two more met while running the suites (**REPRODUCED**): `e2e-profiles` with its
  documented `SHOTS=0` dies at check 62 — `:319` clicks SIGN IN WITH … while BRING YOUR CARD is still sliding in ("not clickable"; with the
  screenshots on, 142 / 142: wait for the sheet to settle before the click); `friends.test`'s CREW INTERCOM case goes red whenever ANY page
  is open on the same emulators — the title's cached `GET /api/admin?live=1` poll runs `icList(real now)`, which prunes the test's clip
  (made on the test's own Nov 8 clock): 8 / 8 alone, 7 / 8 beside a browser (give the test's clips the real clock, or keep the prune out
  of the public read).
- **SHOULD-FIX · S · READ — the local `vault` group signs in on the PRODUCTION Firebase project.** `harbor-e2e/vault.mjs:417` opens
  `${BASE}/?when=…&force=ufo&lgnow=1` with no `?emu` in Playwright (the puppeteer patch doesn't cover it): `identity.js:25–31` then leaves
  the emulators off and that localhost page signs in anonymously on the real project — three contexts a run (no profile, no room: an
  anonymous auth user each). `vault.mjs:257` + `shots.mjs:186 --wk` call `goto` on `E2E_BASE` without `guardUrl`. Fix: `?emu&slot=…`
  there, `guardUrl` on those, and `tests/live-guard.test.mjs` extended to the Playwright launchers.
- **SHOULD-FIX · S–M — the docs' stale lines** (your B7; each would mislead the next pass):

  | the doc says | the code says |
  | --- | --- |
  | CLAUDE.md `:27`, `:432` "the 33 achievements" (progression.md: 32 and 33) | 41 rows in `api/_lib/catalog.js` |
  | CLAUDE.md `:416` "icons + og.png" (testing.md:85, audio.md, title.md too) | `assets/og.jpg` (its own `:305` says og.png is gone) |
  | CLAUDE.md `:431` `js/progress/ … flame.js` | `flame-art.js` (+ album-view, extras, sighting, trophies unlisted) |
  | CLAUDE.md `:433` `js/board/scene.js` "the bar (Canvas 2D)" | nothing shipped imports it since BOARD 2.0 B |
  | CLAUDE.md `:556` `glitchFlash()` | exported nowhere; `.glitch-flash` is dead CSS |
  | CLAUDE.md `:577–579` "Adding a game": "what registry.js lists … `css/<id>.css` + `<link>` in index.html" | THE CONTRACT: `meta.js`, the `META` + `LOADERS` rows, `gameSheets()` (no `<link>` — it would ride every boot), `build-preload-graph.mjs`, the smoke row |
  | CLAUDE.md `:598` "THE FULL HARBOR SUITE ≈ 20 min … ~800 checks"; "≈ 95–105 billed cloud minutes a pass"; "a deploy ≈ 264 MB" | 1,262 checks / ~33 min; 136 billed; 299 MiB |
  | CLAUDE.md `:598`, `:630` smoke `GAMES=cipher` | starts nothing (above) |
  | CLAUDE.md `:35` (the holdem.md row) "`playable: false` + `preview`" | `playable: true, sign: true` |
  | docs/testing.md `:3–4` "only PRISM DROP + OVERCLOCK"; `config.js:63`, `e2e-smoke.mjs:22` the same | three (+ HOLD'EM) |
  | ROADMAP.md `:8`, `:13`, `:15` "twelve games", "four Vercel serverless functions", "all twelve are playable" | 13 games, 3 playable, 8 functions, 2 dailies |
  | docs/profiles.md `:10` four functions | 8 (its own `:437` says 8) |
  | docs/cartridge.md `:46` "QUIT TO LOBBY"; `:171` "`daily: { on }` (`META_KEYS`)"; `:178` "1,770 KB / 109 modules" | QUIT TO THE ROOM; not in `META_KEYS`; 1,906 KB / 117 |

  The counts that are RIGHT: 13 games, 3 playable, THE FIVE SIGNS (stakes · prism · overclock · golf · holdem), 2 dailies, 8 functions,
  100 levels, 12 sign-up emblems, OVERCLOCK 18 + DUMB LUCK, THE BOARD's 5 tabs, the harbor's 15 jobs.
- NICE · M — dead bytes every phone loads at boot: ~40 KB of the ten frozen games in `ui/game-art.js` (23.6 KB), `ui/help.js` (~13 KB),
  `core/marks.js`; `debug-strip.js` + `debug-tools.js` (11.8 KB); ~9 KB dead in `css/card.css`, ~7 KB in `css/board.css`; orphans nothing
  imports: `js/board/scene.js` (12.9 KB), `js/vault/picker.js` (7.9 KB). None blocks the first paint; all ride the preload (304 of 310
  modules). `tests/harbor.test.mjs:1038` ends `… || true` and cannot fail.
- **FR6's follow-through** — none regressed. FIXED and still fixed: C1 (`profiles.js:215–228 ownsAnything`), C2 (`me.js:116–118`
  `oldKeys`), C3, C4 (the push's limits), C8, B1–B4 + B7, A2, A3, E2, E3, E4, G1, G3–G5, G8, H1, H2, H5, H8, H11, H12, D1–D3, D6, D8.
  OPEN: E1 (→ D2), C6 (→ C4), G6's fixture (→ C, the rules as published), G7's holes (→ the vault line above), C5's stored pid, E5 (the
  music bucket — no decision; the repo is at 570 MB of the 700 MB FR6 named), E7's 425 retry, D5 (no registration checker for a new
  game), B1's residual (a sighting reveal in progress survives `closeAll` — `progress/sighting.js:270`), and the small seams H4, H6, H7,
  H9, H10, F4 (desktop — parked with the desktop look).

## What was checked and found FINE (FR7 FIXES needn't re-check)

- **The boot**: the budget (338 / 360 requests, 2,695 / 2,900 KB), no audio before a tap, the reveal's times vs LOAD FIX 2–5, the
  watchdog + the rejoin limit by their groups' last green run; Grok's #2 measured (leave it).
- **Memory**: 30 cycles × 3 games (above); `e2e-conn` (0 / 1 / 0 sockets; /board + /admin 0); ten minutes × five scenes with no page error, the canvases level (above).
- **Flows**: join by code / link / a locked door / a full room / a kicked player; one start at a time; a dead start cleared; `closeAll` at the
  stamp; the beat-only host claim; MAKE HOST (room only); the night record atomic with `final`; a leaver's vote ignored; the results
  queue idempotent; a stale seat heals (taken over when its room is gone, else MOVE HERE); the key never overwritten (the old ones kept);
  invites never during a match; THE ROOM WINS (the 2+ party checked by the server) — each by its suite's green run above and by reading.
- **Security**: every cross-player read refused (chats, seal, hole, hrec, fleets, pstats, pfr, seats, uids, ppriv, lb, results, dsched,
  dsecret, dly, gifts, radio); every write into another's room refused; the host-claim rule (the beat alone during a game); forged `pid`
  refused; `seats/{other}` refused; no item / card / gift / member Nº / role is client-grantable; gifts behind the admin gate + a
  transaction; passkeys (single-use challenges, RP ID + origin from the stored challenge, user verification on both sides, the restore
  key's limits shared); the restore key (60 bits, HMAC with the pepper, 10 / h a user + 40 / h an IP); HOLD'EM (the caller's own seat
  only, results only from the dealer, short matches credit nothing); the dailies (answers + boards only in the server's record, the score
  from the record, the throwaway gate from a server-written date); the push (only the four push services over https, invites only to
  accepted friends, the room push 1 / h a user + 10 / h in all); no CORS, method checks on all 8, a 5xx says "server error"; every
  emulator-only switch behind `emulated()`; the debug hooks (`?emu` localhost only; `&test=1`, `&force=`, `&debug=1`, `window.__*` give a
  stranger nothing — results, sightings and the dealer are server-checked).
- **The live site** (read-only): `/api/_data/*`, `/api/_lib/*`, `database.rules.json`, `package.json`, docs, tests, scripts → 404.
- **The rules' health**: no parent grant defeats a stricter child; nothing exploitable skips a `.validate` by a delete; every query has
  its index; every node the host clears has its delete row; PRISM's saved fields match the rules row for row.
- **The reset**: level rewards never duplicate, no achievement reads kept state, old matches can't be re-counted, a phone's cached
  profile refreshes at boot, the board's cached copy is stale ≤ ~80 s.
- **Code**: no City 1.0 code left; the frozen games' logic is not in the boot graph and no game sheet is linked in `index.html`; the
  service worker (network-first, same-origin static only, never `/api` or `/audio`, the push handlers) read in full.

## A suggested order for FR7 FIXES (this half)

1. **C1** (the cap + its server test) — first, alone, a deploy-tagged push: it is the only finding a stranger can use today.
2. **THE LAUNCH's code**: E1 (the reset epoch), E2 (the freeze carry), E3 (the founder sweep), E4's decision; the og image.
3. **The rules pass** (ONE re-publish): C3 (`activeAt`), C5's caps, C4's decision; then the fixture synced + the ack deleted.
4. **The console**: B2's INITIATE guard, the solo snapshot, the poke from `prepare()`, B5's END GAME; C6 (the names).
5. **D2** (the edge requests) — its own short group; D3 / D4 (retention, `git gc`).
6. **The tests + the docs**: the smoke filter, the four cloud suites, `crew`, the FAST `short`, the vault's `?emu`, the docs' table.
7. **D1** rides THE LAUNCH (below), not FR7 FIXES — but its workflow rewrite can be proven while the repo is still public.

## THE LAUNCH CHECKLIST

1. **FR7 FIXES lands first** — at least C1, E1, E2, E3 (+ E4's decision), the rules pass (re-published), the og image.
2. **The runner, while still public**: install the Actions runner on the beelink as its own standard Windows user; rewrite `tests.yml` +
   `harbor.yml` for it (no `sudo sysctl`, no `/usr/bin/google-chrome`, the `emulators:exec` shell as a node script, the harbor matrix →
   one job at `SHARDS=4`, `permissions: contents: read`, no `pull_request` trigger on the runner); prove ONE green run of each.
3. **Confirm in Vercel**: `KEY_PEPPER` IS set (if it isn't, never rotate the service-account key); Deployment Retention prunes old
   deployments; the primary domain (www vs bare — Grok's #9).
4. **THE HOLD'EM BACK-FILL**: tap it NOW (/admin → THE BOARDS) or decide to skip it — **never after step 6** (until E1's epoch is live).
5. **Clean up**: remove test players / throwaway profiles; delete the old rules copies in `Downloads\NEON`; sync
   `tests/fixtures/rules-live.json` to the published file.
6. **THE LAUNCH RESET** — just after 4 am Eastern, no room live: /admin → PROGRESS RESET → PREVIEW (read the line) → type RESET. Note the
   backup stamp it prints (RESTORE takes it back).
7. **Close FOUNDING MEMBER** (/admin → THE LEDGER) — before anyone is told.
8. **Flip the repo to PRIVATE.** At once: push one deploy-tagged commit and watch Vercel build it (the co-author question); watch the
   first self-hosted run go green.
9. **THE RESEED**: /admin → THE DAILIES → RESEED → PREVIEW, then RESEED NOW (fresh answers from the next 4 am). Before OVERCLOCK's daily
   is ever switched on: change the reserve's salt + rebuild (its picks were public).
10. **The preview + the watch**: `/board`'s re-shot image live (paste the link in Messages to see it), Vercel Web Analytics on, and the
    five numbers to look at weekly — Vercel → Usage → Edge Requests · Fast Data Transfer; Firebase → Realtime Database → Usage → peak
    connections · downloads · stored; GitHub → Billing → Actions minutes.
11. **Tell people.**
